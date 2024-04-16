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
import { UnswappableAbilityAbAttr, UncopiableAbilityAbAttr, UnsuppressableAbilityAbAttr, NoTransformAbilityAbAttr, BlockRecoilDamageAttr, BlockOneHitKOAbAttr, IgnoreContactAbAttr, MaxMultiHitAbAttr, applyAbAttrs, BlockNonDirectDamageAbAttr, applyPreSwitchOutAbAttrs, PreSwitchOutAbAttr, applyPostDefendAbAttrs, PostDefendContactApplyStatusEffectAbAttr } from "./ability";
import { Abilities } from "./enums/abilities";
import { allAbilities } from './ability';
import { PokemonHeldItemModifier } from "../modifier/modifier";
import { BattlerIndex } from "../battle";
import { Stat } from "./pokemon-stat";
import { TerrainType } from "./terrain";
import { SpeciesFormChangeActiveTrigger } from "./pokemon-forms";
import { Species } from "./enums/species";
import { ModifierPoolType } from "#app/modifier/modifier-type";
import { Command } from "../ui/command-ui-handler";
import { Biome } from "./enums/biome";
import i18next from '../plugins/i18n';

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
  WIND_MOVE = 8192,
  TRIAGE_MOVE = 16384
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

  findAttr(attrPredicate: (attr: MoveAttr) => boolean): MoveAttr {
    return this.attrs.find(attrPredicate);
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

  isMultiTarget(): boolean {
    switch (this.moveTarget) {
      case MoveTarget.ALL_OTHERS:
      case MoveTarget.ALL_NEAR_OTHERS:
      case MoveTarget.ALL_NEAR_ENEMIES:
      case MoveTarget.ALL_ENEMIES:
      case MoveTarget.USER_AND_ALLIES:
      case MoveTarget.ALL:
      case MoveTarget.USER_SIDE:
      case MoveTarget.ENEMY_SIDE:
      case MoveTarget.BOTH_SIDES:
        return true;
    }
    return false;
  }

  isTypeImmune(type: Type): boolean {
    switch (type) {
      case Type.GRASS:
        if (this.hasFlag(MoveFlags.POWDER_MOVE))
          return true;
        break;
    }
    return false;
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

  triageMove(triageMove?: boolean): this {
    this.setFlag(MoveFlags.TRIAGE_MOVE, triageMove);
    return this;
  }

  checkFlag(flag: MoveFlags, user: Pokemon, target: Pokemon): boolean {
    switch (flag) {
      case MoveFlags.MAKES_CONTACT:
        if (user.hasAbilityWithAttr(IgnoreContactAbAttr))
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
    if (message) {
      user.scene.queueMessage(message, 500);
      return true;
    }
    return false;
  }
}

export class StatusMoveTypeImmunityAttr extends MoveAttr {
  public immuneType: Type;

  constructor(immuneType: Type) {
    super(false);

    this.immuneType = immuneType;
  }
}

export class IgnoreOpponentStatChangesAttr extends MoveAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    (args[0] as Utils.IntegerHolder).value = 0;

    return true;
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

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    return target.getHpRatio() > 0.5 ? Math.floor(((target.getHpRatio() - 0.5) * -24) + 4) : -20;
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
  private multiplier: number;

  constructor(moveFilter: MoveFilter, multiplier: integer) {
    super(0);

    this.moveFilter = moveFilter;
    this.multiplier = multiplier;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const damage = user.turnData.attacksReceived.filter(ar => this.moveFilter(allMoves[ar.move])).reduce((total: integer, ar: AttackMoveResult) => total + ar.damage, 0);
    (args[0] as Utils.IntegerHolder).value = Math.floor(Math.max(damage * this.multiplier, 1));

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

export class ModifiedDamageAttr extends MoveAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const initialDamage = args[0] as Utils.IntegerHolder;
    initialDamage.value = this.getModifiedDamage(user, target, move, initialDamage.value);

    return true;
  }

  getModifiedDamage(user: Pokemon, target: Pokemon, move: Move, damage: integer): integer {
    return damage;
  }
}

export class SurviveDamageAttr extends ModifiedDamageAttr {
  getModifiedDamage(user: Pokemon, target: Pokemon, move: Move, damage: number): number {
    return Math.min(damage, target.hp - 1);
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => target.hp > 1;
  }
  
  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    return target.hp > 1 ? 0 : -20;
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

    const recoilDamage = Math.max(Math.floor((!this.useHp ? user.turnData.damageDealt : user.getMaxHp()) * this.damageRatio),
      !this.useHp && user.turnData.damageDealt ? 1 : 0);
    if (!recoilDamage)
      return false;

    applyAbAttrs(BlockNonDirectDamageAbAttr, user, cancelled);
    if (cancelled.value)
      return false;
      
    user.damageAndUpdate(recoilDamage, HitResult.OTHER, false, true, true);
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
    if (user.isBoss())
      return -20;
    return Math.ceil(((1 - user.getHpRatio()) * 10 - 10) * (target.getAttackTypeEffectiveness(move.type) - 0.5));
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
    let score = ((1 - (this.selfTarget ? user : target).getHpRatio()) * 20) - this.healRatio * 10;
    return Math.round(score / (1 - this.healRatio / 2));
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
      case WeatherType.SNOW:
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

export class StrengthSapHealAttr extends MoveEffectAttr {
  constructor() {
    super(true, MoveEffectTrigger.HIT);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    user.scene.unshiftPhase(new PokemonHealPhase(user.scene, user.getBattlerIndex(),
      target.stats[Stat.ATK] * (Math.max(2, 2 + target.summonData.battleStats[BattleStat.ATK]) / Math.max(2, 2 - target.summonData.battleStats[BattleStat.ATK])),
      getPokemonMessage(user, ` regained\nhealth!`), false, true));
    return true;
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

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    return -5;
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
        return pokemon.trySetStatus(this.effect, true, this.cureTurn);
    }
    return false;
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    return !(this.selfTarget ? user : target).status && (this.selfTarget ? user : target).canSetStatus(this.effect, true) ? Math.floor(move.chance * -0.1) : 0;
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
        const poolType = target.isPlayer() ? ModifierPoolType.PLAYER : target.hasTrainer() ? ModifierPoolType.TRAINER : ModifierPoolType.WILD;
        const highestItemTier = heldItems.map(m => m.type.getOrInferTier(poolType)).reduce((highestTier, tier) => Math.max(tier, highestTier), 0);
        const tierHeldItems = heldItems.filter(m => m.type.getOrInferTier(poolType) === highestItemTier);
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
        const poolType = target.isPlayer() ? ModifierPoolType.PLAYER : target.hasTrainer() ? ModifierPoolType.TRAINER : ModifierPoolType.WILD;
        const highestItemTier = heldItems.map(m => m.type.getOrInferTier(poolType)).reduce((highestTier, tier) => Math.max(tier, highestTier), 0);
        const tierHeldItems = heldItems.filter(m => m.type.getOrInferTier(poolType) === highestItemTier);
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
    if (pokemon.status && this.effects.includes(pokemon.status.effect)) {
      pokemon.scene.queueMessage(getPokemonMessage(pokemon, getStatusEffectHealText(pokemon.status.effect)));
      pokemon.resetStatus();
      pokemon.updateInfo();
      
      return true;
    }

    return false;
  }

  isOfEffect(effect: StatusEffect): boolean {
    return this.effects.includes(effect);
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
      return !cancelled.value && user.level >= target.level;
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
      if (!lastMove || lastMove.move !== move.id || (lastMove.result !== MoveResult.OTHER && (this.sameTurn || lastMove.turn !== user.scene.currentBattle.turn))) {
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
    let ret = 0;
    let moveLevels = this.getLevels(user);
    for (let stat of this.stats) {
      let levels = moveLevels;
      if (levels > 0)
        levels = Math.min(target.summonData.battleStats[stat] + levels, 6) - target.summonData.battleStats[stat];
      else
        levels = Math.max(target.summonData.battleStats[stat] + levels, -6) - target.summonData.battleStats[stat];
      let noEffect = false;
      switch (stat) {
        case BattleStat.ATK:
          if (this.selfTarget)
            noEffect = !user.getMoveset().find(m => m instanceof AttackMove && m.category === MoveCategory.PHYSICAL);
          break;
        case BattleStat.DEF:
          if (!this.selfTarget)
            noEffect = !user.getMoveset().find(m => m instanceof AttackMove && m.category === MoveCategory.PHYSICAL);
          break;
        case BattleStat.SPATK:
          if (this.selfTarget)
            noEffect = !user.getMoveset().find(m => m instanceof AttackMove && m.category === MoveCategory.SPECIAL);
          break;
        case BattleStat.SPDEF:
          if (!this.selfTarget)
            noEffect = !user.getMoveset().find(m => m instanceof AttackMove && m.category === MoveCategory.SPECIAL);
          break;
      }
      if (noEffect)
        continue;
      ret += (levels * 4) + (levels > 0 ? -2 : 2);
    }
    return ret;
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
      const damage = user.damageAndUpdate(Math.floor(user.getMaxHp() / 2), HitResult.OTHER, false, true);
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

  // TODO: Add benefit score that considers HP cut
}

export class CutHpStatBoostAttr extends StatChangeAttr {
  private cutRatio: integer;

  constructor(stat: BattleStat | BattleStat[], levels: integer, cutRatio: integer) {
    super(stat, levels, true, null, true);

    this.cutRatio = cutRatio;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      const damage = user.damageAndUpdate(Math.floor(user.getMaxHp() / this.cutRatio), HitResult.OTHER, false, true);
      if (damage)
        user.scene.damageNumberHandler.add(user, damage);
      user.updateInfo().then(() => {
        const ret = super.apply(user, target, move, args);
        resolve(ret);
      });
    });
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => user.getHpRatio() > 1 / this.cutRatio;
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

const doublePowerChanceMessageFunc = (user: Pokemon, target: Pokemon, move: Move) => {
  let message: string = null;
  user.scene.executeWithSeedOffset(() => {
    let rand = Utils.randSeedInt(100);
    if (rand < move.chance)
      message = getPokemonMessage(user, ' is going all out for this attack!');
  }, user.scene.currentBattle.turn << 6, user.scene.waveSeed);
  return message;
};

export class DoublePowerChanceAttr extends VariablePowerAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    let rand: integer;
    user.scene.executeWithSeedOffset(() => rand = Utils.randSeedInt(100), user.scene.currentBattle.turn << 6, user.scene.waveSeed);
    if (rand < move.chance) {
      const power = args[0] as Utils.NumberHolder;
      power.value *= 2;
      return true;
    }

    return false;
  }
}

export abstract class ConsecutiveUsePowerMultiplierAttr extends MovePowerMultiplierAttr {
  constructor(limit: integer, resetOnFail: boolean, resetOnLimit?: boolean, ...comboMoves: Moves[]) {
    super((user: Pokemon, target: Pokemon, move: Move): number => {
      const moveHistory = user.getMoveHistory().reverse().slice(1);

      let count = 0;
      let turnMove: TurnMove;

      while (((turnMove = moveHistory.shift())?.move === move.id || (comboMoves.length && comboMoves.includes(turnMove?.move))) && (!resetOnFail || turnMove.result === MoveResult.SUCCESS)) {
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
      case (hpRatio < 0.0417):
        power.value = 200;
        break;
      case (hpRatio < 0.1042):
        power.value = 150;
        break;
      case (hpRatio < 0.2083):
        power.value = 100;
        break;
      case (hpRatio < 0.3542):
        power.value = 80;
        break;
      case (hpRatio < 0.6875):
        power.value = 40;
        break;
      default:
        power.value = 20;
        break;
    }

    return true;
  }
}

export class CompareWeightPowerAttr extends VariablePowerAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const power = args[0] as Utils.NumberHolder;
    const userWeight = user.getWeight();
    const targetWeight = target.getWeight();

    if (!userWeight || userWeight === 0)
      return false;
    
    const relativeWeight = (targetWeight / userWeight) * 100;

    switch (true) {
      case (relativeWeight < 20.01):
        power.value = 120;
        break;
      case (relativeWeight < 25.01):
        power.value = 100;
        break;
      case (relativeWeight < 33.35):
        power.value = 80;
        break;
      case (relativeWeight < 50.01):
        power.value = 60;
        break;
      default:
        power.value = 40;
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
  }, user.scene.currentBattle.turn << 6, user.scene.waveSeed);
  return message;
};

export class MagnitudePowerAttr extends VariablePowerAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const power = args[0] as Utils.NumberHolder;

    const magnitudeThresholds = [ 5, 15, 35, 65, 75, 95 ];
    const magnitudePowers = [ 10, 30, 50, 70, 90, 100, 110, 150 ];

    let rand: integer;
    
    user.scene.executeWithSeedOffset(() => rand = Utils.randSeedInt(100), user.scene.currentBattle.turn << 6, user.scene.waveSeed);

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
        case WeatherType.SNOW:
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

export class StatChangeCountPowerAttr extends VariablePowerAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const positiveStats: number = user.summonData.battleStats.reduce((total, stat) => stat > 0 && stat ? total + stat : total, 0);

    (args[0] as Utils.NumberHolder).value += positiveStats * 20;

    return true;
  }
}

export class PresentPowerAttr extends VariablePowerAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {

    const powerSeed = Utils.randSeedInt(100);
    if (powerSeed <= 40) {
      (args[0] as Utils.NumberHolder).value = 40;
    }
    else if (40 < powerSeed && powerSeed <= 70) {
      (args[0] as Utils.NumberHolder).value = 80;
    }
    else if (70 < powerSeed && powerSeed <= 80) {
      (args[0] as Utils.NumberHolder).value = 120;
    }
    else if (80 < powerSeed && powerSeed <= 100) {
      target.scene.unshiftPhase(new PokemonHealPhase(target.scene, target.getBattlerIndex(),
      Math.max(Math.floor(target.getMaxHp() / 4), 1), getPokemonMessage(target, ' regained\nhealth!'), true));
    }

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

export class TargetAtkUserAtkAttr extends VariableAtkAttr {
  constructor(){
    super();
  }
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    (args[0] as Utils.IntegerHolder).value = target.getBattleStat(Stat.ATK, target);
    return true;
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

export class ToxicAccuracyAttr extends VariableAccuracyAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
      if (user.isOfType(Type.POISON)) {
        const accuracy = args[0] as Utils.NumberHolder;
        accuracy.value = -1;
        return true;
      }

    return false;
  }
}

export class BlizzardAccuracyAttr extends VariableAccuracyAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!user.scene.arena.weather?.isEffectSuppressed(user.scene)) {
      const accuracy = args[0] as Utils.NumberHolder;
      const weatherType = user.scene.arena.weather?.weatherType || WeatherType.NONE;
      if (weatherType === WeatherType.HAIL || weatherType === WeatherType.SNOW) {
        accuracy.value = -1;
        return true;
      }
    }

    return false;
  }
}

export class VariableMoveCategoryAttr extends MoveAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    return false;
  }
}

export class PhotonGeyserCategoryAttr extends VariableMoveCategoryAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const category = (args[0] as Utils.IntegerHolder);

    if (user.getBattleStat(Stat.ATK, target, move) > user.getBattleStat(Stat.SPATK, target, move)) {
      category.value = MoveCategory.PHYSICAL;
      return true;
    }

    return false;
  }
}

export class TeraBlastCategoryAttr extends VariableMoveCategoryAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const category = (args[0] as Utils.IntegerHolder);

    if (user.isTerastallized() && user.getBattleStat(Stat.ATK, target, move) > user.getBattleStat(Stat.SPATK, target, move)) {
      category.value = MoveCategory.PHYSICAL;
      return true;
    }

    return false;
  }
}

export class ShellSideArmCategoryAttr extends VariableMoveCategoryAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const category = (args[0] as Utils.IntegerHolder);
    const atkRatio = user.getBattleStat(Stat.ATK, target, move) / target.getBattleStat(Stat.DEF, user, move);
    const specialRatio = user.getBattleStat(Stat.SPATK, target, move) / target.getBattleStat(Stat.SPDEF, user, move);

    // Shell Side Arm is much more complicated than it looks, this is a partial implementation to try to achieve something similar to the games
    if (atkRatio > specialRatio) {
      category.value = MoveCategory.PHYSICAL;
      return true;
    } else if (atkRatio === specialRatio && user.randSeedInt(2) === 0) {
      category.value = MoveCategory.PHYSICAL;
      return true;
    }

    return false;
  }
}

export class VariableMoveTypeAttr extends MoveAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    return false;
  }
}

export class AuraWheelTypeAttr extends VariableMoveTypeAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if ([user.species.speciesId, user.fusionSpecies?.speciesId].includes(Species.MORPEKO)) {
      const form = user.species.speciesId === Species.MORPEKO ? user.formIndex : user.fusionSpecies.formIndex;
      const type = (args[0] as Utils.IntegerHolder);

      switch (form) {
        case 1: // Hangry Mode
          type.value = Type.DARK;
          break;
        default: // Full Belly Mode
          type.value = Type.ELECTRIC;
          break;
      }
      return true;
    }

    return false;
  }
}

export class RagingBullTypeAttr extends VariableMoveTypeAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if ([user.species.speciesId, user.fusionSpecies?.speciesId].includes(Species.PALDEA_TAUROS)) {
      const form = user.species.speciesId === Species.PALDEA_TAUROS ? user.formIndex : user.fusionSpecies.formIndex;
      const type = (args[0] as Utils.IntegerHolder);

      switch (form) {
        case 1: // Blaze breed
          type.value = Type.FIRE;
          break;
        case 2: // Aqua breed
          type.value = Type.WATER;
          break;
        default:
          type.value = Type.FIGHTING;
          break;
      }
      return true;
    }

    return false;
  }
}

export class IvyCudgelTypeAttr extends VariableMoveTypeAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if ([user.species.speciesId, user.fusionSpecies?.speciesId].includes(Species.OGERPON)) {
      const form = user.species.speciesId === Species.OGERPON ? user.formIndex : user.fusionSpecies.formIndex;
      const type = (args[0] as Utils.IntegerHolder);

      switch (form) {
        case 1: // Wellspring Mask
          type.value = Type.WATER;
          break;
        case 2: // Hearthflame Mask
          type.value = Type.FIRE;
          break;
        case 3: // Cornerstone Mask
          type.value = Type.ROCK;
          break;
        case 4: // Teal Mask Tera
          type.value = Type.GRASS;
          break;
        case 5: // Wellspring Mask Tera
          type.value = Type.WATER;
          break;
        case 6: // Hearthflame Mask Tera
          type.value = Type.FIRE;
          break;
        case 7: // Cornerstone Mask Tera
          type.value = Type.ROCK;
          break;
        default:
          type.value = Type.GRASS;
          break;
      }
      return true;
    }

    return false;
  }
}

export class WeatherBallTypeAttr extends VariableMoveTypeAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!user.scene.arena.weather?.isEffectSuppressed(user.scene)) {
      const type = (args[0] as Utils.IntegerHolder);

      switch (user.scene.arena.weather?.weatherType) {
        case WeatherType.SUNNY:
        case WeatherType.HARSH_SUN:
          type.value = Type.FIRE;
          break;
        case WeatherType.RAIN:
        case WeatherType.HEAVY_RAIN:
          type.value = Type.WATER;
          break;
        case WeatherType.SANDSTORM:
          type.value = Type.ROCK;
          break;
        case WeatherType.HAIL:
        case WeatherType.SNOW:
          type.value = Type.ICE;
          break;
        default:
          return false;
      }
      return true;
    }

    return false;
  }
}

export class HiddenPowerTypeAttr extends VariableMoveTypeAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const type = (args[0] as Utils.IntegerHolder);

    const iv_val = Math.floor(((user.ivs[Stat.HP] & 1)
      +(user.ivs[Stat.ATK] & 1) * 2
      +(user.ivs[Stat.DEF] & 1) * 4
      +(user.ivs[Stat.SPD] & 1) * 8
      +(user.ivs[Stat.SPATK] & 1) * 16
      +(user.ivs[Stat.SPDEF] & 1) * 32) * 15/63);
    
    type.value = [
      Type.FIGHTING, Type.FLYING, Type.POISON, Type.GROUND,
      Type.ROCK, Type.BUG, Type.GHOST, Type.STEEL,
      Type.FIRE, Type.WATER, Type.GRASS, Type.ELECTRIC,
      Type.PSYCHIC, Type.ICE, Type.DRAGON, Type.DARK][iv_val];

    return true;
  }
}

export class VariableMoveTypeMultiplierAttr extends MoveAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    return false;
  }
}

export class NeutralDamageAgainstFlyingTypeMultiplierAttr extends VariableMoveTypeMultiplierAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!target.getTag(BattlerTagType.IGNORE_FLYING)) {
      const multiplier = args[0] as Utils.NumberHolder;
      //When a flying type is hit, the first hit is always 1x multiplier. Levitating pokemon are instantly affected by typing
      if (target.isOfType(Type.FLYING))
        multiplier.value = 1;
      target.addTag(BattlerTagType.IGNORE_FLYING, 20, move.id, user.id); //TODO: Grounded effect should not have turn limit
      return true;
    }

    return false;
  }
}

export class WaterSuperEffectTypeMultiplierAttr extends VariableMoveTypeMultiplierAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const multiplier = args[0] as Utils.NumberHolder;
    if (target.isOfType(Type.WATER)) {
      multiplier.value *= 4; // Increased twice because initial reduction against water
      return true;
    }

    return false;
  }
}

export class OneHitKOAccuracyAttr extends MoveAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const accuracy = args[0] as Utils.NumberHolder;
    accuracy.value = 30 + 70 * Math.min(target.level / user.level, 0.5) * 2;
    return true;
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

export class NoEffectAttr extends MoveAttr {
  private noEffectFunc: UserMoveConditionFunc;

  constructor(noEffectFunc: UserMoveConditionFunc) {
    super();

    this.noEffectFunc = noEffectFunc;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    this.noEffectFunc(user, move);
    return true;
  }
}

