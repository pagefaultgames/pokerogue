import { initMoveAnim, loadMoveAnimAssets } from "#data/battle-anims";
import type { MoveId } from "#enums/move-id";

/**
 * Asynchronously load the animations and assets for the provided moves.
 * @param moveIds - An array of move IDs to load assets for.
 */
export async function loadMoveAnimations(moveIds: MoveId[]): Promise<void> {
  await Promise.allSettled(moveIds.map(m => initMoveAnim(m)));
  await loadMoveAnimAssets(moveIds);
}
