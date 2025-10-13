import type { ObjectValues } from "#types/type-helpers";
import { FormChangeItemId } from "./form-change-item-id";

export const HeldItemId = {
  NONE: 0x0000,

  // Berries
  SITRUS_BERRY: 0x0101,
  LUM_BERRY: 0x0201,
  ENIGMA_BERRY: 0x0301,
  LIECHI_BERRY: 0x0401,
  GANLON_BERRY: 0x0501,
  PETAYA_BERRY: 0x0601,
  APICOT_BERRY: 0x0701,
  SALAC_BERRY: 0x0801,
  LANSAT_BERRY: 0x0901,
  STARF_BERRY: 0x0a01,
  LEPPA_BERRY: 0x0b01,

  // Other items that are consumed
  REVIVER_SEED: 0x0102,
  WHITE_HERB: 0x0202,

  // Type Boosters
  SILK_SCARF: 0x0103,
  BLACK_BELT: 0x0203,
  SHARP_BEAK: 0x0303,
  POISON_BARB: 0x0403,
  SOFT_SAND: 0x0503,
  HARD_STONE: 0x0603,
  SILVER_POWDER: 0x0703,
  SPELL_TAG: 0x0803,
  METAL_COAT: 0x0903,
  CHARCOAL: 0x0a03,
  MYSTIC_WATER: 0x0b03,
  MIRACLE_SEED: 0x0c03,
  MAGNET: 0x0d03,
  TWISTED_SPOON: 0x0e03,
  NEVER_MELT_ICE: 0x0f03,
  DRAGON_FANG: 0x1003,
  BLACK_GLASSES: 0x1103,
  FAIRY_FEATHER: 0x1203,

  // Species Stat Boosters
  LIGHT_BALL: 0x0104,
  THICK_CLUB: 0x0204,
  METAL_POWDER: 0x0304,
  QUICK_POWDER: 0x0404,
  DEEP_SEA_SCALE: 0x0504,
  DEEP_SEA_TOOTH: 0x0604,

  // Crit Boosters
  SCOPE_LENS: 0x0105,
  LEEK: 0x0205,

  // Items increasing gains
  LUCKY_EGG: 0x0106,
  GOLDEN_EGG: 0x0206,
  SOOTHE_BELL: 0x0306,

  // Unique items
  FOCUS_BAND: 0x0107,
  QUICK_CLAW: 0x0207,
  KINGS_ROCK: 0x0307,
  LEFTOVERS: 0x0407,
  SHELL_BELL: 0x0507,
  MYSTICAL_ROCK: 0x0607,
  WIDE_LENS: 0x0707,
  MULTI_LENS: 0x0807,
  GOLDEN_PUNCH: 0x0907,
  GRIP_CLAW: 0x0a07,
  TOXIC_ORB: 0x0b07,
  FLAME_ORB: 0x0c07,
  SOUL_DEW: 0x0d07,
  BATON: 0x0e07,
  MINI_BLACK_HOLE: 0x0f07,
  EVIOLITE: 0x1007,

  // Vitamins
  HP_UP: 0x0108,
  PROTEIN: 0x0208,
  IRON: 0x0308,
  CALCIUM: 0x0408,
  ZINC: 0x0508,
  CARBOS: 0x0608,

  // Other stat boosting items
  SHUCKLE_JUICE_GOOD: 0x0109,
  SHUCKLE_JUICE_BAD: 0x0209,
  OLD_GATEAU: 0x0309,
  MACHO_BRACE: 0x0409,

  // Evo trackers
  GIMMIGHOUL_EVO_TRACKER: 0x010a,

  // All form change items
  ...FormChangeItemId,
} as const;

export type HeldItemId = ObjectValues<typeof HeldItemId>;

type HeldItemNameMap = {
  [k in HeldItemName as (typeof HeldItemId)[k]]: k;
};

type HeldItemName = keyof typeof HeldItemId;

/** `const object` mapping all held item IDs to their respective names. */
// TODO: This stores names as UPPER_SNAKE_CASE, but the locales are in PascalCase...
export const HeldItemNames = Object.freeze(
  Object.entries(HeldItemId).reduce(
    // Use a type-safe reducer to force number keys and values
    (acc, [key, value]) => {
      acc[value] = key;
      return acc;
    },
    {},
  ),
) as HeldItemNameMap;

export const HeldItemCategoryId = {
  NONE: 0x00,
  BERRY: 0x01,
  CONSUMABLE: 0x02,
  TYPE_ATTACK_BOOSTER: 0x03,
  SPECIES_STAT_BOOSTER: 0x04,
  CRIT_BOOSTER: 0x05,
  GAIN_INCREASE: 0x06,
  UNIQUE: 0x07,
  VITAMIN: 0x08,
  BASE_STAT_BOOST: 0x09,
  EVO_TRACKER: 0x0a,
  RARE_FORM_CHANGE: 0x0b,
  FORM_CHANGE: 0x0c,
} as const;

export type HeldItemCategoryId = ObjectValues<typeof HeldItemCategoryId>;

const ITEM_CATEGORY_MASK = 0xff;

export function getHeldItemCategory(itemId: HeldItemId): HeldItemCategoryId {
  return (itemId & ITEM_CATEGORY_MASK) as HeldItemCategoryId;
}

export function isCategoryId(id: number): id is HeldItemCategoryId {
  return (Object.values(HeldItemCategoryId) as number[]).includes(id);
}

export function isItemInCategory(itemId: HeldItemId, category: HeldItemCategoryId): boolean {
  return getHeldItemCategory(itemId) === category;
}

/**
 * Check whether the given item is a Berry
 * @param itemId - The item ID to check
 * @returns Whether the item is a Berry
 */
export function isBerry(itemId: HeldItemId): boolean {
  return getHeldItemCategory(itemId) === HeldItemCategoryId.BERRY;
}

/**
 * Check whether the given item is a form change item
 * @param itemId - The item ID to check
 * @returns Whether the item is a form change item
 */
export function isFormChangeItem(itemId: HeldItemId): itemId is FormChangeItemId {
  const category = getHeldItemCategory(itemId);
  return category === HeldItemCategoryId.FORM_CHANGE || category === HeldItemCategoryId.RARE_FORM_CHANGE;
}

export function isItemInRequested(itemId: HeldItemId, requestedItems: (HeldItemCategoryId | HeldItemId)[]): boolean {
  return requestedItems.some(entry => itemId === entry || (itemId & ITEM_CATEGORY_MASK) === entry);
}
