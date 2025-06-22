export const TrainerItemId = {
  NONE: 0x0000,

  MAP: 0x0B01,
  IV_SCANNER: 0x0B02,
  LOCK_CAPSULE: 0x0B03,
  MEGA_EVOLUTION_ACCESS: 0x0B04,
  GIGANTAMAX_ACCESS: 0x0B05,
  TERASTALLIZE_ACCESS: 0x0B06,

  GOLDEN_POKEBALL: 0x0B07,

  MULTIPLE_PARTICIPANT_EXP_BONUS: 0x0B08,
  EXP_SHARE: 0x0B09,
  EXP_BALANCE: 0x0B0A,

  CANDY_JAR: 0x0B0B,
  BERRY_POUCH: 0x0B0C,

  HEALING_CHARM: 0x0B0D,
  EXP_CHARM: 0x0B0E,
  SUPER_EXP_CHARM: 0x0B0F,
  AMULET_COIN: 0x0B10,

  ABILITY_CHARM: 0x0B11,
  SHINY_CHARM: 0x0B12,
  CATCHING_CHARM: 0x0B13,

  BLACK_SLUDGE: 0x0B14,
  BUG_NET: 0x0B15,

  LURE: 0x0C01,
  SUPER_LURE: 0x0C02,
  MAX_LURE: 0x0C03,

  X_ATTACK: 0x0D01,
  X_DEFENSE: 0x0D02,
  X_SPATK: 0x0D03,
  X_SPDEF: 0x0D04,
  X_SPEED: 0x0D05,
  X_ACCURACY: 0x0D06,
  DIRE_HIT: 0x0D07,
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