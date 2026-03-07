/**
 * app/(owner)/orders.tsx
 * Owner's orders management screen
 * Shows all orders received with ability to mark as dispatched
 */

import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Order } from '@models/Order';
import { useAuthStore } from '@store/authStore';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    RefreshControl,
    Text,
    View,
} from 'react-native';
import { useLanguage } from '../../src/hooks/useLanguage';
import * as orderService from '../../src/services/orderService';
import { CustomButton } from '../../src/components/CustomButton';

export default function OwnerOrdersScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { t } = useLanguage();
    const queryClient = useQueryClient();

    const [filter, setFilter] = useState<'all' | 'pending' | 'dispatched' | 'completed'>('all');

    // Fetch orders for owner's shop
    const { data: orders = [], isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['owner-orders', user?.shopId],
        queryFn: async () => {
            if (!user?.shopId) return [];
            return await orderService.getShopOrders(user.shopId);
        },
        enabled: !!user?.shopId,
    });

    // Mark as dispatched mutation
    const dispatchMutation = useMutation({
        mutationFn: async (orderId: string) => {
            return await orderService.markOrderDispatched(orderId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['owner-orders'] });
            Alert.alert('Success', 'Order marked as dispatched');
        },
        onError: (error: any) => {
            Alert.alert(
                'Error',
                error.message || 'Failed to update order'
            );
        },
    });

    // Filter orders by status
    const filteredOrders = useMemo(() => {
        if (filter === 'all') return orders;
        return orders.filter((order: Order) => order.status === filter);
    }, [orders, filter]);

    // Sort by newest first
    const sortedOrders = useMemo(() => {
        return [...filteredOrders].sort((a: Order, b: Order) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
            const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
        });
    }, [filteredOrders]);

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'pending':
                return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
            case 'dispatched':
                return { bg: 'bg-blue-100', text: 'text-blue-700' };
            case 'completed':
                return { bg: 'bg-green-100', text: 'text-green-700' };
            default:
                return { bg: 'bg-gray-100', text: 'text-gray-700' };
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending':
                return 'Pending';
            case 'dispatched':
                return 'Dispatched';
            case 'completed':
                return 'Completed';
            default:
                return status;
        }
    };

    const renderOrderCard = (order: Order) => {
        const itemCount = order.items?.length || 0;
        const statusColor = getStatusBadgeColor(order.status);

        return (
            <View key={order.id} className="bg-white p-4 mx-4 mb-3 rounded-2xl border border-gray-100">
                {/* Header */}
                <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                        <Text className="text-sm text-gray-500">Order ID: {order.id.slice(0, 8)}</Text>
                        <Text className="text-lg font-semibold text-gray-900 mt-1">
                            {order.items?.[0]?.shopName || 'Order'}
                        </Text>
                    </View>
                    <View className={`${statusColor.bg} rounded-full px-3 py-1`}>
                        <Text className={`text-xs font-semibold ${statusColor.text}`}>
                            {getStatusLabel(order.status)}
                        </Text>
                    </View>
                </View>

                {/* Items Count */}
                <Text className="text-sm text-gray-600 mb-3">
                    📦 {itemCount} item{itemCount > 1 ? 's' : ''}
                </Text>

                {/* Items List */}
                {order.items && order.items.length > 0 && (
                    <View className="bg-gray-50 rounded-xl p-3 mb-3 max-h-32">
                        <FlatList
                            data={order.items}
                            keyExtractor={(item) => item.productId}
                            scrollEnabled={false}
                            renderItem={({ item }) => (
                                <View className="flex-row justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                                    <View className="flex-1">
                                        <Text className="text-sm font-medium text-gray-800">
                                            {item.productName}
                                        </Text>
                                        <Text className="text-xs text-gray-600 mt-1">
                                            {item.quantity} {item.unit} @ Rs. {item.price}
                                        </Text>
                                    </View>
                                    <Text className="text-sm font-semibold text-gray-900 ml-2">
                                        Rs. {(item.quantity * item.price).toFixed(0)}
                                    </Text>
                                </View>
                            )}
                        />
                    </View>
                )}

                {/* Total & Notes */}
                <View className="bg-blue-50 rounded-xl p-3 mb-3">
                    <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-sm text-gray-700">Total:</Text>
                        <Text className="text-lg font-bold text-blue-600">Rs. {order.subtotal}</Text>
                    </View>
                    {order.note && (
                        <View className="border-t border-blue-200 pt-2 mt-2">
                            <Text className="text-xs text-gray-600">📝 Note: {order.note}</Text>
                        </View>
                    )}
                </View>

                {/* Timestamps */}
                <View className="flex-row justify-between mb-3">
                    <Text className="text-xs text-gray-500">
                        🕐 {order.createdAt instanceof Date 
                            ? order.createdAt.toLocaleDateString() 
                            : new Date(order.createdAt).toLocaleDateString()}
                    </Text>
                    {order.dispatchedAt && (
                        <Text className="text-xs text-green-600">
                            ✓ Dispatched
                        </Text>
                    )}
                </View>

                {/* Action Button */}
                {order.status === 'pending' && (
                    <CustomButton
                        title={dispatchMutation.isPending ? 'Marking...' : '✓ Mark Dispatched'}
                        onPress={() => dispatchMutation.mutate(order.id)}
                        disabled={dispatchMutation.isPending}
                    />
                )}
                {order.status === 'dispatched' && (
                    <View className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                        <Text className="text-sm text-blue-700 text-center">
                            ⏳ Waiting for customer confirmation
                        </Text>
                    </View>
                )}
                {order.status === 'completed' && (
                    <View className="bg-green-50 border border-green-200 rounded-xl p-3">
                        <Text className="text-sm text-green-700 text-center">
                            ✅ Order completed
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator size="large" color="#dc2626" />
                <Text className="text-gray-600 mt-2">Loading orders...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white border-b border-gray-200 px-4 py-4">
                <Text className="text-2xl font-bold text-gray-900">Orders</Text>
                <Text className="text-sm text-gray-600 mt-1">
                    {orders.length} total • {orders.filter((o: Order) => o.status === 'pending').length} pending
                </Text>
            </View>

            {/* Filter Tabs */}
            <View className="bg-white border-b border-gray-200 flex-row px-4 py-3 gap-2">
                {(['all', 'pending', 'dispatched', 'completed'] as const).map((tab) => (
                    <Pressable
                        key={tab}
                        onPress={() => setFilter(tab)}
                        className={`px-4 py-2 rounded-full ${
                            filter === tab
                                ? 'bg-red-600'
                                : 'bg-gray-100'
                        }`}
                    >
                        <Text
                            className={`text-sm font-medium ${
                                filter === tab ? 'text-white' : 'text-gray-700'
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {/* Orders List */}
            {sortedOrders.length === 0 ? (
                <View className="flex-1 items-center justify-center px-4">
                    <Ionicons name="cube-outline" size={64} color="#d1d5db" />
                    <Text className="text-xl font-semibold text-gray-800 mt-4">No orders</Text>
                    <Text className="text-gray-600 text-center mt-2">
                        {filter === 'all' 
                            ? 'Orders will appear here when customers place them'
                            : `No ${filter} orders`}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={sortedOrders}
                    keyExtractor={(item: Order) => item.id}
                    renderItem={({ item }) => renderOrderCard(item)}
                    scrollEnabled={true}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={() => refetch()}
                            tintColor="#dc2626"
                        />
                    }
                    contentContainerStyle={{ paddingVertical: 12 }}
                />
            )}
        </View>
    );
}
