import { ModifierTier } from "../modifier/modifier-type";

export const EGG_SEED = 1073741824;

export enum GachaType {
  LEGENDARY,
  TYPE,
  SHINY
}

export class Egg {
  public id: integer;
  public tier: ModifierTier;
  public gachaType: GachaType;
  public timestamp: integer;

  constructor(id: integer, gachaType: GachaType, timestamp: integer) {
    this.id = id;
    this.tier = Math.floor(id / EGG_SEED);
    this.gachaType = gachaType;
    this.timestamp = timestamp;
  }
}