/**
 * Firestore Setup Helper Script
 * 
 * This script helps you:
 * 1. Create necessary Firestore indexes
 * 2. Initialize collections
 * 3. Seed sample data
 * 
 * Usage:
 * 1. Copy this file to your project
 * 2. Uncomment the functions you need
 * 3. Run in a Node.js environment or paste in Firebase Console
 * 
 * For manual setup, follow FIRESTORE_SETUP_GUIDE.md instead
 */

import {
    addDoc,
    collection,
    doc,
    serverTimestamp,
    setDoc
} from 'firebase/firestore';
import { db } from '../src/services/firebase';

/**
 * Create a test shop with sample products
 * Call this once to populate test data
 */
export async function seedTestShop() {
  try {
    console.log('🌱 Seeding test shop...');

    // Create test user first
    const userId = 'test-user-owner-001'; // Use your Firebase Auth UID
    await setDoc(doc(db, 'users', userId), {
      id: userId,
      phone: '+923001234567',
      name: 'Ahmed Khan',
      role: 'owner',
      shopId: 'shop-test-001',
      savedShops: [],
      isOnboarded: true,
      preferredLanguage: 'ur',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Test owner user created');

    // Create test shop
    const shopRef = doc(db, 'shops', 'shop-test-001');
    await setDoc(shopRef, {
      id: 'shop-test-001',
      name: 'Shah Dairy & Grocery',
      ownerName: 'Ahmed Khan',
      ownerId: userId,
      category: 'kiryana',
      whatsapp: '+923001234567',
      phone: '+923001234567',
      location: {
        latitude: 31.5204,
        longitude: 74.3587,
        geohash: 'u4prt3q1k',
        address: '123 Defense, Phase V, Lahore',
        area: 'DHA, Lahore',
        city: 'Lahore',
      },
      photoUrl: null,
      isOpen: true,
      isActive: true,
      hours: {
        openTime: '08:00',
        closeTime: '23:00',
        isOpen24Hours: false,
      },
      payment: {
        jazzCashNumber: '03001234567',
        easyPaisaNumber: null,
        bankAccount: null,
      },
      rating: 4.5,
      ratingCount: 12,
      totalViews: 456,
      todayViews: 23,
      whatsappClicks: 15,
      isVerified: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Test shop created: shop-test-001');

    // Create sample products
    const products = [
      {
        name: 'Lux Soap Bar 135g',
        nameUrdu: 'لکس صابن',
        category: 'soap_hygiene',
        price: 25,
        unit: 'piece',
      },
      {
        name: 'Nido Milk Powder 400g',
        nameUrdu: 'نیڈو دودھ کا پاؤڈر',
        category: 'dairy',
        price: 280,
        unit: 'pack',
      },
      {
        name: 'Canola Oil 1L',
        nameUrdu: 'کینولا آئل',
        category: 'oil_ghee',
        price: 120,
        unit: 'litre',
      },
      {
        name: 'Himalaya Salt 1kg',
        nameUrdu: 'ہمالیہ نمک',
        category: 'sugar_salt',
        price: 35,
        unit: 'kg',
      },
      {
        name: 'Pakistani Rice 1kg',
        nameUrdu: 'پاکستانی چاول',
        category: 'atta_rice',
        price: 75,
        unit: 'kg',
      },
      {
        name: 'Lipton Black Tea 50 bags',
        nameUrdu: 'لپٹن چائے',
        category: 'tea_drinks',
        price: 150,
        unit: 'pack',
      },
      {
        name: 'Kissan Spice Mix 50g',
        nameUrdu: 'کسان مسالہ',
        category: 'spices',
        price: 45,
        unit: 'pack',
      },
      {
        name: 'Sunflower Oil 2L',
        nameUrdu: 'سورج مکھی کا تیل',
        category: 'oil_ghee',
        price: 220,
        unit: 'litre',
      },
    ];

    const productsRef = collection(db, 'shops', 'shop-test-001', 'products');

    for (const product of products) {
      await addDoc(productsRef, {
        shopId: 'shop-test-001',
        name: product.name,
        nameUrdu: product.nameUrdu,
        category: product.category,
        price: product.price,
        unit: product.unit,
        inStock: true,
        stockStatus: 'in_stock',
        stockVerifiedAt: null,
        flagCount: 0,
        searchCount: 0,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    console.log(`✅ Created ${products.length} sample products`);
    console.log('🎉 Test shop seeding complete!');

    return true;
  } catch (error) {
    console.error('❌ Error seeding test shop:', error);
    throw error;
  }
}

/**
 * Create a second test shop in a different area
 * Useful for testing multi-shop search
 */
export async function seedSecondTestShop() {
  try {
    console.log('🌱 Seeding second test shop...');

    const userId = 'test-user-owner-002'; // Different owner
    await setDoc(doc(db, 'users', userId), {
      id: userId,
      phone: '+923012345678',
      name: 'Fatima Malik',
      role: 'owner',
      shopId: 'shop-test-002',
      savedShops: [],
      isOnboarded: true,
      preferredLanguage: 'ur',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const shopRef = doc(db, 'shops', 'shop-test-002');
    await setDoc(shopRef, {
      id: 'shop-test-002',
      name: 'Fatima Pharmacy',
      ownerName: 'Fatima Malik',
      ownerId: userId,
      category: 'pharmacy',
      whatsapp: '+923012345678',
      phone: '+923012345678',
      location: {
        latitude: 31.5505,
        longitude: 74.3675,
        geohash: 'u4prw9e5k',
        address: '456 Mall Road, Lahore',
        area: 'Mall Road, Lahore',
        city: 'Lahore',
      },
      photoUrl: null,
      isOpen: true,
      isActive: true,
      hours: {
        openTime: '09:00',
        closeTime: '22:00',
        isOpen24Hours: false,
      },
      payment: {
        jazzCashNumber: '03012345678',
        easyPaisaNumber: null,
        bankAccount: null,
      },
      rating: 4.8,
      ratingCount: 25,
      totalViews: 890,
      todayViews: 45,
      whatsappClicks: 32,
      isVerified: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Second test shop created: shop-test-002');

    const medicines = [
      {
        name: 'Paracetamol 500mg',
        nameUrdu: 'پیراسیٹامول',
        category: 'medicines',
        price: 15,
      },
      {
        name: 'Aspirin 100 tablets',
        nameUrdu: 'ایسپرین',
        category: 'medicines',
        price: 120,
      },
      {
        name: 'Vitamin C 1000mg',
        nameUrdu: 'وٹامن سی',
        category: 'vitamins',
        price: 95,
      },
      {
        name: 'Antacid Gel 200ml',
        nameUrdu: 'ایسڈ کی دوا',
        category: 'medicines',
        price: 85,
      },
    ];

    const productsRef = collection(db, 'shops', 'shop-test-002', 'products');

    for (const product of medicines) {
      await addDoc(productsRef, {
        shopId: 'shop-test-002',
        name: product.name,
        nameUrdu: product.nameUrdu,
        category: product.category,
        price: product.price,
        unit: 'box',
        inStock: true,
        stockStatus: 'in_stock',
        stockVerifiedAt: null,
        flagCount: 0,
        searchCount: 0,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    console.log(`✅ Created ${medicines.length} sample medicines`);
    console.log('🎉 Second test shop seeding complete!');

    return true;
  } catch (error) {
    console.error('❌ Error seeding second shop:', error);
    throw error;
  }
}

/**
 * Create a test customer user
 * Useful for testing customer features
 */
export async function createTestCustomer(userId: string = 'test-user-customer-001') {
  try {
    console.log(`🌱 Creating test customer: ${userId}...`);

    await setDoc(doc(db, 'users', userId), {
      id: userId,
      phone: '+923333333333',
      name: 'Test Customer',
      role: 'customer',
      shopId: null,
      savedShops: [],
      isOnboarded: false,
      preferredLanguage: 'en',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ Test customer created: ${userId}`);
    return true;
  } catch (error) {
    console.error('❌ Error creating test customer:', error);
    throw error;
  }
}

/**
 * Delete all test data (use with caution!)
 */
export async function deleteAllTestData() {
  try {
    console.log('⚠️ WARNING: Deleting all test data...');

    // Delete would require batch operations
    console.log('Please manually delete test documents from Firebase Console');
    console.log('Collections to delete: users, shops (and their subcollections), deals, notifications');

    return true;
  } catch (error) {
    console.error('❌ Error deleting test data:', error);
    throw error;
  }
}

/**
 * Print Firestore setup instructions to console
 */
export function printSetupInstructions() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║         Firestore Setup Instructions                       ║
╚════════════════════════════════════════════════════════════╝

📋 STEP-BY-STEP GUIDE:

1️⃣  CREATE INDEXES
   Go to: https://console.firebase.google.com
   Project: dukandarapp-56878
   Firestore Database → Indexes
   
   Create these 3 indexes:
   
   Index 1: Shops Near You
   - Collection: shops
   - Fields: isActive ↑, location.geohash ↑, __name__ ↑
   
   Index 2: Products by Category  
   - Collection: shops/{shopId}/products
   - Fields: isActive ↑, category ↑, price ↑
   
   Index 3: Search Products
   - Collection: shops/{shopId}/products
   - Fields: isActive ↑, inStock ↑, price ↑

2️⃣  SET SECURITY RULES
   Firestore Database → Rules
   Paste content from FIRESTORE_SETUP_GUIDE.md
   Click Publish

3️⃣  SEED TEST DATA
   Run in your app:
   
   import { seedTestShop, seedSecondTestShop, createTestCustomer } from './path-to-this-file';
   
   await seedTestShop();           // Creates shop-test-001
   await seedSecondTestShop();     // Creates shop-test-002  
   await createTestCustomer();     // Creates test customer

4️⃣  TEST THE APP
   Open app in Expo Go
   Location should show nearby shops from Firestore
   Search should return products
   Everything cached offline in SQLite

✅ Done! Your Firestore is ready.

For detailed setup, see: FIRESTORE_SETUP_GUIDE.md
  `);
}

// Export all functions
export default {
  seedTestShop,
  seedSecondTestShop,
  createTestCustomer,
  deleteAllTestData,
  printSetupInstructions,
};
