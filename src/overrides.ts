import { Abilities } from "#enums/abilities";
import { Biome } from "#enums/biome";
import { EggTier } from "#enums/egg-type";
import { Moves } from "#enums/moves";
import { PokeballType } from "#enums/pokeball";
import { Species } from "#enums/species";
import { StatusEffect } from "#enums/status-effect";
import { TimeOfDay } from "#enums/time-of-day";
import { VariantTier } from "#enums/variant-tiers";
import { WeatherType } from "#enums/weather-type";
import { type PokeballCounts } from "./battle-scene";
import { Gender } from "./data/gender";
import { allSpecies } from "./data/pokemon-species"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { Variant } from "./data/variant";
import { type ModifierOverride, type ModifierTypeKeys } from "./modifier/modifier-type";

/**
 * Overrides that are using when testing different in game situations
 *
 * Any override added here will be used instead of the value in {@linkcode DefaultOverrides}
 *
 * If an override name starts with "STARTING", it will apply when a new run begins
 *
 * @example
 * ```
 * const overrides = {
 *   ABILITY_OVERRIDE: Abilities.PROTEAN,
 *   PASSIVE_ABILITY_OVERRIDE: Abilities.PIXILATE,
 * }
 * ```
 */
const overrides = {} satisfies Partial<InstanceType<typeof DefaultOverrides>>;

/**
 * If you need to add Overrides values for local testing do that inside {@linkcode overrides}
 * ---
 * Defaults for Overrides that are used when testing different in game situations
 *
 * If an override name starts with "STARTING", it will apply when a new run begins
 */
class DefaultOverrides {
  // -----------------
  // OVERALL OVERRIDES
  // -----------------
  /** a specific seed (default: a random string of 24 characters) */
  readonly SEED_OVERRIDE: string = "";
  readonly WEATHER_OVERRIDE: WeatherType = WeatherType.NONE;
  readonly BATTLE_TYPE_OVERRIDE: "double" | "single" | null = null;
  readonly STARTING_WAVE_OVERRIDE: integer = 0;
  readonly STARTING_BIOME_OVERRIDE: Biome = Biome.TOWN;
  readonly ARENA_TINT_OVERRIDE: TimeOfDay = null;
  /** Multiplies XP gained by this value including 0. Set to null to ignore the override */
  readonly XP_MULTIPLIER_OVERRIDE: number = null;
  /** default 1000 */
  readonly STARTING_MONEY_OVERRIDE: integer = 0;
  /** Sets all shop item prices to 0 */
  readonly WAIVE_SHOP_FEES_OVERRIDE: boolean = false;
  /** Sets reroll price to 0 */
  readonly WAIVE_ROLL_FEE_OVERRIDE: boolean = false;
  readonly FREE_CANDY_UPGRADE_OVERRIDE: boolean = false;
  readonly POKEBALL_OVERRIDE: { active: boolean; pokeballs: PokeballCounts } = {
    active: false,
    pokeballs: {
      [PokeballType.POKEBALL]: 5,
      [PokeballType.GREAT_BALL]: 0,
      [PokeballType.ULTRA_BALL]: 0,
      [PokeballType.ROGUE_BALL]: 0,
      [PokeballType.MASTER_BALL]: 0,
    },
  };

  // ----------------
  // PLAYER OVERRIDES
  // ----------------
  /**
   * Set the form index of any starter in the party whose `speciesId` is inside this override
   * @see {@link allSpecies} in `src/data/pokemon-species.ts` for form indexes
   * @example
   * ```
   * const STARTER_FORM_OVERRIDES = {
   *   [Species.DARMANITAN]: 1
   * }
   * ```
   */
  readonly STARTER_FORM_OVERRIDES: Partial<Record<Species, number>> = {};

  /** default 5 or 20 for Daily */
  readonly STARTING_LEVEL_OVERRIDE: integer = 0;
  /**
   * SPECIES OVERRIDE
   * will only apply to the first starter in your party or each enemy pokemon
   * default is 0 to not override
   * @example SPECIES_OVERRIDE = Species.Bulbasaur;
   */
  readonly STARTER_SPECIES_OVERRIDE: Species | integer = 0;
  readonly ABILITY_OVERRIDE: Abilities = Abilities.NONE;
  readonly PASSIVE_ABILITY_OVERRIDE: Abilities = Abilities.NONE;
  readonly STATUS_OVERRIDE: StatusEffect = StatusEffect.NONE;
  readonly GENDER_OVERRIDE: Gender = null;
  readonly MOVESET_OVERRIDE: Array<Moves> = [];
  readonly SHINY_OVERRIDE: boolean = false;
  readonly VARIANT_OVERRIDE: Variant = 0;

