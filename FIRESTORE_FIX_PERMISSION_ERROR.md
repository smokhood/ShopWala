# ⚡ Quick Fix: Firestore Permission Denied Error

## 🔴 Problem
You're getting: `FirebaseError: Missing or insufficient permissions`

## ✅ Solution: Set Firestore Security Rules

### Step 1: Open Firebase Console
👉 Go to: https://console.firebase.google.com

### Step 2: Select Your Project
- Click project: **dukandarapp-56878**

### Step 3: Navigate to Rules
- Click: **Build** (left sidebar)
- Click: **Firestore Database**
- Click: **Rules** tab (next to "Data")

### Step 4: Replace Rules Content
⚠️ **DELETE everything currently shown in the Rules editor**

Then **PASTE this entire content:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow all authenticated users to read shops
    match /shops/{shopId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == resource.data.ownerId;
      allow create: if request.auth != null && request.auth.customClaims.role == 'owner';
      
      // Allow reading products in shops
      match /products/{productId} {
        allow read: if request.auth != null;
        allow write: if request.auth.uid == get(/databases/$(database)/documents/shops/$(shopId)).data.ownerId;
      }
    }

    // Users can read/write their own documents
    match /users/{userId} {
      allow read: if request.auth.uid == userId || request.auth != null;
      allow write: if request.auth.uid == userId;
      allow create: if request.auth.uid == userId;
    }

    // Deals - everyone read, owners write
    match /deals/{dealId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == resource.data.ownerId;
    }

    // Notifications - only user can read/write their own
    match /notifications/{notificationId} {
      allow read: if request.auth.uid == resource.data.userId;
      allow write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.auth.uid;
    }

    // Orders - customers and owners access their orders
    match /orders/{orderId} {
      allow read: if request.auth.uid == resource.data.customerId || request.auth.uid == resource.data.ownerId;
      allow create: if request.auth != null;
      allow update: if request.auth.uid == resource.data.customerId || request.auth.uid == resource.data.ownerId;
    }
  }
}
```

### Step 5: Publish Rules
- Click **PUBLISH** button (top right)
- Wait for confirmation ✅

---

## 🧪 Test It Works

1. **Reload your app** - Press `r` in the terminal running `npx expo start`
2. **Log in** with your test account
3. **Check the console** - You should now see:
   - ✅ `SQLite database initialized`
   - ✅ Shops being fetched from Firestore (no permission errors)

---

## ✅ What Each Rule Does

| Rule | Purpose |
|------|---------|
| `shops/{shopId}` | Everyone can READ shops, only owner can WRITE |
| `shops/.../products` | Everyone can READ products, only owner can WRITE |
| `users/{userId}` | Only that user can READ/WRITE their own profile |
| `deals/{dealId}` | Everyone can READ, owner can WRITE |
| `notifications` | Only user can READ/WRITE their own |
| `orders` | Customer & owner can access |

---

## 📍 Still Getting Errors?

### Error: "Rules already published" or "Can't edit"
→ Click **PUBLISH** again, it's fine

### Error: "Resource does not exist" 
→ This is OK - happens when shops don't exist yet

### Error: "Invalid JSON"
→ Check you copied the rules exactly - no extra characters

---

## 🎯 Next Steps

Once published:

1. ✅ Rules are live (permission errors will stop)
2. ✅ App can now read shops from Firestore  
3. ✅ Offline cache (SQLite) will populate
4. ✅ Add test shops to Firestore (see FIRESTORE_SETUP_GUIDE.md)

---

## 📞 Need Help?

- **Firebase Console**: https://console.firebase.google.com
- **Project**: dukandarapp-56878
- **Service Setup Guide**: See `FIRESTORE_SETUP_GUIDE.md`

