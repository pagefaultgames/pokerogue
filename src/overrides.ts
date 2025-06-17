import { type PokeballCounts } from "#app/battle-scene";
import { EvolutionItem } from "#app/data/balance/pokemon-evolutions";
import { Gender } from "#app/data/gender";
import { FormChangeItem } from "#enums/form-change-item";
import { type ModifierOverride } from "#app/modifier/modifier-type";
import { Variant } from "#app/sprites/variant";
import { Unlockables } from "#enums/unlockables";
import { AbilityId } from "#enums/ability-id";
import { BattleType } from "#enums/battle-type";
import { BerryType } from "#enums/berry-type";
import { BiomeId } from "#enums/biome-id";
import { EggTier } from "#enums/egg-type";
import { MoveId } from "#enums/move-id";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { PokeballType } from "#enums/pokeball";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
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
 *   ABILITY_OVERRIDE: AbilityId.PROTEAN,
 *   PASSIVE_ABILITY_OVERRIDE: AbilityId.PIXILATE,
 * }
 * ```
 */
const overrides = {} satisfies Partial<InstanceType<OverridesType>>;

/**
 * If you need to add Overrides values for local testing do that inside {@linkcode overrides}
 * ---
 * Defaults for Overrides that are used when testing different in game situations
 *
 * If an override name starts with "STARTING", it will only apply when a new run begins.
 */
class DefaultOverrides {
  // -----------------
  // OVERALL OVERRIDES
  // -----------------
  /** a specific seed (default: a random string of 24 characters) */
  readonly SEED_OVERRIDE: string = "";
  readonly DAILY_RUN_SEED_OVERRIDE: string | null = null;
  readonly WEATHER_OVERRIDE: WeatherType = WeatherType.NONE;
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
  readonly STARTING_BIOME_OVERRIDE: BiomeId | null = null;
  readonly ARENA_TINT_OVERRIDE: TimeOfDay | null = null;
  /** Multiplies XP gained by this value including 0. Set to null to ignore the override. */
  readonly XP_MULTIPLIER_OVERRIDE: number | null = null;
  /** Sets the level cap to this number during experience gain calculations. Set to `0` to disable override & use normal wave-based level caps,
  or any negative number to set it to 9 quadrillion (effectively disabling it). */
  readonly LEVEL_CAP_OVERRIDE: number = 0;
  /**
   * If defined, overrides random critical hit rolls to always or never succeed.
   * Ignored if the move is guaranteed to always/never crit.
   */
  readonly CRITICAL_HIT_OVERRIDE: boolean | null = null;
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
   * @see {@link allSpecies} in `src/data/pokemon-species.ts` for form indexes
   * @example
   * ```
   * const STARTER_FORM_OVERRIDES = {
   *   [SpeciesId.DARMANITAN]: 1
   * }
   * ```
   */
  readonly STARTER_FORM_OVERRIDES: Partial<Record<SpeciesId, number>> = {};

  /** default 5 or 20 for Daily */
  readonly STARTING_LEVEL_OVERRIDE: number = 0;
  /**
   * SPECIES OVERRIDE
   * will only apply to the first starter in your party or each enemy pokemon
   * default is 0 to not override
   * @example SPECIES_OVERRIDE = SpeciesId.Bulbasaur;
   */
  readonly STARTER_SPECIES_OVERRIDE: SpeciesId | number = 0;
  /**
   * This will force your starter to be a random fusion
   */
  readonly STARTER_FUSION_OVERRIDE: boolean = false;
  /**
   * This will override the species of the fusion
   */
  readonly STARTER_FUSION_SPECIES_OVERRIDE: SpeciesId | number = 0;
  readonly ABILITY_OVERRIDE: AbilityId = AbilityId.NONE;
  readonly PASSIVE_ABILITY_OVERRIDE: AbilityId = AbilityId.NONE;
  readonly HAS_PASSIVE_ABILITY_OVERRIDE: boolean | null = null;
  readonly STATUS_OVERRIDE: StatusEffect = StatusEffect.NONE;
  readonly GENDER_OVERRIDE: Gender | null = null;
  readonly MOVESET_OVERRIDE: MoveId | Array<MoveId> = [];
  readonly SHINY_OVERRIDE: boolean | null = null;
  readonly VARIANT_OVERRIDE: Variant | null = null;

  // --------------------------
  // OPPONENT / ENEMY OVERRIDES
  // --------------------------
  readonly OPP_SPECIES_OVERRIDE: SpeciesId | number = 0;
  /**
   * This will make all opponents fused Pokemon
   */
  readonly OPP_FUSION_OVERRIDE: boolean = false;
  /**
   * This will override the species of the fusion only when the opponent is already a fusion
   */
  readonly OPP_FUSION_SPECIES_OVERRIDE: SpeciesId | number = 0;
  readonly OPP_LEVEL_OVERRIDE: number = 0;
  readonly OPP_ABILITY_OVERRIDE: AbilityId = AbilityId.NONE;
  readonly OPP_PASSIVE_ABILITY_OVERRIDE: AbilityId = AbilityId.NONE;
  readonly OPP_HAS_PASSIVE_ABILITY_OVERRIDE: boolean | null = null;
  readonly OPP_STATUS_OVERRIDE: StatusEffect = StatusEffect.NONE;
  readonly OPP_GENDER_OVERRIDE: Gender | null = null;
  readonly OPP_MOVESET_OVERRIDE: MoveId | Array<MoveId> = [];
  readonly OPP_SHINY_OVERRIDE: boolean | null = null;
  readonly OPP_VARIANT_OVERRIDE: Variant | null = null;
  readonly OPP_IVS_OVERRIDE: number | number[] = [];
  readonly OPP_FORM_OVERRIDES: Partial<Record<SpeciesId, number>> = {};
  /**
   * Override to give the enemy Pokemon a given amount of health segments
   *
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
   * `1` (almost never) to `256` (always), set to `null` to disable the override
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
   * If less entries are listed than rolled, only those entries will be used to replace the corresponding items while the rest randomly generated.
   * If more entries are listed than rolled, only the first X entries will be used, where X is the number of items rolled.
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
  ...overrides,
} satisfies InstanceType<typeof DefaultOverrides>;

export type BattleStyle = "double" | "single" | "even-doubles" | "odd-doubles";

export type RandomTrainerOverride = {
  /** The Type of trainer to force */
  trainerType: Exclude<TrainerType, TrainerType.UNKNOWN>;
  /* If the selected trainer type has a double version, it will always use its double version. */
  alwaysDouble?: boolean;
};

/** The type of the {@linkcode DefaultOverrides} class */
export type OverridesType = typeof DefaultOverrides;
