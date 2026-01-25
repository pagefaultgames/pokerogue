import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import type { EntryHazardTag, SuppressAbilitiesTag } from "#data/arena-tag";
import { type BattlerTag, CritBoostTag } from "#data/battler-tags";
import { getBerryEffectFunc } from "#data/berry";
import { allAbilities, allMoves } from "#data/data-lists";
import { SpeciesFormChangeAbilityTrigger, SpeciesFormChangeWeatherTrigger } from "#data/form-change-triggers";
import { getPokeballName } from "#data/pokeball";
import { pokemonFormChanges } from "#data/pokemon-forms";
import type { PokemonSpecies } from "#data/pokemon-species";
import { getStatusEffectDescriptor, getStatusEffectHealText } from "#data/status-effect";
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
import { MovePhaseTimingModifier } from "#enums/move-phase-timing-modifier";
import type { MovePriorityInBracket } from "#enums/move-priority-in-bracket";
import { MoveResult } from "#enums/move-result";
import { MoveTarget } from "#enums/move-target";
import { MoveUseMode } from "#enums/move-use-mode";
import { PokemonAnimType } from "#enums/pokemon-anim-type";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { BATTLE_STATS, type BattleStat, EFFECTIVE_STATS, getStatKey, Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { SwitchType } from "#enums/switch-type";
import { WeatherType } from "#enums/weather-type";
import { BerryUsedEvent } from "#events/battle-scene";
import type { EnemyPokemon, Pokemon } from "#field/pokemon";
import { BerryModifier, HitHealModifier, PokemonHeldItemModifier } from "#modifiers/modifier";
import { BerryModifierType } from "#modifiers/modifier-type";
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
import type { Move, StatusEffectAttr } from "#types/move-types";
import type { Closed, Exact, Mutable } from "#types/type-helpers";
import { coerceArray } from "#utils/array";
import { BooleanHolder, NumberHolder, randSeedFloat, randSeedInt, randSeedItem, toDmgValue } from "#utils/common";
import { inSpeedOrder } from "#utils/speed-order-generator";
import { toCamelCase } from "#utils/strings";
import i18next from "i18next";
import type { NonEmptyTuple } from "type-fest";

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

/** Attribute for abilities that increase the chance of a double battle occurring. */
export class DoubleBattleChanceAbAttr extends AbAttr {
  private declare readonly _: never;
  constructor() {
    super(false);
  }

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
  private readonly formFunc: (p: Pokemon) => number;

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
  private readonly stats: readonly BattleStat[];
  private readonly stages: number;

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

/** Clears all weather whenever this attribute is applied */
export class ClearWeatherAbAttr extends AbAttr {
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

/** Clears all terrain whenever this attribute is called. */
export class ClearTerrainAbAttr extends AbAttr {
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

/** Shared interface for parameters of several {@linkcode PreDefendAbAttr} ability attributes that modify damage. */
export interface PreDefendModifyDamageAbAttrParams extends AugmentMoveInteractionAbAttrParams {
  /** Holder for the amount of damage that will be dealt by a move */
  damage: NumberHolder;
}

/**
 * Class for abilities that apply effects before the defending Pokemon takes damage.
 *
 * ⚠️ This attribute must not be called via `applyAbAttrs` as its subclasses violate the Liskov Substitution Principle.
 */
// TODO: this class is effectively useless
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
  protected readonly condition: PokemonDefendCondition;
  private readonly damageMultiplier: number;

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

/** Reduces the damage dealt to an allied Pokemon. Used by Friend Guard. */
export class AlliedFieldDamageReductionAbAttr extends PreDefendAbAttr {
  private readonly damageMultiplier: number;

  constructor(damageMultiplier: number) {
    super();
    this.damageMultiplier = damageMultiplier;
  }

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

/** Determines whether a Pokemon is immune to a move because of an ability. */
export class TypeImmunityAbAttr extends PreDefendAbAttr {
  private readonly immuneType: PokemonType | null;
  private readonly condition: AbAttrCondition | null;

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
      const abilityName = (passive ? pokemon.getPassiveAbility() : pokemon.getAbility()).name;
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

export class TypeImmunityStatStageChangeAbAttr extends TypeImmunityAbAttr {
  private readonly stat: BattleStat;
  private readonly stages: number;

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

export class TypeImmunityAddBattlerTagAbAttr extends TypeImmunityAbAttr {
  private readonly tagType: BattlerTagType;
  private readonly turnCount: number;

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
 * Attribute implementing the effects of {@link https://bulbapedia.bulbagarden.net/wiki/Tera_Shell_(Ability) | Tera Shell}.
 * When the source is at full HP, incoming attacks will have a maximum 0.5x type effectiveness multiplier.
 */
export class FullHpResistTypeAbAttr extends PreDefendAbAttr {
  override canApply({ typeMultiplier, move, pokemon }: TypeMultiplierAbAttrParams): boolean {
    return (
      typeMultiplier instanceof NumberHolder
      && !move?.hasAttr("FixedDamageAttr")
      && pokemon.isFullHp()
      && typeMultiplier.value > 0.5
    );
  }

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
  private readonly immuneCondition: PreDefendAbAttrCondition;

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
  private readonly stat: BattleStat;
  private readonly stages: number;

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
  override canApply({ move, opponent, simulated }: PostMoveInteractionAbAttrParams): boolean {
    const cancelled = new BooleanHolder(false);
    applyAbAttrs("BlockNonDirectDamageAbAttr", { pokemon: opponent, cancelled, simulated });
    return !cancelled.value && move.hasAttr("HitHealAttr");
  }

  /**
   * Determines if a damage and draining move was used to check if this ability should stop the healing.
   * Examples include: Absorb, Draining Kiss, Bitter Blade, etc.
   * Also displays a message to show this ability was activated.
   */
  override apply({ move, simulated, opponent, pokemon }: PostMoveInteractionAbAttrParams): void {
    if (simulated) {
      return;
    }
    const damageAmount = move.getAttrs<"HitHealAttr">("HitHealAttr")[0].getHealAmount(opponent, pokemon);
    pokemon.turnData.damageTaken += damageAmount;
    globalScene.phaseManager.unshiftNew(
      "PokemonHealPhase",
      opponent.getBattlerIndex(),
      -damageAmount,
      null,
      false,
      true,
    );
  }

  public override getTriggerMessage({ opponent }: PostMoveInteractionAbAttrParams): string | null {
    return i18next.t("abilityTriggers:reverseDrain", { pokemonNameWithAffix: getPokemonNameWithAffix(opponent) });
  }
}

export class PostDefendStatStageChangeAbAttr extends PostDefendAbAttr {
  private readonly condition: PokemonDefendCondition;
  private readonly stat: BattleStat;
  private readonly stages: number;
  private readonly selfTarget: boolean;
  private readonly allOthers: boolean;

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
      const otherPokemon = ally != null ? pokemon.getOpponents().concat([ally]) : pokemon.getOpponents();
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
  private readonly condition: PokemonDefendCondition;
  private readonly hpGate: number;
  private readonly stats: readonly BattleStat[];
  private readonly stages: number;
  private readonly selfTarget: boolean;

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
  private readonly condition: PokemonDefendCondition;
  private readonly arenaTagType: ArenaTagType;

  constructor(condition: PokemonDefendCondition, tagType: ArenaTagType) {
    super(true);

    this.condition = condition;
    this.arenaTagType = tagType;
  }

  override canApply({ pokemon, opponent: attacker, move }: PostMoveInteractionAbAttrParams): boolean {
    const tag = globalScene.arena.getTag(this.arenaTagType) as EntryHazardTag;
    return this.condition(pokemon, attacker, move) && (!tag || tag.canAdd());
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
  private readonly condition: PokemonDefendCondition;
  private readonly tagType: BattlerTagType;
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

  override canApply({ opponent: attacker, move, pokemon, hitResult }: PostMoveInteractionAbAttrParams): boolean {
    if (hitResult >= HitResult.NO_EFFECT) {
      return false;
    }

    if (pokemon.isTerastallized) {
      return false;
    }

    if (move.hasAttr("TypelessAttr")) {
      return false;
    }

    if (attacker.turnData.hitsLeft > 1) {
      return false;
    }

    this.type = attacker.getMoveType(move);
    if (pokemon.isOfType(this.type, true, true)) {
      return false;
    }

    return true;
  }

  override apply({ pokemon, simulated }: PostMoveInteractionAbAttrParams): void {
    if (simulated) {
      return;
    }

    pokemon.summonData.types = [this.type];
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
  private readonly terrainType: TerrainType;

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
  private readonly chance: number;
  private readonly effects: readonly StatusEffect[];

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
  private readonly chance: number;
  private readonly tagType: BattlerTagType;
  private readonly turnCount: number | undefined;

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
  private readonly stat: BattleStat;
  private readonly stages: number;

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
  private readonly damageRatio: number;

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
 * This ability applies the Perish Song tag to the attacking pokemon
 * and the defending pokemon if the move makes physical contact and neither pokemon
 * already has the Perish Song tag.
 */
export class PostDefendPerishSongAbAttr extends PostDefendAbAttr {
  private readonly turns: number;

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
  private readonly weatherType: WeatherType;
  protected readonly condition?: PokemonDefendCondition;

  constructor(weatherType: WeatherType, condition?: PokemonDefendCondition) {
    super();

    this.weatherType = weatherType;
    if (condition != null) {
      this.condition = condition;
    }
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
      && attacker.getAbility().swappable
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
  private readonly ability: AbilityId;

  constructor(ability: AbilityId) {
    super();
    this.ability = ability;
  }

  override canApply({ move, opponent: attacker, pokemon }: PostMoveInteractionAbAttrParams): boolean {
    return (
      move.doesFlagEffectApply({ flag: MoveFlags.MAKES_CONTACT, user: attacker, target: pokemon })
      && attacker.getAbility().suppressable
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
  private readonly chance: number;

  constructor(chance: number) {
    super();

    this.chance = chance;
  }

  override canApply({ move, opponent: attacker, pokemon }: PostMoveInteractionAbAttrParams): boolean {
    return (
      attacker.getTag(BattlerTagType.DISABLED) == null
      && move.doesFlagEffectApply({ flag: MoveFlags.MAKES_CONTACT, user: attacker, target: pokemon })
      && (this.chance === -1 || pokemon.randBattleSeedInt(100) < this.chance)
    );
  }

  override apply({ simulated, opponent, pokemon }: PostMoveInteractionAbAttrParams): void {
    if (!simulated) {
      opponent.addTag(BattlerTagType.DISABLED, 4, 0, pokemon.id);
    }
  }
}

export interface PostStatStageChangeAbAttrParams extends AbAttrBaseParams {
  /** The stats that were changed */
  stats: readonly BattleStat[];
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
  private readonly condition: PokemonStatStageChangeCondition;
  private readonly statsToChange: readonly BattleStat[];
  private readonly stages: number;

  constructor(condition: PokemonStatStageChangeCondition, statsToChange: BattleStat[], stages: number) {
    super(true);

    this.condition = condition;
    this.statsToChange = statsToChange;
    this.stages = stages;
  }

  override canApply({ pokemon, stats, stages, selfTarget }: PostStatStageChangeAbAttrParams): boolean {
    return this.condition(pokemon, stats, stages) && !selfTarget;
  }

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
 * Modifies moves additional effects with multipliers, e.g. Sheer Force, Serene Grace.
 */
export class MoveEffectChanceMultiplierAbAttr extends AbAttr {
  private readonly chanceMultiplier: number;

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
 * Sets incoming moves additional effect chance to zero, ignoring all effects from moves. e.g. Shield Dust.
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
  private readonly stat: Stat;
  private readonly multiplier: number;
  /**
   * Whether this ability can stack with others of the same type for this stat.
   * @defaultValue `false`
   * @todo Remove due to being literally useless - the ruin abilities are hardcoded to never stack in game
   */
  private readonly canStack: boolean;

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

  apply({ statVal, hasApplied }: FieldMultiplyStatAbAttrParams): void {
    statVal.value *= this.multiplier;
    hasApplied.value = true;
  }
}

export interface MoveTypeChangeAbAttrParams extends AugmentMoveInteractionAbAttrParams {
  // TODO: Replace the number holder with a holder for the type.
  /** Holds the type of the move, which may change after ability application */
  moveType: NumberHolder;
}

export class MoveTypeChangeAbAttr extends PreAttackAbAttr {
  private readonly newType: PokemonType;
  private readonly condition: PokemonAttackCondition;

  constructor(newType: PokemonType, condition: PokemonAttackCondition) {
    super(false);

    this.newType = newType;
    this.condition = condition;
  }

  override canApply({ pokemon, opponent, move }: MoveTypeChangeAbAttrParams): boolean {
    return this.condition(pokemon, opponent, move);
  }

  override apply({ moveType }: MoveTypeChangeAbAttrParams): void {
    moveType.value = this.newType;
  }
}

/**
 * Attribute to change the user's type to that of the move currently being executed.
 * @see {@linkcode AbilityId.PROTEAN} and {@linkcode AbilityId.LIBERO}.
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

/** Parameters for abilities that modify the hit count of a move. */
export interface AddSecondStrikeAbAttrParams extends Omit<AugmentMoveInteractionAbAttrParams, "opponent"> {
  /** Holder for the number of hits. Modified by ability application */
  hitCount: NumberHolder;
  /** The Pokemon on the other side of this interaction */
  opponent: Pokemon | undefined;
}

/**
 * Class for abilities that add additional strikes to single-target moves.
 * @see {@linkcode MoveId.PARENTAL_BOND | Parental Bond}
 */
export class AddSecondStrikeAbAttr extends PreAttackAbAttr {
  override canApply({ pokemon, opponent, move }: AddSecondStrikeAbAttrParams): boolean {
    return move.canBeMultiStrikeEnhanced(pokemon, true, opponent);
  }

  override apply({ hitCount }: AddSecondStrikeAbAttrParams): void {
    hitCount.value += 1;
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
export class MoveDamageBoostAbAttr extends PreAttackAbAttr {
  private readonly damageMultiplier: number;
  private readonly condition: PokemonAttackCondition;

  // TODO: This should not take a `PokemonAttackCondition` (with nullish parameters)
  // as it's effectively offloading nullishness checks to its child attributes
  constructor(damageMultiplier: number, condition: PokemonAttackCondition) {
    super(false);
    this.damageMultiplier = damageMultiplier;
    this.condition = condition;
  }

  override canApply({ pokemon, opponent: target, move }: PreAttackModifyDamageAbAttrParams): boolean {
    return this.condition(pokemon, target, move);
  }

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
The `Closed` type is used to indicate that subclasses should not modify the param typing.
*/
export abstract class VariableMovePowerAbAttr extends PreAttackAbAttr {
  override canApply(_params: Closed<PreAttackModifyPowerAbAttrParams>): boolean {
    return true;
  }
  override apply(_params: Closed<PreAttackModifyPowerAbAttrParams>): void {}
}

export class MovePowerBoostAbAttr extends VariableMovePowerAbAttr {
  private readonly condition: PokemonAttackCondition;
  private readonly powerMultiplier: number;

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

/** Abilities which cause a variable amount of power increase. */
export class VariableMovePowerBoostAbAttr extends VariableMovePowerAbAttr {
  private readonly mult: (user: Pokemon, target: Pokemon, move: Move) => number;

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

/** Boosts the power of a Pokémon's move under certain conditions. */
export class FieldMovePowerBoostAbAttr extends AbAttr {
  // TODO: Refactor this class? It extends from base AbAttr but has preAttack methods and gets called directly instead of going through applyAbAttrsInternal
  private readonly condition: PokemonAttackCondition;
  private readonly powerMultiplier: number;

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

/** Boosts the power of a specific type of move. */
export class PreAttackFieldMoveTypePowerBoostAbAttr extends FieldMovePowerBoostAbAttr {
  /**
   * @param boostedType - The type of move that will receive the power boost.
   * @param powerMultiplier - The multiplier to apply to the move's power, defaults to 1.5 if not provided.
   */
  constructor(boostedType: PokemonType, powerMultiplier?: number) {
    super((pokemon, _defender, move) => pokemon?.getMoveType(move) === boostedType, powerMultiplier || 1.5);
  }
}

/** Boosts the power of a specific type of move for all Pokemon in the field. */
export class FieldMoveTypePowerBoostAbAttr extends PreAttackFieldMoveTypePowerBoostAbAttr {}

/** Boosts the power of a specific type of move for the user and its allies. */
export class UserFieldMoveTypePowerBoostAbAttr extends PreAttackFieldMoveTypePowerBoostAbAttr {}

/** Boosts the power of moves in specified categories. */
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
  private readonly stat: BattleStat;
  private readonly multiplier: number;
  /**
   * Function determining if the stat multiplier is able to be applied to the move.
   *
   * @remarks
   * Currently only used by Hustle.
   */
  private readonly condition?: PokemonAttackCondition;

  constructor(stat: BattleStat, multiplier: number, condition?: PokemonAttackCondition) {
    super(false);

    this.stat = stat;
    this.multiplier = multiplier;
    if (condition != null) {
      this.condition = condition;
    }
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

/** Multiplies a Stat from an ally pokemon's ability. */
export class AllyStatMultiplierAbAttr extends AbAttr {
  private readonly stat: BattleStat;
  private readonly multiplier: number;
  private readonly ignorable: boolean;

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

  apply({ statVal }: AllyStatMultiplierAbAttrParams) {
    statVal.value *= this.multiplier;
  }

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
This is suggested via the `Closed` type.
*/
/** Base class for abilities that apply some effect after the user's move successfully executes. */
export abstract class PostAttackAbAttr extends AbAttr {
  private readonly attackCondition: PokemonAttackCondition;

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
  private readonly stealCondition?: PokemonAttackCondition;
  private stolenItem?: PokemonHeldItemModifier;

  constructor(stealCondition?: PokemonAttackCondition) {
    super();
    if (stealCondition != null) {
      this.stealCondition = stealCondition;
    }
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
  private readonly contactRequired: boolean;
  private readonly chance: number;
  private readonly effects: readonly StatusEffect[];

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
  private readonly contactRequired: boolean;
  private readonly chance: (user: Pokemon, target: Pokemon, move: Move) => number;
  private readonly effects: readonly BattlerTagType[];

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
    // Battler tags inflicted by abilities post attacking are also considered additional effects.
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
  private readonly condition?: PokemonDefendCondition;
  private stolenItem?: PokemonHeldItemModifier;

  constructor(condition?: PokemonDefendCondition) {
    super();
    if (condition) {
      this.condition = condition;
    }
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
/** Base class for defining all ability attributes that activate after a status effect has been set. */
export class PostSetStatusAbAttr extends AbAttr {
  canApply(_params: Closed<PostSetStatusAbAttrParams>): boolean {
    return true;
  }

  apply(_params: Closed<PostSetStatusAbAttrParams>): void {}
}

/**
 * When the user is burned, paralyzed, or poisoned by an opponent, the opponent receives the same status.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Synchronize_(Ability) | Synchronize (Bulbapedia)}
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

export class PostVictoryStatStageChangeAbAttr extends PostVictoryAbAttr {
  private readonly stat: BattleStat | ((p: Pokemon) => BattleStat);
  private readonly stages: number;

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
  private readonly formFunc: (p: Pokemon) => number;

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
  private readonly stat: BattleStat | ((p: Pokemon) => BattleStat);
  private readonly stages: number;

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
    return pokemon.isPlayer() === victim.isPlayer() && victim.getAbility().copiable;
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
  private readonly stats: readonly BattleStat[];

  constructor(stats?: BattleStat[]) {
    super(false);

    this.stats = stats ?? BATTLE_STATS;
  }

  override canApply({ stat }: IgnoreOpponentStatStagesAbAttrParams): boolean {
    return this.stats.includes(stat);
  }

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
  private readonly stats: readonly BattleStat[];
  private readonly stages: number;
  private readonly overwrites: boolean;

  constructor(stats: readonly BattleStat[], stages: number, overwrites?: boolean) {
    super(true);
    this.stats = stats;
    this.stages = stages;
    this.overwrites = !!overwrites;
  }

  override apply({ pokemon, simulated, cancelled }: AbAttrParamsWithCancel): void {
    if (!simulated) {
      globalScene.phaseManager.unshiftNew(
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

/** Base class for ability attributes that active after a Pokemon is summoned */
export abstract class PostSummonAbAttr extends AbAttr {
  /** Should the ability activate when gained in battle? This will almost always be true */
  private readonly activateOnGain: boolean;

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

  apply(_params: Closed<AbAttrBaseParams>): void {}
}

/** Base class for ability attributes which remove an effect on summon */
export abstract class PostSummonRemoveEffectAbAttr extends PostSummonAbAttr {}

/** Attribute to remove the specified arena tags when a Pokemon is summoned. */
export class PostSummonRemoveArenaTagAbAttr extends PostSummonAbAttr {
  /** The arena tags that this attribute should remove. */
  private readonly arenaTags: NonEmptyTuple<ArenaTagType>;

  /**
   * @param tagTypes - The arena tags that this attribute should remove
   */
  constructor(tagTypes: NonEmptyTuple<ArenaTagType>) {
    super(true);
    this.arenaTags = tagTypes;
  }

  override canApply(_params: AbAttrBaseParams): boolean {
    return globalScene.arena.hasTag(this.arenaTags);
  }

  override apply({ simulated }: AbAttrBaseParams): void {
    if (simulated) {
      return;
    }
    globalScene.arena.removeTagsOnSide(this.arenaTags, ArenaTagSide.BOTH);
  }
}

/** Generic class to add an arena tag upon switching in */
export class PostSummonAddArenaTagAbAttr extends PostSummonAbAttr {
  private readonly tagType: ArenaTagType;
  private readonly turnCount: number;
  private readonly side?: ArenaTagSide;
  private readonly quiet?: boolean;
  // TODO: This should not need to track the source ID in a tempvar
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
  private readonly messageFunc: (pokemon: Pokemon) => string;

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

// TODO: This should be merged with message func
export class PostSummonUnnamedMessageAbAttr extends PostSummonAbAttr {
  //Attr doesn't force pokemon name on the message
  private readonly message: string;

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
  private readonly tagType: BattlerTagType;
  private readonly turnCount: number;

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
  private readonly immuneTags: readonly BattlerTagType[];

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
    // biome-ignore lint/suspicious/useIterableCallbackReturn: the return type of `removeTag` is `void`
    this.immuneTags.forEach(tagType => pokemon.removeTag(tagType));
  }
}

export class PostSummonStatStageChangeAbAttr extends PostSummonAbAttr {
  private readonly stats: readonly BattleStat[];
  private readonly stages: number;
  private readonly selfTarget: boolean;
  private readonly intimidate: boolean;

  constructor(stats: readonly BattleStat[], stages: number, selfTarget = false, intimidate = true) {
    super(true);

    this.stats = stats;
    this.stages = stages;
    this.selfTarget = selfTarget;
    this.intimidate = intimidate;
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

    for (const opponent of pokemon.getOpponentsGenerator()) {
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
  private readonly healRatio: number;
  private readonly showAnim: boolean;

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
    if (!simulated && target != null) {
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
 */
export class PostSummonClearAllyStatStagesAbAttr extends PostSummonAbAttr {
  override canApply({ pokemon }: AbAttrBaseParams): boolean {
    return pokemon.getAlly()?.isActive(true) ?? false;
  }

  override apply({ pokemon, simulated }: AbAttrBaseParams): void {
    const target = pokemon.getAlly();
    if (!simulated && target != null) {
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
 * Raises the user's Attack Special Attack stat by one stage depending on the lower of the foes' defensive stats.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Download_(Ability) | Download (Bulbapedia)}
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
  private readonly weatherType: WeatherType;

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
  private readonly terrainType: TerrainType;

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

/** Heals a status effect if the Pokemon is afflicted with it upon switch in (or gain) */
export class PostSummonHealStatusAbAttr extends PostSummonRemoveEffectAbAttr {
  private readonly immuneEffects: readonly StatusEffect[];
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
    const immuneEffects = this.immuneEffects;
    return status != null && (immuneEffects.length === 0 || immuneEffects.includes(status));
  }

  public override apply({ pokemon }: AbAttrBaseParams): void {
    // TODO: should probably check against simulated...
    const status = pokemon.status?.effect;
    if (status != null) {
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
  private readonly formFunc: (p: Pokemon) => number;

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
      .filter(t => t.getAbility().copiable || t.getAbility().id === AbilityId.WONDER_GUARD);
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
      this.target.revealAbility();
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

/** Removes supplied status effects from the user's field. */
export class PostSummonUserFieldRemoveStatusEffectAbAttr extends PostSummonAbAttr {
  private readonly statusEffect: readonly StatusEffect[];

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

  override apply({ pokemon, simulated }: AbAttrBaseParams): void {
    if (simulated) {
      return;
    }

    for (const partyPokemon of pokemon.getAlliesGenerator()) {
      if (partyPokemon.status && this.statusEffect.includes(partyPokemon.status.effect)) {
        globalScene.phaseManager.queueMessage(
          getStatusEffectHealText(partyPokemon.status.effect, getPokemonNameWithAffix(partyPokemon)),
        );
        partyPokemon.resetStatus(false);
        partyPokemon.updateInfo();
      }
    }
  }
}

/**
 * Copies the stat stages and critical hit stage of the user's ally.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Costar_(Ability) | Costar (Bulbapedia)}
 */
export class PostSummonCopyAllyStatsAbAttr extends PostSummonAbAttr {
  private ally: Pokemon;

  override canApply({ pokemon }: AbAttrBaseParams): boolean {
    if (!globalScene.currentBattle.double) {
      return false;
    }

    const ally = pokemon.getAlly();
    if (!ally?.isActive(true)) {
      return false;
    }
    this.ally = ally;

    return true;
  }

  override apply({ pokemon, simulated }: AbAttrBaseParams): void {
    if (simulated) {
      return;
    }

    for (const s of BATTLE_STATS) {
      pokemon.setStatStage(s, this.ally.getStatStage(s));
    }
    pokemon.updateInfo();

    const dragonCheerTag = this.ally.getTag(BattlerTagType.DRAGON_CHEER) as CritBoostTag;
    if (dragonCheerTag) {
      pokemon.addTag(BattlerTagType.DRAGON_CHEER);
      (pokemon.getTag(CritBoostTag) as Mutable<CritBoostTag>).critStages = dragonCheerTag.critStages;
    }

    const critBoostTag = this.ally.getTag(BattlerTagType.CRIT_BOOST);
    if (critBoostTag) {
      pokemon.addTag(BattlerTagType.CRIT_BOOST);
    }

    const laserFocusTag = this.ally.getTag(BattlerTagType.ALWAYS_CRIT);
    if (laserFocusTag) {
      pokemon.addTag(BattlerTagType.ALWAYS_CRIT);
    }
  }

  getTriggerMessage({ pokemon }: AbAttrBaseParams, _abilityName: string): string {
    return i18next.t("abilityTriggers:costar", {
      pokemonName: getPokemonNameWithAffix(pokemon),
      allyName: getPokemonNameWithAffix(this.ally),
    });
  }
}

/**
 * Causes the user to transform into a random opposing Pokémon on entry.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Imposter_(Ability) | Imposter (Bulbapedia)}
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
 */
export class PostSummonFormChangeByWeatherAbAttr extends PostSummonAbAttr {
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
 *
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
      && ally != null
      && ally.isActive(true)
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
      globalScene.phaseManager.tryRemovePhase("MovePhase", phase => phase.pokemon === pokemon);
    }
  }
}

/** Base class for ability attributes that apply their effect when their user switches out. */
// TODO: Clarify the differences between this and `PreLeaveFieldAbAttr`
export abstract class PreSwitchOutAbAttr extends AbAttr {
  constructor(showAbility = true) {
    super(showAbility);
  }

  canApply(_params: Closed<AbAttrBaseParams>): boolean {
    return true;
  }

  apply(_params: Closed<AbAttrBaseParams>): void {}
}

/** Resets all status effects on the user when it switches out. */
export class PreSwitchOutResetStatusAbAttr extends PreSwitchOutAbAttr {
  constructor() {
    super(false);
  }

  override canApply({ pokemon }: AbAttrBaseParams): boolean {
    return pokemon.status != null;
  }

  override apply({ pokemon, simulated }: AbAttrBaseParams): void {
    if (!simulated) {
      pokemon.resetStatus();
      pokemon.updateInfo();
    }
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

/** Attribute for form changes that occur on switching out */
export class PreSwitchOutFormChangeAbAttr extends PreSwitchOutAbAttr {
  private readonly formFunc: (p: Pokemon) => number;

  constructor(formFunc: (p: Pokemon) => number) {
    super();

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

/** Base class for ability attributes that apply their effect just before the user leaves the field */
export class PreLeaveFieldAbAttr extends AbAttr {
  canApply(_params: Closed<AbAttrBaseParams>): boolean {
    return true;
  }

  apply(_params: Closed<AbAttrBaseParams>): void {}
}

/** Clears Desolate Land/Primordial Sea/Delta Stream upon the Pokemon switching out. */
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
 * Attribute that updates the active {@linkcode SuppressAbilitiesTag} when its user leaves the field.
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
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Mirror_Armor_(Ability) | Mirror Armor (Bulbapedia)}
 */
export class ReflectStatStageChangeAbAttr extends PreStatStageChangeAbAttr {
  /** The stat to reflect */
  private reflectedStat?: BattleStat;

  override canApply({ source, cancelled }: PreStatStageChangeAbAttrParams): boolean {
    return !!source && !cancelled.value;
  }

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
  private readonly protectedStat?: BattleStat;

  constructor(protectedStat?: BattleStat) {
    super();
    if (protectedStat != null) {
      this.protectedStat = protectedStat;
    }
  }

  override canApply({ stat, cancelled }: PreStatStageChangeAbAttrParams): boolean {
    return !cancelled.value && (this.protectedStat == null || stat === this.protectedStat);
  }

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
  private readonly effects: ReadonlySet<StatusEffect>;

  constructor(...effects: StatusEffect[]) {
    super();
    this.effects = new Set(effects);
  }

  override canApply({ opponent, effect }: ConfusionOnStatusEffectAbAttrParams): boolean {
    return this.effects.has(effect) && !opponent.isFainted() && opponent.canAddTag(BattlerTagType.CONFUSED);
  }

  override apply({ opponent, simulated, pokemon }: ConfusionOnStatusEffectAbAttrParams): void {
    if (!simulated) {
      opponent.addTag(BattlerTagType.CONFUSED, pokemon.randBattleSeedIntRange(2, 5), undefined, opponent.id);
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

/** Provides immunity to status effects to specified targets. */
export class PreSetStatusEffectImmunityAbAttr extends PreSetStatusAbAttr {
  protected readonly immuneEffects: readonly StatusEffect[];

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
// TODO: Find away to avoid the code duplication without sacrificing the subclass split
/**  Provides immunity to status effects to the user. */
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

/** Provides immunity to status effects to the user's field. */
export class UserFieldStatusEffectImmunityAbAttr extends CancelInteractionAbAttr {
  private declare readonly _: never;
  protected readonly immuneEffects: readonly StatusEffect[];

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
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Flower_Veil_(Ability) | Flower Veil (Bulbapedia)}.
 */
export class ConditionalUserFieldStatusEffectImmunityAbAttr extends UserFieldStatusEffectImmunityAbAttr {
  /**
   * The condition for the field immunity to be applied.
   * @param target - The target of the status effect
   * @param source - The source of the status effect
   */
  private readonly condition: (target: Pokemon, source: Pokemon | null) => boolean;

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
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Flower_Veil_(Ability) | Flower Veil (Bulbapedia)}
 */
export class ConditionalUserFieldProtectStatAbAttr extends PreStatStageChangeAbAttr {
  /** The {@linkcode BattleStat} to protect or `undefined` if **all** stats are protected */
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
    return !cancelled.value && (this.protectedStat == null || stat === this.protectedStat) && this.condition(target);
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
 * @remarks
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
 * Provides immunity to {@linkcode BattlerTag}s to specified targets.
 * @remarks
 * Does not check whether the tag is already applied; that check should happen in the caller.
 */
export class PreApplyBattlerTagImmunityAbAttr extends BaseBattlerTagImmunityAbAttr<PreApplyBattlerTagAbAttrParams> {}

/** Provides immunity to BattlerTags {@linkcode BattlerTag} to the user. */
export class BattlerTagImmunityAbAttr extends PreApplyBattlerTagImmunityAbAttr {}

export interface UserFieldBattlerTagImmunityAbAttrParams extends PreApplyBattlerTagAbAttrParams {
  /** The pokemon that the battler tag is being applied to */
  target: Pokemon;
}

/** Provides immunity to BattlerTags {@linkcode BattlerTag} to the user's field. */
export class UserFieldBattlerTagImmunityAbAttr extends BaseBattlerTagImmunityAbAttr<UserFieldBattlerTagImmunityAbAttrParams> {}

export class ConditionalUserFieldBattlerTagImmunityAbAttr extends UserFieldBattlerTagImmunityAbAttr {
  private readonly condition: (target: Pokemon) => boolean;

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
  private readonly condition: PokemonAttackCondition;

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

export class BlockStatusDamageAbAttr extends CancelInteractionAbAttr {
  private readonly effects: readonly StatusEffect[];

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
 * @remarks
 * Used by Prankster, Gale Wings, Triage, Mycelium Might, and Stall.
 *
 * NB: Quick Claw has a separate and distinct implementation outside of priority
 *
 * @sealed
 */
export class ChangeMovePriorityAbAttr extends AbAttr {
  private readonly moveFunc: (pokemon: Pokemon, move: Move) => boolean;
  private readonly changeAmount: number;

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

export class ChangeMovePriorityInBracketAbAttr extends AbAttr {
  private readonly newModifier: MovePriorityInBracket;
  private readonly moveFunc: (pokemon: Pokemon, move: Move) => boolean;

  constructor(moveFunc: (pokemon: Pokemon, move: Move) => boolean, newModifier: MovePriorityInBracket) {
    super(false);
    this.newModifier = newModifier;
    this.moveFunc = moveFunc;
  }

  override canApply({ pokemon, move }: ChangeMovePriorityAbAttrParams): boolean {
    return this.moveFunc(pokemon, move);
  }

  override apply({ priority }: ChangeMovePriorityAbAttrParams): void {
    priority.value = this.newModifier;
  }
}

export class IgnoreContactAbAttr extends AbAttr {
  private declare readonly _: never;
}

/** Shared interface for attributes that respond to a weather. */
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

/** Base class for abilities that apply an effect before a weather effect is applied. */
export abstract class PreWeatherDamageAbAttr extends PreWeatherEffectAbAttr {}

export class BlockWeatherDamageAttr extends PreWeatherDamageAbAttr {
  private readonly weatherTypes: readonly WeatherType[];

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
 * Displays a message on switch-in containing the highest power Move known by the user's opponents,
 * picking randomly in the case of a tie.
 *
 * @see {@link https://www.smogon.com/dex/sv/abilities/forewarn/}
 * @sealed
 */
export class ForewarnAbAttr extends PostSummonAbAttr {
  constructor() {
    super(true);
  }

  override canApply({ pokemon }: AbAttrBaseParams): boolean {
    return pokemon.getOpponents().some(opp => opp.getMoveset().length > 0);
  }

  override apply({ simulated, pokemon }: AbAttrBaseParams): void {
    if (simulated) {
      return;
    }

    let maxPowerSeen = 0;
    const movesAtMaxPower: string[] = [];

    // Record all moves in all opponents' movesets seen at our max power threshold, clearing it if a new "highest power" is found
    // TODO: Change to `pokemon.getOpponents().flatMap(p => p.getMoveset())` if or when we upgrade to ES2025
    for (const opp of pokemon.getOpponents()) {
      for (const oppMove of opp.getMoveset()) {
        const move = oppMove.getMove();
        const movePower = getForewarnPower(move);
        if (movePower < maxPowerSeen) {
          continue;
        }

        // Another move at current max found; add to tiebreaker array
        if (movePower === maxPowerSeen) {
          movesAtMaxPower.push(move.name);
          continue;
        }

        // New max reached; clear prior results and update tracker
        maxPowerSeen = movePower;
        movesAtMaxPower.splice(0, movesAtMaxPower.length, move.name);
      }
    }

    // Pick a random move in our list.
    if (movesAtMaxPower.length === 0) {
      return;
    }
    const chosenMove = movesAtMaxPower[pokemon.randBattleSeedInt(movesAtMaxPower.length)];
    globalScene.phaseManager.queueMessage(
      i18next.t("abilityTriggers:forewarn", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        moveName: chosenMove,
      }),
    );
  }
}

/**
 * Helper function to return the estimated power used by Forewarn's "highest power" ranking.
 * @param move - The `Move` being checked
 * @returns The "forewarned" power of the move.
 * @see {@link https://www.smogon.com/dex/sv/abilities/forewarn/}
 */
function getForewarnPower(move: Move): number {
  if (move.is("StatusMove")) {
    return 1;
  }

  if (move.hasAttr("OneHitKOAttr")) {
    return 150;
  }

  // NB: Mainline doesn't count Comeuppance in its "counter move exceptions" list, which is dumb
  if (move.hasAttr("CounterDamageAttr")) {
    return 120;
  }

  // All damaging moves with unlisted powers use 80 as a fallback
  if (move.power === -1) {
    return 80;
  }
  return move.power;
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
      for (const opponent of pokemon.getOpponentsGenerator()) {
        globalScene.phaseManager.queueMessage(
          i18next.t("abilityTriggers:frisk", {
            pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
            opponentName: opponent.name,
            opponentAbilityName: opponent.getAbility().name,
          }),
        );
        opponent.revealAbility();
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
 *
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Forecast_(Ability) | Forecast (Bulbapedia)}
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Flower_Gift_(Ability) | Flower Gift (Bulbapedia)}
 *
 * @sealed
 */
export class PostWeatherChangeFormChangeAbAttr extends PostWeatherChangeAbAttr {
  private readonly ability: AbilityId;
  private readonly formRevertingWeathers: readonly WeatherType[];

  constructor(ability: AbilityId, formRevertingWeathers: readonly WeatherType[]) {
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
 * Adds a battler tag to the pokemon when the weather changes.
 * @sealed
 */
export class PostWeatherChangeAddBattlerTagAbAttr extends PostWeatherChangeAbAttr {
  private readonly tagType: BattlerTagType;
  private readonly turnCount: number;
  private readonly weatherTypes: readonly WeatherType[];

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
  private readonly healFactor: number;

  constructor(healFactor: number, ...weatherTypes: WeatherType[]) {
    super(...weatherTypes);

    this.healFactor = healFactor;
  }

  override canApply({ pokemon }: PostWeatherLapseAbAttrParams): boolean {
    return !pokemon.isFullHp();
  }

  override apply({ pokemon, passive, simulated }: PostWeatherLapseAbAttrParams): void {
    const abilityName = (passive ? pokemon.getPassiveAbility() : pokemon.getAbility()).name;
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
  private readonly damageFactor: number;

  constructor(damageFactor: number, ...weatherTypes: WeatherType[]) {
    super(...weatherTypes);

    this.damageFactor = damageFactor;
  }

  override canApply({ pokemon }: PostWeatherLapseAbAttrParams): boolean {
    return !pokemon.hasAbilityWithAttr("BlockNonDirectDamageAbAttr");
  }

  override apply({ simulated, pokemon, passive }: PostWeatherLapseAbAttrParams): void {
    if (!simulated) {
      const abilityName = (passive ? pokemon.getPassiveAbility() : pokemon.getAbility()).name;
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
  private readonly tagType: BattlerTagType;
  private readonly turnCount: number;
  private readonly terrainTypes: readonly TerrainType[];

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
  private readonly effects: readonly StatusEffect[];

  /**
   * @param effects - The status effect(s) that will qualify healing the ability pokemon
   */
  constructor(...effects: StatusEffect[]) {
    super(false);

    this.effects = effects;
  }

  override canApply({ pokemon }: AbAttrBaseParams): boolean {
    return pokemon.status != null && this.effects.includes(pokemon.status.effect) && !pokemon.isFullHp();
  }

  override apply({ simulated, passive, pokemon }: AbAttrBaseParams): void {
    if (!simulated) {
      const abilityName = (passive ? pokemon.getPassiveAbility() : pokemon.getAbility()).name;
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
 * Resets the status of either the user or their ally at the end of each turn.
 *
 * @sealed
 */
export class PostTurnResetStatusAbAttr extends PostTurnAbAttr {
  private readonly allyTarget: boolean;
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
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Harvest_(Ability) | Harvest (Bulbapedia)}
 */
export class PostTurnRestoreBerryAbAttr extends PostTurnAbAttr {
  /**
   * Array containing all {@linkcode BerryType | BerryTypes} that are under cap and able to be restored.
   * Stored inside the class for a minor performance boost
   */
  private berriesUnderCap: readonly BerryType[];
  private readonly procChance: (pokemon: Pokemon) => number;

  /**
   * @param procChance - function providing chance to restore an item
   * @see {@linkcode createEatenBerry}
   */
  constructor(procChance: (pokemon: Pokemon) => number) {
    super();
    this.procChance = procChance;
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
   * Create a new berry chosen randomly from all berries the user consumed in the current battle.
   * @param pokemon - The {@linkcode Pokemon} with this ability
   * @returns Whether a new berry was created
   */
  private createEatenBerry(pokemon: Pokemon): boolean {
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
 *
 * @remarks
 * ⚠️ Must only be used by Cud Chew; do _not_ reuse this attribute for anything else.
 *
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Cud_Chew_(Ability) | Cud Chew (Bulbapedia)}
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
 * @remarks
 * Must be used in conjunction with {@linkcode CudChewConsumeBerryAbAttr}.
 *
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Cud_Chew_(Ability) | Cud Chew (Bulbapedia)}
 * @sealed
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
 * Randomly raises and lowers stats at the end of the turn.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Moody_(Ability) | Moody (Bulbapedia)}
 */
export class MoodyAbAttr extends PostTurnAbAttr {
  constructor() {
    super(true);
  }
  /**
   * Randomly increases one stat stage by 2 and decreases a different stat stage by 1. \
   * Any stat stages at +6 or -6 are excluded from being increased or decreased, respectively. \
   * If the pokemon already has all stat stages raised to 6, it will only decrease one stat stage by 1. \
   * If the pokemon already has all stat stages lowered to -6, it will only increase one stat stage by 2.
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
      const abilityName = (passive ? pokemon.getPassiveAbility() : pokemon.getAbility()).name;
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
  private readonly formFunc: (p: Pokemon) => number;

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
 * Damages sleeping opponents at the end of the turn.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Bad_Dreams_(Ability) | Bad Dreams (Bulbapedia)}
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

    for (const opp of pokemon.getOpponentsGenerator()) {
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
 */
export class FetchBallAbAttr extends PostTurnAbAttr {
  override canApply({ simulated, pokemon }: AbAttrBaseParams): boolean {
    return !simulated && globalScene.currentBattle.lastUsedPokeball != null && pokemon.isPlayer();
  }

  override apply({ pokemon }: AbAttrBaseParams): void {
    const lastUsed = globalScene.currentBattle.lastUsedPokeball!;
    globalScene.pokeballCounts[lastUsed]++;
    globalScene.currentBattle.lastUsedPokeball = null;
    globalScene.phaseManager.queueMessage(
      i18next.t("abilityTriggers:fetchBall", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        pokeballName: getPokeballName(lastUsed),
      }),
    );
  }
}

// TODO: Remove this and just replace it with applying `PostSummonChangeTerrainAbAttr` again
export class PostBiomeChangeAbAttr extends AbAttr {
  private declare readonly _: never;
}

export class PostBiomeChangeWeatherChangeAbAttr extends PostBiomeChangeAbAttr {
  private readonly weatherType: WeatherType;

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

// TODO: Remove this and just replace it with applying `PostSummonChangeTerrainAbAttr` again
/** @sealed */
export class PostBiomeChangeTerrainChangeAbAttr extends PostBiomeChangeAbAttr {
  private readonly terrainType: TerrainType;

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

/** Triggers just after a move is used either by the opponent or the player */
export class PostMoveUsedAbAttr extends AbAttr {
  canApply(_params: Closed<PostMoveUsedAbAttrParams>): boolean {
    return true;
  }

  apply(_params: Closed<PostMoveUsedAbAttrParams>): void {}
}

/** Triggers after a dance move is used either by the opponent or the player */
export class PostDancingMoveAbAttr extends PostMoveUsedAbAttr {
  override canApply({ source, pokemon }: PostMoveUsedAbAttrParams): boolean {
    /** Tags that prevent Dancer from replicating the move */
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

  override apply({ source, pokemon, move, targets, simulated }: PostMoveUsedAbAttrParams): void {
    if (!simulated) {
      // If the move is an AttackMove or a StatusMove the Dancer must replicate the move on the source of the Dance
      if (move.getMove().is("AttackMove") || move.getMove().is("StatusMove")) {
        const target = this.getTarget(pokemon, source, targets);
        globalScene.phaseManager.unshiftNew(
          "MovePhase",
          pokemon,
          target,
          move,
          MoveUseMode.INDIRECT,
          MovePhaseTimingModifier.FIRST,
        );
      } else if (move.getMove().is("SelfStatusMove")) {
        // If the move is a SelfStatusMove (ie. Swords Dance) the Dancer should replicate it on itself
        globalScene.phaseManager.unshiftNew(
          "MovePhase",
          pokemon,
          [pokemon.getBattlerIndex()],
          move,
          MoveUseMode.INDIRECT,
          MovePhaseTimingModifier.FIRST,
        );
      }
    }
  }

  /**
   * Get the correct targets of Dancer ability
   *
   * @param dancer - Pokémon with Dancer ability
   * @param source - The user of the dancing move
   * @param targets - Targets of the dancing move
   */
  private getTarget(dancer: Pokemon, source: Pokemon, targets: BattlerIndex[]): BattlerIndex[] {
    if (dancer.isPlayer()) {
      return source.isPlayer() ? targets : [source.getBattlerIndex()];
    }
    return source.isPlayer() ? [source.getBattlerIndex()] : targets;
  }
}

/** Triggers after the Pokemon loses or consumes an item */
export class PostItemLostAbAttr extends AbAttr {
  canApply(_params: Closed<AbAttrBaseParams>): boolean {
    return true;
  }

  apply(_params: Closed<AbAttrBaseParams>): void {}
}

/** Applies a Battler Tag to the Pokemon after it loses or consumes an item */
export class PostItemLostApplyBattlerTagAbAttr extends PostItemLostAbAttr {
  private readonly tagType: BattlerTagType;
  constructor(tagType: BattlerTagType) {
    super(false);
    this.tagType = tagType;
  }

  override canApply({ pokemon, simulated }: AbAttrBaseParams): boolean {
    return !pokemon.getTag(this.tagType) && !simulated;
  }

  override apply({ pokemon }: AbAttrBaseParams): void {
    pokemon.addTag(this.tagType);
  }
}

export interface StatStageChangeMultiplierAbAttrParams extends AbAttrBaseParams {
  /** Holder for the stages after applying the ability.  */
  numStages: NumberHolder;
}

export class StatStageChangeMultiplierAbAttr extends AbAttr {
  private readonly multiplier: number;

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
  stats: readonly BattleStat[];
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
  protected readonly multiplier: number;
  constructor(multiplier: number) {
    super(false);
    this.multiplier = multiplier;
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
  private readonly healPercent: number;

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
  /**
   * Checks if enemy Pokemon is trapped by an Arena Trap-esque ability
   * If the enemy is a Ghost type, it is not trapped
   * If the enemy has the ability Run Away, it is not trapped.
   * If the user has Magnet Pull and the enemy is not a Steel type, it is not trapped.
   * If the user has Arena Trap and the enemy is not grounded, it is not trapped.
   */
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

/** Shared parameters for ability attributes that trigger after the user faints. */
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
  private readonly formFunc: (p: Pokemon) => number;

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
  private readonly damageRatio: number;

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
    for (const p of inSpeedOrder(ArenaTagSide.BOTH)) {
      applyAbAttrs("FieldPreventExplosiveMovesAbAttr", { pokemon: p, cancelled, simulated });
    }

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
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Innards_Out_(Ability) | Innards Out (Bulbapedia)}
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

/** Base class for abilities that redirect moves to the pokemon with this ability. */
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

/** @sealed */
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
 * @sealed
 */
export class ReduceStatusEffectDurationAbAttr extends AbAttr {
  private readonly statusEffect: StatusEffect;

  constructor(statusEffect: StatusEffect) {
    super(false);

    this.statusEffect = statusEffect;
  }

  override canApply({ statusEffect }: ReduceStatusEffectDurationAbAttrParams): boolean {
    return statusEffect === this.statusEffect;
  }

  override apply({ duration }: ReduceStatusEffectDurationAbAttrParams): void {
    duration.value -= 1;
  }
}

/** Base class for abilities that apply an effect when the user is flinched. */
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
  private readonly stats: readonly BattleStat[];
  private readonly stages: number;

  constructor(stats: readonly BattleStat[], stages: number) {
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
  private readonly multiplier: number;

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
  private readonly moveIgnoreFunc: (pokemon: Pokemon, move: Move) => boolean;

  constructor(moveIgnoreFunc: (pokemon: Pokemon, move: Move) => boolean = () => true) {
    super(false);

    this.moveIgnoreFunc = moveIgnoreFunc;
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
  private readonly defenderType: PokemonType;
  private readonly allowedMoveTypes: readonly PokemonType[];

  constructor(defenderType: PokemonType, allowedMoveTypes: readonly PokemonType[]) {
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
  private readonly statusEffect: readonly StatusEffect[];
  private readonly defenderType: readonly PokemonType[];

  constructor(statusEffect: readonly StatusEffect[], defenderType: readonly PokemonType[]) {
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

/** Gives money to the user after the battle. */
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
  private readonly arenaTagType: ArenaTagType;

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
  private readonly multiplier: number;
  private readonly tagType: BattlerTagType;
  private readonly recoilDamageFunc?: (pokemon: Pokemon) => number;
  private readonly triggerMessageFunc: (pokemon: Pokemon, abilityName: string) => string;

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
    this.triggerMessageFunc = triggerMessageFunc;
    if (recoilDamageFunc != null) {
      this.recoilDamageFunc = recoilDamageFunc;
    }
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
    return pokemon.summonData.illusion != null;
  }
}

/** @sealed */
export class IllusionBreakAbAttr extends AbAttr {
  private declare readonly _: never;
  // TODO: Consider adding a `canApply` method that checks if the pokemon has an active illusion
  override apply({ pokemon }: AbAttrBaseParams): void {
    pokemon.breakIllusion();
  }
}

/** @sealed */
export class PostDefendIllusionBreakAbAttr extends PostDefendAbAttr {
  override apply({ pokemon }: PostMoveInteractionAbAttrParams): void {
    pokemon.breakIllusion();
  }

  override canApply({ pokemon, hitResult }: PostMoveInteractionAbAttrParams): boolean {
    // TODO: I remember this or a derivative being declared elsewhere - merge the 2 into 1
    // and store it somewhere globally accessible
    const damagingHitResults: ReadonlySet<HitResult> = new Set([
      HitResult.EFFECTIVE,
      HitResult.SUPER_EFFECTIVE,
      HitResult.NOT_VERY_EFFECTIVE,
      HitResult.ONE_HIT_KO,
    ]);
    return damagingHitResults.has(hitResult) && pokemon.summonData.illusion != null;
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

/**
 * If a Pokémon with this Ability selects a damaging move, it has a 30% chance of going first in its priority bracket. If the Ability activates, this is announced at the start of the turn (after move selection).
 * @sealed
 */
export class BypassSpeedChanceAbAttr extends AbAttr {
  public readonly chance: number;

  /**
   * @param chance - Probability of the ability activating
   */
  constructor(chance: number) {
    super(true);
    this.chance = chance;
  }

  override canApply({ simulated, pokemon }: AbAttrBaseParams): boolean {
    // TODO: Consider whether we can move the simulated check to the `apply` method
    // May be difficult as we likely do not want to modify the randBattleSeed
    const turnCommand = globalScene.currentBattle.turnCommands[pokemon.getBattlerIndex()];
    const move = turnCommand?.move?.move ? allMoves[turnCommand.move.move] : null;
    const isDamageMove = move?.category === MoveCategory.PHYSICAL || move?.category === MoveCategory.SPECIAL;
    return (
      !simulated
      && pokemon.randBattleSeedInt(100) < this.chance
      && isDamageMove
      && pokemon.canAddTag(BattlerTagType.BYPASS_SPEED)
    );
  }

  /**
   * bypass move order in their priority bracket when pokemon choose damaging move
   */
  override apply({ pokemon }: AbAttrBaseParams): void {
    pokemon.addTag(BattlerTagType.BYPASS_SPEED);
  }

  override getTriggerMessage({ pokemon }: AbAttrBaseParams, _abilityName: string): string {
    return i18next.t("abilityTriggers:quickDraw", { pokemonName: getPokemonNameWithAffix(pokemon) });
  }
}

export interface PreventBypassSpeedChanceAbAttrParams extends AbAttrBaseParams {
  /** Holds whether the speed check is bypassed after ability application */
  bypass: BooleanHolder;
}

/**
 * This attribute checks if a Pokemon's move meets a provided condition to determine if the Pokemon can use Quick Claw
 * It was created because Pokemon with the ability Mycelium Might cannot access Quick Claw's benefits when using status moves.
 * @sealed
 */
export class PreventBypassSpeedChanceAbAttr extends AbAttr {
  private readonly condition: (pokemon: Pokemon, move: Move) => boolean;

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

  override apply({ bypass }: PreventBypassSpeedChanceAbAttrParams): void {
    bypass.value = false;
  }
}

// Also consider making this a postTerrainChange attribute instead of a post-summon attribute
/**
 * This applies a terrain-based type change to the Pokemon.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Mimicry_(Ability) | Mimicry (Bulbapedia)}
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
    const currentTerrain = globalScene.arena.terrainType;
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
   * @returns the type(s) the Pokemon should change to based on the terrain
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
    const currentTerrain = globalScene.arena.terrainType;
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
  private readonly switchType: SwitchType;
  constructor(switchType: SwitchType) {
    this.switchType = switchType;
  }

  /**
   * Handles the logic for switching out a Pokémon based on battle conditions, HP, and the switch type.
   *
   * @param pokemon - The Pokémon attempting to switch out.
   * @returns `true` if the switch is successful
   */
  // TODO: Make this cancel pending move phases on the switched out target
  public switchOutLogic(pokemon: Pokemon): boolean {
    const switchOutTarget = pokemon;
    /*
     * If the switch-out target is a player-controlled Pokémon, the function checks:
     * - Whether there are available party members to switch in.
     * - If the Pokémon is still alive (hp > 0), and if so, it leaves the field and a new SwitchPhase is initiated.
     */
    if (switchOutTarget.isPlayer()) {
      if (globalScene.getPlayerParty().filter(p => p.isAllowedInBattle() && !p.isOnField()).length === 0) {
        return false;
      }

      if (switchOutTarget.hp > 0) {
        globalScene.phaseManager.queueDeferred(
          "SwitchPhase",
          this.switchType,
          switchOutTarget.getFieldIndex(),
          true,
          true,
        );
        return true;
      }
      /*
       * For non-wild battles, it checks if the opposing party has any available Pokémon to switch in.
       * If yes, the Pokémon leaves the field and a new SwitchSummonPhase is initiated.
       */
    } else if (globalScene.currentBattle.battleType !== BattleType.WILD) {
      if (globalScene.getEnemyParty().filter(p => p.isAllowedInBattle() && !p.isOnField()).length === 0) {
        return false;
      }
      if (switchOutTarget.hp > 0) {
        const summonIndex = globalScene.currentBattle.trainer
          ? globalScene.currentBattle.trainer.getNextSummonIndex((switchOutTarget as EnemyPokemon).trainerSlot)
          : 0;
        globalScene.phaseManager.queueDeferred(
          "SwitchSummonPhase",
          this.switchType,
          switchOutTarget.getFieldIndex(),
          summonIndex,
          false,
          false,
        );
        return true;
      }
      /*
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
        if (globalScene.currentBattle.double && allyPokemon != null) {
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
   * @param pokemon - The Pokémon attempting to switch out
   * @param opponent - The opponent Pokémon
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
 * Calculate the amount of recovery from the Shell Bell item.
 * @remarks
 * If the Pokémon is holding a Shell Bell, this function computes the amount of health
 * recovered based on the damage dealt in the current turn. \
 * The recovery is multiplied by the Shell Bell's modifier (if any).
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

/** Triggers after the Pokemon takes any damage */
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
 * @sealed
 */
export class PostDamageForceSwitchAbAttr extends PostDamageAbAttr {
  private readonly helper: ForceSwitchOutHelper = new ForceSwitchOutHelper(SwitchType.SWITCH);
  private readonly hpRatio: number;

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
 * @returns all Pokémon on field that have weather-based forms
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

export function getWeatherCondition(...weatherTypes: WeatherType[]): AbAttrCondition {
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

/** Map of all ability attribute constructors, for use with the `.is` method. */
export const AbilityAttrs = Object.freeze({
  AddSecondStrikeAbAttr,
  AlliedFieldDamageReductionAbAttr,
  AllyMoveCategoryPowerBoostAbAttr,
  AllyStatMultiplierAbAttr,
  AlwaysHitAbAttr,
  ArenaTrapAbAttr,
  AttackTypeImmunityAbAttr,
  BattlerTagImmunityAbAttr,
  BlockCritAbAttr,
  BlockItemTheftAbAttr,
  BlockNonDirectDamageAbAttr,
  BlockOneHitKOAbAttr,
  BlockRecoilDamageAttr,
  BlockRedirectAbAttr,
  BlockStatusDamageAbAttr,
  BonusCritAbAttr,
  BypassBurnDamageReductionAbAttr,
  BypassSpeedChanceAbAttr,
  ChangeMovePriorityAbAttr,
  ChangeMovePriorityInBracketAbAttr,
  CheckTrappedAbAttr,
  ClearTerrainAbAttr,
  ClearWeatherAbAttr,
  CommanderAbAttr,
  ConditionalCritAbAttr,
  ConditionalUserFieldBattlerTagImmunityAbAttr,
  ConditionalUserFieldProtectStatAbAttr,
  ConditionalUserFieldStatusEffectImmunityAbAttr,
  ConfusionOnStatusEffectAbAttr,
  CopyFaintedAllyAbilityAbAttr,
  CudChewConsumeBerryAbAttr,
  CudChewRecordBerryAbAttr,
  DoubleBattleChanceAbAttr,
  DoubleBerryEffectAbAttr,
  DownloadAbAttr,
  EffectSporeAbAttr,
  ExecutedMoveAbAttr,
  FetchBallAbAttr,
  FieldMovePowerBoostAbAttr,
  FieldMoveTypePowerBoostAbAttr,
  FieldMultiplyStatAbAttr,
  FieldPreventExplosiveMovesAbAttr,
  FieldPriorityMoveImmunityAbAttr,
  FlinchEffectAbAttr,
  FlinchStatStageChangeAbAttr,
  ForceSwitchOutImmunityAbAttr,
  ForewarnAbAttr,
  FormBlockDamageAbAttr,
  FriskAbAttr,
  FullHpResistTypeAbAttr,
  GorillaTacticsAbAttr,
  HealFromBerryUseAbAttr,
  IgnoreContactAbAttr,
  IgnoreMoveEffectsAbAttr,
  IgnoreOpponentStatStagesAbAttr,
  IgnoreProtectOnContactAbAttr,
  IgnoreTypeImmunityAbAttr,
  IgnoreTypeStatusEffectImmunityAbAttr,
  IllusionBreakAbAttr,
  IllusionPostBattleAbAttr,
  IllusionPreSummonAbAttr,
  IncreasePpAbAttr,
  InfiltratorAbAttr,
  IntimidateImmunityAbAttr,
  LowHpMoveTypePowerBoostAbAttr,
  MaxMultiHitAbAttr,
  MoneyAbAttr,
  MoodyAbAttr,
  MoveAbilityBypassAbAttr,
  MoveDamageBoostAbAttr,
  MoveEffectChanceMultiplierAbAttr,
  MoveImmunityAbAttr,
  MoveImmunityStatStageChangeAbAttr,
  MovePowerBoostAbAttr,
  MoveTypeChangeAbAttr,
  MoveTypePowerBoostAbAttr,
  MultCritAbAttr,
  NoFusionAbilityAbAttr,
  NoTransformAbilityAbAttr,
  NonSuperEffectiveImmunityAbAttr,
  PokemonTypeChangeAbAttr,
  PostAttackAbAttr,
  PostAttackApplyBattlerTagAbAttr,
  PostAttackApplyStatusEffectAbAttr,
  PostAttackContactApplyStatusEffectAbAttr,
  PostAttackStealHeldItemAbAttr,
  PostBattleAbAttr,
  PostBattleInitAbAttr,
  PostBattleInitFormChangeAbAttr,
  PostBattleLootAbAttr,
  PostBiomeChangeAbAttr,
  PostBiomeChangeTerrainChangeAbAttr,
  PostBiomeChangeWeatherChangeAbAttr,
  PostDamageAbAttr,
  PostDamageForceSwitchAbAttr,
  PostDancingMoveAbAttr,
  PostDefendAbAttr,
  PostDefendAbilityGiveAbAttr,
  PostDefendAbilitySwapAbAttr,
  PostDefendApplyArenaTrapTagAbAttr,
  PostDefendApplyBattlerTagAbAttr,
  PostDefendContactApplyStatusEffectAbAttr,
  PostDefendContactApplyTagChanceAbAttr,
  PostDefendContactDamageAbAttr,
  PostDefendHpGatedStatStageChangeAbAttr,
  PostDefendIllusionBreakAbAttr,
  PostDefendMoveDisableAbAttr,
  PostDefendPerishSongAbAttr,
  PostDefendStatStageChangeAbAttr,
  PostDefendStealHeldItemAbAttr,
  PostDefendTerrainChangeAbAttr,
  PostDefendTypeChangeAbAttr,
  PostDefendWeatherChangeAbAttr,
  PostFaintAbAttr,
  PostFaintContactDamageAbAttr,
  PostFaintHPDamageAbAttr,
  PostFaintUnsuppressedWeatherFormChangeAbAttr,
  PostIntimidateStatStageChangeAbAttr,
  PostItemLostAbAttr,
  PostItemLostApplyBattlerTagAbAttr,
  PostKnockOutAbAttr,
  PostKnockOutStatStageChangeAbAttr,
  PostMoveUsedAbAttr,
  PostReceiveCritStatStageChangeAbAttr,
  PostSetStatusAbAttr,
  PostStatStageChangeAbAttr,
  PostStatStageChangeStatStageChangeAbAttr,
  PostSummonAbAttr,
  PostSummonAddArenaTagAbAttr,
  PostSummonAddBattlerTagAbAttr,
  PostSummonAllyHealAbAttr,
  PostSummonClearAllyStatStagesAbAttr,
  PostSummonCopyAbilityAbAttr,
  PostSummonCopyAllyStatsAbAttr,
  PostSummonFormChangeAbAttr,
  PostSummonFormChangeByWeatherAbAttr,
  PostSummonHealStatusAbAttr,
  PostSummonMessageAbAttr,
  PostSummonRemoveArenaTagAbAttr,
  PostSummonRemoveBattlerTagAbAttr,
  PostSummonRemoveEffectAbAttr,
  PostSummonStatStageChangeAbAttr,
  PostSummonStatStageChangeOnArenaAbAttr,
  PostSummonTerrainChangeAbAttr,
  PostSummonTransformAbAttr,
  PostSummonUnnamedMessageAbAttr,
  PostSummonUserFieldRemoveStatusEffectAbAttr,
  PostSummonWeatherChangeAbAttr,
  PostSummonWeatherSuppressedFormChangeAbAttr,
  PostTeraFormChangeStatChangeAbAttr,
  PostTerrainChangeAbAttr,
  PostTurnAbAttr,
  PostTurnFormChangeAbAttr,
  PostTurnHealAbAttr,
  PostTurnHurtIfSleepingAbAttr,
  PostTurnResetStatusAbAttr,
  PostTurnRestoreBerryAbAttr,
  PostTurnStatusHealAbAttr,
  PostVictoryAbAttr,
  PostVictoryFormChangeAbAttr,
  PostWeatherChangeAbAttr,
  PostWeatherChangeFormChangeAbAttr,
  PostWeatherLapseAbAttr,
  PostWeatherLapseDamageAbAttr,
  PostWeatherLapseHealAbAttr,
  PreApplyBattlerTagAbAttr,
  PreApplyBattlerTagImmunityAbAttr,
  PreAttackAbAttr,
  PreAttackFieldMoveTypePowerBoostAbAttr,
  PreDefendAbAttr,
  PreDefendFullHpEndureAbAttr,
  PreLeaveFieldAbAttr,
  PreLeaveFieldClearWeatherAbAttr,
  PreLeaveFieldRemoveSuppressAbilitiesSourceAbAttr,
  PreSetStatusAbAttr,
  PreSetStatusEffectImmunityAbAttr,
  PreStatStageChangeAbAttr,
  PreSummonAbAttr,
  PreSwitchOutAbAttr,
  PreSwitchOutFormChangeAbAttr,
  PreSwitchOutHealAbAttr,
  PreSwitchOutResetStatusAbAttr,
  PreWeatherDamageAbAttr,
  PreWeatherEffectAbAttr,
  PreventBerryUseAbAttr,
  PreventBypassSpeedChanceAbAttr,
  ProtectStatAbAttr,
  ReceivedMoveDamageMultiplierAbAttr,
  ReceivedTypeDamageMultiplierAbAttr,
  RedirectMoveAbAttr,
  RedirectTypeMoveAbAttr,
  ReduceBerryUseThresholdAbAttr,
  ReduceBurnDamageAbAttr,
  ReduceStatusEffectDurationAbAttr,
  ReflectStatStageChangeAbAttr,
  ReflectStatusMoveAbAttr,
  ReverseDrainAbAttr,
  RunSuccessAbAttr,
  SpeedBoostAbAttr,
  StabBoostAbAttr,
  StatMultiplierAbAttr,
  StatStageChangeCopyAbAttr,
  StatStageChangeMultiplierAbAttr,
  StatusEffectImmunityAbAttr,
  SuppressWeatherEffectAbAttr,
  SyncEncounterNatureAbAttr,
  SynchronizeStatusAbAttr,
  TerrainEventTypeChangeAbAttr,
  TypeImmunityAbAttr,
  TypeImmunityHealAbAttr,
  UserFieldBattlerTagImmunityAbAttr,
  UserFieldMoveTypePowerBoostAbAttr,
  UserFieldStatusEffectImmunityAbAttr,
  VariableMovePowerAbAttr,
  VariableMovePowerBoostAbAttr,
  WeightMultiplierAbAttr,
  WonderSkinAbAttr,
});

/** A map of of all {@linkcode AbAttr} constructors */
export type AbAttrConstructorMap = typeof AbilityAttrs;
