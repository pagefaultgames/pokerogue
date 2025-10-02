// biome-ignore-start lint/correctness/noUnusedImports: TSDoc imports
import type { PhaseManager } from "#app/@types/phase-types";
import type { DynamicPhaseMarker } from "#phases/dynamic-phase-marker";
// biome-ignore-end lint/correctness/noUnusedImports: TSDoc imports

import type { PhaseMap, PhaseString } from "#app/@types/phase-types";
import type { Phase } from "#app/phase";
import type { PhaseConditionFunc } from "#types/phase-types";

/**
 * The PhaseTree is the central storage location for {@linkcode Phase}s by the {@linkcode PhaseManager}.
 *
 * It has a tiered structure, where unshifted phases are added one level above the currently running Phase. Phases are generally popped from the Tree in FIFO order.
 *
 * Dynamically ordered phases are queued into the Tree only as {@linkcode DynamicPhaseMarker | Marker}s and as such are not guaranteed to run FIFO (otherwise, they would not be dynamic)
 */
export class PhaseTree {
  /** Storage for all levels in the tree. This is a simple array because only one Phase may have "children" at a time. */
  private levels: Phase[][] = [[]];
  /** The level of the currently running {@linkcode Phase} in the Tree (note that such phase is not actually in the Tree while it is running) */
  private currentLevel = 0;
  /**
   * True if a "deferred" level exists
   * @see {@linkcode addPhase}
   */
  private deferredActive = false;

  /**
   * Adds a {@linkcode Phase} to the specified level
   * @param phase - The phase to add
   * @param level - The numeric level to add the phase
   * @throws Error if `level` is out of legal bounds
   */
  private add(phase: Phase, level: number): void {
    const addLevel = this.levels[level];
    if (addLevel == null) {
      throw new Error("Attempted to add a phase to a nonexistent level of the PhaseTree!\nLevel: " + level.toString());
    }
    this.levels[level].push(phase);
  }

  /**
   * Used by the {@linkcode PhaseManager} to add phases to the Tree
   * @param phase - The {@linkcode Phase} to be added
   * @param defer - Whether to defer the execution of this phase by allowing subsequently-added phases to run before it
   *
   * @privateRemarks
   * Deferral is implemented by moving the queue at {@linkcode currentLevel} up one level and inserting the new phase below it.
   * {@linkcode deferredActive} is set until the moved queue (and anything added to it) is exhausted.
   *
   * If {@linkcode deferredActive} is `true` when a deferred phase is added, the phase will be pushed to the second-highest level queue.
   * That is, it will execute after the originally deferred phase, but there is no possibility for nesting with deferral.
   *
   * @todo `setPhaseQueueSplice` had strange behavior. This is simpler, but there are probably some remnant edge cases with the current implementation
   */
  public addPhase(phase: Phase, defer = false): void {
    if (defer && !this.deferredActive) {
      this.deferredActive = true;
      this.levels.splice(-1, 0, []);
    }
    this.add(phase, this.levels.length - 1 - +defer);
  }

  /**
   * Adds a {@linkcode Phase} after the first occurence of the given type, or to the top of the Tree if no such phase exists
   * @param phase - The {@linkcode Phase} to be added
   * @param type - A {@linkcode PhaseString} representing the type to search for
   */
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

  /**
   * Unshifts a {@linkcode Phase} to the current level.
   * This is effectively the same as if the phase were added immediately after the currently-running phase, before it started.
   * @param phase - The {@linkcode Phase} to be added
   */
  public unshiftToCurrent(phase: Phase): void {
    this.levels[this.currentLevel].unshift(phase);
  }

  /**
   * Pushes a {@linkcode Phase} to the last level of the queue. It will run only after all previously queued phases have been executed.
   * @param phase - The {@linkcode Phase} to be added
   */
  public pushPhase(phase: Phase): void {
    this.add(phase, 0);
  }

  /**
   * Removes and returns the first {@linkcode Phase} from the topmost level of the tree
   * @returns - The next {@linkcode Phase}, or `undefined` if the Tree is empty
   */
  public getNextPhase(): Phase | undefined {
    this.currentLevel = this.levels.length - 1;
    while (this.currentLevel > 0 && this.levels[this.currentLevel].length === 0) {
      this.deferredActive = false;
      this.levels.pop();
      this.currentLevel--;
    }

    // TODO: right now, this is preventing properly marking when one set of unshifted phases ends
    this.levels.push([]);
    return this.levels[this.currentLevel].shift();
  }

  /**
   * Finds a particular {@linkcode Phase} in the Tree by searching in pop order
   * @param phaseType - The {@linkcode PhaseString | type} of phase to search for
   * @param phaseFilter - A {@linkcode PhaseConditionFunc} to specify conditions for the phase
   * @returns The matching {@linkcode Phase}, or `undefined` if none exists
   */
  public find<P extends PhaseString>(phaseType: P, phaseFilter?: PhaseConditionFunc<P>): PhaseMap[P] | undefined {
    for (let i = this.levels.length - 1; i >= 0; i--) {
      const level = this.levels[i];
      const phase = level.find((p): p is PhaseMap[P] => p.is(phaseType) && (!phaseFilter || phaseFilter(p)));
      if (phase) {
        return phase;
      }
    }
  }

  /**
   * Finds a particular {@linkcode Phase} in the Tree by searching in pop order
   * @param phaseType - The {@linkcode PhaseString | type} of phase to search for
   * @param phaseFilter - A {@linkcode PhaseConditionFunc} to specify conditions for the phase
   * @returns The matching {@linkcode Phase}, or `undefined` if none exists
   */
  public findAll<P extends PhaseString>(phaseType: P, phaseFilter?: PhaseConditionFunc<P>): PhaseMap[P][] {
    const phases: PhaseMap[P][] = [];
    for (let i = this.levels.length - 1; i >= 0; i--) {
      const level = this.levels[i];
      const levelPhases = level.filter((p): p is PhaseMap[P] => p.is(phaseType) && (!phaseFilter || phaseFilter(p)));
      phases.push(...levelPhases);
    }
    return phases;
  }

  /**
   * Clears the Tree
   * @param leaveFirstLevel - If `true`, leaves the top level of the tree intact
   *
   * @privateremarks
   * The parameter on this method exists because {@linkcode PhaseManager.clearPhaseQueue} previously (probably by mistake) ignored `phaseQueuePrepend`.
   *
   * This is (probably by mistake) relied upon by certain ME functions.
   */
  public clear(leaveFirstLevel = false) {
    this.levels = [leaveFirstLevel ? (this.levels.at(-1) ?? []) : []];
  }

  /**
   * Finds and removes a single {@linkcode Phase} from the Tree
   * @param phaseType - The {@linkcode PhaseString | type} of phase to search for
   * @param phaseFilter - A {@linkcode PhaseConditionFunc} to specify conditions for the phase
   * @returns Whether a removal occurred
   */
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

  /**
   * Removes all occurrences of {@linkcode Phase}s of the given type
   * @param phaseType - The {@linkcode PhaseString | type} of phase to search for
   */
  public removeAll(phaseType: PhaseString): void {
    for (let i = 0; i < this.levels.length; i++) {
      const level = this.levels[i].filter(phase => !phase.is(phaseType));
      this.levels[i] = level;
    }
  }

  /**
   * Determines if a particular phase exists in the Tree
   * @param phaseType - The {@linkcode PhaseString | type} of phase to search for
   * @param phaseFilter - A {@linkcode PhaseConditionFunc} to specify conditions for the phase
   * @returns Whether a matching phase exists
   */
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
