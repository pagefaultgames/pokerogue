import BattleScene from "../battle-scene";
import { ModalConfig, ModalUiHandler } from "./modal-ui-handler";
import { addTextObject, TextStyle } from "./text";
import { Mode } from "./ui";

export default class OutdatedModalUiHandler extends ModalUiHandler {
  constructor(scene: BattleScene, mode?: Mode) {
    super(scene, mode);
  }

  getModalTitle(): string {
    return "";
  }

  getWidth(): number {
    return 160;
  }

  getHeight(): number {
    return 64;
  }

  getMargin(): [number, number, number, number] {
    return [ 0, 0, 48, 0 ];
  }

  getButtonLabels(): string[] {
    return [ ];
  }

  setup(): void {
    super.setup();

    const label = addTextObject(this.scene, this.getWidth() / 2, this.getHeight() / 2, "Your client is currently outdated.\nPlease reload to update the game.\n\nIf this error persists, please clear your browser cache.", TextStyle.WINDOW, { fontSize: "48px", align: "center" });
    label.setOrigin(0.5, 0.5);

    this.modalContainer.add(label);
  }

  show(args: any[]): boolean {
    const config: ModalConfig = {
      buttonActions: []
    };

    return super.show([ config ]);
  }
}
