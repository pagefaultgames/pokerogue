import "vitest";

import type Overrides from "#app/overrides";
import type { Phase } from "#app/phase";
import type { ArenaTag } from "#data/arena-tag";
import type { PositionalTag } from "#data/positional-tags/positional-tag";
import type { TerrainType } from "#data/terrain";
import type { AbilityId } from "#enums/ability-id";
import type { ArenaTagSide } from "#enums/arena-tag-side";
import type { ArenaTagType } from "#enums/arena-tag-type";
import type { BattlerTagType } from "#enums/battler-tag-type";
import type { MoveId } from "#enums/move-id";
import type { PokemonType } from "#enums/pokemon-type";
import type { PositionalTagType } from "#enums/positional-tag-type";
import type { BattleStat, EffectiveStat, StatStage } from "#enums/stat";
import type { WeatherType } from "#enums/weather-type";
import type { Pokemon } from "#field/pokemon";
import type { PokemonMove } from "#moves/pokemon-move";
import type { OneOther } from "#test/@types/test-helpers";
import type { GameManager } from "#test/test-utils/game-manager";
import type { ToHaveArenaTagOptions } from "#test/test-utils/matchers/to-have-arena-tag";
import type { ToHaveBattlerTagOptions } from "#test/test-utils/matchers/to-have-battler-tag";
import type { ToHaveEffectiveStatOptions } from "#test/test-utils/matchers/to-have-effective-stat";
import type { ToHaveHpOptions } from "#test/test-utils/matchers/to-have-hp";
import type { ToHavePositionalTagOptions } from "#test/test-utils/matchers/to-have-positional-tag";
import type { ExpectedStatusType } from "#test/test-utils/matchers/to-have-status-effect";
import type { ToHaveTypesOptions } from "#test/test-utils/matchers/to-have-types";
import type { PhaseString } from "#types/phase-types";
import type { TurnMove } from "#types/turn-move";
import type { Negate } from "#types/type-helpers";
import type { toDmgValue } from "#utils/common";
import type { If, IntClosedRange, Integer, IsNumericLiteral, IsStringLiteral, NonNegativeInteger } from "type-fest";
import type { expect } from "vitest";
import type { GetMatchers, MatchersBase, RestrictMatcher } from "./matcher-helpers";
import { StatusEffect } from "#enums/status-effect";
import { Status } from "#data/status-effect";
import { Arena } from "#field/arena";

// #region Helper Types

/**
 * Type helper to restrict a type to only numeric integer literals.
 * @internal
 */
type IntLiteral<T extends number> = If<IsNumericLiteral<T>, NonNegativeInteger<T>, never>;
/**
 * Type helper to restrict a type to only non-numeric literals, of any form.
 * @internal
 */
type NonNumericLiteral<T extends number> = If<IsNumericLiteral<T>, never, T>;
// #endregion Helper Types

/**
 * Interface containing all additional Vitest test matchers.
 * @internal
 */
interface ExtraAssertions<T, Negative extends boolean>
  extends GenericMatchers<T>,
    RestrictMatcher<GetMatchers<GameManagerMatchers, Negative>, GameManager, T>,
    RestrictMatcher<GetMatchers<ArenaMatchers, Negative>, GameManager, T>,
    RestrictMatcher<GetMatchers<PokemonMatchers, Negative>, Pokemon, T> {}

declare module "vitest" {
  interface Assertion<T, Negative extends boolean = false> extends ExtraAssertions<T, Negative> {
    /**
     * Invert a matcher's conditions, causing it to fail whenever it would normally succeed
     * (and vice versa).
     * @privateRemarks
     * Matchers with custom "invalid" conditions can (and should) ignore this in case of invalid input.
     * Certain others have different rules for negated assertions with respect to allowed parameters.
     * @example
     * ```ts
     * expect(1).not.toBe(2);
     * expect(game).not.toHavePositionalTag(PositionalTagType.WISH);
     * ```
     */
    not: Assertion<T, true>;
  }
}

