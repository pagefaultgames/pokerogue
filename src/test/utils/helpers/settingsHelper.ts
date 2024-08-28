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
}
