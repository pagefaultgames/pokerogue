import BattleScene, { Button } from "../battle-scene";
import { TextStyle, addTextObject } from "./text";
import { Mode } from "./ui";
import UiHandler from "./ui-handler";
import * as Utils from "../utils";
import { addWindow } from "./window";

export enum MenuOptions {
  SETTINGS,
  ACHIEVEMENTS,
  VOUCHERS,
  EGG_LIST,
  EGG_GACHA
}

export default class MenuUiHandler extends UiHandler {
  private menuContainer: Phaser.GameObjects.Container;

  private menuBg: Phaser.GameObjects.NineSlice;
  protected optionSelectText: Phaser.GameObjects.Text;

  private cursorObj: Phaser.GameObjects.Image;

  constructor(scene: BattleScene, mode?: Mode) {
    super(scene, mode);
  }

  setup() {
    const ui = this.getUi();
    
    this.menuContainer = this.scene.add.container(1, -(this.scene.game.canvas.height / 6) + 1);

    this.menuContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6), Phaser.Geom.Rectangle.Contains);

    this.menuBg = addWindow(this.scene, (this.scene.game.canvas.width / 6) - 92, 0, 90, (this.scene.game.canvas.height / 6) - 2);
    this.menuBg.setOrigin(0, 0);

    this.menuContainer.add(this.menuBg);

    this.optionSelectText = addTextObject(this.scene, 0, 0, Utils.getEnumKeys(MenuOptions).map(o => Utils.toReadableString(o)).join('\n'), TextStyle.WINDOW, { maxLines: Utils.getEnumKeys(MenuOptions).length });
    this.optionSelectText.setPositionRelative(this.menuBg, 14, 6);
    this.optionSelectText.setLineSpacing(12);
    this.menuContainer.add(this.optionSelectText);

    ui.add(this.menuContainer);

    this.setCursor(0);

    this.menuContainer.setVisible(false);
  }

  show(args: any[]) {
    super.show(args);

    this.menuContainer.setVisible(true);
    this.setCursor(0);

    this.getUi().moveTo(this.menuContainer, this.getUi().length - 1);

    this.getUi().hideTooltip();

    this.scene.playSound('menu_open');
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;
    let error = false;

    if (button === Button.ACTION) {
      switch (this.cursor as MenuOptions) {
        case MenuOptions.SETTINGS:
          this.scene.ui.setOverlayMode(Mode.SETTINGS);
          success = true;
          break;
        case MenuOptions.ACHIEVEMENTS:
          this.scene.ui.setOverlayMode(Mode.ACHIEVEMENTS);
          success = true;
          break;
        case MenuOptions.VOUCHERS:
          this.scene.ui.setOverlayMode(Mode.VOUCHERS);
          success = true;
          break;
        case MenuOptions.EGG_LIST:
          if (this.scene.gameData.eggs.length) {
            this.scene.ui.revertMode();
            this.scene.ui.setOverlayMode(Mode.EGG_LIST);
            success = true;
          } else
            error = true;
          break;
        case MenuOptions.EGG_GACHA:
          this.scene.ui.revertMode();
          this.scene.ui.setOverlayMode(Mode.EGG_GACHA);
          success = true;
          break;
        
      }
    } else if (button === Button.CANCEL) {
      success = true;
      if (!this.scene.ui.revertMode())
        ui.setMode(Mode.MESSAGE);
    } else {
      switch (button) {
        case Button.UP:
          if (this.cursor)
            success = this.setCursor(this.cursor - 1);
          break;
        case Button.DOWN:
          if (this.cursor < Utils.getEnumKeys(MenuOptions).length)
            success = this.setCursor(this.cursor + 1);
          break;
      }
    }

    if (success)
      ui.playSelect();
    else if (error)
      ui.playError();

    return true;
  }

  setCursor(cursor: integer): boolean {
    const ret = super.setCursor(cursor);

    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.image(0, 0, 'cursor');
      this.cursorObj.setOrigin(0, 0);
      this.menuContainer.add(this.cursorObj);
    }

    this.cursorObj.setPositionRelative(this.menuBg, 7, 9 + this.cursor * 16);

    return ret;
  }

  clear() {
    super.clear();
    this.menuContainer.setVisible(false);
    this.eraseCursor();
  }

  eraseCursor() {
    if (this.cursorObj)
      this.cursorObj.destroy();
    this.cursorObj = null;
  }
}