import type { InfoToggle } from "#app/battle-scene";
import { globalScene } from "#app/global-scene";
import { TextStyle } from "#enums/text-style";
import { addTextObject } from "#ui/text";
import { addWindow } from "#ui/ui-theme";
import { fixedInt } from "#utils/common";
import { toCamelCase } from "#utils/strings";
import i18next from "i18next";

interface BaseStatsOverlaySettings {
  scale?: number; // scale the box? A scale of 0.5 is recommended
  x?: number;
  y?: number;
  /** Default is always half the screen, regardless of scale */
  width?: number;
}

const HEIGHT = 120;
const BORDER = 8;
const shortStats = ["HP", "ATK", "DEF", "SPATK", "SPDEF", "SPD"];

export class BaseStatsOverlay extends Phaser.GameObjects.Container implements InfoToggle {
  public active = false;

  private statsLabels: Phaser.GameObjects.Text[] = [];
  private statsRectangles: Phaser.GameObjects.Rectangle[] = [];
  private statsShadows: Phaser.GameObjects.Rectangle[] = [];
  private statsTotalLabel: Phaser.GameObjects.Text;

  private statsBg: Phaser.GameObjects.NineSlice;

  public scale: number;
  public width: number;

  constructor(options?: BaseStatsOverlaySettings) {
    super(globalScene, options?.x, options?.y);
    this.scale = options?.scale || 1; // set up the scale
    this.setScale(this.scale);

    // prepare the description box
    this.width = (options?.width || BaseStatsOverlay.getWidth(this.scale)) / this.scale; // divide by scale as we always want this to be half a window wide
    this.statsBg = addWindow(0, 0, this.width, HEIGHT);
    this.statsBg.setOrigin(0, 0);
    this.add(this.statsBg);

    for (let i = 0; i < 6; i++) {
      const shadow = globalScene.add.rectangle(this.width - BORDER + 1, BORDER + 3 + i * 15, 100, 5, 0x006860);
      shadow.setOrigin(1, 0);
      this.statsShadows.push(shadow);
      this.add(shadow);

      const rectangle = globalScene.add.rectangle(this.width - BORDER, BORDER + 2 + i * 15, 100, 5, 0x66aa99);
      rectangle.setOrigin(1, 0);
      this.statsRectangles.push(rectangle);
      this.add(rectangle);

      const label = addTextObject(BORDER, BORDER - 2 + i * 15, "A", TextStyle.BATTLE_INFO);
      this.statsLabels.push(label);
      this.add(label);
    }

    this.statsTotalLabel = addTextObject(BORDER, BORDER + 6 * 15, "A", TextStyle.MONEY_WINDOW);
    this.add(this.statsTotalLabel);

    // hide this component for now
    this.setVisible(false);
  }

  // show this component with infos for the specific move
  show(values: number[], total: number): boolean {
    for (let i = 0; i < 6; i++) {
      this.statsLabels[i].setText(
        i18next.t(`pokemonInfo:stat.${toCamelCase(shortStats[i])}Shortened`) + `: ${values[i]}`,
      );
      // This accounts for base stats up to 200, might not be enough.
      // TODO: change color based on value.
      this.statsShadows[i].setSize(values[i] / 2, 5);
      this.statsRectangles[i].setSize(values[i] / 2, 5);
    }

    this.statsTotalLabel.setText(`${i18next.t("pokedexUiHandler:baseTotal")}: ${total}`);

    this.setVisible(true);
    this.active = true;
    return true;
  }

  clear() {
    this.setVisible(false);
    this.active = false;
  }

  toggleInfo(visible: boolean): void {
    if (visible) {
      this.setVisible(true);
    }
    globalScene.tweens.add({
      targets: this.statsLabels,
      duration: fixedInt(125),
      ease: "Sine.easeInOut",
      alpha: visible ? 1 : 0,
    });
    if (!visible) {
      this.setVisible(false);
    }
  }

  isActive(): boolean {
    return this.active;
  }

  // width of this element
  static getWidth(_scale: number): number {
    return globalScene.scaledCanvas.width / 2;
  }

  // height of this element
  static getHeight(scale: number, _onSide?: boolean): number {
    return HEIGHT * scale;
  }
}
