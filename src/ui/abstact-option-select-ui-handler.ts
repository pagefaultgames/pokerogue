import BattleScene, { Button } from "../battle-scene";
import { TextStyle, addTextObject } from "./text";
import { Mode } from "./ui";
import UiHandler from "./uiHandler";

export default abstract class AbstractOptionSelectUiHandler extends UiHandler {
  protected handlers: Function[];

  protected optionSelectContainer: Phaser.GameObjects.Container;
  protected optionSelectBg: Phaser.GameObjects.NineSlice;
  protected optionSelectText: Phaser.GameObjects.Text;

  private cursorObj: Phaser.GameObjects.Image;

  constructor(scene: BattleScene, mode?: Mode) {
    super(scene, mode);
  }

  abstract getWindowWidth(): integer;

  abstract getWindowHeight(): integer;

  abstract getOptions(): string[];

  setup() {
    const ui = this.getUi();
    
    this.optionSelectContainer = this.scene.add.container((this.scene.game.canvas.width / 6) - 1, -48);
    this.optionSelectContainer.setVisible(false);
    ui.add(this.optionSelectContainer);

    this.optionSelectBg = this.scene.add.nineslice(0, 0, 'window', null, this.getWindowWidth(), this.getWindowHeight(), 6, 6, 6, 6);
    this.optionSelectBg.setOrigin(1, 1);
    this.optionSelectContainer.add(this.optionSelectBg);

    this.setupOptions();
    this.setCursor(0);
  }

  protected setupOptions() {
    const options = this.getOptions();

    if (this.optionSelectText)
      this.optionSelectText.destroy();

    this.optionSelectText = addTextObject(this.scene, 0, 0, options.join('\n'), TextStyle.WINDOW, { maxLines: options.length });
    this.optionSelectText.setLineSpacing(12);
    this.optionSelectContainer.add(this.optionSelectText);

    this.optionSelectBg.width = Math.max(this.optionSelectText.displayWidth + 24, this.getWindowWidth());
    this.optionSelectBg.height = this.getWindowHeight();

    this.optionSelectText.setPositionRelative(this.optionSelectBg, 16, 9);
  }

  show(args: any[]) {
    const options = this.getOptions();

    if (args.length >= options.length && args.slice(0, options.length).filter(a => a instanceof Function).length === options.length) {
      super.show(args);
      
      this.handlers = args.slice(0, options.length) as Function[];

      this.optionSelectContainer.setVisible(true);
      this.setCursor(0);
    }
  }

  processInput(button: Button): boolean {
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

    return success;
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