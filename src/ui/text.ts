import { EggTier } from "#enums/egg-type";
import { UiTheme } from "#enums/ui-theme";
import type Phaser from "phaser";
import BBCodeText from "phaser3-rex-plugins/plugins/gameobjects/tagtext/bbcodetext/BBCodeText";
import InputText from "phaser3-rex-plugins/plugins/inputtext";
import { globalScene } from "#app/global-scene";
import { ModifierTier } from "../modifier/modifier-tier";
import i18next from "#app/plugins/i18n";

export enum TextStyle {
  MESSAGE,
  WINDOW,
  WINDOW_ALT,
  BATTLE_INFO,
  PARTY,
  PARTY_RED,
  SUMMARY,
  SUMMARY_ALT,
  SUMMARY_RED,
  SUMMARY_BLUE,
  SUMMARY_PINK,
  SUMMARY_GOLD,
  SUMMARY_GRAY,
  SUMMARY_GREEN,
  MONEY, // Money default styling (pale yellow)
  MONEY_WINDOW, // Money displayed in Windows (needs different colors based on theme)
  STATS_LABEL,
  STATS_VALUE,
  SETTINGS_VALUE,
  SETTINGS_LABEL,
  SETTINGS_SELECTED,
  SETTINGS_LOCKED,
  TOOLTIP_TITLE,
  TOOLTIP_CONTENT,
  MOVE_INFO_CONTENT,
  MOVE_PP_FULL,
  MOVE_PP_HALF_FULL,
  MOVE_PP_NEAR_EMPTY,
  MOVE_PP_EMPTY,
  SMALLER_WINDOW_ALT,
  BGM_BAR,
  PERFECT_IV,
  ME_OPTION_DEFAULT, // Default style for choices in ME
  ME_OPTION_SPECIAL, // Style for choices with special requirements in ME
  SHADOW_TEXT, // To obscure unavailable options
}

export interface TextStyleOptions {
  scale: number;
  styleOptions: Phaser.Types.GameObjects.Text.TextStyle | InputText.IConfig;
  shadowColor: string;
  shadowXpos: number;
  shadowYpos: number;
}

export function addTextObject(
  x: number,
  y: number,
  content: string,
  style: TextStyle,
  extraStyleOptions?: Phaser.Types.GameObjects.Text.TextStyle,
): Phaser.GameObjects.Text {
  const { scale, styleOptions, shadowColor, shadowXpos, shadowYpos } = getTextStyleOptions(
    style,
    globalScene.uiTheme,
    extraStyleOptions,
  );

  const ret = globalScene.add.text(x, y, content, styleOptions);
  ret.setScale(scale);
  ret.setShadow(shadowXpos, shadowYpos, shadowColor);
  if (!(styleOptions as Phaser.Types.GameObjects.Text.TextStyle).lineSpacing) {
    ret.setLineSpacing(scale * 30);
  }

  if (ret.lineSpacing < 12 && i18next.resolvedLanguage === "ja") {
    ret.setLineSpacing(ret.lineSpacing + 35);
  }

  return ret;
}

export function setTextStyle(
  obj: Phaser.GameObjects.Text,
  style: TextStyle,
  extraStyleOptions?: Phaser.Types.GameObjects.Text.TextStyle,
) {
  const { scale, styleOptions, shadowColor, shadowXpos, shadowYpos } = getTextStyleOptions(
    style,
    globalScene.uiTheme,
    extraStyleOptions,
  );
  obj.setScale(scale);
  obj.setShadow(shadowXpos, shadowYpos, shadowColor);
  if (!(styleOptions as Phaser.Types.GameObjects.Text.TextStyle).lineSpacing) {
    obj.setLineSpacing(scale * 30);
  }

  if (obj.lineSpacing < 12 && i18next.resolvedLanguage === "ja") {
    obj.setLineSpacing(obj.lineSpacing + 35);
  }
}

export function addBBCodeTextObject(
  x: number,
  y: number,
  content: string,
  style: TextStyle,
  extraStyleOptions?: Phaser.Types.GameObjects.Text.TextStyle,
): BBCodeText {
  const { scale, styleOptions, shadowColor, shadowXpos, shadowYpos } = getTextStyleOptions(
    style,
    globalScene.uiTheme,
    extraStyleOptions,
  );

  const ret = new BBCodeText(globalScene, x, y, content, styleOptions as BBCodeText.TextStyle);
  globalScene.add.existing(ret);
  ret.setScale(scale);
  ret.setShadow(shadowXpos, shadowYpos, shadowColor);
  if (!(styleOptions as BBCodeText.TextStyle).lineSpacing) {
    ret.setLineSpacing(scale * 60);
  }

  if (ret.lineSpacing < 12 && i18next.resolvedLanguage === "ja") {
    ret.setLineSpacing(ret.lineSpacing + 35);
  }

  return ret;
}

