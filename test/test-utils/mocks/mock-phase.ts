import { Phase } from "#app/phase";

/**
 * A rudimentary mock of a phase used for unit tests.
 * Ends upon starting by default.
 */
export abstract class mockPhase extends Phase {
  public phaseName: any;
  start() {
    this.end();
  }
}
