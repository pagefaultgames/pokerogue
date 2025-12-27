import type { Phase } from "#app/phase";
import type { DynamicPhaseMarker } from "#phases/dynamic-phase-marker";
import type { PhaseConditionFunc, PhaseManager, PhaseMap, PhaseString } from "#types/phase-types";

/**
 * The PhaseTree is the central storage location for {@linkcode Phase}s by the {@linkcode PhaseManager}.
 *
 * It has a tiered structure, where unshifted phases are added one level above the currently running Phase. \
 * Phases are generally popped from the Tree in FIFO order.
 *
 * Dynamically ordered phases are queued into the Tree only as {@linkcode DynamicPhaseMarker | Marker}s and
 * are not guaranteed to run FIFO (otherwise, they would not be dynamic)
 */
export class PhaseTree {
  /**
   * Storage for all levels in the tree.
   * This is a simple array because only one Phase may run and have "children" at a time.
   * @remarks
   * This does _not_ include the currently-running Phase, which is removed prior to being run.
   */
  private levels: Phase[][] = [[]];
  /** The level of the currently-running {@linkcode Phase} in the Tree. */
  private currentLevel = 0;
  /**
   * True if a "deferred" level exists
   * @see {@linkcode addPhase}
   */
  private deferredActive = false;

  /**
   * Internal helper method to add a {@linkcode Phase} to the specified level.
   * @param phase - The `Phase` to add
   * @param level - The numeric level to add the phase
   * @throws {@linkcode Error}
   * Error if `level` is out of legal bounds
   */
  private add(phase: Phase, level: number): void {
    // Add a new level if trying to push to non-initialized layer
    if (level === this.currentLevel + 1 && level === this.levels.length) {
      this.levels.push([]);
    }

    const addLevel: Phase[] | undefined = this.levels[level];
    if (addLevel == null) {
      throw new Error("Attempted to add a phase to a nonexistent level of the PhaseTree!\nLevel: " + level.toString());
    }
    addLevel.push(phase);
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
      this.currentLevel += 1;
    }
    this.add(phase, this.currentLevel + 1 - +defer);
  }

  /**
   * Add a {@linkcode Phase} after the first occurence of a given `Phase` in the Tree,
   * or to the top of the Tree if no such phase exists.
   * @param phase - The {@linkcode Phase} to be added
   * @param type - The {@linkcode PhaseString | name} of the Phase to search for
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
   * Push a {@linkcode Phase} to the last level of the queue.
   * It will run only after all previously queued phases have been executed.
   * @param phase - The {@linkcode Phase} to add
   */
  public pushPhase(phase: Phase): void {
    this.add(phase, 0);
  }

  /**
   * Remove and return the first {@linkcode Phase} from the topmost level of the tree.
   * @returns The next {@linkcode Phase}, or `undefined` if the Tree is empty
   */
  public getNextPhase(): Phase | undefined {
    // Clear out all empty levels from the tree
    this.currentLevel = this.levels.length - 1;
    while (this.currentLevel > 0 && this.levels[this.currentLevel].length === 0) {
      this.deferredActive = false;
      this.levels.pop();
      this.currentLevel--;
    }

    return this.levels[this.currentLevel].shift();
  }

  /**
   * Find and return the first {@linkcode Phase} in the Tree matching the given conditions.
   * @param phaseName - The {@linkcode PhaseString | name} of the Phase to search for
   * @param phaseFilter - An optional {@linkcode PhaseConditionFunc} to add conditions to the search
   * @returns The first `Phase` that matches the criteria, or `undefined` if none exists
   */
  public find<P extends PhaseString>(phaseName: P, phaseFilter?: PhaseConditionFunc<P>): PhaseMap[P] | undefined {
    for (let i = this.levels.length - 1; i >= 0; i--) {
      const level = this.levels[i];
      const phase = level.find((p): p is PhaseMap[P] => p.is(phaseName) && (!phaseFilter || phaseFilter(p)));
      if (phase) {
        return phase;
      }
    }
  }

  /**
   * Find and return all {@linkcode Phase}s in the Tree matching the given conditions.
   * @param phaseName - The {@linkcode PhaseString | name} of the Phase to search for
   * @param phaseFilter - An optional {@linkcode PhaseConditionFunc} to add conditions to the search
   * @returns An array containing all `Phase`s matching the criteria.
   */
  public findAll<P extends PhaseString>(phaseName: P, phaseFilter?: PhaseConditionFunc<P>): PhaseMap[P][] {
    const phases: PhaseMap[P][] = [];
    for (let i = this.levels.length - 1; i >= 0; i--) {
      const level = this.levels[i];
      phases.push(...level.filter((p): p is PhaseMap[P] => p.is(phaseName) && (!phaseFilter || phaseFilter(p))));
    }
    return phases;
  }

  /**
   * Clear all levels (and their constituent Phases) from the Tree.
   * @param leaveFirstLevel - Whether to leave the top level of the tree intact; default `false`
   * @privateRemarks
   * The parameter on this method exists because {@linkcode PhaseManager.clearPhaseQueue} previously (probably by mistake) ignored `phaseQueuePrepend`.
   *
   * This is (probably by mistake) relied upon by certain ME functions.
   */
  public clear(leaveFirstLevel = false) {
    this.levels = [leaveFirstLevel ? (this.levels.at(-1) ?? []) : []];
    this.currentLevel = 0;
  }

  /**
   * Find and remove a single {@linkcode Phase} from the Tree.
   * @param phaseName - The {@linkcode PhaseString | name} of the Phase to search for
   * @param phaseFilter - An optional {@linkcode PhaseConditionFunc} to add conditions to the search
   * @returns Whether a removal occurred
   */
  public remove<P extends PhaseString>(phaseName: P, phaseFilter?: PhaseConditionFunc<P>): boolean {
    for (let i = this.levels.length - 1; i >= 0; i--) {
      const level = this.levels[i];
      const phaseIndex = level.findIndex(p => p.is(phaseName) && (!phaseFilter || phaseFilter(p)));
      if (phaseIndex !== -1) {
        level.splice(phaseIndex, 1);
        return true;
      }
    }
    return false;
  }

  /**
   * Remove all {@linkcode Phase}s of the given type from the Tree.
   * @param phaseName - The {@linkcode PhaseString | name} of the Phase to remove
   */
  public removeAll(phaseName: PhaseString): void {
    for (let i = 0; i < this.levels.length; i++) {
      this.levels[i] = this.levels[i].filter(phase => !phase.is(phaseName));
    }
  }

  /**
   * Check whether a particular Phase exists in the Tree.
   * @param phaseName - The {@linkcode PhaseString | name} of the Phase to search for
   * @param phaseFilter - An optional `PhaseConditionFunc` to specify conditions for the phase
   * @returns Whether a matching phase exists
   */
  public exists<P extends PhaseString>(phaseName: P, phaseFilter: PhaseConditionFunc<P> = () => true): boolean {
    return this.levels.some(level => level.some(phase => phase.is(phaseName) && phaseFilter(phase)));
  }
}
