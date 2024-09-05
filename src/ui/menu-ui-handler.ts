import BattleScene, { bypassLogin } from "../battle-scene";
import { TextStyle, addTextObject, getTextStyleOptions } from "./text";
import { Mode } from "./ui";
import * as Utils from "../utils";
import { addWindow, WindowVariant } from "./ui-theme";
import MessageUiHandler from "./message-ui-handler";
import { OptionSelectConfig, OptionSelectItem } from "./abstact-option-select-ui-handler";
import { Tutorial, handleTutorial } from "../tutorial";
import { loggedInUser, updateUserInfo } from "../account";
import i18next from "i18next";
import { Button } from "#enums/buttons";
import { GameDataType } from "#enums/game-data-type";
import BgmBar from "#app/ui/bgm-bar";
import AwaitableUiHandler from "./awaitable-ui-handler";
import { SelectModifierPhase } from "#app/phases/select-modifier-phase";

enum MenuOptions {
  GAME_SETTINGS,
  ACHIEVEMENTS,
  STATS,
  RUN_HISTORY,
  EGG_LIST,
  EGG_GACHA,
  MANAGE_DATA,
  COMMUNITY,
  SAVE_AND_QUIT,
  LOG_OUT,
}

let wikiUrl = "https://wiki.pokerogue.net/start";
const discordUrl = "https://discord.gg/uWpTfdKG49";
const githubUrl = "https://github.com/pagefaultgames/pokerogue";
const redditUrl = "https://www.reddit.com/r/pokerogue";
const donateUrl = "https://github.com/sponsors/patapancakes";

export default class MenuUiHandler extends MessageUiHandler {
  private readonly textPadding = 8;
  private readonly defaultMessageBoxWidth = 220;
  private readonly defaultWordWrapWidth = 1224;

  private menuContainer: Phaser.GameObjects.Container;
  private menuMessageBoxContainer: Phaser.GameObjects.Container;
  private menuOverlay: Phaser.GameObjects.Rectangle;

  private menuBg: Phaser.GameObjects.NineSlice;
  protected optionSelectText: Phaser.GameObjects.Text;

  private cursorObj: Phaser.GameObjects.Image | null;

  private excludedMenus: () => ConditionalMenu[];
  private menuOptions: MenuOptions[];

  protected manageDataConfig: OptionSelectConfig;
  protected communityConfig: OptionSelectConfig;

  // Windows for the default message box and the message box for testing dialogue
  private menuMessageBox: Phaser.GameObjects.NineSlice;
  private dialogueMessageBox: Phaser.GameObjects.NineSlice;

  protected scale: number = 0.1666666667;

  public bgmBar: BgmBar;

  constructor(scene: BattleScene, mode: Mode | null = null) {
    super(scene, mode);

    this.excludedMenus = () => [
      { condition: [Mode.COMMAND, Mode.TITLE].includes(mode ?? Mode.TITLE), options: [MenuOptions.EGG_GACHA, MenuOptions.EGG_LIST] },
      { condition: bypassLogin, options: [MenuOptions.LOG_OUT] }
    ];

    this.menuOptions = Utils.getEnumKeys(MenuOptions)
      .map(m => parseInt(MenuOptions[m]) as MenuOptions)
      .filter(m => {
        return !this.excludedMenus().some(exclusion => exclusion.condition && exclusion.options.includes(m));
      });
  }

