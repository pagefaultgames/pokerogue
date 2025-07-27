import type Phaser from "phaser";
import type InputText from "phaser3-rex-plugins/plugins/gameobjects/dom/inputtext/InputText";

export interface TextStyleOptions {
  scale: number;
  styleOptions: Phaser.Types.GameObjects.Text.TextStyle | InputText.IConfig;
  shadowColor: string;
  shadowXpos: number;
  shadowYpos: number;
}
