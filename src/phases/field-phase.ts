import { globalScene } from "#app/global-scene";
import Pokemon from "#app/field/pokemon";
import { BattlePhase } from "./battle-phase";

type PokemonFunc = (pokemon: Pokemon) => void;

export abstract class FieldPhase extends BattlePhase {
  executeForAll(func: PokemonFunc): void {
    const field = globalScene.getField(true).filter(p => p.summonData);
    field.forEach(pokemon => func(pokemon));
  }
}
