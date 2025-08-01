import { globalScene } from "#app/global-scene";
import { BattlerIndex } from "#enums/battler-index";

export enum FieldPosition {
  CENTER,
  LEFT,
  RIGHT
}

/**
 * Convert a {@linkcode BattlerIndex} into a field position.
 * @param index - The {@linkcode BattlerIndex} to convert
 * @returns The resultant field position.
 */
export function battlerIndexToFieldPosition(index: BattlerIndex): FieldPosition {
  let pos: FieldPosition;
  switch (index) {
    case BattlerIndex.ATTACKER:
      throw new Error("Cannot convert BattlerIndex.ATTACKER to a field position!")
    case BattlerIndex.PLAYER:
    case BattlerIndex.ENEMY:
      pos = FieldPosition.LEFT;
      break;
    case BattlerIndex.PLAYER_2:
    case BattlerIndex.ENEMY_2:
      pos = FieldPosition.RIGHT;
      break;
  }
  // In single battles, left positions become center
  if (!globalScene.currentBattle.double && pos === FieldPosition.LEFT) {
    pos = FieldPosition.CENTER
  }
  return pos;
}