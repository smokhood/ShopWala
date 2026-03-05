/**
 * Auth Stack Navigator - Layout for authentication screens
 */
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useAuthStore } from '../../src/store/authStore';

export default function AuthLayout() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'owner') {
        router.replace('/(owner)/dashboard');
      } else {
        router.replace('/(customer)');
      }
    }
  }, [isAuthenticated, user]);

  return (
    <>
      <StatusBar style="light" backgroundColor="#16a34a" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="role-select" />
        <Stack.Screen name="otp" />
      </Stack>
    </>
  );
}
