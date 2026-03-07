# Order Flow Testing Guide

## Overview
This guide covers the complete order lifecycle from placement to fulfillment and how to test each step.

## Order Flow Architecture

### 1. Customer Places Order
**File:** `src/viewModels/useOrderViewModel.ts`

**Process:**
1. Customer adds items to cart from a shop
2. Cart stores: shopId, shopName, shopWhatsapp, items[], note
3. On checkout, order is created with:
   - `shopId` (required)
   - `shopName` (required) 
   - `shopWhatsapp` (required)
   - `customerId` (user.id)
   - `customerName` (user.name)
   - `status: 'pending'`
   - `items[]`
   - `subtotal`
   - `note`
   - `createdAt`, `updatedAt` (serverTimestamp)

**Firestore Rules:**
```javascript
allow create: if isAuthenticated() && request.resource.data.customerId == request.auth.uid;
```

### 2. Owner Views Orders
**File:** `app/(owner)/orders.tsx`, `src/services/orderService.ts`

**Process:**
1. Owner fetches orders via `getShopOrders(user.shopId)`
2. Query filters: `where('shopId', '==', shopId)`
3. Orders displayed by status: pending, dispatched, completed

**Firestore Rules:**
```javascript
allow read: if isAuthenticated() && (
  resource.data.customerId == request.auth.uid ||
  resource.data.shopId == currentUserShopId()
);
```

### 3. Owner Marks Order as Dispatched
**File:** `src/services/orderService.ts` - `markOrderDispatched()`

**Process:**
1. Validates order exists and is in 'pending' status
2. Updates order document:
   - `status: 'dispatched'`
   - `dispatchedAt: serverTimestamp()`
   - `updatedAt: serverTimestamp()`

**Firestore Rules:**
```javascript
allow update: if isAuthenticated() && (
  resource.data.shopId == currentUserShopId() ||
  customerCanMarkCompleted()
);

function currentUserShopId() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.shopId;
}
```

**Critical Requirements:**
- User document MUST have `shopId` field
- Order document MUST have `shopId` field
- Both `shopId` values MUST match
- Order must be in 'pending' status

### 4. Customer Marks Order as Completed
**File:** `src/services/orderService.ts` - `markOrderCompleted()`

**Process:**
1. Validates order exists and is in 'dispatched' status
2. Updates order document:
   - `status: 'completed'`
   - `completedAt: serverTimestamp()`
   - `updatedAt: serverTimestamp()`

**Firestore Rules:**
```javascript
function customerCanMarkCompleted() {
  let changed = request.resource.data.diff(resource.data).changedKeys();
  return resource.data.customerId == request.auth.uid
    && resource.data.status == 'dispatched'
    && request.resource.data.status == 'completed'
    && changed.hasOnly(['status', 'completedAt', 'updatedAt']);
}
```

## Testing Checklist

### Prerequisites
- [ ] Two test accounts: one customer, one owner
- [ ] Owner has registered shop with verified `shopId` in user document
- [ ] Shop has at least one active product

### Test Scenarios

#### Scenario 1: Happy Path - Full Order Lifecycle
1. **Customer Places Order**
   - [ ] Login as customer
   - [ ] Navigate to shop detail page
   - [ ] Add products to cart
   - [ ] Verify cart shows correct shop info
   - [ ] Place order via WhatsApp
   - [ ] Verify order is saved to Firestore
   - [ ] Check console: order should show shopId

2. **Owner Views Order**
   - [ ] Login as owner
   - [ ] Navigate to Orders tab
   - [ ] Verify order appears in pending list
   - [ ] Order should show: customer name, items, total, shopId

3. **Owner Dispatches Order**
   - [ ] Click "Mark Dispatched" button
   - [ ] Check console for diagnostics (if __DEV__ mode)
   - [ ] Verify success alert appears
   - [ ] Order should move to dispatched status
   - [ ] Check Firestore: `dispatchedAt` timestamp should exist

4. **Customer Completes Order**
   - [ ] Login as customer
   - [ ] Navigate to My Orders
   - [ ] Find dispatched order
   - [ ] Click "Mark as Received"
   - [ ] Verify success alert
   - [ ] Order should move to completed status
   - [ ] Check Firestore: `completedAt` timestamp should exist

#### Scenario 2: Error Handling

**Test: Owner Without Shop**
- [ ] Create owner account without registering shop
- [ ] Try to view orders
- [ ] Should show empty state or error

**Test: Wrong Shop Owner**
- [ ] Login as owner A
- [ ] Try to dispatch order from owner B's shop
- [ ] Should fail with permission denied

**Test: Invalid Order Status**
- [ ] Try to dispatch already dispatched order
- [ ] Should show error: "Order cannot be dispatched"
- [ ] Try to complete pending order (not dispatched)
- [ ] Should fail permission check

