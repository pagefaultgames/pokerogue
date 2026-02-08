import { TextStyle } from "#enums/text-style";
import type { UiMode } from "#enums/ui-mode";
import { ModalUiHandler } from "#ui/modal-ui-handler";
import { addTextObject } from "#ui/text";
import type { ModalUiHandlerParams } from "#ui/ui-handler-params";

export class SessionReloadModalUiHandler extends ModalUiHandler {
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

    const label = addTextObject(
      this.getWidth() / 2,
      this.getHeight() / 2,
      "Your session is out of date.\nYour data will be reloaded…",
      TextStyle.WINDOW,
      { fontSize: "48px", align: "center" },
    );
    label.setOrigin(0.5, 0.5);

    this.modalContainer.add(label);
  }

  show(_args: ModalUiHandlerParams): boolean {
    return super.show({
      buttonActions: [],
    });
  }
}
