import type { Pokemon } from "#field/pokemon";
import type { PokemonType } from "#enums/pokemon-type";
import type { expect } from "vitest";
import type { Arena } from "#field/arena";
import type { ArenaTag } from "#data/arena-tag";
import type { toHaveTypesOptions } from "#test/test-utils/matchers/to-have-types";
import { ArenaTagType } from "#enums/arena-tag-type";
import { toHaveArenaTagOptions } from "#test/test-utils/matchers/to-have-arena-tag";

declare module "vitest" {
  interface Assertion {
    /**
     * Matcher to check if an array contains EXACTLY the given items (in any order).
     *
     * Different from {@linkcode expect.arrayContaining} as the latter only requires the array contain
     * _at least_ the listed items.
     *
     * @param expected - The expected contents of the array, in any order.
     * @see {@linkcode expect.arrayContaining}
     */
    toEqualArrayUnsorted<E>(expected: E[]): void;
    /**
     * Matcher to check if a {@linkcode Pokemon}'s current typing includes the given types.
     *
     * @param expected - The expected types (in any order).
     * @param options - The options passed to the matcher.
     */
    toHaveTypes(expected: PokemonType[], options?: toHaveTypesOptions): void;
    /**
     * Matcher to check if the current {@linkcode Arena} contains the given {@linkcode ArenaTag}.
     *
     * @param expected - The expected {@linkcode ArenaTagType}
     * @param options - The options passed to the matcher
     */
    toHaveArenaTag<T extends ArenaTagType>(expected: T, options?: toHaveArenaTagOptions<T>): void;

  }
}