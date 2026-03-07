/**
 * Example: Paginated Shops List Component
 * Demonstrates how to use usePaginatedShops with FlashList for infinite scroll
 * 
 * To integrate into existing screens:
 * 1. Replace useQuery/manual shop fetching with usePaginatedShops
 * 2. Add onEndReached and ListFooterComponent props to FlashList
 * 3. Use the returned shops array directly
 */

import type { Shop } from '@models/Shop';
import { FlashList } from '@shopify/flash-list';
import { useCallback } from 'react';
import { RefreshControl, Text, View } from 'react-native';
import { LoadingFooter } from '../components/LoadingFooter';
import { ShopCard } from '../components/ShopCard';
import { usePaginatedShops } from '../hooks/usePaginatedShops';

interface PaginatedShopsListProps {
  lat: number;
  lng: number;
  radiusKm?: number;
  onShopPress?: (shopId: string) => void;
}

/**
 * Example paginated shops list with infinite scroll
 */
export function PaginatedShopsList({
  lat,
  lng,
  radiusKm = 2,
  onShopPress,
}: PaginatedShopsListProps) {
  const {
    shops,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = usePaginatedShops({
    lat,
    lng,
    radiusKm,
    pageSize: 10,
    enabled: true,
  });

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleShopPress = useCallback(
    (shopId: string) => {
      if (onShopPress) {
        onShopPress(shopId);
      }
    },
    [onShopPress]
  );

  const handleWhatsAppPress = useCallback(() => {
    // Placeholder - implement WhatsApp contact logic
  }, []);

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-red-600 text-center">
          {error?.message || 'Failed to load shops'}
        </Text>
      </View>
    );
  }

  return (
    <FlashList<Shop>
      data={shops}
      renderItem={({ item }) => (
        <ShopCard
          shop={item}
          onPress={() => handleShopPress(item.id)}
                  onWhatsAppPress={handleWhatsAppPress}
        />
      )}
      keyExtractor={(item) => item.id}
      // Pagination props
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5} // Trigger when 50% from bottom
      ListFooterComponent={
        <LoadingFooter
          isLoading={isFetchingNextPage}
          text="مزید دکانیں لوڈ ہو رہی ہیں..."
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
              قریب کوئی دکان نہیں ملی
            </Text>
          </View>
        ) : null
      }
    />
  );
}
