/**
 * This module contains the boilerplate code for boxed primitive-holder classes.
 * @module
 */

import type { ErrorType, IncompatibleTypeMessage } from "#types/error-type";
import type { Primitive } from "type-fest";

/**
 * Utility type to restrict the type of a function's parameter **without using `extends`**.
 * Used to allow a generic parameter to widen to its base type on function call,
 * while still providing helpful error messages for incompatible typing.
 * @internal
 * @example
 * ```ts
 * class MyClass<T> {
 *  constructor(value: T, ...MISMATCH: RestrictParamNoExtend<T, number>) {
 *     // ...
 *   }
 * }
 *
 * const foo = new MyClass(42); // ✅ Allowed, T widens to number and foo is MyClass<number>
 * const bar = new MyClass("hello"); // ❌ Error: Expected to receive a number, but got a string instead!
 * ```
 */
type RestrictParamNoExtend<Value, Base> = [Value] extends [Base] // avoid distributing over unions to allow proper error messages instead of a big union of all possible mismatches
  ? []
  : [MISMATCH: ErrorType<IncompatibleTypeMessage<Base, Value>>];

/**
 * A generic "boxed object" class that can contain any primitive value. \
 * Used to allow persisting changes to values like numbers and strings between function calls.
 * @typeParam Value - The value type being held.
 * Must extend from `Base` for the class to be constructable!
 * @typeParam Base - The base type to constrain `Value`'s possible values; must be a {@linkcode Primitive}
 * @privateRemarks
 * Subclasses **must not** use any `extends` clauses on `Value` to allow it to widen to a literal value's underlying base
 * type on class instantiation.
 * This ensures that calling `new XYZHolder(MyEnum.A)` will default to using `MyEnum` as the type parameter
 * instead of `MyEnum.A` (and likewise for `0`/`number`, `"foo"`/`string`, etc.).
 */
export class ValueHolder<Value, Base extends Primitive = Primitive> {
  /**
   * The stored value.
   * @sealed
   */
  public value: Value & Base;

  /**
   * Create a new `ValueHolder` with the provided initial value.
   * @param value - The initial value to store in the holder
   * @param MISMATCH - Dummy parameter used to prevent constructing the class with an invalid type for `value`
   * @sealed
   */
  constructor(value: Value, ...MISMATCH: RestrictParamNoExtend<Value, Base>);
  // biome-ignore lint/nursery/noShadow: bug in biome with constructor overloads
  constructor(value: Value) {
    this.value = value as Value & Base;
  }
}

/**
 * An alias for a number-only {@linkcode ValueHolder}.
 * @deprecated
 * New code should prefer using `ValueHolder` instead - this is kept for compatibility reasons
 */
export class NumberHolder<T> extends ValueHolder<T, number> {}
/**
 * An alias for a boolean-only {@linkcode ValueHolder}.
 * @deprecated
 * New code should prefer using `ValueHolder` instead - this is kept for compatibility
 */
export class BooleanHolder<T> extends ValueHolder<T, boolean> {}
