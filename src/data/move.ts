import { ChargeAnim, MoveChargeAnim, initMoveAnim, loadMoveAnimAssets } from "./battle-anims";
import { EncoreTag, GulpMissileTag, HelpingHandTag, SemiInvulnerableTag, ShellTrapTag, StockpilingTag, TrappedTag, TypeBoostTag } from "./battler-tags";
import { getPokemonNameWithAffix } from "../messages";
import Pokemon, { AttackMoveResult, EnemyPokemon, HitResult, MoveResult, PlayerPokemon, PokemonMove, TurnMove } from "../field/pokemon";
import { StatusEffect, getStatusEffectHealText, isNonVolatileStatusEffect, getNonVolatileStatusEffects } from "./status-effect";
import { getTypeDamageMultiplier, Type } from "./type";
import { Constructor } from "#app/utils";
import * as Utils from "../utils";
import { WeatherType } from "./weather";
import { ArenaTagSide, ArenaTrapTag, WeakenMoveTypeTag } from "./arena-tag";
import { UnswappableAbilityAbAttr, UncopiableAbilityAbAttr, UnsuppressableAbilityAbAttr, BlockRecoilDamageAttr, BlockOneHitKOAbAttr, IgnoreContactAbAttr, MaxMultiHitAbAttr, applyAbAttrs, BlockNonDirectDamageAbAttr, MoveAbilityBypassAbAttr, ReverseDrainAbAttr, FieldPreventExplosiveMovesAbAttr, ForceSwitchOutImmunityAbAttr, BlockItemTheftAbAttr, applyPostAttackAbAttrs, ConfusionOnStatusEffectAbAttr, HealFromBerryUseAbAttr, IgnoreProtectOnContactAbAttr, IgnoreMoveEffectsAbAttr, applyPreDefendAbAttrs, MoveEffectChanceMultiplierAbAttr, WonderSkinAbAttr, applyPreAttackAbAttrs, MoveTypeChangeAbAttr, UserFieldMoveTypePowerBoostAbAttr, FieldMoveTypePowerBoostAbAttr, AllyMoveCategoryPowerBoostAbAttr, VariableMovePowerAbAttr } from "./ability";
import { allAbilities } from "./ability";
import { PokemonHeldItemModifier, BerryModifier, PreserveBerryModifier, PokemonMoveAccuracyBoosterModifier, AttackTypeBoosterModifier, PokemonMultiHitModifier } from "../modifier/modifier";
import { BattlerIndex, BattleType } from "../battle";
import { TerrainType } from "./terrain";
import { ModifierPoolType } from "#app/modifier/modifier-type";
import { Command } from "../ui/command-ui-handler";
import i18next from "i18next";
import { Localizable } from "#app/interfaces/locales";
import { getBerryEffectFunc } from "./berry";
import { Abilities } from "#enums/abilities";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Biome } from "#enums/biome";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { MoveUsedEvent } from "#app/events/battle-scene";
import { Stat, type BattleStat, type EffectiveStat, BATTLE_STATS, EFFECTIVE_STATS, getStatKey } from "#app/enums/stat";
import { PartyStatusCurePhase } from "#app/phases/party-status-cure-phase";
import { BattleEndPhase } from "#app/phases/battle-end-phase";
import { MoveEndPhase } from "#app/phases/move-end-phase";
import { MovePhase } from "#app/phases/move-phase";
import { NewBattlePhase } from "#app/phases/new-battle-phase";
import { PokemonHealPhase } from "#app/phases/pokemon-heal-phase";
import { StatStageChangePhase } from "#app/phases/stat-stage-change-phase";
import { SwitchPhase } from "#app/phases/switch-phase";
import { SwitchSummonPhase } from "#app/phases/switch-summon-phase";
import { SpeciesFormChangeRevertWeatherFormTrigger } from "./pokemon-forms";
import { NumberHolder } from "#app/utils";
import { GameMode } from "#app/game-mode";
import { applyChallenges, ChallengeType } from "./challenge";

export enum MoveCategory {
  PHYSICAL,
  SPECIAL,
  STATUS
}

export enum MoveTarget {
  /** {@link https://bulbapedia.bulbagarden.net/wiki/Category:Moves_that_target_the_user Moves that target the User} */
  USER,
  OTHER,
  ALL_OTHERS,
  NEAR_OTHER,
  /** {@link https://bulbapedia.bulbagarden.net/wiki/Category:Moves_that_target_all_adjacent_Pok%C3%A9mon Moves that target all adjacent Pokemon} */
  ALL_NEAR_OTHERS,
  NEAR_ENEMY,
  /** {@link https://bulbapedia.bulbagarden.net/wiki/Category:Moves_that_target_all_adjacent_foes Moves that target all adjacent foes} */
  ALL_NEAR_ENEMIES,
  RANDOM_NEAR_ENEMY,
  ALL_ENEMIES,
  /** {@link https://bulbapedia.bulbagarden.net/wiki/Category:Counterattacks Counterattacks} */
  ATTACKER,
  /** {@link https://bulbapedia.bulbagarden.net/wiki/Category:Moves_that_target_one_adjacent_ally Moves that target one adjacent ally} */
  NEAR_ALLY,
  ALLY,
  USER_OR_NEAR_ALLY,
  USER_AND_ALLIES,
  /** {@link https://bulbapedia.bulbagarden.net/wiki/Category:Moves_that_target_all_Pok%C3%A9mon Moves that target all Pokemon} */
  ALL,
  USER_SIDE,
  /** {@link https://bulbapedia.bulbagarden.net/wiki/Category:Entry_hazard-creating_moves Entry hazard-creating moves} */
  ENEMY_SIDE,
  BOTH_SIDES,
  PARTY,
  CURSE
}

export enum MoveFlags {
  NONE              = 0,
  MAKES_CONTACT     = 1 << 0,
  IGNORE_PROTECT    = 1 << 1,
  IGNORE_VIRTUAL    = 1 << 2,
  SOUND_BASED       = 1 << 3,
  HIDE_USER         = 1 << 4,
  HIDE_TARGET       = 1 << 5,
  BITING_MOVE       = 1 << 6,
  PULSE_MOVE        = 1 << 7,
  PUNCHING_MOVE     = 1 << 8,
  SLICING_MOVE      = 1 << 9,
  /**
   * Indicates a move should be affected by {@linkcode Abilities.RECKLESS}
   * @see {@linkcode Move.recklessMove()}
   */
  RECKLESS_MOVE     = 1 << 10,
  BALLBOMB_MOVE     = 1 << 11,
  POWDER_MOVE       = 1 << 12,
  DANCE_MOVE        = 1 << 13,
  WIND_MOVE         = 1 << 14,
  TRIAGE_MOVE       = 1 << 15,
  IGNORE_ABILITIES  = 1 << 16,
  /**
   * Enables all hits of a multi-hit move to be accuracy checked individually
   */
  CHECK_ALL_HITS   = 1 << 17,
  /**
   * Indicates a move is able to be redirected to allies in a double battle if the attacker faints
   */
  REDIRECT_COUNTER = 1 << 18,
}

type MoveConditionFunc = (user: Pokemon, target: Pokemon, move: Move) => boolean;
type UserMoveConditionFunc = (user: Pokemon, move: Move) => boolean;

export default class Move implements Localizable {
  public id: Moves;
  public name: string;
  private _type: Type;
  private _category: MoveCategory;
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

    this.nameAppend = "";
    this._type = type;
    this._category = category;
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
    if (defaultMoveTarget === MoveTarget.USER) {
      this.setFlag(MoveFlags.IGNORE_PROTECT, true);
    }
    if (category === MoveCategory.PHYSICAL) {
      this.setFlag(MoveFlags.MAKES_CONTACT, true);
    }

    this.localize();
  }

  get type() {
    return this._type;
  }
  get category() {
    return this._category;
  }

  localize(): void {
    const i18nKey = Moves[this.id].split("_").filter(f => f).map((f, i) => i ? `${f[0]}${f.slice(1).toLowerCase()}` : f.toLowerCase()).join("") as unknown as string;

    this.name = this.id ? `${i18next.t(`move:${i18nKey}.name`)}${this.nameAppend}` : "";
    this.effect = this.id ? `${i18next.t(`move:${i18nKey}.effect`)}${this.nameAppend}` : "";
  }

  /**
   * Get all move attributes that match `attrType`
   * @param attrType any attribute that extends {@linkcode MoveAttr}
   * @returns Array of attributes that match `attrType`, Empty Array if none match.
   */
  getAttrs<T extends MoveAttr>(attrType: Constructor<T>): T[] {
    return this.attrs.filter((a): a is T => a instanceof attrType);
  }

  /**
   * Check if a move has an attribute that matches `attrType`
   * @param attrType any attribute that extends {@linkcode MoveAttr}
   * @returns true if the move has attribute `attrType`
   */
  hasAttr<T extends MoveAttr>(attrType: Constructor<T>): boolean {
    return this.attrs.some((attr) => attr instanceof attrType);
  }

  /**
   * Takes as input a boolean function and returns the first MoveAttr in attrs that matches true
   * @param attrPredicate
   * @returns the first {@linkcode MoveAttr} element in attrs that makes the input function return true
   */
  findAttr(attrPredicate: (attr: MoveAttr) => boolean): MoveAttr {
    return this.attrs.find(attrPredicate)!; // TODO: is the bang correct?
  }

  /**
   * Adds a new MoveAttr to the move (appends to the attr array)
   * if the MoveAttr also comes with a condition, also adds that to the conditions array: {@linkcode MoveCondition}
   * @param AttrType {@linkcode MoveAttr} the constructor of a MoveAttr class
   * @param args the args needed to instantiate a the given class
   * @returns the called object {@linkcode Move}
   */
  attr<T extends Constructor<MoveAttr>>(AttrType: T, ...args: ConstructorParameters<T>): this {
    const attr = new AttrType(...args);
    this.attrs.push(attr);
    let attrCondition = attr.getCondition();
    if (attrCondition) {
      if (typeof attrCondition === "function") {
        attrCondition = new MoveCondition(attrCondition);
      }
      this.conditions.push(attrCondition);
    }

    return this;
  }

  /**
   * Adds a new MoveAttr to the move (appends to the attr array)
   * if the MoveAttr also comes with a condition, also adds that to the conditions array: {@linkcode MoveCondition}
   * Almost identical to {@link attr}, except you are passing in a MoveAttr object, instead of a constructor and it's arguments
   * @param attrAdd {@linkcode MoveAttr} the attribute to add
   * @returns the called object {@linkcode Move}
   */
  addAttr(attrAdd: MoveAttr): this {
    this.attrs.push(attrAdd);
    let attrCondition = attrAdd.getCondition();
    if (attrCondition) {
      if (typeof attrCondition === "function") {
        attrCondition = new MoveCondition(attrCondition);
      }
      this.conditions.push(attrCondition);
    }

    return this;
  }

  /**
   * Sets the move target of this move
   * @param moveTarget {@linkcode MoveTarget} the move target to set
   * @returns the called object {@linkcode Move}
   */
  target(moveTarget: MoveTarget): this {
    this.moveTarget = moveTarget;
    return this;
  }

  /**
   * Getter function that returns if this Move has a MoveFlag
   * @param flag {@linkcode MoveFlags} to check
   * @returns boolean
   */
  hasFlag(flag: MoveFlags): boolean {
    // internally it is taking the bitwise AND (MoveFlags are represented as bit-shifts) and returning False if result is 0 and true otherwise
    return !!(this.flags & flag);
  }

  /**
   * Getter function that returns if the move hits multiple targets
   * @returns boolean
   */
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

  /**
   * Getter function that returns if the move targets itself or an ally
   * @returns boolean
   */

  isAllyTarget(): boolean {
    switch (this.moveTarget) {
    case MoveTarget.USER:
    case MoveTarget.NEAR_ALLY:
    case MoveTarget.ALLY:
    case MoveTarget.USER_OR_NEAR_ALLY:
    case MoveTarget.USER_AND_ALLIES:
    case MoveTarget.USER_SIDE:
      return true;
    }
    return false;
  }

  /**
   * Checks if the move is immune to certain types.
   * Currently looks at cases of Grass types with powder moves and Dark types with moves affected by Prankster.
   * @param {Pokemon} user the source of this move
   * @param {Pokemon} target the target of this move
   * @param {Type} type the type of the move's target
   * @returns boolean
   */
  isTypeImmune(user: Pokemon, target: Pokemon, type: Type): boolean {
    if (this.moveTarget === MoveTarget.USER) {
      return false;
    }

    switch (type) {
    case Type.GRASS:
      if (this.hasFlag(MoveFlags.POWDER_MOVE)) {
        return true;
      }
      break;
    case Type.DARK:
      if (user.hasAbility(Abilities.PRANKSTER) && this.category === MoveCategory.STATUS && (user.isPlayer() !== target.isPlayer())) {
        return true;
      }
      break;
    }
    return false;
  }

  /**
   * Adds a move condition to the move
   * @param condition {@linkcode MoveCondition} or {@linkcode MoveConditionFunc}, appends to conditions array a new MoveCondition object
   * @returns the called object {@linkcode Move}
   */
  condition(condition: MoveCondition | MoveConditionFunc): this {
    if (typeof condition === "function") {
      condition = new MoveCondition(condition as MoveConditionFunc);
    }
    this.conditions.push(condition);

    return this;
  }

  /**
   * Marks the move as "partial": appends texts to the move name
   * @returns the called object {@linkcode Move}
   */
  partial(): this {
    this.nameAppend += " (P)";
    return this;
  }

  /**
   * Marks the move as "unimplemented": appends texts to the move name
   * @returns the called object {@linkcode Move}
   */
  unimplemented(): this {
    this.nameAppend += " (N)";
    return this;
  }

  /**
   * Sets the flags of the move
   * @param flag {@linkcode MoveFlags}
   * @param on a boolean, if True, then "ORs" the flag onto existing ones, if False then "XORs" the flag onto existing ones
   */
  private setFlag(flag: MoveFlags, on: boolean): void {
    // bitwise OR and bitwise XOR respectively
    if (on) {
      this.flags |= flag;
    } else {
      this.flags ^= flag;
    }
  }

  /**
   * Sets the {@linkcode MoveFlags.MAKES_CONTACT} flag for the calling Move
   * @param makesContact The value (boolean) to set the flag to
   * @returns The {@linkcode Move} that called this function
   */
  makesContact(makesContact: boolean = true): this { // TODO: is true the correct default?
    this.setFlag(MoveFlags.MAKES_CONTACT, makesContact);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.IGNORE_PROTECT} flag for the calling Move
   * @param ignoresProtect The value (boolean) to set the flag to
   * example: @see {@linkcode Moves.CURSE}
   * @returns The {@linkcode Move} that called this function
   */
  ignoresProtect(ignoresProtect: boolean = true): this { // TODO: is `true` the correct default?
    this.setFlag(MoveFlags.IGNORE_PROTECT, ignoresProtect);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.IGNORE_VIRTUAL} flag for the calling Move
   * @param ignoresVirtual The value (boolean) to set the flag to
   * example: @see {@linkcode Moves.NATURE_POWER}
   * @returns The {@linkcode Move} that called this function
   */
  ignoresVirtual(ignoresVirtual: boolean = true): this { // TODO: is `true` the correct default?
    this.setFlag(MoveFlags.IGNORE_VIRTUAL, ignoresVirtual);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.SOUND_BASED} flag for the calling Move
   * @param soundBased The value (boolean) to set the flag to
   * example: @see {@linkcode Moves.UPROAR}
   * @returns The {@linkcode Move} that called this function
   */
  soundBased(soundBased: boolean = true): this { // TODO: is `true` the correct default?
    this.setFlag(MoveFlags.SOUND_BASED, soundBased);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.HIDE_USER} flag for the calling Move
   * @param hidesUser The value (boolean) to set the flag to
   * example: @see {@linkcode Moves.TELEPORT}
   * @returns The {@linkcode Move} that called this function
   */
  hidesUser(hidesUser: boolean = true): this { // TODO: is `true` the correct default?
    this.setFlag(MoveFlags.HIDE_USER, hidesUser);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.HIDE_TARGET} flag for the calling Move
   * @param hidesTarget The value (boolean) to set the flag to
   * example: @see {@linkcode Moves.WHIRLWIND}
   * @returns The {@linkcode Move} that called this function
   */
  hidesTarget(hidesTarget: boolean = true): this { // TODO: is `true` the correct default?
    this.setFlag(MoveFlags.HIDE_TARGET, hidesTarget);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.BITING_MOVE} flag for the calling Move
   * @param bitingMove The value (boolean) to set the flag to
   * example: @see {@linkcode Moves.BITE}
   * @returns The {@linkcode Move} that called this function
   */
  bitingMove(bitingMove: boolean = true): this { // TODO: is `true` the correct default?
    this.setFlag(MoveFlags.BITING_MOVE, bitingMove);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.PULSE_MOVE} flag for the calling Move
   * @param pulseMove The value (boolean) to set the flag to
   * example: @see {@linkcode Moves.WATER_PULSE}
   * @returns The {@linkcode Move} that called this function
   */
  pulseMove(pulseMove: boolean = true): this { // TODO: is `true` the correct default?
    this.setFlag(MoveFlags.PULSE_MOVE, pulseMove);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.PUNCHING_MOVE} flag for the calling Move
   * @param punchingMove The value (boolean) to set the flag to
   * example: @see {@linkcode Moves.DRAIN_PUNCH}
   * @returns The {@linkcode Move} that called this function
   */
  punchingMove(punchingMove: boolean = true): this { // TODO: is `true` the correct default?
    this.setFlag(MoveFlags.PUNCHING_MOVE, punchingMove);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.SLICING_MOVE} flag for the calling Move
   * @param slicingMove The value (boolean) to set the flag to
   * example: @see {@linkcode Moves.X_SCISSOR}
   * @returns The {@linkcode Move} that called this function
   */
  slicingMove(slicingMove: boolean = true): this { // TODO: is `true` the correct default?
    this.setFlag(MoveFlags.SLICING_MOVE, slicingMove);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.RECKLESS_MOVE} flag for the calling Move
   * @see {@linkcode Abilities.RECKLESS}
   * @param recklessMove The value to set the flag to
   * @returns The {@linkcode Move} that called this function
   */
  recklessMove(recklessMove: boolean = true): this { // TODO: is `true` the correct default?
    this.setFlag(MoveFlags.RECKLESS_MOVE, recklessMove);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.BALLBOMB_MOVE} flag for the calling Move
   * @param ballBombMove The value (boolean) to set the flag to
   * example: @see {@linkcode Moves.ELECTRO_BALL}
   * @returns The {@linkcode Move} that called this function
   */
  ballBombMove(ballBombMove: boolean = true): this { // TODO: is `true` the correct default?
    this.setFlag(MoveFlags.BALLBOMB_MOVE, ballBombMove);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.POWDER_MOVE} flag for the calling Move
   * @param powderMove The value (boolean) to set the flag to
   * example: @see {@linkcode Moves.STUN_SPORE}
   * @returns The {@linkcode Move} that called this function
   */
  powderMove(powderMove: boolean = true): this { // TODO: is `true` the correct default?
    this.setFlag(MoveFlags.POWDER_MOVE, powderMove);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.DANCE_MOVE} flag for the calling Move
   * @param danceMove The value (boolean) to set the flag to
   * example: @see {@linkcode Moves.PETAL_DANCE}
   * @returns The {@linkcode Move} that called this function
   */
  danceMove(danceMove: boolean = true): this { // TODO: is `true` the correct default?
    this.setFlag(MoveFlags.DANCE_MOVE, danceMove);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.WIND_MOVE} flag for the calling Move
   * @param windMove The value (boolean) to set the flag to
   * example: @see {@linkcode Moves.HURRICANE}
   * @returns The {@linkcode Move} that called this function
   */
  windMove(windMove: boolean = true): this { // TODO: is `true` the correct default?
    this.setFlag(MoveFlags.WIND_MOVE, windMove);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.TRIAGE_MOVE} flag for the calling Move
   * @param triageMove The value (boolean) to set the flag to
   * example: @see {@linkcode Moves.ABSORB}
   * @returns The {@linkcode Move} that called this function
   */
  triageMove(triageMove: boolean = true): this { // TODO: is `true` the correct default?
    this.setFlag(MoveFlags.TRIAGE_MOVE, triageMove);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.IGNORE_ABILITIES} flag for the calling Move
   * @param ignoresAbilities sThe value (boolean) to set the flag to
   * example: @see {@linkcode Moves.SUNSTEEL_STRIKE}
   * @returns The {@linkcode Move} that called this function
   */
  ignoresAbilities(ignoresAbilities: boolean = true): this { // TODO: is `true` the correct default?
    this.setFlag(MoveFlags.IGNORE_ABILITIES, ignoresAbilities);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.CHECK_ALL_HITS} flag for the calling Move
   * @param checkAllHits The value (boolean) to set the flag to
   * example: @see {@linkcode Moves.TRIPLE_AXEL}
   * @returns The {@linkcode Move} that called this function
   */
  checkAllHits(checkAllHits: boolean = true): this { // TODO: is `true` the correct default?
    this.setFlag(MoveFlags.CHECK_ALL_HITS, checkAllHits);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.REDIRECT_COUNTER} flag for the calling Move
   * @param redirectCounter The value (boolean) to set the flag to
   * example: @see {@linkcode Moves.METAL_BURST}
   * @returns The {@linkcode Move} that called this function
   */
  redirectCounter(redirectCounter: boolean = true): this { // TODO: is `true` the correct default?
    this.setFlag(MoveFlags.REDIRECT_COUNTER, redirectCounter);
    return this;
  }

  /**
   * Checks if the move flag applies to the pokemon(s) using/receiving the move
   * @param flag {@linkcode MoveFlags} MoveFlag to check on user and/or target
   * @param user {@linkcode Pokemon} the Pokemon using the move
   * @param target {@linkcode Pokemon} the Pokemon receiving the move
   * @returns boolean
   */
  checkFlag(flag: MoveFlags, user: Pokemon, target: Pokemon | null): boolean {
    // special cases below, eg: if the move flag is MAKES_CONTACT, and the user pokemon has an ability that ignores contact (like "Long Reach"), then overrides and move does not make contact
    switch (flag) {
    case MoveFlags.MAKES_CONTACT:
      if (user.hasAbilityWithAttr(IgnoreContactAbAttr)) {
        return false;
      }
      break;
    case MoveFlags.IGNORE_ABILITIES:
      if (user.hasAbilityWithAttr(MoveAbilityBypassAbAttr)) {
        const abilityEffectsIgnored = new Utils.BooleanHolder(false);
        applyAbAttrs(MoveAbilityBypassAbAttr, user, abilityEffectsIgnored, false, this);
        if (abilityEffectsIgnored.value) {
          return true;
        }
      }
      break;
    case MoveFlags.IGNORE_PROTECT:
      if (user.hasAbilityWithAttr(IgnoreProtectOnContactAbAttr) &&
          this.checkFlag(MoveFlags.MAKES_CONTACT, user, target)) {
        return true;
      }
      break;
    }

    return !!(this.flags & flag);
  }

  /**
   * Applies each {@linkcode MoveCondition} of this move to the params
   * @param user {@linkcode Pokemon} to apply conditions to
   * @param target {@linkcode Pokemon} to apply conditions to
   * @param move {@linkcode Move} to apply conditions to
   * @returns boolean: false if any of the apply()'s return false, else true
   */
  applyConditions(user: Pokemon, target: Pokemon, move: Move): boolean {
    for (const condition of this.conditions) {
      if (!condition.apply(user, target, move)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Sees if, given the target pokemon, a move fails on it (by looking at each {@linkcode MoveAttr} of this move
   * @param user {@linkcode Pokemon} using the move
   * @param target {@linkcode Pokemon} receiving the move
   * @param move {@linkcode Move} using the move
   * @param cancelled {@linkcode Utils.BooleanHolder} to hold boolean value
   * @returns string of the failed text, or null
   */
  getFailedText(user: Pokemon, target: Pokemon, move: Move, cancelled: Utils.BooleanHolder): string | null {
    for (const attr of this.attrs) {
      const failedText = attr.getFailedText(user, target, move, cancelled);
      if (failedText !== null) {
        return failedText;
      }
    }
    return null;
  }

  /**
   * Calculates the userBenefitScore across all the attributes and conditions
   * @param user {@linkcode Pokemon} using the move
   * @param target {@linkcode Pokemon} receiving the move
   * @param move {@linkcode Move} using the move
   * @returns integer representing the total benefitScore
   */
  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    let score = 0;

    for (const attr of this.attrs) {
      score += attr.getUserBenefitScore(user, target, move);
    }

    for (const condition of this.conditions) {
      score += condition.getUserBenefitScore(user, target, move);
    }

    return score;
  }

  /**
   * Calculates the targetBenefitScore across all the attributes
   * @param user {@linkcode Pokemon} using the move
   * @param target {@linkcode Pokemon} receiving the move
   * @param move {@linkcode Move} using the move
   * @returns integer representing the total benefitScore
   */
  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    let score = 0;

    for (const attr of this.attrs) {
      // conditionals to check if the move is self targeting (if so then you are applying the move to yourself, not the target)
      score += attr.getTargetBenefitScore(user, !attr.selfTarget ? target : user, move) * (target !== user && attr.selfTarget ? -1 : 1);
    }

    return score;
  }

  /**
   * Calculates the accuracy of a move in battle based on various conditions and attributes.
   *
   * @param user {@linkcode Pokemon} The Pokémon using the move.
   * @param target {@linkcode Pokemon} The Pokémon being targeted by the move.
   * @returns The calculated accuracy of the move.
   */
  calculateBattleAccuracy(user: Pokemon, target: Pokemon, simulated: boolean = false) {
    const moveAccuracy = new Utils.NumberHolder(this.accuracy);

    applyMoveAttrs(VariableAccuracyAttr, user, target, this, moveAccuracy);
    applyPreDefendAbAttrs(WonderSkinAbAttr, target, user, this, { value: false }, simulated, moveAccuracy);

    if (moveAccuracy.value === -1) {
      return moveAccuracy.value;
    }

    const isOhko = this.hasAttr(OneHitKOAccuracyAttr);

    if (!isOhko) {
      user.scene.applyModifiers(PokemonMoveAccuracyBoosterModifier, user.isPlayer(), user, moveAccuracy);
    }

    if (user.scene.arena.weather?.weatherType === WeatherType.FOG) {
      /**
       *  The 0.9 multiplier is PokeRogue-only implementation, Bulbapedia uses 3/5
       *  See Fog {@link https://bulbapedia.bulbagarden.net/wiki/Fog}
       */
      moveAccuracy.value = Math.floor(moveAccuracy.value * 0.9);
    }

    if (!isOhko && user.scene.arena.getTag(ArenaTagType.GRAVITY)) {
      moveAccuracy.value = Math.floor(moveAccuracy.value * 1.67);
    }

    return moveAccuracy.value;
  }

  /**
   * Calculates the power of a move in battle based on various conditions and attributes.
   *
   * @param source {@linkcode Pokemon} The Pokémon using the move.
   * @param target {@linkcode Pokemon} The Pokémon being targeted by the move.
   * @returns The calculated power of the move.
   */
  calculateBattlePower(source: Pokemon, target: Pokemon, simulated: boolean = false): number {
    if (this.category === MoveCategory.STATUS) {
      return -1;
    }

    const power = new Utils.NumberHolder(this.power);
    const typeChangeMovePowerMultiplier = new Utils.NumberHolder(1);

    applyPreAttackAbAttrs(MoveTypeChangeAbAttr, source, target, this, true, null, typeChangeMovePowerMultiplier);

    const sourceTeraType = source.getTeraType();
    if (sourceTeraType !== Type.UNKNOWN && sourceTeraType === this.type && power.value < 60 && this.priority <= 0 && !this.hasAttr(MultiHitAttr) && !source.scene.findModifier(m => m instanceof PokemonMultiHitModifier && m.pokemonId === source.id)) {
      power.value = 60;
    }

    applyPreAttackAbAttrs(VariableMovePowerAbAttr, source, target, this, simulated, power);

    if (source.getAlly()) {
      applyPreAttackAbAttrs(AllyMoveCategoryPowerBoostAbAttr, source.getAlly(), target, this, simulated, power);
    }

    const fieldAuras = new Set(
      source.scene.getField(true)
        .map((p) => p.getAbilityAttrs(FieldMoveTypePowerBoostAbAttr).filter(attr => {
          const condition = attr.getCondition();
          return (!condition || condition(p));
        }) as FieldMoveTypePowerBoostAbAttr[])
        .flat(),
    );
    for (const aura of fieldAuras) {
      aura.applyPreAttack(source, null, simulated, target, this, [power]);
    }

    const alliedField: Pokemon[] = source instanceof PlayerPokemon ? source.scene.getPlayerField() : source.scene.getEnemyField();
    alliedField.forEach(p => applyPreAttackAbAttrs(UserFieldMoveTypePowerBoostAbAttr, p, target, this, simulated, power));

    power.value *= typeChangeMovePowerMultiplier.value;

    const typeBoost = source.findTag(t => t instanceof TypeBoostTag && t.boostedType === this.type) as TypeBoostTag;
    if (typeBoost) {
      power.value *= typeBoost.boostValue;
    }

    if (source.scene.arena.getTerrainType() === TerrainType.GRASSY && target.isGrounded() && this.type === Type.GROUND && this.moveTarget === MoveTarget.ALL_NEAR_OTHERS) {
      power.value /= 2;
    }

    applyMoveAttrs(VariablePowerAttr, source, target, this, power);

    source.scene.applyModifiers(PokemonMultiHitModifier, source.isPlayer(), source, new Utils.IntegerHolder(0), power);

    if (!this.hasAttr(TypelessAttr)) {
      source.scene.arena.applyTags(WeakenMoveTypeTag, this.type, power);
      source.scene.applyModifiers(AttackTypeBoosterModifier, source.isPlayer(), source, this.type, power);
    }

    if (source.getTag(HelpingHandTag)) {
      power.value *= 1.5;
    }

    return power.value;
  }
}

export class AttackMove extends Move {
  constructor(id: Moves, type: Type, category: MoveCategory, power: integer, accuracy: integer, pp: integer, chance: integer, priority: integer, generation: integer) {
    super(id, type, category, MoveTarget.NEAR_OTHER, power, accuracy, pp, chance, priority, generation);

    /**
     * {@link https://bulbapedia.bulbagarden.net/wiki/Freeze_(status_condition)}
     * > All damaging Fire-type moves can now thaw a frozen target, regardless of whether or not they have a chance to burn;
     */
    if (this.type === Type.FIRE) {
      this.addAttr(new HealStatusEffectAttr(false, StatusEffect.FREEZE));
    }
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    let ret = super.getTargetBenefitScore(user, target, move);

    let attackScore = 0;

    const effectiveness = target.getAttackTypeEffectiveness(this.type, user);
    attackScore = Math.pow(effectiveness - 1, 2) * effectiveness < 1 ? -2 : 2;
    if (attackScore) {
      if (this.category === MoveCategory.PHYSICAL) {
        const atk = new Utils.IntegerHolder(user.getEffectiveStat(Stat.ATK, target));
        applyMoveAttrs(VariableAtkAttr, user, target, move, atk);
        if (atk.value > user.getEffectiveStat(Stat.SPATK, target)) {
          const statRatio = user.getEffectiveStat(Stat.SPATK, target) / atk.value;
          if (statRatio <= 0.75) {
            attackScore *= 2;
          } else if (statRatio <= 0.875) {
            attackScore *= 1.5;
          }
        }
      } else {
        const spAtk = new Utils.IntegerHolder(user.getEffectiveStat(Stat.SPATK, target));
        applyMoveAttrs(VariableAtkAttr, user, target, move, spAtk);
        if (spAtk.value > user.getEffectiveStat(Stat.ATK, target)) {
          const statRatio = user.getEffectiveStat(Stat.ATK, target) / spAtk.value;
          if (statRatio <= 0.75) {
            attackScore *= 2;
          } else if (statRatio <= 0.875) {
            attackScore *= 1.5;
          }
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

/**
 * Base class defining all {@linkcode Move} Attributes
 * @abstract
 * @see {@linkcode apply}
 */
export abstract class MoveAttr {
  /** Should this {@linkcode Move} target the user? */
  public selfTarget: boolean;

  constructor(selfTarget: boolean = false) {
    this.selfTarget = selfTarget;
  }

  /**
   * Applies move attributes
   * @see {@linkcode applyMoveAttrsInternal}
   * @virtual
   * @param user {@linkcode Pokemon} using the move
   * @param target {@linkcode Pokemon} target of the move
   * @param move {@linkcode Move} with this attribute
   * @param args Set of unique arguments needed by this attribute
   * @returns true if application of the ability succeeds
   */
  apply(user: Pokemon | null, target: Pokemon | null, move: Move, args: any[]): boolean | Promise<boolean> {
    return true;
  }

  /**
   * @virtual
   * @returns the {@linkcode MoveCondition} or {@linkcode MoveConditionFunc} for this {@linkcode Move}
   */
  getCondition(): MoveCondition | MoveConditionFunc | null {
    return null;
  }

  /**
   * @virtual
   * @param user {@linkcode Pokemon} using the move
   * @param target {@linkcode Pokemon} target of the move
   * @param move {@linkcode Move} with this attribute
   * @param cancelled {@linkcode Utils.BooleanHolder} which stores if the move should fail
   * @returns the string representing failure of this {@linkcode Move}
   */
  getFailedText(user: Pokemon, target: Pokemon, move: Move, cancelled: Utils.BooleanHolder): string | null {
    return null;
  }

  /**
   * Used by the Enemy AI to rank an attack based on a given user
   * @see {@linkcode EnemyPokemon.getNextMove}
   * @virtual
   */
  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    return 0;
  }

  /**
   * Used by the Enemy AI to rank an attack based on a given target
   * @see {@linkcode EnemyPokemon.getNextMove}
   * @virtual
   */
  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    return 0;
  }
}

export enum MoveEffectTrigger {
  PRE_APPLY,
  POST_APPLY,
  HIT,
  /** Triggers one time after all target effects have applied */
  POST_TARGET,
}

/** Base class defining all Move Effect Attributes
 * @extends MoveAttr
 * @see {@linkcode apply}
 */
export class MoveEffectAttr extends MoveAttr {
  /** Defines when this effect should trigger in the move's effect order
   * @see {@linkcode phases.MoveEffectPhase.start}
   */
  public trigger: MoveEffectTrigger;
  /** Should this effect only apply on the first hit? */
  public firstHitOnly: boolean;
  /** Should this effect only apply on the last hit? */
  public lastHitOnly: boolean;
  /** Should this effect only apply on the first target hit? */
  public firstTargetOnly: boolean;

  constructor(selfTarget?: boolean, trigger?: MoveEffectTrigger, firstHitOnly: boolean = false, lastHitOnly: boolean = false, firstTargetOnly: boolean = false) {
    super(selfTarget);
    this.trigger = trigger !== undefined ? trigger : MoveEffectTrigger.POST_APPLY;
    this.firstHitOnly = firstHitOnly;
    this.lastHitOnly = lastHitOnly;
    this.firstTargetOnly = firstTargetOnly;
  }

  /**
   * Determines whether the {@linkcode Move}'s effects are valid to {@linkcode apply}
   * @virtual
   * @param user {@linkcode Pokemon} using the move
   * @param target {@linkcode Pokemon} target of the move
   * @param move {@linkcode Move} with this attribute
   * @param args Set of unique arguments needed by this attribute
   * @returns true if basic application of the ability attribute should be possible
   */
  canApply(user: Pokemon, target: Pokemon, move: Move, args?: any[]) {
    return !! (this.selfTarget ? user.hp && !user.getTag(BattlerTagType.FRENZY) : target.hp)
           && (this.selfTarget || !target.getTag(BattlerTagType.PROTECTED) ||
                move.checkFlag(MoveFlags.IGNORE_PROTECT, user, target));
  }

  /** Applies move effects so long as they are able based on {@linkcode canApply} */
  apply(user: Pokemon, target: Pokemon, move: Move, args?: any[]): boolean | Promise<boolean> {
    return this.canApply(user, target, move, args);
  }

  /**
   * Gets the used move's additional effect chance.
   * If user's ability has MoveEffectChanceMultiplierAbAttr or IgnoreMoveEffectsAbAttr modifies the base chance.
   * @param user {@linkcode Pokemon} using this move
   * @param target {@linkcode Pokemon} target of this move
   * @param move {@linkcode Move} being used
   * @param selfEffect {@linkcode Boolean} if move targets user.
   * @returns Move chance value.
   */
  getMoveChance(user: Pokemon, target: Pokemon, move: Move, selfEffect?: Boolean, showAbility?: Boolean): integer {
    const moveChance = new Utils.NumberHolder(move.chance);
    applyAbAttrs(MoveEffectChanceMultiplierAbAttr, user, null, false, moveChance, move, target, selfEffect, showAbility);
    if (!selfEffect) {
      applyPreDefendAbAttrs(IgnoreMoveEffectsAbAttr, target, user, null, null, false, moveChance);
    }
    return moveChance.value;
  }
}

/**
 * Base class defining all Move Header attributes.
 * Move Header effects apply at the beginning of a turn before any moves are resolved.
 * They can be used to apply effects to the field (e.g. queueing a message) or to the user
 * (e.g. adding a battler tag).
 */
export class MoveHeaderAttr extends MoveAttr {
  constructor() {
    super(true);
  }
}

/**
 * Header attribute to queue a message at the beginning of a turn.
 * @see {@link MoveHeaderAttr}
 */
export class MessageHeaderAttr extends MoveHeaderAttr {
  private message: string | ((user: Pokemon, move: Move) => string);

  constructor(message: string | ((user: Pokemon, move: Move) => string)) {
    super();
    this.message = message;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const message = typeof this.message === "string"
      ? this.message
      : this.message(user, move);

    if (message) {
      user.scene.queueMessage(message);
      return true;
    }
    return false;
  }
}

/**
 * Header attribute to add a battler tag to the user at the beginning of a turn.
 * @see {@linkcode MoveHeaderAttr}
 */
export class AddBattlerTagHeaderAttr extends MoveHeaderAttr {
  private tagType: BattlerTagType;

  constructor(tagType: BattlerTagType) {
    super();
    this.tagType = tagType;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    user.addTag(this.tagType);
    return true;
  }
}

/**
 * Header attribute to implement the "charge phase" of Beak Blast at the
 * beginning of a turn.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Beak_Blast_(move) | Beak Blast}
 * @see {@linkcode BeakBlastChargingTag}
 */
export class BeakBlastHeaderAttr extends AddBattlerTagHeaderAttr {
  /** Required to initialize Beak Blast's charge animation correctly */
  public chargeAnim = ChargeAnim.BEAK_BLAST_CHARGING;

  constructor() {
    super(BattlerTagType.BEAK_BLAST_CHARGING);
  }
}

export class PreMoveMessageAttr extends MoveAttr {
  private message: string | ((user: Pokemon, target: Pokemon, move: Move) => string);

  constructor(message: string | ((user: Pokemon, target: Pokemon, move: Move) => string)) {
    super();
    this.message = message;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const message = typeof this.message === "string"
      ? this.message as string
      : this.message(user, target, move);
    if (message) {
      user.scene.queueMessage(message, 500);
      return true;
    }
    return false;
  }
}

/**
 * Attribute for Status moves that take attack type effectiveness
 * into consideration (i.e. {@linkcode https://bulbapedia.bulbagarden.net/wiki/Thunder_Wave_(move) | Thunder Wave})
 * @extends MoveAttr
 */
export class RespectAttackTypeImmunityAttr extends MoveAttr { }

export class IgnoreOpponentStatStagesAttr extends MoveAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    (args[0] as Utils.BooleanHolder).value = true;

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
    (args[0] as Utils.IntegerHolder).value = Utils.toDmgValue(target.hp / 2);

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
    (args[0] as Utils.IntegerHolder).value = Utils.toDmgValue(damage * this.multiplier);

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
    return Utils.toDmgValue(user.level * (user.randSeedIntRange(50, 150) * 0.01));
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
    super(true, MoveEffectTrigger.POST_APPLY, false, true);

    this.useHp = useHp;
    this.damageRatio = damageRatio;
    this.unblockable = unblockable;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const cancelled = new Utils.BooleanHolder(false);
    if (!this.unblockable) {
      applyAbAttrs(BlockRecoilDamageAttr, user, cancelled);
      applyAbAttrs(BlockNonDirectDamageAbAttr, user, cancelled);
    }

    if (cancelled.value) {
      return false;
    }

    const damageValue = (!this.useHp ? user.turnData.damageDealt : user.getMaxHp()) * this.damageRatio;
    const minValue = user.turnData.damageDealt ? 1 : 0;
    const recoilDamage = Utils.toDmgValue(damageValue, minValue);
    if (!recoilDamage) {
      return false;
    }

    if (cancelled.value) {
      return false;
    }

    user.damageAndUpdate(recoilDamage, HitResult.OTHER, false, true, true);
    user.scene.queueMessage(i18next.t("moveTriggers:hitWithRecoil", {pokemonName: getPokemonNameWithAffix(user)}));
    user.turnData.damageTaken += recoilDamage;

    return true;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    return Math.floor((move.power / 5) / -4);
  }
}


/**
 * Attribute used for moves which self KO the user regardless if the move hits a target
 * @extends MoveEffectAttr
 * @see {@linkcode apply}
 **/
export class SacrificialAttr extends MoveEffectAttr {
  constructor() {
    super(true, MoveEffectTrigger.POST_TARGET);
  }

  /**
   * Deals damage to the user equal to their current hp
   * @param user {@linkcode Pokemon} that used the move
   * @param target {@linkcode Pokemon} target of the move
   * @param move {@linkcode Move} with this attribute
   * @param args N/A
   * @returns true if the function succeeds
   **/
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    user.damageAndUpdate(user.hp, HitResult.OTHER, false, true, true);
	  user.turnData.damageTaken += user.hp;

    return true;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    if (user.isBoss()) {
      return -20;
    }
    return Math.ceil(((1 - user.getHpRatio()) * 10 - 10) * (target.getAttackTypeEffectiveness(move.type, user) - 0.5));
  }
}

/**
 * Attribute used for moves which self KO the user but only if the move hits a target
 * @extends MoveEffectAttr
 * @see {@linkcode apply}
 **/
export class SacrificialAttrOnHit extends MoveEffectAttr {
  constructor() {
    super(true, MoveEffectTrigger.HIT);
  }

  /**
   * Deals damage to the user equal to their current hp if the move lands
   * @param user {@linkcode Pokemon} that used the move
   * @param target {@linkcode Pokemon} target of the move
   * @param move {@linkcode Move} with this attribute
   * @param args N/A
   * @returns true if the function succeeds
   **/
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    // If the move fails to hit a target, then the user does not faint and the function returns false
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    user.damageAndUpdate(user.hp, HitResult.OTHER, false, true, true);
    user.turnData.damageTaken += user.hp;

    return true;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    if (user.isBoss()) {
      return -20;
    }
    return Math.ceil(((1 - user.getHpRatio()) * 10 - 10) * (target.getAttackTypeEffectiveness(move.type, user) - 0.5));
  }
}

