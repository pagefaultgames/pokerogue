import type { PhaseString } from "#app/@types/phase-types";
import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";

export class ActivatePriorityQueuePhase extends Phase {
  public readonly phaseName = "ActivatePriorityQueuePhase";
  private readonly type: PhaseString;

  constructor(type: PhaseString) {
    super();
    this.type = type;
  }

  override start() {
    super.start();
    globalScene.phaseManager.startNextDynamicPhase();
    this.end();
  }

  public getType(): PhaseString {
    return this.type;
  }
}
