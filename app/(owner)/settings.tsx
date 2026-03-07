/**
 * app/(owner)/settings.tsx
 * Owner's shop settings and profile management
 */

import { updateShop } from '@services/shopService';
import { useAuthStore } from '@store/authStore';
import { useAuthViewModel } from '@viewModels/useAuthViewModel';
import { useState } from 'react';
import {
    Alert,
    Linking,
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { CustomButton } from '../../src/components/CustomButton';
import { TextInput } from '../../src/components/TextInput';

type OwnerNotificationSettings = {
  orders: boolean;
  reviews: boolean;
  promotions: boolean;
};

const DEFAULT_NOTIFICATION_SETTINGS: OwnerNotificationSettings = {
  orders: true,
  reviews: true,
  promotions: false,
};

function getInitialNotificationSettings(user: unknown): OwnerNotificationSettings {
  const saved = (user as { ownerNotificationSettings?: Partial<OwnerNotificationSettings> } | null)?.ownerNotificationSettings;
  return {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    ...(saved || {}),
  };
}

export default function OwnerSettingsScreen() {
  const { user } = useAuthStore();
  const { logout, deleteAccount } = useAuthViewModel();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<any>({
    phone: user?.phone || '',
    address: '',
    description: '',
  });

  const [notificationSettings, setNotificationSettings] = useState<OwnerNotificationSettings>(
    () => getInitialNotificationSettings(user)
  );
  const [isSavingNotificationSettings, setIsSavingNotificationSettings] = useState(false);

  const handleNotificationToggle = async (
    key: keyof OwnerNotificationSettings,
    value: boolean
  ) => {
    if (!user?.id) return;

    const previous = notificationSettings;
    const next = {
      ...notificationSettings,
      [key]: value,
    };

    setNotificationSettings(next);
    setIsSavingNotificationSettings(true);

    try {
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('@services/firebase');

      await setDoc(
        doc(db, 'users', user.id),
        {
          ownerNotificationSettings: next,
          pushEnabled: next.orders || next.reviews,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      setNotificationSettings(previous);
      Alert.alert('Error', 'Failed to update notification settings');
    } finally {
      setIsSavingNotificationSettings(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!user?.shopId) return;

    setIsSaving(true);
    try {
      await updateShop(user.shopId, {
        phone: editForm.phone,
      });

      Alert.alert('Success', 'Shop settings updated');
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
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
      'This will permanently delete your account, shop, products, deals, and order history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'Are you absolutely sure you want to permanently delete everything?',
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

  if (isEditing) {
    return (
      <ScrollView className="flex-1 bg-white p-4">
        <Text className="text-xl font-bold text-gray-800 mb-4">
          Edit Profile
        </Text>

        <View className="space-y-4">
          <View>
            <Text className="text-sm text-gray-700 font-medium mb-2">
              Phone
            </Text>
            <TextInput
              value={editForm.phone}
              onChangeText={(value) =>
                setEditForm({ ...editForm, phone: value })
              }
              keyboardType="phone-pad"
              placeholder="+92 300 1234567"
            />
          </View>

          <View>
            <Text className="text-sm text-gray-700 font-medium mb-2">
              Address
            </Text>
            <TextInput
              value={editForm.address || ''}
              onChangeText={(value) =>
                setEditForm({ ...editForm, address: value })
              }
              placeholder="Shop Address"
              multiline={true}
            />
          </View>

          <View>
            <Text className="text-sm text-gray-700 font-medium mb-2">
              Description
            </Text>
            <TextInput
              value={editForm.description || ''}
              onChangeText={(value) =>
                setEditForm({ ...editForm, description: value })
              }
              placeholder="Shop Description"
              multiline={true}
              numberOfLines={4}
            />
          </View>

          <View className="flex-row space-x-3 mt-6">
            <TouchableOpacity
              onPress={() => setIsEditing(false)}
              className="flex-1 py-3 rounded-lg border border-gray-300"
            >
              <Text className="text-center text-gray-700 font-medium">
                Cancel
              </Text>
            </TouchableOpacity>

            <CustomButton
              title={isSaving ? 'Saving...' : 'Save Changes'}
              onPress={handleSaveSettings}
              disabled={isSaving}
            />
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Profile Section */}
      <View className="bg-white p-4 mb-4">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-800">
              {user?.name}
            </Text>
            <Text className="text-sm text-gray-600 mt-1">{user?.phone}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setIsEditing(true)}
            className="p-2 bg-red-100 rounded-lg"
          >
            <Text className="text-lg">✏️</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-gray-50 p-3 rounded-lg">
          <Text className="text-xs text-gray-600 mb-1">Account Type</Text>
          <Text className="font-semibold text-gray-800">
            Shop Owner
          </Text>
        </View>
      </View>

      {/* Notifications Settings */}
      <View className="bg-white p-4 mb-4">
        <View className="flex-row items-center mb-4">
          <Text className="text-lg font-bold text-gray-800">
            Notifications
          </Text>
        </View>

        <View className="space-y-3">
          <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
            <Text className="text-gray-700">Order Notifications</Text>
            <Switch
              value={notificationSettings.orders}
              onValueChange={(value) => {
                void handleNotificationToggle('orders', value);
              }}
              disabled={isSavingNotificationSettings}
              trackColor={{ false: '#d1d5db', true: '#fecaca' }}
              thumbColor={notificationSettings.orders ? '#dc2626' : '#f3f4f6'}
            />
          </View>

          <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
            <Text className="text-gray-700">Review Notifications</Text>
            <Switch
              value={notificationSettings.reviews}
              onValueChange={(value) => {
                void handleNotificationToggle('reviews', value);
              }}
              disabled={isSavingNotificationSettings}
              trackColor={{ false: '#d1d5db', true: '#fecaca' }}
              thumbColor={notificationSettings.reviews ? '#dc2626' : '#f3f4f6'}
            />
          </View>

          <View className="flex-row justify-between items-center py-3">
            <Text className="text-gray-700">Promotional Emails</Text>
            <Switch
              value={notificationSettings.promotions}
              onValueChange={(value) => {
                void handleNotificationToggle('promotions', value);
              }}
              disabled={isSavingNotificationSettings}
              trackColor={{ false: '#d1d5db', true: '#fecaca' }}
              thumbColor={notificationSettings.promotions ? '#dc2626' : '#f3f4f6'}
            />
          </View>
        </View>
      </View>

      {/* Security Settings */}
      <View className="bg-white p-4 mb-4">
        <View className="flex-row items-center mb-4">
          <Text className="text-lg font-bold text-gray-800">
            Security</Text>
        </View>

        <TouchableOpacity className="flex-row justify-between items-center py-3 border-b border-gray-100">
          <Text className="text-gray-700">Change Password</Text>
          <Text className="text-lg">▶️</Text>
        </TouchableOpacity>

        <TouchableOpacity className="flex-row justify-between items-center py-3">
          <Text className="text-gray-700">Two-Factor Authentication</Text>
          <Switch
            value={false}
            onValueChange={() => {}}
            trackColor={{ false: '#d1d5db', true: '#fecaca' }}
            thumbColor="#f3f4f6"
          />
        </TouchableOpacity>
      </View>

      {/* Help & Support */}
      <View className="bg-white p-4 mb-4">
        <View className="flex-row items-center mb-4">
          <Text className="text-lg">❓</Text>
          <Text className="ml-3 text-lg font-bold text-gray-800">
            Help & Support
          </Text>
        </View>

        <TouchableOpacity className="flex-row justify-between items-center py-3 border-b border-gray-100">
          <Text className="text-gray-700">FAQ</Text>
          <Text className="text-lg">▶️</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row justify-between items-center py-3 border-b border-gray-100"
          onPress={() => Linking.openURL('https://dukandar.com/support')}
        >
          <Text className="text-gray-700">Contact Support</Text>
          <Text className="text-lg">▶️</Text>
        </TouchableOpacity>

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

        <TouchableOpacity className="flex-row justify-between items-center py-3">
          <Text className="text-gray-700">App Version</Text>
          <Text className="text-gray-600">1.0.0</Text>
        </TouchableOpacity>
      </View>

      {/* Danger Zone */}
      <View className="bg-white p-4 mb-4">
        <Text className="text-lg font-bold text-red-700 mb-2">Danger Zone</Text>
        <Text className="text-sm text-gray-600 mb-4">
          Permanently remove your account and all connected owner data.
        </Text>
        <TouchableOpacity
          onPress={handleDeleteAccount}
          className="py-3 px-4 border border-red-300 bg-red-50 rounded-lg"
        >
          <Text className="text-center font-semibold text-red-700">Delete Account</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <View className="p-4 pb-8">
        <CustomButton
          title="Log Out"
          onPress={handleLogout}
        />
        <View className="mt-4 p-4 bg-gray-100 rounded-lg items-center">
          <Text className="text-xs text-gray-600 text-center">
            © 2024 ShopWala. All rights reserved.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
