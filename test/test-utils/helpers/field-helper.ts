import type { globalScene } from "#app/global-scene";
import { allAbilities } from "#data/data-lists";
import type { AbilityId } from "#enums/ability-id";
import type { BattlerIndex } from "#enums/battler-index";
import type { PokemonType } from "#enums/pokemon-type";
import { Stat } from "#enums/stat";
import type { EnemyPokemon, PlayerPokemon, Pokemon } from "#field/pokemon";
import { GameManagerHelper } from "#test/test-utils/helpers/game-manager-helper";
import type { MoveHelper } from "#test/test-utils/helpers/move-helper";
import { sortInSpeedOrder } from "#utils/speed-order";
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
   * Passthrough for {@linkcode globalScene.getPlayerParty} that adds a check that the party contains at least 1 pokemon.
   * @returns The enemy party
   */
  public getPlayerParty(): PlayerPokemon[] {
    const party = this.game.scene.getPlayerParty();
    expect(party.length).toBeGreaterThan(0);
    return party;
  }

  /**
   * Passthrough for {@linkcode globalScene.getEnemyParty} that adds a check that the party contains at least 1 pokemon.
   * @returns The enemy party
   */
  public getEnemyParty(): EnemyPokemon[] {
    const party = this.game.scene.getEnemyParty();
    expect(party.length).toBeGreaterThan(0);
    return party;
  }

  /**
   * Helper function to return all on-field {@linkcode Pokemon} in speed order (fastest first).
   * @param indices - Whether to only return {@linkcode BattlerIndex}es instead of full Pokemon objects
   * (such as for comparison with other speed order-related mechanisms); default `false`
   * @param ignoreOverride - Whether to ignore preset turn orders and speed-reversing effects (like Trick Room);
   * default `true`
   * @returns An array containing all on-field {@linkcode Pokemon} in order of **descending** Speed.
   */
  public getSpeedOrder(indices?: false, ignoreOverride?: boolean): Pokemon[];
  /**
   * Helper function to return all on-field {@linkcode Pokemon} in speed order (fastest first).
   * @param indices - Whether to only return {@linkcode BattlerIndex}es instead of full Pokemon objects
   * (such as for comparison with other speed order-related mechanisms); default `false`
   * @param ignoreOverride - Whether to ignore preset turn orders and speed-reversing effects (like Trick Room);
   * default `true`
   * @returns An array containing the {@linkcode BattlerIndex}es of all on-field `Pokemon` in order of **descending** Speed. \
   */
  public getSpeedOrder(indices: true, ignoreOverride?: boolean): BattlerIndex[];
  public getSpeedOrder(indices = false, ignoreOverride = true): BattlerIndex[] | Pokemon[] {
    let ret = this.game.scene.getField(true);
    if (ignoreOverride) {
      ret.sort((pA, pB) => pB.getEffectiveStat(Stat.SPD) - pA.getEffectiveStat(Stat.SPD));
    } else {
      ret = sortInSpeedOrder(ret);
    }

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
  public mockAbility(pokemon: Pokemon, ability: AbilityId): MockInstance<Pokemon["getAbility"]> {
    return vi.spyOn(pokemon, "getAbility").mockReturnValue(allAbilities[ability]);
  }

  /**
   * Force a given Pokemon to be Terastallized to the given type.
   *
   * @param pokemon - The pokemon to Terastallize
   * @param teraType - The {@linkcode PokemonType} to Terastallize into; defaults to `pokemon`'s primary type if not provided
   * @remarks
   * This function only mocks the Pokemon's tera-related variables; it does NOT activate any tera-related abilities.
   *
   * If activating on-Terastallize effects is desired, use either {@linkcode MoveHelper.use} with `useTera=true`
   * or {@linkcode MoveHelper.selectWithTera} instead.
   */
  public forceTera(pokemon: Pokemon, teraType: PokemonType = pokemon.getSpeciesForm(true).type1): void {
    vi.spyOn(pokemon, "isTerastallized", "get").mockReturnValue(true);
    vi.spyOn(pokemon, "teraType", "get").mockReturnValue(teraType);
  }
}
