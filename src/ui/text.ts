import { globalScene } from "#app/global-scene";
import { EggTier } from "#enums/egg-type";
import { ModifierTier } from "#enums/modifier-tier";
import { TextStyle } from "#enums/text-style";
import { UiTheme } from "#enums/ui-theme";
import i18next from "#plugins/i18n";
import type { TextStyleOptions } from "#types/ui";
import type Phaser from "phaser";
import BBCodeText from "phaser3-rex-plugins/plugins/gameobjects/tagtext/bbcodetext/BBCodeText";
import type InputText from "phaser3-rex-plugins/plugins/inputtext";

export function addTextObject(
  x: number,
  y: number,
  content: string,
  style: TextStyle,
  extraStyleOptions?: Phaser.Types.GameObjects.Text.TextStyle,
): Phaser.GameObjects.Text {
  const { scale, styleOptions, shadowColor, shadowXpos, shadowYpos } = getTextStyleOptions(style, extraStyleOptions);

  const ret = globalScene.add
    .text(x, y, content, styleOptions)
    .setScale(scale)
    .setShadow(shadowXpos, shadowYpos, shadowColor);
  if (!(styleOptions as Phaser.Types.GameObjects.Text.TextStyle).lineSpacing) {
    ret.setLineSpacing(scale * 30);
  }

  return ret;
}

