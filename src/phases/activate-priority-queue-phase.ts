import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import type { DynamicPhaseType } from "#enums/dynamic-phase-type";

export class ActivatePriorityQueuePhase extends Phase {
  public readonly phaseName = "ActivatePriorityQueuePhase";
  private type: DynamicPhaseType;

  constructor(type: DynamicPhaseType) {
    super();
    this.type = type;
  }

  override start() {
    super.start();
    globalScene.phaseManager.startDynamicPhaseType(this.type);
    this.end();
  }

  public getType(): DynamicPhaseType {
    return this.type;
  }
}
