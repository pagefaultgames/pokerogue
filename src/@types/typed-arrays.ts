/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: SirzBenjie
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Collection of utility types for working with
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray | TypedArray}
 * with enhanced type safety and usability.
 * @module
 */

/**
 * Union type of all {@linkcode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray | TypedArray}s
 */
export type TypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | BigInt64Array
  | BigUint64Array;

/**
 * A readonly version of {@linkcode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Int8Array | Int8Array}
 *
 * @remarks
 * Is to `Int8Array` what `ReadonlyArray` is to `Array`
 */
export interface ReadonlyInt8Array<TArrayBuffer extends ArrayBufferLike = ArrayBufferLike>
  extends Omit<Int8Array, "fill" | "set" | "sort" | "reverse" | "copyWithin" | "subarray"> {
  subarray(begin?: number, end?: number): ReadonlyInt8Array<TArrayBuffer>;
  readonly [index: number]: number;
}
/**
 * A readonly version of {@linkcode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array | Uint8Array}
 *
 * @remarks
 * Is to `Uint8Array` what `ReadonlyArray` is to `Array`
 */
export interface ReadonlyUint8Array<TArrayBuffer extends ArrayBufferLike = ArrayBufferLike>
  extends Omit<Uint8Array, "fill" | "set" | "sort" | "reverse" | "copyWithin" | "subarray"> {
  subarray(begin?: number, end?: number): ReadonlyUint8Array<TArrayBuffer>;
  readonly [index: number]: number;
}
/**
 * A readonly version of {@linkcode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8ClampedArray | Uint8ClampedArray}
 *
 * @remarks
 * Is to `Uint8ClampedArray` what `ReadonlyArray` is to `Array`
 */
export interface ReadonlyUint8ClampedArray<TArrayBuffer extends ArrayBufferLike = ArrayBufferLike>
  extends Omit<Uint8ClampedArray<TArrayBuffer>, "fill" | "set" | "sort" | "reverse" | "copyWithin" | "subarray"> {
  subarray(begin?: number, end?: number): ReadonlyUint8ClampedArray<TArrayBuffer>;
  readonly [index: number]: number;
}
/**
 * A readonly version of {@linkcode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Int16Array | Int16Array}
 *
 * @remarks
 * Is to `Int16Array` what `ReadonlyArray` is to `Array`
 */
export interface ReadonlyInt16Array<TArrayBuffer extends ArrayBufferLike = ArrayBufferLike>
  extends Omit<Int16Array<TArrayBuffer>, "fill" | "set" | "sort" | "reverse" | "copyWithin" | "subarray"> {
  subarray(begin?: number, end?: number): ReadonlyInt16Array<TArrayBuffer>;
  readonly [index: number]: number;
}
/**
 * A readonly version of {@linkcode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint16Array | Uint16Array}
 *
 * @remarks
 * Is to `Uint16Array` what `ReadonlyArray` is to `Array`
 */
export interface ReadonlyUint16Array<TArrayBuffer extends ArrayBufferLike = ArrayBufferLike>
  extends Omit<Uint16Array<TArrayBuffer>, "fill" | "set" | "sort" | "reverse" | "copyWithin" | "subarray"> {
  subarray(begin?: number, end?: number): ReadonlyUint16Array<TArrayBuffer>;
  readonly [index: number]: number;
}
/**
 * A readonly version of {@linkcode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Int32Array | Int32Array}
 *
 * @remarks
 * Is to `Int32Array` what `ReadonlyArray` is to `Array`
 */
export interface ReadonlyInt32Array<TArrayBuffer extends ArrayBufferLike = ArrayBufferLike>
  extends Omit<Int32Array<TArrayBuffer>, "fill" | "set" | "sort" | "reverse" | "copyWithin" | "subarray"> {
  subarray(begin?: number, end?: number): ReadonlyInt32Array<TArrayBuffer>;
  readonly [index: number]: number;
}
/**
 * A readonly version of {@linkcode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint32Array | Uint32Array}
 *
 * @remarks
 * Is to `Uint32Array` what `ReadonlyArray` is to `Array`
 */
export interface ReadonlyUint32Array<TArrayBuffer extends ArrayBufferLike = ArrayBufferLike>
  extends Omit<Uint32Array<TArrayBuffer>, "fill" | "set" | "sort" | "reverse" | "copyWithin" | "subarray"> {
  subarray(begin?: number, end?: number): ReadonlyUint32Array<TArrayBuffer>;
  readonly [index: number]: number;
}
/**
 * A readonly version of {@linkcode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float32Array | Float32Array}
 *
 * @remarks
 * Is to `Float32Array` what `ReadonlyArray` is to `Array`
 */