export function addTextInputObject(
  x: number,
  y: number,
  width: number,
  height: number,
  style: TextStyle,
  extraStyleOptions?: InputText.IConfig,
): InputText {
  const { scale, styleOptions } = getTextStyleOptions(style, globalScene.uiTheme, extraStyleOptions);

  const ret = new InputText(globalScene, x, y, width, height, styleOptions as InputText.IConfig);
  globalScene.add.existing(ret);
  ret.setScale(scale);

  return ret;
}

export function getTextStyleOptions(
  style: TextStyle,
  uiTheme: UiTheme,
  extraStyleOptions?: Phaser.Types.GameObjects.Text.TextStyle,
): TextStyleOptions {
  const lang = i18next.resolvedLanguage;
  let shadowXpos = 4;
  let shadowYpos = 5;
  let scale = 0.1666666667;
  const defaultFontSize = 96;

  let styleOptions: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: "emerald",
    fontSize: 96,
    color: getTextColor(style, false, uiTheme),
    padding: {
      bottom: 6,
    },
  };

  if (i18next.resolvedLanguage === "ja") {
    scale = 0.1388888889;
    styleOptions.padding = { top: 2, bottom: 4 };
  }

  switch (style) {
    case TextStyle.SUMMARY:
    case TextStyle.SUMMARY_ALT:
    case TextStyle.SUMMARY_BLUE:
    case TextStyle.SUMMARY_RED:
    case TextStyle.SUMMARY_PINK:
    case TextStyle.SUMMARY_GOLD:
    case TextStyle.SUMMARY_GRAY:
    case TextStyle.SUMMARY_GREEN:
    case TextStyle.WINDOW:
    case TextStyle.WINDOW_ALT:
    case TextStyle.ME_OPTION_DEFAULT:
    case TextStyle.ME_OPTION_SPECIAL:
      shadowXpos = 3;
      shadowYpos = 3;
      break;
    case TextStyle.STATS_LABEL: {
      let fontSizeLabel = "96px";
      switch (lang) {
        case "de":
          shadowXpos = 3;
          shadowYpos = 3;
          fontSizeLabel = "80px";
          break;
        default:
          fontSizeLabel = "96px";
          break;
      }
      styleOptions.fontSize = fontSizeLabel;
      break;
    }
    case TextStyle.STATS_VALUE: {
      shadowXpos = 3;
      shadowYpos = 3;
      let fontSizeValue = "96px";
      switch (lang) {
        case "de":
          fontSizeValue = "80px";
          break;
        default:
          fontSizeValue = "96px";
          break;
      }
      styleOptions.fontSize = fontSizeValue;
      break;
    }
    case TextStyle.MESSAGE:
    case TextStyle.SETTINGS_LABEL:
    case TextStyle.SETTINGS_LOCKED:
    case TextStyle.SETTINGS_SELECTED:
      break;
    case TextStyle.BATTLE_INFO:
    case TextStyle.MONEY:
    case TextStyle.MONEY_WINDOW:
    case TextStyle.TOOLTIP_TITLE:
      styleOptions.fontSize = defaultFontSize - 24;
      shadowXpos = 3.5;
      shadowYpos = 3.5;
      break;
    case TextStyle.PARTY:
    case TextStyle.PARTY_RED:
      styleOptions.fontSize = defaultFontSize - 30;
      styleOptions.fontFamily = "pkmnems";
      break;
    case TextStyle.TOOLTIP_CONTENT:
      styleOptions.fontSize = defaultFontSize - 32;
      shadowXpos = 3;
      shadowYpos = 3;
      break;
    case TextStyle.MOVE_INFO_CONTENT:
      styleOptions.fontSize = defaultFontSize - 40;
      shadowXpos = 3;
      shadowYpos = 3;
      break;
    case TextStyle.SMALLER_WINDOW_ALT:
      styleOptions.fontSize = defaultFontSize - 36;
      shadowXpos = 3;
      shadowYpos = 3;
      break;
    case TextStyle.BGM_BAR:
      styleOptions.fontSize = defaultFontSize - 24;
      shadowXpos = 3;
      shadowYpos = 3;
      break;
  }

  const shadowColor = getTextColor(style, true, uiTheme);

  if (extraStyleOptions) {
    if (extraStyleOptions.fontSize) {
      const sizeRatio =
        Number.parseInt(extraStyleOptions.fontSize.toString().slice(0, -2)) /
        Number.parseInt(styleOptions.fontSize?.toString().slice(0, -2) ?? "1");
      shadowXpos *= sizeRatio;
    }
    styleOptions = Object.assign(styleOptions, extraStyleOptions);
  }

  return { scale, styleOptions, shadowColor, shadowXpos, shadowYpos };
}