  setup(): void {
    const ui = this.getUi();
    // wiki url directs based on languges available on wiki
    const lang = i18next.resolvedLanguage?.substring(0, 2)!; // TODO: is this bang correct?
    if (["de", "fr", "ko", "zh"].includes(lang)) {
      wikiUrl = `https://wiki.pokerogue.net/${lang}:start`;
    }

    this.bgmBar = new BgmBar(this.scene);
    this.bgmBar.setup();

    ui.bgmBar = this.bgmBar;

    this.menuContainer = this.scene.add.container(1, -(this.scene.game.canvas.height / 6) + 1);
    this.menuContainer.setName("menu");
    this.menuContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6), Phaser.Geom.Rectangle.Contains);

    this.menuOverlay = new Phaser.GameObjects.Rectangle(this.scene, -1, -1, this.scene.scaledCanvas.width, this.scene.scaledCanvas.height, 0xffffff, 0.3);
    this.menuOverlay.setName("menu-overlay");
    this.menuOverlay.setOrigin(0, 0);
    this.menuContainer.add(this.menuOverlay);

    this.menuContainer.add(this.bgmBar);

    this.menuContainer.setVisible(false);

  }


  render() {
    const ui = this.getUi();
    this.excludedMenus = () => [
      { condition: this.scene.getCurrentPhase() instanceof SelectModifierPhase, options: [MenuOptions.EGG_GACHA, MenuOptions.EGG_LIST] },
      { condition: bypassLogin, options: [MenuOptions.LOG_OUT] }
    ];

    this.menuOptions = Utils.getEnumKeys(MenuOptions)
      .map(m => parseInt(MenuOptions[m]) as MenuOptions)
      .filter(m => {
        return !this.excludedMenus().some(exclusion => exclusion.condition && exclusion.options.includes(m));
      });

    this.optionSelectText = addTextObject(this.scene, 0, 0, this.menuOptions.map(o => `${i18next.t(`menuUiHandler:${MenuOptions[o]}`)}`).join("\n"), TextStyle.WINDOW, { maxLines: this.menuOptions.length });
    this.optionSelectText.setLineSpacing(12);

    this.scale = getTextStyleOptions(TextStyle.WINDOW, (this.scene as BattleScene).uiTheme).scale;
    this.menuBg = addWindow(this.scene,
      (this.scene.game.canvas.width / 6) - (this.optionSelectText.displayWidth + 25),
      0,
      this.optionSelectText.displayWidth + 19 + 24 * this.scale,
      (this.scene.game.canvas.height / 6) - 2
    );
    this.menuBg.setOrigin(0, 0);

    this.optionSelectText.setPositionRelative(this.menuBg, 10 + 24 * this.scale, 6);

    this.menuContainer.add(this.menuBg);

    this.menuContainer.add(this.optionSelectText);

    ui.add(this.menuContainer);

    this.menuMessageBoxContainer = this.scene.add.container(0, 130);
    this.menuMessageBoxContainer.setName("menu-message-box");
    this.menuMessageBoxContainer.setVisible(false);

    // Window for general messages
    this.menuMessageBox = addWindow(this.scene, 0, 0, this.defaultMessageBoxWidth, 48);
    this.menuMessageBox.setOrigin(0, 0);
    this.menuMessageBoxContainer.add(this.menuMessageBox);

    // Full-width window used for testing dialog messages in debug mode
    this.dialogueMessageBox = addWindow(this.scene, -this.textPadding, 0, this.scene.game.canvas.width / 6 + this.textPadding * 2, 49, false, false, 0, 0, WindowVariant.THIN);
    this.dialogueMessageBox.setOrigin(0, 0);
    this.menuMessageBoxContainer.add(this.dialogueMessageBox);

    const menuMessageText = addTextObject(this.scene, this.textPadding, this.textPadding, "", TextStyle.WINDOW, { maxLines: 2 });
    menuMessageText.setName("menu-message");
    menuMessageText.setOrigin(0, 0);
    this.menuMessageBoxContainer.add(menuMessageText);

    this.message = menuMessageText;

    // By default we use the general purpose message window
    this.setDialogTestMode(false);

    this.menuContainer.add(this.menuMessageBoxContainer);

    const manageDataOptions: any[] = []; // TODO: proper type

    const confirmSlot = (message: string, slotFilter: (i: integer) => boolean, callback: (i: integer) => void) => {
      ui.revertMode();
      ui.showText(message, null, () => {
        const config: OptionSelectConfig = {
          options: new Array(5).fill(null).map((_, i) => i).filter(slotFilter).map(i => {
            return {
              label: i18next.t("menuUiHandler:slot", { slotNumber: i + 1 }),
              handler: () => {
                callback(i);
                ui.revertMode();
                ui.showText("", 0);
                return true;
              }
            };
          }).concat([{
            label: i18next.t("menuUiHandler:cancel"),
            handler: () => {
              ui.revertMode();
              ui.showText("", 0);
              return true;
            }
          }]),
          xOffset: 98
        };
        ui.setOverlayMode(Mode.MENU_OPTION_SELECT, config);
      });
    };

    if (Utils.isLocal || Utils.isBeta) {
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
    manageDataOptions.push({
      label: i18next.t("menuUiHandler:importRunHistory"),
      handler: () => {
        this.scene.gameData.importData(GameDataType.RUN_HISTORY);
        return true;
      },
      keepOpen: true
    });
    manageDataOptions.push({
      label: i18next.t("menuUiHandler:exportRunHistory"),
      handler: () => {
        this.scene.gameData.tryExportData(GameDataType.RUN_HISTORY);
        return true;
      },
      keepOpen: true
    });
    if (Utils.isLocal || Utils.isBeta) {
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
    manageDataOptions.push({
      label: i18next.t("menuUiHandler:exportData"),
      handler: () => {
        this.scene.gameData.tryExportData(GameDataType.SYSTEM);
        return true;
      },
      keepOpen: true
    },
    {
      label: i18next.t("menuUiHandler:consentPreferences"),
      handler: () => {
        const consentLink = document.querySelector(".termly-display-preferences") as HTMLInputElement;
        const clickEvent = new MouseEvent("click", {
          view: window,
          bubbles: true,
          cancelable: true
        });
        consentLink.dispatchEvent(clickEvent);
        consentLink.focus();
        return true;
      },
      keepOpen: true
    });
    if (Utils.isLocal || Utils.isBeta) { // this should make sure we don't have this option in live
      manageDataOptions.push({
        label: "Test Dialogue",
        handler: () => {
          ui.playSelect();
          const prefilledText = "";
          const buttonAction: any = {};
          buttonAction["buttonActions"] = [
            (sanitizedName: string) => {
              ui.revertMode();
              ui.playSelect();
              const dialogueTestName = sanitizedName;
              const dialogueName = decodeURIComponent(escape(atob(dialogueTestName)));
              const handler = ui.getHandler() as AwaitableUiHandler;
              handler.tutorialActive = true;
              const interpolatorOptions: any = {};
              const splitArr = dialogueName.split(" "); // this splits our inputted text into words to cycle through later
              const translatedString = splitArr[0]; // this is our outputted i18 string
              const regex = RegExp("\\{\\{(\\w*)\\}\\}", "g"); // this is a regex expression to find all the text between {{ }} in the i18 output
              const matches = i18next.t(translatedString).match(regex) ?? [];
              if (matches.length > 0) {
                for (let match = 0; match < matches.length; match++) {
                  // we add 1 here  because splitArr[0] is our first value for the translatedString, and after that is where the variables are
                  // the regex here in the replace (/\W/g) is to remove the {{ and }} and just give us all alphanumeric characters
                  if (typeof splitArr[match + 1] !== "undefined") {
                    interpolatorOptions[matches[match].replace(/\W/g, "")] = i18next.t(splitArr[match + 1]);
                  }
                }
              }
              // Switch to the dialog test window
              this.setDialogTestMode(true);
              ui.showText(String(i18next.t(translatedString, interpolatorOptions)), null, () => this.scene.ui.showText("", 0, () => {
                handler.tutorialActive = false;
                // Go back to the default message window
                this.setDialogTestMode(false);
              }), null, true);
            },
            () => {
              ui.revertMode();
            }
          ];
          ui.setMode(Mode.TEST_DIALOGUE, buttonAction, prefilledText);
          return true;
        },
        keepOpen: true
      });
    }
    manageDataOptions.push({
      label: i18next.t("menuUiHandler:cancel"),
      handler: () => {
        this.scene.ui.revertMode();
        return true;
      },
      keepOpen: true
    });

    //Thank you Vassiat
    this.manageDataConfig = {
      xOffset: 98,
      options: manageDataOptions,
      maxOptions: 7
    };

    const communityOptions: OptionSelectItem[] = [
      {
        label: "Wiki",
        handler: () => {
          window.open(wikiUrl, "_blank")?.focus();
          return true;
        },
        keepOpen: true
      },
      {
        label: "Discord",
        handler: () => {
          window.open(discordUrl, "_blank")?.focus();
          return true;
        },
        keepOpen: true
      },
      {
        label: "GitHub",
        handler: () => {
          window.open(githubUrl, "_blank")?.focus();
          return true;
        },
        keepOpen: true
      },
      {
        label: "Reddit",
        handler: () => {
          window.open(redditUrl, "_blank")?.focus();
          return true;
        },
        keepOpen: true
      },
      {
        label: i18next.t("menuUiHandler:donate"),
        handler: () => {
          window.open(donateUrl, "_blank")?.focus();
          return true;
        },
        keepOpen: true
      }
    ];
    if (!bypassLogin && loggedInUser?.hasAdminRole) {
      communityOptions.push({
        label: "Admin",
        handler: () => {
          ui.playSelect();
          ui.setOverlayMode(Mode.ADMIN, {
            buttonActions: [
              () => {
                ui.revertMode();
              },
              () => {
                ui.revertMode();
              }
            ]
          });
          return true;
        },
        keepOpen: true
      });
    }
    communityOptions.push({
      label: i18next.t("menuUiHandler:cancel"),
      handler: () => {
        this.scene.ui.revertMode();
        return true;
      }
    });
    this.communityConfig = {
      xOffset: 98,
      options: communityOptions
    };
    this.setCursor(0);
  }

  show(args: any[]): boolean {
    this.render();
    super.show(args);

    this.menuOptions = Utils.getEnumKeys(MenuOptions)
      .map(m => parseInt(MenuOptions[m]) as MenuOptions)
      .filter(m => {
        return !this.excludedMenus().some(exclusion => exclusion.condition && exclusion.options.includes(m));
      });

    this.menuContainer.setVisible(true);
    this.setCursor(0);

    this.getUi().moveTo(this.menuContainer, this.getUi().length - 1);

    this.getUi().hideTooltip();

    this.scene.playSound("ui/menu_open");

    handleTutorial(this.scene, Tutorial.Menu);

    this.bgmBar.toggleBgmBar(true);


    return true;
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;
    let error = false;

    if (button === Button.ACTION) {
      let adjustedCursor = this.cursor;
      const excludedMenu = this.excludedMenus().find(e => e.condition);
      if (excludedMenu !== undefined && excludedMenu.options !== undefined && excludedMenu.options.length > 0) {
        const sortedOptions = excludedMenu.options.sort();
        for (const imo of sortedOptions) {
          if (adjustedCursor >= imo) {
            adjustedCursor++;
          } else {
            break;
          }
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
      case MenuOptions.RUN_HISTORY:
        ui.setOverlayMode(Mode.RUN_HISTORY);
        success = true;
        break;
      case MenuOptions.EGG_LIST:
        if (this.scene.gameData.eggs.length) {
          ui.revertMode();
          ui.setOverlayMode(Mode.EGG_LIST);
          success = true;
        } else {
          ui.showText(i18next.t("menuUiHandler:noEggs"), null, () => ui.showText(""), Utils.fixedInt(1500));
          error = true;
        }
        break;
      case MenuOptions.EGG_GACHA:
        ui.revertMode();
        ui.setOverlayMode(Mode.EGG_GACHA);
        success = true;
        break;
      case MenuOptions.MANAGE_DATA:
        if (!bypassLogin && !this.manageDataConfig.options.some(o => o.label === i18next.t("menuUiHandler:linkDiscord") || o.label === i18next.t("menuUiHandler:unlinkDiscord"))) {
          this.manageDataConfig.options.splice(this.manageDataConfig.options.length - 1, 0,
            {
              label: loggedInUser?.discordId === "" ? i18next.t("menuUiHandler:linkDiscord") : i18next.t("menuUiHandler:unlinkDiscord"),
              handler: () => {
                if (loggedInUser?.discordId === "") {
                  const token = Utils.getCookie(Utils.sessionIdKey);
                  const redirectUri = encodeURIComponent(`${import.meta.env.VITE_SERVER_URL}/auth/discord/callback`);
                  const discordId = import.meta.env.VITE_DISCORD_CLIENT_ID;
                  const discordUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordId}&redirect_uri=${redirectUri}&response_type=code&scope=identify&state=${token}&prompt=none`;
                  window.open(discordUrl, "_self");
                  return true;
                } else {
                  Utils.apiPost("/auth/discord/logout", undefined, undefined, true).then(res => {
                    if (!res.ok) {
                      console.error(`Unlink failed (${res.status}: ${res.statusText})`);
                    }
                    updateUserInfo().then(() => this.scene.reset(true, true));
                  });
                  return true;
                }
              }
            },
            {
              label: loggedInUser?.googleId === "" ? i18next.t("menuUiHandler:linkGoogle") : i18next.t("menuUiHandler:unlinkGoogle"),
              handler: () => {
                if (loggedInUser?.googleId === "") {
                  const token = Utils.getCookie(Utils.sessionIdKey);
                  const redirectUri = encodeURIComponent(`${import.meta.env.VITE_SERVER_URL}/auth/google/callback`);
                  const googleId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
                  const googleUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${googleId}&response_type=code&redirect_uri=${redirectUri}&scope=openid&state=${token}`;
                  window.open(googleUrl, "_self");
                  return true;
                } else {
                  Utils.apiPost("/auth/google/logout", undefined, undefined, true).then(res => {
                    if (!res.ok) {
                      console.error(`Unlink failed (${res.status}: ${res.statusText})`);
                    }
                    updateUserInfo().then(() => this.scene.reset(true, true));
                  });
                  return true;
                }
              }
            });
        }
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
                ui.showText("", 0);
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
            Utils.removeCookie(Utils.sessionIdKey);
            updateUserInfo().then(() => this.scene.reset(true, true));
          });
        };
        if (this.scene.currentBattle) {
          ui.showText(i18next.t("menuUiHandler:losingProgressionWarning"), null, () => {
            ui.setOverlayMode(Mode.CONFIRM, doLogout, () => {
              ui.revertMode();
              ui.showText("", 0);
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

  /**
   * Switch the message window style and size when we are replaying dialog for debug purposes
   * In "dialog test mode", the window takes the whole width of the screen and the text
   * is set up to wrap around the same way as the dialogue during the game
   * @param isDialogMode whether to use the dialog test
   */
  setDialogTestMode(isDialogMode: boolean) {
    this.menuMessageBox.setVisible(!isDialogMode);
    this.dialogueMessageBox.setVisible(isDialogMode);
    // If we're testing dialog, we use the same word wrapping as the battle message handler
    this.message.setWordWrapWidth(isDialogMode ? this.scene.ui.getMessageHandler().wordWrapWidth : this.defaultWordWrapWidth);
    this.message.setX(isDialogMode ? this.textPadding + 1 : this.textPadding);
    this.message.setY(isDialogMode ? this.textPadding + 0.4 : this.textPadding);
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

    this.cursorObj.setScale(this.scale * 6);
    this.cursorObj.setPositionRelative(this.menuBg, 7, 6 + (18 + this.cursor * 96) * this.scale);

    return ret;
  }

  clear() {
    super.clear();
    this.menuContainer.setVisible(false);
    this.bgmBar.toggleBgmBar(false);
    this.eraseCursor();
  }

  eraseCursor() {
    if (this.cursorObj) {
      this.cursorObj.destroy();
    }
    this.cursorObj = null;
  }
}

interface ConditionalMenu {
  condition: boolean;
  options: MenuOptions[];
}
