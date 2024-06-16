import * as Utils from "../../utils";
import BattleScene from "#app/battle-scene.js";
import { getBiomeName } from "#app/data/biomes";
import { GameModes } from "#app/game-mode.js";
import { achvs } from "#app/system/achv.js";
import { Biome } from "#enums/biome";
import { ExpBalanceModifier, ExpBoosterModifier, ExpShareModifier, ExtraModifierModifier, HealingBoosterModifier, HiddenAbilityRateBoosterModifier, IvScannerModifier, LockModifierTiersModifier, MapModifier, Modifier, MoneyInterestModifier, MoneyMultiplierModifier, MoneyRewardModifier, PreserveBerryModifier, ShinyRateBoosterModifier } from "../../modifier/modifier";
import { ModifierType } from "../../modifier/modifier-type";
import { PointShopModifierType, PointShopModifierOption, Requirements, pushPointShopModifierType, PointShopModifierCategory } from "./point-shop-modifier-type";

function passesAchievement(requirements: Requirements, battleScene: BattleScene): boolean {
  if (requirements.achievement) {
    const unlockedKeys = Object.keys(battleScene.gameData.achvUnlocks);

    return unlockedKeys.some(key => achvs[key].id === requirements.achievement);
  }

  return true;
}
function passesGameModes(requirements: Requirements, battleScene: BattleScene): boolean {
  return battleScene.gameMode.modeId === (requirements.gameModes & battleScene.gameMode.modeId);
}
function meetsRequirements(requirements: Requirements, battleScene: BattleScene): boolean {
  return passesGameModes(requirements, battleScene) && passesAchievement(requirements, battleScene);
}

type NewModifierFunc = (type: ModifierType, args: any[]) => Modifier;
export class AbstractPointShopModifierType extends ModifierType implements PointShopModifierType {
  public description: string;
  public cost: number;

  protected _active: boolean = false;
  public get active(): boolean {
    return this._active;
  }
  protected set active(value: boolean) {
    this._active = value;
  }

  public achievement: string;
  public gameModes: GameModes = GameModes.ANY;

  public isSecret: boolean = false;

  public battleScene: BattleScene;

  protected constructor(localeKey: string, iconImage: string, newModifierFunc: NewModifierFunc, group?: string, soundName?: string) {
    super(localeKey, iconImage, newModifierFunc, group, soundName);
  }

  public init(battleScene: BattleScene) {
    this.battleScene = battleScene;
  }

  protected passesAchievement(): boolean {
    return passesAchievement(this, this.battleScene);
  }
  protected passesGameModes(): boolean {
    return passesGameModes(this, this.battleScene);
  }
  public meetsRequirements(): boolean {
    return this.passesGameModes() && this.passesAchievement();
  }

  public trySetActive(value: boolean = true): boolean {
    if (!this.meetsRequirements()) {
      return false;
    }

    this.active = value;
    return true;
  }

  public tryToggleActive(): boolean {
    return this.trySetActive(!this.active);
  }

  getDescription(scene: BattleScene): string {
    if (!this.meetsRequirements()) {
      let achievementString = "";
      if (!this.passesAchievement()) {
        achievementString = "Missing achievement \n\"" + Utils.toReadableString(this.achievement) + "\".\n";
      }

      let gameModeString = "";

      const gameModes = Object.values(GameModes).filter(value => value !== GameModes.ANY).filter(value => this.gameModes & value as GameModes);
      if (!this.passesGameModes() && gameModes.length) {
        gameModeString += "Can only be used in ";
        gameModes.forEach ((value, i) => {
          const aggrigator = i < gameModes.length - 2 ? ", " : " and ";
          gameModeString += Utils.toReadableString(GameModes[value]) + (i < gameModes.length - 1 ?  aggrigator : " mode.");
        });
      }

      return achievementString + gameModeString;
    }

    if (this.description) {
      return this.description;
    }

    return super.getDescription(scene);
  }
}

export class AbstractPointShopModifierOption implements PointShopModifierOption {
  public name: string;
  public value: string|number;
  public cost: number;
  public active: boolean = false;

  public achievement: string;
  public gameModes: GameModes = GameModes.ANY;

  public isSecret: boolean = false;

  public battleScene: BattleScene;

  protected constructor(init?:Partial<AbstractPointShopModifierOption>) {
    Object.assign(this, init);
  }

  public trySetActive(value: boolean = true): boolean {
    if (meetsRequirements(this, this.battleScene)) {
      return false;
    }

    this.active = value;
    return true;
  }

  public tryToggleActive(): boolean {
    return this.trySetActive(!this.active);
  }
}
export class PointShopModifierOptionString extends AbstractPointShopModifierOption {
  public override value: string;

  public constructor(init?:Partial<PointShopModifierOptionString>) {
    super(init);
  }
}
export class PointShopModifierOptionNumber extends AbstractPointShopModifierOption {
  public override value: number;

  public constructor(init?:Partial<PointShopModifierOptionNumber>) {
    super(init);
  }
}

type NewModifierOptionFunc = (option: any) => Modifier;
export class AbstractMultiPointShopModifierType extends AbstractPointShopModifierType implements PointShopModifierType {
  public modifierOptions: AbstractPointShopModifierOption[];

  public multiSelect = false;

  public override get active() {
    return this.modifierOptions.some(option => option.active);
  }

