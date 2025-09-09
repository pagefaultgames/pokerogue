import { pokerogueApi } from "#api/pokerogue-api";
import { loggedInUser, updateUserInfo } from "#app/account";
import { globalScene } from "#app/global-scene";
import { bypassLogin } from "#app/global-vars/bypass-login";
import { handleTutorial, Tutorial } from "#app/tutorial";
import { Button } from "#enums/buttons";
import { GameDataType } from "#enums/game-data-type";
import { TextStyle } from "#enums/text-style";
import { UiMode } from "#enums/ui-mode";
import { BgmBar } from "#ui/containers/bgm-bar";
import type { OptionSelectConfig, OptionSelectItem } from "#ui/handlers/abstract-option-select-ui-handler";
import type { AwaitableUiHandler } from "#ui/handlers/awaitable-ui-handler";
import { MessageUiHandler } from "#ui/handlers/message-ui-handler";
import { addTextObject, getTextStyleOptions } from "#ui/text";
import { addWindow, WindowVariant } from "#ui/ui-theme";
import { fixedInt, isLocal, sessionIdKey } from "#utils/common";
import { getCookie } from "#utils/cookies";
import { getEnumValues } from "#utils/enums";
import { toCamelCase } from "#utils/strings";
import { isBeta } from "#utils/utility-vars";
import i18next from "i18next";
import { AdminMode, getAdminModeName } from "./admin-ui-handler";

enum MenuOptions {
  GAME_SETTINGS,
  ACHIEVEMENTS,
  STATS,
  EGG_LIST,
  EGG_GACHA,
  POKEDEX,
  MANAGE_DATA,
  COMMUNITY,
  SAVE_AND_QUIT,
  LOG_OUT,
}

let wikiUrl = "https://wiki.pokerogue.net/start";
const discordUrl = "https://discord.gg/pokerogue";
const githubUrl = "https://github.com/pagefaultgames/pokerogue";
const redditUrl = "https://www.reddit.com/r/pokerogue";
const donateUrl = "https://github.com/sponsors/pagefaultgames";

export class MenuUiHandler extends MessageUiHandler {
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

  protected scale = 0.1666666667;

  public bgmBar: BgmBar;

  constructor(mode: UiMode | null = null) {
    super(mode);

    this.excludedMenus = () => [
      {
        condition: [UiMode.COMMAND, UiMode.TITLE].includes(mode ?? UiMode.TITLE),
        options: [MenuOptions.EGG_GACHA, MenuOptions.EGG_LIST],
      },
      { condition: bypassLogin, options: [MenuOptions.LOG_OUT] },
    ];

    this.menuOptions = getEnumValues(MenuOptions).filter(m => {
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

    this.bgmBar = new BgmBar();
    this.bgmBar.setup();

    ui.bgmBar = this.bgmBar;

    this.menuContainer = globalScene.add.container(1, -globalScene.scaledCanvas.height + 1);
    this.menuContainer.setName("menu");
    this.menuContainer.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, globalScene.scaledCanvas.width, globalScene.scaledCanvas.height),
      Phaser.Geom.Rectangle.Contains,
    );

    this.menuOverlay = new Phaser.GameObjects.Rectangle(
      globalScene,
      -1,
      -1,
      globalScene.scaledCanvas.width,
      globalScene.scaledCanvas.height,
      0xffffff,
      0.3,
    );
    this.menuOverlay.setName("menu-overlay");
    this.menuOverlay.setOrigin(0, 0);
    this.menuContainer.add(this.menuOverlay);

    this.menuContainer.add(this.bgmBar);

    this.menuContainer.setVisible(false);
  }

