/**
 * useCachedQuery Hook
 * Hybrid query hook that uses SQLite cache when offline
 * Falls back to TanStack Query when online
 */

import { cacheSearchResult, getCachedSearchResult } from '@services/offlineService';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNetworkStatus } from './useNetworkStatus';

interface CachedQueryOptions<TData, TError = Error> extends UseQueryOptions<TData, TError> {
  /** SQLite cache key for offline storage */
  cacheKey?: string;
  /** Enable offline cache fallback */
  enableOfflineCache?: boolean;
  /** Cache duration in milliseconds */
  cacheDurationMs?: number;
}

interface CachedQueryResult<TData, TError = Error> {
  /** Whether data is from offline cache */
  isFromCache: boolean;
  /** Whether data is stale */
  isStale: boolean;
  // Spread query result properties
  data: TData | undefined;
  error: TError | null;
  isError: boolean;
  isLoading: boolean;
  isPending: boolean;
  isSuccess: boolean;
  status: 'pending' | 'error' | 'success';
  refetch: () => Promise<any>;
}

/**
 * Query hook with offline SQLite cache support
 */
export function useCachedQuery<TData, TError = Error>(
  options: CachedQueryOptions<TData, TError>
): CachedQueryResult<TData, TError> {
  const { isOffline } = useNetworkStatus();
  const [isFromCache, setIsFromCache] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const {
    cacheKey,
    enableOfflineCache = true,
    cacheDurationMs = 2 * 60 * 60 * 1000, // 2 hours
    queryKey,
    queryFn,
    ...restOptions
  } = options;

  // Try to get cached data when offline
  const [cachedData, setCachedData] = useState<TData | null>(null);

  // When going offline, try to load from cache
  useEffect(() => {
    if (isOffline && enableOfflineCache && cacheKey) {
      try {
        const cached = getCachedSearchResult(cacheKey) as TData | null;
        if (cached) {
          setCachedData(cached);
          setIsFromCache(true);
          setIsStale(true);
          console.log(`📦 [Offline] Using cached data for key: ${cacheKey}`);
        }
      } catch (error) {
        console.error('Error loading cache:', error);
      }
    }
  }, [isOffline, enableOfflineCache, cacheKey]);

  // Normal TanStack Query
  const queryResult = useQuery({
    ...restOptions,
    queryKey,
    queryFn: async (context) => {
      if (typeof queryFn !== 'function') {
        return null as unknown as TData;
      }

      try {
        const data = await queryFn(context);

        // Cache successful results
        if (enableOfflineCache && cacheKey && data) {
          try {
            cacheSearchResult(cacheKey, data as any);
          } catch (error) {
            console.error('Error caching result:', error);
          }
        }

        return data;
      } catch (error) {
        // If online failed and we have cache, use cache
        if (enableOfflineCache && cachedData) {
          setIsFromCache(true);
          console.log(`⚠️  [Fallback] Using cache due to query error`);
          return cachedData as TData;
        }
        throw error;
      }
    },
  });

  // If online and has data, clear cache flag
  useEffect(() => {
    if (!isOffline && queryResult.data) {
      setIsFromCache(false);
      setIsStale(false);
    }
  }, [isOffline, queryResult.data]);

  return {
    isFromCache,
    isStale,
    data: queryResult.data || (cachedData as TData | undefined),
    error: queryResult.error as TError | null,
    isError: queryResult.isError,
    isLoading: queryResult.isLoading,
    isPending: queryResult.isPending,
    isSuccess: queryResult.isSuccess,
    status: queryResult.status,
    refetch: queryResult.refetch,
  };
}

/**
 * Convenience hook for search results with built-in caching
 */
export function useSearchCache<T>(
  searchQuery: string,
  queryFn: () => Promise<T[]>,
  options?: Partial<CachedQueryOptions<T[]>>
) {
  return useCachedQuery<T[]>({
    queryKey: ['search', searchQuery],
    queryFn: async () => queryFn(),
    cacheKey: searchQuery.toLowerCase(),
    enableOfflineCache: true,
    ...options,
  });
}
