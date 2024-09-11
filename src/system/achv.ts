import { Modifier } from "typescript";
import BattleScene from "../battle-scene";
import { TurnHeldItemTransferModifier } from "../modifier/modifier";
import { pokemonEvolutions } from "#app/data/pokemon-evolutions";
import i18next from "i18next";
import * as Utils from "../utils";
import { PlayerGender } from "#enums/player-gender";
import { Challenge, FreshStartChallenge, SingleGenerationChallenge, SingleTypeChallenge, InverseBattleChallenge } from "#app/data/challenge";
import { ConditionFn } from "#app/@types/common";
import { Stat, getShortenedStatKey } from "#app/enums/stat";
import { Challenges } from "#app/enums/challenges";

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

  private conditionFunc: ConditionFn | undefined;

  constructor(localizationKey:string, name: string, description: string, iconImage: string, score: integer, conditionFunc?: ConditionFn) {
    this.name = name;
    this.description = description;
    this.iconImage = iconImage;
    this.score = score;
    this.conditionFunc = conditionFunc;
    this.localizationKey = localizationKey;
  }

  /**
   * Get the name of the achievement based on the gender of the player
   * @param playerGender - the gender of the player (default: {@linkcode PlayerGender.UNSET})
   * @returns the name of the achievement localized for the player gender
   */
  getName(playerGender: PlayerGender = PlayerGender.UNSET): string {
    const genderStr = PlayerGender[playerGender].toLowerCase();
    // Localization key is used to get the name of the achievement
    return i18next.t(`achv:${this.localizationKey}.name`, { context: genderStr });
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

  validate(scene: BattleScene, args?: any[]): boolean {
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
  constructor(localizationKey: string, name: string, description: string, iconImage: string, score: integer, challengeFunc: (challenge: Challenge, scene: BattleScene) => boolean) {
    super(localizationKey, name, description, iconImage, score, (_scene: BattleScene, args: any[]) => challengeFunc(args[0] as Challenge, _scene));
  }
}


/**
 * Get the description of an achievement from the localization file with all the necessary variables filled in
 * @param localizationKey The localization key of the achievement
 * @returns The description of the achievement
 */
export function getAchievementDescription(localizationKey: string): string {
  // We need to get the player gender from the game data to add the correct prefix to the achievement name
  const genderIndex = this?.scene?.gameData?.gender ?? PlayerGender.MALE; //TODO: why is `this` being used here!? We are not inside a scope (copied from original)
  const genderStr = PlayerGender[genderIndex].toLowerCase();

  switch (localizationKey) {
  case "10K_MONEY":
    return i18next.t("achv:MoneyAchv.description", {context: genderStr, "moneyAmount": achvs._10K_MONEY.moneyAmount.toLocaleString("en-US")});
  case "100K_MONEY":
    return i18next.t("achv:MoneyAchv.description", {context: genderStr, "moneyAmount": achvs._100K_MONEY.moneyAmount.toLocaleString("en-US")});
  case "1M_MONEY":
    return i18next.t("achv:MoneyAchv.description", {context: genderStr, "moneyAmount": achvs._1M_MONEY.moneyAmount.toLocaleString("en-US")});
  case "10M_MONEY":
    return i18next.t("achv:MoneyAchv.description", {context: genderStr, "moneyAmount": achvs._10M_MONEY.moneyAmount.toLocaleString("en-US")});
  case "250_DMG":
    return i18next.t("achv:DamageAchv.description", {context: genderStr, "damageAmount": achvs._250_DMG.damageAmount.toLocaleString("en-US")});
  case "1000_DMG":
    return i18next.t("achv:DamageAchv.description", {context: genderStr, "damageAmount": achvs._1000_DMG.damageAmount.toLocaleString("en-US")});
  case "2500_DMG":
    return i18next.t("achv:DamageAchv.description", {context: genderStr, "damageAmount": achvs._2500_DMG.damageAmount.toLocaleString("en-US")});
  case "10000_DMG":
    return i18next.t("achv:DamageAchv.description", {context: genderStr, "damageAmount": achvs._10000_DMG.damageAmount.toLocaleString("en-US")});
  case "250_HEAL":
    return i18next.t("achv:HealAchv.description", {context: genderStr, "healAmount": achvs._250_HEAL.healAmount.toLocaleString("en-US"), "HP": i18next.t(getShortenedStatKey(Stat.HP))});
  case "1000_HEAL":
    return i18next.t("achv:HealAchv.description", {context: genderStr, "healAmount": achvs._1000_HEAL.healAmount.toLocaleString("en-US"), "HP": i18next.t(getShortenedStatKey(Stat.HP))});
  case "2500_HEAL":
    return i18next.t("achv:HealAchv.description", {context: genderStr, "healAmount": achvs._2500_HEAL.healAmount.toLocaleString("en-US"), "HP": i18next.t(getShortenedStatKey(Stat.HP))});
  case "10000_HEAL":
    return i18next.t("achv:HealAchv.description", {context: genderStr, "healAmount": achvs._10000_HEAL.healAmount.toLocaleString("en-US"), "HP": i18next.t(getShortenedStatKey(Stat.HP))});
  case "LV_100":
    return i18next.t("achv:LevelAchv.description", {context: genderStr, "level": achvs.LV_100.level});
  case "LV_250":
    return i18next.t("achv:LevelAchv.description", {context: genderStr, "level": achvs.LV_250.level});
  case "LV_1000":
    return i18next.t("achv:LevelAchv.description", {context: genderStr, "level": achvs.LV_1000.level});
  case "10_RIBBONS":
    return i18next.t("achv:RibbonAchv.description", {context: genderStr, "ribbonAmount": achvs._10_RIBBONS.ribbonAmount.toLocaleString("en-US")});
  case "25_RIBBONS":
    return i18next.t("achv:RibbonAchv.description", {context: genderStr, "ribbonAmount": achvs._25_RIBBONS.ribbonAmount.toLocaleString("en-US")});
  case "50_RIBBONS":
    return i18next.t("achv:RibbonAchv.description", {context: genderStr, "ribbonAmount": achvs._50_RIBBONS.ribbonAmount.toLocaleString("en-US")});
  case "75_RIBBONS":
    return i18next.t("achv:RibbonAchv.description", {context: genderStr, "ribbonAmount": achvs._75_RIBBONS.ribbonAmount.toLocaleString("en-US")});
  case "100_RIBBONS":
    return i18next.t("achv:RibbonAchv.description", {context: genderStr, "ribbonAmount": achvs._100_RIBBONS.ribbonAmount.toLocaleString("en-US")});
  case "TRANSFER_MAX_STAT_STAGE":
    return i18next.t("achv:TRANSFER_MAX_STAT_STAGE.description", { context: genderStr });
  case "MAX_FRIENDSHIP":
    return i18next.t("achv:MAX_FRIENDSHIP.description", { context: genderStr });
  case "MEGA_EVOLVE":
    return i18next.t("achv:MEGA_EVOLVE.description", { context: genderStr });
  case "GIGANTAMAX":
    return i18next.t("achv:GIGANTAMAX.description", { context: genderStr });
  case "TERASTALLIZE":
    return i18next.t("achv:TERASTALLIZE.description", { context: genderStr });
  case "STELLAR_TERASTALLIZE":
    return i18next.t("achv:STELLAR_TERASTALLIZE.description", { context: genderStr });
  case "SPLICE":
    return i18next.t("achv:SPLICE.description", { context: genderStr });
  case "MINI_BLACK_HOLE":
    return i18next.t("achv:MINI_BLACK_HOLE.description", { context: genderStr });
  case "CATCH_MYTHICAL":
    return i18next.t("achv:CATCH_MYTHICAL.description", { context: genderStr });
  case "CATCH_SUB_LEGENDARY":
    return i18next.t("achv:CATCH_SUB_LEGENDARY.description", { context: genderStr });
  case "CATCH_LEGENDARY":
    return i18next.t("achv:CATCH_LEGENDARY.description", { context: genderStr });
  case "SEE_SHINY":
    return i18next.t("achv:SEE_SHINY.description", { context: genderStr });
  case "SHINY_PARTY":
    return i18next.t("achv:SHINY_PARTY.description", { context: genderStr });
  case "HATCH_MYTHICAL":
    return i18next.t("achv:HATCH_MYTHICAL.description", { context: genderStr });
  case "HATCH_SUB_LEGENDARY":
    return i18next.t("achv:HATCH_SUB_LEGENDARY.description", { context: genderStr });
  case "HATCH_LEGENDARY":
    return i18next.t("achv:HATCH_LEGENDARY.description", { context: genderStr });
  case "HATCH_SHINY":
    return i18next.t("achv:HATCH_SHINY.description", { context: genderStr });
  case "HIDDEN_ABILITY":
    return i18next.t("achv:HIDDEN_ABILITY.description", { context: genderStr });
  case "PERFECT_IVS":
    return i18next.t("achv:PERFECT_IVS.description", { context: genderStr });
  case "CLASSIC_VICTORY":
    return i18next.t("achv:CLASSIC_VICTORY.description", { context: genderStr });
  case "UNEVOLVED_CLASSIC_VICTORY":
    return i18next.t("achv:UNEVOLVED_CLASSIC_VICTORY.description", { context: genderStr });
  case "MONO_GEN_ONE":
    return i18next.t("achv:MONO_GEN_ONE.description", { context: genderStr });
  case "MONO_GEN_TWO":
    return i18next.t("achv:MONO_GEN_TWO.description", { context: genderStr });
  case "MONO_GEN_THREE":
    return i18next.t("achv:MONO_GEN_THREE.description", { context: genderStr });
  case "MONO_GEN_FOUR":
    return i18next.t("achv:MONO_GEN_FOUR.description", { context: genderStr });
  case "MONO_GEN_FIVE":
    return i18next.t("achv:MONO_GEN_FIVE.description", { context: genderStr });
  case "MONO_GEN_SIX":
    return i18next.t("achv:MONO_GEN_SIX.description", { context: genderStr });
  case "MONO_GEN_SEVEN":
    return i18next.t("achv:MONO_GEN_SEVEN.description", { context: genderStr });
  case "MONO_GEN_EIGHT":
    return i18next.t("achv:MONO_GEN_EIGHT.description", { context: genderStr });
  case "MONO_GEN_NINE":
    return i18next.t("achv:MONO_GEN_NINE.description", { context: genderStr });
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
    return i18next.t("achv:MonoType.description", { context: genderStr, "type": i18next.t(`pokemonInfo:Type.${localizationKey.slice(5)}`) });
  case "FRESH_START":
    return i18next.t("achv:FRESH_START.description", { context: genderStr });
  case "INVERSE_BATTLE":
    return i18next.t("achv:INVERSE_BATTLE.description", { context: genderStr });
  default:
    return "";
  }

}

export const achvs = {
  _10K_MONEY: new MoneyAchv("10K_MONEY", "", 10000, "nugget", 10),
  _100K_MONEY: new MoneyAchv("100K_MONEY", "", 100000, "big_nugget", 25).setSecret(true),
  _1M_MONEY: new MoneyAchv("1M_MONEY", "", 1000000, "relic_gold", 50).setSecret(true),
  _10M_MONEY: new MoneyAchv("10M_MONEY", "", 10000000, "coin_case", 100).setSecret(true),
  _250_DMG: new DamageAchv("250_DMG", "", 250, "lucky_punch", 10),
  _1000_DMG: new DamageAchv("1000_DMG", "", 1000, "lucky_punch_great", 25).setSecret(true),
  _2500_DMG: new DamageAchv("2500_DMG", "", 2500, "lucky_punch_ultra", 50).setSecret(true),
  _10000_DMG: new DamageAchv("10000_DMG", "", 10000, "lucky_punch_master", 100).setSecret(true),
  _250_HEAL: new HealAchv("250_HEAL", "", 250, "potion", 10),
  _1000_HEAL: new HealAchv("1000_HEAL", "", 1000, "super_potion", 25).setSecret(true),
  _2500_HEAL: new HealAchv("2500_HEAL", "", 2500, "hyper_potion", 50).setSecret(true),
  _10000_HEAL: new HealAchv("10000_HEAL", "", 10000, "max_potion", 100).setSecret(true),
  LV_100: new LevelAchv("LV_100", "", 100, "rare_candy", 25).setSecret(),
  LV_250: new LevelAchv("LV_250", "", 250, "rarer_candy", 50).setSecret(true),
  LV_1000: new LevelAchv("LV_1000", "", 1000, "candy_jar", 100).setSecret(true),
  _10_RIBBONS: new RibbonAchv("10_RIBBONS", "", 10, "bronze_ribbon", 10),
  _25_RIBBONS: new RibbonAchv("25_RIBBONS", "", 25, "great_ribbon", 25).setSecret(true),
  _50_RIBBONS: new RibbonAchv("50_RIBBONS", "", 50, "ultra_ribbon", 50).setSecret(true),
  _75_RIBBONS: new RibbonAchv("75_RIBBONS", "", 75, "rogue_ribbon", 75).setSecret(true),
  _100_RIBBONS: new RibbonAchv("100_RIBBONS", "", 100, "master_ribbon", 100).setSecret(true),
  TRANSFER_MAX_STAT_STAGE: new Achv("TRANSFER_MAX_STAT_STAGE", "",  "TRANSFER_MAX_STAT_STAGE.description", "baton", 20),
  MAX_FRIENDSHIP: new Achv("MAX_FRIENDSHIP", "", "MAX_FRIENDSHIP.description", "soothe_bell", 25),
  MEGA_EVOLVE: new Achv("MEGA_EVOLVE", "", "MEGA_EVOLVE.description", "mega_bracelet", 50),
  GIGANTAMAX: new Achv("GIGANTAMAX", "", "GIGANTAMAX.description", "dynamax_band", 50),
  TERASTALLIZE: new Achv("TERASTALLIZE", "",  "TERASTALLIZE.description", "tera_orb", 25),
  STELLAR_TERASTALLIZE: new Achv("STELLAR_TERASTALLIZE", "", "STELLAR_TERASTALLIZE.description", "stellar_tera_shard", 25).setSecret(true),
  SPLICE: new Achv("SPLICE", "",  "SPLICE.description", "dna_splicers", 10),
  MINI_BLACK_HOLE: new ModifierAchv("MINI_BLACK_HOLE", "",  "MINI_BLACK_HOLE.description", "mini_black_hole", 25, modifier => modifier instanceof TurnHeldItemTransferModifier).setSecret(),
  CATCH_MYTHICAL: new Achv("CATCH_MYTHICAL", "",  "CATCH_MYTHICAL.description", "strange_ball", 50).setSecret(),
  CATCH_SUB_LEGENDARY: new Achv("CATCH_SUB_LEGENDARY", "",  "CATCH_SUB_LEGENDARY.description", "rb", 75).setSecret(),
  CATCH_LEGENDARY: new Achv("CATCH_LEGENDARY", "", "CATCH_LEGENDARY.description", "mb", 100).setSecret(),
  SEE_SHINY: new Achv("SEE_SHINY", "", "SEE_SHINY.description", "pb_gold", 75),
  SHINY_PARTY: new Achv("SHINY_PARTY", "", "SHINY_PARTY.description", "shiny_charm", 100).setSecret(true),
  HATCH_MYTHICAL: new Achv("HATCH_MYTHICAL", "", "HATCH_MYTHICAL.description", "mystery_egg", 75).setSecret(),
  HATCH_SUB_LEGENDARY: new Achv("HATCH_SUB_LEGENDARY", "",  "HATCH_SUB_LEGENDARY.description", "oval_stone", 100).setSecret(),
  HATCH_LEGENDARY: new Achv("HATCH_LEGENDARY", "",  "HATCH_LEGENDARY.description", "lucky_egg", 125).setSecret(),
  HATCH_SHINY: new Achv("HATCH_SHINY", "",  "HATCH_SHINY.description", "golden_egg", 100).setSecret(),
  HIDDEN_ABILITY: new Achv("HIDDEN_ABILITY", "",  "HIDDEN_ABILITY.description", "ability_charm", 75),
  PERFECT_IVS: new Achv("PERFECT_IVS", "",  "PERFECT_IVS.description", "blunder_policy", 100),
  CLASSIC_VICTORY: new Achv("CLASSIC_VICTORY", "",  "CLASSIC_VICTORY.description", "relic_crown", 150, c => c.gameData.gameStats.sessionsWon === 0),
  UNEVOLVED_CLASSIC_VICTORY: new Achv("UNEVOLVED_CLASSIC_VICTORY", "", "UNEVOLVED_CLASSIC_VICTORY.description", "eviolite", 175, c => c.getParty().some(p => p.getSpeciesForm(true).speciesId in pokemonEvolutions)),
  MONO_GEN_ONE_VICTORY: new ChallengeAchv("MONO_GEN_ONE", "",  "MONO_GEN_ONE.description", "ribbon_gen1", 100, (c, scene) => c instanceof SingleGenerationChallenge && c.value === 1 && !scene.gameMode.challenges.some(c => c.id === Challenges.INVERSE_BATTLE && c.value > 0)),
  MONO_GEN_TWO_VICTORY: new ChallengeAchv("MONO_GEN_TWO", "",  "MONO_GEN_TWO.description", "ribbon_gen2", 100, (c, scene) => c instanceof SingleGenerationChallenge && c.value === 2 && !scene.gameMode.challenges.some(c => c.id === Challenges.INVERSE_BATTLE && c.value > 0)),
  MONO_GEN_THREE_VICTORY: new ChallengeAchv("MONO_GEN_THREE", "",  "MONO_GEN_THREE.description", "ribbon_gen3", 100, (c, scene) => c instanceof SingleGenerationChallenge && c.value === 3 && !scene.gameMode.challenges.some(c => c.id === Challenges.INVERSE_BATTLE && c.value > 0)),
  MONO_GEN_FOUR_VICTORY: new ChallengeAchv("MONO_GEN_FOUR", "",  "MONO_GEN_FOUR.description", "ribbon_gen4", 100, (c, scene) => c instanceof SingleGenerationChallenge && c.value === 4 && !scene.gameMode.challenges.some(c => c.id === Challenges.INVERSE_BATTLE && c.value > 0)),
  MONO_GEN_FIVE_VICTORY: new ChallengeAchv("MONO_GEN_FIVE", "",  "MONO_GEN_FIVE.description", "ribbon_gen5", 100, (c, scene) => c instanceof SingleGenerationChallenge && c.value === 5 && !scene.gameMode.challenges.some(c => c.id === Challenges.INVERSE_BATTLE && c.value > 0)),
  MONO_GEN_SIX_VICTORY: new ChallengeAchv("MONO_GEN_SIX", "",  "MONO_GEN_SIX.description", "ribbon_gen6", 100, (c, scene) => c instanceof SingleGenerationChallenge && c.value === 6 && !scene.gameMode.challenges.some(c => c.id === Challenges.INVERSE_BATTLE && c.value > 0)),
  MONO_GEN_SEVEN_VICTORY: new ChallengeAchv("MONO_GEN_SEVEN", "",  "MONO_GEN_SEVEN.description", "ribbon_gen7", 100, (c, scene) => c instanceof SingleGenerationChallenge && c.value === 7 && !scene.gameMode.challenges.some(c => c.id === Challenges.INVERSE_BATTLE && c.value > 0)),
  MONO_GEN_EIGHT_VICTORY: new ChallengeAchv("MONO_GEN_EIGHT", "",  "MONO_GEN_EIGHT.description", "ribbon_gen8", 100, (c, scene) => c instanceof SingleGenerationChallenge && c.value === 8 && !scene.gameMode.challenges.some(c => c.id === Challenges.INVERSE_BATTLE && c.value > 0)),
  MONO_GEN_NINE_VICTORY: new ChallengeAchv("MONO_GEN_NINE", "",  "MONO_GEN_NINE.description", "ribbon_gen9", 100, (c, scene) => c instanceof SingleGenerationChallenge && c.value === 9 && !scene.gameMode.challenges.some(c => c.id === Challenges.INVERSE_BATTLE && c.value > 0)),
  MONO_NORMAL: new ChallengeAchv("MONO_NORMAL", "", "MONO_NORMAL.description", "silk_scarf", 100, (c, scene) => c instanceof SingleTypeChallenge && c.value === 1 && !scene.gameMode.challenges.some(c => c.id === Challenges.INVERSE_BATTLE && c.value > 0)),
  MONO_FIGHTING: new ChallengeAchv("MONO_FIGHTING", "", "MONO_FIGHTING.description", "black_belt", 100, (c, scene) => c instanceof SingleTypeChallenge && c.value === 2 && !scene.gameMode.challenges.some(c => c.id === Challenges.INVERSE_BATTLE && c.value > 0)),
  MONO_FLYING: new ChallengeAchv("MONO_FLYING", "", "MONO_FLYING.description", "sharp_beak", 100, (c, scene) => c instanceof SingleTypeChallenge && c.value === 3 && !scene.gameMode.challenges.some(c => c.id === Challenges.INVERSE_BATTLE && c.value > 0)),
  MONO_POISON: new ChallengeAchv("MONO_POISON", "", "MONO_POISON.description", "poison_barb", 100, (c, scene) => c instanceof SingleTypeChallenge && c.value === 4 && !scene.gameMode.challenges.some(c => c.id === Challenges.INVERSE_BATTLE && c.value > 0)),
  MONO_GROUND: new ChallengeAchv("MONO_GROUND", "", "MONO_GROUND.description", "soft_sand", 100, (c, scene) => c instanceof SingleTypeChallenge && c.value === 5 && !scene.gameMode.challenges.some(c => c.id === Challenges.INVERSE_BATTLE && c.value > 0)),
  MONO_ROCK: new ChallengeAchv("MONO_ROCK", "", "MONO_ROCK.description", "hard_stone", 100, (c, scene) => c instanceof SingleTypeChallenge && c.value === 6 && !scene.gameMode.challenges.some(c => c.id === Challenges.INVERSE_BATTLE && c.value > 0)),
  MONO_BUG: new ChallengeAchv("MONO_BUG", "", "MONO_BUG.description", "silver_powder", 100, (c, scene) => c instanceof SingleTypeChallenge && c.value === 7 && !scene.gameMode.challenges.some(c => c.id === Challenges.INVERSE_BATTLE && c.value > 0)),
  MONO_GHOST: new ChallengeAchv("MONO_GHOST", "", "MONO_GHOST.description", "spell_tag", 100, (c, scene) => c instanceof SingleTypeChallenge && c.value === 8 && !scene.gameMode.challenges.some(c => c.id === Challenges.INVERSE_BATTLE && c.value > 0)),
  MONO_STEEL: new ChallengeAchv("MONO_STEEL", "", "MONO_STEEL.description", "metal_coat", 100, (c, scene) => c instanceof SingleTypeChallenge && c.value === 9 && !scene.gameMode.challenges.some(c => c.id === Challenges.INVERSE_BATTLE && c.value > 0)),
  MONO_FIRE: new ChallengeAchv("MONO_FIRE", "", "MONO_FIRE.description", "charcoal", 100, (c, scene) => c instanceof SingleTypeChallenge && c.value === 10 && !scene.gameMode.challenges.some(c => c.id === Challenges.INVERSE_BATTLE && c.value > 0)),
  MONO_WATER: new ChallengeAchv("MONO_WATER", "", "MONO_WATER.description", "mystic_water", 100, (c, scene) => c instanceof SingleTypeChallenge && c.value === 11 && !scene.gameMode.challenges.some(c => c.id === Challenges.INVERSE_BATTLE && c.value > 0)),
  MONO_GRASS: new ChallengeAchv("MONO_GRASS", "", "MONO_GRASS.description", "miracle_seed", 100, (c, scene) => c instanceof SingleTypeChallenge && c.value === 12 && !scene.gameMode.challenges.some(c => c.id === Challenges.INVERSE_BATTLE && c.value > 0)),
  MONO_ELECTRIC: new ChallengeAchv("MONO_ELECTRIC", "", "MONO_ELECTRIC.description", "magnet", 100, (c, scene) => c instanceof SingleTypeChallenge && c.value === 13 && !scene.gameMode.challenges.some(c => c.id === Challenges.INVERSE_BATTLE && c.value > 0)),
  MONO_PSYCHIC: new ChallengeAchv("MONO_PSYCHIC", "", "MONO_PSYCHIC.description", "twisted_spoon", 100, (c, scene) => c instanceof SingleTypeChallenge && c.value === 14 && !scene.gameMode.challenges.some(c => c.id === Challenges.INVERSE_BATTLE && c.value > 0)),
  MONO_ICE: new ChallengeAchv("MONO_ICE", "", "MONO_ICE.description", "never_melt_ice", 100, (c, scene) => c instanceof SingleTypeChallenge && c.value === 15 && !scene.gameMode.challenges.some(c => c.id === Challenges.INVERSE_BATTLE && c.value > 0)),
  MONO_DRAGON: new ChallengeAchv("MONO_DRAGON", "", "MONO_DRAGON.description", "dragon_fang", 100, (c, scene) => c instanceof SingleTypeChallenge && c.value === 16 && !scene.gameMode.challenges.some(c => c.id === Challenges.INVERSE_BATTLE && c.value > 0)),
  MONO_DARK: new ChallengeAchv("MONO_DARK", "", "MONO_DARK.description", "black_glasses", 100, (c, scene) => c instanceof SingleTypeChallenge && c.value === 17 && !scene.gameMode.challenges.some(c => c.id === Challenges.INVERSE_BATTLE && c.value > 0)),
  MONO_FAIRY: new ChallengeAchv("MONO_FAIRY", "", "MONO_FAIRY.description", "fairy_feather", 100, (c, scene) => c instanceof SingleTypeChallenge && c.value === 18 && !scene.gameMode.challenges.some(c => c.id === Challenges.INVERSE_BATTLE && c.value > 0)),
  FRESH_START: new ChallengeAchv("FRESH_START", "", "FRESH_START.description", "reviver_seed", 100, (c, scene) => c instanceof FreshStartChallenge && c.value > 0 && !scene.gameMode.challenges.some(c => c.id === Challenges.INVERSE_BATTLE && c.value > 0)),
  INVERSE_BATTLE: new ChallengeAchv("INVERSE_BATTLE", "", "INVERSE_BATTLE.description", "inverse", 100, c => c instanceof InverseBattleChallenge && c.value > 0),
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
