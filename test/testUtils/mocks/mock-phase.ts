import { Phase } from "#app/phase";
/**
 * A rudimentary object stub of a phase, containing everything apart from a `phaseName`.
 * Ends upon starting by default.
 *
 * @privateremarks
 * Callers using this to stub a class should use arbitrary (albeit unique) `phaseName`s
 * and rely on the below functions to manipulate phases to circumvent {@linkcode PhaseString} strong typing.
 */
export abstract class mockPhase extends Phase {
  public phaseName: any;
  start() {
    this.end();
  }
}
