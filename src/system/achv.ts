import { Modifier } from "typescript";
import BattleScene from "../battle-scene";
import { TurnHeldItemTransferModifier } from "../modifier/modifier";
import i18next from '../plugins/i18n';
import * as Utils from "../utils";

export enum AchvTier {
  COMMON,
  GREAT,
  ULTRA,
  ROGUE,
  MASTER
}

export class Achv {
  public id: string;
  public name: string;
  public description: string;
  public iconImage: string;
  public score: integer;

  public secret: boolean;
  public hasParent: boolean;
  public parentId: string;

  private conditionFunc: (scene: BattleScene, args: any[]) => boolean;

  constructor(name: string, description: string, iconImage: string, score: integer, conditionFunc?: (scene: BattleScene, args: any[]) => boolean) {
    this.name = name;
    this.description = description;
    this.iconImage = iconImage;
    this.score = score;
    this.conditionFunc = conditionFunc;
  }

  getName(): string {
    return this.name;
  }

  getIconImage(): string {
    return this.iconImage;
  }

  setSecret(hasParent?: boolean): this {
    this.secret = true;
    this.hasParent = !!hasParent;
    return this;
  }

  validate(scene: BattleScene, args: any[]): boolean {
    return !this.conditionFunc || this.conditionFunc(scene, args);
  }

  getTier(): AchvTier {
    if (this.score >= 100)
      return AchvTier.MASTER;
    if (this.score >= 75)
      return AchvTier.ROGUE;
    if (this.score >= 50)
      return AchvTier.ULTRA;
    if (this.score >= 25)
      return AchvTier.GREAT;
    return AchvTier.COMMON;
  }
}

export class MoneyAchv extends Achv {
  private moneyAmount: integer;

  constructor(name: string, moneyAmount: integer, iconImage: string, score: integer) {
    super(name, i18next.t("achv:MoneyAchv.description", {"moneyAmount": moneyAmount.toLocaleString('en-US')}), iconImage, score, (scene: BattleScene, _args: any[]) => scene.money >= this.moneyAmount);

    this.moneyAmount = moneyAmount;
  }
}

export class RibbonAchv extends Achv {
  private ribbonAmount: integer;

  constructor(name: string, ribbonAmount: integer, iconImage: string, score: integer) {
    super(name, i18next.t("achv:RibbonAchv.description", {"ribbonAmount": ribbonAmount.toLocaleString('en-US')}), iconImage, score, (scene: BattleScene, _args: any[]) => scene.gameData.gameStats.ribbonsOwned >= this.ribbonAmount);

    this.ribbonAmount = ribbonAmount;
  }
}

export class DamageAchv extends Achv {
  private damageAmount: integer;

  constructor(name: string, damageAmount: integer, iconImage: string, score: integer) {
    super(name, i18next.t("achv:DamageAchv.description", {"damageAmount": damageAmount.toLocaleString('en-US')}), iconImage, score, (_scene: BattleScene, args: any[]) => (args[0] as Utils.NumberHolder).value >= this.damageAmount);

    this.damageAmount = damageAmount;
  }
}

export class HealAchv extends Achv {
  private healAmount: integer;

  constructor(name: string, healAmount: integer, iconImage: string, score: integer) {
    super(name, i18next.t("achv:HealAchv.description", {"healAmount": healAmount.toLocaleString('en-US')}), iconImage, score, (_scene: BattleScene, args: any[]) => (args[0] as Utils.NumberHolder).value >= this.healAmount);

    this.healAmount = healAmount;
  }
}

export class LevelAchv extends Achv {
  private level: integer;

  constructor(name: string, level: integer, iconImage: string, score: integer) {
    super(name, i18next.t("achv:LevelAchv.description", {"level": level}), iconImage, score, (scene: BattleScene, args: any[]) => (args[0] as Utils.IntegerHolder).value >= this.level);

    this.level = level;
  }
}