export interface ReadonlyFloat32Array<TArrayBuffer extends ArrayBufferLike = ArrayBufferLike>
  extends Omit<Float32Array<TArrayBuffer>, "fill" | "set" | "sort" | "reverse" | "copyWithin" | "subarray"> {
  subarray(begin?: number, end?: number): ReadonlyFloat32Array<TArrayBuffer>;
  readonly [index: number]: number;
}
/**
 * A readonly version of {@linkcode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float64Array | Float64Array}
 *
 * @remarks
 * Is to `Float64Array` what `ReadonlyArray` is to `Array`
 */
export interface ReadonlyFloat64Array<TArrayBuffer extends ArrayBufferLike = ArrayBufferLike>
  extends Omit<Float64Array, "fill" | "set" | "sort" | "reverse" | "copyWithin" | "subarray"> {
  subarray(begin?: number, end?: number): ReadonlyFloat64Array<TArrayBuffer>;
  readonly [index: number]: number;
}
/**
 * A readonly version of {@linkcode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt64Array | BigInt64Array}
 *
 * @remarks
 * Is to `BigInt64Array` what `ReadonlyArray` is to `Array`
 */
export interface ReadonlyBigInt64Array<TArrayBuffer extends ArrayBufferLike = ArrayBufferLike>
  extends Omit<BigInt64Array, "fill" | "set" | "sort" | "reverse" | "copyWithin" | "subarray"> {
  subarray(begin?: number, end?: number): ReadonlyBigInt64Array<TArrayBuffer>;
  readonly [index: number]: bigint;
}
/**
 * A readonly version of {@linkcode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigUint64Array | BigUint64Array}
 *
 * @remarks
 * Is to `BigUint64Array` what `ReadonlyArray` is to `Array`
 */
export interface ReadonlyBigUint64Array<TArrayBuffer extends ArrayBufferLike = ArrayBufferLike>
  extends Omit<BigUint64Array, "fill" | "set" | "sort" | "reverse" | "copyWithin" | "subarray"> {
  subarray(begin?: number, end?: number): ReadonlyBigUint64Array<TArrayBuffer>;
  readonly [index: number]: bigint;
}

export type ReadonlyTypedArray =
  | ReadonlyInt8Array
  | ReadonlyUint8Array
  | ReadonlyUint8ClampedArray
  | ReadonlyInt16Array
  | ReadonlyUint16Array
  | ReadonlyInt32Array
  | ReadonlyUint32Array
  | ReadonlyFloat32Array
  | ReadonlyFloat64Array
  | ReadonlyBigInt64Array
  | ReadonlyBigUint64Array;

/**
 * Either {@linkcode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt64Array | BigInt64Array}
 * or {@linkcode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt64Array | BigUint64Array}
 */
export type BigIntArray = BigInt64Array | BigUint64Array;

export type ReadonlyBigIntArray = ReadonlyBigInt64Array | ReadonlyBigUint64Array;

/** Any {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray | TypedArray} whose elements are not `bigint`s */
export type NumberCompatibleTypedArray = Exclude<TypedArray, BigIntArray>;

export type ReadonlyNumberCompatibleTypedArray = Exclude<ReadonlyTypedArray, ReadonlyBigIntArray>;

/**
 * A partial interface of `Uint8Array` where methods that return the array type have been modified to return a more specific type.
 *
 * @privateRemarks
 * Excludes methods that return a new array (e.g. `subarray`, `slice`, `toReversed`, `toSorted`, `with`) as these cannot be resolved by typescript
 * @internal
 */
interface PartialUint8Array<T extends number> extends Uint8Array {
  at(index: number): T | undefined; // ES2022
  entries(): ArrayIterator<[number, T]>;
  fill(value: T, start?: number, end?: number): this;
  find(predicate: (value: T, index: number, array: this) => boolean, thisArg?: any): T | undefined;
  findLast(predicate: (value: T, index: number, array: this) => boolean, thisArg?: any): T | undefined;
  forEach(callbackfn: (value: T, index: number, array: this) => void, thisArg?: any): void;
  includes(searchElement: T, fromIndex?: number): boolean;
  indexOf(searchElement: T, fromIndex?: number): number;
  lastIndexOf(searchElement: T, fromIndex?: number): number;
  reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: this) => T): T;
  reduceRight(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: this) => T): T;
  set(array: ArrayLike<T>, offset?: number): void;
  some(predicate: (value: T, index: number, obj: this) => boolean, thisArg?: any): boolean;
  sort(compareFn?: (a: T, b: T) => number): this;
  values(): ArrayIterator<T>;
  [Symbol.iterator](): ArrayIterator<T>;
  [index: number]: T;
}