// #region Generic Matchers
interface GenericMatchers<T> {
  /**
   * Check whether an array contains EXACTLY the given items (in any order).
   *
   * Different from {@linkcode expect.arrayContaining} as the latter only checks for subset equality
   * (as opposed to full equality).
   *
   * @param expected - The expected contents of the array, in any order
   * @see {@linkcode expect.arrayContaining}
   */
  toEqualUnsorted: T extends readonly (infer U)[] ? (expected: readonly U[]) => void : never;

  /**
   * Check whether a {@linkcode Map} contains the given key.
   * @param expectedKey - The key whose inclusion is being checked
   * @param expectedValue - The desired value for the given key-value pair;
   * if omitted, will only check that the given key exists (disregarding its value)
   * @privateRemarks
   * While this functionality _could_ be simulated by writing
   * `expect(m.get(key)).toBe(y)` or
   * `expect(m.get(key)).toBe(expect.anything())`,
   * this is preferred due to being more ergonomic and providing better error handling.
   */
  toHaveKey: T extends ReadonlyMap<infer K, infer V> ? (expectedKey: K, expectedValue?: V) => void : never;
}
// #endregion Generic Matchers

// #region GameManager Matchers
interface GameManagerMatchers {
  /**
   * Check whether the {@linkcode GameManager} has shown the given message at least once in the current test case.
   * @param expectedMessage - The expected message to be displayed
   * @remarks
   * Strings consumed by this function should _always_ be produced by a call to `i18next.t`
   * to avoid hardcoding locales text into test files.
   * @example
   * ```ts
   * expect(game).toHaveShownMessage(i18next.t("moveTriggers:splash"));
   * ```
   */
  toHaveShownMessage<T extends string>(expectedMessage: IsStringLiteral<T> extends true ? never : T): void;

  /**
   * Check whether the currently-running {@linkcode Phase} is of the given type.
   * @param expectedPhase - The expected {@linkcode PhaseString | name of the phase}
   */
  toBeAtPhase(expectedPhase: PhaseString): void;
}
// #endregion GameManager Matchers

// #region Arena Matchers
declare class ArenaMatchers implements MatchersBase<keyof ArenaMatchersCommon> {
  common: ArenaMatchersCommon;
  negative: ArenaMatchersNegative;
  positive: ArenaMatchersPositive;
}

interface ArenaMatchersCommon {
  /**
   * Check whether the current {@linkcode WeatherType} is as expected.
   * @param expectedWeatherType - The expected `WeatherType`
   */
  toHaveWeather(expectedWeatherType: WeatherType): void;

  /**
   * Check whether the current {@linkcode TerrainType} is as expected.
   * @param expectedTerrainType - The expected `TerrainType`
   */
  toHaveTerrain(expectedTerrainType: TerrainType): void;

  /**
   * Check whether the current {@linkcode Arena} contains the given {@linkcode ArenaTag}.
   * @param expectedTag - A partially-filled `ArenaTag` containing the desired properties
   */
  toHaveArenaTag<A extends ArenaTagType>(expectedTag: ToHaveArenaTagOptions<A>): void;
  /**
   * Check whether the current {@linkcode Arena} contains the given {@linkcode ArenaTag}.
   * @param expectedType - The {@linkcode ArenaTagType} of the desired tag
   * @param side - (Default {@linkcode ArenaTagSide.BOTH}) The {@linkcode ArenaTagSide | side(s) of the field} the tag should affect
   */
  toHaveArenaTag(expectedType: ArenaTagType, side?: ArenaTagSide): void;

  /**
   * Check whether the current {@linkcode Arena} contains a {@linkcode PositionalTag} with the given properties.
   * @param expectedTag - A partially-filled {@linkcode PositionalTag} containing the desired properties to check
   */
  toHavePositionalTag<P extends PositionalTagType>(expectedTag: ToHavePositionalTagOptions<P>): void;
}

