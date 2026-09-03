import type { BattlerIndex } from "#enums/battler-index";
import type { TextStyle } from "#enums/text-style";
import type { UiMode } from "#enums/ui-mode";
import type { Starter } from "#types/save-data";
import type { BaseOptionSelectUiHandler } from "#ui/base-option-select-ui-handler";
import type Phaser from "phaser";
import type InputText from "phaser3-rex-plugins/plugins/gameobjects/dom/inputtext/InputText";

export interface TextStyleOptions {
  scale: number;
  styleOptions: Phaser.Types.GameObjects.Text.TextStyle | InputText.IConfig;
  shadowColor: string;
  shadowXpos: number;
  shadowYpos: number;
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

// #region Option Select

/**
 * Customizations options for {@linkcode UiMode.OPTION_SELECT}
 *
 * @template T - The specifc type of {@linkcode OptionSelectItem} contained by this config
 */
export interface OptionSelectModeConfig<T extends OptionSelectItem = OptionSelectItem> extends OptionMenuSettings {
  /** The {@linkcode OptionSelectItem}s to display. */
  options: T[];
}

/** General settings for how a menu should behave */
export interface OptionMenuSettings {
  /** The maximum number of options shown at once on screen. */
  readonly maxOptions?: number;
  /** Horizontal offset for the window compared to the default (right of screen) */
  readonly xOffset?: number | undefined;
  /** Vertical offset for the window compared to the default (bottom of screen) */
  readonly yOffset?: number;
  /** Whether to prevent using the cancel button as a shorcut to selecting the last option in the menu. */
  readonly blockCancelButton?: boolean;
  /** Optional delay (in ms) before the player is allowed to make a selection. */
  readonly inputDelay?: number;
  /** Whether to allow bypassing the inputDelay with the cancel button. */
  readonly canBypassInputDelay?: boolean;
  /** Optional callback for when the window gets resized. */
  readonly onResize?: (w: number, h: number) => void;
}

/** Customizations options for {@linkcode UiMode.CONFIRM} */
export interface ConfirmModeConfig extends OptionMenuSettings {
  /** Handler called when the player selects the "Yes" option */
  yesHandler: () => void;
  /** Handler called when the player selects the "No" option, or cancels */
  noHandler: () => void;
}

/** Configuration for an option in the menu */
export interface OptionSelectItem {
  /**
   * Text that will be shown in the menu for this option. \
   * Can only be on a single line, can use BBCode.
   */
  readonly label: string;
  /**
   * Handler called when that option is selected.
   * @returns `true` to play the "success" sfx, `false` for the "error" sfx
   */
  handler: () => boolean;
  /** Optional handler for when the cursor is moved to that option. */
  readonly onHover?: () => void;
  /** Whether to keep the menu open after this option was selected. */
  readonly keepOpen?: boolean;
  /** Whether to prevent the default menu sound effects from playing. */
  readonly noSoundEffects?: boolean;
  /**
   * Optional configuration to display icon(s) before the label's text. \
   * If multiple icons are given they will be overlayed.
   */
  readonly iconsConfig?: OptionSelectIconConfig[] | undefined;
  /**
   * Optional {@linkcode TextStyle} to give the item a custom color.
   * @defaultValue {@linkcode TextStyle.WINDOW}
   */
  readonly color?: TextStyle;
  /**
   * Whether to allow selecting the item
   * @defaultValue `true`
   */
  readonly selectable?: boolean;
}

/**
 * Used internally by {@linkcode BaseOptionSelectUiHandler} to keep track
 * of whether a menu item has been processed and is ready to be displayed.
 */
export interface UIOptionSelectItem extends OptionSelectItem {
  initialized: boolean;
  displayLabel: string;
  iconsWidth?: number;
  /**
   * {@linkcode TextStyle} to give the item a custom color.
   * @defaultValue {@linkcode TextStyle.WINDOW}
   */
  readonly color: TextStyle;
}

/**
 * Configuration for displaying a sprite before an option's label
 *
 * @example for the friendship candy sprite: `{ name: "items", frame: "candy" }`
 */
export interface OptionSelectIconConfig {
  /** The name of the sprite/texture to use */
  readonly name: string;
  /** The frame to use if the sprite has multiple ones */
  readonly frame?: number | string;
  /** Optional scaling for the icon */
  readonly scale?: number;
  /** Optional tint to give the icon */
  readonly tint?: number;
}

// #endregion Option Select
