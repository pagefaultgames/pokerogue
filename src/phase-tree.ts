import type { PhaseConditionFunc } from "#app/@types/phase-condition";
import type { PhaseMap, PhaseString } from "#app/@types/phase-types";
import type { Phase } from "#app/phase";

export class PhaseTree {
  private levels: Phase[][];
  private currentLevel: number;
  // may diverge from currentLevel if a deferred phase is unshifted
  private addLevel: number;

  constructor() {
    this.currentLevel = 0;
    this.addLevel = this.currentLevel;
    this.levels = [[]];
  }

  private add(phase: Phase, level: number) {
    if (level >= this.levels.length - 1) {
      this.levels.push([]);
    }
    this.levels[level].push(phase);
  }

  public addPhase(phase: Phase, defer = false): void {
    this.add(phase, this.addLevel + 1);
    this.addLevel += +defer;
  }

  public unshiftToCurrent(phase: Phase): void {
    this.levels[this.currentLevel].unshift(phase);
  }

  public pushPhase(phase: Phase): void {
    this.add(phase, 0);
  }

  public getNextPhase(): Phase | undefined {
    this.currentLevel = this.levels.length - 1;
    while (this.currentLevel > 0 && this.levels[this.currentLevel].length === 0) {
      this.levels.pop();
      this.currentLevel--;
    }

    this.addLevel = this.currentLevel;
    return this.levels[this.currentLevel].shift();
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
