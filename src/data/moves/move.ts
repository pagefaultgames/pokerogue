import { ChargeAnim, MoveChargeAnim } from "../battle-anims";
import {
  CommandedTag,
  EncoreTag,
  GulpMissileTag,
  HelpingHandTag,
  SemiInvulnerableTag,
  ShellTrapTag,
  StockpilingTag,
  SubstituteTag,
  TrappedTag,
  TypeBoostTag,
} from "../battler-tags";
import { getPokemonNameWithAffix } from "../../messages";
import type { AttackMoveResult, TurnMove } from "../../field/pokemon";
import type Pokemon from "../../field/pokemon";
import {
  EnemyPokemon,
  FieldPosition,
  HitResult,
  MoveResult,
  PlayerPokemon,
  PokemonMove,
} from "../../field/pokemon";
import {
  getNonVolatileStatusEffects,
  getStatusEffectHealText,
  isNonVolatileStatusEffect,
} from "../status-effect";
import { getTypeDamageMultiplier } from "../type";
import { PokemonType } from "#enums/pokemon-type";
import { BooleanHolder, NumberHolder, isNullOrUndefined, toDmgValue, randSeedItem, randSeedInt, getEnumValues, toReadableString, type Constructor } from "#app/utils/common";
import { WeatherType } from "#enums/weather-type";
import type { ArenaTrapTag } from "../arena-tag";
import { ArenaTagSide, WeakenMoveTypeTag } from "../arena-tag";
import {
  AllyMoveCategoryPowerBoostAbAttr,
  applyAbAttrs,
  applyPostAttackAbAttrs,
  applyPostItemLostAbAttrs,
  applyPreAttackAbAttrs,
  applyPreDefendAbAttrs,
  BlockItemTheftAbAttr,
  BlockNonDirectDamageAbAttr,
  BlockOneHitKOAbAttr,
  BlockRecoilDamageAttr,
  ChangeMovePriorityAbAttr,
  ConfusionOnStatusEffectAbAttr,
  FieldMoveTypePowerBoostAbAttr,
  FieldPreventExplosiveMovesAbAttr,
  ForceSwitchOutImmunityAbAttr,
  HealFromBerryUseAbAttr,
  IgnoreContactAbAttr,
  IgnoreMoveEffectsAbAttr,
  IgnoreProtectOnContactAbAttr,
  InfiltratorAbAttr,
  MaxMultiHitAbAttr,
  MoveAbilityBypassAbAttr,
  MoveEffectChanceMultiplierAbAttr,
  MoveTypeChangeAbAttr,
  PostDamageForceSwitchAbAttr,
  PostItemLostAbAttr,
  ReflectStatusMoveAbAttr,
  ReverseDrainAbAttr,
  UserFieldMoveTypePowerBoostAbAttr,
  VariableMovePowerAbAttr,
  WonderSkinAbAttr,
} from "../abilities/ability";
import { allAbilities } from "../data-lists";
import {
  AttackTypeBoosterModifier,
  BerryModifier,
  PokemonHeldItemModifier,
  PokemonMoveAccuracyBoosterModifier,
  PokemonMultiHitModifier,
  PreserveBerryModifier,
} from "../../modifier/modifier";
import type { BattlerIndex } from "../../battle";
import { BattleType } from "#enums/battle-type";
import { TerrainType } from "../terrain";
import { ModifierPoolType } from "#app/modifier/modifier-type";
import { Command } from "../../ui/command-ui-handler";
import i18next from "i18next";
import type { Localizable } from "#app/interfaces/locales";
import { getBerryEffectFunc } from "../berry";
import { Abilities } from "#enums/abilities";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Biome } from "#enums/biome";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { MoveUsedEvent } from "#app/events/battle-scene";
import {
  BATTLE_STATS,
  type BattleStat,
  type EffectiveStat,
  getStatKey,
  Stat,
} from "#app/enums/stat";
import { BattleEndPhase } from "#app/phases/battle-end-phase";
import { MoveEndPhase } from "#app/phases/move-end-phase";
import { MovePhase } from "#app/phases/move-phase";
import { NewBattlePhase } from "#app/phases/new-battle-phase";
import { PokemonHealPhase } from "#app/phases/pokemon-heal-phase";
import { StatStageChangePhase } from "#app/phases/stat-stage-change-phase";
import { SwitchPhase } from "#app/phases/switch-phase";
import { SwitchSummonPhase } from "#app/phases/switch-summon-phase";
import { SpeciesFormChangeRevertWeatherFormTrigger } from "../pokemon-forms";
import type { GameMode } from "#app/game-mode";
import { applyChallenges, ChallengeType } from "../challenge";
import { SwitchType } from "#enums/switch-type";
import { StatusEffect } from "#enums/status-effect";
import { globalScene } from "#app/global-scene";
import { RevivalBlessingPhase } from "#app/phases/revival-blessing-phase";
import { LoadMoveAnimPhase } from "#app/phases/load-move-anim-phase";
import { PokemonTransformPhase } from "#app/phases/pokemon-transform-phase";
import { MoveAnimPhase } from "#app/phases/move-anim-phase";
import { loggedInUser } from "#app/account";
import { MoveCategory } from "#enums/MoveCategory";
import { MoveTarget } from "#enums/MoveTarget";
import { MoveFlags } from "#enums/MoveFlags";
import { MoveEffectTrigger } from "#enums/MoveEffectTrigger";
import { MultiHitType } from "#enums/MultiHitType";
import { invalidAssistMoves, invalidCopycatMoves, invalidMetronomeMoves, invalidMirrorMoveMoves, invalidSleepTalkMoves } from "./invalid-moves";
import { TrainerVariant } from "#app/field/trainer";
import { SelectBiomePhase } from "#app/phases/select-biome-phase";

type MoveConditionFunc = (user: Pokemon, target: Pokemon, move: Move) => boolean;
type UserMoveConditionFunc = (user: Pokemon, move: Move) => boolean;

export default class Move implements Localizable {
  public id: Moves;
  public name: string;
  private _type: PokemonType;
  private _category: MoveCategory;
  public moveTarget: MoveTarget;
  public power: number;
  public accuracy: number;
  public pp: number;
  public effect: string;
  /** The chance of a move's secondary effects activating */
  public chance: number;
  public priority: number;
  public generation: number;
  public attrs: MoveAttr[] = [];
  private conditions: MoveCondition[] = [];
  /** The move's {@linkcode MoveFlags} */
  private flags: number = 0;
  private nameAppend: string = "";

  constructor(id: Moves, type: PokemonType, category: MoveCategory, defaultMoveTarget: MoveTarget, power: number, accuracy: number, pp: number, chance: number, priority: number, generation: number) {
    this.id = id;
    this._type = type;
    this._category = category;
    this.moveTarget = defaultMoveTarget;
    this.power = power;
    this.accuracy = accuracy;
    this.pp = pp;
    this.chance = chance;
    this.priority = priority;
    this.generation = generation;

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
   * Getter function that returns if the move targets the user or its ally
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

  isChargingMove(): this is ChargingMove {
    return false;
  }

  /**
   * Checks if the move is immune to certain types.
   * Currently looks at cases of Grass types with powder moves and Dark types with moves affected by Prankster.
   * @param {Pokemon} user the source of this move
   * @param {Pokemon} target the target of this move
   * @param {PokemonType} type the type of the move's target
   * @returns boolean
   */
  isTypeImmune(user: Pokemon, target: Pokemon, type: PokemonType): boolean {
    if (this.moveTarget === MoveTarget.USER) {
      return false;
    }

    switch (type) {
      case PokemonType.GRASS:
        if (this.hasFlag(MoveFlags.POWDER_MOVE)) {
          return true;
        }
        break;
      case PokemonType.DARK:
        if (user.hasAbility(Abilities.PRANKSTER) && this.category === MoveCategory.STATUS && (user.isPlayer() !== target.isPlayer())) {
          return true;
        }
        break;
    }
    return false;
  }

  /**
   * Checks if the move would hit its target's Substitute instead of the target itself.
   * @param user The {@linkcode Pokemon} using this move
   * @param target The {@linkcode Pokemon} targeted by this move
   * @returns `true` if the move can bypass the target's Substitute; `false` otherwise.
   */
  hitsSubstitute(user: Pokemon, target?: Pokemon): boolean {
    if ([ MoveTarget.USER, MoveTarget.USER_SIDE, MoveTarget.ENEMY_SIDE, MoveTarget.BOTH_SIDES ].includes(this.moveTarget)
        || !target?.getTag(BattlerTagType.SUBSTITUTE)) {
      return false;
    }

    const bypassed = new BooleanHolder(false);
    // TODO: Allow this to be simulated
    applyAbAttrs(InfiltratorAbAttr, user, null, false, bypassed);

    return !bypassed.value
        && !this.hasFlag(MoveFlags.SOUND_BASED)
        && !this.hasFlag(MoveFlags.IGNORE_SUBSTITUTE);
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
   * Internal dev flag for documenting edge cases. When using this, please document the known edge case.
   * @returns the called object {@linkcode Move}
   */
  edgeCase(): this {
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
   * @param setFlag Default `true`, set to `false` if the move doesn't make contact
   * @see {@linkcode Abilities.STATIC}
   * @returns The {@linkcode Move} that called this function
   */
  makesContact(setFlag: boolean = true): this {
    this.setFlag(MoveFlags.MAKES_CONTACT, setFlag);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.IGNORE_PROTECT} flag for the calling Move
   * @see {@linkcode Moves.CURSE}
   * @returns The {@linkcode Move} that called this function
   */
  ignoresProtect(): this {
    this.setFlag(MoveFlags.IGNORE_PROTECT, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.SOUND_BASED} flag for the calling Move
   * @see {@linkcode Moves.UPROAR}
   * @returns The {@linkcode Move} that called this function
   */
  soundBased(): this {
    this.setFlag(MoveFlags.SOUND_BASED, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.HIDE_USER} flag for the calling Move
   * @see {@linkcode Moves.TELEPORT}
   * @returns The {@linkcode Move} that called this function
   */
  hidesUser(): this {
    this.setFlag(MoveFlags.HIDE_USER, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.HIDE_TARGET} flag for the calling Move
   * @see {@linkcode Moves.WHIRLWIND}
   * @returns The {@linkcode Move} that called this function
   */
  hidesTarget(): this {
    this.setFlag(MoveFlags.HIDE_TARGET, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.BITING_MOVE} flag for the calling Move
   * @see {@linkcode Moves.BITE}
   * @returns The {@linkcode Move} that called this function
   */
  bitingMove(): this {
    this.setFlag(MoveFlags.BITING_MOVE, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.PULSE_MOVE} flag for the calling Move
   * @see {@linkcode Moves.WATER_PULSE}
   * @returns The {@linkcode Move} that called this function
   */
  pulseMove(): this {
    this.setFlag(MoveFlags.PULSE_MOVE, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.PUNCHING_MOVE} flag for the calling Move
   * @see {@linkcode Moves.DRAIN_PUNCH}
   * @returns The {@linkcode Move} that called this function
   */
  punchingMove(): this {
    this.setFlag(MoveFlags.PUNCHING_MOVE, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.SLICING_MOVE} flag for the calling Move
   * @see {@linkcode Moves.X_SCISSOR}
   * @returns The {@linkcode Move} that called this function
   */
  slicingMove(): this {
    this.setFlag(MoveFlags.SLICING_MOVE, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.RECKLESS_MOVE} flag for the calling Move
   * @see {@linkcode Abilities.RECKLESS}
   * @returns The {@linkcode Move} that called this function
   */
  recklessMove(): this {
    this.setFlag(MoveFlags.RECKLESS_MOVE, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.BALLBOMB_MOVE} flag for the calling Move
   * @see {@linkcode Moves.ELECTRO_BALL}
   * @returns The {@linkcode Move} that called this function
   */
  ballBombMove(): this {
    this.setFlag(MoveFlags.BALLBOMB_MOVE, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.POWDER_MOVE} flag for the calling Move
   * @see {@linkcode Moves.STUN_SPORE}
   * @returns The {@linkcode Move} that called this function
   */
  powderMove(): this {
    this.setFlag(MoveFlags.POWDER_MOVE, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.DANCE_MOVE} flag for the calling Move
   * @see {@linkcode Moves.PETAL_DANCE}
   * @returns The {@linkcode Move} that called this function
   */
  danceMove(): this {
    this.setFlag(MoveFlags.DANCE_MOVE, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.WIND_MOVE} flag for the calling Move
   * @see {@linkcode Moves.HURRICANE}
   * @returns The {@linkcode Move} that called this function
   */
  windMove(): this {
    this.setFlag(MoveFlags.WIND_MOVE, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.TRIAGE_MOVE} flag for the calling Move
   * @see {@linkcode Moves.ABSORB}
   * @returns The {@linkcode Move} that called this function
   */
  triageMove(): this {
    this.setFlag(MoveFlags.TRIAGE_MOVE, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.IGNORE_ABILITIES} flag for the calling Move
   * @see {@linkcode Moves.SUNSTEEL_STRIKE}
   * @returns The {@linkcode Move} that called this function
   */
  ignoresAbilities(): this {
    this.setFlag(MoveFlags.IGNORE_ABILITIES, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.CHECK_ALL_HITS} flag for the calling Move
   * @see {@linkcode Moves.TRIPLE_AXEL}
   * @returns The {@linkcode Move} that called this function
   */
  checkAllHits(): this {
    this.setFlag(MoveFlags.CHECK_ALL_HITS, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.IGNORE_SUBSTITUTE} flag for the calling Move
   * @see {@linkcode Moves.WHIRLWIND}
   * @returns The {@linkcode Move} that called this function
   */
  ignoresSubstitute(): this {
    this.setFlag(MoveFlags.IGNORE_SUBSTITUTE, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.REDIRECT_COUNTER} flag for the calling Move
   * @see {@linkcode Moves.METAL_BURST}
   * @returns The {@linkcode Move} that called this function
   */
  redirectCounter(): this {
    this.setFlag(MoveFlags.REDIRECT_COUNTER, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.REFLECTABLE} flag for the calling Move
   * @see {@linkcode Moves.ATTRACT}
   * @returns The {@linkcode Move} that called this function
   */
  reflectable(): this {
    this.setFlag(MoveFlags.REFLECTABLE, true);
    return this;
  }

  /**
   * Checks if the move flag applies to the pokemon(s) using/receiving the move
   *
   * This method will take the `user`'s ability into account when reporting flags, e.g.
   * calling this method for {@linkcode MoveFlags.MAKES_CONTACT | MAKES_CONTACT}
   * will return `false` if the user has a {@linkcode Abilities.LONG_REACH} that is not being suppressed.
   *
   * **Note:** This method only checks if the move should have effectively have the flag applied to its use.
   * It does *not* check whether the flag will trigger related effects.
   * For example using this method to check {@linkcode MoveFlags.WIND_MOVE}
   * will not consider {@linkcode Abilities.WIND_RIDER | Wind Rider }.
   *
   * To simply check whether the move has a flag, use {@linkcode hasFlag}.
   * @param flag {@linkcode MoveFlags} MoveFlag to check on user and/or target
   * @param user {@linkcode Pokemon} the Pokemon using the move
   * @param target {@linkcode Pokemon} the Pokemon receiving the move
   * @param isFollowUp (defaults to `false`) `true` if the move was used as a follow up
   * @returns boolean
   * @see {@linkcode hasFlag}
   */
  doesFlagEffectApply({ flag, user, target, isFollowUp = false }: {
    flag: MoveFlags;
    user: Pokemon;
    target?: Pokemon;
    isFollowUp?: boolean;
  }): boolean {
    // special cases below, eg: if the move flag is MAKES_CONTACT, and the user pokemon has an ability that ignores contact (like "Long Reach"), then overrides and move does not make contact
    switch (flag) {
      case MoveFlags.MAKES_CONTACT:
        if (user.hasAbilityWithAttr(IgnoreContactAbAttr) || this.hitsSubstitute(user, target)) {
          return false;
        }
        break;
      case MoveFlags.IGNORE_ABILITIES:
        if (user.hasAbilityWithAttr(MoveAbilityBypassAbAttr)) {
          const abilityEffectsIgnored = new BooleanHolder(false); 
          applyAbAttrs(MoveAbilityBypassAbAttr, user, abilityEffectsIgnored, false, this);
          if (abilityEffectsIgnored.value) {
            return true;
          }
          // Sunsteel strike, Moongeist beam, and photon geyser will not ignore abilities if invoked
          // by another move, such as via metronome.
        }
        return this.hasFlag(MoveFlags.IGNORE_ABILITIES) && !isFollowUp;
      case MoveFlags.IGNORE_PROTECT:
        if (user.hasAbilityWithAttr(IgnoreProtectOnContactAbAttr)
          && this.doesFlagEffectApply({ flag: MoveFlags.MAKES_CONTACT, user })) {
          return true;
        }
        break;
      case MoveFlags.REFLECTABLE:
        // If the target is not semi-invulnerable and either has magic coat active or an unignored magic bounce ability
        if (
          target?.getTag(SemiInvulnerableTag) ||
          !(target?.getTag(BattlerTagType.MAGIC_COAT) ||
            (!this.doesFlagEffectApply({ flag: MoveFlags.IGNORE_ABILITIES, user, target }) &&
              target?.hasAbilityWithAttr(ReflectStatusMoveAbAttr)))
        ) {
          return false;
        }
        break;
    }

    return !!(this.flags & flag);
  }

  /**
   * Applies each {@linkcode MoveCondition} function of this move to the params, determines if the move can be used prior to calling each attribute's apply()
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
   * Sees if a move has a custom failure text (by looking at each {@linkcode MoveAttr} of this move)
   * @param user {@linkcode Pokemon} using the move
   * @param target {@linkcode Pokemon} target of the move
   * @param move {@linkcode Move} with this attribute
   * @returns string of the custom failure text, or `null` if it uses the default text ("But it failed!")
   */
  getFailedText(user: Pokemon, target: Pokemon, move: Move): string | undefined {
    for (const attr of this.attrs) {
      const failedText = attr.getFailedText(user, target, move);
      if (failedText) {
        return failedText;
      }
    }
  }

  /**
   * Calculates the userBenefitScore across all the attributes and conditions
   * @param user {@linkcode Pokemon} using the move
   * @param target {@linkcode Pokemon} receiving the move
   * @param move {@linkcode Move} using the move
   * @returns integer representing the total benefitScore
   */
  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
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
  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    let score = 0;

    if (target.getAlly()?.getTag(BattlerTagType.COMMANDED)?.getSourcePokemon() === target) {
      return 20 * (target.isPlayer() === user.isPlayer() ? -1 : 1); // always -20 with how the AI handles this score
    }

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
    const moveAccuracy = new NumberHolder(this.accuracy);

    applyMoveAttrs(VariableAccuracyAttr, user, target, this, moveAccuracy);
    applyPreDefendAbAttrs(WonderSkinAbAttr, target, user, this, { value: false }, simulated, moveAccuracy);

    if (moveAccuracy.value === -1) {
      return moveAccuracy.value;
    }

    const isOhko = this.hasAttr(OneHitKOAccuracyAttr);

    if (!isOhko) {
      globalScene.applyModifiers(PokemonMoveAccuracyBoosterModifier, user.isPlayer(), user, moveAccuracy);
    }

    if (globalScene.arena.weather?.weatherType === WeatherType.FOG) {
      /**
       *  The 0.9 multiplier is PokeRogue-only implementation, Bulbapedia uses 3/5
       *  See Fog {@link https://bulbapedia.bulbagarden.net/wiki/Fog}
       */
      moveAccuracy.value = Math.floor(moveAccuracy.value * 0.9);
    }

    if (!isOhko && globalScene.arena.getTag(ArenaTagType.GRAVITY)) {
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

    const power = new NumberHolder(this.power);
    const typeChangeMovePowerMultiplier = new NumberHolder(1);

    applyPreAttackAbAttrs(MoveTypeChangeAbAttr, source, target, this, true, null, typeChangeMovePowerMultiplier);

    const sourceTeraType = source.getTeraType();
    if (source.isTerastallized && sourceTeraType === this.type && power.value < 60 && this.priority <= 0 && !this.hasAttr(MultiHitAttr) && !globalScene.findModifier(m => m instanceof PokemonMultiHitModifier && m.pokemonId === source.id)) {
      power.value = 60;
    }

    applyPreAttackAbAttrs(VariableMovePowerAbAttr, source, target, this, simulated, power);
    const ally = source.getAlly();
    if (!isNullOrUndefined(ally)) {
      applyPreAttackAbAttrs(AllyMoveCategoryPowerBoostAbAttr, ally, target, this, simulated, power);
    }

    const fieldAuras = new Set(
      globalScene.getField(true)
        .map((p) => p.getAbilityAttrs(FieldMoveTypePowerBoostAbAttr).filter(attr => {
          const condition = attr.getCondition();
          return (!condition || condition(p));
        }) as FieldMoveTypePowerBoostAbAttr[])
        .flat(),
    );
    for (const aura of fieldAuras) {
      aura.applyPreAttack(source, null, simulated, target, this, [ power ]);
    }

    const alliedField: Pokemon[] = source instanceof PlayerPokemon ? globalScene.getPlayerField() : globalScene.getEnemyField();
    alliedField.forEach(p => applyPreAttackAbAttrs(UserFieldMoveTypePowerBoostAbAttr, p, target, this, simulated, power));

    power.value *= typeChangeMovePowerMultiplier.value;

    const typeBoost = source.findTag(t => t instanceof TypeBoostTag && t.boostedType === this.type) as TypeBoostTag;
    if (typeBoost) {
      power.value *= typeBoost.boostValue;
    }

    applyMoveAttrs(VariablePowerAttr, source, target, this, power);

    if (!this.hasAttr(TypelessAttr)) {
      globalScene.arena.applyTags(WeakenMoveTypeTag, simulated, this.type, power);
      globalScene.applyModifiers(AttackTypeBoosterModifier, source.isPlayer(), source, this.type, power);
    }

    if (source.getTag(HelpingHandTag)) {
      power.value *= 1.5;
    }

    return power.value;
  }

  getPriority(user: Pokemon, simulated: boolean = true) {
    const priority = new NumberHolder(this.priority);

    applyMoveAttrs(IncrementMovePriorityAttr, user, null, this, priority);
    applyAbAttrs(ChangeMovePriorityAbAttr, user, null, simulated, this, priority);

    return priority.value;
  }

  /**
   * Calculate the [Expected Power](https://en.wikipedia.org/wiki/Expected_value) per turn
   * of this move, taking into account multi hit moves, accuracy, and the number of turns it
   * takes to execute.
   *
   * Does not (yet) consider the current field effects or the user's abilities.
   */
  calculateEffectivePower(): number {
    let effectivePower: number;
    // Triple axel and triple kick are easier to special case.
    if (this.id === Moves.TRIPLE_AXEL) {
      effectivePower = 94.14;
    } else if (this.id === Moves.TRIPLE_KICK) {
      effectivePower = 47.07;
    } else {
      const multiHitAttr = this.getAttrs(MultiHitAttr)[0];
      if (multiHitAttr) {
        effectivePower = multiHitAttr.calculateExpectedHitCount(this) * this.power;
      } else {
        effectivePower = this.power * (this.accuracy === -1 ? 1 : this.accuracy / 100);
      }
    }
    /** The number of turns the user must commit to for this move's damage */
    let numTurns = 1;

    // These are intentionally not else-if statements even though there are no
    // pokemon moves that have more than one of these attributes. This allows
    // the function to future proof new moves / custom move behaviors.
    if (this.hasAttr(DelayedAttackAttr)) {
      numTurns += 2;
    }
    if (this.hasAttr(RechargeAttr)) {
      numTurns += 1;
    }
    if (this.isChargingMove()) {
      numTurns += 1;
    }
    return effectivePower / numTurns;
  }

  /**
   * Returns `true` if this move can be given additional strikes
   * by enhancing effects.
   * Currently used for {@link https://bulbapedia.bulbagarden.net/wiki/Parental_Bond_(Ability) | Parental Bond}
   * and {@linkcode PokemonMultiHitModifier | Multi-Lens}.
   * @param user The {@linkcode Pokemon} using the move
   * @param restrictSpread `true` if the enhancing effect
   * should not affect multi-target moves (default `false`)
   */
  canBeMultiStrikeEnhanced(user: Pokemon, restrictSpread: boolean = false): boolean {
    // Multi-strike enhancers...

    // ...cannot enhance moves that hit multiple targets
    const { targets, multiple } = getMoveTargets(user, this.id);
    const isMultiTarget = multiple && targets.length > 1;

    // ...cannot enhance multi-hit or sacrificial moves
    const exceptAttrs: Constructor<MoveAttr>[] = [
      MultiHitAttr,
      SacrificialAttr,
      SacrificialAttrOnHit
    ];

    // ...and cannot enhance these specific moves
    const exceptMoves: Moves[] = [
      Moves.FLING,
      Moves.UPROAR,
      Moves.ROLLOUT,
      Moves.ICE_BALL,
      Moves.ENDEAVOR
    ];

    // ...and cannot enhance Pollen Puff when targeting an ally.
    const ally = user.getAlly();
    const exceptPollenPuffAlly: boolean = this.id === Moves.POLLEN_PUFF && !isNullOrUndefined(ally) && targets.includes(ally.getBattlerIndex())

    return (!restrictSpread || !isMultiTarget)
      && !this.isChargingMove()
      && !exceptAttrs.some(attr => this.hasAttr(attr))
      && !exceptMoves.some(id => this.id === id)
      && !exceptPollenPuffAlly
      && this.category !== MoveCategory.STATUS;
  }
}

export class AttackMove extends Move {
  constructor(id: Moves, type: PokemonType, category: MoveCategory, power: number, accuracy: number, pp: number, chance: number, priority: number, generation: number) {
    super(id, type, category, MoveTarget.NEAR_OTHER, power, accuracy, pp, chance, priority, generation);

    /**
     * {@link https://bulbapedia.bulbagarden.net/wiki/Freeze_(status_condition)}
     * > All damaging Fire-type moves can now thaw a frozen target, regardless of whether or not they have a chance to burn;
     */
    if (this.type === PokemonType.FIRE) {
      this.addAttr(new HealStatusEffectAttr(false, StatusEffect.FREEZE));
    }
  }

  /**
   * Compute the benefit score of this move based on the offensive stat used and the move's power.
   * @param user The Pokemon using the move
   * @param target The Pokemon targeted by the move
   * @param move The move being used
   * @returns The benefit score of using this move
   */
  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    // TODO: Properly handle foul play, body press, and opponent stat stages.
    const ret = super.getTargetBenefitScore(user, target, move);
    let attackScore = 0;

    const effectiveness = target.getAttackTypeEffectiveness(this.type, user, undefined, undefined, this);
    attackScore = Math.pow(effectiveness - 1, 2) * (effectiveness < 1 ? -2 : 2);
    const [ thisStat, offStat ]: EffectiveStat[] = this.category === MoveCategory.PHYSICAL ? [ Stat.ATK, Stat.SPATK ] : [ Stat.SPATK, Stat.ATK ];
    const statHolder = new NumberHolder(user.getEffectiveStat(thisStat, target));
    const offStatValue = user.getEffectiveStat(offStat, target);
    applyMoveAttrs(VariableAtkAttr, user, target, move, statHolder);
    const statRatio = offStatValue / statHolder.value;
    if (statRatio <= 0.75) {
      attackScore *= 2;
    } else if (statRatio <= 0.875) {
      attackScore *= 1.5;
    }

    const power = new NumberHolder(this.calculateEffectivePower());
    applyMoveAttrs(VariablePowerAttr, user, target, move, power);

    attackScore += Math.floor(power.value / 5);

    return ret - attackScore;
  }
}

export class StatusMove extends Move {
  constructor(id: Moves, type: PokemonType, accuracy: number, pp: number, chance: number, priority: number, generation: number) {
    super(id, type, MoveCategory.STATUS, MoveTarget.NEAR_OTHER, -1, accuracy, pp, chance, priority, generation);
  }
}

export class SelfStatusMove extends Move {
  constructor(id: Moves, type: PokemonType, accuracy: number, pp: number, chance: number, priority: number, generation: number) {
    super(id, type, MoveCategory.STATUS, MoveTarget.USER, -1, accuracy, pp, chance, priority, generation);
  }
}

type SubMove = new (...args: any[]) => Move;

function ChargeMove<TBase extends SubMove>(Base: TBase) {
  return class extends Base {
    /** The animation to play during the move's charging phase */
    public readonly chargeAnim: ChargeAnim = ChargeAnim[`${Moves[this.id]}_CHARGING`];
    /** The message to show during the move's charging phase */
    private _chargeText: string;

    /** Move attributes that apply during the move's charging phase */
    public chargeAttrs: MoveAttr[] = [];

    override isChargingMove(): this is ChargingMove {
      return true;
    }

    /**
     * Sets the text to be displayed during this move's charging phase.
     * References to the user Pokemon should be written as "{USER}", and
     * references to the target Pokemon should be written as "{TARGET}".
     * @param chargeText the text to set
     * @returns this {@linkcode Move} (for chaining API purposes)
     */
    chargeText(chargeText: string): this {
      this._chargeText = chargeText;
      return this;
    }

    /**
     * Queues the charge text to display to the player
     * @param user the {@linkcode Pokemon} using this move
     * @param target the {@linkcode Pokemon} targeted by this move (optional)
     */
    showChargeText(user: Pokemon, target?: Pokemon): void {
      globalScene.queueMessage(this._chargeText
        .replace("{USER}", getPokemonNameWithAffix(user))
        .replace("{TARGET}", getPokemonNameWithAffix(target))
      );
    }

    /**
     * Gets all charge attributes of the given attribute type.
     * @param attrType any attribute that extends {@linkcode MoveAttr}
     * @returns Array of attributes that match `attrType`, or an empty array if
     * no matches are found.
     */
    getChargeAttrs<T extends MoveAttr>(attrType: Constructor<T>): T[] {
      return this.chargeAttrs.filter((attr): attr is T => attr instanceof attrType);
    }

    /**
     * Checks if this move has an attribute of the given type.
     * @param attrType any attribute that extends {@linkcode MoveAttr}
     * @returns `true` if a matching attribute is found; `false` otherwise
     */
    hasChargeAttr<T extends MoveAttr>(attrType: Constructor<T>): boolean {
      return this.chargeAttrs.some((attr) => attr instanceof attrType);
    }

    /**
     * Adds an attribute to this move to be applied during the move's charging phase
     * @param ChargeAttrType the type of {@linkcode MoveAttr} being added
     * @param args the parameters to construct the given {@linkcode MoveAttr} with
     * @returns this {@linkcode Move} (for chaining API purposes)
     */
    chargeAttr<T extends Constructor<MoveAttr>>(ChargeAttrType: T, ...args: ConstructorParameters<T>): this {
      const chargeAttr = new ChargeAttrType(...args);
      this.chargeAttrs.push(chargeAttr);

      return this;
    }
  };
}

export class ChargingAttackMove extends ChargeMove(AttackMove) {}
export class ChargingSelfStatusMove extends ChargeMove(SelfStatusMove) {}

export type ChargingMove = ChargingAttackMove | ChargingSelfStatusMove;

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
  apply(user: Pokemon | null, target: Pokemon | null, move: Move, args: any[]): boolean {
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
   * @returns the string representing failure of this {@linkcode Move}
   */
  getFailedText(user: Pokemon, target: Pokemon, move: Move): string | undefined {
    return;
  }

  /**
   * Used by the Enemy AI to rank an attack based on a given user
   * @see {@linkcode EnemyPokemon.getNextMove}
   * @virtual
   */
  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    return 0;
  }

  /**
   * Used by the Enemy AI to rank an attack based on a given target
   * @see {@linkcode EnemyPokemon.getNextMove}
   * @virtual
   */
  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    return 0;
  }
}

interface MoveEffectAttrOptions {
  /**
   * Defines when this effect should trigger in the move's effect order
   * @see {@linkcode MoveEffectPhase}
   */
  trigger?: MoveEffectTrigger;
  /** Should this effect only apply on the first hit? */
  firstHitOnly?: boolean;
  /** Should this effect only apply on the last hit? */
  lastHitOnly?: boolean;
  /** Should this effect only apply on the first target hit? */
  firstTargetOnly?: boolean;
  /** Overrides the secondary effect chance for this attr if set. */
  effectChanceOverride?: number;
}

/** Base class defining all Move Effect Attributes
 * @extends MoveAttr
 * @see {@linkcode apply}
 */
export class MoveEffectAttr extends MoveAttr {
  /**
   * A container for this attribute's optional parameters
   * @see {@linkcode MoveEffectAttrOptions} for supported params.
   */
  protected options?: MoveEffectAttrOptions;

  constructor(selfTarget?: boolean, options?: MoveEffectAttrOptions) {
    super(selfTarget);
    this.options = options;
  }

  /**
   * Defines when this effect should trigger in the move's effect order.
   * @default MoveEffectTrigger.POST_APPLY
   * @see {@linkcode MoveEffectTrigger}
   */
  public get trigger () {
    return this.options?.trigger ?? MoveEffectTrigger.POST_APPLY;
  }

  /**
   * `true` if this effect should only trigger on the first hit of
   * multi-hit moves.
   * @default false
   */
  public get firstHitOnly () {
    return this.options?.firstHitOnly ?? false;
  }

  /**
   * `true` if this effect should only trigger on the last hit of
   * multi-hit moves.
   * @default false
   */
  public get lastHitOnly () {
    return this.options?.lastHitOnly ?? false;
  }

  /**
   * `true` if this effect should apply only upon hitting a target
   * for the first time when targeting multiple {@linkcode Pokemon}.
   * @default false
   */
  public get firstTargetOnly () {
    return this.options?.firstTargetOnly ?? false;
  }

  /**
   * If defined, overrides the move's base chance for this
   * secondary effect to trigger.
   */
  public get effectChanceOverride () {
    return this.options?.effectChanceOverride;
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
                move.doesFlagEffectApply({ flag: MoveFlags.IGNORE_PROTECT, user, target }));
  }

  /** Applies move effects so long as they are able based on {@linkcode canApply} */
  apply(user: Pokemon, target: Pokemon, move: Move, args?: any[]): boolean {
    return this.canApply(user, target, move, args);
  }

  /**
   * Gets the used move's additional effect chance.
   * Chance is modified by {@linkcode MoveEffectChanceMultiplierAbAttr} and {@linkcode IgnoreMoveEffectsAbAttr}.
   * @param user {@linkcode Pokemon} using this move
   * @param target {@linkcode Pokemon | Target} of this move
   * @param move {@linkcode Move} being used
   * @param selfEffect `true` if move targets user.
   * @returns Move effect chance value.
   */
  getMoveChance(user: Pokemon, target: Pokemon, move: Move, selfEffect?: Boolean, showAbility?: Boolean): number {
    const moveChance = new NumberHolder(this.effectChanceOverride ?? move.chance);

    applyAbAttrs(MoveEffectChanceMultiplierAbAttr, user, null, !showAbility, moveChance, move);

    if ((!move.hasAttr(FlinchAttr) || moveChance.value <= move.chance) && !move.hasAttr(SecretPowerAttr)) {
      const userSide = user.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY;
      globalScene.arena.applyTagsForSide(ArenaTagType.WATER_FIRE_PLEDGE, userSide, false, moveChance);
    }

    if (!selfEffect) {
      applyPreDefendAbAttrs(IgnoreMoveEffectsAbAttr, target, user, null, null, !showAbility, moveChance);
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
      globalScene.queueMessage(message);
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
      globalScene.queueMessage(message, 500);
      return true;
    }
    return false;
  }
}

/**
 * Attribute for moves that can be conditionally interrupted to be considered to
 * have failed before their "useMove" message is displayed. Currently used by
 * Focus Punch.
 * @extends MoveAttr
 */
export class PreUseInterruptAttr extends MoveAttr {
  protected message?: string | ((user: Pokemon, target: Pokemon, move: Move) => string);
  protected overridesFailedMessage: boolean;
  protected conditionFunc: MoveConditionFunc;

  /**
   * Create a new MoveInterruptedMessageAttr.
   * @param message The message to display when the move is interrupted, or a function that formats the message based on the user, target, and move.
   */
  constructor(message?: string | ((user: Pokemon, target: Pokemon, move: Move) => string), conditionFunc?: MoveConditionFunc) {
    super();
    this.message = message;
    this.conditionFunc = conditionFunc ?? (() => true);
  }

  /**
   * Message to display when a move is interrupted.
   * @param user {@linkcode Pokemon} using the move
   * @param target {@linkcode Pokemon} target of the move
   * @param move {@linkcode Move} with this attribute
   */
  override apply(user: Pokemon, target: Pokemon, move: Move): boolean {
    return this.conditionFunc(user, target, move);
  }

  /**
   * Message to display when a move is interrupted.
   * @param user {@linkcode Pokemon} using the move
   * @param target {@linkcode Pokemon} target of the move
   * @param move {@linkcode Move} with this attribute
   */
  override getFailedText(user: Pokemon, target: Pokemon, move: Move): string | undefined {
    if (this.message && this.conditionFunc(user, target, move)) {
      const message =
        typeof this.message === "string"
          ? (this.message as string)
          : this.message(user, target, move);
      return message;
    }
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
    (args[0] as BooleanHolder).value = true;

    return true;
  }
}

export class HighCritAttr extends MoveAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    (args[0] as NumberHolder).value++;

    return true;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    return 3;
  }
}

export class CritOnlyAttr extends MoveAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    (args[0] as BooleanHolder).value = true;

    return true;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    return 5;
  }
}

export class FixedDamageAttr extends MoveAttr {
  private damage: number;

  constructor(damage: number) {
    super();

    this.damage = damage;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    (args[0] as NumberHolder).value = this.getDamage(user, target, move);

    return true;
  }

  getDamage(user: Pokemon, target: Pokemon, move: Move): number {
    return this.damage;
  }
}

export class UserHpDamageAttr extends FixedDamageAttr {
  constructor() {
    super(0);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    (args[0] as NumberHolder).value = user.hp;

    return true;
  }
}

export class TargetHalfHpDamageAttr extends FixedDamageAttr {
  /**
   * The initial amount of hp the target had before the first hit.
   * Used for calculating multi lens damage.
   */
  private initialHp: number;
  constructor() {
    super(0);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    // first, determine if the hit is coming from multi lens or not
    const lensCount = user.getHeldItems().find(i => i instanceof PokemonMultiHitModifier)?.getStackCount() ?? 0;
    if (lensCount <= 0) {
      // no multi lenses; we can just halve the target's hp and call it a day
      (args[0] as NumberHolder).value = toDmgValue(target.hp / 2);
      return true;
    }

    // figure out what hit # we're on
    switch (user.turnData.hitCount - user.turnData.hitsLeft) {
      case 0:
        // first hit of move; update initialHp tracker
        this.initialHp = target.hp;
      default:
        // multi lens added hit; use initialHp tracker to ensure correct damage
        (args[0] as NumberHolder).value = toDmgValue(this.initialHp / 2);
        return true;
      case lensCount + 1:
        // parental bond added hit; calc damage as normal
        (args[0] as NumberHolder).value = toDmgValue(target.hp / 2);
        return true;
    }
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
    (args[0] as NumberHolder).value = target.hp - user.hp;

    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => user.hp <= target.hp;
  }

  // TODO
  /*getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    return 0;
  }*/
}

type MoveFilter = (move: Move) => boolean;

export class CounterDamageAttr extends FixedDamageAttr {
  private moveFilter: MoveFilter;
  private multiplier: number;

  constructor(moveFilter: MoveFilter, multiplier: number) {
    super(0);

    this.moveFilter = moveFilter;
    this.multiplier = multiplier;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const damage = user.turnData.attacksReceived.filter(ar => this.moveFilter(allMoves[ar.move])).reduce((total: number, ar: AttackMoveResult) => total + ar.damage, 0);
    (args[0] as NumberHolder).value = toDmgValue(damage * this.multiplier);

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
    return toDmgValue(user.level * (user.randSeedIntRange(50, 150) * 0.01));
  }
}

export class ModifiedDamageAttr extends MoveAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const initialDamage = args[0] as NumberHolder;
    initialDamage.value = this.getModifiedDamage(user, target, move, initialDamage.value);

    return true;
  }

  getModifiedDamage(user: Pokemon, target: Pokemon, move: Move, damage: number): number {
    return damage;
  }
}

export class SurviveDamageAttr extends ModifiedDamageAttr {
  getModifiedDamage(user: Pokemon, target: Pokemon, move: Move, damage: number): number {
    return Math.min(damage, target.hp - 1);
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    return target.hp > 1 ? 0 : -20;
  }
}

export class SplashAttr extends MoveEffectAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    globalScene.queueMessage(i18next.t("moveTriggers:splash"));
    return true;
  }
}

export class CelebrateAttr extends MoveEffectAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    globalScene.queueMessage(i18next.t("moveTriggers:celebrate", { playerName: loggedInUser?.username }));
    return true;
  }
}

export class RecoilAttr extends MoveEffectAttr {
  private useHp: boolean;
  private damageRatio: number;
  private unblockable: boolean;

  constructor(useHp: boolean = false, damageRatio: number = 0.25, unblockable: boolean = false) {
    super(true, { lastHitOnly: true });

    this.useHp = useHp;
    this.damageRatio = damageRatio;
    this.unblockable = unblockable;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const cancelled = new BooleanHolder(false);
    if (!this.unblockable) {
      applyAbAttrs(BlockRecoilDamageAttr, user, cancelled);
      applyAbAttrs(BlockNonDirectDamageAbAttr, user, cancelled);
    }

    if (cancelled.value) {
      return false;
    }

    // Chloroblast and Struggle should not deal recoil damage if the move was not successful
    if (this.useHp && [ MoveResult.FAIL, MoveResult.MISS ].includes(user.getLastXMoves(1)[0]?.result ?? MoveResult.FAIL)) {
      return false;
    }

    const damageValue = (!this.useHp ? user.turnData.totalDamageDealt : user.getMaxHp()) * this.damageRatio;
    const minValue = user.turnData.totalDamageDealt ? 1 : 0;
    const recoilDamage = toDmgValue(damageValue, minValue);
    if (!recoilDamage) {
      return false;
    }

    if (cancelled.value) {
      return false;
    }

    user.damageAndUpdate(recoilDamage, { result: HitResult.INDIRECT, ignoreSegments: true });
    globalScene.queueMessage(i18next.t("moveTriggers:hitWithRecoil", { pokemonName: getPokemonNameWithAffix(user) }));
    user.turnData.damageTaken += recoilDamage;

    return true;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
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
    super(true, { trigger: MoveEffectTrigger.POST_TARGET });
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
    user.damageAndUpdate(user.hp, { result: HitResult.INDIRECT, ignoreSegments: true });
	  user.turnData.damageTaken += user.hp;

    return true;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
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
    super(true);
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

    user.damageAndUpdate(user.hp, { result: HitResult.INDIRECT, ignoreSegments: true });
    user.turnData.damageTaken += user.hp;

    return true;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
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
    super(true, { trigger: MoveEffectTrigger.POST_TARGET });
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

    const cancelled = new BooleanHolder(false);
    // Check to see if the Pokemon has an ability that blocks non-direct damage
    applyAbAttrs(BlockNonDirectDamageAbAttr, user, cancelled);
    if (!cancelled.value) {
      user.damageAndUpdate(toDmgValue(user.getMaxHp() / 2), { result: HitResult.INDIRECT, ignoreSegments: true });
      globalScene.queueMessage(i18next.t("moveTriggers:cutHpPowerUpMove", { pokemonName: getPokemonNameWithAffix(user) })); // Queue recoil message
    }
    return true;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    if (user.isBoss()) {
      return -10;
    }
    return Math.ceil(((1 - user.getHpRatio() / 2) * 10 - 10) * (target.getAttackTypeEffectiveness(move.type, user) - 0.5));
  }
}

/**
 * Attribute to put in a {@link https://bulbapedia.bulbagarden.net/wiki/Substitute_(doll) | Substitute Doll}
 * for the user.
 * @extends MoveEffectAttr
 * @see {@linkcode apply}
 */
export class AddSubstituteAttr extends MoveEffectAttr {
  /** The ratio of the user's max HP that is required to apply this effect */
  private hpCost: number;
  /** Whether the damage taken should be rounded up (Shed Tail rounds up) */
  private roundUp: boolean;

  constructor(hpCost: number, roundUp: boolean) {
    super(true);

    this.hpCost = hpCost;
    this.roundUp = roundUp;
  }

  /**
   * Removes 1/4 of the user's maximum HP (rounded down) to create a substitute for the user
   * @param user the {@linkcode Pokemon} that used the move.
   * @param target n/a
   * @param move the {@linkcode Move} with this attribute.
   * @param args n/a
   * @returns true if the attribute successfully applies, false otherwise
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const damageTaken = this.roundUp ? Math.ceil(user.getMaxHp() * this.hpCost) : Math.floor(user.getMaxHp() * this.hpCost);
    user.damageAndUpdate(damageTaken, { result: HitResult.INDIRECT, ignoreSegments: true, ignoreFaintPhase: true });
    user.addTag(BattlerTagType.SUBSTITUTE, 0, move.id, user.id);
    return true;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    if (user.isBoss()) {
      return -10;
    }
    return 5;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => !user.getTag(SubstituteTag) && user.hp > (this.roundUp ? Math.ceil(user.getMaxHp() * this.hpCost) : Math.floor(user.getMaxHp() * this.hpCost)) && user.getMaxHp() > 1;
  }

  /**
   * Get the substitute-specific failure message if one should be displayed.
   * @param user The pokemon using the move.
   * @returns The substitute-specific failure message if the conditions apply, otherwise `undefined`
   */
  getFailedText(user: Pokemon, _target: Pokemon, _move: Move): string | undefined {
    if (user.getTag(SubstituteTag)) {
      return i18next.t("moveTriggers:substituteOnOverlap", { pokemonName: getPokemonNameWithAffix(user) });
    } else if (user.hp <= Math.floor(user.getMaxHp() / 4) || user.getMaxHp() === 1) {
      return i18next.t("moveTriggers:substituteNotEnoughHp");
    }
  }
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
    globalScene.unshiftPhase(new PokemonHealPhase(target.getBattlerIndex(),
      toDmgValue(target.getMaxHp() * healRatio), i18next.t("moveTriggers:healHp", { pokemonName: getPokemonNameWithAffix(target) }), true, !this.showAnim));
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
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
  private message: string | null;
  /** Skips mons with this ability, ie. Soundproof */
  private abilityCondition: Abilities;

  constructor(message: string | null, abilityCondition: Abilities) {
    super();

    this.message = message;
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
    const partyPokemon = user.isPlayer() ? globalScene.getPlayerParty() : globalScene.getEnemyParty();
    partyPokemon.forEach(p => this.cureStatus(p, user.id));

    if (this.message) {
      globalScene.queueMessage(this.message);
    }

    return true;
  }

  /**
   * Tries to cure the status of the given {@linkcode Pokemon}
   * @param pokemon The {@linkcode Pokemon} to cure.
   * @param userId The ID of the (move) {@linkcode Pokemon | user}.
   */
  public cureStatus(pokemon: Pokemon, userId: number) {
    if (!pokemon.isOnField() || pokemon.id === userId) { // user always cures its own status, regardless of ability
      pokemon.resetStatus(false);
      pokemon.updateInfo();
    } else if (!pokemon.hasAbility(this.abilityCondition)) {
      pokemon.resetStatus();
      pokemon.updateInfo();
    } else {
      // TODO: Ability displays should be handled by the ability
      globalScene.queueAbilityDisplay(pokemon, pokemon.getPassiveAbility()?.id === this.abilityCondition, true);
      globalScene.queueAbilityDisplay(pokemon, pokemon.getPassiveAbility()?.id === this.abilityCondition, false);
    }
  }
}

/**
 * Applies damage to the target's ally equal to 1/16 of that ally's max HP.
 * @extends MoveEffectAttr
 */
export class FlameBurstAttr extends MoveEffectAttr {
  constructor() {
    /**
     * This is self-targeted to bypass immunity to target-facing secondary
     * effects when the target has an active Substitute doll.
     * TODO: Find a more intuitive way to implement Substitute bypassing.
     */
    super(true);
  }
  /**
   * @param user - n/a
   * @param target - The target Pokémon.
   * @param move - n/a
   * @param args - n/a
   * @returns A boolean indicating whether the effect was successfully applied.
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const targetAlly = target.getAlly();
    const cancelled = new BooleanHolder(false);

    if (!isNullOrUndefined(targetAlly)) {
      applyAbAttrs(BlockNonDirectDamageAbAttr, targetAlly, cancelled);
    }

    if (cancelled.value || !targetAlly || targetAlly.switchOutStatus) {
      return false;
    }

    targetAlly.damageAndUpdate(Math.max(1, Math.floor(1 / 16 * targetAlly.getMaxHp())), { result: HitResult.INDIRECT });
    return true;
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    return !isNullOrUndefined(target.getAlly()) ? -5 : 0;
  }
}

export class SacrificialFullRestoreAttr extends SacrificialAttr {
  protected restorePP: boolean;
  protected moveMessage: string;

  constructor(restorePP: boolean, moveMessage: string) {
    super();

    this.restorePP = restorePP;
    this.moveMessage = moveMessage;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    // We don't know which party member will be chosen, so pick the highest max HP in the party
    const party = user.isPlayer() ? globalScene.getPlayerParty() : globalScene.getEnemyParty();
    const maxPartyMemberHp = party.map(p => p.getMaxHp()).reduce((maxHp: number, hp: number) => Math.max(hp, maxHp), 0);

    globalScene.pushPhase(
      new PokemonHealPhase(
        user.getBattlerIndex(),
        maxPartyMemberHp,
        i18next.t(this.moveMessage, { pokemonName: getPokemonNameWithAffix(user) }),
        true,
        false,
        false,
        true,
        false,
        this.restorePP),
      true);

    return true;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    return -20;
  }

  getCondition(): MoveConditionFunc {
    return (user, _target, _move) => globalScene.getPlayerParty().filter(p => p.isActive()).length > globalScene.currentBattle.getBattlerCount();
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
   * @param args [0] {@linkcode NumberHolder} for arenaAttackTypeMultiplier
   * @returns true if the function succeeds
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const weatherModifier = args[0] as NumberHolder;
    //If the type-based attack power modifier due to weather (e.g. Water moves in Sun) is below 1, set it to 1
    if (globalScene.arena.weather?.weatherType === this.weather) {
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
    if (!globalScene.arena.weather?.isEffectSuppressed()) {
      const weatherType = globalScene.arena.weather?.weatherType || WeatherType.NONE;
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

  constructor(normalHealRatio: number = 0.5, boostedHealRatio: number = 2 / 3, showAnim?: boolean, selfTarget?: boolean, condition?: MoveConditionFunc) {
    super(normalHealRatio, showAnim, selfTarget);
    this.normalHealRatio = normalHealRatio;
    this.boostedHealRatio = boostedHealRatio;
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
    super(true);

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
      message = i18next.t("battle:drainMessage", { pokemonName: getPokemonNameWithAffix(target) });
    } else {
      // Default healing formula used by draining moves like Absorb, Draining Kiss, Bitter Blade, etc.
      healAmount = toDmgValue(user.turnData.singleHitDamageDealt * this.healRatio);
      message = i18next.t("battle:regainHealth", { pokemonName: getPokemonNameWithAffix(user) });
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
    globalScene.unshiftPhase(new PokemonHealPhase(user.getBattlerIndex(), healAmount, message, false, true));
    return true;
  }

  /**
   * Used by the Enemy AI to rank an attack based on a given user
   * @param user {@linkcode Pokemon} using this move
   * @param target {@linkcode Pokemon} target of this move
   * @param move {@linkcode Move} being used
   * @returns an integer. Higher means enemy is more likely to use that move.
   */
  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    if (this.healStat) {
      const healAmount = target.getEffectiveStat(this.healStat);
      return Math.floor(Math.max(0, (Math.min(1, (healAmount + user.hp) / user.getMaxHp() - 0.33))) / user.getHpRatio());
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
  private increaseAmount: number;

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
   * @param args [0] {@linkcode NumberHolder} for move priority.
   * @returns true if function succeeds
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!this.moveIncrementFunc(user, target, move)) {
      return false;
    }

    (args[0] as NumberHolder).value += this.increaseAmount;
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
  /** This move's intrinsic multi-hit type. It should never be modified. */
  private readonly intrinsicMultiHitType: MultiHitType;
  /** This move's current multi-hit type. It may be temporarily modified by abilities (e.g., Battle Bond). */
  private multiHitType: MultiHitType;

  constructor(multiHitType?: MultiHitType) {
    super();

    this.intrinsicMultiHitType = multiHitType !== undefined ? multiHitType : MultiHitType._2_TO_5;
    this.multiHitType = this.intrinsicMultiHitType;
  }

  // Currently used by `battle_bond.test.ts`
  getMultiHitType(): MultiHitType {
    return this.multiHitType;
  }

  /**
   * Set the hit count of an attack based on this attribute instance's {@linkcode MultiHitType}.
   * If the target has an immunity to this attack's types, the hit count will always be 1.
   *
   * @param user {@linkcode Pokemon} that used the attack
   * @param target {@linkcode Pokemon} targeted by the attack
   * @param move {@linkcode Move} being used
   * @param args [0] {@linkcode NumberHolder} storing the hit count of the attack
   * @returns True
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const hitType = new NumberHolder(this.intrinsicMultiHitType);
    applyMoveAttrs(ChangeMultiHitTypeAttr, user, target, move, hitType);
    this.multiHitType = hitType.value;

    (args[0] as NumberHolder).value = this.getHitCount(user, target);
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
  getHitCount(user: Pokemon, target: Pokemon): number {
    switch (this.multiHitType) {
      case MultiHitType._2_TO_5:
      {
        const rand = user.randSeedInt(20);
        const hitValue = new NumberHolder(rand);
        applyAbAttrs(MaxMultiHitAbAttr, user, null, false, hitValue);
        if (hitValue.value >= 13) {
          return 2;
        } else if (hitValue.value >= 6) {
          return 3;
        } else if (hitValue.value >= 3) {
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
        const party = user.isPlayer() ? globalScene.getPlayerParty() : globalScene.getEnemyParty();
        // No status means the ally pokemon can contribute to Beat Up
        return party.reduce((total, pokemon) => {
          return total + (pokemon.id === user.id ? 1 : pokemon?.status && pokemon.status.effect !== StatusEffect.NONE ? 0 : 1);
        }, 0);
    }
  }

  /**
   * Calculate the expected number of hits given this attribute's {@linkcode MultiHitType},
   * the move's accuracy, and a number of situational parameters.
   *
   * @param move - The move that this attribtue is applied to
   * @param partySize - The size of the user's party, used for {@linkcode Moves.BEAT_UP | Beat Up} (default: `1`)
   * @param maxMultiHit - Whether the move should always hit the maximum number of times, e.g. due to {@linkcode Abilities.SKILL_LINK | Skill Link} (default: `false`)
   * @param ignoreAcc - `true` if the move should ignore accuracy checks, e.g. due to  {@linkcode Abilities.NO_GUARD | No Guard} (default: `false`)
   */
  calculateExpectedHitCount(move: Move, { ignoreAcc = false, maxMultiHit = false, partySize = 1 }: {ignoreAcc?: boolean, maxMultiHit?: boolean, partySize?: number} = {}): number {
    let expectedHits: number;
    switch (this.multiHitType) {
      case MultiHitType._2_TO_5:
        expectedHits = maxMultiHit ? 5 : 3.1;
        break;
      case MultiHitType._2:
        expectedHits = 2;
        break;
      case MultiHitType._3:
        expectedHits = 3;
        break;
      case MultiHitType._10:
        expectedHits = 10;
        break;
      case MultiHitType.BEAT_UP:
        // Estimate that half of the party can contribute to beat up.
        expectedHits = Math.max(1, partySize / 2);
        break;
    }
    if (ignoreAcc || move.accuracy === -1) {
      return expectedHits;
    }
    const acc = move.accuracy / 100;
    if (move.hasFlag(MoveFlags.CHECK_ALL_HITS) && !maxMultiHit) {
      // N.B. No moves should be the _2_TO_5 variant and have the CHECK_ALL_HITS flag.
      return acc * (1 - Math.pow(acc, expectedHits)) / (1 - acc);
    }
    return expectedHits *= acc;
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
      (args[0] as NumberHolder).value = MultiHitType._3;
      return true;
    }
    return false;
  }
}

export class StatusEffectAttr extends MoveEffectAttr {
  public effect: StatusEffect;
  public turnsRemaining?: number;
  public overrideStatus: boolean = false;

  constructor(effect: StatusEffect, selfTarget?: boolean, turnsRemaining?: number, overrideStatus: boolean = false) {
    super(selfTarget);

    this.effect = effect;
    this.turnsRemaining = turnsRemaining;
    this.overrideStatus = overrideStatus;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const moveChance = this.getMoveChance(user, target, move, this.selfTarget, true);
    const statusCheck = moveChance < 0 || moveChance === 100 || user.randSeedInt(100) < moveChance;
    if (statusCheck) {
      const pokemon = this.selfTarget ? user : target;
      if (user !== target && move.category === MoveCategory.STATUS && !target.canSetStatus(this.effect, false, false, user, true)) {
        return false;
      }
      if (((!pokemon.status || this.overrideStatus) || (pokemon.status.effect === this.effect && moveChance < 0))
        && pokemon.trySetStatus(this.effect, true, user, this.turnsRemaining, null, this.overrideStatus)) {
        applyPostAttackAbAttrs(ConfusionOnStatusEffectAbAttr, user, target, move, null, false, this.effect);
        return true;
      }
    }
    return false;
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    const moveChance = this.getMoveChance(user, target, move, this.selfTarget, false);
    const score = (moveChance < 0) ? -10 : Math.floor(moveChance * -0.1);
    const pokemon = this.selfTarget ? user : target;

    return !pokemon.status && pokemon.canSetStatus(this.effect, true, false, user) ? score : 0;
  }
}

export class MultiStatusEffectAttr extends StatusEffectAttr {
  public effects: StatusEffect[];

  constructor(effects: StatusEffect[], selfTarget?: boolean, turnsRemaining?: number, overrideStatus?: boolean) {
    super(effects[0], selfTarget, turnsRemaining, overrideStatus);
    this.effects = effects;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    this.effect = randSeedItem(this.effects);
    const result = super.apply(user, target, move, args);
    return result;
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    const moveChance = this.getMoveChance(user, target, move, this.selfTarget, false);
    const score = (moveChance < 0) ? -10 : Math.floor(moveChance * -0.1);
    const pokemon = this.selfTarget ? user : target;

    return !pokemon.status && pokemon.canSetStatus(this.effect, true, false, user) ? score : 0;
  }
}

export class PsychoShiftEffectAttr extends MoveEffectAttr {
  constructor() {
    super(false);
  }

  /**
   * Applies the effect of Psycho Shift to its target
   * Psycho Shift takes the user's status effect and passes it onto the target. The user is then healed after the move has been successfully executed.
   * @returns `true` if Psycho Shift's effect is able to be applied to the target
   */
  apply(user: Pokemon, target: Pokemon, _move: Move, _args: any[]): boolean {
    const statusToApply: StatusEffect | undefined = user.status?.effect ?? (user.hasAbility(Abilities.COMATOSE) ? StatusEffect.SLEEP : undefined);

    if (target.status) {
      return false;
    } else {
      const canSetStatus = target.canSetStatus(statusToApply, true, false, user);
      const trySetStatus = canSetStatus ? target.trySetStatus(statusToApply, true, user) : false;

      if (trySetStatus && user.status) {
        // PsychoShiftTag is added to the user if move succeeds so that the user is healed of its status effect after its move
        user.addTag(BattlerTagType.PSYCHO_SHIFT);
      }

      return trySetStatus;
    }
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    return !target.status && target.canSetStatus(user.status?.effect, true, false, user) ? -10 : 0;
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
    super(false);
    this.chance = chance;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const rand = Phaser.Math.RND.realInRange(0, 1);
    if (rand >= this.chance) {
      return false;
    }
    const heldItems = this.getTargetHeldItems(target).filter((i) => i.isTransferable);
    if (heldItems.length) {
      const poolType = target.isPlayer() ? ModifierPoolType.PLAYER : target.hasTrainer() ? ModifierPoolType.TRAINER : ModifierPoolType.WILD;
      const highestItemTier = heldItems.map((m) => m.type.getOrInferTier(poolType)).reduce((highestTier, tier) => Math.max(tier!, highestTier), 0); // TODO: is the bang after tier correct?
      const tierHeldItems = heldItems.filter((m) => m.type.getOrInferTier(poolType) === highestItemTier);
      const stolenItem = tierHeldItems[user.randSeedInt(tierHeldItems.length)];
      if (globalScene.tryTransferHeldItemModifier(stolenItem, user, false)) {
        globalScene.queueMessage(i18next.t("moveTriggers:stoleItem", { pokemonName: getPokemonNameWithAffix(user), targetName: getPokemonNameWithAffix(target), itemName: stolenItem.type.name }));
        return true;
      }
    }
    return false;
  }

  getTargetHeldItems(target: Pokemon): PokemonHeldItemModifier[] {
    return globalScene.findModifiers(m => m instanceof PokemonHeldItemModifier
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
    super(false);
    this.berriesOnly = berriesOnly;
  }

  /**
   *
   * @param user {@linkcode Pokemon} that used the move
   * @param target Target {@linkcode Pokemon} that the moves applies to
   * @param move {@linkcode Move} that is used
   * @param args N/A
   * @returns True if an item was removed
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!this.berriesOnly && target.isPlayer()) { // "Wild Pokemon cannot knock off Player Pokemon's held items" (See Bulbapedia)
      return false;
    }

    const cancelled = new BooleanHolder(false);
    applyAbAttrs(BlockItemTheftAbAttr, target, cancelled); // Check for abilities that block item theft

    if (cancelled.value === true) {
      return false;
    }

    // Considers entire transferrable item pool by default (Knock Off). Otherwise berries only if specified (Incinerate).
    let heldItems = this.getTargetHeldItems(target).filter(i => i.isTransferable);

    if (this.berriesOnly) {
      heldItems = heldItems.filter(m => m instanceof BerryModifier && m.pokemonId === target.id, target.isPlayer());
    }

    if (heldItems.length) {
      const removedItem = heldItems[user.randSeedInt(heldItems.length)];

      // Decrease item amount and update icon
      target.loseHeldItem(removedItem);
      globalScene.updateModifiers(target.isPlayer());


      if (this.berriesOnly) {
        globalScene.queueMessage(i18next.t("moveTriggers:incineratedItem", { pokemonName: getPokemonNameWithAffix(user), targetName: getPokemonNameWithAffix(target), itemName: removedItem.type.name }));
      } else {
        globalScene.queueMessage(i18next.t("moveTriggers:knockedOffItem", { pokemonName: getPokemonNameWithAffix(user), targetName: getPokemonNameWithAffix(target), itemName: removedItem.type.name }));
      }
    }

    return true;
  }

  getTargetHeldItems(target: Pokemon): PokemonHeldItemModifier[] {
    return globalScene.findModifiers(m => m instanceof PokemonHeldItemModifier
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
  constructor(selfTarget: boolean) {
    super(selfTarget);
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

    const pokemon = this.selfTarget ? user : target;

    const heldBerries = this.getTargetHeldBerries(pokemon);
    if (heldBerries.length <= 0) {
      return false;
    }
    this.chosenBerry = heldBerries[user.randSeedInt(heldBerries.length)];
    const preserve = new BooleanHolder(false);
    // check for berry pouch preservation
    globalScene.applyModifiers(PreserveBerryModifier, pokemon.isPlayer(), pokemon, preserve);
    if (!preserve.value) {
      this.reduceBerryModifier(pokemon);
    }
    this.eatBerry(pokemon);
    return true;
  }

  getTargetHeldBerries(target: Pokemon): BerryModifier[] {
    return globalScene.findModifiers(m => m instanceof BerryModifier
      && (m as BerryModifier).pokemonId === target.id, target.isPlayer()) as BerryModifier[];
  }

  reduceBerryModifier(target: Pokemon) {
    if (this.chosenBerry) {
      target.loseHeldItem(this.chosenBerry);
    }
    globalScene.updateModifiers(target.isPlayer());
  }

  eatBerry(consumer: Pokemon, berryOwner?: Pokemon) {
    getBerryEffectFunc(this.chosenBerry!.berryType)(consumer, berryOwner); // consumer eats the berry
    applyAbAttrs(HealFromBerryUseAbAttr, consumer, new BooleanHolder(false));
  }
}

/**
 *  Attribute used for moves that steal a random berry from the target. The user then eats the stolen berry.
 *  Used for Pluck & Bug Bite.
 */
export class StealEatBerryAttr extends EatBerryAttr {
  constructor() {
    super(false);
  }
  /**
   * User steals a random berry from the target and then eats it.
   * @param user - Pokemon that used the move and will eat the stolen berry
   * @param target - Pokemon that will have its berry stolen
   * @param move - Move being used
   * @param args Unused
   * @returns  true if the function succeeds
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const cancelled = new BooleanHolder(false);
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
    applyPostItemLostAbAttrs(PostItemLostAbAttr, target, false);
    const message = i18next.t("battle:stealEatBerry", { pokemonName: user.name, targetName: target.name, berryName: this.chosenBerry.type.name });
    globalScene.queueMessage(message);
    this.reduceBerryModifier(target);
    this.eatBerry(user, target);
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
   * @param effects - status effect or list of status effects to cure
   */
  constructor(selfTarget: boolean, effects: StatusEffect | StatusEffect[]) {
    super(selfTarget, { lastHitOnly: true });
    this.effects = [ effects ].flat(1);
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
      globalScene.queueMessage(getStatusEffectHealText(pokemon.status.effect, getPokemonNameWithAffix(pokemon)));
      pokemon.resetStatus();
      pokemon.updateInfo();

      return true;
    }

    return false;
  }

  isOfEffect(effect: StatusEffect): boolean {
    return this.effects.includes(effect);
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
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

  /**
   * Returns arbitrarily high score when Pokemon is asleep, otherwise shouldn't be used
   * @param user
   * @param target
   * @param move
   */
  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    return user.status && user.status.effect === StatusEffect.SLEEP ? 200 : -10;
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
   * @param args [0] {@linkcode BooleanHolder} for burnDamageReductionCancelled
   * @returns true if the function succeeds
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    (args[0] as BooleanHolder).value = true;

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
    return globalScene.arena.trySetWeather(this.weatherType, user);
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => !globalScene.arena.weather || (globalScene.arena.weather.weatherType !== this.weatherType && !globalScene.arena.weather.isImmutable());
  }
}

export class ClearWeatherAttr extends MoveEffectAttr {
  private weatherType: WeatherType;

  constructor(weatherType: WeatherType) {
    super();

    this.weatherType = weatherType;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (globalScene.arena.weather?.weatherType === this.weatherType) {
      return globalScene.arena.trySetWeather(WeatherType.NONE, user);
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
    return globalScene.arena.trySetTerrain(this.terrainType, true, user);
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => !globalScene.arena.terrain || (globalScene.arena.terrain.terrainType !== this.terrainType);
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    // TODO: Expand on this
    return globalScene.arena.terrain ? 0 : 6;
  }
}

export class ClearTerrainAttr extends MoveEffectAttr {
  constructor() {
    super();
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    return globalScene.arena.trySetTerrain(TerrainType.NONE, true, user);
  }
}

export class OneHitKOAttr extends MoveAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (target.isBossImmune()) {
      return false;
    }

    (args[0] as BooleanHolder).value = true;

    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => {
      const cancelled = new BooleanHolder(false);
      applyAbAttrs(BlockOneHitKOAbAttr, target, cancelled);
      return !cancelled.value && user.level >= target.level;
    };
  }
}

/**
 * Attribute that allows charge moves to resolve in 1 turn under a given condition.
 * Should only be used for {@linkcode ChargingMove | ChargingMoves} as a `chargeAttr`.
 * @extends MoveAttr
 */
export class InstantChargeAttr extends MoveAttr {
  /** The condition in which the move with this attribute instantly charges */
  protected readonly condition: UserMoveConditionFunc;

  constructor(condition: UserMoveConditionFunc) {
    super(true);
    this.condition = condition;
  }

  /**
   * Flags the move with this attribute as instantly charged if this attribute's condition is met.
   * @param user the {@linkcode Pokemon} using the move
   * @param target n/a
   * @param move the {@linkcode Move} associated with this attribute
   * @param args
   *  - `[0]` a {@linkcode BooleanHolder | BooleanHolder} for the "instant charge" flag
   * @returns `true` if the instant charge condition is met; `false` otherwise.
   */
  override apply(user: Pokemon, target: Pokemon | null, move: Move, args: any[]): boolean {
    const instantCharge = args[0];
    if (!(instantCharge instanceof BooleanHolder)) {
      return false;
    }

    if (this.condition(user, move)) {
      instantCharge.value = true;
      return true;
    }
    return false;
  }
}

/**
 * Attribute that allows charge moves to resolve in 1 turn while specific {@linkcode WeatherType | Weather}
 * is active. Should only be used for {@linkcode ChargingMove | ChargingMoves} as a `chargeAttr`.
 * @extends InstantChargeAttr
 */
export class WeatherInstantChargeAttr extends InstantChargeAttr {
  constructor(weatherTypes: WeatherType[]) {
    super((user, move) => {
      const currentWeather = globalScene.arena.weather;

      if (isNullOrUndefined(currentWeather?.weatherType)) {
        return false;
      } else {
        return !currentWeather?.isEffectSuppressed()
          && weatherTypes.includes(currentWeather?.weatherType);
      }
    });
  }
}

export class OverrideMoveEffectAttr extends MoveAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    return true;
  }
}

/**
 * Attack Move that doesn't hit the turn it is played and doesn't allow for multiple
 * uses on the same target. Examples are Future Sight or Doom Desire.
 * @extends OverrideMoveEffectAttr
 * @param tagType The {@linkcode ArenaTagType} that will be placed on the field when the move is used
 * @param chargeAnim The {@linkcode ChargeAnim | Charging Animation} used for the move
 * @param chargeText The text to display when the move is used
 */
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

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    // Edge case for the move applied on a pokemon that has fainted
    if (!target) {
      return true;
    }

    const overridden = args[0] as BooleanHolder;
    const virtual = args[1] as boolean;

    if (!virtual) {
      overridden.value = true;
      globalScene.unshiftPhase(new MoveAnimPhase(new MoveChargeAnim(this.chargeAnim, move.id, user)));
      globalScene.queueMessage(this.chargeText.replace("{TARGET}", getPokemonNameWithAffix(target)).replace("{USER}", getPokemonNameWithAffix(user)));
      user.pushMoveHistory({ move: move.id, targets: [ target.getBattlerIndex() ], result: MoveResult.OTHER });
      const side = target.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY;
      globalScene.arena.addTag(this.tagType, 3, move.id, user.id, side, false, target.getBattlerIndex());
    } else {
      globalScene.queueMessage(i18next.t("moveTriggers:tookMoveAttack", { pokemonName: getPokemonNameWithAffix(globalScene.getPokemonById(target.id) ?? undefined), moveName: move.name }));
    }

    return true;
  }
}

/**
 * Attribute that cancels the associated move's effects when set to be combined with the user's ally's
 * subsequent move this turn. Used for Grass Pledge, Water Pledge, and Fire Pledge.
 * @extends OverrideMoveEffectAttr
 */
export class AwaitCombinedPledgeAttr extends OverrideMoveEffectAttr {
  constructor() {
    super(true);
  }
  /**
   * If the user's ally is set to use a different move with this attribute,
   * defer this move's effects for a combined move on the ally's turn.
   * @param user the {@linkcode Pokemon} using this move
   * @param target n/a
   * @param move the {@linkcode Move} being used
   * @param args
   * - [0] a {@linkcode BooleanHolder} indicating whether the move's base
   * effects should be overridden this turn.
   * @returns `true` if base move effects were overridden; `false` otherwise
   */
  override apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (user.turnData.combiningPledge) {
      // "The two moves have become one!\nIt's a combined move!"
      globalScene.queueMessage(i18next.t("moveTriggers:combiningPledge"));
      return false;
    }

    const overridden = args[0] as BooleanHolder;

    const allyMovePhase = globalScene.findPhase<MovePhase>((phase) => phase instanceof MovePhase && phase.pokemon.isPlayer() === user.isPlayer());
    if (allyMovePhase) {
      const allyMove = allyMovePhase.move.getMove();
      if (allyMove !== move && allyMove.hasAttr(AwaitCombinedPledgeAttr)) {
        [ user, allyMovePhase.pokemon ].forEach((p) => p.turnData.combiningPledge = move.id);

        // "{userPokemonName} is waiting for {allyPokemonName}'s move..."
        globalScene.queueMessage(i18next.t("moveTriggers:awaitingPledge", {
          userPokemonName: getPokemonNameWithAffix(user),
          allyPokemonName: getPokemonNameWithAffix(allyMovePhase.pokemon)
        }));

        // Move the ally's MovePhase (if needed) so that the ally moves next
        const allyMovePhaseIndex = globalScene.phaseQueue.indexOf(allyMovePhase);
        const firstMovePhaseIndex = globalScene.phaseQueue.findIndex((phase) => phase instanceof MovePhase);
        if (allyMovePhaseIndex !== firstMovePhaseIndex) {
          globalScene.prependToPhase(globalScene.phaseQueue.splice(allyMovePhaseIndex, 1)[0], MovePhase);
        }

        overridden.value = true;
        return true;
      }
    }
    return false;
  }
}

/**
 * Set of optional parameters that may be applied to stat stage changing effects
 * @extends MoveEffectAttrOptions
 * @see {@linkcode StatStageChangeAttr}
 */
interface StatStageChangeAttrOptions extends MoveEffectAttrOptions {
  /** If defined, needs to be met in order for the stat change to apply */
  condition?: MoveConditionFunc,
  /** `true` to display a message */
  showMessage?: boolean
}

/**
 * Attribute used for moves that change stat stages
 *
 * @param stats {@linkcode BattleStat} Array of stat(s) to change
 * @param stages How many stages to change the stat(s) by, [-6, 6]
 * @param selfTarget `true` if the move is self-targetting
 * @param options {@linkcode StatStageChangeAttrOptions} Container for any optional parameters for this attribute.
 *
 * @extends MoveEffectAttr
 * @see {@linkcode apply}
 */
export class StatStageChangeAttr extends MoveEffectAttr {
  public stats: BattleStat[];
  public stages: number;
  /**
   * Container for optional parameters to this attribute.
   * @see {@linkcode StatStageChangeAttrOptions} for available optional params
   */
  protected override options?: StatStageChangeAttrOptions;

  constructor(stats: BattleStat[], stages: number, selfTarget?: boolean, options?: StatStageChangeAttrOptions) {
    super(selfTarget, options);
    this.stats = stats;
    this.stages = stages;
    this.options = options;
  }

  /**
   * The condition required for the stat stage change to apply.
   * Defaults to `null` (i.e. no condition required).
   */
  private get condition () {
    return this.options?.condition ?? null;
  }

  /**
   * `true` to display a message for the stat change.
   * @default true
   */
  private get showMessage () {
    return this.options?.showMessage ?? true;
  }
  
  /**
   * Attempts to change stats of the user or target (depending on value of selfTarget) if conditions are met
   * @param user {@linkcode Pokemon} the user of the move
   * @param target {@linkcode Pokemon} the target of the move
   * @param move {@linkcode Move} the move
   * @param args unused
   * @returns whether stat stages were changed
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args?: any[]): boolean {
    if (!super.apply(user, target, move, args) || (this.condition && !this.condition(user, target, move))) {
      return false;
    }

    const moveChance = this.getMoveChance(user, target, move, this.selfTarget, true);
    if (moveChance < 0 || moveChance === 100 || user.randSeedInt(100) < moveChance) {
      const stages = this.getLevels(user);
      globalScene.unshiftPhase(new StatStageChangePhase((this.selfTarget ? user : target).getBattlerIndex(), this.selfTarget, this.stats, stages, this.showMessage));
      return true;
    }

    return false;
  }

  getLevels(_user: Pokemon): number {
    return this.stages;
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
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

/**
 * Attribute used to determine the Biome/Terrain-based secondary effect of Secret Power
 */
export class SecretPowerAttr extends MoveEffectAttr {
  constructor() {
    super(false);
  }

  /**
   * Used to apply the secondary effect to the target Pokemon
   * @returns `true` if a secondary effect is successfully applied
   */
  override apply(user: Pokemon, target: Pokemon, move: Move, args?: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }
    let secondaryEffect: MoveEffectAttr;
    const terrain = globalScene.arena.getTerrainType();
    if (terrain !== TerrainType.NONE) {
      secondaryEffect = this.determineTerrainEffect(terrain);
    } else {
      const biome = globalScene.arena.biomeType;
      secondaryEffect = this.determineBiomeEffect(biome);
    }
    return secondaryEffect.apply(user, target, move, []);
  }

  /**
   * Determines the secondary effect based on terrain.
   * Takes precedence over biome-based effects.
   * ```
   * Electric Terrain | Paralysis
   * Misty Terrain    | SpAtk -1
   * Grassy Terrain   | Sleep
   * Psychic Terrain  | Speed -1
   * ```
   * @param terrain - {@linkcode TerrainType} The current terrain
   * @returns the chosen secondary effect {@linkcode MoveEffectAttr}
   */
  private determineTerrainEffect(terrain: TerrainType): MoveEffectAttr {
    let secondaryEffect: MoveEffectAttr;
    switch (terrain) {
      case TerrainType.ELECTRIC:
      default:
        secondaryEffect = new StatusEffectAttr(StatusEffect.PARALYSIS, false);
        break;
      case TerrainType.MISTY:
        secondaryEffect = new StatStageChangeAttr([ Stat.SPATK ], -1, false);
        break;
      case TerrainType.GRASSY:
        secondaryEffect = new StatusEffectAttr(StatusEffect.SLEEP, false);
        break;
      case TerrainType.PSYCHIC:
        secondaryEffect = new StatStageChangeAttr([ Stat.SPD ], -1, false);
        break;
    }
    return secondaryEffect;
  }

  /**
   * Determines the secondary effect based on biome
   * ```
   * Town, Metropolis, Slum, Dojo, Laboratory, Power Plant + Default | Paralysis
   * Plains, Grass, Tall Grass, Forest, Jungle, Meadow               | Sleep
   * Swamp, Mountain, Temple, Ruins                                  | Speed -1
   * Ice Cave, Snowy Forest                                          | Freeze
   * Volcano                                                         | Burn
   * Fairy Cave                                                      | SpAtk -1
   * Desert, Construction Site, Beach, Island, Badlands              | Accuracy -1
   * Sea, Lake, Seabed                                               | Atk -1
   * Cave, Wasteland, Graveyard, Abyss, Space                        | Flinch
   * End                                                             | Def -1
   * ```
   * @param biome - The current {@linkcode Biome} the battle is set in
   * @returns the chosen secondary effect {@linkcode MoveEffectAttr}
   */
  private determineBiomeEffect(biome: Biome): MoveEffectAttr {
    let secondaryEffect: MoveEffectAttr;
    switch (biome) {
      case Biome.PLAINS:
      case Biome.GRASS:
      case Biome.TALL_GRASS:
      case Biome.FOREST:
      case Biome.JUNGLE:
      case Biome.MEADOW:
        secondaryEffect = new StatusEffectAttr(StatusEffect.SLEEP, false);
        break;
      case Biome.SWAMP:
      case Biome.MOUNTAIN:
      case Biome.TEMPLE:
      case Biome.RUINS:
        secondaryEffect = new StatStageChangeAttr([ Stat.SPD ], -1, false);
        break;
      case Biome.ICE_CAVE:
      case Biome.SNOWY_FOREST:
        secondaryEffect = new StatusEffectAttr(StatusEffect.FREEZE, false);
        break;
      case Biome.VOLCANO:
        secondaryEffect = new StatusEffectAttr(StatusEffect.BURN, false);
        break;
      case Biome.FAIRY_CAVE:
        secondaryEffect = new StatStageChangeAttr([ Stat.SPATK ], -1, false);
        break;
      case Biome.DESERT:
      case Biome.CONSTRUCTION_SITE:
      case Biome.BEACH:
      case Biome.ISLAND:
      case Biome.BADLANDS:
        secondaryEffect = new StatStageChangeAttr([ Stat.ACC ], -1, false);
        break;
      case Biome.SEA:
      case Biome.LAKE:
      case Biome.SEABED:
        secondaryEffect = new StatStageChangeAttr([ Stat.ATK ], -1, false);
        break;
      case Biome.CAVE:
      case Biome.WASTELAND:
      case Biome.GRAVEYARD:
      case Biome.ABYSS:
      case Biome.SPACE:
        secondaryEffect = new AddBattlerTagAttr(BattlerTagType.FLINCHED, false, true);
        break;
      case Biome.END:
        secondaryEffect = new StatStageChangeAttr([ Stat.DEF ], -1, false);
        break;
      case Biome.TOWN:
      case Biome.METROPOLIS:
      case Biome.SLUM:
      case Biome.DOJO:
      case Biome.FACTORY:
      case Biome.LABORATORY:
      case Biome.POWER_PLANT:
      default:
        secondaryEffect = new StatusEffectAttr(StatusEffect.PARALYSIS, false);
        break;
    }
    return secondaryEffect;
  }
}

export class PostVictoryStatStageChangeAttr extends MoveAttr {
  private stats: BattleStat[];
  private stages: number;
  private condition?: MoveConditionFunc;
  private showMessage: boolean;

  constructor(stats: BattleStat[], stages: number, selfTarget?: boolean, condition?: MoveConditionFunc, showMessage: boolean = true, firstHitOnly: boolean = false) {
    super();
    this.stats = stats;
    this.stages = stages;
    this.condition = condition;
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

  override apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const randStats = BATTLE_STATS.filter((s) => target.getStatStage(s) < 6);
    if (randStats.length > 0) {
      const boostStat = [ randStats[user.randSeedInt(randStats.length)] ];
      globalScene.unshiftPhase(new StatStageChangePhase(target.getBattlerIndex(), this.selfTarget, boostStat, 2));
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
    if (!globalScene.arena.weather?.isEffectSuppressed()) {
      const weatherType = globalScene.arena.weather?.weatherType;
      if (weatherType === WeatherType.SUNNY || weatherType === WeatherType.HARSH_SUN) {
        return this.stages + 1;
      }
    }
    return this.stages;
  }
}

export class CutHpStatStageBoostAttr extends StatStageChangeAttr {
  private cutRatio: number;
  private messageCallback: ((user: Pokemon) => void) | undefined;

  constructor(stat: BattleStat[], levels: number, cutRatio: number, messageCallback?: ((user: Pokemon) => void) | undefined) {
    super(stat, levels, true);

    this.cutRatio = cutRatio;
    this.messageCallback = messageCallback;
  }
  override apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    user.damageAndUpdate(toDmgValue(user.getMaxHp() / this.cutRatio), { result: HitResult.INDIRECT });
    user.updateInfo();
    const ret = super.apply(user, target, move, args);
    if (this.messageCallback) {
      this.messageCallback(user);
    }
    return ret;
  }

  getCondition(): MoveConditionFunc {
    return (user, _target, _move) => user.getHpRatio() > 1 / this.cutRatio && this.stats.some(s => user.getStatStage(s) < 6);
  }
}

/**
 * Attribute implementing the stat boosting effect of {@link https://bulbapedia.bulbagarden.net/wiki/Order_Up_(move) | Order Up}.
 * If the user has a Pokemon with {@link https://bulbapedia.bulbagarden.net/wiki/Commander_(Ability) | Commander} in their mouth,
 * one of the user's stats are increased by 1 stage, depending on the "commanding" Pokemon's form.
 */
export class OrderUpStatBoostAttr extends MoveEffectAttr {
  constructor() {
    super(true);
  }

  override apply(user: Pokemon, target: Pokemon, move: Move, args?: any[]): boolean {
    const commandedTag = user.getTag(CommandedTag);
    if (!commandedTag) {
      return false;
    }

    let increasedStat: EffectiveStat = Stat.ATK;
    switch (commandedTag.tatsugiriFormKey) {
      case "curly":
        increasedStat = Stat.ATK;
        break;
      case "droopy":
        increasedStat = Stat.DEF;
        break;
      case "stretchy":
        increasedStat = Stat.SPD;
        break;
    }

    globalScene.unshiftPhase(new StatStageChangePhase(user.getBattlerIndex(), this.selfTarget, [ increasedStat ], 1));
    return true;
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
    globalScene.queueMessage(i18next.t("moveTriggers:copiedStatChanges", { pokemonName: getPokemonNameWithAffix(user), targetName: getPokemonNameWithAffix(target) }));

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

    globalScene.queueMessage(i18next.t("moveTriggers:invertStats", { pokemonName: getPokemonNameWithAffix(target) }));

    return true;
  }
}

export class ResetStatsAttr extends MoveEffectAttr {
  private targetAllPokemon: boolean;
  constructor(targetAllPokemon: boolean) {
    super();
    this.targetAllPokemon = targetAllPokemon;
  }

  override apply(_user: Pokemon, target: Pokemon, _move: Move, _args: any[]): boolean {
    if (this.targetAllPokemon) {
      // Target all pokemon on the field when Freezy Frost or Haze are used
      const activePokemon = globalScene.getField(true);
      activePokemon.forEach((p) => this.resetStats(p));
      globalScene.queueMessage(i18next.t("moveTriggers:statEliminated"));
    } else { // Affects only the single target when Clear Smog is used
      this.resetStats(target);
      globalScene.queueMessage(i18next.t("moveTriggers:resetStats", { pokemonName: getPokemonNameWithAffix(target) }));
    }
    return true;
  }

  private resetStats(pokemon: Pokemon): void {
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
      for (const s of this.stats) {
        const temp = user.getStatStage(s);
        user.setStatStage(s, target.getStatStage(s));
        target.setStatStage(s, temp);
      }

      target.updateInfo();
      user.updateInfo();

      if (this.stats.length === 7) {
        globalScene.queueMessage(i18next.t("moveTriggers:switchedStatChanges", { pokemonName: getPokemonNameWithAffix(user) }));
      } else if (this.stats.length === 2) {
        globalScene.queueMessage(i18next.t("moveTriggers:switchedTwoStatChanges", {
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
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const hpValue = Math.floor((target.hp + user.hp) / 2);
    [ user, target ].forEach((p) => {
      if (p.hp < hpValue) {
        const healing = p.heal(hpValue - p.hp);
        if (healing) {
          globalScene.damageNumberHandler.add(p, healing, HitResult.HEAL);
        }
      } else if (p.hp > hpValue) {
        const damage = p.damage(p.hp - hpValue, true);
        if (damage) {
          globalScene.damageNumberHandler.add(p, damage);
        }
      }
      p.updateInfo();
    });

    return true;
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
   * @param args [0] {@linkcode NumberHolder} of power
   * @returns true if the function succeeds
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const ppMax = move.pp;
    const ppUsed = user.moveset.find((m) => m.moveId === move.id)?.ppUsed ?? 0;

    let ppRemains = ppMax - ppUsed;
    /** Reduce to 0 to avoid negative numbers if user has 1PP before attack and target has Ability.PRESSURE */
    if (ppRemains < 0) {
      ppRemains = 0;
    }

    const power = args[0] as NumberHolder;

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
    const power = args[0] as NumberHolder;
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
  const party = user.isPlayer() ? globalScene.getPlayerParty() : globalScene.getEnemyParty();

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
    const power = args[0] as NumberHolder;

    const party = user.isPlayer() ? globalScene.getPlayerParty() : globalScene.getEnemyParty();
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
  globalScene.executeWithSeedOffset(() => {
    const rand = randSeedInt(100);
    if (rand < move.chance) {
      message = i18next.t("moveTriggers:goingAllOutForAttack", { pokemonName: getPokemonNameWithAffix(user) });
    }
  }, globalScene.currentBattle.turn << 6, globalScene.waveSeed);
  return message;
};

export class DoublePowerChanceAttr extends VariablePowerAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    let rand: number;
    globalScene.executeWithSeedOffset(() => rand = randSeedInt(100), globalScene.currentBattle.turn << 6, globalScene.waveSeed);
    if (rand! < move.chance) {
      const power = args[0] as NumberHolder;
      power.value *= 2;
      return true;
    }

    return false;
  }
}

export abstract class ConsecutiveUsePowerMultiplierAttr extends MovePowerMultiplierAttr {
  constructor(limit: number, resetOnFail: boolean, resetOnLimit?: boolean, ...comboMoves: Moves[]) {
    super((user: Pokemon, target: Pokemon, move: Move): number => {
      const moveHistory = user.getLastXMoves(limit + 1).slice(1);

      let count = 0;
      let turnMove: TurnMove | undefined;

      while (
        (
          (turnMove = moveHistory.shift())?.move === move.id
          || (comboMoves.length && comboMoves.includes(turnMove?.move ?? Moves.NONE))
        )
        && (!resetOnFail || turnMove?.result === MoveResult.SUCCESS)
      ) {
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

  abstract getMultiplier(count: number): number;
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
    const power = args[0] as NumberHolder;

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
    const power = args[0] as NumberHolder;

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
    const power = args[0] as NumberHolder;
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
    const power = args[0] as NumberHolder;
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
    const power = args[0] as NumberHolder;
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
    (args[0] as NumberHolder).value = toDmgValue(150 * user.getHpRatio());

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
    (args[0] as NumberHolder).value = toDmgValue(this.maxBasePower * target.getHpRatio());

    return true;
  }
}

export class FirstAttackDoublePowerAttr extends VariablePowerAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    console.log(target.getLastXMoves(1), globalScene.currentBattle.turn);
    if (!target.getLastXMoves(1).find(m => m.turn === globalScene.currentBattle.turn)) {
      (args[0] as NumberHolder).value *= 2;
      return true;
    }

    return false;
  }
}


export class TurnDamagedDoublePowerAttr extends VariablePowerAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (user.turnData.attacksReceived.find(r => r.damage && r.sourceId === target.id)) {
      (args[0] as NumberHolder).value *= 2;
      return true;
    }

    return false;
  }
}

const magnitudeMessageFunc = (user: Pokemon, target: Pokemon, move: Move) => {
  let message: string;
  globalScene.executeWithSeedOffset(() => {
    const magnitudeThresholds = [ 5, 15, 35, 65, 75, 95 ];

    const rand = randSeedInt(100);

    let m = 0;
    for (; m < magnitudeThresholds.length; m++) {
      if (rand < magnitudeThresholds[m]) {
        break;
      }
    }

    message = i18next.t("moveTriggers:magnitudeMessage", { magnitude: m + 4 });
  }, globalScene.currentBattle.turn << 6, globalScene.waveSeed);
  return message!;
};

export class MagnitudePowerAttr extends VariablePowerAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const power = args[0] as NumberHolder;

    const magnitudeThresholds = [ 5, 15, 35, 65, 75, 95 ];
    const magnitudePowers = [ 10, 30, 50, 70, 90, 100, 110, 150 ];

    let rand: number;

    globalScene.executeWithSeedOffset(() => rand = randSeedInt(100), globalScene.currentBattle.turn << 6, globalScene.waveSeed);

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
    if (!globalScene.arena.weather?.isEffectSuppressed()) {
      const power = args[0] as NumberHolder;
      const weatherType = globalScene.arena.weather?.weatherType || WeatherType.NONE;
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
    const power = args[0] as NumberHolder;

    const friendshipPower = Math.floor(Math.min(user instanceof PlayerPokemon ? user.friendship : user.species.baseFriendship, 255) / 2.5);
    power.value = Math.max(!this.invert ? friendshipPower : 102 - friendshipPower, 1);

    return true;
  }
}

/**
 * This Attribute calculates the current power of {@linkcode Moves.RAGE_FIST}.
 * The counter for power calculation does not reset on every wave but on every new arena encounter
 */
export class RageFistPowerAttr extends VariablePowerAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const { hitCount, prevHitCount } = user.battleData;
    const basePower: NumberHolder = args[0];

    this.updateHitReceivedCount(user, hitCount, prevHitCount);

    basePower.value = 50 + (Math.min(user.customPokemonData.hitsRecCount, 6) * 50);

    return true;
  }

  /**
   * Updates the number of hits the Pokemon has taken in battle
   * @param user Pokemon calling Rage Fist
   * @param hitCount The number of received hits this battle
   * @param previousHitCount The number of received hits this battle since last time Rage Fist was used
   */
  protected updateHitReceivedCount(user: Pokemon, hitCount: number, previousHitCount: number): void {
    user.customPokemonData.hitsRecCount += (hitCount - previousHitCount);
    user.battleData.prevHitCount = hitCount;
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

    (args[0] as NumberHolder).value += positiveStatStages * 20;
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
    (args[0] as NumberHolder).value = Math.min(
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

    const powerSeed = randSeedInt(firstHit ? 100 : 80);
    if (powerSeed <= 40) {
      (args[0] as NumberHolder).value = 40;
    } else if (40 < powerSeed && powerSeed <= 70) {
      (args[0] as NumberHolder).value = 80;
    } else if (70 < powerSeed && powerSeed <= 80) {
      (args[0] as NumberHolder).value = 120;
    } else if (80 < powerSeed && powerSeed <= 100) {
      // If this move is multi-hit, disable all other hits
      user.turnData.hitCount = 1;
      user.turnData.hitsLeft = 1;
      globalScene.unshiftPhase(new PokemonHealPhase(target.getBattlerIndex(),
        toDmgValue(target.getMaxHp() / 4), i18next.t("moveTriggers:regainedHealth", { pokemonName: getPokemonNameWithAffix(target) }), true));
    }

    return true;
  }
}

export class WaterShurikenPowerAttr extends VariablePowerAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (user.species.speciesId === Species.GRENINJA && user.hasAbility(Abilities.BATTLE_BOND) && user.formIndex === 2) {
      (args[0] as NumberHolder).value = 20;
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

    if (stockpilingTag && stockpilingTag.stockpiledCount > 0) {
      const power = args[0] as NumberHolder;
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

    if (stockpilingTag && stockpilingTag.stockpiledCount > 0) {
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
  private maxHits: number;

  constructor(maxHits: number) {
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
   * @param args [0] {@linkcode NumberHolder} for final calculated power of move
   * @returns true if attribute application succeeds
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const hitsTotal = user.turnData.hitCount - Math.max(user.turnData.hitsLeft, 0);
    const power = args[0] as NumberHolder;

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
   * @param args [0] {@linkcode NumberHolder} that holds the resulting power of the move
   * @returns true if attribute application succeeds, false otherwise
   */
  apply(user: Pokemon, _target: Pokemon, _move: Move, args: any[]): boolean {
    const power = args[0] as NumberHolder;
    const enemy = user.getOpponent(0);
    const pokemonActed: Pokemon[] = [];

    if (enemy?.turnData.acted) {
      pokemonActed.push(enemy);
    }

    if (globalScene.currentBattle.double) {
      const userAlly = user.getAlly();
      const enemyAlly = enemy?.getAlly();

      if (!isNullOrUndefined(userAlly) && userAlly.turnData.acted) {
        pokemonActed.push(userAlly);
      }
      if (!isNullOrUndefined(enemyAlly) && enemyAlly.turnData.acted) {
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

/**
 * Changes a Pledge move's power to 150 when combined with another unique Pledge
 * move from an ally.
 */
export class CombinedPledgePowerAttr extends VariablePowerAttr {
  override apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const power = args[0];
    if (!(power instanceof NumberHolder)) {
      return false;
    }
    const combinedPledgeMove = user.turnData.combiningPledge;

    if (combinedPledgeMove && combinedPledgeMove !== move.id) {
      power.value *= 150 / 80;
      return true;
    }
    return false;
  }
}

/**
 * Applies STAB to the given Pledge move if the move is part of a combined attack.
 */
export class CombinedPledgeStabBoostAttr extends MoveAttr {
  override apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const stabMultiplier = args[0];
    if (!(stabMultiplier instanceof NumberHolder)) {
      return false;
    }
    const combinedPledgeMove = user.turnData.combiningPledge;

    if (combinedPledgeMove && combinedPledgeMove !== move.id) {
      stabMultiplier.value = 1.5;
      return true;
    }
    return false;
  }
}

/**
 * Variable Power attribute for {@link https://bulbapedia.bulbagarden.net/wiki/Round_(move) | Round}.
 * Doubles power if another Pokemon has previously selected Round this turn.
 * @extends VariablePowerAttr
 */
export class RoundPowerAttr extends VariablePowerAttr {
  override apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const power = args[0];
    if (!(power instanceof NumberHolder)) {
      return false;
    }

    if (user.turnData?.joinedRound) {
      power.value *= 2;
      return true;
    }
    return false;
  }
}

/**
 * Attribute for the "combo" effect of {@link https://bulbapedia.bulbagarden.net/wiki/Round_(move) | Round}.
 * Preempts the next move in the turn order with the first instance of any Pokemon
 * using Round. Also marks the Pokemon using the cued Round to double the move's power.
 * @extends MoveEffectAttr
 * @see {@linkcode RoundPowerAttr}
 */
export class CueNextRoundAttr extends MoveEffectAttr {
  constructor() {
    super(true, { lastHitOnly: true });
  }

  override apply(user: Pokemon, target: Pokemon, move: Move, args?: any[]): boolean {
    const nextRoundPhase = globalScene.findPhase<MovePhase>(phase =>
      phase instanceof MovePhase && phase.move.moveId === Moves.ROUND
    );

    if (!nextRoundPhase) {
      return false;
    }

    // Update the phase queue so that the next Pokemon using Round moves next
    const nextRoundIndex = globalScene.phaseQueue.indexOf(nextRoundPhase);
    const nextMoveIndex = globalScene.phaseQueue.findIndex(phase => phase instanceof MovePhase);
    if (nextRoundIndex !== nextMoveIndex) {
      globalScene.prependToPhase(globalScene.phaseQueue.splice(nextRoundIndex, 1)[0], MovePhase);
    }

    // Mark the corresponding Pokemon as having "joined the Round" (for doubling power later)
    nextRoundPhase.pokemon.turnData.joinedRound = true;
    return true;
  }
}

/**
 * Attribute that changes stat stages before the damage is calculated
 */
export class StatChangeBeforeDmgCalcAttr extends MoveAttr {
  /**
   * Applies Stat Changes before damage is calculated
   *
   * @param user {@linkcode Pokemon} that called {@linkcode move}
   * @param target {@linkcode Pokemon} that is the target of {@linkcode move}
   * @param move {@linkcode Move} called by {@linkcode user}
   * @param args N/A
   *
   * @returns true if stat stages where correctly applied
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    return false;
  }
}

/**
 * Steals the postitive Stat stages of the target before damage calculation so stat changes
 * apply to damage calculation (e.g. {@linkcode Moves.SPECTRAL_THIEF})
 * {@link https://bulbapedia.bulbagarden.net/wiki/Spectral_Thief_(move) | Spectral Thief}
 */
export class SpectralThiefAttr extends StatChangeBeforeDmgCalcAttr {
  /**
   * steals max amount of positive stats of the target while not exceeding the limit of max 6 stat stages
   *
   * @param user {@linkcode Pokemon} that called {@linkcode move}
   * @param target {@linkcode Pokemon} that is the target of {@linkcode move}
   * @param move {@linkcode Move} called by {@linkcode user}
   * @param args N/A
   *
   * @returns true if stat stages where correctly stolen
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    /**
     * Copy all positive stat stages to user and reduce copied stat stages on target.
     */
    for (const s of BATTLE_STATS) {
      const statStageValueTarget = target.getStatStage(s);
      const statStageValueUser = user.getStatStage(s);

      if (statStageValueTarget > 0) {
        /**
         * Only value of up to 6 can be stolen (stat stages don't exceed 6)
         */
        const availableToSteal = Math.min(statStageValueTarget, 6 - statStageValueUser);

        globalScene.unshiftPhase(new StatStageChangePhase(user.getBattlerIndex(), this.selfTarget, [ s ], availableToSteal));
        target.setStatStage(s, statStageValueTarget - availableToSteal);
      }
    }

    target.updateInfo();
    user.updateInfo();
    globalScene.queueMessage(i18next.t("moveTriggers:stealPositiveStats", { pokemonName: getPokemonNameWithAffix(user), targetName: getPokemonNameWithAffix(target) }));

    return true;
  }

}

export class VariableAtkAttr extends MoveAttr {
  constructor() {
    super();
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    //const atk = args[0] as Utils.NumberHolder;
    return false;
  }
}

export class TargetAtkUserAtkAttr extends VariableAtkAttr {
  constructor() {
    super();
  }
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    (args[0] as NumberHolder).value = target.getEffectiveStat(Stat.ATK, target);
    return true;
  }
}

export class DefAtkAttr extends VariableAtkAttr {
  constructor() {
    super();
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    (args[0] as NumberHolder).value = user.getEffectiveStat(Stat.DEF, target);
    return true;
  }
}

export class VariableDefAttr extends MoveAttr {
  constructor() {
    super();
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    //const def = args[0] as Utils.NumberHolder;
    return false;
  }
}

export class DefDefAttr extends VariableDefAttr {
  constructor() {
    super();
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    (args[0] as NumberHolder).value = target.getEffectiveStat(Stat.DEF, user);
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
    if (!globalScene.arena.weather?.isEffectSuppressed()) {
      const accuracy = args[0] as NumberHolder;
      const weatherType = globalScene.arena.weather?.weatherType || WeatherType.NONE;
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
    if (!globalScene.arena.weather?.isEffectSuppressed()) {
      const accuracy = args[0] as NumberHolder;
      const weatherType = globalScene.arena.weather?.weatherType || WeatherType.NONE;
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
export class AlwaysHitMinimizeAttr extends VariableAccuracyAttr {
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
      const accuracy = args[0] as NumberHolder;
      accuracy.value = -1;

      return true;
    }

    return false;
  }
}

export class ToxicAccuracyAttr extends VariableAccuracyAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (user.isOfType(PokemonType.POISON)) {
      const accuracy = args[0] as NumberHolder;
      accuracy.value = -1;
      return true;
    }

    return false;
  }
}

export class BlizzardAccuracyAttr extends VariableAccuracyAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!globalScene.arena.weather?.isEffectSuppressed()) {
      const accuracy = args[0] as NumberHolder;
      const weatherType = globalScene.arena.weather?.weatherType || WeatherType.NONE;
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
    const category = (args[0] as NumberHolder);

    if (user.getEffectiveStat(Stat.ATK, target, move) > user.getEffectiveStat(Stat.SPATK, target, move)) {
      category.value = MoveCategory.PHYSICAL;
      return true;
    }

    return false;
  }
}

/**
 * Attribute used for tera moves that change category based on the user's Atk and SpAtk stats
 * Note: Currently, `getEffectiveStat` does not ignore all abilities that affect stats except those
 * with the attribute of `StatMultiplierAbAttr`
 * TODO: Remove the `.partial()` tag from Tera Blast and Tera Starstorm when the above issue is resolved
 * @extends VariableMoveCategoryAttr
 */
export class TeraMoveCategoryAttr extends VariableMoveCategoryAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const category = (args[0] as NumberHolder);

    if (user.isTerastallized && user.getEffectiveStat(Stat.ATK, target, move, true, true, false, false, true) >
    user.getEffectiveStat(Stat.SPATK, target, move, true, true, false, false, true)) {
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
   *   - [0] {@linkcode NumberHolder} the applied move's power, factoring in
   *       previously applied power modifiers.
   * @returns
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const power = args[0] as NumberHolder;
    if (user.isTerastallized && user.getTeraType() === PokemonType.STELLAR) {
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
   * @param args [0] {@linkcode NumberHolder} The category of the move
   * @returns true if the function succeeds
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const category = (args[0] as NumberHolder);

    if (user.getAlly() === target) {
      category.value = MoveCategory.STATUS;
      return true;
    }

    return false;
  }
}

export class ShellSideArmCategoryAttr extends VariableMoveCategoryAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const category = (args[0] as NumberHolder);

    const predictedPhysDmg = target.getBaseDamage({source: user, move, moveCategory: MoveCategory.PHYSICAL, ignoreAbility: true, ignoreSourceAbility: true, ignoreAllyAbility: true, ignoreSourceAllyAbility: true, simulated: true});
    const predictedSpecDmg = target.getBaseDamage({source: user, move, moveCategory: MoveCategory.SPECIAL, ignoreAbility: true, ignoreSourceAbility: true, ignoreAllyAbility: true, ignoreSourceAllyAbility: true, simulated: true});

    if (predictedPhysDmg > predictedSpecDmg) {
      category.value = MoveCategory.PHYSICAL;
      return true;
    } else if (predictedPhysDmg === predictedSpecDmg && user.randSeedInt(2) === 0) {
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
    if (!(moveType instanceof NumberHolder)) {
      return false;
    }

    if ([ user.species.speciesId, user.fusionSpecies?.speciesId ].includes(Species.ARCEUS) || [ user.species.speciesId, user.fusionSpecies?.speciesId ].includes(Species.SILVALLY)) {
      const form = user.species.speciesId === Species.ARCEUS || user.species.speciesId === Species.SILVALLY ? user.formIndex : user.fusionSpecies?.formIndex!;

      moveType.value = PokemonType[PokemonType[form]];
      return true;
    }

    return false;
  }
}

export class TechnoBlastTypeAttr extends VariableMoveTypeAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const moveType = args[0];
    if (!(moveType instanceof NumberHolder)) {
      return false;
    }

    if ([ user.species.speciesId, user.fusionSpecies?.speciesId ].includes(Species.GENESECT)) {
      const form = user.species.speciesId === Species.GENESECT ? user.formIndex : user.fusionSpecies?.formIndex;

      switch (form) {
        case 1: // Shock Drive
          moveType.value = PokemonType.ELECTRIC;
          break;
        case 2: // Burn Drive
          moveType.value = PokemonType.FIRE;
          break;
        case 3: // Chill Drive
          moveType.value = PokemonType.ICE;
          break;
        case 4: // Douse Drive
          moveType.value = PokemonType.WATER;
          break;
        default:
          moveType.value = PokemonType.NORMAL;
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
    if (!(moveType instanceof NumberHolder)) {
      return false;
    }

    if ([ user.species.speciesId, user.fusionSpecies?.speciesId ].includes(Species.MORPEKO)) {
      const form = user.species.speciesId === Species.MORPEKO ? user.formIndex : user.fusionSpecies?.formIndex;

      switch (form) {
        case 1: // Hangry Mode
          moveType.value = PokemonType.DARK;
          break;
        default: // Full Belly Mode
          moveType.value = PokemonType.ELECTRIC;
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
    if (!(moveType instanceof NumberHolder)) {
      return false;
    }

    if ([ user.species.speciesId, user.fusionSpecies?.speciesId ].includes(Species.PALDEA_TAUROS)) {
      const form = user.species.speciesId === Species.PALDEA_TAUROS ? user.formIndex : user.fusionSpecies?.formIndex;

      switch (form) {
        case 1: // Blaze breed
          moveType.value = PokemonType.FIRE;
          break;
        case 2: // Aqua breed
          moveType.value = PokemonType.WATER;
          break;
        default:
          moveType.value = PokemonType.FIGHTING;
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
    if (!(moveType instanceof NumberHolder)) {
      return false;
    }

    if ([ user.species.speciesId, user.fusionSpecies?.speciesId ].includes(Species.OGERPON)) {
      const form = user.species.speciesId === Species.OGERPON ? user.formIndex : user.fusionSpecies?.formIndex;

      switch (form) {
        case 1: // Wellspring Mask
        case 5: // Wellspring Mask Tera
          moveType.value = PokemonType.WATER;
          break;
        case 2: // Hearthflame Mask
        case 6: // Hearthflame Mask Tera
          moveType.value = PokemonType.FIRE;
          break;
        case 3: // Cornerstone Mask
        case 7: // Cornerstone Mask Tera
          moveType.value = PokemonType.ROCK;
          break;
        case 4: // Teal Mask Tera
        default:
          moveType.value = PokemonType.GRASS;
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
    if (!(moveType instanceof NumberHolder)) {
      return false;
    }

    if (!globalScene.arena.weather?.isEffectSuppressed()) {
      switch (globalScene.arena.weather?.weatherType) {
        case WeatherType.SUNNY:
        case WeatherType.HARSH_SUN:
          moveType.value = PokemonType.FIRE;
          break;
        case WeatherType.RAIN:
        case WeatherType.HEAVY_RAIN:
          moveType.value = PokemonType.WATER;
          break;
        case WeatherType.SANDSTORM:
          moveType.value = PokemonType.ROCK;
          break;
        case WeatherType.HAIL:
        case WeatherType.SNOW:
          moveType.value = PokemonType.ICE;
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
   * @param args [0] {@linkcode NumberHolder} The move's type to be modified
   * @returns true if the function succeeds
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const moveType = args[0];
    if (!(moveType instanceof NumberHolder)) {
      return false;
    }

    if (!user.isGrounded()) {
      return false;
    }

    const currentTerrain = globalScene.arena.getTerrainType();
    switch (currentTerrain) {
      case TerrainType.MISTY:
        moveType.value = PokemonType.FAIRY;
        break;
      case TerrainType.ELECTRIC:
        moveType.value = PokemonType.ELECTRIC;
        break;
      case TerrainType.GRASSY:
        moveType.value = PokemonType.GRASS;
        break;
      case TerrainType.PSYCHIC:
        moveType.value = PokemonType.PSYCHIC;
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
    if (!(moveType instanceof NumberHolder)) {
      return false;
    }

    const iv_val = Math.floor(((user.ivs[Stat.HP] & 1)
      + (user.ivs[Stat.ATK] & 1) * 2
      + (user.ivs[Stat.DEF] & 1) * 4
      + (user.ivs[Stat.SPD] & 1) * 8
      + (user.ivs[Stat.SPATK] & 1) * 16
      + (user.ivs[Stat.SPDEF] & 1) * 32) * 15 / 63);

    moveType.value = [
      PokemonType.FIGHTING, PokemonType.FLYING, PokemonType.POISON, PokemonType.GROUND,
      PokemonType.ROCK, PokemonType.BUG, PokemonType.GHOST, PokemonType.STEEL,
      PokemonType.FIRE, PokemonType.WATER, PokemonType.GRASS, PokemonType.ELECTRIC,
      PokemonType.PSYCHIC, PokemonType.ICE, PokemonType.DRAGON, PokemonType.DARK ][iv_val];

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
    if (!(moveType instanceof NumberHolder)) {
      return false;
    }

    if (user.isTerastallized) {
      moveType.value = user.getTeraType(); // changes move type to tera type
      return true;
    }

    return false;
  }
}

/**
 * Attribute used for Tera Starstorm that changes the move type to Stellar
 * @extends VariableMoveTypeAttr
 */
export class TeraStarstormTypeAttr extends VariableMoveTypeAttr {
  /**
   *
   * @param user the {@linkcode Pokemon} using the move
   * @param target n/a
   * @param move n/a
   * @param args[0] {@linkcode NumberHolder} the move type
   * @returns `true` if the move type is changed to {@linkcode PokemonType.STELLAR}, `false` otherwise
   */
  override apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (user.isTerastallized && user.hasSpecies(Species.TERAPAGOS)) {
      const moveType = args[0] as NumberHolder;

      moveType.value = PokemonType.STELLAR;
      return true;
    }
    return false;
  }
}

export class MatchUserTypeAttr extends VariableMoveTypeAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const moveType = args[0];
    if (!(moveType instanceof NumberHolder)) {
      return false;
    }
    const userTypes = user.getTypes(true);

    if (userTypes.includes(PokemonType.STELLAR)) { // will not change to stellar type
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

/**
 * Changes the type of a Pledge move based on the Pledge move combined with it.
 * @extends VariableMoveTypeAttr
 */
export class CombinedPledgeTypeAttr extends VariableMoveTypeAttr {
  override apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const moveType = args[0];
    if (!(moveType instanceof NumberHolder)) {
      return false;
    }

    const combinedPledgeMove = user?.turnData?.combiningPledge;
    if (!combinedPledgeMove) {
      return false;
    }

    switch (move.id) {
      case Moves.FIRE_PLEDGE:
        if (combinedPledgeMove === Moves.WATER_PLEDGE) {
          moveType.value = PokemonType.WATER;
          return true;
        }
        return false;
      case Moves.WATER_PLEDGE:
        if (combinedPledgeMove === Moves.GRASS_PLEDGE) {
          moveType.value = PokemonType.GRASS;
          return true;
        }
        return false;
      case Moves.GRASS_PLEDGE:
        if (combinedPledgeMove === Moves.FIRE_PLEDGE) {
          moveType.value = PokemonType.FIRE;
          return true;
        }
        return false;
      default:
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
      const multiplier = args[0] as NumberHolder;
      //When a flying type is hit, the first hit is always 1x multiplier.
      if (target.isOfType(PokemonType.FLYING)) {
        multiplier.value = 1;
      }
      return true;
    }

    return false;
  }
}

export class IceNoEffectTypeAttr extends VariableMoveTypeMultiplierAttr {
  /**
   * Checks to see if the Target is Ice-Type or not. If so, the move will have no effect.
   * @param user n/a
   * @param target The {@linkcode Pokemon} targeted by the move
   * @param move n/a
   * @param args `[0]` a {@linkcode NumberHolder | NumberHolder} containing a type effectiveness multiplier
   * @returns `true` if this Ice-type immunity applies; `false` otherwise
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const multiplier = args[0] as NumberHolder;
    if (target.isOfType(PokemonType.ICE)) {
      multiplier.value = 0;
      return true;
    }
    return false;
  }
}

export class FlyingTypeMultiplierAttr extends VariableMoveTypeMultiplierAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const multiplier = args[0] as NumberHolder;
    multiplier.value *= target.getAttackTypeEffectiveness(PokemonType.FLYING, user);
    return true;
  }
}

/**
 * Attribute for moves which have a custom type chart interaction.
 */
export class VariableMoveTypeChartAttr extends MoveAttr {
  /**
   * @param user {@linkcode Pokemon} using the move
   * @param target {@linkcode Pokemon} target of the move
   * @param move {@linkcode Move} with this attribute
   * @param args [0] {@linkcode NumberHolder} holding the type effectiveness
   * @param args [1] A single defensive type of the target
   *
   * @returns true if application of the attribute succeeds
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    return false;
  }
}

/**
 * This class forces Freeze-Dry to be super effective against Water Type.
 */
export class FreezeDryAttr extends VariableMoveTypeChartAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const multiplier = args[0] as NumberHolder;
    const defType = args[1] as PokemonType;

    if (defType === PokemonType.WATER) {
      multiplier.value = 2;
      return true;
    } else {
      return false;
    }
  }
}

export class OneHitKOAccuracyAttr extends VariableAccuracyAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const accuracy = args[0] as NumberHolder;
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
    const accuracy = args[0] as NumberHolder;
    if (user.level < target.level) {
      accuracy.value = 0;
    } else {
      const baseAccuracy = user.isOfType(PokemonType.ICE) ? 30 : 20;
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
  const cancelled = new BooleanHolder(false);
  applyAbAttrs(BlockNonDirectDamageAbAttr, user, cancelled);
  if (cancelled.value) {
    return false;
  }

  user.damageAndUpdate(toDmgValue(user.getMaxHp() / 2), { result: HitResult.INDIRECT });
  globalScene.queueMessage(i18next.t("moveTriggers:keptGoingAndCrashed", { pokemonName: getPokemonNameWithAffix(user) }));
  user.turnData.damageTaken += toDmgValue(user.getMaxHp() / 2);

  return true;
};

export class TypelessAttr extends MoveAttr { }
/**
* Attribute used for moves which ignore redirection effects, and always target their original target, i.e. Snipe Shot
* Bypasses Storm Drain, Follow Me, Ally Switch, and the like.
*/
export class BypassRedirectAttr extends MoveAttr {
  /** `true` if this move only bypasses redirection from Abilities */
  public readonly abilitiesOnly: boolean;

  constructor(abilitiesOnly: boolean = false) {
    super();
    this.abilitiesOnly = abilitiesOnly;
  }
}

export class FrenzyAttr extends MoveEffectAttr {
  constructor() {
    super(true, { lastHitOnly: true });
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

/**
 * Attribute that grants {@link https://bulbapedia.bulbagarden.net/wiki/Semi-invulnerable_turn | semi-invulnerability} to the user during
 * the associated move's charging phase. Should only be used for {@linkcode ChargingMove | ChargingMoves} as a `chargeAttr`.
 * @extends MoveEffectAttr
 */
export class SemiInvulnerableAttr extends MoveEffectAttr {
  /** The type of {@linkcode SemiInvulnerableTag} to grant to the user */
  public tagType: BattlerTagType;

  constructor(tagType: BattlerTagType) {
    super(true);
    this.tagType = tagType;
  }

  /**
   * Grants a {@linkcode SemiInvulnerableTag} to the associated move's user.
   * @param user the {@linkcode Pokemon} using the move
   * @param target n/a
   * @param move the {@linkcode Move} being used
   * @param args n/a
   * @returns `true` if semi-invulnerability was successfully granted; `false` otherwise.
   */
  override apply(user: Pokemon, target: Pokemon, move: Move, args?: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    return user.addTag(this.tagType, 1, move.id, user.id);
  }
}

export class AddBattlerTagAttr extends MoveEffectAttr {
  public tagType: BattlerTagType;
  public turnCountMin: number;
  public turnCountMax: number;
  protected cancelOnFail: boolean;
  private failOnOverlap: boolean;

  constructor(tagType: BattlerTagType, selfTarget: boolean = false, failOnOverlap: boolean = false, turnCountMin: number = 0, turnCountMax?: number, lastHitOnly: boolean = false) {
    super(selfTarget, { lastHitOnly: lastHitOnly });

    this.tagType = tagType;
    this.turnCountMin = turnCountMin;
    this.turnCountMax = turnCountMax !== undefined ? turnCountMax : turnCountMin;
    this.failOnOverlap = !!failOnOverlap;
  }

  canApply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.canApply(user, target, move, args)) {
      return false;
    }
    return true;
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

  getTagTargetBenefitScore(): number {
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
      case BattlerTagType.HEAL_BLOCK:
      case BattlerTagType.RECEIVE_DOUBLE_DAMAGE:
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
      case BattlerTagType.ALWAYS_GET_HIT:
        return 0;
      case BattlerTagType.INGRAIN:
      case BattlerTagType.IGNORE_ACCURACY:
      case BattlerTagType.AQUA_RING:
      case BattlerTagType.MAGIC_COAT:
        return 3;
      case BattlerTagType.PROTECTED:
      case BattlerTagType.FLYING:
      case BattlerTagType.CRIT_BOOST:
      case BattlerTagType.ALWAYS_CRIT:
        return 5;
      default:
        console.warn(`BattlerTag ${BattlerTagType[this.tagType]} is missing a score!`);
        return 0;
    }
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    let moveChance = this.getMoveChance(user, target, move, this.selfTarget, false);
    if (moveChance < 0) {
      moveChance = 100;
    }
    return Math.floor(this.getTagTargetBenefitScore() * (moveChance / 100));
  }
}

/**
 * Adds a {@link https://bulbapedia.bulbagarden.net/wiki/Seeding | Seeding} effect to the target
 * as seen with Leech Seed and Sappy Seed.
 * @extends AddBattlerTagAttr
 */
export class LeechSeedAttr extends AddBattlerTagAttr {
  constructor() {
    super(BattlerTagType.SEEDED);
  }
}

/**
 * Adds the appropriate battler tag for Smack Down and Thousand arrows
 * @extends AddBattlerTagAttr
 */
export class FallDownAttr extends AddBattlerTagAttr {
  constructor() {
    super(BattlerTagType.IGNORE_FLYING, false, false, 1, 1, true);
  }

  /**
   * Adds Grounded Tag to the target and checks if fallDown message should be displayed
   * @param user the {@linkcode Pokemon} using the move
   * @param target the {@linkcode Pokemon} targeted by the move
   * @param move the {@linkcode Move} invoking this effect
   * @param args n/a
   * @returns `true` if the effect successfully applies; `false` otherwise
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!target.isGrounded()) {
      globalScene.queueMessage(i18next.t("moveTriggers:fallDown", { targetPokemonName: getPokemonNameWithAffix(target) }));
    }
    return super.apply(user, target, move, args);
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
   * @param user The Pokemon using the move.
   * @param _target N/A
   * @param move The move being used.
   * @param _args N/A
   * @returns Whether the BattlerTag is applied.
   */
  apply(user: Pokemon, _target: Pokemon, move: Move, _args: any[]): boolean {
    if (!super.apply(user, _target, move, _args)) {
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

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
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
    if (user.getTypes(true).includes(PokemonType.GHOST)) {
      if (target.getTag(BattlerTagType.CURSED)) {
        globalScene.queueMessage(i18next.t("battle:attackFailed"));
        return false;
      }
      const curseRecoilDamage = Math.max(1, Math.floor(user.getMaxHp() / 2));
      user.damageAndUpdate(curseRecoilDamage, { result: HitResult.INDIRECT, ignoreSegments: true });
      globalScene.queueMessage(
        i18next.t("battlerTags:cursedOnAdd", {
          pokemonNameWithAffix: getPokemonNameWithAffix(user),
          pokemonName: getPokemonNameWithAffix(target)
        })
      );

      target.addTag(BattlerTagType.CURSED, 0, move.id, user.id);
      return true;
    } else {
      globalScene.unshiftPhase(new StatStageChangePhase(user.getBattlerIndex(), true, [ Stat.ATK, Stat.DEF ], 1));
      globalScene.unshiftPhase(new StatStageChangePhase(user.getBattlerIndex(), true, [ Stat.SPD ], -1));
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
    if (!this.selfTarget && target.isSafeguarded(user)) {
      if (move.category === MoveCategory.STATUS) {
        globalScene.queueMessage(i18next.t("moveTriggers:safeguard", { targetName: getPokemonNameWithAffix(target) }));
      }
      return false;
    }

    return super.apply(user, target, move, args);
  }
}

export class RechargeAttr extends AddBattlerTagAttr {
  constructor() {
    super(BattlerTagType.RECHARGING, true, false, 1, 1, true);
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
        if (!allMoves[turnMove?.move ?? Moves.NONE].hasAttr(ProtectAttr) || turnMove?.result !== MoveResult.SUCCESS) {
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

    globalScene.queueMessage(i18next.t("moveTriggers:tookAimAtTarget", { pokemonName: getPokemonNameWithAffix(user), targetName: getPokemonNameWithAffix(target) }));

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

    globalScene.queueMessage(i18next.t("moveTriggers:faintCountdown", { pokemonName: getPokemonNameWithAffix(target), turnCount: this.turnCountMin - 1 }));

    return true;
  }
}

/**
 * Attribute to remove all Substitutes from the field.
 * @extends MoveEffectAttr
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Tidy_Up_(move) | Tidy Up}
 * @see {@linkcode SubstituteTag}
 */
export class RemoveAllSubstitutesAttr extends MoveEffectAttr {
  constructor() {
    super(true);
  }

  /**
   * Remove's the Substitute Doll effect from all active Pokemon on the field
   * @param user {@linkcode Pokemon} the Pokemon using this move
   * @param target n/a
   * @param move {@linkcode Move} the move applying this effect
   * @param args n/a
   * @returns `true` if the effect successfully applies
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    globalScene.getField(true).forEach(pokemon =>
      pokemon.findAndRemoveTags(tag => tag.tagType === BattlerTagType.SUBSTITUTE));
    return true;
  }
}

/**
 * Attribute used when a move can deal damage to {@linkcode BattlerTagType}
 * Moves that always hit but do not deal double damage: Thunder, Fissure, Sky Uppercut,
 * Smack Down, Hurricane, Thousand Arrows
 * @extends MoveAttr
*/
export class HitsTagAttr extends MoveAttr {
  /** The {@linkcode BattlerTagType} this move hits */
  public tagType: BattlerTagType;
  /** Should this move deal double damage against {@linkcode HitsTagAttr.tagType}? */
  public doubleDamage: boolean;

  constructor(tagType: BattlerTagType, doubleDamage: boolean = false) {
    super();

    this.tagType = tagType;
    this.doubleDamage = !!doubleDamage;
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    return target.getTag(this.tagType) ? this.doubleDamage ? 10 : 5 : 0;
  }
}

/**
 * Used for moves that will always hit for a given tag but also doubles damage.
 * Moves include: Gust, Stomp, Body Slam, Surf, Earthquake, Magnitude, Twister,
 * Whirlpool, Dragon Rush, Heat Crash, Steam Roller, Flying Press
 */
export class HitsTagForDoubleDamageAttr extends HitsTagAttr {
  constructor(tagType: BattlerTagType) {
    super(tagType, true);
  }
}

export class AddArenaTagAttr extends MoveEffectAttr {
  public tagType: ArenaTagType;
  public turnCount: number;
  private failOnOverlap: boolean;
  public selfSideTarget: boolean;

  constructor(tagType: ArenaTagType, turnCount?: number | null, failOnOverlap: boolean = false, selfSideTarget: boolean = false) {
    super(true);

    this.tagType = tagType;
    this.turnCount = turnCount!; // TODO: is the bang correct?
    this.failOnOverlap = failOnOverlap;
    this.selfSideTarget = selfSideTarget;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    if ((move.chance < 0 || move.chance === 100 || user.randSeedInt(100) < move.chance) && user.getLastXMoves(1)[0]?.result === MoveResult.SUCCESS) {
      const side = ((this.selfSideTarget ? user : target).isPlayer() !== (move.hasAttr(AddArenaTrapTagAttr) && target === user)) ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY;
      globalScene.arena.addTag(this.tagType, this.turnCount, move.id, user.id, side);
      return true;
    }

    return false;
  }

  getCondition(): MoveConditionFunc | null {
    return this.failOnOverlap
      ? (user, target, move) => !globalScene.arena.getTagOnSide(this.tagType, target.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY)
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
    super(true);

    this.tagTypes = tagTypes;
    this.selfSideTarget = selfSideTarget;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const side = (this.selfSideTarget ? user : target).isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY;

    for (const tagType of this.tagTypes) {
      globalScene.arena.removeTagOnSide(tagType, side);
    }

    return true;
  }
}

export class AddArenaTrapTagAttr extends AddArenaTagAttr {
  getCondition(): MoveConditionFunc {
    return (user, target, move) => {
      const side = (this.selfSideTarget !== user.isPlayer()) ? ArenaTagSide.ENEMY : ArenaTagSide.PLAYER;
      const tag = globalScene.arena.getTagOnSide(this.tagType, side) as ArenaTrapTag;
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
    const tag = globalScene.arena.getTagOnSide(this.tagType, side) as ArenaTrapTag;
    if ((moveChance < 0 || moveChance === 100 || user.randSeedInt(100) < moveChance) && user.getLastXMoves(1)[0]?.result === MoveResult.SUCCESS) {
      globalScene.arena.addTag(this.tagType, 0, move.id, user.id, side);
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
    super(true, { trigger: MoveEffectTrigger.PRE_APPLY });
    this.targetBothSides = targetBothSides;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {

    if (!super.apply(user, target, move, args)) {
      return false;
    }

    if (this.targetBothSides) {
      globalScene.arena.removeTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.PLAYER);
      globalScene.arena.removeTagOnSide(ArenaTagType.TOXIC_SPIKES, ArenaTagSide.PLAYER);
      globalScene.arena.removeTagOnSide(ArenaTagType.STEALTH_ROCK, ArenaTagSide.PLAYER);
      globalScene.arena.removeTagOnSide(ArenaTagType.STICKY_WEB, ArenaTagSide.PLAYER);

      globalScene.arena.removeTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.ENEMY);
      globalScene.arena.removeTagOnSide(ArenaTagType.TOXIC_SPIKES, ArenaTagSide.ENEMY);
      globalScene.arena.removeTagOnSide(ArenaTagType.STEALTH_ROCK, ArenaTagSide.ENEMY);
      globalScene.arena.removeTagOnSide(ArenaTagType.STICKY_WEB, ArenaTagSide.ENEMY);
    } else {
      globalScene.arena.removeTagOnSide(ArenaTagType.SPIKES, target.isPlayer() ? ArenaTagSide.ENEMY : ArenaTagSide.PLAYER);
      globalScene.arena.removeTagOnSide(ArenaTagType.TOXIC_SPIKES, target.isPlayer() ? ArenaTagSide.ENEMY : ArenaTagSide.PLAYER);
      globalScene.arena.removeTagOnSide(ArenaTagType.STEALTH_ROCK, target.isPlayer() ? ArenaTagSide.ENEMY : ArenaTagSide.PLAYER);
      globalScene.arena.removeTagOnSide(ArenaTagType.STICKY_WEB, target.isPlayer() ? ArenaTagSide.ENEMY : ArenaTagSide.PLAYER);
    }

    return true;
  }
}

export class RemoveScreensAttr extends MoveEffectAttr {

  private targetBothSides: boolean;

  constructor(targetBothSides: boolean = false) {
    super(true, { trigger: MoveEffectTrigger.PRE_APPLY });
    this.targetBothSides = targetBothSides;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {

    if (!super.apply(user, target, move, args)) {
      return false;
    }

    if (this.targetBothSides) {
      globalScene.arena.removeTagOnSide(ArenaTagType.REFLECT, ArenaTagSide.PLAYER);
      globalScene.arena.removeTagOnSide(ArenaTagType.LIGHT_SCREEN, ArenaTagSide.PLAYER);
      globalScene.arena.removeTagOnSide(ArenaTagType.AURORA_VEIL, ArenaTagSide.PLAYER);

      globalScene.arena.removeTagOnSide(ArenaTagType.REFLECT, ArenaTagSide.ENEMY);
      globalScene.arena.removeTagOnSide(ArenaTagType.LIGHT_SCREEN, ArenaTagSide.ENEMY);
      globalScene.arena.removeTagOnSide(ArenaTagType.AURORA_VEIL, ArenaTagSide.ENEMY);
    } else {
      globalScene.arena.removeTagOnSide(ArenaTagType.REFLECT, target.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY);
      globalScene.arena.removeTagOnSide(ArenaTagType.LIGHT_SCREEN, target.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY);
      globalScene.arena.removeTagOnSide(ArenaTagType.AURORA_VEIL, target.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY);
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
    super(true);
    this.SwapTags = SwapTags;
  }

  apply(user:Pokemon, target:Pokemon, move:Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const tagPlayerTemp = globalScene.arena.findTagsOnSide((t => this.SwapTags.includes(t.tagType)), ArenaTagSide.PLAYER);
    const tagEnemyTemp = globalScene.arena.findTagsOnSide((t => this.SwapTags.includes(t.tagType)), ArenaTagSide.ENEMY);


    if (tagPlayerTemp) {
      for (const swapTagsType of tagPlayerTemp) {
        globalScene.arena.removeTagOnSide(swapTagsType.tagType, ArenaTagSide.PLAYER, true);
        globalScene.arena.addTag(swapTagsType.tagType, swapTagsType.turnCount, swapTagsType.sourceMove, swapTagsType.sourceId!, ArenaTagSide.ENEMY, true); // TODO: is the bang correct?
      }
    }
    if (tagEnemyTemp) {
      for (const swapTagsType of tagEnemyTemp) {
        globalScene.arena.removeTagOnSide(swapTagsType.tagType, ArenaTagSide.ENEMY, true);
        globalScene.arena.addTag(swapTagsType.tagType, swapTagsType.turnCount, swapTagsType.sourceMove, swapTagsType.sourceId!, ArenaTagSide.PLAYER, true); // TODO: is the bang correct?
      }
    }


    globalScene.queueMessage(i18next.t("moveTriggers:swapArenaTags", { pokemonName: getPokemonNameWithAffix(user) }));
    return true;
  }
}

/**
 * Attribute that adds a secondary effect to the field when two unique Pledge moves
 * are combined. The effect added varies based on the two Pledge moves combined.
 */
export class AddPledgeEffectAttr extends AddArenaTagAttr {
  private readonly requiredPledge: Moves;

  constructor(tagType: ArenaTagType, requiredPledge: Moves, selfSideTarget: boolean = false) {
    super(tagType, 4, false, selfSideTarget);

    this.requiredPledge = requiredPledge;
  }

  override apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    // TODO: add support for `HIT` effect triggering in AddArenaTagAttr to remove the need for this check
    if (user.getLastXMoves(1)[0]?.result !== MoveResult.SUCCESS) {
      return false;
    }

    if (user.turnData.combiningPledge === this.requiredPledge) {
      return super.apply(user, target, move, args);
    }
    return false;
  }
}

/**
 * Attribute used for Revival Blessing.
 * @extends MoveEffectAttr
 * @see {@linkcode apply}
 */
export class RevivalBlessingAttr extends MoveEffectAttr {
  constructor() {
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
  override apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    // If user is player, checks if the user has fainted pokemon
    if (user instanceof PlayerPokemon) {
      globalScene.unshiftPhase(new RevivalBlessingPhase(user));
      return true;
    } else if (user instanceof EnemyPokemon && user.hasTrainer() && globalScene.getEnemyParty().findIndex((p) => p.isFainted() && !p.isBoss()) > -1) {
      // If used by an enemy trainer with at least one fainted non-boss Pokemon, this
      // revives one of said Pokemon selected at random.
      const faintedPokemon = globalScene.getEnemyParty().filter((p) => p.isFainted() && !p.isBoss());
      const pokemon = faintedPokemon[user.randSeedInt(faintedPokemon.length)];
      const slotIndex = globalScene.getEnemyParty().findIndex((p) => pokemon.id === p.id);
      pokemon.resetStatus();
      pokemon.heal(Math.min(toDmgValue(0.5 * pokemon.getMaxHp()), pokemon.getMaxHp()));
      globalScene.queueMessage(i18next.t("moveTriggers:revivalBlessing", { pokemonName: getPokemonNameWithAffix(pokemon) }), 0, true);
      const allyPokemon = user.getAlly();
      if (globalScene.currentBattle.double && globalScene.getEnemyParty().length > 1 && !isNullOrUndefined(allyPokemon)) {
        // Handle cases where revived pokemon needs to get switched in on same turn
        if (allyPokemon.isFainted() || allyPokemon === pokemon) {
          // Enemy switch phase should be removed and replaced with the revived pkmn switching in
          globalScene.tryRemovePhase((phase: SwitchSummonPhase) => phase instanceof SwitchSummonPhase && phase.getPokemon() === pokemon);
          // If the pokemon being revived was alive earlier in the turn, cancel its move
          // (revived pokemon can't move in the turn they're brought back)
          globalScene.findPhase((phase: MovePhase) => phase.pokemon === pokemon)?.cancel();
          if (user.fieldPosition === FieldPosition.CENTER) {
            user.setFieldPosition(FieldPosition.LEFT);
          }
          globalScene.unshiftPhase(new SwitchSummonPhase(SwitchType.SWITCH, allyPokemon.getFieldIndex(), slotIndex, false, false));
        }
      }
      return true;
    }
    return false;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) =>
      (user instanceof PlayerPokemon && globalScene.getPlayerParty().some((p) => p.isFainted())) ||
      (user instanceof EnemyPokemon &&
        user.hasTrainer() &&
        globalScene.getEnemyParty().some((p) => p.isFainted() && !p.isBoss()));
  }

  override getUserBenefitScore(user: Pokemon, _target: Pokemon, _move: Move): number {
    if (user.hasTrainer() && globalScene.getEnemyParty().some((p) => p.isFainted() && !p.isBoss())) {
      return 20;
    }

    return -20;
  }
}


export class ForceSwitchOutAttr extends MoveEffectAttr {
  constructor(
    private selfSwitch: boolean = false,
    private switchType: SwitchType = SwitchType.SWITCH
  ) {
    super(false, { lastHitOnly: true });
  }

  isBatonPass() {
    return this.switchType === SwitchType.BATON_PASS;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    // Check if the move category is not STATUS or if the switch out condition is not met
    if (!this.getSwitchOutCondition()(user, target, move)) {
      return false;
    }

    /** The {@linkcode Pokemon} to be switched out with this effect */
    const switchOutTarget = this.selfSwitch ? user : target;

    // If the switch-out target is a Dondozo with a Tatsugiri in its mouth
    // (e.g. when it uses Flip Turn), make it spit out the Tatsugiri before switching out.
    switchOutTarget.lapseTag(BattlerTagType.COMMANDED);

    if (switchOutTarget instanceof PlayerPokemon) {
      /**
      * Check if Wimp Out/Emergency Exit activates due to being hit by U-turn or Volt Switch
      * If it did, the user of U-turn or Volt Switch will not be switched out.
      */
      if (target.getAbility().hasAttr(PostDamageForceSwitchAbAttr)
        && [ Moves.U_TURN, Moves.VOLT_SWITCH, Moves.FLIP_TURN ].includes(move.id)
      ) {
        if (this.hpDroppedBelowHalf(target)) {
          return false;
        }
      }

      // Find indices of off-field Pokemon that are eligible to be switched into
      const eligibleNewIndices: number[] = [];
      globalScene.getPlayerParty().forEach((pokemon, index) => {
        if (pokemon.isAllowedInBattle() && !pokemon.isOnField()) {
          eligibleNewIndices.push(index);
        }
      });

      if (eligibleNewIndices.length < 1) {
        return false;
      }

      if (switchOutTarget.hp > 0) {
        if (this.switchType === SwitchType.FORCE_SWITCH) {
          switchOutTarget.leaveField(true);
          const slotIndex = eligibleNewIndices[user.randSeedInt(eligibleNewIndices.length)];
          globalScene.prependToPhase(
            new SwitchSummonPhase(
              this.switchType,
              switchOutTarget.getFieldIndex(),
              slotIndex,
              false,
              true
            ),
            MoveEndPhase
          );
        } else {
          switchOutTarget.leaveField(this.switchType === SwitchType.SWITCH);
          globalScene.prependToPhase(
            new SwitchPhase(
              this.switchType,
              switchOutTarget.getFieldIndex(),
              true,
              true
            ),
            MoveEndPhase
          );
          return true;
        }
      }
      return false;
    } else if (globalScene.currentBattle.battleType !== BattleType.WILD) { // Switch out logic for enemy trainers
      // Find indices of off-field Pokemon that are eligible to be switched into
      const isPartnerTrainer = globalScene.currentBattle.trainer?.isPartner();
      const eligibleNewIndices: number[] = [];
      globalScene.getEnemyParty().forEach((pokemon, index) => {
        if (pokemon.isAllowedInBattle() && !pokemon.isOnField() && (!isPartnerTrainer || pokemon.trainerSlot === (switchOutTarget as EnemyPokemon).trainerSlot)) {
          eligibleNewIndices.push(index);
        }
      });

      if (eligibleNewIndices.length < 1) {
        return false;
      }

      if (switchOutTarget.hp > 0) {
        if (this.switchType === SwitchType.FORCE_SWITCH) {
          switchOutTarget.leaveField(true);
          const slotIndex = eligibleNewIndices[user.randSeedInt(eligibleNewIndices.length)];
          globalScene.prependToPhase(
            new SwitchSummonPhase(
              this.switchType,
              switchOutTarget.getFieldIndex(),
              slotIndex,
              false,
              false
            ),
            MoveEndPhase
          );
        } else {
          switchOutTarget.leaveField(this.switchType === SwitchType.SWITCH);
          globalScene.prependToPhase(
            new SwitchSummonPhase(
              this.switchType,
              switchOutTarget.getFieldIndex(),
              (globalScene.currentBattle.trainer ? globalScene.currentBattle.trainer.getNextSummonIndex((switchOutTarget as EnemyPokemon).trainerSlot) : 0),
              false,
              false
            ),
            MoveEndPhase
          );
        }
      }
    } else { // Switch out logic for wild pokemon
      /**
      * Check if Wimp Out/Emergency Exit activates due to being hit by U-turn or Volt Switch
      * If it did, the user of U-turn or Volt Switch will not be switched out.
      */
      if (target.getAbility().hasAttr(PostDamageForceSwitchAbAttr)
        && [ Moves.U_TURN, Moves.VOLT_SWITCH, Moves.FLIP_TURN ].includes(move.id)
      ) {
        if (this.hpDroppedBelowHalf(target)) {
          return false;
        }
      }

      const allyPokemon = switchOutTarget.getAlly();

      if (switchOutTarget.hp > 0) {
        switchOutTarget.leaveField(false);
        globalScene.queueMessage(i18next.t("moveTriggers:fled", { pokemonName: getPokemonNameWithAffix(switchOutTarget) }), null, true, 500);

        // in double battles redirect potential moves off fled pokemon
        if (globalScene.currentBattle.double && !isNullOrUndefined(allyPokemon)) {
          globalScene.redirectPokemonMoves(switchOutTarget, allyPokemon);
        }
      }

      // clear out enemy held item modifiers of the switch out target
      globalScene.clearEnemyHeldItemModifiers(switchOutTarget);

      if (!allyPokemon?.isActive(true) && switchOutTarget.hp) {
          globalScene.pushPhase(new BattleEndPhase(false));
                    
          if (globalScene.gameMode.hasRandomBiomes || globalScene.isNewBiome()) {
            globalScene.pushPhase(new SelectBiomePhase());
          }
          
          globalScene.pushPhase(new NewBattlePhase());
      }
    }

	  return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => (move.category !== MoveCategory.STATUS || this.getSwitchOutCondition()(user, target, move));
  }

  getFailedText(_user: Pokemon, target: Pokemon, _move: Move): string | undefined {
    const blockedByAbility = new BooleanHolder(false);
    applyAbAttrs(ForceSwitchOutImmunityAbAttr, target, blockedByAbility);
    if (blockedByAbility.value) {
      return i18next.t("moveTriggers:cannotBeSwitchedOut", { pokemonName: getPokemonNameWithAffix(target) });
    }
  }


  getSwitchOutCondition(): MoveConditionFunc {
    return (user, target, move) => {
      const switchOutTarget = (this.selfSwitch ? user : target);
      const player = switchOutTarget instanceof PlayerPokemon;

      if (!this.selfSwitch) {
        // Dondozo with an allied Tatsugiri in its mouth cannot be forced out
        const commandedTag = switchOutTarget.getTag(BattlerTagType.COMMANDED);
        if (commandedTag?.getSourcePokemon()?.isActive(true)) {
          return false;
        }

        if (!player && globalScene.currentBattle.isBattleMysteryEncounter() && !globalScene.currentBattle.mysteryEncounter?.fleeAllowed) {
          // Don't allow wild opponents to be force switched during MEs with flee disabled
          return false;
        }

        const blockedByAbility = new BooleanHolder(false);
        applyAbAttrs(ForceSwitchOutImmunityAbAttr, target, blockedByAbility);
        if (blockedByAbility.value) {
          return false;
        }
      }


      if (!player && globalScene.currentBattle.battleType === BattleType.WILD) {
        // wild pokemon cannot switch out with baton pass.
        return !this.isBatonPass()
                && globalScene.currentBattle.waveIndex % 10 !== 0
                // Don't allow wild mons to flee with U-turn et al.
                && !(this.selfSwitch && MoveCategory.STATUS !== move.category);
      }

      const party = player ? globalScene.getPlayerParty() : globalScene.getEnemyParty();
      return party.filter(p => p.isAllowedInBattle() && !p.isOnField()
          && (player || (p as EnemyPokemon).trainerSlot === (switchOutTarget as EnemyPokemon).trainerSlot)).length > 0;
    };
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    if (!globalScene.getEnemyParty().find(p => p.isActive() && !p.isOnField())) {
      return -20;
    }
    let ret = this.selfSwitch ? Math.floor((1 - user.getHpRatio()) * 20) : super.getUserBenefitScore(user, target, move);
    if (this.selfSwitch && this.isBatonPass()) {
      const statStageTotal = user.getStatStages().reduce((s: number, total: number) => total += s, 0);
      ret = ret / 2 + (Phaser.Tweens.Builders.GetEaseFunction("Sine.easeOut")(Math.min(Math.abs(statStageTotal), 10) / 10) * (statStageTotal >= 0 ? 10 : -10));
    }
    return ret;
  }

  /**
  * Helper function to check if the Pokémon's health is below half after taking damage.
  * Used for an edge case interaction with Wimp Out/Emergency Exit.
  * If the Ability activates due to being hit by U-turn or Volt Switch, the user of that move will not be switched out.
  */
  hpDroppedBelowHalf(target: Pokemon): boolean {
    const pokemonHealth = target.hp;
    const maxPokemonHealth = target.getMaxHp();
    const damageTaken = target.turnData.damageTaken;
    const initialHealth = pokemonHealth + damageTaken;

    // Check if the Pokémon's health has dropped below half after the damage
    return initialHealth >= maxPokemonHealth / 2 && pokemonHealth < maxPokemonHealth / 2;
  }
}

export class ChillyReceptionAttr extends ForceSwitchOutAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    globalScene.arena.trySetWeather(WeatherType.SNOW, user);
    return super.apply(user, target, move, args);
  }

  getCondition(): MoveConditionFunc {
    // chilly reception move will go through if the weather is change-able to snow, or the user can switch out, else move will fail
    return (user, target, move) => globalScene.arena.weather?.weatherType !== WeatherType.SNOW || super.getSwitchOutCondition()(user, target, move);
  }
}
export class RemoveTypeAttr extends MoveEffectAttr {

  private removedType: PokemonType;
  private messageCallback: ((user: Pokemon) => void) | undefined;

  constructor(removedType: PokemonType, messageCallback?: (user: Pokemon) => void) {
    super(true, { trigger: MoveEffectTrigger.POST_TARGET });
    this.removedType = removedType;
    this.messageCallback = messageCallback;

  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    if (user.isTerastallized && user.getTeraType() === this.removedType) { // active tera types cannot be removed
      return false;
    }

    const userTypes = user.getTypes(true);
    const modifiedTypes = userTypes.filter(type => type !== this.removedType);
    if (modifiedTypes.length === 0) {
      modifiedTypes.push(PokemonType.UNKNOWN);
    }
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

    const targetTypes = target.getTypes(true);
    if (targetTypes.includes(PokemonType.UNKNOWN) && targetTypes.indexOf(PokemonType.UNKNOWN) > -1) {
      targetTypes[targetTypes.indexOf(PokemonType.UNKNOWN)] = PokemonType.NORMAL;
    }
    user.summonData.types = targetTypes;
    user.updateInfo();

    globalScene.queueMessage(i18next.t("moveTriggers:copyType", { pokemonName: getPokemonNameWithAffix(user), targetPokemonName: getPokemonNameWithAffix(target) }));

    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => target.getTypes()[0] !== PokemonType.UNKNOWN || target.summonData.addedType !== null;
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

    const terrainType = globalScene.arena.getTerrainType();
    let typeChange: PokemonType;
    if (terrainType !== TerrainType.NONE) {
      typeChange = this.getTypeForTerrain(globalScene.arena.getTerrainType());
    } else {
      typeChange = this.getTypeForBiome(globalScene.arena.biomeType);
    }

    user.summonData.types = [ typeChange ];
    user.updateInfo();

    globalScene.queueMessage(i18next.t("moveTriggers:transformedIntoType", { pokemonName: getPokemonNameWithAffix(user), typeName: i18next.t(`pokemonInfo:Type.${PokemonType[typeChange]}`) }));

    return true;
  }

  /**
   * Retrieves a type from the current terrain
   * @param terrainType {@linkcode TerrainType}
   * @returns {@linkcode Type}
   */
  private getTypeForTerrain(terrainType: TerrainType): PokemonType {
    switch (terrainType) {
      case TerrainType.ELECTRIC:
        return PokemonType.ELECTRIC;
      case TerrainType.MISTY:
        return PokemonType.FAIRY;
      case TerrainType.GRASSY:
        return PokemonType.GRASS;
      case TerrainType.PSYCHIC:
        return PokemonType.PSYCHIC;
      case TerrainType.NONE:
      default:
        return PokemonType.UNKNOWN;
    }
  }

  /**
   * Retrieves a type from the current biome
   * @param biomeType {@linkcode Biome}
   * @returns {@linkcode Type}
   */
  private getTypeForBiome(biomeType: Biome): PokemonType {
    switch (biomeType) {
      case Biome.TOWN:
      case Biome.PLAINS:
      case Biome.METROPOLIS:
        return PokemonType.NORMAL;
      case Biome.GRASS:
      case Biome.TALL_GRASS:
        return PokemonType.GRASS;
      case Biome.FOREST:
      case Biome.JUNGLE:
        return PokemonType.BUG;
      case Biome.SLUM:
      case Biome.SWAMP:
        return PokemonType.POISON;
      case Biome.SEA:
      case Biome.BEACH:
      case Biome.LAKE:
      case Biome.SEABED:
        return PokemonType.WATER;
      case Biome.MOUNTAIN:
        return PokemonType.FLYING;
      case Biome.BADLANDS:
        return PokemonType.GROUND;
      case Biome.CAVE:
      case Biome.DESERT:
        return PokemonType.ROCK;
      case Biome.ICE_CAVE:
      case Biome.SNOWY_FOREST:
        return PokemonType.ICE;
      case Biome.MEADOW:
      case Biome.FAIRY_CAVE:
      case Biome.ISLAND:
        return PokemonType.FAIRY;
      case Biome.POWER_PLANT:
        return PokemonType.ELECTRIC;
      case Biome.VOLCANO:
        return PokemonType.FIRE;
      case Biome.GRAVEYARD:
      case Biome.TEMPLE:
        return PokemonType.GHOST;
      case Biome.DOJO:
      case Biome.CONSTRUCTION_SITE:
        return PokemonType.FIGHTING;
      case Biome.FACTORY:
      case Biome.LABORATORY:
        return PokemonType.STEEL;
      case Biome.RUINS:
      case Biome.SPACE:
        return PokemonType.PSYCHIC;
      case Biome.WASTELAND:
      case Biome.END:
        return PokemonType.DRAGON;
      case Biome.ABYSS:
        return PokemonType.DARK;
      default:
        return PokemonType.UNKNOWN;
    }
  }
}

export class ChangeTypeAttr extends MoveEffectAttr {
  private type: PokemonType;

  constructor(type: PokemonType) {
    super(false);

    this.type = type;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    target.summonData.types = [ this.type ];
    target.updateInfo();

    globalScene.queueMessage(i18next.t("moveTriggers:transformedIntoType", { pokemonName: getPokemonNameWithAffix(target), typeName: i18next.t(`pokemonInfo:Type.${PokemonType[this.type]}`) }));

    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => !target.isTerastallized && !target.hasAbility(Abilities.MULTITYPE) && !target.hasAbility(Abilities.RKS_SYSTEM) && !(target.getTypes().length === 1 && target.getTypes()[0] === this.type);
  }
}

export class AddTypeAttr extends MoveEffectAttr {
  private type: PokemonType;

  constructor(type: PokemonType) {
    super(false);

    this.type = type;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    target.summonData.addedType = this.type;
    target.updateInfo();

    globalScene.queueMessage(i18next.t("moveTriggers:addType", { typeName: i18next.t(`pokemonInfo:Type.${PokemonType[this.type]}`), pokemonName: getPokemonNameWithAffix(target) }));

    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => !target.isTerastallized && !target.getTypes().includes(this.type);
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

    const firstMoveType = target.getMoveset()[0].getMove().type;
    user.summonData.types = [ firstMoveType ];
    globalScene.queueMessage(i18next.t("battle:transformedIntoType", { pokemonName: getPokemonNameWithAffix(user), type: i18next.t(`pokemonInfo:Type.${PokemonType[firstMoveType]}`) }));

    return true;
  }
}

/**
 * Attribute used to call a move.
 * Used by other move attributes: {@linkcode RandomMoveAttr}, {@linkcode RandomMovesetMoveAttr}, {@linkcode CopyMoveAttr}
 * @see {@linkcode apply} for move call
 * @extends OverrideMoveEffectAttr
 */
class CallMoveAttr extends OverrideMoveEffectAttr {
  protected invalidMoves: ReadonlySet<Moves>;
  protected hasTarget: boolean;
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const replaceMoveTarget = move.moveTarget === MoveTarget.NEAR_OTHER ? MoveTarget.NEAR_ENEMY : undefined;
    const moveTargets = getMoveTargets(user, move.id, replaceMoveTarget);
    if (moveTargets.targets.length === 0) {
      globalScene.queueMessage(i18next.t("battle:attackFailed"));
      console.log("CallMoveAttr failed due to no targets.");
      return false;
    }
    const targets = moveTargets.multiple || moveTargets.targets.length === 1
      ? moveTargets.targets
      : [ this.hasTarget ? target.getBattlerIndex() : moveTargets.targets[user.randSeedInt(moveTargets.targets.length)] ]; // account for Mirror Move having a target already
    user.getMoveQueue().push({ move: move.id, targets: targets, virtual: true, ignorePP: true });
    globalScene.unshiftPhase(new LoadMoveAnimPhase(move.id));
    globalScene.unshiftPhase(new MovePhase(user, targets, new PokemonMove(move.id, 0, 0, true), true, true));
    return true;
  }
}

/**
 * Attribute used to call a random move.
 * Used for {@linkcode Moves.METRONOME}
 * @see {@linkcode apply} for move selection and move call
 * @extends CallMoveAttr to call a selected move
 */
export class RandomMoveAttr extends CallMoveAttr {
  constructor(invalidMoves: ReadonlySet<Moves>) {
    super();
    this.invalidMoves = invalidMoves;
  }

  /**
   * This function exists solely to allow tests to override the randomly selected move by mocking this function.
   */
  public getMoveOverride(): Moves | null {
    return null;
  }

  /**
   * User calls a random moveId.
   *
   * Invalid moves are indicated by what is passed in to invalidMoves: {@linkcode invalidMetronomeMoves}
   * @param user Pokemon that used the move and will call a random move
   * @param target Pokemon that will be targeted by the random move (if single target)
   * @param move Move being used
   * @param args Unused
   */
  override apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const moveIds = getEnumValues(Moves).map(m => !this.invalidMoves.has(m) && !allMoves[m].name.endsWith(" (N)") ? m : Moves.NONE);
    let moveId: Moves = Moves.NONE;
    do {
      moveId = this.getMoveOverride() ?? moveIds[user.randSeedInt(moveIds.length)];
    }
    while (moveId === Moves.NONE);
    return super.apply(user, target, allMoves[moveId], args);
  }
}

/**
 * Attribute used to call a random move in the user or party's moveset.
 * Used for {@linkcode Moves.ASSIST} and {@linkcode Moves.SLEEP_TALK}
 *
 * Fails if the user has no callable moves.
 *
 * Invalid moves are indicated by what is passed in to invalidMoves: {@linkcode invalidAssistMoves} or {@linkcode invalidSleepTalkMoves}
 * @extends RandomMoveAttr to use the callMove function on a moveId
 * @see {@linkcode getCondition} for move selection
 */
export class RandomMovesetMoveAttr extends CallMoveAttr {
  private includeParty: boolean;
  private moveId: number;
  constructor(invalidMoves: ReadonlySet<Moves>, includeParty: boolean = false) {
    super();
    this.includeParty = includeParty;
    this.invalidMoves = invalidMoves;
  }

  /**
   * User calls a random moveId selected in {@linkcode getCondition}
   * @param user Pokemon that used the move and will call a random move
   * @param target Pokemon that will be targeted by the random move (if single target)
   * @param move Move being used
   * @param args Unused
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    return super.apply(user, target, allMoves[this.moveId], args);
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => {
      // includeParty will be true for Assist, false for Sleep Talk
      let allies: Pokemon[];
      if (this.includeParty) {
        allies = user.isPlayer() ? globalScene.getPlayerParty().filter(p => p !== user) : globalScene.getEnemyParty().filter(p => p !== user);
      } else {
        allies = [ user ];
      }
      const partyMoveset = allies.map(p => p.moveset).flat();
      const moves = partyMoveset.filter(m => !this.invalidMoves.has(m!.moveId) && !m!.getMove().name.endsWith(" (N)"));
      if (moves.length === 0) {
        return false;
      }

      this.moveId = moves[user.randSeedInt(moves.length)]!.moveId;
      return true;
    };
  }
}

export class NaturePowerAttr extends OverrideMoveEffectAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    let moveId;
    switch (globalScene.arena.getTerrainType()) {
    // this allows terrains to 'override' the biome move
      case TerrainType.NONE:
        switch (globalScene.arena.biomeType) {
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

    user.getMoveQueue().push({ move: moveId, targets: [ target.getBattlerIndex() ], ignorePP: true });
    globalScene.unshiftPhase(new LoadMoveAnimPhase(moveId));
    globalScene.unshiftPhase(new MovePhase(user, [ target.getBattlerIndex() ], new PokemonMove(moveId, 0, 0, true), true));
    return true;
  }
}

/**
 * Attribute used to copy a previously-used move.
 * Used for {@linkcode Moves.COPYCAT} and {@linkcode Moves.MIRROR_MOVE}
 * @see {@linkcode apply} for move selection and move call
 * @extends CallMoveAttr to call a selected move
 */
export class CopyMoveAttr extends CallMoveAttr {
  private mirrorMove: boolean;
  constructor(mirrorMove: boolean, invalidMoves: ReadonlySet<Moves> = new Set()) {
    super();
    this.mirrorMove = mirrorMove;
    this.invalidMoves = invalidMoves;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    this.hasTarget = this.mirrorMove;
    const lastMove = this.mirrorMove ? target.getLastXMoves()[0].move : globalScene.currentBattle.lastMove;
    return super.apply(user, target, allMoves[lastMove], args);
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => {
      if (this.mirrorMove) {
        const lastMove = target.getLastXMoves()[0]?.move;
        return !!lastMove && !this.invalidMoves.has(lastMove);
      } else {
        const lastMove = globalScene.currentBattle.lastMove;
        return lastMove !== undefined && !this.invalidMoves.has(lastMove);
      }
    };
  }
}

/**
 * Attribute used for moves that causes the target to repeat their last used move.
 *
 * Used for [Instruct](https://bulbapedia.bulbagarden.net/wiki/Instruct_(move)).
*/
export class RepeatMoveAttr extends MoveEffectAttr {
  constructor() {
    super(false, { trigger: MoveEffectTrigger.POST_APPLY }); // needed to ensure correct protect interaction
  }

  /**
   * Forces the target to re-use their last used move again
   *
   * @param user {@linkcode Pokemon} that used the attack
   * @param target {@linkcode Pokemon} targeted by the attack
   * @param move N/A
   * @param args N/A
   * @returns `true` if the move succeeds
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    // get the last move used (excluding status based failures) as well as the corresponding moveset slot
    const lastMove = target.getLastXMoves(-1).find(m => m.move !== Moves.NONE)!;
    const movesetMove = target.getMoveset().find(m => m.moveId === lastMove.move)!;
    // If the last move used can hit more than one target or has variable targets,
    // re-compute the targets for the attack
    // (mainly for alternating double/single battle shenanigans)
    // Rampaging moves (e.g. Outrage) are not included due to being incompatible with Instruct
    // TODO: Fix this once dragon darts gets smart targeting
    let moveTargets = movesetMove.getMove().isMultiTarget() ? getMoveTargets(target, lastMove.move).targets : lastMove.targets;

    /** In the event the instructed move's only target is a fainted opponent, redirect it to an alive ally if possible
    Normally, all yet-unexecuted move phases would swap over when the enemy in question faints
    (see `redirectPokemonMoves` in `battle-scene.ts`),
    but since instruct adds a new move phase pre-emptively, we need to handle this interaction manually.
    */
    const firstTarget = globalScene.getField()[moveTargets[0]];
    if (globalScene.currentBattle.double && moveTargets.length === 1 && firstTarget.isFainted() && firstTarget !== target.getAlly()) {
      const ally = firstTarget.getAlly();
      if (!isNullOrUndefined(ally) && ally.isActive()) { // ally exists, is not dead and can sponge the blast
        moveTargets = [ ally.getBattlerIndex() ];
      }
    }

    globalScene.queueMessage(i18next.t("moveTriggers:instructingMove", {
      userPokemonName: getPokemonNameWithAffix(user),
      targetPokemonName: getPokemonNameWithAffix(target)
    }));
    target.getMoveQueue().unshift({ move: lastMove.move, targets: moveTargets, ignorePP: false });
    target.turnData.extraTurns++;
    globalScene.appendToPhase(new MovePhase(target, moveTargets, movesetMove), MoveEndPhase);
    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => {
      const lastMove = target.getLastXMoves(-1).find(m => m.move !== Moves.NONE);
      const movesetMove = target.getMoveset().find(m => m.moveId === lastMove?.move);
      const uninstructableMoves = [
        // Locking/Continually Executed moves
        Moves.OUTRAGE,
        Moves.RAGING_FURY,
        Moves.ROLLOUT,
        Moves.PETAL_DANCE,
        Moves.THRASH,
        Moves.ICE_BALL,
        // Multi-turn Moves
        Moves.BIDE,
        Moves.SHELL_TRAP,
        Moves.BEAK_BLAST,
        Moves.FOCUS_PUNCH,
        // "First Turn Only" moves
        Moves.FAKE_OUT,
        Moves.FIRST_IMPRESSION,
        Moves.MAT_BLOCK,
        // Moves with a recharge turn
        Moves.HYPER_BEAM,
        Moves.ETERNABEAM,
        Moves.FRENZY_PLANT,
        Moves.BLAST_BURN,
        Moves.HYDRO_CANNON,
        Moves.GIGA_IMPACT,
        Moves.PRISMATIC_LASER,
        Moves.ROAR_OF_TIME,
        Moves.ROCK_WRECKER,
        Moves.METEOR_ASSAULT,
        // Charging & 2-turn moves
        Moves.DIG,
        Moves.FLY,
        Moves.BOUNCE,
        Moves.SHADOW_FORCE,
        Moves.PHANTOM_FORCE,
        Moves.DIVE,
        Moves.ELECTRO_SHOT,
        Moves.ICE_BURN,
        Moves.GEOMANCY,
        Moves.FREEZE_SHOCK,
        Moves.SKY_DROP,
        Moves.SKY_ATTACK,
        Moves.SKULL_BASH,
        Moves.SOLAR_BEAM,
        Moves.SOLAR_BLADE,
        Moves.METEOR_BEAM,
        // Other moves
        Moves.INSTRUCT,
        Moves.KINGS_SHIELD,
        Moves.SKETCH,
        Moves.TRANSFORM,
        Moves.MIMIC,
        Moves.STRUGGLE,
        // TODO: Add Max/G-Move blockage if or when they are implemented
      ];

      if (!lastMove?.move // no move to instruct
        || !movesetMove // called move not in target's moveset (forgetting the move, etc.)
        || movesetMove.ppUsed === movesetMove.getMovePp() // move out of pp
        || allMoves[lastMove.move].isChargingMove() // called move is a charging/recharging move
        || uninstructableMoves.includes(lastMove.move)) { // called move is in the banlist
        return false;
      }
      return true;
    };
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    // TODO: Make the AI actually use instruct
    /* Ideally, the AI would score instruct based on the scorings of the on-field pokemons'
    * last used moves at the time of using Instruct (by the time the instructor gets to act)
    * with respect to the user's side.
    * In 99.9% of cases, this would be the pokemon's ally (unless the target had last
    * used a move like Decorate on the user or its ally)
    */
    return 2;
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
   * @param move N/A
   * @param args N/A
   * @returns `true`
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    // Null checks can be skipped due to condition function
    const lastMove = target.getLastXMoves()[0];
    const movesetMove = target.getMoveset().find(m => m.moveId === lastMove.move)!;
    const lastPpUsed = movesetMove.ppUsed;
    movesetMove.ppUsed = Math.min((lastPpUsed) + this.reduction, movesetMove.getMovePp());

    const message = i18next.t("battle:ppReduced", { targetName: getPokemonNameWithAffix(target), moveName: movesetMove.getName(), reduction: (movesetMove.ppUsed) - lastPpUsed });
    globalScene.eventTarget.dispatchEvent(new MoveUsedEvent(target.id, movesetMove.getMove(), movesetMove.ppUsed));
    globalScene.queueMessage(message);

    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => {
      const lastMove = target.getLastXMoves()[0];
      if (lastMove) {
        const movesetMove = target.getMoveset().find(m => m.moveId === lastMove.move);
        return !!movesetMove?.getPpRatio();
      }
      return false;
    };
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    const lastMove = target.getLastXMoves()[0];
    if (lastMove) {
      const movesetMove = target.getMoveset().find(m => m.moveId === lastMove.move);
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
      const movesetMove = target.getMoveset().find(m => m.moveId === lastMove.move);
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

  if (allMoves[copiableMove.move].isChargingMove() && copiableMove.result === MoveResult.OTHER) {
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

    const thisMoveIndex = user.getMoveset().findIndex(m => m.moveId === move.id);

    if (thisMoveIndex === -1) {
      return false;
    }

    user.summonData.moveset = user.getMoveset().slice(0);
    user.summonData.moveset[thisMoveIndex] = new PokemonMove(copiedMove.id, 0, 0);

    globalScene.queueMessage(i18next.t("moveTriggers:copiedMove", { pokemonName: getPokemonNameWithAffix(user), moveName: copiedMove.name }));

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

    const targetMove = target.getLastXMoves(-1)
      .find(m => m.move !== Moves.NONE && m.move !== Moves.STRUGGLE && !m.virtual);
    if (!targetMove) {
      return false;
    }

    const sketchedMove = allMoves[targetMove.move];
    const sketchIndex = user.getMoveset().findIndex(m => m.moveId === move.id);
    if (sketchIndex === -1) {
      return false;
    }

    user.setMove(sketchIndex, sketchedMove.id);

    globalScene.queueMessage(i18next.t("moveTriggers:sketchedMove", { pokemonName: getPokemonNameWithAffix(user), moveName: sketchedMove.name }));

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

      if (user.getMoveset().find(m => m.moveId === targetMove.move)) {
        return false;
      }

      return true;
    };
  }
}

export class AbilityChangeAttr extends MoveEffectAttr {
  public ability: Abilities;

  constructor(ability: Abilities, selfTarget?: boolean) {
    super(selfTarget);

    this.ability = ability;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const moveTarget = this.selfTarget ? user : target;

    globalScene.triggerPokemonFormChange(moveTarget, SpeciesFormChangeRevertWeatherFormTrigger);
    if (moveTarget.breakIllusion()) {
      globalScene.queueMessage(i18next.t("abilityTriggers:illusionBreak", { pokemonName: getPokemonNameWithAffix(moveTarget) }));
    }
    globalScene.queueMessage(i18next.t("moveTriggers:acquiredAbility", { pokemonName: getPokemonNameWithAffix(moveTarget), abilityName: allAbilities[this.ability].name }));
    moveTarget.setTempAbility(allAbilities[this.ability]);
    globalScene.triggerPokemonFormChange(moveTarget, SpeciesFormChangeRevertWeatherFormTrigger);
    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => (this.selfTarget ? user : target).getAbility().isReplaceable && (this.selfTarget ? user : target).getAbility().id !== this.ability;
  }
}

export class AbilityCopyAttr extends MoveEffectAttr {
  public copyToPartner: boolean;

  constructor(copyToPartner: boolean = false) {
    super(false);

    this.copyToPartner = copyToPartner;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    globalScene.queueMessage(i18next.t("moveTriggers:copiedTargetAbility", { pokemonName: getPokemonNameWithAffix(user), targetName: getPokemonNameWithAffix(target), abilityName: allAbilities[target.getAbility().id].name }));

    user.setTempAbility(target.getAbility());
    const ally = user.getAlly();

    if (this.copyToPartner && globalScene.currentBattle?.double && !isNullOrUndefined(ally) && ally.hp) { // TODO is this the best way to check that the ally is active?
      globalScene.queueMessage(i18next.t("moveTriggers:copiedTargetAbility", { pokemonName: getPokemonNameWithAffix(ally), targetName: getPokemonNameWithAffix(target), abilityName: allAbilities[target.getAbility().id].name }));
      ally.setTempAbility(target.getAbility());
    }

    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => {
      const ally = user.getAlly();
      let ret = target.getAbility().isCopiable && user.getAbility().isReplaceable;
      if (this.copyToPartner && globalScene.currentBattle?.double) {
        ret = ret && (!ally?.hp || ally?.getAbility().isReplaceable);
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
    super(false);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    globalScene.queueMessage(i18next.t("moveTriggers:acquiredAbility", { pokemonName: getPokemonNameWithAffix(target), abilityName: allAbilities[user.getAbility().id].name }));

    target.setTempAbility(user.getAbility());

    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => user.getAbility().isCopiable && target.getAbility().isReplaceable && user.getAbility().id !== target.getAbility().id;
  }
}

export class SwitchAbilitiesAttr extends MoveEffectAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const tempAbility = user.getAbility();

    globalScene.queueMessage(i18next.t("moveTriggers:swappedAbilitiesWithTarget", { pokemonName: getPokemonNameWithAffix(user) }));

    user.setTempAbility(target.getAbility());
    target.setTempAbility(tempAbility);
    // Swaps Forecast/Flower Gift from Castform/Cherrim
    globalScene.arena.triggerWeatherBasedFormChangesToNormal();

    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => [user, target].every(pkmn => pkmn.getAbility().isSwappable);
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

    globalScene.queueMessage(i18next.t("moveTriggers:suppressAbilities", { pokemonName: getPokemonNameWithAffix(target) }));

    target.suppressAbility();

    globalScene.arena.triggerWeatherBasedFormChangesToNormal();

    return true;
  }

  /** Causes the effect to fail when the target's ability is unsupressable or already suppressed. */
  getCondition(): MoveConditionFunc {
    return (user, target, move) => target.getAbility().isSuppressable && !target.summonData.abilitySuppressed;
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

/**
 * Used by Transform
 */
export class TransformAttr extends MoveEffectAttr {
  override apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    globalScene.unshiftPhase(new PokemonTransformPhase(user.getBattlerIndex(), target.getBattlerIndex()));

    globalScene.queueMessage(i18next.t("moveTriggers:transformedIntoTarget", { pokemonName: getPokemonNameWithAffix(user), targetName: getPokemonNameWithAffix(target) }));

    return true;
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
   * Swaps the user's and target's corresponding current
   * {@linkcode EffectiveStat | stat} values
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

      globalScene.queueMessage(i18next.t("moveTriggers:switchedStat", {
        pokemonName: getPokemonNameWithAffix(user),
        stat: i18next.t(getStatKey(this.stat)),
      }));

      return true;
    }
    return false;
  }
}

/**
 * Attribute used to switch the user's own stats.
 * Used by Power Shift.
 * @extends MoveEffectAttr
 */
export class ShiftStatAttr extends MoveEffectAttr {
  private statToSwitch: EffectiveStat;
  private statToSwitchWith: EffectiveStat;

  constructor(statToSwitch: EffectiveStat, statToSwitchWith: EffectiveStat) {
    super();

    this.statToSwitch = statToSwitch;
    this.statToSwitchWith = statToSwitchWith;
  }

  /**
   * Switches the user's stats based on the {@linkcode statToSwitch} and {@linkcode statToSwitchWith} attributes.
   * @param {Pokemon} user the {@linkcode Pokemon} that used the move
   * @param target n/a
   * @param move n/a
   * @param args n/a
   * @returns whether the effect was applied
   */
  override apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const firstStat = user.getStat(this.statToSwitch, false);
    const secondStat = user.getStat(this.statToSwitchWith, false);

    user.setStat(this.statToSwitch, secondStat, false);
    user.setStat(this.statToSwitchWith, firstStat, false);

    globalScene.queueMessage(i18next.t("moveTriggers:shiftedStats", {
      pokemonName: getPokemonNameWithAffix(user),
      statToSwitch: i18next.t(getStatKey(this.statToSwitch)),
      statToSwitchWith: i18next.t(getStatKey(this.statToSwitchWith))
    }));

    return true;
  }

  /**
   * Encourages the user to use the move if the stat to switch with is greater than the stat to switch.
   * @param {Pokemon} user the {@linkcode Pokemon} that used the move
   * @param target n/a
   * @param move n/a
   * @returns number of points to add to the user's benefit score
   */
  override getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    return user.getStat(this.statToSwitchWith, false) > user.getStat(this.statToSwitch, false) ? 10 : 0;
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

      globalScene.queueMessage(i18next.t(this.msgKey, { pokemonName: getPokemonNameWithAffix(user) }));

      return true;
    }
    return false;
  }
}

export class DiscourageFrequentUseAttr extends MoveAttr {
  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
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
    super(true, {firstHitOnly: true });
  }

  apply(user: Pokemon, target: Pokemon, move: Move): boolean {
    globalScene.currentBattle.moneyScattered += globalScene.getWaveMoneyAmount(0.2);
    globalScene.queueMessage(i18next.t("moveTriggers:coinsScatteredEverywhere"));
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
    super(true, { trigger: MoveEffectTrigger.PRE_APPLY });
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
    globalScene.queueMessage(`${i18next.t("moveTriggers:tryingToTakeFoeDown", { pokemonName: getPokemonNameWithAffix(user) })}`);
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
    super(true);
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
      const movesetMoveIds = user.getMoveset().map(m => m.moveId);
      user.getMoveHistory().map(m => {
        if (m.move !== move.id && movesetMoveIds.find(mm => mm === m.move)) {
          uniqueUsedMoveIds.add(m.move);
        }
      });
      return uniqueUsedMoveIds.size >= movesetMoveIds.length - 1;
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
    const targetVal = args[0] as NumberHolder;
    targetVal.value = this.targetChangeFunc(user, target, move);
    return true;
  }
}

/**
 * Attribute for {@linkcode Moves.AFTER_YOU}
 *
 * [After You - Move | Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/After_You_(move))
 */
export class AfterYouAttr extends MoveEffectAttr {
  /**
   * Allows the target of this move to act right after the user.
   *
   * @param user {@linkcode Pokemon} that is using the move.
   * @param target {@linkcode Pokemon} that will move right after this move is used.
   * @param move {@linkcode Move} {@linkcode Moves.AFTER_YOU}
   * @param _args N/A
   * @returns true
   */
  override apply(user: Pokemon, target: Pokemon, _move: Move, _args: any[]): boolean {
    globalScene.queueMessage(i18next.t("moveTriggers:afterYou", { targetName: getPokemonNameWithAffix(target) }));

    //Will find next acting phase of the targeted pokémon, delete it and queue it next on successful delete.
    const nextAttackPhase = globalScene.findPhase<MovePhase>((phase) => phase.pokemon === target);
    if (nextAttackPhase && globalScene.tryRemovePhase((phase: MovePhase) => phase.pokemon === target)) {
      globalScene.prependToPhase(new MovePhase(target, [ ...nextAttackPhase.targets ], nextAttackPhase.move), MovePhase);
    }

    return true;
  }
}

/**
 * Move effect to force the target to move last, ignoring priority.
 * If applied to multiple targets, they move in speed order after all other moves.
 * @extends MoveEffectAttr
 */
export class ForceLastAttr extends MoveEffectAttr {
  /**
   * Forces the target of this move to move last.
   *
   * @param user {@linkcode Pokemon} that is using the move.
   * @param target {@linkcode Pokemon} that will be forced to move last.
   * @param move {@linkcode Move} {@linkcode Moves.QUASH}
   * @param _args N/A
   * @returns true
   */
  override apply(user: Pokemon, target: Pokemon, _move: Move, _args: any[]): boolean {
    globalScene.queueMessage(i18next.t("moveTriggers:forceLast", { targetPokemonName: getPokemonNameWithAffix(target) }));

    const targetMovePhase = globalScene.findPhase<MovePhase>((phase) => phase.pokemon === target);
    if (targetMovePhase && !targetMovePhase.isForcedLast() && globalScene.tryRemovePhase((phase: MovePhase) => phase.pokemon === target)) {
      // Finding the phase to insert the move in front of -
      // Either the end of the turn or in front of another, slower move which has also been forced last
      const prependPhase = globalScene.findPhase((phase) =>
        [ MovePhase, MoveEndPhase ].every(cls => !(phase instanceof cls))
        || (phase instanceof MovePhase) && phaseForcedSlower(phase, target, !!globalScene.arena.getTag(ArenaTagType.TRICK_ROOM))
      );
      if (prependPhase) {
        globalScene.phaseQueue.splice(
          globalScene.phaseQueue.indexOf(prependPhase),
          0,
          new MovePhase(target, [ ...targetMovePhase.targets ], targetMovePhase.move, false, false, false, true)
        );
      }
    }
    return true;
  }
}

/** Returns whether a {@linkcode MovePhase} has been forced last and the corresponding pokemon is slower than {@linkcode target} */
const phaseForcedSlower = (phase: MovePhase, target: Pokemon, trickRoom: boolean): boolean => {
  let slower: boolean;
  // quashed pokemon still have speed ties
  if (phase.pokemon.getEffectiveStat(Stat.SPD) === target.getEffectiveStat(Stat.SPD)) {
    slower = !!target.randSeedInt(2);
  } else {
    slower = !trickRoom ? phase.pokemon.getEffectiveStat(Stat.SPD) < target.getEffectiveStat(Stat.SPD) : phase.pokemon.getEffectiveStat(Stat.SPD) > target.getEffectiveStat(Stat.SPD);
  }
  return phase.isForcedLast() && slower;
};

const failOnGravityCondition: MoveConditionFunc = (user, target, move) => !globalScene.arena.getTag(ArenaTagType.GRAVITY);

const failOnBossCondition: MoveConditionFunc = (user, target, move) => !target.isBossImmune();

const failIfSingleBattle: MoveConditionFunc = (user, target, move) => globalScene.currentBattle.double;

const failIfDampCondition: MoveConditionFunc = (user, target, move) => {
  const cancelled = new BooleanHolder(false);
  globalScene.getField(true).map(p=>applyAbAttrs(FieldPreventExplosiveMovesAbAttr, p, cancelled));
  // Queue a message if an ability prevented usage of the move
  if (cancelled.value) {
    globalScene.queueMessage(i18next.t("moveTriggers:cannotUseMove", { pokemonName: getPokemonNameWithAffix(user), moveName: move.name }));
  }
  return !cancelled.value;
};

const userSleptOrComatoseCondition: MoveConditionFunc = (user: Pokemon, target: Pokemon, move: Move) =>  user.status?.effect === StatusEffect.SLEEP || user.hasAbility(Abilities.COMATOSE);

const targetSleptOrComatoseCondition: MoveConditionFunc = (user: Pokemon, target: Pokemon, move: Move) =>  target.status?.effect === StatusEffect.SLEEP || target.hasAbility(Abilities.COMATOSE);

const failIfLastCondition: MoveConditionFunc = (user: Pokemon, target: Pokemon, move: Move) => globalScene.phaseQueue.find(phase => phase instanceof MovePhase) !== undefined;

const failIfLastInPartyCondition: MoveConditionFunc = (user: Pokemon, target: Pokemon, move: Move) => {
  const party: Pokemon[] = user.isPlayer() ? globalScene.getPlayerParty() : globalScene.getEnemyParty();
  return party.some(pokemon => pokemon.isActive() && !pokemon.isOnField());
};

const failIfGhostTypeCondition: MoveConditionFunc = (user: Pokemon, target: Pokemon, move: Move) => !target.isOfType(PokemonType.GHOST);

const failIfNoTargetHeldItemsCondition: MoveConditionFunc = (user: Pokemon, target: Pokemon, move: Move) => target.getHeldItems().filter(i => i.isTransferable)?.length > 0;

const attackedByItemMessageFunc = (user: Pokemon, target: Pokemon, move: Move) => {
  const heldItems = target.getHeldItems().filter(i => i.isTransferable);
  if (heldItems.length === 0) {
    return "";
  }
  const itemName = heldItems[0]?.type?.name ?? "item";
  const message: string = i18next.t("moveTriggers:attackedByItem", { pokemonName: getPokemonNameWithAffix(target), itemName: itemName });
  return message;
};

export type MoveAttrFilter = (attr: MoveAttr) => boolean;

function applyMoveAttrsInternal(
  attrFilter: MoveAttrFilter,
  user: Pokemon | null,
  target: Pokemon | null,
  move: Move,
  args: any[],
): void {
  move.attrs.filter((attr) => attrFilter(attr)).forEach((attr) => attr.apply(user, target, move, args));
}

function applyMoveChargeAttrsInternal(
  attrFilter: MoveAttrFilter,
  user: Pokemon | null,
  target: Pokemon | null,
  move: ChargingMove,
  args: any[],
): void {
  move.chargeAttrs.filter((attr) => attrFilter(attr)).forEach((attr) => attr.apply(user, target, move, args));
}

export function applyMoveAttrs(
  attrType: Constructor<MoveAttr>,
  user: Pokemon | null,
  target: Pokemon | null,
  move: Move,
  ...args: any[]
): void {
  applyMoveAttrsInternal((attr: MoveAttr) => attr instanceof attrType, user, target, move, args);
}

export function applyFilteredMoveAttrs(
  attrFilter: MoveAttrFilter,
  user: Pokemon,
  target: Pokemon | null,
  move: Move,
  ...args: any[]
): void {
  applyMoveAttrsInternal(attrFilter, user, target, move, args);
}

export function applyMoveChargeAttrs(
  attrType: Constructor<MoveAttr>,
  user: Pokemon | null,
  target: Pokemon | null,
  move: ChargingMove,
  ...args: any[]
): void {
  applyMoveChargeAttrsInternal((attr: MoveAttr) => attr instanceof attrType, user, target, move, args);
}

export class MoveCondition {
  protected func: MoveConditionFunc;

  constructor(func: MoveConditionFunc) {
    this.func = func;
  }

  apply(user: Pokemon, target: Pokemon, move: Move): boolean {
    return this.func(user, target, move);
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    return 0;
  }
}

export class FirstMoveCondition extends MoveCondition {
  constructor() {
    super((user, target, move) => user.battleSummonData?.waveTurnCount === 1);
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    return this.apply(user, target, move) ? 10 : -20;
  }
}

/**
 * Condition used by the move {@link https://bulbapedia.bulbagarden.net/wiki/Upper_Hand_(move) | Upper Hand}.
 * Moves with this condition are only successful when the target has selected
 * a high-priority attack (after factoring in priority-boosting effects) and
 * hasn't moved yet this turn.
 */
export class UpperHandCondition extends MoveCondition {
  constructor() {
    super((user, target, move) => {
      const targetCommand = globalScene.currentBattle.turnCommands[target.getBattlerIndex()];

      return !!targetCommand
        && targetCommand.command === Command.FIGHT
        && !target.turnData.acted
        && !!targetCommand.move?.move
        && allMoves[targetCommand.move.move].category !== MoveCategory.STATUS
        && allMoves[targetCommand.move.move].getPriority(target) > 0;
    });
  }
}

export class hitsSameTypeAttr extends VariableMoveTypeMultiplierAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const multiplier = args[0] as NumberHolder;
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

    const [ targetMove ] = target.getLastXMoves(1); // target's most recent move
    if (!targetMove) {
      return false;
    }

    const moveData = allMoves[targetMove.move];
    if (moveData.type === PokemonType.STELLAR || moveData.type === PokemonType.UNKNOWN) {
      return false;
    }
    const userTypes = user.getTypes();
    const validTypes = this.getTypeResistances(globalScene.gameMode, moveData.type).filter(t => !userTypes.includes(t)); // valid types are ones that are not already the user's types
    if (!validTypes.length) {
      return false;
    }
    const type = validTypes[user.randSeedInt(validTypes.length)];
    user.summonData.types = [ type ];
    globalScene.queueMessage(i18next.t("battle:transformedIntoType", { pokemonName: getPokemonNameWithAffix(user), type: toReadableString(PokemonType[type]) }));
    user.updateInfo();

    return true;
  }

  /**
   * Retrieve the types resisting a given type. Used by Conversion 2
   * @returns An array populated with Types, or an empty array if no resistances exist (Unknown or Stellar type)
   */
  getTypeResistances(gameMode: GameMode, type: number): PokemonType[] {
    const typeResistances: PokemonType[] = [];

    for (let i = 0; i < Object.keys(PokemonType).length; i++) {
      const multiplier = new NumberHolder(1);
      multiplier.value = getTypeDamageMultiplier(type, i);
      applyChallenges(ChallengeType.TYPE_EFFECTIVENESS, multiplier);
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

    globalScene.queueMessage(i18next.t("moveTriggers:exposedMove", { pokemonName: getPokemonNameWithAffix(user), targetPokemonName: getPokemonNameWithAffix(target) }));

    return true;
  }
}


const unknownTypeCondition: MoveConditionFunc = (user, target, move) => !user.getTypes().includes(PokemonType.UNKNOWN);

export type MoveTargetSet = {
  targets: BattlerIndex[];
  multiple: boolean;
};

export function getMoveTargets(user: Pokemon, move: Moves, replaceTarget?: MoveTarget): MoveTargetSet {
  const variableTarget = new NumberHolder(0);
  user.getOpponents(false).forEach(p => applyMoveAttrs(VariableTargetAttr, user, p, allMoves[move], variableTarget));

  let moveTarget: MoveTarget | undefined;
  if (allMoves[move].hasAttr(VariableTargetAttr)) {
    moveTarget = variableTarget.value;
  } else if (replaceTarget !== undefined) {
    moveTarget = replaceTarget;
  } else if (move) {
    moveTarget = allMoves[move].moveTarget;
  } else if (move === undefined) {
    moveTarget = MoveTarget.NEAR_ENEMY;
  }
  const opponents = user.getOpponents(false);

  let set: Pokemon[] = [];
  let multiple = false;
  const ally: Pokemon | undefined = user.getAlly();

  switch (moveTarget) {
    case MoveTarget.USER:
    case MoveTarget.PARTY:
      set = [ user ];
      break;
    case MoveTarget.NEAR_OTHER:
    case MoveTarget.OTHER:
    case MoveTarget.ALL_NEAR_OTHERS:
    case MoveTarget.ALL_OTHERS:
      set = !isNullOrUndefined(ally) ? (opponents.concat([ ally ])) : opponents;
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
      set = !isNullOrUndefined(ally) ? [ ally ] : [];
      break;
    case MoveTarget.USER_OR_NEAR_ALLY:
    case MoveTarget.USER_AND_ALLIES:
    case MoveTarget.USER_SIDE:
      set = !isNullOrUndefined(ally) ? [ user, ally ] : [ user ];
      multiple = moveTarget !== MoveTarget.USER_OR_NEAR_ALLY;
      break;
    case MoveTarget.ALL:
    case MoveTarget.BOTH_SIDES:
      set = (!isNullOrUndefined(ally) ? [ user, ally ] : [ user ]).concat(opponents);
      multiple = true;
      break;
    case MoveTarget.CURSE:
      const extraTargets = !isNullOrUndefined(ally) ? [ ally ] : [];
      set = user.getTypes(true).includes(PokemonType.GHOST) ? (opponents.concat(extraTargets)) : [ user ];
      break;
  }

  return { targets: set.filter(p => p?.isActive(true)).map(p => p.getBattlerIndex()).filter(t => t !== undefined), multiple };
}

export const allMoves: Move[] = [
  new SelfStatusMove(Moves.NONE, PokemonType.NORMAL, MoveCategory.STATUS, -1, -1, 0, 1),
];

export const selfStatLowerMoves: Moves[] = [];

export function initMoves() {
  allMoves.push(
    new AttackMove(Moves.POUND, PokemonType.NORMAL, MoveCategory.PHYSICAL, 40, 100, 35, -1, 0, 1),
    new AttackMove(Moves.KARATE_CHOP, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 50, 100, 25, -1, 0, 1)
      .attr(HighCritAttr),
    new AttackMove(Moves.DOUBLE_SLAP, PokemonType.NORMAL, MoveCategory.PHYSICAL, 15, 85, 10, -1, 0, 1)
      .attr(MultiHitAttr),
    new AttackMove(Moves.COMET_PUNCH, PokemonType.NORMAL, MoveCategory.PHYSICAL, 18, 85, 15, -1, 0, 1)
      .attr(MultiHitAttr)
      .punchingMove(),
    new AttackMove(Moves.MEGA_PUNCH, PokemonType.NORMAL, MoveCategory.PHYSICAL, 80, 85, 20, -1, 0, 1)
      .punchingMove(),
    new AttackMove(Moves.PAY_DAY, PokemonType.NORMAL, MoveCategory.PHYSICAL, 40, 100, 20, -1, 0, 1)
      .attr(MoneyAttr)
      .makesContact(false),
    new AttackMove(Moves.FIRE_PUNCH, PokemonType.FIRE, MoveCategory.PHYSICAL, 75, 100, 15, 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .punchingMove(),
    new AttackMove(Moves.ICE_PUNCH, PokemonType.ICE, MoveCategory.PHYSICAL, 75, 100, 15, 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.FREEZE)
      .punchingMove(),
    new AttackMove(Moves.THUNDER_PUNCH, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 75, 100, 15, 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .punchingMove(),
    new AttackMove(Moves.SCRATCH, PokemonType.NORMAL, MoveCategory.PHYSICAL, 40, 100, 35, -1, 0, 1),
    new AttackMove(Moves.VISE_GRIP, PokemonType.NORMAL, MoveCategory.PHYSICAL, 55, 100, 30, -1, 0, 1),
    new AttackMove(Moves.GUILLOTINE, PokemonType.NORMAL, MoveCategory.PHYSICAL, 200, 30, 5, -1, 0, 1)
      .attr(OneHitKOAttr)
      .attr(OneHitKOAccuracyAttr),
    new ChargingAttackMove(Moves.RAZOR_WIND, PokemonType.NORMAL, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 1)
      .chargeText(i18next.t("moveTriggers:whippedUpAWhirlwind", { pokemonName: "{USER}" }))
      .attr(HighCritAttr)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new SelfStatusMove(Moves.SWORDS_DANCE, PokemonType.NORMAL, -1, 20, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.ATK ], 2, true)
      .danceMove(),
    new AttackMove(Moves.CUT, PokemonType.NORMAL, MoveCategory.PHYSICAL, 50, 95, 30, -1, 0, 1)
      .slicingMove(),
    new AttackMove(Moves.GUST, PokemonType.FLYING, MoveCategory.SPECIAL, 40, 100, 35, -1, 0, 1)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.FLYING)
      .windMove(),
    new AttackMove(Moves.WING_ATTACK, PokemonType.FLYING, MoveCategory.PHYSICAL, 60, 100, 35, -1, 0, 1),
    new StatusMove(Moves.WHIRLWIND, PokemonType.NORMAL, -1, 20, -1, -6, 1)
      .attr(ForceSwitchOutAttr, false, SwitchType.FORCE_SWITCH)
      .ignoresSubstitute()
      .hidesTarget()
      .windMove()
      .reflectable(),
    new ChargingAttackMove(Moves.FLY, PokemonType.FLYING, MoveCategory.PHYSICAL, 90, 95, 15, -1, 0, 1)
      .chargeText(i18next.t("moveTriggers:flewUpHigh", { pokemonName: "{USER}" }))
      .chargeAttr(SemiInvulnerableAttr, BattlerTagType.FLYING)
      .condition(failOnGravityCondition),
    new AttackMove(Moves.BIND, PokemonType.NORMAL, MoveCategory.PHYSICAL, 15, 85, 20, -1, 0, 1)
      .attr(TrapAttr, BattlerTagType.BIND),
    new AttackMove(Moves.SLAM, PokemonType.NORMAL, MoveCategory.PHYSICAL, 80, 75, 20, -1, 0, 1),
    new AttackMove(Moves.VINE_WHIP, PokemonType.GRASS, MoveCategory.PHYSICAL, 45, 100, 25, -1, 0, 1),
    new AttackMove(Moves.STOMP, PokemonType.NORMAL, MoveCategory.PHYSICAL, 65, 100, 20, 30, 0, 1)
      .attr(AlwaysHitMinimizeAttr)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.MINIMIZED)
      .attr(FlinchAttr),
    new AttackMove(Moves.DOUBLE_KICK, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 30, 100, 30, -1, 0, 1)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.MEGA_KICK, PokemonType.NORMAL, MoveCategory.PHYSICAL, 120, 75, 5, -1, 0, 1),
    new AttackMove(Moves.JUMP_KICK, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 100, 95, 10, -1, 0, 1)
      .attr(MissEffectAttr, crashDamageFunc)
      .attr(NoEffectAttr, crashDamageFunc)
      .condition(failOnGravityCondition)
      .recklessMove(),
    new AttackMove(Moves.ROLLING_KICK, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 60, 85, 15, 30, 0, 1)
      .attr(FlinchAttr),
    new StatusMove(Moves.SAND_ATTACK, PokemonType.GROUND, 100, 15, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.ACC ], -1)
      .reflectable(),
    new AttackMove(Moves.HEADBUTT, PokemonType.NORMAL, MoveCategory.PHYSICAL, 70, 100, 15, 30, 0, 1)
      .attr(FlinchAttr),
    new AttackMove(Moves.HORN_ATTACK, PokemonType.NORMAL, MoveCategory.PHYSICAL, 65, 100, 25, -1, 0, 1),
    new AttackMove(Moves.FURY_ATTACK, PokemonType.NORMAL, MoveCategory.PHYSICAL, 15, 85, 20, -1, 0, 1)
      .attr(MultiHitAttr),
    new AttackMove(Moves.HORN_DRILL, PokemonType.NORMAL, MoveCategory.PHYSICAL, 200, 30, 5, -1, 0, 1)
      .attr(OneHitKOAttr)
      .attr(OneHitKOAccuracyAttr),
    new AttackMove(Moves.TACKLE, PokemonType.NORMAL, MoveCategory.PHYSICAL, 40, 100, 35, -1, 0, 1),
    new AttackMove(Moves.BODY_SLAM, PokemonType.NORMAL, MoveCategory.PHYSICAL, 85, 100, 15, 30, 0, 1)
      .attr(AlwaysHitMinimizeAttr)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.MINIMIZED)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.WRAP, PokemonType.NORMAL, MoveCategory.PHYSICAL, 15, 90, 20, -1, 0, 1)
      .attr(TrapAttr, BattlerTagType.WRAP),
    new AttackMove(Moves.TAKE_DOWN, PokemonType.NORMAL, MoveCategory.PHYSICAL, 90, 85, 20, -1, 0, 1)
      .attr(RecoilAttr)
      .recklessMove(),
    new AttackMove(Moves.THRASH, PokemonType.NORMAL, MoveCategory.PHYSICAL, 120, 100, 10, -1, 0, 1)
      .attr(FrenzyAttr)
      .attr(MissEffectAttr, frenzyMissFunc)
      .attr(NoEffectAttr, frenzyMissFunc)
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new AttackMove(Moves.DOUBLE_EDGE, PokemonType.NORMAL, MoveCategory.PHYSICAL, 120, 100, 15, -1, 0, 1)
      .attr(RecoilAttr, false, 0.33)
      .recklessMove(),
    new StatusMove(Moves.TAIL_WHIP, PokemonType.NORMAL, 100, 30, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .reflectable(),
    new AttackMove(Moves.POISON_STING, PokemonType.POISON, MoveCategory.PHYSICAL, 15, 100, 35, 30, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .makesContact(false),
    new AttackMove(Moves.TWINEEDLE, PokemonType.BUG, MoveCategory.PHYSICAL, 25, 100, 20, 20, 0, 1)
      .attr(MultiHitAttr, MultiHitType._2)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .makesContact(false),
    new AttackMove(Moves.PIN_MISSILE, PokemonType.BUG, MoveCategory.PHYSICAL, 25, 95, 20, -1, 0, 1)
      .attr(MultiHitAttr)
      .makesContact(false),
    new StatusMove(Moves.LEER, PokemonType.NORMAL, 100, 30, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .reflectable(),
    new AttackMove(Moves.BITE, PokemonType.DARK, MoveCategory.PHYSICAL, 60, 100, 25, 30, 0, 1)
      .attr(FlinchAttr)
      .bitingMove(),
    new StatusMove(Moves.GROWL, PokemonType.NORMAL, 100, 40, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .reflectable(),
    new StatusMove(Moves.ROAR, PokemonType.NORMAL, -1, 20, -1, -6, 1)
      .attr(ForceSwitchOutAttr, false, SwitchType.FORCE_SWITCH)
      .soundBased()
      .hidesTarget()
      .reflectable(),
    new StatusMove(Moves.SING, PokemonType.NORMAL, 55, 15, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .soundBased()
      .reflectable(),
    new StatusMove(Moves.SUPERSONIC, PokemonType.NORMAL, 55, 20, -1, 0, 1)
      .attr(ConfuseAttr)
      .soundBased()
      .reflectable(),
    new AttackMove(Moves.SONIC_BOOM, PokemonType.NORMAL, MoveCategory.SPECIAL, -1, 90, 20, -1, 0, 1)
      .attr(FixedDamageAttr, 20),
    new StatusMove(Moves.DISABLE, PokemonType.NORMAL, 100, 20, -1, 0, 1)
      .attr(AddBattlerTagAttr, BattlerTagType.DISABLED, false, true)
      .condition((user, target, move) => {
        const lastRealMove = target.getLastXMoves(-1).find(m => !m.virtual);
        return !isNullOrUndefined(lastRealMove) && lastRealMove.move !== Moves.NONE && lastRealMove.move !== Moves.STRUGGLE;
      })
      .ignoresSubstitute()
      .reflectable(),
    new AttackMove(Moves.ACID, PokemonType.POISON, MoveCategory.SPECIAL, 40, 100, 30, 10, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.EMBER, PokemonType.FIRE, MoveCategory.SPECIAL, 40, 100, 25, 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.FLAMETHROWER, PokemonType.FIRE, MoveCategory.SPECIAL, 90, 100, 15, 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new StatusMove(Moves.MIST, PokemonType.ICE, -1, 30, -1, 0, 1)
      .attr(AddArenaTagAttr, ArenaTagType.MIST, 5, true)
      .target(MoveTarget.USER_SIDE),
    new AttackMove(Moves.WATER_GUN, PokemonType.WATER, MoveCategory.SPECIAL, 40, 100, 25, -1, 0, 1),
    new AttackMove(Moves.HYDRO_PUMP, PokemonType.WATER, MoveCategory.SPECIAL, 110, 80, 5, -1, 0, 1),
    new AttackMove(Moves.SURF, PokemonType.WATER, MoveCategory.SPECIAL, 90, 100, 15, -1, 0, 1)
      .target(MoveTarget.ALL_NEAR_OTHERS)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.UNDERWATER)
      .attr(GulpMissileTagAttr),
    new AttackMove(Moves.ICE_BEAM, PokemonType.ICE, MoveCategory.SPECIAL, 90, 100, 10, 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.FREEZE),
    new AttackMove(Moves.BLIZZARD, PokemonType.ICE, MoveCategory.SPECIAL, 110, 70, 5, 10, 0, 1)
      .attr(BlizzardAccuracyAttr)
      .attr(StatusEffectAttr, StatusEffect.FREEZE)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.PSYBEAM, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 65, 100, 20, 10, 0, 1)
      .attr(ConfuseAttr),
    new AttackMove(Moves.BUBBLE_BEAM, PokemonType.WATER, MoveCategory.SPECIAL, 65, 100, 20, 10, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1),
    new AttackMove(Moves.AURORA_BEAM, PokemonType.ICE, MoveCategory.SPECIAL, 65, 100, 20, 10, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1),
    new AttackMove(Moves.HYPER_BEAM, PokemonType.NORMAL, MoveCategory.SPECIAL, 150, 90, 5, -1, 0, 1)
      .attr(RechargeAttr),
    new AttackMove(Moves.PECK, PokemonType.FLYING, MoveCategory.PHYSICAL, 35, 100, 35, -1, 0, 1),
    new AttackMove(Moves.DRILL_PECK, PokemonType.FLYING, MoveCategory.PHYSICAL, 80, 100, 20, -1, 0, 1),
    new AttackMove(Moves.SUBMISSION, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 80, 80, 20, -1, 0, 1)
      .attr(RecoilAttr)
      .recklessMove(),
    new AttackMove(Moves.LOW_KICK, PokemonType.FIGHTING, MoveCategory.PHYSICAL, -1, 100, 20, -1, 0, 1)
      .attr(WeightPowerAttr),
    new AttackMove(Moves.COUNTER, PokemonType.FIGHTING, MoveCategory.PHYSICAL, -1, 100, 20, -1, -5, 1)
      .attr(CounterDamageAttr, (move: Move) => move.category === MoveCategory.PHYSICAL, 2)
      .target(MoveTarget.ATTACKER),
    new AttackMove(Moves.SEISMIC_TOSS, PokemonType.FIGHTING, MoveCategory.PHYSICAL, -1, 100, 20, -1, 0, 1)
      .attr(LevelDamageAttr),
    new AttackMove(Moves.STRENGTH, PokemonType.NORMAL, MoveCategory.PHYSICAL, 80, 100, 15, -1, 0, 1),
    new AttackMove(Moves.ABSORB, PokemonType.GRASS, MoveCategory.SPECIAL, 20, 100, 25, -1, 0, 1)
      .attr(HitHealAttr)
      .triageMove(),
    new AttackMove(Moves.MEGA_DRAIN, PokemonType.GRASS, MoveCategory.SPECIAL, 40, 100, 15, -1, 0, 1)
      .attr(HitHealAttr)
      .triageMove(),
    new StatusMove(Moves.LEECH_SEED, PokemonType.GRASS, 90, 10, -1, 0, 1)
      .attr(LeechSeedAttr)
      .condition((user, target, move) => !target.getTag(BattlerTagType.SEEDED) && !target.isOfType(PokemonType.GRASS))
      .reflectable(),
    new SelfStatusMove(Moves.GROWTH, PokemonType.NORMAL, -1, 20, -1, 0, 1)
      .attr(GrowthStatStageChangeAttr),
    new AttackMove(Moves.RAZOR_LEAF, PokemonType.GRASS, MoveCategory.PHYSICAL, 55, 95, 25, -1, 0, 1)
      .attr(HighCritAttr)
      .makesContact(false)
      .slicingMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new ChargingAttackMove(Moves.SOLAR_BEAM, PokemonType.GRASS, MoveCategory.SPECIAL, 120, 100, 10, -1, 0, 1)
      .chargeText(i18next.t("moveTriggers:tookInSunlight", { pokemonName: "{USER}" }))
      .chargeAttr(WeatherInstantChargeAttr, [ WeatherType.SUNNY, WeatherType.HARSH_SUN ])
      .attr(AntiSunlightPowerDecreaseAttr),
    new StatusMove(Moves.POISON_POWDER, PokemonType.POISON, 75, 35, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .powderMove()
      .reflectable(),
    new StatusMove(Moves.STUN_SPORE, PokemonType.GRASS, 75, 30, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .powderMove()
      .reflectable(),
    new StatusMove(Moves.SLEEP_POWDER, PokemonType.GRASS, 75, 15, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .powderMove()
      .reflectable(),
    new AttackMove(Moves.PETAL_DANCE, PokemonType.GRASS, MoveCategory.SPECIAL, 120, 100, 10, -1, 0, 1)
      .attr(FrenzyAttr)
      .attr(MissEffectAttr, frenzyMissFunc)
      .attr(NoEffectAttr, frenzyMissFunc)
      .makesContact()
      .danceMove()
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new StatusMove(Moves.STRING_SHOT, PokemonType.BUG, 95, 40, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -2)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .reflectable(),
    new AttackMove(Moves.DRAGON_RAGE, PokemonType.DRAGON, MoveCategory.SPECIAL, -1, 100, 10, -1, 0, 1)
      .attr(FixedDamageAttr, 40),
    new AttackMove(Moves.FIRE_SPIN, PokemonType.FIRE, MoveCategory.SPECIAL, 35, 85, 15, -1, 0, 1)
      .attr(TrapAttr, BattlerTagType.FIRE_SPIN),
    new AttackMove(Moves.THUNDER_SHOCK, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 40, 100, 30, 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.THUNDERBOLT, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 90, 100, 15, 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new StatusMove(Moves.THUNDER_WAVE, PokemonType.ELECTRIC, 90, 20, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .attr(RespectAttackTypeImmunityAttr)
      .reflectable(),
    new AttackMove(Moves.THUNDER, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 110, 70, 10, 30, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .attr(ThunderAccuracyAttr)
      .attr(HitsTagAttr, BattlerTagType.FLYING),
    new AttackMove(Moves.ROCK_THROW, PokemonType.ROCK, MoveCategory.PHYSICAL, 50, 90, 15, -1, 0, 1)
      .makesContact(false),
    new AttackMove(Moves.EARTHQUAKE, PokemonType.GROUND, MoveCategory.PHYSICAL, 100, 100, 10, -1, 0, 1)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.UNDERGROUND)
      .attr(MovePowerMultiplierAttr, (user, target, move) => globalScene.arena.getTerrainType() === TerrainType.GRASSY && target.isGrounded() ? 0.5 : 1)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.FISSURE, PokemonType.GROUND, MoveCategory.PHYSICAL, 200, 30, 5, -1, 0, 1)
      .attr(OneHitKOAttr)
      .attr(OneHitKOAccuracyAttr)
      .attr(HitsTagAttr, BattlerTagType.UNDERGROUND)
      .makesContact(false),
    new ChargingAttackMove(Moves.DIG, PokemonType.GROUND, MoveCategory.PHYSICAL, 80, 100, 10, -1, 0, 1)
      .chargeText(i18next.t("moveTriggers:dugAHole", { pokemonName: "{USER}" }))
      .chargeAttr(SemiInvulnerableAttr, BattlerTagType.UNDERGROUND),
    new StatusMove(Moves.TOXIC, PokemonType.POISON, 90, 10, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.TOXIC)
      .attr(ToxicAccuracyAttr)
      .reflectable(),
    new AttackMove(Moves.CONFUSION, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 50, 100, 25, 10, 0, 1)
      .attr(ConfuseAttr),
    new AttackMove(Moves.PSYCHIC, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 90, 100, 10, 10, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -1),
    new StatusMove(Moves.HYPNOSIS, PokemonType.PSYCHIC, 60, 20, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .reflectable(),
    new SelfStatusMove(Moves.MEDITATE, PokemonType.PSYCHIC, -1, 40, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.ATK ], 1, true),
    new SelfStatusMove(Moves.AGILITY, PokemonType.PSYCHIC, -1, 30, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.SPD ], 2, true),
    new AttackMove(Moves.QUICK_ATTACK, PokemonType.NORMAL, MoveCategory.PHYSICAL, 40, 100, 30, -1, 1, 1),
    new AttackMove(Moves.RAGE, PokemonType.NORMAL, MoveCategory.PHYSICAL, 20, 100, 20, -1, 0, 1)
      .partial(), // No effect implemented
    new SelfStatusMove(Moves.TELEPORT, PokemonType.PSYCHIC, -1, 20, -1, -6, 1)
      .attr(ForceSwitchOutAttr, true)
      .hidesUser(),
    new AttackMove(Moves.NIGHT_SHADE, PokemonType.GHOST, MoveCategory.SPECIAL, -1, 100, 15, -1, 0, 1)
      .attr(LevelDamageAttr),
    new StatusMove(Moves.MIMIC, PokemonType.NORMAL, -1, 10, -1, 0, 1)
      .attr(MovesetCopyMoveAttr)
      .ignoresSubstitute(),
    new StatusMove(Moves.SCREECH, PokemonType.NORMAL, 85, 40, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -2)
      .soundBased()
      .reflectable(),
    new SelfStatusMove(Moves.DOUBLE_TEAM, PokemonType.NORMAL, -1, 15, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.EVA ], 1, true),
    new SelfStatusMove(Moves.RECOVER, PokemonType.NORMAL, -1, 5, -1, 0, 1)
      .attr(HealAttr, 0.5)
      .triageMove(),
    new SelfStatusMove(Moves.HARDEN, PokemonType.NORMAL, -1, 30, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 1, true),
    new SelfStatusMove(Moves.MINIMIZE, PokemonType.NORMAL, -1, 10, -1, 0, 1)
      .attr(AddBattlerTagAttr, BattlerTagType.MINIMIZED, true, false)
      .attr(StatStageChangeAttr, [ Stat.EVA ], 2, true),
    new StatusMove(Moves.SMOKESCREEN, PokemonType.NORMAL, 100, 20, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.ACC ], -1)
      .reflectable(),
    new StatusMove(Moves.CONFUSE_RAY, PokemonType.GHOST, 100, 10, -1, 0, 1)
      .attr(ConfuseAttr)
      .reflectable(),
    new SelfStatusMove(Moves.WITHDRAW, PokemonType.WATER, -1, 40, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 1, true),
    new SelfStatusMove(Moves.DEFENSE_CURL, PokemonType.NORMAL, -1, 40, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 1, true),
    new SelfStatusMove(Moves.BARRIER, PokemonType.PSYCHIC, -1, 20, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 2, true),
    new StatusMove(Moves.LIGHT_SCREEN, PokemonType.PSYCHIC, -1, 30, -1, 0, 1)
      .attr(AddArenaTagAttr, ArenaTagType.LIGHT_SCREEN, 5, true)
      .target(MoveTarget.USER_SIDE),
    new SelfStatusMove(Moves.HAZE, PokemonType.ICE, -1, 30, -1, 0, 1)
      .ignoresSubstitute()
      .attr(ResetStatsAttr, true),
    new StatusMove(Moves.REFLECT, PokemonType.PSYCHIC, -1, 20, -1, 0, 1)
      .attr(AddArenaTagAttr, ArenaTagType.REFLECT, 5, true)
      .target(MoveTarget.USER_SIDE),
    new SelfStatusMove(Moves.FOCUS_ENERGY, PokemonType.NORMAL, -1, 30, -1, 0, 1)
      .attr(AddBattlerTagAttr, BattlerTagType.CRIT_BOOST, true, true),
    new AttackMove(Moves.BIDE, PokemonType.NORMAL, MoveCategory.PHYSICAL, -1, -1, 10, -1, 1, 1)
      .target(MoveTarget.USER)
      .unimplemented(),
    new SelfStatusMove(Moves.METRONOME, PokemonType.NORMAL, -1, 10, -1, 0, 1)
      .attr(RandomMoveAttr, invalidMetronomeMoves),
    new StatusMove(Moves.MIRROR_MOVE, PokemonType.FLYING, -1, 20, -1, 0, 1)
      .attr(CopyMoveAttr, true, invalidMirrorMoveMoves),
    new AttackMove(Moves.SELF_DESTRUCT, PokemonType.NORMAL, MoveCategory.PHYSICAL, 200, 100, 5, -1, 0, 1)
      .attr(SacrificialAttr)
      .makesContact(false)
      .condition(failIfDampCondition)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.EGG_BOMB, PokemonType.NORMAL, MoveCategory.PHYSICAL, 100, 75, 10, -1, 0, 1)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(Moves.LICK, PokemonType.GHOST, MoveCategory.PHYSICAL, 30, 100, 30, 30, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.SMOG, PokemonType.POISON, MoveCategory.SPECIAL, 30, 70, 20, 40, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(Moves.SLUDGE, PokemonType.POISON, MoveCategory.SPECIAL, 65, 100, 20, 30, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(Moves.BONE_CLUB, PokemonType.GROUND, MoveCategory.PHYSICAL, 65, 85, 20, 10, 0, 1)
      .attr(FlinchAttr)
      .makesContact(false),
    new AttackMove(Moves.FIRE_BLAST, PokemonType.FIRE, MoveCategory.SPECIAL, 110, 85, 5, 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.WATERFALL, PokemonType.WATER, MoveCategory.PHYSICAL, 80, 100, 15, 20, 0, 1)
      .attr(FlinchAttr),
    new AttackMove(Moves.CLAMP, PokemonType.WATER, MoveCategory.PHYSICAL, 35, 85, 15, -1, 0, 1)
      .attr(TrapAttr, BattlerTagType.CLAMP),
    new AttackMove(Moves.SWIFT, PokemonType.NORMAL, MoveCategory.SPECIAL, 60, -1, 20, -1, 0, 1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new ChargingAttackMove(Moves.SKULL_BASH, PokemonType.NORMAL, MoveCategory.PHYSICAL, 130, 100, 10, -1, 0, 1)
      .chargeText(i18next.t("moveTriggers:loweredItsHead", { pokemonName: "{USER}" }))
      .chargeAttr(StatStageChangeAttr, [ Stat.DEF ], 1, true),
    new AttackMove(Moves.SPIKE_CANNON, PokemonType.NORMAL, MoveCategory.PHYSICAL, 20, 100, 15, -1, 0, 1)
      .attr(MultiHitAttr)
      .makesContact(false),
    new AttackMove(Moves.CONSTRICT, PokemonType.NORMAL, MoveCategory.PHYSICAL, 10, 100, 35, 10, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1),
    new SelfStatusMove(Moves.AMNESIA, PokemonType.PSYCHIC, -1, 20, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], 2, true),
    new StatusMove(Moves.KINESIS, PokemonType.PSYCHIC, 80, 15, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.ACC ], -1)
      .reflectable(),
    new SelfStatusMove(Moves.SOFT_BOILED, PokemonType.NORMAL, -1, 5, -1, 0, 1)
      .attr(HealAttr, 0.5)
      .triageMove(),
    new AttackMove(Moves.HIGH_JUMP_KICK, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 130, 90, 10, -1, 0, 1)
      .attr(MissEffectAttr, crashDamageFunc)
      .attr(NoEffectAttr, crashDamageFunc)
      .condition(failOnGravityCondition)
      .recklessMove(),
    new StatusMove(Moves.GLARE, PokemonType.NORMAL, 100, 30, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .reflectable(),
    new AttackMove(Moves.DREAM_EATER, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 100, 100, 15, -1, 0, 1)
      .attr(HitHealAttr)
      .condition(targetSleptOrComatoseCondition)
      .triageMove(),
    new StatusMove(Moves.POISON_GAS, PokemonType.POISON, 90, 40, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .reflectable(),
    new AttackMove(Moves.BARRAGE, PokemonType.NORMAL, MoveCategory.PHYSICAL, 15, 85, 20, -1, 0, 1)
      .attr(MultiHitAttr)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(Moves.LEECH_LIFE, PokemonType.BUG, MoveCategory.PHYSICAL, 80, 100, 10, -1, 0, 1)
      .attr(HitHealAttr)
      .triageMove(),
    new StatusMove(Moves.LOVELY_KISS, PokemonType.NORMAL, 75, 10, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .reflectable(),
    new ChargingAttackMove(Moves.SKY_ATTACK, PokemonType.FLYING, MoveCategory.PHYSICAL, 140, 90, 5, 30, 0, 1)
      .chargeText(i18next.t("moveTriggers:isGlowing", { pokemonName: "{USER}" }))
      .attr(HighCritAttr)
      .attr(FlinchAttr)
      .makesContact(false),
    new StatusMove(Moves.TRANSFORM, PokemonType.NORMAL, -1, 10, -1, 0, 1)
      .attr(TransformAttr)
      .condition((user, target, move) => !target.getTag(BattlerTagType.SUBSTITUTE))
      .condition((user, target, move) => !target.summonData?.illusion && !user.summonData?.illusion)
      // transforming from or into fusion pokemon causes various problems (such as crashes)
      .condition((user, target, move) => !target.getTag(BattlerTagType.SUBSTITUTE) && !user.fusionSpecies && !target.fusionSpecies)
      .ignoresProtect(),
    new AttackMove(Moves.BUBBLE, PokemonType.WATER, MoveCategory.SPECIAL, 40, 100, 30, 10, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.DIZZY_PUNCH, PokemonType.NORMAL, MoveCategory.PHYSICAL, 70, 100, 10, 20, 0, 1)
      .attr(ConfuseAttr)
      .punchingMove(),
    new StatusMove(Moves.SPORE, PokemonType.GRASS, 100, 15, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .powderMove()
      .reflectable(),
    new StatusMove(Moves.FLASH, PokemonType.NORMAL, 100, 20, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.ACC ], -1)
      .reflectable(),
    new AttackMove(Moves.PSYWAVE, PokemonType.PSYCHIC, MoveCategory.SPECIAL, -1, 100, 15, -1, 0, 1)
      .attr(RandomLevelDamageAttr),
    new SelfStatusMove(Moves.SPLASH, PokemonType.NORMAL, -1, 40, -1, 0, 1)
      .attr(SplashAttr)
      .condition(failOnGravityCondition),
    new SelfStatusMove(Moves.ACID_ARMOR, PokemonType.POISON, -1, 20, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 2, true),
    new AttackMove(Moves.CRABHAMMER, PokemonType.WATER, MoveCategory.PHYSICAL, 100, 90, 10, -1, 0, 1)
      .attr(HighCritAttr),
    new AttackMove(Moves.EXPLOSION, PokemonType.NORMAL, MoveCategory.PHYSICAL, 250, 100, 5, -1, 0, 1)
      .condition(failIfDampCondition)
      .attr(SacrificialAttr)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.FURY_SWIPES, PokemonType.NORMAL, MoveCategory.PHYSICAL, 18, 80, 15, -1, 0, 1)
      .attr(MultiHitAttr),
    new AttackMove(Moves.BONEMERANG, PokemonType.GROUND, MoveCategory.PHYSICAL, 50, 90, 10, -1, 0, 1)
      .attr(MultiHitAttr, MultiHitType._2)
      .makesContact(false),
    new SelfStatusMove(Moves.REST, PokemonType.PSYCHIC, -1, 5, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP, true, 3, true)
      .attr(HealAttr, 1, true)
      .condition((user, target, move) => !user.isFullHp() && user.canSetStatus(StatusEffect.SLEEP, true, true, user))
      .triageMove(),
    new AttackMove(Moves.ROCK_SLIDE, PokemonType.ROCK, MoveCategory.PHYSICAL, 75, 90, 10, 30, 0, 1)
      .attr(FlinchAttr)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.HYPER_FANG, PokemonType.NORMAL, MoveCategory.PHYSICAL, 80, 90, 15, 10, 0, 1)
      .attr(FlinchAttr)
      .bitingMove(),
    new SelfStatusMove(Moves.SHARPEN, PokemonType.NORMAL, -1, 30, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.ATK ], 1, true),
    new SelfStatusMove(Moves.CONVERSION, PokemonType.NORMAL, -1, 30, -1, 0, 1)
      .attr(FirstMoveTypeAttr),
    new AttackMove(Moves.TRI_ATTACK, PokemonType.NORMAL, MoveCategory.SPECIAL, 80, 100, 10, 20, 0, 1)
      .attr(MultiStatusEffectAttr, [ StatusEffect.BURN, StatusEffect.FREEZE, StatusEffect.PARALYSIS ]),
    new AttackMove(Moves.SUPER_FANG, PokemonType.NORMAL, MoveCategory.PHYSICAL, -1, 90, 10, -1, 0, 1)
      .attr(TargetHalfHpDamageAttr),
    new AttackMove(Moves.SLASH, PokemonType.NORMAL, MoveCategory.PHYSICAL, 70, 100, 20, -1, 0, 1)
      .attr(HighCritAttr)
      .slicingMove(),
    new SelfStatusMove(Moves.SUBSTITUTE, PokemonType.NORMAL, -1, 10, -1, 0, 1)
      .attr(AddSubstituteAttr, 0.25, false),
    new AttackMove(Moves.STRUGGLE, PokemonType.NORMAL, MoveCategory.PHYSICAL, 50, -1, 1, -1, 0, 1)
      .attr(RecoilAttr, true, 0.25, true)
      .attr(TypelessAttr)
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new StatusMove(Moves.SKETCH, PokemonType.NORMAL, -1, 1, -1, 0, 2)
      .ignoresSubstitute()
      .attr(SketchAttr),
    new AttackMove(Moves.TRIPLE_KICK, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 10, 90, 10, -1, 0, 2)
      .attr(MultiHitAttr, MultiHitType._3)
      .attr(MultiHitPowerIncrementAttr, 3)
      .checkAllHits(),
    new AttackMove(Moves.THIEF, PokemonType.DARK, MoveCategory.PHYSICAL, 60, 100, 25, -1, 0, 2)
      .attr(StealHeldItemChanceAttr, 0.3),
    new StatusMove(Moves.SPIDER_WEB, PokemonType.BUG, -1, 10, -1, 0, 2)
      .condition(failIfGhostTypeCondition)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, true, 1)
      .reflectable(),
    new StatusMove(Moves.MIND_READER, PokemonType.NORMAL, -1, 5, -1, 0, 2)
      .attr(IgnoreAccuracyAttr),
    new StatusMove(Moves.NIGHTMARE, PokemonType.GHOST, 100, 15, -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.NIGHTMARE)
      .condition(targetSleptOrComatoseCondition),
    new AttackMove(Moves.FLAME_WHEEL, PokemonType.FIRE, MoveCategory.PHYSICAL, 60, 100, 25, 10, 0, 2)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.SNORE, PokemonType.NORMAL, MoveCategory.SPECIAL, 50, 100, 15, 30, 0, 2)
      .attr(BypassSleepAttr)
      .attr(FlinchAttr)
      .condition(userSleptOrComatoseCondition)
      .soundBased(),
    new StatusMove(Moves.CURSE, PokemonType.GHOST, -1, 10, -1, 0, 2)
      .attr(CurseAttr)
      .ignoresSubstitute()
      .ignoresProtect()
      .target(MoveTarget.CURSE),
    new AttackMove(Moves.FLAIL, PokemonType.NORMAL, MoveCategory.PHYSICAL, -1, 100, 15, -1, 0, 2)
      .attr(LowHpPowerAttr),
    new StatusMove(Moves.CONVERSION_2, PokemonType.NORMAL, -1, 30, -1, 0, 2)
      .attr(ResistLastMoveTypeAttr)
      .ignoresSubstitute()
      .partial(), // Checks the move's original typing and not if its type is changed through some other means
    new AttackMove(Moves.AEROBLAST, PokemonType.FLYING, MoveCategory.SPECIAL, 100, 95, 5, -1, 0, 2)
      .windMove()
      .attr(HighCritAttr),
    new StatusMove(Moves.COTTON_SPORE, PokemonType.GRASS, 100, 40, -1, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -2)
      .powderMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .reflectable(),
    new AttackMove(Moves.REVERSAL, PokemonType.FIGHTING, MoveCategory.PHYSICAL, -1, 100, 15, -1, 0, 2)
      .attr(LowHpPowerAttr),
    new StatusMove(Moves.SPITE, PokemonType.GHOST, 100, 10, -1, 0, 2)
      .ignoresSubstitute()
      .attr(ReducePpMoveAttr, 4)
      .reflectable(),
    new AttackMove(Moves.POWDER_SNOW, PokemonType.ICE, MoveCategory.SPECIAL, 40, 100, 25, 10, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.FREEZE)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new SelfStatusMove(Moves.PROTECT, PokemonType.NORMAL, -1, 10, -1, 4, 2)
      .attr(ProtectAttr)
      .condition(failIfLastCondition),
    new AttackMove(Moves.MACH_PUNCH, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 40, 100, 30, -1, 1, 2)
      .punchingMove(),
    new StatusMove(Moves.SCARY_FACE, PokemonType.NORMAL, 100, 10, -1, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -2)
      .reflectable(),
    new AttackMove(Moves.FEINT_ATTACK, PokemonType.DARK, MoveCategory.PHYSICAL, 60, -1, 20, -1, 0, 2),
    new StatusMove(Moves.SWEET_KISS, PokemonType.FAIRY, 75, 10, -1, 0, 2)
      .attr(ConfuseAttr)
      .reflectable(),
    new SelfStatusMove(Moves.BELLY_DRUM, PokemonType.NORMAL, -1, 10, -1, 0, 2)
      .attr(CutHpStatStageBoostAttr, [ Stat.ATK ], 12, 2, (user) => {
        globalScene.queueMessage(i18next.t("moveTriggers:cutOwnHpAndMaximizedStat", { pokemonName: getPokemonNameWithAffix(user), statName: i18next.t(getStatKey(Stat.ATK)) }));
      }),
    new AttackMove(Moves.SLUDGE_BOMB, PokemonType.POISON, MoveCategory.SPECIAL, 90, 100, 10, 30, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .ballBombMove(),
    new AttackMove(Moves.MUD_SLAP, PokemonType.GROUND, MoveCategory.SPECIAL, 20, 100, 10, 100, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.ACC ], -1),
    new AttackMove(Moves.OCTAZOOKA, PokemonType.WATER, MoveCategory.SPECIAL, 65, 85, 10, 50, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.ACC ], -1)
      .ballBombMove(),
    new StatusMove(Moves.SPIKES, PokemonType.GROUND, -1, 20, -1, 0, 2)
      .attr(AddArenaTrapTagAttr, ArenaTagType.SPIKES)
      .target(MoveTarget.ENEMY_SIDE)
      .reflectable(),
    new AttackMove(Moves.ZAP_CANNON, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 120, 50, 5, 100, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .ballBombMove(),
    new StatusMove(Moves.FORESIGHT, PokemonType.NORMAL, -1, 40, -1, 0, 2)
      .attr(ExposedMoveAttr, BattlerTagType.IGNORE_GHOST)
      .ignoresSubstitute()
      .reflectable(),
    new SelfStatusMove(Moves.DESTINY_BOND, PokemonType.GHOST, -1, 5, -1, 0, 2)
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
    new StatusMove(Moves.PERISH_SONG, PokemonType.NORMAL, -1, 5, -1, 0, 2)
      .attr(FaintCountdownAttr)
      .ignoresProtect()
      .soundBased()
      .condition(failOnBossCondition)
      .target(MoveTarget.ALL),
    new AttackMove(Moves.ICY_WIND, PokemonType.ICE, MoveCategory.SPECIAL, 55, 95, 15, 100, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new SelfStatusMove(Moves.DETECT, PokemonType.FIGHTING, -1, 5, -1, 4, 2)
      .attr(ProtectAttr)
      .condition(failIfLastCondition),
    new AttackMove(Moves.BONE_RUSH, PokemonType.GROUND, MoveCategory.PHYSICAL, 25, 90, 10, -1, 0, 2)
      .attr(MultiHitAttr)
      .makesContact(false),
    new StatusMove(Moves.LOCK_ON, PokemonType.NORMAL, -1, 5, -1, 0, 2)
      .attr(IgnoreAccuracyAttr),
    new AttackMove(Moves.OUTRAGE, PokemonType.DRAGON, MoveCategory.PHYSICAL, 120, 100, 10, -1, 0, 2)
      .attr(FrenzyAttr)
      .attr(MissEffectAttr, frenzyMissFunc)
      .attr(NoEffectAttr, frenzyMissFunc)
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new StatusMove(Moves.SANDSTORM, PokemonType.ROCK, -1, 10, -1, 0, 2)
      .attr(WeatherChangeAttr, WeatherType.SANDSTORM)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.GIGA_DRAIN, PokemonType.GRASS, MoveCategory.SPECIAL, 75, 100, 10, -1, 0, 2)
      .attr(HitHealAttr)
      .triageMove(),
    new SelfStatusMove(Moves.ENDURE, PokemonType.NORMAL, -1, 10, -1, 4, 2)
      .attr(ProtectAttr, BattlerTagType.ENDURING)
      .condition(failIfLastCondition),
    new StatusMove(Moves.CHARM, PokemonType.FAIRY, 100, 20, -1, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -2)
      .reflectable(),
    new AttackMove(Moves.ROLLOUT, PokemonType.ROCK, MoveCategory.PHYSICAL, 30, 90, 20, -1, 0, 2)
      .partial() // Does not lock the user, also does not increase damage properly
      .attr(ConsecutiveUseDoublePowerAttr, 5, true, true, Moves.DEFENSE_CURL),
    new AttackMove(Moves.FALSE_SWIPE, PokemonType.NORMAL, MoveCategory.PHYSICAL, 40, 100, 40, -1, 0, 2)
      .attr(SurviveDamageAttr),
    new StatusMove(Moves.SWAGGER, PokemonType.NORMAL, 85, 15, -1, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.ATK ], 2)
      .attr(ConfuseAttr)
      .reflectable(),
    new SelfStatusMove(Moves.MILK_DRINK, PokemonType.NORMAL, -1, 5, -1, 0, 2)
      .attr(HealAttr, 0.5)
      .triageMove(),
    new AttackMove(Moves.SPARK, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 65, 100, 20, 30, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.FURY_CUTTER, PokemonType.BUG, MoveCategory.PHYSICAL, 40, 95, 20, -1, 0, 2)
      .attr(ConsecutiveUseDoublePowerAttr, 3, true)
      .slicingMove(),
    new AttackMove(Moves.STEEL_WING, PokemonType.STEEL, MoveCategory.PHYSICAL, 70, 90, 25, 10, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 1, true),
    new StatusMove(Moves.MEAN_LOOK, PokemonType.NORMAL, -1, 5, -1, 0, 2)
      .condition(failIfGhostTypeCondition)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, true, 1)
      .reflectable(),
    new StatusMove(Moves.ATTRACT, PokemonType.NORMAL, 100, 15, -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.INFATUATED)
      .ignoresSubstitute()
      .condition((user, target, move) => user.isOppositeGender(target))
      .reflectable(),
    new SelfStatusMove(Moves.SLEEP_TALK, PokemonType.NORMAL, -1, 10, -1, 0, 2)
      .attr(BypassSleepAttr)
      .attr(RandomMovesetMoveAttr, invalidSleepTalkMoves, false)
      .condition(userSleptOrComatoseCondition)
      .target(MoveTarget.NEAR_ENEMY),
    new StatusMove(Moves.HEAL_BELL, PokemonType.NORMAL, -1, 5, -1, 0, 2)
      .attr(PartyStatusCureAttr, i18next.t("moveTriggers:bellChimed"), Abilities.SOUNDPROOF)
      .soundBased()
      .target(MoveTarget.PARTY),
    new AttackMove(Moves.RETURN, PokemonType.NORMAL, MoveCategory.PHYSICAL, -1, 100, 20, -1, 0, 2)
      .attr(FriendshipPowerAttr),
    new AttackMove(Moves.PRESENT, PokemonType.NORMAL, MoveCategory.PHYSICAL, -1, 90, 15, -1, 0, 2)
      .attr(PresentPowerAttr)
      .makesContact(false),
    new AttackMove(Moves.FRUSTRATION, PokemonType.NORMAL, MoveCategory.PHYSICAL, -1, 100, 20, -1, 0, 2)
      .attr(FriendshipPowerAttr, true),
    new StatusMove(Moves.SAFEGUARD, PokemonType.NORMAL, -1, 25, -1, 0, 2)
      .target(MoveTarget.USER_SIDE)
      .attr(AddArenaTagAttr, ArenaTagType.SAFEGUARD, 5, true, true),
    new StatusMove(Moves.PAIN_SPLIT, PokemonType.NORMAL, -1, 20, -1, 0, 2)
      .attr(HpSplitAttr)
      .condition(failOnBossCondition),
    new AttackMove(Moves.SACRED_FIRE, PokemonType.FIRE, MoveCategory.PHYSICAL, 100, 95, 5, 50, 0, 2)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .makesContact(false),
    new AttackMove(Moves.MAGNITUDE, PokemonType.GROUND, MoveCategory.PHYSICAL, -1, 100, 30, -1, 0, 2)
      .attr(PreMoveMessageAttr, magnitudeMessageFunc)
      .attr(MagnitudePowerAttr)
      .attr(MovePowerMultiplierAttr, (user, target, move) => globalScene.arena.getTerrainType() === TerrainType.GRASSY && target.isGrounded() ? 0.5 : 1)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.UNDERGROUND)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.DYNAMIC_PUNCH, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 100, 50, 5, 100, 0, 2)
      .attr(ConfuseAttr)
      .punchingMove(),
    new AttackMove(Moves.MEGAHORN, PokemonType.BUG, MoveCategory.PHYSICAL, 120, 85, 10, -1, 0, 2),
    new AttackMove(Moves.DRAGON_BREATH, PokemonType.DRAGON, MoveCategory.SPECIAL, 60, 100, 20, 30, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new SelfStatusMove(Moves.BATON_PASS, PokemonType.NORMAL, -1, 40, -1, 0, 2)
      .attr(ForceSwitchOutAttr, true, SwitchType.BATON_PASS)
      .condition(failIfLastInPartyCondition)
      .hidesUser(),
    new StatusMove(Moves.ENCORE, PokemonType.NORMAL, 100, 5, -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.ENCORE, false, true)
      .ignoresSubstitute()
      .condition((user, target, move) => new EncoreTag(user.id).canAdd(target))
      .reflectable(),
    new AttackMove(Moves.PURSUIT, PokemonType.DARK, MoveCategory.PHYSICAL, 40, 100, 20, -1, 0, 2)
      .partial(), // No effect implemented
    new AttackMove(Moves.RAPID_SPIN, PokemonType.NORMAL, MoveCategory.PHYSICAL, 50, 100, 40, 100, 0, 2)
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
    new StatusMove(Moves.SWEET_SCENT, PokemonType.NORMAL, 100, 20, -1, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.EVA ], -2)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .reflectable(),
    new AttackMove(Moves.IRON_TAIL, PokemonType.STEEL, MoveCategory.PHYSICAL, 100, 75, 15, 30, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1),
    new AttackMove(Moves.METAL_CLAW, PokemonType.STEEL, MoveCategory.PHYSICAL, 50, 95, 35, 10, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.ATK ], 1, true),
    new AttackMove(Moves.VITAL_THROW, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 70, -1, 10, -1, -1, 2),
    new SelfStatusMove(Moves.MORNING_SUN, PokemonType.NORMAL, -1, 5, -1, 0, 2)
      .attr(PlantHealAttr)
      .triageMove(),
    new SelfStatusMove(Moves.SYNTHESIS, PokemonType.GRASS, -1, 5, -1, 0, 2)
      .attr(PlantHealAttr)
      .triageMove(),
    new SelfStatusMove(Moves.MOONLIGHT, PokemonType.FAIRY, -1, 5, -1, 0, 2)
      .attr(PlantHealAttr)
      .triageMove(),
    new AttackMove(Moves.HIDDEN_POWER, PokemonType.NORMAL, MoveCategory.SPECIAL, 60, 100, 15, -1, 0, 2)
      .attr(HiddenPowerTypeAttr),
    new AttackMove(Moves.CROSS_CHOP, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 100, 80, 5, -1, 0, 2)
      .attr(HighCritAttr),
    new AttackMove(Moves.TWISTER, PokemonType.DRAGON, MoveCategory.SPECIAL, 40, 100, 20, 20, 0, 2)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.FLYING)
      .attr(FlinchAttr)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.RAIN_DANCE, PokemonType.WATER, -1, 5, -1, 0, 2)
      .attr(WeatherChangeAttr, WeatherType.RAIN)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(Moves.SUNNY_DAY, PokemonType.FIRE, -1, 5, -1, 0, 2)
      .attr(WeatherChangeAttr, WeatherType.SUNNY)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.CRUNCH, PokemonType.DARK, MoveCategory.PHYSICAL, 80, 100, 15, 20, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1)
      .bitingMove(),
    new AttackMove(Moves.MIRROR_COAT, PokemonType.PSYCHIC, MoveCategory.SPECIAL, -1, 100, 20, -1, -5, 2)
      .attr(CounterDamageAttr, (move: Move) => move.category === MoveCategory.SPECIAL, 2)
      .target(MoveTarget.ATTACKER),
    new StatusMove(Moves.PSYCH_UP, PokemonType.NORMAL, -1, 10, -1, 0, 2)
      .ignoresSubstitute()
      .attr(CopyStatsAttr),
    new AttackMove(Moves.EXTREME_SPEED, PokemonType.NORMAL, MoveCategory.PHYSICAL, 80, 100, 5, -1, 2, 2),
    new AttackMove(Moves.ANCIENT_POWER, PokemonType.ROCK, MoveCategory.SPECIAL, 60, 100, 5, 10, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD ], 1, true),
    new AttackMove(Moves.SHADOW_BALL, PokemonType.GHOST, MoveCategory.SPECIAL, 80, 100, 15, 20, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -1)
      .ballBombMove(),
    new AttackMove(Moves.FUTURE_SIGHT, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 120, 100, 10, -1, 0, 2)
      .partial() // cannot be used on multiple Pokemon on the same side in a double battle, hits immediately when called by Metronome/etc, should not apply abilities or held items if user is off the field
      .ignoresProtect()
      .attr(DelayedAttackAttr, ArenaTagType.FUTURE_SIGHT, ChargeAnim.FUTURE_SIGHT_CHARGING, i18next.t("moveTriggers:foresawAnAttack", { pokemonName: "{USER}" })),
    new AttackMove(Moves.ROCK_SMASH, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 40, 100, 15, 50, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1),
    new AttackMove(Moves.WHIRLPOOL, PokemonType.WATER, MoveCategory.SPECIAL, 35, 85, 15, -1, 0, 2)
      .attr(TrapAttr, BattlerTagType.WHIRLPOOL)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.UNDERWATER),
    new AttackMove(Moves.BEAT_UP, PokemonType.DARK, MoveCategory.PHYSICAL, -1, 100, 10, -1, 0, 2)
      .attr(MultiHitAttr, MultiHitType.BEAT_UP)
      .attr(BeatUpAttr)
      .makesContact(false),
    new AttackMove(Moves.FAKE_OUT, PokemonType.NORMAL, MoveCategory.PHYSICAL, 40, 100, 10, 100, 3, 3)
      .attr(FlinchAttr)
      .condition(new FirstMoveCondition()),
    new AttackMove(Moves.UPROAR, PokemonType.NORMAL, MoveCategory.SPECIAL, 90, 100, 10, -1, 0, 3)
      .soundBased()
      .target(MoveTarget.RANDOM_NEAR_ENEMY)
      .partial(), // Does not lock the user, does not stop Pokemon from sleeping
    new SelfStatusMove(Moves.STOCKPILE, PokemonType.NORMAL, -1, 20, -1, 0, 3)
      .condition(user => (user.getTag(StockpilingTag)?.stockpiledCount ?? 0) < 3)
      .attr(AddBattlerTagAttr, BattlerTagType.STOCKPILING, true),
    new AttackMove(Moves.SPIT_UP, PokemonType.NORMAL, MoveCategory.SPECIAL, -1, -1, 10, -1, 0, 3)
      .condition(hasStockpileStacksCondition)
      .attr(SpitUpPowerAttr, 100)
      .attr(RemoveBattlerTagAttr, [ BattlerTagType.STOCKPILING ], true),
    new SelfStatusMove(Moves.SWALLOW, PokemonType.NORMAL, -1, 10, -1, 0, 3)
      .condition(hasStockpileStacksCondition)
      .attr(SwallowHealAttr)
      .attr(RemoveBattlerTagAttr, [ BattlerTagType.STOCKPILING ], true)
      .triageMove(),
    new AttackMove(Moves.HEAT_WAVE, PokemonType.FIRE, MoveCategory.SPECIAL, 95, 90, 10, 10, 0, 3)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.HAIL, PokemonType.ICE, -1, 10, -1, 0, 3)
      .attr(WeatherChangeAttr, WeatherType.HAIL)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(Moves.TORMENT, PokemonType.DARK, 100, 15, -1, 0, 3)
      .ignoresSubstitute()
      .edgeCase() // Incomplete implementation because of Uproar's partial implementation
      .attr(AddBattlerTagAttr, BattlerTagType.TORMENT, false, true, 1)
      .reflectable(),
    new StatusMove(Moves.FLATTER, PokemonType.DARK, 100, 15, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], 1)
      .attr(ConfuseAttr)
      .reflectable(),
    new StatusMove(Moves.WILL_O_WISP, PokemonType.FIRE, 85, 15, -1, 0, 3)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .reflectable(),
    new StatusMove(Moves.MEMENTO, PokemonType.DARK, 100, 10, -1, 0, 3)
      .attr(SacrificialAttrOnHit)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPATK ], -2),
    new AttackMove(Moves.FACADE, PokemonType.NORMAL, MoveCategory.PHYSICAL, 70, 100, 20, -1, 0, 3)
      .attr(MovePowerMultiplierAttr, (user, target, move) => user.status
        && (user.status.effect === StatusEffect.BURN || user.status.effect === StatusEffect.POISON || user.status.effect === StatusEffect.TOXIC || user.status.effect === StatusEffect.PARALYSIS) ? 2 : 1)
      .attr(BypassBurnDamageReductionAttr),
    new AttackMove(Moves.FOCUS_PUNCH, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 150, 100, 20, -1, -3, 3)
      .attr(MessageHeaderAttr, (user, move) => i18next.t("moveTriggers:isTighteningFocus", { pokemonName: getPokemonNameWithAffix(user) }))
      .attr(PreUseInterruptAttr, (user, target, move) => i18next.t("moveTriggers:lostFocus", { pokemonName: getPokemonNameWithAffix(user) }), user => !!user.turnData.attacksReceived.find(r => r.damage))
      .punchingMove(),
    new AttackMove(Moves.SMELLING_SALTS, PokemonType.NORMAL, MoveCategory.PHYSICAL, 70, 100, 10, -1, 0, 3)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.status?.effect === StatusEffect.PARALYSIS ? 2 : 1)
      .attr(HealStatusEffectAttr, true, StatusEffect.PARALYSIS),
    new SelfStatusMove(Moves.FOLLOW_ME, PokemonType.NORMAL, -1, 20, -1, 2, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.CENTER_OF_ATTENTION, true),
    new StatusMove(Moves.NATURE_POWER, PokemonType.NORMAL, -1, 20, -1, 0, 3)
      .attr(NaturePowerAttr),
    new SelfStatusMove(Moves.CHARGE, PokemonType.ELECTRIC, -1, 20, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], 1, true)
      .attr(AddBattlerTagAttr, BattlerTagType.CHARGED, true, false),
    new StatusMove(Moves.TAUNT, PokemonType.DARK, 100, 20, -1, 0, 3)
      .ignoresSubstitute()
      .attr(AddBattlerTagAttr, BattlerTagType.TAUNT, false, true, 4)
      .reflectable(),
    new StatusMove(Moves.HELPING_HAND, PokemonType.NORMAL, -1, 20, -1, 5, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.HELPING_HAND)
      .ignoresSubstitute()
      .target(MoveTarget.NEAR_ALLY)
      .condition(failIfSingleBattle),
    new StatusMove(Moves.TRICK, PokemonType.PSYCHIC, 100, 10, -1, 0, 3)
      .unimplemented(),
    new StatusMove(Moves.ROLE_PLAY, PokemonType.PSYCHIC, -1, 10, -1, 0, 3)
      .ignoresSubstitute()
      .attr(AbilityCopyAttr),
    new SelfStatusMove(Moves.WISH, PokemonType.NORMAL, -1, 10, -1, 0, 3)
      .triageMove()
      .attr(AddArenaTagAttr, ArenaTagType.WISH, 2, true),
    new SelfStatusMove(Moves.ASSIST, PokemonType.NORMAL, -1, 20, -1, 0, 3)
      .attr(RandomMovesetMoveAttr, invalidAssistMoves, true),
    new SelfStatusMove(Moves.INGRAIN, PokemonType.GRASS, -1, 20, -1, 0, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.INGRAIN, true, true)
      .attr(AddBattlerTagAttr, BattlerTagType.IGNORE_FLYING, true, true)
      .attr(RemoveBattlerTagAttr, [ BattlerTagType.FLOATING ], true),
    new AttackMove(Moves.SUPERPOWER, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 120, 100, 5, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF ], -1, true),
    new SelfStatusMove(Moves.MAGIC_COAT, PokemonType.PSYCHIC, -1, 15, -1, 4, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.MAGIC_COAT, true, true, 0)
      .condition(failIfLastCondition)
      // Interactions with stomping tantrum, instruct, and other moves that
      // rely on move history
      // Also will not reflect roar / whirlwind if the target has ForceSwitchOutImmunityAbAttr
      .edgeCase(),
    new SelfStatusMove(Moves.RECYCLE, PokemonType.NORMAL, -1, 10, -1, 0, 3)
      .unimplemented(),
    new AttackMove(Moves.REVENGE, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 60, 100, 10, -1, -4, 3)
      .attr(TurnDamagedDoublePowerAttr),
    new AttackMove(Moves.BRICK_BREAK, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 75, 100, 15, -1, 0, 3)
      .attr(RemoveScreensAttr),
    new StatusMove(Moves.YAWN, PokemonType.NORMAL, -1, 10, -1, 0, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.DROWSY, false, true)
      .condition((user, target, move) => !target.status && !target.isSafeguarded(user))
      .reflectable(),
    new AttackMove(Moves.KNOCK_OFF, PokemonType.DARK, MoveCategory.PHYSICAL, 65, 100, 20, -1, 0, 3)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.getHeldItems().filter(i => i.isTransferable).length > 0 ? 1.5 : 1)
      .attr(RemoveHeldItemAttr, false),
    new AttackMove(Moves.ENDEAVOR, PokemonType.NORMAL, MoveCategory.PHYSICAL, -1, 100, 5, -1, 0, 3)
      .attr(MatchHpAttr)
      .condition(failOnBossCondition),
    new AttackMove(Moves.ERUPTION, PokemonType.FIRE, MoveCategory.SPECIAL, 150, 100, 5, -1, 0, 3)
      .attr(HpPowerAttr)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.SKILL_SWAP, PokemonType.PSYCHIC, -1, 10, -1, 0, 3)
      .ignoresSubstitute()
      .attr(SwitchAbilitiesAttr),
    new StatusMove(Moves.IMPRISON, PokemonType.PSYCHIC, 100, 10, -1, 0, 3)
      .ignoresSubstitute()
      .attr(AddArenaTagAttr, ArenaTagType.IMPRISON, 1, true, false)
      .target(MoveTarget.ENEMY_SIDE),
    new SelfStatusMove(Moves.REFRESH, PokemonType.NORMAL, -1, 20, -1, 0, 3)
      .attr(HealStatusEffectAttr, true, [ StatusEffect.PARALYSIS, StatusEffect.POISON, StatusEffect.TOXIC, StatusEffect.BURN ])
      .condition((user, target, move) => !!user.status && (user.status.effect === StatusEffect.PARALYSIS || user.status.effect === StatusEffect.POISON || user.status.effect === StatusEffect.TOXIC || user.status.effect === StatusEffect.BURN)),
    new SelfStatusMove(Moves.GRUDGE, PokemonType.GHOST, -1, 5, -1, 0, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.GRUDGE, true, undefined, 1),
    new SelfStatusMove(Moves.SNATCH, PokemonType.DARK, -1, 10, -1, 4, 3)
      .unimplemented(),
    new AttackMove(Moves.SECRET_POWER, PokemonType.NORMAL, MoveCategory.PHYSICAL, 70, 100, 20, 30, 0, 3)
      .makesContact(false)
      .attr(SecretPowerAttr),
    new ChargingAttackMove(Moves.DIVE, PokemonType.WATER, MoveCategory.PHYSICAL, 80, 100, 10, -1, 0, 3)
      .chargeText(i18next.t("moveTriggers:hidUnderwater", { pokemonName: "{USER}" }))
      .chargeAttr(SemiInvulnerableAttr, BattlerTagType.UNDERWATER)
      .chargeAttr(GulpMissileTagAttr),
    new AttackMove(Moves.ARM_THRUST, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 15, 100, 20, -1, 0, 3)
      .attr(MultiHitAttr),
    new SelfStatusMove(Moves.CAMOUFLAGE, PokemonType.NORMAL, -1, 20, -1, 0, 3)
      .attr(CopyBiomeTypeAttr),
    new SelfStatusMove(Moves.TAIL_GLOW, PokemonType.BUG, -1, 20, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], 3, true),
    new AttackMove(Moves.LUSTER_PURGE, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 95, 100, 5, 50, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -1),
    new AttackMove(Moves.MIST_BALL, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 95, 100, 5, 50, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -1)
      .ballBombMove(),
    new StatusMove(Moves.FEATHER_DANCE, PokemonType.FLYING, 100, 15, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -2)
      .danceMove()
      .reflectable(),
    new StatusMove(Moves.TEETER_DANCE, PokemonType.NORMAL, 100, 20, -1, 0, 3)
      .attr(ConfuseAttr)
      .danceMove()
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.BLAZE_KICK, PokemonType.FIRE, MoveCategory.PHYSICAL, 85, 90, 10, 10, 0, 3)
      .attr(HighCritAttr)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new StatusMove(Moves.MUD_SPORT, PokemonType.GROUND, -1, 15, -1, 0, 3)
      .ignoresProtect()
      .attr(AddArenaTagAttr, ArenaTagType.MUD_SPORT, 5)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.ICE_BALL, PokemonType.ICE, MoveCategory.PHYSICAL, 30, 90, 20, -1, 0, 3)
      .partial() // Does not lock the user properly, does not increase damage correctly
      .attr(ConsecutiveUseDoublePowerAttr, 5, true, true, Moves.DEFENSE_CURL)
      .ballBombMove(),
    new AttackMove(Moves.NEEDLE_ARM, PokemonType.GRASS, MoveCategory.PHYSICAL, 60, 100, 15, 30, 0, 3)
      .attr(FlinchAttr),
    new SelfStatusMove(Moves.SLACK_OFF, PokemonType.NORMAL, -1, 5, -1, 0, 3)
      .attr(HealAttr, 0.5)
      .triageMove(),
    new AttackMove(Moves.HYPER_VOICE, PokemonType.NORMAL, MoveCategory.SPECIAL, 90, 100, 10, -1, 0, 3)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.POISON_FANG, PokemonType.POISON, MoveCategory.PHYSICAL, 50, 100, 15, 50, 0, 3)
      .attr(StatusEffectAttr, StatusEffect.TOXIC)
      .bitingMove(),
    new AttackMove(Moves.CRUSH_CLAW, PokemonType.NORMAL, MoveCategory.PHYSICAL, 75, 95, 10, 50, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1),
    new AttackMove(Moves.BLAST_BURN, PokemonType.FIRE, MoveCategory.SPECIAL, 150, 90, 5, -1, 0, 3)
      .attr(RechargeAttr),
    new AttackMove(Moves.HYDRO_CANNON, PokemonType.WATER, MoveCategory.SPECIAL, 150, 90, 5, -1, 0, 3)
      .attr(RechargeAttr),
    new AttackMove(Moves.METEOR_MASH, PokemonType.STEEL, MoveCategory.PHYSICAL, 90, 90, 10, 20, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.ATK ], 1, true)
      .punchingMove(),
    new AttackMove(Moves.ASTONISH, PokemonType.GHOST, MoveCategory.PHYSICAL, 30, 100, 15, 30, 0, 3)
      .attr(FlinchAttr),
    new AttackMove(Moves.WEATHER_BALL, PokemonType.NORMAL, MoveCategory.SPECIAL, 50, 100, 10, -1, 0, 3)
      .attr(WeatherBallTypeAttr)
      .attr(MovePowerMultiplierAttr, (user, target, move) => {
        const weather = globalScene.arena.weather;
        if (!weather) {
          return 1;
        }
        const weatherTypes = [ WeatherType.SUNNY, WeatherType.RAIN, WeatherType.SANDSTORM, WeatherType.HAIL, WeatherType.SNOW, WeatherType.FOG, WeatherType.HEAVY_RAIN, WeatherType.HARSH_SUN ];
        if (weatherTypes.includes(weather.weatherType) && !weather.isEffectSuppressed()) {
          return 2;
        }
        return 1;
      })
      .ballBombMove(),
    new StatusMove(Moves.AROMATHERAPY, PokemonType.GRASS, -1, 5, -1, 0, 3)
      .attr(PartyStatusCureAttr, i18next.t("moveTriggers:soothingAromaWaftedThroughArea"), Abilities.SAP_SIPPER)
      .target(MoveTarget.PARTY),
    new StatusMove(Moves.FAKE_TEARS, PokemonType.DARK, 100, 20, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -2)
      .reflectable(),
    new AttackMove(Moves.AIR_CUTTER, PokemonType.FLYING, MoveCategory.SPECIAL, 60, 95, 25, -1, 0, 3)
      .attr(HighCritAttr)
      .slicingMove()
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.OVERHEAT, PokemonType.FIRE, MoveCategory.SPECIAL, 130, 90, 5, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -2, true)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE),
    new StatusMove(Moves.ODOR_SLEUTH, PokemonType.NORMAL, -1, 40, -1, 0, 3)
      .attr(ExposedMoveAttr, BattlerTagType.IGNORE_GHOST)
      .ignoresSubstitute()
      .reflectable(),
    new AttackMove(Moves.ROCK_TOMB, PokemonType.ROCK, MoveCategory.PHYSICAL, 60, 95, 15, 100, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1)
      .makesContact(false),
    new AttackMove(Moves.SILVER_WIND, PokemonType.BUG, MoveCategory.SPECIAL, 60, 100, 5, 10, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD ], 1, true)
      .windMove(),
    new StatusMove(Moves.METAL_SOUND, PokemonType.STEEL, 85, 40, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -2)
      .soundBased()
      .reflectable(),
    new StatusMove(Moves.GRASS_WHISTLE, PokemonType.GRASS, 55, 15, -1, 0, 3)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .soundBased()
      .reflectable(),
    new StatusMove(Moves.TICKLE, PokemonType.NORMAL, 100, 20, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF ], -1)
      .reflectable(),
    new SelfStatusMove(Moves.COSMIC_POWER, PokemonType.PSYCHIC, -1, 20, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.DEF, Stat.SPDEF ], 1, true),
    new AttackMove(Moves.WATER_SPOUT, PokemonType.WATER, MoveCategory.SPECIAL, 150, 100, 5, -1, 0, 3)
      .attr(HpPowerAttr)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.SIGNAL_BEAM, PokemonType.BUG, MoveCategory.SPECIAL, 75, 100, 15, 10, 0, 3)
      .attr(ConfuseAttr),
    new AttackMove(Moves.SHADOW_PUNCH, PokemonType.GHOST, MoveCategory.PHYSICAL, 60, -1, 20, -1, 0, 3)
      .punchingMove(),
    new AttackMove(Moves.EXTRASENSORY, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 20, 10, 0, 3)
      .attr(FlinchAttr),
    new AttackMove(Moves.SKY_UPPERCUT, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 85, 90, 15, -1, 0, 3)
      .attr(HitsTagAttr, BattlerTagType.FLYING)
      .punchingMove(),
    new AttackMove(Moves.SAND_TOMB, PokemonType.GROUND, MoveCategory.PHYSICAL, 35, 85, 15, -1, 0, 3)
      .attr(TrapAttr, BattlerTagType.SAND_TOMB)
      .makesContact(false),
    new AttackMove(Moves.SHEER_COLD, PokemonType.ICE, MoveCategory.SPECIAL, 200, 20, 5, -1, 0, 3)
      .attr(IceNoEffectTypeAttr)
      .attr(OneHitKOAttr)
      .attr(SheerColdAccuracyAttr),
    new AttackMove(Moves.MUDDY_WATER, PokemonType.WATER, MoveCategory.SPECIAL, 90, 85, 10, 30, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.ACC ], -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.BULLET_SEED, PokemonType.GRASS, MoveCategory.PHYSICAL, 25, 100, 30, -1, 0, 3)
      .attr(MultiHitAttr)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(Moves.AERIAL_ACE, PokemonType.FLYING, MoveCategory.PHYSICAL, 60, -1, 20, -1, 0, 3)
      .slicingMove(),
    new AttackMove(Moves.ICICLE_SPEAR, PokemonType.ICE, MoveCategory.PHYSICAL, 25, 100, 30, -1, 0, 3)
      .attr(MultiHitAttr)
      .makesContact(false),
    new SelfStatusMove(Moves.IRON_DEFENSE, PokemonType.STEEL, -1, 15, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 2, true),
    new StatusMove(Moves.BLOCK, PokemonType.NORMAL, -1, 5, -1, 0, 3)
      .condition(failIfGhostTypeCondition)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, true, 1)
      .reflectable(),
    new StatusMove(Moves.HOWL, PokemonType.NORMAL, -1, 40, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.ATK ], 1)
      .soundBased()
      .target(MoveTarget.USER_AND_ALLIES),
    new AttackMove(Moves.DRAGON_CLAW, PokemonType.DRAGON, MoveCategory.PHYSICAL, 80, 100, 15, -1, 0, 3),
    new AttackMove(Moves.FRENZY_PLANT, PokemonType.GRASS, MoveCategory.SPECIAL, 150, 90, 5, -1, 0, 3)
      .attr(RechargeAttr),
    new SelfStatusMove(Moves.BULK_UP, PokemonType.FIGHTING, -1, 20, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF ], 1, true),
    new ChargingAttackMove(Moves.BOUNCE, PokemonType.FLYING, MoveCategory.PHYSICAL, 85, 85, 5, 30, 0, 3)
      .chargeText(i18next.t("moveTriggers:sprangUp", { pokemonName: "{USER}" }))
      .chargeAttr(SemiInvulnerableAttr, BattlerTagType.FLYING)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .condition(failOnGravityCondition),
    new AttackMove(Moves.MUD_SHOT, PokemonType.GROUND, MoveCategory.SPECIAL, 55, 95, 15, 100, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1),
    new AttackMove(Moves.POISON_TAIL, PokemonType.POISON, MoveCategory.PHYSICAL, 50, 100, 25, 10, 0, 3)
      .attr(HighCritAttr)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(Moves.COVET, PokemonType.NORMAL, MoveCategory.PHYSICAL, 60, 100, 25, -1, 0, 3)
      .attr(StealHeldItemChanceAttr, 0.3),
    new AttackMove(Moves.VOLT_TACKLE, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 120, 100, 15, 10, 0, 3)
      .attr(RecoilAttr, false, 0.33)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .recklessMove(),
    new AttackMove(Moves.MAGICAL_LEAF, PokemonType.GRASS, MoveCategory.SPECIAL, 60, -1, 20, -1, 0, 3),
    new StatusMove(Moves.WATER_SPORT, PokemonType.WATER, -1, 15, -1, 0, 3)
      .ignoresProtect()
      .attr(AddArenaTagAttr, ArenaTagType.WATER_SPORT, 5)
      .target(MoveTarget.BOTH_SIDES),
    new SelfStatusMove(Moves.CALM_MIND, PokemonType.PSYCHIC, -1, 20, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPATK, Stat.SPDEF ], 1, true),
    new AttackMove(Moves.LEAF_BLADE, PokemonType.GRASS, MoveCategory.PHYSICAL, 90, 100, 15, -1, 0, 3)
      .attr(HighCritAttr)
      .slicingMove(),
    new SelfStatusMove(Moves.DRAGON_DANCE, PokemonType.DRAGON, -1, 20, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPD ], 1, true)
      .danceMove(),
    new AttackMove(Moves.ROCK_BLAST, PokemonType.ROCK, MoveCategory.PHYSICAL, 25, 90, 10, -1, 0, 3)
      .attr(MultiHitAttr)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(Moves.SHOCK_WAVE, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 60, -1, 20, -1, 0, 3),
    new AttackMove(Moves.WATER_PULSE, PokemonType.WATER, MoveCategory.SPECIAL, 60, 100, 20, 20, 0, 3)
      .attr(ConfuseAttr)
      .pulseMove(),
    new AttackMove(Moves.DOOM_DESIRE, PokemonType.STEEL, MoveCategory.SPECIAL, 140, 100, 5, -1, 0, 3)
      .partial() // cannot be used on multiple Pokemon on the same side in a double battle, hits immediately when called by Metronome/etc, should not apply abilities or held items if user is off the field
      .ignoresProtect()
      .attr(DelayedAttackAttr, ArenaTagType.DOOM_DESIRE, ChargeAnim.DOOM_DESIRE_CHARGING, i18next.t("moveTriggers:choseDoomDesireAsDestiny", { pokemonName: "{USER}" })),
    new AttackMove(Moves.PSYCHO_BOOST, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 140, 90, 5, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -2, true),
    new SelfStatusMove(Moves.ROOST, PokemonType.FLYING, -1, 5, -1, 0, 4)
      .attr(HealAttr, 0.5)
      .attr(AddBattlerTagAttr, BattlerTagType.ROOSTED, true, false)
      .triageMove(),
    new StatusMove(Moves.GRAVITY, PokemonType.PSYCHIC, -1, 5, -1, 0, 4)
      .ignoresProtect()
      .attr(AddArenaTagAttr, ArenaTagType.GRAVITY, 5)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(Moves.MIRACLE_EYE, PokemonType.PSYCHIC, -1, 40, -1, 0, 4)
      .attr(ExposedMoveAttr, BattlerTagType.IGNORE_DARK)
      .ignoresSubstitute()
      .reflectable(),
    new AttackMove(Moves.WAKE_UP_SLAP, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 70, 100, 10, -1, 0, 4)
      .attr(MovePowerMultiplierAttr, (user, target, move) => targetSleptOrComatoseCondition(user, target, move) ? 2 : 1)
      .attr(HealStatusEffectAttr, false, StatusEffect.SLEEP),
    new AttackMove(Moves.HAMMER_ARM, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 100, 90, 10, -1, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1, true)
      .punchingMove(),
    new AttackMove(Moves.GYRO_BALL, PokemonType.STEEL, MoveCategory.PHYSICAL, -1, 100, 5, -1, 0, 4)
      .attr(GyroBallPowerAttr)
      .ballBombMove(),
    new SelfStatusMove(Moves.HEALING_WISH, PokemonType.PSYCHIC, -1, 10, -1, 0, 4)
      .attr(SacrificialFullRestoreAttr, false, "moveTriggers:sacrificialFullRestore")
      .triageMove()
      .condition(failIfLastInPartyCondition),
    new AttackMove(Moves.BRINE, PokemonType.WATER, MoveCategory.SPECIAL, 65, 100, 10, -1, 0, 4)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.getHpRatio() < 0.5 ? 2 : 1),
    new AttackMove(Moves.NATURAL_GIFT, PokemonType.NORMAL, MoveCategory.PHYSICAL, -1, 100, 15, -1, 0, 4)
      .makesContact(false)
      .unimplemented(),
    new AttackMove(Moves.FEINT, PokemonType.NORMAL, MoveCategory.PHYSICAL, 30, 100, 10, -1, 2, 4)
      .attr(RemoveBattlerTagAttr, [ BattlerTagType.PROTECTED ])
      .attr(RemoveArenaTagsAttr, [ ArenaTagType.QUICK_GUARD, ArenaTagType.WIDE_GUARD, ArenaTagType.MAT_BLOCK, ArenaTagType.CRAFTY_SHIELD ], false)
      .makesContact(false)
      .ignoresProtect(),
    new AttackMove(Moves.PLUCK, PokemonType.FLYING, MoveCategory.PHYSICAL, 60, 100, 20, -1, 0, 4)
      .attr(StealEatBerryAttr),
    new StatusMove(Moves.TAILWIND, PokemonType.FLYING, -1, 15, -1, 0, 4)
      .windMove()
      .attr(AddArenaTagAttr, ArenaTagType.TAILWIND, 4, true)
      .target(MoveTarget.USER_SIDE),
    new StatusMove(Moves.ACUPRESSURE, PokemonType.NORMAL, -1, 30, -1, 0, 4)
      .attr(AcupressureStatStageChangeAttr)
      .target(MoveTarget.USER_OR_NEAR_ALLY),
    new AttackMove(Moves.METAL_BURST, PokemonType.STEEL, MoveCategory.PHYSICAL, -1, 100, 10, -1, 0, 4)
      .attr(CounterDamageAttr, (move: Move) => (move.category === MoveCategory.PHYSICAL || move.category === MoveCategory.SPECIAL), 1.5)
      .redirectCounter()
      .makesContact(false)
      .target(MoveTarget.ATTACKER),
    new AttackMove(Moves.U_TURN, PokemonType.BUG, MoveCategory.PHYSICAL, 70, 100, 20, -1, 0, 4)
      .attr(ForceSwitchOutAttr, true),
    new AttackMove(Moves.CLOSE_COMBAT, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 120, 100, 5, -1, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.DEF, Stat.SPDEF ], -1, true),
    new AttackMove(Moves.PAYBACK, PokemonType.DARK, MoveCategory.PHYSICAL, 50, 100, 10, -1, 0, 4)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.getLastXMoves(1).find(m => m.turn === globalScene.currentBattle.turn) || globalScene.currentBattle.turnCommands[target.getBattlerIndex()]?.command === Command.BALL ? 2 : 1),
    new AttackMove(Moves.ASSURANCE, PokemonType.DARK, MoveCategory.PHYSICAL, 60, 100, 10, -1, 0, 4)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.turnData.damageTaken > 0 ? 2 : 1),
    new StatusMove(Moves.EMBARGO, PokemonType.DARK, 100, 15, -1, 0, 4)
      .reflectable()
      .unimplemented(),
    new AttackMove(Moves.FLING, PokemonType.DARK, MoveCategory.PHYSICAL, -1, 100, 10, -1, 0, 4)
      .makesContact(false)
      .unimplemented(),
    new StatusMove(Moves.PSYCHO_SHIFT, PokemonType.PSYCHIC, 100, 10, -1, 0, 4)
      .attr(PsychoShiftEffectAttr)
      .condition((user, target, move) => {
        let statusToApply = user.hasAbility(Abilities.COMATOSE) ? StatusEffect.SLEEP : undefined;
        if (user.status?.effect && isNonVolatileStatusEffect(user.status.effect)) {
          statusToApply = user.status.effect;
        }
        return !!statusToApply && target.canSetStatus(statusToApply, false, false, user);
      }
      ),
    new AttackMove(Moves.TRUMP_CARD, PokemonType.NORMAL, MoveCategory.SPECIAL, -1, -1, 5, -1, 0, 4)
      .makesContact()
      .attr(LessPPMorePowerAttr),
    new StatusMove(Moves.HEAL_BLOCK, PokemonType.PSYCHIC, 100, 15, -1, 0, 4)
      .attr(AddBattlerTagAttr, BattlerTagType.HEAL_BLOCK, false, true, 5)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .reflectable(),
    new AttackMove(Moves.WRING_OUT, PokemonType.NORMAL, MoveCategory.SPECIAL, -1, 100, 5, -1, 0, 4)
      .attr(OpponentHighHpPowerAttr, 120)
      .makesContact(),
    new SelfStatusMove(Moves.POWER_TRICK, PokemonType.PSYCHIC, -1, 10, -1, 0, 4)
      .attr(AddBattlerTagAttr, BattlerTagType.POWER_TRICK, true),
    new StatusMove(Moves.GASTRO_ACID, PokemonType.POISON, 100, 10, -1, 0, 4)
      .attr(SuppressAbilitiesAttr)
      .reflectable(),
    new StatusMove(Moves.LUCKY_CHANT, PokemonType.NORMAL, -1, 30, -1, 0, 4)
      .attr(AddArenaTagAttr, ArenaTagType.NO_CRIT, 5, true, true)
      .target(MoveTarget.USER_SIDE),
    new StatusMove(Moves.ME_FIRST, PokemonType.NORMAL, -1, 20, -1, 0, 4)
      .ignoresSubstitute()
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new SelfStatusMove(Moves.COPYCAT, PokemonType.NORMAL, -1, 20, -1, 0, 4)
      .attr(CopyMoveAttr, false, invalidCopycatMoves),
    new StatusMove(Moves.POWER_SWAP, PokemonType.PSYCHIC, -1, 10, 100, 0, 4)
      .attr(SwapStatStagesAttr, [ Stat.ATK, Stat.SPATK ])
      .ignoresSubstitute(),
    new StatusMove(Moves.GUARD_SWAP, PokemonType.PSYCHIC, -1, 10, 100, 0, 4)
      .attr(SwapStatStagesAttr, [ Stat.DEF, Stat.SPDEF ])
      .ignoresSubstitute(),
    new AttackMove(Moves.PUNISHMENT, PokemonType.DARK, MoveCategory.PHYSICAL, -1, 100, 5, -1, 0, 4)
      .makesContact(true)
      .attr(PunishmentPowerAttr),
    new AttackMove(Moves.LAST_RESORT, PokemonType.NORMAL, MoveCategory.PHYSICAL, 140, 100, 5, -1, 0, 4)
      .attr(LastResortAttr),
    new StatusMove(Moves.WORRY_SEED, PokemonType.GRASS, 100, 10, -1, 0, 4)
      .attr(AbilityChangeAttr, Abilities.INSOMNIA)
      .reflectable(),
    new AttackMove(Moves.SUCKER_PUNCH, PokemonType.DARK, MoveCategory.PHYSICAL, 70, 100, 5, -1, 1, 4)
      .condition((user, target, move) => {
        const turnCommand = globalScene.currentBattle.turnCommands[target.getBattlerIndex()];
        if (!turnCommand || !turnCommand.move) {
          return false;
        }
        return (turnCommand.command === Command.FIGHT && !target.turnData.acted && allMoves[turnCommand.move.move].category !== MoveCategory.STATUS);
      }),
    new StatusMove(Moves.TOXIC_SPIKES, PokemonType.POISON, -1, 20, -1, 0, 4)
      .attr(AddArenaTrapTagAttr, ArenaTagType.TOXIC_SPIKES)
      .target(MoveTarget.ENEMY_SIDE)
      .reflectable(),
    new StatusMove(Moves.HEART_SWAP, PokemonType.PSYCHIC, -1, 10, -1, 0, 4)
      .attr(SwapStatStagesAttr, BATTLE_STATS)
      .ignoresSubstitute(),
    new SelfStatusMove(Moves.AQUA_RING, PokemonType.WATER, -1, 20, -1, 0, 4)
      .attr(AddBattlerTagAttr, BattlerTagType.AQUA_RING, true, true),
    new SelfStatusMove(Moves.MAGNET_RISE, PokemonType.ELECTRIC, -1, 10, -1, 0, 4)
      .attr(AddBattlerTagAttr, BattlerTagType.FLOATING, true, true, 5)
      .condition((user, target, move) => !globalScene.arena.getTag(ArenaTagType.GRAVITY) && [ BattlerTagType.FLOATING, BattlerTagType.IGNORE_FLYING, BattlerTagType.INGRAIN ].every((tag) => !user.getTag(tag))),
    new AttackMove(Moves.FLARE_BLITZ, PokemonType.FIRE, MoveCategory.PHYSICAL, 120, 100, 15, 10, 0, 4)
      .attr(RecoilAttr, false, 0.33)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .recklessMove(),
    new AttackMove(Moves.FORCE_PALM, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 60, 100, 10, 30, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.AURA_SPHERE, PokemonType.FIGHTING, MoveCategory.SPECIAL, 80, -1, 20, -1, 0, 4)
      .pulseMove()
      .ballBombMove(),
    new SelfStatusMove(Moves.ROCK_POLISH, PokemonType.ROCK, -1, 20, -1, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPD ], 2, true),
    new AttackMove(Moves.POISON_JAB, PokemonType.POISON, MoveCategory.PHYSICAL, 80, 100, 20, 30, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(Moves.DARK_PULSE, PokemonType.DARK, MoveCategory.SPECIAL, 80, 100, 15, 20, 0, 4)
      .attr(FlinchAttr)
      .pulseMove(),
    new AttackMove(Moves.NIGHT_SLASH, PokemonType.DARK, MoveCategory.PHYSICAL, 70, 100, 15, -1, 0, 4)
      .attr(HighCritAttr)
      .slicingMove(),
    new AttackMove(Moves.AQUA_TAIL, PokemonType.WATER, MoveCategory.PHYSICAL, 90, 90, 10, -1, 0, 4),
    new AttackMove(Moves.SEED_BOMB, PokemonType.GRASS, MoveCategory.PHYSICAL, 80, 100, 15, -1, 0, 4)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(Moves.AIR_SLASH, PokemonType.FLYING, MoveCategory.SPECIAL, 75, 95, 15, 30, 0, 4)
      .attr(FlinchAttr)
      .slicingMove(),
    new AttackMove(Moves.X_SCISSOR, PokemonType.BUG, MoveCategory.PHYSICAL, 80, 100, 15, -1, 0, 4)
      .slicingMove(),
    new AttackMove(Moves.BUG_BUZZ, PokemonType.BUG, MoveCategory.SPECIAL, 90, 100, 10, 10, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -1)
      .soundBased(),
    new AttackMove(Moves.DRAGON_PULSE, PokemonType.DRAGON, MoveCategory.SPECIAL, 85, 100, 10, -1, 0, 4)
      .pulseMove(),
    new AttackMove(Moves.DRAGON_RUSH, PokemonType.DRAGON, MoveCategory.PHYSICAL, 100, 75, 10, 20, 0, 4)
      .attr(AlwaysHitMinimizeAttr)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.MINIMIZED)
      .attr(FlinchAttr),
    new AttackMove(Moves.POWER_GEM, PokemonType.ROCK, MoveCategory.SPECIAL, 80, 100, 20, -1, 0, 4),
    new AttackMove(Moves.DRAIN_PUNCH, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 75, 100, 10, -1, 0, 4)
      .attr(HitHealAttr)
      .punchingMove()
      .triageMove(),
    new AttackMove(Moves.VACUUM_WAVE, PokemonType.FIGHTING, MoveCategory.SPECIAL, 40, 100, 30, -1, 1, 4),
    new AttackMove(Moves.FOCUS_BLAST, PokemonType.FIGHTING, MoveCategory.SPECIAL, 120, 70, 5, 10, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -1)
      .ballBombMove(),
    new AttackMove(Moves.ENERGY_BALL, PokemonType.GRASS, MoveCategory.SPECIAL, 90, 100, 10, 10, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -1)
      .ballBombMove(),
    new AttackMove(Moves.BRAVE_BIRD, PokemonType.FLYING, MoveCategory.PHYSICAL, 120, 100, 15, -1, 0, 4)
      .attr(RecoilAttr, false, 0.33)
      .recklessMove(),
    new AttackMove(Moves.EARTH_POWER, PokemonType.GROUND, MoveCategory.SPECIAL, 90, 100, 10, 10, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -1),
    new StatusMove(Moves.SWITCHEROO, PokemonType.DARK, 100, 10, -1, 0, 4)
      .unimplemented(),
    new AttackMove(Moves.GIGA_IMPACT, PokemonType.NORMAL, MoveCategory.PHYSICAL, 150, 90, 5, -1, 0, 4)
      .attr(RechargeAttr),
    new SelfStatusMove(Moves.NASTY_PLOT, PokemonType.DARK, -1, 20, -1, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], 2, true),
    new AttackMove(Moves.BULLET_PUNCH, PokemonType.STEEL, MoveCategory.PHYSICAL, 40, 100, 30, -1, 1, 4)
      .punchingMove(),
    new AttackMove(Moves.AVALANCHE, PokemonType.ICE, MoveCategory.PHYSICAL, 60, 100, 10, -1, -4, 4)
      .attr(TurnDamagedDoublePowerAttr),
    new AttackMove(Moves.ICE_SHARD, PokemonType.ICE, MoveCategory.PHYSICAL, 40, 100, 30, -1, 1, 4)
      .makesContact(false),
    new AttackMove(Moves.SHADOW_CLAW, PokemonType.GHOST, MoveCategory.PHYSICAL, 70, 100, 15, -1, 0, 4)
      .attr(HighCritAttr),
    new AttackMove(Moves.THUNDER_FANG, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 65, 95, 15, 10, 0, 4)
      .attr(FlinchAttr)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .bitingMove(),
    new AttackMove(Moves.ICE_FANG, PokemonType.ICE, MoveCategory.PHYSICAL, 65, 95, 15, 10, 0, 4)
      .attr(FlinchAttr)
      .attr(StatusEffectAttr, StatusEffect.FREEZE)
      .bitingMove(),
    new AttackMove(Moves.FIRE_FANG, PokemonType.FIRE, MoveCategory.PHYSICAL, 65, 95, 15, 10, 0, 4)
      .attr(FlinchAttr)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .bitingMove(),
    new AttackMove(Moves.SHADOW_SNEAK, PokemonType.GHOST, MoveCategory.PHYSICAL, 40, 100, 30, -1, 1, 4),
    new AttackMove(Moves.MUD_BOMB, PokemonType.GROUND, MoveCategory.SPECIAL, 65, 85, 10, 30, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.ACC ], -1)
      .ballBombMove(),
    new AttackMove(Moves.PSYCHO_CUT, PokemonType.PSYCHIC, MoveCategory.PHYSICAL, 70, 100, 20, -1, 0, 4)
      .attr(HighCritAttr)
      .slicingMove()
      .makesContact(false),
    new AttackMove(Moves.ZEN_HEADBUTT, PokemonType.PSYCHIC, MoveCategory.PHYSICAL, 80, 90, 15, 20, 0, 4)
      .attr(FlinchAttr),
    new AttackMove(Moves.MIRROR_SHOT, PokemonType.STEEL, MoveCategory.SPECIAL, 65, 85, 10, 30, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.ACC ], -1),
    new AttackMove(Moves.FLASH_CANNON, PokemonType.STEEL, MoveCategory.SPECIAL, 80, 100, 10, 10, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -1),
    new AttackMove(Moves.ROCK_CLIMB, PokemonType.NORMAL, MoveCategory.PHYSICAL, 90, 85, 20, 20, 0, 4)
      .attr(ConfuseAttr),
    new StatusMove(Moves.DEFOG, PokemonType.FLYING, -1, 15, -1, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.EVA ], -1)
      .attr(ClearWeatherAttr, WeatherType.FOG)
      .attr(ClearTerrainAttr)
      .attr(RemoveScreensAttr, false)
      .attr(RemoveArenaTrapAttr, true)
      .attr(RemoveArenaTagsAttr, [ ArenaTagType.MIST, ArenaTagType.SAFEGUARD ], false)
      .reflectable(),
    new StatusMove(Moves.TRICK_ROOM, PokemonType.PSYCHIC, -1, 5, -1, -7, 4)
      .attr(AddArenaTagAttr, ArenaTagType.TRICK_ROOM, 5)
      .ignoresProtect()
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.DRACO_METEOR, PokemonType.DRAGON, MoveCategory.SPECIAL, 130, 90, 5, -1, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -2, true),
    new AttackMove(Moves.DISCHARGE, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 80, 100, 15, 30, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.LAVA_PLUME, PokemonType.FIRE, MoveCategory.SPECIAL, 80, 100, 15, 30, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.LEAF_STORM, PokemonType.GRASS, MoveCategory.SPECIAL, 130, 90, 5, -1, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -2, true),
    new AttackMove(Moves.POWER_WHIP, PokemonType.GRASS, MoveCategory.PHYSICAL, 120, 85, 10, -1, 0, 4),
    new AttackMove(Moves.ROCK_WRECKER, PokemonType.ROCK, MoveCategory.PHYSICAL, 150, 90, 5, -1, 0, 4)
      .attr(RechargeAttr)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(Moves.CROSS_POISON, PokemonType.POISON, MoveCategory.PHYSICAL, 70, 100, 20, 10, 0, 4)
      .attr(HighCritAttr)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .slicingMove(),
    new AttackMove(Moves.GUNK_SHOT, PokemonType.POISON, MoveCategory.PHYSICAL, 120, 80, 5, 30, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .makesContact(false),
    new AttackMove(Moves.IRON_HEAD, PokemonType.STEEL, MoveCategory.PHYSICAL, 80, 100, 15, 30, 0, 4)
      .attr(FlinchAttr),
    new AttackMove(Moves.MAGNET_BOMB, PokemonType.STEEL, MoveCategory.PHYSICAL, 60, -1, 20, -1, 0, 4)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(Moves.STONE_EDGE, PokemonType.ROCK, MoveCategory.PHYSICAL, 100, 80, 5, -1, 0, 4)
      .attr(HighCritAttr)
      .makesContact(false),
    new StatusMove(Moves.CAPTIVATE, PokemonType.NORMAL, 100, 20, -1, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -2)
      .condition((user, target, move) => target.isOppositeGender(user))
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .reflectable(),
    new StatusMove(Moves.STEALTH_ROCK, PokemonType.ROCK, -1, 20, -1, 0, 4)
      .attr(AddArenaTrapTagAttr, ArenaTagType.STEALTH_ROCK)
      .target(MoveTarget.ENEMY_SIDE)
      .reflectable(),
    new AttackMove(Moves.GRASS_KNOT, PokemonType.GRASS, MoveCategory.SPECIAL, -1, 100, 20, -1, 0, 4)
      .attr(WeightPowerAttr)
      .makesContact(),
    new AttackMove(Moves.CHATTER, PokemonType.FLYING, MoveCategory.SPECIAL, 65, 100, 20, 100, 0, 4)
      .attr(ConfuseAttr)
      .soundBased(),
    new AttackMove(Moves.JUDGMENT, PokemonType.NORMAL, MoveCategory.SPECIAL, 100, 100, 10, -1, 0, 4)
      .attr(FormChangeItemTypeAttr),
    new AttackMove(Moves.BUG_BITE, PokemonType.BUG, MoveCategory.PHYSICAL, 60, 100, 20, -1, 0, 4)
      .attr(StealEatBerryAttr),
    new AttackMove(Moves.CHARGE_BEAM, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 50, 90, 10, 70, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], 1, true),
    new AttackMove(Moves.WOOD_HAMMER, PokemonType.GRASS, MoveCategory.PHYSICAL, 120, 100, 15, -1, 0, 4)
      .attr(RecoilAttr, false, 0.33)
      .recklessMove(),
    new AttackMove(Moves.AQUA_JET, PokemonType.WATER, MoveCategory.PHYSICAL, 40, 100, 20, -1, 1, 4),
    new AttackMove(Moves.ATTACK_ORDER, PokemonType.BUG, MoveCategory.PHYSICAL, 90, 100, 15, -1, 0, 4)
      .attr(HighCritAttr)
      .makesContact(false),
    new SelfStatusMove(Moves.DEFEND_ORDER, PokemonType.BUG, -1, 10, -1, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.DEF, Stat.SPDEF ], 1, true),
    new SelfStatusMove(Moves.HEAL_ORDER, PokemonType.BUG, -1, 5, -1, 0, 4)
      .attr(HealAttr, 0.5)
      .triageMove(),
    new AttackMove(Moves.HEAD_SMASH, PokemonType.ROCK, MoveCategory.PHYSICAL, 150, 80, 5, -1, 0, 4)
      .attr(RecoilAttr, false, 0.5)
      .recklessMove(),
    new AttackMove(Moves.DOUBLE_HIT, PokemonType.NORMAL, MoveCategory.PHYSICAL, 35, 90, 10, -1, 0, 4)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.ROAR_OF_TIME, PokemonType.DRAGON, MoveCategory.SPECIAL, 150, 90, 5, -1, 0, 4)
      .attr(RechargeAttr),
    new AttackMove(Moves.SPACIAL_REND, PokemonType.DRAGON, MoveCategory.SPECIAL, 100, 95, 5, -1, 0, 4)
      .attr(HighCritAttr),
    new SelfStatusMove(Moves.LUNAR_DANCE, PokemonType.PSYCHIC, -1, 10, -1, 0, 4)
      .attr(SacrificialFullRestoreAttr, true, "moveTriggers:lunarDanceRestore")
      .danceMove()
      .triageMove()
      .condition(failIfLastInPartyCondition),
    new AttackMove(Moves.CRUSH_GRIP, PokemonType.NORMAL, MoveCategory.PHYSICAL, -1, 100, 5, -1, 0, 4)
      .attr(OpponentHighHpPowerAttr, 120),
    new AttackMove(Moves.MAGMA_STORM, PokemonType.FIRE, MoveCategory.SPECIAL, 100, 75, 5, -1, 0, 4)
      .attr(TrapAttr, BattlerTagType.MAGMA_STORM),
    new StatusMove(Moves.DARK_VOID, PokemonType.DARK, 80, 10, -1, 0, 4)  //Accuracy from Generations 4-6
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .reflectable(),
    new AttackMove(Moves.SEED_FLARE, PokemonType.GRASS, MoveCategory.SPECIAL, 120, 85, 5, 40, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -2),
    new AttackMove(Moves.OMINOUS_WIND, PokemonType.GHOST, MoveCategory.SPECIAL, 60, 100, 5, 10, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD ], 1, true)
      .windMove(),
    new ChargingAttackMove(Moves.SHADOW_FORCE, PokemonType.GHOST, MoveCategory.PHYSICAL, 120, 100, 5, -1, 0, 4)
      .chargeText(i18next.t("moveTriggers:vanishedInstantly", { pokemonName: "{USER}" }))
      .chargeAttr(SemiInvulnerableAttr, BattlerTagType.HIDDEN)
      .ignoresProtect(),
    new SelfStatusMove(Moves.HONE_CLAWS, PokemonType.DARK, -1, 15, -1, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.ACC ], 1, true),
    new StatusMove(Moves.WIDE_GUARD, PokemonType.ROCK, -1, 10, -1, 3, 5)
      .target(MoveTarget.USER_SIDE)
      .attr(AddArenaTagAttr, ArenaTagType.WIDE_GUARD, 1, true, true)
      .condition(failIfLastCondition),
    new StatusMove(Moves.GUARD_SPLIT, PokemonType.PSYCHIC, -1, 10, -1, 0, 5)
      .attr(AverageStatsAttr, [ Stat.DEF, Stat.SPDEF ], "moveTriggers:sharedGuard"),
    new StatusMove(Moves.POWER_SPLIT, PokemonType.PSYCHIC, -1, 10, -1, 0, 5)
      .attr(AverageStatsAttr, [ Stat.ATK, Stat.SPATK ], "moveTriggers:sharedPower"),
    new StatusMove(Moves.WONDER_ROOM, PokemonType.PSYCHIC, -1, 10, -1, 0, 5)
      .ignoresProtect()
      .target(MoveTarget.BOTH_SIDES)
      .unimplemented(),
    new AttackMove(Moves.PSYSHOCK, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 5)
      .attr(DefDefAttr),
    new AttackMove(Moves.VENOSHOCK, PokemonType.POISON, MoveCategory.SPECIAL, 65, 100, 10, -1, 0, 5)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.status && (target.status.effect === StatusEffect.POISON || target.status.effect === StatusEffect.TOXIC) ? 2 : 1),
    new SelfStatusMove(Moves.AUTOTOMIZE, PokemonType.STEEL, -1, 15, -1, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.SPD ], 2, true)
      .attr(AddBattlerTagAttr, BattlerTagType.AUTOTOMIZED, true),
    new SelfStatusMove(Moves.RAGE_POWDER, PokemonType.BUG, -1, 20, -1, 2, 5)
      .powderMove()
      .attr(AddBattlerTagAttr, BattlerTagType.CENTER_OF_ATTENTION, true),
    new StatusMove(Moves.TELEKINESIS, PokemonType.PSYCHIC, -1, 15, -1, 0, 5)
      .condition(failOnGravityCondition)
      .condition((_user, target, _move) => ![ Species.DIGLETT, Species.DUGTRIO, Species.ALOLA_DIGLETT, Species.ALOLA_DUGTRIO, Species.SANDYGAST, Species.PALOSSAND, Species.WIGLETT, Species.WUGTRIO ].includes(target.species.speciesId))
      .condition((_user, target, _move) => !(target.species.speciesId === Species.GENGAR && target.getFormKey() === "mega"))
      .condition((_user, target, _move) => isNullOrUndefined(target.getTag(BattlerTagType.INGRAIN)) && isNullOrUndefined(target.getTag(BattlerTagType.IGNORE_FLYING)))
      .attr(AddBattlerTagAttr, BattlerTagType.TELEKINESIS, false, true, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.FLOATING, false, true, 3)
      .reflectable(),
    new StatusMove(Moves.MAGIC_ROOM, PokemonType.PSYCHIC, -1, 10, -1, 0, 5)
      .ignoresProtect()
      .target(MoveTarget.BOTH_SIDES)
      .unimplemented(),
    new AttackMove(Moves.SMACK_DOWN, PokemonType.ROCK, MoveCategory.PHYSICAL, 50, 100, 15, -1, 0, 5)
      .attr(FallDownAttr)
      .attr(AddBattlerTagAttr, BattlerTagType.INTERRUPTED)
      .attr(RemoveBattlerTagAttr, [ BattlerTagType.FLYING, BattlerTagType.FLOATING, BattlerTagType.TELEKINESIS ])
      .attr(HitsTagAttr, BattlerTagType.FLYING)
      .makesContact(false),
    new AttackMove(Moves.STORM_THROW, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 60, 100, 10, -1, 0, 5)
      .attr(CritOnlyAttr),
    new AttackMove(Moves.FLAME_BURST, PokemonType.FIRE, MoveCategory.SPECIAL, 70, 100, 15, -1, 0, 5)
      .attr(FlameBurstAttr),
    new AttackMove(Moves.SLUDGE_WAVE, PokemonType.POISON, MoveCategory.SPECIAL, 95, 100, 10, 10, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new SelfStatusMove(Moves.QUIVER_DANCE, PokemonType.BUG, -1, 20, -1, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.SPATK, Stat.SPDEF, Stat.SPD ], 1, true)
      .danceMove(),
    new AttackMove(Moves.HEAVY_SLAM, PokemonType.STEEL, MoveCategory.PHYSICAL, -1, 100, 10, -1, 0, 5)
      .attr(AlwaysHitMinimizeAttr)
      .attr(CompareWeightPowerAttr)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.MINIMIZED),
    new AttackMove(Moves.SYNCHRONOISE, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 120, 100, 10, -1, 0, 5)
      .target(MoveTarget.ALL_NEAR_OTHERS)
      .condition(unknownTypeCondition)
      .attr(hitsSameTypeAttr),
    new AttackMove(Moves.ELECTRO_BALL, PokemonType.ELECTRIC, MoveCategory.SPECIAL, -1, 100, 10, -1, 0, 5)
      .attr(ElectroBallPowerAttr)
      .ballBombMove(),
    new StatusMove(Moves.SOAK, PokemonType.WATER, 100, 20, -1, 0, 5)
      .attr(ChangeTypeAttr, PokemonType.WATER)
      .reflectable(),
    new AttackMove(Moves.FLAME_CHARGE, PokemonType.FIRE, MoveCategory.PHYSICAL, 50, 100, 20, 100, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.SPD ], 1, true),
    new SelfStatusMove(Moves.COIL, PokemonType.POISON, -1, 20, -1, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF, Stat.ACC ], 1, true),
    new AttackMove(Moves.LOW_SWEEP, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 65, 100, 20, 100, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1),
    new AttackMove(Moves.ACID_SPRAY, PokemonType.POISON, MoveCategory.SPECIAL, 40, 100, 20, 100, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -2)
      .ballBombMove(),
    new AttackMove(Moves.FOUL_PLAY, PokemonType.DARK, MoveCategory.PHYSICAL, 95, 100, 15, -1, 0, 5)
      .attr(TargetAtkUserAtkAttr),
    new StatusMove(Moves.SIMPLE_BEAM, PokemonType.NORMAL, 100, 15, -1, 0, 5)
      .attr(AbilityChangeAttr, Abilities.SIMPLE)
      .reflectable(),
    new StatusMove(Moves.ENTRAINMENT, PokemonType.NORMAL, 100, 15, -1, 0, 5)
      .attr(AbilityGiveAttr)
      .reflectable(),
    new StatusMove(Moves.AFTER_YOU, PokemonType.NORMAL, -1, 15, -1, 0, 5)
      .ignoresProtect()
      .ignoresSubstitute()
      .target(MoveTarget.NEAR_OTHER)
      .condition(failIfSingleBattle)
      .condition((user, target, move) => !target.turnData.acted)
      .attr(AfterYouAttr),
    new AttackMove(Moves.ROUND, PokemonType.NORMAL, MoveCategory.SPECIAL, 60, 100, 15, -1, 0, 5)
      .attr(CueNextRoundAttr)
      .attr(RoundPowerAttr)
      .soundBased(),
    new AttackMove(Moves.ECHOED_VOICE, PokemonType.NORMAL, MoveCategory.SPECIAL, 40, 100, 15, -1, 0, 5)
      .attr(ConsecutiveUseMultiBasePowerAttr, 5, false)
      .soundBased(),
    new AttackMove(Moves.CHIP_AWAY, PokemonType.NORMAL, MoveCategory.PHYSICAL, 70, 100, 20, -1, 0, 5)
      .attr(IgnoreOpponentStatStagesAttr),
    new AttackMove(Moves.CLEAR_SMOG, PokemonType.POISON, MoveCategory.SPECIAL, 50, -1, 15, -1, 0, 5)
      .attr(ResetStatsAttr, false),
    new AttackMove(Moves.STORED_POWER, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 20, 100, 10, -1, 0, 5)
      .attr(PositiveStatStagePowerAttr),
    new StatusMove(Moves.QUICK_GUARD, PokemonType.FIGHTING, -1, 15, -1, 3, 5)
      .target(MoveTarget.USER_SIDE)
      .attr(AddArenaTagAttr, ArenaTagType.QUICK_GUARD, 1, true, true)
      .condition(failIfLastCondition),
    new SelfStatusMove(Moves.ALLY_SWITCH, PokemonType.PSYCHIC, -1, 15, -1, 2, 5)
      .ignoresProtect()
      .unimplemented(),
    new AttackMove(Moves.SCALD, PokemonType.WATER, MoveCategory.SPECIAL, 80, 100, 15, 30, 0, 5)
      .attr(HealStatusEffectAttr, false, StatusEffect.FREEZE)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new SelfStatusMove(Moves.SHELL_SMASH, PokemonType.NORMAL, -1, 15, -1, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPATK, Stat.SPD ], 2, true)
      .attr(StatStageChangeAttr, [ Stat.DEF, Stat.SPDEF ], -1, true),
    new StatusMove(Moves.HEAL_PULSE, PokemonType.PSYCHIC, -1, 10, -1, 0, 5)
      .attr(HealAttr, 0.5, false, false)
      .pulseMove()
      .triageMove()
      .reflectable(),
    new AttackMove(Moves.HEX, PokemonType.GHOST, MoveCategory.SPECIAL, 65, 100, 10, -1, 0, 5)
      .attr(
        MovePowerMultiplierAttr,
        (user, target, move) =>  target.status || target.hasAbility(Abilities.COMATOSE) ? 2 : 1),
    new ChargingAttackMove(Moves.SKY_DROP, PokemonType.FLYING, MoveCategory.PHYSICAL, 60, 100, 10, -1, 0, 5)
      .chargeText(i18next.t("moveTriggers:tookTargetIntoSky", { pokemonName: "{USER}", targetName: "{TARGET}" }))
      .chargeAttr(SemiInvulnerableAttr, BattlerTagType.FLYING)
      .condition(failOnGravityCondition)
      .condition((user, target, move) => !target.getTag(BattlerTagType.SUBSTITUTE))
      .partial(), // Should immobilize the target, Flying types should take no damage. cf https://bulbapedia.bulbagarden.net/wiki/Sky_Drop_(move) and https://www.smogon.com/dex/sv/moves/sky-drop/
    new SelfStatusMove(Moves.SHIFT_GEAR, PokemonType.STEEL, -1, 10, -1, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.ATK ], 1, true)
      .attr(StatStageChangeAttr, [ Stat.SPD ], 2, true),
    new AttackMove(Moves.CIRCLE_THROW, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 60, 90, 10, -1, -6, 5)
      .attr(ForceSwitchOutAttr, false, SwitchType.FORCE_SWITCH)
      .hidesTarget(),
    new AttackMove(Moves.INCINERATE, PokemonType.FIRE, MoveCategory.SPECIAL, 60, 100, 15, -1, 0, 5)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .attr(RemoveHeldItemAttr, true),
    new StatusMove(Moves.QUASH, PokemonType.DARK, 100, 15, -1, 0, 5)
      .condition(failIfSingleBattle)
      .condition((user, target, move) => !target.turnData.acted)
      .attr(ForceLastAttr),
    new AttackMove(Moves.ACROBATICS, PokemonType.FLYING, MoveCategory.PHYSICAL, 55, 100, 15, -1, 0, 5)
      .attr(MovePowerMultiplierAttr, (user, target, move) => Math.max(1, 2 - 0.2 * user.getHeldItems().filter(i => i.isTransferable).reduce((v, m) => v + m.stackCount, 0))),
    new StatusMove(Moves.REFLECT_TYPE, PokemonType.NORMAL, -1, 15, -1, 0, 5)
      .ignoresSubstitute()
      .attr(CopyTypeAttr),
    new AttackMove(Moves.RETALIATE, PokemonType.NORMAL, MoveCategory.PHYSICAL, 70, 100, 5, -1, 0, 5)
      .attr(MovePowerMultiplierAttr, (user, target, move) => {
        const turn = globalScene.currentBattle.turn;
        const lastPlayerFaint = globalScene.currentBattle.playerFaintsHistory[globalScene.currentBattle.playerFaintsHistory.length - 1];
        const lastEnemyFaint = globalScene.currentBattle.enemyFaintsHistory[globalScene.currentBattle.enemyFaintsHistory.length - 1];
        return (
          (lastPlayerFaint !== undefined && turn - lastPlayerFaint.turn === 1 && user.isPlayer()) ||
          (lastEnemyFaint !== undefined && turn - lastEnemyFaint.turn === 1 && !user.isPlayer())
        ) ? 2 : 1;
      }),
    new AttackMove(Moves.FINAL_GAMBIT, PokemonType.FIGHTING, MoveCategory.SPECIAL, -1, 100, 5, -1, 0, 5)
      .attr(UserHpDamageAttr)
      .attr(SacrificialAttrOnHit),
    new StatusMove(Moves.BESTOW, PokemonType.NORMAL, -1, 15, -1, 0, 5)
      .ignoresProtect()
      .ignoresSubstitute()
      .unimplemented(),
    new AttackMove(Moves.INFERNO, PokemonType.FIRE, MoveCategory.SPECIAL, 100, 50, 5, 100, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.WATER_PLEDGE, PokemonType.WATER, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 5)
      .attr(AwaitCombinedPledgeAttr)
      .attr(CombinedPledgeTypeAttr)
      .attr(CombinedPledgePowerAttr)
      .attr(CombinedPledgeStabBoostAttr)
      .attr(AddPledgeEffectAttr, ArenaTagType.WATER_FIRE_PLEDGE, Moves.FIRE_PLEDGE, true)
      .attr(AddPledgeEffectAttr, ArenaTagType.GRASS_WATER_PLEDGE, Moves.GRASS_PLEDGE)
      .attr(BypassRedirectAttr, true),
    new AttackMove(Moves.FIRE_PLEDGE, PokemonType.FIRE, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 5)
      .attr(AwaitCombinedPledgeAttr)
      .attr(CombinedPledgeTypeAttr)
      .attr(CombinedPledgePowerAttr)
      .attr(CombinedPledgeStabBoostAttr)
      .attr(AddPledgeEffectAttr, ArenaTagType.FIRE_GRASS_PLEDGE, Moves.GRASS_PLEDGE)
      .attr(AddPledgeEffectAttr, ArenaTagType.WATER_FIRE_PLEDGE, Moves.WATER_PLEDGE, true)
      .attr(BypassRedirectAttr, true),
    new AttackMove(Moves.GRASS_PLEDGE, PokemonType.GRASS, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 5)
      .attr(AwaitCombinedPledgeAttr)
      .attr(CombinedPledgeTypeAttr)
      .attr(CombinedPledgePowerAttr)
      .attr(CombinedPledgeStabBoostAttr)
      .attr(AddPledgeEffectAttr, ArenaTagType.GRASS_WATER_PLEDGE, Moves.WATER_PLEDGE)
      .attr(AddPledgeEffectAttr, ArenaTagType.FIRE_GRASS_PLEDGE, Moves.FIRE_PLEDGE)
      .attr(BypassRedirectAttr, true),
    new AttackMove(Moves.VOLT_SWITCH, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 70, 100, 20, -1, 0, 5)
      .attr(ForceSwitchOutAttr, true),
    new AttackMove(Moves.STRUGGLE_BUG, PokemonType.BUG, MoveCategory.SPECIAL, 50, 100, 20, 100, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.BULLDOZE, PokemonType.GROUND, MoveCategory.PHYSICAL, 60, 100, 20, 100, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1)
      .attr(MovePowerMultiplierAttr, (user, target, move) => globalScene.arena.getTerrainType() === TerrainType.GRASSY && target.isGrounded() ? 0.5 : 1)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.FROST_BREATH, PokemonType.ICE, MoveCategory.SPECIAL, 60, 90, 10, -1, 0, 5)
      .attr(CritOnlyAttr),
    new AttackMove(Moves.DRAGON_TAIL, PokemonType.DRAGON, MoveCategory.PHYSICAL, 60, 90, 10, -1, -6, 5)
      .attr(ForceSwitchOutAttr, false, SwitchType.FORCE_SWITCH)
      .hidesTarget(),
    new SelfStatusMove(Moves.WORK_UP, PokemonType.NORMAL, -1, 30, -1, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPATK ], 1, true),
    new AttackMove(Moves.ELECTROWEB, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 55, 95, 15, 100, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.WILD_CHARGE, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 90, 100, 15, -1, 0, 5)
      .attr(RecoilAttr)
      .recklessMove(),
    new AttackMove(Moves.DRILL_RUN, PokemonType.GROUND, MoveCategory.PHYSICAL, 80, 95, 10, -1, 0, 5)
      .attr(HighCritAttr),
    new AttackMove(Moves.DUAL_CHOP, PokemonType.DRAGON, MoveCategory.PHYSICAL, 40, 90, 15, -1, 0, 5)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.HEART_STAMP, PokemonType.PSYCHIC, MoveCategory.PHYSICAL, 60, 100, 25, 30, 0, 5)
      .attr(FlinchAttr),
    new AttackMove(Moves.HORN_LEECH, PokemonType.GRASS, MoveCategory.PHYSICAL, 75, 100, 10, -1, 0, 5)
      .attr(HitHealAttr)
      .triageMove(),
    new AttackMove(Moves.SACRED_SWORD, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 90, 100, 15, -1, 0, 5)
      .attr(IgnoreOpponentStatStagesAttr)
      .slicingMove(),
    new AttackMove(Moves.RAZOR_SHELL, PokemonType.WATER, MoveCategory.PHYSICAL, 75, 95, 10, 50, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1)
      .slicingMove(),
    new AttackMove(Moves.HEAT_CRASH, PokemonType.FIRE, MoveCategory.PHYSICAL, -1, 100, 10, -1, 0, 5)
      .attr(AlwaysHitMinimizeAttr)
      .attr(CompareWeightPowerAttr)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.MINIMIZED),
    new AttackMove(Moves.LEAF_TORNADO, PokemonType.GRASS, MoveCategory.SPECIAL, 65, 90, 10, 50, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.ACC ], -1),
    new AttackMove(Moves.STEAMROLLER, PokemonType.BUG, MoveCategory.PHYSICAL, 65, 100, 20, 30, 0, 5)
      .attr(AlwaysHitMinimizeAttr)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.MINIMIZED)
      .attr(FlinchAttr),
    new SelfStatusMove(Moves.COTTON_GUARD, PokemonType.GRASS, -1, 10, -1, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 3, true),
    new AttackMove(Moves.NIGHT_DAZE, PokemonType.DARK, MoveCategory.SPECIAL, 85, 95, 10, 40, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.ACC ], -1),
    new AttackMove(Moves.PSYSTRIKE, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 100, 100, 10, -1, 0, 5)
      .attr(DefDefAttr),
    new AttackMove(Moves.TAIL_SLAP, PokemonType.NORMAL, MoveCategory.PHYSICAL, 25, 85, 10, -1, 0, 5)
      .attr(MultiHitAttr),
    new AttackMove(Moves.HURRICANE, PokemonType.FLYING, MoveCategory.SPECIAL, 110, 70, 10, 30, 0, 5)
      .attr(ThunderAccuracyAttr)
      .attr(ConfuseAttr)
      .attr(HitsTagAttr, BattlerTagType.FLYING)
      .windMove(),
    new AttackMove(Moves.HEAD_CHARGE, PokemonType.NORMAL, MoveCategory.PHYSICAL, 120, 100, 15, -1, 0, 5)
      .attr(RecoilAttr)
      .recklessMove(),
    new AttackMove(Moves.GEAR_GRIND, PokemonType.STEEL, MoveCategory.PHYSICAL, 50, 85, 15, -1, 0, 5)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.SEARING_SHOT, PokemonType.FIRE, MoveCategory.SPECIAL, 100, 100, 5, 30, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .ballBombMove()
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.TECHNO_BLAST, PokemonType.NORMAL, MoveCategory.SPECIAL, 120, 100, 5, -1, 0, 5)
      .attr(TechnoBlastTypeAttr),
    new AttackMove(Moves.RELIC_SONG, PokemonType.NORMAL, MoveCategory.SPECIAL, 75, 100, 10, 10, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.SECRET_SWORD, PokemonType.FIGHTING, MoveCategory.SPECIAL, 85, 100, 10, -1, 0, 5)
      .attr(DefDefAttr)
      .slicingMove(),
    new AttackMove(Moves.GLACIATE, PokemonType.ICE, MoveCategory.SPECIAL, 65, 95, 10, 100, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.BOLT_STRIKE, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 130, 85, 5, 20, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.BLUE_FLARE, PokemonType.FIRE, MoveCategory.SPECIAL, 130, 85, 5, 20, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.FIERY_DANCE, PokemonType.FIRE, MoveCategory.SPECIAL, 80, 100, 10, 50, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], 1, true)
      .danceMove(),
    new ChargingAttackMove(Moves.FREEZE_SHOCK, PokemonType.ICE, MoveCategory.PHYSICAL, 140, 90, 5, 30, 0, 5)
      .chargeText(i18next.t("moveTriggers:becameCloakedInFreezingLight", { pokemonName: "{USER}" }))
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .makesContact(false),
    new ChargingAttackMove(Moves.ICE_BURN, PokemonType.ICE, MoveCategory.SPECIAL, 140, 90, 5, 30, 0, 5)
      .chargeText(i18next.t("moveTriggers:becameCloakedInFreezingAir", { pokemonName: "{USER}" }))
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.SNARL, PokemonType.DARK, MoveCategory.SPECIAL, 55, 95, 15, 100, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -1)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.ICICLE_CRASH, PokemonType.ICE, MoveCategory.PHYSICAL, 85, 90, 10, 30, 0, 5)
      .attr(FlinchAttr)
      .makesContact(false),
    new AttackMove(Moves.V_CREATE, PokemonType.FIRE, MoveCategory.PHYSICAL, 180, 95, 5, -1, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.DEF, Stat.SPDEF, Stat.SPD ], -1, true),
    new AttackMove(Moves.FUSION_FLARE, PokemonType.FIRE, MoveCategory.SPECIAL, 100, 100, 5, -1, 0, 5)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(LastMoveDoublePowerAttr, Moves.FUSION_BOLT),
    new AttackMove(Moves.FUSION_BOLT, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 100, 100, 5, -1, 0, 5)
      .attr(LastMoveDoublePowerAttr, Moves.FUSION_FLARE)
      .makesContact(false),
    new AttackMove(Moves.FLYING_PRESS, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 100, 95, 10, -1, 0, 6)
      .attr(AlwaysHitMinimizeAttr)
      .attr(FlyingTypeMultiplierAttr)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.MINIMIZED)
      .condition(failOnGravityCondition),
    new StatusMove(Moves.MAT_BLOCK, PokemonType.FIGHTING, -1, 10, -1, 0, 6)
      .target(MoveTarget.USER_SIDE)
      .attr(AddArenaTagAttr, ArenaTagType.MAT_BLOCK, 1, true, true)
      .condition(new FirstMoveCondition())
      .condition(failIfLastCondition),
    new AttackMove(Moves.BELCH, PokemonType.POISON, MoveCategory.SPECIAL, 120, 90, 10, -1, 0, 6)
      .condition((user, target, move) => user.battleData.berriesEaten.length > 0),
    new StatusMove(Moves.ROTOTILLER, PokemonType.GROUND, -1, 10, -1, 0, 6)
      .target(MoveTarget.ALL)
      .condition((user, target, move) => {
        // If any fielded pokémon is grass-type and grounded.
        return [ ...globalScene.getEnemyParty(), ...globalScene.getPlayerParty() ].some((poke) => poke.isOfType(PokemonType.GRASS) && poke.isGrounded());
      })
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPATK ], 1, false, { condition: (user, target, move) => target.isOfType(PokemonType.GRASS) && target.isGrounded() }),
    new StatusMove(Moves.STICKY_WEB, PokemonType.BUG, -1, 20, -1, 0, 6)
      .attr(AddArenaTrapTagAttr, ArenaTagType.STICKY_WEB)
      .target(MoveTarget.ENEMY_SIDE)
      .reflectable(),
    new AttackMove(Moves.FELL_STINGER, PokemonType.BUG, MoveCategory.PHYSICAL, 50, 100, 25, -1, 0, 6)
      .attr(PostVictoryStatStageChangeAttr, [ Stat.ATK ], 3, true ),
    new ChargingAttackMove(Moves.PHANTOM_FORCE, PokemonType.GHOST, MoveCategory.PHYSICAL, 90, 100, 10, -1, 0, 6)
      .chargeText(i18next.t("moveTriggers:vanishedInstantly", { pokemonName: "{USER}" }))
      .chargeAttr(SemiInvulnerableAttr, BattlerTagType.HIDDEN)
      .ignoresProtect(),
    new StatusMove(Moves.TRICK_OR_TREAT, PokemonType.GHOST, 100, 20, -1, 0, 6)
      .attr(AddTypeAttr, PokemonType.GHOST)
      .reflectable(),
    new StatusMove(Moves.NOBLE_ROAR, PokemonType.NORMAL, 100, 30, -1, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPATK ], -1)
      .soundBased()
      .reflectable(),
    new StatusMove(Moves.ION_DELUGE, PokemonType.ELECTRIC, -1, 25, -1, 1, 6)
      .attr(AddArenaTagAttr, ArenaTagType.ION_DELUGE)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.PARABOLIC_CHARGE, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 65, 100, 20, -1, 0, 6)
      .attr(HitHealAttr)
      .target(MoveTarget.ALL_NEAR_OTHERS)
      .triageMove(),
    new StatusMove(Moves.FORESTS_CURSE, PokemonType.GRASS, 100, 20, -1, 0, 6)
      .attr(AddTypeAttr, PokemonType.GRASS)
      .reflectable(),
    new AttackMove(Moves.PETAL_BLIZZARD, PokemonType.GRASS, MoveCategory.PHYSICAL, 90, 100, 15, -1, 0, 6)
      .windMove()
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.FREEZE_DRY, PokemonType.ICE, MoveCategory.SPECIAL, 70, 100, 20, 10, 0, 6)
      .attr(StatusEffectAttr, StatusEffect.FREEZE)
      .attr(FreezeDryAttr),
    new AttackMove(Moves.DISARMING_VOICE, PokemonType.FAIRY, MoveCategory.SPECIAL, 40, -1, 15, -1, 0, 6)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.PARTING_SHOT, PokemonType.DARK, 100, 20, -1, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPATK ], -1, false, { trigger: MoveEffectTrigger.PRE_APPLY })
      .attr(ForceSwitchOutAttr, true)
      .soundBased()
      .reflectable(),
    new StatusMove(Moves.TOPSY_TURVY, PokemonType.DARK, -1, 20, -1, 0, 6)
      .attr(InvertStatsAttr)
      .reflectable(),
    new AttackMove(Moves.DRAINING_KISS, PokemonType.FAIRY, MoveCategory.SPECIAL, 50, 100, 10, -1, 0, 6)
      .attr(HitHealAttr, 0.75)
      .makesContact()
      .triageMove(),
    new StatusMove(Moves.CRAFTY_SHIELD, PokemonType.FAIRY, -1, 10, -1, 3, 6)
      .target(MoveTarget.USER_SIDE)
      .attr(AddArenaTagAttr, ArenaTagType.CRAFTY_SHIELD, 1, true, true)
      .condition(failIfLastCondition),
    new StatusMove(Moves.FLOWER_SHIELD, PokemonType.FAIRY, -1, 10, -1, 0, 6)
      .target(MoveTarget.ALL)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 1, false, { condition: (user, target, move) => target.getTypes().includes(PokemonType.GRASS) && !target.getTag(SemiInvulnerableTag) }),
    new StatusMove(Moves.GRASSY_TERRAIN, PokemonType.GRASS, -1, 10, -1, 0, 6)
      .attr(TerrainChangeAttr, TerrainType.GRASSY)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(Moves.MISTY_TERRAIN, PokemonType.FAIRY, -1, 10, -1, 0, 6)
      .attr(TerrainChangeAttr, TerrainType.MISTY)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(Moves.ELECTRIFY, PokemonType.ELECTRIC, -1, 20, -1, 0, 6)
      .attr(AddBattlerTagAttr, BattlerTagType.ELECTRIFIED, false, true),
    new AttackMove(Moves.PLAY_ROUGH, PokemonType.FAIRY, MoveCategory.PHYSICAL, 90, 90, 10, 10, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1),
    new AttackMove(Moves.FAIRY_WIND, PokemonType.FAIRY, MoveCategory.SPECIAL, 40, 100, 30, -1, 0, 6)
      .windMove(),
    new AttackMove(Moves.MOONBLAST, PokemonType.FAIRY, MoveCategory.SPECIAL, 95, 100, 15, 30, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -1),
    new AttackMove(Moves.BOOMBURST, PokemonType.NORMAL, MoveCategory.SPECIAL, 140, 100, 10, -1, 0, 6)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new StatusMove(Moves.FAIRY_LOCK, PokemonType.FAIRY, -1, 10, -1, 0, 6)
      .ignoresSubstitute()
      .ignoresProtect()
      .target(MoveTarget.BOTH_SIDES)
      .attr(AddArenaTagAttr, ArenaTagType.FAIRY_LOCK, 2, true),
    new SelfStatusMove(Moves.KINGS_SHIELD, PokemonType.STEEL, -1, 10, -1, 4, 6)
      .attr(ProtectAttr, BattlerTagType.KINGS_SHIELD)
      .condition(failIfLastCondition),
    new StatusMove(Moves.PLAY_NICE, PokemonType.NORMAL, -1, 20, -1, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1)
      .ignoresSubstitute()
      .reflectable(),
    new StatusMove(Moves.CONFIDE, PokemonType.NORMAL, -1, 20, -1, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -1)
      .soundBased()
      .reflectable(),
    new AttackMove(Moves.DIAMOND_STORM, PokemonType.ROCK, MoveCategory.PHYSICAL, 100, 95, 5, 50, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 2, true, { firstTargetOnly: true })
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.STEAM_ERUPTION, PokemonType.WATER, MoveCategory.SPECIAL, 110, 95, 5, 30, 0, 6)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(HealStatusEffectAttr, false, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.HYPERSPACE_HOLE, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 80, -1, 5, -1, 0, 6)
      .ignoresProtect()
      .ignoresSubstitute(),
    new AttackMove(Moves.WATER_SHURIKEN, PokemonType.WATER, MoveCategory.SPECIAL, 15, 100, 20, -1, 1, 6)
      .attr(MultiHitAttr)
      .attr(WaterShurikenPowerAttr)
      .attr(WaterShurikenMultiHitTypeAttr),
    new AttackMove(Moves.MYSTICAL_FIRE, PokemonType.FIRE, MoveCategory.SPECIAL, 75, 100, 10, 100, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -1),
    new SelfStatusMove(Moves.SPIKY_SHIELD, PokemonType.GRASS, -1, 10, -1, 4, 6)
      .attr(ProtectAttr, BattlerTagType.SPIKY_SHIELD)
      .condition(failIfLastCondition),
    new StatusMove(Moves.AROMATIC_MIST, PokemonType.FAIRY, -1, 20, -1, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], 1)
      .ignoresSubstitute()
      .condition(failIfSingleBattle)
      .target(MoveTarget.NEAR_ALLY),
    new StatusMove(Moves.EERIE_IMPULSE, PokemonType.ELECTRIC, 100, 15, -1, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -2)
      .reflectable(),
    new StatusMove(Moves.VENOM_DRENCH, PokemonType.POISON, 100, 20, -1, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPATK, Stat.SPD ], -1, false, { condition: (user, target, move) => target.status?.effect === StatusEffect.POISON || target.status?.effect === StatusEffect.TOXIC })
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .reflectable(),
    new StatusMove(Moves.POWDER, PokemonType.BUG, 100, 20, -1, 1, 6)
      .attr(AddBattlerTagAttr, BattlerTagType.POWDER, false, true)
      .ignoresSubstitute()
      .powderMove()
      .reflectable(),
    new ChargingSelfStatusMove(Moves.GEOMANCY, PokemonType.FAIRY, -1, 10, -1, 0, 6)
      .chargeText(i18next.t("moveTriggers:isChargingPower", { pokemonName: "{USER}" }))
      .attr(StatStageChangeAttr, [ Stat.SPATK, Stat.SPDEF, Stat.SPD ], 2, true),
    new StatusMove(Moves.MAGNETIC_FLUX, PokemonType.ELECTRIC, -1, 20, -1, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.DEF, Stat.SPDEF ], 1, false, { condition: (user, target, move) => !![ Abilities.PLUS, Abilities.MINUS ].find(a => target.hasAbility(a, false)) })
      .ignoresSubstitute()
      .target(MoveTarget.USER_AND_ALLIES)
      .condition((user, target, move) => !![ user, user.getAlly() ].filter(p => p?.isActive()).find(p => !![ Abilities.PLUS, Abilities.MINUS ].find(a => p?.hasAbility(a, false)))),
    new StatusMove(Moves.HAPPY_HOUR, PokemonType.NORMAL, -1, 30, -1, 0, 6) // No animation
      .attr(AddArenaTagAttr, ArenaTagType.HAPPY_HOUR, null, true)
      .target(MoveTarget.USER_SIDE),
    new StatusMove(Moves.ELECTRIC_TERRAIN, PokemonType.ELECTRIC, -1, 10, -1, 0, 6)
      .attr(TerrainChangeAttr, TerrainType.ELECTRIC)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.DAZZLING_GLEAM, PokemonType.FAIRY, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 6)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new SelfStatusMove(Moves.CELEBRATE, PokemonType.NORMAL, -1, 40, -1, 0, 6)
      .attr(CelebrateAttr),
    new StatusMove(Moves.HOLD_HANDS, PokemonType.NORMAL, -1, 40, -1, 0, 6)
      .ignoresSubstitute()
      .target(MoveTarget.NEAR_ALLY),
    new StatusMove(Moves.BABY_DOLL_EYES, PokemonType.FAIRY, 100, 30, -1, 1, 6)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1)
      .reflectable(),
    new AttackMove(Moves.NUZZLE, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 20, 100, 20, 100, 0, 6)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.HOLD_BACK, PokemonType.NORMAL, MoveCategory.PHYSICAL, 40, 100, 40, -1, 0, 6)
      .attr(SurviveDamageAttr),
    new AttackMove(Moves.INFESTATION, PokemonType.BUG, MoveCategory.SPECIAL, 20, 100, 20, -1, 0, 6)
      .makesContact()
      .attr(TrapAttr, BattlerTagType.INFESTATION),
    new AttackMove(Moves.POWER_UP_PUNCH, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 40, 100, 20, 100, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.ATK ], 1, true)
      .punchingMove(),
    new AttackMove(Moves.OBLIVION_WING, PokemonType.FLYING, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 6)
      .attr(HitHealAttr, 0.75)
      .triageMove(),
    new AttackMove(Moves.THOUSAND_ARROWS, PokemonType.GROUND, MoveCategory.PHYSICAL, 90, 100, 10, -1, 0, 6)
      .attr(NeutralDamageAgainstFlyingTypeMultiplierAttr)
      .attr(FallDownAttr)
      .attr(HitsTagAttr, BattlerTagType.FLYING)
      .attr(HitsTagAttr, BattlerTagType.FLOATING)
      .attr(AddBattlerTagAttr, BattlerTagType.INTERRUPTED)
      .attr(RemoveBattlerTagAttr, [ BattlerTagType.FLYING, BattlerTagType.FLOATING, BattlerTagType.TELEKINESIS ])
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.THOUSAND_WAVES, PokemonType.GROUND, MoveCategory.PHYSICAL, 90, 100, 10, -1, 0, 6)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, false, 1, 1, true)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.LANDS_WRATH, PokemonType.GROUND, MoveCategory.PHYSICAL, 90, 100, 10, -1, 0, 6)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.LIGHT_OF_RUIN, PokemonType.FAIRY, MoveCategory.SPECIAL, 140, 90, 5, -1, 0, 6)
      .attr(RecoilAttr, false, 0.5)
      .recklessMove(),
    new AttackMove(Moves.ORIGIN_PULSE, PokemonType.WATER, MoveCategory.SPECIAL, 110, 85, 10, -1, 0, 6)
      .pulseMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.PRECIPICE_BLADES, PokemonType.GROUND, MoveCategory.PHYSICAL, 120, 85, 10, -1, 0, 6)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.DRAGON_ASCENT, PokemonType.FLYING, MoveCategory.PHYSICAL, 120, 100, 5, -1, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.DEF, Stat.SPDEF ], -1, true),
    new AttackMove(Moves.HYPERSPACE_FURY, PokemonType.DARK, MoveCategory.PHYSICAL, 100, -1, 5, -1, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1, true)
      .ignoresSubstitute()
      .makesContact(false)
      .ignoresProtect(),
    /* Unused */
    new AttackMove(Moves.BREAKNECK_BLITZ__PHYSICAL, PokemonType.NORMAL, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.BREAKNECK_BLITZ__SPECIAL, PokemonType.NORMAL, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.ALL_OUT_PUMMELING__PHYSICAL, PokemonType.FIGHTING, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.ALL_OUT_PUMMELING__SPECIAL, PokemonType.FIGHTING, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.SUPERSONIC_SKYSTRIKE__PHYSICAL, PokemonType.FLYING, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.SUPERSONIC_SKYSTRIKE__SPECIAL, PokemonType.FLYING, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.ACID_DOWNPOUR__PHYSICAL, PokemonType.POISON, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.ACID_DOWNPOUR__SPECIAL, PokemonType.POISON, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.TECTONIC_RAGE__PHYSICAL, PokemonType.GROUND, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.TECTONIC_RAGE__SPECIAL, PokemonType.GROUND, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.CONTINENTAL_CRUSH__PHYSICAL, PokemonType.ROCK, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.CONTINENTAL_CRUSH__SPECIAL, PokemonType.ROCK, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.SAVAGE_SPIN_OUT__PHYSICAL, PokemonType.BUG, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.SAVAGE_SPIN_OUT__SPECIAL, PokemonType.BUG, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.NEVER_ENDING_NIGHTMARE__PHYSICAL, PokemonType.GHOST, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.NEVER_ENDING_NIGHTMARE__SPECIAL, PokemonType.GHOST, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.CORKSCREW_CRASH__PHYSICAL, PokemonType.STEEL, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.CORKSCREW_CRASH__SPECIAL, PokemonType.STEEL, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.INFERNO_OVERDRIVE__PHYSICAL, PokemonType.FIRE, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.INFERNO_OVERDRIVE__SPECIAL, PokemonType.FIRE, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.HYDRO_VORTEX__PHYSICAL, PokemonType.WATER, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.HYDRO_VORTEX__SPECIAL, PokemonType.WATER, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.BLOOM_DOOM__PHYSICAL, PokemonType.GRASS, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.BLOOM_DOOM__SPECIAL, PokemonType.GRASS, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.GIGAVOLT_HAVOC__PHYSICAL, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.GIGAVOLT_HAVOC__SPECIAL, PokemonType.ELECTRIC, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.SHATTERED_PSYCHE__PHYSICAL, PokemonType.PSYCHIC, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.SHATTERED_PSYCHE__SPECIAL, PokemonType.PSYCHIC, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.SUBZERO_SLAMMER__PHYSICAL, PokemonType.ICE, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.SUBZERO_SLAMMER__SPECIAL, PokemonType.ICE, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.DEVASTATING_DRAKE__PHYSICAL, PokemonType.DRAGON, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.DEVASTATING_DRAKE__SPECIAL, PokemonType.DRAGON, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.BLACK_HOLE_ECLIPSE__PHYSICAL, PokemonType.DARK, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.BLACK_HOLE_ECLIPSE__SPECIAL, PokemonType.DARK, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.TWINKLE_TACKLE__PHYSICAL, PokemonType.FAIRY, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.TWINKLE_TACKLE__SPECIAL, PokemonType.FAIRY, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.CATASTROPIKA, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 210, -1, 1, -1, 0, 7)
      .unimplemented(),
    /* End Unused */
    new SelfStatusMove(Moves.SHORE_UP, PokemonType.GROUND, -1, 5, -1, 0, 7)
      .attr(SandHealAttr)
      .triageMove(),
    new AttackMove(Moves.FIRST_IMPRESSION, PokemonType.BUG, MoveCategory.PHYSICAL, 90, 100, 10, -1, 2, 7)
      .condition(new FirstMoveCondition()),
    new SelfStatusMove(Moves.BANEFUL_BUNKER, PokemonType.POISON, -1, 10, -1, 4, 7)
      .attr(ProtectAttr, BattlerTagType.BANEFUL_BUNKER)
      .condition(failIfLastCondition),
    new AttackMove(Moves.SPIRIT_SHACKLE, PokemonType.GHOST, MoveCategory.PHYSICAL, 80, 100, 10, 100, 0, 7)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, false, 1, 1, true)
      .makesContact(false),
    new AttackMove(Moves.DARKEST_LARIAT, PokemonType.DARK, MoveCategory.PHYSICAL, 85, 100, 10, -1, 0, 7)
      .attr(IgnoreOpponentStatStagesAttr),
    new AttackMove(Moves.SPARKLING_ARIA, PokemonType.WATER, MoveCategory.SPECIAL, 90, 100, 10, 100, 0, 7)
      .attr(HealStatusEffectAttr, false, StatusEffect.BURN)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.ICE_HAMMER, PokemonType.ICE, MoveCategory.PHYSICAL, 100, 90, 10, -1, 0, 7)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1, true)
      .punchingMove(),
    new StatusMove(Moves.FLORAL_HEALING, PokemonType.FAIRY, -1, 10, -1, 0, 7)
      .attr(BoostHealAttr, 0.5, 2 / 3, true, false, (user, target, move) => globalScene.arena.terrain?.terrainType === TerrainType.GRASSY)
      .triageMove()
      .reflectable(),
    new AttackMove(Moves.HIGH_HORSEPOWER, PokemonType.GROUND, MoveCategory.PHYSICAL, 95, 95, 10, -1, 0, 7),
    new StatusMove(Moves.STRENGTH_SAP, PokemonType.GRASS, 100, 10, -1, 0, 7)
      .attr(HitHealAttr, null, Stat.ATK)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1)
      .condition((user, target, move) => target.getStatStage(Stat.ATK) > -6)
      .triageMove()
      .reflectable(),
    new ChargingAttackMove(Moves.SOLAR_BLADE, PokemonType.GRASS, MoveCategory.PHYSICAL, 125, 100, 10, -1, 0, 7)
      .chargeText(i18next.t("moveTriggers:isGlowing", { pokemonName: "{USER}" }))
      .chargeAttr(WeatherInstantChargeAttr, [ WeatherType.SUNNY, WeatherType.HARSH_SUN ])
      .attr(AntiSunlightPowerDecreaseAttr)
      .slicingMove(),
    new AttackMove(Moves.LEAFAGE, PokemonType.GRASS, MoveCategory.PHYSICAL, 40, 100, 40, -1, 0, 7)
      .makesContact(false),
    new StatusMove(Moves.SPOTLIGHT, PokemonType.NORMAL, -1, 15, -1, 3, 7)
      .attr(AddBattlerTagAttr, BattlerTagType.CENTER_OF_ATTENTION, false)
      .condition(failIfSingleBattle)
      .reflectable(),
    new StatusMove(Moves.TOXIC_THREAD, PokemonType.POISON, 100, 20, -1, 0, 7)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1)
      .reflectable(),
    new SelfStatusMove(Moves.LASER_FOCUS, PokemonType.NORMAL, -1, 30, -1, 0, 7)
      .attr(AddBattlerTagAttr, BattlerTagType.ALWAYS_CRIT, true, false),
    new StatusMove(Moves.GEAR_UP, PokemonType.STEEL, -1, 20, -1, 0, 7)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPATK ], 1, false, { condition: (user, target, move) => !![ Abilities.PLUS, Abilities.MINUS ].find(a => target.hasAbility(a, false)) })
      .ignoresSubstitute()
      .target(MoveTarget.USER_AND_ALLIES)
      .condition((user, target, move) => !![ user, user.getAlly() ].filter(p => p?.isActive()).find(p => !![ Abilities.PLUS, Abilities.MINUS ].find(a => p?.hasAbility(a, false)))),
    new AttackMove(Moves.THROAT_CHOP, PokemonType.DARK, MoveCategory.PHYSICAL, 80, 100, 15, 100, 0, 7)
      .attr(AddBattlerTagAttr, BattlerTagType.THROAT_CHOPPED),
    new AttackMove(Moves.POLLEN_PUFF, PokemonType.BUG, MoveCategory.SPECIAL, 90, 100, 15, -1, 0, 7)
      .attr(StatusCategoryOnAllyAttr)
      .attr(HealOnAllyAttr, 0.5, true, false)
      .ballBombMove(),
    new AttackMove(Moves.ANCHOR_SHOT, PokemonType.STEEL, MoveCategory.PHYSICAL, 80, 100, 20, 100, 0, 7)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, false, 1, 1, true),
    new StatusMove(Moves.PSYCHIC_TERRAIN, PokemonType.PSYCHIC, -1, 10, -1, 0, 7)
      .attr(TerrainChangeAttr, TerrainType.PSYCHIC)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.LUNGE, PokemonType.BUG, MoveCategory.PHYSICAL, 80, 100, 15, 100, 0, 7)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1),
    new AttackMove(Moves.FIRE_LASH, PokemonType.FIRE, MoveCategory.PHYSICAL, 80, 100, 15, 100, 0, 7)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1),
    new AttackMove(Moves.POWER_TRIP, PokemonType.DARK, MoveCategory.PHYSICAL, 20, 100, 10, -1, 0, 7)
      .attr(PositiveStatStagePowerAttr),
    new AttackMove(Moves.BURN_UP, PokemonType.FIRE, MoveCategory.SPECIAL, 130, 100, 5, -1, 0, 7)
      .condition((user) => {
        const userTypes = user.getTypes(true);
        return userTypes.includes(PokemonType.FIRE);
      })
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(AddBattlerTagAttr, BattlerTagType.BURNED_UP, true, false)
      .attr(RemoveTypeAttr, PokemonType.FIRE, (user) => {
        globalScene.queueMessage(i18next.t("moveTriggers:burnedItselfOut", { pokemonName: getPokemonNameWithAffix(user) }));
      }),
    new StatusMove(Moves.SPEED_SWAP, PokemonType.PSYCHIC, -1, 10, -1, 0, 7)
      .attr(SwapStatAttr, Stat.SPD)
      .ignoresSubstitute(),
    new AttackMove(Moves.SMART_STRIKE, PokemonType.STEEL, MoveCategory.PHYSICAL, 70, -1, 10, -1, 0, 7),
    new StatusMove(Moves.PURIFY, PokemonType.POISON, -1, 20, -1, 0, 7)
      .condition((user, target, move) => {
        if (!target.status) {
          return false;
        }
        return isNonVolatileStatusEffect(target.status.effect);
      })
      .attr(HealAttr, 0.5)
      .attr(HealStatusEffectAttr, false, getNonVolatileStatusEffects())
      .triageMove()
      .reflectable(),
    new AttackMove(Moves.REVELATION_DANCE, PokemonType.NORMAL, MoveCategory.SPECIAL, 90, 100, 15, -1, 0, 7)
      .danceMove()
      .attr(MatchUserTypeAttr),
    new AttackMove(Moves.CORE_ENFORCER, PokemonType.DRAGON, MoveCategory.SPECIAL, 100, 100, 10, -1, 0, 7)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .attr(SuppressAbilitiesIfActedAttr),
    new AttackMove(Moves.TROP_KICK, PokemonType.GRASS, MoveCategory.PHYSICAL, 70, 100, 15, 100, 0, 7)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1),
    new StatusMove(Moves.INSTRUCT, PokemonType.PSYCHIC, -1, 15, -1, 0, 7)
      .ignoresSubstitute()
      .attr(RepeatMoveAttr)
      // incorrect interactions with Gigaton Hammer, Blood Moon & Torment
      // Also has incorrect interactions with Dancer due to the latter
      // erroneously adding copied moves to move history.
      .edgeCase(),
    new AttackMove(Moves.BEAK_BLAST, PokemonType.FLYING, MoveCategory.PHYSICAL, 100, 100, 15, -1, -3, 7)
      .attr(BeakBlastHeaderAttr)
      .ballBombMove()
      .makesContact(false),
    new AttackMove(Moves.CLANGING_SCALES, PokemonType.DRAGON, MoveCategory.SPECIAL, 110, 100, 5, -1, 0, 7)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1, true, { firstTargetOnly: true })
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.DRAGON_HAMMER, PokemonType.DRAGON, MoveCategory.PHYSICAL, 90, 100, 15, -1, 0, 7),
    new AttackMove(Moves.BRUTAL_SWING, PokemonType.DARK, MoveCategory.PHYSICAL, 60, 100, 20, -1, 0, 7)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new StatusMove(Moves.AURORA_VEIL, PokemonType.ICE, -1, 20, -1, 0, 7)
      .condition((user, target, move) => (globalScene.arena.weather?.weatherType === WeatherType.HAIL || globalScene.arena.weather?.weatherType === WeatherType.SNOW) && !globalScene.arena.weather?.isEffectSuppressed())
      .attr(AddArenaTagAttr, ArenaTagType.AURORA_VEIL, 5, true)
      .target(MoveTarget.USER_SIDE),
    /* Unused */
    new AttackMove(Moves.SINISTER_ARROW_RAID, PokemonType.GHOST, MoveCategory.PHYSICAL, 180, -1, 1, -1, 0, 7)
      .unimplemented()
      .makesContact(false)
      .edgeCase(), // I assume it's because the user needs spirit shackle and decidueye
    new AttackMove(Moves.MALICIOUS_MOONSAULT, PokemonType.DARK, MoveCategory.PHYSICAL, 180, -1, 1, -1, 0, 7)
      .unimplemented()
      .attr(AlwaysHitMinimizeAttr)
      .attr(HitsTagAttr, BattlerTagType.MINIMIZED, true)
      .edgeCase(), // I assume it's because it needs darkest lariat and incineroar
    new AttackMove(Moves.OCEANIC_OPERETTA, PokemonType.WATER, MoveCategory.SPECIAL, 195, -1, 1, -1, 0, 7)
      .unimplemented()
      .edgeCase(), // I assume it's because it needs sparkling aria and primarina
    new AttackMove(Moves.GUARDIAN_OF_ALOLA, PokemonType.FAIRY, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.SOUL_STEALING_7_STAR_STRIKE, PokemonType.GHOST, MoveCategory.PHYSICAL, 195, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(Moves.STOKED_SPARKSURFER, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 175, -1, 1, 100, 0, 7)
      .unimplemented()
      .edgeCase(), // I assume it's because it needs thunderbolt and Alola Raichu
    new AttackMove(Moves.PULVERIZING_PANCAKE, PokemonType.NORMAL, MoveCategory.PHYSICAL, 210, -1, 1, -1, 0, 7)
      .unimplemented()
      .edgeCase(), // I assume it's because it needs giga impact and snorlax
    new SelfStatusMove(Moves.EXTREME_EVOBOOST, PokemonType.NORMAL, -1, 1, -1, 0, 7)
      .unimplemented()
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD ], 2, true),
    new AttackMove(Moves.GENESIS_SUPERNOVA, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 185, -1, 1, 100, 0, 7)
      .unimplemented()
      .attr(TerrainChangeAttr, TerrainType.PSYCHIC),
    /* End Unused */
    new AttackMove(Moves.SHELL_TRAP, PokemonType.FIRE, MoveCategory.SPECIAL, 150, 100, 5, -1, -3, 7)
      .attr(AddBattlerTagHeaderAttr, BattlerTagType.SHELL_TRAP)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      // Fails if the user was not hit by a physical attack during the turn
      .condition((user, target, move) => user.getTag(ShellTrapTag)?.activated === true),
    new AttackMove(Moves.FLEUR_CANNON, PokemonType.FAIRY, MoveCategory.SPECIAL, 130, 90, 5, -1, 0, 7)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -2, true),
    new AttackMove(Moves.PSYCHIC_FANGS, PokemonType.PSYCHIC, MoveCategory.PHYSICAL, 85, 100, 10, -1, 0, 7)
      .bitingMove()
      .attr(RemoveScreensAttr),
    new AttackMove(Moves.STOMPING_TANTRUM, PokemonType.GROUND, MoveCategory.PHYSICAL, 75, 100, 10, -1, 0, 7)
      .attr(MovePowerMultiplierAttr, (user, target, move) => user.getLastXMoves(2)[1]?.result === MoveResult.MISS || user.getLastXMoves(2)[1]?.result === MoveResult.FAIL ? 2 : 1),
    new AttackMove(Moves.SHADOW_BONE, PokemonType.GHOST, MoveCategory.PHYSICAL, 85, 100, 10, 20, 0, 7)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1)
      .makesContact(false),
    new AttackMove(Moves.ACCELEROCK, PokemonType.ROCK, MoveCategory.PHYSICAL, 40, 100, 20, -1, 1, 7),
    new AttackMove(Moves.LIQUIDATION, PokemonType.WATER, MoveCategory.PHYSICAL, 85, 100, 10, 20, 0, 7)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1),
    new AttackMove(Moves.PRISMATIC_LASER, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 160, 100, 10, -1, 0, 7)
      .attr(RechargeAttr),
    new AttackMove(Moves.SPECTRAL_THIEF, PokemonType.GHOST, MoveCategory.PHYSICAL, 90, 100, 10, -1, 0, 7)
      .attr(SpectralThiefAttr)
      .ignoresSubstitute(),
    new AttackMove(Moves.SUNSTEEL_STRIKE, PokemonType.STEEL, MoveCategory.PHYSICAL, 100, 100, 5, -1, 0, 7)
      .ignoresAbilities(),
    new AttackMove(Moves.MOONGEIST_BEAM, PokemonType.GHOST, MoveCategory.SPECIAL, 100, 100, 5, -1, 0, 7)
      .ignoresAbilities(),
    new StatusMove(Moves.TEARFUL_LOOK, PokemonType.NORMAL, -1, 20, -1, 0, 7)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPATK ], -1)
      .reflectable(),
    new AttackMove(Moves.ZING_ZAP, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 80, 100, 10, 30, 0, 7)
      .attr(FlinchAttr),
    new AttackMove(Moves.NATURES_MADNESS, PokemonType.FAIRY, MoveCategory.SPECIAL, -1, 90, 10, -1, 0, 7)
      .attr(TargetHalfHpDamageAttr),
    new AttackMove(Moves.MULTI_ATTACK, PokemonType.NORMAL, MoveCategory.PHYSICAL, 120, 100, 10, -1, 0, 7)
      .attr(FormChangeItemTypeAttr),
    /* Unused */
    new AttackMove(Moves.TEN_MILLION_VOLT_THUNDERBOLT, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 195, -1, 1, -1, 0, 7)
      .unimplemented()
      .edgeCase(), // I assume it's because it needs thunderbolt and pikachu in a cap
    /* End Unused */
    new AttackMove(Moves.MIND_BLOWN, PokemonType.FIRE, MoveCategory.SPECIAL, 150, 100, 5, -1, 0, 7)
      .condition(failIfDampCondition)
      .attr(HalfSacrificialAttr)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.PLASMA_FISTS, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 100, 100, 15, -1, 0, 7)
      .attr(AddArenaTagAttr, ArenaTagType.ION_DELUGE, 1)
      .punchingMove(),
    new AttackMove(Moves.PHOTON_GEYSER, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 100, 100, 5, -1, 0, 7)
      .attr(PhotonGeyserCategoryAttr)
      .ignoresAbilities(),
    /* Unused */
    new AttackMove(Moves.LIGHT_THAT_BURNS_THE_SKY, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 200, -1, 1, -1, 0, 7)
      .unimplemented()
      .attr(PhotonGeyserCategoryAttr)
      .ignoresAbilities(),
    new AttackMove(Moves.SEARING_SUNRAZE_SMASH, PokemonType.STEEL, MoveCategory.PHYSICAL, 200, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresAbilities(),
    new AttackMove(Moves.MENACING_MOONRAZE_MAELSTROM, PokemonType.GHOST, MoveCategory.SPECIAL, 200, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresAbilities(),
    new AttackMove(Moves.LETS_SNUGGLE_FOREVER, PokemonType.FAIRY, MoveCategory.PHYSICAL, 190, -1, 1, -1, 0, 7)
      .unimplemented()
      .edgeCase(), // I assume it needs play rough and mimikyu
    new AttackMove(Moves.SPLINTERED_STORMSHARDS, PokemonType.ROCK, MoveCategory.PHYSICAL, 190, -1, 1, -1, 0, 7)
      .unimplemented()
      .attr(ClearTerrainAttr)
      .makesContact(false),
    new AttackMove(Moves.CLANGOROUS_SOULBLAZE, PokemonType.DRAGON, MoveCategory.SPECIAL, 185, -1, 1, 100, 0, 7)
      .unimplemented()
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD ], 1, true, { firstTargetOnly: true })
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .edgeCase(), // I assume it needs clanging scales and Kommo-O
    /* End Unused */
    new AttackMove(Moves.ZIPPY_ZAP, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 50, 100, 15, -1, 2, 7) // LGPE Implementation
      .attr(CritOnlyAttr),
    new AttackMove(Moves.SPLISHY_SPLASH, PokemonType.WATER, MoveCategory.SPECIAL, 90, 100, 15, 30, 0, 7)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.FLOATY_FALL, PokemonType.FLYING, MoveCategory.PHYSICAL, 90, 95, 15, 30, 0, 7)
      .attr(FlinchAttr),
    new AttackMove(Moves.PIKA_PAPOW, PokemonType.ELECTRIC, MoveCategory.SPECIAL, -1, -1, 20, -1, 0, 7)
      .attr(FriendshipPowerAttr),
    new AttackMove(Moves.BOUNCY_BUBBLE, PokemonType.WATER, MoveCategory.SPECIAL, 60, 100, 20, -1, 0, 7)
      .attr(HitHealAttr, 1)
      .triageMove(),
    new AttackMove(Moves.BUZZY_BUZZ, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 60, 100, 20, 100, 0, 7)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.SIZZLY_SLIDE, PokemonType.FIRE, MoveCategory.PHYSICAL, 60, 100, 20, 100, 0, 7)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.GLITZY_GLOW, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 80, 95, 15, -1, 0, 7)
      .attr(AddArenaTagAttr, ArenaTagType.LIGHT_SCREEN, 5, false, true),
    new AttackMove(Moves.BADDY_BAD, PokemonType.DARK, MoveCategory.SPECIAL, 80, 95, 15, -1, 0, 7)
      .attr(AddArenaTagAttr, ArenaTagType.REFLECT, 5, false, true),
    new AttackMove(Moves.SAPPY_SEED, PokemonType.GRASS, MoveCategory.PHYSICAL, 100, 90, 10, -1, 0, 7)
      .attr(LeechSeedAttr)
      .makesContact(false),
    new AttackMove(Moves.FREEZY_FROST, PokemonType.ICE, MoveCategory.SPECIAL, 100, 90, 10, -1, 0, 7)
      .attr(ResetStatsAttr, true),
    new AttackMove(Moves.SPARKLY_SWIRL, PokemonType.FAIRY, MoveCategory.SPECIAL, 120, 85, 5, -1, 0, 7)
      .attr(PartyStatusCureAttr, null, Abilities.NONE),
    new AttackMove(Moves.VEEVEE_VOLLEY, PokemonType.NORMAL, MoveCategory.PHYSICAL, -1, -1, 20, -1, 0, 7)
      .attr(FriendshipPowerAttr),
    new AttackMove(Moves.DOUBLE_IRON_BASH, PokemonType.STEEL, MoveCategory.PHYSICAL, 60, 100, 5, 30, 0, 7)
      .attr(MultiHitAttr, MultiHitType._2)
      .attr(FlinchAttr)
      .punchingMove(),
    /* Unused */
    new SelfStatusMove(Moves.MAX_GUARD, PokemonType.NORMAL, -1, 10, -1, 4, 8)
      .unimplemented()
      .attr(ProtectAttr)
      .condition(failIfLastCondition),
    /* End Unused */
    new AttackMove(Moves.DYNAMAX_CANNON, PokemonType.DRAGON, MoveCategory.SPECIAL, 100, 100, 5, -1, 0, 8)
      .attr(MovePowerMultiplierAttr, (user, target, move) => {
      // Move is only stronger against overleveled foes.
        if (target.level > globalScene.getMaxExpLevel()) {
          const dynamaxCannonPercentMarginBeforeFullDamage = 0.05; // How much % above MaxExpLevel of wave will the target need to be to take full damage.
          // The move's power scales as the margin is approached, reaching double power when it does or goes over it.
          return 1 + Math.min(1, (target.level - globalScene.getMaxExpLevel()) / (globalScene.getMaxExpLevel() * dynamaxCannonPercentMarginBeforeFullDamage));
        } else {
          return 1;
        }
      })
      .attr(DiscourageFrequentUseAttr),

    new AttackMove(Moves.SNIPE_SHOT, PokemonType.WATER, MoveCategory.SPECIAL, 80, 100, 15, -1, 0, 8)
      .attr(HighCritAttr)
      .attr(BypassRedirectAttr),
    new AttackMove(Moves.JAW_LOCK, PokemonType.DARK, MoveCategory.PHYSICAL, 80, 100, 10, -1, 0, 8)
      .attr(JawLockAttr)
      .bitingMove(),
    new SelfStatusMove(Moves.STUFF_CHEEKS, PokemonType.NORMAL, -1, 10, -1, 0, 8)
      .attr(EatBerryAttr, true)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 2, true)
      .condition((user) => {
        const userBerries = globalScene.findModifiers(m => m instanceof BerryModifier, user.isPlayer());
        return userBerries.length > 0;
      })
      .edgeCase(), // Stuff Cheeks should not be selectable when the user does not have a berry, see wiki
    new SelfStatusMove(Moves.NO_RETREAT, PokemonType.FIGHTING, -1, 5, -1, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD ], 1, true)
      .attr(AddBattlerTagAttr, BattlerTagType.NO_RETREAT, true, false)
      .condition((user, target, move) => user.getTag(TrappedTag)?.sourceMove !== Moves.NO_RETREAT), // fails if the user is currently trapped by No Retreat
    new StatusMove(Moves.TAR_SHOT, PokemonType.ROCK, 100, 15, -1, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1)
      .attr(AddBattlerTagAttr, BattlerTagType.TAR_SHOT, false)
      .reflectable(),
    new StatusMove(Moves.MAGIC_POWDER, PokemonType.PSYCHIC, 100, 20, -1, 0, 8)
      .attr(ChangeTypeAttr, PokemonType.PSYCHIC)
      .powderMove()
      .reflectable(),
    new AttackMove(Moves.DRAGON_DARTS, PokemonType.DRAGON, MoveCategory.PHYSICAL, 50, 100, 10, -1, 0, 8)
      .attr(MultiHitAttr, MultiHitType._2)
      .makesContact(false)
      .partial(), // smart targetting is unimplemented
    new StatusMove(Moves.TEATIME, PokemonType.NORMAL, -1, 10, -1, 0, 8)
      .attr(EatBerryAttr, false)
      .target(MoveTarget.ALL),
    new StatusMove(Moves.OCTOLOCK, PokemonType.FIGHTING, 100, 15, -1, 0, 8)
      .condition(failIfGhostTypeCondition)
      .attr(AddBattlerTagAttr, BattlerTagType.OCTOLOCK, false, true, 1),
    new AttackMove(Moves.BOLT_BEAK, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 85, 100, 10, -1, 0, 8)
      .attr(FirstAttackDoublePowerAttr),
    new AttackMove(Moves.FISHIOUS_REND, PokemonType.WATER, MoveCategory.PHYSICAL, 85, 100, 10, -1, 0, 8)
      .attr(FirstAttackDoublePowerAttr)
      .bitingMove(),
    new StatusMove(Moves.COURT_CHANGE, PokemonType.NORMAL, 100, 10, -1, 0, 8)
      .attr(SwapArenaTagsAttr, [ ArenaTagType.AURORA_VEIL, ArenaTagType.LIGHT_SCREEN, ArenaTagType.MIST, ArenaTagType.REFLECT, ArenaTagType.SPIKES, ArenaTagType.STEALTH_ROCK, ArenaTagType.STICKY_WEB, ArenaTagType.TAILWIND, ArenaTagType.TOXIC_SPIKES ]),
    /* Unused */
    new AttackMove(Moves.MAX_FLARE, PokemonType.FIRE, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_FLUTTERBY, PokemonType.BUG, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_LIGHTNING, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_STRIKE, PokemonType.NORMAL, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_KNUCKLE, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_PHANTASM, PokemonType.GHOST, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_HAILSTORM, PokemonType.ICE, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_OOZE, PokemonType.POISON, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_GEYSER, PokemonType.WATER, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_AIRSTREAM, PokemonType.FLYING, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_STARFALL, PokemonType.FAIRY, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_WYRMWIND, PokemonType.DRAGON, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_MINDSTORM, PokemonType.PSYCHIC, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_ROCKFALL, PokemonType.ROCK, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_QUAKE, PokemonType.GROUND, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_DARKNESS, PokemonType.DARK, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_OVERGROWTH, PokemonType.GRASS, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(Moves.MAX_STEELSPIKE, PokemonType.STEEL, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    /* End Unused */
    new SelfStatusMove(Moves.CLANGOROUS_SOUL, PokemonType.DRAGON, 100, 5, -1, 0, 8)
      .attr(CutHpStatStageBoostAttr, [ Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD ], 1, 3)
      .soundBased()
      .danceMove(),
    new AttackMove(Moves.BODY_PRESS, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 80, 100, 10, -1, 0, 8)
      .attr(DefAtkAttr),
    new StatusMove(Moves.DECORATE, PokemonType.FAIRY, -1, 15, -1, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPATK ], 2)
      .ignoresProtect(),
    new AttackMove(Moves.DRUM_BEATING, PokemonType.GRASS, MoveCategory.PHYSICAL, 80, 100, 10, 100, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1)
      .makesContact(false),
    new AttackMove(Moves.SNAP_TRAP, PokemonType.GRASS, MoveCategory.PHYSICAL, 35, 100, 15, -1, 0, 8)
      .attr(TrapAttr, BattlerTagType.SNAP_TRAP),
    new AttackMove(Moves.PYRO_BALL, PokemonType.FIRE, MoveCategory.PHYSICAL, 120, 90, 5, 10, 0, 8)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .ballBombMove()
      .makesContact(false),
    new AttackMove(Moves.BEHEMOTH_BLADE, PokemonType.STEEL, MoveCategory.PHYSICAL, 100, 100, 5, -1, 0, 8)
      .slicingMove(),
    new AttackMove(Moves.BEHEMOTH_BASH, PokemonType.STEEL, MoveCategory.PHYSICAL, 100, 100, 5, -1, 0, 8),
    new AttackMove(Moves.AURA_WHEEL, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 110, 100, 10, 100, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.SPD ], 1, true)
      .makesContact(false)
      .attr(AuraWheelTypeAttr),
    new AttackMove(Moves.BREAKING_SWIPE, PokemonType.DRAGON, MoveCategory.PHYSICAL, 60, 100, 15, 100, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1),
    new AttackMove(Moves.BRANCH_POKE, PokemonType.GRASS, MoveCategory.PHYSICAL, 40, 100, 40, -1, 0, 8),
    new AttackMove(Moves.OVERDRIVE, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 8)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.APPLE_ACID, PokemonType.GRASS, MoveCategory.SPECIAL, 80, 100, 10, 100, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -1),
    new AttackMove(Moves.GRAV_APPLE, PokemonType.GRASS, MoveCategory.PHYSICAL, 80, 100, 10, 100, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1)
      .attr(MovePowerMultiplierAttr, (user, target, move) => globalScene.arena.getTag(ArenaTagType.GRAVITY) ? 1.5 : 1)
      .makesContact(false),
    new AttackMove(Moves.SPIRIT_BREAK, PokemonType.FAIRY, MoveCategory.PHYSICAL, 75, 100, 15, 100, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -1),
    new AttackMove(Moves.STRANGE_STEAM, PokemonType.FAIRY, MoveCategory.SPECIAL, 90, 95, 10, 20, 0, 8)
      .attr(ConfuseAttr),
    new StatusMove(Moves.LIFE_DEW, PokemonType.WATER, -1, 10, -1, 0, 8)
      .attr(HealAttr, 0.25, true, false)
      .target(MoveTarget.USER_AND_ALLIES)
      .ignoresProtect(),
    new SelfStatusMove(Moves.OBSTRUCT, PokemonType.DARK, 100, 10, -1, 4, 8)
      .attr(ProtectAttr, BattlerTagType.OBSTRUCT)
      .condition(failIfLastCondition),
    new AttackMove(Moves.FALSE_SURRENDER, PokemonType.DARK, MoveCategory.PHYSICAL, 80, -1, 10, -1, 0, 8),
    new AttackMove(Moves.METEOR_ASSAULT, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 150, 100, 5, -1, 0, 8)
      .attr(RechargeAttr)
      .makesContact(false),
    new AttackMove(Moves.ETERNABEAM, PokemonType.DRAGON, MoveCategory.SPECIAL, 160, 90, 5, -1, 0, 8)
      .attr(RechargeAttr),
    new AttackMove(Moves.STEEL_BEAM, PokemonType.STEEL, MoveCategory.SPECIAL, 140, 95, 5, -1, 0, 8)
      .attr(HalfSacrificialAttr),
    new AttackMove(Moves.EXPANDING_FORCE, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 8)
      .attr(MovePowerMultiplierAttr, (user, target, move) => globalScene.arena.getTerrainType() === TerrainType.PSYCHIC && user.isGrounded() ? 1.5 : 1)
      .attr(VariableTargetAttr, (user, target, move) => globalScene.arena.getTerrainType() === TerrainType.PSYCHIC && user.isGrounded() ? MoveTarget.ALL_NEAR_ENEMIES : MoveTarget.NEAR_OTHER),
    new AttackMove(Moves.STEEL_ROLLER, PokemonType.STEEL, MoveCategory.PHYSICAL, 130, 100, 5, -1, 0, 8)
      .attr(ClearTerrainAttr)
      .condition((user, target, move) => !!globalScene.arena.terrain),
    new AttackMove(Moves.SCALE_SHOT, PokemonType.DRAGON, MoveCategory.PHYSICAL, 25, 90, 20, -1, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.SPD ], 1, true, { lastHitOnly: true })
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1, true, { lastHitOnly: true })
      .attr(MultiHitAttr)
      .makesContact(false),
    new ChargingAttackMove(Moves.METEOR_BEAM, PokemonType.ROCK, MoveCategory.SPECIAL, 120, 90, 10, -1, 0, 8)
      .chargeText(i18next.t("moveTriggers:isOverflowingWithSpacePower", { pokemonName: "{USER}" }))
      .chargeAttr(StatStageChangeAttr, [ Stat.SPATK ], 1, true),
    new AttackMove(Moves.SHELL_SIDE_ARM, PokemonType.POISON, MoveCategory.SPECIAL, 90, 100, 10, 20, 0, 8)
      .attr(ShellSideArmCategoryAttr)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .partial(), // Physical version of the move does not make contact
    new AttackMove(Moves.MISTY_EXPLOSION, PokemonType.FAIRY, MoveCategory.SPECIAL, 100, 100, 5, -1, 0, 8)
      .attr(SacrificialAttr)
      .target(MoveTarget.ALL_NEAR_OTHERS)
      .attr(MovePowerMultiplierAttr, (user, target, move) => globalScene.arena.getTerrainType() === TerrainType.MISTY && user.isGrounded() ? 1.5 : 1)
      .condition(failIfDampCondition)
      .makesContact(false),
    new AttackMove(Moves.GRASSY_GLIDE, PokemonType.GRASS, MoveCategory.PHYSICAL, 55, 100, 20, -1, 0, 8)
      .attr(IncrementMovePriorityAttr, (user, target, move) => globalScene.arena.getTerrainType() === TerrainType.GRASSY && user.isGrounded()),
    new AttackMove(Moves.RISING_VOLTAGE, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 70, 100, 20, -1, 0, 8)
      .attr(MovePowerMultiplierAttr, (user, target, move) => globalScene.arena.getTerrainType() === TerrainType.ELECTRIC && target.isGrounded() ? 2 : 1),
    new AttackMove(Moves.TERRAIN_PULSE, PokemonType.NORMAL, MoveCategory.SPECIAL, 50, 100, 10, -1, 0, 8)
      .attr(TerrainPulseTypeAttr)
      .attr(MovePowerMultiplierAttr, (user, target, move) => globalScene.arena.getTerrainType() !== TerrainType.NONE && user.isGrounded() ? 2 : 1)
      .pulseMove(),
    new AttackMove(Moves.SKITTER_SMACK, PokemonType.BUG, MoveCategory.PHYSICAL, 70, 90, 10, 100, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -1),
    new AttackMove(Moves.BURNING_JEALOUSY, PokemonType.FIRE, MoveCategory.SPECIAL, 70, 100, 5, 100, 0, 8)
      .attr(StatusIfBoostedAttr, StatusEffect.BURN)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.LASH_OUT, PokemonType.DARK, MoveCategory.PHYSICAL, 75, 100, 5, -1, 0, 8)
      .attr(MovePowerMultiplierAttr, (user, _target, _move) => user.turnData.statStagesDecreased ? 2 : 1),
    new AttackMove(Moves.POLTERGEIST, PokemonType.GHOST, MoveCategory.PHYSICAL, 110, 90, 5, -1, 0, 8)
      .condition(failIfNoTargetHeldItemsCondition)
      .attr(PreMoveMessageAttr, attackedByItemMessageFunc)
      .makesContact(false),
    new StatusMove(Moves.CORROSIVE_GAS, PokemonType.POISON, 100, 40, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_OTHERS)
      .reflectable()
      .unimplemented(),
    new StatusMove(Moves.COACHING, PokemonType.FIGHTING, -1, 10, -1, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF ], 1)
      .target(MoveTarget.NEAR_ALLY)
      .condition(failIfSingleBattle),
    new AttackMove(Moves.FLIP_TURN, PokemonType.WATER, MoveCategory.PHYSICAL, 60, 100, 20, -1, 0, 8)
      .attr(ForceSwitchOutAttr, true),
    new AttackMove(Moves.TRIPLE_AXEL, PokemonType.ICE, MoveCategory.PHYSICAL, 20, 90, 10, -1, 0, 8)
      .attr(MultiHitAttr, MultiHitType._3)
      .attr(MultiHitPowerIncrementAttr, 3)
      .checkAllHits(),
    new AttackMove(Moves.DUAL_WINGBEAT, PokemonType.FLYING, MoveCategory.PHYSICAL, 40, 90, 10, -1, 0, 8)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.SCORCHING_SANDS, PokemonType.GROUND, MoveCategory.SPECIAL, 70, 100, 10, 30, 0, 8)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(HealStatusEffectAttr, false, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new StatusMove(Moves.JUNGLE_HEALING, PokemonType.GRASS, -1, 10, -1, 0, 8)
      .attr(HealAttr, 0.25, true, false)
      .attr(HealStatusEffectAttr, false, getNonVolatileStatusEffects())
      .target(MoveTarget.USER_AND_ALLIES),
    new AttackMove(Moves.WICKED_BLOW, PokemonType.DARK, MoveCategory.PHYSICAL, 75, 100, 5, -1, 0, 8)
      .attr(CritOnlyAttr)
      .punchingMove(),
    new AttackMove(Moves.SURGING_STRIKES, PokemonType.WATER, MoveCategory.PHYSICAL, 25, 100, 5, -1, 0, 8)
      .attr(MultiHitAttr, MultiHitType._3)
      .attr(CritOnlyAttr)
      .punchingMove(),
    new AttackMove(Moves.THUNDER_CAGE, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 80, 90, 15, -1, 0, 8)
      .attr(TrapAttr, BattlerTagType.THUNDER_CAGE),
    new AttackMove(Moves.DRAGON_ENERGY, PokemonType.DRAGON, MoveCategory.SPECIAL, 150, 100, 5, -1, 0, 8)
      .attr(HpPowerAttr)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.FREEZING_GLARE, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 90, 100, 10, 10, 0, 8)
      .attr(StatusEffectAttr, StatusEffect.FREEZE),
    new AttackMove(Moves.FIERY_WRATH, PokemonType.DARK, MoveCategory.SPECIAL, 90, 100, 10, 20, 0, 8)
      .attr(FlinchAttr)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.THUNDEROUS_KICK, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 90, 100, 10, 100, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1),
    new AttackMove(Moves.GLACIAL_LANCE, PokemonType.ICE, MoveCategory.PHYSICAL, 120, 100, 5, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .makesContact(false),
    new AttackMove(Moves.ASTRAL_BARRAGE, PokemonType.GHOST, MoveCategory.SPECIAL, 120, 100, 5, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.EERIE_SPELL, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 5, 100, 0, 8)
      .attr(AttackReducePpMoveAttr, 3)
      .soundBased(),
    new AttackMove(Moves.DIRE_CLAW, PokemonType.POISON, MoveCategory.PHYSICAL, 80, 100, 15, 50, 0, 8)
      .attr(MultiStatusEffectAttr, [ StatusEffect.POISON, StatusEffect.PARALYSIS, StatusEffect.SLEEP ]),
    new AttackMove(Moves.PSYSHIELD_BASH, PokemonType.PSYCHIC, MoveCategory.PHYSICAL, 70, 90, 10, 100, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 1, true),
    new SelfStatusMove(Moves.POWER_SHIFT, PokemonType.NORMAL, -1, 10, -1, 0, 8)
      .target(MoveTarget.USER)
      .attr(ShiftStatAttr, Stat.ATK, Stat.DEF),
    new AttackMove(Moves.STONE_AXE, PokemonType.ROCK, MoveCategory.PHYSICAL, 65, 90, 15, 100, 0, 8)
      .attr(AddArenaTrapTagHitAttr, ArenaTagType.STEALTH_ROCK)
      .slicingMove(),
    new AttackMove(Moves.SPRINGTIDE_STORM, PokemonType.FAIRY, MoveCategory.SPECIAL, 100, 80, 5, 30, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.MYSTICAL_POWER, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 70, 90, 10, 100, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], 1, true),
    new AttackMove(Moves.RAGING_FURY, PokemonType.FIRE, MoveCategory.PHYSICAL, 120, 100, 10, -1, 0, 8)
      .makesContact(false)
      .attr(FrenzyAttr)
      .attr(MissEffectAttr, frenzyMissFunc)
      .attr(NoEffectAttr, frenzyMissFunc)
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new AttackMove(Moves.WAVE_CRASH, PokemonType.WATER, MoveCategory.PHYSICAL, 120, 100, 10, -1, 0, 8)
      .attr(RecoilAttr, false, 0.33)
      .recklessMove(),
    new AttackMove(Moves.CHLOROBLAST, PokemonType.GRASS, MoveCategory.SPECIAL, 150, 95, 5, -1, 0, 8)
      .attr(RecoilAttr, true, 0.5),
    new AttackMove(Moves.MOUNTAIN_GALE, PokemonType.ICE, MoveCategory.PHYSICAL, 100, 85, 10, 30, 0, 8)
      .makesContact(false)
      .attr(FlinchAttr),
    new SelfStatusMove(Moves.VICTORY_DANCE, PokemonType.FIGHTING, -1, 10, -1, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF, Stat.SPD ], 1, true)
      .danceMove(),
    new AttackMove(Moves.HEADLONG_RUSH, PokemonType.GROUND, MoveCategory.PHYSICAL, 120, 100, 5, -1, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.DEF, Stat.SPDEF ], -1, true)
      .punchingMove(),
    new AttackMove(Moves.BARB_BARRAGE, PokemonType.POISON, MoveCategory.PHYSICAL, 60, 100, 10, 50, 0, 8)
      .makesContact(false)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.status && (target.status.effect === StatusEffect.POISON || target.status.effect === StatusEffect.TOXIC) ? 2 : 1)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(Moves.ESPER_WING, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 10, 100, 0, 8)
      .attr(HighCritAttr)
      .attr(StatStageChangeAttr, [ Stat.SPD ], 1, true),
    new AttackMove(Moves.BITTER_MALICE, PokemonType.GHOST, MoveCategory.SPECIAL, 75, 100, 10, 100, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1),
    new SelfStatusMove(Moves.SHELTER, PokemonType.STEEL, -1, 10, -1, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 2, true),
    new AttackMove(Moves.TRIPLE_ARROWS, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 90, 100, 10, 30, 0, 8)
      .makesContact(false)
      .attr(HighCritAttr)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1, false, { effectChanceOverride: 50 })
      .attr(FlinchAttr),
    new AttackMove(Moves.INFERNAL_PARADE, PokemonType.GHOST, MoveCategory.SPECIAL, 60, 100, 15, 30, 0, 8)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.status ? 2 : 1),
    new AttackMove(Moves.CEASELESS_EDGE, PokemonType.DARK, MoveCategory.PHYSICAL, 65, 90, 15, 100, 0, 8)
      .attr(AddArenaTrapTagHitAttr, ArenaTagType.SPIKES)
      .slicingMove(),
    new AttackMove(Moves.BLEAKWIND_STORM, PokemonType.FLYING, MoveCategory.SPECIAL, 100, 80, 10, 30, 0, 8)
      .attr(StormAccuracyAttr)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.WILDBOLT_STORM, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 100, 80, 10, 20, 0, 8)
      .attr(StormAccuracyAttr)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.SANDSEAR_STORM, PokemonType.GROUND, MoveCategory.SPECIAL, 100, 80, 10, 20, 0, 8)
      .attr(StormAccuracyAttr)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.LUNAR_BLESSING, PokemonType.PSYCHIC, -1, 5, -1, 0, 8)
      .attr(HealAttr, 0.25, true, false)
      .attr(HealStatusEffectAttr, false, getNonVolatileStatusEffects())
      .target(MoveTarget.USER_AND_ALLIES)
      .triageMove(),
    new SelfStatusMove(Moves.TAKE_HEART, PokemonType.PSYCHIC, -1, 10, -1, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.SPATK, Stat.SPDEF ], 1, true)
      .attr(HealStatusEffectAttr, true, [ StatusEffect.PARALYSIS, StatusEffect.POISON, StatusEffect.TOXIC, StatusEffect.BURN, StatusEffect.SLEEP ]),
    /* Unused
    new AttackMove(Moves.G_MAX_WILDFIRE, PokemonType.Fire, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
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
    new AttackMove(Moves.G_MAX_CENTIFERNO, PokemonType.Fire, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
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
    new AttackMove(Moves.G_MAX_FIREBALL, PokemonType.Fire, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
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
    new AttackMove(Moves.TERA_BLAST, PokemonType.NORMAL, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 9)
      .attr(TeraMoveCategoryAttr)
      .attr(TeraBlastTypeAttr)
      .attr(TeraBlastPowerAttr)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPATK ], -1, true, { condition: (user, target, move) => user.isTerastallized && user.isOfType(PokemonType.STELLAR) }),
    new SelfStatusMove(Moves.SILK_TRAP, PokemonType.BUG, -1, 10, -1, 4, 9)
      .attr(ProtectAttr, BattlerTagType.SILK_TRAP)
      .condition(failIfLastCondition),
    new AttackMove(Moves.AXE_KICK, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 120, 90, 10, 30, 0, 9)
      .attr(MissEffectAttr, crashDamageFunc)
      .attr(NoEffectAttr, crashDamageFunc)
      .attr(ConfuseAttr)
      .recklessMove(),
    new AttackMove(Moves.LAST_RESPECTS, PokemonType.GHOST, MoveCategory.PHYSICAL, 50, 100, 10, -1, 0, 9)
      .attr(MovePowerMultiplierAttr, (user, target, move) => 1 + Math.min(user.isPlayer() ? globalScene.arena.playerFaints : globalScene.currentBattle.enemyFaints, 100))
      .makesContact(false),
    new AttackMove(Moves.LUMINA_CRASH, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 10, 100, 0, 9)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -2),
    new AttackMove(Moves.ORDER_UP, PokemonType.DRAGON, MoveCategory.PHYSICAL, 80, 100, 10, -1, 0, 9)
      .attr(OrderUpStatBoostAttr)
      .makesContact(false),
    new AttackMove(Moves.JET_PUNCH, PokemonType.WATER, MoveCategory.PHYSICAL, 60, 100, 15, -1, 1, 9)
      .punchingMove(),
    new StatusMove(Moves.SPICY_EXTRACT, PokemonType.GRASS, -1, 15, -1, 0, 9)
      .attr(StatStageChangeAttr, [ Stat.ATK ], 2)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -2),
    new AttackMove(Moves.SPIN_OUT, PokemonType.STEEL, MoveCategory.PHYSICAL, 100, 100, 5, -1, 0, 9)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -2, true),
    new AttackMove(Moves.POPULATION_BOMB, PokemonType.NORMAL, MoveCategory.PHYSICAL, 20, 90, 10, -1, 0, 9)
      .attr(MultiHitAttr, MultiHitType._10)
      .slicingMove()
      .checkAllHits(),
    new AttackMove(Moves.ICE_SPINNER, PokemonType.ICE, MoveCategory.PHYSICAL, 80, 100, 15, -1, 0, 9)
      .attr(ClearTerrainAttr),
    new AttackMove(Moves.GLAIVE_RUSH, PokemonType.DRAGON, MoveCategory.PHYSICAL, 120, 100, 5, -1, 0, 9)
      .attr(AddBattlerTagAttr, BattlerTagType.ALWAYS_GET_HIT, true, false, 0, 0, true)
      .attr(AddBattlerTagAttr, BattlerTagType.RECEIVE_DOUBLE_DAMAGE, true, false, 0, 0, true)
      .condition((user, target, move) => {
        return !(target.getTag(BattlerTagType.PROTECTED)?.tagType === "PROTECTED" || globalScene.arena.getTag(ArenaTagType.MAT_BLOCK)?.tagType === "MAT_BLOCK");
      }),
    new StatusMove(Moves.REVIVAL_BLESSING, PokemonType.NORMAL, -1, 1, -1, 0, 9)
      .triageMove()
      .attr(RevivalBlessingAttr)
      .target(MoveTarget.USER),
    new AttackMove(Moves.SALT_CURE, PokemonType.ROCK, MoveCategory.PHYSICAL, 40, 100, 15, 100, 0, 9)
      .attr(AddBattlerTagAttr, BattlerTagType.SALT_CURED)
      .makesContact(false),
    new AttackMove(Moves.TRIPLE_DIVE, PokemonType.WATER, MoveCategory.PHYSICAL, 30, 95, 10, -1, 0, 9)
      .attr(MultiHitAttr, MultiHitType._3),
    new AttackMove(Moves.MORTAL_SPIN, PokemonType.POISON, MoveCategory.PHYSICAL, 30, 100, 15, 100, 0, 9)
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
    new StatusMove(Moves.DOODLE, PokemonType.NORMAL, 100, 10, -1, 0, 9)
      .attr(AbilityCopyAttr, true),
    new SelfStatusMove(Moves.FILLET_AWAY, PokemonType.NORMAL, -1, 10, -1, 0, 9)
      .attr(CutHpStatStageBoostAttr, [ Stat.ATK, Stat.SPATK, Stat.SPD ], 2, 2),
    new AttackMove(Moves.KOWTOW_CLEAVE, PokemonType.DARK, MoveCategory.PHYSICAL, 85, -1, 10, -1, 0, 9)
      .slicingMove(),
    new AttackMove(Moves.FLOWER_TRICK, PokemonType.GRASS, MoveCategory.PHYSICAL, 70, -1, 10, -1, 0, 9)
      .attr(CritOnlyAttr)
      .makesContact(false),
    new AttackMove(Moves.TORCH_SONG, PokemonType.FIRE, MoveCategory.SPECIAL, 80, 100, 10, 100, 0, 9)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], 1, true)
      .soundBased(),
    new AttackMove(Moves.AQUA_STEP, PokemonType.WATER, MoveCategory.PHYSICAL, 80, 100, 10, 100, 0, 9)
      .attr(StatStageChangeAttr, [ Stat.SPD ], 1, true)
      .danceMove(),
    new AttackMove(Moves.RAGING_BULL, PokemonType.NORMAL, MoveCategory.PHYSICAL, 90, 100, 10, -1, 0, 9)
      .attr(RagingBullTypeAttr)
      .attr(RemoveScreensAttr),
    new AttackMove(Moves.MAKE_IT_RAIN, PokemonType.STEEL, MoveCategory.SPECIAL, 120, 100, 5, -1, 0, 9)
      .attr(MoneyAttr)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -1, true, { firstTargetOnly: true })
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.PSYBLADE, PokemonType.PSYCHIC, MoveCategory.PHYSICAL, 80, 100, 15, -1, 0, 9)
      .attr(MovePowerMultiplierAttr, (user, target, move) => globalScene.arena.getTerrainType() === TerrainType.ELECTRIC && user.isGrounded() ? 1.5 : 1)
      .slicingMove(),
    new AttackMove(Moves.HYDRO_STEAM, PokemonType.WATER, MoveCategory.SPECIAL, 80, 100, 15, -1, 0, 9)
      .attr(IgnoreWeatherTypeDebuffAttr, WeatherType.SUNNY)
      .attr(MovePowerMultiplierAttr, (user, target, move) => {
        const weather = globalScene.arena.weather;
        if (!weather) {
          return 1;
        }
        return [ WeatherType.SUNNY, WeatherType.HARSH_SUN ].includes(weather.weatherType) && !weather.isEffectSuppressed() ? 1.5 : 1;
      }),
    new AttackMove(Moves.RUINATION, PokemonType.DARK, MoveCategory.SPECIAL, -1, 90, 10, -1, 0, 9)
      .attr(TargetHalfHpDamageAttr),
    new AttackMove(Moves.COLLISION_COURSE, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 100, 100, 5, -1, 0, 9)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.getAttackTypeEffectiveness(move.type, user) >= 2 ? 5461 / 4096 : 1),
    new AttackMove(Moves.ELECTRO_DRIFT, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 100, 100, 5, -1, 0, 9)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.getAttackTypeEffectiveness(move.type, user) >= 2 ? 5461 / 4096 : 1)
      .makesContact(),
    new SelfStatusMove(Moves.SHED_TAIL, PokemonType.NORMAL, -1, 10, -1, 0, 9)
      .attr(AddSubstituteAttr, 0.5, true)
      .attr(ForceSwitchOutAttr, true, SwitchType.SHED_TAIL)
      .condition(failIfLastInPartyCondition),
    new SelfStatusMove(Moves.CHILLY_RECEPTION, PokemonType.ICE, -1, 10, -1, 0, 9)
      .attr(PreMoveMessageAttr, (user, move) => i18next.t("moveTriggers:chillyReception", { pokemonName: getPokemonNameWithAffix(user) }))
      .attr(ChillyReceptionAttr, true),
    new SelfStatusMove(Moves.TIDY_UP, PokemonType.NORMAL, -1, 10, -1, 0, 9)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPD ], 1, true)
      .attr(RemoveArenaTrapAttr, true)
      .attr(RemoveAllSubstitutesAttr),
    new StatusMove(Moves.SNOWSCAPE, PokemonType.ICE, -1, 10, -1, 0, 9)
      .attr(WeatherChangeAttr, WeatherType.SNOW)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.POUNCE, PokemonType.BUG, MoveCategory.PHYSICAL, 50, 100, 20, 100, 0, 9)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1),
    new AttackMove(Moves.TRAILBLAZE, PokemonType.GRASS, MoveCategory.PHYSICAL, 50, 100, 20, 100, 0, 9)
      .attr(StatStageChangeAttr, [ Stat.SPD ], 1, true),
    new AttackMove(Moves.CHILLING_WATER, PokemonType.WATER, MoveCategory.SPECIAL, 50, 100, 20, 100, 0, 9)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1),
    new AttackMove(Moves.HYPER_DRILL, PokemonType.NORMAL, MoveCategory.PHYSICAL, 100, 100, 5, -1, 0, 9)
      .ignoresProtect(),
    new AttackMove(Moves.TWIN_BEAM, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 40, 100, 10, -1, 0, 9)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.RAGE_FIST, PokemonType.GHOST, MoveCategory.PHYSICAL, 50, 100, 10, -1, 0, 9)
      .edgeCase() // Counter incorrectly increases on confusion self-hits
      .attr(RageFistPowerAttr)
      .punchingMove(),
    new AttackMove(Moves.ARMOR_CANNON, PokemonType.FIRE, MoveCategory.SPECIAL, 120, 100, 5, -1, 0, 9)
      .attr(StatStageChangeAttr, [ Stat.DEF, Stat.SPDEF ], -1, true),
    new AttackMove(Moves.BITTER_BLADE, PokemonType.FIRE, MoveCategory.PHYSICAL, 90, 100, 10, -1, 0, 9)
      .attr(HitHealAttr)
      .slicingMove()
      .triageMove(),
    new AttackMove(Moves.DOUBLE_SHOCK, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 120, 100, 5, -1, 0, 9)
      .condition((user) => {
        const userTypes = user.getTypes(true);
        return userTypes.includes(PokemonType.ELECTRIC);
      })
      .attr(AddBattlerTagAttr, BattlerTagType.DOUBLE_SHOCKED, true, false)
      .attr(RemoveTypeAttr, PokemonType.ELECTRIC, (user) => {
        globalScene.queueMessage(i18next.t("moveTriggers:usedUpAllElectricity", { pokemonName: getPokemonNameWithAffix(user) }));
      }),
    new AttackMove(Moves.GIGATON_HAMMER, PokemonType.STEEL, MoveCategory.PHYSICAL, 160, 100, 5, -1, 0, 9)
      .makesContact(false)
      .condition((user, target, move) => {
        const turnMove = user.getLastXMoves(1);
        return !turnMove.length || turnMove[0].move !== move.id || turnMove[0].result !== MoveResult.SUCCESS;
      }), // TODO Add Instruct/Encore interaction
    new AttackMove(Moves.COMEUPPANCE, PokemonType.DARK, MoveCategory.PHYSICAL, -1, 100, 10, -1, 0, 9)
      .attr(CounterDamageAttr, (move: Move) => (move.category === MoveCategory.PHYSICAL || move.category === MoveCategory.SPECIAL), 1.5)
      .redirectCounter()
      .target(MoveTarget.ATTACKER),
    new AttackMove(Moves.AQUA_CUTTER, PokemonType.WATER, MoveCategory.PHYSICAL, 70, 100, 20, -1, 0, 9)
      .attr(HighCritAttr)
      .slicingMove()
      .makesContact(false),
    new AttackMove(Moves.BLAZING_TORQUE, PokemonType.FIRE, MoveCategory.PHYSICAL, 80, 100, 10, 30, 0, 9)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .makesContact(false),
    new AttackMove(Moves.WICKED_TORQUE, PokemonType.DARK, MoveCategory.PHYSICAL, 80, 100, 10, 10, 0, 9)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .makesContact(false),
    new AttackMove(Moves.NOXIOUS_TORQUE, PokemonType.POISON, MoveCategory.PHYSICAL, 100, 100, 10, 30, 0, 9)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .makesContact(false),
    new AttackMove(Moves.COMBAT_TORQUE, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 100, 100, 10, 30, 0, 9)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .makesContact(false),
    new AttackMove(Moves.MAGICAL_TORQUE, PokemonType.FAIRY, MoveCategory.PHYSICAL, 100, 100, 10, 30, 0, 9)
      .attr(ConfuseAttr)
      .makesContact(false),
    new AttackMove(Moves.BLOOD_MOON, PokemonType.NORMAL, MoveCategory.SPECIAL, 140, 100, 5, -1, 0, 9)
      .condition((user, target, move) => {
        const turnMove = user.getLastXMoves(1);
        return !turnMove.length || turnMove[0].move !== move.id || turnMove[0].result !== MoveResult.SUCCESS;
      }), // TODO Add Instruct/Encore interaction
    new AttackMove(Moves.MATCHA_GOTCHA, PokemonType.GRASS, MoveCategory.SPECIAL, 80, 90, 15, 20, 0, 9)
      .attr(HitHealAttr)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(HealStatusEffectAttr, false, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .triageMove(),
    new AttackMove(Moves.SYRUP_BOMB, PokemonType.GRASS, MoveCategory.SPECIAL, 60, 85, 10, 100, 0, 9)
      .attr(AddBattlerTagAttr, BattlerTagType.SYRUP_BOMB, false, false, 3)
      .ballBombMove(),
    new AttackMove(Moves.IVY_CUDGEL, PokemonType.GRASS, MoveCategory.PHYSICAL, 100, 100, 10, -1, 0, 9)
      .attr(IvyCudgelTypeAttr)
      .attr(HighCritAttr)
      .makesContact(false),
    new ChargingAttackMove(Moves.ELECTRO_SHOT, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 130, 100, 10, 100, 0, 9)
      .chargeText(i18next.t("moveTriggers:absorbedElectricity", { pokemonName: "{USER}" }))
      .chargeAttr(StatStageChangeAttr, [ Stat.SPATK ], 1, true)
      .chargeAttr(WeatherInstantChargeAttr, [ WeatherType.RAIN, WeatherType.HEAVY_RAIN ]),
    new AttackMove(Moves.TERA_STARSTORM, PokemonType.NORMAL, MoveCategory.SPECIAL, 120, 100, 5, -1, 0, 9)
      .attr(TeraMoveCategoryAttr)
      .attr(TeraStarstormTypeAttr)
      .attr(VariableTargetAttr, (user, target, move) => user.hasSpecies(Species.TERAPAGOS) && (user.isTerastallized || globalScene.currentBattle.preTurnCommands[user.getFieldIndex()]?.command === Command.TERA) ? MoveTarget.ALL_NEAR_ENEMIES : MoveTarget.NEAR_OTHER)
      .partial(), /** Does not ignore abilities that affect stats, relevant in determining the move's category {@see TeraMoveCategoryAttr} */
    new AttackMove(Moves.FICKLE_BEAM, PokemonType.DRAGON, MoveCategory.SPECIAL, 80, 100, 5, 30, 0, 9)
      .attr(PreMoveMessageAttr, doublePowerChanceMessageFunc)
      .attr(DoublePowerChanceAttr)
      .edgeCase(), // Should not interact with Sheer Force
    new SelfStatusMove(Moves.BURNING_BULWARK, PokemonType.FIRE, -1, 10, -1, 4, 9)
      .attr(ProtectAttr, BattlerTagType.BURNING_BULWARK)
      .condition(failIfLastCondition),
    new AttackMove(Moves.THUNDERCLAP, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 70, 100, 5, -1, 1, 9)
      .condition((user, target, move) => {
        const turnCommand = globalScene.currentBattle.turnCommands[target.getBattlerIndex()];
        if (!turnCommand || !turnCommand.move) {
          return false;
        }
        return (turnCommand.command === Command.FIGHT && !target.turnData.acted && allMoves[turnCommand.move.move].category !== MoveCategory.STATUS);
      }),
    new AttackMove(Moves.MIGHTY_CLEAVE, PokemonType.ROCK, MoveCategory.PHYSICAL, 95, 100, 5, -1, 0, 9)
      .slicingMove()
      .ignoresProtect(),
    new AttackMove(Moves.TACHYON_CUTTER, PokemonType.STEEL, MoveCategory.SPECIAL, 50, -1, 10, -1, 0, 9)
      .attr(MultiHitAttr, MultiHitType._2)
      .slicingMove(),
    new AttackMove(Moves.HARD_PRESS, PokemonType.STEEL, MoveCategory.PHYSICAL, -1, 100, 10, -1, 0, 9)
      .attr(OpponentHighHpPowerAttr, 100),
    new StatusMove(Moves.DRAGON_CHEER, PokemonType.DRAGON, -1, 15, -1, 0, 9)
      .attr(AddBattlerTagAttr, BattlerTagType.DRAGON_CHEER, false, true)
      .target(MoveTarget.NEAR_ALLY),
    new AttackMove(Moves.ALLURING_VOICE, PokemonType.FAIRY, MoveCategory.SPECIAL, 80, 100, 10, 100, 0, 9)
      .attr(AddBattlerTagIfBoostedAttr, BattlerTagType.CONFUSED)
      .soundBased(),
    new AttackMove(Moves.TEMPER_FLARE, PokemonType.FIRE, MoveCategory.PHYSICAL, 75, 100, 10, -1, 0, 9)
      .attr(MovePowerMultiplierAttr, (user, target, move) => user.getLastXMoves(2)[1]?.result === MoveResult.MISS || user.getLastXMoves(2)[1]?.result === MoveResult.FAIL ? 2 : 1),
    new AttackMove(Moves.SUPERCELL_SLAM, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 100, 95, 15, -1, 0, 9)
      .attr(AlwaysHitMinimizeAttr)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.MINIMIZED)
      .attr(MissEffectAttr, crashDamageFunc)
      .attr(NoEffectAttr, crashDamageFunc)
      .recklessMove(),
    new AttackMove(Moves.PSYCHIC_NOISE, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 75, 100, 10, 100, 0, 9)
      .soundBased()
      .attr(AddBattlerTagAttr, BattlerTagType.HEAL_BLOCK, false, false, 2),
    new AttackMove(Moves.UPPER_HAND, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 65, 100, 15, 100, 3, 9)
      .attr(FlinchAttr)
      .condition(new UpperHandCondition()),
    new AttackMove(Moves.MALIGNANT_CHAIN, PokemonType.POISON, MoveCategory.SPECIAL, 100, 100, 5, 50, 0, 9)
      .attr(StatusEffectAttr, StatusEffect.TOXIC)
  );
  allMoves.map(m => {
    if (m.getAttrs(StatStageChangeAttr).some(a => a.selfTarget && a.stages < 0)) {
      selfStatLowerMoves.push(m.id);
    }
  });
}
