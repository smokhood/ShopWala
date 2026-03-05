/**
 * WhatsAppButton Component - Reusable WhatsApp action button
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

interface WhatsAppButtonProps {
  onPress: () => void;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  itemCount?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function WhatsAppButton({
  onPress,
  label = 'واٹس ایپ پر آرڈر',
  size = 'md',
  disabled = false,
  itemCount,
}: WhatsAppButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    }
  };

  const sizeClasses = {
    sm: 'py-2 px-4 rounded-xl',
    md: 'py-3 px-6 rounded-xl',
    lg: 'py-4 px-8 rounded-2xl w-full',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const iconSizes = {
    sm: 20,
    md: 24,
    lg: 28,
  };

  return (
    <View className="relative">
      <AnimatedPressable
        style={[
          animatedStyle,
          disabled && { opacity: 0.5 },
          { backgroundColor: '#25D366' },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        className={`flex-row items-center justify-center ${sizeClasses[size]}`}
      >
        <Ionicons
          name="logo-whatsapp"
          size={iconSizes[size]}
          color="white"
          style={{ marginRight: 8 }}
        />
        <Text className={`text-white font-bold ${textSizeClasses[size]}`}>
          {label}
        </Text>
      </AnimatedPressable>

      {/* Item Count Badge */}
      {itemCount !== undefined && itemCount > 0 && (
        <View className="absolute -top-2 -right-2 bg-red-500 rounded-full min-w-[24px] h-6 items-center justify-center px-2">
          <Text className="text-white font-bold text-xs">
            {itemCount > 99 ? '99+' : itemCount}
          </Text>
        </View>
      )}
    </View>
  );
}
