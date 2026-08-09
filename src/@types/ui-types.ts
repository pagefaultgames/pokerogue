import type { BattlerIndex } from "#enums/battler-index";
import type { TextStyle } from "#enums/text-style";
import type { Starter } from "#types/save-data";
import type Phaser from "phaser";
import type InputText from "phaser3-rex-plugins/plugins/gameobjects/dom/inputtext/InputText";

export interface TextStyleOptions {
  scale: number;
  styleOptions: Phaser.Types.GameObjects.Text.TextStyle | InputText.IConfig;
  shadowColor: string;
  shadowXpos: number;
  shadowYpos: number;
}

export interface OptionSelectConfig {
  xOffset?: number;
  yOffset?: number;
  options: OptionSelectItem[];
  maxOptions?: number;
  delay?: number;
  noCancel?: boolean;
  supportHover?: boolean;
}

export interface OptionSelectItem {
  label: string;
  handler: () => boolean;
  onHover?: () => void;
  skip?: boolean;
  keepOpen?: boolean;
  overrideSound?: boolean;
  style?: TextStyle;
  item?: string;
  itemArgs?: any[];
}

export interface ModalConfig {
  buttonActions: ((...args: any[]) => any)[];
}

export interface FormModalConfig extends ModalConfig {
  errorMessage?: string;
}

export type SaveSlotSelectCallback = (cursor: number) => void;
export type StarterSelectCallback = (starters: Starter[]) => void;
export type TargetSelectCallback = (targets: BattlerIndex[]) => void;

// TODO: Strongly type the index signature aside from simply being `string`
export interface InputsIcons {
  [key: string]: Phaser.GameObjects.Sprite;
}

export interface LayoutConfig {
  optionsContainer: Phaser.GameObjects.Container;
  inputsIcons: InputsIcons;
  settingLabels: Phaser.GameObjects.Text[];
  optionValueLabels: Phaser.GameObjects.Text[][];
  optionCursors: number[];
  keys: string[];
  bindingSettings: string[];
}
