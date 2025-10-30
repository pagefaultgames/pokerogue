import { globalScene } from "#app/global-scene";
import { Button } from "#enums/buttons";
import { TextStyle } from "#enums/text-style";
import type { AnyFn } from "#types/type-helpers";
import type { ModalConfig } from "#ui/modal-ui-handler";
import { ModalUiHandler } from "#ui/modal-ui-handler";
import { addTextInputObject, addTextObject, getTextColor } from "#ui/text";
import { addWindow, WindowVariant } from "#ui/ui-theme";
import { fixedInt } from "#utils/common";
import type InputText from "phaser3-rex-plugins/plugins/inputtext";

export interface FormModalConfig extends ModalConfig {
  errorMessage?: string;
}

export abstract class FormModalUiHandler extends ModalUiHandler {
  protected editing = false;
  protected inputContainers: Phaser.GameObjects.Container[] = [];
  protected inputs: InputText[] = [];
  protected errorMessage: Phaser.GameObjects.Text;
  protected submitAction: AnyFn | undefined;
  protected cancelAction: (() => void) | undefined;
  protected tween: Phaser.Tweens.Tween | undefined;
  protected formLabels: Phaser.GameObjects.Text[] = [];

  /**
   * Get configuration for all fields that should be part of the modal
   * Gets used by {@linkcode updateFields} to add the proper text inputs and labels to the view
   * @returns array of {@linkcode InputFieldConfig}
   */
  abstract getInputFieldConfigs(): InputFieldConfig[];

  getHeight(config?: ModalConfig): number {
    return (
      20 * this.getInputFieldConfigs().length
      + (this.getModalTitle() ? 26 : 0)
      + ((config as FormModalConfig)?.errorMessage ? 12 : 0)
      + this.getButtonTopMargin()
      + 28
    );
  }

  getReadableErrorMessage(error: string): string {
    if (error?.indexOf("connection refused") > -1) {
      return "Could not connect to the server";
    }

    return error;
  }

  setup(): void {
    super.setup();

    const config = this.getInputFieldConfigs();

    const hasTitle = !!this.getModalTitle();

    if (config.length > 0) {
      this.updateFields(config, hasTitle);
    }

    this.errorMessage = addTextObject(
      10,
      (hasTitle ? 31 : 5) + 20 * (config.length - 1) + 16 + this.getButtonTopMargin(),
      "",
      TextStyle.TOOLTIP_CONTENT,
      {
        fontSize: "42px",
        wordWrap: { width: 850 },
      },
    )
      .setColor(getTextColor(TextStyle.SUMMARY_PINK))
      .setShadowColor(getTextColor(TextStyle.SUMMARY_PINK, true))
      .setVisible(false);
    this.modalContainer.add(this.errorMessage);
  }

  protected updateFields(fieldsConfig: InputFieldConfig[], hasTitle: boolean) {
    const inputContainers = (this.inputContainers = new Array(fieldsConfig.length));
    const inputs = (this.inputs = new Array(fieldsConfig.length));
    const formLabels = (this.formLabels = new Array(fieldsConfig.length));
    for (const [f, config] of fieldsConfig.entries()) {
      // The Pokédex Scan Window uses width `300` instead of `160` like the other forms
      // Therefore, the label does not need to be shortened
      const label = addTextObject(
        10,
        (hasTitle ? 31 : 5) + 20 * f,
        config.label.length > 25 && this.getWidth() < 200 ? config.label.slice(0, 20) + "..." : config.label,
        TextStyle.TOOLTIP_CONTENT,
      );
      label.name = "formLabel" + f;

      formLabels[f] = label;
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

      inputContainers[f] = inputContainer;
      this.modalContainer.add(inputContainer);

      inputs[f] = input;
    }
  }

  override show(args: any[]): boolean {
    if (super.show(args)) {
      for (const ic of this.inputContainers) {
        ic.setActive(true).setVisible(true);
      }

      const config = args[0] as FormModalConfig;
      const buttonActions = config.buttonActions ?? [];

      [this.submitAction, this.cancelAction] = buttonActions;

      // Auto focus the first input field after a short delay, to prevent accidental inputs
      setTimeout(() => {
        this.inputs[0].setFocus();
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

  processInput(button: Button): boolean {
    if (button === Button.SUBMIT && this.submitAction) {
      this.submitAction();
      return true;
    }

    return false;
  }

  sanitizeInputs(): void {
    for (const input of this.inputs) {
      input.text = input.text.trim();
    }
  }

  updateContainer(config?: ModalConfig): void {
    super.updateContainer(config);

    this.errorMessage
      .setText(this.getReadableErrorMessage((config as FormModalConfig)?.errorMessage || ""))
      .setVisible(!!this.errorMessage.text);
  }

  hide(): void {
    this.modalContainer.setVisible(false).setActive(false);
    for (const ic of this.inputContainers) {
      ic.setVisible(false).setActive(false);
    }
  }

  unhide(): void {
    this.modalContainer.setActive(true).setVisible(true);
    for (const ic of this.inputContainers) {
      ic.setActive(true).setVisible(true);
    }
  }

  clear(): void {
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
