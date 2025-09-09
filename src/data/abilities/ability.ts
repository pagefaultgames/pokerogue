/* biome-ignore-start lint/correctness/noUnusedImports: tsdoc imports */
import type { BattleScene } from "#app/battle-scene";
import type { SpeciesFormChangeRevertWeatherFormTrigger } from "#data/form-change-triggers";
/* biome-ignore-end lint/correctness/noUnusedImports: tsdoc imports */

import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import type { EntryHazardTag, SuppressAbilitiesTag } from "#data/arena-tag";
import type { BattlerTag } from "#data/battler-tags";
import { GroundedTag } from "#data/battler-tags";
import { getBerryEffectFunc } from "#data/berry";
import { allAbilities, allMoves } from "#data/data-lists";
import { SpeciesFormChangeAbilityTrigger, SpeciesFormChangeWeatherTrigger } from "#data/form-change-triggers";
import { Gender } from "#data/gender";
import { getPokeballName } from "#data/pokeball";
import { pokemonFormChanges } from "#data/pokemon-forms";
import type { PokemonSpecies } from "#data/pokemon-species";
import { getNonVolatileStatusEffects, getStatusEffectDescriptor, getStatusEffectHealText } from "#data/status-effect";
import { TerrainType } from "#data/terrain";
import type { Weather } from "#data/weather";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattleType } from "#enums/battle-type";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagLapseType } from "#enums/battler-tag-lapse-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import type { BerryType } from "#enums/berry-type";
import { Command } from "#enums/command";
import { HitResult } from "#enums/hit-result";
import { CommonAnim } from "#enums/move-anims-common";
import { MoveCategory } from "#enums/move-category";
import { MoveFlags } from "#enums/move-flags";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { MoveTarget } from "#enums/move-target";
import { MoveUseMode } from "#enums/move-use-mode";
import { PokemonAnimType } from "#enums/pokemon-anim-type";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import type { BattleStat, EffectiveStat } from "#enums/stat";
import { BATTLE_STATS, EFFECTIVE_STATS, getStatKey, Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { SwitchType } from "#enums/switch-type";
import { WeatherType } from "#enums/weather-type";
import { BerryUsedEvent } from "#events/battle-scene";
import type { EnemyPokemon, Pokemon } from "#field/pokemon";
import { BerryModifier, HitHealModifier, PokemonHeldItemModifier } from "#modifiers/modifier";
import { BerryModifierType } from "#modifiers/modifier-type";
import { applyMoveAttrs } from "#moves/apply-attrs";
import { noAbilityTypeOverrideMoves } from "#moves/invalid-moves";
import type { Move } from "#moves/move";
import type { PokemonMove } from "#moves/pokemon-move";
import type { StatStageChangePhase } from "#phases/stat-stage-change-phase";
import type {
  AbAttrCondition,
  AbAttrMap,
  AbAttrString,
  PokemonAttackCondition,
  PokemonDefendCondition,
  PokemonStatStageChangeCondition,
} from "#types/ability-types";
import type { Localizable } from "#types/locales";
import type { Closed, Exact } from "#types/type-helpers";
import type { Constructor } from "#utils/common";
import {
  BooleanHolder,
  coerceArray,
  isNullOrUndefined,
  NumberHolder,
  randSeedFloat,
  randSeedInt,
  randSeedItem,
  toDmgValue,
} from "#utils/common";
import { toCamelCase } from "#utils/strings";
import i18next from "i18next";

export class Ability implements Localizable {
  public id: AbilityId;

  private nameAppend: string;
  public name: string;
  public description: string;
  public generation: number;
  public readonly postSummonPriority: number;
  public isBypassFaint: boolean;
  public isIgnorable: boolean;
  public isSuppressable = true;
  public isCopiable = true;
  public isReplaceable = true;
  public attrs: AbAttr[];
  public conditions: AbAttrCondition[];

  constructor(id: AbilityId, generation: number, postSummonPriority = 0) {
    this.id = id;

    this.nameAppend = "";
    this.generation = generation;
    this.postSummonPriority = postSummonPriority;
    this.attrs = [];
    this.conditions = [];

    this.localize();
  }

  public get isSwappable(): boolean {
    return this.isCopiable && this.isReplaceable;
  }

  localize(): void {
    const i18nKey = toCamelCase(AbilityId[this.id]);

    this.name = this.id ? `${i18next.t(`ability:${i18nKey}.name`)}${this.nameAppend}` : "";
    this.description = this.id ? (i18next.t(`ability:${i18nKey}.description`) as string) : "";
  }

  /**
   * Get all ability attributes that match `attrType`
   * @param attrType - any attribute that extends {@linkcode AbAttr}
   * @returns Array of attributes that match `attrType`, Empty Array if none match.
   */
  getAttrs<T extends AbAttrString>(attrType: T): AbAttrMap[T][] {
    const targetAttr = AbilityAttrs[attrType];
    if (!targetAttr) {
      return [];
    }
    // TODO: figure out how to remove the `as AbAttrMap[T][]` cast
    return this.attrs.filter((a): a is AbAttrMap[T] => a instanceof targetAttr) as AbAttrMap[T][];
  }

  /**
   * Check if an ability has an attribute that matches `attrType`
   * @param attrType - any attribute that extends {@linkcode AbAttr}
   * @returns true if the ability has attribute `attrType`
   */
  hasAttr<T extends AbAttrString>(attrType: T): boolean {
    const targetAttr = AbilityAttrs[attrType];
    if (!targetAttr) {
      return false;
    }
    return this.attrs.some(attr => attr instanceof targetAttr);
  }

  /**
   * Create a new {@linkcode AbAttr} instance and add it to this {@linkcode Ability}.
   * @param attrType - The constructor of the {@linkcode AbAttr} to create.
   * @param args - The arguments needed to instantiate the given class.
   * @returns `this`
   */
  attr<T extends Constructor<AbAttr>>(AttrType: T, ...args: ConstructorParameters<T>): this {
    const attr = new AttrType(...args);
    this.attrs.push(attr);

    return this;
  }

  /**
   * Create a new {@linkcode AbAttr} instance with the given condition and add it to this {@linkcode Ability}.
   * Checked before all other conditions, and is unique to the individual {@linkcode AbAttr} being created.
   * @param condition - The {@linkcode AbAttrCondition} to add.
   * @param attrType - The constructor of the {@linkcode AbAttr} to create.
   * @param args - The arguments needed to instantiate the given class.
   * @returns `this`
   */
  conditionalAttr<T extends Constructor<AbAttr>>(
    condition: AbAttrCondition,
    attrType: T,
    ...args: ConstructorParameters<T>
  ): this {
    const attr = new attrType(...args);
    attr.addCondition(condition);
    this.attrs.push(attr);

    return this;
  }

  /**
   * Make this ability trigger even if the user faints.
   * @returns `this`
   * @remarks
   * This is also required for abilities to trigger when revived via Reviver Seed.
   */
  bypassFaint(): this {
    this.isBypassFaint = true;
    return this;
  }

  /**
   * Make this ability ignorable by effects like {@linkcode MoveId.SUNSTEEL_STRIKE | Sunsteel Strike} or {@linkcode AbilityId.MOLD_BREAKER | Mold Breaker}.
   * @returns `this`
   */
  ignorable(): this {
    this.isIgnorable = true;
    return this;
  }

  /**
   * Make this ability unsuppressable by effects like {@linkcode MoveId.GASTRO_ACID | Gastro Acid} or {@linkcode AbilityId.NEUTRALIZING_GAS | Neutralizing Gas}.
   * @returns `this`
   */
  unsuppressable(): this {
    this.isSuppressable = false;
    return this;
  }

  /**
   * Make this ability uncopiable by effects like {@linkcode MoveId.ROLE_PLAY | Role Play} or {@linkcode AbilityId.TRACE | Trace}.
   * @returns `this`
   */
  uncopiable(): this {
    this.isCopiable = false;
    return this;
  }

  /**
   * Make this ability unreplaceable by effects like {@linkcode MoveId.SIMPLE_BEAM | Simple Beam} or {@linkcode MoveId.ENTRAINMENT | Entrainment}.
   * @returns `this`
   */
  unreplaceable(): this {
    this.isReplaceable = false;
    return this;
  }

  /**
   * Add a condition for this ability to be applied.
   * Applies to **all** attributes of the given ability.
   * @param condition - The {@linkcode AbAttrCondition} to add
   * @returns `this`
   * @see {@linkcode AbAttr.canApply} for setting conditions per attribute type
   * @see {@linkcode conditionalAttr} for setting individual conditions per attribute instance
   * @todo Review if this is necessary anymore - this is used extremely sparingly
   */
  condition(condition: AbAttrCondition): this {
    this.conditions.push(condition);

    return this;
  }

  /**
   * Mark an ability as partially implemented.
   * Partial abilities are expected to have some of their core functionality implemented, but may lack
   * certain notable features or interactions with other moves or abilities.
   * @returns `this`
   */
  partial(): this {
    this.nameAppend += " (P)";
    return this;
  }

  /**
   * Mark an ability as unimplemented.
   * Unimplemented abilities are ones which have _none_ of their basic functionality enabled.
   * @returns `this`
   */
  unimplemented(): this {
    this.nameAppend += " (N)";
    return this;
  }

  /**
   * Mark an ability as having one or more edge cases.
   * It may lack certain niche interactions with other moves/abilities, but still functions
   * as intended in most cases.
   * Does not show up in game and is solely for internal dev use.
   *
   * When using this, make sure to **document the edge case** (or else this becomes pointless).
   * @returns `this`
   */
  edgeCase(): this {
    return this;
  }
}

/**
 * Base set of parameters passed to every ability attribute's {@linkcode AbAttr.apply | apply} method.
 *
 * Extended by sub-classes to contain additional parameters pertaining to the ability type(s) being triggered.
 */
export interface AbAttrBaseParams {
  /** The pokemon that has the ability being applied */
  readonly pokemon: Pokemon;

  /**
   * Whether the ability's effects are being simulated (for instance, during AI damage calculations).
   *
   * @remarks
   * Used to prevent message flyouts and other effects from being triggered.
   * @defaultValue `false`
   */
  readonly simulated?: boolean;

  /**
   * (For callers of {@linkcode applyAbAttrs}): If provided, **only** apply ability attributes of the passive (true) or active (false).
   *
   * This should almost always be left undefined, as otherwise it will *only* apply attributes of *either* the pokemon's passive (true) or
   * non-passive (false) ability. In almost all cases, you want to apply attributes that are from either.
   *
   * (For implementations of {@linkcode AbAttr}): This will *never* be undefined, and will be `true` if the ability being applied
   * is the pokemon's passive, and `false` otherwise.
   */
  passive?: boolean;
}

export interface AbAttrParamsWithCancel extends AbAttrBaseParams {
  /** Whether the ability application results in the interaction being cancelled */
  readonly cancelled: BooleanHolder;
}

/**
 * Abstract class for all ability attributes.
 *
 * Each {@linkcode Ability} may have any number of individual attributes, each functioning independently from one another.
 */
export abstract class AbAttr {
  /**
   * Whether to show this ability as a flyout when applying its effects.
   * Should be kept in parity with mainline where possible.
   * @defaultValue `true`
   */
  public showAbility = true;
  /** The additional condition associated with this AbAttr, if any. */
  private extraCondition?: AbAttrCondition;

  /**
   * Return whether this attribute is of the given type.
   *
   * @remarks
   * Used to avoid requiring the caller to have imported the specific attribute type, avoiding circular dependencies.
   *
   * @param attr - The attribute to check against
   * @returns Whether the attribute is an instance of the given type
   */
  public is<K extends AbAttrString>(attr: K): this is AbAttrMap[K] {
    const targetAttr = AbilityAttrs[attr];
    if (!targetAttr) {
      return false;
    }
    return this instanceof targetAttr;
  }

  /**
   * @param showAbility - Whether to show this ability as a flyout during battle; default `true`.
   * Should be kept in parity with mainline where possible.
   */
  constructor(showAbility = true) {
    this.showAbility = showAbility;
  }

  /**
   * Apply this attribute's effects without checking conditions.
   *
   * @remarks
   * **Never call this method directly!** \
   * Use {@linkcode applyAbAttrs} instead.
   */
  apply(_params: AbAttrBaseParams): void {}

  /**
   * Return the trigger message to show when this attribute is executed.
   * @param _params - The parameters passed to this attribute's {@linkcode apply} function; must match type exactly
   * @param _abilityName - The name of the current ability.
   * @privateRemarks
   * If more fields are provided than needed, any excess can be discarded using destructuring.
   * @todo Remove `null` from signature in lieu of using an empty string
   */
  getTriggerMessage(_params: Exact<Parameters<this["apply"]>[0]>, _abilityName: string): string | null {
    return null;
  }

  /**
   * Check whether this attribute can have its effects successfully applied.
   * Applies to **all** instances of the given attribute.
   * @param _params - The parameters passed to this attribute's {@linkcode apply} function; must match type exactly
   * @privateRemarks
   * If more fields are provided than needed, any excess can be discarded using destructuring.
   */
  canApply(_params: Exact<Parameters<this["apply"]>[0]>): boolean {
    return true;
  }

  /**
   * Return the additional condition associated with this particular AbAttr instance, if any.
   * @returns The extra condition for this {@linkcode AbAttr}, or `null` if none exist
   * @todo Make this use `undefined` instead of `null`
   * @todo Prevent this from being overridden by sub-classes
   */
  getCondition(): AbAttrCondition | null {
    return this.extraCondition || null;
  }

  addCondition(condition: AbAttrCondition): AbAttr {
    this.extraCondition = condition;
    return this;
  }
}

/**
 * Abstract class for ability attributes that simply cancel an interaction
 *
 * @remarks
 * Abilities that have simple cancel interactions (e.g. {@linkcode BlockRecoilDamageAttr}) can extend this class to reuse the `canApply` and `apply` logic
 */
abstract class CancelInteractionAbAttr extends AbAttr {
  override canApply({ cancelled }: AbAttrParamsWithCancel): boolean {
    return !cancelled.value;
  }

  override apply({ cancelled }: AbAttrParamsWithCancel): void {
    cancelled.value = true;
  }
}

export class BlockRecoilDamageAttr extends CancelInteractionAbAttr {
  private declare readonly _: never;
  constructor() {
    super(false);
  }

  override apply({ cancelled }: AbAttrParamsWithCancel): void {
    cancelled.value = true;
  }
}

export interface DoubleBattleChanceAbAttrParams extends AbAttrBaseParams {
  /** Holder for the chance of a double battle that may be modified by the ability */
  chance: NumberHolder;
}

/**
 * Attribute for abilities that increase the chance of a double battle
 * occurring.
 * @see {@linkcode apply}
 */
export class DoubleBattleChanceAbAttr extends AbAttr {
  private declare readonly _: never;
  constructor() {
    super(false);
  }

  /**
   * Increase the chance of a double battle occurring, storing the result in `chance`
   */
  override apply({ chance }: DoubleBattleChanceAbAttrParams): void {
    // This is divided by 4 as the chance is generated as a number from 0 to chance.value using Utils.randSeedInt
    // A double battle will initiate if the generated number is 0.
    chance.value /= 4;
  }
}

export class PostBattleInitAbAttr extends AbAttr {
  private declare readonly _: never;
}

export class PostBattleInitFormChangeAbAttr extends PostBattleInitAbAttr {
  private formFunc: (p: Pokemon) => number;

  constructor(formFunc: (p: Pokemon) => number) {
    super(false);

    this.formFunc = formFunc;
  }

  override canApply({ pokemon, simulated }: AbAttrBaseParams): boolean {
    const formIndex = this.formFunc(pokemon);
    return formIndex !== pokemon.formIndex && !simulated;
  }

  override apply({ pokemon }: AbAttrBaseParams): void {
    globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeAbilityTrigger, false);
  }
}

export class PostTeraFormChangeStatChangeAbAttr extends AbAttr {
  private stats: BattleStat[];
  private stages: number;

  constructor(stats: BattleStat[], stages: number) {
    super();

    this.stats = stats;
    this.stages = stages;
  }

  override apply({ pokemon, simulated }: AbAttrBaseParams): void {
    const statStageChangePhases: StatStageChangePhase[] = [];

    if (!simulated) {
      const phaseManager = globalScene.phaseManager;
      statStageChangePhases.push(
        phaseManager.create("StatStageChangePhase", pokemon.getBattlerIndex(), true, this.stats, this.stages),
      );

      for (const statStageChangePhase of statStageChangePhases) {
        phaseManager.unshiftPhase(statStageChangePhase);
      }
    }
  }
}

/**
 * Clears a specified weather whenever this attribute is called.
 */
export class ClearWeatherAbAttr extends AbAttr {
  // TODO: evaluate why this is a field and constructor parameter even though it is never checked
  private weather: WeatherType[];

  /**
   * @param weather {@linkcode WeatherType[]} - the weather to be removed
   */
  constructor(weather: WeatherType[]) {
    super(true);

    this.weather = weather;
  }

  /**
   * @param _params - No parameters are used for this attribute.
   */
  override canApply(_params: AbAttrBaseParams): boolean {
    return globalScene.arena.canSetWeather(WeatherType.NONE);
  }

  override apply({ pokemon, simulated }: AbAttrBaseParams): void {
    if (!simulated) {
      globalScene.arena.trySetWeather(WeatherType.NONE, pokemon);
    }
  }
}

/**
 * Clears a specified terrain whenever this attribute is called.
 */
export class ClearTerrainAbAttr extends AbAttr {
  // TODO: evaluate why this is a field and constructor parameter even though it is never checked
  private terrain: TerrainType[];

  /**
   * @param terrain {@linkcode TerrainType[]} - the terrain to be removed
   */
  constructor(terrain: TerrainType[]) {
    super(true);

    this.terrain = terrain;
  }

  override canApply(_: AbAttrBaseParams): boolean {
    return globalScene.arena.canSetTerrain(TerrainType.NONE);
  }

  public override apply({ pokemon, simulated }: AbAttrBaseParams): void {
    if (!simulated) {
      globalScene.arena.trySetTerrain(TerrainType.NONE, true, pokemon);
    }
  }
}

type PreDefendAbAttrCondition = (pokemon: Pokemon, attacker: Pokemon, move: Move) => boolean;

/**
 * Shared interface for AbAttrs that interact with a move that is being used by or against the user.
 *
 * Often extended by other interfaces to add more parameters.
 * Used, e.g. by {@linkcode PreDefendAbAttr} and {@linkcode PostAttackAbAttr}
 */
export interface AugmentMoveInteractionAbAttrParams extends AbAttrBaseParams {
  /** The move used by (or against, for defend attributes) the pokemon with the ability */
  move: Move;
  /** The pokemon on the other side of the interaction */
  opponent: Pokemon;
}

/**
 * Shared interface for parameters of several {@linkcode PreDefendAbAttr} ability attributes that modify damage.
 */
export interface PreDefendModifyDamageAbAttrParams extends AugmentMoveInteractionAbAttrParams {
  /** Holder for the amount of damage that will be dealt by a move */
  damage: NumberHolder;
}

/**
 * Class for abilities that apply effects before the defending Pokemon takes damage.
 *
 * ⚠️ This attribute must not be called via `applyAbAttrs` as its subclasses violate the Liskov Substitution Principle.
 */
export abstract class PreDefendAbAttr extends AbAttr {
  private declare readonly _: never;
}

export class PreDefendFullHpEndureAbAttr extends PreDefendAbAttr {
  override canApply({ pokemon, damage }: PreDefendModifyDamageAbAttrParams): boolean {
    return (
      pokemon.isFullHp() // Checks if pokemon has wonder_guard (which forces 1hp)
      && pokemon.getMaxHp() > 1 // Damage >= hp
      && damage.value >= pokemon.hp // Cannot apply if the pokemon already has sturdy from some other source
      && !pokemon.getTag(BattlerTagType.STURDY)
    );
  }

  override apply({ pokemon, simulated }: PreDefendModifyDamageAbAttrParams): void {
    if (!simulated) {
      pokemon.addTag(BattlerTagType.STURDY, 1);
    }
  }
}

export class BlockItemTheftAbAttr extends CancelInteractionAbAttr {
  getTriggerMessage({ pokemon }: AbAttrBaseParams, abilityName: string) {
    return i18next.t("abilityTriggers:blockItemTheft", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      abilityName,
    });
  }
}

export interface StabBoostAbAttrParams extends AbAttrBaseParams {
  /** Holds the resolved STAB multiplier after ability application */
  multiplier: NumberHolder;
}

export class StabBoostAbAttr extends AbAttr {
  constructor() {
    super(false);
  }

  override canApply({ multiplier }: StabBoostAbAttrParams): boolean {
    return multiplier.value > 1;
  }

  override apply({ multiplier }: StabBoostAbAttrParams): void {
    multiplier.value += 0.5;
  }
}

export class ReceivedMoveDamageMultiplierAbAttr extends PreDefendAbAttr {
  protected condition: PokemonDefendCondition;
  private damageMultiplier: number;

  constructor(condition: PokemonDefendCondition, damageMultiplier: number, showAbility = false) {
    super(showAbility);

    this.condition = condition;
    this.damageMultiplier = damageMultiplier;
  }

  override canApply({ pokemon, opponent: attacker, move }: PreDefendModifyDamageAbAttrParams): boolean {
    return this.condition(pokemon, attacker, move);
  }

  override apply({ damage }: PreDefendModifyDamageAbAttrParams): void {
    damage.value = toDmgValue(damage.value * this.damageMultiplier);
  }
}

/**
 * Reduces the damage dealt to an allied Pokemon. Used by Friend Guard.
 * @see {@linkcode applyPreDefend}
 */
export class AlliedFieldDamageReductionAbAttr extends PreDefendAbAttr {
  private damageMultiplier: number;

  constructor(damageMultiplier: number) {
    super();
    this.damageMultiplier = damageMultiplier;
  }

  /**
   * Apply the damage reduction multiplier to the damage value.
   */
  override apply({ damage }: PreDefendModifyDamageAbAttrParams): void {
    damage.value = toDmgValue(damage.value * this.damageMultiplier);
  }
}

export class ReceivedTypeDamageMultiplierAbAttr extends ReceivedMoveDamageMultiplierAbAttr {
  constructor(moveType: PokemonType, damageMultiplier: number) {
    super((_target, user, move) => user.getMoveType(move) === moveType, damageMultiplier, false);
  }
}

/**
 * Shared interface used by several {@linkcode PreDefendAbAttr} abilities that influence the computed type effectiveness
 */
export interface TypeMultiplierAbAttrParams extends AugmentMoveInteractionAbAttrParams {
  /** Holds the type multiplier of an attack. In the case of an immunity, this value will be set to `0`. */
  typeMultiplier: NumberHolder;
  /** Its particular meaning depends on the ability attribute, though usually means that the "no effect" message should not be played */
  cancelled: BooleanHolder;
}

/**
 * Determines whether a Pokemon is immune to a move because of an ability.
 * @see {@linkcode applyPreDefend}
 * @see {@linkcode getCondition}
 */
export class TypeImmunityAbAttr extends PreDefendAbAttr {
  private immuneType: PokemonType | null;
  private condition: AbAttrCondition | null;

  // TODO: Change `NonSuperEffectiveImmunityAbAttr` to not pass `null` as immune type
  constructor(immuneType: PokemonType | null, condition?: AbAttrCondition) {
    super(true);

    this.immuneType = immuneType;
    this.condition = condition ?? null;
  }

  override canApply({ move, opponent: attacker, pokemon }: TypeMultiplierAbAttrParams): boolean {
    return (
      ![MoveTarget.BOTH_SIDES, MoveTarget.ENEMY_SIDE, MoveTarget.USER_SIDE].includes(move.moveTarget)
      && attacker !== pokemon
      && attacker.getMoveType(move) === this.immuneType
    );
  }

  override apply({ typeMultiplier }: TypeMultiplierAbAttrParams): void {
    typeMultiplier.value = 0;
  }

  getImmuneType(): PokemonType | null {
    return this.immuneType;
  }

  override getCondition(): AbAttrCondition | null {
    return this.condition;
  }
}

export class AttackTypeImmunityAbAttr extends TypeImmunityAbAttr {
  // biome-ignore lint/complexity/noUselessConstructor: Changes the type of `immuneType`
  constructor(immuneType: PokemonType, condition?: AbAttrCondition) {
    super(immuneType, condition);
  }

  override canApply(params: TypeMultiplierAbAttrParams): boolean {
    const { move } = params;
    return (
      move.category !== MoveCategory.STATUS
      && !move.hasAttr("NeutralDamageAgainstFlyingTypeMultiplierAttr")
      && super.canApply(params)
    );
  }
}

export class TypeImmunityHealAbAttr extends TypeImmunityAbAttr {
  // biome-ignore lint/complexity/noUselessConstructor: Changes the type of `immuneType`
  constructor(immuneType: PokemonType) {
    super(immuneType);
  }

  override apply(params: TypeMultiplierAbAttrParams): void {
    super.apply(params);
    const { pokemon, cancelled, simulated, passive } = params;
    if (!pokemon.isFullHp() && !simulated) {
      const abilityName = (!passive ? pokemon.getAbility() : pokemon.getPassiveAbility()).name;
      globalScene.phaseManager.unshiftNew(
        "PokemonHealPhase",
        pokemon.getBattlerIndex(),
        toDmgValue(pokemon.getMaxHp() / 4),
        i18next.t("abilityTriggers:typeImmunityHeal", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          abilityName,
        }),
        true,
      );
      cancelled.value = true; // Suppresses "No Effect" message
    }
  }
}

class TypeImmunityStatStageChangeAbAttr extends TypeImmunityAbAttr {
  private stat: BattleStat;
  private stages: number;

  constructor(immuneType: PokemonType, stat: BattleStat, stages: number, condition?: AbAttrCondition) {
    super(immuneType, condition);

    this.stat = stat;
    this.stages = stages;
  }

  override apply(params: TypeMultiplierAbAttrParams): void {
    const { cancelled, simulated, pokemon } = params;
    super.apply(params);
    cancelled.value = true; // Suppresses "No Effect" message
    if (!simulated) {
      globalScene.phaseManager.unshiftNew(
        "StatStageChangePhase",
        pokemon.getBattlerIndex(),
        true,
        [this.stat],
        this.stages,
      );
    }
  }
}

class TypeImmunityAddBattlerTagAbAttr extends TypeImmunityAbAttr {
  private tagType: BattlerTagType;
  private turnCount: number;

  constructor(immuneType: PokemonType, tagType: BattlerTagType, turnCount: number, condition?: AbAttrCondition) {
    super(immuneType, condition);

    this.tagType = tagType;
    this.turnCount = turnCount;
  }

  override apply(params: TypeMultiplierAbAttrParams): void {
    const { cancelled, simulated, pokemon } = params;
    super.apply(params);
    cancelled.value = true; // Suppresses "No Effect" message
    if (!simulated) {
      pokemon.addTag(this.tagType, this.turnCount, undefined, pokemon.id);
    }
  }
}

export class NonSuperEffectiveImmunityAbAttr extends TypeImmunityAbAttr {
  constructor(condition?: AbAttrCondition) {
    super(null, condition);
  }

  override canApply({ move, typeMultiplier }: TypeMultiplierAbAttrParams): boolean {
    return move.is("AttackMove") && typeMultiplier.value < 2;
  }

  override apply({ typeMultiplier, cancelled }: TypeMultiplierAbAttrParams): void {
    cancelled.value = true; // Suppresses "No Effect" message
    typeMultiplier.value = 0;
  }

  getTriggerMessage({ pokemon }: TypeMultiplierAbAttrParams, abilityName: string): string {
    return i18next.t("abilityTriggers:nonSuperEffectiveImmunity", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      abilityName,
    });
  }
}

/**
 * Attribute implementing the effects of {@link https://bulbapedia.bulbagarden.net/wiki/Tera_Shell_(Ability) | Tera Shell}
 * When the source is at full HP, incoming attacks will have a maximum 0.5x type effectiveness multiplier.
 * @extends PreDefendAbAttr
 */
export class FullHpResistTypeAbAttr extends PreDefendAbAttr {
  /**
   * Allow application if the pokemon with the ability is at full hp and the mvoe is not fixed damage
   */
  override canApply({ typeMultiplier, move, pokemon }: TypeMultiplierAbAttrParams): boolean {
    return (
      typeMultiplier instanceof NumberHolder
      && !move?.hasAttr("FixedDamageAttr")
      && pokemon.isFullHp()
      && typeMultiplier.value > 0.5
    );
  }

  /**
   * Reduce the type multiplier to 0.5 if the source is at full HP.
   */
  override apply({ typeMultiplier, pokemon }: TypeMultiplierAbAttrParams): void {
    typeMultiplier.value = 0.5;
    pokemon.turnData.moveEffectiveness = 0.5;
  }

  getTriggerMessage({ pokemon }: TypeMultiplierAbAttrParams, _abilityName: string): string {
    return i18next.t("abilityTriggers:fullHpResistType", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
    });
  }
}

export interface FieldPriorityMoveImmunityAbAttrParams extends AugmentMoveInteractionAbAttrParams {
  /** Holds whether the pokemon is immune to the move being used */
  cancelled: BooleanHolder;
}

export class FieldPriorityMoveImmunityAbAttr extends PreDefendAbAttr {
  override canApply({ move, opponent: attacker, cancelled }: FieldPriorityMoveImmunityAbAttrParams): boolean {
    return (
      !cancelled.value
      && !(move.moveTarget === MoveTarget.USER || move.moveTarget === MoveTarget.NEAR_ALLY)
      && move.getPriority(attacker) > 0
      && !move.isMultiTarget()
    );
  }

  override apply({ cancelled }: FieldPriorityMoveImmunityAbAttrParams): void {
    cancelled.value = true;
  }
}

export interface MoveImmunityAbAttrParams extends AugmentMoveInteractionAbAttrParams {
  /** Holds whether the standard "no effect" message (due to a type-based immunity) should be suppressed */
  cancelled: BooleanHolder;
}
// TODO: Consider examining whether this move immunity ability attribute
// can be merged with the MoveTypeMultiplierAbAttr in some way.
export class MoveImmunityAbAttr extends PreDefendAbAttr {
  private immuneCondition: PreDefendAbAttrCondition;

  constructor(immuneCondition: PreDefendAbAttrCondition) {
    super(true);

    this.immuneCondition = immuneCondition;
  }

  override canApply({ pokemon, opponent: attacker, move, cancelled }: MoveImmunityAbAttrParams): boolean {
    return !cancelled.value && this.immuneCondition(pokemon, attacker, move);
  }

  override apply({ cancelled }: MoveImmunityAbAttrParams): void {
    cancelled.value = true;
  }

  override getTriggerMessage({ pokemon }: MoveImmunityAbAttrParams, _abilityName: string): string {
    return i18next.t("abilityTriggers:moveImmunity", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) });
  }
}

export interface PreDefendModifyAccAbAttrParams extends AugmentMoveInteractionAbAttrParams {
  /** Holds the accuracy of the move after the ability is applied */
  accuracy: NumberHolder;
}

/**
 * Reduces the accuracy of status moves used against the Pokémon with this ability to 50%.
 * Used by Wonder Skin.
 */
export class WonderSkinAbAttr extends PreDefendAbAttr {
  constructor() {
    super(false);
  }

  override canApply({ move, accuracy }: PreDefendModifyAccAbAttrParams): boolean {
    return move.category === MoveCategory.STATUS && accuracy.value >= 50;
  }

  override apply({ accuracy }: PreDefendModifyAccAbAttrParams): void {
    accuracy.value = 50;
  }
}

export class MoveImmunityStatStageChangeAbAttr extends MoveImmunityAbAttr {
  private stat: BattleStat;
  private stages: number;

  constructor(immuneCondition: PreDefendAbAttrCondition, stat: BattleStat, stages: number) {
    super(immuneCondition);
    this.stat = stat;
    this.stages = stages;
  }

  override canApply(params: MoveImmunityAbAttrParams): boolean {
    // TODO: Evaluate whether it makes sense to check against simulated here.
    // We likely want to check 'simulated' when the apply method enqueues the phase
    return !params.simulated && super.canApply(params);
  }

  override apply(params: MoveImmunityAbAttrParams): void {
    super.apply(params);
    // TODO: We probably should not unshift the phase if this is simulated
    globalScene.phaseManager.unshiftNew(
      "StatStageChangePhase",
      params.pokemon.getBattlerIndex(),
      true,
      [this.stat],
      this.stages,
    );
  }
}

/**
 * Shared parameters for ability attributes that apply an effect after move was used by or against the the user.
 */
export interface PostMoveInteractionAbAttrParams extends AugmentMoveInteractionAbAttrParams {
  /** Stores the hit result of the move used in the interaction */
  readonly hitResult: HitResult;
  /** The amount of damage dealt in the interaction */
  readonly damage: number;
}

export class PostDefendAbAttr extends AbAttr {
  private declare readonly _: never;
  override canApply(_params: PostMoveInteractionAbAttrParams): boolean {
    return true;
  }
  override apply(_params: PostMoveInteractionAbAttrParams): void {}
}

/** Class for abilities that make drain moves deal damage to user instead of healing them. */
export class ReverseDrainAbAttr extends PostDefendAbAttr {
  override canApply({ move }: PostMoveInteractionAbAttrParams): boolean {
    return move.hasAttr("HitHealAttr");
  }

  /**
   * Determines if a damage and draining move was used to check if this ability should stop the healing.
   * Examples include: Absorb, Draining Kiss, Bitter Blade, etc.
   * Also displays a message to show this ability was activated.
   */
  override apply({ simulated, opponent: attacker }: PostMoveInteractionAbAttrParams): void {
    if (!simulated) {
      globalScene.phaseManager.queueMessage(
        i18next.t("abilityTriggers:reverseDrain", { pokemonNameWithAffix: getPokemonNameWithAffix(attacker) }),
      );
    }
  }
}

export class PostDefendStatStageChangeAbAttr extends PostDefendAbAttr {
  private condition: PokemonDefendCondition;
  private stat: BattleStat;
  private stages: number;
  private selfTarget: boolean;
  private allOthers: boolean;

  constructor(
    condition: PokemonDefendCondition,
    stat: BattleStat,
    stages: number,
    selfTarget = true,
    allOthers = false,
  ) {
    super(true);

    this.condition = condition;
    this.stat = stat;
    this.stages = stages;
    this.selfTarget = selfTarget;
    this.allOthers = allOthers;
  }

  override canApply({ pokemon, opponent: attacker, move }: PostMoveInteractionAbAttrParams): boolean {
    return this.condition(pokemon, attacker, move);
  }

  override apply({ simulated, pokemon, opponent: attacker }: PostMoveInteractionAbAttrParams): void {
    if (simulated) {
      return;
    }

    if (this.allOthers) {
      const ally = pokemon.getAlly();
      const otherPokemon = !isNullOrUndefined(ally) ? pokemon.getOpponents().concat([ally]) : pokemon.getOpponents();
      for (const other of otherPokemon) {
        globalScene.phaseManager.unshiftNew(
          "StatStageChangePhase",
          other.getBattlerIndex(),
          false,
          [this.stat],
          this.stages,
        );
      }
    } else {
      globalScene.phaseManager.unshiftNew(
        "StatStageChangePhase",
        (this.selfTarget ? pokemon : attacker).getBattlerIndex(),
        this.selfTarget,
        [this.stat],
        this.stages,
      );
    }
  }
}

export class PostDefendHpGatedStatStageChangeAbAttr extends PostDefendAbAttr {
  private condition: PokemonDefendCondition;
  private hpGate: number;
  private stats: BattleStat[];
  private stages: number;
  private selfTarget: boolean;

  constructor(
    condition: PokemonDefendCondition,
    hpGate: number,
    stats: BattleStat[],
    stages: number,
    selfTarget = true,
  ) {
    super(true);

    this.condition = condition;
    this.hpGate = hpGate;
    this.stats = stats;
    this.stages = stages;
    this.selfTarget = selfTarget;
  }

  override canApply({ pokemon, opponent: attacker, move }: PostMoveInteractionAbAttrParams): boolean {
    const hpGateFlat: number = Math.ceil(pokemon.getMaxHp() * this.hpGate);
    const lastAttackReceived = pokemon.turnData.attacksReceived.at(-1);
    const damageReceived = lastAttackReceived?.damage ?? 0;
    return (
      this.condition(pokemon, attacker, move) && pokemon.hp <= hpGateFlat && pokemon.hp + damageReceived > hpGateFlat
    );
  }

  override apply({ simulated, pokemon, opponent }: PostMoveInteractionAbAttrParams): void {
    if (!simulated) {
      globalScene.phaseManager.unshiftNew(
        "StatStageChangePhase",
        (this.selfTarget ? pokemon : opponent).getBattlerIndex(),
        true,
        this.stats,
        this.stages,
      );
    }
  }
}

export class PostDefendApplyArenaTrapTagAbAttr extends PostDefendAbAttr {
  private condition: PokemonDefendCondition;
  private arenaTagType: ArenaTagType;

  constructor(condition: PokemonDefendCondition, tagType: ArenaTagType) {
    super(true);

    this.condition = condition;
    this.arenaTagType = tagType;
  }

  override canApply({ pokemon, opponent: attacker, move }: PostMoveInteractionAbAttrParams): boolean {
    const tag = globalScene.arena.getTag(this.arenaTagType) as EntryHazardTag;
    return (
      this.condition(pokemon, attacker, move)
      && (!globalScene.arena.getTag(this.arenaTagType) || tag.layers < tag.maxLayers)
    );
  }

  override apply({ simulated, pokemon }: PostMoveInteractionAbAttrParams): void {
    if (!simulated) {
      globalScene.arena.addTag(
        this.arenaTagType,
        0,
        undefined,
        pokemon.id,
        pokemon.isPlayer() ? ArenaTagSide.ENEMY : ArenaTagSide.PLAYER,
      );
    }
  }
}

export class PostDefendApplyBattlerTagAbAttr extends PostDefendAbAttr {
  private condition: PokemonDefendCondition;
  private tagType: BattlerTagType;
  constructor(condition: PokemonDefendCondition, tagType: BattlerTagType) {
    super(true);

    this.condition = condition;
    this.tagType = tagType;
  }

  override canApply({ pokemon, opponent: attacker, move }: PostMoveInteractionAbAttrParams): boolean {
    return this.condition(pokemon, attacker, move);
  }

