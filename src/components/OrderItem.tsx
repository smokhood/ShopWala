/**
 * OrderItem Component - Single item in order builder
 */
import { Ionicons } from '@expo/vector-icons';
import type { CartItem } from '@models/Order';
import { formatPrice } from '@utils/formatters';
import { Pressable, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

interface OrderItemProps {
  item: CartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

const SWIPE_THRESHOLD = -100;

export function OrderItem({
  item,
  onIncrement,
  onDecrement,
  onRemove,
}: OrderItemProps) {
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(80);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Only allow left swipe
      if (event.translationX < 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd(() => {
      if (translateX.value < SWIPE_THRESHOLD) {
        // Remove item with animation
        translateX.value = withTiming(-400, { duration: 300 });
        itemHeight.value = withTiming(0, { duration: 300 }, () => {
          runOnJS(onRemove)();
        });
      } else {
        // Spring back
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    height: itemHeight.value,
    opacity: itemHeight.value / 80,
  }));

  const itemTotal = item.price * item.quantity;

  return (
    <Animated.View style={containerStyle} className="mb-2 overflow-hidden">
      <View className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 items-center justify-center rounded-xl">
        <Ionicons name="trash" size={24} color="white" />
      </View>

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={animatedStyle}
          className="bg-white rounded-xl p-3 flex-row items-center"
        >
          {/* Product Info */}
          <View className="flex-1">
            <Text className="text-gray-900 font-semibold text-base">
              {item.productName}
            </Text>
            {item.productNameUrdu && (
              <Text className="text-gray-500 text-sm">{item.productNameUrdu}</Text>
            )}
            <Text className="text-gray-500 text-xs mt-1">
              {item.shopName}
            </Text>
          </View>

          {/* Quantity Controls */}
          <View className="flex-row items-center mx-3">
            <Pressable
              onPress={onDecrement}
              className="w-8 h-8 rounded-full border-2 border-green-500 items-center justify-center"
            >
              <Ionicons name="remove" size={18} color="#16a34a" />
            </Pressable>

            <Text className="text-gray-900 font-bold text-lg mx-3 min-w-[24px] text-center">
              {item.quantity}
            </Text>

            <Pressable
              onPress={onIncrement}
              className="w-8 h-8 rounded-full border-2 border-green-500 items-center justify-center"
            >
              <Ionicons name="add" size={18} color="#16a34a" />
            </Pressable>
          </View>

          {/* Price */}
          <View className="items-end">
            <Text className="text-gray-900 font-bold text-base">
              {formatPrice(itemTotal)}
            </Text>
            <Text className="text-gray-500 text-xs">
              {formatPrice(item.price)} × {item.quantity}
            </Text>
          </View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}
