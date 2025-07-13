import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import type { BattlerIndex } from "#enums/battler-index";

export class CheckStatusEffectPhase extends Phase {
  public readonly phaseName = "CheckStatusEffectPhase";
  private order: BattlerIndex[];
  constructor(order: BattlerIndex[]) {
    super();
    this.order = order;
  }

  start() {
    const field = globalScene.getField();
    for (const o of this.order) {
      if (field[o].status?.isPostTurn()) {
        globalScene.phaseManager.unshiftNew("PostTurnStatusEffectPhase", o);
      }
    }
    this.end();
  }
}
