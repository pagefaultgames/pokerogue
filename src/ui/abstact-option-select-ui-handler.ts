import BattleScene, { Button } from "../battle-scene";
import { TextStyle, addTextObject } from "./text";
import { Mode } from "./ui";
import UiHandler from "./ui-handler";
import { addWindow } from "./window";

export interface OptionSelectConfig {
  xOffset?: number;
  options: OptionSelectItem[];
}

export interface OptionSelectItem {
  label: string;
  handler: Function;
  keepOpen?: boolean;
  overrideSound?: boolean;
}

export default abstract class AbstractOptionSelectUiHandler extends UiHandler {
  protected optionSelectContainer: Phaser.GameObjects.Container;
  protected optionSelectBg: Phaser.GameObjects.NineSlice;
  protected optionSelectText: Phaser.GameObjects.Text;

  protected config: OptionSelectConfig;

  private cursorObj: Phaser.GameObjects.Image;

  constructor(scene: BattleScene, mode?: Mode) {
    super(scene, mode);
  }

  abstract getWindowWidth(): integer;

  getWindowHeight(): integer {
    return ((this.config?.options || []).length + 1) * 16;
  }

  setup() {
    const ui = this.getUi();
    
    this.optionSelectContainer = this.scene.add.container((this.scene.game.canvas.width / 6) - 1, -48);
    this.optionSelectContainer.setVisible(false);
    ui.add(this.optionSelectContainer);

    this.optionSelectBg = addWindow(this.scene, 0, 0, this.getWindowWidth(), this.getWindowHeight());
    this.optionSelectBg.setOrigin(1, 1);
    this.optionSelectContainer.add(this.optionSelectBg);

    this.setCursor(0);
  }

  protected setupOptions() {
    const options = this.config?.options || [];

    if (this.optionSelectText)
      this.optionSelectText.destroy();

    this.optionSelectText = addTextObject(this.scene, 0, 0, options.map(o => o.label).join('\n'), TextStyle.WINDOW, { maxLines: options.length });
    this.optionSelectText.setLineSpacing(12);
    this.optionSelectContainer.add(this.optionSelectText);
    this.optionSelectContainer.x = (this.scene.game.canvas.width / 6) - 1 - (this.config?.xOffset || 0);

    this.optionSelectBg.width = Math.max(this.optionSelectText.displayWidth + 24, this.getWindowWidth());
    this.optionSelectBg.height = this.getWindowHeight();

    this.optionSelectText.setPositionRelative(this.optionSelectBg, 16, 9);
  }

  show(args: any[]): boolean {
    if (!args.length || !args[0].hasOwnProperty('options') || !args[0].options.length)
      return false;

    super.show(args);

    this.config = args[0] as OptionSelectConfig;
    this.setupOptions();

    this.scene.ui.bringToTop(this.optionSelectContainer);

    this.optionSelectContainer.setVisible(true);
    this.setCursor(0);

    return true;
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;

    const options = this.config?.options || [];

    let playSound = true;

    if (button === Button.ACTION || button === Button.CANCEL) {
      success = true;
      if (button === Button.CANCEL)
        this.setCursor(options.length - 1);
      const option = options[this.cursor];
      option.handler();
      if (!option.keepOpen)
        this.clear();
      playSound = !option.overrideSound;
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

    if (success && playSound)
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
    this.config = null;
    this.optionSelectContainer.setVisible(false);
    this.eraseCursor();
  }

  eraseCursor() {
    if (this.cursorObj)
      this.cursorObj.destroy();
    this.cursorObj = null;
  }
}