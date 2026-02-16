import "vitest";

import type Overrides from "#app/overrides";
import type { Phase } from "#app/phase";
import type { ArenaTag } from "#data/arena-tag";
import type { BattlerTag, BattlerTagTypeMap } from "#data/battler-tags";
import type { PositionalTag } from "#data/positional-tags/positional-tag";
import type { Status } from "#data/status-effect";
import type { Terrain, TerrainType } from "#data/terrain";
import type { Weather } from "#data/weather";
import type { AbilityId } from "#enums/ability-id";
import type { ArenaTagSide } from "#enums/arena-tag-side";
import type { ArenaTagType } from "#enums/arena-tag-type";
import type { BattlerTagType } from "#enums/battler-tag-type";
import type { MoveId } from "#enums/move-id";
import type { PokemonType } from "#enums/pokemon-type";
import type { PositionalTagType } from "#enums/positional-tag-type";
import type { BattleStat, EffectiveStat, StatStage } from "#enums/stat";
import type { StatusEffect } from "#enums/status-effect";
import type { WeatherType } from "#enums/weather-type";
import type { Arena } from "#field/arena";
import type { Pokemon } from "#field/pokemon";
import type { PokemonMove } from "#moves/pokemon-move";
import type { OneOther } from "#test/@types/test-helpers";
import type { GameManager } from "#test/test-utils/game-manager";
import type { PartiallyFilledArenaTag } from "#test/test-utils/matchers/to-have-arena-tag";
import type { PartiallyFilledBattlerTag } from "#test/test-utils/matchers/to-have-battler-tag";
import type { ToHaveEffectiveStatOptions } from "#test/test-utils/matchers/to-have-effective-stat";
import type { ToHaveHpOptions } from "#test/test-utils/matchers/to-have-hp";
import type { PartiallyFilledPositionalTag } from "#test/test-utils/matchers/to-have-positional-tag";
import type { PartiallyFilledStatus } from "#test/test-utils/matchers/to-have-status-effect";
import type { ToHaveTypesOptions } from "#test/test-utils/matchers/to-have-types";
import type { PhaseString } from "#types/phase-types";
import type { TurnMove } from "#types/turn-move";
import type { toDmgValue } from "#utils/common";
import type { If, IntClosedRange, Integer, IsNumericLiteral, IsStringLiteral, NonNegativeInteger } from "type-fest";
import type { expect } from "vitest";
import type { GetMatchers, MatchersBase, RestrictMatcher } from "./matcher-helpers";

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
    not: NegativeAssertion<T>;
  }

  type NegativeAssertion<T> = Assertion<T, true>;
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
   * @param expectedMessage - The message that should have been displayed
   * @remarks
   * Strings consumed by this function should _always_ be produced by a call to `i18next.t`
   * to avoid hardcoding locales text into test files.
   * @example
   * ```ts
   * expect(game).toHaveShownMessage(i18next.t("moveTriggers:splash"));
   * ```
   */
  // TODO: The typing for this can be refined further once i18next type safety is added
  toHaveShownMessage<T extends string>(expectedMessage: IsStringLiteral<T> extends true ? never : T): void;

  /**
   * Check whether the currently-running {@linkcode Phase} is of the given type.
   * @param expectedPhase - The {@linkcode PhaseString | name} of the `Phase` that should be running
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
   * Check whether the currently active {@linkcode Weather} is of the specified type.
   * @param expectedWeatherType - The {@linkcode WeatherType} that should be active
   */
  toHaveWeather(expectedWeatherType: WeatherType): void;

  /**
   * Check whether the currently active {@linkcode Terrain} is of the specified type.
   * @param expectedTerrainType - The {@linkcode TerrainType} that should be active
   */
  toHaveTerrain(expectedTerrainType: TerrainType): void;

  /**
   * Check whether the {@linkcode Arena} contains the given {@linkcode ArenaTag}.
   * @param expectedTag - A partially filled `ArenaTag` containing the desired properties to check
   */
  toHaveArenaTag<A extends ArenaTagType>(expectedTag: PartiallyFilledArenaTag<A>): void;
  /**
   * Check whether the current {@linkcode Arena} contains the given {@linkcode ArenaTag}.
   * @param expectedType - The {@linkcode ArenaTagType} of the desired tag
   * @param side - (Default {@linkcode ArenaTagSide.BOTH}) The {@linkcode ArenaTagSide | side(s) of the field} the tag should affect
   */
  toHaveArenaTag(expectedType: ArenaTagType, side?: ArenaTagSide): void;

  /**
   * Check whether the current {@linkcode Arena} contains a `PositionalTag` with the given properties.
   * @param expectedTag - A partially filled {@linkcode PositionalTag} containing the desired properties to check
   */
  toHavePositionalTag<P extends PositionalTagType>(expectedTag: PartiallyFilledPositionalTag<P>): void;
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
  // TODO: Update typing to a non empty tuple once pokemon-related typing funcs are updated to return non-empty tuples.
  // The actual functions guarantee that the end result will never be empty at runtime, but the types do not reflect that at compile-time.
  toHaveTypes(expectedTypes: readonly PokemonType[], options?: ToHaveTypesOptions): void;

  /**
   * Check whether a {@linkcode Pokemon} has used a move matching the given criteria.
   * @param expectedMove - The {@linkcode MoveId} the Pokemon is expected to have used,
   * or a partially filled {@linkcode TurnMove} containing the desired properties to check
   * @param index - (Default `0`) The index of the move history entry to check, in order from most recent to least recent;
   * must be a non-negative integer
   * @see {@linkcode Pokemon.getLastXMoves}
   */
  toHaveUsedMove<I extends number>(
    expectedMove: MoveId | OneOther<TurnMove, "move">,
    index?: If<IsNumericLiteral<I>, NonNegativeInteger<I>, I>,
  ): void;

  /**
   * Check whether a {@linkcode Pokemon}'s effective stat equals a certain value.
   * @param stat - The {@linkcode EffectiveStat} to check
   * @param expectedValue - The expected value of `stat`; must be a non-negative integer
   * @param options - The {@linkcode ToHaveEffectiveStatOptions | options} passed to the matcher
   * @remarks
   * This checks the value after all stat value modifications have occured.
   * If you want to query the raw stat value **before** modifiers are applied, use {@linkcode Pokemon.getStat} instead.
   */
  // TODO: Rework into a "getStatMulti" function once better segregation of stat multipliers is achieved
  toHaveEffectiveStat<S extends number>(
    stat: EffectiveStat,
    expectedValue: If<IsNumericLiteral<S>, NonNegativeInteger<S>, S>,
    options?: ToHaveEffectiveStatOptions,
  ): void;

  /**
   * Check whether a {@linkcode Pokemon} has a specific non-volatile status effect.
   * @param expectedStatusEffect - The {@linkcode StatusEffect} the Pokemon is expected to have,
   * or a partially filled {@linkcode Status} object containing the desired properties to check
   */
  toHaveStatusEffect(expectedStatusEffect: StatusEffect | PartiallyFilledStatus): void;

  /**
   * Check whether a {@linkcode Pokemon} has a specific stat stage.
   * @param stat - The desired {@linkcode BattleStat} to check
   * @param expectedStage - The {@linkcode StatStage | stage} that `stat` is expected to have reached;
   * must be within the interval `[-6, 6]`
   * @throws {Error}
   * Fails test if `expectedStage` is out of legal bounds.
   */
  toHaveStatStage(stat: BattleStat, expectedStage: StatStage): void;

  /**
   * Check whether a {@linkcode Pokemon} has a {@linkcode BattlerTag} with the given properties.
   * @param expectedTag - A partially filled `BattlerTag` containing the desired properties to check
   */
  toHaveBattlerTag<B extends BattlerTagType>(expectedTag: PartiallyFilledBattlerTag<B>): void;
  /**
   * Check whether a {@linkcode Pokemon} has the given {@linkcode BattlerTag}.
   * @param expectedTag - The `BattlerTag` that the Pokemon is expected to possess
   */
  toHaveBattlerTag<B extends BattlerTagType>(expectedTag: BattlerTagTypeMap[B]): void;
  /**
   * Check whether a {@linkcode Pokemon} has a {@linkcode BattlerTag} of the given type.
   * @param expectedType - The {@linkcode BattlerTagType} that should be present
   */
  toHaveBattlerTag(expectedType: BattlerTagType): void;

  /**
   * Check whether a {@linkcode Pokemon} has applied a specific {@linkcode AbilityId}.
   * @param expectedAbilityId - The `AbilityId` that should have been applied
   */
  toHaveAbilityApplied(expectedAbilityId: AbilityId): void;

  /**
   * Check whether a {@linkcode Pokemon} has a specific amount of HP.
   * @param expectedHp - The amount of {@linkcode Stat.HP | HP} the Pokemon should have
   */
  toHaveHp<H extends number>(expectedHp: IntLiteral<H>): void;
  /**
   * Check whether a {@linkcode Pokemon} has a specific amount of HP.
   * @param expectedHp - The amount of {@linkcode Stat.HP | HP} the Pokemon should have
   * @param options - The {@linkcode ToHaveHpOptions | options} for the matcher;
   * should be omitted if `expectedHp` is already an integer
   */
  toHaveHp<H extends number>(expectedHp: NonNumericLiteral<H>, options?: ToHaveHpOptions): void;

  /**
   * Check whether a {@linkcode Pokemon} has taken a specific amount of damage.
   * @param expectedDamageTaken - The amount of damage that should have been taken
   */
  // TODO: Consider renaming to "toHaveLostHp"
  toHaveTakenDamage<D extends number>(expectedDamageTaken: IntLiteral<D>): void;
  /**
   * Check whether a {@linkcode Pokemon} has taken a specific amount of damage.
   * @param expectedDamageTaken - The amount of damage that should have been taken
   * @param roundDown - (Default `true`) Whether to round down `expectedDamageTaken` with {@linkcode toDmgValue};
   * should be omitted if `expectedDamageTaken` is already an integer
   */
  toHaveTakenDamage<D extends number>(expectedDamageTaken: NonNumericLiteral<D>, roundDown?: false): void;

  /**
   * Check whether a {@linkcode Pokemon} is currently fainted.
   * @remarks
   * When checking whether an enemy wild Pokemon is fainted, one must store a reference to it in a variable _before_ the fainting effect occurs.
   * Otherwise, the Pokemon will be removed from the field and garbage collected.
   * @see {@linkcode Pokemon.isFainted}
   */
  toHaveFainted(): void;

  /**
   * Check whether a {@linkcode Pokemon} is at full HP.
   */
  toHaveFullHp(): void;

  /**
   * Check whether a {@linkcode Pokemon} has consumed the given amount of PP for one of its moves.
   * @param moveId - The {@linkcode MoveId} corresponding to the {@linkcode PokemonMove} that should have consumed PP
   * @param ppUsed - The amount of PP that should have been consumed,
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
