import { pokerogueApi } from "#api/pokerogue-api";
import { globalScene } from "#app/global-scene";
import { TextStyle } from "#enums/text-style";
import { UiMode } from "#enums/ui-mode";
import { languageOptions } from "#system/settings-language";
import type { OptionSelectItem } from "#ui/abstract-option-select-ui-handler";
import type { InputFieldConfig } from "#ui/form-modal-ui-handler";
import { FormModalUiHandler } from "#ui/form-modal-ui-handler";
import type { ModalConfig } from "#ui/modal-ui-handler";
import { addTextObject } from "#ui/text";
import { addWindow } from "#ui/ui-theme";
import { fixedInt } from "#utils/common";
import i18next from "i18next";
import JSZip from "jszip";

interface BuildInteractableImageOpts {
  scale?: number;
  x?: number;
  y?: number;
  origin?: { x: number; y: number };
}

/**
 * The maximum number of saves that are allowed to show up in the username panel pefore
 * the `P02: Too many saves` popup is displayed.
 *
 * @privateRemarks
 * This limitation is in place to allow for the password reset helpers to get
 * enough information in one screenshot. If the user has too many saves, this
 * complicates the interaction as it would require scrolling, which will
 * make tickets take longer to resolve.
 */
const MAX_SAVES_FOR_USERNAME_PANEL = 7;

export class LoginFormUiHandler extends FormModalUiHandler {
  private readonly ERR_USERNAME: string = "invalid username";
  private readonly ERR_PASSWORD: string = "invalid password";
  private readonly ERR_ACCOUNT_EXIST: string = "account doesn't exist";
  private readonly ERR_PASSWORD_MATCH: string = "password doesn't match";
  private readonly ERR_NO_SAVES: string = "No save files found";
  private readonly ERR_TOO_MANY_SAVES: string = "Too many save files found";

  private googleImage: Phaser.GameObjects.Image;
  private discordImage: Phaser.GameObjects.Image;
  private usernameInfoImage: Phaser.GameObjects.Image;
  private saveDownloadImage: Phaser.GameObjects.Image;
  private changeLanguageImage: Phaser.GameObjects.Image;
  private externalPartyContainer: Phaser.GameObjects.Container;
  private infoContainer: Phaser.GameObjects.Container;
  private externalPartyBg: Phaser.GameObjects.NineSlice;
  private externalPartyTitle: Phaser.GameObjects.Text;
  constructor(mode: UiMode | null = null) {
    super(mode);
  }

  setup(): void {
    super.setup();

    this.buildExternalPartyContainer();
    this.buildInfoContainer();
  }

