import {
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
} from '@expo-google-fonts/inter';
import { initDB } from '@services/offlineService';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css';
import { initI18n } from '../src/i18n';
import { useAuthStore } from '../src/store/authStore';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

// Configure TanStack Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { user, isLoading, isAuthenticated, hasCompletedOnboarding, resetAuthState, logAuthState, finishRehydration } = useAuthStore();

  // Load fonts
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // In development, reset auth state to test auth flow
        if (__DEV__) {
          console.log('🧪 [DEV MODE] Resetting auth state...');
          // Uncomment below line to reset auth on every app start (for testing):
          await resetAuthState();
        }

        // Initialize i18n
        await initI18n();

        // Initialize SQLite database
        await initDB();

        console.log('✅ App initialized');
        logAuthState();

        // Signal that rehydration is complete
        // This allows auth guard to run
        finishRehydration();
      } catch (error) {
        console.error('App initialization error:', error);
      }
    };

    initializeApp();
  }, []);

  // Hide splash screen when ready AND auth state determined
  useEffect(() => {
    console.log('[Loading State]', {
      fontsLoaded,
      isLoading,
      isAuthenticated,
      userRole: user?.role,
    });

    if (fontsLoaded && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLoading]);

  // Auth guard - redirect based on auth state
  useEffect(() => {
    // Don't run auth guard while loading fonts or rehydrating
    if (!fontsLoaded || isLoading) {
      console.log('[Auth Guard] Waiting for fonts/rehydration', {
        fontsLoaded,
        isLoading,
      });
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inCustomerGroup = segments[0] === '(customer)';
    const inOwnerGroup = segments[0] === '(owner)';

    console.log('[Auth Guard] Running', {
      isAuthenticated,
      userRole: user?.role,
      currentSegment: segments[0],
      inAuthGroup,
      inCustomerGroup,
      inOwnerGroup,
    });

    if (!isAuthenticated) {
      // Not authenticated → redirect to auth
      console.log('[Redirect] Not authenticated → /(auth)/role-select');
      if (!inAuthGroup) {
        router.replace('/(auth)/role-select');
      }
    } else if (isAuthenticated && user) {
      // Authenticated
      if (!user.role) {
        // No role yet
        console.log('[Redirect] Authenticated but no role → /(auth)/role-select');
        if (!inAuthGroup) {
          router.replace('/(auth)/role-select');
        }
      } else if (user.role === 'customer') {
        // Customer role
        console.log('[Redirect] Customer role → /(customer)');
        if (!inCustomerGroup && !inAuthGroup) {
          router.replace('/(customer)');
        }
      } else if (user.role === 'owner') {
        // Owner role
        console.log('[Redirect] Owner role → /(owner)/dashboard');
        if (!inOwnerGroup && !inAuthGroup) {
          router.replace('/(owner)/dashboard');
        }
      }
    }
  }, [isAuthenticated, user, segments, isLoading, fontsLoaded]);

  // Show blank screen while fonts/auth loading
  if (!fontsLoaded || isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#16a34a' }} />
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(customer)" />
          <Stack.Screen name="(owner)" />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