**Test: Missing Required Fields**
- [ ] Check order creation logs
- [ ] Verify shopId, customerId, status are present
- [ ] If any missing, order creation should fail

#### Scenario 3: Firestore Rules Validation

**Test: Customer Can Only Read Own Orders**
- [ ] Login as customer A
- [ ] Try to fetch customer B's orders directly via Firestore
- [ ] Should fail with permission denied

**Test: Owner Can Only Update Own Shop Orders**
- [ ] Manually create order with wrong shopId
- [ ] Try to dispatch as owner
- [ ] Should fail: shopId mismatch

## Diagnostic Tools

### Development Mode Diagnostics
When __DEV__ is true, diagnostics run automatically before dispatch:

```typescript
import { diagnoseOrder, diagnoseUserShop, logDiagnostics } from '@utils/orderDiagnostics';

// Check order and user state
const [orderDiag, userDiag] = await Promise.all([
  diagnoseOrder(orderId, user.id, user.shopId),
  diagnoseUserShop(user.id),
]);
logDiagnostics(orderDiag, userDiag);
```

**Console Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 ORDER DIAGNOSTICS REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 USER DIAGNOSTICS:
  User Exists: true
  Has shopId: true
  Shop ID: abc123
  Role: owner
  
📦 ORDER DIAGNOSTICS:
  Order Exists: true
  Has shopId: true
  Has customerId: true
  Current Status: pending
  Can Dispatch: true
  Can Complete: false
  Order Data: { ... }
```

### Manual Console Checks

**Check User Document:**
```javascript
const userRef = doc(db, 'users', userId);
const userSnap = await getDoc(userRef);
console.log('User data:', userSnap.data());
// Should have: { shopId: '...', role: 'owner', ... }
```

**Check Order Document:**
```javascript
const orderRef = doc(db, 'orders', orderId);
const orderSnap = await getDoc(orderRef);
console.log('Order data:', orderSnap.data());
// Should have: { shopId: '...', customerId: '...', status: 'pending', ... }
```

## Common Issues & Solutions

### Issue: "Permission denied" when dispatching order

**Causes:**
1. Owner's user document missing `shopId` field
2. Order's `shopId` doesn't match owner's `shopId`
3. Order is not in correct status

**Solution:**
```typescript
// 1. Verify user document
const userRef = doc(db, 'users', userId);
await updateDoc(userRef, { shopId: 'correct-shop-id' });

// 2. Check order shopId matches
console.log('User shopId:', user.shopId);
console.log('Order shopId:', order.shopId);

// 3. Run diagnostics to identify exact issue
```

### Issue: Order missing shopId field

**Cause:** Cart didn't have shop details when order was created

**Solution:**
- Verify cart store has shopId before checkout
- Check `useCartStore.getState()` values
- Ensure shop detail page sets cart shop info

### Issue: Firestore rules evaluation error

**Cause:** `get()` call in rules failing to fetch user document

**Solution:**
- Ensure user document exists with required fields
- Add defensive null checks in rules (future improvement)

## Performance Considerations

- Orders are fetched per shop, not globally
- Use query indexes for better performance:
  - `where('shopId', '==', shopId)`
  - `where('customerId', '==', customerId)`
- Server timestamps ensure consistent ordering

## Security Best Practices

✅ **What's Protected:**
- Customers can only create orders with their own customerId
- Customers can only read/update their own orders
- Owners can only read/update orders for their shop
- Status transitions are validated (pending → dispatched → completed)
- Field changes are restricted per role

❌ **What's NOT Protected (by design):**
- Order deletion (disabled for all users)
- Direct status jumps (enforced by service layer)

## Firestore Rules Improvements (Optional)

Consider these enhancements for production:

```javascript
// Add defensive null check for shopId fetch
function currentUserShopId() {
  let userDoc = get(/databases/$(database)/documents/users/$(request.auth.uid));
  return userDoc != null && 'shopId' in userDoc.data ? userDoc.data.shopId : null;
}

// Validate status transitions
function isValidStatusTransition() {
  let oldStatus = resource.data.status;
  let newStatus = request.resource.data.status;
  return (oldStatus == 'pending' && newStatus == 'dispatched') ||
         (oldStatus == 'dispatched' && newStatus == 'completed');
}
```

## Runtime E2E Verification

After making changes, verify:
1. [ ] Customer can place order successfully
2. [ ] Order appears in Firestore with correct fields
3. [ ] Owner can view order
4. [ ] Owner can dispatch order (status update succeeds)
5. [ ] Customer can view dispatched order
6. [ ] Customer can mark as completed
7. [ ] All console logs show expected data
8. [ ] No permission errors in any step
9. [ ] WhatsApp integration still works
10. [ ] Order history persists correctly
