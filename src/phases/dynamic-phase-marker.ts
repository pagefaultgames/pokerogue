import { Phase } from "#app/phase";
import type { PhaseManager, PhaseString } from "#types/phase-types";

/**
 * This "phase" exists for the sole purpose of marking the location and type of a dynamic phase
 * for the {@linkcode PhaseManager}.
 *
 * It is never actually run.
 */
export class DynamicPhaseMarker extends Phase {
  public override readonly phaseName = "DynamicPhaseMarker";
  /**
   * The name of the {@linkcode Phase} being tracked. \
   * Will be executed when this Phase would otherwise be run.
   */
  public readonly phaseType: PhaseString;

  constructor(type: PhaseString) {
    super();
    this.phaseType = type;
  }
}
