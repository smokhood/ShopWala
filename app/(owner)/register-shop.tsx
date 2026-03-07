/**
 * app/(owner)/register-shop.tsx
 * Shop registration screen with 4-step form
 * Steps: Shop Info → Location → Category → Verification
 */

import { zodResolver } from '@hookform/resolvers/zod';
import type { Shop } from '@models/Shop';
import { db } from '@services/firebase';
import {
    getAreaFromCoords,
    getCurrentLocation,
    requestLocationPermission,
} from '@services/locationService';
import { createShop } from '@services/shopService';
import { useAuthStore } from '@store/authStore';
import { useLocationStore } from '@store/locationStore';
import { useLocationViewModel } from '@viewModels/useLocationViewModel';
import { useRouter } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { z } from 'zod';
import { CustomButton } from '../../src/components/CustomButton';
import { LocationMapModal } from '../../src/components/LocationMapModal';
import { LocationPicker } from '../../src/components/LocationPicker';
import { TextInput } from '../../src/components/TextInput';
import { useLanguage } from '../../src/hooks/useLanguage';

const PAK_PHONE_REGEX = /^\+92\d{10}$/;

const normalizePhoneInput = (value: string): string => {
  const digits = (value || '').replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('92')) {
    return `+${digits.slice(0, 12)}`;
  }

  if (digits.startsWith('0')) {
    return `+92${digits.slice(1, 11)}`;
  }

  return `+92${digits.slice(0, 10)}`;
};

const shopRegistrationSchema = z.object({
  name: z.string().trim().min(2, 'Shop name required'),
  nameUrdu: z.string().trim().max(120, 'Urdu name is too long').optional(),
  description: z.string().trim().min(10, 'Description should be at least 10 characters'),
  category: z.enum([
    'kiryana',
    'pharmacy',
    'sabzi',
    'bakery',
    'general',
  ]),
  phone: z.string().trim().regex(PAK_PHONE_REGEX, 'Valid phone required'),
  address: z.string().trim().min(5, 'Address required'),
  city: z.string().trim().min(2, 'City required'),
});

type ShopFormData = z.infer<typeof shopRegistrationSchema>;

