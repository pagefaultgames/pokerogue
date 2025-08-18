// biome-ignore lint/correctness/noUnusedImports: Used in a tsdoc comment
import type { GameMode } from "#app/game-mode";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { allMoves } from "#data/data-lists";
import { ArenaTagType } from "#enums/arena-tag-type";
import { Command } from "#enums/command";
import { MoveCategory } from "#enums/move-category";
import type { Pokemon } from "#field/pokemon";
import type { Move, MoveConditionFunc, UserMoveConditionFunc } from "#moves/move";
import i18next from "i18next";

/**
 * A condition that determines whether a move can be used successfully.
 *
 * @remarks
 * This is only checked when the move is attempted to be invoked. To prevent a move from being selected,
 * use a {@linkcode MoveRestriction} instead.
 */
export class MoveCondition {
  public declare readonly func: MoveConditionFunc;

  /**
   * @param func - A condition function that determines if the move can be used successfully
   */
  constructor(func?: MoveConditionFunc) {
    if (func) {
      this.func = func;
    }
  }

  apply(user: Pokemon, target: Pokemon, move: Move): boolean {
    return this.func(user, target, move);
  }

  getUserBenefitScore(_user: Pokemon, _target: Pokemon, _move: Move): number {
    return 0;
  }
}
/**
 * Condition to allow a move's use only on the first turn this Pokemon is sent into battle
 * (or the start of a new wave, whichever comes first).
 */

export class FirstMoveCondition extends MoveCondition {
  public override readonly func: MoveConditionFunc = user => {
    return user.tempSummonData.waveTurnCount === 1;
  };

  // TODO: Update AI move selection logic to not require this method at all
  // Currently, it is used to avoid having the AI select the move if its condition will fail
  getUserBenefitScore(user: Pokemon, _target: Pokemon, _move: Move): number {
    return this.apply(user, _target, _move) ? 10 : -20;
  }
}

/**
 * Condition that forces moves to fail against the final boss in classic and the major boss in endless
 * @remarks
 * ⚠️ Only works reliably for single-target moves as only one target is provided; should not be used for multi-target moves
 * @see {@linkcode GameMode.isBattleClassicFinalBoss}
 * @see {@linkcode GameMode.isEndlessMinorBoss}
 */
export const failAgainstFinalBossCondition = new MoveCondition((_user, target) => {
  const gameMode = globalScene.gameMode;
  const currentWave = globalScene.currentBattle.waveIndex;
  return (
    target.isEnemy() && (gameMode.isBattleClassicFinalBoss(currentWave) || gameMode.isEndlessMinorBoss(currentWave))
  );
});

/**
 * Condition used by the move {@link https://bulbapedia.bulbagarden.net/wiki/Upper_Hand_(move) | Upper Hand}.
 * Moves with this condition are only successful when the target has selected
 * a high-priority attack (after factoring in priority-boosting effects) and
 * hasn't moved yet this turn.
 */
export const UpperHandCondition = new MoveCondition((_user, target) => {
  const targetCommand = globalScene.currentBattle.turnCommands[target.getBattlerIndex()];
  return (
    targetCommand?.command === Command.FIGHT &&
    !target.turnData.acted &&
    !!targetCommand.move?.move &&
    allMoves[targetCommand.move.move].category !== MoveCategory.STATUS &&
    allMoves[targetCommand.move.move].getPriority(target) > 0
  );
});

/**
 * A restriction that prevents a move from being selected
 *
 * @remarks
 * Only checked when the move is selected, but not when it is attempted to be invoked. To prevent a move from being used,
 * use a {@linkcode MoveCondition} instead.
 */
export class MoveRestriction {
  public declare readonly func: UserMoveConditionFunc;
  public declare readonly i18nkey: string;
  constructor(func: UserMoveConditionFunc, i18nkey = "battle:moveRestricted") {
    this.func = func;
    this.i18nkey = i18nkey;
  }

  /**
   * @param user - The Pokemon attempting to select the move
   * @param move - The move being selected
   * @returns Whether the move is restricted for the user.
   */
  apply(user: Pokemon, move: Move): boolean {
    return this.func(user, move);
  }

  public getSelectionDeniedText(user: Pokemon, move: Move): string {
    // While not all restriction texts use all the parameters, passing extra ones is harmless
    return i18next.t(this.i18nkey, { pokemonNameWithAffix: getPokemonNameWithAffix(user), moveName: move.name });
  }
}

/**
 * Prevents a Pokemon from using the move if it was the last move it used
 *
 * @remarks
 * Used by {@link https://bulbapedia.bulbagarden.net/wiki/Blood_Moon_(move) | Blood Moon} and {@link https://bulbapedia.bulbagarden.net/wiki/Gigaton_Hammer_(move) | Gigaton Hammer}
 */
export const ConsecutiveUseRestriction = new MoveRestriction(
  (user, move) => user.getLastXMoves(1)[0]?.move === move.id,
  "battle:moveDisabledConsecutive",
);

/** Prevents a move from being selected if Gravity is in effect */
export const GravityUseRestriction = new MoveRestriction(
  () => globalScene.arena.hasTag(ArenaTagType.GRAVITY),
  "battle:moveDisabledGravity",
);
