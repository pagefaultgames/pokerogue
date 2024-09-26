import Pokemon from "#app/field/pokemon";
import { BattlePhase } from "./battle-phase";
import { BattlerIndex } from "#app/battle.js";
import * as Utils from "../utils";
import { Stat } from "#app/enums/stat.js";
import { TrickRoomTag } from "#app/data/arena-tag.js";

type PokemonFunc = (pokemon: Pokemon) => void;

export abstract class FieldPhase extends BattlePhase {
  executeForAll(func: PokemonFunc): void {
    const field = this.scene.getField(true).filter(p => p.summonData);
    field.forEach(pokemon => func(pokemon));
  }
}
