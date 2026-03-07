/**
 * Auth ViewModel - Business logic for authentication flow
 * Handles OTP, biometric auth, user management
 */
import type { User, UserRole } from '@models/User';
import { auth, db } from '@services/firebase';
import { clearAllData, clearOldCache } from '@services/offlineService';
import { formatPhone } from '@utils/formatters';
import { otpSchema, pakistaniPhoneSchema } from '@utils/validators';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {
    ApplicationVerifier,
    ConfirmationResult,
    deleteUser,
    signInWithPhoneNumber,
    signOut
} from 'firebase/auth';
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    where,
    writeBatch
} from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';

export function useAuthViewModel() {
  const router = useRouter();
    const { user, setUser, setLoading, clearUser: clearAuthStore } = useAuthStore();
  const selectedLanguage = useLanguageStore((state) => state.language);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  /**
   * Send OTP to phone number
   */
  const sendOTP = async (
    phone: string,
    verifier?: ApplicationVerifier
  ): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate and format phone
      const validation = pakistaniPhoneSchema.safeParse(phone);
      if (!validation.success) {
        throw new Error('Valid Pakistani number daalen (3XX-XXXXXXX)');
      }

      const formattedPhone = formatPhone(phone);
      setPhoneNumber(formattedPhone);

      // Use real Firebase Phone Auth
      // Note: On Expo Go, this requires development build or Firebase Emulator
      // For production/testing on native device, this will work directly
      try {
        console.log('[Phone Auth] Sending OTP to:', formattedPhone);
        if (!verifier) {
          throw new Error('reCAPTCHA verifier initialize nahi hua. App restart karke dobara koshish karein.');
        }
        const confirmation = await signInWithPhoneNumber(auth, formattedPhone, verifier);
        confirmationResultRef.current = confirmation;
        setOtpSent(true);
        setCountdown(60);
        console.log('[Phone Auth] OTP sent successfully');
      } catch (authError: any) {
        console.error('[Phone Auth] Error:', authError);
        // Provide helpful error messages
        if (authError.code === 'auth/invalid-phone-number') {
          throw new Error('موبائل نمبر درست نہیں');
        } else if (authError.code === 'auth/too-many-requests') {
          throw new Error('بہت زیادہ کوششیں، کچھ دیر بعد آزمائیں');
        } else if (authError.code === 'auth/network-request-failed') {
          throw new Error('انٹرنیٹ چیک کریں');
        } else if (authError.code === 'auth/operation-not-supported-in-this-environment') {
          throw new Error('Phone Auth requires development build. See docs for setup.');
        } else {
          throw new Error(`OTP بھیجنے میں مسئلہ: ${authError.code || 'unknown'} - ${authError.message}`);
        }
      }
    } catch (err: any) {
      console.error('Send OTP error:', err);
      setError(err.message || 'OTP بھیجنے میں ناکامی');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verify OTP code
   */
  const verifyOTP = async (otp: string, desiredRole?: UserRole): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate OTP
      const validation = otpSchema.safeParse(otp);
      if (!validation.success) {
        throw new Error('6 digit OTP daalen');
      }

      if (!confirmationResultRef.current) {
        throw new Error('پہلے OTP بھیجیں');
      }

      // Confirm OTP with Firebase
      try {
        console.log('[Phone Auth] Verifying OTP...');
        const userCredential = await confirmationResultRef.current.confirm(otp);
        const firebaseUser = userCredential.user;
        console.log('[Phone Auth] OTP verified successfully:', firebaseUser.uid);

        // Fetch or create user in Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        let userData: User;

        if (userDoc.exists()) {
          // Existing user
          userData = userDoc.data() as User;
          console.log('[Firestore] Existing user found');
        } else {
          // New user - create document
          userData = {
            id: firebaseUser.uid,
            phone: phoneNumber,
            name: '',
            role: desiredRole ?? 'customer',
            shopId: null,
            savedShops: [],
            isOnboarded: false,
            preferredLanguage: selectedLanguage,
            createdAt: new Date() as any,
            updatedAt: new Date() as any,
          };

          await setDoc(userDocRef, userData);
          console.log('[Firestore] New user created');
        }

        // Apply selected role before updating store to avoid redirect flicker.
        if (desiredRole && userData.role !== desiredRole) {
          await setDoc(
            userDocRef,
            {
              role: desiredRole,
              updatedAt: new Date(),
            },
            { merge: true }
          );

          userData = {
            ...userData,
            role: desiredRole,
            updatedAt: new Date() as any,
          };
        }

        setUser(userData);

        // Clear confirmation result
        confirmationResultRef.current = null;
        setOtpSent(false);
      } catch (authError: any) {
        console.error('[Phone Auth] Verification error:', authError);
        if (authError.code === 'auth/invalid-verification-code') {
          throw new Error('OTP غلط ہے');
        } else if (authError.code === 'auth/code-expired') {
          throw new Error('OTP کی میعاد ختم ہو گئی');
        } else {
          throw new Error(`تصدیق میں خرابی: ${authError.message}`);
        }
      }
    } catch (err: any) {
      console.error('Verify OTP error:', err);
      setError(err.message || 'OTP تصدیق میں ناکامی');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Set/update user role
   */
  const setUserRole = async (role: UserRole): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(
        userDocRef,
        {
          role,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      // Fetch updated user
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setUser(userDoc.data() as User);
      }
    } catch (err: any) {
      console.error('Set user role error:', err);
      setError(err.message || 'Role update failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resend OTP
   */
  const resendOTP = async (): Promise<void> => {
    if (countdown > 0) {
      throw new Error(`${countdown} seconds میں دوبارہ کوشش کریں`);
    }

    await sendOTP(phoneNumber);
  };

  /**
   * Check biometric availability
   */
  const checkBiometricAvailability = async (): Promise<{
    available: boolean;
    type: string;
  }> => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      let typeString = 'Unknown';
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        typeString = 'Face ID';
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        typeString = 'Fingerprint';
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        typeString = 'Iris';
      }

      return {
        available: compatible && enrolled,
        type: typeString,
      };
    } catch (error) {
      console.error('Check biometric error:', error);
      return { available: false, type: 'Unknown' };
    }
  };

  /**
   * Authenticate with biometric
   */
  const authenticateWithBiometric = async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'ShopWala mein dakhil hon',
        fallbackLabel: 'پاس ورڈ استعمال کریں',
        cancelLabel: 'منسوخ',
      });

      return result.success;
    } catch (error) {
      console.error('Biometric auth error:', error);
      return false;
    }
  };

  const deleteDocumentsByField = async (
    collectionName: string,
    field: string,
    value: string
  ): Promise<void> => {
    const docsSnapshot = await getDocs(
      query(collection(db, collectionName), where(field, '==', value))
    );

    if (docsSnapshot.empty) {
      return;
    }

    const docs = docsSnapshot.docs;
    const chunkSize = 400;

    for (let i = 0; i < docs.length; i += chunkSize) {
      const batch = writeBatch(db);
      const chunk = docs.slice(i, i + chunkSize);

      chunk.forEach((item) => {
        batch.delete(item.ref);
      });

      await batch.commit();
    }
  };

  /**
   * Delete current user's account and related data.
   */
  const deleteAccount = async (): Promise<void> => {
    try {
      setLoading(true);

      const currentUser = auth.currentUser;
      if (!currentUser || !user) {
        throw new Error('Session expire ho gayi hai. Dobara login karein.');
      }

      if (user.role === 'owner' && user.shopId) {
        await deleteDocumentsByField('products', 'shopId', user.shopId);
        await deleteDocumentsByField('deals', 'shopId', user.shopId);
        await deleteDocumentsByField('orders', 'shopId', user.shopId);
        await deleteDoc(doc(db, 'shops', user.shopId));
      }

      if (user.role === 'customer') {
        await deleteDocumentsByField('orders', 'customerId', user.id);
      }

      await deleteDocumentsByField('notifications', 'userId', user.id);
      await deleteDoc(doc(db, 'users', user.id));

      await deleteUser(currentUser);

      clearAuthStore();
      await clearAllData();
      await SecureStore.deleteItemAsync('dukandar-auth-storage');

      router.replace('/(auth)/role-select' as any);
    } catch (error: any) {
      console.error('Delete account error:', error);
      if (error?.code === 'auth/requires-recent-login') {
        throw new Error('Security ke liye dobara login karke account delete karein.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = async (): Promise<void> => {
    try {
      setLoading(true);

      // Sign out from Firebase
      await signOut(auth);

      // Clear auth store
      clearAuthStore();

      // Clear SQLite cache
      await clearOldCache();

      // Navigate to role select
      router.replace('/(auth)/role-select' as any);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    // State
    phoneNumber,
    otpSent,
    isLoading,
    error,
    countdown,

    // Functions
    sendOTP,
    verifyOTP,
    setUserRole,
    resendOTP,
    checkBiometricAvailability,
    authenticateWithBiometric,
    logout,
    deleteAccount,
  };
}