/**
 * A `Uint8Array` whose elements typescript considers to be of type `T`, allowing for type-safe iteration and access.
 *
 * @remarks
 * Useful to leverage the benefits of `TypedArrays` without losing type information. Typescript will consider the elements to be of type `T` instead of just `number`.
 * @typeParam T - The specific numeric type of the elements in the array.
 */
// @ts-expect-error - These methods _will_ error, as we are overriding the return type to be more specific in a way that makes typescript unhappy
export interface GenericUint8Array<T extends number> extends PartialUint8Array<T> {
  // map(callbackfn: (value: T, index: number, array: this) => T, thisArg?: any): GenericUint8Array<T>;
  // this method does not trigger a typescript error on its own, but if we add in `toReversed` it causes issues....
  subarray(begin?: number, end?: number): GenericUint8Array<T>;
  toReversed(): GenericUint8Array<T>;
  toSorted(compareFn?: (a: T, b: T) => number): GenericUint8Array<T>;
  filter(predicate: (value: T, index: number, array: this) => any, thisArg?: any): GenericUint8Array<T>;
}

/**
 * A partial interface of `Uint16Array` where methods that return the array type have been modified to return a more specific type.
 *
 * @privateRemarks
 * Excludes methods that return a new array (e.g. `subarray`, `slice`, `toReversed`, `toSorted`, `with`) as these cannot be resolved by typescript
 * @internal
 */
interface PartialUint16Array<T extends number> extends Uint16Array {
  at(index: number): T | undefined; // ES2022
  entries(): ArrayIterator<[number, T]>;
  fill(value: T, start?: number, end?: number): this;
  find(predicate: (value: T, index: number, array: this) => boolean, thisArg?: any): T | undefined;
  findLast(predicate: (value: number, index: number, array: this) => boolean, thisArg?: any): T | undefined;
  forEach(callbackfn: (value: T, index: number, array: this) => void, thisArg?: any): void;
  includes(searchElement: T, fromIndex?: number): boolean;
  indexOf(searchElement: T, fromIndex?: number): number;
  lastIndexOf(searchElement: T, fromIndex?: number): number;
  reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: this) => T): T;
  reduceRight(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: this) => T): T;
  set(array: ArrayLike<T>, offset?: number): void;
  some(predicate: (value: T, index: number, obj: this) => boolean, thisArg?: any): boolean;
  sort(compareFn?: (a: T, b: T) => number): this;
  values(): ArrayIterator<T>;
  [Symbol.iterator](): ArrayIterator<T>;
  [index: number]: T;
}

/**
 * A `Uint16Array` whose elements typescript considers to be of type `T`, allowing for type-safe iteration and access.
 *
 * @remarks
 * Useful to leverage the benefits of `TypedArrays` without losing type information. Typescript will consider the elements to be of type `T` instead of just `number`.
 * @typeParam T - The specific numeric type of the elements in the array.
 */
// @ts-expect-error - These methods _will_ error, as we are overriding the return type to be more specific in a way that makes typescript unhappy
export interface GenericUint16Array<T extends number> extends PartialUint16Array<T> {
  // map(callbackfn: (value: T, index: number, array: this) => T, thisArg?: any): GenericUint16Array<T>;
  // this method does not trigger a typescript error on its own, but if we add in `toReversed` it causes issues....
  subarray(begin?: number, end?: number): GenericUint16Array<T>;
  toReversed(): GenericUint16Array<T>;
  toSorted(compareFn?: (a: T, b: T) => number): GenericUint16Array<T>;
  filter(predicate: (value: T, index: number, array: this) => any, thisArg?: any): GenericUint16Array<T>;
}

/**
 * A partial interface of `Uint32Array` where methods that return the array type have been modified to return a more specific type.
 *
 * @privateRemarks
 * Excludes methods that return a new array (e.g. `subarray`, `slice`, `toReversed`, `toSorted`, `with`) as these cannot be resolved by typescript
 * @internal
 */
