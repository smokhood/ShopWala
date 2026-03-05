/**
 * Auth Store - Global authentication state management
 * Uses Zustand with SecureStore persistence for security
 */
import type { User } from '@models/User';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setOnboarded: () => void;
  clearUser: () => void;
  resetAuthState: () => Promise<void>; // Development only
  logAuthState: () => void; // Development only
  finishRehydration: () => void; // Call this after rehydration completes
}

type AuthStore = AuthState & AuthActions;

// SecureStore adapter for Zustand persist
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const value = await SecureStore.getItemAsync(name);
      console.log(`[SecureStore] getItem(${name}):`, value ? 'Found' : 'Not found');
      return value;
    } catch (error) {
      console.error('SecureStore getItem error:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
      console.log(`[SecureStore] setItem(${name}): Success`);
    } catch (error) {
      console.error('SecureStore setItem error:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
      console.log(`[SecureStore] removeItem(${name}): Success`);
    } catch (error) {
      console.error('SecureStore removeItem error:', error);
    }
  },
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isLoading: true, // Start as true, set to false after rehydration
      isAuthenticated: false,
      hasCompletedOnboarding: false,

      // Actions
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          hasCompletedOnboarding: user?.isOnboarded ?? false,
          isLoading: false,
        }),

      setLoading: (loading) =>
        set({
          isLoading: loading,
        }),

      setOnboarded: () =>
        set((state) => ({
          user: state.user ? { ...state.user, isOnboarded: true } : null,
          hasCompletedOnboarding: true,
        })),

      clearUser: () =>
        set({
          user: null,
          isAuthenticated: false,
          hasCompletedOnboarding: false,
          isLoading: false,
        }),

      // Development-only: Reset all auth state and SecureStore
      resetAuthState: async () => {
        set({
          user: null,
          isAuthenticated: false,
          hasCompletedOnboarding: false,
          isLoading: true, // Will be set to false after rehydration
        });
        // Clear from SecureStore
        try {
          await SecureStore.deleteItemAsync('dukandar-auth-storage');
          console.log('✅ Auth state reset');
        } catch (error) {
          console.error('Error resetting auth:', error);
        }
      },

      // Development-only: Log current state
      logAuthState: () => {
        const state = get();
        console.log('📋 [Auth State]', {
          user: state.user ? `${state.user.phone} (${state.user.role})` : 'null',
          isAuthenticated: state.isAuthenticated,
          isLoading: state.isLoading,
          hasCompletedOnboarding: state.hasCompletedOnboarding,
        });
      },

      // Finish rehydration - called when SecureStore load is complete
      finishRehydration: () => {
        const state = get();
        console.log('[Rehydration Complete]', {
          hasUser: !!state.user,
          isAuthenticated: state.isAuthenticated,
        });
        set({ isLoading: false });
      },
    }),
    {
      name: 'dukandar-auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      // Note: onRehydrateStorage doesn't work reliably for our use case
      // Instead, we manually call finishRehydration() in root layout
    }
  )
);
