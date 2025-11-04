import { ArenaTagSide } from "#enums/arena-tag-side";
import type { Pokemon } from "#field/pokemon";
import { BattlePhase } from "#phases/battle-phase";
import { inSpeedOrder } from "#utils/speed-order-generator";

type PokemonFunc = (pokemon: Pokemon) => void;

export abstract class FieldPhase extends BattlePhase {
  executeForAll(func: PokemonFunc): void {
    for (const pokemon of inSpeedOrder(ArenaTagSide.BOTH)) {
      func(pokemon);
    }
  }
}
