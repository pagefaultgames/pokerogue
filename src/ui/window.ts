import BattleScene from "../battle-scene";

export function addWindow(scene: BattleScene, x: number, y: number, width: number, height: number, mergeMaskTop?: boolean, mergeMaskLeft?: boolean, maskOffsetX?: number, maskOffsetY?: number): Phaser.GameObjects.NineSlice {
  const window = scene.add.nineslice(x, y, `window_${scene.windowType}`, null, width, height, 8, 8, 8, 8);
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
  const windowObjects: Phaser.GameObjects.NineSlice[] = [];
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
        windowObjects.push(object);
    }
  }

  traverse(scene);

  scene.windowType = windowTypeIndex;

  const windowKey = `window_${windowTypeIndex}`;

  for (let window of windowObjects)
    window.setTexture(windowKey);
}