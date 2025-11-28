import { allMoves } from "#data/data-lists";
import type { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveCategory, type MoveDamageCategory } from "#enums/move-category";
import type { MoveId } from "#enums/move-id";
import { MoveTarget } from "#enums/move-target";
import { PokemonType } from "#enums/pokemon-type";
import type { Pokemon } from "#field/pokemon";
import { applyMoveAttrs } from "#moves/apply-attrs";
import type { Move, MoveTargetSet, UserMoveConditionFunc } from "#moves/move";
import { NumberHolder } from "#utils/common";
import { areAllies } from "#utils/pokemon-utils";

/**
 * Return whether the move targets the field
 *
 * Examples include
 * - Hazard moves like spikes
 * - Weather moves like rain dance
 * - User side moves like reflect and safeguard
 */
export function isFieldTargeted(move: Move): boolean {
  switch (move.moveTarget) {
    case MoveTarget.BOTH_SIDES:
    case MoveTarget.USER_SIDE:
    case MoveTarget.ENEMY_SIDE:
      return true;
  }
  return false;
}

/**
 * Determine whether a move is a spread move.
 *
 * @param move - The {@linkcode Move} to check
 * @returns Whether {@linkcode move} is spread-targeted.
 * @remarks
 * Examples include:
 * - Moves targeting all adjacent Pokemon (like Surf)
 * - Moves targeting all adjacent enemies (like Air Cutter)
 */

export function isSpreadMove(move: Move): boolean {
  switch (move.moveTarget) {
    case MoveTarget.ALL_ENEMIES:
    case MoveTarget.ALL_NEAR_ENEMIES:
    case MoveTarget.ALL_OTHERS:
    case MoveTarget.ALL_NEAR_OTHERS:
      return true;
  }
  return false;
}

export function getMoveTargets(user: Pokemon, move: MoveId, replaceTarget?: MoveTarget): MoveTargetSet {
  const variableTarget = new NumberHolder(0);
  user.getOpponents(false).forEach(p => applyMoveAttrs("VariableTargetAttr", user, p, allMoves[move], variableTarget));

  let moveTarget: MoveTarget | undefined;
  if (allMoves[move].hasAttr("VariableTargetAttr")) {
    moveTarget = variableTarget.value;
  } else if (replaceTarget !== undefined) {
    moveTarget = replaceTarget;
  } else if (move) {
    moveTarget = allMoves[move].moveTarget;
  } else if (move === undefined) {
    moveTarget = MoveTarget.NEAR_ENEMY;
  }
  const opponents = user.getOpponents(false);

  let set: Pokemon[] = [];
  let multiple = false;
  const ally: Pokemon | undefined = user.getAlly();

  switch (moveTarget) {
    case MoveTarget.USER:
    case MoveTarget.PARTY:
      set = [user];
      break;
    case MoveTarget.NEAR_OTHER:
    case MoveTarget.OTHER:
    case MoveTarget.ALL_NEAR_OTHERS:
    case MoveTarget.ALL_OTHERS:
      set = ally != null ? opponents.concat([ally]) : opponents;
      multiple = moveTarget === MoveTarget.ALL_NEAR_OTHERS || moveTarget === MoveTarget.ALL_OTHERS;
      break;
    case MoveTarget.NEAR_ENEMY:
    case MoveTarget.ALL_NEAR_ENEMIES:
    case MoveTarget.ALL_ENEMIES:
    case MoveTarget.ENEMY_SIDE:
      set = opponents;
      multiple = moveTarget !== MoveTarget.NEAR_ENEMY;
      break;
    case MoveTarget.RANDOM_NEAR_ENEMY:
      set = [opponents[user.randBattleSeedInt(opponents.length)]];
      break;
    case MoveTarget.ATTACKER:
      return { targets: [-1 as BattlerIndex], multiple: false };
    case MoveTarget.NEAR_ALLY:
    case MoveTarget.ALLY:
      set = ally != null ? [ally] : [];
      break;
    case MoveTarget.USER_OR_NEAR_ALLY:
    case MoveTarget.USER_AND_ALLIES:
    case MoveTarget.USER_SIDE:
      set = ally != null ? [user, ally] : [user];
      multiple = moveTarget !== MoveTarget.USER_OR_NEAR_ALLY;
      break;
    case MoveTarget.ALL:
    case MoveTarget.BOTH_SIDES:
      set = (ally != null ? [user, ally] : [user]).concat(opponents);
      multiple = true;
      break;
    case MoveTarget.CURSE:
      {
        const extraTargets = ally != null ? [ally] : [];
        set = user.getTypes(true).includes(PokemonType.GHOST) ? opponents.concat(extraTargets) : [user];
      }
      break;
  }

  return {
    targets: set
      .filter(p => p?.isActive(true))
      .map(p => p.getBattlerIndex())
      .filter(t => t !== undefined),
    multiple,
  };
}

export const frenzyMissFunc: UserMoveConditionFunc = (user: Pokemon, move: Move) => {
  while (user.getMoveQueue().length > 0 && user.getMoveQueue()[0].move === move.id) {
    user.getMoveQueue().shift();
  }
  user.removeTag(BattlerTagType.FRENZY); // FRENZY tag should be disrupted on miss/no effect

  return true;
};

/**
 * Determine the target for the `user`'s counter-attack move
 * @param user - The pokemon using the counter-like move
 * @param damageCategory - The category of move to counter (physical or special), or `undefined` to counter both
 * @returns - The battler index of the most recent, non-ally attacker using a move that matches the specified category, or `null` if no such attacker exists
 */
export function getCounterAttackTarget(user: Pokemon, damageCategory?: MoveDamageCategory): BattlerIndex | null {
  for (const attackRecord of user.turnData.attacksReceived) {
    // check if the attacker was an ally
    const moveCategory = allMoves[attackRecord.move].category;
    const sourceBattlerIndex = attackRecord.sourceBattlerIndex;
    if (
      moveCategory !== MoveCategory.STATUS
      && !areAllies(sourceBattlerIndex, user.getBattlerIndex())
      && (damageCategory === undefined || moveCategory === damageCategory)
    ) {
      return sourceBattlerIndex;
    }
  }
  return null;
}
