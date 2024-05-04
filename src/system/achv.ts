import { Modifier } from "typescript";
import BattleScene from "../battle-scene";
import * as Utils from "../utils";
import { TurnHeldItemTransferModifier } from "../modifier/modifier";

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
    if (this.score >= 150)
      return AchvTier.MASTER;
    if (this.score >= 100)
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
    super(name, `Accumulate a total of ₽${moneyAmount.toLocaleString('en-US')}`, iconImage, score, (scene: BattleScene, _args: any[]) => scene.money >= this.moneyAmount);

    this.moneyAmount = moneyAmount;
  }
}

export class DamageAchv extends Achv {
  private damageAmount: integer;

  constructor(name: string, damageAmount: integer, iconImage: string, score: integer) {
    super(name, `Inflict ${damageAmount.toLocaleString('en-US')} damage in one hit`, iconImage, score, (_scene: BattleScene, args: any[]) => (args[0] as Utils.NumberHolder).value >= this.damageAmount);

    this.damageAmount = damageAmount;
  }
}

export class HealAchv extends Achv {
  private healAmount: integer;

  constructor(name: string, healAmount: integer, iconImage: string, score: integer) {
    super(name, `Heal ${healAmount.toLocaleString('en-US')} HP at once with a move, ability, or held item`, iconImage, score, (_scene: BattleScene, args: any[]) => (args[0] as Utils.NumberHolder).value >= this.healAmount);

    this.healAmount = healAmount;
  }
}

export class LevelAchv extends Achv {
  private level: integer;

  constructor(name: string, level: integer, iconImage: string, score: integer) {
    super(name, `Level up a Pokémon to Lv${level}`, iconImage, score, (scene: BattleScene, args: any[]) => (args[0] as Utils.IntegerHolder).value >= this.level);

    this.level = level;
  }
}

export class ModifierAchv extends Achv {
  constructor(name: string, description: string, iconImage: string, score: integer, modifierFunc: (modifier: Modifier) => boolean) {
    super(name, description, iconImage, score, (_scene: BattleScene, args: any[]) => modifierFunc((args[0] as Modifier)));
  }
}

export const achvs = {
  _10K_MONEY: new MoneyAchv('Money Haver', 10000, 'nugget', 10),
  _100K_MONEY: new MoneyAchv('Rich', 100000, 'big_nugget', 25).setSecret(true),
  _1M_MONEY: new MoneyAchv('Millionaire', 1000000, 'relic_gold', 50).setSecret(true),
  _10M_MONEY: new MoneyAchv('One Percenter', 10000000, 'coin_case', 100).setSecret(true),
  _250_DMG: new DamageAchv('Hard Hitter', 250, 'lucky_punch', 10),
  _1000_DMG: new DamageAchv('Harder Hitter', 1000, 'lucky_punch_great', 25).setSecret(true),
  _2500_DMG: new DamageAchv('That\'s a Lotta Damage!', 2500, 'lucky_punch_ultra', 50).setSecret(true),
  _10000_DMG: new DamageAchv('One Punch Man', 10000, 'lucky_punch_master', 100).setSecret(true),
  _250_HEAL: new HealAchv('Novice Healer', 250, 'potion', 10),
  _1000_HEAL: new HealAchv('Big Healer', 1000, 'super_potion', 25).setSecret(true),
  _2500_HEAL: new HealAchv('Cleric', 2500, 'hyper_potion', 50).setSecret(true),
  _10000_HEAL: new HealAchv('Recovery Master', 10000, 'max_potion', 100).setSecret(true),
  LV_100: new LevelAchv('But Wait, There\'s More!', 100, 'rare_candy', 25).setSecret(),
  LV_250: new LevelAchv('Elite', 250, 'rarer_candy', 50).setSecret(true),
  LV_1000: new LevelAchv('To Go Even Further Beyond', 1000, 'candy_jar', 100).setSecret(true),
  TRANSFER_MAX_BATTLE_STAT: new Achv('Teamwork', 'Baton pass to another party member with at least one stat maxed out', 'stick', 20),
  MAX_FRIENDSHIP: new Achv('Friendmaxxing', 'Reach max friendship on a Pokémon', 'soothe_bell', 25),
  MEGA_EVOLVE: new Achv('Megamorph', 'Mega evolve a Pokémon', 'mega_bracelet', 50),
  GIGANTAMAX: new Achv('Absolute Unit', 'Gigantamax a Pokémon', 'dynamax_band', 50),
  TERASTALLIZE: new Achv('STAB Enthusiast', 'Terastallize a Pokémon', 'tera_orb', 25),
  STELLAR_TERASTALLIZE: new Achv('The Hidden Type', 'Stellar Terastallize a Pokémon', 'stellar_tera_shard', 25).setSecret(true),
  SPLICE: new Achv('Infinite Fusion', 'Splice two Pokémon together with DNA Splicers', 'dna_splicers', 10),
  MINI_BLACK_HOLE: new ModifierAchv('A Hole Lot of Items', 'Acquire a Mini Black Hole', 'mini_black_hole', 25, modifier => modifier instanceof TurnHeldItemTransferModifier).setSecret(),
  CATCH_MYTHICAL: new Achv('Mythical', 'Catch a mythical Pokémon', 'strange_ball', 50).setSecret(),
  CATCH_LEGENDARY: new Achv('Legendary', 'Catch a legendary Pokémon', 'mb', 75).setSecret(),
  SEE_SHINY: new Achv('Shiny', 'Find a shiny Pokémon in the wild', 'pb_gold', 75),
  SHINY_PARTY: new Achv('That\'s Dedication', 'Have a full party of shiny Pokémon', 'shiny_charm', 100).setSecret(true),
  HATCH_MYTHICAL: new Achv('Mythical Egg', 'Hatch a mythical Pokémon from an egg', 'pair_of_tickets', 75).setSecret(),
  HATCH_LEGENDARY: new Achv('Legendary Egg', 'Hatch a legendary Pokémon from an egg', 'mystic_ticket', 100).setSecret(),
  HATCH_SHINY: new Achv('Shiny Egg', 'Hatch a shiny Pokémon from an egg', 'golden_mystic_ticket', 100).setSecret(),
  HIDDEN_ABILITY: new Achv('Hidden Potential', 'Catch a Pokémon with a hidden ability', 'ability_charm', 75),
  PERFECT_IVS: new Achv('Certificate of Authenticity', 'Get perfect IVs on a Pokémon', 'blunder_policy', 100),
  CLASSIC_VICTORY: new Achv('Undefeated', 'Beat the game in classic mode', 'relic_crown', 150)
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