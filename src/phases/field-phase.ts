import { BattlePhase } from "./battle-phase";
import * as Utils from "#app/utils.js";
import * as LoggerTools from "../logger";
import Pokemon from "#app/field/pokemon";

type PokemonFunc = (pokemon: Pokemon) => void;

export abstract class FieldPhase extends BattlePhase {
  executeForAll(func: PokemonFunc): void {
    const field = this.scene.getField(true).filter(p => p.summonData);
    field.forEach(pokemon => func(pokemon));
  }
}
