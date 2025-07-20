import type { PhaseConditionFunc } from "#app/@types/phase-condition";
import type { PhaseMap, PhaseString } from "#app/@types/phase-types";
import type { Phase } from "#app/phase";
import { isNullOrUndefined } from "#app/utils/common";

export class PhaseTree {
  private levels: Phase[][];
  private currentLevel: number;

  constructor() {
    this.currentLevel = 0;
    this.levels = [[]];
  }

  private add(phase: Phase, level: number) {
    const addLevel = this.levels[level];
    if (isNullOrUndefined(addLevel)) {
      throw new Error("Attempted to add a phase to a nonexistent level of the PhaseTree");
    }
    this.levels[level].push(phase);
  }

  public addPhase(phase: Phase, defer = false): void {
    if (defer) {
      // Move the highest level up and insert the deferred phase under it
      this.levels.push(this.levels.at(-1) ?? []);
      this.levels.splice(-2, 1, [phase]);
      return;
    }
    this.add(phase, this.levels.length - 1);
  }

  public addAfter(phase: Phase, type: PhaseString): void {
    for (let i = this.levels.length - 1; i >= 0; i--) {
      const insertIdx = this.levels[i].findIndex(p => p.is(type)) + 1;
      if (insertIdx !== 0) {
        this.levels[i].splice(insertIdx, 0, phase);
        return;
      }
    }

    this.addPhase(phase);
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

    this.levels.push([]);
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

  public clear(leaveFirstLevel = false) {
    this.levels = [leaveFirstLevel ? (this.levels.at(-1) ?? []) : []];
  }

  public remove<P extends PhaseString>(phaseType: P, phaseFilter?: PhaseConditionFunc<P>): boolean {
    for (let i = this.levels.length - 1; i >= 0; i--) {
      const level = this.levels[i];
      const phaseIndex = level.findIndex(p => p.is(phaseType) && (!phaseFilter || phaseFilter(p)));
      if (phaseIndex !== -1) {
        level.splice(phaseIndex, 1);
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
