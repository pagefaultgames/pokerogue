import { TextStyle } from "#enums/text-style";
import type { UiMode } from "#enums/ui-mode";
import { ModalUiHandler } from "#ui/handlers/modal-ui-handler";
import { addTextObject } from "#ui/text";
import i18next from "i18next";

export class LoadingModalUiHandler extends ModalUiHandler {
  constructor(mode: UiMode | null = null) {
    super(mode);
  }

  getModalTitle(): string {
    return "";
  }

  getWidth(): number {
    return 80;
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

    const label = addTextObject(this.getWidth() / 2, this.getHeight() / 2, i18next.t("menu:loading"), TextStyle.WINDOW);
    label.setOrigin(0.5, 0.5);

    this.modalContainer.add(label);
  }
}
