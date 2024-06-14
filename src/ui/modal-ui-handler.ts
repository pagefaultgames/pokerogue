import BattleScene from "../battle-scene";
import { TextStyle, addTextObject } from "./text";
import { Mode } from "./ui";
import UiHandler from "./ui-handler";
import { WindowVariant, addWindow } from "./ui-theme";
import {Button} from "#enums/buttons";

export interface ModalConfig {
  buttonActions: Function[];
}

export abstract class ModalUiHandler extends UiHandler {
  protected modalContainer: Phaser.GameObjects.Container;
  protected modalBg: Phaser.GameObjects.NineSlice;
  protected titleText: Phaser.GameObjects.Text;
  protected buttonContainers: Phaser.GameObjects.Container[];
  protected buttonBgs: Phaser.GameObjects.NineSlice[];

  constructor(scene: BattleScene, mode?: Mode) {
    super(scene, mode);

    this.buttonContainers = [];
    this.buttonBgs = [];
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

    this.modalContainer = this.scene.add.container(0, 0);

    this.modalContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6), Phaser.Geom.Rectangle.Contains);

    this.modalBg = addWindow(this.scene, 0, 0, 0, 0);

    this.modalContainer.add(this.modalBg);

    this.titleText = addTextObject(this.scene, 0, 4, "", TextStyle.SETTINGS_LABEL);
    this.titleText.setOrigin(0.5, 0);

    this.modalContainer.add(this.titleText);

    ui.add(this.modalContainer);

    const buttonLabels = this.getButtonLabels();

    const buttonTopMargin = this.getButtonTopMargin();

    for (const label of buttonLabels) {
      const buttonLabel = addTextObject(this.scene, 0, 8, label, TextStyle.TOOLTIP_CONTENT);
      buttonLabel.setOrigin(0.5, 0.5);

      const buttonBg = addWindow(this.scene, 0, 0, buttonLabel.getBounds().width + 8, 16, false, false, 0, 0, WindowVariant.THIN);
      buttonBg.setOrigin(0.5, 0);
      buttonBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, buttonBg.width, buttonBg.height), Phaser.Geom.Rectangle.Contains);

      const buttonContainer = this.scene.add.container(0, buttonTopMargin);

      this.buttonBgs.push(buttonBg);
      this.buttonContainers.push(buttonContainer);

      buttonContainer.add(buttonBg);
      buttonContainer.add(buttonLabel);
      this.modalContainer.add(buttonContainer);
    }

    this.modalContainer.setVisible(false);
  }

  show(args: any[]): boolean {
    if (args.length >= 1 && "buttonActions" in args[0]) {
      super.show(args);

      const config = args[0] as ModalConfig;

      this.updateContainer(config);

      this.modalContainer.setVisible(true);

      this.getUi().moveTo(this.modalContainer, this.getUi().length - 1);

      for (let a = 0; a < this.buttonBgs.length; a++) {
        if (a < this.buttonBgs.length) {
          this.buttonBgs[a].on("pointerdown", (_) => config.buttonActions[a]());
        }
      }

      return true;
    }

    return false;
  }

  updateContainer(config?: ModalConfig): void {
    const [ marginTop, marginRight, marginBottom, marginLeft ] = this.getMargin(config);

    const [ width, height ] = [ this.getWidth(config), this.getHeight(config) ];
    this.modalContainer.setPosition((((this.scene.game.canvas.width / 6) - (width + (marginRight - marginLeft))) / 2), (((-this.scene.game.canvas.height / 6) - (height + (marginBottom - marginTop))) / 2));

    this.modalBg.setSize(width, height);

    const title = this.getModalTitle(config);

    this.titleText.setText(title);
    this.titleText.setX(width / 2);
    this.titleText.setVisible(!!title);

    for (let b = 0; b < this.buttonContainers.length; b++) {
      const sliceWidth = width / (this.buttonContainers.length + 1);

      this.buttonContainers[b].setPosition(sliceWidth * (b + 1), this.modalBg.height - (this.buttonBgs[b].height + 8));
    }
  }

  processInput(button: Button): boolean {
    return false;
  }

  clear() {
    super.clear();
    this.modalContainer.setVisible(false);

    this.buttonBgs.map(bg => bg.off("pointerdown"));
  }
}
