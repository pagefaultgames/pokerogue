import { SETTINGS_COLOR } from "#app/constants/colors";
import { BattleStyle } from "#enums/battle-style";
import { ExpGainsSpeed } from "#enums/exp-gains-speed";
import { ExpNotification } from "#enums/exp-notification";
import { PlayerGender } from "#enums/player-gender";
import type { GameManager } from "#test/test-utils/game-manager";
import { GameManagerHelper } from "#test/test-utils/helpers/game-manager-helper";
import chalk from "chalk";
import { getEnumStr } from "#test/test-utils/string-utils";

/**
 * Helper to handle settings for tests
 * @todo Why does this exist
 */
export class SettingsHelper extends GameManagerHelper {
  constructor(game: GameManager) {
    super(game);

    this.initDefaultSettings();
  }

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
   * Change the battle style to Switch or Set mode (tests default to {@linkcode BattleStyle.SET})
   * @param style - The {@linkcode BattleStyle} to set
   */
  battleStyle(style: BattleStyle): this {
    this.game.scene.battleStyle = style;
    this.log(`Battle Style set to BattleStyle.${getEnumStr(BattleStyle, style)}!`);
    return this;
  }

  /**
   * Disable/Enable type hints settings
   * @param enable - Whether to enable or disable type hints.
   * @returns `this`
   */
  typeHints(enable: boolean): this {
    this.game.scene.typeHints = enable;
    this.log(`Type Hints ${enable ? "enabled" : "disabled"}!`);
    return this;
  }

  /**
   * Change the player gender
   * @param gender - The {@linkcode PlayerGender} to set
   */
  playerGender(gender: PlayerGender) {
    this.game.scene.gameData.gender = gender;
    this.log(`Gender set to PlayerGender.${getEnumStr(PlayerGender, gender)}!`);
  }

  /**
   * Change the exp gains speed
   * @param speed - the {@linkcode ExpGainsSpeed} to set
   */
  expGainsSpeed(speed: ExpGainsSpeed) {
    this.game.scene.expGainsSpeed = speed;
    this.log(`Exp Gains Speed set to ExpGainsSpeed.${getEnumStr(ExpGainsSpeed, speed)}!`);
    return this;
  }

  private log(...params: any[]) {
    console.log(chalk.hex(SETTINGS_COLOR)(...params));
  }
}
