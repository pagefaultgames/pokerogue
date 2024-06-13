import BattleScene from "../battle-scene";
import { ModalConfig, ModalUiHandler } from "./modal-ui-handler";
import { Mode } from "./ui";
import { TextStyle, addTextInputObject, addTextObject } from "./text";
import { WindowVariant, addWindow } from "./ui-theme";
import InputText from "phaser3-rex-plugins/plugins/inputtext";
import * as Utils from "../utils";
import i18next from "../plugins/i18n";
import {Button} from "../enums/buttons";

export interface FormModalConfig extends ModalConfig {
  errorMessage?: string;
}

export abstract class FormModalUiHandler extends ModalUiHandler {
  protected editing: boolean;
  protected inputContainers: Phaser.GameObjects.Container[];
  protected inputs: InputText[];
  protected errorMessage: Phaser.GameObjects.Text;
  protected submitAction: Function;
  protected tween: Phaser.Tweens.Tween;

  constructor(scene: BattleScene, mode?: Mode) {
    super(scene, mode);

    this.editing = false;
    this.inputContainers = [];
    this.inputs = [];
  }

  abstract getFields(): string[];

  getHeight(config?: ModalConfig): number {
    return 20 * this.getFields().length + (this.getModalTitle() ? 26 : 0) + ((config as FormModalConfig)?.errorMessage ? 12 : 0) + this.getButtonTopMargin() + 28;
  }

  getReadableErrorMessage(error: string): string {
    if (error?.indexOf("connection refused") > -1) {
      return "Could not connect to the server";
    }

    return error;
  }

  setup(): void {
    super.setup();

    const fields = this.getFields();

    const hasTitle = !!this.getModalTitle();

    fields.forEach((field, f) => {
      const label = addTextObject(this.scene, 10, (hasTitle ? 31 : 5) + 20 * f, field, TextStyle.TOOLTIP_CONTENT);

      this.modalContainer.add(label);

      const inputContainer = this.scene.add.container(70, (hasTitle ? 28 : 2) + 20 * f);
      inputContainer.setVisible(false);

      const inputBg = addWindow(this.scene, 0, 0, 80, 16, false, false, 0, 0, WindowVariant.XTHIN);

      const isPassword = field.includes(i18next.t("menu:password")) || field.includes(i18next.t("menu:confirmPassword"));
      const input = addTextInputObject(this.scene, 4, -2, 440, 116, TextStyle.TOOLTIP_CONTENT, { type: isPassword ? "password" : "text", maxLength: isPassword ? 64 : 16 });
      input.setOrigin(0, 0);

      inputContainer.add(inputBg);
      inputContainer.add(input);
      this.modalContainer.add(inputContainer);

      this.inputContainers.push(inputContainer);
      this.inputs.push(input);
    });

    this.errorMessage = addTextObject(this.scene, 10, (hasTitle ? 31 : 5) + 20 * (fields.length - 1) + 16 + this.getButtonTopMargin(), "", TextStyle.TOOLTIP_CONTENT);
    this.errorMessage.setColor(this.getTextColor(TextStyle.SUMMARY_PINK));
    this.errorMessage.setShadowColor(this.getTextColor(TextStyle.SUMMARY_PINK, true));
    this.errorMessage.setVisible(false);
    this.modalContainer.add(this.errorMessage);
  }

  show(args: any[]): boolean {
    if (super.show(args)) {
      this.inputContainers.map(ic => ic.setVisible(true));

      const config = args[0] as FormModalConfig;

      this.submitAction = config.buttonActions.length
        ? config.buttonActions[0]
        : null;

      if (this.buttonBgs.length) {
        this.buttonBgs[0].off("pointerdown");
        this.buttonBgs[0].on("pointerdown", () => {
          if (this.submitAction) {
            this.submitAction();
          }
        });
      }

      this.modalContainer.y += 24;
      this.modalContainer.setAlpha(0);

      this.tween = this.scene.tweens.add({
        targets: this.modalContainer,
        duration: Utils.fixedInt(1000),
        ease: "Sine.easeInOut",
        y: "-=24",
        alpha: 1
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