  render() {
    const ui = this.getUi();
    this.excludedMenus = () => [
      {
        condition: globalScene.phaseManager.getCurrentPhase().is("SelectModifierPhase"),
        options: [MenuOptions.EGG_GACHA],
      },
      { condition: bypassLogin, options: [MenuOptions.LOG_OUT] },
    ];

    this.menuOptions = getEnumValues(MenuOptions).filter(m => {
      return !this.excludedMenus().some(exclusion => exclusion.condition && exclusion.options.includes(m));
    });

    this.optionSelectText = addTextObject(
      0,
      0,
      this.menuOptions.map(o => `${i18next.t(`menuUiHandler:${toCamelCase(MenuOptions[o])}`)}`).join("\n"),
      TextStyle.WINDOW,
      { maxLines: this.menuOptions.length },
    );
    this.optionSelectText.setLineSpacing(12);

    this.scale = getTextStyleOptions(TextStyle.WINDOW).scale;
    this.menuBg = addWindow(
      globalScene.scaledCanvas.width - (this.optionSelectText.displayWidth + 25),
      0,
      this.optionSelectText.displayWidth + 19 + 24 * this.scale,
      globalScene.scaledCanvas.height - 2,
    );
    this.menuBg.setOrigin(0, 0);

    this.optionSelectText.setPositionRelative(this.menuBg, 10 + 24 * this.scale, 6);

    this.menuContainer.add(this.menuBg);

    this.menuContainer.add(this.optionSelectText);

    ui.add(this.menuContainer);

    this.menuMessageBoxContainer = globalScene.add.container(0, 130);
    this.menuMessageBoxContainer.setName("menu-message-box");
    this.menuMessageBoxContainer.setVisible(false);

    // Window for general messages
    this.menuMessageBox = addWindow(0, 0, this.defaultMessageBoxWidth, 48);
    this.menuMessageBox.setOrigin(0, 0);
    this.menuMessageBoxContainer.add(this.menuMessageBox);

    // Full-width window used for testing dialog messages in debug mode
    this.dialogueMessageBox = addWindow(
      -this.textPadding,
      0,
      globalScene.scaledCanvas.width + this.textPadding * 2,
      49,
      false,
      false,
      0,
      0,
      WindowVariant.THIN,
    );
    this.dialogueMessageBox.setOrigin(0, 0);
    this.menuMessageBoxContainer.add(this.dialogueMessageBox);

    const menuMessageText = addTextObject(this.textPadding, this.textPadding, "", TextStyle.WINDOW, { maxLines: 2 });
    menuMessageText.setName("menu-message");
    menuMessageText.setOrigin(0, 0);
    this.menuMessageBoxContainer.add(menuMessageText);

    this.initTutorialOverlay(this.menuContainer);
    this.initPromptSprite(this.menuMessageBoxContainer);

    this.message = menuMessageText;

    // By default we use the general purpose message window
    this.setDialogTestMode(false);

    this.menuContainer.add(this.menuMessageBoxContainer);

    const manageDataOptions: any[] = []; // TODO: proper type

    const confirmSlot = (message: string, slotFilter: (i: number) => boolean, callback: (i: number) => void) => {
      ui.revertMode();
      ui.showText(message, null, () => {
        const config: OptionSelectConfig = {
          options: new Array(5)
            .fill(null)
            .map((_, i) => i)
            .filter(slotFilter)
            .map(i => {
              return {
                label: i18next.t("menuUiHandler:slot", { slotNumber: i + 1 }),
                handler: () => {
                  callback(i);
                  ui.revertMode();
                  ui.showText("", 0);
                  return true;
                },
              };
            })
            .concat([
              {
                label: i18next.t("menuUiHandler:cancel"),
                handler: () => {
                  ui.revertMode();
                  ui.showText("", 0);
                  return true;
                },
              },
            ]),
          xOffset: 98,
        };
        ui.setOverlayMode(UiMode.MENU_OPTION_SELECT, config);
      });
    };

    if (isLocal || isBeta) {
      manageDataOptions.push({
        label: i18next.t("menuUiHandler:importSession"),
        handler: () => {
          confirmSlot(
            i18next.t("menuUiHandler:importSlotSelect"),
            () => true,
            slotId => globalScene.gameData.importData(GameDataType.SESSION, slotId),
          );
          return true;
        },
        keepOpen: true,
      });
    }
    manageDataOptions.push({
      label: i18next.t("menuUiHandler:exportSession"),
      handler: () => {
        const dataSlots: number[] = [];
        Promise.all(
          new Array(5).fill(null).map((_, i) => {
            const slotId = i;
            return globalScene.gameData.getSession(slotId).then(data => {
              if (data) {
                dataSlots.push(slotId);
              }
            });
          }),
        ).then(() => {
          confirmSlot(
            i18next.t("menuUiHandler:exportSlotSelect"),
            i => dataSlots.indexOf(i) > -1,
            slotId => globalScene.gameData.tryExportData(GameDataType.SESSION, slotId),
          );
        });
        return true;
      },
      keepOpen: true,
    });
    manageDataOptions.push({
      label: i18next.t("menuUiHandler:importRunHistory"),
      handler: () => {
        globalScene.gameData.importData(GameDataType.RUN_HISTORY);
        return true;
      },
      keepOpen: true,
    });
    manageDataOptions.push({
      label: i18next.t("menuUiHandler:exportRunHistory"),
      handler: () => {
        globalScene.gameData.tryExportData(GameDataType.RUN_HISTORY);
        return true;
      },
      keepOpen: true,
    });
    if (isLocal || isBeta) {
      manageDataOptions.push({
        label: i18next.t("menuUiHandler:importData"),
        handler: () => {
          ui.revertMode();
          globalScene.gameData.importData(GameDataType.SYSTEM);
          return true;
        },
        keepOpen: true,
      });
    }
    manageDataOptions.push(
      {
        label: i18next.t("menuUiHandler:exportData"),
        handler: () => {
          globalScene.gameData.tryExportData(GameDataType.SYSTEM);
          return true;
        },
        keepOpen: true,
      },
      {
        // Note: i18n key is under `menu`, not `menuUiHandler` to avoid duplication
        label: i18next.t("menu:changePassword"),
        handler: () => {
          ui.setOverlayMode(UiMode.CHANGE_PASSWORD_FORM, {
            buttonActions: [() => ui.revertMode(), () => ui.revertMode()],
          });
          return true;
        },
        keepOpen: true,
      },
      {
        label: i18next.t("menuUiHandler:consentPreferences"),
        handler: () => {
          const consentLink = document.querySelector(".termly-display-preferences") as HTMLInputElement;
          const clickEvent = new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
          });
          consentLink.dispatchEvent(clickEvent);
          consentLink.focus();
          return true;
        },
        keepOpen: true,
      },
    );
    if (isLocal || isBeta) {
      // this should make sure we don't have this option in live
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
              const regex = /\{\{(\w*)\}\}/g; // this is a regex expression to find all the text between {{ }} in the i18 output
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
              ui.showText(
                String(i18next.t(translatedString, interpolatorOptions)),
                null,
                () =>
                  globalScene.ui.showText("", 0, () => {
                    handler.tutorialActive = false;
                    // Go back to the default message window
                    this.setDialogTestMode(false);
                  }),
                null,
                true,
              );
            },
            () => {
              ui.revertMode();
            },
          ];
          ui.setMode(UiMode.TEST_DIALOGUE, buttonAction, prefilledText);
          return true;
        },
        keepOpen: true,
      });
    }
    manageDataOptions.push({
      label: i18next.t("menuUiHandler:cancel"),
      handler: () => {
        globalScene.ui.revertMode();
        return true;
      },
      keepOpen: true,
    });

    //Thank you Vassiat
    this.manageDataConfig = {
      xOffset: 98,
      options: manageDataOptions,
      maxOptions: 7,
    };

    const communityOptions: OptionSelectItem[] = [
      {
        label: "Wiki",
        handler: () => {
          window.open(wikiUrl, "_blank")?.focus();
          return true;
        },
        keepOpen: true,
      },
      {
        label: "Discord",
        handler: () => {
          window.open(discordUrl, "_blank")?.focus();
          return true;
        },
        keepOpen: true,
      },
      {
        label: "GitHub",
        handler: () => {
          window.open(githubUrl, "_blank")?.focus();
          return true;
        },
        keepOpen: true,
      },
      {
        label: "Reddit",
        handler: () => {
          window.open(redditUrl, "_blank")?.focus();
          return true;
        },
        keepOpen: true,
      },
      {
        label: i18next.t("menuUiHandler:donate"),
        handler: () => {
          window.open(donateUrl, "_blank")?.focus();
          return true;
        },
        keepOpen: true,
      },
    ];
    if (!bypassLogin && loggedInUser?.hasAdminRole) {
      communityOptions.push({
        label: "Admin",
        handler: () => {
          const skippedAdminModes: AdminMode[] = [AdminMode.ADMIN]; // this is here so that we can skip the menu populating enums that aren't meant for the menu, such as the AdminMode.ADMIN
          const options: OptionSelectItem[] = [];
          Object.values(AdminMode)
            .filter(v => !Number.isNaN(Number(v)) && !skippedAdminModes.includes(v as AdminMode))
            .forEach(mode => {
              // this gets all the enums in a way we can use
              options.push({
                label: getAdminModeName(mode as AdminMode),
                handler: () => {
                  ui.playSelect();
                  ui.setOverlayMode(
                    UiMode.ADMIN,
                    {
                      buttonActions: [
                        // we double revert here and below to go back 2 layers of menus
                        () => {
                          ui.revertMode();
                          ui.revertMode();
                        },
                        () => {
                          ui.revertMode();
                          ui.revertMode();
                        },
                      ],
                    },
                    mode,
                  ); // mode is our AdminMode enum
                  return true;
                },
              });
            });
          options.push({
            label: "Cancel",
            handler: () => {
              ui.revertMode();
              return true;
            },
          });
          globalScene.ui.setOverlayMode(UiMode.OPTION_SELECT, {
            options,
            delay: 0,
          });
          return true;
        },
        keepOpen: true,
      });
    }
    communityOptions.push({
      label: i18next.t("menuUiHandler:cancel"),
      handler: () => {
        globalScene.ui.revertMode();
        return true;
      },
    });
    this.communityConfig = {
      xOffset: 98,
      options: communityOptions,
    };
    this.setCursor(0);
  }

  show(args: any[]): boolean {
    this.render();
    super.show(args);

    this.menuOptions = getEnumValues(MenuOptions).filter(m => {
      return !this.excludedMenus().some(exclusion => exclusion.condition && exclusion.options.includes(m));
    });

    this.menuContainer.setVisible(true);
    this.setCursor(0);

    this.getUi().moveTo(this.menuContainer, this.getUi().length - 1);

    this.getUi().hideTooltip();

    globalScene.playSound("ui/menu_open");

    // Make sure the tutorial overlay sits above everything, but below the message box
    this.menuContainer.bringToTop(this.tutorialOverlay);
    this.menuContainer.bringToTop(this.menuMessageBoxContainer);
    handleTutorial(Tutorial.Menu);

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
      this.showText("", 0);
      switch (adjustedCursor) {
        case MenuOptions.GAME_SETTINGS:
          ui.setOverlayMode(UiMode.SETTINGS);
          success = true;
          break;
        case MenuOptions.ACHIEVEMENTS:
          ui.setOverlayMode(UiMode.ACHIEVEMENTS);
          success = true;
          break;
        case MenuOptions.STATS:
          ui.setOverlayMode(UiMode.GAME_STATS);
          success = true;
          break;
        case MenuOptions.EGG_LIST:
          if (globalScene.gameData.eggs.length > 0) {
            ui.revertMode();
            ui.setOverlayMode(UiMode.EGG_LIST);
            success = true;
          } else {
            ui.showText(i18next.t("menuUiHandler:noEggs"), null, () => ui.showText(""), fixedInt(1500));
            error = true;
          }
          break;
        case MenuOptions.EGG_GACHA:
          ui.revertMode();
          ui.setOverlayMode(UiMode.EGG_GACHA);
          success = true;
          break;
        case MenuOptions.POKEDEX:
          ui.revertMode();
          ui.setOverlayMode(UiMode.POKEDEX);
          success = true;
          break;
        case MenuOptions.MANAGE_DATA:
          if (
            !bypassLogin
            && !this.manageDataConfig.options.some(
              o =>
                o.label === i18next.t("menuUiHandler:linkDiscord")
                || o.label === i18next.t("menuUiHandler:unlinkDiscord"),
            )
          ) {
            this.manageDataConfig.options.splice(
              this.manageDataConfig.options.length - 1,
              0,
              {
                label:
                  loggedInUser?.discordId === ""
                    ? i18next.t("menuUiHandler:linkDiscord")
                    : i18next.t("menuUiHandler:unlinkDiscord"),
                handler: () => {
                  if (loggedInUser?.discordId === "") {
                    const token = getCookie(sessionIdKey);
                    const redirectUri = encodeURIComponent(`${import.meta.env.VITE_SERVER_URL}/auth/discord/callback`);
                    const discordId = import.meta.env.VITE_DISCORD_CLIENT_ID;
                    const discordUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordId}&redirect_uri=${redirectUri}&response_type=code&scope=identify&state=${token}&prompt=none`;
                    window.open(discordUrl, "_self");
                    return true;
                  }
                  pokerogueApi.unlinkDiscord().then(_isSuccess => {
                    updateUserInfo().then(() => globalScene.reset(true, true));
                  });
                  return true;
                },
              },
              {
                label:
                  loggedInUser?.googleId === ""
                    ? i18next.t("menuUiHandler:linkGoogle")
                    : i18next.t("menuUiHandler:unlinkGoogle"),
                handler: () => {
                  if (loggedInUser?.googleId === "") {
                    const token = getCookie(sessionIdKey);
                    const redirectUri = encodeURIComponent(`${import.meta.env.VITE_SERVER_URL}/auth/google/callback`);
                    const googleId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
                    const googleUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${googleId}&response_type=code&redirect_uri=${redirectUri}&scope=openid&state=${token}`;
                    window.open(googleUrl, "_self");
                    return true;
                  }
                  pokerogueApi.unlinkGoogle().then(_isSuccess => {
                    updateUserInfo().then(() => globalScene.reset(true, true));
                  });
                  return true;
                },
              },
            );
          }
          ui.setOverlayMode(UiMode.MENU_OPTION_SELECT, this.manageDataConfig);
          success = true;
          break;
        case MenuOptions.COMMUNITY:
          ui.setOverlayMode(UiMode.MENU_OPTION_SELECT, this.communityConfig);
          success = true;
          break;
        case MenuOptions.SAVE_AND_QUIT:
          if (globalScene.currentBattle) {
            success = true;
            const doSaveQuit = () => {
              ui.setMode(UiMode.LOADING, {
                buttonActions: [],
                fadeOut: () =>
                  globalScene.gameData.saveAll(true, true, true, true).then(() => {
                    globalScene.reset(true);
                  }),
              });
            };
            if (globalScene.currentBattle.turn > 1) {
              ui.showText(i18next.t("menuUiHandler:losingProgressionWarning"), null, () => {
                if (!this.active) {
                  this.showText("", 0);
                  return;
                }
                ui.setOverlayMode(
                  UiMode.CONFIRM,
                  doSaveQuit,
                  () => {
                    ui.revertMode();
                    this.showText("", 0);
                  },
                  false,
                  -98,
                );
              });
            } else {
              doSaveQuit();
            }
          } else {
            error = true;
          }
          break;
        case MenuOptions.LOG_OUT: {
          success = true;
          const doLogout = () => {
            ui.setMode(UiMode.LOADING, {
              buttonActions: [],
              fadeOut: () =>
                pokerogueApi.account.logout().then(() => {
                  updateUserInfo().then(() => globalScene.reset(true, true));
                }),
            });
          };
          if (globalScene.currentBattle) {
            ui.showText(i18next.t("menuUiHandler:losingProgressionWarning"), null, () => {
              if (!this.active) {
                this.showText("", 0);
                return;
              }
              ui.setOverlayMode(
                UiMode.CONFIRM,
                doLogout,
                () => {
                  ui.revertMode();
                  this.showText("", 0);
                },
                false,
                -98,
              );
            });
          } else {
            doLogout();
          }
          break;
        }
      }
    } else if (button === Button.CANCEL) {
      success = true;
      ui.revertMode().then(result => {
        if (!result) {
          ui.setMode(UiMode.MESSAGE);
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
    this.message.setWordWrapWidth(
      isDialogMode ? globalScene.ui.getMessageHandler().wordWrapWidth : this.defaultWordWrapWidth,
    );
    this.message.setX(isDialogMode ? this.textPadding + 1 : this.textPadding);
    this.message.setY(isDialogMode ? this.textPadding + 0.4 : this.textPadding);
  }

  showText(
    text: string,
    delay?: number,
    callback?: Function,
    callbackDelay?: number,
    prompt?: boolean,
    promptDelay?: number,
  ): void {
    this.menuMessageBoxContainer.setVisible(!!text);

    super.showText(text, delay, callback, callbackDelay, prompt, promptDelay);
  }

  setCursor(cursor: number): boolean {
    const ret = super.setCursor(cursor);

    if (!this.cursorObj) {
      this.cursorObj = globalScene.add.image(0, 0, "cursor");
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
