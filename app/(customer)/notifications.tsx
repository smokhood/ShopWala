/**
 * app/(customer)/notifications.tsx
 * Notifications screen with grouped notifications by time
 * Shows: new deals, shop openings, demand alerts, system messages
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    SectionList,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useLanguage } from '../../src/hooks/useLanguage';
import { deleteNotification, getNotifications, markAsRead } from '../../src/services/notificationService';
import { useAuthStore } from '../../src/store/authStore';

interface GroupedNotifications {
  today: any[];
  thisWeek: any[];
  older: any[];
}

function getNotificationDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof (value as { toDate?: unknown })?.toDate === 'function') {
    return ((value as { toDate: () => Date }).toDate());
  }

  const parsed = new Date(value as string | number);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(0);
  }

  return parsed;
}

export default function NotificationsScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { user } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch notifications
  const notificationsQuery = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error('User not found');
      return getNotifications(user.id);
    },
    enabled: !!user?.id,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user?.id) throw new Error('User not found');
      return markAsRead(user.id, notificationId);
    },
    onSuccess: () => {
      notificationsQuery.refetch();
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user?.id) throw new Error('User not found');
      return deleteNotification(user.id, notificationId);
    },
    onSuccess: () => {
      notificationsQuery.refetch();
    },
  });

  // Group notifications by time
  const groupedNotifications = useCallback((): GroupedNotifications => {
    const notifications = notificationsQuery.data || [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      today: notifications.filter((n) => {
        const notifDate = getNotificationDate(n.createdAt);
        return notifDate >= today;
      }),
      thisWeek: notifications.filter((n) => {
        const notifDate = getNotificationDate(n.createdAt);
        return notifDate >= weekAgo && notifDate < today;
      }),
      older: notifications.filter((n) => {
        const notifDate = getNotificationDate(n.createdAt);
        return notifDate < weekAgo;
      }),
    };
  }, [notificationsQuery.data]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await notificationsQuery.refetch();
    setIsRefreshing(false);
  }, [notificationsQuery]);

  const handleNotificationTap = useCallback(
    async (notification: any) => {
      if (!notification.read) {
        await markAsReadMutation.mutateAsync(notification.id);
      }

      if (notification.actionUrl) {
        router.push(notification.actionUrl);
      }
    },
    [markAsReadMutation, router]
  );

  const handleDelete = useCallback(
    (notification: any) => {
      deleteNotificationMutation.mutate(notification.id);
    },
    [deleteNotificationMutation]
  );

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      new_deal: '🏷️',
      shop_opened: '🏪',
      demand_alert: '📢',
      stock_request: '📦',
      new_shop_nearby: '📍',
      system: 'ℹ️',
    };
    return icons[type] || '🔔';
  };

  const renderRightAction = (notification: any) => (
    <TouchableOpacity
      className="bg-red-500 w-20 flex items-center justify-center"
      onPress={() => handleDelete(notification)}
    >
      <Text className="text-white text-lg">🗑️</Text>
    </TouchableOpacity>
  );

  const renderNotification = (notification: any) => (
    <Swipeable
      renderRightActions={() => renderRightAction(notification)}
      overshootRight={false}
    >
      <TouchableOpacity
        onPress={() => handleNotificationTap(notification)}
        className={`flex-row items-start p-4 border-b border-gray-100 ${
          !notification.read ? 'bg-blue-50' : 'bg-white'
        }`}
      >
        {!notification.read && (
          <View className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3" />
        )}
        <Text className="text-2xl mr-3">{getNotificationIcon(notification.type)}</Text>
        <View className="flex-1">
          <Text
            className={`${
              !notification.read ? 'font-bold' : 'font-semibold'
            } text-gray-900 text-sm`}
          >
            {notification.title}
          </Text>
          <Text className="text-gray-600 text-xs mt-1">{notification.body}</Text>
        </View>
        <Text className="text-gray-500 text-xs ml-2">
          {formatTimeAgo(getNotificationDate(notification.createdAt), t)}
        </Text>
      </TouchableOpacity>
    </Swipeable>
  );

  const notifsByTime = groupedNotifications();
  const hasUnread =
    notifsByTime.today.some((n) => !n.read) ||
    notifsByTime.thisWeek.some((n) => !n.read) ||
    notifsByTime.older.some((n) => !n.read);

  const sections = [
    { title: t('customer.today'), data: notifsByTime.today },
    { title: t('customer.this_week'), data: notifsByTime.thisWeek },
    { title: t('customer.older'), data: notifsByTime.older },
  ].filter((s) => s.data.length > 0);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-gray-900">{t('customer.notifications')}</Text>
        {hasUnread && (
          <TouchableOpacity
            onPress={() => {
              // Mark all as read
              notifsByTime.today
                .concat(notifsByTime.thisWeek, notifsByTime.older)
                .filter((n) => !n.read)
                .forEach((n) => markAsReadMutation.mutate(n.id));
            }}
            className="px-3 py-1"
          >
            <Text className="text-xs font-semibold text-green-600">{t('customer.mark_all_read')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {notificationsQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#dc2626" />
        </View>
      ) : sections.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-4xl mb-4">🔔</Text>
          <Text className="text-lg font-semibold text-gray-900">
            {t('customer.no_notifications')}
          </Text>
          <Text className="text-sm text-gray-600 mt-2">
            {t('customer.all_caught_up')}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections.map((s) => ({
            title: s.title,
            data: s.data,
          }))}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderNotification(item)}
          renderSectionHeader={({ section: { title } }) => (
            <View className="bg-gray-100 px-6 py-2">
              <Text className="text-xs font-bold text-gray-600 uppercase">
                {title}
              </Text>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#dc2626"
            />
          }
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </View>
  );
}

function formatTimeAgo(date: Date, t: (key: string, options?: any) => string): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return t('customer.just_now');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t('customer.minutes_ago_short', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('customer.hours_ago_short', { count: hours });
  const days = Math.floor(hours / 24);
  return t('customer.days_ago_short', { count: days });
}
