
import { HiddenAbilityRateBoosterModifier, ShinyRateBoosterModifier } from "./modifier";
import { ModifierType } from "./modifier-type";

export enum PointShopModifierCategories {
  DEFAULT
}

export const PointShopModifierTypes: PointShopModifierType[][] = new Array(Object.keys(PointShopModifierCategories).length / 2).fill(new Array());

interface PointShopModifierType extends ModifierType {
  id: string,
  name: string,
  description: string,
  iconImage: string,
  cost: number,
  active: boolean,

  secret: boolean,
  hasParent: boolean,
  parentId: string,
}

export class ShinyRateBoosterPointShopModifierType extends ModifierType implements PointShopModifierType {
  private static _instance: ShinyRateBoosterPointShopModifierType;
  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  public description: string;
  public cost: number = 1500;
  public active: boolean;

  public secret: boolean;
  public hasParent: boolean;
  public parentId: string;


  private constructor() {
    super("modifierType:ModifierType.SHINY_CHARM", "shiny_charm", (type, _args) => new ShinyRateBoosterModifier(type));
  }
}
PointShopModifierTypes[PointShopModifierCategories.DEFAULT].push(ShinyRateBoosterPointShopModifierType.instance);

export class HiddenAbilityRateBoosterPointShopModifierType extends ModifierType implements PointShopModifierType {
  private static _instance: HiddenAbilityRateBoosterPointShopModifierType;
  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  public description: string;
  public cost: number = 1000;
  public active: boolean;

  public secret: boolean;
  public hasParent: boolean;
  public parentId: string;


  private constructor() {
    super("modifierType:ModifierType.ABILITY_CHARM", "ability_charm", (type, _args) => new HiddenAbilityRateBoosterModifier(type));
  }
}
PointShopModifierTypes[PointShopModifierCategories.DEFAULT].push(HiddenAbilityRateBoosterPointShopModifierType.instance);
PointShopModifierTypes[PointShopModifierCategories.DEFAULT].push(HiddenAbilityRateBoosterPointShopModifierType.instance);
PointShopModifierTypes[PointShopModifierCategories.DEFAULT].push(ShinyRateBoosterPointShopModifierType.instance);
PointShopModifierTypes[PointShopModifierCategories.DEFAULT].push(HiddenAbilityRateBoosterPointShopModifierType.instance);
PointShopModifierTypes[PointShopModifierCategories.DEFAULT].push(HiddenAbilityRateBoosterPointShopModifierType.instance);
PointShopModifierTypes[PointShopModifierCategories.DEFAULT].push(HiddenAbilityRateBoosterPointShopModifierType.instance);
PointShopModifierTypes[PointShopModifierCategories.DEFAULT].push(ShinyRateBoosterPointShopModifierType.instance);
PointShopModifierTypes[PointShopModifierCategories.DEFAULT].push(HiddenAbilityRateBoosterPointShopModifierType.instance);
PointShopModifierTypes[PointShopModifierCategories.DEFAULT].push(HiddenAbilityRateBoosterPointShopModifierType.instance);
PointShopModifierTypes[PointShopModifierCategories.DEFAULT].push(ShinyRateBoosterPointShopModifierType.instance);
PointShopModifierTypes[PointShopModifierCategories.DEFAULT].push(HiddenAbilityRateBoosterPointShopModifierType.instance);
PointShopModifierTypes[PointShopModifierCategories.DEFAULT].push(ShinyRateBoosterPointShopModifierType.instance);
PointShopModifierTypes[PointShopModifierCategories.DEFAULT].push(HiddenAbilityRateBoosterPointShopModifierType.instance);
PointShopModifierTypes[PointShopModifierCategories.DEFAULT].push(HiddenAbilityRateBoosterPointShopModifierType.instance);
PointShopModifierTypes[PointShopModifierCategories.DEFAULT].push(HiddenAbilityRateBoosterPointShopModifierType.instance);

