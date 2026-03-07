/**
 * ForceUpdateModal - Non-dismissible update prompt
 * Shown when app version is below minimum required
 */

import { Linking, Modal, Pressable, Text, View } from 'react-native';

interface ForceUpdateModalProps {
  visible: boolean;
  playStoreUrl: string;
}

export function ForceUpdateModal({ visible, playStoreUrl }: ForceUpdateModalProps) {
  const handleOpenStore = async () => {
    try {
      await Linking.openURL(playStoreUrl);
    } catch (error) {
      console.error('[ForceUpdateModal] Failed to open store URL:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        // Intentionally non-dismissible
      }}
    >
      <View className="flex-1 bg-black/45 items-center justify-center px-6">
        <View className="w-full max-w-sm bg-white rounded-2xl p-6">
          <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
            نئی اپڈیٹ ضروری ہے
          </Text>
          <Text className="text-gray-600 text-center mb-6">
            بہتر تجربے کے لیے ایپ اپڈیٹ کریں
          </Text>

          <Pressable
            onPress={handleOpenStore}
            className="bg-red-600 rounded-xl py-3 px-4"
          >
            <Text className="text-white text-center font-semibold">
              Google Play پر جائیں
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
