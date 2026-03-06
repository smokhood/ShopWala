/**
 * app/(onboarding)/_layout.tsx
 * Onboarding stack layout
 * Shown only to new users before main app
 */

import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
        animationTypeForReplace: 'push',
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
