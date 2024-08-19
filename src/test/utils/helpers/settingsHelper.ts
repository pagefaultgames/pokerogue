import { ExpGainsSpeed } from "#app/enums/exp-gains-speed.js";
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
  }

  /**
   * Set the EXP gains speed settings
   * @param speed exp gains speed to set
   */
  expGainsSpeed(speed: ExpGainsSpeed) {
    this.game.scene.expGainsSpeed = speed;
  }
}
