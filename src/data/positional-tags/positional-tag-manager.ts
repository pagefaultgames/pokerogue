import { loadPositionalTag } from "#data/positional-tags/load-positional-tag";
import type { PositionalTag } from "#data/positional-tags/positional-tag";
import type { BattlerIndex } from "#enums/battler-index";
import type { PositionalTagType } from "#enums/positional-tag-type";

/** A manager for the {@linkcode PositionalTag}s in the arena. */
export class PositionalTagManager {
  /**
   * Array containing all pending unactivated {@linkcode PositionalTag}s,
   * sorted by order of creation (oldest first).
   */
  public tags: PositionalTag[] = [];

  /**
   * Add a new {@linkcode PositionalTag} to the arena.
   * @remarks
   * This function does not perform any checking if the added tag is valid.
   */
  public addTag<T extends PositionalTagType = never>(tag: Parameters<typeof loadPositionalTag<T>>[0]): void {
    this.tags.push(loadPositionalTag(tag));
  }

  /**
   * Check whether a new {@linkcode PositionalTag} can be added to the battlefield.
   * @param tagType - The {@linkcode PositionalTagType} being created
   * @param targetIndex - The {@linkcode BattlerIndex} being targeted
   * @returns Whether the tag can be added.
   */
  public canAddTag(tagType: PositionalTagType, targetIndex: BattlerIndex): boolean {
    return !this.tags.some(t => t.tagType === tagType && t.targetIndex === targetIndex);
  }

  /**
   * Decrement turn counts of and trigger all pending {@linkcode PositionalTag}s on field.
   * @remarks
   * If multiple tags trigger simultaneously, they will activate in order of **initial creation**, regardless of current speed order.
   * (Source: [Smogon](<https://www.smogon.com/forums/threads/sword-shield-battle-mechanics-research.3655528/page-64#post-9244179>))
   */
  public activateAllTags(): void {
    const leftoverTags: PositionalTag[] = [];
    for (const tag of this.tags) {
      // Check for silent removal, immediately removing invalid tags.
      if (--tag.turnCount > 0) {
        // tag still cooking
        leftoverTags.push(tag);
        continue;
      }

      if (tag.shouldTrigger()) {
        tag.trigger();
      }
    }
    this.tags = leftoverTags;
  }
}
