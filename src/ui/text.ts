export enum TextStyle {
  MESSAGE,
  WINDOW,
  BATTLE_INFO,
  PARTY,
  PARTY_RED,
  SUMMARY,
  SUMMARY_RED,
  SUMMARY_GOLD,
  MONEY,
  SETTINGS_LABEL,
  SETTINGS_SELECTED,
  TOOLTIP_TITLE,
  TOOLTIP_CONTENT
};

export function addTextObject(scene: Phaser.Scene, x: number, y: number, content: string, style: TextStyle, extraStyleOptions?: Phaser.Types.GameObjects.Text.TextStyle) {
  let shadowColor: string;
  let shadowSize = 6;

  let styleOptions: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: 'emerald',
    fontSize: '96px',
    color: getTextColor(style, false),
    padding: {
      bottom: 6
    }
  };

  switch (style) {
    case TextStyle.SUMMARY:
    case TextStyle.SUMMARY_RED:
    case TextStyle.SUMMARY_GOLD:
    case TextStyle.WINDOW:
    case TextStyle.MESSAGE:
    case TextStyle.SETTINGS_LABEL:
    case TextStyle.SETTINGS_SELECTED:
      styleOptions.fontSize = '96px';
      break;
    case TextStyle.BATTLE_INFO:
    case TextStyle.MONEY:
    case TextStyle.TOOLTIP_TITLE:
      styleOptions.fontSize = '72px';
      shadowSize = 4.5;
      break;
    case TextStyle.PARTY:
    case TextStyle.PARTY_RED:
      styleOptions.fontFamily = 'pkmnems';
      styleOptions.fontSize = '66px';
      break;
    case TextStyle.TOOLTIP_CONTENT:
      styleOptions.fontSize = '64px';
      shadowSize = 4;
      break;
  }

  shadowColor = getTextColor(style, true);

  if (extraStyleOptions) {
    if (extraStyleOptions.fontSize) {
      const sizeRatio = parseInt(extraStyleOptions.fontSize.toString().slice(0, -2)) / parseInt(styleOptions.fontSize.slice(0, -2));
      shadowSize *= sizeRatio;
    }
    styleOptions = Object.assign(styleOptions, extraStyleOptions);
  }

  const ret = scene.add.text(x, y, content, styleOptions);
  ret.setScale(0.1666666667);
  ret.setShadow(shadowSize, shadowSize, shadowColor);
  ret.setLineSpacing(5);

  return ret;
}

export function getTextColor(textStyle: TextStyle, shadow?: boolean) {
  switch (textStyle) {
    case TextStyle.MESSAGE:
      return !shadow ? '#f8f8f8' : '#6b5a73';
    case TextStyle.WINDOW:
    case TextStyle.TOOLTIP_CONTENT:
      return !shadow ? '#484848' : '#d0d0c8';
    case TextStyle.BATTLE_INFO:
      return !shadow ? '#404040' : '#ded6b5';
    case TextStyle.PARTY:
      return !shadow ? '#f8f8f8' : '#707070';
    case TextStyle.PARTY_RED:
      return !shadow ? '#f89890' : '#984038';
    case TextStyle.SUMMARY:
      return !shadow ? '#ffffff' : '#636363';
    case TextStyle.SUMMARY_RED:
    case TextStyle.TOOLTIP_TITLE:
      return !shadow ? '#f89890' : '#984038';
    case TextStyle.SUMMARY_GOLD:
    case TextStyle.MONEY:
      return !shadow ? '#e8e8a8' : '#a0a060'
    case TextStyle.SETTINGS_LABEL:
      return !shadow ? '#f8b050' : '#c07800';
    case TextStyle.SETTINGS_SELECTED:
      return !shadow ? '#f88880' : '#f83018';
  }
}

export function getModifierTierTextTint(tier: integer): integer {
  console.log(tier);
  switch (tier) {
    case 0: // ModifierTier.COMMON:
      return 0xffffff;
    case 1: // ModifierTier.GREAT:
      return 0x3890f8;
    case 2: // ModifierTier.ULTRA:
      return 0xf8d038
    case 3: // ModifierTier.MASTER:
      return 0xe020c0;
    case 4: // ModifierTier.LUXURY:
      return 0xe64a18;
  }
}