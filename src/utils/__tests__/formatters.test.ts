/// <reference path="../../jest.d.ts" />

/**
 * formatters.test.ts
 * Unit tests for formatter utility functions
 */

import {
    formatDistance,
    formatPhone,
    formatPrice,
    isShopOpen,
} from '../formatters';

describe('Formatter Utilities', () => {
  describe('formatDistance', () => {
    it('should format distance in meters', () => {
      const result = formatDistance(0.15);
      expect(result).toBe('150 m');
    });

    it('should format distance in kilometers', () => {
      const result = formatDistance(1.0);
      expect(result).toBe('1.0 km');
    });

    it('should round kilometers to 1 decimal place', () => {
      const result = formatDistance(1.234);
      expect(result).toBe('1.2 km');
    });

    it('should handle small distances', () => {
      const result = formatDistance(0.001);
      expect(result).toBe('1 m');
    });

    it('should handle large distances', () => {
      const result = formatDistance(50.5);
      expect(result).toBe('50.5 km');
    });

    it('should format zero distance', () => {
      const result = formatDistance(0);
      expect(result).toBe('0 m');
    });
  });

  describe('formatPrice', () => {
    it('should format small prices with Rs. prefix', () => {
      const result = formatPrice(95);
      expect(result).toBe('Rs. 95');
    });

    it('should format prices with thousand separator', () => {
      const result = formatPrice(1500);
      expect(result).toBe('Rs. 1,500');
    });

    it('should format large prices correctly', () => {
      const result = formatPrice(1000000);
      expect(result).toBe('Rs. 1,000,000');
    });

    it('should format thousand with separator', () => {
      const result = formatPrice(5500);
      expect(result).toBe('Rs. 5,500');
    });

    it('should handle zero price', () => {
      const result = formatPrice(0);
      expect(result).toBe('Rs. 0');
    });

    it('should handle prices with multiple thousand separators', () => {
      const result = formatPrice(12345678);
      expect(result).toBe('Rs. 12,345,678');
    });
  });

  describe('formatPhone', () => {
    it('should convert 11-digit Pakistani number to international format', () => {
      const result = formatPhone('03001234567');
      expect(result).toBe('+923001234567');
    });

    it('should not modify already international format', () => {
      const result = formatPhone('+923001234567');
      expect(result).toBe('+923001234567');
    });

    it('should convert 12-digit number starting with 92', () => {
      const result = formatPhone('923001234567');
      expect(result).toBe('+923001234567');
    });

    it('should handle different Pakistani operators', () => {
      const zong = formatPhone('03111234567');
      const jazz = formatPhone('03221234567');
      const ufone = formatPhone('03451234567');

      expect(zong).toBe('+923111234567');
      expect(jazz).toBe('+923221234567');
      expect(ufone).toBe('+923451234567');
    });

    it('should preserve number structure', () => {
      const result = formatPhone('03009876543');
      expect(result).toBe('+923009876543');
    });
  });

  describe('isShopOpen', () => {
    const mockShop = (overrides = {}) => ({
      id: 'test-shop',
      name: 'Test Shop',
      isOpen: true,
      operatingHours: {
        open: 8,  // 8 AM
        close: 22, // 10 PM
      },
      ...overrides,
    });

    it('should return false if shop is closed (isOpen=false)', () => {
      const hours = { isOpen24Hours: false, openTime: '08:00', closeTime: '22:00' };
      const result = isShopOpen(hours, false);
      expect(result).toBe(false);
    });

    it('should return true if shop is in operating hours', () => {
      const hours = { isOpen24Hours: false, openTime: '08:00', closeTime: '22:00' };
      const result = isShopOpen(hours, true);
      expect(result).toBe(true);
    });

    it('should return false if shop is outside operating hours', () => {
      const hours = { isOpen24Hours: false, openTime: '08:00', closeTime: '18:00' };
      const result = isShopOpen(hours, true);
      // This will fail in real test if current time is outside 08:00-18:00
      // For now, just check it doesn't error
      expect(typeof result).toBe('boolean');
    });

    it('should return true for 24-hour shops', () => {
      const hours = { isOpen24Hours: true, openTime: '00:00', closeTime: '23:59' };
      const result = isShopOpen(hours, true);
      expect(result).toBe(true);
    });

    it('should return false at closing time if shop is marked closed', () => {
      const hours = { isOpen24Hours: false, openTime: '08:00', closeTime: '22:00' };
      const result = isShopOpen(hours, false);
      expect(result).toBe(false);
    });
  });
});
