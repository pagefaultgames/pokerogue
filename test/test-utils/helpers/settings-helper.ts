import { SETTINGS_COLOR } from "#app/constants/colors";
import { BattleStyle } from "#enums/battle-style";
import { ExpGainsSpeed } from "#enums/exp-gains-speed";
import { PlayerGender } from "#enums/player-gender";
import { GameManagerHelper } from "#test/test-utils/helpers/game-manager-helper";
import chalk from "chalk";

/**
 * Helper to handle settings for tests
 */
export class SettingsHelper extends GameManagerHelper {
  private _battleStyle: BattleStyle = BattleStyle.SET;

  get battleStyle(): BattleStyle {
    return this._battleStyle;
  }

  /**
   * Change the battle style to Switch or Set mode (tests default to {@linkcode BattleStyle.SET})
   * @param mode {@linkcode BattleStyle.SWITCH} or {@linkcode BattleStyle.SET}
   */
  set battleStyle(mode: BattleStyle.SWITCH | BattleStyle.SET) {
    this._battleStyle = mode;
  }

  /**
   * Disable/Enable type hints settings
   * @param enable true to enabled, false to disabled
   */
  typeHints(enable: boolean): void {
    this.game.scene.typeHints = enable;
    this.log(`Type Hints ${enable ? "enabled" : "disabled"}`);
  }

  /**
   * Change the player gender
   * @param gender the {@linkcode PlayerGender} to set
   */
  playerGender(gender: PlayerGender) {
    this.game.scene.gameData.gender = gender;
    this.log(`Gender set to: ${PlayerGender[gender]} (=${gender})`);
  }

  /**
   * Change the exp gains speed
   * @param speed the {@linkcode ExpGainsSpeed} to set
   */
  expGainsSpeed(speed: ExpGainsSpeed) {
    this.game.scene.expGainsSpeed = speed;
    this.log(`Exp Gains Speed set to: ${ExpGainsSpeed[speed]} (=${speed})`);
  }

  private log(...params: any[]) {
    console.log(chalk.hex(SETTINGS_COLOR)(...params));
  }
}
