// biome-ignore lint/correctness/noUnusedImports: TSDoc
import type { PhaseManager, PhaseString } from "#app/@types/phase-types";
import { Phase } from "#app/phase";

/**
 * This "phase" exists for the sole purpose of marking the location and type of a dynamic phase for the {@linkcode PhaseManager}.
 *
 * It is never actually run.
 */
export class DynamicPhaseMarker extends Phase {
  public override readonly phaseName = "DynamicPhaseMarker";

  /** The name of the `Phase` for which this phase is marking. */
  public phaseType: PhaseString;

  constructor(type: PhaseString) {
    super();
    this.phaseType = type;
  }
}
