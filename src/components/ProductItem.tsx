import { Ionicons } from '@expo/vector-icons';
import type { ProductWithShop } from '@models/Product';
import { formatDistance } from '@utils/formatters';
import { Alert, Pressable, Text, View } from 'react-native';
import { StockBadge } from './StockBadge';

interface ProductItemProps {
  product: ProductWithShop;
  onAddToOrder: (product: ProductWithShop) => void;
  onShopPress: (shopId: string) => void;
  onFlagStock: (productId: string, shopId: string) => void;
  isInCart?: boolean;
}

export function ProductItem({
  product,
  onAddToOrder,
  onShopPress,
  onFlagStock,
  isInCart = false,
}: ProductItemProps) {
  const openStatus = product.shop?.isCurrentlyOpen ? 'کھلا' : 'بند';

  return (
    <Pressable
      onLongPress={() => {
        Alert.alert('رپورٹ', 'غلط اسٹاک رپورٹ کریں؟', [
          { text: 'منسوخ', style: 'cancel' },
          {
            text: 'رپورٹ کریں',
            style: 'destructive',
            onPress: () => onFlagStock(product.id, product.shopId),
          },
        ]);
      }}
      delayLongPress={350}
      className="bg-white rounded-xl shadow-sm mb-2 px-4 py-3"
    >
      <View className="flex-row justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-[15px] font-bold text-gray-900" numberOfLines={1}>
            {product.nameUrdu || product.name}
          </Text>
          <Pressable onPress={() => onShopPress(product.shopId)}>
            <Text className="text-[13px] text-primary mt-1" numberOfLines={1}>
              {product.shop.name}
            </Text>
          </Pressable>
          <Text className="text-xs text-gray-500 mt-1">
            📍 {formatDistance(product.shop.distanceKm)} • {openStatus}
          </Text>
        </View>

        <View className="items-end">
          <Text className="text-lg font-bold text-primary">Rs. {product.price}</Text>
          {product.isCheapestNearby && (
            <View className="bg-amber-100 rounded-full px-2 py-0.5 mt-1">
              <Text className="text-[10px] text-amber-700 font-semibold">سب سے سستا</Text>
            </View>
          )}
          {product.isNearestWithStock && (
            <View className="bg-blue-100 rounded-full px-2 py-0.5 mt-1">
              <Text className="text-[10px] text-blue-700 font-semibold">سب سے قریب</Text>
            </View>
          )}
        </View>
      </View>

      <View className="flex-row items-center justify-between mt-3">
        <StockBadge status={product.stockStatus} size="sm" />

        {!isInCart ? (
          <Pressable
            onPress={() => onAddToOrder(product)}
            className="w-8 h-8 rounded-full bg-primary items-center justify-center"
          >
            <Ionicons name="add" size={18} color="white" />
          </Pressable>
        ) : (
          <View className="w-8 h-8 rounded-full bg-green-600 items-center justify-center">
            <Ionicons name="checkmark" size={18} color="white" />
          </View>
        )}
      </View>
    </Pressable>
  );
}
