import BattleScene from "../battle-scene";
import { TextStyle, getTextColor } from "./text";
import { Mode } from "./ui";
import {Button} from "#enums/buttons";

/**
 * A basic abstract class to act as a holder and processor for UI elements.
 */
export default abstract class UiHandler {
  protected scene: BattleScene;
  protected mode: integer;
  protected cursor: integer = 0;
  public active: boolean = false;

  /**
   * @param {BattleScene} scene The same scene as everything else.
   * @param {Mode} mode The mode of the UI element. These should be unique.
   */
  constructor(scene: BattleScene, mode: Mode) {
    this.scene = scene;
    this.mode = mode;
  }

  abstract setup(): void;

  show(_args: any[]): boolean {
    this.active = true;

    return true;
  }

  abstract processInput(button: Button): boolean;

  getUi() {
    return this.scene.ui;
  }

  getTextColor(style: TextStyle, shadow: boolean = false): string {
    return getTextColor(style, shadow, this.scene.uiTheme);
  }

  getCursor(): integer {
    return this.cursor;
  }

  setCursor(cursor: integer): boolean {
    const changed = this.cursor !== cursor;
    if (changed) {
      this.cursor = cursor;
    }

    return changed;
  }

  clear() {
    this.active = false;
  }
}
