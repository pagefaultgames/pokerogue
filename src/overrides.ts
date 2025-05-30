import { type PokeballCounts } from "#app/battle-scene";
import { EvolutionItem } from "#app/data/balance/pokemon-evolutions";
import { Gender } from "#app/data/gender";
import { FormChangeItem } from "#app/data/pokemon-forms";
import { type ModifierOverride } from "#app/modifier/modifier-type";
import { Variant } from "#app/sprites/variant";
import { Unlockables } from "#app/system/unlockables";
import { Abilities } from "#enums/abilities";
import { BattleType } from "#enums/battle-type";
import { BerryType } from "#enums/berry-type";
import { Biome } from "#enums/biome";
import { EggTier } from "#enums/egg-type";
import { Moves } from "#enums/moves";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { PokeballType } from "#enums/pokeball";
import { PokemonType } from "#enums/pokemon-type";
import { Species } from "#enums/species";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { TimeOfDay } from "#enums/time-of-day";
import { TrainerType } from "#enums/trainer-type";
import { VariantTier } from "#enums/variant-tier";
import { WeatherType } from "#enums/weather-type";

/**
 * This comment block exists to prevent IDEs from automatically removing unused imports
 * {@linkcode BerryType}, {@linkcode EvolutionItem}, {@linkcode FormChangeItem}
 * {@linkcode Stat}, {@linkcode PokemonType}
 */
/**
 * Overrides that are using when testing different in game situations
 *
 * Any override added here will be used instead of the value in {@linkcode DefaultOverrides}
 *
 * If an override name starts with "STARTING", it will only apply when a new run begins.
 *
 * @example
 * ```
 * const overrides = {
 *   ABILITY_OVERRIDE: Abilities.PROTEAN,
 *   PASSIVE_ABILITY_OVERRIDE: Abilities.PIXILATE,
 * }
 * ```
 */
const overrides = {} satisfies Partial<InstanceType<OverridesType>>;

/**
 * If you need to add Overrides values for local testing do that inside {@linkcode overrides}
 * ---
 * Defaults for Overrides that are used when testing different in-game situations.
 *
 * If an override name starts with "STARTING", it will only apply when a new run begins.
 */
class DefaultOverrides {
  // -----------------
  // OVERALL OVERRIDES
  // -----------------

  /** Overrides run initial RNG seed. If empty or `null`, defaults to a random string of 24 characters. */
  readonly SEED_OVERRIDE: string | null = null;
  /**
   * Overrides starting RNG seed used for daily run generation.
   * If empty or `null`, defaults to a base-64 representation of the current ISO clock date
   * (YYYY-MM-DD).
   */
  readonly DAILY_RUN_SEED_OVERRIDE: string | null = null;
  readonly WEATHER_OVERRIDE: WeatherType | null = null;
  /**
   * If `null`, ignore this override.
   *
   * If `"single"`, set every non-trainer battle to be a single battle.
   *
   * If `"double"`, set every battle (including trainer battles) to be a double battle.
   *
   * If `"even-doubles"`, follow the `"double"` rule on even wave numbers, and follow the `"single"` rule on odd wave numbers.
   *
   * If `"odd-doubles"`, follow the `"double"` rule on odd wave numbers, and follow the `"single"` rule on even wave numbers.
   */
  readonly BATTLE_STYLE_OVERRIDE: BattleStyle | null = null;
  readonly STARTING_WAVE_OVERRIDE: number = 0;
  readonly STARTING_BIOME_OVERRIDE: Biome | null = null;
  readonly ARENA_TINT_OVERRIDE: TimeOfDay | null = null;
  /**
   * Overrides the XP multiplier used during experience gain calculations.
   * Set to `0` or lower to disable XP gains completely, or `null` to disable the override.
   */
  readonly XP_MULTIPLIER_OVERRIDE: number | null = null;
  /**
   * Overrides the level cap used during experience gain calculations.
   * Set to `0` to disable override & use normal wave-based level caps,
   * or any negative number to set it to `Number.MAX_SAFE_INTEGER` (effectively disabling it).
   */
  readonly LEVEL_CAP_OVERRIDE: number = 0;
  readonly NEVER_CRIT_OVERRIDE: boolean = false;
  /** default 1000 */
  readonly STARTING_MONEY_OVERRIDE: number = 0;
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
  /** Forces an item to be UNLOCKED */
  readonly ITEM_UNLOCK_OVERRIDE: Unlockables[] = [];
  /** Set to `true` to show all tutorials */
  readonly BYPASS_TUTORIAL_SKIP_OVERRIDE: boolean = false;
  /** Set to `true` to be able to re-earn already unlocked achievements */
  readonly ACHIEVEMENTS_REUNLOCK_OVERRIDE: boolean = false;
  /**
   * Set to `true` to force Paralysis and Freeze to always activate,
   * or `false` to force them to not activate (or clear for freeze).
   */
  readonly STATUS_ACTIVATION_OVERRIDE: boolean | null = null;
  /**
   * Set to `true` to force confusion to always trigger,
   * or `false` to force it to never trigger.
   */
  readonly CONFUSION_ACTIVATION_OVERRIDE: boolean | null = null;

