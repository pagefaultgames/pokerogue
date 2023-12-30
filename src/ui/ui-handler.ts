import BattleScene, { Button } from "../battle-scene";
import UI, { Mode } from "./ui";

export default abstract class UiHandler {
  protected scene: BattleScene;
  protected mode: integer;
  protected cursor: integer = 0;
  public active: boolean = false;

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

  getCursor(): integer {
    return this.cursor;
  }

  setCursor(cursor: integer): boolean {
    const changed = this.cursor !== cursor;
    if (changed)
      this.cursor = cursor;

    return changed;
  }

  clear() {
    this.active = false;
  }
}