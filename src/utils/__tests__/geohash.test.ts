/// <reference path="../../jest.d.ts" />

/**
 * geohash.test.ts
 * Unit tests for geohash utility functions
 */

import { decodeGeohash, encodeGeohash, getGeohashesForRadius } from '../geohash';

describe('Geohash Utilities', () => {
  // Test data: Lahore coordinates
  const LAT = 31.5204;
  const LNG = 74.3587;

  describe('encodeGeohash', () => {
    it('should encode coordinates to geohash string', () => {
      const result = encodeGeohash(LAT, LNG, 6);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBe(6);
    });

    it('should return consistent results for same coordinates', () => {
      const result1 = encodeGeohash(LAT, LNG, 6);
      const result2 = encodeGeohash(LAT, LNG, 6);
      expect(result1).toBe(result2);
    });

    it('should return different hashes for different coordinates', () => {
      const hash1 = encodeGeohash(31.5204, 74.3587, 6);
      const hash2 = encodeGeohash(31.5205, 74.3588, 6);
      expect(hash1).not.toBe(hash2);
    });

    it('should support different precision levels', () => {
      const hash4 = encodeGeohash(LAT, LNG, 4);
      const hash6 = encodeGeohash(LAT, LNG, 6);
      const hash8 = encodeGeohash(LAT, LNG, 8);

      expect(hash4.length).toBe(4);
      expect(hash6.length).toBe(6);
      expect(hash8.length).toBe(8);
    });
  });

  describe('decodeGeohash', () => {
    it('should decode geohash back to approximate coordinates', () => {
      const hash = encodeGeohash(LAT, LNG, 6);
      const decoded = decodeGeohash(hash);

      expect(decoded).toBeDefined();
      expect(decoded.lat).toBeDefined();
      expect(decoded.lng).toBeDefined();
    });

    it('should return coordinates close to original', () => {
      const hash = encodeGeohash(LAT, LNG, 6);
      const decoded = decodeGeohash(hash);

      // With precision 6, should be within ~1.2km
      const latDiff = Math.abs(decoded.lat - LAT);
      const lngDiff = Math.abs(decoded.lng - LNG);

      expect(latDiff).toBeLessThan(0.01); // Roughly 1.1km
      expect(lngDiff).toBeLessThan(0.01);
    });

    it('should handle precision 8 with better accuracy', () => {
      const hash = encodeGeohash(LAT, LNG, 8);
      const decoded = decodeGeohash(hash);

      const latDiff = Math.abs(decoded.lat - LAT);
      const lngDiff = Math.abs(decoded.lng - LNG);

      expect(latDiff).toBeLessThan(0.001); // Much more accurate
      expect(lngDiff).toBeLessThan(0.001);
    });
  });

  describe('getGeohashesForRadius', () => {
    it('should return array of geohashes', () => {
      const result = getGeohashesForRadius(LAT, LNG, 5);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should use precision 6 for radius < 5km', () => {
      const result = getGeohashesForRadius(LAT, LNG, 3);
      expect(result.every(hash => hash.length === 6)).toBe(true);
    });

    it('should use precision 5 for radius 5-10km', () => {
      const result = getGeohashesForRadius(LAT, LNG, 7);
      expect(result.every(hash => hash.length === 5)).toBe(true);
    });

    it('should use precision 4 for radius > 10km', () => {
      const result = getGeohashesForRadius(LAT, LNG, 15);
      expect(result.every(hash => hash.length === 4)).toBe(true);
    });

    it('should increase number of hashes with larger radius', () => {
      const small = getGeohashesForRadius(LAT, LNG, 2);
      const medium = getGeohashesForRadius(LAT, LNG, 5);
      const large = getGeohashesForRadius(LAT, LNG, 10);

      expect(small.length).toBeLessThan(medium.length);
      expect(medium.length).toBeLessThan(large.length);
    });

    it('should include center geohash', () => {
      const hashes = getGeohashesForRadius(LAT, LNG, 5);
      const centerHash = encodeGeohash(LAT, LNG, 6);
      expect(hashes).toContain(centerHash);
    });
  });
});
