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

export enum PointShopModifierEvent {
  INIT_EVENT = "onInit",
  ACTIVE_CHANGED_EVENT = "onActiveChanged",
  ACTIVE_OPTION_CHANGED_EVENT = "onActiveOptionChanged",
}

export class ActiveChangedEvent extends Event {
  public value: boolean;
  public constructor(value: boolean) {
    super(PointShopModifierEvent.ACTIVE_CHANGED_EVENT);

    this.value = value;
  }
}
export class ActiveOptionChangedEvent extends Event {
  public index: number;
  public value: boolean;
  public constructor(index: number, value: boolean) {
    super(PointShopModifierEvent.ACTIVE_OPTION_CHANGED_EVENT);

    this.index = index;
    this.value = value;
  }
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

  eventTarget: EventTarget;

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

