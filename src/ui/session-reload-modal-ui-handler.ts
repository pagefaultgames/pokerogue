import type { ModalConfig } from "./modal-ui-handler";
import { ModalUiHandler } from "./modal-ui-handler";
import { addTextObject, TextStyle } from "./text";
import type { Mode } from "./ui";

export default class SessionReloadModalUiHandler extends ModalUiHandler {
  constructor(mode: Mode | null = null) {
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

  show(_args: any[]): boolean {
    const config: ModalConfig = {
      buttonActions: [],
    };

    return super.show([config]);
  }
}
