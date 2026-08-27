import { loggedInUser } from "#app/account";
import { Button } from "#enums/buttons";
import { TextStyle } from "#enums/text-style";
import type { ModalConfig } from "#types/ui-types";
import { ModalUiHandler } from "#ui/modal-ui-handler";
import { addTextObject } from "#ui/text";
import i18next from "i18next";

export class ResetCodeUiHandler extends ModalUiHandler {
  private resetCodeText: Phaser.GameObjects.Text;
  private isCodeVisible = false;

  public override getModalTitle(): string {
    return "Reset Code";
  }

  public override getWidth(): number {
    return 160;
  }

  public override getHeight(): number {
    return 64;
  }

  public override getMargin(): [number, number, number, number] {
    return [0, 0, 48, 0];
  }

  public override getButtonLabels(): string[] {
    return [i18next.t("menu:show"), i18next.t("menu:close")];
  }

  public override setup(): void {
    super.setup();

    this.resetCodeText = addTextObject(this.getWidth() / 2, 30, "", TextStyle.WINDOW).setOrigin(0.5, 0.5);
    this.modalContainer.add(this.resetCodeText);
  }

  public override show(): boolean {
    this.isCodeVisible = false;
    this.updateResetCodeText();

    return super.show([
      {
        buttonActions: [
          () => {
            this.isCodeVisible = !this.isCodeVisible;
            this.updateResetCodeText();
          },
          () => this.getUi().revertMode(),
        ],
      } satisfies ModalConfig,
    ]);
  }

  public override processInput(button: Button): boolean {
    if (button === Button.ACTION) {
      this.isCodeVisible = !this.isCodeVisible;
      this.updateResetCodeText();
      return true;
    }

    if (button === Button.CANCEL) {
      this.getUi().revertMode();
      return true;
    }

    return false;
  }

  private updateResetCodeText(): void {
    const resetCode = loggedInUser?.resetCode ?? i18next.t("menu:noResetCode");
    this.resetCodeText.setText(this.isCodeVisible ? resetCode : "********");
    this.buttonLabels[0].setText(this.isCodeVisible ? i18next.t("menu:hide") : i18next.t("menu:show"));
  }
}
