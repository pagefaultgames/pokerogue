import { globalScene } from "#app/global-scene";
import { UiMode } from "#enums/ui-mode";
import { languageOptions } from "#system/settings-language";
import type { OptionSelectItem } from "#ui/abstract-option-select-ui-handler";
import { FormModalUiHandler } from "#ui/form-modal-ui-handler";
import type { ModalConfig } from "#ui/modal-ui-handler";
import { fixedInt } from "#utils/common";
import i18next from "i18next";
import JSZip from "jszip";
import type InputText from "phaser3-rex-plugins/plugins/inputtext";

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

const ERR_NO_SAVES: string = "No save files found";
const ERR_TOO_MANY_SAVES: string = "Too many save files found";

export abstract class LoginRegisterInfoContainerUiHandler extends FormModalUiHandler {
  private usernameInfoImage: Phaser.GameObjects.Image;
  private saveDownloadImage: Phaser.GameObjects.Image;
  private changeLanguageImage: Phaser.GameObjects.Image;
  private infoContainer: Phaser.GameObjects.Container;
  private lastFocusedInput: InputText | null = null;

  public override getReadableErrorMessage(error: string): string {
    if (!error) {
      return "";
    }

    const colonIndex = error.indexOf(":");
    if (colonIndex > 0) {
      error = error.slice(0, colonIndex);
    }

    switch (error) {
      case ERR_NO_SAVES:
        return "P01: " + i18next.t("menu:noSaves");
      case ERR_TOO_MANY_SAVES:
        return "P02: " + i18next.t("menu:tooManySaves");
    }

    return super.getReadableErrorMessage(error);
  }

  public override setup(): void {
    super.setup();
    this.buildInfoContainer();
  }

  public override clear(): void {
    super.clear();
    this.infoContainer //
      .setVisible(false)
      .setActive(false);
    this.setMouseCursorStyle("default"); // reset cursor
  }

  public override destroy(): void {
    super.destroy();
    this.infoContainer.destroy();
  }

  private buildInfoContainer() {
    this.usernameInfoImage = this.buildInteractableImage("settings_icon", "username-info-icon", { x: 0, scale: 0.5 });
    this.saveDownloadImage = this.buildInteractableImage("saving_icon", "save-download-icon", { x: 20, scale: 0.75 });
    this.changeLanguageImage = this.buildInteractableImage("language_icon", "change-language-icon", {
      x: 40,
      scale: 0.5,
    });

    this.infoContainer = globalScene.add
      .container(0, 0)
      .add([this.usernameInfoImage, this.saveDownloadImage, this.changeLanguageImage])
      .setVisible(false)
      .disableInteractive();

    this.getUi().add(this.infoContainer);
  }

  protected showInfoContainer(config: ModalConfig) {
    this.infoContainer //
      .setPosition(5, -76)
      .setVisible(true);
    this.getUi().moveTo(this.infoContainer, this.getUi().length - 1);

    this.usernameInfoImage //
      .setPositionRelative(this.infoContainer, 0, 0)
      .on("pointerdown", () => this.showUsernames(config));

    this.saveDownloadImage //
      .setPositionRelative(this.infoContainer, 20, 0)
      .on("pointerdown", () => this.downloadSaves(config));

    this.changeLanguageImage //
      .setPositionRelative(this.infoContainer, 40, 0)
      .on("pointerdown", () => {
        this.setInteractive(false);
        globalScene.ui.setOverlayMode(UiMode.OPTION_SELECT, {
          options: languageOptions,
          maxOptions: 7,
          delay: 1000,
        });
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

  /**
   * Show a panel with all usernames found in localStorage
   * @remarks
   * Up to {@linkcode MAX_SAVES_FOR_USERNAME_PANEL} usernames are shown, otherwise P02 is triggered
   * @param config - The modal configuration
   */
  private showUsernames(config: ModalConfig): void {
    if (globalScene.tweens.getTweensOf(this.infoContainer).length > 0) {
      return;
    }

    const localStorageKeys = Object.keys(localStorage);
    const keyToFind = "data_";
    const dataKeys = localStorageKeys.filter(ls => ls.includes(keyToFind));

    if (dataKeys.length === 0) {
      this.onFail(ERR_NO_SAVES, config);
      return;
    }
    if (dataKeys.length > MAX_SAVES_FOR_USERNAME_PANEL) {
      this.onFail(ERR_TOO_MANY_SAVES, config);
      return;
    }

    const options: OptionSelectItem[] = [];
    const handler = () => {
      globalScene.ui.revertMode();
      this.infoContainer.disableInteractive();
      this.setInteractive(true);
      return true;
    };

    for (const key of dataKeys) {
      options.push({ label: key.replace(keyToFind, ""), handler });
    }

    globalScene.ui.setOverlayMode(UiMode.OPTION_SELECT, { options, delay: 1000 });
    this.setInteractive(false);
    this.infoContainer.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, globalScene.game.canvas.width, globalScene.game.canvas.height),
      Phaser.Geom.Rectangle.Contains,
    );
  }

  /**
   * Collect the user's save files from localStorage and download them as a zip file
   * @remarks
   * Used as the `pointerDown` callback for the save download image
   * @param config - The modal configuration
   */
  private async downloadSaves(config: ModalConfig): Promise<void> {
    // find all data_ and sessionData keys, put them in a .txt file and download everything in a single zip
    const localStorageKeys = Object.keys(localStorage);
    const keyToFind = "data_";
    const sessionKeyToFind = "sessionData";
    const dataKeys = localStorageKeys.filter(ls => ls.includes(keyToFind));
    const sessionKeys = localStorageKeys.filter(ls => ls.includes(sessionKeyToFind));

    if (dataKeys.length <= 0 && sessionKeys.length <= 0) {
      this.onFail(ERR_NO_SAVES, config);
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

  private onFail(error: string, config: ModalConfig): void {
    const ui = globalScene.ui;
    ui.setMode(UiMode.LOADING, { buttonActions: [] });
    ui.setModeForceTransition(UiMode.LOGIN_OR_REGISTER, Object.assign(config, { errorMessage: error?.trim() }));
    ui.playError();
  }

  protected buildInteractableImage(
    texture: string,
    name: string,
    opts: BuildInteractableImageOpts = {},
  ): Phaser.GameObjects.Image {
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

  /**
   * Enable or disable interactivity on all interactive objects.
   * @param active - Whether to enable or disable interactivity
   */
  public setInteractive(active: boolean): void {
    const objects = [...this.buttonBgs, this.usernameInfoImage, this.saveDownloadImage, this.changeLanguageImage];

    for (const obj of objects) {
      if (active) {
        obj.setInteractive();
      } else {
        obj.disableInteractive();
        if (obj instanceof Phaser.GameObjects.Image) {
          obj.clearTint();
        }
      }
    }

    this.setInteractiveInputs(active);
    this.setMouseCursorStyle("default");
  }

  /**
   * Enable or disable interactivity on all input fields.
   * @param active - Whether to enable or disable interactivity
   */
  private setInteractiveInputs(active: boolean): void {
    if (active) {
      // `setFocus` doesn't focus without a timeout
      setTimeout(() => {
        this.lastFocusedInput?.setFocus();
        this.lastFocusedInput = null;
      }, 50);
    } else {
      this.lastFocusedInput = this.inputs.find(input => input.isFocused) ?? null;
    }
    for (const input of this.inputs) {
      (input.node as HTMLInputElement).disabled = !active;
    }
  }
}
