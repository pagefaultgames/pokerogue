import { globalScene } from "#app/global-scene";
import type { PhaseMap, PhaseString } from "#types/phase-types";

export abstract class Phase {
  /** Start the current phase. */
  public start(): void {}

  /** End the current phase and start a new one. */
  public end(): void {
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
   * Check whether this Phase is of the given type without requiring `instanceof`.
   *
   * @param phaseName - The name of the phase to check
   * @returns Whether this Phase is of the provided type.
   *
   * @remarks
   * This does not check for subclasses! It only checks if the phase is *exactly* the given type.
   * This method exists to avoid circular import issues, as using `instanceof` would require importing each phase.
   */
  public is<K extends keyof PhaseMap>(phaseName: K): this is PhaseMap[K] {
    return this.phaseName === phaseName;
  }
}
