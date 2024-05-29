import { BattleSpec } from "./enums/battle-spec";
import Pokemon from "./field/pokemon";
import i18next from "./plugins/i18n";

export function getPokemonMessage(pokemon: Pokemon, content: string): string {
  return `${getPokemonPrefix(pokemon)}${pokemon.name}${content}`;
}

export function getPokemonPrefix(pokemon: Pokemon): string {
  let prefix: string;
  switch (pokemon.scene.currentBattle.battleSpec) {
  case BattleSpec.DEFAULT:
    prefix = !pokemon.isPlayer() ? pokemon.hasTrainer() ? i18next.t("pokemonInfo:Prefix.Foe") : i18next.t("pokemonInfo:Prefix.Wild") : i18next.t("pokemonInfo:Prefix.Default");
    break;
  case BattleSpec.FINAL_BOSS:
    prefix = !pokemon.isPlayer() ? i18next.t("pokemonInfo:Prefix.Foe") : i18next.t("pokemonInfo:Prefix.Default");
    break;
  }
  return prefix;
}