  override apply({ simulated, pokemon, move }: PostMoveInteractionAbAttrParams): void {
    if (!pokemon.getTag(this.tagType) && !simulated) {
      pokemon.addTag(this.tagType, undefined, undefined, pokemon.id);
      globalScene.phaseManager.queueMessage(
        i18next.t("abilityTriggers:windPowerCharged", {
          pokemonName: getPokemonNameWithAffix(pokemon),
          moveName: move.name,
        }),
      );
    }
  }
}

export class PostDefendTypeChangeAbAttr extends PostDefendAbAttr {
  private type: PokemonType;

  override canApply({
    opponent: attacker,
    move,
    pokemon,
    hitResult,
    simulated,
  }: PostMoveInteractionAbAttrParams): boolean {
    this.type = attacker.getMoveType(move);
    const pokemonTypes = pokemon.getTypes(true);
    return hitResult < HitResult.NO_EFFECT && (simulated || pokemonTypes.length !== 1 || pokemonTypes[0] !== this.type);
  }

  override apply({ pokemon, opponent: attacker, move }: PostMoveInteractionAbAttrParams): void {
    const type = attacker.getMoveType(move);
    pokemon.summonData.types = [type];
  }

  override getTriggerMessage({ pokemon }: PostMoveInteractionAbAttrParams, abilityName: string): string {
    return i18next.t("abilityTriggers:postDefendTypeChange", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      abilityName,
      typeName: i18next.t(`pokemonInfo:type.${toCamelCase(PokemonType[this.type])}`),
    });
  }
}

export class PostDefendTerrainChangeAbAttr extends PostDefendAbAttr {
  private terrainType: TerrainType;

  constructor(terrainType: TerrainType) {
    super();

    this.terrainType = terrainType;
  }

  override canApply({ hitResult }: PostMoveInteractionAbAttrParams): boolean {
    return hitResult < HitResult.NO_EFFECT && globalScene.arena.canSetTerrain(this.terrainType);
  }

  override apply({ simulated, pokemon }: PostMoveInteractionAbAttrParams): void {
    if (!simulated) {
      globalScene.arena.trySetTerrain(this.terrainType, false, pokemon);
    }
  }
}

export class PostDefendContactApplyStatusEffectAbAttr extends PostDefendAbAttr {
  private chance: number;
  private effects: StatusEffect[];

  constructor(chance: number, ...effects: StatusEffect[]) {
    super(true);

    this.chance = chance;
    this.effects = effects;
  }

  override canApply({ pokemon, move, opponent: attacker }: PostMoveInteractionAbAttrParams): boolean {
    const effect =
      this.effects.length === 1 ? this.effects[0] : this.effects[pokemon.randBattleSeedInt(this.effects.length)];
    return (
      move.doesFlagEffectApply({ flag: MoveFlags.MAKES_CONTACT, user: attacker, target: pokemon })
      && !attacker.status
      && (this.chance === -1 || pokemon.randBattleSeedInt(100) < this.chance)
      && attacker.canSetStatus(effect, true, false, pokemon)
    );
  }

  override apply({ opponent: attacker, pokemon }: PostMoveInteractionAbAttrParams): void {
    // TODO: Probably want to check against simulated here
    const effect =
      this.effects.length === 1 ? this.effects[0] : this.effects[pokemon.randBattleSeedInt(this.effects.length)];
    attacker.trySetStatus(effect, pokemon);
  }
}

export class EffectSporeAbAttr extends PostDefendContactApplyStatusEffectAbAttr {
  constructor() {
    super(10, StatusEffect.POISON, StatusEffect.PARALYSIS, StatusEffect.SLEEP);
  }

  override canApply(params: PostMoveInteractionAbAttrParams): boolean {
    const attacker = params.opponent;
    return !(attacker.isOfType(PokemonType.GRASS) || attacker.hasAbility(AbilityId.OVERCOAT)) && super.canApply(params);
  }
}

export class PostDefendContactApplyTagChanceAbAttr extends PostDefendAbAttr {
  private chance: number;
  private tagType: BattlerTagType;
  private turnCount: number | undefined;

  constructor(chance: number, tagType: BattlerTagType, turnCount?: number) {
    super();

    this.tagType = tagType;
    this.chance = chance;
    this.turnCount = turnCount;
  }

  override canApply({ move, pokemon, opponent }: PostMoveInteractionAbAttrParams): boolean {
    return (
      move.doesFlagEffectApply({ flag: MoveFlags.MAKES_CONTACT, user: opponent, target: pokemon })
      && pokemon.randBattleSeedInt(100) < this.chance
      && opponent.canAddTag(this.tagType)
    );
  }

  override apply({ pokemon, simulated, opponent, move }: PostMoveInteractionAbAttrParams): void {
    if (!simulated) {
      opponent.addTag(this.tagType, this.turnCount, move.id, pokemon.id);
    }
  }
}

/**
 * Set stat stages when the user gets hit by a critical hit
 *
 * @privateRemarks
 * It is the responsibility of the caller to ensure that this ability attribute is only applied
 * when the user has been hit by a critical hit; such an event is not checked here.
 *
 * @sealed
 */
export class PostReceiveCritStatStageChangeAbAttr extends AbAttr {
  private stat: BattleStat;
  private stages: number;

  constructor(stat: BattleStat, stages: number) {
    super();

    this.stat = stat;
    this.stages = stages;
  }

  override apply({ simulated, pokemon }: PostMoveInteractionAbAttrParams): void {
    if (!simulated) {
      globalScene.phaseManager.unshiftNew(
        "StatStageChangePhase",
        pokemon.getBattlerIndex(),
        true,
        [this.stat],
        this.stages,
      );
    }
  }
}

export class PostDefendContactDamageAbAttr extends PostDefendAbAttr {
  private damageRatio: number;

  constructor(damageRatio: number) {
    super();

    this.damageRatio = damageRatio;
  }

  override canApply({ simulated, move, opponent: attacker, pokemon }: PostMoveInteractionAbAttrParams): boolean {
    return (
      !simulated
      && move.doesFlagEffectApply({ flag: MoveFlags.MAKES_CONTACT, user: attacker, target: pokemon })
      && !attacker.hasAbilityWithAttr("BlockNonDirectDamageAbAttr")
    );
  }

  override apply({ opponent: attacker }: PostMoveInteractionAbAttrParams): void {
    attacker.damageAndUpdate(toDmgValue(attacker.getMaxHp() * (1 / this.damageRatio)), { result: HitResult.INDIRECT });
    attacker.turnData.damageTaken += toDmgValue(attacker.getMaxHp() * (1 / this.damageRatio));
  }

  override getTriggerMessage({ pokemon }: PostMoveInteractionAbAttrParams, abilityName: string): string {
    return i18next.t("abilityTriggers:postDefendContactDamage", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      abilityName,
    });
  }
}
/**
 * @description: This ability applies the Perish Song tag to the attacking pokemon
 * and the defending pokemon if the move makes physical contact and neither pokemon
 * already has the Perish Song tag.
 * @class PostDefendPerishSongAbAttr
 * @extends {PostDefendAbAttr}
 */
export class PostDefendPerishSongAbAttr extends PostDefendAbAttr {
  private turns: number;

  constructor(turns: number) {
    super();

    this.turns = turns;
  }

  override canApply({ move, opponent: attacker, pokemon }: PostMoveInteractionAbAttrParams): boolean {
    return (
      move.doesFlagEffectApply({ flag: MoveFlags.MAKES_CONTACT, user: attacker, target: pokemon })
      && !attacker.getTag(BattlerTagType.PERISH_SONG)
    );
  }

  override apply({ simulated, opponent: attacker, pokemon }: PostMoveInteractionAbAttrParams): void {
    if (!simulated) {
      attacker.addTag(BattlerTagType.PERISH_SONG, this.turns);
      pokemon.addTag(BattlerTagType.PERISH_SONG, this.turns);
    }
  }

  override getTriggerMessage({ pokemon }: PostMoveInteractionAbAttrParams, abilityName: string): string {
    return i18next.t("abilityTriggers:perishBody", {
      pokemonName: getPokemonNameWithAffix(pokemon),
      abilityName,
    });
  }
}

export class PostDefendWeatherChangeAbAttr extends PostDefendAbAttr {
  private weatherType: WeatherType;
  protected condition?: PokemonDefendCondition;

  constructor(weatherType: WeatherType, condition?: PokemonDefendCondition) {
    super();

    this.weatherType = weatherType;
    this.condition = condition;
  }

  override canApply({ pokemon, opponent: attacker, move }: PostMoveInteractionAbAttrParams): boolean {
    return (
      !(this.condition && !this.condition(pokemon, attacker, move))
      && !globalScene.arena.weather?.isImmutable()
      && globalScene.arena.canSetWeather(this.weatherType)
    );
  }

  override apply({ simulated, pokemon }: PostMoveInteractionAbAttrParams): void {
    if (!simulated) {
      globalScene.arena.trySetWeather(this.weatherType, pokemon);
    }
  }
}

export class PostDefendAbilitySwapAbAttr extends PostDefendAbAttr {
  override canApply({ move, opponent: attacker, pokemon }: PostMoveInteractionAbAttrParams): boolean {
    return (
      move.doesFlagEffectApply({ flag: MoveFlags.MAKES_CONTACT, user: attacker, target: pokemon })
      && attacker.getAbility().isSwappable
    );
  }

  override apply({ simulated, opponent: attacker, pokemon }: PostMoveInteractionAbAttrParams): void {
    if (!simulated) {
      const tempAbility = attacker.getAbility();
      attacker.setTempAbility(pokemon.getAbility());
      pokemon.setTempAbility(tempAbility);
    }
  }

  override getTriggerMessage({ pokemon }: PostMoveInteractionAbAttrParams, _abilityName: string): string {
    return i18next.t("abilityTriggers:postDefendAbilitySwap", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
    });
  }
}

export class PostDefendAbilityGiveAbAttr extends PostDefendAbAttr {
  private ability: AbilityId;

  constructor(ability: AbilityId) {
    super();
    this.ability = ability;
  }

  override canApply({ move, opponent: attacker, pokemon }: PostMoveInteractionAbAttrParams): boolean {
    return (
      move.doesFlagEffectApply({ flag: MoveFlags.MAKES_CONTACT, user: attacker, target: pokemon })
      && attacker.getAbility().isSuppressable
      && !attacker.getAbility().hasAttr("PostDefendAbilityGiveAbAttr")
    );
  }

  override apply({ simulated, opponent: attacker }: PostMoveInteractionAbAttrParams): void {
    if (!simulated) {
      attacker.setTempAbility(allAbilities[this.ability]);
    }
  }

  override getTriggerMessage({ pokemon }: PostMoveInteractionAbAttrParams, abilityName: string): string {
    return i18next.t("abilityTriggers:postDefendAbilityGive", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      abilityName,
    });
  }
}

export class PostDefendMoveDisableAbAttr extends PostDefendAbAttr {
  private chance: number;
  private attacker: Pokemon;

  constructor(chance: number) {
    super();

    this.chance = chance;
  }

  override canApply({ move, opponent: attacker, pokemon }: PostMoveInteractionAbAttrParams): boolean {
    return (
      isNullOrUndefined(attacker.getTag(BattlerTagType.DISABLED))
      && move.doesFlagEffectApply({ flag: MoveFlags.MAKES_CONTACT, user: attacker, target: pokemon })
      && (this.chance === -1 || pokemon.randBattleSeedInt(100) < this.chance)
    );
  }

  override apply({ simulated, opponent: attacker, pokemon }: PostMoveInteractionAbAttrParams): void {
    if (!simulated) {
      this.attacker = attacker;
      this.attacker.addTag(BattlerTagType.DISABLED, 4, 0, pokemon.id);
    }
  }
}

export interface PostStatStageChangeAbAttrParams extends AbAttrBaseParams {
  /** The stats that were changed */
  stats: BattleStat[];
  /** The amount of stages that the stats changed by */
  stages: number;
  /** Whether the source of the stat stages were from the user's own move */
  selfTarget: boolean;
}

export class PostStatStageChangeAbAttr extends AbAttr {
  private declare readonly _: never;

  override canApply(_params: Closed<PostStatStageChangeAbAttrParams>) {
    return true;
  }

  override apply(_params: Closed<PostStatStageChangeAbAttrParams>) {}
}

export class PostStatStageChangeStatStageChangeAbAttr extends PostStatStageChangeAbAttr {
  private condition: PokemonStatStageChangeCondition;
  private statsToChange: BattleStat[];
  private stages: number;

  constructor(condition: PokemonStatStageChangeCondition, statsToChange: BattleStat[], stages: number) {
    super(true);

    this.condition = condition;
    this.statsToChange = statsToChange;
    this.stages = stages;
  }

  override canApply({ pokemon, stats, stages, selfTarget }: PostStatStageChangeAbAttrParams): boolean {
    return this.condition(pokemon, stats, stages) && !selfTarget;
  }

  /**
   * Add additional stat changes when one of the pokemon's own stats change
   */
  override apply({ simulated, pokemon }: PostStatStageChangeAbAttrParams): void {
    if (!simulated) {
      globalScene.phaseManager.unshiftNew(
        "StatStageChangePhase",
        pokemon.getBattlerIndex(),
        true,
        this.statsToChange,
        this.stages,
      );
    }
  }
}

export abstract class PreAttackAbAttr extends AbAttr {
  private declare readonly _: never;
}

export interface ModifyMoveEffectChanceAbAttrParams extends AbAttrBaseParams {
  /** The move being used by the attacker */
  move: Move;
  /** Holds the additional effect chance. Must be between `0` and `1` */
  chance: NumberHolder;
}

/**
 * Modifies moves additional effects with multipliers, ie. Sheer Force, Serene Grace.
 */
export class MoveEffectChanceMultiplierAbAttr extends AbAttr {
  private chanceMultiplier: number;

  constructor(chanceMultiplier: number) {
    super(false);
    this.chanceMultiplier = chanceMultiplier;
  }

  override canApply({ chance, move }: ModifyMoveEffectChanceAbAttrParams): boolean {
    const exceptMoves = [MoveId.ORDER_UP, MoveId.ELECTRO_SHOT];
    return !(chance.value <= 0 || exceptMoves.includes(move.id));
  }

  override apply({ chance }: ModifyMoveEffectChanceAbAttrParams): void {
    chance.value *= this.chanceMultiplier;
    chance.value = Math.min(chance.value, 100);
  }
}

/**
 * Sets incoming moves additional effect chance to zero, ignoring all effects from moves. ie. Shield Dust.
 */
export class IgnoreMoveEffectsAbAttr extends PreDefendAbAttr {
  constructor(showAbility = false) {
    super(showAbility);
  }

  override canApply({ chance }: ModifyMoveEffectChanceAbAttrParams): boolean {
    return chance.value > 0;
  }

  override apply({ chance }: ModifyMoveEffectChanceAbAttrParams): void {
    chance.value = 0;
  }
}

export interface FieldPreventExplosiveMovesAbAttrParams extends AbAttrBaseParams {
  /** Holds whether the explosive move should be prevented*/
  cancelled: BooleanHolder;
}

export class FieldPreventExplosiveMovesAbAttr extends CancelInteractionAbAttr {}

export interface FieldMultiplyStatAbAttrParams extends AbAttrBaseParams {
  /** The kind of stat that is being checked for modification */
  stat: Stat;
  /** Holds the value of the stat after multipliers */
  statVal: NumberHolder;
  /** The target of the stat multiplier */
  target: Pokemon;
  /** Holds whether another multiplier has already been applied to the stat.
   *
   * @remarks
   * Intended to be used to prevent the multiplier from stacking
   * with other instances of the ability */
  hasApplied: BooleanHolder;
}

/**
 * Multiplies a Stat if the checked Pokemon lacks this ability.
 * If this ability cannot stack, a BooleanHolder can be used to prevent this from stacking.
 */
export class FieldMultiplyStatAbAttr extends AbAttr {
  private stat: Stat;
  private multiplier: number;
  /**
   * Whether this ability can stack with others of the same type for this stat.
   * @defaultValue `false`
   * @todo Remove due to being literally useless - the ruin abilities are hardcoded to never stack in game
   */
  private canStack: boolean;

  constructor(stat: Stat, multiplier: number, canStack = false) {
    super(false);

    this.stat = stat;
    this.multiplier = multiplier;
    this.canStack = canStack;
  }

  canApply({ hasApplied, target, stat }: FieldMultiplyStatAbAttrParams): boolean {
    return (
      this.canStack
      || (!hasApplied.value
        && this.stat === stat
        && target.getAbilityAttrs("FieldMultiplyStatAbAttr").every(attr => attr.stat !== stat))
    );
  }

  /**
   * Atttempt to multiply a Pokemon's Stat.
   */
  apply({ statVal, hasApplied }: FieldMultiplyStatAbAttrParams): void {
    statVal.value *= this.multiplier;
    hasApplied.value = true;
  }
}

export interface MoveTypeChangeAbAttrParams extends AugmentMoveInteractionAbAttrParams {
  // TODO: Replace the number holder with a holder for the type.
  /** Holds the type of the move, which may change after ability application */
  moveType: NumberHolder;
  /** Holds the power of the move, which may change after ability application */
  power: NumberHolder;
}

export class MoveTypeChangeAbAttr extends PreAttackAbAttr {
  constructor(
    private newType: PokemonType,
    private powerMultiplier: number,
    // TODO: all moves with this attr solely check the move being used...
    private condition?: PokemonAttackCondition,
  ) {
    super(false);
  }

  /**
   * Determine if the move type change attribute can be applied.
   *
   * Can be applied if:
   * - The ability's condition is met, e.g. pixilate only boosts normal moves,
   * - The move is not forbidden from having its type changed by an ability, e.g. {@linkcode MoveId.MULTI_ATTACK}
   * - The user is not Terastallized and using Tera Blast
   * - The user is not a Terastallized Terapagos using Stellar-type Tera Starstorm
   */
  override canApply({ pokemon, opponent: target, move }: MoveTypeChangeAbAttrParams): boolean {
    return (
      (!this.condition || this.condition(pokemon, target, move))
      && !noAbilityTypeOverrideMoves.has(move.id)
      && !(
        pokemon.isTerastallized
        && (move.id === MoveId.TERA_BLAST
          || (move.id === MoveId.TERA_STARSTORM
            && pokemon.getTeraType() === PokemonType.STELLAR
            && pokemon.hasSpecies(SpeciesId.TERAPAGOS)))
      )
    );
  }

  override apply({ moveType, power }: MoveTypeChangeAbAttrParams): void {
    moveType.value = this.newType;
    power.value *= this.powerMultiplier;
  }
}

/**
 * Attribute to change the user's type to that of the move currently being executed.
 * Used by {@linkcode AbilityId.PROTEAN} and {@linkcode AbilityId.LIBERO}.
 */
export class PokemonTypeChangeAbAttr extends PreAttackAbAttr {
  private moveType: PokemonType = PokemonType.UNKNOWN;
  constructor() {
    super(true);
  }

  override canApply({ move, pokemon }: AugmentMoveInteractionAbAttrParams): boolean {
    if (
      pokemon.isTerastallized
      || move.id === MoveId.STRUGGLE /*
       * Skip moves that call other moves because these moves generate a following move that will trigger this ability attribute
       * See: https://bulbapedia.bulbagarden.net/wiki/Category:Moves_that_call_other_moves
       */
      || move.hasAttr("CallMoveAttr")
      || move.hasAttr("NaturePowerAttr") // TODO: remove this line when nature power is made to extend from `CallMoveAttr`
    ) {
      return false;
    }

    // Skip changing type if we're already of the given type as-is
    const moveType = pokemon.getMoveType(move);
    if (pokemon.getTypes().every(t => t === moveType)) {
      return false;
    }

    this.moveType = moveType;
    return true;
  }

  override apply({ simulated, pokemon, move }: AugmentMoveInteractionAbAttrParams): void {
    const moveType = pokemon.getMoveType(move);

    if (!simulated) {
      this.moveType = moveType;
      pokemon.summonData.types = [moveType];
      pokemon.updateInfo();
    }
  }

  getTriggerMessage({ pokemon }: AugmentMoveInteractionAbAttrParams, _abilityName: string): string {
    return i18next.t("abilityTriggers:pokemonTypeChange", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      moveType: i18next.t(`pokemonInfo:type.${toCamelCase(PokemonType[this.moveType])}`),
    });
  }
}

/**
 * Parameters for abilities that modify the hit count and damage of a move
 */
export interface AddSecondStrikeAbAttrParams extends Omit<AugmentMoveInteractionAbAttrParams, "opponent"> {
  /** Holder for the number of hits. May be modified by ability application */
  hitCount?: NumberHolder;
  /** Holder for the damage multiplier _of the current hit_ */
  multiplier?: NumberHolder;
}

/**
 * Class for abilities that add additional strikes to single-target moves.
 * Used by {@linkcode MoveId.PARENTAL_BOND | Parental Bond}.
 */
export class AddSecondStrikeAbAttr extends PreAttackAbAttr {
  /**
   * @param damageMultiplier - The damage multiplier for the second strike, relative to the first
   */
  constructor(private damageMultiplier: number) {
    super(false);
  }

  /**
   * Return whether the move can be multi-strike enhanced.
   */
  override canApply({ pokemon, move }: AddSecondStrikeAbAttrParams): boolean {
    return move.canBeMultiStrikeEnhanced(pokemon, true);
  }

  /**
   * Add one to the move's hit count, and, if the pokemon has only one hit left, sets the damage multiplier
   * to the damage multiplier of this ability.
   */
  override apply({ hitCount, multiplier, pokemon }: AddSecondStrikeAbAttrParams): void {
    if (hitCount?.value) {
      hitCount.value += 1;
    }

    if (multiplier?.value && pokemon.turnData.hitsLeft === 1) {
      multiplier.value = this.damageMultiplier;
    }
  }
}

/**
 * Common interface for parameters used by abilities that modify damage/power of a move before an attack
 */
export interface PreAttackModifyDamageAbAttrParams extends AugmentMoveInteractionAbAttrParams {
  /**
   * The amount of damage dealt by the move. May be modified by ability application.
   */
  damage: NumberHolder;
}

/**
 * Class for abilities that boost the damage of moves
 * For abilities that boost the base power of moves, see VariableMovePowerAbAttr
 * @param damageMultiplier the amount to multiply the damage by
 * @param condition the condition for this ability to be applied
 */
export class DamageBoostAbAttr extends PreAttackAbAttr {
  private damageMultiplier: number;
  private condition: PokemonAttackCondition;

  constructor(damageMultiplier: number, condition: PokemonAttackCondition) {
    super(false);
    this.damageMultiplier = damageMultiplier;
    this.condition = condition;
  }

  override canApply({ pokemon, opponent: target, move }: PreAttackModifyDamageAbAttrParams): boolean {
    return this.condition(pokemon, target, move);
  }

  /**
   * Adjust the power by the damage multiplier.
   */
  override apply({ damage: power }: PreAttackModifyDamageAbAttrParams): void {
    power.value = toDmgValue(power.value * this.damageMultiplier);
  }
}

export interface PreAttackModifyPowerAbAttrParams extends AugmentMoveInteractionAbAttrParams {
  /** Holds the base power of the move, which may be modified after ability application */
  power: NumberHolder;
}

/*
This base class *is* allowed to be invoked directly by `applyAbAttrs`.
As such, we require that all subclasses have compatible `apply` parameters.
To do this, we use the `Closed` type. This ensures that any subclass of `VariableMovePowerAbAttr`
may not modify the type of apply's parameter to an interface that introduces new fields
or changes the type of existing fields.
*/
export abstract class VariableMovePowerAbAttr extends PreAttackAbAttr {
  override canApply(_params: Closed<PreAttackModifyPowerAbAttrParams>): boolean {
    return true;
  }
  override apply(_params: Closed<PreAttackModifyPowerAbAttrParams>): void {}
}

export class MovePowerBoostAbAttr extends VariableMovePowerAbAttr {
  private condition: PokemonAttackCondition;
  private powerMultiplier: number;

  constructor(condition: PokemonAttackCondition, powerMultiplier: number, showAbility = false) {
    super(showAbility);
    this.condition = condition;
    this.powerMultiplier = powerMultiplier;
  }

  override canApply({ pokemon, opponent, move }: PreAttackModifyPowerAbAttrParams): boolean {
    return this.condition(pokemon, opponent, move);
  }

  override apply({ power }: PreAttackModifyPowerAbAttrParams): void {
    power.value *= this.powerMultiplier;
  }
}

export class MoveTypePowerBoostAbAttr extends MovePowerBoostAbAttr {
  constructor(boostedType: PokemonType, powerMultiplier?: number) {
    super((pokemon, _defender, move) => pokemon?.getMoveType(move) === boostedType, powerMultiplier || 1.5, false);
  }
}

export class LowHpMoveTypePowerBoostAbAttr extends MoveTypePowerBoostAbAttr {
  // biome-ignore lint/complexity/noUselessConstructor: Changes the constructor params
  constructor(boostedType: PokemonType) {
    super(boostedType);
  }

  getCondition(): AbAttrCondition {
    return pokemon => pokemon.getHpRatio() <= 0.33;
  }
}

/**
 * Abilities which cause a variable amount of power increase.
 */
export class VariableMovePowerBoostAbAttr extends VariableMovePowerAbAttr {
  private mult: (user: Pokemon, target: Pokemon, move: Move) => number;

  /**
   * @param mult - A function which takes the user, target, and move, and returns the power multiplier. 1 means no multiplier.
   * @param showAbility - Whether to show the ability when it activates.
   */
  constructor(mult: (user: Pokemon, target: Pokemon, move: Move) => number, showAbility = true) {
    super(showAbility);
    this.mult = mult;
  }

  override canApply({ pokemon, opponent, move }: PreAttackModifyPowerAbAttrParams): boolean {
    return this.mult(pokemon, opponent, move) !== 1;
  }

  override apply({ pokemon, opponent, move, power }: PreAttackModifyPowerAbAttrParams): void {
    const multiplier = this.mult(pokemon, opponent, move);
    power.value *= multiplier;
  }
}

/**
 * Boosts the power of a Pokémon's move under certain conditions.
 */
export class FieldMovePowerBoostAbAttr extends AbAttr {
  // TODO: Refactor this class? It extends from base AbAttr but has preAttack methods and gets called directly instead of going through applyAbAttrsInternal
  private condition: PokemonAttackCondition;
  private powerMultiplier: number;

  /**
   * @param condition - A function that determines whether the power boost condition is met.
   * @param powerMultiplier - The multiplier to apply to the move's power when the condition is met.
   */
  constructor(condition: PokemonAttackCondition, powerMultiplier: number) {
    super(false);
    this.condition = condition;
    this.powerMultiplier = powerMultiplier;
  }

  canApply(_params: PreAttackModifyPowerAbAttrParams): boolean {
    return true; // logic for this attr is handled in move.ts instead of normally
  }

  apply({ pokemon, opponent, move, power }: PreAttackModifyPowerAbAttrParams): void {
    if (this.condition(pokemon, opponent, move)) {
      power.value *= this.powerMultiplier;
    }
  }
}

/**
 * Boosts the power of a specific type of move.
 */
export class PreAttackFieldMoveTypePowerBoostAbAttr extends FieldMovePowerBoostAbAttr {
  /**
   * @param boostedType - The type of move that will receive the power boost.
   * @param powerMultiplier - The multiplier to apply to the move's power, defaults to 1.5 if not provided.
   */
  constructor(boostedType: PokemonType, powerMultiplier?: number) {
    super((pokemon, _defender, move) => pokemon?.getMoveType(move) === boostedType, powerMultiplier || 1.5);
  }
}

/**
 * Boosts the power of a specific type of move for all Pokemon in the field.
 * @extends PreAttackFieldMoveTypePowerBoostAbAttr
 */
export class FieldMoveTypePowerBoostAbAttr extends PreAttackFieldMoveTypePowerBoostAbAttr {}

/**
 * Boosts the power of a specific type of move for the user and its allies.
 * @extends PreAttackFieldMoveTypePowerBoostAbAttr
 */
export class UserFieldMoveTypePowerBoostAbAttr extends PreAttackFieldMoveTypePowerBoostAbAttr {}

/**
 * Boosts the power of moves in specified categories.
 * @extends FieldMovePowerBoostAbAttr
 */
export class AllyMoveCategoryPowerBoostAbAttr extends FieldMovePowerBoostAbAttr {
  /**
   * @param boostedCategories - The categories of moves that will receive the power boost.
   * @param powerMultiplier - The multiplier to apply to the move's power.
   */
  constructor(boostedCategories: MoveCategory[], powerMultiplier: number) {
    super((_pokemon, _defender, move) => boostedCategories.includes(move.category), powerMultiplier);
  }
}

export interface StatMultiplierAbAttrParams extends AbAttrBaseParams {
  /** The move being used by the user in the interaction*/
  move: Move;
  /** The stat to determine modification for*/
  stat: BattleStat;
  /** Holds the value of the stat, which may change after ability application. */
  statVal: NumberHolder;
}

export class StatMultiplierAbAttr extends AbAttr {
  private declare readonly _: never;
  private stat: BattleStat;
  private multiplier: number;
  /**
   * Function determining if the stat multiplier is able to be applied to the move.
   *
   * @remarks
   * Currently only used by Hustle.
   */
  private condition: PokemonAttackCondition | null;

  constructor(stat: BattleStat, multiplier: number, condition?: PokemonAttackCondition) {
    super(false);

    this.stat = stat;
    this.multiplier = multiplier;
    this.condition = condition ?? null;
  }

  override canApply({ pokemon, move, stat }: StatMultiplierAbAttrParams): boolean {
    return stat === this.stat && (!this.condition || this.condition(pokemon, null, move));
  }

  override apply({ statVal }: StatMultiplierAbAttrParams): void {
    statVal.value *= this.multiplier;
  }
}

export interface AllyStatMultiplierAbAttrParams extends StatMultiplierAbAttrParams {
  /**
   * Whether abilities are being ignored during the interaction (e.g. due to a Mold-Breaker like effect).
   *
   * Note that some abilities that provide stat multipliers to allies apply their boosts regardless of this flag.
   */
  ignoreAbility: boolean;
}

/**
 * Multiplies a Stat from an ally pokemon's ability.
 */
export class AllyStatMultiplierAbAttr extends AbAttr {
  private stat: BattleStat;
  private multiplier: number;
  private ignorable: boolean;

  /**
   * @param stat - The stat being modified
   * @param multiplier - The multiplier to apply to the stat
   * @param ignorable - Whether the multiplier can be ignored by mold breaker-like moves and abilities
   */
  constructor(stat: BattleStat, multiplier: number, ignorable = true) {
    super(false);

    this.stat = stat;
    this.multiplier = multiplier;
    this.ignorable = ignorable;
  }

  /**
   * Multiply a Pokemon's Stat due to an Ally's ability.
   */
  apply({ statVal }: AllyStatMultiplierAbAttrParams) {
    statVal.value *= this.multiplier;
  }

  /**
   * @returns Whether the ability with this attribute can apply to the checked stat
   */
  canApply({ stat, ignoreAbility }: AllyStatMultiplierAbAttrParams): boolean {
    return stat === this.stat && !(ignoreAbility && this.ignorable);
  }
}

/**
 * Takes effect whenever the user's move succesfully executes, such as gorilla tactics' move-locking.
 * (More specifically, whenever a move is pushed to the move history)
 */
export class ExecutedMoveAbAttr extends AbAttr {
  canApply(_params: Closed<AbAttrBaseParams>): boolean {
    return true;
  }

  apply(_params: Closed<AbAttrBaseParams>): void {}
}

/**
 * Ability attribute for {@linkcode AbilityId.GORILLA_TACTICS | Gorilla Tactics}
 * to lock the user into its first selected move.
 */
export class GorillaTacticsAbAttr extends ExecutedMoveAbAttr {
  constructor(showAbility = false) {
    super(showAbility);
  }

  override canApply({ pokemon }: AbAttrBaseParams): boolean {
    // TODO: Consider whether checking against simulated makes sense here
    return !pokemon.getTag(BattlerTagType.GORILLA_TACTICS);
  }

  override apply({ pokemon, simulated }: AbAttrBaseParams): void {
    if (!simulated) {
      pokemon.addTag(BattlerTagType.GORILLA_TACTICS);
    }
  }
}

/*
Subclasses that override the `canApply` and `apply` are not allowed to change the type of their parameters.
This is enforced via the `Closed` type.
*/
/**
 * Base class for abilities that apply some effect after the user's move successfully executes.
 */
export abstract class PostAttackAbAttr extends AbAttr {
  private attackCondition: PokemonAttackCondition;

  /** The default `attackCondition` requires that the selected move is a damaging move */
  constructor(
    attackCondition: PokemonAttackCondition = (_user, _target, move) => move.category !== MoveCategory.STATUS,
    showAbility = true,
  ) {
    super(showAbility);

    this.attackCondition = attackCondition;
  }

  /**
   * By default, this method checks that the move used is a damaging attack before
   * applying the effect of any inherited class.
   * This can be changed by providing a different {@linkcode attackCondition} to the constructor.
   * @see {@linkcode ConfusionOnStatusEffectAbAttr} for an example of an effect that does not require a damaging move.
   */
  override canApply({ pokemon, opponent, move }: Closed<PostMoveInteractionAbAttrParams>): boolean {
    return this.attackCondition(pokemon, opponent, move);
  }

  override apply(_params: Closed<PostMoveInteractionAbAttrParams>): void {}
}

export class PostAttackStealHeldItemAbAttr extends PostAttackAbAttr {
  private stealCondition: PokemonAttackCondition | null;
  private stolenItem?: PokemonHeldItemModifier;

  constructor(stealCondition?: PokemonAttackCondition) {
    super();

    this.stealCondition = stealCondition ?? null;
  }

  override canApply(params: PostMoveInteractionAbAttrParams): boolean {
    const { simulated, pokemon, opponent, move, hitResult } = params;
    // TODO: Revisit the hitResult check here.
    // The PostAttackAbAttr should should only be invoked in cases where the move successfully connected,
    // calling `super.canApply` already checks that the move was a damage move and not a status move.
    if (
      super.canApply(params)
      && !simulated
      && hitResult < HitResult.NO_EFFECT
      && (!this.stealCondition || this.stealCondition(pokemon, opponent, move))
    ) {
      const heldItems = this.getTargetHeldItems(opponent).filter(i => i.isTransferable);
      if (heldItems.length > 0) {
        // Ensure that the stolen item in testing is the same as when the effect is applied
        this.stolenItem = heldItems[pokemon.randBattleSeedInt(heldItems.length)];
        if (globalScene.canTransferHeldItemModifier(this.stolenItem, pokemon)) {
          return true;
        }
      }
    }
    this.stolenItem = undefined;
    return false;
  }

  override apply({ opponent, pokemon }: PostMoveInteractionAbAttrParams): void {
    const heldItems = this.getTargetHeldItems(opponent).filter(i => i.isTransferable);
    if (!this.stolenItem) {
      this.stolenItem = heldItems[pokemon.randBattleSeedInt(heldItems.length)];
    }
    if (globalScene.tryTransferHeldItemModifier(this.stolenItem, pokemon, false)) {
      globalScene.phaseManager.queueMessage(
        i18next.t("abilityTriggers:postAttackStealHeldItem", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          defenderName: opponent.name,
          stolenItemType: this.stolenItem.type.name,
        }),
      );
    }
    this.stolenItem = undefined;
  }

  getTargetHeldItems(target: Pokemon): PokemonHeldItemModifier[] {
    return globalScene.findModifiers(
      m => m instanceof PokemonHeldItemModifier && m.pokemonId === target.id,
      target.isPlayer(),
    ) as PokemonHeldItemModifier[];
  }
}

export class PostAttackApplyStatusEffectAbAttr extends PostAttackAbAttr {
  private contactRequired: boolean;
  private chance: number;
  private effects: StatusEffect[];

  constructor(contactRequired: boolean, chance: number, ...effects: StatusEffect[]) {
    super();

    this.contactRequired = contactRequired;
    this.chance = chance;
    this.effects = effects;
  }

  override canApply(params: PostMoveInteractionAbAttrParams): boolean {
    const { simulated, pokemon, move, opponent } = params;
    if (
      super.canApply(params)
      && (simulated
        || (!opponent.hasAbilityWithAttr("IgnoreMoveEffectsAbAttr")
          && pokemon !== opponent
          && (!this.contactRequired
            || move.doesFlagEffectApply({ flag: MoveFlags.MAKES_CONTACT, user: pokemon, target: opponent }))
          && pokemon.randBattleSeedInt(100) < this.chance
          && !pokemon.status))
    ) {
      const effect =
        this.effects.length === 1 ? this.effects[0] : this.effects[pokemon.randBattleSeedInt(this.effects.length)];
      return simulated || opponent.canSetStatus(effect, true, false, pokemon);
    }

    return false;
  }

  apply({ pokemon, opponent }: PostMoveInteractionAbAttrParams): void {
    const effect =
      this.effects.length === 1 ? this.effects[0] : this.effects[pokemon.randBattleSeedInt(this.effects.length)];
    opponent.trySetStatus(effect, pokemon);
  }
}

export class PostAttackContactApplyStatusEffectAbAttr extends PostAttackApplyStatusEffectAbAttr {
  constructor(chance: number, ...effects: StatusEffect[]) {
    super(true, chance, ...effects);
  }
}

export class PostAttackApplyBattlerTagAbAttr extends PostAttackAbAttr {
  private contactRequired: boolean;
  private chance: (user: Pokemon, target: Pokemon, move: Move) => number;
  private effects: BattlerTagType[];

  constructor(
    contactRequired: boolean,
    chance: (user: Pokemon, target: Pokemon, move: Move) => number,
    ...effects: BattlerTagType[]
  ) {
    super(undefined, false);

    this.contactRequired = contactRequired;
    this.chance = chance;
    this.effects = effects;
  }

  override canApply(params: PostMoveInteractionAbAttrParams): boolean {
    const { pokemon, move, opponent } = params;
    /**Battler tags inflicted by abilities post attacking are also considered additional effects.*/
    return (
      super.canApply(params)
      && !opponent.hasAbilityWithAttr("IgnoreMoveEffectsAbAttr")
      && pokemon !== opponent
      && (!this.contactRequired
        || move.doesFlagEffectApply({ flag: MoveFlags.MAKES_CONTACT, user: opponent, target: pokemon }))
      && pokemon.randBattleSeedInt(100) < this.chance(opponent, pokemon, move)
      && !pokemon.status
    );
  }

  override apply({ pokemon, simulated, opponent }: PostMoveInteractionAbAttrParams): void {
    if (!simulated) {
      const effect =
        this.effects.length === 1 ? this.effects[0] : this.effects[pokemon.randBattleSeedInt(this.effects.length)];
      opponent.addTag(effect);
    }
  }
}

