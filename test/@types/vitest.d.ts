import type { TerrainType } from "#app/data/terrain";
import type { AbilityId } from "#enums/ability-id";
import type { BattlerTagType } from "#enums/battler-tag-type";
import type { MoveId } from "#enums/move-id";
import type { PokemonType } from "#enums/pokemon-type";
import type { BattleStat, EffectiveStat, Stat } from "#enums/stat";
import type { StatusEffect } from "#enums/status-effect";
import type { WeatherType } from "#enums/weather-type";
import type { Pokemon } from "#field/pokemon";
import type { ToHaveEffectiveStatMatcherOptions } from "#test/test-utils/matchers/to-have-effective-stat";
import { expectedStatusType } from "#test/test-utils/matchers/to-have-status-effect";
import type { toHaveTypesOptions } from "#test/test-utils/matchers/to-have-types";
import { TurnMove } from "#types/turn-move";
import { AtLeastOne } from "#types/type-helpers";
import type { expect } from "vitest";
import type Overrides from "#app/overrides";

declare module "vitest" {
  interface Assertion {
    /**
     * Matcher to check if an array contains EXACTLY the given items (in any order).
     *
     * Different from {@linkcode expect.arrayContaining} as the latter only checks for subset equality
     * (as opposed to full equality).
     *
     * @param expected - The expected contents of the array, in any order
     * @see {@linkcode expect.arrayContaining}
     */
    toEqualArrayUnsorted<E>(expected: E[]): void;

    /**
     * Matcher to check if a {@linkcode Pokemon}'s current typing includes the given types
     *
     * @param expected - The expected types (in any order)
     * @param options - The options passed to the matcher
     */
    toHaveTypes(expected: [PokemonType, ...PokemonType[]], options?: toHaveTypesOptions): void;

    /**
     * Matcher to check the contents of a {@linkcode Pokemon}'s move history.
     *
     * @param expectedValue - The expected value; can be a {@linkcode MoveId} or a partially filled {@linkcode TurnMove}
     * @param index - The index of the move history entry to check, in order from most recent to least recent.
     * Default `0` (last used move)
     * @see {@linkcode Pokemon.getLastXMoves}
     */
    toHaveUsedMove(expected: MoveId | AtLeastOne<TurnMove>, index?: number): void;

    /**
     * Matcher to check if a {@linkcode Pokemon Pokemon's} effective stat is as expected
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
     * Matcher to check if a {@linkcode Pokemon} has taken a specific amount of damage.
     * @param expectedDamageTaken - The expected amount of damage taken
     * @param roundDown - Whether to round down @linkcode expectedDamageTaken} with {@linkcode toDmgValue}; default `true`
     */
    toHaveTakenDamage(expectedDamageTaken: number, roundDown?: boolean): void;

    /**
     * Matcher to check if the current {@linkcode WeatherType} is as expected.
     * @param expectedWeatherType - The expected {@linkcode WeatherType}
     */
    toHaveWeather(expectedWeatherType: WeatherType): void;

    /**
     * Matcher to check if the current {@linkcode TerrainType} is as expected.
     * @param expectedTerrainType - The expected {@linkcode TerrainType}
     */
    toHaveTerrain(expectedTerrainType: TerrainType): void;

    /**
     * Matcher to check if a {@linkcode Pokemon} is at full HP.
     */
    toHaveFullHp(): void;

    /**
     * Matcher to check if a {@linkcode Pokemon} has a specific {@linkcode StatusEffect | non-volatile status effect}.
     * @param expectedStatusEffect - The {@linkcode StatusEffect} the Pokemon is expected to have,
     * or a partially filled {@linkcode Status} containing the desired properties
     */
    toHaveStatusEffect(expectedStatusEffect: expectedStatusType): void;

    /**
     * Matcher to check if a {@linkcode Pokemon} has a specific {@linkcode Stat} stage.
     * @param stat - The {@linkcode BattleStat} to check
     * @param expectedStage - The expected stat stage value of {@linkcode stat}
     */
    toHaveStatStage(stat: BattleStat, expectedStage: number): void;

    /**
     * Matcher to check if a {@linkcode Pokemon} has a specific {@linkcode BattlerTagType}.
     * @param expectedBattlerTagType - The expected {@linkcode BattlerTagType}
     */
    toHaveBattlerTag(expectedBattlerTagType: BattlerTagType): void;

    /**
     * Matcher to check if a {@linkcode Pokemon} has applied a specific {@linkcode AbilityId}.
     * @param expectedAbilityId - The expected {@linkcode AbilityId}
     */
    toHaveAbilityApplied(expectedAbilityId: AbilityId): void;

    /**
     * Matcher to check if a {@linkcode Pokemon} has a specific amount of HP.
     * @param expectedHp - The expected amount of {@linkcode Stat.HP | HP} to have
     */
    toHaveHp(expectedHp: number): void;

    /**
     * Matcher to check if a {@linkcode Pokemon} has fainted (as determined by {@linkcode Pokemon.isFainted}).
     */
    toHaveFainted(): void;

    /**
     * Matcher to check th
     * @param expectedValue - The {@linkcode MoveId} that should have consumed PP
     * @param ppUsed - The amount of PP that should have been consumed
     * @remarks
     * If the Pokemon's moveset has been set via {@linkcode Overrides.MOVESET_OVERRIDE} or {@linkcode OPP_MOVESET_OVERRIDE},
     * or contains the desired move more than once, this will fail the test.
     */
    toHaveUsedPP(expectedMove: MoveId, ppUsed: number): void;
  }
}
