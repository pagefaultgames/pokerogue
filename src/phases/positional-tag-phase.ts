import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import type { PositionalTag } from "#data/positional-tags/positional-tag";
import type { TurnEndPhase } from "#phases/turn-end-phase";

/**
 * Phase to trigger all pending post-turn {@linkcode PositionalTag}s.
 * Occurs before {@linkcode TurnEndPhase} to allow for proper electrify timing.
 */
export class PositionalTagPhase extends Phase {
  public readonly phaseName = "PositionalTagPhase";

  public override start(): void {
    globalScene.arena.positionalTagManager.activateAllTags();
    super.end();
    return;
  }
}
