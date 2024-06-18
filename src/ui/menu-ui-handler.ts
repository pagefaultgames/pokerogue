import BattleScene, { bypassLogin } from "../battle-scene";
import { TextStyle, addTextObject } from "./text";
import { Mode } from "./ui";
import * as Utils from "../utils";
import { addWindow } from "./ui-theme";
import MessageUiHandler from "./message-ui-handler";
import { OptionSelectConfig, OptionSelectItem } from "./abstact-option-select-ui-handler";
import { Tutorial, handleTutorial } from "../tutorial";
import { updateUserInfo } from "../account";
import i18next from "i18next";
import {Button} from "#enums/buttons";
import { GameDataType } from "#enums/game-data-type";

export enum MenuOptions {
  GAME_SETTINGS,
  ACHIEVEMENTS,
  STATS,
  VOUCHERS,
  EGG_LIST,
  EGG_GACHA,
  MANAGE_DATA,
  COMMUNITY,
  SAVE_AND_QUIT,
  LOG_OUT
}

const wikiUrl = "https://wiki.pokerogue.net/start";
const discordUrl = "https://discord.gg/uWpTfdKG49";
const githubUrl = "https://github.com/pagefaultgames/pokerogue";
const redditUrl = "https://www.reddit.com/r/pokerogue";

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
    this.menuOptions = Utils.getEnumKeys(MenuOptions).map(m => parseInt(MenuOptions[m]) as MenuOptions).filter(m => !this.ignoredMenuOptions.includes(m));
  }

  setup() {
    const ui = this.getUi();

    this.menuContainer = this.scene.add.container(1, -(this.scene.game.canvas.height / 6) + 1);

    this.menuContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6), Phaser.Geom.Rectangle.Contains);

    const menuMessageText = addTextObject(this.scene, 8, 8, "", TextStyle.WINDOW, { maxLines: 2 });
    menuMessageText.setWordWrapWidth(1224);
    menuMessageText.setOrigin(0, 0);

    this.optionSelectText = addTextObject(this.scene, 0, 0, this.menuOptions.map(o => `${i18next.t(`menuUiHandler:${MenuOptions[o]}`)}`).join("\n"), TextStyle.WINDOW, { maxLines: this.menuOptions.length });
    this.optionSelectText.setLineSpacing(12);

    this.menuBg = addWindow(this.scene, (this.scene.game.canvas.width / 6) - (this.optionSelectText.displayWidth + 25), 0, this.optionSelectText.displayWidth + 23, (this.scene.game.canvas.height / 6) - 2);
    this.menuBg.setOrigin(0, 0);

    this.optionSelectText.setPositionRelative(this.menuBg, 14, 6);

    this.menuContainer.add(this.menuBg);

    this.menuContainer.add(this.optionSelectText);

    ui.add(this.menuContainer);

    this.menuMessageBoxContainer = this.scene.add.container(0, 130);
    this.menuMessageBoxContainer.setVisible(false);
    this.menuContainer.add(this.menuMessageBoxContainer);

    const menuMessageBox = addWindow(this.scene, 0, -0, 220, 48);
    menuMessageBox.setOrigin(0, 0);
    this.menuMessageBoxContainer.add(menuMessageBox);

    this.menuMessageBoxContainer.add(menuMessageText);

    this.message = menuMessageText;

    this.menuContainer.add(this.menuMessageBoxContainer);

    const manageDataOptions = [];

    const confirmSlot = (message: string, slotFilter: (i: integer) => boolean, callback: (i: integer) => void) => {
      ui.revertMode();
      ui.showText(message, null, () => {
        const config: OptionSelectConfig = {
          options: new Array(5).fill(null).map((_, i) => i).filter(slotFilter).map(i => {
            return {
              label: i18next.t("menuUiHandler:slot", {slotNumber: i+1}),
              handler: () => {
                callback(i);
                ui.revertMode();
                ui.showText(null, 0);
                return true;
              }
            };
          }).concat([{
            label: i18next.t("menuUiHandler:cancel"),
            handler: () => {
              ui.revertMode();
              ui.showText(null, 0);
              return true;
            }
          }]),
          xOffset: 98
        };
        ui.setOverlayMode(Mode.MENU_OPTION_SELECT, config);
      });
    };

    if (Utils.isLocal) {
      manageDataOptions.push({
        label: i18next.t("menuUiHandler:importSession"),
        handler: () => {
          confirmSlot(i18next.t("menuUiHandler:importSlotSelect"), () => true, slotId => this.scene.gameData.importData(GameDataType.SESSION, slotId));
          return true;
        },
        keepOpen: true
      });
    }
    manageDataOptions.push({
      label: i18next.t("menuUiHandler:exportSession"),
      handler: () => {
        const dataSlots: integer[] = [];
        Promise.all(
          new Array(5).fill(null).map((_, i) => {
            const slotId = i;
            return this.scene.gameData.getSession(slotId).then(data => {
              if (data) {
                dataSlots.push(slotId);
              }
            });
          })).then(() => {
          confirmSlot(i18next.t("menuUiHandler:exportSlotSelect"),
            i => dataSlots.indexOf(i) > -1,
            slotId => this.scene.gameData.tryExportData(GameDataType.SESSION, slotId));
        });
        return true;
      },
      keepOpen: true
    });
    if (Utils.isLocal) {
      manageDataOptions.push({
        label: i18next.t("menuUiHandler:importData"),
        handler: () => {
          ui.revertMode();
          this.scene.gameData.importData(GameDataType.SYSTEM);
          return true;
        },
        keepOpen: true
      });
    }
    manageDataOptions.push(
      {
        label: i18next.t("menuUiHandler:exportData"),
        handler: () => {
          this.scene.gameData.tryExportData(GameDataType.SYSTEM);
          return true;
        },
        keepOpen: true
      },
      {
        label: i18next.t("menuUiHandler:cancel"),
        handler: () => {
          this.scene.ui.revertMode();
          return true;
        }
      }
    );

    this.manageDataConfig = {
      xOffset: 98,
      options: manageDataOptions
    };

    const communityOptions: OptionSelectItem[] = [
      {
        label: "Wiki",
        handler: () => {
          window.open(wikiUrl, "_blank").focus();
          return true;
        },
        keepOpen: true
      },
      {
        label: "Discord",
        handler: () => {
          window.open(discordUrl, "_blank").focus();
          return true;
        },
        keepOpen: true
      },
      {
        label: "GitHub",
        handler: () => {
          window.open(githubUrl, "_blank").focus();
          return true;
        },
        keepOpen: true
      },
      {
        label: "Reddit",
        handler: () => {
          window.open(redditUrl, "_blank").focus();
          return true;
        },
        keepOpen: true
      },
      {
        label: i18next.t("menuUiHandler:cancel"),
        handler: () => {
          this.scene.ui.revertMode();
          return true;
        }
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

    this.scene.playSound("menu_open");

    handleTutorial(this.scene, Tutorial.Menu);

    return true;
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;
    let error = false;

    if (button === Button.ACTION) {
      let adjustedCursor = this.cursor;
      for (const imo of this.ignoredMenuOptions) {
        if (adjustedCursor >= imo) {
          adjustedCursor++;
        } else {
          break;
        }
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
        } else {
          error = true;
        }
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
      case MenuOptions.SAVE_AND_QUIT:
        if (this.scene.currentBattle) {
          success = true;
          if (this.scene.currentBattle.turn > 1) {
            ui.showText(i18next.t("menuUiHandler:losingProgressionWarning"), null, () => {
              ui.setOverlayMode(Mode.CONFIRM, () => this.scene.gameData.saveAll(this.scene, true, true, true, true).then(() => this.scene.reset(true)), () => {
                ui.revertMode();
                ui.showText(null, 0);
              }, false, -98);
            });
          } else {
            this.scene.gameData.saveAll(this.scene, true, true, true, true).then(() => this.scene.reset(true));
          }
        } else {
          error = true;
        }
        break;
      case MenuOptions.LOG_OUT:
        success = true;
        const doLogout = () => {
          Utils.apiFetch("account/logout", true).then(res => {
            if (!res.ok) {
              console.error(`Log out failed (${res.status}: ${res.statusText})`);
            }
            Utils.setCookie(Utils.sessionIdKey, "");
            updateUserInfo().then(() => this.scene.reset(true, true));
          });
        };
        if (this.scene.currentBattle) {
          ui.showText(i18next.t("menuUiHandler:losingProgressionWarning"), null, () => {
            ui.setOverlayMode(Mode.CONFIRM, doLogout, () => {
              ui.revertMode();
              ui.showText(null, 0);
            }, false, -98);
          });
        } else {
          doLogout();
        }
        break;
      }
    } else if (button === Button.CANCEL) {
      success = true;
      ui.revertMode().then(result => {
        if (!result) {
          ui.setMode(Mode.MESSAGE);
        }
      });
    } else {
      switch (button) {
      case Button.UP:
        if (this.cursor) {
          success = this.setCursor(this.cursor - 1);
        } else {
          success = this.setCursor(this.menuOptions.length - 1);
        }
        break;
      case Button.DOWN:
        if (this.cursor + 1 < this.menuOptions.length) {
          success = this.setCursor(this.cursor + 1);
        } else {
          success = this.setCursor(0);
        }
        break;
      }
    }

    if (success) {
      ui.playSelect();
    } else if (error) {
      ui.playError();
    }

    return success || error;
  }

  showText(text: string, delay?: number, callback?: Function, callbackDelay?: number, prompt?: boolean, promptDelay?: number): void {
    this.menuMessageBoxContainer.setVisible(!!text);

    super.showText(text, delay, callback, callbackDelay, prompt, promptDelay);
  }

  setCursor(cursor: integer): boolean {
    const ret = super.setCursor(cursor);

    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.image(0, 0, "cursor");
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
    if (this.cursorObj) {
      this.cursorObj.destroy();
    }
    this.cursorObj = null;
  }
}
