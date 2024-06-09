
import { getBiomeName } from "#app/data/biomes.js";
import { Biome } from "#app/data/enums/biome.js";
import { ExpBalanceModifier, ExpShareModifier, ExtraModifierModifier, HealingBoosterModifier, HiddenAbilityRateBoosterModifier, IvScannerModifier, LockModifierTiersModifier, MapModifier, Modifier, MoneyInterestModifier, MoneyMultiplierModifier, PreserveBerryModifier, ShinyRateBoosterModifier } from "./modifier";
import { ModifierType } from "./modifier-type";

export enum PointShopModifierCategories {
  DEFAULT,
  UTILITY,
  BATTLE_ITEM,
}

export const PointShopModifierTypes: PointShopModifierType[][] = Array.from({ length: (Object.keys(PointShopModifierCategories).length / 2) }, () => Array(0));

export interface PointShopModifierType extends ModifierType {
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

type NewModifierFunc = (type: ModifierType, args: any[]) => Modifier;
export class AbstractPointShopModifierType extends ModifierType implements PointShopModifierType {
  public description: string;
  public cost: number;
  public active: boolean;

  public secret: boolean;
  public hasParent: boolean;
  public parentId: string;

  protected constructor(localeKey: string, iconImage: string, newModifierFunc: NewModifierFunc, group?: string, soundName?: string) {
    super(localeKey, iconImage, newModifierFunc, group, soundName);
  }
}

export interface PointShopModifierOption {
  name: string,
  option: any,
  cost: number,
  active?: boolean,
}
export class AbstractMultiPointShopModifierType extends AbstractPointShopModifierType implements PointShopModifierType {
  public modifierOptions: PointShopModifierOption[];

  public multiSelect = false;

  protected constructor(localeKey: string, iconImage: string, group?: string, soundName?: string) {
    super(localeKey, iconImage, null, group, soundName);
  }
}

export class ExpSharePointShopModifierType extends AbstractPointShopModifierType implements PointShopModifierType {
  private static _instance: ExpSharePointShopModifierType;
  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  protected constructor() {
    super("modifierType:ModifierType.EXP_SHARE", "exp_share", (type, _args) => new ExpShareModifier(type));

    this.cost = 150;
  }
}
PointShopModifierTypes[PointShopModifierCategories.DEFAULT].push(ExpSharePointShopModifierType.instance);

export class ExpBalancePointShopModifierType extends AbstractPointShopModifierType implements PointShopModifierType {
  private static _instance: ExpBalancePointShopModifierType;
  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  protected constructor() {
    super("modifierType:ModifierType.EXP_BALANCE", "exp_balance", (type, _args) => new ExpBalanceModifier(type));

    this.cost = 50;
  }
}
PointShopModifierTypes[PointShopModifierCategories.DEFAULT].push(ExpBalancePointShopModifierType.instance);

export class ExpCharmPointShopModifierType extends AbstractMultiPointShopModifierType implements PointShopModifierType {
  private static _instance: MoneyMultiplierPointShopModifierType;
  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  protected constructor() {
    super("modifierType:ModifierType.GOLDEN_EXP_CHARM", "golden_exp_charm");

    this.multiSelect = true;

    this.modifierOptions = [
      {name: "25%",  option: 25,  cost: 50},
      {name: "50%",  option: 50,  cost: 100},
      {name: "100%", option: 100, cost: 200},
    ];

    this.cost = this.modifierOptions[0].cost;
    this.description = "Increases EXP earned by the chosen amounts";
  }
}
PointShopModifierTypes[PointShopModifierCategories.DEFAULT].push(ExpCharmPointShopModifierType.instance);

export class MoneyMultiplierPointShopModifierType extends AbstractPointShopModifierType implements PointShopModifierType {
  private static _instance: MoneyMultiplierPointShopModifierType;
  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  protected constructor() {
    super("modifierType:ModifierType.AMULET_COIN", "amulet_coin", (type, _args) => new MoneyMultiplierModifier(type));

    this.cost = 200;
  }
}
PointShopModifierTypes[PointShopModifierCategories.DEFAULT].push(MoneyMultiplierPointShopModifierType.instance);

export class MoneyInterestPointShopModifierType extends AbstractPointShopModifierType implements PointShopModifierType {
  private static _instance: MoneyInterestPointShopModifierType;
  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  protected constructor() {
    super("modifierType:ModifierType.COIN_CASE", "coin_case", (type, _args) => new MoneyInterestModifier(type));

    this.cost = 250;
  }
}
PointShopModifierTypes[PointShopModifierCategories.DEFAULT].push(MoneyInterestPointShopModifierType.instance);

export class MoneyStartPointShopModifierType extends AbstractMultiPointShopModifierType implements PointShopModifierType {
  private static _instance: MoneyStartPointShopModifierType;
  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  protected constructor() {
    super("modifierType:ModifierType.RELIC_GOLD", "relic_gold");

    this.multiSelect = true;

    this.modifierOptions = [
      {name: "1000",  option: 1000,  cost: 50},
      {name: "2500",  option: 2500,  cost: 250},
      {name: "5000",  option: 5000,  cost: 500},
      {name: "10000", option: 10000, cost: 500},
    ];

    this.cost = this.modifierOptions[0].cost;
    this.description = "Increases starting money by the chosen amounts";
  }
}
PointShopModifierTypes[PointShopModifierCategories.DEFAULT].push(MoneyStartPointShopModifierType.instance);

export class ShinyRateBoosterPointShopModifierType extends AbstractPointShopModifierType implements PointShopModifierType {
  private static _instance: ShinyRateBoosterPointShopModifierType;
  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  protected constructor() {
    super("modifierType:ModifierType.SHINY_CHARM", "shiny_charm", (type, _args) => new ShinyRateBoosterModifier(type));

    this.cost = 1500;
  }
}
PointShopModifierTypes[PointShopModifierCategories.DEFAULT].push(ShinyRateBoosterPointShopModifierType.instance);

export class HiddenAbilityRateBoosterPointShopModifierType extends AbstractPointShopModifierType implements PointShopModifierType {
  private static _instance: HiddenAbilityRateBoosterPointShopModifierType;
  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  protected constructor() {
    super("modifierType:ModifierType.ABILITY_CHARM", "ability_charm", (type, _args) => new HiddenAbilityRateBoosterModifier(type));

    this.cost = 1000;
  }
}
PointShopModifierTypes[PointShopModifierCategories.DEFAULT].push(HiddenAbilityRateBoosterPointShopModifierType.instance);

export class MapPointShopModifierType extends AbstractPointShopModifierType implements PointShopModifierType {
  private static _instance: MapPointShopModifierType;
  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  protected constructor() {
    super("modifierType:ModifierType.MAP", "map", (type, _args) => new MapModifier(type));

    this.cost = 50;
  }
}
PointShopModifierTypes[PointShopModifierCategories.UTILITY].push(MapPointShopModifierType.instance);

export class BiomeStartShopModifierType extends AbstractMultiPointShopModifierType implements PointShopModifierType {
  private static _instance: BiomeStartShopModifierType;
  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  public modifierTypes: PointShopModifierOption[] = new Array();

