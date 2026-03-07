# Permission Error Troubleshooting

## Current Issue

**Error:** `Missing or insufficient permissions` when trying to dispatch order `1772860206877`

**Your Details:**
- User ID: `UyIjDLSMWkfSyuX8KQeR8NlMW763`
- Shop ID: `1uIOuj4kQgl43U9G9QRR`
- Role: `owner`

## What's Happening

The diagnostic shows:
- ✅ User exists and has shopId
- ❌ Order cannot be read (permission denied)

This means **the order does not belong to your shop** or has missing/incorrect shopId field.

## Immediate Actions

### 1. Check Which Orders You CAN Access

The updated diagnostic will now show:
```
🔍 ACCESSIBLE ORDERS CHECK:
  Can Query Orders: true/false
  Total Orders Found: X
  Target Order Found: true/false
  Order IDs: [list of your shop's orders]
```

**Run the app again** and try to dispatch an order. The new diagnostic will show which orders are actually in your shop.

### 2. Verify Order in Firestore Console

1. Go to [Firebase Console](https://console.firebase.google.com/project/dukandarapp-56878/firestore)
2. Navigate to `orders` collection
3. Find order `1772860206877`
4. Check its fields:
   ```javascript
   {
     shopId: "???",  // Should be: 1uIOuj4kQgl43U9G9QRR
     customerId: "???",
     status: "pending",
     // ... other fields
   }
   ```

### 3. Check if Order Exists at All

The order ID `1772860206877` looks like a timestamp (March 11, 2026). This might be:
- An old order from before shopId was added
- An order for a different shop
- A test order that was never properly created

## How to Fix

### Scenario A: Order has wrong/missing shopId

**If the order exists but shopId doesn't match:**

```javascript
// In Firestore Console, manually update the order
{
  shopId: "1uIOuj4kQgl43U9G9QRR"  // Your correct shopId
}
```

### Scenario B: Order doesn't exist

**If the order ID is shown in your UI but doesn't exist in Firestore:**

1. The UI might be showing stale/cached data
2. Pull to refresh the orders list
3. The order should disappear if it doesn't really exist

### Scenario C: You're testing with wrong shop

**If you have multiple test shops:**

1. Verify you're logged in as the owner of the shop that received this order
2. Check `shops` collection in Firestore
3. Find shop with ID `1uIOuj4kQgl43U9G9QRR`
4. Verify it's YOUR shop

## Create a New Test Order

To properly test the dispatch flow:

### Step 1: As Customer
1. Log out from owner account
2. Login as customer (different phone number)
3. Browse to YOUR shop (1uIOuj4kQgl43U9G9QRR)
4. Add products to cart
5. Place order via WhatsApp
6. **Check console:** Order should show shopId: `1uIOuj4kQgl43U9G9QRR`

### Step 2: As Owner
1. Log out from customer
2. Login as owner (+923001234568)
3. Go to Orders tab
4. Find the newly created order
5. Click "Mark Dispatched"
6. **Should succeed!**

## Expected Console Output (When Working)

```
🔍 ACCESSIBLE ORDERS CHECK:
  Can Query Orders: true
  Total Orders Found: 3
  Target Order Found: true
  Order IDs: ["order1", "order2", "order3"]
  Target Order Data: {
    id: "order3",
    shopId: "1uIOuj4kQgl43U9G9QRR",
    customerId: "customer-uid",
    status: "pending"
  }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 ORDER DIAGNOSTICS REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 USER DIAGNOSTICS:
  User Exists: true
  Has shopId: true
  Shop ID: 1uIOuj4kQgl43U9G9QRR
  Role: owner

📦 ORDER DIAGNOSTICS:
  Order Exists: true
  Has shopId: true
  Has customerId: true
  Current Status: pending
  Can Dispatch: true
  Can Complete: false

✅ All checks passed!
✅ Order marked as dispatched successfully
```

## Check Order Creation Flow

If new orders also fail, verify order creation includes shopId:

### In `src/viewModels/useOrderViewModel.ts`:
```typescript
const orderData = {
  shopId: cart.shopId,  // ← Must be present
  shopName: cart.shopName,
  customerId: user.id,
  customerName: user.name,
  // ... other fields
};
```

### In Cart Store:
- Cart MUST have `shopId`, `shopName`, `shopWhatsapp` set when first item is added
- Check: `useCartStore.getState()` before placing order

## Firestore Rules Verification

Your current rules require:
```javascript
// Owner can read orders where order.shopId == user.shopId
allow read: if isAuthenticated() && (
  resource.data.customerId == request.auth.uid ||
  (resource.data.shopId != null && resource.data.shopId == currentUserShopId())
);

// currentUserShopId() reads from users collection
function currentUserShopId() {
  let userDoc = get(/databases/$(database)/documents/users/$(request.auth.uid));
  return userDoc != null && 'shopId' in userDoc.data ? userDoc.data.shopId : null;
}
```

**This means:**
- If order.shopId doesn't match your user.shopId → permission denied ❌
- If order doesn't have shopId field → permission denied ❌
- If your user document doesn't have shopId → permission denied ❌

## Quick Debug Commands

### Check your user document:
```typescript
const userRef = doc(db, 'users', 'UyIjDLSMWkfSyuX8KQeR8NlMW763');
const userSnap = await getDoc(userRef);
console.log('User:', userSnap.data());
// Should show: { shopId: '1uIOuj4kQgl43U9G9QRR', ... }
```

### Check order document (will fail if wrong shop):
```typescript
const orderRef = doc(db, 'orders', '1772860206877');
const orderSnap = await getDoc(orderRef);
console.log('Order:', orderSnap.data());
// Will show permission error if not your order
```

### Query YOUR shop's orders:
```typescript
const q = query(
  collection(db, 'orders'),
  where('shopId', '==', '1uIOuj4kQgl43U9G9QRR')
);
const snapshot = await getDocs(q);
console.log('Your orders:', snapshot.docs.map(d => d.id));
// Shows only orders belonging to your shop
```

## Next Steps

1. ✅ Run app again with updated diagnostics
2. ✅ Check "ACCESSIBLE ORDERS" output
3. ✅ If order not found, verify in Firestore Console
4. ✅ Create fresh test order as customer
5. ✅ Dispatch the fresh order as owner
6. ✅ Verify success

## Need Help?

If the issue persists after:
- Creating a fresh order as customer
- Verifying shopId is set correctly
- Checking Firestore Console shows matching shopId

Then share:
1. The "ACCESSIBLE ORDERS CHECK" output
2. Screenshot of the order document from Firestore Console
3. Screenshot of your user document from Firestore Console