export class PostDefendStealHeldItemAbAttr extends PostDefendAbAttr {
  private condition?: PokemonDefendCondition;
  private stolenItem?: PokemonHeldItemModifier;

  constructor(condition?: PokemonDefendCondition) {
    super();

    this.condition = condition;
  }

  override canApply({ simulated, pokemon, opponent, move, hitResult }: PostMoveInteractionAbAttrParams): boolean {
    if (!simulated && hitResult < HitResult.NO_EFFECT && (!this.condition || this.condition(pokemon, opponent, move))) {
      const heldItems = this.getTargetHeldItems(opponent).filter(i => i.isTransferable);
      if (heldItems.length > 0) {
        this.stolenItem = heldItems[pokemon.randBattleSeedInt(heldItems.length)];
        if (globalScene.canTransferHeldItemModifier(this.stolenItem, pokemon)) {
          return true;
        }
      }
    }
    return false;
  }

  override apply({ pokemon, opponent }: PostMoveInteractionAbAttrParams): void {
    const heldItems = this.getTargetHeldItems(opponent).filter(i => i.isTransferable);
    if (!this.stolenItem) {
      this.stolenItem = heldItems[pokemon.randBattleSeedInt(heldItems.length)];
    }
    if (globalScene.tryTransferHeldItemModifier(this.stolenItem, pokemon, false)) {
      globalScene.phaseManager.queueMessage(
        i18next.t("abilityTriggers:postDefendStealHeldItem", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          attackerName: opponent.name,
          stolenItemType: this.stolenItem.type.name,
        }),
      );
    }
    this.stolenItem = undefined;
  }

  getTargetHeldItems(target: Pokemon): PokemonHeldItemModifier[] {
    return globalScene.findModifiers(
      m => m instanceof PokemonHeldItemModifier && m.pokemonId === target.id,
      target.isPlayer(),
    ) as PokemonHeldItemModifier[];
  }
}

/**
 * Shared parameters used for abilities that apply an effect after the user is inflicted with a status condition.
 */
export interface PostSetStatusAbAttrParams extends AbAttrBaseParams {
  /** The pokemon that set the status condition, or `undefined` if not set by a pokemon */
  sourcePokemon?: Pokemon;
  /** The status effect that was set */
  effect: StatusEffect;
}

/*
Subclasses that override the `canApply` and `apply` methods of `PostSetStatusAbAttr` are not allowed to change the
type of their parameters. This is enforced via the Closed type.
*/
/**
 * Base class for defining all {@linkcode Ability} Attributes after a status effect has been set.
 */
export class PostSetStatusAbAttr extends AbAttr {
  canApply(_params: Closed<PostSetStatusAbAttrParams>): boolean {
    return true;
  }

  apply(_params: Closed<PostSetStatusAbAttrParams>): void {}
}

/**
 * If another Pokemon burns, paralyzes, poisons, or badly poisons this Pokemon,
 * that Pokemon receives the same non-volatile status condition as part of this
 * ability attribute. For Synchronize ability.
 */
export class SynchronizeStatusAbAttr extends PostSetStatusAbAttr {
  /**
   * @returns Whether the status effect that was set is one of the synchronizable statuses:
   * - {@linkcode StatusEffect.BURN | Burn}
   * - {@linkcode StatusEffect.PARALYSIS | Paralysis}
   * - {@linkcode StatusEffect.POISON | Poison}
   * - {@linkcode StatusEffect.TOXIC | Toxic}
   */
  override canApply({ sourcePokemon, effect }: PostSetStatusAbAttrParams): boolean {
    /** Synchronizable statuses */
    const syncStatuses = new Set<StatusEffect>([
      StatusEffect.BURN,
      StatusEffect.PARALYSIS,
      StatusEffect.POISON,
      StatusEffect.TOXIC,
    ]);

    // synchronize does not need to check canSetStatus because the ability shows even if it fails to set the status
    return (sourcePokemon ?? false) && syncStatuses.has(effect);
  }

  /**
   * If the `StatusEffect` that was set is Burn, Paralysis, Poison, or Toxic, and the status
   * was set by a source Pokemon, set the source Pokemon's status to the same `StatusEffect`.
   */
  override apply({ simulated, effect, sourcePokemon, pokemon }: PostSetStatusAbAttrParams): void {
    if (!simulated && sourcePokemon) {
      sourcePokemon.trySetStatus(effect, pokemon);
    }
  }
}

/**
 * Base class for abilities that apply an effect after the user knocks out an opponent in battle.
 *
 * Not to be confused with {@linkcode PostKnockOutAbAttr}, which applies after any pokemon is knocked out in battle.
 */
export class PostVictoryAbAttr extends AbAttr {
  canApply(_params: Closed<AbAttrBaseParams>): boolean {
    return true;
  }

  apply(_params: Closed<AbAttrBaseParams>): void {}
}

class PostVictoryStatStageChangeAbAttr extends PostVictoryAbAttr {
  private stat: BattleStat | ((p: Pokemon) => BattleStat);
  private stages: number;

  constructor(stat: BattleStat | ((p: Pokemon) => BattleStat), stages: number) {
    super();

    this.stat = stat;
    this.stages = stages;
  }

  override apply({ pokemon, simulated }: AbAttrBaseParams): void {
    const stat = typeof this.stat === "function" ? this.stat(pokemon) : this.stat;
    if (!simulated) {
      globalScene.phaseManager.unshiftNew("StatStageChangePhase", pokemon.getBattlerIndex(), true, [stat], this.stages);
    }
  }
}

export class PostVictoryFormChangeAbAttr extends PostVictoryAbAttr {
  private formFunc: (p: Pokemon) => number;

  constructor(formFunc: (p: Pokemon) => number) {
    super(true);

    this.formFunc = formFunc;
  }

  override canApply({ pokemon }: AbAttrBaseParams): boolean {
    const formIndex = this.formFunc(pokemon);
    return formIndex !== pokemon.formIndex;
  }

  override apply({ simulated, pokemon }: AbAttrBaseParams): void {
    if (!simulated) {
      globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeAbilityTrigger, false);
    }
  }
}

/**
 * Shared parameters used for abilities that apply an effect after a Pokemon (other than the user) is knocked out.
 */
export interface PostKnockOutAbAttrParams extends AbAttrBaseParams {
  /** The Pokemon that was knocked out */
  victim: Pokemon;
}

/**
 * Base class for ability attributes that apply after a Pokemon (other than the user) is knocked out, including indirectly.
 *
 * Not to be confused with {@linkcode PostVictoryAbAttr}, which applies after the user directly knocks out an opponent.
 */
export abstract class PostKnockOutAbAttr extends AbAttr {
  canApply(_params: Closed<PostKnockOutAbAttrParams>): boolean {
    return true;
  }

  apply(_params: Closed<PostKnockOutAbAttrParams>): void {}
}

export class PostKnockOutStatStageChangeAbAttr extends PostKnockOutAbAttr {
  private stat: BattleStat | ((p: Pokemon) => BattleStat);
  private stages: number;

  constructor(stat: BattleStat | ((p: Pokemon) => BattleStat), stages: number) {
    super();

    this.stat = stat;
    this.stages = stages;
  }

  override apply({ pokemon, simulated }: PostKnockOutAbAttrParams): void {
    const stat = typeof this.stat === "function" ? this.stat(pokemon) : this.stat;
    if (!simulated) {
      globalScene.phaseManager.unshiftNew("StatStageChangePhase", pokemon.getBattlerIndex(), true, [stat], this.stages);
    }
  }
}

export class CopyFaintedAllyAbilityAbAttr extends PostKnockOutAbAttr {
  override canApply({ pokemon, victim }: PostKnockOutAbAttrParams): boolean {
    return pokemon.isPlayer() === victim.isPlayer() && victim.getAbility().isCopiable;
  }

  override apply({ pokemon, simulated, victim }: PostKnockOutAbAttrParams): void {
    if (!simulated) {
      pokemon.setTempAbility(victim.getAbility());
      globalScene.phaseManager.queueMessage(
        i18next.t("abilityTriggers:copyFaintedAllyAbility", {
          pokemonNameWithAffix: getPokemonNameWithAffix(victim),
          abilityName: allAbilities[victim.getAbility().id].name,
        }),
      );
    }
  }
}

export interface IgnoreOpponentStatStagesAbAttrParams extends AbAttrBaseParams {
  /** The stat to check for ignorability */
  stat: BattleStat;
  /** Holds whether the stat is ignored by the ability */
  ignored: BooleanHolder;
}
/**
 * Ability attribute for ignoring the opponent's stat changes
 * @param stats the stats that should be ignored
 */
export class IgnoreOpponentStatStagesAbAttr extends AbAttr {
  private stats: readonly BattleStat[];

  constructor(stats?: BattleStat[]) {
    super(false);

    this.stats = stats ?? BATTLE_STATS;
  }

  /**
   * @returns Whether `stat` is one of the stats ignored by the ability
   */
  override canApply({ stat }: IgnoreOpponentStatStagesAbAttrParams): boolean {
    return this.stats.includes(stat);
  }

  /**
   * Sets the ignored holder to true.
   */
  override apply({ ignored }: IgnoreOpponentStatStagesAbAttrParams): void {
    ignored.value = true;
  }
}

/**
 * Abilities with this attribute prevent the user from being affected by Intimidate.
 * @sealed
 */
export class IntimidateImmunityAbAttr extends CancelInteractionAbAttr {
  constructor() {
    super(false);
  }

  getTriggerMessage({ pokemon }: AbAttrParamsWithCancel, abilityName: string, ..._args: any[]): string {
    return i18next.t("abilityTriggers:intimidateImmunity", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      abilityName,
    });
  }
}

export class PostIntimidateStatStageChangeAbAttr extends AbAttr {
  private stats: BattleStat[];
  private stages: number;
  private overwrites: boolean;

  constructor(stats: BattleStat[], stages: number, overwrites?: boolean) {
    super(true);
    this.stats = stats;
    this.stages = stages;
    this.overwrites = !!overwrites;
  }

  override apply({ pokemon, simulated, cancelled }: AbAttrParamsWithCancel): void {
    if (!simulated) {
      globalScene.phaseManager.pushNew(
        "StatStageChangePhase",
        pokemon.getBattlerIndex(),
        false,
        this.stats,
        this.stages,
      );
    }
    cancelled.value = this.overwrites;
  }
}

/**
 * Base class for defining all {@linkcode Ability} Attributes post summon
 * @see {@linkcode applyPostSummon()}
 */
export abstract class PostSummonAbAttr extends AbAttr {
  /** Should the ability activate when gained in battle? This will almost always be true */
  private activateOnGain: boolean;

  constructor(showAbility = true, activateOnGain = true) {
    super(showAbility);
    this.activateOnGain = activateOnGain;
  }

  /**
   * @returns Whether the ability should activate when gained in battle
   */
  shouldActivateOnGain(): boolean {
    return this.activateOnGain;
  }

  canApply(_params: Closed<AbAttrBaseParams>): boolean {
    return true;
  }

  /**
   * Applies ability post summon (after switching in)
   */
  apply(_params: Closed<AbAttrBaseParams>): void {}
}

/**
 * Base class for ability attributes which remove an effect on summon
 */
export abstract class PostSummonRemoveEffectAbAttr extends PostSummonAbAttr {}

/**
 * Removes specified arena tags when a Pokemon is summoned.
 */
export class PostSummonRemoveArenaTagAbAttr extends PostSummonAbAttr {
  private arenaTags: ArenaTagType[];

  /**
   * @param arenaTags {@linkcode ArenaTagType[]} - the arena tags to be removed
   */
  constructor(arenaTags: ArenaTagType[]) {
    super(true);

    this.arenaTags = arenaTags;
  }

  override canApply(_params: AbAttrBaseParams): boolean {
    return globalScene.arena.tags.some(tag => this.arenaTags.includes(tag.tagType));
  }

  override apply({ simulated }: AbAttrBaseParams): void {
    if (!simulated) {
      for (const arenaTag of this.arenaTags) {
        globalScene.arena.removeTag(arenaTag);
      }
    }
  }
}

/**
 * Generic class to add an arena tag upon switching in
 */
export class PostSummonAddArenaTagAbAttr extends PostSummonAbAttr {
  private readonly tagType: ArenaTagType;
  private readonly turnCount: number;
  private readonly side?: ArenaTagSide;
  private readonly quiet?: boolean;
  private sourceId: number;

  constructor(showAbility: boolean, tagType: ArenaTagType, turnCount: number, side?: ArenaTagSide, quiet?: boolean) {
    super(showAbility);
    this.tagType = tagType;
    this.turnCount = turnCount;
    this.side = side;
    this.quiet = quiet;
  }

  public override apply({ pokemon, simulated }: AbAttrBaseParams): void {
    this.sourceId = pokemon.id;
    if (!simulated) {
      globalScene.arena.addTag(this.tagType, this.turnCount, undefined, this.sourceId, this.side, this.quiet);
    }
  }
}

export class PostSummonMessageAbAttr extends PostSummonAbAttr {
  private messageFunc: (pokemon: Pokemon) => string;

  constructor(messageFunc: (pokemon: Pokemon) => string) {
    super(true);

    this.messageFunc = messageFunc;
  }

  override apply({ simulated, pokemon }: AbAttrBaseParams): void {
    if (!simulated) {
      globalScene.phaseManager.queueMessage(this.messageFunc(pokemon));
    }
  }
}

export class PostSummonUnnamedMessageAbAttr extends PostSummonAbAttr {
  //Attr doesn't force pokemon name on the message
  private message: string;

  constructor(message: string) {
    super(true);

    this.message = message;
  }

  override apply({ simulated }: AbAttrBaseParams): void {
    if (!simulated) {
      globalScene.phaseManager.queueMessage(this.message);
    }
  }
}

export class PostSummonAddBattlerTagAbAttr extends PostSummonAbAttr {
  private tagType: BattlerTagType;
  private turnCount: number;

  constructor(tagType: BattlerTagType, turnCount: number, showAbility?: boolean) {
    super(showAbility);

    this.tagType = tagType;
    this.turnCount = turnCount;
  }

  override canApply({ pokemon }: AbAttrBaseParams): boolean {
    return pokemon.canAddTag(this.tagType);
  }

  override apply({ simulated, pokemon }: AbAttrBaseParams): void {
    if (!simulated) {
      pokemon.addTag(this.tagType, this.turnCount);
    }
  }
}

/**
 * Removes Specific battler tags when a Pokemon is summoned
 *
 * This should realistically only ever activate on gain rather than on summon
 */
export class PostSummonRemoveBattlerTagAbAttr extends PostSummonRemoveEffectAbAttr {
  private immuneTags: BattlerTagType[];

  /**
   * @param immuneTags - The {@linkcode BattlerTagType | battler tags} the Pokémon is immune to.
   */
  constructor(...immuneTags: BattlerTagType[]) {
    super();
    this.immuneTags = immuneTags;
  }

  public override canApply({ pokemon }: AbAttrBaseParams): boolean {
    return this.immuneTags.some(tagType => !!pokemon.getTag(tagType));
  }

  public override apply({ pokemon }: AbAttrBaseParams): void {
    this.immuneTags.forEach(tagType => pokemon.removeTag(tagType));
  }
}

export class PostSummonStatStageChangeAbAttr extends PostSummonAbAttr {
  private stats: BattleStat[];
  private stages: number;
  private selfTarget: boolean;
  private intimidate: boolean;

  constructor(stats: BattleStat[], stages: number, selfTarget?: boolean, intimidate?: boolean) {
    super(true);

    this.stats = stats;
    this.stages = stages;
    this.selfTarget = !!selfTarget;
    this.intimidate = !!intimidate;
  }

  override apply({ pokemon, simulated }: AbAttrBaseParams): void {
    if (simulated) {
      return;
    }

    if (this.selfTarget) {
      // we unshift the StatStageChangePhase to put it right after the showAbility and not at the end of the
      // phase list (which could be after CommandPhase for example)
      globalScene.phaseManager.unshiftNew(
        "StatStageChangePhase",
        pokemon.getBattlerIndex(),
        true,
        this.stats,
        this.stages,
      );
      return;
    }

    for (const opponent of pokemon.getOpponents()) {
      const cancelled = new BooleanHolder(false);
      if (this.intimidate) {
        const params: AbAttrParamsWithCancel = { pokemon: opponent, cancelled, simulated };
        applyAbAttrs("IntimidateImmunityAbAttr", params);
        applyAbAttrs("PostIntimidateStatStageChangeAbAttr", params);

        if (opponent.getTag(BattlerTagType.SUBSTITUTE)) {
          cancelled.value = true;
        }
      }
      if (!cancelled.value) {
        globalScene.phaseManager.unshiftNew(
          "StatStageChangePhase",
          opponent.getBattlerIndex(),
          false,
          this.stats,
          this.stages,
        );
      }
    }
  }
}

export class PostSummonAllyHealAbAttr extends PostSummonAbAttr {
  private healRatio: number;
  private showAnim: boolean;

  constructor(healRatio: number, showAnim = false) {
    super();

    this.healRatio = healRatio || 4;
    this.showAnim = showAnim;
  }

  override canApply({ pokemon }: AbAttrBaseParams): boolean {
    return pokemon.getAlly()?.isActive(true) ?? false;
  }

  override apply({ pokemon, simulated }: AbAttrBaseParams): void {
    const target = pokemon.getAlly();
    if (!simulated && !isNullOrUndefined(target)) {
      globalScene.phaseManager.unshiftNew(
        "PokemonHealPhase",
        target.getBattlerIndex(),
        toDmgValue(pokemon.getMaxHp() / this.healRatio),
        i18next.t("abilityTriggers:postSummonAllyHeal", {
          pokemonNameWithAffix: getPokemonNameWithAffix(target),
          pokemonName: pokemon.name,
        }),
        true,
        !this.showAnim,
      );
    }
  }
}

/**
 * Resets an ally's temporary stat boots to zero with no regard to
 * whether this is a positive or negative change
 * @param pokemon The {@link Pokemon} with this {@link AbAttr}
 * @param passive N/A
 * @param args N/A
 * @returns if the move was successful
 */
export class PostSummonClearAllyStatStagesAbAttr extends PostSummonAbAttr {
  override canApply({ pokemon }: AbAttrBaseParams): boolean {
    return pokemon.getAlly()?.isActive(true) ?? false;
  }

  override apply({ pokemon, simulated }: AbAttrBaseParams): void {
    const target = pokemon.getAlly();
    if (!simulated && !isNullOrUndefined(target)) {
      for (const s of BATTLE_STATS) {
        target.setStatStage(s, 0);
      }

      globalScene.phaseManager.queueMessage(
        i18next.t("abilityTriggers:postSummonClearAllyStats", {
          pokemonNameWithAffix: getPokemonNameWithAffix(target),
        }),
      );
    }
  }
}

/**
 * Download raises either the Attack stat or Special Attack stat by one stage depending on the foe's currently lowest defensive stat:
 * it will raise Attack if the foe's current Defense is lower than its current Special Defense stat;
 * otherwise, it will raise Special Attack.
 */
export class DownloadAbAttr extends PostSummonAbAttr {
  private enemyDef: number;
  private enemySpDef: number;
  private enemyCountTally: number;
  private stats: BattleStat[];

  override canApply({ pokemon }: AbAttrBaseParams): boolean {
    this.enemyDef = 0;
    this.enemySpDef = 0;
    this.enemyCountTally = 0;

    for (const opponent of pokemon.getOpponents()) {
      this.enemyCountTally++;
      this.enemyDef += opponent.getEffectiveStat(Stat.DEF);
      this.enemySpDef += opponent.getEffectiveStat(Stat.SPDEF);
    }
    this.enemyDef = Math.round(this.enemyDef / this.enemyCountTally);
    this.enemySpDef = Math.round(this.enemySpDef / this.enemyCountTally);
    return this.enemyDef > 0 && this.enemySpDef > 0;
  }

  /**
   * Checks to see if it is the opening turn (starting a new game), if so, Download won't work. This is because Download takes into account
   * vitamins and items, so it needs to use the Stat and the stat alone.
   */
  override apply({ pokemon, simulated }: AbAttrBaseParams): void {
    if (this.enemyDef < this.enemySpDef) {
      this.stats = [Stat.ATK];
    } else {
      this.stats = [Stat.SPATK];
    }

    if (!simulated) {
      globalScene.phaseManager.unshiftNew("StatStageChangePhase", pokemon.getBattlerIndex(), false, this.stats, 1);
    }
  }
}

export class PostSummonWeatherChangeAbAttr extends PostSummonAbAttr {
  private weatherType: WeatherType;

  constructor(weatherType: WeatherType) {
    super();

    this.weatherType = weatherType;
  }

  override canApply(_params: AbAttrBaseParams): boolean {
    const weatherReplaceable =
      this.weatherType === WeatherType.HEAVY_RAIN
      || this.weatherType === WeatherType.HARSH_SUN
      || this.weatherType === WeatherType.STRONG_WINDS
      || !globalScene.arena.weather?.isImmutable();
    return weatherReplaceable && globalScene.arena.canSetWeather(this.weatherType);
  }

  override apply({ pokemon, simulated }: AbAttrBaseParams): void {
    if (!simulated) {
      globalScene.arena.trySetWeather(this.weatherType, pokemon);
    }
  }
}

export class PostSummonTerrainChangeAbAttr extends PostSummonAbAttr {
  private terrainType: TerrainType;

  constructor(terrainType: TerrainType) {
    super();

    this.terrainType = terrainType;
  }

  override canApply(_params: AbAttrBaseParams): boolean {
    return globalScene.arena.canSetTerrain(this.terrainType);
  }

  override apply({ simulated, pokemon }: AbAttrBaseParams): void {
    if (!simulated) {
      globalScene.arena.trySetTerrain(this.terrainType, false, pokemon);
    }
  }
}

/**
 * Heals a status effect if the Pokemon is afflicted with it upon switch in (or gain)
 */
export class PostSummonHealStatusAbAttr extends PostSummonRemoveEffectAbAttr {
  private immuneEffects: StatusEffect[];
  private statusHealed: StatusEffect;

  /**
   * @param immuneEffects - The {@linkcode StatusEffect}s the Pokémon is immune to.
   */
  constructor(...immuneEffects: StatusEffect[]) {
    super();
    this.immuneEffects = immuneEffects;
  }

  public override canApply({ pokemon }: AbAttrBaseParams): boolean {
    const status = pokemon.status?.effect;
    return !isNullOrUndefined(status) && (this.immuneEffects.length === 0 || this.immuneEffects.includes(status));
  }

  public override apply({ pokemon }: AbAttrBaseParams): void {
    // TODO: should probably check against simulated...
    const status = pokemon.status?.effect;
    if (!isNullOrUndefined(status)) {
      this.statusHealed = status;
      pokemon.resetStatus(false);
      pokemon.updateInfo();
    }
  }

  public override getTriggerMessage({ pokemon }: AbAttrBaseParams): string | null {
    if (this.statusHealed) {
      return getStatusEffectHealText(this.statusHealed, getPokemonNameWithAffix(pokemon));
    }
    return null;
  }
}

export class PostSummonFormChangeAbAttr extends PostSummonAbAttr {
  private formFunc: (p: Pokemon) => number;

  constructor(formFunc: (p: Pokemon) => number) {
    super(true);

    this.formFunc = formFunc;
  }

  override canApply({ pokemon }: AbAttrBaseParams): boolean {
    return this.formFunc(pokemon) !== pokemon.formIndex;
  }

  override apply({ pokemon, simulated }: AbAttrBaseParams): void {
    if (!simulated) {
      globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeAbilityTrigger, false);
    }
  }
}

/**
 * Attempts to copy a pokemon's ability
 *
 * @remarks
 * Hardcodes idiosyncrasies specific to trace, so should not be used for other abilities
 * that might copy abilities in the future
 * @sealed
 */
export class PostSummonCopyAbilityAbAttr extends PostSummonAbAttr {
  private target: Pokemon;
  private targetAbilityName: string;

  override canApply({ pokemon, simulated }: AbAttrBaseParams): boolean {
    const targets = pokemon
      .getOpponents()
      .filter(t => t.getAbility().isCopiable || t.getAbility().id === AbilityId.WONDER_GUARD);
    if (targets.length === 0) {
      return false;
    }

    let target: Pokemon;
    // simulated call always chooses first target so as to not advance RNG
    if (targets.length > 1 && !simulated) {
      target = targets[randSeedInt(targets.length)];
    } else {
      target = targets[0];
    }

    this.target = target;
    this.targetAbilityName = allAbilities[target.getAbility().id].name;
    return true;
  }

  override apply({ pokemon, simulated }: AbAttrBaseParams): void {
    // Protect against this somehow being called before canApply by ensuring target is defined
    if (!simulated && this.target) {
      pokemon.setTempAbility(this.target.getAbility());
      setAbilityRevealed(this.target);
      pokemon.updateInfo();
    }
  }

  getTriggerMessage({ pokemon }, _abilityName: string): string {
    return i18next.t("abilityTriggers:trace", {
      pokemonName: getPokemonNameWithAffix(pokemon),
      targetName: getPokemonNameWithAffix(this.target),
      abilityName: this.targetAbilityName,
    });
  }
}

/**
 * Removes supplied status effects from the user's field.
 */
export class PostSummonUserFieldRemoveStatusEffectAbAttr extends PostSummonAbAttr {
  private statusEffect: StatusEffect[];

  /**
   * @param statusEffect - The status effects to be removed from the user's field.
   */
  constructor(...statusEffect: StatusEffect[]) {
    super(false);

    this.statusEffect = statusEffect;
  }

  override canApply({ pokemon }: AbAttrBaseParams): boolean {
    const party = pokemon.isPlayer() ? globalScene.getPlayerField() : globalScene.getEnemyField();
    return party.filter(p => p.isAllowedInBattle()).length > 0;
  }

  /**
   * Removes supplied status effect from the user's field when user of the ability is summoned.
   */
  override apply({ pokemon, simulated }: AbAttrBaseParams): void {
    if (simulated) {
      return;
    }
    const party = pokemon.isPlayer() ? globalScene.getPlayerField() : globalScene.getEnemyField();
    const allowedParty = party.filter(p => p.isAllowedInBattle());

    for (const pokemon of allowedParty) {
      if (pokemon.status && this.statusEffect.includes(pokemon.status.effect)) {
        globalScene.phaseManager.queueMessage(
          getStatusEffectHealText(pokemon.status.effect, getPokemonNameWithAffix(pokemon)),
        );
        pokemon.resetStatus(false);
        pokemon.updateInfo();
      }
    }
  }
}

/** Attempt to copy the stat changes on an ally pokemon */
export class PostSummonCopyAllyStatsAbAttr extends PostSummonAbAttr {
  override canApply({ pokemon }: AbAttrBaseParams): boolean {
    if (!globalScene.currentBattle.double) {
      return false;
    }

    const ally = pokemon.getAlly();
    return !(isNullOrUndefined(ally) || ally.getStatStages().every(s => s === 0));
  }

  override apply({ pokemon, simulated }: AbAttrBaseParams): void {
    if (simulated) {
      return;
    }
    const ally = pokemon.getAlly();
    if (!isNullOrUndefined(ally)) {
      for (const s of BATTLE_STATS) {
        pokemon.setStatStage(s, ally.getStatStage(s));
      }
      pokemon.updateInfo();
    }
  }

  getTriggerMessage({ pokemon }: AbAttrBaseParams, _abilityName: string): string {
    return i18next.t("abilityTriggers:costar", {
      pokemonName: getPokemonNameWithAffix(pokemon),
      allyName: getPokemonNameWithAffix(pokemon.getAlly()),
    });
  }
}

/**
 * Attribute used by {@linkcode AbilityId.IMPOSTER} to transform into a random opposing pokemon on entry.
 */
export class PostSummonTransformAbAttr extends PostSummonAbAttr {
  private targetIndex: BattlerIndex = BattlerIndex.ATTACKER;
  constructor() {
    super(true, false);
  }

  /**
   * Return the correct opponent for Imposter to copy, barring enemies with fusions, substitutes and illusions.
   * @param user - The {@linkcode Pokemon} with this ability.
   * @returns The {@linkcode Pokemon} to transform into, or `undefined` if none are eligible.
   * @remarks
   * This sets the private `targetIndex` field to the target's {@linkcode BattlerIndex} on success.
   */
  private getTarget(user: Pokemon): Pokemon | undefined {
    // As opposed to the mainline behavior of "always copy the opposite slot",
    // PKR Imposter instead attempts to copy a random eligible opposing Pokemon meeting Transform's criteria.
    // If none are eligible to copy, it will not activate.
    const targets = user.getOpponents().filter(opp => user.canTransformInto(opp));
    if (targets.length === 0) {
      return;
    }

    const mon = targets[user.randBattleSeedInt(targets.length)];
    this.targetIndex = mon.getBattlerIndex();
    return mon;
  }

  override canApply({ pokemon }: AbAttrBaseParams): boolean {
    const target = this.getTarget(pokemon);

    return !!target;
  }

  override apply({ pokemon }: AbAttrBaseParams): void {
    globalScene.phaseManager.unshiftNew("PokemonTransformPhase", pokemon.getBattlerIndex(), this.targetIndex, true);
  }
}

/**
 * Reverts weather-based forms to their normal forms when the user is summoned.
 * Used by Cloud Nine and Air Lock.
 * @extends PostSummonAbAttr
 */
export class PostSummonWeatherSuppressedFormChangeAbAttr extends PostSummonAbAttr {
  override canApply(_params: AbAttrBaseParams): boolean {
    return getPokemonWithWeatherBasedForms().length > 0;
  }

  /**
   * Triggers {@linkcode Arena.triggerWeatherBasedFormChangesToNormal | triggerWeatherBasedFormChangesToNormal}
   */
  override apply({ simulated }: AbAttrBaseParams): void {
    if (!simulated) {
      globalScene.arena.triggerWeatherBasedFormChangesToNormal();
    }
  }
}

/**
 * Triggers weather-based form change when summoned into an active weather.
 * Used by Forecast and Flower Gift.
 * @extends PostSummonAbAttr
 */
export class PostSummonFormChangeByWeatherAbAttr extends PostSummonAbAttr {
  private ability: AbilityId;

  constructor(ability: AbilityId) {
    super(true);

    this.ability = ability;
  }

  /**
   * Determine if the pokemon has a forme change that is triggered by the weather
   */
  override canApply({ pokemon }: AbAttrBaseParams): boolean {
    return !!pokemonFormChanges[pokemon.species.speciesId]?.some(
      fc => fc.findTrigger(SpeciesFormChangeWeatherTrigger) && fc.canChange(pokemon),
    );
  }

  /**
   * Calls the {@linkcode BattleScene.triggerPokemonFormChange | triggerPokemonFormChange} for both
   * {@linkcode SpeciesFormChangeWeatherTrigger} and
   * {@linkcode SpeciesFormChangeRevertWeatherFormTrigger} if it
   * is the specific Pokemon and ability
   */
  override apply({ pokemon, simulated }: AbAttrBaseParams): void {
    if (!simulated) {
      globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeWeatherTrigger);
    }
  }
}

/**
 * Attribute implementing the effects of {@link https://bulbapedia.bulbagarden.net/wiki/Commander_(Ability) | Commander}.
 * When the source of an ability with this attribute detects a Dondozo as their active ally, the source "jumps
 * into the Dondozo's mouth", sharply boosting the Dondozo's stats, cancelling the source's moves, and
 * causing attacks that target the source to always miss.
 */
export class CommanderAbAttr extends AbAttr {
  constructor() {
    super(true);
  }

  override canApply({ pokemon }: AbAttrBaseParams): boolean {
    // If the ally Dondozo is fainted or was previously "commanded" by
    // another Pokemon, this effect cannot apply.

    // TODO: Should this work with X + Dondozo fusions?
    const ally = pokemon.getAlly();
    return (
      globalScene.currentBattle?.double
      && !isNullOrUndefined(ally)
      && ally.species.speciesId === SpeciesId.DONDOZO
      && !(ally.isFainted() || ally.getTag(BattlerTagType.COMMANDED))
    );
  }

  override apply({ pokemon, simulated }: AbAttrBaseParams): void {
    if (!simulated) {
      // Lapse the source's semi-invulnerable tags (to avoid visual inconsistencies)
      pokemon.lapseTags(BattlerTagLapseType.MOVE_EFFECT);
      // Play an animation of the source jumping into the ally Dondozo's mouth
      globalScene.triggerPokemonBattleAnim(pokemon, PokemonAnimType.COMMANDER_APPLY);
      // Apply boosts from this effect to the ally Dondozo
      pokemon.getAlly()?.addTag(BattlerTagType.COMMANDED, 0, MoveId.NONE, pokemon.id);
      // Cancel the source Pokemon's next move (if a move is queued)
      globalScene.phaseManager.tryRemovePhase(phase => phase.is("MovePhase") && phase.pokemon === pokemon);
    }
  }
}

/**
 * Base class for ability attributes that apply their effect when their user switches out.
 */
export abstract class PreSwitchOutAbAttr extends AbAttr {
  constructor(showAbility = true) {
    super(showAbility);
  }

  canApply(_params: Closed<AbAttrBaseParams>): boolean {
    return true;
  }

  apply(_params: Closed<AbAttrBaseParams>): void {}
}

/**
 * Resets all status effects on the user when it switches out.
 */
export class PreSwitchOutResetStatusAbAttr extends PreSwitchOutAbAttr {
  constructor() {
    super(false);
  }

  override canApply({ pokemon }: AbAttrBaseParams): boolean {
    return !isNullOrUndefined(pokemon.status);
  }

  override apply({ pokemon, simulated }: AbAttrBaseParams): void {
    if (!simulated) {
      pokemon.resetStatus();
      pokemon.updateInfo();
    }
  }
}

/**
 * Clears Desolate Land/Primordial Sea/Delta Stream upon the Pokemon switching out.
 */
export class PreSwitchOutClearWeatherAbAttr extends PreSwitchOutAbAttr {
  override apply({ pokemon, simulated }: AbAttrBaseParams): boolean {
    // TODO: Evaluate why this is returning a boolean rather than relay
    const weatherType = globalScene.arena.weather?.weatherType;
    let turnOffWeather = false;

    // Clear weather only if user's ability matches the weather and no other pokemon has the ability.
    switch (weatherType) {
      case WeatherType.HARSH_SUN:
        if (
          pokemon.hasAbility(AbilityId.DESOLATE_LAND)
          && globalScene
            .getField(true)
            .filter(p => p !== pokemon)
            .filter(p => p.hasAbility(AbilityId.DESOLATE_LAND)).length === 0
        ) {
          turnOffWeather = true;
        }
        break;
      case WeatherType.HEAVY_RAIN:
        if (
          pokemon.hasAbility(AbilityId.PRIMORDIAL_SEA)
          && globalScene
            .getField(true)
            .filter(p => p !== pokemon)
            .filter(p => p.hasAbility(AbilityId.PRIMORDIAL_SEA)).length === 0
        ) {
          turnOffWeather = true;
        }
        break;
      case WeatherType.STRONG_WINDS:
        if (
          pokemon.hasAbility(AbilityId.DELTA_STREAM)
          && globalScene
            .getField(true)
            .filter(p => p !== pokemon)
            .filter(p => p.hasAbility(AbilityId.DELTA_STREAM)).length === 0
        ) {
          turnOffWeather = true;
        }
        break;
    }

    if (simulated) {
      return turnOffWeather;
    }

    if (turnOffWeather) {
      globalScene.arena.trySetWeather(WeatherType.NONE);
      return true;
    }

    return false;
  }
}

export class PreSwitchOutHealAbAttr extends PreSwitchOutAbAttr {
  override canApply({ pokemon }: AbAttrBaseParams): boolean {
    return !pokemon.isFullHp();
  }

  override apply({ pokemon, simulated }: AbAttrBaseParams): void {
    if (!simulated) {
      const healAmount = toDmgValue(pokemon.getMaxHp() * 0.33);
      pokemon.heal(healAmount);
      pokemon.updateInfo();
    }
  }
}

/**
 * Attribute for form changes that occur on switching out
 * @see {@linkcode applyPreSwitchOut}
 */
export class PreSwitchOutFormChangeAbAttr extends PreSwitchOutAbAttr {
  private formFunc: (p: Pokemon) => number;

  constructor(formFunc: (p: Pokemon) => number) {
    super();

    this.formFunc = formFunc;
  }

  override canApply({ pokemon }: AbAttrBaseParams): boolean {
    return this.formFunc(pokemon) !== pokemon.formIndex;
  }

  /**
   * On switch out, trigger the form change to the one defined in the ability
   */
  override apply({ simulated, pokemon }: AbAttrBaseParams): void {
    if (!simulated) {
      globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeAbilityTrigger, false);
    }
  }
}

/**
 * Base class for ability attributes that apply their effect just before the user leaves the field
 */
export class PreLeaveFieldAbAttr extends AbAttr {
  canApply(_params: Closed<AbAttrBaseParams>): boolean {
    return true;
  }

  apply(_params: Closed<AbAttrBaseParams>): void {}
}

/**
 * Clears Desolate Land/Primordial Sea/Delta Stream upon the Pokemon switching out.
 */
export class PreLeaveFieldClearWeatherAbAttr extends PreLeaveFieldAbAttr {
  override canApply({ pokemon }: AbAttrBaseParams): boolean {
    const weatherType = globalScene.arena.weather?.weatherType;
    // Clear weather only if user's ability matches the weather and no other pokemon has the ability.
    switch (weatherType) {
      case WeatherType.HARSH_SUN:
        if (
          pokemon.hasAbility(AbilityId.DESOLATE_LAND)
          && globalScene
            .getField(true)
            .filter(p => p !== pokemon)
            .filter(p => p.hasAbility(AbilityId.DESOLATE_LAND)).length === 0
        ) {
          return true;
        }
        break;
      case WeatherType.HEAVY_RAIN:
        if (
          pokemon.hasAbility(AbilityId.PRIMORDIAL_SEA)
          && globalScene
            .getField(true)
            .filter(p => p !== pokemon)
            .filter(p => p.hasAbility(AbilityId.PRIMORDIAL_SEA)).length === 0
        ) {
          return true;
        }
        break;
      case WeatherType.STRONG_WINDS:
        if (
          pokemon.hasAbility(AbilityId.DELTA_STREAM)
          && globalScene
            .getField(true)
            .filter(p => p !== pokemon)
            .filter(p => p.hasAbility(AbilityId.DELTA_STREAM)).length === 0
        ) {
          return true;
        }
        break;
    }
    return false;
  }

