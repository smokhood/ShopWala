import { Ionicons } from '@expo/vector-icons';
import type { ProductWithShop } from '@models/Product';
import { formatDistance } from '@utils/formatters';
import { memo, useCallback } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useLanguage } from '../hooks/useLanguage';
import { StockBadge } from './StockBadge';

interface ProductItemProps {
  product: ProductWithShop;
  onAddToOrder: (product: ProductWithShop) => void;
  onShopPress: (shopId: string) => void;
  onFlagStock: (productId: string, shopId: string) => void;
  isInCart?: boolean;
}

function ProductItemComponent({
  product,
  onAddToOrder,
  onShopPress,
  onFlagStock,
  isInCart = false,
}: ProductItemProps) {
  const { t } = useLanguage();
  const openStatus = product.shop?.isCurrentlyOpen
    ? t('customer.open')
    : t('customer.closed');

  const handleLongPress = useCallback(() => {
    Alert.alert(t('common.report'), t('customer.report_stock_incorrect'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.report'),
        style: 'destructive',
        onPress: () => onFlagStock(product.id, product.shopId),
      },
    ]);
  }, [onFlagStock, product.id, product.shopId, t]);

  const handleShopPress = useCallback(() => {
    onShopPress(product.shopId);
  }, [product.shopId, onShopPress]);

  const handleAddPress = useCallback(() => {
    onAddToOrder(product);
  }, [product, onAddToOrder]);

  return (
    <Pressable
      onLongPress={handleLongPress}
      delayLongPress={350}
      className="bg-white rounded-2xl border border-gray-100 mb-2 px-4 py-3.5"
    >
      <View className="flex-row justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-[15px] font-bold text-gray-900" numberOfLines={1}>
            {product.nameUrdu || product.name}
          </Text>
          <Pressable onPress={handleShopPress} hitSlop={6}>
            <Text className="text-[13px] text-primary mt-1" numberOfLines={1}>
              {product.shop.name}
            </Text>
          </Pressable>
          <Text className="text-xs text-gray-500 mt-1">
            📍 {formatDistance(product.shop.distanceKm)} • {openStatus}
          </Text>
        </View>

        <View className="items-end justify-between">
          <Text className="text-lg font-bold text-primary">Rs. {product.price}</Text>
          {product.isCheapestNearby && (
            <View className="bg-amber-100 rounded-full px-2 py-0.5 mt-1">
              <Text className="text-[10px] text-amber-700 font-semibold">{t('customer.cheapest_nearby')}</Text>
            </View>
          )}
          {product.isNearestWithStock && (
            <View className="bg-blue-100 rounded-full px-2 py-0.5 mt-1">
              <Text className="text-[10px] text-blue-700 font-semibold">{t('customer.nearest')}</Text>
            </View>
          )}
        </View>
      </View>

      <View className="flex-row items-center justify-between mt-3 pt-2 border-t border-gray-100">
        <StockBadge status={product.stockStatus} size="sm" />

        {!isInCart ? (
          <Pressable
            onPress={handleAddPress}
            className="w-9 h-9 rounded-full bg-primary items-center justify-center"
          >
            <Ionicons name="add" size={18} color="white" />
          </Pressable>
        ) : (
          <View className="w-9 h-9 rounded-full bg-green-600 items-center justify-center">
            <Ionicons name="checkmark" size={18} color="white" />
          </View>
        )}
      </View>
    </Pressable>
  );
}

// Export memoized component for performance
export const ProductItem = memo(ProductItemComponent);
ProductItem.displayName = 'ProductItem';
