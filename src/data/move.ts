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
import { UnswappableAbilityAbAttr, UncopiableAbilityAbAttr, UnsuppressableAbilityAbAttr, NoTransformAbilityAbAttr, BlockRecoilDamageAttr, BlockOneHitKOAbAttr, IgnoreContactAbAttr, MaxMultiHitAbAttr, applyAbAttrs, BlockNonDirectDamageAbAttr, applyPreSwitchOutAbAttrs, PreSwitchOutAbAttr, applyPostDefendAbAttrs, PostDefendContactApplyStatusEffectAbAttr, MoveAbilityBypassAbAttr, ReverseDrainAbAttr, FieldPreventExplosiveMovesAbAttr } from "./ability";
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
import i18next, { Localizable } from '../plugins/i18n';

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
  TRIAGE_MOVE = 16384,
  IGNORE_ABILITIES = 32768
}

type MoveConditionFunc = (user: Pokemon, target: Pokemon, move: Move) => boolean;
type UserMoveConditionFunc = (user: Pokemon, move: Move) => boolean;

export default class Move implements Localizable {
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
  private nameAppend: string;

  constructor(id: Moves, type: Type, category: MoveCategory, defaultMoveTarget: MoveTarget, power: integer, accuracy: integer, pp: integer, chance: integer, priority: integer, generation: integer) {
    this.id = id;

    this.nameAppend = '';
    this.type = type;
    this.category = category;
    this.moveTarget = defaultMoveTarget;
    this.power = power;
    this.accuracy = accuracy;
    this.pp = pp;
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

    this.localize();
  }

