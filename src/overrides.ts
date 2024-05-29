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
import { ModifierTier } from "./modifier/modifier-tier";
import { ModifierType, ModifierTypeOption, TmModifierType, ModifierTypeGenerator, modifierTypes } from "./modifier/modifier-type";

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
 * REWARD SELECTION OVERRIDES
 */
// How many rewards to select from if not 0, will be constrained to between 3 and 6.
export const REWARD_AMOUNT_OVERRIDE: integer = 0;
/**
 * Data for overriding the rewards in the post battle screen. Rewards overridden this way will appear as common tier regardless of its actual tier.
 * name: The name of the reward to use. Should match one of the values in modifierTypes in modifier-type.ts, 
 *    with the exception of TM_COMMON, TM_GREAT or TM_ULTRA. For those, just use TM (any string starting with TM will work).
 * type: Some types of rewards need a subtype specified for generation, they are:
 * - TempBattleStat is for TEMP_STAT_BOOSTER / X Items (Dire hit is separate)
 * - Stat is for BASE_STAT_BOOSTER / Vitamin
 * - Nature is for MINT
 * - Type is for TERA_SHARD or ATTACK_TYPE_BOOSTER (type boosting items i.e Silk Scarf)
 * - BerryType is for BERRY
 * - Moves is for TM. While you can choose moves that are not actually TMs, you should stick to them otherwise the number will appear as 000 and you will not be able to teach it to a Pokemon.
 */
interface RewardOverride {
  name: string
  type?: TempBattleStat|Stat|Nature|Type|BerryType|Moves
}
export const REWARD_OVERRIDES: Array<RewardOverride> = [];

/**
 * PLAYER OVERRIDES
 */

// forms can be found in pokemon-species.ts
export const STARTER_FORM_OVERRIDE: integer = 0;
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
    name: string,
    count?: integer
    type?: TempBattleStat|Stat|Nature|Type|BerryType
}
export const STARTING_MODIFIER_OVERRIDE: Array<ModifierOverride> = [];
export const OPP_MODIFIER_OVERRIDE: Array<ModifierOverride> = [];

export const STARTING_HELD_ITEMS_OVERRIDE: Array<ModifierOverride> = [];
export const OPP_HELD_ITEMS_OVERRIDE: Array<ModifierOverride> = [];

/**
 * Override applying methods
 */

/**
 * Applies the Reward override amount if it is set. Used when getting the number of rewards to get for the post battle item screen.
 * @param currentAmount The unoverridden reward amount.
 * @returns The overridden reward amount, or currentAmount if REWARD_AMOUNT_OVERRIDE is 0.
 */
export function tryOverridePostBattleRewardAmount(currentAmount:integer): integer {
  if (REWARD_AMOUNT_OVERRIDE) {
    currentAmount = REWARD_AMOUNT_OVERRIDE;
  }

  return currentAmount;
}

/**
   * Applies the reward options overrides to the selected rewards, if there have been any set.
   * @param options The current options list.
   * @returns The options list with any options that have been overridden.
   */
export function tryOverridePostBattleRewardOptions(options: ModifierTypeOption[]): ModifierTypeOption[] {
  if (REWARD_OVERRIDES) {
    for (let i = 0; i < REWARD_OVERRIDES.length && i < options.length; i++) {
      const name = REWARD_OVERRIDES[i].name;
      let overriddenModifier: ModifierType = null;
      // Special case for TMs since the other method will not work for TMs, particularly if we want it to have a specific move.
      if (name.startsWith("TM")) {
        if (REWARD_OVERRIDES[i].type) {
          overriddenModifier = new TmModifierType(REWARD_OVERRIDES[i].type as Moves);
        }
      }
      else {  
        const modif: ModifierType = modifierTypes[name]();
        if (modif instanceof ModifierTypeGenerator) {
          overriddenModifier = modif.generateType(null, [REWARD_OVERRIDES[i].type]).withIdFromFunc(modifierTypes[name]);
        } else {
          overriddenModifier = modif.withIdFromFunc(modifierTypes[name]);
        }
      }

      if (overriddenModifier) {
        // A tier must be specified otherwise the pokeball will just show an open great ball.
        // Since this is an override for testing purposes, just use common.
        overriddenModifier.setTier(ModifierTier.COMMON);
        options[i] = new ModifierTypeOption(overriddenModifier, 0);
      }
    }
  }

  return options;
}