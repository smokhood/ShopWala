# Firestore Database Setup Guide for DukandaR

## Step 1: Create Firebase Project (Already Done)
Your Firebase project is: `dukandarapp-56878`

Navigate to: https://console.firebase.google.com

---

## Step 2: Enable Firestore

1. Go to **Build** → **Firestore Database**
2. Click **Create database**
3. Choose **Production mode** (we'll set security rules)
4. Select region: **asia-south1 (Delhi)** (closest to Pakistan)
5. Click **Create**

Wait for initialization to complete (2-3 minutes).

---

## Step 3: Create Firestore Collections & Structure

Your app needs these **5 collections**:

### Collection 1: `users` (Customer & Owner Profiles)
**Document ID**: Firebase Auth UID

```json
{
  "id": "auth-uid",
  "phone": "+923001234567",
  "name": "Ahmed Khan",
  "role": "customer",  // or "owner"
  "shopId": null,  // Only for owners
  "savedShops": [],  // Only for customers
  "isOnboarded": true,
  "preferredLanguage": "ur",  // "en" or "ur"
  "createdAt": "2026-03-05T10:00:00Z",
  "updatedAt": "2026-03-05T10:00:00Z"
}
```

### Collection 2: `shops` (Shop Information)
**Document ID**: Auto-generated

**Subcollection**: `products` (inside each shop)

```json
{
  "id": "shop-doc-id",
  "name": "Shah Dairy & Grocery",
  "ownerName": "Ahmed Khan",
  "ownerId": "auth-uid-of-owner",
  "category": "kiryana",  // See shop categories below
  "whatsapp": "+923001234567",
  "phone": "+923001234567",
  "location": {
    "latitude": 31.5204,
    "longitude": 74.3587,
    "geohash": "u4prt3q1k",
    "address": "123 Main Street, Lahore",
    "area": "Defence, Lahore",
    "city": "Lahore"
  },
  "photoUrl": "https://...",  // Firebase Storage URL
  "isOpen": true,
  "isActive": true,
  "hours": {
    "openTime": "08:00",
    "closeTime": "23:00",
    "isOpen24Hours": false
  },
  "payment": {
    "jazzCashNumber": "03001234567",
    "easyPaisaNumber": null,
    "bankAccount": null
  },
  "rating": 4.5,
  "ratingCount": 12,
  "totalViews": 456,
  "todayViews": 23,
  "whatsappClicks": 15,
  "isVerified": false,
  "createdAt": "2026-03-05T10:00:00Z",
  "updatedAt": "2026-03-05T10:00:00Z"
}
```

### Collection 3: `products` (Inside `shops/{shopId}/products`)
**Document ID**: Auto-generated

```json
{
  "id": "product-id",
  "shopId": "shop-doc-id",
  "name": "Lux Soap Bar 135g",
  "nameUrdu": "لکس صابن",
  "category": "soap_hygiene",  // See product categories below
  "price": 25,
  "unit": "piece",  // e.g., "piece", "kg", "litre", "pack"
  "inStock": true,
  "stockStatus": "in_stock",  // "in_stock", "out_of_stock", "unverified"
  "stockVerifiedAt": null,
  "flagCount": 0,
  "searchCount": 5,
  "isActive": true,
  "createdAt": "2026-03-05T10:00:00Z",
  "updatedAt": "2026-03-05T10:00:00Z"
}
```

### Collection 4: `deals` (Shop Promotions)
**Document ID**: Auto-generated

```json
{
  "shopId": "shop-doc-id",
  "title": "50% Off Soaps",
  "description": "All soaps at half price",
  "discountPercent": 50,
  "validFrom": "2026-03-05T00:00:00Z",
  "validUntil": "2026-03-12T23:59:59Z",
  "isActive": true,
  "createdAt": "2026-03-05T10:00:00Z",
  "updatedAt": "2026-03-05T10:00:00Z"
}
```

### Collection 5: `notifications` (User Notifications)
**Document ID**: Auto-generated

```json
{
  "userId": "auth-uid",
  "type": "order_status",  // "order_status", "shop_alert", "deal_alert"
  "title": "Order #123 Confirmed",
  "message": "Your order has been confirmed",
  "data": {
    "orderId": "order-123"
  },
  "read": false,
  "createdAt": "2026-03-05T10:00:00Z"
}
```

---

## Step 4: Create Required Firestore Indexes

Navigate to **Firestore Database** → **Indexes**

### Index 1: Shops Near You (CRITICAL)
- **Collection**: `shops`
- **Fields**:
  - `isActive` (Ascending)
  - `location.geohash` (Ascending)
  - `__name__` (Ascending)

### Index 2: Active Products by Category
- **Collection**: `shops/{shopId}/products`
- **Fields**:
  - `isActive` (Ascending)
  - `category` (Ascending)
  - `price` (Ascending)

### Index 3: Search Products
- **Collection**: `shops/{shopId}/products`
- **Fields**:
  - `isActive` (Ascending)
  - `inStock` (Ascending)
  - `price` (Ascending)

---

## Step 5: Set Firestore Security Rules

1. Go to **Firestore Database** → **Rules**
2. Replace all content with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read for all authenticated users
    match /shops/{shopId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == resource.data.ownerId;
      
      match /products/{productId} {
        allow read: if request.auth != null;
        allow write: if request.auth.uid == get(/databases/$(database)/documents/shops/$(shopId)).data.ownerId;
      }
    }

    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
    }

    match /deals/{dealId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == resource.data.ownerId;
    }

    match /notifications/{notificationId} {
      allow read: if request.auth.uid == resource.data.userId;
      allow write: if request.auth.uid == resource.data.userId;
    }

    // Orders (for Feature 07)
    match /orders/{orderId} {
      allow read: if request.auth.uid == resource.data.customerId || request.auth.uid == resource.data.ownerId;
      allow create: if request.auth != null;
      allow update: if request.auth.uid == resource.data.customerId || request.auth.uid == resource.data.ownerId;
    }
  }
}
```

3. Click **Publish**

---

## Step 6: Create Sample Data (Manual)

### Create a Test Shop

1. **Firestore Database** → **Collections** → **shops**
2. Click **Add document**
3. Document ID: **shop-test-001**
4. Add these fields:

```
name: "Shah Dairy & Grocery"
ownerName: "Ahmed Khan"
ownerId: [YOUR-AUTH-UID]
category: "kiryana"
whatsapp: "+923001234567"
phone: "+923001234567"
location: {
  latitude: 31.5204
  longitude: 74.3587
  geohash: "u4prt3q1k"
  address: "123 Main Street, DHA V, Lahore"
  area: "DHA, Lahore"
  city: "Lahore"
}
isOpen: true
isActive: true
hours: {
  openTime: "08:00"
  closeTime: "23:00"
  isOpen24Hours: false
}
payment: {
  jazzCashNumber: "03001234567"
  easyPaisaNumber: null
  bankAccount: null
}
rating: 4.5
ratingCount: 12
totalViews: 456
todayViews: 23
whatsappClicks: 15
isVerified: false
photoUrl: null
createdAt: [SERVER_TIMESTAMP]
updatedAt: [SERVER_TIMESTAMP]
```

### Create Test Products (Under shop-test-001)

1. Inside shop document, click **+ Add subcollection**
2. Name it: **products**
3. Add 5-10 sample products with fields like:

```
name: "Lux Soap Bar 135g"
nameUrdu: "لکس صابن"
category: "soap_hygiene"
price: 25
unit: "piece"
inStock: true
stockStatus: "in_stock"
flagCount: 0
searchCount: 0
isActive: true
createdAt: [SERVER_TIMESTAMP]
updatedAt: [SERVER_TIMESTAMP]
```

---

## Step 7: Verify Setup Works

The app will now:
1. ✅ Query shops near user location (using geohash index)
2. ✅ Fetch products from shops
3. ✅ Cache data offline in SQLite
4. ✅ Fallback to cached data if Firestore is unavailable

---

## Shop Categories (Valid values)
- `kiryana` (Grocery)
- `pharmacy`
- `sabzi` (Vegetables)
- `bakery`
- `mobile` (Mobile phones)
- `clothing`
- `hardware`
- `beauty`
- `restaurant`
- `other`

## Product Categories (Valid values)
- `atta_rice`
- `oil_ghee`
- `dairy`
- `sugar_salt`
- `tea_drinks`
- `soap_hygiene`
- `pulses`
- `spices`
- `snacks`
- `cleaning`
- `medicines`
- `vitamins`
- `vegetables`
- `fruits`
- `bread_baked`
- `electronics`
- `other`

---

## Next Steps

1. ✅ Create Firestore Database
2. ✅ Create Collections (users, shops, products, deals, notifications)
3. ✅ Create the 3 Required Indexes
4. ✅ Set Security Rules
5. ✅ Add 1-2 Sample Shops with Products
6. 🚀 App will work with live data + offline fallback!

---

## Troubleshooting

**Problem**: "The query requires an index" error
- **Solution**: Create the index in Step 4 (Firestore will show you the link in error)

**Problem**: No shops showing on home screen
- **Solution**: 
  - Check if shops are marked `isActive: true`
  - Check if shops exist in the location area (use correct latitude/longitude)
  - Wait 2-3 mins for indexes to build

**Problem**: User can't log in
- **Solution**: Check if user document exists in `users` collection with correct `id` matching Firebase Auth UID