  override apply({ simulated }: AbAttrBaseParams): void {
    if (!simulated) {
      globalScene.arena.trySetWeather(WeatherType.NONE);
    }
  }
}

/**
 * Updates the active {@linkcode SuppressAbilitiesTag} when a pokemon with {@linkcode AbilityId.NEUTRALIZING_GAS} leaves the field
 *
 * @sealed
 */
export class PreLeaveFieldRemoveSuppressAbilitiesSourceAbAttr extends PreLeaveFieldAbAttr {
  constructor() {
    super(false);
  }

  public override canApply(_params: AbAttrBaseParams): boolean {
    return !!globalScene.arena.getTag(ArenaTagType.NEUTRALIZING_GAS);
  }

  public override apply(_params: AbAttrBaseParams): void {
    const suppressTag = globalScene.arena.getTag(ArenaTagType.NEUTRALIZING_GAS) as SuppressAbilitiesTag;
    suppressTag.onSourceLeave(globalScene.arena);
  }
}

export interface PreStatStageChangeAbAttrParams extends AbAttrBaseParams {
  /** The stat being affected by the stat stage change */
  stat: BattleStat;
  /** The amount of stages to change by (negative if the stat is being decreased) */
  stages: number;
  /**
   * The source of the stat stage drop. May be omitted if the source of the stat drop is the user itself.
   *
   * @remarks
   * Currently, only used by {@linkcode ReflectStatStageChangeAbAttr} in order to reflect the stat stage change
   */
  source?: Pokemon;
  /** Holder that will be set to true if the stat stage change should be cancelled due to the ability */
  cancelled: BooleanHolder;
}

/**
 * Base class for ability attributes that apply their effect before a stat stage change.
 */
export abstract class PreStatStageChangeAbAttr extends AbAttr {
  canApply(_params: Closed<PreStatStageChangeAbAttrParams>): boolean {
    return true;
  }

  apply(_params: Closed<PreStatStageChangeAbAttrParams>): void {}
}

/**
 * Reflect all {@linkcode BattleStat} reductions caused by other Pokémon's moves and Abilities.
 * Currently only applies to Mirror Armor.
 */
export class ReflectStatStageChangeAbAttr extends PreStatStageChangeAbAttr {
  /** {@linkcode BattleStat} to reflect */
  private reflectedStat?: BattleStat;

  override canApply({ source, cancelled }: PreStatStageChangeAbAttrParams): boolean {
    return !!source && !cancelled.value;
  }

  /**
   * Apply the {@linkcode ReflectStatStageChangeAbAttr} to an interaction
   */
  override apply({ source, cancelled, stat, simulated, stages }: PreStatStageChangeAbAttrParams): void {
    if (!source) {
      return;
    }
    this.reflectedStat = stat;
    if (!simulated) {
      globalScene.phaseManager.unshiftNew(
        "StatStageChangePhase",
        source.getBattlerIndex(),
        false,
        [stat],
        stages,
        true,
        false,
        true,
        null,
        true,
      );
    }
    cancelled.value = true;
  }

  getTriggerMessage({ pokemon }: PreStatStageChangeAbAttrParams, abilityName: string): string {
    return i18next.t("abilityTriggers:protectStat", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      abilityName,
      statName: this.reflectedStat ? i18next.t(getStatKey(this.reflectedStat)) : i18next.t("battle:stats"),
    });
  }
}

/**
 * Protect one or all {@linkcode BattleStat} from reductions caused by other Pokémon's moves and Abilities
 */
export class ProtectStatAbAttr extends PreStatStageChangeAbAttr {
  /** {@linkcode BattleStat} to protect or `undefined` if **all** {@linkcode BattleStat} are protected */
  private protectedStat?: BattleStat;

  constructor(protectedStat?: BattleStat) {
    super();

    this.protectedStat = protectedStat;
  }

  override canApply({ stat, cancelled }: PreStatStageChangeAbAttrParams): boolean {
    return !cancelled.value && (isNullOrUndefined(this.protectedStat) || stat === this.protectedStat);
  }

  /**
   * Apply the {@linkcode ProtectedStatAbAttr} to an interaction
   */
  override apply({ cancelled }: PreStatStageChangeAbAttrParams): void {
    cancelled.value = true;
  }

  override getTriggerMessage({ pokemon }: PreStatStageChangeAbAttrParams, abilityName: string): string {
    return i18next.t("abilityTriggers:protectStat", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      abilityName,
      statName: this.protectedStat ? i18next.t(getStatKey(this.protectedStat)) : i18next.t("battle:stats"),
    });
  }
}

export interface ConfusionOnStatusEffectAbAttrParams extends AbAttrBaseParams {
  /** The status effect that was applied */
  effect: StatusEffect;
  /** The move that applied the status effect */
  move: Move;
  /** The opponent that was inflicted with the status effect */
  opponent: Pokemon;
}

/**
 * This attribute applies confusion to the target whenever the user
 * directly poisons them with a move, e.g. Poison Puppeteer.
 * Called in {@linkcode StatusEffectAttr}.
 */
export class ConfusionOnStatusEffectAbAttr extends AbAttr {
  /** List of effects to apply confusion after */
  private effects: ReadonlySet<StatusEffect>;

  constructor(...effects: StatusEffect[]) {
    super();
    this.effects = new Set(effects);
  }

  /**
   * @returns Whether the ability can apply confusion to the opponent
   */
  override canApply({ opponent, effect }: ConfusionOnStatusEffectAbAttrParams): boolean {
    return this.effects.has(effect) && !opponent.isFainted() && opponent.canAddTag(BattlerTagType.CONFUSED);
  }

  /**
   * Applies confusion to the target pokemon.
   */
  override apply({ opponent, simulated, pokemon, move }: ConfusionOnStatusEffectAbAttrParams): void {
    if (!simulated) {
      opponent.addTag(BattlerTagType.CONFUSED, pokemon.randBattleSeedIntRange(2, 5), move.id, opponent.id);
    }
  }
}

export interface PreSetStatusAbAttrParams extends AbAttrBaseParams {
  /** The status effect being applied */
  effect: StatusEffect;
  /** Holds whether the status effect is prevented by the ability */
  cancelled: BooleanHolder;
}

export class PreSetStatusAbAttr extends AbAttr {
  /** Return whether the ability attribute can be applied */
  canApply(_params: Closed<PreSetStatusAbAttrParams>): boolean {
    return true;
  }

  apply(_params: Closed<PreSetStatusAbAttrParams>): void {}
}

/**
 * Provides immunity to status effects to specified targets.
 */
export class PreSetStatusEffectImmunityAbAttr extends PreSetStatusAbAttr {
  protected immuneEffects: StatusEffect[];

  /**
   * @param immuneEffects - An array of {@linkcode StatusEffect}s to prevent application.
   * If none are provided, will block **all** status effects regardless of type.
   */
  constructor(...immuneEffects: StatusEffect[]) {
    super();

    this.immuneEffects = immuneEffects;
  }

  override canApply({ effect, cancelled }: PreSetStatusAbAttrParams): boolean {
    return (
      !cancelled.value
      && ((this.immuneEffects.length === 0 && effect !== StatusEffect.FAINT) || this.immuneEffects.includes(effect))
    );
  }

  /**
   * Applies immunity to supplied status effects.
   */
  override apply({ cancelled }: PreSetStatusAbAttrParams): void {
    cancelled.value = true;
  }

  override getTriggerMessage({ pokemon, effect }: PreSetStatusAbAttrParams, abilityName: string): string {
    return this.immuneEffects.length > 0
      ? i18next.t("abilityTriggers:statusEffectImmunityWithName", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          abilityName,
          statusEffectName: getStatusEffectDescriptor(effect),
        })
      : i18next.t("abilityTriggers:statusEffectImmunity", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          abilityName,
        });
  }
}

// NOTE: There is a good amount of overlapping code between this
// and PreSetStatusEffectImmunity. However, we need these classes to be distinct
// as this one's apply method requires additional parameters
// TODO: Find away to avoid the code duplication without sacrificing
// the subclass split
/**
 * Provides immunity to status effects to the user.
 */
export class StatusEffectImmunityAbAttr extends PreSetStatusEffectImmunityAbAttr {}

export interface UserFieldStatusEffectImmunityAbAttrParams extends AbAttrBaseParams {
  /** The status effect being applied */
  effect: StatusEffect;
  /** Holds whether the status effect is prevented by the ability */
  cancelled: BooleanHolder;
  /** The target of the status effect */
  target: Pokemon;
  // TODO: It may be the case that callers are passing `null` in the case that the pokemon setting the status is the same as the target.
  // Evaluate this and update the tsdoc accordingly.
  /** The source of the status effect, or null if it is not coming from a pokemon */
  source: Pokemon | null;
}

/**
 * Provides immunity to status effects to the user's field.
 */
export class UserFieldStatusEffectImmunityAbAttr extends CancelInteractionAbAttr {
  private declare readonly _: never;
  protected immuneEffects: StatusEffect[];

  /**
   * @param immuneEffects - An array of {@linkcode StatusEffect}s to prevent application.
   * If none are provided, will block **all** status effects regardless of type.
   */
  constructor(...immuneEffects: StatusEffect[]) {
    super();

    this.immuneEffects = immuneEffects;
  }

  override canApply({ effect, cancelled }: UserFieldStatusEffectImmunityAbAttrParams): boolean {
    return (
      (!cancelled.value && this.immuneEffects.length === 0 && effect !== StatusEffect.FAINT)
      || this.immuneEffects.includes(effect)
    );
  }

  // declare here to allow typescript to allow us to override `canApply` method without adjusting params
  declare apply: (params: UserFieldStatusEffectImmunityAbAttrParams) => void;
}

/**
 * Conditionally provides immunity to status effects for the user's field.
 *
 * Used by {@linkcode AbilityId.FLOWER_VEIL | Flower Veil}.
 */
export class ConditionalUserFieldStatusEffectImmunityAbAttr extends UserFieldStatusEffectImmunityAbAttr {
  /**
   * The condition for the field immunity to be applied.
   * @param target - The target of the status effect
   * @param source - The source of the status effect
   */
  private condition: (target: Pokemon, source: Pokemon | null) => boolean;

  /**
   * @param immuneEffects - An array of {@linkcode StatusEffect}s to prevent application.
   * If none are provided, will block **all** status effects regardless of type.
   */
  constructor(condition: (target: Pokemon, source: Pokemon | null) => boolean, ...immuneEffects: StatusEffect[]) {
    super(...immuneEffects);

    this.condition = condition;
  }

  /**
   * Evaluate the condition to determine if the {@linkcode ConditionalUserFieldStatusEffectImmunityAbAttr} can be applied.
   * @returns Whether the ability can be applied to cancel the status effect.
   */
  override canApply(params: UserFieldStatusEffectImmunityAbAttrParams): boolean {
    return !params.cancelled.value && this.condition(params.target, params.source) && super.canApply(params);
  }
}

export interface ConditionalUserFieldProtectStatAbAttrParams extends AbAttrBaseParams {
  /** The stat being affected by the stat stage change */
  stat: BattleStat;
  /** Holds whether the stat stage change is prevented by the ability */
  cancelled: BooleanHolder;
  // TODO: consider making this required and not inherit from PreStatStageChangeAbAttr
  /** The target of the stat stage change */
  target?: Pokemon;
}

/**
 * Conditionally provides immunity to stat drop effects to the user's field.
 *
 * Used by {@linkcode AbilityId.FLOWER_VEIL | Flower Veil}.
 */
export class ConditionalUserFieldProtectStatAbAttr extends PreStatStageChangeAbAttr {
  /** {@linkcode BattleStat} to protect or `undefined` if **all** {@linkcode BattleStat} are protected */
  protected protectedStat?: BattleStat;

  /** If the method evaluates to true, the stat will be protected. */
  protected condition: (target: Pokemon) => boolean;

  constructor(condition: (target: Pokemon) => boolean, _protectedStat?: BattleStat) {
    super();
    this.condition = condition;
  }

  /**
   * @returns Whether the ability can be used to cancel the stat stage change.
   */
  override canApply({ stat, cancelled, target }: ConditionalUserFieldProtectStatAbAttrParams): boolean {
    if (!target) {
      return false;
    }
    return (
      !cancelled.value
      && (isNullOrUndefined(this.protectedStat) || stat === this.protectedStat)
      && this.condition(target)
    );
  }

  /**
   * Apply the {@linkcode ConditionalUserFieldStatusEffectImmunityAbAttr} to an interaction
   */
  override apply({ cancelled }: ConditionalUserFieldProtectStatAbAttrParams): void {
    cancelled.value = true;
  }
}

export interface PreApplyBattlerTagAbAttrParams extends AbAttrBaseParams {
  /** The tag being applied */
  tag: BattlerTag;
  /** Holds whether the tag is prevented by the ability */
  cancelled: BooleanHolder;
}

/**
 * Base class for ability attributes that apply their effect before a BattlerTag {@linkcode BattlerTag} is applied.
 *
 * ⚠️ Subclasses violate Liskov Substitution Principle, so this class must not be provided to {@linkcode applyAbAttrs}
 */
export abstract class PreApplyBattlerTagAbAttr extends AbAttr {
  canApply(_params: PreApplyBattlerTagAbAttrParams): boolean {
    return true;
  }

  apply(_params: PreApplyBattlerTagAbAttrParams): void {}
}

// Intentionally not exported because this shouldn't be able to be passed to `applyAbAttrs`. It only exists so that
// PreApplyBattlerTagImmunityAbAttr and UserFieldPreApplyBattlerTagImmunityAbAttr can avoid code duplication
// while preserving type safety. (Since the UserField version require an additional parameter, target, in its apply methods)
abstract class BaseBattlerTagImmunityAbAttr<P extends PreApplyBattlerTagAbAttrParams> extends PreApplyBattlerTagAbAttr {
  protected immuneTagTypes: BattlerTagType[];

  constructor(immuneTagTypes: BattlerTagType | BattlerTagType[]) {
    super(true);

    this.immuneTagTypes = coerceArray(immuneTagTypes);
  }

  override canApply({ cancelled, tag }: P): boolean {
    return !cancelled.value && this.immuneTagTypes.includes(tag.tagType);
  }

  override apply({ cancelled }: P): void {
    cancelled.value = true;
  }

  override getTriggerMessage({ pokemon, tag }: P, abilityName: string): string {
    return i18next.t("abilityTriggers:battlerTagImmunity", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      abilityName,
      battlerTagName: tag.getDescriptor(),
    });
  }
}

// TODO: The battler tag ability attributes are in dire need of improvement
// It is unclear why there is a `PreApplyBattlerTagImmunityAbAttr` class that isn't used,
// and then why there's a BattlerTagImmunityAbAttr class as well.

/**
 * Provides immunity to BattlerTags {@linkcode BattlerTag} to specified targets.
 *
 * This does not check whether the tag is already applied; that check should happen in the caller.
 */
export class PreApplyBattlerTagImmunityAbAttr extends BaseBattlerTagImmunityAbAttr<PreApplyBattlerTagAbAttrParams> {}

/**
 * Provides immunity to BattlerTags {@linkcode BattlerTag} to the user.
 */
export class BattlerTagImmunityAbAttr extends PreApplyBattlerTagImmunityAbAttr {}

export interface UserFieldBattlerTagImmunityAbAttrParams extends PreApplyBattlerTagAbAttrParams {
  /** The pokemon that the battler tag is being applied to */
  target: Pokemon;
}
/**
 * Provides immunity to BattlerTags {@linkcode BattlerTag} to the user's field.
 */
export class UserFieldBattlerTagImmunityAbAttr extends BaseBattlerTagImmunityAbAttr<UserFieldBattlerTagImmunityAbAttrParams> {}

export class ConditionalUserFieldBattlerTagImmunityAbAttr extends UserFieldBattlerTagImmunityAbAttr {
  private condition: (target: Pokemon) => boolean;

  /**
   * Determine whether the {@linkcode ConditionalUserFieldBattlerTagImmunityAbAttr} can be applied by passing the target pokemon to the condition.
   * @returns Whether the ability can be used to cancel the battler tag
   */
  override canApply(params: UserFieldBattlerTagImmunityAbAttrParams): boolean {
    return super.canApply(params) && this.condition(params.target);
  }

  constructor(condition: (target: Pokemon) => boolean, immuneTagTypes: BattlerTagType | BattlerTagType[]) {
    super(immuneTagTypes);

    this.condition = condition;
  }
}

export interface BlockCritAbAttrParams extends AbAttrBaseParams {
  /**
   * Holds a boolean that will be set to `true` if the user's ability prevents the attack from being a critical hit
   */
  readonly blockCrit: BooleanHolder;
}

export class BlockCritAbAttr extends AbAttr {
  constructor() {
    super(false);
  }

  /**
   * Apply the block crit ability by setting the value in the provided boolean holder to `true`.
   */
  override apply({ blockCrit }: BlockCritAbAttrParams): void {
    blockCrit.value = true;
  }
}

export interface BonusCritAbAttrParams extends AbAttrBaseParams {
  /** Holds the crit stage that may be modified by ability application */
  critStage: NumberHolder;
}

export class BonusCritAbAttr extends AbAttr {
  constructor() {
    super(false);
  }

  /**
   * Apply the bonus crit ability by increasing the value in the provided number holder by 1
   */
  override apply({ critStage }: BonusCritAbAttrParams): void {
    critStage.value += 1;
  }
}

export interface MultCritAbAttrParams extends AbAttrBaseParams {
  /** The critical hit multiplier that may be modified by ability application */
  critMult: NumberHolder;
}

export class MultCritAbAttr extends AbAttr {
  public multAmount: number;

  constructor(multAmount: number) {
    super(false);

    this.multAmount = multAmount;
  }

  override canApply({ critMult }: MultCritAbAttrParams): boolean {
    return critMult.value > 1;
  }

  override apply({ critMult }: MultCritAbAttrParams): void {
    critMult.value *= this.multAmount;
  }
}

export interface ConditionalCritAbAttrParams extends AbAttrBaseParams {
  /** Holds a boolean that will be set to true if the attack is guaranteed to crit */
  target: Pokemon;
  /** The move being used */
  move: Move;
  /** Holds whether the attack will critically hit */
  isCritical: BooleanHolder;
}

/**
 * Guarantees a critical hit according to the given condition, except if target prevents critical hits. ie. Merciless
 */
export class ConditionalCritAbAttr extends AbAttr {
  private condition: PokemonAttackCondition;

  constructor(condition: PokemonAttackCondition, _checkUser?: boolean) {
    super(false);

    this.condition = condition;
  }

  override canApply({ isCritical, pokemon, target, move }: ConditionalCritAbAttrParams): boolean {
    return !isCritical.value && this.condition(pokemon, target, move);
  }

  override apply({ isCritical }: ConditionalCritAbAttrParams): void {
    isCritical.value = true;
  }
}

export class BlockNonDirectDamageAbAttr extends CancelInteractionAbAttr {
  constructor() {
    super(false);
  }
}

/**
 * This attribute will block any status damage that you put in the parameter.
 */
export class BlockStatusDamageAbAttr extends CancelInteractionAbAttr {
  private effects: StatusEffect[];

  /**
   * @param effects - The status effect(s) that will be blocked from damaging the ability pokemon
   */
  constructor(...effects: StatusEffect[]) {
    super(false);

    this.effects = effects;
  }

  override canApply({ pokemon, cancelled }: AbAttrParamsWithCancel): boolean {
    return !cancelled.value && !!pokemon.status?.effect && this.effects.includes(pokemon.status.effect);
  }
}

export class BlockOneHitKOAbAttr extends CancelInteractionAbAttr {}

export interface ChangeMovePriorityAbAttrParams extends AbAttrBaseParams {
  /** The move being used */
  move: Move;
  /** The priority of the move being used */
  priority: NumberHolder;
}

/**
 * This governs abilities that alter the priority of moves
 * Abilities: Prankster, Gale Wings, Triage, Mycelium Might, Stall
 * Note - Quick Claw has a separate and distinct implementation outside of priority
 *
 * @sealed
 */
export class ChangeMovePriorityAbAttr extends AbAttr {
  private moveFunc: (pokemon: Pokemon, move: Move) => boolean;
  private changeAmount: number;

  /**
   * @param moveFunc - applies priority-change to moves that meet the condition
   * @param changeAmount - The amount of priority added or subtracted
   */
  constructor(moveFunc: (pokemon: Pokemon, move: Move) => boolean, changeAmount: number) {
    super(false);

    this.moveFunc = moveFunc;
    this.changeAmount = changeAmount;
  }

  override canApply({ pokemon, move }: ChangeMovePriorityAbAttrParams): boolean {
    return this.moveFunc(pokemon, move);
  }

  override apply({ priority }: ChangeMovePriorityAbAttrParams): void {
    priority.value += this.changeAmount;
  }
}

export class IgnoreContactAbAttr extends AbAttr {
  private declare readonly _: never;
}

/**
 * Shared interface for attributes that respond to a weather.
 */
export interface PreWeatherEffectAbAttrParams extends AbAttrParamsWithCancel {
  /** The weather effect for the interaction. `null` is treated as no weather */
  weather: Weather | null;
}

export abstract class PreWeatherEffectAbAttr extends AbAttr {
  override canApply(_params: Closed<PreWeatherEffectAbAttrParams>): boolean {
    return true;
  }

  override apply(_params: Closed<PreWeatherEffectAbAttrParams>): void {}
}

/**
 * Base class for abilities that apply an effect before a weather effect is applied.
 */
export abstract class PreWeatherDamageAbAttr extends PreWeatherEffectAbAttr {}

export class BlockWeatherDamageAttr extends PreWeatherDamageAbAttr {
  private weatherTypes: WeatherType[];

  constructor(...weatherTypes: WeatherType[]) {
    super(false);

    this.weatherTypes = weatherTypes;
  }

  override canApply({ weather, cancelled }: PreWeatherEffectAbAttrParams): boolean {
    if (!weather || cancelled.value) {
      return false;
    }
    const weatherType = weather.weatherType;
    return this.weatherTypes.length === 0 || this.weatherTypes.includes(weatherType);
  }

  override apply({ cancelled }: PreWeatherEffectAbAttrParams): void {
    cancelled.value = true;
  }
}

export class SuppressWeatherEffectAbAttr extends PreWeatherEffectAbAttr {
  public readonly affectsImmutable: boolean;

  constructor(affectsImmutable = false) {
    super(true);

    this.affectsImmutable = affectsImmutable;
  }

  override canApply({ weather, cancelled }: PreWeatherEffectAbAttrParams): boolean {
    if (!weather || cancelled.value) {
      return false;
    }
    return this.affectsImmutable || weather.isImmutable();
  }

  override apply({ cancelled }: PreWeatherEffectAbAttrParams): void {
    cancelled.value = true;
  }
}

/**
 * Condition function to applied to abilities related to Sheer Force.
 * Checks if last move used against target was affected by a Sheer Force user and:
 * Disables: Color Change, Pickpocket, Berserk, Anger Shell
 * @returns An {@linkcode AbAttrCondition} to disable the ability under the proper conditions.
 */
function getSheerForceHitDisableAbCondition(): AbAttrCondition {
  return (pokemon: Pokemon) => {
    const lastReceivedAttack = pokemon.turnData.attacksReceived[0];
    if (!lastReceivedAttack) {
      return true;
    }

    const lastAttacker = pokemon.getOpponents().find(p => p.id === lastReceivedAttack.sourceId);
    if (!lastAttacker) {
      return true;
    }

    /** `true` if the last move's chance is above 0 and the last attacker's ability is sheer force */
    const SheerForceAffected =
      allMoves[lastReceivedAttack.move].chance >= 0 && lastAttacker.hasAbility(AbilityId.SHEER_FORCE);

    return !SheerForceAffected;
  };
}

function getWeatherCondition(...weatherTypes: WeatherType[]): AbAttrCondition {
  return () => {
    if (!globalScene?.arena) {
      return false;
    }
    if (globalScene.arena.weather?.isEffectSuppressed()) {
      return false;
    }
    const weatherType = globalScene.arena.weather?.weatherType;
    return !!weatherType && weatherTypes.indexOf(weatherType) > -1;
  };
}

function getAnticipationCondition(): AbAttrCondition {
  return (pokemon: Pokemon) => {
    for (const opponent of pokemon.getOpponents()) {
      for (const move of opponent.moveset) {
        // ignore null/undefined moves
        if (!move) {
          continue;
        }
        // the move's base type (not accounting for variable type changes) is super effective
        if (
          move.getMove().is("AttackMove")
          && pokemon.getAttackTypeEffectiveness(move.getMove().type, opponent, true, undefined, move.getMove()) >= 2
        ) {
          return true;
        }
        // move is a OHKO
        if (move.getMove().hasAttr("OneHitKOAttr")) {
          return true;
        }
        // edge case for hidden power, type is computed
        if (move.getMove().id === MoveId.HIDDEN_POWER) {
          const iv_val = Math.floor(
            (((opponent.ivs[Stat.HP] & 1)
              + (opponent.ivs[Stat.ATK] & 1) * 2
              + (opponent.ivs[Stat.DEF] & 1) * 4
              + (opponent.ivs[Stat.SPD] & 1) * 8
              + (opponent.ivs[Stat.SPATK] & 1) * 16
              + (opponent.ivs[Stat.SPDEF] & 1) * 32)
              * 15)
              / 63,
          );

          const type = [
            PokemonType.FIGHTING,
            PokemonType.FLYING,
            PokemonType.POISON,
            PokemonType.GROUND,
            PokemonType.ROCK,
            PokemonType.BUG,
            PokemonType.GHOST,
            PokemonType.STEEL,
            PokemonType.FIRE,
            PokemonType.WATER,
            PokemonType.GRASS,
            PokemonType.ELECTRIC,
            PokemonType.PSYCHIC,
            PokemonType.ICE,
            PokemonType.DRAGON,
            PokemonType.DARK,
          ][iv_val];

          if (pokemon.getAttackTypeEffectiveness(type, opponent) >= 2) {
            return true;
          }
        }
      }
    }
    return false;
  };
}

/**
 * Creates an ability condition that causes the ability to fail if that ability
 * has already been used by that pokemon that battle. It requires an ability to
 * be specified due to current limitations in how conditions on abilities work.
 * @param {AbilityId} ability The ability to check if it's already been applied
 * @returns {AbAttrCondition} The condition
 */
function getOncePerBattleCondition(ability: AbilityId): AbAttrCondition {
  return (pokemon: Pokemon) => {
    return !pokemon.waveData.abilitiesApplied.has(ability);
  };
}

/**
 * @sealed
 */
export class ForewarnAbAttr extends PostSummonAbAttr {
  constructor() {
    super(true);
  }

  override apply({ simulated, pokemon }: AbAttrBaseParams): void {
    if (!simulated) {
      return;
    }
    let maxPowerSeen = 0;
    let maxMove = "";
    let movePower = 0;
    for (const opponent of pokemon.getOpponents()) {
      for (const move of opponent.moveset) {
        if (move?.getMove().is("StatusMove")) {
          movePower = 1;
        } else if (move?.getMove().hasAttr("OneHitKOAttr")) {
          movePower = 150;
        } else if (
          move?.getMove().id === MoveId.COUNTER
          || move?.getMove().id === MoveId.MIRROR_COAT
          || move?.getMove().id === MoveId.METAL_BURST
        ) {
          movePower = 120;
        } else if (move?.getMove().power === -1) {
          movePower = 80;
        } else {
          movePower = move?.getMove().power ?? 0;
        }

        if (movePower > maxPowerSeen) {
          maxPowerSeen = movePower;
          maxMove = move?.getName() ?? "";
        }
      }
    }

    globalScene.phaseManager.queueMessage(
      i18next.t("abilityTriggers:forewarn", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        moveName: maxMove,
      }),
    );
  }
}

/**
 * Ability attribute that reveals the abilities of all opposing Pokémon when the Pokémon with this ability is summoned.
 * @sealed
 */
export class FriskAbAttr extends PostSummonAbAttr {
  constructor() {
    super(true);
  }

  override apply({ simulated, pokemon }: AbAttrBaseParams): void {
    if (!simulated) {
      for (const opponent of pokemon.getOpponents()) {
        globalScene.phaseManager.queueMessage(
          i18next.t("abilityTriggers:frisk", {
            pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
            opponentName: opponent.name,
            opponentAbilityName: opponent.getAbility().name,
          }),
        );
        setAbilityRevealed(opponent);
      }
    }
  }
}

export interface PostWeatherChangeAbAttrParams extends AbAttrBaseParams {
  /** The kind of the weather that was just changed to */
  weather: WeatherType;
}

/**
 * Base class for ability attributes that apply their effect after a weather change.
 */
export abstract class PostWeatherChangeAbAttr extends AbAttr {
  canApply(_params: Closed<PostWeatherChangeAbAttrParams>): boolean {
    return true;
  }

  apply(_params: Closed<PostWeatherChangeAbAttrParams>): void {}
}

/**
 * Triggers weather-based form change when weather changes.
 * Used by Forecast and Flower Gift.
 *
 * @sealed
 */
export class PostWeatherChangeFormChangeAbAttr extends PostWeatherChangeAbAttr {
  private ability: AbilityId;
  private formRevertingWeathers: WeatherType[];

  constructor(ability: AbilityId, formRevertingWeathers: WeatherType[]) {
    super(false);

    this.ability = ability;
    this.formRevertingWeathers = formRevertingWeathers;
  }

  override canApply({ pokemon }: AbAttrBaseParams): boolean {
    const isCastformWithForecast =
      pokemon.species.speciesId === SpeciesId.CASTFORM && this.ability === AbilityId.FORECAST;
    const isCherrimWithFlowerGift =
      pokemon.species.speciesId === SpeciesId.CHERRIM && this.ability === AbilityId.FLOWER_GIFT;

    return isCastformWithForecast || isCherrimWithFlowerGift;
  }

  /**
   * Calls {@linkcode Arena.triggerWeatherBasedFormChangesToNormal | triggerWeatherBasedFormChangesToNormal} when the
   * weather changed to form-reverting weather, otherwise calls {@linkcode Arena.triggerWeatherBasedFormChanges | triggerWeatherBasedFormChanges}
   */
  override apply({ simulated }: AbAttrBaseParams): void {
    if (simulated) {
      return;
    }

    // TODO: investigate why this is not using the weatherType parameter
    // and is instead reading the weather from the global scene

    const weatherType = globalScene.arena.weather?.weatherType;

    if (weatherType && this.formRevertingWeathers.includes(weatherType)) {
      globalScene.arena.triggerWeatherBasedFormChangesToNormal();
    } else {
      globalScene.arena.triggerWeatherBasedFormChanges();
    }
  }
}

/**
 * Add a battler tag to the pokemon when the weather changes.
 * @sealed
 */
export class PostWeatherChangeAddBattlerTagAttr extends PostWeatherChangeAbAttr {
  private tagType: BattlerTagType;
  private turnCount: number;
  private weatherTypes: WeatherType[];

  constructor(tagType: BattlerTagType, turnCount: number, ...weatherTypes: WeatherType[]) {
    super();

    this.tagType = tagType;
    this.turnCount = turnCount;
    this.weatherTypes = weatherTypes;
  }

  override canApply({ weather, pokemon }: PostWeatherChangeAbAttrParams): boolean {
    return this.weatherTypes.includes(weather) && pokemon.canAddTag(this.tagType);
  }

  override apply({ simulated, pokemon }: PostWeatherChangeAbAttrParams): void {
    if (!simulated) {
      pokemon.addTag(this.tagType, this.turnCount);
    }
  }
}

export type PostWeatherLapseAbAttrParams = Omit<PreWeatherEffectAbAttrParams, "cancelled">;
export class PostWeatherLapseAbAttr extends AbAttr {
  protected weatherTypes: WeatherType[];

  constructor(...weatherTypes: WeatherType[]) {
    super();

    this.weatherTypes = weatherTypes;
  }

  canApply(_params: Closed<PostWeatherLapseAbAttrParams>): boolean {
    return true;
  }

  apply(_params: Closed<PostWeatherLapseAbAttrParams>): void {}

  getCondition(): AbAttrCondition {
    return getWeatherCondition(...this.weatherTypes);
  }
}

export class PostWeatherLapseHealAbAttr extends PostWeatherLapseAbAttr {
  private healFactor: number;

  constructor(healFactor: number, ...weatherTypes: WeatherType[]) {
    super(...weatherTypes);

    this.healFactor = healFactor;
  }

  override canApply({ pokemon }: PostWeatherLapseAbAttrParams): boolean {
    return !pokemon.isFullHp();
  }

  override apply({ pokemon, passive, simulated }: PostWeatherLapseAbAttrParams): void {
    const abilityName = (!passive ? pokemon.getAbility() : pokemon.getPassiveAbility()).name;
    if (!simulated) {
      globalScene.phaseManager.unshiftNew(
        "PokemonHealPhase",
        pokemon.getBattlerIndex(),
        toDmgValue(pokemon.getMaxHp() / (16 / this.healFactor)),
        i18next.t("abilityTriggers:postWeatherLapseHeal", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          abilityName,
        }),
        true,
      );
    }
  }
}

export class PostWeatherLapseDamageAbAttr extends PostWeatherLapseAbAttr {
  private damageFactor: number;

  constructor(damageFactor: number, ...weatherTypes: WeatherType[]) {
    super(...weatherTypes);

    this.damageFactor = damageFactor;
  }

  override canApply({ pokemon }: PostWeatherLapseAbAttrParams): boolean {
    return !pokemon.hasAbilityWithAttr("BlockNonDirectDamageAbAttr");
  }

  override apply({ simulated, pokemon, passive }: PostWeatherLapseAbAttrParams): void {
    if (!simulated) {
      const abilityName = (!passive ? pokemon.getAbility() : pokemon.getPassiveAbility()).name;
      globalScene.phaseManager.queueMessage(
        i18next.t("abilityTriggers:postWeatherLapseDamage", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          abilityName,
        }),
      );
      pokemon.damageAndUpdate(toDmgValue(pokemon.getMaxHp() / (16 / this.damageFactor)), {
        result: HitResult.INDIRECT,
      });
    }
  }
}

export interface PostTerrainChangeAbAttrParams extends AbAttrBaseParams {
  /** The terrain type that is being changed to */
  terrain: TerrainType;
}

export class PostTerrainChangeAbAttr extends AbAttr {
  canApply(_params: Closed<PostTerrainChangeAbAttrParams>): boolean {
    return true;
  }

  apply(_params: Closed<PostTerrainChangeAbAttrParams>): void {}
}

export class PostTerrainChangeAddBattlerTagAttr extends PostTerrainChangeAbAttr {
  private tagType: BattlerTagType;
  private turnCount: number;
  private terrainTypes: TerrainType[];

  constructor(tagType: BattlerTagType, turnCount: number, ...terrainTypes: TerrainType[]) {
    super();

    this.tagType = tagType;
    this.turnCount = turnCount;
    this.terrainTypes = terrainTypes;
  }

  override canApply({ pokemon, terrain }: PostTerrainChangeAbAttrParams): boolean {
    return !!this.terrainTypes.find(t => t === terrain) && pokemon.canAddTag(this.tagType);
  }

  override apply({ pokemon, simulated }: PostTerrainChangeAbAttrParams): void {
    if (!simulated) {
      pokemon.addTag(this.tagType, this.turnCount);
    }
  }
}

function getTerrainCondition(...terrainTypes: TerrainType[]): AbAttrCondition {
  return (_pokemon: Pokemon) => {
    const terrainType = globalScene.arena.terrain?.terrainType;
    return !!terrainType && terrainTypes.indexOf(terrainType) > -1;
  };
}

export class PostTurnAbAttr extends AbAttr {
  canApply(_params: Closed<AbAttrBaseParams>): boolean {
    return true;
  }

  apply(_params: Closed<AbAttrBaseParams>): void {}
}

/**
 * This attribute will heal 1/8th HP if the ability pokemon has the correct status.
 *
 * @sealed
 */
export class PostTurnStatusHealAbAttr extends PostTurnAbAttr {
  private effects: StatusEffect[];

  /**
   * @param effects - The status effect(s) that will qualify healing the ability pokemon
   */
  constructor(...effects: StatusEffect[]) {
    super(false);

    this.effects = effects;
  }

  override canApply({ pokemon }: AbAttrBaseParams): boolean {
    return !isNullOrUndefined(pokemon.status) && this.effects.includes(pokemon.status.effect) && !pokemon.isFullHp();
  }

  override apply({ simulated, passive, pokemon }: AbAttrBaseParams): void {
    if (!simulated) {
      const abilityName = (!passive ? pokemon.getAbility() : pokemon.getPassiveAbility()).name;
      globalScene.phaseManager.unshiftNew(
        "PokemonHealPhase",
        pokemon.getBattlerIndex(),
        toDmgValue(pokemon.getMaxHp() / 8),
        i18next.t("abilityTriggers:poisonHeal", { pokemonName: getPokemonNameWithAffix(pokemon), abilityName }),
        true,
      );
    }
  }
}

/**
 * After the turn ends, resets the status of either the user or their ally.
 * @param allyTarget Whether to target the user's ally; default `false` (self-target)
 *
 * @sealed
 */
export class PostTurnResetStatusAbAttr extends PostTurnAbAttr {
  private allyTarget: boolean;
  private target: Pokemon | undefined;

  constructor(allyTarget = false) {
    super(true);
    this.allyTarget = allyTarget;
  }

  override canApply({ pokemon }: AbAttrBaseParams): boolean {
    if (this.allyTarget) {
      this.target = pokemon.getAlly();
    } else {
      this.target = pokemon;
    }

    const effect = this.target?.status?.effect;
    return !!effect && effect !== StatusEffect.FAINT;
  }

  override apply({ simulated }: AbAttrBaseParams): void {
    if (!simulated && this.target?.status) {
      globalScene.phaseManager.queueMessage(
        getStatusEffectHealText(this.target.status?.effect, getPokemonNameWithAffix(this.target)),
      );
      this.target.resetStatus(false);
      this.target.updateInfo();
    }
  }
}

/**
 * Attribute to try and restore eaten berries after the turn ends.
 * Used by {@linkcode AbilityId.HARVEST}.
 */
export class PostTurnRestoreBerryAbAttr extends PostTurnAbAttr {
  /**
   * Array containing all {@linkcode BerryType | BerryTypes} that are under cap and able to be restored.
   * Stored inside the class for a minor performance boost
   */
  private berriesUnderCap: BerryType[];

