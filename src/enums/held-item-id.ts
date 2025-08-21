import type { ObjectValues } from "#types/type-helpers";

// TODO: Rename to `FormChangeItemId`
export const FormChangeItem = {
    // Mega Stones
  ABOMASITE: 0x0B01,
  ABSOLITE: 0x0B02,
  AERODACTYLITE: 0x0B03,
  AGGRONITE: 0x0B04,
  ALAKAZITE: 0x0B05,
  ALTARIANITE: 0x0B06,
  AMPHAROSITE: 0x0B07,
  AUDINITE: 0x0B08,
  BANETTITE: 0x0B09,
  BEEDRILLITE: 0x0B0A,
  BLASTOISINITE: 0x0B0B,
  BLAZIKENITE: 0x0B0C,
  CAMERUPTITE: 0x0B0D,
  CHARIZARDITE_X: 0x0B0E,
  CHARIZARDITE_Y: 0x0B0F,
  DIANCITE: 0x0B10,
  GALLADITE: 0x0B11,
  GARCHOMPITE: 0x0B12,
  GARDEVOIRITE: 0x0B13,
  GENGARITE: 0x0B14,
  GLALITITE: 0x0B15,
  GYARADOSITE: 0x0B16,
  HERACRONITE: 0x0B17,
  HOUNDOOMINITE: 0x0B18,
  KANGASKHANITE: 0x0B19,
  LATIASITE: 0x0B1A,
  LATIOSITE: 0x0B1B,
  LOPUNNITE: 0x0B1C,
  LUCARIONITE: 0x0B1D,
  MANECTITE: 0x0B1E,
  MAWILITE: 0x0B1F,
  MEDICHAMITE: 0x0B20,
  METAGROSSITE: 0x0B21,
  MEWTWONITE_X: 0x0B22,
  MEWTWONITE_Y: 0x0B23,
  PIDGEOTITE: 0x0B24,
  PINSIRITE: 0x0B25,
  RAYQUAZITE: 0x0B26,
  SABLENITE: 0x0B27,
  SALAMENCITE: 0x0B28,
  SCEPTILITE: 0x0B29,
  SCIZORITE: 0x0B2A,
  SHARPEDONITE: 0x0B2B,
  SLOWBRONITE: 0x0B2C,
  STEELIXITE: 0x0B2D,
  SWAMPERTITE: 0x0B2E,
  TYRANITARITE: 0x0B2F,
  VENUSAURITE: 0x0B30,

  // Other rare form change items
  BLUE_ORB: 0x0B51,
  RED_ORB: 0x0B52,
  ADAMANT_CRYSTAL: 0x0B53,
  LUSTROUS_GLOBE: 0x0B54,
  GRISEOUS_CORE: 0x0B55,
  REVEAL_GLASS: 0x0B56,
  MAX_MUSHROOMS: 0x0B57,
  DARK_STONE: 0x0B58,
  LIGHT_STONE: 0x0B59,
  PRISON_BOTTLE: 0x0B5A,
  RUSTED_SWORD: 0x0B5B,
  RUSTED_SHIELD: 0x0B5C,
  ICY_REINS_OF_UNITY: 0x0B5D,
  SHADOW_REINS_OF_UNITY: 0x0B5E,
  ULTRANECROZIUM_Z: 0x0B5F,

  // less rare form change items
  SHARP_METEORITE: 0x0C01,
  HARD_METEORITE: 0x0C02,
  SMOOTH_METEORITE: 0x0C03,
  GRACIDEA: 0x0C04,
  SHOCK_DRIVE: 0x0C05,
  BURN_DRIVE: 0x0C06,
  CHILL_DRIVE: 0x0C07,
  DOUSE_DRIVE: 0x0C08,
  N_SOLARIZER: 0x0C09,
  N_LUNARIZER: 0x0C0A,
  WELLSPRING_MASK: 0x0C0B,
  HEARTHFLAME_MASK: 0x0C0C,
  CORNERSTONE_MASK: 0x0C0D,
  FIST_PLATE: 0x0C0E,
  SKY_PLATE: 0x0C0F,
  TOXIC_PLATE: 0x0C10,
  EARTH_PLATE: 0x0C11,
  STONE_PLATE: 0x0C12,
  INSECT_PLATE: 0x0C13,
  SPOOKY_PLATE: 0x0C14,
  IRON_PLATE: 0x0C15,
  FLAME_PLATE: 0x0C16,
  SPLASH_PLATE: 0x0C17,
  MEADOW_PLATE: 0x0C18,
  ZAP_PLATE: 0x0C19,
  MIND_PLATE: 0x0C1A,
  ICICLE_PLATE: 0x0C1B,
  DRACO_PLATE: 0x0C1C,
  DREAD_PLATE: 0x0C1D,
  PIXIE_PLATE: 0x0C1E,
  BLANK_PLATE: 0x0C1F, // TODO: Find a potential use for this
  LEGEND_PLATE: 0x0C20, // TODO: Find a potential use for this
  FIGHTING_MEMORY: 0x0C21,
  FLYING_MEMORY: 0x0C22,
  POISON_MEMORY: 0x0C23,
  GROUND_MEMORY: 0x0C24,
  ROCK_MEMORY: 0x0C25,
  BUG_MEMORY: 0x0C26,
  GHOST_MEMORY: 0x0C27,
  STEEL_MEMORY: 0x0C28,
  FIRE_MEMORY: 0x0C29,
  WATER_MEMORY: 0x0C2A,
  GRASS_MEMORY: 0x0C2B,
  ELECTRIC_MEMORY: 0x0C2C,
  PSYCHIC_MEMORY: 0x0C2D,
  ICE_MEMORY: 0x0C2E,
  DRAGON_MEMORY: 0x0C2F,
  DARK_MEMORY: 0x0C30,
  FAIRY_MEMORY: 0x0C31,
  NORMAL_MEMORY: 0x0C32,
} as const;

