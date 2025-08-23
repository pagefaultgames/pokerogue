import { globalScene } from "#app/global-scene";
import type { PhaseMap, PhaseString } from "#types/phase-types";

export abstract class Phase {
  /** Start the current phase. */
  start() {}

  /** End the current phase and start a new one. */
  end() {
    globalScene.phaseManager.shiftPhase();
  }

  /**
   * The string name of the phase, used to identify the phase type for {@linkcode is}
   *
   * @privateRemarks
   *
   * When implementing a phase, you must set the `phaseName` property to the name of the phase.
   */
  public abstract readonly phaseName: PhaseString;

  /**
   * Check if the phase is of the given type without requiring `instanceof`.
   *
   * @param phase - The string name of the phase to check.
   * @returns Whether this phase is of the provided type.
   *
   * @remarks
   * This does not check for subclasses! It only checks if the phase is *exactly* the given type.
   * This method exists to avoid circular import issues, as using `instanceof` would require importing each phase.
   */
  is<K extends keyof PhaseMap>(phase: K): this is PhaseMap[K] {
    return this.phaseName === phase;
  }
}
