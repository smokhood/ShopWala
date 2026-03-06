/**
 * jest.d.ts
 * Global Jest type declarations for testing
 * This allows .test.ts files to use Jest globals without @types/jest
 */

declare global {
  namespace jest {
    interface Matchers<R> {
      toBe(expected: any): R;
      toEqual(expected: any): R;
      toStrictEqual(expected: any): R;
      toBeDefined(): R;
      toBeUndefined(): R;
      toBeNull(): R;
      toBeTruthy(): R;
      toBeFalsy(): R;
      toContain(item: any): R;
      toContainEqual(item: any): R;
      toHaveLength(length: number): R;
      toHaveProperty(property: string, value?: any): R;
      toBeCloseTo(expected: number, numDigits?: number): R;
      toBeGreaterThan(expected: number): R;
      toBeGreaterThanOrEqual(expected: number): R;
      toBeLessThan(expected: number): R;
      toBeLessThanOrEqual(expected: number): R;
      toBeInstanceOf(expected: any): R;
      toMatch(expected: string | RegExp): R;
      toMatchObject(expected: Record<string, any> | Record<string, any>[]): R;
      toThrow(expected?: string | RegExp | Error | Function): R;
      toThrowError(expected?: string | RegExp | Error | Function): R;
      toThrowErrorMatchingSnapshot(): R;
      not: Matchers<R>;
    }
  }

  interface Expect {
    <T>(actual: T): jest.Matchers<void>;
    assertions(num: number): void;
    hasAssertions(): void;
    anything(): any;
    any(expected: any): any;
    arrayContaining(expected: any[]): any;
    objectContaining(expected: Record<string, any>): any;
    stringContaining(expected: string): any;
    stringMatching(expected: string | RegExp): any;
  }

  const expect: Expect;
  const describe: {
    (name: string, fn: () => void): void;
    only(name: string, fn: () => void): void;
    skip(name: string, fn: () => void): void;
  };
  const it: {
    (name: string, fn: () => void | Promise<void>): void;
    only(name: string, fn: () => void | Promise<void>): void;
    skip(name: string, fn: () => void | Promise<void>): void;
  };
  const test: typeof it;
  const beforeEach: (fn: () => void | Promise<void>) => void;
  const afterEach: (fn: () => void | Promise<void>) => void;
  const beforeAll: (fn: () => void | Promise<void>) => void;
  const afterAll: (fn: () => void | Promise<void>) => void;
}

export { };

