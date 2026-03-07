/**
 * Customer Layout - Bottom tab navigator
 */
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Tabs } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../src/hooks/useLanguage';
import { getNotifications } from '../../src/services/notificationService';
import { useAuthStore } from '../../src/store/authStore';

export default function CustomerLayout() {
  const { user } = useAuthStore();
  const { t, language } = useLanguage();
  const [, forceUpdate] = useState(0);

  // Force re-render when language changes
  useEffect(() => {
    console.log('[Customer Layout] Language changed to:', language);
    console.log('[Customer Layout] t(common.search) =', t('common.search'));
    console.log('[Customer Layout] t(customer.saved) =', t('customer.saved'));
    forceUpdate(prev => prev + 1);
  }, [language, t]);

  // Fetch notifications to get unread count
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => {
      if (!user?.id) return [];
      return getNotifications(user.id);
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // Refresh every 60 seconds instead of 30 for better performance
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Calculate unread count
  const unreadCount = useMemo(() => {
    return notifications.filter((n: any) => !n.read).length;
  }, [notifications]);

  return (
    <Tabs
      key={language}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 8,
          paddingTop: 6,
          height: 68,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('common.search'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favourites"
        options={{
          title: t('customer.saved'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t('customer.notifications') || 'Notifications',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-orders"
        options={{
          title: t('customer.orders') || 'Orders',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="results"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="order"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="shop/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