export function setTextStyle(
  obj: Phaser.GameObjects.Text,
  style: TextStyle,
  extraStyleOptions?: Phaser.Types.GameObjects.Text.TextStyle,
) {
  const { scale, styleOptions, shadowColor, shadowXpos, shadowYpos } = getTextStyleOptions(style, extraStyleOptions);
  obj.setScale(scale).setShadow(shadowXpos, shadowYpos, shadowColor);
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
  const { scale, styleOptions, shadowColor, shadowXpos, shadowYpos } = getTextStyleOptions(style, extraStyleOptions);

  const ret = new BBCodeText(globalScene, x, y, content, styleOptions as BBCodeText.TextStyle);
  globalScene.add.existing(ret);
  ret.setScale(scale).setShadow(shadowXpos, shadowYpos, shadowColor);
  if (!(styleOptions as BBCodeText.TextStyle).lineSpacing) {
    ret.setLineSpacing(scale * 60);
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
  const { scale, styleOptions } = getTextStyleOptions(style, extraStyleOptions);

  const ret = globalScene.add.rexInputText(x, y, width, height, styleOptions as InputText.IConfig);
  ret.setScale(scale);

  return ret;
}

export function getTextStyleOptions(
  style: TextStyle,
  extraStyleOptions?: Phaser.Types.GameObjects.Text.TextStyle,
): TextStyleOptions {
  const lang = i18next.resolvedLanguage;
  let shadowXpos = 4;
  let shadowYpos = 5;
  const scale = 0.1666666667;
  const defaultFontSize = 96;

  let styleOptions: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: "emerald",
    fontSize: 96,
    color: getTextColor(style, false),
    padding: {
      bottom: 6,
    },
  };

  switch (style) {
    case TextStyle.SUMMARY: {
      const fontSizeLabel = "96px";
      switch (lang) {
        case "ja":
          styleOptions.padding = { top: 6, bottom: 4 };
          break;
      }
      styleOptions.fontSize = fontSizeLabel;
      break;
    }
    // shadowXpos = 5;
    // shadowYpos = 5;
    // break;
    case TextStyle.SUMMARY_HEADER: {
      let fontSizeLabel = "96px";
      switch (lang) {
        case "ja":
          styleOptions.padding = { bottom: 7 };
          fontSizeLabel = "80px";
          break;
      }
      styleOptions.fontSize = fontSizeLabel;
      break;
    }
    // shadowXpos = 5;
    // shadowYpos = 5;
    // break;
    case TextStyle.SUMMARY_DEX_NUM: {
      const fontSizeLabel = "96px";
      switch (lang) {
        case "ja":
          styleOptions.padding = { top: 2, bottom: 10 };
          break;
      }
      styleOptions.fontSize = fontSizeLabel;
      shadowXpos = 5;
      shadowYpos = 5;
      break;
    }
    case TextStyle.SUMMARY_DEX_NUM_GOLD: {
      const fontSizeLabel = "96px";
      switch (lang) {
        case "ja":
          styleOptions.padding = { top: 2, bottom: 10 };
          break;
      }
      styleOptions.fontSize = fontSizeLabel;
      shadowXpos = 5;
      shadowYpos = 5;
      break;
    }
    case TextStyle.SUMMARY_ALT:
    case TextStyle.SUMMARY_BLUE:
    case TextStyle.SUMMARY_RED:
    case TextStyle.SUMMARY_PINK:
    case TextStyle.SUMMARY_GOLD:
    case TextStyle.SUMMARY_GRAY:
    case TextStyle.SUMMARY_GREEN:
    case TextStyle.SUMMARY_STATS:
    case TextStyle.SUMMARY_STATS_BLUE:
    case TextStyle.SUMMARY_STATS_PINK:
    case TextStyle.SUMMARY_STATS_GOLD:
    case TextStyle.WINDOW:
    case TextStyle.WINDOW_ALT:
    case TextStyle.ME_OPTION_DEFAULT:
    case TextStyle.ME_OPTION_SPECIAL:
      shadowXpos = 3;
      shadowYpos = 3;
      break;
    case TextStyle.LUCK_VALUE: {
      const fontSizeLabel = "96px";
      switch (lang) {
        case "ja":
          styleOptions.padding = { top: -6, bottom: 2 };
          break;
      }
      styleOptions.fontSize = fontSizeLabel;
      shadowXpos = 3;
      shadowYpos = 4;
      break;
    }
    case TextStyle.GROWTH_RATE_TYPE: {
      switch (lang) {
        case "ja":
          styleOptions.padding = { left: 24 };
          break;
      }
      styleOptions.fontSize = defaultFontSize - 30;
      shadowXpos = 3;
      shadowYpos = 3;
      break;
    }
    case TextStyle.WINDOW_BATTLE_COMMAND: {
      let fontSizeLabel = "96px";
      switch (lang) {
        case "ja":
          styleOptions.padding = { top: 2 };
          fontSizeLabel = "92px";
          break;
      }
      styleOptions.fontSize = fontSizeLabel;
      break;
    }
    // shadowXpos = 5;
    // shadowYpos = 5;
    // break;
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
      styleOptions.fontSize = defaultFontSize;
      break;
    case TextStyle.HEADER_LABEL: {
      switch (lang) {
        case "ja":
          styleOptions.padding = { top: 6 };
          break;
      }
      break;
    }
    case TextStyle.SETTINGS_VALUE:
    case TextStyle.SETTINGS_LABEL: {
      shadowXpos = 3;
      shadowYpos = 3;
      let fontSizeValue = "96px";
      switch (lang) {
        case "ja":
          fontSizeValue = "80px";
          styleOptions.padding = { top: 10 };
          break;
        default:
          fontSizeValue = "96px";
          break;
      }
      styleOptions.fontSize = fontSizeValue;
      break;
    }
    case TextStyle.SETTINGS_LABEL_NAVBAR: {
      shadowXpos = 3;
      shadowYpos = 3;
      let fontSizeValue = "96px";
      switch (lang) {
        case "ja":
          fontSizeValue = "92px";
          break;
        default:
          fontSizeValue = "96px";
          break;
      }
      styleOptions.fontSize = fontSizeValue;
      break;
    }
    case TextStyle.SETTINGS_LOCKED: {
      shadowXpos = 3;
      shadowYpos = 3;
      let fontSizeValue = "96px";
      switch (lang) {
        case "ja":
          fontSizeValue = "80px";
          styleOptions.padding = { top: 10 };
          break;
        default:
          fontSizeValue = "96px";
          break;
      }
      styleOptions.fontSize = fontSizeValue;
      break;
    }
    case TextStyle.SETTINGS_SELECTED: {
      shadowXpos = 3;
      shadowYpos = 3;
      let fontSizeValue = "96px";
      switch (lang) {
        case "ja":
          fontSizeValue = "80px";
          styleOptions.padding = { top: 10 };
          break;
        default:
          fontSizeValue = "96px";
          break;
      }
      styleOptions.fontSize = fontSizeValue;
      break;
    }
    case TextStyle.BATTLE_INFO:
    case TextStyle.MONEY:
    case TextStyle.MONEY_WINDOW:
    case TextStyle.TOOLTIP_TITLE:
      styleOptions.fontSize = defaultFontSize - 24;
      shadowXpos = 3.5;
      shadowYpos = 3.5;
      break;
    case TextStyle.PARTY:
    case TextStyle.PARTY_RED: {
      switch (lang) {
        case "ja":
          styleOptions.padding = { top: -12, bottom: 4 };
          break;
      }
      styleOptions.fontSize = defaultFontSize - 30;
      styleOptions.fontFamily = "pkmnems";
      break;
    }
    case TextStyle.PARTY_CANCEL_BUTTON: {
      switch (lang) {
        case "ja":
          styleOptions.fontSize = defaultFontSize - 42;
          styleOptions.padding = { top: 4 };
          break;
        case "ko":
          styleOptions.fontSize = defaultFontSize - 38;
          styleOptions.padding = { top: 4, left: 6 };
          break;
        case "zh-CN":
        case "zh-TW":
          styleOptions.fontSize = defaultFontSize - 42;
          styleOptions.padding = { top: 5, left: 14 };
          break;
        default:
          styleOptions.fontSize = defaultFontSize - 30;
          styleOptions.padding = { left: 12 };
          break;
      }
      styleOptions.fontFamily = "pkmnems";
      break;
    }
    case TextStyle.INSTRUCTIONS_TEXT: {
      switch (lang) {
        case "ja":
          styleOptions.padding = { top: -3, bottom: 4 };
          break;
      }
      styleOptions.fontSize = defaultFontSize - 30;
      styleOptions.fontFamily = "pkmnems";
      shadowXpos = 3;
      shadowYpos = 3;
      break;
    }
    case TextStyle.MOVE_LABEL: {
      switch (lang) {
        case "ja":
          styleOptions.fontSize = defaultFontSize - 16;
          styleOptions.padding = { top: -14, bottom: 8 };
          break;
        default:
          styleOptions.fontSize = defaultFontSize - 30;
          break;
      }
      styleOptions.fontFamily = "pkmnems";
      break;
    }
    case TextStyle.EGG_LIST:
      styleOptions.fontSize = defaultFontSize - 34;
      break;
    case TextStyle.EGG_SUMMARY_NAME: {
      switch (lang) {
        case "ja":
          styleOptions.padding = { top: -1 };
          break;
      }
      break;
    }
    case TextStyle.EGG_SUMMARY_DEX: {
      switch (lang) {
        case "ja":
          styleOptions.padding = { top: 2 };
          break;
      }
      break;
    }
    case TextStyle.STARTER_VALUE_LIMIT:
      styleOptions.fontSize = defaultFontSize - 36;
      shadowXpos = 3;
      shadowYpos = 3;
      break;
    case TextStyle.TOOLTIP_CONTENT: {
      switch (lang) {
        case "ja":
          styleOptions.fontSize = defaultFontSize - 44;
          styleOptions.padding = { top: 10, right: 10 };
          break;
        default:
          styleOptions.fontSize = defaultFontSize - 32;
          break;
      }
      shadowXpos = 3;
      shadowYpos = 3;
      break;
    }
    case TextStyle.FILTER_BAR_MAIN: {
      switch (lang) {
        case "ja":
          styleOptions.fontSize = defaultFontSize - 48;
          styleOptions.padding = { top: 10, right: 10 };
          break;
        default:
          styleOptions.fontSize = defaultFontSize - 32;
          break;
      }
      shadowXpos = 3;
      shadowYpos = 3;
      break;
    }
    case TextStyle.STATS_HEXAGON:
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

  const shadowColor = getTextColor(style, true);

  if (extraStyleOptions) {
    if (extraStyleOptions.fontSize) {
      const sizeRatio =
        Number.parseInt(extraStyleOptions.fontSize.toString().slice(0, -2))
        / Number.parseInt(styleOptions.fontSize?.toString().slice(0, -2) ?? "1");
      shadowXpos *= sizeRatio;
    }
    styleOptions = Object.assign(styleOptions, extraStyleOptions);
  }

  return { scale, styleOptions, shadowColor, shadowXpos, shadowYpos };
}

export function getBBCodeFrag(content: string, textStyle: TextStyle): string {
  return `[color=${getTextColor(textStyle, false)}][shadow=${getTextColor(textStyle, true)}]${content}`;
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
export function getTextWithColors(content: string, primaryStyle: TextStyle, forWindow?: boolean): string {
  // Apply primary styling before anything else
  let text = getBBCodeFrag(content, primaryStyle) + "[/color][/shadow]";
  const primaryStyleString = [...text.match(new RegExp(/\[color=[^[]*\]\[shadow=[^[]*\]/i))!][0];

  /* For money text displayed in game windows, we can't use the default {@linkcode TextStyle.MONEY}
   * or it will look wrong in legacy mode because of the different window background color
   * So, for text to be displayed in windows replace all "@[MONEY]" with "@[MONEY_WINDOW]" */
  if (forWindow) {
    text = text.replace(/@\[MONEY\]/g, (_substring: string) => "@[MONEY_WINDOW]");
  }

  // Set custom colors
  text = text.replace(/@\[([^{]*)\]{([^}]*)}/gi, (_substring, textStyle: string, textToColor: string) => {
    return (
      "[/color][/shadow]" + getBBCodeFrag(textToColor, TextStyle[textStyle]) + "[/color][/shadow]" + primaryStyleString
    );
  });

  // Remove extra style block at the end
  return text.replace(/\[color=[^[]*\]\[shadow=[^[]*\]\[\/color\]\[\/shadow\]/gi, "");
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: This is a giant switch which is the best option.
export function getTextColor(textStyle: TextStyle, shadow?: boolean): string {
  const isLegacyTheme = globalScene.uiTheme === UiTheme.LEGACY;
  switch (textStyle) {
    case TextStyle.MESSAGE:
      return !shadow ? "#f8f8f8" : "#6b5a73";
    case TextStyle.WINDOW:
    case TextStyle.WINDOW_BATTLE_COMMAND:
    case TextStyle.MOVE_INFO_CONTENT:
    case TextStyle.STATS_HEXAGON:
    case TextStyle.MOVE_PP_FULL:
    case TextStyle.EGG_LIST:
    case TextStyle.TOOLTIP_CONTENT:
    case TextStyle.FILTER_BAR_MAIN:
    case TextStyle.STARTER_VALUE_LIMIT:
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
    case TextStyle.PARTY_CANCEL_BUTTON:
    case TextStyle.INSTRUCTIONS_TEXT:
    case TextStyle.MOVE_LABEL:
      return !shadow ? "#f8f8f8" : "#707070";
    case TextStyle.PARTY_RED:
      return !shadow ? "#f89890" : "#984038";
    case TextStyle.SUMMARY:
    case TextStyle.SUMMARY_DEX_NUM:
    case TextStyle.SUMMARY_HEADER:
    case TextStyle.SUMMARY_STATS:
    case TextStyle.EGG_SUMMARY_NAME:
    case TextStyle.EGG_SUMMARY_DEX:
    case TextStyle.LUCK_VALUE:
      return !shadow ? "#f8f8f8" : "#636363";
    case TextStyle.SUMMARY_ALT:
    case TextStyle.GROWTH_RATE_TYPE:
      if (isLegacyTheme) {
        return !shadow ? "#f8f8f8" : "#636363";
      }
      return !shadow ? "#484848" : "#d0d0c8";
    case TextStyle.SUMMARY_RED:
    case TextStyle.TOOLTIP_TITLE:
      return !shadow ? "#e70808" : "#ffbd73";
    case TextStyle.SUMMARY_BLUE:
    case TextStyle.SUMMARY_STATS_BLUE:
      return !shadow ? "#40c8f8" : "#006090";
    case TextStyle.SUMMARY_PINK:
    case TextStyle.SUMMARY_STATS_PINK:
      return !shadow ? "#f89890" : "#984038";
    case TextStyle.SUMMARY_GOLD:
    case TextStyle.SUMMARY_DEX_NUM_GOLD:
    case TextStyle.SUMMARY_STATS_GOLD:
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
    case TextStyle.SETTINGS_LABEL_NAVBAR:
    case TextStyle.HEADER_LABEL:
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
