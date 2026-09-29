import type { TrainerItemId } from "#enums/trainer-item-id";
import type { ValueOf } from "type-fest";
import { FormChangeItemId } from "./form-change-item-id";

// #region Category-grouped IDs

const BERRY_IDS = {
  SITRUS_BERRY: 0x0101,
  LUM_BERRY: 0x0102,
  ENIGMA_BERRY: 0x0103,
  LIECHI_BERRY: 0x0104,
  GANLON_BERRY: 0x0105,
  PETAYA_BERRY: 0x0106,
  APICOT_BERRY: 0x0107,
  SALAC_BERRY: 0x0108,
  LANSAT_BERRY: 0x0109,
  STARF_BERRY: 0x010a,
  LEPPA_BERRY: 0x010b,
} as const;

const TYPE_ATTACK_BOOSTER_IDS = {
  SILK_SCARF: 0x0301,
  BLACK_BELT: 0x0302,
  SHARP_BEAK: 0x0303,
  POISON_BARB: 0x0304,
  SOFT_SAND: 0x0305,
  HARD_STONE: 0x0306,
  SILVER_POWDER: 0x0307,
  SPELL_TAG: 0x0308,
  METAL_COAT: 0x0309,
  CHARCOAL: 0x030a,
  MYSTIC_WATER: 0x030b,
  MIRACLE_SEED: 0x030c,
  MAGNET: 0x030d,
  TWISTED_SPOON: 0x030e,
  NEVER_MELT_ICE: 0x030f,
  DRAGON_FANG: 0x0310,
  BLACK_GLASSES: 0x0311,
  FAIRY_FEATHER: 0x0312,
} as const;

const VITAMIN_IDS = {
  HP_UP: 0x0801,
  PROTEIN: 0x0802,
  IRON: 0x0803,
  CALCIUM: 0x0804,
  ZINC: 0x0805,
  CARBOS: 0x0806,
} as const;

// #endregion Category-grouped IDs

/**
 * Map of all held item names to their IDs.
 *
 * @remarks
 * Entries are formatted 0xXXYY, where XX is the category and YY is the item offset within the category.
 */
export const HeldItemId = {
  // Berries
  ...BERRY_IDS,

  // Other items that are consumed
  REVIVER_SEED: 0x0201,
  WHITE_HERB: 0x0202,

  // Type Boosters
  ...TYPE_ATTACK_BOOSTER_IDS,

  // Species Stat Boosters
  LIGHT_BALL: 0x0401,
  THICK_CLUB: 0x0402,
  METAL_POWDER: 0x0403,
  QUICK_POWDER: 0x0404,
  DEEP_SEA_SCALE: 0x0405,
  DEEP_SEA_TOOTH: 0x0406,

  // Crit Boosters
  SCOPE_LENS: 0x0501,
  LEEK: 0x0502,

  // Items increasing gains
  LUCKY_EGG: 0x0601,
  GOLDEN_EGG: 0x0602,
  SOOTHE_BELL: 0x0603,

  // Unique items
  FOCUS_BAND: 0x0701,
  QUICK_CLAW: 0x0702,
  KINGS_ROCK: 0x0703,
  LEFTOVERS: 0x0704,
  SHELL_BELL: 0x0705,
  MYSTICAL_ROCK: 0x0706,
  WIDE_LENS: 0x0707,
  MULTI_LENS: 0x0708,
  GOLDEN_PUNCH: 0x0709,
  GRIP_CLAW: 0x070a,
  TOXIC_ORB: 0x070b,
  FLAME_ORB: 0x070c,
  SOUL_DEW: 0x070d,
  BATON: 0x070e,
  MINI_BLACK_HOLE: 0x070f,
  EVIOLITE: 0x0710,

  // Vitamins
  ...VITAMIN_IDS,

  // Other stat boosting items
  SHUCKLE_JUICE_GOOD: 0x0901,
  SHUCKLE_JUICE_BAD: 0x0902,
  OLD_GATEAU: 0x0903,
  MACHO_BRACE: 0x0904,

  // Evo trackers
  GIMMIGHOUL_EVO_TRACKER: 0x0a01,

  // All form change items
  ...FormChangeItemId,
} as const;

/** Union type of all held item IDs. */
export type HeldItemId = ValueOf<typeof HeldItemId>;

type HeldItemNameMap = {
  [k in HeldItemName as (typeof HeldItemId)[k]]: k;
};

type HeldItemName = keyof typeof HeldItemId;

/** `const object` mapping all held item IDs to their respective names. */
export const HeldItemNames = Object.freeze(
  Object.entries(HeldItemId).reduce(
    // Use a type-safe reducer to force number keys and values
    (acc, [key, value]) => {
      acc[value] = key;
      return acc;
    },
    {} as Record<HeldItemId, HeldItemName>,
  ),
) as HeldItemNameMap;

/** Union type of all held item category IDs. */
export const HeldItemCategoryId = {
  NONE: 0x0000,
  BERRY: 0x0100,
  CONSUMABLE: 0x0200,
  TYPE_ATTACK_BOOSTER: 0x0300,
  SPECIES_STAT_BOOSTER: 0x0400,
  CRIT_BOOSTER: 0x0500,
  // TODO: improve naming or generalize
  GAIN_INCREASE: 0x0600,
  UNIQUE: 0x0700,
  VITAMIN: 0x0800,
  BASE_STAT_BOOST: 0x0900,
  EVO_TRACKER: 0x0a00,
  RARE_FORM_CHANGE: 0x0b00,
  FORM_CHANGE: 0x0c00,
} as const;

export type HeldItemCategoryId = ValueOf<typeof HeldItemCategoryId>;

/**
 * Runtime list of every item in each generatable category.
 */
export const generatableCategoryItems = {
  [HeldItemCategoryId.BERRY]: Object.freeze(Object.values(BERRY_IDS)),
  [HeldItemCategoryId.VITAMIN]: Object.freeze(Object.values(VITAMIN_IDS)),
  [HeldItemCategoryId.TYPE_ATTACK_BOOSTER]: Object.freeze(Object.values(TYPE_ATTACK_BOOSTER_IDS)),
} satisfies Partial<Record<HeldItemCategoryId, readonly HeldItemId[]>>;

/** The subset of {@linkcode HeldItemCategoryId}s that {@linkcode getNewHeldItemFromCategory} can roll. */
export type GeneratableHeldItemCategoryId = keyof typeof generatableCategoryItems;

/** Union of all {@linkcode HeldItemId}s belonging to the given generatable category. */
export type HeldItemIdInCategory<C extends GeneratableHeldItemCategoryId> =
  (typeof generatableCategoryItems)[C][HeldItemId];

/** Bitmask extracting the category (high byte) from a held item ID. */
export const ITEM_CATEGORY_MASK = 0xff00;

type Assert<T extends true> = T;

// biome-ignore lint/correctness/noUnusedVariables: Compile time verifier
type EnsureNoIdCollision = [
  // No held item ID equals a held item category ID
  Assert<HeldItemId & HeldItemCategoryId>,
  // No held item ID equals a trainer item ID
  Assert<HeldItemId & TrainerItemId>,
  // No trainer item ID equals a held item category ID
  Assert<TrainerItemId & HeldItemCategoryId>,
];
