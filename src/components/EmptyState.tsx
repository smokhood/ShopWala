/**
 * EmptyState Component - Reusable empty state UI
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useLanguage } from '../hooks/useLanguage';

type EmptyStateVariant =
  | 'no_results'
  | 'no_shops'
  | 'offline'
  | 'permission_denied'
  | 'empty_favourites'
  | 'empty_catalog'
  | 'empty_orders';

interface EmptyStateProps {
  variant: EmptyStateVariant;
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  variant,
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { t } = useLanguage();

  const variantConfig: Record<
    EmptyStateVariant,
    {
      icon: string;
      title: string;
      subtitle: string;
    }
  > = {
    no_results: {
      icon: 'search',
      title: t('customer.no_results'),
      subtitle: t('customer.try_different_search'),
    },
    no_shops: {
      icon: 'storefront',
      title: t('customer.no_shops_found'),
      subtitle: t('customer.select_search_range'),
    },
    offline: {
      icon: 'cloud-offline',
      title: t('customer.no_internet'),
      subtitle: t('customer.showing_cached_data'),
    },
    permission_denied: {
      icon: 'location',
      title: t('customer.enable_location_permission'),
      subtitle: t('customer.location_required_for_nearby'),
    },
    empty_favourites: {
      icon: 'heart-outline',
      title: t('customer.no_favourite_shops'),
      subtitle: t('customer.favourite_to_find_quickly'),
    },
    empty_catalog: {
      icon: 'list',
      title: t('customer.empty_catalog'),
      subtitle: t('customer.add_products_to_shop'),
    },
    empty_orders: {
      icon: 'receipt',
      title: t('customer.no_orders_yet'),
      subtitle: t('customer.orders_will_appear_here'),
    },
  };

  const config = variantConfig[variant];

  return (
    <View className="flex-1 items-center justify-center px-6 py-12">
      <View className="bg-white rounded-3xl border border-gray-100 px-6 py-7 items-center w-full max-w-sm">
      <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
        <Ionicons name={config.icon as any} size={40} color="#9ca3af" />
      </View>

      <Text className="text-xl font-bold text-gray-900 text-center mb-2">
        {title || config.title}
      </Text>

      <Text className="text-sm text-gray-600 text-center max-w-xs mb-6 leading-5">
        {subtitle || config.subtitle}
      </Text>

      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          className="bg-primary rounded-xl px-6 py-3"
        >
          <Text className="text-white font-semibold">{actionLabel}</Text>
        </Pressable>
      )}
      </View>
    </View>
  );
}
