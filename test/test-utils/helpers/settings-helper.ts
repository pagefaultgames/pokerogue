import { SETTINGS_COLOR } from "#app/constants/colors";
import { BattleStyle } from "#enums/battle-style";
import { ExpGainsSpeed } from "#enums/exp-gains-speed";
import { ExpNotification } from "#enums/exp-notification";
import { PlayerGender } from "#enums/player-gender";
import type { GameManager } from "#test/test-utils/game-manager";
import { GameManagerHelper } from "#test/test-utils/helpers/game-manager-helper";
import { getEnumStr } from "#test/test-utils/string-utils";
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
    this.game.scene.gameSpeed = 5;
    this.game.scene.moveAnimations = false;
    this.game.scene.showLevelUpStats = false;
    this.game.scene.expGainsSpeed = ExpGainsSpeed.SKIP;
    this.game.scene.expParty = ExpNotification.SKIP;
    this.game.scene.hpBarSpeed = 3;
    this.game.scene.enableTutorials = false;
    this.game.scene.battleStyle = BattleStyle.SET;
    this.game.scene.gameData.gender = PlayerGender.MALE; // set initial player gender;
    this.game.scene.fieldVolume = 0;
  }

  /**
   * Change the current {@linkcode BattleStyle}.
   * @param style - The `BattleStyle` to set
   * @returns `this`
   */
  public battleStyle(style: BattleStyle): this {
    this.game.scene.battleStyle = style;
    this.log(`Battle Style set to ${getEnumStr(BattleStyle, style)}!`);
    return this;
  }

  /**
   * Toggle the availability of type hints.
   * @param enable - Whether to enable or disable type hints
   * @returns `this`
   */
  public typeHints(enable: boolean): this {
    this.game.scene.typeHints = enable;
    this.log(`Type Hints ${enable ? "enabled" : "disabled"}!`);
    return this;
  }

  /**
   * Toggle the option to skip level move confirmations
   * @param enable - Whether to enable or disable level move confirmations
   * @returns `this`
   */
  public skipLevelPrompt(enable: boolean): this {
    this.game.scene.hideMoveSkipConfirm = enable;
    this.log(`Skip Move Confirmtion ${enable ? "enabled" : "disabled"}!`);
    return this;
  }

  /**
   * Change the player character's selected gender.
   * @param gender - The {@linkcode PlayerGender} to set
   * @returns `this`
   */
  public playerGender(gender: PlayerGender): this {
    this.game.scene.gameData.gender = gender;
    this.log(`Gender set to ${getEnumStr(PlayerGender, gender)}!`);
    return this;
  }

  /**
   * Change the current {@linkcode ExpGainsSpeed}.
   * @param speed - The speed to set
   * @returns `this`
   */
  public expGainsSpeed(speed: ExpGainsSpeed): this {
    this.game.scene.expGainsSpeed = speed;
    this.log(`EXP Gain bar speed set to ${getEnumStr(ExpGainsSpeed, speed)}!`);
    return this;
  }

  private log(...params: any[]) {
    console.log(chalk.hex(SETTINGS_COLOR)(...params));
  }
}
