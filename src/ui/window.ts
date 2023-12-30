import BattleScene from "../battle-scene";

export enum WindowVariant {
  NORMAL,
  THIN,
  XTHIN
}

export function getWindowVariantSuffix(windowVariant: WindowVariant): string {
  switch (windowVariant) {
    case WindowVariant.THIN:
      return '_thin';
    case WindowVariant.XTHIN:
      return '_xthin';
    default:
      return '';
  }
}

const windowTypeControlColors = {
  0: [ '#706880', '#8888c8', '#484868' ],
  1: [ '#d04028', '#e0a028', '#902008' ],
  2: [ '#48b840', '#88d880', '#089040' ],
  3: [ '#2068d0', '#80b0e0', '#104888' ]
};

export function addWindow(scene: BattleScene, x: number, y: number, width: number, height: number, mergeMaskTop?: boolean, mergeMaskLeft?: boolean, maskOffsetX?: number, maskOffsetY?: number, windowVariant?: WindowVariant): Phaser.GameObjects.NineSlice {
  if (windowVariant === undefined)
    windowVariant = WindowVariant.NORMAL;
    
  const window = scene.add.nineslice(x, y, `window_${scene.windowType}${getWindowVariantSuffix(windowVariant)}`, null, width, height, 6, 6, 6, 6);
  window.setOrigin(0, 0);

  if (mergeMaskTop || mergeMaskLeft) {
    const maskRect = scene.make.graphics({});
    maskRect.setScale(6);
    maskRect.fillStyle(0xFFFFFF);
    maskRect.beginPath();
    maskRect.fillRect(window.x + (mergeMaskLeft ? 2 : 0) + (maskOffsetX || 0), window.y + (mergeMaskTop ? 2 : 0) + (maskOffsetY || 0), window.width - (mergeMaskLeft ? 2 : 0), window.height - (mergeMaskTop ? 2 : 0));
    window.setMask(maskRect.createGeometryMask());
  }

  return window;
}

export function updateWindowType(scene: BattleScene, windowTypeIndex: integer): void {
  const windowObjects: [Phaser.GameObjects.NineSlice, WindowVariant][] = [];
  const traverse = (object: any) => {
    if (object.hasOwnProperty('children')) {
      const children = object.children as Phaser.GameObjects.DisplayList;
      for (let child of children.getAll())
        traverse(child);
    } else if (object instanceof Phaser.GameObjects.Container) {
      for (let child of object.getAll())
        traverse(child);
    } else if (object instanceof Phaser.GameObjects.NineSlice) {
      if (object.texture.key.startsWith('window_'))
        windowObjects.push([ object, object.texture.key.endsWith(getWindowVariantSuffix(WindowVariant.XTHIN)) ? WindowVariant.XTHIN : object.texture.key.endsWith(getWindowVariantSuffix(WindowVariant.THIN)) ? WindowVariant.THIN : WindowVariant.NORMAL ]);
    }
  }

  traverse(scene);

  scene.windowType = windowTypeIndex;

  const rootStyle = document.documentElement.style;
  [ 'base', 'light', 'dark' ].map((k, i) => rootStyle.setProperty(`--color-${k}`, windowTypeControlColors[windowTypeIndex - 1][i]));

  const windowKey = `window_${windowTypeIndex}`;

  for (let [ window, variant ] of windowObjects)
    window.setTexture(`${windowKey}${getWindowVariantSuffix(variant)}`);
}