// biome-ignore lint/correctness/noUnusedImports: Used in a TSDoc comment
import type { GameMode } from "#app/game-mode";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { TrappedTag } from "#data/battler-tags";
import { allMoves } from "#data/data-lists";
import { ArenaTagType } from "#enums/arena-tag-type";
import { Command } from "#enums/command";
import { MoveCategory, type MoveDamageCategory } from "#enums/move-category";
import type { MoveId } from "#enums/move-id";
import { isVirtual } from "#enums/move-use-mode";
import { PokemonType } from "#enums/pokemon-type";
import type { Pokemon } from "#field/pokemon";
import type { Move, MoveConditionFunc, UserMoveConditionFunc } from "#moves/move";
import { getCounterAttackTarget } from "#moves/move-utils";
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
  constructor(func: MoveConditionFunc) {
    this.func = func;
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
  constructor() {
    super(user => user.tempSummonData.waveTurnCount === 1);
  }

  // TODO: Update AI move selection logic to not require this method at all
  // Currently, it is used to avoid having the AI select the move if its condition will fail
  getUserBenefitScore(user: Pokemon, _target: Pokemon, _move: Move): number {
    return this.apply(user, _target, _move) ? 10 : -20;
  }
}

/**
 * Condition that fails the move if the user has less than 1/x of their max HP.
 * @remarks
 * Used by Clangorous Soul and Fillet Away
 *
 * NOT used by Belly Drum, whose failure check occurs in phase 4 along with its stat increase condition
 */
export class FailIfInsufficientHpCondition extends MoveCondition {
  /**
   * Condition that fails the move if the user has less than 1/x of their max HP.
   * @param ratio - The required HP ratio (the `x` in `1/x`)
   */
  constructor(cutRatio: number) {
    super(user => user.getHpRatio() > 1 / cutRatio);
  }
}

/**
 * Teleport condition checks
 *
 * @remarks
 * For trainer pokemon, just checks if there are any benched pokemon allowed in battle
 *
 * Wild pokemon cannot teleport if either:
 * - The current battle is a double battle
 * - They are under the effects of a *move-based* trapping effect like and are neither a ghost type nor have an active run away ability
 */
export const failTeleportCondition = new MoveCondition(user => {
  if (user.hasTrainer()) {
    const party = user.isPlayer() ? globalScene.getPlayerParty() : globalScene.getEnemyParty();
    for (const pokemon of party) {
      if (!pokemon.isOnField() && pokemon.isAllowedInBattle()) {
        return true;
      }
    }
    return false;
  }

  // Wild pokemon

  // Cannot teleport in double battles (even if last remaining)
  if (globalScene.currentBattle.double) {
    return false;
  }
  // If smoke ball / shed tail items are ever added, checks for them should be placed here
  // If a conditional "run away" ability is ever added, then we should use the apply method instead of the `hasAbility`
  if (user.isOfType(PokemonType.GHOST, true, true) || user.hasAbilityWithAttr("RunSuccessAbAttr")) {
    return true;
  }

  // Wild pokemon are prevented from fleeing if they are trapped *specifically*
  if (globalScene.arena.hasTag(ArenaTagType.FAIRY_LOCK) || user.getTag(TrappedTag) !== undefined) {
    // Fairy Lock prevents teleporting
    return false;
  }

  return true;
});

/**
 * Condition that forces moves to fail if the target's selected move is not an attacking move
 *
 * @remarks
 * Used by Sucker Punch and Thunderclap
 */
export const failIfTargetNotAttackingCondition = new MoveCondition((_user, target) => {
  const turnCommand = globalScene.currentBattle.turnCommands[target.getBattlerIndex()];
  if (!turnCommand || !turnCommand.move) {
    return false;
  }
  return (
    turnCommand.command === Command.FIGHT
    && !target.turnData.acted
    && allMoves[turnCommand.move.move].category !== MoveCategory.STATUS
  );
});

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
  return !(
    target.isEnemy()
    && (gameMode.isBattleClassicFinalBoss(currentWave) || gameMode.isEndlessMinorBoss(currentWave))
  );
});

