import type { DynamicPhaseType } from "#enums/dynamic-phase-type";
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