interface PartialUint32Array<T extends number> extends Uint32Array {
  at(index: number): T | undefined; // ES2022
  entries(): ArrayIterator<[number, T]>;
  fill(value: T, start?: number, end?: number): this;
  find(predicate: (value: T, index: number, array: this) => boolean, thisArg?: any): T | undefined;
  findLast(predicate: (value: number, index: number, array: this) => boolean, thisArg?: any): T | undefined;
  forEach(callbackfn: (value: T, index: number, array: this) => void, thisArg?: any): void;
  includes(searchElement: T, fromIndex?: number): boolean;
  indexOf(searchElement: T, fromIndex?: number): number;
  lastIndexOf(searchElement: T, fromIndex?: number): number;
  reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: this) => T): T;
  reduceRight(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: this) => T): T;
  set(array: ArrayLike<T>, offset?: number): void;
  some(predicate: (value: T, index: number, obj: this) => boolean, thisArg?: any): boolean;
  sort(compareFn?: (a: T, b: T) => number): this;
  values(): ArrayIterator<T>;
  [Symbol.iterator](): ArrayIterator<T>;
  [index: number]: T;
}

/**
 * A `Uint32Array` whose elements typescript considers to be of type `T`, allowing for type-safe iteration and access.
 *
 * @remarks
 * Useful to leverage the benefits of `TypedArrays` without losing type information. Typescript will consider the elements to be of type `T` instead of just `number`.
 * @typeParam T - The specific numeric type of the elements in the array.
 */
// @ts-expect-error - These methods _will_ error, as we are overriding the return type to be more specific in a way that makes typescript unhappy
export interface GenericUint32Array<T extends number> extends PartialUint32Array<T> {
  // map(callbackfn: (value: T, index: number, array: this) => T, thisArg?: any): GenericUint32Array<T>;
  // this method does not trigger a typescript error on its own, but if we add in `toReversed` it causes issues....
  subarray(begin?: number, end?: number): GenericUint32Array<T>;
  toReversed(): GenericUint32Array<T>;
  toSorted(compareFn?: (a: T, b: T) => number): GenericUint32Array<T>;
  filter(predicate: (value: T, index: number, array: this) => any, thisArg?: any): GenericUint32Array<T>;
}

/**
 * A partial interface of `Int8Array` where methods that return the array type have been modified to return a more specific type.
 *
 * @privateRemarks
 * Excludes methods that return a new array (e.g. `subarray`, `slice`, `toReversed`, `toSorted`, `with`) as these cannot be resolved by typescript
 * @internal
 */
interface PartialInt8Array<T extends number> extends Int8Array {
  at(index: number): T | undefined; // ES2022
  entries(): ArrayIterator<[number, T]>;
  fill(value: T, start?: number, end?: number): this;
  find(predicate: (value: T, index: number, array: this) => boolean, thisArg?: any): T | undefined;
  findLast(predicate: (value: number, index: number, array: this) => boolean, thisArg?: any): T | undefined;
  forEach(callbackfn: (value: T, index: number, array: this) => void, thisArg?: any): void;
  includes(searchElement: T, fromIndex?: number): boolean;
  indexOf(searchElement: T, fromIndex?: number): number;
  lastIndexOf(searchElement: T, fromIndex?: number): number;
  reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: this) => T): T;
  reduceRight(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: this) => T): T;
  set(array: ArrayLike<T>, offset?: number): void;
  some(predicate: (value: T, index: number, obj: this) => boolean, thisArg?: any): boolean;
  sort(compareFn?: (a: T, b: T) => number): this;
  values(): ArrayIterator<T>;
  [Symbol.iterator](): ArrayIterator<T>;
  [index: number]: T;
}

/**
 * A `Int8Array` whose elements typescript considers to be of type `T`, allowing for type-safe iteration and access.
 *
 * @remarks
 * Useful to leverage the benefits of `TypedArrays` without losing type information. Typescript will consider the elements to be of type `T` instead of just `number`.
 * @typeParam T - The specific numeric type of the elements in the array.
 */
// @ts-expect-error - These methods _will_ error, as we are overriding the return type to be more specific in a way that makes typescript unhappy
export interface GenericInt8Array<T extends number> extends PartialInt8Array<T> {
  // map(callbackfn: (value: T, index: number, array: this) => T, thisArg?: any): GenericInt8Array<T>;
  // this method does not trigger a typescript error on its own, but if we add in `toReversed` it causes issues....
  subarray(begin?: number, end?: number): GenericInt8Array<T>;
  toReversed(): GenericInt8Array<T>;
  toSorted(compareFn?: (a: T, b: T) => number): GenericInt8Array<T>;
  filter(predicate: (value: T, index: number, array: this) => any, thisArg?: any): GenericInt8Array<T>;
}

