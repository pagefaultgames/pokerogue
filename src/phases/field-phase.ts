import { gScene } from "#app/battle-scene";
import Pokemon from "#app/field/pokemon";
import { BattlePhase } from "./battle-phase";

type PokemonFunc = (pokemon: Pokemon) => void;

export abstract class FieldPhase extends BattlePhase {
  executeForAll(func: PokemonFunc): void {
    const field = gScene.getField(true).filter(p => p.summonData);
    field.forEach(pokemon => func(pokemon));
  }
}
