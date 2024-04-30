import { Species } from './data/enums/species';
import { Abilities } from "./data/enums/abilities";
import { Biome } from "./data/enums/biome";
import { Moves } from "./data/enums/moves";
import { WeatherType } from "./data/weather";

export const SEED_OVERRIDE = '';
export const STARTER_SPECIES_OVERRIDE = 0;
export const STARTER_FORM_OVERRIDE = 0;
export const STARTING_LEVEL_OVERRIDE = 0;
export const STARTING_WAVE_OVERRIDE = 0;
export const STARTING_BIOME_OVERRIDE = Biome.TOWN;
export const STARTING_MONEY_OVERRIDE = 0;
export const WEATHER_OVERRIDE = WeatherType.NONE;

export const ABILITY_OVERRIDE = Abilities.NONE;
export const MOVE_OVERRIDE = Moves.NONE;
export const OPP_SPECIES_OVERRIDE = 0;
export const OPP_ABILITY_OVERRIDE = Abilities.NONE;
export const OPP_MOVE_OVERRIDE = Moves.NONE;

export const OPP_SHINY_OVERRIDE = false;
export const OPP_VARIANT_OVERRIDE = 0;
