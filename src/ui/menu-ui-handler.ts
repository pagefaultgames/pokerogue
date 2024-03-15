import BattleScene, { Button, bypassLogin } from "../battle-scene";
import { TextStyle, addTextObject } from "./text";
import { Mode } from "./ui";
import * as Utils from "../utils";
import { addWindow } from "./window";
import MessageUiHandler from "./message-ui-handler";
import { GameDataType } from "../system/game-data";
import { OptionSelectConfig } from "./abstact-option-select-ui-handler";
import { Tutorial, handleTutorial } from "../tutorial";
import { updateUserInfo } from "../account";

export enum MenuOptions {
  GAME_SETTINGS,
  ACHIEVEMENTS,
  STATS,
  VOUCHERS,
  EGG_LIST,
  EGG_GACHA,
  MANAGE_DATA,
  COMMUNITY,
  LOG_OUT
}

const discordUrl = 'https://discord.gg/uWpTfdKG49';
const githubUrl = 'https://github.com/Flashfyre/pokerogue';

export default class MenuUiHandler extends MessageUiHandler {
  private menuContainer: Phaser.GameObjects.Container;
  private menuMessageBoxContainer: Phaser.GameObjects.Container;

  private menuBg: Phaser.GameObjects.NineSlice;
  protected optionSelectText: Phaser.GameObjects.Text;

  private cursorObj: Phaser.GameObjects.Image;

  protected ignoredMenuOptions: MenuOptions[];
  protected menuOptions: MenuOptions[];

  protected manageDataConfig: OptionSelectConfig;
  protected communityConfig: OptionSelectConfig;

  constructor(scene: BattleScene, mode?: Mode) {
    super(scene, mode);

    this.ignoredMenuOptions = !bypassLogin
      ? [ ]
      : [ MenuOptions.LOG_OUT ];
    this.menuOptions = Utils.getEnumKeys(MenuOptions).map(m => parseInt(MenuOptions[m]) as MenuOptions).filter(m => this.ignoredMenuOptions.indexOf(m) === -1);
  }

