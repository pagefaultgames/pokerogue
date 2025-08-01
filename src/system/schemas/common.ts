import { z } from "zod";

/*
Schemas for commonly used primitive types, to avoid repeated instantiations.
*/

/** Reusable schema for a positive integer, equivalent to `z.int().positive()`.*/
export const Z$PositiveInt = z.int().positive();

/** Reusable schema for a non-negative integer, equivalent to `z.int().nonnegative()`.*/
export const Z$NonNegativeInt = z.int().nonnegative();

/** Reusable schema for a boolean that coerces non-boolean inputs to `false` */
export const Z$BoolCatchToFalse = z.boolean().catch(false);

/** Reusable schema for a positive number, equivalent to `z.number().positive()`. */
export const Z$PositiveNumber = z.number().positive().catch(0);

/** Reusable schema for an optional non-negative integer that coerces invalid inputs to `undefined` */
export const Z$OptionalNonNegativeIntCatchToUndef = z.int().nonnegative().optional().catch(undefined);
