import { HeldItemId } from "#enums/held-item-id";

export const flingPower = {
  [HeldItemId.SITRUS_BERRY]: 10,
  [HeldItemId.LUM_BERRY]: 10,
  [HeldItemId.ENIGMA_BERRY]: 10,
  [HeldItemId.LIECHI_BERRY]: 10,
  [HeldItemId.GANLON_BERRY]: 10,
  [HeldItemId.PETAYA_BERRY]: 10,
  [HeldItemId.APICOT_BERRY]: 10,
  [HeldItemId.SALAC_BERRY]: 10,
  [HeldItemId.LANSAT_BERRY]: 10,
  [HeldItemId.STARF_BERRY]: 10,
  [HeldItemId.LEPPA_BERRY]: 10,

  // Other items that are consumed
  [HeldItemId.REVIVER_SEED]: 30,
  [HeldItemId.WHITE_HERB]: 10,

  // Type Boosters
  [HeldItemId.SILK_SCARF]: 10,
  [HeldItemId.BLACK_BELT]: 30,
  [HeldItemId.SHARP_BEAK]: 50,
  [HeldItemId.POISON_BARB]: 70,
  [HeldItemId.SOFT_SAND]: 10,
  [HeldItemId.HARD_STONE]: 100,
  [HeldItemId.SILVER_POWDER]: 10,
  [HeldItemId.SPELL_TAG]: 30,
  [HeldItemId.METAL_COAT]: 30,
  [HeldItemId.CHARCOAL]: 30,
  [HeldItemId.MYSTIC_WATER]: 30,
  [HeldItemId.MIRACLE_SEED]: 30,
  [HeldItemId.MAGNET]: 30,
  [HeldItemId.TWISTED_SPOON]: 30,
  [HeldItemId.NEVER_MELT_ICE]: 30,
  [HeldItemId.DRAGON_FANG]: 70,
  [HeldItemId.BLACK_GLASSES]: 30,
  [HeldItemId.FAIRY_FEATHER]: 10,

  // Species Stat Boosters
  [HeldItemId.LIGHT_BALL]: 30,
  [HeldItemId.THICK_CLUB]: 90,
  [HeldItemId.METAL_POWDER]: 10,
  [HeldItemId.QUICK_POWDER]: 10,
  [HeldItemId.DEEP_SEA_SCALE]: 30,
  [HeldItemId.DEEP_SEA_TOOTH]: 90,

  // Crit Boosters
  [HeldItemId.SCOPE_LENS]: 30,
  [HeldItemId.LEEK]: 60,

  // Items increasing gains
  [HeldItemId.LUCKY_EGG]: 30,
  [HeldItemId.GOLDEN_EGG]: 60,
  [HeldItemId.SOOTHE_BELL]: 10,

  // Unique items
  [HeldItemId.FOCUS_BAND]: 10,
  [HeldItemId.QUICK_CLAW]: 80,
  [HeldItemId.KINGS_ROCK]: 30,
  [HeldItemId.LEFTOVERS]: 10,
  [HeldItemId.SHELL_BELL]: 30,
  [HeldItemId.MYSTICAL_ROCK]: 60,
  [HeldItemId.WIDE_LENS]: 10,
  [HeldItemId.MULTI_LENS]: 10,
  [HeldItemId.GOLDEN_PUNCH]: 90,
  [HeldItemId.GRIP_CLAW]: 90,
  [HeldItemId.TOXIC_ORB]: 30,
  [HeldItemId.FLAME_ORB]: 30,
  [HeldItemId.SOUL_DEW]: 30,
  [HeldItemId.BATON]: 30,
  [HeldItemId.EVIOLITE]: 40,
};

export const flingExtraEffect: HeldItemId[] = [
  HeldItemId.TOXIC_ORB,
  HeldItemId.FLAME_ORB,
  HeldItemId.KINGS_ROCK,
  HeldItemId.LIGHT_BALL,
  HeldItemId.POISON_BARB,
  HeldItemId.WHITE_HERB,
];

export function flingFilter(itemA: HeldItemId, itemB: HeldItemId): number {
  const weightA = (flingPower[itemA] ?? 0) + (flingExtraEffect.includes(itemA) ? 100 : 0);
  const weightB = (flingPower[itemB] ?? 0) + (flingExtraEffect.includes(itemB) ? 100 : 0);
  return weightB - weightA;
}
