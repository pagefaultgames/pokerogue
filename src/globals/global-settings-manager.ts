import { GameDataType } from "#enums/game-data-type";
import { defaultSettings } from "#system/default-settings";
import type { SettingsManager as GlobalSettingsManager } from "#system/settings-manager";

/** Singleton instance of {@linkcode GlobalSettingsManager | SettingsManager} */
export let settings: GlobalSettingsManager;

// This is necessary to allow the species data exporter script to function
export async function initSettingsManager(): Promise<void> {
  const { getDataTypeKey } = await import("#utils/data");
  const { SettingsManager } = await import("#system/settings-manager");

  settings = new SettingsManager(getDataTypeKey(GameDataType.SETTINGS), defaultSettings);
}
