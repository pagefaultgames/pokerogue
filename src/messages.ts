import i18next from "i18next";
import { BattleSpec } from "./enums/battle-spec";
import Pokemon from "./field/pokemon";

export function getPokemonMessage(pokemon: Pokemon, content: string): string {
  return `${getPokemonPrefix(pokemon)}${pokemon.name}${content}`;
}

export function getPokemonPrefix(pokemon: Pokemon): string {
  let prefix: string;
  switch (pokemon.scene.currentBattle.battleSpec) {
  case BattleSpec.DEFAULT:
    if (pokemon.isPlayer()) {
      prefix = "";
    } else if (pokemon.hasTrainer()) {
      prefix = `${i18next.t("battle:foe")} `;
    } else {
      prefix = `${i18next.t("battle:wild")} `;
    }
    break;
  case BattleSpec.FINAL_BOSS:
    prefix = !pokemon.isPlayer() ? "Foe " : "";
    break;
  }
  return prefix;
}
