import {
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
    registerNotificationResponseHandler,
    registerPushTokenForUser,
} from '@services/notificationService';
import { initDB } from '@services/offlineService';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { useURL } from 'expo-linking';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ErrorInfo, useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { ForceUpdateModal } from '../src/components/ForceUpdateModal';
import { useAppVersion } from '../src/hooks/useAppVersion';
import { initI18n } from '../src/i18n';
import { useAuthStore } from '../src/store/authStore';
import { isAppDeepLink, parseDeepLink } from '../src/utils/deepLinks';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

// Configure TanStack Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false, // Optimize for mobile
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
    const { needsUpdate, playStoreUrl, isChecking: isVersionChecking } = useAppVersion();
  const { user, isLoading, isAuthenticated, hasCompletedOnboarding, logAuthState, finishRehydration } = useAuthStore();

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
        // Keep auth state stable by default in development.
        // If you need a one-off reset, call resetAuthState() manually from a debug action.
        if (__DEV__) {
          console.log('🧪 [DEV MODE] Keeping persisted auth state');
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
    const inOnboardingGroup = segments[0] === '(onboarding)';

    console.log('[Auth Guard] Running', {
      isAuthenticated,
      userRole: user?.role,
      isOnboarded: user?.isOnboarded,
      currentSegment: segments[0],
      inAuthGroup,
      inCustomerGroup,
      inOwnerGroup,
      inOnboardingGroup,
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
      } else if (!user.isOnboarded && !hasCompletedOnboarding) {
        // Not onboarded → show onboarding
        console.log('[Redirect] Not onboarded → /(onboarding)');
        if (!inOnboardingGroup) {
          router.replace('/(onboarding)');
        }
      } else if (user.role === 'customer') {
        // Customer role
        console.log('[Redirect] Customer role → /(customer)');
        if (!inCustomerGroup && !inAuthGroup && !inOnboardingGroup) {
          router.replace('/(customer)');
        }
      } else if (user.role === 'owner') {
        // Owner role
        console.log('[Redirect] Owner role → /(owner)/dashboard');
        if (!inOwnerGroup && !inAuthGroup && !inOnboardingGroup) {
          router.replace('/(owner)/dashboard');
        }
      }
    }
  }, [isAuthenticated, user, segments, isLoading, fontsLoaded, hasCompletedOnboarding]);

  // Register push token once user is authenticated.
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      return;
    }

    registerPushTokenForUser(user.id).catch((error) => {
      console.warn('Push registration warning:', (error as Error).message);
    });
  }, [isAuthenticated, user?.id]);

  // Handle notification tap navigation.
  useEffect(() => {
    let cleanup: (() => void) | null = null;

    registerNotificationResponseHandler((path) => {
      router.push(path as any);
    })
      .then((remove) => {
        cleanup = remove;
      })
      .catch((error) => {
        console.warn('Notification response setup warning:', (error as Error).message);
      });

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [router]);

  // Handle deep link navigation
  const incomingUrl = useURL();
  useEffect(() => {
    if (!incomingUrl) {
      return;
    }

    // Only process app deep links
    if (!isAppDeepLink(incomingUrl)) {
      console.log('[Deep Link] Not an app deep link, ignoring:', incomingUrl);
      return;
    }

    // Wait until user is authenticated and onboarded
    if (!isAuthenticated || !user?.isOnboarded) {
      console.log('[Deep Link] User not ready, queueing navigation:', incomingUrl);
      // TODO: Could store in state to process after auth completes
      return;
    }

    // Parse and navigate
    const result = parseDeepLink(incomingUrl);
    console.log('[Deep Link] Parsed:', result);

    if (result.type === 'shop' && result.path) {
      console.log('[Deep Link] Navigating to shop:', result.shopId);
      router.push(result.path as any);
    } else if (result.type === 'search' && result.path) {
      console.log('[Deep Link] Navigating to search:', result.query);
      router.push(result.path as any);
    } else {
      console.warn('[Deep Link] Unknown deep link type:', result.type);
    }
  }, [incomingUrl, isAuthenticated, user?.isOnboarded, router]);

  // Show blank screen while fonts/auth loading
  if (!fontsLoaded || isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#16a34a' }} />
    );
  }

  const handleBoundaryError = (error: Error, errorInfo: ErrorInfo) => {
    console.error('[Root ErrorBoundary] Error caught:', error);
    console.error('[Root ErrorBoundary] Component stack:', errorInfo.componentStack);
    // In production, send to monitoring service:
    // Sentry.captureException(error, { contexts: { react: errorInfo } });
  };

  return (
    <ErrorBoundary onError={handleBoundaryError}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(customer)" />
            <Stack.Screen name="(owner)" />
          </Stack>
                  {!isVersionChecking && needsUpdate && (
                    <ForceUpdateModal visible={true} playStoreUrl={playStoreUrl} />
                  )}
        </QueryClientProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
