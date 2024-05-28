import { Modifier } from "typescript";
import BattleScene from "../battle-scene";
import { TurnHeldItemTransferModifier } from "../modifier/modifier";
import i18next from "../plugins/i18n";
import * as Utils from "../utils";

export enum AchvTier {
  COMMON,
  GREAT,
  ULTRA,
  ROGUE,
  MASTER
}

export class Achv {
  public localizationKey: string;
  public id: string;
  public name: string;
  public description: string;
  public iconImage: string;
  public score: integer;

  public secret: boolean;
  public hasParent: boolean;
  public parentId: string;

  private conditionFunc: (scene: BattleScene, args: any[]) => boolean;

  constructor(localizationKey:string, name: string, description: string, iconImage: string, score: integer, conditionFunc?: (scene: BattleScene, args: any[]) => boolean) {
    this.name = name;
    this.description = description;
    this.iconImage = iconImage;
    this.score = score;
    this.conditionFunc = conditionFunc;
    this.localizationKey = localizationKey;
  }

  getName(): string {
    // Localization key is used to get the name of the achievement
    return i18next.t(`achv:${this.localizationKey}.name`);
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
    if (this.score >= 100) {
      return AchvTier.MASTER;
    }
    if (this.score >= 75) {
      return AchvTier.ROGUE;
    }
    if (this.score >= 50) {
      return AchvTier.ULTRA;
    }
    if (this.score >= 25) {
      return AchvTier.GREAT;
    }
    return AchvTier.COMMON;
  }
}

export class MoneyAchv extends Achv {
  moneyAmount: integer;

  constructor(localizationKey: string, name: string, moneyAmount: integer, iconImage: string, score: integer) {
    super(localizationKey, name, "", iconImage, score, (scene: BattleScene, _args: any[]) => scene.money >= this.moneyAmount);
    this.moneyAmount = moneyAmount;
  }
}

export class RibbonAchv extends Achv {
  ribbonAmount: integer;

  constructor(localizationKey: string, name: string, ribbonAmount: integer, iconImage: string, score: integer) {
    super(localizationKey, name, "", iconImage, score, (scene: BattleScene, _args: any[]) => scene.gameData.gameStats.ribbonsOwned >= this.ribbonAmount);
    this.ribbonAmount = ribbonAmount;
  }
}

export class DamageAchv extends Achv {
  damageAmount: integer;

  constructor(localizationKey: string, name: string, damageAmount: integer, iconImage: string, score: integer) {
    super(localizationKey, name, "", iconImage, score, (_scene: BattleScene, args: any[]) => (args[0] as Utils.NumberHolder).value >= this.damageAmount);
    this.damageAmount = damageAmount;
  }
}

export class HealAchv extends Achv {
  healAmount: integer;

  constructor(localizationKey: string, name: string, healAmount: integer, iconImage: string, score: integer) {
    super(localizationKey, name, "", iconImage, score, (_scene: BattleScene, args: any[]) => (args[0] as Utils.NumberHolder).value >= this.healAmount);
    this.healAmount = healAmount;
  }
}

export class LevelAchv extends Achv {
  level: integer;

  constructor(localizationKey: string, name: string, level: integer, iconImage: string, score: integer) {
    super(localizationKey, name, "", iconImage, score, (scene: BattleScene, args: any[]) => (args[0] as Utils.IntegerHolder).value >= this.level);
    this.level = level;
  }
}

export class ModifierAchv extends Achv {
  constructor(localizationKey: string, name: string, description: string, iconImage: string, score: integer, modifierFunc: (modifier: Modifier) => boolean) {
    super(localizationKey, name, description, iconImage, score, (_scene: BattleScene, args: any[]) => modifierFunc((args[0] as Modifier)));
  }
}


/**
 * Get the description of an achievement from the localization file with all the necessary variables filled in
 * @param localizationKey The localization key of the achievement
 * @returns The description of the achievement
 */