export default function RegisterShopScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const { location, area, city, setLocation, setArea, setLocating } = useLocationStore();
  const { isLocating, permissionStatus } = useLocationViewModel();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [step1Snapshot, setStep1Snapshot] = useState<{
    name: string;
    nameUrdu: string;
    phone: string;
  }>({
    name: '',
    nameUrdu: '',
    phone: '',
  });
  const [mapInitialLocation, setMapInitialLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [mapSelectedLocation, setMapSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Protection: If user already has a shop, redirect to dashboard
  useEffect(() => {
    if (user?.shopId) {
      Alert.alert(
        'Shop Already Registered',
        'You already have a registered shop. You cannot register multiple shops with the same account.',
        [
          {
            text: 'Go to Dashboard',
            onPress: () => router.replace('/(owner)/dashboard'),
          },
        ],
        { cancelable: false }
      );
    }
  }, [user?.shopId, router]);

  const {
    control,
    watch,
    getValues,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<ShopFormData>({
    resolver: zodResolver(shopRegistrationSchema),
    shouldUnregister: false,
    defaultValues: {
      name: '',
      nameUrdu: '',
      description: '',
      category: 'general',
      phone: '',
      address: '',
      city: '',
    },
  });

  const category = watch('category');

  useEffect(() => {
    if (city) {
      setValue('city', city, { shouldValidate: true });
    }
    if (area) {
      const currentAddress = watch('address');
      if (!currentAddress || currentAddress.trim().length === 0) {
        setValue('address', area, { shouldValidate: true });
      }
    }
  }, [area, city, setValue, watch]);

  const handlePickLocation = useCallback(async () => {
    try {
      setLocating(true);

      const status =
        permissionStatus === 'granted'
          ? 'granted'
          : await requestLocationPermission();

      if (status !== 'granted') {
        Alert.alert('Location Permission', 'Please allow location permission to open the map picker.');
        return;
      }

      const coords = await getCurrentLocation();
      if (!coords) {
        Alert.alert('Location Error', 'Unable to fetch your current location. Please try again.');
        return;
      }

      const startLocation = {
        latitude: coords.lat,
        longitude: coords.lng,
      };

      setMapInitialLocation(startLocation);
      setMapSelectedLocation(startLocation);
      setIsMapVisible(true);
    } catch (error) {
      console.error('Location pick error:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your location. Please check location permission, GPS and internet connection.'
      );
    } finally {
      setLocating(false);
    }
  }, [permissionStatus, setLocating]);

  const handleConfirmMapLocation = useCallback(async () => {
    if (!mapSelectedLocation) {
      Alert.alert('Location Required', 'Please place the marker on your shop location first.');
      return;
    }

    setLocation(mapSelectedLocation.latitude, mapSelectedLocation.longitude);

    try {
      const areaName = await getAreaFromCoords(
        mapSelectedLocation.latitude,
        mapSelectedLocation.longitude
      );

      const parts = areaName.split(',').map((s) => s.trim());
      const selectedArea = parts[0] || areaName;
      const selectedCity = parts[1] || '';

      setArea(selectedArea, selectedCity);

      const currentAddress = getValues('address');
      const currentCity = getValues('city');

      if (!currentAddress || currentAddress.trim().length === 0) {
        setValue('address', selectedArea, { shouldValidate: true });
      }

      if ((!currentCity || currentCity.trim().length === 0) && selectedCity) {
        setValue('city', selectedCity, { shouldValidate: true });
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
    }

    setIsMapVisible(false);
    Alert.alert('Location Selected', 'Shop location selected from map successfully.');
  }, [getValues, mapSelectedLocation, setArea, setLocation, setValue]);

  const handleNextStep = useCallback(async () => {
    let isStepValid = true;

    if (step === 1) {
      const syncedName = (getValues('name') || '').trim();
      const syncedNameUrdu = (getValues('nameUrdu') || '').trim();
      const syncedPhone = normalizePhoneInput(getValues('phone') || '');

      setValue('name', syncedName, { shouldValidate: true });
      setValue('nameUrdu', syncedNameUrdu, { shouldValidate: false });
      setValue('phone', syncedPhone, { shouldValidate: true });

      isStepValid = await trigger(['name', 'phone']);

      if (isStepValid) {
        setStep1Snapshot({
          name: syncedName,
          nameUrdu: syncedNameUrdu,
          phone: syncedPhone,
        });
      }
    }

    if (step === 2) {
      isStepValid = await trigger(['address', 'city']);
      if (!location) {
        Alert.alert('Location Required', 'Please pick your shop location first.');
        isStepValid = false;
      }
    }

    if (step === 3) {
      isStepValid = await trigger(['description', 'category']);
    }

    if (!isStepValid) {
      Alert.alert('Incomplete', 'Please fill all required fields before continuing.');
      return;
    }

    if (step < 4) {
      setStep(step + 1);
    }
  }, [step, trigger, location, getValues, setValue]);

  const handlePreviousStep = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
    }
  }, [step]);

  const onSubmit = async (data: ShopFormData) => {
    if (!user) {
      Alert.alert('Error', 'Please log in first');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Location not set');
      return;
    }

    setIsLoading(true);
    try {
      const cleanedPhone = normalizePhoneInput(data.phone || '');

      if (!PAK_PHONE_REGEX.test(cleanedPhone)) {
        setStep(1);
        Alert.alert('Invalid Phone', 'Please enter a valid phone number in +92 format.');
        return;
      }

      const shopData: Omit<Shop, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'ratingCount' | 'totalViews' | 'todayViews' | 'whatsappClicks'> = {
        name: data.name.trim(),
        ownerName: user.name,
        ownerId: user.id,
        category: data.category as any,
        whatsapp: cleanedPhone,
        phone: cleanedPhone,
        location: {
          latitude: location.lat,
          longitude: location.lng,
          geohash: '', // Will be calculated by service
          address: data.address.trim(),
          area: area || '',
          city: data.city.trim(),
        },
        photoUrl: null,
        isOpen: true,
        isActive: true,
        hours: {
          openTime: '09:00',
          closeTime: '23:00',
          isOpen24Hours: false,
        },
        payment: {
          jazzCashNumber: null,
          easyPaisaNumber: null,
          bankAccount: null,
        },
        // Auto-verify at creation: no manual approval required.
        isVerified: true,
      };

      const shopId = await createShop(shopData);

      // Update user's shopId in Firestore
      if (user?.id) {
        const userRef = doc(db, 'users', user.id);
        await updateDoc(userRef, {
          shopId,
          updatedAt: new Date(),
        });
        
        // Update local auth store
        setUser({
          ...user,
          shopId,
        });
      }
      
      Alert.alert(
        'Success',
        'Shop registered successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/(owner)/dashboard');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Shop registration error:', error);
      Alert.alert('Error', 'Failed to register shop');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalSubmit = useCallback(async () => {
    const nameFromForm = (getValues('name') || '').trim();
    const nameUrduFromForm = (getValues('nameUrdu') || '').trim();
    const phoneFromForm = normalizePhoneInput(getValues('phone') || '');

    const resolvedName = nameFromForm || step1Snapshot.name;
    const resolvedNameUrdu = nameUrduFromForm || step1Snapshot.nameUrdu;
    const resolvedPhone = phoneFromForm || step1Snapshot.phone;

    const formSnapshot = {
      name: resolvedName,
      nameUrdu: resolvedNameUrdu,
      description: (getValues('description') || '').trim(),
      category: getValues('category') || 'general',
      phone: resolvedPhone,
      address: (getValues('address') || '').trim(),
      city: (getValues('city') || '').trim(),
    };

    // Sync cleaned values back into form state.
    setValue('name', formSnapshot.name, { shouldValidate: true });
    setValue('nameUrdu', formSnapshot.nameUrdu, { shouldValidate: false });
    setValue('description', formSnapshot.description, { shouldValidate: true });
    setValue('category', formSnapshot.category as ShopFormData['category'], { shouldValidate: true });
    setValue('phone', formSnapshot.phone, { shouldValidate: true });
    setValue('address', formSnapshot.address, { shouldValidate: true });
    setValue('city', formSnapshot.city, { shouldValidate: true });

    const parsed = shopRegistrationSchema.safeParse(formSnapshot);
    if (!parsed.success) {
      const hasStep1Error = parsed.error.issues.some(
        (issue) => issue.path[0] === 'name' || issue.path[0] === 'phone'
      );
      const hasStep2Error = parsed.error.issues.some(
        (issue) => issue.path[0] === 'address' || issue.path[0] === 'city'
      );
      const hasStep3Error = parsed.error.issues.some(
        (issue) => issue.path[0] === 'description' || issue.path[0] === 'category'
      );

      if (hasStep1Error) {
        setStep(1);
        Alert.alert('Step 1 Incomplete', t('owner.step1_incomplete'));
        return;
      }

      if (hasStep2Error) {
        setStep(2);
        Alert.alert('Step 2 Incomplete', 'Please complete address, city, and pick location.');
        return;
      }

      if (hasStep3Error) {
        setStep(3);
        Alert.alert('Step 3 Incomplete', 'Please select category and add description.');
        return;
      }

      Alert.alert('Invalid Form', 'Please review all required fields and try again.');
      return;
    }

    if (!location) {
      setStep(2);
      Alert.alert('Location Required', 'Please pick your shop location first.');
      return;
    }

    if (!parsed.data.name || !parsed.data.phone) {
      setStep(1);
      Alert.alert('Step 1 Incomplete', t('owner.step1_incomplete'));
      return;
    }

    // Keep snapshot updated with final cleaned values.
    setStep1Snapshot({
      name: parsed.data.name,
      nameUrdu: parsed.data.nameUrdu || '',
      phone: parsed.data.phone,
    });

    await onSubmit(parsed.data);
  }, [getValues, location, onSubmit, setValue, step1Snapshot, t]);

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <View className="space-y-4">
            <Text className="text-lg font-semibold text-gray-800 mb-2">
              Shop Information
            </Text>
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <TextInput
                  value={field.value}
                  onChangeText={(text) => field.onChange(text)}
                  onBlur={() => {
                    field.onChange(field.value?.trim() ?? '');
                    field.onBlur();
                  }}
                  placeholder="Shop Name (English)"
                  placeholderTextColor="#9ca3af"
                  editable={!isLoading}
                />
              )}
            />
            {errors.name && (
              <Text className="text-red-500 text-sm">{errors.name.message}</Text>
            )}

            <Controller
              control={control}
              name="nameUrdu"
              render={({ field }) => (
                <TextInput
                  value={field.value || ''}
                  onChangeText={field.onChange}
                  onBlur={() => {
                    field.onChange(field.value?.trim() ?? '');
                    field.onBlur();
                  }}
                  placeholder={`${t('owner.shop_name_urdu')} (${t('owner.optional')})`}
                  placeholderTextColor="#9ca3af"
                  editable={!isLoading}
                />
              )}
            />
            {errors.nameUrdu && (
              <Text className="text-red-500 text-sm">
                {errors.nameUrdu.message}
              </Text>
            )}

            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <TextInput
                  value={field.value || ''}
                  onBlur={() => {
                    const normalized = normalizePhoneInput(field.value || '');
                    field.onChange(normalized);
                    field.onBlur();
                  }}
                  onChangeText={(text) => field.onChange(text)}
                  placeholder="+92 300 1234567"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  maxLength={16}
                  editable={!isLoading}
                />
              )}
            />
            {errors.phone && (
              <Text className="text-red-500 text-sm">{errors.phone.message}</Text>
            )}
          </View>
        );

      case 2:
        return (
          <View className="space-y-4">
            <Text className="text-lg font-semibold text-gray-800 mb-2">
              Location
            </Text>
            
            {isLocating && (
              <View className="flex-row items-center mb-2 p-2 bg-blue-50 rounded-lg">
                <ActivityIndicator size="small" color="#3b82f6" />
                <Text className="ml-2 text-blue-700 text-sm">
                  Getting your location...
                </Text>
              </View>
            )}
            
            <LocationPicker
              onPress={handlePickLocation}
              disabled={isLocating}
              location={location ? {
                latitude: location.lat,
                longitude: location.lng,
                address: area || 'Current location selected',
              } : undefined}
              placeholder={isLocating ? 'Fetching current location...' : 'Open map and place marker for shop location'}
            />

            <Controller
              control={control}
              name="address"
              render={({ field }) => (
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Store Address"
                  placeholderTextColor="#9ca3af"
                  editable={!isLoading}
                  multiline={true}
                />
              )}
            />
            {errors.address && (
              <Text className="text-red-500 text-sm">{errors.address.message}</Text>
            )}

            <Controller
              control={control}
              name="city"
              render={({ field }) => (
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="City"
                  placeholderTextColor="#9ca3af"
                  editable={!isLoading}
                />
              )}
            />
            {errors.city && (
              <Text className="text-red-500 text-sm">{errors.city.message}</Text>
            )}
          </View>
        );

      case 3:
        return (
          <View className="space-y-4">
            <Text className="text-lg font-semibold text-gray-800 mb-2">
              Category
            </Text>

            {['kiryana', 'pharmacy', 'sabzi', 'bakery', 'general'].map(
              (cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setValue('category', cat as any)}
                  className={`p-4 rounded-lg border-2 ${
                    category === cat
                      ? 'bg-red-50 border-red-500'
                      : 'border-gray-200'
                  }`}
                >
                  <Text
                    className={`text-base font-medium ${
                      category === cat ? 'text-red-600' : 'text-gray-700'
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </TouchableOpacity>
              )
            )}

            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Shop Description"
                  placeholderTextColor="#9ca3af"
                  editable={!isLoading}
                  multiline={true}
                  numberOfLines={4}
                />
              )}
            />
            {errors.description && (
              <Text className="text-red-500 text-sm">
                {errors.description.message}
              </Text>
            )}
          </View>
        );

      case 4:
        return (
          <View className="space-y-4">
            <Text className="text-lg font-semibold text-gray-800 mb-2">
              Verification
            </Text>
            <View className="bg-blue-50 p-4 rounded-lg">
              <Text className="text-sm text-blue-900 mb-2">
                📋 Your shop details will be reviewed within 24-48 hours.
              </Text>
              <Text className="text-sm text-blue-800">
                Make sure all information is accurate for faster verification.
              </Text>
            </View>

            <View className="bg-gray-50 p-4 rounded-lg">
              <Text className="font-semibold text-gray-800 mb-2">Summary</Text>
              <Text className="text-sm text-gray-600 mb-1">
                Name: {watch('name')}
              </Text>
              <Text className="text-sm text-gray-600 mb-1">
                Category: {category}
              </Text>
              <Text className="text-sm text-gray-600">
                City: {watch('city')}
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={0}
    >
      <ScrollView className="flex-1 bg-white p-4">
        keyboardShouldPersistTaps="handled"
      {/* Progress Indicator */}
      <View className="mb-6">
        <Text className="text-sm text-gray-600 mb-2">
          Step {step} of 4
        </Text>
        <View className="flex-row space-x-2">
          {[1, 2, 3, 4].map((s) => (
            <View
              key={s}
              className={`flex-1 h-2 rounded-full ${
                s <= step ? 'bg-red-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </View>
      </View>

      {/* Step Content */}
      {renderStepContent()}

      {/* Navigation Buttons */}
      <View className="flex-row space-x-3 mt-8">
        <TouchableOpacity
          onPress={handlePreviousStep}
          disabled={step === 1 || isLoading}
          className={`flex-1 py-3 rounded-lg border border-gray-300 ${
            step === 1 || isLoading ? 'opacity-50' : ''
          }`}
        >
          <Text className="text-center text-gray-700 font-medium">
            Previous
          </Text>
        </TouchableOpacity>

        {step < 4 ? (
          <CustomButton
            title="Next"
            onPress={handleNextStep}
            disabled={isLoading}
          />
        ) : (
          <View className="flex-row items-center">
            <CustomButton
              title={isLoading ? 'Loading...' : 'Submit'}
              onPress={handleFinalSubmit}
              disabled={isLoading}
            />
            {isLoading && <ActivityIndicator color="#2563eb" style={{ marginLeft: 10 }} />}
          </View>
        )}
      </View>
      </ScrollView>

      <LocationMapModal
        visible={isMapVisible}
        initialLocation={mapInitialLocation}
        selectedLocation={mapSelectedLocation}
        onSelectLocation={setMapSelectedLocation}
        onConfirm={handleConfirmMapLocation}
        onClose={() => setIsMapVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}
