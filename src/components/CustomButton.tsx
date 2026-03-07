/**
 * CustomButton Component
 * Simple wrapper for themed button styling
 */
import React from 'react';
import { Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function CustomButton({
  title,
  onPress,
  disabled = false,
  style,
  textStyle,
}: CustomButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.9}
      className={`rounded-xl px-5 py-3.5 items-center justify-center border border-transparent ${
        disabled ? 'bg-blue-400 opacity-70' : 'bg-blue-600'
      }`}
      style={style}
    >
      <Text className="text-white font-semibold text-[15px] tracking-wide" style={textStyle}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
