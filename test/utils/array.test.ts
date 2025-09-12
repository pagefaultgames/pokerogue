import { setTypedArray, subArray } from "#utils/array";
import { describe, expect, it } from "vitest";

/**
 * Unit tests for the utility methods in `src/utils/array-utils.ts`
 * @module
 */

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
    if (typeof BigUint64Array !== "undefined") {
      const target = new BigUint64Array(3);
      const source = [1n, 2n, 3n, 4n];

      setTypedArray(target, source, 1);
      expect(Array.from(target)).toEqual([0n, 1n, 2n]);
    }
  });
});
