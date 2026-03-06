/**
 * app/(owner)/dashboard.tsx
 * Owner's main dashboard
 * Shows: Real-time stats, pending orders, notifications, demand alerts, verification status
 */

import { useAuthStore } from '@store/authStore';
import { useOwnerDashViewModel } from '@viewModels/useOwnerDashViewModel';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { CustomButton } from '../../src/components/CustomButton';

export default function OwnerDashboardScreen() {
    const router = useRouter();
  const { user } = useAuthStore();
  const {
    dashStats,
    isLoading,
    isRefreshing,
    isDashboardReady,
    refreshDashboard,
  } = useOwnerDashViewModel();

  const [selectedTab, setSelectedTab] = useState<
    'stats' | 'orders' | 'alerts' | 'notifications'
  >('stats');

  if (isLoading && !isDashboardReady) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  if (!dashStats.shop) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-4">
        <Text className="text-xl font-semibold text-gray-800 mb-2">
          دکان رجسٹر کریں
        </Text>
        <Text className="text-gray-600 mb-4 text-center">
          اپنی دکان رجسٹر کریں اور گاہکوں تک پہنچیں
        </Text>
        <CustomButton 
          title="Register Shop" 
          onPress={() => router.push('/(owner)/register-shop')} 
        />
      </View>
    );
  }

  const stats = dashStats.stats || {
    totalOrders: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalProducts: 0,
    activeDealCount: 0,
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={refreshDashboard}
          tintColor="#dc2626"
        />
      }
    >
      {/* Shop Header */}
      <View className="bg-white p-4 border-b border-gray-200">
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-800">
              {dashStats.shop.name}
            </Text>
            <Text className="text-sm text-gray-600 mt-1">
              {dashStats.shop.location.city}
            </Text>
          </View>
          <View className="px-2 py-1 rounded-full bg-blue-100">
            <Text className="text-xs font-medium text-blue-600">
              ACTIVE
            </Text>
          </View>
        </View>
      </View>

      {/* Stats Cards */}
      <View className="p-4 space-y-3">
        <View className="grid grid-cols-2 gap-3">
          {/* Total Orders */}
          <TouchableOpacity className="bg-white p-4 rounded-lg shadow-sm">
            <View className="flex-row items-center mb-2">
              <Text className="text-xl">📦</Text>
              <Text className="ml-2 text-xs text-gray-600">Orders</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-800">
              {stats.totalOrders}
            </Text>
            <Text className="text-xs text-gray-500 mt-1">
              {dashStats.pendingOrders} pending
            </Text>
          </TouchableOpacity>

          {/* Total Revenue */}
          <TouchableOpacity className="bg-white p-4 rounded-lg shadow-sm">
            <View className="flex-row items-center mb-2">
              <Text className="text-xl">📈</Text>
              <Text className="ml-2 text-xs text-gray-600">Revenue</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-800">
              Rs {(stats.totalRevenue / 1000).toFixed(1)}K
            </Text>
            <Text className="text-xs text-gray-500 mt-1">This month</Text>
          </TouchableOpacity>

          {/* Average Rating */}
          <TouchableOpacity className="bg-white p-4 rounded-lg shadow-sm">
            <View className="flex-row items-center mb-2">
              <Text className="text-xl">⭐</Text>
              <Text className="ml-2 text-xs text-gray-600">Rating</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-800">
              {stats.averageRating.toFixed(1)}
            </Text>
            <Text className="text-xs text-gray-500 mt-1">
              Based on reviews
            </Text>
          </TouchableOpacity>

          {/* Active Products */}
          <TouchableOpacity className="bg-white p-4 rounded-lg shadow-sm">
            <View className="flex-row items-center mb-2">
              <Text className="text-xl">📊</Text>
              <Text className="ml-2 text-xs text-gray-600">Products</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-800">
              {stats.totalProducts}
            </Text>
            <Text className="text-xs text-gray-500 mt-1">
              {stats.activeDealCount} with deals
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Selection */}
      <View className="px-4 py-2 flex-row space-x-2">
        {(['stats', 'orders', 'alerts', 'notifications'] as const).map(
          (tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setSelectedTab(tab)}
              className={`px-4 py-2 rounded-full ${
                selectedTab === tab
                  ? 'bg-red-500'
                  : 'bg-white border border-gray-300'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  selectedTab === tab ? 'text-white' : 'text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>

      {/* Pending Orders */}
      {selectedTab === 'orders' && (
        <View className="p-4">
          {dashStats.pendingOrders > 0 ? (
            <View>
              <Text className="font-semibold text-gray-800 mb-3">
                Pending Orders ({dashStats.pendingOrders})
              </Text>
              <FlatList
                data={dashStats.recentOrders.slice(0, 5)}
                scrollEnabled={false}
                renderItem={({ item: order }) => (
                  <TouchableOpacity className="bg-white p-3 rounded-lg mb-2 flex-row justify-between items-center">
                    <View className="flex-1">
                      <Text className="font-medium text-gray-800">
                        Order #{order.id?.substring(0, 8)}
                      </Text>
                      <Text className="text-sm text-gray-600 mt-1">
                        {order.items?.length || 0} items
                      </Text>
                    </View>
                    <View className="px-2 py-1 bg-blue-100 rounded">
                      <Text className="text-xs font-medium text-blue-600">
                        Pending
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id}
              />
            </View>
          ) : (
            <View className="bg-white p-4 rounded-lg items-center">
              <Text className="text-lg">✅</Text>
              <Text className="text-gray-600 mt-2">No pending orders</Text>
            </View>
          )}
        </View>
      )}

      {/* Demand Alerts */}
      {selectedTab === 'alerts' && (
        <View className="p-4">
          {dashStats.demandAlerts.length > 0 ? (
            <View>
              <Text className="font-semibold text-gray-800 mb-3">
                High Demand Categories
              </Text>
              <FlatList
                data={dashStats.demandAlerts}
                scrollEnabled={false}
                renderItem={({ item: alert }) => (
                  <View className="bg-white p-3 rounded-lg mb-2 border-l-4 border-red-500">
                    <View className="flex-row justify-between items-center">
                      <Text className="font-medium text-gray-800">
                        {alert.productName}
                      </Text>
                      <View className="bg-red-100 px-2 py-1 rounded">
                        <Text className="text-red-600 font-semibold">
                          {alert.searchCount}+
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs text-gray-600 mt-1">
                      Update your stock for better sales
                    </Text>
                  </View>
                )}
                keyExtractor={(item) => item.productName}
              />
            </View>
          ) : (
            <View className="bg-white p-4 rounded-lg items-center">
              <Text className="text-gray-600">No demand alerts at the moment</Text>
            </View>
          )}
        </View>
      )}

      {/* Notifications */}
      {selectedTab === 'notifications' && (
        <View className="p-4">
          <View className="bg-white p-4 rounded-lg items-center">
            <Text className="text-gray-600">No notifications yet</Text>
          </View>
        </View>
      )}

      {/* Stats Tab */}
      {selectedTab === 'stats' && (
        <View className="p-4">
          <View className="bg-white p-4 rounded-lg">
            <Text className="font-semibold text-gray-800 mb-4">
              Performance Overview
            </Text>
            <View className="space-y-3">
              <View className="flex-row justify-between items-center pb-3 border-b border-gray-200">
                <Text className="text-gray-600">Completed Orders</Text>
                <Text className="font-bold text-gray-800">
                  {dashStats.completedOrders}
                </Text>
              </View>
              <View className="flex-row justify-between items-center pb-3 border-b border-gray-200">
                <Text className="text-gray-600">Avg Order Value</Text>
                <Text className="font-bold text-gray-800">
                  Rs{' '}
                  {stats.totalOrders > 0
                    ? Math.round(stats.totalRevenue / stats.totalOrders)
                    : 0}
                </Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Active Deals</Text>
                <Text className="font-bold text-red-600">
                  {stats.activeDealCount}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <View className="p-4 pb-8">
        <CustomButton
          title="Refresh Dashboard"
          onPress={refreshDashboard}
          disabled={isRefreshing}
        />
      </View>
    </ScrollView>
  );
}