  /**
   * @param procChance - function providing chance to restore an item
   * @see {@linkcode createEatenBerry()}
   */
  constructor(private procChance: (pokemon: Pokemon) => number) {
    super();
  }

  override canApply({ pokemon }: AbAttrBaseParams): boolean {
    // Ensure we have at least 1 recoverable berry (at least 1 berry in berriesEaten is not capped)
    const cappedBerries = new Set(
      globalScene
        .getModifiers(BerryModifier, pokemon.isPlayer())
        .filter(bm => bm.pokemonId === pokemon.id && bm.getCountUnderMax() < 1)
        .map(bm => bm.berryType),
    );

    this.berriesUnderCap = pokemon.battleData.berriesEaten.filter(bt => !cappedBerries.has(bt));

    if (this.berriesUnderCap.length === 0) {
      return false;
    }

    // Clamp procChance to [0, 1]. Skip if didn't proc (less than pass)
    const pass = randSeedFloat();
    return this.procChance(pokemon) >= pass;
  }

  override apply({ simulated, pokemon }: AbAttrBaseParams): void {
    if (!simulated) {
      this.createEatenBerry(pokemon);
    }
  }

  /**
   * Create a new berry chosen randomly from all berries the pokemon ate this battle
   * @param pokemon - The {@linkcode Pokemon} with this ability
   * @returns `true` if a new berry was created
   */
  createEatenBerry(pokemon: Pokemon): boolean {
    // Pick a random available berry to yoink
    const randomIdx = randSeedInt(this.berriesUnderCap.length);
    const chosenBerryType = this.berriesUnderCap[randomIdx];
    pokemon.battleData.berriesEaten.splice(randomIdx, 1); // Remove berry from memory
    const chosenBerry = new BerryModifierType(chosenBerryType);

    // Add the randomly chosen berry or update the existing one
    const berryModifier = globalScene.findModifier(
      m => m instanceof BerryModifier && m.berryType === chosenBerryType && m.pokemonId === pokemon.id,
      pokemon.isPlayer(),
    ) as BerryModifier | undefined;

    if (berryModifier) {
      berryModifier.stackCount++;
    } else {
      const newBerry = new BerryModifier(chosenBerry, pokemon.id, chosenBerryType, 1);
      if (pokemon.isPlayer()) {
        globalScene.addModifier(newBerry);
      } else {
        globalScene.addEnemyModifier(newBerry);
      }
    }

    globalScene.updateModifiers(pokemon.isPlayer());
    globalScene.phaseManager.queueMessage(
      i18next.t("abilityTriggers:postTurnLootCreateEatenBerry", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        berryName: chosenBerry.name,
      }),
    );
    return true;
  }
}

/**
 * Attribute to track and re-trigger last turn's berries at the end of the `BerryPhase`.
 * Must only be used by Cud Chew! Do _not_ reuse this attribute for anything else
 * Used by {@linkcode AbilityId.CUD_CHEW}.
 * @sealed
 */
export class CudChewConsumeBerryAbAttr extends AbAttr {
  /**
   * @returns `true` if the pokemon ate anything last turn
   */
  override canApply({ pokemon }: AbAttrBaseParams): boolean {
    return pokemon.summonData.berriesEatenLast.length > 0;
  }

  override apply({ pokemon }: AbAttrBaseParams): void {
    // TODO: Consider respecting the `simulated` flag
    globalScene.phaseManager.unshiftNew(
      "CommonAnimPhase",
      pokemon.getBattlerIndex(),
      pokemon.getBattlerIndex(),
      CommonAnim.USE_ITEM,
    );

    // Re-apply effects of all berries previously scarfed.
    // This doesn't count as "eating" a berry (for unnerve/stuff cheeks/unburden) as no item is consumed.
    for (const berryType of pokemon.summonData.berriesEatenLast) {
      getBerryEffectFunc(berryType)(pokemon);
      const bMod = new BerryModifier(new BerryModifierType(berryType), pokemon.id, berryType, 1);
      globalScene.eventTarget.dispatchEvent(new BerryUsedEvent(bMod)); // trigger message
    }

    // uncomment to make cheek pouch work with cud chew
    // applyAbAttrs("HealFromBerryUseAbAttr", {pokemon});
  }
}

/**
 * Consume a berry at the end of the turn if the pokemon has one.
 *
 * Must be used in conjunction with {@linkcode CudChewConsumeBerryAbAttr}, and is
 * only used by {@linkcode AbilityId.CUD_CHEW}.
 */
export class CudChewRecordBerryAbAttr extends PostTurnAbAttr {
  constructor() {
    super(false);
  }

  /**
   * Move this {@linkcode Pokemon}'s `berriesEaten` array from `PokemonTurnData`
   * into `PokemonSummonData` on turn end.
   * Both arrays are cleared on switch.
   */
  override apply({ pokemon }: AbAttrBaseParams): void {
    pokemon.summonData.berriesEatenLast = pokemon.turnData.berriesEaten;
  }
}

/**
 * Attribute used for {@linkcode AbilityId.MOODY} to randomly raise and lower stats at turn end.
 */
export class MoodyAbAttr extends PostTurnAbAttr {
  constructor() {
    super(true);
  }
  /**
   * Randomly increases one stat stage by 2 and decreases a different stat stage by 1
   * Any stat stages at +6 or -6 are excluded from being increased or decreased, respectively
   * If the pokemon already has all stat stages raised to 6, it will only decrease one stat stage by 1
   * If the pokemon already has all stat stages lowered to -6, it will only increase one stat stage by 2
   */
  override apply({ pokemon, simulated }: AbAttrBaseParams): void {
    if (simulated) {
      return;
    }
    const canRaise = EFFECTIVE_STATS.filter(s => pokemon.getStatStage(s) < 6);
    let canLower = EFFECTIVE_STATS.filter(s => pokemon.getStatStage(s) > -6);

    if (!simulated) {
      if (canRaise.length > 0) {
        const raisedStat = canRaise[pokemon.randBattleSeedInt(canRaise.length)];
        canLower = canLower.filter(s => s !== raisedStat);
        globalScene.phaseManager.unshiftNew("StatStageChangePhase", pokemon.getBattlerIndex(), true, [raisedStat], 2);
      }
      if (canLower.length > 0) {
        const loweredStat = canLower[pokemon.randBattleSeedInt(canLower.length)];
        globalScene.phaseManager.unshiftNew("StatStageChangePhase", pokemon.getBattlerIndex(), true, [loweredStat], -1);
      }
    }
  }
}

/** @sealed */
export class SpeedBoostAbAttr extends PostTurnAbAttr {
  constructor() {
    super(true);
  }

  override canApply({ simulated, pokemon }: AbAttrBaseParams): boolean {
    // todo: Consider moving the `simulated` check to the `apply` method
    return simulated || (!pokemon.turnData.switchedInThisTurn && !pokemon.turnData.failedRunAway);
  }

  override apply({ pokemon }: AbAttrBaseParams): void {
    globalScene.phaseManager.unshiftNew("StatStageChangePhase", pokemon.getBattlerIndex(), true, [Stat.SPD], 1);
  }
}

export class PostTurnHealAbAttr extends PostTurnAbAttr {
  override canApply({ pokemon }: AbAttrBaseParams): boolean {
    return !pokemon.isFullHp();
  }

  override apply({ simulated, pokemon, passive }: AbAttrBaseParams): void {
    if (!simulated) {
      const abilityName = (!passive ? pokemon.getAbility() : pokemon.getPassiveAbility()).name;
      globalScene.phaseManager.unshiftNew(
        "PokemonHealPhase",
        pokemon.getBattlerIndex(),
        toDmgValue(pokemon.getMaxHp() / 16),
        i18next.t("abilityTriggers:postTurnHeal", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          abilityName,
        }),
        true,
      );
    }
  }
}

/** @sealed */
export class PostTurnFormChangeAbAttr extends PostTurnAbAttr {
  private formFunc: (p: Pokemon) => number;

  constructor(formFunc: (p: Pokemon) => number) {
    super(true);

    this.formFunc = formFunc;
  }

  override canApply({ pokemon }: AbAttrBaseParams): boolean {
    return this.formFunc(pokemon) !== pokemon.formIndex;
  }

  override apply({ simulated, pokemon }: AbAttrBaseParams): void {
    if (!simulated) {
      globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeAbilityTrigger, false);
    }
  }
}

/**
 * Attribute used for abilities (Bad Dreams) that damages the opponents for being asleep
 * @sealed
 */
export class PostTurnHurtIfSleepingAbAttr extends PostTurnAbAttr {
  override canApply({ pokemon }: AbAttrBaseParams): boolean {
    return pokemon
      .getOpponents()
      .some(
        opp =>
          (opp.status?.effect === StatusEffect.SLEEP || opp.hasAbility(AbilityId.COMATOSE))
          && !opp.hasAbilityWithAttr("BlockNonDirectDamageAbAttr")
          && !opp.switchOutStatus,
      );
  }

  /** Deal damage to all sleeping, on-field opponents equal to 1/8 of their max hp (min 1). */
  override apply({ pokemon, simulated }: AbAttrBaseParams): void {
    if (simulated) {
      return;
    }

    for (const opp of pokemon.getOpponents()) {
      if ((opp.status?.effect !== StatusEffect.SLEEP && !opp.hasAbility(AbilityId.COMATOSE)) || opp.switchOutStatus) {
        continue;
      }

      const cancelled = new BooleanHolder(false);
      applyAbAttrs("BlockNonDirectDamageAbAttr", { pokemon, simulated, cancelled });

      if (!cancelled.value) {
        opp.damageAndUpdate(toDmgValue(opp.getMaxHp() / 8), { result: HitResult.INDIRECT });
        globalScene.phaseManager.queueMessage(
          i18next.t("abilityTriggers:badDreams", { pokemonName: getPokemonNameWithAffix(opp) }),
        );
      }
    }
  }
}

/**
 * Grabs the last failed Pokeball used
 * @sealed
 * @see {@linkcode applyPostTurn}
 */
export class FetchBallAbAttr extends PostTurnAbAttr {
  override canApply({ simulated, pokemon }: AbAttrBaseParams): boolean {
    return !simulated && !isNullOrUndefined(globalScene.currentBattle.lastUsedPokeball) && !!pokemon.isPlayer;
  }

  /**
   * Adds the last used Pokeball back into the player's inventory
   */
  override apply({ pokemon }: AbAttrBaseParams): void {
    const lastUsed = globalScene.currentBattle.lastUsedPokeball;
    globalScene.pokeballCounts[lastUsed!]++;
    globalScene.currentBattle.lastUsedPokeball = null;
    globalScene.phaseManager.queueMessage(
      i18next.t("abilityTriggers:fetchBall", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        pokeballName: getPokeballName(lastUsed!),
      }),
    );
  }
}

export class PostBiomeChangeAbAttr extends AbAttr {
  private declare readonly _: never;
}

export class PostBiomeChangeWeatherChangeAbAttr extends PostBiomeChangeAbAttr {
  private weatherType: WeatherType;

  constructor(weatherType: WeatherType) {
    super();

    this.weatherType = weatherType;
  }

  override canApply(_params: AbAttrBaseParams): boolean {
    return (globalScene.arena.weather?.isImmutable() ?? false) && globalScene.arena.canSetWeather(this.weatherType);
  }

  override apply({ simulated, pokemon }: AbAttrBaseParams): void {
    if (!simulated) {
      globalScene.arena.trySetWeather(this.weatherType, pokemon);
    }
  }
}

/** @sealed */
export class PostBiomeChangeTerrainChangeAbAttr extends PostBiomeChangeAbAttr {
  private terrainType: TerrainType;

  constructor(terrainType: TerrainType) {
    super();

    this.terrainType = terrainType;
  }

  override canApply(_params: AbAttrBaseParams): boolean {
    return globalScene.arena.canSetTerrain(this.terrainType);
  }

  override apply({ simulated, pokemon }: AbAttrBaseParams): void {
    if (!simulated) {
      globalScene.arena.trySetTerrain(this.terrainType, false, pokemon);
    }
  }
}

export interface PostMoveUsedAbAttrParams extends AbAttrBaseParams {
  /** The move that was used */
  move: PokemonMove;
  /** The source of the move */
  source: Pokemon;
  /** The targets of the move */
  targets: BattlerIndex[];
}

/**
 * Triggers just after a move is used either by the opponent or the player
 */
export class PostMoveUsedAbAttr extends AbAttr {
  canApply(_params: Closed<PostMoveUsedAbAttrParams>): boolean {
    return true;
  }

  apply(_params: Closed<PostMoveUsedAbAttrParams>): void {}
}

/**
 * Triggers after a dance move is used either by the opponent or the player
 * @extends PostMoveUsedAbAttr
 */
export class PostDancingMoveAbAttr extends PostMoveUsedAbAttr {
  override canApply({ source, pokemon }: PostMoveUsedAbAttrParams): boolean {
    // List of tags that prevent the Dancer from replicating the move
    const forbiddenTags = [
      BattlerTagType.FLYING,
      BattlerTagType.UNDERWATER,
      BattlerTagType.UNDERGROUND,
      BattlerTagType.HIDDEN,
    ];
    // The move to replicate cannot come from the Dancer
    return (
      source.getBattlerIndex() !== pokemon.getBattlerIndex()
      && !pokemon.summonData.tags.some(tag => forbiddenTags.includes(tag.tagType))
    );
  }

  /**
   * Resolves the Dancer ability by replicating the move used by the source of the dance
   * either on the source itself or on the target of the dance
   */
  override apply({ source, pokemon, move, targets, simulated }: PostMoveUsedAbAttrParams): void {
    if (!simulated) {
      pokemon.turnData.extraTurns++;
      // If the move is an AttackMove or a StatusMove the Dancer must replicate the move on the source of the Dance
      if (move.getMove().is("AttackMove") || move.getMove().is("StatusMove")) {
        const target = this.getTarget(pokemon, source, targets);
        globalScene.phaseManager.unshiftNew("MovePhase", pokemon, target, move, MoveUseMode.INDIRECT);
      } else if (move.getMove().is("SelfStatusMove")) {
        // If the move is a SelfStatusMove (ie. Swords Dance) the Dancer should replicate it on itself
        globalScene.phaseManager.unshiftNew(
          "MovePhase",
          pokemon,
          [pokemon.getBattlerIndex()],
          move,
          MoveUseMode.INDIRECT,
        );
      }
    }
  }

  /**
   * Get the correct targets of Dancer ability
   *
   * @param dancer - Pokemon with Dancer ability
   * @param source - Source of the dancing move
   * @param targets - Targets of the dancing move
   */
  getTarget(dancer: Pokemon, source: Pokemon, targets: BattlerIndex[]): BattlerIndex[] {
    if (dancer.isPlayer()) {
      return source.isPlayer() ? targets : [source.getBattlerIndex()];
    }
    return source.isPlayer() ? [source.getBattlerIndex()] : targets;
  }
}

/**
 * Triggers after the Pokemon loses or consumes an item
 * @extends AbAttr
 */
export class PostItemLostAbAttr extends AbAttr {
  canApply(_params: Closed<AbAttrBaseParams>): boolean {
    return true;
  }

  apply(_params: Closed<AbAttrBaseParams>): void {}
}

/**
 * Applies a Battler Tag to the Pokemon after it loses or consumes an item
 */
export class PostItemLostApplyBattlerTagAbAttr extends PostItemLostAbAttr {
  private tagType: BattlerTagType;
  constructor(tagType: BattlerTagType) {
    super(false);
    this.tagType = tagType;
  }

  override canApply({ pokemon, simulated }: AbAttrBaseParams): boolean {
    return !pokemon.getTag(this.tagType) && !simulated;
  }

  /**
   * Adds the last used Pokeball back into the player's inventory
   * @param pokemon {@linkcode Pokemon} with this ability
   * @param _args N/A
   */
  override apply({ pokemon }: AbAttrBaseParams): void {
    pokemon.addTag(this.tagType);
  }
}

export interface StatStageChangeMultiplierAbAttrParams extends AbAttrBaseParams {
  /** Holder for the stages after applying the ability.  */
  numStages: NumberHolder;
}
export class StatStageChangeMultiplierAbAttr extends AbAttr {
  private multiplier: number;

  constructor(multiplier: number) {
    super(false);

    this.multiplier = multiplier;
  }

  override apply({ numStages }: StatStageChangeMultiplierAbAttrParams): void {
    numStages.value *= this.multiplier;
  }
}

export interface StatStageChangeCopyAbAttrParams extends AbAttrBaseParams {
  /** The stats to change */
  stats: BattleStat[];
  /** The number of stages that were changed by the original */
  numStages: number;
}

export class StatStageChangeCopyAbAttr extends AbAttr {
  override apply({ pokemon, stats, numStages, simulated }: StatStageChangeCopyAbAttrParams): void {
    if (!simulated) {
      globalScene.phaseManager.unshiftNew(
        "StatStageChangePhase",
        pokemon.getBattlerIndex(),
        true,
        stats,
        numStages,
        true,
        false,
        false,
      );
    }
  }
}

export class BypassBurnDamageReductionAbAttr extends CancelInteractionAbAttr {
  private declare readonly _: never;
  constructor() {
    super(false);
  }
}

export interface ReduceBurnDamageAbAttrParams extends AbAttrBaseParams {
  /** Holds the damage done by the burn */
  burnDamage: NumberHolder;
}

/**
 * Causes Pokemon to take reduced damage from the {@linkcode StatusEffect.BURN | Burn} status
 * @param multiplier Multiplied with the damage taken
 */
export class ReduceBurnDamageAbAttr extends AbAttr {
  constructor(protected multiplier: number) {
    super(false);
  }

  /**
   * Applies the damage reduction
   */
  override apply({ burnDamage }: ReduceBurnDamageAbAttrParams): void {
    burnDamage.value = toDmgValue(burnDamage.value * this.multiplier);
  }
}

export interface DoubleBerryEffectAbAttrParams extends AbAttrBaseParams {
  /** The value of the berry effect that will be doubled by the ability's application */
  effectValue: NumberHolder;
}

export class DoubleBerryEffectAbAttr extends AbAttr {
  override apply({ effectValue }: DoubleBerryEffectAbAttrParams): void {
    effectValue.value *= 2;
  }
}

/**
 * Attribute to prevent opposing berry use while on the field.
 * Used by {@linkcode AbilityId.UNNERVE}, {@linkcode AbilityId.AS_ONE_GLASTRIER} and {@linkcode AbilityId.AS_ONE_SPECTRIER}
 */
export class PreventBerryUseAbAttr extends CancelInteractionAbAttr {}

/**
 * A Pokemon with this ability heals by a percentage of their maximum hp after eating a berry
 * @param healPercent - Percent of Max HP to heal
 */
export class HealFromBerryUseAbAttr extends AbAttr {
  /** Percent of Max HP to heal */
  private healPercent: number;

  constructor(healPercent: number) {
    super();

    // Clamp healPercent so its between [0,1].
    this.healPercent = Math.max(Math.min(healPercent, 1), 0);
  }

  override apply({ simulated, passive, pokemon }: AbAttrBaseParams): void {
    if (simulated) {
      return;
    }

    const { name: abilityName } = passive ? pokemon.getPassiveAbility() : pokemon.getAbility();
    globalScene.phaseManager.unshiftNew(
      "PokemonHealPhase",
      pokemon.getBattlerIndex(),
      toDmgValue(pokemon.getMaxHp() * this.healPercent),
      i18next.t("abilityTriggers:healFromBerryUse", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        abilityName,
      }),
      true,
    );
  }
}

export interface RunSuccessAbAttrParams extends AbAttrBaseParams {
  /** Holder for the likelihood that the pokemon will flee */
  chance: NumberHolder;
}

export class RunSuccessAbAttr extends AbAttr {
  override apply({ chance }: RunSuccessAbAttrParams): void {
    chance.value = 256;
  }
}

type ArenaTrapCondition = (user: Pokemon, target: Pokemon) => boolean;

/**
 * Base class for checking if a Pokemon is trapped by arena trap
 * @extends AbAttr
 * @field {@linkcode arenaTrapCondition} Conditional for trapping abilities.
 * For example, Magnet Pull will only activate if opponent is Steel type.
 * @see {@linkcode applyCheckTrapped}
 */
export class CheckTrappedAbAttr extends AbAttr {
  protected arenaTrapCondition: ArenaTrapCondition;
  constructor(condition: ArenaTrapCondition) {
    super(false);
    this.arenaTrapCondition = condition;
  }

  override canApply(_params: Closed<CheckTrappedAbAttrParams>): boolean {
    return true;
  }

  override apply(_params: Closed<CheckTrappedAbAttrParams>): void {}
}

export interface CheckTrappedAbAttrParams extends AbAttrBaseParams {
  /** The pokemon to attempt to trap */
  opponent: Pokemon;
  /** Holds whether the other Pokemon will be trapped or not */
  trapped: BooleanHolder;
}

/**
 * Determines whether a Pokemon is blocked from switching/running away
 * because of a trapping ability or move.
 */
export class ArenaTrapAbAttr extends CheckTrappedAbAttr {
  override canApply({ pokemon, opponent }: CheckTrappedAbAttrParams): boolean {
    return (
      this.arenaTrapCondition(pokemon, opponent)
      && !(
        opponent.getTypes(true).includes(PokemonType.GHOST)
        || (opponent.getTypes(true).includes(PokemonType.STELLAR) && opponent.getTypes().includes(PokemonType.GHOST))
      )
      && !opponent.hasAbility(AbilityId.RUN_AWAY)
    );
  }

  /**
   * Checks if enemy Pokemon is trapped by an Arena Trap-esque ability
   * If the enemy is a Ghost type, it is not trapped
   * If the enemy has the ability Run Away, it is not trapped.
   * If the user has Magnet Pull and the enemy is not a Steel type, it is not trapped.
   * If the user has Arena Trap and the enemy is not grounded, it is not trapped.
   */
  override apply({ trapped }: CheckTrappedAbAttrParams): void {
    trapped.value = true;
  }

  override getTriggerMessage({ pokemon }: CheckTrappedAbAttrParams, abilityName: string): string {
    return i18next.t("abilityTriggers:arenaTrap", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      abilityName,
    });
  }
}

export interface MaxMultiHitAbAttrParams extends AbAttrBaseParams {
  /** The number of hits that the move will do */
  hits: NumberHolder;
}

export class MaxMultiHitAbAttr extends AbAttr {
  constructor() {
    super(false);
  }

  override apply({ hits }: MaxMultiHitAbAttrParams): void {
    hits.value = 0;
  }
}

export interface PostBattleAbAttrParams extends AbAttrBaseParams {
  /** Whether the battle that just ended was a victory */
  victory: boolean;
}

export abstract class PostBattleAbAttr extends AbAttr {
  private declare readonly _: never;
  constructor(showAbility = true) {
    super(showAbility);
  }

  canApply(_params: Closed<PostBattleAbAttrParams>): boolean {
    return true;
  }

  apply(_params: Closed<PostBattleAbAttrParams>): void {}
}

export class PostBattleLootAbAttr extends PostBattleAbAttr {
  private randItem?: PokemonHeldItemModifier;

  override canApply({ simulated, victory, pokemon }: PostBattleAbAttrParams): boolean {
    const postBattleLoot = globalScene.currentBattle.postBattleLoot;
    if (!simulated && postBattleLoot.length > 0 && victory) {
      this.randItem = randSeedItem(postBattleLoot);
      return globalScene.canTransferHeldItemModifier(this.randItem, pokemon, 1);
    }
    return false;
  }

  override apply({ pokemon }: PostBattleAbAttrParams): void {
    const postBattleLoot = globalScene.currentBattle.postBattleLoot;
    if (!this.randItem) {
      this.randItem = randSeedItem(postBattleLoot);
    }

    if (globalScene.tryTransferHeldItemModifier(this.randItem, pokemon, true, 1, true, undefined, false)) {
      postBattleLoot.splice(postBattleLoot.indexOf(this.randItem), 1);
      globalScene.phaseManager.queueMessage(
        i18next.t("abilityTriggers:postBattleLoot", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          itemName: this.randItem.type.name,
        }),
      );
    }
    this.randItem = undefined;
  }
}

/**
 * Shared parameters for ability attributes that trigger after the user faints.
 */
export interface PostFaintAbAttrParams extends AbAttrBaseParams {
  /** The pokemon that caused the user to faint, or `undefined` if not caused by a Pokemon */
  readonly attacker?: Pokemon;
  /** The move that caused the user to faint, or `undefined` if not caused by a move */
  readonly move?: Move;
  /** The result of the hit that caused the user to faint */
  // TODO: Do we need this? It's unused by all classes
  readonly hitResult?: HitResult;
}

export abstract class PostFaintAbAttr extends AbAttr {
  canApply(_params: Closed<PostFaintAbAttrParams>): boolean {
    return true;
  }

  apply(_params: Closed<PostFaintAbAttrParams>): void {}
}

/**
 * Used for weather suppressing abilities to trigger weather-based form changes upon being fainted.
 * Used by Cloud Nine and Air Lock.
 * @sealed
 */
export class PostFaintUnsuppressedWeatherFormChangeAbAttr extends PostFaintAbAttr {
  override canApply(_params: PostFaintAbAttrParams): boolean {
    return getPokemonWithWeatherBasedForms().length > 0;
  }

  /**
   * Triggers {@linkcode Arena.triggerWeatherBasedFormChanges | triggerWeatherBasedFormChanges}
   * when the user of the ability faints
   */
  override apply({ simulated }: PostFaintAbAttrParams): void {
    if (!simulated) {
      globalScene.arena.triggerWeatherBasedFormChanges();
    }
  }
}

export class PostFaintFormChangeAbAttr extends PostFaintAbAttr {
  private formFunc: (p: Pokemon) => number;

  constructor(formFunc: (p: Pokemon) => number) {
    super(true);

    this.formFunc = formFunc;
  }

  override canApply({ pokemon }: AbAttrBaseParams): boolean {
    return this.formFunc(pokemon) !== pokemon.formIndex;
  }

  override apply({ pokemon, simulated }: AbAttrBaseParams): void {
    if (!simulated) {
      globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeAbilityTrigger, false);
    }
  }
}

export class PostFaintContactDamageAbAttr extends PostFaintAbAttr {
  private damageRatio: number;

  constructor(damageRatio: number) {
    super(true);

    this.damageRatio = damageRatio;
  }

  override canApply({ pokemon, attacker, move, simulated }: PostFaintAbAttrParams): boolean {
    if (
      move === undefined
      || attacker === undefined
      || !move.doesFlagEffectApply({ flag: MoveFlags.MAKES_CONTACT, user: attacker, target: pokemon })
    ) {
      return false;
    }

    const cancelled = new BooleanHolder(false);
    // TODO: This should be in speed order
    globalScene
      .getField(true)
      .forEach(p => applyAbAttrs("FieldPreventExplosiveMovesAbAttr", { pokemon: p, cancelled, simulated }));

    if (cancelled.value) {
      return false;
    }

    // Confirmed: Aftermath does not activate or show text vs Magic Guard killers
    applyAbAttrs("BlockNonDirectDamageAbAttr", { pokemon: attacker, cancelled });
    return !cancelled.value;
  }

  override apply({ simulated, attacker }: PostFaintAbAttrParams): void {
    if (!attacker || simulated) {
      return;
    }

    attacker.damageAndUpdate(toDmgValue(attacker.getMaxHp() * (1 / this.damageRatio)), {
      result: HitResult.INDIRECT,
    });
    attacker.turnData.damageTaken += toDmgValue(attacker.getMaxHp() * (1 / this.damageRatio));
  }

  getTriggerMessage({ pokemon }: PostFaintAbAttrParams, abilityName: string): string {
    return i18next.t("abilityTriggers:postFaintContactDamage", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      abilityName,
    });
  }
}

/**
 * Attribute used for abilities that damage opponents causing the user to faint
 * equal to the amount of damage the last attack inflicted.
 *
 * Used for {@linkcode AbilityId.INNARDS_OUT | Innards Out}.
 * @sealed
 */
export class PostFaintHPDamageAbAttr extends PostFaintAbAttr {
  override apply({ simulated, pokemon, move, attacker }: PostFaintAbAttrParams): void {
    // return early if the user died to indirect damage, target has magic guard or was KO'd by an ally
    if (!move || !attacker || simulated || attacker.getAlly() === pokemon) {
      return;
    }

    const cancelled = new BooleanHolder(false);
    applyAbAttrs("BlockNonDirectDamageAbAttr", { pokemon: attacker, cancelled });
    if (cancelled.value) {
      return;
    }

    const damage = pokemon.turnData.attacksReceived[0].damage;
    attacker.damageAndUpdate(damage, { result: HitResult.INDIRECT });
    attacker.turnData.damageTaken += damage;
  }

  // Oddly, Innards Out still shows a flyout if the effect was blocked due to Magic Guard...
  // TODO: Verify on cart
  override getTriggerMessage({ pokemon }: PostFaintAbAttrParams, abilityName: string): string {
    return i18next.t("abilityTriggers:postFaintHpDamage", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      abilityName,
    });
  }
}

export interface RedirectMoveAbAttrParams extends AbAttrBaseParams {
  /** The id of the move being redirected */
  moveId: MoveId;
  /** The target's battler index before redirection */
  targetIndex: NumberHolder;
  /** The Pokemon that used the move being redirected */
  sourcePokemon: Pokemon;
}

/**
 * Base class for abilities that redirect moves to the pokemon with this ability.
 */
export abstract class RedirectMoveAbAttr extends AbAttr {
  override canApply({ pokemon, moveId, targetIndex, sourcePokemon }: RedirectMoveAbAttrParams): boolean {
    if (!this.canRedirect(moveId, sourcePokemon)) {
      return false;
    }
    const newTarget = pokemon.getBattlerIndex();
    return targetIndex.value !== newTarget;
  }

  override apply({ pokemon, targetIndex }: RedirectMoveAbAttrParams): void {
    const newTarget = pokemon.getBattlerIndex();
    targetIndex.value = newTarget;
  }

  protected canRedirect(moveId: MoveId, _user: Pokemon): boolean {
    const move = allMoves[moveId];
    return !![MoveTarget.NEAR_OTHER, MoveTarget.OTHER].find(t => move.moveTarget === t);
  }
}

/**
 * @sealed
 */
export class RedirectTypeMoveAbAttr extends RedirectMoveAbAttr {
  public type: PokemonType;

  constructor(type: PokemonType) {
    super();
    this.type = type;
  }

  protected override canRedirect(moveId: MoveId, user: Pokemon): boolean {
    return super.canRedirect(moveId, user) && user.getMoveType(allMoves[moveId]) === this.type;
  }
}

export class BlockRedirectAbAttr extends AbAttr {
  private declare readonly _: never;
}

export interface ReduceStatusEffectDurationAbAttrParams extends AbAttrBaseParams {
  /** The status effect in question */
  statusEffect: StatusEffect;
  /** Holds the number of turns until the status is healed, which may be modified by ability application. */
  duration: NumberHolder;
}

/**
 * Used by Early Bird, makes the pokemon wake up faster
 * @param statusEffect - The {@linkcode StatusEffect} to check for
 * @see {@linkcode apply}
 * @sealed
 */
export class ReduceStatusEffectDurationAbAttr extends AbAttr {
  private statusEffect: StatusEffect;

  constructor(statusEffect: StatusEffect) {
    super(false);

    this.statusEffect = statusEffect;
  }

  override canApply({ statusEffect }: ReduceStatusEffectDurationAbAttrParams): boolean {
    return statusEffect === this.statusEffect;
  }

  /**
   * Reduces the number of sleep turns remaining by an extra 1 when applied
   * @param args - The args passed to the `AbAttr`:
   * - `[0]` - The {@linkcode StatusEffect} of the Pokemon
   * - `[1]` - The number of turns remaining until the status is healed
   */
  override apply({ duration }: ReduceStatusEffectDurationAbAttrParams): void {
    duration.value -= 1;
  }
}

/**
 * Base class for abilities that apply an effect when the user is flinched.
 */
export abstract class FlinchEffectAbAttr extends AbAttr {
  constructor() {
    super(true);
  }

  canApply(_params: Closed<AbAttrBaseParams>): boolean {
    return true;
  }

  apply(_params: Closed<AbAttrBaseParams>): void {}
}

export class FlinchStatStageChangeAbAttr extends FlinchEffectAbAttr {
  private stats: BattleStat[];
  private stages: number;

  constructor(stats: BattleStat[], stages: number) {
    super();

    this.stats = stats;
    this.stages = stages;
  }

  override apply({ simulated, pokemon }: AbAttrBaseParams): void {
    if (!simulated) {
      globalScene.phaseManager.unshiftNew(
        "StatStageChangePhase",
        pokemon.getBattlerIndex(),
        true,
        this.stats,
        this.stages,
      );
    }
  }
}

export class IncreasePpAbAttr extends AbAttr {
  private declare readonly _: never;
}

/** @sealed */
export class ForceSwitchOutImmunityAbAttr extends CancelInteractionAbAttr {}

export interface ReduceBerryUseThresholdAbAttrParams extends AbAttrBaseParams {
  /** Holds the hp ratio for the berry to proc, which may be modified by ability application */
  hpRatioReq: NumberHolder;
}

/** @sealed */
export class ReduceBerryUseThresholdAbAttr extends AbAttr {
  constructor() {
    super(false);
  }

  override canApply({ pokemon, hpRatioReq }: ReduceBerryUseThresholdAbAttrParams): boolean {
    const hpRatio = pokemon.getHpRatio();
    return hpRatioReq.value < hpRatio;
  }

  override apply({ hpRatioReq }: ReduceBerryUseThresholdAbAttrParams): void {
    hpRatioReq.value *= 2;
  }
}

export interface WeightMultiplierAbAttrParams extends AbAttrBaseParams {
  /** The weight of the Pokemon, which may be modified by ability application */
  weight: NumberHolder;
}

/**
 * Ability attribute used for abilites that change the ability owner's weight
 * Used for Heavy Metal (doubling weight) and Light Metal (halving weight)
 * @sealed
 */
export class WeightMultiplierAbAttr extends AbAttr {
  private multiplier: number;

  constructor(multiplier: number) {
    super(false);

    this.multiplier = multiplier;
  }

  override apply({ weight }: WeightMultiplierAbAttrParams): void {
    weight.value *= this.multiplier;
  }
}

export interface SyncEncounterNatureAbAttrParams extends AbAttrBaseParams {
  /** The Pokemon whose nature is being synced */
  target: Pokemon;
}

/** @sealed */
export class SyncEncounterNatureAbAttr extends AbAttr {
  constructor() {
    super(false);
  }

  override apply({ target, pokemon }: SyncEncounterNatureAbAttrParams): void {
    target.setNature(pokemon.getNature());
  }
}

export interface MoveAbilityBypassAbAttrParams extends AbAttrBaseParams {
  /** The move being used */
  move: Move;
  /** Holds whether the move's ability should be ignored */
  cancelled: BooleanHolder;
}

export class MoveAbilityBypassAbAttr extends AbAttr {
  private moveIgnoreFunc: (pokemon: Pokemon, move: Move) => boolean;

  constructor(moveIgnoreFunc?: (pokemon: Pokemon, move: Move) => boolean) {
    super(false);

    this.moveIgnoreFunc = moveIgnoreFunc || ((_pokemon, _move) => true);
  }

  override canApply({ pokemon, move, cancelled }: MoveAbilityBypassAbAttrParams): boolean {
    return !cancelled.value && this.moveIgnoreFunc(pokemon, move);
  }

  override apply({ cancelled }: MoveAbilityBypassAbAttrParams): void {
    cancelled.value = true;
  }
}

export class AlwaysHitAbAttr extends AbAttr {
  private declare readonly _: never;
}

/** Attribute for abilities that allow moves that make contact to ignore protection (i.e. Unseen Fist) */
export class IgnoreProtectOnContactAbAttr extends AbAttr {
  private declare readonly _: never;
}

export interface InfiltratorAbAttrParams extends AbAttrBaseParams {
  /** Holds a flag indicating that infiltrator's bypass is active */
  bypassed: BooleanHolder;
}

/**
 * Attribute implementing the effects of {@link https://bulbapedia.bulbagarden.net/wiki/Infiltrator_(Ability) | Infiltrator}.
 * Allows the source's moves to bypass the effects of opposing Light Screen, Reflect, Aurora Veil, Safeguard, Mist, and Substitute.
 * @sealed
 */
export class InfiltratorAbAttr extends AbAttr {
  private declare readonly _: never;
  constructor() {
    super(false);
  }

  /** @returns Whether bypassed has not yet been set */
  override canApply({ bypassed }: InfiltratorAbAttrParams): boolean {
    return !bypassed.value;
  }

  /**
   * Sets a flag to bypass screens, Substitute, Safeguard, and Mist
   */
  override apply({ bypassed }: InfiltratorAbAttrParams): void {
    bypassed.value = true;
  }
}

/**
 * Attribute implementing the effects of {@link https://bulbapedia.bulbagarden.net/wiki/Magic_Bounce_(ability) | Magic Bounce}.
 * Allows the source to bounce back {@linkcode MoveFlags.REFLECTABLE | Reflectable}
 *  moves as if the user had used {@linkcode MoveId.MAGIC_COAT | Magic Coat}.
 * @sealed
 * @todo Make reflection a part of this ability's effects
 */
export class ReflectStatusMoveAbAttr extends AbAttr {
  private declare readonly _: never;
}

// TODO: Make these ability attributes be flags instead of dummy attributes
/** @sealed */
export class NoTransformAbilityAbAttr extends AbAttr {
  private declare readonly _: never;
  constructor() {
    super(false);
  }
}

/** @sealed */
export class NoFusionAbilityAbAttr extends AbAttr {
  private declare readonly _: never;
  constructor() {
    super(false);
  }
}

export interface IgnoreTypeImmunityAbAttrParams extends AbAttrBaseParams {
  /** The type of the move being used */
  readonly moveType: PokemonType;
  /** The type being checked for */
  readonly defenderType: PokemonType;
  /** Holds whether the type immunity should be bypassed */
  cancelled: BooleanHolder;
}

/** @sealed */
export class IgnoreTypeImmunityAbAttr extends AbAttr {
  private defenderType: PokemonType;
  private allowedMoveTypes: PokemonType[];

  constructor(defenderType: PokemonType, allowedMoveTypes: PokemonType[]) {
    super(false);
    this.defenderType = defenderType;
    this.allowedMoveTypes = allowedMoveTypes;
  }

  override canApply({ moveType, defenderType, cancelled }: IgnoreTypeImmunityAbAttrParams): boolean {
    return !cancelled.value && this.defenderType === defenderType && this.allowedMoveTypes.includes(moveType);
  }