const crashDamageFunc = (user: Pokemon, move: Move) => {
  const cancelled = new Utils.BooleanHolder(false);
  applyAbAttrs(BlockNonDirectDamageAbAttr, user, cancelled);
  if (cancelled.value)
    return false;
  
  user.damageAndUpdate(Math.floor(user.getMaxHp() / 2), HitResult.OTHER, false, true);
  user.scene.queueMessage(getPokemonMessage(user, ' kept going\nand crashed!'));
  
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
    if (chance < 0 || chance === 100 || user.randSeedInt(100) < chance)
      return (this.selfTarget ? user : target).addTag(this.tagType,  user.randSeedInt(this.turnCountMax - this.turnCountMin, this.turnCountMin), move.id, user.id);

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
      case BattlerTagType.PERISH_SONG:
        return -16;
      case BattlerTagType.FLINCHED:
      case BattlerTagType.CONFUSED:
      case BattlerTagType.INFATUATED:
      case BattlerTagType.NIGHTMARE:
      case BattlerTagType.DROWSY:
      case BattlerTagType.NO_CRIT:
          return -5;
      case BattlerTagType.SEEDED:
      case BattlerTagType.SALT_CURED:
      case BattlerTagType.FRENZY:
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
      case BattlerTagType.ENCORE:
        return -2;
      case BattlerTagType.INGRAIN:
      case BattlerTagType.IGNORE_ACCURACY:
      case BattlerTagType.AQUA_RING:
        return 3;
      case BattlerTagType.PROTECTED:
      case BattlerTagType.FLYING:
      case BattlerTagType.CRIT_BOOST:
      case BattlerTagType.ALWAYS_CRIT:
        return 5;
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

      while (moveHistory.length) {
        turnMove = moveHistory.shift();
        if(!allMoves[turnMove.move].getAttrs(ProtectAttr).length || turnMove.result !== MoveResult.SUCCESS)
          break;
        timesUsed++;
      }
      if (timesUsed)
        return !user.randSeedInt(Math.pow(3, timesUsed));
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

export class AlwaysCritsAttr extends AddBattlerTagAttr {
  constructor() {
    super(BattlerTagType.ALWAYS_CRIT, true, false, 2);
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
  private selfSideTarget: boolean;

  constructor(tagType: ArenaTagType, turnCount?: integer, failOnOverlap: boolean = false, selfSideTarget: boolean = false) {
    super(true, MoveEffectTrigger.POST_APPLY, true);

    this.tagType = tagType;
    this.turnCount = turnCount;
    this.failOnOverlap = failOnOverlap;
    this.selfSideTarget = selfSideTarget;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    if (move.chance < 0 || move.chance === 100 || user.randSeedInt(100) < move.chance) {
      user.scene.arena.addTag(this.tagType, this.turnCount, move.id, user.id, (this.selfSideTarget ? user : target).isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY);
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

export class RemoveScreensAttr extends MoveEffectAttr {

  private targetBothSides: boolean;

  constructor(targetBothSides: boolean = false) {
    super(true, MoveEffectTrigger.PRE_APPLY);
    this.targetBothSides = targetBothSides;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {

    if (!super.apply(user, target, move, args))
      return false;

    if(this.targetBothSides){
      user.scene.arena.removeTagOnSide(ArenaTagType.REFLECT, ArenaTagSide.PLAYER);
      user.scene.arena.removeTagOnSide(ArenaTagType.LIGHT_SCREEN, ArenaTagSide.PLAYER);
      user.scene.arena.removeTagOnSide(ArenaTagType.AURORA_VEIL, ArenaTagSide.PLAYER);

      user.scene.arena.removeTagOnSide(ArenaTagType.REFLECT, ArenaTagSide.ENEMY);
      user.scene.arena.removeTagOnSide(ArenaTagType.LIGHT_SCREEN, ArenaTagSide.ENEMY);
      user.scene.arena.removeTagOnSide(ArenaTagType.AURORA_VEIL, ArenaTagSide.ENEMY);
    }
    else{
      user.scene.arena.removeTagOnSide(ArenaTagType.REFLECT, target.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY);
      user.scene.arena.removeTagOnSide(ArenaTagType.LIGHT_SCREEN, target.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY);
      user.scene.arena.removeTagOnSide(ArenaTagType.AURORA_VEIL, target.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY);
    }

    return true;

  }
}

export class ForceSwitchOutAttr extends MoveEffectAttr {
  private user: boolean;
  private batonPass: boolean;
  
  constructor(user?: boolean, batonPass?: boolean) {
    super(false, MoveEffectTrigger.HIT, true);
    this.user = !!user;
    this.batonPass = !!batonPass;
  }
  
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): Promise<boolean> {
    return new Promise(resolve => {
  	// Check if the move category is not STATUS or if the switch out condition is not met
    if (move.category !== MoveCategory.STATUS && !this.getSwitchOutCondition()(user, target, move)) {
  	  //Apply effects before switch out i.e. poison point, flame body, etc
      applyPostDefendAbAttrs(PostDefendContactApplyStatusEffectAbAttr, target, user, new PokemonMove(move.id), null);
      return resolve(false);
    }
  
  	// Move the switch out logic inside the conditional block
  	// This ensures that the switch out only happens when the conditions are met
	  const switchOutTarget = this.user ? user : target;
	  if (switchOutTarget instanceof PlayerPokemon) { 
	  	if (switchOutTarget.hp) {
	  	  applyPreSwitchOutAbAttrs(PreSwitchOutAbAttr, switchOutTarget);
	  	  (switchOutTarget as PlayerPokemon).switchOut(this.batonPass, true).then(() => resolve(true));
	  	}
	  	else {
	  	  resolve(false);
	  	}
	  	return;
	  }
	  else if (user.scene.currentBattle.battleType) {
	  	// Switch out logic for the battle type
	  	switchOutTarget.resetTurnData();
	  	switchOutTarget.resetSummonData();
	  	switchOutTarget.hideInfo();
	  	switchOutTarget.setVisible(false);
	  	switchOutTarget.scene.field.remove(switchOutTarget);
	  	user.scene.triggerPokemonFormChange(switchOutTarget, SpeciesFormChangeActiveTrigger, true);
	  
	  	if (switchOutTarget.hp)
	  	user.scene.unshiftPhase(new SwitchSummonPhase(user.scene, switchOutTarget.getFieldIndex(), user.scene.currentBattle.trainer.getNextSummonIndex((switchOutTarget as EnemyPokemon).trainerSlot), false, this.batonPass, false));
	  }
	  else { 
	    // Switch out logic for everything else
	  	switchOutTarget.setVisible(false);
	  
	  	if (switchOutTarget.hp) {
	  	  switchOutTarget.hideInfo().then(() => switchOutTarget.destroy());
	  	  switchOutTarget.scene.field.remove(switchOutTarget);
	  	  user.scene.queueMessage(getPokemonMessage(switchOutTarget, ' fled!'), null, true, 500);
	  	}
	  
	  	if (!switchOutTarget.getAlly()?.isActive(true)) {
	  	  user.scene.clearEnemyHeldItemModifiers();
		  
	  	  if (switchOutTarget.hp) {
	  	  	user.scene.pushPhase(new BattleEndPhase(user.scene));
	  	  	user.scene.pushPhase(new NewBattlePhase(user.scene));
	  	  }
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
    if (!user.scene.getEnemyParty().find(p => p.isActive() && !p.isOnField()))
      return -20;
    let ret = this.user ? Math.floor((1 - user.getHpRatio()) * 20) : super.getUserBenefitScore(user, target, move);
    if (this.user && this.batonPass) {
      const battleStatTotal = user.summonData.battleStats.reduce((bs: integer, total: integer) => total += bs, 0);
      ret = ret / 2 + (Phaser.Tweens.Builders.GetEaseFunction('Sine.easeOut')(Math.min(Math.abs(battleStatTotal), 10) / 10) * (battleStatTotal >= 0 ? 10 : -10));
    }
    return ret;
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

export class NaturePowerAttr extends OverrideMoveEffectAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): Promise<boolean> {
    return new Promise(resolve => {
      var moveId;
      switch (user.scene.arena.getTerrainType()) {
        // this allows terrains to 'override' the biome move
        case TerrainType.NONE:
          switch (user.scene.arena.biomeType) {
            case Biome.TOWN:
              moveId = Moves.ROUND;
              break;
            case Biome.METROPOLIS:
              moveId = Moves.TRI_ATTACK;
              break;
            case Biome.SLUM:
              moveId = Moves.SLUDGE_BOMB;
              break;
            case Biome.PLAINS:
              moveId = Moves.SILVER_WIND;
              break;
            case Biome.GRASS:
              moveId = Moves.GRASS_KNOT;
              break;
            case Biome.TALL_GRASS:
              moveId = Moves.POLLEN_PUFF;
              break;
            case Biome.MEADOW:
              moveId = Moves.GIGA_DRAIN;
              break;
            case Biome.FOREST:
              moveId = Moves.BUG_BUZZ;
              break;
            case Biome.JUNGLE:
              moveId = Moves.LEAF_STORM;
              break;
            case Biome.SEA:
              moveId = Moves.HYDRO_PUMP;
              break;
            case Biome.SWAMP:
              moveId = Moves.MUD_BOMB;
              break;
            case Biome.BEACH:
              moveId = Moves.SCALD;
              break;
            case Biome.LAKE:
              moveId = Moves.BUBBLE_BEAM;
              break;
            case Biome.SEABED:
              moveId = Moves.BRINE;
              break;
            case Biome.ISLAND:
              moveId = Moves.LEAF_TORNADO;
              break;
            case Biome.MOUNTAIN:
              moveId = Moves.AIR_SLASH;
              break;
            case Biome.BADLANDS:
              moveId = Moves.EARTH_POWER;
              break;
            case Biome.DESERT:
              moveId = Moves.SCORCHING_SANDS;
              break;
            case Biome.WASTELAND:
              moveId = Moves.DRAGON_PULSE;
              break;
            case Biome.CONSTRUCTION_SITE:
              moveId = Moves.STEEL_BEAM;
              break;
            case Biome.CAVE:
              moveId = Moves.POWER_GEM;
              break;
            case Biome.ICE_CAVE:
              moveId = Moves.ICE_BEAM;
              break;
            case Biome.SNOWY_FOREST:
              moveId = Moves.FROST_BREATH;
              break;
            case Biome.VOLCANO:
              moveId = Moves.LAVA_PLUME;
              break;
            case Biome.GRAVEYARD:
              moveId = Moves.SHADOW_BALL;
              break;
            case Biome.RUINS:
              moveId = Moves.ANCIENT_POWER;
              break;
            case Biome.TEMPLE:
              moveId = Moves.EXTRASENSORY;
              break;
            case Biome.DOJO:
              moveId = Moves.FOCUS_BLAST;
              break;
            case Biome.FAIRY_CAVE:
              moveId = Moves.ALLURING_VOICE;
              break;
            case Biome.ABYSS:
              moveId = Moves.OMINOUS_WIND;
              break;
            case Biome.SPACE:
              moveId = Moves.DRACO_METEOR;
              break;
            case Biome.FACTORY:
              moveId = Moves.FLASH_CANNON;
              break;
            case Biome.LABORATORY:
              moveId = Moves.ZAP_CANNON;
              break;
            case Biome.POWER_PLANT:
              moveId = Moves.CHARGE_BEAM;
              break;
            case Biome.END:
              moveId = Moves.ETERNABEAM;
              break;
          }
          break;
        case TerrainType.MISTY:
          moveId = Moves.MOONBLAST;
          break;
        case TerrainType.ELECTRIC:
          moveId = Moves.THUNDERBOLT;
          break;
        case TerrainType.GRASSY:
          moveId = Moves.ENERGY_BALL;
          break;
        case TerrainType.PSYCHIC:
          moveId = Moves.PSYCHIC;
          break;
        default:
          // Just in case there's no match
          moveId = Moves.TRI_ATTACK;
          break;
      }
      
      user.getMoveQueue().push({ move: moveId, targets: [target.getBattlerIndex()], ignorePP: true });
      user.scene.unshiftPhase(new MovePhase(user.scene, user, [target.getBattlerIndex()], new PokemonMove(moveId, 0, 0, true), true));
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

export class AbilityChangeAttr extends MoveEffectAttr {
  public ability: Abilities;

  constructor(ability: Abilities, selfTarget?: boolean) {
    super(selfTarget, MoveEffectTrigger.HIT);

    this.ability = ability;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    (this.selfTarget ? user : target).summonData.ability = this.ability;

    user.scene.queueMessage('The ' + getPokemonMessage((this.selfTarget ? user : target), ` acquired\n${allAbilities[this.ability].name}!`));

    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => !(this.selfTarget ? user : target).getAbility().hasAttr(UnsuppressableAbilityAbAttr) && (this.selfTarget ? user : target).getAbility().id !== this.ability;
  }
}

export class AbilityCopyAttr extends MoveEffectAttr {
  public copyToPartner: boolean;

  constructor(copyToPartner: boolean = false) {
    super(false, MoveEffectTrigger.HIT);

    this.copyToPartner = copyToPartner;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    user.summonData.ability = target.getAbility().id;

    user.scene.queueMessage(getPokemonMessage(user, ` copied the `) + getPokemonMessage(target, `'s\n${allAbilities[target.getAbility().id].name}!`));
    
    if (this.copyToPartner && user.scene.currentBattle?.double && user.getAlly().hp) {
      user.getAlly().summonData.ability = target.getAbility().id;
      user.getAlly().scene.queueMessage(getPokemonMessage(user.getAlly(), ` copied the `) + getPokemonMessage(target, `'s\n${allAbilities[target.getAbility().id].name}!`));
    }

    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => {
      let ret = !target.getAbility().hasAttr(UncopiableAbilityAbAttr) && !user.getAbility().hasAttr(UnsuppressableAbilityAbAttr);
      if (this.copyToPartner && user.scene.currentBattle?.double)
        ret = ret && (!user.getAlly().hp || !user.getAlly().getAbility().hasAttr(UnsuppressableAbilityAbAttr));
      else
        ret = ret && user.getAbility().id !== target.getAbility().id;
      return ret;
    };
  }
}

export class AbilityGiveAttr extends MoveEffectAttr {
  public copyToPartner: boolean;

  constructor() {
    super(false, MoveEffectTrigger.HIT);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    target.summonData.ability = user.getAbility().id;

    user.scene.queueMessage('The' + getPokemonMessage(target, `\nacquired ${allAbilities[user.getAbility().id].name}!`));

    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => !user.getAbility().hasAttr(UncopiableAbilityAbAttr) && !target.getAbility().hasAttr(UnsuppressableAbilityAbAttr) && user.getAbility().id !== target.getAbility().id;
  }
}

export class SwitchAbilitiesAttr extends MoveEffectAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    const tempAbilityId = user.getAbility().id;
    user.summonData.ability = target.getAbility().id;
    target.summonData.ability = tempAbilityId;

    user.scene.queueMessage(getPokemonMessage(user, ` swapped\nabilities with its target!`));

    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => !user.getAbility().hasAttr(UnswappableAbilityAbAttr) && !target.getAbility().hasAttr(UnswappableAbilityAbAttr);
  }
}

export class TransformAttr extends MoveEffectAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): Promise<boolean> {
    return new Promise(resolve => {
      if (!super.apply(user, target, move, args))
        return resolve(false);

      user.summonData.speciesForm = target.getSpeciesForm();
      user.summonData.fusionSpeciesForm = target.getFusionSpeciesForm();
      user.summonData.ability = target.getAbility().id;
      user.summonData.gender = target.getGender();
      user.summonData.fusionGender = target.getFusionGender();
      user.summonData.stats = [ user.stats[Stat.HP] ].concat(target.stats.slice(1));
      user.summonData.battleStats = target.summonData.battleStats.slice(0);
      user.summonData.moveset = target.getMoveset().map(m => new PokemonMove(m.moveId, m.ppUsed, m.ppUp));
      user.summonData.types = target.getTypes();

      user.scene.queueMessage(getPokemonMessage(user, ` transformed\ninto ${target.name}!`));

      user.loadAssets(false).then(() => {
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

export class MoneyAttr extends MoveEffectAttr {
  constructor() {
    super(true, MoveEffectTrigger.HIT);
  }

  apply(user: Pokemon, target: Pokemon, move: Move): boolean {
    user.scene.currentBattle.moneyScattered += user.scene.getWaveMoneyAmount(0.2);
    user.scene.queueMessage("Coins were scattered everywhere!")
    return true;
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
    new AttackMove(Moves.POUND, i18next.t('move:pound.name'), Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 35, i18next.t('move:pound.effect'), -1, 0, 1),
    new AttackMove(Moves.KARATE_CHOP, i18next.t('move:karateChop.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 50, 100, 25, i18next.t('move:karateChop.effect'), -1, 0, 1)
      .attr(HighCritAttr),
    new AttackMove(Moves.DOUBLE_SLAP, i18next.t('move:doubleSlap.name'), Type.NORMAL, MoveCategory.PHYSICAL, 15, 85, 10, i18next.t('move:doubleSlap.effect'), -1, 0, 1)
      .attr(MultiHitAttr),
    new AttackMove(Moves.COMET_PUNCH, i18next.t('move:cometPunch.name'), Type.NORMAL, MoveCategory.PHYSICAL, 18, 85, 15, i18next.t('move:cometPunch.effect'), -1, 0, 1)
      .attr(MultiHitAttr)
      .punchingMove(),
    new AttackMove(Moves.MEGA_PUNCH, i18next.t('move:megaPunch.name'), Type.NORMAL, MoveCategory.PHYSICAL, 80, 85, 20, i18next.t('move:megaPunch.effect'), -1, 0, 1)
      .punchingMove(),
    new AttackMove(Moves.PAY_DAY, i18next.t('move:payDay.name'), Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 20, i18next.t('move:payDay.effect'), -1, 0, 1)
      .attr(MoneyAttr)
      .makesContact(false),
    new AttackMove(Moves.FIRE_PUNCH, i18next.t('move:firePunch.name'), Type.FIRE, MoveCategory.PHYSICAL, 75, 100, 15, i18next.t('move:firePunch.effect'), 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .punchingMove(),
    new AttackMove(Moves.ICE_PUNCH, i18next.t('move:icePunch.name'), Type.ICE, MoveCategory.PHYSICAL, 75, 100, 15, i18next.t('move:icePunch.effect'), 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.FREEZE)
      .punchingMove(),
    new AttackMove(Moves.THUNDER_PUNCH, i18next.t('move:thunderPunch.name'), Type.ELECTRIC, MoveCategory.PHYSICAL, 75, 100, 15, i18next.t('move:thunderPunch.effect'), 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .punchingMove(),
    new AttackMove(Moves.SCRATCH, i18next.t('move:scratch.name'), Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 35, i18next.t('move:scratch.effect'), -1, 0, 1),
    new AttackMove(Moves.VISE_GRIP, i18next.t('move:viseGrip.name'), Type.NORMAL, MoveCategory.PHYSICAL, 55, 100, 30, i18next.t('move:viseGrip.effect'), -1, 0, 1),
    new AttackMove(Moves.GUILLOTINE, i18next.t('move:guillotine.name'), Type.NORMAL, MoveCategory.PHYSICAL, -1, 30, 5, i18next.t('move:guillotine.effect'), -1, 0, 1)
      .attr(OneHitKOAttr)
      .attr(OneHitKOAccuracyAttr),
    new AttackMove(Moves.RAZOR_WIND, i18next.t('move:razorWind.name'), Type.NORMAL, MoveCategory.SPECIAL, 80, 100, 10, i18next.t('move:razorWind.effect'), -1, 0, 1)
      .attr(ChargeAttr, ChargeAnim.RAZOR_WIND_CHARGING, 'whipped\nup a whirlwind!')
      .attr(HighCritAttr)
      .windMove()
      .ignoresVirtual()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new SelfStatusMove(Moves.SWORDS_DANCE, i18next.t('move:swordsDance.name'), Type.NORMAL, -1, 20, i18next.t('move:swordsDance.effect'), -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.ATK, 2, true)
      .danceMove(),
    new AttackMove(Moves.CUT, i18next.t('move:cut.name'), Type.NORMAL, MoveCategory.PHYSICAL, 50, 95, 30, i18next.t('move:cut.effect'), -1, 0, 1)
      .slicingMove(),
    new AttackMove(Moves.GUST, i18next.t('move:gust.name'), Type.FLYING, MoveCategory.SPECIAL, 40, 100, 35, i18next.t('move:gust.effect'), -1, 0, 1)
      .attr(HitsTagAttr, BattlerTagType.FLYING, true)
      .windMove(),
    new AttackMove(Moves.WING_ATTACK, i18next.t('move:wingAttack.name'), Type.FLYING, MoveCategory.PHYSICAL, 60, 100, 35, i18next.t('move:wingAttack.effect'), -1, 0, 1),
    new StatusMove(Moves.WHIRLWIND, i18next.t('move:whirlwind.name'), Type.NORMAL, -1, 20, i18next.t('move:whirlwind.effect'), -1, -6, 1)
      .attr(ForceSwitchOutAttr)
      .attr(HitsTagAttr, BattlerTagType.FLYING, false)
      .hidesTarget()
      .windMove(),
    new AttackMove(Moves.FLY, i18next.t('move:fly.name'), Type.FLYING, MoveCategory.PHYSICAL, 90, 95, 15, i18next.t('move:fly.effect'), -1, 0, 1)
      .attr(ChargeAttr, ChargeAnim.FLY_CHARGING, 'flew\nup high!', BattlerTagType.FLYING)
      .condition(failOnGravityCondition)
      .ignoresVirtual(),
    new AttackMove(Moves.BIND, i18next.t('move:bind.name'), Type.NORMAL, MoveCategory.PHYSICAL, 15, 85, 20, i18next.t('move:bind.effect'), 100, 0, 1)
      .attr(TrapAttr, BattlerTagType.BIND),
    new AttackMove(Moves.SLAM, i18next.t('move:slam.name'), Type.NORMAL, MoveCategory.PHYSICAL, 80, 75, 20, i18next.t('move:slam.effect'), -1, 0, 1),
    new AttackMove(Moves.VINE_WHIP, i18next.t('move:vineWhip.name'), Type.GRASS, MoveCategory.PHYSICAL, 45, 100, 25, i18next.t('move:vineWhip.effect'), -1, 0, 1),
    new AttackMove(Moves.STOMP, i18next.t('move:stomp.name'), Type.NORMAL, MoveCategory.PHYSICAL, 65, 100, 20, i18next.t('move:stomp.effect'), 30, 0, 1)
      .attr(FlinchAttr),
    new AttackMove(Moves.DOUBLE_KICK, i18next.t('move:doubleKick.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 30, 100, 30, i18next.t('move:doubleKick.effect'), -1, 0, 1)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.MEGA_KICK, i18next.t('move:megaKick.name'), Type.NORMAL, MoveCategory.PHYSICAL, 120, 75, 5, i18next.t('move:megaKick.effect'), -1, 0, 1),
    new AttackMove(Moves.JUMP_KICK, i18next.t('move:jumpKick.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 100, 95, 10, i18next.t('move:jumpKick.effect'), -1, 0, 1)
      .attr(MissEffectAttr, crashDamageFunc)
      .attr(NoEffectAttr, crashDamageFunc)
      .condition(failOnGravityCondition),
    new AttackMove(Moves.ROLLING_KICK, i18next.t('move:rollingKick.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 60, 85, 15, i18next.t('move:rollingKick.effect'), 30, 0, 1)
      .attr(FlinchAttr),
    new StatusMove(Moves.SAND_ATTACK, i18next.t('move:sandAttack.name'), Type.GROUND, 100, 15, i18next.t('move:sandAttack.effect'), -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new AttackMove(Moves.HEADBUTT, i18next.t('move:headbutt.name'), Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 15, i18next.t('move:headbutt.effect'), 30, 0, 1)
      .attr(FlinchAttr),
    new AttackMove(Moves.HORN_ATTACK, i18next.t('move:hornAttack.name'), Type.NORMAL, MoveCategory.PHYSICAL, 65, 100, 25, i18next.t('move:hornAttack.effect'), -1, 0, 1),
    new AttackMove(Moves.FURY_ATTACK, i18next.t('move:furyAttack.name'), Type.NORMAL, MoveCategory.PHYSICAL, 15, 85, 20, i18next.t('move:furyAttack.effect'), -1, 0, 1)
      .attr(MultiHitAttr),
    new AttackMove(Moves.HORN_DRILL, i18next.t('move:hornDrill.name'), Type.NORMAL, MoveCategory.PHYSICAL, -1, 30, 5, i18next.t('move:hornDrill.effect'), -1, 0, 1)
      .attr(OneHitKOAttr)
      .attr(OneHitKOAccuracyAttr),
    new AttackMove(Moves.TACKLE, i18next.t('move:tackle.name'), Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 35, i18next.t('move:tackle.effect'), -1, 0, 1),
    new AttackMove(Moves.BODY_SLAM, i18next.t('move:bodySlam.name'), Type.NORMAL, MoveCategory.PHYSICAL, 85, 100, 15, i18next.t('move:bodySlam.effect'), 30, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.WRAP, i18next.t('move:wrap.name'), Type.NORMAL, MoveCategory.PHYSICAL, 15, 90, 20, i18next.t('move:wrap.effect'), 100, 0, 1)
      .attr(TrapAttr, BattlerTagType.WRAP),
    new AttackMove(Moves.TAKE_DOWN, i18next.t('move:takeDown.name'), Type.NORMAL, MoveCategory.PHYSICAL, 90, 85, 20, i18next.t('move:takeDown.effect'), -1, 0, 1)
      .attr(RecoilAttr),
    new AttackMove(Moves.THRASH, i18next.t('move:thrash.name'), Type.NORMAL, MoveCategory.PHYSICAL, 120, 100, 10, i18next.t('move:thrash.effect'), -1, 0, 1)
      .attr(FrenzyAttr)
      .attr(MissEffectAttr, frenzyMissFunc)
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new AttackMove(Moves.DOUBLE_EDGE, i18next.t('move:doubleEdge.name'), Type.NORMAL, MoveCategory.PHYSICAL, 120, 100, 15, i18next.t('move:doubleEdge.effect'), -1, 0, 1)
      .attr(RecoilAttr, false, 0.33),
    new StatusMove(Moves.TAIL_WHIP, i18next.t('move:tailWhip.name'), Type.NORMAL, 100, 30, i18next.t('move:tailWhip.effect'), -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.DEF, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.POISON_STING, i18next.t('move:poisonSting.name'), Type.POISON, MoveCategory.PHYSICAL, 15, 100, 35, i18next.t('move:poisonSting.effect'), 30, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .makesContact(false),
    new AttackMove(Moves.TWINEEDLE, i18next.t('move:twineedle.name'), Type.BUG, MoveCategory.PHYSICAL, 25, 100, 20, i18next.t('move:twineedle.effect'), 20, 0, 1)
      .attr(MultiHitAttr, MultiHitType._2)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .makesContact(false),
    new AttackMove(Moves.PIN_MISSILE, i18next.t('move:pinMissile.name'), Type.BUG, MoveCategory.PHYSICAL, 25, 95, 20, i18next.t('move:pinMissile.effect'), -1, 0, 1)
      .attr(MultiHitAttr)
      .makesContact(false),
    new StatusMove(Moves.LEER, i18next.t('move:leer.name'), Type.NORMAL, 100, 30, i18next.t('move:leer.effect'), 100, 0, 1)
      .attr(StatChangeAttr, BattleStat.DEF, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.BITE, i18next.t('move:bite.name'), Type.DARK, MoveCategory.PHYSICAL, 60, 100, 25, i18next.t('move:bite.effect'), 30, 0, 1)
      .attr(FlinchAttr)
      .bitingMove(),
    new StatusMove(Moves.GROWL, i18next.t('move:growl.name'), Type.NORMAL, 100, 40, i18next.t('move:growl.effect'), -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.ATK, -1)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.ROAR, i18next.t('move:roar.name'), Type.NORMAL, -1, 20, i18next.t('move:roar.effect'), -1, -6, 1)
      .attr(ForceSwitchOutAttr)
      .soundBased()
      .hidesTarget(),
    new StatusMove(Moves.SING, i18next.t('move:sing.name'), Type.NORMAL, 55, 15, i18next.t('move:sing.effect'), -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .soundBased(),
    new StatusMove(Moves.SUPERSONIC, i18next.t('move:supersonic.name'), Type.NORMAL, 55, 20, i18next.t('move:supersonic.effect'), -1, 0, 1)
      .attr(ConfuseAttr)
      .soundBased(),
    new AttackMove(Moves.SONIC_BOOM, i18next.t('move:sonicBoom.name'), Type.NORMAL, MoveCategory.SPECIAL, -1, 90, 20, i18next.t('move:sonicBoom.effect'), -1, 0, 1)
      .attr(FixedDamageAttr, 20),
    new StatusMove(Moves.DISABLE, i18next.t('move:disable.name'), Type.NORMAL, 100, 20, i18next.t('move:disable.effect'), -1, 0, 1)
      .attr(DisableMoveAttr),
    new AttackMove(Moves.ACID, i18next.t('move:acid.name'), Type.POISON, MoveCategory.SPECIAL, 40, 100, 30, i18next.t('move:acid.effect'), 10, 0, 1)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.EMBER, i18next.t('move:ember.name'), Type.FIRE, MoveCategory.SPECIAL, 40, 100, 25, i18next.t('move:ember.effect'), 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.FLAMETHROWER, i18next.t('move:flamethrower.name'), Type.FIRE, MoveCategory.SPECIAL, 90, 100, 15, i18next.t('move:flamethrower.effect'), 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new StatusMove(Moves.MIST, i18next.t('move:mist.name'), Type.ICE, -1, 30, i18next.t('move:mist.effect'), -1, 0, 1)
      .attr(AddArenaTagAttr, ArenaTagType.MIST, 5, true)
      .target(MoveTarget.USER_SIDE),
    new AttackMove(Moves.WATER_GUN, i18next.t('move:waterGun.name'), Type.WATER, MoveCategory.SPECIAL, 40, 100, 25, i18next.t('move:waterGun.effect'), -1, 0, 1),
    new AttackMove(Moves.HYDRO_PUMP, i18next.t('move:hydroPump.name'), Type.WATER, MoveCategory.SPECIAL, 110, 80, 5, i18next.t('move:hydroPump.effect'), -1, 0, 1),
    new AttackMove(Moves.SURF, i18next.t('move:surf.name'), Type.WATER, MoveCategory.SPECIAL, 90, 100, 15, i18next.t('move:surf.effect'), -1, 0, 1)
      .target(MoveTarget.ALL_NEAR_OTHERS)
      .attr(HitsTagAttr, BattlerTagType.UNDERWATER, true),
    new AttackMove(Moves.ICE_BEAM, i18next.t('move:iceBeam.name'), Type.ICE, MoveCategory.SPECIAL, 90, 100, 10, i18next.t('move:iceBeam.effect'), 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.FREEZE),
    new AttackMove(Moves.BLIZZARD, i18next.t('move:blizzard.name'), Type.ICE, MoveCategory.SPECIAL, 110, 70, 5, i18next.t('move:blizzard.effect'), 10, 0, 1)
      .attr(BlizzardAccuracyAttr)
      .attr(StatusEffectAttr, StatusEffect.FREEZE) // TODO: 30% chance to hit protect/detect in hail
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.PSYBEAM, i18next.t('move:psybeam.name'), Type.PSYCHIC, MoveCategory.SPECIAL, 65, 100, 20, i18next.t('move:psybeam.effect'), 10, 0, 1)
      .attr(ConfuseAttr),
    new AttackMove(Moves.BUBBLE_BEAM, i18next.t('move:bubbleBeam.name'), Type.WATER, MoveCategory.SPECIAL, 65, 100, 20, i18next.t('move:bubbleBeam.effect'), 10, 0, 1)
      .attr(StatChangeAttr, BattleStat.SPD, -1),
    new AttackMove(Moves.AURORA_BEAM, i18next.t('move:auroraBeam.name'), Type.ICE, MoveCategory.SPECIAL, 65, 100, 20, i18next.t('move:auroraBeam.effect'), 10, 0, 1)
      .attr(StatChangeAttr, BattleStat.ATK, -1),
    new AttackMove(Moves.HYPER_BEAM, i18next.t('move:hyperBeam.name'), Type.NORMAL, MoveCategory.SPECIAL, 150, 90, 5, i18next.t('move:auroraBeam.effect'), -1, 0, 1)
      .attr(RechargeAttr),
    new AttackMove(Moves.PECK, i18next.t('move:peck.name'), Type.FLYING, MoveCategory.PHYSICAL, 35, 100, 35, i18next.t('move:peck.effect'), -1, 0, 1),
    new AttackMove(Moves.DRILL_PECK, i18next.t('move:drillPeck.name'), Type.FLYING, MoveCategory.PHYSICAL, 80, 100, 20, i18next.t('move:drillPeck.effect'), -1, 0, 1),
    new AttackMove(Moves.SUBMISSION, i18next.t('move:submission.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 80, 80, 20, i18next.t('move:submission.effect'), -1, 0, 1)
      .attr(RecoilAttr),
    new AttackMove(Moves.LOW_KICK, i18next.t('move:lowKick.name'), Type.FIGHTING, MoveCategory.PHYSICAL, -1, 100, 20, i18next.t('move:lowKick.effect'), -1, 0, 1)
      .attr(WeightPowerAttr),
    new AttackMove(Moves.COUNTER, i18next.t('move:counter.name'), Type.FIGHTING, MoveCategory.PHYSICAL, -1, 100, 20, i18next.t('move:counter.effect'), -1, -5, 1)
      .attr(CounterDamageAttr, (move: Move) => move.category === MoveCategory.PHYSICAL, 2)
      .target(MoveTarget.ATTACKER),
    new AttackMove(Moves.SEISMIC_TOSS, i18next.t('move:seismicToss.name'), Type.FIGHTING, MoveCategory.PHYSICAL, -1, 100, 20, i18next.t('move:seismicToss.effect'), -1, 0, 1)
      .attr(LevelDamageAttr),
    new AttackMove(Moves.STRENGTH, i18next.t('move:strength.name'), Type.NORMAL, MoveCategory.PHYSICAL, 80, 100, 15, i18next.t('move:strength.effect'), -1, 0, 1),
    new AttackMove(Moves.ABSORB, i18next.t('move:absorb.name'), Type.GRASS, MoveCategory.SPECIAL, 20, 100, 25, i18next.t('move:absorb.effect'), -1, 0, 1)
      .attr(HitHealAttr)
      .triageMove(),
    new AttackMove(Moves.MEGA_DRAIN, i18next.t('move:megaDrain.name'), Type.GRASS, MoveCategory.SPECIAL, 40, 100, 15, i18next.t('move:megaDrain.effect'), -1, 0, 1)
      .attr(HitHealAttr)
      .triageMove(),
    new StatusMove(Moves.LEECH_SEED, i18next.t('move:leechSeed.name'), Type.GRASS, 90, 10, i18next.t('move:leechSeed.effect'), -1, 0, 1)
      .attr(AddBattlerTagAttr, BattlerTagType.SEEDED)
      .condition((user, target, move) => !target.getTag(BattlerTagType.SEEDED) && !target.isOfType(Type.GRASS)),
    new SelfStatusMove(Moves.GROWTH, i18next.t('move:growth.name'), Type.NORMAL, -1, 20, i18next.t('move:growth.effect'), -1, 0, 1)
      .attr(GrowthStatChangeAttr),
    new AttackMove(Moves.RAZOR_LEAF, i18next.t('move:razorLeaf.name'), Type.GRASS, MoveCategory.PHYSICAL, 55, 95, 25, i18next.t('move:razorLeaf.effect'), -1, 0, 1)
      .attr(HighCritAttr)
      .makesContact(false)
      .slicingMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.SOLAR_BEAM, i18next.t('move:solarBeam.name'), Type.GRASS, MoveCategory.SPECIAL, 120, 100, 10, i18next.t('move:solarBeam.effect'), -1, 0, 1)
      .attr(SunlightChargeAttr, ChargeAnim.SOLAR_BEAM_CHARGING, 'took\nin sunlight!')
      .attr(AntiSunlightPowerDecreaseAttr)
      .ignoresVirtual(),
    new StatusMove(Moves.POISON_POWDER, i18next.t('move:poisonPowder.name'), Type.POISON, 75, 35, i18next.t('move:poisonPowder.effect'), -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .powderMove(),
    new StatusMove(Moves.STUN_SPORE, i18next.t('move:stunSpore.name'), Type.GRASS, 75, 30, i18next.t('move:stunSpore.effect'), -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .powderMove(),
    new StatusMove(Moves.SLEEP_POWDER, i18next.t('move:sleepPowder.name'), Type.GRASS, 75, 15, i18next.t('move:sleepPowder.effect'), -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .powderMove(),
    new AttackMove(Moves.PETAL_DANCE, i18next.t('move:petalDance.name'), Type.GRASS, MoveCategory.SPECIAL, 120, 100, 10, i18next.t('move:petalDance.effect'), -1, 0, 1)
      .attr(FrenzyAttr)
      .attr(MissEffectAttr, frenzyMissFunc)
      .makesContact()
      .danceMove()
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new StatusMove(Moves.STRING_SHOT, i18next.t('move:stringShot.name'), Type.BUG, 95, 40, i18next.t('move:stringShot.effect'), -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.SPD, -2)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.DRAGON_RAGE, i18next.t('move:dragonRage.name'), Type.DRAGON, MoveCategory.SPECIAL, -1, 100, 10, i18next.t('move:dragonRage.effect'), -1, 0, 1)
      .attr(FixedDamageAttr, 40),
    new AttackMove(Moves.FIRE_SPIN, i18next.t('move:fireSpin.name'), Type.FIRE, MoveCategory.SPECIAL, 35, 85, 15, i18next.t('move:fireSpin.effect'), 100, 0, 1)
      .attr(TrapAttr, BattlerTagType.FIRE_SPIN),
    new AttackMove(Moves.THUNDER_SHOCK, i18next.t('move:thunderShock.name'), Type.ELECTRIC, MoveCategory.SPECIAL, 40, 100, 30, i18next.t('move:thunderShock.effect'), 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.THUNDERBOLT, i18next.t('move:thunderbolt.name'), Type.ELECTRIC, MoveCategory.SPECIAL, 90, 100, 15, i18next.t('move:thunderbolt.effect'), 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new StatusMove(Moves.THUNDER_WAVE, i18next.t('move:thunderWave.name'), Type.ELECTRIC, 90, 20, i18next.t('move:thunderWave.effect'), -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .attr(StatusMoveTypeImmunityAttr, Type.GROUND),
    new AttackMove(Moves.THUNDER, i18next.t('move:thunder.name'), Type.ELECTRIC, MoveCategory.SPECIAL, 110, 70, 10, i18next.t('move:thunder.effect'), 30, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .attr(ThunderAccuracyAttr)
      .attr(HitsTagAttr, BattlerTagType.FLYING, false),
    new AttackMove(Moves.ROCK_THROW, i18next.t('move:rockThrow.name'), Type.ROCK, MoveCategory.PHYSICAL, 50, 90, 15, i18next.t('move:rockThrow.effect'), -1, 0, 1)
      .makesContact(false),
    new AttackMove(Moves.EARTHQUAKE, i18next.t('move:earthquake.name'), Type.GROUND, MoveCategory.PHYSICAL, 100, 100, 10, i18next.t('move:earthquake.effect'), -1, 0, 1)
      .attr(HitsTagAttr, BattlerTagType.UNDERGROUND, true)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.FISSURE, i18next.t('move:fissure.name'), Type.GROUND, MoveCategory.PHYSICAL, -1, 30, 5, i18next.t('move:fissure.effect'), -1, 0, 1)
      .attr(OneHitKOAttr)
      .attr(OneHitKOAccuracyAttr)
      .attr(HitsTagAttr, BattlerTagType.UNDERGROUND, false)
      .makesContact(false),
    new AttackMove(Moves.DIG, i18next.t('move:dig.name'), Type.GROUND, MoveCategory.PHYSICAL, 80, 100, 10, i18next.t('move:dig.effect'), -1, 0, 1)
      .attr(ChargeAttr, ChargeAnim.DIG_CHARGING, 'dug a hole!', BattlerTagType.UNDERGROUND)
      .ignoresVirtual(),
    new StatusMove(Moves.TOXIC, i18next.t('move:toxic.name'), Type.POISON, 90, 10, i18next.t('move:toxic.effect'), -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.TOXIC)
      .attr(ToxicAccuracyAttr),
    new AttackMove(Moves.CONFUSION, i18next.t('move:confusion.name'), Type.PSYCHIC, MoveCategory.SPECIAL, 50, 100, 25, i18next.t('move:confusion.effect'), 10, 0, 1)
      .attr(ConfuseAttr),
    new AttackMove(Moves.PSYCHIC, i18next.t('move:psychic.name'), Type.PSYCHIC, MoveCategory.SPECIAL, 90, 100, 10, i18next.t('move:psychic.effect'), 10, 0, 1)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1),
    new StatusMove(Moves.HYPNOSIS, i18next.t('move:hypnosis.name'), Type.PSYCHIC, 60, 20, i18next.t('move:hypnosis.effect'), -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP),
    new SelfStatusMove(Moves.MEDITATE, i18next.t('move:meditate.name'), Type.PSYCHIC, -1, 40, i18next.t('move:meditate.effect'), -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.ATK, 1, true),
    new SelfStatusMove(Moves.AGILITY, i18next.t('move:agility.name'), Type.PSYCHIC, -1, 30, i18next.t('move:agility.effect'), -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.SPD, 2, true),
    new AttackMove(Moves.QUICK_ATTACK, i18next.t('move:quickAttack.name'), Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 30, i18next.t('move:quickAttack.effect'), -1, 1, 1),
    new AttackMove(Moves.RAGE, i18next.t('move:rage.name'), Type.NORMAL, MoveCategory.PHYSICAL, 20, 100, 20, i18next.t('move:rage.effect'), -1, 0, 1),
    new SelfStatusMove(Moves.TELEPORT, i18next.t('move:teleport.name'), Type.PSYCHIC, -1, 20, i18next.t('move:teleport.effect'), -1, -6, 1)
      .attr(ForceSwitchOutAttr, true)
      .hidesUser(),
    new AttackMove(Moves.NIGHT_SHADE, i18next.t('move:nightShade.name'), Type.GHOST, MoveCategory.SPECIAL, -1, 100, 15, i18next.t('move:nightShade.effect'), -1, 0, 1)
      .attr(LevelDamageAttr),
    new StatusMove(Moves.MIMIC, i18next.t('move:mimic.name'), Type.NORMAL, -1, 10, i18next.t('move:mimic.effect'), -1, 0, 1)
      .attr(MovesetCopyMoveAttr)
      .ignoresVirtual(),
    new StatusMove(Moves.SCREECH, i18next.t('move:screech.name'), Type.NORMAL, 85, 40, i18next.t('move:screech.effect'), -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.DEF, -2)
      .soundBased(),
    new SelfStatusMove(Moves.DOUBLE_TEAM, i18next.t('move:doubleTeam.name'), Type.NORMAL, -1, 15, i18next.t('move:doubleTeam.effect'), -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.EVA, 1, true),
    new SelfStatusMove(Moves.RECOVER, i18next.t('move:recover.name'), Type.NORMAL, -1, 5, i18next.t('move:recover.effect'), -1, 0, 1)
      .attr(HealAttr, 0.5)
      .triageMove(),
    new SelfStatusMove(Moves.HARDEN, i18next.t('move:harden.name'), Type.NORMAL, -1, 30, i18next.t('move:harden.effect'), -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.DEF, 1, true),
    new SelfStatusMove(Moves.MINIMIZE, i18next.t('move:minimize.name'), Type.NORMAL, -1, 10, i18next.t('move:minimize.effect'), -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.EVA, 2, true),
    new StatusMove(Moves.SMOKESCREEN, i18next.t('move:smokescreen.name'), Type.NORMAL, 100, 20, i18next.t('move:smokescreen.effect'), -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new StatusMove(Moves.CONFUSE_RAY, i18next.t('move:confuseRay.name'), Type.GHOST, 100, 10, i18next.t('move:confuseRay.effect'), -1, 0, 1)
      .attr(ConfuseAttr),
    new SelfStatusMove(Moves.WITHDRAW, i18next.t('move:withdraw.name'), Type.WATER, -1, 40, i18next.t('move:withdraw.effect'), -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.DEF, 1, true),
    new SelfStatusMove(Moves.DEFENSE_CURL, i18next.t('move:defenseCurl.name'), Type.NORMAL, -1, 40, i18next.t('move:defenseCurl.effect'), -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.DEF, 1, true),
    new SelfStatusMove(Moves.BARRIER, i18next.t('move:barrier.name'), Type.PSYCHIC, -1, 20, i18next.t('move:barrier.effect'), -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.DEF, 2, true),
    new StatusMove(Moves.LIGHT_SCREEN, i18next.t('move:lightScreen.name'), Type.PSYCHIC, -1, 30, i18next.t('move:lightScreen.effect'), -1, 0, 1)
      .attr(AddArenaTagAttr, ArenaTagType.LIGHT_SCREEN, 5, true)
      .target(MoveTarget.USER_SIDE),
    new StatusMove(Moves.HAZE, i18next.t('move:haze.name'), Type.ICE, -1, 30, i18next.t('move:haze.effect'), -1, 0, 1)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(Moves.REFLECT, i18next.t('move:reflect.name'), Type.PSYCHIC, -1, 20, i18next.t('move:reflect.effect'), -1, 0, 1)
      .attr(AddArenaTagAttr, ArenaTagType.REFLECT, 5, true)
      .target(MoveTarget.USER_SIDE),
    new SelfStatusMove(Moves.FOCUS_ENERGY, i18next.t('move:focusEnergy.name'), Type.NORMAL, -1, 30, i18next.t('move:focusEnergy.effect'), -1, 0, 1)
      .attr(AddBattlerTagAttr, BattlerTagType.CRIT_BOOST, true, true),
    new AttackMove(Moves.BIDE, i18next.t('move:bide.name'), Type.NORMAL, MoveCategory.PHYSICAL, -1, -1, 10, i18next.t('move:bide.effect'), -1, 1, 1)
      .ignoresVirtual()
      .target(MoveTarget.USER),
    new SelfStatusMove(Moves.METRONOME, i18next.t('move:metronome.name'), Type.NORMAL, -1, 10, i18next.t('move:metronome.effect'), -1, 0, 1)
      .attr(RandomMoveAttr)
      .ignoresVirtual(),
    new StatusMove(Moves.MIRROR_MOVE, i18next.t('move:mirrorMove.name'), Type.FLYING, -1, 20, i18next.t('move:mirrorMove.effect'), -1, 0, 1)
      .attr(CopyMoveAttr)
      .ignoresVirtual(),
    new AttackMove(Moves.SELF_DESTRUCT, i18next.t('move:selfDestruct.name'), Type.NORMAL, MoveCategory.PHYSICAL, 200, 100, 5, i18next.t('move:selfDestruct.effect'), -1, 0, 1)
      .attr(SacrificialAttr)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.EGG_BOMB, i18next.t('move:eggBomb.name'), Type.NORMAL, MoveCategory.PHYSICAL, 100, 75, 10, i18next.t('move:eggBomb.effect'), -1, 0, 1)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(Moves.LICK, i18next.t('move:lick.name'), Type.GHOST, MoveCategory.PHYSICAL, 30, 100, 30, i18next.t('move:lick.effect'), 30, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.SMOG, i18next.t('move:smog.name'), Type.POISON, MoveCategory.SPECIAL, 30, 70, 20, i18next.t('move:smog.effect'), 40, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(Moves.SLUDGE, i18next.t('move:sludge.name'), Type.POISON, MoveCategory.SPECIAL, 65, 100, 20, i18next.t('move:sludge.effect'), 30, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(Moves.BONE_CLUB, i18next.t('move:boneClub.name'), Type.GROUND, MoveCategory.PHYSICAL, 65, 85, 20, i18next.t('move:boneClub.effect'), 10, 0, 1)
      .attr(FlinchAttr)
      .makesContact(false),
    new AttackMove(Moves.FIRE_BLAST, i18next.t('move:fireBlast.name'), Type.FIRE, MoveCategory.SPECIAL, 110, 85, 5, i18next.t('move:fireBlast.effect'), 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.WATERFALL, i18next.t('move:waterfall.name'), Type.WATER, MoveCategory.PHYSICAL, 80, 100, 15, i18next.t('move:waterfall.effect'), 20, 0, 1)
      .attr(FlinchAttr),
    new AttackMove(Moves.CLAMP, i18next.t('move:clamp.name'), Type.WATER, MoveCategory.PHYSICAL, 35, 85, 15, i18next.t('move:clamp.effect'), 100, 0, 1)
      .attr(TrapAttr, BattlerTagType.CLAMP),
    new AttackMove(Moves.SWIFT, i18next.t('move:swift.name'), Type.NORMAL, MoveCategory.SPECIAL, 60, -1, 20, i18next.t('move:swift.effect'), -1, 0, 1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.SKULL_BASH, i18next.t('move:skullBash.name'), Type.NORMAL, MoveCategory.PHYSICAL, 130, 100, 10, i18next.t('move:skullBash.effect'), 100, 0, 1)
      .attr(ChargeAttr, ChargeAnim.SKULL_BASH_CHARGING, 'lowered\nits head!', null, true)
      .attr(StatChangeAttr, BattleStat.DEF, 1, true)
      .ignoresVirtual(),
    new AttackMove(Moves.SPIKE_CANNON, i18next.t('move:spikeCannon.name'), Type.NORMAL, MoveCategory.PHYSICAL, 20, 100, 15, i18next.t('move:spikeCannon.effect'), -1, 0, 1)
      .attr(MultiHitAttr)
      .makesContact(false),
    new AttackMove(Moves.CONSTRICT, i18next.t('move:constrict.name'), Type.NORMAL, MoveCategory.PHYSICAL, 10, 100, 35, i18next.t('move:constrict.effect'), 10, 0, 1)
      .attr(StatChangeAttr, BattleStat.SPD, -1),
    new SelfStatusMove(Moves.AMNESIA, i18next.t('move:amnesia.name'), Type.PSYCHIC, -1, 20, i18next.t('move:amnesia.effect'), -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.SPDEF, 2, true),
    new StatusMove(Moves.KINESIS, i18next.t('move:kinesis.name'), Type.PSYCHIC, 80, 15, i18next.t('move:kinesis.effect'), -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new SelfStatusMove(Moves.SOFT_BOILED, i18next.t('move:softBoiled.name'), Type.NORMAL, -1, 5, i18next.t('move:softBoiled.effect'), -1, 0, 1)
      .attr(HealAttr, 0.5)
      .triageMove(),
    new AttackMove(Moves.HIGH_JUMP_KICK, i18next.t('move:highJumpKick.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 130, 90, 10, i18next.t('move:highJumpKick.effect'), -1, 0, 1)
      .attr(MissEffectAttr, crashDamageFunc)
      .attr(NoEffectAttr, crashDamageFunc)
      .condition(failOnGravityCondition),
    new StatusMove(Moves.GLARE, i18next.t('move:glare.name'), Type.NORMAL, 100, 30, i18next.t('move:glare.effect'), -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.DREAM_EATER, i18next.t('move:dreamEater.name'), Type.PSYCHIC, MoveCategory.SPECIAL, 100, 100, 15, i18next.t('move:dreamEater.effect'), -1, 0, 1)
      .attr(HitHealAttr)
      .condition((user, target, move) => target.status?.effect === StatusEffect.SLEEP)
      .triageMove(),
    new StatusMove(Moves.POISON_GAS, i18next.t('move:poisonGas.name'), Type.POISON, 90, 40, i18next.t('move:poisonGas.effect'), -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.BARRAGE, i18next.t('move:barrage.name'), Type.NORMAL, MoveCategory.PHYSICAL, 15, 85, 20, i18next.t('move:barrage.effect'), -1, 0, 1)
      .attr(MultiHitAttr)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(Moves.LEECH_LIFE, i18next.t('move:leechLife.name'), Type.BUG, MoveCategory.PHYSICAL, 80, 100, 10, i18next.t('move:leechLife.effect'), -1, 0, 1)
      .attr(HitHealAttr)
      .triageMove(),
    new StatusMove(Moves.LOVELY_KISS, i18next.t('move:lovelyKiss.name'), Type.NORMAL, 75, 10, i18next.t('move:lovelyKiss.effect'), -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP),
    new AttackMove(Moves.SKY_ATTACK, i18next.t('move:skyAttack.name'), Type.FLYING, MoveCategory.PHYSICAL, 140, 90, 5, i18next.t('move:skyAttack.effect'), 30, 0, 1)
      .attr(ChargeAttr, ChargeAnim.SKY_ATTACK_CHARGING, 'is glowing!')
      .attr(HighCritAttr)
      .attr(FlinchAttr)
      .makesContact(false)
      .ignoresVirtual(),
    new StatusMove(Moves.TRANSFORM, i18next.t('move:transform.name'), Type.NORMAL, -1, 10, i18next.t('move:transform.effect'), -1, 0, 1)
      .attr(TransformAttr)
      .ignoresProtect(),
    new AttackMove(Moves.BUBBLE, i18next.t('move:bubble.name'), Type.WATER, MoveCategory.SPECIAL, 40, 100, 30, i18next.t('move:bubble.effect'), 10, 0, 1)
      .attr(StatChangeAttr, BattleStat.SPD, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.DIZZY_PUNCH, i18next.t('move:dizzyPunch.name'), Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 10, i18next.t('move:dizzyPunch.effect'), 20, 0, 1)
      .attr(ConfuseAttr)
      .punchingMove(),
    new StatusMove(Moves.SPORE, i18next.t('move:spore.name'), Type.GRASS, 100, 15, i18next.t('move:spore.effect'), -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .powderMove(),
    new StatusMove(Moves.FLASH, i18next.t('move:flash.name'), Type.NORMAL, 100, 20, i18next.t('move:flash.effect'), -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new AttackMove(Moves.PSYWAVE, i18next.t('move:psywave.name'), Type.PSYCHIC, MoveCategory.SPECIAL, -1, 100, 15, i18next.t('move:psywave.effect'), -1, 0, 1)
      .attr(RandomLevelDamageAttr),
    new SelfStatusMove(Moves.SPLASH, i18next.t('move:splash.name'), Type.NORMAL, -1, 40, i18next.t('move:splash.effect'), -1, 0, 1)
      .condition(failOnGravityCondition),
    new SelfStatusMove(Moves.ACID_ARMOR, i18next.t('move:acidArmor.name'), Type.POISON, -1, 20, i18next.t('move:acidArmor.effect'), -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.DEF, 2, true),
    new AttackMove(Moves.CRABHAMMER, i18next.t('move:crabhammer.name'), Type.WATER, MoveCategory.PHYSICAL, 100, 90, 10, i18next.t('move:crabhammer.effect'), -1, 0, 1)
      .attr(HighCritAttr),
    new AttackMove(Moves.EXPLOSION, i18next.t('move:explosion.name'), Type.NORMAL, MoveCategory.PHYSICAL, 250, 100, 5, i18next.t('move:explosion.effect'), -1, 0, 1)
      .attr(SacrificialAttr)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.FURY_SWIPES, i18next.t('move:furySwipes.name'), Type.NORMAL, MoveCategory.PHYSICAL, 18, 80, 15, i18next.t('move:furySwipes.effect'), -1, 0, 1)
      .attr(MultiHitAttr),
    new AttackMove(Moves.BONEMERANG, i18next.t('move:bonemerang.name'), Type.GROUND, MoveCategory.PHYSICAL, 50, 90, 10, i18next.t('move:bonemerang.effect'), -1, 0, 1)
      .attr(MultiHitAttr, MultiHitType._2)
      .makesContact(false),
    new SelfStatusMove(Moves.REST, i18next.t('move:rest.name'), Type.PSYCHIC, -1, 5, i18next.t('move:rest.effect'), -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP, true, 3, true)
      .attr(HealAttr, 1, true)
      .condition((user, target, move) => user.getHpRatio() < 1 && user.canSetStatus(StatusEffect.SLEEP, true, true))
      .triageMove(),
    new AttackMove(Moves.ROCK_SLIDE, i18next.t('move:rockSlide.name'), Type.ROCK, MoveCategory.PHYSICAL, 75, 90, 10, i18next.t('move:rockSlide.effect'), 30, 0, 1)
      .attr(FlinchAttr)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.HYPER_FANG, i18next.t('move:hyperFang.name'), Type.NORMAL, MoveCategory.PHYSICAL, 80, 90, 15, i18next.t('move:hyperFang.effect'), 10, 0, 1)
      .attr(FlinchAttr)
      .bitingMove(),
    new SelfStatusMove(Moves.SHARPEN, i18next.t('move:sharpen.name'), Type.NORMAL, -1, 30, i18next.t('move:sharpen.effect'), -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.ATK, 1, true),
    new SelfStatusMove(Moves.CONVERSION, i18next.t('move:conversion.name'), Type.NORMAL, -1, 30, i18next.t('move:conversion.effect'), -1, 0, 1)
      .attr(FirstMoveTypeAttr),
    new AttackMove(Moves.TRI_ATTACK, i18next.t('move:triAttack.name'), Type.NORMAL, MoveCategory.SPECIAL, 80, 100, 10, i18next.t('move:triAttack.effect'), 20, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .attr(StatusEffectAttr, StatusEffect.FREEZE),
    new AttackMove(Moves.SUPER_FANG, i18next.t('move:superFang.name'), Type.NORMAL, MoveCategory.PHYSICAL, -1, 90, 10, i18next.t('move:superFang.effect'), -1, 0, 1)
      .attr(TargetHalfHpDamageAttr),
    new AttackMove(Moves.SLASH, i18next.t('move:slash.name'), Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 20, i18next.t('move:slash.effect'), -1, 0, 1)
      .attr(HighCritAttr)
      .slicingMove(),
    new SelfStatusMove(Moves.SUBSTITUTE, i18next.t('move:substitute.name'), Type.NORMAL, -1, 10, i18next.t('move:substitute.effect'), -1, 0, 1)
      .attr(RecoilAttr),
    new AttackMove(Moves.STRUGGLE, i18next.t('move:struggle.name'), Type.NORMAL, MoveCategory.PHYSICAL, 50, -1, 1, i18next.t('move:struggle.effect'), -1, 0, 1)
      .attr(RecoilAttr, true)
      .attr(TypelessAttr)
      .ignoresVirtual()
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new StatusMove(Moves.SKETCH, i18next.t('move:sketch.name'), Type.NORMAL, -1, 1, i18next.t('move:sketch.effect'), -1, 0, 2)
      .attr(SketchAttr)
      .ignoresVirtual(),
    new AttackMove(Moves.TRIPLE_KICK, i18next.t('move:tripleKick.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 10, 90, 10, i18next.t('move:tripleKick.effect'), -1, 0, 2)
      .attr(MultiHitAttr, MultiHitType._3_INCR)
      .attr(MissEffectAttr, (user: Pokemon, move: Move) => {
        user.turnData.hitsLeft = 1;
        return true;
      }),
    new AttackMove(Moves.THIEF, i18next.t('move:thief.name'), Type.DARK, MoveCategory.PHYSICAL, 60, 100, 25, i18next.t('move:thief.effect'), -1, 0, 2)
      .attr(StealHeldItemChanceAttr, 0.3),
    new StatusMove(Moves.SPIDER_WEB, i18next.t('move:spiderWeb.name'), Type.BUG, -1, 10, i18next.t('move:spiderWeb.effect'), -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, true, 1),
    new StatusMove(Moves.MIND_READER, i18next.t('move:mindReader.name'), Type.NORMAL, -1, 5, i18next.t('move:mindReader.effect'), -1, 0, 2)
      .attr(IgnoreAccuracyAttr),
    new StatusMove(Moves.NIGHTMARE, i18next.t('move:nightmare.name'), Type.GHOST, 100, 15, i18next.t('move:nightmare.effect'), -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.NIGHTMARE)
      .condition((user, target, move) => target.status?.effect === StatusEffect.SLEEP),
    new AttackMove(Moves.FLAME_WHEEL, i18next.t('move:flameWheel.name'), Type.FIRE, MoveCategory.PHYSICAL, 60, 100, 25, i18next.t('move:flameWheel.effect'), 10, 0, 2)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.SNORE, i18next.t('move:snore.name'), Type.NORMAL, MoveCategory.SPECIAL, 50, 100, 15, i18next.t('move:snore.effect'), 30, 0, 2)
      .attr(BypassSleepAttr)
      .attr(FlinchAttr)
      .condition((user, target, move) => user.status?.effect === StatusEffect.SLEEP)
      .soundBased(),
    new StatusMove(Moves.CURSE, i18next.t('move:curse.name'), Type.GHOST, -1, 10, i18next.t('move:curse.effect'), -1, 0, 2)
      .attr(StatChangeAttr, BattleStat.SPD, -1, true)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF ], 1, true)
      .target(MoveTarget.USER),
    new AttackMove(Moves.FLAIL, i18next.t('move:flail.name'), Type.NORMAL, MoveCategory.PHYSICAL, -1, 100, 15, i18next.t('move:flail.effect'), -1, 0, 2)
      .attr(LowHpPowerAttr),
    new StatusMove(Moves.CONVERSION_2, i18next.t('move:conversion2.name'), Type.NORMAL, -1, 30, i18next.t('move:conversion2.effect'), -1, 0, 2),
    new AttackMove(Moves.AEROBLAST, i18next.t('move:aeroblast.name'), Type.FLYING, MoveCategory.SPECIAL, 100, 95, 5, i18next.t('move:aeroblast.effect'), -1, 0, 2)
      .attr(HighCritAttr),
    new StatusMove(Moves.COTTON_SPORE, i18next.t('move:cottonSpore.name'), Type.GRASS, 100, 40, i18next.t('move:cottonSpore.effect'), -1, 0, 2)
      .attr(StatChangeAttr, BattleStat.SPD, -2)
      .powderMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.REVERSAL, i18next.t('move:reversal.name'), Type.FIGHTING, MoveCategory.PHYSICAL, -1, 100, 15, i18next.t('move:reversal.effect'), -1, 0, 2)
      .attr(LowHpPowerAttr),
    new StatusMove(Moves.SPITE, i18next.t('move:spite.name'), Type.GHOST, 100, 10, i18next.t('move:spite.effect'), -1, 0, 2)
      .attr(ReducePpMoveAttr),
    new AttackMove(Moves.POWDER_SNOW, i18next.t('move:powderSnow.name'), Type.ICE, MoveCategory.SPECIAL, 40, 100, 25, i18next.t('move:powderSnow.effect'), 10, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.FREEZE)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new SelfStatusMove(Moves.PROTECT, i18next.t('move:protect.name'), Type.NORMAL, -1, 10, i18next.t('move:protect.effect'), -1, 4, 2)
      .attr(ProtectAttr),
    new AttackMove(Moves.MACH_PUNCH, i18next.t('move:machPunch.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 40, 100, 30, i18next.t('move:machPunch.effect'), -1, 1, 2)
      .punchingMove(),
    new StatusMove(Moves.SCARY_FACE, i18next.t('move:scaryFace.name'), Type.NORMAL, 100, 10, i18next.t('move:scaryFace.effect'), -1, 0, 2)
      .attr(StatChangeAttr, BattleStat.SPD, -2),
    new AttackMove(Moves.FEINT_ATTACK, i18next.t('move:feintAttack.name'), Type.DARK, MoveCategory.PHYSICAL, 60, -1, 20, i18next.t('move:feintAttack.effect'), -1, 0, 2),
    new StatusMove(Moves.SWEET_KISS, i18next.t('move:sweetKiss.name'), Type.FAIRY, 75, 10, i18next.t('move:sweetKiss.effect'), -1, 0, 2)
      .attr(ConfuseAttr),
    new SelfStatusMove(Moves.BELLY_DRUM, i18next.t('move:bellyDrum.name'), Type.NORMAL, -1, 10, i18next.t('move:bellyDrum.effect'), -1, 0, 2)
      .attr(HalfHpStatMaxAttr, BattleStat.ATK),
    new AttackMove(Moves.SLUDGE_BOMB, i18next.t('move:sludgeBomb.name'), Type.POISON, MoveCategory.SPECIAL, 90, 100, 10, i18next.t('move:sludgeBomb.effect'), 30, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .ballBombMove(),
    new AttackMove(Moves.MUD_SLAP, i18next.t('move:mudSlap.name'), Type.GROUND, MoveCategory.SPECIAL, 20, 100, 10, i18next.t('move:mudSlap.effect'), 100, 0, 2)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new AttackMove(Moves.OCTAZOOKA, i18next.t('move:octazooka.name'), Type.WATER, MoveCategory.SPECIAL, 65, 85, 10, i18next.t('move:octazooka.effect'), 50, 0, 2)
      .attr(StatChangeAttr, BattleStat.ACC, -1)
      .ballBombMove(),
    new StatusMove(Moves.SPIKES, i18next.t('move:spikes.name'), Type.GROUND, -1, 20, i18next.t('move:spikes.effect'), -1, 0, 2)
      .attr(AddArenaTrapTagAttr, ArenaTagType.SPIKES)
      .target(MoveTarget.ENEMY_SIDE),
    new AttackMove(Moves.ZAP_CANNON, i18next.t('move:zapCannon.name'), Type.ELECTRIC, MoveCategory.SPECIAL, 120, 50, 5, i18next.t('move:zapCannon.effect'), 100, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .ballBombMove(),
    new StatusMove(Moves.FORESIGHT, i18next.t('move:foresight.name'), Type.NORMAL, -1, 40, i18next.t('move:foresight.name'), -1, 0, 2),
    new SelfStatusMove(Moves.DESTINY_BOND, i18next.t('move:destinyBond.name'), Type.GHOST, -1, 5, i18next.t('move:destinyBond.effect'), -1, 0, 2)
      .ignoresProtect()
      .condition(failOnBossCondition),
    new StatusMove(Moves.PERISH_SONG, i18next.t('move:perishSong.name'), Type.NORMAL, -1, 5, i18next.t('move:perishSong.effect'), -1, 0, 2)
      .attr(FaintCountdownAttr)
      .ignoresProtect()
      .soundBased()
      .condition(failOnBossCondition)
      .target(MoveTarget.ALL),
    new AttackMove(Moves.ICY_WIND, i18next.t('move:icyWind.name'), Type.ICE, MoveCategory.SPECIAL, 55, 95, 15, i18next.t('move:icyWind.effect'), 100, 0, 2)
      .attr(StatChangeAttr, BattleStat.SPD, -1)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new SelfStatusMove(Moves.DETECT, i18next.t('move:detect.name'), Type.FIGHTING, -1, 5, i18next.t('move:detect.effect'), -1, 4, 2)
      .attr(ProtectAttr),
    new AttackMove(Moves.BONE_RUSH, i18next.t('move:boneRush.name'), Type.GROUND, MoveCategory.PHYSICAL, 25, 90, 10, i18next.t('move:boneRush.effect'), -1, 0, 2)
      .attr(MultiHitAttr)
      .makesContact(false),
    new StatusMove(Moves.LOCK_ON, i18next.t('move:lockOn.name'), Type.NORMAL, -1, 5, i18next.t('move:lockOn.effect'), -1, 0, 2)
      .attr(IgnoreAccuracyAttr),
    new AttackMove(Moves.OUTRAGE, i18next.t('move:outrage.name'), Type.DRAGON, MoveCategory.PHYSICAL, 120, 100, 10, i18next.t('move:outrage.effect'), -1, 0, 2)
      .attr(FrenzyAttr)
      .attr(MissEffectAttr, frenzyMissFunc)
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new StatusMove(Moves.SANDSTORM, i18next.t('move:sandstorm.name'), Type.ROCK, -1, 10, i18next.t('move:sandstorm.effect'), -1, 0, 2)
      .attr(WeatherChangeAttr, WeatherType.SANDSTORM)
      .windMove()
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.GIGA_DRAIN, i18next.t('move:gigaDrain.name'), Type.GRASS, MoveCategory.SPECIAL, 75, 100, 10, i18next.t('move:gigaDrain.effect'), -1, 0, 2)
      .attr(HitHealAttr)
      .triageMove(),
    new SelfStatusMove(Moves.ENDURE, i18next.t('move:endure.name'), Type.NORMAL, -1, 10, i18next.t('move:endure.effect'), -1, 4, 2)
      .attr(EndureAttr),
    new StatusMove(Moves.CHARM, i18next.t('move:charm.name'), Type.FAIRY, 100, 20, i18next.t('move:charm.effect'), -1, 0, 2)
      .attr(StatChangeAttr, BattleStat.ATK, -2),
    new AttackMove(Moves.ROLLOUT, i18next.t('move:rollout.name'), Type.ROCK, MoveCategory.PHYSICAL, 30, 90, 20, i18next.t('move:rollout.effect'), -1, 0, 2)
      .attr(ConsecutiveUseDoublePowerAttr, 5, true, true, Moves.DEFENSE_CURL),
    new AttackMove(Moves.FALSE_SWIPE, i18next.t('move:falseSwipe.name'), Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 40, i18next.t('move:falseSwipe.effect'), -1, 0, 2)
      .attr(SurviveDamageAttr),
    new StatusMove(Moves.SWAGGER, i18next.t('move:swagger.name'), Type.NORMAL, 85, 15, i18next.t('move:swagger.effect'), -1, 0, 2)
      .attr(StatChangeAttr, BattleStat.ATK, 2)
      .attr(ConfuseAttr),
    new SelfStatusMove(Moves.MILK_DRINK, i18next.t('move:milkDrink.name'), Type.NORMAL, -1, 5, i18next.t('move:milkDrink.effect'), -1, 0, 2)
      .attr(HealAttr, 0.5)
      .triageMove(),
    new AttackMove(Moves.SPARK, i18next.t('move:spark.name'), Type.ELECTRIC, MoveCategory.PHYSICAL, 65, 100, 20, i18next.t('move:spark.effect'), 30, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.FURY_CUTTER, i18next.t('move:furyCutter.name'), Type.BUG, MoveCategory.PHYSICAL, 40, 95, 20, i18next.t('move:furyCutter.effect'), -1, 0, 2)
      .attr(ConsecutiveUseDoublePowerAttr, 3, true)
      .slicingMove(),
    new AttackMove(Moves.STEEL_WING, i18next.t('move:steelWing.name'), Type.STEEL, MoveCategory.PHYSICAL, 70, 90, 25, i18next.t('move:steelWing.effect'), 10, 0, 2)
      .attr(StatChangeAttr, BattleStat.DEF, 1, true),
    new StatusMove(Moves.MEAN_LOOK, i18next.t('move:meanLook.name'), Type.NORMAL, -1, 5, i18next.t('move:meanLook.effect'), -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, true, 1),
    new StatusMove(Moves.ATTRACT, i18next.t('move:attract.name'), Type.NORMAL, 100, 15, i18next.t('move:attract.effect'), -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.INFATUATED)
      .condition((user, target, move) => user.isOppositeGender(target)),
    new SelfStatusMove(Moves.SLEEP_TALK, i18next.t('move:sleepTalk.name'), Type.NORMAL, -1, 10, i18next.t('move:sleepTalk.effect'), -1, 0, 2)
      .attr(BypassSleepAttr)
      .attr(RandomMovesetMoveAttr)
      .condition((user, target, move) => user.status?.effect === StatusEffect.SLEEP),
    new StatusMove(Moves.HEAL_BELL, i18next.t('move:healBell.name'), Type.NORMAL, -1, 5, i18next.t('move:healBell.effect'), -1, 0, 2)
      .soundBased()
      .target(MoveTarget.USER_AND_ALLIES),
    new AttackMove(Moves.RETURN, i18next.t('move:return.name'), Type.NORMAL, MoveCategory.PHYSICAL, -1, 100, 20, i18next.t('move:return.effect'), -1, 0, 2)
      .attr(FriendshipPowerAttr),
    new AttackMove(Moves.PRESENT, i18next.t('move:present.name'), Type.NORMAL, MoveCategory.PHYSICAL, -1, 90, 15, i18next.t('move:present.effect'), -1, 0, 2)
      .attr(PresentPowerAttr)
      .makesContact(false),
    new AttackMove(Moves.FRUSTRATION, i18next.t('move:frustration.name'), Type.NORMAL, MoveCategory.PHYSICAL, -1, 100, 20, i18next.t('move:frustration.effect'), -1, 0, 2)
      .attr(FriendshipPowerAttr, true),
    new StatusMove(Moves.SAFEGUARD, i18next.t('move:safeguard.name'), Type.NORMAL, -1, 25, i18next.t('move:safeguard.effect'), -1, 0, 2)
      .target(MoveTarget.USER_SIDE),
    new StatusMove(Moves.PAIN_SPLIT, i18next.t('move:painSplit.name'), Type.NORMAL, -1, 20, i18next.t('move:painSplit.effect'), -1, 0, 2)
      .attr(HpSplitAttr)
      .condition(failOnBossCondition),
    new AttackMove(Moves.SACRED_FIRE, i18next.t('move:sacredFire.name'), Type.FIRE, MoveCategory.PHYSICAL, 100, 95, 5, i18next.t('move:sacredFire.effect'), 50, 0, 2)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .makesContact(false),
    new AttackMove(Moves.MAGNITUDE, i18next.t('move:magnitude.name'), Type.GROUND, MoveCategory.PHYSICAL, -1, 100, 30, i18next.t('move:magnitude.effect'), -1, 0, 2)
      .attr(PreMoveMessageAttr, magnitudeMessageFunc)
      .attr(MagnitudePowerAttr)
      .attr(HitsTagAttr, BattlerTagType.UNDERGROUND, true)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.DYNAMIC_PUNCH, i18next.t('move:dynamicPunch.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 100, 50, 5, i18next.t('move:dynamicPunch.effect'), 100, 0, 2)
      .attr(ConfuseAttr)
      .punchingMove(),
    new AttackMove(Moves.MEGAHORN, i18next.t('move:megahorn.name'), Type.BUG, MoveCategory.PHYSICAL, 120, 85, 10, i18next.t('move:megahorn.effect'), -1, 0, 2),
    new AttackMove(Moves.DRAGON_BREATH, i18next.t('move:dragonBreath.name'), Type.DRAGON, MoveCategory.SPECIAL, 60, 100, 20, i18next.t('move:dragonBreath.effect'), 30, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new SelfStatusMove(Moves.BATON_PASS, i18next.t('move:batonPass.name'), Type.NORMAL, -1, 40, i18next.t('move:batonPass.effect'), -1, 0, 2)
      .attr(ForceSwitchOutAttr, true, true)
      .hidesUser(),
    new StatusMove(Moves.ENCORE, i18next.t('move:encore.name'), Type.NORMAL, 100, 5, i18next.t('move:encore.effect'), -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.ENCORE, false, true)
      .condition((user, target, move) => new EncoreTag(user.id).canAdd(target)),
    new AttackMove(Moves.PURSUIT, i18next.t('move:pursuit.name'), Type.DARK, MoveCategory.PHYSICAL, 40, 100, 20, i18next.t('move:pursuit.effect'), -1, 0, 2),
    new AttackMove(Moves.RAPID_SPIN, i18next.t('move:rapidSpin.name'), Type.NORMAL, MoveCategory.PHYSICAL, 50, 100, 40, i18next.t('move:rapidSpin.effect'), 100, 0, 2)
      .attr(StatChangeAttr, BattleStat.SPD, 1, true)
      .attr(RemoveBattlerTagAttr, [ BattlerTagType.BIND, BattlerTagType.WRAP, BattlerTagType.FIRE_SPIN, BattlerTagType.WHIRLPOOL, BattlerTagType.CLAMP, BattlerTagType.SAND_TOMB, BattlerTagType.MAGMA_STORM, BattlerTagType.THUNDER_CAGE, BattlerTagType.SEEDED ], true),
    new StatusMove(Moves.SWEET_SCENT, i18next.t('move:sweetScent.name'), Type.NORMAL, 100, 20, i18next.t('move:sweetScent.effect'), -1, 0, 2)
      .attr(StatChangeAttr, BattleStat.EVA, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.IRON_TAIL, i18next.t('move:ironTail.name'), Type.STEEL, MoveCategory.PHYSICAL, 100, 75, 15, i18next.t('move:ironTail.effect'), 30, 0, 2)
      .attr(StatChangeAttr, BattleStat.DEF, -1),
    new AttackMove(Moves.METAL_CLAW, i18next.t('move:metalClaw.name'), Type.STEEL, MoveCategory.PHYSICAL, 50, 95, 35, i18next.t('move:metalClaw.effect'), 10, 0, 2)
      .attr(StatChangeAttr, BattleStat.ATK, 1, true),
    new AttackMove(Moves.VITAL_THROW, i18next.t('move:vitalThrow.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 70, -1, 10, i18next.t('move:vitalThrow.effect'), -1, -1, 2),
    new SelfStatusMove(Moves.MORNING_SUN, i18next.t('move:morningSun.name'), Type.NORMAL, -1, 5, i18next.t('move:morningSun.effect'), -1, 0, 2)
      .attr(PlantHealAttr)
      .triageMove(),
    new SelfStatusMove(Moves.SYNTHESIS, i18next.t('move:synthesis.name'), Type.GRASS, -1, 5, i18next.t('move:synthesis.effect'), -1, 0, 2)
      .attr(PlantHealAttr)
      .triageMove(),
    new SelfStatusMove(Moves.MOONLIGHT, i18next.t('move:moonlight.name'), Type.FAIRY, -1, 5, i18next.t('move:moonlight.effect'), -1, 0, 2)
      .attr(PlantHealAttr)
      .triageMove(),
    new AttackMove(Moves.HIDDEN_POWER, i18next.t('move:hiddenPower.name'), Type.NORMAL, MoveCategory.SPECIAL, 60, 100, 15, i18next.t('move:hiddenPower.effect'), -1, 0, 2)
      .attr(HiddenPowerTypeAttr),
    new AttackMove(Moves.CROSS_CHOP, i18next.t('move:crossChop.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 100, 80, 5, i18next.t('move:crossChop.effect'), -1, 0, 2)
      .attr(HighCritAttr),
    new AttackMove(Moves.TWISTER, i18next.t('move:twister.name'), Type.DRAGON, MoveCategory.SPECIAL, 40, 100, 20, i18next.t('move:twister.effect'), 20, 0, 2)
      .attr(HitsTagAttr, BattlerTagType.FLYING, true)
      .attr(FlinchAttr)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.RAIN_DANCE, i18next.t('move:rainDance.name'), Type.WATER, -1, 5, i18next.t('move:rainDance.effect'), -1, 0, 2)
      .attr(WeatherChangeAttr, WeatherType.RAIN)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(Moves.SUNNY_DAY, i18next.t('move:sunnyDay.name'), Type.FIRE, -1, 5, i18next.t('move:sunnyDay.effect'), -1, 0, 2)
      .attr(WeatherChangeAttr, WeatherType.SUNNY)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.CRUNCH, i18next.t('move:crunch.name'), Type.DARK, MoveCategory.PHYSICAL, 80, 100, 15, i18next.t('move:crunch.effect'), 20, 0, 2)
      .attr(StatChangeAttr, BattleStat.DEF, -1)
      .bitingMove(),
    new AttackMove(Moves.MIRROR_COAT, i18next.t('move:mirrorCoat.name'), Type.PSYCHIC, MoveCategory.SPECIAL, -1, 100, 20, i18next.t('move:mirrorCoat.effect'), -1, -5, 2)
      .attr(CounterDamageAttr, (move: Move) => move.category === MoveCategory.SPECIAL, 2)
      .target(MoveTarget.ATTACKER),
    new StatusMove(Moves.PSYCH_UP, i18next.t('move:psychUp.name'), Type.NORMAL, -1, 10, i18next.t('move:psychUp.name'), -1, 0, 2),
    new AttackMove(Moves.EXTREME_SPEED, i18next.t('move:extremeSpeed.name'), Type.NORMAL, MoveCategory.PHYSICAL, 80, 100, 5, i18next.t('move:extremeSpeed.effect'), -1, 2, 2),
    new AttackMove(Moves.ANCIENT_POWER, i18next.t('move:ancientPower.name'), Type.ROCK, MoveCategory.SPECIAL, 60, 100, 5, i18next.t('move:ancientPower.effect'), 10, 0, 2)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF, BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD ], 1, true),
    new AttackMove(Moves.SHADOW_BALL, i18next.t('move:shadowBall.name'), Type.GHOST, MoveCategory.SPECIAL, 80, 100, 15, i18next.t('move:shadowBall.effect'), 20, 0, 2)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1)
      .ballBombMove(),
    new AttackMove(Moves.FUTURE_SIGHT, i18next.t('move:futureSight.name'), Type.PSYCHIC, MoveCategory.SPECIAL, 120, 100, 10, i18next.t('move:futureSight.effect'), -1, 0, 2)
      .attr(DelayedAttackAttr, ArenaTagType.FUTURE_SIGHT, ChargeAnim.FUTURE_SIGHT_CHARGING, 'foresaw\nan attack!'),
    new AttackMove(Moves.ROCK_SMASH, i18next.t('move:rockSmash.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 40, 100, 15, i18next.t('move:rockSmash.effect'), 50, 0, 2)
      .attr(StatChangeAttr, BattleStat.DEF, -1),
    new AttackMove(Moves.WHIRLPOOL, i18next.t('move:whirlpool.name'), Type.WATER, MoveCategory.SPECIAL, 35, 85, 15, i18next.t('move:whirlpool.effect'), 100, 0, 2)
      .attr(TrapAttr, BattlerTagType.WHIRLPOOL)
      .attr(HitsTagAttr, BattlerTagType.UNDERWATER, true),
    new AttackMove(Moves.BEAT_UP, i18next.t('move:beatUp.name'), Type.DARK, MoveCategory.PHYSICAL, -1, 100, 10, i18next.t('move:beatUp.effect'), -1, 0, 2)
      .makesContact(false),
    new AttackMove(Moves.FAKE_OUT, i18next.t('move:fakeOut.name'), Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 10, i18next.t('move:fakeOut.effect'), 100, 3, 3)
      .attr(FlinchAttr)
      .condition(new FirstMoveCondition()),
    new AttackMove(Moves.UPROAR, i18next.t('move:uproar.name'), Type.NORMAL, MoveCategory.SPECIAL, 90, 100, 10, i18next.t('move:uproar.effect'), -1, 0, 3)
      .ignoresVirtual()
      .soundBased()
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new SelfStatusMove(Moves.STOCKPILE, i18next.t('move:stockpile.name'), Type.NORMAL, -1, 20, i18next.t('move:stockpile.effect'), -1, 0, 3),
    new AttackMove(Moves.SPIT_UP, i18next.t('move:spitUp.name'), Type.NORMAL, MoveCategory.SPECIAL, -1, 100, 10, i18next.t('move:spitUp.effect'), -1, 0, 3),
    new SelfStatusMove(Moves.SWALLOW, i18next.t('move:swallow.name'), Type.NORMAL, -1, 10, i18next.t('move:swallow.effect'), -1, 0, 3)
      .triageMove(),
    new AttackMove(Moves.HEAT_WAVE, i18next.t('move:heatWave.name'), Type.FIRE, MoveCategory.SPECIAL, 95, 90, 10, i18next.t('move:heatWave.effect'), 10, 0, 3)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.HAIL, i18next.t('move:hail.name'), Type.ICE, -1, 10, i18next.t('move:hail.effect'), -1, 0, 3)
      .attr(WeatherChangeAttr, WeatherType.HAIL)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(Moves.TORMENT, i18next.t('move:torment.name'), Type.DARK, 100, 15, i18next.t('move:torment.effect'), -1, 0, 3),
    new StatusMove(Moves.FLATTER, i18next.t('move:flatter.name'), Type.DARK, 100, 15, i18next.t('move:flatter.effect'), -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPATK, 1)
      .attr(ConfuseAttr),
    new StatusMove(Moves.WILL_O_WISP, i18next.t('move:willOWisp.name'), Type.FIRE, 85, 15,  i18next.t('move:willOWisp.effect'), -1, 0, 3)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new StatusMove(Moves.MEMENTO,  i18next.t('move:memento.name'), Type.DARK, 100, 10, i18next.t('move:memento.effect'), -1, 0, 3)
      .attr(SacrificialAttr)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.SPATK ], -2),
    new AttackMove(Moves.FACADE, i18next.t('move:facade.name'), Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 20, i18next.t('move:facade.effect'), -1, 0, 3)
      .attr(MovePowerMultiplierAttr, (user, target, move) => user.status
        && (user.status.effect === StatusEffect.BURN || user.status.effect === StatusEffect.POISON || user.status.effect === StatusEffect.TOXIC || user.status.effect === StatusEffect.PARALYSIS) ? 2 : 1),
    new AttackMove(Moves.FOCUS_PUNCH, i18next.t('move:focusPunch.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 150, 100, 20, i18next.t('move:focusPunch.effect'), -1, -3, 3)
      .punchingMove()
      .ignoresVirtual()
      .condition((user, target, move) => !user.turnData.attacksReceived.find(r => r.damage)),
    new AttackMove(Moves.SMELLING_SALTS, i18next.t('move:smellingSalts.name'), Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 10, i18next.t('move:smellingSalts.effect'), -1, 0, 3)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.status?.effect === StatusEffect.PARALYSIS ? 2 : 1)
      .attr(HealStatusEffectAttr, true, StatusEffect.PARALYSIS),
    new SelfStatusMove(Moves.FOLLOW_ME, i18next.t('move:followMe.name'), Type.NORMAL, -1, 20, i18next.t('move:followMe.effect'), -1, 2, 3),
    new StatusMove(Moves.NATURE_POWER, i18next.t('move:naturePower.name'), Type.NORMAL, -1, 20, i18next.t('move:naturePower.effect'), -1, 0, 3)
      .attr(NaturePowerAttr)
      .ignoresVirtual(),
    new SelfStatusMove(Moves.CHARGE, i18next.t('move:charge.name'), Type.ELECTRIC, -1, 20, i18next.t('move:charge.effect'), -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPDEF, 1, true),
    new StatusMove(Moves.TAUNT, i18next.t('move:taunt.name'), Type.DARK, 100, 20, i18next.t('move:taunt.effect'), -1, 0, 3),
    new StatusMove(Moves.HELPING_HAND, i18next.t('move:helpingHand.name'), Type.NORMAL, -1, 20, i18next.t('move:helpingHand.effect'), -1, 5, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.HELPING_HAND)
      .target(MoveTarget.NEAR_ALLY),
    new StatusMove(Moves.TRICK, i18next.t('move:trick.name'), Type.PSYCHIC, 100, 10, i18next.t('move:trick.effect'), -1, 0, 3),
    new StatusMove(Moves.ROLE_PLAY, i18next.t('move:rolePlay.name'), Type.PSYCHIC, -1, 10, i18next.t('move:rolePlay.effect'), -1, 0, 3)
      .attr(AbilityCopyAttr),
    new SelfStatusMove(Moves.WISH, i18next.t('move:wish.name'), Type.NORMAL, -1, 10, i18next.t('move:wish.effect'), -1, 0, 3)
      .triageMove(),
    new SelfStatusMove(Moves.ASSIST, i18next.t('move:assist.name'), Type.NORMAL, -1, 20, i18next.t('move:assist.effect'), -1, 0, 3)
      .attr(RandomMovesetMoveAttr, true)
      .ignoresVirtual(),
    new SelfStatusMove(Moves.INGRAIN, i18next.t('move:ingrain.name'), Type.GRASS, -1, 20, i18next.t('move:ingrain.effect'), -1, 0, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.INGRAIN, true, true),
    new AttackMove(Moves.SUPERPOWER, i18next.t('move:superpower.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 120, 100, 5, i18next.t('move:superpower.effect'), 100, 0, 3)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF ], -1, true),
    new SelfStatusMove(Moves.MAGIC_COAT, i18next.t('move:magicCoat.name'), Type.PSYCHIC, -1, 15, i18next.t('move:magicCoat.effect'), -1, 4, 3),
    new SelfStatusMove(Moves.RECYCLE, i18next.t('move:recycle.name'), Type.NORMAL, -1, 10, i18next.t('move:recycle.effect'), -1, 0, 3),
    new AttackMove(Moves.REVENGE, i18next.t('move:revenge.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 60, 100, 10, i18next.t('move:revenge.effect'), -1, -4, 3)
      .attr(TurnDamagedDoublePowerAttr),
    new AttackMove(Moves.BRICK_BREAK, i18next.t('move:brickBreak.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 75, 100, 15, i18next.t('move:brickBreak.effect'), -1, 0, 3)
        .attr(RemoveScreensAttr),
    new StatusMove(Moves.YAWN, i18next.t('move:yawn.name'), Type.NORMAL, -1, 10, i18next.t('move:yawn.effect'), -1, 0, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.DROWSY, false, true)
      .condition((user, target, move) => !target.status),
    new AttackMove(Moves.KNOCK_OFF, i18next.t('move:knockOff.name'), Type.DARK, MoveCategory.PHYSICAL, 65, 100, 20, i18next.t('move:knockOff.effect'), -1, 0, 3),
    new AttackMove(Moves.ENDEAVOR, i18next.t('move:endeavor.name'), Type.NORMAL, MoveCategory.PHYSICAL, -1, 100, 5, i18next.t('move:endeavor.effect'), -1, 0, 3)
      .attr(MatchHpAttr)
      .condition(failOnBossCondition),
    new AttackMove(Moves.ERUPTION, i18next.t('move:eruption.name'), Type.FIRE, MoveCategory.SPECIAL, 150, 100, 5, i18next.t('move:eruption.effect'), -1, 0, 3)
      .attr(HpPowerAttr)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.SKILL_SWAP, i18next.t('move:skillSwap.name'), Type.PSYCHIC, -1, 10, i18next.t('move:skillSwap.effect'), -1, 0, 3)
      .attr(SwitchAbilitiesAttr),
    new SelfStatusMove(Moves.IMPRISON, i18next.t('move:imprison.name'), Type.PSYCHIC, -1, 10, i18next.t('move:imprison.effect'), -1, 0, 3),
    new SelfStatusMove(Moves.REFRESH, i18next.t('move:refresh.name'), Type.NORMAL, -1, 20, i18next.t('move:refresh.effect'), -1, 0, 3)
      .attr(HealStatusEffectAttr, true, StatusEffect.PARALYSIS, StatusEffect.POISON, StatusEffect.TOXIC, StatusEffect.BURN)
      .condition((user, target, move) => user.status && (user.status.effect === StatusEffect.PARALYSIS || user.status.effect === StatusEffect.POISON || user.status.effect === StatusEffect.TOXIC || user.status.effect === StatusEffect.BURN)),
    new SelfStatusMove(Moves.GRUDGE, i18next.t('move:grudge.name'), Type.GHOST, -1, 5, i18next.t('move:grudge.effect'), -1, 0, 3),
    new SelfStatusMove(Moves.SNATCH, i18next.t('move:snatch.name'), Type.DARK, -1, 10, i18next.t('move:snatch.effect'), -1, 4, 3),
    new AttackMove(Moves.SECRET_POWER, i18next.t('move:secretPower.name'), Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 20, i18next.t('move:secretPower.effect'), 30, 0, 3)
      .makesContact(false),
    new AttackMove(Moves.DIVE, i18next.t('move:dive.name'), Type.WATER, MoveCategory.PHYSICAL, 80, 100, 10, i18next.t('move:dive.effect'), -1, 0, 3)
      .attr(ChargeAttr, ChargeAnim.DIVE_CHARGING, 'hid\nunderwater!', BattlerTagType.UNDERWATER)
      .ignoresVirtual(),
    new AttackMove(Moves.ARM_THRUST, i18next.t('move:armThrust.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 15, 100, 20, i18next.t('move:armThrust.effect'), -1, 0, 3)
      .attr(MultiHitAttr),
    new SelfStatusMove(Moves.CAMOUFLAGE, i18next.t('move:camouflage.name'), Type.NORMAL, -1, 20, i18next.t('move:camouflage.effect'), -1, 0, 3)
      .attr(CopyBiomeTypeAttr),
    new SelfStatusMove(Moves.TAIL_GLOW, i18next.t('move:tailGlow.name'), Type.BUG, -1, 20, i18next.t('move:tailGlow.effect'), -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPATK, 3, true),
    new AttackMove(Moves.LUSTER_PURGE, i18next.t('move:lusterPurge.name'), Type.PSYCHIC, MoveCategory.SPECIAL, 95, 100, 5, i18next.t('move:lusterPurge.effect'), 50, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1),
    new AttackMove(Moves.MIST_BALL, i18next.t('move:mistBall.name'), Type.PSYCHIC, MoveCategory.SPECIAL, 95, 100, 5, i18next.t('move:mistBall.effect'), 50, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPATK, -1)
      .ballBombMove(),
    new StatusMove(Moves.FEATHER_DANCE, i18next.t('move:featherDance.name'), Type.FLYING, 100, 15, i18next.t('move:featherDance.effect'), -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.ATK, -2)
      .danceMove(),
    new StatusMove(Moves.TEETER_DANCE, i18next.t('move:teeterDance.name'), Type.NORMAL, 100, 20, i18next.t('move:teeterDance.effect'), -1, 0, 3)
      .attr(ConfuseAttr)
      .danceMove()
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.BLAZE_KICK, i18next.t('move:blazeKick.name'), Type.FIRE, MoveCategory.PHYSICAL, 85, 90, 10, i18next.t('move:blazeKick.effect'), 10, 0, 3)
      .attr(HighCritAttr)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new StatusMove(Moves.MUD_SPORT, i18next.t('move:mudSport.name'), Type.GROUND, -1, 15, i18next.t('move:mudSport.effect'), -1, 0, 3)
      .attr(AddArenaTagAttr, ArenaTagType.MUD_SPORT, 5)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.ICE_BALL, i18next.t('move:iceBall.name'), Type.ICE, MoveCategory.PHYSICAL, 30, 90, 20, i18next.t('move:iceBall.effect'), -1, 0, 3)
      .attr(ConsecutiveUseDoublePowerAttr, 5, true, true, Moves.DEFENSE_CURL)
      .ballBombMove(),
    new AttackMove(Moves.NEEDLE_ARM, i18next.t('move:needleArm.name'), Type.GRASS, MoveCategory.PHYSICAL, 60, 100, 15, i18next.t('move:needleArm.effect'), 30, 0, 3)
      .attr(FlinchAttr),
    new SelfStatusMove(Moves.SLACK_OFF, i18next.t('move:slackOff.name'), Type.NORMAL, -1, 5, i18next.t('move:slackOff.effect'), -1, 0, 3)
      .attr(HealAttr, 0.5)
      .triageMove(),
    new AttackMove(Moves.HYPER_VOICE, i18next.t('move:hyperVoice.name'), Type.NORMAL, MoveCategory.SPECIAL, 90, 100, 10, i18next.t('move:hyperVoice.effect'), -1, 0, 3)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.POISON_FANG, i18next.t('move:poisonFang.name'), Type.POISON, MoveCategory.PHYSICAL, 50, 100, 15, i18next.t('move:poisonFang.effect'), 50, 0, 3)
      .attr(StatusEffectAttr, StatusEffect.TOXIC)
      .bitingMove(),
    new AttackMove(Moves.CRUSH_CLAW, i18next.t('move:crushClaw.name'), Type.NORMAL, MoveCategory.PHYSICAL, 75, 95, 10, i18next.t('move:crushClaw.effect'), 50, 0, 3)
      .attr(StatChangeAttr, BattleStat.DEF, -1),
    new AttackMove(Moves.BLAST_BURN, i18next.t('move:blastBurn.name'), Type.FIRE, MoveCategory.SPECIAL, 150, 90, 5, i18next.t('move:blastBurn.effect'), -1, 0, 3)
      .attr(RechargeAttr),
    new AttackMove(Moves.HYDRO_CANNON, i18next.t('move:hydroCannon.name'), Type.WATER, MoveCategory.SPECIAL, 150, 90, 5, i18next.t('move:hydroCannon.effect'), -1, 0, 3)
      .attr(RechargeAttr),
    new AttackMove(Moves.METEOR_MASH, i18next.t('move:meteorMash.name'), Type.STEEL, MoveCategory.PHYSICAL, 90, 90, 10, i18next.t('move:meteorMash.effect'), 20, 0, 3)
      .attr(StatChangeAttr, BattleStat.ATK, 1, true)
      .punchingMove(),
    new AttackMove(Moves.ASTONISH, i18next.t('move:astonish.name'), Type.GHOST, MoveCategory.PHYSICAL, 30, 100, 15, i18next.t('move:astonish.effect'), 30, 0, 3)
      .attr(FlinchAttr),
    new AttackMove(Moves.WEATHER_BALL, i18next.t('move:weatherBall.name'), Type.NORMAL, MoveCategory.SPECIAL, 50, 100, 10, i18next.t('move:weatherBall.effect'), -1, 0, 3)
      .attr(WeatherBallTypeAttr)
      .attr(MovePowerMultiplierAttr, (user, target, move) => [WeatherType.SUNNY, WeatherType.RAIN, WeatherType.SANDSTORM, WeatherType.HAIL, WeatherType.SNOW, WeatherType.FOG, WeatherType.HEAVY_RAIN, WeatherType.HARSH_SUN].includes(user.scene.arena.weather?.weatherType) && !user.scene.arena.weather?.isEffectSuppressed(user.scene) ? 2 : 1)
      .ballBombMove(),
    new StatusMove(Moves.AROMATHERAPY, i18next.t('move:aromatherapy.name'), Type.GRASS, -1, 5, i18next.t('move:aromatherapy.effect'), -1, 0, 3)
      .target(MoveTarget.USER_AND_ALLIES),
    new StatusMove(Moves.FAKE_TEARS, i18next.t('move:fakeTears.name'), Type.DARK, 100, 20, i18next.t('move:fakeTears.effect'), -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPDEF, -2),
    new AttackMove(Moves.AIR_CUTTER, i18next.t('move:airCutter.name'), Type.FLYING, MoveCategory.SPECIAL, 60, 95, 25, i18next.t('move:airCutter.effect'), -1, 0, 3)
      .attr(HighCritAttr)
      .slicingMove()
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.OVERHEAT, i18next.t('move:overheat.name'), Type.FIRE, MoveCategory.SPECIAL, 130, 90, 5, i18next.t('move:overheat.effect'), 100, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPATK, -2, true)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE),
    new StatusMove(Moves.ODOR_SLEUTH, i18next.t('move:odorSleuth.name'), Type.NORMAL, -1, 40, i18next.t('move:odorSleuth.effect'), -1, 0, 3),
    new AttackMove(Moves.ROCK_TOMB, i18next.t('move:rockTomb.name'), Type.ROCK, MoveCategory.PHYSICAL, 60, 95, 15, i18next.t('move:rockTomb.effect'), 100, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPD, -1)
      .makesContact(false),
    new AttackMove(Moves.SILVER_WIND, i18next.t('move:silverWind.name'), Type.BUG, MoveCategory.SPECIAL, 60, 100, 5, i18next.t('move:silverWind.effect'), 10, 0, 3)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF, BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD ], 1, true)
      .windMove(),
    new StatusMove(Moves.METAL_SOUND, i18next.t('move:metalSound.name'), Type.STEEL, 85, 40, i18next.t('move:metalSound.effect'), -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPDEF, -2)
      .soundBased(),
    new StatusMove(Moves.GRASS_WHISTLE, i18next.t('move:grassWhistle.name'), Type.GRASS, 55, 15, i18next.t('move:grassWhistle.effect'), -1, 0, 3)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .soundBased(),
    new StatusMove(Moves.TICKLE, i18next.t('move:tickle.name'), Type.NORMAL, 100, 20, i18next.t('move:tickle.effect'), -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.ATK, -1)
      .attr(StatChangeAttr, BattleStat.DEF, -1),
    new SelfStatusMove(Moves.COSMIC_POWER, i18next.t('move:cosmicPower.name'), Type.PSYCHIC, -1, 20, i18next.t('move:cosmicPower.effect'), -1, 0, 3)
      .attr(StatChangeAttr, [ BattleStat.DEF, BattleStat.SPDEF ], 1, true),
    new AttackMove(Moves.WATER_SPOUT, i18next.t('move:waterSpout.name'), Type.WATER, MoveCategory.SPECIAL, 150, 100, 5, i18next.t('move:waterSpout.effect'), -1, 0, 3)
      .attr(HpPowerAttr)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.SIGNAL_BEAM, i18next.t('move:signalBeam.name'), Type.BUG, MoveCategory.SPECIAL, 75, 100, 15, i18next.t('move:signalBeam.effect'), 10, 0, 3)
      .attr(ConfuseAttr),
    new AttackMove(Moves.SHADOW_PUNCH, i18next.t('move:shadowPunch.name'), Type.GHOST, MoveCategory.PHYSICAL, 60, -1, 20, i18next.t('move:shadowPunch.effect'), -1, 0, 3)
      .punchingMove(),
    new AttackMove(Moves.EXTRASENSORY, i18next.t('move:extrasensory.name'), Type.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 20, i18next.t('move:extrasensory.effect'), 10, 0, 3)
      .attr(FlinchAttr),
    new AttackMove(Moves.SKY_UPPERCUT, i18next.t('move:skyUppercut.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 85, 90, 15,  i18next.t('move:skyUppercut.effect'), -1, 0, 3)
      .attr(HitsTagAttr, BattlerTagType.FLYING)
      .punchingMove(),
    new AttackMove(Moves.SAND_TOMB,  i18next.t('move:sandTomb.name'), Type.GROUND, MoveCategory.PHYSICAL, 35, 85, 15, i18next.t('move:sandTomb.effect'), 100, 0, 3)
      .attr(TrapAttr, BattlerTagType.SAND_TOMB)
      .makesContact(false),
    new AttackMove(Moves.SHEER_COLD, i18next.t('move:sheerCold.name'), Type.ICE, MoveCategory.SPECIAL, -1, 30, 5, i18next.t('move:sheerCold.effect'), -1, 0, 3)
      .attr(OneHitKOAttr)
      .attr(OneHitKOAccuracyAttr),
    new AttackMove(Moves.MUDDY_WATER, i18next.t('move:muddyWater.name'), Type.WATER, MoveCategory.SPECIAL, 90, 85, 10, i18next.t('move:muddyWater.effect'), 30, 0, 3)
      .attr(StatChangeAttr, BattleStat.ACC, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.BULLET_SEED, i18next.t('move:bulletSeed.name'), Type.GRASS, MoveCategory.PHYSICAL, 25, 100, 30, i18next.t('move:bulletSeed.effect'), -1, 0, 3)
      .attr(MultiHitAttr)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(Moves.AERIAL_ACE, i18next.t('move:aerialAce.name'), Type.FLYING, MoveCategory.PHYSICAL, 60, -1, 20, i18next.t('move:aerialAce.effect'), -1, 0, 3)
      .slicingMove(),
    new AttackMove(Moves.ICICLE_SPEAR, i18next.t('move:icicleSpear.name'), Type.ICE, MoveCategory.PHYSICAL, 25, 100, 30, i18next.t('move:icicleSpear.effect'), -1, 0, 3)
      .attr(MultiHitAttr)
      .makesContact(false),
    new SelfStatusMove(Moves.IRON_DEFENSE, i18next.t('move:ironDefense.name'), Type.STEEL, -1, 15, i18next.t('move:ironDefense.effect'), -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.DEF, 2, true),
    new StatusMove(Moves.BLOCK, i18next.t('move:block.name'), Type.NORMAL, -1, 5, i18next.t('move:block.effect'), -1, 0, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, true, 1),
    new StatusMove(Moves.HOWL, i18next.t('move:howl.name'), Type.NORMAL, -1, 40, i18next.t('move:howl.name'), -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.ATK, 1)
      .soundBased()
      .target(MoveTarget.USER_AND_ALLIES),
    new AttackMove(Moves.DRAGON_CLAW, i18next.t('move:dragonClaw.name'), Type.DRAGON, MoveCategory.PHYSICAL, 80, 100, 15, i18next.t('move:dragonClaw.effect'), -1, 0, 3),
    new AttackMove(Moves.FRENZY_PLANT, i18next.t('move:frenzyPlant.name'), Type.GRASS, MoveCategory.SPECIAL, 150, 90, 5, i18next.t('move:frenzyPlant.effect'), -1, 0, 3)
      .attr(RechargeAttr),
    new SelfStatusMove(Moves.BULK_UP, i18next.t('move:bulkUp.name'), Type.FIGHTING, -1, 20, i18next.t('move:bulkUp.effect'), -1, 0, 3)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF ], 1, true),
    new AttackMove(Moves.BOUNCE, i18next.t('move:bounce.name'), Type.FLYING, MoveCategory.PHYSICAL, 85, 85, 5, i18next.t('move:bounce.effect'), 30, 0, 3)
      .attr(ChargeAttr, ChargeAnim.BOUNCE_CHARGING, 'sprang up!', BattlerTagType.FLYING)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .condition(failOnGravityCondition)
      .ignoresVirtual(),
    new AttackMove(Moves.MUD_SHOT, i18next.t('move:mudShot.name'), Type.GROUND, MoveCategory.SPECIAL, 55, 95, 15, i18next.t('move:mudShot.effect'), 100, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPD, -1),
    new AttackMove(Moves.POISON_TAIL, i18next.t('move:poisonTail.name'), Type.POISON, MoveCategory.PHYSICAL, 50, 100, 25, i18next.t('move:poisonTail.effect'), 10, 0, 3)
      .attr(HighCritAttr)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(Moves.COVET, i18next.t('move:covet.name'), Type.NORMAL, MoveCategory.PHYSICAL, 60, 100, 25, i18next.t('move:covet.effect'), -1, 0, 3)
      .attr(StealHeldItemChanceAttr, 0.3),
    new AttackMove(Moves.VOLT_TACKLE, i18next.t('move:voltTackle.name'), Type.ELECTRIC, MoveCategory.PHYSICAL, 120, 100, 15, i18next.t('move:voltTackle.effect'), 10, 0, 3)
      .attr(RecoilAttr, false, 0.33)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.MAGICAL_LEAF, i18next.t('move:magicalLeaf.name'), Type.GRASS, MoveCategory.SPECIAL, 60, -1, 20, i18next.t('move:magicalLeaf.effect'), -1, 0, 3),
    new StatusMove(Moves.WATER_SPORT, i18next.t('move:waterSport.name'), Type.WATER, -1, 15, i18next.t('move:waterSport.effect'), -1, 0, 3)
      .attr(AddArenaTagAttr, ArenaTagType.WATER_SPORT, 5)
      .target(MoveTarget.BOTH_SIDES),
    new SelfStatusMove(Moves.CALM_MIND, i18next.t('move:calmMind.name'), Type.PSYCHIC, -1, 20, i18next.t('move:calmMind.effect'), -1, 0, 3)
      .attr(StatChangeAttr, [ BattleStat.SPATK, BattleStat.SPDEF ], 1, true),
    new AttackMove(Moves.LEAF_BLADE, i18next.t('move:leafBlade.name'), Type.GRASS, MoveCategory.PHYSICAL, 90, 100, 15, i18next.t('move:leafBlade.effect'), -1, 0, 3)
      .attr(HighCritAttr)
      .slicingMove(),
    new SelfStatusMove(Moves.DRAGON_DANCE, i18next.t('move:dragonDance.name'), Type.DRAGON, -1, 20, i18next.t('move:dragonDance.effect'), -1, 0, 3)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.SPD ], 1, true)
      .danceMove(),
    new AttackMove(Moves.ROCK_BLAST, i18next.t('move:rockBlast.name'), Type.ROCK, MoveCategory.PHYSICAL, 25, 90, 10, i18next.t('move:rockBlast.effect'), -1, 0, 3)
      .attr(MultiHitAttr)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(Moves.SHOCK_WAVE, i18next.t('move:shockWave.name'), Type.ELECTRIC, MoveCategory.SPECIAL, 60, -1, 20, i18next.t('move:shockWave.effect'), -1, 0, 3),
    new AttackMove(Moves.WATER_PULSE, i18next.t('move:waterPulse.name'), Type.WATER, MoveCategory.SPECIAL, 60, 100, 20, i18next.t('move:waterPulse.effect'), 20, 0, 3)
      .attr(ConfuseAttr)
      .pulseMove(),
    new AttackMove(Moves.DOOM_DESIRE, i18next.t('move:doomDesire.name'), Type.STEEL, MoveCategory.SPECIAL, 140, 100, 5, i18next.t('move:doomDesire.effect'), -1, 0, 3)
      .attr(DelayedAttackAttr, ArenaTagType.DOOM_DESIRE, ChargeAnim.DOOM_DESIRE_CHARGING, 'chose\nDOOM DESIRE as its destiny!'),
    new AttackMove(Moves.PSYCHO_BOOST, i18next.t('move:psychoBoost.name'), Type.PSYCHIC, MoveCategory.SPECIAL, 140, 90, 5, i18next.t('move:psychoBoost.effect'), 100, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPATK, -2, true),
    new SelfStatusMove(Moves.ROOST, i18next.t('move:roost.name'), Type.FLYING, -1, 5, i18next.t('move:roost.effect'), -1, 0, 4)
      .attr(HealAttr, 0.5)
      .attr(AddBattlerTagAttr, BattlerTagType.IGNORE_FLYING, true, false, 1)
      .triageMove(),
    new StatusMove(Moves.GRAVITY, i18next.t('move:gravity.name'), Type.PSYCHIC, -1, 5, i18next.t('move:gravity.effect'), -1, 0, 4)
      .attr(AddArenaTagAttr, ArenaTagType.GRAVITY, 5)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(Moves.MIRACLE_EYE, i18next.t('move:miracleEye.name'), Type.PSYCHIC, -1, 40, i18next.t('move:miracleEye.effect'), -1, 0, 4),
    new AttackMove(Moves.WAKE_UP_SLAP, i18next.t('move:wakeUpSlap.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 70, 100, 10, i18next.t('move:wakeUpSlap.effect'), -1, 0, 4)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.status?.effect === StatusEffect.SLEEP ? 2 : 1)
      .attr(HealStatusEffectAttr, false, StatusEffect.SLEEP),
    new AttackMove(Moves.HAMMER_ARM, i18next.t('move:hammerArm.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 100, 90, 10, i18next.t('move:hammerArm.effect'), 100, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPD, -1, true)
      .punchingMove(),
    new AttackMove(Moves.GYRO_BALL, i18next.t('move:gyroBall.name'), Type.STEEL, MoveCategory.PHYSICAL, -1, 100, 5, i18next.t('move:gyroBall.effect'), -1, 0, 4)
      .attr(BattleStatRatioPowerAttr, Stat.SPD, true)
      .ballBombMove(),
    new SelfStatusMove(Moves.HEALING_WISH, i18next.t('move:healingWish.name'), Type.PSYCHIC, -1, 10, i18next.t('move:healingWish.effect'), -1, 0, 4)
      .attr(SacrificialFullRestoreAttr)
      .triageMove(),
    new AttackMove(Moves.BRINE, i18next.t('move:brine.name'), Type.WATER, MoveCategory.SPECIAL, 65, 100, 10, i18next.t('move:brine.effect'), -1, 0, 4)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.getHpRatio() < 0.5 ? 2 : 1),
    new AttackMove(Moves.NATURAL_GIFT, i18next.t('move:naturalGift.name'), Type.NORMAL, MoveCategory.PHYSICAL, -1, 100, 15, i18next.t('move:naturalGift.effect'), -1, 0, 4)
      .makesContact(false),
    new AttackMove(Moves.FEINT, i18next.t('move:feint.name'), Type.NORMAL, MoveCategory.PHYSICAL, 30, 100, 10, i18next.t('move:feint.effect'), -1, 2, 4)
      .attr(RemoveBattlerTagAttr, [ BattlerTagType.PROTECTED ])
      .makesContact(false)
      .ignoresProtect(),
    new AttackMove(Moves.PLUCK, i18next.t('move:pluck.name'), Type.FLYING, MoveCategory.PHYSICAL, 60, 100, 20, i18next.t('move:pluck.effect'), -1, 0, 4),
    new StatusMove(Moves.TAILWIND, i18next.t('move:tailwind.name'), Type.FLYING, -1, 15, i18next.t('move:tailwind.effect'), -1, 0, 4)
      .windMove()
      .target(MoveTarget.USER_SIDE),
    new StatusMove(Moves.ACUPRESSURE, i18next.t('move:acupressure.name'), Type.NORMAL, -1, 30, i18next.t('move:acupressure.effect'), -1, 0, 4)
      .attr(StatChangeAttr, BattleStat.RAND, 2)
      .target(MoveTarget.USER_OR_NEAR_ALLY),
    new AttackMove(Moves.METAL_BURST, i18next.t('move:metalBurst.name'), Type.STEEL, MoveCategory.PHYSICAL, -1, 100, 10, i18next.t('move:metalBurst.effect'), -1, 0, 4)
      .attr(CounterDamageAttr, (move: Move) => (move.category === MoveCategory.PHYSICAL || move.category === MoveCategory.SPECIAL), 1.5)
      .makesContact(false)
      .target(MoveTarget.ATTACKER),
    new AttackMove(Moves.U_TURN, i18next.t('move:uTurn.name'), Type.BUG, MoveCategory.PHYSICAL, 70, 100, 20, i18next.t('move:uTurn.effect'), -1, 0, 4)
      .attr(ForceSwitchOutAttr, true),
    new AttackMove(Moves.CLOSE_COMBAT, i18next.t('move:closeCombat.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 120, 100, 5, i18next.t('move:closeCombat.name'), 100, 0, 4)
      .attr(StatChangeAttr, [ BattleStat.DEF, BattleStat.SPDEF ], -1, true),
    new AttackMove(Moves.PAYBACK, i18next.t('move:payback.name'), Type.DARK, MoveCategory.PHYSICAL, 50, 100, 10, i18next.t('move:payback.effect'), -1, 0, 4),
    new AttackMove(Moves.ASSURANCE, i18next.t('move:assurance.name'), Type.DARK, MoveCategory.PHYSICAL, 60, 100, 10, i18next.t('move:assurance.effect'), -1, 0, 4),
    new StatusMove(Moves.EMBARGO, i18next.t('move:embargo.name'), Type.DARK, 100, 15, i18next.t('move:embargo.effect'), -1, 0, 4),
    new AttackMove(Moves.FLING, i18next.t('move:fling.name'), Type.DARK, MoveCategory.PHYSICAL, -1, 100, 10, i18next.t('move:fling.effect'), -1, 0, 4)
      .makesContact(false),
    new StatusMove(Moves.PSYCHO_SHIFT, i18next.t('move:psychoShift.name'), Type.PSYCHIC, 100, 10, i18next.t('move:psychoShift.effect'), -1, 0, 4),
    new AttackMove(Moves.TRUMP_CARD, i18next.t('move:trumpCard.name'), Type.NORMAL, MoveCategory.SPECIAL, -1, -1, 5, i18next.t('move:trumpCard.effect'), -1, 0, 4)
      .makesContact(),
    new StatusMove(Moves.HEAL_BLOCK, i18next.t('move:healBlock.name'), Type.PSYCHIC, 100, 15, i18next.t('move:healBlock.effect'), -1, 0, 4)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.WRING_OUT, i18next.t('move:wringOut.name'), Type.NORMAL, MoveCategory.SPECIAL, -1, 100, 5, i18next.t('move:wringOut.effect'), -1, 0, 4)
      .attr(OpponentHighHpPowerAttr)
      .makesContact(),
    new SelfStatusMove(Moves.POWER_TRICK, i18next.t('move:powerTrick.name'), Type.PSYCHIC, -1, 10, i18next.t('move:powerTrick.effect'), -1, 0, 4),
    new StatusMove(Moves.GASTRO_ACID, i18next.t('move:gastroAcid.name'), Type.POISON, 100, 10, i18next.t('move:gastroAcid.effect'), -1, 0, 4),
    new StatusMove(Moves.LUCKY_CHANT, i18next.t('move:luckyChant.name'), Type.NORMAL, -1, 30, i18next.t('move:luckyChant.effect'), -1, 0, 4)
      .attr(AddBattlerTagAttr, BattlerTagType.NO_CRIT, false, false, 5)
      .target(MoveTarget.USER_SIDE),
    new StatusMove(Moves.ME_FIRST, i18next.t('move:meFirst.name'), Type.NORMAL, -1, 20, i18next.t('move:meFirst.effect'), -1, 0, 4)
      .ignoresVirtual()
      .target(MoveTarget.NEAR_ENEMY),
    new SelfStatusMove(Moves.COPYCAT, i18next.t('move:copycat.name'), Type.NORMAL, -1, 20, i18next.t('move:copycat.effect'), -1, 0, 4)
      .attr(CopyMoveAttr)
      .ignoresVirtual(),
    new StatusMove(Moves.POWER_SWAP, i18next.t('move:powerSwap.name'), Type.PSYCHIC, -1, 10, i18next.t('move:powerSwap.effect'), -1, 0, 4),
    new StatusMove(Moves.GUARD_SWAP, i18next.t('move:guardSwap.name'), Type.PSYCHIC, -1, 10, i18next.t('move:guardSwap.effect'), -1, 0, 4),
    new AttackMove(Moves.PUNISHMENT, i18next.t('move:punishment.name'), Type.DARK, MoveCategory.PHYSICAL, -1, 100, 5, i18next.t('move:punishment.effect'), -1, 0, 4),
    new AttackMove(Moves.LAST_RESORT, i18next.t('move:lastResort.name'), Type.NORMAL, MoveCategory.PHYSICAL, 140, 100, 5, i18next.t('move:lastResort.effect'), -1, 0, 4)
      .condition((user, target, move) => {
        const uniqueUsedMoveIds = new Set<Moves>();
        const movesetMoveIds = user.getMoveset().map(m => m.moveId);
        user.getMoveHistory().map(m => {
          if (m.move !== move.id && movesetMoveIds.find(mm => mm === m.move))
            uniqueUsedMoveIds.add(m.move);
        });
        return uniqueUsedMoveIds.size >= movesetMoveIds.length - 1;
      }),
    new StatusMove(Moves.WORRY_SEED, i18next.t('move:worrySeed.name'), Type.GRASS, 100, 10, i18next.t('move:worrySeed.effect'), -1, 0, 4)
      .attr(AbilityChangeAttr, Abilities.INSOMNIA),
    new AttackMove(Moves.SUCKER_PUNCH, i18next.t('move:suckerPunch.name'), Type.DARK, MoveCategory.PHYSICAL, 70, 100, 5, i18next.t('move:suckerPunch.effect'), -1, 1, 4)
      .condition((user, target, move) => user.scene.currentBattle.turnCommands[target.getBattlerIndex()].command === Command.FIGHT && !target.turnData.acted && allMoves[user.scene.currentBattle.turnCommands[target.getBattlerIndex()].move.move].category !== MoveCategory.STATUS),
    new StatusMove(Moves.TOXIC_SPIKES, i18next.t('move:toxicSpikes.name'), Type.POISON, -1, 20, i18next.t('move:toxicSpikes.effect'), -1, 0, 4)
      .attr(AddArenaTrapTagAttr, ArenaTagType.TOXIC_SPIKES)
      .target(MoveTarget.ENEMY_SIDE),
    new StatusMove(Moves.HEART_SWAP, i18next.t('move:heartSwap.name'), Type.PSYCHIC, -1, 10, i18next.t('move:heartSwap.effect'), -1, 0, 4),
    new SelfStatusMove(Moves.AQUA_RING, i18next.t('move:aquaRing.name'), Type.WATER, -1, 20, i18next.t('move:aquaRing.effect'), -1, 0, 4)
      .attr(AddBattlerTagAttr, BattlerTagType.AQUA_RING, true, true),
    new SelfStatusMove(Moves.MAGNET_RISE, i18next.t('move:magnetRise.name'), Type.ELECTRIC, -1, 10, i18next.t('move:magnetRise.effect'), -1, 0, 4),
    new AttackMove(Moves.FLARE_BLITZ, i18next.t('move:flareBlitz.name'), Type.FIRE, MoveCategory.PHYSICAL, 120, 100, 15, i18next.t('move:flareBlitz.effect'), 10, 0, 4)
      .attr(RecoilAttr, false, 0.33)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .condition(failOnGravityCondition),
    new AttackMove(Moves.FORCE_PALM, i18next.t('move:forcePalm.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 60, 100, 10, i18next.t('move:forcePalm.effect'), 30, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.AURA_SPHERE, i18next.t('move:auraSphere.name'), Type.FIGHTING, MoveCategory.SPECIAL, 80, -1, 20, i18next.t('move:auraSphere.effect'), -1, 0, 4)
      .pulseMove()
      .ballBombMove(),
    new SelfStatusMove(Moves.ROCK_POLISH, i18next.t('move:rockPolish.name'), Type.ROCK, -1, 20,i18next.t('move:rockPolish.effect'), -1, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPD, 2, true),
    new AttackMove(Moves.POISON_JAB, i18next.t('move:poisonJab.name'), Type.POISON, MoveCategory.PHYSICAL, 80, 100, 20, i18next.t('move:poisonJab.effect'), 30, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(Moves.DARK_PULSE, i18next.t('move:darkPulse.name'), Type.DARK, MoveCategory.SPECIAL, 80, 100, 15, i18next.t('move:darkPulse.effect'), 20, 0, 4)
      .attr(FlinchAttr)
      .pulseMove(),
    new AttackMove(Moves.NIGHT_SLASH, i18next.t('move:nightSlash.name'), Type.DARK, MoveCategory.PHYSICAL, 70, 100, 15, i18next.t('move:nightSlash.effect'), -1, 0, 4)
      .attr(HighCritAttr)
      .slicingMove(),
    new AttackMove(Moves.AQUA_TAIL, i18next.t('move:aquaTail.name'), Type.WATER, MoveCategory.PHYSICAL, 90, 90, 10, i18next.t('move:aquaTail.effect'), -1, 0, 4),
    new AttackMove(Moves.SEED_BOMB, i18next.t('move:seedBomb.name'), Type.GRASS, MoveCategory.PHYSICAL, 80, 100, 15, i18next.t('move:seedBomb.effect'), -1, 0, 4)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(Moves.AIR_SLASH, i18next.t('move:airSlash.name'), Type.FLYING, MoveCategory.SPECIAL, 75, 95, 15, i18next.t('move:airSlash.effect'), 30, 0, 4)
      .attr(FlinchAttr)
      .slicingMove(),
    new AttackMove(Moves.X_SCISSOR, i18next.t('move:xScissor.name'), Type.BUG, MoveCategory.PHYSICAL, 80, 100, 15, i18next.t('move:xScissor.effect'), -1, 0, 4)
      .slicingMove(),
    new AttackMove(Moves.BUG_BUZZ, i18next.t('move:bugBuzz.name'), Type.BUG, MoveCategory.SPECIAL, 90, 100, 10, i18next.t('move:bugBuzz.effect'), 10, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1)
      .soundBased(),
    new AttackMove(Moves.DRAGON_PULSE, i18next.t('move:dragonPulse.name'), Type.DRAGON, MoveCategory.SPECIAL, 85, 100, 10, i18next.t('move:dragonPulse.effect'), -1, 0, 4)
      .pulseMove(),
    new AttackMove(Moves.DRAGON_RUSH, i18next.t('move:dragonRush.name'), Type.DRAGON, MoveCategory.PHYSICAL, 100, 75, 10, i18next.t('move:dragonRush.effect'), 20, 0, 4)
      .attr(FlinchAttr),
    new AttackMove(Moves.POWER_GEM, i18next.t('move:powerGem.name'), Type.ROCK, MoveCategory.SPECIAL, 80, 100, 20, i18next.t('move:powerGem.effect'), -1, 0, 4),
    new AttackMove(Moves.DRAIN_PUNCH, i18next.t('move:drainPunch.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 75, 100, 10, i18next.t('move:drainPunch.effect'), -1, 0, 4)
      .attr(HitHealAttr)
      .punchingMove()
      .triageMove(),
    new AttackMove(Moves.VACUUM_WAVE, i18next.t('move:vacuumWave.name'), Type.FIGHTING, MoveCategory.SPECIAL, 40, 100, 30, i18next.t('move:vacuumWave.effect'), -1, 1, 4),
    new AttackMove(Moves.FOCUS_BLAST, i18next.t('move:focusBlast.name'), Type.FIGHTING, MoveCategory.SPECIAL, 120, 70, 5, i18next.t('move:focusBlast.effect'), 10, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1)
      .ballBombMove(),
    new AttackMove(Moves.ENERGY_BALL, i18next.t('move:energyBall.name'), Type.GRASS, MoveCategory.SPECIAL, 90, 100, 10, i18next.t('move:energyBall.effect'), 10, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1)
      .ballBombMove(),
    new AttackMove(Moves.BRAVE_BIRD, i18next.t('move:braveBird.name'), Type.FLYING, MoveCategory.PHYSICAL, 120, 100, 15, i18next.t('move:braveBird.effect'), -1, 0, 4)
      .attr(RecoilAttr, false, 0.33),
    new AttackMove(Moves.EARTH_POWER, i18next.t('move:earthPower.name'), Type.GROUND, MoveCategory.SPECIAL, 90, 100, 10, i18next.t('move:earthPower.effect'), 10, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1),
    new StatusMove(Moves.SWITCHEROO, i18next.t('move:switcheroo.name'), Type.DARK, 100, 10, i18next.t('move:switcheroo.effect'), -1, 0, 4),
    new AttackMove(Moves.GIGA_IMPACT, i18next.t('move:gigaImpact.name'), Type.NORMAL, MoveCategory.PHYSICAL, 150, 90, 5, i18next.t('move:gigaImpact.effect'), -1, 0, 4)
      .attr(RechargeAttr),
    new SelfStatusMove(Moves.NASTY_PLOT, i18next.t('move:nastyPlot.name'), Type.DARK, -1, 20, i18next.t('move:nastyPlot.effect'), -1, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPATK, 2, true),
    new AttackMove(Moves.BULLET_PUNCH, i18next.t('move:bulletPunch.name'), Type.STEEL, MoveCategory.PHYSICAL, 40, 100, 30, i18next.t('move:bulletPunch.effect'), -1, 1, 4)
      .punchingMove(),
    new AttackMove(Moves.AVALANCHE, i18next.t('move:avalanche.name'), Type.ICE, MoveCategory.PHYSICAL, 60, 100, 10, i18next.t('move:avalanche.effect'), -1, -4, 4)
      .attr(TurnDamagedDoublePowerAttr),
    new AttackMove(Moves.ICE_SHARD, i18next.t('move:iceShard.name'), Type.ICE, MoveCategory.PHYSICAL, 40, 100, 30, i18next.t('move:iceShard.effect'), -1, 1, 4)
      .makesContact(false),
    new AttackMove(Moves.SHADOW_CLAW, i18next.t('move:shadowClaw.name'), Type.GHOST, MoveCategory.PHYSICAL, 70, 100, 15, i18next.t('move:shadowClaw.effect'), -1, 0, 4)
      .attr(HighCritAttr),
    new AttackMove(Moves.THUNDER_FANG, i18next.t('move:thunderFang.name'), Type.ELECTRIC, MoveCategory.PHYSICAL, 65, 95, 15, i18next.t('move:thunderFang.effect'), 10, 0, 4)
      .attr(FlinchAttr)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .bitingMove(),
    new AttackMove(Moves.ICE_FANG, i18next.t('move:iceFang.name'), Type.ICE, MoveCategory.PHYSICAL, 65, 95, 15, i18next.t('move:iceFang.effect'), 10, 0, 4)
      .attr(FlinchAttr)
      .attr(StatusEffectAttr, StatusEffect.FREEZE)
      .bitingMove(),
    new AttackMove(Moves.FIRE_FANG, i18next.t('move:fireFang.name'), Type.FIRE, MoveCategory.PHYSICAL, 65, 95, 15, i18next.t('move:fireFang.effect'), 10, 0, 4)
      .attr(FlinchAttr)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .bitingMove(),
    new AttackMove(Moves.SHADOW_SNEAK, i18next.t('move:shadowSneak.name'), Type.GHOST, MoveCategory.PHYSICAL, 40, 100, 30, i18next.t('move:shadowSneak.effect'), -1, 1, 4),
    new AttackMove(Moves.MUD_BOMB, i18next.t('move:mudBomb.name'), Type.GROUND, MoveCategory.SPECIAL, 65, 85, 10, i18next.t('move:mudBomb.effect'), 30, 0, 4)
      .attr(StatChangeAttr, BattleStat.ACC, -1)
      .ballBombMove(),
    new AttackMove(Moves.PSYCHO_CUT, i18next.t('move:psychoCut.name'), Type.PSYCHIC, MoveCategory.PHYSICAL, 70, 100, 20, i18next.t('move:psychoCut.effect'), -1, 0, 4)
      .attr(HighCritAttr)
      .slicingMove()
      .makesContact(false),
    new AttackMove(Moves.ZEN_HEADBUTT, i18next.t('move:zenHeadbutt.name'), Type.PSYCHIC, MoveCategory.PHYSICAL, 80, 90, 15, i18next.t('move:zenHeadbutt.effect'), 20, 0, 4)
      .attr(FlinchAttr),
    new AttackMove(Moves.MIRROR_SHOT, i18next.t('move:mirrorShot.name'), Type.STEEL, MoveCategory.SPECIAL, 65, 85, 10, i18next.t('move:mirrorShot.effect'), 30, 0, 4)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new AttackMove(Moves.FLASH_CANNON, i18next.t('move:flashCannon.name'), Type.STEEL, MoveCategory.SPECIAL, 80, 100, 10, i18next.t('move:flashCannon.effect'), 10, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1),
    new AttackMove(Moves.ROCK_CLIMB, i18next.t('move:rockClimb.name'), Type.NORMAL, MoveCategory.PHYSICAL, 90, 85, 20, i18next.t('move:rockClimb.effect'), 20, 0, 4)
      .attr(ConfuseAttr),
    new StatusMove(Moves.DEFOG, i18next.t('move:defog.name'), Type.FLYING, -1, 15, i18next.t('move:defog.effect'), -1, 0, 4)
      .attr(StatChangeAttr, BattleStat.EVA, -1)
      .attr(ClearWeatherAttr, WeatherType.FOG)
      .attr(ClearTerrainAttr)
      .attr(RemoveScreensAttr, true),
    new StatusMove(Moves.TRICK_ROOM, i18next.t('move:trickRoom.name'), Type.PSYCHIC, -1, 5, i18next.t('move:trickRoom.effect'), -1, -7, 4)
      .attr(AddArenaTagAttr, ArenaTagType.TRICK_ROOM, 5)
      .ignoresProtect()
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.DRACO_METEOR, i18next.t('move:dracoMeteor.name'), Type.DRAGON, MoveCategory.SPECIAL, 130, 90, 5, i18next.t('move:dracoMeteor.effect'), 100, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPATK, -2, true),
    new AttackMove(Moves.DISCHARGE, i18next.t('move:discharge.name'), Type.ELECTRIC, MoveCategory.SPECIAL, 80, 100, 15, i18next.t('move:discharge.effect'), 30, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.LAVA_PLUME, i18next.t('move:lavaPlume.name'), Type.FIRE, MoveCategory.SPECIAL, 80, 100, 15, i18next.t('move:lavaPlume.effect'), 30, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.LEAF_STORM, i18next.t('move:leafStorm.name'), Type.GRASS, MoveCategory.SPECIAL, 130, 90, 5, i18next.t('move:leafStorm.effect'), 100, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPATK, -2, true),
    new AttackMove(Moves.POWER_WHIP, i18next.t('move:powerWhip.name'), Type.GRASS, MoveCategory.PHYSICAL, 120, 85, 10, i18next.t('move:powerWhip.effect'), -1, 0, 4),
    new AttackMove(Moves.ROCK_WRECKER, i18next.t('move:rockWrecker.name'), Type.ROCK, MoveCategory.PHYSICAL, 150, 90, 5, i18next.t('move:rockWrecker.effect'), -1, 0, 4)
      .attr(RechargeAttr)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(Moves.CROSS_POISON, i18next.t('move:crossPoison.name'), Type.POISON, MoveCategory.PHYSICAL, 70, 100, 20, i18next.t('move:crossPoison.effect'), 10, 0, 4)
      .attr(HighCritAttr)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .slicingMove(),
    new AttackMove(Moves.GUNK_SHOT, i18next.t('move:gunkShot.name'), Type.POISON, MoveCategory.PHYSICAL, 120, 80, 5, i18next.t('move:gunkShot.effect'), 30, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .makesContact(false),
    new AttackMove(Moves.IRON_HEAD, i18next.t('move:ironHead.name'), Type.STEEL, MoveCategory.PHYSICAL, 80, 100, 15, i18next.t('move:ironHead.effect'), 30, 0, 4)
      .attr(FlinchAttr),
    new AttackMove(Moves.MAGNET_BOMB, i18next.t('move:magnetBomb.name'), Type.STEEL, MoveCategory.PHYSICAL, 60, -1, 20, i18next.t('move:magnetBomb.effect'), -1, 0, 4)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(Moves.STONE_EDGE, i18next.t('move:stoneEdge.name'), Type.ROCK, MoveCategory.PHYSICAL, 100, 80, 5, i18next.t('move:stoneEdge.effect'), -1, 0, 4)
      .attr(HighCritAttr)
      .makesContact(false),
    new StatusMove(Moves.CAPTIVATE, i18next.t('move:captivate.name'), Type.NORMAL, 100, 20, i18next.t('move:captivate.effect'), -1, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPATK, -2)
      .condition((user, target, move) => target.isOppositeGender(user))
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.STEALTH_ROCK, i18next.t('move:stealthRock.name'), Type.ROCK, -1, 20, i18next.t('move:stealthRock.effect'), -1, 0, 4)
      .attr(AddArenaTrapTagAttr, ArenaTagType.STEALTH_ROCK)
      .target(MoveTarget.ENEMY_SIDE),
    new AttackMove(Moves.GRASS_KNOT, i18next.t('move:grassKnot.name'), Type.GRASS, MoveCategory.SPECIAL, -1, 100, 20, i18next.t('move:grassKnot.effect'), -1, 0, 4)
      .attr(WeightPowerAttr)
      .makesContact(),
    new AttackMove(Moves.CHATTER, i18next.t('move:chatter.name'), Type.FLYING, MoveCategory.SPECIAL, 65, 100, 20, i18next.t('move:chatter.effect'), 100, 0, 4)
      .attr(ConfuseAttr)
      .soundBased(),
    new AttackMove(Moves.JUDGMENT, i18next.t('move:judgment.name'), Type.NORMAL, MoveCategory.SPECIAL, 100, 100, 10, i18next.t('move:judgment.effect'), -1, 0, 4),
    new AttackMove(Moves.BUG_BITE, i18next.t('move:bugBite.name'), Type.BUG, MoveCategory.PHYSICAL, 60, 100, 20, i18next.t('move:bugBite.effect'), -1, 0, 4),
    new AttackMove(Moves.CHARGE_BEAM, i18next.t('move:chargeBeam.name'), Type.ELECTRIC, MoveCategory.SPECIAL, 50, 90, 10, i18next.t('move:chargeBeam.effect'), 70, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPATK, 1, true),
    new AttackMove(Moves.WOOD_HAMMER, i18next.t('move:woodHammer.name'), Type.GRASS, MoveCategory.PHYSICAL, 120, 100, 15, i18next.t('move:woodHammer.effect'), -1, 0, 4)
      .attr(RecoilAttr, false, 0.33),
    new AttackMove(Moves.AQUA_JET, i18next.t('move:aquaJet.name'), Type.WATER, MoveCategory.PHYSICAL, 40, 100, 20, i18next.t('move:aquaJet.effect'), -1, 1, 4),
    new AttackMove(Moves.ATTACK_ORDER, i18next.t('move:attackOrder.name'), Type.BUG, MoveCategory.PHYSICAL, 90, 100, 15, i18next.t('move:attackOrder.effect'), -1, 0, 4)
      .attr(HighCritAttr)
      .makesContact(false),
    new SelfStatusMove(Moves.DEFEND_ORDER, i18next.t('move:defendOrder.name'), Type.BUG, -1, 10, i18next.t('move:defendOrder.effect'), -1, 0, 4)
      .attr(StatChangeAttr, [ BattleStat.DEF, BattleStat.SPDEF ], 1, true),
    new SelfStatusMove(Moves.HEAL_ORDER, i18next.t('move:healOrder.name'), Type.BUG, -1, 10, i18next.t('move:healOrder.effect'), -1, 0, 4)
      .attr(HealAttr, 0.5)
      .triageMove(),
    new AttackMove(Moves.HEAD_SMASH, i18next.t('move:headSmash.name'), Type.ROCK, MoveCategory.PHYSICAL, 150, 80, 5, i18next.t('move:headSmash.effect'), -1, 0, 4)
      .attr(RecoilAttr, false, 0.5),
    new AttackMove(Moves.DOUBLE_HIT, i18next.t('move:doubleHit.name'), Type.NORMAL, MoveCategory.PHYSICAL, 35, 90, 10, i18next.t('move:doubleHit.effect'), -1, 0, 4)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.ROAR_OF_TIME, i18next.t('move:roarOfTime.name'), Type.DRAGON, MoveCategory.SPECIAL, 150, 90, 5, i18next.t('move:roarOfTime.effect'), -1, 0, 4)
      .attr(RechargeAttr),
    new AttackMove(Moves.SPACIAL_REND, i18next.t('move:spacialRend.name'), Type.DRAGON, MoveCategory.SPECIAL, 100, 95, 5, i18next.t('move:spacialRend.effect'), -1, 0, 4)
      .attr(HighCritAttr),
    new SelfStatusMove(Moves.LUNAR_DANCE, i18next.t('move:lunarDance.name'), Type.PSYCHIC, -1, 10, i18next.t('move:lunarDance.effect'), -1, 0, 4)
      .attr(SacrificialAttr)
      .danceMove()
      .triageMove(),
    new AttackMove(Moves.CRUSH_GRIP, i18next.t('move:crushGrip.name'), Type.NORMAL, MoveCategory.PHYSICAL, -1, 100, 5, i18next.t('move:crushGrip.effect'), -1, 0, 4)
      .attr(OpponentHighHpPowerAttr),
    new AttackMove(Moves.MAGMA_STORM, i18next.t('move:magmaStorm.name'), Type.FIRE, MoveCategory.SPECIAL, 100, 75, 5, i18next.t('move:magmaStorm.effect'), 100, 0, 4)
      .attr(TrapAttr, BattlerTagType.MAGMA_STORM),
    new StatusMove(Moves.DARK_VOID, i18next.t('move:darkVoid.name'), Type.DARK, 50, 10, i18next.t('move:darkVoid.effect'), -1, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.SEED_FLARE, i18next.t('move:seedFlare.name'), Type.GRASS, MoveCategory.SPECIAL, 120, 85, 5, i18next.t('move:seedFlare.effect'), 40, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1),
    new AttackMove(Moves.OMINOUS_WIND, i18next.t('move:ominousWind.name'), Type.GHOST, MoveCategory.SPECIAL, 60, 100, 5, i18next.t('move:ominousWind.effect'), 10, 0, 4)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF, BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD ], 1, true)
      .windMove(),
    new AttackMove(Moves.SHADOW_FORCE, i18next.t('move:shadowForce.name'), Type.GHOST, MoveCategory.PHYSICAL, 120, 100, 5, i18next.t('move:shadowForce.effect'), -1, 0, 4)
      .attr(ChargeAttr, ChargeAnim.SHADOW_FORCE_CHARGING, 'vanished\ninstantly!', BattlerTagType.HIDDEN)
      .ignoresProtect()
      .ignoresVirtual(),
    new SelfStatusMove(Moves.HONE_CLAWS, i18next.t('move:honeClaws.name'), Type.DARK, -1, 15, i18next.t('move:honeClaws.effect'), -1, 0, 5)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.ACC ], 1, true),
    new StatusMove(Moves.WIDE_GUARD, i18next.t('move:wideGuard.name'), Type.ROCK, -1, 10, i18next.t('move:wideGuard.effect'), -1, 3, 5)
      .target(MoveTarget.USER_SIDE),
    new StatusMove(Moves.GUARD_SPLIT, i18next.t('move:guardSplit.name'), Type.PSYCHIC, -1, 10, i18next.t('move:guardSplit.effect'), -1, 0, 5),
    new StatusMove(Moves.POWER_SPLIT, i18next.t('move:powerSplit.name'), Type.PSYCHIC, -1, 10, i18next.t('move:powerSplit.effect'), -1, 0, 5),
    new StatusMove(Moves.WONDER_ROOM, i18next.t('move:wonderRoom.name'), Type.PSYCHIC, -1, 10, i18next.t('move:wonderRoom.effect'), -1, 0, 5)
      .ignoresProtect()
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.PSYSHOCK, i18next.t('move:psyshock.name'), Type.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 10, i18next.t('move:psyshock.effect'), -1, 0, 5)
      .attr(DefDefAttr),
    new AttackMove(Moves.VENOSHOCK, i18next.t('move:venoshock.name'), Type.POISON, MoveCategory.SPECIAL, 65, 100, 10, i18next.t('move:venoshock.effect'), -1, 0, 5)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.status && (target.status.effect === StatusEffect.POISON || target.status.effect === StatusEffect.TOXIC) ? 2 : 1),
    new SelfStatusMove(Moves.AUTOTOMIZE, i18next.t('move:autotomize.name'), Type.STEEL, -1, 15, i18next.t('move:autotomize.effect'), -1, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPD, 2, true),
    new SelfStatusMove(Moves.RAGE_POWDER, i18next.t('move:ragePowder.name'), Type.BUG, -1, 20, i18next.t('move:ragePowder.effect'), -1, 2, 5)
      .powderMove(),
    new StatusMove(Moves.TELEKINESIS, i18next.t('move:telekinesis.name'), Type.PSYCHIC, -1, 15, i18next.t('move:telekinesis.effect'), -1, 0, 5)
      .condition(failOnGravityCondition),
    new StatusMove(Moves.MAGIC_ROOM, i18next.t('move:magicRoom.name'), Type.PSYCHIC, -1, 10, i18next.t('move:magicRoom.effect'), -1, 0, 5)
      .ignoresProtect()
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.SMACK_DOWN, i18next.t('move:smackDown.name'), Type.ROCK, MoveCategory.PHYSICAL, 50, 100, 15, i18next.t('move:smackDown.effect'), 100, 0, 5)
      .attr(AddBattlerTagAttr, BattlerTagType.IGNORE_FLYING, false, false, 5)
      .attr(HitsTagAttr, BattlerTagType.FLYING, false)
      .makesContact(false),
    new AttackMove(Moves.STORM_THROW, i18next.t('move:stormThrow.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 60, 100, 10, i18next.t('move:stormThrow.effect'), -1, 0, 5)
      .attr(CritOnlyAttr),
    new AttackMove(Moves.FLAME_BURST, i18next.t('move:flameBurst.name'), Type.FIRE, MoveCategory.SPECIAL, 70, 100, 15, i18next.t('move:flameBurst.effect'), -1, 0, 5),
    new AttackMove(Moves.SLUDGE_WAVE, i18next.t('move:sludgeWave.name'), Type.POISON, MoveCategory.SPECIAL, 95, 100, 10, i18next.t('move:sludgeWave.effect'), 10, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new SelfStatusMove(Moves.QUIVER_DANCE, i18next.t('move:quiverDance.name'), Type.BUG, -1, 20, i18next.t('move:quiverDance.effect'), -1, 0, 5)
      .attr(StatChangeAttr, [ BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD ], 1, true)
      .danceMove(),
    new AttackMove(Moves.HEAVY_SLAM, i18next.t('move:heavySlam.name'), Type.STEEL, MoveCategory.PHYSICAL, -1, 100, 10, i18next.t('move:heavySlam.effect'), -1, 0, 5)
      .attr(CompareWeightPowerAttr),
    new AttackMove(Moves.SYNCHRONOISE, i18next.t('move:synchronoise.name'), Type.PSYCHIC, MoveCategory.SPECIAL, 120, 100, 10, i18next.t('move:synchronoise.effect'), -1, 0, 5)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.ELECTRO_BALL, i18next.t('move:electroBall.name'), Type.ELECTRIC, MoveCategory.SPECIAL, -1, 100, 10, i18next.t('move:electroBall.effect'), -1, 0, 5)
      .attr(BattleStatRatioPowerAttr, Stat.SPD)
      .ballBombMove(),
    new StatusMove(Moves.SOAK, i18next.t('move:soak.name'), Type.WATER, 100, 20, i18next.t('move:soak.effect'), -1, 0, 5),
    new AttackMove(Moves.FLAME_CHARGE, i18next.t('move:flameCharge.name'), Type.FIRE, MoveCategory.PHYSICAL, 50, 100, 20, i18next.t('move:flameCharge.effect'), 100, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPD, 1, true),
    new SelfStatusMove(Moves.COIL, i18next.t('move:coil.name'), Type.POISON, -1, 20, i18next.t('move:coil.effect'), -1, 0, 5)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF, BattleStat.ACC ], 1, true),
    new AttackMove(Moves.LOW_SWEEP, i18next.t('move:lowSweep.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 65, 100, 20, i18next.t('move:lowSweep.effect'), 100, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPD, -1),
    new AttackMove(Moves.ACID_SPRAY, i18next.t('move:acidSpray.name'), Type.POISON, MoveCategory.SPECIAL, 40, 100, 20, i18next.t('move:acidSpray.effect'), 100, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPDEF, -2)
      .ballBombMove(),
    new AttackMove(Moves.FOUL_PLAY, i18next.t('move:foulPlay.name'), Type.DARK, MoveCategory.PHYSICAL, 95, 100, 15, i18next.t('move:foulPlay.effect'), -1, 0, 5)
      .attr(TargetAtkUserAtkAttr),
    new StatusMove(Moves.SIMPLE_BEAM, i18next.t('move:simpleBeam.name'), Type.NORMAL, 100, 15, i18next.t('move:simpleBeam.effect'), -1, 0, 5)
      .attr(AbilityChangeAttr, Abilities.SIMPLE),
    new StatusMove(Moves.ENTRAINMENT, i18next.t('move:entrainment.name'), Type.NORMAL, 100, 15, i18next.t('move:entrainment.effect'), -1, 0, 5)
      .attr(AbilityGiveAttr),
    new StatusMove(Moves.AFTER_YOU, i18next.t('move:afterYou.name'), Type.NORMAL, -1, 15, i18next.t('move:afterYou.effect'), -1, 0, 5)
      .ignoresProtect(),
    new AttackMove(Moves.ROUND, i18next.t('move:round.name'), Type.NORMAL, MoveCategory.SPECIAL, 60, 100, 15, i18next.t('move:round.effect'), -1, 0, 5)
      .soundBased(),
    new AttackMove(Moves.ECHOED_VOICE, i18next.t('move:echoedVoice.name'), Type.NORMAL, MoveCategory.SPECIAL, 40, 100, 15, i18next.t('move:echoedVoice.effect'), -1, 0, 5)
      .attr(ConsecutiveUseMultiBasePowerAttr, 5, false)
      .soundBased(),
    new AttackMove(Moves.CHIP_AWAY, i18next.t('move:chipAway.name'), Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 20, i18next.t('move:chipAway.effect'), -1, 0, 5)
      .attr(IgnoreOpponentStatChangesAttr),
    new AttackMove(Moves.CLEAR_SMOG, i18next.t('move:clearSmog.name'), Type.POISON, MoveCategory.SPECIAL, 50, -1, 15, i18next.t('move:clearSmog.effect'), -1, 0, 5),
    new AttackMove(Moves.STORED_POWER, i18next.t('move:storedPower.name'), Type.PSYCHIC, MoveCategory.SPECIAL, 20, 100, 10, i18next.t('move:storedPower.effect'), -1, 0, 5)
      .attr(StatChangeCountPowerAttr),
    new StatusMove(Moves.QUICK_GUARD, i18next.t('move:quickGuard.name'), Type.FIGHTING, -1, 15, i18next.t('move:quickGuard.effect'), -1, 3, 5)
      .target(MoveTarget.USER_SIDE),
    new SelfStatusMove(Moves.ALLY_SWITCH, i18next.t('move:allySwitch.name'), Type.PSYCHIC, -1, 15, i18next.t('move:allySwitch.effect'), -1, 2, 5)
      .ignoresProtect(),
    new AttackMove(Moves.SCALD, i18next.t('move:scald.name'), Type.WATER, MoveCategory.SPECIAL, 80, 100, 15, i18next.t('move:scald.effect'), 30, 0, 5)
      .attr(HealStatusEffectAttr, false, StatusEffect.FREEZE)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new SelfStatusMove(Moves.SHELL_SMASH, i18next.t('move:shellSmash.name'), Type.NORMAL, -1, 15, i18next.t('move:shellSmash.effect'), -1, 0, 5)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.SPATK, BattleStat.SPD ], 2, true)
      .attr(StatChangeAttr, [ BattleStat.DEF, BattleStat.SPDEF ], -1, true),
    new StatusMove(Moves.HEAL_PULSE, i18next.t('move:healPulse.name'), Type.PSYCHIC, -1, 10, i18next.t('move:healPulse.effect'), -1, 0, 5)
      .attr(HealAttr, 0.5, false, false)
      .pulseMove()
      .triageMove(),
    new AttackMove(Moves.HEX, i18next.t('move:hex.name'), Type.GHOST, MoveCategory.SPECIAL, 65, 100, 10, i18next.t('move:hex.effect'), -1, 0, 5)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.status ? 2 : 1),
    new AttackMove(Moves.SKY_DROP, i18next.t('move:skyDrop.name'), Type.FLYING, MoveCategory.PHYSICAL, 60, 100, 10, i18next.t('move:skyDrop.effect'), -1, 0, 5)
      .attr(ChargeAttr, ChargeAnim.SKY_DROP_CHARGING, 'took {TARGET}\ninto the sky!', BattlerTagType.FLYING) // TODO: Add 2nd turn message
      .condition(failOnGravityCondition)
      .ignoresVirtual(), 
    new SelfStatusMove(Moves.SHIFT_GEAR, i18next.t('move:shiftGear.name'), Type.STEEL, -1, 10, i18next.t('move:shiftGear.effect'), -1, 0, 5)
      .attr(StatChangeAttr, BattleStat.ATK, 1, true)
      .attr(StatChangeAttr, BattleStat.SPD, 2, true),
    new AttackMove(Moves.CIRCLE_THROW, i18next.t('move:circleThrow.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 60, 90, 10, i18next.t('move:circleThrow.effect'), -1, -6, 5)
      .attr(ForceSwitchOutAttr),
    new AttackMove(Moves.INCINERATE, i18next.t('move:incinerate.name'), Type.FIRE, MoveCategory.SPECIAL, 60, 100, 15, i18next.t('move:incinerate.effect'), -1, 0, 5)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.QUASH, i18next.t('move:quash.name'), Type.DARK, 100, 15, i18next.t('move:quash.effect'), -1, 0, 5),
    new AttackMove(Moves.ACROBATICS, i18next.t('move:acrobatics.name'), Type.FLYING, MoveCategory.PHYSICAL, 55, 100, 15, i18next.t('move:acrobatics.effect'), -1, 0, 5),
    new StatusMove(Moves.REFLECT_TYPE, i18next.t('move:reflectType.name'), Type.NORMAL, -1, 15, i18next.t('move:reflectType.effect'), -1, 0, 5)
      .attr(CopyTypeAttr),
    new AttackMove(Moves.RETALIATE, i18next.t('move:retaliate.name'), Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 5, i18next.t('move:retaliate.effect'), -1, 0, 5),
    new AttackMove(Moves.FINAL_GAMBIT, i18next.t('move:finalGambit.name'), Type.FIGHTING, MoveCategory.SPECIAL, -1, 100, 5, i18next.t('move:finalGambit.effect'), -1, 0, 5)
      .attr(UserHpDamageAttr)
      .attr(SacrificialAttr),
    new StatusMove(Moves.BESTOW, i18next.t('move:bestow.name'), Type.NORMAL, -1, 15, i18next.t('move:bestow.effect'), -1, 0, 5)
      .ignoresProtect(),
    new AttackMove(Moves.INFERNO, i18next.t('move:inferno.name'), Type.FIRE, MoveCategory.SPECIAL, 100, 50, 5, i18next.t('move:inferno.effect'), 100, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.WATER_PLEDGE, i18next.t('move:waterPledge.name'), Type.WATER, MoveCategory.SPECIAL, 80, 100, 10, i18next.t('move:waterPledge.effect'), -1, 0, 5),
    new AttackMove(Moves.FIRE_PLEDGE, i18next.t('move:firePledge.name'), Type.FIRE, MoveCategory.SPECIAL, 80, 100, 10, i18next.t('move:firePledge.effect'), -1, 0, 5),
    new AttackMove(Moves.GRASS_PLEDGE, i18next.t('move:grassPledge.name'), Type.GRASS, MoveCategory.SPECIAL, 80, 100, 10, i18next.t('move:grassPledge.effect'), -1, 0, 5),
    new AttackMove(Moves.VOLT_SWITCH, i18next.t('move:voltSwitch.name'), Type.ELECTRIC, MoveCategory.SPECIAL, 70, 100, 20, i18next.t('move:voltSwitch.effect'), -1, 0, 5)
      .attr(ForceSwitchOutAttr, true),
    new AttackMove(Moves.STRUGGLE_BUG, i18next.t('move:struggleBug.name'), Type.BUG, MoveCategory.SPECIAL, 50, 100, 20, i18next.t('move:struggleBug.effect'), 100, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPATK, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.BULLDOZE, i18next.t('move:bulldoze.name'), Type.GROUND, MoveCategory.PHYSICAL, 60, 100, 20, i18next.t('move:bulldoze.effect'), 100, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPD, -1)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.FROST_BREATH, i18next.t('move:frostBreath.name'), Type.ICE, MoveCategory.SPECIAL, 60, 90, 10, i18next.t('move:frostBreath.effect'), 100, 0, 5)
      .attr(CritOnlyAttr),
    new AttackMove(Moves.DRAGON_TAIL, i18next.t('move:dragonTail.name'), Type.DRAGON, MoveCategory.PHYSICAL, 60, 90, 10, i18next.t('move:dragonTail.effect'), -1, -6, 5)
      .attr(ForceSwitchOutAttr),
    new SelfStatusMove(Moves.WORK_UP, i18next.t('move:workUp.name'), Type.NORMAL, -1, 30, i18next.t('move:workUp.effect'), -1, 0, 5)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.SPATK ], 1, true),
    new AttackMove(Moves.ELECTROWEB, i18next.t('move:electroweb.name'), Type.ELECTRIC, MoveCategory.SPECIAL, 55, 95, 15, i18next.t('move:electroweb.effect'), 100, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPD, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.WILD_CHARGE, i18next.t('move:wildCharge.name'), Type.ELECTRIC, MoveCategory.PHYSICAL, 90, 100, 15, i18next.t('move:wildCharge.effect'), -1, 0, 5)
      .attr(RecoilAttr),
    new AttackMove(Moves.DRILL_RUN, i18next.t('move:drillRun.name'), Type.GROUND, MoveCategory.PHYSICAL, 80, 95, 10, i18next.t('move:drillRun.effect'), -1, 0, 5)
      .attr(HighCritAttr),
    new AttackMove(Moves.DUAL_CHOP, i18next.t('move:dualChop.name'), Type.DRAGON, MoveCategory.PHYSICAL, 40, 90, 15, i18next.t('move:dualChop.effect'), -1, 0, 5)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.HEART_STAMP, i18next.t('move:heartStamp.name'), Type.PSYCHIC, MoveCategory.PHYSICAL, 60, 100, 25, i18next.t('move:heartStamp.effect'), 30, 0, 5)
      .attr(FlinchAttr),
    new AttackMove(Moves.HORN_LEECH, i18next.t('move:hornLeech.name'), Type.GRASS, MoveCategory.PHYSICAL, 75, 100, 10, i18next.t('move:hornLeech.effect'), -1, 0, 5)
      .attr(HitHealAttr)
      .triageMove(),
    new AttackMove(Moves.SACRED_SWORD, i18next.t('move:sacredSword.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 90, 100, 15, i18next.t('move:sacredSword.effect'), -1, 0, 5)
      .attr(IgnoreOpponentStatChangesAttr)  
      .slicingMove(),
    new AttackMove(Moves.RAZOR_SHELL, i18next.t('move:razorShell.name'), Type.WATER, MoveCategory.PHYSICAL, 75, 95, 10, i18next.t('move:razorShell.effect'), 50, 0, 5)
      .attr(StatChangeAttr, BattleStat.DEF, -1)
      .slicingMove(),
    new AttackMove(Moves.HEAT_CRASH, i18next.t('move:heatCrash.name'), Type.FIRE, MoveCategory.PHYSICAL, -1, 100, 10, i18next.t('move:heatCrash.effect'), -1, 0, 5)
      .attr(CompareWeightPowerAttr),
    new AttackMove(Moves.LEAF_TORNADO, i18next.t('move:leafTornado.name'), Type.GRASS, MoveCategory.SPECIAL, 65, 90, 10, i18next.t('move:leafTornado.effect'), 50, 0, 5)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new AttackMove(Moves.STEAMROLLER, i18next.t('move:steamroller.name'), Type.BUG, MoveCategory.PHYSICAL, 65, 100, 20, i18next.t('move:steamroller.effect'), 30, 0, 5)
      .attr(FlinchAttr),
    new SelfStatusMove(Moves.COTTON_GUARD, i18next.t('move:cottonGuard.name'), Type.GRASS, -1, 10, i18next.t('move:cottonGuard.effect'), -1, 0, 5)
      .attr(StatChangeAttr, BattleStat.DEF, 3, true),
    new AttackMove(Moves.NIGHT_DAZE, i18next.t('move:nightDaze.name'), Type.DARK, MoveCategory.SPECIAL, 85, 95, 10, i18next.t('move:nightDaze.effect'), 40, 0, 5)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new AttackMove(Moves.PSYSTRIKE, i18next.t('move:psystrike.name'), Type.PSYCHIC, MoveCategory.SPECIAL, 100, 100, 10, i18next.t('move:psystrike.effect'), -1, 0, 5)
      .attr(DefDefAttr),
    new AttackMove(Moves.TAIL_SLAP, i18next.t('move:tailSlap.name'), Type.NORMAL, MoveCategory.PHYSICAL, 25, 85, 10, i18next.t('move:tailSlap.effect'), -1, 0, 5)
      .attr(MultiHitAttr),
    new AttackMove(Moves.HURRICANE, i18next.t('move:hurricane.name'), Type.FLYING, MoveCategory.SPECIAL, 110, 70, 10, i18next.t('move:hurricane.effect'), 30, 0, 5)
      .attr(ThunderAccuracyAttr)
      .attr(ConfuseAttr)
      .attr(HitsTagAttr, BattlerTagType.FLYING, false)
      .windMove(),
    new AttackMove(Moves.HEAD_CHARGE, i18next.t('move:headCharge.name'), Type.NORMAL, MoveCategory.PHYSICAL, 120, 100, 15, i18next.t('move:headCharge.effect'), -1, 0, 5)
      .attr(RecoilAttr),
    new AttackMove(Moves.GEAR_GRIND, i18next.t('move:gearGrind.name'), Type.STEEL, MoveCategory.PHYSICAL, 50, 85, 15, i18next.t('move:gearGrind.effect'), -1, 0, 5)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.SEARING_SHOT, i18next.t('move:searingShot.name'), Type.FIRE, MoveCategory.SPECIAL, 100, 100, 5, i18next.t('move:searingShot.effect'), 30, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .ballBombMove()
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.TECHNO_BLAST, i18next.t('move:technoBlast.name'), Type.NORMAL, MoveCategory.SPECIAL, 120, 100, 5, i18next.t('move:technoBlast.effect'), -1, 0, 5),
    new AttackMove(Moves.RELIC_SONG, i18next.t('move:relicSong.name'), Type.NORMAL, MoveCategory.SPECIAL, 75, 100, 10, i18next.t('move:relicSong.effect'), 10, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.SECRET_SWORD, i18next.t('move:secretSword.name'), Type.FIGHTING, MoveCategory.SPECIAL, 85, 100, 10, i18next.t('move:secretSword.effect'), -1, 0, 5)
      .attr(DefDefAttr)
      .slicingMove(),
    new AttackMove(Moves.GLACIATE, i18next.t('move:glaciate.name'), Type.ICE, MoveCategory.SPECIAL, 65, 95, 10, i18next.t('move:glaciate.effect'), 100, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPD, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.BOLT_STRIKE, i18next.t('move:boltStrike.name'), Type.ELECTRIC, MoveCategory.PHYSICAL, 130, 85, 5, i18next.t('move:boltStrike.effect'), 20, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.BLUE_FLARE, i18next.t('move:blueFlare.name'), Type.FIRE, MoveCategory.SPECIAL, 130, 85, 5, i18next.t('move:blueFlare.effect'), 20, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.FIERY_DANCE, i18next.t('move:fieryDance.name'), Type.FIRE, MoveCategory.SPECIAL, 80, 100, 10, i18next.t('move:fieryDance.effect'), 50, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPATK, 1, true)
      .danceMove(),
    new AttackMove(Moves.FREEZE_SHOCK, i18next.t('move:freezeShock.name'), Type.ICE, MoveCategory.PHYSICAL, 140, 90, 5, i18next.t('move:freezeShock.effect'), 30, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .makesContact(false),
    new AttackMove(Moves.ICE_BURN, i18next.t('move:iceBurn.name'), Type.ICE, MoveCategory.SPECIAL, 140, 90, 5, i18next.t('move:iceBurn.effect'), 30, 0, 5)
      .attr(ChargeAttr, ChargeAnim.ICE_BURN_CHARGING, 'became cloaked\nin freezing air!')
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .ignoresVirtual(),
    new AttackMove(Moves.SNARL, i18next.t('move:snarl.name'), Type.DARK, MoveCategory.SPECIAL, 55, 95, 15, i18next.t('move:snarl.effect'), 100, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPATK, -1)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.ICICLE_CRASH, i18next.t('move:icicleCrash.name'), Type.ICE, MoveCategory.PHYSICAL, 85, 90, 10, i18next.t('move:icicleCrash.effect'), 30, 0, 5)
      .attr(FlinchAttr)
      .makesContact(false),
    new AttackMove(Moves.V_CREATE, i18next.t('move:vCreate.name'), Type.FIRE, MoveCategory.PHYSICAL, 180, 95, 5, i18next.t('move:vCreate.effect'), 100, 0, 5)
      .attr(StatChangeAttr, [ BattleStat.DEF, BattleStat.SPDEF, BattleStat.SPD ], -1, true),
    new AttackMove(Moves.FUSION_FLARE, i18next.t('move:fusionFlare.name'), Type.FIRE, MoveCategory.SPECIAL, 100, 100, 5,  i18next.t('move:fusionFlare.effect'), -1, 0, 5)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE),
    new AttackMove(Moves.FUSION_BOLT,  i18next.t('move:fusionBolt.name'), Type.ELECTRIC, MoveCategory.PHYSICAL, 100, 100, 5, i18next.t('move:fusionBolt.effect'), -1, 0, 5)
      .makesContact(false),
    new AttackMove(Moves.FLYING_PRESS, i18next.t('move:flyingPress.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 100, 95, 10, i18next.t('move:flyingPress.effect'), -1, 0, 6),
    new StatusMove(Moves.MAT_BLOCK, i18next.t('move:matBlock.name'), Type.FIGHTING, -1, 10, i18next.t('move:matBlock.effect'), -1, 0, 6),
    new AttackMove(Moves.BELCH, i18next.t('move:belch.name'), Type.POISON, MoveCategory.SPECIAL, 120, 90, 10, i18next.t('move:belch.effect'), -1, 0, 6),
    new StatusMove(Moves.ROTOTILLER, i18next.t('move:rototiller.name'), Type.GROUND, -1, 10, i18next.t('move:rototiller.effect'), 100, 0, 6)
      .target(MoveTarget.ALL),
    new StatusMove(Moves.STICKY_WEB, i18next.t('move:stickyWeb.name'), Type.BUG, -1, 20, i18next.t('move:stickyWeb.effect'), -1, 0, 6)
      .attr(AddArenaTrapTagAttr, ArenaTagType.STICKY_WEB)
      .target(MoveTarget.ENEMY_SIDE),
    new AttackMove(Moves.FELL_STINGER, i18next.t('move:fellStinger.name'), Type.BUG, MoveCategory.PHYSICAL, 50, 100, 25, i18next.t('move:fellStinger.effect'), -1, 0, 6),
    new AttackMove(Moves.PHANTOM_FORCE, i18next.t('move:phantomForce.name'), Type.GHOST, MoveCategory.PHYSICAL, 90, 100, 10, i18next.t('move:phantomForce.effect'), -1, 0, 6)
      .attr(ChargeAttr, ChargeAnim.PHANTOM_FORCE_CHARGING, 'vanished\ninstantly!', BattlerTagType.HIDDEN)
      .ignoresProtect()
      .ignoresVirtual(),
    new StatusMove(Moves.TRICK_OR_TREAT, i18next.t('move:trickOrTreat.name'), Type.GHOST, 100, 20, i18next.t('move:trickOrTreat.effect'), -1, 0, 6),
    new StatusMove(Moves.NOBLE_ROAR, i18next.t('move:nobleRoar.name'), Type.NORMAL, 100, 30, i18next.t('move:nobleRoar.effect'), 100, 0, 6)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.SPATK ], -1)
      .soundBased(),
    new StatusMove(Moves.ION_DELUGE, i18next.t('move:ionDeluge.name'), Type.ELECTRIC, -1, 25, i18next.t('move:ionDeluge.effect'), -1, 1, 6)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.PARABOLIC_CHARGE, i18next.t('move:parabolicCharge.name'), Type.ELECTRIC, MoveCategory.SPECIAL, 65, 100, 20, i18next.t('move:parabolicCharge.effect'), -1, 0, 6)
      .attr(HitHealAttr)
      .target(MoveTarget.ALL_NEAR_OTHERS)
      .triageMove(),
    new StatusMove(Moves.FORESTS_CURSE, i18next.t('move:forestsCurse.name'), Type.GRASS, 100, 20, i18next.t('move:forestsCurse.effect'), -1, 0, 6),
    new AttackMove(Moves.PETAL_BLIZZARD, i18next.t('move:petalBlizzard.name'), Type.GRASS, MoveCategory.PHYSICAL, 90, 100, 15, i18next.t('move:petalBlizzard.effect'), -1, 0, 6)
      .windMove()
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.FREEZE_DRY, i18next.t('move:freezeDry.name'), Type.ICE, MoveCategory.SPECIAL, 70, 100, 20, i18next.t('move:freezeDry.effect'), 10, 0, 6)
      .attr(StatusEffectAttr, StatusEffect.FREEZE)
      .attr(WaterSuperEffectTypeMultiplierAttr),
    new AttackMove(Moves.DISARMING_VOICE, i18next.t('move:disarmingVoice.name'), Type.FAIRY, MoveCategory.SPECIAL, 40, -1, 15, i18next.t('move:disarmingVoice.effect'), -1, 0, 6)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.PARTING_SHOT, i18next.t('move:partingShot.name'), Type.DARK, 100, 20, i18next.t('move:partingShot.effect'), 100, 0, 6)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.SPATK ], -1)
      .attr(ForceSwitchOutAttr, true)
      .soundBased(),
    new StatusMove(Moves.TOPSY_TURVY, i18next.t('move:topsyTurvy.name'), Type.DARK, -1, 20, i18next.t('move:topsyTurvy.effect'), -1, 0, 6)
      .attr(InvertStatsAttr),
    new AttackMove(Moves.DRAINING_KISS, i18next.t('move:drainingKiss.name'), Type.FAIRY, MoveCategory.SPECIAL, 50, 100, 10, i18next.t('move:drainingKiss.effect'), -1, 0, 6)
      .attr(HitHealAttr, 0.75)
      .makesContact()
      .triageMove(),
    new StatusMove(Moves.CRAFTY_SHIELD, i18next.t('move:craftyShield.name'), Type.FAIRY, -1, 10, i18next.t('move:craftyShield.effect'), -1, 3, 6)
      .target(MoveTarget.USER_SIDE),
    new StatusMove(Moves.FLOWER_SHIELD, i18next.t('move:flowerShield.name'), Type.FAIRY, -1, 10, i18next.t('move:flowerShield.effect'), 100, 0, 6)
      .target(MoveTarget.ALL),
    new StatusMove(Moves.GRASSY_TERRAIN, i18next.t('move:grassyTerrain.name'), Type.GRASS, -1, 10, i18next.t('move:grassyTerrain.effect'), -1, 0, 6)
      .attr(TerrainChangeAttr, TerrainType.GRASSY)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(Moves.MISTY_TERRAIN, i18next.t('move:mistyTerrain.name'), Type.FAIRY, -1, 10, i18next.t('move:mistyTerrain.effect'), -1, 0, 6)
      .attr(TerrainChangeAttr, TerrainType.MISTY)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(Moves.ELECTRIFY, i18next.t('move:electrify.name'), Type.ELECTRIC, -1, 20, i18next.t('move:electrify.effect'), -1, 0, 6),
    new AttackMove(Moves.PLAY_ROUGH, i18next.t('move:playRough.name'), Type.FAIRY, MoveCategory.PHYSICAL, 90, 90, 10, i18next.t('move:playRough.effect'), 10, 0, 6)
      .attr(StatChangeAttr, BattleStat.ATK, -1),
    new AttackMove(Moves.FAIRY_WIND, i18next.t('move:fairyWind.name'), Type.FAIRY, MoveCategory.SPECIAL, 40, 100, 30, i18next.t('move:fairyWind.effect'), -1, 0, 6)
      .windMove(),
    new AttackMove(Moves.MOONBLAST, i18next.t('move:moonblast.name'), Type.FAIRY, MoveCategory.SPECIAL, 95, 100, 15, i18next.t('move:moonblast.effect'), 30, 0, 6)
      .attr(StatChangeAttr, BattleStat.SPATK, -1),
    new AttackMove(Moves.BOOMBURST, i18next.t('move:boomburst.name'), Type.NORMAL, MoveCategory.SPECIAL, 140, 100, 10, i18next.t('move:boomburst.effect'), -1, 0, 6)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new StatusMove(Moves.FAIRY_LOCK, i18next.t('move:fairyLock.name'), Type.FAIRY, -1, 10, i18next.t('move:fairyLock.effect'), -1, 0, 6)
      .target(MoveTarget.BOTH_SIDES),
    new SelfStatusMove(Moves.KINGS_SHIELD, i18next.t('move:kingsShield.name'), Type.STEEL, -1, 10, i18next.t('move:kingsShield.effect'), -1, 4, 6)
      .attr(ProtectAttr, BattlerTagType.KINGS_SHIELD),
    new StatusMove(Moves.PLAY_NICE, i18next.t('move:playNice.name'), Type.NORMAL, -1, 20, i18next.t('move:playNice.effect'), 100, 0, 6)
      .attr(StatChangeAttr, BattleStat.ATK, -1),
    new StatusMove(Moves.CONFIDE, i18next.t('move:confide.name'), Type.NORMAL, -1, 20, i18next.t('move:confide.effect'), 100, 0, 6)
      .attr(StatChangeAttr, BattleStat.SPATK, -1)
      .soundBased(),
    new AttackMove(Moves.DIAMOND_STORM, i18next.t('move:diamondStorm.name'), Type.ROCK, MoveCategory.PHYSICAL, 100, 95, 5, i18next.t('move:diamondStorm.effect'), 50, 0, 6)
      .attr(StatChangeAttr, BattleStat.DEF, 2, true)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.STEAM_ERUPTION, i18next.t('move:steamEruption.name'), Type.WATER, MoveCategory.SPECIAL, 110, 95, 5, i18next.t('move:steamEruption.effect'), 30, 0, 6)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.HYPERSPACE_HOLE, i18next.t('move:hyperspaceHole.name'), Type.PSYCHIC, MoveCategory.SPECIAL, 80, -1, 5, i18next.t('move:hyperspaceHole.effect'), -1, 0, 6)
      .ignoresProtect(),
    new AttackMove(Moves.WATER_SHURIKEN, i18next.t('move:waterShuriken.name'), Type.WATER, MoveCategory.SPECIAL, 15, 100, 20, i18next.t('move:waterShuriken.effect'), -1, 1, 6)
      .attr(MultiHitAttr),
    new AttackMove(Moves.MYSTICAL_FIRE, i18next.t('move:mysticalFire.name'), Type.FIRE, MoveCategory.SPECIAL, 75, 100, 10, i18next.t('move:mysticalFire.effect'), 100, 0, 6)
      .attr(StatChangeAttr, BattleStat.SPATK, -1),
    new SelfStatusMove(Moves.SPIKY_SHIELD, i18next.t('move:spikyShield.name'), Type.GRASS, -1, 10, i18next.t('move:spikyShield.effect'), -1, 4, 6)
      .attr(ProtectAttr, BattlerTagType.SPIKY_SHIELD),
    new StatusMove(Moves.AROMATIC_MIST, i18next.t('move:aromaticMist.name'), Type.FAIRY, -1, 20, i18next.t('move:aromaticMist.effect'), -1, 0, 6)
      .attr(StatChangeAttr, BattleStat.SPDEF, 1)
      .target(MoveTarget.NEAR_ALLY),
    new StatusMove(Moves.EERIE_IMPULSE, i18next.t('move:eerieImpulse.name'), Type.ELECTRIC, 100, 15, i18next.t('move:eerieImpulse.effect'), -1, 0, 6)
      .attr(StatChangeAttr, BattleStat.SPATK, -2),
    new StatusMove(Moves.VENOM_DRENCH, i18next.t('move:venomDrench.name'), Type.POISON, 100, 20, i18next.t('move:venomDrench.effect'), 100, 0, 6)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.SPATK, BattleStat.SPD ], -1, false, (user, target, move) => target.status?.effect === StatusEffect.POISON)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.POWDER, i18next.t('move:powder.name'), Type.BUG, 100, 20, i18next.t('move:powder.effect'), -1, 1, 6)
      .powderMove(),
    new SelfStatusMove(Moves.GEOMANCY, i18next.t('move:geomancy.name'), Type.FAIRY, -1, 10, i18next.t('move:geomancy.effect'), -1, 0, 6)
      .attr(ChargeAttr, ChargeAnim.GEOMANCY_CHARGING, "is charging its power!")
      .attr(StatChangeAttr, [ BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD ], 2, true)
      .ignoresVirtual(),
    new StatusMove(Moves.MAGNETIC_FLUX, i18next.t('move:magneticFlux.name'), Type.ELECTRIC, -1, 20, i18next.t('move:magneticFlux.effect'), -1, 0, 6)
      .attr(StatChangeAttr, [ BattleStat.DEF, BattleStat.SPDEF ], 1, false, (user, target, move) => !![ Abilities.PLUS, Abilities.MINUS].find(a => target.hasAbility(a, false)))
      .target(MoveTarget.USER_AND_ALLIES)
      .condition((user, target, move) => !![ user, user.getAlly() ].filter(p => p?.isActive()).find(p => !![ Abilities.PLUS, Abilities.MINUS].find(a => p.hasAbility(a, false)))),
    new StatusMove(Moves.HAPPY_HOUR, i18next.t('move:happyHour.name'), Type.NORMAL, -1, 30, i18next.t('move:happyHour.effect'), -1, 0, 6) // No animation
      .target(MoveTarget.USER_SIDE),
    new StatusMove(Moves.ELECTRIC_TERRAIN, i18next.t('move:electricTerrain.name'), Type.ELECTRIC, -1, 10, i18next.t('move:electricTerrain.effect'), -1, 0, 6)
      .attr(TerrainChangeAttr, TerrainType.ELECTRIC)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.DAZZLING_GLEAM, i18next.t('move:dazzlingGleam.name'), Type.FAIRY, MoveCategory.SPECIAL, 80, 100, 10, i18next.t('move:dazzlingGleam.effect'), -1, 0, 6)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new SelfStatusMove(Moves.CELEBRATE, i18next.t('move:celebrate.name'), Type.NORMAL, -1, 40, i18next.t('move:celebrate.effect'), -1, 0, 6),
    new StatusMove(Moves.HOLD_HANDS, i18next.t('move:holdHands.name'), Type.NORMAL, -1, 40, i18next.t('move:holdHands.effect'), -1, 0, 6)
      .target(MoveTarget.NEAR_ALLY),
    new StatusMove(Moves.BABY_DOLL_EYES, i18next.t('move:babyDollEyes.name'), Type.FAIRY, 100, 30, i18next.t('move:babyDollEyes.effect'), -1, 1, 6)
      .attr(StatChangeAttr, BattleStat.ATK, -1),
    new AttackMove(Moves.NUZZLE, i18next.t('move:nuzzle.name'), Type.ELECTRIC, MoveCategory.PHYSICAL, 20, 100, 20, i18next.t('move:nuzzle.effect'), 100, 0, 6)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.HOLD_BACK, i18next.t('move:holdBack.name'), Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 40, i18next.t('move:holdBack.effect'), -1, 0, 6)
      .attr(SurviveDamageAttr),
    new AttackMove(Moves.INFESTATION, i18next.t('move:infestation.name'), Type.BUG, MoveCategory.SPECIAL, 20, 100, 20, i18next.t('move:infestation.effect'), 100, 0, 6)
      .makesContact(),
    new AttackMove(Moves.POWER_UP_PUNCH, i18next.t('move:powerUpPunch.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 40, 100, 20, i18next.t('move:powerUpPunch.effect'), 100, 0, 6)
      .attr(StatChangeAttr, BattleStat.ATK, 1, true)
      .punchingMove(),
    new AttackMove(Moves.OBLIVION_WING, i18next.t('move:oblivionWing.name'), Type.FLYING, MoveCategory.SPECIAL, 80, 100, 10, i18next.t('move:oblivionWing.effect'), -1, 0, 6)
      .attr(HitHealAttr, 0.75)
      .triageMove(),
    new AttackMove(Moves.THOUSAND_ARROWS, i18next.t('move:thousandArrows.name'), Type.GROUND, MoveCategory.PHYSICAL, 90, 100, 10, i18next.t('move:thousandArrows.effect'), 100, 0, 6)
      .attr(NeutralDamageAgainstFlyingTypeMultiplierAttr)
      .attr(HitsTagAttr, BattlerTagType.FLYING, false)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.THOUSAND_WAVES, i18next.t('move:thousandWaves.name'), Type.GROUND, MoveCategory.PHYSICAL, 90, 100, 10, i18next.t('move:thousandWaves.effect'), -1, 0, 6)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, false, 1)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.LANDS_WRATH, i18next.t('move:landsWrath.name'), Type.GROUND, MoveCategory.PHYSICAL, 90, 100, 10, i18next.t('move:landsWrath.effect'), -1, 0, 6)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.LIGHT_OF_RUIN, i18next.t('move:lightOfRuin.name'), Type.FAIRY, MoveCategory.SPECIAL, 140, 90, 5, i18next.t('move:lightOfRuin.effect'), -1, 0, 6)
      .attr(RecoilAttr, false, 0.5),
    new AttackMove(Moves.ORIGIN_PULSE, i18next.t('move:originPulse.name'), Type.WATER, MoveCategory.SPECIAL, 110, 85, 10, i18next.t('move:originPulse.effect'), -1, 0, 6)
      .pulseMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.PRECIPICE_BLADES, i18next.t('move:precipiceBlades.name'), Type.GROUND, MoveCategory.PHYSICAL, 120, 85, 10, i18next.t('move:precipiceBlades.effect'), -1, 0, 6)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.DRAGON_ASCENT, i18next.t('move:dragonAscent.name'), Type.FLYING, MoveCategory.PHYSICAL, 120, 100, 5, i18next.t('move:dragonAscent.effect'), 100, 0, 6)
      .attr(StatChangeAttr, [ BattleStat.DEF, BattleStat.SPDEF ], -1, true),
    new AttackMove(Moves.HYPERSPACE_FURY, i18next.t('move:hyperspaceFury.name'), Type.DARK, MoveCategory.PHYSICAL, 100, -1, 5, i18next.t('move:hyperspaceFury.effect'), 100, 0, 6)
      .attr(StatChangeAttr, BattleStat.DEF, -1, true)
      .ignoresProtect(),
    /* Unused */
    new AttackMove(Moves.BREAKNECK_BLITZ__PHYSICAL, i18next.t('move:breakneckBlitzPhysical.name'), Type.NORMAL, MoveCategory.PHYSICAL, -1, -1, 1, i18next.t('move:breakneckBlitzPhysical.effect'), -1, 0, 7),
    new AttackMove(Moves.BREAKNECK_BLITZ__SPECIAL, i18next.t('move:breakneckBlitzSpecial.name'), Type.NORMAL, MoveCategory.SPECIAL, -1, -1, 1, i18next.t('move:breakneckBlitzSpecial.effect'), -1, 0, 7),
    new AttackMove(Moves.ALL_OUT_PUMMELING__PHYSICAL, i18next.t('move:allOutPummelingPhysical.name'), Type.FIGHTING, MoveCategory.PHYSICAL, -1, -1, 1, i18next.t('move:allOutPummelingPhysical.effect'), -1, 0, 7),
    new AttackMove(Moves.ALL_OUT_PUMMELING__SPECIAL, i18next.t('move:allOutPummelingSpecial.name'), Type.FIGHTING, MoveCategory.SPECIAL, -1, -1, 1, i18next.t('move:allOutPummelingSpecial.effect'), -1, 0, 7),
    new AttackMove(Moves.SUPERSONIC_SKYSTRIKE__PHYSICAL, i18next.t('move:supersonicSkystrikePhysical.name'), Type.FLYING, MoveCategory.PHYSICAL, -1, -1, 1, i18next.t('move:supersonicSkystrikePhysical.effect'), -1, 0, 7),
    new AttackMove(Moves.SUPERSONIC_SKYSTRIKE__SPECIAL, i18next.t('move:supersonicSkystrikeSpecial.name'), Type.FLYING, MoveCategory.SPECIAL, -1, -1, 1, i18next.t('move:supersonicSkystrikeSpecial.effect'), -1, 0, 7),
    new AttackMove(Moves.ACID_DOWNPOUR__PHYSICAL, i18next.t('move:acidDownpourPhysical.name'), Type.POISON, MoveCategory.PHYSICAL, -1, -1, 1, i18next.t('move:acidDownpourPhysical.effect'), -1, 0, 7),
    new AttackMove(Moves.ACID_DOWNPOUR__SPECIAL, i18next.t('move:acidDownpourSpecial.name'), Type.POISON, MoveCategory.SPECIAL, -1, -1, 1, i18next.t('move:acidDownpourSpecial.effect'), -1, 0, 7),
    new AttackMove(Moves.TECTONIC_RAGE__PHYSICAL, i18next.t('move:tectonicRagePhysical.name'), Type.GROUND, MoveCategory.PHYSICAL, -1, -1, 1, i18next.t('move:tectonicRagePhysical.effect'), -1, 0, 7),
    new AttackMove(Moves.TECTONIC_RAGE__SPECIAL, i18next.t('move:tectonicRageSpecial.name'), Type.GROUND, MoveCategory.SPECIAL, -1, -1, 1, i18next.t('move:tectonicRageSpecial.effect'), -1, 0, 7),
    new AttackMove(Moves.CONTINENTAL_CRUSH__PHYSICAL, i18next.t('move:continentalCrushPhysical.name'), Type.ROCK, MoveCategory.PHYSICAL, -1, -1, 1, i18next.t('move:continentalCrushPhysical.effect'), -1, 0, 7),
    new AttackMove(Moves.CONTINENTAL_CRUSH__SPECIAL, i18next.t('move:continentalCrushSpecial.name'), Type.ROCK, MoveCategory.SPECIAL, -1, -1, 1, i18next.t('move:continentalCrushSpecial.effect'), -1, 0, 7),
    new AttackMove(Moves.SAVAGE_SPIN_OUT__PHYSICAL, i18next.t('move:savageSpinOutPhysical.name'), Type.BUG, MoveCategory.PHYSICAL, -1, -1, 1, i18next.t('move:savageSpinOutPhysical.effect'), -1, 0, 7),
    new AttackMove(Moves.SAVAGE_SPIN_OUT__SPECIAL, i18next.t('move:savageSpinOutSpecial.name'), Type.BUG, MoveCategory.SPECIAL, -1, -1, 1, i18next.t('move:savageSpinOutSpecial.effect'), -1, 0, 7),
    new AttackMove(Moves.NEVER_ENDING_NIGHTMARE__PHYSICAL, i18next.t('move:neverEndingNightmarePhysical.name'), Type.GHOST, MoveCategory.PHYSICAL, -1, -1, 1, i18next.t('move:neverEndingNightmarePhysical.effect'), -1, 0, 7),
    new AttackMove(Moves.NEVER_ENDING_NIGHTMARE__SPECIAL, i18next.t('move:neverEndingNightmareSpecial.name'), Type.GHOST, MoveCategory.SPECIAL, -1, -1, 1, i18next.t('move:neverEndingNightmareSpecial.effect'), -1, 0, 7),
    new AttackMove(Moves.CORKSCREW_CRASH__PHYSICAL, i18next.t('move:corkscrewCrashPhysical.name'), Type.STEEL, MoveCategory.PHYSICAL, -1, -1, 1, i18next.t('move:corkscrewCrashPhysical.effect'), -1, 0, 7),
    new AttackMove(Moves.CORKSCREW_CRASH__SPECIAL, i18next.t('move:corkscrewCrashSpecial.name'), Type.STEEL, MoveCategory.SPECIAL, -1, -1, 1, i18next.t('move:corkscrewCrashSpecial.effect'), -1, 0, 7),
    new AttackMove(Moves.INFERNO_OVERDRIVE__PHYSICAL, i18next.t('move:infernoOverdrivePhysical.name'), Type.FIRE, MoveCategory.PHYSICAL, -1, -1, 1, i18next.t('move:infernoOverdrivePhysical.effect'), -1, 0, 7),
    new AttackMove(Moves.INFERNO_OVERDRIVE__SPECIAL, i18next.t('move:infernoOverdriveSpecial.name'), Type.FIRE, MoveCategory.SPECIAL, -1, -1, 1, i18next.t('move:infernoOverdriveSpecial.effect'), -1, 0, 7),
    new AttackMove(Moves.HYDRO_VORTEX__PHYSICAL, i18next.t('move:hydroVortexPhysical.name'), Type.WATER, MoveCategory.PHYSICAL, -1, -1, 1, i18next.t('move:hydroVortexPhysical.effect'), -1, 0, 7),
    new AttackMove(Moves.HYDRO_VORTEX__SPECIAL, i18next.t('move:hydroVortexSpecial.name'), Type.WATER, MoveCategory.SPECIAL, -1, -1, 1, i18next.t('move:hydroVortexSpecial.effect'), -1, 0, 7),
    new AttackMove(Moves.BLOOM_DOOM__PHYSICAL, i18next.t('move:bloomDoomPhysical.name'), Type.GRASS, MoveCategory.PHYSICAL, -1, -1, 1, i18next.t('move:bloomDoomPhysical.effect'), -1, 0, 7),
    new AttackMove(Moves.BLOOM_DOOM__SPECIAL, i18next.t('move:bloomDoomSpecial.name'), Type.GRASS, MoveCategory.SPECIAL, -1, -1, 1, i18next.t('move:bloomDoomSpecial.effect'), -1, 0, 7),
    new AttackMove(Moves.GIGAVOLT_HAVOC__PHYSICAL, i18next.t('move:gigavoltHavocPhysical.name'), Type.ELECTRIC, MoveCategory.PHYSICAL, -1, -1, 1, i18next.t('move:gigavoltHavocPhysical.effect'), -1, 0, 7),
    new AttackMove(Moves.GIGAVOLT_HAVOC__SPECIAL,  i18next.t('move:gigavoltHavocSpecial.name'), Type.ELECTRIC, MoveCategory.SPECIAL, -1, -1, 1, i18next.t('move:gigavoltHavocSpecial.effect'), -1, 0, 7),
    new AttackMove(Moves.SHATTERED_PSYCHE__PHYSICAL, i18next.t('move:shatteredPsychePhysical.name'), Type.PSYCHIC, MoveCategory.PHYSICAL, -1, -1, 1, i18next.t('move:shatteredPsychePhysical.effect'), -1, 0, 7),
    new AttackMove(Moves.SHATTERED_PSYCHE__SPECIAL, i18next.t('move:shatteredPsycheSpecial.name'), Type.PSYCHIC, MoveCategory.SPECIAL, -1, -1, 1, i18next.t('move:shatteredPsycheSpecial.effect'), -1, 0, 7),
    new AttackMove(Moves.SUBZERO_SLAMMER__PHYSICAL, i18next.t('move:subzeroSlammerPhysical.name'), Type.ICE, MoveCategory.PHYSICAL, -1, -1, 1, i18next.t('move:subzeroSlammerPhysical.effect'), -1, 0, 7),
    new AttackMove(Moves.SUBZERO_SLAMMER__SPECIAL, i18next.t('move:subzeroSlammerSpecial.name'), Type.ICE, MoveCategory.SPECIAL, -1, -1, 1, i18next.t('move:subzeroSlammerSpecial.effect'), -1, 0, 7),
    new AttackMove(Moves.DEVASTATING_DRAKE__PHYSICAL, i18next.t('move:devastatingDrakePhysical.name'), Type.DRAGON, MoveCategory.PHYSICAL, -1, -1, 1, i18next.t('move:devastatingDrakePhysical.effect'), -1, 0, 7),
    new AttackMove(Moves.DEVASTATING_DRAKE__SPECIAL, i18next.t('move:devastatingDrakeSpecial.name'), Type.DRAGON, MoveCategory.SPECIAL, -1, -1, 1, i18next.t('move:devastatingDrakeSpecial.effect'), -1, 0, 7),
    new AttackMove(Moves.BLACK_HOLE_ECLIPSE__PHYSICAL, i18next.t('move:blackHoleEclipsePhysical.name'), Type.DARK, MoveCategory.PHYSICAL, -1, -1, 1, i18next.t('move:blackHoleEclipsePhysical.effect'), -1, 0, 7),
    new AttackMove(Moves.BLACK_HOLE_ECLIPSE__SPECIAL, i18next.t('move:blackHoleEclipseSpecial.name'), Type.DARK, MoveCategory.SPECIAL, -1, -1, 1, i18next.t('move:blackHoleEclipseSpecial.effect'), -1, 0, 7),
    new AttackMove(Moves.TWINKLE_TACKLE__PHYSICAL, i18next.t('move:twinkleTacklePhysical.name'), Type.FAIRY, MoveCategory.PHYSICAL, -1, -1, 1, i18next.t('move:twinkleTacklePhysical.effect'), -1, 0, 7),
    new AttackMove(Moves.TWINKLE_TACKLE__SPECIAL, i18next.t('move:twinkleTackleSpecial.name'), Type.FAIRY, MoveCategory.SPECIAL, -1, -1, 1, i18next.t('move:twinkleTackleSpecial.effect'), -1, 0, 7),
    new AttackMove(Moves.CATASTROPIKA, i18next.t('move:catastropika.name'), Type.ELECTRIC, MoveCategory.PHYSICAL, 210, -1, 1, i18next.t('move:catastropika.effect'), -1, 0, 7),
    /* End Unused */
    new SelfStatusMove(Moves.SHORE_UP, i18next.t('move:shoreUp.name'), Type.GROUND, -1, 5, i18next.t('move:shoreUp.effect'), -1, 0, 7)
      .attr(SandHealAttr)
      .triageMove(),
    new AttackMove(Moves.FIRST_IMPRESSION, i18next.t('move:firstImpression.name'), Type.BUG, MoveCategory.PHYSICAL, 90, 100, 10, i18next.t('move:firstImpression.effect'), -1, 2, 7)
      .condition(new FirstMoveCondition()),
    new SelfStatusMove(Moves.BANEFUL_BUNKER, i18next.t('move:banefulBunker.name'), Type.POISON, -1, 10, i18next.t('move:banefulBunker.effect'), -1, 4, 7)
      .attr(ProtectAttr, BattlerTagType.BANEFUL_BUNKER),
    new AttackMove(Moves.SPIRIT_SHACKLE, i18next.t('move:spiritShackle.name'), Type.GHOST, MoveCategory.PHYSICAL, 80, 100, 10, i18next.t('move:spiritShackle.effect'), -1, 0, 7)
      .makesContact(false),
    new AttackMove(Moves.DARKEST_LARIAT, i18next.t('move:darkestLariat.name'), Type.DARK, MoveCategory.PHYSICAL, 85, 100, 10, i18next.t('move:darkestLariat.effect'), -1, 0, 7)
      .attr(IgnoreOpponentStatChangesAttr),
    new AttackMove(Moves.SPARKLING_ARIA, i18next.t('move:sparklingAria.name'), Type.WATER, MoveCategory.SPECIAL, 90, 100, 10, i18next.t('move:sparklingAria.effect'), -1, 0, 7)
      .attr(HealStatusEffectAttr, false, StatusEffect.BURN)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.ICE_HAMMER, i18next.t('move:iceHammer.name'), Type.ICE, MoveCategory.PHYSICAL, 100, 90, 10, i18next.t('move:iceHammer.effect'), 100, 0, 7)
      .attr(StatChangeAttr, BattleStat.SPD, -1, true)
      .punchingMove(),
    new StatusMove(Moves.FLORAL_HEALING, i18next.t('move:floralHealing.name'), Type.FAIRY, -1, 10, i18next.t('move:floralHealing.effect'), -1, 0, 7)
      .attr(HealAttr, 0.5, true, false)
      .triageMove(),
    new AttackMove(Moves.HIGH_HORSEPOWER, i18next.t('move:highHorsepower.name'), Type.GROUND, MoveCategory.PHYSICAL, 95, 95, 10, i18next.t('move:highHorsepower.effect'), -1, 0, 7),
    new StatusMove(Moves.STRENGTH_SAP, i18next.t('move:strengthSap.name'), Type.GRASS, 100, 10, i18next.t('move:strengthSap.effect'), 100, 0, 7)
      .attr(StrengthSapHealAttr)
      .attr(StatChangeAttr, BattleStat.ATK, -1)
      .condition((user, target, move) => target.summonData.battleStats[BattleStat.ATK] > -6)
      .triageMove(),
    new AttackMove(Moves.SOLAR_BLADE, i18next.t('move:solarBlade.name'), Type.GRASS, MoveCategory.PHYSICAL, 125, 100, 10, i18next.t('move:solarBlade.effect'), -1, 0, 7)
      .attr(SunlightChargeAttr, ChargeAnim.SOLAR_BLADE_CHARGING, "is glowing!")
      .attr(AntiSunlightPowerDecreaseAttr)
      .slicingMove(),
    new AttackMove(Moves.LEAFAGE, i18next.t('move:leafage.name'), Type.GRASS, MoveCategory.PHYSICAL, 40, 100, 40, i18next.t('move:leafage.effect'), -1, 0, 7)
      .makesContact(false),
    new StatusMove(Moves.SPOTLIGHT, i18next.t('move:spotlight.name'), Type.NORMAL, -1, 15, i18next.t('move:spotlight.effect'), -1, 3, 7),
    new StatusMove(Moves.TOXIC_THREAD, i18next.t('move:toxicThread.name'), Type.POISON, 100, 20, i18next.t('move:toxicThread.effect'), 100, 0, 7)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .attr(StatChangeAttr, BattleStat.SPD, -1),
    new SelfStatusMove(Moves.LASER_FOCUS, i18next.t('move:laserFocus.name'), Type.NORMAL, -1, 30, i18next.t('move:laserFocus.effect'), -1, 0, 7)
      .attr(AddBattlerTagAttr, BattlerTagType.ALWAYS_CRIT, true, false),
    new StatusMove(Moves.GEAR_UP, i18next.t('move:gearUp.name'), Type.STEEL, -1, 20,i18next.t('move:gearUp.effect'), -1, 0, 7)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.SPATK ], 1, false, (user, target, move) => !![ Abilities.PLUS, Abilities.MINUS].find(a => target.hasAbility(a, false)))
      .target(MoveTarget.USER_AND_ALLIES)
      .condition((user, target, move) => !![ user, user.getAlly() ].filter(p => p?.isActive()).find(p => !![ Abilities.PLUS, Abilities.MINUS].find(a => p.hasAbility(a, false)))),
    new AttackMove(Moves.THROAT_CHOP, i18next.t('move:throatChop.name'), Type.DARK, MoveCategory.PHYSICAL, 80, 100, 15, i18next.t('move:throatChop.effect'), 100, 0, 7),
    new AttackMove(Moves.POLLEN_PUFF, i18next.t('move:pollenPuff.name'), Type.BUG, MoveCategory.SPECIAL, 90, 100, 15, i18next.t('move:pollenPuff.effect'), -1, 0, 7)
      .ballBombMove(),
    new AttackMove(Moves.ANCHOR_SHOT, i18next.t('move:anchorShot.name'), Type.STEEL, MoveCategory.PHYSICAL, 80, 100, 20, i18next.t('move:anchorShot.effect'), -1, 0, 7)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, false, 1),
    new StatusMove(Moves.PSYCHIC_TERRAIN, i18next.t('move:psychicTerrain.name'), Type.PSYCHIC, -1, 10, i18next.t('move:psychicTerrain.effect'), -1, 0, 7)
      .attr(TerrainChangeAttr, TerrainType.PSYCHIC)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.LUNGE, i18next.t('move:lunge.name'), Type.BUG, MoveCategory.PHYSICAL, 80, 100, 15, i18next.t('move:lunge.effect'), 100, 0, 7)
      .attr(StatChangeAttr, BattleStat.ATK, -1),
    new AttackMove(Moves.FIRE_LASH, i18next.t('move:fireLash.name'), Type.FIRE, MoveCategory.PHYSICAL, 80, 100, 15, i18next.t('move:fireLash.effect'), 100, 0, 7)
      .attr(StatChangeAttr, BattleStat.DEF, -1),
    new AttackMove(Moves.POWER_TRIP, i18next.t('move:powerTrip.name'), Type.DARK, MoveCategory.PHYSICAL, 20, 100, 10, i18next.t('move:powerTrip.effect'), -1, 0, 7)
      .attr(StatChangeCountPowerAttr),
    new AttackMove(Moves.BURN_UP, i18next.t('move:burnUp.name'), Type.FIRE, MoveCategory.SPECIAL, 130, 100, 5, i18next.t('move:burnUp.effect'), -1, 0, 7)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE),
    new StatusMove(Moves.SPEED_SWAP, i18next.t('move:speedSwap.name'), Type.PSYCHIC, -1, 10, i18next.t('move:speedSwap.effect'), -1, 0, 7),
    new AttackMove(Moves.SMART_STRIKE, i18next.t('move:smartStrike.name'), Type.STEEL, MoveCategory.PHYSICAL, 70, -1, 10, i18next.t('move:smartStrike.effect'), -1, 0, 7),
    new StatusMove(Moves.PURIFY, i18next.t('move:purify.name'), Type.POISON, -1, 20, i18next.t('move:purify.effect'), -1, 0, 7)
      .triageMove(),
    new AttackMove(Moves.REVELATION_DANCE, i18next.t('move:revelationDance.name'), Type.NORMAL, MoveCategory.SPECIAL, 90, 100, 15, i18next.t('move:revelationDance.effect'), -1, 0, 7)
      .danceMove(),
    new AttackMove(Moves.CORE_ENFORCER, i18next.t('move:coreEnforcer.name'), Type.DRAGON, MoveCategory.SPECIAL, 100, 100, 10, i18next.t('move:coreEnforcer.effect'), -1, 0, 7)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.TROP_KICK, i18next.t('move:tropKick.name'), Type.GRASS, MoveCategory.PHYSICAL, 70, 100, 15, i18next.t('move:tropKick.effect'), 100, 0, 7)
      .attr(StatChangeAttr, BattleStat.ATK, -1),
    new StatusMove(Moves.INSTRUCT, i18next.t('move:instruct.name'), Type.PSYCHIC, -1, 15, i18next.t('move:instruct.effect'), -1, 0, 7),
    new AttackMove(Moves.BEAK_BLAST, i18next.t('move:beakBlast.name'), Type.FLYING, MoveCategory.PHYSICAL, 100, 100, 15, i18next.t('move:beakBlast.effect'), -1, 5, 7)
      .attr(ChargeAttr, ChargeAnim.BEAK_BLAST_CHARGING, "started\nheating up its beak!", undefined, false, true, -3)
      .ballBombMove()
      .makesContact(false),
    new AttackMove(Moves.CLANGING_SCALES, i18next.t('move:clangingScales.name'), Type.DRAGON, MoveCategory.SPECIAL, 110, 100, 5, i18next.t('move:clangingScales.effect'), 100, 0, 7)
      .attr(StatChangeAttr, BattleStat.DEF, -1, true)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.DRAGON_HAMMER, i18next.t('move:dragonHammer.name'), Type.DRAGON, MoveCategory.PHYSICAL, 90, 100, 15, i18next.t('move:dragonHammer.effect'), -1, 0, 7),
    new AttackMove(Moves.BRUTAL_SWING, i18next.t('move:brutalSwing.name'), Type.DARK, MoveCategory.PHYSICAL, 60, 100, 20, i18next.t('move:brutalSwing.effect'), -1, 0, 7)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new StatusMove(Moves.AURORA_VEIL, i18next.t('move:auroraVeil.name'), Type.ICE, -1, 20, i18next.t('move:auroraVeil.effect'), -1, 0, 7)
      .condition((user, target, move) => (user.scene.arena.weather?.weatherType === WeatherType.HAIL || user.scene.arena.weather?.weatherType === WeatherType.SNOW) && !user.scene.arena.weather?.isEffectSuppressed(user.scene))
      .attr(AddArenaTagAttr, ArenaTagType.AURORA_VEIL, 5, true)
      .target(MoveTarget.USER_SIDE),
    /* Unused */
    new AttackMove(Moves.SINISTER_ARROW_RAID, i18next.t('move:sinisterArrowRaid.name'), Type.GHOST, MoveCategory.PHYSICAL, 180, -1, 1, i18next.t('move:sinisterArrowRaid.effect'), -1, 0, 7)
      .makesContact(false),
    new AttackMove(Moves.MALICIOUS_MOONSAULT, i18next.t('move:maliciousMoonsault.name'), Type.DARK, MoveCategory.PHYSICAL, 180, -1, 1, i18next.t('move:maliciousMoonsault.effect'), -1, 0, 7),
    new AttackMove(Moves.OCEANIC_OPERETTA, i18next.t('move:oceanicOperetta.name'), Type.WATER, MoveCategory.SPECIAL, 195, -1, 1, i18next.t('move:oceanicOperetta.effect'), -1, 0, 7),
    new AttackMove(Moves.GUARDIAN_OF_ALOLA, i18next.t('move:guardianOfAlola.name'), Type.FAIRY, MoveCategory.SPECIAL, -1, -1, 1, i18next.t('move:guardianOfAlola.effect'), -1, 0, 7),
    new AttackMove(Moves.SOUL_STEALING_7_STAR_STRIKE, i18next.t('move:soulStealing7StarStrike.name'), Type.GHOST, MoveCategory.PHYSICAL, 195, -1, 1, i18next.t('move:soulStealing7StarStrike.effect'), -1, 0, 7),
    new AttackMove(Moves.STOKED_SPARKSURFER, i18next.t('move:stokedSparksurfer.name'), Type.ELECTRIC, MoveCategory.SPECIAL, 175, -1, 1, i18next.t('move:stokedSparksurfer.effect'), 100, 0, 7),
    new AttackMove(Moves.PULVERIZING_PANCAKE, i18next.t('move:pulverizingPancake.name'), Type.NORMAL, MoveCategory.PHYSICAL, 210, -1, 1, i18next.t('move:pulverizingPancake.effect'), -1, 0, 7),
    new SelfStatusMove(Moves.EXTREME_EVOBOOST, i18next.t('move:extremeEvoboost.name'), Type.NORMAL, -1, 1, i18next.t('move:extremeEvoboost.effect'), 100, 0, 7)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF, BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD ], 2, true),
    new AttackMove(Moves.GENESIS_SUPERNOVA, i18next.t('move:genesisSupernova.name'), Type.PSYCHIC, MoveCategory.SPECIAL, 185, -1, 1, i18next.t('move:genesisSupernova.effect'), -1, 0, 7)
      .attr(TerrainChangeAttr, TerrainType.PSYCHIC),
    /* End Unused */
    new AttackMove(Moves.SHELL_TRAP, i18next.t('move:shellTrap.name'), Type.FIRE, MoveCategory.SPECIAL, 150, 100, 5, i18next.t('move:shellTrap.effect'), -1, -3, 7)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.FLEUR_CANNON, i18next.t('move:fleurCannon.name'), Type.FAIRY, MoveCategory.SPECIAL, 130, 90, 5, i18next.t('move:fleurCannon.effect'), 100, 0, 7)
      .attr(StatChangeAttr, BattleStat.SPATK, -2, true),
    new AttackMove(Moves.PSYCHIC_FANGS, i18next.t('move:psychicFangs.name'), Type.PSYCHIC, MoveCategory.PHYSICAL, 85, 100, 10, i18next.t('move:psychicFangs.effect'), -1, 0, 7)
      .bitingMove()
      .attr(RemoveScreensAttr),
    new AttackMove(Moves.STOMPING_TANTRUM, i18next.t('move:stompingTantrum.name'), Type.GROUND, MoveCategory.PHYSICAL, 75, 100, 10, i18next.t('move:stompingTantrum.effect'), -1, 0, 7),
    new AttackMove(Moves.SHADOW_BONE, i18next.t('move:shadowBone.name'), Type.GHOST, MoveCategory.PHYSICAL, 85, 100, 10, i18next.t('move:shadowBone.effect'), 20, 0, 7)
      .attr(StatChangeAttr, BattleStat.DEF, -1)
      .makesContact(false),
    new AttackMove(Moves.ACCELEROCK, i18next.t('move:accelerock.name'), Type.ROCK, MoveCategory.PHYSICAL, 40, 100, 20, i18next.t('move:accelerock.effect'), -1, 1, 7),
    new AttackMove(Moves.LIQUIDATION, i18next.t('move:liquidation.name'), Type.WATER, MoveCategory.PHYSICAL, 85, 100, 10, i18next.t('move:liquidation.effect'), 20, 0, 7)
      .attr(StatChangeAttr, BattleStat.DEF, -1),
    new AttackMove(Moves.PRISMATIC_LASER, i18next.t('move:prismaticLaser.name'), Type.PSYCHIC, MoveCategory.SPECIAL, 160, 100, 10, i18next.t('move:prismaticLaser.effect'), -1, 0, 7)
      .attr(RechargeAttr),
    new AttackMove(Moves.SPECTRAL_THIEF, i18next.t('move:spectralThief.name'), Type.GHOST, MoveCategory.PHYSICAL, 90, 100, 10, i18next.t('move:spectralThief.effect'), -1, 0, 7),
    new AttackMove(Moves.SUNSTEEL_STRIKE, i18next.t('move:sunsteelStrike.name'), Type.STEEL, MoveCategory.PHYSICAL, 100, 100, 5, i18next.t('move:sunsteelStrike.effect'), -1, 0, 7),
    new AttackMove(Moves.MOONGEIST_BEAM, i18next.t('move:moongeistBeam.name'), Type.GHOST, MoveCategory.SPECIAL, 100, 100, 5, i18next.t('move:moongeistBeam.effect'), -1, 0, 7),
    new StatusMove(Moves.TEARFUL_LOOK, i18next.t('move:tearfulLook.name'), Type.NORMAL, -1, 20, i18next.t('move:tearfulLook.effect'), 100, 0, 7)
      .attr(StatChangeAttr, BattleStat.ATK, -1)
      .attr(StatChangeAttr, BattleStat.SPATK, -1),
    new AttackMove(Moves.ZING_ZAP, i18next.t('move:zingZap.name'), Type.ELECTRIC, MoveCategory.PHYSICAL, 80, 100, 10, i18next.t('move:zingZap.effect'), 30, 0, 7)
      .attr(FlinchAttr),
    new AttackMove(Moves.NATURES_MADNESS, i18next.t('move:naturesMadness.name'), Type.FAIRY, MoveCategory.SPECIAL, -1, 90, 10, i18next.t('move:naturesMadness.effect'), -1, 0, 7)
      .attr(TargetHalfHpDamageAttr),
    new AttackMove(Moves.MULTI_ATTACK, i18next.t('move:multiAttack.name'), Type.NORMAL, MoveCategory.PHYSICAL, 120, 100, 10, i18next.t('move:multiAttack.effect'), -1, 0, 7),
    /* Unused */
    new AttackMove(Moves.TEN_MILLION_VOLT_THUNDERBOLT, i18next.t('move:tenMillionVoltThunderbolt.name'), Type.ELECTRIC, MoveCategory.SPECIAL, 195, -1, 1, i18next.t('move:tenMillionVoltThunderbolt.effect'), -1, 0, 7),
    /* End Unused */
    new AttackMove(Moves.MIND_BLOWN, i18next.t('move:mindBlown.name'), Type.FIRE, MoveCategory.SPECIAL, 150, 100, 5, i18next.t('move:mindBlown.effect'), -1, 0, 7)
      .attr(RecoilAttr, true, 0.5)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.PLASMA_FISTS, i18next.t('move:plasmaFists.name'), Type.ELECTRIC, MoveCategory.PHYSICAL, 100, 100, 15, i18next.t('move:plasmaFists.effect'), -1, 0, 7)
      .punchingMove(),
    new AttackMove(Moves.PHOTON_GEYSER, i18next.t('move:photonGeyser.name'), Type.PSYCHIC, MoveCategory.SPECIAL, 100, 100, 5, i18next.t('move:photonGeyser.effect'), -1, 0, 7)
      .attr(PhotonGeyserCategoryAttr),
    /* Unused */
    new AttackMove(Moves.LIGHT_THAT_BURNS_THE_SKY, i18next.t('move:lightThatBurnsTheSky.name'), Type.PSYCHIC, MoveCategory.SPECIAL, 200, -1, 1, i18next.t('move:lightThatBurnsTheSky.effect'), -1, 0, 7)
      .attr(PhotonGeyserCategoryAttr),
    new AttackMove(Moves.SEARING_SUNRAZE_SMASH, i18next.t('move:searingSunrazeSmash.name'), Type.STEEL, MoveCategory.PHYSICAL, 200, -1, 1, i18next.t('move:searingSunrazeSmash.effect'), -1, 0, 7),
    new AttackMove(Moves.MENACING_MOONRAZE_MAELSTROM, i18next.t('move:menacingMoonrazeMaelstrom.name'), Type.GHOST, MoveCategory.SPECIAL, 200, -1, 1, i18next.t('move:menacingMoonrazeMaelstrom.effect'), -1, 0, 7),
    new AttackMove(Moves.LETS_SNUGGLE_FOREVER, i18next.t('move:letsSnuggleForever.name'), Type.FAIRY, MoveCategory.PHYSICAL, 190, -1, 1, i18next.t('move:letsSnuggleForever.effect'), -1, 0, 7),
    new AttackMove(Moves.SPLINTERED_STORMSHARDS, i18next.t('move:splinteredStormshards.name'), Type.ROCK, MoveCategory.PHYSICAL, 190, -1, 1,  i18next.t('move:splinteredStormshards.effect'), -1, 0, 7)
      .attr(ClearTerrainAttr)
      .makesContact(false),
    new AttackMove(Moves.CLANGOROUS_SOULBLAZE, i18next.t('move:clangorousSoulblaze.name'), Type.DRAGON, MoveCategory.SPECIAL, 185, -1, 1, i18next.t('move:clangorousSoulblaze.effect'), 100, 0, 7)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF, BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD ], 1, true)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    /* End Unused */
    new AttackMove(Moves.ZIPPY_ZAP, i18next.t('move:zippyZap.name'), Type.ELECTRIC, MoveCategory.PHYSICAL, 80, 100, 10, i18next.t('move:zippyZap.effect'), 100, 2, 7)
      .attr(CritOnlyAttr),
    new AttackMove(Moves.SPLISHY_SPLASH, i18next.t('move:splishySplash.name'), Type.WATER, MoveCategory.SPECIAL, 90, 100, 15, i18next.t('move:splishySplash.effect'), 30, 0, 7)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.FLOATY_FALL, i18next.t('move:floatyFall.name'), Type.FLYING, MoveCategory.PHYSICAL, 90, 95, 15, i18next.t('move:floatyFall.effect'), 30, 0, 7)
      .attr(FlinchAttr),
    new AttackMove(Moves.PIKA_PAPOW, i18next.t('move:pikaPapow.name'), Type.ELECTRIC, MoveCategory.SPECIAL, -1, -1, 20, i18next.t('move:pikaPapow.effect'), -1, 0, 7)
      .attr(FriendshipPowerAttr),
    new AttackMove(Moves.BOUNCY_BUBBLE, i18next.t('move:bouncyBubble.name'), Type.WATER, MoveCategory.SPECIAL, 60, 100, 20, i18next.t('move:bouncyBubble.effect'), -1, 0, 7)
      .attr(HitHealAttr),
    new AttackMove(Moves.BUZZY_BUZZ, i18next.t('move:buzzyBuzz.name'), Type.ELECTRIC, MoveCategory.SPECIAL, 60, 100, 20, i18next.t('move:buzzyBuzz.effect'), 100, 0, 7)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.SIZZLY_SLIDE, i18next.t('move:sizzlySlide.name'), Type.FIRE, MoveCategory.PHYSICAL, 60, 100, 20, i18next.t('move:sizzlySlide.effect'), 100, 0, 7)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.GLITZY_GLOW, i18next.t('move:glitzyGlow.name'), Type.PSYCHIC, MoveCategory.SPECIAL, 80, 95, 15, i18next.t('move:glitzyGlow.effect'), -1, 0, 7)
      .attr(AddArenaTagAttr, ArenaTagType.LIGHT_SCREEN, 5, false, true),
    new AttackMove(Moves.BADDY_BAD, i18next.t('move:baddyBad.name'), Type.DARK, MoveCategory.SPECIAL, 80, 95, 15, i18next.t('move:baddyBad.effect'), -1, 0, 7)
      .attr(AddArenaTagAttr, ArenaTagType.REFLECT, 5, false, true),
    new AttackMove(Moves.SAPPY_SEED, i18next.t('move:sappySeed.name'), Type.GRASS, MoveCategory.PHYSICAL, 100, 90, 10, i18next.t('move:sappySeed.effect'), 100, 0, 7)
      .attr(AddBattlerTagAttr, BattlerTagType.SEEDED),
    new AttackMove(Moves.FREEZY_FROST, i18next.t('move:freezyFrost.name'), Type.ICE, MoveCategory.SPECIAL, 100, 90, 10, i18next.t('move:freezyFrost.effect'), -1, 0, 7),
    new AttackMove(Moves.SPARKLY_SWIRL, i18next.t('move:sparklySwirl.name'), Type.FAIRY, MoveCategory.SPECIAL, 120, 85, 5, i18next.t('move:sparklySwirl.effect'), -1, 0, 7),
    new AttackMove(Moves.VEEVEE_VOLLEY, i18next.t('move:veeveeVolley.name'), Type.NORMAL, MoveCategory.PHYSICAL, -1, -1, 20, i18next.t('move:veeveeVolley.effect'), -1, 0, 7)
      .attr(FriendshipPowerAttr),
    new AttackMove(Moves.DOUBLE_IRON_BASH, i18next.t('move:doubleIronBash.name'), Type.STEEL, MoveCategory.PHYSICAL, 60, 100, 5, i18next.t('move:doubleIronBash.effect'), 30, 0, 7)
      .attr(MultiHitAttr, MultiHitType._2)
      .attr(FlinchAttr)
      .punchingMove(),
    /* Unused */
    new SelfStatusMove(Moves.MAX_GUARD, i18next.t('move:maxGuard.name'), Type.NORMAL, -1, 10, i18next.t('move:maxGuard.effect'), -1, 4, 8)
      .attr(ProtectAttr),
    /* End Unused */
    new AttackMove(Moves.DYNAMAX_CANNON, i18next.t('move:dynamaxCannon.name'), Type.DRAGON, MoveCategory.SPECIAL, 100, 100, 5, i18next.t('move:dynamaxCannon.effect'), -1, 0, 8)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.level > 200 ? 2 : 1)
      .attr(DiscourageFrequentUseAttr)
      .ignoresVirtual(),
    new AttackMove(Moves.SNIPE_SHOT, i18next.t('move:snipeShot.name'), Type.WATER, MoveCategory.SPECIAL, 80, 100, 15, i18next.t('move:snipeShot.effect'), -1, 0, 8),
    new AttackMove(Moves.JAW_LOCK, i18next.t('move:jawLock.name'), Type.DARK, MoveCategory.PHYSICAL, 80, 100, 10, i18next.t('move:jawLock.effect'), -1, 0, 8)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, false, 1)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, true, false, 1)
      .bitingMove(),
    new SelfStatusMove(Moves.STUFF_CHEEKS, i18next.t('move:stuffCheeks.name'), Type.NORMAL, -1, 10, i18next.t('move:stuffCheeks.effect'), 100, 0, 8),
    new SelfStatusMove(Moves.NO_RETREAT, i18next.t('move:noRetreat.name'), Type.FIGHTING, -1, 5, i18next.t('move:noRetreat.effect'), 100, 0, 8)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF, BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD ], 1, true)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, true, true, 1),
    new StatusMove(Moves.TAR_SHOT, i18next.t('move:tarShot.name'), Type.ROCK, 100, 15, i18next.t('move:tarShot.effect'), 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.SPD, -1),
    new StatusMove(Moves.MAGIC_POWDER, i18next.t('move:magicPowder.name'), Type.PSYCHIC, 100, 20, i18next.t('move:magicPowder.effect'), -1, 0, 8)
      .powderMove(),
    new AttackMove(Moves.DRAGON_DARTS, i18next.t('move:dragonDarts.name'), Type.DRAGON, MoveCategory.PHYSICAL, 50, 100, 10, i18next.t('move:dragonDarts.effect'), -1, 0, 8)
      .attr(MultiHitAttr, MultiHitType._2)
      .makesContact(false),
    new StatusMove(Moves.TEATIME, i18next.t('move:teatime.name'), Type.NORMAL, -1, 10, i18next.t('move:teatime.effect'), -1, 0, 8)
      .target(MoveTarget.ALL),
    new StatusMove(Moves.OCTOLOCK, i18next.t('move:octolock.name'), Type.FIGHTING, 100, 15, i18next.t('move:octolock.effect'), -1, 0, 8)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, true, 1),
    new AttackMove(Moves.BOLT_BEAK, i18next.t('move:boltBeak.name'), Type.ELECTRIC, MoveCategory.PHYSICAL, 85, 100, 10, i18next.t('move:boltBeak.effect'), -1, 0, 8)
      .attr(FirstAttackDoublePowerAttr),
    new AttackMove(Moves.FISHIOUS_REND, i18next.t('move:fishiousRend.name'), Type.WATER, MoveCategory.PHYSICAL, 85, 100, 10, i18next.t('move:fishiousRend.effect'), -1, 0, 8)
      .attr(FirstAttackDoublePowerAttr)
      .bitingMove(),
    new StatusMove(Moves.COURT_CHANGE, i18next.t('move:courtChange.name'), Type.NORMAL, 100, 10, i18next.t('move:courtChange.effect'), -1, 0, 8)
      .target(MoveTarget.BOTH_SIDES),
    /* Unused */
    new AttackMove(Moves.MAX_FLARE, i18next.t('move:maxFlare.name'), Type.FIRE, MoveCategory.PHYSICAL, 10, -1, 10, i18next.t('move:maxFlare.effect'), -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_FLUTTERBY, i18next.t('move:maxFlutterby.name'), Type.BUG, MoveCategory.PHYSICAL, 10, -1, 10, i18next.t('move:maxFlutterby.effect'), -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_LIGHTNING, i18next.t('move:maxLightning.name'), Type.ELECTRIC, MoveCategory.PHYSICAL, 10, -1, 10, i18next.t('move:maxLightning.effect'), -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_STRIKE, i18next.t('move:maxStrike.name'), Type.NORMAL, MoveCategory.PHYSICAL, 10, -1, 10, i18next.t('move:maxStrike.effect'), -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_KNUCKLE, i18next.t('move:maxKnuckle.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 10, -1, 10, i18next.t('move:maxKnuckle.effect'), -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_PHANTASM, i18next.t('move:maxPhantasm.name'), Type.GHOST, MoveCategory.PHYSICAL, 10, -1, 10, i18next.t('move:maxPhantasm.effect'), -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_HAILSTORM, i18next.t('move:maxHailstorm.name'), Type.ICE, MoveCategory.PHYSICAL, 10, -1, 10, i18next.t('move:maxHailstorm.effect'), -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_OOZE, i18next.t('move:maxOoze.name'), Type.POISON, MoveCategory.PHYSICAL, 10, -1, 10, i18next.t('move:maxOoze.effect'), -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_GEYSER, i18next.t('move:maxGeyser.name'), Type.WATER, MoveCategory.PHYSICAL, 10, -1, 10, i18next.t('move:maxGeyser.effect'), -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_AIRSTREAM, i18next.t('move:maxAirstream.name'), Type.FLYING, MoveCategory.PHYSICAL, 10, -1, 10, i18next.t('move:maxAirstream.effect'), -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_STARFALL, i18next.t('move:maxStarfall.name'), Type.FAIRY, MoveCategory.PHYSICAL, 10, -1, 10, i18next.t('move:maxStarfall.effect'), -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_WYRMWIND, i18next.t('move:maxWyrmwind.name'), Type.DRAGON, MoveCategory.PHYSICAL, 10, -1, 10, i18next.t('move:maxWyrmwind.effect'), -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_MINDSTORM, i18next.t('move:maxMindstorm.name'), Type.PSYCHIC, MoveCategory.PHYSICAL, 10, -1, 10, i18next.t('move:maxMindstorm.effect'), -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_ROCKFALL, i18next.t('move:maxRockfall.name'), Type.ROCK, MoveCategory.PHYSICAL, 10, -1, 10, i18next.t('move:maxRockfall.effect'), -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_QUAKE, i18next.t('move:maxQuake.name'), Type.GROUND, MoveCategory.PHYSICAL, 10, -1, 10, i18next.t('move:maxQuake.effect'), -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_DARKNESS, i18next.t('move:maxDarkness.name'), Type.DARK, MoveCategory.PHYSICAL, 10, -1, 10, i18next.t('move:maxDarkness.effect'), -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_OVERGROWTH, i18next.t('move:maxOvergrowth.name'), Type.GRASS, MoveCategory.PHYSICAL, 10, -1, 10, i18next.t('move:maxOvergrowth.effect'), -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    new AttackMove(Moves.MAX_STEELSPIKE, i18next.t('move:maxSteelspike.name'), Type.STEEL, MoveCategory.PHYSICAL, 10, -1, 10, i18next.t('move:maxSteelspike.effect'), -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY),
    /* End Unused */
    new SelfStatusMove(Moves.CLANGOROUS_SOUL, i18next.t('move:clangorousSoul.name'), Type.DRAGON, 100, 5, i18next.t('move:clangorousSoul.effect'), 100, 0, 8)
      .attr(CutHpStatBoostAttr, [ BattleStat.ATK, BattleStat.DEF, BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD ], 1, 3)
      .soundBased()
      .danceMove(),
    new AttackMove(Moves.BODY_PRESS, i18next.t('move:bodyPress.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 80, 100, 10, i18next.t('move:bodyPress.effect'), -1, 0, 8)
      .attr(DefAtkAttr),
    new StatusMove(Moves.DECORATE, i18next.t('move:decorate.name'), Type.FAIRY, -1, 15, i18next.t('move:decorate.effect'), 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.ATK, 2)
      .attr(StatChangeAttr, BattleStat.SPATK, 2),
    new AttackMove(Moves.DRUM_BEATING, i18next.t('move:drumBeating.name'), Type.GRASS, MoveCategory.PHYSICAL, 80, 100, 10, i18next.t('move:drumBeating.effect'), 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.SPD, -1)
      .makesContact(false),
    new AttackMove(Moves.SNAP_TRAP, i18next.t('move:snapTrap.name'), Type.GRASS, MoveCategory.PHYSICAL, 35, 100, 15, i18next.t('move:snapTrap.effect'), 100, 0, 8),
    new AttackMove(Moves.PYRO_BALL, i18next.t('move:pyroBall.name'), Type.FIRE, MoveCategory.PHYSICAL, 120, 90, 5, i18next.t('move:pyroBall.effect'), 10, 0, 8)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .ballBombMove()
      .makesContact(false),
    new AttackMove(Moves.BEHEMOTH_BLADE, i18next.t('move:behemothBlade.name'), Type.STEEL, MoveCategory.PHYSICAL, 100, 100, 5, i18next.t('move:behemothBlade.effect'), -1, 0, 8)
      .slicingMove(),
    new AttackMove(Moves.BEHEMOTH_BASH, i18next.t('move:behemothBash.name'), Type.STEEL, MoveCategory.PHYSICAL, 100, 100, 5, i18next.t('move:behemothBash.effect'), -1, 0, 8),
    new AttackMove(Moves.AURA_WHEEL, i18next.t('move:auraWheel.name'), Type.ELECTRIC, MoveCategory.PHYSICAL, 110, 100, 10, i18next.t('move:auraWheel.effect'), 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.SPD, 1, true)
      .makesContact(false)
      .attr(AuraWheelTypeAttr)
      .condition((user, target, move) => [user.species.speciesId, user.fusionSpecies?.speciesId].includes(Species.MORPEKO)), // Missing custom fail message
    new AttackMove(Moves.BREAKING_SWIPE, i18next.t('move:breakingSwipe.name'), Type.DRAGON, MoveCategory.PHYSICAL, 60, 100, 15, i18next.t('move:breakingSwipe.effect'), 100, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .attr(StatChangeAttr, BattleStat.ATK, -1),
    new AttackMove(Moves.BRANCH_POKE, i18next.t('move:branchPoke.name'), Type.GRASS, MoveCategory.PHYSICAL, 40, 100, 40, i18next.t('move:branchPoke.effect'), -1, 0, 8),
    new AttackMove(Moves.OVERDRIVE, i18next.t('move:overdrive.name'), Type.ELECTRIC, MoveCategory.SPECIAL, 80, 100, 10, i18next.t('move:overdrive.effect'), -1, 0, 8)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.APPLE_ACID, i18next.t('move:appleAcid.name'), Type.GRASS, MoveCategory.SPECIAL, 80, 100, 10, i18next.t('move:appleAcid.effect'), 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1),
    new AttackMove(Moves.GRAV_APPLE, i18next.t('move:gravApple.name'), Type.GRASS, MoveCategory.PHYSICAL, 80, 100, 10, i18next.t('move:gravApple.effect'), 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.DEF, -1)
      .attr(MovePowerMultiplierAttr, (user, target, move) => user.scene.arena.getTag(ArenaTagType.GRAVITY) ? 1.5 : 1)
      .makesContact(false),
    new AttackMove(Moves.SPIRIT_BREAK, i18next.t('move:spiritBreak.name'), Type.FAIRY, MoveCategory.PHYSICAL, 75, 100, 15, i18next.t('move:spiritBreak.effect'), 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.SPATK, -1),
    new AttackMove(Moves.STRANGE_STEAM, i18next.t('move:strangeSteam.name'), Type.FAIRY, MoveCategory.SPECIAL, 90, 95, 10, i18next.t('move:strangeSteam.effect'), 20, 0, 8)
      .attr(ConfuseAttr),
    new StatusMove(Moves.LIFE_DEW, i18next.t('move:lifeDew.name'), Type.WATER, -1, 10, i18next.t('move:lifeDew.effect'), -1, 0, 8)
      .attr(HealAttr, 0.25, true, false)
      .target(MoveTarget.USER_AND_ALLIES),
    new SelfStatusMove(Moves.OBSTRUCT, i18next.t('move:obstruct.name'), Type.DARK, 100, 10, i18next.t('move:obstruct.effect'), -1, 4, 8)
      .attr(ProtectAttr, BattlerTagType.OBSTRUCT),
    new AttackMove(Moves.FALSE_SURRENDER, i18next.t('move:falseSurrender.name'), Type.DARK, MoveCategory.PHYSICAL, 80, -1, 10, i18next.t('move:falseSurrender.effect'), -1, 0, 8),
    new AttackMove(Moves.METEOR_ASSAULT, i18next.t('move:meteorAssault.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 150, 100, 5, i18next.t('move:meteorAssault.effect'), -1, 0, 8)
      .attr(RechargeAttr)
      .makesContact(false),
    new AttackMove(Moves.ETERNABEAM, i18next.t('move:eternabeam.name'), Type.DRAGON, MoveCategory.SPECIAL, 160, 90, 5, i18next.t('move:eternabeam.effect'), -1, 0, 8)
      .attr(RechargeAttr),
    new AttackMove(Moves.STEEL_BEAM, i18next.t('move:steelBeam.name'), Type.STEEL, MoveCategory.SPECIAL, 140, 95, 5, i18next.t('move:steelBeam.effect'), -1, 0, 8)
      .attr(RecoilAttr, true, 0.5),
    new AttackMove(Moves.EXPANDING_FORCE, i18next.t('move:expandingForce.name'), Type.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 10, i18next.t('move:expandingForce.effect'), -1, 0, 8),
    new AttackMove(Moves.STEEL_ROLLER, i18next.t('move:steelRoller.name'), Type.STEEL, MoveCategory.PHYSICAL, 130, 100, 5, i18next.t('move:steelRoller.effect'), -1, 0, 8)
      .attr(ClearTerrainAttr)
      .condition((user, target, move) => !!user.scene.arena.terrain),
    new AttackMove(Moves.SCALE_SHOT, i18next.t('move:scaleShot.name'), Type.DRAGON, MoveCategory.PHYSICAL, 25, 90, 20, i18next.t('move:scaleShot.effect'), 100, 0, 8)
      //.attr(StatChangeAttr, BattleStat.SPD, 1, true) // TODO: Have boosts only apply at end of move, not after every hit
      //.attr(StatChangeAttr, BattleStat.DEF, -1, true)
      .attr(MultiHitAttr)
      .makesContact(false),
    new AttackMove(Moves.METEOR_BEAM, i18next.t('move:meteorBeam.name'), Type.ROCK, MoveCategory.SPECIAL, 120, 90, 10, i18next.t('move:meteorBeam.effect'), 100, 0, 8)
      .attr(ChargeAttr, ChargeAnim.METEOR_BEAM_CHARGING, 'is overflowing\nwith space power!', null, true)
      .attr(StatChangeAttr, BattleStat.SPATK, 1, true)
      .ignoresVirtual(),
    new AttackMove(Moves.SHELL_SIDE_ARM, i18next.t('move:shellSideArm.name'), Type.POISON, MoveCategory.SPECIAL, 90, 100, 10, i18next.t('move:shellSideArm.effect'), 20, 0, 8)
      .attr(ShellSideArmCategoryAttr)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(Moves.MISTY_EXPLOSION, i18next.t('move:mistyExplosion.name'), Type.FAIRY, MoveCategory.SPECIAL, 100, 100, 5, i18next.t('move:mistyExplosion.effect'), -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.GRASSY_GLIDE, i18next.t('move:grassyGlide.name'), Type.GRASS, MoveCategory.PHYSICAL, 55, 100, 20, i18next.t('move:grassyGlide.effect'), -1, 0, 8),
    new AttackMove(Moves.RISING_VOLTAGE, i18next.t('move:risingVoltage.name'), Type.ELECTRIC, MoveCategory.SPECIAL, 70, 100, 20, i18next.t('move:risingVoltage.effect'), -1, 0, 8)
      .attr(MovePowerMultiplierAttr, (user, target, move) => user.scene.arena.getTerrainType() === TerrainType.ELECTRIC && target.isGrounded() ? 2 : 1),
    new AttackMove(Moves.TERRAIN_PULSE, i18next.t('move:terrainPulse.name'), Type.NORMAL, MoveCategory.SPECIAL, 50, 100, 10, i18next.t('move:terrainPulse.effect'), -1, 0, 8)
      .pulseMove(),
    new AttackMove(Moves.SKITTER_SMACK, i18next.t('move:skitterSmack.name'), Type.BUG, MoveCategory.PHYSICAL, 70, 90, 10, i18next.t('move:skitterSmack.effect'), 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.SPATK, -1),
    new AttackMove(Moves.BURNING_JEALOUSY, i18next.t('move:burningJealousy.name'), Type.FIRE, MoveCategory.SPECIAL, 70, 100, 5, i18next.t('move:burningJealousy.effect'), 100, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.LASH_OUT, i18next.t('move:lashOut.name'), Type.DARK, MoveCategory.PHYSICAL, 75, 100, 5, i18next.t('move:lashOut.effect'), -1, 0, 8),
    new AttackMove(Moves.POLTERGEIST, i18next.t('move:poltergeist.name'), Type.GHOST, MoveCategory.PHYSICAL, 110, 90, 5, i18next.t('move:poltergeist.effect'), -1, 0, 8)
      .makesContact(false),
    new StatusMove(Moves.CORROSIVE_GAS, i18next.t('move:corrosiveGas.name'), Type.POISON, 100, 40, i18next.t('move:corrosiveGas.effect'), -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new StatusMove(Moves.COACHING, i18next.t('move:coaching.name'), Type.FIGHTING, -1, 10, i18next.t('move:coaching.effect'), 100, 0, 8)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF ], 1)
      .target(MoveTarget.NEAR_ALLY),
    new AttackMove(Moves.FLIP_TURN, i18next.t('move:flipTurn.name'), Type.WATER, MoveCategory.PHYSICAL, 60, 100, 20, i18next.t('move:flipTurn.effect'), -1, 0, 8)
      .attr(ForceSwitchOutAttr, true),
    new AttackMove(Moves.TRIPLE_AXEL, i18next.t('move:tripleAxel.name'), Type.ICE, MoveCategory.PHYSICAL, 20, 90, 10, i18next.t('move:tripleAxel.effect'), -1, 0, 8)
      .attr(MultiHitAttr, MultiHitType._3_INCR)
      .attr(MissEffectAttr, (user: Pokemon, move: Move) => {
        user.turnData.hitsLeft = 1;
        return true;
      }),
    new AttackMove(Moves.DUAL_WINGBEAT, i18next.t('move:dualWingbeat.name'), Type.FLYING, MoveCategory.PHYSICAL, 40, 90, 10, i18next.t('move:dualWingbeat.effect'), -1, 0, 8)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.SCORCHING_SANDS, i18next.t('move:scorchingSands.name'), Type.GROUND, MoveCategory.SPECIAL, 70, 100, 10, i18next.t('move:scorchingSands.effect'), 30, 0, 8)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new StatusMove(Moves.JUNGLE_HEALING, i18next.t('move:jungleHealing.name'), Type.GRASS, -1, 10, i18next.t('move:jungleHealing.effect'), -1, 0, 8)
      .attr(HealAttr, 0.25, true, false)
      .target(MoveTarget.USER_AND_ALLIES),
    new AttackMove(Moves.WICKED_BLOW, i18next.t('move:wickedBlow.name'), Type.DARK, MoveCategory.PHYSICAL, 75, 100, 5, i18next.t('move:wickedBlow.effect'), -1, 0, 8)
      .attr(CritOnlyAttr)
      .punchingMove(),
    new AttackMove(Moves.SURGING_STRIKES, i18next.t('move:surgingStrikes.name'), Type.WATER, MoveCategory.PHYSICAL, 25, 100, 5, i18next.t('move:surgingStrikes.effect'), -1, 0, 8)
      .attr(MultiHitAttr, MultiHitType._3)
      .attr(CritOnlyAttr)
      .punchingMove(),
    new AttackMove(Moves.THUNDER_CAGE, i18next.t('move:thunderCage.name'), Type.ELECTRIC, MoveCategory.SPECIAL, 80, 90, 15, i18next.t('move:thunderCage.effect'), 100, 0, 8)
      .attr(TrapAttr, BattlerTagType.THUNDER_CAGE),
    new AttackMove(Moves.DRAGON_ENERGY, i18next.t('move:dragonEnergy.name'), Type.DRAGON, MoveCategory.SPECIAL, 150, 100, 5, i18next.t('move:dragonEnergy.effect'), -1, 0, 8)
      .attr(HpPowerAttr)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.FREEZING_GLARE, i18next.t('move:freezingGlare.name'), Type.PSYCHIC, MoveCategory.SPECIAL, 90, 100, 10, i18next.t('move:freezingGlare.effect'), 10, 0, 8)
      .attr(StatusEffectAttr, StatusEffect.FREEZE),
    new AttackMove(Moves.FIERY_WRATH, i18next.t('move:fieryWrath.name'), Type.DARK, MoveCategory.SPECIAL, 90, 100, 10, i18next.t('move:fieryWrath.effect'), 20, 0, 8)
      .attr(FlinchAttr)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.THUNDEROUS_KICK, i18next.t('move:thunderousKick.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 90, 100, 10, i18next.t('move:thunderousKick.effect'), 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.DEF, -1),
    new AttackMove(Moves.GLACIAL_LANCE, i18next.t('move:glacialLance.name'), Type.ICE, MoveCategory.PHYSICAL, 120, 100, 5, i18next.t('move:glacialLance.effect'), -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.ASTRAL_BARRAGE, i18next.t('move:astralBarrage.name'), Type.GHOST, MoveCategory.SPECIAL, 120, 100, 5, i18next.t('move:astralBarrage.effect'), -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.EERIE_SPELL, i18next.t('move:eerieSpell.name'), Type.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 5, i18next.t('move:eerieSpell.effect'), 100, 0, 8)
      .soundBased(),
    new AttackMove(Moves.DIRE_CLAW, i18next.t('move:direClaw.name'), Type.POISON, MoveCategory.PHYSICAL, 80, 100, 15, i18next.t('move:direClaw.effect'), 50, 0, 8)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .attr(StatusEffectAttr, StatusEffect.SLEEP),
    new AttackMove(Moves.PSYSHIELD_BASH, i18next.t('move:psyshieldBash.name'), Type.PSYCHIC, MoveCategory.PHYSICAL, 70, 90, 10, i18next.t('move:psyshieldBash.effect'), 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.DEF, 1, true),
    new SelfStatusMove(Moves.POWER_SHIFT, i18next.t('move:powerShift.name'), Type.NORMAL, -1, 10, i18next.t('move:powerShift.effect'), 100, 0, 8),
    new AttackMove(Moves.STONE_AXE, i18next.t('move:stoneAxe.name'), Type.ROCK, MoveCategory.PHYSICAL, 65, 90, 15, i18next.t('move:stoneAxe.effect'), 100, 0, 8)
      .attr(AddArenaTrapTagAttr, ArenaTagType.STEALTH_ROCK)
      .slicingMove(),
    new AttackMove(Moves.SPRINGTIDE_STORM, i18next.t('move:springtideStorm.name'), Type.FAIRY, MoveCategory.SPECIAL, 100, 80, 5, i18next.t('move:springtideStorm.effect'), 30, 0, 8)
      .attr(StatChangeAttr, BattleStat.ATK, -1)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.MYSTICAL_POWER, i18next.t('move:mysticalPower.name'), Type.PSYCHIC, MoveCategory.SPECIAL, 70, 90, 10, i18next.t('move:mysticalPower.effect'), 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.SPATK, 1, true),
    new AttackMove(Moves.RAGING_FURY, i18next.t('move:ragingFury.name'), Type.FIRE, MoveCategory.PHYSICAL, 120, 100, 10, i18next.t('move:ragingFury.effect'), -1, 0, 8)
      .attr(FrenzyAttr)
      .attr(MissEffectAttr, frenzyMissFunc)
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new AttackMove(Moves.WAVE_CRASH, i18next.t('move:waveCrash.name'), Type.WATER, MoveCategory.PHYSICAL, 120, 100, 10, i18next.t('move:waveCrash.effect'), -1, 0, 8)
      .attr(RecoilAttr, false, 0.33),
    new AttackMove(Moves.CHLOROBLAST, i18next.t('move:chloroblast.name'), Type.GRASS, MoveCategory.SPECIAL, 150, 95, 5, i18next.t('move:chloroblast.effect'), -1, 0, 8)
      .attr(RecoilAttr, true, 0.5),
    new AttackMove(Moves.MOUNTAIN_GALE, i18next.t('move:mountainGale.name'), Type.ICE, MoveCategory.PHYSICAL, 100, 85, 10, i18next.t('move:mountainGale.effect'), 30, 0, 8)
      .attr(FlinchAttr),
    new SelfStatusMove(Moves.VICTORY_DANCE, i18next.t('move:victoryDance.name'), Type.FIGHTING, -1, 10, i18next.t('move:victoryDance.effect'), 100, 0, 8)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF, BattleStat.SPD ], 1, true)
      .danceMove(),
    new AttackMove(Moves.HEADLONG_RUSH, i18next.t('move:headlongRush.name'), Type.GROUND, MoveCategory.PHYSICAL, 120, 100, 5, i18next.t('move:headlongRush.effect'), 100, 0, 8)
      .attr(StatChangeAttr, [ BattleStat.DEF, BattleStat.SPDEF ], -1, true)
      .punchingMove(),
    new AttackMove(Moves.BARB_BARRAGE, i18next.t('move:barbBarrage.name'), Type.POISON, MoveCategory.PHYSICAL, 60, 100, 10, i18next.t('move:barbBarrage.effect'), 50, 0, 8)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.status && (target.status.effect === StatusEffect.POISON || target.status.effect === StatusEffect.TOXIC) ? 2 : 1)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(Moves.ESPER_WING, i18next.t('move:esperWing.name'), Type.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 10, i18next.t('move:esperWing.effect'), 100, 0, 8)
      .attr(HighCritAttr)
      .attr(StatChangeAttr, BattleStat.SPD, 1, true),
    new AttackMove(Moves.BITTER_MALICE, i18next.t('move:bitterMalice.name'), Type.GHOST, MoveCategory.SPECIAL, 75, 100, 10, i18next.t('move:bitterMalice.effect'), 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.ATK, -1),
    new SelfStatusMove(Moves.SHELTER, i18next.t('move:shelter.name'), Type.STEEL, -1, 10, i18next.t('move:shelter.effect'), 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.DEF, 2, true),
    new AttackMove(Moves.TRIPLE_ARROWS, i18next.t('move:tripleArrows.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 90, 100, 10, i18next.t('move:tripleArrows.effect'), 30, 0, 8)
      .attr(HighCritAttr)
      .attr(StatChangeAttr, BattleStat.DEF, -1)
      .attr(FlinchAttr),
    new AttackMove(Moves.INFERNAL_PARADE, i18next.t('move:infernalParade.name'), Type.GHOST, MoveCategory.SPECIAL, 60, 100, 15, i18next.t('move:infernalParade.effect'), 30, 0, 8)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.status ? 2 : 1),
    new AttackMove(Moves.CEASELESS_EDGE, i18next.t('move:ceaselessEdge.name'), Type.DARK, MoveCategory.PHYSICAL, 65, 90, 15, i18next.t('move:ceaselessEdge.effect'), 100, 0, 8)
      .attr(AddArenaTrapTagAttr, ArenaTagType.SPIKES)
      .slicingMove(),
    new AttackMove(Moves.BLEAKWIND_STORM, i18next.t('move:bleakwindStorm.name'), Type.FLYING, MoveCategory.SPECIAL, 100, 80, 10, i18next.t('move:bleakwindStorm.effect'), 30, 0, 8)
      .attr(ThunderAccuracyAttr)
      .attr(StatChangeAttr, BattleStat.SPD, -1)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.WILDBOLT_STORM, i18next.t('move:wildboltStorm.name'), Type.ELECTRIC, MoveCategory.SPECIAL, 100, 80, 10, i18next.t('move:wildboltStorm.effect'), 20, 0, 8)
      .attr(ThunderAccuracyAttr)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.SANDSEAR_STORM, i18next.t('move:sandsearStorm.name'), Type.GROUND, MoveCategory.SPECIAL, 100, 80, 10, i18next.t('move:sandsearStorm.effect'), 20, 0, 8)
      .attr(ThunderAccuracyAttr)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.LUNAR_BLESSING, i18next.t('move:lunarBlessing.name'), Type.PSYCHIC, -1, 5, i18next.t('move:lunarBlessing.effect'), -1, 0, 8)
      .attr(HealAttr, 0.25)
      .target(MoveTarget.USER_AND_ALLIES)
      .triageMove(),
    new SelfStatusMove(Moves.TAKE_HEART, i18next.t('move:takeHeart.name'), Type.PSYCHIC, -1, 10, i18next.t('move:takeHeart.effect'), -1, 0, 8)
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
    new AttackMove(Moves.TERA_BLAST, i18next.t('move:teraBlast.name'), Type.NORMAL, MoveCategory.SPECIAL, 80, 100, 10, i18next.t('move:teraBlast.effect'), -1, 0, 9)
      .attr(TeraBlastCategoryAttr),
    new SelfStatusMove(Moves.SILK_TRAP, i18next.t('move:silkTrap.name'), Type.BUG, -1, 10, i18next.t('move:silkTrap.effect'), -1, 4, 9)
      .attr(ProtectAttr, BattlerTagType.SILK_TRAP),
    new AttackMove(Moves.AXE_KICK, i18next.t('move:axeKick.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 120, 90, 10, i18next.t('move:axeKick.effect'), 30, 0, 9)
      .attr(MissEffectAttr, crashDamageFunc)
      .attr(NoEffectAttr, crashDamageFunc)
      .attr(ConfuseAttr),
    new AttackMove(Moves.LAST_RESPECTS, i18next.t('move:lastRespects.name'), Type.GHOST, MoveCategory.PHYSICAL, 50, 100, 10, i18next.t('move:lastRespects.effect'), -1, 0, 9)
      .attr(MovePowerMultiplierAttr, (user, target, move) => {
          return user.scene.getParty().reduce((acc, pokemonInParty) => acc + (pokemonInParty.status?.effect == StatusEffect.FAINT ? 1 : 0),
          1,)
        })
      .makesContact(false),
    new AttackMove(Moves.LUMINA_CRASH, i18next.t('move:luminaCrash.name'), Type.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 10, i18next.t('move:luminaCrash.effect'), 100, 0, 9)
      .attr(StatChangeAttr, BattleStat.SPDEF, -2),
    new AttackMove(Moves.ORDER_UP, i18next.t('move:orderUp.name'), Type.DRAGON, MoveCategory.PHYSICAL, 80, 100, 10, i18next.t('move:orderUp.effect'), -1, 0, 9)
      .makesContact(false),
    new AttackMove(Moves.JET_PUNCH, i18next.t('move:jetPunch.name'), Type.WATER, MoveCategory.PHYSICAL, 60, 100, 15, i18next.t('move:jetPunch.effect'), -1, 1, 9)
      .punchingMove(),
    new StatusMove(Moves.SPICY_EXTRACT, i18next.t('move:spicyExtract.name'), Type.GRASS, -1, 15,  i18next.t('move:spicyExtract.effect'), 100, 0, 9)
      .attr(StatChangeAttr, BattleStat.ATK, 2)
      .attr(StatChangeAttr, BattleStat.DEF, -2),
    new AttackMove(Moves.SPIN_OUT, i18next.t('move:spinOut.name'), Type.STEEL, MoveCategory.PHYSICAL, 100, 100, 5, i18next.t('move:spinOut.effect'), 100, 0, 9)
      .attr(StatChangeAttr, BattleStat.SPD, -2, true),
    new AttackMove(Moves.POPULATION_BOMB, i18next.t('move:populationBomb.name'), Type.NORMAL, MoveCategory.PHYSICAL, 20, 90, 10, i18next.t('move:populationBomb.effect'), -1, 0, 9)
      .attr(MultiHitAttr, MultiHitType._1_TO_10)
      .slicingMove(),
    new AttackMove(Moves.ICE_SPINNER, i18next.t('move:iceSpinner.name'), Type.ICE, MoveCategory.PHYSICAL, 80, 100, 15, i18next.t('move:iceSpinner.effect'), -1, 0, 9)
      .attr(ClearTerrainAttr),
    new AttackMove(Moves.GLAIVE_RUSH, i18next.t('move:glaiveRush.name'), Type.DRAGON, MoveCategory.PHYSICAL, 120, 100, 5, i18next.t('move:glaiveRush.effect'), -1, 0, 9),
    new StatusMove(Moves.REVIVAL_BLESSING, i18next.t('move:revivalBlessing.name'), Type.NORMAL, -1, 1, i18next.t('move:revivalBlessing.effect'), -1, 0, 9)
      .triageMove(),
    new AttackMove(Moves.SALT_CURE, i18next.t('move:saltCure.name'), Type.ROCK, MoveCategory.PHYSICAL, 40, 100, 15, i18next.t('move:saltCure.effect'), -1, 0, 9)
      .attr(AddBattlerTagAttr, BattlerTagType.SALT_CURED)
      .makesContact(false),
    new AttackMove(Moves.TRIPLE_DIVE, i18next.t('move:tripleDive.name'), Type.WATER, MoveCategory.PHYSICAL, 30, 95, 10, i18next.t('move:tripleDive.effect'), -1, 0, 9)
      .attr(MultiHitAttr, MultiHitType._3),
    new AttackMove(Moves.MORTAL_SPIN, i18next.t('move:mortalSpin.name'), Type.POISON, MoveCategory.PHYSICAL, 30, 100, 15, i18next.t('move:mortalSpin.effect'), 100, 0, 9)
      .attr(LapseBattlerTagAttr, [ BattlerTagType.BIND, BattlerTagType.WRAP, BattlerTagType.FIRE_SPIN, BattlerTagType.WHIRLPOOL, BattlerTagType.CLAMP, BattlerTagType.SAND_TOMB, BattlerTagType.MAGMA_STORM, BattlerTagType.THUNDER_CAGE, BattlerTagType.SEEDED ], true)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.DOODLE, i18next.t('move:doodle.name'), Type.NORMAL, 100, 10, i18next.t('move:doodle.effect'), -1, 0, 9)
      .attr(AbilityCopyAttr, true),
    new SelfStatusMove(Moves.FILLET_AWAY, i18next.t('move:filletAway.name'), Type.NORMAL, -1, 10, i18next.t('move:filletAway.effect'), -1, 0, 9)
      .attr(CutHpStatBoostAttr, [ BattleStat.ATK, BattleStat.SPATK, BattleStat.SPD ], 2, 2),
    new AttackMove(Moves.KOWTOW_CLEAVE, i18next.t('move:kowtowCleave.name'), Type.DARK, MoveCategory.PHYSICAL, 85, -1, 10, i18next.t('move:kowtowCleave.effect'), -1, 0, 9)
      .slicingMove(),
    new AttackMove(Moves.FLOWER_TRICK, i18next.t('move:flowerTrick.name'), Type.GRASS, MoveCategory.PHYSICAL, 70, -1, 10, i18next.t('move:flowerTrick.effect'), 100, 0, 9)
      .attr(CritOnlyAttr)
      .makesContact(false),
    new AttackMove(Moves.TORCH_SONG, i18next.t('move:torchSong.name'), Type.FIRE, MoveCategory.SPECIAL, 80, 100, 10, i18next.t('move:torchSong.effect'), 100, 0, 9)
      .attr(StatChangeAttr, BattleStat.SPATK, 1, true)
      .soundBased(),
    new AttackMove(Moves.AQUA_STEP, i18next.t('move:aquaStep.name'), Type.WATER, MoveCategory.PHYSICAL, 80, 100, 10, i18next.t('move:aquaStep.effect'), 100, 0, 9)
      .attr(StatChangeAttr, BattleStat.SPD, 1, true)
      .danceMove(),
    new AttackMove(Moves.RAGING_BULL, i18next.t('move:ragingBull.name'), Type.NORMAL, MoveCategory.PHYSICAL, 90, 100, 10, i18next.t('move:ragingBull.effect'), -1, 0, 9)
      .attr(RagingBullTypeAttr)
      .attr(RemoveScreensAttr),
    new AttackMove(Moves.MAKE_IT_RAIN, i18next.t('move:makeItRain.name'), Type.STEEL, MoveCategory.SPECIAL, 120, 100, 5, i18next.t('move:makeItRain.effect'), -1, 0, 9)
      .attr(MoneyAttr)
      .attr(StatChangeAttr, BattleStat.SPATK, -1, true, null, true, true)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.PSYBLADE, i18next.t('move:psyblade.name'), Type.PSYCHIC, MoveCategory.PHYSICAL, 80, 100, 15, i18next.t('move:psyblade.effect'), -1, 0, 9)
      .attr(MovePowerMultiplierAttr, (user, target, move) => user.scene.arena.getTerrainType() === TerrainType.ELECTRIC && user.isGrounded() ? 1.5 : 1)  
      .slicingMove(),
    new AttackMove(Moves.HYDRO_STEAM, i18next.t('move:hydroSteam.name'), Type.WATER, MoveCategory.SPECIAL, 80, 100, 15, i18next.t('move:hydroSteam.effect'), -1, 0, 9),
    new AttackMove(Moves.RUINATION, i18next.t('move:ruination.name'), Type.DARK, MoveCategory.SPECIAL, 1, 90, 10, i18next.t('move:ruination.effect'), -1, 0, 9)
      .attr(TargetHalfHpDamageAttr),
    new AttackMove(Moves.COLLISION_COURSE, i18next.t('move:collisionCourse.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 100, 100, 5, i18next.t('move:collisionCourse.effect'), -1, 0, 9)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.getAttackTypeEffectiveness(move.type) >= 2 ? 5461/4096 : 1),
    new AttackMove(Moves.ELECTRO_DRIFT, i18next.t('move:electroDrift.name'), Type.ELECTRIC, MoveCategory.SPECIAL, 100, 100, 5, i18next.t('move:electroDrift.effect'), -1, 0, 9)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.getAttackTypeEffectiveness(move.type) >= 2 ? 5461/4096 : 1)
      .makesContact(),
    new SelfStatusMove(Moves.SHED_TAIL, i18next.t('move:shedTail.name'), Type.NORMAL, -1, 10, i18next.t('move:shedTail.effect'), -1, 0, 9),
    new StatusMove(Moves.CHILLY_RECEPTION, i18next.t('move:chillyReception.name'), Type.ICE, -1, 10, i18next.t('move:chillyReception.effect'), -1, 0, 9)
      .attr(WeatherChangeAttr, WeatherType.SNOW)
      .attr(ForceSwitchOutAttr, true, false)
      .target(MoveTarget.BOTH_SIDES),
    new SelfStatusMove(Moves.TIDY_UP, i18next.t('move:tidyUp.name'), Type.NORMAL, -1, 10, i18next.t('move:tidyUp.effect'), 100, 0, 9)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.SPD ], 1, true),
    new StatusMove(Moves.SNOWSCAPE, i18next.t('move:snowscape.name'), Type.ICE, -1, 10, i18next.t('move:snowscape.effect'), -1, 0, 9)
      .attr(WeatherChangeAttr, WeatherType.SNOW)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.POUNCE, i18next.t('move:pounce.name'), Type.BUG, MoveCategory.PHYSICAL, 50, 100, 20, i18next.t('move:pounce.effect'), 100, 0, 9)
      .attr(StatChangeAttr, BattleStat.SPD, -1),
    new AttackMove(Moves.TRAILBLAZE, i18next.t('move:trailblaze.name'), Type.GRASS, MoveCategory.PHYSICAL, 50, 100, 20, i18next.t('move:trailblaze.effect'), 100, 0, 9)
      .attr(StatChangeAttr, BattleStat.SPD, 1, true),
    new AttackMove(Moves.CHILLING_WATER, i18next.t('move:chillingWater.name'), Type.WATER, MoveCategory.SPECIAL, 50, 100, 20, i18next.t('move:chillingWater.effect'), -1, 0, 9)
      .attr(StatChangeAttr, BattleStat.ATK, -1),
    new AttackMove(Moves.HYPER_DRILL, i18next.t('move:hyperDrill.name'), Type.NORMAL, MoveCategory.PHYSICAL, 100, 100, 5, i18next.t('move:hyperDrill.effect'), -1, 0, 9)
      .ignoresProtect(),
    new AttackMove(Moves.TWIN_BEAM, i18next.t('move:twinBeam.name'), Type.PSYCHIC, MoveCategory.SPECIAL, 40, 100, 10, i18next.t('move:twinBeam.effect'), -1, 0, 9)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.RAGE_FIST, i18next.t('move:rageFist.name'), Type.GHOST, MoveCategory.PHYSICAL, 50, 100, 10, i18next.t('move:rageFist.effect'), -1, 0, 9)
      .attr(HitCountPowerAttr)
      .punchingMove(),
    new AttackMove(Moves.ARMOR_CANNON, i18next.t('move:armorCannon.name'), Type.FIRE, MoveCategory.SPECIAL, 120, 100, 5, i18next.t('move:armorCannon.effect'), -1, 0, 9)
      .attr(StatChangeAttr, [ BattleStat.DEF, BattleStat.SPDEF ], -1, true),
    new AttackMove(Moves.BITTER_BLADE, i18next.t('move:bitterBlade.name'), Type.FIRE, MoveCategory.PHYSICAL, 90, 100, 10, i18next.t('move:bitterBlade.effect'), -1, 0, 9)
      .attr(HitHealAttr)
      .slicingMove()
      .triageMove(),
    new AttackMove(Moves.DOUBLE_SHOCK, i18next.t('move:doubleShock.name'), Type.ELECTRIC, MoveCategory.PHYSICAL, 120, 100, 5, i18next.t('move:doubleShock.effect'), -1, 0, 9),
    new AttackMove(Moves.GIGATON_HAMMER, i18next.t('move:gigatonHammer.name'), Type.STEEL, MoveCategory.PHYSICAL, 160, 100, 5, i18next.t('move:gigatonHammer.effect'), -1, 0, 9)
      .makesContact(false)
      .condition((user, target, move) => {
        const turnMove = user.getLastXMoves(1);
        return !turnMove.length || turnMove[0].move !== move.id || turnMove[0].result !== MoveResult.SUCCESS;
      }), // TODO Add Instruct/Encore interaction
    new AttackMove(Moves.COMEUPPANCE, i18next.t('move:comeuppance.name'), Type.DARK, MoveCategory.PHYSICAL, 1, 100, 10, i18next.t('move:comeuppance.effect'), -1, 0, 9)
      .attr(CounterDamageAttr, (move: Move) => (move.category === MoveCategory.PHYSICAL || move.category === MoveCategory.SPECIAL), 1.5)
      .target(MoveTarget.ATTACKER),
    new AttackMove(Moves.AQUA_CUTTER, i18next.t('move:aquaCutter.name'), Type.WATER, MoveCategory.PHYSICAL, 70, 100, 20, i18next.t('move:aquaCutter.effect'), -1, 0, 9)
      .attr(HighCritAttr)
      .slicingMove()
      .makesContact(false),
    new AttackMove(Moves.BLAZING_TORQUE, i18next.t('move:blazingTorque.name'), Type.FIRE, MoveCategory.PHYSICAL, 80, 100, 10, i18next.t('move:blazingTorque.effect'), 30, 0, 9)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .makesContact(false),
    new AttackMove(Moves.WICKED_TORQUE, i18next.t('move:wickedTorque.name'), Type.DARK, MoveCategory.PHYSICAL, 80, 100, 10, i18next.t('move:wickedTorque.effect'), 10, 0, 9)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .makesContact(false),
    new AttackMove(Moves.NOXIOUS_TORQUE, i18next.t('move:noxiousTorque.name'), Type.POISON, MoveCategory.PHYSICAL, 100, 100, 10, i18next.t('move:noxiousTorque.effect'), 30, 0, 9)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .makesContact(false),
    new AttackMove(Moves.COMBAT_TORQUE, i18next.t('move:combatTorque.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 100, 100, 10, i18next.t('move:combatTorque.effect'), 30, 0, 9)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .makesContact(false),
    new AttackMove(Moves.MAGICAL_TORQUE, i18next.t('move:magicalTorque.name'), Type.FAIRY, MoveCategory.PHYSICAL, 100, 100, 10, i18next.t('move:magicalTorque.effect'), 30, 0, 9)
      .attr(ConfuseAttr)
      .makesContact(false),
    new AttackMove(Moves.BLOOD_MOON, i18next.t('move:bloodMoon.name'), Type.NORMAL, MoveCategory.SPECIAL, 140, 100, 5, i18next.t('move:bloodMoon.effect'), -1, 0, 9)
      .condition((user, target, move) => {
        const turnMove = user.getLastXMoves(1);
        return !turnMove.length || turnMove[0].move !== move.id || turnMove[0].result !== MoveResult.SUCCESS;
      }), // TODO Add Instruct/Encore interaction
    new AttackMove(Moves.MATCHA_GOTCHA, i18next.t('move:matchaGotcha.name'), Type.GRASS, MoveCategory.SPECIAL, 80, 90, 15, i18next.t('move:matchaGotcha.effect'), 20, 0, 9)
      .attr(HitHealAttr)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .triageMove(),
    new AttackMove(Moves.SYRUP_BOMB, i18next.t('move:syrupBomb.name'), Type.GRASS, MoveCategory.SPECIAL, 60, 85, 10, i18next.t('move:syrupBomb.effect'), -1, 0, 9)
      .attr(StatChangeAttr, BattleStat.SPD, -1) //Temporary
      .ballBombMove(),
    new AttackMove(Moves.IVY_CUDGEL, i18next.t('move:ivyCudgel.name'), Type.GRASS, MoveCategory.PHYSICAL, 100, 100, 10, i18next.t('move:ivyCudgel.effect'), -1, 0, 9)
      .attr(IvyCudgelTypeAttr)
      .attr(HighCritAttr)
      .makesContact(false),
    new AttackMove(Moves.ELECTRO_SHOT, i18next.t('move:electroShot.name'), Type.ELECTRIC, MoveCategory.SPECIAL, 130, 100, 10, i18next.t('move:electroShot.effect'), 100, 0, 9)
      .attr(ElectroShotChargeAttr)
      .attr(StatChangeAttr, BattleStat.SPATK, 1, true)
      .ignoresVirtual(),
    new AttackMove(Moves.TERA_STARSTORM, i18next.t('move:teraStarstorm.name'), Type.NORMAL, MoveCategory.SPECIAL, 120, 100, 5, i18next.t('move:teraStarstorm.effect'), -1, 0, 9)
      .attr(TeraBlastCategoryAttr),
    new AttackMove(Moves.FICKLE_BEAM, i18next.t('move:fickleBeam.name'), Type.DRAGON, MoveCategory.SPECIAL, 80, 100, 5, i18next.t('move:fickleBeam.effect'), 30, 0, 9)
      .attr(PreMoveMessageAttr, doublePowerChanceMessageFunc)
      .attr(DoublePowerChanceAttr),
    new StatusMove(Moves.BURNING_BULWARK, i18next.t('move:burningBulwark.name'), Type.FIRE, -1, 10, i18next.t('move:burningBulwark.effect'), 100, 4, 9)
      .attr(ProtectAttr, BattlerTagType.BURNING_BULWARK),
    new AttackMove(Moves.THUNDERCLAP, i18next.t('move:thunderclap.name'), Type.ELECTRIC, MoveCategory.SPECIAL, 70, 100, 5, i18next.t('move:thunderclap.effect'), -1, 1, 9)
      .condition((user, target, move) => user.scene.currentBattle.turnCommands[target.getBattlerIndex()].command === Command.FIGHT && !target.turnData.acted && allMoves[user.scene.currentBattle.turnCommands[target.getBattlerIndex()].move.move].category !== MoveCategory.STATUS),
    new AttackMove(Moves.MIGHTY_CLEAVE, i18next.t('move:mightyCleave.name'), Type.ROCK, MoveCategory.PHYSICAL, 95, 100, 5, i18next.t('move:mightyCleave.effect'), -1, 0, 9)
      .ignoresProtect(),
    new AttackMove(Moves.TACHYON_CUTTER, i18next.t('move:tachyonCutter.name'), Type.STEEL, MoveCategory.SPECIAL, 50, -1, 10, i18next.t('move:tachyonCutter.effect'), -1, 0, 9)
      .attr(MultiHitAttr, MultiHitType._2)
      .slicingMove(),
    new AttackMove(Moves.HARD_PRESS, i18next.t('move:hardPress.name'), Type.STEEL, MoveCategory.PHYSICAL, 100, 100, 5, i18next.t('move:hardPress.effect'), -1, 0, 9)
      .attr(OpponentHighHpPowerAttr),
    new StatusMove(Moves.DRAGON_CHEER, i18next.t('move:dragonCheer.name'), Type.DRAGON, -1, 15, i18next.t('move:dragonCheer.effect'), 100, 0, 9)
      .attr(AddBattlerTagAttr, BattlerTagType.CRIT_BOOST, false, true)
      .target(MoveTarget.NEAR_ALLY),
    new AttackMove(Moves.ALLURING_VOICE, i18next.t('move:alluringVoice.name'), Type.FAIRY, MoveCategory.SPECIAL, 80, 100, 10, i18next.t('move:alluringVoice.effect'), -1, 0, 9),
    new AttackMove(Moves.TEMPER_FLARE, i18next.t('move:temperFlare.name'), Type.FIRE, MoveCategory.PHYSICAL, 75, 100, 10, i18next.t('move:temperFlare.effect'), -1, 0, 9),
    new AttackMove(Moves.SUPERCELL_SLAM, i18next.t('move:supercellSlam.name'), Type.ELECTRIC, MoveCategory.PHYSICAL, 100, 95, 15, i18next.t('move:supercellSlam.effect'), -1, 0, 9)
      .attr(MissEffectAttr, crashDamageFunc)
      .attr(NoEffectAttr, crashDamageFunc),
    new AttackMove(Moves.PSYCHIC_NOISE, i18next.t('move:psychicNoise.name'), Type.PSYCHIC, MoveCategory.SPECIAL, 75, 100, 10, i18next.t('move:psychicNoise.effect'), -1, 0, 9)
      .soundBased(),
    new AttackMove(Moves.UPPER_HAND, i18next.t('move:upperHand.name'), Type.FIGHTING, MoveCategory.PHYSICAL, 65, 100, 15, i18next.t('move:upperHand.effect'), -1, 3, 9),
    new AttackMove(Moves.MALIGNANT_CHAIN, i18next.t('move:malignantChain.name'), Type.POISON, MoveCategory.SPECIAL, 100, 100, 5, i18next.t('move:malignantChain.effect'), 50, 0, 9)
      .attr(StatusEffectAttr, StatusEffect.TOXIC)
  );
}