  protected constructor() {
    super("modifierType:ModifierType.MAP", "map");

    this.modifierOptions = new Array();
    Object.values(Biome).filter(key => isNaN(Number(Biome[key]))).forEach(biome => {
      this.modifierOptions.push({name: getBiomeName(biome as Biome), option: biome as Biome,  cost: 100});
    });

    this.cost = this.modifierOptions[0].cost;
    this.description = "Starts the new run in the selected Biome";
  }
}
PointShopModifierTypes[PointShopModifierCategories.UTILITY].push(BiomeStartShopModifierType.instance);

export class IvScannerPointShopModifierType extends AbstractPointShopModifierType implements PointShopModifierType {
  private static _instance: IvScannerPointShopModifierType;
  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  protected constructor() {
    super("modifierType:ModifierType.IV_SCANNER", "scanner", (type, _args) => new IvScannerModifier(type));

    this.cost = 50;
  }
}
PointShopModifierTypes[PointShopModifierCategories.UTILITY].push(IvScannerPointShopModifierType.instance);

export class ExtraModifierPointShopModifierType extends AbstractPointShopModifierType implements PointShopModifierType {
  private static _instance: ExtraModifierPointShopModifierType;
  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  protected constructor() {
    super("modifierType:ModifierType.GOLDEN_POKEBALL", "pb_gold", (type, _args) => new ExtraModifierModifier(type), null, "pb_bounce_1");

    this.cost = 1000;
  }
}
PointShopModifierTypes[PointShopModifierCategories.UTILITY].push(ExtraModifierPointShopModifierType.instance);

export class LockModifierTierPointShopModifierType extends AbstractPointShopModifierType implements PointShopModifierType {
  private static _instance: LockModifierTierPointShopModifierType;
  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  protected constructor() {
    super("modifierType:ModifierType.LOCK_CAPSULE", "lock_capsule", (type, _args) => new LockModifierTiersModifier(type));

    this.cost = 2000;
  }
}
PointShopModifierTypes[PointShopModifierCategories.UTILITY].push(LockModifierTierPointShopModifierType.instance);

export class HealingBoosterPointShopModifierType extends AbstractPointShopModifierType implements PointShopModifierType {
  private static _instance: HealingBoosterPointShopModifierType;
  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  protected constructor() {
    super("modifierType:ModifierType.HEALING_CHARM", "healing_charm", (type, _args) => new HealingBoosterModifier(type, 1.1));

    this.cost = 1000;
  }
}
PointShopModifierTypes[PointShopModifierCategories.BATTLE_ITEM].push(HealingBoosterPointShopModifierType.instance);

export class PreserveBerryPointShopModifierType extends AbstractPointShopModifierType implements PointShopModifierType {
  private static _instance: PreserveBerryPointShopModifierType;
  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  protected constructor() {
    super("modifierType:ModifierType.BERRY_POUCH", "berry_pouch", (type, _args) => new PreserveBerryModifier(type));

    this.cost = 1000;
  }
}
PointShopModifierTypes[PointShopModifierCategories.BATTLE_ITEM].push(PreserveBerryPointShopModifierType.instance);
