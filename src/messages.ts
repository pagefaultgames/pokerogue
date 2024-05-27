import { BattleSpec } from "./enums/battle-spec";
import Pokemon from "./field/pokemon";
import i18next from "./plugins/i18n";

export function getPokemonMessage(pokemon: Pokemon, content: string): string {
  return `${getPokemonAffix(pokemon)}${pokemon.name}${content}`;
}

export function getPokemonAffix(pokemon: Pokemon): string {
  let prefix: string;
  switch (pokemon.scene.currentBattle.battleSpec) {
  case BattleSpec.DEFAULT:
    prefix = !pokemon.isPlayer()
      ? pokemon.hasTrainer()
        ? `${i18next.t("battle:foePokemonAffix")} `
        : `${i18next.t("battle:wildPokemonAffix")} `
      : "";
    break;
  case BattleSpec.FINAL_BOSS:
    prefix = !pokemon.isPlayer() ? `${i18next.t("battle:foePokemonAffix")} ` : "";
    break;
  }
  return prefix;
}
