/**
 * DealCard Component - Deal highlight card
 */
import type { Deal } from '@models/Deal';
import { formatPrice } from '@utils/formatters';
import { Pressable, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

interface DealCardProps {
  deal: Deal;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function DealCard({ deal, onPress }: DealCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const expiry = deal.expiresAt.toDate();
    const hoursRemaining = Math.floor(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60)
    );

    if (hoursRemaining < 1) {
      const minutesRemaining = Math.floor(
        (expiry.getTime() - now.getTime()) / (1000 * 60)
      );
      return `${minutesRemaining} منٹ باقی`;
    } else if (hoursRemaining < 24) {
      return `${hoursRemaining} گھنٹے باقی`;
    } else {
      return 'صرف آج';
    }
  };

  return (
    <AnimatedPressable
      style={[animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!onPress}
      className="bg-amber-50 border border-amber-200 rounded-xl p-4 mr-3 w-72"
    >
      <View className="flex-row items-center">
        {/* Icon */}
        <View className="w-12 h-12 rounded-full bg-amber-100 items-center justify-center mr-3">
          <Text className="text-2xl">🏷️</Text>
        </View>

        {/* Product Info */}
        <View className="flex-1">
          <Text className="text-gray-900 font-semibold text-base mb-1">
            {deal.productName}
          </Text>

          {/* Prices */}
          <View className="flex-row items-center mb-1">
            <Text className="text-gray-500 text-sm line-through mr-2">
              {formatPrice(deal.originalPrice)}
            </Text>
            <Text className="text-amber-600 font-bold text-lg">
              {formatPrice(deal.dealPrice)}
            </Text>
          </View>

          {/* Time remaining */}
          <Text className="text-gray-600 text-xs">{getTimeRemaining()}</Text>
        </View>

        {/* Savings Badge */}
        <View className="items-end">
          <View className="bg-green-500 rounded-lg px-2 py-1 mb-1">
            <Text className="text-white font-semibold text-xs">
              {formatPrice(deal.savingsAmount)} بچائیں
            </Text>
          </View>
          <View className="bg-amber-500 rounded-lg px-2 py-1">
            <Text className="text-white font-bold text-xs">
              {deal.savingsPercent}% OFF
            </Text>
          </View>
        </View>
      </View>

      {/* Note if exists */}
      {deal.note && (
        <View className="mt-2 pt-2 border-t border-amber-200">
          <Text className="text-gray-600 text-sm">{deal.note}</Text>
        </View>
      )}
    </AnimatedPressable>
  );
}
