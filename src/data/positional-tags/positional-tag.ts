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
 * Does not contain the `tagType` parameter (which is used to select the proper class constructor to use).
 */
export interface PositionalTagBaseArgs {
  /**
   * The number of turns remaining until activation. \
   * Decremented by 1 at the end of each turn until reaching 0, at which point it will {@linkcode trigger} and be removed.
   * @remarks
   * If this is set to any number `<0` manually (such as through the effects of {@linkcode PositionalTag.shouldDisappear | shouldDisappear}),
   * this tag will be silently removed at the end of the next turn _without activating any effects_.
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
export abstract class PositionalTag implements PositionalTagBaseArgs {
  public abstract readonly tagType: PositionalTagType;
  // These arguments have to be public to implement the interface, but are functionally private.
  public turnCount: number;
  public targetIndex: BattlerIndex;

  constructor({ turnCount, targetIndex }: PositionalTagBaseArgs) {
    this.turnCount = turnCount;
    this.targetIndex = targetIndex;
  }

  /** Trigger this tag's effects prior to removal. */
  public abstract trigger(): void;

  /**
   * Check whether this tag should be removed without calling {@linkcode trigger} and triggering effects.
   * @returns Whether this tag should disappear without triggering.
   */
  abstract shouldDisappear(): boolean;

  protected getTarget(): Pokemon | undefined {
    return globalScene.getField()[this.targetIndex];
  }
}

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
  public sourceMove: MoveId;
  public sourceId: number;

  constructor({ sourceId, turnCount, targetIndex, sourceMove }: DelayedAttackArgs) {
    super({ turnCount, targetIndex });
    this.sourceId = sourceId;
    this.sourceMove = sourceMove;
  }

  override trigger(): void {
    // Bangs are justified as the `shouldDisappear` method will queue the tag for removal if the source or target leave the field
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
      MoveUseMode.TRANSPARENT,
    );
  }

  override shouldDisappear(): boolean {
    const source = globalScene.getPokemonById(this.sourceId);
    const target = this.getTarget();
    // Silently disappear if either source or target are missing or happen to be the same pokemon
    // (i.e. targeting oneself)
    return !source || !target || source === target || target.isFainted();
  }
}

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

  readonly pokemonName: string;

  public healHp: number;
  constructor({ turnCount, targetIndex, healHp, pokemonName }: WishArgs) {
    super({ turnCount, targetIndex });
    this.healHp = healHp;
    this.pokemonName = pokemonName;
  }

  public trigger(): void {
    // TODO: Rename this locales key - wish shows a message on REMOVAL, not addition
    globalScene.phaseManager.queueMessage(
      i18next.t("arenaTag:wishTagOnAdd", {
        pokemonNameWithAffix: this.pokemonName,
      }),
    );

    globalScene.phaseManager.unshiftNew("PokemonHealPhase", this.targetIndex, this.healHp, null, true, false);
  }

  public shouldDisappear(): boolean {
    // Disappear if no target or target is fainted.
    // The source need not exist at the time of activation (since all we need is a simple message)
    // TODO: Verify whether Wish shows a message if the Pokemon it would affect is KO'd on the turn of activation
    const target = this.getTarget();
    return !target || target.isFainted();
  }
}
