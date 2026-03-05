# 🔧 Auth Flow Debugging & Testing Guide

## Current Fixes Applied

### 1. ✅ AuthStore (Rehydration Fix)
**File**: `src/store/authStore.ts`
- ✅ Initial state: `isLoading: true`
- ✅ Added `logAuthState()` function for debugging
- ✅ Added `resetAuthState()` function for testing
- ✅ Added SecureStore logging to track persistence
- ✅ Proper `onRehydrateStorage` callback

### 2. ✅ Root Layout (Routing Logic Fix)
**File**: `app/_layout.tsx`
- ✅ Changed from `return null` to `return blank screen` while loading
- ✅ Added comprehensive console logging for auth guard
- ✅ Tracks: fontsLoaded, isLoading, isAuthenticated, userRole, currentRoute
- ✅ Added dev mode reset option
- ✅ Logs state changes for debugging

### 3. ✅ Splash Screen (Still Uses Only Animations)
**File**: `app/index.tsx`
- ✅ No routing logic - auth guard handles everything
- ✅ Just shows 2 second animation then fades

---

## How to Test Auth Flow

### Option A: Reset Auth and Test Fresh Install (RECOMMENDED)

**Step 1: Uncomment reset in root layout**
```tsx
// In app/_layout.tsx, line ~62, uncomment:
await resetAuthState();
```

**Step 2: Clear app data**
```powershell
# Close Expo server if running
# Then restart
```

**Step 3: Open app**
```
npx expo start --clear
```

**Expected Flow on Fresh Install**:
```
1. App starts
   ↓
2. Console shows: "🧪 [DEV MODE] Resetting auth state..."
   ↓
3. Blank screen (loading) for ~1-2 seconds
   ↓
4. Splash screen shows for 2 seconds
   ↓
5. Role selection screen appears ✅
   ↓
6. Select Customer or Owner
   ↓
7. OTP screen appears
   ↓
8. Enter phone + OTP (123456 for test)
   ↓
9. Authenticated user redirects to Customer/Owner screen
```

### Option B: Keep Returning User State (SKIPS AUTH)

**This is normal behavior**:
- User logs in once
- Close and reopen app
- User should stay logged in (SecureStore persists)
- Should go directly to Customer/Owner screen

**To verify this works**:
1. Go through auth flow (Option A)
2. Close app
3. Kill Expo server
4. Reopen app: `npx expo start`
5. Should skip auth and show Customer screen ✅

---

## Console Output to Watch For

### Successful Fresh Install Flow:
```
✅ App initialized
📋 [Auth State] {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  hasCompletedOnboarding: false
}
[Loading State] {
  fontsLoaded: false,
  isLoading: true,
  isAuthenticated: false,
  userRole: undefined
}
[Loading State] {
  fontsLoaded: true,
  isLoading: true,
  isAuthenticated: false,
  userRole: undefined
}
[SecureStore] getItem(dukandar-auth-storage): Not found ✅
[Loading State] {
  fontsLoaded: true,
  isLoading: false,  ← This is KEY - should be false
  isAuthenticated: false,
  userRole: undefined
}
[Auth Guard] Running {
  isAuthenticated: false,
  userRole: undefined,
  currentSegment: 0 (index page)
  inAuthGroup: false,
  inCustomerGroup: false,
  inOwnerGroup: false
}
[Redirect] Not authenticated → /(auth)/role-select
```

### Returning User Flow:
```
✅ App initialized
📋 [Auth State] {
  user: { phone, id, role: 'customer', ... },
  isAuthenticated: true,
  isLoading: true,
  hasCompletedOnboarding: false
}
[SecureStore] getItem(dukandar-auth-storage): Found ✅
[Loading State] {
  fontsLoaded: true,
  isLoading: false,
  isAuthenticated: true,
  userRole: 'customer'
}
[Auth Guard] Running {
  isAuthenticated: true,
  userRole: 'customer',
  currentSegment: 0 (index page)
  ...
}
[Redirect] Customer role → /(customer)
```

