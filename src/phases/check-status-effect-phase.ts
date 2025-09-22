import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";

export class CheckStatusEffectPhase extends Phase {
  public readonly phaseName = "CheckStatusEffectPhase";

  start() {
    const field = globalScene.getField();
    for (const p of field) {
      if (p?.status?.isPostTurn()) {
        globalScene.phaseManager.unshiftNew("PostTurnStatusEffectPhase", p.getBattlerIndex());
      }
    }
    this.end();
  }
}
