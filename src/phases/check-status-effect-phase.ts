import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { inSpeedOrder } from "#utils/speed-order-generator";

export class CheckStatusEffectPhase extends Phase {
  public readonly phaseName = "CheckStatusEffectPhase";

  start() {
    for (const p of inSpeedOrder(ArenaTagSide.BOTH)) {
      if (p.status?.isPostTurn()) {
        globalScene.phaseManager.unshiftNew("PostTurnStatusEffectPhase", p.getBattlerIndex());
      }
    }
    this.end();
  }
}