export type FormChangeItem = ObjectValues<typeof FormChangeItem>

// TODO: make category the lower 2 bytes
export const HeldItemId = {
  NONE: 0x0000,

  // Berries
  SITRUS_BERRY: 0x0101,
  LUM_BERRY: 0x0102,
  ENIGMA_BERRY: 0x0103,
  LIECHI_BERRY: 0x0104,
  GANLON_BERRY: 0x0105,
  PETAYA_BERRY: 0x0106,
  APICOT_BERRY: 0x0107,
  SALAC_BERRY: 0x0108,
  LANSAT_BERRY: 0x0109,
  STARF_BERRY: 0x010A,
  LEPPA_BERRY: 0x010B,

  // Other items that are consumed
  REVIVER_SEED: 0x0201,
  WHITE_HERB: 0x0202,

  // Type Boosters
  SILK_SCARF: 0x0301,
  BLACK_BELT: 0x0302,
  SHARP_BEAK: 0x0303,
  POISON_BARB: 0x0304,
  SOFT_SAND: 0x0305,
  HARD_STONE: 0x0306,
  SILVER_POWDER: 0x0307,
  SPELL_TAG: 0x0308,
  METAL_COAT: 0x0309,
  CHARCOAL: 0x030A,
  MYSTIC_WATER: 0x030B,
  MIRACLE_SEED: 0x030C,
  MAGNET: 0x030D,
  TWISTED_SPOON: 0x030E,
  NEVER_MELT_ICE: 0x030F,
  DRAGON_FANG: 0x0310,
  BLACK_GLASSES: 0x0311,
  FAIRY_FEATHER: 0x0312,

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
  GRIP_CLAW: 0x070A,
  TOXIC_ORB: 0x070B,
  FLAME_ORB: 0x070C,
  SOUL_DEW: 0x070D,
  BATON: 0x070E,
  MINI_BLACK_HOLE: 0x070F,
  EVIOLITE: 0x0710,

  // Vitamins
  HP_UP: 0x0801,
  PROTEIN: 0x0802,
  IRON: 0x0803,
  CALCIUM: 0x0804,
  ZINC: 0x0805,
  CARBOS: 0x0806,

  // Other stat boosting items
  SHUCKLE_JUICE_GOOD: 0x0901,
  SHUCKLE_JUICE_BAD: 0x0902,
  OLD_GATEAU: 0x0903,
  MACHO_BRACE: 0x0904,

  // Evo trackers
  GIMMIGHOUL_EVO_TRACKER: 0x0A01,

  // All the form change stuff
  ...FormChangeItem
} as const;

export type HeldItemId = ObjectValues<typeof HeldItemId>;

type HeldItemNameMap = {
  [k in HeldItemName as (typeof HeldItemId)[k]]: k
}

type HeldItemName = keyof typeof HeldItemId;

/** `const object` mapping all held item IDs to their respective names. */
// TODO: This stores names as UPPER_SNAKE_CASE, but the locales are in PascalCase...
export const HeldItemNames = Object.freeze(Object.entries(HeldItemId).reduce(
  // Use a type-safe reducer to force number keys and values
  (acc, [key, value]) => {
    acc[value] = key;
    return acc;
  },
  {}
)) as HeldItemNameMap;

export const HeldItemCategoryId = {
  NONE: 0x0000,
  BERRY: 0x0100,
  CONSUMABLE: 0x0200,
  TYPE_ATTACK_BOOSTER: 0x0300,
  SPECIES_STAT_BOOSTER: 0x0400,
  CRIT_BOOSTER: 0x0500,
  GAIN_INCREASE: 0x0600,
  UNIQUE: 0x0700,
  VITAMIN: 0x0800,
  BASE_STAT_BOOST: 0x0900,
  EVO_TRACKER: 0x0A00,
  RARE_FORM_CHANGE: 0x0B00,
  FORM_CHANGE: 0x0C00,
} as const;

export type HeldItemCategoryId = ObjectValues<typeof HeldItemCategoryId>;

const ITEM_CATEGORY_MASK = 0xFF00

export function getHeldItemCategory(itemId: HeldItemId): HeldItemCategoryId {
  return (itemId & ITEM_CATEGORY_MASK) as HeldItemCategoryId;
}

export function isCategoryId(id: number): id is HeldItemCategoryId {
  return (Object.values(HeldItemCategoryId) as number[]).includes(id);
}

export function isItemInCategory(itemId: HeldItemId, category: HeldItemCategoryId): boolean {
  return getHeldItemCategory(itemId) === category;
}

export function isItemInRequested(
  itemId: HeldItemId,
  requestedItems: (HeldItemCategoryId | HeldItemId)[]
): boolean {
  return requestedItems.some(entry => itemId === entry || (itemId & ITEM_CATEGORY_MASK) === entry);
}
