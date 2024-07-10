import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const menuUiHandler: SimpleTranslationEntries = {
  "GAME_SETTINGS": "Game Settings",
  "ACHIEVEMENTS": "Achievements",
  "STATS": "Stats",
  "VOUCHERS": "Vouchers",
  "EGG_LIST": "Egg List",
  "EGG_GACHA": "Egg Gacha",
  "MANAGE_DATA": "Manage Data",
  "COMMUNITY": "Community",
  "SAVE_AND_QUIT": "Save and Quit",
  "LOG_OUT": "Log Out",
  "slot": "Slot {{slotNumber}}",
  "importSession": "Import Session",
  "importSlotSelect": "Select a slot to import to.",
  "exportSession": "Export Session",
  "exportSlotSelect": "Select a slot to export from.",
  "importData": "Import Data",
  "exportData": "Export Data",
  "linkDiscord": "Link Discord",
  "unlinkDiscord": "Unlink Discord",
  "linkGoogle": "Link Google",
  "unlinkGoogle": "Unlink Google",
  "cancel": "Cancel",
  "losingProgressionWarning": "You will lose any progress since the beginning of the battle. Proceed?",
  "noEggs": "You are not hatching\nany eggs at the moment!"
} as const;
