/**
 * SearchBar Component - Professional search input
 */
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, TextInput } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { useLanguage } from '../hooks/useLanguage';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: (text: string) => void;
  onClear: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  editable?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  onClear,
  placeholder,
  autoFocus = false,
  editable = true,
}: SearchBarProps) {
  const { t } = useLanguage();
  const scale = useSharedValue(1);
  const [isFocused, setIsFocused] = useState(false);
  const resolvedPlaceholder = placeholder ?? t('customer.what_are_you_looking_for');

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleFocus = () => {
    setIsFocused(true);
    scale.value = withSpring(1.02, {
      damping: 15,
      stiffness: 150,
    });
  };

  const handleBlur = () => {
    setIsFocused(false);
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
    });
  };

  return (
    <Animated.View
      style={[animatedStyle]}
      className={`rounded-2xl px-4 py-3 flex-row items-center border ${
        isFocused ? 'bg-white border-green-500' : 'bg-white border-gray-200'
      }`}
    >
      <Ionicons name="search" size={20} color="#16a34a" />
      
      <TextInput
        className="flex-1 mx-3 text-[15px] text-gray-900"
        placeholder={resolvedPlaceholder}
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={() => onSubmit(value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoFocus={autoFocus}
        editable={editable}
        returnKeyType="search"
      />

      {value.length > 0 && (
        <Pressable onPress={onClear} hitSlop={8} className="p-0.5">
          <Ionicons name="close-circle" size={20} color="#9ca3af" />
        </Pressable>
      )}
    </Animated.View>
  );
}
