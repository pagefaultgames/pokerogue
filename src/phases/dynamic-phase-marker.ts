import type { PhaseString } from "#app/@types/phase-types";
import { Phase } from "#app/phase";

/**
 * This phase exists for the sole purpose of marking the location and type of a dynamic phase for the phase manager
 */
export class DynamicPhaseMarker extends Phase {
  public override readonly phaseName = "DynamicPhaseMarker";

  /** The type of phase which this phase is a marker for */
  public phaseType: PhaseString;

  constructor(type: PhaseString) {
    super();
    this.phaseType = type;
  }
}
