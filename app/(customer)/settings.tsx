import { useAuthStore } from '@store/authStore';
import { useAuthViewModel } from '@viewModels/useAuthViewModel';
import { useState } from 'react';
import { Alert, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { CustomButton } from '../../src/components/CustomButton';
import { useLanguage } from '../../src/hooks/useLanguage';

export default function CustomerSettingsScreen() {
  const { user } = useAuthStore();
  const { language, toggleLanguage } = useLanguage();
  const { logout, deleteAccount } = useAuthViewModel();
  const [isLanguageBusy, setIsLanguageBusy] = useState(false);

  const handleToggleLanguage = async () => {
    setIsLanguageBusy(true);
    try {
      await toggleLanguage();
    } finally {
      setIsLanguageBusy(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            Alert.alert('Error', 'Logout failed. Please try again.');
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and personal app data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'Are you absolutely sure you want to permanently delete your account?',
              [
                { text: 'No', style: 'cancel' },
                {
                  text: 'Yes, Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteAccount();
                    } catch (error: any) {
                      Alert.alert('Delete Failed', error?.message || 'Could not delete account right now.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-white p-4 mb-4">
        <Text className="text-lg font-bold text-gray-800">Account</Text>
        <Text className="text-sm text-gray-600 mt-2">{user?.name || 'Customer'}</Text>
        <Text className="text-sm text-gray-600">{user?.phone || '-'}</Text>
      </View>

      <View className="bg-white p-4 mb-4">
        <Text className="text-lg font-bold text-gray-800 mb-3">Preferences</Text>
        <TouchableOpacity
          className="flex-row justify-between items-center py-3 border-b border-gray-100"
          onPress={handleToggleLanguage}
          disabled={isLanguageBusy}
        >
          <Text className="text-gray-700">Language</Text>
          <Text className="text-gray-600">{language === 'en' ? 'English' : 'Urdu'}</Text>
        </TouchableOpacity>
      </View>

      <View className="bg-white p-4 mb-4">
        <Text className="text-lg font-bold text-gray-800 mb-3">Help & Legal</Text>
        <TouchableOpacity
          className="flex-row justify-between items-center py-3 border-b border-gray-100"
          onPress={() => Linking.openURL('https://dukandar.com/privacy')}
        >
          <Text className="text-gray-700">Privacy Policy</Text>
          <Text className="text-lg">▶️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row justify-between items-center py-3 border-b border-gray-100"
          onPress={() => Linking.openURL('https://dukandar.com/terms')}
        >
          <Text className="text-gray-700">Terms of Service</Text>
          <Text className="text-lg">▶️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row justify-between items-center py-3"
          onPress={() => Linking.openURL('https://dukandar.com/support')}
        >
          <Text className="text-gray-700">Contact Support</Text>
          <Text className="text-lg">▶️</Text>
        </TouchableOpacity>
      </View>

      <View className="bg-white p-4 mb-4">
        <Text className="text-lg font-bold text-red-700 mb-2">Danger Zone</Text>
        <Text className="text-sm text-gray-600 mb-4">
          Permanently remove your account and personal data from the app.
        </Text>
        <TouchableOpacity
          onPress={handleDeleteAccount}
          className="py-3 px-4 border border-red-300 bg-red-50 rounded-lg"
        >
          <Text className="text-center font-semibold text-red-700">Delete Account</Text>
        </TouchableOpacity>
      </View>

      <View className="p-4 pb-8">
        <CustomButton title="Log Out" onPress={handleLogout} />
      </View>
    </ScrollView>
  );
}
