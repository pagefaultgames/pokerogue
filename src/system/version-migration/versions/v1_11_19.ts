import { globalScene } from "#app/global-scene";
import { SettingKeys } from "#system/settings";
import type { SettingsSaveMigrator } from "#types/save-migrators";

/**
 * Migrate old values of {@linkcode SettingKeys.Game_Speed} property to reworked indexes
 * @param data - The `settings` object
 */
const fixGameSpeed: SettingsSaveMigrator = {
  version: "1.11.19",
  migrate: (data: object): void => {
    if (Object.hasOwn(data, SettingKeys.Game_Speed)) {
      const savedValue = data[SettingKeys.Game_Speed];
      let newValue = 1;
      if (savedValue <= 3) {
        newValue = 0;
        globalScene.gameSpeed = 2;
      } else if (savedValue <= 5) {
        newValue = 1;
        globalScene.gameSpeed = 3;
      } else if (savedValue <= 6) {
        newValue = 2;
        globalScene.gameSpeed = 4;
      } else if (savedValue <= 7) {
        newValue = 3;
        globalScene.gameSpeed = 5;
      }
      data[SettingKeys.Game_Speed] = newValue;
      localStorage.setItem("settings", JSON.stringify(data));
    }
  },
};

export const settingsMigrators: readonly SettingsSaveMigrator[] = [fixGameSpeed] as const;