/**
 * A partial interface of `Int16Array` where methods that return the array type have been modified to return a more specific type.
 *
 * @privateRemarks
 * Excludes methods that return a new array (e.g. `subarray`, `slice`, `toReversed`, `toSorted`, `with`) as these cannot be resolved by typescript
 * @internal
 */
interface PartialInt16Array<T extends number> extends Int16Array {
  at(index: number): T | undefined; // ES2022
  entries(): ArrayIterator<[number, T]>;
  fill(value: T, start?: number, end?: number): this;
  find(predicate: (value: T, index: number, array: this) => boolean, thisArg?: any): T | undefined;
  findLast(predicate: (value: number, index: number, array: this) => boolean, thisArg?: any): T | undefined;
  forEach(callbackfn: (value: T, index: number, array: this) => void, thisArg?: any): void;
  includes(searchElement: T, fromIndex?: number): boolean;
  indexOf(searchElement: T, fromIndex?: number): number;
  lastIndexOf(searchElement: T, fromIndex?: number): number;
  reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: this) => T): T;
  reduceRight(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: this) => T): T;
  set(array: ArrayLike<T>, offset?: number): void;
  some(predicate: (value: T, index: number, obj: this) => boolean, thisArg?: any): boolean;
  sort(compareFn?: (a: T, b: T) => number): this;
  values(): ArrayIterator<T>;
  [Symbol.iterator](): ArrayIterator<T>;
  [index: number]: T;
}

/**
 * A `Int16Array` whose elements typescript considers to be of type `T`, allowing for type-safe iteration and access.
 *
 * @remarks
 * Useful to leverage the benefits of `TypedArrays` without losing type information. Typescript will consider the elements to be of type `T` instead of just `number`.
 * @typeParam T - The specific numeric type of the elements in the array.
 */
// @ts-expect-error - These methods _will_ error, as we are overriding the return type to be more specific in a way that makes typescript unhappy
export interface GenericInt16Array<T extends number> extends PartialInt16Array<T> {
  // map(callbackfn: (value: T, index: number, array: this) => T, thisArg?: any): GenericInt16Array<T>;
  // this method does not trigger a typescript error on its own, but if we add in `toReversed` it causes issues....
  subarray(begin?: number, end?: number): GenericInt16Array<T>;
  toReversed(): GenericInt16Array<T>;
  toSorted(compareFn?: (a: T, b: T) => number): GenericInt16Array<T>;
  filter(predicate: (value: T, index: number, array: this) => any, thisArg?: any): GenericInt16Array<T>;
}

/**
 * A partial interface of `Int32Array` where methods that return the array type have been modified to return a more specific type.
 *
 * @privateRemarks
 * Excludes methods that return a new array (e.g. `subarray`, `slice`, `toReversed`, `toSorted`, `with`) as these cannot be resolved by typescript
 * @internal
 */
interface PartialInt32Array<T extends number> extends Int32Array {
  at(index: number): T | undefined; // ES2022
  entries(): ArrayIterator<[number, T]>;
  fill(value: T, start?: number, end?: number): this;
  find(predicate: (value: T, index: number, array: this) => boolean, thisArg?: any): T | undefined;
  findLast(predicate: (value: number, index: number, array: this) => boolean, thisArg?: any): T | undefined;
  forEach(callbackfn: (value: T, index: number, array: this) => void, thisArg?: any): void;
  includes(searchElement: T, fromIndex?: number): boolean;
  indexOf(searchElement: T, fromIndex?: number): number;
  lastIndexOf(searchElement: T, fromIndex?: number): number;
  reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: this) => T): T;
  reduceRight(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: this) => T): T;
  set(array: ArrayLike<T>, offset?: number): void;
  some(predicate: (value: T, index: number, obj: this) => boolean, thisArg?: any): boolean;
  sort(compareFn?: (a: T, b: T) => number): this;
  values(): ArrayIterator<T>;
  [Symbol.iterator](): ArrayIterator<T>;
  [index: number]: T;
}

/**
 * A `Int32Array` whose elements typescript considers to be of type `T`, allowing for type-safe iteration and access.
 *
 * @remarks
 * Useful to leverage the benefits of `TypedArrays` without losing type information. Typescript will consider the elements to be of type `T` instead of just `number`.
 * @typeParam T - The specific numeric type of the elements in the array.
 */
