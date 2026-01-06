import { globalScene } from "#app/global-scene";
import { BattleSpec } from "#enums/battle-spec";
import type { Pokemon } from "#field/pokemon";
import i18next from "i18next";

/**
 * Retrieves the Pokemon's name, potentially with an affix indicating its role (wild or foe) in the current battle context, translated
 * @param pokemon - The {@linkcode Pokemon} to retrieve the name of. Will return "MissingNo." as a fallback if `undefined`
 * @param useIllusion - Whether we want the name of the illusion or not; default `true`
 * @returns The localized name of `pokemon` complete with affix. Ex: "Wild Gengar", "Ectoplasma sauvage"
 */
// TODO: this shouldn't accept `undefined`
// TODO: Remove this and switch to using i18n context selectors based on pokemon trainer class - this causes incorrect locales
export function getPokemonNameWithAffix(pokemon: Pokemon | undefined, useIllusion = true): string {
  if (!pokemon) {
    return "MissingNo.";
  }

  const pokemonName = pokemon.getNameToRender({ useIllusion });

  switch (globalScene.currentBattle.battleSpec) {
    case BattleSpec.DEFAULT:
      return pokemon.isEnemy()
        ? pokemon.hasTrainer()
          ? i18next.t("battle:foePokemonWithAffix", { pokemonName })
          : i18next.t("battle:wildPokemonWithAffix", { pokemonName })
        : pokemonName;
    case BattleSpec.FINAL_BOSS:
      return pokemon.isEnemy() ? i18next.t("battle:foePokemonWithAffix", { pokemonName }) : pokemonName;
  }
}
