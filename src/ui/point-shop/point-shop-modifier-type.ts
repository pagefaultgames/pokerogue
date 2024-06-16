import BattleScene from "#app/battle-scene.js";
import { Modifier } from "#app/modifier/modifier.js";
import { GameModes } from "#app/game-mode.js";

export enum PointShopModifierCategory {
  DEFAULT,
  UTILITY,
  BATTLE_ITEM
}

export enum PointShopModifierTier {
  TIER_I,
  TIER_II,
  TIER_III,
  TIER_IV
}

export interface Requirements {
  achievement: string;
  gameModes: GameModes;

  isSecret: boolean;
}

export interface PointShopModifierType extends Requirements {
  id: string;
  name: string;
  description: string;
  iconImage: string;
  cost: number;
  readonly active: boolean;

  init(battleScene: BattleScene);

  getDescription(scene: Phaser.Scene): string;
  newModifier(...args: any[]): Modifier;

  trySetActive(value: boolean): boolean;
  tryToggleActive(): boolean;

  meetsRequirements(): boolean;
}

export interface PointShopModifierOption extends Requirements {
  name: string;
  value: number | string;
  cost: number;
  active?: boolean;
}

export const PointShopModifierTypes: PointShopModifierType[][] =
  Array.from({ length: (Object.keys(PointShopModifierCategory).length / 2) }, () => Array(0));

export function pushPointShopModifierType(category: PointShopModifierCategory, modifier: PointShopModifierType) {
  if (!modifier.isSecret || (modifier.isSecret && modifier.meetsRequirements())) {
    PointShopModifierTypes[category].push(modifier);
  }
}

