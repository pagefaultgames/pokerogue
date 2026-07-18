import { eventBus } from "#app/event-bus";
import { isDev } from "#constants/app-constants";
import { GameDataType } from "#enums/game-data-type";
import { MusicPreference } from "#enums/music-preference";
import { PlayerGender } from "#enums/player-gender";
import { SpriteSet } from "#enums/sprite-set";
import { UiTheme } from "#enums/ui-theme";
import { version } from "#package.json";
import { defaultSettings } from "#system/default-settings";
import { applySettingsVersionMigration } from "#system/version-converter";
import type { Settings, SettingsCategory, UserFacingSettings } from "#types/settings";
import { getDataTypeKey } from "#utils/data";

/** Manages game settings */
class SettingsManager {
  /** Local storage key for persisting settings. */
  public readonly lsKey: string;

  /** Internal buffer for current settings. */
  private readonly _settings: Settings;

  constructor(localStorageKey: string, initSettings: UserFacingSettings) {
    this.lsKey = localStorageKey;
    this._settings = {
      meta: {
        gameVersion: version,
      },
      ...initSettings,
    };

    this.loadFromLocalStorage();
  }

  /** Getter for meta settings */
  public get meta() {
    return this._settings.meta;
  }

  /** Getter for general settings */
  public get general() {
    return this._settings.general;
  }

  /** Getter for display settings */
  public get display() {
    return this._settings.display;
  }

  /** Getter for audio settings */
  public get audio() {
    return this._settings.audio;
  }

  /** Getter for gamepad settings */
  public get gamepad() {
    return this._settings.gamepad;
  }

  /** Getter for checking if experimental sprites are enabled */
  public get expSpritesEnabled(): boolean {
    return this.display.spriteSet === SpriteSet.EXPERIMENTAL;
  }

  /** Getter for checking if the player's gender is female */
  public get isPlayerFemale(): boolean {
    return this.general.playerGender === PlayerGender.FEMALE;
  }

  /** Getter for checking if the current UI theme is the legacy theme */
  public get isLegacyTheme(): boolean {
    return this.display.uiTheme === UiTheme.LEGACY;
  }

  /** Getter for checking if the music from all gens should be used */
  public get musicPreferenceAllGens(): boolean {
    return this.audio.musicPreference === MusicPreference.ALL_GENS;
  }

  /**
   * Updates a setting. Takes care of dispatching events and saving to local storage.
   * @param category - The category of the setting
   * @param key - The key of the setting
   * @param value - The updated value
   * @throws An error if an invalid category or key is encountered
   */
  public update<C extends SettingsCategory>(category: C, key: keyof UserFacingSettings[C], value: any) {
    if (!this._settings[category]) {
      eventBus.emit("settings/update/failed", { category, key, value });
      throw new Error(`Unknown category: ${category}`);
    }

    if (this._settings[category][key] == null) {
      eventBus.emit("settings/update/failed", { category, key, value });
      throw new Error(`Unknown key: ${category}.${String(key)}`);
    }

    this._settings[category][key] = value;
    eventBus.emit("settings/update/success", { category, key, value });

    this.saveToLocalStorage();
  }

  /**
   * Exectues a window reload after updating the setting.
   * @see {@linkcode update}
   * @param category - The category of the setting
   * @param key - The key of the setting
   * @param value - The updated value
   */
  updateAndReload<C extends SettingsCategory>(category: C, key: keyof UserFacingSettings[C], value: any) {
    this.update(category, key, value);
    window.location.reload();
  }

  /** Saves settings to local storage at {@linkcode lsKey} */
  private saveToLocalStorage() {
    localStorage.setItem(this.lsKey, JSON.stringify(this._settings));
    eventBus.emit("settings/saved", this._settings, this.lsKey);
  }

  /** Loads and populates settings from local storage at {@linkcode lsKey} */
  private loadFromLocalStorage() {
    const lsItem = localStorage.getItem(this.lsKey);

    if (lsItem) {
      try {
        const lsSettings: Partial<Settings> = JSON.parse(lsItem);

        applySettingsVersionMigration(lsSettings);

        const { general, audio, display, gamepad } = lsSettings;

        if (general) {
          this._settings.general = { ...this._settings.general, ...general };
        }
        if (!isDev) {
          this._settings.general.dexForDevs = false;
        }

        if (audio) {
          this._settings.audio = { ...this._settings.audio, ...audio };
        }

        if (display) {
          this._settings.display = { ...this._settings.display, ...display };
        }

        if (gamepad) {
          this._settings.gamepad = { ...this._settings.gamepad, ...gamepad };
        }
      } catch (err) {
        console.error("Error loading settings from local storage:", err);
      }
    }
  }
}

/** Singleton instance of {@linkcode SettingsManager} */
export const settings = new SettingsManager(getDataTypeKey(GameDataType.SETTINGS), defaultSettings);
