import BattleScene, { InfoToggle } from "../battle-scene";
import { TextStyle, addTextObject } from "./text";
import { addWindow } from "./ui-theme";
import * as Utils from "../utils";
import i18next from "i18next";

export interface BaseStatsOverlaySettings {
    scale?:number; // scale the box? A scale of 0.5 is recommended
    x?: number;
    y?: number;
    /** Default is always half the screen, regardless of scale */
    width?: number;
}

const HEIGHT = 120;
const BORDER = 8;
const GLOBAL_SCALE = 6;
const shortStats = [ "HP", "ATK", "DEF", "SPATK", "SPDEF", "SPD" ];

export default class BaseStatsOverlay extends Phaser.GameObjects.Container implements InfoToggle {

  public active: boolean = false;

  private statsLabels: Phaser.GameObjects.Text[] = [];
  private statsRectangles: Phaser.GameObjects.Rectangle[] = [];
  private statsShadows: Phaser.GameObjects.Rectangle[] = [];
  private statsTotalLabel: Phaser.GameObjects.Text;

  private statsBg: Phaser.GameObjects.NineSlice;

  private options: BaseStatsOverlaySettings;

  public scale: number;
  public width: number;

  constructor(scene: BattleScene, options?: BaseStatsOverlaySettings) {
    super(scene, options?.x, options?.y);
    this.scale = options?.scale || 1; // set up the scale
    this.setScale(this.scale);
    this.options = options || {};

    // prepare the description box
    this.width = (options?.width || BaseStatsOverlay.getWidth(this.scale, scene)) / this.scale; // divide by scale as we always want this to be half a window wide
    this.statsBg = addWindow(scene,  0, 0, this.width, HEIGHT);
    this.statsBg.setOrigin(0, 0);
    this.add(this.statsBg);

    for (let i = 0; i < 6; i++) {
      const shadow = this.scene.add.rectangle(0, BORDER + 3 + i * 15, 100, 5, 0x006860);
      shadow.setOrigin(1, 0);
      shadow.setX(this.width - BORDER + 1);
      this.statsShadows.push(shadow);
      this.add(shadow);

      const rectangle = this.scene.add.rectangle(0, BORDER + 2 + i * 15, 100, 5, 0x66aa99);
      rectangle.setOrigin(1, 0);
      rectangle.setX(this.width - BORDER);
      this.statsRectangles.push(rectangle);
      this.add(rectangle);

      const label = addTextObject(scene, BORDER, BORDER - 2 + i * 15, "A", TextStyle.BATTLE_INFO);
      this.statsLabels.push(label);
      this.add(label);
    }

    this.statsTotalLabel = addTextObject(scene, BORDER, BORDER + 6 * 15, "A", TextStyle.BATTLE_INFO, { color: "#ccbe00" });
    this.add(this.statsTotalLabel);

    // hide this component for now
    this.setVisible(false);
  }

  // show this component with infos for the specific move
  show(values: number[], total: number):boolean {

    for (let i = 0; i < 6; i++) {
      this.statsLabels[i].setText(i18next.t(`pokemonInfo:Stat.${shortStats[i]}shortened`) + ": " + `${values[i]}`);
      // This accounts for base stats up to 200, might not be enough.
      // TODO: change color based on value.
      this.statsShadows[i].setSize(values[i] / 2, 5);
      this.statsRectangles[i].setSize(values[i] / 2, 5);
    }

    this.statsTotalLabel.setText(i18next.t("pokedexUiHandler:baseTotal") + ": " + `${total}`);


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
    this.scene.tweens.add({
      targets: this.statsLabels,
      duration: Utils.fixedInt(125),
      ease: "Sine.easeInOut",
      alpha: visible ? 1 : 0
    });
    if (!visible) {
      this.setVisible(false);
    }
  }

  isActive(): boolean {
    return this.active;
  }

  // width of this element
  static getWidth(scale:number, scene: BattleScene):number {
    return scene.game.canvas.width / GLOBAL_SCALE / 2;
  }

  // height of this element
  static getHeight(scale:number, onSide?: boolean):number {
    return HEIGHT * scale;
  }
}
