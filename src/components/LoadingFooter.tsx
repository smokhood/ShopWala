/**
 * LoadingFooter Component - Shows loading indicator for paginated lists
 * Used with FlashList/FlatList when fetching next page
 */

import { ActivityIndicator, Text, View } from 'react-native';

interface LoadingFooterProps {
  isLoading?: boolean;
  text?: string;
}

export function LoadingFooter({ isLoading = false, text = 'Loading more...' }: LoadingFooterProps) {
  if (!isLoading) {
    return null;
  }

  return (
    <View className="py-5 items-center justify-center">
      <View className="bg-white border border-gray-200 rounded-full px-4 py-2 flex-row items-center">
        <ActivityIndicator size="small" color="#dc2626" />
        <Text className="text-gray-600 text-xs ml-2">{text}</Text>
      </View>
    </View>
  );
}
