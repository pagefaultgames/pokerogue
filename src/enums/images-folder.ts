import type { ObjectValues } from "#types/type-helpers";

/**
 * Paths of various subfolders found in `public/images`.
 *
 * @todo Replace use of these strings in the code with this enum
 */
export const ImagesFolder = {
  ROOT: "",
  ARENAS: "arenas", // Biome illustrations
  BATTLE_ANIMS: "battle_anims", // Battle animations
  CG: "cg", // Full screen illustrations (end of game)
  CHARACTER: "character", // Dialogue portraits
  EFFECTS: "effects", // Special animations (shiny sparkles, tera, ...)
  EGG: "egg", // Egg hatching and gacha images and animations
  BANNERS: "banners", // Banners for in game events or updates
  INPUTS: "inputs", // Icons for gamepad buttons / keyboard keys
  ITEMS: "items", // Icons for items (should only be used to create the items atlas)
  ME: "mystery-encounters", // ME specific images
  POKEBALL: "pokeball", // Pokeball icons and animations (should only be used to create the p(oke)b(all) atlas)
  STATUS_ICONS: "status_icons", // English status icons (should only be used to create the statuses atlas, or unused?)
  TRAINER: "trainer", // Trainer sprites
  // Pokemon sprites
  POKEMON: "pokemon",
  POKEMON_BACK: "pokemon/back",
  POKEMON_FEMALE: "pokemon/female",
  POKEMON_ICONS: "pokemon/icons",
  POKEMON_SHINY: "pokemon/shiny",
  POKEMON_VARIANT: "pokemon/variant",
  // UI elements
  UI: "ui",
  UI_CURSORS: "ui/cursors",
  UI_GAME_ICONS: "ui/game-icons", // pokemon specific icons (candy, ribbon, ...)
  UI_MENU_ICONS: "ui/menu-icons", // generic icons (save, settings, ...)
  UI_NOTIFICATION_BARS: "ui/notification-bars", // ability, achievement bars, ...
  UI_PARTY: "ui/party",
  UI_PB_INFO: "ui/pokemon-info", // battle information (nameplate, hp, exp, ...)
  UI_STATUS_ICONS: "ui/status-icons", // localized status icons
  UI_SUMMARY: "ui/summary",
  UI_TIME_OF_DAY: "ui/time-of-day",
  UI_TYPE_ICONS: "ui/type-icons", // localized type icons
  UI_WINDOWS: "ui/windows",
} as const;

export type ImagesFolder = ObjectValues<typeof ImagesFolder>;
