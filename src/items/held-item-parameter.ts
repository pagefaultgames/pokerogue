import { HeldItemEffect } from "#enums/held-item-effect";
import type { MoveId } from "#enums/move-id";
import type { PokemonType } from "#enums/pokemon-type";
import type { Stat } from "#enums/stat";
import type { Pokemon } from "#field/pokemon";
import type { BooleanHolder, NumberHolder } from "#utils/common";

export interface DefaultHeldItemParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
}

export interface AccuracyBoostParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** Holds the move's accuracy, which may be modified after item application */
  moveAccuracy: NumberHolder;
}

export interface AttackTypeBoostParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** The resolved type of the move */
  moveType: PokemonType;
  /** Holder for the damage value */
  // TODO: https://github.com/pagefaultgames/pokerogue/pull/5656#discussion_r2119660807
  movePower: NumberHolder;
}

export interface BaseStatBoosterParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** The base stats of the {@linkcode pokemon} */
  baseStats: number[];
}

export interface BaseStatFlatParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** The base stats of the {@linkcode pokemon} */
  baseStats: number[];
}

export interface BaseStatTotalParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** Array of the pokemon's base stat; modified in place after item application */
  baseStats: number[];
}

export type BatonParams = DefaultHeldItemParams;

export type BerryParams = DefaultHeldItemParams;

export interface BypassSpeedChanceParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** Holder for whether the speed should be bypassed */
  doBypassSpeed: BooleanHolder;
}

export interface CritBoostParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** The critical hit stage */
  critStage: NumberHolder;
}

export interface DamageMoneyRewardParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** The damage, used to calculate the money reward */
  damage: number;
}

export type EvoTrackerParams = DefaultHeldItemParams;

export interface ExpBoostParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** Holds the amount of experience gained, which may be modified after item application */
  expAmount: NumberHolder;
}

export interface FieldEffectParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** Holder for the field effect duration*/
  fieldDuration: NumberHolder;
}

export interface FlinchChanceParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** Holds whether the attack will cause a flinch */
  flinched: BooleanHolder;
}

export interface FriendshipBoostParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** Holder for the friendship amount to be changed by the item */
  friendship: NumberHolder;
}

export type HitHealParams = DefaultHeldItemParams;

export interface IncrementingStatParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** The stat whose value is being impacted */
  stat: Stat;
  /** Holds the stat's value, which may be modified after item application */
  // TODO: https://github.com/pagefaultgames/pokerogue/pull/5656#discussion_r2135612276
  statHolder: NumberHolder;
}

export type InstantReviveParams = DefaultHeldItemParams;

export interface ItemStealParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** The pokemon to steal from (optional) */
  // TODO: https://github.com/pagefaultgames/pokerogue/pull/5656#discussion_r2135607083
  target?: Pokemon;
}

export interface MultiHitCountParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** The move being used */
  moveId: MoveId;
  /** Holder for the move's hit count for the turn */
  count: NumberHolder;
}

export interface MultiHitDamageParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** The move being used */
  moveId: MoveId;
  /** Holder for the damage multiplier applied to a strike of the move */
  damageMultiplier: NumberHolder;
}

export interface NatureWeightBoostParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** Holder for the multiplier */
  multiplier: NumberHolder;
}

export type ResetNegativeStatStageParams = DefaultHeldItemParams;

export interface StatBoostParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** The statistic to boost */
  stat: Stat;
  /** The value to change */
  statValue: NumberHolder;
}

export interface SurviveChanceParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** The chance of survival */
  surviveDamage: BooleanHolder;
}

export type TurnEndHealParams = DefaultHeldItemParams;

export type TurnEndStatusParams = DefaultHeldItemParams;

export type HeldItemEffectParamMap = {
  [HeldItemEffect.ATTACK_TYPE_BOOST]: AttackTypeBoostParams;
  [HeldItemEffect.TURN_END_HEAL]: TurnEndHealParams;
  [HeldItemEffect.HIT_HEAL]: HitHealParams;
  [HeldItemEffect.RESET_NEGATIVE_STAT_STAGE]: ResetNegativeStatStageParams;
  [HeldItemEffect.EXP_BOOSTER]: ExpBoostParams;
  [HeldItemEffect.BERRY]: BerryParams;
  [HeldItemEffect.BASE_STAT_BOOSTER]: BaseStatBoosterParams;
  [HeldItemEffect.INSTANT_REVIVE]: InstantReviveParams;
  [HeldItemEffect.STAT_BOOST]: StatBoostParams;
  [HeldItemEffect.CRIT_BOOST]: CritBoostParams;
  [HeldItemEffect.TURN_END_STATUS]: TurnEndStatusParams;
  [HeldItemEffect.SURVIVE_CHANCE]: SurviveChanceParams;
  [HeldItemEffect.BYPASS_SPEED_CHANCE]: BypassSpeedChanceParams;
  [HeldItemEffect.FLINCH_CHANCE]: FlinchChanceParams;
  [HeldItemEffect.FIELD_EFFECT]: FieldEffectParams;
  [HeldItemEffect.FRIENDSHIP_BOOSTER]: FriendshipBoostParams;
  [HeldItemEffect.NATURE_WEIGHT_BOOSTER]: NatureWeightBoostParams;
  [HeldItemEffect.ACCURACY_BOOSTER]: AccuracyBoostParams;
  [HeldItemEffect.MULTI_HIT_COUNT]: MultiHitCountParams;
  [HeldItemEffect.MULTI_HIT_DAMAGE]: MultiHitDamageParams;
  [HeldItemEffect.DAMAGE_MONEY_REWARD]: DamageMoneyRewardParams;
  [HeldItemEffect.BATON]: BatonParams;
  [HeldItemEffect.CONTACT_ITEM_STEAL_CHANCE]: ItemStealParams;
  [HeldItemEffect.TURN_END_ITEM_STEAL]: ItemStealParams;
  [HeldItemEffect.BASE_STAT_TOTAL]: BaseStatTotalParams;
  [HeldItemEffect.BASE_STAT_FLAT]: BaseStatFlatParams;
  [HeldItemEffect.INCREMENTING_STAT]: IncrementingStatParams;
  [HeldItemEffect.EVO_TRACKER]: EvoTrackerParams;
};
/**
 * Dummy, Typescript-only constant to ensure that all {@linkcode HeldItemEffect}s have an entry in {@linkcode HeldItemEffectParamMap}.
 * If any are missing, Typescript will throw an error on this line.
 * @remarks
 * ⚠️ Does not exist at runtime, so it must not be used!
 */
declare const EnsureAllEffectsAreMapped: HeldItemEffectParamMap[HeldItemEffect] & never;