  localize(): void {
    const i18nKey = Moves[this.id].split('_').filter(f => f).map((f, i) => i ? `${f[0]}${f.slice(1).toLowerCase()}` : f.toLowerCase()).join('') as unknown as string;

    this.name = this.id ? `${i18next.t(`move:${i18nKey}.name`).toString()}${this.nameAppend}` : '';
    this.effect = this.id ? `${i18next.t(`move:${i18nKey}.effect`).toString()}${this.nameAppend}` : '';
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
  
  partial(): this {
    this.nameAppend += ' (P)';
    return this;
  }

  unimplemented(): this {
    this.nameAppend += ' (N)';
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

  ignoresAbilities(ignoresAbilities?: boolean): this {
    this.setFlag(MoveFlags.IGNORE_ABILITIES, ignoresAbilities);
    return this;
  }

  checkFlag(flag: MoveFlags, user: Pokemon, target: Pokemon): boolean {
    switch (flag) {
      case MoveFlags.MAKES_CONTACT:
        if (user.hasAbilityWithAttr(IgnoreContactAbAttr))
          return false;
        break;
      case MoveFlags.IGNORE_ABILITIES:
        if (user.hasAbilityWithAttr(MoveAbilityBypassAbAttr)) {
          const abilityEffectsIgnored = new Utils.BooleanHolder(false);
          applyAbAttrs(MoveAbilityBypassAbAttr, user, abilityEffectsIgnored, this);
          if (abilityEffectsIgnored.value)
            return true;
        }
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
  constructor(id: Moves, type: Type, category: MoveCategory, power: integer, accuracy: integer, pp: integer, chance: integer, priority: integer, generation: integer) {
    super(id, type, category, MoveTarget.NEAR_OTHER, power, accuracy, pp, chance, priority, generation);
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
  constructor(id: Moves, type: Type, accuracy: integer, pp: integer, chance: integer, priority: integer, generation: integer) {
    super(id, type, MoveCategory.STATUS, MoveTarget.NEAR_OTHER, -1, accuracy, pp, chance, priority, generation);
  }
}

export class SelfStatusMove extends Move {
  constructor(id: Moves, type: Type, accuracy: integer, pp: integer, chance: integer, priority: integer, generation: integer) {
    super(id, type, MoveCategory.STATUS, MoveTarget.USER, -1, accuracy, pp, chance, priority, generation);
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
  private unblockable: boolean;

  constructor(useHp: boolean = false, damageRatio: number = 0.25, unblockable: boolean = false) {
    super(true);

    this.useHp = useHp;
    this.damageRatio = damageRatio;
    this.unblockable = unblockable;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    const cancelled = new Utils.BooleanHolder(false);
    if (!this.unblockable)
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
	user.turnData.damageTaken += recoilDamage;

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
	user.turnData.damageTaken += user.hp;

    return true;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    if (user.isBoss())
      return -20;
    return Math.ceil(((1 - user.getHpRatio()) * 10 - 10) * (target.getAttackTypeEffectiveness(move.type) - 0.5));
  }
}

export class HalfSacrificialAttr extends MoveEffectAttr {
  constructor() {
    super(true, MoveEffectTrigger.PRE_APPLY);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    const cancelled = new Utils.BooleanHolder(false);
    applyAbAttrs(BlockNonDirectDamageAbAttr, user, cancelled);
    if (!cancelled.value){
      user.damageAndUpdate(Math.ceil(user.getMaxHp()/2), HitResult.OTHER, false, true, true);
    }    
    return true;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    if (user.isBoss())
      return -10;
    return Math.ceil(((1 - user.getHpRatio()/2) * 10 - 10) * (target.getAttackTypeEffectiveness(move.type) - 0.5));
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
    const healAmount = Math.max(Math.floor(user.turnData.damageDealt * this.healRatio), 1);
    const reverseDrain = user.hasAbilityWithAttr(ReverseDrainAbAttr);
    user.scene.unshiftPhase(new PokemonHealPhase(user.scene, user.getBattlerIndex(),
      !reverseDrain ? healAmount : healAmount * -1,
      !reverseDrain ? getPokemonMessage(target, ` had its\nenergy drained!`) : undefined,
      false, true));
    if (reverseDrain) user.turnData.damageTaken += healAmount;
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
    const healAmount = target.stats[Stat.ATK] * (Math.max(2, 2 + target.summonData.battleStats[BattleStat.ATK]) / Math.max(2, 2 - target.summonData.battleStats[BattleStat.ATK]));
    const reverseDrain = user.hasAbilityWithAttr(ReverseDrainAbAttr);
    user.scene.unshiftPhase(new PokemonHealPhase(user.scene, user.getBattlerIndex(),
      !reverseDrain ? healAmount : healAmount * -1,
      !reverseDrain ? getPokemonMessage(user, ` regained\nhealth!`) : undefined,
      false, true));
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

export class MultiStatusEffectAttr extends StatusEffectAttr {
  public effects: StatusEffect[];

  constructor(effects: StatusEffect[], selfTarget?: boolean, cureTurn?: integer, overrideStatus?: boolean) {
    super(effects[0], selfTarget, cureTurn, overrideStatus);
    this.effects = effects;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    this.effect = Utils.randSeedItem(this.effects);
    const result = super.apply(user, target, move, args);
    return result;
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    return !(this.selfTarget ? user : target).status && (this.selfTarget ? user : target).canSetStatus(this.effect, true) ? Math.floor(move.chance * -0.1) : 0;
  }
}

export class PsychoShiftEffectAttr extends MoveEffectAttr {
  constructor() {
    super(false, MoveEffectTrigger.HIT);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const statusToApply: StatusEffect = user.status?.effect;

    if (target.status) {
      return false;
    }
    if (!target.status || (target.status.effect === statusToApply && move.chance < 0)) {
      var statusAfflictResult = target.trySetStatus(statusToApply, true);
      if (statusAfflictResult) {
        user.scene.queueMessage(getPokemonMessage(user, getStatusEffectHealText(user.status.effect)));
        user.resetStatus();
        user.updateInfo();
      }
      return statusAfflictResult;
    }
    
    return false;
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    return !(this.selfTarget ? user : target).status && (this.selfTarget ? user : target).canSetStatus(user.status?.effect, true) ? Math.floor(move.chance * -0.1) : 0;
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
  private statIncreaseApplied: boolean;
  constructor() {
    super(ChargeAnim.ELECTRO_SHOT_CHARGING, 'absorbed electricity!', null, true);
    // Add a flag because ChargeAttr skills use themselves twice instead of once over one-to-two turns
    this.statIncreaseApplied = false;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): Promise<boolean> {
    return new Promise(resolve => {
      const weatherType = user.scene.arena.weather?.weatherType;
      if (!user.scene.arena.weather?.isEffectSuppressed(user.scene) && (weatherType === WeatherType.RAIN || weatherType === WeatherType.HEAVY_RAIN)) {
        // Apply the SPATK increase every call when used in the rain
        const statChangeAttr = new StatChangeAttr(BattleStat.SPATK, 1, true);
        statChangeAttr.apply(user, target, move, args);
        // After the SPATK is raised, execute the move resolution e.g. deal damage
        resolve(false);
      } else {
        if (!this.statIncreaseApplied) {
          // Apply the SPATK increase only if it hasn't been applied before e.g. on the first turn charge up animation
          const statChangeAttr = new StatChangeAttr(BattleStat.SPATK, 1, true);
          statChangeAttr.apply(user, target, move, args);
          // Set the flag to true so that on the following turn it doesn't raise SPATK a second time
          this.statIncreaseApplied = true;
        }
        super.apply(user, target, move, args).then(result => {
          if (!result) {
            // On the second turn, reset the statIncreaseApplied flag without applying the SPATK increase
            this.statIncreaseApplied = false;
          }
          resolve(result);
        });
      }
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
        user.scene.queueMessage(getPokemonMessage(user, ` cut its own HP\nand maximized its ${getBattleStatName(this.stats[0])}!`));
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

export class CopyStatsAttr extends MoveEffectAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    for (let s = 0; s < target.summonData.battleStats.length; s++)
      user.summonData.battleStats[s] = target.summonData.battleStats[s];
    if (target.getTag(BattlerTagType.CRIT_BOOST))
      user.addTag(BattlerTagType.CRIT_BOOST, 0, move.id);
    else
      user.removeTag(BattlerTagType.CRIT_BOOST);

    user.updateInfo();

    target.scene.queueMessage(getPokemonMessage(user, 'copied\n') + getPokemonMessage(target, `'s stat changes!`));

    return true;
  }
}

export class InvertStatsAttr extends MoveEffectAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    for (let s = 0; s < target.summonData.battleStats.length; s++)
      target.summonData.battleStats[s] *= -1;

    user.updateInfo();

    target.scene.queueMessage(getPokemonMessage(target, `'s stat changes\nwere all reversed!`));

    return true;
  }
}

export class ResetStatsAttr extends MoveEffectAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    for (let s = 0; s < target.summonData.battleStats.length; s++)
      target.summonData.battleStats[s] = 0;

    user.updateInfo();

    target.scene.queueMessage(getPokemonMessage(target, `'s stat changes\nwere eliminated!`));

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

    if (this.invert) {
      // Gyro ball uses a specific formula
      let userSpeed = user.getStat(this.stat);
      if (userSpeed < 1) {
        // Gen 6+ always have 1 base power
        power.value = 1;
        return true;
      } 
      let bp = Math.floor(Math.min(150, 25 * target.getStat(this.stat) / userSpeed + 1));
      power.value = bp;
      return true;
    }

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

export class FlyingTypeMultiplierAttr extends VariableMoveTypeMultiplierAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const multiplier = args[0] as Utils.NumberHolder;
    multiplier.value *= target.getAttackTypeEffectiveness(Type.FLYING);
    return true;
  }
}

export class OneHitKOAccuracyAttr extends VariableAccuracyAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const accuracy = args[0] as Utils.NumberHolder;
    if (user.level < target.level)
      accuracy.value = 0;
    else
      accuracy.value = Math.min(Math.max(30 + 100 * (1 - target.level / user.level), 0), 100);
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
  user.turnData.damageTaken += Math.floor(user.getMaxHp() / 2);
  
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
      if (target.summonData.disabledMove || target.isMax())
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
        const turnCount = user.randSeedIntRange(1, 2);
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
      case BattlerTagType.CURSED:
      case BattlerTagType.FRENZY:
      case BattlerTagType.TRAPPED:
      case BattlerTagType.BIND:
      case BattlerTagType.WRAP:
      case BattlerTagType.FIRE_SPIN:
      case BattlerTagType.WHIRLPOOL:
      case BattlerTagType.CLAMP:
      case BattlerTagType.SAND_TOMB:
      case BattlerTagType.MAGMA_STORM:
      case BattlerTagType.SNAP_TRAP:
      case BattlerTagType.THUNDER_CAGE:
      case BattlerTagType.INFESTATION:
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

export class CurseAttr extends MoveEffectAttr {
  
  apply(user: Pokemon, target: Pokemon, move:Move, args: any[]): boolean {
    // Determine the correct target based on the user's type
    if (!user.getTypes(true).includes(Type.GHOST)) {
      // For non-Ghost types, target the user itself
      target = user;
    }

    if (user.getTypes(true).includes(Type.GHOST)) {
      if (target.getTag(BattlerTagType.CURSED)) {
        user.scene.queueMessage('But it failed!');
        return false;
      }
      let curseRecoilDamage = Math.floor(user.getMaxHp() / 2);
      user.damageAndUpdate(curseRecoilDamage, HitResult.OTHER, false, true, true);
      user.scene.queueMessage(getPokemonMessage(user, ` cut its own HP\nand laid a curse on the ${target.name}!`));
      target.addTag(BattlerTagType.CURSED, 0, move.id, user.id);
      return true;
    } else {
      target = user;
      user.scene.unshiftPhase(new StatChangePhase(user.scene, user.getBattlerIndex(), this.selfTarget, [BattleStat.ATK, BattleStat.DEF], 1));
      user.scene.unshiftPhase(new StatChangePhase(user.scene, user.getBattlerIndex(), this.selfTarget, [BattleStat.SPD], -1));
      return true;
    }
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
    super(false, MoveEffectTrigger.POST_APPLY, true);
    this.user = !!user;
    this.batonPass = !!batonPass;
  }
  
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): Promise<boolean> {
    return new Promise(resolve => {
      if (!this.user && target.isMax())
        return resolve(false);

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
	  	} else
	  	  resolve(false);
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

export class RemoveTypeAttr extends MoveEffectAttr {

  private removedType: Type;
  private messageCallback: ((user: Pokemon) => void) | undefined;

  constructor(removedType: Type, messageCallback?: (user: Pokemon) => void) {
    super(true, MoveEffectTrigger.POST_APPLY);
    this.removedType = removedType;
    this.messageCallback = messageCallback;

  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    if(user.isTerastallized && user.getTeraType() == this.removedType) // active tera types cannot be removed
      return false;

    const userTypes = user.getTypes(true)
    const modifiedTypes = userTypes.filter(type => type !== this.removedType);
    user.summonData.types = modifiedTypes;
    user.updateInfo();


    if (this.messageCallback) {
      this.messageCallback(user);
    }

    return true;
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
    user.updateInfo();

    user.scene.queueMessage(getPokemonMessage(user, `'s type\nchanged to match ${target.name}'s!`));

    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => target.getTypes()[0] !== Type.UNKNOWN;
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
    user.updateInfo();

    user.scene.queueMessage(getPokemonMessage(user, ` transformed\ninto the ${Utils.toReadableString(Type[biomeType])} type!`));

    return true;
  }
}

export class ChangeTypeAttr extends MoveEffectAttr {
  private type: Type;

  constructor(type: Type) {
    super(false, MoveEffectTrigger.HIT);

    this.type = type;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    target.summonData.types = [this.type];
    target.updateInfo();

    user.scene.queueMessage(getPokemonMessage(target, ` transformed\ninto the ${Utils.toReadableString(Type[this.type])} type!`));

    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => !target.isTerastallized() && !target.hasAbility(Abilities.MULTITYPE) && !target.hasAbility(Abilities.RKS_SYSTEM) && !(target.getTypes().length === 1 && target.getTypes()[0] === this.type);
  }
}

export class AddTypeAttr extends MoveEffectAttr {
  private type: Type;

  constructor(type: Type) {
    super(false, MoveEffectTrigger.HIT);

    this.type = type;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const types = target.getTypes().slice(0, 2).filter(t => t !== Type.UNKNOWN); // TODO: Figure out some way to actually check if another version of this effect is already applied
    types.push(this.type);
    target.summonData.types = types;
    target.updateInfo();

    user.scene.queueMessage(`${Utils.toReadableString(Type[this.type])} was added to\n` + getPokemonMessage(target, '!'));

    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => !target.isTerastallized()&& !target.getTypes().includes(this.type);
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
      let selectTargets: BattlerIndex[];
      switch (true) {
        case (moveTargets.multiple || moveTargets.targets.length === 1): {
          selectTargets = moveTargets.targets;
          break;
        }
        case (moveTargets.targets.indexOf(target.getBattlerIndex()) > -1): {
          selectTargets = [ target.getBattlerIndex() ];
          break;
        }
        default: {
         moveTargets.targets.splice(moveTargets.targets.indexOf(user.getAlly().getBattlerIndex()));
         selectTargets =  [ moveTargets.targets[user.randSeedInt(moveTargets.targets.length)] ];
         break;
        }
      }     
      const targets = selectTargets;   
      user.getMoveQueue().push({ move: move.moveId, targets: targets, ignorePP: true });
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
      initMoveAnim(user.scene, moveId).then(() => {
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
      initMoveAnim(user.scene, moveId).then(() => {
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

const failOnMaxCondition: MoveConditionFunc = (user, target, move) => !target.isMax();

const failIfDampCondition: MoveConditionFunc = (user, target, move) => {
  const cancelled = new Utils.BooleanHolder(false);
  user.scene.getField(true).map(p=>applyAbAttrs(FieldPreventExplosiveMovesAbAttr, p, cancelled));
  return !cancelled.value;
}

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
  new SelfStatusMove(Moves.NONE, Type.NORMAL, MoveCategory.STATUS, -1, -1, 0, 1),
];

export function initMoves() {
  allMoves.push(
    new AttackMove(Moves.POUND, Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 35, -1, 0, 1),
    new AttackMove(Moves.KARATE_CHOP, Type.FIGHTING, MoveCategory.PHYSICAL, 50, 100, 25, -1, 0, 1)
      .attr(HighCritAttr),
    new AttackMove(Moves.DOUBLE_SLAP, Type.NORMAL, MoveCategory.PHYSICAL, 15, 85, 10, -1, 0, 1)
      .attr(MultiHitAttr),
    new AttackMove(Moves.COMET_PUNCH, Type.NORMAL, MoveCategory.PHYSICAL, 18, 85, 15, -1, 0, 1)
      .attr(MultiHitAttr)
      .punchingMove(),
    new AttackMove(Moves.MEGA_PUNCH, Type.NORMAL, MoveCategory.PHYSICAL, 80, 85, 20, -1, 0, 1)
      .punchingMove(),
    new AttackMove(Moves.PAY_DAY, Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 20, -1, 0, 1)
      .attr(MoneyAttr)
      .makesContact(false),
    new AttackMove(Moves.FIRE_PUNCH, Type.FIRE, MoveCategory.PHYSICAL, 75, 100, 15, 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .punchingMove(),
    new AttackMove(Moves.ICE_PUNCH, Type.ICE, MoveCategory.PHYSICAL, 75, 100, 15, 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.FREEZE)
      .punchingMove(),
    new AttackMove(Moves.THUNDER_PUNCH, Type.ELECTRIC, MoveCategory.PHYSICAL, 75, 100, 15, 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .punchingMove(),
    new AttackMove(Moves.SCRATCH, Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 35, -1, 0, 1),
    new AttackMove(Moves.VISE_GRIP, Type.NORMAL, MoveCategory.PHYSICAL, 55, 100, 30, -1, 0, 1),
    new AttackMove(Moves.GUILLOTINE, Type.NORMAL, MoveCategory.PHYSICAL, 200, 30, 5, -1, 0, 1)
      .attr(OneHitKOAttr)
      .attr(OneHitKOAccuracyAttr),
    new AttackMove(Moves.RAZOR_WIND, Type.NORMAL, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 1)
      .attr(ChargeAttr, ChargeAnim.RAZOR_WIND_CHARGING, 'whipped\nup a whirlwind!')
      .attr(HighCritAttr)
      .windMove()
      .ignoresVirtual()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new SelfStatusMove(Moves.SWORDS_DANCE, Type.NORMAL, -1, 20, -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.ATK, 2, true)
      .danceMove(),
    new AttackMove(Moves.CUT, Type.NORMAL, MoveCategory.PHYSICAL, 50, 95, 30, -1, 0, 1)
      .slicingMove(),
    new AttackMove(Moves.GUST, Type.FLYING, MoveCategory.SPECIAL, 40, 100, 35, -1, 0, 1)
      .attr(HitsTagAttr, BattlerTagType.FLYING, true)
      .windMove(),
    new AttackMove(Moves.WING_ATTACK, Type.FLYING, MoveCategory.PHYSICAL, 60, 100, 35, -1, 0, 1),
    new StatusMove(Moves.WHIRLWIND, Type.NORMAL, -1, 20, -1, -6, 1)
      .attr(ForceSwitchOutAttr)
      .attr(HitsTagAttr, BattlerTagType.FLYING, false)
      .hidesTarget()
      .windMove(),
    new AttackMove(Moves.FLY, Type.FLYING, MoveCategory.PHYSICAL, 90, 95, 15, -1, 0, 1)
      .attr(ChargeAttr, ChargeAnim.FLY_CHARGING, 'flew\nup high!', BattlerTagType.FLYING)
      .condition(failOnGravityCondition)
      .ignoresVirtual(),
    new AttackMove(Moves.BIND, Type.NORMAL, MoveCategory.PHYSICAL, 15, 85, 20, 100, 0, 1)
      .attr(TrapAttr, BattlerTagType.BIND),
    new AttackMove(Moves.SLAM, Type.NORMAL, MoveCategory.PHYSICAL, 80, 75, 20, -1, 0, 1),
    new AttackMove(Moves.VINE_WHIP, Type.GRASS, MoveCategory.PHYSICAL, 45, 100, 25, -1, 0, 1),
    new AttackMove(Moves.STOMP, Type.NORMAL, MoveCategory.PHYSICAL, 65, 100, 20, 30, 0, 1)
      .attr(FlinchAttr),
    new AttackMove(Moves.DOUBLE_KICK, Type.FIGHTING, MoveCategory.PHYSICAL, 30, 100, 30, -1, 0, 1)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.MEGA_KICK, Type.NORMAL, MoveCategory.PHYSICAL, 120, 75, 5, -1, 0, 1),
    new AttackMove(Moves.JUMP_KICK, Type.FIGHTING, MoveCategory.PHYSICAL, 100, 95, 10, -1, 0, 1)
      .attr(MissEffectAttr, crashDamageFunc)
      .attr(NoEffectAttr, crashDamageFunc)
      .condition(failOnGravityCondition),
    new AttackMove(Moves.ROLLING_KICK, Type.FIGHTING, MoveCategory.PHYSICAL, 60, 85, 15, 30, 0, 1)
      .attr(FlinchAttr),
    new StatusMove(Moves.SAND_ATTACK, Type.GROUND, 100, 15, -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new AttackMove(Moves.HEADBUTT, Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 15, 30, 0, 1)
      .attr(FlinchAttr),
    new AttackMove(Moves.HORN_ATTACK, Type.NORMAL, MoveCategory.PHYSICAL, 65, 100, 25, -1, 0, 1),
    new AttackMove(Moves.FURY_ATTACK, Type.NORMAL, MoveCategory.PHYSICAL, 15, 85, 20, -1, 0, 1)
      .attr(MultiHitAttr),
    new AttackMove(Moves.HORN_DRILL, Type.NORMAL, MoveCategory.PHYSICAL, 200, 30, 5, -1, 0, 1)
      .attr(OneHitKOAttr)
      .attr(OneHitKOAccuracyAttr),
    new AttackMove(Moves.TACKLE, Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 35, -1, 0, 1),
    new AttackMove(Moves.BODY_SLAM, Type.NORMAL, MoveCategory.PHYSICAL, 85, 100, 15, 30, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.WRAP, Type.NORMAL, MoveCategory.PHYSICAL, 15, 90, 20, 100, 0, 1)
      .attr(TrapAttr, BattlerTagType.WRAP),
    new AttackMove(Moves.TAKE_DOWN, Type.NORMAL, MoveCategory.PHYSICAL, 90, 85, 20, -1, 0, 1)
      .attr(RecoilAttr),
    new AttackMove(Moves.THRASH, Type.NORMAL, MoveCategory.PHYSICAL, 120, 100, 10, -1, 0, 1)
      .attr(FrenzyAttr)
      .attr(MissEffectAttr, frenzyMissFunc)
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new AttackMove(Moves.DOUBLE_EDGE, Type.NORMAL, MoveCategory.PHYSICAL, 120, 100, 15, -1, 0, 1)
      .attr(RecoilAttr, false, 0.33),
    new StatusMove(Moves.TAIL_WHIP, Type.NORMAL, 100, 30, -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.DEF, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.POISON_STING, Type.POISON, MoveCategory.PHYSICAL, 15, 100, 35, 30, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .makesContact(false),
    new AttackMove(Moves.TWINEEDLE, Type.BUG, MoveCategory.PHYSICAL, 25, 100, 20, 20, 0, 1)
      .attr(MultiHitAttr, MultiHitType._2)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .makesContact(false),
    new AttackMove(Moves.PIN_MISSILE, Type.BUG, MoveCategory.PHYSICAL, 25, 95, 20, -1, 0, 1)
      .attr(MultiHitAttr)
      .makesContact(false),
    new StatusMove(Moves.LEER, Type.NORMAL, 100, 30, 100, 0, 1)
      .attr(StatChangeAttr, BattleStat.DEF, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.BITE, Type.DARK, MoveCategory.PHYSICAL, 60, 100, 25, 30, 0, 1)
      .attr(FlinchAttr)
      .bitingMove(),
    new StatusMove(Moves.GROWL, Type.NORMAL, 100, 40, -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.ATK, -1)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.ROAR, Type.NORMAL, -1, 20, -1, -6, 1)
      .attr(ForceSwitchOutAttr)
      .soundBased()
      .hidesTarget(),
    new StatusMove(Moves.SING, Type.NORMAL, 55, 15, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .soundBased(),
    new StatusMove(Moves.SUPERSONIC, Type.NORMAL, 55, 20, -1, 0, 1)
      .attr(ConfuseAttr)
      .soundBased(),
    new AttackMove(Moves.SONIC_BOOM, Type.NORMAL, MoveCategory.SPECIAL, -1, 90, 20, -1, 0, 1)
      .attr(FixedDamageAttr, 20),
    new StatusMove(Moves.DISABLE, Type.NORMAL, 100, 20, -1, 0, 1)
      .attr(DisableMoveAttr)
      .condition(failOnMaxCondition),
    new AttackMove(Moves.ACID, Type.POISON, MoveCategory.SPECIAL, 40, 100, 30, 10, 0, 1)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.EMBER, Type.FIRE, MoveCategory.SPECIAL, 40, 100, 25, 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.FLAMETHROWER, Type.FIRE, MoveCategory.SPECIAL, 90, 100, 15, 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new StatusMove(Moves.MIST, Type.ICE, -1, 30, -1, 0, 1)
      .attr(AddArenaTagAttr, ArenaTagType.MIST, 5, true)
      .target(MoveTarget.USER_SIDE),
    new AttackMove(Moves.WATER_GUN, Type.WATER, MoveCategory.SPECIAL, 40, 100, 25, -1, 0, 1),
    new AttackMove(Moves.HYDRO_PUMP, Type.WATER, MoveCategory.SPECIAL, 110, 80, 5, -1, 0, 1),
    new AttackMove(Moves.SURF, Type.WATER, MoveCategory.SPECIAL, 90, 100, 15, -1, 0, 1)
      .target(MoveTarget.ALL_NEAR_OTHERS)
      .attr(HitsTagAttr, BattlerTagType.UNDERWATER, true),
    new AttackMove(Moves.ICE_BEAM, Type.ICE, MoveCategory.SPECIAL, 90, 100, 10, 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.FREEZE),
    new AttackMove(Moves.BLIZZARD, Type.ICE, MoveCategory.SPECIAL, 110, 70, 5, 10, 0, 1)
      .attr(BlizzardAccuracyAttr)
      .attr(StatusEffectAttr, StatusEffect.FREEZE) // TODO: 30% chance to hit protect/detect in hail
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.PSYBEAM, Type.PSYCHIC, MoveCategory.SPECIAL, 65, 100, 20, 10, 0, 1)
      .attr(ConfuseAttr),
    new AttackMove(Moves.BUBBLE_BEAM, Type.WATER, MoveCategory.SPECIAL, 65, 100, 20, 10, 0, 1)
      .attr(StatChangeAttr, BattleStat.SPD, -1),
    new AttackMove(Moves.AURORA_BEAM, Type.ICE, MoveCategory.SPECIAL, 65, 100, 20, 10, 0, 1)
      .attr(StatChangeAttr, BattleStat.ATK, -1),
    new AttackMove(Moves.HYPER_BEAM, Type.NORMAL, MoveCategory.SPECIAL, 150, 90, 5, -1, 0, 1)
      .attr(RechargeAttr),
    new AttackMove(Moves.PECK, Type.FLYING, MoveCategory.PHYSICAL, 35, 100, 35, -1, 0, 1),
    new AttackMove(Moves.DRILL_PECK, Type.FLYING, MoveCategory.PHYSICAL, 80, 100, 20, -1, 0, 1),
    new AttackMove(Moves.SUBMISSION, Type.FIGHTING, MoveCategory.PHYSICAL, 80, 80, 20, -1, 0, 1)
      .attr(RecoilAttr),
    new AttackMove(Moves.LOW_KICK, Type.FIGHTING, MoveCategory.PHYSICAL, -1, 100, 20, -1, 0, 1)
      .attr(WeightPowerAttr)
      .condition(failOnMaxCondition),
    new AttackMove(Moves.COUNTER, Type.FIGHTING, MoveCategory.PHYSICAL, -1, 100, 20, -1, -5, 1)
      .attr(CounterDamageAttr, (move: Move) => move.category === MoveCategory.PHYSICAL, 2)
      .target(MoveTarget.ATTACKER),
    new AttackMove(Moves.SEISMIC_TOSS, Type.FIGHTING, MoveCategory.PHYSICAL, -1, 100, 20, -1, 0, 1)
      .attr(LevelDamageAttr),
    new AttackMove(Moves.STRENGTH, Type.NORMAL, MoveCategory.PHYSICAL, 80, 100, 15, -1, 0, 1),
    new AttackMove(Moves.ABSORB, Type.GRASS, MoveCategory.SPECIAL, 20, 100, 25, -1, 0, 1)
      .attr(HitHealAttr)
      .triageMove(),
    new AttackMove(Moves.MEGA_DRAIN, Type.GRASS, MoveCategory.SPECIAL, 40, 100, 15, -1, 0, 1)
      .attr(HitHealAttr)
      .triageMove(),
    new StatusMove(Moves.LEECH_SEED, Type.GRASS, 90, 10, -1, 0, 1)
      .attr(AddBattlerTagAttr, BattlerTagType.SEEDED)
      .condition((user, target, move) => !target.getTag(BattlerTagType.SEEDED) && !target.isOfType(Type.GRASS)),
    new SelfStatusMove(Moves.GROWTH, Type.NORMAL, -1, 20, -1, 0, 1)
      .attr(GrowthStatChangeAttr),
    new AttackMove(Moves.RAZOR_LEAF, Type.GRASS, MoveCategory.PHYSICAL, 55, 95, 25, -1, 0, 1)
      .attr(HighCritAttr)
      .makesContact(false)
      .slicingMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.SOLAR_BEAM, Type.GRASS, MoveCategory.SPECIAL, 120, 100, 10, -1, 0, 1)
      .attr(SunlightChargeAttr, ChargeAnim.SOLAR_BEAM_CHARGING, 'took\nin sunlight!')
      .attr(AntiSunlightPowerDecreaseAttr)
      .ignoresVirtual(),
    new StatusMove(Moves.POISON_POWDER, Type.POISON, 75, 35, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .powderMove(),
    new StatusMove(Moves.STUN_SPORE, Type.GRASS, 75, 30, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .powderMove(),
    new StatusMove(Moves.SLEEP_POWDER, Type.GRASS, 75, 15, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .powderMove(),
    new AttackMove(Moves.PETAL_DANCE, Type.GRASS, MoveCategory.SPECIAL, 120, 100, 10, -1, 0, 1)
      .attr(FrenzyAttr)
      .attr(MissEffectAttr, frenzyMissFunc)
      .makesContact()
      .danceMove()
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new StatusMove(Moves.STRING_SHOT, Type.BUG, 95, 40, -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.SPD, -2)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.DRAGON_RAGE, Type.DRAGON, MoveCategory.SPECIAL, -1, 100, 10, -1, 0, 1)
      .attr(FixedDamageAttr, 40),
    new AttackMove(Moves.FIRE_SPIN, Type.FIRE, MoveCategory.SPECIAL, 35, 85, 15, 100, 0, 1)
      .attr(TrapAttr, BattlerTagType.FIRE_SPIN),
    new AttackMove(Moves.THUNDER_SHOCK, Type.ELECTRIC, MoveCategory.SPECIAL, 40, 100, 30, 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.THUNDERBOLT, Type.ELECTRIC, MoveCategory.SPECIAL, 90, 100, 15, 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new StatusMove(Moves.THUNDER_WAVE, Type.ELECTRIC, 90, 20, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .attr(StatusMoveTypeImmunityAttr, Type.GROUND),
    new AttackMove(Moves.THUNDER, Type.ELECTRIC, MoveCategory.SPECIAL, 110, 70, 10, 30, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .attr(ThunderAccuracyAttr)
      .attr(HitsTagAttr, BattlerTagType.FLYING, false),
    new AttackMove(Moves.ROCK_THROW, Type.ROCK, MoveCategory.PHYSICAL, 50, 90, 15, -1, 0, 1)
      .makesContact(false),
    new AttackMove(Moves.EARTHQUAKE, Type.GROUND, MoveCategory.PHYSICAL, 100, 100, 10, -1, 0, 1)
      .attr(HitsTagAttr, BattlerTagType.UNDERGROUND, true)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.FISSURE, Type.GROUND, MoveCategory.PHYSICAL, 200, 30, 5, -1, 0, 1)
      .attr(OneHitKOAttr)
      .attr(OneHitKOAccuracyAttr)
      .attr(HitsTagAttr, BattlerTagType.UNDERGROUND, false)
      .makesContact(false),
    new AttackMove(Moves.DIG, Type.GROUND, MoveCategory.PHYSICAL, 80, 100, 10, -1, 0, 1)
      .attr(ChargeAttr, ChargeAnim.DIG_CHARGING, 'dug a hole!', BattlerTagType.UNDERGROUND)
      .ignoresVirtual(),
    new StatusMove(Moves.TOXIC, Type.POISON, 90, 10, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.TOXIC)
      .attr(ToxicAccuracyAttr),
    new AttackMove(Moves.CONFUSION, Type.PSYCHIC, MoveCategory.SPECIAL, 50, 100, 25, 10, 0, 1)
      .attr(ConfuseAttr),
    new AttackMove(Moves.PSYCHIC, Type.PSYCHIC, MoveCategory.SPECIAL, 90, 100, 10, 10, 0, 1)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1),
    new StatusMove(Moves.HYPNOSIS, Type.PSYCHIC, 60, 20, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP),
    new SelfStatusMove(Moves.MEDITATE, Type.PSYCHIC, -1, 40, -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.ATK, 1, true),
    new SelfStatusMove(Moves.AGILITY, Type.PSYCHIC, -1, 30, -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.SPD, 2, true),
    new AttackMove(Moves.QUICK_ATTACK, Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 30, -1, 1, 1),
    new AttackMove(Moves.RAGE, Type.NORMAL, MoveCategory.PHYSICAL, 20, 100, 20, -1, 0, 1)
      .partial(),
    new SelfStatusMove(Moves.TELEPORT, Type.PSYCHIC, -1, 20, -1, -6, 1)
      .attr(ForceSwitchOutAttr, true)
      .hidesUser(),
    new AttackMove(Moves.NIGHT_SHADE, Type.GHOST, MoveCategory.SPECIAL, -1, 100, 15, -1, 0, 1)
      .attr(LevelDamageAttr),
    new StatusMove(Moves.MIMIC, Type.NORMAL, -1, 10, -1, 0, 1)
      .attr(MovesetCopyMoveAttr)
      .ignoresVirtual(),
    new StatusMove(Moves.SCREECH, Type.NORMAL, 85, 40, -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.DEF, -2)
      .soundBased(),
    new SelfStatusMove(Moves.DOUBLE_TEAM, Type.NORMAL, -1, 15, -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.EVA, 1, true),
    new SelfStatusMove(Moves.RECOVER, Type.NORMAL, -1, 5, -1, 0, 1)
      .attr(HealAttr, 0.5)
      .triageMove(),
    new SelfStatusMove(Moves.HARDEN, Type.NORMAL, -1, 30, -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.DEF, 1, true),
    new SelfStatusMove(Moves.MINIMIZE, Type.NORMAL, -1, 10, -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.EVA, 2, true),
    new StatusMove(Moves.SMOKESCREEN, Type.NORMAL, 100, 20, -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new StatusMove(Moves.CONFUSE_RAY, Type.GHOST, 100, 10, -1, 0, 1)
      .attr(ConfuseAttr),
    new SelfStatusMove(Moves.WITHDRAW, Type.WATER, -1, 40, -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.DEF, 1, true),
    new SelfStatusMove(Moves.DEFENSE_CURL, Type.NORMAL, -1, 40, -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.DEF, 1, true),
    new SelfStatusMove(Moves.BARRIER, Type.PSYCHIC, -1, 20, -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.DEF, 2, true),
    new StatusMove(Moves.LIGHT_SCREEN, Type.PSYCHIC, -1, 30, -1, 0, 1)
      .attr(AddArenaTagAttr, ArenaTagType.LIGHT_SCREEN, 5, true)
      .target(MoveTarget.USER_SIDE),
    new StatusMove(Moves.HAZE, Type.ICE, -1, 30, -1, 0, 1)
      .target(MoveTarget.BOTH_SIDES)
      .attr(ResetStatsAttr),
    new StatusMove(Moves.REFLECT, Type.PSYCHIC, -1, 20, -1, 0, 1)
      .attr(AddArenaTagAttr, ArenaTagType.REFLECT, 5, true)
      .target(MoveTarget.USER_SIDE),
    new SelfStatusMove(Moves.FOCUS_ENERGY, Type.NORMAL, -1, 30, -1, 0, 1)
      .attr(AddBattlerTagAttr, BattlerTagType.CRIT_BOOST, true, true),
    new AttackMove(Moves.BIDE, Type.NORMAL, MoveCategory.PHYSICAL, -1, -1, 10, -1, 1, 1)
      .ignoresVirtual()
      .target(MoveTarget.USER)
      .unimplemented(),
    new SelfStatusMove(Moves.METRONOME, Type.NORMAL, -1, 10, -1, 0, 1)
      .attr(RandomMoveAttr)
      .ignoresVirtual(),
    new StatusMove(Moves.MIRROR_MOVE, Type.FLYING, -1, 20, -1, 0, 1)
      .attr(CopyMoveAttr)
      .ignoresVirtual(),
    new AttackMove(Moves.SELF_DESTRUCT, Type.NORMAL, MoveCategory.PHYSICAL, 200, 100, 5, -1, 0, 1)
      .attr(SacrificialAttr)
      .makesContact(false)
      .condition(failIfDampCondition)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.EGG_BOMB, Type.NORMAL, MoveCategory.PHYSICAL, 100, 75, 10, -1, 0, 1)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(Moves.LICK, Type.GHOST, MoveCategory.PHYSICAL, 30, 100, 30, 30, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.SMOG, Type.POISON, MoveCategory.SPECIAL, 30, 70, 20, 40, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(Moves.SLUDGE, Type.POISON, MoveCategory.SPECIAL, 65, 100, 20, 30, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(Moves.BONE_CLUB, Type.GROUND, MoveCategory.PHYSICAL, 65, 85, 20, 10, 0, 1)
      .attr(FlinchAttr)
      .makesContact(false),
    new AttackMove(Moves.FIRE_BLAST, Type.FIRE, MoveCategory.SPECIAL, 110, 85, 5, 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.WATERFALL, Type.WATER, MoveCategory.PHYSICAL, 80, 100, 15, 20, 0, 1)
      .attr(FlinchAttr),
    new AttackMove(Moves.CLAMP, Type.WATER, MoveCategory.PHYSICAL, 35, 85, 15, 100, 0, 1)
      .attr(TrapAttr, BattlerTagType.CLAMP),
    new AttackMove(Moves.SWIFT, Type.NORMAL, MoveCategory.SPECIAL, 60, -1, 20, -1, 0, 1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.SKULL_BASH, Type.NORMAL, MoveCategory.PHYSICAL, 130, 100, 10, 100, 0, 1)
      .attr(ChargeAttr, ChargeAnim.SKULL_BASH_CHARGING, 'lowered\nits head!', null, true)
      .attr(StatChangeAttr, BattleStat.DEF, 1, true)
      .ignoresVirtual(),
    new AttackMove(Moves.SPIKE_CANNON, Type.NORMAL, MoveCategory.PHYSICAL, 20, 100, 15, -1, 0, 1)
      .attr(MultiHitAttr)
      .makesContact(false),
    new AttackMove(Moves.CONSTRICT, Type.NORMAL, MoveCategory.PHYSICAL, 10, 100, 35, 10, 0, 1)
      .attr(StatChangeAttr, BattleStat.SPD, -1),
    new SelfStatusMove(Moves.AMNESIA, Type.PSYCHIC, -1, 20, -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.SPDEF, 2, true),
    new StatusMove(Moves.KINESIS, Type.PSYCHIC, 80, 15, -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new SelfStatusMove(Moves.SOFT_BOILED, Type.NORMAL, -1, 5, -1, 0, 1)
      .attr(HealAttr, 0.5)
      .triageMove(),
    new AttackMove(Moves.HIGH_JUMP_KICK, Type.FIGHTING, MoveCategory.PHYSICAL, 130, 90, 10, -1, 0, 1)
      .attr(MissEffectAttr, crashDamageFunc)
      .attr(NoEffectAttr, crashDamageFunc)
      .condition(failOnGravityCondition),
    new StatusMove(Moves.GLARE, Type.NORMAL, 100, 30, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.DREAM_EATER, Type.PSYCHIC, MoveCategory.SPECIAL, 100, 100, 15, -1, 0, 1)
      .attr(HitHealAttr)
      .condition((user, target, move) => target.status?.effect === StatusEffect.SLEEP)
      .triageMove(),
    new StatusMove(Moves.POISON_GAS, Type.POISON, 90, 40, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.BARRAGE, Type.NORMAL, MoveCategory.PHYSICAL, 15, 85, 20, -1, 0, 1)
      .attr(MultiHitAttr)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(Moves.LEECH_LIFE, Type.BUG, MoveCategory.PHYSICAL, 80, 100, 10, -1, 0, 1)
      .attr(HitHealAttr)
      .triageMove(),
    new StatusMove(Moves.LOVELY_KISS, Type.NORMAL, 75, 10, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP),
    new AttackMove(Moves.SKY_ATTACK, Type.FLYING, MoveCategory.PHYSICAL, 140, 90, 5, 30, 0, 1)
      .attr(ChargeAttr, ChargeAnim.SKY_ATTACK_CHARGING, 'is glowing!')
      .attr(HighCritAttr)
      .attr(FlinchAttr)
      .makesContact(false)
      .ignoresVirtual(),
    new StatusMove(Moves.TRANSFORM, Type.NORMAL, -1, 10, -1, 0, 1)
      .attr(TransformAttr)
      .ignoresProtect(),
    new AttackMove(Moves.BUBBLE, Type.WATER, MoveCategory.SPECIAL, 40, 100, 30, 10, 0, 1)
      .attr(StatChangeAttr, BattleStat.SPD, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.DIZZY_PUNCH, Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 10, 20, 0, 1)
      .attr(ConfuseAttr)
      .punchingMove(),
    new StatusMove(Moves.SPORE, Type.GRASS, 100, 15, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .powderMove(),
    new StatusMove(Moves.FLASH, Type.NORMAL, 100, 20, -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new AttackMove(Moves.PSYWAVE, Type.PSYCHIC, MoveCategory.SPECIAL, -1, 100, 15, -1, 0, 1)
      .attr(RandomLevelDamageAttr),
    new SelfStatusMove(Moves.SPLASH, Type.NORMAL, -1, 40, -1, 0, 1)
      .condition(failOnGravityCondition),
    new SelfStatusMove(Moves.ACID_ARMOR, Type.POISON, -1, 20, -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.DEF, 2, true),
    new AttackMove(Moves.CRABHAMMER, Type.WATER, MoveCategory.PHYSICAL, 100, 90, 10, -1, 0, 1)
      .attr(HighCritAttr),
    new AttackMove(Moves.EXPLOSION, Type.NORMAL, MoveCategory.PHYSICAL, 250, 100, 5, -1, 0, 1)
      .condition(failIfDampCondition)
      .attr(SacrificialAttr)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.FURY_SWIPES, Type.NORMAL, MoveCategory.PHYSICAL, 18, 80, 15, -1, 0, 1)
      .attr(MultiHitAttr),
    new AttackMove(Moves.BONEMERANG, Type.GROUND, MoveCategory.PHYSICAL, 50, 90, 10, -1, 0, 1)
      .attr(MultiHitAttr, MultiHitType._2)
      .makesContact(false),
    new SelfStatusMove(Moves.REST, Type.PSYCHIC, -1, 5, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP, true, 3, true)
      .attr(HealAttr, 1, true)
      .condition((user, target, move) => user.getHpRatio() < 1 && user.canSetStatus(StatusEffect.SLEEP, true, true))
      .triageMove(),
    new AttackMove(Moves.ROCK_SLIDE, Type.ROCK, MoveCategory.PHYSICAL, 75, 90, 10, 30, 0, 1)
      .attr(FlinchAttr)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.HYPER_FANG, Type.NORMAL, MoveCategory.PHYSICAL, 80, 90, 15, 10, 0, 1)
      .attr(FlinchAttr)
      .bitingMove(),
    new SelfStatusMove(Moves.SHARPEN, Type.NORMAL, -1, 30, -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.ATK, 1, true),
    new SelfStatusMove(Moves.CONVERSION, Type.NORMAL, -1, 30, -1, 0, 1)
      .attr(FirstMoveTypeAttr),
    new AttackMove(Moves.TRI_ATTACK, Type.NORMAL, MoveCategory.SPECIAL, 80, 100, 10, 20, 0, 1)
    .attr(MultiStatusEffectAttr, [StatusEffect.BURN, StatusEffect.FREEZE, StatusEffect.PARALYSIS]),
    new AttackMove(Moves.SUPER_FANG, Type.NORMAL, MoveCategory.PHYSICAL, -1, 90, 10, -1, 0, 1)
      .attr(TargetHalfHpDamageAttr),
    new AttackMove(Moves.SLASH, Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 20, -1, 0, 1)
      .attr(HighCritAttr)
      .slicingMove(),
    new SelfStatusMove(Moves.SUBSTITUTE, Type.NORMAL, -1, 10, -1, 0, 1)
      .attr(RecoilAttr)
      .unimplemented(),
    new AttackMove(Moves.STRUGGLE, Type.NORMAL, MoveCategory.PHYSICAL, 50, -1, 1, -1, 0, 1)
      .attr(RecoilAttr, true, 0.25, true)
      .attr(TypelessAttr)
      .ignoresVirtual()
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new StatusMove(Moves.SKETCH, Type.NORMAL, -1, 1, -1, 0, 2)
      .attr(SketchAttr)
      .ignoresVirtual(),
    new AttackMove(Moves.TRIPLE_KICK, Type.FIGHTING, MoveCategory.PHYSICAL, 10, 90, 10, -1, 0, 2)
      .attr(MultiHitAttr, MultiHitType._3_INCR)
      .attr(MissEffectAttr, (user: Pokemon, move: Move) => {
        user.turnData.hitsLeft = 1;
        return true;
      })
      .partial(),
    new AttackMove(Moves.THIEF, Type.DARK, MoveCategory.PHYSICAL, 60, 100, 25, -1, 0, 2)
      .attr(StealHeldItemChanceAttr, 0.3),
    new StatusMove(Moves.SPIDER_WEB, Type.BUG, -1, 10, -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, true, 1),
    new StatusMove(Moves.MIND_READER, Type.NORMAL, -1, 5, -1, 0, 2)
      .attr(IgnoreAccuracyAttr),
    new StatusMove(Moves.NIGHTMARE, Type.GHOST, 100, 15, -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.NIGHTMARE)
      .condition((user, target, move) => target.status?.effect === StatusEffect.SLEEP),
    new AttackMove(Moves.FLAME_WHEEL, Type.FIRE, MoveCategory.PHYSICAL, 60, 100, 25, 10, 0, 2)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.SNORE, Type.NORMAL, MoveCategory.SPECIAL, 50, 100, 15, 30, 0, 2)
      .attr(BypassSleepAttr)
      .attr(FlinchAttr)
      .condition((user, target, move) => user.status?.effect === StatusEffect.SLEEP)
      .soundBased(),
    new StatusMove(Moves.CURSE, Type.GHOST, -1, 10, -1, 0, 2)
      .attr(StatChangeAttr, BattleStat.SPD, -1, true)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF ], 1, true)
      .target(MoveTarget.USER)
      .partial(),
    new AttackMove(Moves.FLAIL, Type.NORMAL, MoveCategory.PHYSICAL, -1, 100, 15, -1, 0, 2)
      .attr(LowHpPowerAttr),
    new StatusMove(Moves.CONVERSION_2, Type.NORMAL, -1, 30, -1, 0, 2)
      .unimplemented(),
    new AttackMove(Moves.AEROBLAST, Type.FLYING, MoveCategory.SPECIAL, 100, 95, 5, -1, 0, 2)
      .attr(HighCritAttr),
    new StatusMove(Moves.COTTON_SPORE, Type.GRASS, 100, 40, -1, 0, 2)
      .attr(StatChangeAttr, BattleStat.SPD, -2)
      .powderMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.REVERSAL, Type.FIGHTING, MoveCategory.PHYSICAL, -1, 100, 15, -1, 0, 2)
      .attr(LowHpPowerAttr),
    new StatusMove(Moves.SPITE, Type.GHOST, 100, 10, -1, 0, 2)
      .attr(ReducePpMoveAttr),
    new AttackMove(Moves.POWDER_SNOW, Type.ICE, MoveCategory.SPECIAL, 40, 100, 25, 10, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.FREEZE)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new SelfStatusMove(Moves.PROTECT, Type.NORMAL, -1, 10, -1, 4, 2)
      .attr(ProtectAttr),
    new AttackMove(Moves.MACH_PUNCH, Type.FIGHTING, MoveCategory.PHYSICAL, 40, 100, 30, -1, 1, 2)
      .punchingMove(),
    new StatusMove(Moves.SCARY_FACE, Type.NORMAL, 100, 10, -1, 0, 2)
      .attr(StatChangeAttr, BattleStat.SPD, -2),
    new AttackMove(Moves.FEINT_ATTACK, Type.DARK, MoveCategory.PHYSICAL, 60, -1, 20, -1, 0, 2),
    new StatusMove(Moves.SWEET_KISS, Type.FAIRY, 75, 10, -1, 0, 2)
      .attr(ConfuseAttr),
    new SelfStatusMove(Moves.BELLY_DRUM, Type.NORMAL, -1, 10, -1, 0, 2)
      .attr(HalfHpStatMaxAttr, BattleStat.ATK),
    new AttackMove(Moves.SLUDGE_BOMB, Type.POISON, MoveCategory.SPECIAL, 90, 100, 10, 30, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .ballBombMove(),
    new AttackMove(Moves.MUD_SLAP, Type.GROUND, MoveCategory.SPECIAL, 20, 100, 10, 100, 0, 2)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new AttackMove(Moves.OCTAZOOKA, Type.WATER, MoveCategory.SPECIAL, 65, 85, 10, 50, 0, 2)
      .attr(StatChangeAttr, BattleStat.ACC, -1)
      .ballBombMove(),
    new StatusMove(Moves.SPIKES, Type.GROUND, -1, 20, -1, 0, 2)
      .attr(AddArenaTrapTagAttr, ArenaTagType.SPIKES)
      .target(MoveTarget.ENEMY_SIDE),
    new AttackMove(Moves.ZAP_CANNON, Type.ELECTRIC, MoveCategory.SPECIAL, 120, 50, 5, 100, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .ballBombMove(),
    new StatusMove(Moves.FORESIGHT, Type.NORMAL, -1, 40, -1, 0, 2)
      .unimplemented(),
    new SelfStatusMove(Moves.DESTINY_BOND, Type.GHOST, -1, 5, -1, 0, 2)
      .ignoresProtect()
      .condition(failOnBossCondition)
      .unimplemented(),
    new StatusMove(Moves.PERISH_SONG, Type.NORMAL, -1, 5, -1, 0, 2)
      .attr(FaintCountdownAttr)
      .ignoresProtect()
      .soundBased()
      .condition(failOnBossCondition)
      .target(MoveTarget.ALL),
    new AttackMove(Moves.ICY_WIND, Type.ICE, MoveCategory.SPECIAL, 55, 95, 15, 100, 0, 2)
      .attr(StatChangeAttr, BattleStat.SPD, -1)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new SelfStatusMove(Moves.DETECT, Type.FIGHTING, -1, 5, -1, 4, 2)
      .attr(ProtectAttr),
    new AttackMove(Moves.BONE_RUSH, Type.GROUND, MoveCategory.PHYSICAL, 25, 90, 10, -1, 0, 2)
      .attr(MultiHitAttr)
      .makesContact(false),
    new StatusMove(Moves.LOCK_ON, Type.NORMAL, -1, 5, -1, 0, 2)
      .attr(IgnoreAccuracyAttr),
    new AttackMove(Moves.OUTRAGE, Type.DRAGON, MoveCategory.PHYSICAL, 120, 100, 10, -1, 0, 2)
      .attr(FrenzyAttr)
      .attr(MissEffectAttr, frenzyMissFunc)
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new StatusMove(Moves.SANDSTORM, Type.ROCK, -1, 10, -1, 0, 2)
      .attr(WeatherChangeAttr, WeatherType.SANDSTORM)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.GIGA_DRAIN, Type.GRASS, MoveCategory.SPECIAL, 75, 100, 10, -1, 0, 2)
      .attr(HitHealAttr)
      .triageMove(),
    new SelfStatusMove(Moves.ENDURE, Type.NORMAL, -1, 10, -1, 4, 2)
      .attr(EndureAttr),
    new StatusMove(Moves.CHARM, Type.FAIRY, 100, 20, -1, 0, 2)
      .attr(StatChangeAttr, BattleStat.ATK, -2),
    new AttackMove(Moves.ROLLOUT, Type.ROCK, MoveCategory.PHYSICAL, 30, 90, 20, -1, 0, 2)
      .attr(ConsecutiveUseDoublePowerAttr, 5, true, true, Moves.DEFENSE_CURL),
    new AttackMove(Moves.FALSE_SWIPE, Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 40, -1, 0, 2)
      .attr(SurviveDamageAttr),
    new StatusMove(Moves.SWAGGER, Type.NORMAL, 85, 15, -1, 0, 2)
      .attr(StatChangeAttr, BattleStat.ATK, 2)
      .attr(ConfuseAttr),
    new SelfStatusMove(Moves.MILK_DRINK, Type.NORMAL, -1, 5, -1, 0, 2)
      .attr(HealAttr, 0.5)
      .triageMove(),
    new AttackMove(Moves.SPARK, Type.ELECTRIC, MoveCategory.PHYSICAL, 65, 100, 20, 30, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.FURY_CUTTER, Type.BUG, MoveCategory.PHYSICAL, 40, 95, 20, -1, 0, 2)
      .attr(ConsecutiveUseDoublePowerAttr, 3, true)
      .slicingMove(),
    new AttackMove(Moves.STEEL_WING, Type.STEEL, MoveCategory.PHYSICAL, 70, 90, 25, 10, 0, 2)
      .attr(StatChangeAttr, BattleStat.DEF, 1, true),
    new StatusMove(Moves.MEAN_LOOK, Type.NORMAL, -1, 5, -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, true, 1),
    new StatusMove(Moves.ATTRACT, Type.NORMAL, 100, 15, -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.INFATUATED)
      .condition((user, target, move) => user.isOppositeGender(target)),
    new SelfStatusMove(Moves.SLEEP_TALK, Type.NORMAL, -1, 10, -1, 0, 2)
      .attr(BypassSleepAttr)
      .attr(RandomMovesetMoveAttr)
      .condition((user, target, move) => user.status?.effect === StatusEffect.SLEEP)
      .ignoresVirtual(),
    new StatusMove(Moves.HEAL_BELL, Type.NORMAL, -1, 5, -1, 0, 2)
      .soundBased()
      .target(MoveTarget.USER_AND_ALLIES)
      .unimplemented(),
    new AttackMove(Moves.RETURN, Type.NORMAL, MoveCategory.PHYSICAL, -1, 100, 20, -1, 0, 2)
      .attr(FriendshipPowerAttr),
    new AttackMove(Moves.PRESENT, Type.NORMAL, MoveCategory.PHYSICAL, -1, 90, 15, -1, 0, 2)
      .attr(PresentPowerAttr)
      .makesContact(false),
    new AttackMove(Moves.FRUSTRATION, Type.NORMAL, MoveCategory.PHYSICAL, -1, 100, 20, -1, 0, 2)
      .attr(FriendshipPowerAttr, true),
    new StatusMove(Moves.SAFEGUARD, Type.NORMAL, -1, 25, -1, 0, 2)
      .target(MoveTarget.USER_SIDE)
      .unimplemented(),
    new StatusMove(Moves.PAIN_SPLIT, Type.NORMAL, -1, 20, -1, 0, 2)
      .attr(HpSplitAttr)
      .condition(failOnBossCondition),
    new AttackMove(Moves.SACRED_FIRE, Type.FIRE, MoveCategory.PHYSICAL, 100, 95, 5, 50, 0, 2)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .makesContact(false),
    new AttackMove(Moves.MAGNITUDE, Type.GROUND, MoveCategory.PHYSICAL, -1, 100, 30, -1, 0, 2)
      .attr(PreMoveMessageAttr, magnitudeMessageFunc)
      .attr(MagnitudePowerAttr)
      .attr(HitsTagAttr, BattlerTagType.UNDERGROUND, true)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.DYNAMIC_PUNCH, Type.FIGHTING, MoveCategory.PHYSICAL, 100, 50, 5, 100, 0, 2)
      .attr(ConfuseAttr)
      .punchingMove(),
    new AttackMove(Moves.MEGAHORN, Type.BUG, MoveCategory.PHYSICAL, 120, 85, 10, -1, 0, 2),
    new AttackMove(Moves.DRAGON_BREATH, Type.DRAGON, MoveCategory.SPECIAL, 60, 100, 20, 30, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new SelfStatusMove(Moves.BATON_PASS, Type.NORMAL, -1, 40, -1, 0, 2)
      .attr(ForceSwitchOutAttr, true, true)
      .hidesUser(),
    new StatusMove(Moves.ENCORE, Type.NORMAL, 100, 5, -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.ENCORE, false, true)
      .condition((user, target, move) => new EncoreTag(user.id).canAdd(target)),
    new AttackMove(Moves.PURSUIT, Type.DARK, MoveCategory.PHYSICAL, 40, 100, 20, -1, 0, 2)
      .partial(),
    new AttackMove(Moves.RAPID_SPIN, Type.NORMAL, MoveCategory.PHYSICAL, 50, 100, 40, 100, 0, 2)
      .attr(StatChangeAttr, BattleStat.SPD, 1, true)
      .attr(RemoveBattlerTagAttr, [ 
        BattlerTagType.BIND,
        BattlerTagType.WRAP,
        BattlerTagType.FIRE_SPIN,
        BattlerTagType.WHIRLPOOL,
        BattlerTagType.CLAMP,
        BattlerTagType.SAND_TOMB,
        BattlerTagType.MAGMA_STORM,
        BattlerTagType.SNAP_TRAP,
        BattlerTagType.THUNDER_CAGE,
        BattlerTagType.SEEDED,
        BattlerTagType.INFESTATION
      ], true)
      .partial(),
    new StatusMove(Moves.SWEET_SCENT, Type.NORMAL, 100, 20, -1, 0, 2)
      .attr(StatChangeAttr, BattleStat.EVA, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.IRON_TAIL, Type.STEEL, MoveCategory.PHYSICAL, 100, 75, 15, 30, 0, 2)
      .attr(StatChangeAttr, BattleStat.DEF, -1),
    new AttackMove(Moves.METAL_CLAW, Type.STEEL, MoveCategory.PHYSICAL, 50, 95, 35, 10, 0, 2)
      .attr(StatChangeAttr, BattleStat.ATK, 1, true),
    new AttackMove(Moves.VITAL_THROW, Type.FIGHTING, MoveCategory.PHYSICAL, 70, -1, 10, -1, -1, 2),
    new SelfStatusMove(Moves.MORNING_SUN, Type.NORMAL, -1, 5, -1, 0, 2)
      .attr(PlantHealAttr)
      .triageMove(),
    new SelfStatusMove(Moves.SYNTHESIS, Type.GRASS, -1, 5, -1, 0, 2)
      .attr(PlantHealAttr)
      .triageMove(),
    new SelfStatusMove(Moves.MOONLIGHT, Type.FAIRY, -1, 5, -1, 0, 2)
      .attr(PlantHealAttr)
      .triageMove(),
    new AttackMove(Moves.HIDDEN_POWER, Type.NORMAL, MoveCategory.SPECIAL, 60, 100, 15, -1, 0, 2)
      .attr(HiddenPowerTypeAttr),
    new AttackMove(Moves.CROSS_CHOP, Type.FIGHTING, MoveCategory.PHYSICAL, 100, 80, 5, -1, 0, 2)
      .attr(HighCritAttr),
    new AttackMove(Moves.TWISTER, Type.DRAGON, MoveCategory.SPECIAL, 40, 100, 20, 20, 0, 2)
      .attr(HitsTagAttr, BattlerTagType.FLYING, true)
      .attr(FlinchAttr)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.RAIN_DANCE, Type.WATER, -1, 5, -1, 0, 2)
      .attr(WeatherChangeAttr, WeatherType.RAIN)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(Moves.SUNNY_DAY, Type.FIRE, -1, 5, -1, 0, 2)
      .attr(WeatherChangeAttr, WeatherType.SUNNY)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.CRUNCH, Type.DARK, MoveCategory.PHYSICAL, 80, 100, 15, 20, 0, 2)
      .attr(StatChangeAttr, BattleStat.DEF, -1)
      .bitingMove(),
    new AttackMove(Moves.MIRROR_COAT, Type.PSYCHIC, MoveCategory.SPECIAL, -1, 100, 20, -1, -5, 2)
      .attr(CounterDamageAttr, (move: Move) => move.category === MoveCategory.SPECIAL, 2)
      .target(MoveTarget.ATTACKER),
    new StatusMove(Moves.PSYCH_UP, Type.NORMAL, -1, 10, -1, 0, 2)
      .attr(CopyStatsAttr),
    new AttackMove(Moves.EXTREME_SPEED, Type.NORMAL, MoveCategory.PHYSICAL, 80, 100, 5, -1, 2, 2),
    new AttackMove(Moves.ANCIENT_POWER, Type.ROCK, MoveCategory.SPECIAL, 60, 100, 5, 10, 0, 2)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF, BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD ], 1, true),
    new AttackMove(Moves.SHADOW_BALL, Type.GHOST, MoveCategory.SPECIAL, 80, 100, 15, 20, 0, 2)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1)
      .ballBombMove(),
    new AttackMove(Moves.FUTURE_SIGHT, Type.PSYCHIC, MoveCategory.SPECIAL, 120, 100, 10, -1, 0, 2)
      .attr(DelayedAttackAttr, ArenaTagType.FUTURE_SIGHT, ChargeAnim.FUTURE_SIGHT_CHARGING, 'foresaw\nan attack!'),
    new AttackMove(Moves.ROCK_SMASH, Type.FIGHTING, MoveCategory.PHYSICAL, 40, 100, 15, 50, 0, 2)
      .attr(StatChangeAttr, BattleStat.DEF, -1),
    new AttackMove(Moves.WHIRLPOOL, Type.WATER, MoveCategory.SPECIAL, 35, 85, 15, 100, 0, 2)
      .attr(TrapAttr, BattlerTagType.WHIRLPOOL)
      .attr(HitsTagAttr, BattlerTagType.UNDERWATER, true),
    new AttackMove(Moves.BEAT_UP, Type.DARK, MoveCategory.PHYSICAL, -1, 100, 10, -1, 0, 2)
      .makesContact(false)
      .unimplemented(),
    new AttackMove(Moves.FAKE_OUT, Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 10, 100, 3, 3)
      .attr(FlinchAttr)
      .condition(new FirstMoveCondition()),
    new AttackMove(Moves.UPROAR, Type.NORMAL, MoveCategory.SPECIAL, 90, 100, 10, -1, 0, 3)
      .ignoresVirtual()
      .soundBased()
      .target(MoveTarget.RANDOM_NEAR_ENEMY)
      .partial(),
    new SelfStatusMove(Moves.STOCKPILE, Type.NORMAL, -1, 20, -1, 0, 3)
      .unimplemented(),
    new AttackMove(Moves.SPIT_UP, Type.NORMAL, MoveCategory.SPECIAL, -1, 100, 10, -1, 0, 3)
      .unimplemented(),
    new SelfStatusMove(Moves.SWALLOW, Type.NORMAL, -1, 10, -1, 0, 3)
      .triageMove()
      .unimplemented(),
    new AttackMove(Moves.HEAT_WAVE, Type.FIRE, MoveCategory.SPECIAL, 95, 90, 10, 10, 0, 3)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.HAIL, Type.ICE, -1, 10, -1, 0, 3)
      .attr(WeatherChangeAttr, WeatherType.HAIL)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(Moves.TORMENT, Type.DARK, 100, 15, -1, 0, 3)
      .unimplemented(),
    new StatusMove(Moves.FLATTER, Type.DARK, 100, 15, -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPATK, 1)
      .attr(ConfuseAttr),
    new StatusMove(Moves.WILL_O_WISP, Type.FIRE, 85, 15, -1, 0, 3)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new StatusMove(Moves.MEMENTO, Type.DARK, 100, 10, -1, 0, 3)
      .attr(SacrificialAttr)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.SPATK ], -2),
    new AttackMove(Moves.FACADE, Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 20, -1, 0, 3)
      .attr(MovePowerMultiplierAttr, (user, target, move) => user.status
        && (user.status.effect === StatusEffect.BURN || user.status.effect === StatusEffect.POISON || user.status.effect === StatusEffect.TOXIC || user.status.effect === StatusEffect.PARALYSIS) ? 2 : 1),
    new AttackMove(Moves.FOCUS_PUNCH, Type.FIGHTING, MoveCategory.PHYSICAL, 150, 100, 20, -1, -3, 3)
      .punchingMove()
      .ignoresVirtual()
      .condition((user, target, move) => !user.turnData.attacksReceived.find(r => r.damage)),
    new AttackMove(Moves.SMELLING_SALTS, Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 10, -1, 0, 3)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.status?.effect === StatusEffect.PARALYSIS ? 2 : 1)
      .attr(HealStatusEffectAttr, true, StatusEffect.PARALYSIS),
    new SelfStatusMove(Moves.FOLLOW_ME, Type.NORMAL, -1, 20, -1, 2, 3)
      .unimplemented(),
    new StatusMove(Moves.NATURE_POWER, Type.NORMAL, -1, 20, -1, 0, 3)
      .attr(NaturePowerAttr)
      .ignoresVirtual(),
    new SelfStatusMove(Moves.CHARGE, Type.ELECTRIC, -1, 20, -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPDEF, 1, true)
      .attr(AddBattlerTagAttr, BattlerTagType.CHARGED, true, true),
    new StatusMove(Moves.TAUNT, Type.DARK, 100, 20, -1, 0, 3)
      .unimplemented(),
    new StatusMove(Moves.HELPING_HAND, Type.NORMAL, -1, 20, -1, 5, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.HELPING_HAND)
      .target(MoveTarget.NEAR_ALLY),
    new StatusMove(Moves.TRICK, Type.PSYCHIC, 100, 10, -1, 0, 3)
      .unimplemented(),
    new StatusMove(Moves.ROLE_PLAY, Type.PSYCHIC, -1, 10, -1, 0, 3)
      .attr(AbilityCopyAttr),
    new SelfStatusMove(Moves.WISH, Type.NORMAL, -1, 10, -1, 0, 3)
      .triageMove()
      .attr(AddArenaTagAttr, ArenaTagType.WISH, 2, true),
    new SelfStatusMove(Moves.ASSIST, Type.NORMAL, -1, 20, -1, 0, 3)
      .attr(RandomMovesetMoveAttr, true)
      .ignoresVirtual(),
    new SelfStatusMove(Moves.INGRAIN, Type.GRASS, -1, 20, -1, 0, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.INGRAIN, true, true),
    new AttackMove(Moves.SUPERPOWER, Type.FIGHTING, MoveCategory.PHYSICAL, 120, 100, 5, 100, 0, 3)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF ], -1, true),
    new SelfStatusMove(Moves.MAGIC_COAT, Type.PSYCHIC, -1, 15, -1, 4, 3)
      .unimplemented(),
    new SelfStatusMove(Moves.RECYCLE, Type.NORMAL, -1, 10, -1, 0, 3)
      .unimplemented(),
    new AttackMove(Moves.REVENGE, Type.FIGHTING, MoveCategory.PHYSICAL, 60, 100, 10, -1, -4, 3)
      .attr(TurnDamagedDoublePowerAttr),
    new AttackMove(Moves.BRICK_BREAK, Type.FIGHTING, MoveCategory.PHYSICAL, 75, 100, 15, -1, 0, 3)
        .attr(RemoveScreensAttr),
    new StatusMove(Moves.YAWN, Type.NORMAL, -1, 10, -1, 0, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.DROWSY, false, true)
      .condition((user, target, move) => !target.status),
    new AttackMove(Moves.KNOCK_OFF, Type.DARK, MoveCategory.PHYSICAL, 65, 100, 20, -1, 0, 3)
      .partial(),
    new AttackMove(Moves.ENDEAVOR, Type.NORMAL, MoveCategory.PHYSICAL, -1, 100, 5, -1, 0, 3)
      .attr(MatchHpAttr)
      .condition(failOnBossCondition),
    new AttackMove(Moves.ERUPTION, Type.FIRE, MoveCategory.SPECIAL, 150, 100, 5, -1, 0, 3)
      .attr(HpPowerAttr)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.SKILL_SWAP, Type.PSYCHIC, -1, 10, -1, 0, 3)
      .attr(SwitchAbilitiesAttr),
    new SelfStatusMove(Moves.IMPRISON, Type.PSYCHIC, -1, 10, -1, 0, 3)
      .unimplemented(),
    new SelfStatusMove(Moves.REFRESH, Type.NORMAL, -1, 20, -1, 0, 3)
      .attr(HealStatusEffectAttr, true, StatusEffect.PARALYSIS, StatusEffect.POISON, StatusEffect.TOXIC, StatusEffect.BURN)
      .condition((user, target, move) => user.status && (user.status.effect === StatusEffect.PARALYSIS || user.status.effect === StatusEffect.POISON || user.status.effect === StatusEffect.TOXIC || user.status.effect === StatusEffect.BURN)),
    new SelfStatusMove(Moves.GRUDGE, Type.GHOST, -1, 5, -1, 0, 3)
      .unimplemented(),
    new SelfStatusMove(Moves.SNATCH, Type.DARK, -1, 10, -1, 4, 3)
      .unimplemented(),
    new AttackMove(Moves.SECRET_POWER, Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 20, 30, 0, 3)
      .makesContact(false)
      .partial(),
    new AttackMove(Moves.DIVE, Type.WATER, MoveCategory.PHYSICAL, 80, 100, 10, -1, 0, 3)
      .attr(ChargeAttr, ChargeAnim.DIVE_CHARGING, 'hid\nunderwater!', BattlerTagType.UNDERWATER)
      .ignoresVirtual(),
    new AttackMove(Moves.ARM_THRUST, Type.FIGHTING, MoveCategory.PHYSICAL, 15, 100, 20, -1, 0, 3)
      .attr(MultiHitAttr),
    new SelfStatusMove(Moves.CAMOUFLAGE, Type.NORMAL, -1, 20, -1, 0, 3)
      .attr(CopyBiomeTypeAttr),
    new SelfStatusMove(Moves.TAIL_GLOW, Type.BUG, -1, 20, -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPATK, 3, true),
    new AttackMove(Moves.LUSTER_PURGE, Type.PSYCHIC, MoveCategory.SPECIAL, 95, 100, 5, 50, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1),
    new AttackMove(Moves.MIST_BALL, Type.PSYCHIC, MoveCategory.SPECIAL, 95, 100, 5, 50, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPATK, -1)
      .ballBombMove(),
    new StatusMove(Moves.FEATHER_DANCE, Type.FLYING, 100, 15, -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.ATK, -2)
      .danceMove(),
    new StatusMove(Moves.TEETER_DANCE, Type.NORMAL, 100, 20, -1, 0, 3)
      .attr(ConfuseAttr)
      .danceMove()
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.BLAZE_KICK, Type.FIRE, MoveCategory.PHYSICAL, 85, 90, 10, 10, 0, 3)
      .attr(HighCritAttr)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new StatusMove(Moves.MUD_SPORT, Type.GROUND, -1, 15, -1, 0, 3)
      .attr(AddArenaTagAttr, ArenaTagType.MUD_SPORT, 5)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.ICE_BALL, Type.ICE, MoveCategory.PHYSICAL, 30, 90, 20, -1, 0, 3)
      .attr(ConsecutiveUseDoublePowerAttr, 5, true, true, Moves.DEFENSE_CURL)
      .ballBombMove(),
    new AttackMove(Moves.NEEDLE_ARM, Type.GRASS, MoveCategory.PHYSICAL, 60, 100, 15, 30, 0, 3)
      .attr(FlinchAttr),
    new SelfStatusMove(Moves.SLACK_OFF, Type.NORMAL, -1, 5, -1, 0, 3)
      .attr(HealAttr, 0.5)
      .triageMove(),
    new AttackMove(Moves.HYPER_VOICE, Type.NORMAL, MoveCategory.SPECIAL, 90, 100, 10, -1, 0, 3)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.POISON_FANG, Type.POISON, MoveCategory.PHYSICAL, 50, 100, 15, 50, 0, 3)
      .attr(StatusEffectAttr, StatusEffect.TOXIC)
      .bitingMove(),
    new AttackMove(Moves.CRUSH_CLAW, Type.NORMAL, MoveCategory.PHYSICAL, 75, 95, 10, 50, 0, 3)
      .attr(StatChangeAttr, BattleStat.DEF, -1),
    new AttackMove(Moves.BLAST_BURN, Type.FIRE, MoveCategory.SPECIAL, 150, 90, 5, -1, 0, 3)
      .attr(RechargeAttr),
    new AttackMove(Moves.HYDRO_CANNON, Type.WATER, MoveCategory.SPECIAL, 150, 90, 5, -1, 0, 3)
      .attr(RechargeAttr),
    new AttackMove(Moves.METEOR_MASH, Type.STEEL, MoveCategory.PHYSICAL, 90, 90, 10, 20, 0, 3)
      .attr(StatChangeAttr, BattleStat.ATK, 1, true)
      .punchingMove(),
    new AttackMove(Moves.ASTONISH, Type.GHOST, MoveCategory.PHYSICAL, 30, 100, 15, 30, 0, 3)
      .attr(FlinchAttr),
    new AttackMove(Moves.WEATHER_BALL, Type.NORMAL, MoveCategory.SPECIAL, 50, 100, 10, -1, 0, 3)
      .attr(WeatherBallTypeAttr)
      .attr(MovePowerMultiplierAttr, (user, target, move) => [WeatherType.SUNNY, WeatherType.RAIN, WeatherType.SANDSTORM, WeatherType.HAIL, WeatherType.SNOW, WeatherType.FOG, WeatherType.HEAVY_RAIN, WeatherType.HARSH_SUN].includes(user.scene.arena.weather?.weatherType) && !user.scene.arena.weather?.isEffectSuppressed(user.scene) ? 2 : 1)
      .ballBombMove(),
    new StatusMove(Moves.AROMATHERAPY, Type.GRASS, -1, 5, -1, 0, 3)
      .target(MoveTarget.USER_AND_ALLIES)
      .unimplemented(),
    new StatusMove(Moves.FAKE_TEARS, Type.DARK, 100, 20, -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPDEF, -2),
    new AttackMove(Moves.AIR_CUTTER, Type.FLYING, MoveCategory.SPECIAL, 60, 95, 25, -1, 0, 3)
      .attr(HighCritAttr)
      .slicingMove()
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.OVERHEAT, Type.FIRE, MoveCategory.SPECIAL, 130, 90, 5, 100, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPATK, -2, true)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE),
    new StatusMove(Moves.ODOR_SLEUTH, Type.NORMAL, -1, 40, -1, 0, 3)
      .unimplemented(),
    new AttackMove(Moves.ROCK_TOMB, Type.ROCK, MoveCategory.PHYSICAL, 60, 95, 15, 100, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPD, -1)
      .makesContact(false),
    new AttackMove(Moves.SILVER_WIND, Type.BUG, MoveCategory.SPECIAL, 60, 100, 5, 10, 0, 3)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF, BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD ], 1, true)
      .windMove(),
    new StatusMove(Moves.METAL_SOUND, Type.STEEL, 85, 40, -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPDEF, -2)
      .soundBased(),
    new StatusMove(Moves.GRASS_WHISTLE, Type.GRASS, 55, 15, -1, 0, 3)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .soundBased(),
    new StatusMove(Moves.TICKLE, Type.NORMAL, 100, 20, -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.ATK, -1)
      .attr(StatChangeAttr, BattleStat.DEF, -1),
    new SelfStatusMove(Moves.COSMIC_POWER, Type.PSYCHIC, -1, 20, -1, 0, 3)
      .attr(StatChangeAttr, [ BattleStat.DEF, BattleStat.SPDEF ], 1, true),
    new AttackMove(Moves.WATER_SPOUT, Type.WATER, MoveCategory.SPECIAL, 150, 100, 5, -1, 0, 3)
      .attr(HpPowerAttr)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.SIGNAL_BEAM, Type.BUG, MoveCategory.SPECIAL, 75, 100, 15, 10, 0, 3)
      .attr(ConfuseAttr),
    new AttackMove(Moves.SHADOW_PUNCH, Type.GHOST, MoveCategory.PHYSICAL, 60, -1, 20, -1, 0, 3)
      .punchingMove(),
    new AttackMove(Moves.EXTRASENSORY, Type.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 20, 10, 0, 3)
      .attr(FlinchAttr),
    new AttackMove(Moves.SKY_UPPERCUT, Type.FIGHTING, MoveCategory.PHYSICAL, 85, 90, 15, -1, 0, 3)
      .attr(HitsTagAttr, BattlerTagType.FLYING)
      .punchingMove(),
    new AttackMove(Moves.SAND_TOMB, Type.GROUND, MoveCategory.PHYSICAL, 35, 85, 15, 100, 0, 3)
      .attr(TrapAttr, BattlerTagType.SAND_TOMB)
      .makesContact(false),
    new AttackMove(Moves.SHEER_COLD, Type.ICE, MoveCategory.SPECIAL, 200, 30, 5, -1, 0, 3)
      .attr(OneHitKOAttr)
      .attr(OneHitKOAccuracyAttr),
    new AttackMove(Moves.MUDDY_WATER, Type.WATER, MoveCategory.SPECIAL, 90, 85, 10, 30, 0, 3)
      .attr(StatChangeAttr, BattleStat.ACC, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.BULLET_SEED, Type.GRASS, MoveCategory.PHYSICAL, 25, 100, 30, -1, 0, 3)
      .attr(MultiHitAttr)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(Moves.AERIAL_ACE, Type.FLYING, MoveCategory.PHYSICAL, 60, -1, 20, -1, 0, 3)
      .slicingMove(),
    new AttackMove(Moves.ICICLE_SPEAR, Type.ICE, MoveCategory.PHYSICAL, 25, 100, 30, -1, 0, 3)
      .attr(MultiHitAttr)
      .makesContact(false),
    new SelfStatusMove(Moves.IRON_DEFENSE, Type.STEEL, -1, 15, -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.DEF, 2, true),
    new StatusMove(Moves.BLOCK, Type.NORMAL, -1, 5, -1, 0, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, true, 1),
    new StatusMove(Moves.HOWL, Type.NORMAL, -1, 40, -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.ATK, 1)
      .soundBased()
      .target(MoveTarget.USER_AND_ALLIES),
    new AttackMove(Moves.DRAGON_CLAW, Type.DRAGON, MoveCategory.PHYSICAL, 80, 100, 15, -1, 0, 3),
    new AttackMove(Moves.FRENZY_PLANT, Type.GRASS, MoveCategory.SPECIAL, 150, 90, 5, -1, 0, 3)
      .attr(RechargeAttr),
    new SelfStatusMove(Moves.BULK_UP, Type.FIGHTING, -1, 20, -1, 0, 3)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF ], 1, true),
    new AttackMove(Moves.BOUNCE, Type.FLYING, MoveCategory.PHYSICAL, 85, 85, 5, 30, 0, 3)
      .attr(ChargeAttr, ChargeAnim.BOUNCE_CHARGING, 'sprang up!', BattlerTagType.FLYING)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .condition(failOnGravityCondition)
      .ignoresVirtual(),
    new AttackMove(Moves.MUD_SHOT, Type.GROUND, MoveCategory.SPECIAL, 55, 95, 15, 100, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPD, -1),
    new AttackMove(Moves.POISON_TAIL, Type.POISON, MoveCategory.PHYSICAL, 50, 100, 25, 10, 0, 3)
      .attr(HighCritAttr)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(Moves.COVET, Type.NORMAL, MoveCategory.PHYSICAL, 60, 100, 25, -1, 0, 3)
      .attr(StealHeldItemChanceAttr, 0.3),
    new AttackMove(Moves.VOLT_TACKLE, Type.ELECTRIC, MoveCategory.PHYSICAL, 120, 100, 15, 10, 0, 3)
      .attr(RecoilAttr, false, 0.33)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.MAGICAL_LEAF, Type.GRASS, MoveCategory.SPECIAL, 60, -1, 20, -1, 0, 3),
    new StatusMove(Moves.WATER_SPORT, Type.WATER, -1, 15, -1, 0, 3)
      .attr(AddArenaTagAttr, ArenaTagType.WATER_SPORT, 5)
      .target(MoveTarget.BOTH_SIDES),
    new SelfStatusMove(Moves.CALM_MIND, Type.PSYCHIC, -1, 20, -1, 0, 3)
      .attr(StatChangeAttr, [ BattleStat.SPATK, BattleStat.SPDEF ], 1, true),
    new AttackMove(Moves.LEAF_BLADE, Type.GRASS, MoveCategory.PHYSICAL, 90, 100, 15, -1, 0, 3)
      .attr(HighCritAttr)
      .slicingMove(),
    new SelfStatusMove(Moves.DRAGON_DANCE, Type.DRAGON, -1, 20, -1, 0, 3)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.SPD ], 1, true)
      .danceMove(),
    new AttackMove(Moves.ROCK_BLAST, Type.ROCK, MoveCategory.PHYSICAL, 25, 90, 10, -1, 0, 3)
      .attr(MultiHitAttr)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(Moves.SHOCK_WAVE, Type.ELECTRIC, MoveCategory.SPECIAL, 60, -1, 20, -1, 0, 3),
    new AttackMove(Moves.WATER_PULSE, Type.WATER, MoveCategory.SPECIAL, 60, 100, 20, 20, 0, 3)
      .attr(ConfuseAttr)
      .pulseMove(),
    new AttackMove(Moves.DOOM_DESIRE, Type.STEEL, MoveCategory.SPECIAL, 140, 100, 5, -1, 0, 3)
      .attr(DelayedAttackAttr, ArenaTagType.DOOM_DESIRE, ChargeAnim.DOOM_DESIRE_CHARGING, 'chose\nDoom Desire as its destiny!'),
    new AttackMove(Moves.PSYCHO_BOOST, Type.PSYCHIC, MoveCategory.SPECIAL, 140, 90, 5, 100, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPATK, -2, true),
    new SelfStatusMove(Moves.ROOST, Type.FLYING, -1, 5, -1, 0, 4)
      .attr(HealAttr, 0.5)
      .attr(AddBattlerTagAttr, BattlerTagType.GROUNDED, true, false, 1)
      .triageMove(),
    new StatusMove(Moves.GRAVITY, Type.PSYCHIC, -1, 5, -1, 0, 4)
      .attr(AddArenaTagAttr, ArenaTagType.GRAVITY, 5)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(Moves.MIRACLE_EYE, Type.PSYCHIC, -1, 40, -1, 0, 4)
      .unimplemented(),
    new AttackMove(Moves.WAKE_UP_SLAP, Type.FIGHTING, MoveCategory.PHYSICAL, 70, 100, 10, -1, 0, 4)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.status?.effect === StatusEffect.SLEEP ? 2 : 1)
      .attr(HealStatusEffectAttr, false, StatusEffect.SLEEP),
    new AttackMove(Moves.HAMMER_ARM, Type.FIGHTING, MoveCategory.PHYSICAL, 100, 90, 10, 100, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPD, -1, true)
      .punchingMove(),
    new AttackMove(Moves.GYRO_BALL, Type.STEEL, MoveCategory.PHYSICAL, -1, 100, 5, -1, 0, 4)
      .attr(BattleStatRatioPowerAttr, Stat.SPD, true)
      .ballBombMove(),
    new SelfStatusMove(Moves.HEALING_WISH, Type.PSYCHIC, -1, 10, -1, 0, 4)
      .attr(SacrificialFullRestoreAttr)
      .triageMove(),
    new AttackMove(Moves.BRINE, Type.WATER, MoveCategory.SPECIAL, 65, 100, 10, -1, 0, 4)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.getHpRatio() < 0.5 ? 2 : 1),
    new AttackMove(Moves.NATURAL_GIFT, Type.NORMAL, MoveCategory.PHYSICAL, -1, 100, 15, -1, 0, 4)
      .makesContact(false)
      .unimplemented(),
    new AttackMove(Moves.FEINT, Type.NORMAL, MoveCategory.PHYSICAL, 30, 100, 10, -1, 2, 4)
      .attr(RemoveBattlerTagAttr, [ BattlerTagType.PROTECTED ])
      .makesContact(false)
      .ignoresProtect(),
    new AttackMove(Moves.PLUCK, Type.FLYING, MoveCategory.PHYSICAL, 60, 100, 20, -1, 0, 4)
      .partial(),
    new StatusMove(Moves.TAILWIND, Type.FLYING, -1, 15, -1, 0, 4)
      .windMove()
      .target(MoveTarget.USER_SIDE)
      .unimplemented(),
    new StatusMove(Moves.ACUPRESSURE, Type.NORMAL, -1, 30, -1, 0, 4)
      .attr(StatChangeAttr, BattleStat.RAND, 2)
      .target(MoveTarget.USER_OR_NEAR_ALLY),
    new AttackMove(Moves.METAL_BURST, Type.STEEL, MoveCategory.PHYSICAL, -1, 100, 10, -1, 0, 4)
      .attr(CounterDamageAttr, (move: Move) => (move.category === MoveCategory.PHYSICAL || move.category === MoveCategory.SPECIAL), 1.5)
      .makesContact(false)
      .target(MoveTarget.ATTACKER),
    new AttackMove(Moves.U_TURN, Type.BUG, MoveCategory.PHYSICAL, 70, 100, 20, -1, 0, 4)
      .attr(ForceSwitchOutAttr, true, false),
    new AttackMove(Moves.CLOSE_COMBAT, Type.FIGHTING, MoveCategory.PHYSICAL, 120, 100, 5, 100, 0, 4)
      .attr(StatChangeAttr, [ BattleStat.DEF, BattleStat.SPDEF ], -1, true),
    new AttackMove(Moves.PAYBACK, Type.DARK, MoveCategory.PHYSICAL, 50, 100, 10, -1, 0, 4)
    .attr(MovePowerMultiplierAttr, (user, target, move) => target.getLastXMoves(1).find(m => m.turn === target.scene.currentBattle.turn) || user.scene.currentBattle.turnCommands[target.getBattlerIndex()].command === Command.BALL ? 2 : 1),  
    new AttackMove(Moves.ASSURANCE, Type.DARK, MoveCategory.PHYSICAL, 60, 100, 10, -1, 0, 4)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.turnData.damageTaken > 0 ? 2 : 1),
    new StatusMove(Moves.EMBARGO, Type.DARK, 100, 15, -1, 0, 4)
      .unimplemented(),
    new AttackMove(Moves.FLING, Type.DARK, MoveCategory.PHYSICAL, -1, 100, 10, -1, 0, 4)
      .makesContact(false)
      .unimplemented(),
    new StatusMove(Moves.PSYCHO_SHIFT, Type.PSYCHIC, 100, 10, -1, 0, 4)
      .attr(PsychoShiftEffectAttr)
      .condition((user, target, move) => (user.status?.effect === StatusEffect.BURN
        || user.status?.effect === StatusEffect.POISON
        || user.status?.effect === StatusEffect.TOXIC
        || user.status?.effect === StatusEffect.PARALYSIS
        || user.status?.effect === StatusEffect.SLEEP)
        && target.canSetStatus(user.status?.effect)
        ),
    new AttackMove(Moves.TRUMP_CARD, Type.NORMAL, MoveCategory.SPECIAL, -1, -1, 5, -1, 0, 4)
      .makesContact()
      .unimplemented(),
    new StatusMove(Moves.HEAL_BLOCK, Type.PSYCHIC, 100, 15, -1, 0, 4)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.WRING_OUT, Type.NORMAL, MoveCategory.SPECIAL, -1, 100, 5, -1, 0, 4)
      .attr(OpponentHighHpPowerAttr)
      .makesContact(),
    new SelfStatusMove(Moves.POWER_TRICK, Type.PSYCHIC, -1, 10, -1, 0, 4)
      .unimplemented(),
    new StatusMove(Moves.GASTRO_ACID, Type.POISON, 100, 10, -1, 0, 4)
      .unimplemented(),
    new StatusMove(Moves.LUCKY_CHANT, Type.NORMAL, -1, 30, -1, 0, 4)
      .attr(AddBattlerTagAttr, BattlerTagType.NO_CRIT, false, false, 5)
      .target(MoveTarget.USER_SIDE)
      .unimplemented(),
    new StatusMove(Moves.ME_FIRST, Type.NORMAL, -1, 20, -1, 0, 4)
      .ignoresVirtual()
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new SelfStatusMove(Moves.COPYCAT, Type.NORMAL, -1, 20, -1, 0, 4)
      .attr(CopyMoveAttr)
      .ignoresVirtual(),
    new StatusMove(Moves.POWER_SWAP, Type.PSYCHIC, -1, 10, -1, 0, 4)
      .unimplemented(),
    new StatusMove(Moves.GUARD_SWAP, Type.PSYCHIC, -1, 10, -1, 0, 4)
      .unimplemented(),
    new AttackMove(Moves.PUNISHMENT, Type.DARK, MoveCategory.PHYSICAL, -1, 100, 5, -1, 0, 4)
      .unimplemented(),
    new AttackMove(Moves.LAST_RESORT, Type.NORMAL, MoveCategory.PHYSICAL, 140, 100, 5, -1, 0, 4)
      .condition((user, target, move) => {
        const uniqueUsedMoveIds = new Set<Moves>();
        const movesetMoveIds = user.getMoveset().map(m => m.moveId);
        user.getMoveHistory().map(m => {
          if (m.move !== move.id && movesetMoveIds.find(mm => mm === m.move))
            uniqueUsedMoveIds.add(m.move);
        });
        return uniqueUsedMoveIds.size >= movesetMoveIds.length - 1;
      }),
    new StatusMove(Moves.WORRY_SEED, Type.GRASS, 100, 10, -1, 0, 4)
      .attr(AbilityChangeAttr, Abilities.INSOMNIA),
    new AttackMove(Moves.SUCKER_PUNCH, Type.DARK, MoveCategory.PHYSICAL, 70, 100, 5, -1, 1, 4)
      .condition((user, target, move) => user.scene.currentBattle.turnCommands[target.getBattlerIndex()].command === Command.FIGHT && !target.turnData.acted && allMoves[user.scene.currentBattle.turnCommands[target.getBattlerIndex()].move.move].category !== MoveCategory.STATUS),
    new StatusMove(Moves.TOXIC_SPIKES, Type.POISON, -1, 20, -1, 0, 4)
      .attr(AddArenaTrapTagAttr, ArenaTagType.TOXIC_SPIKES)
      .target(MoveTarget.ENEMY_SIDE),
    new StatusMove(Moves.HEART_SWAP, Type.PSYCHIC, -1, 10, -1, 0, 4)
      .unimplemented(),
    new SelfStatusMove(Moves.AQUA_RING, Type.WATER, -1, 20, -1, 0, 4)
      .attr(AddBattlerTagAttr, BattlerTagType.AQUA_RING, true, true),
    new SelfStatusMove(Moves.MAGNET_RISE, Type.ELECTRIC, -1, 10, -1, 0, 4)
      .unimplemented(),
    new AttackMove(Moves.FLARE_BLITZ, Type.FIRE, MoveCategory.PHYSICAL, 120, 100, 15, 10, 0, 4)
      .attr(RecoilAttr, false, 0.33)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .condition(failOnGravityCondition),
    new AttackMove(Moves.FORCE_PALM, Type.FIGHTING, MoveCategory.PHYSICAL, 60, 100, 10, 30, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.AURA_SPHERE, Type.FIGHTING, MoveCategory.SPECIAL, 80, -1, 20, -1, 0, 4)
      .pulseMove()
      .ballBombMove(),
    new SelfStatusMove(Moves.ROCK_POLISH, Type.ROCK, -1, 20, -1, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPD, 2, true),
    new AttackMove(Moves.POISON_JAB, Type.POISON, MoveCategory.PHYSICAL, 80, 100, 20, 30, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(Moves.DARK_PULSE, Type.DARK, MoveCategory.SPECIAL, 80, 100, 15, 20, 0, 4)
      .attr(FlinchAttr)
      .pulseMove(),
    new AttackMove(Moves.NIGHT_SLASH, Type.DARK, MoveCategory.PHYSICAL, 70, 100, 15, -1, 0, 4)
      .attr(HighCritAttr)
      .slicingMove(),
    new AttackMove(Moves.AQUA_TAIL, Type.WATER, MoveCategory.PHYSICAL, 90, 90, 10, -1, 0, 4),
    new AttackMove(Moves.SEED_BOMB, Type.GRASS, MoveCategory.PHYSICAL, 80, 100, 15, -1, 0, 4)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(Moves.AIR_SLASH, Type.FLYING, MoveCategory.SPECIAL, 75, 95, 15, 30, 0, 4)
      .attr(FlinchAttr)
      .slicingMove(),
    new AttackMove(Moves.X_SCISSOR, Type.BUG, MoveCategory.PHYSICAL, 80, 100, 15, -1, 0, 4)
      .slicingMove(),
    new AttackMove(Moves.BUG_BUZZ, Type.BUG, MoveCategory.SPECIAL, 90, 100, 10, 10, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1)
      .soundBased(),
    new AttackMove(Moves.DRAGON_PULSE, Type.DRAGON, MoveCategory.SPECIAL, 85, 100, 10, -1, 0, 4)
      .pulseMove(),
    new AttackMove(Moves.DRAGON_RUSH, Type.DRAGON, MoveCategory.PHYSICAL, 100, 75, 10, 20, 0, 4)
      .attr(FlinchAttr),
    new AttackMove(Moves.POWER_GEM, Type.ROCK, MoveCategory.SPECIAL, 80, 100, 20, -1, 0, 4),
    new AttackMove(Moves.DRAIN_PUNCH, Type.FIGHTING, MoveCategory.PHYSICAL, 75, 100, 10, -1, 0, 4)
      .attr(HitHealAttr)
      .punchingMove()
      .triageMove(),
    new AttackMove(Moves.VACUUM_WAVE, Type.FIGHTING, MoveCategory.SPECIAL, 40, 100, 30, -1, 1, 4),
    new AttackMove(Moves.FOCUS_BLAST, Type.FIGHTING, MoveCategory.SPECIAL, 120, 70, 5, 10, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1)
      .ballBombMove(),
    new AttackMove(Moves.ENERGY_BALL, Type.GRASS, MoveCategory.SPECIAL, 90, 100, 10, 10, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1)
      .ballBombMove(),
    new AttackMove(Moves.BRAVE_BIRD, Type.FLYING, MoveCategory.PHYSICAL, 120, 100, 15, -1, 0, 4)
      .attr(RecoilAttr, false, 0.33),
    new AttackMove(Moves.EARTH_POWER, Type.GROUND, MoveCategory.SPECIAL, 90, 100, 10, 10, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1),
    new StatusMove(Moves.SWITCHEROO, Type.DARK, 100, 10, -1, 0, 4)
      .unimplemented(),
    new AttackMove(Moves.GIGA_IMPACT, Type.NORMAL, MoveCategory.PHYSICAL, 150, 90, 5, -1, 0, 4)
      .attr(RechargeAttr),
    new SelfStatusMove(Moves.NASTY_PLOT, Type.DARK, -1, 20, -1, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPATK, 2, true),
    new AttackMove(Moves.BULLET_PUNCH, Type.STEEL, MoveCategory.PHYSICAL, 40, 100, 30, -1, 1, 4)
      .punchingMove(),
    new AttackMove(Moves.AVALANCHE, Type.ICE, MoveCategory.PHYSICAL, 60, 100, 10, -1, -4, 4)
      .attr(TurnDamagedDoublePowerAttr),
    new AttackMove(Moves.ICE_SHARD, Type.ICE, MoveCategory.PHYSICAL, 40, 100, 30, -1, 1, 4)
      .makesContact(false),
    new AttackMove(Moves.SHADOW_CLAW, Type.GHOST, MoveCategory.PHYSICAL, 70, 100, 15, -1, 0, 4)
      .attr(HighCritAttr),
    new AttackMove(Moves.THUNDER_FANG, Type.ELECTRIC, MoveCategory.PHYSICAL, 65, 95, 15, 10, 0, 4)
      .attr(FlinchAttr)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .bitingMove(),
    new AttackMove(Moves.ICE_FANG, Type.ICE, MoveCategory.PHYSICAL, 65, 95, 15, 10, 0, 4)
      .attr(FlinchAttr)
      .attr(StatusEffectAttr, StatusEffect.FREEZE)
      .bitingMove(),
    new AttackMove(Moves.FIRE_FANG, Type.FIRE, MoveCategory.PHYSICAL, 65, 95, 15, 10, 0, 4)
      .attr(FlinchAttr)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .bitingMove(),
    new AttackMove(Moves.SHADOW_SNEAK, Type.GHOST, MoveCategory.PHYSICAL, 40, 100, 30, -1, 1, 4),
    new AttackMove(Moves.MUD_BOMB, Type.GROUND, MoveCategory.SPECIAL, 65, 85, 10, 30, 0, 4)
      .attr(StatChangeAttr, BattleStat.ACC, -1)
      .ballBombMove(),
    new AttackMove(Moves.PSYCHO_CUT, Type.PSYCHIC, MoveCategory.PHYSICAL, 70, 100, 20, -1, 0, 4)
      .attr(HighCritAttr)
      .slicingMove()
      .makesContact(false),
    new AttackMove(Moves.ZEN_HEADBUTT, Type.PSYCHIC, MoveCategory.PHYSICAL, 80, 90, 15, 20, 0, 4)
      .attr(FlinchAttr),
    new AttackMove(Moves.MIRROR_SHOT, Type.STEEL, MoveCategory.SPECIAL, 65, 85, 10, 30, 0, 4)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new AttackMove(Moves.FLASH_CANNON, Type.STEEL, MoveCategory.SPECIAL, 80, 100, 10, 10, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1),
    new AttackMove(Moves.ROCK_CLIMB, Type.NORMAL, MoveCategory.PHYSICAL, 90, 85, 20, 20, 0, 4)
      .attr(ConfuseAttr),
    new StatusMove(Moves.DEFOG, Type.FLYING, -1, 15, -1, 0, 4)
      .attr(StatChangeAttr, BattleStat.EVA, -1)
      .attr(ClearWeatherAttr, WeatherType.FOG)
      .attr(ClearTerrainAttr)
      .attr(RemoveScreensAttr, true),
    new StatusMove(Moves.TRICK_ROOM, Type.PSYCHIC, -1, 5, -1, -7, 4)
      .attr(AddArenaTagAttr, ArenaTagType.TRICK_ROOM, 5)
      .ignoresProtect()
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.DRACO_METEOR, Type.DRAGON, MoveCategory.SPECIAL, 130, 90, 5, 100, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPATK, -2, true),
    new AttackMove(Moves.DISCHARGE, Type.ELECTRIC, MoveCategory.SPECIAL, 80, 100, 15, 30, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.LAVA_PLUME, Type.FIRE, MoveCategory.SPECIAL, 80, 100, 15, 30, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.LEAF_STORM, Type.GRASS, MoveCategory.SPECIAL, 130, 90, 5, 100, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPATK, -2, true),
    new AttackMove(Moves.POWER_WHIP, Type.GRASS, MoveCategory.PHYSICAL, 120, 85, 10, -1, 0, 4),
    new AttackMove(Moves.ROCK_WRECKER, Type.ROCK, MoveCategory.PHYSICAL, 150, 90, 5, -1, 0, 4)
      .attr(RechargeAttr)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(Moves.CROSS_POISON, Type.POISON, MoveCategory.PHYSICAL, 70, 100, 20, 10, 0, 4)
      .attr(HighCritAttr)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .slicingMove(),
    new AttackMove(Moves.GUNK_SHOT, Type.POISON, MoveCategory.PHYSICAL, 120, 80, 5, 30, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .makesContact(false),
    new AttackMove(Moves.IRON_HEAD, Type.STEEL, MoveCategory.PHYSICAL, 80, 100, 15, 30, 0, 4)
      .attr(FlinchAttr),
    new AttackMove(Moves.MAGNET_BOMB, Type.STEEL, MoveCategory.PHYSICAL, 60, -1, 20, -1, 0, 4)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(Moves.STONE_EDGE, Type.ROCK, MoveCategory.PHYSICAL, 100, 80, 5, -1, 0, 4)
      .attr(HighCritAttr)
      .makesContact(false),
    new StatusMove(Moves.CAPTIVATE, Type.NORMAL, 100, 20, -1, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPATK, -2)
      .condition((user, target, move) => target.isOppositeGender(user))
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.STEALTH_ROCK, Type.ROCK, -1, 20, -1, 0, 4)
      .attr(AddArenaTrapTagAttr, ArenaTagType.STEALTH_ROCK)
      .target(MoveTarget.ENEMY_SIDE),
    new AttackMove(Moves.GRASS_KNOT, Type.GRASS, MoveCategory.SPECIAL, -1, 100, 20, -1, 0, 4)
      .attr(WeightPowerAttr)
      .makesContact()
      .condition(failOnMaxCondition),
    new AttackMove(Moves.CHATTER, Type.FLYING, MoveCategory.SPECIAL, 65, 100, 20, 100, 0, 4)
      .attr(ConfuseAttr)
      .soundBased(),
    new AttackMove(Moves.JUDGMENT, Type.NORMAL, MoveCategory.SPECIAL, 100, 100, 10, -1, 0, 4)
      .partial(),
    new AttackMove(Moves.BUG_BITE, Type.BUG, MoveCategory.PHYSICAL, 60, 100, 20, -1, 0, 4)
      .partial(),
    new AttackMove(Moves.CHARGE_BEAM, Type.ELECTRIC, MoveCategory.SPECIAL, 50, 90, 10, 70, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPATK, 1, true),
    new AttackMove(Moves.WOOD_HAMMER, Type.GRASS, MoveCategory.PHYSICAL, 120, 100, 15, -1, 0, 4)
      .attr(RecoilAttr, false, 0.33),
    new AttackMove(Moves.AQUA_JET, Type.WATER, MoveCategory.PHYSICAL, 40, 100, 20, -1, 1, 4),
    new AttackMove(Moves.ATTACK_ORDER, Type.BUG, MoveCategory.PHYSICAL, 90, 100, 15, -1, 0, 4)
      .attr(HighCritAttr)
      .makesContact(false),
    new SelfStatusMove(Moves.DEFEND_ORDER, Type.BUG, -1, 10, -1, 0, 4)
      .attr(StatChangeAttr, [ BattleStat.DEF, BattleStat.SPDEF ], 1, true),
    new SelfStatusMove(Moves.HEAL_ORDER, Type.BUG, -1, 10, -1, 0, 4)
      .attr(HealAttr, 0.5)
      .triageMove(),
    new AttackMove(Moves.HEAD_SMASH, Type.ROCK, MoveCategory.PHYSICAL, 150, 80, 5, -1, 0, 4)
      .attr(RecoilAttr, false, 0.5),
    new AttackMove(Moves.DOUBLE_HIT, Type.NORMAL, MoveCategory.PHYSICAL, 35, 90, 10, -1, 0, 4)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.ROAR_OF_TIME, Type.DRAGON, MoveCategory.SPECIAL, 150, 90, 5, -1, 0, 4)
      .attr(RechargeAttr),
    new AttackMove(Moves.SPACIAL_REND, Type.DRAGON, MoveCategory.SPECIAL, 100, 95, 5, -1, 0, 4)
      .attr(HighCritAttr),
    new SelfStatusMove(Moves.LUNAR_DANCE, Type.PSYCHIC, -1, 10, -1, 0, 4)
      .attr(SacrificialAttr)
      .danceMove()
      .triageMove()
      .unimplemented(),
    new AttackMove(Moves.CRUSH_GRIP, Type.NORMAL, MoveCategory.PHYSICAL, -1, 100, 5, -1, 0, 4)
      .attr(OpponentHighHpPowerAttr),
    new AttackMove(Moves.MAGMA_STORM, Type.FIRE, MoveCategory.SPECIAL, 100, 75, 5, 100, 0, 4)
      .attr(TrapAttr, BattlerTagType.MAGMA_STORM),
    new StatusMove(Moves.DARK_VOID, Type.DARK, 50, 10, -1, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.SEED_FLARE, Type.GRASS, MoveCategory.SPECIAL, 120, 85, 5, 40, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1),
    new AttackMove(Moves.OMINOUS_WIND, Type.GHOST, MoveCategory.SPECIAL, 60, 100, 5, 10, 0, 4)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF, BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD ], 1, true)
      .windMove(),
    new AttackMove(Moves.SHADOW_FORCE, Type.GHOST, MoveCategory.PHYSICAL, 120, 100, 5, -1, 0, 4)
      .attr(ChargeAttr, ChargeAnim.SHADOW_FORCE_CHARGING, 'vanished\ninstantly!', BattlerTagType.HIDDEN)
      .ignoresProtect()
      .ignoresVirtual(),
    new SelfStatusMove(Moves.HONE_CLAWS, Type.DARK, -1, 15, -1, 0, 5)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.ACC ], 1, true),
    new StatusMove(Moves.WIDE_GUARD, Type.ROCK, -1, 10, -1, 3, 5)
      .target(MoveTarget.USER_SIDE)
      .unimplemented(),
    new StatusMove(Moves.GUARD_SPLIT, Type.PSYCHIC, -1, 10, -1, 0, 5)
      .unimplemented(),
    new StatusMove(Moves.POWER_SPLIT, Type.PSYCHIC, -1, 10, -1, 0, 5)
      .unimplemented(),
    new StatusMove(Moves.WONDER_ROOM, Type.PSYCHIC, -1, 10, -1, 0, 5)
      .ignoresProtect()
      .target(MoveTarget.BOTH_SIDES)
      .unimplemented(),
    new AttackMove(Moves.PSYSHOCK, Type.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 5)
      .attr(DefDefAttr),
    new AttackMove(Moves.VENOSHOCK, Type.POISON, MoveCategory.SPECIAL, 65, 100, 10, -1, 0, 5)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.status && (target.status.effect === StatusEffect.POISON || target.status.effect === StatusEffect.TOXIC) ? 2 : 1),
    new SelfStatusMove(Moves.AUTOTOMIZE, Type.STEEL, -1, 15, -1, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPD, 2, true)
      .partial(),
    new SelfStatusMove(Moves.RAGE_POWDER, Type.BUG, -1, 20, -1, 2, 5)
      .powderMove()
      .unimplemented(),
    new StatusMove(Moves.TELEKINESIS, Type.PSYCHIC, -1, 15, -1, 0, 5)
      .condition(failOnGravityCondition)
      .unimplemented(),
    new StatusMove(Moves.MAGIC_ROOM, Type.PSYCHIC, -1, 10, -1, 0, 5)
      .ignoresProtect()
      .target(MoveTarget.BOTH_SIDES)
      .unimplemented(),
    new AttackMove(Moves.SMACK_DOWN, Type.ROCK, MoveCategory.PHYSICAL, 50, 100, 15, 100, 0, 5)
      .attr(AddBattlerTagAttr, BattlerTagType.IGNORE_FLYING, false, false, 5)
      .attr(HitsTagAttr, BattlerTagType.FLYING, false)
      .makesContact(false),
    new AttackMove(Moves.STORM_THROW, Type.FIGHTING, MoveCategory.PHYSICAL, 60, 100, 10, -1, 0, 5)
      .attr(CritOnlyAttr),
    new AttackMove(Moves.FLAME_BURST, Type.FIRE, MoveCategory.SPECIAL, 70, 100, 15, -1, 0, 5)
      .partial(),
    new AttackMove(Moves.SLUDGE_WAVE, Type.POISON, MoveCategory.SPECIAL, 95, 100, 10, 10, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new SelfStatusMove(Moves.QUIVER_DANCE, Type.BUG, -1, 20, -1, 0, 5)
      .attr(StatChangeAttr, [ BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD ], 1, true)
      .danceMove(),
    new AttackMove(Moves.HEAVY_SLAM, Type.STEEL, MoveCategory.PHYSICAL, -1, 100, 10, -1, 0, 5)
      .attr(CompareWeightPowerAttr)
      .condition(failOnMaxCondition),
    new AttackMove(Moves.SYNCHRONOISE, Type.PSYCHIC, MoveCategory.SPECIAL, 120, 100, 10, -1, 0, 5)
      .target(MoveTarget.ALL_NEAR_OTHERS)
      .partial(),
    new AttackMove(Moves.ELECTRO_BALL, Type.ELECTRIC, MoveCategory.SPECIAL, -1, 100, 10, -1, 0, 5)
      .attr(BattleStatRatioPowerAttr, Stat.SPD)
      .ballBombMove(),
    new StatusMove(Moves.SOAK, Type.WATER, 100, 20, -1, 0, 5)
      .attr(ChangeTypeAttr, Type.WATER),
    new AttackMove(Moves.FLAME_CHARGE, Type.FIRE, MoveCategory.PHYSICAL, 50, 100, 20, 100, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPD, 1, true),
    new SelfStatusMove(Moves.COIL, Type.POISON, -1, 20, -1, 0, 5)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF, BattleStat.ACC ], 1, true),
    new AttackMove(Moves.LOW_SWEEP, Type.FIGHTING, MoveCategory.PHYSICAL, 65, 100, 20, 100, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPD, -1),
    new AttackMove(Moves.ACID_SPRAY, Type.POISON, MoveCategory.SPECIAL, 40, 100, 20, 100, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPDEF, -2)
      .ballBombMove(),
    new AttackMove(Moves.FOUL_PLAY, Type.DARK, MoveCategory.PHYSICAL, 95, 100, 15, -1, 0, 5)
      .attr(TargetAtkUserAtkAttr),
    new StatusMove(Moves.SIMPLE_BEAM, Type.NORMAL, 100, 15, -1, 0, 5)
      .attr(AbilityChangeAttr, Abilities.SIMPLE),
    new StatusMove(Moves.ENTRAINMENT, Type.NORMAL, 100, 15, -1, 0, 5)
      .attr(AbilityGiveAttr),
    new StatusMove(Moves.AFTER_YOU, Type.NORMAL, -1, 15, -1, 0, 5)
      .ignoresProtect()
      .unimplemented(),
    new AttackMove(Moves.ROUND, Type.NORMAL, MoveCategory.SPECIAL, 60, 100, 15, -1, 0, 5)
      .soundBased()
      .partial(),
    new AttackMove(Moves.ECHOED_VOICE, Type.NORMAL, MoveCategory.SPECIAL, 40, 100, 15, -1, 0, 5)
      .attr(ConsecutiveUseMultiBasePowerAttr, 5, false)
      .soundBased(),
    new AttackMove(Moves.CHIP_AWAY, Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 20, -1, 0, 5)
      .attr(IgnoreOpponentStatChangesAttr),
    new AttackMove(Moves.CLEAR_SMOG, Type.POISON, MoveCategory.SPECIAL, 50, -1, 15, -1, 0, 5)
      .attr(ResetStatsAttr),
    new AttackMove(Moves.STORED_POWER, Type.PSYCHIC, MoveCategory.SPECIAL, 20, 100, 10, -1, 0, 5)
      .attr(StatChangeCountPowerAttr),
    new StatusMove(Moves.QUICK_GUARD, Type.FIGHTING, -1, 15, -1, 3, 5)
      .target(MoveTarget.USER_SIDE)
      .unimplemented(),
    new SelfStatusMove(Moves.ALLY_SWITCH, Type.PSYCHIC, -1, 15, -1, 2, 5)
      .ignoresProtect()
      .unimplemented(),
    new AttackMove(Moves.SCALD, Type.WATER, MoveCategory.SPECIAL, 80, 100, 15, 30, 0, 5)
      .attr(HealStatusEffectAttr, false, StatusEffect.FREEZE)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new SelfStatusMove(Moves.SHELL_SMASH, Type.NORMAL, -1, 15, -1, 0, 5)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.SPATK, BattleStat.SPD ], 2, true)
      .attr(StatChangeAttr, [ BattleStat.DEF, BattleStat.SPDEF ], -1, true),
    new StatusMove(Moves.HEAL_PULSE, Type.PSYCHIC, -1, 10, -1, 0, 5)
      .attr(HealAttr, 0.5, false, false)
      .pulseMove()
      .triageMove(),
    new AttackMove(Moves.HEX, Type.GHOST, MoveCategory.SPECIAL, 65, 100, 10, -1, 0, 5)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.status ? 2 : 1),
    new AttackMove(Moves.SKY_DROP, Type.FLYING, MoveCategory.PHYSICAL, 60, 100, 10, -1, 0, 5)
      .attr(ChargeAttr, ChargeAnim.SKY_DROP_CHARGING, 'took {TARGET}\ninto the sky!', BattlerTagType.FLYING) // TODO: Add 2nd turn message
      .condition(failOnGravityCondition)
      .ignoresVirtual(), 
    new SelfStatusMove(Moves.SHIFT_GEAR, Type.STEEL, -1, 10, -1, 0, 5)
      .attr(StatChangeAttr, BattleStat.ATK, 1, true)
      .attr(StatChangeAttr, BattleStat.SPD, 2, true),
    new AttackMove(Moves.CIRCLE_THROW, Type.FIGHTING, MoveCategory.PHYSICAL, 60, 90, 10, -1, -6, 5)
      .attr(ForceSwitchOutAttr),
    new AttackMove(Moves.INCINERATE, Type.FIRE, MoveCategory.SPECIAL, 60, 100, 15, -1, 0, 5)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .partial(),
    new StatusMove(Moves.QUASH, Type.DARK, 100, 15, -1, 0, 5)
      .unimplemented(),
    new AttackMove(Moves.ACROBATICS, Type.FLYING, MoveCategory.PHYSICAL, 55, 100, 15, -1, 0, 5)
      .partial(),
    new StatusMove(Moves.REFLECT_TYPE, Type.NORMAL, -1, 15, -1, 0, 5)
      .attr(CopyTypeAttr),
    new AttackMove(Moves.RETALIATE, Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 5, -1, 0, 5)
      .partial(),
    new AttackMove(Moves.FINAL_GAMBIT, Type.FIGHTING, MoveCategory.SPECIAL, -1, 100, 5, -1, 0, 5)
      .attr(UserHpDamageAttr)
      .attr(SacrificialAttr),
    new StatusMove(Moves.BESTOW, Type.NORMAL, -1, 15, -1, 0, 5)
      .ignoresProtect()
      .unimplemented(),
    new AttackMove(Moves.INFERNO, Type.FIRE, MoveCategory.SPECIAL, 100, 50, 5, 100, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.WATER_PLEDGE, Type.WATER, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 5)
      .partial(),
    new AttackMove(Moves.FIRE_PLEDGE, Type.FIRE, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 5)
      .partial(),
    new AttackMove(Moves.GRASS_PLEDGE, Type.GRASS, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 5)
      .partial(),
    new AttackMove(Moves.VOLT_SWITCH, Type.ELECTRIC, MoveCategory.SPECIAL, 70, 100, 20, -1, 0, 5)
      .attr(ForceSwitchOutAttr, true, false),
    new AttackMove(Moves.STRUGGLE_BUG, Type.BUG, MoveCategory.SPECIAL, 50, 100, 20, 100, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPATK, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.BULLDOZE, Type.GROUND, MoveCategory.PHYSICAL, 60, 100, 20, 100, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPD, -1)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.FROST_BREATH, Type.ICE, MoveCategory.SPECIAL, 60, 90, 10, 100, 0, 5)
      .attr(CritOnlyAttr),
    new AttackMove(Moves.DRAGON_TAIL, Type.DRAGON, MoveCategory.PHYSICAL, 60, 90, 10, -1, -6, 5)
      .attr(ForceSwitchOutAttr),
    new SelfStatusMove(Moves.WORK_UP, Type.NORMAL, -1, 30, -1, 0, 5)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.SPATK ], 1, true),
    new AttackMove(Moves.ELECTROWEB, Type.ELECTRIC, MoveCategory.SPECIAL, 55, 95, 15, 100, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPD, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.WILD_CHARGE, Type.ELECTRIC, MoveCategory.PHYSICAL, 90, 100, 15, -1, 0, 5)
      .attr(RecoilAttr),
    new AttackMove(Moves.DRILL_RUN, Type.GROUND, MoveCategory.PHYSICAL, 80, 95, 10, -1, 0, 5)
      .attr(HighCritAttr),
    new AttackMove(Moves.DUAL_CHOP, Type.DRAGON, MoveCategory.PHYSICAL, 40, 90, 15, -1, 0, 5)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.HEART_STAMP, Type.PSYCHIC, MoveCategory.PHYSICAL, 60, 100, 25, 30, 0, 5)
      .attr(FlinchAttr),
    new AttackMove(Moves.HORN_LEECH, Type.GRASS, MoveCategory.PHYSICAL, 75, 100, 10, -1, 0, 5)
      .attr(HitHealAttr)
      .triageMove(),
    new AttackMove(Moves.SACRED_SWORD, Type.FIGHTING, MoveCategory.PHYSICAL, 90, 100, 15, -1, 0, 5)
      .attr(IgnoreOpponentStatChangesAttr)  
      .slicingMove(),
    new AttackMove(Moves.RAZOR_SHELL, Type.WATER, MoveCategory.PHYSICAL, 75, 95, 10, 50, 0, 5)
      .attr(StatChangeAttr, BattleStat.DEF, -1)
      .slicingMove(),
    new AttackMove(Moves.HEAT_CRASH, Type.FIRE, MoveCategory.PHYSICAL, -1, 100, 10, -1, 0, 5)
      .attr(CompareWeightPowerAttr)
      .condition(failOnMaxCondition),
    new AttackMove(Moves.LEAF_TORNADO, Type.GRASS, MoveCategory.SPECIAL, 65, 90, 10, 50, 0, 5)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new AttackMove(Moves.STEAMROLLER, Type.BUG, MoveCategory.PHYSICAL, 65, 100, 20, 30, 0, 5)
      .attr(FlinchAttr),
    new SelfStatusMove(Moves.COTTON_GUARD, Type.GRASS, -1, 10, -1, 0, 5)
      .attr(StatChangeAttr, BattleStat.DEF, 3, true),
    new AttackMove(Moves.NIGHT_DAZE, Type.DARK, MoveCategory.SPECIAL, 85, 95, 10, 40, 0, 5)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new AttackMove(Moves.PSYSTRIKE, Type.PSYCHIC, MoveCategory.SPECIAL, 100, 100, 10, -1, 0, 5)
      .attr(DefDefAttr),
    new AttackMove(Moves.TAIL_SLAP, Type.NORMAL, MoveCategory.PHYSICAL, 25, 85, 10, -1, 0, 5)
      .attr(MultiHitAttr),
    new AttackMove(Moves.HURRICANE, Type.FLYING, MoveCategory.SPECIAL, 110, 70, 10, 30, 0, 5)
      .attr(ThunderAccuracyAttr)
      .attr(ConfuseAttr)
      .attr(HitsTagAttr, BattlerTagType.FLYING, false)
      .windMove(),
    new AttackMove(Moves.HEAD_CHARGE, Type.NORMAL, MoveCategory.PHYSICAL, 120, 100, 15, -1, 0, 5)
      .attr(RecoilAttr),
    new AttackMove(Moves.GEAR_GRIND, Type.STEEL, MoveCategory.PHYSICAL, 50, 85, 15, -1, 0, 5)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.SEARING_SHOT, Type.FIRE, MoveCategory.SPECIAL, 100, 100, 5, 30, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .ballBombMove()
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.TECHNO_BLAST, Type.NORMAL, MoveCategory.SPECIAL, 120, 100, 5, -1, 0, 5)
      .partial(),
    new AttackMove(Moves.RELIC_SONG, Type.NORMAL, MoveCategory.SPECIAL, 75, 100, 10, 10, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.SECRET_SWORD, Type.FIGHTING, MoveCategory.SPECIAL, 85, 100, 10, -1, 0, 5)
      .attr(DefDefAttr)
      .slicingMove(),
    new AttackMove(Moves.GLACIATE, Type.ICE, MoveCategory.SPECIAL, 65, 95, 10, 100, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPD, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.BOLT_STRIKE, Type.ELECTRIC, MoveCategory.PHYSICAL, 130, 85, 5, 20, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.BLUE_FLARE, Type.FIRE, MoveCategory.SPECIAL, 130, 85, 5, 20, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.FIERY_DANCE, Type.FIRE, MoveCategory.SPECIAL, 80, 100, 10, 50, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPATK, 1, true)
      .danceMove(),
    new AttackMove(Moves.FREEZE_SHOCK, Type.ICE, MoveCategory.PHYSICAL, 140, 90, 5, 30, 0, 5)
      .attr(ChargeAttr, ChargeAnim.FREEZE_SHOCK_CHARGING, 'became cloaked\nin a freezing light!')
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .makesContact(false),
    new AttackMove(Moves.ICE_BURN, Type.ICE, MoveCategory.SPECIAL, 140, 90, 5, 30, 0, 5)
      .attr(ChargeAttr, ChargeAnim.ICE_BURN_CHARGING, 'became cloaked\nin freezing air!')
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .ignoresVirtual(),
    new AttackMove(Moves.SNARL, Type.DARK, MoveCategory.SPECIAL, 55, 95, 15, 100, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPATK, -1)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.ICICLE_CRASH, Type.ICE, MoveCategory.PHYSICAL, 85, 90, 10, 30, 0, 5)
      .attr(FlinchAttr)
      .makesContact(false),
    new AttackMove(Moves.V_CREATE, Type.FIRE, MoveCategory.PHYSICAL, 180, 95, 5, 100, 0, 5)
      .attr(StatChangeAttr, [ BattleStat.DEF, BattleStat.SPDEF, BattleStat.SPD ], -1, true),
    new AttackMove(Moves.FUSION_FLARE, Type.FIRE, MoveCategory.SPECIAL, 100, 100, 5, -1, 0, 5)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .partial(),
    new AttackMove(Moves.FUSION_BOLT, Type.ELECTRIC, MoveCategory.PHYSICAL, 100, 100, 5, -1, 0, 5)
      .makesContact(false)
      .partial(),
    new AttackMove(Moves.FLYING_PRESS, Type.FIGHTING, MoveCategory.PHYSICAL, 100, 95, 10, -1, 0, 6)
      .attr(FlyingTypeMultiplierAttr)
      .condition(failOnGravityCondition),
    new StatusMove(Moves.MAT_BLOCK, Type.FIGHTING, -1, 10, -1, 0, 6)
      .unimplemented(),
    new AttackMove(Moves.BELCH, Type.POISON, MoveCategory.SPECIAL, 120, 90, 10, -1, 0, 6)
      .partial(),
    new StatusMove(Moves.ROTOTILLER, Type.GROUND, -1, 10, 100, 0, 6)
      .target(MoveTarget.ALL)
      .unimplemented(),
    new StatusMove(Moves.STICKY_WEB, Type.BUG, -1, 20, -1, 0, 6)
      .attr(AddArenaTrapTagAttr, ArenaTagType.STICKY_WEB)
      .target(MoveTarget.ENEMY_SIDE),
    new AttackMove(Moves.FELL_STINGER, Type.BUG, MoveCategory.PHYSICAL, 50, 100, 25, -1, 0, 6)
      .partial(),
    new AttackMove(Moves.PHANTOM_FORCE, Type.GHOST, MoveCategory.PHYSICAL, 90, 100, 10, -1, 0, 6)
      .attr(ChargeAttr, ChargeAnim.PHANTOM_FORCE_CHARGING, 'vanished\ninstantly!', BattlerTagType.HIDDEN)
      .ignoresProtect()
      .ignoresVirtual(),
    new StatusMove(Moves.TRICK_OR_TREAT, Type.GHOST, 100, 20, -1, 0, 6)
      .attr(AddTypeAttr, Type.GHOST)
      .partial(),
    new StatusMove(Moves.NOBLE_ROAR, Type.NORMAL, 100, 30, 100, 0, 6)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.SPATK ], -1)
      .soundBased(),
    new StatusMove(Moves.ION_DELUGE, Type.ELECTRIC, -1, 25, -1, 1, 6)
      .target(MoveTarget.BOTH_SIDES)
      .unimplemented(),
    new AttackMove(Moves.PARABOLIC_CHARGE, Type.ELECTRIC, MoveCategory.SPECIAL, 65, 100, 20, -1, 0, 6)
      .attr(HitHealAttr)
      .target(MoveTarget.ALL_NEAR_OTHERS)
      .triageMove(),
    new StatusMove(Moves.FORESTS_CURSE, Type.GRASS, 100, 20, -1, 0, 6)
      .attr(AddTypeAttr, Type.GRASS)
      .partial(),
    new AttackMove(Moves.PETAL_BLIZZARD, Type.GRASS, MoveCategory.PHYSICAL, 90, 100, 15, -1, 0, 6)
      .windMove()
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.FREEZE_DRY, Type.ICE, MoveCategory.SPECIAL, 70, 100, 20, 10, 0, 6)
      .attr(StatusEffectAttr, StatusEffect.FREEZE)
      .attr(WaterSuperEffectTypeMultiplierAttr),
    new AttackMove(Moves.DISARMING_VOICE, Type.FAIRY, MoveCategory.SPECIAL, 40, -1, 15, -1, 0, 6)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.PARTING_SHOT, Type.DARK, 100, 20, 100, 0, 6)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.SPATK ], -1)
      .attr(ForceSwitchOutAttr, true, false)
      .soundBased(),
    new StatusMove(Moves.TOPSY_TURVY, Type.DARK, -1, 20, -1, 0, 6)
      .attr(InvertStatsAttr),
    new AttackMove(Moves.DRAINING_KISS, Type.FAIRY, MoveCategory.SPECIAL, 50, 100, 10, -1, 0, 6)
      .attr(HitHealAttr, 0.75)
      .makesContact()
      .triageMove(),
    new StatusMove(Moves.CRAFTY_SHIELD, Type.FAIRY, -1, 10, -1, 3, 6)
      .target(MoveTarget.USER_SIDE)
      .unimplemented(),
    new StatusMove(Moves.FLOWER_SHIELD, Type.FAIRY, -1, 10, 100, 0, 6)
      .target(MoveTarget.ALL)
      .unimplemented(),
    new StatusMove(Moves.GRASSY_TERRAIN, Type.GRASS, -1, 10, -1, 0, 6)
      .attr(TerrainChangeAttr, TerrainType.GRASSY)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(Moves.MISTY_TERRAIN, Type.FAIRY, -1, 10, -1, 0, 6)
      .attr(TerrainChangeAttr, TerrainType.MISTY)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(Moves.ELECTRIFY, Type.ELECTRIC, -1, 20, -1, 0, 6)
      .unimplemented(),
    new AttackMove(Moves.PLAY_ROUGH, Type.FAIRY, MoveCategory.PHYSICAL, 90, 90, 10, 10, 0, 6)
      .attr(StatChangeAttr, BattleStat.ATK, -1),
    new AttackMove(Moves.FAIRY_WIND, Type.FAIRY, MoveCategory.SPECIAL, 40, 100, 30, -1, 0, 6)
      .windMove(),
    new AttackMove(Moves.MOONBLAST, Type.FAIRY, MoveCategory.SPECIAL, 95, 100, 15, 30, 0, 6)
      .attr(StatChangeAttr, BattleStat.SPATK, -1),
    new AttackMove(Moves.BOOMBURST, Type.NORMAL, MoveCategory.SPECIAL, 140, 100, 10, -1, 0, 6)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new StatusMove(Moves.FAIRY_LOCK, Type.FAIRY, -1, 10, -1, 0, 6)
      .target(MoveTarget.BOTH_SIDES)
      .unimplemented(),
    new SelfStatusMove(Moves.KINGS_SHIELD, Type.STEEL, -1, 10, -1, 4, 6)
      .attr(ProtectAttr, BattlerTagType.KINGS_SHIELD),
    new StatusMove(Moves.PLAY_NICE, Type.NORMAL, -1, 20, 100, 0, 6)
      .attr(StatChangeAttr, BattleStat.ATK, -1),
    new StatusMove(Moves.CONFIDE, Type.NORMAL, -1, 20, 100, 0, 6)
      .attr(StatChangeAttr, BattleStat.SPATK, -1)
      .soundBased(),
    new AttackMove(Moves.DIAMOND_STORM, Type.ROCK, MoveCategory.PHYSICAL, 100, 95, 5, 50, 0, 6)
      .attr(StatChangeAttr, BattleStat.DEF, 2, true)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.STEAM_ERUPTION, Type.WATER, MoveCategory.SPECIAL, 110, 95, 5, 30, 0, 6)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.HYPERSPACE_HOLE, Type.PSYCHIC, MoveCategory.SPECIAL, 80, -1, 5, -1, 0, 6)
      .ignoresProtect(),
    new AttackMove(Moves.WATER_SHURIKEN, Type.WATER, MoveCategory.SPECIAL, 15, 100, 20, -1, 1, 6)
      .attr(MultiHitAttr),
    new AttackMove(Moves.MYSTICAL_FIRE, Type.FIRE, MoveCategory.SPECIAL, 75, 100, 10, 100, 0, 6)
      .attr(StatChangeAttr, BattleStat.SPATK, -1),
    new SelfStatusMove(Moves.SPIKY_SHIELD, Type.GRASS, -1, 10, -1, 4, 6)
      .attr(ProtectAttr, BattlerTagType.SPIKY_SHIELD),
    new StatusMove(Moves.AROMATIC_MIST, Type.FAIRY, -1, 20, -1, 0, 6)
      .attr(StatChangeAttr, BattleStat.SPDEF, 1)
      .target(MoveTarget.NEAR_ALLY),
    new StatusMove(Moves.EERIE_IMPULSE, Type.ELECTRIC, 100, 15, -1, 0, 6)
      .attr(StatChangeAttr, BattleStat.SPATK, -2),
    new StatusMove(Moves.VENOM_DRENCH, Type.POISON, 100, 20, 100, 0, 6)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.SPATK, BattleStat.SPD ], -1, false, (user, target, move) => target.status?.effect === StatusEffect.POISON)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.POWDER, Type.BUG, 100, 20, -1, 1, 6)
      .powderMove()
      .unimplemented(),
    new SelfStatusMove(Moves.GEOMANCY, Type.FAIRY, -1, 10, -1, 0, 6)
      .attr(ChargeAttr, ChargeAnim.GEOMANCY_CHARGING, "is charging its power!")
      .attr(StatChangeAttr, [ BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD ], 2, true)
      .ignoresVirtual(),
    new StatusMove(Moves.MAGNETIC_FLUX, Type.ELECTRIC, -1, 20, -1, 0, 6)
      .attr(StatChangeAttr, [ BattleStat.DEF, BattleStat.SPDEF ], 1, false, (user, target, move) => !![ Abilities.PLUS, Abilities.MINUS].find(a => target.hasAbility(a, false)))
      .target(MoveTarget.USER_AND_ALLIES)
      .condition((user, target, move) => !![ user, user.getAlly() ].filter(p => p?.isActive()).find(p => !![ Abilities.PLUS, Abilities.MINUS].find(a => p.hasAbility(a, false)))),
    new StatusMove(Moves.HAPPY_HOUR, Type.NORMAL, -1, 30, -1, 0, 6) // No animation
      .target(MoveTarget.USER_SIDE)
      .unimplemented(),
    new StatusMove(Moves.ELECTRIC_TERRAIN, Type.ELECTRIC, -1, 10, -1, 0, 6)
      .attr(TerrainChangeAttr, TerrainType.ELECTRIC)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.DAZZLING_GLEAM, Type.FAIRY, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 6)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new SelfStatusMove(Moves.CELEBRATE, Type.NORMAL, -1, 40, -1, 0, 6),
    new StatusMove(Moves.HOLD_HANDS, Type.NORMAL, -1, 40, -1, 0, 6)
      .target(MoveTarget.NEAR_ALLY),
    new StatusMove(Moves.BABY_DOLL_EYES, Type.FAIRY, 100, 30, -1, 1, 6)
      .attr(StatChangeAttr, BattleStat.ATK, -1),
    new AttackMove(Moves.NUZZLE, Type.ELECTRIC, MoveCategory.PHYSICAL, 20, 100, 20, 100, 0, 6)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.HOLD_BACK, Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 40, -1, 0, 6)
      .attr(SurviveDamageAttr),
    new AttackMove(Moves.INFESTATION, Type.BUG, MoveCategory.SPECIAL, 20, 100, 20, 100, 0, 6)
      .makesContact()
      .attr(TrapAttr, BattlerTagType.INFESTATION),
    new AttackMove(Moves.POWER_UP_PUNCH, Type.FIGHTING, MoveCategory.PHYSICAL, 40, 100, 20, 100, 0, 6)
      .attr(StatChangeAttr, BattleStat.ATK, 1, true)
      .punchingMove(),
    new AttackMove(Moves.OBLIVION_WING, Type.FLYING, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 6)
      .attr(HitHealAttr, 0.75)
      .triageMove(),
    new AttackMove(Moves.THOUSAND_ARROWS, Type.GROUND, MoveCategory.PHYSICAL, 90, 100, 10, 100, 0, 6)
      .attr(NeutralDamageAgainstFlyingTypeMultiplierAttr)
      .attr(HitsTagAttr, BattlerTagType.FLYING, false)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.THOUSAND_WAVES, Type.GROUND, MoveCategory.PHYSICAL, 90, 100, 10, -1, 0, 6)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, false, 1)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.LANDS_WRATH, Type.GROUND, MoveCategory.PHYSICAL, 90, 100, 10, -1, 0, 6)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.LIGHT_OF_RUIN, Type.FAIRY, MoveCategory.SPECIAL, 140, 90, 5, -1, 0, 6)
      .attr(RecoilAttr, false, 0.5),
    new AttackMove(Moves.ORIGIN_PULSE, Type.WATER, MoveCategory.SPECIAL, 110, 85, 10, -1, 0, 6)
      .pulseMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.PRECIPICE_BLADES, Type.GROUND, MoveCategory.PHYSICAL, 120, 85, 10, -1, 0, 6)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.DRAGON_ASCENT, Type.FLYING, MoveCategory.PHYSICAL, 120, 100, 5, 100, 0, 6)
      .attr(StatChangeAttr, [ BattleStat.DEF, BattleStat.SPDEF ], -1, true),
    new AttackMove(Moves.HYPERSPACE_FURY, Type.DARK, MoveCategory.PHYSICAL, 100, -1, 5, 100, 0, 6)
      .attr(StatChangeAttr, BattleStat.DEF, -1, true)
      .ignoresProtect(),
    /* Unused */
    new AttackMove(Moves.BREAKNECK_BLITZ__PHYSICAL, Type.NORMAL, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.BREAKNECK_BLITZ__SPECIAL, Type.NORMAL, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.ALL_OUT_PUMMELING__PHYSICAL, Type.FIGHTING, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.ALL_OUT_PUMMELING__SPECIAL, Type.FIGHTING, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.SUPERSONIC_SKYSTRIKE__PHYSICAL, Type.FLYING, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.SUPERSONIC_SKYSTRIKE__SPECIAL, Type.FLYING, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.ACID_DOWNPOUR__PHYSICAL, Type.POISON, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.ACID_DOWNPOUR__SPECIAL, Type.POISON, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.TECTONIC_RAGE__PHYSICAL, Type.GROUND, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.TECTONIC_RAGE__SPECIAL, Type.GROUND, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.CONTINENTAL_CRUSH__PHYSICAL, Type.ROCK, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.CONTINENTAL_CRUSH__SPECIAL, Type.ROCK, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.SAVAGE_SPIN_OUT__PHYSICAL, Type.BUG, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.SAVAGE_SPIN_OUT__SPECIAL, Type.BUG, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.NEVER_ENDING_NIGHTMARE__PHYSICAL, Type.GHOST, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.NEVER_ENDING_NIGHTMARE__SPECIAL, Type.GHOST, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.CORKSCREW_CRASH__PHYSICAL, Type.STEEL, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.CORKSCREW_CRASH__SPECIAL, Type.STEEL, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.INFERNO_OVERDRIVE__PHYSICAL, Type.FIRE, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.INFERNO_OVERDRIVE__SPECIAL, Type.FIRE, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.HYDRO_VORTEX__PHYSICAL, Type.WATER, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.HYDRO_VORTEX__SPECIAL, Type.WATER, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.BLOOM_DOOM__PHYSICAL, Type.GRASS, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.BLOOM_DOOM__SPECIAL, Type.GRASS, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.GIGAVOLT_HAVOC__PHYSICAL, Type.ELECTRIC, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.GIGAVOLT_HAVOC__SPECIAL, Type.ELECTRIC, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.SHATTERED_PSYCHE__PHYSICAL, Type.PSYCHIC, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.SHATTERED_PSYCHE__SPECIAL, Type.PSYCHIC, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.SUBZERO_SLAMMER__PHYSICAL, Type.ICE, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.SUBZERO_SLAMMER__SPECIAL, Type.ICE, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.DEVASTATING_DRAKE__PHYSICAL, Type.DRAGON, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.DEVASTATING_DRAKE__SPECIAL, Type.DRAGON, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.BLACK_HOLE_ECLIPSE__PHYSICAL, Type.DARK, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.BLACK_HOLE_ECLIPSE__SPECIAL, Type.DARK, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.TWINKLE_TACKLE__PHYSICAL, Type.FAIRY, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.TWINKLE_TACKLE__SPECIAL, Type.FAIRY, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.CATASTROPIKA, Type.ELECTRIC, MoveCategory.PHYSICAL, 210, -1, 1, -1, 0, 7)
      .unimplemented(),
    /* End Unused */
    new SelfStatusMove(Moves.SHORE_UP, Type.GROUND, -1, 5, -1, 0, 7)
      .attr(SandHealAttr)
      .triageMove(),
    new AttackMove(Moves.FIRST_IMPRESSION, Type.BUG, MoveCategory.PHYSICAL, 90, 100, 10, -1, 2, 7)
      .condition(new FirstMoveCondition()),
    new SelfStatusMove(Moves.BANEFUL_BUNKER, Type.POISON, -1, 10, -1, 4, 7)
      .attr(ProtectAttr, BattlerTagType.BANEFUL_BUNKER),
    new AttackMove(Moves.SPIRIT_SHACKLE, Type.GHOST, MoveCategory.PHYSICAL, 80, 100, 10, -1, 0, 7)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, false, 1)
      .makesContact(false),
    new AttackMove(Moves.DARKEST_LARIAT, Type.DARK, MoveCategory.PHYSICAL, 85, 100, 10, -1, 0, 7)
      .attr(IgnoreOpponentStatChangesAttr),
    new AttackMove(Moves.SPARKLING_ARIA, Type.WATER, MoveCategory.SPECIAL, 90, 100, 10, -1, 0, 7)
      .attr(HealStatusEffectAttr, false, StatusEffect.BURN)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.ICE_HAMMER, Type.ICE, MoveCategory.PHYSICAL, 100, 90, 10, 100, 0, 7)
      .attr(StatChangeAttr, BattleStat.SPD, -1, true)
      .punchingMove(),
    new StatusMove(Moves.FLORAL_HEALING, Type.FAIRY, -1, 10, -1, 0, 7)
      .attr(HealAttr, 0.5, true, false)
      .triageMove()
      .partial(),
    new AttackMove(Moves.HIGH_HORSEPOWER, Type.GROUND, MoveCategory.PHYSICAL, 95, 95, 10, -1, 0, 7),
    new StatusMove(Moves.STRENGTH_SAP, Type.GRASS, 100, 10, 100, 0, 7)
      .attr(StrengthSapHealAttr)
      .attr(StatChangeAttr, BattleStat.ATK, -1)
      .condition((user, target, move) => target.summonData.battleStats[BattleStat.ATK] > -6)
      .triageMove(),
    new AttackMove(Moves.SOLAR_BLADE, Type.GRASS, MoveCategory.PHYSICAL, 125, 100, 10, -1, 0, 7)
      .attr(SunlightChargeAttr, ChargeAnim.SOLAR_BLADE_CHARGING, "is glowing!")
      .attr(AntiSunlightPowerDecreaseAttr)
      .slicingMove(),
    new AttackMove(Moves.LEAFAGE, Type.GRASS, MoveCategory.PHYSICAL, 40, 100, 40, -1, 0, 7)
      .makesContact(false),
    new StatusMove(Moves.SPOTLIGHT, Type.NORMAL, -1, 15, -1, 3, 7)
      .unimplemented(),
    new StatusMove(Moves.TOXIC_THREAD, Type.POISON, 100, 20, 100, 0, 7)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .attr(StatChangeAttr, BattleStat.SPD, -1),
    new SelfStatusMove(Moves.LASER_FOCUS, Type.NORMAL, -1, 30, -1, 0, 7)
      .attr(AddBattlerTagAttr, BattlerTagType.ALWAYS_CRIT, true, false),
    new StatusMove(Moves.GEAR_UP, Type.STEEL, -1, 20, -1, 0, 7)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.SPATK ], 1, false, (user, target, move) => !![ Abilities.PLUS, Abilities.MINUS].find(a => target.hasAbility(a, false)))
      .target(MoveTarget.USER_AND_ALLIES)
      .condition((user, target, move) => !![ user, user.getAlly() ].filter(p => p?.isActive()).find(p => !![ Abilities.PLUS, Abilities.MINUS].find(a => p.hasAbility(a, false)))),
    new AttackMove(Moves.THROAT_CHOP, Type.DARK, MoveCategory.PHYSICAL, 80, 100, 15, 100, 0, 7)
      .partial(),
    new AttackMove(Moves.POLLEN_PUFF, Type.BUG, MoveCategory.SPECIAL, 90, 100, 15, -1, 0, 7)
      .ballBombMove()
      .partial(),
    new AttackMove(Moves.ANCHOR_SHOT, Type.STEEL, MoveCategory.PHYSICAL, 80, 100, 20, -1, 0, 7)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, false, 1),
    new StatusMove(Moves.PSYCHIC_TERRAIN, Type.PSYCHIC, -1, 10, -1, 0, 7)
      .attr(TerrainChangeAttr, TerrainType.PSYCHIC)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.LUNGE, Type.BUG, MoveCategory.PHYSICAL, 80, 100, 15, 100, 0, 7)
      .attr(StatChangeAttr, BattleStat.ATK, -1),
    new AttackMove(Moves.FIRE_LASH, Type.FIRE, MoveCategory.PHYSICAL, 80, 100, 15, 100, 0, 7)
      .attr(StatChangeAttr, BattleStat.DEF, -1),
    new AttackMove(Moves.POWER_TRIP, Type.DARK, MoveCategory.PHYSICAL, 20, 100, 10, -1, 0, 7)
      .attr(StatChangeCountPowerAttr),
    new AttackMove(Moves.BURN_UP, Type.FIRE, MoveCategory.SPECIAL, 130, 100, 5, -1, 0, 7)
      .condition((user) => {
        const userTypes = user.getTypes(true);
        return userTypes.includes(Type.FIRE);
      })
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(RemoveTypeAttr, Type.FIRE, (user) => {
        user.scene.queueMessage(getPokemonMessage(user, ` burned itself out!`));
      }),
    new StatusMove(Moves.SPEED_SWAP, Type.PSYCHIC, -1, 10, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.SMART_STRIKE, Type.STEEL, MoveCategory.PHYSICAL, 70, -1, 10, -1, 0, 7),
    new StatusMove(Moves.PURIFY, Type.POISON, -1, 20, -1, 0, 7)
      .triageMove()
      .unimplemented(),
    new AttackMove(Moves.REVELATION_DANCE, Type.NORMAL, MoveCategory.SPECIAL, 90, 100, 15, -1, 0, 7)
      .danceMove()
      .partial(),
    new AttackMove(Moves.CORE_ENFORCER, Type.DRAGON, MoveCategory.SPECIAL, 100, 100, 10, -1, 0, 7)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .partial(),
    new AttackMove(Moves.TROP_KICK, Type.GRASS, MoveCategory.PHYSICAL, 70, 100, 15, 100, 0, 7)
      .attr(StatChangeAttr, BattleStat.ATK, -1),
    new StatusMove(Moves.INSTRUCT, Type.PSYCHIC, -1, 15, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.BEAK_BLAST, Type.FLYING, MoveCategory.PHYSICAL, 100, 100, 15, -1, 5, 7)
      .attr(ChargeAttr, ChargeAnim.BEAK_BLAST_CHARGING, "started\nheating up its beak!", undefined, false, true, -3)
      .ballBombMove()
      .makesContact(false)
      .partial(),
    new AttackMove(Moves.CLANGING_SCALES, Type.DRAGON, MoveCategory.SPECIAL, 110, 100, 5, 100, 0, 7)
      .attr(StatChangeAttr, BattleStat.DEF, -1, true)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.DRAGON_HAMMER, Type.DRAGON, MoveCategory.PHYSICAL, 90, 100, 15, -1, 0, 7),
    new AttackMove(Moves.BRUTAL_SWING, Type.DARK, MoveCategory.PHYSICAL, 60, 100, 20, -1, 0, 7)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new StatusMove(Moves.AURORA_VEIL, Type.ICE, -1, 20, -1, 0, 7)
      .condition((user, target, move) => (user.scene.arena.weather?.weatherType === WeatherType.HAIL || user.scene.arena.weather?.weatherType === WeatherType.SNOW) && !user.scene.arena.weather?.isEffectSuppressed(user.scene))
      .attr(AddArenaTagAttr, ArenaTagType.AURORA_VEIL, 5, true)
      .target(MoveTarget.USER_SIDE),
    /* Unused */
    new AttackMove(Moves.SINISTER_ARROW_RAID, Type.GHOST, MoveCategory.PHYSICAL, 180, -1, 1, -1, 0, 7)
      .makesContact(false)
      .partial(),
    new AttackMove(Moves.MALICIOUS_MOONSAULT, Type.DARK, MoveCategory.PHYSICAL, 180, -1, 1, -1, 0, 7)
      .partial(),
    new AttackMove(Moves.OCEANIC_OPERETTA, Type.WATER, MoveCategory.SPECIAL, 195, -1, 1, -1, 0, 7)
      .partial(),
    new AttackMove(Moves.GUARDIAN_OF_ALOLA, Type.FAIRY, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.SOUL_STEALING_7_STAR_STRIKE, Type.GHOST, MoveCategory.PHYSICAL, 195, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.STOKED_SPARKSURFER, Type.ELECTRIC, MoveCategory.SPECIAL, 175, -1, 1, 100, 0, 7)
      .partial(),
    new AttackMove(Moves.PULVERIZING_PANCAKE, Type.NORMAL, MoveCategory.PHYSICAL, 210, -1, 1, -1, 0, 7)
      .partial(),
    new SelfStatusMove(Moves.EXTREME_EVOBOOST, Type.NORMAL, -1, 1, 100, 0, 7)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF, BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD ], 2, true),
    new AttackMove(Moves.GENESIS_SUPERNOVA, Type.PSYCHIC, MoveCategory.SPECIAL, 185, -1, 1, -1, 0, 7)
      .attr(TerrainChangeAttr, TerrainType.PSYCHIC),
    /* End Unused */
    new AttackMove(Moves.SHELL_TRAP, Type.FIRE, MoveCategory.SPECIAL, 150, 100, 5, -1, -3, 7)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .partial(),
    new AttackMove(Moves.FLEUR_CANNON, Type.FAIRY, MoveCategory.SPECIAL, 130, 90, 5, 100, 0, 7)
      .attr(StatChangeAttr, BattleStat.SPATK, -2, true),
    new AttackMove(Moves.PSYCHIC_FANGS, Type.PSYCHIC, MoveCategory.PHYSICAL, 85, 100, 10, -1, 0, 7)
      .bitingMove()
      .attr(RemoveScreensAttr),
    new AttackMove(Moves.STOMPING_TANTRUM, Type.GROUND, MoveCategory.PHYSICAL, 75, 100, 10, -1, 0, 7)
      .attr(MovePowerMultiplierAttr, (user, target, move) => user.getLastXMoves(2)[1]?.result == MoveResult.MISS || user.getLastXMoves(2)[1]?.result == MoveResult.FAIL ? 2 : 1),
    new AttackMove(Moves.SHADOW_BONE, Type.GHOST, MoveCategory.PHYSICAL, 85, 100, 10, 20, 0, 7)
      .attr(StatChangeAttr, BattleStat.DEF, -1)
      .makesContact(false),
    new AttackMove(Moves.ACCELEROCK, Type.ROCK, MoveCategory.PHYSICAL, 40, 100, 20, -1, 1, 7),
    new AttackMove(Moves.LIQUIDATION, Type.WATER, MoveCategory.PHYSICAL, 85, 100, 10, 20, 0, 7)
      .attr(StatChangeAttr, BattleStat.DEF, -1),
    new AttackMove(Moves.PRISMATIC_LASER, Type.PSYCHIC, MoveCategory.SPECIAL, 160, 100, 10, -1, 0, 7)
      .attr(RechargeAttr),
    new AttackMove(Moves.SPECTRAL_THIEF, Type.GHOST, MoveCategory.PHYSICAL, 90, 100, 10, -1, 0, 7)
      .partial(),
    new AttackMove(Moves.SUNSTEEL_STRIKE, Type.STEEL, MoveCategory.PHYSICAL, 100, 100, 5, -1, 0, 7)
      .ignoresAbilities()
      .partial(),
    new AttackMove(Moves.MOONGEIST_BEAM, Type.GHOST, MoveCategory.SPECIAL, 100, 100, 5, -1, 0, 7)
      .ignoresAbilities()
      .partial(),
    new StatusMove(Moves.TEARFUL_LOOK, Type.NORMAL, -1, 20, 100, 0, 7)
      .attr(StatChangeAttr, BattleStat.ATK, -1)
      .attr(StatChangeAttr, BattleStat.SPATK, -1),
    new AttackMove(Moves.ZING_ZAP, Type.ELECTRIC, MoveCategory.PHYSICAL, 80, 100, 10, 30, 0, 7)
      .attr(FlinchAttr),
    new AttackMove(Moves.NATURES_MADNESS, Type.FAIRY, MoveCategory.SPECIAL, -1, 90, 10, -1, 0, 7)
      .attr(TargetHalfHpDamageAttr),
    new AttackMove(Moves.MULTI_ATTACK, Type.NORMAL, MoveCategory.PHYSICAL, 120, 100, 10, -1, 0, 7)
      .partial(),
    /* Unused */
    new AttackMove(Moves.TEN_MILLION_VOLT_THUNDERBOLT, Type.ELECTRIC, MoveCategory.SPECIAL, 195, -1, 1, -1, 0, 7)
      .partial(),
    /* End Unused */
    new AttackMove(Moves.MIND_BLOWN, Type.FIRE, MoveCategory.SPECIAL, 150, 100, 5, -1, 0, 7)
      .condition(failIfDampCondition)
      .attr(HalfSacrificialAttr)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.PLASMA_FISTS, Type.ELECTRIC, MoveCategory.PHYSICAL, 100, 100, 15, -1, 0, 7)
      .punchingMove()
      .partial(),
    new AttackMove(Moves.PHOTON_GEYSER, Type.PSYCHIC, MoveCategory.SPECIAL, 100, 100, 5, -1, 0, 7)
      .attr(PhotonGeyserCategoryAttr)
      .ignoresAbilities()
      .partial(),
    /* Unused */
    new AttackMove(Moves.LIGHT_THAT_BURNS_THE_SKY, Type.PSYCHIC, MoveCategory.SPECIAL, 200, -1, 1, -1, 0, 7)
      .attr(PhotonGeyserCategoryAttr)
      .ignoresAbilities(),
    new AttackMove(Moves.SEARING_SUNRAZE_SMASH, Type.STEEL, MoveCategory.PHYSICAL, 200, -1, 1, -1, 0, 7)
      .ignoresAbilities(),
    new AttackMove(Moves.MENACING_MOONRAZE_MAELSTROM, Type.GHOST, MoveCategory.SPECIAL, 200, -1, 1, -1, 0, 7)
      .ignoresAbilities(),
    new AttackMove(Moves.LETS_SNUGGLE_FOREVER, Type.FAIRY, MoveCategory.PHYSICAL, 190, -1, 1, -1, 0, 7)
      .partial(),
    new AttackMove(Moves.SPLINTERED_STORMSHARDS, Type.ROCK, MoveCategory.PHYSICAL, 190, -1, 1, -1, 0, 7)
      .attr(ClearTerrainAttr)
      .makesContact(false),
    new AttackMove(Moves.CLANGOROUS_SOULBLAZE, Type.DRAGON, MoveCategory.SPECIAL, 185, -1, 1, 100, 0, 7)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF, BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD ], 1, true)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .partial(),
    /* End Unused */
    new AttackMove(Moves.ZIPPY_ZAP, Type.ELECTRIC, MoveCategory.PHYSICAL, 80, 100, 10, 100, 2, 7)
      .attr(CritOnlyAttr),
    new AttackMove(Moves.SPLISHY_SPLASH, Type.WATER, MoveCategory.SPECIAL, 90, 100, 15, 30, 0, 7)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.FLOATY_FALL, Type.FLYING, MoveCategory.PHYSICAL, 90, 95, 15, 30, 0, 7)
      .attr(FlinchAttr),
    new AttackMove(Moves.PIKA_PAPOW, Type.ELECTRIC, MoveCategory.SPECIAL, -1, -1, 20, -1, 0, 7)
      .attr(FriendshipPowerAttr),
    new AttackMove(Moves.BOUNCY_BUBBLE, Type.WATER, MoveCategory.SPECIAL, 60, 100, 20, -1, 0, 7)
      .attr(HitHealAttr)
      .triageMove(),
    new AttackMove(Moves.BUZZY_BUZZ, Type.ELECTRIC, MoveCategory.SPECIAL, 60, 100, 20, 100, 0, 7)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.SIZZLY_SLIDE, Type.FIRE, MoveCategory.PHYSICAL, 60, 100, 20, 100, 0, 7)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.GLITZY_GLOW, Type.PSYCHIC, MoveCategory.SPECIAL, 80, 95, 15, -1, 0, 7)
      .attr(AddArenaTagAttr, ArenaTagType.LIGHT_SCREEN, 5, false, true),
    new AttackMove(Moves.BADDY_BAD, Type.DARK, MoveCategory.SPECIAL, 80, 95, 15, -1, 0, 7)
      .attr(AddArenaTagAttr, ArenaTagType.REFLECT, 5, false, true),
    new AttackMove(Moves.SAPPY_SEED, Type.GRASS, MoveCategory.PHYSICAL, 100, 90, 10, 100, 0, 7)
      .attr(AddBattlerTagAttr, BattlerTagType.SEEDED),
    new AttackMove(Moves.FREEZY_FROST, Type.ICE, MoveCategory.SPECIAL, 100, 90, 10, -1, 0, 7)
      .attr(ResetStatsAttr),
    new AttackMove(Moves.SPARKLY_SWIRL, Type.FAIRY, MoveCategory.SPECIAL, 120, 85, 5, -1, 0, 7)
      .partial(),
    new AttackMove(Moves.VEEVEE_VOLLEY, Type.NORMAL, MoveCategory.PHYSICAL, -1, -1, 20, -1, 0, 7)
      .attr(FriendshipPowerAttr),
    new AttackMove(Moves.DOUBLE_IRON_BASH, Type.STEEL, MoveCategory.PHYSICAL, 60, 100, 5, 30, 0, 7)
      .attr(MultiHitAttr, MultiHitType._2)
      .attr(FlinchAttr)
      .punchingMove(),
    /* Unused */
    new SelfStatusMove(Moves.MAX_GUARD, Type.NORMAL, -1, 10, -1, 4, 8)
      .attr(ProtectAttr),
    /* End Unused */
    new AttackMove(Moves.DYNAMAX_CANNON, Type.DRAGON, MoveCategory.SPECIAL, 100, 100, 5, -1, 0, 8)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.level > 200 ? 2 : 1)
      .attr(DiscourageFrequentUseAttr)
      .ignoresVirtual(),
    new AttackMove(Moves.SNIPE_SHOT, Type.WATER, MoveCategory.SPECIAL, 80, 100, 15, -1, 0, 8)
      .partial(),
    new AttackMove(Moves.JAW_LOCK, Type.DARK, MoveCategory.PHYSICAL, 80, 100, 10, -1, 0, 8)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, false, 1)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, true, false, 1)
      .bitingMove(),
    new SelfStatusMove(Moves.STUFF_CHEEKS, Type.NORMAL, -1, 10, 100, 0, 8)
      .unimplemented(),
    new SelfStatusMove(Moves.NO_RETREAT, Type.FIGHTING, -1, 5, 100, 0, 8)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF, BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD ], 1, true)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, true, true, 1),
    new StatusMove(Moves.TAR_SHOT, Type.ROCK, 100, 15, 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.SPD, -1)
      .partial(),
    new StatusMove(Moves.MAGIC_POWDER, Type.PSYCHIC, 100, 20, -1, 0, 8)
      .attr(ChangeTypeAttr, Type.PSYCHIC)
      .powderMove(),
    new AttackMove(Moves.DRAGON_DARTS, Type.DRAGON, MoveCategory.PHYSICAL, 50, 100, 10, -1, 0, 8)
      .attr(MultiHitAttr, MultiHitType._2)
      .makesContact(false)
      .partial(),
    new StatusMove(Moves.TEATIME, Type.NORMAL, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL)
      .unimplemented(),
    new StatusMove(Moves.OCTOLOCK, Type.FIGHTING, 100, 15, -1, 0, 8)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, true, 1)
      .partial(),
    new AttackMove(Moves.BOLT_BEAK, Type.ELECTRIC, MoveCategory.PHYSICAL, 85, 100, 10, -1, 0, 8)
      .attr(FirstAttackDoublePowerAttr),
    new AttackMove(Moves.FISHIOUS_REND, Type.WATER, MoveCategory.PHYSICAL, 85, 100, 10, -1, 0, 8)
      .attr(FirstAttackDoublePowerAttr)
      .bitingMove(),
    new StatusMove(Moves.COURT_CHANGE, Type.NORMAL, 100, 10, -1, 0, 8)
      .target(MoveTarget.BOTH_SIDES)
      .unimplemented(),
    /* Unused */
    new AttackMove(Moves.MAX_FLARE, Type.FIRE, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_FLUTTERBY, Type.BUG, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_LIGHTNING, Type.ELECTRIC, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_STRIKE, Type.NORMAL, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_KNUCKLE, Type.FIGHTING, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_PHANTASM, Type.GHOST, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_HAILSTORM, Type.ICE, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_OOZE, Type.POISON, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_GEYSER, Type.WATER, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_AIRSTREAM, Type.FLYING, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_STARFALL, Type.FAIRY, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_WYRMWIND, Type.DRAGON, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_MINDSTORM, Type.PSYCHIC, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_ROCKFALL, Type.ROCK, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_QUAKE, Type.GROUND, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_DARKNESS, Type.DARK, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_OVERGROWTH, Type.GRASS, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_STEELSPIKE, Type.STEEL, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    /* End Unused */
    new SelfStatusMove(Moves.CLANGOROUS_SOUL, Type.DRAGON, 100, 5, 100, 0, 8)
      .attr(CutHpStatBoostAttr, [ BattleStat.ATK, BattleStat.DEF, BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD ], 1, 3)
      .soundBased()
      .danceMove(),
    new AttackMove(Moves.BODY_PRESS, Type.FIGHTING, MoveCategory.PHYSICAL, 80, 100, 10, -1, 0, 8)
      .attr(DefAtkAttr),
    new StatusMove(Moves.DECORATE, Type.FAIRY, -1, 15, 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.ATK, 2)
      .attr(StatChangeAttr, BattleStat.SPATK, 2),
    new AttackMove(Moves.DRUM_BEATING, Type.GRASS, MoveCategory.PHYSICAL, 80, 100, 10, 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.SPD, -1)
      .makesContact(false),
    new AttackMove(Moves.SNAP_TRAP, Type.GRASS, MoveCategory.PHYSICAL, 35, 100, 15, 100, 0, 8)
      .attr(TrapAttr, BattlerTagType.SNAP_TRAP),
    new AttackMove(Moves.PYRO_BALL, Type.FIRE, MoveCategory.PHYSICAL, 120, 90, 5, 10, 0, 8)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .ballBombMove()
      .makesContact(false),
    new AttackMove(Moves.BEHEMOTH_BLADE, Type.STEEL, MoveCategory.PHYSICAL, 100, 100, 5, -1, 0, 8)
      .slicingMove(),
    new AttackMove(Moves.BEHEMOTH_BASH, Type.STEEL, MoveCategory.PHYSICAL, 100, 100, 5, -1, 0, 8),
    new AttackMove(Moves.AURA_WHEEL, Type.ELECTRIC, MoveCategory.PHYSICAL, 110, 100, 10, 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.SPD, 1, true)
      .makesContact(false)
      .attr(AuraWheelTypeAttr)
      .condition((user, target, move) => [user.species.speciesId, user.fusionSpecies?.speciesId].includes(Species.MORPEKO)), // Missing custom fail message
    new AttackMove(Moves.BREAKING_SWIPE, Type.DRAGON, MoveCategory.PHYSICAL, 60, 100, 15, 100, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .attr(StatChangeAttr, BattleStat.ATK, -1),
    new AttackMove(Moves.BRANCH_POKE, Type.GRASS, MoveCategory.PHYSICAL, 40, 100, 40, -1, 0, 8),
    new AttackMove(Moves.OVERDRIVE, Type.ELECTRIC, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 8)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.APPLE_ACID, Type.GRASS, MoveCategory.SPECIAL, 80, 100, 10, 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1),
    new AttackMove(Moves.GRAV_APPLE, Type.GRASS, MoveCategory.PHYSICAL, 80, 100, 10, 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.DEF, -1)
      .attr(MovePowerMultiplierAttr, (user, target, move) => user.scene.arena.getTag(ArenaTagType.GRAVITY) ? 1.5 : 1)
      .makesContact(false),
    new AttackMove(Moves.SPIRIT_BREAK, Type.FAIRY, MoveCategory.PHYSICAL, 75, 100, 15, 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.SPATK, -1),
    new AttackMove(Moves.STRANGE_STEAM, Type.FAIRY, MoveCategory.SPECIAL, 90, 95, 10, 20, 0, 8)
      .attr(ConfuseAttr),
    new StatusMove(Moves.LIFE_DEW, Type.WATER, -1, 10, -1, 0, 8)
      .attr(HealAttr, 0.25, true, false)
      .target(MoveTarget.USER_AND_ALLIES),
    new SelfStatusMove(Moves.OBSTRUCT, Type.DARK, 100, 10, -1, 4, 8)
      .attr(ProtectAttr, BattlerTagType.OBSTRUCT),
    new AttackMove(Moves.FALSE_SURRENDER, Type.DARK, MoveCategory.PHYSICAL, 80, -1, 10, -1, 0, 8),
    new AttackMove(Moves.METEOR_ASSAULT, Type.FIGHTING, MoveCategory.PHYSICAL, 150, 100, 5, -1, 0, 8)
      .attr(RechargeAttr)
      .makesContact(false),
    new AttackMove(Moves.ETERNABEAM, Type.DRAGON, MoveCategory.SPECIAL, 160, 90, 5, -1, 0, 8)
      .attr(RechargeAttr),
    new AttackMove(Moves.STEEL_BEAM, Type.STEEL, MoveCategory.SPECIAL, 140, 95, 5, -1, 0, 8)
      .attr(HalfSacrificialAttr),
    new AttackMove(Moves.EXPANDING_FORCE, Type.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 8)
      .partial(),
    new AttackMove(Moves.STEEL_ROLLER, Type.STEEL, MoveCategory.PHYSICAL, 130, 100, 5, -1, 0, 8)
      .attr(ClearTerrainAttr)
      .condition((user, target, move) => !!user.scene.arena.terrain),
    new AttackMove(Moves.SCALE_SHOT, Type.DRAGON, MoveCategory.PHYSICAL, 25, 90, 20, 100, 0, 8)
      //.attr(StatChangeAttr, BattleStat.SPD, 1, true) // TODO: Have boosts only apply at end of move, not after every hit
      //.attr(StatChangeAttr, BattleStat.DEF, -1, true)
      .attr(MultiHitAttr)
      .makesContact(false)
      .partial(),
    new AttackMove(Moves.METEOR_BEAM, Type.ROCK, MoveCategory.SPECIAL, 120, 90, 10, 100, 0, 8)
      .attr(ChargeAttr, ChargeAnim.METEOR_BEAM_CHARGING, 'is overflowing\nwith space power!', null, true)
      .attr(StatChangeAttr, BattleStat.SPATK, 1, true)
      .ignoresVirtual(),
    new AttackMove(Moves.SHELL_SIDE_ARM, Type.POISON, MoveCategory.SPECIAL, 90, 100, 10, 20, 0, 8)
      .attr(ShellSideArmCategoryAttr)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .partial(),
    new AttackMove(Moves.MISTY_EXPLOSION, Type.FAIRY, MoveCategory.SPECIAL, 100, 100, 5, -1, 0, 8)
      .attr(SacrificialAttr)
      .target(MoveTarget.ALL_NEAR_OTHERS)
      .attr(MovePowerMultiplierAttr, (user, target, move) => user.scene.arena.getTerrainType() === TerrainType.MISTY && user.isGrounded() ? 1.5 : 1)
      .condition(failIfDampCondition),
    new AttackMove(Moves.GRASSY_GLIDE, Type.GRASS, MoveCategory.PHYSICAL, 55, 100, 20, -1, 0, 8)
      .partial(),
    new AttackMove(Moves.RISING_VOLTAGE, Type.ELECTRIC, MoveCategory.SPECIAL, 70, 100, 20, -1, 0, 8)
      .attr(MovePowerMultiplierAttr, (user, target, move) => user.scene.arena.getTerrainType() === TerrainType.ELECTRIC && target.isGrounded() ? 2 : 1),
    new AttackMove(Moves.TERRAIN_PULSE, Type.NORMAL, MoveCategory.SPECIAL, 50, 100, 10, -1, 0, 8)
      .pulseMove()
      .partial(),
    new AttackMove(Moves.SKITTER_SMACK, Type.BUG, MoveCategory.PHYSICAL, 70, 90, 10, 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.SPATK, -1),
    new AttackMove(Moves.BURNING_JEALOUSY, Type.FIRE, MoveCategory.SPECIAL, 70, 100, 5, 100, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .partial(),
    new AttackMove(Moves.LASH_OUT, Type.DARK, MoveCategory.PHYSICAL, 75, 100, 5, -1, 0, 8)
      .partial(),
    new AttackMove(Moves.POLTERGEIST, Type.GHOST, MoveCategory.PHYSICAL, 110, 90, 5, -1, 0, 8)
      .makesContact(false)
      .partial(),
    new StatusMove(Moves.CORROSIVE_GAS, Type.POISON, 100, 40, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_OTHERS)
      .unimplemented(),
    new StatusMove(Moves.COACHING, Type.FIGHTING, -1, 10, 100, 0, 8)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF ], 1)
      .target(MoveTarget.NEAR_ALLY),
    new AttackMove(Moves.FLIP_TURN, Type.WATER, MoveCategory.PHYSICAL, 60, 100, 20, -1, 0, 8)
      .attr(ForceSwitchOutAttr, true, false),
    new AttackMove(Moves.TRIPLE_AXEL, Type.ICE, MoveCategory.PHYSICAL, 20, 90, 10, -1, 0, 8)
      .attr(MultiHitAttr, MultiHitType._3_INCR)
      .attr(MissEffectAttr, (user: Pokemon, move: Move) => {
        user.turnData.hitsLeft = 1;
        return true;
      })
      .partial(),
    new AttackMove(Moves.DUAL_WINGBEAT, Type.FLYING, MoveCategory.PHYSICAL, 40, 90, 10, -1, 0, 8)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.SCORCHING_SANDS, Type.GROUND, MoveCategory.SPECIAL, 70, 100, 10, 30, 0, 8)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new StatusMove(Moves.JUNGLE_HEALING, Type.GRASS, -1, 10, -1, 0, 8)
      .attr(HealAttr, 0.25, true, false)
      .target(MoveTarget.USER_AND_ALLIES)
      .partial(),
    new AttackMove(Moves.WICKED_BLOW, Type.DARK, MoveCategory.PHYSICAL, 75, 100, 5, -1, 0, 8)
      .attr(CritOnlyAttr)
      .punchingMove(),
    new AttackMove(Moves.SURGING_STRIKES, Type.WATER, MoveCategory.PHYSICAL, 25, 100, 5, -1, 0, 8)
      .attr(MultiHitAttr, MultiHitType._3)
      .attr(CritOnlyAttr)
      .punchingMove(),
    new AttackMove(Moves.THUNDER_CAGE, Type.ELECTRIC, MoveCategory.SPECIAL, 80, 90, 15, 100, 0, 8)
      .attr(TrapAttr, BattlerTagType.THUNDER_CAGE),
    new AttackMove(Moves.DRAGON_ENERGY, Type.DRAGON, MoveCategory.SPECIAL, 150, 100, 5, -1, 0, 8)
      .attr(HpPowerAttr)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.FREEZING_GLARE, Type.PSYCHIC, MoveCategory.SPECIAL, 90, 100, 10, 10, 0, 8)
      .attr(StatusEffectAttr, StatusEffect.FREEZE),
    new AttackMove(Moves.FIERY_WRATH, Type.DARK, MoveCategory.SPECIAL, 90, 100, 10, 20, 0, 8)
      .attr(FlinchAttr)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.THUNDEROUS_KICK, Type.FIGHTING, MoveCategory.PHYSICAL, 90, 100, 10, 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.DEF, -1),
    new AttackMove(Moves.GLACIAL_LANCE, Type.ICE, MoveCategory.PHYSICAL, 120, 100, 5, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.ASTRAL_BARRAGE, Type.GHOST, MoveCategory.SPECIAL, 120, 100, 5, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.EERIE_SPELL, Type.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 5, 100, 0, 8)
      .soundBased()
      .partial(),
    new AttackMove(Moves.DIRE_CLAW, Type.POISON, MoveCategory.PHYSICAL, 80, 100, 15, 50, 0, 8)
      .attr(MultiStatusEffectAttr, [StatusEffect.POISON, StatusEffect.PARALYSIS, StatusEffect.SLEEP]),
    new AttackMove(Moves.PSYSHIELD_BASH, Type.PSYCHIC, MoveCategory.PHYSICAL, 70, 90, 10, 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.DEF, 1, true),
    new SelfStatusMove(Moves.POWER_SHIFT, Type.NORMAL, -1, 10, 100, 0, 8)
      .unimplemented(),
    new AttackMove(Moves.STONE_AXE, Type.ROCK, MoveCategory.PHYSICAL, 65, 90, 15, 100, 0, 8)
      .attr(AddArenaTrapTagAttr, ArenaTagType.STEALTH_ROCK)
      .slicingMove(),
    new AttackMove(Moves.SPRINGTIDE_STORM, Type.FAIRY, MoveCategory.SPECIAL, 100, 80, 5, 30, 0, 8)
      .attr(StatChangeAttr, BattleStat.ATK, -1)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.MYSTICAL_POWER, Type.PSYCHIC, MoveCategory.SPECIAL, 70, 90, 10, 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.SPATK, 1, true),
    new AttackMove(Moves.RAGING_FURY, Type.FIRE, MoveCategory.PHYSICAL, 120, 100, 10, -1, 0, 8)
      .attr(FrenzyAttr)
      .attr(MissEffectAttr, frenzyMissFunc)
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new AttackMove(Moves.WAVE_CRASH, Type.WATER, MoveCategory.PHYSICAL, 120, 100, 10, -1, 0, 8)
      .attr(RecoilAttr, false, 0.33),
    new AttackMove(Moves.CHLOROBLAST, Type.GRASS, MoveCategory.SPECIAL, 150, 95, 5, -1, 0, 8)
      .attr(RecoilAttr, true, 0.5),
    new AttackMove(Moves.MOUNTAIN_GALE, Type.ICE, MoveCategory.PHYSICAL, 100, 85, 10, 30, 0, 8)
      .attr(FlinchAttr),
    new SelfStatusMove(Moves.VICTORY_DANCE, Type.FIGHTING, -1, 10, 100, 0, 8)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF, BattleStat.SPD ], 1, true)
      .danceMove(),
    new AttackMove(Moves.HEADLONG_RUSH, Type.GROUND, MoveCategory.PHYSICAL, 120, 100, 5, 100, 0, 8)
      .attr(StatChangeAttr, [ BattleStat.DEF, BattleStat.SPDEF ], -1, true)
      .punchingMove(),
    new AttackMove(Moves.BARB_BARRAGE, Type.POISON, MoveCategory.PHYSICAL, 60, 100, 10, 50, 0, 8)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.status && (target.status.effect === StatusEffect.POISON || target.status.effect === StatusEffect.TOXIC) ? 2 : 1)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(Moves.ESPER_WING, Type.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 10, 100, 0, 8)
      .attr(HighCritAttr)
      .attr(StatChangeAttr, BattleStat.SPD, 1, true),
    new AttackMove(Moves.BITTER_MALICE, Type.GHOST, MoveCategory.SPECIAL, 75, 100, 10, 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.ATK, -1),
    new SelfStatusMove(Moves.SHELTER, Type.STEEL, -1, 10, 100, 0, 8)
      .attr(StatChangeAttr, BattleStat.DEF, 2, true),
    new AttackMove(Moves.TRIPLE_ARROWS, Type.FIGHTING, MoveCategory.PHYSICAL, 90, 100, 10, 30, 0, 8)
      .attr(HighCritAttr)
      .attr(StatChangeAttr, BattleStat.DEF, -1)
      .attr(FlinchAttr)
      .partial(),
    new AttackMove(Moves.INFERNAL_PARADE, Type.GHOST, MoveCategory.SPECIAL, 60, 100, 15, 30, 0, 8)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.status ? 2 : 1),
    new AttackMove(Moves.CEASELESS_EDGE, Type.DARK, MoveCategory.PHYSICAL, 65, 90, 15, 100, 0, 8)
      .attr(AddArenaTrapTagAttr, ArenaTagType.SPIKES)
      .slicingMove(),
    new AttackMove(Moves.BLEAKWIND_STORM, Type.FLYING, MoveCategory.SPECIAL, 100, 80, 10, 30, 0, 8)
      .attr(ThunderAccuracyAttr)
      .attr(StatChangeAttr, BattleStat.SPD, -1)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.WILDBOLT_STORM, Type.ELECTRIC, MoveCategory.SPECIAL, 100, 80, 10, 20, 0, 8)
      .attr(ThunderAccuracyAttr)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.SANDSEAR_STORM, Type.GROUND, MoveCategory.SPECIAL, 100, 80, 10, 20, 0, 8)
      .attr(ThunderAccuracyAttr)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.LUNAR_BLESSING, Type.PSYCHIC, -1, 5, -1, 0, 8)
      .attr(HealAttr, 0.25)
      .target(MoveTarget.USER_AND_ALLIES)
      .triageMove()
      .partial(),
    new SelfStatusMove(Moves.TAKE_HEART, Type.PSYCHIC, -1, 10, -1, 0, 8)
      .attr(StatChangeAttr, [ BattleStat.SPATK, BattleStat.SPDEF ], 1, true)
      .partial(),
    /* Unused
    new AttackMove(Moves.G_MAX_WILDFIRE, Type.FIRE, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.G_MAX_BEFUDDLE, Type.BUG, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.G_MAX_VOLT_CRASH, Type.ELECTRIC, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.G_MAX_GOLD_RUSH, Type.NORMAL, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.G_MAX_CHI_STRIKE, Type.FIGHTING, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.G_MAX_TERROR, Type.GHOST, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.G_MAX_RESONANCE, Type.ICE, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.G_MAX_CUDDLE, Type.NORMAL, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.G_MAX_REPLENISH, Type.NORMAL, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.G_MAX_MALODOR, Type.POISON, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.G_MAX_STONESURGE, Type.WATER, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.G_MAX_WIND_RAGE, Type.FLYING, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.G_MAX_STUN_SHOCK, Type.ELECTRIC, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.G_MAX_FINALE, Type.FAIRY, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.G_MAX_DEPLETION, Type.DRAGON, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.G_MAX_GRAVITAS, Type.PSYCHIC, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.G_MAX_VOLCALITH, Type.ROCK, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.G_MAX_SANDBLAST, Type.GROUND, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.G_MAX_SNOOZE, Type.DARK, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.G_MAX_TARTNESS, Type.GRASS, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.G_MAX_SWEETNESS, Type.GRASS, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.G_MAX_SMITE, Type.FAIRY, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.G_MAX_STEELSURGE, Type.STEEL, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.G_MAX_MELTDOWN, Type.STEEL, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.G_MAX_FOAM_BURST, Type.WATER, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.G_MAX_CENTIFERNO, Type.FIRE, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.G_MAX_VINE_LASH, Type.GRASS, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.G_MAX_CANNONADE, Type.WATER, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.G_MAX_DRUM_SOLO, Type.GRASS, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.G_MAX_FIREBALL, Type.FIRE, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.G_MAX_HYDROSNIPE, Type.WATER, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.G_MAX_ONE_BLOW, Type.DARK, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.G_MAX_RAPID_FLOW, Type.WATER, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    End Unused */
    new AttackMove(Moves.TERA_BLAST, Type.NORMAL, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 9)
      .attr(TeraBlastCategoryAttr)
      .partial(),
    new SelfStatusMove(Moves.SILK_TRAP, Type.BUG, -1, 10, -1, 4, 9)
      .attr(ProtectAttr, BattlerTagType.SILK_TRAP),
    new AttackMove(Moves.AXE_KICK, Type.FIGHTING, MoveCategory.PHYSICAL, 120, 90, 10, 30, 0, 9)
      .attr(MissEffectAttr, crashDamageFunc)
      .attr(NoEffectAttr, crashDamageFunc)
      .attr(ConfuseAttr),
    new AttackMove(Moves.LAST_RESPECTS, Type.GHOST, MoveCategory.PHYSICAL, 50, 100, 10, -1, 0, 9)
      .attr(MovePowerMultiplierAttr, (user, target, move) => {
          return user.scene.getParty().reduce((acc, pokemonInParty) => acc + (pokemonInParty.status?.effect == StatusEffect.FAINT ? 1 : 0),
          1,)
        })
      .makesContact(false),
    new AttackMove(Moves.LUMINA_CRASH, Type.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 10, 100, 0, 9)
      .attr(StatChangeAttr, BattleStat.SPDEF, -2),
    new AttackMove(Moves.ORDER_UP, Type.DRAGON, MoveCategory.PHYSICAL, 80, 100, 10, -1, 0, 9)
      .makesContact(false)
      .partial(),
    new AttackMove(Moves.JET_PUNCH, Type.WATER, MoveCategory.PHYSICAL, 60, 100, 15, -1, 1, 9)
      .punchingMove(),
    new StatusMove(Moves.SPICY_EXTRACT, Type.GRASS, -1, 15, 100, 0, 9)
      .attr(StatChangeAttr, BattleStat.ATK, 2)
      .attr(StatChangeAttr, BattleStat.DEF, -2),
    new AttackMove(Moves.SPIN_OUT, Type.STEEL, MoveCategory.PHYSICAL, 100, 100, 5, 100, 0, 9)
      .attr(StatChangeAttr, BattleStat.SPD, -2, true),
    new AttackMove(Moves.POPULATION_BOMB, Type.NORMAL, MoveCategory.PHYSICAL, 20, 90, 10, -1, 0, 9)
      .attr(MultiHitAttr, MultiHitType._1_TO_10)
      .slicingMove()
      .partial(),
    new AttackMove(Moves.ICE_SPINNER, Type.ICE, MoveCategory.PHYSICAL, 80, 100, 15, -1, 0, 9)
      .attr(ClearTerrainAttr),
    new AttackMove(Moves.GLAIVE_RUSH, Type.DRAGON, MoveCategory.PHYSICAL, 120, 100, 5, -1, 0, 9)
      .partial(),
    new StatusMove(Moves.REVIVAL_BLESSING, Type.NORMAL, -1, 1, -1, 0, 9)
      .triageMove()
      .unimplemented(),
    new AttackMove(Moves.SALT_CURE, Type.ROCK, MoveCategory.PHYSICAL, 40, 100, 15, -1, 0, 9)
      .attr(AddBattlerTagAttr, BattlerTagType.SALT_CURED)
      .makesContact(false),
    new AttackMove(Moves.TRIPLE_DIVE, Type.WATER, MoveCategory.PHYSICAL, 30, 95, 10, -1, 0, 9)
      .attr(MultiHitAttr, MultiHitType._3),
    new AttackMove(Moves.MORTAL_SPIN, Type.POISON, MoveCategory.PHYSICAL, 30, 100, 15, 100, 0, 9)
      .attr(LapseBattlerTagAttr, [
        BattlerTagType.BIND,
        BattlerTagType.WRAP,
        BattlerTagType.FIRE_SPIN,
        BattlerTagType.WHIRLPOOL,
        BattlerTagType.CLAMP,
        BattlerTagType.SAND_TOMB,
        BattlerTagType.MAGMA_STORM,
        BattlerTagType.SNAP_TRAP,
        BattlerTagType.THUNDER_CAGE,
        BattlerTagType.SEEDED,
        BattlerTagType.INFESTATION
      ], true)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.DOODLE, Type.NORMAL, 100, 10, -1, 0, 9)
      .attr(AbilityCopyAttr, true),
    new SelfStatusMove(Moves.FILLET_AWAY, Type.NORMAL, -1, 10, -1, 0, 9)
      .attr(CutHpStatBoostAttr, [ BattleStat.ATK, BattleStat.SPATK, BattleStat.SPD ], 2, 2),
    new AttackMove(Moves.KOWTOW_CLEAVE, Type.DARK, MoveCategory.PHYSICAL, 85, -1, 10, -1, 0, 9)
      .slicingMove(),
    new AttackMove(Moves.FLOWER_TRICK, Type.GRASS, MoveCategory.PHYSICAL, 70, -1, 10, 100, 0, 9)
      .attr(CritOnlyAttr)
      .makesContact(false),
    new AttackMove(Moves.TORCH_SONG, Type.FIRE, MoveCategory.SPECIAL, 80, 100, 10, 100, 0, 9)
      .attr(StatChangeAttr, BattleStat.SPATK, 1, true)
      .soundBased(),
    new AttackMove(Moves.AQUA_STEP, Type.WATER, MoveCategory.PHYSICAL, 80, 100, 10, 100, 0, 9)
      .attr(StatChangeAttr, BattleStat.SPD, 1, true)
      .danceMove(),
    new AttackMove(Moves.RAGING_BULL, Type.NORMAL, MoveCategory.PHYSICAL, 90, 100, 10, -1, 0, 9)
      .attr(RagingBullTypeAttr)
      .attr(RemoveScreensAttr),
    new AttackMove(Moves.MAKE_IT_RAIN, Type.STEEL, MoveCategory.SPECIAL, 120, 100, 5, -1, 0, 9)
      .attr(MoneyAttr)
      .attr(StatChangeAttr, BattleStat.SPATK, -1, true, null, true, true)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.PSYBLADE, Type.PSYCHIC, MoveCategory.PHYSICAL, 80, 100, 15, -1, 0, 9)
      .attr(MovePowerMultiplierAttr, (user, target, move) => user.scene.arena.getTerrainType() === TerrainType.ELECTRIC && user.isGrounded() ? 1.5 : 1)  
      .slicingMove(),
    new AttackMove(Moves.HYDRO_STEAM, Type.WATER, MoveCategory.SPECIAL, 80, 100, 15, -1, 0, 9)
      .partial(),
    new AttackMove(Moves.RUINATION, Type.DARK, MoveCategory.SPECIAL, -1, 90, 10, -1, 0, 9)
      .attr(TargetHalfHpDamageAttr),
    new AttackMove(Moves.COLLISION_COURSE, Type.FIGHTING, MoveCategory.PHYSICAL, 100, 100, 5, -1, 0, 9)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.getAttackTypeEffectiveness(move.type) >= 2 ? 5461/4096 : 1),
    new AttackMove(Moves.ELECTRO_DRIFT, Type.ELECTRIC, MoveCategory.SPECIAL, 100, 100, 5, -1, 0, 9)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.getAttackTypeEffectiveness(move.type) >= 2 ? 5461/4096 : 1)
      .makesContact(),
    new SelfStatusMove(Moves.SHED_TAIL, Type.NORMAL, -1, 10, -1, 0, 9)
      .unimplemented(),
    new StatusMove(Moves.CHILLY_RECEPTION, Type.ICE, -1, 10, -1, 0, 9)
      .attr(WeatherChangeAttr, WeatherType.SNOW)
      .attr(ForceSwitchOutAttr, true, false)
      .target(MoveTarget.BOTH_SIDES),
    new SelfStatusMove(Moves.TIDY_UP, Type.NORMAL, -1, 10, 100, 0, 9)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.SPD ], 1, true)
      .partial(),
    new StatusMove(Moves.SNOWSCAPE, Type.ICE, -1, 10, -1, 0, 9)
      .attr(WeatherChangeAttr, WeatherType.SNOW)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.POUNCE, Type.BUG, MoveCategory.PHYSICAL, 50, 100, 20, 100, 0, 9)
      .attr(StatChangeAttr, BattleStat.SPD, -1),
    new AttackMove(Moves.TRAILBLAZE, Type.GRASS, MoveCategory.PHYSICAL, 50, 100, 20, 100, 0, 9)
      .attr(StatChangeAttr, BattleStat.SPD, 1, true),
    new AttackMove(Moves.CHILLING_WATER, Type.WATER, MoveCategory.SPECIAL, 50, 100, 20, -1, 0, 9)
      .attr(StatChangeAttr, BattleStat.ATK, -1),
    new AttackMove(Moves.HYPER_DRILL, Type.NORMAL, MoveCategory.PHYSICAL, 100, 100, 5, -1, 0, 9)
      .ignoresProtect(),
    new AttackMove(Moves.TWIN_BEAM, Type.PSYCHIC, MoveCategory.SPECIAL, 40, 100, 10, -1, 0, 9)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.RAGE_FIST, Type.GHOST, MoveCategory.PHYSICAL, 50, 100, 10, -1, 0, 9)
      .attr(HitCountPowerAttr)
      .punchingMove(),
    new AttackMove(Moves.ARMOR_CANNON, Type.FIRE, MoveCategory.SPECIAL, 120, 100, 5, -1, 0, 9)
      .attr(StatChangeAttr, [ BattleStat.DEF, BattleStat.SPDEF ], -1, true),
    new AttackMove(Moves.BITTER_BLADE, Type.FIRE, MoveCategory.PHYSICAL, 90, 100, 10, -1, 0, 9)
      .attr(HitHealAttr)
      .slicingMove()
      .triageMove(),
    new AttackMove(Moves.DOUBLE_SHOCK, Type.ELECTRIC, MoveCategory.PHYSICAL, 120, 100, 5, -1, 0, 9)
    .condition((user) => {
      const userTypes = user.getTypes(true);
      return userTypes.includes(Type.ELECTRIC);
    })
    .attr(RemoveTypeAttr, Type.ELECTRIC, (user) => {
      user.scene.queueMessage(getPokemonMessage(user, ` used up all its electricity!`));
    }),
    new AttackMove(Moves.GIGATON_HAMMER, Type.STEEL, MoveCategory.PHYSICAL, 160, 100, 5, -1, 0, 9)
      .makesContact(false)
      .condition((user, target, move) => {
        const turnMove = user.getLastXMoves(1);
        return !turnMove.length || turnMove[0].move !== move.id || turnMove[0].result !== MoveResult.SUCCESS;
      }), // TODO Add Instruct/Encore interaction
    new AttackMove(Moves.COMEUPPANCE, Type.DARK, MoveCategory.PHYSICAL, 1, 100, 10, -1, 0, 9)
      .attr(CounterDamageAttr, (move: Move) => (move.category === MoveCategory.PHYSICAL || move.category === MoveCategory.SPECIAL), 1.5)
      .target(MoveTarget.ATTACKER)
      .partial(),
    new AttackMove(Moves.AQUA_CUTTER, Type.WATER, MoveCategory.PHYSICAL, 70, 100, 20, -1, 0, 9)
      .attr(HighCritAttr)
      .slicingMove()
      .makesContact(false),
    new AttackMove(Moves.BLAZING_TORQUE, Type.FIRE, MoveCategory.PHYSICAL, 80, 100, 10, 30, 0, 9)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .makesContact(false),
    new AttackMove(Moves.WICKED_TORQUE, Type.DARK, MoveCategory.PHYSICAL, 80, 100, 10, 10, 0, 9)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .makesContact(false),
    new AttackMove(Moves.NOXIOUS_TORQUE, Type.POISON, MoveCategory.PHYSICAL, 100, 100, 10, 30, 0, 9)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .makesContact(false),
    new AttackMove(Moves.COMBAT_TORQUE, Type.FIGHTING, MoveCategory.PHYSICAL, 100, 100, 10, 30, 0, 9)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .makesContact(false),
    new AttackMove(Moves.MAGICAL_TORQUE, Type.FAIRY, MoveCategory.PHYSICAL, 100, 100, 10, 30, 0, 9)
      .attr(ConfuseAttr)
      .makesContact(false),
    new AttackMove(Moves.BLOOD_MOON, Type.NORMAL, MoveCategory.SPECIAL, 140, 100, 5, -1, 0, 9)
      .condition((user, target, move) => {
        const turnMove = user.getLastXMoves(1);
        return !turnMove.length || turnMove[0].move !== move.id || turnMove[0].result !== MoveResult.SUCCESS;
      }), // TODO Add Instruct/Encore interaction
    new AttackMove(Moves.MATCHA_GOTCHA, Type.GRASS, MoveCategory.SPECIAL, 80, 90, 15, 20, 0, 9)
      .attr(HitHealAttr)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .triageMove()
      .partial(),
    new AttackMove(Moves.SYRUP_BOMB, Type.GRASS, MoveCategory.SPECIAL, 60, 85, 10, -1, 0, 9)
      .attr(StatChangeAttr, BattleStat.SPD, -1) //Temporary
      .ballBombMove()
      .partial(),
    new AttackMove(Moves.IVY_CUDGEL, Type.GRASS, MoveCategory.PHYSICAL, 100, 100, 10, -1, 0, 9)
      .attr(IvyCudgelTypeAttr)
      .attr(HighCritAttr)
      .makesContact(false),
    new AttackMove(Moves.ELECTRO_SHOT, Type.ELECTRIC, MoveCategory.SPECIAL, 130, 100, 10, 100, 0, 9)
      .attr(ElectroShotChargeAttr)
      .ignoresVirtual(),
    new AttackMove(Moves.TERA_STARSTORM, Type.NORMAL, MoveCategory.SPECIAL, 120, 100, 5, -1, 0, 9)
      .attr(TeraBlastCategoryAttr)
      .partial(),
    new AttackMove(Moves.FICKLE_BEAM, Type.DRAGON, MoveCategory.SPECIAL, 80, 100, 5, 30, 0, 9)
      .attr(PreMoveMessageAttr, doublePowerChanceMessageFunc)
      .attr(DoublePowerChanceAttr),
    new StatusMove(Moves.BURNING_BULWARK, Type.FIRE, -1, 10, 100, 4, 9)
      .attr(ProtectAttr, BattlerTagType.BURNING_BULWARK),
    new AttackMove(Moves.THUNDERCLAP, Type.ELECTRIC, MoveCategory.SPECIAL, 70, 100, 5, -1, 1, 9)
      .condition((user, target, move) => user.scene.currentBattle.turnCommands[target.getBattlerIndex()].command === Command.FIGHT && !target.turnData.acted && allMoves[user.scene.currentBattle.turnCommands[target.getBattlerIndex()].move.move].category !== MoveCategory.STATUS),
    new AttackMove(Moves.MIGHTY_CLEAVE, Type.ROCK, MoveCategory.PHYSICAL, 95, 100, 5, -1, 0, 9)
      .ignoresProtect(),
    new AttackMove(Moves.TACHYON_CUTTER, Type.STEEL, MoveCategory.SPECIAL, 50, -1, 10, -1, 0, 9)
      .attr(MultiHitAttr, MultiHitType._2)
      .slicingMove(),
    new AttackMove(Moves.HARD_PRESS, Type.STEEL, MoveCategory.PHYSICAL, 100, 100, 5, -1, 0, 9)
      .attr(OpponentHighHpPowerAttr),
    new StatusMove(Moves.DRAGON_CHEER, Type.DRAGON, -1, 15, 100, 0, 9)
      .attr(AddBattlerTagAttr, BattlerTagType.CRIT_BOOST, false, true)
      .target(MoveTarget.NEAR_ALLY)
      .partial(),
    new AttackMove(Moves.ALLURING_VOICE, Type.FAIRY, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 9)
      .partial(),
    new AttackMove(Moves.TEMPER_FLARE, Type.FIRE, MoveCategory.PHYSICAL, 75, 100, 10, -1, 0, 9)
      .attr(MovePowerMultiplierAttr, (user, target, move) => user.getLastXMoves(2)[1]?.result == MoveResult.MISS || user.getLastXMoves(2)[1]?.result == MoveResult.FAIL ? 2 : 1),
    new AttackMove(Moves.SUPERCELL_SLAM, Type.ELECTRIC, MoveCategory.PHYSICAL, 100, 95, 15, -1, 0, 9)
      .attr(MissEffectAttr, crashDamageFunc)
      .attr(NoEffectAttr, crashDamageFunc),
    new AttackMove(Moves.PSYCHIC_NOISE, Type.PSYCHIC, MoveCategory.SPECIAL, 75, 100, 10, -1, 0, 9)
      .soundBased()
      .partial(),
    new AttackMove(Moves.UPPER_HAND, Type.FIGHTING, MoveCategory.PHYSICAL, 65, 100, 15, -1, 3, 9)
      .partial(),
    new AttackMove(Moves.MALIGNANT_CHAIN, Type.POISON, MoveCategory.SPECIAL, 100, 100, 5, 50, 0, 9)
      .attr(StatusEffectAttr, StatusEffect.TOXIC)
  );
} 
