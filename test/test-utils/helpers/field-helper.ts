/* biome-ignore-start lint/correctness/noUnusedImports: tsdoc imports */
import type { globalScene } from "#app/global-scene";
/* biome-ignore-end lint/correctness/noUnusedImports: tsdoc imports */

import type { Ability } from "#abilities/ability";
import { allAbilities } from "#data/data-lists";
import type { AbilityId } from "#enums/ability-id";
import type { BattlerIndex } from "#enums/battler-index";
import type { PokemonType } from "#enums/pokemon-type";
import { Stat } from "#enums/stat";
import type { EnemyPokemon, PlayerPokemon, Pokemon } from "#field/pokemon";
import { GameManagerHelper } from "#test/test-utils/helpers/game-manager-helper";
import { expect, type MockInstance, vi } from "vitest";

/** Helper to manage pokemon */
export class FieldHelper extends GameManagerHelper {
  /**
   * Passthrough for {@linkcode globalScene.getPlayerPokemon} that adds an `undefined` check for
   * the Pokemon so that the return type for the function doesn't have `undefined`.
   * This removes the need to add a `!` like when calling `game.scene.getPlayerPokemon()!`.
   * @param includeSwitching - Whether a pokemon that is currently switching out is valid, default `true`
   * @returns The first {@linkcode PlayerPokemon} that is {@linkcode globalScene.getPlayerField | on the field}
   * and {@linkcode PlayerPokemon.isActive | is active}
   * (aka {@linkcode PlayerPokemon.isAllowedInBattle is allowed in battle}).
   */
  public getPlayerPokemon(includeSwitching = true): PlayerPokemon {
    const pokemon = this.game.scene.getPlayerPokemon(includeSwitching);
    expect(pokemon).toBeDefined();
    return pokemon!;
  }

  /**
   * Passthrough for {@linkcode globalScene.getEnemyPokemon} that adds an `undefined` check for
   * the Pokemon so that the return type for the function doesn't have `undefined`.
   * This removes the need to add a `!` like when calling `game.scene.getEnemyPokemon()!`.
   * @param includeSwitching Whether a pokemon that is currently switching out is valid, default `true`
   * @returns The first {@linkcode EnemyPokemon} that is {@linkcode globalScene.getEnemyField | on the field}
   * and {@linkcode EnemyPokemon.isActive | is active}
   * (aka {@linkcode EnemyPokemon.isAllowedInBattle | is allowed in battle}).
   */
  public getEnemyPokemon(includeSwitching = true): EnemyPokemon {
    const pokemon = this.game.scene.getEnemyPokemon(includeSwitching);
    expect(pokemon).toBeDefined();
    return pokemon!;
  }

  /**
   * Helper function to return all on-field {@linkcode Pokemon} in speed order (fastest first).
   * @param indices - Whether to only return {@linkcode BattlerIndex}es instead of full Pokemon objects
   * (such as for comparison with other speed order-related mechanisms); default `false`
   * @returns An array containing all on-field {@linkcode Pokemon} in order of descending Speed. \
   * Speed ties are returned in increasing order of index.
   *
   * @remarks
   * This does not account for Trick Room as it does not modify the _speed_ of Pokemon on the field,
   * only their turn order.
   */
  public getSpeedOrder(indices?: false): Pokemon[];

  /**
   * Helper function to return all on-field {@linkcode Pokemon} in speed order (fastest first).
   * @param indices - Whether to only return {@linkcode BattlerIndex}es instead of full Pokemon objects
   * (such as for comparison with other speed order-related mechanisms); default `false`
   * @returns An array containing the {@linkcode BattlerIndex}es of all on-field {@linkcode Pokemon} on the field in order of descending Speed. \
   * Speed ties are returned in increasing order of index.
   *
   * @remarks
   * This does not account for Trick Room as it does not modify the _speed_ of Pokemon on the field,
   * only their turn order.
   */
  public getSpeedOrder(indices: true): BattlerIndex[];
  public getSpeedOrder(indices = false): BattlerIndex[] | Pokemon[] {
    const ret = this.game.scene
      .getField(true)
      .sort(
        (pA, pB) =>
          pB.getEffectiveStat(Stat.SPD) - pA.getEffectiveStat(Stat.SPD) || pA.getBattlerIndex() - pB.getBattlerIndex(),
      );

    return indices ? ret.map(p => p.getBattlerIndex()) : ret;
  }

  /**
   * Mocks a pokemon's ability, overriding its existing ability (takes precedence over global overrides).
   * Useful for giving exactly 1 Pokemon in a double battle a certain ability (rather than all pokemon).
   * @param pokemon - The pokemon to mock the ability of
   * @param ability - The ability to be mocked
   * @returns A {@linkcode MockInstance} object
   * @see {@linkcode vi.spyOn}
   * @see https://vitest.dev/api/mock#mockreturnvalue
   */
  public mockAbility(pokemon: Pokemon, ability: AbilityId): MockInstance<(ignoreOverride?: boolean) => Ability> {
    return vi.spyOn(pokemon, "getAbility").mockReturnValue(allAbilities[ability]);
  }

  /**
   * Force a given Pokemon to be terastallized to the given type.
   *
   * @param pokemon - The pokemon to terastallize.
   * @param teraType - The {@linkcode PokemonType} to terastallize into; defaults to the pokemon's primary type.
   * @remarks
   * This function only mocks the Pokemon's tera-related variables; it does NOT activate any tera-related abilities.
   */
  public forceTera(pokemon: Pokemon, teraType: PokemonType = pokemon.getSpeciesForm(true).type1): void {
    vi.spyOn(pokemon, "isTerastallized", "get").mockReturnValue(true);
    vi.spyOn(pokemon, "teraType", "get").mockReturnValue(teraType);
  }
}
