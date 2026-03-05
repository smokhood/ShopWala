/**
 * Animated Splash Screen - App entry point
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useAuthStore } from '../src/store/authStore';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuthStore();

  // Animation values
  const logoScale = useSharedValue(0.8);
  const taglineOpacity = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  // Animated styles
  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  useEffect(() => {
    // Start animations
    logoScale.value = withSpring(1.0, {
      damping: 10,
      stiffness: 100,
    });

    taglineOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));

    // Fade out after animation completes
    // Auth routing is handled by root layout's auth guard
    const fadeTimer = setTimeout(() => {
      containerOpacity.value = withTiming(0, { duration: 300 });
    }, 2000);

    return () => clearTimeout(fadeTimer);
  }, []);

  return (
    <Animated.View
      style={[containerStyle]}
      className="flex-1 items-center justify-center bg-primary"
    >
      {/* Logo */}
      <Animated.View style={[logoStyle]} className="items-center">
        <Ionicons name="bag-handle" size={64} color="white" />
        <Text className="text-white text-4xl font-bold mt-4">DukandaR</Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={[taglineStyle]} className="mt-6">
        <Text className="text-white text-lg text-center">اپنی گلی کی ہر دکان</Text>
      </Animated.View>
    </Animated.View>
  );
}
