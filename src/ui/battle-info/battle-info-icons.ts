import { globalScene } from "#app/global-scene";

export interface BattleIconParams {
  /** The texture to use */
  texture: string;
  /** The scale to use*/
  scale?: number;
  /** Whether the icon is interactive */
  interactive?: boolean;
}

export interface BattleIcon extends Phaser.GameObjects.Sprite {}

export function newBattleIcon({ texture, scale = 0.5 }: BattleIconParams) {
  const icon = globalScene.add.sprite(0, 0, texture).setOrigin(0, 0).setVisible(false).setScale(scale);
  icon.setOrigin(0.5, 0.5);
  icon.setScale(1.5, 1.5);
  icon.setPositionRelative(globalScene, 0, 0);
  return icon;
}
