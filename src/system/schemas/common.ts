import { z } from "zod";

/*
Schemas for commonly used primitive types, to avoid repeated instantiations.
*/

/** Reusable schema for a positive integer, equivalent to `z.int().positive()`.*/
export const Z$PositiveInt = /*@__PURE__*/ z
  .int()
  .positive();

/** Reusable schema for a non-negative integer, equivalent to `z.int().nonnegative()`.*/
export const Z$NonNegativeInt = /*@__PURE__*/ z
  .int()
  .nonnegative();

/** Reusable schema for a boolean that coerces non-boolean inputs to `false` */
export const Z$BoolCatchToFalse = /*@__PURE__*/ z
  .boolean()
  .catch(false);

/** Reusable schema for an optional non-negative integer that coerces invalid inputs to `undefined` */
export const Z$OptionalNonNegativeIntCatchToUndef = /*@__PURE__*/ z
  .int()
  .nonnegative()
  .optional()
  .catch(undefined);
