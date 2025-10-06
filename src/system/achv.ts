import { globalScene } from "#app/global-scene";
import { pokemonEvolutions } from "#balance/pokemon-evolutions";
import type { Challenge } from "#data/challenge";
import {
  FlipStatChallenge,
  FreshStartChallenge,
  InverseBattleChallenge,
  SingleGenerationChallenge,
  SingleTypeChallenge,
} from "#data/challenge";
import { Challenges } from "#enums/challenges";
import { PlayerGender } from "#enums/player-gender";
import { getShortenedStatKey, Stat } from "#enums/stat";
import { TurnHeldItemTransferModifier } from "#modifiers/modifier";
import type { ConditionFn } from "#types/common";
import { isNuzlockeChallenge } from "#utils/challenge-utils";
import { NumberHolder } from "#utils/common";
import { toCamelCase } from "#utils/strings";
import i18next from "i18next";
import type { Modifier } from "typescript";

export enum AchvTier {
  COMMON,
  GREAT,
  ULTRA,
  ROGUE,
  MASTER,
}

export class Achv {
  public localizationKey: string;
  public id: string;
  public name: string;
  public description: string;
  public iconImage: string;
  public score: number;

  public secret: boolean;
  public hasParent: boolean;
  public parentId: string;

  private conditionFunc: ConditionFn | undefined;

