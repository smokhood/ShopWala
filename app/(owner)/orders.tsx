/**
 * app/(owner)/orders.tsx
 * Owner's orders management screen
 * Shows all orders received with ability to mark as dispatched
 */

import { Ionicons } from '@expo/vector-icons';
import type { Order } from '@models/Order';
import { useAuthStore } from '@store/authStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    View,
} from 'react-native';
import { CustomButton } from '../../src/components/CustomButton';
import { useLanguage } from '../../src/hooks/useLanguage';
import * as orderService from '../../src/services/orderService';

export default function OwnerOrdersScreen() {
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
            Alert.alert(t('common.done'), t('owner.order_marked_dispatched'));
        },
        onError: (error: any) => {
            Alert.alert(
                t('common.error'),
                error.message || t('owner.failed_update_order')
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

    const getStatusBadgeColor = (status?: string) => {
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

    const getStatusLabel = (status?: string) => {
        switch (status) {
            case 'pending':
                return t('owner.order_status_pending');
            case 'dispatched':
                return t('owner.order_status_dispatched');
            case 'completed':
                return t('owner.order_status_completed');
            default:
                return t('owner.order_status_pending');
        }
    };

    const renderOrderCard = (order: Order) => {
        const itemCount = order.items?.length || 0;
        const statusColor = getStatusBadgeColor(order.status);
        const previewItems = (order.items || []).slice(0, 3);
        const hasMoreItems = itemCount > previewItems.length;
        const isUpdatingThisOrder =
            dispatchMutation.isPending && dispatchMutation.variables === order.id;

        return (
            <View className="bg-white p-4 mb-3 rounded-2xl border border-gray-100">
                {/* Header */}
                <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                        <Text className="text-sm text-gray-500">
                            {t('owner.order_id')}: {order.id.slice(0, 8)}
                        </Text>
                        <Text className="text-lg font-semibold text-gray-900 mt-1" numberOfLines={1}>
                            {order.customerName || t('owner.customer_order')}
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
                    📦 {itemCount} {itemCount > 1 ? t('owner.items_plural') : t('owner.item_singular')}
                </Text>

                {/* Items List */}
                {previewItems.length > 0 && (
                    <View className="bg-gray-50 rounded-xl p-3 mb-3">
                        {previewItems.map((item, index) => (
                            <View
                                key={`${item.productId}-${index}`}
                                className={`flex-row justify-between items-center py-2 ${
                                    index !== previewItems.length - 1 ? 'border-b border-gray-200' : ''
                                }`}
                            >
                                <View className="flex-1 pr-2">
                                    <Text className="text-sm font-medium text-gray-800" numberOfLines={1}>
                                        {item.productName}
                                    </Text>
                                    <Text className="text-xs text-gray-600 mt-1">
                                        {item.quantity} {item.unit} @ Rs. {item.price}
                                    </Text>
                                </View>
                                <Text className="text-sm font-semibold text-gray-900">
                                    Rs. {(item.quantity * item.price).toFixed(0)}
                                </Text>
                            </View>
                        ))}
                        {hasMoreItems && (
                            <Text className="text-xs text-gray-500 mt-2">
                                +{itemCount - previewItems.length} {t('owner.more_items')}
                            </Text>
                        )}
                    </View>
                )}

                {/* Total & Notes */}
                <View className="bg-blue-50 rounded-xl p-3 mb-3">
                    <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-sm text-gray-700">{t('owner.total_label')}:</Text>
                        <Text className="text-lg font-bold text-blue-600">Rs. {order.subtotal}</Text>
                    </View>
                    {order.note && (
                        <View className="border-t border-blue-200 pt-2 mt-2">
                            <Text className="text-xs text-gray-600">📝 {t('owner.note_label')}: {order.note}</Text>
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
                            ✓ {t('owner.order_status_dispatched')}
                        </Text>
                    )}
                </View>

                {/* Action Button */}
                {order.status === 'pending' && (
                    <CustomButton
                        title={isUpdatingThisOrder ? t('owner.marking_order') : `✓ ${t('owner.mark_dispatched')}`}
                        onPress={() => dispatchMutation.mutate(order.id)}
                        disabled={isUpdatingThisOrder}
                    />
                )}
                {order.status === 'dispatched' && (
                    <View className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                        <Text className="text-sm text-blue-700 text-center">
                            ⏳ {t('owner.waiting_customer_confirmation')}
                        </Text>
                    </View>
                )}
                {order.status === 'completed' && (
                    <View className="bg-green-50 border border-green-200 rounded-xl p-3">
                        <Text className="text-sm text-green-700 text-center">
                            ✅ {t('owner.order_completed')}
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
                <Text className="text-gray-600 mt-2">{t('owner.loading_orders')}</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <FlatList
                data={sortedOrders}
                keyExtractor={(item: Order) => item.id}
                renderItem={({ item }) => renderOrderCard(item)}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={() => refetch()}
                        tintColor="#dc2626"
                    />
                }
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
                ListHeaderComponent={
                    <View>
                        {/* Header */}
                        <View className="bg-white border border-gray-200 rounded-2xl px-4 pt-12 pb-4 mb-3">
                            <Text className="text-2xl font-bold text-gray-900">{t('owner.orders_title')}</Text>
                            <Text className="text-sm text-gray-600 mt-1">
                                {orders.length} {t('owner.total_short')} • {orders.filter((o: Order) => o.status === 'pending').length} {t('owner.pending_short')}
                            </Text>
                        </View>

                        {/* Filter Tabs */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 12, paddingRight: 8 }}
                        >
                            {(['all', 'pending', 'dispatched', 'completed'] as const).map((tab) => (
                                <Pressable
                                    key={tab}
                                    onPress={() => setFilter(tab)}
                                    className={`mr-2 px-4 py-2 rounded-full ${
                                        filter === tab ? 'bg-red-600' : 'bg-white border border-gray-200'
                                    }`}
                                >
                                    <Text
                                        className={`text-sm font-medium ${
                                            filter === tab ? 'text-white' : 'text-gray-700'
                                        }`}
                                    >
                                        {tab === 'all'
                                            ? t('common.view_all')
                                            : tab === 'pending'
                                            ? t('owner.order_status_pending')
                                            : tab === 'dispatched'
                                            ? t('owner.order_status_dispatched')
                                            : t('owner.order_status_completed')}
                                    </Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                }
                ListEmptyComponent={
                    <View className="items-center justify-center px-4 py-16">
                        <Ionicons name="cube-outline" size={64} color="#d1d5db" />
                        <Text className="text-xl font-semibold text-gray-800 mt-4">{t('owner.no_orders')}</Text>
                        <Text className="text-gray-600 text-center mt-2">
                            {filter === 'all'
                                ? t('owner.orders_will_appear_here')
                                : t('owner.no_filtered_orders', { status: getStatusLabel(filter) })}
                        </Text>
                    </View>
                }
            />
        </View>
    );
}
