import BBCodeText from "phaser3-rex-plugins/plugins/gameobjects/tagtext/bbcodetext/BBCodeText";
import InputText from "phaser3-rex-plugins/plugins/inputtext";
import BattleScene from "../battle-scene";
import { EggTier } from "../data/enums/egg-type";
import { UiTheme } from "../enums/ui-theme";
import { ModifierTier } from "../modifier/modifier-tier";
import Phaser from "phaser";

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
  MONEY,
  STATS_LABEL,
  STATS_VALUE,
  SETTINGS_LABEL,
  SETTINGS_SELECTED,
  SETTINGS_LOCKED,
  TOOLTIP_TITLE,
  TOOLTIP_CONTENT,
  MOVE_INFO_CONTENT,
  MOVE_PP_FULL,
  MOVE_PP_HALF_FULL,
  MOVE_PP_NEAR_EMPTY,
  MOVE_PP_EMPTY
}

export function addTextObject(scene: Phaser.Scene, x: number, y: number, content: string, style: TextStyle, extraStyleOptions?: Phaser.Types.GameObjects.Text.TextStyle): Phaser.GameObjects.Text {
  const [ scale, styleOptions, shadowColor, shadowXpos, shadowYpos ] = getTextStyleOptions(style, (scene as BattleScene).uiTheme, extraStyleOptions);

  const ret = scene.add.text(x, y, content, styleOptions);
  ret.setScale(scale);
  ret.setShadow(shadowXpos, shadowYpos, shadowColor);
  if (!(styleOptions as Phaser.Types.GameObjects.Text.TextStyle).lineSpacing) {
    ret.setLineSpacing(5);
  }

  return ret;
}

export function setTextStyle(obj: Phaser.GameObjects.Text, scene: Phaser.Scene, style: TextStyle, extraStyleOptions?: Phaser.Types.GameObjects.Text.TextStyle) {
  const [ scale, styleOptions, shadowColor, shadowXpos, shadowYpos ] = getTextStyleOptions(style, (scene as BattleScene).uiTheme, extraStyleOptions);
  obj.setScale(scale);
  obj.setShadow(shadowXpos, shadowYpos, shadowColor);
  if (!(styleOptions as Phaser.Types.GameObjects.Text.TextStyle).lineSpacing) {
    obj.setLineSpacing(5);
  }
}

export function addBBCodeTextObject(scene: Phaser.Scene, x: number, y: number, content: string, style: TextStyle, extraStyleOptions?: Phaser.Types.GameObjects.Text.TextStyle): BBCodeText {
  const [ scale, styleOptions, shadowColor, shadowXpos, shadowYpos ] = getTextStyleOptions(style, (scene as BattleScene).uiTheme, extraStyleOptions);

  const ret = new BBCodeText(scene, x, y, content, styleOptions as BBCodeText.TextStyle);
  scene.add.existing(ret);
  ret.setScale(scale);
  ret.setShadow(shadowXpos, shadowYpos, shadowColor);
  if (!(styleOptions as BBCodeText.TextStyle).lineSpacing) {
    ret.setLineSpacing(10);
  }

  return ret;
}

export function addTextInputObject(scene: Phaser.Scene, x: number, y: number, width: number, height: number, style: TextStyle, extraStyleOptions?: InputText.IConfig): InputText {
  const [ scale, styleOptions ] = getTextStyleOptions(style, (scene as BattleScene).uiTheme, extraStyleOptions);

  const ret = new InputText(scene, x, y, width, height, styleOptions as InputText.IConfig);
  scene.add.existing(ret);
  ret.setScale(scale);

  return ret;
}

function getTextStyleOptions(style: TextStyle, uiTheme: UiTheme, extraStyleOptions?: Phaser.Types.GameObjects.Text.TextStyle): [ number, Phaser.Types.GameObjects.Text.TextStyle | InputText.IConfig, string, number, number ] {
  let shadowXpos = 4;
  let shadowYpos = 5;
  const scale = 0.1666666667;
  const defaultFontSize = 96;

  let styleOptions: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: "emerald, unifont",
    fontSize: 96,
    color: getTextColor(style, false, uiTheme),
    padding: {
      bottom: 6
    }
  };

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
  case TextStyle.STATS_VALUE:
    shadowXpos = 3;
    shadowYpos = 3;
    break;
  case TextStyle.STATS_LABEL:
  case TextStyle.MESSAGE:
  case TextStyle.SETTINGS_LABEL:
  case TextStyle.SETTINGS_LOCKED:
  case TextStyle.SETTINGS_SELECTED:
    break;
  case TextStyle.BATTLE_INFO:
  case TextStyle.MONEY:
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
  }

  const shadowColor = getTextColor(style, true, uiTheme);

  if (extraStyleOptions) {
    if (extraStyleOptions.fontSize) {
      const sizeRatio = parseInt(extraStyleOptions.fontSize.toString().slice(0, -2)) / parseInt(styleOptions.fontSize.toString().slice(0, -2));
      shadowXpos *= sizeRatio;
    }
    styleOptions = Object.assign(styleOptions, extraStyleOptions);
  }

  return [ scale, styleOptions, shadowColor, shadowXpos, shadowYpos ];
}

