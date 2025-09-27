export const TrainerItemId = {
  NONE: 0x0000,

  MAP: 0x1001,
  IV_SCANNER: 0x1002,
  LOCK_CAPSULE: 0x1003,
  MEGA_BRACELET: 0x1004,
  DYNAMAX_BAND: 0x1005,
  TERA_ORB: 0x1006,

  GOLDEN_POKEBALL: 0x1007,

  OVAL_CHARM: 0x1008,
  EXP_SHARE: 0x1009,
  EXP_BALANCE: 0x100a,

  CANDY_JAR: 0x100b,
  BERRY_POUCH: 0x100c,

  HEALING_CHARM: 0x100d,
  EXP_CHARM: 0x100e,
  SUPER_EXP_CHARM: 0x100f,
  GOLDEN_EXP_CHARM: 0x1010,
  AMULET_COIN: 0x1011,

  ABILITY_CHARM: 0x1012,
  SHINY_CHARM: 0x1013,
  CATCHING_CHARM: 0x1014,

  BLACK_SLUDGE: 0x1015,
  GOLDEN_BUG_NET: 0x1016,

  LURE: 0x1101,
  SUPER_LURE: 0x1102,
  MAX_LURE: 0x1103,

  X_ATTACK: 0x1201,
  X_DEFENSE: 0x1202,
  X_SP_ATK: 0x1203,
  X_SP_DEF: 0x1204,
  X_SPEED: 0x1205,
  X_ACCURACY: 0x1206,
  DIRE_HIT: 0x1207,

  ENEMY_DAMAGE_BOOSTER: 0x1301,
  ENEMY_DAMAGE_REDUCTION: 0x1302,
  ENEMY_HEAL: 0x1303,
  ENEMY_ATTACK_POISON_CHANCE: 0x1304,
  ENEMY_ATTACK_PARALYZE_CHANCE: 0x1305,
  ENEMY_ATTACK_BURN_CHANCE: 0x1306,
  ENEMY_STATUS_EFFECT_HEAL_CHANCE: 0x1307,
  ENEMY_ENDURE_CHANCE: 0x1308,
  ENEMY_FUSED_CHANCE: 0x1309,
} as const;

export type TrainerItemId = (typeof TrainerItemId)[keyof typeof TrainerItemId];

type TrainerItemName = keyof typeof TrainerItemId;
type TrainerItemValue = (typeof TrainerItemId)[TrainerItemName];

// Use a type-safe reducer to force number keys and values
export const TrainerItemNames: Record<TrainerItemValue, TrainerItemName> = Object.entries(TrainerItemId).reduce(
  (acc, [key, value]) => {
    acc[value as TrainerItemValue] = key as TrainerItemName;
    return acc;
  },
  {} as Record<TrainerItemValue, TrainerItemName>,
);
