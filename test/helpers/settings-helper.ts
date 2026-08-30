import { SETTINGS_COLOR } from "#app/constants/colors";
import { audioManager } from "#app/global-audio-manager";
import { settings } from "#app/global-settings-manager";
import { BattleStyle } from "#enums/battle-style";
import { ExpGainsSpeed } from "#enums/exp-gains-speed";
import { ExpNotification } from "#enums/exp-notification";
import { HpBarSpeed } from "#enums/hp-bar-speed";
import { PlayerGender } from "#enums/player-gender";
import { TypeHints } from "#enums/type-hints";
import { VolumeSetting } from "#enums/volume-setting";
import type { GameManager } from "#test/framework/game-manager";
import { GameManagerHelper } from "#test/helpers/game-manager-helper";
import { getEnumStr } from "#test/utils/string-utils";
import chalk from "chalk";

/**
 * Helper to handle changing game settings for tests.
 */
export class SettingsHelper extends GameManagerHelper {
  constructor(game: GameManager) {
    super(game);

    this.initDefaultSettings();
  }

  /**
   * Initialize default settings upon starting a new test case.
   */
  private initDefaultSettings(): void {
    settings.update("general", "gameSpeed", 5);
    settings.update("display", "enableMoveAnimations", false);
    settings.update("display", "showStatsOnLevelUp", false);
    settings.update("general", "expGainsSpeed", ExpGainsSpeed.SKIP);
    settings.update("general", "partyExpNotificationMode", ExpNotification.SKIP);
    settings.update("general", "hpBarSpeed", HpBarSpeed.SKIP);
    settings.update("general", "enableTutorials", false);
    settings.update("general", "battleStyle", BattleStyle.SET);
    settings.update("general", "playerGender", PlayerGender.MALE);
    audioManager.setVolume(VolumeSetting.BGM, 0);
    audioManager.setVolume(VolumeSetting.FIELD, 0);
    audioManager.setVolume(VolumeSetting.MAIN, 0);
    audioManager.setVolume(VolumeSetting.SE, 0);
    audioManager.setVolume(VolumeSetting.UI, 0);
  }

  /**
   * Change the current {@linkcode BattleStyle}.
   * @param style - The `BattleStyle` to set
   * @returns `this`
   */
  public battleStyle(style: BattleStyle): this {
    settings.update("general", "battleStyle", style);
    this.log(`Battle Style set to ${getEnumStr(BattleStyle, style)}!`);
    return this;
  }

  /**
   * Change the current {@linkcode TypeHints} mode.
   * @param mode - The `TypeHints` mode to set
   * @returns `this`
   */
  public typeHints(mode: TypeHints): this {
    settings.update("display", "typeHintsMode", mode);
    this.log(`Type Hints set to ${getEnumStr(TypeHints, mode)}!`);
    return this;
  }

  /**
   * Toggle the option to skip level move confirmations
   * @param enable - Whether to enable or disable level move confirmations
   * @returns `this`
   */
  public levelMoveConfirmation(enable: boolean): this {
    settings.update("general", "levelMoveConfirmation", enable);
    this.log(`Level Move Confirmation ${enable ? "enabled" : "disabled"}!`);
    return this;
  }

  /**
   * Change the player character's selected gender.
   * @param gender - The {@linkcode PlayerGender} to set
   * @returns `this`
   */
  public playerGender(gender: PlayerGender): this {
    settings.update("general", "playerGender", gender);
    this.log(`Gender set to ${getEnumStr(PlayerGender, gender)}!`);
    return this;
  }

  /**
   * Change the current {@linkcode ExpGainsSpeed}.
   * @param speed - The speed to set
   * @returns `this`
   */
  public expGainsSpeed(speed: ExpGainsSpeed): this {
    settings.update("general", "expGainsSpeed", speed);
    this.log(`EXP Gain bar speed set to ${getEnumStr(ExpGainsSpeed, speed)}!`);
    return this;
  }

  private log(...params: any[]) {
    console.log(chalk.hex(SETTINGS_COLOR)(...params));
  }
}