  setup() {
    const ui = this.getUi();
    
    this.menuContainer = this.scene.add.container(1, -(this.scene.game.canvas.height / 6) + 1);

    this.menuContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6), Phaser.Geom.Rectangle.Contains);

    this.menuBg = addWindow(this.scene, (this.scene.game.canvas.width / 6) - 100, 0, 98, (this.scene.game.canvas.height / 6) - 2);
    this.menuBg.setOrigin(0, 0);

    this.menuContainer.add(this.menuBg);

    this.optionSelectText = addTextObject(this.scene, 0, 0, this.menuOptions.map(o => Utils.toReadableString(MenuOptions[o])).join('\n'), TextStyle.WINDOW, { maxLines: this.menuOptions.length });
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

    const manageDataOptions = [];

    const confirmSlot = (message: string, slotFilter: (i: integer) => boolean, callback: (i: integer) => void) => {
      ui.revertMode();
      ui.showText(message, null, () => {
        const config: OptionSelectConfig = {
          options: new Array(3).fill(null).map((_, i) => i).filter(slotFilter).map(i => {
            return {
              label: `Slot ${i + 1}`,
              handler: () => {
                callback(i);
                ui.revertMode();
                ui.showText(null, 0);
              }
            };
          }).concat([{
            label: 'Cancel',
            handler: () => {
              ui.revertMode();
              ui.showText(null, 0);
            }
          }]),
          xOffset: 98
        };
        ui.setOverlayMode(Mode.MENU_OPTION_SELECT, config);
      });
    };

    manageDataOptions.push({
      label: 'Import Session',
      handler: () => confirmSlot('Select a slot to import to.', () => true, slotId => this.scene.gameData.importData(GameDataType.SESSION, slotId)),
      keepOpen: true
    });
    manageDataOptions.push({
      label: 'Export Session',
      handler: () => {
        const dataSlots: integer[] = [];
        Promise.all(
          new Array(3).fill(null).map((_, i) => {
            const slotId = i;
            return this.scene.gameData.getSession(slotId).then(data => {
              if (data)
                dataSlots.push(slotId);
            })
          })).then(() => {
            confirmSlot('Select a slot to export from.',
              i => dataSlots.indexOf(i) > -1,
              slotId => this.scene.gameData.tryExportData(GameDataType.SESSION, slotId));
          });
      },
      keepOpen: true
    });
    manageDataOptions.push({
      label: 'Import Data',
      handler: () => this.scene.gameData.importData(GameDataType.SYSTEM),
      keepOpen: true
    });
    manageDataOptions.push(
      {
        label: 'Export Data',
        handler: () => this.scene.gameData.tryExportData(GameDataType.SYSTEM),
        keepOpen: true
      },
      {
        label: 'Cancel',
        handler: () => this.scene.ui.revertMode()
      }
    );

    this.manageDataConfig = {
      xOffset: 98,
      options: manageDataOptions
    };

    const communityOptions = [
      {
        label: 'Discord',
        handler: () => window.open(discordUrl, '_blank').focus(),
        keepOpen: true
      },
      {
        label: 'GitHub',
        handler: () => window.open(githubUrl, '_blank').focus(),
        keepOpen: true
      },
      {
        label: 'Cancel',
        handler: () => this.scene.ui.revertMode()
      }
    ];

    this.communityConfig = {
      xOffset: 98,
      options: communityOptions
    };

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

    handleTutorial(this.scene, Tutorial.Menu);

    return true;
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;
    let error = false;

    if (button === Button.ACTION) {
      let adjustedCursor = this.cursor;
      for (let imo of this.ignoredMenuOptions) {
        if (adjustedCursor >= imo)
          adjustedCursor++;
        else
          break;
      }
      switch (adjustedCursor) {
        case MenuOptions.GAME_SETTINGS:
          ui.setOverlayMode(Mode.SETTINGS);
          success = true;
          break;
        case MenuOptions.ACHIEVEMENTS:
          ui.setOverlayMode(Mode.ACHIEVEMENTS);
          success = true;
          break;
        case MenuOptions.STATS:
          ui.setOverlayMode(Mode.GAME_STATS);
          success = true;
          break;
        case MenuOptions.VOUCHERS:
          ui.setOverlayMode(Mode.VOUCHERS);
          success = true;
          break;
        case MenuOptions.EGG_LIST:
          if (this.scene.gameData.eggs.length) {
            ui.revertMode();
            ui.setOverlayMode(Mode.EGG_LIST);
            success = true;
          } else
            error = true;
          break;
        case MenuOptions.EGG_GACHA:
          ui.revertMode();
          ui.setOverlayMode(Mode.EGG_GACHA);
          success = true;
          break;
        case MenuOptions.MANAGE_DATA:
          ui.setOverlayMode(Mode.MENU_OPTION_SELECT, this.manageDataConfig);
          success = true;
          break;
        case MenuOptions.COMMUNITY:
          ui.setOverlayMode(Mode.MENU_OPTION_SELECT, this.communityConfig);
          success = true;
          break;
        case MenuOptions.LOG_OUT:
          success = true;
          const doLogout = () => {
            Utils.apiPost('account/logout').then(res => {
              if (!res.ok)
                console.error(`Log out failed (${res.status}: ${res.statusText})`);
              Utils.setCookie(Utils.sessionIdKey, '');
              updateUserInfo().then(() => this.scene.reset(true));
            });
          };
          if (this.scene.currentBattle) {
            ui.showText('You will lose any progress since the beginning of the battle. Proceed?', null, () => {
              ui.setOverlayMode(Mode.CONFIRM, doLogout, () => {
                ui.revertMode();
                ui.showText(null, 0);
              }, false, -98);
            });
          } else
            doLogout();
          break;
      }
    } else if (button === Button.CANCEL) {
      success = true;
      if (!ui.revertMode())
        ui.setMode(Mode.MESSAGE);
    } else {
      switch (button) {
        case Button.UP:
          if (this.cursor)
            success = this.setCursor(this.cursor - 1);
          break;
        case Button.DOWN:
          if (this.cursor + 1 < this.menuOptions.length)
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