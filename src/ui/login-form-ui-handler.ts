import { FormModalUiHandler, InputFieldConfig } from "./form-modal-ui-handler";
import { ModalConfig } from "./modal-ui-handler";
import * as Utils from "../utils";
import { Mode } from "./ui";
import i18next from "i18next";
import { addTextObject, TextStyle } from "./text";
import { addWindow } from "./ui-theme";
import { OptionSelectItem } from "#app/ui/abstact-option-select-ui-handler";
import { globalScene } from "#app/battle-scene";

interface BuildInteractableImageOpts {
  scale?: number;
  x?: number;
  y?: number;
  origin?: { x: number; y: number };
}

export default class LoginFormUiHandler extends FormModalUiHandler {
  private readonly ERR_USERNAME: string = "invalid username";
  private readonly ERR_PASSWORD: string = "invalid password";
  private readonly ERR_ACCOUNT_EXIST: string = "account doesn't exist";
  private readonly ERR_PASSWORD_MATCH: string = "password doesn't match";
  private readonly ERR_NO_SAVES: string = "No save files found";
  private readonly ERR_TOO_MANY_SAVES: string = "Too many save files found";

  private googleImage: Phaser.GameObjects.Image;
  private discordImage: Phaser.GameObjects.Image;
  private usernameInfoImage: Phaser.GameObjects.Image;
  private externalPartyContainer: Phaser.GameObjects.Container;
  private infoContainer: Phaser.GameObjects.Container;
  private externalPartyBg: Phaser.GameObjects.NineSlice;
  private externalPartyTitle: Phaser.GameObjects.Text;
  constructor(mode: Mode | null = null) {
    super(mode);
  }

  setup(): void {
    super.setup();
    this.buildExternalPartyContainer();

    this.infoContainer = globalScene.add.container(0, 0);

    this.usernameInfoImage = this.buildInteractableImage("settings_icon", "username-info-icon", {
      x: 20,
      scale: 0.5
    });

    this.infoContainer.add(this.usernameInfoImage);
    this.getUi().add(this.infoContainer);
    this.infoContainer.setVisible(false);
    this.infoContainer.disableInteractive();
  }

  private buildExternalPartyContainer() {
    this.externalPartyContainer = globalScene.add.container(0, 0);
    this.externalPartyContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, globalScene.game.canvas.width / 12, globalScene.game.canvas.height / 12), Phaser.Geom.Rectangle.Contains);
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

  override getModalTitle(_config?: ModalConfig): string {
    return i18next.t("menu:login");
  }

  override getWidth(_config?: ModalConfig): number {
    return 160;
  }

  override getMargin(_config?: ModalConfig): [number, number, number, number] {
    return [ 0, 0, 48, 0 ];
  }

  override getButtonLabels(_config?: ModalConfig): string[] {
    return [ i18next.t("menu:login"), i18next.t("menu:register") ];
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
    inputFieldConfigs.push({ label: i18next.t("menu:password"), isPassword: true });
    return inputFieldConfigs;
  }

  override show(args: any[]): boolean {
    if (super.show(args)) {

      const config = args[0] as ModalConfig;
      this.processExternalProvider(config);
      const originalLoginAction = this.submitAction;
      this.submitAction = (_) => {
        // Prevent overlapping overrides on action modification
        this.submitAction = originalLoginAction;
        this.sanitizeInputs();
        globalScene.ui.setMode(Mode.LOADING, { buttonActions: []});
        const onFail = error => {
          globalScene.ui.setMode(Mode.LOGIN_FORM, Object.assign(config, { errorMessage: error?.trim() }));
          globalScene.ui.playError();
        };
        if (!this.inputs[0].text) {
          return onFail(i18next.t("menu:emptyUsername"));
        }
        Utils.apiPost("account/login", `username=${encodeURIComponent(this.inputs[0].text)}&password=${encodeURIComponent(this.inputs[1].text)}`, "application/x-www-form-urlencoded")
          .then(response => {
            if (!response.ok) {
              return response.text();
            }
            return response.json();
          })
          .then(response => {
            if (response.hasOwnProperty("token")) {
              Utils.setCookie(Utils.sessionIdKey, response.token);
              originalLoginAction && originalLoginAction();
            } else {
              onFail(response);
            }
          });
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

    [ this.discordImage, this.googleImage, this.usernameInfoImage ].forEach((img) => img.off("pointerdown"));
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
      globalScene.ui.setMode(Mode.LOADING, { buttonActions: []});
      globalScene.ui.setModeForceTransition(Mode.LOGIN_FORM, Object.assign(config, { errorMessage: error?.trim() }));
      globalScene.ui.playError();
    };

    this.usernameInfoImage.on("pointerdown", () => {
      const localStorageKeys = Object.keys(localStorage); // this gets the keys for localStorage
      const keyToFind = "data_";
      const dataKeys = localStorageKeys.filter(ls => ls.indexOf(keyToFind) >= 0);
      if (dataKeys.length > 0 && dataKeys.length <= 2) {
        const options: OptionSelectItem[] = [];
        for (let i = 0; i < dataKeys.length; i++) {
          options.push({
            label: dataKeys[i].replace(keyToFind, ""),
            handler: () => {
              globalScene.ui.revertMode();
              this.infoContainer.disableInteractive();
              return true;
            }
          });
        }
        globalScene.ui.setOverlayMode(Mode.OPTION_SELECT, {
          options: options,
          delay: 1000
        });
        this.infoContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, globalScene.game.canvas.width, globalScene.game.canvas.height), Phaser.Geom.Rectangle.Contains);
      } else {
        if (dataKeys.length > 2) {
          return onFail(this.ERR_TOO_MANY_SAVES);
        } else {
          return onFail(this.ERR_NO_SAVES);
        }
      }
    });

    this.externalPartyContainer.setAlpha(0);
    globalScene.tweens.add({
      targets: this.externalPartyContainer,
      duration: Utils.fixedInt(1000),
      ease: "Sine.easeInOut",
      y: "-=24",
      alpha: 1
    });

    this.infoContainer.setAlpha(0);
    globalScene.tweens.add({
      targets: this.infoContainer,
      duration: Utils.fixedInt(1000),
      ease: "Sine.easeInOut",
      y: "-=24",
      alpha: 1
    });
  }

  private buildInteractableImage(texture: string, name: string, opts: BuildInteractableImageOpts = {}) {
    const {
      scale = 0.07,
      x = 0,
      y = 0,
      origin = { x: 0, y: 0 }
    } = opts;
    const img = globalScene.add.image(x, y, texture);
    img.setName(name);
    img.setOrigin(origin.x, origin.y);
    img.setScale(scale);
    img.setInteractive();
    this.addInteractionHoverEffect(img);

    return img;
  }
}
