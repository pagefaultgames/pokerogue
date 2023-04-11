import BattleScene, { Button } from "../battle-scene";
import { addTextObject, TextStyle } from "../text";
import { Mode } from "./ui";
import UiHandler from "./uiHandler";

export default class ConfirmUiHandler extends UiHandler {
  private yesHandler: Function;
  private noHander: Function;

  private confirmContainer: Phaser.GameObjects.Container;
  private confirmBg: Phaser.GameObjects.Image;

  private cursorObj: Phaser.GameObjects.Image;

  private switchCheck: boolean;
  private switchCheckCursor: integer;

  constructor(scene: BattleScene) {
    super(scene, Mode.CONFIRM);
  }

  setup() {
    const ui = this.getUi();
    
    this.confirmContainer = this.scene.add.container((this.scene.game.canvas.width / 6) - 49, -49);
    this.confirmContainer.setVisible(false);
    ui.add(this.confirmContainer);

    this.confirmBg = this.scene.add.image(0, 0, 'boolean_window');
    this.confirmBg.setOrigin(0, 1);
    this.confirmContainer.add(this.confirmBg);

    const confirmText = addTextObject(this.scene, 0, 0, 'Yes\nNo', TextStyle.WINDOW, { maxLines: 2 });
    confirmText.setPositionRelative(this.confirmBg, 16, 9);
    confirmText.setLineSpacing(12);
    this.confirmContainer.add(confirmText);

    this.setCursor(0);
  }

  show(args: any[]) {
    if (args.length >= 2 && args[0] instanceof Function && args[1] instanceof Function) {
      super.show(args);
      
      this.yesHandler = args[0] as Function;
      this.noHander = args[1] as Function;
      this.switchCheck = args.length >= 3 && args[2] as boolean;

      this.confirmContainer.setVisible(true);
      this.setCursor(this.switchCheck ? this.switchCheckCursor : 0);
    }
  }

  processInput(button: Button) {
    const ui = this.getUi();

    let success = false;

    if (button === Button.ACTION || button === Button.CANCEL) {
      success = true;
      if (button === Button.CANCEL)
        this.setCursor(1);
      const handler = this.cursor ? this.noHander : this.yesHandler;
      handler();
      console.log(this.cursor ? this.noHander : this.yesHandler);
      this.clear();
    } else {
      switch (button) {
        case Button.UP:
          if (this.cursor)
            success = this.setCursor(0);
          break;
        case Button.DOWN:
          if (!this.cursor)
            success = this.setCursor(1);
          break;
      }
    }

    if (success)
      ui.playSelect();
  }

  setCursor(cursor: integer): boolean {
    const ret = super.setCursor(cursor);

    if (ret && this.switchCheck)
      this.switchCheckCursor = this.cursor;

    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.image(0, 0, 'cursor');
      this.confirmContainer.add(this.cursorObj);
    }

    this.cursorObj.setPositionRelative(this.confirmBg, 12, this.cursor ? 33 : 17);

    return ret;
  }

  clear() {
    super.clear();
    this.yesHandler = null;
    this.noHander = null;
    this.confirmContainer.setVisible(false);
    this.eraseCursor();
  }

  eraseCursor() {
    if (this.cursorObj)
      this.cursorObj.destroy();
    this.cursorObj = null;
  }
}