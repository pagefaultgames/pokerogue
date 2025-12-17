/**
 * This module contains the boilerplate code for boxed primitive-holder classes,
 * as well as type helpers to allow validating their input.
 * @module
 */

import type { IsAny, IsNever, IsUnknown, Primitive } from "type-fest";

/**
 * Type alias representing any value able to be coerced to a string.
 */
type Stringable = string | number | bigint | boolean | null | undefined;

/**
 * Internal type helper to convert 2 values into strings.
 */
type PrintType<T> =
  IsUnknown<T> extends true
    ? "unknown"
    : IsNever<T> extends true
      ? "never"
      : IsAny<T> extends true
        ? never
        : T extends (...args: unknown[]) => never
          ? "a function"
          : T extends object
            ? "an object"
            : T extends symbol
              ? "a symbol"
              : T extends Stringable
                ? `${T}`
                : never;

/**
 * An invalid type.
 * Used solely to display IDE errors in a non-distributive way, and is functionally useless.
 */
type ErrorType<T extends string> = Error & T;

/**
 * Utility type to restrict the type of a function's parameter **without using `extends`**.
 */
type RestrictParamNoExtend<Value, Base> = Value extends Base
  ? [value: Value]
  : [value: Value, mismatch: ErrorType<GetErrorMsg<Value, Base>>];

type GetErrorMsg<Value, Base> = `Expected a value of type ${PrintType<Base>}, but got ${PrintType<Value>} instead!`;

/**
 * A generic "boxed object" class that can contain any primitive value.
 * Used to allow persisting changes to values like numbers and strings between function calls.
 * @typeParam V - The value type being held.
 * Must extend from `Base` for the class to be constructable!
 * @typeParam B - The base type to constrain `V`'s possible values; must extend from `Primitive`
 * @privateRemarks
 * This class does not use `extends` clauses on `V` to allow it to widen to a literal value's base
 * type on class instantiation.
 * This ensures that calling `new ValueHolder(MyEnum.A)` will default to using `MyEnum` as the type parameter
 * instead of `MyEnum.A`, though at the cost of slightly less helpful error messages.
 */
export class ValueHolder<V, Base extends Primitive> {
  /** The stored value. */
  public value: V;

  /**
   * Create a new `ValueHolder` with the provided initial value.
   * @param
   */
  constructor(...[value, mismatch]: RestrictParamNoExtend<V, Base>);
  constructor(value: V) {
    this.value = value;
  }

  valueOf(): V {
    return this.value;
  }
}

/** An alias for a number-only {@linkcode ValueHolder}. */
export type NumberHolder<T extends number = number> = ValueHolder<T, number>;
/** An alias for a boolean-only {@linkcode ValueHolder}. */
export type BooleanHolder = ValueHolder<boolean, boolean>;
