import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
// biome-ignore-start lint/correctness/noUnusedImports: TSDoc
import type { ArenaTag } from "#data/arena-tag";
// biome-ignore-end lint/correctness/noUnusedImports: TSDoc
import { allMoves } from "#data/data-lists";
import type { BattlerIndex } from "#enums/battler-index";
import type { MoveId } from "#enums/move-id";
import { MoveUseMode } from "#enums/move-use-mode";
import { PositionalTagType } from "#enums/positional-tag-type";
import type { Pokemon } from "#field/pokemon";
import i18next from "i18next";

/**
 * Baseline arguments used to construct all {@linkcode PositionalTag}s,
 * the contents of which are serialized and used to construct new tags. \
 * Does not contain the `tagType` parameter (which is used to select the proper class constructor during tag loading).
 * @privateRemarks
 * All {@linkcode PositionalTag}s are intended to implement a sub-interface of this containing their respective parameters,
 * and should refrain from adding extra serializable fields not contained in said interface.
 * This ensures that all tags truly "become" their respective interfaces when converted to and from JSON.
 */
export interface PositionalTagBaseArgs {
  /**
   * The number of turns remaining until this tag's activation. \
   * Decremented by 1 at the end of each turn until reaching 0, at which point it will
   * {@linkcode PositionalTag.trigger | trigger} the tag's effects and be removed.
   */
  turnCount: number;
  /**
   * The {@linkcode BattlerIndex} targeted by this effect.
   */
  targetIndex: BattlerIndex;
}

/**
 * A {@linkcode PositionalTag} is a variant of an {@linkcode ArenaTag} that targets a single *slot* of the battlefield.
 * Each tag can last one or more turns, triggering various effects on removal.
 * Multiple tags of the same kind can stack with one another, provided they are affecting different targets.
 */
export abstract class PositionalTag implements PositionalTagBaseArgs {
  /** This tag's {@linkcode PositionalTagType | type} */
  public abstract readonly tagType: PositionalTagType;
  // These arguments have to be public to implement the interface, but are functionally private
  // outside this and the tag manager.
  // Left undocumented to inherit doc comments from the interface
  public turnCount: number;
  public readonly targetIndex: BattlerIndex;

  constructor({ turnCount, targetIndex }: PositionalTagBaseArgs) {
    this.turnCount = turnCount;
    this.targetIndex = targetIndex;
  }

  /** Trigger this tag's effects prior to removal. */
  public abstract trigger(): void;

  /**
   * Check whether this tag should be allowed to {@linkcode trigger} and activate its effects
   * upon its duration elapsing.
   * @returns Whether this tag should be allowed to trigger prior to being removed.
   */
  public abstract shouldTrigger(): boolean;

  /**
   * Get the {@linkcode Pokemon} currently targeted by this tag.
   * @returns The {@linkcode Pokemon} located in this tag's target position, or `undefined` if none exist in it.
   */
  protected getTarget(): Pokemon | undefined {
    return globalScene.getField()[this.targetIndex];
  }
}

/** Interface containing additional properties used to construct a {@linkcode DelayedAttackTag}. */
interface DelayedAttackArgs extends PositionalTagBaseArgs {
  /**
   * The {@linkcode Pokemon.id | PID} of the {@linkcode Pokemon} having created this effect.
   */
  sourceId: number;
  /** The {@linkcode MoveId} that created this attack. */
  sourceMove: MoveId;
}

/**
 * Tag to manage execution of delayed attacks, such as {@linkcode MoveId.FUTURE_SIGHT} or {@linkcode MoveId.DOOM_DESIRE}. \
 * Delayed attacks do nothing for the first several turns after use (including the turn the move is used),
 * triggering against a certain slot after the turn count has elapsed.
 */
export class DelayedAttackTag extends PositionalTag implements DelayedAttackArgs {
  public override readonly tagType = PositionalTagType.DELAYED_ATTACK;
  public readonly sourceMove: MoveId;
  public readonly sourceId: number;

  constructor({ sourceId, turnCount, targetIndex, sourceMove }: DelayedAttackArgs) {
    super({ turnCount, targetIndex });
    this.sourceId = sourceId;
    this.sourceMove = sourceMove;
  }

  public override trigger(): void {
    // Bangs are justified as the `shouldTrigger` method will queue the tag for removal
    // if the source or target no longer exist
    const source = globalScene.getPokemonById(this.sourceId)!;
    const target = this.getTarget()!;

    source.turnData.extraTurns++;
    globalScene.phaseManager.queueMessage(
      i18next.t("moveTriggers:tookMoveAttack", {
        pokemonName: getPokemonNameWithAffix(target),
        moveName: allMoves[this.sourceMove].name,
      }),
    );

    globalScene.phaseManager.unshiftNew(
      "MoveEffectPhase",
      this.sourceId, // TODO: Find an alternate method of passing the source pokemon without a source ID
      [this.targetIndex],
      allMoves[this.sourceMove],
      MoveUseMode.DELAYED_ATTACK,
    );
  }

  public override shouldTrigger(): boolean {
    const source = globalScene.getPokemonById(this.sourceId);
    const target = this.getTarget();
    // Silently disappear if either source or target are missing or happen to be the same pokemon
    // (i.e. targeting oneself)
    // We also need to check for fainted targets as they don't technically leave the field until _after_ the turn ends
    // TODO: Figure out a way to store the target's offensive stat if they faint to allow pending attacks to persist
    // TODO: Remove the `?.scene` checks once battle anims are cleaned up - needed to avoid catch+release crash
    return !!source?.scene && !!target?.scene && source !== target && !target.isFainted();
  }
}

/** Interface containing arguments used to construct a {@linkcode WishTag}. */
interface WishArgs extends PositionalTagBaseArgs {
  /** The amount of {@linkcode Stat.HP | HP} to heal; set to 50% of the user's max HP during move usage. */
  healHp: number;
  /** The name of the {@linkcode Pokemon} having created the tag. */
  pokemonName: string;
}

/**
 * Tag to implement {@linkcode MoveId.WISH | Wish}.
 */
export class WishTag extends PositionalTag implements WishArgs {
  public override readonly tagType = PositionalTagType.WISH;

  public readonly pokemonName: string;
  public readonly healHp: number;

  constructor({ turnCount, targetIndex, healHp, pokemonName }: WishArgs) {
    super({ turnCount, targetIndex });
    this.healHp = healHp;
    this.pokemonName = pokemonName;
  }

  public override trigger(): void {
    // TODO: Rename this locales key - wish shows a message on REMOVAL, not addition
    globalScene.phaseManager.queueMessage(
      i18next.t("arenaTag:wishTagOnAdd", {
        pokemonNameWithAffix: this.pokemonName,
      }),
    );

    globalScene.phaseManager.unshiftNew("PokemonHealPhase", this.targetIndex, this.healHp, null, true, false);
  }

  public override shouldTrigger(): boolean {
    // Disappear if no target or target is fainted.
    // The source need not exist at the time of activation (since all we need is a simple message)
    // TODO: Verify whether Wish shows a message if the Pokemon it would affect is KO'd on the turn of activation
    const target = this.getTarget();
    return !!target && !target.isFainted();
  }
}
