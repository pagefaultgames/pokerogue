import { globalScene } from "#app/global-scene";
import { TextStyle } from "#enums/text-style";
import { UiMode } from "#enums/ui-mode";
import type { ModalConfig } from "#types/ui-types";
import { ModalUiHandler } from "#ui/modal-ui-handler";
import { addTextObject } from "#ui/text";
import { playTween } from "#utils/anim-utils";
import { fixedInt } from "#utils/common";

export class AlertModalUiHandler extends ModalUiHandler {
  private label: Phaser.GameObjects.Text;
  private allowClosing = false;
  private overlay: Phaser.GameObjects.Rectangle;

  private width = 250;
  private height = 32;

  constructor(mode: UiMode | null = null) {
    super(mode);
  }

  public override getModalTitle(): string {
    return "";
  }

  public override getWidth(): number {
    return this.width;
  }

  public override getHeight(): number {
    return this.height;
  }

  public override getMargin(): [number, number, number, number] {
    return [0, 0, 48, 0];
  }

  public override getButtonLabels(): string[] {
    return [];
  }

  public override setup(): void {
    super.setup();

    this.label = addTextObject(
      this.getWidth() / 2,
      this.getHeight() / 2,
      "This is a placeholder message for the alert UI.\nIf you are reading this, someone forgot to set a message for this alert.",
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
  public override show(args: [message: string, closeDelay?: number]): boolean {
    const config: ModalConfig = { buttonActions: [] };

    const msg = args[0];
    if (msg) {
      this.label.setText(msg);

      this.width = Math.ceil(this.label.displayWidth) + 20;
      this.label.x = this.getWidth() / 2;

      this.height = Math.ceil(this.label.displayHeight) + 16;
      this.label.y = this.getHeight() / 2;
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
