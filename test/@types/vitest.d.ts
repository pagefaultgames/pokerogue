import type { TerrainType } from "#app/data/terrain";
import type { ArenaTag, ArenaTagTypeMap } from "#data/arena-tag";
import type { AbilityId } from "#enums/ability-id";
import type { ArenaTagType } from "#enums/arena-tag-type";
import type { BattlerTagType } from "#enums/battler-tag-type";
import type { MoveId } from "#enums/move-id";
import type { PokemonType } from "#enums/pokemon-type";
import type { BattleStat, EffectiveStat, Stat } from "#enums/stat";
import type { StatusEffect } from "#enums/status-effect";
import type { WeatherType } from "#enums/weather-type";
import type { Arena } from "#field/arena";
import type { Pokemon } from "#field/pokemon";
import type { ToHaveEffectiveStatMatcherOptions } from "#test/test-utils/matchers/to-have-effective-stat";
import type { expectedStatusType } from "#test/test-utils/matchers/to-have-status-effect";
import type { toHaveTypesOptions } from "#test/test-utils/matchers/to-have-types";
import type { TurnMove } from "#types/turn-move";
import type { AtLeastOne } from "#types/type-helpers";
import type { toDmgValue } from "utils/common";
import type { expect } from "vitest";
import "vitest";
import type Overrides from "#app/overrides";
import type { ArenaTagSide } from "#enums/arena-tag-side";
import type { PokemonMove } from "#moves/pokemon-move";
import type { OneOther } from "#test/@types/test-helpers";

declare module "vitest" {
  interface Assertion {
    /**
     * Check whether an array contains EXACTLY the given items (in any order).
     *
     * Different from {@linkcode expect.arrayContaining} as the latter only checks for subset equality
     * (as opposed to full equality).
     *
     * @param expected - The expected contents of the array, in any order
     * @see {@linkcode expect.arrayContaining}
     */
    toEqualArrayUnsorted<E>(expected: E[]): void;

    /**
     * Check whether a {@linkcode Pokemon}'s current typing includes the given types.
     *
     * @param expected - The expected types (in any order)
     * @param options - The options passed to the matcher
     */
    toHaveTypes(expected: PokemonType[], options?: toHaveTypesOptions): void;
    toHaveTypes(expected: [PokemonType, ...PokemonType[]], options?: toHaveTypesOptions): void;

    /**
     * Matcher to check the contents of a {@linkcode Pokemon}'s move history.
     *
     * @param expectedValue - The expected value; can be a {@linkcode MoveId} or a partially filled {@linkcode TurnMove}
     * containing the desired properties to check
     * @param index - The index of the move history entry to check, in order from most recent to least recent.
     * Default `0` (last used move)
     * @see {@linkcode Pokemon.getLastXMoves}
     */
    toHaveUsedMove(expected: MoveId | AtLeastOne<TurnMove>, index?: number): void;

    /**
     * Check whether a {@linkcode Pokemon}'s effective stat is as expected
     * (checked after all stat value modifications).
     *
     * @param stat - The {@linkcode EffectiveStat} to check
     * @param expectedValue - The expected value of {@linkcode stat}
     * @param options - (Optional) The {@linkcode ToHaveEffectiveStatMatcherOptions}
     * @remarks
     * If you want to check the stat **before** modifiers are applied, use {@linkcode Pokemon.getStat} instead.
     */
    toHaveEffectiveStat(stat: EffectiveStat, expectedValue: number, options?: ToHaveEffectiveStatMatcherOptions): void;

    /**
     * Check whether a {@linkcode Pokemon} has taken a specific amount of damage.
     * @param expectedDamageTaken - The expected amount of damage taken
     * @param roundDown - Whether to round down {@linkcode expectedDamageTaken} with {@linkcode toDmgValue}; default `true`
     */
    toHaveTakenDamage(expectedDamageTaken: number, roundDown?: boolean): void;

    /**
     * Check whether the current {@linkcode WeatherType} is as expected.
     * @param expectedWeatherType - The expected {@linkcode WeatherType}
     */
    toHaveWeather(expectedWeatherType: WeatherType): void;

