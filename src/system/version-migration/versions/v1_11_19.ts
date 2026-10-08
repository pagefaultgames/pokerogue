import type { SettingsSaveMigrator } from "#types/save-migrators";

/**
 * Migrate old values of the game speed setting to new values
 * @param data - The `settings` object
 */
const fixGameSpeed = {
  name: "fixGameSpeed",
  version: "1.11.19",
  migrate: (data: object): void => {
    if (Object.hasOwn(data, "GAME_SPEED")) {
      const savedValue = data["GAME_SPEED"];
      let newValue = 3;
      if (savedValue <= 3) {
        newValue = 2;
      } else if (savedValue <= 5) {
        newValue = 3;
      } else if (savedValue <= 6) {
        newValue = 4;
      } else if (savedValue <= 7) {
        newValue = 5;
      }
      data["GAME_SPEED"] = newValue;
    }
  },
} as const satisfies SettingsSaveMigrator;

export const settingsMigrators = [fixGameSpeed] as const satisfies readonly SettingsSaveMigrator[];
