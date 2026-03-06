# Offline Actions & Sync System Manifest

## Overview
The offline actions system enables the app to queue and sync critical user actions (ratings, stock updates, etc.) when the device regains internet connectivity. This ensures important data is never lost due to network interruptions.

## Components

### 1. **offlineService.ts**
Core service managing offline action storage and lifecycle.

**Key Functions:**
- `addPendingAction(type, data)` - Queue a new action
- `getPendingActions()` - Retrieve all queued actions
- `clearPendingAction(id)` - Remove synced action
- `incrementPendingActionRetry(id)` - Increment retry counter

**Action Lifecycle:**
```
User Action → Queue (SQLite) → No Internet? → Queued
                                        ↓
                            Yes Internet → Retry Loop
                                        ↓
                            Success → Clear | Failure → Retry (Max 3x)
```

### 2. **usePendingActionsSync.ts**
React hook that handles syncing pending actions when network reconnects.

**Hook Signature:**
```typescript
usePendingActionsSync(actionExecutors: Record<string, ActionExecutor>)
```

**Returns:**
- `isSyncing: boolean` - Sync in progress
- `syncError: string | null` - Current sync error
- `syncNow: () => Promise<void>` - Manual sync trigger
- `addPendingAction: (type, data) => void` - Queue action

**Pre-built Executors:**
- `executeFlagStockAction` - Flag product stock status
- `executeRateShopAction` - Submit shop rating
- `executeIncrementViewAction` - Increment shop views
- `executeToggleStockAction` - Toggle product stock

### 3. **useNetworkStatus.ts**
Monitor device internet connectivity in real-time.

**Returns:**
- `isOnline: boolean` - Current connection status
- `type: string` - Network type (wifi, cellular, none)

## Usage Examples

### Example 1: Auto-Sync in Root Layout
```typescript
// app/_layout.tsx
import { usePendingActionsSync, executeFlagStockAction, executeRateShopAction } from '@viewModels/usePendingActionsSync';

export default function RootLayout() {
  const { isSyncing, syncError } = usePendingActionsSync({
    FLAG_STOCK: executeFlagStockAction,
    RATE_SHOP: executeRateShopAction,
  });

  return (
    <Stack>
      {isSyncing && <SyncIndicator />}
      {syncError && <ErrorAlert message={syncError} />}
      <Stack.Screen name="index" />
    </Stack>
  );
}
```

### Example 2: Queue Action on Shop Rating
```typescript
// screens/ShopDetail.tsx
import { usePendingActionsSync } from '@viewModels/usePendingActionsSync';

export default function ShopDetail({ shopId }) {
  const { addPendingAction } = usePendingActionsSync({
    RATE_SHOP: executeRateShopAction,
  });

  const submitRating = async (rating, note) => {
    // Always queue the action
    addPendingAction('RATE_SHOP', {
      shopId,
      rating,
      note,
      timestamp: Date.now(),
    });

    // Try to sync immediately
    syncNow();
  };

  return (
    <View>
      {/* Rating UI */}
    </View>
  );
}
```

### Example 3: Custom Action Executor
```typescript
const executeCustomAction = async (action) => {
  try {
    const response = await api.post('/custom-endpoint', action.data);
    return response.success;
  } catch (error) {
    console.error('Custom action failed:', error);
    return false;
  }
};

const { syncNow } = usePendingActionsSync({
  CUSTOM_ACTION: executeCustomAction,
});
```

## Configuration

### Max Retries (offlineService.ts)
- **Current:** 3 attempts
- **Modify:** `MAX_RETRIES` constant

### Retry Interval (offlineService.ts)
- **Current:** Auto on network reconnect
- **Manual Retry:** Call `syncNow()` from hook

### Action Timeout
- **Current:** 30 seconds per action (implement in executors)
- **Recommendation:** Add timeout wrapper:
```typescript
const withTimeout = (promise, ms) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), ms)
    ),
  ]);
};
```

## Database Schema

**pending_actions Table:**
```sql
- id: INTEGER PRIMARY KEY
- type: TEXT (action type like 'RATE_SHOP')
- data: JSON (action payload)
- retry_count: INTEGER (default 0)
- created_at: TIMESTAMP
- last_attempted: TIMESTAMP
```

## Error Handling

### Automatic
- Failure → Increment retry counter
- Max retries exceeded → Delete action + log warning
- Network still offline → Skip sync, retry on reconnect

### Manual
```typescript
const { syncError, syncNow } = usePendingActionsSync(...);

if (syncError) {
  Alert.alert('Sync Failed', syncError, [
    { text: 'Retry', onPress: syncNow },
    { text: 'Dismiss' },
  ]);
}
```

## Best Practices

1. **Queue Early:** Add to pending actions before API call
2. **Idempotent Operations:** Ensure sync actions can safely retry
3. **Clear Data:** Remove actions after successful sync
4. **Timeout Protection:** Implement timeouts in executors
5. **Logging:** Use console.log with emoji prefixes for quick debugging

## Debug Helpers

**View Pending Actions:**
```typescript
import { getPendingActions } from '@services/offlineService';
console.table(getPendingActions());
```

**Clear All Pending:**
```typescript
import { db } from '@services/database';
await db.execAsync('DELETE FROM pending_actions');
```

**Force Sync:**
```typescript
const { syncNow, isSyncing } = usePendingActionsSync(...);
await syncNow(); // Returns when complete
console.log('Sync complete:', !isSyncing);
```

## Testing

### Offline Mode (Testing Only)
```typescript
// Temporarily override network status
import { setTestMode } from '@viewModels/useNetworkStatus';
setTestMode('offline');

// Perform actions - should queue
// ...

// Go back online
setTestMode('online');
// Actions should auto-sync
```

### Simulate Failures
```typescript
// In executor, throw error to test retry logic
if (Math.random() < 0.5) throw new Error('Simulated failure');
```

## Integration Checklist

- [ ] Add `offlineService.ts` to database layer
- [ ] Create `usePendingActionsSync.ts` in viewModels
- [ ] Implement action executors for each critical operation
- [ ] Integrate hook in root layout
- [ ] Add sync status UI indicators
- [ ] Test offline → online transitions
- [ ] Verify actions persist on app restart
- [ ] Monitor logs for failed syncs
- [ ] Update user notifications

## Future Enhancements

1. **Priority Queue:** Prioritize critical actions
2. **Batch Operations:** Group similar actions for efficiency
3. **Conflict Resolution:** Handle server-side changes
4. **Webhook Confirmations:** Notify of successful syncs
5. **Analytics:** Track offline usage patterns
6. **Compression:** Reduce SQLite DB size with archival

## Related Files

- [offlineService.ts](../src/services/offlineService.ts) - Core offline storage
- [usePendingActionsSync.ts](../src/viewModels/usePendingActionsSync.ts) - Sync hook
- [useNetworkStatus.ts](../src/viewModels/useNetworkStatus.ts) - Network monitoring
- [prompts_FEATURE_10_OFFLINE_TESTING.md](../assets/prompts/prompts_FEATURE_10_OFFLINE_TESTING.md) - Testing guide
