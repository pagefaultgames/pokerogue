import type { ObjectValues } from "#types/type-helpers";
import type { z } from "zod";

/**
 * Fake a discriminated union type for Zod Schemas.
 * In essence, allows a particular field that is really a union
 * to coerce to a zod type that emits a UNION of schemas.
 *
 * @typeParam Choices - The set of enum values that the union can take.
 * @typeParam BaseZodSchema - The base zod schema to extend.
 * @typeParam FieldName - The name of the field that acts as the discriminator. **Must be a string literal**
 *
 * @remarks
 * There are times where we want to allow a field in the zod schema to take one of
 * a set of literal values, but we want to treat it as a discriminated union.
 *
 * For instance, if we have a zod schema like this:
 * z.object({
 *   field: z.literal(["Foo", "Bar"])
 * })
 *
 * then pass it into some function which expects field to be either "Foo" or "Bar",
 * then it would not work. This is because
 * { field: "Foo" | "Bar" }
 * would not be considered compatible with
 * { field: "Foo" } | {  field: "Bar"}
 *
 * While it is possible to make use of Zod's discriminated union, this
 * ends up defining way too many additional types, which is not readable,
 * and is substantially harder to maintain.
 *
 * Instead, this type helper can be used as a type assertion on the actual zod schema.
 * Note that it *does* require defining a base schema separately, which does not isnclude
 * the discriminator field.
 *
 * This is a hacky way to get around typescript's limitations.
 */
export type DiscriminatedUnionFake<
  Choices extends string | number,
  BaseZodSchema extends Record<string, z.ZodType>,
  FieldName extends string,
> = ObjectValues<{
  [Choice in Choices]: z.ZodObject<
    BaseZodSchema & {
      [F in FieldName]: z.ZodLiteral<Choice>;
    }
  >;
}>;