/**
 * Condition used by the move {@link https://bulbapedia.bulbagarden.net/wiki/Upper_Hand_(move) | Upper Hand}.
 * Moves with this condition are only successful when the target has selected
 * a high-priority attack (after factoring in priority-boosting effects) and
 * hasn't moved yet this turn.
 */
export const upperHandCondition = new MoveCondition((_user, target) => {
  const targetCommand = globalScene.currentBattle.turnCommands[target.getBattlerIndex()];
  return (
    targetCommand?.command === Command.FIGHT
    && !target.turnData.acted
    && !!targetCommand.move?.move
    && allMoves[targetCommand.move.move].category !== MoveCategory.STATUS
    && allMoves[targetCommand.move.move].getPriority(target) > 0
  );
});

/**
 * Condition used by the move {@link https://bulbapedia.bulbagarden.net/wiki/Last_Resort_(move) | Last Resort}
 *
 * @remarks
 * Last resort fails if
 * - It is not in the user's moveset
 * - The user does not know at least one other move
 * - The user has not directly used each other move in its moveset since it was sent into battle
 *   - A move is considered *used* for this purpose if it passed the first failure check sequence in the move phase
 *    (i.e. its usage message was displayed)
 */
export const lastResortCondition = new MoveCondition((user, _target, move) => {
  const otherMovesInMoveset = new Set<MoveId>(user.getMoveset().map(m => m.moveId));
  if (!otherMovesInMoveset.delete(move.id) || otherMovesInMoveset.size === 0) {
    return false; // Last resort fails if used when not in user's moveset or no other moves exist
  }

  const movesInHistory = new Set<MoveId>(
    user
      .getMoveHistory()
      .filter(m => !isVirtual(m.useMode)) // Last resort ignores virtual moves
      .map(m => m.move),
  );

  // Since `Set.intersection()` is only present in ESNext, we have to do this to check inclusion
  return [...otherMovesInMoveset].every(m => movesInHistory.has(m));
});

/**
 * Condition used by counter-like moves if the user was hit by at least one qualifying attack this turn.
 * Qualifying attacks are those that match the specified category (physical, special or either)
 * that did not come from an ally.
 */
class CounterAttackConditon extends MoveCondition {
  /**
   * @param damageCategory - The category of move to counter (physical or special), or `undefined` to counter both
   */
  constructor(damageCategory?: MoveDamageCategory) {
    super(user => getCounterAttackTarget(user, damageCategory) !== null);
  }
}

/** Condition check for counterattacks that proc againt physical moves */
export const counterAttackConditionPhysical = new CounterAttackConditon(MoveCategory.PHYSICAL);
/** Condition check for counterattacks that proc against special moves */
export const counterAttackConditionSpecial = new CounterAttackConditon(MoveCategory.SPECIAL);
/** Condition check for counterattacks that proc against moves regardless of damage type */
export const counterAttackConditionBoth = new CounterAttackConditon();

/**
 * A restriction that prevents a move from being selected
 *
 * @remarks
 * Only checked when the move is selected, but not when it is attempted to be invoked. To prevent a move from being used,
 * use a {@linkcode MoveCondition} instead.
 */
export class MoveRestriction {
  public readonly func: UserMoveConditionFunc;
  public readonly i18nkey: string;
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
export const consecutiveUseRestriction = new MoveRestriction(
  (user, move) => user.getLastXMoves(1)[0]?.move === move.id,
  "battle:moveDisabledConsecutive",
);

/** Prevents a move from being selected if Gravity is in effect */
export const gravityUseRestriction = new MoveRestriction(
  () => globalScene.arena.hasTag(ArenaTagType.GRAVITY),
  "battle:moveDisabledGravity",
);
