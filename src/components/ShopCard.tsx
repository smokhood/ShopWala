/**
 * ShopCard Component - Shop display card
 */
import { Ionicons } from '@expo/vector-icons';
import type { Shop } from '@models/Shop';
import { formatDistance } from '@utils/formatters';
import { Image } from 'expo-image';
import { memo, useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { useLanguage } from '../hooks/useLanguage';

interface ShopWithDistance extends Shop {
  distance?: number;
}

interface ShopCardProps {
  shop: ShopWithDistance;
  onPress: () => void;
  onWhatsAppPress: () => void;
  variant?: 'full' | 'compact';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ShopCardComponent({
  shop,
  onPress,
  onWhatsAppPress,
  variant = 'full',
}: ShopCardProps) {
  const { t } = useLanguage();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 200 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, []);

  const getCategoryColor = useCallback((category: string) => {
    const colors: Record<string, string> = {
      kiryana: '#16a34a',
      pharmacy: '#ef4444',
      sabzi: '#22c55e',
      bakery: '#f59e0b',
      mobile: '#3b82f6',
      clothing: '#ec4899',
      hardware: '#6b7280',
      beauty: '#a855f7',
      restaurant: '#f97316',
      other: '#64748b',
    };
    return colors[category] || '#64748b';
  }, []);

  if (variant === 'compact') {
    return (
      <AnimatedPressable
        style={[animatedStyle]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className="bg-white rounded-2xl p-3 mr-3 border border-gray-100 w-64"
      >
        <View className="flex-row">
          {/* Shop Photo */}
          <View
            className="w-16 h-16 rounded-lg overflow-hidden"
            style={{ backgroundColor: getCategoryColor(shop.category) }}
          >
            {shop.photoUrl ? (
              <Image
                source={{ uri: shop.photoUrl }}
                className="w-full h-full"
                contentFit="cover"
                cachePolicy="memory-disk"
                priority="high"
              />
            ) : (
              <View className="w-full h-full items-center justify-center">
                <Ionicons name="storefront" size={24} color="white" />
              </View>
            )}
          </View>

          {/* Shop Info */}
          <View className="flex-1 ml-3">
            <Text className="text-[15px] font-semibold text-gray-900" numberOfLines={1}>
              {shop.name}
            </Text>
            <View className="flex-row items-center mt-1">
              <Ionicons name="star" size={12} color="#f59e0b" />
              <Text className="text-xs text-gray-600 ml-1">
                {shop.rating.toFixed(1)}
              </Text>
              {shop.distance !== undefined && (
                <>
                  <Text className="text-xs text-gray-400 mx-1">•</Text>
                  <Text className="text-xs text-gray-600">
                    {formatDistance(shop.distance)}
                  </Text>
                </>
              )}
            </View>
            <View className="flex-row items-center mt-1">
              <View
                className={`w-2 h-2 rounded-full ${
                  shop.isOpen ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <Text className="text-xs text-gray-600 ml-1">
                {shop.isOpen ? t('customer.open') : t('customer.closed')}
              </Text>
            </View>
          </View>
        </View>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      style={[animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className="bg-white rounded-2xl border border-gray-100 mb-3 p-4"
    >
      <View className="flex-row">
        {/* Shop Photo */}
        <View
          className="w-20 h-20 rounded-xl overflow-hidden"
          style={{ backgroundColor: getCategoryColor(shop.category) }}
        >
          {shop.photoUrl ? (
            <Image
              source={{ uri: shop.photoUrl }}
              className="w-full h-full"
              contentFit="cover"
              cachePolicy="memory-disk"
              priority="normal"
            />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Ionicons name="storefront" size={32} color="white" />
            </View>
          )}
        </View>

        {/* Shop Content */}
        <View className="flex-1 ml-4">
          <Text className="text-[17px] font-bold text-gray-900" numberOfLines={1}>
            {shop.name}
          </Text>

          {/* Category Badge */}
          <View
            className="self-start rounded-full px-2 py-1 mt-1"
            style={{ backgroundColor: `${getCategoryColor(shop.category)}20` }}
          >
            <Text
              className="text-[11px] font-semibold"
              style={{ color: getCategoryColor(shop.category) }}
            >
              {shop.category}
            </Text>
          </View>

          {/* Stats Row */}
          <View className="flex-row items-center mt-2">
            <Ionicons name="star" size={14} color="#f59e0b" />
            <Text className="text-sm text-gray-600 ml-1">
              {shop.rating.toFixed(1)}
            </Text>

            {shop.distance !== undefined && (
              <>
                <Text className="text-sm text-gray-400 mx-2">•</Text>
                <Ionicons name="location" size={14} color="#16a34a" />
                <Text className="text-sm text-gray-600 ml-1">
                  {formatDistance(shop.distance)}
                </Text>
              </>
            )}

            <Text className="text-sm text-gray-400 mx-2">•</Text>
            <View
              className={`w-2 h-2 rounded-full ${
                shop.isOpen ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <Text className="text-sm text-gray-600 ml-1">
              {shop.isOpen ? t('customer.open') : t('customer.closed')}
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Row */}
      <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <Text className="text-xs text-gray-600">
          {shop.isOpen
            ? t('customer.open_until_time', { time: shop.hours.closeTime })
            : t('customer.currently_closed')}
        </Text>

        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onWhatsAppPress();
          }}
          className="bg-green-50 border border-green-100 rounded-lg px-3 py-2 flex-row items-center"
        >
          <Ionicons name="logo-whatsapp" size={16} color="#16a34a" />
          <Text className="text-xs font-medium text-primary ml-1">
            WhatsApp
          </Text>
        </Pressable>
      </View>
    </AnimatedPressable>
  );
}

// Export memoized component for performance
export const ShopCard = memo(ShopCardComponent);
ShopCard.displayName = 'ShopCard';
