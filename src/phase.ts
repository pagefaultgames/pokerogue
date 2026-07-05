import { globalScene } from "#app/global-scene";
import type { PhaseManager } from "#app/phase-manager";
import type { PhaseMap, PhaseString } from "#types/phase-types";

/** A Phase represents a discrete chunk of game logic that must be completed. */
export abstract class Phase {
  /**
   * Start the current phase.
   * Called automatically by the {@linkcode PhaseManager} when it is this Phase's turn to run.
   */
  // TODO: make this abstract
  public start(): void {}

  /**
   * End the current phase and start the next one.
   * @remarks
   * Phases that override `end()` are responsible for calling `super.end()` themselves (after any async operations resolve).
   * Additionally, attempting to call this function multiple times from the same Phase will likely crash the game.
   */
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
