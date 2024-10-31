import { PostTurnStatusEffectPhase } from "#app/phases/post-turn-status-effect-phase";
import { Phase } from "#app/phase";
import { BattlerIndex } from "#app/battle";
import { gScene } from "#app/battle-scene";

export class CheckStatusEffectPhase extends Phase {
  private order : BattlerIndex[];
  constructor(order : BattlerIndex[]) {
    super();
    this.order = order;
  }

  start() {
    const field = gScene.getField();
    for (const o of this.order) {
      if (field[o].status && field[o].status.isPostTurn()) {
        gScene.unshiftPhase(new PostTurnStatusEffectPhase(o));
      }
    }
    this.end();
  }
}
