import { Species } from './data/enums/species';
import { Abilities } from "./data/enums/abilities";
import { Biome } from "./data/enums/biome";
import { Moves } from "./data/enums/moves";
import { WeatherType } from "./data/weather";
import { Variant } from './data/variant';

/*
*  Overrides for testing different in game situations
*/

interface ModifierOverride {
    modifierName: string,
    count?: integer
}

// overall overrides
export const SEED_OVERRIDE: string = '';
export const WEATHER_OVERRIDE: WeatherType = WeatherType.NONE;
export const DOUBLE_BATTLE_OVERRIDE: boolean = false;
export const STARTING_WAVE_OVERRIDE: integer = 0;
export const STARTING_BIOME_OVERRIDE: Biome = Biome.TOWN;
export const STARTING_MONEY_OVERRIDE: integer = 0;


// player overrides
export const STARTER_SPECIES_OVERRIDE: Species | 0 = 0;
export const STARTER_FORM_OVERRIDE: integer = 0;
export const STARTING_LEVEL_OVERRIDE: integer = 0;
export const ABILITY_OVERRIDE: Abilities = Abilities.NONE;
export const PASSIVE_ABILITY_OVERRIDE: Abilities = Abilities.NONE;
export const MOVESET_OVERRIDE: Array<Moves> = [];
export const STARTING_MODIFIER_OVERRIDE: Array<ModifierOverride> = []; 
export const STARTING_HELD_ITEMS_OVERRIDE: Array<ModifierOverride> = []; 

// opponent overrides
export const OPP_SPECIES_OVERRIDE: Species | 0 = 0;
export const OPP_ABILITY_OVERRIDE: Abilities = Abilities.NONE;
export const OPP_PASSIVE_ABILITY_OVERRIDE = Abilities.NONE;
export const OPP_MOVESET_OVERRIDE: Array<Moves> = [];
export const OPP_SHINY_OVERRIDE: boolean = false;
export const OPP_VARIANT_OVERRIDE: Variant = 0;
export const OPP_HELD_ITEMS_OVERRIDE: Array<ModifierOverride> = []; 
export const OPP_MODIFIER_OVERRIDE: Array<ModifierOverride> = []; 