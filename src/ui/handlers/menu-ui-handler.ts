import { pokerogueApi } from "#api/api";
import { loggedInUser, updateUserInfo } from "#app/account";
import { audioManager } from "#app/global-audio-manager";
import { globalScene } from "#app/global-scene";
import { handleTutorial, Tutorial } from "#app/tutorial";
import { bypassLogin, isApp, isBeta, isDev } from "#constants/app-constants";
import { AdminMode, getAdminModeName } from "#enums/admin-mode";
import { Button } from "#enums/buttons";
import { GameDataType } from "#enums/game-data-type";
import { TextStyle } from "#enums/text-style";
import { UiMode } from "#enums/ui-mode";
import type { ConfirmModeConfig, OptionSelectItem, OptionSelectModeConfig } from "#types/ui-types";
import type { AwaitableUiHandler } from "#ui/awaitable-ui-handler";
import { BgmBar } from "#ui/bgm-bar";
import { OptionSelectUiHandler } from "#ui/option-select-ui-handler";
import { addTextObject } from "#ui/text";
import { addWindow, WindowVariant } from "#ui/ui-theme";
import { fixedInt, sessionIdKey } from "#utils/common";
import { getCookie } from "#utils/cookies";
import { getEnumValues } from "#utils/enums";
import { toCamelCase } from "#utils/strings";
import i18next from "i18next";

interface ConditionalMenu {
  excluded: boolean;
  options: MenuOptions[];
}

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

let wikiUrl = import.meta.env.VITE_WIKI_URL;
const { VITE_DISCORD_URL, VITE_GITHUB_URL, VITE_REDDIT_URL, VITE_DONATE_URL } = import.meta.env;

export class MenuUiHandler extends OptionSelectUiHandler {
  private readonly textPadding = 8;

  private menuContainer: Phaser.GameObjects.Container;
  private menuMessageBoxContainer: Phaser.GameObjects.Container;
  private menuMessageBox: Phaser.GameObjects.NineSlice;
  private menuOverlay: Phaser.GameObjects.Rectangle;
  /** Message box used by the dialogue test option */
  private dialogueMessageBox: Phaser.GameObjects.NineSlice;

  private readonly excludedMenus: () => ConditionalMenu[];

  protected manageDataConfig: OptionSelectModeConfig;
  protected communityConfig: OptionSelectModeConfig;

  public bgmBar: BgmBar;

  constructor(mode: UiMode = UiMode.MENU) {
    super(mode);

    this.excludedMenus = () => [
      {
        excluded: globalScene.phaseManager.getCurrentPhase().is("SelectModifierPhase"),
        options: [MenuOptions.EGG_GACHA, MenuOptions.EGG_LIST],
      },
      { excluded: bypassLogin, options: [MenuOptions.LOG_OUT] },
      { excluded: !globalScene.currentBattle, options: [MenuOptions.SAVE_AND_QUIT] },
    ];
  }

  protected override get windowHeight(): number {
    return globalScene.scaledCanvas.height - 2; // always fill the screen
  }

