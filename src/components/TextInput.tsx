/**
 * TextInput Component
 * Themed text input wrapper
 */
import React from 'react';
import { TextInput as RNTextInput, TextInputProps as RNTextInputProps, Text, View } from 'react-native';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
}

export function TextInput({
  label,
  error,
  className,
  ...props
}: TextInputProps) {
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-gray-700 font-semibold mb-2 text-[13px]">
          {label}
        </Text>
      )}
      <RNTextInput
        {...props}
        className={`border rounded-xl px-4 py-3.5 text-gray-800 bg-white text-[15px] ${
          error ? 'border-red-400' : 'border-gray-300'
        } ${className ?? ''}`}
        placeholderTextColor="#9ca3af"
      />
      {error && (
        <Text className="text-red-600 text-xs mt-1.5">
          {error}
        </Text>
      )}
    </View>
  );
}
