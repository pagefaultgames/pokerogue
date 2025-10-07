import type { ReadonlyUint8Array } from "#types/typed-arrays";
import { coerceArray, isTypedArray, setTypedArray, subArray } from "#utils/array";
import { describe, expect, expectTypeOf, it } from "vitest";

/**
 * Unit tests for the utility methods in `src/utils/array.ts`
 * @module
 */

describe("Utils - Array", () => {
  describe("subArray", () => {
    it("returns the same array if length <= n (plain array)", () => {
      const arr = [1, 2, 3];
      const result = subArray(arr, 5);
      expect(result).toBe(arr);
      expect(result).toEqual([1, 2, 3]);
    });

    it("returns a sliced array if length > n (plain array)", () => {
      const arr = [1, 2, 3, 4, 5];
      const result = subArray(arr, 3);
      expect(result).not.toBe(arr);
      expect(result).toEqual([1, 2, 3]);
    });

    it("returns the same typed array if length <= n", () => {
      const arr = new Uint8Array([1, 2, 3]);
      const result = subArray(arr, 5);
      expect(result).toBe(arr);
      expect(Array.from(result)).toEqual([1, 2, 3]);
    });

    it("returns a subarray if length > n (typed array)", () => {
      const arr = new Uint8Array([1, 2, 3, 4, 5]);
      const result = subArray(arr, 2);
      expect(result).not.toBe(arr);
      expect(Array.from(result)).toEqual([1, 2]);
    });

    it("returns empty array if n is 0 (plain array)", () => {
      const arr = [1, 2, 3];
      const result = subArray(arr, 0);
      expect(result).toEqual([]);
    });

    it("returns empty typed array if n is 0", () => {
      const arr = new Uint8Array([1, 2, 3]);
      const result = subArray(arr, 0);
      expect(Array.from(result)).toEqual([]);
    });

    it("throws TypeError for non-array-like input", () => {
      // @ts-expect-error
      expect(() => subArray({ length: 4 }, 2)).toThrow(TypeError);
    });

    describe("output type inference", () => {
      it("plain array input", () => {
        const arr = [1, 2, 3, 4];
        const result = subArray(arr, 2);
        expectTypeOf(result).toEqualTypeOf<number[]>();
      });

      it("typed array input", () => {
        const arr = new Uint8Array([1, 2, 3, 4]);
        const result = subArray(arr, 2);
        // @ts-expect-error We get a questionable error about Uint8Array not being assignable to Uint8Array...
        expectTypeOf(result).toEqualTypeOf<Uint8Array>();
      });

      it("readonly array input", () => {
        const arr: readonly number[] = [1, 2, 3, 4];
        const result = subArray(arr, 2);
        expectTypeOf(result).toEqualTypeOf<readonly number[]>();
      });

      it("readonly typed array input", () => {
        const arr = new Uint8Array([1, 2, 3, 4]) as ReadonlyUint8Array;
        const result = subArray(arr, 2);
        expectTypeOf(result).toEqualTypeOf<ReadonlyUint8Array>();
      });
    });
  });

  describe("setTypedArray", () => {
    it("sets values from source to target with no offset (fits exactly)", () => {
      const target = new Uint8Array(3);
      const source = [1, 2, 3];
      setTypedArray(target, source);
      expect(Array.from(target)).toEqual([1, 2, 3]);
    });

    it("sets values from source to target with offset", () => {
      const target = new Uint8Array([0, 0, 0, 0, 0]);
      const source = [9, 8];
      setTypedArray(target, source, 2);
      expect(Array.from(target)).toEqual([0, 0, 9, 8, 0]);
    });

    it("clamps source if it would overflow target", () => {
      const target = new Uint8Array(4);
      const source = [1, 2, 3, 4, 5, 6];
      setTypedArray(target, source, 2);
      expect(Array.from(target)).toEqual([0, 0, 1, 2]);
    });

    it("does nothing if offset < 0", () => {
      const target = new Uint8Array([1, 2, 3]);
      const source = [4, 5, 6];
      setTypedArray(target, source, -1);
      expect(Array.from(target)).toEqual([1, 2, 3]);
    });

    it("does nothing if offset >= target.length", () => {
      const target = new Uint8Array([1, 2, 3]);
      const source = [4, 5, 6];
      setTypedArray(target, source, 3);
      expect(Array.from(target)).toEqual([1, 2, 3]);
    });

    it("does nothing if source is empty", () => {
      const target = new Uint8Array([1, 2, 3]);
      const source: number[] = [];
      setTypedArray(target, source, 1);
      expect(Array.from(target)).toEqual([1, 2, 3]);
    });

    it("works with typed array as source", () => {
      const target = new Uint8Array(4);
      const source = new Uint8Array([7, 8, 9]);
      setTypedArray(target, source, 1);
      expect(Array.from(target)).toEqual([0, 7, 8, 9]);
    });

    it("clamps source typed array if it would overflow target", () => {
      const target = new Uint8Array(3);
      const source = new Uint8Array([1, 2, 3, 4, 5]);
      setTypedArray(target, source, 1);
      expect(Array.from(target)).toEqual([0, 1, 2]);
    });

    it("works with BigUint64Array and bigint[]", () => {
      const target = new BigUint64Array(3);
      const source = [1n, 2n, 3n, 4n];

      setTypedArray(target, source, 1);
      expect(Array.from(target)).toEqual([0n, 1n, 2n]);
    });
  });

  describe("coerceArray", () => {
    it("returns the same array if input is already an array", () => {
      const arr = [1, 2, 3];
      const result = coerceArray(arr);
      expect(result).toBe(arr);
      expect(result).toEqual([1, 2, 3]);
    });

    it("wraps a non-array input in an array", () => {
      const input = 42;
      const result = coerceArray(input);
      expect(result).toEqual([42]);
    });

    it("wraps an object in an array", () => {
      const obj = { a: 1 };
      const result = coerceArray(obj);
      expect(result).toEqual([{ a: 1 }]);
    });

    it("wraps a string in an array", () => {
      const str = "hello";
      const result = coerceArray(str);
      expect(result).toEqual(["hello"]);
    });

    it("wraps null in an array", () => {
      const result = coerceArray(null);
      expect(result).toEqual([null]);
    });

    it("wraps undefined in an array", () => {
      const result = coerceArray(undefined);
      expect(result).toEqual([undefined]);
    });

    it("returns the same array for empty array input", () => {
      const arr: number[] = [];
      const result = coerceArray(arr);
      expect(result).toBe(arr);
      expect(result).toEqual([]);
    });

    describe("typing", () => {
      it("infers correct type for array input", () => {
        const arr = [1, 2, 3];
        const result = coerceArray(arr);
        expectTypeOf(result).toEqualTypeOf<number[]>();
      });

      it("infers correct type for non-array input", () => {
        const input = "test";
        const result = coerceArray(input);
        expectTypeOf(result).toEqualTypeOf<[string]>();
      });

      it("infers correct type for object input", () => {
        const obj = { key: "value" };
        const result = coerceArray(obj);
        expectTypeOf(result).toEqualTypeOf<[{ key: string }]>();
      });

      it("infers correct type for null input", () => {
        const result = coerceArray(null);
        expectTypeOf(result).toEqualTypeOf<[null]>();
      });

      it("infers correct type for undefined input", () => {
        const result = coerceArray(undefined);
        expectTypeOf(result).toEqualTypeOf<[undefined]>();
      });

      it("infers correct type for empty array input", () => {
        const arr: number[] = [];
        const result = coerceArray(arr);
        expectTypeOf(result).toEqualTypeOf<number[]>();
      });
    });
  });

  describe("isTypedArray", () => {
    it.each([
      ["Int8Array", Int8Array],
      ["Uint8ClampedArray", Uint8ClampedArray],
      ["Uint16Array", Uint16Array],
      ["Uint32Array", Uint32Array],
      ["Float64Array", Float64Array],
      ["Float32Array", Float32Array],
    ])("returns true for %s", (_, ArrayType) => {
      const arr = new ArrayType([1, 2, 3]);
      expect(isTypedArray(arr)).toBe(true);
    });

    it.each([
      ["BigUint64Array", BigUint64Array],
      ["BigInt64Array", BigInt64Array],
    ])("returns true for %s", (_, ArrayType) => {
      const arr = new ArrayType([1n, 2n, 3n]);
      expect(isTypedArray(arr)).toBe(true);
    });

    it.each([
      ["strings", "hello"],
      ["null", null],
      ["undefined", undefined],
      ["a number", 123],
      ["an object", { a: 1 }],
      ["a plain array", [1, 2, 3]],
      ["a DataView", new DataView(new ArrayBuffer(8))],
      ["an ArrayLike", { length: 2, 0: 1, 1: 2 }],
    ])("returns false for %s", (_, input) => {
      expect(isTypedArray(input)).toBe(false);
    });

    it("returns true for an object that extends a typed array", () => {
      class MyUint8Array extends Uint8Array {
        customMethod() {
          return "custom";
        }
      }
      const arr = new MyUint8Array([1, 2, 3]);
      expect(isTypedArray(arr)).toBe(true);
    });
  });
});