  // ----------------
  // PLAYER OVERRIDES
  // ----------------
  /**
   * Set the form index of any starter in the party whose `speciesId` is inside this override
   * @see {@linkcode allSpecies} in `src/data/pokemon-species.ts` for form indices
   * @example
   * ```ts
   * const STARTER_FORM_OVERRIDES = {
   *   [Species.DARMANITAN]: 1
   * }
   * ```
   */
  readonly STARTER_FORM_OVERRIDES: Partial<Record<Species, number>> = {};

  /**
   * Override player party starting level.
   * Defaults to normal starting levels for game mode if `0` or less.
   */
  readonly STARTING_LEVEL_OVERRIDE: number = 0;
  /**
   * If defined, this will override the species of the first starter in your party.
   * default is `null` to not override
   * @example STARTER_SPECIES_OVERRIDE = Species.BULBASAUR;
   */
  readonly STARTER_SPECIES_OVERRIDE: Species | null = null;
  /**
   * Set to `true` to force your starter to be a random fusion (similar to Spliced Endless).
   */
  readonly STARTER_FUSION_OVERRIDE: boolean = false;
  /**
   * Overrides player random fusion species (à la Spliced Endless) if starter fusion is enabled.
   * Set to `null` to disable and use random fusion species.
   */
  readonly STARTER_FUSION_SPECIES_OVERRIDE: Species | null = null;
  readonly ABILITY_OVERRIDE: Abilities = Abilities.NONE;
  readonly PASSIVE_ABILITY_OVERRIDE: Abilities = Abilities.NONE;
  readonly HAS_PASSIVE_ABILITY_OVERRIDE: boolean | null = null;
  readonly STATUS_OVERRIDE: StatusEffect = StatusEffect.NONE;
  readonly GENDER_OVERRIDE: Gender | null = null;
  readonly MOVESET_OVERRIDE: Moves | Array<Moves> = [];
  readonly SHINY_OVERRIDE: boolean | null = null;
  readonly VARIANT_OVERRIDE: Variant | null = null;

  // --------------------------
  // OPPONENT / ENEMY OVERRIDES
  // --------------------------
  readonly OPP_SPECIES_OVERRIDE: Species | null = null;
  /**
   * Set to `true` to force all enemy pokemon to be random fusions (similar to Spliced Endless/Fusion Tokens).
   */
  readonly OPP_FUSION_OVERRIDE: boolean = false;
  /**
   * Overrides enemy random fusion species (à la Spliced Endless) for enemies with fusions.
   * Set to `null` to disable and use random fusion species.
   */
  readonly OPP_FUSION_SPECIES_OVERRIDE: Species | null = null;
  readonly OPP_LEVEL_OVERRIDE: number = 0;
  readonly OPP_ABILITY_OVERRIDE: Abilities = Abilities.NONE;
  readonly OPP_PASSIVE_ABILITY_OVERRIDE: Abilities = Abilities.NONE;
  readonly OPP_HAS_PASSIVE_ABILITY_OVERRIDE: boolean | null = null;
  readonly OPP_STATUS_OVERRIDE: StatusEffect = StatusEffect.NONE;
  readonly OPP_GENDER_OVERRIDE: Gender | null = null;
  readonly OPP_MOVESET_OVERRIDE: Moves | Array<Moves> = [];
  readonly OPP_SHINY_OVERRIDE: boolean | null = null;
  readonly OPP_VARIANT_OVERRIDE: Variant | null = null;
  readonly OPP_IVS_OVERRIDE: number | number[] = [];
  readonly OPP_FORM_OVERRIDES: Partial<Record<Species, number>> = {};
  /**
   * Overrides enemy Pokemon's health segments
   * 0 (default): the health segments will be handled normally based on wave, level and species
   * 1: the Pokemon will have a single health segment and therefore will not be a boss
   * 2+: the Pokemon will be a boss with the given number of health segments
   */
  readonly OPP_HEALTH_SEGMENTS_OVERRIDE: number = 0;

