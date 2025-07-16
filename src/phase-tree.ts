import type { PhaseConditionFunc } from "#app/@types/phase-condition";
import type { PhaseMap, PhaseString } from "#app/@types/phase-types";
import { globalScene } from "#app/global-scene";
import type { Phase } from "#app/phase";
import { DynamicQueueManager } from "#app/queues/dynamic-queue-manager";

export class PhaseTree {
  private levels: Phase[][];
  private currentLevel: number;

  private dynamicQueueManager: DynamicQueueManager;

  constructor() {
    this.currentLevel = 0;
    this.levels = [[]];
    this.dynamicQueueManager = new DynamicQueueManager();
  }

  private add(phase: Phase, level: number) {
    let phaseToAdd = phase;
    if (this.dynamicQueueManager.queueDynamicPhase(phase)) {
      phaseToAdd = globalScene.phaseManager.create("DynamicPhaseMarker", phase.phaseName);
    }
    this.levels[level].push(phaseToAdd);
  }

  public addPhase(phase: Phase, deepen = true): void {
    const level = deepen ? this.currentLevel + 1 : this.currentLevel;
    if (deepen && this.currentLevel >= this.levels.length - 1) {
      this.levels.push([]);
    }

    this.add(phase, level);
  }

  public unshiftToCurrent(phase: Phase): void {
    this.levels[this.currentLevel - 1].unshift(phase);
  }

  public pushPhase(phase: Phase): void {
    this.add(phase, this.currentLevel);
  }

  public getNextPhase(): Phase | undefined {
    while (this.levels[this.currentLevel].length === 0) {
      this.currentLevel--;
    }

    // We always increase the level in anticipation of the popped phase increasing the depth
    let phase = this.levels[this.currentLevel++].pop();
    if (phase?.is("DynamicPhaseMarker")) {
      phase = this.dynamicQueueManager.popNextPhase(phase.phaseType);
    }
    return phase;
  }

  public find<P extends PhaseString>(phaseType: P, phaseFilter?: PhaseConditionFunc<P>): PhaseMap[P] | undefined {
    for (let i = this.levels.length - 1; i >= 0; i--) {
      const level = this.levels[i];
      const phase = level.find(p => p.is(phaseType) && (!phaseFilter || phaseFilter(p)));
      if (phase) {
        return phase as PhaseMap[P];
      }
    }
  }

  public clear() {
    this.levels = [[]];
  }

  public remove<P extends PhaseString>(phaseType: P, phaseFilter?: PhaseConditionFunc<P>): boolean {
    for (let i = this.levels.length - 1; i >= 0; i--) {
      const level = this.levels[i];
      const phase = level.find(p => p.is(phaseType) && (!phaseFilter || phaseFilter(p)));
      if (phase) {
        level.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  public removeAll(phaseType: PhaseString): void {
    for (let level of this.levels) {
      level = level.filter(phase => !phase.is(phaseType));
    }
  }

  public exists<P extends PhaseString>(phaseType: P, phaseFilter?: PhaseConditionFunc<P>): boolean {
    for (const level of this.levels) {
      for (const phase of level) {
        if (phase.is(phaseType) && (!phaseFilter || phaseFilter(phase))) {
          return true;
        }
      }
    }
    return false;
  }
}
