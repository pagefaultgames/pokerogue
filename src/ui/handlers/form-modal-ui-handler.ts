import { globalScene } from "#app/global-scene";
import { Button } from "#enums/buttons";
import { TextStyle } from "#enums/text-style";
import type { UiMode } from "#enums/ui-mode";
import type { ModalConfig } from "#ui/handlers/modal-ui-handler";
import { ModalUiHandler } from "#ui/handlers/modal-ui-handler";
import { addTextInputObject, addTextObject, getTextColor } from "#ui/text";
import { addWindow, WindowVariant } from "#ui/ui-theme";
import { fixedInt } from "#utils/common";
import type InputText from "phaser3-rex-plugins/plugins/inputtext";

export interface FormModalConfig extends ModalConfig {
  errorMessage?: string;
}

export abstract class FormModalUiHandler extends ModalUiHandler {
  protected editing: boolean;
  protected inputContainers: Phaser.GameObjects.Container[];
  protected inputs: InputText[];
  protected errorMessage: Phaser.GameObjects.Text;
  protected submitAction: Function | null;
  protected cancelAction: (() => void) | null;
  protected tween: Phaser.Tweens.Tween;
  protected formLabels: Phaser.GameObjects.Text[];

  constructor(mode: UiMode | null = null) {
    super(mode);

    this.editing = false;
    this.inputContainers = [];
    this.inputs = [];
    this.formLabels = [];
  }

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
    );
    this.errorMessage.setColor(getTextColor(TextStyle.SUMMARY_PINK));
    this.errorMessage.setShadowColor(getTextColor(TextStyle.SUMMARY_PINK, true));
    this.errorMessage.setVisible(false);
    this.modalContainer.add(this.errorMessage);
  }

  protected updateFields(fieldsConfig: InputFieldConfig[], hasTitle: boolean) {
    this.inputContainers = [];
    this.inputs = [];
    this.formLabels = [];
    fieldsConfig.forEach((config, f) => {
      // The Pokédex Scan Window uses width `300` instead of `160` like the other forms
      // Therefore, the label does not need to be shortened
      const label = addTextObject(
        10,
        (hasTitle ? 31 : 5) + 20 * f,
        config.label.length > 25 && this.getWidth() < 200 ? config.label.slice(0, 20) + "..." : config.label,
        TextStyle.TOOLTIP_CONTENT,
      );
      label.name = "formLabel" + f;

      this.formLabels.push(label);
      this.modalContainer.add(label);

      const inputWidth = label.width < 320 ? 80 : 80 - (label.width - 320) / 5.5;
      const inputContainer = globalScene.add.container(70 + (80 - inputWidth), (hasTitle ? 28 : 2) + 20 * f);
      inputContainer.setVisible(false);

      const inputBg = addWindow(0, 0, inputWidth, 16, false, false, 0, 0, WindowVariant.XTHIN);

      const isPassword = config?.isPassword;
      const isReadOnly = config?.isReadOnly;
      const input = addTextInputObject(4, -2, inputWidth * 5.5, 116, TextStyle.TOOLTIP_CONTENT, {
        type: isPassword ? "password" : "text",
        maxLength: isPassword ? 64 : 20,
        readOnly: isReadOnly,
      });
      input.setOrigin(0, 0);

      inputContainer.add(inputBg);
      inputContainer.add(input);

      this.inputContainers.push(inputContainer);
      this.modalContainer.add(inputContainer);

      this.inputs.push(input);
    });
  }

  override show(args: any[]): boolean {
    if (super.show(args)) {
      this.inputContainers.map(ic => ic.setVisible(true));

      const config = args[0] as FormModalConfig;

      this.submitAction = config.buttonActions.length > 0 ? config.buttonActions[0] : null;
      this.cancelAction = config.buttonActions[1] ?? null;

      // Auto focus the first input field after a short delay, to prevent accidental inputs
      setTimeout(() => {
        this.inputs[0].setFocus();
      }, 50);

      // #region: Override button pointerDown
      // Override the pointerDown event for the buttonBgs to call the `submitAction` and `cancelAction`
      // properties that we set above, allowing their behavior to change after this method terminates
      // Some subclasses use this to add behavior to the submit and cancel action

      this.buttonBgs[0].off("pointerdown");
      this.buttonBgs[0].on("pointerdown", () => {
        if (this.submitAction && globalScene.tweens.getTweensOf(this.modalContainer).length === 0) {
          this.submitAction();
        }
      });
      const cancelBg = this.buttonBgs[1];
      if (cancelBg) {
        cancelBg.off("pointerdown");
        cancelBg.on("pointerdown", () => {
          // The seemingly redundant cancelAction check is intentionally left in as a defensive programming measure
          if (this.cancelAction && globalScene.tweens.getTweensOf(this.modalContainer).length === 0) {
            this.cancelAction();
          }
        });
      }
      //#endregion: Override pointerDown events

      this.modalContainer.y += 24;
      this.modalContainer.setAlpha(0);

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

    this.errorMessage.setText(this.getReadableErrorMessage((config as FormModalConfig)?.errorMessage || ""));
    this.errorMessage.setVisible(!!this.errorMessage.text);
  }

  clear(): void {
    super.clear();
    this.modalContainer.setVisible(false);

    this.inputContainers.map(ic => ic.setVisible(false));

    this.submitAction = null;

    if (this.tween) {
      this.tween.remove();
    }
  }
}

export interface InputFieldConfig {
  label: string;
  isPassword?: boolean;
  isReadOnly?: boolean;
}
