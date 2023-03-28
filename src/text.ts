export enum TextStyle {
  MESSAGE,
  WINDOW,
  PARTY
};

export function addTextObject(scene: Phaser.Scene, x: number, y: number, content: string, style: TextStyle, extraStyleOptions?: Phaser.Types.GameObjects.Text.TextStyle) {
  let styleOptions;
  let shadowColor;

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
  }

  if (extraStyleOptions)
    styleOptions = Object.assign(styleOptions, extraStyleOptions);

  const ret = scene.add.text(x, y, content, styleOptions);
  ret.setScale(0.1666666667);
  ret.setShadow(6, 6, shadowColor);
  ret.setLineSpacing(5);

  return ret;
}