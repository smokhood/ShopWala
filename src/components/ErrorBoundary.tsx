/**
 * ErrorBoundary Component - Catches React rendering errors
 * Prevents app crashes by catching errors in component tree
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, send to monitoring service
    // Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <View className="flex-1 items-center justify-center bg-gray-50 p-6">
          <View className="bg-white rounded-2xl p-6 shadow-sm w-full max-w-sm">
            <View className="items-center mb-4">
              <Text className="text-6xl mb-2">⚠️</Text>
              <Text className="text-xl font-bold text-gray-800 text-center">
                کچھ غلط ہو گیا
              </Text>
            </View>

            <Text className="text-gray-600 text-center mb-6">
              ایپ میں خرابی آئی۔ براہ کرم دوبارہ کوشش کریں
            </Text>

            {__DEV__ && this.state.error && (
              <View className="bg-red-50 p-3 rounded-lg mb-4">
                <Text className="text-xs text-red-800 font-mono">
                  {this.state.error.message}
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={this.handleReset}
              className="bg-red-600 py-3 px-6 rounded-lg"
            >
              <Text className="text-white text-center font-semibold">
                دوبارہ کوشش کریں
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-gray-500 mt-6 text-center">
            اگر مسئلہ جاری رہے تو ایپ بند کر کے دوبارہ کھولیں
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}
