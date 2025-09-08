import { AbAttrParamsWithCancel, PreAttackModifyPowerAbAttrParams } from "#abilities/ability";
import {
  applyAbAttrs
} from "#abilities/apply-ab-attrs";
import { loggedInUser } from "#app/account";
import type { GameMode } from "#app/game-mode";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import type { EntryHazardTag } from "#data/arena-tag";
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
import type { EnemyPokemon, Pokemon } from "#field/pokemon";
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
import { BooleanHolder, coerceArray, type Constructor, isNullOrUndefined, NumberHolder, randSeedFloat, randSeedInt, randSeedItem, toDmgValue } from "#utils/common";
import { getEnumValues } from "#utils/enums";
import { toCamelCase, toTitleCase } from "#utils/strings";
import i18next from "i18next";
import { applyChallenges } from "#utils/challenge-utils";
import type { AbstractConstructor } from "#types/type-helpers";

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

    const effectiveness = target.getAttackTypeEffectiveness(this.type, user, undefined, undefined, this);
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

type SubMove = AbstractConstructor<Move>

function ChargeMove<TBase extends SubMove>(Base: TBase, nameAppend: string) {
  // NB: This cannot be made into a oneline return
  abstract class Charging extends Base {
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
  return Charging;
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
   * Return this `MoveAttr`'s associated {@linkcode MoveCondition} or {@linkcode MoveConditionFunc}.
   * The specified condition will be added to all {@linkcode Move}s with this attribute,
   * and moves **will fail upon use** if _at least 1_ of their attached conditions returns `false`.
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
   * Determine whether this {@linkcode MoveAttr}'s effects are able to {@linkcode apply | be applied} to the target.
   *
   * Will **NOT** cause the move to fail upon returning `false` (unlike {@linkcode getCondition};
   * merely that the effect for this attribute will be nullified.
   * @param user - The {@linkcode Pokemon} using the move
   * @param target - The {@linkcode Pokemon} being targeted by the move, or {@linkcode user} if the move is
   * {@linkcode selfTarget | self-targeting}
   * @param move - The {@linkcode Move} being used
   * @param _args - Set of unique arguments needed by this attribute
   * @returns `true` if basic application of this `MoveAttr`s effects should be possible
   */
  // TODO: Decouple this check from the `apply` step
  // TODO: Make non-damaging moves fail by default if none of their attributes can apply
  canApply(user: Pokemon, target: Pokemon, move: Move, _args?: any[]) {
    // TODO: These checks seem redundant
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
    return Math.ceil(((1 - user.getHpRatio() / 2) * 10 - 10) * (target.getAttackTypeEffectiveness(move.type, user) - 0.5));
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
  constructor(
    /** The percentage of {@linkcode Stat.HP} to heal. */
    private healRatio: number,
    /** Whether to display a healing animation when healing the target; default `false` */
    private showAnim = false,
    selfTarget = true
  ) {
    super(selfTarget);
  }

  override apply(user: Pokemon, target: Pokemon, _move: Move, _args: any[]): boolean {
    this.addHealPhase(this.selfTarget ? user : target, this.healRatio);
    return true;
  }

  /**
   * Creates a new {@linkcode PokemonHealPhase}.
   * This heals the target and shows the appropriate message.
   */
  protected addHealPhase(target: Pokemon, healRatio: number) {
    globalScene.phaseManager.unshiftNew("PokemonHealPhase", target.getBattlerIndex(),
      toDmgValue(target.getMaxHp() * healRatio), i18next.t("moveTriggers:healHp", { pokemonName: getPokemonNameWithAffix(target) }), true, !this.showAnim);
  }

  override getTargetBenefitScore(user: Pokemon, target: Pokemon, _move: Move): number {
    const score = ((1 - (this.selfTarget ? user : target).getHpRatio()) * 20) - this.healRatio * 10;
    return Math.round(score / (1 - this.healRatio / 2));
  }

  // TODO: Change to fail move
  override canApply(user: Pokemon, target: Pokemon, _move: Move, _args?: any[]): boolean {
    if (!super.canApply(user, target, _move, _args)) {
      return false;
    }

    const healedPokemon = this.selfTarget ? user : target;
    if (healedPokemon.isFullHp()) {
      // Ensure the fail message isn't displayed when checking the move conditions outside of the move execution
      // TOOD: Fix this in PR#6276
      if (globalScene.phaseManager.getCurrentPhase()?.is("MovePhase")) {
        globalScene.phaseManager.queueMessage(i18next.t("battle:hpIsFull", {
          pokemonName: getPokemonNameWithAffix(healedPokemon),
        }))
      }
      return false;
    }
    return true;
  }
}

/**
 * Attribute to put the user to sleep for a fixed duration, fully heal them and cure their status.
 * Used for {@linkcode MoveId.REST}.
 */
export class RestAttr extends HealAttr {
  private duration: number;

  constructor(duration: number) {
    super(1, true);
    this.duration = duration;
  }

  override apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
   const wasSet = user.trySetStatus(StatusEffect.SLEEP, user, this.duration, null, true, true,
    i18next.t("moveTriggers:restBecameHealthy", {
      pokemonName: getPokemonNameWithAffix(user),
    }));
    return wasSet && super.apply(user, target, move, args);
  }

  override addHealPhase(user: Pokemon): void {
    globalScene.phaseManager.unshiftNew("PokemonHealPhase", user.getBattlerIndex(), user.getMaxHp(), null)
  }

  // TODO: change after HealAttr is changed to fail move
  override getCondition(): MoveConditionFunc {
    return (user, target, move) =>
      super.canApply(user, target, move, [])
      // Intentionally suppress messages here as we display generic fail msg
      // TODO: This might have order-of-operation jank
      && user.canSetStatus(StatusEffect.SLEEP, true, true, user)
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
  private abilityCondition: AbilityId;

  constructor(message: string | null, abilityCondition: AbilityId) {
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
      globalScene.phaseManager.queueMessage(this.message);
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
      globalScene.phaseManager.queueAbilityDisplay(pokemon, pokemon.getPassiveAbility()?.id === this.abilityCondition, true);
      globalScene.phaseManager.queueAbilityDisplay(pokemon, pokemon.getPassiveAbility()?.id === this.abilityCondition, false);
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
      applyAbAttrs("BlockNonDirectDamageAbAttr", {pokemon: targetAlly, cancelled});
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

    const pm = globalScene.phaseManager;

    pm.pushPhase(
      pm.create("PokemonHealPhase",
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
      case WeatherType.FOG:
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
  override canApply(user: Pokemon, target: Pokemon, _move: Move, _args?: any[]): boolean {
    // Don't trigger if not targeting an ally
    return target === user.getAlly() && super.canApply(user, target, _move, _args);
  }

  override apply(user: Pokemon, target: Pokemon, _move: Move, _args: any[]): boolean {
    if (user.isOpponent(target)) {
      return false;
    }
    return super.apply(user, target, _move, _args);
  }
}

/**
 * Heals user as a side effect of a move that hits a target.
 * Healing is based on {@linkcode healRatio} * the amount of damage dealt or a stat of the target.
 * @extends MoveEffectAttr
 * @see {@linkcode apply}
 * @see {@linkcode getUserBenefitScore}
 */
// TODO: Make Strength Sap its own attribute that extends off of this one
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
    const reverseDrain = target.hasAbilityWithAttr("ReverseDrainAbAttr", false);
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
      if (user.hasAbilityWithAttr("BlockNonDirectDamageAbAttr")) {
        healAmount = 0;
        message = "";
      } else {
        user.turnData.damageTaken += healAmount;
        healAmount = healAmount * -1;
        message = "";
      }
    }
    globalScene.phaseManager.unshiftNew("PokemonHealPhase", user.getBattlerIndex(), healAmount, message, false, true);
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
    applyMoveAttrs("ChangeMultiHitTypeAttr", user, target, move, hitType);
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
        const rand = user.randBattleSeedInt(20);
        const hitValue = new NumberHolder(rand);
        applyAbAttrs("MaxMultiHitAbAttr", {pokemon: user, hits: hitValue});
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
   * @param partySize - The size of the user's party, used for {@linkcode MoveId.BEAT_UP | Beat Up} (default: `1`)
   * @param maxMultiHit - Whether the move should always hit the maximum number of times, e.g. due to {@linkcode AbilityId.SKILL_LINK | Skill Link} (default: `false`)
   * @param ignoreAcc - `true` if the move should ignore accuracy checks, e.g. due to  {@linkcode AbilityId.NO_GUARD | No Guard} (default: `false`)
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
    if (user.species.speciesId === SpeciesId.GRENINJA && user.hasAbility(AbilityId.BATTLE_BOND) && user.formIndex === 2) {
      (args[0] as NumberHolder).value = MultiHitType._3;
      return true;
    }
    return false;
  }
}

export class StatusEffectAttr extends MoveEffectAttr {
  public effect: StatusEffect;

  constructor(effect: StatusEffect, selfTarget = false) {
    super(selfTarget);

    this.effect = effect;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const moveChance = this.getMoveChance(user, target, move, this.selfTarget, true);
    const statusCheck = moveChance < 0 || moveChance === 100 || user.randBattleSeedInt(100) < moveChance;
    if (!statusCheck) {
      return false;
    }

    // non-status moves don't play sound effects for failures
    const quiet = move.category !== MoveCategory.STATUS;

    if (
      target.trySetStatus(this.effect, user, undefined, null, false, quiet)
    ) {
      applyAbAttrs("ConfusionOnStatusEffectAbAttr", {pokemon: user, opponent: target, move, effect: this.effect});
      return true;
    }
    return false;
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    const moveChance = this.getMoveChance(user, target, move, this.selfTarget, false);
    const score = moveChance < 0 ? -10 : Math.floor(moveChance * -0.1);
    const pokemon = this.selfTarget ? user : target;

    return pokemon.canSetStatus(this.effect, true, false, user) ? score : 0;
  }
}

/**
 * Attribute to randomly apply one of several statuses to the target.
 * Used for {@linkcode Moves.TRI_ATTACK} and {@linkcode Moves.DIRE_CLAW}.
 */
export class MultiStatusEffectAttr extends StatusEffectAttr {
  public effects: StatusEffect[];

  constructor(effects: StatusEffect[], selfTarget?: boolean) {
    super(effects[0], selfTarget);
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
   * Applies the effect of {@linkcode MoveId.PSYCHO_SHIFT} to its target.
   * Psycho Shift takes the user's status effect and passes it onto the target.
   * The user is then healed after the move has been successfully executed.
   * @param user - The {@linkcode Pokemon} using the move
   * @param target - The {@linkcode Pokemon} targeted by the move.
   * @returns - Whether the effect was successfully applied to the target.
   */
  apply(user: Pokemon, target: Pokemon, _move: Move, _args: any[]): boolean {
    const statusToApply = user.status?.effect ??
      (user.hasAbility(AbilityId.COMATOSE) ? StatusEffect.SLEEP : StatusEffect.NONE);

    // Bang is justified as condition func returns early if no status is found
    if (!target.trySetStatus(statusToApply, user)) {
      return false;
    }

    if (user.status) {
      // Add tag to user to heal its status effect after the move ends (unless we have comatose);
      // occurs after move use to ensure correct Synchronize timing
      user.addTag(BattlerTagType.PSYCHO_SHIFT)
    }

    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target) => {
      if (target.status?.effect) {
        return false;
      }

      const statusToApply = user.status?.effect ?? (user.hasAbility(AbilityId.COMATOSE) ? StatusEffect.SLEEP : StatusEffect.NONE);
      return !!statusToApply && target.canSetStatus(statusToApply, false, false, user);
    }
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    const statusToApply =
      user.status?.effect ??
      (user.hasAbility(AbilityId.COMATOSE) ? StatusEffect.SLEEP : StatusEffect.NONE);

      // TODO: Give this a positive user benefit score
    return !target.status?.effect && statusToApply && target.canSetStatus(statusToApply, true, false, user) ? -10 : 0;
  }
}

/**
 * Attribute to steal items upon this move's use.
 * Used for {@linkcode MoveId.THIEF} and {@linkcode MoveId.COVET}.
 */
export class StealHeldItemChanceAttr extends MoveEffectAttr {
  private chance: number;

  constructor(chance: number) {
    super(false);
    this.chance = chance;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const rand = randSeedFloat();
    if (rand > this.chance) {
      return false;
    }

    const heldItems = this.getTargetHeldItems(target).filter((i) => i.isTransferable);
    if (!heldItems.length) {
      return false;
    }

    const poolType = target.isPlayer() ? ModifierPoolType.PLAYER : target.hasTrainer() ? ModifierPoolType.TRAINER : ModifierPoolType.WILD;
    const highestItemTier = heldItems.map((m) => m.type.getOrInferTier(poolType)).reduce((highestTier, tier) => Math.max(tier!, highestTier), 0); // TODO: is the bang after tier correct?
    const tierHeldItems = heldItems.filter((m) => m.type.getOrInferTier(poolType) === highestItemTier);
    const stolenItem = tierHeldItems[user.randBattleSeedInt(tierHeldItems.length)];
    if (!globalScene.tryTransferHeldItemModifier(stolenItem, user, false)) {
      return false;
    }

    globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:stoleItem", { pokemonName: getPokemonNameWithAffix(user), targetName: getPokemonNameWithAffix(target), itemName: stolenItem.type.name }));
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
 * Removes a random held item (or berry) from target.
 * Used for Incinerate and Knock Off.
 * Not Implemented Cases: (Same applies for Thief)
 * "If the user faints due to the target's Ability (Rough Skin or Iron Barbs) or held Rocky Helmet, it cannot remove the target's held item."
 * "If the Pokémon is knocked out by the attack, Sticky Hold does not protect the held item."
 */
export class RemoveHeldItemAttr extends MoveEffectAttr {

  /** Optional restriction for item pool to berries only; i.e. Incinerate */
  private berriesOnly: boolean;

  constructor(berriesOnly: boolean = false) {
    super(false);
    this.berriesOnly = berriesOnly;
  }

  /**
   * Attempt to permanently remove a held
   * @param user - The {@linkcode Pokemon} that used the move
   * @param target - The {@linkcode Pokemon} targeted by the move
   * @param move - N/A
   * @param args N/A
   * @returns `true` if an item was able to be removed
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!this.berriesOnly && target.isPlayer()) { // "Wild Pokemon cannot knock off Player Pokemon's held items" (See Bulbapedia)
      return false;
    }

    // Check for abilities that block item theft
    // TODO: This should not trigger if the target would faint beforehand
    const cancelled = new BooleanHolder(false);
    applyAbAttrs("BlockItemTheftAbAttr", {pokemon: target, cancelled});

    if (cancelled.value) {
      return false;
    }

    // Considers entire transferrable item pool by default (Knock Off).
    // Otherwise only consider berries (Incinerate).
    let heldItems = this.getTargetHeldItems(target).filter(i => i.isTransferable);

    if (this.berriesOnly) {
      heldItems = heldItems.filter(m => m instanceof BerryModifier && m.pokemonId === target.id, target.isPlayer());
    }

    if (!heldItems.length) {
      return false;
    }

    const removedItem = heldItems[user.randBattleSeedInt(heldItems.length)];

    // Decrease item amount and update icon
    target.loseHeldItem(removedItem);
    globalScene.updateModifiers(target.isPlayer());

    if (this.berriesOnly) {
      globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:incineratedItem", { pokemonName: getPokemonNameWithAffix(user), targetName: getPokemonNameWithAffix(target), itemName: removedItem.type.name }));
    } else {
      globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:knockedOffItem", { pokemonName: getPokemonNameWithAffix(user), targetName: getPokemonNameWithAffix(target), itemName: removedItem.type.name }));
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
  protected chosenBerry: BerryModifier;
  constructor(selfTarget: boolean) {
    super(selfTarget);
  }

  /**
   * Causes the target to eat a berry.
   * @param user The {@linkcode Pokemon} Pokemon that used the move
   * @param target The {@linkcode Pokemon} Pokemon that will eat the berry
   * @param move The {@linkcode Move} being used
   * @param args Unused
   * @returns `true` if the function succeeds
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

    // pick a random berry to gobble and check if we preserve it
    this.chosenBerry = heldBerries[user.randBattleSeedInt(heldBerries.length)];
    const preserve = new BooleanHolder(false);
    // check for berry pouch preservation
    globalScene.applyModifiers(PreserveBerryModifier, pokemon.isPlayer(), pokemon, preserve);
    if (!preserve.value) {
      this.reduceBerryModifier(pokemon);
    }

    // Don't update harvest for berries preserved via Berry pouch (no item dupes lol)
    this.eatBerry(target, undefined, !preserve.value);

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


  /**
   * Internal function to apply berry effects.
   *
   * @param consumer - The {@linkcode Pokemon} eating the berry; assumed to also be owner if `berryOwner` is omitted
   * @param berryOwner - The {@linkcode Pokemon} whose berry is being eaten; defaults to `consumer` if not specified.
   * @param updateHarvest - Whether to prevent harvest from tracking berries;
   * defaults to whether `consumer` equals `berryOwner` (i.e. consuming own berry).
   */
   protected eatBerry(consumer: Pokemon, berryOwner: Pokemon = consumer, updateHarvest = consumer === berryOwner) {
     // consumer eats berry, owner triggers unburden and similar effects
    getBerryEffectFunc(this.chosenBerry.berryType)(consumer);
    applyAbAttrs("PostItemLostAbAttr", {pokemon: berryOwner});
    applyAbAttrs("HealFromBerryUseAbAttr", {pokemon: consumer});
    consumer.recordEatenBerry(this.chosenBerry.berryType, updateHarvest);
  }
}

/**
 * Attribute used for moves that steal and eat a random berry from the target.
 * Used for {@linkcode MoveId.PLUCK} & {@linkcode MoveId.BUG_BITE}.
 */
export class StealEatBerryAttr extends EatBerryAttr {
  constructor() {
    super(false);
  }

  /**
   * User steals a random berry from the target and then eats it.
   * @param user - The {@linkcode Pokemon} using the move; will eat the stolen berry
   * @param target - The {@linkcode Pokemon} having its berry stolen
   * @param move - The {@linkcode Move} being used
   * @param args N/A
   * @returns `true` if the function succeeds
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    // check for abilities that block item theft
    const cancelled = new BooleanHolder(false);
    applyAbAttrs("BlockItemTheftAbAttr", {pokemon: target, cancelled});
    if (cancelled.value === true) {
      return false;
    }

    // check if the target even _has_ a berry in the first place
    // TODO: Check on cart if Pluck displays messages when used against sticky hold mons w/o berries
    const heldBerries = this.getTargetHeldBerries(target);
    if (heldBerries.length <= 0) {
      return false;
    }

    // pick a random berry and eat it
    this.chosenBerry = heldBerries[user.randBattleSeedInt(heldBerries.length)];
    applyAbAttrs("PostItemLostAbAttr", {pokemon: target});
    const message = i18next.t("battle:stealEatBerry", { pokemonName: user.name, targetName: target.name, berryName: this.chosenBerry.type.name });
    globalScene.phaseManager.queueMessage(message);
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
    this.effects = coerceArray(effects)
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
    if (target.hasAbilityWithAttr("IgnoreMoveEffectsAbAttr") && move.id === MoveId.SPARKLING_ARIA && moveTargets.targets.length === 1) {
      return false;
    }

    const pokemon = this.selfTarget ? user : target;
    if (pokemon.status && this.effects.includes(pokemon.status.effect)) {
      globalScene.phaseManager.queueMessage(getStatusEffectHealText(pokemon.status.effect, getPokemonNameWithAffix(pokemon)));
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

/**
 * Attribute to add the {@linkcode BattlerTagType.BYPASS_SLEEP | BYPASS_SLEEP Battler Tag} for 1 turn to the user before move use.
 * Used by {@linkcode MoveId.SNORE} and {@linkcode MoveId.SLEEP_TALK}.
 */
// TODO: Should this use a battler tag?
// TODO: Give this `userSleptOrComatoseCondition` by default
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
    return user.status?.effect === StatusEffect.SLEEP ? 200 : -10;
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
      applyAbAttrs("BlockOneHitKOAbAttr", {pokemon: target, cancelled});
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
  /** This field does not exist at runtime and must not be used.
   * Its sole purpose is to ensure that typescript is able to properly narrow when the `is` method is called.
   */
  declare private _: never;
  /**
   * Apply the move attribute to override other effects of this move.
   * @param user - The {@linkcode Pokemon} using the move
   * @param target - The {@linkcode Pokemon} targeted by the move
   * @param move - The {@linkcode Move} being used
   * @param args -
   * `[0]`: A {@linkcode BooleanHolder} containing whether move effects were successfully overridden; should be set to `true` on success \
   * `[1]`: The {@linkcode MoveUseMode} dictating how this move was used.
   * @returns `true` if the move effect was successfully overridden.
   */
  public override apply(_user: Pokemon, _target: Pokemon, _move: Move, _args: [overridden: BooleanHolder, useMode: MoveUseMode]): boolean {
    return true;
  }
}

/** Abstract class for moves that add {@linkcode PositionalTag}s to the field. */
abstract class AddPositionalTagAttr extends OverrideMoveEffectAttr {
  protected abstract readonly tagType: PositionalTagType;

  public override getCondition(): MoveConditionFunc {
    // Check the arena if another similar positional tag is active and affecting the same slot
    return (_user, target, move) => globalScene.arena.positionalTagManager.canAddTag(this.tagType, target.getBattlerIndex())
  }
}

/**
 * Attribute to implement delayed attacks, such as {@linkcode MoveId.FUTURE_SIGHT} or {@linkcode MoveId.DOOM_DESIRE}.
 * Delays the attack's effect with a {@linkcode DelayedAttackTag},
 * activating against the given slot after the given turn count has elapsed.
 */
export class DelayedAttackAttr extends OverrideMoveEffectAttr {
  public chargeAnim: ChargeAnim;
  private chargeText: string;

  /**
   * @param chargeAnim - The {@linkcode ChargeAnim | charging animation} used for the move's charging phase.
   * @param chargeKey - The `i18next` locales **key** to show when the delayed attack is used.
   * In the displayed text, `{{pokemonName}}` will be populated with the user's name.
   */
  constructor(chargeAnim: ChargeAnim, chargeKey: string) {
    super();

    this.chargeAnim = chargeAnim;
    this.chargeText = chargeKey;
  }

  public override apply(user: Pokemon, target: Pokemon, move: Move, args: [overridden: BooleanHolder, useMode: MoveUseMode]): boolean {
    const useMode = args[1];
    if (useMode === MoveUseMode.DELAYED_ATTACK) {
      // don't trigger if already queueing an indirect attack
      return false;
    }

    const overridden = args[0];
    overridden.value = true;

    // Display the move animation to foresee an attack
    globalScene.phaseManager.unshiftNew("MoveAnimPhase", new MoveChargeAnim(this.chargeAnim, move.id, user));
    globalScene.phaseManager.queueMessage(
      i18next.t(
        this.chargeText,
        { pokemonName: getPokemonNameWithAffix(user) }
      )
    )

    user.pushMoveHistory({move: move.id, targets: [target.getBattlerIndex()], result: MoveResult.OTHER, useMode, turn: globalScene.currentBattle.turn})
    // Queue up an attack on the given slot.
    globalScene.arena.positionalTagManager.addTag<PositionalTagType.DELAYED_ATTACK>({
      tagType: PositionalTagType.DELAYED_ATTACK,
      sourceId: user.id,
      targetIndex: target.getBattlerIndex(),
      sourceMove: move.id,
      turnCount: 3
    })
    return true;
  }

  public override getCondition(): MoveConditionFunc {
    // Check the arena if another similar attack is active and affecting the same slot
    return (_user, target) => globalScene.arena.positionalTagManager.canAddTag(PositionalTagType.DELAYED_ATTACK, target.getBattlerIndex())
  }
}

/**
 * Attribute to queue a {@linkcode WishTag} to activate in 2 turns.
 * The tag whill heal
 */
export class WishAttr extends MoveEffectAttr {
  public override apply(user: Pokemon, target: Pokemon, _move: Move): boolean {
    globalScene.arena.positionalTagManager.addTag<PositionalTagType.WISH>({
      tagType: PositionalTagType.WISH,
      healHp: toDmgValue(user.getMaxHp() / 2),
      targetIndex: target.getBattlerIndex(),
      turnCount: 2,
      pokemonName: getPokemonNameWithAffix(user),
    });
    return true;
  }

  public override getCondition(): MoveConditionFunc {
    // Check the arena if another wish is active and affecting the same slot
    return (_user, target) => globalScene.arena.positionalTagManager.canAddTag(PositionalTagType.WISH, target.getBattlerIndex())
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
   * @param args -
   * `[0]`: A {@linkcode BooleanHolder} indicating whether the move's base
   * effects should be overridden this turn.
   * @returns `true` if base move effects were overridden; `false` otherwise
   */
  override apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (user.turnData.combiningPledge) {
      // "The two moves have become one!\nIt's a combined move!"
      globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:combiningPledge"));
      return false;
    }

    const overridden = args[0] as BooleanHolder;

    const allyMovePhase = globalScene.phaseManager.findPhase<MovePhase>((phase) => phase.is("MovePhase") && phase.pokemon.isPlayer() === user.isPlayer());
    if (allyMovePhase) {
      const allyMove = allyMovePhase.move.getMove();
      if (allyMove !== move && allyMove.hasAttr("AwaitCombinedPledgeAttr")) {
        [ user, allyMovePhase.pokemon ].forEach((p) => p.turnData.combiningPledge = move.id);

        // "{userPokemonName} is waiting for {allyPokemonName}'s move..."
        globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:awaitingPledge", {
          userPokemonName: getPokemonNameWithAffix(user),
          allyPokemonName: getPokemonNameWithAffix(allyMovePhase.pokemon)
        }));

        // Move the ally's MovePhase (if needed) so that the ally moves next
        const allyMovePhaseIndex = globalScene.phaseManager.phaseQueue.indexOf(allyMovePhase);
        const firstMovePhaseIndex = globalScene.phaseManager.phaseQueue.findIndex((phase) => phase.is("MovePhase"));
        if (allyMovePhaseIndex !== firstMovePhaseIndex) {
          globalScene.phaseManager.prependToPhase(globalScene.phaseManager.phaseQueue.splice(allyMovePhaseIndex, 1)[0], "MovePhase");
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
   * @defaultValue `true`
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
    if (moveChance < 0 || moveChance === 100 || user.randBattleSeedInt(100) < moveChance) {
      const stages = this.getLevels(user);
      globalScene.phaseManager.unshiftNew("StatStageChangePhase", (this.selfTarget ? user : target).getBattlerIndex(), this.selfTarget, this.stats, stages, this.showMessage);
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
            noEffect = !user.getMoveset().find(m => {const mv = m.getMove(); return mv.is("AttackMove") && mv.category === MoveCategory.PHYSICAL;} );
          }
          break;
        case Stat.DEF:
          if (!this.selfTarget) {
            noEffect = !user.getMoveset().find(m => {const mv = m.getMove(); return mv.is("AttackMove") && mv.category === MoveCategory.PHYSICAL;} );
          }
          break;
        case Stat.SPATK:
          if (this.selfTarget) {
            noEffect = !user.getMoveset().find(m => {const mv = m.getMove(); return mv.is("AttackMove") && mv.category === MoveCategory.PHYSICAL;} );
          }
          break;
        case Stat.SPDEF:
          if (!this.selfTarget) {
            noEffect = !user.getMoveset().find(m => {const mv = m.getMove(); return mv.is("AttackMove") && mv.category === MoveCategory.PHYSICAL;} );
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
   * @param biome - The current {@linkcode BiomeId} the battle is set in
   * @returns the chosen secondary effect {@linkcode MoveEffectAttr}
   */
  private determineBiomeEffect(biome: BiomeId): MoveEffectAttr {
    let secondaryEffect: MoveEffectAttr;
    switch (biome) {
      case BiomeId.PLAINS:
      case BiomeId.GRASS:
      case BiomeId.TALL_GRASS:
      case BiomeId.FOREST:
      case BiomeId.JUNGLE:
      case BiomeId.MEADOW:
        secondaryEffect = new StatusEffectAttr(StatusEffect.SLEEP, false);
        break;
      case BiomeId.SWAMP:
      case BiomeId.MOUNTAIN:
      case BiomeId.TEMPLE:
      case BiomeId.RUINS:
        secondaryEffect = new StatStageChangeAttr([ Stat.SPD ], -1, false);
        break;
      case BiomeId.ICE_CAVE:
      case BiomeId.SNOWY_FOREST:
        secondaryEffect = new StatusEffectAttr(StatusEffect.FREEZE, false);
        break;
      case BiomeId.VOLCANO:
        secondaryEffect = new StatusEffectAttr(StatusEffect.BURN, false);
        break;
      case BiomeId.FAIRY_CAVE:
        secondaryEffect = new StatStageChangeAttr([ Stat.SPATK ], -1, false);
        break;
      case BiomeId.DESERT:
      case BiomeId.CONSTRUCTION_SITE:
      case BiomeId.BEACH:
      case BiomeId.ISLAND:
      case BiomeId.BADLANDS:
        secondaryEffect = new StatStageChangeAttr([ Stat.ACC ], -1, false);
        break;
      case BiomeId.SEA:
      case BiomeId.LAKE:
      case BiomeId.SEABED:
        secondaryEffect = new StatStageChangeAttr([ Stat.ATK ], -1, false);
        break;
      case BiomeId.CAVE:
      case BiomeId.WASTELAND:
      case BiomeId.GRAVEYARD:
      case BiomeId.ABYSS:
      case BiomeId.SPACE:
        secondaryEffect = new AddBattlerTagAttr(BattlerTagType.FLINCHED, false, true);
        break;
      case BiomeId.END:
        secondaryEffect = new StatStageChangeAttr([ Stat.DEF ], -1, false);
        break;
      case BiomeId.TOWN:
      case BiomeId.METROPOLIS:
      case BiomeId.SLUM:
      case BiomeId.DOJO:
      case BiomeId.FACTORY:
      case BiomeId.LABORATORY:
      case BiomeId.POWER_PLANT:
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
      const boostStat = [ randStats[user.randBattleSeedInt(randStats.length)] ];
      globalScene.phaseManager.unshiftNew("StatStageChangePhase", target.getBattlerIndex(), this.selfTarget, boostStat, 2);
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

    globalScene.phaseManager.unshiftNew("StatStageChangePhase", user.getBattlerIndex(), this.selfTarget, [ increasedStat ], 1);
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
    globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:copiedStatChanges", { pokemonName: getPokemonNameWithAffix(user), targetName: getPokemonNameWithAffix(target) }));

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

    globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:invertStats", { pokemonName: getPokemonNameWithAffix(target) }));

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
      globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:statEliminated"));
    } else { // Affects only the single target when Clear Smog is used
      this.resetStats(target);
      globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:resetStats", { pokemonName: getPokemonNameWithAffix(target) }));
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
        globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:switchedStatChanges", { pokemonName: getPokemonNameWithAffix(user) }));
      } else if (this.stats.length === 2) {
        globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:switchedTwoStatChanges", {
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

/**
 * Message function for {@linkcode MoveId.FICKLE_BEAM} that shows a message before move use if
 * the move's power would be boosted.
 * @todo Find another way to synchronize the RNG calls of Fickle Beam with its message
 * than using a seed offset
 */
function doublePowerChanceMessageFunc(chance: number) {
  return (user: Pokemon, target: Pokemon, move: Move) => {
    let message: string = "";
    globalScene.executeWithSeedOffset(() => {
      const rand = randSeedInt(100);
      if (rand < chance) {
        message = i18next.t("moveTriggers:goingAllOutForAttack", { pokemonName: getPokemonNameWithAffix(user) });
      }
    }, globalScene.currentBattle.turn << 6, globalScene.waveSeed);
    return message;
  };
}

export class DoublePowerChanceAttr extends VariablePowerAttr {
  private chance: number;
  constructor(chance: number) {
    super(false)
    this.chance = chance
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    let rand = 0;
    globalScene.executeWithSeedOffset(() => rand = randSeedInt(100), globalScene.currentBattle.turn << 6, globalScene.waveSeed);
    if (rand < this.chance) {
      const power = args[0] as NumberHolder;
      power.value *= 2;
      return true;
    }

    return false;
  }
}

export abstract class ConsecutiveUsePowerMultiplierAttr extends MovePowerMultiplierAttr {
  constructor(limit: number, resetOnFail: boolean, resetOnLimit?: boolean, ...comboMoves: MoveId[]) {
    super((user: Pokemon, target: Pokemon, move: Move): number => {
      const moveHistory = user.getLastXMoves(limit + 1).slice(1);

      let count = 0;
      let turnMove: TurnMove | undefined;

      while (
        (
          (turnMove = moveHistory.shift())?.move === move.id
          || (comboMoves.length && comboMoves.includes(turnMove?.move ?? MoveId.NONE))
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
        case WeatherType.FOG:
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

    const friendshipPower = Math.floor(Math.min(user.isPlayer() ? user.friendship : user.species.baseFriendship, 255) / 2.5);
    power.value = Math.max(!this.invert ? friendshipPower : 102 - friendshipPower, 1);

    return true;
  }
}

/**
 * This Attribute calculates the current power of {@linkcode MoveId.RAGE_FIST}.
 * The counter for power calculation does not reset on every wave but on every new arena encounter.
 * Self-inflicted confusion damage and hits taken by a Subsitute are ignored.
 */
export class RageFistPowerAttr extends VariablePowerAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    /* Reasons this works correctly:
     * Confusion calls user.damageAndUpdate() directly (no counter increment),
     * Substitute hits call user.damageAndUpdate() with a damage value of 0, also causing
      no counter increment
    */
    const hitCount = user.battleData.hitCount;
    const basePower: NumberHolder = args[0];

    basePower.value = 50 * (1 + Math.min(hitCount, 6));
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
      globalScene.phaseManager.unshiftNew("PokemonHealPhase", target.getBattlerIndex(),
        toDmgValue(target.getMaxHp() / 4), i18next.t("moveTriggers:regainedHealth", { pokemonName: getPokemonNameWithAffix(target) }), true);
    }

    return true;
  }
}

export class WaterShurikenPowerAttr extends VariablePowerAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (user.species.speciesId === SpeciesId.GRENINJA && user.hasAbility(AbilityId.BATTLE_BOND) && user.formIndex === 2) {
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
  constructor() {
    super(1)
  }

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
  private move: MoveId;

  constructor(move: MoveId) {
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

      if (userAlly?.turnData.acted) {
        pokemonActed.push(userAlly);
      }
      if (enemyAlly?.turnData.acted) {
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
  override apply(user: Pokemon, target: Pokemon, move: Move, args: [NumberHolder]): boolean {
    const power = args[0];

    if (user.turnData.joinedRound) {
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
    const nextRoundPhase = globalScene.phaseManager.findPhase<MovePhase>(phase =>
      phase.is("MovePhase") && phase.move.moveId === MoveId.ROUND
    );

    if (!nextRoundPhase) {
      return false;
    }

    // Update the phase queue so that the next Pokemon using Round moves next
    const nextRoundIndex = globalScene.phaseManager.phaseQueue.indexOf(nextRoundPhase);
    const nextMoveIndex = globalScene.phaseManager.phaseQueue.findIndex(phase => phase.is("MovePhase"));
    if (nextRoundIndex !== nextMoveIndex) {
      globalScene.phaseManager.prependToPhase(globalScene.phaseManager.phaseQueue.splice(nextRoundIndex, 1)[0], "MovePhase");
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
 * apply to damage calculation (e.g. {@linkcode MoveId.SPECTRAL_THIEF})
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

        globalScene.phaseManager.unshiftNew("StatStageChangePhase", user.getBattlerIndex(), this.selfTarget, [ s ], availableToSteal);
        target.setStatStage(s, statStageValueTarget - availableToSteal);
      }
    }

    target.updateInfo();
    user.updateInfo();
    globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:stealPositiveStats", { pokemonName: getPokemonNameWithAffix(user), targetName: getPokemonNameWithAffix(target) }));

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
    } else if (predictedPhysDmg === predictedSpecDmg && user.randBattleSeedInt(2) === 0) {
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

    if ([ user.species.speciesId, user.fusionSpecies?.speciesId ].includes(SpeciesId.ARCEUS) || [ user.species.speciesId, user.fusionSpecies?.speciesId ].includes(SpeciesId.SILVALLY)) {
      const form = user.species.speciesId === SpeciesId.ARCEUS || user.species.speciesId === SpeciesId.SILVALLY ? user.formIndex : user.fusionSpecies?.formIndex!;

      moveType.value = PokemonType[PokemonType[form]];
      return true;
    }

    // Force move to have its original typing if it changed
    if (moveType.value === move.type) {
      return false;
    }
    moveType.value = move.type
    return true;
  }
}

export class TechnoBlastTypeAttr extends VariableMoveTypeAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const moveType = args[0];
    if (!(moveType instanceof NumberHolder)) {
      return false;
    }

    if ([ user.species.speciesId, user.fusionSpecies?.speciesId ].includes(SpeciesId.GENESECT)) {
      const form = user.species.speciesId === SpeciesId.GENESECT ? user.formIndex : user.fusionSpecies?.formIndex;

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

    if ([ user.species.speciesId, user.fusionSpecies?.speciesId ].includes(SpeciesId.MORPEKO)) {
      const form = user.species.speciesId === SpeciesId.MORPEKO ? user.formIndex : user.fusionSpecies?.formIndex;

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

    if ([ user.species.speciesId, user.fusionSpecies?.speciesId ].includes(SpeciesId.PALDEA_TAUROS)) {
      const form = user.species.speciesId === SpeciesId.PALDEA_TAUROS ? user.formIndex : user.fusionSpecies?.formIndex;

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

    if ([ user.species.speciesId, user.fusionSpecies?.speciesId ].includes(SpeciesId.OGERPON)) {
      const form = user.species.speciesId === SpeciesId.OGERPON ? user.formIndex : user.fusionSpecies?.formIndex;

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
          if (moveType.value === move.type) {
            return false;
          }
          moveType.value = move.type;
          break;
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
        if (moveType.value === move.type) {
          return false;
        }
        // force move to have its original typing if it was changed
        moveType.value = move.type;
        break;
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
    if (user.isTerastallized && user.hasSpecies(SpeciesId.TERAPAGOS)) {
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
      case MoveId.FIRE_PLEDGE:
        if (combinedPledgeMove === MoveId.WATER_PLEDGE) {
          moveType.value = PokemonType.WATER;
          return true;
        }
        return false;
      case MoveId.WATER_PLEDGE:
        if (combinedPledgeMove === MoveId.GRASS_PLEDGE) {
          moveType.value = PokemonType.GRASS;
          return true;
        }
        return false;
      case MoveId.GRASS_PLEDGE:
        if (combinedPledgeMove === MoveId.FIRE_PLEDGE) {
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

/**
 * Function to deal Crash Damage (1/2 max hp) to the user on apply.
 */
const crashDamageFunc: UserMoveConditionFunc = (user: Pokemon, move: Move) => {
  const cancelled = new BooleanHolder(false);
  applyAbAttrs("BlockNonDirectDamageAbAttr", {pokemon: user, cancelled});
  if (cancelled.value) {
    return false;
  }

  user.damageAndUpdate(toDmgValue(user.getMaxHp() / 2), { result: HitResult.INDIRECT });
  globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:keptGoingAndCrashed", { pokemonName: getPokemonNameWithAffix(user) }));
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

    // TODO: Disable if used via dancer
    // TODO: Add support for moves that don't add the frenzy tag (Uproar, Rollout, etc.)

    // If frenzy is not active, add a tag and push 1-2 extra turns of attacks to the user's move queue.
    // Otherwise, tick down the existing tag.
    if (!user.getTag(BattlerTagType.FRENZY) && user.getMoveQueue().length === 0) {
      const turnCount = user.randBattleSeedIntRange(1, 2); // excludes initial use
      for (let i = 0; i < turnCount; i++) {
        user.pushMoveQueue({ move: move.id, targets: [ target.getBattlerIndex() ], useMode: MoveUseMode.IGNORE_PP });
      }
      user.addTag(BattlerTagType.FRENZY, turnCount, move.id, user.id);
    } else {
      applyMoveAttrs("AddBattlerTagAttr", user, target, move, args);
      user.lapseTag(BattlerTagType.FRENZY);
    }

    return true;
  }
}

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

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    const moveChance = this.getMoveChance(user, target, move, this.selfTarget, true);
    if (moveChance < 0 || moveChance === 100 || user.randBattleSeedInt(100) < moveChance) {
      return (this.selfTarget ? user : target).addTag(this.tagType,  user.randBattleSeedIntRange(this.turnCountMin, this.turnCountMax), move.id, user.id);
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
      globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:fallDown", { targetPokemonName: getPokemonNameWithAffix(target) }));
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

    if (user.hasAbility(AbilityId.GULP_MISSILE) && user.species.speciesId === SpeciesId.CRAMORANT) {
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
    const isCramorant = user.hasAbility(AbilityId.GULP_MISSILE) && user.species.speciesId === SpeciesId.CRAMORANT;
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
    if (moveChance < 0 || moveChance === 100 || user.randBattleSeedInt(100) < moveChance) {
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
        globalScene.phaseManager.queueMessage(i18next.t("battle:attackFailed"));
        return false;
      }
      const curseRecoilDamage = Math.max(1, Math.floor(user.getMaxHp() / 2));
      user.damageAndUpdate(curseRecoilDamage, { result: HitResult.INDIRECT, ignoreSegments: true });
      globalScene.phaseManager.queueMessage(
        i18next.t("battlerTags:cursedOnAdd", {
          pokemonNameWithAffix: getPokemonNameWithAffix(user),
          pokemonName: getPokemonNameWithAffix(target)
        })
      );

      target.addTag(BattlerTagType.CURSED, 0, move.id, user.id);
      return true;
    } else {
      globalScene.phaseManager.unshiftNew("StatStageChangePhase", user.getBattlerIndex(), true, [ Stat.ATK, Stat.DEF ], 1);
      globalScene.phaseManager.unshiftNew("StatStageChangePhase", user.getBattlerIndex(), true, [ Stat.SPD ], -1);
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
        globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:safeguard", { targetName: getPokemonNameWithAffix(target) }));
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

      for (const turnMove of user.getLastXMoves(-1).slice()) {
        if (
          // Quick & Wide guard increment the Protect counter without using it for fail chance
          !(allMoves[turnMove.move].hasAttr("ProtectAttr") ||
          [MoveId.QUICK_GUARD, MoveId.WIDE_GUARD].includes(turnMove.move)) ||
          turnMove.result !== MoveResult.SUCCESS
        ) {
          break;
        }

        timesUsed++
      }

      return timesUsed === 0 || user.randBattleSeedInt(Math.pow(3, timesUsed)) === 0;
    });
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

    if ((move.chance < 0 || move.chance === 100 || user.randBattleSeedInt(100) < move.chance) && user.getLastXMoves(1)[0]?.result === MoveResult.SUCCESS) {
      const side = ((this.selfSideTarget ? user : target).isPlayer() !== (move.hasAttr("AddArenaTrapTagAttr") && target === user)) ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY;
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
      const tag = globalScene.arena.getTagOnSide(this.tagType, side) as EntryHazardTag;
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
    const tag = globalScene.arena.getTagOnSide(this.tagType, side) as EntryHazardTag;
    if ((moveChance < 0 || moveChance === 100 || user.randBattleSeedInt(100) < moveChance) && user.getLastXMoves(1)[0]?.result === MoveResult.SUCCESS) {
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


    globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:swapArenaTags", { pokemonName: getPokemonNameWithAffix(user) }));
    return true;
  }
}

/**
 * Attribute that adds a secondary effect to the field when two unique Pledge moves
 * are combined. The effect added varies based on the two Pledge moves combined.
 */
export class AddPledgeEffectAttr extends AddArenaTagAttr {
  private readonly requiredPledge: MoveId;

  constructor(tagType: ArenaTagType, requiredPledge: MoveId, selfSideTarget: boolean = false) {
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
   * @returns `true` if function succeeds.
   */
  override apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    // If user is player, checks if the user has fainted pokemon
    if (user.isPlayer()) {
      globalScene.phaseManager.unshiftNew("RevivalBlessingPhase", user);
      return true;
    } else if (user.isEnemy() && user.hasTrainer() && globalScene.getEnemyParty().findIndex((p) => p.isFainted() && !p.isBoss()) > -1) {
      // If used by an enemy trainer with at least one fainted non-boss Pokemon, this
      // revives one of said Pokemon selected at random.
      const faintedPokemon = globalScene.getEnemyParty().filter((p) => p.isFainted() && !p.isBoss());
      const pokemon = faintedPokemon[user.randBattleSeedInt(faintedPokemon.length)];
      const slotIndex = globalScene.getEnemyParty().findIndex((p) => pokemon.id === p.id);
      pokemon.resetStatus(true, false, false, true);
      pokemon.heal(Math.min(toDmgValue(0.5 * pokemon.getMaxHp()), pokemon.getMaxHp()));
      globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:revivalBlessing", { pokemonName: getPokemonNameWithAffix(pokemon) }), 0, true);
      const allyPokemon = user.getAlly();
      if (globalScene.currentBattle.double && globalScene.getEnemyParty().length > 1 && !isNullOrUndefined(allyPokemon)) {
        // Handle cases where revived pokemon needs to get switched in on same turn
        if (allyPokemon.isFainted() || allyPokemon === pokemon) {
          // Enemy switch phase should be removed and replaced with the revived pkmn switching in
          globalScene.phaseManager.tryRemovePhase((phase: SwitchSummonPhase) => phase.is("SwitchSummonPhase") && phase.getPokemon() === pokemon);
          // If the pokemon being revived was alive earlier in the turn, cancel its move
          // (revived pokemon can't move in the turn they're brought back)
          // TODO: might make sense to move this to `FaintPhase` after checking for Rev Seed (rather than handling it in the move)
          globalScene.phaseManager.findPhase((phase: MovePhase) => phase.pokemon === pokemon)?.cancel();
          if (user.fieldPosition === FieldPosition.CENTER) {
            user.setFieldPosition(FieldPosition.LEFT);
          }
          globalScene.phaseManager.unshiftNew("SwitchSummonPhase", SwitchType.SWITCH, allyPokemon.getFieldIndex(), slotIndex, false, false);
        }
      }
      return true;
    }
    return false;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) =>
      user.hasTrainer() &&
      (user.isPlayer() ? globalScene.getPlayerParty() : globalScene.getEnemyParty()).some((p: Pokemon) => p.isFainted() && !p.isBoss());
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

    if (switchOutTarget.isPlayer()) {
      /**
      * Check if Wimp Out/Emergency Exit activates due to being hit by U-turn or Volt Switch
      * If it did, the user of U-turn or Volt Switch will not be switched out.
      */
      if (target.getAbility().hasAttr("PostDamageForceSwitchAbAttr")
        && [ MoveId.U_TURN, MoveId.VOLT_SWITCH, MoveId.FLIP_TURN ].includes(move.id)
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
          const slotIndex = eligibleNewIndices[user.randBattleSeedInt(eligibleNewIndices.length)];
          globalScene.phaseManager.prependNewToPhase(
            "MoveEndPhase",
            "SwitchSummonPhase",
            this.switchType,
            switchOutTarget.getFieldIndex(),
            slotIndex,
            false,
            true
          );
        } else {
          switchOutTarget.leaveField(this.switchType === SwitchType.SWITCH);
          globalScene.phaseManager.prependNewToPhase("MoveEndPhase",
            "SwitchPhase",
              this.switchType,
              switchOutTarget.getFieldIndex(),
              true,
              true
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
          const slotIndex = eligibleNewIndices[user.randBattleSeedInt(eligibleNewIndices.length)];
          globalScene.phaseManager.prependNewToPhase("MoveEndPhase",
            "SwitchSummonPhase",
              this.switchType,
              switchOutTarget.getFieldIndex(),
              slotIndex,
              false,
              false
          );
        } else {
          switchOutTarget.leaveField(this.switchType === SwitchType.SWITCH);
          globalScene.phaseManager.prependNewToPhase("MoveEndPhase",
            "SwitchSummonPhase",
            this.switchType,
            switchOutTarget.getFieldIndex(),
            (globalScene.currentBattle.trainer ? globalScene.currentBattle.trainer.getNextSummonIndex((switchOutTarget as EnemyPokemon).trainerSlot) : 0),
            false,
            false
          );
        }
      }
    } else { // Switch out logic for wild pokemon
      /**
      * Check if Wimp Out/Emergency Exit activates due to being hit by U-turn or Volt Switch
      * If it did, the user of U-turn or Volt Switch will not be switched out.
      */
      if (target.getAbility().hasAttr("PostDamageForceSwitchAbAttr")
        && [ MoveId.U_TURN, MoveId.VOLT_SWITCH, MoveId.FLIP_TURN ].includes(move.id)
      ) {
        if (this.hpDroppedBelowHalf(target)) {
          return false;
        }
      }

      const allyPokemon = switchOutTarget.getAlly();

      if (switchOutTarget.hp > 0) {
        switchOutTarget.leaveField(false);
        globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:fled", { pokemonName: getPokemonNameWithAffix(switchOutTarget) }), null, true, 500);

        // in double battles redirect potential moves off fled pokemon
        if (globalScene.currentBattle.double && !isNullOrUndefined(allyPokemon)) {
          globalScene.redirectPokemonMoves(switchOutTarget, allyPokemon);
        }
      }

      // clear out enemy held item modifiers of the switch out target
      globalScene.clearEnemyHeldItemModifiers(switchOutTarget);

      if (!allyPokemon?.isActive(true) && switchOutTarget.hp) {
          globalScene.phaseManager.pushNew("BattleEndPhase", false);

          if (globalScene.gameMode.hasRandomBiomes || globalScene.isNewBiome()) {
            globalScene.phaseManager.pushNew("SelectBiomePhase");
          }

          globalScene.phaseManager.pushNew("NewBattlePhase");
      }
    }

	  return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => (move.category !== MoveCategory.STATUS || this.getSwitchOutCondition()(user, target, move));
  }

  getFailedText(_user: Pokemon, target: Pokemon, _move: Move): string | undefined {
    const cancelled = new BooleanHolder(false);
    applyAbAttrs("ForceSwitchOutImmunityAbAttr", {pokemon: target, cancelled});
    if (cancelled.value) {
      return i18next.t("moveTriggers:cannotBeSwitchedOut", { pokemonName: getPokemonNameWithAffix(target) });
    }
  }


  getSwitchOutCondition(): MoveConditionFunc {
    return (user, target, move) => {
      const switchOutTarget = (this.selfSwitch ? user : target);
      const player = switchOutTarget.isPlayer();
      const forceSwitchAttr = move.getAttrs("ForceSwitchOutAttr").find(attr => attr.switchType === SwitchType.FORCE_SWITCH);

      if (!this.selfSwitch) {
        if (move.hitsSubstitute(user, target)) {
          return false;
        }

        // Check if the move is Roar or Whirlwind and if there is a trainer with only Pokémon left.
        if (forceSwitchAttr && globalScene.currentBattle.trainer) {
        const enemyParty = globalScene.getEnemyParty();
        // Filter out any Pokémon that are not allowed in battle (e.g. fainted ones)
        const remainingPokemon = enemyParty.filter(p => p.hp > 0 && p.isAllowedInBattle());
          if (remainingPokemon.length <= 1) {
            return false;
          }
        }

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
        applyAbAttrs("ForceSwitchOutImmunityAbAttr", {pokemon: target, cancelled: blockedByAbility});
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

  // TODO: Remove the message callback
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

    globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:copyType", { pokemonName: getPokemonNameWithAffix(user), targetPokemonName: getPokemonNameWithAffix(target) }));

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

    globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:transformedIntoType", { pokemonName: getPokemonNameWithAffix(user), typeName: i18next.t(`pokemonInfo:type.${toCamelCase(PokemonType[typeChange])}`) }));

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
   * @param biomeType {@linkcode BiomeId}
   * @returns {@linkcode Type}
   */
  private getTypeForBiome(biomeType: BiomeId): PokemonType {
    switch (biomeType) {
      case BiomeId.TOWN:
      case BiomeId.PLAINS:
      case BiomeId.METROPOLIS:
        return PokemonType.NORMAL;
      case BiomeId.GRASS:
      case BiomeId.TALL_GRASS:
        return PokemonType.GRASS;
      case BiomeId.FOREST:
      case BiomeId.JUNGLE:
        return PokemonType.BUG;
      case BiomeId.SLUM:
      case BiomeId.SWAMP:
        return PokemonType.POISON;
      case BiomeId.SEA:
      case BiomeId.BEACH:
      case BiomeId.LAKE:
      case BiomeId.SEABED:
        return PokemonType.WATER;
      case BiomeId.MOUNTAIN:
        return PokemonType.FLYING;
      case BiomeId.BADLANDS:
        return PokemonType.GROUND;
      case BiomeId.CAVE:
      case BiomeId.DESERT:
        return PokemonType.ROCK;
      case BiomeId.ICE_CAVE:
      case BiomeId.SNOWY_FOREST:
        return PokemonType.ICE;
      case BiomeId.MEADOW:
      case BiomeId.FAIRY_CAVE:
      case BiomeId.ISLAND:
        return PokemonType.FAIRY;
      case BiomeId.POWER_PLANT:
        return PokemonType.ELECTRIC;
      case BiomeId.VOLCANO:
        return PokemonType.FIRE;
      case BiomeId.GRAVEYARD:
      case BiomeId.TEMPLE:
        return PokemonType.GHOST;
      case BiomeId.DOJO:
      case BiomeId.CONSTRUCTION_SITE:
        return PokemonType.FIGHTING;
      case BiomeId.FACTORY:
      case BiomeId.LABORATORY:
        return PokemonType.STEEL;
      case BiomeId.RUINS:
      case BiomeId.SPACE:
        return PokemonType.PSYCHIC;
      case BiomeId.WASTELAND:
      case BiomeId.END:
        return PokemonType.DRAGON;
      case BiomeId.ABYSS:
        return PokemonType.DARK;
      default:
        return PokemonType.UNKNOWN;
    }
  }
}

/** 
 * Attribute to override the target's current types to the given type.
 * Used by {@linkcode MoveId.SOAK} and {@linkcode MoveId.MAGIC_POWDER}.
 */
export class ChangeTypeAttr extends MoveEffectAttr {
  private type: PokemonType;

  constructor(type: PokemonType) {
    super(false);
    this.type = type;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    target.summonData.types = [ this.type ];
    target.updateInfo();

    globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:transformedIntoType", { pokemonName: getPokemonNameWithAffix(target), typeName: i18next.t(`pokemonInfo:type.${toCamelCase(PokemonType[this.type])}`) }));

    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => !target.isTerastallized && !target.hasAbility(AbilityId.MULTITYPE) && !target.hasAbility(AbilityId.RKS_SYSTEM) && !(target.getTypes().length === 1 && target.getTypes()[0] === this.type);
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

    globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:addType", { typeName: i18next.t(`pokemonInfo:type.${toCamelCase(PokemonType[this.type])}`), pokemonName: getPokemonNameWithAffix(target) }));

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
    globalScene.phaseManager.queueMessage(i18next.t("battle:transformedIntoType", { pokemonName: getPokemonNameWithAffix(user), type: i18next.t(`pokemonInfo:type.${toCamelCase(PokemonType[firstMoveType])}`) }));

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
  protected invalidMoves: ReadonlySet<MoveId>;
  protected hasTarget: boolean;

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    // Get eligible targets for move, failing if we can't target anything
    const replaceMoveTarget = move.moveTarget === MoveTarget.NEAR_OTHER ? MoveTarget.NEAR_ENEMY : undefined;
    const moveTargets = getMoveTargets(user, move.id, replaceMoveTarget);
    if (moveTargets.targets.length === 0) {
      globalScene.phaseManager.queueMessage(i18next.t("battle:attackFailed"));
      return false;
    }

    // Spread moves and ones with only 1 valid target will use their normal targeting.
    // If not, target the Mirror Move recipient or else a random enemy in our target list
    const targets = moveTargets.multiple || moveTargets.targets.length === 1
      ? moveTargets.targets
      : [this.hasTarget
        ? target.getBattlerIndex()
        : moveTargets.targets[user.randBattleSeedInt(moveTargets.targets.length)]];

    globalScene.phaseManager.unshiftNew("LoadMoveAnimPhase", move.id);
    globalScene.phaseManager.unshiftNew("MovePhase", user, targets, new PokemonMove(move.id), MoveUseMode.FOLLOW_UP);
    return true;
  }
}

/**
 * Attribute used to call a random move.
 * Used for {@linkcode MoveId.METRONOME}
 * @see {@linkcode apply} for move selection and move call
 * @extends CallMoveAttr to call a selected move
 */
export class RandomMoveAttr extends CallMoveAttr {
  constructor(invalidMoves: ReadonlySet<MoveId>) {
    super();
    this.invalidMoves = invalidMoves;
  }

  /**
   * This function exists solely to allow tests to override the randomly selected move by mocking this function.
   */
  public getMoveOverride(): MoveId | null {
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
  override apply(user: Pokemon, target: Pokemon, _move: Move, args: any[]): boolean {
    // TODO: Move this into the constructor to avoid constructing this every call
    const moveIds = getEnumValues(MoveId).map(m => !this.invalidMoves.has(m) && !allMoves[m].name.endsWith(" (N)") ? m : MoveId.NONE);
    let moveId: MoveId = MoveId.NONE;
    const moveStatus = new BooleanHolder(true);
    do {
      moveId = this.getMoveOverride() ?? moveIds[user.randBattleSeedInt(moveIds.length)];
      moveStatus.value = moveId !== MoveId.NONE;
      if (user.isPlayer()) {
          applyChallenges(ChallengeType.POKEMON_MOVE, moveId, moveStatus);
      }
    }
    while (!moveStatus.value);
    return super.apply(user, target, allMoves[moveId], args);
  }
}

/**
 * Attribute used to call a random move in the user or party's moveset.
 * Used for {@linkcode MoveId.ASSIST} and {@linkcode MoveId.SLEEP_TALK}
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
  constructor(invalidMoves: ReadonlySet<MoveId>, includeParty: boolean = false) {
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
        allies = (user.isPlayer() ? globalScene.getPlayerParty() : globalScene.getEnemyParty()).filter(p => p !== user);
      } else {
        allies = [ user ];
      }
      const partyMoveset = allies.flatMap(p => p.moveset);
      const moves = partyMoveset.filter(m => !this.invalidMoves.has(m.moveId) && !m.getMove().name.endsWith(" (N)"));
      if (moves.length === 0) {
        return false;
      }

      this.moveId = moves[user.randBattleSeedInt(moves.length)].moveId;
      return true;
    };
  }
}

// TODO: extend CallMoveAttr
export class NaturePowerAttr extends OverrideMoveEffectAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    let moveId = MoveId.NONE;
    switch (globalScene.arena.getTerrainType()) {
    // this allows terrains to 'override' the biome move
      case TerrainType.NONE:
        switch (globalScene.arena.biomeType) {
          case BiomeId.TOWN:
            moveId = MoveId.ROUND;
            break;
          case BiomeId.METROPOLIS:
            moveId = MoveId.TRI_ATTACK;
            break;
          case BiomeId.SLUM:
            moveId = MoveId.SLUDGE_BOMB;
            break;
          case BiomeId.PLAINS:
            moveId = MoveId.SILVER_WIND;
            break;
          case BiomeId.GRASS:
            moveId = MoveId.GRASS_KNOT;
            break;
          case BiomeId.TALL_GRASS:
            moveId = MoveId.POLLEN_PUFF;
            break;
          case BiomeId.MEADOW:
            moveId = MoveId.GIGA_DRAIN;
            break;
          case BiomeId.FOREST:
            moveId = MoveId.BUG_BUZZ;
            break;
          case BiomeId.JUNGLE:
            moveId = MoveId.LEAF_STORM;
            break;
          case BiomeId.SEA:
            moveId = MoveId.HYDRO_PUMP;
            break;
          case BiomeId.SWAMP:
            moveId = MoveId.MUD_BOMB;
            break;
          case BiomeId.BEACH:
            moveId = MoveId.SCALD;
            break;
          case BiomeId.LAKE:
            moveId = MoveId.BUBBLE_BEAM;
            break;
          case BiomeId.SEABED:
            moveId = MoveId.BRINE;
            break;
          case BiomeId.ISLAND:
            moveId = MoveId.LEAF_TORNADO;
            break;
          case BiomeId.MOUNTAIN:
            moveId = MoveId.AIR_SLASH;
            break;
          case BiomeId.BADLANDS:
            moveId = MoveId.EARTH_POWER;
            break;
          case BiomeId.DESERT:
            moveId = MoveId.SCORCHING_SANDS;
            break;
          case BiomeId.WASTELAND:
            moveId = MoveId.DRAGON_PULSE;
            break;
          case BiomeId.CONSTRUCTION_SITE:
            moveId = MoveId.STEEL_BEAM;
            break;
          case BiomeId.CAVE:
            moveId = MoveId.POWER_GEM;
            break;
          case BiomeId.ICE_CAVE:
            moveId = MoveId.ICE_BEAM;
            break;
          case BiomeId.SNOWY_FOREST:
            moveId = MoveId.FROST_BREATH;
            break;
          case BiomeId.VOLCANO:
            moveId = MoveId.LAVA_PLUME;
            break;
          case BiomeId.GRAVEYARD:
            moveId = MoveId.SHADOW_BALL;
            break;
          case BiomeId.RUINS:
            moveId = MoveId.ANCIENT_POWER;
            break;
          case BiomeId.TEMPLE:
            moveId = MoveId.EXTRASENSORY;
            break;
          case BiomeId.DOJO:
            moveId = MoveId.FOCUS_BLAST;
            break;
          case BiomeId.FAIRY_CAVE:
            moveId = MoveId.ALLURING_VOICE;
            break;
          case BiomeId.ABYSS:
            moveId = MoveId.OMINOUS_WIND;
            break;
          case BiomeId.SPACE:
            moveId = MoveId.DRACO_METEOR;
            break;
          case BiomeId.FACTORY:
            moveId = MoveId.FLASH_CANNON;
            break;
          case BiomeId.LABORATORY:
            moveId = MoveId.ZAP_CANNON;
            break;
          case BiomeId.POWER_PLANT:
            moveId = MoveId.CHARGE_BEAM;
            break;
          case BiomeId.END:
            moveId = MoveId.ETERNABEAM;
            break;
        }
        break;
      case TerrainType.MISTY:
        moveId = MoveId.MOONBLAST;
        break;
      case TerrainType.ELECTRIC:
        moveId = MoveId.THUNDERBOLT;
        break;
      case TerrainType.GRASSY:
        moveId = MoveId.ENERGY_BALL;
        break;
      case TerrainType.PSYCHIC:
        moveId = MoveId.PSYCHIC;
        break;
      default:
        // Just in case there's no match
        moveId = MoveId.TRI_ATTACK;
        break;
    }

    // Load the move's animation if we didn't already and unshift a new usage phase
    globalScene.phaseManager.unshiftNew("LoadMoveAnimPhase", moveId);
    globalScene.phaseManager.unshiftNew("MovePhase", user, [ target.getBattlerIndex() ], new PokemonMove(moveId), MoveUseMode.FOLLOW_UP);
    return true;
  }
}

/**
 * Attribute used to copy a previously-used move.
 * Used for {@linkcode MoveId.COPYCAT} and {@linkcode MoveId.MIRROR_MOVE}
 * @see {@linkcode apply} for move selection and move call
 * @extends CallMoveAttr to call a selected move
 */
export class CopyMoveAttr extends CallMoveAttr {
  private mirrorMove: boolean;
  constructor(mirrorMove: boolean, invalidMoves: ReadonlySet<MoveId> = new Set()) {
    super();
    this.mirrorMove = mirrorMove;
    this.invalidMoves = invalidMoves;
  }

  apply(user: Pokemon, target: Pokemon, _move: Move, args: any[]): boolean {
    this.hasTarget = this.mirrorMove;
    // bang is correct as condition func returns `false` and fails move if no last move exists
    const lastMove = this.mirrorMove ? target.getLastNonVirtualMove(false, false)!.move : globalScene.currentBattle.lastMove;
    return super.apply(user, target, allMoves[lastMove], args);
  }

  getCondition(): MoveConditionFunc {
    return (_user, target, _move) => {
      const lastMove = this.mirrorMove ? target.getLastNonVirtualMove(false, false)?.move : globalScene.currentBattle.lastMove;
      return !isNullOrUndefined(lastMove) && !this.invalidMoves.has(lastMove);
    };
  }
}

/**
 * Attribute used for moves that cause the target to repeat their last used move.
 *
 * Used by {@linkcode MoveId.INSTRUCT | Instruct}.
 * @see [Instruct on Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Instruct_(move))
*/
export class RepeatMoveAttr extends MoveEffectAttr {
  private movesetMove: PokemonMove;
  constructor() {
    super(false, { trigger: MoveEffectTrigger.POST_APPLY }); // needed to ensure correct protect interaction
  }

  /**
   * Forces the target to re-use their last used move again.
   * @param user - The {@linkcode Pokemon} using the attack
   * @param target - The {@linkcode Pokemon} being targeted by the attack
   * @returns `true` if the move succeeds
   */
  apply(user: Pokemon, target: Pokemon): boolean {
    // get the last move used (excluding status based failures) as well as the corresponding moveset slot
    // bangs are justified as Instruct fails if no prior move or moveset move exists
    // TODO: How does instruct work when copying a move called via Copycat that the user itself knows?
    const lastMove = target.getLastNonVirtualMove()!;
    const movesetMove = target.getMoveset().find(m => m.moveId === lastMove?.move)!

    // If the last move used can hit more than one target or has variable targets,
    // re-compute the targets for the attack (mainly for alternating double/single battles)
    // Rampaging moves (e.g. Outrage) are not included due to being incompatible with Instruct,
    // nor is Dragon Darts (due to its smart targeting bypassing normal target selection)
    let moveTargets = this.movesetMove.getMove().isMultiTarget() ? getMoveTargets(target, this.movesetMove.moveId).targets : lastMove.targets;

    // In the event the instructed move's only target is a fainted opponent, redirect it to an alive ally if possible.
    // Normally, all yet-unexecuted move phases would swap targets after any foe faints or flees (see `redirectPokemonMoves` in `battle-scene.ts`),
    // but since Instruct adds a new move phase _after_ all that occurs, we need to handle this interaction manually.
    const firstTarget = globalScene.getField()[moveTargets[0]];
    if (
      globalScene.currentBattle.double
      && moveTargets.length === 1
      && firstTarget.isFainted()
      && firstTarget !== target.getAlly()
    ) {
      const ally = firstTarget.getAlly();
      if (!isNullOrUndefined(ally) && ally.isActive()) {
        moveTargets = [ ally.getBattlerIndex() ];
      }
    }

    globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:instructingMove", {
      userPokemonName: getPokemonNameWithAffix(user),
      targetPokemonName: getPokemonNameWithAffix(target)
    }));
    target.turnData.extraTurns++;
    globalScene.phaseManager.appendNewToPhase("MoveEndPhase", "MovePhase", target, moveTargets, movesetMove, MoveUseMode.NORMAL);
    return true;
  }

  getCondition(): MoveConditionFunc {
    return (_user, target, _move) => {
      // TODO: Check instruct behavior with struggle - ignore, fail or success
      const lastMove = target.getLastNonVirtualMove();
      const movesetMove = target.getMoveset().find(m => m.moveId === lastMove?.move);
      const uninstructableMoves = [
        // Locking/Continually Executed moves
        MoveId.OUTRAGE,
        MoveId.RAGING_FURY,
        MoveId.ROLLOUT,
        MoveId.PETAL_DANCE,
        MoveId.THRASH,
        MoveId.ICE_BALL,
        MoveId.UPROAR,
        // Multi-turn Moves
        MoveId.BIDE,
        MoveId.SHELL_TRAP,
        MoveId.BEAK_BLAST,
        MoveId.FOCUS_PUNCH,
        // "First Turn Only" moves
        MoveId.FAKE_OUT,
        MoveId.FIRST_IMPRESSION,
        MoveId.MAT_BLOCK,
        // Moves with a recharge turn
        MoveId.HYPER_BEAM,
        MoveId.ETERNABEAM,
        MoveId.FRENZY_PLANT,
        MoveId.BLAST_BURN,
        MoveId.HYDRO_CANNON,
        MoveId.GIGA_IMPACT,
        MoveId.PRISMATIC_LASER,
        MoveId.ROAR_OF_TIME,
        MoveId.ROCK_WRECKER,
        MoveId.METEOR_ASSAULT,
        // Charging & 2-turn moves
        MoveId.DIG,
        MoveId.FLY,
        MoveId.BOUNCE,
        MoveId.SHADOW_FORCE,
        MoveId.PHANTOM_FORCE,
        MoveId.DIVE,
        MoveId.ELECTRO_SHOT,
        MoveId.ICE_BURN,
        MoveId.GEOMANCY,
        MoveId.FREEZE_SHOCK,
        MoveId.SKY_DROP,
        MoveId.SKY_ATTACK,
        MoveId.SKULL_BASH,
        MoveId.SOLAR_BEAM,
        MoveId.SOLAR_BLADE,
        MoveId.METEOR_BEAM,
        // Copying/Move-Calling moves
        MoveId.ASSIST,
        MoveId.COPYCAT,
        MoveId.ME_FIRST,
        MoveId.METRONOME,
        MoveId.MIRROR_MOVE,
        MoveId.NATURE_POWER,
        MoveId.SLEEP_TALK,
        MoveId.SNATCH,
        MoveId.INSTRUCT,
        // Misc moves
        MoveId.KINGS_SHIELD,
        MoveId.SKETCH,
        MoveId.TRANSFORM,
        MoveId.MIMIC,
        MoveId.STRUGGLE,
        // TODO: Add Max/G-Max/Z-Move blockage if or when they are implemented
      ];

      if (!lastMove?.move // no move to instruct
        || !movesetMove // called move not in target's moveset (forgetting the move, etc.)
        || movesetMove.ppUsed === movesetMove.getMovePp() // move out of pp
        // TODO: This next line is likely redundant as all charging moves are in the above list
        || allMoves[lastMove.move].isChargingMove() // called move is a charging/recharging move
        || uninstructableMoves.includes(lastMove.move)) { // called move is in the banlist
        return false;
      }
      this.movesetMove = movesetMove;
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
   * @param user - N/A
   * @param target - The {@linkcode Pokemon} targeted by the attack
   * @param move - N/A
   * @param args - N/A
   * @returns always `true`
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    /** The last move the target themselves used */
    const lastMove = target.getLastNonVirtualMove();
    const movesetMove = target.getMoveset().find(m => m.moveId === lastMove?.move)!; // bang is correct as condition prevents this from being nullish
    const lastPpUsed = movesetMove.ppUsed;
    movesetMove.ppUsed = Math.min(lastPpUsed + this.reduction, movesetMove.getMovePp());

    globalScene.eventTarget.dispatchEvent(new MoveUsedEvent(target.id, movesetMove.getMove(), movesetMove.ppUsed));
    globalScene.phaseManager.queueMessage(i18next.t("battle:ppReduced", { targetName: getPokemonNameWithAffix(target), moveName: movesetMove.getName(), reduction: (movesetMove.ppUsed) - lastPpUsed }));

    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => {
      const lastMove = target.getLastNonVirtualMove();
      const movesetMove = target.getMoveset().find(m => m.moveId === lastMove?.move)
      return !!movesetMove?.getPpRatio();
    };
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    const lastMove = target.getLastNonVirtualMove();
    const movesetMove = target.getMoveset().find(m => m.moveId === lastMove?.move)
    if (!movesetMove) {
      return 0;
    }

    const maxPp = movesetMove.getMovePp();
    const ppLeft = maxPp - movesetMove.ppUsed;
    const value = -(8 - Math.ceil(Math.min(maxPp, 30) / 5));
    if (ppLeft < 4) {
      return (value / 4) * ppLeft;
    }
    return value;

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
   * @param user - The {@linkcode Pokemon} using the move
   * @param target -The {@linkcode Pokemon} targeted by the attack
   * @param move - The {@linkcode Move} being used
   * @param args - N/A
   * @returns - always `true`
   */
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const lastMove = target.getLastNonVirtualMove();
    const movesetMove = target.getMoveset().find(m => m.moveId === lastMove?.move);
    if (movesetMove?.getPpRatio()) {
      super.apply(user, target, move, args);
    }

    return true;
  }

  /**
   * Override condition function to always perform damage.
   * Instead, perform pp-reduction condition check in {@linkcode apply}.
   * (A failed condition will prevent damage which is not what we want here)
   * @returns always `true`
   */
  override getCondition(): MoveConditionFunc {
    return () => true;
  }
}

const targetMoveCopiableCondition: MoveConditionFunc = (user, target, move) => {
  const copiableMove = target.getLastNonVirtualMove();
  if (!copiableMove?.move) {
    return false;
  }

  if (allMoves[copiableMove.move].isChargingMove() && copiableMove.result === MoveResult.OTHER) {
    return false;
  }

  // TODO: Add last turn of Bide

  return true;
};

/**
 * Attribute to temporarily copy the last move in the target's moveset.
 * Used by {@linkcode MoveId.MIMIC}.
 */
export class MovesetCopyMoveAttr extends OverrideMoveEffectAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const lastMove = target.getLastNonVirtualMove()
    if (!lastMove?.move) {
      return false;
    }

    const copiedMove = allMoves[lastMove.move];

    const thisMoveIndex = user.getMoveset().findIndex(m => m.moveId === move.id);

    if (thisMoveIndex === -1) {
      return false;
    }

    // Populate summon data with a copy of the current moveset, replacing the copying move with the copied move
    user.summonData.moveset = user.getMoveset().slice(0);
    user.summonData.moveset[thisMoveIndex] = new PokemonMove(copiedMove.id);

    globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:copiedMove", { pokemonName: getPokemonNameWithAffix(user), moveName: copiedMove.name }));

    return true;
  }

  getCondition(): MoveConditionFunc {
    return targetMoveCopiableCondition;
  }
}

/**
 * Attribute for {@linkcode MoveId.SKETCH} that causes the user to copy the opponent's last used move
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

    const targetMove = target.getLastNonVirtualMove()
    if (!targetMove) {
      // failsafe for TS compiler
      return false;
    }

    const sketchedMove = allMoves[targetMove.move];
    const sketchIndex = user.getMoveset().findIndex(m => m.moveId === move.id);
    if (sketchIndex === -1) {
      return false;
    }

    user.setMove(sketchIndex, sketchedMove.id);

    globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:sketchedMove", { pokemonName: getPokemonNameWithAffix(user), moveName: sketchedMove.name }));

    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target, move) => {
      if (!targetMoveCopiableCondition(user, target, move)) {
        return false;
      }

      const targetMove = target.getLastNonVirtualMove();
      return !isNullOrUndefined(targetMove)
        && !invalidSketchMoves.has(targetMove.move)
        && user.getMoveset().every(m => m.moveId !== targetMove.move)
    };
  }
}

export class AbilityChangeAttr extends MoveEffectAttr {
  public ability: AbilityId;

  constructor(ability: AbilityId, selfTarget?: boolean) {
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
      globalScene.phaseManager.queueMessage(i18next.t("abilityTriggers:illusionBreak", { pokemonName: getPokemonNameWithAffix(moveTarget) }));
    }
    globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:acquiredAbility", { pokemonName: getPokemonNameWithAffix(moveTarget), abilityName: allAbilities[this.ability].name }));
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

    globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:copiedTargetAbility", { pokemonName: getPokemonNameWithAffix(user), targetName: getPokemonNameWithAffix(target), abilityName: allAbilities[target.getAbility().id].name }));

    user.setTempAbility(target.getAbility());
    const ally = user.getAlly();

    if (this.copyToPartner && globalScene.currentBattle?.double && !isNullOrUndefined(ally) && ally.hp) { // TODO is this the best way to check that the ally is active?
      globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:copiedTargetAbility", { pokemonName: getPokemonNameWithAffix(ally), targetName: getPokemonNameWithAffix(target), abilityName: allAbilities[target.getAbility().id].name }));
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

    globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:acquiredAbility", { pokemonName: getPokemonNameWithAffix(target), abilityName: allAbilities[user.getAbility().id].name }));

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

    globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:swappedAbilitiesWithTarget", { pokemonName: getPokemonNameWithAffix(user) }));

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
 * Attribute used for moves that suppress abilities like {@linkcode MoveId.GASTRO_ACID}.
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

    globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:suppressAbilities", { pokemonName: getPokemonNameWithAffix(target) }));

    target.suppressAbility();

    globalScene.arena.triggerWeatherBasedFormChangesToNormal();

    return true;
  }

  /** Causes the effect to fail when the target's ability is unsupressable or already suppressed. */
  getCondition(): MoveConditionFunc {
    return (_user, target, _move) => !target.summonData.abilitySuppressed && (target.getAbility().isSuppressable || (target.hasPassive() && target.getPassiveAbility().isSuppressable));
  }
}

/**
 * Applies the effects of {@linkcode SuppressAbilitiesAttr} if the target has already moved this turn.
 * @extends MoveEffectAttr
 * @see {@linkcode MoveId.CORE_ENFORCER} (the move which uses this effect)
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
 * Attribute used to transform into the target on move use.
 *
 * Used for {@linkcode MoveId.TRANSFORM}.
 */
export class TransformAttr extends MoveEffectAttr {
  override apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args)) {
      return false;
    }

    globalScene.phaseManager.unshiftNew("PokemonTransformPhase", user.getBattlerIndex(), target.getBattlerIndex());
    return true;
  }

  getCondition(): MoveConditionFunc {
    return (user, target) => user.canTransformInto(target)
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

      globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:switchedStat", {
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

    globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:shiftedStats", {
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

      globalScene.phaseManager.queueMessage(i18next.t(this.msgKey, { pokemonName: getPokemonNameWithAffix(user) }));

      return true;
    }
    return false;
  }
}

export class MoneyAttr extends MoveEffectAttr {
  constructor() {
    super(true, {firstHitOnly: true });
  }

  apply(user: Pokemon, target: Pokemon, move: Move): boolean {
    globalScene.currentBattle.moneyScattered += globalScene.getWaveMoneyAmount(0.2);
    globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:coinsScatteredEverywhere"));
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
    globalScene.phaseManager.queueMessage(`${i18next.t("moveTriggers:tryingToTakeFoeDown", { pokemonName: getPokemonNameWithAffix(user) })}`);
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
      target.trySetStatus(this.effect, user);
    }
    return true;
  }
}

/**
 * Attribute to fail move usage unless all of the user's other moves have been used at least once.
 * Used by {@linkcode MoveId.LAST_RESORT}.
 */
export class LastResortAttr extends MoveAttr {
  // TODO: Verify behavior as Bulbapedia page is _extremely_ poorly documented
  getCondition(): MoveConditionFunc {
    return (user: Pokemon, _target: Pokemon, move: Move) => {
      const otherMovesInMoveset = new Set<MoveId>(user.getMoveset().map(m => m.moveId));
      if (!otherMovesInMoveset.delete(move.id) || !otherMovesInMoveset.size) {
        return false; // Last resort fails if used when not in user's moveset or no other moves exist
      }

      const movesInHistory = new Set<MoveId>(
        user.getMoveHistory()
        .filter(m => !isVirtual(m.useMode)) // Last resort ignores virtual moves
        .map(m => m.move)
      );

      // Since `Set.intersection()` is only present in ESNext, we have to do this to check inclusion
      return [...otherMovesInMoveset].every(m => movesInHistory.has(m))
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
 * Attribute to cause the target to move immediately after the user.
 *
 * Used by {@linkcode MoveId.AFTER_YOU}.
 */
export class AfterYouAttr extends MoveEffectAttr {
  /**
   * Cause the target of this move to act right after the user.
   * @param user - Unused
   * @param target - The {@linkcode Pokemon} targeted by this move
   * @param _move - Unused
   * @param _args - Unused
   * @returns `true`
   */
  override apply(user: Pokemon, target: Pokemon, _move: Move, _args: any[]): boolean {
    globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:afterYou", { targetName: getPokemonNameWithAffix(target) }));

    // Will find next acting phase of the targeted pokémon, delete it and queue it right after us.
    const targetNextPhase = globalScene.phaseManager.findPhase<MovePhase>(phase => phase.pokemon === target);
    if (targetNextPhase && globalScene.phaseManager.tryRemovePhase((phase: MovePhase) => phase.pokemon === target)) {
      globalScene.phaseManager.prependToPhase(targetNextPhase, "MovePhase");
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
   * @param move {@linkcode Move} {@linkcode MoveId.QUASH}
   * @param _args N/A
   * @returns true
   */
  override apply(user: Pokemon, target: Pokemon, _move: Move, _args: any[]): boolean {
    globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:forceLast", { targetPokemonName: getPokemonNameWithAffix(target) }));

    // TODO: Refactor this to be more readable and less janky
    const targetMovePhase = globalScene.phaseManager.findPhase<MovePhase>((phase) => phase.pokemon === target);
    if (targetMovePhase && !targetMovePhase.isForcedLast() && globalScene.phaseManager.tryRemovePhase((phase: MovePhase) => phase.pokemon === target)) {
      // Finding the phase to insert the move in front of -
      // Either the end of the turn or in front of another, slower move which has also been forced last
      const prependPhase = globalScene.phaseManager.findPhase((phase) =>
        [ MovePhase, MoveEndPhase ].every(cls => !(phase instanceof cls))
        || (phase.is("MovePhase")) && phaseForcedSlower(phase, target, !!globalScene.arena.getTag(ArenaTagType.TRICK_ROOM))
      );
      if (prependPhase) {
        globalScene.phaseManager.phaseQueue.splice(
          globalScene.phaseManager.phaseQueue.indexOf(prependPhase),
          0,
          globalScene.phaseManager.create("MovePhase", target, [ ...targetMovePhase.targets ], targetMovePhase.move, targetMovePhase.useMode, true)
        );
      }
    }
    return true;
  }
}

/**
 * Returns whether a {@linkcode MovePhase} has been forced last and the corresponding pokemon is slower than {@linkcode target}.

 * TODO:
   - Make this a class method
   - Make this look at speed order from TurnStartPhase
*/
const phaseForcedSlower = (phase: MovePhase, target: Pokemon, trickRoom: boolean): boolean => {
  let slower: boolean;
  // quashed pokemon still have speed ties
  if (phase.pokemon.getEffectiveStat(Stat.SPD) === target.getEffectiveStat(Stat.SPD)) {
    slower = !!target.randBattleSeedInt(2);
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
  // temporary workaround to prevent displaying the message during enemy command phase
  // TODO: either move this, or make the move condition func have a `simulated` param
  const simulated = globalScene.phaseManager.getCurrentPhase()?.is('EnemyCommandPhase');
  globalScene.getField(true).map(p=>applyAbAttrs("FieldPreventExplosiveMovesAbAttr", {pokemon: p, cancelled, simulated}));
  // Queue a message if an ability prevented usage of the move
  if (!simulated && cancelled.value) {
    globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:cannotUseMove", { pokemonName: getPokemonNameWithAffix(user), moveName: move.name }));
  }
  return !cancelled.value;
};

const userSleptOrComatoseCondition: MoveConditionFunc = (user) => user.status?.effect === StatusEffect.SLEEP || user.hasAbility(AbilityId.COMATOSE);

const targetSleptOrComatoseCondition: MoveConditionFunc = (_user: Pokemon, target: Pokemon, _move: Move) => target.status?.effect === StatusEffect.SLEEP || target.hasAbility(AbilityId.COMATOSE);

const failIfLastCondition: MoveConditionFunc = () => globalScene.phaseManager.findPhase(phase => phase.is("MovePhase")) !== undefined;

const failIfLastInPartyCondition: MoveConditionFunc = (user: Pokemon, target: Pokemon, move: Move) => {
  const party: Pokemon[] = user.isPlayer() ? globalScene.getPlayerParty() : globalScene.getEnemyParty();
  return party.some(pokemon => pokemon.isActive() && !pokemon.isOnField());
};

const failIfGhostTypeCondition: MoveConditionFunc = (user: Pokemon, target: Pokemon, move: Move) => !target.isOfType(PokemonType.GHOST);

const failIfNoTargetHeldItemsCondition: MoveConditionFunc = (user: Pokemon, target: Pokemon, move: Move) => target.getHeldItems().filter(i => i.isTransferable)?.length > 0;

const attackedByItemMessageFunc = (user: Pokemon, target: Pokemon, move: Move) => {
  if (isNullOrUndefined(target)) { // Fix bug when used against targets that have both fainted
    return "";
  }
  const heldItems = target.getHeldItems().filter(i => i.isTransferable);
  if (heldItems.length === 0) {
    return "";
  }
  const itemName = heldItems[0]?.type?.name ?? "item";
  const message: string = i18next.t("moveTriggers:attackedByItem", { pokemonName: getPokemonNameWithAffix(target), itemName: itemName });
  return message;
};

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

/**
 * Condition to allow a move's use only on the first turn this Pokemon is sent into battle
 * (or the start of a new wave, whichever comes first).
 */

export class FirstMoveCondition extends MoveCondition {
  constructor() {
    super((user, _target, _move) => user.tempSummonData.waveTurnCount === 1);
  }

  getUserBenefitScore(user: Pokemon, _target: Pokemon, _move: Move): number {
    return this.apply(user, _target, _move) ? 10 : -20;
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

      return targetCommand?.command === Command.FIGHT
        && !target.turnData.acted
        && !!targetCommand.move?.move
        && allMoves[targetCommand.move.move].category !== MoveCategory.STATUS
        && allMoves[targetCommand.move.move].getPriority(target) > 0;
    });
  }
}

export class HitsSameTypeAttr extends VariableMoveTypeMultiplierAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const multiplier = args[0] as NumberHolder;
    if (!user.getTypes(true).some(type => target.getTypes(true).includes(type))) {
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
 * If a move has its type changed (e.g. {@linkcode MoveId.HIDDEN_POWER}), it will check the new type.
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

    // TODO: Confirm how this interacts with status-induced failures and called moves
    const targetMove = target.getLastXMoves(1)[0]; // target's most recent move
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
    const type = validTypes[user.randBattleSeedInt(validTypes.length)];
    user.summonData.types = [ type ];
    globalScene.phaseManager.queueMessage(i18next.t("battle:transformedIntoType", { pokemonName: getPokemonNameWithAffix(user), type: toTitleCase(PokemonType[type]) }));
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
    // TODO: Does this count dancer?
    return (user, target, move) => {
      return target.getLastXMoves(-1).some(tm => tm.move !== MoveId.NONE);
    };
  }
}

/**
 * Drops the target's immunity to types it is immune to
 * and makes its evasiveness be ignored during accuracy
 * checks. Used by: {@linkcode MoveId.ODOR_SLEUTH | Odor Sleuth}, {@linkcode MoveId.MIRACLE_EYE | Miracle Eye} and {@linkcode MoveId.FORESIGHT | Foresight}
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

    globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:exposedMove", { pokemonName: getPokemonNameWithAffix(user), targetPokemonName: getPokemonNameWithAffix(target) }));

    return true;
  }
}


const unknownTypeCondition: MoveConditionFunc = (user, target, move) => !user.getTypes().includes(PokemonType.UNKNOWN);

export type MoveTargetSet = {
  targets: BattlerIndex[];
  multiple: boolean;
};

/**
 * Map of Move attributes to their respective classes. Used for instanceof checks.
 */
const MoveAttrs = Object.freeze({
  MoveEffectAttr,
  MoveHeaderAttr,
  MessageHeaderAttr,
  AddBattlerTagAttr,
  AddBattlerTagHeaderAttr,
  BeakBlastHeaderAttr,
  PreMoveMessageAttr,
  PreUseInterruptAttr,
  RespectAttackTypeImmunityAttr,
  IgnoreOpponentStatStagesAttr,
  HighCritAttr,
  CritOnlyAttr,
  FixedDamageAttr,
  UserHpDamageAttr,
  TargetHalfHpDamageAttr,
  MatchHpAttr,
  CounterDamageAttr,
  LevelDamageAttr,
  RandomLevelDamageAttr,
  ModifiedDamageAttr,
  SurviveDamageAttr,
  RecoilAttr,
  SacrificialAttr,
  SacrificialAttrOnHit,
  HalfSacrificialAttr,
  AddSubstituteAttr,
  HealAttr,
  PartyStatusCureAttr,
  FlameBurstAttr,
  SacrificialFullRestoreAttr,
  IgnoreWeatherTypeDebuffAttr,
  WeatherHealAttr,
  PlantHealAttr,
  SandHealAttr,
  BoostHealAttr,
  HealOnAllyAttr,
  HitHealAttr,
  IncrementMovePriorityAttr,
  MultiHitAttr,
  ChangeMultiHitTypeAttr,
  WaterShurikenMultiHitTypeAttr,
  StatusEffectAttr,
  MultiStatusEffectAttr,
  PsychoShiftEffectAttr,
  StealHeldItemChanceAttr,
  RemoveHeldItemAttr,
  EatBerryAttr,
  StealEatBerryAttr,
  HealStatusEffectAttr,
  BypassSleepAttr,
  BypassBurnDamageReductionAttr,
  WeatherChangeAttr,
  ClearWeatherAttr,
  TerrainChangeAttr,
  ClearTerrainAttr,
  OneHitKOAttr,
  InstantChargeAttr,
  WeatherInstantChargeAttr,
  OverrideMoveEffectAttr,
  DelayedAttackAttr,
  AwaitCombinedPledgeAttr,
  StatStageChangeAttr,
  SecretPowerAttr,
  PostVictoryStatStageChangeAttr,
  AcupressureStatStageChangeAttr,
  GrowthStatStageChangeAttr,
  CutHpStatStageBoostAttr,
  OrderUpStatBoostAttr,
  CopyStatsAttr,
  InvertStatsAttr,
  ResetStatsAttr,
  SwapStatStagesAttr,
  HpSplitAttr,
  VariablePowerAttr,
  LessPPMorePowerAttr,
  MovePowerMultiplierAttr,
  BeatUpAttr,
  DoublePowerChanceAttr,
  ConsecutiveUsePowerMultiplierAttr,
  ConsecutiveUseDoublePowerAttr,
  ConsecutiveUseMultiBasePowerAttr,
  WeightPowerAttr,
  ElectroBallPowerAttr,
  GyroBallPowerAttr,
  LowHpPowerAttr,
  CompareWeightPowerAttr,
  HpPowerAttr,
  OpponentHighHpPowerAttr,
  TurnDamagedDoublePowerAttr,
  MagnitudePowerAttr,
  AntiSunlightPowerDecreaseAttr,
  FriendshipPowerAttr,
  RageFistPowerAttr,
  PositiveStatStagePowerAttr,
  PunishmentPowerAttr,
  PresentPowerAttr,
  WaterShurikenPowerAttr,
  SpitUpPowerAttr,
  SwallowHealAttr,
  MultiHitPowerIncrementAttr,
  LastMoveDoublePowerAttr,
  CombinedPledgePowerAttr,
  CombinedPledgeStabBoostAttr,
  RoundPowerAttr,
  CueNextRoundAttr,
  StatChangeBeforeDmgCalcAttr,
  SpectralThiefAttr,
  VariableAtkAttr,
  TargetAtkUserAtkAttr,
  DefAtkAttr,
  VariableDefAttr,
  DefDefAttr,
  VariableAccuracyAttr,
  ThunderAccuracyAttr,
  StormAccuracyAttr,
  AlwaysHitMinimizeAttr,
  ToxicAccuracyAttr,
  BlizzardAccuracyAttr,
  VariableMoveCategoryAttr,
  PhotonGeyserCategoryAttr,
  TeraMoveCategoryAttr,
  TeraBlastPowerAttr,
  StatusCategoryOnAllyAttr,
  ShellSideArmCategoryAttr,
  VariableMoveTypeAttr,
  FormChangeItemTypeAttr,
  TechnoBlastTypeAttr,
  AuraWheelTypeAttr,
  RagingBullTypeAttr,
  IvyCudgelTypeAttr,
  WeatherBallTypeAttr,
  TerrainPulseTypeAttr,
  HiddenPowerTypeAttr,
  TeraBlastTypeAttr,
  TeraStarstormTypeAttr,
  MatchUserTypeAttr,
  CombinedPledgeTypeAttr,
  VariableMoveTypeMultiplierAttr,
  NeutralDamageAgainstFlyingTypeMultiplierAttr,
  IceNoEffectTypeAttr,
  FlyingTypeMultiplierAttr,
  VariableMoveTypeChartAttr,
  FreezeDryAttr,
  OneHitKOAccuracyAttr,
  SheerColdAccuracyAttr,
  MissEffectAttr,
  NoEffectAttr,
  TypelessAttr,
  BypassRedirectAttr,
  FrenzyAttr,
  SemiInvulnerableAttr,
  LeechSeedAttr,
  FallDownAttr,
  GulpMissileTagAttr,
  JawLockAttr,
  CurseAttr,
  LapseBattlerTagAttr,
  RemoveBattlerTagAttr,
  FlinchAttr,
  ConfuseAttr,
  RechargeAttr,
  TrapAttr,
  ProtectAttr,
  MessageAttr,
  RemoveAllSubstitutesAttr,
  HitsTagAttr,
  HitsTagForDoubleDamageAttr,
  AddArenaTagAttr,
  RemoveArenaTagsAttr,
  AddArenaTrapTagAttr,
  AddArenaTrapTagHitAttr,
  RemoveArenaTrapAttr,
  RemoveScreensAttr,
  SwapArenaTagsAttr,
  AddPledgeEffectAttr,
  RevivalBlessingAttr,
  ForceSwitchOutAttr,
  ChillyReceptionAttr,
  RemoveTypeAttr,
  CopyTypeAttr,
  CopyBiomeTypeAttr,
  ChangeTypeAttr,
  AddTypeAttr,
  FirstMoveTypeAttr,
  CallMoveAttr,
  RandomMoveAttr,
  RandomMovesetMoveAttr,
  NaturePowerAttr,
  CopyMoveAttr,
  RepeatMoveAttr,
  ReducePpMoveAttr,
  AttackReducePpMoveAttr,
  MovesetCopyMoveAttr,
  SketchAttr,
  AbilityChangeAttr,
  AbilityCopyAttr,
  AbilityGiveAttr,
  SwitchAbilitiesAttr,
  SuppressAbilitiesAttr,
  TransformAttr,
  SwapStatAttr,
  ShiftStatAttr,
  AverageStatsAttr,
  MoneyAttr,
  DestinyBondAttr,
  AddBattlerTagIfBoostedAttr,
  StatusIfBoostedAttr,
  LastResortAttr,
  VariableTargetAttr,
  AfterYouAttr,
  ForceLastAttr,
  HitsSameTypeAttr,
  ResistLastMoveTypeAttr,
  ExposedMoveAttr,
});

/** Map of of move attribute names to their constructors */
export type MoveAttrConstructorMap = typeof MoveAttrs;

export function initMoves() {
  allMoves.push(
    new SelfStatusMove(MoveId.NONE, PokemonType.NORMAL, MoveCategory.STATUS, -1, -1, 0, 1),
    new AttackMove(MoveId.POUND, PokemonType.NORMAL, MoveCategory.PHYSICAL, 40, 100, 35, -1, 0, 1),
    new AttackMove(MoveId.KARATE_CHOP, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 50, 100, 25, -1, 0, 1)
      .attr(HighCritAttr),
    new AttackMove(MoveId.DOUBLE_SLAP, PokemonType.NORMAL, MoveCategory.PHYSICAL, 15, 85, 10, -1, 0, 1)
      .attr(MultiHitAttr),
    new AttackMove(MoveId.COMET_PUNCH, PokemonType.NORMAL, MoveCategory.PHYSICAL, 18, 85, 15, -1, 0, 1)
      .attr(MultiHitAttr)
      .punchingMove(),
    new AttackMove(MoveId.MEGA_PUNCH, PokemonType.NORMAL, MoveCategory.PHYSICAL, 80, 85, 20, -1, 0, 1)
      .punchingMove(),
    new AttackMove(MoveId.PAY_DAY, PokemonType.NORMAL, MoveCategory.PHYSICAL, 40, 100, 20, -1, 0, 1)
      .attr(MoneyAttr)
      .makesContact(false),
    new AttackMove(MoveId.FIRE_PUNCH, PokemonType.FIRE, MoveCategory.PHYSICAL, 75, 100, 15, 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .punchingMove(),
    new AttackMove(MoveId.ICE_PUNCH, PokemonType.ICE, MoveCategory.PHYSICAL, 75, 100, 15, 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.FREEZE)
      .punchingMove(),
    new AttackMove(MoveId.THUNDER_PUNCH, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 75, 100, 15, 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .punchingMove(),
    new AttackMove(MoveId.SCRATCH, PokemonType.NORMAL, MoveCategory.PHYSICAL, 40, 100, 35, -1, 0, 1),
    new AttackMove(MoveId.VISE_GRIP, PokemonType.NORMAL, MoveCategory.PHYSICAL, 55, 100, 30, -1, 0, 1),
    new AttackMove(MoveId.GUILLOTINE, PokemonType.NORMAL, MoveCategory.PHYSICAL, 250, 30, 5, -1, 0, 1)
      .attr(OneHitKOAttr)
      .attr(OneHitKOAccuracyAttr),
    new ChargingAttackMove(MoveId.RAZOR_WIND, PokemonType.NORMAL, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 1)
      .chargeText(i18next.t("moveTriggers:whippedUpAWhirlwind", { pokemonName: "{USER}" }))
      .attr(HighCritAttr)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new SelfStatusMove(MoveId.SWORDS_DANCE, PokemonType.NORMAL, -1, 20, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.ATK ], 2, true)
      .danceMove(),
    new AttackMove(MoveId.CUT, PokemonType.NORMAL, MoveCategory.PHYSICAL, 50, 95, 30, -1, 0, 1)
      .slicingMove(),
    new AttackMove(MoveId.GUST, PokemonType.FLYING, MoveCategory.SPECIAL, 40, 100, 35, -1, 0, 1)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.FLYING)
      .windMove(),
    new AttackMove(MoveId.WING_ATTACK, PokemonType.FLYING, MoveCategory.PHYSICAL, 60, 100, 35, -1, 0, 1),
    new StatusMove(MoveId.WHIRLWIND, PokemonType.NORMAL, -1, 20, -1, -6, 1)
      .attr(ForceSwitchOutAttr, false, SwitchType.FORCE_SWITCH)
      .ignoresSubstitute()
      .hidesTarget()
      .windMove()
      .reflectable(),
    new ChargingAttackMove(MoveId.FLY, PokemonType.FLYING, MoveCategory.PHYSICAL, 90, 95, 15, -1, 0, 1)
      .chargeText(i18next.t("moveTriggers:flewUpHigh", { pokemonName: "{USER}" }))
      .chargeAttr(SemiInvulnerableAttr, BattlerTagType.FLYING)
      .condition(failOnGravityCondition),
    new AttackMove(MoveId.BIND, PokemonType.NORMAL, MoveCategory.PHYSICAL, 15, 85, 20, -1, 0, 1)
      .attr(TrapAttr, BattlerTagType.BIND),
    new AttackMove(MoveId.SLAM, PokemonType.NORMAL, MoveCategory.PHYSICAL, 80, 75, 20, -1, 0, 1),
    new AttackMove(MoveId.VINE_WHIP, PokemonType.GRASS, MoveCategory.PHYSICAL, 45, 100, 25, -1, 0, 1),
    new AttackMove(MoveId.STOMP, PokemonType.NORMAL, MoveCategory.PHYSICAL, 65, 100, 20, 30, 0, 1)
      .attr(AlwaysHitMinimizeAttr)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.MINIMIZED)
      .attr(FlinchAttr),
    new AttackMove(MoveId.DOUBLE_KICK, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 30, 100, 30, -1, 0, 1)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(MoveId.MEGA_KICK, PokemonType.NORMAL, MoveCategory.PHYSICAL, 120, 75, 5, -1, 0, 1),
    new AttackMove(MoveId.JUMP_KICK, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 100, 95, 10, -1, 0, 1)
      .attr(MissEffectAttr, crashDamageFunc)
      .attr(NoEffectAttr, crashDamageFunc)
      .condition(failOnGravityCondition)
      .recklessMove(),
    new AttackMove(MoveId.ROLLING_KICK, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 60, 85, 15, 30, 0, 1)
      .attr(FlinchAttr),
    new StatusMove(MoveId.SAND_ATTACK, PokemonType.GROUND, 100, 15, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.ACC ], -1)
      .reflectable(),
    new AttackMove(MoveId.HEADBUTT, PokemonType.NORMAL, MoveCategory.PHYSICAL, 70, 100, 15, 30, 0, 1)
      .attr(FlinchAttr),
    new AttackMove(MoveId.HORN_ATTACK, PokemonType.NORMAL, MoveCategory.PHYSICAL, 65, 100, 25, -1, 0, 1),
    new AttackMove(MoveId.FURY_ATTACK, PokemonType.NORMAL, MoveCategory.PHYSICAL, 15, 85, 20, -1, 0, 1)
      .attr(MultiHitAttr),
    new AttackMove(MoveId.HORN_DRILL, PokemonType.NORMAL, MoveCategory.PHYSICAL, 250, 30, 5, -1, 0, 1)
      .attr(OneHitKOAttr)
      .attr(OneHitKOAccuracyAttr),
    new AttackMove(MoveId.TACKLE, PokemonType.NORMAL, MoveCategory.PHYSICAL, 40, 100, 35, -1, 0, 1),
    new AttackMove(MoveId.BODY_SLAM, PokemonType.NORMAL, MoveCategory.PHYSICAL, 85, 100, 15, 30, 0, 1)
      .attr(AlwaysHitMinimizeAttr)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.MINIMIZED)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(MoveId.WRAP, PokemonType.NORMAL, MoveCategory.PHYSICAL, 15, 90, 20, -1, 0, 1)
      .attr(TrapAttr, BattlerTagType.WRAP),
    new AttackMove(MoveId.TAKE_DOWN, PokemonType.NORMAL, MoveCategory.PHYSICAL, 90, 85, 20, -1, 0, 1)
      .attr(RecoilAttr)
      .recklessMove(),
    new AttackMove(MoveId.THRASH, PokemonType.NORMAL, MoveCategory.PHYSICAL, 120, 100, 10, -1, 0, 1)
      .attr(FrenzyAttr)
      .attr(MissEffectAttr, frenzyMissFunc)
      .attr(NoEffectAttr, frenzyMissFunc)
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new AttackMove(MoveId.DOUBLE_EDGE, PokemonType.NORMAL, MoveCategory.PHYSICAL, 120, 100, 15, -1, 0, 1)
      .attr(RecoilAttr, false, 0.33)
      .recklessMove(),
    new StatusMove(MoveId.TAIL_WHIP, PokemonType.NORMAL, 100, 30, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .reflectable(),
    new AttackMove(MoveId.POISON_STING, PokemonType.POISON, MoveCategory.PHYSICAL, 15, 100, 35, 30, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .makesContact(false),
    new AttackMove(MoveId.TWINEEDLE, PokemonType.BUG, MoveCategory.PHYSICAL, 25, 100, 20, 20, 0, 1)
      .attr(MultiHitAttr, MultiHitType._2)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .makesContact(false),
    new AttackMove(MoveId.PIN_MISSILE, PokemonType.BUG, MoveCategory.PHYSICAL, 25, 95, 20, -1, 0, 1)
      .attr(MultiHitAttr)
      .makesContact(false),
    new StatusMove(MoveId.LEER, PokemonType.NORMAL, 100, 30, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .reflectable(),
    new AttackMove(MoveId.BITE, PokemonType.DARK, MoveCategory.PHYSICAL, 60, 100, 25, 30, 0, 1)
      .attr(FlinchAttr)
      .bitingMove(),
    new StatusMove(MoveId.GROWL, PokemonType.NORMAL, 100, 40, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .reflectable(),
    new StatusMove(MoveId.ROAR, PokemonType.NORMAL, -1, 20, -1, -6, 1)
      .attr(ForceSwitchOutAttr, false, SwitchType.FORCE_SWITCH)
      .soundBased()
      .hidesTarget()
      .reflectable(),
    new StatusMove(MoveId.SING, PokemonType.NORMAL, 55, 15, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .soundBased()
      .reflectable(),
    new StatusMove(MoveId.SUPERSONIC, PokemonType.NORMAL, 55, 20, -1, 0, 1)
      .attr(ConfuseAttr)
      .soundBased()
      .reflectable(),
    new AttackMove(MoveId.SONIC_BOOM, PokemonType.NORMAL, MoveCategory.SPECIAL, -1, 90, 20, -1, 0, 1)
      .attr(FixedDamageAttr, 20),
    new StatusMove(MoveId.DISABLE, PokemonType.NORMAL, 100, 20, -1, 0, 1)
      .attr(AddBattlerTagAttr, BattlerTagType.DISABLED, false, true)
      .condition((_user, target, _move) => {
        const lastNonVirtualMove = target.getLastNonVirtualMove();
        return !isNullOrUndefined(lastNonVirtualMove) && lastNonVirtualMove.move !== MoveId.STRUGGLE;
      })
      .ignoresSubstitute()
      .reflectable(),
    new AttackMove(MoveId.ACID, PokemonType.POISON, MoveCategory.SPECIAL, 40, 100, 30, 10, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.EMBER, PokemonType.FIRE, MoveCategory.SPECIAL, 40, 100, 25, 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(MoveId.FLAMETHROWER, PokemonType.FIRE, MoveCategory.SPECIAL, 90, 100, 15, 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new StatusMove(MoveId.MIST, PokemonType.ICE, -1, 30, -1, 0, 1)
      .attr(AddArenaTagAttr, ArenaTagType.MIST, 5, true)
      .target(MoveTarget.USER_SIDE),
    new AttackMove(MoveId.WATER_GUN, PokemonType.WATER, MoveCategory.SPECIAL, 40, 100, 25, -1, 0, 1),
    new AttackMove(MoveId.HYDRO_PUMP, PokemonType.WATER, MoveCategory.SPECIAL, 110, 80, 5, -1, 0, 1),
    new AttackMove(MoveId.SURF, PokemonType.WATER, MoveCategory.SPECIAL, 90, 100, 15, -1, 0, 1)
      .target(MoveTarget.ALL_NEAR_OTHERS)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.UNDERWATER)
      .attr(GulpMissileTagAttr),
    new AttackMove(MoveId.ICE_BEAM, PokemonType.ICE, MoveCategory.SPECIAL, 90, 100, 10, 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.FREEZE),
    new AttackMove(MoveId.BLIZZARD, PokemonType.ICE, MoveCategory.SPECIAL, 110, 70, 5, 10, 0, 1)
      .attr(BlizzardAccuracyAttr)
      .attr(StatusEffectAttr, StatusEffect.FREEZE)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.PSYBEAM, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 65, 100, 20, 10, 0, 1)
      .attr(ConfuseAttr),
    new AttackMove(MoveId.BUBBLE_BEAM, PokemonType.WATER, MoveCategory.SPECIAL, 65, 100, 20, 10, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1),
    new AttackMove(MoveId.AURORA_BEAM, PokemonType.ICE, MoveCategory.SPECIAL, 65, 100, 20, 10, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1),
    new AttackMove(MoveId.HYPER_BEAM, PokemonType.NORMAL, MoveCategory.SPECIAL, 150, 90, 5, -1, 0, 1)
      .attr(RechargeAttr),
    new AttackMove(MoveId.PECK, PokemonType.FLYING, MoveCategory.PHYSICAL, 35, 100, 35, -1, 0, 1),
    new AttackMove(MoveId.DRILL_PECK, PokemonType.FLYING, MoveCategory.PHYSICAL, 80, 100, 20, -1, 0, 1),
    new AttackMove(MoveId.SUBMISSION, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 80, 80, 20, -1, 0, 1)
      .attr(RecoilAttr)
      .recklessMove(),
    new AttackMove(MoveId.LOW_KICK, PokemonType.FIGHTING, MoveCategory.PHYSICAL, -1, 100, 20, -1, 0, 1)
      .attr(WeightPowerAttr),
    new AttackMove(MoveId.COUNTER, PokemonType.FIGHTING, MoveCategory.PHYSICAL, -1, 100, 20, -1, -5, 1)
      .attr(CounterDamageAttr, (move: Move) => move.category === MoveCategory.PHYSICAL, 2)
      .target(MoveTarget.ATTACKER),
    new AttackMove(MoveId.SEISMIC_TOSS, PokemonType.FIGHTING, MoveCategory.PHYSICAL, -1, 100, 20, -1, 0, 1)
      .attr(LevelDamageAttr),
    new AttackMove(MoveId.STRENGTH, PokemonType.NORMAL, MoveCategory.PHYSICAL, 80, 100, 15, -1, 0, 1),
    new AttackMove(MoveId.ABSORB, PokemonType.GRASS, MoveCategory.SPECIAL, 20, 100, 25, -1, 0, 1)
      .attr(HitHealAttr)
      .triageMove(),
    new AttackMove(MoveId.MEGA_DRAIN, PokemonType.GRASS, MoveCategory.SPECIAL, 40, 100, 15, -1, 0, 1)
      .attr(HitHealAttr)
      .triageMove(),
    new StatusMove(MoveId.LEECH_SEED, PokemonType.GRASS, 90, 10, -1, 0, 1)
      .attr(LeechSeedAttr)
      .condition((user, target, move) => !target.getTag(BattlerTagType.SEEDED) && !target.isOfType(PokemonType.GRASS))
      .reflectable(),
    new SelfStatusMove(MoveId.GROWTH, PokemonType.NORMAL, -1, 20, -1, 0, 1)
      .attr(GrowthStatStageChangeAttr),
    new AttackMove(MoveId.RAZOR_LEAF, PokemonType.GRASS, MoveCategory.PHYSICAL, 55, 95, 25, -1, 0, 1)
      .attr(HighCritAttr)
      .makesContact(false)
      .slicingMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new ChargingAttackMove(MoveId.SOLAR_BEAM, PokemonType.GRASS, MoveCategory.SPECIAL, 120, 100, 10, -1, 0, 1)
      .chargeText(i18next.t("moveTriggers:tookInSunlight", { pokemonName: "{USER}" }))
      .chargeAttr(WeatherInstantChargeAttr, [ WeatherType.SUNNY, WeatherType.HARSH_SUN ])
      .attr(AntiSunlightPowerDecreaseAttr),
    new StatusMove(MoveId.POISON_POWDER, PokemonType.POISON, 75, 35, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .powderMove()
      .reflectable(),
    new StatusMove(MoveId.STUN_SPORE, PokemonType.GRASS, 75, 30, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .powderMove()
      .reflectable(),
    new StatusMove(MoveId.SLEEP_POWDER, PokemonType.GRASS, 75, 15, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .powderMove()
      .reflectable(),
    new AttackMove(MoveId.PETAL_DANCE, PokemonType.GRASS, MoveCategory.SPECIAL, 120, 100, 10, -1, 0, 1)
      .attr(FrenzyAttr)
      .attr(MissEffectAttr, frenzyMissFunc)
      .attr(NoEffectAttr, frenzyMissFunc)
      .makesContact()
      .danceMove()
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new StatusMove(MoveId.STRING_SHOT, PokemonType.BUG, 95, 40, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -2)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .reflectable(),
    new AttackMove(MoveId.DRAGON_RAGE, PokemonType.DRAGON, MoveCategory.SPECIAL, -1, 100, 10, -1, 0, 1)
      .attr(FixedDamageAttr, 40),
    new AttackMove(MoveId.FIRE_SPIN, PokemonType.FIRE, MoveCategory.SPECIAL, 35, 85, 15, -1, 0, 1)
      .attr(TrapAttr, BattlerTagType.FIRE_SPIN),
    new AttackMove(MoveId.THUNDER_SHOCK, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 40, 100, 30, 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(MoveId.THUNDERBOLT, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 90, 100, 15, 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new StatusMove(MoveId.THUNDER_WAVE, PokemonType.ELECTRIC, 90, 20, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .attr(RespectAttackTypeImmunityAttr)
      .reflectable(),
    new AttackMove(MoveId.THUNDER, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 110, 70, 10, 30, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .attr(ThunderAccuracyAttr)
      .attr(HitsTagAttr, BattlerTagType.FLYING),
    new AttackMove(MoveId.ROCK_THROW, PokemonType.ROCK, MoveCategory.PHYSICAL, 50, 90, 15, -1, 0, 1)
      .makesContact(false),
    new AttackMove(MoveId.EARTHQUAKE, PokemonType.GROUND, MoveCategory.PHYSICAL, 100, 100, 10, -1, 0, 1)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.UNDERGROUND)
      .attr(MovePowerMultiplierAttr, (user, target, move) => globalScene.arena.getTerrainType() === TerrainType.GRASSY && target.isGrounded() ? 0.5 : 1)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(MoveId.FISSURE, PokemonType.GROUND, MoveCategory.PHYSICAL, 250, 30, 5, -1, 0, 1)
      .attr(OneHitKOAttr)
      .attr(OneHitKOAccuracyAttr)
      .attr(HitsTagAttr, BattlerTagType.UNDERGROUND)
      .makesContact(false),
    new ChargingAttackMove(MoveId.DIG, PokemonType.GROUND, MoveCategory.PHYSICAL, 80, 100, 10, -1, 0, 1)
      .chargeText(i18next.t("moveTriggers:dugAHole", { pokemonName: "{USER}" }))
      .chargeAttr(SemiInvulnerableAttr, BattlerTagType.UNDERGROUND),
    new StatusMove(MoveId.TOXIC, PokemonType.POISON, 90, 10, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.TOXIC)
      .attr(ToxicAccuracyAttr)
      .reflectable(),
    new AttackMove(MoveId.CONFUSION, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 50, 100, 25, 10, 0, 1)
      .attr(ConfuseAttr),
    new AttackMove(MoveId.PSYCHIC, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 90, 100, 10, 10, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -1),
    new StatusMove(MoveId.HYPNOSIS, PokemonType.PSYCHIC, 60, 20, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .reflectable(),
    new SelfStatusMove(MoveId.MEDITATE, PokemonType.PSYCHIC, -1, 40, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.ATK ], 1, true),
    new SelfStatusMove(MoveId.AGILITY, PokemonType.PSYCHIC, -1, 30, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.SPD ], 2, true),
    new AttackMove(MoveId.QUICK_ATTACK, PokemonType.NORMAL, MoveCategory.PHYSICAL, 40, 100, 30, -1, 1, 1),
    new AttackMove(MoveId.RAGE, PokemonType.NORMAL, MoveCategory.PHYSICAL, 20, 100, 20, -1, 0, 1)
      .partial(), // No effect implemented
    new SelfStatusMove(MoveId.TELEPORT, PokemonType.PSYCHIC, -1, 20, -1, -6, 1)
      .attr(ForceSwitchOutAttr, true)
      .hidesUser(),
    new AttackMove(MoveId.NIGHT_SHADE, PokemonType.GHOST, MoveCategory.SPECIAL, -1, 100, 15, -1, 0, 1)
      .attr(LevelDamageAttr),
    new StatusMove(MoveId.MIMIC, PokemonType.NORMAL, -1, 10, -1, 0, 1)
      .attr(MovesetCopyMoveAttr)
      .ignoresSubstitute(),
    new StatusMove(MoveId.SCREECH, PokemonType.NORMAL, 85, 40, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -2)
      .soundBased()
      .reflectable(),
    new SelfStatusMove(MoveId.DOUBLE_TEAM, PokemonType.NORMAL, -1, 15, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.EVA ], 1, true),
    new SelfStatusMove(MoveId.RECOVER, PokemonType.NORMAL, -1, 5, -1, 0, 1)
      .attr(HealAttr, 0.5)
      .triageMove(),
    new SelfStatusMove(MoveId.HARDEN, PokemonType.NORMAL, -1, 30, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 1, true),
    new SelfStatusMove(MoveId.MINIMIZE, PokemonType.NORMAL, -1, 10, -1, 0, 1)
      .attr(AddBattlerTagAttr, BattlerTagType.MINIMIZED, true, false)
      .attr(StatStageChangeAttr, [ Stat.EVA ], 2, true),
    new StatusMove(MoveId.SMOKESCREEN, PokemonType.NORMAL, 100, 20, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.ACC ], -1)
      .reflectable(),
    new StatusMove(MoveId.CONFUSE_RAY, PokemonType.GHOST, 100, 10, -1, 0, 1)
      .attr(ConfuseAttr)
      .reflectable(),
    new SelfStatusMove(MoveId.WITHDRAW, PokemonType.WATER, -1, 40, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 1, true),
    new SelfStatusMove(MoveId.DEFENSE_CURL, PokemonType.NORMAL, -1, 40, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 1, true),
    new SelfStatusMove(MoveId.BARRIER, PokemonType.PSYCHIC, -1, 20, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 2, true),
    new StatusMove(MoveId.LIGHT_SCREEN, PokemonType.PSYCHIC, -1, 30, -1, 0, 1)
      .attr(AddArenaTagAttr, ArenaTagType.LIGHT_SCREEN, 5, true)
      .target(MoveTarget.USER_SIDE),
    new SelfStatusMove(MoveId.HAZE, PokemonType.ICE, -1, 30, -1, 0, 1)
      .ignoresSubstitute()
      .attr(ResetStatsAttr, true),
    new StatusMove(MoveId.REFLECT, PokemonType.PSYCHIC, -1, 20, -1, 0, 1)
      .attr(AddArenaTagAttr, ArenaTagType.REFLECT, 5, true)
      .target(MoveTarget.USER_SIDE),
    new SelfStatusMove(MoveId.FOCUS_ENERGY, PokemonType.NORMAL, -1, 30, -1, 0, 1)
      .attr(AddBattlerTagAttr, BattlerTagType.CRIT_BOOST, true, true)
      // TODO: Remove once dragon cheer & focus energy are merged into 1 tag
      .condition((_user, target) => !target.getTag(BattlerTagType.DRAGON_CHEER)),
    new AttackMove(MoveId.BIDE, PokemonType.NORMAL, MoveCategory.PHYSICAL, -1, -1, 10, -1, 1, 1)
      .target(MoveTarget.USER)
      .unimplemented(),
    new SelfStatusMove(MoveId.METRONOME, PokemonType.NORMAL, -1, 10, -1, 0, 1)
      .attr(RandomMoveAttr, invalidMetronomeMoves),
    new StatusMove(MoveId.MIRROR_MOVE, PokemonType.FLYING, -1, 20, -1, 0, 1)
      .attr(CopyMoveAttr, true, invalidMirrorMoveMoves),
    new AttackMove(MoveId.SELF_DESTRUCT, PokemonType.NORMAL, MoveCategory.PHYSICAL, 200, 100, 5, -1, 0, 1)
      .attr(SacrificialAttr)
      .makesContact(false)
      .condition(failIfDampCondition)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(MoveId.EGG_BOMB, PokemonType.NORMAL, MoveCategory.PHYSICAL, 100, 75, 10, -1, 0, 1)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(MoveId.LICK, PokemonType.GHOST, MoveCategory.PHYSICAL, 30, 100, 30, 30, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(MoveId.SMOG, PokemonType.POISON, MoveCategory.SPECIAL, 30, 70, 20, 40, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(MoveId.SLUDGE, PokemonType.POISON, MoveCategory.SPECIAL, 65, 100, 20, 30, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(MoveId.BONE_CLUB, PokemonType.GROUND, MoveCategory.PHYSICAL, 65, 85, 20, 10, 0, 1)
      .attr(FlinchAttr)
      .makesContact(false),
    new AttackMove(MoveId.FIRE_BLAST, PokemonType.FIRE, MoveCategory.SPECIAL, 110, 85, 5, 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(MoveId.WATERFALL, PokemonType.WATER, MoveCategory.PHYSICAL, 80, 100, 15, 20, 0, 1)
      .attr(FlinchAttr),
    new AttackMove(MoveId.CLAMP, PokemonType.WATER, MoveCategory.PHYSICAL, 35, 85, 15, -1, 0, 1)
      .attr(TrapAttr, BattlerTagType.CLAMP),
    new AttackMove(MoveId.SWIFT, PokemonType.NORMAL, MoveCategory.SPECIAL, 60, -1, 20, -1, 0, 1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new ChargingAttackMove(MoveId.SKULL_BASH, PokemonType.NORMAL, MoveCategory.PHYSICAL, 130, 100, 10, -1, 0, 1)
      .chargeText(i18next.t("moveTriggers:loweredItsHead", { pokemonName: "{USER}" }))
      .chargeAttr(StatStageChangeAttr, [ Stat.DEF ], 1, true),
    new AttackMove(MoveId.SPIKE_CANNON, PokemonType.NORMAL, MoveCategory.PHYSICAL, 20, 100, 15, -1, 0, 1)
      .attr(MultiHitAttr)
      .makesContact(false),
    new AttackMove(MoveId.CONSTRICT, PokemonType.NORMAL, MoveCategory.PHYSICAL, 10, 100, 35, 10, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1),
    new SelfStatusMove(MoveId.AMNESIA, PokemonType.PSYCHIC, -1, 20, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], 2, true),
    new StatusMove(MoveId.KINESIS, PokemonType.PSYCHIC, 80, 15, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.ACC ], -1)
      .reflectable(),
    new SelfStatusMove(MoveId.SOFT_BOILED, PokemonType.NORMAL, -1, 5, -1, 0, 1)
      .attr(HealAttr, 0.5)
      .triageMove(),
    new AttackMove(MoveId.HIGH_JUMP_KICK, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 130, 90, 10, -1, 0, 1)
      .attr(MissEffectAttr, crashDamageFunc)
      .attr(NoEffectAttr, crashDamageFunc)
      .condition(failOnGravityCondition)
      .recklessMove(),
    new StatusMove(MoveId.GLARE, PokemonType.NORMAL, 100, 30, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .reflectable(),
    new AttackMove(MoveId.DREAM_EATER, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 100, 100, 15, -1, 0, 1)
      .attr(HitHealAttr)
      .condition(targetSleptOrComatoseCondition)
      .triageMove(),
    new StatusMove(MoveId.POISON_GAS, PokemonType.POISON, 90, 40, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .reflectable(),
    new AttackMove(MoveId.BARRAGE, PokemonType.NORMAL, MoveCategory.PHYSICAL, 15, 85, 20, -1, 0, 1)
      .attr(MultiHitAttr)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(MoveId.LEECH_LIFE, PokemonType.BUG, MoveCategory.PHYSICAL, 80, 100, 10, -1, 0, 1)
      .attr(HitHealAttr)
      .triageMove(),
    new StatusMove(MoveId.LOVELY_KISS, PokemonType.NORMAL, 75, 10, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .reflectable(),
    new ChargingAttackMove(MoveId.SKY_ATTACK, PokemonType.FLYING, MoveCategory.PHYSICAL, 140, 90, 5, 30, 0, 1)
      .chargeText(i18next.t("moveTriggers:isGlowing", { pokemonName: "{USER}" }))
      .attr(HighCritAttr)
      .attr(FlinchAttr)
      .makesContact(false),
    new StatusMove(MoveId.TRANSFORM, PokemonType.NORMAL, -1, 10, -1, 0, 1)
      .attr(TransformAttr)
      .ignoresProtect()
      /* Transform:
       * Does not copy the target's rage fist hit count
       * Does not copy the target's volatile status conditions (ie BattlerTags)
       * Renders user typeless when copying typeless opponent (should revert to original typing)
      */
      .edgeCase(),
    new AttackMove(MoveId.BUBBLE, PokemonType.WATER, MoveCategory.SPECIAL, 40, 100, 30, 10, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.DIZZY_PUNCH, PokemonType.NORMAL, MoveCategory.PHYSICAL, 70, 100, 10, 20, 0, 1)
      .attr(ConfuseAttr)
      .punchingMove(),
    new StatusMove(MoveId.SPORE, PokemonType.GRASS, 100, 15, -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .powderMove()
      .reflectable(),
    new StatusMove(MoveId.FLASH, PokemonType.NORMAL, 100, 20, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.ACC ], -1)
      .reflectable(),
    new AttackMove(MoveId.PSYWAVE, PokemonType.PSYCHIC, MoveCategory.SPECIAL, -1, 100, 15, -1, 0, 1)
      .attr(RandomLevelDamageAttr),
    new SelfStatusMove(MoveId.SPLASH, PokemonType.NORMAL, -1, 40, -1, 0, 1)
      .attr(MessageAttr, i18next.t("moveTriggers:splash"))
      .condition(failOnGravityCondition),
    new SelfStatusMove(MoveId.ACID_ARMOR, PokemonType.POISON, -1, 20, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 2, true),
    new AttackMove(MoveId.CRABHAMMER, PokemonType.WATER, MoveCategory.PHYSICAL, 100, 90, 10, -1, 0, 1)
      .attr(HighCritAttr),
    new AttackMove(MoveId.EXPLOSION, PokemonType.NORMAL, MoveCategory.PHYSICAL, 250, 100, 5, -1, 0, 1)
      .condition(failIfDampCondition)
      .attr(SacrificialAttr)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(MoveId.FURY_SWIPES, PokemonType.NORMAL, MoveCategory.PHYSICAL, 18, 80, 15, -1, 0, 1)
      .attr(MultiHitAttr),
    new AttackMove(MoveId.BONEMERANG, PokemonType.GROUND, MoveCategory.PHYSICAL, 50, 90, 10, -1, 0, 1)
      .attr(MultiHitAttr, MultiHitType._2)
      .makesContact(false),
    new SelfStatusMove(MoveId.REST, PokemonType.PSYCHIC, -1, 5, -1, 0, 1)
      .attr(RestAttr, 3)
      .triageMove(),
    new AttackMove(MoveId.ROCK_SLIDE, PokemonType.ROCK, MoveCategory.PHYSICAL, 75, 90, 10, 30, 0, 1)
      .attr(FlinchAttr)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.HYPER_FANG, PokemonType.NORMAL, MoveCategory.PHYSICAL, 80, 90, 15, 10, 0, 1)
      .attr(FlinchAttr)
      .bitingMove(),
    new SelfStatusMove(MoveId.SHARPEN, PokemonType.NORMAL, -1, 30, -1, 0, 1)
      .attr(StatStageChangeAttr, [ Stat.ATK ], 1, true),
    new SelfStatusMove(MoveId.CONVERSION, PokemonType.NORMAL, -1, 30, -1, 0, 1)
      .attr(FirstMoveTypeAttr),
    new AttackMove(MoveId.TRI_ATTACK, PokemonType.NORMAL, MoveCategory.SPECIAL, 80, 100, 10, 20, 0, 1)
      .attr(MultiStatusEffectAttr, [ StatusEffect.BURN, StatusEffect.FREEZE, StatusEffect.PARALYSIS ]),
    new AttackMove(MoveId.SUPER_FANG, PokemonType.NORMAL, MoveCategory.PHYSICAL, -1, 90, 10, -1, 0, 1)
      .attr(TargetHalfHpDamageAttr),
    new AttackMove(MoveId.SLASH, PokemonType.NORMAL, MoveCategory.PHYSICAL, 70, 100, 20, -1, 0, 1)
      .attr(HighCritAttr)
      .slicingMove(),
    new SelfStatusMove(MoveId.SUBSTITUTE, PokemonType.NORMAL, -1, 10, -1, 0, 1)
      .attr(AddSubstituteAttr, 0.25, false),
    new AttackMove(MoveId.STRUGGLE, PokemonType.NORMAL, MoveCategory.PHYSICAL, 50, -1, 1, -1, 0, 1)
      .attr(RecoilAttr, true, 0.25, true)
      .attr(TypelessAttr)
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new StatusMove(MoveId.SKETCH, PokemonType.NORMAL, -1, 1, -1, 0, 2)
      .ignoresSubstitute()
      .attr(SketchAttr),
    new AttackMove(MoveId.TRIPLE_KICK, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 10, 90, 10, -1, 0, 2)
      .attr(MultiHitAttr, MultiHitType._3)
      .attr(MultiHitPowerIncrementAttr, 3)
      .checkAllHits(),
    new AttackMove(MoveId.THIEF, PokemonType.DARK, MoveCategory.PHYSICAL, 60, 100, 25, -1, 0, 2)
      .attr(StealHeldItemChanceAttr, 0.3)
      .edgeCase(),
      // Should not be able to steal held item if user faints due to Rough Skin, Iron Barbs, etc.
      // Should be able to steal items from pokemon with Sticky Hold if the damage causes them to faint
    new StatusMove(MoveId.SPIDER_WEB, PokemonType.BUG, -1, 10, -1, 0, 2)
      .condition(failIfGhostTypeCondition)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, true, 1)
      .reflectable(),
    new StatusMove(MoveId.MIND_READER, PokemonType.NORMAL, -1, 5, -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.IGNORE_ACCURACY, true, false, 2)
      .attr(MessageAttr, (user, target) =>
        i18next.t("moveTriggers:tookAimAtTarget", { pokemonName: getPokemonNameWithAffix(user), targetName: getPokemonNameWithAffix(target) })
      ),
    new StatusMove(MoveId.NIGHTMARE, PokemonType.GHOST, 100, 15, -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.NIGHTMARE)
      .condition(targetSleptOrComatoseCondition),
    new AttackMove(MoveId.FLAME_WHEEL, PokemonType.FIRE, MoveCategory.PHYSICAL, 60, 100, 25, 10, 0, 2)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(MoveId.SNORE, PokemonType.NORMAL, MoveCategory.SPECIAL, 50, 100, 15, 30, 0, 2)
      .attr(BypassSleepAttr)
      .attr(FlinchAttr)
      .condition(userSleptOrComatoseCondition)
      .soundBased(),
    new StatusMove(MoveId.CURSE, PokemonType.GHOST, -1, 10, -1, 0, 2)
      .attr(CurseAttr)
      .ignoresSubstitute()
      .ignoresProtect()
      .target(MoveTarget.CURSE),
    new AttackMove(MoveId.FLAIL, PokemonType.NORMAL, MoveCategory.PHYSICAL, -1, 100, 15, -1, 0, 2)
      .attr(LowHpPowerAttr),
    new StatusMove(MoveId.CONVERSION_2, PokemonType.NORMAL, -1, 30, -1, 0, 2)
      .attr(ResistLastMoveTypeAttr)
      .ignoresSubstitute()
      .partial(), // Checks the move's original typing and not if its type is changed through some other means
    new AttackMove(MoveId.AEROBLAST, PokemonType.FLYING, MoveCategory.SPECIAL, 100, 95, 5, -1, 0, 2)
      .windMove()
      .attr(HighCritAttr),
    new StatusMove(MoveId.COTTON_SPORE, PokemonType.GRASS, 100, 40, -1, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -2)
      .powderMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .reflectable(),
    new AttackMove(MoveId.REVERSAL, PokemonType.FIGHTING, MoveCategory.PHYSICAL, -1, 100, 15, -1, 0, 2)
      .attr(LowHpPowerAttr),
    new StatusMove(MoveId.SPITE, PokemonType.GHOST, 100, 10, -1, 0, 2)
      .ignoresSubstitute()
      .attr(ReducePpMoveAttr, 4)
      .reflectable(),
    new AttackMove(MoveId.POWDER_SNOW, PokemonType.ICE, MoveCategory.SPECIAL, 40, 100, 25, 10, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.FREEZE)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new SelfStatusMove(MoveId.PROTECT, PokemonType.NORMAL, -1, 10, -1, 4, 2)
      .attr(ProtectAttr)
      .condition(failIfLastCondition),
    new AttackMove(MoveId.MACH_PUNCH, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 40, 100, 30, -1, 1, 2)
      .punchingMove(),
    new StatusMove(MoveId.SCARY_FACE, PokemonType.NORMAL, 100, 10, -1, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -2)
      .reflectable(),
    new AttackMove(MoveId.FEINT_ATTACK, PokemonType.DARK, MoveCategory.PHYSICAL, 60, -1, 20, -1, 0, 2),
    new StatusMove(MoveId.SWEET_KISS, PokemonType.FAIRY, 75, 10, -1, 0, 2)
      .attr(ConfuseAttr)
      .reflectable(),
    new SelfStatusMove(MoveId.BELLY_DRUM, PokemonType.NORMAL, -1, 10, -1, 0, 2)
      .attr(CutHpStatStageBoostAttr, [ Stat.ATK ], 12, 2, (user) => {
        globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:cutOwnHpAndMaximizedStat", { pokemonName: getPokemonNameWithAffix(user), statName: i18next.t(getStatKey(Stat.ATK)) }));
      }),
    new AttackMove(MoveId.SLUDGE_BOMB, PokemonType.POISON, MoveCategory.SPECIAL, 90, 100, 10, 30, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .ballBombMove(),
    new AttackMove(MoveId.MUD_SLAP, PokemonType.GROUND, MoveCategory.SPECIAL, 20, 100, 10, 100, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.ACC ], -1),
    new AttackMove(MoveId.OCTAZOOKA, PokemonType.WATER, MoveCategory.SPECIAL, 65, 85, 10, 50, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.ACC ], -1)
      .ballBombMove(),
    new StatusMove(MoveId.SPIKES, PokemonType.GROUND, -1, 20, -1, 0, 2)
      .attr(AddArenaTrapTagAttr, ArenaTagType.SPIKES)
      .target(MoveTarget.ENEMY_SIDE)
      .reflectable(),
    new AttackMove(MoveId.ZAP_CANNON, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 120, 50, 5, 100, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .ballBombMove(),
    new StatusMove(MoveId.FORESIGHT, PokemonType.NORMAL, -1, 40, -1, 0, 2)
      .attr(ExposedMoveAttr, BattlerTagType.IGNORE_GHOST)
      .ignoresSubstitute()
      .reflectable(),
    new SelfStatusMove(MoveId.DESTINY_BOND, PokemonType.GHOST, -1, 5, -1, 0, 2)
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
    new StatusMove(MoveId.PERISH_SONG, PokemonType.NORMAL, -1, 5, -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.PERISH_SONG, false, true, 4)
      .attr(MessageAttr, (_user, target) =>
         i18next.t("moveTriggers:faintCountdown", { pokemonName: getPokemonNameWithAffix(target), turnCount: 3 }))
      .ignoresProtect()
      .soundBased()
      .condition(failOnBossCondition)
      .target(MoveTarget.ALL),
    new AttackMove(MoveId.ICY_WIND, PokemonType.ICE, MoveCategory.SPECIAL, 55, 95, 15, 100, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new SelfStatusMove(MoveId.DETECT, PokemonType.FIGHTING, -1, 5, -1, 4, 2)
      .attr(ProtectAttr)
      .condition(failIfLastCondition),
    new AttackMove(MoveId.BONE_RUSH, PokemonType.GROUND, MoveCategory.PHYSICAL, 25, 90, 10, -1, 0, 2)
      .attr(MultiHitAttr)
      .makesContact(false),
    new StatusMove(MoveId.LOCK_ON, PokemonType.NORMAL, -1, 5, -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.IGNORE_ACCURACY, true, false, 2)
      .attr(MessageAttr, (user, target) =>
        i18next.t("moveTriggers:tookAimAtTarget", { pokemonName: getPokemonNameWithAffix(user), targetName: getPokemonNameWithAffix(target) })
      ),
    new AttackMove(MoveId.OUTRAGE, PokemonType.DRAGON, MoveCategory.PHYSICAL, 120, 100, 10, -1, 0, 2)
      .attr(FrenzyAttr)
      .attr(MissEffectAttr, frenzyMissFunc)
      .attr(NoEffectAttr, frenzyMissFunc)
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new StatusMove(MoveId.SANDSTORM, PokemonType.ROCK, -1, 10, -1, 0, 2)
      .attr(WeatherChangeAttr, WeatherType.SANDSTORM)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(MoveId.GIGA_DRAIN, PokemonType.GRASS, MoveCategory.SPECIAL, 75, 100, 10, -1, 0, 2)
      .attr(HitHealAttr)
      .triageMove(),
    new SelfStatusMove(MoveId.ENDURE, PokemonType.NORMAL, -1, 10, -1, 4, 2)
      .attr(ProtectAttr, BattlerTagType.ENDURING)
      .condition(failIfLastCondition),
    new StatusMove(MoveId.CHARM, PokemonType.FAIRY, 100, 20, -1, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -2)
      .reflectable(),
    new AttackMove(MoveId.ROLLOUT, PokemonType.ROCK, MoveCategory.PHYSICAL, 30, 90, 20, -1, 0, 2)
      .partial() // Does not lock the user, also does not increase damage properly
      .attr(ConsecutiveUseDoublePowerAttr, 5, true, true, MoveId.DEFENSE_CURL),
    new AttackMove(MoveId.FALSE_SWIPE, PokemonType.NORMAL, MoveCategory.PHYSICAL, 40, 100, 40, -1, 0, 2)
      .attr(SurviveDamageAttr),
    new StatusMove(MoveId.SWAGGER, PokemonType.NORMAL, 85, 15, -1, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.ATK ], 2)
      .attr(ConfuseAttr)
      .reflectable(),
    new SelfStatusMove(MoveId.MILK_DRINK, PokemonType.NORMAL, -1, 5, -1, 0, 2)
      .attr(HealAttr, 0.5)
      .triageMove(),
    new AttackMove(MoveId.SPARK, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 65, 100, 20, 30, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(MoveId.FURY_CUTTER, PokemonType.BUG, MoveCategory.PHYSICAL, 40, 95, 20, -1, 0, 2)
      .attr(ConsecutiveUseDoublePowerAttr, 3, true)
      .slicingMove(),
    new AttackMove(MoveId.STEEL_WING, PokemonType.STEEL, MoveCategory.PHYSICAL, 70, 90, 25, 10, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 1, true),
    new StatusMove(MoveId.MEAN_LOOK, PokemonType.NORMAL, -1, 5, -1, 0, 2)
      .condition(failIfGhostTypeCondition)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, true, 1)
      .reflectable(),
    new StatusMove(MoveId.ATTRACT, PokemonType.NORMAL, 100, 15, -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.INFATUATED)
      .ignoresSubstitute()
      .condition((user, target, move) => user.isOppositeGender(target))
      .reflectable(),
    new SelfStatusMove(MoveId.SLEEP_TALK, PokemonType.NORMAL, -1, 10, -1, 0, 2)
      .attr(BypassSleepAttr)
      .attr(RandomMovesetMoveAttr, invalidSleepTalkMoves, false)
      .condition(userSleptOrComatoseCondition)
      .target(MoveTarget.NEAR_ENEMY),
    new StatusMove(MoveId.HEAL_BELL, PokemonType.NORMAL, -1, 5, -1, 0, 2)
      .attr(PartyStatusCureAttr, i18next.t("moveTriggers:bellChimed"), AbilityId.SOUNDPROOF)
      .soundBased()
      .target(MoveTarget.PARTY),
    new AttackMove(MoveId.RETURN, PokemonType.NORMAL, MoveCategory.PHYSICAL, -1, 100, 20, -1, 0, 2)
      .attr(FriendshipPowerAttr),
    new AttackMove(MoveId.PRESENT, PokemonType.NORMAL, MoveCategory.PHYSICAL, -1, 90, 15, -1, 0, 2)
      .attr(PresentPowerAttr)
      .makesContact(false),
    new AttackMove(MoveId.FRUSTRATION, PokemonType.NORMAL, MoveCategory.PHYSICAL, -1, 100, 20, -1, 0, 2)
      .attr(FriendshipPowerAttr, true),
    new StatusMove(MoveId.SAFEGUARD, PokemonType.NORMAL, -1, 25, -1, 0, 2)
      .target(MoveTarget.USER_SIDE)
      .attr(AddArenaTagAttr, ArenaTagType.SAFEGUARD, 5, true, true),
    new StatusMove(MoveId.PAIN_SPLIT, PokemonType.NORMAL, -1, 20, -1, 0, 2)
      .attr(HpSplitAttr)
      .condition(failOnBossCondition),
    new AttackMove(MoveId.SACRED_FIRE, PokemonType.FIRE, MoveCategory.PHYSICAL, 100, 95, 5, 50, 0, 2)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .makesContact(false),
    new AttackMove(MoveId.MAGNITUDE, PokemonType.GROUND, MoveCategory.PHYSICAL, -1, 100, 30, -1, 0, 2)
      .attr(PreMoveMessageAttr, magnitudeMessageFunc)
      .attr(MagnitudePowerAttr)
      .attr(MovePowerMultiplierAttr, (user, target, move) => globalScene.arena.getTerrainType() === TerrainType.GRASSY && target.isGrounded() ? 0.5 : 1)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.UNDERGROUND)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(MoveId.DYNAMIC_PUNCH, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 100, 50, 5, 100, 0, 2)
      .attr(ConfuseAttr)
      .punchingMove(),
    new AttackMove(MoveId.MEGAHORN, PokemonType.BUG, MoveCategory.PHYSICAL, 120, 85, 10, -1, 0, 2),
    new AttackMove(MoveId.DRAGON_BREATH, PokemonType.DRAGON, MoveCategory.SPECIAL, 60, 100, 20, 30, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new SelfStatusMove(MoveId.BATON_PASS, PokemonType.NORMAL, -1, 40, -1, 0, 2)
      .attr(ForceSwitchOutAttr, true, SwitchType.BATON_PASS)
      .condition(failIfLastInPartyCondition)
      .hidesUser(),
    new StatusMove(MoveId.ENCORE, PokemonType.NORMAL, 100, 5, -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.ENCORE, false, true)
      .ignoresSubstitute()
      .condition((user, target, move) => new EncoreTag(user.id).canAdd(target))
      .reflectable()
      // Can lock infinitely into struggle; has incorrect interactions with Blood Moon/Gigaton Hammer
      // Also may or may not incorrectly select targets for replacement move (needs verification)
      .edgeCase(),
    new AttackMove(MoveId.PURSUIT, PokemonType.DARK, MoveCategory.PHYSICAL, 40, 100, 20, -1, 0, 2)
      .partial(), // No effect implemented
    new AttackMove(MoveId.RAPID_SPIN, PokemonType.NORMAL, MoveCategory.PHYSICAL, 50, 100, 40, 100, 0, 2)
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
    new StatusMove(MoveId.SWEET_SCENT, PokemonType.NORMAL, 100, 20, -1, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.EVA ], -2)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .reflectable(),
    new AttackMove(MoveId.IRON_TAIL, PokemonType.STEEL, MoveCategory.PHYSICAL, 100, 75, 15, 30, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1),
    new AttackMove(MoveId.METAL_CLAW, PokemonType.STEEL, MoveCategory.PHYSICAL, 50, 95, 35, 10, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.ATK ], 1, true),
    new AttackMove(MoveId.VITAL_THROW, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 70, -1, 10, -1, -1, 2),
    new SelfStatusMove(MoveId.MORNING_SUN, PokemonType.NORMAL, -1, 5, -1, 0, 2)
      .attr(PlantHealAttr)
      .triageMove(),
    new SelfStatusMove(MoveId.SYNTHESIS, PokemonType.GRASS, -1, 5, -1, 0, 2)
      .attr(PlantHealAttr)
      .triageMove(),
    new SelfStatusMove(MoveId.MOONLIGHT, PokemonType.FAIRY, -1, 5, -1, 0, 2)
      .attr(PlantHealAttr)
      .triageMove(),
    new AttackMove(MoveId.HIDDEN_POWER, PokemonType.NORMAL, MoveCategory.SPECIAL, 60, 100, 15, -1, 0, 2)
      .attr(HiddenPowerTypeAttr),
    new AttackMove(MoveId.CROSS_CHOP, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 100, 80, 5, -1, 0, 2)
      .attr(HighCritAttr),
    new AttackMove(MoveId.TWISTER, PokemonType.DRAGON, MoveCategory.SPECIAL, 40, 100, 20, 20, 0, 2)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.FLYING)
      .attr(FlinchAttr)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(MoveId.RAIN_DANCE, PokemonType.WATER, -1, 5, -1, 0, 2)
      .attr(WeatherChangeAttr, WeatherType.RAIN)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(MoveId.SUNNY_DAY, PokemonType.FIRE, -1, 5, -1, 0, 2)
      .attr(WeatherChangeAttr, WeatherType.SUNNY)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(MoveId.CRUNCH, PokemonType.DARK, MoveCategory.PHYSICAL, 80, 100, 15, 20, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1)
      .bitingMove(),
    new AttackMove(MoveId.MIRROR_COAT, PokemonType.PSYCHIC, MoveCategory.SPECIAL, -1, 100, 20, -1, -5, 2)
      .attr(CounterDamageAttr, (move: Move) => move.category === MoveCategory.SPECIAL, 2)
      .target(MoveTarget.ATTACKER),
    new StatusMove(MoveId.PSYCH_UP, PokemonType.NORMAL, -1, 10, -1, 0, 2)
      .ignoresSubstitute()
      .attr(CopyStatsAttr),
    new AttackMove(MoveId.EXTREME_SPEED, PokemonType.NORMAL, MoveCategory.PHYSICAL, 80, 100, 5, -1, 2, 2),
    new AttackMove(MoveId.ANCIENT_POWER, PokemonType.ROCK, MoveCategory.SPECIAL, 60, 100, 5, 10, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD ], 1, true),
    new AttackMove(MoveId.SHADOW_BALL, PokemonType.GHOST, MoveCategory.SPECIAL, 80, 100, 15, 20, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -1)
      .ballBombMove(),
    new AttackMove(MoveId.FUTURE_SIGHT, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 120, 100, 10, -1, 0, 2)
      .attr(DelayedAttackAttr, ChargeAnim.FUTURE_SIGHT_CHARGING, "moveTriggers:foresawAnAttack")
      .ignoresProtect()
      /*
       * Should not apply abilities or held items if user is off the field
       */
      .edgeCase(),
    new AttackMove(MoveId.ROCK_SMASH, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 40, 100, 15, 50, 0, 2)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1),
    new AttackMove(MoveId.WHIRLPOOL, PokemonType.WATER, MoveCategory.SPECIAL, 35, 85, 15, -1, 0, 2)
      .attr(TrapAttr, BattlerTagType.WHIRLPOOL)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.UNDERWATER),
    new AttackMove(MoveId.BEAT_UP, PokemonType.DARK, MoveCategory.PHYSICAL, -1, 100, 10, -1, 0, 2)
      .attr(MultiHitAttr, MultiHitType.BEAT_UP)
      .attr(BeatUpAttr)
      .makesContact(false),
    new AttackMove(MoveId.FAKE_OUT, PokemonType.NORMAL, MoveCategory.PHYSICAL, 40, 100, 10, 100, 3, 3)
      .attr(FlinchAttr)
      .condition(new FirstMoveCondition()),
    new AttackMove(MoveId.UPROAR, PokemonType.NORMAL, MoveCategory.SPECIAL, 90, 100, 10, -1, 0, 3)
      .soundBased()
      .target(MoveTarget.RANDOM_NEAR_ENEMY)
      .partial(), // Does not lock the user, does not stop Pokemon from sleeping
      // Likely can make use of FrenzyAttr and an ArenaTag (just without the FrenzyMissFunc)
    new SelfStatusMove(MoveId.STOCKPILE, PokemonType.NORMAL, -1, 20, -1, 0, 3)
      .condition(user => (user.getTag(StockpilingTag)?.stockpiledCount ?? 0) < 3)
      .attr(AddBattlerTagAttr, BattlerTagType.STOCKPILING, true),
    new AttackMove(MoveId.SPIT_UP, PokemonType.NORMAL, MoveCategory.SPECIAL, -1, 100, 10, -1, 0, 3)
      .attr(SpitUpPowerAttr, 100)
      .condition(hasStockpileStacksCondition)
      .attr(RemoveBattlerTagAttr, [ BattlerTagType.STOCKPILING ], true),
    new SelfStatusMove(MoveId.SWALLOW, PokemonType.NORMAL, -1, 10, -1, 0, 3)
      .attr(SwallowHealAttr)
      .condition(hasStockpileStacksCondition)
      .attr(RemoveBattlerTagAttr, [ BattlerTagType.STOCKPILING ], true)
      .triageMove()
      // TODO: Verify if using Swallow at full HP still consumes stacks or not
      .edgeCase(),
    new AttackMove(MoveId.HEAT_WAVE, PokemonType.FIRE, MoveCategory.SPECIAL, 95, 90, 10, 10, 0, 3)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(MoveId.HAIL, PokemonType.ICE, -1, 10, -1, 0, 3)
      .attr(WeatherChangeAttr, WeatherType.HAIL)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(MoveId.TORMENT, PokemonType.DARK, 100, 15, -1, 0, 3)
      .ignoresSubstitute()
      .edgeCase() // Incomplete implementation because of Uproar's partial implementation
      .attr(AddBattlerTagAttr, BattlerTagType.TORMENT, false, true, 1)
      .reflectable(),
    new StatusMove(MoveId.FLATTER, PokemonType.DARK, 100, 15, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], 1)
      .attr(ConfuseAttr)
      .reflectable(),
    new StatusMove(MoveId.WILL_O_WISP, PokemonType.FIRE, 85, 15, -1, 0, 3)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .reflectable(),
    new StatusMove(MoveId.MEMENTO, PokemonType.DARK, 100, 10, -1, 0, 3)
      .attr(SacrificialAttrOnHit)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPATK ], -2),
    new AttackMove(MoveId.FACADE, PokemonType.NORMAL, MoveCategory.PHYSICAL, 70, 100, 20, -1, 0, 3)
      .attr(MovePowerMultiplierAttr, (user, target, move) => user.status
        && (user.status.effect === StatusEffect.BURN || user.status.effect === StatusEffect.POISON || user.status.effect === StatusEffect.TOXIC || user.status.effect === StatusEffect.PARALYSIS) ? 2 : 1)
      .attr(BypassBurnDamageReductionAttr),
    new AttackMove(MoveId.FOCUS_PUNCH, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 150, 100, 20, -1, -3, 3)
      .attr(MessageHeaderAttr, (user) => i18next.t("moveTriggers:isTighteningFocus", { pokemonName: getPokemonNameWithAffix(user) }))
      .attr(PreUseInterruptAttr, (user) => i18next.t("moveTriggers:lostFocus", { pokemonName: getPokemonNameWithAffix(user) }), user => user.turnData.attacksReceived.some(r => r.damage > 0))
      .punchingMove(),
    new AttackMove(MoveId.SMELLING_SALTS, PokemonType.NORMAL, MoveCategory.PHYSICAL, 70, 100, 10, -1, 0, 3)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.status?.effect === StatusEffect.PARALYSIS ? 2 : 1)
      .attr(HealStatusEffectAttr, true, StatusEffect.PARALYSIS),
    new SelfStatusMove(MoveId.FOLLOW_ME, PokemonType.NORMAL, -1, 20, -1, 2, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.CENTER_OF_ATTENTION, true),
    new StatusMove(MoveId.NATURE_POWER, PokemonType.NORMAL, -1, 20, -1, 0, 3)
      .attr(NaturePowerAttr),
    new SelfStatusMove(MoveId.CHARGE, PokemonType.ELECTRIC, -1, 20, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], 1, true)
      .attr(AddBattlerTagAttr, BattlerTagType.CHARGED, true, false),
    new StatusMove(MoveId.TAUNT, PokemonType.DARK, 100, 20, -1, 0, 3)
      .ignoresSubstitute()
      .attr(AddBattlerTagAttr, BattlerTagType.TAUNT, false, true, 4)
      .reflectable(),
    new StatusMove(MoveId.HELPING_HAND, PokemonType.NORMAL, -1, 20, -1, 5, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.HELPING_HAND)
      .ignoresSubstitute()
      .target(MoveTarget.NEAR_ALLY)
      .condition(failIfSingleBattle)
      // should stack multiplicatively if used multiple times in 1 turn
      .edgeCase(),
    new StatusMove(MoveId.TRICK, PokemonType.PSYCHIC, 100, 10, -1, 0, 3)
      .unimplemented(),
    new StatusMove(MoveId.ROLE_PLAY, PokemonType.PSYCHIC, -1, 10, -1, 0, 3)
      .ignoresSubstitute()
      .attr(AbilityCopyAttr),
    new SelfStatusMove(MoveId.WISH, PokemonType.NORMAL, -1, 10, -1, 0, 3)
      .attr(WishAttr)
      .triageMove(),
    new SelfStatusMove(MoveId.ASSIST, PokemonType.NORMAL, -1, 20, -1, 0, 3)
      .attr(RandomMovesetMoveAttr, invalidAssistMoves, true),
    new SelfStatusMove(MoveId.INGRAIN, PokemonType.GRASS, -1, 20, -1, 0, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.INGRAIN, true, true)
      .attr(AddBattlerTagAttr, BattlerTagType.IGNORE_FLYING, true, true)
      .attr(RemoveBattlerTagAttr, [ BattlerTagType.FLOATING ], true),
    new AttackMove(MoveId.SUPERPOWER, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 120, 100, 5, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF ], -1, true),
    new SelfStatusMove(MoveId.MAGIC_COAT, PokemonType.PSYCHIC, -1, 15, -1, 4, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.MAGIC_COAT, true, true, 0)
      .condition(failIfLastCondition)
      // Interactions with stomping tantrum, instruct, and other moves that
      // rely on move history
      // Also will not reflect roar / whirlwind if the target has ForceSwitchOutImmunityAbAttr
      .edgeCase(),
    new SelfStatusMove(MoveId.RECYCLE, PokemonType.NORMAL, -1, 10, -1, 0, 3)
      .unimplemented(),
    new AttackMove(MoveId.REVENGE, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 60, 100, 10, -1, -4, 3)
      .attr(TurnDamagedDoublePowerAttr),
    new AttackMove(MoveId.BRICK_BREAK, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 75, 100, 15, -1, 0, 3)
      .attr(RemoveScreensAttr),
    new StatusMove(MoveId.YAWN, PokemonType.NORMAL, -1, 10, -1, 0, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.DROWSY, false, true)
      .condition((user, target, move) => !target.status && !target.isSafeguarded(user))
      .reflectable(),
    new AttackMove(MoveId.KNOCK_OFF, PokemonType.DARK, MoveCategory.PHYSICAL, 65, 100, 20, -1, 0, 3)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.getHeldItems().filter(i => i.isTransferable).length > 0 ? 1.5 : 1)
      .attr(RemoveHeldItemAttr, false)
      .edgeCase(),
      // Should not be able to remove held item if user faints due to Rough Skin, Iron Barbs, etc.
      // Should be able to remove items from pokemon with Sticky Hold if the damage causes them to faint
    new AttackMove(MoveId.ENDEAVOR, PokemonType.NORMAL, MoveCategory.PHYSICAL, -1, 100, 5, -1, 0, 3)
      .attr(MatchHpAttr)
      .condition(failOnBossCondition),
    new AttackMove(MoveId.ERUPTION, PokemonType.FIRE, MoveCategory.SPECIAL, 150, 100, 5, -1, 0, 3)
      .attr(HpPowerAttr)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(MoveId.SKILL_SWAP, PokemonType.PSYCHIC, -1, 10, -1, 0, 3)
      .ignoresSubstitute()
      .attr(SwitchAbilitiesAttr),
    new StatusMove(MoveId.IMPRISON, PokemonType.PSYCHIC, 100, 10, -1, 0, 3)
      .ignoresSubstitute()
      .attr(AddArenaTagAttr, ArenaTagType.IMPRISON, 1, true, false)
      .target(MoveTarget.ENEMY_SIDE),
    new SelfStatusMove(MoveId.REFRESH, PokemonType.NORMAL, -1, 20, -1, 0, 3)
      .attr(HealStatusEffectAttr, true, [ StatusEffect.PARALYSIS, StatusEffect.POISON, StatusEffect.TOXIC, StatusEffect.BURN ])
      .condition((user, target, move) => !!user.status && (user.status.effect === StatusEffect.PARALYSIS || user.status.effect === StatusEffect.POISON || user.status.effect === StatusEffect.TOXIC || user.status.effect === StatusEffect.BURN)),
    new SelfStatusMove(MoveId.GRUDGE, PokemonType.GHOST, -1, 5, -1, 0, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.GRUDGE, true, undefined, 1),
    new SelfStatusMove(MoveId.SNATCH, PokemonType.DARK, -1, 10, -1, 4, 3)
      .unimplemented(),
    new AttackMove(MoveId.SECRET_POWER, PokemonType.NORMAL, MoveCategory.PHYSICAL, 70, 100, 20, 30, 0, 3)
      .makesContact(false)
      .attr(SecretPowerAttr),
    new ChargingAttackMove(MoveId.DIVE, PokemonType.WATER, MoveCategory.PHYSICAL, 80, 100, 10, -1, 0, 3)
      .chargeText(i18next.t("moveTriggers:hidUnderwater", { pokemonName: "{USER}" }))
      .chargeAttr(SemiInvulnerableAttr, BattlerTagType.UNDERWATER)
      .chargeAttr(GulpMissileTagAttr),
    new AttackMove(MoveId.ARM_THRUST, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 15, 100, 20, -1, 0, 3)
      .attr(MultiHitAttr),
    new SelfStatusMove(MoveId.CAMOUFLAGE, PokemonType.NORMAL, -1, 20, -1, 0, 3)
      .attr(CopyBiomeTypeAttr),
    new SelfStatusMove(MoveId.TAIL_GLOW, PokemonType.BUG, -1, 20, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], 3, true),
    new AttackMove(MoveId.LUSTER_PURGE, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 95, 100, 5, 50, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -1),
    new AttackMove(MoveId.MIST_BALL, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 95, 100, 5, 50, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -1)
      .ballBombMove(),
    new StatusMove(MoveId.FEATHER_DANCE, PokemonType.FLYING, 100, 15, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -2)
      .danceMove()
      .reflectable(),
    new StatusMove(MoveId.TEETER_DANCE, PokemonType.NORMAL, 100, 20, -1, 0, 3)
      .attr(ConfuseAttr)
      .danceMove()
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(MoveId.BLAZE_KICK, PokemonType.FIRE, MoveCategory.PHYSICAL, 85, 90, 10, 10, 0, 3)
      .attr(HighCritAttr)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new StatusMove(MoveId.MUD_SPORT, PokemonType.GROUND, -1, 15, -1, 0, 3)
      .ignoresProtect()
      .attr(AddArenaTagAttr, ArenaTagType.MUD_SPORT, 5)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(MoveId.ICE_BALL, PokemonType.ICE, MoveCategory.PHYSICAL, 30, 90, 20, -1, 0, 3)
      .partial() // Does not lock the user properly, does not increase damage correctly
      .attr(ConsecutiveUseDoublePowerAttr, 5, true, true, MoveId.DEFENSE_CURL)
      .ballBombMove(),
    new AttackMove(MoveId.NEEDLE_ARM, PokemonType.GRASS, MoveCategory.PHYSICAL, 60, 100, 15, 30, 0, 3)
      .attr(FlinchAttr),
    new SelfStatusMove(MoveId.SLACK_OFF, PokemonType.NORMAL, -1, 5, -1, 0, 3)
      .attr(HealAttr, 0.5)
      .triageMove(),
    new AttackMove(MoveId.HYPER_VOICE, PokemonType.NORMAL, MoveCategory.SPECIAL, 90, 100, 10, -1, 0, 3)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.POISON_FANG, PokemonType.POISON, MoveCategory.PHYSICAL, 50, 100, 15, 50, 0, 3)
      .attr(StatusEffectAttr, StatusEffect.TOXIC)
      .bitingMove(),
    new AttackMove(MoveId.CRUSH_CLAW, PokemonType.NORMAL, MoveCategory.PHYSICAL, 75, 95, 10, 50, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1),
    new AttackMove(MoveId.BLAST_BURN, PokemonType.FIRE, MoveCategory.SPECIAL, 150, 90, 5, -1, 0, 3)
      .attr(RechargeAttr),
    new AttackMove(MoveId.HYDRO_CANNON, PokemonType.WATER, MoveCategory.SPECIAL, 150, 90, 5, -1, 0, 3)
      .attr(RechargeAttr),
    new AttackMove(MoveId.METEOR_MASH, PokemonType.STEEL, MoveCategory.PHYSICAL, 90, 90, 10, 20, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.ATK ], 1, true)
      .punchingMove(),
    new AttackMove(MoveId.ASTONISH, PokemonType.GHOST, MoveCategory.PHYSICAL, 30, 100, 15, 30, 0, 3)
      .attr(FlinchAttr),
    new AttackMove(MoveId.WEATHER_BALL, PokemonType.NORMAL, MoveCategory.SPECIAL, 50, 100, 10, -1, 0, 3)
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
    new StatusMove(MoveId.AROMATHERAPY, PokemonType.GRASS, -1, 5, -1, 0, 3)
      .attr(PartyStatusCureAttr, i18next.t("moveTriggers:soothingAromaWaftedThroughArea"), AbilityId.SAP_SIPPER)
      .target(MoveTarget.PARTY),
    new StatusMove(MoveId.FAKE_TEARS, PokemonType.DARK, 100, 20, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -2)
      .reflectable(),
    new AttackMove(MoveId.AIR_CUTTER, PokemonType.FLYING, MoveCategory.SPECIAL, 60, 95, 25, -1, 0, 3)
      .attr(HighCritAttr)
      .slicingMove()
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.OVERHEAT, PokemonType.FIRE, MoveCategory.SPECIAL, 130, 90, 5, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -2, true)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE),
    new StatusMove(MoveId.ODOR_SLEUTH, PokemonType.NORMAL, -1, 40, -1, 0, 3)
      .attr(ExposedMoveAttr, BattlerTagType.IGNORE_GHOST)
      .ignoresSubstitute()
      .reflectable(),
    new AttackMove(MoveId.ROCK_TOMB, PokemonType.ROCK, MoveCategory.PHYSICAL, 60, 95, 15, 100, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1)
      .makesContact(false),
    new AttackMove(MoveId.SILVER_WIND, PokemonType.BUG, MoveCategory.SPECIAL, 60, 100, 5, 10, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD ], 1, true)
      .windMove(),
    new StatusMove(MoveId.METAL_SOUND, PokemonType.STEEL, 85, 40, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -2)
      .soundBased()
      .reflectable(),
    new StatusMove(MoveId.GRASS_WHISTLE, PokemonType.GRASS, 55, 15, -1, 0, 3)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .soundBased()
      .reflectable(),
    new StatusMove(MoveId.TICKLE, PokemonType.NORMAL, 100, 20, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF ], -1)
      .reflectable(),
    new SelfStatusMove(MoveId.COSMIC_POWER, PokemonType.PSYCHIC, -1, 20, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.DEF, Stat.SPDEF ], 1, true),
    new AttackMove(MoveId.WATER_SPOUT, PokemonType.WATER, MoveCategory.SPECIAL, 150, 100, 5, -1, 0, 3)
      .attr(HpPowerAttr)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.SIGNAL_BEAM, PokemonType.BUG, MoveCategory.SPECIAL, 75, 100, 15, 10, 0, 3)
      .attr(ConfuseAttr),
    new AttackMove(MoveId.SHADOW_PUNCH, PokemonType.GHOST, MoveCategory.PHYSICAL, 60, -1, 20, -1, 0, 3)
      .punchingMove(),
    new AttackMove(MoveId.EXTRASENSORY, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 20, 10, 0, 3)
      .attr(FlinchAttr),
    new AttackMove(MoveId.SKY_UPPERCUT, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 85, 90, 15, -1, 0, 3)
      .attr(HitsTagAttr, BattlerTagType.FLYING)
      .punchingMove(),
    new AttackMove(MoveId.SAND_TOMB, PokemonType.GROUND, MoveCategory.PHYSICAL, 35, 85, 15, -1, 0, 3)
      .attr(TrapAttr, BattlerTagType.SAND_TOMB)
      .makesContact(false),
    new AttackMove(MoveId.SHEER_COLD, PokemonType.ICE, MoveCategory.SPECIAL, 250, 30, 5, -1, 0, 3)
      .attr(IceNoEffectTypeAttr)
      .attr(OneHitKOAttr)
      .attr(SheerColdAccuracyAttr),
    new AttackMove(MoveId.MUDDY_WATER, PokemonType.WATER, MoveCategory.SPECIAL, 90, 85, 10, 30, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.ACC ], -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.BULLET_SEED, PokemonType.GRASS, MoveCategory.PHYSICAL, 25, 100, 30, -1, 0, 3)
      .attr(MultiHitAttr)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(MoveId.AERIAL_ACE, PokemonType.FLYING, MoveCategory.PHYSICAL, 60, -1, 20, -1, 0, 3)
      .slicingMove(),
    new AttackMove(MoveId.ICICLE_SPEAR, PokemonType.ICE, MoveCategory.PHYSICAL, 25, 100, 30, -1, 0, 3)
      .attr(MultiHitAttr)
      .makesContact(false),
    new SelfStatusMove(MoveId.IRON_DEFENSE, PokemonType.STEEL, -1, 15, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 2, true),
    new StatusMove(MoveId.BLOCK, PokemonType.NORMAL, -1, 5, -1, 0, 3)
      .condition(failIfGhostTypeCondition)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, true, 1)
      .reflectable(),
    new StatusMove(MoveId.HOWL, PokemonType.NORMAL, -1, 40, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.ATK ], 1)
      .soundBased()
      .target(MoveTarget.USER_AND_ALLIES),
    new AttackMove(MoveId.DRAGON_CLAW, PokemonType.DRAGON, MoveCategory.PHYSICAL, 80, 100, 15, -1, 0, 3),
    new AttackMove(MoveId.FRENZY_PLANT, PokemonType.GRASS, MoveCategory.SPECIAL, 150, 90, 5, -1, 0, 3)
      .attr(RechargeAttr),
    new SelfStatusMove(MoveId.BULK_UP, PokemonType.FIGHTING, -1, 20, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF ], 1, true),
    new ChargingAttackMove(MoveId.BOUNCE, PokemonType.FLYING, MoveCategory.PHYSICAL, 85, 85, 5, 30, 0, 3)
      .chargeText(i18next.t("moveTriggers:sprangUp", { pokemonName: "{USER}" }))
      .chargeAttr(SemiInvulnerableAttr, BattlerTagType.FLYING)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .condition(failOnGravityCondition),
    new AttackMove(MoveId.MUD_SHOT, PokemonType.GROUND, MoveCategory.SPECIAL, 55, 95, 15, 100, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1),
    new AttackMove(MoveId.POISON_TAIL, PokemonType.POISON, MoveCategory.PHYSICAL, 50, 100, 25, 10, 0, 3)
      .attr(HighCritAttr)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(MoveId.COVET, PokemonType.NORMAL, MoveCategory.PHYSICAL, 60, 100, 25, -1, 0, 3)
      .attr(StealHeldItemChanceAttr, 0.3)
      .edgeCase(),
      // Should not be able to steal held item if user faints due to Rough Skin, Iron Barbs, etc.
      // Should be able to steal items from pokemon with Sticky Hold if the damage causes them to faint
    new AttackMove(MoveId.VOLT_TACKLE, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 120, 100, 15, 10, 0, 3)
      .attr(RecoilAttr, false, 0.33)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .recklessMove(),
    new AttackMove(MoveId.MAGICAL_LEAF, PokemonType.GRASS, MoveCategory.SPECIAL, 60, -1, 20, -1, 0, 3),
    new StatusMove(MoveId.WATER_SPORT, PokemonType.WATER, -1, 15, -1, 0, 3)
      .ignoresProtect()
      .attr(AddArenaTagAttr, ArenaTagType.WATER_SPORT, 5)
      .target(MoveTarget.BOTH_SIDES),
    new SelfStatusMove(MoveId.CALM_MIND, PokemonType.PSYCHIC, -1, 20, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPATK, Stat.SPDEF ], 1, true),
    new AttackMove(MoveId.LEAF_BLADE, PokemonType.GRASS, MoveCategory.PHYSICAL, 90, 100, 15, -1, 0, 3)
      .attr(HighCritAttr)
      .slicingMove(),
    new SelfStatusMove(MoveId.DRAGON_DANCE, PokemonType.DRAGON, -1, 20, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPD ], 1, true)
      .danceMove(),
    new AttackMove(MoveId.ROCK_BLAST, PokemonType.ROCK, MoveCategory.PHYSICAL, 25, 90, 10, -1, 0, 3)
      .attr(MultiHitAttr)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(MoveId.SHOCK_WAVE, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 60, -1, 20, -1, 0, 3),
    new AttackMove(MoveId.WATER_PULSE, PokemonType.WATER, MoveCategory.SPECIAL, 60, 100, 20, 20, 0, 3)
      .attr(ConfuseAttr)
      .pulseMove(),
    new AttackMove(MoveId.DOOM_DESIRE, PokemonType.STEEL, MoveCategory.SPECIAL, 140, 100, 5, -1, 0, 3)
      .attr(DelayedAttackAttr, ChargeAnim.DOOM_DESIRE_CHARGING, "moveTriggers:choseDoomDesireAsDestiny")
      .ignoresProtect()
      /*
       * Should not apply abilities or held items if user is off the field
      */
      .edgeCase(),
    new AttackMove(MoveId.PSYCHO_BOOST, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 140, 90, 5, -1, 0, 3)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -2, true),
    new SelfStatusMove(MoveId.ROOST, PokemonType.FLYING, -1, 5, -1, 0, 4)
      .attr(HealAttr, 0.5)
      .attr(AddBattlerTagAttr, BattlerTagType.ROOSTED, true, false)
      .triageMove(),
    new StatusMove(MoveId.GRAVITY, PokemonType.PSYCHIC, -1, 5, -1, 0, 4)
      .ignoresProtect()
      .attr(AddArenaTagAttr, ArenaTagType.GRAVITY, 5)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(MoveId.MIRACLE_EYE, PokemonType.PSYCHIC, -1, 40, -1, 0, 4)
      .attr(ExposedMoveAttr, BattlerTagType.IGNORE_DARK)
      .ignoresSubstitute()
      .reflectable(),
    new AttackMove(MoveId.WAKE_UP_SLAP, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 70, 100, 10, -1, 0, 4)
      .attr(MovePowerMultiplierAttr, (user, target, move) => targetSleptOrComatoseCondition(user, target, move) ? 2 : 1)
      .attr(HealStatusEffectAttr, false, StatusEffect.SLEEP),
    new AttackMove(MoveId.HAMMER_ARM, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 100, 90, 10, -1, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1, true)
      .punchingMove(),
    new AttackMove(MoveId.GYRO_BALL, PokemonType.STEEL, MoveCategory.PHYSICAL, -1, 100, 5, -1, 0, 4)
      .attr(GyroBallPowerAttr)
      .ballBombMove(),
    new SelfStatusMove(MoveId.HEALING_WISH, PokemonType.PSYCHIC, -1, 10, -1, 0, 4)
      .attr(SacrificialFullRestoreAttr, false, "moveTriggers:sacrificialFullRestore")
      .triageMove()
      .condition(failIfLastInPartyCondition),
    new AttackMove(MoveId.BRINE, PokemonType.WATER, MoveCategory.SPECIAL, 65, 100, 10, -1, 0, 4)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.getHpRatio() < 0.5 ? 2 : 1),
    new AttackMove(MoveId.NATURAL_GIFT, PokemonType.NORMAL, MoveCategory.PHYSICAL, -1, 100, 15, -1, 0, 4)
      .makesContact(false)
      .unimplemented(),
      /*
      NOTE: To whoever tries to implement this, reminder to push to battleData.berriesEaten
      and enable the harvest test..
      Do NOT push to berriesEatenLast or else cud chew will puke the berry.
      */
    new AttackMove(MoveId.FEINT, PokemonType.NORMAL, MoveCategory.PHYSICAL, 30, 100, 10, -1, 2, 4)
      .attr(RemoveBattlerTagAttr, [ BattlerTagType.PROTECTED ])
      .attr(RemoveArenaTagsAttr, [ ArenaTagType.QUICK_GUARD, ArenaTagType.WIDE_GUARD, ArenaTagType.MAT_BLOCK, ArenaTagType.CRAFTY_SHIELD ], false)
      .makesContact(false)
      .ignoresProtect(),
    new AttackMove(MoveId.PLUCK, PokemonType.FLYING, MoveCategory.PHYSICAL, 60, 100, 20, -1, 0, 4)
      .attr(StealEatBerryAttr),
    new StatusMove(MoveId.TAILWIND, PokemonType.FLYING, -1, 15, -1, 0, 4)
      .windMove()
      .attr(AddArenaTagAttr, ArenaTagType.TAILWIND, 4, true)
      .target(MoveTarget.USER_SIDE),
    new StatusMove(MoveId.ACUPRESSURE, PokemonType.NORMAL, -1, 30, -1, 0, 4)
      .attr(AcupressureStatStageChangeAttr)
      .target(MoveTarget.USER_OR_NEAR_ALLY),
    new AttackMove(MoveId.METAL_BURST, PokemonType.STEEL, MoveCategory.PHYSICAL, -1, 100, 10, -1, 0, 4)
      .attr(CounterDamageAttr, (move: Move) => (move.category === MoveCategory.PHYSICAL || move.category === MoveCategory.SPECIAL), 1.5)
      .redirectCounter()
      .makesContact(false)
      .target(MoveTarget.ATTACKER),
    new AttackMove(MoveId.U_TURN, PokemonType.BUG, MoveCategory.PHYSICAL, 70, 100, 20, -1, 0, 4)
      .attr(ForceSwitchOutAttr, true),
    new AttackMove(MoveId.CLOSE_COMBAT, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 120, 100, 5, -1, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.DEF, Stat.SPDEF ], -1, true),
    new AttackMove(MoveId.PAYBACK, PokemonType.DARK, MoveCategory.PHYSICAL, 50, 100, 10, -1, 0, 4)
      // Payback boosts power on item use
      .attr(MovePowerMultiplierAttr, (_user, target) => target.turnData.acted || globalScene.currentBattle.turnCommands[target.getBattlerIndex()]?.command === Command.BALL ? 2 : 1),
    new AttackMove(MoveId.ASSURANCE, PokemonType.DARK, MoveCategory.PHYSICAL, 60, 100, 10, -1, 0, 4)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.turnData.damageTaken > 0 ? 2 : 1),
    new StatusMove(MoveId.EMBARGO, PokemonType.DARK, 100, 15, -1, 0, 4)
      .reflectable()
      .unimplemented(),
    new AttackMove(MoveId.FLING, PokemonType.DARK, MoveCategory.PHYSICAL, -1, 100, 10, -1, 0, 4)
      .makesContact(false)
      .unimplemented(),
    new StatusMove(MoveId.PSYCHO_SHIFT, PokemonType.PSYCHIC, 100, 10, -1, 0, 4)
      .attr(PsychoShiftEffectAttr)
      // TODO: Verify status applied if a statused pokemon obtains Comatose (via Transform) and uses Psycho Shift
      .edgeCase(),
    new AttackMove(MoveId.TRUMP_CARD, PokemonType.NORMAL, MoveCategory.SPECIAL, -1, -1, 5, -1, 0, 4)
      .makesContact()
      .attr(LessPPMorePowerAttr),
    new StatusMove(MoveId.HEAL_BLOCK, PokemonType.PSYCHIC, 100, 15, -1, 0, 4)
      .attr(AddBattlerTagAttr, BattlerTagType.HEAL_BLOCK, false, true, 5)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .reflectable(),
    new AttackMove(MoveId.WRING_OUT, PokemonType.NORMAL, MoveCategory.SPECIAL, -1, 100, 5, -1, 0, 4)
      .attr(OpponentHighHpPowerAttr, 120)
      .makesContact(),
    new SelfStatusMove(MoveId.POWER_TRICK, PokemonType.PSYCHIC, -1, 10, -1, 0, 4)
      .attr(AddBattlerTagAttr, BattlerTagType.POWER_TRICK, true),
    new StatusMove(MoveId.GASTRO_ACID, PokemonType.POISON, 100, 10, -1, 0, 4)
      .attr(SuppressAbilitiesAttr)
      .reflectable(),
    new StatusMove(MoveId.LUCKY_CHANT, PokemonType.NORMAL, -1, 30, -1, 0, 4)
      .attr(AddArenaTagAttr, ArenaTagType.NO_CRIT, 5, true, true)
      .target(MoveTarget.USER_SIDE),
    new StatusMove(MoveId.ME_FIRST, PokemonType.NORMAL, -1, 20, -1, 0, 4)
      .ignoresSubstitute()
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new SelfStatusMove(MoveId.COPYCAT, PokemonType.NORMAL, -1, 20, -1, 0, 4)
      .attr(CopyMoveAttr, false, invalidCopycatMoves),
    new StatusMove(MoveId.POWER_SWAP, PokemonType.PSYCHIC, -1, 10, 100, 0, 4)
      .attr(SwapStatStagesAttr, [ Stat.ATK, Stat.SPATK ])
      .ignoresSubstitute(),
    new StatusMove(MoveId.GUARD_SWAP, PokemonType.PSYCHIC, -1, 10, 100, 0, 4)
      .attr(SwapStatStagesAttr, [ Stat.DEF, Stat.SPDEF ])
      .ignoresSubstitute(),
    new AttackMove(MoveId.PUNISHMENT, PokemonType.DARK, MoveCategory.PHYSICAL, -1, 100, 5, -1, 0, 4)
      .makesContact(true)
      .attr(PunishmentPowerAttr),
    new AttackMove(MoveId.LAST_RESORT, PokemonType.NORMAL, MoveCategory.PHYSICAL, 140, 100, 5, -1, 0, 4)
      .attr(LastResortAttr)
      .edgeCase(), // May or may not need to ignore remotely called moves depending on how it works
    new StatusMove(MoveId.WORRY_SEED, PokemonType.GRASS, 100, 10, -1, 0, 4)
      .attr(AbilityChangeAttr, AbilityId.INSOMNIA)
      .reflectable(),
    new AttackMove(MoveId.SUCKER_PUNCH, PokemonType.DARK, MoveCategory.PHYSICAL, 70, 100, 5, -1, 1, 4)
      .condition((user, target, move) => {
        const turnCommand = globalScene.currentBattle.turnCommands[target.getBattlerIndex()];
        if (!turnCommand || !turnCommand.move) {
          return false;
        }
        return (turnCommand.command === Command.FIGHT && !target.turnData.acted && allMoves[turnCommand.move.move].category !== MoveCategory.STATUS);
      }),
    new StatusMove(MoveId.TOXIC_SPIKES, PokemonType.POISON, -1, 20, -1, 0, 4)
      .attr(AddArenaTrapTagAttr, ArenaTagType.TOXIC_SPIKES)
      .target(MoveTarget.ENEMY_SIDE)
      .reflectable(),
    new StatusMove(MoveId.HEART_SWAP, PokemonType.PSYCHIC, -1, 10, -1, 0, 4)
      .attr(SwapStatStagesAttr, BATTLE_STATS)
      .ignoresSubstitute(),
    new SelfStatusMove(MoveId.AQUA_RING, PokemonType.WATER, -1, 20, -1, 0, 4)
      .attr(AddBattlerTagAttr, BattlerTagType.AQUA_RING, true, true),
    new SelfStatusMove(MoveId.MAGNET_RISE, PokemonType.ELECTRIC, -1, 10, -1, 0, 4)
      .attr(AddBattlerTagAttr, BattlerTagType.FLOATING, true, true, 5)
      .condition((user, target, move) => !globalScene.arena.getTag(ArenaTagType.GRAVITY) && [ BattlerTagType.FLOATING, BattlerTagType.IGNORE_FLYING, BattlerTagType.INGRAIN ].every((tag) => !user.getTag(tag))),
    new AttackMove(MoveId.FLARE_BLITZ, PokemonType.FIRE, MoveCategory.PHYSICAL, 120, 100, 15, 10, 0, 4)
      .attr(RecoilAttr, false, 0.33)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .recklessMove(),
    new AttackMove(MoveId.FORCE_PALM, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 60, 100, 10, 30, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(MoveId.AURA_SPHERE, PokemonType.FIGHTING, MoveCategory.SPECIAL, 80, -1, 20, -1, 0, 4)
      .pulseMove()
      .ballBombMove(),
    new SelfStatusMove(MoveId.ROCK_POLISH, PokemonType.ROCK, -1, 20, -1, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPD ], 2, true),
    new AttackMove(MoveId.POISON_JAB, PokemonType.POISON, MoveCategory.PHYSICAL, 80, 100, 20, 30, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(MoveId.DARK_PULSE, PokemonType.DARK, MoveCategory.SPECIAL, 80, 100, 15, 20, 0, 4)
      .attr(FlinchAttr)
      .pulseMove(),
    new AttackMove(MoveId.NIGHT_SLASH, PokemonType.DARK, MoveCategory.PHYSICAL, 70, 100, 15, -1, 0, 4)
      .attr(HighCritAttr)
      .slicingMove(),
    new AttackMove(MoveId.AQUA_TAIL, PokemonType.WATER, MoveCategory.PHYSICAL, 90, 90, 10, -1, 0, 4),
    new AttackMove(MoveId.SEED_BOMB, PokemonType.GRASS, MoveCategory.PHYSICAL, 80, 100, 15, -1, 0, 4)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(MoveId.AIR_SLASH, PokemonType.FLYING, MoveCategory.SPECIAL, 75, 95, 15, 30, 0, 4)
      .attr(FlinchAttr)
      .slicingMove(),
    new AttackMove(MoveId.X_SCISSOR, PokemonType.BUG, MoveCategory.PHYSICAL, 80, 100, 15, -1, 0, 4)
      .slicingMove(),
    new AttackMove(MoveId.BUG_BUZZ, PokemonType.BUG, MoveCategory.SPECIAL, 90, 100, 10, 10, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -1)
      .soundBased(),
    new AttackMove(MoveId.DRAGON_PULSE, PokemonType.DRAGON, MoveCategory.SPECIAL, 85, 100, 10, -1, 0, 4)
      .pulseMove(),
    new AttackMove(MoveId.DRAGON_RUSH, PokemonType.DRAGON, MoveCategory.PHYSICAL, 100, 75, 10, 20, 0, 4)
      .attr(AlwaysHitMinimizeAttr)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.MINIMIZED)
      .attr(FlinchAttr),
    new AttackMove(MoveId.POWER_GEM, PokemonType.ROCK, MoveCategory.SPECIAL, 80, 100, 20, -1, 0, 4),
    new AttackMove(MoveId.DRAIN_PUNCH, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 75, 100, 10, -1, 0, 4)
      .attr(HitHealAttr)
      .punchingMove()
      .triageMove(),
    new AttackMove(MoveId.VACUUM_WAVE, PokemonType.FIGHTING, MoveCategory.SPECIAL, 40, 100, 30, -1, 1, 4),
    new AttackMove(MoveId.FOCUS_BLAST, PokemonType.FIGHTING, MoveCategory.SPECIAL, 120, 70, 5, 10, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -1)
      .ballBombMove(),
    new AttackMove(MoveId.ENERGY_BALL, PokemonType.GRASS, MoveCategory.SPECIAL, 90, 100, 10, 10, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -1)
      .ballBombMove(),
    new AttackMove(MoveId.BRAVE_BIRD, PokemonType.FLYING, MoveCategory.PHYSICAL, 120, 100, 15, -1, 0, 4)
      .attr(RecoilAttr, false, 0.33)
      .recklessMove(),
    new AttackMove(MoveId.EARTH_POWER, PokemonType.GROUND, MoveCategory.SPECIAL, 90, 100, 10, 10, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -1),
    new StatusMove(MoveId.SWITCHEROO, PokemonType.DARK, 100, 10, -1, 0, 4)
      .unimplemented(),
    new AttackMove(MoveId.GIGA_IMPACT, PokemonType.NORMAL, MoveCategory.PHYSICAL, 150, 90, 5, -1, 0, 4)
      .attr(RechargeAttr),
    new SelfStatusMove(MoveId.NASTY_PLOT, PokemonType.DARK, -1, 20, -1, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], 2, true),
    new AttackMove(MoveId.BULLET_PUNCH, PokemonType.STEEL, MoveCategory.PHYSICAL, 40, 100, 30, -1, 1, 4)
      .punchingMove(),
    new AttackMove(MoveId.AVALANCHE, PokemonType.ICE, MoveCategory.PHYSICAL, 60, 100, 10, -1, -4, 4)
      .attr(TurnDamagedDoublePowerAttr),
    new AttackMove(MoveId.ICE_SHARD, PokemonType.ICE, MoveCategory.PHYSICAL, 40, 100, 30, -1, 1, 4)
      .makesContact(false),
    new AttackMove(MoveId.SHADOW_CLAW, PokemonType.GHOST, MoveCategory.PHYSICAL, 70, 100, 15, -1, 0, 4)
      .attr(HighCritAttr),
    new AttackMove(MoveId.THUNDER_FANG, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 65, 95, 15, 10, 0, 4)
      .attr(FlinchAttr)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .bitingMove(),
    new AttackMove(MoveId.ICE_FANG, PokemonType.ICE, MoveCategory.PHYSICAL, 65, 95, 15, 10, 0, 4)
      .attr(FlinchAttr)
      .attr(StatusEffectAttr, StatusEffect.FREEZE)
      .bitingMove(),
    new AttackMove(MoveId.FIRE_FANG, PokemonType.FIRE, MoveCategory.PHYSICAL, 65, 95, 15, 10, 0, 4)
      .attr(FlinchAttr)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .bitingMove(),
    new AttackMove(MoveId.SHADOW_SNEAK, PokemonType.GHOST, MoveCategory.PHYSICAL, 40, 100, 30, -1, 1, 4),
    new AttackMove(MoveId.MUD_BOMB, PokemonType.GROUND, MoveCategory.SPECIAL, 65, 85, 10, 30, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.ACC ], -1)
      .ballBombMove(),
    new AttackMove(MoveId.PSYCHO_CUT, PokemonType.PSYCHIC, MoveCategory.PHYSICAL, 70, 100, 20, -1, 0, 4)
      .attr(HighCritAttr)
      .slicingMove()
      .makesContact(false),
    new AttackMove(MoveId.ZEN_HEADBUTT, PokemonType.PSYCHIC, MoveCategory.PHYSICAL, 80, 90, 15, 20, 0, 4)
      .attr(FlinchAttr),
    new AttackMove(MoveId.MIRROR_SHOT, PokemonType.STEEL, MoveCategory.SPECIAL, 65, 85, 10, 30, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.ACC ], -1),
    new AttackMove(MoveId.FLASH_CANNON, PokemonType.STEEL, MoveCategory.SPECIAL, 80, 100, 10, 10, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -1),
    new AttackMove(MoveId.ROCK_CLIMB, PokemonType.NORMAL, MoveCategory.PHYSICAL, 90, 85, 20, 20, 0, 4)
      .attr(ConfuseAttr),
    new StatusMove(MoveId.DEFOG, PokemonType.FLYING, -1, 15, -1, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.EVA ], -1)
      .attr(ClearWeatherAttr, WeatherType.FOG)
      .attr(ClearTerrainAttr)
      .attr(RemoveScreensAttr, false)
      .attr(RemoveArenaTrapAttr, true)
      .attr(RemoveArenaTagsAttr, [ ArenaTagType.MIST, ArenaTagType.SAFEGUARD ], false)
      .reflectable(),
    new StatusMove(MoveId.TRICK_ROOM, PokemonType.PSYCHIC, -1, 5, -1, -7, 4)
      .attr(AddArenaTagAttr, ArenaTagType.TRICK_ROOM, 5)
      .ignoresProtect()
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(MoveId.DRACO_METEOR, PokemonType.DRAGON, MoveCategory.SPECIAL, 130, 90, 5, -1, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -2, true),
    new AttackMove(MoveId.DISCHARGE, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 80, 100, 15, 30, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(MoveId.LAVA_PLUME, PokemonType.FIRE, MoveCategory.SPECIAL, 80, 100, 15, 30, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(MoveId.LEAF_STORM, PokemonType.GRASS, MoveCategory.SPECIAL, 130, 90, 5, -1, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -2, true),
    new AttackMove(MoveId.POWER_WHIP, PokemonType.GRASS, MoveCategory.PHYSICAL, 120, 85, 10, -1, 0, 4),
    new AttackMove(MoveId.ROCK_WRECKER, PokemonType.ROCK, MoveCategory.PHYSICAL, 150, 90, 5, -1, 0, 4)
      .attr(RechargeAttr)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(MoveId.CROSS_POISON, PokemonType.POISON, MoveCategory.PHYSICAL, 70, 100, 20, 10, 0, 4)
      .attr(HighCritAttr)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .slicingMove(),
    new AttackMove(MoveId.GUNK_SHOT, PokemonType.POISON, MoveCategory.PHYSICAL, 120, 80, 5, 30, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .makesContact(false),
    new AttackMove(MoveId.IRON_HEAD, PokemonType.STEEL, MoveCategory.PHYSICAL, 80, 100, 15, 30, 0, 4)
      .attr(FlinchAttr),
    new AttackMove(MoveId.MAGNET_BOMB, PokemonType.STEEL, MoveCategory.PHYSICAL, 60, -1, 20, -1, 0, 4)
      .makesContact(false)
      .ballBombMove(),
    new AttackMove(MoveId.STONE_EDGE, PokemonType.ROCK, MoveCategory.PHYSICAL, 100, 80, 5, -1, 0, 4)
      .attr(HighCritAttr)
      .makesContact(false),
    new StatusMove(MoveId.CAPTIVATE, PokemonType.NORMAL, 100, 20, -1, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -2)
      .condition((user, target, move) => target.isOppositeGender(user))
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .reflectable(),
    new StatusMove(MoveId.STEALTH_ROCK, PokemonType.ROCK, -1, 20, -1, 0, 4)
      .attr(AddArenaTrapTagAttr, ArenaTagType.STEALTH_ROCK)
      .target(MoveTarget.ENEMY_SIDE)
      .reflectable(),
    new AttackMove(MoveId.GRASS_KNOT, PokemonType.GRASS, MoveCategory.SPECIAL, -1, 100, 20, -1, 0, 4)
      .attr(WeightPowerAttr)
      .makesContact(),
    new AttackMove(MoveId.CHATTER, PokemonType.FLYING, MoveCategory.SPECIAL, 65, 100, 20, 100, 0, 4)
      .attr(ConfuseAttr)
      .soundBased(),
    new AttackMove(MoveId.JUDGMENT, PokemonType.NORMAL, MoveCategory.SPECIAL, 100, 100, 10, -1, 0, 4)
      .attr(FormChangeItemTypeAttr),
    new AttackMove(MoveId.BUG_BITE, PokemonType.BUG, MoveCategory.PHYSICAL, 60, 100, 20, -1, 0, 4)
      .attr(StealEatBerryAttr),
    new AttackMove(MoveId.CHARGE_BEAM, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 50, 90, 10, 70, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], 1, true),
    new AttackMove(MoveId.WOOD_HAMMER, PokemonType.GRASS, MoveCategory.PHYSICAL, 120, 100, 15, -1, 0, 4)
      .attr(RecoilAttr, false, 0.33)
      .recklessMove(),
    new AttackMove(MoveId.AQUA_JET, PokemonType.WATER, MoveCategory.PHYSICAL, 40, 100, 20, -1, 1, 4),
    new AttackMove(MoveId.ATTACK_ORDER, PokemonType.BUG, MoveCategory.PHYSICAL, 90, 100, 15, -1, 0, 4)
      .attr(HighCritAttr)
      .makesContact(false),
    new SelfStatusMove(MoveId.DEFEND_ORDER, PokemonType.BUG, -1, 10, -1, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.DEF, Stat.SPDEF ], 1, true),
    new SelfStatusMove(MoveId.HEAL_ORDER, PokemonType.BUG, -1, 5, -1, 0, 4)
      .attr(HealAttr, 0.5)
      .triageMove(),
    new AttackMove(MoveId.HEAD_SMASH, PokemonType.ROCK, MoveCategory.PHYSICAL, 150, 80, 5, -1, 0, 4)
      .attr(RecoilAttr, false, 0.5)
      .recklessMove(),
    new AttackMove(MoveId.DOUBLE_HIT, PokemonType.NORMAL, MoveCategory.PHYSICAL, 35, 90, 10, -1, 0, 4)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(MoveId.ROAR_OF_TIME, PokemonType.DRAGON, MoveCategory.SPECIAL, 150, 90, 5, -1, 0, 4)
      .attr(RechargeAttr),
    new AttackMove(MoveId.SPACIAL_REND, PokemonType.DRAGON, MoveCategory.SPECIAL, 100, 95, 5, -1, 0, 4)
      .attr(HighCritAttr),
    new SelfStatusMove(MoveId.LUNAR_DANCE, PokemonType.PSYCHIC, -1, 10, -1, 0, 4)
      .attr(SacrificialFullRestoreAttr, true, "moveTriggers:lunarDanceRestore")
      .danceMove()
      .triageMove()
      .condition(failIfLastInPartyCondition),
    new AttackMove(MoveId.CRUSH_GRIP, PokemonType.NORMAL, MoveCategory.PHYSICAL, -1, 100, 5, -1, 0, 4)
      .attr(OpponentHighHpPowerAttr, 120),
    new AttackMove(MoveId.MAGMA_STORM, PokemonType.FIRE, MoveCategory.SPECIAL, 100, 75, 5, -1, 0, 4)
      .attr(TrapAttr, BattlerTagType.MAGMA_STORM),
    new StatusMove(MoveId.DARK_VOID, PokemonType.DARK, 80, 10, -1, 0, 4)  //Accuracy from Generations 4-6
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .reflectable(),
    new AttackMove(MoveId.SEED_FLARE, PokemonType.GRASS, MoveCategory.SPECIAL, 120, 85, 5, 40, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -2),
    new AttackMove(MoveId.OMINOUS_WIND, PokemonType.GHOST, MoveCategory.SPECIAL, 60, 100, 5, 10, 0, 4)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD ], 1, true)
      .windMove(),
    new ChargingAttackMove(MoveId.SHADOW_FORCE, PokemonType.GHOST, MoveCategory.PHYSICAL, 120, 100, 5, -1, 0, 4)
      .chargeText(i18next.t("moveTriggers:vanishedInstantly", { pokemonName: "{USER}" }))
      .chargeAttr(SemiInvulnerableAttr, BattlerTagType.HIDDEN)
      .ignoresProtect(),
    new SelfStatusMove(MoveId.HONE_CLAWS, PokemonType.DARK, -1, 15, -1, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.ACC ], 1, true),
    new StatusMove(MoveId.WIDE_GUARD, PokemonType.ROCK, -1, 10, -1, 3, 5)
      .target(MoveTarget.USER_SIDE)
      .attr(AddArenaTagAttr, ArenaTagType.WIDE_GUARD, 1, true, true)
      .condition(failIfLastCondition),
    new StatusMove(MoveId.GUARD_SPLIT, PokemonType.PSYCHIC, -1, 10, -1, 0, 5)
      .attr(AverageStatsAttr, [ Stat.DEF, Stat.SPDEF ], "moveTriggers:sharedGuard"),
    new StatusMove(MoveId.POWER_SPLIT, PokemonType.PSYCHIC, -1, 10, -1, 0, 5)
      .attr(AverageStatsAttr, [ Stat.ATK, Stat.SPATK ], "moveTriggers:sharedPower"),
    new StatusMove(MoveId.WONDER_ROOM, PokemonType.PSYCHIC, -1, 10, -1, 0, 5)
      .ignoresProtect()
      .target(MoveTarget.BOTH_SIDES)
      .unimplemented(),
    new AttackMove(MoveId.PSYSHOCK, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 5)
      .attr(DefDefAttr),
    new AttackMove(MoveId.VENOSHOCK, PokemonType.POISON, MoveCategory.SPECIAL, 65, 100, 10, -1, 0, 5)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.status && (target.status.effect === StatusEffect.POISON || target.status.effect === StatusEffect.TOXIC) ? 2 : 1),
    new SelfStatusMove(MoveId.AUTOTOMIZE, PokemonType.STEEL, -1, 15, -1, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.SPD ], 2, true)
      .attr(AddBattlerTagAttr, BattlerTagType.AUTOTOMIZED, true),
    new SelfStatusMove(MoveId.RAGE_POWDER, PokemonType.BUG, -1, 20, -1, 2, 5)
      .powderMove()
      .attr(AddBattlerTagAttr, BattlerTagType.CENTER_OF_ATTENTION, true),
    new StatusMove(MoveId.TELEKINESIS, PokemonType.PSYCHIC, -1, 15, -1, 0, 5)
      .condition(failOnGravityCondition)
      .condition((_user, target, _move) => ![ SpeciesId.DIGLETT, SpeciesId.DUGTRIO, SpeciesId.ALOLA_DIGLETT, SpeciesId.ALOLA_DUGTRIO, SpeciesId.SANDYGAST, SpeciesId.PALOSSAND, SpeciesId.WIGLETT, SpeciesId.WUGTRIO ].includes(target.species.speciesId))
      .condition((_user, target, _move) => !(target.species.speciesId === SpeciesId.GENGAR && target.getFormKey() === "mega"))
      .condition((_user, target, _move) => isNullOrUndefined(target.getTag(BattlerTagType.INGRAIN)) && isNullOrUndefined(target.getTag(BattlerTagType.IGNORE_FLYING)))
      .attr(AddBattlerTagAttr, BattlerTagType.TELEKINESIS, false, true, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.FLOATING, false, true, 3)
      .reflectable(),
    new StatusMove(MoveId.MAGIC_ROOM, PokemonType.PSYCHIC, -1, 10, -1, 0, 5)
      .ignoresProtect()
      .target(MoveTarget.BOTH_SIDES)
      .unimplemented(),
    new AttackMove(MoveId.SMACK_DOWN, PokemonType.ROCK, MoveCategory.PHYSICAL, 50, 100, 15, -1, 0, 5)
      .attr(FallDownAttr)
      .attr(AddBattlerTagAttr, BattlerTagType.INTERRUPTED)
      .attr(RemoveBattlerTagAttr, [ BattlerTagType.FLYING, BattlerTagType.FLOATING, BattlerTagType.TELEKINESIS ])
      .attr(HitsTagAttr, BattlerTagType.FLYING)
      .makesContact(false),
    new AttackMove(MoveId.STORM_THROW, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 60, 100, 10, -1, 0, 5)
      .attr(CritOnlyAttr),
    new AttackMove(MoveId.FLAME_BURST, PokemonType.FIRE, MoveCategory.SPECIAL, 70, 100, 15, -1, 0, 5)
      .attr(FlameBurstAttr),
    new AttackMove(MoveId.SLUDGE_WAVE, PokemonType.POISON, MoveCategory.SPECIAL, 95, 100, 10, 10, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new SelfStatusMove(MoveId.QUIVER_DANCE, PokemonType.BUG, -1, 20, -1, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.SPATK, Stat.SPDEF, Stat.SPD ], 1, true)
      .danceMove(),
    new AttackMove(MoveId.HEAVY_SLAM, PokemonType.STEEL, MoveCategory.PHYSICAL, -1, 100, 10, -1, 0, 5)
      .attr(AlwaysHitMinimizeAttr)
      .attr(CompareWeightPowerAttr)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.MINIMIZED),
    new AttackMove(MoveId.SYNCHRONOISE, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 120, 100, 10, -1, 0, 5)
      .target(MoveTarget.ALL_NEAR_OTHERS)
      .condition(unknownTypeCondition)
      .attr(HitsSameTypeAttr),
    new AttackMove(MoveId.ELECTRO_BALL, PokemonType.ELECTRIC, MoveCategory.SPECIAL, -1, 100, 10, -1, 0, 5)
      .attr(ElectroBallPowerAttr)
      .ballBombMove(),
    new StatusMove(MoveId.SOAK, PokemonType.WATER, 100, 20, -1, 0, 5)
      .attr(ChangeTypeAttr, PokemonType.WATER)
      .reflectable(),
    new AttackMove(MoveId.FLAME_CHARGE, PokemonType.FIRE, MoveCategory.PHYSICAL, 50, 100, 20, 100, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.SPD ], 1, true),
    new SelfStatusMove(MoveId.COIL, PokemonType.POISON, -1, 20, -1, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF, Stat.ACC ], 1, true),
    new AttackMove(MoveId.LOW_SWEEP, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 65, 100, 20, 100, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1),
    new AttackMove(MoveId.ACID_SPRAY, PokemonType.POISON, MoveCategory.SPECIAL, 40, 100, 20, 100, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -2)
      .ballBombMove(),
    new AttackMove(MoveId.FOUL_PLAY, PokemonType.DARK, MoveCategory.PHYSICAL, 95, 100, 15, -1, 0, 5)
      .attr(TargetAtkUserAtkAttr),
    new StatusMove(MoveId.SIMPLE_BEAM, PokemonType.NORMAL, 100, 15, -1, 0, 5)
      .attr(AbilityChangeAttr, AbilityId.SIMPLE)
      .reflectable(),
    new StatusMove(MoveId.ENTRAINMENT, PokemonType.NORMAL, 100, 15, -1, 0, 5)
      .attr(AbilityGiveAttr)
      .reflectable(),
    new StatusMove(MoveId.AFTER_YOU, PokemonType.NORMAL, -1, 15, -1, 0, 5)
      .ignoresProtect()
      .ignoresSubstitute()
      .target(MoveTarget.NEAR_OTHER)
      .condition(failIfSingleBattle)
      .condition((user, target, move) => !target.turnData.acted)
      .attr(AfterYouAttr),
    new AttackMove(MoveId.ROUND, PokemonType.NORMAL, MoveCategory.SPECIAL, 60, 100, 15, -1, 0, 5)
      .attr(CueNextRoundAttr)
      .attr(RoundPowerAttr)
      .soundBased(),
    new AttackMove(MoveId.ECHOED_VOICE, PokemonType.NORMAL, MoveCategory.SPECIAL, 40, 100, 15, -1, 0, 5)
      .attr(ConsecutiveUseMultiBasePowerAttr, 5, false)
      .soundBased(),
    new AttackMove(MoveId.CHIP_AWAY, PokemonType.NORMAL, MoveCategory.PHYSICAL, 70, 100, 20, -1, 0, 5)
      .attr(IgnoreOpponentStatStagesAttr),
    new AttackMove(MoveId.CLEAR_SMOG, PokemonType.POISON, MoveCategory.SPECIAL, 50, -1, 15, -1, 0, 5)
      .attr(ResetStatsAttr, false),
    new AttackMove(MoveId.STORED_POWER, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 20, 100, 10, -1, 0, 5)
      .attr(PositiveStatStagePowerAttr),
    new StatusMove(MoveId.QUICK_GUARD, PokemonType.FIGHTING, -1, 15, -1, 3, 5)
      .target(MoveTarget.USER_SIDE)
      .attr(AddArenaTagAttr, ArenaTagType.QUICK_GUARD, 1, true, true)
      .condition(failIfLastCondition),
    new SelfStatusMove(MoveId.ALLY_SWITCH, PokemonType.PSYCHIC, -1, 15, -1, 2, 5)
      .ignoresProtect()
      .unimplemented(),
    new AttackMove(MoveId.SCALD, PokemonType.WATER, MoveCategory.SPECIAL, 80, 100, 15, 30, 0, 5)
      .attr(HealStatusEffectAttr, false, StatusEffect.FREEZE)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new SelfStatusMove(MoveId.SHELL_SMASH, PokemonType.NORMAL, -1, 15, -1, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPATK, Stat.SPD ], 2, true)
      .attr(StatStageChangeAttr, [ Stat.DEF, Stat.SPDEF ], -1, true),
    new StatusMove(MoveId.HEAL_PULSE, PokemonType.PSYCHIC, -1, 10, -1, 0, 5)
      .attr(HealAttr, 0.5, false, false)
      .pulseMove()
      .triageMove()
      .reflectable(),
    new AttackMove(MoveId.HEX, PokemonType.GHOST, MoveCategory.SPECIAL, 65, 100, 10, -1, 0, 5)
      .attr(
        MovePowerMultiplierAttr,
        (user, target, move) =>  target.status || target.hasAbility(AbilityId.COMATOSE) ? 2 : 1),
    new ChargingAttackMove(MoveId.SKY_DROP, PokemonType.FLYING, MoveCategory.PHYSICAL, 60, 100, 10, -1, 0, 5)
      .chargeText(i18next.t("moveTriggers:tookTargetIntoSky", { pokemonName: "{USER}", targetName: "{TARGET}" }))
      .chargeAttr(SemiInvulnerableAttr, BattlerTagType.FLYING)
      .condition(failOnGravityCondition)
      .condition((user, target, move) => !target.getTag(BattlerTagType.SUBSTITUTE))
      /*
       * Cf https://bulbapedia.bulbagarden.net/wiki/Sky_Drop_(move) and https://www.smogon.com/dex/sv/moves/sky-drop/:
       * Should immobilize and give target semi-invulnerability
       * Flying types should take no damage
       * Should fail on targets above a certain weight threshold
       * Should remove all redirection effects on successful takeoff (Rage Poweder, etc.)
       */
      .partial(),
    new SelfStatusMove(MoveId.SHIFT_GEAR, PokemonType.STEEL, -1, 10, -1, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.ATK ], 1, true)
      .attr(StatStageChangeAttr, [ Stat.SPD ], 2, true),
    new AttackMove(MoveId.CIRCLE_THROW, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 60, 90, 10, -1, -6, 5)
      .attr(ForceSwitchOutAttr, false, SwitchType.FORCE_SWITCH)
      .hidesTarget(),
    new AttackMove(MoveId.INCINERATE, PokemonType.FIRE, MoveCategory.SPECIAL, 60, 100, 15, -1, 0, 5)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .attr(RemoveHeldItemAttr, true)
      .edgeCase(),
      // Should be able to remove items from pokemon with Sticky Hold if the damage causes them to faint
    new StatusMove(MoveId.QUASH, PokemonType.DARK, 100, 15, -1, 0, 5)
      .condition(failIfSingleBattle)
      .condition((user, target, move) => !target.turnData.acted)
      .attr(ForceLastAttr),
    new AttackMove(MoveId.ACROBATICS, PokemonType.FLYING, MoveCategory.PHYSICAL, 55, 100, 15, -1, 0, 5)
      .attr(MovePowerMultiplierAttr, (user, target, move) => Math.max(1, 2 - 0.2 * user.getHeldItems().filter(i => i.isTransferable).reduce((v, m) => v + m.stackCount, 0))),
    new StatusMove(MoveId.REFLECT_TYPE, PokemonType.NORMAL, -1, 15, -1, 0, 5)
      .ignoresSubstitute()
      .attr(CopyTypeAttr),
    new AttackMove(MoveId.RETALIATE, PokemonType.NORMAL, MoveCategory.PHYSICAL, 70, 100, 5, -1, 0, 5)
      .attr(MovePowerMultiplierAttr, (user, target, move) => {
        const turn = globalScene.currentBattle.turn;
        const lastPlayerFaint = globalScene.currentBattle.playerFaintsHistory[globalScene.currentBattle.playerFaintsHistory.length - 1];
        const lastEnemyFaint = globalScene.currentBattle.enemyFaintsHistory[globalScene.currentBattle.enemyFaintsHistory.length - 1];
        return (
          (lastPlayerFaint !== undefined && turn - lastPlayerFaint.turn === 1 && user.isPlayer()) ||
          (lastEnemyFaint !== undefined && turn - lastEnemyFaint.turn === 1 && user.isEnemy())
        ) ? 2 : 1;
      }),
    new AttackMove(MoveId.FINAL_GAMBIT, PokemonType.FIGHTING, MoveCategory.SPECIAL, -1, 100, 5, -1, 0, 5)
      .attr(UserHpDamageAttr)
      .attr(SacrificialAttrOnHit),
    new StatusMove(MoveId.BESTOW, PokemonType.NORMAL, -1, 15, -1, 0, 5)
      .ignoresProtect()
      .ignoresSubstitute()
      .unimplemented(),
    new AttackMove(MoveId.INFERNO, PokemonType.FIRE, MoveCategory.SPECIAL, 100, 50, 5, 100, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(MoveId.WATER_PLEDGE, PokemonType.WATER, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 5)
      .attr(AwaitCombinedPledgeAttr)
      .attr(CombinedPledgeTypeAttr)
      .attr(CombinedPledgePowerAttr)
      .attr(CombinedPledgeStabBoostAttr)
      .attr(AddPledgeEffectAttr, ArenaTagType.WATER_FIRE_PLEDGE, MoveId.FIRE_PLEDGE, true)
      .attr(AddPledgeEffectAttr, ArenaTagType.GRASS_WATER_PLEDGE, MoveId.GRASS_PLEDGE)
      .attr(BypassRedirectAttr, true),
    new AttackMove(MoveId.FIRE_PLEDGE, PokemonType.FIRE, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 5)
      .attr(AwaitCombinedPledgeAttr)
      .attr(CombinedPledgeTypeAttr)
      .attr(CombinedPledgePowerAttr)
      .attr(CombinedPledgeStabBoostAttr)
      .attr(AddPledgeEffectAttr, ArenaTagType.FIRE_GRASS_PLEDGE, MoveId.GRASS_PLEDGE)
      .attr(AddPledgeEffectAttr, ArenaTagType.WATER_FIRE_PLEDGE, MoveId.WATER_PLEDGE, true)
      .attr(BypassRedirectAttr, true),
    new AttackMove(MoveId.GRASS_PLEDGE, PokemonType.GRASS, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 5)
      .attr(AwaitCombinedPledgeAttr)
      .attr(CombinedPledgeTypeAttr)
      .attr(CombinedPledgePowerAttr)
      .attr(CombinedPledgeStabBoostAttr)
      .attr(AddPledgeEffectAttr, ArenaTagType.GRASS_WATER_PLEDGE, MoveId.WATER_PLEDGE)
      .attr(AddPledgeEffectAttr, ArenaTagType.FIRE_GRASS_PLEDGE, MoveId.FIRE_PLEDGE)
      .attr(BypassRedirectAttr, true),
    new AttackMove(MoveId.VOLT_SWITCH, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 70, 100, 20, -1, 0, 5)
      .attr(ForceSwitchOutAttr, true),
    new AttackMove(MoveId.STRUGGLE_BUG, PokemonType.BUG, MoveCategory.SPECIAL, 50, 100, 20, 100, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.BULLDOZE, PokemonType.GROUND, MoveCategory.PHYSICAL, 60, 100, 20, 100, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1)
      .attr(MovePowerMultiplierAttr, (user, target, move) => globalScene.arena.getTerrainType() === TerrainType.GRASSY && target.isGrounded() ? 0.5 : 1)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(MoveId.FROST_BREATH, PokemonType.ICE, MoveCategory.SPECIAL, 60, 90, 10, -1, 0, 5)
      .attr(CritOnlyAttr),
    new AttackMove(MoveId.DRAGON_TAIL, PokemonType.DRAGON, MoveCategory.PHYSICAL, 60, 90, 10, -1, -6, 5)
      .attr(ForceSwitchOutAttr, false, SwitchType.FORCE_SWITCH)
      .hidesTarget(),
    new SelfStatusMove(MoveId.WORK_UP, PokemonType.NORMAL, -1, 30, -1, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPATK ], 1, true),
    new AttackMove(MoveId.ELECTROWEB, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 55, 95, 15, 100, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.WILD_CHARGE, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 90, 100, 15, -1, 0, 5)
      .attr(RecoilAttr)
      .recklessMove(),
    new AttackMove(MoveId.DRILL_RUN, PokemonType.GROUND, MoveCategory.PHYSICAL, 80, 95, 10, -1, 0, 5)
      .attr(HighCritAttr),
    new AttackMove(MoveId.DUAL_CHOP, PokemonType.DRAGON, MoveCategory.PHYSICAL, 40, 90, 15, -1, 0, 5)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(MoveId.HEART_STAMP, PokemonType.PSYCHIC, MoveCategory.PHYSICAL, 60, 100, 25, 30, 0, 5)
      .attr(FlinchAttr),
    new AttackMove(MoveId.HORN_LEECH, PokemonType.GRASS, MoveCategory.PHYSICAL, 75, 100, 10, -1, 0, 5)
      .attr(HitHealAttr)
      .triageMove(),
    new AttackMove(MoveId.SACRED_SWORD, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 90, 100, 15, -1, 0, 5)
      .attr(IgnoreOpponentStatStagesAttr)
      .slicingMove(),
    new AttackMove(MoveId.RAZOR_SHELL, PokemonType.WATER, MoveCategory.PHYSICAL, 75, 95, 10, 50, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1)
      .slicingMove(),
    new AttackMove(MoveId.HEAT_CRASH, PokemonType.FIRE, MoveCategory.PHYSICAL, -1, 100, 10, -1, 0, 5)
      .attr(AlwaysHitMinimizeAttr)
      .attr(CompareWeightPowerAttr)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.MINIMIZED),
    new AttackMove(MoveId.LEAF_TORNADO, PokemonType.GRASS, MoveCategory.SPECIAL, 65, 90, 10, 50, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.ACC ], -1),
    new AttackMove(MoveId.STEAMROLLER, PokemonType.BUG, MoveCategory.PHYSICAL, 65, 100, 20, 30, 0, 5)
      .attr(AlwaysHitMinimizeAttr)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.MINIMIZED)
      .attr(FlinchAttr),
    new SelfStatusMove(MoveId.COTTON_GUARD, PokemonType.GRASS, -1, 10, -1, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 3, true),
    new AttackMove(MoveId.NIGHT_DAZE, PokemonType.DARK, MoveCategory.SPECIAL, 85, 95, 10, 40, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.ACC ], -1),
    new AttackMove(MoveId.PSYSTRIKE, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 100, 100, 10, -1, 0, 5)
      .attr(DefDefAttr),
    new AttackMove(MoveId.TAIL_SLAP, PokemonType.NORMAL, MoveCategory.PHYSICAL, 25, 85, 10, -1, 0, 5)
      .attr(MultiHitAttr),
    new AttackMove(MoveId.HURRICANE, PokemonType.FLYING, MoveCategory.SPECIAL, 110, 70, 10, 30, 0, 5)
      .attr(ThunderAccuracyAttr)
      .attr(ConfuseAttr)
      .attr(HitsTagAttr, BattlerTagType.FLYING)
      .windMove(),
    new AttackMove(MoveId.HEAD_CHARGE, PokemonType.NORMAL, MoveCategory.PHYSICAL, 120, 100, 15, -1, 0, 5)
      .attr(RecoilAttr)
      .recklessMove(),
    new AttackMove(MoveId.GEAR_GRIND, PokemonType.STEEL, MoveCategory.PHYSICAL, 50, 85, 15, -1, 0, 5)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(MoveId.SEARING_SHOT, PokemonType.FIRE, MoveCategory.SPECIAL, 100, 100, 5, 30, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .ballBombMove()
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(MoveId.TECHNO_BLAST, PokemonType.NORMAL, MoveCategory.SPECIAL, 120, 100, 5, -1, 0, 5)
      .attr(TechnoBlastTypeAttr),
    new AttackMove(MoveId.RELIC_SONG, PokemonType.NORMAL, MoveCategory.SPECIAL, 75, 100, 10, 10, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.SECRET_SWORD, PokemonType.FIGHTING, MoveCategory.SPECIAL, 85, 100, 10, -1, 0, 5)
      .attr(DefDefAttr)
      .slicingMove(),
    new AttackMove(MoveId.GLACIATE, PokemonType.ICE, MoveCategory.SPECIAL, 65, 95, 10, 100, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.BOLT_STRIKE, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 130, 85, 5, 20, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(MoveId.BLUE_FLARE, PokemonType.FIRE, MoveCategory.SPECIAL, 130, 85, 5, 20, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(MoveId.FIERY_DANCE, PokemonType.FIRE, MoveCategory.SPECIAL, 80, 100, 10, 50, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], 1, true)
      .danceMove(),
    new ChargingAttackMove(MoveId.FREEZE_SHOCK, PokemonType.ICE, MoveCategory.PHYSICAL, 140, 90, 5, 30, 0, 5)
      .chargeText(i18next.t("moveTriggers:becameCloakedInFreezingLight", { pokemonName: "{USER}" }))
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .makesContact(false),
    new ChargingAttackMove(MoveId.ICE_BURN, PokemonType.ICE, MoveCategory.SPECIAL, 140, 90, 5, 30, 0, 5)
      .chargeText(i18next.t("moveTriggers:becameCloakedInFreezingAir", { pokemonName: "{USER}" }))
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(MoveId.SNARL, PokemonType.DARK, MoveCategory.SPECIAL, 55, 95, 15, 100, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -1)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.ICICLE_CRASH, PokemonType.ICE, MoveCategory.PHYSICAL, 85, 90, 10, 30, 0, 5)
      .attr(FlinchAttr)
      .makesContact(false),
    new AttackMove(MoveId.V_CREATE, PokemonType.FIRE, MoveCategory.PHYSICAL, 180, 95, 5, -1, 0, 5)
      .attr(StatStageChangeAttr, [ Stat.DEF, Stat.SPDEF, Stat.SPD ], -1, true),
    new AttackMove(MoveId.FUSION_FLARE, PokemonType.FIRE, MoveCategory.SPECIAL, 100, 100, 5, -1, 0, 5)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(LastMoveDoublePowerAttr, MoveId.FUSION_BOLT),
    new AttackMove(MoveId.FUSION_BOLT, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 100, 100, 5, -1, 0, 5)
      .attr(LastMoveDoublePowerAttr, MoveId.FUSION_FLARE)
      .makesContact(false),
    new AttackMove(MoveId.FLYING_PRESS, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 100, 95, 10, -1, 0, 6)
      .attr(AlwaysHitMinimizeAttr)
      .attr(FlyingTypeMultiplierAttr)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.MINIMIZED)
      .condition(failOnGravityCondition),
    new StatusMove(MoveId.MAT_BLOCK, PokemonType.FIGHTING, -1, 10, -1, 0, 6)
      .target(MoveTarget.USER_SIDE)
      .attr(AddArenaTagAttr, ArenaTagType.MAT_BLOCK, 1, true, true)
      .condition(new FirstMoveCondition())
      .condition(failIfLastCondition),
    new AttackMove(MoveId.BELCH, PokemonType.POISON, MoveCategory.SPECIAL, 120, 90, 10, -1, 0, 6)
      .condition((user, target, move) => user.battleData.hasEatenBerry),
    new StatusMove(MoveId.ROTOTILLER, PokemonType.GROUND, -1, 10, -1, 0, 6)
      .target(MoveTarget.ALL)
      .condition((user, target, move) => {
        // If any fielded pokémon is grass-type and grounded.
        return [ ...globalScene.getEnemyParty(), ...globalScene.getPlayerParty() ].some((poke) => poke.isOfType(PokemonType.GRASS) && poke.isGrounded());
      })
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPATK ], 1, false, { condition: (user, target, move) => target.isOfType(PokemonType.GRASS) && target.isGrounded() }),
    new StatusMove(MoveId.STICKY_WEB, PokemonType.BUG, -1, 20, -1, 0, 6)
      .attr(AddArenaTrapTagAttr, ArenaTagType.STICKY_WEB)
      .target(MoveTarget.ENEMY_SIDE)
      .reflectable(),
    new AttackMove(MoveId.FELL_STINGER, PokemonType.BUG, MoveCategory.PHYSICAL, 50, 100, 25, -1, 0, 6)
      .attr(PostVictoryStatStageChangeAttr, [ Stat.ATK ], 3, true ),
    new ChargingAttackMove(MoveId.PHANTOM_FORCE, PokemonType.GHOST, MoveCategory.PHYSICAL, 90, 100, 10, -1, 0, 6)
      .chargeText(i18next.t("moveTriggers:vanishedInstantly", { pokemonName: "{USER}" }))
      .chargeAttr(SemiInvulnerableAttr, BattlerTagType.HIDDEN)
      .ignoresProtect(),
    new StatusMove(MoveId.TRICK_OR_TREAT, PokemonType.GHOST, 100, 20, -1, 0, 6)
      .attr(AddTypeAttr, PokemonType.GHOST)
      .reflectable(),
    new StatusMove(MoveId.NOBLE_ROAR, PokemonType.NORMAL, 100, 30, -1, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPATK ], -1)
      .soundBased()
      .reflectable(),
    new StatusMove(MoveId.ION_DELUGE, PokemonType.ELECTRIC, -1, 25, -1, 1, 6)
      .attr(AddArenaTagAttr, ArenaTagType.ION_DELUGE)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(MoveId.PARABOLIC_CHARGE, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 65, 100, 20, -1, 0, 6)
      .attr(HitHealAttr)
      .target(MoveTarget.ALL_NEAR_OTHERS)
      .triageMove(),
    new StatusMove(MoveId.FORESTS_CURSE, PokemonType.GRASS, 100, 20, -1, 0, 6)
      .attr(AddTypeAttr, PokemonType.GRASS)
      .reflectable(),
    new AttackMove(MoveId.PETAL_BLIZZARD, PokemonType.GRASS, MoveCategory.PHYSICAL, 90, 100, 15, -1, 0, 6)
      .windMove()
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(MoveId.FREEZE_DRY, PokemonType.ICE, MoveCategory.SPECIAL, 70, 100, 20, 10, 0, 6)
      .attr(StatusEffectAttr, StatusEffect.FREEZE)
      .attr(FreezeDryAttr),
    new AttackMove(MoveId.DISARMING_VOICE, PokemonType.FAIRY, MoveCategory.SPECIAL, 40, -1, 15, -1, 0, 6)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(MoveId.PARTING_SHOT, PokemonType.DARK, 100, 20, -1, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPATK ], -1, false, { trigger: MoveEffectTrigger.PRE_APPLY })
      .attr(ForceSwitchOutAttr, true)
      .soundBased()
      .reflectable(),
    new StatusMove(MoveId.TOPSY_TURVY, PokemonType.DARK, -1, 20, -1, 0, 6)
      .attr(InvertStatsAttr)
      .reflectable(),
    new AttackMove(MoveId.DRAINING_KISS, PokemonType.FAIRY, MoveCategory.SPECIAL, 50, 100, 10, -1, 0, 6)
      .attr(HitHealAttr, 0.75)
      .makesContact()
      .triageMove(),
    new StatusMove(MoveId.CRAFTY_SHIELD, PokemonType.FAIRY, -1, 10, -1, 3, 6)
      .target(MoveTarget.USER_SIDE)
      .attr(AddArenaTagAttr, ArenaTagType.CRAFTY_SHIELD, 1, true, true)
      .condition(failIfLastCondition),
    new StatusMove(MoveId.FLOWER_SHIELD, PokemonType.FAIRY, -1, 10, -1, 0, 6)
      .target(MoveTarget.ALL)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 1, false, { condition: (user, target, move) => target.getTypes().includes(PokemonType.GRASS) && !target.getTag(SemiInvulnerableTag) }),
    new StatusMove(MoveId.GRASSY_TERRAIN, PokemonType.GRASS, -1, 10, -1, 0, 6)
      .attr(TerrainChangeAttr, TerrainType.GRASSY)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(MoveId.MISTY_TERRAIN, PokemonType.FAIRY, -1, 10, -1, 0, 6)
      .attr(TerrainChangeAttr, TerrainType.MISTY)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(MoveId.ELECTRIFY, PokemonType.ELECTRIC, -1, 20, -1, 0, 6)
      .attr(AddBattlerTagAttr, BattlerTagType.ELECTRIFIED, false, true),
    new AttackMove(MoveId.PLAY_ROUGH, PokemonType.FAIRY, MoveCategory.PHYSICAL, 90, 90, 10, 10, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1),
    new AttackMove(MoveId.FAIRY_WIND, PokemonType.FAIRY, MoveCategory.SPECIAL, 40, 100, 30, -1, 0, 6)
      .windMove(),
    new AttackMove(MoveId.MOONBLAST, PokemonType.FAIRY, MoveCategory.SPECIAL, 95, 100, 15, 30, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -1),
    new AttackMove(MoveId.BOOMBURST, PokemonType.NORMAL, MoveCategory.SPECIAL, 140, 100, 10, -1, 0, 6)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new StatusMove(MoveId.FAIRY_LOCK, PokemonType.FAIRY, -1, 10, -1, 0, 6)
      .ignoresSubstitute()
      .ignoresProtect()
      .target(MoveTarget.BOTH_SIDES)
      .attr(AddArenaTagAttr, ArenaTagType.FAIRY_LOCK, 2, true),
    new SelfStatusMove(MoveId.KINGS_SHIELD, PokemonType.STEEL, -1, 10, -1, 4, 6)
      .attr(ProtectAttr, BattlerTagType.KINGS_SHIELD)
      .condition(failIfLastCondition),
    new StatusMove(MoveId.PLAY_NICE, PokemonType.NORMAL, -1, 20, -1, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1)
      .ignoresSubstitute()
      .reflectable(),
    new StatusMove(MoveId.CONFIDE, PokemonType.NORMAL, -1, 20, -1, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -1)
      .soundBased()
      .reflectable(),
    new AttackMove(MoveId.DIAMOND_STORM, PokemonType.ROCK, MoveCategory.PHYSICAL, 100, 95, 5, 50, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 2, true, { firstTargetOnly: true })
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.STEAM_ERUPTION, PokemonType.WATER, MoveCategory.SPECIAL, 110, 95, 5, 30, 0, 6)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(HealStatusEffectAttr, false, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(MoveId.HYPERSPACE_HOLE, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 80, -1, 5, -1, 0, 6)
      .ignoresProtect()
      .ignoresSubstitute(),
    new AttackMove(MoveId.WATER_SHURIKEN, PokemonType.WATER, MoveCategory.SPECIAL, 15, 100, 20, -1, 1, 6)
      .attr(MultiHitAttr)
      .attr(WaterShurikenPowerAttr)
      .attr(WaterShurikenMultiHitTypeAttr),
    new AttackMove(MoveId.MYSTICAL_FIRE, PokemonType.FIRE, MoveCategory.SPECIAL, 75, 100, 10, 100, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -1),
    new SelfStatusMove(MoveId.SPIKY_SHIELD, PokemonType.GRASS, -1, 10, -1, 4, 6)
      .attr(ProtectAttr, BattlerTagType.SPIKY_SHIELD)
      .condition(failIfLastCondition),
    new StatusMove(MoveId.AROMATIC_MIST, PokemonType.FAIRY, -1, 20, -1, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], 1)
      .ignoresSubstitute()
      .condition(failIfSingleBattle)
      .target(MoveTarget.NEAR_ALLY),
    new StatusMove(MoveId.EERIE_IMPULSE, PokemonType.ELECTRIC, 100, 15, -1, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -2)
      .reflectable(),
    new StatusMove(MoveId.VENOM_DRENCH, PokemonType.POISON, 100, 20, -1, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPATK, Stat.SPD ], -1, false, { condition: (user, target, move) => target.status?.effect === StatusEffect.POISON || target.status?.effect === StatusEffect.TOXIC })
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .reflectable(),
    new StatusMove(MoveId.POWDER, PokemonType.BUG, 100, 20, -1, 1, 6)
      .attr(AddBattlerTagAttr, BattlerTagType.POWDER, false, true)
      .ignoresSubstitute()
      .powderMove()
      .reflectable(),
    new ChargingSelfStatusMove(MoveId.GEOMANCY, PokemonType.FAIRY, -1, 10, -1, 0, 6)
      .chargeText(i18next.t("moveTriggers:isChargingPower", { pokemonName: "{USER}" }))
      .attr(StatStageChangeAttr, [ Stat.SPATK, Stat.SPDEF, Stat.SPD ], 2, true),
    new StatusMove(MoveId.MAGNETIC_FLUX, PokemonType.ELECTRIC, -1, 20, -1, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.DEF, Stat.SPDEF ], 1, false, { condition: (user, target, move) => !![ AbilityId.PLUS, AbilityId.MINUS ].find(a => target.hasAbility(a, false)) })
      .ignoresSubstitute()
      .target(MoveTarget.USER_AND_ALLIES)
      .condition((user, target, move) => !![ user, user.getAlly() ].filter(p => p?.isActive()).find(p => !![ AbilityId.PLUS, AbilityId.MINUS ].find(a => p?.hasAbility(a, false)))),
    new StatusMove(MoveId.HAPPY_HOUR, PokemonType.NORMAL, -1, 30, -1, 0, 6) // No animation
      .attr(AddArenaTagAttr, ArenaTagType.HAPPY_HOUR, null, true)
      .target(MoveTarget.USER_SIDE),
    new StatusMove(MoveId.ELECTRIC_TERRAIN, PokemonType.ELECTRIC, -1, 10, -1, 0, 6)
      .attr(TerrainChangeAttr, TerrainType.ELECTRIC)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(MoveId.DAZZLING_GLEAM, PokemonType.FAIRY, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 6)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new SelfStatusMove(MoveId.CELEBRATE, PokemonType.NORMAL, -1, 40, -1, 0, 6)
      // NB: This needs a lambda function as the user will not be logged in by the time the moves are initialized
      .attr(MessageAttr, () => i18next.t("moveTriggers:celebrate", { playerName: loggedInUser?.username })),
    new StatusMove(MoveId.HOLD_HANDS, PokemonType.NORMAL, -1, 40, -1, 0, 6)
      .ignoresSubstitute()
      .target(MoveTarget.NEAR_ALLY),
    new StatusMove(MoveId.BABY_DOLL_EYES, PokemonType.FAIRY, 100, 30, -1, 1, 6)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1)
      .reflectable(),
    new AttackMove(MoveId.NUZZLE, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 20, 100, 20, 100, 0, 6)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(MoveId.HOLD_BACK, PokemonType.NORMAL, MoveCategory.PHYSICAL, 40, 100, 40, -1, 0, 6)
      .attr(SurviveDamageAttr),
    new AttackMove(MoveId.INFESTATION, PokemonType.BUG, MoveCategory.SPECIAL, 20, 100, 20, -1, 0, 6)
      .makesContact()
      .attr(TrapAttr, BattlerTagType.INFESTATION),
    new AttackMove(MoveId.POWER_UP_PUNCH, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 40, 100, 20, 100, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.ATK ], 1, true)
      .punchingMove(),
    new AttackMove(MoveId.OBLIVION_WING, PokemonType.FLYING, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 6)
      .attr(HitHealAttr, 0.75)
      .triageMove(),
    new AttackMove(MoveId.THOUSAND_ARROWS, PokemonType.GROUND, MoveCategory.PHYSICAL, 90, 100, 10, -1, 0, 6)
      .attr(NeutralDamageAgainstFlyingTypeMultiplierAttr)
      .attr(FallDownAttr)
      .attr(HitsTagAttr, BattlerTagType.FLYING)
      .attr(HitsTagAttr, BattlerTagType.FLOATING)
      .attr(AddBattlerTagAttr, BattlerTagType.INTERRUPTED)
      .attr(RemoveBattlerTagAttr, [ BattlerTagType.FLYING, BattlerTagType.FLOATING, BattlerTagType.TELEKINESIS ])
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.THOUSAND_WAVES, PokemonType.GROUND, MoveCategory.PHYSICAL, 90, 100, 10, 100, 0, 6)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, false, 1, 1, true)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.LANDS_WRATH, PokemonType.GROUND, MoveCategory.PHYSICAL, 90, 100, 10, -1, 0, 6)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.LIGHT_OF_RUIN, PokemonType.FAIRY, MoveCategory.SPECIAL, 140, 90, 5, -1, 0, 6)
      .attr(RecoilAttr, false, 0.5)
      .recklessMove(),
    new AttackMove(MoveId.ORIGIN_PULSE, PokemonType.WATER, MoveCategory.SPECIAL, 110, 85, 10, -1, 0, 6)
      .pulseMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.PRECIPICE_BLADES, PokemonType.GROUND, MoveCategory.PHYSICAL, 120, 85, 10, -1, 0, 6)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.DRAGON_ASCENT, PokemonType.FLYING, MoveCategory.PHYSICAL, 120, 100, 5, -1, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.DEF, Stat.SPDEF ], -1, true),
    new AttackMove(MoveId.HYPERSPACE_FURY, PokemonType.DARK, MoveCategory.PHYSICAL, 100, -1, 5, -1, 0, 6)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1, true)
      .ignoresSubstitute()
      .makesContact(false)
      .ignoresProtect(),
    /* Unused */
    new AttackMove(MoveId.BREAKNECK_BLITZ__PHYSICAL, PokemonType.NORMAL, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.BREAKNECK_BLITZ__SPECIAL, PokemonType.NORMAL, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.ALL_OUT_PUMMELING__PHYSICAL, PokemonType.FIGHTING, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.ALL_OUT_PUMMELING__SPECIAL, PokemonType.FIGHTING, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.SUPERSONIC_SKYSTRIKE__PHYSICAL, PokemonType.FLYING, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.SUPERSONIC_SKYSTRIKE__SPECIAL, PokemonType.FLYING, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.ACID_DOWNPOUR__PHYSICAL, PokemonType.POISON, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.ACID_DOWNPOUR__SPECIAL, PokemonType.POISON, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.TECTONIC_RAGE__PHYSICAL, PokemonType.GROUND, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.TECTONIC_RAGE__SPECIAL, PokemonType.GROUND, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.CONTINENTAL_CRUSH__PHYSICAL, PokemonType.ROCK, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.CONTINENTAL_CRUSH__SPECIAL, PokemonType.ROCK, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.SAVAGE_SPIN_OUT__PHYSICAL, PokemonType.BUG, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.SAVAGE_SPIN_OUT__SPECIAL, PokemonType.BUG, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.NEVER_ENDING_NIGHTMARE__PHYSICAL, PokemonType.GHOST, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.NEVER_ENDING_NIGHTMARE__SPECIAL, PokemonType.GHOST, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.CORKSCREW_CRASH__PHYSICAL, PokemonType.STEEL, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.CORKSCREW_CRASH__SPECIAL, PokemonType.STEEL, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.INFERNO_OVERDRIVE__PHYSICAL, PokemonType.FIRE, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.INFERNO_OVERDRIVE__SPECIAL, PokemonType.FIRE, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.HYDRO_VORTEX__PHYSICAL, PokemonType.WATER, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.HYDRO_VORTEX__SPECIAL, PokemonType.WATER, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.BLOOM_DOOM__PHYSICAL, PokemonType.GRASS, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.BLOOM_DOOM__SPECIAL, PokemonType.GRASS, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.GIGAVOLT_HAVOC__PHYSICAL, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.GIGAVOLT_HAVOC__SPECIAL, PokemonType.ELECTRIC, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.SHATTERED_PSYCHE__PHYSICAL, PokemonType.PSYCHIC, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.SHATTERED_PSYCHE__SPECIAL, PokemonType.PSYCHIC, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.SUBZERO_SLAMMER__PHYSICAL, PokemonType.ICE, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.SUBZERO_SLAMMER__SPECIAL, PokemonType.ICE, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.DEVASTATING_DRAKE__PHYSICAL, PokemonType.DRAGON, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.DEVASTATING_DRAKE__SPECIAL, PokemonType.DRAGON, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.BLACK_HOLE_ECLIPSE__PHYSICAL, PokemonType.DARK, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.BLACK_HOLE_ECLIPSE__SPECIAL, PokemonType.DARK, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.TWINKLE_TACKLE__PHYSICAL, PokemonType.FAIRY, MoveCategory.PHYSICAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.TWINKLE_TACKLE__SPECIAL, PokemonType.FAIRY, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.CATASTROPIKA, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 210, -1, 1, -1, 0, 7)
      .unimplemented(),
    /* End Unused */
    new SelfStatusMove(MoveId.SHORE_UP, PokemonType.GROUND, -1, 5, -1, 0, 7)
      .attr(SandHealAttr)
      .triageMove(),
    new AttackMove(MoveId.FIRST_IMPRESSION, PokemonType.BUG, MoveCategory.PHYSICAL, 90, 100, 10, -1, 2, 7)
      .condition(new FirstMoveCondition()),
    new SelfStatusMove(MoveId.BANEFUL_BUNKER, PokemonType.POISON, -1, 10, -1, 4, 7)
      .attr(ProtectAttr, BattlerTagType.BANEFUL_BUNKER)
      .condition(failIfLastCondition),
    new AttackMove(MoveId.SPIRIT_SHACKLE, PokemonType.GHOST, MoveCategory.PHYSICAL, 80, 100, 10, 100, 0, 7)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, false, 1, 1, true)
      .makesContact(false),
    new AttackMove(MoveId.DARKEST_LARIAT, PokemonType.DARK, MoveCategory.PHYSICAL, 85, 100, 10, -1, 0, 7)
      .attr(IgnoreOpponentStatStagesAttr),
    new AttackMove(MoveId.SPARKLING_ARIA, PokemonType.WATER, MoveCategory.SPECIAL, 90, 100, 10, 100, 0, 7)
      .attr(HealStatusEffectAttr, false, StatusEffect.BURN)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(MoveId.ICE_HAMMER, PokemonType.ICE, MoveCategory.PHYSICAL, 100, 90, 10, -1, 0, 7)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1, true)
      .punchingMove(),
    new StatusMove(MoveId.FLORAL_HEALING, PokemonType.FAIRY, -1, 10, -1, 0, 7)
      .attr(BoostHealAttr, 0.5, 2 / 3, true, false, (user, target, move) => globalScene.arena.terrain?.terrainType === TerrainType.GRASSY)
      .triageMove()
      .reflectable(),
    new AttackMove(MoveId.HIGH_HORSEPOWER, PokemonType.GROUND, MoveCategory.PHYSICAL, 95, 95, 10, -1, 0, 7),
    new StatusMove(MoveId.STRENGTH_SAP, PokemonType.GRASS, 100, 10, -1, 0, 7)
      .attr(HitHealAttr, null, Stat.ATK)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1)
      .condition((user, target, move) => target.getStatStage(Stat.ATK) > -6)
      .triageMove()
      .reflectable(),
    new ChargingAttackMove(MoveId.SOLAR_BLADE, PokemonType.GRASS, MoveCategory.PHYSICAL, 125, 100, 10, -1, 0, 7)
      .chargeText(i18next.t("moveTriggers:isGlowing", { pokemonName: "{USER}" }))
      .chargeAttr(WeatherInstantChargeAttr, [ WeatherType.SUNNY, WeatherType.HARSH_SUN ])
      .attr(AntiSunlightPowerDecreaseAttr)
      .slicingMove(),
    new AttackMove(MoveId.LEAFAGE, PokemonType.GRASS, MoveCategory.PHYSICAL, 40, 100, 40, -1, 0, 7)
      .makesContact(false),
    new StatusMove(MoveId.SPOTLIGHT, PokemonType.NORMAL, -1, 15, -1, 3, 7)
      .attr(AddBattlerTagAttr, BattlerTagType.CENTER_OF_ATTENTION, false)
      .condition(failIfSingleBattle)
      .reflectable(),
    new StatusMove(MoveId.TOXIC_THREAD, PokemonType.POISON, 100, 20, -1, 0, 7)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1)
      .reflectable(),
    new SelfStatusMove(MoveId.LASER_FOCUS, PokemonType.NORMAL, -1, 30, -1, 0, 7)
      .attr(AddBattlerTagAttr, BattlerTagType.ALWAYS_CRIT, true, false)
      .attr(MessageAttr, (user) =>
        i18next.t("battlerTags:laserFocusOnAdd", {
          pokemonNameWithAffix: getPokemonNameWithAffix(user),
        }),
      ),
    new StatusMove(MoveId.GEAR_UP, PokemonType.STEEL, -1, 20, -1, 0, 7)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPATK ], 1, false, { condition: (user, target, move) => !![ AbilityId.PLUS, AbilityId.MINUS ].find(a => target.hasAbility(a, false)) })
      .ignoresSubstitute()
      .target(MoveTarget.USER_AND_ALLIES)
      .condition((user, target, move) => !![ user, user.getAlly() ].filter(p => p?.isActive()).find(p => !![ AbilityId.PLUS, AbilityId.MINUS ].find(a => p?.hasAbility(a, false)))),
    new AttackMove(MoveId.THROAT_CHOP, PokemonType.DARK, MoveCategory.PHYSICAL, 80, 100, 15, 100, 0, 7)
      .attr(AddBattlerTagAttr, BattlerTagType.THROAT_CHOPPED),
    new AttackMove(MoveId.POLLEN_PUFF, PokemonType.BUG, MoveCategory.SPECIAL, 90, 100, 15, -1, 0, 7)
      .attr(StatusCategoryOnAllyAttr)
      .attr(HealOnAllyAttr, 0.5, true, false)
      .ballBombMove(),
    new AttackMove(MoveId.ANCHOR_SHOT, PokemonType.STEEL, MoveCategory.PHYSICAL, 80, 100, 20, 100, 0, 7)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, false, 1, 1, true),
    new StatusMove(MoveId.PSYCHIC_TERRAIN, PokemonType.PSYCHIC, -1, 10, -1, 0, 7)
      .attr(TerrainChangeAttr, TerrainType.PSYCHIC)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(MoveId.LUNGE, PokemonType.BUG, MoveCategory.PHYSICAL, 80, 100, 15, 100, 0, 7)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1),
    new AttackMove(MoveId.FIRE_LASH, PokemonType.FIRE, MoveCategory.PHYSICAL, 80, 100, 15, 100, 0, 7)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1),
    new AttackMove(MoveId.POWER_TRIP, PokemonType.DARK, MoveCategory.PHYSICAL, 20, 100, 10, -1, 0, 7)
      .attr(PositiveStatStagePowerAttr),
    new AttackMove(MoveId.BURN_UP, PokemonType.FIRE, MoveCategory.SPECIAL, 130, 100, 5, -1, 0, 7)
      .condition((user) => {
        const userTypes = user.getTypes(true);
        return userTypes.includes(PokemonType.FIRE);
      })
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(AddBattlerTagAttr, BattlerTagType.BURNED_UP, true, false)
      .attr(RemoveTypeAttr, PokemonType.FIRE, (user) => {
        globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:burnedItselfOut", { pokemonName: getPokemonNameWithAffix(user) }));
      }),
    new StatusMove(MoveId.SPEED_SWAP, PokemonType.PSYCHIC, -1, 10, -1, 0, 7)
      .attr(SwapStatAttr, Stat.SPD)
      .ignoresSubstitute(),
    new AttackMove(MoveId.SMART_STRIKE, PokemonType.STEEL, MoveCategory.PHYSICAL, 70, -1, 10, -1, 0, 7),
    new StatusMove(MoveId.PURIFY, PokemonType.POISON, -1, 20, -1, 0, 7)
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
    new AttackMove(MoveId.REVELATION_DANCE, PokemonType.NORMAL, MoveCategory.SPECIAL, 90, 100, 15, -1, 0, 7)
      .danceMove()
      .attr(MatchUserTypeAttr),
    new AttackMove(MoveId.CORE_ENFORCER, PokemonType.DRAGON, MoveCategory.SPECIAL, 100, 100, 10, -1, 0, 7)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .attr(SuppressAbilitiesIfActedAttr),
    new AttackMove(MoveId.TROP_KICK, PokemonType.GRASS, MoveCategory.PHYSICAL, 70, 100, 15, 100, 0, 7)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1),
    new StatusMove(MoveId.INSTRUCT, PokemonType.PSYCHIC, -1, 15, -1, 0, 7)
      .ignoresSubstitute()
      .attr(RepeatMoveAttr)
      /*
       * Incorrect interactions with Gigaton Hammer, Blood Moon & Torment due to them _failing on use_, not merely being unselectable.
       * Incorrectly ticks down Encore's fail counter
       * TODO: Verify whether Instruct can repeat Struggle
       * TODO: Verify whether Instruct can fail when using a copied move also in one's own moveset
       */
      .edgeCase(),
    new AttackMove(MoveId.BEAK_BLAST, PokemonType.FLYING, MoveCategory.PHYSICAL, 100, 100, 15, -1, -3, 7)
      .attr(BeakBlastHeaderAttr)
      .ballBombMove()
      .makesContact(false),
    new AttackMove(MoveId.CLANGING_SCALES, PokemonType.DRAGON, MoveCategory.SPECIAL, 110, 100, 5, -1, 0, 7)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1, true, { firstTargetOnly: true })
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.DRAGON_HAMMER, PokemonType.DRAGON, MoveCategory.PHYSICAL, 90, 100, 15, -1, 0, 7),
    new AttackMove(MoveId.BRUTAL_SWING, PokemonType.DARK, MoveCategory.PHYSICAL, 60, 100, 20, -1, 0, 7)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new StatusMove(MoveId.AURORA_VEIL, PokemonType.ICE, -1, 20, -1, 0, 7)
      .condition((user, target, move) => (globalScene.arena.weather?.weatherType === WeatherType.HAIL || globalScene.arena.weather?.weatherType === WeatherType.SNOW) && !globalScene.arena.weather?.isEffectSuppressed())
      .attr(AddArenaTagAttr, ArenaTagType.AURORA_VEIL, 5, true)
      .target(MoveTarget.USER_SIDE),
    /* Unused */
    new AttackMove(MoveId.SINISTER_ARROW_RAID, PokemonType.GHOST, MoveCategory.PHYSICAL, 180, -1, 1, -1, 0, 7)
      .unimplemented()
      .makesContact(false)
      .edgeCase(), // I assume it's because the user needs spirit shackle and decidueye
    new AttackMove(MoveId.MALICIOUS_MOONSAULT, PokemonType.DARK, MoveCategory.PHYSICAL, 180, -1, 1, -1, 0, 7)
      .unimplemented()
      .attr(AlwaysHitMinimizeAttr)
      .attr(HitsTagAttr, BattlerTagType.MINIMIZED, true)
      .edgeCase(), // I assume it's because it needs darkest lariat and incineroar
    new AttackMove(MoveId.OCEANIC_OPERETTA, PokemonType.WATER, MoveCategory.SPECIAL, 195, -1, 1, -1, 0, 7)
      .unimplemented()
      .edgeCase(), // I assume it's because it needs sparkling aria and primarina
    new AttackMove(MoveId.GUARDIAN_OF_ALOLA, PokemonType.FAIRY, MoveCategory.SPECIAL, -1, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.SOUL_STEALING_7_STAR_STRIKE, PokemonType.GHOST, MoveCategory.PHYSICAL, 195, -1, 1, -1, 0, 7)
      .unimplemented(),
    new AttackMove(MoveId.STOKED_SPARKSURFER, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 175, -1, 1, 100, 0, 7)
      .unimplemented()
      .edgeCase(), // I assume it's because it needs thunderbolt and Alola Raichu
    new AttackMove(MoveId.PULVERIZING_PANCAKE, PokemonType.NORMAL, MoveCategory.PHYSICAL, 210, -1, 1, -1, 0, 7)
      .unimplemented()
      .edgeCase(), // I assume it's because it needs giga impact and snorlax
    new SelfStatusMove(MoveId.EXTREME_EVOBOOST, PokemonType.NORMAL, -1, 1, -1, 0, 7)
      .unimplemented()
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD ], 2, true),
    new AttackMove(MoveId.GENESIS_SUPERNOVA, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 185, -1, 1, 100, 0, 7)
      .unimplemented()
      .attr(TerrainChangeAttr, TerrainType.PSYCHIC),
    /* End Unused */
    new AttackMove(MoveId.SHELL_TRAP, PokemonType.FIRE, MoveCategory.SPECIAL, 150, 100, 5, -1, -3, 7)
      .attr(AddBattlerTagHeaderAttr, BattlerTagType.SHELL_TRAP)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      // Fails if the user was not hit by a physical attack during the turn
      .condition((user, target, move) => user.getTag(ShellTrapTag)?.activated === true),
    new AttackMove(MoveId.FLEUR_CANNON, PokemonType.FAIRY, MoveCategory.SPECIAL, 130, 90, 5, -1, 0, 7)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -2, true),
    new AttackMove(MoveId.PSYCHIC_FANGS, PokemonType.PSYCHIC, MoveCategory.PHYSICAL, 85, 100, 10, -1, 0, 7)
      .bitingMove()
      .attr(RemoveScreensAttr),
    new AttackMove(MoveId.STOMPING_TANTRUM, PokemonType.GROUND, MoveCategory.PHYSICAL, 75, 100, 10, -1, 0, 7)
      .attr(MovePowerMultiplierAttr, (user) => {
        // Stomping tantrum triggers on most failures (including sleep/freeze)
        const lastNonDancerMove = user.getLastXMoves(2)[1] as TurnMove | undefined;
        return lastNonDancerMove && (lastNonDancerMove.result === MoveResult.MISS || lastNonDancerMove.result === MoveResult.FAIL) ? 2 : 1
      })
      // TODO: Review mainline accuracy and draft tests as needed
      .edgeCase(),
    new AttackMove(MoveId.SHADOW_BONE, PokemonType.GHOST, MoveCategory.PHYSICAL, 85, 100, 10, 20, 0, 7)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1)
      .makesContact(false),
    new AttackMove(MoveId.ACCELEROCK, PokemonType.ROCK, MoveCategory.PHYSICAL, 40, 100, 20, -1, 1, 7),
    new AttackMove(MoveId.LIQUIDATION, PokemonType.WATER, MoveCategory.PHYSICAL, 85, 100, 10, 20, 0, 7)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1),
    new AttackMove(MoveId.PRISMATIC_LASER, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 160, 100, 10, -1, 0, 7)
      .attr(RechargeAttr),
    new AttackMove(MoveId.SPECTRAL_THIEF, PokemonType.GHOST, MoveCategory.PHYSICAL, 90, 100, 10, -1, 0, 7)
      .attr(SpectralThiefAttr)
      .ignoresSubstitute(),
    new AttackMove(MoveId.SUNSTEEL_STRIKE, PokemonType.STEEL, MoveCategory.PHYSICAL, 100, 100, 5, -1, 0, 7)
      .ignoresAbilities(),
    new AttackMove(MoveId.MOONGEIST_BEAM, PokemonType.GHOST, MoveCategory.SPECIAL, 100, 100, 5, -1, 0, 7)
      .ignoresAbilities(),
    new StatusMove(MoveId.TEARFUL_LOOK, PokemonType.NORMAL, -1, 20, -1, 0, 7)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPATK ], -1)
      .reflectable(),
    new AttackMove(MoveId.ZING_ZAP, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 80, 100, 10, 30, 0, 7)
      .attr(FlinchAttr),
    new AttackMove(MoveId.NATURES_MADNESS, PokemonType.FAIRY, MoveCategory.SPECIAL, -1, 90, 10, -1, 0, 7)
      .attr(TargetHalfHpDamageAttr),
    new AttackMove(MoveId.MULTI_ATTACK, PokemonType.NORMAL, MoveCategory.PHYSICAL, 120, 100, 10, -1, 0, 7)
      .attr(FormChangeItemTypeAttr),
    /* Unused */
    new AttackMove(MoveId.TEN_MILLION_VOLT_THUNDERBOLT, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 195, -1, 1, -1, 0, 7)
      .unimplemented()
      .edgeCase(), // I assume it's because it needs thunderbolt and pikachu in a cap
    /* End Unused */
    new AttackMove(MoveId.MIND_BLOWN, PokemonType.FIRE, MoveCategory.SPECIAL, 150, 100, 5, -1, 0, 7)
      .condition(failIfDampCondition)
      .attr(HalfSacrificialAttr)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(MoveId.PLASMA_FISTS, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 100, 100, 15, -1, 0, 7)
      .attr(AddArenaTagAttr, ArenaTagType.ION_DELUGE, 1)
      .punchingMove(),
    new AttackMove(MoveId.PHOTON_GEYSER, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 100, 100, 5, -1, 0, 7)
      .attr(PhotonGeyserCategoryAttr)
      .ignoresAbilities(),
    /* Unused */
    new AttackMove(MoveId.LIGHT_THAT_BURNS_THE_SKY, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 200, -1, 1, -1, 0, 7)
      .unimplemented()
      .attr(PhotonGeyserCategoryAttr)
      .ignoresAbilities(),
    new AttackMove(MoveId.SEARING_SUNRAZE_SMASH, PokemonType.STEEL, MoveCategory.PHYSICAL, 200, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresAbilities(),
    new AttackMove(MoveId.MENACING_MOONRAZE_MAELSTROM, PokemonType.GHOST, MoveCategory.SPECIAL, 200, -1, 1, -1, 0, 7)
      .unimplemented()
      .ignoresAbilities(),
    new AttackMove(MoveId.LETS_SNUGGLE_FOREVER, PokemonType.FAIRY, MoveCategory.PHYSICAL, 190, -1, 1, -1, 0, 7)
      .unimplemented()
      .edgeCase(), // I assume it needs play rough and mimikyu
    new AttackMove(MoveId.SPLINTERED_STORMSHARDS, PokemonType.ROCK, MoveCategory.PHYSICAL, 190, -1, 1, -1, 0, 7)
      .unimplemented()
      .attr(ClearTerrainAttr)
      .makesContact(false),
    new AttackMove(MoveId.CLANGOROUS_SOULBLAZE, PokemonType.DRAGON, MoveCategory.SPECIAL, 185, -1, 1, 100, 0, 7)
      .unimplemented()
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD ], 1, true, { firstTargetOnly: true })
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .edgeCase(), // I assume it needs clanging scales and Kommo-O
    /* End Unused */
    new AttackMove(MoveId.ZIPPY_ZAP, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 50, 100, 15, -1, 2, 7) // LGPE Implementation
      .attr(CritOnlyAttr),
    new AttackMove(MoveId.SPLISHY_SPLASH, PokemonType.WATER, MoveCategory.SPECIAL, 90, 100, 15, 30, 0, 7)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.FLOATY_FALL, PokemonType.FLYING, MoveCategory.PHYSICAL, 90, 95, 15, 30, 0, 7)
      .attr(FlinchAttr),
    new AttackMove(MoveId.PIKA_PAPOW, PokemonType.ELECTRIC, MoveCategory.SPECIAL, -1, -1, 20, -1, 0, 7)
      .attr(FriendshipPowerAttr),
    new AttackMove(MoveId.BOUNCY_BUBBLE, PokemonType.WATER, MoveCategory.SPECIAL, 60, 100, 20, -1, 0, 7)
      .attr(HitHealAttr, 1)
      .triageMove(),
    new AttackMove(MoveId.BUZZY_BUZZ, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 60, 100, 20, 100, 0, 7)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(MoveId.SIZZLY_SLIDE, PokemonType.FIRE, MoveCategory.PHYSICAL, 60, 100, 20, 100, 0, 7)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(MoveId.GLITZY_GLOW, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 80, 95, 15, -1, 0, 7)
      .attr(AddArenaTagAttr, ArenaTagType.LIGHT_SCREEN, 5, false, true),
    new AttackMove(MoveId.BADDY_BAD, PokemonType.DARK, MoveCategory.SPECIAL, 80, 95, 15, -1, 0, 7)
      .attr(AddArenaTagAttr, ArenaTagType.REFLECT, 5, false, true),
    new AttackMove(MoveId.SAPPY_SEED, PokemonType.GRASS, MoveCategory.PHYSICAL, 100, 90, 10, -1, 0, 7)
      .attr(LeechSeedAttr)
      .makesContact(false),
    new AttackMove(MoveId.FREEZY_FROST, PokemonType.ICE, MoveCategory.SPECIAL, 100, 90, 10, -1, 0, 7)
      .attr(ResetStatsAttr, true),
    new AttackMove(MoveId.SPARKLY_SWIRL, PokemonType.FAIRY, MoveCategory.SPECIAL, 120, 85, 5, -1, 0, 7)
      .attr(PartyStatusCureAttr, null, AbilityId.NONE),
    new AttackMove(MoveId.VEEVEE_VOLLEY, PokemonType.NORMAL, MoveCategory.PHYSICAL, -1, -1, 20, -1, 0, 7)
      .attr(FriendshipPowerAttr),
    new AttackMove(MoveId.DOUBLE_IRON_BASH, PokemonType.STEEL, MoveCategory.PHYSICAL, 60, 100, 5, 30, 0, 7)
      .attr(MultiHitAttr, MultiHitType._2)
      .attr(FlinchAttr)
      .punchingMove(),
    /* Unused */
    new SelfStatusMove(MoveId.MAX_GUARD, PokemonType.NORMAL, -1, 10, -1, 4, 8)
      .unimplemented()
      .attr(ProtectAttr)
      .condition(failIfLastCondition),
    /* End Unused */
    new AttackMove(MoveId.DYNAMAX_CANNON, PokemonType.DRAGON, MoveCategory.SPECIAL, 100, 100, 5, -1, 0, 8)
      .attr(MovePowerMultiplierAttr, (user, target, move) => {
      // Move is only stronger against overleveled foes.
        if (target.level > globalScene.getMaxExpLevel()) {
          const dynamaxCannonPercentMarginBeforeFullDamage = 0.05; // How much % above MaxExpLevel of wave will the target need to be to take full damage.
          // The move's power scales as the margin is approached, reaching double power when it does or goes over it.
          return 1 + Math.min(1, (target.level - globalScene.getMaxExpLevel()) / (globalScene.getMaxExpLevel() * dynamaxCannonPercentMarginBeforeFullDamage));
        } else {
          return 1;
        }
      }),

    new AttackMove(MoveId.SNIPE_SHOT, PokemonType.WATER, MoveCategory.SPECIAL, 80, 100, 15, -1, 0, 8)
      .attr(HighCritAttr)
      .attr(BypassRedirectAttr),
    new AttackMove(MoveId.JAW_LOCK, PokemonType.DARK, MoveCategory.PHYSICAL, 80, 100, 10, -1, 0, 8)
      .attr(JawLockAttr)
      .bitingMove(),
    new SelfStatusMove(MoveId.STUFF_CHEEKS, PokemonType.NORMAL, -1, 10, -1, 0, 8)
      .attr(EatBerryAttr, true)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 2, true)
      .condition((user) => {
        const userBerries = globalScene.findModifiers(m => m instanceof BerryModifier, user.isPlayer());
        return userBerries.length > 0;
      })
      .edgeCase(), // Stuff Cheeks should not be selectable when the user does not have a berry, see wiki
    new SelfStatusMove(MoveId.NO_RETREAT, PokemonType.FIGHTING, -1, 5, -1, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD ], 1, true)
      .attr(AddBattlerTagAttr, BattlerTagType.NO_RETREAT, true, false)
      .condition((user, target, move) => user.getTag(TrappedTag)?.tagType !== BattlerTagType.NO_RETREAT), // fails if the user is currently trapped by No Retreat
    new StatusMove(MoveId.TAR_SHOT, PokemonType.ROCK, 100, 15, -1, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1)
      .attr(AddBattlerTagAttr, BattlerTagType.TAR_SHOT, false)
      .reflectable(),
    new StatusMove(MoveId.MAGIC_POWDER, PokemonType.PSYCHIC, 100, 20, -1, 0, 8)
      .attr(ChangeTypeAttr, PokemonType.PSYCHIC)
      .powderMove()
      .reflectable(),
    new AttackMove(MoveId.DRAGON_DARTS, PokemonType.DRAGON, MoveCategory.PHYSICAL, 50, 100, 10, -1, 0, 8)
      .attr(MultiHitAttr, MultiHitType._2)
      .makesContact(false)
      .partial(), // smart targetting is unimplemented
    new StatusMove(MoveId.TEATIME, PokemonType.NORMAL, -1, 10, -1, 0, 8)
      .attr(EatBerryAttr, false)
      .target(MoveTarget.ALL),
    new StatusMove(MoveId.OCTOLOCK, PokemonType.FIGHTING, 100, 15, -1, 0, 8)
      .condition(failIfGhostTypeCondition)
      .attr(AddBattlerTagAttr, BattlerTagType.OCTOLOCK, false, true, 1),
    new AttackMove(MoveId.BOLT_BEAK, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 85, 100, 10, -1, 0, 8)
      .attr(MovePowerMultiplierAttr, (_user, target) => target.turnData.acted ? 1 : 2),
    new AttackMove(MoveId.FISHIOUS_REND, PokemonType.WATER, MoveCategory.PHYSICAL, 85, 100, 10, -1, 0, 8)
      .attr(MovePowerMultiplierAttr, (_user, target) => target.turnData.acted ? 1 : 2)
      .bitingMove(),
    new StatusMove(MoveId.COURT_CHANGE, PokemonType.NORMAL, 100, 10, -1, 0, 8)
      .attr(SwapArenaTagsAttr, [ ArenaTagType.AURORA_VEIL, ArenaTagType.LIGHT_SCREEN, ArenaTagType.MIST, ArenaTagType.REFLECT, ArenaTagType.SPIKES, ArenaTagType.STEALTH_ROCK, ArenaTagType.STICKY_WEB, ArenaTagType.TAILWIND, ArenaTagType.TOXIC_SPIKES, ArenaTagType.SAFEGUARD, ArenaTagType.FIRE_GRASS_PLEDGE, ArenaTagType.WATER_FIRE_PLEDGE, ArenaTagType.GRASS_WATER_PLEDGE ]),
    /* Unused */
    new AttackMove(MoveId.MAX_FLARE, PokemonType.FIRE, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(MoveId.MAX_FLUTTERBY, PokemonType.BUG, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(MoveId.MAX_LIGHTNING, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(MoveId.MAX_STRIKE, PokemonType.NORMAL, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(MoveId.MAX_KNUCKLE, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(MoveId.MAX_PHANTASM, PokemonType.GHOST, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(MoveId.MAX_HAILSTORM, PokemonType.ICE, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(MoveId.MAX_OOZE, PokemonType.POISON, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(MoveId.MAX_GEYSER, PokemonType.WATER, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(MoveId.MAX_AIRSTREAM, PokemonType.FLYING, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(MoveId.MAX_STARFALL, PokemonType.FAIRY, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(MoveId.MAX_WYRMWIND, PokemonType.DRAGON, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(MoveId.MAX_MINDSTORM, PokemonType.PSYCHIC, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(MoveId.MAX_ROCKFALL, PokemonType.ROCK, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(MoveId.MAX_QUAKE, PokemonType.GROUND, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(MoveId.MAX_DARKNESS, PokemonType.DARK, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(MoveId.MAX_OVERGROWTH, PokemonType.GRASS, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    new AttackMove(MoveId.MAX_STEELSPIKE, PokemonType.STEEL, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.NEAR_ENEMY)
      .unimplemented(),
    /* End Unused */
    new SelfStatusMove(MoveId.CLANGOROUS_SOUL, PokemonType.DRAGON, 100, 5, -1, 0, 8)
      .attr(CutHpStatStageBoostAttr, [ Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD ], 1, 3)
      .soundBased()
      .danceMove(),
    new AttackMove(MoveId.BODY_PRESS, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 80, 100, 10, -1, 0, 8)
      .attr(DefAtkAttr),
    new StatusMove(MoveId.DECORATE, PokemonType.FAIRY, -1, 15, -1, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPATK ], 2)
      .ignoresProtect(),
    new AttackMove(MoveId.DRUM_BEATING, PokemonType.GRASS, MoveCategory.PHYSICAL, 80, 100, 10, 100, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1)
      .makesContact(false),
    new AttackMove(MoveId.SNAP_TRAP, PokemonType.GRASS, MoveCategory.PHYSICAL, 35, 100, 15, -1, 0, 8)
      .attr(TrapAttr, BattlerTagType.SNAP_TRAP),
    new AttackMove(MoveId.PYRO_BALL, PokemonType.FIRE, MoveCategory.PHYSICAL, 120, 90, 5, 10, 0, 8)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .ballBombMove()
      .makesContact(false),
    new AttackMove(MoveId.BEHEMOTH_BLADE, PokemonType.STEEL, MoveCategory.PHYSICAL, 100, 100, 5, -1, 0, 8)
      .slicingMove(),
    new AttackMove(MoveId.BEHEMOTH_BASH, PokemonType.STEEL, MoveCategory.PHYSICAL, 100, 100, 5, -1, 0, 8),
    new AttackMove(MoveId.AURA_WHEEL, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 110, 100, 10, 100, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.SPD ], 1, true)
      .makesContact(false)
      .attr(AuraWheelTypeAttr),
    new AttackMove(MoveId.BREAKING_SWIPE, PokemonType.DRAGON, MoveCategory.PHYSICAL, 60, 100, 15, 100, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1),
    new AttackMove(MoveId.BRANCH_POKE, PokemonType.GRASS, MoveCategory.PHYSICAL, 40, 100, 40, -1, 0, 8),
    new AttackMove(MoveId.OVERDRIVE, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 8)
      .soundBased()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.APPLE_ACID, PokemonType.GRASS, MoveCategory.SPECIAL, 80, 100, 10, 100, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -1),
    new AttackMove(MoveId.GRAV_APPLE, PokemonType.GRASS, MoveCategory.PHYSICAL, 80, 100, 10, 100, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1)
      .attr(MovePowerMultiplierAttr, (user, target, move) => globalScene.arena.getTag(ArenaTagType.GRAVITY) ? 1.5 : 1)
      .makesContact(false),
    new AttackMove(MoveId.SPIRIT_BREAK, PokemonType.FAIRY, MoveCategory.PHYSICAL, 75, 100, 15, 100, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -1),
    new AttackMove(MoveId.STRANGE_STEAM, PokemonType.FAIRY, MoveCategory.SPECIAL, 90, 95, 10, 20, 0, 8)
      .attr(ConfuseAttr),
    new StatusMove(MoveId.LIFE_DEW, PokemonType.WATER, -1, 10, -1, 0, 8)
      .attr(HealAttr, 0.25, true, false)
      .target(MoveTarget.USER_AND_ALLIES)
      .ignoresProtect()
      .triageMove(),
    new SelfStatusMove(MoveId.OBSTRUCT, PokemonType.DARK, 100, 10, -1, 4, 8)
      .attr(ProtectAttr, BattlerTagType.OBSTRUCT)
      .condition(failIfLastCondition),
    new AttackMove(MoveId.FALSE_SURRENDER, PokemonType.DARK, MoveCategory.PHYSICAL, 80, -1, 10, -1, 0, 8),
    new AttackMove(MoveId.METEOR_ASSAULT, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 150, 100, 5, -1, 0, 8)
      .attr(RechargeAttr)
      .makesContact(false),
    new AttackMove(MoveId.ETERNABEAM, PokemonType.DRAGON, MoveCategory.SPECIAL, 160, 90, 5, -1, 0, 8)
      .attr(RechargeAttr),
    new AttackMove(MoveId.STEEL_BEAM, PokemonType.STEEL, MoveCategory.SPECIAL, 140, 95, 5, -1, 0, 8)
      .attr(HalfSacrificialAttr),
    new AttackMove(MoveId.EXPANDING_FORCE, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 8)
      .attr(MovePowerMultiplierAttr, (user, target, move) => globalScene.arena.getTerrainType() === TerrainType.PSYCHIC && user.isGrounded() ? 1.5 : 1)
      .attr(VariableTargetAttr, (user, target, move) => globalScene.arena.getTerrainType() === TerrainType.PSYCHIC && user.isGrounded() ? MoveTarget.ALL_NEAR_ENEMIES : MoveTarget.NEAR_OTHER),
    new AttackMove(MoveId.STEEL_ROLLER, PokemonType.STEEL, MoveCategory.PHYSICAL, 130, 100, 5, -1, 0, 8)
      .attr(ClearTerrainAttr)
      .condition((user, target, move) => !!globalScene.arena.terrain),
    new AttackMove(MoveId.SCALE_SHOT, PokemonType.DRAGON, MoveCategory.PHYSICAL, 25, 90, 20, -1, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.SPD ], 1, true, { lastHitOnly: true })
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1, true, { lastHitOnly: true })
      .attr(MultiHitAttr)
      .makesContact(false),
    new ChargingAttackMove(MoveId.METEOR_BEAM, PokemonType.ROCK, MoveCategory.SPECIAL, 120, 90, 10, -1, 0, 8)
      .chargeText(i18next.t("moveTriggers:isOverflowingWithSpacePower", { pokemonName: "{USER}" }))
      .chargeAttr(StatStageChangeAttr, [ Stat.SPATK ], 1, true),
    new AttackMove(MoveId.SHELL_SIDE_ARM, PokemonType.POISON, MoveCategory.SPECIAL, 90, 100, 10, 20, 0, 8)
      .attr(ShellSideArmCategoryAttr)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .partial(), // Physical version of the move does not make contact
    new AttackMove(MoveId.MISTY_EXPLOSION, PokemonType.FAIRY, MoveCategory.SPECIAL, 100, 100, 5, -1, 0, 8)
      .attr(SacrificialAttr)
      .target(MoveTarget.ALL_NEAR_OTHERS)
      .attr(MovePowerMultiplierAttr, (user, target, move) => globalScene.arena.getTerrainType() === TerrainType.MISTY && user.isGrounded() ? 1.5 : 1)
      .condition(failIfDampCondition)
      .makesContact(false),
    new AttackMove(MoveId.GRASSY_GLIDE, PokemonType.GRASS, MoveCategory.PHYSICAL, 55, 100, 20, -1, 0, 8)
      .attr(IncrementMovePriorityAttr, (user, target, move) => globalScene.arena.getTerrainType() === TerrainType.GRASSY && user.isGrounded()),
    new AttackMove(MoveId.RISING_VOLTAGE, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 70, 100, 20, -1, 0, 8)
      .attr(MovePowerMultiplierAttr, (user, target, move) => globalScene.arena.getTerrainType() === TerrainType.ELECTRIC && target.isGrounded() ? 2 : 1),
    new AttackMove(MoveId.TERRAIN_PULSE, PokemonType.NORMAL, MoveCategory.SPECIAL, 50, 100, 10, -1, 0, 8)
      .attr(TerrainPulseTypeAttr)
      .attr(MovePowerMultiplierAttr, (user, target, move) => globalScene.arena.getTerrainType() !== TerrainType.NONE && user.isGrounded() ? 2 : 1)
      .pulseMove(),
    new AttackMove(MoveId.SKITTER_SMACK, PokemonType.BUG, MoveCategory.PHYSICAL, 70, 90, 10, 100, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -1),
    new AttackMove(MoveId.BURNING_JEALOUSY, PokemonType.FIRE, MoveCategory.SPECIAL, 70, 100, 5, 100, 0, 8)
      .attr(StatusIfBoostedAttr, StatusEffect.BURN)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.LASH_OUT, PokemonType.DARK, MoveCategory.PHYSICAL, 75, 100, 5, -1, 0, 8)
      .attr(MovePowerMultiplierAttr, (user, _target, _move) => user.turnData.statStagesDecreased ? 2 : 1),
    new AttackMove(MoveId.POLTERGEIST, PokemonType.GHOST, MoveCategory.PHYSICAL, 110, 90, 5, -1, 0, 8)
      .condition(failIfNoTargetHeldItemsCondition)
      .attr(PreMoveMessageAttr, attackedByItemMessageFunc)
      .makesContact(false),
    new StatusMove(MoveId.CORROSIVE_GAS, PokemonType.POISON, 100, 40, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_OTHERS)
      .reflectable()
      .unimplemented(),
    new StatusMove(MoveId.COACHING, PokemonType.FIGHTING, -1, 10, -1, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF ], 1)
      .target(MoveTarget.NEAR_ALLY)
      .condition(failIfSingleBattle),
    new AttackMove(MoveId.FLIP_TURN, PokemonType.WATER, MoveCategory.PHYSICAL, 60, 100, 20, -1, 0, 8)
      .attr(ForceSwitchOutAttr, true),
    new AttackMove(MoveId.TRIPLE_AXEL, PokemonType.ICE, MoveCategory.PHYSICAL, 20, 90, 10, -1, 0, 8)
      .attr(MultiHitAttr, MultiHitType._3)
      .attr(MultiHitPowerIncrementAttr, 3)
      .checkAllHits(),
    new AttackMove(MoveId.DUAL_WINGBEAT, PokemonType.FLYING, MoveCategory.PHYSICAL, 40, 90, 10, -1, 0, 8)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(MoveId.SCORCHING_SANDS, PokemonType.GROUND, MoveCategory.SPECIAL, 70, 100, 10, 30, 0, 8)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(HealStatusEffectAttr, false, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new StatusMove(MoveId.JUNGLE_HEALING, PokemonType.GRASS, -1, 10, -1, 0, 8)
      .attr(HealAttr, 0.25, true, false)
      .attr(HealStatusEffectAttr, false, getNonVolatileStatusEffects())
      .target(MoveTarget.USER_AND_ALLIES)
      .triageMove(),
    new AttackMove(MoveId.WICKED_BLOW, PokemonType.DARK, MoveCategory.PHYSICAL, 75, 100, 5, -1, 0, 8)
      .attr(CritOnlyAttr)
      .punchingMove(),
    new AttackMove(MoveId.SURGING_STRIKES, PokemonType.WATER, MoveCategory.PHYSICAL, 25, 100, 5, -1, 0, 8)
      .attr(MultiHitAttr, MultiHitType._3)
      .attr(CritOnlyAttr)
      .punchingMove(),
    new AttackMove(MoveId.THUNDER_CAGE, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 80, 90, 15, -1, 0, 8)
      .attr(TrapAttr, BattlerTagType.THUNDER_CAGE),
    new AttackMove(MoveId.DRAGON_ENERGY, PokemonType.DRAGON, MoveCategory.SPECIAL, 150, 100, 5, -1, 0, 8)
      .attr(HpPowerAttr)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.FREEZING_GLARE, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 90, 100, 10, 10, 0, 8)
      .attr(StatusEffectAttr, StatusEffect.FREEZE),
    new AttackMove(MoveId.FIERY_WRATH, PokemonType.DARK, MoveCategory.SPECIAL, 90, 100, 10, 20, 0, 8)
      .attr(FlinchAttr)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.THUNDEROUS_KICK, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 90, 100, 10, 100, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1),
    new AttackMove(MoveId.GLACIAL_LANCE, PokemonType.ICE, MoveCategory.PHYSICAL, 120, 100, 5, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .makesContact(false),
    new AttackMove(MoveId.ASTRAL_BARRAGE, PokemonType.GHOST, MoveCategory.SPECIAL, 120, 100, 5, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.EERIE_SPELL, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 5, 100, 0, 8)
      .attr(AttackReducePpMoveAttr, 3)
      .soundBased(),
    new AttackMove(MoveId.DIRE_CLAW, PokemonType.POISON, MoveCategory.PHYSICAL, 80, 100, 15, 50, 0, 8)
      .attr(MultiStatusEffectAttr, [ StatusEffect.POISON, StatusEffect.PARALYSIS, StatusEffect.SLEEP ]),
    new AttackMove(MoveId.PSYSHIELD_BASH, PokemonType.PSYCHIC, MoveCategory.PHYSICAL, 70, 90, 10, 100, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 1, true),
    new SelfStatusMove(MoveId.POWER_SHIFT, PokemonType.NORMAL, -1, 10, -1, 0, 8)
      .target(MoveTarget.USER)
      .attr(ShiftStatAttr, Stat.ATK, Stat.DEF),
    new AttackMove(MoveId.STONE_AXE, PokemonType.ROCK, MoveCategory.PHYSICAL, 65, 90, 15, 100, 0, 8)
      .attr(AddArenaTrapTagHitAttr, ArenaTagType.STEALTH_ROCK)
      .slicingMove(),
    new AttackMove(MoveId.SPRINGTIDE_STORM, PokemonType.FAIRY, MoveCategory.SPECIAL, 100, 80, 5, 30, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.MYSTICAL_POWER, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 70, 90, 10, 100, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], 1, true),
    new AttackMove(MoveId.RAGING_FURY, PokemonType.FIRE, MoveCategory.PHYSICAL, 120, 100, 10, -1, 0, 8)
      .makesContact(false)
      .attr(FrenzyAttr)
      .attr(MissEffectAttr, frenzyMissFunc)
      .attr(NoEffectAttr, frenzyMissFunc)
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new AttackMove(MoveId.WAVE_CRASH, PokemonType.WATER, MoveCategory.PHYSICAL, 120, 100, 10, -1, 0, 8)
      .attr(RecoilAttr, false, 0.33)
      .recklessMove(),
    new AttackMove(MoveId.CHLOROBLAST, PokemonType.GRASS, MoveCategory.SPECIAL, 150, 95, 5, -1, 0, 8)
      .attr(RecoilAttr, true, 0.5),
    new AttackMove(MoveId.MOUNTAIN_GALE, PokemonType.ICE, MoveCategory.PHYSICAL, 100, 85, 10, 30, 0, 8)
      .makesContact(false)
      .attr(FlinchAttr),
    new SelfStatusMove(MoveId.VICTORY_DANCE, PokemonType.FIGHTING, -1, 10, -1, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.DEF, Stat.SPD ], 1, true)
      .danceMove(),
    new AttackMove(MoveId.HEADLONG_RUSH, PokemonType.GROUND, MoveCategory.PHYSICAL, 120, 100, 5, -1, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.DEF, Stat.SPDEF ], -1, true)
      .punchingMove(),
    new AttackMove(MoveId.BARB_BARRAGE, PokemonType.POISON, MoveCategory.PHYSICAL, 60, 100, 10, 50, 0, 8)
      .makesContact(false)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.status && (target.status.effect === StatusEffect.POISON || target.status.effect === StatusEffect.TOXIC) ? 2 : 1)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(MoveId.ESPER_WING, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 10, 100, 0, 8)
      .attr(HighCritAttr)
      .attr(StatStageChangeAttr, [ Stat.SPD ], 1, true),
    new AttackMove(MoveId.BITTER_MALICE, PokemonType.GHOST, MoveCategory.SPECIAL, 75, 100, 10, 100, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1),
    new SelfStatusMove(MoveId.SHELTER, PokemonType.STEEL, -1, 10, -1, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.DEF ], 2, true),
    new AttackMove(MoveId.TRIPLE_ARROWS, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 90, 100, 10, 30, 0, 8)
      .makesContact(false)
      .attr(HighCritAttr)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -1, false, { effectChanceOverride: 50 })
      .attr(FlinchAttr),
    new AttackMove(MoveId.INFERNAL_PARADE, PokemonType.GHOST, MoveCategory.SPECIAL, 60, 100, 15, 30, 0, 8)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.status ? 2 : 1),
    new AttackMove(MoveId.CEASELESS_EDGE, PokemonType.DARK, MoveCategory.PHYSICAL, 65, 90, 15, 100, 0, 8)
      .attr(AddArenaTrapTagHitAttr, ArenaTagType.SPIKES)
      .slicingMove(),
    new AttackMove(MoveId.BLEAKWIND_STORM, PokemonType.FLYING, MoveCategory.SPECIAL, 100, 80, 10, 30, 0, 8)
      .attr(StormAccuracyAttr)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.WILDBOLT_STORM, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 100, 80, 10, 20, 0, 8)
      .attr(StormAccuracyAttr)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.SANDSEAR_STORM, PokemonType.GROUND, MoveCategory.SPECIAL, 100, 80, 10, 20, 0, 8)
      .attr(StormAccuracyAttr)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .windMove()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(MoveId.LUNAR_BLESSING, PokemonType.PSYCHIC, -1, 5, -1, 0, 8)
      .attr(HealAttr, 0.25, true, false)
      .attr(HealStatusEffectAttr, false, getNonVolatileStatusEffects())
      .target(MoveTarget.USER_AND_ALLIES)
      .triageMove(),
    new SelfStatusMove(MoveId.TAKE_HEART, PokemonType.PSYCHIC, -1, 10, -1, 0, 8)
      .attr(StatStageChangeAttr, [ Stat.SPATK, Stat.SPDEF ], 1, true)
      .attr(HealStatusEffectAttr, true, [ StatusEffect.PARALYSIS, StatusEffect.POISON, StatusEffect.TOXIC, StatusEffect.BURN, StatusEffect.SLEEP ]),
    /* Unused
    new AttackMove(MoveId.G_MAX_WILDFIRE, PokemonType.Fire, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(MoveId.G_MAX_BEFUDDLE, Type.BUG, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(MoveId.G_MAX_VOLT_CRASH, Type.ELECTRIC, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(MoveId.G_MAX_GOLD_RUSH, Type.NORMAL, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(MoveId.G_MAX_CHI_STRIKE, Type.FIGHTING, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(MoveId.G_MAX_TERROR, Type.GHOST, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(MoveId.G_MAX_RESONANCE, Type.ICE, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(MoveId.G_MAX_CUDDLE, Type.NORMAL, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(MoveId.G_MAX_REPLENISH, Type.NORMAL, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(MoveId.G_MAX_MALODOR, Type.POISON, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(MoveId.G_MAX_STONESURGE, Type.WATER, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(MoveId.G_MAX_WIND_RAGE, Type.FLYING, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(MoveId.G_MAX_STUN_SHOCK, Type.ELECTRIC, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(MoveId.G_MAX_FINALE, Type.FAIRY, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(MoveId.G_MAX_DEPLETION, Type.DRAGON, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(MoveId.G_MAX_GRAVITAS, Type.PSYCHIC, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(MoveId.G_MAX_VOLCALITH, Type.ROCK, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(MoveId.G_MAX_SANDBLAST, Type.GROUND, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(MoveId.G_MAX_SNOOZE, Type.DARK, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(MoveId.G_MAX_TARTNESS, Type.GRASS, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(MoveId.G_MAX_SWEETNESS, Type.GRASS, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(MoveId.G_MAX_SMITE, Type.FAIRY, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(MoveId.G_MAX_STEELSURGE, Type.STEEL, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(MoveId.G_MAX_MELTDOWN, Type.STEEL, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(MoveId.G_MAX_FOAM_BURST, Type.WATER, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(MoveId.G_MAX_CENTIFERNO, PokemonType.Fire, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(MoveId.G_MAX_VINE_LASH, Type.GRASS, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(MoveId.G_MAX_CANNONADE, Type.WATER, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(MoveId.G_MAX_DRUM_SOLO, Type.GRASS, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(MoveId.G_MAX_FIREBALL, PokemonType.Fire, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(MoveId.G_MAX_HYDROSNIPE, Type.WATER, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(MoveId.G_MAX_ONE_BLOW, Type.DARK, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    new AttackMove(MoveId.G_MAX_RAPID_FLOW, Type.WATER, MoveCategory.PHYSICAL, 10, -1, 10, -1, 0, 8)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .unimplemented(),
    End Unused */
    new AttackMove(MoveId.TERA_BLAST, PokemonType.NORMAL, MoveCategory.SPECIAL, 80, 100, 10, -1, 0, 9)
      .attr(TeraMoveCategoryAttr)
      .attr(TeraBlastTypeAttr)
      .attr(TeraBlastPowerAttr)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPATK ], -1, true, { condition: (user, target, move) => user.isTerastallized && user.isOfType(PokemonType.STELLAR) }),
    new SelfStatusMove(MoveId.SILK_TRAP, PokemonType.BUG, -1, 10, -1, 4, 9)
      .attr(ProtectAttr, BattlerTagType.SILK_TRAP)
      .condition(failIfLastCondition),
    new AttackMove(MoveId.AXE_KICK, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 120, 90, 10, 30, 0, 9)
      .attr(MissEffectAttr, crashDamageFunc)
      .attr(NoEffectAttr, crashDamageFunc)
      .attr(ConfuseAttr)
      .recklessMove(),
    new AttackMove(MoveId.LAST_RESPECTS, PokemonType.GHOST, MoveCategory.PHYSICAL, 50, 100, 10, -1, 0, 9)
      .attr(MovePowerMultiplierAttr, (user, target, move) => 1 + Math.min(user.isPlayer() ? globalScene.arena.playerFaints : globalScene.currentBattle.enemyFaints, 100))
      .makesContact(false),
    new AttackMove(MoveId.LUMINA_CRASH, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 10, 100, 0, 9)
      .attr(StatStageChangeAttr, [ Stat.SPDEF ], -2),
    new AttackMove(MoveId.ORDER_UP, PokemonType.DRAGON, MoveCategory.PHYSICAL, 80, 100, 10, -1, 0, 9)
      .attr(OrderUpStatBoostAttr)
      .makesContact(false),
    new AttackMove(MoveId.JET_PUNCH, PokemonType.WATER, MoveCategory.PHYSICAL, 60, 100, 15, -1, 1, 9)
      .punchingMove(),
    new StatusMove(MoveId.SPICY_EXTRACT, PokemonType.GRASS, -1, 15, -1, 0, 9)
      .attr(StatStageChangeAttr, [ Stat.ATK ], 2)
      .attr(StatStageChangeAttr, [ Stat.DEF ], -2),
    new AttackMove(MoveId.SPIN_OUT, PokemonType.STEEL, MoveCategory.PHYSICAL, 100, 100, 5, -1, 0, 9)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -2, true),
    new AttackMove(MoveId.POPULATION_BOMB, PokemonType.NORMAL, MoveCategory.PHYSICAL, 20, 90, 10, -1, 0, 9)
      .attr(MultiHitAttr, MultiHitType._10)
      .slicingMove()
      .checkAllHits(),
    new AttackMove(MoveId.ICE_SPINNER, PokemonType.ICE, MoveCategory.PHYSICAL, 80, 100, 15, -1, 0, 9)
      .attr(ClearTerrainAttr),
    new AttackMove(MoveId.GLAIVE_RUSH, PokemonType.DRAGON, MoveCategory.PHYSICAL, 120, 100, 5, -1, 0, 9)
      .attr(AddBattlerTagAttr, BattlerTagType.ALWAYS_GET_HIT, true, false, 0, 0, true)
      .attr(AddBattlerTagAttr, BattlerTagType.RECEIVE_DOUBLE_DAMAGE, true, false, 0, 0, true)
      .condition((user, target, move) => {
        return !(target.getTag(BattlerTagType.PROTECTED)?.tagType === "PROTECTED" || globalScene.arena.getTag(ArenaTagType.MAT_BLOCK)?.tagType === "MAT_BLOCK");
      }),
    new StatusMove(MoveId.REVIVAL_BLESSING, PokemonType.NORMAL, -1, 1, -1, 0, 9)
      .triageMove()
      .attr(RevivalBlessingAttr)
      .target(MoveTarget.USER),
    new AttackMove(MoveId.SALT_CURE, PokemonType.ROCK, MoveCategory.PHYSICAL, 40, 100, 15, 100, 0, 9)
      .attr(AddBattlerTagAttr, BattlerTagType.SALT_CURED)
      .makesContact(false),
    new AttackMove(MoveId.TRIPLE_DIVE, PokemonType.WATER, MoveCategory.PHYSICAL, 30, 95, 10, -1, 0, 9)
      .attr(MultiHitAttr, MultiHitType._3),
    new AttackMove(MoveId.MORTAL_SPIN, PokemonType.POISON, MoveCategory.PHYSICAL, 30, 100, 15, 100, 0, 9)
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
    new StatusMove(MoveId.DOODLE, PokemonType.NORMAL, 100, 10, -1, 0, 9)
      .attr(AbilityCopyAttr, true),
    new SelfStatusMove(MoveId.FILLET_AWAY, PokemonType.NORMAL, -1, 10, -1, 0, 9)
      .attr(CutHpStatStageBoostAttr, [ Stat.ATK, Stat.SPATK, Stat.SPD ], 2, 2),
    new AttackMove(MoveId.KOWTOW_CLEAVE, PokemonType.DARK, MoveCategory.PHYSICAL, 85, -1, 10, -1, 0, 9)
      .slicingMove(),
    new AttackMove(MoveId.FLOWER_TRICK, PokemonType.GRASS, MoveCategory.PHYSICAL, 70, -1, 10, -1, 0, 9)
      .attr(CritOnlyAttr)
      .makesContact(false),
    new AttackMove(MoveId.TORCH_SONG, PokemonType.FIRE, MoveCategory.SPECIAL, 80, 100, 10, 100, 0, 9)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], 1, true)
      .soundBased(),
    new AttackMove(MoveId.AQUA_STEP, PokemonType.WATER, MoveCategory.PHYSICAL, 80, 100, 10, 100, 0, 9)
      .attr(StatStageChangeAttr, [ Stat.SPD ], 1, true)
      .danceMove(),
    new AttackMove(MoveId.RAGING_BULL, PokemonType.NORMAL, MoveCategory.PHYSICAL, 90, 100, 10, -1, 0, 9)
      .attr(RagingBullTypeAttr)
      .attr(RemoveScreensAttr),
    new AttackMove(MoveId.MAKE_IT_RAIN, PokemonType.STEEL, MoveCategory.SPECIAL, 120, 100, 5, -1, 0, 9)
      .attr(MoneyAttr)
      .attr(StatStageChangeAttr, [ Stat.SPATK ], -1, true, { firstTargetOnly: true })
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(MoveId.PSYBLADE, PokemonType.PSYCHIC, MoveCategory.PHYSICAL, 80, 100, 15, -1, 0, 9)
      .attr(MovePowerMultiplierAttr, (user, target, move) => globalScene.arena.getTerrainType() === TerrainType.ELECTRIC && user.isGrounded() ? 1.5 : 1)
      .slicingMove(),
    new AttackMove(MoveId.HYDRO_STEAM, PokemonType.WATER, MoveCategory.SPECIAL, 80, 100, 15, -1, 0, 9)
      .attr(IgnoreWeatherTypeDebuffAttr, WeatherType.SUNNY)
      .attr(MovePowerMultiplierAttr, (user, target, move) => {
        const weather = globalScene.arena.weather;
        if (!weather) {
          return 1;
        }
        return [ WeatherType.SUNNY, WeatherType.HARSH_SUN ].includes(weather.weatherType) && !weather.isEffectSuppressed() ? 1.5 : 1;
      }),
    new AttackMove(MoveId.RUINATION, PokemonType.DARK, MoveCategory.SPECIAL, -1, 90, 10, -1, 0, 9)
      .attr(TargetHalfHpDamageAttr),
    new AttackMove(MoveId.COLLISION_COURSE, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 100, 100, 5, -1, 0, 9)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.getAttackTypeEffectiveness(move.type, user) >= 2 ? 4 / 3 : 1),
    new AttackMove(MoveId.ELECTRO_DRIFT, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 100, 100, 5, -1, 0, 9)
      .attr(MovePowerMultiplierAttr, (user, target, move) => target.getAttackTypeEffectiveness(move.type, user) >= 2 ? 4 / 3 : 1)
      .makesContact(),
    new SelfStatusMove(MoveId.SHED_TAIL, PokemonType.NORMAL, -1, 10, -1, 0, 9)
      .attr(AddSubstituteAttr, 0.5, true)
      .attr(ForceSwitchOutAttr, true, SwitchType.SHED_TAIL)
      .condition(failIfLastInPartyCondition),
    new SelfStatusMove(MoveId.CHILLY_RECEPTION, PokemonType.ICE, -1, 10, -1, 0, 9)
      .attr(PreMoveMessageAttr, (user, _target, _move) =>
        // Don't display text if current move phase is follow up (ie move called indirectly)
        isVirtual((globalScene.phaseManager.getCurrentPhase() as MovePhase).useMode)
          ? ""
          : i18next.t("moveTriggers:chillyReception", { pokemonName: getPokemonNameWithAffix(user) }))
      .attr(ChillyReceptionAttr, true),
    new SelfStatusMove(MoveId.TIDY_UP, PokemonType.NORMAL, -1, 10, -1, 0, 9)
      .attr(StatStageChangeAttr, [ Stat.ATK, Stat.SPD ], 1, true)
      .attr(RemoveArenaTrapAttr, true)
      .attr(RemoveAllSubstitutesAttr),
    new StatusMove(MoveId.SNOWSCAPE, PokemonType.ICE, -1, 10, -1, 0, 9)
      .attr(WeatherChangeAttr, WeatherType.SNOW)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(MoveId.POUNCE, PokemonType.BUG, MoveCategory.PHYSICAL, 50, 100, 20, 100, 0, 9)
      .attr(StatStageChangeAttr, [ Stat.SPD ], -1),
    new AttackMove(MoveId.TRAILBLAZE, PokemonType.GRASS, MoveCategory.PHYSICAL, 50, 100, 20, 100, 0, 9)
      .attr(StatStageChangeAttr, [ Stat.SPD ], 1, true),
    new AttackMove(MoveId.CHILLING_WATER, PokemonType.WATER, MoveCategory.SPECIAL, 50, 100, 20, 100, 0, 9)
      .attr(StatStageChangeAttr, [ Stat.ATK ], -1),
    new AttackMove(MoveId.HYPER_DRILL, PokemonType.NORMAL, MoveCategory.PHYSICAL, 100, 100, 5, -1, 0, 9)
      .ignoresProtect(),
    new AttackMove(MoveId.TWIN_BEAM, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 40, 100, 10, -1, 0, 9)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(MoveId.RAGE_FIST, PokemonType.GHOST, MoveCategory.PHYSICAL, 50, 100, 10, -1, 0, 9)
      .attr(RageFistPowerAttr)
      .punchingMove(),
    new AttackMove(MoveId.ARMOR_CANNON, PokemonType.FIRE, MoveCategory.SPECIAL, 120, 100, 5, -1, 0, 9)
      .attr(StatStageChangeAttr, [ Stat.DEF, Stat.SPDEF ], -1, true),
    new AttackMove(MoveId.BITTER_BLADE, PokemonType.FIRE, MoveCategory.PHYSICAL, 90, 100, 10, -1, 0, 9)
      .attr(HitHealAttr)
      .slicingMove()
      .triageMove(),
    new AttackMove(MoveId.DOUBLE_SHOCK, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 120, 100, 5, -1, 0, 9)
      .condition((user) => {
        const userTypes = user.getTypes(true);
        return userTypes.includes(PokemonType.ELECTRIC);
      })
      .attr(AddBattlerTagAttr, BattlerTagType.DOUBLE_SHOCKED, true, false)
      .attr(RemoveTypeAttr, PokemonType.ELECTRIC, (user) => {
        globalScene.phaseManager.queueMessage(i18next.t("moveTriggers:usedUpAllElectricity", { pokemonName: getPokemonNameWithAffix(user) }));
      }),
    new AttackMove(MoveId.GIGATON_HAMMER, PokemonType.STEEL, MoveCategory.PHYSICAL, 160, 100, 5, -1, 0, 9)
      .makesContact(false)
      .condition((user, target, move) => {
        const turnMove = user.getLastXMoves(1);
        return !turnMove.length || turnMove[0].move !== move.id || turnMove[0].result !== MoveResult.SUCCESS;
      }), // TODO Add Instruct/Encore interaction
    new AttackMove(MoveId.COMEUPPANCE, PokemonType.DARK, MoveCategory.PHYSICAL, -1, 100, 10, -1, 0, 9)
      .attr(CounterDamageAttr, (move: Move) => (move.category === MoveCategory.PHYSICAL || move.category === MoveCategory.SPECIAL), 1.5)
      .redirectCounter()
      .target(MoveTarget.ATTACKER),
    new AttackMove(MoveId.AQUA_CUTTER, PokemonType.WATER, MoveCategory.PHYSICAL, 70, 100, 20, -1, 0, 9)
      .attr(HighCritAttr)
      .slicingMove()
      .makesContact(false),
    new AttackMove(MoveId.BLAZING_TORQUE, PokemonType.FIRE, MoveCategory.PHYSICAL, 80, 100, 10, 30, 0, 9)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .makesContact(false),
    new AttackMove(MoveId.WICKED_TORQUE, PokemonType.DARK, MoveCategory.PHYSICAL, 80, 100, 10, 10, 0, 9)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .makesContact(false),
    new AttackMove(MoveId.NOXIOUS_TORQUE, PokemonType.POISON, MoveCategory.PHYSICAL, 100, 100, 10, 30, 0, 9)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .makesContact(false),
    new AttackMove(MoveId.COMBAT_TORQUE, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 100, 100, 10, 30, 0, 9)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .makesContact(false),
    new AttackMove(MoveId.MAGICAL_TORQUE, PokemonType.FAIRY, MoveCategory.PHYSICAL, 100, 100, 10, 30, 0, 9)
      .attr(ConfuseAttr)
      .makesContact(false),
    new AttackMove(MoveId.BLOOD_MOON, PokemonType.NORMAL, MoveCategory.SPECIAL, 140, 100, 5, -1, 0, 9)
      .condition((user, target, move) => {
        const turnMove = user.getLastXMoves(1);
        return !turnMove.length || turnMove[0].move !== move.id || turnMove[0].result !== MoveResult.SUCCESS;
      }), // TODO Add Instruct/Encore interaction
    new AttackMove(MoveId.MATCHA_GOTCHA, PokemonType.GRASS, MoveCategory.SPECIAL, 80, 90, 15, 20, 0, 9)
      .attr(HitHealAttr)
      .attr(HealStatusEffectAttr, true, StatusEffect.FREEZE)
      .attr(HealStatusEffectAttr, false, StatusEffect.FREEZE)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .target(MoveTarget.ALL_NEAR_ENEMIES)
      .triageMove(),
    new AttackMove(MoveId.SYRUP_BOMB, PokemonType.GRASS, MoveCategory.SPECIAL, 60, 85, 10, 100, 0, 9)
      .attr(AddBattlerTagAttr, BattlerTagType.SYRUP_BOMB, false, false, 3)
      .ballBombMove(),
    new AttackMove(MoveId.IVY_CUDGEL, PokemonType.GRASS, MoveCategory.PHYSICAL, 100, 100, 10, -1, 0, 9)
      .attr(IvyCudgelTypeAttr)
      .attr(HighCritAttr)
      .makesContact(false),
    new ChargingAttackMove(MoveId.ELECTRO_SHOT, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 130, 100, 10, -1, 0, 9)
      .chargeText(i18next.t("moveTriggers:absorbedElectricity", { pokemonName: "{USER}" }))
      .chargeAttr(StatStageChangeAttr, [ Stat.SPATK ], 1, true)
      .chargeAttr(WeatherInstantChargeAttr, [ WeatherType.RAIN, WeatherType.HEAVY_RAIN ]),
    new AttackMove(MoveId.TERA_STARSTORM, PokemonType.NORMAL, MoveCategory.SPECIAL, 120, 100, 5, -1, 0, 9)
      .attr(TeraMoveCategoryAttr)
      .attr(TeraStarstormTypeAttr)
      .attr(VariableTargetAttr, (user, target, move) => user.hasSpecies(SpeciesId.TERAPAGOS) && (user.isTerastallized || globalScene.currentBattle.preTurnCommands[user.getFieldIndex()]?.command === Command.TERA) ? MoveTarget.ALL_NEAR_ENEMIES : MoveTarget.NEAR_OTHER)
      .partial(), /** Does not ignore abilities that affect stats, relevant in determining the move's category {@see TeraMoveCategoryAttr} */
    new AttackMove(MoveId.FICKLE_BEAM, PokemonType.DRAGON, MoveCategory.SPECIAL, 80, 100, 5, -1, 0, 9)
      .attr(PreMoveMessageAttr, doublePowerChanceMessageFunc(30))
      .attr(DoublePowerChanceAttr, 30),
    new SelfStatusMove(MoveId.BURNING_BULWARK, PokemonType.FIRE, -1, 10, -1, 4, 9)
      .attr(ProtectAttr, BattlerTagType.BURNING_BULWARK)
      .condition(failIfLastCondition),
    new AttackMove(MoveId.THUNDERCLAP, PokemonType.ELECTRIC, MoveCategory.SPECIAL, 70, 100, 5, -1, 1, 9)
      .condition((user, target, move) => {
        const turnCommand = globalScene.currentBattle.turnCommands[target.getBattlerIndex()];
        if (!turnCommand || !turnCommand.move) {
          return false;
        }
        return (turnCommand.command === Command.FIGHT && !target.turnData.acted && allMoves[turnCommand.move.move].category !== MoveCategory.STATUS);
      }),
    new AttackMove(MoveId.MIGHTY_CLEAVE, PokemonType.ROCK, MoveCategory.PHYSICAL, 95, 100, 5, -1, 0, 9)
      .slicingMove()
      .ignoresProtect(),
    new AttackMove(MoveId.TACHYON_CUTTER, PokemonType.STEEL, MoveCategory.SPECIAL, 50, -1, 10, -1, 0, 9)
      .attr(MultiHitAttr, MultiHitType._2)
      .slicingMove(),
    new AttackMove(MoveId.HARD_PRESS, PokemonType.STEEL, MoveCategory.PHYSICAL, -1, 100, 10, -1, 0, 9)
      .attr(OpponentHighHpPowerAttr, 100),
    new StatusMove(MoveId.DRAGON_CHEER, PokemonType.DRAGON, -1, 15, -1, 0, 9)
      .attr(AddBattlerTagAttr, BattlerTagType.DRAGON_CHEER, false, true)
      // TODO: Remove once dragon cheer & focus energy are merged into 1 tag
      .condition((_user, target) => !target.getTag(BattlerTagType.CRIT_BOOST))
      .target(MoveTarget.NEAR_ALLY),
    new AttackMove(MoveId.ALLURING_VOICE, PokemonType.FAIRY, MoveCategory.SPECIAL, 80, 100, 10, 100, 0, 9)
      .attr(AddBattlerTagIfBoostedAttr, BattlerTagType.CONFUSED)
      .soundBased(),
    new AttackMove(MoveId.TEMPER_FLARE, PokemonType.FIRE, MoveCategory.PHYSICAL, 75, 100, 10, -1, 0, 9)
      .attr(MovePowerMultiplierAttr, (user, target, move) => user.getLastXMoves(2)[1]?.result === MoveResult.MISS || user.getLastXMoves(2)[1]?.result === MoveResult.FAIL ? 2 : 1),
    new AttackMove(MoveId.SUPERCELL_SLAM, PokemonType.ELECTRIC, MoveCategory.PHYSICAL, 100, 95, 15, -1, 0, 9)
      .attr(AlwaysHitMinimizeAttr)
      .attr(HitsTagForDoubleDamageAttr, BattlerTagType.MINIMIZED)
      .attr(MissEffectAttr, crashDamageFunc)
      .attr(NoEffectAttr, crashDamageFunc)
      .recklessMove(),
    new AttackMove(MoveId.PSYCHIC_NOISE, PokemonType.PSYCHIC, MoveCategory.SPECIAL, 75, 100, 10, 100, 0, 9)
      .soundBased()
      .attr(AddBattlerTagAttr, BattlerTagType.HEAL_BLOCK, false, false, 2),
    new AttackMove(MoveId.UPPER_HAND, PokemonType.FIGHTING, MoveCategory.PHYSICAL, 65, 100, 15, 100, 3, 9)
      .attr(FlinchAttr)
      .condition(new UpperHandCondition()),
    new AttackMove(MoveId.MALIGNANT_CHAIN, PokemonType.POISON, MoveCategory.SPECIAL, 100, 100, 5, 50, 0, 9)
      .attr(StatusEffectAttr, StatusEffect.TOXIC)
  );
}
