import { globalScene } from "#app/global-scene";
import { TextStyle } from "#enums/text-style";
import { UiMode } from "#enums/ui-mode";
import type { ModalConfig } from "#ui/modal-ui-handler";
import { ModalUiHandler } from "#ui/modal-ui-handler";
import { addTextObject } from "#ui/text";
import { playTween } from "#utils/anim-utils";
import { fixedInt } from "#utils/common";
import i18next from "i18next";

export class AlertModalUiHandler extends ModalUiHandler {
  private label: Phaser.GameObjects.Text;
  private allowClosing = false;
  private overlay: Phaser.GameObjects.Rectangle;

  constructor(mode: UiMode | null = null) {
    super(mode);
  }

  getModalTitle(): string {
    return "";
  }

  getWidth(): number {
    return 250;
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
   * @param args - \
   * `message`: The message that will be displayed in the alert box. \
   * `closeDelay`: Optional delay before allowing the user to close the modal. If not provided, the alert will be unclosable.
   */
  show(args: [message: string, closeDelay?: number]): boolean {
    const config: ModalConfig = { buttonActions: [] };

    const msg = args[0];
    if (msg) {
      this.label.setText(args[0]);
    }

    const { height, width } = globalScene.scaledCanvas;
    const { ui } = globalScene;

    this.overlay = new Phaser.GameObjects.Rectangle(globalScene, 0, -height, width, height, 0x070707)
      .setName("egg-compensation-overlay")
      .setOrigin(0)
      .setAlpha(0);
    ui.add(this.overlay);

    playTween({ targets: this.overlay, alpha: 0.7, duration: 750, ease: "Sine.easeOut" });

    const delay = args[1];
    this.allowClosing = false;
    if (delay != null) {
      globalScene.time.delayedCall(fixedInt(delay), () => {
        this.allowClosing = true;
      });
    }
    return super.show([config]);
  }

  public override processInput(): boolean {
    if (!this.allowClosing) {
      return false;
    }
    const { ui } = globalScene;
    if (ui.getMode() === UiMode.ALERT_MODAL) {
      ui.revertMode()
        .then(() => playTween({ targets: this.overlay, alpha: 0, duration: 500, ease: "Sine.easeOut" }))
        .then(() => ui.remove(this.overlay, true));
    }
    return true;
  }
}
