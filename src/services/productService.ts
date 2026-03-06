// Product Service for DukandaR
import { Product, ProductCategory, ProductWithShop } from '@models/Product';
import { DemandAlert, Shop } from '@models/Shop';
import { formatDistance, isShopOpen } from '@utils/formatters';
import {
    addDoc,
    collection,
    doc,
    limit as firestoreLimit,
    getDoc,
    getDocs,
    increment,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where,
    writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { getShopsNearby } from './shopService';

const PRODUCTS_COLLECTION = 'products';
const SEARCHES_COLLECTION = 'searches';

/**
 * Search for products nearby
 * @param queryText Search query
 * @param lat User latitude
 * @param lng User longitude
 * @param radiusKm Search radius
 * @returns Array of products with shop info
 */
export async function searchProductsNearby(
  queryText: string,
  lat: number,
  lng: number,
  radiusKm: number = 2
): Promise<ProductWithShop[]> {
  try {
    // Step 1: Get nearby shops
    const nearbyShops = await getShopsNearby(lat, lng, radiusKm);
    if (nearbyShops.length === 0) {
      return [];
    }

    // Build shop map with distance
    const shopMap = new Map<string, Shop & { distance: number }>();
    nearbyShops.forEach((shop: any) => {
      shopMap.set(shop.id, shop);
    });

    // Step 2: Get products from those shops
    const shopIds = nearbyShops.map((shop) => shop.id);
    const allProducts: ProductWithShop[] = [];

    // Query products for each shop (Firestore limit on 'in' queries is 30)
    const chunks = chunkArray(shopIds, 30);

    for (const chunk of chunks) {
      const q = query(
        collection(db, PRODUCTS_COLLECTION),
        where('shopId', 'in', chunk),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      snapshot.forEach((doc) => {
        const product = { id: doc.id, ...doc.data() } as Product;
        const shop = shopMap.get(product.shopId);

        if (shop) {
          // Client-side filtering for product name match
          const lowerQuery = queryText.toLowerCase();
          const lowerName = product.name.toLowerCase();
          const lowerNameUrdu = product.nameUrdu?.toLowerCase() || '';

          if (lowerName.includes(lowerQuery) || lowerNameUrdu.includes(lowerQuery)) {
            allProducts.push({
              ...product,
              shop: {
                ...shop,
                distanceKm: shop.distance || 0,
                distanceLabel: formatDistance(shop.distance || 0),
                isCurrentlyOpen: isShopOpen(shop.hours, shop.isOpen),
              },
              isCheapestNearby: false,
              isNearestWithStock: false,
            });
          }
        }
      });
    }

    // Step 3: Calculate cheapest and nearest flags
    if (allProducts.length > 0) {
      const inStockProducts = allProducts.filter((p) => p.inStock);

      // Find cheapest
      if (inStockProducts.length > 0) {
        const minPrice = Math.min(...inStockProducts.map((p) => p.price));
        inStockProducts.forEach((p) => {
          if (p.price === minPrice) {
            p.isCheapestNearby = true;
          }
        });

        // Find nearest with stock
        const minDistance = Math.min(...inStockProducts.map((p) => p.shop.distanceKm));
        inStockProducts.forEach((p) => {
          if (p.shop.distanceKm === minDistance) {
            p.isNearestWithStock = true;
          }
        });
      }
    }

    // Step 4: Sort by distance
    allProducts.sort((a, b) => a.shop.distanceKm - b.shop.distanceKm);

    // Step 5: Record search
    await recordSearch(queryText, lat, lng, shopIds);

    return allProducts;
  } catch (error) {
    console.error('Search products nearby error:', error);
    throw error;
  }
}

/**
 * Get all products for a shop
 * @param shopId Shop ID
 * @returns Array of products
 */
export async function getProductsByShop(shopId: string): Promise<Product[]> {
  try {
    const q = query(
      collection(db, PRODUCTS_COLLECTION),
      where('shopId', '==', shopId),
      where('isActive', '==', true)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product));
  } catch (error) {
    console.error('Get products by shop error:', error);
    throw error;
  }
}

/**
 * Get all products for owner management (includes inactive products)
 * @param shopId Shop ID
 */
export async function getProductsByShopForOwner(shopId: string): Promise<Product[]> {
  try {
    const q = query(
      collection(db, PRODUCTS_COLLECTION),
      where('shopId', '==', shopId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product));
  } catch (error) {
    console.error('Get owner products by shop error:', error);
    throw error;
  }
}

/**
 * Get products by category for a shop
 * @param shopId Shop ID
 * @param category Product category
 * @returns Array of products
 */
export async function getProductsByCategory(
  shopId: string,
  category: ProductCategory
): Promise<Product[]> {
  try {
    const q = query(
      collection(db, PRODUCTS_COLLECTION),
      where('shopId', '==', shopId),
      where('category', '==', category),
      where('isActive', '==', true)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product));
  } catch (error) {
    console.error('Get products by category error:', error);
    throw error;
  }
}

/**
 * Add a single product
 * @param shopId Shop ID
 * @param product Product data
 * @returns New product ID
 */
export async function addProduct(
  shopId: string,
  product: Omit<
    Product,
    'id' | 'shopId' | 'createdAt' | 'updatedAt' | 'flagCount' | 'searchCount'
  >
): Promise<string> {
  try {
    const newProduct = {
      ...product,
      shopId,
      flagCount: 0,
      searchCount: 0,
      stockStatus: product.inStock ? 'in_stock' : 'out_of_stock',
      stockVerifiedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), newProduct);
    return docRef.id;
  } catch (error) {
    console.error('Add product error:', error);
    throw error;
  }
}