interface ArenaMatchersPositive {
  /**
   * Check whether the current {@linkcode Arena} contains the given number of {@linkcode PositionalTag}s.
   * @param expectedType - The {@linkcode PositionalTagType} of the desired tag
   * @param count - (Default `1`) The number of instances of `expectedType` that should be active;
   * must be within the range `[1, 4]`
   * @remarks
   * If you want to check that a given tag is _not_ present on-field, use the negated form of this matcher instead.
   */
  toHavePositionalTag(expectedType: PositionalTagType, count?: IntClosedRange<1, 4>): void;
}
interface ArenaMatchersNegative {
  /**
   * Check whether the current {@linkcode Arena} contains **no** copies of a given {@linkcode PositionalTag}.
   * @param expectedType - The {@linkcode PositionalTagType} of the tag whose absence is being checked
   */
  toHavePositionalTag(expectedType: PositionalTagType): void;
}

// #endregion Arena Matchers

// #region Pokemon Matchers
interface PokemonMatchers {
  /**
   * Check whether a {@linkcode Pokemon}'s current typing includes the given types.
   * @param expectedTypes - The expected {@linkcode PokemonType}s to check against; must have length `>0`
   * @param options - The {@linkcode ToHaveTypesOptions | options} passed to the matcher
   */
  // TODO: Update typing once pokemon-related typing funcs are updated to return non-empty tuples.
  // The actual functions guarantee that the end result will never be empty, but the types do not reflect that at compile-time.
  toHaveTypes(expectedTypes: readonly PokemonType[], options?: ToHaveTypesOptions): void;

  /**
   * Check whether a {@linkcode Pokemon} has used a move matching the given criteria.
   * @param expectedMove - The {@linkcode MoveId} the Pokemon is expected to have used,
   * or a partially-filled {@linkcode TurnMove} containing the desired properties to check
   * @param index - (Default `0`) The index of the move history entry to check, in order from most recent to least recent;
   * must be an non-negative integer
   * @see {@linkcode Pokemon.getLastXMoves}
   */
  toHaveUsedMove<I extends number>(
    expectedMove: MoveId | OneOther<TurnMove, "move">,
    index?: If<IsNumericLiteral<I>, NonNegativeInteger<I>, I>,
  ): void;

  /**
   * Check whether a {@linkcode Pokemon}'s effective stat is as expected
   * (checked after all stat value modifications).
   * @param stat - The {@linkcode EffectiveStat} to check
   * @param expectedValue - The expected value of `stat`; must be a non-negative integer
   * @param options - The {@linkcode ToHaveEffectiveStatOptions | options} passed to the matcher
   * @remarks
   * If you want to check the stat **before** modifiers are applied, use {@linkcode Pokemon.getStat} instead.
   */
  toHaveEffectiveStat<S extends number>(
    stat: EffectiveStat,
    expectedValue: If<IsNumericLiteral<S>, NonNegativeInteger<S>, S>,
    options?: ToHaveEffectiveStatOptions,
  ): void;

  /**
   * Check whether a {@linkcode Pokemon} has a specific {@linkcode StatusEffect | non-volatile status effect}.
   * @param expectedStatusEffect - The {@linkcode StatusEffect} the Pokemon is expected to have,
   * or a partially filled {@linkcode Status} object containing the desired properties
   */
  toHaveStatusEffect(expectedStatusEffect: ExpectedStatusType): void;

  /**
   * Check whether a {@linkcode Pokemon} has a specific {@linkcode Stat} stage.
   * @param stat - The {@linkcode BattleStat} to check
   * @param expectedStage - The expected {@linkcode StatStage} of `stat`; must be within the interval `[-6, 6]`
   * @throws {@linkcode Error} \
   * Fails test if `level` is out of legal bounds.
   */
  toHaveStatStage(stat: BattleStat, expectedStage: StatStage): void;

