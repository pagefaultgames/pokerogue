import { WeatherType } from "./data/weather";
import { Variant } from "./data/variant";
import { PokeballCounts } from "./battle-scene";
import { PokeballType } from "./data/pokeball";
import { Gender } from "./data/gender";
import { StatusEffect } from "./data/status-effect";
import { ModifierOverride } from "./modifier/modifier-type";
import { allSpecies } from "./data/pokemon-species"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { Abilities } from "#enums/abilities";
import { Biome } from "#enums/biome";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { TimeOfDay } from "#enums/time-of-day";
import {MysteryEncounterType} from "#enums/mystery-encounter-type"; // eslint-disable-line @typescript-eslint/no-unused-vars
import {MysteryEncounterTier} from "#app/data/mystery-encounter"; // eslint-disable-line @typescript-eslint/no-unused-vars

/**
 * Overrides for testing different in game situations
 * if an override name starts with "STARTING", it will apply when a new run begins
 */

/**
 * OVERALL OVERRIDES
 */

// a specific seed (default: a random string of 24 characters)
export const SEED_OVERRIDE: string = "";
export const WEATHER_OVERRIDE: WeatherType = WeatherType.NONE;
export const DOUBLE_BATTLE_OVERRIDE: boolean = false;
export const SINGLE_BATTLE_OVERRIDE: boolean = false;
export const STARTING_WAVE_OVERRIDE: integer = 0;
export const STARTING_BIOME_OVERRIDE: Biome = Biome.TOWN;
export const ARENA_TINT_OVERRIDE: TimeOfDay = null;
/** Multiplies XP gained by this value including 0. Set to null to ignore the override */
export const XP_MULTIPLIER_OVERRIDE: number = null;
export const NEVER_CRIT_OVERRIDE: boolean = false;
// default 1000
export const STARTING_MONEY_OVERRIDE: integer = 0;
export const FREE_CANDY_UPGRADE_OVERRIDE: boolean = false;
export const POKEBALL_OVERRIDE: { active: boolean, pokeballs: PokeballCounts } = {
  active: false,
  pokeballs: {
    [PokeballType.POKEBALL]: 5,
    [PokeballType.GREAT_BALL]: 0,
    [PokeballType.ULTRA_BALL]: 0,
    [PokeballType.ROGUE_BALL]: 0,
    [PokeballType.MASTER_BALL]: 0,
  }
};

/**
 * PLAYER OVERRIDES
 */

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
export const STARTER_FORM_OVERRIDES: Partial<Record<Species, number>> = {};

// default 5 or 20 for Daily
export const STARTING_LEVEL_OVERRIDE: integer = 0;
/**
 * SPECIES OVERRIDE
 * will only apply to the first starter in your party or each enemy pokemon
 * default is 0 to not override
 * @example SPECIES_OVERRIDE = Species.Bulbasaur;
 */
export const STARTER_SPECIES_OVERRIDE: Species | integer = 0;
export const ABILITY_OVERRIDE: Abilities = Abilities.NONE;
export const PASSIVE_ABILITY_OVERRIDE: Abilities = Abilities.NONE;
export const STATUS_OVERRIDE: StatusEffect = StatusEffect.NONE;
export const GENDER_OVERRIDE: Gender = null;
export const MOVESET_OVERRIDE: Array<Moves> = [];
export const SHINY_OVERRIDE: boolean = false;
export const VARIANT_OVERRIDE: Variant = 0;

/**
 * OPPONENT / ENEMY OVERRIDES
 */

export const OPP_SPECIES_OVERRIDE: Species | integer = 0;
export const OPP_LEVEL_OVERRIDE: number = 0;
export const OPP_ABILITY_OVERRIDE: Abilities = Abilities.NONE;
export const OPP_PASSIVE_ABILITY_OVERRIDE: Abilities = Abilities.NONE;
export const OPP_STATUS_OVERRIDE: StatusEffect = StatusEffect.NONE;
export const OPP_GENDER_OVERRIDE: Gender = null;
export const OPP_MOVESET_OVERRIDE: Array<Moves> = [];
export const OPP_SHINY_OVERRIDE: boolean = false;
export const OPP_VARIANT_OVERRIDE: Variant = 0;
export const OPP_IVS_OVERRIDE: integer | integer[] = [];

/**
 * EGG OVERRIDES
 */

export const EGG_IMMEDIATE_HATCH_OVERRIDE: boolean = false;
export const EGG_TIER_OVERRIDE: EggTier = null;
export const EGG_SHINY_OVERRIDE: boolean = false;
export const EGG_VARIANT_OVERRIDE: VariantTier = null;
export const EGG_FREE_GACHA_PULLS_OVERRIDE: boolean = false;
export const EGG_GACHA_PULL_COUNT_OVERRIDE: number = 0;

/**
 * MYSTERY ENCOUNTER OVERRIDES
 */

// 1 to 256, set to null to ignore
export const MYSTERY_ENCOUNTER_RATE_OVERRIDE: number = null;
export const MYSTERY_ENCOUNTER_TIER_OVERRIDE: MysteryEncounterTier = null;
export const MYSTERY_ENCOUNTER_OVERRIDE: MysteryEncounterType = null;

/**
 * MODIFIER / HELD ITEM OVERRIDES
 */

/** Override array of {@linkcode ModifierOverride}s used to provide modifiers to the player when starting a new game */
export const STARTING_MODIFIER_OVERRIDE: ModifierOverride[] = [];
/**
 * Override array of {@linkcode ModifierOverride}s used to provide modifiers to enemies.
 *
 * Note that any previous modifiers are cleared.
 */
export const OPP_MODIFIER_OVERRIDE: ModifierOverride[] = [];

/** Override array of {@linkcode ModifierOverride}s used to provide held items to first party member when starting a new game*/
export const STARTING_HELD_ITEMS_OVERRIDE: ModifierOverride[] = [];
/** Override array of {@linkcode ModifierOverride}s used to provide held items to enemies on spawn */
export const OPP_HELD_ITEMS_OVERRIDE: ModifierOverride[] = [];

/**
 * Override array of {@linkcode ModifierOverride}s used to replace the generated item rolls after a wave.
 *
 * If less entries are listed than rolled, only those entries will be used to replace the corresponding items while the rest randomly generated.
 * If more entries are listed than rolled, only the first X entries will be used, where X is the number of items rolled.
 *
 * Note that, for all items in the array, `count` is not used.
 */
export const ITEM_REWARD_OVERRIDE: ModifierOverride[] = [];
