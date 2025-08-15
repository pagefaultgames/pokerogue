import { globalScene } from "#app/global-scene";
import { BattleSpec } from "#enums/battle-spec";
import type { Pokemon } from "#field/pokemon";
import i18next from "i18next";

/**
 * Retrieves the Pokemon's name, potentially with an affix indicating its role (wild or foe) in the current battle context, translated
 * @param pokemon {@linkcode Pokemon} name and battle context will be retrieved from this instance
 * @param {boolean} useIllusion - Whether we want the name of the illusion or not. Default value : true
 * @returns {string} ex: "Wild Gengar", "Ectoplasma sauvage"
 */
export function getPokemonNameWithAffix(pokemon: Pokemon | undefined, useIllusion = true): string {
  if (!pokemon) {
    return "Missigno";
  }

  switch (globalScene.currentBattle.battleSpec) {
    case BattleSpec.DEFAULT:
      return pokemon.isEnemy()
        ? pokemon.hasTrainer()
          ? i18next.t("battle:foePokemonWithAffix", {
              pokemonName: pokemon.getNameToRender(useIllusion),
            })
          : i18next.t("battle:wildPokemonWithAffix", {
              pokemonName: pokemon.getNameToRender(useIllusion),
            })
        : pokemon.getNameToRender(useIllusion);
    case BattleSpec.FINAL_BOSS:
      return pokemon.isEnemy()
        ? i18next.t("battle:foePokemonWithAffix", { pokemonName: pokemon.getNameToRender(useIllusion) })
        : pokemon.getNameToRender(useIllusion);
    default:
      return pokemon.getNameToRender(useIllusion);
  }
}
