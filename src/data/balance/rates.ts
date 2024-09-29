/**
 * Rates for shinies and other random properties are defined in this file.
 * CHANCE is defined as x/65536
 * RATE is defined as 1/x
 */

/** Encounterable properties */
/** `64/65536 -> 1/1024` */
export const BASE_SHINY_CHANCE = 64;

/** `256/65536 -> 1/256` */
export const BASE_HIDDEN_ABILITY_CHANCE = 256;

/** Egg properties */
// Rates for specific random properties in 1/x
export const GACHA_DEFAULT_SHINY_RATE = 128;
export const GACHA_SHINY_UP_SHINY_RATE = 64;
export const SAME_SPECIES_EGG_SHINY_RATE = 12;
export const SAME_SPECIES_EGG_HA_RATE = 8;
export const MANAPHY_EGG_MANAPHY_RATE = 8;
export const GACHA_EGG_HA_RATE = 192;

// 1/x for legendary eggs, 1/x*2 for epic eggs, 1/x*4 for rare eggs, and 1/x*8 for common eggs
export const GACHA_DEFAULT_RARE_EGGMOVE_RATE = 6;
export const SAME_SPECIES_EGG_RARE_EGGMOVE_RATE = 3;
export const GACHA_MOVE_UP_RARE_EGGMOVE_RATE = 3;
