# Quick Testing Guide - Order Dispatch Error

## Problem Report
**Error:** FirebaseError "Permission denied" when owner marks order as dispatched

## Root Cause Analysis
The permission error occurs when:
1. Order document is missing `shopId` field, OR
2. User document is missing `shopId` field, OR  
3. Order's `shopId` doesn't match user's `shopId`

## Fixes Implemented

### 1. Enhanced Firestore Rules (firestore.rules)
✅ Added null-safe `currentUserShopId()` function
✅ Added `isValidStatusTransition()` validation 
✅ Added required fields validation on order creation
✅ Added null checks before shopId comparisons

### 2. Enhanced Order Service (src/services/orderService.ts)
✅ Added field validation in `createOrder()` - verifies shopId, customerId, items exist
✅ Added pre-verification in `markOrderDispatched()` - fetches order first, validates status
✅ Added pre-verification in `markOrderCompleted()` - validates dispatched status
✅ Enhanced error handling with Firebase error code extraction
✅ Added detailed console logging for debugging

### 3. Enhanced Order ViewModel (src/viewModels/useOrderViewModel.ts)
✅ Added validation for shopId/shopName/shopWhatsapp before order creation
✅ Added customerName field to order payload
✅ Enhanced logging throughout order creation flow

### 4. Enhanced Owner UI (app/(owner)/orders.tsx)
✅ Added shopId validation before dispatch attempt
✅ Integrated diagnostic utilities (in __DEV__ mode only)
✅ Enhanced error messages with actionable feedback

### 5. Created Diagnostic Utilities (src/utils/orderDiagnostics.ts) - NEW
✅ `diagnoseOrder()` - verifies order document and fields
✅ `diagnoseUserShop()` - verifies user document and shopId
✅ `logDiagnostics()` - formatted console report for troubleshooting

## How to Test

### Step 1: Verify User Has shopId
```typescript
// In Firebase Console or app console
const userRef = doc(db, 'users', userId);
const userSnap = await getDoc(userRef);
console.log('User data:', userSnap.data());
// MUST show: { shopId: '...', role: 'owner', ... }
```

### Step 2: Create Test Order as Customer
1. Login as customer account
2. Browse to any shop
3. Add products to cart
4. Place order via WhatsApp
5. **CHECK CONSOLE:** Order should log shopId value

### Step 3: Dispatch Order as Owner
1. Login as owner account (must have registered shop)
2. Navigate to Orders tab
3. Find pending order
4. Click "Mark Dispatched"
5. **CHECK CONSOLE:** Diagnostic report will show:
   - User shopId
   - Order shopId  
   - Permission check result
   - Any mismatches

### Step 4: Verify Success
✅ Alert shows "Order marked as dispatched"
✅ Order moves to dispatched tab
✅ Firestore document has `dispatchedAt` timestamp
✅ No permission errors in console

## Expected Console Output

```
🔍 [DISPATCH] Starting dispatch for order: abc123
🔍 [DISPATCH] Current user shopId: shop-xyz-789

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 ORDER DIAGNOSTICS REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 USER DIAGNOSTICS:
  User Exists: true
  Has shopId: true
  Shop ID: shop-xyz-789
  Role: owner

📦 ORDER DIAGNOSTICS:
  Order Exists: true
  Has shopId: true
  Order shopId: shop-xyz-789
  Has customerId: true
  Current Status: pending
  Can Dispatch: true
  
✅ All checks passed!

✅ Order marked as dispatched successfully
```

## Troubleshooting

### Error: "Order is missing shopId field"
**Fix:** The order wasn't created properly. Verify cart has shop details before checkout.

```typescript
// Check cart state before placing order
const cart = useCartStore.getState();
console.log('Cart shop:', cart.selectedShopId, cart.selectedShopName);
```

### Error: "User does not have a shopId"
**Fix:** Owner hasn't completed shop registration.

```typescript
// Manually set shopId if needed
const userRef = doc(db, 'users', userId);
await updateDoc(userRef, { shopId: 'correct-shop-id' });
```

### Error: "shopId mismatch"
**Fix:** Order belongs to different shop.

```
User shopId: shop-abc-123
Order shopId: shop-xyz-789
❌ This owner cannot dispatch this order
```

### Error: "Order cannot be dispatched (current status: dispatched)"
**Fix:** Order already dispatched. Check order list filters.

## Files Modified
- ✅ [firestore.rules](firestore.rules)
- ✅ [src/services/orderService.ts](src/services/orderService.ts)
- ✅ [src/viewModels/useOrderViewModel.ts](src/viewModels/useOrderViewModel.ts)
- ✅ [app/(owner)/orders.tsx](app/(owner)/orders.tsx)
- ✅ [src/utils/orderDiagnostics.ts](src/utils/orderDiagnostics.ts) - NEW

## Next Steps
1. Deploy updated Firestore rules: `firebase deploy --only firestore:rules`
2. Run app in development mode
3. Test complete order flow with diagnostics
4. Verify permission error is resolved
5. If issues persist, check diagnostic console output

## Production Considerations
- Diagnostic utilities only run in `__DEV__` mode (automatically disabled in production)
- All validation and error handling is production-safe
- Console logs can be removed/reduced once issue is confirmed fixed
- Consider adding Sentry error tracking for production monitoring