export function getBBCodeFrag(content: string, textStyle: TextStyle, uiTheme: UiTheme = UiTheme.DEFAULT): string {
  return `[color=${getTextColor(textStyle, false, uiTheme)}][shadow=${getTextColor(textStyle, true, uiTheme)}]${content}`;
}

/**
 * Should only be used with BBCodeText (see {@linkcode addBBCodeTextObject()})
 * This does NOT work with UI showText() or showDialogue() methods.
 * Method will do pattern match/replace and apply BBCode color/shadow styling to substrings within the content:
 * @[<TextStyle>]{<text to color>}
 *
 * Example: passing a content string of "@[SUMMARY_BLUE]{blue text} primaryStyle text @[SUMMARY_RED]{red text}" will result in:
 * - "blue text" with TextStyle.SUMMARY_BLUE applied
 * - " primaryStyle text " with primaryStyle TextStyle applied
 * - "red text" with TextStyle.SUMMARY_RED applied
 * @param content string with styling that need to be applied for BBCodeTextObject
 * @param primaryStyle Primary style is required in order to escape BBCode styling properly.
 * @param uiTheme the {@linkcode UiTheme} to get TextStyle for
 * @param forWindow set to `true` if the text is to be displayed in a window ({@linkcode BattleScene.addWindow})
 *  it will replace all instances of the default MONEY TextStyle by {@linkcode TextStyle.MONEY_WINDOW}
 */