  override apply({ cancelled }: IgnoreTypeImmunityAbAttrParams): void {
    cancelled.value = true;
  }
}

export interface IgnoreTypeStatusEffectImmunityAbAttrParams extends AbAttrParamsWithCancel {
  /** The status effect being applied */
  readonly statusEffect: StatusEffect;
  /** Holds whether the type immunity should be bypassed */
  readonly defenderType: PokemonType;
}

/**
 * Ignores the type immunity to Status Effects of the defender if the defender is of a certain type
 * @sealed
 */
export class IgnoreTypeStatusEffectImmunityAbAttr extends AbAttr {
  private statusEffect: StatusEffect[];
  private defenderType: PokemonType[];

  constructor(statusEffect: StatusEffect[], defenderType: PokemonType[]) {
    super(false);

    this.statusEffect = statusEffect;
    this.defenderType = defenderType;
  }

  override canApply({ statusEffect, defenderType, cancelled }: IgnoreTypeStatusEffectImmunityAbAttrParams): boolean {
    return !cancelled.value && this.statusEffect.includes(statusEffect) && this.defenderType.includes(defenderType);
  }

  override apply({ cancelled }: IgnoreTypeStatusEffectImmunityAbAttrParams): void {
    cancelled.value = true;
  }
}

/**
 * Gives money to the user after the battle.
 *
 * @extends PostBattleAbAttr
 */
export class MoneyAbAttr extends PostBattleAbAttr {
  override canApply({ simulated, victory }: PostBattleAbAttrParams): boolean {
    // TODO: Consider moving the simulated check to the apply method
    return !simulated && victory;
  }

  override apply(_params: PostBattleAbAttrParams): void {
    globalScene.currentBattle.moneyScattered += globalScene.getWaveMoneyAmount(0.2);
  }
}

// TODO: Consider removing this class and just using the PostSummonStatStageChangeAbAttr with a conditionalAttr
// that checks for the presence of the tag.
/**
 * Applies a stat change after a Pokémon is summoned,
 * conditioned on the presence of a specific arena tag.
 * @sealed
 */
export class PostSummonStatStageChangeOnArenaAbAttr extends PostSummonStatStageChangeAbAttr {
  /** The type of arena tag that conditions the stat change. */
  private arenaTagType: ArenaTagType;

  /**
   * Creates an instance of PostSummonStatStageChangeOnArenaAbAttr.
   * Initializes the stat change to increase Attack by 1 stage if the specified arena tag is present.
   *
   * @param tagType - The type of arena tag to check for.
   */
  constructor(tagType: ArenaTagType) {
    super([Stat.ATK], 1, true, false);
    this.arenaTagType = tagType;
  }

  override canApply(params: AbAttrBaseParams): boolean {
    const side = params.pokemon.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY;
    return (globalScene.arena.getTagOnSide(this.arenaTagType, side) ?? false) && super.canApply(params);
  }
}

/**
 * Takes no damage from the first hit of a damaging move.
 * This is used in the Disguise and Ice Face abilities.
 *
 * Does not apply to a user's substitute
 * @sealed
 */
export class FormBlockDamageAbAttr extends ReceivedMoveDamageMultiplierAbAttr {
  private multiplier: number;
  private tagType: BattlerTagType;
  private recoilDamageFunc?: (pokemon: Pokemon) => number;
  private triggerMessageFunc: (pokemon: Pokemon, abilityName: string) => string;

  constructor(
    condition: PokemonDefendCondition,
    multiplier: number,
    tagType: BattlerTagType,
    triggerMessageFunc: (pokemon: Pokemon, abilityName: string) => string,
    recoilDamageFunc?: (pokemon: Pokemon) => number,
  ) {
    super(condition, multiplier);

    this.multiplier = multiplier;
    this.tagType = tagType;
    this.recoilDamageFunc = recoilDamageFunc;
    this.triggerMessageFunc = triggerMessageFunc;
  }

  override canApply({ pokemon, opponent, move }: PreDefendModifyDamageAbAttrParams): boolean {
    // TODO: Investigate whether the substitute check can be removed, as it should be accounted for in the move effect phase
    return this.condition(pokemon, opponent, move) && !move.hitsSubstitute(opponent, pokemon);
  }

  /**
   * Applies the pre-defense ability to the Pokémon.
   * Removes the appropriate `BattlerTagType` when hit by an attack and is in its defense form.
   */
  override apply({ pokemon, simulated, damage }: PreDefendModifyDamageAbAttrParams): void {
    if (!simulated) {
      damage.value = this.multiplier;
      pokemon.removeTag(this.tagType);
      if (this.recoilDamageFunc) {
        pokemon.damageAndUpdate(this.recoilDamageFunc(pokemon), {
          result: HitResult.INDIRECT,
          ignoreSegments: true,
          ignoreFaintPhase: true,
        });
      }
    }
  }

  /**
   * Gets the message triggered when the Pokémon avoids damage using the form-changing ability.
   * @returns The trigger message.
   */
  override getTriggerMessage({ pokemon }: PreDefendModifyDamageAbAttrParams, abilityName: string): string {
    return this.triggerMessageFunc(pokemon, abilityName);
  }
}

/**
 * Base class for defining {@linkcode Ability} attributes before summon
 * (should use {@linkcode PostSummonAbAttr} for most ability)
 * @see {@linkcode applyPreSummon()}
 */
export class PreSummonAbAttr extends AbAttr {
  private declare readonly _: never;
  apply(_params: Closed<AbAttrBaseParams>): void {}

  canApply(_params: Closed<AbAttrBaseParams>): boolean {
    return true;
  }
}

/** @sealed */
export class IllusionPreSummonAbAttr extends PreSummonAbAttr {
  /**
   * Apply a new illusion when summoning Zoroark if the illusion is available
   *
   * @param pokemon - The Pokémon with the Illusion ability.
   */
  override apply({ pokemon }: AbAttrBaseParams): void {
    const party: Pokemon[] = (pokemon.isPlayer() ? globalScene.getPlayerParty() : globalScene.getEnemyParty()).filter(
      p => p.isAllowedInBattle(),
    );
    let illusionPokemon: Pokemon | PokemonSpecies;
    if (pokemon.hasTrainer()) {
      illusionPokemon = party.filter(p => p !== pokemon).at(-1) || pokemon;
    } else {
      illusionPokemon = globalScene.arena.randomSpecies(globalScene.currentBattle.waveIndex, pokemon.level);
    }
    pokemon.setIllusion(illusionPokemon);
  }

  /** @returns Whether the illusion can be applied. */
  override canApply({ pokemon }: AbAttrBaseParams): boolean {
    if (pokemon.hasTrainer()) {
      const party: Pokemon[] = (pokemon.isPlayer() ? globalScene.getPlayerParty() : globalScene.getEnemyParty()).filter(
        p => p.isAllowedInBattle(),
      );
      const lastPokemon: Pokemon = party.filter(p => p !== pokemon).at(-1) || pokemon;
      const speciesId = lastPokemon.species.speciesId;

      // If the last conscious Pokémon in the party is a Terastallized Ogerpon or Terapagos, Illusion will not activate.
      // Illusion will also not activate if the Pokémon with Illusion is Terastallized and the last Pokémon in the party is Ogerpon or Terapagos.
      if (
        lastPokemon === pokemon
        || ((speciesId === SpeciesId.OGERPON || speciesId === SpeciesId.TERAPAGOS)
          && (lastPokemon.isTerastallized || pokemon.isTerastallized))
      ) {
        return false;
      }
    }
    return !pokemon.summonData.illusionBroken;
  }
}

/** @sealed */
export class IllusionBreakAbAttr extends AbAttr {
  private declare readonly _: never;
  // TODO: Consider adding a `canApply` method that checks if the pokemon has an active illusion
  override apply({ pokemon }: AbAttrBaseParams): void {
    pokemon.breakIllusion();
    pokemon.summonData.illusionBroken = true;
  }
}

/** @sealed */
export class PostDefendIllusionBreakAbAttr extends PostDefendAbAttr {
  /**
   * Destroy the illusion upon taking damage
   * @returns - Whether the illusion was destroyed.
   */
  override apply({ pokemon }: PostMoveInteractionAbAttrParams): void {
    pokemon.breakIllusion();
    pokemon.summonData.illusionBroken = true;
  }

  override canApply({ pokemon, hitResult }: PostMoveInteractionAbAttrParams): boolean {
    const breakIllusion: HitResult[] = [
      HitResult.EFFECTIVE,
      HitResult.SUPER_EFFECTIVE,
      HitResult.NOT_VERY_EFFECTIVE,
      HitResult.ONE_HIT_KO,
    ];
    return breakIllusion.includes(hitResult) && !!pokemon.summonData.illusion;
  }
}

export class IllusionPostBattleAbAttr extends PostBattleAbAttr {
  /**
   * Break the illusion once the battle ends
   *
   * @param pokemon - The Pokémon with the Illusion ability.
   * @param _passive - Unused
   * @param _args - Unused
   * @returns - Whether the illusion was applied.
   */
  override apply({ pokemon }: PostBattleAbAttrParams): void {
    pokemon.breakIllusion();
  }
}

export interface BypassSpeedChanceAbAttrParams extends AbAttrBaseParams {
  /** Holds whether the speed check is bypassed after ability application */
  bypass: BooleanHolder;
}

/**
 * If a Pokémon with this Ability selects a damaging move, it has a 30% chance of going first in its priority bracket. If the Ability activates, this is announced at the start of the turn (after move selection).
 * @sealed
 */
export class BypassSpeedChanceAbAttr extends AbAttr {
  public chance: number;

  /**
   * @param chance - Probability of the ability activating
   */
  constructor(chance: number) {
    super(true);
    this.chance = chance;
  }

  override canApply({ bypass, simulated, pokemon }: BypassSpeedChanceAbAttrParams): boolean {
    // TODO: Consider whether we can move the simulated check to the `apply` method
    // May be difficult as we likely do not want to modify the randBattleSeed
    const turnCommand = globalScene.currentBattle.turnCommands[pokemon.getBattlerIndex()];
    const isCommandFight = turnCommand?.command === Command.FIGHT;
    const move = turnCommand?.move?.move ? allMoves[turnCommand.move.move] : null;
    const isDamageMove = move?.category === MoveCategory.PHYSICAL || move?.category === MoveCategory.SPECIAL;
    return (
      !simulated && !bypass.value && pokemon.randBattleSeedInt(100) < this.chance && isCommandFight && isDamageMove
    );
  }

  /**
   * bypass move order in their priority bracket when pokemon choose damaging move
   */
  override apply({ bypass }: BypassSpeedChanceAbAttrParams): void {
    bypass.value = true;
  }

  override getTriggerMessage({ pokemon }: BypassSpeedChanceAbAttrParams, _abilityName: string): string {
    return i18next.t("abilityTriggers:quickDraw", { pokemonName: getPokemonNameWithAffix(pokemon) });
  }
}

export interface PreventBypassSpeedChanceAbAttrParams extends AbAttrBaseParams {
  /** Holds whether the speed check is bypassed after ability application */
  bypass: BooleanHolder;
  /** Holds whether the Pokemon can check held items for Quick Claw's effects */
  canCheckHeldItems: BooleanHolder;
}

/**
 * This attribute checks if a Pokemon's move meets a provided condition to determine if the Pokemon can use Quick Claw
 * It was created because Pokemon with the ability Mycelium Might cannot access Quick Claw's benefits when using status moves.
 * @sealed
 */
export class PreventBypassSpeedChanceAbAttr extends AbAttr {
  private condition: (pokemon: Pokemon, move: Move) => boolean;

  /**
   * @param condition - checks if a move meets certain conditions
   */
  constructor(condition: (pokemon: Pokemon, move: Move) => boolean) {
    super(true);
    this.condition = condition;
  }

  override canApply({ pokemon }: PreventBypassSpeedChanceAbAttrParams): boolean {
    // TODO: Consider having these be passed as parameters instead of being retrieved here
    const turnCommand = globalScene.currentBattle.turnCommands[pokemon.getBattlerIndex()];
    const isCommandFight = turnCommand?.command === Command.FIGHT;
    const move = turnCommand?.move?.move ? allMoves[turnCommand.move.move] : null;
    return isCommandFight && this.condition(pokemon, move!);
  }

  override apply({ bypass, canCheckHeldItems }: PreventBypassSpeedChanceAbAttrParams): void {
    bypass.value = false;
    canCheckHeldItems.value = false;
  }
}

// Also consider making this a postTerrainChange attribute instead of a post-summon attribute
/**
 * This applies a terrain-based type change to the Pokemon.
 * Used by Mimicry.
 * @sealed
 */
export class TerrainEventTypeChangeAbAttr extends PostSummonAbAttr {
  constructor() {
    super(true);
  }

  override canApply({ pokemon }: AbAttrBaseParams): boolean {
    return !pokemon.isTerastallized;
  }

  override apply({ pokemon }: AbAttrBaseParams): void {
    const currentTerrain = globalScene.arena.getTerrainType();
    const typeChange: PokemonType[] = this.determineTypeChange(pokemon, currentTerrain);
    if (typeChange.length > 0) {
      if (pokemon.summonData.addedType && typeChange.includes(pokemon.summonData.addedType)) {
        pokemon.summonData.addedType = null;
      }
      pokemon.summonData.types = typeChange;
      pokemon.updateInfo();
    }
  }

  /**
   * Retrieves the type(s) the Pokemon should change to in response to a terrain
   * @param pokemon
   * @param currentTerrain {@linkcode TerrainType}
   * @returns a list of type(s)
   */
  private determineTypeChange(pokemon: Pokemon, currentTerrain: TerrainType): PokemonType[] {
    const typeChange: PokemonType[] = [];
    switch (currentTerrain) {
      case TerrainType.ELECTRIC:
        typeChange.push(PokemonType.ELECTRIC);
        break;
      case TerrainType.MISTY:
        typeChange.push(PokemonType.FAIRY);
        break;
      case TerrainType.GRASSY:
        typeChange.push(PokemonType.GRASS);
        break;
      case TerrainType.PSYCHIC:
        typeChange.push(PokemonType.PSYCHIC);
        break;
      default:
        pokemon.getTypes(false, false, true).forEach(t => {
          typeChange.push(t);
        });
        break;
    }
    return typeChange;
  }

  override getTriggerMessage({ pokemon }: AbAttrBaseParams, _abilityName: string) {
    const currentTerrain = globalScene.arena.getTerrainType();
    const pokemonNameWithAffix = getPokemonNameWithAffix(pokemon);
    if (currentTerrain === TerrainType.NONE) {
      return i18next.t("abilityTriggers:pokemonTypeChangeRevert", { pokemonNameWithAffix });
    }
    const moveType = i18next.t(
      `pokemonInfo:type.${toCamelCase(PokemonType[this.determineTypeChange(pokemon, currentTerrain)[0]])}`,
    );
    return i18next.t("abilityTriggers:pokemonTypeChange", { pokemonNameWithAffix, moveType });
  }
}

class ForceSwitchOutHelper {
  constructor(private switchType: SwitchType) {}

  /**
   * Handles the logic for switching out a Pokémon based on battle conditions, HP, and the switch type.
   *
   * @param pokemon The {@linkcode Pokemon} attempting to switch out.
   * @returns `true` if the switch is successful
   */
  // TODO: Make this cancel pending move phases on the switched out target
  public switchOutLogic(pokemon: Pokemon): boolean {
    const switchOutTarget = pokemon;
    /**
     * If the switch-out target is a player-controlled Pokémon, the function checks:
     * - Whether there are available party members to switch in.
     * - If the Pokémon is still alive (hp > 0), and if so, it leaves the field and a new SwitchPhase is initiated.
     */
    if (switchOutTarget.isPlayer()) {
      if (globalScene.getPlayerParty().filter(p => p.isAllowedInBattle() && !p.isOnField()).length === 0) {
        return false;
      }

      if (switchOutTarget.hp > 0) {
        switchOutTarget.leaveField(this.switchType === SwitchType.SWITCH);
        globalScene.phaseManager.prependNewToPhase(
          "MoveEndPhase",
          "SwitchPhase",
          this.switchType,
          switchOutTarget.getFieldIndex(),
          true,
          true,
        );
        return true;
      }
      /**
       * For non-wild battles, it checks if the opposing party has any available Pokémon to switch in.
       * If yes, the Pokémon leaves the field and a new SwitchSummonPhase is initiated.
       */
    } else if (globalScene.currentBattle.battleType !== BattleType.WILD) {
      if (globalScene.getEnemyParty().filter(p => p.isAllowedInBattle() && !p.isOnField()).length === 0) {
        return false;
      }
      if (switchOutTarget.hp > 0) {
        switchOutTarget.leaveField(this.switchType === SwitchType.SWITCH);
        const summonIndex = globalScene.currentBattle.trainer
          ? globalScene.currentBattle.trainer.getNextSummonIndex((switchOutTarget as EnemyPokemon).trainerSlot)
          : 0;
        globalScene.phaseManager.prependNewToPhase(
          "MoveEndPhase",
          "SwitchSummonPhase",
          this.switchType,
          switchOutTarget.getFieldIndex(),
          summonIndex,
          false,
          false,
        );
        return true;
      }
      /**
       * For wild Pokémon battles, the Pokémon will flee if the conditions are met (waveIndex and double battles).
       * It will not flee if it is a Mystery Encounter with fleeing disabled (checked in `getSwitchOutCondition()`) or if it is a wave 10x wild boss
       */
    } else {
      const allyPokemon = switchOutTarget.getAlly();

      if (!globalScene.currentBattle.waveIndex || globalScene.currentBattle.waveIndex % 10 === 0) {
        return false;
      }

      if (switchOutTarget.hp > 0) {
        switchOutTarget.leaveField(false);
        globalScene.phaseManager.queueMessage(
          i18next.t("moveTriggers:fled", { pokemonName: getPokemonNameWithAffix(switchOutTarget) }),
          null,
          true,
          500,
        );
        if (globalScene.currentBattle.double && !isNullOrUndefined(allyPokemon)) {
          globalScene.redirectPokemonMoves(switchOutTarget, allyPokemon);
        }
      }

      if (!allyPokemon?.isActive(true)) {
        globalScene.clearEnemyHeldItemModifiers();

        if (switchOutTarget.hp) {
          globalScene.phaseManager.pushNew("BattleEndPhase", false);

          if (globalScene.gameMode.hasRandomBiomes || globalScene.isNewBiome()) {
            globalScene.phaseManager.pushNew("SelectBiomePhase");
          }

          globalScene.phaseManager.pushNew("NewBattlePhase");
        }
      }
    }
    return false;
  }

  /**
   * Determines if a Pokémon can switch out based on its status, the opponent's status, and battle conditions.
   *
   * @param pokemon The Pokémon attempting to switch out.
   * @param opponent The opponent Pokémon.
   * @returns `true` if the switch-out condition is met
   */
  public getSwitchOutCondition(pokemon: Pokemon, opponent: Pokemon): boolean {
    const switchOutTarget = pokemon;
    const player = switchOutTarget.isPlayer();

    if (player) {
      const blockedByAbility = new BooleanHolder(false);
      applyAbAttrs("ForceSwitchOutImmunityAbAttr", { pokemon: opponent, cancelled: blockedByAbility });
      return !blockedByAbility.value;
    }

    if (
      !player
      && globalScene.currentBattle.battleType === BattleType.WILD
      && !globalScene.currentBattle.waveIndex
      && globalScene.currentBattle.waveIndex % 10 === 0
    ) {
      return false;
    }

    if (
      !player
      && globalScene.currentBattle.isBattleMysteryEncounter()
      && !globalScene.currentBattle.mysteryEncounter?.fleeAllowed
    ) {
      return false;
    }

    const party = player ? globalScene.getPlayerParty() : globalScene.getEnemyParty();
    return (
      (!player && globalScene.currentBattle.battleType === BattleType.WILD)
      || party.filter(
        p =>
          p.isAllowedInBattle()
          && !p.isOnField()
          && (player || (p as EnemyPokemon).trainerSlot === (switchOutTarget as EnemyPokemon).trainerSlot),
      ).length > 0
    );
  }

  /**
   * Returns a message if the switch-out attempt fails due to ability effects.
   *
   * @param target The target Pokémon.
   * @returns The failure message, or `null` if no failure.
   */
  public getFailedText(target: Pokemon): string | null {
    const blockedByAbility = new BooleanHolder(false);
    applyAbAttrs("ForceSwitchOutImmunityAbAttr", { pokemon: target, cancelled: blockedByAbility });
    return blockedByAbility.value
      ? i18next.t("moveTriggers:cannotBeSwitchedOut", { pokemonName: getPokemonNameWithAffix(target) })
      : null;
  }
}

/**
 * Calculates the amount of recovery from the Shell Bell item.
 *
 * If the Pokémon is holding a Shell Bell, this function computes the amount of health
 * recovered based on the damage dealt in the current turn. The recovery is multiplied by the
 * Shell Bell's modifier (if any).
 *
 * @param pokemon - The Pokémon whose Shell Bell recovery is being calculated.
 * @returns The amount of health recovered by Shell Bell.
 */
function calculateShellBellRecovery(pokemon: Pokemon): number {
  const shellBellModifier = pokemon.getHeldItems().find(m => m instanceof HitHealModifier);
  if (shellBellModifier) {
    return toDmgValue(pokemon.turnData.totalDamageDealt / 8) * shellBellModifier.stackCount;
  }
  return 0;
}

export interface PostDamageAbAttrParams extends AbAttrBaseParams {
  /** The pokemon that caused the damage; omitted if the damage was not from a pokemon */
  source?: Pokemon;
  /** The amount of damage that was dealt */
  readonly damage: number;
}
/**
 * Triggers after the Pokemon takes any damage
 */
export class PostDamageAbAttr extends AbAttr {
  override canApply(_params: PostDamageAbAttrParams): boolean {
    return true;
  }

  override apply(_params: PostDamageAbAttrParams): void {}
}

/**
 * Ability attribute for forcing a Pokémon to switch out after its health drops below half.
 * This attribute checks various conditions related to the damage received, the moves used by the Pokémon
 * and its opponents, and determines whether a forced switch-out should occur.
 *
 * Used by Wimp Out and Emergency Exit
 *
 * @see {@linkcode applyPostDamage}
 * @sealed
 */
export class PostDamageForceSwitchAbAttr extends PostDamageAbAttr {
  private helper: ForceSwitchOutHelper = new ForceSwitchOutHelper(SwitchType.SWITCH);
  private hpRatio: number;

  constructor(hpRatio = 0.5) {
    super();
    this.hpRatio = hpRatio;
  }

  // TODO: Refactor to use more early returns
  public override canApply({ pokemon, source, damage }: PostDamageAbAttrParams): boolean {
    // Will not activate when the Pokémon's HP is lowered by cutting its own HP
    const forbiddenAttackingMoves = [MoveId.BELLY_DRUM, MoveId.SUBSTITUTE, MoveId.CURSE, MoveId.PAIN_SPLIT];
    const lastMoveUsed = pokemon.getLastXMoves()[0];
    if (forbiddenAttackingMoves.includes(lastMoveUsed?.move)) {
      return false;
    }

    // Dragon Tail and Circle Throw switch out Pokémon before the Ability activates.
    const forbiddenDefendingMoves = [MoveId.DRAGON_TAIL, MoveId.CIRCLE_THROW];
    if (source) {
      const enemyLastMoveUsed = source.getLastXMoves()[0];
      if (enemyLastMoveUsed) {
        // Will not activate if the Pokémon's HP falls below half while it is in the air during Sky Drop.
        if (
          forbiddenDefendingMoves.includes(enemyLastMoveUsed.move)
          || (enemyLastMoveUsed.move === MoveId.SKY_DROP && enemyLastMoveUsed.result === MoveResult.OTHER)
        ) {
          return false;
          // Will not activate if the Pokémon's HP falls below half by a move affected by Sheer Force.
          // TODO: Make this use the sheer force disable condition
        }
        if (allMoves[enemyLastMoveUsed.move].chance >= 0 && source.hasAbility(AbilityId.SHEER_FORCE)) {
          return false;
        }
        // Activate only after the last hit of multistrike moves
        if (source.turnData.hitsLeft > 1) {
          return false;
        }
        if (source.turnData.hitCount > 1) {
          damage = pokemon.turnData.damageTaken;
        }
      }
    }

    if (pokemon.hp + damage >= pokemon.getMaxHp() * this.hpRatio) {
      const shellBellHeal = calculateShellBellRecovery(pokemon);
      if (pokemon.hp - shellBellHeal < pokemon.getMaxHp() * this.hpRatio) {
        for (const opponent of pokemon.getOpponents()) {
          if (!this.helper.getSwitchOutCondition(pokemon, opponent)) {
            return false;
          }
        }
        return true;
      }
    }

    return false;
  }

  /**
   * Applies the switch-out logic after the Pokémon takes damage.
   * Checks various conditions based on the moves used by the Pokémon, the opponents' moves, and
   * the Pokémon's health after damage to determine whether the switch-out should occur.
   */
  public override apply({ pokemon }: PostDamageAbAttrParams): void {
    // TODO: Consider respecting the `simulated` flag here
    this.helper.switchOutLogic(pokemon);
  }
}

/**
 * Map of all ability attribute constructors, for use with the `.is` method.
 */
const AbilityAttrs = Object.freeze({
  BlockRecoilDamageAttr,
  DoubleBattleChanceAbAttr,
  PostBattleInitAbAttr,
  PostBattleInitFormChangeAbAttr,
  PostTeraFormChangeStatChangeAbAttr,
  ClearWeatherAbAttr,
  ClearTerrainAbAttr,
  PreDefendAbAttr,
  PreDefendFullHpEndureAbAttr,
  BlockItemTheftAbAttr,
  StabBoostAbAttr,
  ReceivedMoveDamageMultiplierAbAttr,
  AlliedFieldDamageReductionAbAttr,
  ReceivedTypeDamageMultiplierAbAttr,
  TypeImmunityAbAttr,
  AttackTypeImmunityAbAttr,
  TypeImmunityHealAbAttr,
  NonSuperEffectiveImmunityAbAttr,
  FullHpResistTypeAbAttr,
  PostDefendAbAttr,
  FieldPriorityMoveImmunityAbAttr,
  PostStatStageChangeAbAttr,
  MoveImmunityAbAttr,
  WonderSkinAbAttr,
  MoveImmunityStatStageChangeAbAttr,
  ReverseDrainAbAttr,
  PostDefendStatStageChangeAbAttr,
  PostDefendHpGatedStatStageChangeAbAttr,
  PostDefendApplyArenaTrapTagAbAttr,
  PostDefendApplyBattlerTagAbAttr,
  PostDefendTypeChangeAbAttr,
  PostDefendTerrainChangeAbAttr,
  PostDefendContactApplyStatusEffectAbAttr,
  EffectSporeAbAttr,
  PostDefendContactApplyTagChanceAbAttr,
  PostReceiveCritStatStageChangeAbAttr,
  PostDefendContactDamageAbAttr,
  PostDefendPerishSongAbAttr,
  PostDefendWeatherChangeAbAttr,
  PostDefendAbilitySwapAbAttr,
  PostDefendAbilityGiveAbAttr,
  PostDefendMoveDisableAbAttr,
  PostStatStageChangeStatStageChangeAbAttr,
  PreAttackAbAttr,
  MoveEffectChanceMultiplierAbAttr,
  IgnoreMoveEffectsAbAttr,
  VariableMovePowerAbAttr,
  FieldPreventExplosiveMovesAbAttr,
  FieldMultiplyStatAbAttr,
  MoveTypeChangeAbAttr,
  PokemonTypeChangeAbAttr,
  AddSecondStrikeAbAttr,
  DamageBoostAbAttr,
  MovePowerBoostAbAttr,
  MoveTypePowerBoostAbAttr,
  LowHpMoveTypePowerBoostAbAttr,
  VariableMovePowerBoostAbAttr,
  FieldMovePowerBoostAbAttr,
  PreAttackFieldMoveTypePowerBoostAbAttr,
  FieldMoveTypePowerBoostAbAttr,
  UserFieldMoveTypePowerBoostAbAttr,
  AllyMoveCategoryPowerBoostAbAttr,
  StatMultiplierAbAttr,
  PostAttackAbAttr,
  AllyStatMultiplierAbAttr,
  ExecutedMoveAbAttr,
  GorillaTacticsAbAttr,
  PostAttackStealHeldItemAbAttr,
  PostAttackApplyStatusEffectAbAttr,
  PostAttackContactApplyStatusEffectAbAttr,
  PostAttackApplyBattlerTagAbAttr,
  PostDefendStealHeldItemAbAttr,
  PostSetStatusAbAttr,
  SynchronizeStatusAbAttr,
  PostVictoryAbAttr,
  PostVictoryFormChangeAbAttr,
  PostKnockOutAbAttr,
  PostKnockOutStatStageChangeAbAttr,
  CopyFaintedAllyAbilityAbAttr,
  IgnoreOpponentStatStagesAbAttr,
  IntimidateImmunityAbAttr,
  PostIntimidateStatStageChangeAbAttr,
  PostSummonAbAttr,
  PostSummonRemoveEffectAbAttr,
  PostSummonRemoveArenaTagAbAttr,
  PostSummonAddArenaTagAbAttr,
  PostSummonMessageAbAttr,
  PostSummonUnnamedMessageAbAttr,
  PostSummonAddBattlerTagAbAttr,
  PostSummonRemoveBattlerTagAbAttr,
  PostSummonStatStageChangeAbAttr,
  PostSummonAllyHealAbAttr,
  PostSummonClearAllyStatStagesAbAttr,
  DownloadAbAttr,
  PostSummonWeatherChangeAbAttr,
  PostSummonTerrainChangeAbAttr,
  PostSummonHealStatusAbAttr,
  PostSummonFormChangeAbAttr,
  PostSummonCopyAbilityAbAttr,
  PostSummonUserFieldRemoveStatusEffectAbAttr,
  PostSummonCopyAllyStatsAbAttr,
  PostSummonTransformAbAttr,
  PostSummonWeatherSuppressedFormChangeAbAttr,
  PostSummonFormChangeByWeatherAbAttr,
  CommanderAbAttr,
  PreSwitchOutAbAttr,
  PreSwitchOutResetStatusAbAttr,
  PreSwitchOutClearWeatherAbAttr,
  PreSwitchOutHealAbAttr,
  PreSwitchOutFormChangeAbAttr,
  PreLeaveFieldAbAttr,
  PreLeaveFieldClearWeatherAbAttr,
  PreLeaveFieldRemoveSuppressAbilitiesSourceAbAttr,
  PreStatStageChangeAbAttr,
  ReflectStatStageChangeAbAttr,
  ProtectStatAbAttr,
  ConfusionOnStatusEffectAbAttr,
  PreSetStatusAbAttr,
  PreSetStatusEffectImmunityAbAttr,
  StatusEffectImmunityAbAttr,
  UserFieldStatusEffectImmunityAbAttr,
  ConditionalUserFieldStatusEffectImmunityAbAttr,
  ConditionalUserFieldProtectStatAbAttr,
  PreApplyBattlerTagAbAttr,
  PreApplyBattlerTagImmunityAbAttr,
  BattlerTagImmunityAbAttr,
  UserFieldBattlerTagImmunityAbAttr,
  ConditionalUserFieldBattlerTagImmunityAbAttr,
  BlockCritAbAttr,
  BonusCritAbAttr,
  MultCritAbAttr,
  ConditionalCritAbAttr,
  BlockNonDirectDamageAbAttr,
  BlockStatusDamageAbAttr,
  BlockOneHitKOAbAttr,
  ChangeMovePriorityAbAttr,
  IgnoreContactAbAttr,
  PreWeatherEffectAbAttr,
  PreWeatherDamageAbAttr,
  SuppressWeatherEffectAbAttr,
  ForewarnAbAttr,
  FriskAbAttr,
  PostWeatherChangeAbAttr,
  PostWeatherChangeFormChangeAbAttr,
  PostWeatherLapseAbAttr,
  PostWeatherLapseHealAbAttr,
  PostWeatherLapseDamageAbAttr,
  PostTerrainChangeAbAttr,
  PostTurnAbAttr,
  PostTurnStatusHealAbAttr,
  PostTurnResetStatusAbAttr,
  PostTurnRestoreBerryAbAttr,
  CudChewConsumeBerryAbAttr,
  CudChewRecordBerryAbAttr,
  MoodyAbAttr,
  SpeedBoostAbAttr,
  PostTurnHealAbAttr,
  PostTurnFormChangeAbAttr,
  PostTurnHurtIfSleepingAbAttr,
  FetchBallAbAttr,
  PostBiomeChangeAbAttr,
  PostBiomeChangeWeatherChangeAbAttr,
  PostBiomeChangeTerrainChangeAbAttr,
  PostMoveUsedAbAttr,
  PostDancingMoveAbAttr,
  PostItemLostAbAttr,
  PostItemLostApplyBattlerTagAbAttr,
  StatStageChangeMultiplierAbAttr,
  StatStageChangeCopyAbAttr,
  BypassBurnDamageReductionAbAttr,
  ReduceBurnDamageAbAttr,
  DoubleBerryEffectAbAttr,
  PreventBerryUseAbAttr,
  HealFromBerryUseAbAttr,
  RunSuccessAbAttr,
  CheckTrappedAbAttr,
  ArenaTrapAbAttr,
  MaxMultiHitAbAttr,
  PostBattleAbAttr,
  PostBattleLootAbAttr,
  PostFaintAbAttr,
  PostFaintUnsuppressedWeatherFormChangeAbAttr,
  PostFaintContactDamageAbAttr,
  PostFaintHPDamageAbAttr,
  RedirectMoveAbAttr,
  RedirectTypeMoveAbAttr,
  BlockRedirectAbAttr,
  ReduceStatusEffectDurationAbAttr,
  FlinchEffectAbAttr,
  FlinchStatStageChangeAbAttr,
  IncreasePpAbAttr,
  ForceSwitchOutImmunityAbAttr,
  ReduceBerryUseThresholdAbAttr,
  WeightMultiplierAbAttr,
  SyncEncounterNatureAbAttr,
  MoveAbilityBypassAbAttr,
  AlwaysHitAbAttr,
  IgnoreProtectOnContactAbAttr,
  InfiltratorAbAttr,
  ReflectStatusMoveAbAttr,
  NoTransformAbilityAbAttr,
  NoFusionAbilityAbAttr,
  IgnoreTypeImmunityAbAttr,
  IgnoreTypeStatusEffectImmunityAbAttr,
  MoneyAbAttr,
  PostSummonStatStageChangeOnArenaAbAttr,
  FormBlockDamageAbAttr,
  PreSummonAbAttr,
  IllusionPreSummonAbAttr,
  IllusionBreakAbAttr,
  PostDefendIllusionBreakAbAttr,
  IllusionPostBattleAbAttr,
  BypassSpeedChanceAbAttr,
  PreventBypassSpeedChanceAbAttr,
  TerrainEventTypeChangeAbAttr,
  PostDamageAbAttr,
  PostDamageForceSwitchAbAttr,
});

/**
 * A map of of all {@linkcode AbAttr} constructors
 */
export type AbAttrConstructorMap = typeof AbilityAttrs;

/**
 * Sets the ability of a Pokémon as revealed.
 * @param pokemon - The Pokémon whose ability is being revealed.
 */
function setAbilityRevealed(pokemon: Pokemon): void {
  pokemon.waveData.abilityRevealed = true;
}

/**
 * Returns all Pokemon on field with weather-based forms
 */
function getPokemonWithWeatherBasedForms() {
  return globalScene
    .getField(true)
    .filter(
      p =>
        (p.hasAbility(AbilityId.FORECAST) && p.species.speciesId === SpeciesId.CASTFORM)
        || (p.hasAbility(AbilityId.FLOWER_GIFT) && p.species.speciesId === SpeciesId.CHERRIM),
    );
}

