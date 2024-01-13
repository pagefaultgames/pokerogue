import { BattleSpec } from "./enums/battle-spec";
import Pokemon from "./pokemon";

export function getPokemonMessage(pokemon: Pokemon, content: string): string {
  let prefix: string;
  switch (pokemon.scene.currentBattle.battleSpec) {
    case BattleSpec.DEFAULT:
      prefix = !pokemon.isPlayer() ? pokemon.hasTrainer() ? 'Foe ' : 'Wild ' : '';
      break;
    case BattleSpec.FINAL_BOSS:
      prefix = 'Foe ';
      break;
  }
  return `${prefix}${pokemon.name}${content}`;
}