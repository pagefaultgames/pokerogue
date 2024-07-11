import {PostTurnStatusEffectPhase} from "#app/phases/post-turn-status-effect-phase";
import {Phase} from "#app/phase";
import {BattlerIndex} from "#app/battle";
import BattleScene from "#app/battle-scene";

export class CheckStatusEffectPhase extends Phase {
  private order : BattlerIndex[];
  constructor(scene : BattleScene, order : BattlerIndex[]) {
    super(scene);
    this.scene = scene;
    this.order = order;
  }

  start() {
    const field = this.scene.getField();
    for (const o of this.order) {
      if (field[o].status && field[o].status.isPostTurn()) {
        this.scene.unshiftPhase(new PostTurnStatusEffectPhase(this.scene, o));
      }
    }
    this.end();
  }
}
