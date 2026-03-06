/**
 * useNetworkStatus Hook
 * Monitors network connectivity and provides network state
 * Uses @react-native-community/netinfo
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useCallback, useEffect, useState } from 'react';

export type ConnectionType =
  | 'wifi'
  | 'cellular'
  | 'none'
  | 'unknown'
  | 'bluetooth'
  | 'ethernet'
  | 'vpn';

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: ConnectionType;
  isOffline: boolean;
}

/**
 * Hook to monitor network status
 * Returns current network state and sync callbacks
 */
export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: null,
    connectionType: 'unknown',
    isOffline: false,
  });

  const [wasOffline, setWasOffline] = useState(false);

  const handleNetworkChange = useCallback((state: NetInfoState) => {
    const isConnected = state.isConnected ?? false;
    const isInternetReachable = state.isInternetReachable;
    const connectionType = (state.type as ConnectionType) || 'unknown';
    const isOffline = !isConnected || !isInternetReachable;

    setNetworkStatus({
      isConnected,
      isInternetReachable,
      connectionType,
      isOffline,
    });

    // Track if we're transitioning back online
    if (wasOffline && !isOffline) {
      console.log('✅ [Network] Back online - triggering sync');
      // Trigger sync callback if provided
    } else if (!wasOffline && isOffline) {
      console.log('⚠️  [Network] Going offline');
    }

    setWasOffline(isOffline);
  }, [wasOffline]);

  // Subscribe to network state changes
  useEffect(() => {
    // Get initial state
    NetInfo.fetch()
      .then((state) => {
        handleNetworkChange(state);
      })
      .catch((error) => {
        console.error('Error fetching network state:', error);
      });

    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      handleNetworkChange(state);
    });

    return () => {
      unsubscribe();
    };
  }, [handleNetworkChange]);

  return {
    ...networkStatus,
    isOnline: !networkStatus.isOffline,
  };
}

/**
 * Hook to execute callback when network reconnects
 */
export function useOnNetworkReconnect(callback: () => void | Promise<void>) {
  const { isOffline } = useNetworkStatus();
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (wasOffline && !isOffline) {
      console.log('🔄 [Network] Reconnected - executing callback');
      callback();
    }

    setWasOffline(isOffline);
  }, [isOffline, callback]);
}
