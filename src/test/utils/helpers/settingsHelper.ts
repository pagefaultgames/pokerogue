import { PlayerGender } from "#app/enums/player-gender";
import { GameManagerHelper } from "./gameManagerHelper";

/**
 * Helper to handle settings for tests
 */
export class SettingsHelper extends GameManagerHelper {

  /**
   * Disable/Enable type hints settings
   * @param enable true to enabled, false to disabled
   */
  typeHints(enable: boolean) {
    this.game.scene.typeHints = enable;
    this.log(`Type Hints ${enable? "enabled" : "disabled"}` );
  }

  /**
   * Change the player gender
   * @param gender the {@linkcode PlayerGender} to set
   */
  playerGender(gender: PlayerGender) {
    this.game.scene.gameData.gender = gender;
    this.log(`Gender set to: ${PlayerGender[gender]} (=${gender})` );
  }

  private log(...params: any[]) {
    console.log("Settings:", ...params);
  }
}