  public override setup(): void {
    super.setup();

    const { ui } = globalScene;
    // wiki url directs based on languges available on wiki
    const lang = (i18next.resolvedLanguage ?? "en").slice(0, 2);
    if (["de", "fr", "ko", "zh"].includes(lang)) {
      wikiUrl = `https://wiki.pokerogue.net/${lang}:start`;
    }

    this.bgmBar = new BgmBar();
    this.bgmBar.setup();

    ui.bgmBar = this.bgmBar;

    const { width, height } = globalScene.scaledCanvas;

    // Background overlay that sits below everything in the menu
    this.menuOverlay = new Phaser.GameObjects.Rectangle(
      globalScene,
      -width - 1,
      -height - 1,
      width + 2,
      height + 2,
      0xffffff,
      0.3,
    )
      .setName("menu-overlay")
      .setOrigin(0);
    this.optionSelectContainer.addAt(this.menuOverlay, 0);

    this.menuContainer = globalScene.add
      .container(2 - width, 2 - height)
      .setName("menu")
      .add(this.bgmBar);

    this.menuMessageBoxContainer = globalScene.add //
      .container(0, 130)
      .setName("menu-message-box")
      .setVisible(false);

    this.menuMessageBox = addWindow(0, 0, width, 48) //
      .setOrigin(0);

    // Full-width window used for testing dialog messages in debug mode
    const dialogueWidth = width + this.textPadding * 2;
    this.dialogueMessageBox = addWindow(-this.textPadding, 0, dialogueWidth, 49, false, false, 0, 0, WindowVariant.THIN)
      .setOrigin(0)
      .setVisible(false);

    this.message = addTextObject(this.textPadding, this.textPadding, "", TextStyle.WINDOW, { maxLines: 2 })
      .setName("menu-message")
      .setOrigin(0)
      .setWordWrapWidth(1224);
    this.menuMessageBoxContainer.add([this.menuMessageBox, this.dialogueMessageBox, this.message]);

    this.initTutorialOverlay(this.menuContainer);
    this.initPromptSprite(this.menuMessageBoxContainer);
    this.menuContainer.add(this.menuMessageBoxContainer);

    this.optionSelectContainer.add(this.menuContainer);

    this.initManageDataOptions();
    this.initCommunityMenuOptions();
  }

  public override show(): boolean {
    const config: OptionSelectModeConfig = this.getMenuOptionsConfig();

    super.show([config]);

    // Make sure the tutorial overlay sits above everything, but below the message box
    this.menuContainer.bringToTop(this.tutorialOverlay);
    this.menuContainer.bringToTop(this.menuMessageBoxContainer);

    this.getUi().hideTooltip();

    audioManager.playSound("ui/menu_open");

    this.cursorObj?.setVisible(false);
    handleTutorial(Tutorial.MENU).then(() => {
      this.cursorObj?.setVisible(true);
      this.bgmBar.toggleBgmBar(true);
    });

    return true;
  }

  private getMenuOptionsConfig(): OptionSelectModeConfig {
    const validOptions = getEnumValues(MenuOptions).filter(
      m => !this.excludedMenus().some(em => em.excluded && em.options.includes(m)),
    );

    const options: OptionSelectItem[] = validOptions.map((option: MenuOptions) => {
      return {
        label: `${i18next.t(`menuUiHandler:${toCamelCase(MenuOptions[option])}`)}`,
        handler: () => this.optionSelected(option),
        keepOpen: true,
      };
    });

    return {
      options,
      maxOptions: 10,
      blockCancelButton: true, // we take care of closing the menu in this handler
      yOffset: 1,
      onResize: (w: number, _h: number) => {
        // Init the community and manage data menus config once the menu has its proper size
        this.initCommunityMenuOptions();
        this.initManageDataOptions();
        // Resize the message box so that it does not go over the menu
        this.menuMessageBox.setSize(globalScene.scaledCanvas.width - w - 2, 48);
      },
    };
  }

