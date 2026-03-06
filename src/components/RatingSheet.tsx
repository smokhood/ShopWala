/**
 * RatingSheet Component
 * Bottom sheet for rating shops after ordering
 */

import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import {
    Alert,
    Modal,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { CustomButton } from './CustomButton';

interface RatingSheetProps {
  isVisible: boolean;
  shopName: string;
  shopId: string;
  onSubmit: (rating: number, note?: string) => void;
  onCancel: () => void;
}

export function RatingSheet({
  isVisible,
  shopName,
  shopId,
  onSubmit,
  onCancel,
}: RatingSheetProps) {
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (rating === 0) {
      Alert.alert('رے ٹنگ درکار', 'براہ کرم سٹار کے ذریعے ریٹ کریں');
      return;
    }

    setIsSubmitting(true);
    try {
      onSubmit(rating, note);
      setRating(0);
      setNote('');
    } catch (error) {
      Alert.alert('خرابی', 'ریٹنگ جمع کرنے میں خرابی');
    } finally {
      setIsSubmitting(false);
    }
  }, [rating, note, onSubmit]);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl px-6 py-6 pb-8">
          {/* Handle */}
          <View className="items-center mb-4">
            <View className="w-12 h-1 bg-gray-300 rounded-full" />
          </View>

          {/* Title */}
          <Text className="text-xl font-bold text-gray-900 mb-2">
            {shopName} کو ریٹ کریں
          </Text>
          <Text className="text-sm text-gray-600 mb-6">
            آپ کی رائے ہمارے لیے اہم ہے
          </Text>

          {/* Star Rating */}
          <View className="flex-row justify-center mb-8">
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                className="mx-2"
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={40}
                  color={star <= rating ? '#eab308' : '#d1d5db'}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Note Input */}
          <TextInput
            placeholder="اختیاری: اپنی رائے لکھیں"
            placeholderTextColor="#9ca3af"
            value={note}
            onChangeText={setNote}
            maxLength={120}
            multiline={true}
            numberOfLines={3}
            className="border border-gray-300 rounded-lg p-4 mb-6 text-gray-800"
            textAlignVertical="top"
          />

          {/* Character Count */}
          <Text className="text-xs text-gray-500 mb-6 text-right">
            {note.length}/120
          </Text>

          {/* Buttons */}
          <View className="gap-3">
            <CustomButton
              title="جمع کروائیں"
              onPress={handleSubmit}
              disabled={isSubmitting}
            />
            <TouchableOpacity
              onPress={onCancel}
              disabled={isSubmitting}
              className="py-4"
            >
              <Text className="text-center text-gray-600 font-medium">
                بعد میں
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
