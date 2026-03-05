# DukandaR Firestore Setup - Complete Guide

## �‍🚀 What You Need to Do Right Now

You have 3 setup documents to guide you:

### 1. **Start Here: FIRESTORE_SETUP_CHECKLIST.md** ✅
A step-by-step checklist to follow while setting up Firestore.
Start here - it's the quickest way to get running!

### 2. **Detailed Reference: FIRESTORE_SETUP_GUIDE.md** 📖  
Complete documentation with:
- Data structure for each collection
- Field definitions and types
- Valid values for enums (categories, statuses)
- Security rules
- Sample data structure
- Troubleshooting guide

### 3. **Helper Script: scripts/firebaseSetup.ts** 🔧
TypeScript functions to programmatically seed test data once your Firestore is set up.

---

## 🎯 Quick Start Path (30 minutes)

### Phase 1: Create Your Firestore Database (5 min)
1. Go to https://console.firebase.google.com
2. Select project: `dukandarapp-56878`
3. Build → Firestore Database → Create Database
4. Choose: **Production mode** + Region: **asia-south1**
5. Wait for initialization

### Phase 2: Create Required Indexes (10 min)
⚠️ **CRITICAL** - The app won't work without these!

Go to: Firestore Database → Indexes → Create Index

**Index 1: Shops Near You** (This is the one causing your error!)
- Collection: `shops`
- Fields:
  - `isActive` ↑
  - `location.geohash` ↑
  - `__name__` ↑

Then create 2 more indexes for products (see checklist for details)

### Phase 3: Set Security Rules (5 min)
Firestore Database → Rules → Paste content from FIRESTORE_SETUP_GUIDE.md

### Phase 4: Seed Sample Data (10 min)
Either:
- **Manual**: Create shops/products via Firebase Console UI
- **Programmatic**: Use `scripts/firebaseSetup.ts` helper functions

### Phase 5: Test in App (5 min)
- Open Expo Go with your app
- Log in
- Home screen should show shops
- Search should return products

---

## ✨ What Happens After Setup

Your app will:
- ✅ Fetch live shops from Firestore
- ✅ Search products across shops
- ✅ Cache everything in offline SQLite database
- ✅ Work even if Firestore is unavailable
- ✅ Generate analytics (views, clicks, ratings)

---

## 📋 Collection Structure

Your Firestore database will look like:

```
firestore/
├── users/ (user profiles)
│   ├── auth-uid-123/
│   │   └── { name, phone, role, shopId, ... }
│   └── auth-uid-456/
│
├── shops/ (shop information)
│   ├── shop-123/
│   │   ├── { name, location, owner, hours, ... }
│   │   └── products/ (subcollection)
│   │       ├── product-1/ { name, price, stock, ... }
│   │       ├── product-2/
│   │       └── ...
│   └── shop-456/
│
├── deals/ (promotions)
│   ├── deal-1/ { shopId, discount, validUntil, ... }
│   └── deal-2/
│
└── notifications/ (user notifications)
    ├── notif-1/ { userId, title, type, ... }
    └── notif-2/
```

---

## 🔑 Key Points

1. **Indexes are Critical** ⭐
   - Without the "Shops Near You" index, queries will fail
   - Firestore shows you create index link in error message
   - Takes 5-10 minutes to build after creation

2. **Security Rules Control Access**
   - Customers can only read shop data
   - Only shop owners can modify their shop
   - Each user can only access their own notifications

3. **Offline Works by Default**
   - SQLite caches everything automatically
   - App works offline with cached data
   - Syncs when connection returns

4. **Sample Data Required**
   - App needs at least 1 shop with products to function
   - Test with 2-3 shops in different areas
   - Add 5+ products per shop to test search

---

## 📞 Firebase Auth Integration

Your app already has Firebase Auth configured:
- ✅ Phone-based login via OTP
- ✅ Auth tokens secure (via SecureStore)
- ✅ Quick auth persistence
- ✅ Rules protect user data

Just make sure to create a user document in the `users` collection after sign-up!

---

## 🚨 Common Errors & Fixes

### Error: "The query requires an index"
**Fix**: Create the "Shops Near You" index (see Phase 2)

### Error: "Permission denied"  
**Fix**: Check Firestore Rules (see Phase 3)

### No shops showing on home screen
**Fix**: Ensure:
- At least 1 shop with `isActive: true`
- Shop location is valid (Lahore area: 31.5 lat, 74.3 lng)
- Index is status: ✅ Enabled

### Can't log in
**Fix**: Create user document in `users` collection with matching ID

---

## 📚 Resources

- **Firestore Console**: https://console.firebase.google.com
- **Project ID**: `dukandarapp-56878`
- **Firestore Docs**: https://firebase.google.com/docs/firestore
- **Geohash Queries**: https://firebase.google.com/docs/firestore/solutions/geoqueries

---

## ✅ Setup Completion

Once you've completed all phases:

- [ ] Created Firestore Database
- [ ] Created 3 Indexes (shops near, products by category, search products)
- [ ] Set Security Rules
- [ ] Seeded 1-2 test shops with products
- [ ] Tested in app and saw shops/products
- [ ] Verified search returns results

**Then you're ready to move to Feature 07!** 🚀

---

## Next Immediate Steps

1. Open [FIRESTORE_SETUP_CHECKLIST.md](./FIRESTORE_SETUP_CHECKLIST.md)
2. Follow it step-by-step
3. If stuck on any step, see [FIRESTORE_SETUP_GUIDE.md](./FIRESTORE_SETUP_GUIDE.md) for details
4. Once done, test in the app
5. Come back and we'll implement Feature 07 (Shop Detail & Orders)

---

## Questions?

If you get stuck:
1. Check the error message in console
2. Search FIRESTORE_SETUP_GUIDE.md for that error
3. Verify index status is ✅ Enabled
4. Check Firestore Rules are published
5. Make sure data is in correct collections/subcollections

You've got this! 💪

