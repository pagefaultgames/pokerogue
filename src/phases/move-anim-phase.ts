import type { MoveAnim } from "#app/data/battle-anims";
import { Phase } from "#app/phase";

/**
 * Plays the given {@linkcode MoveAnim} sequentially.
 */
export class MoveAnimPhase<Anim extends MoveAnim> extends Phase {
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