/**
 * Attribute used for moves which cut the user's Max HP in half.
 * Triggers using {@linkcode MoveEffectTrigger.POST_TARGET}.
 * @extends MoveEffectAttr
 * @see {@linkcode apply}
 */
export class HalfSacrificialAttr extends MoveEffectAttr {
  constructor() {
    super(true, MoveEffectTrigger.POST_TARGET);
  }

  /**
   * Cut's the user's Max HP in half and displays the appropriate recoil message
   * @param user {@linkcode Pokemon} that used the move
   * @param target N/A
   * @param move {@linkcode Move} with this attribute
   * @param args N/A
   * @returns true if the function succeeds
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const cancelled = new Utils.BooleanHolder(false);
    // Check to see if the Pokemon has an ability that blocks non-direct damage
    applyAbAttrs(BlockNonDirectDamageAbAttr, user, cancelled);
    if (!cancelled.value) {
      user.damageAndUpdate(Utils.toDmgValue(user.getMaxHp()/2), HitResult.OTHER, false, true, true);
      user.scene.queueMessage(i18next.t("moveTriggers:cutHpPowerUpMove", {pokemonName: getPokemonNameWithAffix(user)})); // Queue recoil message
    }
    return true;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    if (user.isBoss()) {
      return -10;
    }
    return Math.ceil(((1 - user.getHpRatio()/2) * 10 - 10) * (target.getAttackTypeEffectiveness(move.type, user) - 0.5));
  }
}

export enum MultiHitType {
  _2,
  _2_TO_5,
  _3,
  _10,
  BEAT_UP,
}

/**
 * Heals the user or target by {@linkcode healRatio} depending on the value of {@linkcode selfTarget}
 * @extends MoveEffectAttr
 * @see {@linkcode apply}
 */
export class HealAttr extends MoveEffectAttr {
  /** The percentage of {@linkcode Stat.HP} to heal */
  private healRatio: number;
  /** Should an animation be shown? */
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

  /**
   * Creates a new {@linkcode PokemonHealPhase}.
   * This heals the target and shows the appropriate message.
   */
  addHealPhase(target: Pokemon, healRatio: number) {
    target.scene.unshiftPhase(new PokemonHealPhase(target.scene, target.getBattlerIndex(),
      Utils.toDmgValue(target.getMaxHp() * healRatio), i18next.t("moveTriggers:healHp", {pokemonName: getPokemonNameWithAffix(target)}), true, !this.showAnim));
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    const score = ((1 - (this.selfTarget ? user : target).getHpRatio()) * 20) - this.healRatio * 10;
    return Math.round(score / (1 - this.healRatio / 2));
  }
}

/**
 * Cures the user's party of non-volatile status conditions, ie. Heal Bell, Aromatherapy
 * @extends MoveEffectAttr
 * @see {@linkcode apply}
 */
export class PartyStatusCureAttr extends MoveEffectAttr {
  /** Message to display after using move */
  private message: string;
  /** Skips mons with this ability, ie. Soundproof */
  private abilityCondition: Abilities;

  constructor(message: string | null, abilityCondition: Abilities) {
    super();

    this.message = message!; // TODO: is this bang correct?
    this.abilityCondition = abilityCondition;
  }

  //The same as MoveEffectAttr.canApply, except it doesn't check for the target's HP.
  canApply(user: Pokemon, target: Pokemon, move: Move, args: any[]) {
    const isTargetValid =
      (this.selfTarget && user.hp && !user.getTag(BattlerTagType.FRENZY)) ||
      (!this.selfTarget && (!target.getTag(BattlerTagType.PROTECTED) || move.hasFlag(MoveFlags.IGNORE_PROTECT)));
    return !!isTargetValid;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!this.canApply(user, target, move, args)) {
      return false;
    }
    this.addPartyCurePhase(user);
    return true;
  }

  addPartyCurePhase(user: Pokemon) {
    user.scene.unshiftPhase(new PartyStatusCurePhase(user.scene, user, this.message, this.abilityCondition));
  }
}

/**
 * Applies damage to the target's ally equal to 1/16 of that ally's max HP.
 * @extends MoveEffectAttr
 */
export class FlameBurstAttr extends MoveEffectAttr {
  /**
   * @param user - n/a
   * @param target - The target Pokémon.
   * @param move - n/a
   * @param args - n/a
   * @returns A boolean indicating whether the effect was successfully applied.
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean | Promise<boolean> {
    const targetAlly = target.getAlly();
    const cancelled = new Utils.BooleanHolder(false);

    if (targetAlly) {
      applyAbAttrs(BlockNonDirectDamageAbAttr, targetAlly, cancelled);
    }

    if (cancelled.value || !targetAlly) {
      return false;
    }

    targetAlly.damageAndUpdate(Math.max(1, Math.floor(1/16 * targetAlly.getMaxHp())), HitResult.OTHER);
    return true;
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    return target.getAlly() ? -5 : 0;
  }
}

export class SacrificialFullRestoreAttr extends SacrificialAttr {
  constructor() {
    super();
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    // We don't know which party member will be chosen, so pick the highest max HP in the party
    const maxPartyMemberHp = user.scene.getParty().map(p => p.getMaxHp()).reduce((maxHp: integer, hp: integer) => Math.max(hp, maxHp), 0);

    user.scene.pushPhase(new PokemonHealPhase(user.scene, user.getBattlerIndex(),
      maxPartyMemberHp, i18next.t("moveTriggers:sacrificialFullRestore", {pokemonName: getPokemonNameWithAffix(user)}), true, false, false, true), true);

    return true;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    return -20;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => user.scene.getParty().filter(p => p.isActive()).length > user.scene.currentBattle.getBattlerCount();
  }
}

/**
 * Attribute used for moves which ignore type-based debuffs from weather, namely Hydro Steam.
 * Called during damage calculation after getting said debuff from getAttackTypeMultiplier in the Pokemon class.
 * @extends MoveAttr
 * @see {@linkcode apply}
 */
export class IgnoreWeatherTypeDebuffAttr extends MoveAttr {
  /** The {@linkcode WeatherType} this move ignores */
  public weather: WeatherType;

  constructor(weather: WeatherType) {
    super();
    this.weather = weather;
  }
  /**
   * Changes the type-based weather modifier if this move's power would be reduced by it
   * @param user {@linkcode Pokemon} that used the move
   * @param target N/A
   * @param move {@linkcode Move} with this attribute
   * @param args [0] {@linkcode Utils.NumberHolder} for arenaAttackTypeMultiplier
   * @returns true if the function succeeds
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const weatherModifier=args[0] as Utils.NumberHolder;
    //If the type-based attack power modifier due to weather (e.g. Water moves in Sun) is below 1, set it to 1
    if (user.scene.arena.weather?.weatherType === this.weather) {
      weatherModifier.value = Math.max(weatherModifier.value, 1);
    }
    return true;
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

/**
 * Heals the target or the user by either {@linkcode normalHealRatio} or {@linkcode boostedHealRatio}
 * depending on the evaluation of {@linkcode condition}
 * @extends HealAttr
 * @see {@linkcode apply}
 */
export class BoostHealAttr extends HealAttr {
  /** Healing received when {@linkcode condition} is false */
  private normalHealRatio: number;
  /** Healing received when {@linkcode condition} is true */
  private boostedHealRatio: number;
  /** The lambda expression to check against when boosting the healing value */
  private condition?: MoveConditionFunc;

  constructor(normalHealRatio?: number, boostedHealRatio?: number, showAnim?: boolean, selfTarget?: boolean, condition?: MoveConditionFunc) {
    super(normalHealRatio, showAnim, selfTarget);
    this.normalHealRatio = normalHealRatio!; // TODO: is this bang correct?
    this.boostedHealRatio = boostedHealRatio!; // TODO: is this bang correct?
    this.condition = condition;
  }

  /**
   * @param user {@linkcode Pokemon} using the move
   * @param target {@linkcode Pokemon} target of the move
   * @param move {@linkcode Move} with this attribute
   * @param args N/A
   * @returns true if the move was successful
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const healRatio: number = (this.condition ? this.condition(user, target, move) : false) ? this.boostedHealRatio : this.normalHealRatio;
    this.addHealPhase(target, healRatio);
    return true;
  }
}

/**
 * Heals the target only if it is the ally
 * @extends HealAttr
 * @see {@linkcode apply}
 */
export class HealOnAllyAttr extends HealAttr {
  /**
   * @param user {@linkcode Pokemon} using the move
   * @param target {@linkcode Pokemon} target of the move
   * @param move {@linkcode Move} with this attribute
   * @param args N/A
   * @returns true if the function succeeds
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (user.getAlly() === target) {
      super.apply(user, target, move, args);
      return true;
    }

    return false;
  }
}

/**
 * Heals user as a side effect of a move that hits a target.
 * Healing is based on {@linkcode healRatio} * the amount of damage dealt or a stat of the target.
 * @extends MoveEffectAttr
 * @see {@linkcode apply}
 * @see {@linkcode getUserBenefitScore}
 */
export class HitHealAttr extends MoveEffectAttr {
  private healRatio: number;
  private healStat: EffectiveStat | null;

  constructor(healRatio?: number | null, healStat?: EffectiveStat) {
    super(true, MoveEffectTrigger.HIT);

    this.healRatio = healRatio ?? 0.5;
    this.healStat = healStat ?? null;
  }
  /**
   * Heals the user the determined amount and possibly displays a message about regaining health.
   * If the target has the {@linkcode ReverseDrainAbAttr}, all healing is instead converted
   * to damage to the user.
   * @param user {@linkcode Pokemon} using this move
   * @param target {@linkcode Pokemon} target of this move
   * @param move {@linkcode Move} being used
   * @param args N/A
   * @returns true if the function succeeds
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    let healAmount = 0;
    let message = "";
    const reverseDrain = target.hasAbilityWithAttr(ReverseDrainAbAttr, false);
    if (this.healStat !== null) {
      // Strength Sap formula
      healAmount = target.getEffectiveStat(this.healStat);
      message = i18next.t("battle:drainMessage", {pokemonName: getPokemonNameWithAffix(target)});
    } else {
      // Default healing formula used by draining moves like Absorb, Draining Kiss, Bitter Blade, etc.
      healAmount = Utils.toDmgValue(user.turnData.currDamageDealt * this.healRatio);
      message = i18next.t("battle:regainHealth", {pokemonName: getPokemonNameWithAffix(user)});
    }
    if (reverseDrain) {
      if (user.hasAbilityWithAttr(BlockNonDirectDamageAbAttr)) {
        healAmount = 0;
        message = "";
      } else {
        user.turnData.damageTaken += healAmount;
        healAmount = healAmount * -1;
        message = "";
      }
    }
    user.scene.unshiftPhase(new PokemonHealPhase(user.scene, user.getBattlerIndex(), healAmount, message, false, true));
    return true;
  }

  /**
   * Used by the Enemy AI to rank an attack based on a given user
   * @param user {@linkcode Pokemon} using this move
   * @param target {@linkcode Pokemon} target of this move
   * @param move {@linkcode Move} being used
   * @returns an integer. Higher means enemy is more likely to use that move.
   */
  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    if (this.healStat) {
      const healAmount = target.getEffectiveStat(this.healStat);
      return Math.floor(Math.max(0, (Math.min(1, (healAmount+user.hp)/user.getMaxHp() - 0.33))) / user.getHpRatio());
    }
    return Math.floor(Math.max((1 - user.getHpRatio()) - 0.33, 0) * (move.power / 4));
  }
}

/**
 * Attribute used for moves that change priority in a turn given a condition,
 * e.g. Grassy Glide
 * Called when move order is calculated in {@linkcode TurnStartPhase}.
 * @extends MoveAttr
 * @see {@linkcode apply}
 */
export class IncrementMovePriorityAttr extends MoveAttr {
  /** The condition for a move's priority being incremented */
  private moveIncrementFunc: (pokemon: Pokemon, target:Pokemon, move: Move) => boolean;
  /** The amount to increment priority by, if condition passes. */
  private increaseAmount: integer;

  constructor(moveIncrementFunc: (pokemon: Pokemon, target:Pokemon, move: Move) => boolean, increaseAmount = 1) {
    super();

    this.moveIncrementFunc = moveIncrementFunc;
    this.increaseAmount = increaseAmount;
  }

  /**
   * Increments move priority by set amount if condition passes
   * @param user {@linkcode Pokemon} using this move
   * @param target {@linkcode Pokemon} target of this move
   * @param move {@linkcode Move} being used
   * @param args [0] {@linkcode Utils.IntegerHolder} for move priority.
   * @returns true if function succeeds
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!this.moveIncrementFunc(user, target, move)) {
      return false;
    }

    (args[0] as Utils.IntegerHolder).value += this.increaseAmount;
    return true;
  }
}

/**
 * Attribute used for attack moves that hit multiple times per use, e.g. Bullet Seed.
 *
 * Applied at the beginning of {@linkcode MoveEffectPhase}.
 *
 * @extends MoveAttr
 * @see {@linkcode apply}
 */
export class MultiHitAttr extends MoveAttr {
  private multiHitType: MultiHitType;

  constructor(multiHitType?: MultiHitType) {
    super();

    this.multiHitType = multiHitType !== undefined ? multiHitType : MultiHitType._2_TO_5;
  }

  /**
   * Set the hit count of an attack based on this attribute instance's {@linkcode MultiHitType}.
   * If the target has an immunity to this attack's types, the hit count will always be 1.
   *
   * @param user {@linkcode Pokemon} that used the attack
   * @param target {@linkcode Pokemon} targeted by the attack
   * @param move {@linkcode Move} being used
   * @param args [0] {@linkcode Utils.IntegerHolder} storing the hit count of the attack
   * @returns True
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const hitType = new Utils.NumberHolder(this.multiHitType);
    applyMoveAttrs(ChangeMultiHitTypeAttr, user, target, move, hitType);
    this.multiHitType = hitType.value;

    (args[0] as Utils.NumberHolder).value = this.getHitCount(user, target);
    return true;
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    return -5;
  }

  /**
   * Calculate the number of hits that an attack should have given this attribute's
   * {@linkcode MultiHitType}.
   *
   * @param user {@linkcode Pokemon} using the attack
   * @param target {@linkcode Pokemon} targeted by the attack
   * @returns The number of hits this attack should deal
   */
  getHitCount(user: Pokemon, target: Pokemon): integer {
    switch (this.multiHitType) {
    case MultiHitType._2_TO_5:
    {
      const rand = user.randSeedInt(16);
      const hitValue = new Utils.IntegerHolder(rand);
      applyAbAttrs(MaxMultiHitAbAttr, user, null, false, hitValue);
      if (hitValue.value >= 10) {
        return 2;
      } else if (hitValue.value >= 4) {
        return 3;
      } else if (hitValue.value >= 2) {
        return 4;
      } else {
        return 5;
      }
    }
    case MultiHitType._2:
      return 2;
    case MultiHitType._3:
      return 3;
    case MultiHitType._10:
      return 10;
    case MultiHitType.BEAT_UP:
      const party = user.isPlayer() ? user.scene.getParty() : user.scene.getEnemyParty();
      // No status means the ally pokemon can contribute to Beat Up
      return party.reduce((total, pokemon) => {
        return total + (pokemon.id === user.id ? 1 : pokemon?.status && pokemon.status.effect !== StatusEffect.NONE ? 0 : 1);
      }, 0);
    }
  }
}

export class ChangeMultiHitTypeAttr extends MoveAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    //const hitType = args[0] as Utils.NumberHolder;
    return false;
  }
}

export class WaterShurikenMultiHitTypeAttr extends ChangeMultiHitTypeAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (user.species.speciesId === Species.GRENINJA && user.hasAbility(Abilities.BATTLE_BOND) && user.formIndex === 2) {
      (args[0] as Utils.IntegerHolder).value = MultiHitType._3;
      return true;
    }
    return false;
  }
}

export class StatusEffectAttr extends MoveEffectAttr {
  public effect: StatusEffect;
  public cureTurn: integer | null;
  public overrideStatus: boolean;

  constructor(effect: StatusEffect, selfTarget?: boolean, cureTurn?: integer, overrideStatus?: boolean) {
    super(selfTarget, MoveEffectTrigger.HIT);

    this.effect = effect;
    this.cureTurn = cureTurn!; // TODO: is this bang correct?
    this.overrideStatus = !!overrideStatus;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const moveChance = this.getMoveChance(user, target, move, this.selfTarget, true);
    const statusCheck = moveChance < 0 || moveChance === 100 || user.randSeedInt(100) < moveChance;
    if (statusCheck) {
      const pokemon = this.selfTarget ? user : target;
      if (pokemon.status) {
        if (this.overrideStatus) {
          pokemon.resetStatus();
        } else {
          return false;
        }
      }

      if (user !== target && target.scene.arena.getTagOnSide(ArenaTagType.SAFEGUARD, target.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY)) {
        if (move.category === MoveCategory.STATUS) {
          user.scene.queueMessage(i18next.t("moveTriggers:safeguard", { targetName: getPokemonNameWithAffix(target)}));
        }
        return false;
      }
      if ((!pokemon.status || (pokemon.status.effect === this.effect && moveChance < 0))
        && pokemon.trySetStatus(this.effect, true, user, this.cureTurn)) {
        applyPostAttackAbAttrs(ConfusionOnStatusEffectAbAttr, user, target, move, null, false, this.effect);
        return true;
      }
    }
    return false;
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    const moveChance = this.getMoveChance(user, target, move, this.selfTarget, false);
    return !(this.selfTarget ? user : target).status && (this.selfTarget ? user : target).canSetStatus(this.effect, true, false, user) ? Math.floor(moveChance * -0.1) : 0;
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
    const moveChance = this.getMoveChance(user, target, move, this.selfTarget, false);
    return !(this.selfTarget ? user : target).status && (this.selfTarget ? user : target).canSetStatus(this.effect, true, false, user) ? Math.floor(moveChance * -0.1) : 0;
  }
}

export class PsychoShiftEffectAttr extends MoveEffectAttr {
  constructor() {
    super(false, MoveEffectTrigger.HIT);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const statusToApply: StatusEffect | undefined = user.status?.effect ?? (user.hasAbility(Abilities.COMATOSE) ? StatusEffect.SLEEP : undefined);

    if (target.status) {
      return false;
    }
    //@ts-ignore - how can target.status.effect be checked when we return `false` before when it's defined?
    if (!target.status || (target.status.effect === statusToApply && move.chance < 0)) { // TODO: resolve ts-ignore
      const statusAfflictResult = target.trySetStatus(statusToApply, true, user);
      if (statusAfflictResult) {
        if (user.status) {
          user.scene.queueMessage(getStatusEffectHealText(user.status.effect, getPokemonNameWithAffix(user)));
        }
        user.resetStatus();
        user.updateInfo();
      }
      return statusAfflictResult;
    }

    return false;
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    return !(this.selfTarget ? user : target).status && (this.selfTarget ? user : target).canSetStatus(user.status?.effect, true, false, user) ? Math.floor(move.chance * -0.1) : 0;
  }
}
/**
 * The following needs to be implemented for Thief
 * "If the user faints due to the target's Ability (Rough Skin or Iron Barbs) or held Rocky Helmet, it cannot remove the target's held item."
 * "If Knock Off causes a Pokémon with the Sticky Hold Ability to faint, it can now remove that Pokémon's held item."
 */
export class StealHeldItemChanceAttr extends MoveEffectAttr {
  private chance: number;

