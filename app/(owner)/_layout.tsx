/**
 * Owner Layout - Tab navigator for owner screens
 */
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { useLanguage } from '../../src/hooks/useLanguage';

export default function OwnerLayout() {
  const { t, language } = useLanguage();
  const [, forceUpdate] = useState(0);

  // Force re-render when language changes
  useEffect(() => {
    console.log('[Owner Layout] Language changed to:', language);
    console.log('[Owner Layout] t(owner.dashboard) =', t('owner.dashboard'));
    console.log('[Owner Layout] t(owner.catalog) =', t('owner.catalog'));
    forceUpdate(prev => prev + 1);
  }, [language, t]);
  return (
    <Tabs
      key={language}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#dc2626',
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
        name="dashboard"
        options={{
          title: t('owner.dashboard'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="catalog-builder"
        options={{
          title: t('owner.catalog'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="layers" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add-deal"
        options={{
          title: t('owner.add_deal') || 'Deals',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetag" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="manage-catalog"
        options={{
          title: t('owner.catalog') || 'Products',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('owner.settings'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="register-shop"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="add-product"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}
