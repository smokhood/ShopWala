/**
 * usePaginatedSearchResults Hook - Paginated product search with infinite scroll
 * Uses TanStack Query's useInfiniteQuery for efficient pagination
 */

import type { ProductWithShop } from '@models/Product';
import { searchProductsNearby } from '@services/productService';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

interface UsePaginatedSearchResultsParams {
  query: string;
  lat: number;
  lng: number;
  radiusKm?: number;
  pageSize?: number;
  enabled?: boolean;
}

interface ProductsPage {
  products: ProductWithShop[];
  nextCursor: number | null;
}

const DEFAULT_PAGE_SIZE = 15;

/**
 * Fetch paginated product search results
 */
export function usePaginatedSearchResults({
  query: searchQuery,
  lat,
  lng,
  radiusKm = 2,
  pageSize = DEFAULT_PAGE_SIZE,
  enabled = true,
}: UsePaginatedSearchResultsParams) {
  const query = useInfiniteQuery<ProductsPage, Error>({
    queryKey: ['products-search-paginated', searchQuery, lat, lng, radiusKm, pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      // Fetch all search results (cached)
      const allProducts = await searchProductsNearby(searchQuery, lat, lng, radiusKm);

      // Calculate pagination slice
      const cursor = pageParam as number;
      const start = cursor;
      const end = cursor + pageSize;
      const products = allProducts.slice(start, end);

      // Calculate next cursor
      const hasMore = end < allProducts.length;
      const nextCursor = hasMore ? end : null;

      return {
        products,
        nextCursor,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    enabled: enabled && !!searchQuery && !!lat && !!lng,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Flatten all pages into single array for FlashList
  const flatProducts = useMemo(() => {
    return query.data?.pages.flatMap((page) => page.products) ?? [];
  }, [query.data?.pages]);

  return {
    products: flatProducts,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    refetch: query.refetch,
  };
}
