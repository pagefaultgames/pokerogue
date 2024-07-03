import { BattleSpec } from "#enums/battle-spec";
import Pokemon from "./field/pokemon";
import i18next from "./plugins/i18n";

/**
 * Builds a message by concatenating the Pokemon name with its potential affix and the given text
 * @param pokemon {@linkcode Pokemon} name and battle context will be retrieved from this instance for {@linkcode getPokemonNameWithAffix}
 * @param {string} content any text
 * @returns {string} ex: "Wild Gengar fainted!", "Ectoplasma sauvage est K.O!"
 * @see {@linkcode getPokemonNameWithAffix} for the Pokemon's name and potentiel affix
 */
export function getPokemonMessage(pokemon: Pokemon, content: string): string {
  return `${getPokemonNameWithAffix(pokemon)}${content}`;
}

/**
 * Retrieves the Pokemon's name, potentially with an affix indicating its role (wild or foe) in the current battle context, translated
 * @param pokemon {@linkcode Pokemon} name and battle context will be retrieved from this instance
 * @returns {string} ex: "Wild Gengar", "Ectoplasma sauvage"
 */
export function getPokemonNameWithAffix(pokemon: Pokemon): string {
  switch (pokemon.scene.currentBattle.battleSpec) {
  case BattleSpec.DEFAULT:
    return !pokemon.isPlayer()
      ? pokemon.hasTrainer()
        ? i18next.t("battle:foePokemonWithAffix", {
          pokemonName: pokemon.name,
        })
        : i18next.t("battle:wildPokemonWithAffix", {
          pokemonName: pokemon.name,
        })
      : pokemon.name;
  case BattleSpec.FINAL_BOSS:
    return !pokemon.isPlayer()
      ? i18next.t("battle:foePokemonWithAffix", { pokemonName: pokemon.name })
      : pokemon.name;
  default:
    return pokemon.name;
  }
}
