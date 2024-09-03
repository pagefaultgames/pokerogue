import { BattleSpec } from "#enums/battle-spec";
import Pokemon from "./field/pokemon";
import i18next from "i18next";

/**
 * Retrieves the Pokemon's name, potentially with an affix indicating its role (wild or foe) in the current battle context, translated
 * @param pokemon {@linkcode Pokemon} name and battle context will be retrieved from this instance
 * @returns {string} ex: "Wild Gengar", "Ectoplasma sauvage"
 */
export function getPokemonNameWithAffix(pokemon: Pokemon | undefined): string {
  if (!pokemon) {
    return "Missigno";
  }

  switch (pokemon.scene.currentBattle.battleSpec) {
  case BattleSpec.DEFAULT:
    return !pokemon.isPlayer()
      ? pokemon.hasTrainer()
        ? i18next.t("battle:foePokemonWithAffix", {
          pokemonName: pokemon.getNameToRender(),
        })
        : i18next.t("battle:wildPokemonWithAffix", {
          pokemonName: pokemon.getNameToRender(),
        })
      : pokemon.getNameToRender();
  case BattleSpec.FINAL_BOSS:
    return !pokemon.isPlayer()
      ? i18next.t("battle:foePokemonWithAffix", { pokemonName: pokemon.getNameToRender() })
      : pokemon.getNameToRender();
  default:
    return pokemon.getNameToRender();
  }
}
