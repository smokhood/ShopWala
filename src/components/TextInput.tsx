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
        <Text className="text-gray-700 font-semibold mb-2">
          {label}
        </Text>
      )}
      <RNTextInput
        {...props}
        className={`border border-gray-300 rounded-lg p-3 text-gray-700 bg-white ${className ?? ''}`}
        placeholderTextColor="#999"
      />
      {error && (
        <Text className="text-red-600 text-sm mt-1">
          {error}
        </Text>
      )}
    </View>
  );
}
