import { BattleSpec } from "./enums/battle-spec";
import Pokemon from "./field/pokemon";

export function getPokemonMessage(pokemon: Pokemon, content: string): string {
  return `${getPokemonPrefix(pokemon)}${pokemon.name}${content}`;
}

export function getPokemonPrefix(pokemon: Pokemon): string {
  if (pokemon.isPlayer()) return '';

  switch (pokemon.scene.currentBattle.battleSpec) {
    case BattleSpec.DEFAULT:
      return pokemon.hasTrainer() ? 'Foe ' : 'Wild ';
    case BattleSpec.FINAL_BOSS:
      return 'Foe ';
  }
}
