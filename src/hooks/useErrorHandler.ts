/**
 * useErrorHandler Hook - Centralized error handling and reporting
 * Provides consistent error handling across the app
 */
import { useCallback } from 'react';
import { Alert } from 'react-native';

export interface ErrorContext {
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface AppError extends Error {
  code?: string;
  context?: ErrorContext;
}

/**
 * Parse Firebase errors into user-friendly messages
 */
function parseFirebaseError(error: any): string {
  const code = error?.code || '';

  // Auth errors
  if (code.startsWith('auth/')) {
    switch (code) {
      case 'auth/network-request-failed':
        return 'انٹرنیٹ کنکشن چیک کریں';
      case 'auth/too-many-requests':
        return 'بہت زیادہ کوششیں۔ کچھ دیر بعد کوشش کریں';
      case 'auth/user-disabled':
        return 'اکاؤنٹ بند کردیا گیا';
      case 'auth/user-not-found':
        return 'صارف نہیں ملا';
      case 'auth/invalid-phone-number':
        return 'فون نمبر غلط ہے';
      case 'auth/invalid-verification-code':
        return 'OTP غلط ہے';
      case 'auth/code-expired':
        return 'OTP کی میعاد ختم ہو گئی';
      case 'auth/requires-recent-login':
        return 'Security ke liye dobara login karein';
      default:
        return 'Authentication مسئلہ';
    }
  }

  // Firestore errors
  if (code.startsWith('firestore/')) {
    switch (code) {
      case 'firestore/permission-denied':
        return 'رسائی کی اجازت نہیں';
      case 'firestore/unavailable':
        return 'سرور دستیاب نہیں۔ دوبارہ کوشش کریں';
      case 'firestore/not-found':
        return 'ڈیٹا نہیں ملا';
      default:
        return 'ڈیٹا محفوظ کرنے میں مسئلہ';
    }
  }

  // Network errors
  if (error?.message?.toLowerCase().includes('network')) {
    return 'انٹرنیٹ کنکشن چیک کریں';
  }

  // Default
  return error?.message || 'کچھ غلط ہو گیا';
}

/**
 * Log error for debugging/monitoring
 */
function logError(error: AppError, context?: ErrorContext) {
  const timestamp = new Date().toISOString();
  const logMessage = [
    `[Error] ${timestamp}`,
    `Message: ${error.message}`,
    context?.component && `Component: ${context.component}`,
    context?.action && `Action: ${context.action}`,
    error.code && `Code: ${error.code}`,
    error.stack && `Stack: ${error.stack}`,
    context?.metadata && `Metadata: ${JSON.stringify(context.metadata)}`,
  ]
    .filter(Boolean)
    .join('\n');

  console.error(logMessage);

  // In production, you would send this to a monitoring service like Sentry
  // if (__DEV__) {
  //   console.error(logMessage);
  // } else {
  //   // Send to monitoring service
  //   Sentry.captureException(error, { contexts: { context } });
  // }
}

export function useErrorHandler() {
  /**
   * Handle error with user feedback and logging
   */
  const handleError = useCallback(
    (error: Error | AppError | any, context?: ErrorContext, silent = false) => {
      // Extract or create AppError
      const appError: AppError = error instanceof Error ? error : new Error(String(error));
      if (context) {
        appError.context = context;
      }

      // Log error
      logError(appError, context);

      // Show user feedback if not silent
      if (!silent) {
        const userMessage = parseFirebaseError(error);
        Alert.alert('خرابی', userMessage, [{ text: 'ٹھیک ہے', style: 'cancel' }]);
      }
    },
    []
  );

  /**
   * Handle error silently (log only, no user alert)
   */
  const handleSilentError = useCallback(
    (error: Error | AppError | any, context?: ErrorContext) => {
      handleError(error, context, true);
    },
    [handleError]
  );

  /**
   * Create an error handler for a specific component/action
   */
  const createErrorHandler = useCallback(
    (component: string) => {
      return (error: Error | any, action?: string, metadata?: Record<string, any>) => {
        handleError(error, { component, action, metadata });
      };
    },
    [handleError]
  );

  return {
    handleError,
    handleSilentError,
    createErrorHandler,
  };
}