export function getTextWithColors(
  content: string,
  primaryStyle: TextStyle,
  uiTheme: UiTheme,
  forWindow?: boolean,
): string {
  // Apply primary styling before anything else
  let text = getBBCodeFrag(content, primaryStyle, uiTheme) + "[/color][/shadow]";
  const primaryStyleString = [...text.match(new RegExp(/\[color=[^\[]*\]\[shadow=[^\[]*\]/i))!][0];

  /* For money text displayed in game windows, we can't use the default {@linkcode TextStyle.MONEY}
   * or it will look wrong in legacy mode because of the different window background color
   * So, for text to be displayed in windows replace all "@[MONEY]" with "@[MONEY_WINDOW]" */
  if (forWindow) {
    text = text.replace(/@\[MONEY\]/g, (_substring: string) => "@[MONEY_WINDOW]");
  }

  // Set custom colors
  text = text.replace(/@\[([^{]*)\]{([^}]*)}/gi, (_substring, textStyle: string, textToColor: string) => {
    return (
      "[/color][/shadow]" +
      getBBCodeFrag(textToColor, TextStyle[textStyle], uiTheme) +
      "[/color][/shadow]" +
      primaryStyleString
    );
  });

  // Remove extra style block at the end
  return text.replace(/\[color=[^\[]*\]\[shadow=[^\[]*\]\[\/color\]\[\/shadow\]/gi, "");
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: This is a giant switch which is the best option.
export function getTextColor(textStyle: TextStyle, shadow?: boolean, uiTheme: UiTheme = UiTheme.DEFAULT): string {
  const isLegacyTheme = uiTheme === UiTheme.LEGACY;
  switch (textStyle) {
    case TextStyle.MESSAGE:
      return !shadow ? "#f8f8f8" : "#6b5a73";
    case TextStyle.WINDOW:
    case TextStyle.MOVE_INFO_CONTENT:
    case TextStyle.MOVE_PP_FULL:
    case TextStyle.TOOLTIP_CONTENT:
    case TextStyle.SETTINGS_VALUE:
      if (isLegacyTheme) {
        return !shadow ? "#484848" : "#d0d0c8";
      }
      return !shadow ? "#f8f8f8" : "#6b5a73";
    case TextStyle.MOVE_PP_HALF_FULL:
      if (isLegacyTheme) {
        return !shadow ? "#a68e17" : "#ebd773";
      }
      return !shadow ? "#ccbe00" : "#6e672c";
    case TextStyle.MOVE_PP_NEAR_EMPTY:
      if (isLegacyTheme) {
        return !shadow ? "#d64b00" : "#f7b18b";
      }
      return !shadow ? "#d64b00" : "#69402a";
    case TextStyle.MOVE_PP_EMPTY:
      if (isLegacyTheme) {
        return !shadow ? "#e13d3d" : "#fca2a2";
      }
      return !shadow ? "#e13d3d" : "#632929";
    case TextStyle.WINDOW_ALT:
      return !shadow ? "#484848" : "#d0d0c8";
    case TextStyle.BATTLE_INFO:
      if (isLegacyTheme) {
        return !shadow ? "#404040" : "#ded6b5";
      }
      return !shadow ? "#f8f8f8" : "#6b5a73";
    case TextStyle.PARTY:
      return !shadow ? "#f8f8f8" : "#707070";
    case TextStyle.PARTY_RED:
      return !shadow ? "#f89890" : "#984038";
    case TextStyle.SUMMARY:
      return !shadow ? "#f8f8f8" : "#636363";
    case TextStyle.SUMMARY_ALT:
      if (isLegacyTheme) {
        return !shadow ? "#f8f8f8" : "#636363";
      }
      return !shadow ? "#484848" : "#d0d0c8";
    case TextStyle.SUMMARY_RED:
    case TextStyle.TOOLTIP_TITLE:
      return !shadow ? "#e70808" : "#ffbd73";
    case TextStyle.SUMMARY_BLUE:
      return !shadow ? "#40c8f8" : "#006090";
    case TextStyle.SUMMARY_PINK:
      return !shadow ? "#f89890" : "#984038";
    case TextStyle.SUMMARY_GOLD:
    case TextStyle.MONEY:
      return !shadow ? "#e8e8a8" : "#a0a060"; // Pale Yellow/Gold
    case TextStyle.MONEY_WINDOW:
      if (isLegacyTheme) {
        return !shadow ? "#f8b050" : "#c07800"; // Gold
      }
      return !shadow ? "#e8e8a8" : "#a0a060"; // Pale Yellow/Gold
    case TextStyle.SETTINGS_LOCKED:
    case TextStyle.SUMMARY_GRAY:
      return !shadow ? "#a0a0a0" : "#636363";
    case TextStyle.STATS_LABEL:
      return !shadow ? "#f8b050" : "#c07800";
    case TextStyle.STATS_VALUE:
      if (isLegacyTheme) {
        return !shadow ? "#484848" : "#d0d0c8";
      }
      return !shadow ? "#f8f8f8" : "#6b5a73";
    case TextStyle.SUMMARY_GREEN:
      return !shadow ? "#78c850" : "#306850";
    case TextStyle.SETTINGS_LABEL:
    case TextStyle.PERFECT_IV:
      return !shadow ? "#f8b050" : "#c07800";
    case TextStyle.SETTINGS_SELECTED:
      return !shadow ? "#f88880" : "#f83018";
    case TextStyle.SMALLER_WINDOW_ALT:
      return !shadow ? "#484848" : "#d0d0c8";
    case TextStyle.BGM_BAR:
      return !shadow ? "#f8f8f8" : "#6b5a73";
    case TextStyle.ME_OPTION_DEFAULT:
      return !shadow ? "#f8f8f8" : "#6b5a73"; // White
    case TextStyle.ME_OPTION_SPECIAL:
      if (isLegacyTheme) {
        return !shadow ? "#f8b050" : "#c07800"; // Gold
      }
      return !shadow ? "#78c850" : "#306850"; // Green
    // Leaving the logic in place, in case someone wants to pick an even darker hue for the shadow down the line
    case TextStyle.SHADOW_TEXT:
      if (isLegacyTheme) {
        return !shadow ? "#d0d0c8" : "#d0d0c8";
      }
      return !shadow ? "#6b5a73" : "#6b5a73";
  }
}

export function getModifierTierTextTint(tier: ModifierTier): number {
  switch (tier) {
    case ModifierTier.COMMON:
      return 0xf8f8f8;
    case ModifierTier.GREAT:
      return 0x4998f8;
    case ModifierTier.ULTRA:
      return 0xf8d038;
    case ModifierTier.ROGUE:
      return 0xdb4343;
    case ModifierTier.MASTER:
      return 0xe331c5;
    case ModifierTier.LUXURY:
      return 0xe74c18;
  }
}

export function getEggTierTextTint(tier: EggTier): number {
  switch (tier) {
    case EggTier.COMMON:
      return getModifierTierTextTint(ModifierTier.COMMON);
    case EggTier.RARE:
      return getModifierTierTextTint(ModifierTier.GREAT);
    case EggTier.EPIC:
      return getModifierTierTextTint(ModifierTier.ULTRA);
    case EggTier.LEGENDARY:
      return getModifierTierTextTint(ModifierTier.MASTER);
  }
}
