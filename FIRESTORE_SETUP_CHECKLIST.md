# Firestore Setup Checklist

## ✅ Quick Setup Checklist

### Phase 1: Firebase Console Setup
- [ ] Go to [Firebase Console](https://console.firebase.google.com)
- [ ] Select project: **dukandarapp-56878**
- [ ] Navigate to **Build → Firestore Database**
- [ ] Click **Create database**
- [ ] Choose: **Production mode**
- [ ] Region: **asia-south1 (Delhi)**
- [ ] Click **Create**
- [ ] Wait 2-3 minutes for setup

### Phase 2: Create Firestore Indexes (CRITICAL)
Navigate to: **Firestore Database → Indexes**

#### Index 1: Shops Near You ⭐ REQUIRED
- [ ] Click **Create Index**
- Collection ID: `shops`
- Fields:
  - [ ] `isActive` (Ascending) ↑
  - [ ] `location.geohash` (Ascending) ↑  
  - [ ] `__name__` (Ascending) ↑
- [ ] Click **Create Index**
- [ ] Wait for status to show ✅ **Enabled**

#### Index 2: Products by Category (Optional but Recommended)
- [ ] Click **Create Index**
- Collection ID: `shops`
- Collection ID (Subcollection): `products`
- Fields:
  - [ ] `isActive` (Ascending) ↑
  - [ ] `category` (Ascending) ↑
  - [ ] `price` (Ascending) ↑
- [ ] Click **Create Index**

#### Index 3: Search Products (Optional but Recommended)  
- [ ] Click **Create Index**
- Collection ID: `shops`
- Collection ID (Subcollection): `products`
- Fields:
  - [ ] `isActive` (Ascending) ↑
  - [ ] `inStock` (Ascending) ↑
  - [ ] `price` (Ascending) ↑
- [ ] Click **Create Index**

### Phase 3: Set Security Rules
Navigate to: **Firestore Database → Rules**

- [ ] Click **Edit Rules**
- [ ] Replace all content with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own documents
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
    }

    // Everyone can read shops, only owner can write
    match /shops/{shopId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == resource.data.ownerId;
      
      match /products/{productId} {
        allow read: if request.auth != null;
        allow write: if request.auth.uid == get(/databases/$(database)/documents/shops/$(shopId)).data.ownerId;
      }
    }

    // Deals - read all, owners can write
    match /deals/{dealId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == resource.data.ownerId;
    }

    // Notifications - only user can read/write their own
    match /notifications/{notificationId} {
      allow read: if request.auth.uid == resource.data.userId;
      allow write: if request.auth.uid == resource.data.userId;
    }

    // Orders - customers and owners can access
    match /orders/{orderId} {
      allow read: if request.auth.uid == resource.data.customerId || request.auth.uid == resource.data.ownerId;
      allow create: if request.auth != null;
      allow update: if request.auth.uid == resource.data.customerId || request.auth.uid == resource.data.ownerId;
    }
  }
}
```

- [ ] Click **Publish**

### Phase 4: Seed Test Data (Choose One Method)

#### Method A: Manual Via Firebase Console (Recommended for First Time)

1. **Create Test Owner User**
   - [ ] Firestore → Collections → **Create** `users`
   - [ ] Document ID: Use your Firebase Auth UID (or `test-user-owner-001`)
   - Add fields:
     ```
     id: "your-auth-uid"
     name: "Ahmed Khan"
     phone: "+923001234567"
     role: "owner"
     shopId: "shop-test-001"
     isOnboarded: true
     createdAt: (set to server timestamp)
     updatedAt: (set to server timestamp)
     ```

2. **Create Test Shop**
   - [ ] Firestore → Collections → **Create** `shops`
   - [ ] Document ID: `shop-test-001`
   - Add all fields from [FIRESTORE_SETUP_GUIDE.md](./FIRESTORE_SETUP_GUIDE.md)

3. **Create Products Subcollection**
   - [ ] Inside shop document → **Add subcollection** `products`
   - [ ] Add 5-10 products with fields from guide

#### Method B: Programmatic Via JavaScript
(Requires running in app context)

```typescript
// In your app anywhere after initialization:
import { seedTestShop, seedSecondTestShop } from '@/scripts/firebaseSetup';

// Run once:
await seedTestShop();
await seedSecondTestShop();
```

### Phase 5: Verify Setup

- [ ] Open app in Expo Go
- [ ] Log in as test customer
- [ ] Navigate to home screen
- [ ] Check console for "Get shops nearby" success message
- [ ] Try searching for "Lux" or "Nido"
- [ ] Should see test products and shops
- [ ] Close app and reopen - data should load from offline cache

### Phase 6: Troubleshooting

**Issue**: "The query requires an index" error
- [ ] Check if all 3 indexes are **Enabled** (green checkmark)
- [ ] Wait 5+ minutes for indexes to build
- [ ] Reload app

**Issue**: No shops appear on home screen  
- [ ] Check shops have `isActive: true`
- [ ] Check shop location coordinates are valid (31.5 lat, 74.3 lng for Lahore)
- [ ] Check Firestore Rules allow `read`
- [ ] Check console for Firestore errors

**Issue**: Login doesn't work
- [ ] Verify user document exists in `users` collection
- [ ] Verify user ID matches Firebase Auth UID exactly
- [ ] Check Firestore Rules for `users` collection

**Issue**: Products not showing under shop
- [ ] Check products are in `shops/{shopId}/products` subcollection
- [ ] Check `isActive: true` on products
- [ ] Check `inStock` status

---

## Time Estimate

| Phase | Task | Time |
|-------|------|------|
| 1 | Create Firestore DB | 5 min |
| 2 | Create Indexes | 10 min |
| 3 | Set Security Rules | 5 min |
| 4 | Seed Test Data | 10-20 min |
| 5 | Verify in App | 5-10 min |
| **Total** | **Full Setup** | **35-50 min** |

---

## Need Help?

**Firestore Documentation**: https://firebase.google.com/docs/firestore
**Firebase Console**: https://console.firebase.google.com
**Project ID**: `dukandarapp-56878`

See [FIRESTORE_SETUP_GUIDE.md](./FIRESTORE_SETUP_GUIDE.md) for detailed setup instructions.