export function getAchievementDescription(localizationKey: string): string {
  switch (localizationKey) {
  case "10K_MONEY":
    return i18next.t("achv:MoneyAchv.description", {"moneyAmount": achvs._10K_MONEY.moneyAmount.toLocaleString("en-US")});
  case "100K_MONEY":
    return i18next.t("achv:MoneyAchv.description", {"moneyAmount": achvs._100K_MONEY.moneyAmount.toLocaleString("en-US")});
  case "1M_MONEY":
    return i18next.t("achv:MoneyAchv.description", {"moneyAmount": achvs._1M_MONEY.moneyAmount.toLocaleString("en-US")});
  case "10M_MONEY":
    return i18next.t("achv:MoneyAchv.description", {"moneyAmount": achvs._10M_MONEY.moneyAmount.toLocaleString("en-US")});
  case "250_DMG":
    return i18next.t("achv:DamageAchv.description", {"damageAmount": achvs._250_DMG.damageAmount.toLocaleString("en-US")});
  case "1000_DMG":
    return i18next.t("achv:DamageAchv.description", {"damageAmount": achvs._1000_DMG.damageAmount.toLocaleString("en-US")});
  case "2500_DMG":
    return i18next.t("achv:DamageAchv.description", {"damageAmount": achvs._2500_DMG.damageAmount.toLocaleString("en-US")});
  case "10000_DMG":
    return i18next.t("achv:DamageAchv.description", {"damageAmount": achvs._10000_DMG.damageAmount.toLocaleString("en-US")});
  case "250_HEAL":
    return i18next.t("achv:HealAchv.description", {"healAmount": achvs._250_HEAL.healAmount.toLocaleString("en-US"), "HP": i18next.t("pokemonInfo:Stat.HPshortened")});
  case "1000_HEAL":
    return i18next.t("achv:HealAchv.description", {"healAmount": achvs._1000_HEAL.healAmount.toLocaleString("en-US"), "HP": i18next.t("pokemonInfo:Stat.HPshortened")});
  case "2500_HEAL":
    return i18next.t("achv:HealAchv.description", {"healAmount": achvs._2500_HEAL.healAmount.toLocaleString("en-US"), "HP": i18next.t("pokemonInfo:Stat.HPshortened")});
  case "10000_HEAL":
    return i18next.t("achv:HealAchv.description", {"healAmount": achvs._10000_HEAL.healAmount.toLocaleString("en-US"), "HP": i18next.t("pokemonInfo:Stat.HPshortened")});
  case "LV_100":
    return i18next.t("achv:LevelAchv.description", {"level": achvs.LV_100.level});
  case "LV_250":
    return i18next.t("achv:LevelAchv.description", {"level": achvs.LV_250.level});
  case "LV_1000":
    return i18next.t("achv:LevelAchv.description", {"level": achvs.LV_1000.level});
  case "10_RIBBONS":
    return i18next.t("achv:RibbonAchv.description", {"ribbonAmount": achvs._10_RIBBONS.ribbonAmount.toLocaleString("en-US")});
  case "25_RIBBONS":
    return i18next.t("achv:RibbonAchv.description", {"ribbonAmount": achvs._25_RIBBONS.ribbonAmount.toLocaleString("en-US")});
  case "50_RIBBONS":
    return i18next.t("achv:RibbonAchv.description", {"ribbonAmount": achvs._50_RIBBONS.ribbonAmount.toLocaleString("en-US")});
  case "75_RIBBONS":
    return i18next.t("achv:RibbonAchv.description", {"ribbonAmount": achvs._75_RIBBONS.ribbonAmount.toLocaleString("en-US")});
  case "100_RIBBONS":
    return i18next.t("achv:RibbonAchv.description", {"ribbonAmount": achvs._100_RIBBONS.ribbonAmount.toLocaleString("en-US")});
  case "TRANSFER_MAX_BATTLE_STAT":
    return i18next.t("achv:TRANSFER_MAX_BATTLE_STAT.description");
  case "MAX_FRIENDSHIP":
    return i18next.t("achv:MAX_FRIENDSHIP.description");
  case "MEGA_EVOLVE":
    return i18next.t("achv:MEGA_EVOLVE.description");
  case "GIGANTAMAX":
    return i18next.t("achv:GIGANTAMAX.description");
  case "TERASTALLIZE":
    return i18next.t("achv:TERASTALLIZE.description");
  case "STELLAR_TERASTALLIZE":
    return i18next.t("achv:STELLAR_TERASTALLIZE.description");
  case "SPLICE":
    return i18next.t("achv:SPLICE.description");
  case "MINI_BLACK_HOLE":
    return i18next.t("achv:MINI_BLACK_HOLE.description");
  case "CATCH_MYTHICAL":
    return i18next.t("achv:CATCH_MYTHICAL.description");
  case "CATCH_SUB_LEGENDARY":
    return i18next.t("achv:CATCH_SUB_LEGENDARY.description");
  case "CATCH_LEGENDARY":
    return i18next.t("achv:CATCH_LEGENDARY.description");
  case "SEE_SHINY":
    return i18next.t("achv:SEE_SHINY.description");
  case "SHINY_PARTY":
    return i18next.t("achv:SHINY_PARTY.description");
  case "HATCH_MYTHICAL":
    return i18next.t("achv:HATCH_MYTHICAL.description");
  case "HATCH_SUB_LEGENDARY":
    return i18next.t("achv:HATCH_SUB_LEGENDARY.description");
  case "HATCH_LEGENDARY":
    return i18next.t("achv:HATCH_LEGENDARY.description");
  case "HATCH_SHINY":
    return i18next.t("achv:HATCH_SHINY.description");
  case "HIDDEN_ABILITY":
    return i18next.t("achv:HIDDEN_ABILITY.description");
  case "PERFECT_IVS":
    return i18next.t("achv:PERFECT_IVS.description");
  case "CLASSIC_VICTORY":
    return i18next.t("achv:CLASSIC_VICTORY.description");
  default:
    return "";
  }

}

