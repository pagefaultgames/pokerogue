import { Species } from "./data/enums/species";
import { Abilities } from "./data/enums/abilities";
import { Biome } from "./data/enums/biome";
import { Moves } from "./data/enums/moves";
import { WeatherType } from "./data/weather";
import { Variant } from "./data/variant";
import { BerryType } from "./data/berry";
import { TempBattleStat } from "./data/temp-battle-stat";
import { Nature } from "./data/nature";
import { Type } from "./data/type";
import { Stat } from "./data/pokemon-stat";
import { PokeballCounts } from "./battle-scene";
import { PokeballType } from "./data/pokeball";
import {TimeOfDay} from "#app/data/enums/time-of-day";
import { Gender } from "./data/gender";
import { StatusEffect } from "./data/status-effect";
import { modifierTypes } from "./modifier/modifier-type";

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
export const STARTING_WAVE_OVERRIDE: integer = 0;
export const STARTING_BIOME_OVERRIDE: Biome = Biome.TOWN;
export const ARENA_TINT_OVERRIDE: TimeOfDay = null;
// Multiplies XP gained by this value including 0. Set to null to ignore the override
export const XP_MULTIPLIER_OVERRIDE: number = null;
export const IMMEDIATE_HATCH_EGGS_OVERRIDE: boolean = false;
// default 1000
export const STARTING_MONEY_OVERRIDE: integer = 0;
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

// default 5 or 20 for Daily
export const STARTING_LEVEL_OVERRIDE: integer = 0;
interface StarterOverride {
    /**
   * SPECIES OVERRIDE
   * will apply to each starter in your party
   * default is 0 to not override
   * @example STARTER_OVERRIDE.species = Species.Bulbasaur;
   */

  species: Species | integer;
  // forms can be found in pokemon-species.ts
  form: integer;
  ability: Abilities;
  passiveAbility: Abilities;
  status: StatusEffect;
  gender: Gender;
  moveset: Moves[];
  shiny: boolean;
  shinyVariant: Variant;
}
export const STARTER_OVERRIDE: StarterOverride[] = [
  {
    species: 0,
    form: 0,
    ability: Abilities.NONE,
    passiveAbility: Abilities.NONE,
    status: StatusEffect.NONE,
    gender: null,
    moveset: [],
    shiny: false,
    shinyVariant: 0,
  },
  {
    species: 0,
    form: 0,
    ability: Abilities.NONE,
    passiveAbility: Abilities.NONE,
    status: StatusEffect.NONE,
    gender: null,
    moveset: [],
    shiny: false,
    shinyVariant: 0,
  },
  {
    species: 0,
    form: 0,
    ability: Abilities.NONE,
    passiveAbility: Abilities.NONE,
    status: StatusEffect.NONE,
    gender: null,
    moveset: [],
    shiny: false,
    shinyVariant: 0,
  },
  {
    species: 0,
    form: 0,
    ability: Abilities.NONE,
    passiveAbility: Abilities.NONE,
    status: StatusEffect.NONE,
    gender: null,
    moveset: [],
    shiny: false,
    shinyVariant: 0,
  },
  {
    species: 0,
    form: 0,
    ability: Abilities.NONE,
    passiveAbility: Abilities.NONE,
    status: StatusEffect.NONE,
    gender: null,
    moveset: [],
    shiny: false,
    shinyVariant: 0,
  },
  {
    species: 0,
    form: 0,
    ability: Abilities.NONE,
    passiveAbility: Abilities.NONE,
    status: StatusEffect.NONE,
    gender: null,
    moveset: [],
    shiny: false,
    shinyVariant: 0,
  }
];

/**
 * OPPONENT / ENEMY OVERRIDES
 */

export const OPP_SPECIES_OVERRIDE: Species | integer = 0;
export const OPP_LEVEL_OVERRIDE: number = 0;
export const OPP_ABILITY_OVERRIDE: Abilities = Abilities.NONE;
export const OPP_PASSIVE_ABILITY_OVERRIDE = Abilities.NONE;
export const OPP_STATUS_OVERRIDE: StatusEffect = StatusEffect.NONE;
export const OPP_GENDER_OVERRIDE: Gender = null;
export const OPP_MOVESET_OVERRIDE: Array<Moves> = [];
export const OPP_SHINY_OVERRIDE: boolean = false;
export const OPP_VARIANT_OVERRIDE: Variant = 0;

/**
 * MODIFIER / ITEM OVERRIDES
 * if count is not provided, it will default to 1
 * @example Modifier Override [{name: "EXP_SHARE", count: 2}]
 * @example Held Item Override [{name: "LUCKY_EGG"}]
 *
 * Some items are generated based on a sub-type (i.e. berries), to override those:
 * @example [{name: "BERRY", count: 5, type: BerryType.SITRUS}]
 * types are listed in interface below
 * - TempBattleStat is for TEMP_STAT_BOOSTER / X Items (Dire hit is separate)
 * - Stat is for BASE_STAT_BOOSTER / Vitamin
 * - Nature is for MINT
 * - Type is for TERA_SHARD or ATTACK_TYPE_BOOSTER (type boosting items i.e Silk Scarf)
 * - BerryType is for BERRY
 */
interface ModifierOverride {
    name: keyof typeof modifierTypes & string,
    count?: integer
    type?: TempBattleStat|Stat|Nature|Type|BerryType
}
export const STARTING_MODIFIER_OVERRIDE: Array<ModifierOverride> = [];
export const OPP_MODIFIER_OVERRIDE: Array<ModifierOverride> = [];

export const STARTING_HELD_ITEMS_OVERRIDE: Array<ModifierOverride> = [];
export const OPP_HELD_ITEMS_OVERRIDE: Array<ModifierOverride> = [];
