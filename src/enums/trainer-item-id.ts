export const TrainerItemId = {
  NONE: 0x0000,

  MAP: 0x0B01,
  IV_SCANNER: 0x0B02,
  LOCK_CAPSULE: 0x0B03,
  MEGA_BRACELET: 0x0B04,
  DYNAMAX_BAND: 0x0B05,
  TERA_ORB: 0x0B06,

  GOLDEN_POKEBALL: 0x0B07,

  OVAL_CHARM: 0x0B08,
  EXP_SHARE: 0x0B09,
  EXP_BALANCE: 0x0B0A,

  CANDY_JAR: 0x0B0B,
  BERRY_POUCH: 0x0B0C,

  HEALING_CHARM: 0x0B0D,
  EXP_CHARM: 0x0B0E,
  SUPER_EXP_CHARM: 0x0B0F,
  GOLDEN_EXP_CHARM: 0x0B10,
  AMULET_COIN: 0x0B11,

  ABILITY_CHARM: 0x0B12,
  SHINY_CHARM: 0x0B13,
  CATCHING_CHARM: 0x0B14,

  BLACK_SLUDGE: 0x0B15,
  GOLDEN_BUG_NET: 0x0B16,

  LURE: 0x0C01,
  SUPER_LURE: 0x0C02,
  MAX_LURE: 0x0C03,

  X_ATTACK: 0x0D01,
  X_DEFENSE: 0x0D02,
  X_SP_ATK: 0x0D03,
  X_SP_DEF: 0x0D04,
  X_SPEED: 0x0D05,
  X_ACCURACY: 0x0D06,
  DIRE_HIT: 0x0D07,

  ENEMY_DAMAGE_BOOSTER: 0x0E01,
  ENEMY_DAMAGE_REDUCTION: 0x0E02,
  ENEMY_HEAL: 0x0E03,
  ENEMY_ATTACK_POISON_CHANCE: 0x0E04,
  ENEMY_ATTACK_PARALYZE_CHANCE: 0x0E05,
  ENEMY_ATTACK_BURN_CHANCE: 0x0E06,
  ENEMY_STATUS_EFFECT_HEAL_CHANCE: 0x0E07,
  ENEMY_ENDURE_CHANCE: 0x0E08,
  ENEMY_FUSED_CHANCE: 0x0E09,
};

export type TrainerItemId = (typeof TrainerItemId)[keyof typeof TrainerItemId];

type TrainerItemName = keyof typeof TrainerItemId;
type TrainerItemValue = typeof TrainerItemId[TrainerItemName];

// Use a type-safe reducer to force number keys and values
export const TrainerItemNames: Record<TrainerItemValue, TrainerItemName> = Object.entries(TrainerItemId).reduce(
  (acc, [key, value]) => {
    acc[value as TrainerItemValue] = key as TrainerItemName;
    return acc;
  },
  {} as Record<TrainerItemValue, TrainerItemName>
);