### Error Signs to Watch For:
```
❌ [Loading State] { isLoading: true, fontsLoaded: true } (stuck loading)
❌ [Auth Guard] Not running at all
❌ [SecureStore] Error logs appearing
❌ Wrong redirect (went to customer instead of auth)
```

---

## Step-by-Step with Logging

### 1. Check SecureStore has no user data
```
Console should show:
[SecureStore] getItem(dukandar-auth-storage): Not found
```
If it says "Found", there's old data. Run Option A to reset.

### 2. Check isLoading becomes false
```
Should see transition:
isLoading: true → isLoading: false
```
This happens after fonts load AND rehydration completes.

### 3. Check auth guard runs
```
Should see:
[Auth Guard] Running { isAuthenticated: false, ... }
```
If this doesn't appear, auth guard is skipped.

### 4. Check redirect happens
```
Should see:
[Redirect] Not authenticated → /(auth)/role-select
```

### 5. Check screen loads
```
Role selection screen with:
- "آپ کون ہیں?" (Who are you?)
- Customer card
- Owner card
```

---

## Testing Checklist

### ✅ Fresh Install (First Open)
- [ ] Shows splash screen
- [ ] Shows role selection
- [ ] OTP screen on role select
- [ ] Can enter phone and OTP
- [ ] Redirects to customer screen after OTP ✅

### ✅ Returning User (Second Open)
- [ ] Shows splash screen
- [ ] Skips auth  
- [ ] Goes directly to customer screen ✅

### ✅ Logout & Re-login
- [ ] Logout clears SecureStore
- [ ] Shows auth screen
- [ ] Can log in again ✅

### ✅ Console Logs
- [ ] StateInitialization logs shown
- [ ] SecureStore logs shown
- [ ] Loading state transitions shown
- [ ] Auth guard runs shown
- [ ] Redirect logs shown

---

## If It's Still Bypassing Auth

### Debug Steps:

**1. Check SecureStore Content**
Add to role-select.tsx to see what's stored:
```tsx
import { useAuthStore } from '@store/authStore';

useEffect(() => {
  const state = useAuthStore.getState();
  console.log('Current auth:', state);
}, []);
```

**2. Check if customer layout loads without auth**
Add to `app/(customer)/_layout.tsx`:
```tsx
import { useAuthStore } from '@store/authStore';

export default function CustomerLayout() {
  const { isAuthenticated, user } = useAuthStore();
  console.log('Customer Layout Loaded:', { isAuthenticated, user });
  // ...rest of component
}
```
If this logs with `isAuthenticated: true` when it shouldn't, auth state is wrong.

**3. Check if root layout auth guard is running**
Look for `[Auth Guard] Running` log.
If missing, the auth guard useEffect is not executing.

**4. Force reset auth**
In root layout, keep uncommented:
```tsx
await resetAuthState();
```
This will clear SecureStore on every app start.

---

## Quick Reference: What Goes Wrong & How To Fix

| Symptom | Cause | Fix |
|---------|-------|-----|
| Goes to customer screen directly | User data in SecureStore | Run `resetAuthState()` |
| Blank screen stuck | `isLoading` stuck as `true` | Check rehydration callback |
| Returns `null` page | Old code `return null` | Already fixed in latest version |
| No auth guard logs | Auth guard not running | Check useEffect dependencies |
| Wrong redirect route | Segments incorrect | Check router.replace paths |

---

## Production Checklist

Before shipping, ensure:
- [ ] Reset auth code removed (line in root layout)
- [ ] Console logs still there (for debugging)
- [ ] SecureStore key matches package name
- [ ] Firebase rules updated for public reads
- [ ] Phone validation working
- [ ] OTP expiry implemented

---

**Need help?** Check console logs - they tell the story of what's happening! 📱