  // -------------
  // EGG OVERRIDES
  // -------------
  readonly EGG_IMMEDIATE_HATCH_OVERRIDE: boolean = false;
  readonly EGG_TIER_OVERRIDE: EggTier | null = null;
  readonly EGG_SHINY_OVERRIDE: boolean = false;
  readonly EGG_VARIANT_OVERRIDE: VariantTier | null = null;
  readonly EGG_FREE_GACHA_PULLS_OVERRIDE: boolean = false;
  readonly EGG_GACHA_PULL_COUNT_OVERRIDE: number = 0;
  readonly UNLIMITED_EGG_COUNT_OVERRIDE: boolean = false;

  // -------------------------
  // MYSTERY ENCOUNTER OVERRIDES
  // -------------------------

  /**
   * Override chance of encountering a Mystery Encounter (out of 256).
   * Also disables the required 3 wave gap between successive MEs if defined.
   * Ranges from `0` (never) to `256` (always); set to `null` to disable the override
   *
   * Note: Make sure `STARTING_WAVE_OVERRIDE > 10`, otherwise MEs won't trigger
   */
  readonly MYSTERY_ENCOUNTER_RATE_OVERRIDE: number | null = null;
  readonly MYSTERY_ENCOUNTER_TIER_OVERRIDE: MysteryEncounterTier | null = null;
  readonly MYSTERY_ENCOUNTER_OVERRIDE: MysteryEncounterType | null = null;

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
  readonly STARTING_MODIFIER_OVERRIDE: ModifierOverride[] = [];
  /**
   * Override array of {@linkcode ModifierOverride}s used to provide modifiers to enemies.
   *
   * Note that any previous modifiers are cleared.
   */
  readonly OPP_MODIFIER_OVERRIDE: ModifierOverride[] = [];

  /** Override array of {@linkcode ModifierOverride}s used to provide held items to first party member when starting a new game. */
  readonly STARTING_HELD_ITEMS_OVERRIDE: ModifierOverride[] = [];
  /** Override array of {@linkcode ModifierOverride}s used to provide held items to enemies on spawn. */
  readonly OPP_HELD_ITEMS_OVERRIDE: ModifierOverride[] = [];

  /**
   * Override array of {@linkcode ModifierOverride}s used to replace the generated item rolls after a wave.
   *
   * If less entries are listed than rolled, the remaining entries will be randomly generated as normal.
   * If more entries are listed than rolled, any excess items are ignored.
   *
   * Note that, for all items in the array, `count` is not used.
   */
  readonly ITEM_REWARD_OVERRIDE: ModifierOverride[] = [];

  /**
   * If `true`, disable all non-scripted opponent trainer encounters.
   */
  readonly DISABLE_STANDARD_TRAINERS_OVERRIDE: boolean = false;

  /**
   * Set all non-scripted waves to use the selected battle type.
   *
   * Ignored if set to {@linkcode BattleType.TRAINER} and `DISABLE_STANDARD_TRAINERS_OVERRIDE` is `true`.
   */
  readonly BATTLE_TYPE_OVERRIDE: Exclude<BattleType, BattleType.CLEAR> | null = null;

  /** Force all random trainer types to be the provided type. */
  readonly RANDOM_TRAINER_OVERRIDE: RandomTrainerOverride | null = null;
}

export const defaultOverrides = new DefaultOverrides();

export default {
  ...defaultOverrides,
  ...overrides
} satisfies InstanceType<typeof DefaultOverrides>;

export type BattleStyle = "double" | "single" | "even-doubles" | "odd-doubles";

export type RandomTrainerOverride = {
  /** The Type of trainer to force */
  trainerType: Exclude<TrainerType, TrainerType.UNKNOWN>,
  /* If the selected trainer type has a double version, it will always use its double version. */
  alwaysDouble?: boolean
}

/** The type of the {@linkcode DefaultOverrides} class */
export type OverridesType = typeof DefaultOverrides;
