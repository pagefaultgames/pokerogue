import i18next from "i18next";
import BattleScene from "../battle-scene";
import { ModalUiHandler } from "./modal-ui-handler";
import { addTextObject, TextStyle } from "./text";
import { Mode } from "./ui";

export default class LoadingModalUiHandler extends ModalUiHandler {
  constructor(scene: BattleScene, mode?: Mode) {
    super(scene, mode);
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
    return [ 0, 0, 48, 0 ];
  }

  getButtonLabels(): string[] {
    return [ ];
  }

  setup(): void {
    super.setup();

    const label = addTextObject(this.scene, this.getWidth() / 2, this.getHeight() / 2, i18next.t("menu:loading"), TextStyle.WINDOW);
    label.setOrigin(0.5, 0.5);

    this.modalContainer.add(label);
  }
}
