import { Moves } from "./enums/moves";
import { ChargeAnim, MoveChargeAnim, initMoveAnim, loadMoveAnimAssets } from "./battle-anims";
import { BattleEndPhase, MovePhase, NewBattlePhase, PokemonHealPhase, StatChangePhase, SwitchSummonPhase } from "../phases";
import { BattleStat, getBattleStatName } from "./battle-stat";
import { EncoreTag } from "./battler-tags";
import { BattlerTagType } from "./enums/battler-tag-type";
import { getPokemonMessage } from "../messages";
import Pokemon, { AttackMoveResult, EnemyPokemon, HitResult, MoveResult, PlayerPokemon, PokemonMove, TurnMove } from "../field/pokemon";
import { StatusEffect, getStatusEffectHealText } from "./status-effect";
import { Type } from "./type";
import * as Utils from "../utils";
import { WeatherType } from "./weather";
import { ArenaTagSide, ArenaTrapTag } from "./arena-tag";
import { ArenaTagType } from "./enums/arena-tag-type";
import { Abilities, ProtectAbilityAbAttr, BlockRecoilDamageAttr, BlockOneHitKOAbAttr, IgnoreContactAbAttr, MaxMultiHitAbAttr, applyAbAttrs } from "./ability";
import { PokemonHeldItemModifier } from "../modifier/modifier";
import { BattlerIndex } from "../battle";
import { Stat } from "./pokemon-stat";
import { TerrainType } from "./terrain";

export enum MoveCategory {
  PHYSICAL,
  SPECIAL,
  STATUS
}

export enum MoveTarget {
  USER,
  OTHER,
  ALL_OTHERS,
  NEAR_OTHER,
  ALL_NEAR_OTHERS,
  NEAR_ENEMY,
  ALL_NEAR_ENEMIES,
  RANDOM_NEAR_ENEMY,
  ALL_ENEMIES,
  ATTACKER,
  NEAR_ALLY,
  ALLY,
  USER_OR_NEAR_ALLY,
  USER_AND_ALLIES,
  ALL,
  USER_SIDE,
  ENEMY_SIDE,
  BOTH_SIDES
}

export enum MoveFlags {
  MAKES_CONTACT = 1,
  IGNORE_PROTECT = 2,
  IGNORE_VIRTUAL = 4,
  SOUND_BASED = 8,
  HIDE_USER = 16,
  HIDE_TARGET = 32,
  BITING_MOVE = 64,
  PULSE_MOVE = 128,
  PUNCHING_MOVE = 256,
  SLICING_MOVE = 512,
  BALLBOMB_MOVE = 1024,
  POWDER_MOVE = 2048,
  DANCE_MOVE = 4096,
  WIND_MOVE = 8192
}

type MoveConditionFunc = (user: Pokemon, target: Pokemon, move: Move) => boolean;
type UserMoveConditionFunc = (user: Pokemon, move: Move) => boolean;

export default class Move {
  public id: Moves;
  public name: string;
  public type: Type;
  public category: MoveCategory;
  public moveTarget: MoveTarget;
  public power: integer;
  public accuracy: integer;
  public pp: integer;
  public effect: string;
  public chance: integer;
  public priority: integer;
  public generation: integer;
  public attrs: MoveAttr[];
  private conditions: MoveCondition[];
  private flags: integer;

  constructor(id: Moves, name: string, type: Type, category: MoveCategory, defaultMoveTarget: MoveTarget, power: integer, accuracy: integer, pp: integer, effect: string, chance: integer, priority: integer, generation: integer) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.category = category;
    this.moveTarget = defaultMoveTarget;
    this.power = power;
    this.accuracy = accuracy;
    this.pp = pp;
    this.effect = effect;
    this.chance = chance;
    this.priority = priority;
    this.generation = generation;

    this.attrs = [];
    this.conditions = [];

    this.flags = 0;
    if (defaultMoveTarget === MoveTarget.USER)
      this.setFlag(MoveFlags.IGNORE_PROTECT, true);
    if (category === MoveCategory.PHYSICAL)
      this.setFlag(MoveFlags.MAKES_CONTACT, true);
  }

  getAttrs(attrType: { new(...args: any[]): MoveAttr }): MoveAttr[] {
    return this.attrs.filter(a => a instanceof attrType);
  }

  attr<T extends new (...args: any[]) => MoveAttr>(AttrType: T, ...args: ConstructorParameters<T>): this {
    const attr = new AttrType(...args);
    this.attrs.push(attr);
    let attrCondition = attr.getCondition();
    if (attrCondition) {
      if (typeof attrCondition === 'function')
        attrCondition = new MoveCondition(attrCondition);
      this.conditions.push(attrCondition);
    }

    return this;
  }

  addAttr(attr: MoveAttr): this {
    this.attrs.push(attr);
    let attrCondition = attr.getCondition();
    if (attrCondition) {
      if (typeof attrCondition === 'function')
        attrCondition = new MoveCondition(attrCondition);
      this.conditions.push(attrCondition);
    }

    return this;
  }

  target(moveTarget: MoveTarget): this {
    this.moveTarget = moveTarget;
    return this;
  }

  hasFlag(flag: MoveFlags): boolean {
    return !!(this.flags & flag);
  }

  condition(condition: MoveCondition | MoveConditionFunc): this {
    if (typeof condition === 'function')
      condition = new MoveCondition(condition as MoveConditionFunc);
    this.conditions.push(condition);

    return this;
  }

  private setFlag(flag: MoveFlags, on: boolean): void {
    if (on)
      this.flags |= flag;
    else
      this.flags ^= flag;
  }

  makesContact(makesContact?: boolean): this {
    this.setFlag(MoveFlags.MAKES_CONTACT, makesContact);
    return this;
  }

  ignoresProtect(ignoresProtect?: boolean): this {
    this.setFlag(MoveFlags.IGNORE_PROTECT, ignoresProtect);
    return this;
  }

  ignoresVirtual(ignoresVirtual?: boolean): this {
    this.setFlag(MoveFlags.IGNORE_VIRTUAL, ignoresVirtual);
    return this;
  }

  soundBased(soundBased?: boolean): this {
    this.setFlag(MoveFlags.SOUND_BASED, soundBased);
    return this;
  }

  hidesUser(hidesUser?: boolean): this {
    this.setFlag(MoveFlags.HIDE_USER, hidesUser);
    return this;
  }

  hidesTarget(hidesTarget?: boolean): this {
    this.setFlag(MoveFlags.HIDE_TARGET, hidesTarget);
    return this;
  }

  bitingMove(bitingMove?: boolean): this {
    this.setFlag(MoveFlags.BITING_MOVE, bitingMove);
    return this;
  }

  pulseMove(pulseMove?: boolean): this {
    this.setFlag(MoveFlags.PULSE_MOVE, pulseMove);
    return this;
  }

  punchingMove(punchingMove?: boolean): this {
    this.setFlag(MoveFlags.PUNCHING_MOVE, punchingMove);
    return this;
  }

  slicingMove(slicingMove?: boolean): this {
    this.setFlag(MoveFlags.SLICING_MOVE, slicingMove);
    return this;
  }

  ballBombMove(ballBombMove?: boolean): this {
    this.setFlag(MoveFlags.BALLBOMB_MOVE, ballBombMove);
    return this;
  }

  powderMove(powderMove?: boolean): this {
    this.setFlag(MoveFlags.POWDER_MOVE, powderMove);
    return this;
  }

  danceMove(danceMove?: boolean): this {
    this.setFlag(MoveFlags.DANCE_MOVE, danceMove);
    return this;
  }

  windMove(windMove?: boolean): this {
    this.setFlag(MoveFlags.WIND_MOVE, windMove);
    return this;
  }

  checkFlag(flag: MoveFlags, user: Pokemon, target: Pokemon): boolean {
    switch (flag) {
      case MoveFlags.MAKES_CONTACT:
        if (user.getAbility().hasAttr(IgnoreContactAbAttr))
          return false;
        break;
    }

    return !!(this.flags & flag);
  }

  applyConditions(user: Pokemon, target: Pokemon, move: Move): boolean {
    for (let condition of this.conditions) {
      if (!condition.apply(user, target, move))
        return false;
    }

    return true;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    let score = 0;

    for (let attr of this.attrs)
      score += attr.getUserBenefitScore(user, target, move);

    for (let condition of this.conditions)
      score += condition.getUserBenefitScore(user, target, move);

    return score;
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    let score = 0;

    for (let attr of this.attrs)
      score += attr.getTargetBenefitScore(user, !attr.selfTarget ? target : user, move) * (target !== user && attr.selfTarget ? -1 : 1);

    return score;
  }
}

export class AttackMove extends Move {
  constructor(id: Moves, name: string, type: Type, category: MoveCategory, power: integer, accuracy: integer, pp: integer, effect: string, chance: integer, priority: integer, generation: integer) {
    super(id, name, type, category, MoveTarget.NEAR_OTHER, power, accuracy, pp, effect, chance, priority, generation);
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    let ret = super.getTargetBenefitScore(user, target, move);

    let attackScore = 0;

    const effectiveness = target.getAttackTypeEffectiveness(this.type);
    attackScore = Math.pow(effectiveness - 1, 2) * effectiveness < 1 ? -2 : 2;
    if (attackScore) {
      if (this.category === MoveCategory.PHYSICAL) {
        const atk = new Utils.IntegerHolder(user.getBattleStat(Stat.ATK, target));
        applyMoveAttrs(VariableAtkAttr, user, target, move, atk);
        if (atk.value > user.getBattleStat(Stat.SPATK, target)) {
          const statRatio = user.getBattleStat(Stat.SPATK, target) / atk.value;
          if (statRatio <= 0.75)
            attackScore *= 2;
          else if (statRatio <= 0.875)
            attackScore *= 1.5;
        }
      } else {
        const spAtk = new Utils.IntegerHolder(user.getBattleStat(Stat.SPATK, target));
        applyMoveAttrs(VariableAtkAttr, user, target, move, spAtk);
        if (spAtk.value > user.getBattleStat(Stat.ATK, target)) {
          const statRatio = user.getBattleStat(Stat.ATK, target) / spAtk.value;
          if (statRatio <= 0.75)
            attackScore *= 2;
          else if (statRatio <= 0.875)
            attackScore *= 1.5;
        }
      }

      const power = new Utils.NumberHolder(this.power);
      applyMoveAttrs(VariablePowerAttr, user, target, move, power);

      attackScore += Math.floor(power.value / 5);
    }

    ret -= attackScore;

    return ret;
  }
}

export class StatusMove extends Move {
  constructor(id: Moves, name: string, type: Type, accuracy: integer, pp: integer, effect: string, chance: integer, priority: integer, generation: integer) {
    super(id, name, type, MoveCategory.STATUS, MoveTarget.NEAR_OTHER, -1, accuracy, pp, effect, chance, priority, generation);
  }
}

export class SelfStatusMove extends Move {
  constructor(id: Moves, name: string, type: Type, accuracy: integer, pp: integer, effect: string, chance: integer, priority: integer, generation: integer) {
    super(id, name, type, MoveCategory.STATUS, MoveTarget.USER, -1, accuracy, pp, effect, chance, priority, generation);
  }
}

export abstract class MoveAttr {
  public selfTarget: boolean;

  constructor(selfTarget: boolean = false) {
    this.selfTarget = selfTarget;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean | Promise<boolean> {
    return true;
  }

  getCondition(): MoveCondition | MoveConditionFunc {
    return null;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    return 0;
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    return 0;
  }
}

export enum MoveEffectTrigger {
  PRE_APPLY,
  POST_APPLY,
  HIT
}

export class MoveEffectAttr extends MoveAttr {
  public trigger: MoveEffectTrigger;
  public firstHitOnly: boolean;

  constructor(selfTarget?: boolean, trigger?: MoveEffectTrigger, firstHitOnly: boolean = false) {
    super(selfTarget);
    this.trigger = trigger !== undefined ? trigger : MoveEffectTrigger.POST_APPLY;
    this.firstHitOnly = firstHitOnly;
  }

  canApply(user: Pokemon, target: Pokemon, move: Move, args: any[]) {
    return !!(this.selfTarget ? user.hp && !user.getTag(BattlerTagType.FRENZY) : target.hp)
      && (this.selfTarget || !target.getTag(BattlerTagType.PROTECTED) || move.hasFlag(MoveFlags.IGNORE_PROTECT));
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean | Promise<boolean> {
    return this.canApply(user, target, move, args); 
  }
}

export class PreMoveMessageAttr extends MoveAttr {
  private message: string | ((user: Pokemon, target: Pokemon, move: Move) => string);

  constructor(message: string | ((user: Pokemon, target: Pokemon, move: Move) => string)) {
    super();
    this.message = message;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const message = typeof this.message === 'string'
      ? this.message as string
      : this.message(user, target, move);
    user.scene.queueMessage(message, 500);
    return true;
  }
}

export class StatusMoveTypeImmunityAttr extends MoveAttr {
  public immuneType: Type;

  constructor(immuneType: Type) {
    super(false);

    this.immuneType = immuneType;
  }
}

export class HighCritAttr extends MoveAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    (args[0] as Utils.IntegerHolder).value++;

    return true;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    return 3;
  }
}

export class CritOnlyAttr extends MoveAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    (args[0] as Utils.BooleanHolder).value = true;

    return true;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    return 5;
  }
}

export class FixedDamageAttr extends MoveAttr {
  private damage: integer;

  constructor(damage: integer) {
    super();

    this.damage = damage;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    (args[0] as Utils.IntegerHolder).value = this.getDamage(user, target, move);

    return true;
  }

  getDamage(user: Pokemon, target: Pokemon, move: Move): integer {
    return this.damage;
  }
}

export class UserHpDamageAttr extends FixedDamageAttr {
  constructor() {
    super(0);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    (args[0] as Utils.IntegerHolder).value = user.hp;

    return true;
  }
}

export class TargetHalfHpDamageAttr extends FixedDamageAttr {
  constructor() {
    super(0);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    (args[0] as Utils.IntegerHolder).value = Math.floor(target.hp / 2);

    return true;
  }
}

export class MatchHpAttr extends FixedDamageAttr {
  constructor() {
    super(0);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean { 
    (args[0] as Utils.IntegerHolder).value = target.hp - user.hp;

    return true;
  } 
  
  getCondition(): MoveConditionFunc {
    return (user, target, move) => user.hp <= target.hp;
  }
  
  // TODO
  /*getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    return 0;
  }*/
}

type MoveFilter = (move: Move) => boolean;

export class CounterDamageAttr extends FixedDamageAttr {
  private moveFilter: MoveFilter;

  constructor(moveFilter: MoveFilter) {
    super(0);

    this.moveFilter = moveFilter;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const damage = user.turnData.attacksReceived.filter(ar => this.moveFilter(allMoves[ar.move])).reduce((total: integer, ar: AttackMoveResult) => total + ar.damage, 0);
    (args[0] as Utils.IntegerHolder).value = Math.max(damage * 2, 1);

    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => !!user.turnData.attacksReceived.filter(ar => this.moveFilter(allMoves[ar.move])).length;
  }
}

export class LevelDamageAttr extends FixedDamageAttr {
  constructor() {
    super(0);
  }

  getDamage(user: Pokemon, target: Pokemon, move: Move): number {
    return user.level;
  }
}

export class RandomLevelDamageAttr extends FixedDamageAttr {
  constructor() {
    super(0);
  }

  getDamage(user: Pokemon, target: Pokemon, move: Move): number {
    return Math.max(Math.floor(user.level * (user.randSeedIntRange(50, 150) * 0.01)), 1);
  }
}

export class RecoilAttr extends MoveEffectAttr {
  private useHp: boolean;
  private damageRatio: number;

  constructor(useHp?: boolean, damageRatio?: number) {
    super(true);

    this.useHp = useHp;
    this.damageRatio = (damageRatio !== undefined ? damageRatio : 0.25) || 0.25;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    const cancelled = new Utils.BooleanHolder(false);
    applyAbAttrs(BlockRecoilDamageAttr, user, cancelled);

    if (cancelled.value)
      return false;

    const recoilDamage = Math.max(Math.floor((!this.useHp ? user.turnData.damageDealt : user.getMaxHp()) * this.damageRatio), 1);
    if (!recoilDamage)
      return false;

    user.damageAndUpdate(recoilDamage, HitResult.OTHER, false, true);
    user.scene.queueMessage(getPokemonMessage(user, ' is hit\nwith recoil!'));

    return true;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    return Math.floor((move.power / 5) / -4);
  }
}

export class SacrificialAttr extends MoveEffectAttr {
  constructor() {
    super(true, MoveEffectTrigger.PRE_APPLY);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    user.damageAndUpdate(user.hp, HitResult.OTHER, false, true, true);

    return true;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    return Math.ceil((1 - user.getHpRatio()) * 10) - 10;
  }
}

export enum MultiHitType {
  _2,
  _2_TO_5,
  _3,
  _3_INCR,
  _1_TO_10
}

export class HealAttr extends MoveEffectAttr {
  private healRatio: number;
  private showAnim: boolean;

  constructor(healRatio?: number, showAnim?: boolean, selfTarget?: boolean) {
    super(selfTarget === undefined || selfTarget);

    this.healRatio = healRatio || 1;
    this.showAnim = !!showAnim;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    this.addHealPhase(this.selfTarget ? user : target, this.healRatio);
    return true;
  }

  addHealPhase(target: Pokemon, healRatio: number) {
    target.scene.unshiftPhase(new PokemonHealPhase(target.scene, target.getBattlerIndex(),
      Math.max(Math.floor(target.getMaxHp() * healRatio), 1), getPokemonMessage(target, ' regained\nhealth!'), true, !this.showAnim));
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    return Math.round((1 - (this.selfTarget ? user : target).getHpRatio()) * 20);
  }
}

export class SacrificialFullRestoreAttr extends SacrificialAttr {
  constructor() {
    super();
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    // We don't know which party member will be chosen, so pick the highest max HP in the party
    const maxPartyMemberHp = user.scene.getParty().map(p => p.getMaxHp()).reduce((maxHp: integer, hp: integer) => Math.max(hp, maxHp), 0);

    user.scene.pushPhase(new PokemonHealPhase(user.scene, user.getBattlerIndex(),
      maxPartyMemberHp, getPokemonMessage(user, '\'s Healing Wish\nwas granted!'), true, false, false, true), true);

    return true;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    return -20;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => user.scene.getParty().filter(p => p.isActive()).length > user.scene.currentBattle.getBattlerCount();
  }
}

export abstract class WeatherHealAttr extends HealAttr {
  constructor() {
    super(0.5);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    let healRatio = 0.5;
    if (!user.scene.arena.weather?.isEffectSuppressed(user.scene)) {
      const weatherType = user.scene.arena.weather?.weatherType || WeatherType.NONE;
      healRatio = this.getWeatherHealRatio(weatherType);
    }
    this.addHealPhase(user, healRatio);
    return true;
  }

  abstract getWeatherHealRatio(weatherType: WeatherType): number;
}

export class PlantHealAttr extends WeatherHealAttr {
  getWeatherHealRatio(weatherType: WeatherType): number {
    switch (weatherType) {
      case WeatherType.SUNNY:
      case WeatherType.HARSH_SUN:
        return 2 / 3;
      case WeatherType.RAIN:
      case WeatherType.SANDSTORM:
      case WeatherType.HAIL:
      case WeatherType.HEAVY_RAIN:
        return 0.25;
      default:
        return 0.5;
    }
  }
}

export class SandHealAttr extends WeatherHealAttr {
  getWeatherHealRatio(weatherType: WeatherType): number {
    switch (weatherType) {
      case WeatherType.SANDSTORM:
        return 2 / 3;
      default:
        return 0.5;
    }
  }
}

export class HitHealAttr extends MoveEffectAttr {
  private healRatio: number;

  constructor(healRatio?: number) {
    super(true, MoveEffectTrigger.HIT);

    this.healRatio = healRatio || 0.5;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    user.scene.unshiftPhase(new PokemonHealPhase(user.scene, user.getBattlerIndex(),
      Math.max(Math.floor(user.turnData.damageDealt * this.healRatio), 1), getPokemonMessage(target, ` had its\nenergy drained!`), false, true));
    return true;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    return Math.floor(Math.max((1 - user.getHpRatio()) - 0.33, 0) * ((move.power / 5) / 4));
  }
}

export class MultiHitAttr extends MoveAttr {
  private multiHitType: MultiHitType;

  constructor(multiHitType?: MultiHitType) {
    super();

    this.multiHitType = multiHitType !== undefined ? multiHitType : MultiHitType._2_TO_5;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    let hitTimes: integer;
    switch (this.multiHitType) {
      case MultiHitType._2_TO_5:
        {
          const rand = user.randSeedInt(16);
          const hitValue = new Utils.IntegerHolder(rand);
          applyAbAttrs(MaxMultiHitAbAttr, user, null, hitValue);
          if (hitValue.value >= 10)
            hitTimes = 2;
          else if (hitValue.value >= 4)
            hitTimes = 3;
          else if (hitValue.value >= 2)
            hitTimes = 4;
          else
            hitTimes = 5;
        }
        break;
      case MultiHitType._2:
        hitTimes = 2;
        break;
      case MultiHitType._3:
        hitTimes = 3;
        break;
      case MultiHitType._3_INCR:
        hitTimes = 3;
        // TODO: Add power increase for every hit
        break;
      case MultiHitType._1_TO_10:
        {
          const rand = user.randSeedInt(90);
          const hitValue = new Utils.IntegerHolder(rand);
          applyAbAttrs(MaxMultiHitAbAttr, user, null, hitValue);
          if (hitValue.value >= 81)
            hitTimes = 1;
          else if (hitValue.value >= 73)
            hitTimes = 2;
          else if (hitValue.value >= 66)
            hitTimes = 3;
          else if (hitValue.value >= 60)
            hitTimes = 4;
          else if (hitValue.value >= 54)
            hitTimes = 5;
          else if (hitValue.value >= 49)
            hitTimes = 6;
          else if (hitValue.value >= 44)
            hitTimes = 7;
          else if (hitValue.value >= 40)
            hitTimes = 8;
          else if (hitValue.value >= 36)
            hitTimes = 9;
          else
            hitTimes = 10;
        }
        break;
    }
    (args[0] as Utils.IntegerHolder).value = hitTimes;
    return true;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    return 5;
  }
}

export class StatusEffectAttr extends MoveEffectAttr {
  public effect: StatusEffect;
  public cureTurn: integer;
  public overrideStatus: boolean;

  constructor(effect: StatusEffect, selfTarget?: boolean, cureTurn?: integer, overrideStatus?: boolean) {
    super(selfTarget, MoveEffectTrigger.HIT);

    this.effect = effect;
    this.cureTurn = cureTurn;
    this.overrideStatus = !!overrideStatus;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const statusCheck = move.chance < 0 || move.chance === 100 || user.randSeedInt(100) < move.chance;
    if (statusCheck) {
      const pokemon = this.selfTarget ? user : target;
      if (pokemon.status) {
        if (this.overrideStatus)
          pokemon.resetStatus();
        else
          return false;
      }
      if (!pokemon.status || (pokemon.status.effect === this.effect && move.chance < 0))
        return pokemon.trySetStatus(this.effect, true);
    }
    return false;
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    return !(this.selfTarget ? user : target).status && target.getAttackTypeEffectiveness(move.type) ? Math.floor(move.chance * -0.1) : 0;
  }
}

export class StealHeldItemChanceAttr extends MoveEffectAttr {
  private chance: number;

  constructor(chance: number) {
    super(false, MoveEffectTrigger.HIT);
    this.chance = chance;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      const rand = Phaser.Math.RND.realInRange(0, 1);
      if (rand >= this.chance)
        return resolve(false);
      const heldItems = this.getTargetHeldItems(target).filter(i => i.getTransferrable(false));
      if (heldItems.length) {
        const highestItemTier = heldItems.map(m => m.type.getOrInferTier()).reduce((highestTier, tier) => Math.max(tier, highestTier), 0);
        const tierHeldItems = heldItems.filter(m => m.type.getOrInferTier() === highestItemTier);
        const stolenItem = tierHeldItems[user.randSeedInt(tierHeldItems.length)];
        user.scene.tryTransferHeldItemModifier(stolenItem, user, false, false).then(success => {
          if (success)
            user.scene.queueMessage(getPokemonMessage(user, ` stole\n${target.name}'s ${stolenItem.type.name}!`));
          resolve(success);
        });
        return;
      }

      resolve(false);
    });
  }

  getTargetHeldItems(target: Pokemon): PokemonHeldItemModifier[] {
    return target.scene.findModifiers(m => m instanceof PokemonHeldItemModifier
      && (m as PokemonHeldItemModifier).pokemonId === target.id, target.isPlayer()) as PokemonHeldItemModifier[];
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    const heldItems = this.getTargetHeldItems(target);
    return heldItems.length ? 5 : 0;
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    const heldItems = this.getTargetHeldItems(target);
    return heldItems.length ? -5 : 0;
  }
}

export class RemoveHeldItemAttr extends MoveEffectAttr {
  private chance: number;

  constructor(chance: number) {
    super(false, MoveEffectTrigger.HIT);
    this.chance = chance;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      const rand = Phaser.Math.RND.realInRange(0, 1);
      if (rand >= this.chance)
        return resolve(false);
      const heldItems = this.getTargetHeldItems(target).filter(i => i.getTransferrable(false));
      if (heldItems.length) {
        const highestItemTier = heldItems.map(m => m.type.getOrInferTier()).reduce((highestTier, tier) => Math.max(tier, highestTier), 0);
        const tierHeldItems = heldItems.filter(m => m.type.getOrInferTier() === highestItemTier);
        const stolenItem = tierHeldItems[user.randSeedInt(tierHeldItems.length)];
        user.scene.tryTransferHeldItemModifier(stolenItem, user, false, false).then(success => {
          if (success)
            user.scene.queueMessage(getPokemonMessage(user, ` knocked off\n${target.name}'s ${stolenItem.type.name}!`));
          resolve(success);
        });
        return;
      }

      resolve(false);
    });
  }

  getTargetHeldItems(target: Pokemon): PokemonHeldItemModifier[] {
    return target.scene.findModifiers(m => m instanceof PokemonHeldItemModifier
      && (m as PokemonHeldItemModifier).pokemonId === target.id, target.isPlayer()) as PokemonHeldItemModifier[];
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    const heldItems = this.getTargetHeldItems(target);
    return heldItems.length ? 5 : 0;
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    const heldItems = this.getTargetHeldItems(target);
    return heldItems.length ? -5 : 0;
  }
}

export class HealStatusEffectAttr extends MoveEffectAttr {
  private effects: StatusEffect[];

  constructor(selfTarget: boolean, ...effects: StatusEffect[]) {
    super(selfTarget);

    this.effects = effects;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    const pokemon = this.selfTarget ? user : target;
    if (pokemon.status && this.effects.indexOf(pokemon.status.effect) > -1) {
      pokemon.scene.queueMessage(getPokemonMessage(pokemon, getStatusEffectHealText(pokemon.status.effect)));
      pokemon.resetStatus();
      pokemon.updateInfo();
      
      return true;
    }

    return false;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    return user.status ? 10 : 0;
  }
}

export class BypassSleepAttr extends MoveAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (user.status?.effect === StatusEffect.SLEEP) {
      user.addTag(BattlerTagType.BYPASS_SLEEP, 1, move.id, user.id);
      return true;
    }

    return false;
  }
}

export class WeatherChangeAttr extends MoveEffectAttr {
  private weatherType: WeatherType;
  
  constructor(weatherType: WeatherType) {
    super();

    this.weatherType = weatherType;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    return user.scene.arena.trySetWeather(this.weatherType, true);
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => !user.scene.arena.weather || (user.scene.arena.weather.weatherType !== this.weatherType && !user.scene.arena.weather.isImmutable());
  }
}

export class ClearWeatherAttr extends MoveEffectAttr {
  private weatherType: WeatherType;
  
  constructor(weatherType: WeatherType) {
    super();

    this.weatherType = weatherType;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (user.scene.arena.weather?.weatherType === this.weatherType)
      return user.scene.arena.trySetWeather(WeatherType.NONE, true);

    return false;
  }
}

export class TerrainChangeAttr extends MoveEffectAttr {
  private terrainType: TerrainType;
  
  constructor(terrainType: TerrainType) {
    super();

    this.terrainType = terrainType;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    return user.scene.arena.trySetTerrain(this.terrainType, true, true);
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => !user.scene.arena.terrain || (user.scene.arena.terrain.terrainType !== this.terrainType);
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    // TODO: Expand on this
    return user.scene.arena.terrain ? 0 : 6;
  }
}

export class ClearTerrainAttr extends MoveEffectAttr {
  constructor() {
    super();
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    return user.scene.arena.trySetTerrain(TerrainType.NONE, true, true);
  }
}

export class OneHitKOAttr extends MoveAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (target.isBossImmune())
      return false;

    (args[0] as Utils.BooleanHolder).value = true;
    
    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => {
      const cancelled = new Utils.BooleanHolder(false);
      applyAbAttrs(BlockOneHitKOAbAttr, target, cancelled);
      return !cancelled && user.level >= target.level;
    }
  }
}

export class OverrideMoveEffectAttr extends MoveAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean | Promise<boolean> {
    //const overridden = args[0] as Utils.BooleanHolder;
    //const virtual = arg[1] as boolean;
    return true;
  }
}

export class ChargeAttr extends OverrideMoveEffectAttr {
  public chargeAnim: ChargeAnim;
  private chargeText: string;
  private tagType: BattlerTagType;
  private chargeEffect: boolean;
  public sameTurn: boolean;
  public followUpPriority: integer;

  constructor(chargeAnim: ChargeAnim, chargeText: string, tagType?: BattlerTagType, chargeEffect: boolean = false, sameTurn: boolean = false, followUpPriority?: integer) {
    super();

    this.chargeAnim = chargeAnim;
    this.chargeText = chargeText;
    this.tagType = tagType;
    this.chargeEffect = chargeEffect;
    this.sameTurn = sameTurn;
    this.followUpPriority = followUpPriority;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): Promise<boolean> {
    return new Promise(resolve => {
      const lastMove = user.getLastXMoves().find(() => true);
      if (!lastMove || lastMove.move !== move.id || lastMove.result !== MoveResult.OTHER) {
        (args[0] as Utils.BooleanHolder).value = true;
        new MoveChargeAnim(this.chargeAnim, move.id, user).play(user.scene, () => {
          user.scene.queueMessage(getPokemonMessage(user, ` ${this.chargeText.replace('{TARGET}', target.name)}`));
          if (this.tagType)
            user.addTag(this.tagType, 1, move.id, user.id);
          if (this.chargeEffect)
            applyMoveAttrs(MoveEffectAttr, user, target, move);
          user.pushMoveHistory({ move: move.id, targets: [ target.getBattlerIndex() ], result: MoveResult.OTHER });
          user.getMoveQueue().push({ move: move.id, targets: [ target.getBattlerIndex() ], ignorePP: true });
          if (this.sameTurn)
            user.scene.pushMovePhase(new MovePhase(user.scene, user, [ target.getBattlerIndex() ], user.moveset.find(m => m.moveId === move.id), true), this.followUpPriority);
          resolve(true);
        });
      } else
        resolve(false);
    });
  }

  usedChargeEffect(user: Pokemon, target: Pokemon, move: Move): boolean {
    if (!this.chargeEffect)
      return false;
    // Account for move history being populated when this function is called
    const lastMoves = user.getLastXMoves(2);
    return lastMoves.length === 2 && lastMoves[1].move === move.id && lastMoves[1].result === MoveResult.OTHER;
  }
}

export class SunlightChargeAttr extends ChargeAttr {
  constructor(chargeAnim: ChargeAnim, chargeText: string) {
    super(chargeAnim, chargeText);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): Promise<boolean> {
    return new Promise(resolve => {
      const weatherType = user.scene.arena.weather?.weatherType;
      if (!user.scene.arena.weather?.isEffectSuppressed(user.scene) && (weatherType === WeatherType.SUNNY || weatherType === WeatherType.HARSH_SUN))
        resolve(false);
      else
        super.apply(user, target, move, args).then(result => resolve(result));
    });
  }
}

export class ElectroShotChargeAttr extends ChargeAttr {
  constructor() {
    super(ChargeAnim.ELECTRO_SHOT_CHARGING, 'absorbed electricity!', null, true);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): Promise<boolean> {
    return new Promise(resolve => {
      const weatherType = user.scene.arena.weather?.weatherType;
      if (!user.scene.arena.weather?.isEffectSuppressed(user.scene) && (weatherType === WeatherType.RAIN || weatherType === WeatherType.HEAVY_RAIN))
        resolve(false);
      else
        super.apply(user, target, move, args).then(result => resolve(result));
    });
  }
}

export class DelayedAttackAttr extends OverrideMoveEffectAttr {
  public tagType: ArenaTagType;
  public chargeAnim: ChargeAnim;
  private chargeText: string;

  constructor(tagType: ArenaTagType, chargeAnim: ChargeAnim, chargeText: string) {
    super();

    this.tagType = tagType;
    this.chargeAnim = chargeAnim;
    this.chargeText = chargeText;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): Promise<boolean> {
    return new Promise(resolve => {
      if (args.length < 2 || !args[1]) {
        new MoveChargeAnim(this.chargeAnim, move.id, user).play(user.scene, () => {
          (args[0] as Utils.BooleanHolder).value = true;
          user.scene.queueMessage(getPokemonMessage(user, ` ${this.chargeText.replace('{TARGET}', target.name)}`));
          user.pushMoveHistory({ move: move.id, targets: [ target.getBattlerIndex() ], result: MoveResult.OTHER });
          user.scene.arena.addTag(this.tagType, 3, move.id, user.id, ArenaTagSide.BOTH, target.getBattlerIndex());

          resolve(true);
        });
      } else
        user.scene.ui.showText(getPokemonMessage(user.scene.getPokemonById(target.id), ` took\nthe ${move.name} attack!`), null, () => resolve(true));
    });
  }
}

export class StatChangeAttr extends MoveEffectAttr {
  public stats: BattleStat[];
  public levels: integer;
  private condition: MoveConditionFunc;
  private showMessage: boolean;

  constructor(stats: BattleStat | BattleStat[], levels: integer, selfTarget?: boolean, condition?: MoveConditionFunc, showMessage: boolean = true, firstHitOnly: boolean = false) {
    super(selfTarget, MoveEffectTrigger.HIT, firstHitOnly);
    this.stats = typeof(stats) === 'number'
      ? [ stats as BattleStat ]
      : stats as BattleStat[];
    this.levels = levels;
    this.condition = condition || null;
    this.showMessage = showMessage;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean | Promise<boolean> {
    if (!super.apply(user, target, move, args) || (this.condition && !this.condition(user, target, move)))
      return false;

    if (move.chance < 0 || move.chance === 100 || user.randSeedInt(100) < move.chance) {
      const levels = this.getLevels(user);
      user.scene.unshiftPhase(new StatChangePhase(user.scene, (this.selfTarget ? user : target).getBattlerIndex(), this.selfTarget, this.stats, levels, this.showMessage));
      return true;
    }

    return false;
  }

  getLevels(_user: Pokemon): integer {
    return this.levels;
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    // TODO: Add awareness of level limits
    const levels = this.getLevels(user);
    return (levels * 4) + (levels > 0 ? -2 : 2);
  }
}

export class GrowthStatChangeAttr extends StatChangeAttr {
  constructor() {
    super([ BattleStat.ATK, BattleStat.SPATK ], 1, true);
  }

  getLevels(user: Pokemon): number {
    if (!user.scene.arena.weather?.isEffectSuppressed(user.scene)) {
      const weatherType = user.scene.arena.weather?.weatherType;
      if (weatherType === WeatherType.SUNNY || weatherType === WeatherType.HARSH_SUN)
        return this.levels + 1;
    }
    return this.levels;
  }
}

export class HalfHpStatMaxAttr extends StatChangeAttr {
  constructor(stat: BattleStat) {
    super(stat, 12, true, null, false);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      const damage = user.damage(Math.floor(user.getMaxHp() / 2), true);
      if (damage)
        user.scene.damageNumberHandler.add(user, damage);
      user.updateInfo().then(() => {
        const ret = super.apply(user, target, move, args);
        user.scene.queueMessage(getPokemonMessage(user, ` cut its own hp\nand maximized its ${getBattleStatName(this.stats[0])}!`));
        resolve(ret);
      });
    });
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => user.getHpRatio() > 0.5 && user.summonData.battleStats[this.stats[0]] < 6;
  }
}

export class CutHpStatBoostAttr extends StatChangeAttr {
  constructor(stat: BattleStat | BattleStat[]) {
    super(stat, 1, true, null, true);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      const damage = user.damage(Math.floor(user.getMaxHp() / 3), true);
      if (damage)
        user.scene.damageNumberHandler.add(user, damage);
      user.updateInfo().then(() => {
        const ret = super.apply(user, target, move, args);
        resolve(ret);
      });
    });
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => user.getHpRatio() > 0.33;
  }
}

export class InvertStatsAttr extends MoveEffectAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    for (let s = 0; s < target.summonData.battleStats.length; s++)
      target.summonData.battleStats[s] *= -1;

    target.scene.queueMessage(getPokemonMessage(target, `'s stat changes\nwere all reversed!`));

    return true;
  }
}

export class HpSplitAttr extends MoveEffectAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): Promise<boolean> {
    return new Promise(resolve => {
      if (!super.apply(user, target, move, args))
        return resolve(false);

      const infoUpdates = [];
  
      const hpValue = Math.floor((target.hp + user.hp) / 2);
      if (user.hp < hpValue) {
        const healing = user.heal(hpValue - user.hp);
        if (healing)
          user.scene.damageNumberHandler.add(user, healing, HitResult.HEAL);
      } else if (user.hp > hpValue) {
        const damage = user.damage(user.hp - hpValue, true);
        if (damage)
          user.scene.damageNumberHandler.add(user, damage);
      }
      infoUpdates.push(user.updateInfo());

      if (target.hp < hpValue) {
        const healing = target.heal(hpValue - target.hp);
        if (healing)
          user.scene.damageNumberHandler.add(user, healing, HitResult.HEAL);
      } else if (target.hp > hpValue) {
        const damage = target.damage(target.hp - hpValue, true);
        if (damage)
          target.scene.damageNumberHandler.add(target, damage);
      }
      infoUpdates.push(target.updateInfo());

      return Promise.all(infoUpdates).then(() => resolve(true));
    });
  }
}

export class VariablePowerAttr extends MoveAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    //const power = args[0] as Utils.NumberHolder;
    return false;
  }
}

export class MovePowerMultiplierAttr extends VariablePowerAttr {
  private powerMultiplierFunc: (user: Pokemon, target: Pokemon, move: Move) => number;

  constructor(powerMultiplier: (user: Pokemon, target: Pokemon, move: Move) => number) {
    super();

    this.powerMultiplierFunc = powerMultiplier;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const power = args[0] as Utils.NumberHolder;
    power.value *= this.powerMultiplierFunc(user, target, move);

    return true;
  }
}

export abstract class ConsecutiveUsePowerMultiplierAttr extends MovePowerMultiplierAttr {
  constructor(limit: integer, resetOnFail: boolean, resetOnLimit?: boolean, ...comboMoves: Moves[]) {
    super((user: Pokemon, target: Pokemon, move: Move): number => {
      const moveHistory = user.getMoveHistory().reverse().slice(0);

      let count = 0;
      let turnMove: TurnMove;

      while (((turnMove = moveHistory.shift())?.move === move.id || (comboMoves.length && comboMoves.indexOf(turnMove?.move) > -1)) && (!resetOnFail || turnMove.result === MoveResult.SUCCESS)) {
        if (count < (limit - 1))
          count++;
        else if (resetOnLimit)
          count = 0;
        else
          break;
      }

      return this.getMultiplier(count);
    });
  }

  abstract getMultiplier(count: integer): number;
}

export class ConsecutiveUseDoublePowerAttr extends ConsecutiveUsePowerMultiplierAttr {
  getMultiplier(count: number): number {
    return Math.pow(2, count);
  }
}

export class ConsecutiveUseMultiBasePowerAttr extends ConsecutiveUsePowerMultiplierAttr {
  getMultiplier(count: number): number {
    return (count + 1);
  }
}

export class WeightPowerAttr extends VariablePowerAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const power = args[0] as Utils.NumberHolder;

    const targetWeight = target.getWeight();
    const weightThresholds = [ 10, 25, 50, 100, 200 ];

    let w = 0;
    while (targetWeight >= weightThresholds[w]) {
      if (++w === weightThresholds.length)
        break;
    }

    power.value = (w + 1) * 20;

    return true;
  }
}

export class BattleStatRatioPowerAttr extends VariablePowerAttr {
  private stat: Stat;
  private invert: boolean;

  constructor(stat: Stat, invert: boolean = false) {
    super();

    this.stat = stat;
    this.invert = invert;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const power = args[0] as Utils.NumberHolder;

    const statRatio = target.getStat(this.stat) / user.getStat(this.stat);
    const statThresholds = [ 0.25, 1 / 3, 0.5, 1, -1 ];
    let statThresholdPowers = [ 150, 120, 80, 60, 40 ];

    if (this.invert)
      statThresholdPowers = statThresholdPowers.reverse();

    let w = 0;
    while (w < statThresholds.length - 1 && statRatio > statThresholds[w]) {
      if (++w === statThresholds.length)
        break;
    }

    power.value = statThresholdPowers[w];

    return true;
  }
}

export class LowHpPowerAttr extends VariablePowerAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const power = args[0] as Utils.NumberHolder;
    const hpRatio = user.getHpRatio();

    switch (true) {
      case (hpRatio < 0.6875):
        power.value = 40;
        break;
      case (hpRatio < 0.3542):
        power.value = 80;
        break;
      case (hpRatio < 0.2083):
        power.value = 100;
        break;
      case (hpRatio < 0.1042):
        power.value = 150;
        break;
      case (hpRatio < 0.0417):
        power.value = 200;
        break;
      default:
        power.value = 20;
        break;
    }

    return true;
  }
}

export class HpPowerAttr extends VariablePowerAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    (args[0] as Utils.NumberHolder).value = Math.max(Math.floor(150 * user.getHpRatio()), 1);

    return true;
  }
}

export class OpponentHighHpPowerAttr extends VariablePowerAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    (args[0] as Utils.NumberHolder).value = Math.max(Math.floor(120 * target.getHpRatio()), 1);

    return true;
  }
}

export class FirstAttackDoublePowerAttr extends VariablePowerAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    console.log(target.getLastXMoves(1), target.scene.currentBattle.turn);
    if (!target.getLastXMoves(1).find(m => m.turn === target.scene.currentBattle.turn)) {
      (args[0] as Utils.NumberHolder).value *= 2;
      return true;
    }

    return false;
  }
}

export class TurnDamagedDoublePowerAttr extends VariablePowerAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (user.turnData.attacksReceived.find(r => r.damage && r.sourceId === target.id)) {
      (args[0] as Utils.NumberHolder).value *= 2;
      return true;
    }

    return false;
  }
}

const magnitudeMessageFunc = (user: Pokemon, target: Pokemon, move: Move) => {
  let message: string;
  user.scene.executeWithSeedOffset(() => {
    const magnitudeThresholds = [ 5, 15, 35, 65, 75, 95 ];

    const rand = Utils.randSeedInt(100);

    let m = 0;
    for (; m < magnitudeThresholds.length; m++) {
      if (rand < magnitudeThresholds[m])
        break;
    }

    message = `Magnitude ${m + 4}!`;
  }, user.scene.currentBattle.turn << 6);
  return message;
};

export class MagnitudePowerAttr extends VariablePowerAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const power = args[0] as Utils.NumberHolder;

    const magnitudeThresholds = [ 5, 15, 35, 65, 75, 95 ];
    const magnitudePowers = [ 10, 30, 50, 70, 90, 100, 110, 150 ];

    let rand: integer;
    
    user.scene.executeWithSeedOffset(() => rand = Utils.randSeedInt(100), user.scene.currentBattle.turn << 6);

    let m = 0;
    for (; m < magnitudeThresholds.length; m++) {
      if (rand < magnitudeThresholds[m])
        break;
    }

    power.value = magnitudePowers[m];

    return true;
  }
}

export class AntiSunlightPowerDecreaseAttr extends VariablePowerAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!user.scene.arena.weather?.isEffectSuppressed(user.scene)) {
      const power = args[0] as Utils.NumberHolder;
      const weatherType = user.scene.arena.weather?.weatherType || WeatherType.NONE;
      switch (weatherType) {
        case WeatherType.RAIN:
        case WeatherType.SANDSTORM:
        case WeatherType.HAIL:
        case WeatherType.HEAVY_RAIN:
          power.value *= 0.5;
          return true;
      }
    }

    return false;
  }
}

export class FriendshipPowerAttr extends VariablePowerAttr {
  private invert: boolean;

  constructor(invert?: boolean) {
    super();

    this.invert = !!invert;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const power = args[0] as Utils.NumberHolder;

    if (user instanceof PlayerPokemon) {
      const friendshipPower = Math.floor(Math.min(user.friendship, 255) / 2.5);
      power.value = Math.max(!this.invert ? friendshipPower : 102 - friendshipPower, 1);
    }

    return true;
  }
}

export class HitCountPowerAttr extends VariablePowerAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    (args[0] as Utils.NumberHolder).value += Math.min(user.battleData.hitCount, 6) * 50;

    return true;
  }
}

export class VariableAtkAttr extends MoveAttr {
  constructor() {
    super();
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    //const atk = args[0] as Utils.IntegerHolder;
    return false;
  }
}

export class DefAtkAttr extends VariableAtkAttr {
  constructor() {
    super();
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    (args[0] as Utils.IntegerHolder).value = user.getBattleStat(Stat.DEF, target);
    return true;
  }
}

export class VariableDefAttr extends MoveAttr {
  constructor() {
    super();
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    //const def = args[0] as Utils.IntegerHolder;
    return false;
  }
}

export class DefDefAttr extends VariableDefAttr {
  constructor() {
    super();
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    (args[0] as Utils.IntegerHolder).value = target.getBattleStat(Stat.DEF, user);
    return true;
  }
}

export class VariableAccuracyAttr extends MoveAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    //const accuracy = args[0] as Utils.NumberHolder;
    return false;
  }
}

export class ThunderAccuracyAttr extends VariableAccuracyAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!user.scene.arena.weather?.isEffectSuppressed(user.scene)) {
      const accuracy = args[0] as Utils.NumberHolder;
      const weatherType = user.scene.arena.weather?.weatherType || WeatherType.NONE;
      switch (weatherType) {
        case WeatherType.SUNNY:
        case WeatherType.SANDSTORM:
        case WeatherType.HARSH_SUN:
          accuracy.value = 50;
          return true;
        case WeatherType.RAIN:
        case WeatherType.HEAVY_RAIN:
          accuracy.value = -1;
          return true;
      }
    }

    return false;
  }
}

export class BlizzardAccuracyAttr extends VariableAccuracyAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!user.scene.arena.weather?.isEffectSuppressed(user.scene)) {
      const accuracy = args[0] as Utils.NumberHolder;
      const weatherType = user.scene.arena.weather?.weatherType || WeatherType.NONE;
      if (weatherType === WeatherType.HAIL) {
        accuracy.value = -1;
        return true;
      }
    }

    return false;
  }
}

export class OneHitKOAccuracyAttr extends MoveAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const accuracy = args[0] as Utils.NumberHolder;
    accuracy.value = 30 + 70 * Math.min(target.level / user.level, 0.5) * 2;
    return false;
  }
}

export class MissEffectAttr extends MoveAttr {
  private missEffectFunc: UserMoveConditionFunc;

  constructor(missEffectFunc: UserMoveConditionFunc) {
    super();

    this.missEffectFunc = missEffectFunc;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    this.missEffectFunc(user, move);
    return true;
  }
}

const halveHpMissEffectFunc = (user: Pokemon, move: Move) => {
  const damage = user.damage(Math.floor(user.getMaxHp() / 2));
  if (damage)
    user.scene.damageNumberHandler.add(user, damage, HitResult.OTHER);
  return true;
};

export class TypelessAttr extends MoveAttr { }

export class DisableMoveAttr extends MoveEffectAttr {
  constructor() {
    super(false);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    const moveQueue = target.getLastXMoves();
    let turnMove: TurnMove;
    while (moveQueue.length) {
      turnMove = moveQueue.shift();
      if (turnMove.virtual)
        continue;
      
      const moveIndex = target.getMoveset().findIndex(m => m.moveId === turnMove.move);
      if (moveIndex === -1)
        return false;
      
      const disabledMove = target.getMoveset()[moveIndex];
      target.summonData.disabledMove = disabledMove.moveId;
      target.summonData.disabledTurns = 4;

      user.scene.queueMessage(getPokemonMessage(target, `'s ${disabledMove.getName()}\nwas disabled!`));
      
      return true;
    }
    
    return false;
  }
  
  getCondition(): MoveConditionFunc {
    return (user, target, move) => {
      if (target.summonData.disabledMove)
        return false;

      const moveQueue = target.getLastXMoves();
      let turnMove: TurnMove;
      while (moveQueue.length) {
        turnMove = moveQueue.shift();
        if (turnMove.virtual)
          continue;
        
        const move = target.getMoveset().find(m => m.moveId === turnMove.move);
        if (!move)
          continue;

        return true;
      }
    };
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    return -5;
  }
}

export class FrenzyAttr extends MoveEffectAttr {
  constructor() {
    super(true, MoveEffectTrigger.HIT);
  }

  canApply(user: Pokemon, target: Pokemon, move: Move, args: any[]) {
    return !(this.selfTarget ? user : target).isFainted();
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    if (!user.getMoveQueue().length) {
      if (!user.getTag(BattlerTagType.FRENZY)) {
        const turnCount = user.randSeedIntRange(2, 3);
        new Array(turnCount).fill(null).map(() => user.getMoveQueue().push({ move: move.id, targets: [ target.getBattlerIndex() ], ignorePP: true }));
        user.addTag(BattlerTagType.FRENZY, 1, move.id, user.id);
      } else {
        applyMoveAttrs(AddBattlerTagAttr, user, target, move, args);
        user.lapseTag(BattlerTagType.FRENZY);
      }
      return true;
    }

    return false;
  }
}

export const frenzyMissFunc: UserMoveConditionFunc = (user: Pokemon, move: Move) => {
  while (user.getMoveQueue().length && user.getMoveQueue()[0].move === move.id)
    user.getMoveQueue().shift();
  user.lapseTag(BattlerTagType.FRENZY);

  return true;
};

export class AddBattlerTagAttr extends MoveEffectAttr {
  public tagType: BattlerTagType;
  public turnCountMin: integer;
  public turnCountMax: integer;
  private failOnOverlap: boolean;

  constructor(tagType: BattlerTagType, selfTarget: boolean = false, failOnOverlap: boolean = false, turnCountMin: integer = 0, turnCountMax?: integer) {
    super(selfTarget);

    this.tagType = tagType;
    this.turnCountMin = turnCountMin;
    this.turnCountMax = turnCountMax !== undefined ? turnCountMax : turnCountMin;
    this.failOnOverlap = !!failOnOverlap;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    const chance = this.getTagChance(user, target, move);
    if (chance < 0 || chance === 100 || user.randSeedInt(100) < chance) {
      (this.selfTarget ? user : target).addTag(this.tagType,  user.randSeedInt(this.turnCountMax - this.turnCountMin, this.turnCountMin), move.id, user.id);
      return true;
    }

    return false;
  }

  getTagChance(user: Pokemon, target: Pokemon, move: Move): integer {
    return move.chance;
  }

  getCondition(): MoveConditionFunc {
    return this.failOnOverlap
      ? (user, target, move) => !(this.selfTarget ? user : target).getTag(this.tagType)
      : null;
  }

  getTagTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    switch (this.tagType) {
      case BattlerTagType.RECHARGING:
        return -16;
      case BattlerTagType.FLINCHED:
        return -5;
      case BattlerTagType.CONFUSED:
        return -5;
      case BattlerTagType.INFATUATED:
        return -5;
      case BattlerTagType.SEEDED:
        return -3;
      case BattlerTagType.NIGHTMARE:
        return -5;
      case BattlerTagType.FRENZY:
        return -3;
      case BattlerTagType.ENCORE:
        return -2;
      case BattlerTagType.INGRAIN:
        return 3;
      case BattlerTagType.AQUA_RING:
        return 3;
      case BattlerTagType.DROWSY:
        return -5;
      case BattlerTagType.TRAPPED:
      case BattlerTagType.BIND:
      case BattlerTagType.WRAP:
      case BattlerTagType.FIRE_SPIN:
      case BattlerTagType.WHIRLPOOL:
      case BattlerTagType.CLAMP:
      case BattlerTagType.SAND_TOMB:
      case BattlerTagType.MAGMA_STORM:
      case BattlerTagType.THUNDER_CAGE:
        return -3;
      case BattlerTagType.PROTECTED:
        return 5;
      case BattlerTagType.PERISH_SONG:
        return -16;
      case BattlerTagType.FLYING:
        return 5;
      case BattlerTagType.CRIT_BOOST:
        return 5;
      case BattlerTagType.NO_CRIT:
        return -5;
      case BattlerTagType.IGNORE_ACCURACY:
        return 3;
    }
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    let chance = this.getTagChance(user, target, move);
    if (chance < 0)
      chance = 100;
    return Math.floor(this.getTagTargetBenefitScore(user, target, move) * (chance / 100));
  }
}

export class LapseBattlerTagAttr extends MoveEffectAttr {
  public tagTypes: BattlerTagType[];

  constructor(tagTypes: BattlerTagType[], selfTarget: boolean = false) {
    super(selfTarget);

    this.tagTypes = tagTypes;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    for (let tagType of this.tagTypes)
      (this.selfTarget ? user : target).lapseTag(tagType);
    
    return true;
  }
}

export class RemoveBattlerTagAttr extends MoveEffectAttr {
  public tagTypes: BattlerTagType[];

  constructor(tagTypes: BattlerTagType[], selfTarget: boolean = false) {
    super(selfTarget);

    this.tagTypes = tagTypes;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    for (let tagType of this.tagTypes)
      (this.selfTarget ? user : target).removeTag(tagType);
    
    return true;
  }
}

export class FlinchAttr extends AddBattlerTagAttr {
  constructor() {
    super(BattlerTagType.FLINCHED, false);
  }
}

export class ConfuseAttr extends AddBattlerTagAttr {
  constructor(selfTarget?: boolean) {
    super(BattlerTagType.CONFUSED, selfTarget, false, 2, 5);
  }
}

export class RechargeAttr extends AddBattlerTagAttr {
  constructor() {
    super(BattlerTagType.RECHARGING, true);
  }
}

export class TrapAttr extends AddBattlerTagAttr {
  constructor(tagType: BattlerTagType) {
    super(tagType, false, false, 4, 5);
  }
}

export class ProtectAttr extends AddBattlerTagAttr {
  constructor(tagType: BattlerTagType = BattlerTagType.PROTECTED) {
    super(tagType, true);
  }

  getCondition(): MoveConditionFunc {
    return ((user, target, move): boolean => {
      let timesUsed = 0;
      const moveHistory = user.getLastXMoves();
      let turnMove: TurnMove;
      while (moveHistory.length && allMoves[(turnMove = moveHistory.shift()).move].getAttrs(ProtectAttr).find(pa => (pa as ProtectAttr).tagType === this.tagType))
        timesUsed++;
      if (timesUsed)
        return !user.randSeedInt(Math.pow(2, timesUsed));
      return true;
    });
  }
}

export class EndureAttr extends ProtectAttr {
  constructor() {
    super(BattlerTagType.ENDURING);
  }
}

export class IgnoreAccuracyAttr extends AddBattlerTagAttr {
  constructor() {
    super(BattlerTagType.IGNORE_ACCURACY, true, false, 2);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    user.scene.queueMessage(getPokemonMessage(user, ` took aim\nat ${target.name}!`));

    return true;
  }
}

export class FaintCountdownAttr extends AddBattlerTagAttr {
  constructor() {
    super(BattlerTagType.PERISH_SONG, false, true, 4);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    user.scene.queueMessage(getPokemonMessage(target, `\nwill faint in ${this.turnCountMin - 1} turns.`));

    return true;
  }
}

export class HitsTagAttr extends MoveAttr {
  public tagType: BattlerTagType;
  public doubleDamage: boolean;

  constructor(tagType: BattlerTagType, doubleDamage?: boolean) {
    super();

    this.tagType = tagType;
    this.doubleDamage = !!doubleDamage;
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    return target.getTag(this.tagType) ? this.doubleDamage ? 10 : 5 : 0;
  }
}

export class AddArenaTagAttr extends MoveEffectAttr {
  public tagType: ArenaTagType;
  public turnCount: integer;
  private failOnOverlap: boolean;

  constructor(tagType: ArenaTagType, turnCount?: integer, failOnOverlap: boolean = false) {
    super(true);

    this.tagType = tagType;
    this.turnCount = turnCount;
    this.failOnOverlap = failOnOverlap;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    if (move.chance < 0 || move.chance === 100 || user.randSeedInt(100) < move.chance) {
      user.scene.arena.addTag(this.tagType, this.turnCount, move.id, user.id, target.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY);
      return true;
    }

    return false;
  }

  getCondition(): MoveConditionFunc {
    return this.failOnOverlap
      ? (user, target, move) => !user.scene.arena.getTagOnSide(this.tagType, target.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY)
      : null;
  }
}

export class AddArenaTrapTagAttr extends AddArenaTagAttr {
  getCondition(): MoveConditionFunc {
    return (user, target, move) => {
      if (move.category !== MoveCategory.STATUS || !user.scene.arena.getTag(this.tagType))
        return true;
      const tag = user.scene.arena.getTag(this.tagType) as ArenaTrapTag;
      return tag.layers < tag.maxLayers;
    };
  }
}

export class ForceSwitchOutAttr extends MoveEffectAttr {
  private user: boolean;
  private batonPass: boolean;

  constructor(user?: boolean, batonPass?: boolean) {
    super(false, MoveEffectTrigger.HIT);

    this.user = !!user;
    this.batonPass = !!batonPass;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): Promise<boolean> {
    return new Promise(resolve => {
      if (move.category !== MoveCategory.STATUS && !this.getSwitchOutCondition()(user, target, move))
        return resolve(false);
      const switchOutTarget = this.user ? user : target;
      if (switchOutTarget instanceof PlayerPokemon) {
        (switchOutTarget as PlayerPokemon).switchOut(this.batonPass).then(() => resolve(true));
        return;
      } else if (user.scene.currentBattle.battleType) {
        switchOutTarget.resetTurnData();
        switchOutTarget.resetSummonData();
        switchOutTarget.hideInfo();
        switchOutTarget.setVisible(false);
        switchOutTarget.scene.field.remove(switchOutTarget);

        if (switchOutTarget.hp)
          user.scene.unshiftPhase(new SwitchSummonPhase(user.scene, switchOutTarget.getFieldIndex(), user.scene.currentBattle.trainer.getNextSummonIndex((switchOutTarget as EnemyPokemon).trainerSlot), false, this.batonPass, false));
      } else {
        switchOutTarget.setVisible(false);
        
        if (switchOutTarget.hp) {
          switchOutTarget.hideInfo().then(() => switchOutTarget.destroy());
          switchOutTarget.scene.field.remove(switchOutTarget);
          user.scene.queueMessage(getPokemonMessage(switchOutTarget, ' fled!'), null, true, 500);
        }

        if (!switchOutTarget.getAlly()?.isActive(true)) {
          user.scene.clearEnemyHeldItemModifiers();

          user.scene.pushPhase(new BattleEndPhase(user.scene));
          user.scene.pushPhase(new NewBattlePhase(user.scene));
        }
      }

      resolve(true);
    });
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => move.category !== MoveCategory.STATUS || this.getSwitchOutCondition()(user, target, move);
  }

  getSwitchOutCondition(): MoveConditionFunc {
    return (user, target, move) => {
      const switchOutTarget = (this.user ? user : target);
      const player = switchOutTarget instanceof PlayerPokemon;

      if (!player && !user.scene.currentBattle.battleType) {
        if (this.batonPass)
          return false;
        // Don't allow wild opponents to flee on the boss stage since it can ruin a run early on
        if (!(user.scene.currentBattle.waveIndex % 10))
          return false;
      }

      const party = player ? user.scene.getParty() : user.scene.getEnemyParty();
      return (!player && !user.scene.currentBattle.battleType) || party.filter(p => !p.isFainted() && (player || (p as EnemyPokemon).trainerSlot === (switchOutTarget as EnemyPokemon).trainerSlot)).length > user.scene.currentBattle.getBattlerCount();
    };
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    if (this.batonPass)
      return -100; // Overridden in switch logic
    return this.user ? Math.floor(user.getHpRatio() * 20) : super.getUserBenefitScore(user, target, move);
  }
}

export class CopyTypeAttr extends MoveEffectAttr {
  constructor() {
    super(true);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    user.summonData.types = target.getTypes(true);

    user.scene.queueMessage(getPokemonMessage(user, `'s type\nchanged to match ${target.name}'s!`));

    return true;
  }
}

export class CopyBiomeTypeAttr extends MoveEffectAttr {
  constructor() {
    super(true);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    const biomeType = user.scene.arena.getTypeForBiome();

    user.summonData.types = [ biomeType ];

    user.scene.queueMessage(getPokemonMessage(user, ` transformed\ninto the ${Utils.toReadableString(Type[biomeType])} type!`));

    return true;
  }
}

export class FirstMoveTypeAttr extends MoveEffectAttr {
  constructor() {
    super(true);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    const firstMoveType = target.getMoveset()[0].getMove().type
   
    user.summonData.types = [ firstMoveType ];

    user.scene.queueMessage(getPokemonMessage(user, ` transformed\ninto to the ${Utils.toReadableString(Type[firstMoveType])} type!`));

    return true;
  }
}

export class RandomMovesetMoveAttr extends OverrideMoveEffectAttr {
  private enemyMoveset: boolean;

  constructor(enemyMoveset?: boolean) {
    super();

    this.enemyMoveset = enemyMoveset;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const moveset = (!this.enemyMoveset ? user : target).getMoveset();
    const moves = moveset.filter(m => !m.getMove().hasFlag(MoveFlags.IGNORE_VIRTUAL));
    if (moves.length) {
      const move = moves[user.randSeedInt(moves.length)];
      const moveIndex = moveset.findIndex(m => m.moveId === move.moveId);
      const moveTargets = getMoveTargets(user, move.moveId);
      if (!moveTargets.targets.length)
        return false;
      const targets = moveTargets.multiple || moveTargets.targets.length === 1
        ? moveTargets.targets
        : moveTargets.targets.indexOf(target.getBattlerIndex()) > -1
          ? [ target.getBattlerIndex() ]
          : [ moveTargets.targets[user.randSeedInt(moveTargets.targets.length)] ];
      user.getMoveQueue().push({ move: move.moveId, targets: targets, ignorePP: this.enemyMoveset });
      user.scene.unshiftPhase(new MovePhase(user.scene, user, targets, moveset[moveIndex], true));
      return true;
    }

    return false;
  }
}

export class RandomMoveAttr extends OverrideMoveEffectAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): Promise<boolean> {
    return new Promise(resolve => {
      const moveIds = Utils.getEnumValues(Moves).filter(m => !allMoves[m].hasFlag(MoveFlags.IGNORE_VIRTUAL) && !allMoves[m].name.endsWith(' (N)'));
      const moveId = moveIds[user.randSeedInt(moveIds.length)];
      
      const moveTargets = getMoveTargets(user, moveId);
      if (!moveTargets.targets.length) {
        resolve(false);
        return;
      }
      const targets = moveTargets.multiple || moveTargets.targets.length === 1
        ? moveTargets.targets
        : moveTargets.targets.indexOf(target.getBattlerIndex()) > -1
          ? [ target.getBattlerIndex() ]
          : [ moveTargets.targets[user.randSeedInt(moveTargets.targets.length)] ];
      user.getMoveQueue().push({ move: moveId, targets: targets, ignorePP: true });
      user.scene.unshiftPhase(new MovePhase(user.scene, user, targets, new PokemonMove(moveId, 0, 0, true), true));
      initMoveAnim(moveId).then(() => {
        loadMoveAnimAssets(user.scene, [ moveId ], true)
          .then(() => resolve(true));
      });
    });
  }
}

const lastMoveCopiableCondition: MoveConditionFunc = (user, target, move) => {
  const copiableMove = user.scene.currentBattle.lastMove;

  if (!copiableMove)
    return false;

  if (allMoves[copiableMove].getAttrs(ChargeAttr).length)
    return false;

  // TODO: Add last turn of Bide

  return true;
};

export class CopyMoveAttr extends OverrideMoveEffectAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const lastMove = user.scene.currentBattle.lastMove;

    const moveTargets = getMoveTargets(user, lastMove);
    if (!moveTargets.targets.length)
      return false;

    const targets = moveTargets.multiple || moveTargets.targets.length === 1
      ? moveTargets.targets
      : moveTargets.targets.indexOf(target.getBattlerIndex()) > -1
        ? [ target.getBattlerIndex() ]
        : [ moveTargets.targets[user.randSeedInt(moveTargets.targets.length)] ];
    user.getMoveQueue().push({ move: lastMove, targets: targets, ignorePP: true });

    user.scene.unshiftPhase(new MovePhase(user.scene, user as PlayerPokemon, targets, new PokemonMove(lastMove, 0, 0, true), true));

    return true;
  }

  getCondition(): MoveConditionFunc {
    return lastMoveCopiableCondition;
  }
}

export class ReducePpMoveAttr extends MoveEffectAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    // Null checks can be skipped due to condition function
    const lastMove = target.getLastXMoves().find(() => true);
    const movesetMove = target.getMoveset().find(m => m.moveId === lastMove.move);
    const lastPpUsed = movesetMove.ppUsed;
    movesetMove.ppUsed = Math.min(movesetMove.ppUsed + 4, movesetMove.getMovePp());
    user.scene.queueMessage(`It reduced the PP of ${getPokemonMessage(target, `'s\n${movesetMove.getName()} by ${movesetMove.ppUsed - lastPpUsed}!`)}`);

    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => {
      const lastMove = target.getLastXMoves().find(() => true);
      if (lastMove) {
        const movesetMove = target.getMoveset().find(m => m.moveId === lastMove.move);
        return !!movesetMove?.getPpRatio();
      }
      return false;
    };
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    const lastMove = target.getLastXMoves().find(() => true);
    if (lastMove) {
      const movesetMove = target.getMoveset().find(m => m.moveId === lastMove.move);
      if (movesetMove) {
        const maxPp = movesetMove.getMovePp();
        const ppLeft = maxPp - movesetMove.ppUsed;
        const value = -(8 - Math.ceil(Math.min(maxPp, 30) / 5));
        if (ppLeft < 4)
          return (value / 4) * ppLeft;
        return value;
      }
    }

    return 0;
  }
}

// TODO: Review this
const targetMoveCopiableCondition: MoveConditionFunc = (user, target, move) => {
  const targetMoves = target.getMoveHistory().filter(m => !m.virtual);
  if (!targetMoves.length)
    return false;

  const copiableMove = targetMoves[0];

  if (!copiableMove.move)
    return false;

  if (allMoves[copiableMove.move].getAttrs(ChargeAttr).length && copiableMove.result === MoveResult.OTHER)
    return false;

    // TODO: Add last turn of Bide

    return true;
};

export class MovesetCopyMoveAttr extends OverrideMoveEffectAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const targetMoves = target.getMoveHistory().filter(m => !m.virtual);
    if (!targetMoves.length)
      return false;

    const copiedMove = allMoves[targetMoves[0].move];

    const thisMoveIndex = user.getMoveset().findIndex(m => m.moveId === move.id);

    if (thisMoveIndex === -1)
      return false;

    user.summonData.moveset = user.getMoveset().slice(0);
    user.summonData.moveset[thisMoveIndex] = new PokemonMove(copiedMove.id, 0, 0);

    user.scene.queueMessage(getPokemonMessage(user, ` copied\n${copiedMove.name}!`));

    return true;
  }

  getCondition(): MoveConditionFunc {
    return targetMoveCopiableCondition;
  }
}

export class SketchAttr extends MoveEffectAttr {
  constructor() {
    super(true);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    const targetMoves = target.getMoveHistory().filter(m => !m.virtual);
    if (!targetMoves.length)
      return false;

    const sketchedMove = allMoves[targetMoves[0].move];

    const sketchIndex = user.getMoveset().findIndex(m => m.moveId === move.id);

    if (sketchIndex === -1)
      return false;

    user.setMove(sketchIndex, sketchedMove.id);

    user.scene.queueMessage(getPokemonMessage(user, ` sketched\n${sketchedMove.name}!`));

    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => {
      if (!targetMoveCopiableCondition(user, target, move))
        return false;
    
      const targetMoves = target.getMoveHistory().filter(m => !m.virtual);
      if (!targetMoves.length)
        return false;
  
      const sketchableMove = targetMoves[0];
  
      if (user.getMoveset().find(m => m.moveId === sketchableMove.move))
        return false;
  
      return true;
    };
  }
}

export class SwitchAbilitiesAttr extends MoveEffectAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    const tempAbilityId = user.getAbility().id;
    user.summonData.ability = target.getAbility().id;
    target.summonData.ability = tempAbilityId;

    user.scene.queueMessage(getPokemonMessage(user, ` swapped\nAbilities with its target!`));

    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => !target.getAbility().hasAttr(ProtectAbilityAbAttr);
  }
}

export class TransformAttr extends MoveEffectAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): Promise<boolean> {
    return new Promise(resolve => {
      if (!super.apply(user, target, move, args))
        return resolve(false);

      user.summonData.speciesForm = target.getSpeciesForm();
      user.summonData.fusionSpeciesForm = target.getFusionSpeciesForm();
      user.summonData.gender = target.getGender();
      user.summonData.fusionGender = target.getFusionGender();
      user.summonData.stats = [ user.stats[Stat.HP] ].concat(target.stats.slice(1));
      user.summonData.battleStats = target.summonData.battleStats.slice(0);
      user.summonData.moveset = target.getMoveset().map(m => new PokemonMove(m.moveId, m.ppUsed, m.ppUp));
      user.summonData.types = target.getTypes();

      user.scene.queueMessage(getPokemonMessage(user, ` transformed\ninto ${target.name}!`));

      user.loadAssets().then(() => {
        user.playAnim();
        resolve(true);
      });
    });
  }
}

export class DiscourageFrequentUseAttr extends MoveAttr {
  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    const lastMoves = user.getLastXMoves(4);
    console.log(lastMoves);
    for (let m = 0; m < lastMoves.length; m++) {
      if (lastMoves[m].move === move.id)
        return (4 - (m + 1)) * -10;
    }

    return 0;
  }
}

const failOnGravityCondition: MoveConditionFunc = (user, target, move) => !user.scene.arena.getTag(ArenaTagType.GRAVITY);

const failOnBossCondition: MoveConditionFunc = (user, target, move) => !target.isBossImmune();

export type MoveAttrFilter = (attr: MoveAttr) => boolean;

function applyMoveAttrsInternal(attrFilter: MoveAttrFilter, user: Pokemon, target: Pokemon, move: Move, args: any[]): Promise<void> {
  return new Promise(resolve => {
    const attrPromises: Promise<boolean>[] = [];
    const moveAttrs = move.attrs.filter(a => attrFilter(a));
    for (let attr of moveAttrs) {
      const result = attr.apply(user, target, move, args);
      if (result instanceof Promise)
        attrPromises.push(result);
    }
    Promise.allSettled(attrPromises).then(() => resolve());
  });
}

export function applyMoveAttrs(attrType: { new(...args: any[]): MoveAttr }, user: Pokemon, target: Pokemon, move: Move, ...args: any[]): Promise<void> {
  return applyMoveAttrsInternal((attr: MoveAttr) => attr instanceof attrType, user, target, move, args);
}

export function applyFilteredMoveAttrs(attrFilter: MoveAttrFilter, user: Pokemon, target: Pokemon, move: Move, ...args: any[]): Promise<void> {
  return applyMoveAttrsInternal(attrFilter, user, target, move, args);
}

export class MoveCondition {
  protected func: MoveConditionFunc;

  constructor(func: MoveConditionFunc) {
    this.func = func;
  }

  apply(user: Pokemon, target: Pokemon, move: Move): boolean {
    return this.func(user, target, move);
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    return 0;
  }
}

export class FirstMoveCondition extends MoveCondition {
  constructor() {
    super((user, target, move) => user.battleSummonData?.turnCount === 1);
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    return this.apply(user, target, move) ? 10 : -20;
  }
}

export type MoveTargetSet = {
  targets: BattlerIndex[];
  multiple: boolean;
}

export function getMoveTargets(user: Pokemon, move: Moves): MoveTargetSet {
  const moveTarget = move ? allMoves[move].moveTarget : move === undefined ? MoveTarget.NEAR_ENEMY : [];
  const opponents = user.getOpponents();
  
  let set: Pokemon[] = [];
  let multiple = false;

  switch (moveTarget) {
    case MoveTarget.USER:
      set = [ user];
      break;
    case MoveTarget.NEAR_OTHER:
    case MoveTarget.OTHER:
    case MoveTarget.ALL_NEAR_OTHERS:
    case MoveTarget.ALL_OTHERS:
      set = (opponents.concat([ user.getAlly() ]));
      multiple = moveTarget === MoveTarget.ALL_NEAR_OTHERS || moveTarget === MoveTarget.ALL_OTHERS
      break;
    case MoveTarget.NEAR_ENEMY:
    case MoveTarget.ALL_NEAR_ENEMIES:
    case MoveTarget.ALL_ENEMIES:
    case MoveTarget.ENEMY_SIDE:
      set = opponents;
      multiple = moveTarget !== MoveTarget.NEAR_ENEMY;
      break;
    case MoveTarget.RANDOM_NEAR_ENEMY:
      set = [ opponents[user.randSeedInt(opponents.length)] ];
      break;
    case MoveTarget.ATTACKER:
        return { targets: [ -1 as BattlerIndex ], multiple: false };
    case MoveTarget.NEAR_ALLY:
    case MoveTarget.ALLY:
      set = [ user.getAlly() ];
      break;
    case MoveTarget.USER_OR_NEAR_ALLY:
    case MoveTarget.USER_AND_ALLIES:
    case MoveTarget.USER_SIDE:
      set = [ user, user.getAlly() ];
      multiple = moveTarget !== MoveTarget.USER_OR_NEAR_ALLY;
      break;
    case MoveTarget.ALL:
    case MoveTarget.BOTH_SIDES:
      set = [ user, user.getAlly() ].concat(opponents);
      multiple = true;
      break;
  }

  return { targets: set.filter(p => p?.isActive(true)).map(p => p.getBattlerIndex()).filter(t => t !== undefined), multiple };
}

export const allMoves: Move[] = [
  new SelfStatusMove(Moves.NONE, "-", Type.NORMAL, MoveCategory.STATUS, -1, "", -1, 0, 1),
];

export function initMoves() {
  allMoves.push(
    new AttackMove(Moves.POUND, "Pound", Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 35, "The target is physically pounded with a long tail, a foreleg, or the like.", -1, 0, 1),
    new AttackMove(Moves.KARATE_CHOP, "Karate Chop", Type.FIGHTING, MoveCategory.PHYSICAL, 50, 100, 25, "The target is attacked with a sharp chop. Critical hits land more easily.", -1, 0, 1)
      .attr(HighCritAttr),
    new AttackMove(Moves.DOUBLE_SLAP, "Double Slap", Type.NORMAL, MoveCategory.PHYSICAL, 15, 85, 10, "The target is slapped repeatedly, back and forth, two to five times in a row.", -1, 0, 1)
      .attr(MultiHitAttr),
    new AttackMove(Moves.COMET_PUNCH, "Comet Punch", Type.NORMAL, MoveCategory.PHYSICAL, 18, 85, 15, "The target is hit with a flurry of punches that strike two to five times in a row.", -1, 0, 1)
      .attr(MultiHitAttr)
      .punchingMove(),
    new AttackMove(Moves.MEGA_PUNCH, "Mega Punch", Type.NORMAL, MoveCategory.PHYSICAL, 80, 85, 20, "The target is slugged by a punch thrown with muscle-packed power.", -1, 0, 1)
      .punchingMove(),
    new AttackMove(Moves.PAY_DAY, "Pay Day (P)", Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 20, "Numerous coins are hurled at the target to inflict damage. Money is earned after the battle.", -1, 0, 1)
      .makesContact(false),
    new AttackMove(Moves.FIRE_PUNCH, "Fire Punch", Type.FIRE, MoveCategory.PHYSICAL, 75, 100, 15, "The target is punched with a fiery fist. This may also leave the target with a burn.", 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .punchingMove(),
    new AttackMove(Moves.ICE_PUNCH, "Ice Punch", Type.ICE, MoveCategory.PHYSICAL, 75, 100, 15, "The target is punched with an icy fist. This may also leave the target frozen.", 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.FREEZE)
      .punchingMove(),
    new AttackMove(Moves.THUNDER_PUNCH, "Thunder Punch", Type.ELECTRIC, MoveCategory.PHYSICAL, 75, 100, 15, "The target is punched with an electrified fist. This may also leave the target with paralysis.", 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .punchingMove(),
    new AttackMove(Moves.SCRATCH, "Scratch", Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 35, "Hard, pointed, sharp claws rake the target to inflict damage.", -1, 0, 1),
    new AttackMove(Moves.VICE_GRIP, "Vise Grip", Type.NORMAL, MoveCategory.PHYSICAL, 55, 100, 30, "The target is gripped and squeezed from both sides to inflict damage.", -1, 0, 1),
    new AttackMove(Moves.GUILLOTINE, "Guillotine", Type.NORMAL, MoveCategory.PHYSICAL, -1, 30, 5, "A vicious, tearing attack with big pincers. The target faints instantly if this attack hits.", -1, 0, 1)
      .attr(OneHitKOAttr)
      .attr(OneHitKOAccuracyAttr),
    new AttackMove(Moves.RAZOR_WIND, "Razor Wind", Type.NORMAL, MoveCategory.SPECIAL, 80, 100, 10, "In this two-turn attack, blades of wind hit opposing Pokémon on the second turn. Critical hits land more easily.", -1, 0, 1)
      .attr(ChargeAttr, ChargeAnim.RAZOR_WIND_CHARGING, 'whipped\nup a whirlwind!')
      .attr(HighCritAttr)
      .windMove()
      .ignoresVirtual()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new SelfStatusMove(Moves.SWORDS_DANCE, "Swords Dance", Type.NORMAL, -1, 20, "A frenetic dance to uplift the fighting spirit. This sharply raises the user's Attack stat.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.ATK, 2, true)
      .danceMove(),
    new AttackMove(Moves.CUT, "Cut", Type.NORMAL, MoveCategory.PHYSICAL, 50, 95, 30, "The target is cut with a scythe or claw.", -1, 0, 1)
      .slicingMove(),
    new AttackMove(Moves.GUST, "Gust", Type.FLYING, MoveCategory.SPECIAL, 40, 100, 35, "A gust of wind is whipped up by wings and launched at the target to inflict damage.", -1, 0, 1)
      .attr(HitsTagAttr, BattlerTagType.FLYING, true)
      .windMove(),
    new AttackMove(Moves.WING_ATTACK, "Wing Attack", Type.FLYING, MoveCategory.PHYSICAL, 60, 100, 35, "The target is struck with large, imposing wings spread wide to inflict damage.", -1, 0, 1),
    new StatusMove(Moves.WHIRLWIND, "Whirlwind", Type.NORMAL, -1, 20, "The target is blown away, and a different Pokémon is dragged out. In the wild, this ends a battle against a single Pokémon.", -1, -6, 1)
      .attr(ForceSwitchOutAttr)
      .hidesTarget()
      .windMove(),
    new AttackMove(Moves.FLY, "Fly", Type.FLYING, MoveCategory.PHYSICAL, 90, 95, 15, "The user flies up into the sky and then strikes its target on the next turn.", -1, 0, 1)
      .attr(ChargeAttr, ChargeAnim.FLY_CHARGING, 'flew\nup high!', BattlerTagType.FLYING)
      .condition(failOnGravityCondition)
      .ignoresVirtual(),
    new AttackMove(Moves.BIND, "Bind", Type.NORMAL, MoveCategory.PHYSICAL, 15, 85, 20, "Things such as long bodies or tentacles are used to bind and squeeze the target for four to five turns.", 100, 0, 1)
      .attr(TrapAttr, BattlerTagType.BIND),
    new AttackMove(Moves.SLAM, "Slam", Type.NORMAL, MoveCategory.PHYSICAL, 80, 75, 20, "The target is slammed with a long tail, vines, or the like to inflict damage.", -1, 0, 1),
    new AttackMove(Moves.VINE_WHIP, "Vine Whip", Type.GRASS, MoveCategory.PHYSICAL, 45, 100, 25, "The target is struck with slender, whiplike vines to inflict damage.", -1, 0, 1),
    new AttackMove(Moves.STOMP, "Stomp", Type.NORMAL, MoveCategory.PHYSICAL, 65, 100, 20, "The target is stomped with a big foot. This may also make the target flinch.", 30, 0, 1)
      .attr(FlinchAttr),
    new AttackMove(Moves.DOUBLE_KICK, "Double Kick", Type.FIGHTING, MoveCategory.PHYSICAL, 30, 100, 30, "The target is quickly kicked twice in succession using both feet.", -1, 0, 1)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.MEGA_KICK, "Mega Kick", Type.NORMAL, MoveCategory.PHYSICAL, 120, 75, 5, "The target is attacked by a kick launched with muscle-packed power.", -1, 0, 1),
    new AttackMove(Moves.JUMP_KICK, "Jump Kick", Type.FIGHTING, MoveCategory.PHYSICAL, 100, 95, 10, "The user jumps up high, then strikes with a kick. If the kick misses, the user hurts itself.", -1, 0, 1)
      .attr(MissEffectAttr, halveHpMissEffectFunc)
      .condition(failOnGravityCondition),
    new AttackMove(Moves.ROLLING_KICK, "Rolling Kick", Type.FIGHTING, MoveCategory.PHYSICAL, 60, 85, 15, "The user lashes out with a quick, spinning kick. This may also make the target flinch.", 30, 0, 1)
      .attr(FlinchAttr),
    new StatusMove(Moves.SAND_ATTACK, "Sand Attack", Type.GROUND, 100, 15, "Sand is hurled in the target's face, reducing the target's accuracy.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new AttackMove(Moves.HEADBUTT, "Headbutt", Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 15, "The user sticks out its head and attacks by charging straight into the target. This may also make the target flinch.", 30, 0, 1)
      .attr(FlinchAttr),
    new AttackMove(Moves.HORN_ATTACK, "Horn Attack", Type.NORMAL, MoveCategory.PHYSICAL, 65, 100, 25, "The target is jabbed with a sharply pointed horn to inflict damage.", -1, 0, 1),
    new AttackMove(Moves.FURY_ATTACK, "Fury Attack", Type.NORMAL, MoveCategory.PHYSICAL, 15, 85, 20, "The target is jabbed repeatedly with a horn or beak two to five times in a row.", -1, 0, 1)
      .attr(MultiHitAttr),
    new AttackMove(Moves.HORN_DRILL, "Horn Drill", Type.NORMAL, MoveCategory.PHYSICAL, -1, 30, 5, "The user stabs the target with a horn that rotates like a drill. The target faints instantly if this attack hits.", -1, 0, 1)
      .attr(OneHitKOAttr)
      .attr(OneHitKOAccuracyAttr),
    new AttackMove(Moves.TACKLE, "Tackle", Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 35, "A physical attack in which the user charges and slams into the target with its whole body.", -1, 0, 1),
    new AttackMove(Moves.BODY_SLAM, "Body Slam", Type.NORMAL, MoveCategory.PHYSICAL, 85, 100, 15, "The user drops onto the target with its full body weight. This may also leave the target with paralysis.", 30, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.WRAP, "Wrap", Type.NORMAL, MoveCategory.PHYSICAL, 15, 90, 20, "A long body, vines, or the like are used to wrap and squeeze the target for four to five turns.", 100, 0, 1)
      .attr(TrapAttr, BattlerTagType.WRAP),
    new AttackMove(Moves.TAKE_DOWN, "Take Down", Type.NORMAL, MoveCategory.PHYSICAL, 90, 85, 20, "A reckless, full-body charge attack for slamming into the target. This also damages the user a little.", -1, 0, 1)
      .attr(RecoilAttr),
    new AttackMove(Moves.THRASH, "Thrash", Type.NORMAL, MoveCategory.PHYSICAL, 120, 100, 10, "The user rampages and attacks for two to three turns. The user then becomes confused.", -1, 0, 1)
      .attr(FrenzyAttr)
      .attr(MissEffectAttr, frenzyMissFunc)
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new AttackMove(Moves.DOUBLE_EDGE, "Double-Edge", Type.NORMAL, MoveCategory.PHYSICAL, 120, 100, 15, "A reckless, life-risking tackle in which the user rushes the target. This also damages the user quite a lot.", -1, 0, 1)
      .attr(RecoilAttr),
    new StatusMove(Moves.TAIL_WHIP, "Tail Whip", Type.NORMAL, 100, 30, "The user wags its tail cutely, making opposing Pokémon less wary and lowering their Defense stats.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.DEF, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.POISON_STING, "Poison Sting", Type.POISON, MoveCategory.PHYSICAL, 15, 100, 35, "The user stabs the target with a poisonous stinger. This may also poison the target.", 30, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .makesContact(false),
    new AttackMove(Moves.TWINEEDLE, "Twineedle", Type.BUG, MoveCategory.PHYSICAL, 25, 100, 20, "The user damages the target twice in succession by jabbing it with two spikes. This may also poison the target.", 20, 0, 1)
      .attr(MultiHitAttr, MultiHitType._2)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .makesContact(false),
    new AttackMove(Moves.PIN_MISSILE, "Pin Missile", Type.BUG, MoveCategory.PHYSICAL, 25, 95, 20, "Sharp spikes are shot at the target in rapid succession. They hit two to five times in a row.", -1, 0, 1)
      .attr(MultiHitAttr)
      .makesContact(false),
    new StatusMove(Moves.LEER, "Leer", Type.NORMAL, 100, 30, "The user gives opposing Pokémon an intimidating leer that lowers the Defense stat.", 100, 0, 1)
      .attr(StatChangeAttr, BattleStat.DEF, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.BITE, "Bite", Type.DARK, MoveCategory.PHYSICAL, 60, 100, 25, "The target is bitten with viciously sharp fangs. This may also make the target flinch.", 30, 0, 1)
      .attr(FlinchAttr)
      .bitingMove(),
    new StatusMove(Moves.GROWL, "Growl", Type.NORMAL, 100, 40, "The user growls in an endearing way, making opposing Pokémon less wary. This lowers their Attack stats.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.ATK, -1)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.ROAR, "Roar", Type.NORMAL, -1, 20, "The target is scared off, and a different Pokémon is dragged out. In the wild, this ends a battle against a single Pokémon.", -1, -6, 1)
      .attr(ForceSwitchOutAttr)
      .soundBased()
      .hidesTarget(),
    new StatusMove(Moves.SING, "Sing", Type.NORMAL, 55, 15, "A soothing lullaby is sung in a calming voice that puts the target into a deep slumber.", -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .soundBased(),
    new StatusMove(Moves.SUPERSONIC, "Supersonic", Type.NORMAL, 55, 20, "The user generates odd sound waves from its body that confuse the target.", -1, 0, 1)
      .attr(ConfuseAttr)
      .soundBased(),
    new AttackMove(Moves.SONIC_BOOM, "Sonic Boom", Type.NORMAL, MoveCategory.SPECIAL, -1, 90, 20, "The target is hit with a destructive shock wave that always inflicts 20 HP damage.", -1, 0, 1)
      .attr(FixedDamageAttr, 20),
    new StatusMove(Moves.DISABLE, "Disable", Type.NORMAL, 100, 20, "For four turns, this move prevents the target from using the move it last used.", -1, 0, 1)
      .attr(DisableMoveAttr),
    new AttackMove(Moves.ACID, "Acid", Type.POISON, MoveCategory.SPECIAL, 40, 100, 30, "Opposing Pokémon are attacked with a spray of harsh acid. This may also lower their Sp. Def stats.", 10, 0, 1)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.EMBER, "Ember", Type.FIRE, MoveCategory.SPECIAL, 40, 100, 25, "The target is attacked with small flames. This may also leave the target with a burn.", 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.FLAMETHROWER, "Flamethrower", Type.FIRE, MoveCategory.SPECIAL, 90, 100, 15, "The target is scorched with an intense blast of fire. This may also leave the target with a burn.", 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new StatusMove(Moves.MIST, "Mist", Type.ICE, -1, 30, "The user cloaks itself and its allies in a white mist that prevents any of their stats from being lowered for five turns.", -1, 0, 1)
      .attr(AddArenaTagAttr, ArenaTagType.MIST, 5, true)
      .target(MoveTarget.USER_SIDE),
    new AttackMove(Moves.WATER_GUN, "Water Gun", Type.WATER, MoveCategory.SPECIAL, 40, 100, 25, "The target is blasted with a forceful shot of water.", -1, 0, 1),
    new AttackMove(Moves.HYDRO_PUMP, "Hydro Pump", Type.WATER, MoveCategory.SPECIAL, 110, 80, 5, "The target is blasted by a huge volume of water launched under great pressure.", -1, 0, 1),
    new AttackMove(Moves.SURF, "Surf", Type.WATER, MoveCategory.SPECIAL, 90, 100, 15, "The user attacks everything around it by swamping its surroundings with a giant wave.", -1, 0, 1)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.ICE_BEAM, "Ice Beam", Type.ICE, MoveCategory.SPECIAL, 90, 100, 10, "The target is struck with an icy-cold beam of energy. This may also leave the target frozen.", 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.FREEZE),
    new AttackMove(Moves.BLIZZARD, "Blizzard", Type.ICE, MoveCategory.SPECIAL, 110, 70, 5, "A howling blizzard is summoned to strike opposing Pokémon. This may also leave the opposing Pokémon frozen.", 10, 0, 1)
      .attr(BlizzardAccuracyAttr)
      .attr(StatusEffectAttr, StatusEffect.FREEZE) // TODO: 30% chance to hit protect/detect in hail
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.PSYBEAM, "Psybeam", Type.PSYCHIC, MoveCategory.SPECIAL, 65, 100, 20, "The target is attacked with a peculiar ray. This may also leave the target confused.", 10, 0, 1)
      .attr(ConfuseAttr),
    new AttackMove(Moves.BUBBLE_BEAM, "Bubble Beam", Type.WATER, MoveCategory.SPECIAL, 65, 100, 20, "A spray of bubbles is forcefully ejected at the target. This may also lower the target's Speed stat.", 10, 0, 1)
      .attr(StatChangeAttr, BattleStat.SPD, -1),
    new AttackMove(Moves.AURORA_BEAM, "Aurora Beam", Type.ICE, MoveCategory.SPECIAL, 65, 100, 20, "The target is hit with a rainbow-colored beam. This may also lower the target's Attack stat.", 10, 0, 1)
      .attr(StatChangeAttr, BattleStat.ATK, -1),
    new AttackMove(Moves.HYPER_BEAM, "Hyper Beam", Type.NORMAL, MoveCategory.SPECIAL, 150, 90, 5, "The target is attacked with a powerful beam. The user can't move on the next turn.", -1, 0, 1)
      .attr(RechargeAttr),
    new AttackMove(Moves.PECK, "Peck", Type.FLYING, MoveCategory.PHYSICAL, 35, 100, 35, "The target is jabbed with a sharply pointed beak or horn.", -1, 0, 1),
    new AttackMove(Moves.DRILL_PECK, "Drill Peck", Type.FLYING, MoveCategory.PHYSICAL, 80, 100, 20, "A corkscrewing attack that strikes the target with a sharp beak acting as a drill.", -1, 0, 1),
    new AttackMove(Moves.SUBMISSION, "Submission", Type.FIGHTING, MoveCategory.PHYSICAL, 80, 80, 20, "The user grabs the target and recklessly dives for the ground. This also damages the user a little.", -1, 0, 1)
      .attr(RecoilAttr),
    new AttackMove(Moves.LOW_KICK, "Low Kick", Type.FIGHTING, MoveCategory.PHYSICAL, -1, 100, 20, "A powerful low kick that makes the target fall over. The heavier the target, the greater the move's power.", -1, 0, 1)
      .attr(WeightPowerAttr),
    new AttackMove(Moves.COUNTER, "Counter", Type.FIGHTING, MoveCategory.PHYSICAL, -1, 100, 20, "A retaliation move that counters any physical attack, inflicting double the damage taken.", -1, -5, 1)
      .attr(CounterDamageAttr, (move: Move) => move.category === MoveCategory.PHYSICAL)
      .target(MoveTarget.ATTACKER),
    new AttackMove(Moves.SEISMIC_TOSS, "Seismic Toss", Type.FIGHTING, MoveCategory.PHYSICAL, -1, 100, 20, "The target is thrown using the power of gravity. It inflicts damage equal to the user's level.", -1, 0, 1)
      .attr(LevelDamageAttr),
    new AttackMove(Moves.STRENGTH, "Strength", Type.NORMAL, MoveCategory.PHYSICAL, 80, 100, 15, "The target is slugged with a punch thrown at maximum power.", -1, 0, 1),
    new AttackMove(Moves.ABSORB, "Absorb", Type.GRASS, MoveCategory.SPECIAL, 20, 100, 25, "A nutrient-draining attack. The user's HP is restored by half the damage taken by the target.", -1, 0, 1)
      .attr(HitHealAttr),
    new AttackMove(Moves.MEGA_DRAIN, "Mega Drain", Type.GRASS, MoveCategory.SPECIAL, 40, 100, 15, "A nutrient-draining attack. The user's HP is restored by half the damage taken by the target.", -1, 0, 1)
      .attr(HitHealAttr),
    new StatusMove(Moves.LEECH_SEED, "Leech Seed", Type.GRASS, 90, 10, "A seed is planted on the target. It steals some HP from the target every turn.", -1, 0, 1)
      .attr(AddBattlerTagAttr, BattlerTagType.SEEDED)
      .condition((user, target, move) => !target.getTag(BattlerTagType.SEEDED) && !target.isOfType(Type.GRASS)),
    new SelfStatusMove(Moves.GROWTH, "Growth", Type.NORMAL, -1, 20, "The user's body grows all at once, raising the Attack and Sp. Atk stats.", -1, 0, 1)
      .attr(GrowthStatChangeAttr),
    new AttackMove(Moves.RAZOR_LEAF, "Razor Leaf", Type.GRASS, MoveCategory.PHYSICAL, 55, 95, 25, "Sharp-edged leaves are launched to slash at opposing Pokémon. Critical hits land more easily.", -1, 0, 1)
      .attr(HighCritAttr)
      .makesContact(false)
      .slicingMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.SOLAR_BEAM, "Solar Beam", Type.GRASS, MoveCategory.SPECIAL, 120, 100, 10, "In this two-turn attack, the user gathers light, then blasts a bundled beam on the next turn.", -1, 0, 1)
      .attr(SunlightChargeAttr, ChargeAnim.SOLAR_BEAM_CHARGING, 'took\nin sunlight!')
      .attr(AntiSunlightPowerDecreaseAttr)
      .ignoresVirtual(),
    new StatusMove(Moves.POISON_POWDER, "Poison Powder", Type.POISON, 75, 35, "The user scatters a cloud of poisonous dust that poisons the target.", -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .powderMove(),
    new StatusMove(Moves.STUN_SPORE, "Stun Spore", Type.GRASS, 75, 30, "The user scatters a cloud of numbing powder that paralyzes the target.", -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .powderMove(),
    new StatusMove(Moves.SLEEP_POWDER, "Sleep Powder", Type.GRASS, 75, 15, "The user scatters a big cloud of sleep-inducing dust around the target.", -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .powderMove(),
    new AttackMove(Moves.PETAL_DANCE, "Petal Dance", Type.GRASS, MoveCategory.SPECIAL, 120, 100, 10, "The user attacks the target by scattering petals for two to three turns. The user then becomes confused.", -1, 0, 1)
      .attr(FrenzyAttr)
      .attr(MissEffectAttr, frenzyMissFunc)
      .makesContact()
      .danceMove()
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new StatusMove(Moves.STRING_SHOT, "String Shot", Type.BUG, 95, 40, "Opposing Pokémon are bound with silk blown from the user's mouth that harshly lowers the Speed stat.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.SPD, -2)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.DRAGON_RAGE, "Dragon Rage", Type.DRAGON, MoveCategory.SPECIAL, -1, 100, 10, "This attack hits the target with a shock wave of pure rage. This attack always inflicts 40 HP damage.", -1, 0, 1)
      .attr(FixedDamageAttr, 40),
    new AttackMove(Moves.FIRE_SPIN, "Fire Spin", Type.FIRE, MoveCategory.SPECIAL, 35, 85, 15, "The target becomes trapped within a fierce vortex of fire that rages for four to five turns.", 100, 0, 1)
      .attr(TrapAttr, BattlerTagType.FIRE_SPIN),
    new AttackMove(Moves.THUNDER_SHOCK, "Thunder Shock", Type.ELECTRIC, MoveCategory.SPECIAL, 40, 100, 30, "A jolt of electricity crashes down on the target to inflict damage. This may also leave the target with paralysis.", 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.THUNDERBOLT, "Thunderbolt", Type.ELECTRIC, MoveCategory.SPECIAL, 90, 100, 15, "A strong electric blast crashes down on the target. This may also leave the target with paralysis.", 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new StatusMove(Moves.THUNDER_WAVE, "Thunder Wave", Type.ELECTRIC, 90, 20, "The user launches a weak jolt of electricity that paralyzes the target.", -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .attr(ThunderAccuracyAttr)
      .attr(StatusMoveTypeImmunityAttr, Type.GROUND),
    new AttackMove(Moves.THUNDER, "Thunder", Type.ELECTRIC, MoveCategory.SPECIAL, 110, 70, 10, "A wicked thunderbolt is dropped on the target to inflict damage. This may also leave the target with paralysis.", 30, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.ROCK_THROW, "Rock Throw", Type.ROCK, MoveCategory.PHYSICAL, 50, 90, 15, "The user picks up and throws a small rock at the target to attack.", -1, 0, 1)
      .makesContact(false),
    new AttackMove(Moves.EARTHQUAKE, "Earthquake", Type.GROUND, MoveCategory.PHYSICAL, 100, 100, 10, "The user sets off an earthquake that strikes every Pokémon around it.", -1, 0, 1)
      .attr(HitsTagAttr, BattlerTagType.UNDERGROUND, true)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.FISSURE, "Fissure", Type.GROUND, MoveCategory.PHYSICAL, -1, 30, 5, "The user opens up a fissure in the ground and drops the target in. The target faints instantly if this attack hits.", -1, 0, 1)
      .attr(OneHitKOAttr)
      .attr(OneHitKOAccuracyAttr)
      .makesContact(false),
    new AttackMove(Moves.DIG, "Dig", Type.GROUND, MoveCategory.PHYSICAL, 80, 100, 10, "The user burrows into the ground, then attacks on the next turn.", -1, 0, 1)
      .attr(ChargeAttr, ChargeAnim.DIG_CHARGING, 'dug a hole!', BattlerTagType.UNDERGROUND)
      .ignoresVirtual(),
    new StatusMove(Moves.TOXIC, "Toxic", Type.POISON, 90, 10, "A move that leaves the target badly poisoned. Its poison damage worsens every turn.", -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.TOXIC),
    new AttackMove(Moves.CONFUSION, "Confusion", Type.PSYCHIC, MoveCategory.SPECIAL, 50, 100, 25, "The target is hit by a weak telekinetic force. This may also confuse the target.", 10, 0, 1)
      .attr(ConfuseAttr),
    new AttackMove(Moves.PSYCHIC, "Psychic", Type.PSYCHIC, MoveCategory.SPECIAL, 90, 100, 10, "The target is hit by a strong telekinetic force. This may also lower the target's Sp. Def stat.", 10, 0, 1)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1),
    new StatusMove(Moves.HYPNOSIS, "Hypnosis", Type.PSYCHIC, 60, 20, "The user employs hypnotic suggestion to make the target fall into a deep sleep.", -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP),
    new SelfStatusMove(Moves.MEDITATE, "Meditate", Type.PSYCHIC, -1, 40, "The user meditates to awaken the power deep within its body and raise its Attack stat.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.ATK, 1, true),
    new SelfStatusMove(Moves.AGILITY, "Agility", Type.PSYCHIC, -1, 30, "The user relaxes and lightens its body to move faster. This sharply raises the Speed stat.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.SPD, 2, true),
    new AttackMove(Moves.QUICK_ATTACK, "Quick Attack", Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 30, "The user lunges at the target at a speed that makes it almost invisible. This move always goes first.", -1, 1, 1),
    new AttackMove(Moves.RAGE, "Rage (P)", Type.NORMAL, MoveCategory.PHYSICAL, 20, 100, 20, "As long as this move is in use, the power of rage raises the Attack stat each time the user is hit in battle.", -1, 0, 1),
    new SelfStatusMove(Moves.TELEPORT, "Teleport", Type.PSYCHIC, -1, 20, "The user switches places with a party Pokémon in waiting, if any. If a wild Pokémon uses this move, it flees.", -1, -6, 1)
      .attr(ForceSwitchOutAttr, true)
      .hidesUser(),
    new AttackMove(Moves.NIGHT_SHADE, "Night Shade", Type.GHOST, MoveCategory.SPECIAL, -1, 100, 15, "The user makes the target see a frightening mirage. It inflicts damage equal to the user's level.", -1, 0, 1)
      .attr(LevelDamageAttr),
    new StatusMove(Moves.MIMIC, "Mimic", Type.NORMAL, -1, 10, "The user copies the target's last move. The move can be used during battle until the Pokémon is switched out.", -1, 0, 1)
      .attr(MovesetCopyMoveAttr)
      .ignoresVirtual(),
    new StatusMove(Moves.SCREECH, "Screech", Type.NORMAL, 85, 40, "An earsplitting screech harshly lowers the target's Defense stat.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.DEF, -2)
      .soundBased(),
    new SelfStatusMove(Moves.DOUBLE_TEAM, "Double Team", Type.NORMAL, -1, 15, "By moving rapidly, the user makes illusory copies of itself to raise its evasiveness.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.EVA, 1, true),
    new SelfStatusMove(Moves.RECOVER, "Recover", Type.NORMAL, -1, 5, "Restoring its own cells, the user restores its own HP by half of its max HP.", -1, 0, 1)
      .attr(HealAttr, 0.5),
    new SelfStatusMove(Moves.HARDEN, "Harden", Type.NORMAL, -1, 30, "The user stiffens all the muscles in its body to raise its Defense stat.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.DEF, 1, true),
    new SelfStatusMove(Moves.MINIMIZE, "Minimize", Type.NORMAL, -1, 10, "The user compresses its body to make itself look smaller, which sharply raises its evasiveness.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.EVA, 1, true),
    new StatusMove(Moves.SMOKESCREEN, "Smokescreen", Type.NORMAL, 100, 20, "The user releases an obscuring cloud of smoke or ink. This lowers the target's accuracy.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new StatusMove(Moves.CONFUSE_RAY, "Confuse Ray", Type.GHOST, 100, 10, "The target is exposed to a sinister ray that triggers confusion.", -1, 0, 1)
      .attr(ConfuseAttr),
    new SelfStatusMove(Moves.WITHDRAW, "Withdraw", Type.WATER, -1, 40, "The user withdraws its body into its hard shell, raising its Defense stat.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.DEF, 1, true),
    new SelfStatusMove(Moves.DEFENSE_CURL, "Defense Curl", Type.NORMAL, -1, 40, "The user curls up to conceal weak spots and raise its Defense stat.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.DEF, 1, true),
    new SelfStatusMove(Moves.BARRIER, "Barrier", Type.PSYCHIC, -1, 20, "The user throws up a sturdy wall that sharply raises its Defense stat.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.DEF, 2, true),
    new StatusMove(Moves.LIGHT_SCREEN, "Light Screen (N)", Type.PSYCHIC, -1, 30, "A wondrous wall of light is put up to reduce damage from special attacks for five turns.", -1, 0, 1)
      .target(MoveTarget.USER_SIDE),
    new StatusMove(Moves.HAZE, "Haze (N)", Type.ICE, -1, 30, "The user creates a haze that eliminates every stat change among all the Pokémon engaged in battle.", -1, 0, 1)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(Moves.REFLECT, "Reflect (N)", Type.PSYCHIC, -1, 20, "A wondrous wall of light is put up to reduce damage from physical attacks for five turns.", -1, 0, 1)
      .target(MoveTarget.USER_SIDE),
    new SelfStatusMove(Moves.FOCUS_ENERGY, "Focus Energy", Type.NORMAL, -1, 30, "The user takes a deep breath and focuses so that critical hits land more easily.", -1, 0, 1)
      .attr(AddBattlerTagAttr, BattlerTagType.CRIT_BOOST, true, true),
    new AttackMove(Moves.BIDE, "Bide (N)", Type.NORMAL, MoveCategory.PHYSICAL, -1, -1, 10, "The user endures attacks for two turns, then strikes back to cause double the damage taken.", -1, 1, 1)
      .ignoresVirtual()
      .target(MoveTarget.USER),
    new SelfStatusMove(Moves.METRONOME, "Metronome", Type.NORMAL, -1, 10, "The user waggles a finger and stimulates its brain into randomly using nearly any move.", -1, 0, 1)
      .attr(RandomMoveAttr)
      .ignoresVirtual(),
    new StatusMove(Moves.MIRROR_MOVE, "Mirror Move", Type.FLYING, -1, 20, "The user counters the target by mimicking the target's last move.", -1, 0, 1)
      .attr(CopyMoveAttr)
      .ignoresVirtual(),
    new AttackMove(Moves.SELF_DESTRUCT, "Self-Destruct", Type.NORMAL, MoveCategory.PHYSICAL, 200, 100, 5, "The user attacks everything around it by causing an explosion. The user faints upon using this move.", -1, 0, 1)
      .attr(SacrificialAttr)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.EGG_BOMB, "Egg Bomb", Type.NORMAL, MoveCategory.PHYSICAL, 100, 75, 10, "A large egg is hurled at the target with maximum force to inflict damage.", -1, 0, 1)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(Moves.LICK, "Lick", Type.GHOST, MoveCategory.PHYSICAL, 30, 100, 30, "The target is licked with a long tongue, causing damage. This may also leave the target with paralysis.", 30, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.SMOG, "Smog", Type.POISON, MoveCategory.SPECIAL, 30, 70, 20, "The target is attacked with a discharge of filthy gases. This may also poison the target.", 40, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(Moves.SLUDGE, "Sludge", Type.POISON, MoveCategory.SPECIAL, 65, 100, 20, "Unsanitary sludge is hurled at the target. This may also poison the target.", 30, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(Moves.BONE_CLUB, "Bone Club", Type.GROUND, MoveCategory.PHYSICAL, 65, 85, 20, "The user clubs the target with a bone. This may also make the target flinch.", 10, 0, 1)
      .attr(FlinchAttr)
      .makesContact(false),
    new AttackMove(Moves.FIRE_BLAST, "Fire Blast", Type.FIRE, MoveCategory.SPECIAL, 110, 85, 5, "The target is attacked with an intense blast of all-consuming fire. This may also leave the target with a burn.", 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.WATERFALL, "Waterfall", Type.WATER, MoveCategory.PHYSICAL, 80, 100, 15, "The user charges at the target and may make it flinch.", 20, 0, 1)
      .attr(FlinchAttr),
    new AttackMove(Moves.CLAMP, "Clamp", Type.WATER, MoveCategory.PHYSICAL, 35, 85, 15, "The target is clamped and squeezed by the user's very thick and sturdy shell for four to five turns.", 100, 0, 1)
      .attr(TrapAttr, BattlerTagType.CLAMP),
    new AttackMove(Moves.SWIFT, "Swift", Type.NORMAL, MoveCategory.SPECIAL, 60, -1, 20, "Star-shaped rays are shot at opposing Pokémon. This attack never misses.", -1, 0, 1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.SKULL_BASH, "Skull Bash", Type.NORMAL, MoveCategory.PHYSICAL, 130, 100, 10, "The user tucks in its head to raise its Defense stat on the first turn, then rams the target on the next turn.", 100, 0, 1)
      .attr(ChargeAttr, ChargeAnim.SKULL_BASH_CHARGING, 'lowered\nits head!', null, true)
      .attr(StatChangeAttr, BattleStat.DEF, 1, true)
      .ignoresVirtual(),
    new AttackMove(Moves.SPIKE_CANNON, "Spike Cannon", Type.NORMAL, MoveCategory.PHYSICAL, 20, 100, 15, "Sharp spikes are shot at the target in rapid succession. They hit two to five times in a row.", -1, 0, 1)
      .attr(MultiHitAttr)
      .makesContact(false),
    new AttackMove(Moves.CONSTRICT, "Constrict", Type.NORMAL, MoveCategory.PHYSICAL, 10, 100, 35, "The target is attacked with long, creeping tentacles, vines, or the like. This may also lower the target's  Speed stat.", 10, 0, 1)
      .attr(StatChangeAttr, BattleStat.SPD, -1),
    new SelfStatusMove(Moves.AMNESIA, "Amnesia", Type.PSYCHIC, -1, 20, "The user temporarily empties its mind to forget its concerns. This sharply raises the user's Sp. Def stat.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.SPDEF, 2, true),
    new StatusMove(Moves.KINESIS, "Kinesis", Type.PSYCHIC, 80, 15, "The user distracts the target by bending a spoon. This lowers the target's accuracy.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new SelfStatusMove(Moves.SOFT_BOILED, "Soft-Boiled", Type.NORMAL, -1, 5, "The user restores its own HP by up to half of its max HP.", -1, 0, 1)
      .attr(HealAttr, 0.5),
    new AttackMove(Moves.HIGH_JUMP_KICK, "High Jump Kick", Type.FIGHTING, MoveCategory.PHYSICAL, 130, 90, 10, "The target is attacked with a knee kick from a jump. If it misses, the user is hurt instead.", -1, 0, 1)
      .attr(MissEffectAttr, halveHpMissEffectFunc)
      .condition(failOnGravityCondition),
    new StatusMove(Moves.GLARE, "Glare", Type.NORMAL, 100, 30, "The user intimidates the target with the pattern on its belly to cause paralysis.", -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.DREAM_EATER, "Dream Eater", Type.PSYCHIC, MoveCategory.SPECIAL, 100, 100, 15, "The user eats the dreams of a sleeping target. The user's HP is restored by half the damage taken by the target.", -1, 0, 1)
      .attr(HitHealAttr)
      .condition((user, target, move) => target.status?.effect === StatusEffect.SLEEP),
    new StatusMove(Moves.POISON_GAS, "Poison Gas", Type.POISON, 90, 40, "A cloud of poison gas is sprayed in the face of opposing Pokémon, poisoning those it hits.", -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.BARRAGE, "Barrage", Type.NORMAL, MoveCategory.PHYSICAL, 15, 85, 20, "Round objects are hurled at the target to strike two to five times in a row.", -1, 0, 1)
      .attr(MultiHitAttr)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(Moves.LEECH_LIFE, "Leech Life", Type.BUG, MoveCategory.PHYSICAL, 80, 100, 10, "The user drains the target's blood. The user's HP is restored by half the damage taken by the target.", -1, 0, 1)
      .attr(HitHealAttr),
    new StatusMove(Moves.LOVELY_KISS, "Lovely Kiss", Type.NORMAL, 75, 10, "With a scary face, the user tries to force a kiss on the target. If it succeeds, the target falls asleep.", -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP),
    new AttackMove(Moves.SKY_ATTACK, "Sky Attack", Type.FLYING, MoveCategory.PHYSICAL, 140, 90, 5, "A second-turn attack move where critical hits land more easily. This may also make the target flinch.", 30, 0, 1)
      .attr(ChargeAttr, ChargeAnim.SKY_ATTACK_CHARGING, 'is glowing!')
      .attr(HighCritAttr)
      .attr(FlinchAttr)
      .makesContact(false)
      .ignoresVirtual(),
    new StatusMove(Moves.TRANSFORM, "Transform", Type.NORMAL, -1, 10, "The user transforms into a copy of the target right down to having the same move set.", -1, 0, 1)
      .attr(TransformAttr)
      .ignoresProtect(),
    new AttackMove(Moves.BUBBLE, "Bubble", Type.WATER, MoveCategory.SPECIAL, 40, 100, 30, "A spray of countless bubbles is jetted at the opposing Pokémon. This may also lower their Speed stat.", 10, 0, 1)
      .attr(StatChangeAttr, BattleStat.SPD, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.DIZZY_PUNCH, "Dizzy Punch", Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 10, "The target is hit with rhythmically launched punches. This may also leave the target confused.", 20, 0, 1)
      .attr(ConfuseAttr)
      .punchingMove(),
    new StatusMove(Moves.SPORE, "Spore", Type.GRASS, 100, 15, "The user scatters bursts of spores that induce sleep.", -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .powderMove(),
    new StatusMove(Moves.FLASH, "Flash", Type.NORMAL, 100, 20, "The user flashes a bright light that cuts the target's accuracy.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new AttackMove(Moves.PSYWAVE, "Psywave", Type.PSYCHIC, MoveCategory.SPECIAL, -1, 100, 15, "The target is attacked with an odd psychic wave. The attack varies in intensity.", -1, 0, 1)
      .attr(RandomLevelDamageAttr),
    new SelfStatusMove(Moves.SPLASH, "Splash", Type.NORMAL, -1, 40, "The user just flops and splashes around to no effect at all...", -1, 0, 1)
      .condition(failOnGravityCondition),
    new SelfStatusMove(Moves.ACID_ARMOR, "Acid Armor", Type.POISON, -1, 20, "The user alters its cellular structure to liquefy itself, sharply raising its Defense stat.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.DEF, 2, true),
    new AttackMove(Moves.CRABHAMMER, "Crabhammer", Type.WATER, MoveCategory.PHYSICAL, 100, 90, 10, "The target is hammered with a large pincer. Critical hits land more easily.", -1, 0, 1)
      .attr(HighCritAttr),
    new AttackMove(Moves.EXPLOSION, "Explosion", Type.NORMAL, MoveCategory.PHYSICAL, 250, 100, 5, "The user attacks everything around it by causing a tremendous explosion. The user faints upon using this move.", -1, 0, 1)
      .attr(SacrificialAttr)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.FURY_SWIPES, "Fury Swipes", Type.NORMAL, MoveCategory.PHYSICAL, 18, 80, 15, "The target is raked with sharp claws or scythes quickly two to five times in a row.", -1, 0, 1)
      .attr(MultiHitAttr),
    new AttackMove(Moves.BONEMERANG, "Bonemerang", Type.GROUND, MoveCategory.PHYSICAL, 50, 90, 10, "The user throws the bone it holds. The bone loops around to hit the target twice—coming and going.", -1, 0, 1)
      .attr(MultiHitAttr, MultiHitType._2)
      .makesContact(false),
    new SelfStatusMove(Moves.REST, "Rest", Type.PSYCHIC, -1, 5, "The user goes to sleep for two turns. This fully restores the user's HP and heals any status conditions.", -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP, true, 3, true)
      .attr(HealAttr, 1, true)
      .condition((user, target, move) => user.status?.effect !== StatusEffect.SLEEP),
    new AttackMove(Moves.ROCK_SLIDE, "Rock Slide", Type.ROCK, MoveCategory.PHYSICAL, 75, 90, 10, "Large boulders are hurled at opposing Pokémon to inflict damage. This may also make the opposing Pokémon flinch.", 30, 0, 1)
      .attr(FlinchAttr)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.HYPER_FANG, "Hyper Fang", Type.NORMAL, MoveCategory.PHYSICAL, 80, 90, 15, "The user bites hard on the target with its sharp front fangs. This may also make the target flinch.", 10, 0, 1)
      .attr(FlinchAttr)
      .bitingMove(),
    new SelfStatusMove(Moves.SHARPEN, "Sharpen", Type.NORMAL, -1, 30, "The user makes its edges more jagged,  which raises its Attack stat.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.ATK, 1, true),
    new SelfStatusMove(Moves.CONVERSION, "Conversion", Type.NORMAL, -1, 30, "The user changes its type to become the same type as the move at the top of the list of moves it knows.", -1, 0, 1)
      .attr(FirstMoveTypeAttr),
    new AttackMove(Moves.TRI_ATTACK, "Tri Attack", Type.NORMAL, MoveCategory.SPECIAL, 80, 100, 10, "The user strikes with a simultaneous three-beam attack. This may also burn, freeze, or paralyze the target.", 20, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .attr(StatusEffectAttr, StatusEffect.FREEZE),
    new AttackMove(Moves.SUPER_FANG, "Super Fang", Type.NORMAL, MoveCategory.PHYSICAL, -1, 90, 10, "The user chomps hard on the target with its sharp front fangs. This cuts the target's HP in half.", -1, 0, 1)
      .attr(TargetHalfHpDamageAttr),
    new AttackMove(Moves.SLASH, "Slash", Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 20, "The target is attacked with a slash of claws or blades. Critical hits land more easily.", -1, 0, 1)
      .attr(HighCritAttr)
      .slicingMove(),
    new SelfStatusMove(Moves.SUBSTITUTE, "Substitute (N)", Type.NORMAL, -1, 10, "The user creates a substitute for itself using some of its HP. The substitute serves as the user's decoy.", -1, 0, 1)
      .attr(RecoilAttr),
    new AttackMove(Moves.STRUGGLE, "Struggle", Type.NORMAL, MoveCategory.PHYSICAL, 50, -1, 1, "This attack is used in desperation only if the user has no PP. It also damages the user a little.", -1, 0, 1)
      .attr(RecoilAttr, true)
      .attr(TypelessAttr)
      .ignoresVirtual()
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new StatusMove(Moves.SKETCH, "Sketch", Type.NORMAL, -1, 1, "It enables the user to permanently learn the move last used by the target. Once used, Sketch disappears.", -1, 0, 2)
      .attr(SketchAttr)
      .ignoresVirtual(),
    new AttackMove(Moves.TRIPLE_KICK, "Triple Kick (P)", Type.FIGHTING, MoveCategory.PHYSICAL, 10, 90, 10, "A consecutive three-kick attack that becomes more powerful with each successful hit.", -1, 0, 2)
      .attr(MultiHitAttr, MultiHitType._3_INCR)
      .attr(MissEffectAttr, (user: Pokemon, move: Move) => {
        user.turnData.hitsLeft = 1;
        return true;
      }),
    new AttackMove(Moves.THIEF, "Thief", Type.DARK, MoveCategory.PHYSICAL, 60, 100, 25, "The user attacks and has a 30% chance to steal the target's held item simultaneously.", -1, 0, 2)
      .attr(StealHeldItemChanceAttr, 0.3),
    new StatusMove(Moves.SPIDER_WEB, "Spider Web", Type.BUG, -1, 10, "The user ensnares the target with thin, gooey silk so it can't flee from battle.", -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, true, 1),
    new StatusMove(Moves.MIND_READER, "Mind Reader", Type.NORMAL, -1, 5, "The user senses the target's movements with its mind to ensure its next attack does not miss the target.", -1, 0, 2)
      .attr(IgnoreAccuracyAttr),
    new StatusMove(Moves.NIGHTMARE, "Nightmare", Type.GHOST, 100, 15, "A sleeping target sees a nightmare that inflicts some damage every turn.", -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.NIGHTMARE)
      .condition((user, target, move) => target.status?.effect === StatusEffect.SLEEP),
    new AttackMove(Moves.FLAME_WHEEL, "Flame Wheel", Type.FIRE, MoveCategory.PHYSICAL, 60, 100, 25, "The user cloaks itself in fire and charges at the target. This may also leave the target with a burn.", 10, 0, 2)
      .attr(HealStatusEffectAttr, false, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.SNORE, "Snore", Type.NORMAL, MoveCategory.SPECIAL, 50, 100, 15, "This attack can be used only if the user is asleep. The harsh noise may also make the target flinch.", 30, 0, 2)
      .attr(BypassSleepAttr)
      .attr(FlinchAttr)
      .condition((user, target, move) => user.status?.effect === StatusEffect.SLEEP)
      .soundBased(),
    new StatusMove(Moves.CURSE, "Curse (P)", Type.GHOST, -1, 10, "A move that works differently for the Ghost type than for all other types.", -1, 0, 2)
      .attr(StatChangeAttr, BattleStat.SPD, -1, true)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF ], 1, true)
      .target(MoveTarget.USER),
    new AttackMove(Moves.FLAIL, "Flail", Type.NORMAL, MoveCategory.PHYSICAL, -1, 100, 15, "The user flails about aimlessly to attack. The less HP the user has, the greater the move's power.", -1, 0, 2)
      .attr(LowHpPowerAttr),
    new StatusMove(Moves.CONVERSION_2, "Conversion 2 (N)", Type.NORMAL, -1, 30, "The user changes its type to make itself resistant to the type of the attack the target used last.", -1, 0, 2),
    new AttackMove(Moves.AEROBLAST, "Aeroblast", Type.FLYING, MoveCategory.SPECIAL, 100, 95, 5, "A vortex of air is shot at the target to inflict damage. Critical hits land more easily.", -1, 0, 2)
      .attr(HighCritAttr),
    new StatusMove(Moves.COTTON_SPORE, "Cotton Spore", Type.GRASS, 100, 40, "The user releases cotton-like spores that cling to opposing Pokémon, which harshly lowers their Speed stats.", -1, 0, 2)
      .attr(StatChangeAttr, BattleStat.SPD, -2)
      .powderMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.REVERSAL, "Reversal", Type.FIGHTING, MoveCategory.PHYSICAL, -1, 100, 15, "An all-out attack that becomes more powerful the less HP the user has.", -1, 0, 2)
      .attr(LowHpPowerAttr),
    new StatusMove(Moves.SPITE, "Spite", Type.GHOST, 100, 10, "The user unleashes its grudge on the move last used by the target by cutting 4 PP from it.", -1, 0, 2)
      .attr(ReducePpMoveAttr),
    new AttackMove(Moves.POWDER_SNOW, "Powder Snow", Type.ICE, MoveCategory.SPECIAL, 40, 100, 25, "The user attacks with a chilling gust of powdery snow. This may also freeze opposing Pokémon.", 10, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.FREEZE)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new SelfStatusMove(Moves.PROTECT, "Protect", Type.NORMAL, -1, 10, "This move enables the user to protect itself from all attacks. Its chance of failing rises if it is used in succession.", -1, 4, 2)
      .attr(ProtectAttr),
    new AttackMove(Moves.MACH_PUNCH, "Mach Punch", Type.FIGHTING, MoveCategory.PHYSICAL, 40, 100, 30, "The user throws a punch at blinding speed. This move always goes first.", -1, 1, 2)
      .punchingMove(),
    new StatusMove(Moves.SCARY_FACE, "Scary Face", Type.NORMAL, 100, 10, "The user frightens the target with a scary face to harshly lower its Speed stat.", -1, 0, 2)
      .attr(StatChangeAttr, BattleStat.SPD, -2),
    new AttackMove(Moves.FEINT_ATTACK, "Feint Attack", Type.DARK, MoveCategory.PHYSICAL, 60, -1, 20, "The user approaches the target disarmingly, then throws a sucker punch. This attack never misses.", -1, 0, 2),
    new StatusMove(Moves.SWEET_KISS, "Sweet Kiss", Type.FAIRY, 75, 10, "The user kisses the target with a sweet, angelic cuteness that causes confusion.", -1, 0, 2)
      .attr(ConfuseAttr),
    new SelfStatusMove(Moves.BELLY_DRUM, "Belly Drum", Type.NORMAL, -1, 10, "The user maximizes its Attack stat in exchange for HP equal to half its max HP.", -1, 0, 2)
      .attr(HalfHpStatMaxAttr, BattleStat.ATK),
    new AttackMove(Moves.SLUDGE_BOMB, "Sludge Bomb", Type.POISON, MoveCategory.SPECIAL, 90, 100, 10, "Unsanitary sludge is hurled at the target. This may also poison the target.", 30, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .ballBombMove(),
    new AttackMove(Moves.MUD_SLAP, "Mud-Slap", Type.GROUND, MoveCategory.SPECIAL, 20, 100, 10, "The user hurls mud in the target's face to inflict damage and lower its accuracy.", 100, 0, 2)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new AttackMove(Moves.OCTAZOOKA, "Octazooka", Type.WATER, MoveCategory.SPECIAL, 65, 85, 10, "The user attacks by spraying ink in the target's face or eyes. This may also lower the target's accuracy.", 50, 0, 2)
      .attr(StatChangeAttr, BattleStat.ACC, -1)
      .ballBombMove(),
    new StatusMove(Moves.SPIKES, "Spikes", Type.GROUND, -1, 20, "The user lays a trap of spikes at the opposing team's feet. The trap hurts Pokémon that switch into battle.", -1, 0, 2)
      .attr(AddArenaTrapTagAttr, ArenaTagType.SPIKES)
      .target(MoveTarget.ENEMY_SIDE),
    new AttackMove(Moves.ZAP_CANNON, "Zap Cannon", Type.ELECTRIC, MoveCategory.SPECIAL, 120, 50, 5, "The user fires an electric blast like a cannon to inflict damage and cause paralysis.", 100, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .ballBombMove(),
    new StatusMove(Moves.FORESIGHT, "Foresight (N)", Type.NORMAL, -1, 40, "Enables a Ghost-type target to be hit by Normal- and Fighting-type attacks. This also enables an evasive target to be hit.", -1, 0, 2),
    new SelfStatusMove(Moves.DESTINY_BOND, "Destiny Bond (N)", Type.GHOST, -1, 5, "After using this move, if the user faints, the Pokémon that landed the knockout hit also faints. Its chance of failing rises if it is used in succession.", -1, 0, 2)
      .ignoresProtect(),
    new StatusMove(Moves.PERISH_SONG, "Perish Song", Type.NORMAL, -1, 5, "Any Pokémon that hears this song faints in three turns, unless it switches out of battle.", -1, 0, 2)
      .attr(FaintCountdownAttr)
      .ignoresProtect()
      .soundBased()
      .condition(failOnBossCondition)
      .target(MoveTarget.ALL),
    new AttackMove(Moves.ICY_WIND, "Icy Wind", Type.ICE, MoveCategory.SPECIAL, 55, 95, 15, "The user attacks with a gust of chilled air. This also lowers opposing Pokémon's Speed stats.", 100, 0, 2)
      .attr(StatChangeAttr, BattleStat.SPD, -1)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new SelfStatusMove(Moves.DETECT, "Detect", Type.FIGHTING, -1, 5, "This move enables the user to protect itself from all attacks. Its chance of failing rises if it is used in succession.", -1, 4, 2)
      .attr(ProtectAttr),
    new AttackMove(Moves.BONE_RUSH, "Bone Rush", Type.GROUND, MoveCategory.PHYSICAL, 25, 90, 10, "The user strikes the target with a hard bone two to five times in a row.", -1, 0, 2)
      .attr(MultiHitAttr)
      .makesContact(false),
    new StatusMove(Moves.LOCK_ON, "Lock-On", Type.NORMAL, -1, 5, "The user takes sure aim at the target. This ensures the next attack does not miss the target.", -1, 0, 2)
      .attr(IgnoreAccuracyAttr),
    new AttackMove(Moves.OUTRAGE, "Outrage", Type.DRAGON, MoveCategory.PHYSICAL, 120, 100, 10, "The user rampages and attacks for two to three turns. The user then becomes confused.", -1, 0, 2)
      .attr(FrenzyAttr)
      .attr(MissEffectAttr, frenzyMissFunc)
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new StatusMove(Moves.SANDSTORM, "Sandstorm", Type.ROCK, -1, 10, "A five-turn sandstorm is summoned to hurt all combatants except Rock, Ground, and Steel types. It raises the Sp. Def stat of Rock types.", -1, 0, 2)
      .attr(WeatherChangeAttr, WeatherType.SANDSTORM)
      .windMove()
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.GIGA_DRAIN, "Giga Drain", Type.GRASS, MoveCategory.SPECIAL, 75, 100, 10, "A nutrient-draining attack. The user's HP is restored by half the damage taken by the target.", -1, 0, 2)
      .attr(HitHealAttr),
    new SelfStatusMove(Moves.ENDURE, "Endure", Type.NORMAL, -1, 10, "The user endures any attack with at least 1 HP. Its chance of failing rises if it is used in succession.", -1, 4, 2)
      .attr(EndureAttr),
    new StatusMove(Moves.CHARM, "Charm", Type.FAIRY, 100, 20, "The user gazes at the target rather charmingly, making it less wary. This harshly lowers the target's Attack stat.", -1, 0, 2)
      .attr(StatChangeAttr, BattleStat.ATK, -2),
    new AttackMove(Moves.ROLLOUT, "Rollout", Type.ROCK, MoveCategory.PHYSICAL, 30, 90, 20, "The user continually rolls into the target over five turns. It becomes more powerful each time it hits.", -1, 0, 2)
      .attr(ConsecutiveUseDoublePowerAttr, 5, true, true, Moves.DEFENSE_CURL),
    new AttackMove(Moves.FALSE_SWIPE, "False Swipe (P)", Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 40, "A restrained attack that prevents the target from fainting. The target is left with at least 1 HP.", -1, 0, 2),
    new StatusMove(Moves.SWAGGER, "Swagger", Type.NORMAL, 85, 15, "The user enrages and confuses the target. However, this also sharply raises the target's Attack stat.", -1, 0, 2)
      .attr(StatChangeAttr, BattleStat.ATK, 2)
      .attr(ConfuseAttr),
    new SelfStatusMove(Moves.MILK_DRINK, "Milk Drink", Type.NORMAL, -1, 5, "The user restores its own HP by up to half of its max HP.", -1, 0, 2)
      .attr(HealAttr, 0.5),
    new AttackMove(Moves.SPARK, "Spark", Type.ELECTRIC, MoveCategory.PHYSICAL, 65, 100, 20, "The user throws an electrically charged tackle at the target. This may also leave the target with paralysis.", 30, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.FURY_CUTTER, "Fury Cutter", Type.BUG, MoveCategory.PHYSICAL, 40, 95, 20, "The target is slashed with scythes or claws. This attack becomes more powerful if it hits in succession.", -1, 0, 2)
      .attr(ConsecutiveUseDoublePowerAttr, 3, true)
      .slicingMove(),
    new AttackMove(Moves.STEEL_WING, "Steel Wing", Type.STEEL, MoveCategory.PHYSICAL, 70, 90, 25, "The target is hit with wings of steel. This may also raise the user's Defense stat.", 10, 0, 2)
      .attr(StatChangeAttr, BattleStat.DEF, 1, true),
    new StatusMove(Moves.MEAN_LOOK, "Mean Look", Type.NORMAL, -1, 5, "The user pins the target with a dark, arresting look. The target becomes unable to flee.", -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, true, 1),
    new StatusMove(Moves.ATTRACT, "Attract", Type.NORMAL, 100, 15, "If it is the opposite gender of the user, the target becomes infatuated and less likely to attack.", -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.INFATUATED)
      .condition((user, target, move) => user.isOppositeGender(target)),
    new SelfStatusMove(Moves.SLEEP_TALK, "Sleep Talk", Type.NORMAL, -1, 10, "While it is asleep, the user randomly uses one of the moves it knows.", -1, 0, 2)
      .attr(BypassSleepAttr)
      .attr(RandomMovesetMoveAttr)
      .condition((user, target, move) => user.status?.effect === StatusEffect.SLEEP),
    new StatusMove(Moves.HEAL_BELL, "Heal Bell (N)", Type.NORMAL, -1, 5, "The user makes a soothing bell chime to heal the status conditions of all the party Pokémon.", -1, 0, 2)
      .soundBased()
      .target(MoveTarget.USER_AND_ALLIES),
    new AttackMove(Moves.RETURN, "Return", Type.NORMAL, MoveCategory.PHYSICAL, -1, 100, 20, "This full-power attack grows more powerful the more the user likes its Trainer.", -1, 0, 2)
      .attr(FriendshipPowerAttr),
    new AttackMove(Moves.PRESENT, "Present (N)", Type.NORMAL, MoveCategory.PHYSICAL, -1, 90, 15, "The user attacks by giving the target a gift with a hidden trap. It restores HP sometimes, however.", -1, 0, 2)
      .makesContact(false),
    new AttackMove(Moves.FRUSTRATION, "Frustration", Type.NORMAL, MoveCategory.PHYSICAL, -1, 100, 20, "This full-power attack grows more powerful the less the user likes its Trainer.", -1, 0, 2)
      .attr(FriendshipPowerAttr, true),
    new StatusMove(Moves.SAFEGUARD, "Safeguard (N)", Type.NORMAL, -1, 25, "The user creates a protective field that prevents status conditions for five turns.", -1, 0, 2)
      .target(MoveTarget.USER_SIDE),
    new StatusMove(Moves.PAIN_SPLIT, "Pain Split", Type.NORMAL, -1, 20, "The user adds its HP to the target's HP, then equally shares the combined HP with the target.", -1, 0, 2)
      .attr(HpSplitAttr)
      .condition(failOnBossCondition),
    new AttackMove(Moves.SACRED_FIRE, "Sacred Fire", Type.FIRE, MoveCategory.PHYSICAL, 100, 95, 5, "The target is razed with a mystical fire of great intensity. This may also leave the target with a burn.", 50, 0, 2)
      .attr(HealStatusEffectAttr, false, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .makesContact(false),
    new AttackMove(Moves.MAGNITUDE, "Magnitude", Type.GROUND, MoveCategory.PHYSICAL, -1, 100, 30, "The user attacks everything around it with a ground-shaking quake. Its power varies.", -1, 0, 2)
      .attr(PreMoveMessageAttr, magnitudeMessageFunc)
      .attr(MagnitudePowerAttr)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.DYNAMIC_PUNCH, "Dynamic Punch", Type.FIGHTING, MoveCategory.PHYSICAL, 100, 50, 5, "The user punches the target with full, concentrated power. This confuses the target if it hits.", 100, 0, 2)
      .attr(ConfuseAttr)
      .punchingMove(),
    new AttackMove(Moves.MEGAHORN, "Megahorn", Type.BUG, MoveCategory.PHYSICAL, 120, 85, 10, "Using its tough and impressive horn, the user rams into the target with no letup.", -1, 0, 2),
    new AttackMove(Moves.DRAGON_BREATH, "Dragon Breath", Type.DRAGON, MoveCategory.SPECIAL, 60, 100, 20, "The user exhales a mighty gust that inflicts damage. This may also leave the target with paralysis.", 30, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new SelfStatusMove(Moves.BATON_PASS, "Baton Pass", Type.NORMAL, -1, 40, "The user switches places with a party Pokémon in waiting and passes along any stat changes.", -1, 0, 2)
      .attr(ForceSwitchOutAttr, true, true)
      .hidesUser(),
    new StatusMove(Moves.ENCORE, "Encore", Type.NORMAL, 100, 5, "The user compels the target to keep using the move it encored for three turns.", -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.ENCORE, false, true)
      .condition((user, target, move) => new EncoreTag(move.id, user.id).canAdd(target)),
    new AttackMove(Moves.PURSUIT, "Pursuit (P)", Type.DARK, MoveCategory.PHYSICAL, 40, 100, 20, "The power of this attack move is doubled if it's used on a target that's switching out of battle.", -1, 0, 2),
    new AttackMove(Moves.RAPID_SPIN, "Rapid Spin", Type.NORMAL, MoveCategory.PHYSICAL, 50, 100, 40, "A spin attack that can also eliminate such moves as Bind, Wrap, and Leech Seed. This also raises the user's Speed stat.", 100, 0, 2)
      .attr(StatChangeAttr, BattleStat.SPD, 1, true)
      .attr(LapseBattlerTagAttr, [ BattlerTagType.BIND, BattlerTagType.WRAP, BattlerTagType.FIRE_SPIN, BattlerTagType.WHIRLPOOL, BattlerTagType.CLAMP, BattlerTagType.SAND_TOMB, BattlerTagType.MAGMA_STORM, BattlerTagType.THUNDER_CAGE, BattlerTagType.SEEDED ], true),
    new StatusMove(Moves.SWEET_SCENT, "Sweet Scent", Type.NORMAL, 100, 20, "A sweet scent that harshly lowers opposing Pokémon's evasiveness.", -1, 0, 2)
      .attr(StatChangeAttr, BattleStat.EVA, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.IRON_TAIL, "Iron Tail", Type.STEEL, MoveCategory.PHYSICAL, 100, 75, 15, "The target is slammed with a steel-hard tail. This may also lower the target's Defense stat.", 30, 0, 2)
      .attr(StatChangeAttr, BattleStat.DEF, -1),
    new AttackMove(Moves.METAL_CLAW, "Metal Claw", Type.STEEL, MoveCategory.PHYSICAL, 50, 95, 35, "The target is raked with steel claws. This may also raise the user's Attack stat.", 10, 0, 2)
      .attr(StatChangeAttr, BattleStat.ATK, 1, true),
    new AttackMove(Moves.VITAL_THROW, "Vital Throw", Type.FIGHTING, MoveCategory.PHYSICAL, 70, -1, 10, "The user attacks last. In return, this throw move never misses.", -1, -1, 2),
    new SelfStatusMove(Moves.MORNING_SUN, "Morning Sun", Type.NORMAL, -1, 5, "The user restores its own HP. The amount of HP regained varies with the weather.", -1, 0, 2)
      .attr(PlantHealAttr),
    new SelfStatusMove(Moves.SYNTHESIS, "Synthesis", Type.GRASS, -1, 5, "The user restores its own HP. The amount of HP regained varies with the weather.", -1, 0, 2)
      .attr(PlantHealAttr),
    new SelfStatusMove(Moves.MOONLIGHT, "Moonlight", Type.FAIRY, -1, 5, "The user restores its own HP. The amount of HP regained varies with the weather.", -1, 0, 2)
      .attr(PlantHealAttr),
    new AttackMove(Moves.HIDDEN_POWER, "Hidden Power (P)", Type.NORMAL, MoveCategory.SPECIAL, 60, 100, 15, "A unique attack that varies in type depending on the Pokémon using it.", -1, 0, 2),
    new AttackMove(Moves.CROSS_CHOP, "Cross Chop", Type.FIGHTING, MoveCategory.PHYSICAL, 100, 80, 5, "The user delivers a double chop with its forearms crossed. Critical hits land more easily.", -1, 0, 2)
      .attr(HighCritAttr),
    new AttackMove(Moves.TWISTER, "Twister", Type.DRAGON, MoveCategory.SPECIAL, 40, 100, 20, "The user whips up a vicious tornado to tear at opposing Pokémon. This may also make them flinch.", 20, 0, 2)
      .attr(HitsTagAttr, BattlerTagType.FLYING, true)
      .attr(FlinchAttr)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.RAIN_DANCE, "Rain Dance", Type.WATER, -1, 5, "The user summons a heavy rain that falls for five turns, powering up Water-type moves. It lowers the power of Fire-type moves.", -1, 0, 2)
      .attr(WeatherChangeAttr, WeatherType.RAIN)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(Moves.SUNNY_DAY, "Sunny Day", Type.FIRE, -1, 5, "The user intensifies the sun for five turns, powering up Fire-type moves. It lowers the power of Water-type moves.", -1, 0, 2)
      .attr(WeatherChangeAttr, WeatherType.SUNNY)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.CRUNCH, "Crunch", Type.DARK, MoveCategory.PHYSICAL, 80, 100, 15, "The user crunches up the target with sharp fangs. This may also lower the target's Defense stat.", 20, 0, 2)
      .attr(StatChangeAttr, BattleStat.DEF, -1)
      .bitingMove(),
    new AttackMove(Moves.MIRROR_COAT, "Mirror Coat", Type.PSYCHIC, MoveCategory.SPECIAL, -1, 100, 20, "A retaliation move that counters any special attack, inflicting double the damage taken.", -1, -5, 2)
      .attr(CounterDamageAttr, (move: Move) => move.category === MoveCategory.SPECIAL)
      .target(MoveTarget.ATTACKER),
    new StatusMove(Moves.PSYCH_UP, "Psych Up (N)", Type.NORMAL, -1, 10, "The user hypnotizes itself into copying any stat change made by the target.", -1, 0, 2),
    new AttackMove(Moves.EXTREME_SPEED, "Extreme Speed", Type.NORMAL, MoveCategory.PHYSICAL, 80, 100, 5, "The user charges the target at blinding speed. This move always goes first.", -1, 2, 2),
    new AttackMove(Moves.ANCIENT_POWER, "Ancient Power", Type.ROCK, MoveCategory.SPECIAL, 60, 100, 5, "The user attacks with a prehistoric power. This may also raise all the user's stats at once.", 10, 0, 2)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF, BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD ], 1, true),
    new AttackMove(Moves.SHADOW_BALL, "Shadow Ball", Type.GHOST, MoveCategory.SPECIAL, 80, 100, 15, "The user hurls a shadowy blob at the target. This may also lower the target's Sp. Def stat.", 20, 0, 2)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1)
      .ballBombMove(),
    new AttackMove(Moves.FUTURE_SIGHT, "Future Sight", Type.PSYCHIC, MoveCategory.SPECIAL, 120, 100, 10, "Two turns after this move is used, a hunk of psychic energy attacks the target.", -1, 0, 2)
      .attr(DelayedAttackAttr, ArenaTagType.FUTURE_SIGHT, ChargeAnim.FUTURE_SIGHT_CHARGING, 'foresaw\nan attack!'),
    new AttackMove(Moves.ROCK_SMASH, "Rock Smash", Type.FIGHTING, MoveCategory.PHYSICAL, 40, 100, 15, "The user attacks with a punch. This may also lower the target's Defense stat.", 50, 0, 2)
      .attr(StatChangeAttr, BattleStat.DEF, -1),
    new AttackMove(Moves.WHIRLPOOL, "Whirlpool", Type.WATER, MoveCategory.SPECIAL, 35, 85, 15, "The user traps the target in a violent swirling whirlpool for four to five turns.", 100, 0, 2)
      .attr(TrapAttr, BattlerTagType.WHIRLPOOL),
    new AttackMove(Moves.BEAT_UP, "Beat Up (N)", Type.DARK, MoveCategory.PHYSICAL, -1, 100, 10, "The user gets all party Pokémon to attack the target. The more party Pokémon, the greater the number of attacks.", -1, 0, 2)
      .makesContact(false),
    new AttackMove(Moves.FAKE_OUT, "Fake Out", Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 10, "This attack hits first and makes the target flinch. It only works the first turn each time the user enters battle.", 100, 3, 3)
      .attr(FlinchAttr)
      .condition(new FirstMoveCondition()),
    new AttackMove(Moves.UPROAR, "Uproar (P)", Type.NORMAL, MoveCategory.SPECIAL, 90, 100, 10, "The user attacks in an uproar for three turns. During that time, no Pokémon can fall asleep.", -1, 0, 3)
      .ignoresVirtual()
      .soundBased()
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new SelfStatusMove(Moves.STOCKPILE, "Stockpile (N)", Type.NORMAL, -1, 20, "The user charges up power and raises both its Defense and Sp. Def stats. The move can be used three times.", -1, 0, 3),
    new AttackMove(Moves.SPIT_UP, "Spit Up (N)", Type.NORMAL, MoveCategory.SPECIAL, -1, 100, 10, "The power stored using the move Stockpile is released at once in an attack. The more power is stored, the greater the move's power.", -1, 0, 3),
    new SelfStatusMove(Moves.SWALLOW, "Swallow (N)", Type.NORMAL, -1, 10, "The power stored using the move Stockpile is absorbed by the user to heal its HP. Storing more power heals more HP.", -1, 0, 3),
    new AttackMove(Moves.HEAT_WAVE, "Heat Wave", Type.FIRE, MoveCategory.SPECIAL, 95, 90, 10, "The user attacks by exhaling hot breath on opposing Pokémon. This may also leave those Pokémon with a burn.", 10, 0, 3)
      .attr(HealStatusEffectAttr, false, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.HAIL, "Hail", Type.ICE, -1, 10, "The user summons a hailstorm lasting five turns. It damages all Pokémon except Ice types.", -1, 0, 3)
      .attr(WeatherChangeAttr, WeatherType.HAIL)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(Moves.TORMENT, "Torment (N)", Type.DARK, 100, 15, "The user torments and enrages the target, making it incapable of using the same move twice in a row.", -1, 0, 3),
    new StatusMove(Moves.FLATTER, "Flatter", Type.DARK, 100, 15, "Flattery is used to confuse the target. However, this also raises the target's Sp. Atk stat.", -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPATK, 1)
      .attr(ConfuseAttr),
    new StatusMove(Moves.WILL_O_WISP, "Will-O-Wisp", Type.FIRE, 85, 15, "The user shoots a sinister flame at the target to inflict a burn.", -1, 0, 3)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new StatusMove(Moves.MEMENTO, "Memento", Type.DARK, 100, 10, "The user faints when using this move. In return, this harshly lowers the target's Attack and Sp. Atk stats.", -1, 0, 3)
      .attr(SacrificialAttr)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.SPATK ], -2),
    new AttackMove(Moves.FACADE, "Facade", Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 20, "This attack move doubles its power if the user is poisoned, burned, or paralyzed.", -1, 0, 3)
      .attr(MovePowerMultiplierAttr, (user, target, move) => user.status
        && (user.status.effect === StatusEffect.BURN || user.status.effect === StatusEffect.POISON || user.status.effect === StatusEffect.TOXIC || user.status.effect === StatusEffect.PARALYSIS) ? 2 : 1),
    new AttackMove(Moves.FOCUS_PUNCH, "Focus Punch (P)", Type.FIGHTING, MoveCategory.PHYSICAL, 150, 100, 20, "The user focuses its mind before launching a punch. This move fails if the user is hit before it is used.", -1, -3, 3)
      .punchingMove()
      .ignoresVirtual(),
    new AttackMove(Moves.SMELLING_SALTS, "Smelling Salts", Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 10, "This attack's power is doubled when used on a target with paralysis. This also cures the target's paralysis, however.", -1, 0, 3)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.status?.effect === StatusEffect.PARALYSIS ? 2 : 1)
      .attr(HealStatusEffectAttr, false, StatusEffect.PARALYSIS),
    new SelfStatusMove(Moves.FOLLOW_ME, "Follow Me (N)", Type.NORMAL, -1, 20, "The user draws attention to itself, making all targets take aim only at the user.", -1, 2, 3),
    new StatusMove(Moves.NATURE_POWER, "Nature Power (N)", Type.NORMAL, -1, 20, "This attack makes use of nature's power. Its effects vary depending on the user's environment.", -1, 0, 3),
    new SelfStatusMove(Moves.CHARGE, "Charge (P)", Type.ELECTRIC, -1, 20, "The user boosts the power of the Electric move it uses on the next turn. This also raises the user's Sp. Def stat.", -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPDEF, 1, true),
    new StatusMove(Moves.TAUNT, "Taunt (N)", Type.DARK, 100, 20, "The target is taunted into a rage that allows it to use only attack moves for three turns.", -1, 0, 3),
    new StatusMove(Moves.HELPING_HAND, "Helping Hand (N)", Type.NORMAL, -1, 20, "The user assists an ally by boosting the power of that ally's attack.", -1, 5, 3)
      .target(MoveTarget.NEAR_ALLY),
    new StatusMove(Moves.TRICK, "Trick (N)", Type.PSYCHIC, 100, 10, "The user catches the target off guard and swaps its held item with its own.", -1, 0, 3),
    new StatusMove(Moves.ROLE_PLAY, "Role Play (N)", Type.PSYCHIC, -1, 10, "The user mimics the target completely, copying the target's Ability.", -1, 0, 3),
    new SelfStatusMove(Moves.WISH, "Wish (N)", Type.NORMAL, -1, 10, "One turn after this move is used, the user's or its replacement's HP is restored by half the user's max HP.", -1, 0, 3),
    new SelfStatusMove(Moves.ASSIST, "Assist", Type.NORMAL, -1, 20, "The user hurriedly and randomly uses a move among those known by ally Pokémon.", -1, 0, 3)
      .attr(RandomMovesetMoveAttr, true)
      .ignoresVirtual(),
    new SelfStatusMove(Moves.INGRAIN, "Ingrain", Type.GRASS, -1, 20, "The user lays roots that restore its HP on every turn. Because it's rooted, it can't switch out.", -1, 0, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.INGRAIN, true, true),
    new AttackMove(Moves.SUPERPOWER, "Superpower", Type.FIGHTING, MoveCategory.PHYSICAL, 120, 100, 5, "The user attacks the target with great power. However, this also lowers the user's Attack and Defense stats.", 100, 0, 3)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF ], -1, true),
    new SelfStatusMove(Moves.MAGIC_COAT, "Magic Coat (N)", Type.PSYCHIC, -1, 15, "Moves like Leech Seed and moves that inflict status conditions are blocked by a barrier and reflected back to the user of those moves.", -1, 4, 3),
    new SelfStatusMove(Moves.RECYCLE, "Recycle (N)", Type.NORMAL, -1, 10, "The user recycles a held item that has been used in battle so it can be used again.", -1, 0, 3),
    new AttackMove(Moves.REVENGE, "Revenge (P)", Type.FIGHTING, MoveCategory.PHYSICAL, 60, 100, 10, "This attack move's power is doubled if the user has been hurt by the opponent in the same turn.", -1, -4, 3),
    new AttackMove(Moves.BRICK_BREAK, "Brick Break (P)", Type.FIGHTING, MoveCategory.PHYSICAL, 75, 100, 15, "The user attacks with a swift chop. It can also break barriers, such as Light Screen and Reflect.", -1, 0, 3),
    new StatusMove(Moves.YAWN, "Yawn", Type.NORMAL, -1, 10, "The user lets loose a huge yawn that lulls the target into falling asleep on the next turn.", -1, 0, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.DROWSY, false, true)
      .condition((user, target, move) => !target.status),
    new AttackMove(Moves.KNOCK_OFF, "Knock Off (P)", Type.DARK, MoveCategory.PHYSICAL, 65, 100, 20, "The user slaps down the target's held item, and that item can't be used in that battle. The move does more damage if the target has a held item.", -1, 0, 3),
    new AttackMove(Moves.ENDEAVOR, "Endeavor", Type.NORMAL, MoveCategory.PHYSICAL, -1, 100, 5, "This attack move cuts down the target's HP to equal the user's HP.", -1, 0, 3)
      .attr(MatchHpAttr)
      .condition(failOnBossCondition),
    new AttackMove(Moves.ERUPTION, "Eruption", Type.FIRE, MoveCategory.SPECIAL, 150, 100, 5, "The user attacks opposing Pokémon with explosive fury. The lower the user's HP, the lower the move's power.", -1, 0, 3)
      .attr(HpPowerAttr)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.SKILL_SWAP, "Skill Swap", Type.PSYCHIC, -1, 10, "The user employs its psychic power to exchange Abilities with the target.", -1, 0, 3)
      .attr(SwitchAbilitiesAttr),
    new SelfStatusMove(Moves.IMPRISON, "Imprison (N)", Type.PSYCHIC, -1, 10, "If opposing Pokémon know any move also known by the user, they are prevented from using it.", -1, 0, 3),
    new SelfStatusMove(Moves.REFRESH, "Refresh", Type.NORMAL, -1, 20, "The user rests to cure itself of poisoning, a burn, or paralysis.", -1, 0, 3)
      .attr(HealStatusEffectAttr, true, StatusEffect.PARALYSIS, StatusEffect.POISON, StatusEffect.TOXIC, StatusEffect.BURN)
      .condition((user, target, move) => user.status && (user.status.effect === StatusEffect.PARALYSIS || user.status.effect === StatusEffect.POISON || user.status.effect === StatusEffect.TOXIC || user.status.effect === StatusEffect.BURN)),
    new SelfStatusMove(Moves.GRUDGE, "Grudge (N)", Type.GHOST, -1, 5, "If the user faints, the user's grudge fully depletes the PP of the opponent's move that knocked it out.", -1, 0, 3),
    new SelfStatusMove(Moves.SNATCH, "Snatch (N)", Type.DARK, -1, 10, "The user steals the effects of any attempts to use a healing or stat-changing move.", -1, 4, 3),
    new AttackMove(Moves.SECRET_POWER, "Secret Power (P)", Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 20, "The additional effects of this attack depend upon where it was used.", 30, 0, 3)
      .makesContact(false),
    new AttackMove(Moves.DIVE, "Dive", Type.WATER, MoveCategory.PHYSICAL, 80, 100, 10, "Diving on the first turn, the user floats up and attacks on the next turn.", -1, 0, 3)
      .attr(ChargeAttr, ChargeAnim.DIVE_CHARGING, 'hid\nunderwater!', BattlerTagType.UNDERGROUND)
      .ignoresVirtual(),
    new AttackMove(Moves.ARM_THRUST, "Arm Thrust", Type.FIGHTING, MoveCategory.PHYSICAL, 15, 100, 20, "The user lets loose a flurry of open-palmed arm thrusts that hit two to five times in a row.", -1, 0, 3)
      .attr(MultiHitAttr),
    new SelfStatusMove(Moves.CAMOUFLAGE, "Camouflage", Type.NORMAL, -1, 20, "The user's type is changed depending on its environment, such as at water's edge, in grass, or in a cave.", -1, 0, 3)
      .attr(CopyBiomeTypeAttr),
    new SelfStatusMove(Moves.TAIL_GLOW, "Tail Glow", Type.BUG, -1, 20, "The user stares at flashing lights to focus its mind, drastically raising its Sp. Atk stat.", -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPATK, 3, true),
    new AttackMove(Moves.LUSTER_PURGE, "Luster Purge", Type.PSYCHIC, MoveCategory.SPECIAL, 95, 100, 5, "The user lets loose a damaging burst of light. This may also lower the target's Sp. Def stat.", 50, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1),
    new AttackMove(Moves.MIST_BALL, "Mist Ball", Type.PSYCHIC, MoveCategory.SPECIAL, 95, 100, 5, "A mist-like flurry of down envelops and damages the target. This may also lower the target's Sp. Atk stat.", 50, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPATK, -1)
      .ballBombMove(),
    new StatusMove(Moves.FEATHER_DANCE, "Feather Dance", Type.FLYING, 100, 15, "The user covers the target's body with a mass of down that harshly lowers its Attack stat.", -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.ATK, -2)
      .danceMove(),
    new StatusMove(Moves.TEETER_DANCE, "Teeter Dance", Type.NORMAL, 100, 20, "The user performs a wobbly dance that confuses the Pokémon around it.", -1, 0, 3)
      .attr(ConfuseAttr)
      .danceMove()
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.BLAZE_KICK, "Blaze Kick", Type.FIRE, MoveCategory.PHYSICAL, 85, 90, 10, "The user launches a kick that lands a critical hit more easily. This may also leave the target with a burn.", 10, 0, 3)
      .attr(HighCritAttr)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new StatusMove(Moves.MUD_SPORT, "Mud Sport", Type.GROUND, -1, 15, "The user kicks up mud on the battlefield. This weakens Electric-type moves for five turns.", -1, 0, 3)
      .attr(AddArenaTagAttr, ArenaTagType.MUD_SPORT, 5)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.ICE_BALL, "Ice Ball", Type.ICE, MoveCategory.PHYSICAL, 30, 90, 20, "The user attacks the target for five turns. The move's power increases each time it hits.", -1, 0, 3)
      .attr(ConsecutiveUseDoublePowerAttr, 5, true, true, Moves.DEFENSE_CURL)
      .ballBombMove(),
    new AttackMove(Moves.NEEDLE_ARM, "Needle Arm", Type.GRASS, MoveCategory.PHYSICAL, 60, 100, 15, "The user attacks by wildly swinging its thorny arms. This may also make the target flinch.", 30, 0, 3)
      .attr(FlinchAttr),
    new SelfStatusMove(Moves.SLACK_OFF, "Slack Off", Type.NORMAL, -1, 5, "The user slacks off, restoring its own HP by up to half of its max HP.", -1, 0, 3)
      .attr(HealAttr, 0.5),
    new AttackMove(Moves.HYPER_VOICE, "Hyper Voice", Type.NORMAL, MoveCategory.SPECIAL, 90, 100, 10, "The user lets loose a horribly echoing shout with the power to inflict damage.", -1, 0, 3)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.POISON_FANG, "Poison Fang", Type.POISON, MoveCategory.PHYSICAL, 50, 100, 15, "The user bites the target with toxic fangs. This may also leave the target badly poisoned.", 50, 0, 3)
      .attr(StatusEffectAttr, StatusEffect.TOXIC)
      .bitingMove(),
    new AttackMove(Moves.CRUSH_CLAW, "Crush Claw", Type.NORMAL, MoveCategory.PHYSICAL, 75, 95, 10, "The user slashes the target with hard and sharp claws. This may also lower the target's Defense stat.", 50, 0, 3)
      .attr(StatChangeAttr, BattleStat.DEF, -1),
    new AttackMove(Moves.BLAST_BURN, "Blast Burn", Type.FIRE, MoveCategory.SPECIAL, 150, 90, 5, "The target is razed by a fiery explosion. The user can't move on the next turn.", -1, 0, 3)
      .attr(RechargeAttr),
    new AttackMove(Moves.HYDRO_CANNON, "Hydro Cannon", Type.WATER, MoveCategory.SPECIAL, 150, 90, 5, "The target is hit with a watery blast. The user can't move on the next turn.", -1, 0, 3)
      .attr(RechargeAttr),
    new AttackMove(Moves.METEOR_MASH, "Meteor Mash", Type.STEEL, MoveCategory.PHYSICAL, 90, 90, 10, "The target is hit with a hard punch fired like a meteor. This may also raise the user's Attack stat.", 20, 0, 3)
      .attr(StatChangeAttr, BattleStat.ATK, 1, true)
      .punchingMove(),
    new AttackMove(Moves.ASTONISH, "Astonish", Type.GHOST, MoveCategory.PHYSICAL, 30, 100, 15, "The user attacks the target while shouting in a startling fashion. This may also make the target flinch.", 30, 0, 3)
      .attr(FlinchAttr),
    new AttackMove(Moves.WEATHER_BALL, "Weather Ball (P)", Type.NORMAL, MoveCategory.SPECIAL, 50, 100, 10, "This attack move varies in power and type depending on the weather.", -1, 0, 3)
      .ballBombMove(),
    new StatusMove(Moves.AROMATHERAPY, "Aromatherapy (N)", Type.GRASS, -1, 5, "The user releases a soothing scent that heals all status conditions affecting the user's party.", -1, 0, 3)
      .target(MoveTarget.USER_AND_ALLIES),
    new StatusMove(Moves.FAKE_TEARS, "Fake Tears", Type.DARK, 100, 20, "The user feigns crying to fluster the target, harshly lowering its Sp. Def stat.", -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPDEF, -2),
    new AttackMove(Moves.AIR_CUTTER, "Air Cutter", Type.FLYING, MoveCategory.SPECIAL, 60, 95, 25, "The user launches razor-like wind to slash opposing Pokémon. Critical hits land more easily.", -1, 0, 3)
      .attr(HighCritAttr)
      .slicingMove()
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.OVERHEAT, "Overheat", Type.FIRE, MoveCategory.SPECIAL, 130, 90, 5, "The user attacks the target at full power. The attack's recoil harshly lowers the user's Sp. Atk stat.", 100, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPATK, -2, true)
      .attr(HealStatusEffectAttr, false, StatusEffect.FREEZE),
    new StatusMove(Moves.ODOR_SLEUTH, "Odor Sleuth (N)", Type.NORMAL, -1, 40, "Enables a Ghost-type target to be hit by Normal- and Fighting-type attacks. This also enables an evasive target to be hit.", -1, 0, 3),
    new AttackMove(Moves.ROCK_TOMB, "Rock Tomb", Type.ROCK, MoveCategory.PHYSICAL, 60, 95, 15, "Boulders are hurled at the target. This also lowers the target's Speed stat by preventing its movement.", 100, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPD, -1)
      .makesContact(false),
    new AttackMove(Moves.SILVER_WIND, "Silver Wind", Type.BUG, MoveCategory.SPECIAL, 60, 100, 5, "The target is attacked with powdery scales blown by the wind. This may also raise all the user's stats.", 10, 0, 3)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF, BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD ], 1, true)
      .windMove(),
    new StatusMove(Moves.METAL_SOUND, "Metal Sound", Type.STEEL, 85, 40, "A horrible sound like scraping metal harshly lowers the target's Sp. Def stat.", -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPDEF, -2)
      .soundBased(),
    new StatusMove(Moves.GRASS_WHISTLE, "Grass Whistle", Type.GRASS, 55, 15, "The user plays a pleasant melody that lulls the target into a deep sleep.", -1, 0, 3)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .soundBased(),
    new StatusMove(Moves.TICKLE, "Tickle", Type.NORMAL, 100, 20, "The user tickles the target into laughing, reducing its Attack and Defense stats.", -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.ATK, -1)
      .attr(StatChangeAttr, BattleStat.DEF, -1),
    new SelfStatusMove(Moves.COSMIC_POWER, "Cosmic Power", Type.PSYCHIC, -1, 20, "The user absorbs a mystical power from space to raise its Defense and Sp. Def stats.", -1, 0, 3)
      .attr(StatChangeAttr, [ BattleStat.DEF, BattleStat.SPDEF ], 1, true),
    new AttackMove(Moves.WATER_SPOUT, "Water Spout", Type.WATER, MoveCategory.SPECIAL, 150, 100, 5, "The user spouts water to damage opposing Pokémon. The lower the user's HP, the lower the move's power.", -1, 0, 3)
      .attr(HpPowerAttr)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.SIGNAL_BEAM, "Signal Beam", Type.BUG, MoveCategory.SPECIAL, 75, 100, 15, "The user attacks with a sinister beam of light. This may also confuse the target.", 10, 0, 3)
      .attr(ConfuseAttr),
    new AttackMove(Moves.SHADOW_PUNCH, "Shadow Punch", Type.GHOST, MoveCategory.PHYSICAL, 60, -1, 20, "The user throws a punch from the shadows. This attack never misses.", -1, 0, 3)
      .punchingMove(),
    new AttackMove(Moves.EXTRASENSORY, "Extrasensory", Type.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 20, "The user attacks with an odd, unseeable power. This may also make the target flinch.", 10, 0, 3)
      .attr(FlinchAttr),
    new AttackMove(Moves.SKY_UPPERCUT, "Sky Uppercut", Type.FIGHTING, MoveCategory.PHYSICAL, 85, 90, 15, "The user attacks the target with an uppercut thrown skyward with force.", -1, 0, 3)
      .attr(HitsTagAttr, BattlerTagType.FLYING)
      .punchingMove(),
    new AttackMove(Moves.SAND_TOMB, "Sand Tomb", Type.GROUND, MoveCategory.PHYSICAL, 35, 85, 15, "The user traps the target inside a harshly raging sandstorm for four to five turns.", 100, 0, 3)
      .attr(TrapAttr, BattlerTagType.SAND_TOMB)
      .makesContact(false),
    new AttackMove(Moves.SHEER_COLD, "Sheer Cold", Type.ICE, MoveCategory.SPECIAL, -1, 30, 5, "The target faints instantly. It's less likely to hit the target if it's used by Pokémon other than Ice types.", -1, 0, 3)
      .attr(OneHitKOAttr)
      .attr(OneHitKOAccuracyAttr),
    new AttackMove(Moves.MUDDY_WATER, "Muddy Water", Type.WATER, MoveCategory.SPECIAL, 90, 85, 10, "The user attacks by shooting muddy water at opposing Pokémon. This may also lower their accuracy.", 30, 0, 3)
      .attr(StatChangeAttr, BattleStat.ACC, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.BULLET_SEED, "Bullet Seed", Type.GRASS, MoveCategory.PHYSICAL, 25, 100, 30, "The user forcefully shoots seeds at the target two to five times in a row.", -1, 0, 3)
      .attr(MultiHitAttr)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(Moves.AERIAL_ACE, "Aerial Ace", Type.FLYING, MoveCategory.PHYSICAL, 60, -1, 20, "The user confounds the target with speed, then slashes. This attack never misses.", -1, 0, 3)
      .slicingMove(),
    new AttackMove(Moves.ICICLE_SPEAR, "Icicle Spear", Type.ICE, MoveCategory.PHYSICAL, 25, 100, 30, "The user launches sharp icicles at the target two to five times in a row.", -1, 0, 3)
      .attr(MultiHitAttr)
      .makesContact(false),
    new SelfStatusMove(Moves.IRON_DEFENSE, "Iron Defense", Type.STEEL, -1, 15, "The user hardens its body's surface like iron, sharply raising its Defense stat.", -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.DEF, 2, true),
    new StatusMove(Moves.BLOCK, "Block", Type.NORMAL, -1, 5, "The user blocks the target's way with arms spread wide to prevent escape.", -1, 0, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, true, 1),
    new StatusMove(Moves.HOWL, "Howl", Type.NORMAL, -1, 40, "The user howls loudly to raise the spirit of itself and allies. This raises their Attack stats.", -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.ATK, 1)
      .soundBased()
      .target(MoveTarget.USER_AND_ALLIES),
    new AttackMove(Moves.DRAGON_CLAW, "Dragon Claw", Type.DRAGON, MoveCategory.PHYSICAL, 80, 100, 15, "The user slashes the target with huge sharp claws.", -1, 0, 3),
    new AttackMove(Moves.FRENZY_PLANT, "Frenzy Plant", Type.GRASS, MoveCategory.SPECIAL, 150, 90, 5, "The user slams the target with the roots of an enormous tree. The user can't move on the next turn.", -1, 0, 3)
      .attr(RechargeAttr),
    new SelfStatusMove(Moves.BULK_UP, "Bulk Up", Type.FIGHTING, -1, 20, "The user tenses its muscles to bulk up its body, raising both its Attack and Defense stats.", -1, 0, 3)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF ], 1, true),
    new AttackMove(Moves.BOUNCE, "Bounce", Type.FLYING, MoveCategory.PHYSICAL, 85, 85, 5, "The user bounces up high, then drops on the target on the second turn. This may also leave the target with paralysis.", 30, 0, 3)
      .attr(ChargeAttr, ChargeAnim.BOUNCE_CHARGING, 'sprang up!', BattlerTagType.FLYING)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .condition(failOnGravityCondition)
      .ignoresVirtual(),
    new AttackMove(Moves.MUD_SHOT, "Mud Shot", Type.GROUND, MoveCategory.SPECIAL, 55, 95, 15, "The user attacks by hurling a blob of mud at the target. This also lowers the target's Speed stat.", 100, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPD, -1),
    new AttackMove(Moves.POISON_TAIL, "Poison Tail", Type.POISON, MoveCategory.PHYSICAL, 50, 100, 25, "The user hits the target with its tail. This may also poison the target. Critical hits land more easily.", 10, 0, 3)
      .attr(HighCritAttr)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(Moves.COVET, "Covet", Type.NORMAL, MoveCategory.PHYSICAL, 60, 100, 25, "The user endearingly approaches the target, then has a 30% chance to steal the target's held item.", -1, 0, 3)
      .attr(StealHeldItemChanceAttr, 0.3),
    new AttackMove(Moves.VOLT_TACKLE, "Volt Tackle", Type.ELECTRIC, MoveCategory.PHYSICAL, 120, 100, 15, "The user electrifies itself and charges the target. This also damages the user quite a lot. This attack may leave the target with paralysis.", 10, 0, 3)
      .attr(RecoilAttr)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.MAGICAL_LEAF, "Magical Leaf", Type.GRASS, MoveCategory.SPECIAL, 60, -1, 20, "The user scatters curious leaves that chase the target. This attack never misses.", -1, 0, 3),
    new StatusMove(Moves.WATER_SPORT, "Water Sport", Type.WATER, -1, 15, "The user soaks the battlefield with water. This weakens Fire-type moves for five turns.", -1, 0, 3)
      .attr(AddArenaTagAttr, ArenaTagType.WATER_SPORT, 5)
      .target(MoveTarget.BOTH_SIDES),
    new SelfStatusMove(Moves.CALM_MIND, "Calm Mind", Type.PSYCHIC, -1, 20, "The user quietly focuses its mind and calms its spirit to raise its Sp. Atk and Sp. Def stats.", -1, 0, 3)
      .attr(StatChangeAttr, [ BattleStat.SPATK, BattleStat.SPDEF ], 1, true),
    new AttackMove(Moves.LEAF_BLADE, "Leaf Blade", Type.GRASS, MoveCategory.PHYSICAL, 90, 100, 15, "The user handles a sharp leaf like a sword and attacks by cutting its target. Critical hits land more easily.", -1, 0, 3)
      .attr(HighCritAttr)
      .slicingMove(),
    new SelfStatusMove(Moves.DRAGON_DANCE, "Dragon Dance", Type.DRAGON, -1, 20, "The user vigorously performs a mystic, powerful dance that raises its Attack and Speed stats.", -1, 0, 3)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.SPD ], 1, true)
      .danceMove(),
    new AttackMove(Moves.ROCK_BLAST, "Rock Blast", Type.ROCK, MoveCategory.PHYSICAL, 25, 90, 10, "The user hurls hard rocks at the target. Two to five rocks are launched in a row.", -1, 0, 3)
      .attr(MultiHitAttr)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(Moves.SHOCK_WAVE, "Shock Wave", Type.ELECTRIC, MoveCategory.SPECIAL, 60, -1, 20, "The user strikes the target with a quick jolt of electricity. This attack never misses.", -1, 0, 3),
    new AttackMove(Moves.WATER_PULSE, "Water Pulse", Type.WATER, MoveCategory.SPECIAL, 60, 100, 20, "The user attacks the target with a pulsing blast of water. This may also confuse the target.", 20, 0, 3)
      .attr(ConfuseAttr)
      .pulseMove(),
    new AttackMove(Moves.DOOM_DESIRE, "Doom Desire", Type.STEEL, MoveCategory.SPECIAL, 140, 100, 5, "Two turns after this move is used, a concentrated bundle of light blasts the target.", -1, 0, 3)
      .attr(DelayedAttackAttr, ArenaTagType.DOOM_DESIRE, ChargeAnim.DOOM_DESIRE_CHARGING, 'chose\nDOOM DESIRE as its destiny!'),
    new AttackMove(Moves.PSYCHO_BOOST, "Psycho Boost", Type.PSYCHIC, MoveCategory.SPECIAL, 140, 90, 5, "The user attacks the target at full power. The attack's recoil harshly lowers the user's Sp. Atk stat.", 100, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPATK, -2, true),
    new SelfStatusMove(Moves.ROOST, "Roost", Type.FLYING, -1, 5, "The user lands and rests its body. This move restores the user's HP by up to half of its max HP.", -1, 0, 4)
      .attr(HealAttr, 0.5)
      .attr(AddBattlerTagAttr, BattlerTagType.IGNORE_FLYING, true, false, 1),
    new StatusMove(Moves.GRAVITY, "Gravity", Type.PSYCHIC, -1, 5, "This move enables Flying-type Pokémon or Pokémon with the Levitate Ability to be hit by Ground-type moves. Moves that involve flying can't be used.", -1, 0, 4)
      .attr(AddArenaTagAttr, ArenaTagType.GRAVITY, 5)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(Moves.MIRACLE_EYE, "Miracle Eye (N)", Type.PSYCHIC, -1, 40, "Enables a Dark-type target to be hit by Psychic-type attacks. This also enables an evasive target to be hit.", -1, 0, 4),
    new AttackMove(Moves.WAKE_UP_SLAP, "Wake-Up Slap", Type.FIGHTING, MoveCategory.PHYSICAL, 70, 100, 10, "This attack inflicts big damage on a sleeping target. This also wakes the target up, however.", -1, 0, 4)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.status?.effect === StatusEffect.SLEEP ? 2 : 1)
      .attr(HealStatusEffectAttr, false, StatusEffect.SLEEP),
    new AttackMove(Moves.HAMMER_ARM, "Hammer Arm", Type.FIGHTING, MoveCategory.PHYSICAL, 100, 90, 10, "The user swings and hits with its strong, heavy fist. It lowers the user's Speed, however.", 100, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPD, -1, true)
      .punchingMove(),
    new AttackMove(Moves.GYRO_BALL, "Gyro Ball", Type.STEEL, MoveCategory.PHYSICAL, -1, 100, 5, "The user tackles the target with a high-speed spin. The slower the user compared to the target, the greater the move's power.", -1, 0, 4)
      .attr(BattleStatRatioPowerAttr, Stat.SPD, true)
      .ballBombMove(),
    new SelfStatusMove(Moves.HEALING_WISH, "Healing Wish", Type.PSYCHIC, -1, 10, "The user faints. In return, the Pokémon taking its place will have its HP restored and status conditions cured.", -1, 0, 4)
      .attr(SacrificialFullRestoreAttr),
    new AttackMove(Moves.BRINE, "Brine", Type.WATER, MoveCategory.SPECIAL, 65, 100, 10, "If the target's HP is half or less, this attack will hit with double the power.", -1, 0, 4)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.getHpRatio() < 0.5 ? 2 : 1),
    new AttackMove(Moves.NATURAL_GIFT, "Natural Gift (N)", Type.NORMAL, MoveCategory.PHYSICAL, -1, 100, 15, "The user draws power to attack by using its held Berry. The Berry determines the move's type and power.", -1, 0, 4)
      .makesContact(false),
    new AttackMove(Moves.FEINT, "Feint", Type.NORMAL, MoveCategory.PHYSICAL, 30, 100, 10, "This attack hits a target using a move such as Protect or Detect. This also lifts the effects of those moves.", -1, 2, 4)
      .attr(RemoveBattlerTagAttr, [ BattlerTagType.PROTECTED ])
      .makesContact(false)
      .ignoresProtect(),
    new AttackMove(Moves.PLUCK, "Pluck (P)", Type.FLYING, MoveCategory.PHYSICAL, 60, 100, 20, "The user pecks the target. If the target is holding a Berry, the user eats it and gains its effect.", -1, 0, 4),
    new StatusMove(Moves.TAILWIND, "Tailwind (N)", Type.FLYING, -1, 15, "The user whips up a turbulent whirlwind that ups the Speed stats of the user and its allies for four turns.", -1, 0, 4)
      .windMove()
      .target(MoveTarget.USER_SIDE),
    new StatusMove(Moves.ACUPRESSURE, "Acupressure", Type.NORMAL, -1, 30, "The user applies pressure to stress points, sharply boosting one of its or its allies' stats.", -1, 0, 4)
      .attr(StatChangeAttr, BattleStat.RAND, 2, true)
      .target(MoveTarget.USER_OR_NEAR_ALLY),
    new AttackMove(Moves.METAL_BURST, "Metal Burst (N)", Type.STEEL, MoveCategory.PHYSICAL, -1, 100, 10, "The user retaliates with much greater force against the opponent that last inflicted damage on it.", -1, 0, 4)
      .makesContact(false)
      .target(MoveTarget.ATTACKER),
    new AttackMove(Moves.U_TURN, "U-turn", Type.BUG, MoveCategory.PHYSICAL, 70, 100, 20, "After making its attack, the user rushes back to switch places with a party Pokémon in waiting.", -1, 0, 4)
      .attr(ForceSwitchOutAttr, true),
    new AttackMove(Moves.CLOSE_COMBAT, "Close Combat", Type.FIGHTING, MoveCategory.PHYSICAL, 120, 100, 5, "The user fights the target up close without guarding itself. This also lowers the user's Defense and Sp. Def stats.", 100, 0, 4)
      .attr(StatChangeAttr, [ BattleStat.DEF, BattleStat.SPDEF ], -1, true),
    new AttackMove(Moves.PAYBACK, "Payback (P)", Type.DARK, MoveCategory.PHYSICAL, 50, 100, 10, "The user stores power, then attacks. If the user moves after the target, this attack's power will be doubled.", -1, 0, 4),
    new AttackMove(Moves.ASSURANCE, "Assurance (P)", Type.DARK, MoveCategory.PHYSICAL, 60, 100, 10, "If the target has already taken some damage in the same turn, this attack's power is doubled.", -1, 0, 4),
    new StatusMove(Moves.EMBARGO, "Embargo (N)", Type.DARK, 100, 15, "This move prevents the target from using its held item for five turns. Its Trainer is also prevented from using items on it.", -1, 0, 4),
    new AttackMove(Moves.FLING, "Fling (N)", Type.DARK, MoveCategory.PHYSICAL, -1, 100, 10, "The user flings its held item at the target to attack. This move's power and effects depend on the item.", -1, 0, 4)
      .makesContact(false),
    new StatusMove(Moves.PSYCHO_SHIFT, "Psycho Shift (N)", Type.PSYCHIC, 100, 10, "Using its psychic power of suggestion, the user transfers its status conditions to the target.", -1, 0, 4),
    new AttackMove(Moves.TRUMP_CARD, "Trump Card (N)", Type.NORMAL, MoveCategory.SPECIAL, -1, -1, 5, "The fewer PP this move has, the greater its power.", -1, 0, 4)
      .makesContact(),
    new StatusMove(Moves.HEAL_BLOCK, "Heal Block (N)", Type.PSYCHIC, 100, 15, "For five turns, the user prevents the opposing team from using any moves, Abilities, or held items that recover HP.", -1, 0, 4)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.WRING_OUT, "Wring Out", Type.NORMAL, MoveCategory.SPECIAL, -1, 100, 5, "The user powerfully wrings the target. The more HP the target has, the greater the move's power.", -1, 0, 4)
      .attr(OpponentHighHpPowerAttr)
      .makesContact(),
    new SelfStatusMove(Moves.POWER_TRICK, "Power Trick (N)", Type.PSYCHIC, -1, 10, "The user employs its psychic power to switch its Attack stat with its Defense stat.", -1, 0, 4),
    new StatusMove(Moves.GASTRO_ACID, "Gastro Acid (N)", Type.POISON, 100, 10, "The user hurls up its stomach acids on the target. The fluid eliminates the effect of the target's Ability.", -1, 0, 4),
    new StatusMove(Moves.LUCKY_CHANT, "Lucky Chant (N)", Type.NORMAL, -1, 30, "The user chants an incantation toward the sky, preventing opposing Pokémon from landing critical hits for five turns.", -1, 0, 4)
      .attr(AddBattlerTagAttr, BattlerTagType.NO_CRIT, false, false, 5)
      .target(MoveTarget.USER_SIDE),
    new StatusMove(Moves.ME_FIRST, "Me First (N)", Type.NORMAL, -1, 20, "The user cuts ahead of the target to copy and use the target's intended move with greater power. This move fails if it isn't used first.", -1, 0, 4)
      .ignoresVirtual()
      .target(MoveTarget.NEAR_ENEMY),
    new SelfStatusMove(Moves.COPYCAT, "Copycat", Type.NORMAL, -1, 20, "The user mimics the move used immediately before it. The move fails if no other move has been used yet.", -1, 0, 4)
      .attr(CopyMoveAttr)
      .ignoresVirtual(),
    new StatusMove(Moves.POWER_SWAP, "Power Swap (N)", Type.PSYCHIC, -1, 10, "The user employs its psychic power to switch changes to its Attack and Sp. Atk stats with the target.", -1, 0, 4),
    new StatusMove(Moves.GUARD_SWAP, "Guard Swap (N)", Type.PSYCHIC, -1, 10, "The user employs its psychic power to switch changes to its Defense and Sp. Def stats with the target.", -1, 0, 4),
    new AttackMove(Moves.PUNISHMENT, "Punishment (N)", Type.DARK, MoveCategory.PHYSICAL, -1, 100, 5, "The more the target has powered up with stat changes, the greater the move's power.", -1, 0, 4),
    new AttackMove(Moves.LAST_RESORT, "Last Resort", Type.NORMAL, MoveCategory.PHYSICAL, 140, 100, 5, "This move can be used only after the user has used all the other moves it knows in the battle.", -1, 0, 4)
      .condition((user, target, move) => !user.getMoveset().filter(m => m.moveId !== move.id && m.getPpRatio() > 0).length),
    new StatusMove(Moves.WORRY_SEED, "Worry Seed (N)", Type.GRASS, 100, 10, "A seed that causes worry is planted on the target. It prevents sleep by making the target's Ability Insomnia.", -1, 0, 4),
    new AttackMove(Moves.SUCKER_PUNCH, "Sucker Punch (P)", Type.DARK, MoveCategory.PHYSICAL, 70, 100, 5, "This move enables the user to attack first. This move fails if the target is not readying an attack.", -1, 1, 4),
    new StatusMove(Moves.TOXIC_SPIKES, "Toxic Spikes", Type.POISON, -1, 20, "The user lays a trap of poison spikes at the feet of the opposing team. The spikes will poison opposing Pokémon that switch into battle.", -1, 0, 4)
      .attr(AddArenaTrapTagAttr, ArenaTagType.TOXIC_SPIKES)
      .target(MoveTarget.ENEMY_SIDE),
    new StatusMove(Moves.HEART_SWAP, "Heart Swap (N)", Type.PSYCHIC, -1, 10, "The user employs its psychic power to switch stat changes with the target.", -1, 0, 4),
    new SelfStatusMove(Moves.AQUA_RING, "Aqua Ring", Type.WATER, -1, 20, "The user envelops itself in a veil made of water. It regains some HP every turn.", -1, 0, 4)
      .attr(AddBattlerTagAttr, BattlerTagType.AQUA_RING, true, true),
    new SelfStatusMove(Moves.MAGNET_RISE, "Magnet Rise (N)", Type.ELECTRIC, -1, 10, "The user levitates using electrically generated magnetism for five turns.", -1, 0, 4),
    new AttackMove(Moves.FLARE_BLITZ, "Flare Blitz", Type.FIRE, MoveCategory.PHYSICAL, 120, 100, 15, "The user cloaks itself in fire and charges the target. This also damages the user quite a lot. This attack may leave the target with a burn.", 10, 0, 4)
      .attr(RecoilAttr)
      .attr(HealStatusEffectAttr, false, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .condition(failOnGravityCondition),
    new AttackMove(Moves.FORCE_PALM, "Force Palm", Type.FIGHTING, MoveCategory.PHYSICAL, 60, 100, 10, "The target is attacked with a shock wave. This may also leave the target with paralysis.", 30, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.AURA_SPHERE, "Aura Sphere", Type.FIGHTING, MoveCategory.SPECIAL, 80, -1, 20, "The user lets loose a blast of aura power from deep within its body at the target. This attack never misses.", -1, 0, 4)
      .pulseMove()
      .ballBombMove(),
    new SelfStatusMove(Moves.ROCK_POLISH, "Rock Polish", Type.ROCK, -1, 20, "The user polishes its body to reduce drag. This sharply raises the Speed stat.", -1, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPD, 2, true),
    new AttackMove(Moves.POISON_JAB, "Poison Jab", Type.POISON, MoveCategory.PHYSICAL, 80, 100, 20, "The target is stabbed with a tentacle, arm, or the like steeped in poison. This may also poison the target.", 30, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(Moves.DARK_PULSE, "Dark Pulse", Type.DARK, MoveCategory.SPECIAL, 80, 100, 15, "The user releases a horrible aura imbued with dark thoughts. This may also make the target flinch.", 20, 0, 4)
      .attr(FlinchAttr)
      .pulseMove(),
    new AttackMove(Moves.NIGHT_SLASH, "Night Slash", Type.DARK, MoveCategory.PHYSICAL, 70, 100, 15, "The user slashes the target the instant an opportunity arises. Critical hits land more easily.", -1, 0, 4)
      .attr(HighCritAttr)
      .slicingMove(),
    new AttackMove(Moves.AQUA_TAIL, "Aqua Tail", Type.WATER, MoveCategory.PHYSICAL, 90, 90, 10, "The user attacks by swinging its tail as if it were a vicious wave in a raging storm.", -1, 0, 4),
    new AttackMove(Moves.SEED_BOMB, "Seed Bomb", Type.GRASS, MoveCategory.PHYSICAL, 80, 100, 15, "The user slams a barrage of hard-shelled seeds down on the target from above.", -1, 0, 4)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(Moves.AIR_SLASH, "Air Slash", Type.FLYING, MoveCategory.SPECIAL, 75, 95, 15, "The user attacks with a blade of air that slices even the sky. This may also make the target flinch.", 30, 0, 4)
      .attr(FlinchAttr)
      .slicingMove(),
    new AttackMove(Moves.X_SCISSOR, "X-Scissor", Type.BUG, MoveCategory.PHYSICAL, 80, 100, 15, "The user slashes at the target by crossing its scythes or claws as if they were a pair of scissors.", -1, 0, 4)
      .slicingMove(),
    new AttackMove(Moves.BUG_BUZZ, "Bug Buzz", Type.BUG, MoveCategory.SPECIAL, 90, 100, 10, "The user generates a damaging sound wave by vibration. This may also lower the target's Sp. Def stat.", 10, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1)
      .soundBased(),
    new AttackMove(Moves.DRAGON_PULSE, "Dragon Pulse", Type.DRAGON, MoveCategory.SPECIAL, 85, 100, 10, "The target is attacked with a shock wave generated by the user's gaping mouth.", -1, 0, 4)
      .pulseMove(),
    new AttackMove(Moves.DRAGON_RUSH, "Dragon Rush", Type.DRAGON, MoveCategory.PHYSICAL, 100, 75, 10, "The user tackles the target while exhibiting overwhelming menace. This may also make the target flinch.", 20, 0, 4)
      .attr(FlinchAttr),
    new AttackMove(Moves.POWER_GEM, "Power Gem", Type.ROCK, MoveCategory.SPECIAL, 80, 100, 20, "The user attacks with a ray of light that sparkles as if it were made of gemstones.", -1, 0, 4),
    new AttackMove(Moves.DRAIN_PUNCH, "Drain Punch", Type.FIGHTING, MoveCategory.PHYSICAL, 75, 100, 10, "An energy-draining punch. The user's HP is restored by half the damage taken by the target.", -1, 0, 4)
      .attr(HitHealAttr)
      .punchingMove(),
    new AttackMove(Moves.VACUUM_WAVE, "Vacuum Wave", Type.FIGHTING, MoveCategory.SPECIAL, 40, 100, 30, "The user whirls its fists to send a wave of pure vacuum at the target. This move always goes first.", -1, 1, 4),
    new AttackMove(Moves.FOCUS_BLAST, "Focus Blast", Type.FIGHTING, MoveCategory.SPECIAL, 120, 70, 5, "The user heightens its mental focus and unleashes its power. This may also lower the target's Sp. Def stat.", 10, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1)
      .ballBombMove(),
    new AttackMove(Moves.ENERGY_BALL, "Energy Ball", Type.GRASS, MoveCategory.SPECIAL, 90, 100, 10, "The user draws power from nature and fires it at the target. This may also lower the target's Sp. Def stat.", 10, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1)
      .ballBombMove(),
    new AttackMove(Moves.BRAVE_BIRD, "Brave Bird", Type.FLYING, MoveCategory.PHYSICAL, 120, 100, 15, "The user tucks in its wings and charges from a low altitude. This also damages the user quite a lot.", -1, 0, 4)
      .attr(RecoilAttr),
    new AttackMove(Moves.EARTH_POWER, "Earth Power", Type.GROUND, MoveCategory.SPECIAL, 90, 100, 10, "The user makes the ground under the target erupt with power. This may also lower the target's Sp. Def stat.", 10, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1),
    new StatusMove(Moves.SWITCHEROO, "Switcheroo (N)", Type.DARK, 100, 10, "The user trades held items with the target faster than the eye can follow.", -1, 0, 4),
    new AttackMove(Moves.GIGA_IMPACT, "Giga Impact", Type.NORMAL, MoveCategory.PHYSICAL, 150, 90, 5, "The user charges at the target using every bit of its power. The user can't move on the next turn.", -1, 0, 4)
      .attr(RechargeAttr),
    new SelfStatusMove(Moves.NASTY_PLOT, "Nasty Plot", Type.DARK, -1, 20, "The user stimulates its brain by thinking bad thoughts. This sharply raises the user's Sp. Atk stat.", -1, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPATK, 2, true),
    new AttackMove(Moves.BULLET_PUNCH, "Bullet Punch", Type.STEEL, MoveCategory.PHYSICAL, 40, 100, 30, "The user strikes the target with tough punches as fast as bullets. This move always goes first.", -1, 1, 4)
      .punchingMove(),
    new AttackMove(Moves.AVALANCHE, "Avalanche", Type.ICE, MoveCategory.PHYSICAL, 60, 100, 10, "The power of this attack move is doubled if the user has been hurt by the target in the same turn.", -1, -4, 4)
      .attr(TurnDamagedDoublePowerAttr),
    new AttackMove(Moves.ICE_SHARD, "Ice Shard", Type.ICE, MoveCategory.PHYSICAL, 40, 100, 30, "The user flash-freezes chunks of ice and hurls them at the target. This move always goes first.", -1, 1, 4)
      .makesContact(false),
    new AttackMove(Moves.SHADOW_CLAW, "Shadow Claw", Type.GHOST, MoveCategory.PHYSICAL, 70, 100, 15, "The user slashes with a sharp claw made from shadows. Critical hits land more easily.", -1, 0, 4)
      .attr(HighCritAttr),
    new AttackMove(Moves.THUNDER_FANG, "Thunder Fang", Type.ELECTRIC, MoveCategory.PHYSICAL, 65, 95, 15, "The user bites with electrified fangs. This may also make the target flinch or leave it with paralysis.", 10, 0, 4)
      .attr(FlinchAttr)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .bitingMove(),
    new AttackMove(Moves.ICE_FANG, "Ice Fang", Type.ICE, MoveCategory.PHYSICAL, 65, 95, 15, "The user bites with cold-infused fangs. This may also make the target flinch or leave it frozen.", 10, 0, 4)
      .attr(FlinchAttr)
      .attr(StatusEffectAttr, StatusEffect.FREEZE)
      .bitingMove(),
    new AttackMove(Moves.FIRE_FANG, "Fire Fang", Type.FIRE, MoveCategory.PHYSICAL, 65, 95, 15, "The user bites with flame-cloaked fangs. This may also make the target flinch or leave it with a burn.", 10, 0, 4)
      .attr(FlinchAttr)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .bitingMove(),
    new AttackMove(Moves.SHADOW_SNEAK, "Shadow Sneak", Type.GHOST, MoveCategory.PHYSICAL, 40, 100, 30, "The user extends its shadow and attacks the target from behind. This move always goes first.", -1, 1, 4),
    new AttackMove(Moves.MUD_BOMB, "Mud Bomb", Type.GROUND, MoveCategory.SPECIAL, 65, 85, 10, "The user launches a hard-packed mud ball to attack. This may also lower the target's accuracy.", 30, 0, 4)
      .attr(StatChangeAttr, BattleStat.ACC, -1)
      .ballBombMove(),
    new AttackMove(Moves.PSYCHO_CUT, "Psycho Cut", Type.PSYCHIC, MoveCategory.PHYSICAL, 70, 100, 20, "The user tears at the target with blades formed by psychic power. Critical hits land more easily.", -1, 0, 4)
      .attr(HighCritAttr)
      .slicingMove()
      .makesContact(false),
    new AttackMove(Moves.ZEN_HEADBUTT, "Zen Headbutt", Type.PSYCHIC, MoveCategory.PHYSICAL, 80, 90, 15, "The user focuses its willpower to its head and attacks the target. This may also make the target flinch.", 20, 0, 4)
      .attr(FlinchAttr),
    new AttackMove(Moves.MIRROR_SHOT, "Mirror Shot", Type.STEEL, MoveCategory.SPECIAL, 65, 85, 10, "The user lets loose a flash of energy at the target from its polished body. This may also lower the target's accuracy.", 30, 0, 4)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new AttackMove(Moves.FLASH_CANNON, "Flash Cannon", Type.STEEL, MoveCategory.SPECIAL, 80, 100, 10, "The user gathers all its light energy and releases it all at once. This may also lower the target's Sp. Def stat.", 10, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1),
    new AttackMove(Moves.ROCK_CLIMB, "Rock Climb", Type.NORMAL, MoveCategory.PHYSICAL, 90, 85, 20, "The user attacks the target by smashing into it with incredible force. This may also confuse the target.", 20, 0, 4)
      .attr(ConfuseAttr),
    new StatusMove(Moves.DEFOG, "Defog", Type.FLYING, -1, 15, "A strong wind blows away the target's barriers such as Reflect or Light Screen. This also lowers the target's evasiveness.", -1, 0, 4)
      .attr(StatChangeAttr, BattleStat.EVA, -1)
      .attr(ClearWeatherAttr, WeatherType.FOG)
      .attr(ClearTerrainAttr),
    new StatusMove(Moves.TRICK_ROOM, "Trick Room", Type.PSYCHIC, -1, 5, "The user creates a bizarre area in which slower Pokémon get to move first for five turns.", -1, -7, 4)
      .attr(AddArenaTagAttr, ArenaTagType.TRICK_ROOM, 5)
      .ignoresProtect()
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.DRACO_METEOR, "Draco Meteor", Type.DRAGON, MoveCategory.SPECIAL, 130, 90, 5, "Comets are summoned down from the sky onto the target. The attack's recoil harshly lowers the user's Sp. Atk stat.", 100, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPATK, -2, true),
    new AttackMove(Moves.DISCHARGE, "Discharge", Type.ELECTRIC, MoveCategory.SPECIAL, 80, 100, 15, "The user strikes everything around it by letting loose a flare of electricity. This may also cause paralysis.", 30, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.LAVA_PLUME, "Lava Plume", Type.FIRE, MoveCategory.SPECIAL, 80, 100, 15, "The user torches everything around it in an inferno of scarlet flames. This may also leave those it hits with a burn.", 30, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.LEAF_STORM, "Leaf Storm", Type.GRASS, MoveCategory.SPECIAL, 130, 90, 5, "The user whips up a storm of leaves around the target. The attack's recoil harshly lowers the user's Sp. Atk stat.", 100, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPATK, -2, true),
    new AttackMove(Moves.POWER_WHIP, "Power Whip", Type.GRASS, MoveCategory.PHYSICAL, 120, 85, 10, "The user violently whirls its vines, tentacles, or the like to harshly lash the target.", -1, 0, 4),
    new AttackMove(Moves.ROCK_WRECKER, "Rock Wrecker", Type.ROCK, MoveCategory.PHYSICAL, 150, 90, 5, "The user launches a huge boulder at the target to attack. The user can't move on the next turn.", -1, 0, 4)
      .attr(RechargeAttr)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(Moves.CROSS_POISON, "Cross Poison", Type.POISON, MoveCategory.PHYSICAL, 70, 100, 20, "A slashing attack with a poisonous blade that may also poison the target. Critical hits land more easily.", 10, 0, 4)
      .attr(HighCritAttr)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .slicingMove(),
    new AttackMove(Moves.GUNK_SHOT, "Gunk Shot", Type.POISON, MoveCategory.PHYSICAL, 120, 80, 5, "The user shoots filthy garbage at the target to attack. This may also poison the target.", 30, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .makesContact(false),
    new AttackMove(Moves.IRON_HEAD, "Iron Head", Type.STEEL, MoveCategory.PHYSICAL, 80, 100, 15, "The user slams the target with its steel-hard head. This may also make the target flinch.", 30, 0, 4)
      .attr(FlinchAttr),
    new AttackMove(Moves.MAGNET_BOMB, "Magnet Bomb", Type.STEEL, MoveCategory.PHYSICAL, 60, -1, 20, "The user launches steel bombs that stick to the target. This attack never misses.", -1, 0, 4)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(Moves.STONE_EDGE, "Stone Edge", Type.ROCK, MoveCategory.PHYSICAL, 100, 80, 5, "The user stabs the target from below with sharpened stones. Critical hits land more easily.", -1, 0, 4)
      .attr(HighCritAttr)
      .makesContact(false),
    new StatusMove(Moves.CAPTIVATE, "Captivate", Type.NORMAL, 100, 20, "If any opposing Pokémon is the opposite gender of the user, it is charmed, which harshly lowers its Sp. Atk stat.", -1, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPATK, -2)
      .condition((user, target, move) => target.isOppositeGender(user))
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.STEALTH_ROCK, "Stealth Rock", Type.ROCK, -1, 20, "The user lays a trap of levitating stones around the opposing team. The trap hurts opposing Pokémon that switch into battle.", -1, 0, 4)
      .attr(AddArenaTrapTagAttr, ArenaTagType.STEALTH_ROCK)
      .target(MoveTarget.ENEMY_SIDE),
    new AttackMove(Moves.GRASS_KNOT, "Grass Knot", Type.GRASS, MoveCategory.SPECIAL, -1, 100, 20, "The user snares the target with grass and trips it. The heavier the target, the greater the move's power.", -1, 0, 4)
      .attr(WeightPowerAttr)
      .makesContact(),
    new AttackMove(Moves.CHATTER, "Chatter", Type.FLYING, MoveCategory.SPECIAL, 65, 100, 20, "The user attacks the target with sound waves of deafening chatter. This confuses the target.", 100, 0, 4)
      .attr(ConfuseAttr)
      .soundBased(),
    new AttackMove(Moves.JUDGMENT, "Judgment (P)", Type.NORMAL, MoveCategory.SPECIAL, 100, 100, 10, "The user releases countless shots of light at the target. This move's type varies depending on the kind of Plate the user is holding.", -1, 0, 4),
    new AttackMove(Moves.BUG_BITE, "Bug Bite (P)", Type.BUG, MoveCategory.PHYSICAL, 60, 100, 20, "The user bites the target. If the target is holding a Berry, the user eats it and gains its effect.", -1, 0, 4),
    new AttackMove(Moves.CHARGE_BEAM, "Charge Beam", Type.ELECTRIC, MoveCategory.SPECIAL, 50, 90, 10, "The user attacks the target with an electric charge. The user may use any remaining electricity to raise its Sp. Atk stat.", 70, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPATK, 1, true),
    new AttackMove(Moves.WOOD_HAMMER, "Wood Hammer", Type.GRASS, MoveCategory.PHYSICAL, 120, 100, 15, "The user slams its rugged body into the target to attack. This also damages the user quite a lot.", -1, 0, 4)
      .attr(RecoilAttr),
    new AttackMove(Moves.AQUA_JET, "Aqua Jet", Type.WATER, MoveCategory.PHYSICAL, 40, 100, 20, "The user lunges at the target at a speed that makes it almost invisible. This move always goes first.", -1, 1, 4),
    new AttackMove(Moves.ATTACK_ORDER, "Attack Order", Type.BUG, MoveCategory.PHYSICAL, 90, 100, 15, "The user calls out its underlings to pummel the target. Critical hits land more easily.", -1, 0, 4)
      .attr(HighCritAttr)
      .makesContact(false),
    new SelfStatusMove(Moves.DEFEND_ORDER, "Defend Order", Type.BUG, -1, 10, "The user calls out its underlings to shield its body, raising its Defense and Sp. Def stats.", -1, 0, 4)
      .attr(StatChangeAttr, [ BattleStat.DEF, BattleStat.SPDEF ], 1, true),
    new SelfStatusMove(Moves.HEAL_ORDER, "Heal Order", Type.BUG, -1, 10, "The user calls out its underlings to heal it. The user regains up to half of its max HP.", -1, 0, 4)
      .attr(HealAttr, 0.5),
    new AttackMove(Moves.HEAD_SMASH, "Head Smash", Type.ROCK, MoveCategory.PHYSICAL, 150, 80, 5, "The user attacks the target with a hazardous, full-power headbutt. This also damages the user terribly.", -1, 0, 4)
      .attr(RecoilAttr),
    new AttackMove(Moves.DOUBLE_HIT, "Double Hit", Type.NORMAL, MoveCategory.PHYSICAL, 35, 90, 10, "The user slams the target with a long tail, vines, or a tentacle. The target is hit twice in a row.", -1, 0, 4)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.ROAR_OF_TIME, "Roar of Time", Type.DRAGON, MoveCategory.SPECIAL, 150, 90, 5, "The user blasts the target with power that distorts even time. The user can't move on the next turn.", -1, 0, 4)
      .attr(RechargeAttr),
    new AttackMove(Moves.SPACIAL_REND, "Spacial Rend", Type.DRAGON, MoveCategory.SPECIAL, 100, 95, 5, "The user tears the target along with the space around it. Critical hits land more easily.", -1, 0, 4)
      .attr(HighCritAttr),
    new SelfStatusMove(Moves.LUNAR_DANCE, "Lunar Dance (N)", Type.PSYCHIC, -1, 10, "The user faints. In return, the Pokémon taking its place will have its status and HP fully restored.", -1, 0, 4)
      .attr(SacrificialAttr)
      .danceMove(),
    new AttackMove(Moves.CRUSH_GRIP, "Crush Grip", Type.NORMAL, MoveCategory.PHYSICAL, -1, 100, 5, "The target is crushed with great force. The more HP the target has left, the greater this move's power.", -1, 0, 4)
      .attr(OpponentHighHpPowerAttr),
    new AttackMove(Moves.MAGMA_STORM, "Magma Storm", Type.FIRE, MoveCategory.SPECIAL, 100, 75, 5, "The target becomes trapped within a maelstrom of fire that rages for four to five turns.", 100, 0, 4)
      .attr(TrapAttr, BattlerTagType.MAGMA_STORM),
    new StatusMove(Moves.DARK_VOID, "Dark Void", Type.DARK, 50, 10, "Opposing Pokémon are dragged into a world of total darkness that makes them sleep.", -1, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.SEED_FLARE, "Seed Flare", Type.GRASS, MoveCategory.SPECIAL, 120, 85, 5, "The user emits a shock wave from its body to attack its target. This may also harshly lower the target's Sp. Def stat.", 40, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1),
    new AttackMove(Moves.OMINOUS_WIND, "Ominous Wind", Type.GHOST, MoveCategory.SPECIAL, 60, 100, 5, "The user blasts the target with a gust of repulsive wind. This may also raise all the user's stats at once.", 10, 0, 4)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF, BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD ], 1, true)
      .windMove(),
    new AttackMove(Moves.SHADOW_FORCE, "Shadow Force", Type.GHOST, MoveCategory.PHYSICAL, 120, 100, 5, "The user disappears, then strikes the target on the next turn. This move hits even if the target protects itself.", -1, 0, 4)
      .attr(ChargeAttr, ChargeAnim.SHADOW_FORCE_CHARGING, 'vanished\ninstantly!', BattlerTagType.HIDDEN)
      .ignoresProtect()
      .ignoresVirtual(),
    new SelfStatusMove(Moves.HONE_CLAWS, "Hone Claws", Type.DARK, -1, 15, "The user sharpens its claws to boost its Attack stat and accuracy.", -1, 0, 5)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.ACC ], 1, true),
    new StatusMove(Moves.WIDE_GUARD, "Wide Guard (N)", Type.ROCK, -1, 10, "The user and its allies are protected from wide-ranging attacks for one turn.", -1, 3, 5)
      .target(MoveTarget.USER_SIDE),
    new StatusMove(Moves.GUARD_SPLIT, "Guard Split (N)", Type.PSYCHIC, -1, 10, "The user employs its psychic power to average its Defense and Sp. Def stats with those of the target.", -1, 0, 5),
    new StatusMove(Moves.POWER_SPLIT, "Power Split (N)", Type.PSYCHIC, -1, 10, "The user employs its psychic power to average its Attack and Sp. Atk stats with those of the target.", -1, 0, 5),
    new StatusMove(Moves.WONDER_ROOM, "Wonder Room (N)", Type.PSYCHIC, -1, 10, "The user creates a bizarre area in which Pokémon's Defense and Sp. Def stats are swapped for five turns.", -1, 0, 5)
      .ignoresProtect()
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.PSYSHOCK, "Psyshock", Type.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 10, "The user materializes an odd psychic wave to attack the target. This attack does physical damage.", -1, 0, 5)
      .attr(DefDefAttr),
    new AttackMove(Moves.VENOSHOCK, "Venoshock", Type.POISON, MoveCategory.SPECIAL, 65, 100, 10, "The user drenches the target in a special poisonous liquid. This move's power is doubled if the target is poisoned.", -1, 0, 5)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.status && (target.status.effect === StatusEffect.POISON || target.status.effect === StatusEffect.TOXIC) ? 2 : 1),
    new SelfStatusMove(Moves.AUTOTOMIZE, "Autotomize (P)", Type.STEEL, -1, 15, "The user sheds part of its body to make itself lighter and sharply raise its Speed stat.", -1, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPD, 2, true),
    new SelfStatusMove(Moves.RAGE_POWDER, "Rage Powder (N)", Type.BUG, -1, 20, "The user scatters a cloud of irritating powder to draw attention to itself. Opposing Pokémon aim only at the user.", -1, 2, 5)
      .powderMove(),
    new StatusMove(Moves.TELEKINESIS, "Telekinesis (N)", Type.PSYCHIC, -1, 15, "The user makes the target float with its psychic power. The target is easier to hit for three turns.", -1, 0, 5)
      .condition(failOnGravityCondition),
    new StatusMove(Moves.MAGIC_ROOM, "Magic Room (N)", Type.PSYCHIC, -1, 10, "The user creates a bizarre area in which Pokémon's held items lose their effects for five turns.", -1, 0, 5)
      .ignoresProtect()
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.SMACK_DOWN, "Smack Down", Type.ROCK, MoveCategory.PHYSICAL, 50, 100, 15, "The user throws a stone or similar projectile to attack the target. A flying Pokémon will fall to the ground when it's hit.", 100, 0, 5)
      .attr(AddBattlerTagAttr, BattlerTagType.IGNORE_FLYING, false, false, 5)
      .makesContact(false),
    new AttackMove(Moves.STORM_THROW, "Storm Throw", Type.FIGHTING, MoveCategory.PHYSICAL, 60, 100, 10, "The user strikes the target with a fierce blow. This attack always results in a critical hit.", -1, 0, 5)
      .attr(CritOnlyAttr),
    new AttackMove(Moves.FLAME_BURST, "Flame Burst (P)", Type.FIRE, MoveCategory.SPECIAL, 70, 100, 15, "The user attacks the target with a bursting flame. The bursting flame damages Pokémon next to the target as well.", -1, 0, 5),
    new AttackMove(Moves.SLUDGE_WAVE, "Sludge Wave", Type.POISON, MoveCategory.SPECIAL, 95, 100, 10, "The user strikes everything around it by swamping the area with a giant sludge wave. This may also poison those hit.", 10, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new SelfStatusMove(Moves.QUIVER_DANCE, "Quiver Dance", Type.BUG, -1, 20, "The user lightly performs a beautiful, mystic dance. This boosts the user's Sp. Atk, Sp. Def, and Speed stats.", -1, 0, 5)
      .attr(StatChangeAttr, [ BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD ], 1, true)
      .danceMove(),
    new AttackMove(Moves.HEAVY_SLAM, "Heavy Slam (N)", Type.STEEL, MoveCategory.PHYSICAL, -1, 100, 10, "The user slams into the target with its heavy body. The more the user outweighs the target, the greater the move's power.", -1, 0, 5),
    new AttackMove(Moves.SYNCHRONOISE, "Synchronoise (P)", Type.PSYCHIC, MoveCategory.SPECIAL, 120, 100, 10, "Using an odd shock wave, the user inflicts damage on any Pokémon of the same type in the area around it.", -1, 0, 5)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.ELECTRO_BALL, "Electro Ball", Type.ELECTRIC, MoveCategory.SPECIAL, -1, 100, 10, "The user hurls an electric orb at the target. The faster the user is than the target, the greater the move's power.", -1, 0, 5)
      .attr(BattleStatRatioPowerAttr, Stat.SPD)
      .ballBombMove(),
    new StatusMove(Moves.SOAK, "Soak (N)", Type.WATER, 100, 20, "The user shoots a torrent of water at the target and changes the target's type to Water.", -1, 0, 5),
    new AttackMove(Moves.FLAME_CHARGE, "Flame Charge", Type.FIRE, MoveCategory.PHYSICAL, 50, 100, 20, "Cloaking itself in flame, the user attacks the target. Then, building up more power, the user raises its Speed stat.", 100, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPD, 1, true),
    new SelfStatusMove(Moves.COIL, "Coil", Type.POISON, -1, 20, "The user coils up and concentrates. This raises its Attack and Defense stats as well as its accuracy.", -1, 0, 5)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF, BattleStat.ACC ], 1, true),
    new AttackMove(Moves.LOW_SWEEP, "Low Sweep", Type.FIGHTING, MoveCategory.PHYSICAL, 65, 100, 20, "The user makes a swift attack on the target's legs, which lowers the target's Speed stat.", 100, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPD, -1),
    new AttackMove(Moves.ACID_SPRAY, "Acid Spray", Type.POISON, MoveCategory.SPECIAL, 40, 100, 20, "The user spits fluid that works to melt the target. This harshly lowers the target's Sp. Def stat.", 100, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPDEF, -2)
      .ballBombMove(),
    new AttackMove(Moves.FOUL_PLAY, "Foul Play (P)", Type.DARK, MoveCategory.PHYSICAL, 95, 100, 15, "The user turns the target's power against it. The higher the target's Attack stat, the greater the damage it deals.", -1, 0, 5),
    new StatusMove(Moves.SIMPLE_BEAM, "Simple Beam (N)", Type.NORMAL, 100, 15, "The user's mysterious psychic wave changes the target's Ability to Simple.", -1, 0, 5),
    new StatusMove(Moves.ENTRAINMENT, "Entrainment (N)", Type.NORMAL, 100, 15, "The user dances with an odd rhythm that compels the target to mimic it, making the target's Ability the same as the user's.", -1, 0, 5),
    new StatusMove(Moves.AFTER_YOU, "After You (N)", Type.NORMAL, -1, 15, "The user helps the target and makes it use its move right after the user.", -1, 0, 5)
      .ignoresProtect(),
    new AttackMove(Moves.ROUND, "Round (P)", Type.NORMAL, MoveCategory.SPECIAL, 60, 100, 15, "The user attacks the target with a song. Others can join in the Round to increase the power of the attack.", -1, 0, 5)
      .soundBased(),
    new AttackMove(Moves.ECHOED_VOICE, "Echoed Voice", Type.NORMAL, MoveCategory.SPECIAL, 40, 100, 15, "The user attacks the target with an echoing voice. If this move is used every turn, its power is increased.", -1, 0, 5)
      .attr(ConsecutiveUseMultiBasePowerAttr, 5, false)
      .soundBased(),
    new AttackMove(Moves.CHIP_AWAY, "Chip Away (P)", Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 20, "Looking for an opening, the user strikes consistently. The target's stat changes don't affect this attack's damage.", -1, 0, 5),
    new AttackMove(Moves.CLEAR_SMOG, "Clear Smog (P)", Type.POISON, MoveCategory.SPECIAL, 50, -1, 15, "The user attacks the target by throwing a clump of special mud. All stat changes are returned to normal.", -1, 0, 5),
    new AttackMove(Moves.STORED_POWER, "Stored Power (P)", Type.PSYCHIC, MoveCategory.SPECIAL, 20, 100, 10, "The user attacks the target with stored power. The more the user's stats are raised, the greater the move's power.", -1, 0, 5),
    new StatusMove(Moves.QUICK_GUARD, "Quick Guard (N)", Type.FIGHTING, -1, 15, "The user protects itself and its allies from priority moves.", -1, 3, 5)
      .target(MoveTarget.USER_SIDE),
    new SelfStatusMove(Moves.ALLY_SWITCH, "Ally Switch (N)", Type.PSYCHIC, -1, 15, "The user teleports using a strange power and switches places with one of its allies.", -1, 2, 5)
      .ignoresProtect(),
    new AttackMove(Moves.SCALD, "Scald", Type.WATER, MoveCategory.SPECIAL, 80, 100, 15, "The user shoots boiling hot water at its target. This may also leave the target with a burn.", 30, 0, 5)
      .attr(HealStatusEffectAttr, false, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new SelfStatusMove(Moves.SHELL_SMASH, "Shell Smash", Type.NORMAL, -1, 15, "The user breaks its shell, which lowers Defense and Sp. Def stats but sharply raises its Attack, Sp. Atk, and Speed stats.", -1, 0, 5)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.SPATK, BattleStat.SPD ], 2, true)
      .attr(StatChangeAttr, [ BattleStat.DEF, BattleStat.SPDEF ], -1, true),
    new StatusMove(Moves.HEAL_PULSE, "Heal Pulse", Type.PSYCHIC, -1, 10, "The user emits a healing pulse that restores the target's HP by up to half of its max HP.", -1, 0, 5)
      .attr(HealAttr, 0.5, false, false)
      .pulseMove(),
    new AttackMove(Moves.HEX, "Hex", Type.GHOST, MoveCategory.SPECIAL, 65, 100, 10, "This relentless attack does massive damage to a target affected by status conditions.", -1, 0, 5)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.status ? 2 : 1),
    new AttackMove(Moves.SKY_DROP, "Sky Drop", Type.FLYING, MoveCategory.PHYSICAL, 60, 100, 10, "The user takes the target into the sky, then drops it during the next turn. The target cannot attack while in the sky.", -1, 0, 5)
      .attr(ChargeAttr, ChargeAnim.SKY_DROP_CHARGING, 'took {TARGET}\ninto the sky!', BattlerTagType.FLYING) // TODO: Add 2nd turn message
      .condition(failOnGravityCondition)
      .ignoresVirtual(), 
    new SelfStatusMove(Moves.SHIFT_GEAR, "Shift Gear", Type.STEEL, -1, 10, "The user rotates its gears, raising its Attack stat and sharply raising its Speed stat.", -1, 0, 5)
      .attr(StatChangeAttr, BattleStat.ATK, 1, true)
      .attr(StatChangeAttr, BattleStat.SPD, 2, true),
    new AttackMove(Moves.CIRCLE_THROW, "Circle Throw", Type.FIGHTING, MoveCategory.PHYSICAL, 60, 90, 10, "The target is thrown, and a different Pokémon is dragged out. In the wild, this ends a battle against a single Pokémon.", -1, -6, 5)
      .attr(ForceSwitchOutAttr),
    new AttackMove(Moves.INCINERATE, "Incinerate (P)", Type.FIRE, MoveCategory.SPECIAL, 60, 100, 15, "The user attacks opposing Pokémon with fire. If a Pokémon is holding a certain item, such as a Berry, the item becomes burned up and unusable.", -1, 0, 5)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.QUASH, "Quash (N)", Type.DARK, 100, 15, "The user suppresses the target and makes its move go last.", -1, 0, 5),
    new AttackMove(Moves.ACROBATICS, "Acrobatics (P)", Type.FLYING, MoveCategory.PHYSICAL, 55, 100, 15, "The user nimbly strikes the target. If the user is not holding an item, this attack inflicts massive damage.", -1, 0, 5),
    new StatusMove(Moves.REFLECT_TYPE, "Reflect Type", Type.NORMAL, -1, 15, "The user reflects the target's type, making the user the same type as the target.", -1, 0, 5)
      .attr(CopyTypeAttr),
    new AttackMove(Moves.RETALIATE, "Retaliate (P)", Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 5, "The user gets revenge for a fainted ally. If an ally fainted in the previous turn, this move's power is increased.", -1, 0, 5),
    new AttackMove(Moves.FINAL_GAMBIT, "Final Gambit", Type.FIGHTING, MoveCategory.SPECIAL, -1, 100, 5, "The user risks everything to attack its target. The user faints but does damage equal to its HP.", -1, 0, 5)
      .attr(UserHpDamageAttr)
      .attr(SacrificialAttr),
    new StatusMove(Moves.BESTOW, "Bestow (N)", Type.NORMAL, -1, 15, "The user passes its held item to the target when the target isn't holding an item.", -1, 0, 5)
      .ignoresProtect(),
    new AttackMove(Moves.INFERNO, "Inferno", Type.FIRE, MoveCategory.SPECIAL, 100, 50, 5, "The user attacks by engulfing the target in an intense fire. This leaves the target with a burn.", 100, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.WATER_PLEDGE, "Water Pledge (P)", Type.WATER, MoveCategory.SPECIAL, 80, 100, 10, "A column of water hits the target. When used with its fire equivalent, its power increases and a rainbow appears.", -1, 0, 5),
    new AttackMove(Moves.FIRE_PLEDGE, "Fire Pledge (P)", Type.FIRE, MoveCategory.SPECIAL, 80, 100, 10, "A column of fire hits the target. When used with its grass equivalent, its power increases and a vast sea of fire appears.", -1, 0, 5),
    new AttackMove(Moves.GRASS_PLEDGE, "Grass Pledge (P)", Type.GRASS, MoveCategory.SPECIAL, 80, 100, 10, "A column of grass hits the target. When used with its water equivalent, its power increases and a vast swamp appears.", -1, 0, 5),
    new AttackMove(Moves.VOLT_SWITCH, "Volt Switch", Type.ELECTRIC, MoveCategory.SPECIAL, 70, 100, 20, "After making its attack, the user rushes back to switch places with a party Pokémon in waiting.", -1, 0, 5)
      .attr(ForceSwitchOutAttr, true),
    new AttackMove(Moves.STRUGGLE_BUG, "Struggle Bug", Type.BUG, MoveCategory.SPECIAL, 50, 100, 20, "While resisting, the user attacks opposing Pokémon. This lowers the Sp. Atk stats of those hit.", 100, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPATK, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.BULLDOZE, "Bulldoze", Type.GROUND, MoveCategory.PHYSICAL, 60, 100, 20, "The user strikes everything around it by stomping down on the ground. This lowers the Speed stats of those hit.", 100, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPD, -1)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.FROST_BREATH, "Frost Breath", Type.ICE, MoveCategory.SPECIAL, 60, 90, 10, "The user blows its cold breath on the target. This attack always results in a critical hit.", 100, 0, 5)
      .attr(CritOnlyAttr),
    new AttackMove(Moves.DRAGON_TAIL, "Dragon Tail", Type.DRAGON, MoveCategory.PHYSICAL, 60, 90, 10, "The target is knocked away, and a different Pokémon is dragged out. In the wild, this ends a battle against a single Pokémon.", -1, -6, 5)
      .attr(ForceSwitchOutAttr),
    new SelfStatusMove(Moves.WORK_UP, "Work Up", Type.NORMAL, -1, 30, "The user is roused, and its Attack and Sp. Atk stats increase.", -1, 0, 5)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.SPATK ], 1, true),
    new AttackMove(Moves.ELECTROWEB, "Electroweb", Type.ELECTRIC, MoveCategory.SPECIAL, 55, 95, 15, "The user attacks and captures opposing Pokémon using an electric net. This lowers their Speed stats.", 100, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPD, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.WILD_CHARGE, "Wild Charge", Type.ELECTRIC, MoveCategory.PHYSICAL, 90, 100, 15, "The user shrouds itself in electricity and smashes into its target. This also damages the user a little.", -1, 0, 5)
      .attr(RecoilAttr),
    new AttackMove(Moves.DRILL_RUN, "Drill Run", Type.GROUND, MoveCategory.PHYSICAL, 80, 95, 10, "The user crashes into its target while rotating its body like a drill. Critical hits land more easily.", -1, 0, 5)
      .attr(HighCritAttr),
    new AttackMove(Moves.DUAL_CHOP, "Dual Chop", Type.DRAGON, MoveCategory.PHYSICAL, 40, 90, 15, "The user attacks its target by hitting it with brutal strikes. The target is hit twice in a row.", -1, 0, 5)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.HEART_STAMP, "Heart Stamp", Type.PSYCHIC, MoveCategory.PHYSICAL, 60, 100, 25, "The user unleashes a vicious blow after its cute act makes the target less wary. This may also make the target flinch.", 30, 0, 5)
      .attr(FlinchAttr),
    new AttackMove(Moves.HORN_LEECH, "Horn Leech", Type.GRASS, MoveCategory.PHYSICAL, 75, 100, 10, "The user drains the target's energy with its horns. The user's HP is restored by half the damage taken by the target.", -1, 0, 5)
      .attr(HitHealAttr),
    new AttackMove(Moves.SACRED_SWORD, "Sacred Sword (P)", Type.FIGHTING, MoveCategory.PHYSICAL, 90, 100, 15, "The user attacks by slicing with a long horn. The target's stat changes don't affect this attack's damage.", -1, 0, 5)
      .slicingMove(),
    new AttackMove(Moves.RAZOR_SHELL, "Razor Shell", Type.WATER, MoveCategory.PHYSICAL, 75, 95, 10, "The user cuts its target with sharp shells. This may also lower the target's Defense stat.", 50, 0, 5)
      .attr(StatChangeAttr, BattleStat.DEF, -1)
      .slicingMove(),
    new AttackMove(Moves.HEAT_CRASH, "Heat Crash (P)", Type.FIRE, MoveCategory.PHYSICAL, -1, 100, 10, "The user slams its target with its flame-covered body. The more the user outweighs the target, the greater the move's power.", -1, 0, 5),
    new AttackMove(Moves.LEAF_TORNADO, "Leaf Tornado", Type.GRASS, MoveCategory.SPECIAL, 65, 90, 10, "The user attacks its target by encircling it in sharp leaves. This attack may also lower the target's accuracy.", 50, 0, 5)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new AttackMove(Moves.STEAMROLLER, "Steamroller", Type.BUG, MoveCategory.PHYSICAL, 65, 100, 20, "The user crushes its target by rolling over the target with its rolled-up body. This may also make the target flinch.", 30, 0, 5)
      .attr(FlinchAttr),
    new SelfStatusMove(Moves.COTTON_GUARD, "Cotton Guard", Type.GRASS, -1, 10, "The user protects itself by wrapping its body in soft cotton, which drastically raises the user's Defense stat.", -1, 0, 5)
      .attr(StatChangeAttr, BattleStat.DEF, 3, true),
    new AttackMove(Moves.NIGHT_DAZE, "Night Daze", Type.DARK, MoveCategory.SPECIAL, 85, 95, 10, "The user lets loose a pitch-black shock wave at its target. This may also lower the target's accuracy.", 40, 0, 5)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new AttackMove(Moves.PSYSTRIKE, "Psystrike", Type.PSYCHIC, MoveCategory.SPECIAL, 100, 100, 10, "The user materializes an odd psychic wave to attack the target. This attack does physical damage.", -1, 0, 5)
      .attr(DefDefAttr),
    new AttackMove(Moves.TAIL_SLAP, "Tail Slap", Type.NORMAL, MoveCategory.PHYSICAL, 25, 85, 10, "The user attacks by striking the target with its hard tail. It hits the target two to five times in a row.", -1, 0, 5)
      .attr(MultiHitAttr),
    new AttackMove(Moves.HURRICANE, "Hurricane", Type.FLYING, MoveCategory.SPECIAL, 110, 70, 10, "The user attacks by wrapping its opponent in a fierce wind that flies up into the sky. This may also confuse the target.", 30, 0, 5)
      .attr(ThunderAccuracyAttr)
      .attr(ConfuseAttr)
      .windMove(),
    new AttackMove(Moves.HEAD_CHARGE, "Head Charge", Type.NORMAL, MoveCategory.PHYSICAL, 120, 100, 15, "The user charges its head into its target, using its powerful guard hair. This also damages the user a little.", -1, 0, 5)
      .attr(RecoilAttr),
    new AttackMove(Moves.GEAR_GRIND, "Gear Grind", Type.STEEL, MoveCategory.PHYSICAL, 50, 85, 15, "The user attacks by throwing steel gears at its target twice.", -1, 0, 5)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.SEARING_SHOT, "Searing Shot", Type.FIRE, MoveCategory.SPECIAL, 100, 100, 5, "The user torches everything around it in an inferno of scarlet flames. This may also leave those it hits with a burn.", 30, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .ballBombMove()
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.TECHNO_BLAST, "Techno Blast (P)", Type.NORMAL, MoveCategory.SPECIAL, 120, 100, 5, "The user fires a beam of light at its target. The move's type changes depending on the Drive the user holds.", -1, 0, 5),
    new AttackMove(Moves.RELIC_SONG, "Relic Song", Type.NORMAL, MoveCategory.SPECIAL, 75, 100, 10, "The user sings an ancient song and attacks by appealing to the hearts of the listening opposing Pokémon. This may also induce sleep.", 10, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.SECRET_SWORD, "Secret Sword (P)", Type.FIGHTING, MoveCategory.SPECIAL, 85, 100, 10, "The user cuts with its long horn. The odd power contained in the horn does physical damage to the target.", -1, 0, 5)
      .slicingMove(),
    new AttackMove(Moves.GLACIATE, "Glaciate", Type.ICE, MoveCategory.SPECIAL, 65, 95, 10, "The user attacks by blowing freezing cold air at opposing Pokémon. This lowers their Speed stats.", 100, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPD, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.BOLT_STRIKE, "Bolt Strike", Type.ELECTRIC, MoveCategory.PHYSICAL, 130, 85, 5, "The user surrounds itself with a great amount of electricity and charges its target. This may also leave the target with paralysis.", 20, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.BLUE_FLARE, "Blue Flare", Type.FIRE, MoveCategory.SPECIAL, 130, 85, 5, "The user attacks by engulfing the target in an intense, yet beautiful, blue flame. This may also leave the target with a burn.", 20, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.FIERY_DANCE, "Fiery Dance", Type.FIRE, MoveCategory.SPECIAL, 80, 100, 10, "Cloaked in flames, the user attacks the target by dancing and flapping its wings. This may also raise the user's Sp. Atk stat.", 50, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPATK, 1, true)
      .danceMove(),
    new AttackMove(Moves.FREEZE_SHOCK, "Freeze Shock", Type.ICE, MoveCategory.PHYSICAL, 140, 90, 5, "On the second turn, the user hits the target with electrically charged ice. This may also leave the target with paralysis.", 30, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .makesContact(false),
    new AttackMove(Moves.ICE_BURN, "Ice Burn", Type.ICE, MoveCategory.SPECIAL, 140, 90, 5, "On the second turn, an ultracold, freezing wind surrounds the target. This may leave the target with a burn.", 30, 0, 5)
      .attr(ChargeAttr, ChargeAnim.ICE_BURN_CHARGING, 'became cloaked\nin freezing air!')
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .ignoresVirtual(),
    new AttackMove(Moves.SNARL, "Snarl", Type.DARK, MoveCategory.SPECIAL, 55, 95, 15, "The user yells as if it's ranting about something, which lowers the Sp. Atk stats of opposing Pokémon.", 100, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPATK, -1)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.ICICLE_CRASH, "Icicle Crash", Type.ICE, MoveCategory.PHYSICAL, 85, 90, 10, "The user attacks by harshly dropping large icicles onto the target. This may also make the target flinch.", 30, 0, 5)
      .attr(FlinchAttr)
      .makesContact(false),
    new AttackMove(Moves.V_CREATE, "V-create", Type.FIRE, MoveCategory.PHYSICAL, 180, 95, 5, "With a hot flame on its forehead, the user hurls itself at its target. This lowers the user's Defense, Sp. Def, and Speed stats.", 100, 0, 5)
      .attr(StatChangeAttr, [ BattleStat.DEF, BattleStat.SPDEF, BattleStat.SPD ], -1, true),
    new AttackMove(Moves.FUSION_FLARE, "Fusion Flare (P)", Type.FIRE, MoveCategory.SPECIAL, 100, 100, 5, "The user brings down a giant flame. This move's power is increased when influenced by an enormous lightning bolt.", -1, 0, 5)
      .attr(HealStatusEffectAttr, false, StatusEffect.FREEZE),
    new AttackMove(Moves.FUSION_BOLT, "Fusion Bolt (P)", Type.ELECTRIC, MoveCategory.PHYSICAL, 100, 100, 5, "The user throws down a giant lightning bolt. This move's power is increased when influenced by an enormous flame.", -1, 0, 5)
      .makesContact(false),
    new AttackMove(Moves.FLYING_PRESS, "Flying Press (P)", Type.FIGHTING, MoveCategory.PHYSICAL, 100, 95, 10, "The user dives down onto the target from the sky. This move is Fighting and Flying type simultaneously.", -1, 0, 6),
    new StatusMove(Moves.MAT_BLOCK, "Mat Block (N)", Type.FIGHTING, -1, 10, "Using a pulled-up mat as a shield, the user protects itself and its allies from damaging moves. This does not stop status moves.", -1, 0, 6),
    new AttackMove(Moves.BELCH, "Belch (P)", Type.POISON, MoveCategory.SPECIAL, 120, 90, 10, "The user lets out a damaging belch at the target. The user must eat a held Berry to use this move.", -1, 0, 6),
    new StatusMove(Moves.ROTOTILLER, "Rototiller (N)", Type.GROUND, -1, 10, "Tilling the soil, the user makes it easier for plants to grow. This raises the Attack and Sp. Atk stats of Grass-type Pokémon.", 100, 0, 6)
      .target(MoveTarget.ALL),
    new StatusMove(Moves.STICKY_WEB, "Sticky Web (N)", Type.BUG, -1, 20, "The user weaves a sticky net around the opposing team, which lowers their Speed stats upon switching into battle.", -1, 0, 6)
      .target(MoveTarget.ENEMY_SIDE),
    new AttackMove(Moves.FELL_STINGER, "Fell Stinger (N)", Type.BUG, MoveCategory.PHYSICAL, 50, 100, 25, "When the user knocks out a target with this move, the user's Attack stat rises drastically.", -1, 0, 6),
    new AttackMove(Moves.PHANTOM_FORCE, "Phantom Force", Type.GHOST, MoveCategory.PHYSICAL, 90, 100, 10, "The user vanishes somewhere, then strikes the target on the next turn. This move hits even if the target protects itself.", -1, 0, 6)
      .attr(ChargeAttr, ChargeAnim.PHANTOM_FORCE_CHARGING, 'vanished\ninstantly!', BattlerTagType.HIDDEN)
      .ignoresProtect()
      .ignoresVirtual(),
    new StatusMove(Moves.TRICK_OR_TREAT, "Trick-or-Treat (N)", Type.GHOST, 100, 20, "The user takes the target trick-or-treating. This adds Ghost type to the target's type.", -1, 0, 6),
    new StatusMove(Moves.NOBLE_ROAR, "Noble Roar", Type.NORMAL, 100, 30, "Letting out a noble roar, the user intimidates the target and lowers its Attack and Sp. Atk stats.", 100, 0, 6)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.SPATK ], -1)
      .soundBased(),
    new StatusMove(Moves.ION_DELUGE, "Ion Deluge (N)", Type.ELECTRIC, -1, 25, "The user disperses electrically charged particles, which changes Normal-type moves to Electric-type moves.", -1, 1, 6)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.PARABOLIC_CHARGE, "Parabolic Charge", Type.ELECTRIC, MoveCategory.SPECIAL, 65, 100, 20, "The user attacks everything around it. The user's HP is restored by half the damage taken by those hit.", -1, 0, 6)
      .attr(HitHealAttr)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new StatusMove(Moves.FORESTS_CURSE, "Forest's Curse (N)", Type.GRASS, 100, 20, "The user puts a forest curse on the target. The target is now Grass type as well.", -1, 0, 6),
    new AttackMove(Moves.PETAL_BLIZZARD, "Petal Blizzard", Type.GRASS, MoveCategory.PHYSICAL, 90, 100, 15, "The user stirs up a violent petal blizzard and attacks everything around it.", -1, 0, 6)
      .windMove()
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.FREEZE_DRY, "Freeze-Dry (P)", Type.ICE, MoveCategory.SPECIAL, 70, 100, 20, "The user rapidly cools the target. This may also leave the target frozen. This move is super effective on Water types.", 10, 0, 6)
      .attr(StatusEffectAttr, StatusEffect.FREEZE),
    new AttackMove(Moves.DISARMING_VOICE, "Disarming Voice", Type.FAIRY, MoveCategory.SPECIAL, 40, -1, 15, "Letting out a charming cry, the user does emotional damage to opposing Pokémon. This attack never misses.", -1, 0, 6)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.PARTING_SHOT, "Parting Shot", Type.DARK, 100, 20, "With a parting threat, the user lowers the target's Attack and Sp. Atk stats. Then it switches with a party Pokémon.", 100, 0, 6)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.SPATK ], -1)
      .attr(ForceSwitchOutAttr, true)
      .soundBased(),
    new StatusMove(Moves.TOPSY_TURVY, "Topsy-Turvy", Type.DARK, -1, 20, "All stat changes affecting the target turn topsy-turvy and become the opposite of what they were.", -1, 0, 6)
      .attr(InvertStatsAttr),
    new AttackMove(Moves.DRAINING_KISS, "Draining Kiss", Type.FAIRY, MoveCategory.SPECIAL, 50, 100, 10, "The user steals the target's HP with a kiss. The user's HP is restored by over half of the damage taken by the target.", -1, 0, 6)
      .attr(HitHealAttr),
    new StatusMove(Moves.CRAFTY_SHIELD, "Crafty Shield (N)", Type.FAIRY, -1, 10, "The user protects itself and its allies from status moves with a mysterious power. This does not stop moves that do damage.", -1, 3, 6)
      .target(MoveTarget.USER_SIDE),
    new StatusMove(Moves.FLOWER_SHIELD, "Flower Shield (N)", Type.FAIRY, -1, 10, "The user raises the Defense stats of all Grass-type Pokémon in battle with a mysterious power.", 100, 0, 6)
      .target(MoveTarget.ALL),
    new StatusMove(Moves.GRASSY_TERRAIN, "Grassy Terrain", Type.GRASS, -1, 10, "The user turns the ground to grass for five turns. This restores the HP of Pokémon on the ground a little every turn and powers up Grass-type moves.", -1, 0, 6)
      .attr(TerrainChangeAttr, TerrainType.GRASSY)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(Moves.MISTY_TERRAIN, "Misty Terrain", Type.FAIRY, -1, 10, "This protects Pokémon on the ground from status conditions and halves damage from Dragon-type moves for five turns.", -1, 0, 6)
      .attr(TerrainChangeAttr, TerrainType.MISTY)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(Moves.ELECTRIFY, "Electrify (N)", Type.ELECTRIC, -1, 20, "If the target is electrified before it uses a move during that turn, the target's move becomes Electric type.", -1, 0, 6),
    new AttackMove(Moves.PLAY_ROUGH, "Play Rough", Type.FAIRY, MoveCategory.PHYSICAL, 90, 90, 10, "The user plays rough with the target and attacks it. This may also lower the target's Attack stat.", 10, 0, 6)
      .attr(StatChangeAttr, BattleStat.ATK, -1),
    new AttackMove(Moves.FAIRY_WIND, "Fairy Wind", Type.FAIRY, MoveCategory.SPECIAL, 40, 100, 30, "The user stirs up a fairy wind and strikes the target with it.", -1, 0, 6)
      .windMove(),
    new AttackMove(Moves.MOONBLAST, "Moonblast", Type.FAIRY, MoveCategory.SPECIAL, 95, 100, 15, "Borrowing the power of the moon, the user attacks the target. This may also lower the target's Sp. Atk stat.", 30, 0, 6)
      .attr(StatChangeAttr, BattleStat.SPATK, -1),
    new AttackMove(Moves.BOOMBURST, "Boomburst", Type.NORMAL, MoveCategory.SPECIAL, 140, 100, 10, "The user attacks everything around it with the destructive power of a terrible, explosive sound.", -1, 0, 6)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new StatusMove(Moves.FAIRY_LOCK, "Fairy Lock (N)", Type.FAIRY, -1, 10, "By locking down the battlefield, the user keeps all Pokémon from fleeing during the next turn.", -1, 0, 6)
      .target(MoveTarget.BOTH_SIDES),
    new SelfStatusMove(Moves.KINGS_SHIELD, "King's Shield (P)", Type.STEEL, -1, 10, "The user takes a defensive stance while it protects itself from damage. It also lowers the Attack stat of any attacker that makes direct contact.", -1, 4, 6)
      .attr(ProtectAttr),
    new StatusMove(Moves.PLAY_NICE, "Play Nice", Type.NORMAL, -1, 20, "The user and the target become friends, and the target loses its will to fight. This lowers the target's Attack stat.", 100, 0, 6)
      .attr(StatChangeAttr, BattleStat.ATK, -1),
    new StatusMove(Moves.CONFIDE, "Confide", Type.NORMAL, -1, 20, "The user tells the target a secret, and the target loses its ability to concentrate. This lowers the target's Sp. Atk stat.", 100, 0, 6)
      .attr(StatChangeAttr, BattleStat.SPATK, -1)
      .soundBased(),
    new AttackMove(Moves.DIAMOND_STORM, "Diamond Storm", Type.ROCK, MoveCategory.PHYSICAL, 100, 95, 5, "The user whips up a storm of diamonds to damage opposing Pokémon. This may also sharply raise the user's Defense stat.", 50, 0, 6)
      .attr(StatChangeAttr, BattleStat.DEF, 2, true)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.STEAM_ERUPTION, "Steam Eruption", Type.WATER, MoveCategory.SPECIAL, 110, 95, 5, "The user immerses the target in superheated steam. This may also leave the target with a burn.", 30, 0, 6)
      .attr(HealStatusEffectAttr, false, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.HYPERSPACE_HOLE, "Hyperspace Hole", Type.PSYCHIC, MoveCategory.SPECIAL, 80, -1, 5, "Using a hyperspace hole, the user appears right next to the target and strikes. This also hits a target using a move such as Protect or Detect.", -1, 0, 6)
      .ignoresProtect(),
    new AttackMove(Moves.WATER_SHURIKEN, "Water Shuriken", Type.WATER, MoveCategory.SPECIAL, 15, 100, 20, "The user hits the target with throwing stars two to five times in a row. This move always goes first.", -1, 1, 6)
      .attr(MultiHitAttr),
    new AttackMove(Moves.MYSTICAL_FIRE, "Mystical Fire", Type.FIRE, MoveCategory.SPECIAL, 75, 100, 10, "The user attacks by breathing a special, hot fire. This also lowers the target's Sp. Atk stat.", 100, 0, 6)
      .attr(StatChangeAttr, BattleStat.SPATK, -1),
    new SelfStatusMove(Moves.SPIKY_SHIELD, "Spiky Shield (P)", Type.GRASS, -1, 10, "In addition to protecting the user from attacks, this move also damages any attacker that makes direct contact.", -1, 4, 6)
      .attr(ProtectAttr),
    new StatusMove(Moves.AROMATIC_MIST, "Aromatic Mist", Type.FAIRY, -1, 20, "The user raises the Sp. Def stat of an ally Pokémon by using a mysterious aroma.", -1, 0, 6)
      .attr(StatChangeAttr, BattleStat.SPDEF, 1)
      .target(MoveTarget.NEAR_ALLY),
    new StatusMove(Moves.EERIE_IMPULSE, "Eerie Impulse", Type.ELECTRIC, 100, 15, "The user's body generates an eerie impulse. Exposing the target to it harshly lowers the target's Sp. Atk stat.", -1, 0, 6)
      .attr(StatChangeAttr, BattleStat.SPATK, -2),
    new StatusMove(Moves.VENOM_DRENCH, "Venom Drench", Type.POISON, 100, 20, "Opposing Pokémon are drenched in an odd poisonous liquid. This lowers the Attack, Sp. Atk, and Speed stats of a poisoned target.", 100, 0, 6)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.SPATK, BattleStat.SPD ], -1, false, (user, target, move) => target.status?.effect === StatusEffect.POISON)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.POWDER, "Powder (N)", Type.BUG, 100, 20, "The user covers the target in a combustible powder. If the target uses a Fire-type move, the powder explodes and damages the target.", -1, 1, 6)
      .powderMove(),
    new SelfStatusMove(Moves.GEOMANCY, "Geomancy", Type.FAIRY, -1, 10, "The user absorbs energy and sharply raises its Sp. Atk, Sp. Def, and Speed stats on the next turn.", -1, 0, 6)
      .attr(ChargeAttr, ChargeAnim.GEOMANCY_CHARGING, "is charging its power!")
      .attr(StatChangeAttr, [ BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD ], 2, true)
      .ignoresVirtual(),
    new StatusMove(Moves.MAGNETIC_FLUX, "Magnetic Flux", Type.ELECTRIC, -1, 20, "The user manipulates magnetic fields, which raises the Defense and Sp. Def stats of ally Pokémon with the Plus or Minus Ability.", -1, 0, 6)
      .attr(StatChangeAttr, [ BattleStat.DEF, BattleStat.SPDEF ], 1, false, (user, target, move) => !![ Abilities.PLUS, Abilities.MINUS].find(a => a === user.getAbility().id))
      .target(MoveTarget.USER_AND_ALLIES)
      .condition((user, target, move) => !![ user, user.getAlly() ].filter(p => p?.isActive()).find(p => !![ Abilities.PLUS, Abilities.MINUS].find(a => a === p.getAbility().id))),
    new StatusMove(Moves.HAPPY_HOUR, "Happy Hour (N)", Type.NORMAL, -1, 30, "Using Happy Hour doubles the amount of prize money received after battle.", -1, 0, 6) // No animation
      .target(MoveTarget.USER_SIDE),
    new StatusMove(Moves.ELECTRIC_TERRAIN, "Electric Terrain", Type.ELECTRIC, -1, 10, "The user electrifies the ground for five turns, powering up Electric-type moves. Pokémon on the ground no longer fall asleep.", -1, 0, 6)
      .attr(TerrainChangeAttr, TerrainType.ELECTRIC)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.DAZZLING_GLEAM, "Dazzling Gleam", Type.FAIRY, MoveCategory.SPECIAL, 80, 100, 10, "The user damages opposing Pokémon by emitting a powerful flash.", -1, 0, 6)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new SelfStatusMove(Moves.CELEBRATE, "Celebrate", Type.NORMAL, -1, 40, "The Pokémon congratulates you on your special day!", -1, 0, 6),
    new StatusMove(Moves.HOLD_HANDS, "Hold Hands", Type.NORMAL, -1, 40, "The user and an ally hold hands. This makes them very happy.", -1, 0, 6)
      .target(MoveTarget.NEAR_ALLY),
    new StatusMove(Moves.BABY_DOLL_EYES, "Baby-Doll Eyes", Type.FAIRY, 100, 30, "The user stares at the target with its baby-doll eyes, which lowers the target's Attack stat. This move always goes first.", -1, 1, 6)
      .attr(StatChangeAttr, BattleStat.ATK, -1),
    new AttackMove(Moves.NUZZLE, "Nuzzle", Type.ELECTRIC, MoveCategory.PHYSICAL, 20, 100, 20, "The user attacks by nuzzling its electrified cheeks against the target. This also leaves the target with paralysis.", 100, 0, 6)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.HOLD_BACK, "Hold Back (P)", Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 40, "The user holds back when it attacks, and the target is left with at least 1 HP.", -1, 0, 6),
    new AttackMove(Moves.INFESTATION, "Infestation (P)", Type.BUG, MoveCategory.SPECIAL, 20, 100, 20, "The target is infested and attacked for four to five turns. The target can't flee during this time.", 100, 0, 6),
    new AttackMove(Moves.POWER_UP_PUNCH, "Power-Up Punch", Type.FIGHTING, MoveCategory.PHYSICAL, 40, 100, 20, "Striking opponents over and over makes the user's fists harder. Hitting a target raises the Attack stat.", 100, 0, 6)
      .attr(StatChangeAttr, BattleStat.ATK, 1, true)
      .punchingMove(),
    new AttackMove(Moves.OBLIVION_WING, "Oblivion Wing", Type.FLYING, MoveCategory.SPECIAL, 80, 100, 10, "The user absorbs its target's HP. The user's HP is restored by over half of the damage taken by the target.", -1, 0, 6)
      .attr(HitHealAttr, 0.75),
    new AttackMove(Moves.THOUSAND_ARROWS, "Thousand Arrows", Type.GROUND, MoveCategory.PHYSICAL, 90, 100, 10, "This move also hits opposing Pokémon that are in the air. Those Pokémon are knocked down to the ground.", 100, 0, 6)
      .attr(AddBattlerTagAttr, BattlerTagType.IGNORE_FLYING, false, false, 5)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.THOUSAND_WAVES, "Thousand Waves", Type.GROUND, MoveCategory.PHYSICAL, 90, 100, 10, "The user attacks with a wave that crawls along the ground. Those it hits can't flee from battle.", -1, 0, 6)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, true, 1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.LANDS_WRATH, "Land's Wrath", Type.GROUND, MoveCategory.PHYSICAL, 90, 100, 10, "The user gathers the energy of the land and focuses that power on opposing Pokémon to damage them.", -1, 0, 6)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.LIGHT_OF_RUIN, "Light of Ruin", Type.FAIRY, MoveCategory.SPECIAL, 140, 90, 5, "Drawing power from the Eternal Flower, the user fires a powerful beam of light. This also damages the user quite a lot.", -1, 0, 6)
      .attr(RecoilAttr, false, 0.5),
    new AttackMove(Moves.ORIGIN_PULSE, "Origin Pulse", Type.WATER, MoveCategory.SPECIAL, 110, 85, 10, "The user attacks opposing Pokémon with countless beams of light that glow a deep and brilliant blue.", -1, 0, 6)
      .pulseMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.PRECIPICE_BLADES, "Precipice Blades", Type.GROUND, MoveCategory.PHYSICAL, 120, 85, 10, "The user attacks opposing Pokémon by manifesting the power of the land in fearsome blades of stone.", -1, 0, 6)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.DRAGON_ASCENT, "Dragon Ascent", Type.FLYING, MoveCategory.PHYSICAL, 120, 100, 5, "After soaring upward, the user attacks its target by dropping out of the sky at high speeds. But it lowers its own Defense and Sp. Def stats in the process.", 100, 0, 6)
      .attr(StatChangeAttr, [ BattleStat.DEF, BattleStat.SPDEF ], -1, true),
    new AttackMove(Moves.HYPERSPACE_FURY, "Hyperspace Fury", Type.DARK, MoveCategory.PHYSICAL, 100, -1, 5, "Using its many arms, the user unleashes a barrage of attacks that ignore the effects of moves like Protect and Detect. But the user's Defense stat falls.", 100, 0, 6)
      .attr(StatChangeAttr, BattleStat.DEF, -1, true)
      .ignoresProtect(),
    /* Unused */
    new AttackMove(Moves.BREAKNECK_BLITZ__PHYSICAL, "Breakneck Blitz (N)", Type.NORMAL, MoveCategory.PHYSICAL, -1, -1, 1, "The user builds up its momentum using its Z-Power and crashes into the target at full speed. The power varies, depending on the original move.", -1, 0, 7),
    new AttackMove(Moves.BREAKNECK_BLITZ__SPECIAL, "Breakneck Blitz (N)", Type.NORMAL, MoveCategory.SPECIAL, -1, -1, 1, "Dummy Data", -1, 0, 7),
    new AttackMove(Moves.ALL_OUT_PUMMELING__PHYSICAL, "All-Out Pummeling (N)", Type.FIGHTING, MoveCategory.PHYSICAL, -1, -1, 1, "The user rams an energy orb created by its Z-Power into the target with full force. The power varies, depending on the original move.", -1, 0, 7),
    new AttackMove(Moves.ALL_OUT_PUMMELING__SPECIAL, "All-Out Pummeling (N)", Type.FIGHTING, MoveCategory.SPECIAL, -1, -1, 1, "Dummy Data", -1, 0, 7),
    new AttackMove(Moves.SUPERSONIC_SKYSTRIKE__PHYSICAL, "Supersonic Skystrike (N)", Type.FLYING, MoveCategory.PHYSICAL, -1, -1, 1, "The user soars up with its Z-Power and plummets toward the target at full speed. The power varies, depending on the original move.", -1, 0, 7),
    new AttackMove(Moves.SUPERSONIC_SKYSTRIKE__SPECIAL, "Supersonic Skystrike (N)", Type.FLYING, MoveCategory.SPECIAL, -1, -1, 1, "Dummy Data", -1, 0, 7),
    new AttackMove(Moves.ACID_DOWNPOUR__PHYSICAL, "Acid Downpour (N)", Type.POISON, MoveCategory.PHYSICAL, -1, -1, 1, "The user creates a poisonous swamp using its Z-Power and sinks the target into it at full force. The power varies, depending on the original move.", -1, 0, 7),
    new AttackMove(Moves.ACID_DOWNPOUR__SPECIAL, "Acid Downpour (N)", Type.POISON, MoveCategory.SPECIAL, -1, -1, 1, "Dummy Data", -1, 0, 7),
    new AttackMove(Moves.TECTONIC_RAGE__PHYSICAL, "Tectonic Rage (N)", Type.GROUND, MoveCategory.PHYSICAL, -1, -1, 1, "The user burrows deep into the ground and slams into the target with the full force of its Z-Power. The power varies, depending on the original move.", -1, 0, 7),
    new AttackMove(Moves.TECTONIC_RAGE__SPECIAL, "Tectonic Rage (N)", Type.GROUND, MoveCategory.SPECIAL, -1, -1, 1, "Dummy Data", -1, 0, 7),
    new AttackMove(Moves.CONTINENTAL_CRUSH__PHYSICAL, "Continental Crush (N)", Type.ROCK, MoveCategory.PHYSICAL, -1, -1, 1, "The user summons a huge rock mountain using its Z-Power and drops it onto the target with full force. The power varies, depending on the original move.", -1, 0, 7),
    new AttackMove(Moves.CONTINENTAL_CRUSH__SPECIAL, "Continental Crush (N)", Type.ROCK, MoveCategory.SPECIAL, -1, -1, 1, "Dummy Data", -1, 0, 7),
    new AttackMove(Moves.SAVAGE_SPIN_OUT__PHYSICAL, "Savage Spin-Out (N)", Type.BUG, MoveCategory.PHYSICAL, -1, -1, 1, "The user binds the target with full force with threads of silk that the user spits using its Z-Power. The power varies, depending on the original move.", -1, 0, 7),
    new AttackMove(Moves.SAVAGE_SPIN_OUT__SPECIAL, "Savage Spin-Out (N)", Type.BUG, MoveCategory.SPECIAL, -1, -1, 1, "Dummy Data", -1, 0, 7),
    new AttackMove(Moves.NEVER_ENDING_NIGHTMARE__PHYSICAL, "Never-Ending Nightmare (N)", Type.GHOST, MoveCategory.PHYSICAL, -1, -1, 1, "Deep-seated grudges summoned by the user's Z-Power trap the target. The power varies, depending on the original move.", -1, 0, 7),
    new AttackMove(Moves.NEVER_ENDING_NIGHTMARE__SPECIAL, "Never-Ending Nightmare (N)", Type.GHOST, MoveCategory.SPECIAL, -1, -1, 1, "Dummy Data", -1, 0, 7),
    new AttackMove(Moves.CORKSCREW_CRASH__PHYSICAL, "Corkscrew Crash (N)", Type.STEEL, MoveCategory.PHYSICAL, -1, -1, 1, "The user spins very fast and rams into the target with the full force of its Z-Power. The power varies, depending on the original move.", -1, 0, 7),
    new AttackMove(Moves.CORKSCREW_CRASH__SPECIAL, "Corkscrew Crash (N)", Type.STEEL, MoveCategory.SPECIAL, -1, -1, 1, "Dummy Data", -1, 0, 7),
    new AttackMove(Moves.INFERNO_OVERDRIVE__PHYSICAL, "Inferno Overdrive (N)", Type.FIRE, MoveCategory.PHYSICAL, -1, -1, 1, "The user breathes a stream of intense fire toward the target with the full force of its Z-Power. The power varies depending on the original move.", -1, 0, 7),
    new AttackMove(Moves.INFERNO_OVERDRIVE__SPECIAL, "Inferno Overdrive (N)", Type.FIRE, MoveCategory.SPECIAL, -1, -1, 1, "Dummy Data", -1, 0, 7),
    new AttackMove(Moves.HYDRO_VORTEX__PHYSICAL, "Hydro Vortex (N)", Type.WATER, MoveCategory.PHYSICAL, -1, -1, 1, "The user creates a huge whirling current using its Z-Power to swallow the target with full force. The power varies, depending on the original move.", -1, 0, 7),
    new AttackMove(Moves.HYDRO_VORTEX__SPECIAL, "Hydro Vortex (N)", Type.WATER, MoveCategory.SPECIAL, -1, -1, 1, "Dummy Data", -1, 0, 7),
    new AttackMove(Moves.BLOOM_DOOM__PHYSICAL, "Bloom Doom (N)", Type.GRASS, MoveCategory.PHYSICAL, -1, -1, 1, "The user collects energy from plants using its Z-Power and attacks the target with full force. The power varies, depending on the original move.", -1, 0, 7),
    new AttackMove(Moves.BLOOM_DOOM__SPECIAL, "Bloom Doom (N)", Type.GRASS, MoveCategory.SPECIAL, -1, -1, 1, "Dummy Data", -1, 0, 7),
    new AttackMove(Moves.GIGAVOLT_HAVOC__PHYSICAL, "Gigavolt Havoc (N)", Type.ELECTRIC, MoveCategory.PHYSICAL, -1, -1, 1, "The user hits the target with a powerful electric current collected by its Z-Power. The power varies, depending on the original move.", -1, 0, 7),
    new AttackMove(Moves.GIGAVOLT_HAVOC__SPECIAL, "Gigavolt Havoc (N)", Type.ELECTRIC, MoveCategory.SPECIAL, -1, -1, 1, "Dummy Data", -1, 0, 7),
    new AttackMove(Moves.SHATTERED_PSYCHE__PHYSICAL, "Shattered Psyche (N)", Type.PSYCHIC, MoveCategory.PHYSICAL, -1, -1, 1, "The user controls the target with its Z-Power and hurts the target with full force. The power varies, depending on the original move.", -1, 0, 7),
    new AttackMove(Moves.SHATTERED_PSYCHE__SPECIAL, "Shattered Psyche (N)", Type.PSYCHIC, MoveCategory.SPECIAL, -1, -1, 1, "Dummy Data", -1, 0, 7),
    new AttackMove(Moves.SUBZERO_SLAMMER__PHYSICAL, "Subzero Slammer (N)", Type.ICE, MoveCategory.PHYSICAL, -1, -1, 1, "The user dramatically drops the temperature using its Z-Power and freezes the target with full force. The power varies, depending on the original move.", -1, 0, 7),
    new AttackMove(Moves.SUBZERO_SLAMMER__SPECIAL, "Subzero Slammer (N)", Type.ICE, MoveCategory.SPECIAL, -1, -1, 1, "Dummy Data", -1, 0, 7),
    new AttackMove(Moves.DEVASTATING_DRAKE__PHYSICAL, "Devastating Drake (N)", Type.DRAGON, MoveCategory.PHYSICAL, -1, -1, 1, "The user materializes its aura using its Z-Power and attacks the target with full force. The power varies, depending on the original move.", -1, 0, 7),
    new AttackMove(Moves.DEVASTATING_DRAKE__SPECIAL, "Devastating Drake (N)", Type.DRAGON, MoveCategory.SPECIAL, -1, -1, 1, "Dummy Data", -1, 0, 7),
    new AttackMove(Moves.BLACK_HOLE_ECLIPSE__PHYSICAL, "Black Hole Eclipse (N)", Type.DARK, MoveCategory.PHYSICAL, -1, -1, 1, "The user gathers dark energy using its Z-Power and sucks the target into it. The power varies, depending on the original move.", -1, 0, 7),
    new AttackMove(Moves.BLACK_HOLE_ECLIPSE__SPECIAL, "Black Hole Eclipse (N)", Type.DARK, MoveCategory.SPECIAL, -1, -1, 1, "Dummy Data", -1, 0, 7),
    new AttackMove(Moves.TWINKLE_TACKLE__PHYSICAL, "Twinkle Tackle (N)", Type.FAIRY, MoveCategory.PHYSICAL, -1, -1, 1, "The user creates a very charming space using its Z-Power and totally toys with the target. The power varies, depending on the original move.", -1, 0, 7),
    new AttackMove(Moves.TWINKLE_TACKLE__SPECIAL, "Twinkle Tackle (N)", Type.FAIRY, MoveCategory.SPECIAL, -1, -1, 1, "Dummy Data", -1, 0, 7),
    new AttackMove(Moves.CATASTROPIKA, "Catastropika (N)", Type.ELECTRIC, MoveCategory.PHYSICAL, 210, -1, 1, "The user, Pikachu, surrounds itself with the maximum amount of electricity using its Z-Power and pounces on its target with full force.", -1, 0, 7),
    /* End Unused */
    new SelfStatusMove(Moves.SHORE_UP, "Shore Up", Type.GROUND, -1, 5, "The user regains up to half of its max HP. It restores more HP in a sandstorm.", -1, 0, 7)
      .attr(SandHealAttr),
    new AttackMove(Moves.FIRST_IMPRESSION, "First Impression", Type.BUG, MoveCategory.PHYSICAL, 90, 100, 10, "Although this move has great power, it only works the first turn each time the user enters battle.", -1, 2, 7)
      .condition(new FirstMoveCondition()),
    new SelfStatusMove(Moves.BANEFUL_BUNKER, "Baneful Bunker", Type.POISON, -1, 10, "In addition to protecting the user from attacks, this move also poisons any attacker that makes direct contact.", -1, 4, 7)
      .attr(ProtectAttr, BattlerTagType.BANEFUL_BUNKER),
    new AttackMove(Moves.SPIRIT_SHACKLE, "Spirit Shackle (P)", Type.GHOST, MoveCategory.PHYSICAL, 80, 100, 10, "The user attacks while simultaneously stitching the target's shadow to the ground to prevent the target from escaping.", -1, 0, 7),
    new AttackMove(Moves.DARKEST_LARIAT, "Darkest Lariat (P)", Type.DARK, MoveCategory.PHYSICAL, 85, 100, 10, "The user swings both arms and hits the target. The target's stat changes don't affect this attack's damage.", -1, 0, 7),
    new AttackMove(Moves.SPARKLING_ARIA, "Sparkling Aria", Type.WATER, MoveCategory.SPECIAL, 90, 100, 10, "The user bursts into song, emitting many bubbles. Any Pokémon suffering from a burn will be healed by the touch of these bubbles.", -1, 0, 7)
      .attr(HealStatusEffectAttr, false, StatusEffect.BURN)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.ICE_HAMMER, "Ice Hammer", Type.ICE, MoveCategory.PHYSICAL, 100, 90, 10, "The user swings and hits with its strong, heavy fist. It lowers the user's Speed, however.", 100, 0, 7)
      .attr(StatChangeAttr, BattleStat.SPD, -1, true)
      .punchingMove(),
    new StatusMove(Moves.FLORAL_HEALING, "Floral Healing (P)", Type.FAIRY, -1, 10, "The user restores the target's HP by up to half of its max HP. It restores more HP when the terrain is grass.", -1, 0, 7)
      .attr(HealAttr, 0.5, true, false),
    new AttackMove(Moves.HIGH_HORSEPOWER, "High Horsepower", Type.GROUND, MoveCategory.PHYSICAL, 95, 95, 10, "The user fiercely attacks the target using its entire body.", -1, 0, 7),
    new StatusMove(Moves.STRENGTH_SAP, "Strength Sap (P)", Type.GRASS, 100, 10, "The user restores its HP by the same amount as the target's Attack stat. It also lowers the target's Attack stat.", 100, 0, 7)
      .attr(StatChangeAttr, BattleStat.ATK, -1),
    new AttackMove(Moves.SOLAR_BLADE, "Solar Blade", Type.GRASS, MoveCategory.PHYSICAL, 125, 100, 10, "In this two-turn attack, the user gathers light and fills a blade with the light's energy, attacking the target on the next turn.", -1, 0, 7)
      .attr(SunlightChargeAttr, ChargeAnim.SOLAR_BLADE_CHARGING, "is glowing!")
      .attr(AntiSunlightPowerDecreaseAttr)
      .slicingMove(),
    new AttackMove(Moves.LEAFAGE, "Leafage", Type.GRASS, MoveCategory.PHYSICAL, 40, 100, 40, "The user attacks by pelting the target with leaves.", -1, 0, 7),
    new StatusMove(Moves.SPOTLIGHT, "Spotlight (N)", Type.NORMAL, -1, 15, "The user shines a spotlight on the target so that only the target will be attacked during the turn.", -1, 3, 7),
    new StatusMove(Moves.TOXIC_THREAD, "Toxic Thread", Type.POISON, 100, 20, "The user shoots poisonous threads to poison the target and lower the target's Speed stat.", 100, 0, 7)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .attr(StatChangeAttr, BattleStat.SPD, -1),
    new SelfStatusMove(Moves.LASER_FOCUS, "Laser Focus (N)", Type.NORMAL, -1, 30, "The user concentrates intensely. The attack on the next turn always results in a critical hit.", -1, 0, 7),
    new StatusMove(Moves.GEAR_UP, "Gear Up", Type.STEEL, -1, 20, "The user engages its gears to raise the Attack and Sp. Atk stats of ally Pokémon with the Plus or Minus Ability.", -1, 0, 7)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.SPATK ], 1, false, (user, target, move) => [ Abilities.PLUS, Abilities.MINUS ].indexOf(target.getAbility().id) > -1)
      .target(MoveTarget.USER_AND_ALLIES)
      .condition((user, target, move) => !![ user, user.getAlly() ].find(p => p && [ Abilities.PLUS, Abilities.MINUS ].indexOf(p.getAbility().id) > -1)),
    new AttackMove(Moves.THROAT_CHOP, "Throat Chop (P)", Type.DARK, MoveCategory.PHYSICAL, 80, 100, 15, "The user attacks the target's throat, and the resultant suffering prevents the target from using moves that emit sound for two turns.", 100, 0, 7),
    new AttackMove(Moves.POLLEN_PUFF, "Pollen Puff (P)", Type.BUG, MoveCategory.SPECIAL, 90, 100, 15, "The user attacks the enemy with a pollen puff that explodes. If the target is an ally, it gives the ally a pollen puff that restores its HP instead.", -1, 0, 7)
      .ballBombMove(),
    new AttackMove(Moves.ANCHOR_SHOT, "Anchor Shot", Type.STEEL, MoveCategory.PHYSICAL, 80, 100, 20, "The user entangles the target with its anchor chain while attacking. The target becomes unable to flee.", -1, 0, 7)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, false, 1),
    new StatusMove(Moves.PSYCHIC_TERRAIN, "Psychic Terrain", Type.PSYCHIC, -1, 10, "This protects Pokémon on the ground from priority moves and powers up Psychic-type moves for five turns.", -1, 0, 7)
      .attr(TerrainChangeAttr, TerrainType.PSYCHIC)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.LUNGE, "Lunge", Type.BUG, MoveCategory.PHYSICAL, 80, 100, 15, "The user makes a lunge at the target, attacking with full force. This also lowers the target's Attack stat.", 100, 0, 7)
      .attr(StatChangeAttr, BattleStat.ATK, -1),
    new AttackMove(Moves.FIRE_LASH, "Fire Lash", Type.FIRE, MoveCategory.PHYSICAL, 80, 100, 15, "The user strikes the target with a burning lash. This also lowers the target's Defense stat.", 100, 0, 7)
      .attr(StatChangeAttr, BattleStat.DEF, -1),
    new AttackMove(Moves.POWER_TRIP, "Power Trip (P)", Type.DARK, MoveCategory.PHYSICAL, 20, 100, 10, "The user boasts its strength and attacks the target. The more the user's stats are raised, the greater the move's power.", -1, 0, 7),
    new AttackMove(Moves.BURN_UP, "Burn Up (P)", Type.FIRE, MoveCategory.SPECIAL, 130, 100, 5, "To inflict massive damage, the user burns itself out. After using this move, the user will no longer be Fire type.", -1, 0, 7)
      .attr(HealStatusEffectAttr, false, StatusEffect.FREEZE),
    new StatusMove(Moves.SPEED_SWAP, "Speed Swap (N)", Type.PSYCHIC, -1, 10, "The user exchanges Speed stats with the target.", -1, 0, 7),
    new AttackMove(Moves.SMART_STRIKE, "Smart Strike", Type.STEEL, MoveCategory.PHYSICAL, 70, -1, 10, "The user stabs the target with a sharp horn. This attack never misses.", -1, 0, 7),
    new StatusMove(Moves.PURIFY, "Purify (N)", Type.POISON, -1, 20, "The user heals the target's status condition. If the move succeeds, it also restores the user's own HP.", -1, 0, 7),
    new AttackMove(Moves.REVELATION_DANCE, "Revelation Dance (P)", Type.NORMAL, MoveCategory.SPECIAL, 90, 100, 15, "The user attacks the target by dancing very hard. The user's type determines the type of this move.", -1, 0, 7)
      .danceMove(),
    new AttackMove(Moves.CORE_ENFORCER, "Core Enforcer (N)", Type.DRAGON, MoveCategory.SPECIAL, 100, 100, 10, "If the Pokémon the user has inflicted damage on have already used their moves, this move eliminates the effect of the target's Ability.", -1, 0, 7)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.TROP_KICK, "Trop Kick", Type.GRASS, MoveCategory.PHYSICAL, 70, 100, 15, "The user lands an intense kick of tropical origins on the target. This also lowers the target's Attack stat.", 100, 0, 7)
      .attr(StatChangeAttr, BattleStat.ATK, -1),
    new StatusMove(Moves.INSTRUCT, "Instruct (N)", Type.PSYCHIC, -1, 15, "The user instructs the target to use the target's last move again.", -1, 0, 7),
    new AttackMove(Moves.BEAK_BLAST, "Beak Blast (P)", Type.FLYING, MoveCategory.PHYSICAL, 100, 100, 15, "The user first heats up its beak, and then it attacks the target. Making direct contact with the Pokémon while it's heating up its beak results in a burn.", -1, 5, 7)
      .attr(ChargeAttr, ChargeAnim.BEAK_BLAST_CHARGING, "started\nheating up its beak!", undefined, false, true, -3)
      .ballBombMove(),
    new AttackMove(Moves.CLANGING_SCALES, "Clanging Scales", Type.DRAGON, MoveCategory.SPECIAL, 110, 100, 5, "The user rubs the scales on its entire body and makes a huge noise to attack opposing Pokémon. The user's Defense stat goes down after the attack.", 100, 0, 7)
      .attr(StatChangeAttr, BattleStat.DEF, -1, true)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.DRAGON_HAMMER, "Dragon Hammer", Type.DRAGON, MoveCategory.PHYSICAL, 90, 100, 15, "The user uses its body like a hammer to attack the target and inflict damage.", -1, 0, 7),
    new AttackMove(Moves.BRUTAL_SWING, "Brutal Swing", Type.DARK, MoveCategory.PHYSICAL, 60, 100, 20, "The user swings its body around violently to inflict damage on everything in its vicinity.", -1, 0, 7)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new StatusMove(Moves.AURORA_VEIL, "Aurora Veil (N)", Type.ICE, -1, 20, "This move reduces damage from physical and special moves for five turns. This can be used only in a hailstorm.", -1, 0, 7)
      .condition((user, target, move) => user.scene.arena.weather?.weatherType === WeatherType.HAIL)
      .target(MoveTarget.USER_SIDE),
    /* Unused */
    new AttackMove(Moves.SINISTER_ARROW_RAID, "Sinister Arrow Raid (P)", Type.GHOST, MoveCategory.PHYSICAL, 180, -1, 1, "The user, Decidueye, creates countless arrows using its Z-Power and shoots the target with full force.", -1, 0, 7),
    new AttackMove(Moves.MALICIOUS_MOONSAULT, "Malicious Moonsault (P)", Type.DARK, MoveCategory.PHYSICAL, 180, -1, 1, "The user, Incineroar, strengthens its body using its Z-Power and crashes into the target with full force.", -1, 0, 7),
    new AttackMove(Moves.OCEANIC_OPERETTA, "Oceanic Operetta (P)", Type.WATER, MoveCategory.SPECIAL, 195, -1, 1, "The user, Primarina, summons a massive amount of  water using its Z-Power and attacks the target with  full force.", -1, 0, 7),
    new AttackMove(Moves.GUARDIAN_OF_ALOLA, "Guardian of Alola (N)", Type.FAIRY, MoveCategory.SPECIAL, -1, -1, 1, "The user, the Land Spirit Pokémon, obtains Alola's energy using its Z-Power and attacks the target with full force. This reduces the target's HP greatly.", -1, 0, 7),
    new AttackMove(Moves.SOUL_STEALING_7_STAR_STRIKE, "Soul-Stealing 7-Star Strike (N)", Type.GHOST, MoveCategory.PHYSICAL, 195, -1, 1, "After obtaining Z-Power, the user, Marshadow, punches and kicks the target consecutively with full force.", -1, 0, 7),
    new AttackMove(Moves.STOKED_SPARKSURFER, "Stoked Sparksurfer (P)", Type.ELECTRIC, MoveCategory.SPECIAL, 175, -1, 1, "After obtaining Z-Power, the user, Alolan Raichu, attacks the target with full force. This move leaves the target with paralysis.", 100, 0, 7),
    new AttackMove(Moves.PULVERIZING_PANCAKE, "Pulverizing Pancake (P)", Type.NORMAL, MoveCategory.PHYSICAL, 210, -1, 1, "Z-Power brings out the true capabilities of the user, Snorlax. The Pokémon moves its enormous body energetically and attacks the target with full force.", -1, 0, 7),
    new SelfStatusMove(Moves.EXTREME_EVOBOOST, "Extreme Evoboost (N)", Type.NORMAL, -1, 1, "After obtaining Z-Power, the user, Eevee, gets energy from its evolved friends and boosts its stats sharply.", 100, 0, 7),
    new AttackMove(Moves.GENESIS_SUPERNOVA, "Genesis Supernova (P)", Type.PSYCHIC, MoveCategory.SPECIAL, 185, -1, 1, "After obtaining Z-Power, the user, Mew, attacks the target with full force. The terrain will be charged with psychic energy.", -1, 0, 7),
    /* End Unused */
    new AttackMove(Moves.SHELL_TRAP, "Shell Trap (P)", Type.FIRE, MoveCategory.SPECIAL, 150, 100, 5, "The user sets a shell trap. If the user is hit by a physical move, the trap will explode and inflict damage on opposing Pokémon.", -1, -3, 7)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.FLEUR_CANNON, "Fleur Cannon", Type.FAIRY, MoveCategory.SPECIAL, 130, 90, 5, "The user unleashes a strong beam. The attack's recoil harshly lowers the user's Sp. Atk stat.", 100, 0, 7)
      .attr(StatChangeAttr, BattleStat.SPATK, -2, true),
    new AttackMove(Moves.PSYCHIC_FANGS, "Psychic Fangs (P)", Type.PSYCHIC, MoveCategory.PHYSICAL, 85, 100, 10, "The user bites the target with its psychic capabilities. This can also destroy Light Screen and Reflect.", -1, 0, 7)
      .bitingMove(),
    new AttackMove(Moves.STOMPING_TANTRUM, "Stomping Tantrum (P)", Type.GROUND, MoveCategory.PHYSICAL, 75, 100, 10, "Driven by frustration, the user attacks the target. If the user's previous move has failed, the power of this move doubles.", -1, 0, 7),
    new AttackMove(Moves.SHADOW_BONE, "Shadow Bone", Type.GHOST, MoveCategory.PHYSICAL, 85, 100, 10, "The user attacks by beating the target with a bone that contains a spirit. This may also lower the target's Defense stat.", 20, 0, 7)
      .attr(StatChangeAttr, BattleStat.DEF, -1),
    new AttackMove(Moves.ACCELEROCK, "Accelerock", Type.ROCK, MoveCategory.PHYSICAL, 40, 100, 20, "The user smashes into the target at high speed. This move always goes first.", -1, 1, 7),
    new AttackMove(Moves.LIQUIDATION, "Liquidation", Type.WATER, MoveCategory.PHYSICAL, 85, 100, 10, "The user slams into the target using a full-force blast of water. This may also lower the target's Defense stat.", 20, 0, 7)
      .attr(StatChangeAttr, BattleStat.DEF, -1),
    new AttackMove(Moves.PRISMATIC_LASER, "Prismatic Laser", Type.PSYCHIC, MoveCategory.SPECIAL, 160, 100, 10, "The user shoots powerful lasers using the power of a prism. The user can't move on the next turn.", -1, 0, 7)
      .attr(RechargeAttr),
    new AttackMove(Moves.SPECTRAL_THIEF, "Spectral Thief (P)", Type.GHOST, MoveCategory.PHYSICAL, 90, 100, 10, "The user hides in the target's shadow, steals the target's stat boosts, and then attacks.", -1, 0, 7),
    new AttackMove(Moves.SUNSTEEL_STRIKE, "Sunsteel Strike (P)", Type.STEEL, MoveCategory.PHYSICAL, 100, 100, 5, "The user slams into the target with the force of a meteor. This move can be used on the target regardless of its Abilities.", -1, 0, 7),
    new AttackMove(Moves.MOONGEIST_BEAM, "Moongeist Beam (P)", Type.GHOST, MoveCategory.SPECIAL, 100, 100, 5, "The user emits a sinister ray to attack the target. This move can be used on the target regardless of its Abilities.", -1, 0, 7),
    new StatusMove(Moves.TEARFUL_LOOK, "Tearful Look", Type.NORMAL, -1, 20, "The user gets teary eyed to make the target lose its combative spirit. This lowers the target's Attack and Sp. Atk stats.", 100, 0, 7)
      .attr(StatChangeAttr, BattleStat.ATK, -1)
      .attr(StatChangeAttr, BattleStat.SPATK, -1),
    new AttackMove(Moves.ZING_ZAP, "Zing Zap", Type.ELECTRIC, MoveCategory.PHYSICAL, 80, 100, 10, "A strong electric blast crashes down on the target, giving it an electric shock. This may also make the target flinch.", 30, 0, 7)
      .attr(FlinchAttr),
    new AttackMove(Moves.NATURES_MADNESS, "Nature's Madness", Type.FAIRY, MoveCategory.SPECIAL, -1, 90, 10, "The user hits the target with the force of nature. It halves the target's HP.", -1, 0, 7)
      .attr(TargetHalfHpDamageAttr),
    new AttackMove(Moves.MULTI_ATTACK, "Multi-Attack (P)", Type.NORMAL, MoveCategory.PHYSICAL, 120, 100, 10, "Cloaking itself in high energy, the user slams into the target. The memory held determines the move's type.", -1, 0, 7),
    /* Unused */
    new AttackMove(Moves.TEN_MILLION_VOLT_THUNDERBOLT, "10,000,000 Volt Thunderbolt (P)", Type.ELECTRIC, MoveCategory.SPECIAL, 195, -1, 1, "The user, Pikachu wearing a cap, powers up a jolt of electricity using its Z-Power and unleashes it. Critical hits land more easily.", -1, 0, 7),
    /* End Unused */
    new AttackMove(Moves.MIND_BLOWN, "Mind Blown", Type.FIRE, MoveCategory.SPECIAL, 150, 100, 5, "The user attacks everything around it by causing its own head to explode. This also damages the user.", -1, 0, 7)
      .attr(RecoilAttr, true, 0.5)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.PLASMA_FISTS, "Plasma Fists (P)", Type.ELECTRIC, MoveCategory.PHYSICAL, 100, 100, 15, "The user attacks with electrically charged fists. This move changes Normal-type moves to Electric-type moves.", -1, 0, 7)
      .punchingMove(),
    new AttackMove(Moves.PHOTON_GEYSER, "Photon Geyser (P)", Type.PSYCHIC, MoveCategory.SPECIAL, 100, 100, 5, "The user attacks a target with a pillar of light. This move inflicts Attack or Sp. Atk damage—whichever stat is higher for the user.", -1, 0, 7),
    /* Unused */
    new AttackMove(Moves.LIGHT_THAT_BURNS_THE_SKY, "Light That Burns the Sky (P)", Type.PSYCHIC, MoveCategory.SPECIAL, 200, -1, 1, "This attack inflicts Attack or Sp. Atk damage—whichever stat is higher for the user, Necrozma. This move ignores the target's Ability.", -1, 0, 7),
    new AttackMove(Moves.SEARING_SUNRAZE_SMASH, "Searing Sunraze Smash (P)", Type.STEEL, MoveCategory.PHYSICAL, 200, -1, 1, "After obtaining Z-Power, the user, Solgaleo, attacks the target with full force. This move can ignore the effect of the target's Ability.", -1, 0, 7),
    new AttackMove(Moves.MENACING_MOONRAZE_MAELSTROM, "Menacing Moonraze Maelstrom (P)", Type.GHOST, MoveCategory.SPECIAL, 200, -1, 1, "After obtaining Z-Power, the user, Lunala, attacks the target with full force. This move can ignore the effect of the target's Ability.", -1, 0, 7),
    new AttackMove(Moves.LETS_SNUGGLE_FOREVER, "Let's Snuggle Forever (P)", Type.FAIRY, MoveCategory.PHYSICAL, 190, -1, 1, "After obtaining Z-Power, the user, Mimikyu, punches the target with full force.", -1, 0, 7),
    new AttackMove(Moves.SPLINTERED_STORMSHARDS, "Splintered Stormshards", Type.ROCK, MoveCategory.PHYSICAL, 190, -1, 1, "After obtaining Z-Power, the user, Lycanroc, attacks the target with full force. This move negates the effect on the battlefield.", -1, 0, 7)
      .attr(ClearTerrainAttr),
    new AttackMove(Moves.CLANGOROUS_SOULBLAZE, "Clangorous Soulblaze (P)", Type.DRAGON, MoveCategory.SPECIAL, 185, -1, 1, "After obtaining Z-Power, the user, Kommo-o, attacks the opposing Pokémon with full force. This move boosts the user's stats.", 100, 0, 7)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    /* End Unused */
    new AttackMove(Moves.ZIPPY_ZAP, "Zippy Zap", Type.ELECTRIC, MoveCategory.PHYSICAL, 80, 100, 10, "The user attacks the target with bursts of electricity at high speed. This move always goes first and results in a critical hit.", 100, 2, 7)
      .attr(CritOnlyAttr),
    new AttackMove(Moves.SPLISHY_SPLASH, "Splishy Splash", Type.WATER, MoveCategory.SPECIAL, 90, 100, 15, "The user charges a huge wave with electricity and hits the opposing Pokémon with the wave. This may also leave the opposing Pokémon with paralysis.", 30, 0, 7)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.FLOATY_FALL, "Floaty Fall", Type.FLYING, MoveCategory.PHYSICAL, 90, 95, 15, "The user floats in the air, and then dives at a steep angle to attack the target. This may also make the target flinch.", 30, 0, 7)
      .attr(FlinchAttr),
    new AttackMove(Moves.PIKA_PAPOW, "Pika Papow", Type.ELECTRIC, MoveCategory.SPECIAL, -1, -1, 20, "The more Pikachu loves its Trainer, the greater the move's power. It never misses.", -1, 0, 7)
      .attr(FriendshipPowerAttr),
    new AttackMove(Moves.BOUNCY_BUBBLE, "Bouncy Bubble", Type.WATER, MoveCategory.SPECIAL, 60, 100, 20, "The user attacks by shooting water bubbles at the target. It then absorbs water and restores its HP by half the damage taken by the target.", -1, 0, 7)
      .attr(HitHealAttr),
    new AttackMove(Moves.BUZZY_BUZZ, "Buzzy Buzz", Type.ELECTRIC, MoveCategory.SPECIAL, 60, 100, 20, "The user shoots a jolt of electricity to attack the target. This also leaves the target with paralysis.", 100, 0, 7)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.SIZZLY_SLIDE, "Sizzly Slide", Type.FIRE, MoveCategory.PHYSICAL, 60, 100, 20, "The user cloaks itself in fire and charges at the target. This also leaves the target with a burn.", 100, 0, 7)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.GLITZY_GLOW, "Glitzy Glow (P)", Type.PSYCHIC, MoveCategory.SPECIAL, 80, 95, 15, "The user bombards the target with telekinetic force. A wondrous wall of light is put up to weaken the power of the opposing Pokémon's special moves.", -1, 0, 7),
    new AttackMove(Moves.BADDY_BAD, "Baddy Bad (P)", Type.DARK, MoveCategory.SPECIAL, 80, 95, 15, "The user acts bad and attacks the target. A wondrous wall of light is put up to weaken the power of the opposing Pokémon's physical moves.", -1, 0, 7),
    new AttackMove(Moves.SAPPY_SEED, "Sappy Seed", Type.GRASS, MoveCategory.PHYSICAL, 100, 90, 10, "The user grows a gigantic stalk that scatters seeds to attack the target. The seeds drain the target's HP every turn.", 100, 0, 7)
      .attr(AddBattlerTagAttr, BattlerTagType.SEEDED),
    new AttackMove(Moves.FREEZY_FROST, "Freezy Frost (P)", Type.ICE, MoveCategory.SPECIAL, 100, 90, 10, "The user attacks with a crystal made of cold frozen haze. It eliminates every stat change among all the Pokémon engaged in battle.", -1, 0, 7),
    new AttackMove(Moves.SPARKLY_SWIRL, "Sparkly Swirl (P)", Type.FAIRY, MoveCategory.SPECIAL, 120, 85, 5, "The user attacks the target by wrapping it with a whirlwind of an overpowering scent. This also heals all status conditions of the user's party.", -1, 0, 7),
    new AttackMove(Moves.VEEVEE_VOLLEY, "Veevee Volley", Type.NORMAL, MoveCategory.PHYSICAL, -1, -1, 20, "The more Eevee loves its Trainer, the greater the move's power. It never misses.", -1, 0, 7)
      .attr(FriendshipPowerAttr),
    new AttackMove(Moves.DOUBLE_IRON_BASH, "Double Iron Bash", Type.STEEL, MoveCategory.PHYSICAL, 60, 100, 5, "The user rotates, centering the hex nut in its chest, and then strikes with its arms twice in a row. This may also make the target flinch.", 30, 0, 7)
      .attr(MultiHitAttr, MultiHitType._2)
      .attr(FlinchAttr)
      .punchingMove(),
    /* Unused */
    new SelfStatusMove(Moves.MAX_GUARD, "Max Guard", Type.NORMAL, -1, 10, "This move enables the user to protect itself from all attacks. Its chance of failing rises if it is used in succession.", -1, 4, 8)
      .attr(ProtectAttr),
    /* End Unused */
    new AttackMove(Moves.DYNAMAX_CANNON, "Dynamax Cannon", Type.DRAGON, MoveCategory.SPECIAL, 100, 100, 5, "The user unleashes a strong beam from its core. This move deals twice the damage if the target is over level 200.", -1, 0, 8)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.level > 200 ? 2 : 1)
      .attr(DiscourageFrequentUseAttr)
      .ignoresVirtual(),
    new AttackMove(Moves.SNIPE_SHOT, "Snipe Shot (P)", Type.WATER, MoveCategory.SPECIAL, 80, 100, 15, "The user ignores the effects of opposing Pokémon's moves and Abilities that draw in moves, allowing this move to hit the chosen target.", -1, 0, 8),
    new AttackMove(Moves.JAW_LOCK, "Jaw Lock (P)", Type.DARK, MoveCategory.PHYSICAL, 80, 100, 10, "This move prevents the user and the target from switching out until either of them faints. The effect goes away if either of the Pokémon leaves the field.", -1, 0, 8)
      .bitingMove(),
    new SelfStatusMove(Moves.STUFF_CHEEKS, "Stuff Cheeks (N)", Type.NORMAL, -1, 10, "The user eats its held Berry, then sharply raises its Defense stat.", 100, 0, 8),
    new SelfStatusMove(Moves.NO_RETREAT, "No Retreat", Type.FIGHTING, -1, 5, "This move raises all the user's stats but prevents the user from switching out or fleeing.", 100, 0, 8)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF, BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD ], 1, true)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, true, true, 1),
    new StatusMove(Moves.TAR_SHOT, "Tar Shot (P)", Type.ROCK, 100, 15, "The user pours sticky tar over the target, lowering the target's Speed stat. The target becomes weaker to Fire-type moves.", 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.SPD, -1),
    new StatusMove(Moves.MAGIC_POWDER, "Magic Powder (N)", Type.PSYCHIC, 100, 20, "The user scatters a cloud of magic powder that changes the target to Psychic type.", -1, 0, 8)
      .powderMove(),
    new AttackMove(Moves.DRAGON_DARTS, "Dragon Darts (P)", Type.DRAGON, MoveCategory.PHYSICAL, 50, 100, 10, "The user attacks twice using Dreepy. If there are two targets, this move hits each target once.", -1, 0, 8)
      .attr(MultiHitAttr, MultiHitType._2),
    new StatusMove(Moves.TEATIME, "Teatime (N)", Type.NORMAL, -1, 10, "The user has teatime with all the Pokémon in the battle. Each Pokémon eats its held Berry.", -1, 0, 8)
      .target(MoveTarget.ALL),
    new StatusMove(Moves.OCTOLOCK, "Octolock (P)", Type.FIGHTING, 100, 15, "The user locks the target in and prevents it from fleeing. This move also lowers the target's Defense and Sp. Def every turn.", -1, 0, 8)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, true, 1),
    new AttackMove(Moves.BOLT_BEAK, "Bolt Beak", Type.ELECTRIC, MoveCategory.PHYSICAL, 85, 100, 10, "The user stabs the target with its electrified beak. If the user attacks before the target, the power of this move is doubled.", -1, 0, 8)
      .attr(FirstAttackDoublePowerAttr),
    new AttackMove(Moves.FISHIOUS_REND, "Fishious Rend", Type.WATER, MoveCategory.PHYSICAL, 85, 100, 10, "The user rends the target with its hard gills. If the user attacks before the target, the power of this move is doubled.", -1, 0, 8)
      .attr(FirstAttackDoublePowerAttr)
      .bitingMove(),
    new StatusMove(Moves.COURT_CHANGE, "Court Change (N)", Type.NORMAL, 100, 10, "With its mysterious power, the user swaps the effects on either side of the field.", -1, 0, 8)
      .target(MoveTarget.BOTH_SIDES),
    /* Unused */
    new AttackMove(Moves.MAX_FLARE, "Max Flare (N)", Type.FIRE, MoveCategory.PHYSICAL, 10, -1, 10, "This is a Fire-type attack Dynamax Pokémon use. The user intensifies the sun for five turns.", -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_FLUTTERBY, "Max Flutterby (N)", Type.BUG, MoveCategory.PHYSICAL, 10, -1, 10, "This is a Bug-type attack Dynamax Pokémon use. This lowers the target's Sp. Atk stat.", -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_LIGHTNING, "Max Lightning (N)", Type.ELECTRIC, MoveCategory.PHYSICAL, 10, -1, 10, "This is an Electric-type attack Dynamax Pokémon use. The user turns the ground into Electric Terrain for five turns.", -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_STRIKE, "Max Strike (N)", Type.NORMAL, MoveCategory.PHYSICAL, 10, -1, 10, "This is a Normal-type attack Dynamax Pokémon use. This lowers the target's Speed stat.", -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_KNUCKLE, "Max Knuckle (N)", Type.FIGHTING, MoveCategory.PHYSICAL, 10, -1, 10, "This is a Fighting-type attack Dynamax Pokémon use. This raises ally Pokémon's Attack stats.", -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_PHANTASM, "Max Phantasm (N)", Type.GHOST, MoveCategory.PHYSICAL, 10, -1, 10, "This is a Ghost-type attack Dynamax Pokémon use. This lowers the target's Defense stat.", -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_HAILSTORM, "Max Hailstorm (N)", Type.ICE, MoveCategory.PHYSICAL, 10, -1, 10, "This is an Ice-type attack Dynamax Pokémon use. The user summons a hailstorm lasting five turns.", -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_OOZE, "Max Ooze (N)", Type.POISON, MoveCategory.PHYSICAL, 10, -1, 10, "This is a Poison-type attack Dynamax Pokémon use. This raises ally Pokémon's Sp. Atk stats.", -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_GEYSER, "Max Geyser (N)", Type.WATER, MoveCategory.PHYSICAL, 10, -1, 10, "This is a Water-type attack Dynamax Pokémon use. The user summons a heavy rain that falls for five turns.", -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_AIRSTREAM, "Max Airstream (N)", Type.FLYING, MoveCategory.PHYSICAL, 10, -1, 10, "This is a Flying-type attack Dynamax Pokémon use. This raises ally Pokémon's Speed stats.", -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_STARFALL, "Max Starfall (N)", Type.FAIRY, MoveCategory.PHYSICAL, 10, -1, 10, "This is a Fairy-type attack Dynamax Pokémon use. The user turns the ground into Misty Terrain for five turns.", -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_WYRMWIND, "Max Wyrmwind (N)", Type.DRAGON, MoveCategory.PHYSICAL, 10, -1, 10, "This is a Dragon-type attack Dynamax Pokémon use. This lowers the target's Attack stat.", -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_MINDSTORM, "Max Mindstorm (N)", Type.PSYCHIC, MoveCategory.PHYSICAL, 10, -1, 10, "This is a Psychic-type attack Dynamax Pokémon use. The user turns the ground into Psychic Terrain for five turns.", -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_ROCKFALL, "Max Rockfall (N)", Type.ROCK, MoveCategory.PHYSICAL, 10, -1, 10, "This is a Rock-type attack Dynamax Pokémon use. The user summons a sandstorm lasting five turns.", -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_QUAKE, "Max Quake (N)", Type.GROUND, MoveCategory.PHYSICAL, 10, -1, 10, "This is a Ground-type attack Dynamax Pokémon use. This raises ally Pokémon's Sp. Def stats.", -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_DARKNESS, "Max Darkness (N)", Type.DARK, MoveCategory.PHYSICAL, 10, -1, 10, "This is a Dark-type attack Dynamax Pokémon use. This lowers the target's Sp. Def stat.", -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_OVERGROWTH, "Max Overgrowth (N)", Type.GRASS, MoveCategory.PHYSICAL, 10, -1, 10, "This is a Grass-type attack Dynamax Pokémon use. The user turns the ground into Grassy Terrain for five turns.", -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_STEELSPIKE, "Max Steelspike (N)", Type.STEEL, MoveCategory.PHYSICAL, 10, -1, 10, "This is a Steel-type attack Dynamax Pokémon use. This raises ally Pokémon's Defense stats.", -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    /* End Unused */
    new SelfStatusMove(Moves.CLANGOROUS_SOUL, "Clangorous Soul", Type.DRAGON, 100, 5, "The user raises all its stats by using some of its HP.", 100, 0, 8)
      .attr(CutHpStatBoostAttr, [ BattleStat.ATK, BattleStat.DEF, BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD ])
      .soundBased()
      .danceMove(),
    new AttackMove(Moves.BODY_PRESS, "Body Press", Type.FIGHTING, MoveCategory.PHYSICAL, 80, 100, 10, "The user attacks by slamming its body into the target. The higher the user's Defense, the more damage it can inflict on the target.", -1, 0, 8)
      .attr(DefAtkAttr),
    new StatusMove(Moves.DECORATE, "Decorate", Type.FAIRY, -1, 15, "The user sharply raises the target's Attack and Sp. Atk stats by decorating the target.", 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.ATK, 2)
      .attr(StatChangeAttr, BattleStat.SPATK, 2),
    new AttackMove(Moves.DRUM_BEATING, "Drum Beating", Type.GRASS, MoveCategory.PHYSICAL, 80, 100, 10, "The user plays its drum, controlling the drum's roots to attack the target. This also lowers the target's Speed stat.", 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.SPD, -1),
    new AttackMove(Moves.SNAP_TRAP, "Snap Trap (P)", Type.GRASS, MoveCategory.PHYSICAL, 35, 100, 15, "The user snares the target in a snap trap for four to five turns.", 100, 0, 8),
    new AttackMove(Moves.PYRO_BALL, "Pyro Ball", Type.FIRE, MoveCategory.PHYSICAL, 120, 90, 5, "The user attacks by igniting a small stone and launching it as a fiery ball at the target. This may also leave the target with a burn.", 10, 0, 8)
      .attr(HealStatusEffectAttr, false, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .ballBombMove(),
    new AttackMove(Moves.BEHEMOTH_BLADE, "Behemoth Blade", Type.STEEL, MoveCategory.PHYSICAL, 100, 100, 5, "The user wields a large, powerful sword using its whole body and cuts the target in a vigorous attack.", -1, 0, 8)
      .slicingMove(),
    new AttackMove(Moves.BEHEMOTH_BASH, "Behemoth Bash", Type.STEEL, MoveCategory.PHYSICAL, 100, 100, 5, "The user's body becomes a firm shield and slams into the target fiercely.", -1, 0, 8),
    new AttackMove(Moves.AURA_WHEEL, "Aura Wheel (P)", Type.ELECTRIC, MoveCategory.PHYSICAL, 110, 100, 10, "Morpeko attacks and raises its Speed with the energy stored in its cheeks. This move's type changes depending on the user's form.", 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.SPD, 1, true),
    new AttackMove(Moves.BREAKING_SWIPE, "Breaking Swipe", Type.DRAGON, MoveCategory.PHYSICAL, 60, 100, 15, "The user swings its tough tail wildly and attacks opposing Pokémon. This also lowers their Attack stats.", 100, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .attr(StatChangeAttr, BattleStat.ATK, -1),
    new AttackMove(Moves.BRANCH_POKE, "Branch Poke", Type.GRASS, MoveCategory.PHYSICAL, 40, 100, 40, "The user attacks the target by poking it with a sharply pointed branch.", -1, 0, 8),
    new AttackMove(Moves.OVERDRIVE, "Overdrive", Type.ELECTRIC, MoveCategory.SPECIAL, 80, 100, 10, "The user attacks opposing Pokémon by twanging a guitar or bass guitar, causing a huge echo and strong vibration.", -1, 0, 8)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.APPLE_ACID, "Apple Acid", Type.GRASS, MoveCategory.SPECIAL, 80, 100, 10, "The user attacks the target with an acidic liquid created from tart apples. This also lowers the target's Sp. Def stat.", 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1),
    new AttackMove(Moves.GRAV_APPLE, "Grav Apple (P)", Type.GRASS, MoveCategory.PHYSICAL, 80, 100, 10, "The user inflicts damage by dropping an apple from high above. This also lowers the target's Defense stat.", 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.DEF, -1),
    new AttackMove(Moves.SPIRIT_BREAK, "Spirit Break", Type.FAIRY, MoveCategory.PHYSICAL, 75, 100, 15, "The user attacks the target with so much force that it could break the target's spirit. This also lowers the target's Sp. Atk stat.", 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.SPATK, -1),
    new AttackMove(Moves.STRANGE_STEAM, "Strange Steam", Type.FAIRY, MoveCategory.SPECIAL, 90, 95, 10, "The user attacks the target by emitting steam. This may also confuse the target.", 20, 0, 8)
      .attr(ConfuseAttr),
    new StatusMove(Moves.LIFE_DEW, "Life Dew (N)", Type.WATER, -1, 10, "The user scatters mysterious water around and restores the HP of itself and its ally Pokémon in the battle.", -1, 0, 8)
      .target(MoveTarget.USER_AND_ALLIES),
    new SelfStatusMove(Moves.OBSTRUCT, "Obstruct (P)", Type.DARK, 100, 10, "This move enables the user to protect itself from all attacks. Its chance of failing rises if it is used in succession. Direct contact harshly lowers the attacker's Defense stat.", -1, 4, 8)
      .attr(ProtectAttr),
    new AttackMove(Moves.FALSE_SURRENDER, "False Surrender", Type.DARK, MoveCategory.PHYSICAL, 80, -1, 10, "The user pretends to bow its head, but then it stabs the target with its disheveled hair. This attack never misses.", -1, 0, 8),
    new AttackMove(Moves.METEOR_ASSAULT, "Meteor Assault", Type.FIGHTING, MoveCategory.PHYSICAL, 150, 100, 5, "The user attacks wildly with its thick leek. The user can't move on the next turn, because the force of this move makes it stagger.", -1, 0, 8)
      .attr(RechargeAttr),
    new AttackMove(Moves.ETERNABEAM, "Eternabeam", Type.DRAGON, MoveCategory.SPECIAL, 160, 90, 5, "This is Eternatus's most powerful attack in its original form. The user can't move on the next turn.", -1, 0, 8)
      .attr(RechargeAttr),
    new AttackMove(Moves.STEEL_BEAM, "Steel Beam (P)", Type.STEEL, MoveCategory.SPECIAL, 140, 95, 5, "The user fires a beam of steel that it collected from its entire body. This also damages the user.", -1, 0, 8),
    new AttackMove(Moves.EXPANDING_FORCE, "Expanding Force (P)", Type.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 10, "The user attacks the target with its psychic power. This move's power goes up and damages all opposing Pokémon on Psychic Terrain.", -1, 0, 8),
    new AttackMove(Moves.STEEL_ROLLER, "Steel Roller", Type.STEEL, MoveCategory.PHYSICAL, 130, 100, 5, "The user attacks while destroying the terrain. This move fails when the ground hasn't turned into a terrain.", -1, 0, 8)
      .attr(ClearTerrainAttr)
      .condition((user, target, move) => !!user.scene.arena.terrain),
    new AttackMove(Moves.SCALE_SHOT, "Scale Shot (P)", Type.DRAGON, MoveCategory.PHYSICAL, 25, 90, 20, "The user attacks by shooting scales two to five times in a row. This move boosts the user's Speed stat but lowers its Defense stat.", 100, 0, 8)
      //.attr(StatChangeAttr, BattleStat.SPD, 1, true) // TODO: Have boosts only apply at end of move, not after every hit
      //.attr(StatChangeAttr, BattleStat.DEF, -1, true)
      .attr(MultiHitAttr),
    new AttackMove(Moves.METEOR_BEAM, "Meteor Beam", Type.ROCK, MoveCategory.SPECIAL, 120, 90, 10, "In this two-turn attack, the user gathers space power and boosts its Sp. Atk stat, then attacks the target on the next turn.", 100, 0, 8)
      .attr(ChargeAttr, ChargeAnim.METEOR_BEAM_CHARGING, 'is overflowing\nwith space power!', null, true)
      .attr(StatChangeAttr, BattleStat.SPATK, 1, true)
      .ignoresVirtual(),
    new AttackMove(Moves.SHELL_SIDE_ARM, "Shell Side Arm (P)", Type.POISON, MoveCategory.SPECIAL, 90, 100, 10, "This move inflicts physical or special damage, whichever will be more effective. This may also poison the target.", 20, 0, 8),
    new AttackMove(Moves.MISTY_EXPLOSION, "Misty Explosion (P)", Type.FAIRY, MoveCategory.SPECIAL, 100, 100, 5, "The user attacks everything around it and faints upon using this move. This move's power is increased on Misty Terrain.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.GRASSY_GLIDE, "Grassy Glide (P)", Type.GRASS, MoveCategory.PHYSICAL, 55, 100, 20, "Gliding on the ground, the user attacks the target. This move always goes first on Grassy Terrain.", -1, 0, 8),
    new AttackMove(Moves.RISING_VOLTAGE, "Rising Voltage (P)", Type.ELECTRIC, MoveCategory.SPECIAL, 70, 100, 20, "The user attacks with electric voltage rising from the ground. This move's power doubles when the target is on Electric Terrain.", -1, 0, 8),
    new AttackMove(Moves.TERRAIN_PULSE, "Terrain Pulse (P)", Type.NORMAL, MoveCategory.SPECIAL, 50, 100, 10, "The user utilizes the power of the terrain to attack. This move's type and power changes depending on the terrain when it's used.", -1, 0, 8)
      .pulseMove(),
    new AttackMove(Moves.SKITTER_SMACK, "Skitter Smack", Type.BUG, MoveCategory.PHYSICAL, 70, 90, 10, "The user skitters behind the target to attack. This also lowers the target's Sp. Atk stat.", 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.SPATK, -1),
    new AttackMove(Moves.BURNING_JEALOUSY, "Burning Jealousy (P)", Type.FIRE, MoveCategory.SPECIAL, 70, 100, 5, "The user attacks with energy from jealousy. This leaves all opposing Pokémon that have had their stats boosted during the turn with a burn.", 100, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.LASH_OUT, "Lash Out (P)", Type.DARK, MoveCategory.PHYSICAL, 75, 100, 5, "The user lashes out to vent its frustration toward the target. If the user's stats were lowered during this turn, the power of this move is doubled.", -1, 0, 8),
    new AttackMove(Moves.POLTERGEIST, "Poltergeist (P)", Type.GHOST, MoveCategory.PHYSICAL, 110, 90, 5, "The user attacks the target by controlling the target's item. The move fails if the target doesn't have an item.", -1, 0, 8),
    new StatusMove(Moves.CORROSIVE_GAS, "Corrosive Gas (N)", Type.POISON, 100, 40, "The user surrounds everything around it with highly acidic gas and melts away items they hold.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new StatusMove(Moves.COACHING, "Coaching", Type.FIGHTING, -1, 10, "The user properly coaches its ally Pokémon, boosting their Attack and Defense stats.", 100, 0, 8)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF ], 1)
      .target(MoveTarget.NEAR_ALLY),
    new AttackMove(Moves.FLIP_TURN, "Flip Turn", Type.WATER, MoveCategory.PHYSICAL, 60, 100, 20, "After making its attack, the user rushes back to switch places with a party Pokémon in waiting.", -1, 0, 8)
      .attr(ForceSwitchOutAttr, true),
    new AttackMove(Moves.TRIPLE_AXEL, "Triple Axel (P)", Type.ICE, MoveCategory.PHYSICAL, 20, 90, 10, "A consecutive three-kick attack that becomes more powerful with each successful hit.", -1, 0, 8)
      .attr(MultiHitAttr, MultiHitType._3_INCR)
      .attr(MissEffectAttr, (user: Pokemon, move: Move) => {
        user.turnData.hitsLeft = 1;
        return true;
      }),
    new AttackMove(Moves.DUAL_WINGBEAT, "Dual Wingbeat", Type.FLYING, MoveCategory.PHYSICAL, 40, 90, 10, "The user slams the target with its wings. The target is hit twice in a row.", -1, 0, 8)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.SCORCHING_SANDS, "Scorching Sands", Type.GROUND, MoveCategory.SPECIAL, 70, 100, 10, "The user throws scorching sand at the target to attack. This may also leave the target with a burn.", 30, 0, 8)
      .attr(HealStatusEffectAttr, false, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new StatusMove(Moves.JUNGLE_HEALING, "Jungle Healing (P)", Type.GRASS, -1, 10, "The user becomes one with the jungle, restoring HP and healing any status conditions of itself and its ally Pokémon in battle.", -1, 0, 8)
      .attr(HealAttr, 0.25)
      .target(MoveTarget.USER_AND_ALLIES),
    new AttackMove(Moves.WICKED_BLOW, "Wicked Blow", Type.DARK, MoveCategory.PHYSICAL, 75, 100, 5, "The user, having mastered the Dark style, strikes the target with a fierce blow. This attack always results in a critical hit.", -1, 0, 8)
      .attr(CritOnlyAttr)
      .punchingMove(),
    new AttackMove(Moves.SURGING_STRIKES, "Surging Strikes", Type.WATER, MoveCategory.PHYSICAL, 25, 100, 5, "The user, having mastered the Water style, strikes the target with a flowing motion three times in a row. This attack always results in a critical hit.", -1, 0, 8)
      .attr(MultiHitAttr, MultiHitType._3)
      .attr(CritOnlyAttr)
      .punchingMove(),
    new AttackMove(Moves.THUNDER_CAGE, "Thunder Cage", Type.ELECTRIC, MoveCategory.SPECIAL, 80, 90, 15, "The user traps the target in a cage of sparking electricity for four to five turns.", 100, 0, 8)
      .attr(TrapAttr, BattlerTagType.THUNDER_CAGE),
    new AttackMove(Moves.DRAGON_ENERGY, "Dragon Energy", Type.DRAGON, MoveCategory.SPECIAL, 150, 100, 5, "Converting its life-force into power, the user attacks opposing Pokémon. The lower the user's HP, the lower the move's power.", -1, 0, 8)
      .attr(HpPowerAttr)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.FREEZING_GLARE, "Freezing Glare", Type.PSYCHIC, MoveCategory.SPECIAL, 90, 100, 10, "The user shoots its psychic power from its eyes to attack. This may also leave the target frozen.", 10, 0, 8)
      .attr(StatusEffectAttr, StatusEffect.FREEZE),
    new AttackMove(Moves.FIERY_WRATH, "Fiery Wrath", Type.DARK, MoveCategory.SPECIAL, 90, 100, 10, "The user transforms its wrath into a fire-like aura to attack. This may also make opposing Pokémon flinch.", 20, 0, 8)
      .attr(FlinchAttr)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.THUNDEROUS_KICK, "Thunderous Kick", Type.FIGHTING, MoveCategory.PHYSICAL, 90, 100, 10, "The user overwhelms the target with lightning-like movement before delivering a kick. This also lowers the target's Defense stat.", 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.DEF, -1),
    new AttackMove(Moves.GLACIAL_LANCE, "Glacial Lance", Type.ICE, MoveCategory.PHYSICAL, 120, 100, 5, "The user attacks by hurling a blizzard-cloaked icicle lance at opposing Pokémon.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.ASTRAL_BARRAGE, "Astral Barrage", Type.GHOST, MoveCategory.SPECIAL, 120, 100, 5, "The user attacks by sending a frightful amount of small ghosts at opposing Pokémon.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.EERIE_SPELL, "Eerie Spell (P)", Type.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 5, "The user attacks with its tremendous psychic power. This also removes 3 PP from the target's last move.", 100, 0, 8)
      .soundBased(),
    new AttackMove(Moves.DIRE_CLAW, "Dire Claw", Type.POISON, MoveCategory.PHYSICAL, 80, 100, 15, "The user lashes out at the target with ruinous claws. This may also leave the target poisoned, paralyzed, or asleep.", 50, 0, 8)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .attr(StatusEffectAttr, StatusEffect.SLEEP),
    new AttackMove(Moves.PSYSHIELD_BASH, "Psyshield Bash", Type.PSYCHIC, MoveCategory.PHYSICAL, 70, 90, 10, "Cloaking itself in psychic energy, the user slams into the target. This also boosts the user's Defense stat.", 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.DEF, 1, true),
    new SelfStatusMove(Moves.POWER_SHIFT, "Power Shift (N)", Type.NORMAL, -1, 10, "The user swaps its Attack and Defense stats.", 100, 0, 8),
    new AttackMove(Moves.STONE_AXE, "Stone Axe", Type.ROCK, MoveCategory.PHYSICAL, 65, 90, 15, "The user swings its stone axes at the target. Stone splinters left behind by this attack float around the target.", 100, 0, 8)
      .attr(AddArenaTrapTagAttr, ArenaTagType.STEALTH_ROCK)
      .slicingMove(),
    new AttackMove(Moves.SPRINGTIDE_STORM, "Springtide Storm", Type.FAIRY, MoveCategory.SPECIAL, 100, 80, 5, "The user attacks by wrapping opposing Pokémon in fierce winds brimming with love and hate. This may also lower their Attack stats.", 30, 0, 8)
      .attr(StatChangeAttr, BattleStat.ATK, -1)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.MYSTICAL_POWER, "Mystical Power", Type.PSYCHIC, MoveCategory.SPECIAL, 70, 90, 10, "The user attacks by emitting a mysterious power. This also boosts the user's Sp. Atk stat.", 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.SPATK, 1, true),
    new AttackMove(Moves.RAGING_FURY, "Raging Fury", Type.FIRE, MoveCategory.PHYSICAL, 120, 100, 10, "The user rampages around spewing flames for two to three turns. The user then becomes confused.", -1, 0, 8)
      .attr(FrenzyAttr)
      .attr(MissEffectAttr, frenzyMissFunc)
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new AttackMove(Moves.WAVE_CRASH, "Wave Crash", Type.WATER, MoveCategory.PHYSICAL, 120, 100, 10, "The user shrouds itself in water and slams into the target with its whole body to inflict damage. This also damages the user quite a lot.", -1, 0, 8)
      .attr(RecoilAttr),
    new AttackMove(Moves.CHLOROBLAST, "Chloroblast (P)", Type.GRASS, MoveCategory.SPECIAL, 150, 95, 5, "The user launches its amassed chlorophyll to inflict damage on the target. This also damages the user.", -1, 0, 8),
    new AttackMove(Moves.MOUNTAIN_GALE, "Mountain Gale", Type.ICE, MoveCategory.PHYSICAL, 100, 85, 10, "The user hurls giant chunks of ice at the target to inflict damage. This may also make the target flinch.", 30, 0, 8)
      .attr(FlinchAttr),
    new SelfStatusMove(Moves.VICTORY_DANCE, "Victory Dance", Type.FIGHTING, -1, 10, "The user performs an intense dance to usher in victory, boosting its Attack, Defense, and Speed stats.", 100, 0, 8)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF, BattleStat.SPD ], 1, true)
      .danceMove(),
    new AttackMove(Moves.HEADLONG_RUSH, "Headlong Rush", Type.GROUND, MoveCategory.PHYSICAL, 120, 100, 5, "The user smashes into the target in a full-body tackle. This also lowers the user's Defense and Sp. Def stats.", 100, 0, 8)
      .attr(StatChangeAttr, [ BattleStat.DEF, BattleStat.SPDEF ], -1, true)
      .punchingMove(),
    new AttackMove(Moves.BARB_BARRAGE, "Barb Barrage", Type.POISON, MoveCategory.PHYSICAL, 60, 100, 10, "The user launches countless toxic barbs to inflict damage. This may also poison the target. This move's power is doubled if the target is already poisoned.", 50, 0, 8)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.status && (target.status.effect === StatusEffect.POISON || target.status.effect === StatusEffect.TOXIC) ? 2 : 1)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(Moves.ESPER_WING, "Esper Wing", Type.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 10, "The user slashes the target with aura-enriched wings. This also boosts the user's Speed stat. This move has a heightened chance of landing a critical hit.", 100, 0, 8)
      .attr(HighCritAttr)
      .attr(StatChangeAttr, BattleStat.SPD, 1, true),
    new AttackMove(Moves.BITTER_MALICE, "Bitter Malice", Type.GHOST, MoveCategory.SPECIAL, 75, 100, 10, "The user attacks the target with spine-chilling resentment. This also lowers the target's Attack stat.", 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.ATK, -1),
    new SelfStatusMove(Moves.SHELTER, "Shelter", Type.STEEL, -1, 10, "The user makes its skin as hard as an iron shield, sharply boosting its Defense stat.", 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.DEF, 2, true),
    new AttackMove(Moves.TRIPLE_ARROWS, "Triple Arrows (P)", Type.FIGHTING, MoveCategory.PHYSICAL, 90, 100, 10, "The user kicks, then fires three arrows. This move has a heightened chance of landing a critical hit and may also lower the target's Defense stat or make it flinch.", 30, 0, 8)
      .attr(HighCritAttr)
      .attr(StatChangeAttr, BattleStat.DEF, -1)
      .attr(FlinchAttr),
    new AttackMove(Moves.INFERNAL_PARADE, "Infernal Parade", Type.GHOST, MoveCategory.SPECIAL, 60, 100, 15, "The user attacks with myriad fireballs. This may also leave the target with a burn. This move's power is doubled if the target has a status condition.", 30, 0, 8)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.status ? 2 : 1),
    new AttackMove(Moves.CEASELESS_EDGE, "Ceaseless Edge", Type.DARK, MoveCategory.PHYSICAL, 65, 90, 15, "The user slashes its shell blade at the target. Shell splinters left behind by this attack remain scattered under the target as spikes.", 100, 0, 8)
      .attr(AddArenaTrapTagAttr, ArenaTagType.SPIKES)
      .slicingMove(),
    new AttackMove(Moves.BLEAKWIND_STORM, "Bleakwind Storm", Type.FLYING, MoveCategory.SPECIAL, 100, 80, 10, "The user attacks with savagely cold winds that cause both body and spirit to tremble. This may also lower the Speed stats of opposing Pokémon.", 30, 0, 8)
      .attr(ThunderAccuracyAttr)
      .attr(StatChangeAttr, BattleStat.SPD, -1)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.WILDBOLT_STORM, "Wildbolt Storm", Type.ELECTRIC, MoveCategory.SPECIAL, 100, 80, 10, "The user summons a thunderous tempest and savagely attacks with lightning and wind. This may also leave opposing Pokémon with paralysis.", 20, 0, 8)
      .attr(ThunderAccuracyAttr)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.SANDSEAR_STORM, "Sandsear Storm", Type.GROUND, MoveCategory.SPECIAL, 100, 80, 10, "The user attacks by wrapping opposing Pokémon in fierce winds and searingly hot sand. This may also leave them with a burn.", 20, 0, 8)
      .attr(ThunderAccuracyAttr)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.LUNAR_BLESSING, "Lunar Blessing (P)", Type.PSYCHIC, -1, 5, "The user receives a blessing from the crescent moon, restoring HP and curing status conditions for itself and its ally Pokémon currently in the battle.", -1, 0, 8)
      .attr(HealAttr, 0.25)
      .target(MoveTarget.USER_AND_ALLIES),
    new SelfStatusMove(Moves.TAKE_HEART, "Take Heart (P)", Type.PSYCHIC, -1, 10, "The user lifts its spirits, curing its own status conditions and boosting its Sp. Atk and Sp. Def stats.", -1, 0, 8)
      .attr(StatChangeAttr, [ BattleStat.SPATK, BattleStat.SPDEF ], 1, true),
    /* Unused
    new AttackMove(Moves.G_MAX_WILDFIRE, "G-Max Wildfire (N)", Type.FIRE, MoveCategory.PHYSICAL, 10, -1, 10, "A Fire-type attack that Gigantamax Charizard use. This move continues to deal damage to opponents for four turns.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.G_MAX_BEFUDDLE, "G-Max Befuddle (N)", Type.BUG, MoveCategory.PHYSICAL, 10, -1, 10, "A Bug-type attack that Gigantamax Butterfree use. This move inflicts the poisoned, paralyzed, or asleep status condition on opponents.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.G_MAX_VOLT_CRASH, "G-Max Volt Crash (N)", Type.ELECTRIC, MoveCategory.PHYSICAL, 10, -1, 10, "An Electric-type attack that Gigantamax Pikachu use. This move paralyzes opponents.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.G_MAX_GOLD_RUSH, "G-Max Gold Rush (N)", Type.NORMAL, MoveCategory.PHYSICAL, 10, -1, 10, "A Normal-type attack that Gigantamax Meowth use. This move confuses opponents and also earns extra money.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.G_MAX_CHI_STRIKE, "G-Max Chi Strike (N)", Type.FIGHTING, MoveCategory.PHYSICAL, 10, -1, 10, "A Fighting-type attack that Gigantamax Machamp use. This move raises the chance of critical hits.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.G_MAX_TERROR, "G-Max Terror (N)", Type.GHOST, MoveCategory.PHYSICAL, 10, -1, 10, "A Ghost-type attack that Gigantamax Gengar use. This Pokémon steps on the opposing Pokémon's shadow to prevent them from escaping.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.G_MAX_RESONANCE, "G-Max Resonance (N)", Type.ICE, MoveCategory.PHYSICAL, 10, -1, 10, "An Ice-type attack that Gigantamax Lapras use. This move reduces the damage received for five turns.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.G_MAX_CUDDLE, "G-Max Cuddle (N)", Type.NORMAL, MoveCategory.PHYSICAL, 10, -1, 10, "A Normal-type attack that Gigantamax Eevee use. This move infatuates opponents.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.G_MAX_REPLENISH, "G-Max Replenish (N)", Type.NORMAL, MoveCategory.PHYSICAL, 10, -1, 10, "A Normal-type attack that Gigantamax Snorlax use. This move restores Berries that have been eaten.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.G_MAX_MALODOR, "G-Max Malodor (N)", Type.POISON, MoveCategory.PHYSICAL, 10, -1, 10, "A Poison-type attack that Gigantamax Garbodor use. This move poisons opponents.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.G_MAX_STONESURGE, "G-Max Stonesurge (N)", Type.WATER, MoveCategory.PHYSICAL, 10, -1, 10, "A Water-type attack that Gigantamax Drednaw use. This move scatters sharp rocks around the field.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.G_MAX_WIND_RAGE, "G-Max Wind Rage (N)", Type.FLYING, MoveCategory.PHYSICAL, 10, -1, 10, "A Flying-type attack that Gigantamax Corviknight use. This move removes the effects of moves like Reflect and Light Screen.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.G_MAX_STUN_SHOCK, "G-Max Stun Shock (N)", Type.ELECTRIC, MoveCategory.PHYSICAL, 10, -1, 10, "An Electric-type attack that Gigantamax Toxtricity use. This move poisons or paralyzes opponents.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.G_MAX_FINALE, "G-Max Finale (N)", Type.FAIRY, MoveCategory.PHYSICAL, 10, -1, 10, "A Fairy-type attack that Gigantamax Alcremie use. This move heals the HP of allies.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.G_MAX_DEPLETION, "G-Max Depletion (N)", Type.DRAGON, MoveCategory.PHYSICAL, 10, -1, 10, "A Dragon-type attack that Gigantamax Duraludon use. Reduces the PP of the last move used.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.G_MAX_GRAVITAS, "G-Max Gravitas (N)", Type.PSYCHIC, MoveCategory.PHYSICAL, 10, -1, 10, "A Psychic-type attack that Gigantamax Orbeetle use. This move changes gravity for five turns.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.G_MAX_VOLCALITH, "G-Max Volcalith (N)", Type.ROCK, MoveCategory.PHYSICAL, 10, -1, 10, "A Rock-type attack that Gigantamax Coalossal use. This move continues to deal damage to opponents for four turns.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.G_MAX_SANDBLAST, "G-Max Sandblast (N)", Type.GROUND, MoveCategory.PHYSICAL, 10, -1, 10, "A Ground-type attack that Gigantamax Sandaconda use. Opponents are trapped in a raging sandstorm for four to five turns.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.G_MAX_SNOOZE, "G-Max Snooze (N)", Type.DARK, MoveCategory.PHYSICAL, 10, -1, 10, "A Dark-type attack that Gigantamax Grimmsnarl use. The user lets loose a huge yawn that lulls the targets into falling asleep on the next turn.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.G_MAX_TARTNESS, "G-Max Tartness (N)", Type.GRASS, MoveCategory.PHYSICAL, 10, -1, 10, "A Grass-type attack that Gigantamax Flapple use. This move reduces the opponents' evasiveness.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.G_MAX_SWEETNESS, "G-Max Sweetness (N)", Type.GRASS, MoveCategory.PHYSICAL, 10, -1, 10, "A Grass-type attack that Gigantamax Appletun use. This move heals the status conditions of allies.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.G_MAX_SMITE, "G-Max Smite (N)", Type.FAIRY, MoveCategory.PHYSICAL, 10, -1, 10, "A Fairy-type attack that Gigantamax Hatterene use. This move confuses opponents.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.G_MAX_STEELSURGE, "G-Max Steelsurge (N)", Type.STEEL, MoveCategory.PHYSICAL, 10, -1, 10, "A Steel-type attack that Gigantamax Copperajah use. This move scatters sharp spikes around the field.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.G_MAX_MELTDOWN, "G-Max Meltdown (N)", Type.STEEL, MoveCategory.PHYSICAL, 10, -1, 10, "A Steel-type attack that Gigantamax Melmetal use. This move makes opponents incapable of using the same move twice in a row.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.G_MAX_FOAM_BURST, "G-Max Foam Burst (N)", Type.WATER, MoveCategory.PHYSICAL, 10, -1, 10, "A Water-type attack that Gigantamax Kingler use. This move harshly lowers the Speed of opponents.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.G_MAX_CENTIFERNO, "G-Max Centiferno (N)", Type.FIRE, MoveCategory.PHYSICAL, 10, -1, 10, "A Fire-type attack that Gigantamax Centiskorch use. This move traps opponents in flames for four to five turns.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.G_MAX_VINE_LASH, "G-Max Vine Lash (N)", Type.GRASS, MoveCategory.PHYSICAL, 10, -1, 10, "A Grass-type attack that Gigantamax Venusaur use. This move continues to deal damage to opponents for four turns.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.G_MAX_CANNONADE, "G-Max Cannonade (N)", Type.WATER, MoveCategory.PHYSICAL, 10, -1, 10, "A Water-type attack that Gigantamax Blastoise use. This move continues to deal damage to opponents for four turns.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.G_MAX_DRUM_SOLO, "G-Max Drum Solo (N)", Type.GRASS, MoveCategory.PHYSICAL, 10, -1, 10, "A Grass-type attack that Gigantamax Rillaboom use. This move can be used on the target regardless of its Abilities.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.G_MAX_FIREBALL, "G-Max Fireball (N)", Type.FIRE, MoveCategory.PHYSICAL, 10, -1, 10, "A Fire-type attack that Gigantamax Cinderace use. This move can be used on the target regardless of its Abilities.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.G_MAX_HYDROSNIPE, "G-Max Hydrosnipe (N)", Type.WATER, MoveCategory.PHYSICAL, 10, -1, 10, "A Water-type attack that Gigantamax Inteleon use. This move can be used on the target regardless of its Abilities.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.G_MAX_ONE_BLOW, "G-Max One Blow (N)", Type.DARK, MoveCategory.PHYSICAL, 10, -1, 10, "A Dark-type attack that Gigantamax Urshifu use. This single-strike move can ignore Max Guard.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.G_MAX_RAPID_FLOW, "G-Max Rapid Flow (N)", Type.WATER, MoveCategory.PHYSICAL, 10, -1, 10, "A Water-type attack that Gigantamax Urshifu use. This rapid-strike move can ignore Max Guard.", -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    End Unused */
    new AttackMove(Moves.TERA_BLAST, "Tera Blast (P)", Type.NORMAL, MoveCategory.SPECIAL, 80, 100, 10, "If the user has Terastallized, it unleashes energy of its Tera Type. This move inflicts damage using the Attack or Sp. Atk stat-whichever is higher for the user.", -1, 0, 9),
    new SelfStatusMove(Moves.SILK_TRAP, "Silk Trap (N)", Type.BUG, -1, 10, "The user spins a silken trap, protecting itself from damage while lowering the Speed stat of any attacker that makes direct contact.", -1, 4, 9),
    new AttackMove(Moves.AXE_KICK, "Axe Kick", Type.FIGHTING, MoveCategory.PHYSICAL, 120, 90, 10, "The user attacks by kicking up into the air and slamming its heel down upon the target. This may also confuse the target. If it misses, the user takes damage instead.", 30, 0, 9)
      .attr(MissEffectAttr, halveHpMissEffectFunc)
      .attr(ConfuseAttr),
    new AttackMove(Moves.LAST_RESPECTS, "Last Respects (P)", Type.GHOST, MoveCategory.PHYSICAL, 50, 100, 10, "The user attacks to avenge its allies. The more defeated allies there are in the user's party, the greater the move's power.", -1, 0, 9),
    new AttackMove(Moves.LUMINA_CRASH, "Lumina Crash", Type.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 10, "The user attacks by unleashing a peculiar light that even affects the mind. This also harshly lowers the target's Sp. Def stat.", 100, 0, 9)
      .attr(StatChangeAttr, BattleStat.SPDEF, -2),
    new AttackMove(Moves.ORDER_UP, "Order Up (P)", Type.DRAGON, MoveCategory.PHYSICAL, 80, 100, 10, "The user attacks with elegant poise. If the user has a Tatsugiri in its mouth, this move boosts one of the user's stats based on the Tatsugiri's form.", -1, 0, 9),
    new AttackMove(Moves.JET_PUNCH, "Jet Punch", Type.WATER, MoveCategory.PHYSICAL, 60, 100, 15, "The user summons a torrent around its fist and punches at blinding speed. This move always goes first.", -1, 1, 9)
      .punchingMove(),
    new StatusMove(Moves.SPICY_EXTRACT, "Spicy Extract", Type.GRASS, -1, 15, "The user emits an incredibly spicy extract, sharply boosting the target's Attack stat and harshly lowering the target's Defense stat.", 100, 0, 9)
      .attr(StatChangeAttr, BattleStat.ATK, 2)
      .attr(StatChangeAttr, BattleStat.DEF, -2),
    new AttackMove(Moves.SPIN_OUT, "Spin Out", Type.STEEL, MoveCategory.PHYSICAL, 100, 100, 5, "The user spins furiously by straining its legs, inflicting damage on the target. This also harshly lowers the user's Speed stat.", 100, 0, 9)
      .attr(StatChangeAttr, BattleStat.SPD, -2, true),
    new AttackMove(Moves.POPULATION_BOMB, "Population Bomb (P)", Type.NORMAL, MoveCategory.PHYSICAL, 20, 90, 10, "The user's fellows gather in droves to perform a combo attack that hits the target one to ten times in a row.", -1, 0, 9)
      .attr(MultiHitAttr, MultiHitType._1_TO_10)
      .slicingMove(),
    new AttackMove(Moves.ICE_SPINNER, "Ice Spinner", Type.ICE, MoveCategory.PHYSICAL, 80, 100, 15, "The user covers its feet in thin ice and twirls around, slamming into the target. This move's spinning motion also destroys the terrain.", -1, 0, 9)
      .attr(ClearTerrainAttr),
    new AttackMove(Moves.GLAIVE_RUSH, "Glaive Rush (P)", Type.DRAGON, MoveCategory.PHYSICAL, 120, 100, 5, "The user throws its entire body into a reckless charge. After this move is used, attacks on the user cannot miss and will inflict double damage until the user's next turn.", -1, 0, 9),
    new StatusMove(Moves.REVIVAL_BLESSING, "Revival Blessing (N)", Type.NORMAL, -1, 1, "The user bestows a loving blessing, reviving a party Pokémon that has fainted and restoring half that Pokémon's max HP.", -1, 0, 9),
    new AttackMove(Moves.SALT_CURE, "Salt Cure (P)", Type.ROCK, MoveCategory.PHYSICAL, 40, 100, 15, "The user salt cures the target, inflicting damage every turn. Steel and Water types are more strongly affected by this move.", -1, 0, 9),
    new AttackMove(Moves.TRIPLE_DIVE, "Triple Dive", Type.WATER, MoveCategory.PHYSICAL, 30, 95, 10, "The user performs a perfectly timed triple dive, hitting the target with splashes of water three times in a row.", -1, 0, 9)
      .attr(MultiHitAttr, MultiHitType._3),
    new AttackMove(Moves.MORTAL_SPIN, "Mortal Spin", Type.POISON, MoveCategory.PHYSICAL, 30, 100, 15, "The user performs a spin attack that can also eliminate the effects of such moves as Bind, Wrap, and Leech Seed. This also poisons opposing Pokémon.", 100, 0, 9)
      .attr(LapseBattlerTagAttr, [ BattlerTagType.BIND, BattlerTagType.WRAP, BattlerTagType.FIRE_SPIN, BattlerTagType.WHIRLPOOL, BattlerTagType.CLAMP, BattlerTagType.SAND_TOMB, BattlerTagType.MAGMA_STORM, BattlerTagType.THUNDER_CAGE, BattlerTagType.SEEDED ], true)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.DOODLE, "Doodle (N)", Type.NORMAL, 100, 10, "The user captures the very essence of the target in a sketch. This changes the Abilities of the user and its ally Pokémon to that of the target.", -1, 0, 9),
    new SelfStatusMove(Moves.FILLET_AWAY, "Fillet Away (N)", Type.NORMAL, -1, 10, "The user sharply boosts its Attack, Sp. Atk, and Speed stats by using its own HP.", -1, 0, 9),
    new AttackMove(Moves.KOWTOW_CLEAVE, "Kowtow Cleave", Type.DARK, MoveCategory.PHYSICAL, 85, -1, 10, "The user slashes at the target after kowtowing to make the target let down its guard. This attack never misses.", -1, 0, 9)
      .slicingMove(),
    new AttackMove(Moves.FLOWER_TRICK, "Flower Trick", Type.GRASS, MoveCategory.PHYSICAL, 70, -1, 10, "The user throws a rigged bouquet of flowers at the target. This attack never misses and always lands a critical hit.", 100, 0, 9)
      .attr(CritOnlyAttr),
    new AttackMove(Moves.TORCH_SONG, "Torch Song", Type.FIRE, MoveCategory.SPECIAL, 80, 100, 10, "The user blows out raging flames as if singing a song, scorching the target. This also boosts the user's Sp. Atk stat.", 100, 0, 9)
      .attr(StatChangeAttr, BattleStat.SPATK, 1, true)
      .soundBased(),
    new AttackMove(Moves.AQUA_STEP, "Aqua Step", Type.WATER, MoveCategory.PHYSICAL, 80, 100, 10, "The user toys with the target and attacks it using light and fluid dance steps. This also boosts the user's Speed stat.", 100, 0, 9)
      .attr(StatChangeAttr, BattleStat.SPD, 1, true)
      .danceMove(),
    new AttackMove(Moves.RAGING_BULL, "Raging Bull (P)", Type.NORMAL, MoveCategory.PHYSICAL, 90, 100, 10, "The user performs a tackle like a raging bull. This move's type depends on the user's form. It can also break barriers, such as Light Screen and Reflect.", -1, 0, 9),
    new AttackMove(Moves.MAKE_IT_RAIN, "Make It Rain (P)", Type.STEEL, MoveCategory.SPECIAL, 120, 100, 5, "The user attacks by throwing out a mass of coins. This also lowers the user's Sp. Atk stat. Money is earned after the battle.", -1, 0, 9)
      .attr(StatChangeAttr, BattleStat.SPATK, -1, true, null, true, true)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.PSYBLADE, "Psyblade (P)", Type.PSYCHIC, MoveCategory.PHYSICAL, 80, 100, 15, "The user rends the target with an ethereal blade. This move's power is boosted by 50 percent if the user is on Electric Terrain.", -1, 0, 9)
      .slicingMove(),
    new AttackMove(Moves.HYDRO_STEAM, "Hydro Steam (P)", Type.WATER, MoveCategory.SPECIAL, 80, 100, 15, "The user blasts the target with boiling-hot water. This move's power is not lowered in harsh sunlight but rather boosted by 50 percent.", -1, 0, 9),
    new AttackMove(Moves.RUINATION, "Ruination", Type.DARK, MoveCategory.SPECIAL, 1, 90, 10, "The user summons a ruinous disaster. This cuts the target's HP in half.", -1, 0, 9)
      .attr(TargetHalfHpDamageAttr),
    new AttackMove(Moves.COLLISION_COURSE, "Collision Course (P)", Type.FIGHTING, MoveCategory.PHYSICAL, 100, 100, 5, "The user transforms and crashes to the ground, causing a massive prehistoric explosion. This move's power is boosted more than usual if it's a supereffective hit.", -1, 0, 9),
    new AttackMove(Moves.ELECTRO_DRIFT, "Electro Drift (P)", Type.ELECTRIC, MoveCategory.SPECIAL, 100, 100, 5, "The user races forward at ultrafast speeds, piercing its target with futuristic electricity. This move's power is boosted more than usual if it's a supereffective hit.", -1, 0, 9),
    new SelfStatusMove(Moves.SHED_TAIL, "Shed Tail (N)", Type.NORMAL, -1, 10, "The user creates a substitute for itself using its own HP before switching places with a party Pokémon in waiting.", -1, 0, 9),
    new StatusMove(Moves.CHILLY_RECEPTION, "Chilly Reception", Type.ICE, -1, 10, "The user tells a chillingly bad joke before switching places with a party Pokémon in waiting. This summons a snowstorm lasting five turns.", -1, 0, 9)
      .attr(WeatherChangeAttr, WeatherType.HAIL) // Set to Hail for now, if Snow is added in the future, change this
      .attr(ForceSwitchOutAttr, true, false)
      .target(MoveTarget.BOTH_SIDES),
    new SelfStatusMove(Moves.TIDY_UP, "Tidy Up (P)", Type.NORMAL, -1, 10, "The user tidies up and removes the effects of Spikes, Stealth Rock, Sticky Web, Toxic Spikes, and Substitute. This also boosts the user's Attack and Speed stats.", 100, 0, 9)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.SPD ], 1, true),
    new StatusMove(Moves.SNOWSCAPE, "Snowscape", Type.ICE, -1, 10, "The user summons a snowstorm lasting five turns. This boosts the Defense stats of Ice types.", -1, 0, 9)
      .attr(WeatherChangeAttr, WeatherType.HAIL) // Set to Hail for now, if Snow is added in the future, change this
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.POUNCE, "Pounce", Type.BUG, MoveCategory.PHYSICAL, 50, 100, 20, "The user attacks by pouncing on the target. This also lowers the target's Speed stat.", 100, 0, 9)
      .attr(StatChangeAttr, BattleStat.SPD, -1),
    new AttackMove(Moves.TRAILBLAZE, "Trailblaze", Type.GRASS, MoveCategory.PHYSICAL, 50, 100, 20, "The user attacks suddenly as if leaping out from tall grass. The user's nimble footwork boosts its Speed stat.", 100, 0, 9)
      .attr(StatChangeAttr, BattleStat.SPD, 1, true),
    new AttackMove(Moves.CHILLING_WATER, "Chilling Water", Type.WATER, MoveCategory.SPECIAL, 50, 100, 20, "The user attacks the target by showering it with water that's so cold it saps the target's power. This also lowers the target's Attack stat.", -1, 0, 9)
      .attr(StatChangeAttr, BattleStat.ATK, -1),
    new AttackMove(Moves.HYPER_DRILL, "Hyper Drill", Type.NORMAL, MoveCategory.PHYSICAL, 100, 100, 5, "The user spins the pointed part of its body at high speed to pierce the target. This attack can hit a target using a move such as Protect or Detect.", -1, 0, 9)
      .ignoresProtect(),
    new AttackMove(Moves.TWIN_BEAM, "Twin Beam", Type.PSYCHIC, MoveCategory.SPECIAL, 40, 100, 10, "The user shoots mystical beams from its eyes to inflict damage. The target is hit twice in a row.", -1, 0, 9)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.RAGE_FIST, "Rage Fist", Type.GHOST, MoveCategory.PHYSICAL, 50, 100, 10, "The user converts its rage into energy to attack. The more times the user has been hit by attacks, the greater the move's power.", -1, 0, 9)
      .attr(HitCountPowerAttr)
      .punchingMove(),
    new AttackMove(Moves.ARMOR_CANNON, "Armor Cannon", Type.FIRE, MoveCategory.SPECIAL, 120, 100, 5, "The user shoots its own armor out as blazing projectiles. This also lowers the user's Defense and Sp. Def stats.", -1, 0, 9)
      .attr(StatChangeAttr, [ BattleStat.DEF, BattleStat.SPDEF ], -1, true),
    new AttackMove(Moves.BITTER_BLADE, "Bitter Blade", Type.FIRE, MoveCategory.PHYSICAL, 90, 100, 10, "The user focuses its bitter feelings toward the world of the living into a slashing attack. The user's HP is restored by up to half the damage taken by the target.", -1, 0, 9)
      .attr(HitHealAttr)
      .slicingMove(),
    new AttackMove(Moves.DOUBLE_SHOCK, "Double Shock (P)", Type.ELECTRIC, MoveCategory.PHYSICAL, 120, 100, 5, "The user discharges all the electricity from its body to perform a high-damage attack. After using this move, the user will no longer be Electric type.", -1, 0, 9),
    new AttackMove(Moves.GIGATON_HAMMER, "Gigaton Hammer (P)", Type.STEEL, MoveCategory.PHYSICAL, 160, 100, 5, "The user swings its whole body around to attack with its huge hammer. This move can't be used twice in a row.", -1, 0, 9),
    new AttackMove(Moves.COMEUPPANCE, "Comeuppance", Type.DARK, MoveCategory.PHYSICAL, 1, 100, 10, "The user retaliates with much greater force against the opponent that last inflicted damage on it.", -1, 0, 9)
      .attr(CounterDamageAttr, (move: Move) => move.category === MoveCategory.PHYSICAL)
      .attr(CounterDamageAttr, (move: Move) => move.category === MoveCategory.SPECIAL)
      .target(MoveTarget.ATTACKER),
    new AttackMove(Moves.AQUA_CUTTER, "Aqua Cutter", Type.WATER, MoveCategory.PHYSICAL, 70, 100, 20, "The user expels pressurized water to cut at the target like a blade. This move has a heightened chance of landing a critical hit.", -1, 0, 9)
      .attr(HighCritAttr)
      .slicingMove(),
    new AttackMove(Moves.BLAZING_TORQUE, "Blazing Torque", Type.FIRE, MoveCategory.PHYSICAL, 80, 100, 10, "The user revs their blazing engine into the target. This may also leave the target with a burn.", 30, 0, 9)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.WICKED_TORQUE, "Wicked Torque", Type.DARK, MoveCategory.PHYSICAL, 80, 100, 10, "The user revs their engine into the target with malicious intent. This may put the target to sleep.", 10, 0, 9)
      .attr(StatusEffectAttr, StatusEffect.SLEEP),
    new AttackMove(Moves.NOXIOUS_TORQUE, "Noxious Torque", Type.POISON, MoveCategory.PHYSICAL, 100, 100, 10, "The user revs their poisonous engine into the target. This may also poison the target.", 30, 0, 9)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(Moves.COMBAT_TORQUE, "Combat Torque", Type.FIGHTING, MoveCategory.PHYSICAL, 100, 100, 10, "The user revs their engine forcefully into the target. This may also leave the target with paralysis.", 30, 0, 9)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.MAGICAL_TORQUE, "Magical Torque", Type.FAIRY, MoveCategory.PHYSICAL, 100, 100, 10, "The user revs their fae-like engine into the target. This may also confuse the target.", 30, 0, 9)
      .attr(ConfuseAttr),
    new AttackMove(Moves.BLOOD_MOON, "Blood Moon (P)", Type.NORMAL, MoveCategory.SPECIAL, 140, 100, 5, "The user unleashes the full brunt of its spirit from a full moon that shines as red as blood. This move can't be used twice in a row.", -1, 0, 9),
    new AttackMove(Moves.MATCHA_GOTCHA, "Matcha Gotcha", Type.GRASS, MoveCategory.SPECIAL, 80, 90, 15, "The user fires a blast of tea that it mixed. The user's HP is restored by up to half the damage taken by the target. This may also leave the target with a burn.", 20, 0, 9)
      .attr(HitHealAttr)
      .attr(HealStatusEffectAttr, false, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.SYRUP_BOMB, "Syrup Bomb (P)", Type.GRASS, MoveCategory.SPECIAL, 60, 85, 10, "The user sets off an explosion of sticky candy syrup, which coats the target and causes the target's Speed stat to drop each turn for three turns.", -1, 0, 9)
      .attr(StatChangeAttr, BattleStat.SPD, -1) //Temporary
      .ballBombMove(),
    new AttackMove(Moves.IVY_CUDGEL, "Ivy Cudgel (P)", Type.GRASS, MoveCategory.PHYSICAL, 100, 100, 10, "The user strikes with an ivy-wrapped cudgel. This move's type changes depending on the mask worn by the user, and it has a heightened chance of landing a critical hit.", -1, 0, 9)
      .attr(HighCritAttr),
    new AttackMove(Moves.ELECTRO_SHOT, "Electro Shot", Type.ELECTRIC, MoveCategory.SPECIAL, 130, 100, 10, "The user gathers electricity on the first turn, boosting its Sp. Atk stat, then fires a high-voltage shot on the next turn. The shot will be fired immediately in rain.", 100, 0, 9)
      .attr(ElectroShotChargeAttr)
      .attr(StatChangeAttr, BattleStat.SPATK, 1, true)
      .ignoresVirtual(),
    new AttackMove(Moves.TERA_STARSTORM, "Tera Starstorm (P)", Type.NORMAL, MoveCategory.SPECIAL, 120, 100, 5, "With the power of its crystals, the user bombards and eliminates the target. When used by Terapagos in its Stellar Form, this move damages all opposing Pokémon.", -1, 0, 9),
    new AttackMove(Moves.FICKLE_BEAM, "Fickle Beam (P)", Type.DRAGON, MoveCategory.SPECIAL, 80, 100, 5, "The user shoots a beam of light to inflict damage. Sometimes all the user's heads shoot beams in unison, doubling the move's power.", -1, 0, 9),
    new StatusMove(Moves.BURNING_BULWARK, "Burning Bulwark", Type.FIRE, -1, 10, "The user's intensely hot fur protects it from attacks and also burns any attacker that makes direct contact with it.", 100, 4, 9)
      .attr(ProtectAttr, BattlerTagType.BURNING_BULWARK),
    new AttackMove(Moves.THUNDERCLAP, "Thunderclap (P)", Type.ELECTRIC, MoveCategory.SPECIAL, 70, 100, 5, "This move enables the user to attack first with a jolt of electricity. This move fails if the target is not readying an attack.", -1, 1, 9),
    new AttackMove(Moves.MIGHTY_CLEAVE, "Mighty Cleave", Type.ROCK, MoveCategory.PHYSICAL, 95, 100, 5, "The user wields the light that has accumulated atop its head to cleave the target. This move hits even if the target protects itself.", -1, 0, 9)
      .ignoresProtect(),
    new AttackMove(Moves.TACHYON_CUTTER, "Tachyon Cutter", Type.STEEL, MoveCategory.SPECIAL, 50, -1, 10, "The user attacks by launching particle blades at the target twice in a row. This attack never misses.", -1, 0, 9)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.HARD_PRESS, "Hard Press", Type.STEEL, MoveCategory.PHYSICAL, 100, 100, 5, "The target is crushed with an arm, a claw, or the like to inflict damage. The more HP the target has left, the greater the move's power.", -1, 0, 9)
      .attr(OpponentHighHpPowerAttr),
    new StatusMove(Moves.DRAGON_CHEER, "Dragon Cheer (P)", Type.DRAGON, -1, 15, "The user raises its allies' morale with a draconic cry so that their future attacks have a heightened chance of landing critical hits. This rouses Dragon types more.", 100, 0, 9)
      .attr(AddBattlerTagAttr, BattlerTagType.CRIT_BOOST, false, true)
      .target(MoveTarget.NEAR_ALLY),
    new AttackMove(Moves.ALLURING_VOICE, "Alluring Voice (P)", Type.FAIRY, MoveCategory.SPECIAL, 80, 100, 10, "The user attacks the target using its angelic voice. This also confuses the target if its stats have been boosted during the turn.", -1, 0, 9),
    new AttackMove(Moves.TEMPER_FLARE, "Temper Flare (P)", Type.FIRE, MoveCategory.PHYSICAL, 75, 100, 10, "Spurred by desperation, the user attacks the target. This move's power is doubled if the user's previous move failed.", -1, 0, 9),
    new AttackMove(Moves.SUPERCELL_SLAM, "Supercell Slam", Type.ELECTRIC, MoveCategory.PHYSICAL, 100, 95, 15, "The user electrifies its body and drops onto the target to inflict damage. If this move misses, the user takes damage instead.", -1, 0, 9)
      .attr(MissEffectAttr, halveHpMissEffectFunc),
    new AttackMove(Moves.PSYCHIC_NOISE, "Psychic Noise (P)", Type.PSYCHIC, MoveCategory.SPECIAL, 75, 100, 10, "The user attacks the target with unpleasant sound waves. For two turns, the target is prevented from recovering HP through moves, Abilities, or held items.", -1, 0, 9)
      .soundBased(),
    new AttackMove(Moves.UPPER_HAND, "Upper Hand (P)", Type.FIGHTING, MoveCategory.PHYSICAL, 65, 100, 15, "The user reacts to the target's movement and strikes with the heel of its palm, making the target flinch. This move fails if the target is not readying a priority move.", -1, 0, 9),
    new AttackMove(Moves.MALIGNANT_CHAIN, "Malignant Chain", Type.POISON, MoveCategory.SPECIAL, 100, 100, 5, "The user pours toxins into the target by wrapping them in a toxic, corrosive chain. This may also leave the target badly poisoned.", 50, 0, 9)
      .attr(StatusEffectAttr, StatusEffect.TOXIC)
  );
}