import {
  loadPositionalTag,
  type PositionalTag,
  type SerializedPositionalTag,
} from "#data/positional-tags/positional-tag";
import type { BattlerIndex } from "#enums/battler-index";
import type { MoveId } from "#enums/move-id";
import type { PositionalTagType } from "#enums/positional-tag-type";

/** A manager for the {@linkcode PositionalTag}s in the arena. */
export class PositionalTagManager {
  /** Array containing all pending unactivated {@linkcode PositionalTag}s, sorted by order of creation. */
  private tags: PositionalTag[] = [];

  /**
   * Add a new {@linkcode SerializedPositionalTag} to the arena.
   * @param tagType - The {@linkcode PositionalTagType} to create
   * @param sourceId - The {@linkcode Pokemon.id | PID} of the Pokemon adding the tag
   * @param sourceMove - The {@linkcode MoveId} causing the attack
   * @param turnCount - The number of turns to delay the effect (_including the current turn_).
   * @param targetIndex - The {@linkcode BattlerIndex} being targeted
   * @remarks
   * This function does not perform any checking if the added tag is valid.
   */
  public addTag(tag: SerializedPositionalTag): void {
    this.tags.push(loadPositionalTag(tag));
  }

  /**
   * Check whether a new {@linkcode PositionalTag} can be added to the battlefield.
   * @param tagType - The {@linkcode PositionalTagType} being created
   * @param targetIndex - The {@linkcode BattlerIndex} being targeted
   * @param sourceMove - The {@linkcode MoveId} causing the attack
   * @returns Whether the tag can be added.
   */
  public canAddTag(tagType: PositionalTagType, targetIndex: BattlerIndex, sourceMove: MoveId): boolean {
    return !this.tags.some(t => t.tagType === tagType && t.overlapsWith(targetIndex, sourceMove));
  }

  /**
   * Decrement turn counts of and activate all pending {@linkcode PositionalTag}s on field.
   * @remarks
   * If multiple tags trigger simultaneously, they will activate **in order of initial creation**.
   * (source: [Smogon](<https://www.smogon.com/forums/threads/sword-shield-battle-mechanics-research.3655528/page-64#post-9244179>))
   */
  triggerAllTags(): void {
    for (const tag of this.tags) {
      if (--tag.turnCount > 0) {
        // tag still cooking
        continue;
      }

      // Check for silent removal
      if (tag.shouldDisappear()) {
        tag.turnCount = -1;
      }

      tag.trigger();
    }
  }
}