  private buildExternalPartyContainer() {
    this.externalPartyContainer = globalScene.add.container(0, 0);
    this.externalPartyContainer.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, globalScene.scaledCanvas.width / 2, globalScene.scaledCanvas.height / 2),
      Phaser.Geom.Rectangle.Contains,
    );
    this.externalPartyTitle = addTextObject(0, 4, "", TextStyle.SETTINGS_LABEL).setOrigin(0.5, 0);
    this.externalPartyBg = addWindow(0, 0, 0, 0);

    this.googleImage = this.buildInteractableImage("google", "google-icon");
    this.discordImage = this.buildInteractableImage("discord", "discord-icon");

    this.externalPartyContainer
      .add([this.externalPartyBg, this.externalPartyTitle, this.googleImage, this.discordImage])
      .setVisible(false);
    this.getUi().add(this.externalPartyContainer);
  }

  private buildInfoContainer() {
    this.infoContainer = globalScene.add.container(0, 0);

    this.usernameInfoImage = this.buildInteractableImage("settings_icon", "username-info-icon", {
      x: 20,
      scale: 0.5,
    });

    this.saveDownloadImage = this.buildInteractableImage("saving_icon", "save-download-icon", {
      x: 0,
      scale: 0.75,
    });

    this.changeLanguageImage = this.buildInteractableImage("language_icon", "change-language-icon", {
      x: 40,
      scale: 0.5,
    });

    this.infoContainer
      .add([this.usernameInfoImage, this.saveDownloadImage, this.changeLanguageImage])
      .setVisible(false)
      .disableInteractive();
    this.getUi().add(this.infoContainer);
  }

  override getModalTitle(_config?: ModalConfig): string {
    let key = "menu:login";
    if (import.meta.env.VITE_SERVER_URL === "https://apibeta.pokerogue.net") {
      key = "menu:loginBeta";
    }
    return i18next.t(key);
  }

  override getWidth(_config?: ModalConfig): number {
    return 160;
  }

  override getMargin(_config?: ModalConfig): [number, number, number, number] {
    return [0, 0, 48, 0];
  }

  override getButtonLabels(_config?: ModalConfig): string[] {
    return [i18next.t("menu:login"), i18next.t("menu:register")];
  }

  override getReadableErrorMessage(error: string): string {
    const colonIndex = error?.indexOf(":");
    if (colonIndex > 0) {
      error = error.slice(0, colonIndex);
    }
    switch (error) {
      case this.ERR_USERNAME:
        return i18next.t("menu:invalidLoginUsername");
      case this.ERR_PASSWORD:
        return i18next.t("menu:invalidLoginPassword");
      case this.ERR_ACCOUNT_EXIST:
        return i18next.t("menu:accountNonExistent");
      case this.ERR_PASSWORD_MATCH:
        return i18next.t("menu:unmatchingPassword");
      case this.ERR_NO_SAVES:
        return "P01: " + i18next.t("menu:noSaves");
      case this.ERR_TOO_MANY_SAVES:
        return "P02: " + i18next.t("menu:tooManySaves");
    }

    return super.getReadableErrorMessage(error);
  }

  override getInputFieldConfigs(): InputFieldConfig[] {
    const inputFieldConfigs: InputFieldConfig[] = [];
    inputFieldConfigs.push(
      { label: i18next.t("menu:username") },
      {
        label: i18next.t("menu:password"),
        isPassword: true,
      },
    );
    return inputFieldConfigs;
  }

  override show(args: any[]): boolean {
    if (!super.show(args)) {
      return false;
    }
    const config = args[0] as ModalConfig;
    this.processExternalProvider(config);
    const originalLoginAction = this.submitAction;
    this.submitAction = _ => {
      if (globalScene.tweens.getTweensOf(this.modalContainer).length === 0) {
        // Prevent overlapping overrides on action modification
        this.submitAction = originalLoginAction;
        this.sanitizeInputs();
        globalScene.ui.setMode(UiMode.LOADING, { buttonActions: [] });
        const onFail = error => {
          globalScene.ui.setMode(UiMode.LOGIN_FORM, Object.assign(config, { errorMessage: error?.trim() }));
          globalScene.ui.playError();
        };
        if (!this.inputs[0].text) {
          return onFail(i18next.t("menu:emptyUsername"));
        }

        const [usernameInput, passwordInput] = this.inputs;

        pokerogueApi.account
          .login({
            username: usernameInput.text,
            password: passwordInput.text,
          })
          .then(error => {
            if (!error && originalLoginAction) {
              originalLoginAction();
            } else {
              onFail(error);
            }
          });
      }
    };

    return true;
  }

  override clear() {
    super.clear();
    this.externalPartyContainer.setVisible(false).setActive(false);
    this.infoContainer.setVisible(false).setActive(false);
    this.setMouseCursorStyle("default"); //reset cursor

    [
      this.discordImage,
      this.googleImage,
      this.usernameInfoImage,
      this.saveDownloadImage,
      this.changeLanguageImage,
    ].forEach(img => {
      img.off("pointerdown");
    });
  }

  override destroy() {
    super.destroy();
    this.externalPartyContainer.destroy();
    this.infoContainer.destroy();
  }

  /**
   * Show a panel with all usernames found in localStorage
   *
   * @remarks
   * Up to {@linkcode MAX_SAVES_FOR_USERNAME_PANEL} usernames are shown, otherwise P02 is triggered
   * @param onFail - Callback function for failure
   */
  private showUsernames(config: ModalConfig) {
    if (globalScene.tweens.getTweensOf(this.infoContainer).length === 0) {
      const localStorageKeys = Object.keys(localStorage); // this gets the keys for localStorage
      const keyToFind = "data_";
      const dataKeys = localStorageKeys.filter(ls => ls.indexOf(keyToFind) >= 0);
      if (dataKeys.length === 0) {
        this.onFail(this.ERR_NO_SAVES, config);
        return;
      }
      if (dataKeys.length > MAX_SAVES_FOR_USERNAME_PANEL) {
        this.onFail(this.ERR_TOO_MANY_SAVES, config);
        return;
      }
      const options: OptionSelectItem[] = [];
      const handler = () => {
        globalScene.ui.revertMode();
        this.infoContainer.disableInteractive();
        return true;
      };
      for (const key of dataKeys) {
        options.push({
          label: key.replace(keyToFind, ""),
          handler,
        });
      }
      globalScene.ui.setOverlayMode(UiMode.OPTION_SELECT, {
        options,
        delay: 1000,
      });
      this.infoContainer.setInteractive(
        new Phaser.Geom.Rectangle(0, 0, globalScene.game.canvas.width, globalScene.game.canvas.height),
        Phaser.Geom.Rectangle.Contains,
      );
    }
  }

  /**
   *
   */
  private onFail(error: string, config: ModalConfig) {
    const ui = globalScene.ui;
    ui.setMode(UiMode.LOADING, { buttonActions: [] });
    ui.setModeForceTransition(UiMode.LOGIN_FORM, Object.assign(config, { errorMessage: error?.trim() }));
    ui.playError();
  }

  /**
   * Collect the user's save files from localStorage and download them as a zip file
   *
   * @remarks
   * Used as the `pointerDown` callback for the save download image
   * @param config - The modal configuration
   */
  private async downloadSaves(config: ModalConfig): Promise<void> {
    // find all data_ and sessionData keys, put them in a .txt file and download everything in a single zip
    const localStorageKeys = Object.keys(localStorage); // this gets the keys for localStorage
    const keyToFind = "data_";
    const sessionKeyToFind = "sessionData";
    const dataKeys = localStorageKeys.filter(ls => ls.indexOf(keyToFind) >= 0);
    const sessionKeys = localStorageKeys.filter(ls => ls.indexOf(sessionKeyToFind) >= 0);
    if (dataKeys.length <= 0 && sessionKeys.length <= 0) {
      this.onFail(this.ERR_NO_SAVES, config);
      return;
    }
    const zip = new JSZip();
    // Bang is safe here because of the filter above
    for (const dataKey of dataKeys) {
      zip.file(dataKey + ".prsv", localStorage.getItem(dataKey)!);
    }
    for (const sessionKey of sessionKeys) {
      zip.file(sessionKey + ".prsv", localStorage.getItem(sessionKey)!);
    }
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pokerogue_saves.zip";
    a.click();
    URL.revokeObjectURL(url);
  }

  private processExternalProvider(config: ModalConfig): void {
    this.externalPartyTitle
      .setText(i18next.t("menu:orUse") ?? "")
      .setX(20 + this.externalPartyTitle.text.length)
      .setVisible(true);

    const externalPartyContainer = this.externalPartyContainer
      .setPositionRelative(this.modalContainer, 175, 0)
      .setVisible(true);

    const externalPartyBg = this.externalPartyBg.setSize(this.externalPartyTitle.text.length + 50, this.modalBg.height);
    this.getUi().moveTo(externalPartyContainer, this.getUi().length - 1);

    const externalPartyIconWidth = externalPartyBg.width / 3.1;
    this.discordImage;
    const infoContainer = this.infoContainer.setPosition(5, -76).setVisible(true);
    this.getUi().moveTo(infoContainer, this.getUi().length - 1);

    this.discordImage // formatting
      .setPosition(externalPartyIconWidth, externalPartyBg.height - 40)
      .on("pointerdown", () => {
        const redirectUri = encodeURIComponent(`${import.meta.env.VITE_SERVER_URL}/auth/discord/callback`);
        const discordId = import.meta.env.VITE_DISCORD_CLIENT_ID;
        const discordUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordId}&redirect_uri=${redirectUri}&response_type=code&scope=identify&prompt=none`;
        window.open(discordUrl, "_self");
      });

    this.googleImage // formatting
      .setPosition(externalPartyIconWidth, externalPartyBg.height - 60)
      .on("pointerdown", () => {
        const redirectUri = encodeURIComponent(`${import.meta.env.VITE_SERVER_URL}/auth/google/callback`);
        const googleId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        const googleUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${googleId}&redirect_uri=${redirectUri}&response_type=code&scope=openid`;
        window.open(googleUrl, "_self");
      });

    this.usernameInfoImage // formatting
      .setPositionRelative(infoContainer, 0, 0)
      .on("pointerdown", () => this.showUsernames(config));

    this.saveDownloadImage // formatting
      .setPositionRelative(infoContainer, 20, 0)
      .on("pointerdown", () => this.downloadSaves(config));

    this.changeLanguageImage.setPositionRelative(infoContainer, 40, 0).on("pointerdown", () => {
      globalScene.ui.setOverlayMode(UiMode.OPTION_SELECT, {
        options: languageOptions,
        maxOptions: 7,
        delay: 1000,
      });
    });

    this.externalPartyContainer.setAlpha(0);
    globalScene.tweens.add({
      targets: this.externalPartyContainer,
      duration: fixedInt(1000),
      ease: "Sine.easeInOut",
      y: "-=24",
      alpha: 1,
    });

    this.infoContainer.setAlpha(0);
    globalScene.tweens.add({
      targets: this.infoContainer,
      duration: fixedInt(1000),
      ease: "Sine.easeInOut",
      y: "-=24",
      alpha: 1,
    });
  }

  private buildInteractableImage(texture: string, name: string, opts: BuildInteractableImageOpts = {}) {
    const { scale = 0.07, x = 0, y = 0, origin = { x: 0, y: 0 } } = opts;
    const img = globalScene.add
      .image(x, y, texture)
      .setName(name)
      .setOrigin(origin.x, origin.y)
      .setScale(scale)
      .setInteractive();
    this.addInteractionHoverEffect(img);

    return img;
  }
}
