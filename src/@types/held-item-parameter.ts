import { HeldItemEffect } from "#enums/held-item-effect";
import type { MoveId } from "#enums/move-id";
import type { PokemonType } from "#enums/pokemon-type";
import type { Stat } from "#enums/stat";
import type { Pokemon } from "#field/pokemon";
import type { BooleanHolder, NumberHolder } from "#utils/common";

/** Base interface for all held item parameter types. */
export interface DefaultHeldItemParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
}

export interface AccuracyBoostParams extends DefaultHeldItemParams {
  /** Holds the move's accuracy, which may be modified after item application */
  moveAccuracy: NumberHolder;
}

export interface AttackTypeBoostParams extends DefaultHeldItemParams {
  /** The resolved type of the move */
  moveType: PokemonType;
  /** Holder for the damage value */
  // TODO: https://github.com/pagefaultgames/pokerogue/pull/5656#discussion_r2119660807
  movePower: NumberHolder;
}

export interface BaseStatParams extends DefaultHeldItemParams {
  /** Array of the pokemon's base stats; modified in place after item application */
  baseStats: number[];
}

export interface BatonParams extends DefaultHeldItemParams {}

export interface BerryParams extends DefaultHeldItemParams {}

export interface BypassSpeedChanceParams extends DefaultHeldItemParams {
  /** Holder for whether the speed should be bypassed */
  doBypassSpeed: BooleanHolder;
}

export interface CritBoostParams extends DefaultHeldItemParams {
  /** The critical hit stage */
  critStage: NumberHolder;
}

export interface DamageMoneyRewardParams extends DefaultHeldItemParams {
  /** The damage, used to calculate the money reward */
  damage: number;
}

export interface ExpBoostParams extends DefaultHeldItemParams {
  /** Holds the amount of experience gained, which may be modified after item application */
  expAmount: NumberHolder;
}

export interface FieldEffectParams extends DefaultHeldItemParams {
  /** Holder for the field effect duration*/
  fieldDuration: NumberHolder;
}

export interface FlinchChanceParams extends DefaultHeldItemParams {
  /** Holds whether the attack will cause a flinch */
  flinched: BooleanHolder;
}

export interface FriendshipBoostParams extends DefaultHeldItemParams {
  /** Holder for the friendship amount to be changed by the item */
  friendship: NumberHolder;
}

export interface HitHealParams extends DefaultHeldItemParams {}

export interface InstantReviveParams extends DefaultHeldItemParams {}

export interface ItemStealParams extends DefaultHeldItemParams {
  /** The pokemon to steal from (optional) */
  // TODO: https://github.com/pagefaultgames/pokerogue/pull/5656#discussion_r2135607083
  target?: Pokemon;
}

export interface MultiHitCountParams extends DefaultHeldItemParams {
  /** The move being used */
  moveId: MoveId;
  /** Holder for the move's hit count for the turn */
  count: NumberHolder;
}

export interface MultiHitDamageParams extends DefaultHeldItemParams {
  /** The move being used */
  moveId: MoveId;
  /** Holder for the damage multiplier applied to a strike of the move */
  damageMultiplier: NumberHolder;
}

export interface NatureWeightBoostParams extends DefaultHeldItemParams {
  /** Holder for the multiplier */
  multiplier: NumberHolder;
}

export interface ResetNegativeStatStageParams extends DefaultHeldItemParams {}

export interface StatBoostParams extends DefaultHeldItemParams {
  /** The stat whose value is being impacted */
  stat: Stat;
  /** Holds the stat's value, which may be modified after item application */
  statHolder: NumberHolder;
}

export interface SurviveChanceParams extends DefaultHeldItemParams {
  /** Whether damage is endured */
  surviveDamage: BooleanHolder;
}

export interface TurnEndHealParams extends DefaultHeldItemParams {}

export interface TurnEndStatusParams extends DefaultHeldItemParams {}

export type HeldItemEffectParamMap = {
  [HeldItemEffect.ATTACK_TYPE_BOOST]: AttackTypeBoostParams;
  [HeldItemEffect.TURN_END_HEAL]: TurnEndHealParams;
  [HeldItemEffect.HIT_HEAL]: HitHealParams;
  [HeldItemEffect.RESET_NEGATIVE_STAT_STAGE]: ResetNegativeStatStageParams;
  [HeldItemEffect.EXP_BOOSTER]: ExpBoostParams;
  [HeldItemEffect.BERRY]: BerryParams;
  [HeldItemEffect.BASE_STAT_MULTIPLY]: BaseStatParams;
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
  [HeldItemEffect.BASE_STAT_ADD]: BaseStatParams;
  [HeldItemEffect.MACHO_BRACE]: StatBoostParams;
};

/**
 * Dummy, TypeScript-only constant to ensure that all {@linkcode HeldItemEffect}s have an entry in {@linkcode HeldItemEffectParamMap}.
 * If any are missing, TypeScript will throw an error on this line.
 * @remarks
 * ⚠️ Does not exist at runtime, so it must not be used!
 */
declare const EnsureAllEffectsAreMapped: HeldItemEffectParamMap[HeldItemEffect] & never;
