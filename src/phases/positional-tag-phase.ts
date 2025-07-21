import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
// biome-ignore-start lint/correctness/noUnusedImports: TSDocs
import type { PositionalTag } from "#data/positional-tags/positional-tag";
import type { TurnEndPhase } from "#phases/turn-end-phase";
// biome-ignore-end lint/correctness/noUnusedImports: TSDocs

/**
 * Phase to trigger all pending post-turn {@linkcode PositionalTag}s.
 * Occurs before {@linkcode TurnEndPhase} to allow for proper electrify timing.
 */
export class PositionalTagPhase extends Phase {
  public readonly phaseName = "PositionalTagPhase";

  public override start(): void {
    globalScene.arena.positionalTagManager.triggerAllTags();
    super.end();
    return;
  }
}
