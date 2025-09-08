import "vitest";

import type { Phase } from "#app/phase";
import type Overrides from "#app/overrides";
import type { ArenaTag } from "#data/arena-tag";
import type { TerrainType } from "#data/terrain";
import type { AbilityId } from "#enums/ability-id";
import type { ArenaTagSide } from "#enums/arena-tag-side";
import type { ArenaTagType } from "#enums/arena-tag-type";
import type { BattlerTagType } from "#enums/battler-tag-type";
import type { MoveId } from "#enums/move-id";
import type { PokemonType } from "#enums/pokemon-type";
import type { PositionalTagType } from "#enums/positional-tag-type";
import type { BattleStat, EffectiveStat } from "#enums/stat";
import type { WeatherType } from "#enums/weather-type";
import type { toHaveArenaTagOptions } from "#test/test-utils/matchers/to-have-arena-tag";
import type { toHaveEffectiveStatOptions } from "#test/test-utils/matchers/to-have-effective-stat";
import type { toHavePositionalTagOptions } from "#test/test-utils/matchers/to-have-positional-tag";
import type { expectedStatusType } from "#test/test-utils/matchers/to-have-status-effect";
import type { toHaveTypesOptions } from "#test/test-utils/matchers/to-have-types";
import type { PhaseString } from "#types/phase-types";
import type { TurnMove } from "#types/turn-move";
import type { AtLeastOne } from "#types/type-helpers";
import type { toDmgValue } from "#utils/common";
import type { expect } from "vitest";
import type { toHaveBattlerTagOptions } from "#test/test-utils/matchers/to-have-battler-tag";

declare module "vitest" {
  interface Assertion<T> {
    /**
     * Check whether an array contains EXACTLY the given items (in any order).
     *
     * Different from {@linkcode expect.arrayContaining} as the latter only checks for subset equality
     * (as opposed to full equality).
     *
     * @param expected - The expected contents of the array, in any order
     * @see {@linkcode expect.arrayContaining}
     */
    toEqualArrayUnsorted(expected: T[]): void;

    /**
     * Check if the currently-running {@linkcode Phase} is of the given type.
     * @param expectedPhase - The expected {@linkcode PhaseString}
     */
    toBeAtPhase(expectedPhase: PhaseString): void;

    // #region Arena Matchers

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
     * @param expectedTag - A partially-filled {@linkcode ArenaTag} containing the desired properties
     */
    toHaveArenaTag<A extends ArenaTagType>(expectedTag: toHaveArenaTagOptions<A>): void;
    /**
     * Check whether the current {@linkcode Arena} contains the given {@linkcode ArenaTag}.
     * @param expectedType - The {@linkcode ArenaTagType} of the desired tag
     * @param side - The {@linkcode ArenaTagSide | side(s) of the field} the tag should affect; default {@linkcode ArenaTagSide.BOTH}
     */
    toHaveArenaTag(expectedType: ArenaTagType, side?: ArenaTagSide): void;

    /**
     * Check whether the current {@linkcode Arena} contains the given {@linkcode PositionalTag}.
     * @param expectedTag - A partially-filled `PositionalTag` containing the desired properties
     */
    toHavePositionalTag<P extends PositionalTagType>(expectedTag: toHavePositionalTagOptions<P>): void;
    /**
     * Check whether the current {@linkcode Arena} contains the given number of {@linkcode PositionalTag}s.
     * @param expectedType - The {@linkcode PositionalTagType} of the desired tag
     * @param count - The number of instances of {@linkcode expectedType} that should be active;
     * defaults to `1` and must be within the range `[0, 4]`
     */
    toHavePositionalTag(expectedType: PositionalTagType, count?: number): void;

    // #endregion Arena Matchers

    // #region Pokemon Matchers

    /**
     * Check whether a {@linkcode Pokemon}'s current typing includes the given types.
     * @param expectedTypes - The expected {@linkcode PokemonType}s to check against; must have length `>0`
     * @param options - The {@linkcode toHaveTypesOptions | options} passed to the matcher
     */
    toHaveTypes(expectedTypes: PokemonType[], options?: toHaveTypesOptions): void;

    /**
     * Check whether a {@linkcode Pokemon} has used a move matching the given criteria.
     * @param expectedMove - The {@linkcode MoveId} the Pokemon is expected to have used,
     * or a partially filled {@linkcode TurnMove} containing the desired properties to check
     * @param index - The index of the move history entry to check, in order from most recent to least recent; default `0`
     * @see {@linkcode Pokemon.getLastXMoves}
     */
    toHaveUsedMove(expectedMove: MoveId | AtLeastOne<TurnMove>, index?: number): void;

    /**
     * Check whether a {@linkcode Pokemon}'s effective stat is as expected
     * (checked after all stat value modifications).
     * @param stat - The {@linkcode EffectiveStat} to check
     * @param expectedValue - The expected value of {@linkcode stat}
     * @param options - The {@linkcode toHaveEffectiveStatOptions | options} passed to the matcher
     * @remarks
     * If you want to check the stat **before** modifiers are applied, use {@linkcode Pokemon.getStat} instead.
     */
    toHaveEffectiveStat(stat: EffectiveStat, expectedValue: number, options?: toHaveEffectiveStatOptions): void;

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
     * Check whether a {@linkcode Pokemon} has the given {@linkcode BattlerTag}.
     * @param expectedTag - A partially-filled {@linkcode BattlerTag} containing the desired properties
     */
    toHaveBattlerTag<B extends BattlerTagType>(expectedTag: toHaveBattlerTagOptions<B>): void;
    /**
     * Check whether a {@linkcode Pokemon} has the given {@linkcode BattlerTag}.
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
    toHaveHp(expectedHp: number): void;

    /**
     * Check whether a {@linkcode Pokemon} has taken a specific amount of damage.
     * @param expectedDamageTaken - The expected amount of damage taken
     * @param roundDown - Whether to round down `expectedDamageTaken` with {@linkcode toDmgValue}; default `true`
     */
    toHaveTakenDamage(expectedDamageTaken: number, roundDown?: boolean): void;

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
     * @remarks
     * If the Pokemon's moveset has been set via {@linkcode Overrides.MOVESET_OVERRIDE}/{@linkcode Overrides.ENEMY_MOVESET_OVERRIDE}
     * or does not contain exactly one copy of `moveId`, this will fail the test.
     */
    toHaveUsedPP(moveId: MoveId, ppUsed: number | "all"): void;

    // #endregion Pokemon Matchers
  }
}
