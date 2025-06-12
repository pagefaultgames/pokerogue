import type Pokemon from "#app/field/pokemon";
import type { BattlerIndex } from "#enums/battler-index";
import type { MoveId } from "#enums/move-id";
import type { MoveTargetSet, UserMoveConditionFunc } from "./move";
import type Move from "./move";
import { NumberHolder, isNullOrUndefined } from "#app/utils/common";
import { MoveTarget } from "#enums/MoveTarget";
import { PokemonType } from "#enums/pokemon-type";
import { allMoves } from "#app/data/data-lists";
import { applyMoveAttrs } from "./apply-attrs";
import { BattlerTagType } from "#enums/battler-tag-type";

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
      set = !isNullOrUndefined(ally) ? opponents.concat([ally]) : opponents;
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
      set = !isNullOrUndefined(ally) ? [ally] : [];
      break;
    case MoveTarget.USER_OR_NEAR_ALLY:
    case MoveTarget.USER_AND_ALLIES:
    case MoveTarget.USER_SIDE:
      set = !isNullOrUndefined(ally) ? [user, ally] : [user];
      multiple = moveTarget !== MoveTarget.USER_OR_NEAR_ALLY;
      break;
    case MoveTarget.ALL:
    case MoveTarget.BOTH_SIDES:
      set = (!isNullOrUndefined(ally) ? [user, ally] : [user]).concat(opponents);
      multiple = true;
      break;
    case MoveTarget.CURSE:
      {
        const extraTargets = !isNullOrUndefined(ally) ? [ally] : [];
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
  while (user.getMoveQueue().length && user.getMoveQueue()[0].move === move.id) {
    user.getMoveQueue().shift();
  }
  user.removeTag(BattlerTagType.FRENZY); // FRENZY tag should be disrupted on miss/no effect

  return true;
};
