import { pokerogueApi } from "#api/pokerogue-api";
import { globalScene } from "#app/global-scene";
import { TextStyle } from "#enums/text-style";
import { UiMode } from "#enums/ui-mode";
import type { OptionSelectItem } from "#ui/handlers/abstract-option-select-ui-handler";
import type { InputFieldConfig } from "#ui/handlers/form-modal-ui-handler";
import { FormModalUiHandler } from "#ui/handlers/form-modal-ui-handler";
import type { ModalConfig } from "#ui/handlers/modal-ui-handler";
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
    this.externalPartyTitle = addTextObject(0, 4, "", TextStyle.SETTINGS_LABEL);
    this.externalPartyTitle.setOrigin(0.5, 0);
    this.externalPartyBg = addWindow(0, 0, 0, 0);
    this.externalPartyContainer.add(this.externalPartyBg);
    this.externalPartyContainer.add(this.externalPartyTitle);

    this.googleImage = this.buildInteractableImage("google", "google-icon");
    this.discordImage = this.buildInteractableImage("discord", "discord-icon");

    this.externalPartyContainer.add(this.googleImage);
    this.externalPartyContainer.add(this.discordImage);
    this.getUi().add(this.externalPartyContainer);
    this.externalPartyContainer.add(this.googleImage);
    this.externalPartyContainer.add(this.discordImage);
    this.externalPartyContainer.setVisible(false);
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

    this.infoContainer.add(this.usernameInfoImage);
    this.infoContainer.add(this.saveDownloadImage);
    this.getUi().add(this.infoContainer);
    this.infoContainer.setVisible(false);
    this.infoContainer.disableInteractive();
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
    inputFieldConfigs.push({ label: i18next.t("menu:username") });
    inputFieldConfigs.push({
      label: i18next.t("menu:password"),
      isPassword: true,
    });
    return inputFieldConfigs;
  }

  override show(args: any[]): boolean {
    if (super.show(args)) {
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

          pokerogueApi.account.login({ username: usernameInput.text, password: passwordInput.text }).then(error => {
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

    return false;
  }

  override clear() {
    super.clear();
    this.externalPartyContainer.setVisible(false);
    this.infoContainer.setVisible(false);
    this.setMouseCursorStyle("default"); //reset cursor

    [this.discordImage, this.googleImage, this.usernameInfoImage, this.saveDownloadImage].forEach(img =>
      img.off("pointerdown"),
    );
  }

  private processExternalProvider(config: ModalConfig): void {
    this.externalPartyTitle.setText(i18next.t("menu:orUse") ?? "");
    this.externalPartyTitle.setX(20 + this.externalPartyTitle.text.length);
    this.externalPartyTitle.setVisible(true);
    this.externalPartyContainer.setPositionRelative(this.modalContainer, 175, 0);
    this.externalPartyContainer.setVisible(true);
    this.externalPartyBg.setSize(this.externalPartyTitle.text.length + 50, this.modalBg.height);
    this.getUi().moveTo(this.externalPartyContainer, this.getUi().length - 1);
    this.googleImage.setPosition(this.externalPartyBg.width / 3.1, this.externalPartyBg.height - 60);
    this.discordImage.setPosition(this.externalPartyBg.width / 3.1, this.externalPartyBg.height - 40);

    this.infoContainer.setPosition(5, -76);
    this.infoContainer.setVisible(true);
    this.getUi().moveTo(this.infoContainer, this.getUi().length - 1);
    this.usernameInfoImage.setPositionRelative(this.infoContainer, 0, 0);
    this.saveDownloadImage.setPositionRelative(this.infoContainer, 20, 0);

    this.discordImage.on("pointerdown", () => {
      const redirectUri = encodeURIComponent(`${import.meta.env.VITE_SERVER_URL}/auth/discord/callback`);
      const discordId = import.meta.env.VITE_DISCORD_CLIENT_ID;
      const discordUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordId}&redirect_uri=${redirectUri}&response_type=code&scope=identify&prompt=none`;
      window.open(discordUrl, "_self");
    });

    this.googleImage.on("pointerdown", () => {
      const redirectUri = encodeURIComponent(`${import.meta.env.VITE_SERVER_URL}/auth/google/callback`);
      const googleId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const googleUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${googleId}&redirect_uri=${redirectUri}&response_type=code&scope=openid`;
      window.open(googleUrl, "_self");
    });

    const onFail = error => {
      globalScene.ui.setMode(UiMode.LOADING, { buttonActions: [] });
      globalScene.ui.setModeForceTransition(UiMode.LOGIN_FORM, Object.assign(config, { errorMessage: error?.trim() }));
      globalScene.ui.playError();
    };

    this.usernameInfoImage.on("pointerdown", () => {
      if (globalScene.tweens.getTweensOf(this.infoContainer).length === 0) {
        const localStorageKeys = Object.keys(localStorage); // this gets the keys for localStorage
        const keyToFind = "data_";
        const dataKeys = localStorageKeys.filter(ls => ls.indexOf(keyToFind) >= 0);
        if (dataKeys.length > 0 && dataKeys.length <= 2) {
          const options: OptionSelectItem[] = [];
          for (const key of dataKeys) {
            options.push({
              label: key.replace(keyToFind, ""),
              handler: () => {
                globalScene.ui.revertMode();
                this.infoContainer.disableInteractive();
                return true;
              },
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
        } else {
          if (dataKeys.length > 2) {
            return onFail(this.ERR_TOO_MANY_SAVES);
          }
          return onFail(this.ERR_NO_SAVES);
        }
      }
    });

    this.saveDownloadImage.on("pointerdown", async () => {
      // find all data_ and sessionData keys, put them in a .txt file and download everything in a single zip
      const localStorageKeys = Object.keys(localStorage); // this gets the keys for localStorage
      const keyToFind = "data_";
      const sessionKeyToFind = "sessionData";
      const dataKeys = localStorageKeys.filter(ls => ls.indexOf(keyToFind) >= 0);
      const sessionKeys = localStorageKeys.filter(ls => ls.indexOf(sessionKeyToFind) >= 0);
      if (dataKeys.length > 0 || sessionKeys.length > 0) {
        const zip = new JSZip();
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
      } else {
        return onFail(this.ERR_NO_SAVES);
      }
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
    const img = globalScene.add.image(x, y, texture);
    img.setName(name);
    img.setOrigin(origin.x, origin.y);
    img.setScale(scale);
    img.setInteractive();
    this.addInteractionHoverEffect(img);

    return img;
  }
}