export class ModifierAchv extends Achv {
  constructor(name: string, description: string, iconImage: string, score: integer, modifierFunc: (modifier: Modifier) => boolean) {
    super(name, description, iconImage, score, (_scene: BattleScene, args: any[]) => modifierFunc((args[0] as Modifier)));
  }
}

export const achvs = {
  _10K_MONEY: new MoneyAchv(i18next.t("achv:10K_MONEY.name"), 10000, 'nugget', 10),
  _100K_MONEY: new MoneyAchv(i18next.t("achv:100K_MONEY.name"), 100000, 'big_nugget', 25).setSecret(true),
  _1M_MONEY: new MoneyAchv(i18next.t("achv:1M_MONEY.name"), 1000000, 'relic_gold', 50).setSecret(true),
  _10M_MONEY: new MoneyAchv(i18next.t("achv:10M_MONEY.name"), 10000000, 'coin_case', 100).setSecret(true),
  _250_DMG: new DamageAchv(i18next.t("achv:250_DMG.name"), 250, 'lucky_punch', 10),
  _1000_DMG: new DamageAchv(i18next.t("achv:1000_DMG.name"), 1000, 'lucky_punch_great', 25).setSecret(true),
  _2500_DMG: new DamageAchv(i18next.t("achv:2500_DMG.name"), 2500, 'lucky_punch_ultra', 50).setSecret(true),
  _10000_DMG: new DamageAchv(i18next.t("achv:10000_DMG.name"), 10000, 'lucky_punch_master', 100).setSecret(true),
  _250_HEAL: new HealAchv(i18next.t("achv:250_HEAL.name"), 250, 'potion', 10),
  _1000_HEAL: new HealAchv(i18next.t("achv:1000_HEAL.name"), 1000, 'super_potion', 25).setSecret(true),
  _2500_HEAL: new HealAchv(i18next.t("achv:2500_HEAL.name"), 2500, 'hyper_potion', 50).setSecret(true),
  _10000_HEAL: new HealAchv(i18next.t("achv:10000_HEAL.name"), 10000, 'max_potion', 100).setSecret(true),
  LV_100: new LevelAchv(i18next.t("achv:LV_100.name"), 100, 'rare_candy', 25).setSecret(),
  LV_250: new LevelAchv(i18next.t("achv:LV_250.name"), 250, 'rarer_candy', 50).setSecret(true),
  LV_1000: new LevelAchv(i18next.t("achv:LV_1000.name"), 1000, 'candy_jar', 100).setSecret(true),
  _10_RIBBONS: new RibbonAchv(i18next.t("achv:10_RIBBONS.name"), 10, 'bronze_ribbon', 10),
  _25_RIBBONS: new RibbonAchv(i18next.t("achv:25_RIBBONS.name"), 25, 'great_ribbon', 25).setSecret(true),
  _50_RIBBONS: new RibbonAchv(i18next.t("achv:50_RIBBONS.name"), 50, 'ultra_ribbon', 50).setSecret(true),
  _75_RIBBONS: new RibbonAchv(i18next.t("achv:75_RIBBONS.name"), 75, 'rogue_ribbon', 75).setSecret(true),
  _100_RIBBONS: new RibbonAchv(i18next.t("achv:100_RIBBONS.name"), 100, 'master_ribbon', 100).setSecret(true),
  TRANSFER_MAX_BATTLE_STAT: new Achv(i18next.t("achv:TRANSFER_MAX_BATTLE_STAT.name"), i18next.t("achv:TRANSFER_MAX_BATTLE_STAT.description"), 'stick', 20),
  MAX_FRIENDSHIP: new Achv(i18next.t("achv:MAX_FRIENDSHIP.name"), i18next.t("achv:MAX_FRIENDSHIP.description"), 'soothe_bell', 25),
  MEGA_EVOLVE: new Achv(i18next.t("achv:MEGA_EVOLVE.name"), i18next.t("achv:MEGA_EVOLVE.description"), 'mega_bracelet', 50),
  GIGANTAMAX: new Achv(i18next.t("achv:GIGANTAMAX.name"), i18next.t("achv:GIGANTAMAX.description"), 'dynamax_band', 50),
  TERASTALLIZE: new Achv(i18next.t("achv:TERASTALLIZE.name"), i18next.t("achv:TERASTALLIZE.description"), 'tera_orb', 25),
  STELLAR_TERASTALLIZE: new Achv(i18next.t("achv:STELLAR_TERASTALLIZE.name"), i18next.t("achv:STELLAR_TERASTALLIZE.description"), 'stellar_tera_shard', 25).setSecret(true),
  SPLICE: new Achv(i18next.t("achv:SPLICE.name"), i18next.t("achv:SPLICE.description"), 'dna_splicers', 10),
  MINI_BLACK_HOLE: new ModifierAchv(i18next.t("achv:MINI_BLACK_HOLE.name"), i18next.t("achv:MINI_BLACK_HOLE.description"), 'mini_black_hole', 25, modifier => modifier instanceof TurnHeldItemTransferModifier).setSecret(),
  CATCH_MYTHICAL: new Achv(i18next.t("achv:CATCH_MYTHICAL.name"), i18next.t("achv:CATCH_MYTHICAL.description"), 'strange_ball', 50).setSecret(),
  CATCH_SUB_LEGENDARY: new Achv(i18next.t("achv:CATCH_SUB_LEGENDARY.name"), i18next.t("achv:CATCH_SUB_LEGENDARY.description"), 'rb', 75).setSecret(),
  CATCH_LEGENDARY: new Achv(i18next.t("achv:CATCH_LEGENDARY.name"), i18next.t("achv:CATCH_LEGENDARY.description"), 'mb', 100).setSecret(),
  SEE_SHINY: new Achv(i18next.t("achv:SEE_SHINY.name"), i18next.t("achv:SEE_SHINY.description"), 'pb_gold', 75),
  SHINY_PARTY: new Achv(i18next.t("achv:SHINY_PARTY.name"), i18next.t("achv:SHINY_PARTY.description"), 'shiny_charm', 100).setSecret(true),
  HATCH_MYTHICAL: new Achv(i18next.t("achv:HATCH_MYTHICAL.name"), i18next.t("achv:HATCH_MYTHICAL.description"), 'pair_of_tickets', 75).setSecret(),
  HATCH_SUB_LEGENDARY: new Achv(i18next.t("achv:HATCH_SUB_LEGENDARY.name"), i18next.t("achv:HATCH_SUB_LEGENDARY.description"), 'mystic_ticket', 100).setSecret(),
  HATCH_LEGENDARY: new Achv(i18next.t("achv:HATCH_LEGENDARY.name"), i18next.t("achv:HATCH_LEGENDARY.description"), 'mystic_ticket', 125).setSecret(),
  HATCH_SHINY: new Achv(i18next.t("achv:HATCH_SHINY.name"), i18next.t("achv:HATCH_SHINY.description"), 'golden_mystic_ticket', 100).setSecret(),
  HIDDEN_ABILITY: new Achv(i18next.t("achv:HIDDEN_ABILITY.name"), i18next.t("achv:HIDDEN_ABILITY.description"), 'ability_charm', 75),
  PERFECT_IVS: new Achv(i18next.t("achv:PERFECT_IVS.name"), i18next.t("achv:PERFECT_IVS.description"), 'blunder_policy', 100),
  CLASSIC_VICTORY: new Achv(i18next.t("achv:CLASSIC_VICTORY.name"), i18next.t("achv:CLASSIC_VICTORY.description"), 'relic_crown', 150),
};

{
  (function() {
    const achvKeys = Object.keys(achvs);
    achvKeys.forEach((a: string, i: integer) => {
      achvs[a].id = a;
      if (achvs[a].hasParent)
        achvs[a].parentId = achvKeys[i - 1];
    });
  })();
}