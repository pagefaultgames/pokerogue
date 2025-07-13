import { Phase } from "#app/phase";
import type { MoveAnim } from "#data/battle-anims";

/**
 * Plays the given {@linkcode MoveAnim} sequentially.
 */
export class MoveAnimPhase<Anim extends MoveAnim> extends Phase {
  public readonly phaseName = "MoveAnimPhase";

  constructor(
    protected anim: Anim,
    protected onSubstitute = false,
  ) {
    super();
  }

  public override start(): void {
    super.start();

    this.anim.play(this.onSubstitute, () => this.end());
  }
}
