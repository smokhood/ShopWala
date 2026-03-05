import { Ionicons } from '@expo/vector-icons';
import type { StockStatus } from '@models/Product';
import { Alert, Pressable, Text, View } from 'react-native';

interface StockBadgeProps {
  status: StockStatus;
  size?: 'sm' | 'md';
}

export function StockBadge({ status, size = 'sm' }: StockBadgeProps) {
  const isSmall = size === 'sm';

  if (status === 'in_stock') {
    return (
      <View
        className={`flex-row items-center rounded-full ${
          isSmall ? 'px-2 py-1' : 'px-3 py-1.5'
        } bg-green-100`}
      >
        <View className={`${isSmall ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-full bg-green-600`} />
        <Text className={`${isSmall ? 'text-xs' : 'text-sm'} text-green-700 font-medium ml-1.5`}>
          موجود
        </Text>
      </View>
    );
  }

  if (status === 'out_of_stock') {
    return (
      <View
        className={`flex-row items-center rounded-full ${
          isSmall ? 'px-2 py-1' : 'px-3 py-1.5'
        } bg-red-100`}
      >
        <View className={`${isSmall ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-full bg-red-600`} />
        <Text className={`${isSmall ? 'text-xs' : 'text-sm'} text-red-700 font-medium ml-1.5`}>
          ختم
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => Alert.alert('اسٹاک معلومات', 'کسی نے ابھی تک تصدیق نہیں کی')}
      className={`flex-row items-center rounded-full ${
        isSmall ? 'px-2 py-1' : 'px-3 py-1.5'
      } bg-orange-100`}
    >
      <Ionicons name="warning-outline" size={isSmall ? 12 : 14} color="#c2410c" />
      <Text className={`${isSmall ? 'text-xs' : 'text-sm'} text-orange-700 font-medium ml-1.5`}>
        غیر تصدیق شدہ
      </Text>
    </Pressable>
  );
}
