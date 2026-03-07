// Deal Service for DukandaR
import { Deal } from '@models/Deal';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    where,
} from 'firebase/firestore';
import { db } from './firebase';
import { getShopsNearby } from './shopService';

const DEALS_COLLECTION = 'deals';

/**
 * Get active deals for a shop
 * @param shopId Shop ID
 * @returns Array of active deals
 */
export async function getActiveDeals(shopId: string): Promise<Deal[]> {
  try {
    const now = Timestamp.now();
    const q = query(
      collection(db, DEALS_COLLECTION),
      where('shopId', '==', shopId),
      where('isActive', '==', true),
      where('expiresAt', '>', now),
      orderBy('expiresAt', 'asc'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Deal));
  } catch (error) {
    console.error('Get active deals error:', error);
    throw error;
  }
}

/**
 * Get deals from nearby shops
 * @param lat User latitude
 * @param lng User longitude
 * @param radiusKm Search radius
 * @returns Array of deals
 */
export async function getDealsNearby(
  lat: number,
  lng: number,
  radiusKm: number
): Promise<Deal[]> {
  try {
    // Get nearby shop IDs
    const nearbyShops = await getShopsNearby(lat, lng, radiusKm);
    if (nearbyShops.length === 0) {
      return [];
    }

    const shopIds = nearbyShops.map((shop) => shop.id);
    const allDeals: Deal[] = [];
    const now = Timestamp.now();

    // Query deals for shops (Firestore 'in' limit is 30)
    const chunks = chunkArray(shopIds, 30);

    for (const chunk of chunks) {
      const q = query(
        collection(db, DEALS_COLLECTION),
        where('shopId', 'in', chunk),
        where('isActive', '==', true),
        where('expiresAt', '>', now),
        orderBy('expiresAt', 'asc')
      );

      const snapshot = await getDocs(q);
      snapshot.forEach((doc) => {
        allDeals.push({ id: doc.id, ...doc.data() } as Deal);
      });
    }

    // Sort by creation date (newest first)
    allDeals.sort((a, b) => {
      const aTime = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
      const bTime = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
      return bTime - aTime;
    });

    return allDeals;
  } catch (error) {
    console.error('Get deals nearby error:', error);
    throw error;
  }
}

/**
 * Create a new deal
 * @param shopId Shop ID
 * @param deal Deal data
 * @returns New deal ID
 */
export async function createDeal(
  shopId: string,
  deal: Omit<Deal, 'id' | 'createdAt' | 'savingsAmount' | 'savingsPercent'>
): Promise<string> {
  try {
    // Calculate savings
    const savingsAmount = deal.originalPrice - deal.dealPrice;
    const savingsPercent = Math.round((savingsAmount / deal.originalPrice) * 100);

    const newDeal = {
      ...deal,
      shopId,
      savingsAmount,
      savingsPercent,
      isActive: true,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, DEALS_COLLECTION), newDeal);
    return docRef.id;
  } catch (error) {
    console.error('Create deal error:', error);
    throw error;
  }
}

/**
 * Delete a deal
 * @param shopId Shop ID (for validation)
 * @param dealId Deal ID
 */
export async function deleteDeal(shopId: string, dealId: string): Promise<void> {
  try {
    const { getDoc } = await import('firebase/firestore');

    const dealRef = doc(db, DEALS_COLLECTION, dealId);
    const dealSnap = await getDoc(dealRef);

    if (!dealSnap.exists()) {
      throw new Error('Deal not found');
    }

    const dealData = dealSnap.data() as { shopId?: string };
    if (dealData.shopId !== shopId) {
      throw new Error('Unauthorized deal delete attempt');
    }

    await deleteDoc(dealRef);
  } catch (error) {
    console.error('Delete deal error:', error);
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
