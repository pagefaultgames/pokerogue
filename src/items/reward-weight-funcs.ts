import { globalScene } from "#app/global-scene";
import { allTrainerItems } from "#data/data-lists";
import { MAX_PER_TYPE_POKEBALLS } from "#data/pokeball";
import { AbilityId } from "#enums/ability-id";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import type { PokeballType } from "#enums/pokeball";
import type { StatusEffect } from "#enums/status-effect";
import type { TrainerItemId } from "#enums/trainer-item-id";
import type { Pokemon } from "#field/pokemon";
import type { RewardWeightFunc } from "#types/rewards";

// #region Party funcs

/**
 * Returns the number of party members have a non-volatile status condition in need of healing (i.e. not from an orb).
 * @returns The number of statused party members
 */
export function getStatusedPartyMemberCount(party: readonly Pokemon[]): number {
  return party.filter(p => p.hp && !!p.status && !p.hasStatusFromOrb()).length;
}

/**
 * Check if the player has max of a given ball type in Classic
 * @param ballType - The {@linkcode PokeballType} being checked
 * @returns Whether the player has the maximum of a given ball type
 *
 * @remarks
 * This function checks against `isEndless` because it would be very easy in Endless
 * to intentionally collect 99 of a ball to remove it from the pool.
 */
export function hasMaximumBalls(ballType: PokeballType): boolean {
  return !globalScene.gameMode.isEndless && globalScene.pokeballCounts[ballType] >= MAX_PER_TYPE_POKEBALLS;
}

// #endregion Party funcs

// #region Wave / mode based weights

/**
 * High order function that returns a {@linkcode RewardWeightFunc} that will only be applied on
 * classic and skip a Reward if current wave is greater or equal to the one passed down
 * @param wave - Wave where we should stop showing the reward
 * @param defaultWeight - Reward default weight
 * @returns A {@linkcode RewardWeightFunc}
 */
export function skipInClassicAfterWave(wave: number, defaultWeight: number): RewardWeightFunc {
  return () => {
    const gameMode = globalScene.gameMode;
    const currentWave = globalScene.currentBattle.waveIndex;
    return gameMode.isClassic && currentWave >= wave ? 0 : defaultWeight;
  };
}

/**
 * High order function that returns a {@linkcode RewardWeightFunc} that will only be applied on
 * classic and it will skip a Reward if it is the last wave pull.
 * @param defaultWeight - Reward default weight
 * @returns A {@linkcode RewardWeightFunc}
 */
export function skipInLastClassicWaveOrDefault(defaultWeight: number): RewardWeightFunc {
  return skipInClassicAfterWave(199, defaultWeight);
}

/**
 * Gets a function yielding a weight that grows with the wave index in discrete steps:
 * `min(ceil(wave / waveDivisor), maxSteps) * weightPerStep`.
 * @param waveDivisor - The number of waves per step
 * @param maxSteps - The maximum number of steps
 * @param weightPerStep - The weight contributed by each step
 * @returns A {@linkcode RewardWeightFunc}
 */
export function waveScaledWeightFunc(waveDivisor: number, maxSteps: number, weightPerStep: number): RewardWeightFunc {
  return () => Math.min(Math.ceil(globalScene.currentBattle.waveIndex / waveDivisor), maxSteps) * weightPerStep;
}

/**
 * Gets a function yielding `weight` unless the player already holds the maximum amount of the given ball type.
 * @param ballType - The {@linkcode PokeballType} granted by the reward
 * @param weight - The weight when the ball can still be obtained
 * @returns A {@linkcode RewardWeightFunc}
 */
export function pokeballWeightFunc(ballType: PokeballType, weight: number): RewardWeightFunc {
  return () => (hasMaximumBalls(ballType) ? 0 : weight);
}

/**
 * High order function that returns a {@linkcode RewardWeightFunc} to ensure Lures don't spawn on Classic 199
 * or if the lure still has over 60% of its duration left
 * @param lureId - The id of the lure type in question.
 * @param weight - The desired weight for the lure when it does spawn
 * @returns A {@linkcode RewardWeightFunc}
 */
export function lureWeightFunc(lureId: TrainerItemId, weight: number): RewardWeightFunc {
  return () => {
    const lureCount = globalScene.trainerItems.getStack(lureId);
    return !(globalScene.gameMode.isClassic && globalScene.currentBattle.waveIndex === 199)
      && lureCount < allTrainerItems[lureId].maxStackCount * 0.6
      ? weight
      : 0;
  };
}

// #endregion Wave / mode based weights

// #region Party need based weights

/**
 * Gets a function to determine weights for Potion rewards based on party members' HP, with a max of `3 * baseWeight`. \
 * A party member is considered in need of this item if it's below both HP thresholds.
 * @param hpThreshold - The amount of HP the mon should be missing to be considered in need of a potion
 * @param hpRatioThreshold - The ratio of `current:max` HP under which the mon is considered in need of a potion
 * @param baseWeight - The standard weight of that potion, multiplied by up to 3 based on who needs it
 * @returns A {@linkcode RewardWeightFunc} which yields the reward's weight multiplied by the number of mons that need it
 */