  constructor(
    localizationKey: string,
    description: string,
    iconImage: string,
    score: number,
    conditionFunc?: ConditionFn,
  ) {
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
    return i18next.t(`achv:${this.localizationKey}.name`, {
      context: genderStr,
    });
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

  validate(args?: any[]): boolean {
    return !this.conditionFunc || this.conditionFunc(args);
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
  moneyAmount: number;

  constructor(localizationKey: string, moneyAmount: number, iconImage: string, score: number) {
    super(localizationKey, "", iconImage, score, (_args: any[]) => globalScene.money >= this.moneyAmount);
    this.moneyAmount = moneyAmount;
  }
}

export class RibbonAchv extends Achv {
  ribbonAmount: number;

  constructor(localizationKey: string, ribbonAmount: number, iconImage: string, score: number) {
    super(
      localizationKey,
      "",
      iconImage,
      score,
      (_args: any[]) => globalScene.gameData.gameStats.ribbonsOwned >= this.ribbonAmount,
    );
    this.ribbonAmount = ribbonAmount;
  }
}

export class DamageAchv extends Achv {
  damageAmount: number;

  constructor(localizationKey: string, damageAmount: number, iconImage: string, score: number) {
    super(
      localizationKey,
      "",
      iconImage,
      score,
      (args: any[]) => (args[0] instanceof NumberHolder ? args[0].value : args[0]) >= this.damageAmount,
    );
    this.damageAmount = damageAmount;
  }
}

export class HealAchv extends Achv {
  healAmount: number;

  constructor(localizationKey: string, healAmount: number, iconImage: string, score: number) {
    super(
      localizationKey,
      "",
      iconImage,
      score,
      (args: any[]) => (args[0] instanceof NumberHolder ? args[0].value : args[0]) >= this.healAmount,
    );
    this.healAmount = healAmount;
  }
}

export class LevelAchv extends Achv {
  level: number;

  constructor(localizationKey: string, level: number, iconImage: string, score: number) {
    super(
      localizationKey,
      "",
      iconImage,
      score,
      (args: any[]) => (args[0] instanceof NumberHolder ? args[0].value : args[0]) >= this.level,
    );
    this.level = level;
  }
}

export class ModifierAchv extends Achv {
  constructor(
    localizationKey: string,
    description: string,
    iconImage: string,
    score: number,
    modifierFunc: (modifier: Modifier) => boolean,
  ) {
    super(localizationKey, description, iconImage, score, (args: any[]) => modifierFunc(args[0] as Modifier));
  }
}

export class ChallengeAchv extends Achv {
  constructor(
    localizationKey: string,
    description: string,
    iconImage: string,
    score: number,
    challengeFunc: (challenge: Challenge) => boolean,
  ) {
    super(localizationKey, description, iconImage, score, (args: any[]) => challengeFunc(args[0] as Challenge));
  }
}

/**
 * Get the description of an achievement from the localization file with all the necessary variables filled in
 * @param localizationKey The localization key of the achievement
 * @returns The description of the achievement
 */
export function getAchievementDescription(localizationKey: string): string {
  // We need to get the player gender from the game data to add the correct prefix to the achievement name
  const genderIndex = globalScene?.gameData?.gender ?? PlayerGender.MALE;
  const genderStr = PlayerGender[genderIndex].toLowerCase();

  switch (localizationKey) {
    case "10KMoney":
      return i18next.t("achv:moneyAchv.description", {
        context: genderStr,
        moneyAmount: achvs._10K_MONEY.moneyAmount.toLocaleString("en-US"),
      });
    case "100KMoney":
      return i18next.t("achv:moneyAchv.description", {
        context: genderStr,
        moneyAmount: achvs._100K_MONEY.moneyAmount.toLocaleString("en-US"),
      });
    case "1MMoney":
      return i18next.t("achv:moneyAchv.description", {
        context: genderStr,
        moneyAmount: achvs._1M_MONEY.moneyAmount.toLocaleString("en-US"),
      });
    case "10MMoney":
      return i18next.t("achv:moneyAchv.description", {
        context: genderStr,
        moneyAmount: achvs._10M_MONEY.moneyAmount.toLocaleString("en-US"),
      });
    case "250Dmg":
      return i18next.t("achv:damageAchv.description", {
        context: genderStr,
        damageAmount: achvs._250_DMG.damageAmount.toLocaleString("en-US"),
      });
    case "1000Dmg":
      return i18next.t("achv:damageAchv.description", {
        context: genderStr,
        damageAmount: achvs._1000_DMG.damageAmount.toLocaleString("en-US"),
      });
    case "2500Dmg":
      return i18next.t("achv:damageAchv.description", {
        context: genderStr,
        damageAmount: achvs._2500_DMG.damageAmount.toLocaleString("en-US"),
      });
    case "10000Dmg":
      return i18next.t("achv:damageAchv.description", {
        context: genderStr,
        damageAmount: achvs._10000_DMG.damageAmount.toLocaleString("en-US"),
      });
    case "250Heal":
      return i18next.t("achv:healAchv.description", {
        context: genderStr,
        healAmount: achvs._250_HEAL.healAmount.toLocaleString("en-US"),
        HP: i18next.t(getShortenedStatKey(Stat.HP)),
      });
    case "1000Heal":
      return i18next.t("achv:healAchv.description", {
        context: genderStr,
        healAmount: achvs._1000_HEAL.healAmount.toLocaleString("en-US"),
        HP: i18next.t(getShortenedStatKey(Stat.HP)),
      });
    case "2500Heal":
      return i18next.t("achv:healAchv.description", {
        context: genderStr,
        healAmount: achvs._2500_HEAL.healAmount.toLocaleString("en-US"),
        HP: i18next.t(getShortenedStatKey(Stat.HP)),
      });
    case "10000Heal":
      return i18next.t("achv:healAchv.description", {
        context: genderStr,
        healAmount: achvs._10000_HEAL.healAmount.toLocaleString("en-US"),
        HP: i18next.t(getShortenedStatKey(Stat.HP)),
      });
    case "lv100":
      return i18next.t("achv:levelAchv.description", {
        context: genderStr,
        level: achvs.LV_100.level,
      });
    case "lv250":
      return i18next.t("achv:levelAchv.description", {
        context: genderStr,
        level: achvs.LV_250.level,
      });
    case "lv1000":
      return i18next.t("achv:levelAchv.description", {
        context: genderStr,
        level: achvs.LV_1000.level,
      });
    case "10Ribbons":
      return i18next.t("achv:ribbonAchv.description", {
        context: genderStr,
        ribbonAmount: achvs._10_RIBBONS.ribbonAmount.toLocaleString("en-US"),
      });
    case "25Ribbons":
      return i18next.t("achv:ribbonAchv.description", {
        context: genderStr,
        ribbonAmount: achvs._25_RIBBONS.ribbonAmount.toLocaleString("en-US"),
      });
    case "50Ribbons":
      return i18next.t("achv:ribbonAchv.description", {
        context: genderStr,
        ribbonAmount: achvs._50_RIBBONS.ribbonAmount.toLocaleString("en-US"),
      });
    case "75Ribbons":
      return i18next.t("achv:ribbonAchv.description", {
        context: genderStr,
        ribbonAmount: achvs._75_RIBBONS.ribbonAmount.toLocaleString("en-US"),
      });
    case "100Ribbons":
      return i18next.t("achv:ribbonAchv.description", {
        context: genderStr,
        ribbonAmount: achvs._100_RIBBONS.ribbonAmount.toLocaleString("en-US"),
      });
    case "transferMaxStatStage":
      return i18next.t("achv:transferMaxStatStage.description", {
        context: genderStr,
      });
    case "maxFriendship":
      return i18next.t("achv:maxFriendship.description", {
        context: genderStr,
      });
    case "megaEvolve":
      return i18next.t("achv:megaEvolve.description", { context: genderStr });
    case "gigantamax":
      return i18next.t("achv:gigantamax.description", { context: genderStr });
    case "terastallize":
      return i18next.t("achv:terastallize.description", { context: genderStr });
    case "stellarTerastallize":
      return i18next.t("achv:stellarTerastallize.description", {
        context: genderStr,
      });
    case "splice":
      return i18next.t("achv:splice.description", { context: genderStr });
    case "miniBlackHole":
      return i18next.t("achv:miniBlackHole.description", {
        context: genderStr,
      });
    case "catchMythical":
      return i18next.t("achv:catchMythical.description", {
        context: genderStr,
      });
    case "catchSubLegendary":
      return i18next.t("achv:catchSubLegendary.description", {
        context: genderStr,
      });
    case "catchLegendary":
      return i18next.t("achv:catchLegendary.description", {
        context: genderStr,
      });
    case "seeShiny":
      return i18next.t("achv:seeShiny.description", { context: genderStr });
    case "shinyParty":
      return i18next.t("achv:shinyParty.description", { context: genderStr });
    case "hatchMythical":
      return i18next.t("achv:hatchMythical.description", {
        context: genderStr,
      });
    case "hatchSubLegendary":
      return i18next.t("achv:hatchSubLegendary.description", {
        context: genderStr,
      });
    case "hatchLegendary":
      return i18next.t("achv:hatchLegendary.description", {
        context: genderStr,
      });
    case "hatchShiny":
      return i18next.t("achv:hatchShiny.description", { context: genderStr });
    case "hiddenAbility":
      return i18next.t("achv:hiddenAbility.description", {
        context: genderStr,
      });
    case "perfectIvs":
      return i18next.t("achv:perfectIvs.description", { context: genderStr });
    case "classicVictory":
      return i18next.t("achv:classicVictory.description", {
        context: genderStr,
      });
    case "unevolvedClassicVictory":
      return i18next.t("achv:unevolvedClassicVictory.description", {
        context: genderStr,
      });
    case "monoGenOne":
      return i18next.t("achv:monoGenOne.description", { context: genderStr });
    case "monoGenTwo":
      return i18next.t("achv:monoGenTwo.description", { context: genderStr });
    case "monoGenThree":
      return i18next.t("achv:monoGenThree.description", {
        context: genderStr,
      });
    case "monoGenFour":
      return i18next.t("achv:monoGenFour.description", {
        context: genderStr,
      });
    case "monoGenFive":
      return i18next.t("achv:monoGenFive.description", {
        context: genderStr,
      });
    case "monoGenSix":
      return i18next.t("achv:monoGenSix.description", { context: genderStr });
    case "monoGenSeven":
      return i18next.t("achv:monoGenSeven.description", {
        context: genderStr,
      });
    case "monoGenEight":
      return i18next.t("achv:monoGenEight.description", {
        context: genderStr,
      });
    case "monoGenNine":
      return i18next.t("achv:monoGenNine.description", {
        context: genderStr,
      });
    case "monoNormal":
    case "monoFighting":
    case "monoFlying":
    case "monoPoison":
    case "monoGround":
    case "monoRock":
    case "monoBug":
    case "monoGhost":
    case "monoSteel":
    case "monoFire":
    case "monoWater":
    case "monoGrass":
    case "monoElectric":
    case "monoPsychic":
    case "monoIce":
    case "monoDragon":
    case "monoDark":
    case "monoFairy":
      return i18next.t("achv:monoType.description", {
        context: genderStr,
        type: i18next.t(`pokemonInfo:type.${toCamelCase(localizationKey.slice(4))}`),
      });
    case "freshStart":
      return i18next.t("achv:freshStart.description", { context: genderStr });
    case "inverseBattle":
      return i18next.t("achv:inverseBattle.description", {
        context: genderStr,
      });
    case "flipStats":
      return i18next.t("achv:flipStats.description", { context: genderStr });
    case "flipInverse":
      return i18next.t("achv:flipInverse.description", { context: genderStr });
    case "nuzlocke":
      return i18next.t("achv:nuzlocke.description", { context: genderStr });
    case "breedersInSpace":
      return i18next.t("achv:breedersInSpace.description", {
        context: genderStr,
      });
    case "dailyVictory":
      return i18next.t("achv:dailyVictory.description", { context: genderStr });
    default:
      return "";
  }
}

export const achvs = {
  CLASSIC_VICTORY: new Achv(
    "classicVictory",
    "classicVictory.description",
    "relic_crown",
    250,
    _ => globalScene.gameData.gameStats.sessionsWon === 0,
  ),
  _10_RIBBONS: new RibbonAchv("10Ribbons", 10, "common_ribbon", 50),
  _25_RIBBONS: new RibbonAchv("25Ribbons", 25, "great_ribbon", 75),
  _50_RIBBONS: new RibbonAchv("50Ribbons", 50, "ultra_ribbon", 100),
  _75_RIBBONS: new RibbonAchv("75Ribbons", 75, "rogue_ribbon", 125),
  _100_RIBBONS: new RibbonAchv("100Ribbons", 100, "master_ribbon", 150),
  _10K_MONEY: new MoneyAchv("10KMoney", 10000, "nugget", 25),
  _100K_MONEY: new MoneyAchv("100KMoney", 100000, "big_nugget", 25).setSecret(true),
  _1M_MONEY: new MoneyAchv("1MMoney", 1000000, "relic_gold", 50).setSecret(true),
  _10M_MONEY: new MoneyAchv("10MMoney", 10000000, "coin_case", 50).setSecret(true),
  _250_DMG: new DamageAchv("250Dmg", 250, "lucky_punch", 25),
  _1000_DMG: new DamageAchv("1000Dmg", 1000, "lucky_punch_great", 25).setSecret(true),
  _2500_DMG: new DamageAchv("2500Dmg", 2500, "lucky_punch_ultra", 50).setSecret(true),
  _10000_DMG: new DamageAchv("10000Dmg", 10000, "lucky_punch_master", 50).setSecret(true),
  _250_HEAL: new HealAchv("250Heal", 250, "potion", 25),
  _1000_HEAL: new HealAchv("1000Heal", 1000, "super_potion", 25).setSecret(true),
  _2500_HEAL: new HealAchv("2500Heal", 2500, "hyper_potion", 50).setSecret(true),
  _10000_HEAL: new HealAchv("10000Heal", 10000, "max_potion", 50).setSecret(true),
  LV_100: new LevelAchv("lv100", 100, "rare_candy", 25).setSecret(),
  LV_250: new LevelAchv("lv250", 250, "rarer_candy", 25).setSecret(true),
  LV_1000: new LevelAchv("lv1000", 1000, "candy_jar", 50).setSecret(true),
  TRANSFER_MAX_STAT_STAGE: new Achv("transferMaxStatStage", "transferMaxStatStage.description", "baton", 25),
  MAX_FRIENDSHIP: new Achv("maxFriendship", "maxFriendship.description", "soothe_bell", 25),
  MEGA_EVOLVE: new Achv("megaEvolve", "megaEvolve.description", "mega_bracelet", 50),
  GIGANTAMAX: new Achv("gigantamax", "gigantamax.description", "dynamax_band", 50),
  TERASTALLIZE: new Achv("terastallize", "terastallize.description", "tera_orb", 25),
  STELLAR_TERASTALLIZE: new Achv(
    "stellarTerastallize",
    "stellarTerastallize.description",
    "stellar_tera_shard",
    25,
  ).setSecret(true),
  SPLICE: new Achv("splice", "splice.description", "dna_splicers", 50),
  MINI_BLACK_HOLE: new ModifierAchv(
    "miniBlackHole",
    "miniBlackHole.description",
    "mini_black_hole",
    25,
    modifier => modifier instanceof TurnHeldItemTransferModifier,
  ).setSecret(),
  HIDDEN_ABILITY: new Achv("hiddenAbility", "hiddenAbility.description", "ability_charm", 25),
  PERFECT_IVS: new Achv("perfectIvs", "perfectIvs.description", "blunder_policy", 25),
  SEE_SHINY: new Achv("seeShiny", "seeShiny.description", "pb_gold", 50),
  SHINY_PARTY: new Achv("shinyParty", "shinyParty.description", "shiny_charm", 50).setSecret(true),
  CATCH_SUB_LEGENDARY: new Achv("catchSubLegendary", "catchSubLegendary.description", "rb", 50).setSecret(),
  CATCH_MYTHICAL: new Achv("catchMythical", "catchMythical.description", "strange_ball", 75).setSecret(),
  CATCH_LEGENDARY: new Achv("catchLegendary", "catchLegendary.description", "mb", 100).setSecret(),
  HATCH_SUB_LEGENDARY: new Achv("hatchSubLegendary", "hatchSubLegendary.description", "epic_egg", 50).setSecret(),
  HATCH_MYTHICAL: new Achv("hatchMythical", "hatchMythical.description", "manaphy_egg", 50).setSecret(),
  HATCH_LEGENDARY: new Achv("hatchLegendary", "hatchLegendary.description", "legendary_egg", 100).setSecret(),
  HATCH_SHINY: new Achv("hatchShiny", "hatchShiny.description", "rogue_egg", 100).setSecret(),
  DAILY_VICTORY: new Achv("dailyVictory", "dailyVictory.description", "calendar", 100),
  FRESH_START: new ChallengeAchv(
    "freshStart",
    "freshStart.description",
    "reviver_seed",
    100,
    c =>
      c instanceof FreshStartChallenge
      && c.value === 1
      && !globalScene.gameMode.challenges.some(
        c => [Challenges.INVERSE_BATTLE, Challenges.FLIP_STAT].includes(c.id) && c.value > 0,
      ),
  ),
  NUZLOCKE: new ChallengeAchv("nuzlocke", "nuzlocke.description", "leaf_stone", 100, isNuzlockeChallenge),
  INVERSE_BATTLE: new ChallengeAchv(
    "inverseBattle",
    "inverseBattle.description",
    "inverse",
    100,
    c => c instanceof InverseBattleChallenge && c.value > 0,
  ),
  FLIP_STATS: new ChallengeAchv(
    "flipStats",
    "flipStats.description",
    "dubious_disc",
    100,
    c => c instanceof FlipStatChallenge && c.value > 0,
  ),
  MONO_GEN_ONE_VICTORY: new ChallengeAchv(
    "monoGenOne",
    "monoGenOne.description",
    "ribbon_gen1",
    100,
    c =>
      c instanceof SingleGenerationChallenge
      && c.value === 1
      && !globalScene.gameMode.challenges.some(
        c => [Challenges.INVERSE_BATTLE, Challenges.FLIP_STAT].includes(c.id) && c.value > 0,
      ),
  ),
  MONO_GEN_TWO_VICTORY: new ChallengeAchv(
    "monoGenTwo",
    "monoGenTwo.description",
    "ribbon_gen2",
    100,
    c =>
      c instanceof SingleGenerationChallenge
      && c.value === 2
      && !globalScene.gameMode.challenges.some(
        c => [Challenges.INVERSE_BATTLE, Challenges.FLIP_STAT].includes(c.id) && c.value > 0,
      ),
  ),
  MONO_GEN_THREE_VICTORY: new ChallengeAchv(
    "monoGenThree",
    "monoGenThree.description",
    "ribbon_gen3",
    100,
    c =>
      c instanceof SingleGenerationChallenge
      && c.value === 3
      && !globalScene.gameMode.challenges.some(
        c => [Challenges.INVERSE_BATTLE, Challenges.FLIP_STAT].includes(c.id) && c.value > 0,
      ),
  ),
  MONO_GEN_FOUR_VICTORY: new ChallengeAchv(
    "monoGenFour",
    "monoGenFour.description",
    "ribbon_gen4",
    100,
    c =>
      c instanceof SingleGenerationChallenge
      && c.value === 4
      && !globalScene.gameMode.challenges.some(
        c => [Challenges.INVERSE_BATTLE, Challenges.FLIP_STAT].includes(c.id) && c.value > 0,
      ),
  ),
  MONO_GEN_FIVE_VICTORY: new ChallengeAchv(
    "monoGenFive",
    "monoGenFive.description",
    "ribbon_gen5",
    100,
    c =>
      c instanceof SingleGenerationChallenge
      && c.value === 5
      && !globalScene.gameMode.challenges.some(
        c => [Challenges.INVERSE_BATTLE, Challenges.FLIP_STAT].includes(c.id) && c.value > 0,
      ),
  ),
  MONO_GEN_SIX_VICTORY: new ChallengeAchv(
    "monoGenSix",
    "monoGenSix.description",
    "ribbon_gen6",
    100,
    c =>
      c instanceof SingleGenerationChallenge
      && c.value === 6
      && !globalScene.gameMode.challenges.some(
        c => [Challenges.INVERSE_BATTLE, Challenges.FLIP_STAT].includes(c.id) && c.value > 0,
      ),
  ),
  MONO_GEN_SEVEN_VICTORY: new ChallengeAchv(
    "monoGenSeven",
    "monoGenSeven.description",
    "ribbon_gen7",
    100,
    c =>
      c instanceof SingleGenerationChallenge
      && c.value === 7
      && !globalScene.gameMode.challenges.some(
        c => [Challenges.INVERSE_BATTLE, Challenges.FLIP_STAT].includes(c.id) && c.value > 0,
      ),
  ),
  MONO_GEN_EIGHT_VICTORY: new ChallengeAchv(
    "monoGenEight",
    "monoGenEight.description",
    "ribbon_gen8",
    100,
    c =>
      c instanceof SingleGenerationChallenge
      && c.value === 8
      && !globalScene.gameMode.challenges.some(
        c => [Challenges.INVERSE_BATTLE, Challenges.FLIP_STAT].includes(c.id) && c.value > 0,
      ),
  ),
  MONO_GEN_NINE_VICTORY: new ChallengeAchv(
    "monoGenNine",
    "monoGenNine.description",
    "ribbon_gen9",
    100,
    c =>
      c instanceof SingleGenerationChallenge
      && c.value === 9
      && !globalScene.gameMode.challenges.some(
        c => [Challenges.INVERSE_BATTLE, Challenges.FLIP_STAT].includes(c.id) && c.value > 0,
      ),
  ),
  MONO_NORMAL: new ChallengeAchv(
    "monoNormal",
    "monoNormal.description",
    "silk_scarf",
    100,
    c =>
      c instanceof SingleTypeChallenge
      && c.value === 1
      && !globalScene.gameMode.challenges.some(
        c => [Challenges.INVERSE_BATTLE, Challenges.FLIP_STAT].includes(c.id) && c.value > 0,
      ),
  ),
  MONO_FIGHTING: new ChallengeAchv(
    "monoFighting",
    "monoFighting.description",
    "black_belt",
    100,
    c =>
      c instanceof SingleTypeChallenge
      && c.value === 2
      && !globalScene.gameMode.challenges.some(
        c => [Challenges.INVERSE_BATTLE, Challenges.FLIP_STAT].includes(c.id) && c.value > 0,
      ),
  ),
  MONO_FLYING: new ChallengeAchv(
    "monoFlying",
    "monoFlying.description",
    "sharp_beak",
    100,
    c =>
      c instanceof SingleTypeChallenge
      && c.value === 3
      && !globalScene.gameMode.challenges.some(
        c => [Challenges.INVERSE_BATTLE, Challenges.FLIP_STAT].includes(c.id) && c.value > 0,
      ),
  ),
  MONO_POISON: new ChallengeAchv(
    "monoPoison",
    "monoPoison.description",
    "poison_barb",
    100,
    c =>
      c instanceof SingleTypeChallenge
      && c.value === 4
      && !globalScene.gameMode.challenges.some(
        c => [Challenges.INVERSE_BATTLE, Challenges.FLIP_STAT].includes(c.id) && c.value > 0,
      ),
  ),
  MONO_GROUND: new ChallengeAchv(
    "monoGround",
    "monoGround.description",
    "soft_sand",
    100,
    c =>
      c instanceof SingleTypeChallenge
      && c.value === 5
      && !globalScene.gameMode.challenges.some(
        c => [Challenges.INVERSE_BATTLE, Challenges.FLIP_STAT].includes(c.id) && c.value > 0,
      ),
  ),
  MONO_ROCK: new ChallengeAchv(
    "monoRock",
    "monoRock.description",
    "hard_stone",
    100,
    c =>
      c instanceof SingleTypeChallenge
      && c.value === 6
      && !globalScene.gameMode.challenges.some(
        c => [Challenges.INVERSE_BATTLE, Challenges.FLIP_STAT].includes(c.id) && c.value > 0,
      ),
  ),
  MONO_BUG: new ChallengeAchv(
    "monoBug",
    "monoBug.description",
    "silver_powder",
    100,
    c =>
      c instanceof SingleTypeChallenge
      && c.value === 7
      && !globalScene.gameMode.challenges.some(
        c => [Challenges.INVERSE_BATTLE, Challenges.FLIP_STAT].includes(c.id) && c.value > 0,
      ),
  ),
  MONO_GHOST: new ChallengeAchv(
    "monoGhost",
    "monoGhost.description",
    "spell_tag",
    100,
    c =>
      c instanceof SingleTypeChallenge
      && c.value === 8
      && !globalScene.gameMode.challenges.some(
        c => [Challenges.INVERSE_BATTLE, Challenges.FLIP_STAT].includes(c.id) && c.value > 0,
      ),
  ),
  MONO_STEEL: new ChallengeAchv(
    "monoSteel",
    "monoSteel.description",
    "metal_coat",
    100,
    c =>
      c instanceof SingleTypeChallenge
      && c.value === 9
      && !globalScene.gameMode.challenges.some(
        c => [Challenges.INVERSE_BATTLE, Challenges.FLIP_STAT].includes(c.id) && c.value > 0,
      ),
  ),
  MONO_FIRE: new ChallengeAchv(
    "monoFire",
    "monoFire.description",
    "charcoal",
    100,
    c =>
      c instanceof SingleTypeChallenge
      && c.value === 10
      && !globalScene.gameMode.challenges.some(
        c => [Challenges.INVERSE_BATTLE, Challenges.FLIP_STAT].includes(c.id) && c.value > 0,
      ),
  ),
  MONO_WATER: new ChallengeAchv(
    "monoWater",
    "monoWater.description",
    "mystic_water",
    100,
    c =>
      c instanceof SingleTypeChallenge
      && c.value === 11
      && !globalScene.gameMode.challenges.some(
        c => [Challenges.INVERSE_BATTLE, Challenges.FLIP_STAT].includes(c.id) && c.value > 0,
      ),
  ),
  MONO_GRASS: new ChallengeAchv(
    "monoGrass",
    "monoGrass.description",
    "miracle_seed",
    100,
    c =>
      c instanceof SingleTypeChallenge
      && c.value === 12
      && !globalScene.gameMode.challenges.some(
        c => [Challenges.INVERSE_BATTLE, Challenges.FLIP_STAT].includes(c.id) && c.value > 0,
      ),
  ),
  MONO_ELECTRIC: new ChallengeAchv(
    "monoElectric",
    "monoElectric.description",
    "magnet",
    100,
    c =>
      c instanceof SingleTypeChallenge
      && c.value === 13
      && !globalScene.gameMode.challenges.some(
        c => [Challenges.INVERSE_BATTLE, Challenges.FLIP_STAT].includes(c.id) && c.value > 0,
      ),
  ),
  MONO_PSYCHIC: new ChallengeAchv(
    "monoPsychic",
    "monoPsychic.description",
    "twisted_spoon",
    100,
    c =>
      c instanceof SingleTypeChallenge
      && c.value === 14
      && !globalScene.gameMode.challenges.some(
        c => [Challenges.INVERSE_BATTLE, Challenges.FLIP_STAT].includes(c.id) && c.value > 0,
      ),
  ),
  MONO_ICE: new ChallengeAchv(
    "monoIce",
    "monoIce.description",
    "never_melt_ice",
    100,
    c =>
      c instanceof SingleTypeChallenge
      && c.value === 15
      && !globalScene.gameMode.challenges.some(
        c => [Challenges.INVERSE_BATTLE, Challenges.FLIP_STAT].includes(c.id) && c.value > 0,
      ),
  ),
  MONO_DRAGON: new ChallengeAchv(
    "monoDragon",
    "monoDragon.description",
    "dragon_fang",
    100,
    c =>
      c instanceof SingleTypeChallenge
      && c.value === 16
      && !globalScene.gameMode.challenges.some(
        c => [Challenges.INVERSE_BATTLE, Challenges.FLIP_STAT].includes(c.id) && c.value > 0,
      ),
  ),
  MONO_DARK: new ChallengeAchv(
    "monoDark",
    "monoDark.description",
    "black_glasses",
    100,
    c =>
      c instanceof SingleTypeChallenge
      && c.value === 17
      && !globalScene.gameMode.challenges.some(
        c => [Challenges.INVERSE_BATTLE, Challenges.FLIP_STAT].includes(c.id) && c.value > 0,
      ),
  ),
  MONO_FAIRY: new ChallengeAchv(
    "monoFairy",
    "monoFairy.description",
    "fairy_feather",
    100,
    c =>
      c instanceof SingleTypeChallenge
      && c.value === 18
      && !globalScene.gameMode.challenges.some(
        c => [Challenges.INVERSE_BATTLE, Challenges.FLIP_STAT].includes(c.id) && c.value > 0,
      ),
  ),
  UNEVOLVED_CLASSIC_VICTORY: new Achv(
    "unevolvedClassicVictory",
    "unevolvedClassicVictory.description",
    "eviolite",
    50,
    _ => globalScene.getPlayerParty().some(p => p.getSpeciesForm(true).speciesId in pokemonEvolutions),
  ),
  FLIP_INVERSE: new ChallengeAchv(
    "flipInverse",
    "flipInverse.description",
    "cracked_pot",
    50,
    c =>
      c instanceof FlipStatChallenge
      && c.value > 0
      && globalScene.gameMode.challenges.some(c => c.id === Challenges.INVERSE_BATTLE && c.value > 0),
  ).setSecret(),
  BREEDERS_IN_SPACE: new Achv("breedersInSpace", "breedersInSpace.description", "moon_stone", 50).setSecret(),
};

export function initAchievements() {
  const achvKeys = Object.keys(achvs);
  achvKeys.forEach((a: string, i: number) => {
    achvs[a].id = a;
    if (achvs[a].hasParent) {
      achvs[a].parentId = achvKeys[i - 1];
    }
  });
}