  // --------------------------
  // OPPONENT / ENEMY OVERRIDES
  // --------------------------
  readonly OPP_SPECIES_OVERRIDE: Species | integer = 0;
  readonly OPP_LEVEL_OVERRIDE: number = 0;
  readonly OPP_ABILITY_OVERRIDE: Abilities = Abilities.NONE;
  readonly OPP_PASSIVE_ABILITY_OVERRIDE: Abilities = Abilities.NONE;
  readonly OPP_STATUS_OVERRIDE: StatusEffect = StatusEffect.NONE;
  readonly OPP_GENDER_OVERRIDE: Gender = null;
  readonly OPP_MOVESET_OVERRIDE: Array<Moves> = [];
  readonly OPP_SHINY_OVERRIDE: boolean = false;
  readonly OPP_VARIANT_OVERRIDE: Variant = 0;
  readonly OPP_IVS_OVERRIDE: integer | integer[] = [];

  // -------------
  // EGG OVERRIDES
  // -------------
  readonly EGG_IMMEDIATE_HATCH_OVERRIDE: boolean = false;
  readonly EGG_TIER_OVERRIDE: EggTier = null;
  readonly EGG_SHINY_OVERRIDE: boolean = false;
  readonly EGG_VARIANT_OVERRIDE: VariantTier = null;
  readonly EGG_FREE_GACHA_PULLS_OVERRIDE: boolean = false;
  readonly EGG_GACHA_PULL_COUNT_OVERRIDE: number = 0;

  // -------------------------
  // MODIFIER / ITEM OVERRIDES
  // -------------------------
  /**
   * Overrides labeled `MODIFIER` deal with any modifier so long as it doesn't require a party
   * member to hold it (typically this is, extends, or generates a {@linkcode ModifierType}),
   * like `EXP_SHARE`, `CANDY_JAR`, etc.
   *
   * Overrides labeled `HELD_ITEM` specifically pertain to any entry in {@linkcode modifierTypes} that
   * extends, or generates a {@linkcode PokemonHeldItemModifierType}, like `SOUL_DEW`, `TOXIC_ORB`, etc.
   *
   * Note that, if count is not provided, it will default to 1.
   *
   * Additionally, note that some held items and modifiers are grouped together via
   * a {@linkcode ModifierTypeGenerator} and require pre-generation arguments to get
   * a specific item from that group. If a type is not set, the generator will either
   * use the party to weight item choice or randomly pick an item.
   *
   * @example
   * ```
   * // Will have a quantity of 2 in-game
   * STARTING_MODIFIER_OVERRIDE = [{name: "EXP_SHARE", count: 2}]
   * // Will have a quantity of 1 in-game
   * STARTING_HELD_ITEM_OVERRIDE = [{name: "LUCKY_EGG"}]
   * // Type must be given to get a specific berry
   * STARTING_HELD_ITEM_OVERRIDE = [{name: "BERRY", type: BerryType.SITRUS}]
   * // A random berry will be generated at runtime
   * STARTING_HELD_ITEM_OVERRIDE = [{name: "BERRY"}]
   * ```
   */
  readonly STARTING_MODIFIER_OVERRIDE: Array<ModifierOverride> = [];
  readonly OPP_MODIFIER_OVERRIDE: Array<ModifierOverride> = [];

  readonly STARTING_HELD_ITEMS_OVERRIDE: Array<ModifierOverride> = [];
  readonly OPP_HELD_ITEMS_OVERRIDE: Array<ModifierOverride> = [];
  readonly NEVER_CRIT_OVERRIDE: boolean = false;

  /**
   * An array of items by keys as defined in the "modifierTypes" object in the "modifier/modifier-type.ts" file.
   * Items listed will replace the normal rolls.
   * If less items are listed than rolled, only some items will be replaced
   * If more items are listed than rolled, only the first X items will be shown, where X is the number of items rolled.
   */
  readonly ITEM_REWARD_OVERRIDE: Array<ModifierTypeKeys> = [];
}

export const defaultOverrides = new DefaultOverrides();

export default {
  ...defaultOverrides,
  ...overrides
} satisfies InstanceType<typeof DefaultOverrides>;
