/**
 * usePendingActionsSync Hook
 * Syncs pending offline actions when reconnected to internet
 * Handles retry logic and failure tracking
 */

import {
    addPendingAction,
    clearPendingAction,
    getPendingActions,
    incrementPendingActionRetry,
} from '@services/offlineService';
import { useAuthStore } from '@store/authStore';
import { useCallback, useEffect, useState } from 'react';
import { useNetworkStatus } from './useNetworkStatus';

const MAX_RETRIES = 3;

interface PendingAction {
  id: number;
  type: string;
  data: any;
}

type ActionExecutor = (action: PendingAction) => Promise<boolean>;

/**
 * Hook to sync pending actions when network reconnects
 * @param actionExecutors Map of action type to executor function
 */
export function usePendingActionsSync(actionExecutors: Record<string, ActionExecutor>) {
  const { isOnline } = useNetworkStatus();
  const { user } = useAuthStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const syncActions = useCallback(async () => {
    if (!isOnline || !user?.id) {
      return;
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      const pendingActions = getPendingActions();

      if (pendingActions.length === 0) {
        setIsSyncing(false);
        return;
      }

      console.log(`🔄 [Sync] Starting sync of ${pendingActions.length} pending actions`);

      let successCount = 0;
      let failureCount = 0;

      for (const action of pendingActions) {
        try {
          const executor = actionExecutors[action.type];

          if (!executor) {
            console.warn(`⚠️  [Sync] No executor for action type: ${action.type}`);
            clearPendingAction(action.id);
            continue;
          }

          // Execute action
          const success = await executor(action);

          if (success) {
            clearPendingAction(action.id);
            successCount++;
            console.log(`✅ [Sync] Action ${action.id} (${action.type}) synced`);
          } else {
            // Failure - increment retry
            if (action.data.retry_count !== undefined && action.data.retry_count >= MAX_RETRIES) {
              console.error(`❌ [Sync] Max retries exceeded for action ${action.id}`);
              clearPendingAction(action.id);
              failureCount++;
            } else {
              incrementPendingActionRetry(action.id);
              failureCount++;
              console.warn(`⚠️  [Sync] Action ${action.id} failed, will retry later`);
            }
          }
        } catch (error) {
          console.error(`❌ [Sync] Error executing action ${action.id}:`, error);
          failureCount++;

          // Check if we've exceeded max retries
          if (action.data.retry_count !== undefined && action.data.retry_count >= MAX_RETRIES) {
            clearPendingAction(action.id);
          } else {
            incrementPendingActionRetry(action.id);
          }
        }
      }

      console.log(`[Sync] Complete: ${successCount} succeeded, ${failureCount} failed`);

      if (failureCount > 0 && successCount === 0) {
        setSyncError(`${failureCount} actions failed to sync`);
      }
    } catch (error) {
      console.error('Fatal sync error:', error);
      setSyncError('Failed to sync pending actions');
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, user?.id, actionExecutors]);

  // Sync when coming back online
  useEffect(() => {
    if (isOnline) {
      syncActions();
    }
  }, [isOnline, syncActions]);

  return {
    isSyncing,
    syncError,
    syncNow: syncActions,
    addPendingAction: (type: string, data: any) => {
      addPendingAction(type, data);
    },
  };
}

/**
 * Action executor for flagging product stock
 */
export const executeFlagStockAction: ActionExecutor = async (action) => {
  try {
    const { productId, shopId, isOutOfStock } = action.data;
    
    // TODO: Call actual service to flag stock
    console.log(`🚩 [Action] Flagging product ${productId} at ${shopId} as ${isOutOfStock ? 'out' : 'in'} stock`);
    
    return true; // Success
  } catch (error) {
    console.error('Flag stock action error:', error);
    return false;
  }
};

/**
 * Action executor for rating shop
 */
export const executeRateShopAction: ActionExecutor = async (action) => {
  try {
    const { shopId, rating, note } = action.data;
    
    // TODO: Call actual service to submit rating
    console.log(`⭐ [Action] Submitting rating ${rating} for shop ${shopId}`);
    
    return true; // Success
  } catch (error) {
    console.error('Rate shop action error:', error);
    return false;
  }
};

/**
 * Action executor for incrementing shop view
 */
export const executeIncrementViewAction: ActionExecutor = async (action) => {
  try {
    const { shopId } = action.data;
    
    // TODO: Call actual service to increment shop view count
    console.log(`👁️  [Action] Incrementing view count for shop ${shopId}`);
    
    return true; // Success
  } catch (error) {
    console.error('Increment view action error:', error);
    return false;
  }
};

/**
 * Action executor for toggling product stock
 */
export const executeToggleStockAction: ActionExecutor = async (action) => {
  try {
    const { productId, shopId, inStock } = action.data;
    
    // TODO: Call actual service to toggle stock
    console.log(`📦 [Action] Toggling stock for product ${productId} at ${shopId}`);
    
    return true; // Success
  } catch (error) {
    console.error('Toggle stock action error:', error);
    return false;
  }
};
