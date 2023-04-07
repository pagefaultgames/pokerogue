export enum TextStyle {
  MESSAGE,
  WINDOW,
  BATTLE_INFO,
  PARTY,
  SUMMARY,
  SUMMARY_RED
};

export function addTextObject(scene: Phaser.Scene, x: number, y: number, content: string, style: TextStyle, extraStyleOptions?: Phaser.Types.GameObjects.Text.TextStyle) {
  let styleOptions;
  let shadowColor;
  let shadowSize = 6;

  switch (style) {
    case TextStyle.WINDOW:
      styleOptions = {
        fontFamily: 'emerald',
        fontSize: '96px',
        color: '#484848',
        padding: {
          bottom: 6
        }
      };
      shadowColor = '#d0d0c8';
      break;
    case TextStyle.MESSAGE:
      styleOptions = {
        fontFamily: 'emerald',
        fontSize: '96px',
        color: '#f8f8f8',
        padding: {
          bottom: 6
        }
      };
      shadowColor = '#6b5a73';
      break;
    case TextStyle.BATTLE_INFO:
      styleOptions = {
        fontFamily: 'emerald',
        fontSize: '72px',
        color: '#404040'
      };
      shadowColor = '#ded6b5';
      shadowSize = 4;
      break;
    case TextStyle.PARTY:
      styleOptions = {
        fontFamily: 'pkmnems',
        fontSize: '66px',
        color: '#f8f8f8',
        padding: {
          bottom: 6
        }
      };
      shadowColor = '#707070';
      break;
    case TextStyle.SUMMARY:
      styleOptions = {
        fontFamily: 'emerald',
        fontSize: '96px',
        color: '#ffffff'
      };
      shadowColor = '#636363';
      break;
    case TextStyle.SUMMARY_RED:
      styleOptions = {
        fontFamily: 'emerald',
        fontSize: '96px',
        color: '#f4b4b0'
      };
      shadowColor = '#d06c6a';
      break;
  }

  if (extraStyleOptions)
    styleOptions = Object.assign(styleOptions, extraStyleOptions);

  const ret = scene.add.text(x, y, content, styleOptions);
  ret.setScale(0.1666666667);
  ret.setShadow(shadowSize, shadowSize, shadowColor);
  ret.setLineSpacing(5);

  return ret;
}