  /**
   * Check whether a {@linkcode Pokemon} has a {@linkcode BattlerTag} with the given properties.
   * @param expectedTag - A partially-filled {@linkcode BattlerTag} containing the desired properties to check
   */
  toHaveBattlerTag<B extends BattlerTagType>(expectedTag: ToHaveBattlerTagOptions<B>): void;
  /**
   * Check whether a {@linkcode Pokemon} has the given {@linkcode BattlerTag}.
   * @param expectedTag - The {@linkcode BattlerTag} that the Pokemon is expected to possess
   */
  toHaveBattlerTag<B extends BattlerTagType>(expectedTag: BattlerTagTypeMap[B]): void;
  /**
   * Check whether a {@linkcode Pokemon} has a {@linkcode BattlerTag} of the given type.
   * @param expectedType - The expected {@linkcode BattlerTagType}
   */
  toHaveBattlerTag(expectedType: BattlerTagType): void;

  /**
   * Check whether a {@linkcode Pokemon} has applied a specific {@linkcode AbilityId}.
   * @param expectedAbilityId - The `AbilityId` to check for
   */
  toHaveAbilityApplied(expectedAbilityId: AbilityId): void;

  /**
   * Check whether a {@linkcode Pokemon} has a specific amount of {@linkcode Stat.HP | HP}.
   * @param expectedHp - The expected amount of {@linkcode Stat.HP | HP} to have
   */
  toHaveHp<H extends number>(expectedHp: IntLiteral<H>): void;
  /**
   * Check whether a {@linkcode Pokemon} has a specific amount of {@linkcode Stat.HP | HP}.
   * @param expectedHp - The expected amount of {@linkcode Stat.HP | HP} to have
   * @param options - The {@linkcode ToHaveHpOptions | options} for the matcher; must be omitted if `expectedHp` is a numeric literal
   */
  toHaveHp<H extends number>(expectedHp: NonNumericLiteral<H>, options?: ToHaveHpOptions): void;

  /**
   * Check whether a {@linkcode Pokemon} has taken a specific amount of damage.
   * @param expectedDamageTaken - The expected amount of damage taken
   */
  toHaveTakenDamage<D extends number>(expectedDamageTaken: IntLiteral<D>): void;
  /**
   * Check whether a {@linkcode Pokemon} has taken a specific amount of damage.
   * @param expectedDamageTaken - The expected amount of damage taken
   * @param roundDown - (Default `true`) Whether to round down `expectedDamageTaken` with {@linkcode toDmgValue};
   * must be omitted if `expectedDamageTaken` is a numeric literal
   */
  toHaveTakenDamage<D extends number>(expectedDamageTaken: NonNumericLiteral<D>, roundDown?: false): void;

  /**
   * Check whether a {@linkcode Pokemon} is currently fainted (as determined by {@linkcode Pokemon.isFainted}).
   * @remarks
   * When checking whether an enemy wild Pokemon is fainted, one must store a reference to it in a variable _before_ the fainting effect occurs.
   * Otherwise, the Pokemon will be removed from the field and garbage collected.
   */
  toHaveFainted(): void;

  /**
   * Check whether a {@linkcode Pokemon} is at full HP.
   */
  toHaveFullHp(): void;

  /**
   * Check whether a {@linkcode Pokemon} has consumed the given amount of PP for one of its moves.
   * @param moveId - The {@linkcode MoveId} corresponding to the {@linkcode PokemonMove} that should have consumed PP
   * @param ppUsed - The numerical amount of PP that should have been consumed,
   * or `all` to indicate the move should be _out_ of PP
   * @throws {Error}
   * Fails test if the Pokemon's moveset has been set via {@linkcode Overrides.MOVESET_OVERRIDE}/{@linkcode Overrides.ENEMY_MOVESET_OVERRIDE}
   * or does not contain exactly one copy of `moveId`.
   */
  toHaveUsedPP<P extends number | "all">(moveId: MoveId, ppUsed: If<IsNumericLiteral<P>, Integer<P>, P>): void;
}
// #endregion Pokemon Matchers

// biome-ignore lint/complexity/noUselessEmptyExport: Prevents exporting internal types (cf. https://github.com/microsoft/TypeScript/issues/57764)
export {};
