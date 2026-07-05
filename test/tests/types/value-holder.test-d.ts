import { NumberHolder, type ValueHolder } from "#app/utils/value-holder";
import { PokemonType } from "#enums/pokemon-type";
import type { ErrorType, FormatType } from "#types/error-type";
import type { Primitive } from "type-fest";
import { describe, expectTypeOf, it } from "vitest";

describe("ValueHolder", () => {
  it("should widen literal types to their underlying base types", () => {
    const holder = new NumberHolder(1);
    expectTypeOf(holder).toEqualTypeOf<NumberHolder<number>>();
    expectTypeOf(holder).not.toEqualTypeOf<NumberHolder<1>>();
    expectTypeOf(holder.value).toEqualTypeOf<number>();

    holder.value = 2;
    holder.value = 42;
    holder.value = -1;
    holder.value = 0;
  });

  it("should not allow assigning incorrect values", () => {
    const holder = new NumberHolder(1);
    // @ts-expect-error should not allow assigning a string to a NumberHolder
    holder.value = "hello";
    // @ts-expect-error should not allow assigning a boolean
    holder.value = true;
    // @ts-expect-error should not allow assigning null
    holder.value = null;
    // @ts-expect-error should not allow assigning undefined
    holder.value = undefined;
    // @ts-expect-error should not allow assigning objects
    holder.value = { foo: "bar" };
  });

  // Hand-roll types to avoid importing internal types from the file
  type ExtractErrorType<T> = T extends ErrorType<infer U> ? U : never;
  type GetConstructErrorMsg<Val, Base extends Primitive> = ExtractErrorType<
    ConstructorParameters<typeof ValueHolder<Val, Base>>[1]
  >;

  it("should provide helpful error messages when constructing with invalid types", () => {
    // @ts-expect-error should not allow constructing with a string
    new NumberHolder("NaN");

    expectTypeOf<
      GetConstructErrorMsg<string, number>
    >().toEqualTypeOf<"Expected to receive a number, but got a string instead!">();

    // Make sure we don't distribute over unions
    expectTypeOf<
      GetConstructErrorMsg<string, boolean>
    >().toEqualTypeOf<"Expected to receive a boolean, but got a string instead!">();

    expectTypeOf<
      GetConstructErrorMsg<string | boolean, number>
    >().toExtend<`Expected to receive a number, but got ${"'boolean' | 'string'" | "'string' | 'boolean'"} instead!`>();

    // union members may appear in any order, but it should be consistent across compiles
    expectTypeOf<
      GetConstructErrorMsg<5 | 6, 3 | 4>
    >().toExtend<`Expected to receive ${FormatType<3 | 4>}, but got ${FormatType<5 | 6>} instead!`>();
  });

  it("should support enum subtypes", () => {
    const typeHolder = new NumberHolder(PokemonType.FAIRY);
    expectTypeOf(typeHolder).toEqualTypeOf<NumberHolder<PokemonType>>();
    expectTypeOf(typeHolder).not.toEqualTypeOf<NumberHolder<number>>();
    expectTypeOf(typeHolder).not.toEqualTypeOf<NumberHolder<PokemonType.FAIRY>>();

    // This should compile without errors
    typeHolder.value = PokemonType.FIRE;
    typeHolder.value = PokemonType.WATER;
    typeHolder.value = PokemonType.GRASS;

    // @ts-expect-error - should not allow assigning a number outside the enum
    typeHolder.value = 42;
  });
});
