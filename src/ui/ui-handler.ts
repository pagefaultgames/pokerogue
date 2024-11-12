import { globalScene } from "#app/global-scene";
import { TextStyle, getTextColor } from "./text";
import { Mode } from "./ui";
import { Button } from "#enums/buttons";

/**
 * A basic abstract class to act as a holder and processor for UI elements.
 */
export default abstract class UiHandler {
  protected mode: integer | null;
  protected cursor: integer = 0;
  public active: boolean = false;

  /**
   * @param {BattleScene} scene The same scene as everything else.
   * @param {Mode} mode The mode of the UI element. These should be unique.
   */
  constructor(mode: Mode | null = null) {
    this.mode = mode;
  }

  abstract setup(): void;

  show(_args: any[]): boolean {
    this.active = true;

    return true;
  }

  abstract processInput(button: Button): boolean;

  getUi() {
    return globalScene.ui;
  }

  getTextColor(style: TextStyle, shadow: boolean = false): string {
    return getTextColor(style, shadow, globalScene.uiTheme);
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

  /**
   * Changes the style of the mouse cursor.
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/cursor}
   * @param cursorStyle cursor style to apply
   */
  protected setMouseCursorStyle(cursorStyle: "pointer" | "default") {
    globalScene.input.manager.canvas.style.cursor = cursorStyle;
  }

  clear() {
    this.active = false;
  }
}
