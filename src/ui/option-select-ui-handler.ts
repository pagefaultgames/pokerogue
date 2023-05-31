import BattleScene, { Button } from "../battle-scene";
import { TextStyle, addTextObject } from "./text";
import { Mode } from "./ui";
import UiHandler from "./uiHandler";

export default abstract class OptionSelectUiHandler extends UiHandler {
  protected handlers: Function[];

  protected optionSelectContainer: Phaser.GameObjects.Container;
  protected optionSelectBg: Phaser.GameObjects.Image;

  private cursorObj: Phaser.GameObjects.Image;

  constructor(scene: BattleScene, mode?: Mode) {
    super(scene, mode);
  }

  abstract getWindowName(): string;

  abstract getWindowWidth(): integer;

  abstract getOptions(): string[];

  setup() {
    const ui = this.getUi();
    
    this.optionSelectContainer = this.scene.add.container((this.scene.game.canvas.width / 6) - (this.getWindowWidth() + 1), -(this.getWindowWidth() + 1));
    this.optionSelectContainer.setVisible(false);
    ui.add(this.optionSelectContainer);

    this.optionSelectBg = this.scene.add.image(0, 0, this.getWindowName());
    this.optionSelectBg.setOrigin(0, 1);
    this.optionSelectContainer.add(this.optionSelectBg);

    const options = this.getOptions();

    const optionSelectText = addTextObject(this.scene, 0, 0, options.join('\n'), TextStyle.WINDOW, { maxLines: options.length });
    optionSelectText.setPositionRelative(this.optionSelectBg, 16, 9);
    optionSelectText.setLineSpacing(12);
    this.optionSelectContainer.add(optionSelectText);

    this.setCursor(0);
  }

  show(args: any[]) {
    const options = this.getOptions();

    if (args.length >= options.length && args[0] instanceof Function && args[1] instanceof Function) {
      super.show(args);
      
      this.handlers = args.slice(0, options.length) as Function[];

      this.optionSelectContainer.setVisible(true);
      this.setCursor(0);
    }
  }

  processInput(button: Button) {
    const ui = this.getUi();

    let success = false;

    const options = this.getOptions();

    if (button === Button.ACTION || button === Button.CANCEL) {
      success = true;
      if (button === Button.CANCEL)
        this.setCursor(options.length - 1);
      const handler = this.handlers[this.cursor];
      handler();
      this.clear();
    } else {
      switch (button) {
        case Button.UP:
          if (this.cursor)
            success = this.setCursor(this.cursor - 1);
          break;
        case Button.DOWN:
          if (this.cursor < options.length - 1)
            success = this.setCursor(this.cursor + 1);
          break;
      }
    }

    if (success)
      ui.playSelect();
  }

  setCursor(cursor: integer): boolean {
    const ret = super.setCursor(cursor);

    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.image(0, 0, 'cursor');
      this.optionSelectContainer.add(this.cursorObj);
    }

    this.cursorObj.setPositionRelative(this.optionSelectBg, 12, 17 + this.cursor * 16);

    return ret;
  }

  clear() {
    super.clear();
    for (let h = 0; h < this.handlers.length; h++)
      this.handlers[h] = null;
    this.optionSelectContainer.setVisible(false);
    this.eraseCursor();
  }

  eraseCursor() {
    if (this.cursorObj)
      this.cursorObj.destroy();
    this.cursorObj = null;
  }
}