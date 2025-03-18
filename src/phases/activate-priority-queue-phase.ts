import type { DynamicPhaseType } from "#app/data/phase-priority-queue";
import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";

export class ActivatePriorityQueuePhase extends Phase {
  private type: DynamicPhaseType;

  constructor(type: DynamicPhaseType) {
    super();
    this.type = type;
  }

  override start() {
    super.start();
    globalScene.startDynamicPhaseType(this.type);
    this.end();
  }

  public getType(): DynamicPhaseType {
    return this.type;
  }
}
