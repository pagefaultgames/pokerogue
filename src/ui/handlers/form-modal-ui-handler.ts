import { globalScene } from "#app/global-scene";
import { Button } from "#enums/buttons";
import { TextStyle } from "#enums/text-style";
import type { ModalConfig } from "#ui/modal-ui-handler";
import { ModalUiHandler } from "#ui/modal-ui-handler";
import { addTextInputObject, addTextObject, getTextColor } from "#ui/text";
import { addWindow, WindowVariant } from "#ui/ui-theme";
import { fixedInt, truncateString } from "#utils/common";
import type Phaser from "phaser";
import type InputText from "phaser3-rex-plugins/plugins/inputtext";

export interface FormModalConfig extends ModalConfig {
  errorMessage?: string;
}

export abstract class FormModalUiHandler extends ModalUiHandler {
  protected editing = false;
  protected inputContainers: Phaser.GameObjects.Container[] = [];
  protected inputs: InputText[] = [];
  protected errorMessage: Phaser.GameObjects.Text;
  protected submitAction: (() => void) | undefined;
  protected cancelAction: (() => void) | undefined;
  protected tween: Phaser.Tweens.Tween | undefined;
  protected formLabels: Phaser.GameObjects.Text[] = [];

  /**
   * Get configuration for all fields that should be part of the modal
   * @remarks
   * Gets used by {@linkcode updateFields} to add the proper text inputs and labels to the view
   * @returns array of {@linkcode InputFieldConfig}
   */
  abstract getInputFieldConfigs(): InputFieldConfig[];

  public override getHeight(config?: FormModalConfig): number {
    return (
      20 * this.getInputFieldConfigs().length
      + (this.getModalTitle() ? 26 : 0)
      + (config?.errorMessage ? 12 : 0)
      + this.getButtonTopMargin()
      + 28
    );
  }

  public getReadableErrorMessage(error: string): string {
    if (!error) {
      return "";
    }

    if (error.includes("connection refused")) {
      return "Could not connect to the server";
    }

    return error;
  }

  public override setup(): void {
    super.setup();

    const config = this.getInputFieldConfigs();

    const hasTitle = !!this.getModalTitle();

    if (config.length > 0) {
      this.updateFields(config, hasTitle);
    }

    const errorMessageY = (hasTitle ? 31 : 5) + 20 * (config.length - 1) + 16 + this.getButtonTopMargin();
    const errorMessageOptions: Phaser.Types.GameObjects.Text.TextStyle = { fontSize: "42px", wordWrap: { width: 850 } };
    this.errorMessage = addTextObject(10, errorMessageY, "", TextStyle.TOOLTIP_CONTENT, errorMessageOptions)
      .setColor(getTextColor(TextStyle.SUMMARY_PINK))
      .setShadowColor(getTextColor(TextStyle.SUMMARY_PINK, true))
      .setVisible(false);
    this.modalContainer.add(this.errorMessage);
  }

  protected updateFields(fieldsConfig: InputFieldConfig[], hasTitle: boolean) {
    this.inputContainers = new Array(fieldsConfig.length);
    this.inputs = new Array(fieldsConfig.length);
    this.formLabels = new Array(fieldsConfig.length);
    for (const [f, config] of fieldsConfig.entries()) {
      const labelY = (hasTitle ? 31 : 5) + 20 * f;
      // The Pokédex Scan Window uses width `300` instead of `160` like the other forms
      // Therefore, the label does not need to be shortened
      const labelContent = this.getWidth() < 200 ? truncateString(config.label, 25) : config.label;
      const label = addTextObject(10, labelY, labelContent, TextStyle.TOOLTIP_CONTENT);
      label.name = "formLabel" + f;

      this.formLabels[f] = label;
      this.modalContainer.add(label);

      const inputWidth = label.width < 320 ? 80 : 80 - (label.width - 320) / 5.5;
      const inputContainer = globalScene.add
        .container(70 + (80 - inputWidth), (hasTitle ? 28 : 2) + 20 * f)
        .setVisible(false);

      const inputBg = addWindow(0, 0, inputWidth, 16, false, false, 0, 0, WindowVariant.XTHIN);

      const isPassword = config?.isPassword;
      const isReadOnly = config?.isReadOnly;
      const input = addTextInputObject(4, -2, inputWidth * 5.5, 116, TextStyle.TOOLTIP_CONTENT, {
        type: isPassword ? "password" : "text",
        maxLength: isPassword ? 64 : 20,
        readOnly: isReadOnly,
      }).setOrigin(0);

      inputContainer.add([inputBg, input]);

      this.inputContainers[f] = inputContainer;
      this.modalContainer.add(inputContainer);

      this.inputs[f] = input;
    }
  }

  public override show(args: any[]): boolean {
    if (super.show(args)) {
      for (const ic of this.inputContainers) {
        ic.setActive(true).setVisible(true);
      }

      const config = args[0] as FormModalConfig;
      const buttonActions = config.buttonActions ?? [];

      [this.submitAction, this.cancelAction] = buttonActions;

      // Auto focus the first input field after a short delay, to prevent accidental inputs
      setTimeout(() => {
        this.inputs[0]?.setFocus();
      }, 50);

      // #region: Override button pointerDown
      // Override the pointerDown event for the buttonBgs to call the `submitAction` and `cancelAction`
      // properties that we set above, allowing their behavior to change after this method terminates
      // Some subclasses use this to add behavior to the submit and cancel action

      this.buttonBgs[0] // formatting
        .off("pointerdown")
        .on("pointerdown", () => {
          if (this.submitAction && globalScene.tweens.getTweensOf(this.modalContainer).length === 0) {
            this.submitAction();
          }
        });
      this.buttonBgs[1] // formatting
        ?.off("pointerdown")
        .on("pointerdown", () => {
          // The seemingly redundant cancelAction check is intentionally left in as a defensive programming measure
          if (this.cancelAction && globalScene.tweens.getTweensOf(this.modalContainer).length === 0) {
            this.cancelAction();
          }
        });
      //#endregion: Override pointerDown events

      this.modalContainer.setAlpha(0).y += 24;

      this.tween = globalScene.tweens.add({
        targets: this.modalContainer,
        duration: fixedInt(1000),
        ease: "Sine.easeInOut",
        y: "-=24",
        alpha: 1,
      });

      return true;
    }

    return false;
  }

  public override processInput(button: Button): boolean {
    if (button === Button.SUBMIT && this.submitAction) {
      this.submitAction();
      return true;
    }

    return false;
  }

  public sanitizeInputs(): void {
    for (const input of this.inputs) {
      input.text = input.text.trim();
    }
  }

  public override updateContainer(config?: ModalConfig): void {
    super.updateContainer(config);

    this.errorMessage
      .setText(this.getReadableErrorMessage((config as FormModalConfig)?.errorMessage || ""))
      .setVisible(!!this.errorMessage.text);
  }

  public hide(): void {
    this.modalContainer.setVisible(false).setActive(false);
    for (const ic of this.inputContainers) {
      ic.setVisible(false).setActive(false);
    }
  }

  public unhide(): void {
    this.modalContainer.setActive(true).setVisible(true);
    for (const ic of this.inputContainers) {
      ic.setActive(true).setVisible(true);
    }
  }

  public override clear(): void {
    super.clear();
    this.modalContainer.setVisible(false);

    for (const ic of this.inputContainers) {
      ic.setVisible(false).setActive(false);
    }

    this.submitAction = undefined;

    this.tween?.remove().destroy();
    this.tween = undefined;
  }
}

export interface InputFieldConfig {
  label: string;
  isPassword?: boolean;
  isReadOnly?: boolean;
}
