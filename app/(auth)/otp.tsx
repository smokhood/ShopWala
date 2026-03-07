/**
 * OTP Screen - Phone number input and OTP verification
 */
import { Ionicons } from '@expo/vector-icons';
import type { UserRole } from '@models/User';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { useLanguage } from '../../src/hooks/useLanguage';
import { useAuthViewModel } from '../../src/viewModels/useAuthViewModel';

export default function OTPScreen() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: UserRole }>();
  
  const {
    phoneNumber: storedPhone,
    otpSent,
    isLoading,
    error,
    countdown,
    sendOTP,
    verifyOTP,
    resendOTP,
  } = useAuthViewModel();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP input refs
  const otpRefs = useRef<Array<TextInput | null>>([]);

  // Shake animation for wrong OTP
  const shakeTranslateX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeTranslateX.value }],
  }));

  // Trigger shake animation
  const triggerShake = () => {
    shakeTranslateX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  // Handle phone number input (auto-format)
  const handlePhoneChange = (text: string) => {
    // Remove non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    setPhone(cleaned);
  };

  // Handle send OTP
  const handleSendOTP = async () => {
    try {
      setIsSubmitting(true);
      await sendOTP(phone);
    } catch (err: any) {
      Alert.alert('خرابی', err.message || 'OTP بھیجنے میں ناکامی');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle OTP input change
  const handleOTPChange = (text: string, index: number) => {
    // Only allow single digit
    if (text.length > 1) {
      text = text[text.length - 1];
    }

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input
    if (text && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (index === 5 && text && newOtp.every((digit) => digit)) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  // Handle OTP backspace
  const handleOTPKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handleOTPPaste = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 6);
    const newOtp = cleaned.split('');
    while (newOtp.length < 6) {
      newOtp.push('');
    }
    setOtp(newOtp);

    // Focus last filled or first empty
    const lastFilledIndex = cleaned.length - 1;
    if (lastFilledIndex >= 0 && lastFilledIndex < 6) {
      otpRefs.current[lastFilledIndex]?.focus();
    }
  };

  // Handle verify OTP
  const handleVerifyOTP = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    
    if (code.length !== 6) {
      Alert.alert(t('auth.error_title'), t('auth.enter_6_digit_otp'));
      return;
    }

    try {
      setIsSubmitting(true);
      await verifyOTP(code, params.role);

      // Success - navigation handled by auth guard
    } catch (err: any) {
      triggerShake();
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
      Alert.alert(t('auth.error_title'), err.message || t('auth.otp_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle resend
  const handleResend = async () => {
    try {
      await resendOTP();
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      Alert.alert(t('auth.error_title'), err.message);
    }
  };

  // Format phone for display
  const formatPhoneDisplay = (phone: string) => {
    if (!phone) return '';
    // Format: XXX-XXX-XXXX
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="bg-primary px-6 pt-12 pb-8 rounded-b-3xl">
          <View className="flex-row items-center mb-4">
            {otpSent && (
              <Pressable
                onPress={() => router.back()}
                className="mr-4 p-2 -ml-2"
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </Pressable>
            )}
            <Text className="text-white text-2xl font-bold flex-1 text-center">
              {t('common.app_name')}
            </Text>
            {otpSent && <View className="w-10" />}
          </View>
        </View>

        <View className="flex-1 px-6 pt-8">
          {!otpSent ? (
            // STEP 1: Phone Input
            <View>
              <Text className="text-2xl font-bold text-gray-900 mb-2">
                {t('auth.enter_mobile_number')}
              </Text>
              <Text className="text-gray-600 mb-8">
                {t('auth.we_will_send_otp')}
              </Text>

              {/* Phone Input */}
              <View className="flex-row items-center border-2 border-gray-300 rounded-xl px-4 py-3 mb-2">
                <Text className="text-lg mr-2">🇵🇰 +92</Text>
                <TextInput
                  className="flex-1 text-lg"
                  placeholder="3001234567"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={handlePhoneChange}
                  autoFocus={true}
                />
              </View>

              {/* Error Message */}
              {error && (
                <View className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
                  <Text className="text-red-700">{error}</Text>
                </View>
              )}

              {/* Send Button */}
              <Pressable
                onPress={handleSendOTP}
                disabled={phone.length < 10 || isSubmitting}
                className={`rounded-xl py-4 mt-4 ${
                  phone.length >= 10 && !isSubmitting
                    ? 'bg-primary'
                    : 'bg-gray-300'
                }`}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-center font-semibold text-lg">
                    {t('auth.send_otp')}
                  </Text>
                )}
              </Pressable>
            </View>
          ) : (
            // STEP 2: OTP Input
            <Animated.View style={shakeStyle}>
              <Text className="text-2xl font-bold text-gray-900 mb-2">
                {t('auth.enter_otp')}
              </Text>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-600">
                  {t('auth.otp_sent_to')} {formatPhoneDisplay(storedPhone.replace('+92', ''))}
                </Text>
                <Pressable onPress={() => router.back()}>
                  <Text className="text-primary font-medium">{language === 'ur' ? 'غلط نمبر؟' : 'Wrong number?'}</Text>
                </Pressable>
              </View>

              {/* OTP Boxes */}
              <View className="flex-row justify-between my-8">
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      otpRefs.current[index] = ref;
                    }}
                    className={`w-12 h-14 border-2 rounded-xl text-center text-xl font-semibold ${
                      error && !digit
                        ? 'border-red-500 bg-red-50'
                        : digit
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-300'
                    }`}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    onChangeText={(text) => handleOTPChange(text, index)}
                    onKeyPress={({ nativeEvent }) =>
                      handleOTPKeyPress(nativeEvent.key, index)
                    }
                  />
                ))}
              </View>

              {/* Error Message */}
              {error && (
                <View className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
                  <Text className="text-red-700 text-center">{error}</Text>
                </View>
              )}

              {/* Verify Button */}
              <Pressable
                onPress={() => handleVerifyOTP()}
                disabled={otp.some((d) => !d) || isSubmitting}
                className={`rounded-xl py-4 mb-4 ${
                  otp.every((d) => d) && !isSubmitting
                    ? 'bg-primary'
                    : 'bg-gray-300'
                }`}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-center font-semibold text-lg">
                    {t('auth.verify')}
                  </Text>
                )}
              </Pressable>

              {/* Resend Link */}
              <View className="items-center">
                {countdown > 0 ? (
                  <Text className="text-gray-600">
                    {t('auth.resend_in')} {countdown} {t('auth.seconds')}
                  </Text>
                ) : (
                  <Pressable onPress={handleResend}>
                    <Text className="text-primary font-semibold">
                      {t('auth.resend_otp')}
                    </Text>
                  </Pressable>
                )}
              </View>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
