import { BattleSpec } from "./enums/battle-spec";
import Pokemon from "./field/pokemon";

export function getPokemonMessage(pokemon: Pokemon, content: string): string {
  return `${getPokemonPrefix(pokemon)}${pokemon.name}${content}`;
}

export function getPokemonPrefix(pokemon: Pokemon): string {
  let prefix: string;
  switch (pokemon.scene.currentBattle.battleSpec) {
  case BattleSpec.DEFAULT:
    prefix = !pokemon.isPlayer() ? pokemon.hasTrainer() ? "Foe a modif" : "Wild a modif" : "";
    break;
  case BattleSpec.FINAL_BOSS:
    prefix = !pokemon.isPlayer() ? "Foe a modif" : "";
    break;
  }
  return prefix;
}