// biome-ignore format: prevent biome from removing the newlines (e.g. prevent `new Ability(...).attr(...)`)
export function initAbilities() {
  allAbilities.push(
    new Ability(AbilityId.NONE, 3),
    new Ability(AbilityId.STENCH, 3)
      .attr(PostAttackApplyBattlerTagAbAttr, false, (user, target, move) => !move.hasAttr("FlinchAttr") && !move.hitsSubstitute(user, target) ? 10 : 0, BattlerTagType.FLINCHED),
    new Ability(AbilityId.DRIZZLE, 3)
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.RAIN)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.RAIN),
    new Ability(AbilityId.SPEED_BOOST, 3)
      .attr(SpeedBoostAbAttr),
    new Ability(AbilityId.BATTLE_ARMOR, 3)
      .attr(BlockCritAbAttr)
      .ignorable(),
    new Ability(AbilityId.STURDY, 3)
      .attr(PreDefendFullHpEndureAbAttr)
      .attr(BlockOneHitKOAbAttr)
      .ignorable(),
    new Ability(AbilityId.DAMP, 3)
      .attr(FieldPreventExplosiveMovesAbAttr)
      .ignorable(),
    new Ability(AbilityId.LIMBER, 3)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.PARALYSIS)
      .attr(PostSummonHealStatusAbAttr, StatusEffect.PARALYSIS)
      .ignorable(),
    new Ability(AbilityId.SAND_VEIL, 3)
      .attr(StatMultiplierAbAttr, Stat.EVA, 1.2)
      .attr(BlockWeatherDamageAttr, WeatherType.SANDSTORM)
      .condition(getWeatherCondition(WeatherType.SANDSTORM))
      .ignorable(),
    new Ability(AbilityId.STATIC, 3)
      .attr(PostDefendContactApplyStatusEffectAbAttr, 30, StatusEffect.PARALYSIS)
      .bypassFaint(),
    new Ability(AbilityId.VOLT_ABSORB, 3)
      .attr(TypeImmunityHealAbAttr, PokemonType.ELECTRIC)
      .ignorable(),
    new Ability(AbilityId.WATER_ABSORB, 3)
      .attr(TypeImmunityHealAbAttr, PokemonType.WATER)
      .ignorable(),
    new Ability(AbilityId.OBLIVIOUS, 3)
      .attr(BattlerTagImmunityAbAttr, [ BattlerTagType.INFATUATED, BattlerTagType.TAUNT ])
      .attr(PostSummonRemoveBattlerTagAbAttr, BattlerTagType.INFATUATED, BattlerTagType.TAUNT)
      .attr(IntimidateImmunityAbAttr)
      .ignorable(),
    new Ability(AbilityId.CLOUD_NINE, 3)
      .attr(SuppressWeatherEffectAbAttr, true)
      .attr(PostSummonUnnamedMessageAbAttr, i18next.t("abilityTriggers:weatherEffectDisappeared"))
      .attr(PostSummonWeatherSuppressedFormChangeAbAttr)
      .attr(PostFaintUnsuppressedWeatherFormChangeAbAttr)
      .bypassFaint(),
    new Ability(AbilityId.COMPOUND_EYES, 3)
      .attr(StatMultiplierAbAttr, Stat.ACC, 1.3),
    new Ability(AbilityId.INSOMNIA, 3)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.SLEEP)
      .attr(PostSummonHealStatusAbAttr, StatusEffect.SLEEP)
      .attr(BattlerTagImmunityAbAttr, BattlerTagType.DROWSY)
      .ignorable(),
    new Ability(AbilityId.COLOR_CHANGE, 3)
      .attr(PostDefendTypeChangeAbAttr)
      .condition(getSheerForceHitDisableAbCondition()),
    new Ability(AbilityId.IMMUNITY, 3)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.POISON, StatusEffect.TOXIC)
      .attr(PostSummonHealStatusAbAttr, StatusEffect.POISON, StatusEffect.TOXIC)
      .ignorable(),
    new Ability(AbilityId.FLASH_FIRE, 3)
      .attr(TypeImmunityAddBattlerTagAbAttr, PokemonType.FIRE, BattlerTagType.FIRE_BOOST, 1)
      .ignorable(),
    new Ability(AbilityId.SHIELD_DUST, 3)
      .attr(IgnoreMoveEffectsAbAttr)
      .ignorable(),
    new Ability(AbilityId.OWN_TEMPO, 3)
      .attr(BattlerTagImmunityAbAttr, BattlerTagType.CONFUSED)
      .attr(PostSummonRemoveBattlerTagAbAttr, BattlerTagType.CONFUSED)
      .attr(IntimidateImmunityAbAttr)
      .ignorable(),
    new Ability(AbilityId.SUCTION_CUPS, 3)
      .attr(ForceSwitchOutImmunityAbAttr)
      .ignorable(),
    new Ability(AbilityId.INTIMIDATE, 3)
      .attr(PostSummonStatStageChangeAbAttr, [ Stat.ATK ], -1, false, true),
    new Ability(AbilityId.SHADOW_TAG, 3)
      .attr(ArenaTrapAbAttr, (_user, target) => !target.hasAbility(AbilityId.SHADOW_TAG)),
    new Ability(AbilityId.ROUGH_SKIN, 3)
      .attr(PostDefendContactDamageAbAttr, 8)
      .bypassFaint(),
    new Ability(AbilityId.WONDER_GUARD, 3)
      .attr(NonSuperEffectiveImmunityAbAttr)
      .uncopiable()
      .ignorable(),
    new Ability(AbilityId.LEVITATE, 3)
      .attr(AttackTypeImmunityAbAttr, PokemonType.GROUND, (pokemon: Pokemon) => !pokemon.getTag(GroundedTag) && !globalScene.arena.getTag(ArenaTagType.GRAVITY))
      .ignorable(),
    new Ability(AbilityId.EFFECT_SPORE, 3)
      .attr(EffectSporeAbAttr),
    new Ability(AbilityId.SYNCHRONIZE, 3)
      .attr(SyncEncounterNatureAbAttr)
      .attr(SynchronizeStatusAbAttr),
    new Ability(AbilityId.CLEAR_BODY, 3)
      .attr(ProtectStatAbAttr)
      .ignorable(),
    new Ability(AbilityId.NATURAL_CURE, 3)
      .attr(PreSwitchOutResetStatusAbAttr),
    new Ability(AbilityId.LIGHTNING_ROD, 3)
      .attr(RedirectTypeMoveAbAttr, PokemonType.ELECTRIC)
      .attr(TypeImmunityStatStageChangeAbAttr, PokemonType.ELECTRIC, Stat.SPATK, 1)
      .ignorable(),
    new Ability(AbilityId.SERENE_GRACE, 3)
      .attr(MoveEffectChanceMultiplierAbAttr, 2),
    new Ability(AbilityId.SWIFT_SWIM, 3)
      .attr(StatMultiplierAbAttr, Stat.SPD, 2)
      .condition(getWeatherCondition(WeatherType.RAIN, WeatherType.HEAVY_RAIN)),
    new Ability(AbilityId.CHLOROPHYLL, 3)
      .attr(StatMultiplierAbAttr, Stat.SPD, 2)
      .condition(getWeatherCondition(WeatherType.SUNNY, WeatherType.HARSH_SUN)),
    new Ability(AbilityId.ILLUMINATE, 3)
      .attr(ProtectStatAbAttr, Stat.ACC)
      .attr(DoubleBattleChanceAbAttr)
      .attr(IgnoreOpponentStatStagesAbAttr, [ Stat.EVA ])
      .ignorable(),
    new Ability(AbilityId.TRACE, 3)
      .attr(PostSummonCopyAbilityAbAttr)
      .uncopiable(),
    new Ability(AbilityId.HUGE_POWER, 3)
      .attr(StatMultiplierAbAttr, Stat.ATK, 2),
    new Ability(AbilityId.POISON_POINT, 3)
      .attr(PostDefendContactApplyStatusEffectAbAttr, 30, StatusEffect.POISON)
      .bypassFaint(),
    new Ability(AbilityId.INNER_FOCUS, 3)
      .attr(BattlerTagImmunityAbAttr, BattlerTagType.FLINCHED)
      .attr(IntimidateImmunityAbAttr)
      .ignorable(),
    new Ability(AbilityId.MAGMA_ARMOR, 3)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.FREEZE)
      .attr(PostSummonHealStatusAbAttr, StatusEffect.FREEZE)
      .ignorable(),
    new Ability(AbilityId.WATER_VEIL, 3)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.BURN)
      .attr(PostSummonHealStatusAbAttr, StatusEffect.BURN)
      .ignorable(),
    new Ability(AbilityId.MAGNET_PULL, 3)
      .attr(ArenaTrapAbAttr, (_user, target) => {
        return target.getTypes(true).includes(PokemonType.STEEL) || (target.getTypes(true).includes(PokemonType.STELLAR) && target.getTypes().includes(PokemonType.STEEL));
      }),
    new Ability(AbilityId.SOUNDPROOF, 3)
      .attr(MoveImmunityAbAttr, (pokemon, attacker, move) => pokemon !== attacker && move.hasFlag(MoveFlags.SOUND_BASED))
      .ignorable(),
    new Ability(AbilityId.RAIN_DISH, 3)
      .attr(PostWeatherLapseHealAbAttr, 1, WeatherType.RAIN, WeatherType.HEAVY_RAIN),
    new Ability(AbilityId.SAND_STREAM, 3)
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.SANDSTORM)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.SANDSTORM),
    new Ability(AbilityId.PRESSURE, 3)
      .attr(IncreasePpAbAttr)
      .attr(PostSummonMessageAbAttr, (pokemon: Pokemon) => i18next.t("abilityTriggers:postSummonPressure", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) })),
    new Ability(AbilityId.THICK_FAT, 3)
      .attr(ReceivedTypeDamageMultiplierAbAttr, PokemonType.FIRE, 0.5)
      .attr(ReceivedTypeDamageMultiplierAbAttr, PokemonType.ICE, 0.5)
      .ignorable(),
    new Ability(AbilityId.EARLY_BIRD, 3)
      .attr(ReduceStatusEffectDurationAbAttr, StatusEffect.SLEEP),
    new Ability(AbilityId.FLAME_BODY, 3)
      .attr(PostDefendContactApplyStatusEffectAbAttr, 30, StatusEffect.BURN)
      .bypassFaint(),
    new Ability(AbilityId.RUN_AWAY, 3)
      .attr(RunSuccessAbAttr),
    new Ability(AbilityId.KEEN_EYE, 3)
      .attr(ProtectStatAbAttr, Stat.ACC)
      .ignorable(),
    new Ability(AbilityId.HYPER_CUTTER, 3)
      .attr(ProtectStatAbAttr, Stat.ATK)
      .ignorable(),
    new Ability(AbilityId.PICKUP, 3)
      .attr(PostBattleLootAbAttr)
      .unsuppressable(),
    new Ability(AbilityId.TRUANT, 3)
      .attr(PostSummonAddBattlerTagAbAttr, BattlerTagType.TRUANT, 1, false),
    new Ability(AbilityId.HUSTLE, 3)
      .attr(StatMultiplierAbAttr, Stat.ATK, 1.5)
      .attr(StatMultiplierAbAttr, Stat.ACC, 0.8, (_user, _target, move) => move.category === MoveCategory.PHYSICAL),
    new Ability(AbilityId.CUTE_CHARM, 3)
      .attr(PostDefendContactApplyTagChanceAbAttr, 30, BattlerTagType.INFATUATED),
    new Ability(AbilityId.PLUS, 3)
      .conditionalAttr(p => globalScene.currentBattle.double && [ AbilityId.PLUS, AbilityId.MINUS ].some(a => (p.getAlly()?.hasAbility(a) ?? false)), StatMultiplierAbAttr, Stat.SPATK, 1.5),
    new Ability(AbilityId.MINUS, 3)
      .conditionalAttr(p => globalScene.currentBattle.double && [ AbilityId.PLUS, AbilityId.MINUS ].some(a => (p.getAlly()?.hasAbility(a) ?? false)), StatMultiplierAbAttr, Stat.SPATK, 1.5),
    new Ability(AbilityId.FORECAST, 3, -2)
      .uncopiable()
      .unreplaceable()
      .attr(NoFusionAbilityAbAttr)
      .attr(PostSummonFormChangeByWeatherAbAttr, AbilityId.FORECAST)
      .attr(PostWeatherChangeFormChangeAbAttr, AbilityId.FORECAST, [ WeatherType.NONE, WeatherType.SANDSTORM, WeatherType.STRONG_WINDS, WeatherType.FOG ]),
    new Ability(AbilityId.STICKY_HOLD, 3)
      .attr(BlockItemTheftAbAttr)
      .bypassFaint()
      .ignorable(),
    new Ability(AbilityId.SHED_SKIN, 3)
      .conditionalAttr(_pokemon => !randSeedInt(3), PostTurnResetStatusAbAttr),
    new Ability(AbilityId.GUTS, 3)
      .attr(BypassBurnDamageReductionAbAttr)
      .conditionalAttr(pokemon => !!pokemon.status || pokemon.hasAbility(AbilityId.COMATOSE), StatMultiplierAbAttr, Stat.ATK, 1.5),
    new Ability(AbilityId.MARVEL_SCALE, 3)
      .conditionalAttr(pokemon => !!pokemon.status || pokemon.hasAbility(AbilityId.COMATOSE), StatMultiplierAbAttr, Stat.DEF, 1.5)
      .ignorable(),
    new Ability(AbilityId.LIQUID_OOZE, 3)
      .attr(ReverseDrainAbAttr),
    new Ability(AbilityId.OVERGROW, 3)
      .attr(LowHpMoveTypePowerBoostAbAttr, PokemonType.GRASS),
    new Ability(AbilityId.BLAZE, 3)
      .attr(LowHpMoveTypePowerBoostAbAttr, PokemonType.FIRE),
    new Ability(AbilityId.TORRENT, 3)
      .attr(LowHpMoveTypePowerBoostAbAttr, PokemonType.WATER),
    new Ability(AbilityId.SWARM, 3)
      .attr(LowHpMoveTypePowerBoostAbAttr, PokemonType.BUG),
    new Ability(AbilityId.ROCK_HEAD, 3)
      .attr(BlockRecoilDamageAttr),
    new Ability(AbilityId.DROUGHT, 3)
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.SUNNY)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.SUNNY),
    new Ability(AbilityId.ARENA_TRAP, 3)
      .attr(ArenaTrapAbAttr, (_user, target) => target.isGrounded())
      .attr(DoubleBattleChanceAbAttr),
    new Ability(AbilityId.VITAL_SPIRIT, 3)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.SLEEP)
      .attr(PostSummonHealStatusAbAttr, StatusEffect.SLEEP)
      .attr(BattlerTagImmunityAbAttr, BattlerTagType.DROWSY)
      .ignorable(),
    new Ability(AbilityId.WHITE_SMOKE, 3)
      .attr(ProtectStatAbAttr)
      .ignorable(),
    new Ability(AbilityId.PURE_POWER, 3)
      .attr(StatMultiplierAbAttr, Stat.ATK, 2),
    new Ability(AbilityId.SHELL_ARMOR, 3)
      .attr(BlockCritAbAttr)
      .ignorable(),
    new Ability(AbilityId.AIR_LOCK, 3)
      .attr(SuppressWeatherEffectAbAttr, true)
      .attr(PostSummonUnnamedMessageAbAttr, i18next.t("abilityTriggers:weatherEffectDisappeared"))
      .attr(PostSummonWeatherSuppressedFormChangeAbAttr)
      .attr(PostFaintUnsuppressedWeatherFormChangeAbAttr)
      .bypassFaint(),
    new Ability(AbilityId.TANGLED_FEET, 4)
      .conditionalAttr(pokemon => !!pokemon.getTag(BattlerTagType.CONFUSED), StatMultiplierAbAttr, Stat.EVA, 2)
      .ignorable(),
    new Ability(AbilityId.MOTOR_DRIVE, 4)
      .attr(TypeImmunityStatStageChangeAbAttr, PokemonType.ELECTRIC, Stat.SPD, 1)
      .ignorable(),
    new Ability(AbilityId.RIVALRY, 4)
      .attr(MovePowerBoostAbAttr, (user, target, _move) => user?.gender !== Gender.GENDERLESS && target?.gender !== Gender.GENDERLESS && user?.gender === target?.gender, 1.25, true)
      .attr(MovePowerBoostAbAttr, (user, target, _move) => user?.gender !== Gender.GENDERLESS && target?.gender !== Gender.GENDERLESS && user?.gender !== target?.gender, 0.75),
    new Ability(AbilityId.STEADFAST, 4)
      .attr(FlinchStatStageChangeAbAttr, [ Stat.SPD ], 1),
    new Ability(AbilityId.SNOW_CLOAK, 4)
      .attr(StatMultiplierAbAttr, Stat.EVA, 1.2)
      .attr(BlockWeatherDamageAttr, WeatherType.HAIL)
      .condition(getWeatherCondition(WeatherType.HAIL, WeatherType.SNOW))
      .ignorable(),
    new Ability(AbilityId.GLUTTONY, 4)
      .attr(ReduceBerryUseThresholdAbAttr),
    new Ability(AbilityId.ANGER_POINT, 4)
      .attr(PostReceiveCritStatStageChangeAbAttr, Stat.ATK, 12),
    new Ability(AbilityId.UNBURDEN, 4)
      .attr(PostItemLostApplyBattlerTagAbAttr, BattlerTagType.UNBURDEN)
      .bypassFaint() // Allows reviver seed to activate Unburden
      .edgeCase(), // Should not restore Unburden boost if Pokemon loses then regains Unburden ability
    new Ability(AbilityId.HEATPROOF, 4)
      .attr(ReceivedTypeDamageMultiplierAbAttr, PokemonType.FIRE, 0.5)
      .attr(ReduceBurnDamageAbAttr, 0.5)
      .ignorable(),
    new Ability(AbilityId.SIMPLE, 4)
      .attr(StatStageChangeMultiplierAbAttr, 2)
      .ignorable(),
    new Ability(AbilityId.DRY_SKIN, 4)
      .attr(PostWeatherLapseDamageAbAttr, 2, WeatherType.SUNNY, WeatherType.HARSH_SUN)
      .attr(PostWeatherLapseHealAbAttr, 2, WeatherType.RAIN, WeatherType.HEAVY_RAIN)
      .attr(ReceivedTypeDamageMultiplierAbAttr, PokemonType.FIRE, 1.25)
      .attr(TypeImmunityHealAbAttr, PokemonType.WATER)
      .ignorable(),
    new Ability(AbilityId.DOWNLOAD, 4)
      .attr(DownloadAbAttr),
    new Ability(AbilityId.IRON_FIST, 4)
      .attr(MovePowerBoostAbAttr, (_user, _target, move) => move.hasFlag(MoveFlags.PUNCHING_MOVE), 1.2),
    new Ability(AbilityId.POISON_HEAL, 4)
      .attr(PostTurnStatusHealAbAttr, StatusEffect.TOXIC, StatusEffect.POISON)
      .attr(BlockStatusDamageAbAttr, StatusEffect.TOXIC, StatusEffect.POISON),
    new Ability(AbilityId.ADAPTABILITY, 4)
      .attr(StabBoostAbAttr),
    new Ability(AbilityId.SKILL_LINK, 4)
      .attr(MaxMultiHitAbAttr),
    new Ability(AbilityId.HYDRATION, 4)
      .attr(PostTurnResetStatusAbAttr)
      .condition(getWeatherCondition(WeatherType.RAIN, WeatherType.HEAVY_RAIN)),
    new Ability(AbilityId.SOLAR_POWER, 4)
      .attr(PostWeatherLapseDamageAbAttr, 2, WeatherType.SUNNY, WeatherType.HARSH_SUN)
      .attr(StatMultiplierAbAttr, Stat.SPATK, 1.5)
      .condition(getWeatherCondition(WeatherType.SUNNY, WeatherType.HARSH_SUN)),
    new Ability(AbilityId.QUICK_FEET, 4)
      .conditionalAttr(pokemon => pokemon.status ? pokemon.status.effect === StatusEffect.PARALYSIS : false, StatMultiplierAbAttr, Stat.SPD, 2)
      .conditionalAttr(pokemon => !!pokemon.status || pokemon.hasAbility(AbilityId.COMATOSE), StatMultiplierAbAttr, Stat.SPD, 1.5),
    new Ability(AbilityId.NORMALIZE, 4)
      .attr(MoveTypeChangeAbAttr, PokemonType.NORMAL, 1.2),
    new Ability(AbilityId.SNIPER, 4)
      .attr(MultCritAbAttr, 1.5),
    new Ability(AbilityId.MAGIC_GUARD, 4)
      .attr(BlockNonDirectDamageAbAttr),
    new Ability(AbilityId.NO_GUARD, 4)
      .attr(AlwaysHitAbAttr)
      .attr(DoubleBattleChanceAbAttr),
    new Ability(AbilityId.STALL, 4)
      .attr(ChangeMovePriorityAbAttr, (_pokemon, _move: Move) => true, -0.2),
    new Ability(AbilityId.TECHNICIAN, 4)
      .attr(MovePowerBoostAbAttr, (user, target, move) => {
        const power = new NumberHolder(move.power);
        applyMoveAttrs("VariablePowerAttr", user, target, move, power);
        return power.value <= 60;
      }, 1.5),
    new Ability(AbilityId.LEAF_GUARD, 4)
      .attr(StatusEffectImmunityAbAttr)
      .condition(getWeatherCondition(WeatherType.SUNNY, WeatherType.HARSH_SUN))
      .ignorable(),
    new Ability(AbilityId.KLUTZ, 4, 1)
      .unimplemented(),
    new Ability(AbilityId.MOLD_BREAKER, 4)
      .attr(PostSummonMessageAbAttr, (pokemon: Pokemon) => i18next.t("abilityTriggers:postSummonMoldBreaker", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }))
      .attr(MoveAbilityBypassAbAttr),
    new Ability(AbilityId.SUPER_LUCK, 4)
      .attr(BonusCritAbAttr),
    new Ability(AbilityId.AFTERMATH, 4)
      .attr(PostFaintContactDamageAbAttr, 4)
      .bypassFaint(),
    new Ability(AbilityId.ANTICIPATION, 4)
      .conditionalAttr(getAnticipationCondition(), PostSummonMessageAbAttr, (pokemon: Pokemon) => i18next.t("abilityTriggers:postSummonAnticipation", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) })),
    new Ability(AbilityId.FOREWARN, 4)
      .attr(ForewarnAbAttr),
    new Ability(AbilityId.UNAWARE, 4)
      .attr(IgnoreOpponentStatStagesAbAttr, [ Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.ACC, Stat.EVA ])
      .ignorable(),
    new Ability(AbilityId.TINTED_LENS, 4)
      .attr(DamageBoostAbAttr, 2, (user, target, move) => (target?.getMoveEffectiveness(user!, move) ?? 1) <= 0.5),
    new Ability(AbilityId.FILTER, 4)
      .attr(ReceivedMoveDamageMultiplierAbAttr, (target, user, move) => target.getMoveEffectiveness(user, move) >= 2, 0.75)
      .ignorable(),
    new Ability(AbilityId.SLOW_START, 4)
      .attr(PostSummonAddBattlerTagAbAttr, BattlerTagType.SLOW_START, 5),
    new Ability(AbilityId.SCRAPPY, 4)
      .attr(IgnoreTypeImmunityAbAttr, PokemonType.GHOST, [ PokemonType.NORMAL, PokemonType.FIGHTING ])
      .attr(IntimidateImmunityAbAttr),
    new Ability(AbilityId.STORM_DRAIN, 4)
      .attr(RedirectTypeMoveAbAttr, PokemonType.WATER)
      .attr(TypeImmunityStatStageChangeAbAttr, PokemonType.WATER, Stat.SPATK, 1)
      .ignorable(),
    new Ability(AbilityId.ICE_BODY, 4)
      .attr(BlockWeatherDamageAttr, WeatherType.HAIL)
      .attr(PostWeatherLapseHealAbAttr, 1, WeatherType.HAIL, WeatherType.SNOW),
    new Ability(AbilityId.SOLID_ROCK, 4)
      .attr(ReceivedMoveDamageMultiplierAbAttr, (target, user, move) => target.getMoveEffectiveness(user, move) >= 2, 0.75)
      .ignorable(),
    new Ability(AbilityId.SNOW_WARNING, 4)
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.SNOW)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.SNOW),
    new Ability(AbilityId.HONEY_GATHER, 4)
      .attr(MoneyAbAttr)
      .unsuppressable(),
    new Ability(AbilityId.FRISK, 4)
      .attr(FriskAbAttr),
    new Ability(AbilityId.RECKLESS, 4)
      .attr(MovePowerBoostAbAttr, (_user, _target, move) => move.hasFlag(MoveFlags.RECKLESS_MOVE), 1.2),
    new Ability(AbilityId.MULTITYPE, 4)
      .attr(NoFusionAbilityAbAttr)
      .uncopiable()
      .unsuppressable()
      .unreplaceable(),
    new Ability(AbilityId.FLOWER_GIFT, 4, -2)
      .conditionalAttr(getWeatherCondition(WeatherType.SUNNY || WeatherType.HARSH_SUN), StatMultiplierAbAttr, Stat.ATK, 1.5)
      .conditionalAttr(getWeatherCondition(WeatherType.SUNNY || WeatherType.HARSH_SUN), StatMultiplierAbAttr, Stat.SPDEF, 1.5)
      .conditionalAttr(getWeatherCondition(WeatherType.SUNNY || WeatherType.HARSH_SUN), AllyStatMultiplierAbAttr, Stat.ATK, 1.5)
      .conditionalAttr(getWeatherCondition(WeatherType.SUNNY || WeatherType.HARSH_SUN), AllyStatMultiplierAbAttr, Stat.SPDEF, 1.5)
      .attr(NoFusionAbilityAbAttr)
      .attr(PostSummonFormChangeByWeatherAbAttr, AbilityId.FLOWER_GIFT)
      .attr(PostWeatherChangeFormChangeAbAttr, AbilityId.FLOWER_GIFT, [ WeatherType.NONE, WeatherType.SANDSTORM, WeatherType.STRONG_WINDS, WeatherType.FOG, WeatherType.HAIL, WeatherType.HEAVY_RAIN, WeatherType.SNOW, WeatherType.RAIN ])
      .uncopiable()
      .unreplaceable()
      .ignorable(),
    new Ability(AbilityId.BAD_DREAMS, 4)
      .attr(PostTurnHurtIfSleepingAbAttr),
    new Ability(AbilityId.PICKPOCKET, 5)
      .attr(PostDefendStealHeldItemAbAttr, (target, user, move) => move.doesFlagEffectApply({flag: MoveFlags.MAKES_CONTACT, user, target}))
      .condition(getSheerForceHitDisableAbCondition()),
    new Ability(AbilityId.SHEER_FORCE, 5)
      .attr(MovePowerBoostAbAttr, (_user, _target, move) => move.chance >= 1, 1.3)
      .attr(MoveEffectChanceMultiplierAbAttr, 0), // This attribute does not seem to function - Should disable life orb, eject button, red card, kee/maranga berry if they get implemented
    new Ability(AbilityId.CONTRARY, 5)
      .attr(StatStageChangeMultiplierAbAttr, -1)
      .ignorable(),
    new Ability(AbilityId.UNNERVE, 5, 1)
      .attr(PreventBerryUseAbAttr),
    new Ability(AbilityId.DEFIANT, 5)
      .attr(PostStatStageChangeStatStageChangeAbAttr, (_target, _statsChanged, stages) => stages < 0, [ Stat.ATK ], 2),
    new Ability(AbilityId.DEFEATIST, 5)
      .attr(StatMultiplierAbAttr, Stat.ATK, 0.5)
      .attr(StatMultiplierAbAttr, Stat.SPATK, 0.5)
      .condition((pokemon) => pokemon.getHpRatio() <= 0.5),
    new Ability(AbilityId.CURSED_BODY, 5)
      .attr(PostDefendMoveDisableAbAttr, 30)
      .bypassFaint(),
    new Ability(AbilityId.HEALER, 5)
      .conditionalAttr(pokemon => !isNullOrUndefined(pokemon.getAlly()) && randSeedInt(10) < 3, PostTurnResetStatusAbAttr, true),
    new Ability(AbilityId.FRIEND_GUARD, 5)
      .attr(AlliedFieldDamageReductionAbAttr, 0.75)
      .ignorable(),
    new Ability(AbilityId.WEAK_ARMOR, 5)
      .attr(PostDefendStatStageChangeAbAttr, (_target, _user, move) => move.category === MoveCategory.PHYSICAL, Stat.DEF, -1)
      .attr(PostDefendStatStageChangeAbAttr, (_target, _user, move) => move.category === MoveCategory.PHYSICAL, Stat.SPD, 2),
    new Ability(AbilityId.HEAVY_METAL, 5)
      .attr(WeightMultiplierAbAttr, 2)
      .ignorable(),
    new Ability(AbilityId.LIGHT_METAL, 5)
      .attr(WeightMultiplierAbAttr, 0.5)
      .ignorable(),
    new Ability(AbilityId.MULTISCALE, 5)
      .attr(ReceivedMoveDamageMultiplierAbAttr, (target, _user, _move) => target.isFullHp(), 0.5)
      .ignorable(),
    new Ability(AbilityId.TOXIC_BOOST, 5)
      .attr(MovePowerBoostAbAttr, (user, _target, move) => move.category === MoveCategory.PHYSICAL && (user?.status?.effect === StatusEffect.POISON || user?.status?.effect === StatusEffect.TOXIC), 1.5),
    new Ability(AbilityId.FLARE_BOOST, 5)
      .attr(MovePowerBoostAbAttr, (user, _target, move) => move.category === MoveCategory.SPECIAL && user?.status?.effect === StatusEffect.BURN, 1.5),
    new Ability(AbilityId.HARVEST, 5)
      .attr(
        PostTurnRestoreBerryAbAttr,
        /** Rate is doubled when under sun {@link https://dex.pokemonshowdown.com/abilities/harvest} */
        (pokemon) => 0.5 * (getWeatherCondition(WeatherType.SUNNY, WeatherType.HARSH_SUN)(pokemon) ? 2 : 1)
      )
      .edgeCase(), // Cannot recover berries used up by fling or natural gift (unimplemented)
    new Ability(AbilityId.TELEPATHY, 5)
      .attr(MoveImmunityAbAttr, (pokemon, attacker, move) => pokemon.getAlly() === attacker && move.is("AttackMove"))
      .ignorable(),
    new Ability(AbilityId.MOODY, 5)
      .attr(MoodyAbAttr),
    new Ability(AbilityId.OVERCOAT, 5)
      .attr(BlockWeatherDamageAttr)
      .attr(MoveImmunityAbAttr, (pokemon, attacker, move) => pokemon !== attacker && move.hasFlag(MoveFlags.POWDER_MOVE))
      .ignorable(),
    new Ability(AbilityId.POISON_TOUCH, 5)
      .attr(PostAttackContactApplyStatusEffectAbAttr, 30, StatusEffect.POISON),
    new Ability(AbilityId.REGENERATOR, 5)
      .attr(PreSwitchOutHealAbAttr),
    new Ability(AbilityId.BIG_PECKS, 5)
      .attr(ProtectStatAbAttr, Stat.DEF)
      .ignorable(),
    new Ability(AbilityId.SAND_RUSH, 5)
      .attr(StatMultiplierAbAttr, Stat.SPD, 2)
      .attr(BlockWeatherDamageAttr, WeatherType.SANDSTORM)
      .condition(getWeatherCondition(WeatherType.SANDSTORM)),
    new Ability(AbilityId.WONDER_SKIN, 5)
      .attr(WonderSkinAbAttr)
      .ignorable(),
    new Ability(AbilityId.ANALYTIC, 5)
      .attr(MovePowerBoostAbAttr, (user) =>
        // Boost power if all other Pokemon have already moved (no other moves are slated to execute)
        !globalScene.phaseManager.findPhase((phase) => phase.is("MovePhase") && phase.pokemon.id !== user?.id),
        1.3),
    new Ability(AbilityId.ILLUSION, 5)
      // The Pokemon generate an illusion if it's available
      .attr(IllusionPreSummonAbAttr, false)
      .attr(IllusionBreakAbAttr)
      // The Pokemon loses its illusion when damaged by a move
      .attr(PostDefendIllusionBreakAbAttr, true)
      // Disable Illusion in fusions
      .attr(NoFusionAbilityAbAttr)
      // Illusion is available again after a battle
      .conditionalAttr((pokemon) => pokemon.isAllowedInBattle(), IllusionPostBattleAbAttr, false)
      .uncopiable()
      .bypassFaint(),
    new Ability(AbilityId.IMPOSTER, 5)
      .attr(PostSummonTransformAbAttr)
      .uncopiable()
      .edgeCase(), // Should copy rage fist hit count, etc (see Transform edge case for full list)
    new Ability(AbilityId.INFILTRATOR, 5)
      .attr(InfiltratorAbAttr)
      .partial(), // does not bypass Mist
    new Ability(AbilityId.MUMMY, 5)
      .attr(PostDefendAbilityGiveAbAttr, AbilityId.MUMMY)
      .bypassFaint(),
    new Ability(AbilityId.MOXIE, 5)
      .attr(PostVictoryStatStageChangeAbAttr, Stat.ATK, 1),
    new Ability(AbilityId.JUSTIFIED, 5)
      .attr(PostDefendStatStageChangeAbAttr, (_target, user, move) => user.getMoveType(move) === PokemonType.DARK && move.category !== MoveCategory.STATUS, Stat.ATK, 1),
    new Ability(AbilityId.RATTLED, 5)
      .attr(PostDefendStatStageChangeAbAttr, (_target, user, move) => {
        const moveType = user.getMoveType(move);
        return move.category !== MoveCategory.STATUS
          && (moveType === PokemonType.DARK || moveType === PokemonType.BUG || moveType === PokemonType.GHOST);
      }, Stat.SPD, 1)
      .attr(PostIntimidateStatStageChangeAbAttr, [ Stat.SPD ], 1),
    new Ability(AbilityId.MAGIC_BOUNCE, 5)
      .attr(ReflectStatusMoveAbAttr)
      .ignorable()
      // Interactions with stomping tantrum, instruct, encore, and probably other moves that
      // rely on move history
      .edgeCase(),
    new Ability(AbilityId.SAP_SIPPER, 5)
      .attr(TypeImmunityStatStageChangeAbAttr, PokemonType.GRASS, Stat.ATK, 1)
      .ignorable(),
    new Ability(AbilityId.PRANKSTER, 5)
      .attr(ChangeMovePriorityAbAttr, (_pokemon, move: Move) => move.category === MoveCategory.STATUS, 1),
    new Ability(AbilityId.SAND_FORCE, 5)
      .attr(MoveTypePowerBoostAbAttr, PokemonType.ROCK, 1.3)
      .attr(MoveTypePowerBoostAbAttr, PokemonType.GROUND, 1.3)
      .attr(MoveTypePowerBoostAbAttr, PokemonType.STEEL, 1.3)
      .attr(BlockWeatherDamageAttr, WeatherType.SANDSTORM)
      .condition(getWeatherCondition(WeatherType.SANDSTORM)),
    new Ability(AbilityId.IRON_BARBS, 5)
      .attr(PostDefendContactDamageAbAttr, 8)
      .bypassFaint(),
    new Ability(AbilityId.ZEN_MODE, 5)
      .attr(PostBattleInitFormChangeAbAttr, () => 0)
      .attr(PostSummonFormChangeAbAttr, p => p.getHpRatio() <= 0.5 ? 1 : 0)
      .attr(PostTurnFormChangeAbAttr, p => p.getHpRatio() <= 0.5 ? 1 : 0)
      .attr(NoFusionAbilityAbAttr)
      .uncopiable()
      .unreplaceable()
      .unsuppressable()
      .bypassFaint(),
    new Ability(AbilityId.VICTORY_STAR, 5)
      .attr(StatMultiplierAbAttr, Stat.ACC, 1.1)
      .attr(AllyStatMultiplierAbAttr, Stat.ACC, 1.1, false),
    new Ability(AbilityId.TURBOBLAZE, 5)
      .attr(PostSummonMessageAbAttr, (pokemon: Pokemon) => i18next.t("abilityTriggers:postSummonTurboblaze", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }))
      .attr(MoveAbilityBypassAbAttr),
    new Ability(AbilityId.TERAVOLT, 5)
      .attr(PostSummonMessageAbAttr, (pokemon: Pokemon) => i18next.t("abilityTriggers:postSummonTeravolt", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }))
      .attr(MoveAbilityBypassAbAttr),
    new Ability(AbilityId.AROMA_VEIL, 6)
      .attr(UserFieldBattlerTagImmunityAbAttr, [ BattlerTagType.INFATUATED, BattlerTagType.TAUNT, BattlerTagType.DISABLED, BattlerTagType.TORMENT, BattlerTagType.HEAL_BLOCK ])
      .ignorable(),
    new Ability(AbilityId.FLOWER_VEIL, 6)
      .attr(ConditionalUserFieldStatusEffectImmunityAbAttr, (target: Pokemon, source: Pokemon | null) => {
        return source ? target.getTypes().includes(PokemonType.GRASS) && target.id !== source.id : false;
      })
      .attr(ConditionalUserFieldBattlerTagImmunityAbAttr,
        (target: Pokemon) => {
          return target.getTypes().includes(PokemonType.GRASS);
        },
        [ BattlerTagType.DROWSY ],
      )
      .attr(ConditionalUserFieldProtectStatAbAttr, (target: Pokemon) => {
        return target.getTypes().includes(PokemonType.GRASS);
      })
      .ignorable(),
    new Ability(AbilityId.CHEEK_POUCH, 6)
      .attr(HealFromBerryUseAbAttr, 1 / 3),
    new Ability(AbilityId.PROTEAN, 6)
      .attr(PokemonTypeChangeAbAttr)
      // .condition((p) => !p.summonData.abilitiesApplied.includes(AbilityId.PROTEAN)) //Gen 9 Implementation
      // TODO: needs testing on interaction with weather blockage
      .edgeCase(),
    new Ability(AbilityId.FUR_COAT, 6)
      .attr(ReceivedMoveDamageMultiplierAbAttr, (_target, _user, move) => move.category === MoveCategory.PHYSICAL, 0.5)
      .ignorable(),
    new Ability(AbilityId.MAGICIAN, 6)
      .attr(PostAttackStealHeldItemAbAttr),
    new Ability(AbilityId.BULLETPROOF, 6)
      .attr(MoveImmunityAbAttr, (pokemon, attacker, move) => pokemon !== attacker && move.hasFlag(MoveFlags.BALLBOMB_MOVE))
      .ignorable(),
    new Ability(AbilityId.COMPETITIVE, 6)
      .attr(PostStatStageChangeStatStageChangeAbAttr, (_target, _statsChanged, stages) => stages < 0, [ Stat.SPATK ], 2),
    new Ability(AbilityId.STRONG_JAW, 6)
      .attr(MovePowerBoostAbAttr, (_user, _target, move) => move.hasFlag(MoveFlags.BITING_MOVE), 1.5),
    new Ability(AbilityId.REFRIGERATE, 6)
      .attr(MoveTypeChangeAbAttr, PokemonType.ICE, 1.2, (_user, _target, move) => move.type === PokemonType.NORMAL),
    new Ability(AbilityId.SWEET_VEIL, 6)
      .attr(UserFieldStatusEffectImmunityAbAttr, StatusEffect.SLEEP)
      .attr(PostSummonUserFieldRemoveStatusEffectAbAttr, StatusEffect.SLEEP)
      .attr(UserFieldBattlerTagImmunityAbAttr, BattlerTagType.DROWSY)
      .ignorable()
      .partial(), // Mold Breaker ally should not be affected by Sweet Veil
    new Ability(AbilityId.STANCE_CHANGE, 6)
      .attr(NoFusionAbilityAbAttr)
      .uncopiable()
      .unreplaceable()
      .unsuppressable(),
    new Ability(AbilityId.GALE_WINGS, 6)
      .attr(ChangeMovePriorityAbAttr, (pokemon, move) => pokemon.isFullHp() && pokemon.getMoveType(move) === PokemonType.FLYING, 1),
    new Ability(AbilityId.MEGA_LAUNCHER, 6)
      .attr(MovePowerBoostAbAttr, (_user, _target, move) => move.hasFlag(MoveFlags.PULSE_MOVE), 1.5),
    new Ability(AbilityId.GRASS_PELT, 6)
      .conditionalAttr(getTerrainCondition(TerrainType.GRASSY), StatMultiplierAbAttr, Stat.DEF, 1.5)
      .ignorable(),
    new Ability(AbilityId.SYMBIOSIS, 6)
      .unimplemented(),
    new Ability(AbilityId.TOUGH_CLAWS, 6)
      .attr(MovePowerBoostAbAttr, (_user, _target, move) => move.hasFlag(MoveFlags.MAKES_CONTACT), 1.3),
    new Ability(AbilityId.PIXILATE, 6)
      .attr(MoveTypeChangeAbAttr, PokemonType.FAIRY, 1.2, (_user, _target, move) => move.type === PokemonType.NORMAL),
    new Ability(AbilityId.GOOEY, 6)
      .attr(PostDefendStatStageChangeAbAttr, (_target, _user, move) => move.hasFlag(MoveFlags.MAKES_CONTACT), Stat.SPD, -1, false),
    new Ability(AbilityId.AERILATE, 6)
      .attr(MoveTypeChangeAbAttr, PokemonType.FLYING, 1.2, (_user, _target, move) => move.type === PokemonType.NORMAL),
    new Ability(AbilityId.PARENTAL_BOND, 6)
      .attr(AddSecondStrikeAbAttr, 0.25),
    new Ability(AbilityId.DARK_AURA, 6)
      .attr(PostSummonMessageAbAttr, (pokemon: Pokemon) => i18next.t("abilityTriggers:postSummonDarkAura", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }))
      .attr(FieldMoveTypePowerBoostAbAttr, PokemonType.DARK, 4 / 3),
    new Ability(AbilityId.FAIRY_AURA, 6)
      .attr(PostSummonMessageAbAttr, (pokemon: Pokemon) => i18next.t("abilityTriggers:postSummonFairyAura", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }))
      .attr(FieldMoveTypePowerBoostAbAttr, PokemonType.FAIRY, 4 / 3),
    new Ability(AbilityId.AURA_BREAK, 6)
      .ignorable()
      .conditionalAttr(_pokemon => globalScene.getField(true).some(p => p.hasAbility(AbilityId.DARK_AURA)), FieldMoveTypePowerBoostAbAttr, PokemonType.DARK, 9 / 16)
      .conditionalAttr(_pokemon => globalScene.getField(true).some(p => p.hasAbility(AbilityId.FAIRY_AURA)), FieldMoveTypePowerBoostAbAttr, PokemonType.FAIRY, 9 / 16)
      .conditionalAttr(_pokemon => globalScene.getField(true).some(p => p.hasAbility(AbilityId.DARK_AURA) || p.hasAbility(AbilityId.FAIRY_AURA)),
        PostSummonMessageAbAttr, (pokemon: Pokemon) => i18next.t("abilityTriggers:postSummonAuraBreak", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) })),
    new Ability(AbilityId.PRIMORDIAL_SEA, 6)
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.HEAVY_RAIN)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.HEAVY_RAIN)
      .attr(PreLeaveFieldClearWeatherAbAttr)
      .bypassFaint(),
    new Ability(AbilityId.DESOLATE_LAND, 6)
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.HARSH_SUN)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.HARSH_SUN)
      .attr(PreLeaveFieldClearWeatherAbAttr)
      .bypassFaint(),
    new Ability(AbilityId.DELTA_STREAM, 6)
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.STRONG_WINDS)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.STRONG_WINDS)
      .attr(PreLeaveFieldClearWeatherAbAttr)
      .bypassFaint(),
    new Ability(AbilityId.STAMINA, 7)
      .attr(PostDefendStatStageChangeAbAttr, (_target, _user, move) => move.category !== MoveCategory.STATUS, Stat.DEF, 1),
    new Ability(AbilityId.WIMP_OUT, 7)
      .attr(PostDamageForceSwitchAbAttr)
      .edgeCase(), // Should not trigger when hurting itself in confusion, causes Fake Out to fail turn 1 and succeed turn 2 if pokemon is switched out before battle start via playing in Switch Mode
    new Ability(AbilityId.EMERGENCY_EXIT, 7)
      .attr(PostDamageForceSwitchAbAttr)
      .edgeCase(), // Should not trigger when hurting itself in confusion, causes Fake Out to fail turn 1 and succeed turn 2 if pokemon is switched out before battle start via playing in Switch Mode
    new Ability(AbilityId.WATER_COMPACTION, 7)
      .attr(PostDefendStatStageChangeAbAttr, (_target, user, move) => user.getMoveType(move) === PokemonType.WATER && move.category !== MoveCategory.STATUS, Stat.DEF, 2),
    new Ability(AbilityId.MERCILESS, 7)
      .attr(ConditionalCritAbAttr, (_user, target, _move) => target?.status?.effect === StatusEffect.TOXIC || target?.status?.effect === StatusEffect.POISON),
    new Ability(AbilityId.SHIELDS_DOWN, 7, -1)
      // Change into Meteor Form on switch-in or turn end if HP >= 50%,
      // or Core Form if HP <= 50%.
      .attr(PostBattleInitFormChangeAbAttr, p => p.formIndex % 7)
      .attr(PostSummonFormChangeAbAttr, p => p.formIndex % 7 + (p.getHpRatio() <= 0.5 ? 7 : 0))
      .attr(PostTurnFormChangeAbAttr, p => p.formIndex % 7 + (p.getHpRatio() <= 0.5 ? 7 : 0))
      // All variants of Meteor Form are immune to status effects & Yawn
      .conditionalAttr(p => p.formIndex < 7, StatusEffectImmunityAbAttr)
      .conditionalAttr(p => p.formIndex < 7, BattlerTagImmunityAbAttr, BattlerTagType.DROWSY)
      .attr(NoFusionAbilityAbAttr)
      .attr(NoTransformAbilityAbAttr)
      .uncopiable()
      .unreplaceable()
      .unsuppressable()
      .bypassFaint(),
    new Ability(AbilityId.STAKEOUT, 7)
      .attr(MovePowerBoostAbAttr, (_user, target, _move) => !!target?.turnData.switchedInThisTurn, 2),
    new Ability(AbilityId.WATER_BUBBLE, 7)
      .attr(ReceivedTypeDamageMultiplierAbAttr, PokemonType.FIRE, 0.5)
      .attr(MoveTypePowerBoostAbAttr, PokemonType.WATER, 2)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.BURN)
      .attr(PostSummonHealStatusAbAttr, StatusEffect.BURN)
      .ignorable(),
    new Ability(AbilityId.STEELWORKER, 7)
      .attr(MoveTypePowerBoostAbAttr, PokemonType.STEEL),
    new Ability(AbilityId.BERSERK, 7)
      .attr(PostDefendHpGatedStatStageChangeAbAttr, (_target, _user, move) => move.category !== MoveCategory.STATUS, 0.5, [ Stat.SPATK ], 1)
      .condition(getSheerForceHitDisableAbCondition()),
    new Ability(AbilityId.SLUSH_RUSH, 7)
      .attr(StatMultiplierAbAttr, Stat.SPD, 2)
      .condition(getWeatherCondition(WeatherType.HAIL, WeatherType.SNOW)),
    new Ability(AbilityId.LONG_REACH, 7)
      .attr(IgnoreContactAbAttr),
    new Ability(AbilityId.LIQUID_VOICE, 7)
      .attr(MoveTypeChangeAbAttr, PokemonType.WATER, 1, (_user, _target, move) => move.hasFlag(MoveFlags.SOUND_BASED)),
    new Ability(AbilityId.TRIAGE, 7)
      .attr(ChangeMovePriorityAbAttr, (_pokemon, move) => move.hasFlag(MoveFlags.TRIAGE_MOVE), 3),
    new Ability(AbilityId.GALVANIZE, 7)
      .attr(MoveTypeChangeAbAttr, PokemonType.ELECTRIC, 1.2, (_user, _target, move) => move.type === PokemonType.NORMAL),
    new Ability(AbilityId.SURGE_SURFER, 7)
      .conditionalAttr(getTerrainCondition(TerrainType.ELECTRIC), StatMultiplierAbAttr, Stat.SPD, 2),
    new Ability(AbilityId.SCHOOLING, 7, -1)
      .attr(PostBattleInitFormChangeAbAttr, () => 0)
      .attr(PostSummonFormChangeAbAttr, p => p.level < 20 || p.getHpRatio() <= 0.25 ? 0 : 1)
      .attr(PostTurnFormChangeAbAttr, p => p.level < 20 || p.getHpRatio() <= 0.25 ? 0 : 1)
      .attr(NoFusionAbilityAbAttr)
      .uncopiable()
      .unreplaceable()
      .unsuppressable()
      .bypassFaint(),
    new Ability(AbilityId.DISGUISE, 7)
      .attr(NoTransformAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr)
      // Add BattlerTagType.DISGUISE if the pokemon is in its disguised form
      .conditionalAttr(pokemon => pokemon.formIndex === 0, PostSummonAddBattlerTagAbAttr, BattlerTagType.DISGUISE, 0, false)
      .attr(FormBlockDamageAbAttr,
        (target, user, move) => !!target.getTag(BattlerTagType.DISGUISE) && target.getMoveEffectiveness(user, move) > 0, 0, BattlerTagType.DISGUISE,
        (pokemon, abilityName) => i18next.t("abilityTriggers:disguiseAvoidedDamage", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon), abilityName }),
        (pokemon) => toDmgValue(pokemon.getMaxHp() / 8))
      .attr(PostBattleInitFormChangeAbAttr, () => 0)
      .attr(PostFaintFormChangeAbAttr, () => 0)
      .uncopiable()
      .unreplaceable()
      .unsuppressable()
      .bypassFaint()
      .ignorable(),
    new Ability(AbilityId.BATTLE_BOND, 7)
      .attr(PostVictoryFormChangeAbAttr, () => 2)
      .attr(PostBattleInitFormChangeAbAttr, () => 1)
      .attr(PostFaintFormChangeAbAttr, () => 1)
      .attr(NoFusionAbilityAbAttr)
      .uncopiable()
      .unreplaceable()
      .unsuppressable()
      .bypassFaint(),
    new Ability(AbilityId.POWER_CONSTRUCT, 7)
      // Change to 10% complete or 50% complete on switchout/turn end if at <50% HP;
      // revert to 10% PC or 50% PC before a new battle starts
      .conditionalAttr(p => p.formIndex === 4 || p.formIndex === 5, PostBattleInitFormChangeAbAttr, p => p.formIndex - 2)
      .conditionalAttr(p => p.getHpRatio() <= 0.5 && (p.formIndex === 2 || p.formIndex === 3), PostSummonFormChangeAbAttr, p => p.formIndex + 2)
      .conditionalAttr(p => p.getHpRatio() <= 0.5 && (p.formIndex === 2 || p.formIndex === 3), PostTurnFormChangeAbAttr, p => p.formIndex + 2)
      .conditionalAttr(p => p.formIndex === 4 || p.formIndex === 5, PostFaintFormChangeAbAttr, p => p.formIndex - 2)
      .attr(NoFusionAbilityAbAttr)
      .uncopiable()
      .unreplaceable()
      .unsuppressable()
      .bypassFaint(),
    new Ability(AbilityId.CORROSION, 7)
      .attr(IgnoreTypeStatusEffectImmunityAbAttr, [ StatusEffect.POISON, StatusEffect.TOXIC ], [ PokemonType.STEEL, PokemonType.POISON ]),
    new Ability(AbilityId.COMATOSE, 7)
      .attr(StatusEffectImmunityAbAttr, ...getNonVolatileStatusEffects())
      .attr(BattlerTagImmunityAbAttr, BattlerTagType.DROWSY)
      .uncopiable()
      .unreplaceable()
      .unsuppressable(),
    new Ability(AbilityId.QUEENLY_MAJESTY, 7)
      .attr(FieldPriorityMoveImmunityAbAttr)
      .ignorable(),
    new Ability(AbilityId.INNARDS_OUT, 7)
      .attr(PostFaintHPDamageAbAttr)
      .bypassFaint(),
    new Ability(AbilityId.DANCER, 7)
      .attr(PostDancingMoveAbAttr)
      /* Incorrect interations with:
      * Petal Dance (should not lock in or count down timer; currently does both)
      * Flinches (due to tag being removed earlier)
      * Failed/protected moves (should not trigger if original move is protected against)
      */
      .edgeCase(),
    new Ability(AbilityId.BATTERY, 7)
      .attr(AllyMoveCategoryPowerBoostAbAttr, [ MoveCategory.SPECIAL ], 1.3),
    new Ability(AbilityId.FLUFFY, 7)
      .attr(ReceivedMoveDamageMultiplierAbAttr, (target, user, move) => move.doesFlagEffectApply({flag: MoveFlags.MAKES_CONTACT, user, target}), 0.5)
      .attr(ReceivedMoveDamageMultiplierAbAttr, (_target, user, move) => user.getMoveType(move) === PokemonType.FIRE, 2)
      .ignorable(),
    new Ability(AbilityId.DAZZLING, 7)
      .attr(FieldPriorityMoveImmunityAbAttr)
      .ignorable(),
    new Ability(AbilityId.SOUL_HEART, 7)
      .attr(PostKnockOutStatStageChangeAbAttr, Stat.SPATK, 1),
    new Ability(AbilityId.TANGLING_HAIR, 7)
      .attr(PostDefendStatStageChangeAbAttr, (target, user, move) => move.doesFlagEffectApply({flag: MoveFlags.MAKES_CONTACT, user, target}), Stat.SPD, -1, false),
    new Ability(AbilityId.RECEIVER, 7)
      .attr(CopyFaintedAllyAbilityAbAttr)
      .uncopiable(),
    new Ability(AbilityId.POWER_OF_ALCHEMY, 7)
      .attr(CopyFaintedAllyAbilityAbAttr)
      .uncopiable(),
    new Ability(AbilityId.BEAST_BOOST, 7)
      .attr(PostVictoryStatStageChangeAbAttr, p => {
        let highestStat: EffectiveStat;
        let highestValue = 0;
        for (const s of EFFECTIVE_STATS) {
          const value = p.getStat(s, false);
          if (value > highestValue) {
            highestStat = s;
            highestValue = value;
          }
        }
        return highestStat!;
      }, 1),
    new Ability(AbilityId.RKS_SYSTEM, 7)
      .attr(NoFusionAbilityAbAttr)
      .uncopiable()
      .unreplaceable()
      .unsuppressable(),
    new Ability(AbilityId.ELECTRIC_SURGE, 7)
      .attr(PostSummonTerrainChangeAbAttr, TerrainType.ELECTRIC)
      .attr(PostBiomeChangeTerrainChangeAbAttr, TerrainType.ELECTRIC),
    new Ability(AbilityId.PSYCHIC_SURGE, 7)
      .attr(PostSummonTerrainChangeAbAttr, TerrainType.PSYCHIC)
      .attr(PostBiomeChangeTerrainChangeAbAttr, TerrainType.PSYCHIC),
    new Ability(AbilityId.MISTY_SURGE, 7)
      .attr(PostSummonTerrainChangeAbAttr, TerrainType.MISTY)
      .attr(PostBiomeChangeTerrainChangeAbAttr, TerrainType.MISTY),
    new Ability(AbilityId.GRASSY_SURGE, 7)
      .attr(PostSummonTerrainChangeAbAttr, TerrainType.GRASSY)
      .attr(PostBiomeChangeTerrainChangeAbAttr, TerrainType.GRASSY),
    new Ability(AbilityId.FULL_METAL_BODY, 7)
      .attr(ProtectStatAbAttr),
    new Ability(AbilityId.SHADOW_SHIELD, 7)
      .attr(ReceivedMoveDamageMultiplierAbAttr, (target, _user, _move) => target.isFullHp(), 0.5),
    new Ability(AbilityId.PRISM_ARMOR, 7)
      .attr(ReceivedMoveDamageMultiplierAbAttr, (target, user, move) => target.getMoveEffectiveness(user, move) >= 2, 0.75),
    new Ability(AbilityId.NEUROFORCE, 7)
      .attr(MovePowerBoostAbAttr, (user, target, move) => (target?.getMoveEffectiveness(user!, move) ?? 1) >= 2, 1.25),
    new Ability(AbilityId.INTREPID_SWORD, 8)
      .attr(PostSummonStatStageChangeAbAttr, [ Stat.ATK ], 1, true),
    new Ability(AbilityId.DAUNTLESS_SHIELD, 8)
      .attr(PostSummonStatStageChangeAbAttr, [ Stat.DEF ], 1, true),
    new Ability(AbilityId.LIBERO, 8)
      .attr(PokemonTypeChangeAbAttr)
    //.condition((p) => !p.summonData.abilitiesApplied.includes(AbilityId.LIBERO)), //Gen 9 Implementation
      // TODO: needs testing on interaction with weather blockage
      .edgeCase(),
    new Ability(AbilityId.BALL_FETCH, 8)
      .attr(FetchBallAbAttr)
      .condition(getOncePerBattleCondition(AbilityId.BALL_FETCH)),
    new Ability(AbilityId.COTTON_DOWN, 8)
      .attr(PostDefendStatStageChangeAbAttr, (_target, _user, move) => move.category !== MoveCategory.STATUS, Stat.SPD, -1, false, true)
      .bypassFaint(),
    new Ability(AbilityId.PROPELLER_TAIL, 8)
      .attr(BlockRedirectAbAttr),
    new Ability(AbilityId.MIRROR_ARMOR, 8)
      .attr(ReflectStatStageChangeAbAttr)
      .ignorable(),
    /**
     * Right now, the logic is attached to Surf and Dive moves. Ideally, the post-defend/hit should be an
     * ability attribute but the current implementation of move effects for BattlerTag does not support this- in the case
     * where Cramorant is fainted.
     * @see {@linkcode GulpMissileTagAttr} and {@linkcode GulpMissileTag} for Gulp Missile implementation
     */
    new Ability(AbilityId.GULP_MISSILE, 8)
      .attr(NoTransformAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr)
      .unsuppressable()
      .uncopiable()
      .unreplaceable()
      .bypassFaint(),
    new Ability(AbilityId.STALWART, 8)
      .attr(BlockRedirectAbAttr),
    new Ability(AbilityId.STEAM_ENGINE, 8)
      .attr(PostDefendStatStageChangeAbAttr, (_target, user, move) => {
        const moveType = user.getMoveType(move);
        return move.category !== MoveCategory.STATUS
          && (moveType === PokemonType.FIRE || moveType === PokemonType.WATER);
      }, Stat.SPD, 6),
    new Ability(AbilityId.PUNK_ROCK, 8)
      .attr(MovePowerBoostAbAttr, (_user, _target, move) => move.hasFlag(MoveFlags.SOUND_BASED), 1.3)
      .attr(ReceivedMoveDamageMultiplierAbAttr, (_target, _user, move) => move.hasFlag(MoveFlags.SOUND_BASED), 0.5)
      .ignorable(),
    new Ability(AbilityId.SAND_SPIT, 8)
      .attr(PostDefendWeatherChangeAbAttr, WeatherType.SANDSTORM, (_target, _user, move) => move.category !== MoveCategory.STATUS)
      .bypassFaint(),
    new Ability(AbilityId.ICE_SCALES, 8)
      .attr(ReceivedMoveDamageMultiplierAbAttr, (_target, _user, move) => move.category === MoveCategory.SPECIAL, 0.5)
      .ignorable(),
    new Ability(AbilityId.RIPEN, 8)
      .attr(DoubleBerryEffectAbAttr),
    new Ability(AbilityId.ICE_FACE, 8, -2)
      .attr(NoTransformAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr)
      // Add BattlerTagType.ICE_FACE if the pokemon is in ice face form
      .conditionalAttr(pokemon => pokemon.formIndex === 0, PostSummonAddBattlerTagAbAttr, BattlerTagType.ICE_FACE, 0, false)
      // When summoned with active HAIL or SNOW, add BattlerTagType.ICE_FACE
      .conditionalAttr(getWeatherCondition(WeatherType.HAIL, WeatherType.SNOW), PostSummonAddBattlerTagAbAttr, BattlerTagType.ICE_FACE, 0)
      // When weather changes to HAIL or SNOW while pokemon is fielded, add BattlerTagType.ICE_FACE
      .attr(PostWeatherChangeAddBattlerTagAttr, BattlerTagType.ICE_FACE, 0, WeatherType.HAIL, WeatherType.SNOW)
      .attr(FormBlockDamageAbAttr,
        (target, _user, move) => move.category === MoveCategory.PHYSICAL && !!target.getTag(BattlerTagType.ICE_FACE), 0, BattlerTagType.ICE_FACE,
        (pokemon, abilityName) => i18next.t("abilityTriggers:iceFaceAvoidedDamage", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon), abilityName }))
      .attr(PostBattleInitFormChangeAbAttr, () => 0)
      .uncopiable()
      .unreplaceable()
      .unsuppressable()
      .bypassFaint()
      .ignorable(),
    new Ability(AbilityId.POWER_SPOT, 8)
      .attr(AllyMoveCategoryPowerBoostAbAttr, [ MoveCategory.SPECIAL, MoveCategory.PHYSICAL ], 1.3),
    new Ability(AbilityId.MIMICRY, 8, -1)
      .attr(TerrainEventTypeChangeAbAttr),
    new Ability(AbilityId.SCREEN_CLEANER, 8)
      .attr(PostSummonRemoveArenaTagAbAttr, [ ArenaTagType.AURORA_VEIL, ArenaTagType.LIGHT_SCREEN, ArenaTagType.REFLECT ]),
    new Ability(AbilityId.STEELY_SPIRIT, 8)
      .attr(UserFieldMoveTypePowerBoostAbAttr, PokemonType.STEEL),
    new Ability(AbilityId.PERISH_BODY, 8)
      .attr(PostDefendPerishSongAbAttr, 4)
      .bypassFaint(),
    new Ability(AbilityId.WANDERING_SPIRIT, 8)
      .attr(PostDefendAbilitySwapAbAttr)
      .bypassFaint()
      .edgeCase(), // interacts incorrectly with rock head. It's meant to switch abilities before recoil would apply so that a pokemon with rock head would lose rock head first and still take the recoil
    new Ability(AbilityId.GORILLA_TACTICS, 8)
      .attr(GorillaTacticsAbAttr)
      // TODO: Verify whether Gorilla Tactics increases struggle's power or not
      .edgeCase(),
    new Ability(AbilityId.NEUTRALIZING_GAS, 8, 2)
      .attr(PostSummonAddArenaTagAbAttr, true, ArenaTagType.NEUTRALIZING_GAS, 0)
      .attr(PreLeaveFieldRemoveSuppressAbilitiesSourceAbAttr)
      .uncopiable()
      .attr(NoTransformAbilityAbAttr)
      .bypassFaint(),
    new Ability(AbilityId.PASTEL_VEIL, 8)
      .attr(PostSummonUserFieldRemoveStatusEffectAbAttr, StatusEffect.POISON, StatusEffect.TOXIC)
      .attr(UserFieldStatusEffectImmunityAbAttr, StatusEffect.POISON, StatusEffect.TOXIC)
      .ignorable(),
    new Ability(AbilityId.HUNGER_SWITCH, 8)
      .attr(PostTurnFormChangeAbAttr, p => p.getFormKey() ? 0 : 1)
      .attr(PostTurnFormChangeAbAttr, p => p.getFormKey() ? 1 : 0)
      .attr(NoTransformAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr)
      .condition((pokemon) => !pokemon.isTerastallized)
      .uncopiable()
      .unreplaceable(),
    new Ability(AbilityId.QUICK_DRAW, 8)
      .attr(BypassSpeedChanceAbAttr, 30),
    new Ability(AbilityId.UNSEEN_FIST, 8)
      .attr(IgnoreProtectOnContactAbAttr),
    new Ability(AbilityId.CURIOUS_MEDICINE, 8)
      .attr(PostSummonClearAllyStatStagesAbAttr),
    new Ability(AbilityId.TRANSISTOR, 8)
      .attr(MoveTypePowerBoostAbAttr, PokemonType.ELECTRIC, 1.3),
    new Ability(AbilityId.DRAGONS_MAW, 8)
      .attr(MoveTypePowerBoostAbAttr, PokemonType.DRAGON),
    new Ability(AbilityId.CHILLING_NEIGH, 8)
      .attr(PostVictoryStatStageChangeAbAttr, Stat.ATK, 1),
    new Ability(AbilityId.GRIM_NEIGH, 8)
      .attr(PostVictoryStatStageChangeAbAttr, Stat.SPATK, 1),
    new Ability(AbilityId.AS_ONE_GLASTRIER, 8, 1)
      .attr(PostSummonMessageAbAttr, (pokemon: Pokemon) => i18next.t("abilityTriggers:postSummonAsOneGlastrier", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }))
      .attr(PreventBerryUseAbAttr)
      .attr(PostVictoryStatStageChangeAbAttr, Stat.ATK, 1)
      .uncopiable()
      .unreplaceable()
      .unsuppressable(),
    new Ability(AbilityId.AS_ONE_SPECTRIER, 8, 1)
      .attr(PostSummonMessageAbAttr, (pokemon: Pokemon) => i18next.t("abilityTriggers:postSummonAsOneSpectrier", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }))
      .attr(PreventBerryUseAbAttr)
      .attr(PostVictoryStatStageChangeAbAttr, Stat.SPATK, 1)
      .uncopiable()
      .unreplaceable()
      .unsuppressable(),
    new Ability(AbilityId.LINGERING_AROMA, 9)
      .attr(PostDefendAbilityGiveAbAttr, AbilityId.LINGERING_AROMA)
      .bypassFaint(),
    new Ability(AbilityId.SEED_SOWER, 9)
      .attr(PostDefendTerrainChangeAbAttr, TerrainType.GRASSY)
      .bypassFaint(),
    new Ability(AbilityId.THERMAL_EXCHANGE, 9)
      .attr(PostDefendStatStageChangeAbAttr, (_target, user, move) => user.getMoveType(move) === PokemonType.FIRE && move.category !== MoveCategory.STATUS, Stat.ATK, 1)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.BURN)
      .attr(PostSummonHealStatusAbAttr, StatusEffect.BURN)
      .ignorable(),
    new Ability(AbilityId.ANGER_SHELL, 9)
      .attr(PostDefendHpGatedStatStageChangeAbAttr, (_target, _user, move) => move.category !== MoveCategory.STATUS, 0.5, [ Stat.ATK, Stat.SPATK, Stat.SPD ], 1)
      .attr(PostDefendHpGatedStatStageChangeAbAttr, (_target, _user, move) => move.category !== MoveCategory.STATUS, 0.5, [ Stat.DEF, Stat.SPDEF ], -1)
      .condition(getSheerForceHitDisableAbCondition()),
    new Ability(AbilityId.PURIFYING_SALT, 9)
      .attr(StatusEffectImmunityAbAttr)
      .attr(ReceivedTypeDamageMultiplierAbAttr, PokemonType.GHOST, 0.5)
      .ignorable(),
    new Ability(AbilityId.WELL_BAKED_BODY, 9)
      .attr(TypeImmunityStatStageChangeAbAttr, PokemonType.FIRE, Stat.DEF, 2)
      .ignorable(),
    new Ability(AbilityId.WIND_RIDER, 9)
      .attr(MoveImmunityStatStageChangeAbAttr, (pokemon, attacker, move) => pokemon !== attacker && move.hasFlag(MoveFlags.WIND_MOVE) && move.category !== MoveCategory.STATUS, Stat.ATK, 1)
      .attr(PostSummonStatStageChangeOnArenaAbAttr, ArenaTagType.TAILWIND)
      .ignorable(),
    new Ability(AbilityId.GUARD_DOG, 9)
      .attr(PostIntimidateStatStageChangeAbAttr, [ Stat.ATK ], 1, true)
      .attr(ForceSwitchOutImmunityAbAttr)
      .ignorable(),
    new Ability(AbilityId.ROCKY_PAYLOAD, 9)
      .attr(MoveTypePowerBoostAbAttr, PokemonType.ROCK),
    new Ability(AbilityId.WIND_POWER, 9)
      .attr(PostDefendApplyBattlerTagAbAttr, (_target, _user, move) => move.hasFlag(MoveFlags.WIND_MOVE), BattlerTagType.CHARGED),
    new Ability(AbilityId.ZERO_TO_HERO, 9)
      .uncopiable()
      .unreplaceable()
      .unsuppressable()
      .attr(NoTransformAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr)
      .attr(PostBattleInitFormChangeAbAttr, () => 0)
      .attr(PreSwitchOutFormChangeAbAttr, (pokemon) => !pokemon.isFainted() ? 1 : pokemon.formIndex)
      .bypassFaint(),
    new Ability(AbilityId.COMMANDER, 9)
      .attr(CommanderAbAttr)
      .attr(DoubleBattleChanceAbAttr)
      .uncopiable()
      .unreplaceable()
      .edgeCase(), // Encore, Frenzy, and other non-`TURN_END` tags don't lapse correctly on the commanding Pokemon.
    new Ability(AbilityId.ELECTROMORPHOSIS, 9)
      .attr(PostDefendApplyBattlerTagAbAttr, (_target, _user, move) => move.category !== MoveCategory.STATUS, BattlerTagType.CHARGED),
    new Ability(AbilityId.PROTOSYNTHESIS, 9, -2)
      .conditionalAttr(getWeatherCondition(WeatherType.SUNNY, WeatherType.HARSH_SUN), PostSummonAddBattlerTagAbAttr, BattlerTagType.PROTOSYNTHESIS, 0, true)
      .attr(PostWeatherChangeAddBattlerTagAttr, BattlerTagType.PROTOSYNTHESIS, 0, WeatherType.SUNNY, WeatherType.HARSH_SUN)
      .uncopiable()
      .attr(NoTransformAbilityAbAttr),
    new Ability(AbilityId.QUARK_DRIVE, 9, -2)
      .conditionalAttr(getTerrainCondition(TerrainType.ELECTRIC), PostSummonAddBattlerTagAbAttr, BattlerTagType.QUARK_DRIVE, 0, true)
      .attr(PostTerrainChangeAddBattlerTagAttr, BattlerTagType.QUARK_DRIVE, 0, TerrainType.ELECTRIC)
      .uncopiable()
      .attr(NoTransformAbilityAbAttr),
    new Ability(AbilityId.GOOD_AS_GOLD, 9)
      .attr(MoveImmunityAbAttr, (pokemon, attacker, move) =>
        pokemon !== attacker
        && move.category === MoveCategory.STATUS
        && ![ MoveTarget.ENEMY_SIDE, MoveTarget.BOTH_SIDES, MoveTarget.USER_SIDE ].includes(move.moveTarget)
      )
      .edgeCase() // Heal Bell should not cure the status of a Pokemon with Good As Gold
      .ignorable(),
    new Ability(AbilityId.VESSEL_OF_RUIN, 9)
      .attr(FieldMultiplyStatAbAttr, Stat.SPATK, 0.75)
      .attr(PostSummonMessageAbAttr, (user) => i18next.t("abilityTriggers:postSummonVesselOfRuin", { pokemonNameWithAffix: getPokemonNameWithAffix(user), statName: i18next.t(getStatKey(Stat.SPATK)) }))
      .ignorable(),
    new Ability(AbilityId.SWORD_OF_RUIN, 9)
      .attr(FieldMultiplyStatAbAttr, Stat.DEF, 0.75)
      .attr(PostSummonMessageAbAttr, (user) => i18next.t("abilityTriggers:postSummonSwordOfRuin", { pokemonNameWithAffix: getPokemonNameWithAffix(user), statName: i18next.t(getStatKey(Stat.DEF)) })),
    new Ability(AbilityId.TABLETS_OF_RUIN, 9)
      .attr(FieldMultiplyStatAbAttr, Stat.ATK, 0.75)
      .attr(PostSummonMessageAbAttr, (user) => i18next.t("abilityTriggers:postSummonTabletsOfRuin", { pokemonNameWithAffix: getPokemonNameWithAffix(user), statName: i18next.t(getStatKey(Stat.ATK)) }))
      .ignorable(),
    new Ability(AbilityId.BEADS_OF_RUIN, 9)
      .attr(FieldMultiplyStatAbAttr, Stat.SPDEF, 0.75)
      .attr(PostSummonMessageAbAttr, (user) => i18next.t("abilityTriggers:postSummonBeadsOfRuin", { pokemonNameWithAffix: getPokemonNameWithAffix(user), statName: i18next.t(getStatKey(Stat.SPDEF)) })),
    new Ability(AbilityId.ORICHALCUM_PULSE, 9)
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.SUNNY)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.SUNNY)
      .conditionalAttr(getWeatherCondition(WeatherType.SUNNY, WeatherType.HARSH_SUN), StatMultiplierAbAttr, Stat.ATK, 4 / 3),
    new Ability(AbilityId.HADRON_ENGINE, 9)
      .attr(PostSummonTerrainChangeAbAttr, TerrainType.ELECTRIC)
      .attr(PostBiomeChangeTerrainChangeAbAttr, TerrainType.ELECTRIC)
      .conditionalAttr(getTerrainCondition(TerrainType.ELECTRIC), StatMultiplierAbAttr, Stat.SPATK, 4 / 3),
    new Ability(AbilityId.OPPORTUNIST, 9)
      .attr(StatStageChangeCopyAbAttr),
    new Ability(AbilityId.CUD_CHEW, 9)
      .attr(CudChewConsumeBerryAbAttr)
      .attr(CudChewRecordBerryAbAttr),
    new Ability(AbilityId.SHARPNESS, 9)
      .attr(MovePowerBoostAbAttr, (_user, _target, move) => move.hasFlag(MoveFlags.SLICING_MOVE), 1.5),
    new Ability(AbilityId.SUPREME_OVERLORD, 9)
      .attr(VariableMovePowerBoostAbAttr, (user, _target, _move) => 1 + 0.1 * Math.min(user.isPlayer() ? globalScene.arena.playerFaints : globalScene.currentBattle.enemyFaints, 5))
      .partial(), // Should only boost once, on summon
    new Ability(AbilityId.COSTAR, 9, -2)
      .attr(PostSummonCopyAllyStatsAbAttr),
    new Ability(AbilityId.TOXIC_DEBRIS, 9)
      .attr(PostDefendApplyArenaTrapTagAbAttr, (_target, _user, move) => move.category === MoveCategory.PHYSICAL, ArenaTagType.TOXIC_SPIKES)
      .bypassFaint(),
    new Ability(AbilityId.ARMOR_TAIL, 9)
      .attr(FieldPriorityMoveImmunityAbAttr)
      .ignorable(),
    new Ability(AbilityId.EARTH_EATER, 9)
      .attr(TypeImmunityHealAbAttr, PokemonType.GROUND)
      .ignorable(),
    new Ability(AbilityId.MYCELIUM_MIGHT, 9)
      .attr(ChangeMovePriorityAbAttr, (_pokemon, move) => move.category === MoveCategory.STATUS, -0.2)
      .attr(PreventBypassSpeedChanceAbAttr, (_pokemon, move) => move.category === MoveCategory.STATUS)
      .attr(MoveAbilityBypassAbAttr, (_pokemon, move: Move) => move.category === MoveCategory.STATUS),
    new Ability(AbilityId.MINDS_EYE, 9)
      .attr(IgnoreTypeImmunityAbAttr, PokemonType.GHOST, [ PokemonType.NORMAL, PokemonType.FIGHTING ])
      .attr(ProtectStatAbAttr, Stat.ACC)
      .attr(IgnoreOpponentStatStagesAbAttr, [ Stat.EVA ])
      .ignorable(),
    new Ability(AbilityId.SUPERSWEET_SYRUP, 9)
      .attr(PostSummonStatStageChangeAbAttr, [ Stat.EVA ], -1),
    new Ability(AbilityId.HOSPITALITY, 9, -2)
      .attr(PostSummonAllyHealAbAttr, 4, true),
    new Ability(AbilityId.TOXIC_CHAIN, 9)
      .attr(PostAttackApplyStatusEffectAbAttr, false, 30, StatusEffect.TOXIC),
    new Ability(AbilityId.EMBODY_ASPECT_TEAL, 9)
      .attr(PostTeraFormChangeStatChangeAbAttr, [ Stat.SPD ], 1) // Activates immediately upon Terastallizing, as well as upon switching in while Terastallized
      .conditionalAttr(pokemon => pokemon.isTerastallized, PostSummonStatStageChangeAbAttr, [ Stat.SPD ], 1, true)
      .uncopiable()
      .unreplaceable() // TODO is this true?
      .attr(NoTransformAbilityAbAttr),
    new Ability(AbilityId.EMBODY_ASPECT_WELLSPRING, 9)
      .attr(PostTeraFormChangeStatChangeAbAttr, [ Stat.SPDEF ], 1)
      .conditionalAttr(pokemon => pokemon.isTerastallized, PostSummonStatStageChangeAbAttr, [ Stat.SPDEF ], 1, true)
      .uncopiable()
      .unreplaceable()
      .attr(NoTransformAbilityAbAttr),
    new Ability(AbilityId.EMBODY_ASPECT_HEARTHFLAME, 9)
      .attr(PostTeraFormChangeStatChangeAbAttr, [ Stat.ATK ], 1)
      .conditionalAttr(pokemon => pokemon.isTerastallized, PostSummonStatStageChangeAbAttr, [ Stat.ATK ], 1, true)
      .uncopiable()
      .unreplaceable()
      .attr(NoTransformAbilityAbAttr),
    new Ability(AbilityId.EMBODY_ASPECT_CORNERSTONE, 9)
      .attr(PostTeraFormChangeStatChangeAbAttr, [ Stat.DEF ], 1)
      .conditionalAttr(pokemon => pokemon.isTerastallized, PostSummonStatStageChangeAbAttr, [ Stat.DEF ], 1, true)
      .uncopiable()
      .unreplaceable()
      .attr(NoTransformAbilityAbAttr),
    new Ability(AbilityId.TERA_SHIFT, 9, 2)
      .attr(PostSummonFormChangeAbAttr, p => p.getFormKey() ? 0 : 1)
      .uncopiable()
      .unreplaceable()
      .unsuppressable()
      .attr(NoTransformAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr),
    new Ability(AbilityId.TERA_SHELL, 9)
      .attr(FullHpResistTypeAbAttr)
      .uncopiable()
      .unreplaceable()
      .ignorable(),
    new Ability(AbilityId.TERAFORM_ZERO, 9)
      .attr(ClearWeatherAbAttr, [ WeatherType.SUNNY, WeatherType.RAIN, WeatherType.SANDSTORM, WeatherType.HAIL, WeatherType.SNOW, WeatherType.FOG, WeatherType.HEAVY_RAIN, WeatherType.HARSH_SUN, WeatherType.STRONG_WINDS ])
      .attr(ClearTerrainAbAttr, [ TerrainType.MISTY, TerrainType.ELECTRIC, TerrainType.GRASSY, TerrainType.PSYCHIC ])
      .uncopiable()
      .unreplaceable()
      .condition(getOncePerBattleCondition(AbilityId.TERAFORM_ZERO)),
    new Ability(AbilityId.POISON_PUPPETEER, 9)
      .uncopiable()
      .unreplaceable() // TODO is this true?
      .attr(ConfusionOnStatusEffectAbAttr, StatusEffect.POISON, StatusEffect.TOXIC)
  );
}
