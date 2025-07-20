// biome-ignore-start lint/correctness/noUnusedImports: TSDoc
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { allMoves } from "#data/data-lists";
import type { BattlerIndex } from "#enums/battler-index";
import type { MoveId } from "#enums/move-id";
import { MoveUseMode } from "#enums/move-use-mode";
import { PositionalTagLapseType } from "#enums/positional-tag-lapse-type";
import { PositionalTagType } from "#enums/positional-tag-type";
import type { Constructor } from "#utils/common";
import i18next from "i18next";

/**
 * Serialized representation of a {@linkcode PositionalTag}.
 */
export interface SerializedPositionalTag {
  /**
   * This tag's {@linkcode PositionalTagType | type}.
   * Tags with similar types are considered "the same" for the purposes of overlaps.
   */
  tagType: PositionalTagType;
  /**
   * The {@linkcode Pokemon.id | PID} of the {@linkcode Pokemon} having created the effect.
   */
  sourceId: number;
  /**
   * The {@linkcode MoveId} that created this effect.
   */
  sourceMove: MoveId;
  /**
   * The number of turns remaining until activation.
   * Decremented by 1 at the end of each turn until reaching 0, at which point it will {@linkcode trigger} and be removed.
   * If set to any number `<0` manually, will be silently removed at the end of the next turn without activating.
   */
  turnCount: number;
  /**
   * The {@linkcode BattlerIndex} of the Pokemon targeted by the effect.
   */
  targetIndex: BattlerIndex;
}

/**
 * A {@linkcode PositionalTag} is a variant of an {@linkcode ArenaTag} that targets a single *slot* of the battlefield.
 * Each tag can last one or more turns, triggering various effects on removal.
 * Multiple tags of the same kind can stack with one another, provided they are affecting different targets.
 */
export abstract class PositionalTag implements SerializedPositionalTag {
  /**
   * This tag's {@linkcode PositionalTagType | type}.
   */
  public abstract tagType: PositionalTagType;
  public abstract lapseType: PositionalTagLapseType;
  public abstract sourceId: number;

  // These have to be public to implement the interface, but are functionally private.
  constructor(
    public sourceId: number,
    public sourceMove: MoveId,
    public turnCount: number,
    public targetIndex: BattlerIndex,
  ) {}

  /** Trigger this tag's effects prior to removal. */
  public abstract trigger(): void;

  /**
   * Check whether this tag should be removed without triggering.
   * @returns Whether this tag should disappear.
   * By default, requires that the attack's turn count is less than or equal to 0.
   */
  abstract shouldDisappear(): boolean;

  /**
   * Check whether this {@linkcode PositionalTag} would overlap with another one.
   * @param targetIndex - The {@linkcode BattlerIndex} being targeted
   * @param sourceMove - The {@linkcode MoveId} causing the attack
   * @returns Whether this tag would overlap with a newly created one.
   */
  public overlapsWith(targetIndex: BattlerIndex, _sourceMove: MoveId): boolean {
    return this.targetIndex === targetIndex;
  }
}

/**
 * Tag to manage execution of delayed attacks, such as {@linkcode MoveId.FUTURE_SIGHT} or {@linkcode MoveId.DOOM_DESIRE}.
 * Delayed attacks do nothing for the first several turns after use (including the turn the move is used),
 * triggering against a certain slot after the turn count has elapsed.
 */
export class DelayedAttackTag extends PositionalTag {
  public override tagType = PositionalTagType.DELAYED_ATTACK;
  public override lapseType = PositionalTagLapseType.TURN_END;

  override trigger(): void {
    const source = globalScene.getPokemonById(this.sourceId)!;
    const target = globalScene.getField()[this.targetIndex];

    source.turnData.extraTurns++;
    globalScene.phaseManager.queueMessage(
      i18next.t("moveTriggers:tookMoveAttack", {
        pokemonName: getPokemonNameWithAffix(target),
        moveName: allMoves[this.sourceMove].name,
      }),
    );

    globalScene.phaseManager.unshiftNew(
      "MoveEffectPhase",
      this.sourceId,
      [this.targetIndex],
      allMoves[this.sourceMove],
      MoveUseMode.TRANSPARENT,
    );
  }

  override shouldDisappear(): boolean {
    const source = globalScene.getPokemonById(this.sourceId);
    const target = globalScene.getField()[this.targetIndex];
    // Silently disappear if either source or target are missing or happen to be the same pokemon
    // (i.e. targeting oneself)
    return !source || !target || source === target || target.isFainted();
  }
}

/**
 * Add a new {@linkcode PositionalTag} to the arena.
 * @param tag - The {@linkcode SerializedPositionalTag} corresponding to the tag being added
 * @remarks
 * This function does not perform any checking if the added tag is valid.
 */
export function loadPositionalTag(
  tag: SerializedPositionalTag,
): InstanceType<(typeof positionalTagConstructorMap)[(typeof tag)["tagType"]]>;
/**
 * Add a new {@linkcode PositionalTag} to the arena.
 * @param tagType - The {@linkcode PositionalTagType} to create
 * @param sourceId - The {@linkcode Pokemon.id | PID} of the Pokemon adding the tag
 * @param sourceMove - The {@linkcode MoveId} causing the attack
 * @param turnCount - The number of turns to delay the effect (_including the current turn_).
 * @param targetIndex - The {@linkcode BattlerIndex} being targeted
 * @remarks
 * This function does not perform any checking if the added tag is valid.
 */
export function loadPositionalTag<T extends PositionalTagType>({
  tagType,
  sourceId,
  sourceMove,
  turnCount,
  targetIndex,
}: {
  tagType: T;
  sourceId: number;
  sourceMove: MoveId;
  turnCount: number;
  targetIndex: BattlerIndex;
}): tagInstanceMap[T];
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
export function loadPositionalTag({
  tagType,
  sourceId,
  sourceMove,
  turnCount,
  targetIndex,
}: SerializedPositionalTag): PositionalTag {
  const tagClass = positionalTagConstructorMap[tagType];
  return new tagClass(sourceId, sourceMove, turnCount, targetIndex);
}

/** Const object mapping tag types to their constructors. */
const positionalTagConstructorMap = {
  [PositionalTagType.DELAYED_ATTACK]: DelayedAttackTag,
} satisfies Record<PositionalTagType, Constructor<PositionalTag>>;

/** Type mapping {@linkcode PositionalTagType}s to instances of their corresponding {@linkcode PositionalTag}s. */
export type tagInstanceMap = {
  [k in keyof typeof positionalTagConstructorMap]: InstanceType<(typeof positionalTagConstructorMap)[k]>;
};
