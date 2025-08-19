import { AbAttrParamsWithCancel, PreAttackModifyPowerAbAttrParams } from "#abilities/ability";
import {
  applyAbAttrs
} from "#abilities/apply-ab-attrs";
import { loggedInUser } from "#app/account";
import type { GameMode } from "#app/game-mode";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import type { ArenaTrapTag } from "#data/arena-tag";
import { WeakenMoveTypeTag } from "#data/arena-tag";
import { MoveChargeAnim } from "#data/battle-anims";
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
} from "#data/battler-tags";
import { getBerryEffectFunc } from "#data/berry";
import { allAbilities, allMoves } from "#data/data-lists";
import { SpeciesFormChangeRevertWeatherFormTrigger } from "#data/form-change-triggers";
import { DelayedAttackTag } from "#data/positional-tags/positional-tag";
import {
  getNonVolatileStatusEffects,
  getStatusEffectHealText,
  isNonVolatileStatusEffect,
} from "#data/status-effect";
import { TerrainType } from "#data/terrain";
import { getTypeDamageMultiplier } from "#data/type";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattleType } from "#enums/battle-type";
import type { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { BiomeId } from "#enums/biome-id";
import { ChallengeType } from "#enums/challenge-type";
import { Command } from "#enums/command";
import { FieldPosition } from "#enums/field-position";
import { HitResult } from "#enums/hit-result";
import { ModifierPoolType } from "#enums/modifier-pool-type";
import { ChargeAnim } from "#enums/move-anims-common";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { isVirtual, MoveUseMode } from "#enums/move-use-mode";
import { MoveCategory } from "#enums/move-category";
import { MoveEffectTrigger } from "#enums/move-effect-trigger";
import { MoveFlags } from "#enums/move-flags";
import { MoveTarget } from "#enums/move-target";
import { MultiHitType } from "#enums/multi-hit-type";
import { PokemonType } from "#enums/pokemon-type";
import { PositionalTagType } from "#enums/positional-tag-type";
import { SpeciesId } from "#enums/species-id";
import {
  BATTLE_STATS,
  type BattleStat,
  type EffectiveStat,
  getStatKey,
  Stat,
} from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { SwitchType } from "#enums/switch-type";
import { WeatherType } from "#enums/weather-type";
import { MoveUsedEvent } from "#events/battle-scene";
import { EnemyPokemon, Pokemon } from "#field/pokemon";
import {
  AttackTypeBoosterModifier,
  BerryModifier,
  PokemonHeldItemModifier,
  PokemonMoveAccuracyBoosterModifier,
  PokemonMultiHitModifier,
  PreserveBerryModifier,
} from "#modifiers/modifier";
import { applyMoveAttrs } from "#moves/apply-attrs";
import { invalidAssistMoves, invalidCopycatMoves, invalidMetronomeMoves, invalidMirrorMoveMoves, invalidSketchMoves, invalidSleepTalkMoves } from "#moves/invalid-moves";
import { frenzyMissFunc, getMoveTargets } from "#moves/move-utils";
import { PokemonMove } from "#moves/pokemon-move";
import { MoveEndPhase } from "#phases/move-end-phase";
import { MovePhase } from "#phases/move-phase";
import { PokemonHealPhase } from "#phases/pokemon-heal-phase";
import { SwitchSummonPhase } from "#phases/switch-summon-phase";
import type { AttackMoveResult } from "#types/attack-move-result";
import type { Localizable } from "#types/locales";
import type { ChargingMove, MoveAttrMap, MoveAttrString, MoveClassMap, MoveKindString, MoveMessageFunc } from "#types/move-types";
import type { TurnMove } from "#types/turn-move";
import { BooleanHolder, type Constructor, isNullOrUndefined, NumberHolder, randSeedFloat, randSeedInt, randSeedItem, toDmgValue } from "#utils/common";
import { getEnumValues } from "#utils/enums";
import { toCamelCase, toTitleCase } from "#utils/strings";
import i18next from "i18next";
import { applyChallenges } from "#utils/challenge-utils";

/**
 * A function used to conditionally determine execution of a given {@linkcode MoveAttr}.
 * Conventionally returns `true` for success and `false` for failure.
*/
type MoveConditionFunc = (user: Pokemon, target: Pokemon, move: Move) => boolean;
export type UserMoveConditionFunc = (user: Pokemon, move: Move) => boolean;

export abstract class Move implements Localizable {
  public id: MoveId;
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

  /**
   * Check if the move is of the given subclass without requiring `instanceof`.
   *
   * ! Does _not_ work for {@linkcode ChargingAttackMove} and {@linkcode ChargingSelfStatusMove} subclasses. For those,
   * use {@linkcode isChargingMove} instead.
   *
   * @param moveKind - The string name of the move to check against
   * @returns Whether this move is of the provided type.
   */
  public abstract is<K extends MoveKindString>(moveKind: K): this is MoveClassMap[K];

  constructor(id: MoveId, type: PokemonType, category: MoveCategory, defaultMoveTarget: MoveTarget, power: number, accuracy: number, pp: number, chance: number, priority: number, generation: number) {
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
    const i18nKey = toCamelCase(MoveId[this.id])

    if (this.id === MoveId.NONE) {
      this.name = "";
      this.effect = ""
      return;
    }

    this.name = `${i18next.t(`move:${i18nKey}.name`)}${this.nameAppend}`;
    this.effect = `${i18next.t(`move:${i18nKey}.effect`)}${this.nameAppend}`;
  }

  /**
   * Get all move attributes that match `attrType`.
   * @param attrType - The name of a {@linkcode MoveAttr} to search for
   * @returns An array containing all attributes matching `attrType`, or an empty array if none match.
   */
  getAttrs<T extends MoveAttrString>(attrType: T): (MoveAttrMap[T])[] {
    const targetAttr = MoveAttrs[attrType];
    if (!targetAttr) {
      return [];
    }
    return this.attrs.filter((a): a is MoveAttrMap[T] => a instanceof targetAttr);
  }

  /**
   * Check if a move has an attribute that matches `attrType`.
   * @param attrType - The name of a {@linkcode MoveAttr} to search for
   * @returns Whether this move has at least 1 attribute that matches `attrType`
   */
  hasAttr(attrType: MoveAttrString): boolean {
    const targetAttr = MoveAttrs[attrType];
    // Guard against invalid attrType
    if (!targetAttr) {
      return false;
    }
    return this.attrs.some((attr) => attr instanceof targetAttr);
  }

  /**
   * Find the first attribute that matches a given predicate function.
   * @param attrPredicate - The predicate function to search `MoveAttr`s by
   * @returns The first {@linkcode MoveAttr} for which `attrPredicate` returns `true`
   */
  findAttr(attrPredicate: (attr: MoveAttr) => boolean): MoveAttr {
    // TODO: Remove bang and make return type `MoveAttr | undefined`,
    // as well as add overload for functions of type `x is T`
    return this.attrs.find(attrPredicate)!;
  }

  /**
   * Adds a new MoveAttr to this move (appends to the attr array).
   * If the MoveAttr also comes with a condition, it is added to its {@linkcode MoveCondition} array.
   * @param attrType - The {@linkcode MoveAttr} to add
   * @param args - The arguments needed to instantiate the given class
   * @returns `this`
   */
  attr<T extends Constructor<MoveAttr>>(attrType: T, ...args: ConstructorParameters<T>): this {
    const attr = new attrType(...args);
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
   * Adds a new MoveAttr to this move (appends to the attr array).
   * If the MoveAttr also comes with a condition, it is added to its {@linkcode MoveCondition} array.
   *
   * Similar to {@linkcode attr}, except this takes an already instantiated {@linkcode MoveAttr} object
   * as opposed to a constructor and its arguments.
   * @param attrAdd - The {@linkcode MoveAttr} to add
   * @returns `this`
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
   * @param moveTarget - The {@linkcode MoveTarget} to set
   * @returns `this`
   */
  target(moveTarget: MoveTarget): this {
    this.moveTarget = moveTarget;
    return this;
  }

  /**
   * Getter function that returns if this Move has a given MoveFlag.
   * @param flag - The {@linkcode MoveFlags} to check
   * @returns Whether this Move has the specified flag.
   */
  hasFlag(flag: MoveFlags): boolean {
    // Flags are internally represented as bitmasks, so we check by taking the bitwise AND.
    return (this.flags & flag) !== MoveFlags.NONE;
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
   * Checks if the target is immune to this Move's type.
   * Currently looks at cases of Grass types with powder moves and Dark types with moves affected by Prankster.
   * @param user - The {@linkcode Pokemon} using this move
   * @param target - The {@linkcode Pokemon} targeted by this move
   * @param type - The {@linkcode PokemonType} of the target
   * @returns Whether the move is blocked by the target's type.
   * Self-targeted moves will return `false` regardless of circumstances.
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
        if (user.hasAbility(AbilityId.PRANKSTER) && this.category === MoveCategory.STATUS && user.isOpponent(target)) {
          return true;
        }
        break;
    }
    return false;
  }

  /**
   * Checks if the move would hit its target's Substitute instead of the target itself.
   * @param user - The {@linkcode Pokemon} using this move
   * @param target - The {@linkcode Pokemon} targeted by this move
   * @returns Whether this Move will hit the target's Substitute (assuming one exists).
   */
  hitsSubstitute(user: Pokemon, target?: Pokemon): boolean {
    if ([ MoveTarget.USER, MoveTarget.USER_SIDE, MoveTarget.ENEMY_SIDE, MoveTarget.BOTH_SIDES ].includes(this.moveTarget)
        || !target?.getTag(BattlerTagType.SUBSTITUTE)) {
      return false;
    }

    const bypassed = new BooleanHolder(false);
    // TODO: Allow this to be simulated
    applyAbAttrs("InfiltratorAbAttr", {pokemon: user, bypassed});

    return !bypassed.value
        && !this.hasFlag(MoveFlags.SOUND_BASED)
        && !this.hasFlag(MoveFlags.IGNORE_SUBSTITUTE);
  }

  /**
   * Adds a condition to this move (in addition to any provided by its prior {@linkcode MoveAttr}s).
   * The move will fail upon use if at least 1 of its conditions is not met.
   * @param condition - The {@linkcode MoveCondition} or {@linkcode MoveConditionFunc} to add to the conditions array.
   * @returns `this`
   */
  condition(condition: MoveCondition | MoveConditionFunc): this {
    if (typeof condition === "function") {
      condition = new MoveCondition(condition);
    }
    this.conditions.push(condition);

    return this;
  }

  /**
   * Mark a move as having one or more edge cases.
   * The move may lack certain niche interactions with other moves/abilities,
   * but still functions as intended in most cases.
   *
   * When using this, **make sure to document the edge case** (or else this becomes pointless).
   * @returns `this`
   */
  edgeCase(): this {
    return this;
  }

  /**
   * Mark this move as partially implemented.
   * Partial moves are expected to have some core functionality implemented, but may lack
   * certain notable features or interactions with other moves or abilities.
   * @returns `this`
   */
  partial(): this {
    this.nameAppend += " (P)";
    return this;
  }

  /**
   * Mark this move as unimplemented.
   * Unimplemented moves are ones which have _none_ of their basic functionality enabled,
   * and cannot be used.
   * @returns `this`
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
   * @param setFlag - Whether the move should make contact; default `true`
   * @returns `this`
   */
  makesContact(setFlag: boolean = true): this {
    this.setFlag(MoveFlags.MAKES_CONTACT, setFlag);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.IGNORE_PROTECT} flag for the calling Move
   * @see {@linkcode MoveId.CURSE}
   * @returns The {@linkcode Move} that called this function
   */
  ignoresProtect(): this {
    this.setFlag(MoveFlags.IGNORE_PROTECT, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.SOUND_BASED} flag for the calling Move
   * @see {@linkcode MoveId.UPROAR}
   * @returns The {@linkcode Move} that called this function
   */
  soundBased(): this {
    this.setFlag(MoveFlags.SOUND_BASED, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.HIDE_USER} flag for the calling Move
   * @see {@linkcode MoveId.TELEPORT}
   * @returns The {@linkcode Move} that called this function
   */
  hidesUser(): this {
    this.setFlag(MoveFlags.HIDE_USER, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.HIDE_TARGET} flag for the calling Move
   * @see {@linkcode MoveId.WHIRLWIND}
   * @returns The {@linkcode Move} that called this function
   */
  hidesTarget(): this {
    this.setFlag(MoveFlags.HIDE_TARGET, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.BITING_MOVE} flag for the calling Move
   * @see {@linkcode MoveId.BITE}
   * @returns The {@linkcode Move} that called this function
   */
  bitingMove(): this {
    this.setFlag(MoveFlags.BITING_MOVE, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.PULSE_MOVE} flag for the calling Move
   * @see {@linkcode MoveId.WATER_PULSE}
   * @returns The {@linkcode Move} that called this function
   */
  pulseMove(): this {
    this.setFlag(MoveFlags.PULSE_MOVE, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.PUNCHING_MOVE} flag for the calling Move
   * @see {@linkcode MoveId.DRAIN_PUNCH}
   * @returns The {@linkcode Move} that called this function
   */
  punchingMove(): this {
    this.setFlag(MoveFlags.PUNCHING_MOVE, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.SLICING_MOVE} flag for the calling Move
   * @see {@linkcode MoveId.X_SCISSOR}
   * @returns The {@linkcode Move} that called this function
   */
  slicingMove(): this {
    this.setFlag(MoveFlags.SLICING_MOVE, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.RECKLESS_MOVE} flag for the calling Move
   * @see {@linkcode AbilityId.RECKLESS}
   * @returns The {@linkcode Move} that called this function
   */
  recklessMove(): this {
    this.setFlag(MoveFlags.RECKLESS_MOVE, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.BALLBOMB_MOVE} flag for the calling Move
   * @see {@linkcode MoveId.ELECTRO_BALL}
   * @returns The {@linkcode Move} that called this function
   */
  ballBombMove(): this {
    this.setFlag(MoveFlags.BALLBOMB_MOVE, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.POWDER_MOVE} flag for the calling Move
   * @see {@linkcode MoveId.STUN_SPORE}
   * @returns The {@linkcode Move} that called this function
   */
  powderMove(): this {
    this.setFlag(MoveFlags.POWDER_MOVE, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.DANCE_MOVE} flag for the calling Move
   * @see {@linkcode MoveId.PETAL_DANCE}
   * @returns The {@linkcode Move} that called this function
   */
  danceMove(): this {
    this.setFlag(MoveFlags.DANCE_MOVE, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.WIND_MOVE} flag for the calling Move
   * @see {@linkcode MoveId.HURRICANE}
   * @returns The {@linkcode Move} that called this function
   */
  windMove(): this {
    this.setFlag(MoveFlags.WIND_MOVE, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.TRIAGE_MOVE} flag for the calling Move
   * @see {@linkcode MoveId.ABSORB}
   * @returns The {@linkcode Move} that called this function
   */
  triageMove(): this {
    this.setFlag(MoveFlags.TRIAGE_MOVE, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.IGNORE_ABILITIES} flag for the calling Move
   * @see {@linkcode MoveId.SUNSTEEL_STRIKE}
   * @returns The {@linkcode Move} that called this function
   */
  ignoresAbilities(): this {
    this.setFlag(MoveFlags.IGNORE_ABILITIES, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.CHECK_ALL_HITS} flag for the calling Move
   * @see {@linkcode MoveId.TRIPLE_AXEL}
   * @returns The {@linkcode Move} that called this function
   */
  checkAllHits(): this {
    this.setFlag(MoveFlags.CHECK_ALL_HITS, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.IGNORE_SUBSTITUTE} flag for the calling Move
   * @see {@linkcode MoveId.WHIRLWIND}
   * @returns The {@linkcode Move} that called this function
   */
  ignoresSubstitute(): this {
    this.setFlag(MoveFlags.IGNORE_SUBSTITUTE, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.REDIRECT_COUNTER} flag for the calling Move
   * @see {@linkcode MoveId.METAL_BURST}
   * @returns The {@linkcode Move} that called this function
   */
  redirectCounter(): this {
    this.setFlag(MoveFlags.REDIRECT_COUNTER, true);
    return this;
  }

  /**
   * Sets the {@linkcode MoveFlags.REFLECTABLE} flag for the calling Move
   * @see {@linkcode MoveId.ATTRACT}
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
   * will return `false` if the user has a {@linkcode AbilityId.LONG_REACH} that is not being suppressed.
   *
   * **Note:** This method only checks if the move should have effectively have the flag applied to its use.
   * It does *not* check whether the flag will trigger related effects.
   * For example using this method to check {@linkcode MoveFlags.WIND_MOVE}
   * will not consider {@linkcode AbilityId.WIND_RIDER | Wind Rider }.
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
        if (user.hasAbilityWithAttr("IgnoreContactAbAttr") || this.hitsSubstitute(user, target)) {
          return false;
        }
        break;
      case MoveFlags.IGNORE_ABILITIES:
        if (user.hasAbilityWithAttr("MoveAbilityBypassAbAttr")) {
          const abilityEffectsIgnored = new BooleanHolder(false);
          applyAbAttrs("MoveAbilityBypassAbAttr", {pokemon: user, cancelled: abilityEffectsIgnored, move: this});
          if (abilityEffectsIgnored.value) {
            return true;
          }
          // Sunsteel strike, Moongeist beam, and photon geyser will not ignore abilities if invoked
          // by another move, such as via metronome.
        }
        return this.hasFlag(MoveFlags.IGNORE_ABILITIES) && !isFollowUp;
      case MoveFlags.IGNORE_PROTECT:
        if (user.hasAbilityWithAttr("IgnoreProtectOnContactAbAttr")
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
              target?.hasAbilityWithAttr("ReflectStatusMoveAbAttr")))
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
    return this.conditions.every(cond => cond.apply(user, target, move));
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

    applyMoveAttrs("VariableAccuracyAttr", user, target, this, moveAccuracy);
    applyAbAttrs("WonderSkinAbAttr", {pokemon: target, opponent: user, move: this, simulated, accuracy: moveAccuracy});

    if (moveAccuracy.value === -1) {
      return moveAccuracy.value;
    }

    const isOhko = this.hasAttr("OneHitKOAccuracyAttr");

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

    applyMoveAttrs("VariablePowerAttr", source, target, this, power);

    const typeChangeMovePowerMultiplier = new NumberHolder(1);
    const typeChangeHolder = new NumberHolder(this.type);

    applyAbAttrs("MoveTypeChangeAbAttr", {pokemon: source, opponent: target, move: this, simulated: true, moveType: typeChangeHolder, power: typeChangeMovePowerMultiplier});

    const abAttrParams: PreAttackModifyPowerAbAttrParams = {
      pokemon: source,
      opponent: target,
      simulated,
      power,
      move: this,
    }

    applyAbAttrs("VariableMovePowerAbAttr", abAttrParams);
    const ally = source.getAlly();
    if (!isNullOrUndefined(ally)) {
      applyAbAttrs("AllyMoveCategoryPowerBoostAbAttr", {...abAttrParams, pokemon: ally});
    }

    // Non-priority, single-hit moves of the user's Tera Type are always a bare minimum of 60 power

    const sourceTeraType = source.getTeraType();
    if (source.isTerastallized && sourceTeraType === this.type && power.value < 60 && this.priority <= 0 && !this.hasAttr("MultiHitAttr") && !globalScene.findModifier(m => m instanceof PokemonMultiHitModifier && m.pokemonId === source.id)) {
      power.value = 60;
    }

    const fieldAuras = new Set(
      globalScene.getField(true)
        .map((p) => p.getAbilityAttrs("FieldMoveTypePowerBoostAbAttr").filter(attr => {
          const condition = attr.getCondition();
          return (!condition || condition(p));
        }))
        .flat(),
    );
    for (const aura of fieldAuras) {
      // TODO: Refactor the fieldAura attribute so that its apply method is not directly called
      aura.apply({pokemon: source, simulated, opponent: target, move: this, power});
    }

    const alliedField: Pokemon[] = source.isPlayer() ? globalScene.getPlayerField() : globalScene.getEnemyField();
    alliedField.forEach(p => applyAbAttrs("UserFieldMoveTypePowerBoostAbAttr", {pokemon: p, opponent: target, move: this, simulated, power}));

    power.value *= typeChangeMovePowerMultiplier.value;

    const typeBoost = source.findTag(t => t instanceof TypeBoostTag && t.boostedType === typeChangeHolder.value) as TypeBoostTag;
    if (typeBoost) {
      power.value *= typeBoost.boostValue;
    }


    if (!this.hasAttr("TypelessAttr")) {
      globalScene.arena.applyTags(WeakenMoveTypeTag, simulated, typeChangeHolder.value, power);
      globalScene.applyModifiers(AttackTypeBoosterModifier, source.isPlayer(), source, typeChangeHolder.value, power);
    }

    if (source.getTag(HelpingHandTag)) {
      power.value *= 1.5;
    }

    return power.value;
  }

  getPriority(user: Pokemon, simulated: boolean = true) {
    const priority = new NumberHolder(this.priority);

    applyMoveAttrs("IncrementMovePriorityAttr", user, null, this, priority);
    applyAbAttrs("ChangeMovePriorityAbAttr", {pokemon: user, simulated, move: this, priority});

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
    if (this.id === MoveId.TRIPLE_AXEL) {
      effectivePower = 94.14;
    } else if (this.id === MoveId.TRIPLE_KICK) {
      effectivePower = 47.07;
    } else {
      const multiHitAttr = this.getAttrs("MultiHitAttr")[0];
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
    if (this.hasAttr("DelayedAttackAttr")) {
      numTurns += 2;
    }
    if (this.hasAttr("RechargeAttr")) {
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
    const exceptAttrs: MoveAttrString[] = [
      "MultiHitAttr",
      "SacrificialAttr",
      "SacrificialAttrOnHit"
    ];

    // ...and cannot enhance these specific moves
    const exceptMoves: MoveId[] = [
      MoveId.FLING,
      MoveId.UPROAR,
      MoveId.ROLLOUT,
      MoveId.ICE_BALL,
      MoveId.ENDEAVOR
    ];

    // ...and cannot enhance Pollen Puff when targeting an ally.
    const ally = user.getAlly();
    const exceptPollenPuffAlly: boolean = this.id === MoveId.POLLEN_PUFF && !isNullOrUndefined(ally) && targets.includes(ally.getBattlerIndex())

    return (!restrictSpread || !isMultiTarget)
      && !this.isChargingMove()
      && !exceptAttrs.some(attr => this.hasAttr(attr))
      && !exceptMoves.some(id => this.id === id)
      && !exceptPollenPuffAlly
      && this.category !== MoveCategory.STATUS;
  }
}

export class AttackMove extends Move {
  /** This field does not exist at runtime and must not be used.
   * Its sole purpose is to ensure that typescript is able to properly narrow when the `is` method is called.
   */
  declare private _: never;
  override is<K extends keyof MoveClassMap>(moveKind: K): this is MoveClassMap[K] {
    return moveKind === "AttackMove";
  }
  constructor(id: MoveId, type: PokemonType, category: MoveCategory, power: number, accuracy: number, pp: number, chance: number, priority: number, generation: number) {
    super(id, type, category, MoveTarget.NEAR_OTHER, power, accuracy, pp, chance, priority, generation);

    // > All damaging Fire-type moves can... thaw a frozen target, regardless of whether or not they have a chance to burn.
    // - https://bulbapedia.bulbagarden.net/wiki/Freeze_(status_condition)
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

    const effectiveness = target.getAttackTypeEffectiveness(this.type, {source: user, move: this});
    attackScore = Math.pow(effectiveness - 1, 2) * (effectiveness < 1 ? -2 : 2);
    const [ thisStat, offStat ]: EffectiveStat[] = this.category === MoveCategory.PHYSICAL ? [ Stat.ATK, Stat.SPATK ] : [ Stat.SPATK, Stat.ATK ];
    const statHolder = new NumberHolder(user.getEffectiveStat(thisStat, target));
    const offStatValue = user.getEffectiveStat(offStat, target);
    applyMoveAttrs("VariableAtkAttr", user, target, move, statHolder);
    const statRatio = offStatValue / statHolder.value;
    if (statRatio <= 0.75) {
      attackScore *= 2;
    } else if (statRatio <= 0.875) {
      attackScore *= 1.5;
    }

    const power = new NumberHolder(this.calculateEffectivePower());
    applyMoveAttrs("VariablePowerAttr", user, target, move, power);

    attackScore += Math.floor(power.value / 5);

    return ret - attackScore;
  }
}

export class StatusMove extends Move {
  /** This field does not exist at runtime and must not be used.
   * Its sole purpose is to ensure that typescript is able to properly narrow when the `is` method is called.
   */
  declare private _: never;
  constructor(id: MoveId, type: PokemonType, accuracy: number, pp: number, chance: number, priority: number, generation: number) {
    super(id, type, MoveCategory.STATUS, MoveTarget.NEAR_OTHER, -1, accuracy, pp, chance, priority, generation);
  }

  override is<K extends MoveKindString>(moveKind: K): this is MoveClassMap[K] {
    return moveKind === "StatusMove";
  }
}

export class SelfStatusMove extends Move {
  /** This field does not exist at runtime and must not be used.
   * Its sole purpose is to ensure that typescript is able to properly narrow when the `is` method is called.
   */
  declare private _: never;
  constructor(id: MoveId, type: PokemonType, accuracy: number, pp: number, chance: number, priority: number, generation: number) {
    super(id, type, MoveCategory.STATUS, MoveTarget.USER, -1, accuracy, pp, chance, priority, generation);
  }

  override is<K extends MoveKindString>(moveKind: K): this is MoveClassMap[K] {
    return moveKind === "SelfStatusMove";
  }
}

// TODO: Figure out how to improve the signature of this so that
// the `ChargeMove` function knows that the argument `Base` is a specific subclass of move that cannot
// be abstract.
// Right now, I only know how to do this by using the type conjunction (the & operators)
type SubMove = new (...args: any[]) => Move & {
  is<K extends keyof MoveClassMap>(moveKind: K): this is MoveClassMap[K];
};

function ChargeMove<TBase extends SubMove>(Base: TBase, nameAppend: string) {
  return class extends Base {
    /** The animation to play during the move's charging phase */
    public readonly chargeAnim: ChargeAnim = ChargeAnim[`${MoveId[this.id]}_CHARGING`];
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
      globalScene.phaseManager.queueMessage(this._chargeText
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
    getChargeAttrs<T extends MoveAttrString>(attrType: T): (MoveAttrMap[T])[] {
      const targetAttr = MoveAttrs[attrType];
      if (!targetAttr) {
        return [];
      }
      return this.chargeAttrs.filter((attr): attr is MoveAttrMap[T] => attr instanceof targetAttr);
    }

    /**
     * Checks if this move has an attribute of the given type.
     * @param attrType any attribute that extends {@linkcode MoveAttr}
     * @returns `true` if a matching attribute is found; `false` otherwise
     */
    hasChargeAttr<T extends MoveAttrString>(attrType: T): boolean {
      const targetAttr = MoveAttrs[attrType];
      if (!targetAttr) {
        return false;
      }
      return this.chargeAttrs.some((attr) => attr instanceof targetAttr);
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

export class ChargingAttackMove extends ChargeMove(AttackMove, "ChargingAttackMove") {}
export class ChargingSelfStatusMove extends ChargeMove(SelfStatusMove, "ChargingSelfStatusMove") {}

/**
 * Base class defining all {@linkcode Move} Attributes
 * @abstract
 * @see {@linkcode apply}
 */
export abstract class MoveAttr {
  /** Should this {@linkcode Move} target the user? */
  public selfTarget: boolean;

  /**
   * Return whether this attribute is of the given type.
   *
   * @remarks
   * Used to avoid requring the caller to have imported the specific attribute type, avoiding circular dependencies.
   * @param attr - The attribute to check against
   * @returns Whether the attribute is an instance of the given type.
   */
  public is<T extends MoveAttrString>(attr: T): this is MoveAttrMap[T] {
    const targetAttr = MoveAttrs[attr];
    if (!targetAttr) {
      return false;
    }
    return this instanceof targetAttr;
  }

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

/**
 * Base class defining all Move Effect Attributes
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
   * @defaultValue {@linkcode MoveEffectTrigger.POST_APPLY}
   */
  public get trigger () {
    return this.options?.trigger ?? MoveEffectTrigger.POST_APPLY;
  }

  /**
   * `true` if this effect should only trigger on the first hit of
   * multi-hit moves.
   * @defaultValue `false`
   */
  public get firstHitOnly () {
    return this.options?.firstHitOnly ?? false;
  }

  /**
   * `true` if this effect should only trigger on the last hit of
   * multi-hit moves.
   * @defaultValue `false`
   */
  public get lastHitOnly () {
    return this.options?.lastHitOnly ?? false;
  }

  /**
   * `true` if this effect should apply only upon hitting a target
   * for the first time when targeting multiple {@linkcode Pokemon}.
   * @defaultValue `false`
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

    applyAbAttrs("MoveEffectChanceMultiplierAbAttr", {pokemon: user, simulated: !showAbility, chance: moveChance, move});

    if ((!move.hasAttr("FlinchAttr") || moveChance.value <= move.chance) && !move.hasAttr("SecretPowerAttr")) {
      const userSide = user.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY;
      globalScene.arena.applyTagsForSide(ArenaTagType.WATER_FIRE_PLEDGE, userSide, false, moveChance);
    }

    if (!selfEffect) {
      applyAbAttrs("IgnoreMoveEffectsAbAttr", {pokemon: target, move, simulated: !showAbility, chance: moveChance});
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
 */
export class MessageHeaderAttr extends MoveHeaderAttr {
  /** The message to display, or a function producing one. */
  private message: string | MoveMessageFunc;

  constructor(message: string | MoveMessageFunc) {
    super();
    this.message = message;
  }

  apply(user: Pokemon, target: Pokemon, move: Move): boolean {
    const message = typeof this.message === "string"
      ? this.message
      : this.message(user, target, move);

    if (message) {
      globalScene.phaseManager.queueMessage(message);
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

/**
 * Attribute to display a message before a move is executed.
 */
export class PreMoveMessageAttr extends MoveAttr {
  /** The message to display or a function returning one */
  private message: string | MoveMessageFunc;

  /**
   * Create a new {@linkcode PreMoveMessageAttr} to display a message before move execution.
   * @param message - The message to display before move use, either` a literal string or a function producing one.
   * @remarks
   * If {@linkcode message} evaluates to an empty string (`""`), no message will be displayed
   * (though the move will still succeed).
   */
  constructor(message: string | MoveMessageFunc) {
    super();
    this.message = message;
  }

  apply(user: Pokemon, target: Pokemon, move: Move): boolean {
    const message = typeof this.message === "function"
      ? this.message(user, target, move)
      : this.message;

    // TODO: Consider changing if/when MoveAttr `apply` return values become significant
    if (message) {
      globalScene.phaseManager.queueMessage(message, 500);
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
  protected message: string | MoveMessageFunc;
  protected conditionFunc: MoveConditionFunc;

  /**
   * Create a new MoveInterruptedMessageAttr.
   * @param message The message to display when the move is interrupted, or a function that formats the message based on the user, target, and move.
   */
  constructor(message: string | MoveMessageFunc, conditionFunc: MoveConditionFunc) {
    super();
    this.message = message;
    this.conditionFunc = conditionFunc;
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
      return typeof this.message === "string"
          ? this.message
          : this.message(user, target, move);
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
    return toDmgValue(user.level * (user.randBattleSeedIntRange(50, 150) * 0.01));
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

/**
 * Move attribute to display arbitrary text during a move's execution.
 */
export class MessageAttr extends MoveEffectAttr {
  /** The message to display, either as a string or a function returning one. */
  private message: string | MoveMessageFunc;

  constructor(message: string | MoveMessageFunc, options?: MoveEffectAttrOptions) {
    // TODO: Do we need to respect `selfTarget` if we're just displaying text?
    super(false, options)
    this.message = message;
  }

  override apply(user: Pokemon, target: Pokemon, move: Move): boolean {
    const message = typeof this.message === "function"
      ? this.message(user, target, move)
      : this.message;

    // TODO: Consider changing if/when MoveAttr `apply` return values become significant
    if (message) {
      globalScene.phaseManager.queueMessage(message, 500);
      return true;
    }
    return false;
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
      const abAttrParams: AbAttrParamsWithCancel = {pokemon: user, cancelled};
      applyAbAttrs("BlockRecoilDamageAttr", abAttrParams);
      applyAbAttrs("BlockNonDirectDamageAbAttr", abAttrParams);
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
    globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:hitWithRecoil", { pokemonName: getPokemonNameWithAffix(user) }));
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
    return Math.ceil(((1 - user.getHpRatio()) * 10 - 10) * (target.getAttackTypeEffectiveness(move.type, {source: user}) - 0.5));
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
    return Math.ceil(((1 - user.getHpRatio()) * 10 - 10) * (target.getAttackTypeEffectiveness(move.type, {source: user}) - 0.5));
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
    applyAbAttrs("BlockNonDirectDamageAbAttr", {pokemon: user, cancelled});
    if (!cancelled.value) {
      user.damageAndUpdate(toDmgValue(user.getMaxHp() / 2), { result: HitResult.INDIRECT, ignoreSegments: true });
      globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:cutHpPowerUpMove", { pokemonName: getPokemonNameWithAffix(user) })); // Queue recoil message
    }
    return true;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    if (user.isBoss()) {
      return -10;
    }
    return Math.ceil(((1 - user.getHpRatio() / 2) * 10 - 10) * (target.getAttackTypeEffectiveness(move.type, {source: user}) - 0.5));
  }
}

/**
 * Attribute to put in a {@link https://bulbapedia.bulbagarden.net/wiki/Substitute_(doll) | Substitute Doll} for the user.
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
   * @param user - The {@linkcode Pokemon} that used the move.
   * @param target - n/a
   * @param move - The {@linkcode Move} with this attribute.
   * @param args - n/a
   * @returns `true` if the attribute successfully applies, `false` otherwise
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
    return (user, _target, _move) => !user.getTag(SubstituteTag) && user.hp > (this.roundUp ? Math.ceil(user.getMaxHp() * this.hpCost) : Math.floor(user.getMaxHp() * this.hpCost)) && user.getMaxHp() > 1;
  }

  /**
   * Get the substitute-specific failure message if one should be displayed.
   * @param user - The pokemon using the move.
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
  /** The percentage of {@linkcode Stat.HP} to h