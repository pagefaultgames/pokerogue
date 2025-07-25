import { globalScene } from "#app/global-scene";
import type { Pokemon } from "#field/pokemon";
import { BattlePhase } from "#phases/battle-phase";

type PokemonFunc = (pokemon: Pokemon) => void;

export abstract class FieldPhase extends BattlePhase {
  executeForAll(func: PokemonFunc): void {
    for (const pokemon of globalScene.getField(true)) {
      func(pokemon);
    }
  }
}