  private initManageDataOptions(): void {
    const ui = this.getUi();

    const manageDataOptions: OptionSelectItem[] = [];

    const confirmSlot = (message: string, slotFilter: (i: number) => boolean, callback: (i: number) => void) => {
      ui.revertMode();
      ui.showText(message, null, () => {
        const config: OptionSelectModeConfig = {
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
          xOffset: this.optionSelectBg.displayWidth,
          yOffset: this.menuMessageBox.displayHeight + 1,
        };
        ui.setOverlayMode(UiMode.MENU_OPTION_SELECT, config);
      });
    };

    if (isBeta || isDev || isApp) {
      manageDataOptions.push({
        label: i18next.t("menuUiHandler:importSession"),
        handler: () => {
          confirmSlot(
            i18next.t("menuUiHandler:importSlotSelect"),
            () => true,
            slotId => globalScene.gameData.importData(GameDataType.SESSION, slotId, this.optionSelectBg.displayWidth),
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
        ui.revertMode(); // TODO: is this correct?
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
    if (isBeta || isDev || isApp) {
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
    manageDataOptions.push({
      label: i18next.t("menuUiHandler:exportData"),
      handler: () => {
        globalScene.gameData.tryExportData(GameDataType.SYSTEM);
        return true;
      },
      keepOpen: true,
    });
    if (!bypassLogin) {
      manageDataOptions.push({
        label: i18next.t("menuUiHandler:clearLocalData"),
        handler: () => {
          ui.revertMode();
          ui.showText(i18next.t("menuUiHandler:clearLocalDataWarning"), null, () => {
            const config: ConfirmModeConfig = {
              yesHandler: () => {
                globalScene.gameData.clearLocalData();
                window.location.reload();
              },
              noHandler: () => {
                globalScene.ui.revertMode();
                globalScene.ui.showText("", 0);
              },
            };
            ui.setOverlayMode(UiMode.CONFIRM, config);
          });
          return true;
        },
        keepOpen: true,
      });
      manageDataOptions.push({
        // Note: i18n key is under `menu`, not `menuUiHandler` to avoid duplication
        label: i18next.t("menu:changePassword"),
        handler: () => {
          ui.setOverlayMode(UiMode.CHANGE_PASSWORD_FORM, {
            buttonActions: [() => ui.revertMode(), () => ui.revertMode()],
          });
          return true;
        },
        keepOpen: true,
      });
    }
    if (isBeta || isDev) {
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
              this.toggleDialogTestMode(true);
              ui.showText(
                String(i18next.t(translatedString, interpolatorOptions)),
                null,
                () =>
                  globalScene.ui.showText("", 0, () => {
                    handler.tutorialActive = false;
                    // Go back to the default message window
                    this.toggleDialogTestMode(false);
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

    this.manageDataConfig = {
      xOffset: this.optionSelectBg.displayWidth,
      yOffset: this.menuMessageBox.displayHeight + 1,
      options: manageDataOptions,
      maxOptions: 7,
    };
  }

  private initCommunityMenuOptions(): void {
    const ui = this.getUi();

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
          window.open(VITE_DISCORD_URL, "_blank")?.focus();
          return true;
        },
        keepOpen: true,
      },
      {
        label: "GitHub",
        handler: () => {
          window.open(VITE_GITHUB_URL, "_blank")?.focus();
          return true;
        },
        keepOpen: true,
      },
      {
        label: "Reddit",
        handler: () => {
          window.open(VITE_REDDIT_URL, "_blank")?.focus();
          return true;
        },
        keepOpen: true,
      },
      {
        label: i18next.t("menuUiHandler:donate"),
        handler: () => {
          window.open(VITE_DONATE_URL, "_blank")?.focus();
          return true;
        },
        keepOpen: true,
      },
    ];
    if (bypassLogin || loggedInUser?.hasAdminRole) {
      communityOptions.push({
        label: "Admin",
        handler: () => {
          // this is here so that we can skip the menu populating enums that aren't meant for the menu
          const skippedAdminModes: AdminMode[] = [AdminMode.ADMIN];
          const options: OptionSelectItem[] = [];
          Object.values(AdminMode)
            .filter(v => !skippedAdminModes.includes(v))
            .forEach(mode => {
              // this gets all the enums in a way we can use
              options.push({
                label: getAdminModeName(mode),
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
                    // mode is our AdminMode enum
                    mode,
                  );
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
          const yOffset = this.menuMessageBox.displayHeight + 1;
          const optionSelectConfig: OptionSelectModeConfig = { options, yOffset };
          globalScene.ui.setOverlayMode(UiMode.OPTION_SELECT, optionSelectConfig);
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
      xOffset: this.optionSelectBg.displayWidth,
      yOffset: this.menuMessageBox.displayHeight + 1,
      options: communityOptions,
    };
    this.setCursor(0);
  }

  /**
   * Toggles the visibility of the dialogue box used for testing text/translations.
   * @remarks
   * In "dialog test mode", the window takes the whole width of the screen and the text \
   * is set up to wrap around the same way as the dialogue during the game
   * @param show - Whether to show the dialogue box
   */
  private toggleDialogTestMode(show: boolean): void {
    const defaultWordWrapWidth = 1224;

    this.menuMessageBox.setVisible(!show);
    this.dialogueMessageBox.setVisible(show);

    this.message
      .setWordWrapWidth(show ? globalScene.ui.getMessageHandler().wordWrapWidth : defaultWordWrapWidth)
      .setX(this.textPadding + (show ? 1 : 0))
      .setY(this.textPadding + (show ? 0.4 : 0));
  }

  private optionSelected(option: MenuOptions): boolean {
    let success = false;
    const ui = this.getUi();
    switch (option) {
      case MenuOptions.GAME_SETTINGS:
        ui.setOverlayMode(UiMode.SETTINGS_GENERAL);
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
                pokerogueApi
                  .unlinkDiscord()
                  .then(isSuccess => {
                    if (!isSuccess) {
                      console.warn("Error unlinking Discord account!");
                    }
                    return updateUserInfo();
                  })
                  .then(() => globalScene.reset(true, true));

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
                pokerogueApi
                  .unlinkGoogle()
                  .then(isSuccess => {
                    if (!isSuccess) {
                      console.warn("Error unlinking Google account!");
                    }
                    return updateUserInfo();
                  })
                  .then(() => globalScene.reset(true, true));

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
      case MenuOptions.SAVE_AND_QUIT: {
        if (!globalScene.currentBattle) {
          break;
        }
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
            const options: ConfirmModeConfig = {
              yesHandler: doSaveQuit,
              noHandler: () => {
                ui.revertMode();
                this.showText("", 0);
              },
              xOffset: this.optionSelectBg.displayWidth,
            };
            ui.setOverlayMode(UiMode.CONFIRM, options);
          });
        } else {
          doSaveQuit();
        }
        break;
      }
      case MenuOptions.LOG_OUT: {
        success = true;
        const doLogout = () => {
          ui.setMode(UiMode.LOADING, {
            buttonActions: [],
            fadeOut: () =>
              pokerogueApi.account
                .logout()
                .then(() => updateUserInfo())
                .then(() => globalScene.reset(true, true)),
          });
        };

        if (globalScene.currentBattle) {
          ui.showText(i18next.t("menuUiHandler:losingProgressionWarning"), null, () => {
            if (!this.active) {
              this.showText("", 0);
              return;
            }
            const options: ConfirmModeConfig = {
              yesHandler: doLogout,
              noHandler: () => {
                ui.revertMode();
                this.showText("", 0);
              },
              xOffset: this.optionSelectBg.displayWidth,
            };
            ui.setOverlayMode(UiMode.CONFIRM, options);
          });
        } else {
          doLogout();
        }

        break;
      }
    }
    return success;
  }

  public override processInput(button: Button): boolean {
    const ui = this.getUi();

    if (button === Button.CANCEL) {
      ui.playSelect();
      ui.revertMode().then(result => {
        if (!result) {
          ui.setMode(UiMode.MESSAGE);
        }
      });

      return true;
    }

    return super.processInput(button);
  }

  showText(
    text: string,
    delay?: number,
    callback?: () => void,
    callbackDelay?: number,
    prompt?: boolean,
    promptDelay?: number,
  ): void {
    this.menuMessageBoxContainer.setVisible(!!text);

    super.showText(text, delay, callback, callbackDelay, prompt, promptDelay);
  }

  public override clear(): void {
    super.clear();

    this.bgmBar.toggleBgmBar(false);
  }
}
