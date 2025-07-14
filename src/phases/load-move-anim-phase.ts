import { Phase } from "#app/phase";
import { initMoveAnim, loadMoveAnimAssets } from "#data/battle-anims";
import type { MoveId } from "#enums/move-id";

/**
 * Phase for synchronous move animation loading.
 * Should be used when a move invokes another move that
 * isn't already loaded (e.g. for Metronome)
 */
export class LoadMoveAnimPhase extends Phase {
  public readonly phaseName = "LoadMoveAnimPhase";
  constructor(protected moveId: MoveId) {
    super();
  }

  public override start(): void {
    initMoveAnim(this.moveId)
      .then(() => loadMoveAnimAssets([this.moveId], true))
      .then(() => this.end());
  }
}
