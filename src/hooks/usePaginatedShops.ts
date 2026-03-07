/**
 * usePaginatedShops Hook - Paginated nearby shops with infinite scroll
 * Uses TanStack Query's useInfiniteQuery for efficient pagination
 */

import type { Shop } from '@models/Shop';
import { getShopsNearby } from '@services/shopService';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

interface UsePaginatedShopsParams {
  lat: number;
  lng: number;
  radiusKm?: number;
  pageSize?: number;
  enabled?: boolean;
}

interface ShopsPage {
  shops: Shop[];
  nextCursor: number | null;
}

const DEFAULT_PAGE_SIZE = 10;

/**
 * Fetch paginated shops nearby
 */
export function usePaginatedShops({
  lat,
  lng,
  radiusKm = 2,
  pageSize = DEFAULT_PAGE_SIZE,
  enabled = true,
}: UsePaginatedShopsParams) {
  const query = useInfiniteQuery<ShopsPage, Error>({
    queryKey: ['shops-paginated', lat, lng, radiusKm, pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      // Fetch all nearby shops (cached by geohash query)
      const allShops = await getShopsNearby(lat, lng, radiusKm);

      // Calculate pagination slice
      const cursor = pageParam as number;
      const start = cursor;
      const end = cursor + pageSize;
      const shops = allShops.slice(start, end);

      // Calculate next cursor
      const hasMore = end < allShops.length;
      const nextCursor = hasMore ? end : null;

      return {
        shops,
        nextCursor,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    enabled: enabled && !!lat && !!lng,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Flatten all pages into single array for FlashList
  const flatShops = useMemo(() => {
    return query.data?.pages.flatMap((page) => page.shops) ?? [];
  }, [query.data?.pages]);

  return {
    shops: flatShops,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    refetch: query.refetch,
  };
}
