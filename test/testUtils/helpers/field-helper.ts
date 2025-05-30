// -- start tsdoc imports --
// biome-ignore lint/correctness/noUnusedImports: TSDoc import
import type { globalScene } from "#app/global-scene";
// -- end tsdoc imports --

import type { BattlerIndex } from "#app/battle";
import type { Ability } from "#app/data/abilities/ability-class";
import { allAbilities } from "#app/data/data-lists";
import type Pokemon from "#app/field/pokemon";
import type { EnemyPokemon, PlayerPokemon } from "#app/field/pokemon";
import type { Abilities } from "#enums/abilities";
import type { PokemonType } from "#enums/pokemon-type";
import { Stat } from "#enums/stat";
import { GameManagerHelper } from "#test/testUtils/helpers/gameManagerHelper";
import { expect, type MockInstance, vi } from "vitest";

/** Helper to manage pokemon */
export class FieldHelper extends GameManagerHelper {
  /**
   * Passthrough for {@linkcode globalScene.getPlayerPokemon} that adds an `undefined` check for
   * the Pokemon so that the return type for the function doesn't have `undefined`.
   * This removes the need to add a `!` like when calling `game.scene.getPlayerPokemon()!`.
   * @param includeSwitching Whether a pokemon that is currently switching out is valid, default `true`
   * @returns The first {@linkcode PlayerPokemon} that is {@linkcode globalScene.getPlayerField on the field}
   * and {@linkcode PlayerPokemon.isActive is active}
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
   * @returns The first {@linkcode EnemyPokemon} that is {@linkcode globalScene.getEnemyField on the field}
   * and {@linkcode EnemyPokemon.isActive is active}
   * (aka {@linkcode EnemyPokemon.isAllowedInBattle is allowed in battle}).
   */
  public getEnemyPokemon(includeSwitching = true): EnemyPokemon {
    const pokemon = this.game.scene.getEnemyPokemon(includeSwitching);
    expect(pokemon).toBeDefined();
    return pokemon!;
  }

  /**
   * @returns The {@linkcode BattlerIndex | indexes} of Pokemon on the field in order of decreasing Speed.
   * Speed ties are returned in increasing order of index.
   *
   * Note: Trick Room does not modify the speed of Pokemon on the field.
   */
  public getSpeedOrder(): BattlerIndex[] {
    return this.game.scene
      .getField(true)
      .sort((pA, pB) => pB.getEffectiveStat(Stat.SPD) - pA.getEffectiveStat(Stat.SPD))
      .map(p => p.getBattlerIndex());
  }

  /**
   * Mocks a pokemon's ability, overriding its existing ability (takes precedence over global overrides)
   * @param pokemon - The pokemon to mock the ability of
   * @param ability - The ability to be mocked
   * @returns A {@linkcode MockInstance} object
   * @see {@linkcode vi.spyOn}
   * @see https://vitest.dev/api/mock#mockreturnvalue
   */
  public mockAbility(pokemon: Pokemon, ability: Abilities): MockInstance<(baseOnly?: boolean) => Ability> {
    return vi.spyOn(pokemon, "getAbility").mockReturnValue(allAbilities[ability]);
  }

  /**
   * Forces a pokemon to be terastallized. Defaults to the pokemon's primary type if not specified.
   *
   * This function only mocks the Pokemon's tera-related variables; it does NOT activate any tera-related abilities.
   *
   * @param pokemon - The pokemon to terastallize.
   * @param teraType - (optional) The {@linkcode PokemonType} to terastallize it as.
   */
  public forceTera(pokemon: Pokemon, teraType?: PokemonType): void {
    vi.spyOn(pokemon, "isTerastallized", "get").mockReturnValue(true);
    teraType ??= pokemon.getSpeciesForm(true).type1;
    vi.spyOn(pokemon, "teraType", "get").mockReturnValue(teraType);
  }
}
