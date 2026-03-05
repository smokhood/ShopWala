import NetInfo from '@react-native-community/netinfo';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

export function OfflineBanner() {
  const [status, setStatus] = useState<'hidden' | 'offline' | 'online'>('hidden');
  const translateY = useSharedValue(-80);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = !!state.isConnected && !!state.isInternetReachable;

      if (!isOnline) {
        setStatus('offline');
        translateY.value = withTiming(0, { duration: 220 });
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
        }
      } else {
        if (status === 'offline') {
          setStatus('online');
          translateY.value = withTiming(0, { duration: 220 });
          if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
          }
          hideTimerRef.current = setTimeout(() => {
            translateY.value = withTiming(-80, { duration: 220 });
            setTimeout(() => setStatus('hidden'), 220);
          }, 2000);
        }
      }
    });

    return () => {
      unsubscribe();
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [status]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (status === 'hidden') {
    return null;
  }

  const isOffline = status === 'offline';

  return (
    <Animated.View
      style={[animatedStyle]}
      className={`absolute left-0 right-0 z-50 px-4 py-3 ${
        isOffline ? 'bg-amber-400' : 'bg-green-500'
      }`}
    >
      <View className="pt-10">
        <Text className="text-white text-sm font-medium text-center">
          {isOffline
            ? '📴 آپ آف لائن ہیں — پرانا ڈیٹا دکھایا جا رہا ہے'
            : '✅ واپس آن لائن'}
        </Text>
      </View>
    </Animated.View>
  );
}
