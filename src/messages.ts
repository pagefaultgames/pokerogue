import { globalScene } from "#app/global-scene";
import { BattleSpec } from "#enums/battle-spec";
import type { Pokemon } from "#field/pokemon";
import i18next from "i18next";

/**
 * Retrieves the Pokemon's name, potentially with an affix indicating its role (wild or foe) in the current battle context, translated
 * @param pokemon - The {@linkcode Pokemon} to retrieve the name of. Will return 'Missingno' as a fallback if null/undefined
 * @param useIllusion - Whether we want the name of the illusion or not; default `true`
 * @returns The localized name of `pokemon` complete with affix. Ex: "Wild Gengar", "Ectoplasma sauvage"
 * @todo Remove this and switch to using i18n context selectors based on pokemon trainer class - this causes incorrect locales
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
