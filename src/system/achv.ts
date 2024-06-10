import { Modifier } from "typescript";
import BattleScene from "../battle-scene";
import { TurnHeldItemTransferModifier } from "../modifier/modifier";
import i18next from "../plugins/i18n";
import * as Utils from "../utils";
import { PlayerGender } from "#app/data/enums/player-gender";
import { ParseKeys } from "i18next";
import { Challenge, SingleGenerationChallenge, SingleTypeChallenge } from "#app/data/challenge.js";

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

  /**
   * Get the name of the achievement based on the gender of the player
   * @param playerGender - the gender of the player
   * @returns the name of the achievement localized for the player gender
   */
  getName(playerGender: PlayerGender): string {
    const prefix = playerGender === PlayerGender.FEMALE ?"PGF" : "PGM";
    // Localization key is used to get the name of the achievement
    return i18next.t(`${prefix}achv:${this.localizationKey}.name` as ParseKeys);
  }

  getDescription(): string {
    return this.description;
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

export class ChallengeAchv extends Achv {
  constructor(localizationKey: string, name: string, description: string, iconImage: string, score: integer, challengeFunc: (challenge: Challenge) => boolean) {
    super(localizationKey, name, description, iconImage, score, (_scene: BattleScene, args: any[]) => challengeFunc((args[0] as Challenge)));
  }
}


/**
 * Get the description of an achievement from the localization file with all the necessary variables filled in
 * @param localizationKey The localization key of the achievement
 * @returns The description of the achievement
 */
export function getAchievementDescription(localizationKey: string): string {
  // We need to get the player gender from the game data to add the correct prefix to the achievement name
  let playerGender = PlayerGender.MALE;
  if (this?.scene) {
    playerGender = this.scene.gameData.gender;
  }
  let genderPrefix = "PGM";
  if (playerGender === PlayerGender.FEMALE) {
    genderPrefix = "PGF";
  }

  switch (localizationKey) {
  case "10K_MONEY":
    return i18next.t(`${genderPrefix}achv:MoneyAchv.description` as ParseKeys, {"moneyAmount": achvs._10K_MONEY.moneyAmount.toLocaleString("en-US")});
  case "100K_MONEY":
    return i18next.t(`${genderPrefix}achv:MoneyAchv.description` as ParseKeys, {"moneyAmount": achvs._100K_MONEY.moneyAmount.toLocaleString("en-US")});
  case "1M_MONEY":
    return i18next.t(`${genderPrefix}achv:MoneyAchv.description` as ParseKeys, {"moneyAmount": achvs._1M_MONEY.moneyAmount.toLocaleString("en-US")});
  case "10M_MONEY":
    return i18next.t(`${genderPrefix}achv:MoneyAchv.description` as ParseKeys, {"moneyAmount": achvs._10M_MONEY.moneyAmount.toLocaleString("en-US")});
  case "250_DMG":
    return i18next.t(`${genderPrefix}achv:DamageAchv.description` as ParseKeys, {"damageAmount": achvs._250_DMG.damageAmount.toLocaleString("en-US")});
  case "1000_DMG":
    return i18next.t(`${genderPrefix}achv:DamageAchv.description` as ParseKeys, {"damageAmount": achvs._1000_DMG.damageAmount.toLocaleString("en-US")});
  case "2500_DMG":
    return i18next.t(`${genderPrefix}achv:DamageAchv.description` as ParseKeys, {"damageAmount": achvs._2500_DMG.damageAmount.toLocaleString("en-US")});
  case "10000_DMG":
    return i18next.t(`${genderPrefix}achv:DamageAchv.description` as ParseKeys, {"damageAmount": achvs._10000_DMG.damageAmount.toLocaleString("en-US")});
  case "250_HEAL":
    return i18next.t(`${genderPrefix}achv:HealAchv.description` as ParseKeys, {"healAmount": achvs._250_HEAL.healAmount.toLocaleString("en-US"), "HP": i18next.t("pokemonInfo:Stat.HPshortened")});
  case "1000_HEAL":
    return i18next.t(`${genderPrefix}achv:HealAchv.description` as ParseKeys, {"healAmount": achvs._1000_HEAL.healAmount.toLocaleString("en-US"), "HP": i18next.t("pokemonInfo:Stat.HPshortened")});
  case "2500_HEAL":
    return i18next.t(`${genderPrefix}achv:HealAchv.description` as ParseKeys, {"healAmount": achvs._2500_HEAL.healAmount.toLocaleString("en-US"), "HP": i18next.t("pokemonInfo:Stat.HPshortened")});
  case "10000_HEAL":
    return i18next.t(`${genderPrefix}achv:HealAchv.description` as ParseKeys, {"healAmount": achvs._10000_HEAL.healAmount.toLocaleString("en-US"), "HP": i18next.t("pokemonInfo:Stat.HPshortened")});
  case "LV_100":
    return i18next.t(`${genderPrefix}achv:LevelAchv.description` as ParseKeys, {"level": achvs.LV_100.level});
  case "LV_250":
    return i18next.t(`${genderPrefix}achv:LevelAchv.description` as ParseKeys, {"level": achvs.LV_250.level});
  case "LV_1000":
    return i18next.t(`${genderPrefix}achv:LevelAchv.description` as ParseKeys, {"level": achvs.LV_1000.level});
  case "10_RIBBONS":
    return i18next.t(`${genderPrefix}achv:RibbonAchv.description` as ParseKeys, {"ribbonAmount": achvs._10_RIBBONS.ribbonAmount.toLocaleString("en-US")});
  case "25_RIBBONS":
    return i18next.t(`${genderPrefix}achv:RibbonAchv.description` as ParseKeys, {"ribbonAmount": achvs._25_RIBBONS.ribbonAmount.toLocaleString("en-US")});
  case "50_RIBBONS":
    return i18next.t(`${genderPrefix}achv:RibbonAchv.description` as ParseKeys, {"ribbonAmount": achvs._50_RIBBONS.ribbonAmount.toLocaleString("en-US")});
  case "75_RIBBONS":
    return i18next.t(`${genderPrefix}achv:RibbonAchv.description` as ParseKeys, {"ribbonAmount": achvs._75_RIBBONS.ribbonAmount.toLocaleString("en-US")});
  case "100_RIBBONS":
    return i18next.t(`${genderPrefix}achv:RibbonAchv.description` as ParseKeys, {"ribbonAmount": achvs._100_RIBBONS.ribbonAmount.toLocaleString("en-US")});
  case "TRANSFER_MAX_BATTLE_STAT":
    return i18next.t(`${genderPrefix}achv:TRANSFER_MAX_BATTLE_STAT.description` as ParseKeys);
  case "MAX_FRIENDSHIP":
    return i18next.t(`${genderPrefix}achv:MAX_FRIENDSHIP.description` as ParseKeys);
  case "MEGA_EVOLVE":
    return i18next.t(`${genderPrefix}achv:MEGA_EVOLVE.description` as ParseKeys);
  case "GIGANTAMAX":
    return i18next.t(`${genderPrefix}achv:GIGANTAMAX.description` as ParseKeys);
  case "TERASTALLIZE":
    return i18next.t(`${genderPrefix}achv:TERASTALLIZE.description` as ParseKeys);
  case "STELLAR_TERASTALLIZE":
    return i18next.t(`${genderPrefix}achv:STELLAR_TERASTALLIZE.description` as ParseKeys);
  case "SPLICE":
    return i18next.t(`${genderPrefix}achv:SPLICE.description` as ParseKeys);
  case "MINI_BLACK_HOLE":
    return i18next.t(`${genderPrefix}achv:MINI_BLACK_HOLE.description` as ParseKeys);
  case "CATCH_MYTHICAL":
    return i18next.t(`${genderPrefix}achv:CATCH_MYTHICAL.description` as ParseKeys);
  case "CATCH_SUB_LEGENDARY":
    return i18next.t(`${genderPrefix}achv:CATCH_SUB_LEGENDARY.description` as ParseKeys);
  case "CATCH_LEGENDARY":
    return i18next.t(`${genderPrefix}achv:CATCH_LEGENDARY.description` as ParseKeys);
  case "SEE_SHINY":
    return i18next.t(`${genderPrefix}achv:SEE_SHINY.description` as ParseKeys);
  case "SHINY_PARTY":
    return i18next.t(`${genderPrefix}achv:SHINY_PARTY.description` as ParseKeys);
  case "HATCH_MYTHICAL":
    return i18next.t(`${genderPrefix}achv:HATCH_MYTHICAL.description` as ParseKeys);
  case "HATCH_SUB_LEGENDARY":
    return i18next.t(`${genderPrefix}achv:HATCH_SUB_LEGENDARY.description` as ParseKeys);
  case "HATCH_LEGENDARY":
    return i18next.t(`${genderPrefix}achv:HATCH_LEGENDARY.description` as ParseKeys);
  case "HATCH_SHINY":
    return i18next.t(`${genderPrefix}achv:HATCH_SHINY.description` as ParseKeys);
  case "HIDDEN_ABILITY":
    return i18next.t(`${genderPrefix}achv:HIDDEN_ABILITY.description` as ParseKeys);
  case "PERFECT_IVS":
    return i18next.t(`${genderPrefix}achv:PERFECT_IVS.description` as ParseKeys);
  case "CLASSIC_VICTORY":
    return i18next.t(`${genderPrefix}achv:CLASSIC_VICTORY.description` as ParseKeys);
  case "MONO_GEN_ONE":
    return i18next.t(`${genderPrefix}achv:MONO_GEN_ONE.description` as ParseKeys);
  case "MONO_GEN_TWO":
    return i18next.t(`${genderPrefix}achv:MONO_GEN_TWO.description` as ParseKeys);
  case "MONO_GEN_THREE":
    return i18next.t(`${genderPrefix}achv:MONO_GEN_THREE.description` as ParseKeys);
  case "MONO_GEN_FOUR":
    return i18next.t(`${genderPrefix}achv:MONO_GEN_FOUR.description` as ParseKeys);
  case "MONO_GEN_FIVE":
    return i18next.t(`${genderPrefix}achv:MONO_GEN_FIVE.description` as ParseKeys);
  case "MONO_GEN_SIX":
    return i18next.t(`${genderPrefix}achv:MONO_GEN_SIX.description` as ParseKeys);
  case "MONO_GEN_SEVEN":
    return i18next.t(`${genderPrefix}achv:MONO_GEN_SEVEN.description` as ParseKeys);
  case "MONO_GEN_EIGHT":
    return i18next.t(`${genderPrefix}achv:MONO_GEN_EIGHT.description` as ParseKeys);
  case "MONO_GEN_NINE":
    return i18next.t(`${genderPrefix}achv:MONO_GEN_NINE.description` as ParseKeys);
  case "MONO_NORMAL":
  case "MONO_FIGHTING":
  case "MONO_FLYING":
  case "MONO_POISON":
  case "MONO_GROUND":
  case "MONO_ROCK":
  case "MONO_BUG":
  case "MONO_GHOST":
  case "MONO_STEEL":
  case "MONO_FIRE":
  case "MONO_WATER":
  case "MONO_GRASS":
  case "MONO_ELECTRIC":
  case "MONO_PSYCHIC":
  case "MONO_ICE":
  case "MONO_DRAGON":
  case "MONO_DARK":
  case "MONO_FAIRY":
    return i18next.t(`${genderPrefix}achv:MonoType.description` as ParseKeys, {"type": i18next.t(`pokemonInfo:Type.${localizationKey.slice(5)}`)});
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
  TRANSFER_MAX_BATTLE_STAT: new Achv("TRANSFER_MAX_BATTLE_STAT","",  "TRANSFER_MAX_BATTLE_STAT.description","stick", 20),
  MAX_FRIENDSHIP: new Achv("MAX_FRIENDSHIP", "", "MAX_FRIENDSHIP.description","soothe_bell", 25),
  MEGA_EVOLVE: new Achv("MEGA_EVOLVE", "", "MEGA_EVOLVE.description","mega_bracelet", 50),
  GIGANTAMAX: new Achv("GIGANTAMAX", "", "GIGANTAMAX.description","dynamax_band", 50),
  TERASTALLIZE: new Achv("TERASTALLIZE","",  "TERASTALLIZE.description","tera_orb", 25),
  STELLAR_TERASTALLIZE: new Achv("STELLAR_TERASTALLIZE", "", "STELLAR_TERASTALLIZE.description","stellar_tera_shard", 25).setSecret(true),
  SPLICE: new Achv("SPLICE","",  "SPLICE.description","dna_splicers", 10),
  MINI_BLACK_HOLE: new ModifierAchv("MINI_BLACK_HOLE","",  "MINI_BLACK_HOLE.description","mini_black_hole", 25, modifier => modifier instanceof TurnHeldItemTransferModifier).setSecret(),
  CATCH_MYTHICAL: new Achv("CATCH_MYTHICAL","",  "CATCH_MYTHICAL.description","strange_ball", 50).setSecret(),
  CATCH_SUB_LEGENDARY: new Achv("CATCH_SUB_LEGENDARY","",  "CATCH_SUB_LEGENDARY.description","rb", 75).setSecret(),
  CATCH_LEGENDARY: new Achv("CATCH_LEGENDARY", "", "CATCH_LEGENDARY.description","mb", 100).setSecret(),
  SEE_SHINY: new Achv("SEE_SHINY", "", "SEE_SHINY.description","pb_gold", 75),
  SHINY_PARTY: new Achv("SHINY_PARTY", "", "SHINY_PARTY.description","shiny_charm", 100).setSecret(true),
  HATCH_MYTHICAL: new Achv("HATCH_MYTHICAL", "", "HATCH_MYTHICAL.description","pair_of_tickets", 75).setSecret(),
  HATCH_SUB_LEGENDARY: new Achv("HATCH_SUB_LEGENDARY","",  "HATCH_SUB_LEGENDARY.description","mystic_ticket", 100).setSecret(),
  HATCH_LEGENDARY: new Achv("HATCH_LEGENDARY","",  "HATCH_LEGENDARY.description","mystic_ticket", 125).setSecret(),
  HATCH_SHINY: new Achv("HATCH_SHINY","",  "HATCH_SHINY.description","golden_mystic_ticket", 100).setSecret(),
  HIDDEN_ABILITY: new Achv("HIDDEN_ABILITY","",  "HIDDEN_ABILITY.description","ability_charm", 75),
  PERFECT_IVS: new Achv("PERFECT_IVS","",  "PERFECT_IVS.description","blunder_policy", 100),
  CLASSIC_VICTORY: new Achv("CLASSIC_VICTORY","",  "CLASSIC_VICTORY.description","relic_crown", 150),
  MONO_GEN_ONE_VICTORY: new ChallengeAchv("MONO_GEN_ONE","",  "MONO_GEN_ONE.description", "mystic_ticket", 100, c => c instanceof SingleGenerationChallenge && c.value === 1),
  MONO_GEN_TWO_VICTORY: new ChallengeAchv("MONO_GEN_TWO","",  "MONO_GEN_TWO.description", "mystic_ticket", 100, c => c instanceof SingleGenerationChallenge && c.value === 2),
  MONO_GEN_THREE_VICTORY: new ChallengeAchv("MONO_GEN_THREE","",  "MONO_GEN_THREE.description", "mystic_ticket", 100, c => c instanceof SingleGenerationChallenge && c.value === 3),
  MONO_GEN_FOUR_VICTORY: new ChallengeAchv("MONO_GEN_FOUR","",  "MONO_GEN_FOUR.description", "mystic_ticket", 100, c => c instanceof SingleGenerationChallenge && c.value === 4),
  MONO_GEN_FIVE_VICTORY: new ChallengeAchv("MONO_GEN_FIVE","",  "MONO_GEN_FIVE.description", "mystic_ticket", 100, c => c instanceof SingleGenerationChallenge && c.value === 5),
  MONO_GEN_SIX_VICTORY: new ChallengeAchv("MONO_GEN_SIX","",  "MONO_GEN_SIX.description", "mystic_ticket", 100, c => c instanceof SingleGenerationChallenge && c.value === 6),
  MONO_GEN_SEVEN_VICTORY: new ChallengeAchv("MONO_GEN_SEVEN","",  "MONO_GEN_SEVEN.description", "mystic_ticket", 100, c => c instanceof SingleGenerationChallenge && c.value === 7),
  MONO_GEN_EIGHT_VICTORY: new ChallengeAchv("MONO_GEN_EIGHT","",  "MONO_GEN_EIGHT.description", "mystic_ticket", 100, c => c instanceof SingleGenerationChallenge && c.value === 8),
  MONO_GEN_NINE_VICTORY: new ChallengeAchv("MONO_GEN_NINE","",  "MONO_GEN_NINE.description", "mystic_ticket", 100, c => c instanceof SingleGenerationChallenge && c.value === 9),
  MONO_NORMAL: new ChallengeAchv("MONO_NORMAL","", "MONO_NORMAL.description", "silk_scarf", 100, c => c instanceof SingleTypeChallenge && c.value === 1),
  MONO_FIGHTING: new ChallengeAchv("MONO_FIGHTING","", "MONO_FIGHTING.description", "black_belt", 100, c => c instanceof SingleTypeChallenge && c.value === 2),
  MONO_FLYING: new ChallengeAchv("MONO_FLYING","", "MONO_FLYING.description", "sharp_beak", 100, c => c instanceof SingleTypeChallenge && c.value === 3),
  MONO_POISON: new ChallengeAchv("MONO_POISON","", "MONO_POISON.description", "poison_barb", 100, c => c instanceof SingleTypeChallenge && c.value === 4),
  MONO_GROUND: new ChallengeAchv("MONO_GROUND","", "MONO_GROUND.description", "soft_sand", 100, c => c instanceof SingleTypeChallenge && c.value === 5),
  MONO_ROCK: new ChallengeAchv("MONO_ROCK","", "MONO_ROCK.description", "hard_stone", 100, c => c instanceof SingleTypeChallenge && c.value === 6),
  MONO_BUG: new ChallengeAchv("MONO_BUG","", "MONO_BUG.description", "silver_powder", 100, c => c instanceof SingleTypeChallenge && c.value === 7),
  MONO_GHOST: new ChallengeAchv("MONO_GHOST","", "MONO_GHOST.description", "spell_tag", 100, c => c instanceof SingleTypeChallenge && c.value === 8),
  MONO_STEEL: new ChallengeAchv("MONO_STEEL","", "MONO_STEEL.description", "metal_coat", 100, c => c instanceof SingleTypeChallenge && c.value === 9),
  MONO_FIRE: new ChallengeAchv("MONO_FIRE","", "MONO_FIRE.description", "charcoal", 100, c => c instanceof SingleTypeChallenge && c.value === 10),
  MONO_WATER: new ChallengeAchv("MONO_WATER","", "MONO_WATER.description", "mystic_water", 100, c => c instanceof SingleTypeChallenge && c.value === 11),
  MONO_GRASS: new ChallengeAchv("MONO_GRASS","", "MONO_GRASS.description", "miracle_seed", 100, c => c instanceof SingleTypeChallenge && c.value === 12),
  MONO_ELECTRIC: new ChallengeAchv("MONO_ELECTRIC","", "MONO_ELECTRIC.description", "magnet", 100, c => c instanceof SingleTypeChallenge && c.value === 13),
  MONO_PSYCHIC: new ChallengeAchv("MONO_PSYCHIC","", "MONO_PSYCHIC.description", "twisted_spoon", 100, c => c instanceof SingleTypeChallenge && c.value === 14),
  MONO_ICE: new ChallengeAchv("MONO_ICE","", "MONO_ICE.description", "never_melt_ice", 100, c => c instanceof SingleTypeChallenge && c.value === 15),
  MONO_DRAGON: new ChallengeAchv("MONO_DRAGON","", "MONO_DRAGON.description", "dragon_fang", 100, c => c instanceof SingleTypeChallenge && c.value === 16),
  MONO_DARK: new ChallengeAchv("MONO_DARK","", "MONO_DARK.description", "black_glasses", 100, c => c instanceof SingleTypeChallenge && c.value === 17),
  MONO_FAIRY: new ChallengeAchv("MONO_FAIRY","", "MONO_FAIRY.description", "fairy_feather", 100, c => c instanceof SingleTypeChallenge && c.value === 18),
};

export function initAchievements() {
  const achvKeys = Object.keys(achvs);
  achvKeys.forEach((a: string, i: integer) => {
    achvs[a].id = a;
    if (achvs[a].hasParent) {
      achvs[a].parentId = achvKeys[i - 1];
    }
  });
}
