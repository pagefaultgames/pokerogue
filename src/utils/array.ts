import type {
  ReadonlyBigInt64Array,
  ReadonlyBigIntArray,
  ReadonlyBigUint64Array,
  ReadonlyGenericArray,
  ReadonlyNumberCompatibleTypedArray,
  ReadonlyTypedArray,
  TypedArray,
} from "#types/typed-arrays";

/**
 * If the input isn't already an array, turns it into one.
 * @returns An array with the same type as the type of the input
 */
export function coerceArray<T>(input: T): T extends readonly any[] ? T : [T];
export function coerceArray<T>(input: T): T | [T] {
  return Array.isArray(input) ? input : [input];
}

/**
 * Type guard to check if an input is a typed array, defined as an `ArrayBufferView` that is not a `DataView`.
 */
export function isTypedArray(input: unknown): input is TypedArray {
  return ArrayBuffer.isView(input) && !(input instanceof DataView);
}

/**
 * Get a subarray view of the first `n` elements of an array-like object, to use
 * with constructing a new one, with minimal allocaitons.
 *
 * @remarks
 * This is primarily useful for setting elements of a `TypedArray` using its `set` method.
 *
 * @privateRemarks
 * Note that if this is used with a tuple type, typescript will improperly set
 * the return type to be a tuple of the same length as input.
 *
 * @param arr - The array-like object to take elements from
 * @param n - The maximum number of elements to take. If
 * @returns An array-like object whose `length` property is guaranteed to be <= `n`
 *
 * @typeParam T - The element type of the array-like object
 * @typeParam A - The type of the array-like object
 *
 * @example
 * ```
 * const arr = new Uint8Array(3);
 * const other = [1, 2, 3, 4, 5];
 * // Using arr.set(other) would throw, as other.length > arr.length
 * arr.set(subArray(other, arr.length));
 *
 * @throws {TypeError}
 * If `arr` is not an array or typed array (though typescript should prevent this)
 */
export function subArray<const A extends ReadonlyTypedArray | readonly unknown[]>(arr: A, n: number): typeof arr {
  if (arr.length <= n) {
    return arr;
  }

  const len = Math.min(arr.length, n);

  if (Array.isArray(arr)) {
    // The only path with a new allocation
    return arr.slice(0, len) as typeof arr;
  }
  if (isTypedArray(arr)) {
    return arr.subarray(0, len) as typeof arr;
  }
  throw new TypeError("Expecting an array or typed array");
}

/**
 * Store multiple values in the typed array, from input values from a specified array, without
 * the possibility of a `RangeError` being thrown.
 *
 * @remarks
 * Almost equivalent to calling `target.set(source, offset)`, though ensures that
 * `RangeError` can never be thrown by clamping the number of elements taken from `source`
 * to the available space in `target` starting at `offset`.
 *
 * @param target - The typed array to set values in
 * @param source - The array-like object to take values from
 * @param offset - The offset in `target` to start writing values at, default `0`
 *
 * @see {@linkcode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/set | TypedArray#set}
 */
export function setTypedArray<const T extends ReadonlyTypedArray | ReadonlyGenericArray>(
  target: T,
  source: T extends ReadonlyBigInt64Array | ReadonlyBigUint64Array
    ? ReadonlyBigIntArray | readonly bigint[]
    : ReadonlyNumberCompatibleTypedArray | readonly number[],
  offset = 0,
): void {
  if (offset < 0 || offset >= target.length) {
    return;
  }

  // @ts-expect-error - TS can't link the conditional type of source to the conditional type of target
  // in the body here, despite the fact that the function signature guarantees it.
  target.set(subArray(source, target.length - offset), offset);
}