  protected constructor(localeKey: string, iconImage: string, newModifierFunc: NewModifierOptionFunc, group?: string, soundName?: string) {
    super(
      localeKey,
      iconImage,
      (_type, _args) => {
        if (this.multiSelect) {
          let value = 0;
          this.modifierOptions.forEach(option => {
            if (option.active) {
              value += option.value as number;
            }
          });

          return newModifierFunc(value);
        }

        const activeOption = this.modifierOptions.find(option => option.active);
        if (!activeOption) {
          return undefined;
        }

        return newModifierFunc(activeOption.value);
      },
      group,
      soundName);
  }

  public init(battleScene: BattleScene): void {
    super.init(battleScene);

    this.modifierOptions.forEach(option => option.battleScene = this.battleScene);
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

export class ExpCharmPointShopModifierType extends AbstractMultiPointShopModifierType implements PointShopModifierType {
  private static _instance: MoneyMultiplierPointShopModifierType;
  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  protected constructor() {
    super("modifierType:ModifierType.GOLDEN_EXP_CHARM", "golden_exp_charm", (option) => new ExpBoosterModifier(this, option));

    this.multiSelect = true;

    this.modifierOptions = [
      new PointShopModifierOptionNumber({name: "25%",  value: 25,  cost: 50}),
      new PointShopModifierOptionNumber({name: "50%",  value: 50,  cost: 100}),
      new PointShopModifierOptionNumber({name: "100%", value: 100, cost: 200}),
    ];

    this.cost = this.modifierOptions[0].cost;
    this.description = "Increases EXP earned by the chosen amounts";
  }
}

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

export class MoneyStartPointShopModifierType extends AbstractMultiPointShopModifierType implements PointShopModifierType {
  private static _instance: MoneyStartPointShopModifierType;
  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  protected constructor() {
    super("modifierType:ModifierType.RELIC_GOLD", "relic_gold", (option) => new MoneyRewardModifier(this, option));

    this.multiSelect = true;

    this.modifierOptions = [
      new PointShopModifierOptionNumber({name: "1000",  value: 1,  cost: 50}),
      new PointShopModifierOptionNumber({name: "2500",  value: 2.5,  cost: 250}),
      new PointShopModifierOptionNumber({name: "5000",  value: 5,  cost: 500}),
      new PointShopModifierOptionNumber({name: "10000", value: 10, cost: 1000}),
    ];

    this.cost = this.modifierOptions[0].cost;
    this.description = "Increases starting money by the chosen amounts";
  }
}

export class ShinyRateBoosterPointShopModifierType extends AbstractPointShopModifierType implements PointShopModifierType {
  private static _instance: ShinyRateBoosterPointShopModifierType;
  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  public achievement: string = "Don't Have This";
  public gameModes: GameModes = GameModes.ENDLESS | GameModes.CHALLENGE | GameModes.DAILY;

  protected constructor() {
    super("modifierType:ModifierType.SHINY_CHARM", "shiny_charm", (type, _args) => new ShinyRateBoosterModifier(type));

    this.cost = 1500;
  }
}

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

export class BiomeStartShopModifierType extends AbstractMultiPointShopModifierType implements PointShopModifierType {
  private static _instance: BiomeStartShopModifierType;
  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  public modifierTypes: PointShopModifierOption[] = new Array();

  protected constructor() {
    super("modifierType:ModifierType.MAP", "map", (option) => undefined);

    this.modifierOptions = new Array();
    Object.values(Biome).filter(key => isNaN(Number(Biome[key]))).forEach(biome => {
      this.modifierOptions.push(new PointShopModifierOptionNumber({name: getBiomeName(biome as Biome), value: biome as Biome,  cost: 100}));
    });

    this.cost = this.modifierOptions[0].cost;
    this.description = "Starts the new run in the selected Biome";
  }
}

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

export function initPointShopModifierTypes() {
  pushPointShopModifierType(PointShopModifierCategory.DEFAULT, ExpSharePointShopModifierType.instance);
  pushPointShopModifierType(PointShopModifierCategory.DEFAULT, ExpBalancePointShopModifierType.instance);
  pushPointShopModifierType(PointShopModifierCategory.DEFAULT, ExpCharmPointShopModifierType.instance);

  pushPointShopModifierType(PointShopModifierCategory.DEFAULT, MoneyMultiplierPointShopModifierType.instance);
  pushPointShopModifierType(PointShopModifierCategory.DEFAULT, MoneyInterestPointShopModifierType.instance);
  pushPointShopModifierType(PointShopModifierCategory.DEFAULT, MoneyStartPointShopModifierType.instance);

  pushPointShopModifierType(PointShopModifierCategory.DEFAULT, ShinyRateBoosterPointShopModifierType.instance);
  pushPointShopModifierType(PointShopModifierCategory.DEFAULT, HiddenAbilityRateBoosterPointShopModifierType.instance);

  pushPointShopModifierType(PointShopModifierCategory.UTILITY, MapPointShopModifierType.instance);
  pushPointShopModifierType(PointShopModifierCategory.UTILITY, BiomeStartShopModifierType.instance);

  pushPointShopModifierType(PointShopModifierCategory.UTILITY, IvScannerPointShopModifierType.instance);

  pushPointShopModifierType(PointShopModifierCategory.UTILITY, ExtraModifierPointShopModifierType.instance);
  pushPointShopModifierType(PointShopModifierCategory.UTILITY, LockModifierTierPointShopModifierType.instance);

  pushPointShopModifierType(PointShopModifierCategory.BATTLE_ITEM, HealingBoosterPointShopModifierType.instance);
  pushPointShopModifierType(PointShopModifierCategory.BATTLE_ITEM, PreserveBerryPointShopModifierType.instance);
}
