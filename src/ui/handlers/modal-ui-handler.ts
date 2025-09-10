import { globalScene } from "#app/global-scene";
import type { Button } from "#enums/buttons";
import { TextStyle } from "#enums/text-style";
import type { UiMode } from "#enums/ui-mode";
import { UiHandler } from "#ui/handlers/ui-handler";
import { addTextObject } from "#ui/text";
import { addWindow, WindowVariant } from "#ui/ui-theme";

export interface ModalConfig {
  buttonActions: ((...args: any[]) => any)[];
}

export abstract class ModalUiHandler extends UiHandler {
  protected modalContainer: Phaser.GameObjects.Container;
  protected modalBg: Phaser.GameObjects.NineSlice;
  protected titleText: Phaser.GameObjects.Text;
  protected buttonContainers: Phaser.GameObjects.Container[];
  protected buttonBgs: Phaser.GameObjects.NineSlice[];
  protected buttonLabels: Phaser.GameObjects.Text[];

  constructor(mode: UiMode | null = null) {
    super(mode);

    this.buttonContainers = [];
    this.buttonBgs = [];
    this.buttonLabels = [];
  }

  abstract getModalTitle(config?: ModalConfig): string;

  abstract getWidth(config?: ModalConfig): number;

  abstract getHeight(config?: ModalConfig): number;

  abstract getMargin(config?: ModalConfig): [number, number, number, number];

  abstract getButtonLabels(config?: ModalConfig): string[];

  getButtonTopMargin(): number {
    return 0;
  }

  setup() {
    const ui = this.getUi();

    this.modalContainer = globalScene.add.container(0, 0);

    this.modalContainer.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, globalScene.scaledCanvas.width, globalScene.scaledCanvas.height),
      Phaser.Geom.Rectangle.Contains,
    );

    this.modalBg = addWindow(0, 0, 0, 0);

    this.modalContainer.add(this.modalBg);

    this.titleText = addTextObject(0, 4, "", TextStyle.SETTINGS_LABEL);
    this.titleText.setOrigin(0.5, 0);

    this.modalContainer.add(this.titleText);

    ui.add(this.modalContainer);

    const buttonLabels = this.getButtonLabels();

    for (const label of buttonLabels) {
      this.addButton(label);
    }

    this.modalContainer.setVisible(false);
  }

  private addButton(label: string) {
    const buttonTopMargin = this.getButtonTopMargin();
    const buttonLabel = addTextObject(0, 8, label, TextStyle.TOOLTIP_CONTENT);
    buttonLabel.setOrigin(0.5, 0.5);

    const buttonBg = addWindow(0, 0, buttonLabel.getBounds().width + 8, 16, false, false, 0, 0, WindowVariant.THIN);
    buttonBg.setOrigin(0.5, 0);
    buttonBg.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, buttonBg.width, buttonBg.height),
      Phaser.Geom.Rectangle.Contains,
    );

    const buttonContainer = globalScene.add.container(0, buttonTopMargin);

    this.buttonLabels.push(buttonLabel);
    this.buttonBgs.push(buttonBg);
    this.buttonContainers.push(buttonContainer);

    buttonContainer.add(buttonBg);
    buttonContainer.add(buttonLabel);

    this.addInteractionHoverEffect(buttonBg);

    this.modalContainer.add(buttonContainer);
  }

  show(args: any[]): boolean {
    if (args.length > 0 && "buttonActions" in args[0]) {
      super.show(args);
      if (args[0].hasOwnProperty("fadeOut") && typeof args[0].fadeOut === "function") {
        const [marginTop, marginRight, marginBottom, marginLeft] = this.getMargin();

        const overlay = globalScene.add.rectangle(
          (this.getWidth() + marginLeft + marginRight) / 2,
          (this.getHeight() + marginTop + marginBottom) / 2,
          globalScene.scaledCanvas.width,
          globalScene.scaledCanvas.height,
          0,
        );
        overlay.setOrigin(0.5, 0.5);
        overlay.setName("rect-ui-overlay-modal");
        overlay.setAlpha(0);

        this.modalContainer.add(overlay);
        this.modalContainer.moveTo(overlay, 0);

        globalScene.tweens.add({
          targets: overlay,
          alpha: 1,
          duration: 250,
          ease: "Sine.easeOut",
          onComplete: args[0].fadeOut,
        });
      }

      const config = args[0] as ModalConfig;

      this.updateContainer(config);

      this.modalContainer.setVisible(true);

      this.getUi().moveTo(this.modalContainer, this.getUi().length - 1);

      for (let a = 0; a < this.buttonBgs.length; a++) {
        if (a < this.buttonBgs.length) {
          this.buttonBgs[a].on("pointerdown", _ => {
            if (globalScene.tweens.getTweensOf(this.modalContainer).length === 0) {
              config.buttonActions[a]();
            }
          });
        }
      }

      return true;
    }

    return false;
  }

  updateContainer(config?: ModalConfig): void {
    const [marginTop, marginRight, marginBottom, marginLeft] = this.getMargin(config);

    /**
     * If the total amount of characters for the 2 buttons exceeds ~30 characters,
     * the width in `registration-form-ui-handler.ts` and `login-form-ui-handler.ts` needs to be increased.
     */
    const width = this.getWidth(config);
    const height = this.getHeight(config);
    this.modalContainer.setPosition(
      (globalScene.scaledCanvas.width - (width + (marginRight - marginLeft))) / 2,
      (-globalScene.scaledCanvas.height - (height + (marginBottom - marginTop))) / 2,
    );

    this.modalBg.setSize(width, height);

    const title = this.getModalTitle(config);

    this.titleText.setText(title);
    this.titleText.setX(width / 2);
    this.titleText.setVisible(!!title);

    if (this.buttonContainers.length > 0) {
      const spacing = 12;
      const totalWidth = this.buttonBgs.reduce((sum, bg) => sum + bg.width, 0) + spacing * (this.buttonBgs.length - 1);
      let x = (this.modalBg.width - totalWidth) / 2;
      this.buttonContainers.forEach((container, i) => {
        container.setPosition(x + this.buttonBgs[i].width / 2, this.modalBg.height - (this.buttonBgs[i].height + 8));
        x += this.buttonBgs[i].width + spacing;
      });
    }
  }

  processInput(_button: Button): boolean {
    return false;
  }

  clear() {
    super.clear();
    this.modalContainer.setVisible(false);

    this.buttonBgs.map(bg => bg.off("pointerdown"));
  }

  /**
   * Adds a hover effect to a game object which changes the cursor to a `pointer` and tints it slighly
   * @param gameObject the game object to add hover events/effects to
   */
  protected addInteractionHoverEffect(
    gameObject: Phaser.GameObjects.Image | Phaser.GameObjects.NineSlice | Phaser.GameObjects.Sprite,
  ) {
    gameObject.on("pointerover", () => {
      this.setMouseCursorStyle("pointer");
      gameObject.setTint(0xbbbbbb);
    });

    gameObject.on("pointerout", () => {
      this.setMouseCursorStyle("default");
      gameObject.clearTint();
    });
  }
}