/**
 * Bulk add products (for catalog builder)
 * @param shopId Shop ID
 * @param products Array of products
 */
export async function bulkAddProducts(
  shopId: string,
  products: Array<
    Omit<
      Product,
      'id' | 'shopId' | 'createdAt' | 'updatedAt' | 'flagCount' | 'searchCount'
    >
  >
): Promise<void> {
  try {
    // Firestore batch limit is 500
    const chunks = chunkArray(products, 500);

    for (const chunk of chunks) {
      const batch = writeBatch(db);

      chunk.forEach((product) => {
        const productRef = doc(collection(db, PRODUCTS_COLLECTION));
        batch.set(productRef, {
          ...product,
          shopId,
          flagCount: 0,
          searchCount: 0,
          stockStatus: product.inStock ? 'in_stock' : 'out_of_stock',
          stockVerifiedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();
    }
  } catch (error) {
    console.error('Bulk add products error:', error);
    throw error;
  }
}

/**
 * Update product price
 * @param shopId Shop ID
 * @param productId Product ID
 * @param price New price
 */
export async function updateProductPrice(
  shopId: string,
  productId: string,
  price: number
): Promise<void> {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    await updateDoc(productRef, {
      price,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Update product price error:', error);
    throw error;
  }
}

/**
 * Update editable product fields from owner panel
 */
export async function updateProductDetails(
  shopId: string,
  productId: string,
  updates: {
    name: string;
    price: number;
    inStock: boolean;
    isActive: boolean;
  }
): Promise<void> {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    await updateDoc(productRef, {
      name: updates.name,
      price: updates.price,
      inStock: updates.inStock,
      isActive: updates.isActive,
      stockStatus: updates.inStock ? 'in_stock' : 'out_of_stock',
      stockVerifiedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Update product details error:', error);
    throw error;
  }
}

/**
 * Toggle product stock status
 * @param shopId Shop ID
 * @param productId Product ID
 * @param inStock New stock status
 */
export async function toggleProductStock(
  shopId: string,
  productId: string,
  inStock: boolean
): Promise<void> {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    await updateDoc(productRef, {
      inStock,
      stockStatus: inStock ? 'in_stock' : 'out_of_stock',
      stockVerifiedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Toggle product stock error:', error);
    throw error;
  }
}

/**
 * Flag product as out of stock (by customer)
 * @param shopId Shop ID
 * @param productId Product ID
 * @param userId User ID
 */
export async function flagProductOutOfStock(
  shopId: string,
  productId: string,
  userId: string
): Promise<void> {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      throw new Error('Product not found');
    }

    const flagCount = (productSnap.data().flagCount || 0) + 1;
    const updates: any = {
      flagCount: increment(1),
      updatedAt: serverTimestamp(),
    };

    // If 3 or more flags, mark as unverified
    if (flagCount >= 3) {
      updates.stockStatus = 'unverified';
    }

    await updateDoc(productRef, updates);
  } catch (error) {
    console.error('Flag product out of stock error:', error);
    throw error;
  }
}

/**
 * Confirm product stock (by owner)
 * @param shopId Shop ID
 * @param productId Product ID
 * @param inStock Stock status
 */
export async function confirmProductStock(
  shopId: string,
  productId: string,
  inStock: boolean
): Promise<void> {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    await updateDoc(productRef, {
      inStock,
      stockStatus: inStock ? 'in_stock' : 'out_of_stock',
      stockVerifiedAt: serverTimestamp(),
      flagCount: 0,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Confirm product stock error:', error);
    throw error;
  }
}

/**
 * Record a search for demand tracking
 * @param queryText Search query
 * @param lat User latitude
 * @param lng User longitude
 * @param nearbyShopIds Shop IDs near the user
 */
export async function recordSearch(
  queryText: string,
  lat: number,
  lng: number,
  nearbyShopIds: string[]
): Promise<void> {
  try {
    await addDoc(collection(db, SEARCHES_COLLECTION), {
      query: queryText.toLowerCase(),
      lat,
      lng,
      nearbyShopIds,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Record search error:', error);
    // Don't throw - search tracking is not critical
  }
}

/**
 * Get demand alerts for a shop owner
 * @param shopId Shop ID
 * @returns Array of demand alerts
 */
export async function getDemandAlerts(shopId: string): Promise<DemandAlert[]> {
  try {
    // Get recent searches where this shop was nearby
    // Note: removed orderBy to avoid requiring composite index
    const q = query(
      collection(db, SEARCHES_COLLECTION),
      where('nearbyShopIds', 'array-contains', shopId),
      firestoreLimit(500) // Get more to account for duplicates
    );

    const snapshot = await getDocs(q);

    // Group by product name and count
    const searchCounts = new Map<string, { count: number; lastSearch: Timestamp }>();

    snapshot.forEach((doc) => {
      const data = doc.data();
      const query = data.query;
      const existing = searchCounts.get(query);

      if (existing) {
        searchCounts.set(query, {
          count: existing.count + 1,
          lastSearch: data.timestamp,
        });
      } else {
        searchCounts.set(query, {
          count: 1,
          lastSearch: data.timestamp,
        });
      }
    });

    // Convert to DemandAlert array and sort by count
    const alerts: DemandAlert[] = Array.from(searchCounts.entries())
      .map(([productName, data]) => ({
        productName,
        searchCount: data.count,
        message: `${data.count} log "${productName}" dhundh rahe hain`,
        lastSearchedAt: data.lastSearch,
      }))
      .sort((a, b) => b.searchCount - a.searchCount)
      .slice(0, 5); // Top 5

    return alerts;
  } catch (error) {
    console.error('Get demand alerts error:', error);
    throw error;
  }
}

/**
 * Helper: Split array into chunks
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