    /**
     * Check whether the current {@linkcode TerrainType} is as expected.
     * @param expectedTerrainType - The expected {@linkcode TerrainType}
     */
    toHaveTerrain(expectedTerrainType: TerrainType): void;

    /**
     * Check whether the current {@linkcode Arena} contains the given {@linkcode ArenaTag}.
     *
     * @param expectedType - A partially-filled {@linkcode ArenaTag} containing the desired properties
     */
    toHaveArenaTag<T extends ArenaTagType>(
      expectedType: OneOther<ArenaTagTypeMap[T], "tagType" | "side"> & { tagType: T }, // intersection required bc this doesn't preserve T
    ): void;
    /**
     * Check whether the current {@linkcode Arena} contains the given {@linkcode ArenaTag}.
     *
     * @param expectedType - The {@linkcode ArenaTagType} of the desired tag
     * @param side - The {@linkcode ArenaTagSide | side of the field} the tag should affect, or
     * {@linkcode ArenaTagSide.BOTH} to check both sides;
     * default `ArenaTagSide.BOTH`
     */
    toHaveArenaTag(expectedType: ArenaTagType, side?: ArenaTagSide): void;

    /**
     * Check whether a {@linkcode Pokemon} is at full HP.
     */
    toHaveFullHp(): void;

    /**
     * Check whether a {@linkcode Pokemon} has a specific {@linkcode StatusEffect | non-volatile status effect}.
     * @param expectedStatusEffect - The {@linkcode StatusEffect} the Pokemon is expected to have,
     * or a partially filled {@linkcode Status} containing the desired properties
     */
    toHaveStatusEffect(expectedStatusEffect: expectedStatusType): void;

    /**
     * Check whether a {@linkcode Pokemon} has a specific {@linkcode Stat} stage.
     * @param stat - The {@linkcode BattleStat} to check
     * @param expectedStage - The expected stat stage value of {@linkcode stat}
     */
    toHaveStatStage(stat: BattleStat, expectedStage: number): void;

    /**
     * Check whether a {@linkcode Pokemon} has a specific {@linkcode BattlerTagType}.
     * @param expectedBattlerTagType - The expected {@linkcode BattlerTagType}
     */
    toHaveBattlerTag(expectedBattlerTagType: BattlerTagType): void;

    /**
     * Check whether a {@linkcode Pokemon} has applied a specific {@linkcode AbilityId}.
     * @param expectedAbilityId - The expected {@linkcode AbilityId}
     */
    toHaveAbilityApplied(expectedAbilityId: AbilityId): void;

    /**
     * Check whether a {@linkcode Pokemon} has a specific amount of {@linkcode Stat.HP | HP}.
     * @param expectedHp - The expected amount of {@linkcode Stat.HP | HP} to have
     */
    toHaveHp(expectedHp: number): void;

    /**
     * Check whether a {@linkcode Pokemon} is currently fainted (as determined by {@linkcode Pokemon.isFainted}).
     * @remarks
     * When checking whether an enemy wild Pokemon is fainted, one must reference it in a variable _before_ the fainting effect occurs
     * as otherwise the Pokemon will be GC'ed and rendered `undefined`.
     */
    toHaveFainted(): void;

    /**
     * Check whether a {@linkcode Pokemon} has consumed the given amount of PP for one of its moves.
     * @param expectedValue - The {@linkcode MoveId} of the {@linkcode PokemonMove} that should have consumed PP
     * @param ppUsed - The numerical amount of PP that should have been consumed,
     * or `all` to indicate the move should be _out_ of PP
     * @remarks
     * If the Pokemon's moveset has been set via {@linkcode Overrides.MOVESET_OVERRIDE}/{@linkcode Overrides.OPP_MOVESET_OVERRIDE},
     * does not contain {@linkcode expectedMove}
     * or contains the desired move more than once, this will fail the test.
     */
    toHaveUsedPP(expectedMove: MoveId, ppUsed: number | "all"): void;
  }
}
