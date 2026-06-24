import { TextStyle } from "#enums/text-style";
import type { UiMode } from "#enums/ui-mode";
import type { ModalConfig } from "#ui/modal-ui-handler";
import { ModalUiHandler } from "#ui/modal-ui-handler";
import { addTextObject } from "#ui/text";
import i18next from "i18next";

export class AlertModalUiHandler extends ModalUiHandler {
  private label: Phaser.GameObjects.Text;

  constructor(mode: UiMode | null = null) {
    super(mode);
  }

  getModalTitle(): string {
    return "";
  }

  getWidth(): number {
    return 160;
  }

  getHeight(): number {
    return 32;
  }

  getMargin(): [number, number, number, number] {
    return [0, 0, 48, 0];
  }

  getButtonLabels(): string[] {
    return [];
  }

  setup(): void {
    super.setup();

    this.label = addTextObject(
      //
      this.getWidth() / 2,
      this.getHeight() / 2,
      i18next.t("alert"),
      TextStyle.WINDOW,
      { fontSize: "48px", align: "center" },
    ) //
      .setOrigin(0.5, 0.5);

    this.modalContainer.add(this.label);
  }

  /**
   * Show the alert modal with the specified message.
   * @param args - The message that will be displayed in the alert box.
   */
  show(args: [message: string]): boolean {
    const config: ModalConfig = { buttonActions: [] };

    const msg = args[0];
    if (msg) {
      this.label.setText(args[0]);
    }

    return super.show([config]);
  }
}
