import BattleScene, { Button } from "../battle-scene";
import { TextStyle, addTextObject } from "./text";
import { Mode } from "./ui";
import * as Utils from "../utils";
import { addWindow } from "./window";
import MessageUiHandler from "./message-ui-handler";
import { GameDataType } from "../system/game-data";
import { CheckLoadPhase, LoginPhase } from "../battle-phases";

export enum MenuOptions {
  GAME_SETTINGS,
  ACHIEVEMENTS,
  VOUCHERS,
  EGG_LIST,
  EGG_GACHA,
  IMPORT_SESSION,
  EXPORT_SESSION,
  IMPORT_DATA,
  EXPORT_DATA,
  LOG_OUT
}

export default class MenuUiHandler extends MessageUiHandler {
  private menuContainer: Phaser.GameObjects.Container;
  private menuMessageBoxContainer: Phaser.GameObjects.Container;

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

    this.menuBg = addWindow(this.scene, (this.scene.game.canvas.width / 6) - 100, 0, 98, (this.scene.game.canvas.height / 6) - 2);
    this.menuBg.setOrigin(0, 0);

    this.menuContainer.add(this.menuBg);

    this.optionSelectText = addTextObject(this.scene, 0, 0, Utils.getEnumKeys(MenuOptions).map(o => Utils.toReadableString(o)).join('\n'), TextStyle.WINDOW, { maxLines: Utils.getEnumKeys(MenuOptions).length });
    this.optionSelectText.setPositionRelative(this.menuBg, 14, 6);
    this.optionSelectText.setLineSpacing(12);
    this.menuContainer.add(this.optionSelectText);

    ui.add(this.menuContainer);

    this.menuMessageBoxContainer = this.scene.add.container(0, 130);
    this.menuMessageBoxContainer.setVisible(false);
    this.menuContainer.add(this.menuMessageBoxContainer);

    const menuMessageBox = addWindow(this.scene, 0, -0, 220, 48);
    menuMessageBox.setOrigin(0, 0);
    this.menuMessageBoxContainer.add(menuMessageBox);

    const menuMessageText = addTextObject(this.scene, 8, 8, '', TextStyle.WINDOW, { maxLines: 2 });
    menuMessageText.setWordWrapWidth(1224);
    menuMessageText.setOrigin(0, 0);
    this.menuMessageBoxContainer.add(menuMessageText);

    this.message = menuMessageText;

    this.menuContainer.add(this.menuMessageBoxContainer);

    this.setCursor(0);

    this.menuContainer.setVisible(false);
  }

  show(args: any[]): boolean {
    super.show(args);

    this.menuContainer.setVisible(true);
    this.setCursor(0);

    this.getUi().moveTo(this.menuContainer, this.getUi().length - 1);

    this.getUi().hideTooltip();

    this.scene.playSound('menu_open');

    return true;
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;
    let error = false;

    if (button === Button.ACTION) {
      switch (this.cursor as MenuOptions) {
        case MenuOptions.GAME_SETTINGS:
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
        case MenuOptions.IMPORT_SESSION:
        case MenuOptions.IMPORT_DATA:
          this.scene.gameData.importData(this.cursor === MenuOptions.IMPORT_DATA ? GameDataType.SYSTEM : GameDataType.SESSION);
          success = true;
          break;
        case MenuOptions.EXPORT_SESSION:
        case MenuOptions.EXPORT_DATA:
          this.scene.gameData.exportData(this.cursor === MenuOptions.EXPORT_DATA ? GameDataType.SYSTEM : GameDataType.SESSION);
          success = true;
          break;
        case MenuOptions.LOG_OUT:
          success = true;
          const doLogout = () => {
            Utils.apiPost('account/logout').then(res => {
              if (!res.ok)
                console.error(`Log out failed (${res.status}: ${res.statusText})`);
              Utils.setCookie(Utils.sessionIdKey, '');
              this.scene.reset(true);
            });
          };
          if (this.scene.currentBattle) {
            this.scene.ui.showText('You will lose any progress since the beginning of the battle. Proceed?', null, () => {
              this.scene.ui.setOverlayMode(Mode.CONFIRM, doLogout, () => {
                this.scene.ui.revertMode();
                this.scene.ui.showText(null, 0);
              }, false, 98);
            });
          } else
            doLogout();
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
          if (this.cursor + 1 < Utils.getEnumKeys(MenuOptions).length)
            success = this.setCursor(this.cursor + 1);
          break;
      }
    }

    if (success)
      ui.playSelect();
    else if (error)
      ui.playError();

    return success || error;
  }

  showText(text: string, delay?: number, callback?: Function, callbackDelay?: number, prompt?: boolean, promptDelay?: number): void {
    this.menuMessageBoxContainer.setVisible(!!text);

    super.showText(text, delay, callback, callbackDelay, prompt, promptDelay);
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