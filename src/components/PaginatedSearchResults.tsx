/**
 * Example: Paginated Search Results Component
 * Demonstrates how to use usePaginatedSearchResults with FlashList for infinite scroll
 * 
 * To integrate into existing screens:
 * 1. Replace direct product search with usePaginatedSearchResults
 * 2. Add onEndReached and ListFooterComponent props to FlashList
 * 3. Use the returned products array directly
 */

import type { ProductWithShop } from '@models/Product';
import { FlashList } from '@shopify/flash-list';
import { useCallback } from 'react';
import { RefreshControl, Text, View } from 'react-native';
import { LoadingFooter } from '../components/LoadingFooter';
import { ProductItem } from '../components/ProductItem';
import { usePaginatedSearchResults } from '../hooks/usePaginatedSearchResults';

interface PaginatedSearchResultsProps {
  query: string;
  lat: number;
  lng: number;
  radiusKm?: number;
  onAddToOrder?: (product: ProductWithShop) => void;
  onShopPress?: (shopId: string) => void;
  onFlagStock?: (productId: string, shopId: string) => void;
}

/**
 * Example paginated product search with infinite scroll
 */
export function PaginatedSearchResults({
  query,
  lat,
  lng,
  radiusKm = 2,
  onAddToOrder,
  onShopPress,
  onFlagStock,
}: PaginatedSearchResultsProps) {
  const {
    products,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = usePaginatedSearchResults({
    query,
    lat,
    lng,
    radiusKm,
    pageSize: 15,
    enabled: !!query,
  });

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleAddToOrder = useCallback(
    (product: ProductWithShop) => {
      if (onAddToOrder) {
        onAddToOrder(product);
      }
    },
    [onAddToOrder]
  );

  const handleShopPress = useCallback(
    (shopId: string) => {
      if (onShopPress) {
        onShopPress(shopId);
      }
    },
    [onShopPress]
  );

  const handleFlagStock = useCallback(
    (productId: string, shopId: string) => {
      if (onFlagStock) {
        onFlagStock(productId, shopId);
      }
    },
    [onFlagStock]
  );

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-red-600 text-center">
          {error?.message || 'Search failed'}
        </Text>
      </View>
    );
  }

  return (
    <FlashList<ProductWithShop>
      data={products}
      renderItem={({ item }) => (
        <ProductItem
          product={item}
          onAddToOrder={handleAddToOrder}
          onShopPress={handleShopPress}
          onFlagStock={handleFlagStock}
        />
      )}
      keyExtractor={(item) => `${item.id}-${item.shopId}`}
      // Pagination props
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5} // Trigger when 50% from bottom
      ListFooterComponent={
        <LoadingFooter
          isLoading={isFetchingNextPage}
          text="مزید پروڈکٹس لوڈ ہو رہی ہیں..."
        />
      }
      // Refresh control
      refreshControl={
        <RefreshControl
          refreshing={isLoading && !isFetchingNextPage}
          onRefresh={refetch}
        />
      }
      // Empty state
      ListEmptyComponent={
        !isLoading ? (
          <View className="flex-1 items-center justify-center p-6 mt-12">
            <Text className="text-gray-500 text-center">
              کوئی نتیجہ نہیں ملا
            </Text>
          </View>
        ) : null
      }
    />
  );
}