export const achvs = {
  _10K_MONEY: new MoneyAchv("10K_MONEY", "",10000, "nugget", 10),
  _100K_MONEY: new MoneyAchv("100K_MONEY", "",100000, "big_nugget", 25).setSecret(true),
  _1M_MONEY: new MoneyAchv("1M_MONEY","", 1000000, "relic_gold", 50).setSecret(true),
  _10M_MONEY: new MoneyAchv("10M_MONEY","", 10000000, "coin_case", 100).setSecret(true),
  _250_DMG: new DamageAchv("250_DMG","", 250, "lucky_punch", 10),
  _1000_DMG: new DamageAchv("1000_DMG","", 1000, "lucky_punch_great", 25).setSecret(true),
  _2500_DMG: new DamageAchv("2500_DMG","", 2500, "lucky_punch_ultra", 50).setSecret(true),
  _10000_DMG: new DamageAchv("10000_DMG","", 10000, "lucky_punch_master", 100).setSecret(true),
  _250_HEAL: new HealAchv("250_HEAL","", 250, "potion", 10),
  _1000_HEAL: new HealAchv("1000_HEAL", "",1000, "super_potion", 25).setSecret(true),
  _2500_HEAL: new HealAchv("2500_HEAL","", 2500, "hyper_potion", 50).setSecret(true),
  _10000_HEAL: new HealAchv("10000_HEAL","", 10000, "max_potion", 100).setSecret(true),
  LV_100: new LevelAchv("LV_100", "",100, "rare_candy", 25).setSecret(),
  LV_250: new LevelAchv("LV_250", "",250, "rarer_candy", 50).setSecret(true),
  LV_1000: new LevelAchv("LV_1000", "",1000, "candy_jar", 100).setSecret(true),
  _10_RIBBONS: new RibbonAchv("10_RIBBONS","", 10, "bronze_ribbon", 10),
  _25_RIBBONS: new RibbonAchv("25_RIBBONS", "",25, "great_ribbon", 25).setSecret(true),
  _50_RIBBONS: new RibbonAchv("50_RIBBONS","", 50, "ultra_ribbon", 50).setSecret(true),
  _75_RIBBONS: new RibbonAchv("75_RIBBONS","", 75, "rogue_ribbon", 75).setSecret(true),
  _100_RIBBONS: new RibbonAchv("100_RIBBONS","", 100, "master_ribbon", 100).setSecret(true),
  TRANSFER_MAX_BATTLE_STAT: new Achv("TRANSFER_MAX_BATTLE_STAT","",  "TRANSFER_MAX_BATTLE_STAT.description", "stick", 20),
  MAX_FRIENDSHIP: new Achv("MAX_FRIENDSHIP", "", "MAX_FRIENDSHIP.description", "soothe_bell", 25),
  MEGA_EVOLVE: new Achv("MEGA_EVOLVE", "", "MEGA_EVOLVE.description", "mega_bracelet", 50),
  GIGANTAMAX: new Achv("GIGANTAMAX", "", "GIGANTAMAX.description", "dynamax_band", 50),
  TERASTALLIZE: new Achv("TERASTALLIZE","",  "TERASTALLIZE.description", "tera_orb", 25),
  STELLAR_TERASTALLIZE: new Achv("STELLAR_TERASTALLIZE", "", "STELLAR_TERASTALLIZE.description", "stellar_tera_shard", 25).setSecret(true),
  SPLICE: new Achv("SPLICE","",  "SPLICE.description", "dna_splicers", 10),
  MINI_BLACK_HOLE: new ModifierAchv("MINI_BLACK_HOLE","",  "MINI_BLACK_HOLE.description", "mini_black_hole", 25, modifier => modifier instanceof TurnHeldItemTransferModifier).setSecret(),
  CATCH_MYTHICAL: new Achv("CATCH_MYTHICAL","",  "CATCH_MYTHICAL.description", "strange_ball", 50).setSecret(),
  CATCH_SUB_LEGENDARY: new Achv("CATCH_SUB_LEGENDARY","",  "CATCH_SUB_LEGENDARY.description", "rb", 75).setSecret(),
  CATCH_LEGENDARY: new Achv("CATCH_LEGENDARY", "", "CATCH_LEGENDARY.description", "mb", 100).setSecret(),
  SEE_SHINY: new Achv("SEE_SHINY", "", "SEE_SHINY.description", "pb_gold", 75),
  SHINY_PARTY: new Achv("SHINY_PARTY", "", "SHINY_PARTY.description", "shiny_charm", 100).setSecret(true),
  HATCH_MYTHICAL: new Achv("HATCH_MYTHICAL", "", "HATCH_MYTHICAL.description", "pair_of_tickets", 75).setSecret(),
  HATCH_SUB_LEGENDARY: new Achv("HATCH_SUB_LEGENDARY","",  "HATCH_SUB_LEGENDARY.description", "mystic_ticket", 100).setSecret(),
  HATCH_LEGENDARY: new Achv("HATCH_LEGENDARY","",  "HATCH_LEGENDARY.description", "mystic_ticket", 125).setSecret(),
  HATCH_SHINY: new Achv("HATCH_SHINY","",  "HATCH_SHINY.description", "golden_mystic_ticket", 100).setSecret(),
  HIDDEN_ABILITY: new Achv("HIDDEN_ABILITY","",  "HIDDEN_ABILITY.description", "ability_charm", 75),
  PERFECT_IVS: new Achv("PERFECT_IVS","",  "PERFECT_IVS.description", "blunder_policy", 100),
  CLASSIC_VICTORY: new Achv("CLASSIC_VICTORY","",  "CLASSIC_VICTORY.description", "relic_crown", 150),
};

{
  (function() {
    const achvKeys = Object.keys(achvs);
    achvKeys.forEach((a: string, i: integer) => {
      achvs[a].id = a;
      if (achvs[a].hasParent) {
        achvs[a].parentId = achvKeys[i - 1];
      }
    });
  })();
}