  constructor(chance: number) {
    super(false, MoveEffectTrigger.HIT);
    this.chance = chance;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      const rand = Phaser.Math.RND.realInRange(0, 1);
      if (rand >= this.chance) {
        return resolve(false);
      }
      const heldItems = this.getTargetHeldItems(target).filter(i => i.isTransferrable);
      if (heldItems.length) {
        const poolType = target.isPlayer() ? ModifierPoolType.PLAYER : target.hasTrainer() ? ModifierPoolType.TRAINER : ModifierPoolType.WILD;
        const highestItemTier = heldItems.map(m => m.type.getOrInferTier(poolType)).reduce((highestTier, tier) => Math.max(tier!, highestTier), 0); // TODO: is the bang after tier correct?
        const tierHeldItems = heldItems.filter(m => m.type.getOrInferTier(poolType) === highestItemTier);
        const stolenItem = tierHeldItems[user.randSeedInt(tierHeldItems.length)];
        user.scene.tryTransferHeldItemModifier(stolenItem, user, false).then(success => {
          if (success) {
            user.scene.queueMessage(i18next.t("moveTriggers:stoleItem", {pokemonName: getPokemonNameWithAffix(user), targetName: getPokemonNameWithAffix(target), itemName: stolenItem.type.name}));
          }
          resolve(success);
        });
        return;
      }

      resolve(false);
    });
  }

  getTargetHeldItems(target: Pokemon): PokemonHeldItemModifier[] {
    return target.scene.findModifiers(m => m instanceof PokemonHeldItemModifier
      && m.pokemonId === target.id, target.isPlayer()) as PokemonHeldItemModifier[];
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

/**
 * Removes a random held item (or berry) from target.
 * Used for Incinerate and Knock Off.
 * Not Implemented Cases: (Same applies for Thief)
 * "If the user faints due to the target's Ability (Rough Skin or Iron Barbs) or held Rocky Helmet, it cannot remove the target's held item."
 * "If Knock Off causes a Pokémon with the Sticky Hold Ability to faint, it can now remove that Pokémon's held item."
 */
export class RemoveHeldItemAttr extends MoveEffectAttr {

  /** Optional restriction for item pool to berries only i.e. Differentiating Incinerate and Knock Off */
  private berriesOnly: boolean;

  constructor(berriesOnly: boolean) {
    super(false, MoveEffectTrigger.HIT);
    this.berriesOnly = berriesOnly;
  }

  /**
   *
   * @param user {@linkcode Pokemon} that used the move
   * @param target Target {@linkcode Pokemon} that the moves applies to
   * @param move {@linkcode Move} that is used
   * @param args N/A
   * @returns {boolean} True if an item was removed
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!this.berriesOnly && target.isPlayer()) { // "Wild Pokemon cannot knock off Player Pokemon's held items" (See Bulbapedia)
      return false;
    }

    const cancelled = new Utils.BooleanHolder(false);
    applyAbAttrs(BlockItemTheftAbAttr, target, cancelled); // Check for abilities that block item theft

    if (cancelled.value === true) {
      return false;
    }

    // Considers entire transferrable item pool by default (Knock Off). Otherwise berries only if specified (Incinerate).
    let heldItems = this.getTargetHeldItems(target).filter(i => i.isTransferrable);

    if (this.berriesOnly) {
      heldItems = heldItems.filter(m => m instanceof BerryModifier && m.pokemonId === target.id, target.isPlayer());
    }

    if (heldItems.length) {
      const removedItem = heldItems[user.randSeedInt(heldItems.length)];

      // Decrease item amount and update icon
      !--removedItem.stackCount;
      target.scene.updateModifiers(target.isPlayer());

      if (this.berriesOnly) {
        user.scene.queueMessage(i18next.t("moveTriggers:incineratedItem", {pokemonName: getPokemonNameWithAffix(user), targetName: getPokemonNameWithAffix(target), itemName: removedItem.type.name}));
      } else {
        user.scene.queueMessage(i18next.t("moveTriggers:knockedOffItem", {pokemonName: getPokemonNameWithAffix(user), targetName: getPokemonNameWithAffix(target), itemName: removedItem.type.name}));
      }
    }

    return true;
  }

  getTargetHeldItems(target: Pokemon): PokemonHeldItemModifier[] {
    return target.scene.findModifiers(m => m instanceof PokemonHeldItemModifier
      && m.pokemonId === target.id, target.isPlayer()) as PokemonHeldItemModifier[];
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

/**
 * Attribute that causes targets of the move to eat a berry. Used for Teatime, Stuff Cheeks
 */
export class EatBerryAttr extends MoveEffectAttr {
  protected chosenBerry: BerryModifier | undefined;
  constructor() {
    super(true, MoveEffectTrigger.HIT);
  }
  /**
   * Causes the target to eat a berry.
   * @param user {@linkcode Pokemon} Pokemon that used the move
   * @param target {@linkcode Pokemon} Pokemon that will eat a berry
   * @param move {@linkcode Move} The move being used
   * @param args Unused
   * @returns {boolean} true if the function succeeds
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const heldBerries = this.getTargetHeldBerries(target);
    if (heldBerries.length <= 0) {
      return false;
    }
    this.chosenBerry = heldBerries[user.randSeedInt(heldBerries.length)];
    const preserve = new Utils.BooleanHolder(false);
    target.scene.applyModifiers(PreserveBerryModifier, target.isPlayer(), target, preserve); // check for berry pouch preservation
    if (!preserve.value) {
      this.reduceBerryModifier(target);
    }
    this.eatBerry(target);
    return true;
  }

  getTargetHeldBerries(target: Pokemon): BerryModifier[] {
    return target.scene.findModifiers(m => m instanceof BerryModifier
      && (m as BerryModifier).pokemonId === target.id, target.isPlayer()) as BerryModifier[];
  }

  reduceBerryModifier(target: Pokemon) {
    if (this.chosenBerry?.stackCount === 1) {
      target.scene.removeModifier(this.chosenBerry, !target.isPlayer());
    } else if (this.chosenBerry !== undefined && this.chosenBerry.stackCount > 1) {
      this.chosenBerry.stackCount--;
    }
    target.scene.updateModifiers(target.isPlayer());
  }

  eatBerry(consumer: Pokemon) {
    getBerryEffectFunc(this.chosenBerry!.berryType)(consumer); // consumer eats the berry
    applyAbAttrs(HealFromBerryUseAbAttr, consumer, new Utils.BooleanHolder(false));
  }
}

/**
 *  Attribute used for moves that steal a random berry from the target. The user then eats the stolen berry.
 *  Used for Pluck & Bug Bite.
 */
export class StealEatBerryAttr extends EatBerryAttr {
  constructor() {
    super();
  }
  /**
   * User steals a random berry from the target and then eats it.
   * @param {Pokemon} user Pokemon that used the move and will eat the stolen berry
   * @param {Pokemon} target Pokemon that will have its berry stolen
   * @param {Move} move Move being used
   * @param {any[]} args Unused
   * @returns {boolean} true if the function succeeds
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const cancelled = new Utils.BooleanHolder(false);
    applyAbAttrs(BlockItemTheftAbAttr, target, cancelled); // check for abilities that block item theft
    if (cancelled.value === true) {
      return false;
    }

    const heldBerries = this.getTargetHeldBerries(target);
    if (heldBerries.length <= 0) {
      return false;
    }
    // if the target has berries, pick a random berry and steal it
    this.chosenBerry = heldBerries[user.randSeedInt(heldBerries.length)];
    const message = i18next.t("battle:stealEatBerry", {pokemonName: user.name, targetName: target.name, berryName: this.chosenBerry.type.name});
    user.scene.queueMessage(message);
    this.reduceBerryModifier(target);
    this.eatBerry(user);
    return true;
  }
}

/**
 * Move attribute that signals that the move should cure a status effect
 * @extends MoveEffectAttr
 * @see {@linkcode apply()}
 */
export class HealStatusEffectAttr extends MoveEffectAttr {
  /** List of Status Effects to cure */
  private effects: StatusEffect[];

  /**
   * @param selfTarget - Whether this move targets the user
   * @param ...effects - List of status effects to cure
   */
  constructor(selfTarget: boolean, ...effects: StatusEffect[]) {
    super(selfTarget, MoveEffectTrigger.POST_APPLY, false, true);

    this.effects = effects;
  }

  /**
   * @param user {@linkcode Pokemon} source of the move
   * @param target {@linkcode Pokemon} target of the move
   * @param move the {@linkcode Move} being used
   * @returns true if the status is cured
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    // Special edge case for shield dust blocking Sparkling Aria curing burn
    const moveTargets = getMoveTargets(user, move.id);
    if (target.hasAbilityWithAttr(IgnoreMoveEffectsAbAttr) && move.id === Moves.SPARKLING_ARIA && moveTargets.targets.length === 1) {
      return false;
    }

    const pokemon = this.selfTarget ? user : target;
    if (pokemon.status && this.effects.includes(pokemon.status.effect)) {
      pokemon.scene.queueMessage(getStatusEffectHealText(pokemon.status.effect, getPokemonNameWithAffix(pokemon)));
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

/**
 * Attribute used for moves that bypass the burn damage reduction of physical moves, currently only facade
 * Called during damage calculation
 * @extends MoveAttr
 * @see {@linkcode apply}
 */
export class BypassBurnDamageReductionAttr extends MoveAttr {
  /** Prevents the move's damage from being reduced by burn
   * @param user N/A
   * @param target N/A
   * @param move {@linkcode Move} with this attribute
   * @param args [0] {@linkcode Utils.BooleanHolder} for burnDamageReductionCancelled
   * @returns true if the function succeeds
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    (args[0] as Utils.BooleanHolder).value = true;

    return true;
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
    if (user.scene.arena.weather?.weatherType === this.weatherType) {
      return user.scene.arena.trySetWeather(WeatherType.NONE, true);
    }

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
    if (target.isBossImmune()) {
      return false;
    }

    (args[0] as Utils.BooleanHolder).value = true;

    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => {
      const cancelled = new Utils.BooleanHolder(false);
      applyAbAttrs(BlockOneHitKOAbAttr, target, cancelled);
      return !cancelled.value && user.level >= target.level;
    };
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
  private tagType: BattlerTagType | null;
  private chargeEffect: boolean;
  public followUpPriority: integer | null;

  constructor(chargeAnim: ChargeAnim, chargeText: string, tagType?: BattlerTagType | null, chargeEffect: boolean = false) {
    super();

    this.chargeAnim = chargeAnim;
    this.chargeText = chargeText;
    this.tagType = tagType!; // TODO: is this bang correct?
    this.chargeEffect = chargeEffect;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): Promise<boolean> {
    return new Promise(resolve => {
      const lastMove = user.getLastXMoves().find(() => true);
      if (!lastMove || lastMove.move !== move.id || (lastMove.result !== MoveResult.OTHER && lastMove.turn !== user.scene.currentBattle.turn)) {
        (args[0] as Utils.BooleanHolder).value = true;
        new MoveChargeAnim(this.chargeAnim, move.id, user).play(user.scene, () => {
          user.scene.queueMessage(this.chargeText.replace("{TARGET}", getPokemonNameWithAffix(target)).replace("{USER}", getPokemonNameWithAffix(user)));
          if (this.tagType) {
            user.addTag(this.tagType, 1, move.id, user.id);
          }
          if (this.chargeEffect) {
            applyMoveAttrs(MoveEffectAttr, user, target, move);
          }
          user.pushMoveHistory({ move: move.id, targets: [ target.getBattlerIndex() ], result: MoveResult.OTHER });
          user.getMoveQueue().push({ move: move.id, targets: [ target.getBattlerIndex() ], ignorePP: true });
          user.addTag(BattlerTagType.CHARGING, 1, move.id, user.id);
          resolve(true);
        });
      } else {
        user.lapseTag(BattlerTagType.CHARGING);
        resolve(false);
      }
    });
  }

  usedChargeEffect(user: Pokemon, target: Pokemon | null, move: Move): boolean {
    if (!this.chargeEffect) {
      return false;
    }
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
      if (!user.scene.arena.weather?.isEffectSuppressed(user.scene) && (weatherType === WeatherType.SUNNY || weatherType === WeatherType.HARSH_SUN)) {
        resolve(false);
      } else {
        super.apply(user, target, move, args).then(result => resolve(result));
      }
    });
  }
}

export class ElectroShotChargeAttr extends ChargeAttr {
  private statIncreaseApplied: boolean;
  constructor() {
    super(ChargeAnim.ELECTRO_SHOT_CHARGING, i18next.t("moveTriggers:absorbedElectricity", {pokemonName: "{USER}"}), null, true);
    // Add a flag because ChargeAttr skills use themselves twice instead of once over one-to-two turns
    this.statIncreaseApplied = false;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): Promise<boolean> {
    return new Promise(resolve => {
      const weatherType = user.scene.arena.weather?.weatherType;
      if (!user.scene.arena.weather?.isEffectSuppressed(user.scene) && (weatherType === WeatherType.RAIN || weatherType === WeatherType.HEAVY_RAIN)) {
        // Apply the SPATK increase every call when used in the rain
        const statChangeAttr = new StatStageChangeAttr([ Stat.SPATK ], 1, true);
        statChangeAttr.apply(user, target, move, args);
        // After the SPATK is raised, execute the move resolution e.g. deal damage
        resolve(false);
      } else {
        if (!this.statIncreaseApplied) {
          // Apply the SPATK increase only if it hasn't been applied before e.g. on the first turn charge up animation
          const statChangeAttr = new StatStageChangeAttr([ Stat.SPATK ], 1, true);
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
          user.scene.queueMessage(this.chargeText.replace("{TARGET}", getPokemonNameWithAffix(target)).replace("{USER}", getPokemonNameWithAffix(user)));
          user.pushMoveHistory({ move: move.id, targets: [ target.getBattlerIndex() ], result: MoveResult.OTHER });
          user.scene.arena.addTag(this.tagType, 3, move.id, user.id, ArenaTagSide.BOTH, false, target.getBattlerIndex());

          resolve(true);
        });
      } else {
        user.scene.ui.showText(i18next.t("moveTriggers:tookMoveAttack", {pokemonName: getPokemonNameWithAffix(user.scene.getPokemonById(target.id) ?? undefined), moveName: move.name}), null, () => resolve(true));
      }
    });
  }
}

export class StatStageChangeAttr extends MoveEffectAttr {
  public stats: BattleStat[];
  public stages: integer;
  private condition: MoveConditionFunc | null;
  private showMessage: boolean;

  constructor(stats: BattleStat[], stages: integer, selfTarget?: boolean, condition?: MoveConditionFunc | null, showMessage: boolean = true, firstHitOnly: boolean = false, moveEffectTrigger: MoveEffectTrigger = MoveEffectTrigger.HIT, firstTargetOnly: boolean = false) {
    super(selfTarget, moveEffectTrigger, firstHitOnly, false, firstTargetOnly);
    this.stats = stats;
    this.stages = stages;
    this.condition = condition!; // TODO: is this bang correct?
    this.showMessage = showMessage;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args?: any[]): boolean | Promise<boolean> {
    if (!super.apply(user, target, move, args) || (this.condition && !this.condition(user, target, move))) {
      return false;
    }

    const moveChance = this.getMoveChance(user, target, move, this.selfTarget, true);
    if (moveChance < 0 || moveChance === 100 || user.randSeedInt(100) < moveChance) {
      const stages = this.getLevels(user);
      user.scene.unshiftPhase(new StatStageChangePhase(user.scene, (this.selfTarget ? user : target).getBattlerIndex(), this.selfTarget, this.stats, stages, this.showMessage));
      return true;
    }

    return false;
  }

  getLevels(_user: Pokemon): integer {
    return this.stages;
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    let ret = 0;
    const moveLevels = this.getLevels(user);
    for (const stat of this.stats) {
      let levels = moveLevels;
      const statStage = target.getStatStage(stat);
      if (levels > 0) {
        levels = Math.min(statStage + levels, 6) - statStage;
      } else {
        levels = Math.max(statStage + levels, -6) - statStage;
      }
      let noEffect = false;
      switch (stat) {
      case Stat.ATK:
        if (this.selfTarget) {
          noEffect = !user.getMoveset().find(m => m instanceof AttackMove && m.category === MoveCategory.PHYSICAL);
        }
        break;
      case Stat.DEF:
        if (!this.selfTarget) {
          noEffect = !user.getMoveset().find(m => m instanceof AttackMove && m.category === MoveCategory.PHYSICAL);
        }
        break;
      case Stat.SPATK:
        if (this.selfTarget) {
          noEffect = !user.getMoveset().find(m => m instanceof AttackMove && m.category === MoveCategory.SPECIAL);
        }
        break;
      case Stat.SPDEF:
        if (!this.selfTarget) {
          noEffect = !user.getMoveset().find(m => m instanceof AttackMove && m.category === MoveCategory.SPECIAL);
        }
        break;
      }
      if (noEffect) {
        continue;
      }
      ret += (levels * 4) + (levels > 0 ? -2 : 2);
    }
    return ret;
  }
}

export class PostVictoryStatStageChangeAttr extends MoveAttr {
  private stats: BattleStat[];
  private stages: number;
  private condition: MoveConditionFunc | null;
  private showMessage: boolean;

  constructor(stats: BattleStat[], stages: number, selfTarget?: boolean, condition?: MoveConditionFunc, showMessage: boolean = true, firstHitOnly: boolean = false) {
    super();
    this.stats = stats;
    this.stages = stages;
    this.condition = condition!; // TODO: is this bang correct?
    this.showMessage = showMessage;
  }
  applyPostVictory(user: Pokemon, target: Pokemon, move: Move): void {
    if (this.condition && !this.condition(user, target, move)) {
      return;
    }
    const statChangeAttr = new StatStageChangeAttr(this.stats, this.stages, this.showMessage);
    statChangeAttr.apply(user, target, move);
  }
}

export class AcupressureStatStageChangeAttr extends MoveEffectAttr {
  constructor() {
    super();
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean | Promise<boolean> {
    const randStats = BATTLE_STATS.filter(s => target.getStatStage(s) < 6);
    if (randStats.length > 0) {
      const boostStat = [randStats[user.randSeedInt(randStats.length)]];
      user.scene.unshiftPhase(new StatStageChangePhase(user.scene, target.getBattlerIndex(), this.selfTarget, boostStat, 2));
      return true;
    }
    return false;
  }
}

export class GrowthStatStageChangeAttr extends StatStageChangeAttr {
  constructor() {
    super([ Stat.ATK, Stat.SPATK ], 1, true);
  }

  getLevels(user: Pokemon): number {
    if (!user.scene.arena.weather?.isEffectSuppressed(user.scene)) {
      const weatherType = user.scene.arena.weather?.weatherType;
      if (weatherType === WeatherType.SUNNY || weatherType === WeatherType.HARSH_SUN) {
        return this.stages + 1;
      }
    }
    return this.stages;
  }
}

export class CutHpStatStageBoostAttr extends StatStageChangeAttr {
  private cutRatio: integer;
  private messageCallback: ((user: Pokemon) => void) | undefined;

  constructor(stat: BattleStat[], levels: integer, cutRatio: integer, messageCallback?: ((user: Pokemon) => void) | undefined) {
    super(stat, levels, true, null, true);

    this.cutRatio = cutRatio;
    this.messageCallback = messageCallback;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      user.damageAndUpdate(Utils.toDmgValue(user.getMaxHp() / this.cutRatio), HitResult.OTHER, false, true);
      user.updateInfo().then(() => {
        const ret = super.apply(user, target, move, args);
        if (this.messageCallback) {
          this.messageCallback(user);
        }
        resolve(ret);
      });
    });
  }

  getCondition(): MoveConditionFunc {
    return (user, _target, _move) => user.getHpRatio() > 1 / this.cutRatio && this.stats.some(s => user.getStatStage(s) < 6);
  }
}

export class CopyStatsAttr extends MoveEffectAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    // Copy all stat stages
    for (const s of BATTLE_STATS) {
      user.setStatStage(s, target.getStatStage(s));
    }

    if (target.getTag(BattlerTagType.CRIT_BOOST)) {
      user.addTag(BattlerTagType.CRIT_BOOST, 0, move.id);
    } else {
      user.removeTag(BattlerTagType.CRIT_BOOST);
    }
    target.updateInfo();
    user.updateInfo();
    target.scene.queueMessage(i18next.t("moveTriggers:copiedStatChanges", {pokemonName: getPokemonNameWithAffix(user), targetName: getPokemonNameWithAffix(target)}));

    return true;
  }
}

export class InvertStatsAttr extends MoveEffectAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    for (const s of BATTLE_STATS) {
      target.setStatStage(s, -target.getStatStage(s));
    }

    target.updateInfo();
    user.updateInfo();

    target.scene.queueMessage(i18next.t("moveTriggers:invertStats", {pokemonName: getPokemonNameWithAffix(target)}));

    return true;
  }
}

export class ResetStatsAttr extends MoveEffectAttr {
  private targetAllPokemon: boolean;
  constructor(targetAllPokemon: boolean) {
    super();
    this.targetAllPokemon = targetAllPokemon;
  }
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    if (this.targetAllPokemon) { // Target all pokemon on the field when Freezy Frost or Haze are used
      const activePokemon = user.scene.getField(true);
      activePokemon.forEach(p => this.resetStats(p));
      target.scene.queueMessage(i18next.t("moveTriggers:statEliminated"));
    } else { // Affects only the single target when Clear Smog is used
      this.resetStats(target);
      target.scene.queueMessage(i18next.t("moveTriggers:resetStats", {pokemonName: getPokemonNameWithAffix(target)}));
    }

    return true;
  }

  resetStats(pokemon: Pokemon) {
    for (const s of BATTLE_STATS) {
      pokemon.setStatStage(s, 0);
    }
    pokemon.updateInfo();
  }
}

/**
 * Attribute used for status moves, specifically Heart, Guard, and Power Swap,
 * that swaps the user's and target's corresponding stat stages.
 * @extends MoveEffectAttr
 * @see {@linkcode apply}
 */
export class SwapStatStagesAttr extends MoveEffectAttr {
  /** The stat stages to be swapped between the user and the target */
  private stats: readonly BattleStat[];

  constructor(stats: readonly BattleStat[]) {
    super();

    this.stats = stats;
  }

  /**
   * For all {@linkcode stats}, swaps the user's and target's corresponding stat
   * stage.
   * @param user the {@linkcode Pokemon} that used the move
   * @param target the {@linkcode Pokemon} that the move was used on
   * @param move N/A
   * @param args N/A
   * @returns true if attribute application succeeds
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any []): boolean {
    if (super.apply(user, target, move, args)) {
      for (const s of BATTLE_STATS) {
        const temp = user.getStatStage(s);
        user.setStatStage(s, target.getStatStage(s));
        target.setStatStage(s, temp);
      }

      target.updateInfo();
      user.updateInfo();

      if (this.stats.length === 7) {
        user.scene.queueMessage(i18next.t("moveTriggers:switchedStatChanges", { pokemonName: getPokemonNameWithAffix(user) }));
      } else if (this.stats.length === 2) {
        user.scene.queueMessage(i18next.t("moveTriggers:switchedTwoStatChanges", {
          pokemonName: getPokemonNameWithAffix(user),
          firstStat: i18next.t(getStatKey(this.stats[0])),
          secondStat: i18next.t(getStatKey(this.stats[1]))
        }));
      }
      return true;
    }
    return false;
  }
}

export class HpSplitAttr extends MoveEffectAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): Promise<boolean> {
    return new Promise(resolve => {
      if (!super.apply(user, target, move, args)) {
        return resolve(false);
      }

      const infoUpdates: Promise<void>[] = [];

      const hpValue = Math.floor((target.hp + user.hp) / 2);
      if (user.hp < hpValue) {
        const healing = user.heal(hpValue - user.hp);
        if (healing) {
          user.scene.damageNumberHandler.add(user, healing, HitResult.HEAL);
        }
      } else if (user.hp > hpValue) {
        const damage = user.damage(user.hp - hpValue, true);
        if (damage) {
          user.scene.damageNumberHandler.add(user, damage);
        }
      }
      infoUpdates.push(user.updateInfo());

      if (target.hp < hpValue) {
        const healing = target.heal(hpValue - target.hp);
        if (healing) {
          user.scene.damageNumberHandler.add(user, healing, HitResult.HEAL);
        }
      } else if (target.hp > hpValue) {
        const damage = target.damage(target.hp - hpValue, true);
        if (damage) {
          target.scene.damageNumberHandler.add(target, damage);
        }
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

export class LessPPMorePowerAttr extends VariablePowerAttr {
  /**
   * Power up moves when less PP user has
   * @param user {@linkcode Pokemon} using this move
   * @param target {@linkcode Pokemon} target of this move
   * @param move {@linkcode Move} being used
   * @param args [0] {@linkcode Utils.NumberHolder} of power
   * @returns true if the function succeeds
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const ppMax = move.pp;
    const ppUsed = user.moveset.find((m) => m?.moveId === move.id)?.ppUsed!; // TODO: is the bang correct?

    let ppRemains = ppMax - ppUsed;
    /** Reduce to 0 to avoid negative numbers if user has 1PP before attack and target has Ability.PRESSURE */
    if (ppRemains < 0) {
      ppRemains = 0;
    }

    const power = args[0] as Utils.NumberHolder;

    switch (ppRemains) {
    case 0:
      power.value = 200;
      break;
    case 1:
      power.value = 80;
      break;
    case 2:
      power.value = 60;
      break;
    case 3:
      power.value = 50;
      break;
    default:
      power.value = 40;
      break;
    }
    return true;
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

/**
 * Helper function to calculate the the base power of an ally's hit when using Beat Up.
 * @param user The Pokemon that used Beat Up.
 * @param allyIndex The party position of the ally contributing to Beat Up.
 * @returns The base power of the Beat Up hit.
 */
const beatUpFunc = (user: Pokemon, allyIndex: number): number => {
  const party = user.isPlayer() ? user.scene.getParty() : user.scene.getEnemyParty();

  for (let i = allyIndex; i < party.length; i++) {
    const pokemon = party[i];

    // The user contributes to Beat Up regardless of status condition.
    // Allies can contribute only if they do not have a non-volatile status condition.
    if (pokemon.id !== user.id && pokemon?.status && pokemon.status.effect !== StatusEffect.NONE) {
      continue;
    }
    return (pokemon.species.getBaseStat(Stat.ATK) / 10) + 5;
  }
  return 0;
};

export class BeatUpAttr extends VariablePowerAttr {

  /**
   * Gets the next party member to contribute to a Beat Up hit, and calculates the base power for it.
   * @param user Pokemon that used the move
   * @param _target N/A
   * @param _move Move with this attribute
   * @param args N/A
   * @returns true if the function succeeds
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const power = args[0] as Utils.NumberHolder;

    const party = user.isPlayer() ? user.scene.getParty() : user.scene.getEnemyParty();
    const allyCount = party.filter(pokemon => {
      return pokemon.id === user.id || !pokemon.status?.effect;
    }).length;
    const allyIndex = (user.turnData.hitCount - user.turnData.hitsLeft) % allyCount;
    power.value = beatUpFunc(user, allyIndex);
    return true;
  }
}

const doublePowerChanceMessageFunc = (user: Pokemon, target: Pokemon, move: Move) => {
  let message: string = "";
  user.scene.executeWithSeedOffset(() => {
    const rand = Utils.randSeedInt(100);
    if (rand < move.chance) {
      message = i18next.t("moveTriggers:goingAllOutForAttack", {pokemonName: getPokemonNameWithAffix(user)});
    }
  }, user.scene.currentBattle.turn << 6, user.scene.waveSeed);
  return message;
};

export class DoublePowerChanceAttr extends VariablePowerAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    let rand: integer;
    user.scene.executeWithSeedOffset(() => rand = Utils.randSeedInt(100), user.scene.currentBattle.turn << 6, user.scene.waveSeed);
    if (rand! < move.chance) {
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
      const moveHistory = user.getLastXMoves(limit + 1).slice(1);

      let count = 0;
      let turnMove: TurnMove | undefined;

      while (((turnMove = moveHistory.shift())?.move === move.id || (comboMoves.length && comboMoves.includes(turnMove?.move!))) && (!resetOnFail || turnMove?.result === MoveResult.SUCCESS)) { // TODO: is this bang correct?
        if (count < (limit - 1)) {
          count++;
        } else if (resetOnLimit) {
          count = 0;
        } else {
          break;
        }
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
      if (++w === weightThresholds.length) {
        break;
      }
    }

    power.value = (w + 1) * 20;

    return true;
  }
}

/**
 * Attribute used for Electro Ball move.
 * @extends VariablePowerAttr
 * @see {@linkcode apply}
 **/
export class ElectroBallPowerAttr extends VariablePowerAttr {
  /**
   * Move that deals more damage the faster {@linkcode Stat.SPD}
   * the user is compared to the target.
   * @param user Pokemon that used the move
   * @param target The target of the move
   * @param move Move with this attribute
   * @param args N/A
   * @returns true if the function succeeds
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const power = args[0] as Utils.NumberHolder;

    const statRatio = target.getEffectiveStat(Stat.SPD) / user.getEffectiveStat(Stat.SPD);
    const statThresholds = [ 0.25, 1 / 3, 0.5, 1, -1 ];
    const statThresholdPowers = [ 150, 120, 80, 60, 40 ];

    let w = 0;
    while (w < statThresholds.length - 1 && statRatio > statThresholds[w]) {
      if (++w === statThresholds.length) {
        break;
      }
    }

    power.value = statThresholdPowers[w];
    return true;
  }
}


/**
 * Attribute used for Gyro Ball move.
 * @extends VariablePowerAttr
 * @see {@linkcode apply}
 **/
export class GyroBallPowerAttr extends VariablePowerAttr {
  /**
   * Move that deals more damage the slower {@linkcode Stat.SPD}
   * the user is compared to the target.
   * @param user Pokemon that used the move
   * @param target The target of the move
   * @param move Move with this attribute
   * @param args N/A
   * @returns true if the function succeeds
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const power = args[0] as Utils.NumberHolder;
    const userSpeed = user.getEffectiveStat(Stat.SPD);
    if (userSpeed < 1) {
      // Gen 6+ always have 1 base power
      power.value = 1;
      return true;
    }

    power.value = Math.floor(Math.min(150, 25 * target.getEffectiveStat(Stat.SPD) / userSpeed + 1));
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

    if (!userWeight || userWeight === 0) {
      return false;
    }

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
    (args[0] as Utils.NumberHolder).value = Utils.toDmgValue(150 * user.getHpRatio());

    return true;
  }
}

/**
 * Attribute used for moves whose base power scales with the opponent's HP
 * Used for Crush Grip, Wring Out, and Hard Press
 * maxBasePower 100 for Hard Press, 120 for others
 */
export class OpponentHighHpPowerAttr extends VariablePowerAttr {
  maxBasePower: number;

  constructor(maxBasePower: number) {
    super();
    this.maxBasePower = maxBasePower;
  }

  /**
   * Changes the base power of the move to be the target's HP ratio times the maxBasePower with a min value of 1
   * @param user n/a
   * @param target the Pokemon being attacked
   * @param move n/a
   * @param args holds the base power of the move at args[0]
   * @returns true
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    (args[0] as Utils.NumberHolder).value = Utils.toDmgValue(this.maxBasePower * target.getHpRatio());

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
      if (rand < magnitudeThresholds[m]) {
        break;
      }
    }

    message = i18next.t("moveTriggers:magnitudeMessage", {magnitude: m + 4});
  }, user.scene.currentBattle.turn << 6, user.scene.waveSeed);
  return message!;
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
      if (rand! < magnitudeThresholds[m]) {
        break;
      }
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

    const friendshipPower = Math.floor(Math.min(user instanceof PlayerPokemon ? user.friendship : user.species.baseFriendship, 255) / 2.5);
    power.value = Math.max(!this.invert ? friendshipPower : 102 - friendshipPower, 1);

    return true;
  }
}

export class HitCountPowerAttr extends VariablePowerAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    (args[0] as Utils.NumberHolder).value += Math.min(user.battleData.hitCount, 6) * 50;

    return true;
  }
}

/**
 * Tallies the number of positive stages for a given {@linkcode Pokemon}.
 * @param pokemon The {@linkcode Pokemon} that is being used to calculate the count of positive stats
 * @returns the amount of positive stats
 */
const countPositiveStatStages = (pokemon: Pokemon): number => {
  return pokemon.getStatStages().reduce((total, stat) => (stat && stat > 0) ? total + stat : total, 0);
};

/**
 * Attribute that increases power based on the amount of positive stat stage increases.
 */
export class PositiveStatStagePowerAttr extends VariablePowerAttr {

  /**
   * @param {Pokemon} user The pokemon that is being used to calculate the amount of positive stats
   * @param {Pokemon} target N/A
   * @param {Move} move N/A
   * @param {any[]} args The argument for VariablePowerAttr, accumulates and sets the amount of power multiplied by stats
   * @returns {boolean} Returns true if attribute is applied
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const positiveStatStages: number = countPositiveStatStages(user);

    (args[0] as Utils.NumberHolder).value += positiveStatStages * 20;
    return true;
  }
}

/**
 * Punishment normally has a base power of 60,
 * but gains 20 power for every increased stat stage the target has,
 * up to a maximum of 200 base power in total.
 */
export class PunishmentPowerAttr extends VariablePowerAttr {
  private PUNISHMENT_MIN_BASE_POWER = 60;
  private PUNISHMENT_MAX_BASE_POWER = 200;

  /**
     * @param {Pokemon} user N/A
     * @param {Pokemon} target The pokemon that the move is being used against, as well as calculating the stats for the min/max base power
     * @param {Move} move N/A
     * @param {any[]} args The value that is being changed due to VariablePowerAttr
     * @returns Returns true if attribute is applied
     */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const positiveStatStages: number = countPositiveStatStages(target);
    (args[0] as Utils.NumberHolder).value = Math.min(
      this.PUNISHMENT_MAX_BASE_POWER,
      this.PUNISHMENT_MIN_BASE_POWER + positiveStatStages * 20
    );
    return true;
  }
}

export class PresentPowerAttr extends VariablePowerAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    /**
     * If this move is multi-hit, and this attribute is applied to any hit
     * other than the first, this move cannot result in a heal.
     */
    const firstHit = (user.turnData.hitCount === user.turnData.hitsLeft);

    const powerSeed = Utils.randSeedInt(firstHit ? 100 : 80);
    if (powerSeed <= 40) {
      (args[0] as Utils.NumberHolder).value = 40;
    } else if (40 < powerSeed && powerSeed <= 70) {
      (args[0] as Utils.NumberHolder).value = 80;
    } else if (70 < powerSeed && powerSeed <= 80) {
      (args[0] as Utils.NumberHolder).value = 120;
    } else if (80 < powerSeed && powerSeed <= 100) {
      // If this move is multi-hit, disable all other hits
      user.stopMultiHit();
      target.scene.unshiftPhase(new PokemonHealPhase(target.scene, target.getBattlerIndex(),
        Utils.toDmgValue(target.getMaxHp() / 4), i18next.t("moveTriggers:regainedHealth", {pokemonName: getPokemonNameWithAffix(target)}), true));
    }

    return true;
  }
}

export class WaterShurikenPowerAttr extends VariablePowerAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (user.species.speciesId === Species.GRENINJA && user.hasAbility(Abilities.BATTLE_BOND) && user.formIndex === 2) {
      (args[0] as Utils.IntegerHolder).value = 20;
      return true;
    }
    return false;
  }
}

/**
 * Attribute used to calculate the power of attacks that scale with Stockpile stacks (i.e. Spit Up).
 */
export class SpitUpPowerAttr extends VariablePowerAttr {
  private multiplier: number = 0;

  constructor(multiplier: number) {
    super();
    this.multiplier = multiplier;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const stockpilingTag = user.getTag(StockpilingTag);

    if (stockpilingTag !== null && stockpilingTag.stockpiledCount > 0) {
      const power = args[0] as Utils.IntegerHolder;
      power.value = this.multiplier * stockpilingTag.stockpiledCount;
      return true;
    }

    return false;
  }
}

/**
 * Attribute used to apply Swallow's healing, which scales with Stockpile stacks.
 * Does NOT remove stockpiled stacks.
 */
export class SwallowHealAttr extends HealAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const stockpilingTag = user.getTag(StockpilingTag);

    if (stockpilingTag !== null && stockpilingTag?.stockpiledCount > 0) {
      const stockpiled = stockpilingTag.stockpiledCount;
      let healRatio: number;

      if (stockpiled === 1) {
        healRatio = 0.25;
      } else if (stockpiled === 2) {
        healRatio = 0.50;
      } else { // stockpiled >= 3
        healRatio = 1.00;
      }

      if (healRatio) {
        this.addHealPhase(user, healRatio);
        return true;
      }
    }

    return false;
  }
}

const hasStockpileStacksCondition: MoveConditionFunc = (user) => {
  const hasStockpilingTag = user.getTag(StockpilingTag);
  return !!hasStockpilingTag && hasStockpilingTag.stockpiledCount > 0;
};

/**
 * Attribute used for multi-hit moves that increase power in increments of the
 * move's base power for each hit, namely Triple Kick and Triple Axel.
 * @extends VariablePowerAttr
 * @see {@linkcode apply}
 */
export class MultiHitPowerIncrementAttr extends VariablePowerAttr {
  /** The max number of base power increments allowed for this move */
  private maxHits: integer;

  constructor(maxHits: integer) {
    super();

    this.maxHits = maxHits;
  }

  /**
   * Increases power of move in increments of the base power for the amount of times
   * the move hit. In the case that the move is extended, it will circle back to the
   * original base power of the move after incrementing past the maximum amount of
   * hits.
   * @param user {@linkcode Pokemon} that used the move
   * @param target {@linkcode Pokemon} that the move was used on
   * @param move {@linkcode Move} with this attribute
   * @param args [0] {@linkcode Utils.NumberHolder} for final calculated power of move
   * @returns true if attribute application succeeds
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const hitsTotal = user.turnData.hitCount - Math.max(user.turnData.hitsLeft, 0);
    const power = args[0] as Utils.NumberHolder;

    power.value = move.power * (1 + hitsTotal % this.maxHits);

    return true;
  }
}

/**
 * Attribute used for moves that double in power if the given move immediately
 * preceded the move applying the attribute, namely Fusion Flare and
 * Fusion Bolt.
 * @extends VariablePowerAttr
 * @see {@linkcode apply}
 */
export class LastMoveDoublePowerAttr extends VariablePowerAttr {
  /** The move that must precede the current move */
  private move: Moves;

  constructor(move: Moves) {
    super();

    this.move = move;
  }

  /**
   * Doubles power of move if the given move is found to precede the current
   * move with no other moves being executed in between, only ignoring failed
   * moves if any.
   * @param user {@linkcode Pokemon} that used the move
   * @param target N/A
   * @param move N/A
   * @param args [0] {@linkcode Utils.NumberHolder} that holds the resulting power of the move
   * @returns true if attribute application succeeds, false otherwise
   */
  apply(user: Pokemon, _target: Pokemon, _move: Move, args: any[]): boolean {
    const power = args[0] as Utils.NumberHolder;
    const enemy = user.getOpponent(0);
    const pokemonActed: Pokemon[] = [];

    if (enemy?.turnData.acted) {
      pokemonActed.push(enemy);
    }

    if (user.scene.currentBattle.double) {
      const userAlly = user.getAlly();
      const enemyAlly = enemy?.getAlly();

      if (userAlly && userAlly.turnData.acted) {
        pokemonActed.push(userAlly);
      }
      if (enemyAlly && enemyAlly.turnData.acted) {
        pokemonActed.push(enemyAlly);
      }
    }

    pokemonActed.sort((a, b) => b.turnData.order - a.turnData.order);

    for (const p of pokemonActed) {
      const [ lastMove ] = p.getLastXMoves(1);
      if (lastMove.result !== MoveResult.FAIL) {
        if ((lastMove.result === MoveResult.SUCCESS) && (lastMove.move === this.move)) {
          power.value *= 2;
          return true;
        } else {
          break;
        }
      }
    }

    return false;
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
  constructor() {
    super();
  }
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    (args[0] as Utils.IntegerHolder).value = target.getEffectiveStat(Stat.ATK, target);
    return true;
  }
}

export class DefAtkAttr extends VariableAtkAttr {
  constructor() {
    super();
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    (args[0] as Utils.IntegerHolder).value = user.getEffectiveStat(Stat.DEF, target);
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
    (args[0] as Utils.IntegerHolder).value = target.getEffectiveStat(Stat.DEF, user);
    return true;
  }
}

export class VariableAccuracyAttr extends MoveAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    //const accuracy = args[0] as Utils.NumberHolder;
    return false;
  }
}

/**
 * Attribute used for Thunder and Hurricane that sets accuracy to 50 in sun and never miss in rain
 */
export class ThunderAccuracyAttr extends VariableAccuracyAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!user.scene.arena.weather?.isEffectSuppressed(user.scene)) {
      const accuracy = args[0] as Utils.NumberHolder;
      const weatherType = user.scene.arena.weather?.weatherType || WeatherType.NONE;
      switch (weatherType) {
      case WeatherType.SUNNY:
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

/**
 * Attribute used for Bleakwind Storm, Wildbolt Storm, and Sandsear Storm that sets accuracy to never
 * miss in rain
 * Springtide Storm does NOT have this property
 */
export class StormAccuracyAttr extends VariableAccuracyAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!user.scene.arena.weather?.isEffectSuppressed(user.scene)) {
      const accuracy = args[0] as Utils.NumberHolder;
      const weatherType = user.scene.arena.weather?.weatherType || WeatherType.NONE;
      switch (weatherType) {
      case WeatherType.RAIN:
      case WeatherType.HEAVY_RAIN:
        accuracy.value = -1;
        return true;
      }
    }

    return false;
  }
}

/**
 * Attribute used for moves which never miss
 * against Pokemon with the {@linkcode BattlerTagType.MINIMIZED}
 * @extends VariableAccuracyAttr
 * @see {@linkcode apply}
 */
export class MinimizeAccuracyAttr extends VariableAccuracyAttr {
  /**
   * @see {@linkcode apply}
   * @param user N/A
   * @param target {@linkcode Pokemon} target of the move
   * @param move N/A
   * @param args [0] Accuracy of the move to be modified
   * @returns true if the function succeeds
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (target.getTag(BattlerTagType.MINIMIZED)) {
      const accuracy = args[0] as Utils.NumberHolder;
      accuracy.value = -1;

      return true;
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
    const category = (args[0] as Utils.NumberHolder);

    if (user.getEffectiveStat(Stat.ATK, target, move) > user.getEffectiveStat(Stat.SPATK, target, move)) {
      category.value = MoveCategory.PHYSICAL;
      return true;
    }

    return false;
  }
}

export class TeraBlastCategoryAttr extends VariableMoveCategoryAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const category = (args[0] as Utils.NumberHolder);

    if (user.isTerastallized() && user.getEffectiveStat(Stat.ATK, target, move) > user.getEffectiveStat(Stat.SPATK, target, move)) {
      category.value = MoveCategory.PHYSICAL;
      return true;
    }

    return false;
  }
}

/**
 * Increases the power of Tera Blast if the user is Terastallized into Stellar type
 * @extends VariablePowerAttr
 */
export class TeraBlastPowerAttr extends VariablePowerAttr {
  /**
   * Sets Tera Blast's power to 100 if the user is terastallized with
   * the Stellar tera type.
   * @param user {@linkcode Pokemon} the Pokemon using this move
   * @param target n/a
   * @param move {@linkcode Move} the Move with this attribute (i.e. Tera Blast)
   * @param args
   *   - [0] {@linkcode Utils.NumberHolder} the applied move's power, factoring in
   *       previously applied power modifiers.
   * @returns
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const power = args[0] as Utils.NumberHolder;
    if (user.isTerastallized() && user.getTeraType() === Type.STELLAR) {
      power.value = 100;
      return true;
    }

    return false;
  }
}

/**
 * Change the move category to status when used on the ally
 * @extends VariableMoveCategoryAttr
 * @see {@linkcode apply}
 */
export class StatusCategoryOnAllyAttr extends VariableMoveCategoryAttr {
  /**
   * @param user {@linkcode Pokemon} using the move
   * @param target {@linkcode Pokemon} target of the move
   * @param move {@linkcode Move} with this attribute
   * @param args [0] {@linkcode Utils.IntegerHolder} The category of the move
   * @returns true if the function succeeds
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const category = (args[0] as Utils.IntegerHolder);

    if (user.getAlly() === target) {
      category.value = MoveCategory.STATUS;
      return true;
    }

    return false;
  }
}

export class ShellSideArmCategoryAttr extends VariableMoveCategoryAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const category = (args[0] as Utils.IntegerHolder);
    const atkRatio = user.getEffectiveStat(Stat.ATK, target, move) / target.getEffectiveStat(Stat.DEF, user, move);
    const specialRatio = user.getEffectiveStat(Stat.SPATK, target, move) / target.getEffectiveStat(Stat.SPDEF, user, move);

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

export class FormChangeItemTypeAttr extends VariableMoveTypeAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const moveType = args[0];
    if (!(moveType instanceof Utils.NumberHolder)) {
      return false;
    }

    if ([user.species.speciesId, user.fusionSpecies?.speciesId].includes(Species.ARCEUS) || [user.species.speciesId, user.fusionSpecies?.speciesId].includes(Species.SILVALLY)) {
      const form = user.species.speciesId === Species.ARCEUS || user.species.speciesId === Species.SILVALLY ? user.formIndex : user.fusionSpecies?.formIndex!; // TODO: is this bang correct?

      moveType.value = Type[Type[form]];
      return true;
    }

    return false;
  }
}

export class TechnoBlastTypeAttr extends VariableMoveTypeAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const moveType = args[0];
    if (!(moveType instanceof Utils.NumberHolder)) {
      return false;
    }

    if ([user.species.speciesId, user.fusionSpecies?.speciesId].includes(Species.GENESECT)) {
      const form = user.species.speciesId === Species.GENESECT ? user.formIndex : user.fusionSpecies?.formIndex;

      switch (form) {
      case 1: // Shock Drive
        moveType.value = Type.ELECTRIC;
        break;
      case 2: // Burn Drive
        moveType.value = Type.FIRE;
        break;
      case 3: // Chill Drive
        moveType.value = Type.ICE;
        break;
      case 4: // Douse Drive
        moveType.value = Type.WATER;
        break;
      default:
        moveType.value = Type.NORMAL;
        break;
      }
      return true;
    }

    return false;
  }
}

export class AuraWheelTypeAttr extends VariableMoveTypeAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const moveType = args[0];
    if (!(moveType instanceof Utils.NumberHolder)) {
      return false;
    }

    if ([user.species.speciesId, user.fusionSpecies?.speciesId].includes(Species.MORPEKO)) {
      const form = user.species.speciesId === Species.MORPEKO ? user.formIndex : user.fusionSpecies?.formIndex;

      switch (form) {
      case 1: // Hangry Mode
        moveType.value = Type.DARK;
        break;
      default: // Full Belly Mode
        moveType.value = Type.ELECTRIC;
        break;
      }
      return true;
    }

    return false;
  }
}

export class RagingBullTypeAttr extends VariableMoveTypeAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const moveType = args[0];
    if (!(moveType instanceof Utils.NumberHolder)) {
      return false;
    }

    if ([user.species.speciesId, user.fusionSpecies?.speciesId].includes(Species.PALDEA_TAUROS)) {
      const form = user.species.speciesId === Species.PALDEA_TAUROS ? user.formIndex : user.fusionSpecies?.formIndex;

      switch (form) {
      case 1: // Blaze breed
        moveType.value = Type.FIRE;
        break;
      case 2: // Aqua breed
        moveType.value = Type.WATER;
        break;
      default:
        moveType.value = Type.FIGHTING;
        break;
      }
      return true;
    }

    return false;
  }
}

export class IvyCudgelTypeAttr extends VariableMoveTypeAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const moveType = args[0];
    if (!(moveType instanceof Utils.NumberHolder)) {
      return false;
    }

    if ([user.species.speciesId, user.fusionSpecies?.speciesId].includes(Species.OGERPON)) {
      const form = user.species.speciesId === Species.OGERPON ? user.formIndex : user.fusionSpecies?.formIndex;

      switch (form) {
      case 1: // Wellspring Mask
      case 5: // Wellspring Mask Tera
        moveType.value = Type.WATER;
        break;
      case 2: // Hearthflame Mask
      case 6: // Hearthflame Mask Tera
        moveType.value = Type.FIRE;
        break;
      case 3: // Cornerstone Mask
      case 7: // Cornerstone Mask Tera
        moveType.value = Type.ROCK;
        break;
      case 4: // Teal Mask Tera
      default:
        moveType.value = Type.GRASS;
        break;
      }
      return true;
    }

    return false;
  }
}

export class WeatherBallTypeAttr extends VariableMoveTypeAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const moveType = args[0];
    if (!(moveType instanceof Utils.NumberHolder)) {
      return false;
    }

    if (!user.scene.arena.weather?.isEffectSuppressed(user.scene)) {
      switch (user.scene.arena.weather?.weatherType) {
      case WeatherType.SUNNY:
      case WeatherType.HARSH_SUN:
        moveType.value = Type.FIRE;
        break;
      case WeatherType.RAIN:
      case WeatherType.HEAVY_RAIN:
        moveType.value = Type.WATER;
        break;
      case WeatherType.SANDSTORM:
        moveType.value = Type.ROCK;
        break;
      case WeatherType.HAIL:
      case WeatherType.SNOW:
        moveType.value = Type.ICE;
        break;
      default:
        return false;
      }
      return true;
    }

    return false;
  }
}

/**
 * Changes the move's type to match the current terrain.
 * Has no effect if the user is not grounded.
 * @extends VariableMoveTypeAttr
 * @see {@linkcode apply}
 */
export class TerrainPulseTypeAttr extends VariableMoveTypeAttr {
  /**
   * @param user {@linkcode Pokemon} using this move
   * @param target N/A
   * @param move N/A
   * @param args [0] {@linkcode Utils.NumberHolder} The move's type to be modified
   * @returns true if the function succeeds
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const moveType = args[0];
    if (!(moveType instanceof Utils.NumberHolder)) {
      return false;
    }

    if (!user.isGrounded()) {
      return false;
    }

    const currentTerrain = user.scene.arena.getTerrainType();
    switch (currentTerrain) {
    case TerrainType.MISTY:
      moveType.value = Type.FAIRY;
      break;
    case TerrainType.ELECTRIC:
      moveType.value = Type.ELECTRIC;
      break;
    case TerrainType.GRASSY:
      moveType.value = Type.GRASS;
      break;
    case TerrainType.PSYCHIC:
      moveType.value = Type.PSYCHIC;
      break;
    default:
      return false;
    }
    return true;
  }
}

/**
 * Changes type based on the user's IVs
 * @extends VariableMoveTypeAttr
 */
export class HiddenPowerTypeAttr extends VariableMoveTypeAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const moveType = args[0];
    if (!(moveType instanceof Utils.NumberHolder)) {
      return false;
    }

    const iv_val = Math.floor(((user.ivs[Stat.HP] & 1)
      +(user.ivs[Stat.ATK] & 1) * 2
      +(user.ivs[Stat.DEF] & 1) * 4
      +(user.ivs[Stat.SPD] & 1) * 8
      +(user.ivs[Stat.SPATK] & 1) * 16
      +(user.ivs[Stat.SPDEF] & 1) * 32) * 15/63);

    moveType.value = [
      Type.FIGHTING, Type.FLYING, Type.POISON, Type.GROUND,
      Type.ROCK, Type.BUG, Type.GHOST, Type.STEEL,
      Type.FIRE, Type.WATER, Type.GRASS, Type.ELECTRIC,
      Type.PSYCHIC, Type.ICE, Type.DRAGON, Type.DARK][iv_val];

    return true;
  }
}

/**
 * Changes the type of Tera Blast to match the user's tera type
 * @extends VariableMoveTypeAttr
 */
export class TeraBlastTypeAttr extends VariableMoveTypeAttr {
  /**
   * @param user {@linkcode Pokemon} the user of the move
   * @param target {@linkcode Pokemon} N/A
   * @param move {@linkcode Move} the move with this attribute
   * @param args `[0]` the move's type to be modified
   * @returns `true` if the move's type was modified; `false` otherwise
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const moveType = args[0];
    if (!(moveType instanceof Utils.NumberHolder)) {
      return false;
    }

    if (user.isTerastallized()) {
      moveType.value = user.getTeraType(); // changes move type to tera type
      return true;
    }

    return false;
  }
}

export class MatchUserTypeAttr extends VariableMoveTypeAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const moveType = args[0];
    if (!(moveType instanceof Utils.NumberHolder)) {
      return false;
    }
    const userTypes = user.getTypes(true);

    if (userTypes.includes(Type.STELLAR)) { // will not change to stellar type
      const nonTeraTypes = user.getTypes();
      moveType.value = nonTeraTypes[0];
      return true;
    } else if (userTypes.length > 0) {
      moveType.value = userTypes[0];
      return true;
    } else {
      return false;
    }

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
      //When a flying type is hit, the first hit is always 1x multiplier.
      if (target.isOfType(Type.FLYING)) {
        multiplier.value = 1;
      }
      return true;
    }

    return false;
  }
}

export class WaterSuperEffectTypeMultiplierAttr extends VariableMoveTypeMultiplierAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const multiplier = args[0] as Utils.NumberHolder;
    if (target.isOfType(Type.WATER)) {
      const effectivenessAgainstWater = new Utils.NumberHolder(getTypeDamageMultiplier(move.type, Type.WATER));
      applyChallenges(user.scene.gameMode, ChallengeType.TYPE_EFFECTIVENESS, effectivenessAgainstWater);
      if (effectivenessAgainstWater.value !== 0) {
        multiplier.value *= 2 / effectivenessAgainstWater.value;
        return true;
      }
    }

    return false;
  }
}

export class IceNoEffectTypeAttr extends VariableMoveTypeMultiplierAttr {
  /**
   * Checks to see if the Target is Ice-Type or not. If so, the move will have no effect.
   * @param {Pokemon} user N/A
   * @param {Pokemon} target Pokemon that is being checked whether Ice-Type or not.
   * @param {Move} move N/A
   * @param {any[]} args Sets to false if the target is Ice-Type, so it should do no damage/no effect.
   * @returns {boolean} Returns true if move is successful, false if Ice-Type.
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (target.isOfType(Type.ICE)) {
      (args[0] as Utils.BooleanHolder).value = false;
      return false;
    }
    return true;
  }
}

export class FlyingTypeMultiplierAttr extends VariableMoveTypeMultiplierAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const multiplier = args[0] as Utils.NumberHolder;
    multiplier.value *= target.getAttackTypeEffectiveness(Type.FLYING, user);
    return true;
  }
}

export class OneHitKOAccuracyAttr extends VariableAccuracyAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const accuracy = args[0] as Utils.NumberHolder;
    if (user.level < target.level) {
      accuracy.value = 0;
    } else {
      accuracy.value = Math.min(Math.max(30 + 100 * (1 - target.level / user.level), 0), 100);
    }
    return true;
  }
}

export class SheerColdAccuracyAttr extends OneHitKOAccuracyAttr {
  /**
   * Changes the normal One Hit KO Accuracy Attr to implement the Gen VII changes,
   * where if the user is Ice-Type, it has more accuracy.
   * @param {Pokemon} user Pokemon that is using the move; checks the Pokemon's level.
   * @param {Pokemon} target Pokemon that is receiving the move; checks the Pokemon's level.
   * @param {Move} move N/A
   * @param {any[]} args Uses the accuracy argument, allowing to change it from either 0 if it doesn't pass
   * the first if/else, or 30/20 depending on the type of the user Pokemon.
   * @returns Returns true if move is successful, false if misses.
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const accuracy = args[0] as Utils.NumberHolder;
    if (user.level < target.level) {
      accuracy.value = 0;
    } else {
      const baseAccuracy = user.isOfType(Type.ICE) ? 30 : 20;
      accuracy.value = Math.min(Math.max(baseAccuracy + 100 * (1 - target.level / user.level), 0), 100);
    }
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
  if (cancelled.value) {
    return false;
  }

  user.damageAndUpdate(Utils.toDmgValue(user.getMaxHp() / 2), HitResult.OTHER, false, true);
  user.scene.queueMessage(i18next.t("moveTriggers:keptGoingAndCrashed", {pokemonName: getPokemonNameWithAffix(user)}));
  user.turnData.damageTaken += Utils.toDmgValue(user.getMaxHp() / 2);

  return true;
};

export class TypelessAttr extends MoveAttr { }
/**
* Attribute used for moves which ignore redirection effects, and always target their original target, i.e. Snipe Shot
* Bypasses Storm Drain, Follow Me, Ally Switch, and the like.
*/
export class BypassRedirectAttr extends MoveAttr { }

export class FrenzyAttr extends MoveEffectAttr {
  constructor() {
    super(true, MoveEffectTrigger.HIT, false, true);
  }

  canApply(user: Pokemon, target: Pokemon, move: Move, args: any[]) {
    return !(this.selfTarget ? user : target).isFainted();
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    if (!user.getTag(BattlerTagType.FRENZY) && !user.getMoveQueue().length) {
      const turnCount = user.randSeedIntRange(1, 2);
      new Array(turnCount).fill(null).map(() => user.getMoveQueue().push({ move: move.id, targets: [ target.getBattlerIndex() ], ignorePP: true }));
      user.addTag(BattlerTagType.FRENZY, turnCount, move.id, user.id);
    } else {
      applyMoveAttrs(AddBattlerTagAttr, user, target, move, args);
      user.lapseTag(BattlerTagType.FRENZY); // if FRENZY is already in effect (moveQueue.length > 0), lapse the tag
    }

    return true;
  }
}

export const frenzyMissFunc: UserMoveConditionFunc = (user: Pokemon, move: Move) => {
  while (user.getMoveQueue().length && user.getMoveQueue()[0].move === move.id) {
    user.getMoveQueue().shift();
  }
  user.removeTag(BattlerTagType.FRENZY); // FRENZY tag should be disrupted on miss/no effect

  return true;
};

export class AddBattlerTagAttr extends MoveEffectAttr {
  public tagType: BattlerTagType;
  public turnCountMin: integer;
  public turnCountMax: integer;
  protected cancelOnFail: boolean;
  private failOnOverlap: boolean;

  constructor(tagType: BattlerTagType, selfTarget: boolean = false, failOnOverlap: boolean = false, turnCountMin: integer = 0, turnCountMax?: integer, lastHitOnly: boolean = false, cancelOnFail: boolean = false) {
    super(selfTarget, MoveEffectTrigger.POST_APPLY, false, lastHitOnly);

    this.tagType = tagType;
    this.turnCountMin = turnCountMin;
    this.turnCountMax = turnCountMax !== undefined ? turnCountMax : turnCountMin;
    this.failOnOverlap = !!failOnOverlap;
    this.cancelOnFail = cancelOnFail;
  }

  canApply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.canApply(user, target, move, args) || (this.cancelOnFail === true && user.getLastXMoves(1)[0].result === MoveResult.FAIL)) {
      return false;
    } else {
      return true;
    }
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const moveChance = this.getMoveChance(user, target, move, this.selfTarget, true);
    if (moveChance < 0 || moveChance === 100 || user.randSeedInt(100) < moveChance) {
      return (this.selfTarget ? user : target).addTag(this.tagType,  user.randSeedIntRange(this.turnCountMin, this.turnCountMax), move.id, user.id);
    }

    return false;
  }

  getCondition(): MoveConditionFunc | null {
    return this.failOnOverlap
      ? (user, target, move) => !(this.selfTarget ? user : target).getTag(this.tagType)
      : null;
  }

  getTagTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer | void {
    switch (this.tagType) {
    case BattlerTagType.RECHARGING:
    case BattlerTagType.PERISH_SONG:
      return -16;
    case BattlerTagType.FLINCHED:
    case BattlerTagType.CONFUSED:
    case BattlerTagType.INFATUATED:
    case BattlerTagType.NIGHTMARE:
    case BattlerTagType.DROWSY:
    case BattlerTagType.DISABLED:
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
    case BattlerTagType.MINIMIZED:
      return 0;
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
    let moveChance = this.getMoveChance(user, target, move, this.selfTarget, false);
    if (moveChance < 0) {
      moveChance = 100;
    }
    return Math.floor(this.getTagTargetBenefitScore(user, target, move)! * (moveChance / 100)); // TODO: is the bang correct?
  }
}

/**
 * Adds the appropriate battler tag for Gulp Missile when Surf or Dive is used.
 * @extends MoveEffectAttr
 */
export class GulpMissileTagAttr extends MoveEffectAttr {
  constructor() {
    super(true);
  }

  /**
   * Adds BattlerTagType from GulpMissileTag based on the Pokemon's HP ratio.
   * @param {Pokemon} user The Pokemon using the move.
   * @param {Pokemon} target The Pokemon being targeted by the move.
   * @param {Move} move The move being used.
   * @param {any[]} args Additional arguments, if any.
   * @returns Whether the BattlerTag is applied.
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean | Promise<boolean> {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    if (user.hasAbility(Abilities.GULP_MISSILE) && user.species.speciesId === Species.CRAMORANT) {
      if (user.getHpRatio() >= .5) {
        user.addTag(BattlerTagType.GULP_MISSILE_ARROKUDA, 0, move.id);
      } else {
        user.addTag(BattlerTagType.GULP_MISSILE_PIKACHU, 0, move.id);
      }
      return true;
    }

    return false;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    const isCramorant = user.hasAbility(Abilities.GULP_MISSILE) && user.species.speciesId === Species.CRAMORANT;
    return isCramorant && !user.getTag(GulpMissileTag) ? 10 : 0;
  }
}

/**
 * Attribute to implement Jaw Lock's linked trapping effect between the user and target
 * @extends AddBattlerTagAttr
 */
export class JawLockAttr extends AddBattlerTagAttr {
  constructor() {
    super(BattlerTagType.TRAPPED);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.canApply(user, target, move, args)) {
      return false;
    }

    // If either the user or the target already has the tag, do not apply
    if (user.getTag(TrappedTag) || target.getTag(TrappedTag)) {
      return false;
    }

    const moveChance = this.getMoveChance(user, target, move, this.selfTarget);
    if (moveChance < 0 || moveChance === 100 || user.randSeedInt(100) < moveChance) {
      /**
       * Add the tag to both the user and the target.
       * The target's tag source is considered to be the user and vice versa
       */
      return target.addTag(BattlerTagType.TRAPPED, 1, move.id, user.id)
          && user.addTag(BattlerTagType.TRAPPED, 1, move.id, target.id);
    }

    return false;
  }
}

export class CurseAttr extends MoveEffectAttr {

  apply(user: Pokemon, target: Pokemon, move:Move, args: any[]): boolean {
    if (user.getTypes(true).includes(Type.GHOST)) {
      if (target.getTag(BattlerTagType.CURSED)) {
        user.scene.queueMessage(i18next.t("battle:attackFailed"));
        return false;
      }
      const curseRecoilDamage = Math.max(1, Math.floor(user.getMaxHp() / 2));
      user.damageAndUpdate(curseRecoilDamage, HitResult.OTHER, false, true, true);
      user.scene.queueMessage(
        i18next.t("battlerTags:cursedOnAdd", {
          pokemonNameWithAffix: getPokemonNameWithAffix(user),
          pokemonName: getPokemonNameWithAffix(target)
        })
      );

      target.addTag(BattlerTagType.CURSED, 0, move.id, user.id);
      return true;
    } else {
      user.scene.unshiftPhase(new StatStageChangePhase(user.scene, user.getBattlerIndex(), true, [ Stat.ATK, Stat.DEF], 1));
      user.scene.unshiftPhase(new StatStageChangePhase(user.scene, user.getBattlerIndex(), true, [ Stat.SPD ], -1));
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
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    for (const tagType of this.tagTypes) {
      (this.selfTarget ? user : target).lapseTag(tagType);
    }

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
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    for (const tagType of this.tagTypes) {
      (this.selfTarget ? user : target).removeTag(tagType);
    }

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

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!this.selfTarget && target.scene.arena.getTagOnSide(ArenaTagType.SAFEGUARD, target.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY)) {
      if (move.category === MoveCategory.STATUS) {
        user.scene.queueMessage(i18next.t("moveTriggers:safeguard", { targetName: getPokemonNameWithAffix(target)}));
      }
      return false;
    }

    return super.apply(user, target, move, args);
  }
}

export class RechargeAttr extends AddBattlerTagAttr {
  constructor() {
    super(BattlerTagType.RECHARGING, true, false, 1, 1, true, true);
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
      let turnMove: TurnMove | undefined;

      while (moveHistory.length) {
        turnMove = moveHistory.shift();
        if (!allMoves[turnMove?.move!].hasAttr(ProtectAttr) || turnMove?.result !== MoveResult.SUCCESS) { // TODO: is the bang correct?
          break;
        }
        timesUsed++;
      }
      if (timesUsed) {
        return !user.randSeedInt(Math.pow(3, timesUsed));
      }
      return true;
    });
  }
}

export class IgnoreAccuracyAttr extends AddBattlerTagAttr {
  constructor() {
    super(BattlerTagType.IGNORE_ACCURACY, true, false, 2);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    user.scene.queueMessage(i18next.t("moveTriggers:tookAimAtTarget", {pokemonName: getPokemonNameWithAffix(user), targetName: getPokemonNameWithAffix(target)}));

    return true;
  }
}

export class FaintCountdownAttr extends AddBattlerTagAttr {
  constructor() {
    super(BattlerTagType.PERISH_SONG, false, true, 4);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    user.scene.queueMessage(i18next.t("moveTriggers:faintCountdown", {pokemonName: getPokemonNameWithAffix(target), turnCount: this.turnCountMin - 1}));

    return true;
  }
}

/**
 * Attribute used when a move hits a {@linkcode BattlerTagType} for double damage
 * @extends MoveAttr
*/
export class HitsTagAttr extends MoveAttr {
  /** The {@linkcode BattlerTagType} this move hits */
  public tagType: BattlerTagType;
  /** Should this move deal double damage against {@linkcode HitsTagAttr.tagType}? */
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
  public selfSideTarget: boolean;

  constructor(tagType: ArenaTagType, turnCount?: integer | null, failOnOverlap: boolean = false, selfSideTarget: boolean = false) {
    super(true, MoveEffectTrigger.POST_APPLY);

    this.tagType = tagType;
    this.turnCount = turnCount!; // TODO: is the bang correct?
    this.failOnOverlap = failOnOverlap;
    this.selfSideTarget = selfSideTarget;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    if (move.chance < 0 || move.chance === 100 || user.randSeedInt(100) < move.chance) {
      user.scene.arena.addTag(this.tagType, this.turnCount, move.id, user.id, (this.selfSideTarget ? user : target).isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY);
      return true;
    }

    return false;
  }

  getCondition(): MoveConditionFunc | null {
    return this.failOnOverlap
      ? (user, target, move) => !user.scene.arena.getTagOnSide(this.tagType, target.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY)
      : null;
  }
}

/**
 * Generic class for removing arena tags
 * @param tagTypes: The types of tags that can be removed
 * @param selfSideTarget: Is the user removing tags from its own side?
 */
export class RemoveArenaTagsAttr extends MoveEffectAttr {
  public tagTypes: ArenaTagType[];
  public selfSideTarget: boolean;

  constructor(tagTypes: ArenaTagType[], selfSideTarget: boolean) {
    super(true, MoveEffectTrigger.POST_APPLY);

    this.tagTypes = tagTypes;
    this.selfSideTarget = selfSideTarget;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const side = (this.selfSideTarget ? user : target).isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY;

    for (const tagType of this.tagTypes) {
      user.scene.arena.removeTagOnSide(tagType, side);
    }

    return true;
  }
}

export class AddArenaTrapTagAttr extends AddArenaTagAttr {
  getCondition(): MoveConditionFunc {
    return (user, target, move) => {
      const side = (this.selfSideTarget ? user : target).isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY;
      const tag = user.scene.arena.getTagOnSide(this.tagType, side) as ArenaTrapTag;
      if (!tag) {
        return true;
      }
      return tag.layers < tag.maxLayers;
    };
  }
}

/**
 * Attribute used for Stone Axe and Ceaseless Edge.
 * Applies the given ArenaTrapTag when move is used.
 * @extends AddArenaTagAttr
 * @see {@linkcode apply}
 */
export class AddArenaTrapTagHitAttr extends AddArenaTagAttr {
  /**
   * @param user {@linkcode Pokemon} using this move
   * @param target {@linkcode Pokemon} target of this move
   * @param move {@linkcode Move} being used
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const moveChance = this.getMoveChance(user, target, move, this.selfTarget, true);
    const side = (this.selfSideTarget ? user : target).isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY;
    const tag = user.scene.arena.getTagOnSide(this.tagType, side) as ArenaTrapTag;
    if ((moveChance < 0 || moveChance === 100 || user.randSeedInt(100) < moveChance) && user.getLastXMoves(1)[0].result === MoveResult.SUCCESS) {
      user.scene.arena.addTag(this.tagType, 0, move.id, user.id, side);
      if (!tag) {
        return true;
      }
      return tag.layers < tag.maxLayers;
    }
    return false;
  }
}

export class RemoveArenaTrapAttr extends MoveEffectAttr {

  private targetBothSides: boolean;

  constructor(targetBothSides: boolean = false) {
    super(true, MoveEffectTrigger.PRE_APPLY);
    this.targetBothSides = targetBothSides;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {

    if (!super.apply(user, target, move, args)) {
      return false;
    }

    if (this.targetBothSides) {
      user.scene.arena.removeTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.PLAYER);
      user.scene.arena.removeTagOnSide(ArenaTagType.TOXIC_SPIKES, ArenaTagSide.PLAYER);
      user.scene.arena.removeTagOnSide(ArenaTagType.STEALTH_ROCK, ArenaTagSide.PLAYER);
      user.scene.arena.removeTagOnSide(ArenaTagType.STICKY_WEB, ArenaTagSide.PLAYER);

      user.scene.arena.removeTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.ENEMY);
      user.scene.arena.removeTagOnSide(ArenaTagType.TOXIC_SPIKES, ArenaTagSide.ENEMY);
      user.scene.arena.removeTagOnSide(ArenaTagType.STEALTH_ROCK, ArenaTagSide.ENEMY);
      user.scene.arena.removeTagOnSide(ArenaTagType.STICKY_WEB, ArenaTagSide.ENEMY);
    } else {
      user.scene.arena.removeTagOnSide(ArenaTagType.SPIKES, target.isPlayer() ? ArenaTagSide.ENEMY : ArenaTagSide.PLAYER);
      user.scene.arena.removeTagOnSide(ArenaTagType.TOXIC_SPIKES, target.isPlayer() ? ArenaTagSide.ENEMY : ArenaTagSide.PLAYER);
      user.scene.arena.removeTagOnSide(ArenaTagType.STEALTH_ROCK, target.isPlayer() ? ArenaTagSide.ENEMY : ArenaTagSide.PLAYER);
      user.scene.arena.removeTagOnSide(ArenaTagType.STICKY_WEB, target.isPlayer() ? ArenaTagSide.ENEMY : ArenaTagSide.PLAYER);
    }

    return true;
  }
}

export class RemoveScreensAttr extends MoveEffectAttr {

  private targetBothSides: boolean;

  constructor(targetBothSides: boolean = false) {
    super(true, MoveEffectTrigger.PRE_APPLY);
    this.targetBothSides = targetBothSides;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {

    if (!super.apply(user, target, move, args)) {
      return false;
    }

    if (this.targetBothSides) {
      user.scene.arena.removeTagOnSide(ArenaTagType.REFLECT, ArenaTagSide.PLAYER);
      user.scene.arena.removeTagOnSide(ArenaTagType.LIGHT_SCREEN, ArenaTagSide.PLAYER);
      user.scene.arena.removeTagOnSide(ArenaTagType.AURORA_VEIL, ArenaTagSide.PLAYER);

      user.scene.arena.removeTagOnSide(ArenaTagType.REFLECT, ArenaTagSide.ENEMY);
      user.scene.arena.removeTagOnSide(ArenaTagType.LIGHT_SCREEN, ArenaTagSide.ENEMY);
      user.scene.arena.removeTagOnSide(ArenaTagType.AURORA_VEIL, ArenaTagSide.ENEMY);
    } else {
      user.scene.arena.removeTagOnSide(ArenaTagType.REFLECT, target.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY);
      user.scene.arena.removeTagOnSide(ArenaTagType.LIGHT_SCREEN, target.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY);
      user.scene.arena.removeTagOnSide(ArenaTagType.AURORA_VEIL, target.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY);
    }

    return true;

  }
}

/*Swaps arena effects between the player and enemy side
  * @extends MoveEffectAttr
  * @see {@linkcode apply}
*/
export class SwapArenaTagsAttr extends MoveEffectAttr {
  public SwapTags: ArenaTagType[];


  constructor(SwapTags: ArenaTagType[]) {
    super(true, MoveEffectTrigger.POST_APPLY);
    this.SwapTags = SwapTags;
  }

  apply(user:Pokemon, target:Pokemon, move:Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const tagPlayerTemp = user.scene.arena.findTagsOnSide((t => this.SwapTags.includes(t.tagType)), ArenaTagSide.PLAYER);
    const tagEnemyTemp = user.scene.arena.findTagsOnSide((t => this.SwapTags.includes(t.tagType)), ArenaTagSide.ENEMY);


    if (tagPlayerTemp) {
      for (const swapTagsType of tagPlayerTemp) {
        user.scene.arena.removeTagOnSide(swapTagsType.tagType, ArenaTagSide.PLAYER, true);
        user.scene.arena.addTag(swapTagsType.tagType, swapTagsType.turnCount, swapTagsType.sourceMove, swapTagsType.sourceId!, ArenaTagSide.ENEMY, true); // TODO: is the bang correct?
      }
    }
    if (tagEnemyTemp) {
      for (const swapTagsType of tagEnemyTemp) {
        user.scene.arena.removeTagOnSide(swapTagsType.tagType, ArenaTagSide.ENEMY, true);
        user.scene.arena.addTag(swapTagsType.tagType, swapTagsType.turnCount, swapTagsType.sourceMove, swapTagsType.sourceId!, ArenaTagSide.PLAYER, true); // TODO: is the bang correct?
      }
    }


    user.scene.queueMessage(i18next.t("moveTriggers:swapArenaTags", {pokemonName: getPokemonNameWithAffix(user)}));
    return true;
  }
}

/**
 * Attribute used for Revival Blessing.
 * @extends MoveEffectAttr
 * @see {@linkcode apply}
 */
export class RevivalBlessingAttr extends MoveEffectAttr {
  constructor(user?: boolean) {
    super(true);
  }

  /**
   *
   * @param user {@linkcode Pokemon} using this move
   * @param target {@linkcode Pokemon} target of this move
   * @param move {@linkcode Move} being used
   * @param args N/A
   * @returns Promise, true if function succeeds.
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): Promise<boolean> {
    return new Promise(resolve => {
      // If user is player, checks if the user has fainted pokemon
      if (user instanceof PlayerPokemon
        && user.scene.getParty().findIndex(p => p.isFainted())>-1) {
        (user as PlayerPokemon).revivalBlessing().then(() => {
          resolve(true);
        });
      // If user is enemy, checks that it is a trainer, and it has fainted non-boss pokemon in party
      } else if (user instanceof EnemyPokemon
        && user.hasTrainer()
        && user.scene.getEnemyParty().findIndex(p => p.isFainted() && !p.isBoss()) > -1) {
        // Selects a random fainted pokemon
        const faintedPokemon = user.scene.getEnemyParty().filter(p => p.isFainted() && !p.isBoss());
        const pokemon = faintedPokemon[user.randSeedInt(faintedPokemon.length)];
        const slotIndex = user.scene.getEnemyParty().findIndex(p => pokemon.id === p.id);
        pokemon.resetStatus();
        pokemon.heal(Math.min(Utils.toDmgValue(0.5 * pokemon.getMaxHp()), pokemon.getMaxHp()));
        user.scene.queueMessage(i18next.t("moveTriggers:revivalBlessing", {pokemonName: getPokemonNameWithAffix(pokemon)}), 0, true);

        if (user.scene.currentBattle.double && user.scene.getEnemyParty().length > 1) {
          const allyPokemon = user.getAlly();
          if (slotIndex<=1) {
            user.scene.unshiftPhase(new SwitchSummonPhase(user.scene, pokemon.getFieldIndex(), slotIndex, false, false, false));
          } else if (allyPokemon.isFainted()) {
            user.scene.unshiftPhase(new SwitchSummonPhase(user.scene, allyPokemon.getFieldIndex(), slotIndex, false, false, false));
          }
        }
        resolve(true);
      } else {
        user.scene.queueMessage(i18next.t("battle:attackFailed"));
        resolve(false);
      }
    });
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    if (user.hasTrainer() && user.scene.getEnemyParty().findIndex(p => p.isFainted() && !p.isBoss()) > -1) {
      return 20;
    }

    return -20;
  }
}

export class ForceSwitchOutAttr extends MoveEffectAttr {
  private user: boolean;
  private batonPass: boolean;

  constructor(user?: boolean, batonPass?: boolean) {
    super(false, MoveEffectTrigger.POST_APPLY, false, true);
    this.user = !!user;
    this.batonPass = !!batonPass;
  }

  isBatonPass() {
    return this.batonPass;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): Promise<boolean> {
    return new Promise(resolve => {

  	// Check if the move category is not STATUS or if the switch out condition is not met
      if (!this.getSwitchOutCondition()(user, target, move)) {
        return resolve(false);
      }

  	// Move the switch out logic inside the conditional block
  	// This ensures that the switch out only happens when the conditions are met
	  const switchOutTarget = this.user ? user : target;
	  if (switchOutTarget instanceof PlayerPokemon) {
        switchOutTarget.leaveField(!this.batonPass);

        if (switchOutTarget.hp > 0) {
          user.scene.prependToPhase(new SwitchPhase(user.scene, switchOutTarget.getFieldIndex(), true, true), MoveEndPhase);
          resolve(true);
        } else {
          resolve(false);
        }
	  	return;
	  } else if (user.scene.currentBattle.battleType !== BattleType.WILD) {
	  	// Switch out logic for trainer battles
        switchOutTarget.leaveField(!this.batonPass);

	  	if (switchOutTarget.hp > 0) {
        // for opponent switching out
          user.scene.prependToPhase(new SwitchSummonPhase(user.scene, switchOutTarget.getFieldIndex(), (user.scene.currentBattle.trainer ? user.scene.currentBattle.trainer.getNextSummonIndex((switchOutTarget as EnemyPokemon).trainerSlot) : 0), false, this.batonPass, false), MoveEndPhase);
        }
	  } else {
	    // Switch out logic for everything else (eg: WILD battles)
	  	switchOutTarget.leaveField(false);

	  	if (switchOutTarget.hp) {
          switchOutTarget.setWildFlee(true);
	  	  user.scene.queueMessage(i18next.t("moveTriggers:fled", {pokemonName: getPokemonNameWithAffix(switchOutTarget)}), null, true, 500);

          // in double battles redirect potential moves off fled pokemon
          if (switchOutTarget.scene.currentBattle.double) {
            const allyPokemon = switchOutTarget.getAlly();
            switchOutTarget.scene.redirectPokemonMoves(switchOutTarget, allyPokemon);
          }
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
    return (user, target, move) => (move.category !== MoveCategory.STATUS || this.getSwitchOutCondition()(user, target, move));
  }

  getFailedText(user: Pokemon, target: Pokemon, move: Move, cancelled: Utils.BooleanHolder): string | null {
    const blockedByAbility = new Utils.BooleanHolder(false);
    applyAbAttrs(ForceSwitchOutImmunityAbAttr, target, blockedByAbility);
    return blockedByAbility.value ? i18next.t("moveTriggers:cannotBeSwitchedOut", {pokemonName: getPokemonNameWithAffix(target)}) : null;
  }

  getSwitchOutCondition(): MoveConditionFunc {
    return (user, target, move) => {
      const switchOutTarget = (this.user ? user : target);
      const player = switchOutTarget instanceof PlayerPokemon;

      if (!this.user && move.category === MoveCategory.STATUS && (target.hasAbilityWithAttr(ForceSwitchOutImmunityAbAttr) || target.isMax())) {
        return false;
      }

      if (!player && !user.scene.currentBattle.battleType) {
        if (this.batonPass) {
          return false;
        }
        // Don't allow wild opponents to flee on the boss stage since it can ruin a run early on
        if (!(user.scene.currentBattle.waveIndex % 10)) {
          return false;
        }
      }

      const party = player ? user.scene.getParty() : user.scene.getEnemyParty();
      return (!player && !user.scene.currentBattle.battleType) || party.filter(p => p.isAllowedInBattle() && (player || (p as EnemyPokemon).trainerSlot === (switchOutTarget as EnemyPokemon).trainerSlot)).length > user.scene.currentBattle.getBattlerCount();
    };
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    if (!user.scene.getEnemyParty().find(p => p.isActive() && !p.isOnField())) {
      return -20;
    }
    let ret = this.user ? Math.floor((1 - user.getHpRatio()) * 20) : super.getUserBenefitScore(user, target, move);
    if (this.user && this.batonPass) {
      const statStageTotal = user.getStatStages().reduce((s: integer, total: integer) => total += s, 0);
      ret = ret / 2 + (Phaser.Tweens.Builders.GetEaseFunction("Sine.easeOut")(Math.min(Math.abs(statStageTotal), 10) / 10) * (statStageTotal >= 0 ? 10 : -10));
    }
    return ret;
  }
}

export class RemoveTypeAttr extends MoveEffectAttr {

  private removedType: Type;
  private messageCallback: ((user: Pokemon) => void) | undefined;

  constructor(removedType: Type, messageCallback?: (user: Pokemon) => void) {
    super(true, MoveEffectTrigger.POST_TARGET);
    this.removedType = removedType;
    this.messageCallback = messageCallback;

  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    if (user.isTerastallized() && user.getTeraType() === this.removedType) { // active tera types cannot be removed
      return false;
    }

    const userTypes = user.getTypes(true);
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
    super(false);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    user.summonData.types = target.getTypes(true);
    user.updateInfo();

    user.scene.queueMessage(i18next.t("moveTriggers:copyType", {pokemonName: getPokemonNameWithAffix(user), targetPokemonName: getPokemonNameWithAffix(target)}));

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
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const biomeType = user.scene.arena.getTypeForBiome();

    user.summonData.types = [ biomeType ];
    user.updateInfo();

    user.scene.queueMessage(i18next.t("moveTriggers:transformedIntoType", {pokemonName: getPokemonNameWithAffix(user), typeName: i18next.t(`pokemonInfo:Type.${Type[biomeType]}`)}));

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

    user.scene.queueMessage(i18next.t("moveTriggers:transformedIntoType", {pokemonName: getPokemonNameWithAffix(target), typeName: i18next.t(`pokemonInfo:Type.${Type[this.type]}`)}));

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
    if (this.type !== Type.UNKNOWN) {
      types.push(this.type);
    }
    target.summonData.types = types;
    target.updateInfo();

    user.scene.queueMessage(i18next.t("moveTriggers:addType", {typeName: i18next.t(`pokemonInfo:Type.${Type[this.type]}`), pokemonName: getPokemonNameWithAffix(target)}));

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
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const firstMoveType = target.getMoveset()[0]?.getMove().type!; // TODO: is this bang correct?
    user.summonData.types = [ firstMoveType ];
    user.scene.queueMessage(i18next.t("battle:transformedIntoType", {pokemonName: getPokemonNameWithAffix(user), type: i18next.t(`pokemonInfo:Type.${Type[firstMoveType]}`)}));

    return true;
  }
}

export class RandomMovesetMoveAttr extends OverrideMoveEffectAttr {
  private enemyMoveset: boolean | null;

  constructor(enemyMoveset?: boolean) {
    super();

    this.enemyMoveset = enemyMoveset!; // TODO: is this bang correct?
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const moveset = (!this.enemyMoveset ? user : target).getMoveset();
    const moves = moveset.filter(m => !m?.getMove().hasFlag(MoveFlags.IGNORE_VIRTUAL));
    if (moves.length) {
      const move = moves[user.randSeedInt(moves.length)];
      const moveIndex = moveset.findIndex(m => m?.moveId === move?.moveId);
      const moveTargets = getMoveTargets(user, move?.moveId!); // TODO: is this bang correct?
      if (!moveTargets.targets.length) {
        return false;
      }
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
      user.getMoveQueue().push({ move: move?.moveId!, targets: targets, ignorePP: true }); // TODO: is this bang correct?
      user.scene.unshiftPhase(new MovePhase(user.scene, user, targets, moveset[moveIndex]!, true)); // There's a PR to re-do the move(s) that use this Attr, gonna put `!` for now
      return true;
    }

    return false;
  }
}

export class RandomMoveAttr extends OverrideMoveEffectAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): Promise<boolean> {
    return new Promise(resolve => {
      const moveIds = Utils.getEnumValues(Moves).filter(m => !allMoves[m].hasFlag(MoveFlags.IGNORE_VIRTUAL) && !allMoves[m].name.endsWith(" (N)"));
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
      let moveId;
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

  if (!copiableMove) {
    return false;
  }

  if (allMoves[copiableMove].hasAttr(ChargeAttr)) {
    return false;
  }

  // TODO: Add last turn of Bide

  return true;
};

export class CopyMoveAttr extends OverrideMoveEffectAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const lastMove = user.scene.currentBattle.lastMove;

    const moveTargets = getMoveTargets(user, lastMove);
    if (!moveTargets.targets.length) {
      return false;
    }

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

/**
 *  Attribute used for moves that reduce PP of the target's last used move.
 *  Used for Spite.
 */
export class ReducePpMoveAttr extends MoveEffectAttr {
  protected reduction: number;
  constructor(reduction: number) {
    super();
    this.reduction = reduction;
  }

  /**
   * Reduces the PP of the target's last-used move by an amount based on this attribute instance's {@linkcode reduction}.
   *
   * @param user {@linkcode Pokemon} that used the attack
   * @param target {@linkcode Pokemon} targeted by the attack
   * @param move {@linkcode Move} being used
   * @param args N/A
   * @returns {boolean} true
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    // Null checks can be skipped due to condition function
    const lastMove = target.getLastXMoves().find(() => true);
    const movesetMove = target.getMoveset().find(m => m?.moveId === lastMove?.move);
    const lastPpUsed = movesetMove?.ppUsed!; // TODO: is the bang correct?
    movesetMove!.ppUsed = Math.min((movesetMove?.ppUsed!) + this.reduction, movesetMove?.getMovePp()!); // TODO: is the bang correct?

    const message = i18next.t("battle:ppReduced", {targetName: getPokemonNameWithAffix(target), moveName: movesetMove?.getName(), reduction: (movesetMove?.ppUsed!) - lastPpUsed}); // TODO: is the bang correct?
    user.scene.eventTarget.dispatchEvent(new MoveUsedEvent(target?.id, movesetMove?.getMove()!, movesetMove?.ppUsed!)); // TODO: are these bangs correct?
    user.scene.queueMessage(message);

    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => {
      const lastMove = target.getLastXMoves().find(() => true);
      if (lastMove) {
        const movesetMove = target.getMoveset().find(m => m?.moveId === lastMove.move);
        return !!movesetMove?.getPpRatio();
      }
      return false;
    };
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    const lastMove = target.getLastXMoves().find(() => true);
    if (lastMove) {
      const movesetMove = target.getMoveset().find(m => m?.moveId === lastMove.move);
      if (movesetMove) {
        const maxPp = movesetMove.getMovePp();
        const ppLeft = maxPp - movesetMove.ppUsed;
        const value = -(8 - Math.ceil(Math.min(maxPp, 30) / 5));
        if (ppLeft < 4) {
          return (value / 4) * ppLeft;
        }
        return value;
      }
    }

    return 0;
  }
}

/**
 *  Attribute used for moves that damage target, and then reduce PP of the target's last used move.
 *  Used for Eerie Spell.
 */
export class AttackReducePpMoveAttr extends ReducePpMoveAttr {
  constructor(reduction: number) {
    super(reduction);
  }

  /**
   * Checks if the target has used a move prior to the attack. PP-reduction is applied through the super class if so.
   *
   * @param user {@linkcode Pokemon} that used the attack
   * @param target {@linkcode Pokemon} targeted by the attack
   * @param move {@linkcode Move} being used
   * @param args N/A
   * @returns {boolean} true
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const lastMove = target.getLastXMoves().find(() => true);
    if (lastMove) {
      const movesetMove = target.getMoveset().find(m => m?.moveId === lastMove.move);
      if (Boolean(movesetMove?.getPpRatio())) {
        super.apply(user, target, move, args);
      }
    }

    return true;
  }

  // Override condition function to always perform damage. Instead, perform pp-reduction condition check in apply function above
  getCondition(): MoveConditionFunc {
    return (user, target, move) => true;
  }
}

// TODO: Review this
const targetMoveCopiableCondition: MoveConditionFunc = (user, target, move) => {
  const targetMoves = target.getMoveHistory().filter(m => !m.virtual);
  if (!targetMoves.length) {
    return false;
  }

  const copiableMove = targetMoves[0];

  if (!copiableMove.move) {
    return false;
  }

  if (allMoves[copiableMove.move].hasAttr(ChargeAttr) && copiableMove.result === MoveResult.OTHER) {
    return false;
  }

  // TODO: Add last turn of Bide

  return true;
};

export class MovesetCopyMoveAttr extends OverrideMoveEffectAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const targetMoves = target.getMoveHistory().filter(m => !m.virtual);
    if (!targetMoves.length) {
      return false;
    }

    const copiedMove = allMoves[targetMoves[0].move];

    const thisMoveIndex = user.getMoveset().findIndex(m => m?.moveId === move.id);

    if (thisMoveIndex === -1) {
      return false;
    }

    user.summonData.moveset = user.getMoveset().slice(0);
    user.summonData.moveset[thisMoveIndex] = new PokemonMove(copiedMove.id, 0, 0);

    user.scene.queueMessage(i18next.t("moveTriggers:copiedMove", {pokemonName: getPokemonNameWithAffix(user), moveName: copiedMove.name}));

    return true;
  }

  getCondition(): MoveConditionFunc {
    return targetMoveCopiableCondition;
  }
}

/**
 * Attribute for {@linkcode Moves.SKETCH} that causes the user to copy the opponent's last used move
 * This move copies the last used non-virtual move
 *  e.g. if Metronome is used, it copies Metronome itself, not the virtual move called by Metronome
 * Fails if the opponent has not yet used a move.
 * Fails if used on an uncopiable move, listed in unsketchableMoves in getCondition
 * Fails if the move is already in the user's moveset
 */
export class SketchAttr extends MoveEffectAttr {
  constructor() {
    super(true);
  }
  /**
   * User copies the opponent's last used move, if possible
   * @param {Pokemon} user Pokemon that used the move and will replace Sketch with the copied move
   * @param {Pokemon} target Pokemon that the user wants to copy a move from
   * @param {Move} move Move being used
   * @param {any[]} args Unused
   * @returns {boolean} true if the function succeeds, otherwise false
   */

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const targetMove = target.getMoveHistory().filter(m => !m.virtual).at(-1);
    if (!targetMove) {
      return false;
    }

    const sketchedMove = allMoves[targetMove.move];
    const sketchIndex = user.getMoveset().findIndex(m => m?.moveId === move.id);
    if (sketchIndex === -1) {
      return false;
    }

    user.setMove(sketchIndex, sketchedMove.id);

    user.scene.queueMessage(i18next.t("moveTriggers:sketchedMove", {pokemonName: getPokemonNameWithAffix(user), moveName: sketchedMove.name}));

    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => {
      if (!targetMoveCopiableCondition(user, target, move)) {
        return false;
      }

      const targetMove = target.getMoveHistory().filter(m => !m.virtual).at(-1);
      if (!targetMove) {
        return false;
      }

      const unsketchableMoves = [
        Moves.CHATTER,
        Moves.MIRROR_MOVE,
        Moves.SLEEP_TALK,
        Moves.STRUGGLE,
        Moves.SKETCH,
        Moves.REVIVAL_BLESSING,
        Moves.TERA_STARSTORM,
        Moves.BREAKNECK_BLITZ__PHYSICAL,
        Moves.BREAKNECK_BLITZ__SPECIAL
      ];

      if (unsketchableMoves.includes(targetMove.move)) {
        return false;
      }

      if (user.getMoveset().find(m => m?.moveId === targetMove.move)) {
        return false;
      }

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
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const moveTarget = this.selfTarget ? user : target;

    moveTarget.summonData.ability = this.ability;
    user.scene.triggerPokemonFormChange(moveTarget, SpeciesFormChangeRevertWeatherFormTrigger);

    user.scene.queueMessage(i18next.t("moveTriggers:acquiredAbility", {pokemonName: getPokemonNameWithAffix((this.selfTarget ? user : target)), abilityName: allAbilities[this.ability].name}));

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
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    user.summonData.ability = target.getAbility().id;

    user.scene.queueMessage(i18next.t("moveTriggers:copiedTargetAbility", {pokemonName: getPokemonNameWithAffix(user), targetName: getPokemonNameWithAffix(target), abilityName: allAbilities[target.getAbility().id].name}));

    if (this.copyToPartner && user.scene.currentBattle?.double && user.getAlly().hp) {
      user.getAlly().summonData.ability = target.getAbility().id;
      user.getAlly().scene.queueMessage(i18next.t("moveTriggers:copiedTargetAbility", {pokemonName: getPokemonNameWithAffix(user.getAlly()), targetName: getPokemonNameWithAffix(target), abilityName: allAbilities[target.getAbility().id].name}));
    }

    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => {
      let ret = !target.getAbility().hasAttr(UncopiableAbilityAbAttr) && !user.getAbility().hasAttr(UnsuppressableAbilityAbAttr);
      if (this.copyToPartner && user.scene.currentBattle?.double) {
        ret = ret && (!user.getAlly().hp || !user.getAlly().getAbility().hasAttr(UnsuppressableAbilityAbAttr));
      } else {
        ret = ret && user.getAbility().id !== target.getAbility().id;
      }
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
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    target.summonData.ability = user.getAbility().id;

    user.scene.queueMessage(i18next.t("moveTriggers:acquiredAbility", {pokemonName: getPokemonNameWithAffix(target), abilityName: allAbilities[user.getAbility().id].name}));

    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => !user.getAbility().hasAttr(UncopiableAbilityAbAttr) && !target.getAbility().hasAttr(UnsuppressableAbilityAbAttr) && user.getAbility().id !== target.getAbility().id;
  }
}

export class SwitchAbilitiesAttr extends MoveEffectAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const tempAbilityId = user.getAbility().id;
    user.summonData.ability = target.getAbility().id;
    target.summonData.ability = tempAbilityId;

    user.scene.queueMessage(i18next.t("moveTriggers:swappedAbilitiesWithTarget", {pokemonName: getPokemonNameWithAffix(user)}));
    // Swaps Forecast/Flower Gift from Castform/Cherrim
    user.scene.arena.triggerWeatherBasedFormChangesToNormal();
    // Swaps Forecast/Flower Gift to Castform/Cherrim (edge case)
    user.scene.arena.triggerWeatherBasedFormChanges();

    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => !user.getAbility().hasAttr(UnswappableAbilityAbAttr) && !target.getAbility().hasAttr(UnswappableAbilityAbAttr);
  }
}

/**
 * Attribute used for moves that suppress abilities like {@linkcode Moves.GASTRO_ACID}.
 * A suppressed ability cannot be activated.
 *
 * @extends MoveEffectAttr
 * @see {@linkcode apply}
 * @see {@linkcode getCondition}
 */
export class SuppressAbilitiesAttr extends MoveEffectAttr {
  /** Sets ability suppression for the target pokemon and displays a message. */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    target.summonData.abilitySuppressed = true;
    target.scene.arena.triggerWeatherBasedFormChangesToNormal();

    target.scene.queueMessage(i18next.t("moveTriggers:suppressAbilities", {pokemonName: getPokemonNameWithAffix(target)}));

    return true;
  }

  /** Causes the effect to fail when the target's ability is unsupressable or already suppressed. */
  getCondition(): MoveConditionFunc {
    return (user, target, move) => !target.getAbility().hasAttr(UnsuppressableAbilityAbAttr) && !target.summonData.abilitySuppressed;
  }
}

/**
 * Applies the effects of {@linkcode SuppressAbilitiesAttr} if the target has already moved this turn.
 * @extends MoveEffectAttr
 * @see {@linkcode Moves.CORE_ENFORCER} (the move which uses this effect)
 */
export class SuppressAbilitiesIfActedAttr extends MoveEffectAttr {
  /**
   * If the target has already acted this turn, apply a {@linkcode SuppressAbilitiesAttr} effect unless the
   * abillity cannot be suppressed. This is a secondary effect and has no bearing on the success or failure of the move.
   *
   * @returns True if the move occurred, otherwise false. Note that true will be returned even if the target has not
   * yet moved or if the suppression failed to apply.
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    if (target.turnData.acted) {
      const suppressAttr = new SuppressAbilitiesAttr();
      if (suppressAttr.getCondition()(user, target, move)) {
        suppressAttr.apply(user, target, move, args);
      }
    }

    return true;
  }
}

export class TransformAttr extends MoveEffectAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): Promise<boolean> {
    return new Promise(resolve => {
      if (!super.apply(user, target, move, args)) {
        return resolve(false);
      }

      user.summonData.speciesForm = target.getSpeciesForm();
      user.summonData.fusionSpeciesForm = target.getFusionSpeciesForm();
      user.summonData.ability = target.getAbility().id;
      user.summonData.gender = target.getGender();
      user.summonData.fusionGender = target.getFusionGender();

      // Copy all stats (except HP)
      for (const s of EFFECTIVE_STATS) {
        user.setStat(s, target.getStat(s, false), false);
      }

      // Copy all stat stages
      for (const s of BATTLE_STATS) {
        user.setStatStage(s, target.getStatStage(s));
      }

      user.summonData.moveset = target.getMoveset().map(m => new PokemonMove(m?.moveId!, m?.ppUsed, m?.ppUp)); // TODO: is this bang correct?
      user.summonData.types = target.getTypes();

      user.scene.queueMessage(i18next.t("moveTriggers:transformedIntoTarget", {pokemonName: getPokemonNameWithAffix(user), targetName: getPokemonNameWithAffix(target)}));

      user.loadAssets(false).then(() => {
        user.playAnim();
        user.updateInfo();
        resolve(true);
      });
    });
  }
}

/**
 * Attribute used for status moves, namely Speed Swap,
 * that swaps the user's and target's corresponding stats.
 * @extends MoveEffectAttr
 * @see {@linkcode apply}
 */
export class SwapStatAttr extends MoveEffectAttr {
  /** The stat to be swapped between the user and the target */
  private stat: EffectiveStat;

  constructor(stat: EffectiveStat) {
    super();

    this.stat = stat;
  }

  /**
   * Takes the average of the user's and target's corresponding current
   * {@linkcode stat} values and sets that stat to the average for both
   * temporarily.
   * @param user the {@linkcode Pokemon} that used the move
   * @param target the {@linkcode Pokemon} that the move was used on
   * @param move N/A
   * @param args N/A
   * @returns true if attribute application succeeds
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (super.apply(user, target, move, args)) {
      const temp = user.getStat(this.stat, false);
      user.setStat(this.stat, target.getStat(this.stat, false), false);
      target.setStat(this.stat, temp, false);

      user.scene.queueMessage(i18next.t("moveTriggers:switchedStat", {
        pokemonName: getPokemonNameWithAffix(user),
        stat: i18next.t(getStatKey(this.stat)),
      }));

      return true;
    }
    return false;
  }
}

/**
 * Attribute used for status moves, namely Power Split and Guard Split,
 * that take the average of a user's and target's corresponding
 * stats and assign that average back to each corresponding stat.
 * @extends MoveEffectAttr
 * @see {@linkcode apply}
 */
export class AverageStatsAttr extends MoveEffectAttr {
  /** The stats to be averaged individually between the user and the target */
  private stats: readonly EffectiveStat[];
  private msgKey: string;

  constructor(stats: readonly EffectiveStat[], msgKey: string) {
    super();

    this.stats = stats;
    this.msgKey = msgKey;
  }

  /**
   * Takes the average of the user's and target's corresponding {@linkcode stat}
   * values and sets those stats to the corresponding average for both
   * temporarily.
   * @param user the {@linkcode Pokemon} that used the move
   * @param target the {@linkcode Pokemon} that the move was used on
   * @param move N/A
   * @param args N/A
   * @returns true if attribute application succeeds
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (super.apply(user, target, move, args)) {
      for (const s of this.stats) {
        const avg = Math.floor((user.getStat(s, false) + target.getStat(s, false)) / 2);

        user.setStat(s, avg, false);
        target.setStat(s, avg, false);
      }

      user.scene.queueMessage(i18next.t(this.msgKey, { pokemonName: getPokemonNameWithAffix(user) }));

      return true;
    }
    return false;
  }
}

export class DiscourageFrequentUseAttr extends MoveAttr {
  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    const lastMoves = user.getLastXMoves(4);
    console.log(lastMoves);
    for (let m = 0; m < lastMoves.length; m++) {
      if (lastMoves[m].move === move.id) {
        return (4 - (m + 1)) * -10;
      }
    }

    return 0;
  }
}

export class MoneyAttr extends MoveEffectAttr {
  constructor() {
    super(true, MoveEffectTrigger.HIT, true);
  }

  apply(user: Pokemon, target: Pokemon, move: Move): boolean {
    user.scene.currentBattle.moneyScattered += user.scene.getWaveMoneyAmount(0.2);
    user.scene.queueMessage(i18next.t("moveTriggers:coinsScatteredEverywhere"));
    return true;
  }
}

/**
 * Applies {@linkcode BattlerTagType.DESTINY_BOND} to the user.
 *
 * @extends MoveEffectAttr
 */
export class DestinyBondAttr extends MoveEffectAttr {
  constructor() {
    super(true, MoveEffectTrigger.PRE_APPLY);
  }

  /**
   * Applies {@linkcode BattlerTagType.DESTINY_BOND} to the user.
   * @param user {@linkcode Pokemon} that is having the tag applied to.
   * @param target {@linkcode Pokemon} N/A
   * @param move {@linkcode Move} {@linkcode Move.DESTINY_BOND}
   * @param {any[]} args N/A
   * @returns true
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    user.scene.queueMessage(`${i18next.t("moveTriggers:tryingToTakeFoeDown", {pokemonName: getPokemonNameWithAffix(user)})}`);
    user.addTag(BattlerTagType.DESTINY_BOND, undefined, move.id, user.id);
    return true;
  }
}

/**
 * Attribute to apply a battler tag to the target if they have had their stats boosted this turn.
 * @extends AddBattlerTagAttr
 */
export class AddBattlerTagIfBoostedAttr extends AddBattlerTagAttr {
  constructor(tag: BattlerTagType) {
    super(tag, false, false, 2, 5);
  }

  /**
   * @param user {@linkcode Pokemon} using this move
   * @param target {@linkcode Pokemon} target of this move
   * @param move {@linkcode Move} being used
   * @param {any[]} args N/A
   * @returns true
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (target.turnData.statStagesIncreased) {
      super.apply(user, target, move, args);
    }
    return true;
  }
}

/**
 * Attribute to apply a status effect to the target if they have had their stats boosted this turn.
 * @extends MoveEffectAttr
 */
export class StatusIfBoostedAttr extends MoveEffectAttr {
  public effect: StatusEffect;

  constructor(effect: StatusEffect) {
    super(true, MoveEffectTrigger.HIT);
    this.effect = effect;
  }

  /**
   * @param user {@linkcode Pokemon} using this move
   * @param target {@linkcode Pokemon} target of this move
   * @param move {@linkcode Move} N/A
   * @param {any[]} args N/A
   * @returns true
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (target.turnData.statStagesIncreased) {
      target.trySetStatus(this.effect, true, user);
    }
    return true;
  }
}

export class LastResortAttr extends MoveAttr {
  getCondition(): MoveConditionFunc {
    return (user: Pokemon, target: Pokemon, move: Move) => {
      const uniqueUsedMoveIds = new Set<Moves>();
      const movesetMoveIds = user.getMoveset().map(m => m?.moveId);
      user.getMoveHistory().map(m => {
        if (m.move !== move.id && movesetMoveIds.find(mm => mm === m.move)) {
          uniqueUsedMoveIds.add(m.move);
        }
      });
      return uniqueUsedMoveIds.size >= movesetMoveIds.length - 1;
    };
  }
}


/**
 * The move only works if the target has a transferable held item
 * @extends MoveAttr
 * @see {@linkcode getCondition}
 */
export class AttackedByItemAttr extends MoveAttr {
  /**
   * @returns the {@linkcode MoveConditionFunc} for this {@linkcode Move}
   */
  getCondition(): MoveConditionFunc {
    return (user: Pokemon, target: Pokemon, move: Move) => {
      const heldItems = target.getHeldItems().filter(i => i.isTransferrable);
      if (heldItems.length === 0) {
        return false;
      }

      const itemName = heldItems[0]?.type?.name ?? "item";
      target.scene.queueMessage(i18next.t("moveTriggers:attackedByItem", {pokemonName: getPokemonNameWithAffix(target), itemName: itemName}));

      return true;
    };
  }
}

export class VariableTargetAttr extends MoveAttr {
  private targetChangeFunc: (user: Pokemon, target: Pokemon, move: Move) => number;

  constructor(targetChange: (user: Pokemon, target: Pokemon, move: Move) => number) {
    super();

    this.targetChangeFunc = targetChange;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const targetVal = args[0] as Utils.NumberHolder;
    targetVal.value = this.targetChangeFunc(user, target, move);
    return true;
  }
}

const failOnGravityCondition: MoveConditionFunc = (user, target, move) => !user.scene.arena.getTag(ArenaTagType.GRAVITY);

const failOnBossCondition: MoveConditionFunc = (user, target, move) => !target.isBossImmune();

const failOnMaxCondition: MoveConditionFunc = (user, target, move) => !target.isMax();

const failIfDampCondition: MoveConditionFunc = (user, target, move) => {
  const cancelled = new Utils.BooleanHolder(false);
  user.scene.getField(true).map(p=>applyAbAttrs(FieldPreventExplosiveMovesAbAttr, p, cancelled));
  // Queue a message if an ability prevented usage of the move
  if (cancelled.value) {
    user.scene.queueMessage(i18next.t("moveTriggers:cannotUseMove", {pokemonName: getPokemonNameWithAffix(user), moveName: move.name}));
  }
  return !cancelled.value;
};

const userSleptOrComatoseCondition: MoveConditionFunc = (user: Pokemon, target: Pokemon, move: Move) =>  user.status?.effect === StatusEffect.SLEEP || user.hasAbility(Abilities.COMATOSE);

const targetSleptOrComatoseCondition: MoveConditionFunc = (user: Pokemon, target: Pokemon, move: Move) =>  target.status?.effect === StatusEffect.SLEEP || target.hasAbility(Abilities.COMATOSE);

const failIfLastCondition: MoveConditionFunc = (user: Pokemon, target: Pokemon, move: Move) => user.scene.phaseQueue.find(phase => phase instanceof MovePhase) !== undefined;

export type MoveAttrFilter = (attr: MoveAttr) => boolean;

function applyMoveAttrsInternal(attrFilter: MoveAttrFilter, user: Pokemon | null, target: Pokemon | null, move: Move, args: any[]): Promise<void> {
  return new Promise(resolve => {
    const attrPromises: Promise<boolean>[] = [];
    const moveAttrs = move.attrs.filter(a => attrFilter(a));
    for (const attr of moveAttrs) {
      const result = attr.apply(user, target, move, args);
      if (result instanceof Promise) {
        attrPromises.push(result);
      }
    }
    Promise.allSettled(attrPromises).then(() => resolve());
  });
}

export function applyMoveAttrs(attrType: Constructor<MoveAttr>, user: Pokemon | null, target: Pokemon | null, move: Move, ...args: any[]): Promise<void> {
  return applyMoveAttrsInternal((attr: MoveAttr) => attr instanceof attrType, user, target, move, args);
}

export function applyFilteredMoveAttrs(attrFilter: MoveAttrFilter, user: Pokemon, target: Pokemon | null, move: Move, ...args: any[]): Promise<void> {
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

export class hitsSameTypeAttr extends VariableMoveTypeMultiplierAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const multiplier = args[0] as Utils.NumberHolder;
    if (!user.getTypes().some(type => target.getTypes().includes(type))) {
      multiplier.value = 0;
      return true;
    }
    return false;
  }
}

/**
 * Attribute used for Conversion 2, to convert the user's type to a random type that resists the target's last used move.
 * Fails if the user already has ALL types that resist the target's last used move.
 * Fails if the opponent has not used a move yet
 * Fails if the type is unknown or stellar
 *
 * TODO:
 * If a move has its type changed (e.g. {@linkcode Moves.HIDDEN_POWER}), it will check the new type.
 */
export class ResistLastMoveTypeAttr extends MoveEffectAttr {
  constructor() {
    super(true);
  }
  /**
   * User changes its type to a random type that resists the target's last used move
   * @param {Pokemon} user Pokemon that used the move and will change types
   * @param {Pokemon} target Opposing pokemon that recently used a move
   * @param {Move} move Move being used
   * @param {any[]} args Unused
   * @returns {boolean} true if the function succeeds
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const [targetMove] = target.getLastXMoves(1); // target's most recent move
    if (!targetMove) {
      return false;
    }

    const moveData = allMoves[targetMove.move];
    if (moveData.type === Type.STELLAR || moveData.type === Type.UNKNOWN) {
      return false;
    }
    const userTypes = user.getTypes();
    const validTypes = this.getTypeResistances(user.scene.gameMode, moveData.type).filter(t => !userTypes.includes(t)); // valid types are ones that are not already the user's types
    if (!validTypes.length) {
      return false;
    }
    const type = validTypes[user.randSeedInt(validTypes.length)];
    user.summonData.types = [ type ];
    user.scene.queueMessage(i18next.t("battle:transformedIntoType", {pokemonName: getPokemonNameWithAffix(user), type: Utils.toReadableString(Type[type])}));
    user.updateInfo();

    return true;
  }

  /**
   * Retrieve the types resisting a given type. Used by Conversion 2
   * @returns An array populated with Types, or an empty array if no resistances exist (Unknown or Stellar type)
   */
  getTypeResistances(gameMode: GameMode, type: number): Type[] {
    const typeResistances: Type[] = [];

    for (let i = 0; i < Object.keys(Type).length; i++) {
      const multiplier = new NumberHolder(1);
      multiplier.value = getTypeDamageMultiplier(type, i);
      applyChallenges(gameMode, ChallengeType.TYPE_EFFECTIVENESS, multiplier);
      if (multiplier.value < 1) {
        typeResistances.push(i);
      }
    }

    return typeResistances;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => {
      const moveHistory = target.getLastXMoves();
      return moveHistory.length !== 0;
    };
  }
}

/**
 * Drops the target's immunity to types it is immune to
 * and makes its evasiveness be ignored during accuracy
 * checks. Used by: {@linkcode Moves.ODOR_SLEUTH | Odor Sleuth}, {@linkcode Moves.MIRACLE_EYE | Miracle Eye} and {@linkcode Moves.FORESIGHT | Foresight}
 *
 * @extends AddBattlerTagAttr
 * @see {@linkcode apply}
 */
export class ExposedMoveAttr extends AddBattlerTagAttr {
  constructor(tagType: BattlerTagType) {
    super(tagType, false, true);
  }

  /**
   * Applies {@linkcode ExposedTag} to the target.
   * @param user {@linkcode Pokemon} using this move
   * @param target {@linkcode Pokemon} target of this move
   * @param move {@linkcode Move} being used
   * @param args N/A
   * @returns `true` if the function succeeds
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    user.scene.queueMessage(i18next.t("moveTriggers:exposedMove", { pokemonName: getPokemonNameWithAffix(user), targetPokemonName: getPokemonNameWithAffix(target)}));

    return true;
  }
}


const unknownTypeCondition: MoveConditionFunc = (user, target, move) => !user.getTypes().includes(Type.UNKNOWN);

export type MoveTargetSet = {
  targets: BattlerIndex[];
  multiple: boolean;
};

export function getMoveTargets(user: Pokemon, move: Moves): MoveTargetSet {
  const variableTarget = new Utils.NumberHolder(0);
  user.getOpponents().forEach(p => applyMoveAttrs(VariableTargetAttr, user, p, allMoves[move], variableTarget));

  const moveTarget = allMoves[move].hasAttr(VariableTargetAttr) ? variableTarget.value : move ? allMoves[move].moveTarget : move === undefined ? MoveTarget.NEAR_ENEMY : [];
  const opponents = user.getOpponents();

  let set: Pokemon[] = [];
  let multiple = false;

  switch (moveTarget) {
  case MoveTarget.USER:
  case MoveTarget.PARTY:
    set = [ user ];
    break;
  case MoveTarget.NEAR_OTHER:
  case MoveTarget.OTHER:
  case MoveTarget.ALL_NEAR_OTHERS:
  case MoveTarget.ALL_OTHERS:
    set = (opponents.concat([ user.getAlly() ]));
    multiple = moveTarget === MoveTarget.ALL_NEAR_OTHERS || moveTarget === MoveTarget.ALL_OTHERS;
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
  case MoveTarget.CURSE:
    set = user.getTypes(true).includes(Type.GHOST) ? (opponents.concat([ user.getAlly() ])) : [ user ];
    break;
  }

  return { targets: set.filter(p => p?.isActive(true)).map(p => p.getBattlerIndex()).filter(t => t !== undefined), multiple };
}

export const allMoves: Move[] = [
  new SelfStatusMove(Moves.NONE, Type.NORMAL, MoveCategory.STATUS, -1, -1, 0, 1),
];

export const selfStatLowerMoves: Moves[] = [];

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
      .attr(ChargeAttr, ChargeAnim.RAZOR_WIND_CHARGING, i18next.t("moveTriggers:whippedUpAWhirlwind", {pokemonName: "{USER}"}))
      .attr(HighCritAttr)
      .windMove()
      .ignoresVirtual()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new SelfStatusMove(Moves.SWORDS_DANCE, Type.NORMAL, -1, 20, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.ATK ], 2, true)
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
      .attr(ChargeAttr, ChargeAnim.FLY_CHARGING, i18next.t("moveTriggers:flewUpHigh", {pokemonName: "{USER}"}), BattlerTagType.FLYING)
      .condition(failOnGravityCondition)
      .ignoresVirtual(),
    new AttackMove(Moves.BIND, Type.NORMAL, MoveCategory.PHYSICAL, 15, 85, 20, -1, 0, 1)
      .attr(TrapAttr, BattlerTagType.BIND),
    new AttackMove(Moves.SLAM, Type.NORMAL, MoveCategory.PHYSICAL, 80, 75, 20, -1, 0, 1),
    new AttackMove(Moves.VINE_WHIP, Type.GRASS, MoveCategory.PHYSICAL, 45, 100, 25, -1, 0, 1),
    new AttackMove(Moves.STOMP, Type.NORMAL, MoveCategory.PHYSICAL, 65, 100, 20, 30, 0, 1)
      .attr(MinimizeAccuracyAttr)
      .attr(HitsTagAttr, BattlerTagType.MINIMIZED, true)
      .attr(FlinchAttr),
    new AttackMove(Moves.DOUBLE_KICK, Type.FIGHTING, MoveCategory.PHYSICAL, 30, 100, 30, -1, 0, 1)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.MEGA_KICK, Type.NORMAL, MoveCategory.PHYSICAL, 120, 75, 5, -1, 0, 1),
    new AttackMove(Moves.JUMP_KICK, Type.FIGHTING, MoveCategory.PHYSICAL, 100, 95, 10, -1, 0, 1)
      .attr(MissEffectAttr, crashDamageFunc)
      .attr(NoEffectAttr, crashDamageFunc)
      .condition(failOnGravityCondition)
      .recklessMove(),
    new AttackMove(Moves.ROLLING_KICK, Type.FIGHTING, MoveCategory.PHYSICAL, 60, 85, 15, 30, 0, 1)
      .attr(FlinchAttr),
    new StatusMove(Moves.SAND_ATTACK, Type.GROUND, 100, 15, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.ACC ], -1),
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
      .attr(MinimizeAccuracyAttr)
      .attr(HitsTagAttr, BattlerTagType.MINIMIZED, true)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.WRAP, Type.NORMAL, MoveCategory.PHYSICAL, 15, 90, 20, -1, 0, 1)
      .attr(TrapAttr, BattlerTagType.WRAP),
    new AttackMove(Moves.TAKE_DOWN, Type.NORMAL, MoveCategory.PHYSICAL, 90, 85, 20, -1, 0, 1)
      .attr(RecoilAttr)
      .recklessMove(),
    new AttackMove(Moves.THRASH, Type.NORMAL, MoveCategory.PHYSICAL, 120, 100, 10, -1, 0, 1)
      .attr(FrenzyAttr)
      .attr(MissEffectAttr, frenzyMissFunc)
      .attr(NoEffectAttr, frenzyMissFunc)
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new AttackMove(Moves.DOUBLE_EDGE, Type.NORMAL, MoveCategory.PHYSICAL, 120, 100, 15, -1, 0, 1)
      .attr(RecoilAttr, false, 0.33)
      .recklessMove(),
    new StatusMove(Moves.TAIL_WHIP, Type.NORMAL, 100, 30, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1)
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
    new StatusMove(Moves.LEER, Type.NORMAL, 100, 30, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.BITE, Type.DARK, MoveCategory.PHYSICAL, 60, 100, 25, 30, 0, 1)
      .attr(FlinchAttr)
      .bitingMove(),
    new StatusMove(Moves.GROWL, Type.NORMAL, 100, 40, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1)
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
      .attr(AddBattlerTagAttr, BattlerTagType.DISABLED, false, true)
      .condition((user, target, move) => target.getMoveHistory().reverse().find(m => m.move !== Moves.NONE && m.move !== Moves.STRUGGLE && !m.virtual) !== undefined)
      .condition(failOnMaxCondition),
    new AttackMove(Moves.ACID, Type.POISON, MoveCategory.SPECIAL, 40, 100, 30, 10, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -1)
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
      .attr(HitsTagAttr, BattlerTagType.UNDERWATER, true)
      .attr(GulpMissileTagAttr),
    new AttackMove(Moves.ICE_BEAM, Type.ICE, MoveCategory.SPECIAL, 90, 100, 10, 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.FREEZE),
    new AttackMove(Moves.BLIZZARD, Type.ICE, MoveCategory.SPECIAL, 110, 70, 5, 10, 0, 1)
      .attr(BlizzardAccuracyAttr)
      .attr(StatusEffectAttr, StatusEffect.FREEZE)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.PSYBEAM, Type.PSYCHIC, MoveCategory.SPECIAL, 65, 100, 20, 10, 0, 1)
      .attr(ConfuseAttr),
    new AttackMove(Moves.BUBBLE_BEAM, Type.WATER, MoveCategory.SPECIAL, 65, 100, 20, 10, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1),
    new AttackMove(Moves.AURORA_BEAM, Type.ICE, MoveCategory.SPECIAL, 65, 100, 20, 10, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1),
    new AttackMove(Moves.HYPER_BEAM, Type.NORMAL, MoveCategory.SPECIAL, 150, 90, 5, -1, 0, 1)
      .attr(RechargeAttr),
    new AttackMove(Moves.PECK, Type.FLYING, MoveCategory.PHYSICAL, 35, 100, 35, -1, 0, 1),
    new AttackMove(Moves.DRILL_PECK, Type.FLYING, MoveCategory.PHYSICAL, 80, 100, 20, -1, 0, 1),
    new AttackMove(Moves.SUBMISSION, Type.FIGHTING, MoveCategory.PHYSICAL, 80, 80, 20, -1, 0, 1)
      .attr(RecoilAttr)
      .recklessMove(),
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
      .attr(GrowthStatStageChangeAttr),
    new AttackMove(Moves.RAZOR_LEAF, Type.GRASS, MoveCategory.PHYSICAL, 55, 95, 25, -1, 0, 1)
      .attr(HighCritAttr)
      .makesContact(false)
      .slicingMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.SOLAR_BEAM, Type.GRASS, MoveCategory.SPECIAL, 120, 100, 10, -1, 0, 1)
      .attr(SunlightChargeAttr, ChargeAnim.SOLAR_BEAM_CHARGING, i18next.t("moveTriggers:tookInSunlight", {pokemonName: "{USER}"}))
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
      .attr(NoEffectAttr, frenzyMissFunc)
      .makesContact()
      .danceMove()
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new StatusMove(Moves.STRING_SHOT, Type.BUG, 95, 40, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -2)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.DRAGON_RAGE, Type.DRAGON, MoveCategory.SPECIAL, -1, 100, 10, -1, 0, 1)
      .attr(FixedDamageAttr, 40),
    new AttackMove(Moves.FIRE_SPIN, Type.FIRE, MoveCategory.SPECIAL, 35, 85, 15, -1, 0, 1)
      .attr(TrapAttr, BattlerTagType.FIRE_SPIN),
    new AttackMove(Moves.THUNDER_SHOCK, Type.ELECTRIC, MoveCategory.SPECIAL, 40, 100, 30, 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.THUNDERBOLT, Type.ELECTRIC, MoveCategory.SPECIAL, 90, 100, 15, 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new StatusMove(Moves.THUNDER_WAVE, Type.ELECTRIC, 90, 20, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .attr(RespectAttackTypeImmunityAttr),
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
      .attr(ChargeAttr, ChargeAnim.DIG_CHARGING, i18next.t("moveTriggers:dugAHole", {pokemonName: "{USER}"}), BattlerTagType.UNDERGROUND)
      .ignoresVirtual(),
    new StatusMove(Moves.TOXIC, Type.POISON, 90, 10, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.TOXIC)
      .attr(ToxicAccuracyAttr),
    new AttackMove(Moves.CONFUSION, Type.PSYCHIC, MoveCategory.SPECIAL, 50, 100, 25, 10, 0, 1)
      .attr(ConfuseAttr),
    new AttackMove(Moves.PSYCHIC, Type.PSYCHIC, MoveCategory.SPECIAL, 90, 100, 10, 10, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -1),
    new StatusMove(Moves.HYPNOSIS, Type.PSYCHIC, 60, 20, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP),
    new SelfStatusMove(Moves.MEDITATE, Type.PSYCHIC, -1, 40, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.ATK ], 1, true),
    new SelfStatusMove(Moves.AGILITY, Type.PSYCHIC, -1, 30, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.SPD ], 2, true),
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
      .attr(StatStageChangeAttr, [ Stat.DEF ], -2)
      .soundBased(),
    new SelfStatusMove(Moves.DOUBLE_TEAM, Type.NORMAL, -1, 15, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.EVA ], 1, true),
    new SelfStatusMove(Moves.RECOVER, Type.NORMAL, -1, 5, -1, 0, 1)
      .attr(HealAttr, 0.5)
      .triageMove(),
    new SelfStatusMove(Moves.HARDEN, Type.NORMAL, -1, 30, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 1, true),
    new SelfStatusMove(Moves.MINIMIZE, Type.NORMAL, -1, 10, -1, 0, 1)
      .attr(AddBattlerTagAttr, BattlerTagType.MINIMIZED, true, false)
      .attr(StatStageChangeAttr, [ Stat.EVA ], 2, true),
    new StatusMove(Moves.SMOKESCREEN, Type.NORMAL, 100, 20, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.ACC ], -1),
    new StatusMove(Moves.CONFUSE_RAY, Type.GHOST, 100, 10, -1, 0, 1)
      .attr(ConfuseAttr),
    new SelfStatusMove(Moves.WITHDRAW, Type.WATER, -1, 40, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 1, true),
    new SelfStatusMove(Moves.DEFENSE_CURL, Type.NORMAL, -1, 40, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 1, true),
    new SelfStatusMove(Moves.BARRIER, Type.PSYCHIC, -1, 20, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 2, true),
    new StatusMove(Moves.LIGHT_SCREEN, Type.PSYCHIC, -1, 30, -1, 0, 1)
      .attr(AddArenaTagAttr, ArenaTagType.LIGHT_SCREEN, 5, true)
      .target(MoveTarget.USER_SIDE),
    new SelfStatusMove(Moves.HAZE, Type.ICE, -1, 30, -1, 0, 1)
      .attr(ResetStatsAttr, true),
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
    new AttackMove(Moves.CLAMP, Type.WATER, MoveCategory.PHYSICAL, 35, 85, 15, -1, 0, 1)
      .attr(TrapAttr, BattlerTagType.CLAMP),
    new AttackMove(Moves.SWIFT, Type.NORMAL, MoveCategory.SPECIAL, 60, -1, 20, -1, 0, 1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.SKULL_BASH, Type.NORMAL, MoveCategory.PHYSICAL, 130, 100, 10, -1, 0, 1)
      .attr(ChargeAttr, ChargeAnim.SKULL_BASH_CHARGING, i18next.t("moveTriggers:loweredItsHead", {pokemonName: "{USER}"}), null, true)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 1, true)
      .ignoresVirtual(),
    new AttackMove(Moves.SPIKE_CANNON, Type.NORMAL, MoveCategory.PHYSICAL, 20, 100, 15, -1, 0, 1)
      .attr(MultiHitAttr)
      .makesContact(false),
    new AttackMove(Moves.CONSTRICT, Type.NORMAL, MoveCategory.PHYSICAL, 10, 100, 35, 10, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1),
    new SelfStatusMove(Moves.AMNESIA, Type.PSYCHIC, -1, 20, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], 2, true),
    new StatusMove(Moves.KINESIS, Type.PSYCHIC, 80, 15, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.ACC ], -1),
    new SelfStatusMove(Moves.SOFT_BOILED, Type.NORMAL, -1, 5, -1, 0, 1)
      .attr(HealAttr, 0.5)
      .triageMove(),
    new AttackMove(Moves.HIGH_JUMP_KICK, Type.FIGHTING, MoveCategory.PHYSICAL, 130, 90, 10, -1, 0, 1)
      .attr(MissEffectAttr, crashDamageFunc)
      .attr(NoEffectAttr, crashDamageFunc)
      .condition(failOnGravityCondition)
      .recklessMove(),
    new StatusMove(Moves.GLARE, Type.NORMAL, 100, 30, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.DREAM_EATER, Type.PSYCHIC, MoveCategory.SPECIAL, 100, 100, 15, -1, 0, 1)
      .attr(HitHealAttr)
      .condition(targetSleptOrComatoseCondition)
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
      .attr(ChargeAttr, ChargeAnim.SKY_ATTACK_CHARGING, i18next.t("moveTriggers:isGlowing", {pokemonName: "{USER}"}))
      .attr(HighCritAttr)
      .attr(FlinchAttr)
      .makesContact(false)
      .ignoresVirtual(),
    new StatusMove(Moves.TRANSFORM, Type.NORMAL, -1, 10, -1, 0, 1)
      .attr(TransformAttr)
      .ignoresProtect(),
    new AttackMove(Moves.BUBBLE, Type.WATER, MoveCategory.SPECIAL, 40, 100, 30, 10, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.DIZZY_PUNCH, Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 10, 20, 0, 1)
      .attr(ConfuseAttr)
      .punchingMove(),
    new StatusMove(Moves.SPORE, Type.GRASS, 100, 15, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .powderMove(),
    new StatusMove(Moves.FLASH, Type.NORMAL, 100, 20, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.ACC ], -1),
    new AttackMove(Moves.PSYWAVE, Type.PSYCHIC, MoveCategory.SPECIAL, -1, 100, 15, -1, 0, 1)
      .attr(RandomLevelDamageAttr),
    new SelfStatusMove(Moves.SPLASH, Type.NORMAL, -1, 40, -1, 0, 1)
      .condition(failOnGravityCondition),
    new SelfStatusMove(Moves.ACID_ARMOR, Type.POISON, -1, 20, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 2, true),
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
      .condition((user, target, move) => !user.isFullHp() && user.canSetStatus(StatusEffect.SLEEP, true, true))
      .triageMove(),
    new AttackMove(Moves.ROCK_SLIDE, Type.ROCK, MoveCategory.PHYSICAL, 75, 90, 10, 30, 0, 1)
      .attr(FlinchAttr)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.HYPER_FANG, Type.NORMAL, MoveCategory.PHYSICAL, 80, 90, 15, 10, 0, 1)
      .attr(FlinchAttr)
      .bitingMove(),
    new SelfStatusMove(Moves.SHARPEN, Type.NORMAL, -1, 30, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.ATK ], 1, true),
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
      .attr(MultiHitAttr, MultiHitType._3)
      .attr(MultiHitPowerIncrementAttr, 3)
      .checkAllHits(),
    new AttackMove(Moves.THIEF, Type.DARK, MoveCategory.PHYSICAL, 60, 100, 25, -1, 0, 2)
      .attr(StealHeldItemChanceAttr, 0.3),
    new StatusMove(Moves.SPIDER_WEB, Type.BUG, -1, 10, -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, true, 1),
    new StatusMove(Moves.MIND_READER, Type.NORMAL, -1, 5, -1, 0, 2)
      .attr(IgnoreAccuracyAttr),
    new StatusMove(Moves.NIGHTMARE, Type.GHOST, 100, 15, -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.NIGHTMARE)
      .condition(targetSleptOrComatoseCondition),
    new AttackMove(Moves.FLAME_WHEEL, Type.FIRE, MoveCategory.PHYSICAL, 60, 100, 25, 10, 0, 2)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.SNORE, Type.NORMAL, MoveCategory.SPECIAL, 50, 100, 15, 30, 0, 2)
      .attr(BypassSleepAttr)
      .attr(FlinchAttr)
      .condition(userSleptOrComatoseCondition)
      .soundBased(),
    new StatusMove(Moves.CURSE, Type.GHOST, -1, 10, -1, 0, 2)
      .attr(CurseAttr)
      .ignoresProtect(true)
      .target(MoveTarget.CURSE),
    new AttackMove(Moves.FLAIL, Type.NORMAL, MoveCategory.PHYSICAL, -1, 100, 15, -1, 0, 2)
      .attr(LowHpPowerAttr),
    new StatusMove(Moves.CONVERSION_2, Type.NORMAL, -1, 30, -1, 0, 2)
      .attr(ResistLastMoveTypeAttr)
      .partial(), // Checks the move's original typing and not if its type is changed through some other means
    new AttackMove(Moves.AEROBLAST, Type.FLYING, MoveCategory.SPECIAL, 100, 95, 5, -1, 0, 2)
      .windMove()
      .attr(HighCritAttr),
    new StatusMove(Moves.COTTON_SPORE, Type.GRASS, 100, 40, -1, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -2)
      .powderMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.REVERSAL, Type.FIGHTING, MoveCategory.PHYSICAL, -1, 100, 15, -1, 0, 2)
      .attr(LowHpPowerAttr),
    new StatusMove(Moves.SPITE, Type.GHOST, 100, 10, -1, 0, 2)
      .attr(ReducePpMoveAttr, 4),
    new AttackMove(Moves.POWDER_SNOW, Type.ICE, MoveCategory.SPECIAL, 40, 100, 25, 10, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.FREEZE)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new SelfStatusMove(Moves.PROTECT, Type.NORMAL, -1, 10, -1, 4, 2)
      .attr(ProtectAttr)
      .condition(failIfLastCondition),
    new AttackMove(Moves.MACH_PUNCH, Type.FIGHTING, MoveCategory.PHYSICAL, 40, 100, 30, -1, 1, 2)
      .punchingMove(),
    new StatusMove(Moves.SCARY_FACE, Type.NORMAL, 100, 10, -1, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -2),
    new AttackMove(Moves.FEINT_ATTACK, Type.DARK, MoveCategory.PHYSICAL, 60, -1, 20, -1, 0, 2),
    new StatusMove(Moves.SWEET_KISS, Type.FAIRY, 75, 10, -1, 0, 2)
      .attr(ConfuseAttr),
    new SelfStatusMove(Moves.BELLY_DRUM, Type.NORMAL, -1, 10, -1, 0, 2)
      .attr(CutHpStatStageBoostAttr, [ Stat.ATK ], 12, 2, (user) => {
        user.scene.queueMessage(i18next.t("moveTriggers:cutOwnHpAndMaximizedStat", { pokemonName: getPokemonNameWithAffix(user), statName: i18next.t(getStatKey(Stat.ATK)) }));
      }),
    new AttackMove(Moves.SLUDGE_BOMB, Type.POISON, MoveCategory.SPECIAL, 90, 100, 10, 30, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .ballBombMove(),
    new AttackMove(Moves.MUD_SLAP, Type.GROUND, MoveCategory.SPECIAL, 20, 100, 10, 100, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.ACC ], -1),
    new AttackMove(Moves.OCTAZOOKA, Type.WATER, MoveCategory.SPECIAL, 65, 85, 10, 50, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.ACC ], -1)
      .ballBombMove(),
    new StatusMove(Moves.SPIKES, Type.GROUND, -1, 20, -1, 0, 2)
      .attr(AddArenaTrapTagAttr, ArenaTagType.SPIKES)
      .target(MoveTarget.ENEMY_SIDE),
    new AttackMove(Moves.ZAP_CANNON, Type.ELECTRIC, MoveCategory.SPECIAL, 120, 50, 5, 100, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .ballBombMove(),
    new StatusMove(Moves.FORESIGHT, Type.NORMAL, -1, 40, -1, 0, 2)
      .attr(ExposedMoveAttr, BattlerTagType.IGNORE_GHOST),
    new SelfStatusMove(Moves.DESTINY_BOND, Type.GHOST, -1, 5, -1, 0, 2)
      .ignoresProtect()
      .attr(DestinyBondAttr)
      .condition((user, target, move) => {
        // Retrieves user's previous move, returns empty array if no moves have been used
        const lastTurnMove = user.getLastXMoves(1);
        // Checks last move and allows destiny bond to be used if:
        // - no previous moves have been made
        // - the previous move used was not destiny bond
        // - the previous move was unsuccessful
        return lastTurnMove.length === 0 || lastTurnMove[0].move !== move.id || lastTurnMove[0].result !== MoveResult.SUCCESS;
      }),
    new StatusMove(Moves.PERISH_SONG, Type.NORMAL, -1, 5, -1, 0, 2)
      .attr(FaintCountdownAttr)
      .ignoresProtect()
      .soundBased()
      .condition(failOnBossCondition)
      .target(MoveTarget.ALL),
    new AttackMove(Moves.ICY_WIND, Type.ICE, MoveCategory.SPECIAL, 55, 95, 15, 100, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new SelfStatusMove(Moves.DETECT, Type.FIGHTING, -1, 5, -1, 4, 2)
      .attr(ProtectAttr)
      .condition(failIfLastCondition),
    new AttackMove(Moves.BONE_RUSH, Type.GROUND, MoveCategory.PHYSICAL, 25, 90, 10, -1, 0, 2)
      .attr(MultiHitAttr)
      .makesContact(false),
    new StatusMove(Moves.LOCK_ON, Type.NORMAL, -1, 5, -1, 0, 2)
      .attr(IgnoreAccuracyAttr),
    new AttackMove(Moves.OUTRAGE, Type.DRAGON, MoveCategory.PHYSICAL, 120, 100, 10, -1, 0, 2)
      .attr(FrenzyAttr)
      .attr(MissEffectAttr, frenzyMissFunc)
      .attr(NoEffectAttr, frenzyMissFunc)
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new StatusMove(Moves.SANDSTORM, Type.ROCK, -1, 10, -1, 0, 2)
      .attr(WeatherChangeAttr, WeatherType.SANDSTORM)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.GIGA_DRAIN, Type.GRASS, MoveCategory.SPECIAL, 75, 100, 10, -1, 0, 2)
      .attr(HitHealAttr)
      .triageMove(),
    new SelfStatusMove(Moves.ENDURE, Type.NORMAL, -1, 10, -1, 4, 2)
      .attr(ProtectAttr, BattlerTagType.ENDURING)
      .condition(failIfLastCondition),
    new StatusMove(Moves.CHARM, Type.FAIRY, 100, 20, -1, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -2),
    new AttackMove(Moves.ROLLOUT, Type.ROCK, MoveCategory.PHYSICAL, 30, 90, 20, -1, 0, 2)
      .attr(ConsecutiveUseDoublePowerAttr, 5, true, true, Moves.DEFENSE_CURL),
    new AttackMove(Moves.FALSE_SWIPE, Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 40, -1, 0, 2)
      .attr(SurviveDamageAttr),
    new StatusMove(Moves.SWAGGER, Type.NORMAL, 85, 15, -1, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.ATK ], 2)
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
      .attr(StatStageChangeAttr, [ Stat.DEF ], 1, true),
    new StatusMove(Moves.MEAN_LOOK, Type.NORMAL, -1, 5, -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, true, 1),
    new StatusMove(Moves.ATTRACT, Type.NORMAL, 100, 15, -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.INFATUATED)
      .condition((user, target, move) => user.isOppositeGender(target)),
    new SelfStatusMove(Moves.SLEEP_TALK, Type.NORMAL, -1, 10, -1, 0, 2)
      .attr(BypassSleepAttr)
      .attr(RandomMovesetMoveAttr)
      .condition(userSleptOrComatoseCondition)
      .target(MoveTarget.ALL_ENEMIES)
      .ignoresVirtual(),
    new StatusMove(Moves.HEAL_BELL, Type.NORMAL, -1, 5, -1, 0, 2)
      .attr(PartyStatusCureAttr, i18next.t("moveTriggers:bellChimed"), Abilities.SOUNDPROOF)
      .soundBased()
      .target(MoveTarget.PARTY),
    new AttackMove(Moves.RETURN, Type.NORMAL, MoveCategory.PHYSICAL, -1, 100, 20, -1, 0, 2)
      .attr(FriendshipPowerAttr),
    new AttackMove(Moves.PRESENT, Type.NORMAL, MoveCategory.PHYSICAL, -1, 90, 15, -1, 0, 2)
      .attr(PresentPowerAttr)
      .makesContact(false),
    new AttackMove(Moves.FRUSTRATION, Type.NORMAL, MoveCategory.PHYSICAL, -1, 100, 20, -1, 0, 2)
      .attr(FriendshipPowerAttr, true),
    new StatusMove(Moves.SAFEGUARD, Type.NORMAL, -1, 25, -1, 0, 2)
      .target(MoveTarget.USER_SIDE)
      .attr(AddArenaTagAttr, ArenaTagType.SAFEGUARD, 5, true, true),
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
      .attr(StatStageChangeAttr, [ Stat.SPD ], 1, true)
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
      .attr(RemoveArenaTrapAttr),
    new StatusMove(Moves.SWEET_SCENT, Type.NORMAL, 100, 20, -1, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.EVA ], -2)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.IRON_TAIL, Type.STEEL, MoveCategory.PHYSICAL, 100, 75, 15, 30, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1),
    new AttackMove(Moves.METAL_CLAW, Type.STEEL, MoveCategory.PHYSICAL, 50, 95, 35, 10, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.ATK ], 1, true),
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
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1)
      .bitingMove(),
    new AttackMove(Moves.MIRROR_COAT, Type.PSYCHIC, MoveCategory.SPECIAL, -1, 100, 20, -1, -5, 2)
      .attr(CounterDamageAttr, (move: Move) => move.category === MoveCategory.SPECIAL, 2)
      .target(MoveTarget.ATTACKER),
    new StatusMove(Moves.PSYCH_UP, Type.NORMAL, -1, 10, -1, 0, 2)
      .attr(CopyStatsAttr),
    new AttackMove(Moves.EXTREME_SPEED, Type.NORMAL, MoveCategory.PHYSICAL, 80, 100, 5, -1, 2, 2),
    new AttackMove(Moves.ANCIENT_POWER, Type.ROCK, MoveCategory.SPECIAL, 60, 100, 5, 10, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD ], 1, true),
    new AttackMove(Moves.SHADOW_BALL, Type.GHOST, MoveCategory.SPECIAL, 80, 100, 15, 20, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -1)
      .ballBombMove(),
    new AttackMove(Moves.FUTURE_SIGHT, Type.PSYCHIC, MoveCategory.SPECIAL, 120, 100, 10, -1, 0, 2)
      .partial()
      .attr(DelayedAttackAttr, ArenaTagType.FUTURE_SIGHT, ChargeAnim.FUTURE_SIGHT_CHARGING, i18next.t("moveTriggers:foresawAnAttack", {pokemonName: "{USER}"})),
    new AttackMove(Moves.ROCK_SMASH, Type.FIGHTING, MoveCategory.PHYSICAL, 40, 100, 15, 50, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1),
    new AttackMove(Moves.WHIRLPOOL, Type.WATER, MoveCategory.SPECIAL, 35, 85, 15, -1, 0, 2)
      .attr(TrapAttr, BattlerTagType.WHIRLPOOL)
      .attr(HitsTagAttr, BattlerTagType.UNDERWATER, true),
    new AttackMove(Moves.BEAT_UP, Type.DARK, MoveCategory.PHYSICAL, -1, 100, 10, -1, 0, 2)
      .attr(MultiHitAttr, MultiHitType.BEAT_UP)
      .attr(BeatUpAttr)
      .makesContact(false),
    new AttackMove(Moves.FAKE_OUT, Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 10, 100, 3, 3)
      .attr(FlinchAttr)
      .condition(new FirstMoveCondition()),
    new AttackMove(Moves.UPROAR, Type.NORMAL, MoveCategory.SPECIAL, 90, 100, 10, -1, 0, 3)
      .ignoresVirtual()
      .soundBased()
      .target(MoveTarget.RANDOM_NEAR_ENEMY)
      .partial(),
    new SelfStatusMove(Moves.STOCKPILE, Type.NORMAL, -1, 20, -1, 0, 3)
      .condition(user => (user.getTag(StockpilingTag)?.stockpiledCount ?? 0) < 3)
      .attr(AddBattlerTagAttr, BattlerTagType.STOCKPILING, true),
    new AttackMove(Moves.SPIT_UP, Type.NORMAL, MoveCategory.SPECIAL, -1, -1, 10, -1, 0, 3)
      .condition(hasStockpileStacksCondition)
      .attr(SpitUpPowerAttr, 100)
      .attr(RemoveBattlerTagAttr, [BattlerTagType.STOCKPILING], true),
    new SelfStatusMove(Moves.SWALLOW, Type.NORMAL, -1, 10, -1, 0, 3)
      .condition(hasStockpileStacksCondition)
      .attr(SwallowHealAttr)
      .attr(RemoveBattlerTagAttr, [BattlerTagType.STOCKPILING], true)
      .triageMove(),
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
      .attr(StatStageChangeAttr, [ Stat.SPATK ], 1)
      .attr(ConfuseAttr),
    new StatusMove(Moves.WILL_O_WISP, Type.FIRE, 85, 15, -1, 0, 3)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new StatusMove(Moves.MEMENTO, Type.DARK, 100, 10, -1, 0, 3)
      .attr(SacrificialAttrOnHit)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPATK ], -2),
    new AttackMove(Moves.FACADE, Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 20, -1, 0, 3)
      .attr(MovePowerMultiplierAttr, (user, target, move) => user.status
        && (user.status.effect === StatusEffect.BURN || user.status.effect === StatusEffect.POISON || user.status.effect === StatusEffect.TOXIC || user.status.effect === StatusEffect.PARALYSIS) ? 2 : 1)
      .attr(BypassBurnDamageReductionAttr),
    new AttackMove(Moves.FOCUS_PUNCH, Type.FIGHTING, MoveCategory.PHYSICAL, 150, 100, 20, -1, -3, 3)
      .attr(MessageHeaderAttr, (user, move) => i18next.t("moveTriggers:isTighteningFocus", {pokemonName: getPokemonNameWithAffix(user)}))
      .punchingMove()
      .ignoresVirtual()
      .condition((user, target, move) => !user.turnData.attacksReceived.find(r => r.damage)),
    new AttackMove(Moves.SMELLING_SALTS, Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 10, -1, 0, 3)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.status?.effect === StatusEffect.PARALYSIS ? 2 : 1)
      .attr(HealStatusEffectAttr, true, StatusEffect.PARALYSIS),
    new SelfStatusMove(Moves.FOLLOW_ME, Type.NORMAL, -1, 20, -1, 2, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.CENTER_OF_ATTENTION, true),
    new StatusMove(Moves.NATURE_POWER, Type.NORMAL, -1, 20, -1, 0, 3)
      .attr(NaturePowerAttr)
      .ignoresVirtual(),
    new SelfStatusMove(Moves.CHARGE, Type.ELECTRIC, -1, 20, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], 1, true)
      .attr(AddBattlerTagAttr, BattlerTagType.CHARGED, true, false),
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
    new AttackMove(Moves.SUPERPOWER, Type.FIGHTING, MoveCategory.PHYSICAL, 120, 100, 5, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF ], -1, true),
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
      .condition((user, target, move) => !target.status && !target.scene.arena.getTagOnSide(ArenaTagType.SAFEGUARD, target.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY)),
    new AttackMove(Moves.KNOCK_OFF, Type.DARK, MoveCategory.PHYSICAL, 65, 100, 20, -1, 0, 3)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.getHeldItems().filter(i => i.isTransferrable).length > 0 ? 1.5 : 1)
      .attr(RemoveHeldItemAttr, false),
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
      .condition((user, target, move) => !!user.status && (user.status.effect === StatusEffect.PARALYSIS || user.status.effect === StatusEffect.POISON || user.status.effect === StatusEffect.TOXIC || user.status.effect === StatusEffect.BURN)),
    new SelfStatusMove(Moves.GRUDGE, Type.GHOST, -1, 5, -1, 0, 3)
      .unimplemented(),
    new SelfStatusMove(Moves.SNATCH, Type.DARK, -1, 10, -1, 4, 3)
      .unimplemented(),
    new AttackMove(Moves.SECRET_POWER, Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 20, 30, 0, 3)
      .makesContact(false)
      .partial(),
    new AttackMove(Moves.DIVE, Type.WATER, MoveCategory.PHYSICAL, 80, 100, 10, -1, 0, 3)
      .attr(ChargeAttr, ChargeAnim.DIVE_CHARGING, i18next.t("moveTriggers:hidUnderwater", {pokemonName: "{USER}"}), BattlerTagType.UNDERWATER, true)
      .attr(GulpMissileTagAttr)
      .ignoresVirtual(),
    new AttackMove(Moves.ARM_THRUST, Type.FIGHTING, MoveCategory.PHYSICAL, 15, 100, 20, -1, 0, 3)
      .attr(MultiHitAttr),
    new SelfStatusMove(Moves.CAMOUFLAGE, Type.NORMAL, -1, 20, -1, 0, 3)
      .attr(CopyBiomeTypeAttr),
    new SelfStatusMove(Moves.TAIL_GLOW, Type.BUG, -1, 20, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], 3, true),
    new AttackMove(Moves.LUSTER_PURGE, Type.PSYCHIC, MoveCategory.SPECIAL, 95, 100, 5, 50, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -1),
    new AttackMove(Moves.MIST_BALL, Type.PSYCHIC, MoveCategory.SPECIAL, 95, 100, 5, 50, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -1)
      .ballBombMove(),
    new StatusMove(Moves.FEATHER_DANCE, Type.FLYING, 100, 15, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -2)
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
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1),
    new AttackMove(Moves.BLAST_BURN, Type.FIRE, MoveCategory.SPECIAL, 150, 90, 5, -1, 0, 3)
      .attr(RechargeAttr),
    new AttackMove(Moves.HYDRO_CANNON, Type.WATER, MoveCategory.SPECIAL, 150, 90, 5, -1, 0, 3)
      .attr(RechargeAttr),
    new AttackMove(Moves.METEOR_MASH, Type.STEEL, MoveCategory.PHYSICAL, 90, 90, 10, 20, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.ATK ], 1, true)
      .punchingMove(),
    new AttackMove(Moves.ASTONISH, Type.GHOST, MoveCategory.PHYSICAL, 30, 100, 15, 30, 0, 3)
      .attr(FlinchAttr),
    new AttackMove(Moves.WEATHER_BALL, Type.NORMAL, MoveCategory.SPECIAL, 50, 100, 10, -1, 0, 3)
      .attr(WeatherBallTypeAttr)
      .attr(MovePowerMultiplierAttr, (user, target, move) => [WeatherType.SUNNY, WeatherType.RAIN, WeatherType.SANDSTORM, WeatherType.HAIL, WeatherType.SNOW, WeatherType.FOG, WeatherType.HEAVY_RAIN, WeatherType.HARSH_SUN].includes(user.scene.arena.weather?.weatherType!) && !user.scene.arena.weather?.isEffectSuppressed(user.scene) ? 2 : 1) // TODO: is this bang correct?
      .ballBombMove(),
    new StatusMove(Moves.AROMATHERAPY, Type.GRASS, -1, 5, -1, 0, 3)
      .attr(PartyStatusCureAttr, i18next.t("moveTriggers:soothingAromaWaftedThroughArea"), Abilities.SAP_SIPPER)
      .target(MoveTarget.PARTY),
    new StatusMove(Moves.FAKE_TEARS, Type.DARK, 100, 20, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -2),
    new AttackMove(Moves.AIR_CUTTER, Type.FLYING, MoveCategory.SPECIAL, 60, 95, 25, -1, 0, 3)
      .attr(HighCritAttr)
      .slicingMove()
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.OVERHEAT, Type.FIRE, MoveCategory.SPECIAL, 130, 90, 5, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -2, true)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE),
    new StatusMove(Moves.ODOR_SLEUTH, Type.NORMAL, -1, 40, -1, 0, 3)
      .attr(ExposedMoveAttr, BattlerTagType.IGNORE_GHOST),
    new AttackMove(Moves.ROCK_TOMB, Type.ROCK, MoveCategory.PHYSICAL, 60, 95, 15, 100, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1)
      .makesContact(false),
    new AttackMove(Moves.SILVER_WIND, Type.BUG, MoveCategory.SPECIAL, 60, 100, 5, 10, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD ], 1, true)
      .windMove(),
    new StatusMove(Moves.METAL_SOUND, Type.STEEL, 85, 40, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -2)
      .soundBased(),
    new StatusMove(Moves.GRASS_WHISTLE, Type.GRASS, 55, 15, -1, 0, 3)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .soundBased(),
    new StatusMove(Moves.TICKLE, Type.NORMAL, 100, 20, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF ], -1),
    new SelfStatusMove(Moves.COSMIC_POWER, Type.PSYCHIC, -1, 20, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.DEF, Stat.SPDEF ], 1, true),
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
    new AttackMove(Moves.SAND_TOMB, Type.GROUND, MoveCategory.PHYSICAL, 35, 85, 15, -1, 0, 3)
      .attr(TrapAttr, BattlerTagType.SAND_TOMB)
      .makesContact(false),
    new AttackMove(Moves.SHEER_COLD, Type.ICE, MoveCategory.SPECIAL, 200, 20, 5, -1, 0, 3)
      .attr(IceNoEffectTypeAttr)
      .attr(OneHitKOAttr)
      .attr(SheerColdAccuracyAttr),
    new AttackMove(Moves.MUDDY_WATER, Type.WATER, MoveCategory.SPECIAL, 90, 85, 10, 30, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.ACC ], -1)
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
      .attr(StatStageChangeAttr, [ Stat.DEF ], 2, true),
    new StatusMove(Moves.BLOCK, Type.NORMAL, -1, 5, -1, 0, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, true, 1),
    new StatusMove(Moves.HOWL, Type.NORMAL, -1, 40, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.ATK ], 1)
      .soundBased()
      .target(MoveTarget.USER_AND_ALLIES),
    new AttackMove(Moves.DRAGON_CLAW, Type.DRAGON, MoveCategory.PHYSICAL, 80, 100, 15, -1, 0, 3),
    new AttackMove(Moves.FRENZY_PLANT, Type.GRASS, MoveCategory.SPECIAL, 150, 90, 5, -1, 0, 3)
      .attr(RechargeAttr),
    new SelfStatusMove(Moves.BULK_UP, Type.FIGHTING, -1, 20, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF ], 1, true),
    new AttackMove(Moves.BOUNCE, Type.FLYING, MoveCategory.PHYSICAL, 85, 85, 5, 30, 0, 3)
      .attr(ChargeAttr, ChargeAnim.BOUNCE_CHARGING, i18next.t("moveTriggers:sprangUp", {pokemonName: "{USER}"}), BattlerTagType.FLYING)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .condition(failOnGravityCondition)
      .ignoresVirtual(),
    new AttackMove(Moves.MUD_SHOT, Type.GROUND, MoveCategory.SPECIAL, 55, 95, 15, 100, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1),
    new AttackMove(Moves.POISON_TAIL, Type.POISON, MoveCategory.PHYSICAL, 50, 100, 25, 10, 0, 3)
      .attr(HighCritAttr)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(Moves.COVET, Type.NORMAL, MoveCategory.PHYSICAL, 60, 100, 25, -1, 0, 3)
      .attr(StealHeldItemChanceAttr, 0.3),
    new AttackMove(Moves.VOLT_TACKLE, Type.ELECTRIC, MoveCategory.PHYSICAL, 120, 100, 15, 10, 0, 3)
      .attr(RecoilAttr, false, 0.33)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .recklessMove(),
    new AttackMove(Moves.MAGICAL_LEAF, Type.GRASS, MoveCategory.SPECIAL, 60, -1, 20, -1, 0, 3),
    new StatusMove(Moves.WATER_SPORT, Type.WATER, -1, 15, -1, 0, 3)
      .attr(AddArenaTagAttr, ArenaTagType.WATER_SPORT, 5)
      .target(MoveTarget.BOTH_SIDES),
    new SelfStatusMove(Moves.CALM_MIND, Type.PSYCHIC, -1, 20, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPATK, Stat.SPDEF ], 1, true),
    new AttackMove(Moves.LEAF_BLADE, Type.GRASS, MoveCategory.PHYSICAL, 90, 100, 15, -1, 0, 3)
      .attr(HighCritAttr)
      .slicingMove(),
    new SelfStatusMove(Moves.DRAGON_DANCE, Type.DRAGON, -1, 20, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPD ], 1, true)
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
      .partial()
      .attr(DelayedAttackAttr, ArenaTagType.DOOM_DESIRE, ChargeAnim.DOOM_DESIRE_CHARGING, i18next.t("moveTriggers:choseDoomDesireAsDestiny", {pokemonName: "{USER}"})),
    new AttackMove(Moves.PSYCHO_BOOST, Type.PSYCHIC, MoveCategory.SPECIAL, 140, 90, 5, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -2, true),
    new SelfStatusMove(Moves.ROOST, Type.FLYING, -1, 5, -1, 0, 4)
      .attr(HealAttr, 0.5)
      .attr(AddBattlerTagAttr, BattlerTagType.ROOSTED, true, false)
      .triageMove(),
    new StatusMove(Moves.GRAVITY, Type.PSYCHIC, -1, 5, -1, 0, 4)
      .attr(AddArenaTagAttr, ArenaTagType.GRAVITY, 5)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(Moves.MIRACLE_EYE, Type.PSYCHIC, -1, 40, -1, 0, 4)
      .attr(ExposedMoveAttr, BattlerTagType.IGNORE_DARK),
    new AttackMove(Moves.WAKE_UP_SLAP, Type.FIGHTING, MoveCategory.PHYSICAL, 70, 100, 10, -1, 0, 4)
      .attr(MovePowerMultiplierAttr, (user, target, move) => targetSleptOrComatoseCondition(user, target, move) ? 2 : 1)
      .attr(HealStatusEffectAttr, false, StatusEffect.SLEEP),
    new AttackMove(Moves.HAMMER_ARM, Type.FIGHTING, MoveCategory.PHYSICAL, 100, 90, 10, -1, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1, true)
      .punchingMove(),
    new AttackMove(Moves.GYRO_BALL, Type.STEEL, MoveCategory.PHYSICAL, -1, 100, 5, -1, 0, 4)
      .attr(GyroBallPowerAttr)
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
      .attr(RemoveArenaTagsAttr, [ ArenaTagType.QUICK_GUARD, ArenaTagType.WIDE_GUARD, ArenaTagType.MAT_BLOCK, ArenaTagType.CRAFTY_SHIELD ], false)
      .makesContact(false)
      .ignoresProtect(),
    new AttackMove(Moves.PLUCK, Type.FLYING, MoveCategory.PHYSICAL, 60, 100, 20, -1, 0, 4)
      .attr(StealEatBerryAttr),
    new StatusMove(Moves.TAILWIND, Type.FLYING, -1, 15, -1, 0, 4)
      .windMove()
      .attr(AddArenaTagAttr, ArenaTagType.TAILWIND, 4, true)
      .target(MoveTarget.USER_SIDE),
    new StatusMove(Moves.ACUPRESSURE, Type.NORMAL, -1, 30, -1, 0, 4)
      .attr(AcupressureStatStageChangeAttr)
      .target(MoveTarget.USER_OR_NEAR_ALLY),
    new AttackMove(Moves.METAL_BURST, Type.STEEL, MoveCategory.PHYSICAL, -1, 100, 10, -1, 0, 4)
      .attr(CounterDamageAttr, (move: Move) => (move.category === MoveCategory.PHYSICAL || move.category === MoveCategory.SPECIAL), 1.5)
      .redirectCounter()
      .makesContact(false)
      .target(MoveTarget.ATTACKER),
    new AttackMove(Moves.U_TURN, Type.BUG, MoveCategory.PHYSICAL, 70, 100, 20, -1, 0, 4)
      .attr(ForceSwitchOutAttr, true, false),
    new AttackMove(Moves.CLOSE_COMBAT, Type.FIGHTING, MoveCategory.PHYSICAL, 120, 100, 5, -1, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.DEF, Stat.SPDEF ], -1, true),
    new AttackMove(Moves.PAYBACK, Type.DARK, MoveCategory.PHYSICAL, 50, 100, 10, -1, 0, 4)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.getLastXMoves(1).find(m => m.turn === target.scene.currentBattle.turn) || user.scene.currentBattle.turnCommands[target.getBattlerIndex()]?.command === Command.BALL ? 2 : 1),
    new AttackMove(Moves.ASSURANCE, Type.DARK, MoveCategory.PHYSICAL, 60, 100, 10, -1, 0, 4)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.turnData.damageTaken > 0 ? 2 : 1),
    new StatusMove(Moves.EMBARGO, Type.DARK, 100, 15, -1, 0, 4)
      .unimplemented(),
    new AttackMove(Moves.FLING, Type.DARK, MoveCategory.PHYSICAL, -1, 100, 10, -1, 0, 4)
      .makesContact(false)
      .unimplemented(),
    new StatusMove(Moves.PSYCHO_SHIFT, Type.PSYCHIC, 100, 10, -1, 0, 4)
      .attr(PsychoShiftEffectAttr)
      .condition((user, target, move) => {
        let statusToApply = user.hasAbility(Abilities.COMATOSE) ? StatusEffect.SLEEP : undefined;
        if (user.status?.effect && isNonVolatileStatusEffect(user.status.effect)) {
          statusToApply = user.status.effect;
        }
        return !!statusToApply && target.canSetStatus(statusToApply, false, false, user);
      }
      ),
    new AttackMove(Moves.TRUMP_CARD, Type.NORMAL, MoveCategory.SPECIAL, -1, -1, 5, -1, 0, 4)
      .makesContact()
      .attr(LessPPMorePowerAttr),
    new StatusMove(Moves.HEAL_BLOCK, Type.PSYCHIC, 100, 15, -1, 0, 4)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(Moves.WRING_OUT, Type.NORMAL, MoveCategory.SPECIAL, -1, 100, 5, -1, 0, 4)
      .attr(OpponentHighHpPowerAttr, 120)
      .makesContact(),
    new SelfStatusMove(Moves.POWER_TRICK, Type.PSYCHIC, -1, 10, -1, 0, 4)
      .unimplemented(),
    new StatusMove(Moves.GASTRO_ACID, Type.POISON, 100, 10, -1, 0, 4)
      .attr(SuppressAbilitiesAttr),
    new StatusMove(Moves.LUCKY_CHANT, Type.NORMAL, -1, 30, -1, 0, 4)
      .attr(AddArenaTagAttr, ArenaTagType.NO_CRIT, 5, true, true)
      .target(MoveTarget.USER_SIDE),
    new StatusMove(Moves.ME_FIRST, Type.NORMAL, -1, 20, -1, 0, 4)
      .ignoresVirtual()
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new SelfStatusMove(Moves.COPYCAT, Type.NORMAL, -1, 20, -1, 0, 4)
      .attr(CopyMoveAttr)
      .ignoresVirtual(),
    new StatusMove(Moves.POWER_SWAP, Type.PSYCHIC, -1, 10, 100, 0, 4)
      .attr(SwapStatStagesAttr, [ Stat.ATK, Stat.SPATK ]),
    new StatusMove(Moves.GUARD_SWAP, Type.PSYCHIC, -1, 10, 100, 0, 4)
      .attr(SwapStatStagesAttr, [ Stat.DEF, Stat.SPDEF ]),
    new AttackMove(Moves.PUNISHMENT, Type.DARK, MoveCategory.PHYSICAL, -1, 100, 5, -1, 0, 4)
      .makesContact(true)
      .attr(PunishmentPowerAttr),
    new AttackMove(Moves.LAST_RESORT, Type.NORMAL, MoveCategory.PHYSICAL, 140, 100, 5, -1, 0, 4)
      .attr(LastResortAttr),
    new StatusMove(Moves.WORRY_SEED, Type.GRASS, 100, 10, -1, 0, 4)
      .attr(AbilityChangeAttr, Abilities.INSOMNIA),
    new AttackMove(Moves.SUCKER_PUNCH, Type.DARK, MoveCategory.PHYSICAL, 70, 100, 5, -1, 1, 4)
      .condition((user, target, move) => user.scene.currentBattle.turnCommands[target.getBattlerIndex()]?.command === Command.FIGHT && !target.turnData.acted && allMoves[user.scene.currentBattle.turnCommands[target.getBattlerIndex()]?.move?.move!].category !== MoveCategory.STATUS), // TODO: is this bang correct?
    new StatusMove(Moves.TOXIC_SPIKES, Type.POISON, -1, 20, -1, 0, 4)
      .attr(AddArenaTrapTagAttr, ArenaTagType.TOXIC_SPIKES)
      .target(MoveTarget.ENEMY_SIDE),
    new StatusMove(Moves.HEART_SWAP, Type.PSYCHIC, -1, 10, -1, 0, 4)
      .attr(SwapStatStagesAttr, BATTLE_STATS),
    new SelfStatusMove(Moves.AQUA_RING, Type.WATER, -1, 20, -1, 0, 4)
      .attr(AddBattlerTagAttr, BattlerTagType.AQUA_RING, true, true),
    new SelfStatusMove(Moves.MAGNET_RISE, Type.ELECTRIC, -1, 10, -1, 0, 4)
      .attr(AddBattlerTagAttr, BattlerTagType.MAGNET_RISEN, true, true)
      .condition((user, target, move) => !user.scene.arena.getTag(ArenaTagType.GRAVITY) && [BattlerTagType.MAGNET_RISEN, BattlerTagType.IGNORE_FLYING, BattlerTagType.INGRAIN].every((tag) => !user.getTag(tag))),
    new AttackMove(Moves.FLARE_BLITZ, Type.FIRE, MoveCategory.PHYSICAL, 120, 100, 15, 10, 0, 4)
      .attr(RecoilAttr, false, 0.33)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .recklessMove(),
    new AttackMove(Moves.FORCE_PALM, Type.FIGHTING, MoveCategory.PHYSICAL, 60, 100, 10, 30, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.AURA_SPHERE, Type.FIGHTING, MoveCategory.SPECIAL, 80, -1, 20, -1, 0, 4)
      .pulseMove()
      .ballBombMove(),
    new SelfStatusMove(Moves.ROCK_POLISH, Type.ROCK, -1, 20, -1, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPD ], 2, true),
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
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -1)
      .soundBased(),
    new AttackMove(Moves.DRAGON_PULSE, Type.DRAGON, MoveCategory.SPECIAL, 85, 100, 10, -1, 0, 4)
      .pulseMove(),
    new AttackMove(Moves.DRAGON_RUSH, Type.DRAGON, MoveCategory.PHYSICAL, 100, 75, 10, 20, 0, 4)
      .attr(MinimizeAccuracyAttr)
      .attr(HitsTagAttr, BattlerTagType.MINIMIZED, true)
      .attr(FlinchAttr),
    new AttackMove(Moves.POWER_GEM, Type.ROCK, MoveCategory.SPECIAL, 80, 100, 20, -1, 0, 4),
    new AttackMove(Moves.DRAIN_PUNCH, Type.FIGHTING, MoveCategory.PHYSICAL, 75, 100, 10, -1, 0, 4)
      .attr(HitHealAttr)
      .punchingMove()
      .triageMove(),
    new AttackMove(Moves.VACUUM_WAVE, Type.FIGHTING, MoveCategory.SPECIAL, 40, 100, 30, -1, 1, 4),
    new AttackMove(Moves.FOCUS_BLAST, Type.FIGHTING, MoveCategory.SPECIAL, 120, 70, 5, 10, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -1)
      .ballBombMove(),
    new AttackMove(Moves.ENERGY_BALL, Type.GRASS, MoveCategory.SPECIAL, 90, 100, 10, 10, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -1)
      .ballBombMove(),
    new AttackMove(Moves.BRAVE_BIRD, Type.FLYING, MoveCategory.PHYSICAL, 120, 100, 15, -1, 0, 4)
      .attr(RecoilAttr, false, 0.33)
      .recklessMove(),
    new AttackMove(Moves.EARTH_POWER, Type.GROUND, MoveCategory.SPECIAL, 90, 100, 10, 10, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -1),
    new StatusMove(Moves.SWITCHEROO, Type.DARK, 100, 10, -1, 0, 4)
      .unimplemented(),
    new AttackMove(Moves.GIGA_IMPACT, Type.NORMAL, MoveCategory.PHYSICAL, 150, 90, 5, -1, 0, 4)
      .attr(RechargeAttr),
    new SelfStatusMove(Moves.NASTY_PLOT, Type.DARK, -1, 20, -1, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], 2, true),
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
      .attr(StatStageChangeAttr, [ Stat.ACC ], -1)
      .ballBombMove(),
    new AttackMove(Moves.PSYCHO_CUT, Type.PSYCHIC, MoveCategory.PHYSICAL, 70, 100, 20, -1, 0, 4)
      .attr(HighCritAttr)
      .slicingMove()
      .makesContact(false),
    new AttackMove(Moves.ZEN_HEADBUTT, Type.PSYCHIC, MoveCategory.PHYSICAL, 80, 90, 15, 20, 0, 4)
      .attr(FlinchAttr),
    new AttackMove(Moves.MIRROR_SHOT, Type.STEEL, MoveCategory.SPECIAL, 65, 85, 10, 30, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.ACC ], -1),
    new AttackMove(Moves.FLASH_CANNON, Type.STEEL, MoveCategory.SPECIAL, 80, 100, 10, 10, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -1),
    new AttackMove(Moves.ROCK_CLIMB, Type.NORMAL, MoveCategory.PHYSICAL, 90, 85, 20, 20, 0, 4)
      .attr(ConfuseAttr),
    new StatusMove(Moves.DEFOG, Type.FLYING, -1, 15, -1, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.EVA ], -1)
      .attr(ClearWeatherAttr, WeatherType.FOG)
      .attr(ClearTerrainAttr)
      .attr(RemoveScreensAttr, false)
      .attr(RemoveArenaTrapAttr, true),
    new StatusMove(Moves.TRICK_ROOM, Type.PSYCHIC, -1, 5, -1, -7, 4)
      .attr(AddArenaTagAttr, ArenaTagType.TRICK_ROOM, 5)
      .ignoresProtect()
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.DRACO_METEOR, Type.DRAGON, MoveCategory.SPECIAL, 130, 90, 5, -1, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -2, true),
    new AttackMove(Moves.DISCHARGE, Type.ELECTRIC, MoveCategory.SPECIAL, 80, 100, 15, 30, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.LAVA_PLUME, Type.FIRE, MoveCategory.SPECIAL, 80, 100, 15, 30, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.LEAF_STORM, Type.GRASS, MoveCategory.SPECIAL, 130, 90, 5, -1, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -2, true),
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
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -2)
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
      .attr(FormChangeItemTypeAttr),
    new AttackMove(Moves.BUG_BITE, Type.BUG, MoveCategory.PHYSICAL, 60, 100, 20, -1, 0, 4)
      .attr(StealEatBerryAttr),
    new AttackMove(Moves.CHARGE_BEAM, Type.ELECTRIC, MoveCategory.SPECIAL, 50, 90, 10, 70, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], 1, true),
    new AttackMove(Moves.WOOD_HAMMER, Type.GRASS, MoveCategory.PHYSICAL, 120, 100, 15, -1, 0, 4)
      .attr(RecoilAttr, false, 0.33)
      .recklessMove(),
    new AttackMove(Moves.AQUA_JET, Type.WATER, MoveCategory.PHYSICAL, 40, 100, 20, -1, 1, 4),
    new AttackMove(Moves.ATTACK_ORDER, Type.BUG, MoveCategory.PHYSICAL, 90, 100, 15, -1, 0, 4)
      .attr(HighCritAttr)
      .makesContact(false),
    new SelfStatusMove(Moves.DEFEND_ORDER, Type.BUG, -1, 10, -1, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.DEF, Stat.SPDEF ], 1, true),
    new SelfStatusMove(Moves.HEAL_ORDER, Type.BUG, -1, 10, -1, 0, 4)
      .attr(HealAttr, 0.5)
      .triageMove(),
    new AttackMove(Moves.HEAD_SMASH, Type.ROCK, MoveCategory.PHYSICAL, 150, 80, 5, -1, 0, 4)
      .attr(RecoilAttr, false, 0.5)
      .recklessMove(),
    new AttackMove(Moves.DOUBLE_HIT, Type.NORMAL, MoveCategory.PHYSICAL, 35, 90, 10, -1, 0, 4)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.ROAR_OF_TIME, Type.DRAGON, MoveCategory.SPECIAL, 150, 90, 5, -1, 0, 4)
      .attr(RechargeAttr),
    new AttackMove(Moves.SPACIAL_REND, Type.DRAGON, MoveCategory.SPECIAL, 100, 95, 5, -1, 0, 4)
      .attr(HighCritAttr),
    new SelfStatusMove(Moves.LUNAR_DANCE, Type.PSYCHIC, -1, 10, -1, 0, 4)
      .attr(SacrificialAttrOnHit)
      .danceMove()
      .triageMove()
      .unimplemented(),
    new AttackMove(Moves.CRUSH_GRIP, Type.NORMAL, MoveCategory.PHYSICAL, -1, 100, 5, -1, 0, 4)
      .attr(OpponentHighHpPowerAttr, 120),
    new AttackMove(Moves.MAGMA_STORM, Type.FIRE, MoveCategory.SPECIAL, 100, 75, 5, -1, 0, 4)
      .attr(TrapAttr, BattlerTagType.MAGMA_STORM),
    new StatusMove(Moves.DARK_VOID, Type.DARK, 80, 10, -1, 0, 4)  //Accuracy from Generations 4-6
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.SEED_FLARE, Type.GRASS, MoveCategory.SPECIAL, 120, 85, 5, 40, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -2),
    new AttackMove(Moves.OMINOUS_WIND, Type.GHOST, MoveCategory.SPECIAL, 60, 100, 5, 10, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD ], 1, true)
      .windMove(),
    new AttackMove(Moves.SHADOW_FORCE, Type.GHOST, MoveCategory.PHYSICAL, 120, 100, 5, -1, 0, 4)
      .attr(ChargeAttr, ChargeAnim.SHADOW_FORCE_CHARGING, i18next.t("moveTriggers:vanishedInstantly", {pokemonName: "{USER}"}), BattlerTagType.HIDDEN)
      .ignoresProtect()
      .ignoresVirtual(),
    new SelfStatusMove(Moves.HONE_CLAWS, Type.DARK, -1, 15, -1, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.ACC ], 1, true),
    new StatusMove(Moves.WIDE_GUARD, Type.ROCK, -1, 10, -1, 3, 5)
      .target(MoveTarget.USER_SIDE)
      .attr(AddArenaTagAttr, ArenaTagType.WIDE_GUARD, 1, true, true)
      .condition(failIfLastCondition),
    new StatusMove(Moves.GUARD_SPLIT, Type.PSYCHIC, -1, 10, -1, 0, 5)
      .attr(AverageStatsAttr, [ Stat.DEF, Stat.SPDEF ], "moveTriggers:sharedGuard"),
    new StatusMove(Moves.POWER_SPLIT, Type.PSYCHIC, -1, 10, -1, 0, 5)
      .attr(AverageStatsAttr, [ Stat.ATK, Stat.SPATK ], "moveTriggers:sharedPower"),
    new StatusMove(Moves.WONDER_ROOM, Type.PSYCHIC, -1, 10, -1, 0, 5)
      .ignoresProtect()
      .target(MoveTarget.BOTH_SIDES)
      .unimplemented(),
    new AttackMove(Moves.PSYSHOCK, Type.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 5)
      .attr(DefDefAttr),
    new AttackMove(Moves.VENOSHOCK, Type.POISON, MoveCategory.SPECIAL, 65, 100, 10, -1, 0, 5)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.status && (target.status.effect === StatusEffect.POISON || target.status.effect === StatusEffect.TOXIC) ? 2 : 1),
    new SelfStatusMove(Moves.AUTOTOMIZE, Type.STEEL, -1, 15, -1, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.SPD ], 2, true)
      .partial(),
    new SelfStatusMove(Moves.RAGE_POWDER, Type.BUG, -1, 20, -1, 2, 5)
      .powderMove()
      .attr(AddBattlerTagAttr, BattlerTagType.CENTER_OF_ATTENTION, true),
    new StatusMove(Moves.TELEKINESIS, Type.PSYCHIC, -1, 15, -1, 0, 5)
      .condition(failOnGravityCondition)
      .unimplemented(),
    new StatusMove(Moves.MAGIC_ROOM, Type.PSYCHIC, -1, 10, -1, 0, 5)
      .ignoresProtect()
      .target(MoveTarget.BOTH_SIDES)
      .unimplemented(),
    new AttackMove(Moves.SMACK_DOWN, Type.ROCK, MoveCategory.PHYSICAL, 50, 100, 15, 100, 0, 5)
      .attr(AddBattlerTagAttr, BattlerTagType.IGNORE_FLYING, false, false, 1, 1, true)
      .attr(AddBattlerTagAttr, BattlerTagType.INTERRUPTED)
      .attr(RemoveBattlerTagAttr, [BattlerTagType.FLYING, BattlerTagType.MAGNET_RISEN])
      .attr(HitsTagAttr, BattlerTagType.FLYING, false)
      .makesContact(false),
    new AttackMove(Moves.STORM_THROW, Type.FIGHTING, MoveCategory.PHYSICAL, 60, 100, 10, -1, 0, 5)
      .attr(CritOnlyAttr),
    new AttackMove(Moves.FLAME_BURST, Type.FIRE, MoveCategory.SPECIAL, 70, 100, 15, -1, 0, 5)
      .attr(FlameBurstAttr),
    new AttackMove(Moves.SLUDGE_WAVE, Type.POISON, MoveCategory.SPECIAL, 95, 100, 10, 10, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new SelfStatusMove(Moves.QUIVER_DANCE, Type.BUG, -1, 20, -1, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.SPATK, Stat.SPDEF, Stat.SPD ], 1, true)
      .danceMove(),
    new AttackMove(Moves.HEAVY_SLAM, Type.STEEL, MoveCategory.PHYSICAL, -1, 100, 10, -1, 0, 5)
      .attr(MinimizeAccuracyAttr)
      .attr(CompareWeightPowerAttr)
      .attr(HitsTagAttr, BattlerTagType.MINIMIZED, true)
      .condition(failOnMaxCondition),
    new AttackMove(Moves.SYNCHRONOISE, Type.PSYCHIC, MoveCategory.SPECIAL, 120, 100, 10, -1, 0, 5)
      .target(MoveTarget.ALL_NEAR_OTHERS)
      .condition(unknownTypeCondition)
      .attr(hitsSameTypeAttr),
    new AttackMove(Moves.ELECTRO_BALL, Type.ELECTRIC, MoveCategory.SPECIAL, -1, 100, 10, -1, 0, 5)
      .attr(ElectroBallPowerAttr)
      .ballBombMove(),
    new StatusMove(Moves.SOAK, Type.WATER, 100, 20, -1, 0, 5)
      .attr(ChangeTypeAttr, Type.WATER),
    new AttackMove(Moves.FLAME_CHARGE, Type.FIRE, MoveCategory.PHYSICAL, 50, 100, 20, 100, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.SPD ], 1, true),
    new SelfStatusMove(Moves.COIL, Type.POISON, -1, 20, -1, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF, Stat.ACC ], 1, true),
    new AttackMove(Moves.LOW_SWEEP, Type.FIGHTING, MoveCategory.PHYSICAL, 65, 100, 20, 100, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1),
    new AttackMove(Moves.ACID_SPRAY, Type.POISON, MoveCategory.SPECIAL, 40, 100, 20, 100, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -2)
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
      .attr(IgnoreOpponentStatStagesAttr),
    new AttackMove(Moves.CLEAR_SMOG, Type.POISON, MoveCategory.SPECIAL, 50, -1, 15, -1, 0, 5)
      .attr(ResetStatsAttr, false),
    new AttackMove(Moves.STORED_POWER, Type.PSYCHIC, MoveCategory.SPECIAL, 20, 100, 10, -1, 0, 5)
      .attr(PositiveStatStagePowerAttr),
    new StatusMove(Moves.QUICK_GUARD, Type.FIGHTING, -1, 15, -1, 3, 5)
      .target(MoveTarget.USER_SIDE)
      .attr(AddArenaTagAttr, ArenaTagType.QUICK_GUARD, 1, true, true)
      .condition(failIfLastCondition),
    new SelfStatusMove(Moves.ALLY_SWITCH, Type.PSYCHIC, -1, 15, -1, 2, 5)
      .ignoresProtect()
      .unimplemented(),
    new AttackMove(Moves.SCALD, Type.WATER, MoveCategory.SPECIAL, 80, 100, 15, 30, 0, 5)
      .attr(HealStatusEffectAttr, false, StatusEffect.FREEZE)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new SelfStatusMove(Moves.SHELL_SMASH, Type.NORMAL, -1, 15, -1, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPATK, Stat.SPD ], 2, true)
      .attr(StatStageChangeAttr, [ Stat.DEF, Stat.SPDEF ], -1, true),
    new StatusMove(Moves.HEAL_PULSE, Type.PSYCHIC, -1, 10, -1, 0, 5)
      .attr(HealAttr, 0.5, false, false)
      .pulseMove()
      .triageMove(),
    new AttackMove(Moves.HEX, Type.GHOST, MoveCategory.SPECIAL, 65, 100, 10, -1, 0, 5)
      .attr(
        MovePowerMultiplierAttr,
        (user, target, move) =>  target.status || target.hasAbility(Abilities.COMATOSE)? 2 : 1),
    new AttackMove(Moves.SKY_DROP, Type.FLYING, MoveCategory.PHYSICAL, 60, 100, 10, -1, 0, 5)
      .attr(ChargeAttr, ChargeAnim.SKY_DROP_CHARGING, i18next.t("moveTriggers:tookTargetIntoSky", {pokemonName: "{USER}", targetName: "{TARGET}"}), BattlerTagType.FLYING) // TODO: Add 2nd turn message
      .condition(failOnGravityCondition)
      .ignoresVirtual(),
    new SelfStatusMove(Moves.SHIFT_GEAR, Type.STEEL, -1, 10, -1, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.ATK ], 1, true)
      .attr(StatStageChangeAttr, [ Stat.SPD ], 2, true),
    new AttackMove(Moves.CIRCLE_THROW, Type.FIGHTING, MoveCategory.PHYSICAL, 60, 90, 10, -1, -6, 5)
      .attr(ForceSwitchOutAttr),
    new AttackMove(Moves.INCINERATE, Type.FIRE, MoveCategory.SPECIAL, 60, 100, 15, -1, 0, 5)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .attr(RemoveHeldItemAttr, true),
    new StatusMove(Moves.QUASH, Type.DARK, 100, 15, -1, 0, 5)
      .unimplemented(),
    new AttackMove(Moves.ACROBATICS, Type.FLYING, MoveCategory.PHYSICAL, 55, 100, 15, -1, 0, 5)
      .attr(MovePowerMultiplierAttr, (user, target, move) => Math.max(1, 2 - 0.2 * user.getHeldItems().filter(i => i.isTransferrable).reduce((v, m) => v + m.stackCount, 0))),
    new StatusMove(Moves.REFLECT_TYPE, Type.NORMAL, -1, 15, -1, 0, 5)
      .attr(CopyTypeAttr),
    new AttackMove(Moves.RETALIATE, Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 5, -1, 0, 5)
      .partial(),
    new AttackMove(Moves.FINAL_GAMBIT, Type.FIGHTING, MoveCategory.SPECIAL, -1, 100, 5, -1, 0, 5)
      .attr(UserHpDamageAttr)
      .attr(SacrificialAttrOnHit),
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
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.BULLDOZE, Type.GROUND, MoveCategory.PHYSICAL, 60, 100, 20, 100, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.FROST_BREATH, Type.ICE, MoveCategory.SPECIAL, 60, 90, 10, 100, 0, 5)
      .attr(CritOnlyAttr),
    new AttackMove(Moves.DRAGON_TAIL, Type.DRAGON, MoveCategory.PHYSICAL, 60, 90, 10, -1, -6, 5)
      .attr(ForceSwitchOutAttr)
      .hidesTarget(),
    new SelfStatusMove(Moves.WORK_UP, Type.NORMAL, -1, 30, -1, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPATK ], 1, true),
    new AttackMove(Moves.ELECTROWEB, Type.ELECTRIC, MoveCategory.SPECIAL, 55, 95, 15, 100, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.WILD_CHARGE, Type.ELECTRIC, MoveCategory.PHYSICAL, 90, 100, 15, -1, 0, 5)
      .attr(RecoilAttr)
      .recklessMove(),
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
      .attr(IgnoreOpponentStatStagesAttr)
      .slicingMove(),
    new AttackMove(Moves.RAZOR_SHELL, Type.WATER, MoveCategory.PHYSICAL, 75, 95, 10, 50, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1)
      .slicingMove(),
    new AttackMove(Moves.HEAT_CRASH, Type.FIRE, MoveCategory.PHYSICAL, -1, 100, 10, -1, 0, 5)
      .attr(MinimizeAccuracyAttr)
      .attr(CompareWeightPowerAttr)
      .attr(HitsTagAttr, BattlerTagType.MINIMIZED, true)
      .condition(failOnMaxCondition),
    new AttackMove(Moves.LEAF_TORNADO, Type.GRASS, MoveCategory.SPECIAL, 65, 90, 10, 50, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.ACC ], -1),
    new AttackMove(Moves.STEAMROLLER, Type.BUG, MoveCategory.PHYSICAL, 65, 100, 20, 30, 0, 5)
      .attr(FlinchAttr),
    new SelfStatusMove(Moves.COTTON_GUARD, Type.GRASS, -1, 10, -1, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 3, true),
    new AttackMove(Moves.NIGHT_DAZE, Type.DARK, MoveCategory.SPECIAL, 85, 95, 10, 40, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.ACC ], -1),
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
      .attr(RecoilAttr)
      .recklessMove(),
    new AttackMove(Moves.GEAR_GRIND, Type.STEEL, MoveCategory.PHYSICAL, 50, 85, 15, -1, 0, 5)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.SEARING_SHOT, Type.FIRE, MoveCategory.SPECIAL, 100, 100, 5, 30, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .ballBombMove()
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.TECHNO_BLAST, Type.NORMAL, MoveCategory.SPECIAL, 120, 100, 5, -1, 0, 5)
      .attr(TechnoBlastTypeAttr),
    new AttackMove(Moves.RELIC_SONG, Type.NORMAL, MoveCategory.SPECIAL, 75, 100, 10, 10, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.SECRET_SWORD, Type.FIGHTING, MoveCategory.SPECIAL, 85, 100, 10, -1, 0, 5)
      .attr(DefDefAttr)
      .slicingMove(),
    new AttackMove(Moves.GLACIATE, Type.ICE, MoveCategory.SPECIAL, 65, 95, 10, 100, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.BOLT_STRIKE, Type.ELECTRIC, MoveCategory.PHYSICAL, 130, 85, 5, 20, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.BLUE_FLARE, Type.FIRE, MoveCategory.SPECIAL, 130, 85, 5, 20, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.FIERY_DANCE, Type.FIRE, MoveCategory.SPECIAL, 80, 100, 10, 50, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], 1, true)
      .danceMove(),
    new AttackMove(Moves.FREEZE_SHOCK, Type.ICE, MoveCategory.PHYSICAL, 140, 90, 5, 30, 0, 5)
      .attr(ChargeAttr, ChargeAnim.FREEZE_SHOCK_CHARGING, i18next.t("moveTriggers:becameCloakedInFreezingLight", {pokemonName: "{USER}"}))
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .makesContact(false),
    new AttackMove(Moves.ICE_BURN, Type.ICE, MoveCategory.SPECIAL, 140, 90, 5, 30, 0, 5)
      .attr(ChargeAttr, ChargeAnim.ICE_BURN_CHARGING, i18next.t("moveTriggers:becameCloakedInFreezingAir", {pokemonName: "{USER}"}))
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .ignoresVirtual(),
    new AttackMove(Moves.SNARL, Type.DARK, MoveCategory.SPECIAL, 55, 95, 15, 100, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -1)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.ICICLE_CRASH, Type.ICE, MoveCategory.PHYSICAL, 85, 90, 10, 30, 0, 5)
      .attr(FlinchAttr)
      .makesContact(false),
    new AttackMove(Moves.V_CREATE, Type.FIRE, MoveCategory.PHYSICAL, 180, 95, 5, -1, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.DEF, Stat.SPDEF, Stat.SPD ], -1, true),
    new AttackMove(Moves.FUSION_FLARE, Type.FIRE, MoveCategory.SPECIAL, 100, 100, 5, -1, 0, 5)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(LastMoveDoublePowerAttr, Moves.FUSION_BOLT),
    new AttackMove(Moves.FUSION_BOLT, Type.ELECTRIC, MoveCategory.PHYSICAL, 100, 100, 5, -1, 0, 5)
      .attr(LastMoveDoublePowerAttr, Moves.FUSION_FLARE)
      .makesContact(false),
    new AttackMove(Moves.FLYING_PRESS, Type.FIGHTING, MoveCategory.PHYSICAL, 100, 95, 10, -1, 0, 6)
      .attr(MinimizeAccuracyAttr)
      .attr(FlyingTypeMultiplierAttr)
      .attr(HitsTagAttr, BattlerTagType.MINIMIZED, true)
      .condition(failOnGravityCondition),
    new StatusMove(Moves.MAT_BLOCK, Type.FIGHTING, -1, 10, -1, 0, 6)
      .target(MoveTarget.USER_SIDE)
      .attr(AddArenaTagAttr, ArenaTagType.MAT_BLOCK, 1, true, true)
      .condition(new FirstMoveCondition())
      .condition(failIfLastCondition),
    new AttackMove(Moves.BELCH, Type.POISON, MoveCategory.SPECIAL, 120, 90, 10, -1, 0, 6)
      .condition((user, target, move) => user.battleData.berriesEaten.length > 0),
    new StatusMove(Moves.ROTOTILLER, Type.GROUND, -1, 10, -1, 0, 6)
      .target(MoveTarget.ALL)
      .condition((user, target, move) => {
        // If any fielded pokémon is grass-type and grounded.
        return [...user.scene.getEnemyParty(), ...user.scene.getParty()].some((poke) => poke.isOfType(Type.GRASS) && poke.isGrounded());
      })
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPATK ], 1, false, (user, target, move) => target.isOfType(Type.GRASS) && target.isGrounded()),
    new StatusMove(Moves.STICKY_WEB, Type.BUG, -1, 20, -1, 0, 6)
      .attr(AddArenaTrapTagAttr, ArenaTagType.STICKY_WEB)
      .target(MoveTarget.ENEMY_SIDE),
    new AttackMove(Moves.FELL_STINGER, Type.BUG, MoveCategory.PHYSICAL, 50, 100, 25, -1, 0, 6)
      .attr(PostVictoryStatStageChangeAttr, [ Stat.ATK ], 3, true ),
    new AttackMove(Moves.PHANTOM_FORCE, Type.GHOST, MoveCategory.PHYSICAL, 90, 100, 10, -1, 0, 6)
      .attr(ChargeAttr, ChargeAnim.PHANTOM_FORCE_CHARGING, i18next.t("moveTriggers:vanishedInstantly", {pokemonName: "{USER}"}), BattlerTagType.HIDDEN)
      .ignoresProtect()
      .ignoresVirtual(),
    new StatusMove(Moves.TRICK_OR_TREAT, Type.GHOST, 100, 20, -1, 0, 6)
      .attr(AddTypeAttr, Type.GHOST)
      .partial(),
    new StatusMove(Moves.NOBLE_ROAR, Type.NORMAL, 100, 30, -1, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPATK ], -1)
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
      .attr(WaterSuperEffectTypeMultiplierAttr)
      .partial(), // This currently just multiplies the move's power instead of changing its effectiveness. It also doesn't account for abilities that modify type effectiveness such as tera shell.
    new AttackMove(Moves.DISARMING_VOICE, Type.FAIRY, MoveCategory.SPECIAL, 40, -1, 15, -1, 0, 6)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.PARTING_SHOT, Type.DARK, 100, 20, -1, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPATK ], -1, false, null, true, true, MoveEffectTrigger.PRE_APPLY)
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
      .attr(AddArenaTagAttr, ArenaTagType.CRAFTY_SHIELD, 1, true, true)
      .condition(failIfLastCondition),
    new StatusMove(Moves.FLOWER_SHIELD, Type.FAIRY, -1, 10, -1, 0, 6)
      .target(MoveTarget.ALL)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 1, false, (user, target, move) => target.getTypes().includes(Type.GRASS) && !target.getTag(SemiInvulnerableTag)),
    new StatusMove(Moves.GRASSY_TERRAIN, Type.GRASS, -1, 10, -1, 0, 6)
      .attr(TerrainChangeAttr, TerrainType.GRASSY)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(Moves.MISTY_TERRAIN, Type.FAIRY, -1, 10, -1, 0, 6)
      .attr(TerrainChangeAttr, TerrainType.MISTY)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(Moves.ELECTRIFY, Type.ELECTRIC, -1, 20, -1, 0, 6)
      .unimplemented(),
    new AttackMove(Moves.PLAY_ROUGH, Type.FAIRY, MoveCategory.PHYSICAL, 90, 90, 10, 10, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1),
    new AttackMove(Moves.FAIRY_WIND, Type.FAIRY, MoveCategory.SPECIAL, 40, 100, 30, -1, 0, 6)
      .windMove(),
    new AttackMove(Moves.MOONBLAST, Type.FAIRY, MoveCategory.SPECIAL, 95, 100, 15, 30, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -1),
    new AttackMove(Moves.BOOMBURST, Type.NORMAL, MoveCategory.SPECIAL, 140, 100, 10, -1, 0, 6)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new StatusMove(Moves.FAIRY_LOCK, Type.FAIRY, -1, 10, -1, 0, 6)
      .target(MoveTarget.BOTH_SIDES)
      .unimplemented(),
    new SelfStatusMove(Moves.KINGS_SHIELD, Type.STEEL, -1, 10, -1, 4, 6)
      .attr(ProtectAttr, BattlerTagType.KINGS_SHIELD)
      .condition(failIfLastCondition),
    new StatusMove(Moves.PLAY_NICE, Type.NORMAL, -1, 20, -1, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1),
    new StatusMove(Moves.CONFIDE, Type.NORMAL, -1, 20, -1, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -1)
      .soundBased(),
    new AttackMove(Moves.DIAMOND_STORM, Type.ROCK, MoveCategory.PHYSICAL, 100, 95, 5, 50, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 2, true)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.STEAM_ERUPTION, Type.WATER, MoveCategory.SPECIAL, 110, 95, 5, 30, 0, 6)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(HealStatusEffectAttr, false, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.HYPERSPACE_HOLE, Type.PSYCHIC, MoveCategory.SPECIAL, 80, -1, 5, -1, 0, 6)
      .ignoresProtect(),
    new AttackMove(Moves.WATER_SHURIKEN, Type.WATER, MoveCategory.SPECIAL, 15, 100, 20, -1, 1, 6)
      .attr(MultiHitAttr)
      .attr(WaterShurikenPowerAttr)
      .attr(WaterShurikenMultiHitTypeAttr),
    new AttackMove(Moves.MYSTICAL_FIRE, Type.FIRE, MoveCategory.SPECIAL, 75, 100, 10, 100, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -1),
    new SelfStatusMove(Moves.SPIKY_SHIELD, Type.GRASS, -1, 10, -1, 4, 6)
      .attr(ProtectAttr, BattlerTagType.SPIKY_SHIELD)
      .condition(failIfLastCondition),
    new StatusMove(Moves.AROMATIC_MIST, Type.FAIRY, -1, 20, -1, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], 1)
      .target(MoveTarget.NEAR_ALLY),
    new StatusMove(Moves.EERIE_IMPULSE, Type.ELECTRIC, 100, 15, -1, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -2),
    new StatusMove(Moves.VENOM_DRENCH, Type.POISON, 100, 20, -1, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPATK, Stat.SPD ], -1, false, (user, target, move) => target.status?.effect === StatusEffect.POISON || target.status?.effect === StatusEffect.TOXIC)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.POWDER, Type.BUG, 100, 20, -1, 1, 6)
      .powderMove()
      .unimplemented(),
    new SelfStatusMove(Moves.GEOMANCY, Type.FAIRY, -1, 10, -1, 0, 6)
      .attr(ChargeAttr, ChargeAnim.GEOMANCY_CHARGING, i18next.t("moveTriggers:isChargingPower", {pokemonName: "{USER}"}))
      .attr(StatStageChangeAttr, [ Stat.SPATK, Stat.SPDEF, Stat.SPD ], 2, true)
      .ignoresVirtual(),
    new StatusMove(Moves.MAGNETIC_FLUX, Type.ELECTRIC, -1, 20, -1, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.DEF, Stat.SPDEF ], 1, false, (user, target, move) => !![ Abilities.PLUS, Abilities.MINUS].find(a => target.hasAbility(a, false)))
      .target(MoveTarget.USER_AND_ALLIES)
      .condition((user, target, move) => !![ user, user.getAlly() ].filter(p => p?.isActive()).find(p => !![ Abilities.PLUS, Abilities.MINUS].find(a => p.hasAbility(a, false)))),
    new StatusMove(Moves.HAPPY_HOUR, Type.NORMAL, -1, 30, -1, 0, 6) // No animation
      .attr(AddArenaTagAttr, ArenaTagType.HAPPY_HOUR, null, true)
      .target(MoveTarget.USER_SIDE),
    new StatusMove(Moves.ELECTRIC_TERRAIN, Type.ELECTRIC, -1, 10, -1, 0, 6)
      .attr(TerrainChangeAttr, TerrainType.ELECTRIC)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.DAZZLING_GLEAM, Type.FAIRY, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 6)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new SelfStatusMove(Moves.CELEBRATE, Type.NORMAL, -1, 40, -1, 0, 6),
    new StatusMove(Moves.HOLD_HANDS, Type.NORMAL, -1, 40, -1, 0, 6)
      .target(MoveTarget.NEAR_ALLY),
    new StatusMove(Moves.BABY_DOLL_EYES, Type.FAIRY, 100, 30, -1, 1, 6)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1),
    new AttackMove(Moves.NUZZLE, Type.ELECTRIC, MoveCategory.PHYSICAL, 20, 100, 20, 100, 0, 6)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.HOLD_BACK, Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 40, -1, 0, 6)
      .attr(SurviveDamageAttr),
    new AttackMove(Moves.INFESTATION, Type.BUG, MoveCategory.SPECIAL, 20, 100, 20, -1, 0, 6)
      .makesContact()
      .attr(TrapAttr, BattlerTagType.INFESTATION),
    new AttackMove(Moves.POWER_UP_PUNCH, Type.FIGHTING, MoveCategory.PHYSICAL, 40, 100, 20, 100, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.ATK ], 1, true)
      .punchingMove(),
    new AttackMove(Moves.OBLIVION_WING, Type.FLYING, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 6)
      .attr(HitHealAttr, 0.75)
      .triageMove(),
    new AttackMove(Moves.THOUSAND_ARROWS, Type.GROUND, MoveCategory.PHYSICAL, 90, 100, 10, -1, 0, 6)
      .attr(NeutralDamageAgainstFlyingTypeMultiplierAttr)
      .attr(AddBattlerTagAttr, BattlerTagType.IGNORE_FLYING, false, false, 1, 1, true)
      .attr(HitsTagAttr, BattlerTagType.FLYING, false)
      .attr(HitsTagAttr, BattlerTagType.MAGNET_RISEN, false)
      .attr(AddBattlerTagAttr, BattlerTagType.INTERRUPTED)
      .attr(RemoveBattlerTagAttr, [BattlerTagType.FLYING, BattlerTagType.MAGNET_RISEN])
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.THOUSAND_WAVES, Type.GROUND, MoveCategory.PHYSICAL, 90, 100, 10, -1, 0, 6)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, false, 1, 1, true)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.LANDS_WRATH, Type.GROUND, MoveCategory.PHYSICAL, 90, 100, 10, -1, 0, 6)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.LIGHT_OF_RUIN, Type.FAIRY, MoveCategory.SPECIAL, 140, 90, 5, -1, 0, 6)
      .attr(RecoilAttr, false, 0.5)
      .recklessMove(),
    new AttackMove(Moves.ORIGIN_PULSE, Type.WATER, MoveCategory.SPECIAL, 110, 85, 10, -1, 0, 6)
      .pulseMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.PRECIPICE_BLADES, Type.GROUND, MoveCategory.PHYSICAL, 120, 85, 10, -1, 0, 6)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.DRAGON_ASCENT, Type.FLYING, MoveCategory.PHYSICAL, 120, 100, 5, -1, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.DEF, Stat.SPDEF ], -1, true),
    new AttackMove(Moves.HYPERSPACE_FURY, Type.DARK, MoveCategory.PHYSICAL, 100, -1, 5, -1, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1, true)
      .makesContact(false)
      .ignoresProtect(),
    /* Unused */
    new AttackMove(Moves.BREAKNECK_BLITZ__PHYSICAL, Type.NORMAL, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.BREAKNECK_BLITZ__SPECIAL, Type.NORMAL, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.ALL_OUT_PUMMELING__PHYSICAL, Type.FIGHTING, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.ALL_OUT_PUMMELING__SPECIAL, Type.FIGHTING, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.SUPERSONIC_SKYSTRIKE__PHYSICAL, Type.FLYING, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.SUPERSONIC_SKYSTRIKE__SPECIAL, Type.FLYING, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.ACID_DOWNPOUR__PHYSICAL, Type.POISON, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.ACID_DOWNPOUR__SPECIAL, Type.POISON, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.TECTONIC_RAGE__PHYSICAL, Type.GROUND, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.TECTONIC_RAGE__SPECIAL, Type.GROUND, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.CONTINENTAL_CRUSH__PHYSICAL, Type.ROCK, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.CONTINENTAL_CRUSH__SPECIAL, Type.ROCK, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.SAVAGE_SPIN_OUT__PHYSICAL, Type.BUG, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.SAVAGE_SPIN_OUT__SPECIAL, Type.BUG, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.NEVER_ENDING_NIGHTMARE__PHYSICAL, Type.GHOST, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.NEVER_ENDING_NIGHTMARE__SPECIAL, Type.GHOST, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.CORKSCREW_CRASH__PHYSICAL, Type.STEEL, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.CORKSCREW_CRASH__SPECIAL, Type.STEEL, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.INFERNO_OVERDRIVE__PHYSICAL, Type.FIRE, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.INFERNO_OVERDRIVE__SPECIAL, Type.FIRE, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.HYDRO_VORTEX__PHYSICAL, Type.WATER, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.HYDRO_VORTEX__SPECIAL, Type.WATER, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.BLOOM_DOOM__PHYSICAL, Type.GRASS, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.BLOOM_DOOM__SPECIAL, Type.GRASS, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.GIGAVOLT_HAVOC__PHYSICAL, Type.ELECTRIC, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.GIGAVOLT_HAVOC__SPECIAL, Type.ELECTRIC, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.SHATTERED_PSYCHE__PHYSICAL, Type.PSYCHIC, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.SHATTERED_PSYCHE__SPECIAL, Type.PSYCHIC, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.SUBZERO_SLAMMER__PHYSICAL, Type.ICE, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.SUBZERO_SLAMMER__SPECIAL, Type.ICE, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.DEVASTATING_DRAKE__PHYSICAL, Type.DRAGON, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.DEVASTATING_DRAKE__SPECIAL, Type.DRAGON, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.BLACK_HOLE_ECLIPSE__PHYSICAL, Type.DARK, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.BLACK_HOLE_ECLIPSE__SPECIAL, Type.DARK, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.TWINKLE_TACKLE__PHYSICAL, Type.FAIRY, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.TWINKLE_TACKLE__SPECIAL, Type.FAIRY, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.CATASTROPIKA, Type.ELECTRIC, MoveCategory.PHYSICAL, 210, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    /* End Unused */
    new SelfStatusMove(Moves.SHORE_UP, Type.GROUND, -1, 5, -1, 0, 7)
      .attr(SandHealAttr)
      .triageMove(),
    new AttackMove(Moves.FIRST_IMPRESSION, Type.BUG, MoveCategory.PHYSICAL, 90, 100, 10, -1, 2, 7)
      .condition(new FirstMoveCondition()),
    new SelfStatusMove(Moves.BANEFUL_BUNKER, Type.POISON, -1, 10, -1, 4, 7)
      .attr(ProtectAttr, BattlerTagType.BANEFUL_BUNKER)
      .condition(failIfLastCondition),
    new AttackMove(Moves.SPIRIT_SHACKLE, Type.GHOST, MoveCategory.PHYSICAL, 80, 100, 10, 100, 0, 7)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, false, 1, 1, true)
      .makesContact(false),
    new AttackMove(Moves.DARKEST_LARIAT, Type.DARK, MoveCategory.PHYSICAL, 85, 100, 10, -1, 0, 7)
      .attr(IgnoreOpponentStatStagesAttr),
    new AttackMove(Moves.SPARKLING_ARIA, Type.WATER, MoveCategory.SPECIAL, 90, 100, 10, 100, 0, 7)
      .attr(HealStatusEffectAttr, false, StatusEffect.BURN)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.ICE_HAMMER, Type.ICE, MoveCategory.PHYSICAL, 100, 90, 10, -1, 0, 7)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1, true)
      .punchingMove(),
    new StatusMove(Moves.FLORAL_HEALING, Type.FAIRY, -1, 10, -1, 0, 7)
      .attr(BoostHealAttr, 0.5, 2/3, true, false, (user, target, move) => user.scene.arena.terrain?.terrainType === TerrainType.GRASSY)
      .triageMove(),
    new AttackMove(Moves.HIGH_HORSEPOWER, Type.GROUND, MoveCategory.PHYSICAL, 95, 95, 10, -1, 0, 7),
    new StatusMove(Moves.STRENGTH_SAP, Type.GRASS, 100, 10, -1, 0, 7)
      .attr(HitHealAttr, null, Stat.ATK)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1)
      .condition((user, target, move) => target.getStatStage(Stat.ATK) > -6)
      .triageMove(),
    new AttackMove(Moves.SOLAR_BLADE, Type.GRASS, MoveCategory.PHYSICAL, 125, 100, 10, -1, 0, 7)
      .attr(SunlightChargeAttr, ChargeAnim.SOLAR_BLADE_CHARGING, i18next.t("moveTriggers:isGlowing", {pokemonName: "{USER}"}))
      .attr(AntiSunlightPowerDecreaseAttr)
      .slicingMove(),
    new AttackMove(Moves.LEAFAGE, Type.GRASS, MoveCategory.PHYSICAL, 40, 100, 40, -1, 0, 7)
      .makesContact(false),
    new StatusMove(Moves.SPOTLIGHT, Type.NORMAL, -1, 15, -1, 3, 7)
      .attr(AddBattlerTagAttr, BattlerTagType.CENTER_OF_ATTENTION, false),
    new StatusMove(Moves.TOXIC_THREAD, Type.POISON, 100, 20, -1, 0, 7)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1),
    new SelfStatusMove(Moves.LASER_FOCUS, Type.NORMAL, -1, 30, -1, 0, 7)
      .attr(AddBattlerTagAttr, BattlerTagType.ALWAYS_CRIT, true, false),
    new StatusMove(Moves.GEAR_UP, Type.STEEL, -1, 20, -1, 0, 7)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPATK ], 1, false, (user, target, move) => !![ Abilities.PLUS, Abilities.MINUS].find(a => target.hasAbility(a, false)))
      .target(MoveTarget.USER_AND_ALLIES)
      .condition((user, target, move) => !![ user, user.getAlly() ].filter(p => p?.isActive()).find(p => !![ Abilities.PLUS, Abilities.MINUS].find(a => p.hasAbility(a, false)))),
    new AttackMove(Moves.THROAT_CHOP, Type.DARK, MoveCategory.PHYSICAL, 80, 100, 15, 100, 0, 7)
      .partial(),
    new AttackMove(Moves.POLLEN_PUFF, Type.BUG, MoveCategory.SPECIAL, 90, 100, 15, -1, 0, 7)
      .attr(StatusCategoryOnAllyAttr)
      .attr(HealOnAllyAttr, 0.5, true, false)
      .ballBombMove(),
    new AttackMove(Moves.ANCHOR_SHOT, Type.STEEL, MoveCategory.PHYSICAL, 80, 100, 20, 100, 0, 7)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, false, 1, 1, true),
    new StatusMove(Moves.PSYCHIC_TERRAIN, Type.PSYCHIC, -1, 10, -1, 0, 7)
      .attr(TerrainChangeAttr, TerrainType.PSYCHIC)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.LUNGE, Type.BUG, MoveCategory.PHYSICAL, 80, 100, 15, 100, 0, 7)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1),
    new AttackMove(Moves.FIRE_LASH, Type.FIRE, MoveCategory.PHYSICAL, 80, 100, 15, 100, 0, 7)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1),
    new AttackMove(Moves.POWER_TRIP, Type.DARK, MoveCategory.PHYSICAL, 20, 100, 10, -1, 0, 7)
      .attr(PositiveStatStagePowerAttr),
    new AttackMove(Moves.BURN_UP, Type.FIRE, MoveCategory.SPECIAL, 130, 100, 5, -1, 0, 7)
      .condition((user) => {
        const userTypes = user.getTypes(true);
        return userTypes.includes(Type.FIRE);
      })
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(RemoveTypeAttr, Type.FIRE, (user) => {
        user.scene.queueMessage(i18next.t("moveTriggers:burnedItselfOut", {pokemonName: getPokemonNameWithAffix(user)}));
      }),
    new StatusMove(Moves.SPEED_SWAP, Type.PSYCHIC, -1, 10, -1, 0, 7)
      .attr(SwapStatAttr, Stat.SPD),
    new AttackMove(Moves.SMART_STRIKE, Type.STEEL, MoveCategory.PHYSICAL, 70, -1, 10, -1, 0, 7),
    new StatusMove(Moves.PURIFY, Type.POISON, -1, 20, -1, 0, 7)
      .condition(
        (user: Pokemon, target: Pokemon, move: Move) => isNonVolatileStatusEffect(target.status?.effect!)) // TODO: is this bang correct?
      .attr(HealAttr, 0.5)
      .attr(HealStatusEffectAttr, false, ...getNonVolatileStatusEffects())
      .triageMove(),
    new AttackMove(Moves.REVELATION_DANCE, Type.NORMAL, MoveCategory.SPECIAL, 90, 100, 15, -1, 0, 7)
      .danceMove()
      .attr(MatchUserTypeAttr),
    new AttackMove(Moves.CORE_ENFORCER, Type.DRAGON, MoveCategory.SPECIAL, 100, 100, 10, -1, 0, 7)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .attr(SuppressAbilitiesIfActedAttr),
    new AttackMove(Moves.TROP_KICK, Type.GRASS, MoveCategory.PHYSICAL, 70, 100, 15, 100, 0, 7)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1),
    new StatusMove(Moves.INSTRUCT, Type.PSYCHIC, -1, 15, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.BEAK_BLAST, Type.FLYING, MoveCategory.PHYSICAL, 100, 100, 15, -1, -3, 7)
      .attr(BeakBlastHeaderAttr)
      .ballBombMove()
      .makesContact(false),
    new AttackMove(Moves.CLANGING_SCALES, Type.DRAGON, MoveCategory.SPECIAL, 110, 100, 5, -1, 0, 7)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1, true, null, true, false, MoveEffectTrigger.HIT, true)
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
      .partial()
      .ignoresVirtual(),
    new AttackMove(Moves.MALICIOUS_MOONSAULT, Type.DARK, MoveCategory.PHYSICAL, 180, -1, 1, -1, 0, 7)
      .partial()
      .ignoresVirtual(),
    new AttackMove(Moves.OCEANIC_OPERETTA, Type.WATER, MoveCategory.SPECIAL, 195, -1, 1, -1, 0, 7)
      .partial()
      .ignoresVirtual(),
    new AttackMove(Moves.GUARDIAN_OF_ALOLA, Type.FAIRY, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.SOUL_STEALING_7_STAR_STRIKE, Type.GHOST, MoveCategory.PHYSICAL, 195, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.STOKED_SPARKSURFER, Type.ELECTRIC, MoveCategory.SPECIAL, 175, -1, 1, 100, 0, 7)
      .partial()
      .ignoresVirtual(),
    new AttackMove(Moves.PULVERIZING_PANCAKE, Type.NORMAL, MoveCategory.PHYSICAL, 210, -1, 1, -1, 0, 7)
      .partial()
      .ignoresVirtual(),
    new SelfStatusMove(Moves.EXTREME_EVOBOOST, Type.NORMAL, -1, 1, -1, 0, 7)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD ], 2, true)
      .ignoresVirtual(),
    new AttackMove(Moves.GENESIS_SUPERNOVA, Type.PSYCHIC, MoveCategory.SPECIAL, 185, -1, 1, 100, 0, 7)
      .attr(TerrainChangeAttr, TerrainType.PSYCHIC)
      .ignoresVirtual(),
    /* End Unused */
    new AttackMove(Moves.SHELL_TRAP, Type.FIRE, MoveCategory.SPECIAL, 150, 100, 5, -1, -3, 7)
      .attr(AddBattlerTagHeaderAttr, BattlerTagType.SHELL_TRAP)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      // Fails if the user was not hit by a physical attack during the turn
      .condition((user, target, move) => user.getTag(ShellTrapTag)?.activated === true),
    new AttackMove(Moves.FLEUR_CANNON, Type.FAIRY, MoveCategory.SPECIAL, 130, 90, 5, -1, 0, 7)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -2, true),
    new AttackMove(Moves.PSYCHIC_FANGS, Type.PSYCHIC, MoveCategory.PHYSICAL, 85, 100, 10, -1, 0, 7)
      .bitingMove()
      .attr(RemoveScreensAttr),
    new AttackMove(Moves.STOMPING_TANTRUM, Type.GROUND, MoveCategory.PHYSICAL, 75, 100, 10, -1, 0, 7)
      .attr(MovePowerMultiplierAttr, (user, target, move) => user.getLastXMoves(2)[1]?.result === MoveResult.MISS || user.getLastXMoves(2)[1]?.result === MoveResult.FAIL ? 2 : 1),
    new AttackMove(Moves.SHADOW_BONE, Type.GHOST, MoveCategory.PHYSICAL, 85, 100, 10, 20, 0, 7)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1)
      .makesContact(false),
    new AttackMove(Moves.ACCELEROCK, Type.ROCK, MoveCategory.PHYSICAL, 40, 100, 20, -1, 1, 7),
    new AttackMove(Moves.LIQUIDATION, Type.WATER, MoveCategory.PHYSICAL, 85, 100, 10, 20, 0, 7)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1),
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
    new StatusMove(Moves.TEARFUL_LOOK, Type.NORMAL, -1, 20, -1, 0, 7)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPATK ], -1),
    new AttackMove(Moves.ZING_ZAP, Type.ELECTRIC, MoveCategory.PHYSICAL, 80, 100, 10, 30, 0, 7)
      .attr(FlinchAttr),
    new AttackMove(Moves.NATURES_MADNESS, Type.FAIRY, MoveCategory.SPECIAL, -1, 90, 10, -1, 0, 7)
      .attr(TargetHalfHpDamageAttr),
    new AttackMove(Moves.MULTI_ATTACK, Type.NORMAL, MoveCategory.PHYSICAL, 120, 100, 10, -1, 0, 7)
      .attr(FormChangeItemTypeAttr),
    /* Unused */
    new AttackMove(Moves.TEN_MILLION_VOLT_THUNDERBOLT, Type.ELECTRIC, MoveCategory.SPECIAL, 195, -1, 1, -1, 0, 7)
      .partial()
      .ignoresVirtual(),
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
      .ignoresAbilities()
      .ignoresVirtual(),
    new AttackMove(Moves.SEARING_SUNRAZE_SMASH, Type.STEEL, MoveCategory.PHYSICAL, 200, -1, 1, -1, 0, 7)
      .ignoresAbilities()
      .ignoresVirtual(),
    new AttackMove(Moves.MENACING_MOONRAZE_MAELSTROM, Type.GHOST, MoveCategory.SPECIAL, 200, -1, 1, -1, 0, 7)
      .ignoresAbilities()
      .ignoresVirtual(),
    new AttackMove(Moves.LETS_SNUGGLE_FOREVER, Type.FAIRY, MoveCategory.PHYSICAL, 190, -1, 1, -1, 0, 7)
      .partial()
      .ignoresVirtual(),
    new AttackMove(Moves.SPLINTERED_STORMSHARDS, Type.ROCK, MoveCategory.PHYSICAL, 190, -1, 1, -1, 0, 7)
      .attr(ClearTerrainAttr)
      .makesContact(false)
      .ignoresVirtual(),
    new AttackMove(Moves.CLANGOROUS_SOULBLAZE, Type.DRAGON, MoveCategory.SPECIAL, 185, -1, 1, 100, 0, 7)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD ], 1, true)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .partial()
      .ignoresVirtual(),
    /* End Unused */
    new AttackMove(Moves.ZIPPY_ZAP, Type.ELECTRIC, MoveCategory.PHYSICAL, 50, 100, 15, 100, 2, 7) //LGPE Implementation
      .attr(CritOnlyAttr),
    new AttackMove(Moves.SPLISHY_SPLASH, Type.WATER, MoveCategory.SPECIAL, 90, 100, 15, 30, 0, 7)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.FLOATY_FALL, Type.FLYING, MoveCategory.PHYSICAL, 90, 95, 15, 30, 0, 7)
      .attr(FlinchAttr),
    new AttackMove(Moves.PIKA_PAPOW, Type.ELECTRIC, MoveCategory.SPECIAL, -1, -1, 20, -1, 0, 7)
      .attr(FriendshipPowerAttr),
    new AttackMove(Moves.BOUNCY_BUBBLE, Type.WATER, MoveCategory.SPECIAL, 60, 100, 20, -1, 0, 7)
      .attr(HitHealAttr, 1.0)
      .triageMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.BUZZY_BUZZ, Type.ELECTRIC, MoveCategory.SPECIAL, 60, 100, 20, 100, 0, 7)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.SIZZLY_SLIDE, Type.FIRE, MoveCategory.PHYSICAL, 60, 100, 20, 100, 0, 7)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.GLITZY_GLOW, Type.PSYCHIC, MoveCategory.SPECIAL, 80, 95, 15, -1, 0, 7)
      .attr(AddArenaTagAttr, ArenaTagType.LIGHT_SCREEN, 5, false, true),
    new AttackMove(Moves.BADDY_BAD, Type.DARK, MoveCategory.SPECIAL, 80, 95, 15, -1, 0, 7)
      .attr(AddArenaTagAttr, ArenaTagType.REFLECT, 5, false, true),
    new AttackMove(Moves.SAPPY_SEED, Type.GRASS, MoveCategory.PHYSICAL, 100, 90, 10, 100, 0, 7)
      .makesContact(false)
      .attr(AddBattlerTagAttr, BattlerTagType.SEEDED),
    new AttackMove(Moves.FREEZY_FROST, Type.ICE, MoveCategory.SPECIAL, 100, 90, 10, -1, 0, 7)
      .attr(ResetStatsAttr, true),
    new AttackMove(Moves.SPARKLY_SWIRL, Type.FAIRY, MoveCategory.SPECIAL, 120, 85, 5, -1, 0, 7)
      .attr(PartyStatusCureAttr, null, Abilities.NONE),
    new AttackMove(Moves.VEEVEE_VOLLEY, Type.NORMAL, MoveCategory.PHYSICAL, -1, -1, 20, -1, 0, 7)
      .attr(FriendshipPowerAttr),
    new AttackMove(Moves.DOUBLE_IRON_BASH, Type.STEEL, MoveCategory.PHYSICAL, 60, 100, 5, 30, 0, 7)
      .attr(MultiHitAttr, MultiHitType._2)
      .attr(FlinchAttr)
      .punchingMove(),
    /* Unused */
    new SelfStatusMove(Moves.MAX_GUARD, Type.NORMAL, -1, 10, -1, 4, 8)
      .attr(ProtectAttr)
      .condition(failIfLastCondition)
      .ignoresVirtual(),
    /* End Unused */
    new AttackMove(Moves.DYNAMAX_CANNON, Type.DRAGON, MoveCategory.SPECIAL, 100, 100, 5, -1, 0, 8)
      .attr(MovePowerMultiplierAttr, (user, target, move) => {
      // Move is only stronger against overleveled foes.
        if (target.level > target.scene.getMaxExpLevel()) {
          const dynamaxCannonPercentMarginBeforeFullDamage = 0.05; // How much % above MaxExpLevel of wave will the target need to be to take full damage.
          // The move's power scales as the margin is approached, reaching double power when it does or goes over it.
          return 1 + Math.min(1, (target.level - target.scene.getMaxExpLevel()) / (target.scene.getMaxExpLevel() * dynamaxCannonPercentMarginBeforeFullDamage));
        } else {
          return 1;
        }
      })
      .attr(DiscourageFrequentUseAttr)
      .ignoresVirtual(),

    new AttackMove(Moves.SNIPE_SHOT, Type.WATER, MoveCategory.SPECIAL, 80, 100, 15, -1, 0, 8)
      .attr(HighCritAttr)
      .attr(BypassRedirectAttr),
    new AttackMove(Moves.JAW_LOCK, Type.DARK, MoveCategory.PHYSICAL, 80, 100, 10, -1, 0, 8)
      .attr(JawLockAttr)
      .bitingMove(),
    new SelfStatusMove(Moves.STUFF_CHEEKS, Type.NORMAL, -1, 10, -1, 0, 8) // TODO: Stuff Cheeks should not be selectable when the user does not have a berry, see wiki
      .attr(EatBerryAttr)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 2, true)
      .condition((user) => {
        const userBerries = user.scene.findModifiers(m => m instanceof BerryModifier, user.isPlayer());
        return userBerries.length > 0;
      })
      .partial(),
    new SelfStatusMove(Moves.NO_RETREAT, Type.FIGHTING, -1, 5, -1, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD ], 1, true)
      .attr(AddBattlerTagAttr, BattlerTagType.NO_RETREAT, true, false)
      .condition((user, target, move) => user.getTag(TrappedTag)?.sourceMove !== Moves.NO_RETREAT), // fails if the user is currently trapped by No Retreat
    new StatusMove(Moves.TAR_SHOT, Type.ROCK, 100, 15, -1, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1)
      .partial(),
    new StatusMove(Moves.MAGIC_POWDER, Type.PSYCHIC, 100, 20, -1, 0, 8)
      .attr(ChangeTypeAttr, Type.PSYCHIC)
      .powderMove(),
    new AttackMove(Moves.DRAGON_DARTS, Type.DRAGON, MoveCategory.PHYSICAL, 50, 100, 10, -1, 0, 8)
      .attr(MultiHitAttr, MultiHitType._2)
      .makesContact(false)
      .partial(),
    new StatusMove(Moves.TEATIME, Type.NORMAL, -1, 10, -1, 0, 8)
      .attr(EatBerryAttr)
      .target(MoveTarget.ALL),
    new StatusMove(Moves.OCTOLOCK, Type.FIGHTING, 100, 15, -1, 0, 8)
      .attr(AddBattlerTagAttr, BattlerTagType.OCTOLOCK, false, true, 1),
    new AttackMove(Moves.BOLT_BEAK, Type.ELECTRIC, MoveCategory.PHYSICAL, 85, 100, 10, -1, 0, 8)
      .attr(FirstAttackDoublePowerAttr),
    new AttackMove(Moves.FISHIOUS_REND, Type.WATER, MoveCategory.PHYSICAL, 85, 100, 10, -1, 0, 8)
      .attr(FirstAttackDoublePowerAttr)
      .bitingMove(),
    new StatusMove(Moves.COURT_CHANGE, Type.NORMAL, 100, 10, -1, 0, 8)
      .attr(SwapArenaTagsAttr, [ArenaTagType.AURORA_VEIL, ArenaTagType.LIGHT_SCREEN, ArenaTagType.MIST, ArenaTagType.REFLECT, ArenaTagType.SPIKES, ArenaTagType.STEALTH_ROCK, ArenaTagType.STICKY_WEB, ArenaTagType.TAILWIND, ArenaTagType.TOXIC_SPIKES]),
    new AttackMove(Moves.MAX_FLARE, Type.FIRE, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.MAX_FLUTTERBY, Type.BUG, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.MAX_LIGHTNING, Type.ELECTRIC, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.MAX_STRIKE, Type.NORMAL, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.MAX_KNUCKLE, Type.FIGHTING, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.MAX_PHANTASM, Type.GHOST, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.MAX_HAILSTORM, Type.ICE, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.MAX_OOZE, Type.POISON, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.MAX_GEYSER, Type.WATER, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.MAX_AIRSTREAM, Type.FLYING, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.MAX_STARFALL, Type.FAIRY, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.MAX_WYRMWIND, Type.DRAGON, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.MAX_MINDSTORM, Type.PSYCHIC, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.MAX_ROCKFALL, Type.ROCK, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.MAX_QUAKE, Type.GROUND, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.MAX_DARKNESS, Type.DARK, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.MAX_OVERGROWTH, Type.GRASS, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented()
      .ignoresVirtual(),
    new AttackMove(Moves.MAX_STEELSPIKE, Type.STEEL, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented()
      .ignoresVirtual(),
    /* End Unused */
    new SelfStatusMove(Moves.CLANGOROUS_SOUL, Type.DRAGON, 100, 5, -1, 0, 8)
      .attr(CutHpStatStageBoostAttr, [ Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD ], 1, 3)
      .soundBased()
      .danceMove(),
    new AttackMove(Moves.BODY_PRESS, Type.FIGHTING, MoveCategory.PHYSICAL, 80, 100, 10, -1, 0, 8)
      .attr(DefAtkAttr),
    new StatusMove(Moves.DECORATE, Type.FAIRY, -1, 15, -1, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPATK ], 2)
      .ignoresProtect(),
    new AttackMove(Moves.DRUM_BEATING, Type.GRASS, MoveCategory.PHYSICAL, 80, 100, 10, 100, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1)
      .makesContact(false),
    new AttackMove(Moves.SNAP_TRAP, Type.GRASS, MoveCategory.PHYSICAL, 35, 100, 15, -1, 0, 8)
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
      .attr(StatStageChangeAttr, [ Stat.SPD ], 1, true)
      .makesContact(false)
      .attr(AuraWheelTypeAttr)
      .condition((user, target, move) => [user.species.speciesId, user.fusionSpecies?.speciesId].includes(Species.MORPEKO)), // Missing custom fail message
    new AttackMove(Moves.BREAKING_SWIPE, Type.DRAGON, MoveCategory.PHYSICAL, 60, 100, 15, 100, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1),
    new AttackMove(Moves.BRANCH_POKE, Type.GRASS, MoveCategory.PHYSICAL, 40, 100, 40, -1, 0, 8),
    new AttackMove(Moves.OVERDRIVE, Type.ELECTRIC, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 8)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.APPLE_ACID, Type.GRASS, MoveCategory.SPECIAL, 80, 100, 10, 100, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -1),
    new AttackMove(Moves.GRAV_APPLE, Type.GRASS, MoveCategory.PHYSICAL, 80, 100, 10, 100, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1)
      .attr(MovePowerMultiplierAttr, (user, target, move) => user.scene.arena.getTag(ArenaTagType.GRAVITY) ? 1.5 : 1)
      .makesContact(false),
    new AttackMove(Moves.SPIRIT_BREAK, Type.FAIRY, MoveCategory.PHYSICAL, 75, 100, 15, 100, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -1),
    new AttackMove(Moves.STRANGE_STEAM, Type.FAIRY, MoveCategory.SPECIAL, 90, 95, 10, 20, 0, 8)
      .attr(ConfuseAttr),
    new StatusMove(Moves.LIFE_DEW, Type.WATER, -1, 10, -1, 0, 8)
      .attr(HealAttr, 0.25, true, false)
      .target(MoveTarget.USER_AND_ALLIES)
      .ignoresProtect(),
    new SelfStatusMove(Moves.OBSTRUCT, Type.DARK, 100, 10, -1, 4, 8)
      .attr(ProtectAttr, BattlerTagType.OBSTRUCT)
      .condition(failIfLastCondition),
    new AttackMove(Moves.FALSE_SURRENDER, Type.DARK, MoveCategory.PHYSICAL, 80, -1, 10, -1, 0, 8),
    new AttackMove(Moves.METEOR_ASSAULT, Type.FIGHTING, MoveCategory.PHYSICAL, 150, 100, 5, -1, 0, 8)
      .attr(RechargeAttr)
      .makesContact(false),
    new AttackMove(Moves.ETERNABEAM, Type.DRAGON, MoveCategory.SPECIAL, 160, 90, 5, -1, 0, 8)
      .attr(RechargeAttr),
    new AttackMove(Moves.STEEL_BEAM, Type.STEEL, MoveCategory.SPECIAL, 140, 95, 5, -1, 0, 8)
      .attr(HalfSacrificialAttr),
    new AttackMove(Moves.EXPANDING_FORCE, Type.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 8)
      .attr(MovePowerMultiplierAttr, (user, target, move) => user.scene.arena.getTerrainType() === TerrainType.PSYCHIC && user.isGrounded() ? 1.5 : 1)
      .attr(VariableTargetAttr, (user, target, move) => user.scene.arena.getTerrainType() === TerrainType.PSYCHIC && user.isGrounded() ? 6 : 3),
    new AttackMove(Moves.STEEL_ROLLER, Type.STEEL, MoveCategory.PHYSICAL, 130, 100, 5, -1, 0, 8)
      .attr(ClearTerrainAttr)
      .condition((user, target, move) => !!user.scene.arena.terrain),
    new AttackMove(Moves.SCALE_SHOT, Type.DRAGON, MoveCategory.PHYSICAL, 25, 90, 20, -1, 0, 8)
      //.attr(StatStageChangeAttr, Stat.SPD, 1, true) // TODO: Have boosts only apply at end of move, not after every hit
      //.attr(StatStageChangeAttr, Stat.DEF, -1, true)
      .attr(MultiHitAttr)
      .makesContact(false)
      .partial(),
    new AttackMove(Moves.METEOR_BEAM, Type.ROCK, MoveCategory.SPECIAL, 120, 90, 10, 100, 0, 8)
      .attr(ChargeAttr, ChargeAnim.METEOR_BEAM_CHARGING, i18next.t("moveTriggers:isOverflowingWithSpacePower", {pokemonName: "{USER}"}), null, true)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], 1, true)
      .ignoresVirtual(),
    new AttackMove(Moves.SHELL_SIDE_ARM, Type.POISON, MoveCategory.SPECIAL, 90, 100, 10, 20, 0, 8)
      .attr(ShellSideArmCategoryAttr)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .partial(),
    new AttackMove(Moves.MISTY_EXPLOSION, Type.FAIRY, MoveCategory.SPECIAL, 100, 100, 5, -1, 0, 8)
      .attr(SacrificialAttr)
      .target(MoveTarget.ALL_NEAR_OTHERS)
      .attr(MovePowerMultiplierAttr, (user, target, move) => user.scene.arena.getTerrainType() === TerrainType.MISTY && user.isGrounded() ? 1.5 : 1)
      .condition(failIfDampCondition)
      .makesContact(false),
    new AttackMove(Moves.GRASSY_GLIDE, Type.GRASS, MoveCategory.PHYSICAL, 55, 100, 20, -1, 0, 8)
      .attr(IncrementMovePriorityAttr, (user, target, move) =>user.scene.arena.getTerrainType()===TerrainType.GRASSY&&user.isGrounded()),
    new AttackMove(Moves.RISING_VOLTAGE, Type.ELECTRIC, MoveCategory.SPECIAL, 70, 100, 20, -1, 0, 8)
      .attr(MovePowerMultiplierAttr, (user, target, move) => user.scene.arena.getTerrainType() === TerrainType.ELECTRIC && target.isGrounded() ? 2 : 1),
    new AttackMove(Moves.TERRAIN_PULSE, Type.NORMAL, MoveCategory.SPECIAL, 50, 100, 10, -1, 0, 8)
      .attr(TerrainPulseTypeAttr)
      .attr(MovePowerMultiplierAttr, (user, target, move) => user.scene.arena.getTerrainType() !== TerrainType.NONE && user.isGrounded() ? 2 : 1)
      .pulseMove(),
    new AttackMove(Moves.SKITTER_SMACK, Type.BUG, MoveCategory.PHYSICAL, 70, 90, 10, 100, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -1),
    new AttackMove(Moves.BURNING_JEALOUSY, Type.FIRE, MoveCategory.SPECIAL, 70, 100, 5, 100, 0, 8)
      .attr(StatusIfBoostedAttr, StatusEffect.BURN)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.LASH_OUT, Type.DARK, MoveCategory.PHYSICAL, 75, 100, 5, -1, 0, 8)
      .attr(MovePowerMultiplierAttr, (user, _target, _move) => user.turnData.statStagesDecreased ? 2 : 1),
    new AttackMove(Moves.POLTERGEIST, Type.GHOST, MoveCategory.PHYSICAL, 110, 90, 5, -1, 0, 8)
      .attr(AttackedByItemAttr)
      .makesContact(false),
    new StatusMove(Moves.CORROSIVE_GAS, Type.POISON, 100, 40, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_OTHERS)
      .unimplemented(),
    new StatusMove(Moves.COACHING, Type.FIGHTING, -1, 10, -1, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF ], 1)
      .target(MoveTarget.NEAR_ALLY),
    new AttackMove(Moves.FLIP_TURN, Type.WATER, MoveCategory.PHYSICAL, 60, 100, 20, -1, 0, 8)
      .attr(ForceSwitchOutAttr, true, false),
    new AttackMove(Moves.TRIPLE_AXEL, Type.ICE, MoveCategory.PHYSICAL, 20, 90, 10, -1, 0, 8)
      .attr(MultiHitAttr, MultiHitType._3)
      .attr(MultiHitPowerIncrementAttr, 3)
      .checkAllHits(),
    new AttackMove(Moves.DUAL_WINGBEAT, Type.FLYING, MoveCategory.PHYSICAL, 40, 90, 10, -1, 0, 8)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.SCORCHING_SANDS, Type.GROUND, MoveCategory.SPECIAL, 70, 100, 10, 30, 0, 8)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(HealStatusEffectAttr, false, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new StatusMove(Moves.JUNGLE_HEALING, Type.GRASS, -1, 10, -1, 0, 8)
      .attr(HealAttr, 0.25, true, false)
      .attr(HealStatusEffectAttr, false, StatusEffect.PARALYSIS, StatusEffect.POISON, StatusEffect.TOXIC, StatusEffect.BURN, StatusEffect.SLEEP)
      .target(MoveTarget.USER_AND_ALLIES),
    new AttackMove(Moves.WICKED_BLOW, Type.DARK, MoveCategory.PHYSICAL, 75, 100, 5, -1, 0, 8)
      .attr(CritOnlyAttr)
      .punchingMove(),
    new AttackMove(Moves.SURGING_STRIKES, Type.WATER, MoveCategory.PHYSICAL, 25, 100, 5, -1, 0, 8)
      .attr(MultiHitAttr, MultiHitType._3)
      .attr(CritOnlyAttr)
      .punchingMove(),
    new AttackMove(Moves.THUNDER_CAGE, Type.ELECTRIC, MoveCategory.SPECIAL, 80, 90, 15, -1, 0, 8)
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
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1),
    new AttackMove(Moves.GLACIAL_LANCE, Type.ICE, MoveCategory.PHYSICAL, 120, 100, 5, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .makesContact(false),
    new AttackMove(Moves.ASTRAL_BARRAGE, Type.GHOST, MoveCategory.SPECIAL, 120, 100, 5, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.EERIE_SPELL, Type.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 5, 100, 0, 8)
      .attr(AttackReducePpMoveAttr, 3)
      .soundBased(),
    new AttackMove(Moves.DIRE_CLAW, Type.POISON, MoveCategory.PHYSICAL, 80, 100, 15, 50, 0, 8)
      .attr(MultiStatusEffectAttr, [StatusEffect.POISON, StatusEffect.PARALYSIS, StatusEffect.SLEEP]),
    new AttackMove(Moves.PSYSHIELD_BASH, Type.PSYCHIC, MoveCategory.PHYSICAL, 70, 90, 10, 100, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 1, true),
    new SelfStatusMove(Moves.POWER_SHIFT, Type.NORMAL, -1, 10, -1, 0, 8)
      .unimplemented(),
    new AttackMove(Moves.STONE_AXE, Type.ROCK, MoveCategory.PHYSICAL, 65, 90, 15, 100, 0, 8)
      .attr(AddArenaTrapTagHitAttr, ArenaTagType.STEALTH_ROCK)
      .slicingMove(),
    new AttackMove(Moves.SPRINGTIDE_STORM, Type.FAIRY, MoveCategory.SPECIAL, 100, 80, 5, 30, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.MYSTICAL_POWER, Type.PSYCHIC, MoveCategory.SPECIAL, 70, 90, 10, 100, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], 1, true),
    new AttackMove(Moves.RAGING_FURY, Type.FIRE, MoveCategory.PHYSICAL, 120, 100, 10, -1, 0, 8)
      .makesContact(false)
      .attr(FrenzyAttr)
      .attr(MissEffectAttr, frenzyMissFunc)
      .attr(NoEffectAttr, frenzyMissFunc)
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new AttackMove(Moves.WAVE_CRASH, Type.WATER, MoveCategory.PHYSICAL, 120, 100, 10, -1, 0, 8)
      .attr(RecoilAttr, false, 0.33)
      .recklessMove(),
    new AttackMove(Moves.CHLOROBLAST, Type.GRASS, MoveCategory.SPECIAL, 150, 95, 5, -1, 0, 8)
      .attr(RecoilAttr, true, 0.5),
    new AttackMove(Moves.MOUNTAIN_GALE, Type.ICE, MoveCategory.PHYSICAL, 100, 85, 10, 30, 0, 8)
      .makesContact(false)
      .attr(FlinchAttr),
    new SelfStatusMove(Moves.VICTORY_DANCE, Type.FIGHTING, -1, 10, -1, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF, Stat.SPD ], 1, true)
      .danceMove(),
    new AttackMove(Moves.HEADLONG_RUSH, Type.GROUND, MoveCategory.PHYSICAL, 120, 100, 5, -1, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.DEF, Stat.SPDEF ], -1, true)
      .punchingMove(),
    new AttackMove(Moves.BARB_BARRAGE, Type.POISON, MoveCategory.PHYSICAL, 60, 100, 10, 50, 0, 8)
      .makesContact(false)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.status && (target.status.effect === StatusEffect.POISON || target.status.effect === StatusEffect.TOXIC) ? 2 : 1)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(Moves.ESPER_WING, Type.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 10, 100, 0, 8)
      .attr(HighCritAttr)
      .attr(StatStageChangeAttr, [ Stat.SPD ], 1, true),
    new AttackMove(Moves.BITTER_MALICE, Type.GHOST, MoveCategory.SPECIAL, 75, 100, 10, 100, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1),
    new SelfStatusMove(Moves.SHELTER, Type.STEEL, -1, 10, 100, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 2, true),
    new AttackMove(Moves.TRIPLE_ARROWS, Type.FIGHTING, MoveCategory.PHYSICAL, 90, 100, 10, 30, 0, 8)
      .makesContact(false)
      .attr(HighCritAttr)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1)
      .attr(FlinchAttr)
      .partial(),
    new AttackMove(Moves.INFERNAL_PARADE, Type.GHOST, MoveCategory.SPECIAL, 60, 100, 15, 30, 0, 8)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.status ? 2 : 1),
    new AttackMove(Moves.CEASELESS_EDGE, Type.DARK, MoveCategory.PHYSICAL, 65, 90, 15, 100, 0, 8)
      .attr(AddArenaTrapTagHitAttr, ArenaTagType.SPIKES)
      .slicingMove(),
    new AttackMove(Moves.BLEAKWIND_STORM, Type.FLYING, MoveCategory.SPECIAL, 100, 80, 10, 30, 0, 8)
      .attr(StormAccuracyAttr)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.WILDBOLT_STORM, Type.ELECTRIC, MoveCategory.SPECIAL, 100, 80, 10, 20, 0, 8)
      .attr(StormAccuracyAttr)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.SANDSEAR_STORM, Type.GROUND, MoveCategory.SPECIAL, 100, 80, 10, 20, 0, 8)
      .attr(StormAccuracyAttr)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.LUNAR_BLESSING, Type.PSYCHIC, -1, 5, -1, 0, 8)
      .attr(HealAttr, 0.25, true, false)
      .attr(HealStatusEffectAttr, false, StatusEffect.PARALYSIS, StatusEffect.POISON, StatusEffect.TOXIC, StatusEffect.BURN, StatusEffect.SLEEP)
      .target(MoveTarget.USER_AND_ALLIES)
      .triageMove(),
    new SelfStatusMove(Moves.TAKE_HEART, Type.PSYCHIC, -1, 10, -1, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.SPATK, Stat.SPDEF ], 1, true)
      .attr(HealStatusEffectAttr, true, StatusEffect.PARALYSIS, StatusEffect.POISON, StatusEffect.TOXIC, StatusEffect.BURN, StatusEffect.SLEEP),
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
      .attr(TeraBlastTypeAttr)
      .attr(TeraBlastPowerAttr)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPATK ], -1, true, (user, target, move) => user.isTerastallized() && user.isOfType(Type.STELLAR)),
    new SelfStatusMove(Moves.SILK_TRAP, Type.BUG, -1, 10, -1, 4, 9)
      .attr(ProtectAttr, BattlerTagType.SILK_TRAP)
      .condition(failIfLastCondition),
    new AttackMove(Moves.AXE_KICK, Type.FIGHTING, MoveCategory.PHYSICAL, 120, 90, 10, 30, 0, 9)
      .attr(MissEffectAttr, crashDamageFunc)
      .attr(NoEffectAttr, crashDamageFunc)
      .attr(ConfuseAttr)
      .recklessMove(),
    new AttackMove(Moves.LAST_RESPECTS, Type.GHOST, MoveCategory.PHYSICAL, 50, 100, 10, -1, 0, 9)
      .attr(MovePowerMultiplierAttr, (user, target, move) => 1 + Math.min(user.isPlayer() ? user.scene.currentBattle.playerFaints : user.scene.currentBattle.enemyFaints, 100))
      .makesContact(false),
    new AttackMove(Moves.LUMINA_CRASH, Type.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 10, 100, 0, 9)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -2),
    new AttackMove(Moves.ORDER_UP, Type.DRAGON, MoveCategory.PHYSICAL, 80, 100, 10, 100, 0, 9)
      .makesContact(false)
      .partial(),
    new AttackMove(Moves.JET_PUNCH, Type.WATER, MoveCategory.PHYSICAL, 60, 100, 15, -1, 1, 9)
      .punchingMove(),
    new StatusMove(Moves.SPICY_EXTRACT, Type.GRASS, -1, 15, -1, 0, 9)
      .attr(StatStageChangeAttr, [ Stat.ATK ], 2)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -2),
    new AttackMove(Moves.SPIN_OUT, Type.STEEL, MoveCategory.PHYSICAL, 100, 100, 5, -1, 0, 9)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -2, true),
    new AttackMove(Moves.POPULATION_BOMB, Type.NORMAL, MoveCategory.PHYSICAL, 20, 90, 10, -1, 0, 9)
      .attr(MultiHitAttr, MultiHitType._10)
      .slicingMove()
      .checkAllHits(),
    new AttackMove(Moves.ICE_SPINNER, Type.ICE, MoveCategory.PHYSICAL, 80, 100, 15, -1, 0, 9)
      .attr(ClearTerrainAttr),
    new AttackMove(Moves.GLAIVE_RUSH, Type.DRAGON, MoveCategory.PHYSICAL, 120, 100, 5, -1, 0, 9)
      .attr(AddBattlerTagAttr, BattlerTagType.ALWAYS_GET_HIT, true, false, 0, 0, true)
      .attr(AddBattlerTagAttr, BattlerTagType.RECEIVE_DOUBLE_DAMAGE, true, false, 0, 0, true)
      .condition((user, target, move) => {
        return !(target.getTag(BattlerTagType.PROTECTED)?.tagType === "PROTECTED" || target.scene.arena.getTag(ArenaTagType.MAT_BLOCK)?.tagType === "MAT_BLOCK");
      }),
    new StatusMove(Moves.REVIVAL_BLESSING, Type.NORMAL, -1, 1, -1, 0, 9)
      .triageMove()
      .attr(RevivalBlessingAttr)
      .target(MoveTarget.USER),
    new AttackMove(Moves.SALT_CURE, Type.ROCK, MoveCategory.PHYSICAL, 40, 100, 15, 100, 0, 9)
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
      .attr(RemoveArenaTrapAttr)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.DOODLE, Type.NORMAL, 100, 10, -1, 0, 9)
      .attr(AbilityCopyAttr, true),
    new SelfStatusMove(Moves.FILLET_AWAY, Type.NORMAL, -1, 10, -1, 0, 9)
      .attr(CutHpStatStageBoostAttr, [ Stat.ATK, Stat.SPATK, Stat.SPD ], 2, 2),
    new AttackMove(Moves.KOWTOW_CLEAVE, Type.DARK, MoveCategory.PHYSICAL, 85, -1, 10, -1, 0, 9)
      .slicingMove(),
    new AttackMove(Moves.FLOWER_TRICK, Type.GRASS, MoveCategory.PHYSICAL, 70, -1, 10, 100, 0, 9)
      .attr(CritOnlyAttr)
      .makesContact(false),
    new AttackMove(Moves.TORCH_SONG, Type.FIRE, MoveCategory.SPECIAL, 80, 100, 10, 100, 0, 9)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], 1, true)
      .soundBased(),
    new AttackMove(Moves.AQUA_STEP, Type.WATER, MoveCategory.PHYSICAL, 80, 100, 10, 100, 0, 9)
      .attr(StatStageChangeAttr, [ Stat.SPD ], 1, true)
      .danceMove(),
    new AttackMove(Moves.RAGING_BULL, Type.NORMAL, MoveCategory.PHYSICAL, 90, 100, 10, -1, 0, 9)
      .attr(RagingBullTypeAttr)
      .attr(RemoveScreensAttr),
    new AttackMove(Moves.MAKE_IT_RAIN, Type.STEEL, MoveCategory.SPECIAL, 120, 100, 5, -1, 0, 9)
      .attr(MoneyAttr)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -1, true, null, true, false, MoveEffectTrigger.HIT, true)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.PSYBLADE, Type.PSYCHIC, MoveCategory.PHYSICAL, 80, 100, 15, -1, 0, 9)
      .attr(MovePowerMultiplierAttr, (user, target, move) => user.scene.arena.getTerrainType() === TerrainType.ELECTRIC && user.isGrounded() ? 1.5 : 1)
      .slicingMove(),
    new AttackMove(Moves.HYDRO_STEAM, Type.WATER, MoveCategory.SPECIAL, 80, 100, 15, -1, 0, 9)
      .attr(IgnoreWeatherTypeDebuffAttr, WeatherType.SUNNY)
      .attr(MovePowerMultiplierAttr, (user, target, move) => [WeatherType.SUNNY, WeatherType.HARSH_SUN].includes(user.scene.arena.weather?.weatherType!) && !user.scene.arena.weather?.isEffectSuppressed(user.scene) ? 1.5 : 1), // TODO: is this bang correct?
    new AttackMove(Moves.RUINATION, Type.DARK, MoveCategory.SPECIAL, -1, 90, 10, -1, 0, 9)
      .attr(TargetHalfHpDamageAttr),
    new AttackMove(Moves.COLLISION_COURSE, Type.FIGHTING, MoveCategory.PHYSICAL, 100, 100, 5, -1, 0, 9)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.getAttackTypeEffectiveness(move.type, user) >= 2 ? 5461/4096 : 1),
    new AttackMove(Moves.ELECTRO_DRIFT, Type.ELECTRIC, MoveCategory.SPECIAL, 100, 100, 5, -1, 0, 9)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.getAttackTypeEffectiveness(move.type, user) >= 2 ? 5461/4096 : 1)
      .makesContact(),
    new SelfStatusMove(Moves.SHED_TAIL, Type.NORMAL, -1, 10, -1, 0, 9)
      .unimplemented(),
    new StatusMove(Moves.CHILLY_RECEPTION, Type.ICE, -1, 10, -1, 0, 9)
      .attr(WeatherChangeAttr, WeatherType.SNOW)
      .attr(ForceSwitchOutAttr, true, false)
      .target(MoveTarget.BOTH_SIDES),
    new SelfStatusMove(Moves.TIDY_UP, Type.NORMAL, -1, 10, -1, 0, 9)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPD ], 1, true, null, true, true)
      .attr(RemoveArenaTrapAttr, true),
    new StatusMove(Moves.SNOWSCAPE, Type.ICE, -1, 10, -1, 0, 9)
      .attr(WeatherChangeAttr, WeatherType.SNOW)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.POUNCE, Type.BUG, MoveCategory.PHYSICAL, 50, 100, 20, 100, 0, 9)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1),
    new AttackMove(Moves.TRAILBLAZE, Type.GRASS, MoveCategory.PHYSICAL, 50, 100, 20, 100, 0, 9)
      .attr(StatStageChangeAttr, [ Stat.SPD ], 1, true),
    new AttackMove(Moves.CHILLING_WATER, Type.WATER, MoveCategory.SPECIAL, 50, 100, 20, 100, 0, 9)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1),
    new AttackMove(Moves.HYPER_DRILL, Type.NORMAL, MoveCategory.PHYSICAL, 100, 100, 5, -1, 0, 9)
      .ignoresProtect(),
    new AttackMove(Moves.TWIN_BEAM, Type.PSYCHIC, MoveCategory.SPECIAL, 40, 100, 10, -1, 0, 9)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.RAGE_FIST, Type.GHOST, MoveCategory.PHYSICAL, 50, 100, 10, -1, 0, 9)
      .attr(HitCountPowerAttr)
      .punchingMove(),
    new AttackMove(Moves.ARMOR_CANNON, Type.FIRE, MoveCategory.SPECIAL, 120, 100, 5, -1, 0, 9)
      .attr(StatStageChangeAttr, [ Stat.DEF, Stat.SPDEF ], -1, true),
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
        user.scene.queueMessage(i18next.t("moveTriggers:usedUpAllElectricity", {pokemonName: getPokemonNameWithAffix(user)}));
      }),
    new AttackMove(Moves.GIGATON_HAMMER, Type.STEEL, MoveCategory.PHYSICAL, 160, 100, 5, -1, 0, 9)
      .makesContact(false)
      .condition((user, target, move) => {
        const turnMove = user.getLastXMoves(1);
        return !turnMove.length || turnMove[0].move !== move.id || turnMove[0].result !== MoveResult.SUCCESS;
      }), // TODO Add Instruct/Encore interaction
    new AttackMove(Moves.COMEUPPANCE, Type.DARK, MoveCategory.PHYSICAL, -1, 100, 10, -1, 0, 9)
      .attr(CounterDamageAttr, (move: Move) => (move.category === MoveCategory.PHYSICAL || move.category === MoveCategory.SPECIAL), 1.5)
      .redirectCounter()
      .target(MoveTarget.ATTACKER),
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
      .attr(HealStatusEffectAttr, false, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .triageMove(),
    new AttackMove(Moves.SYRUP_BOMB, Type.GRASS, MoveCategory.SPECIAL, 60, 85, 10, -1, 0, 9)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1) //Temporary
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
    new SelfStatusMove(Moves.BURNING_BULWARK, Type.FIRE, -1, 10, -1, 4, 9)
      .attr(ProtectAttr, BattlerTagType.BURNING_BULWARK)
      .condition(failIfLastCondition),
    new AttackMove(Moves.THUNDERCLAP, Type.ELECTRIC, MoveCategory.SPECIAL, 70, 100, 5, -1, 1, 9)
      .condition((user, target, move) => user.scene.currentBattle.turnCommands[target.getBattlerIndex()]?.command === Command.FIGHT && !target.turnData.acted && allMoves[user.scene.currentBattle.turnCommands[target.getBattlerIndex()]?.move?.move!].category !== MoveCategory.STATUS), // TODO: is this bang correct?
    new AttackMove(Moves.MIGHTY_CLEAVE, Type.ROCK, MoveCategory.PHYSICAL, 95, 100, 5, -1, 0, 9)
      .slicingMove()
      .ignoresProtect(),
    new AttackMove(Moves.TACHYON_CUTTER, Type.STEEL, MoveCategory.SPECIAL, 50, -1, 10, -1, 0, 9)
      .attr(MultiHitAttr, MultiHitType._2)
      .slicingMove(),
    new AttackMove(Moves.HARD_PRESS, Type.STEEL, MoveCategory.PHYSICAL, -1, 100, 10, -1, 0, 9)
      .attr(OpponentHighHpPowerAttr, 100),
    new StatusMove(Moves.DRAGON_CHEER, Type.DRAGON, -1, 15, -1, 0, 9)
      .attr(AddBattlerTagAttr, BattlerTagType.DRAGON_CHEER, false, true)
      .target(MoveTarget.NEAR_ALLY),
    new AttackMove(Moves.ALLURING_VOICE, Type.FAIRY, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 9)
      .attr(AddBattlerTagIfBoostedAttr, BattlerTagType.CONFUSED)
      .soundBased(),
    new AttackMove(Moves.TEMPER_FLARE, Type.FIRE, MoveCategory.PHYSICAL, 75, 100, 10, -1, 0, 9)
      .attr(MovePowerMultiplierAttr, (user, target, move) => user.getLastXMoves(2)[1]?.result === MoveResult.MISS || user.getLastXMoves(2)[1]?.result === MoveResult.FAIL ? 2 : 1),
    new AttackMove(Moves.SUPERCELL_SLAM, Type.ELECTRIC, MoveCategory.PHYSICAL, 100, 95, 15, -1, 0, 9)
      .attr(MissEffectAttr, crashDamageFunc)
      .attr(NoEffectAttr, crashDamageFunc)
      .recklessMove(),
    new AttackMove(Moves.PSYCHIC_NOISE, Type.PSYCHIC, MoveCategory.SPECIAL, 75, 100, 10, -1, 0, 9)
      .soundBased()
      .partial(),
    new AttackMove(Moves.UPPER_HAND, Type.FIGHTING, MoveCategory.PHYSICAL, 65, 100, 15, 100, 3, 9)
      .attr(FlinchAttr)
      .condition((user, target, move) => user.scene.currentBattle.turnCommands[target.getBattlerIndex()]?.command === Command.FIGHT && !target.turnData.acted && allMoves[user.scene.currentBattle.turnCommands[target.getBattlerIndex()]?.move?.move!].category !== MoveCategory.STATUS && allMoves[user.scene.currentBattle.turnCommands[target.getBattlerIndex()]?.move?.move!].priority > 0 ) // TODO: is this bang correct?
      //TODO: Should also apply when target move priority increased by ability ex. gale wings
      .partial(),
    new AttackMove(Moves.MALIGNANT_CHAIN, Type.POISON, MoveCategory.SPECIAL, 100, 100, 5, 50, 0, 9)
      .attr(StatusEffectAttr, StatusEffect.TOXIC)
  );
  allMoves.map(m => {
    if (m.getAttrs(StatStageChangeAttr).some(a => a.selfTarget && a.stages < 0)) {
      selfStatLowerMoves.push(m.id);
    }
  });
}
