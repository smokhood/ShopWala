/**
 * app/(customer)/favourites.tsx
 * Saved favorite shops screen
 * Shows user's favorite shops with swipe-to-remove functionality
 */

import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { EmptyState } from '../../src/components/EmptyState';
import { ShopCard } from '../../src/components/ShopCard';
import { useFavouritesViewModel } from '../../src/viewModels/useFavouritesViewModel';

export default function FavouritesScreen() {
  const router = useRouter();
  const { favouriteShops, isLoading, isEmpty, removeFavourite, refetch } =
    useFavouritesViewModel();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const handleRemove = useCallback(
    async (shopId: string, shopName: string) => {
      Alert.alert('ہٹائیں', `${shopName} کو پسندیدہ سے نکالیں؟`, [
        { text: 'منسوخ', style: 'cancel' },
        {
          text: 'ہٹائیں',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFavourite(shopId);
            } catch (error) {
              Alert.alert('خرابی', 'ہٹانے میں خرابی');
            }
          },
        },
      ]);
    },
    [removeFavourite]
  );

  const handleWhatsAppPress = useCallback(async (shop: any) => {
    try {
      const phone = String(shop?.whatsapp || '').replace(/[+\s]/g, '');
      if (!phone) {
        Alert.alert('خرابی', 'WhatsApp نمبر دستیاب نہیں ہے');
        return;
      }

      const message = encodeURIComponent(
        `السلام علیکم! میں ${shop.name} سے رابطہ کرنا چاہتا/چاہتی ہوں۔\nDukandaR app سے`
      );
      const nativeUrl = `whatsapp://send?phone=${phone}&text=${message}`;
      const webUrl = `https://wa.me/${phone}?text=${message}`;

      const canOpenNative = await Linking.canOpenURL(nativeUrl);
      await Linking.openURL(canOpenNative ? nativeUrl : webUrl);
    } catch (error) {
      Alert.alert('خرابی', 'WhatsApp کھولنے میں ناکام');
    }
  }, []);

  const renderRightActions = (shopId: string, shopName: string) => (
    <TouchableOpacity
      className="bg-red-500 w-20 flex items-center justify-center"
      onPress={() => handleRemove(shopId, shopName)}
    >
      <Text className="text-white font-semibold text-sm">ہٹائیں</Text>
    </TouchableOpacity>
  );

  const renderShop = ({ item: shop }: any) => (
    <Swipeable
      renderRightActions={() => renderRightActions(shop.id, shop.name)}
      overshootRight={false}
    >
      <ShopCard
        shop={shop}
        onPress={() => router.push(`/(customer)/shop/${shop.id}`)}
        onWhatsAppPress={() => handleWhatsAppPress(shop)}
      />
    </Swipeable>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-gray-900">
            پسندیدہ دکانیں
          </Text>
          {!isEmpty && (
            <View className="bg-green-100 px-3 py-1 rounded-full">
              <Text className="text-xs font-semibold text-green-700">
                {favouriteShops.length}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : isEmpty ? (
        <EmptyState
          variant="empty_favourites"
          actionLabel="دکانیں تلاش کریں"
          onAction={() => router.push('/(customer)')}
        />
      ) : (
        <FlatList
          data={favouriteShops}
          renderItem={renderShop}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          scrollEnabled={true}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#16a34a"
            />
          }
        />
      )}
    </View>
  );
}