export function getBBCodeFrag(content: string, textStyle: TextStyle, uiTheme: UiTheme = UiTheme.DEFAULT): string {
  return `[color=${getTextColor(textStyle, false, uiTheme)}][shadow=${getTextColor(textStyle, true, uiTheme)}]${content}`;
}

export function getTextColor(textStyle: TextStyle, shadow?: boolean, uiTheme: UiTheme = UiTheme.DEFAULT): string {
  switch (textStyle) {
  case TextStyle.MESSAGE:
    return !shadow ? "#f8f8f8" : "#6b5a73";
  case TextStyle.WINDOW:
  case TextStyle.MOVE_INFO_CONTENT:
  case TextStyle.MOVE_PP_FULL:
  case TextStyle.TOOLTIP_CONTENT:
    if (uiTheme) {
      return !shadow ? "#484848" : "#d0d0c8";
    }
    return !shadow ? "#f8f8f8" : "#6b5a73";
  case TextStyle.MOVE_PP_HALF_FULL:
    if (uiTheme) {
      return !shadow ? "#a68e17" : "#ebd773";
    }
    return !shadow ? "#ccbe00" : "#6e672c";
  case TextStyle.MOVE_PP_NEAR_EMPTY:
    if (uiTheme) {
      return !shadow ? "#d64b00" : "#f7b18b";
    }
    return !shadow ? "#d64b00" : "#69402a";
  case TextStyle.MOVE_PP_EMPTY:
    if (uiTheme) {
      return !shadow ? "#e13d3d" : "#fca2a2";
    }
    return !shadow ? "#e13d3d" : "#632929";
  case TextStyle.WINDOW_ALT:
    return !shadow ? "#484848" : "#d0d0c8";
  case TextStyle.BATTLE_INFO:
    if (uiTheme) {
      return !shadow ? "#404040" : "#ded6b5";
    }
    return !shadow ? "#f8f8f8" : "#6b5a73";
  case TextStyle.PARTY:
    return !shadow ? "#f8f8f8" : "#707070";
  case TextStyle.PARTY_RED:
    return !shadow ? "#f89890" : "#984038";
  case TextStyle.SUMMARY:
    return !shadow ? "#ffffff" : "#636363";
  case TextStyle.SUMMARY_ALT:
    if (uiTheme) {
      return !shadow ? "#ffffff" : "#636363";
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
    return !shadow ? "#e8e8a8" : "#a0a060";
  case TextStyle.SETTINGS_LOCKED:
  case TextStyle.SUMMARY_GRAY:
    return !shadow ? "#a0a0a0" : "#636363";
  case TextStyle.STATS_LABEL:
    return !shadow ? "#f8b050" : "#c07800";
  case TextStyle.STATS_VALUE:
    return !shadow ? "#f8f8f8" : "#6b5a73";
  case TextStyle.SUMMARY_GREEN:
    return !shadow ? "#78c850" : "#306850";
  case TextStyle.SETTINGS_LABEL:
    return !shadow ? "#f8b050" : "#c07800";
  case TextStyle.SETTINGS_SELECTED:
    return !shadow ? "#f88880" : "#f83018";
  }
}

export function getModifierTierTextTint(tier: ModifierTier): integer {
  switch (tier) {
  case ModifierTier.COMMON:
    return 0xffffff;
  case ModifierTier.GREAT:
    return 0x3890f8;
  case ModifierTier.ULTRA:
    return 0xf8d038;
  case ModifierTier.ROGUE:
    return 0xd52929;
  case ModifierTier.MASTER:
    return 0xe020c0;
  case ModifierTier.LUXURY:
    return 0xe64a18;
  }
}

export function getEggTierTextTint(tier: EggTier): integer {
  switch (tier) {
  case EggTier.COMMON:
    return getModifierTierTextTint(ModifierTier.COMMON);
  case EggTier.GREAT:
    return getModifierTierTextTint(ModifierTier.GREAT);
  case EggTier.ULTRA:
    return getModifierTierTextTint(ModifierTier.ULTRA);
  case EggTier.MASTER:
    return getModifierTierTextTint(ModifierTier.MASTER);
  }
}