// @ts-expect-error - These methods _will_ error, as we are overriding the return type to be more specific in a way that makes typescript unhappy
export interface GenericInt32Array<T extends number> extends PartialInt32Array<T> {
  // map(callbackfn: (value: T, index: number, array: this) => T, thisArg?: any): GenericInt32Array<T>;
  // this method does not trigger a typescript error on its own, but if we add in `toReversed` it causes issues....
  subarray(begin?: number, end?: number): GenericInt32Array<T>;
  toReversed(): GenericInt32Array<T>;
  toSorted(compareFn?: (a: T, b: T) => number): GenericInt32Array<T>;
  filter(predicate: (value: T, index: number, array: this) => any, thisArg?: any): GenericInt32Array<T>;
}

/**
 * A readonly version of {@link GenericUint8Array} where elements are of type `T`.
 * @typeParam T - The specific numeric type of the elements in the array.
 * @remarks
 * Is to `GenericUint8Array` what `ReadonlyArray` is to `Array`
 */
export interface ReadonlyGenericUint8Array<T extends number>
  extends Omit<GenericUint8Array<T>, "fill" | "set" | "sort" | "reverse" | "copyWithin" | "subarray"> {
  subarray(begin?: number, end?: number): ReadonlyGenericUint8Array<T>;
  readonly [index: number]: T;
}

/**
 * A readonly version of {@link GenericUint16Array} where elements are of type `T`.
 * @typeParam T - The specific numeric type of the elements in the array.
 * @remarks
 * Is to `GenericUint16Array` what `ReadonlyArray` is to `Array`
 */
export interface ReadonlyGenericUint16Array<T extends number>
  extends Omit<GenericUint16Array<T>, "fill" | "set" | "sort" | "reverse" | "copyWithin" | "subarray"> {
  subarray(begin?: number, end?: number): ReadonlyGenericUint16Array<T>;
  readonly [index: number]: T;
}

/**
 * A readonly version of {@link GenericUint32Array} where elements are of type `T`.
 * @typeParam T - The specific numeric type of the elements in the array.
 * @remarks
 * Is to `GenericUint32Array` what `ReadonlyArray` is to `Array`
 */
export interface ReadonlyGenericUint32Array<T extends number>
  extends Omit<GenericUint32Array<T>, "fill" | "set" | "sort" | "reverse" | "copyWithin" | "subarray"> {
  subarray(begin?: number, end?: number): ReadonlyGenericUint32Array<T>;
  readonly [index: number]: T;
}

/**
 * A readonly version of {@link GenericInt8Array} where elements are of type `T`.
 * @typeParam T - The specific numeric type of the elements in the array.
 * @remarks
 * Is to `GenericInt8Array` what `ReadonlyArray` is to `Array`
 */
export interface ReadonlyGenericInt8Array<T extends number>
  extends Omit<GenericInt8Array<T>, "fill" | "set" | "sort" | "reverse" | "copyWithin" | "subarray"> {
  subarray(begin?: number, end?: number): ReadonlyGenericInt8Array<T>;
  readonly [index: number]: T;
}

/**
 * A readonly version of {@link GenericInt16Array} where elements are of type `T`.
 * @typeParam T - The specific numeric type of the elements in the array.
 * @remarks
 * Is to `GenericInt16Array` what `ReadonlyArray` is to `Array`
 */
export interface ReadonlyGenericInt16Array<T extends number>
  extends Omit<GenericInt16Array<T>, "fill" | "set" | "sort" | "reverse" | "copyWithin" | "subarray"> {
  subarray(begin?: number, end?: number): ReadonlyGenericInt16Array<T>;
  readonly [index: number]: T;
}

/**
 * A readonly version of {@link GenericInt32Array} where elements are of type `T`.
 * @typeParam T - The specific numeric type of the elements in the array.
 * @remarks
 * Is to `GenericInt32Array` what `ReadonlyArray` is to `Array`
 */
export interface ReadonlyGenericInt32Array<T extends number>
  extends Omit<GenericInt32Array<T>, "fill" | "set" | "sort" | "reverse" | "copyWithin" | "subarray"> {
  subarray(begin?: number, end?: number): ReadonlyGenericInt32Array<T>;
  readonly [index: number]: T;
}

/**
 * A union type of all `GenericTypedArray`s
 */
export type ReadonlyGenericArray<T extends number = number> =
  | ReadonlyGenericUint8Array<T>
  | ReadonlyGenericUint16Array<T>
  | ReadonlyGenericUint32Array<T>
  | ReadonlyGenericInt8Array<T>
  | ReadonlyGenericInt16Array<T>
  | ReadonlyGenericInt32Array<T>;
