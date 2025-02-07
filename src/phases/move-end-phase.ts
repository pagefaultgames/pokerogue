import { globalScene } from "#app/global-scene";
import { BattlerTagLapseType } from "#app/data/battler-tags";
import { PokemonPhase } from "./pokemon-phase";
import type { BattlerIndex } from "#app/battle";

export class MoveEndPhase extends PokemonPhase {
  private wasFollowUp: boolean;
  constructor(battlerIndex: BattlerIndex, wasFollowUp: boolean = false) {
    super(battlerIndex);
    this.wasFollowUp = wasFollowUp;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();
    if (!this.wasFollowUp && pokemon?.isActive(true)) {
      pokemon.lapseTags(BattlerTagLapseType.AFTER_MOVE);
    }

    globalScene.arena.setIgnoreAbilities(false);

    this.end();
  }
}