export function potionWeightFunc(hpThreshold: number, hpRatioThreshold: number, baseWeight = 1): RewardWeightFunc {
  return () => {
    const party = globalScene.getPlayerParty();
    const thresholdPartyMemberCount = Math.min(
      party.filter(p => p.getInverseHp() >= hpThreshold && p.getHpRatio() <= hpRatioThreshold && !p.isFainted()).length,
      3,
    );
    return thresholdPartyMemberCount * baseWeight;
  };
}

/**
 * Gets a function to determine weights for Ether/Elixir rewards based on party members' PP, with a max of `3 * baseWeight`. \
 * A party member is considered in need of this item if it has a move with a PP of 5 or less, and less than half its max.
 * @param baseWeight - The weight of the reward
 * @returns A {@linkcode RewardWeightFunc} which yields the reward's weight multiplied by the number of mons that need it
 */
export function etherWeightFunc(baseWeight = 1): RewardWeightFunc {
  return () => {
    const party = globalScene.getPlayerParty();
    const thresholdPartyMemberCount = Math.min(
      party.filter(
        p =>
          p.hp
          && !p.heldItemManager.hasItem(HeldItemId.LEPPA_BERRY)
          && p
            .getMoveset()
            .some(m => m.ppUsed && m.getMovePp() - m.ppUsed <= 5 && m.ppUsed > Math.floor(m.getMovePp() / 2)),
      ).length,
      3,
    );
    return thresholdPartyMemberCount * baseWeight;
  };
}

/**
 * Gets a function to determine weights for Revive rewards based on number of fainted party members.
 * @param baseWeight - The weight to multiply by the amount of fainted party members
 * @returns A {@linkcode RewardWeightFunc} which yields the number of fainted party members times base weight
 */
export function reviveWeightFunc(baseWeight = 1): RewardWeightFunc {
  return () => {
    const party = globalScene.getPlayerParty();
    const faintedPartyMemberCount = Math.min(party.filter(p => p.isFainted()).length, 3);
    return faintedPartyMemberCount * baseWeight;
  };
}

// #endregion Party need based weights

// #region Status orbs

/** Moves that benefit from the user having a non-volatile status condition. */
const STATUS_SYNERGY_MOVES: readonly MoveId[] = [MoveId.FACADE, MoveId.PSYCHO_SHIFT];

/** Moves that can pass a held status orb on to the target. */
// TODO: Add Trick, Fling and Switcheroo once implemented
const ORB_PASSING_MOVES: readonly MoveId[] = [];

/** Abilities that benefit from any non-volatile status condition. */
const STATUS_SYNERGY_ABILITIES: readonly AbilityId[] = [
  AbilityId.QUICK_FEET,
  AbilityId.GUTS,
  AbilityId.MARVEL_SCALE,
  AbilityId.MAGIC_GUARD,
];

/**
 * Gets a function to determine the weight of a status orb (Toxic Orb / Flame Orb).
 *
 * The orb may be offered if a party member not already holding a status orb could benefit from it:
 * - by passing it on with a move, or
 * - by being able to receive `status` and having a move or ability that benefits from it.
 * @param status - The {@linkcode StatusEffect} inflicted by the orb
 * @param synergyAbilities - Abilities benefiting specifically from `status` (offered even alongside a conflicting ability)
 * @param conflictingAbilities - Abilities benefiting from the *other* orb's status; blocks the generic-ability path
 * @param weight - The weight when a party member qualifies
 * @returns A {@linkcode RewardWeightFunc}
 */
export function statusOrbWeightFunc(
  status: StatusEffect,
  synergyAbilities: readonly AbilityId[],
  conflictingAbilities: readonly AbilityId[],
  weight: number,
): RewardWeightFunc {
  return () => {
    const canBenefit = globalScene.getPlayerParty().some(p => {
      if (p.heldItemManager.hasItem(HeldItemId.FLAME_ORB) || p.heldItemManager.hasItem(HeldItemId.TOXIC_ORB)) {
        return false;
      }

      const moveset = p.getMoveset(true).map(m => m.moveId);
      if (ORB_PASSING_MOVES.some(m => moveset.includes(m))) {
        return true;
      }
      if (!p.canSetStatus(status, true, true, null, true)) {
        return false;
      }

      const hasSynergyMove = STATUS_SYNERGY_MOVES.some(m => moveset.includes(m));
      const hasGeneralAbility = STATUS_SYNERGY_ABILITIES.some(a => p.hasAbility(a, false, true));
      const hasSynergyAbility = synergyAbilities.some(a => p.hasAbility(a, false, true));
      const hasConflictingAbility = conflictingAbilities.some(a => p.hasAbility(a, false, true));

      return hasSynergyAbility || (hasGeneralAbility && !hasConflictingAbility) || hasSynergyMove;
    });
    return canBenefit ? weight : 0;
  };
}

// #endregion Status orbs
