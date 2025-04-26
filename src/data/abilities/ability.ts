import { HitResult, MoveResult, PlayerPokemon } from "#app/field/pokemon";
import { BooleanHolder, NumberHolder, toDmgValue, isNullOrUndefined, randSeedItem, randSeedInt, type Constructor } from "#app/utils/common";
import { getPokemonNameWithAffix } from "#app/messages";
import { BattlerTagLapseType, GroundedTag } from "#app/data/battler-tags";
import { getNonVolatileStatusEffects, getStatusEffectDescriptor, getStatusEffectHealText } from "#app/data/status-effect";
import { Gender } from "#app/data/gender";
import {
  AttackMove,
  FlinchAttr,
  OneHitKOAttr,
  HitHealAttr,
  allMoves,
  StatusMove,
  SelfStatusMove,
  VariablePowerAttr,
  applyMoveAttrs,
  VariableMoveTypeAttr,
  RandomMovesetMoveAttr,
  RandomMoveAttr,
  NaturePowerAttr,
  CopyMoveAttr,
  NeutralDamageAgainstFlyingTypeMultiplierAttr,
  FixedDamageAttr,
} from "#app/data/moves/move";
import { ArenaTagSide } from "#app/data/arena-tag";
import { BerryModifier, HitHealModifier, PokemonHeldItemModifier } from "#app/modifier/modifier";
import { TerrainType } from "#app/data/terrain";
import { SpeciesFormChangeAbilityTrigger, SpeciesFormChangeRevertWeatherFormTrigger, SpeciesFormChangeWeatherTrigger } from "#app/data/pokemon-forms";
import i18next from "i18next";
import { Command } from "#app/ui/command-ui-handler";
import { BerryModifierType } from "#app/modifier/modifier-type";
import { getPokeballName } from "#app/data/pokeball";
import { BattleType } from "#enums/battle-type";
import { MovePhase } from "#app/phases/move-phase";
import { PokemonHealPhase } from "#app/phases/pokemon-heal-phase";
import { StatStageChangePhase } from "#app/phases/stat-stage-change-phase";
import { globalScene } from "#app/global-scene";
import { SwitchPhase } from "#app/phases/switch-phase";
import { SwitchSummonPhase } from "#app/phases/switch-summon-phase";
import { BattleEndPhase } from "#app/phases/battle-end-phase";
import { NewBattlePhase } from "#app/phases/new-battle-phase";
import { MoveEndPhase } from "#app/phases/move-end-phase";
import { PokemonTransformPhase } from "#app/phases/pokemon-transform-phase";
import { allAbilities } from "#app/data/data-lists";
import { AbAttr } from "#app/data/abilities/ab-attrs/ab-attr";
import { Ability } from "#app/data/abilities/ability-class";
import { TrainerVariant } from "#app/field/trainer";

// Enum imports
import { Stat, type BattleStat , BATTLE_STATS, EFFECTIVE_STATS, getStatKey, type EffectiveStat } from "#enums/stat";
import { PokemonType } from "#enums/pokemon-type";
import { PokemonAnimType } from "#enums/pokemon-anim-type";
import { StatusEffect } from "#enums/status-effect";
import { WeatherType } from "#enums/weather-type";
import { Abilities } from "#enums/abilities";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { SwitchType } from "#enums/switch-type";
import { MoveFlags } from "#enums/MoveFlags";
import { MoveTarget } from "#enums/MoveTarget";
import { MoveCategory } from "#enums/MoveCategory";


// Type imports
import type { EnemyPokemon, PokemonMove } from "#app/field/pokemon";
import type Pokemon from "#app/field/pokemon";
import type { Weather } from "#app/data/weather";
import type { BattlerTag } from "#app/data/battler-tags";
import type { AbAttrCondition, PokemonDefendCondition, PokemonStatStageChangeCondition, PokemonAttackCondition, AbAttrApplyFunc, AbAttrSuccessFunc } from "#app/@types/ability-types";
import type { BattlerIndex } from "#app/battle";
import type Move from "#app/data/moves/move";
import type { ArenaTrapTag, SuppressAbilitiesTag } from "#app/data/arena-tag";
import { SelectBiomePhase } from "#app/phases/select-biome-phase";

export class BlockRecoilDamageAttr extends AbAttr {
  constructor() {
    super(false);
  }

  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder, args: any[]): void {
    cancelled.value = true;
  }

  getTriggerMessage(pokemon: Pokemon, abilityName: string, ..._args: any[]) {
    return i18next.t("abilityTriggers:blockRecoilDamage", { pokemonName: getPokemonNameWithAffix(pokemon), abilityName: abilityName });
  }
}

/**
 * Attribute for abilities that increase the chance of a double battle
 * occurring.
 * @see {@linkcode apply}
 */
export class DoubleBattleChanceAbAttr extends AbAttr {
  constructor() {
    super(false);
  }

  /**
   * Increases the chance of a double battle occurring
   * @param args [0] {@linkcode NumberHolder} for double battle chance
   */
  override apply(_pokemon: Pokemon, _passive: boolean, _simulated: boolean, _cancelled: BooleanHolder, args: any[]): void {
    const doubleBattleChance = args[0] as NumberHolder;
    // This is divided because the chance is generated as a number from 0 to doubleBattleChance.value using Utils.randSeedInt
    // A double battle will initiate if the generated number is 0
    doubleBattleChance.value = doubleBattleChance.value / 4;
  }
}

export class PostBattleInitAbAttr extends AbAttr {
  canApplyPostBattleInit(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return true;
  }

  applyPostBattleInit(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {}
}

export class PostBattleInitFormChangeAbAttr extends PostBattleInitAbAttr {
  private formFunc: (p: Pokemon) => number;

  constructor(formFunc: ((p: Pokemon) => number)) {
    super(false);

    this.formFunc = formFunc;
  }

  override canApplyPostBattleInit(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    const formIndex = this.formFunc(pokemon);
    return formIndex !== pokemon.formIndex && !simulated;
  }

  override applyPostBattleInit(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
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

  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder | null, args: any[]): void {
    const statStageChangePhases: StatStageChangePhase[] = [];

    if (!simulated) {
      statStageChangePhases.push(new StatStageChangePhase(pokemon.getBattlerIndex(), true, this.stats, this.stages));

      for (const statStageChangePhase of statStageChangePhases) {
        globalScene.unshiftPhase(statStageChangePhase);
      }
    }
  }
}

/**
 * Clears a specified weather whenever this attribute is called.
 */
export class ClearWeatherAbAttr extends AbAttr {
  private weather: WeatherType[];

  /**
   * @param weather {@linkcode WeatherType[]} - the weather to be removed
   */
  constructor(weather: WeatherType[]) {
    super(true);

    this.weather = weather;
  }

  public override canApply(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return globalScene.arena.canSetWeather(WeatherType.NONE);
  }

  public override apply(pokemon: Pokemon, passive: boolean, simulated:boolean, cancelled: BooleanHolder, args: any[]): void {
    if (!simulated) {
      globalScene.arena.trySetWeather(WeatherType.NONE, pokemon);
    }
  }
}

/**
 * Clears a specified terrain whenever this attribute is called.
 */
export class ClearTerrainAbAttr extends AbAttr {
  private terrain: TerrainType[];

  /**
   * @param terrain {@linkcode TerrainType[]} - the terrain to be removed
   */
  constructor(terrain: TerrainType[]) {
    super(true);

    this.terrain = terrain;
  }

  public override canApply(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return globalScene.arena.canSetTerrain(TerrainType.NONE);
  }

  public override apply(pokemon: Pokemon, passive: boolean, simulated:boolean, cancelled: BooleanHolder, args: any[]): void {
    if (!simulated) {
      globalScene.arena.trySetTerrain(TerrainType.NONE, true, pokemon);
    }
  }
}

type PreDefendAbAttrCondition = (pokemon: Pokemon, attacker: Pokemon, move: Move) => boolean;

export class PreDefendAbAttr extends AbAttr {
  canApplyPreDefend(
    pokemon: Pokemon,
    passive: boolean,
    simulated: boolean,
    attacker: Pokemon,
    move: Move | null,
    cancelled: BooleanHolder | null,
    args: any[]): boolean {
    return true;
  }

  applyPreDefend(
    pokemon: Pokemon,
    passive: boolean,
    simulated: boolean,
    attacker: Pokemon,
    move: Move | null,
    cancelled: BooleanHolder | null,
    args: any[],
  ): void {}
}

export class PreDefendFullHpEndureAbAttr extends PreDefendAbAttr {
  override canApplyPreDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move | null, cancelled: BooleanHolder | null, args: any[]): boolean {
    return pokemon.isFullHp()
    && pokemon.getMaxHp() > 1 //Checks if pokemon has wonder_guard (which forces 1hp)
    && (args[0] as NumberHolder).value >= pokemon.hp; //Damage >= hp
  }

  override applyPreDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, cancelled: BooleanHolder, args: any[]): void {
    if (!simulated) {
      pokemon.addTag(BattlerTagType.STURDY, 1);
    }
  }
}

export class BlockItemTheftAbAttr extends AbAttr {
  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder, args: any[]): void {
    cancelled.value = true;
  }

  getTriggerMessage(pokemon: Pokemon, abilityName: string, ...args: any[]) {
    return i18next.t("abilityTriggers:blockItemTheft", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      abilityName
    });
  }
}

export class StabBoostAbAttr extends AbAttr {
  constructor() {
    super(false);
  }

  override canApply(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return (args[0] as NumberHolder).value > 1;
  }

  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder, args: any[]): void {
    (args[0] as NumberHolder).value += 0.5;
  }
}

export class ReceivedMoveDamageMultiplierAbAttr extends PreDefendAbAttr {
  protected condition: PokemonDefendCondition;
  private damageMultiplier: number;

  constructor(condition: PokemonDefendCondition, damageMultiplier: number, showAbility: boolean = false) {
    super(showAbility);

    this.condition = condition;
    this.damageMultiplier = damageMultiplier;
  }

  override canApplyPreDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, cancelled: BooleanHolder | null, args: any[]): boolean {
    return this.condition(pokemon, attacker, move);
  }

  override applyPreDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, cancelled: BooleanHolder, args: any[]): void {
    (args[0] as NumberHolder).value = toDmgValue((args[0] as NumberHolder).value * this.damageMultiplier);
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
   * Handles the damage reduction
   * @param args
   * - `[0]` {@linkcode NumberHolder} - The damage being dealt
   */
  override applyPreDefend(_pokemon: Pokemon, _passive: boolean, _simulated: boolean, _attacker: Pokemon, _move: Move, _cancelled: BooleanHolder, args: any[]): void {
    const damage = args[0] as NumberHolder;
    damage.value = toDmgValue(damage.value * this.damageMultiplier);
  }
}

export class ReceivedTypeDamageMultiplierAbAttr extends ReceivedMoveDamageMultiplierAbAttr {
  constructor(moveType: PokemonType, damageMultiplier: number) {
    super((target, user, move) => user.getMoveType(move) === moveType, damageMultiplier, false);
  }
}

/**
 * Determines whether a Pokemon is immune to a move because of an ability.
 * @extends PreDefendAbAttr
 * @see {@linkcode applyPreDefend}
 * @see {@linkcode getCondition}
 */
export class TypeImmunityAbAttr extends PreDefendAbAttr {
  private immuneType: PokemonType | null;
  private condition: AbAttrCondition | null;

  constructor(immuneType: PokemonType | null, condition?: AbAttrCondition) {
    super(true);

    this.immuneType = immuneType;
    this.condition = condition ?? null;
  }

  override canApplyPreDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, cancelled: BooleanHolder | null, args: any[]): boolean {
    return ![ MoveTarget.BOTH_SIDES, MoveTarget.ENEMY_SIDE, MoveTarget.USER_SIDE ].includes(move.moveTarget) && attacker !== pokemon && attacker.getMoveType(move) === this.immuneType;
  }

  /**
   * Applies immunity if this ability grants immunity to the type of the given move.
   * @param pokemon {@linkcode Pokemon} The defending Pokemon.
   * @param passive - Whether the ability is passive.
   * @param attacker {@linkcode Pokemon} The attacking Pokemon.
   * @param move {@linkcode Move} The attacking move.
   * @param cancelled {@linkcode BooleanHolder} - A holder for a boolean value indicating if the move was cancelled.
   * @param args [0] {@linkcode NumberHolder} gets set to 0 if move is immuned by an ability.
   * @param args [1] - Whether the move is simulated.
   */
  override applyPreDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, cancelled: BooleanHolder, args: any[]): void {
    (args[0] as NumberHolder).value = 0;
  }

  getImmuneType(): PokemonType | null {
    return this.immuneType;
  }

  override getCondition(): AbAttrCondition | null {
    return this.condition;
  }
}

export class AttackTypeImmunityAbAttr extends TypeImmunityAbAttr {
  constructor(immuneType: PokemonType, condition?: AbAttrCondition) {
    super(immuneType, condition);
  }

  override canApplyPreDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, cancelled: BooleanHolder | null, args: any[]): boolean {
    return move.category !== MoveCategory.STATUS && !move.hasAttr(NeutralDamageAgainstFlyingTypeMultiplierAttr)
            && super.canApplyPreDefend(pokemon, passive, simulated, attacker, move, cancelled, args);
  }

  /**
   * Applies immunity if the move used is not a status move.
   * Type immunity abilities that do not give additional benefits (HP recovery, stat boosts, etc) are not immune to status moves of the type
   * Example: Levitate
   */
  override applyPreDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, cancelled: BooleanHolder, args: any[]): void {
    // this is a hacky way to fix the Levitate/Thousand Arrows interaction, but it works for now...
    super.applyPreDefend(pokemon, passive, simulated, attacker, move, cancelled, args);
  }
}

export class TypeImmunityHealAbAttr extends TypeImmunityAbAttr {
  constructor(immuneType: PokemonType) {
    super(immuneType);
  }

  override canApplyPreDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, cancelled: BooleanHolder | null, args: any[]): boolean {
    return super.canApplyPreDefend(pokemon, passive, simulated, attacker, move, cancelled, args);
  }

  override applyPreDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, cancelled: BooleanHolder, args: any[]): void {
    super.applyPreDefend(pokemon, passive, simulated, attacker, move, cancelled, args);
    if (!pokemon.isFullHp() && !simulated) {
      const abilityName = (!passive ? pokemon.getAbility() : pokemon.getPassiveAbility()).name;
      globalScene.unshiftPhase(new PokemonHealPhase(pokemon.getBattlerIndex(),
        toDmgValue(pokemon.getMaxHp() / 4), i18next.t("abilityTriggers:typeImmunityHeal", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon), abilityName }), true));
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

  override canApplyPreDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, cancelled: BooleanHolder | null, args: any[]): boolean {
    return super.canApplyPreDefend(pokemon, passive, simulated, attacker, move, cancelled, args);
  }

  override applyPreDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, cancelled: BooleanHolder, args: any[]): void {
    super.applyPreDefend(pokemon, passive, simulated, attacker, move, cancelled, args);
    cancelled.value = true; // Suppresses "No Effect" message
    if (!simulated) {
      globalScene.unshiftPhase(new StatStageChangePhase(pokemon.getBattlerIndex(), true, [ this.stat ], this.stages));
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

  override canApplyPreDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, cancelled: BooleanHolder | null, args: any[]): boolean {
    return super.canApplyPreDefend(pokemon, passive, simulated, attacker, move, cancelled, args);
  }

  override applyPreDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, cancelled: BooleanHolder, args: any[]): void {
    super.applyPreDefend(pokemon, passive, simulated, attacker, move, cancelled, args);
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

  override canApplyPreDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, cancelled: BooleanHolder | null, args: any[]): boolean {
    const modifierValue = args.length > 0
      ? (args[0] as NumberHolder).value
      : pokemon.getAttackTypeEffectiveness(attacker.getMoveType(move), attacker, undefined, undefined, move);
    return move instanceof AttackMove && modifierValue < 2;
  }

  override applyPreDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, cancelled: BooleanHolder, args: any[]): void {
    cancelled.value = true; // Suppresses "No Effect" message
    (args[0] as NumberHolder).value = 0;
  }

  getTriggerMessage(pokemon: Pokemon, abilityName: string, ...args: any[]): string {
    return i18next.t("abilityTriggers:nonSuperEffectiveImmunity", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      abilityName
    });
  }
}

/**
 * Attribute implementing the effects of {@link https://bulbapedia.bulbagarden.net/wiki/Tera_Shell_(Ability) | Tera Shell}
 * When the source is at full HP, incoming attacks will have a maximum 0.5x type effectiveness multiplier.
 * @extends PreDefendAbAttr
 */
export class FullHpResistTypeAbAttr extends PreDefendAbAttr {

  override canApplyPreDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move | null, cancelled: BooleanHolder | null, args: any[]): boolean {
    const typeMultiplier = args[0];
    return (typeMultiplier && typeMultiplier instanceof NumberHolder) && !(move && move.hasAttr(FixedDamageAttr)) && pokemon.isFullHp() && typeMultiplier.value > 0.5;
  }

  /**
   * Reduces a type multiplier to 0.5 if the source is at full HP.
   * @param pokemon {@linkcode Pokemon} the Pokemon with this ability
   * @param passive n/a
   * @param simulated n/a (this doesn't change game state)
   * @param attacker n/a
   * @param move {@linkcode Move} the move being used on the source
   * @param cancelled n/a
   * @param args `[0]` a container for the move's current type effectiveness multiplier
   */
  override applyPreDefend(
    pokemon: Pokemon,
    passive: boolean,
    simulated: boolean,
    attacker: Pokemon,
    move: Move | null,
    cancelled: BooleanHolder | null,
    args: any[]): void {
    const typeMultiplier = args[0];
    typeMultiplier.value = 0.5;
    pokemon.turnData.moveEffectiveness = 0.5;
  }

  getTriggerMessage(pokemon: Pokemon, abilityName: string, ...args: any[]): string {
    return i18next.t("abilityTriggers:fullHpResistType", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon)
    });
  }
}

export class PostDefendAbAttr extends AbAttr {
  canApplyPostDefend(
    pokemon: Pokemon,
    passive: boolean,
    simulated: boolean,
    attacker: Pokemon,
    move: Move,
    hitResult: HitResult | null,
    args: any[]): boolean {
    return true;
  }

  applyPostDefend(
    pokemon: Pokemon,
    passive: boolean,
    simulated: boolean,
    attacker: Pokemon,
    move: Move,
    hitResult: HitResult | null,
    args: any[],
  ): void {}
}

export class FieldPriorityMoveImmunityAbAttr extends PreDefendAbAttr {

  override canApplyPreDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, cancelled: BooleanHolder | null, args: any[]): boolean {
    return !(move.moveTarget === MoveTarget.USER || move.moveTarget === MoveTarget.NEAR_ALLY) && move.getPriority(attacker) > 0 && !move.isMultiTarget();
  }

  override applyPreDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, cancelled: BooleanHolder, args: any[]): void {
    cancelled.value = true;
  }
}

export class PostStatStageChangeAbAttr extends AbAttr {
  canApplyPostStatStageChange(
    pokemon: Pokemon,
    simulated: boolean,
    statsChanged: BattleStat[],
    stagesChanged: number,
    selfTarget: boolean,
    args: any[]): boolean {
    return true;
  }

  applyPostStatStageChange(
    pokemon: Pokemon,
    simulated: boolean,
    statsChanged: BattleStat[],
    stagesChanged: number,
    selfTarget: boolean,
    args: any[],
  ): void {}
}

export class MoveImmunityAbAttr extends PreDefendAbAttr {
  private immuneCondition: PreDefendAbAttrCondition;

  constructor(immuneCondition: PreDefendAbAttrCondition) {
    super(true);

    this.immuneCondition = immuneCondition;
  }

  override canApplyPreDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, cancelled: BooleanHolder | null, args: any[]): boolean {
    return this.immuneCondition(pokemon, attacker, move);
  }

  override applyPreDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, cancelled: BooleanHolder, args: any[]): void {
    cancelled.value = true;
  }

  getTriggerMessage(pokemon: Pokemon, abilityName: string, ...args: any[]): string {
    return i18next.t("abilityTriggers:moveImmunity", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) });
  }
}

/**
 * Reduces the accuracy of status moves used against the Pokémon with this ability to 50%.
 * Used by Wonder Skin.
 *
 * @extends PreDefendAbAttr
 */
export class WonderSkinAbAttr extends PreDefendAbAttr {

  constructor() {
    super(false);
  }

  override canApplyPreDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, cancelled: BooleanHolder | null, args: any[]): boolean {
    const moveAccuracy = args[0] as NumberHolder;
    return move.category === MoveCategory.STATUS && moveAccuracy.value >= 50;
  }

  override applyPreDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, cancelled: BooleanHolder, args: any[]): void {
    const moveAccuracy = args[0] as NumberHolder;
    moveAccuracy.value = 50;
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

  override canApplyPreDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, cancelled: BooleanHolder | null, args: any[]): boolean {
    return !simulated && super.canApplyPreDefend(pokemon, passive, simulated, attacker, move, cancelled, args);
  }

  override applyPreDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, cancelled: BooleanHolder, args: any[]): void {
    super.applyPreDefend(pokemon, passive, simulated, attacker, move, cancelled, args);
    globalScene.unshiftPhase(new StatStageChangePhase(pokemon.getBattlerIndex(), true, [ this.stat ], this.stages));
  }
}
/**
 * Class for abilities that make drain moves deal damage to user instead of healing them.
 * @extends PostDefendAbAttr
 * @see {@linkcode applyPostDefend}
 */
export class ReverseDrainAbAttr extends PostDefendAbAttr {

  override canApplyPostDefend(_pokemon: Pokemon, _passive: boolean, _simulated: boolean, _attacker: Pokemon, move: Move, _hitResult: HitResult | null, args: any[]): boolean {
    return move.hasAttr(HitHealAttr);
  }

  /**
   * Determines if a damage and draining move was used to check if this ability should stop the healing.
   * Examples include: Absorb, Draining Kiss, Bitter Blade, etc.
   * Also displays a message to show this ability was activated.
   * @param pokemon {@linkcode Pokemon} with this ability
   * @param _passive N/A
   * @param attacker {@linkcode Pokemon} that is attacking this Pokemon
   * @param move {@linkcode PokemonMove} that is being used
   * @param _hitResult N/A
   * @param _args N/A
   */
  override applyPostDefend(pokemon: Pokemon, _passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, _hitResult: HitResult, _args: any[]): void {
    if (!simulated) {
      globalScene.queueMessage(i18next.t("abilityTriggers:reverseDrain", { pokemonNameWithAffix: getPokemonNameWithAffix(attacker) }));
    }
  }
}

export class PostDefendStatStageChangeAbAttr extends PostDefendAbAttr {
  private condition: PokemonDefendCondition;
  private stat: BattleStat;
  private stages: number;
  private selfTarget: boolean;
  private allOthers: boolean;

  constructor(condition: PokemonDefendCondition, stat: BattleStat, stages: number, selfTarget = true, allOthers = false) {
    super(true);

    this.condition = condition;
    this.stat = stat;
    this.stages = stages;
    this.selfTarget = selfTarget;
    this.allOthers = allOthers;
  }

  override canApplyPostDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, hitResult: HitResult | null, args: any[]): boolean {
    return this.condition(pokemon, attacker, move);
  }

  override applyPostDefend(pokemon: Pokemon, _passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, _hitResult: HitResult, _args: any[]): void {
    if (simulated) {
      return;
    }

    if (this.allOthers) {
      const ally = pokemon.getAlly();
      const otherPokemon = !isNullOrUndefined(ally) ? pokemon.getOpponents().concat([ ally ]) : pokemon.getOpponents();
      for (const other of otherPokemon) {
        globalScene.unshiftPhase(new StatStageChangePhase((other).getBattlerIndex(), false, [ this.stat ], this.stages));
      }
    } else {
      globalScene.unshiftPhase(new StatStageChangePhase((this.selfTarget ? pokemon : attacker).getBattlerIndex(), this.selfTarget, [ this.stat ], this.stages));
    }
  }
}

export class PostDefendHpGatedStatStageChangeAbAttr extends PostDefendAbAttr {
  private condition: PokemonDefendCondition;
  private hpGate: number;
  private stats: BattleStat[];
  private stages: number;
  private selfTarget: boolean;

  constructor(condition: PokemonDefendCondition, hpGate: number, stats: BattleStat[], stages: number, selfTarget = true) {
    super(true);

    this.condition = condition;
    this.hpGate = hpGate;
    this.stats = stats;
    this.stages = stages;
    this.selfTarget = selfTarget;
  }

  override canApplyPostDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, hitResult: HitResult | null, args: any[]): boolean {
    const hpGateFlat: number = Math.ceil(pokemon.getMaxHp() * this.hpGate);
    const lastAttackReceived = pokemon.turnData.attacksReceived[pokemon.turnData.attacksReceived.length - 1];
    const damageReceived = lastAttackReceived?.damage || 0;
    return this.condition(pokemon, attacker, move) && (pokemon.hp <= hpGateFlat && (pokemon.hp + damageReceived) > hpGateFlat);
  }

  override applyPostDefend(pokemon: Pokemon, _passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, _hitResult: HitResult, _args: any[]): void {
    if (!simulated) {
      globalScene.unshiftPhase(new StatStageChangePhase((this.selfTarget ? pokemon : attacker).getBattlerIndex(), true, this.stats, this.stages));
    }
  }
}

export class PostDefendApplyArenaTrapTagAbAttr extends PostDefendAbAttr {
  private condition: PokemonDefendCondition;
  private tagType: ArenaTagType;

  constructor(condition: PokemonDefendCondition, tagType: ArenaTagType) {
    super(true);

    this.condition = condition;
    this.tagType = tagType;
  }

  override canApplyPostDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, hitResult: HitResult | null, args: any[]): boolean {
    const tag = globalScene.arena.getTag(this.tagType) as ArenaTrapTag;
    return (this.condition(pokemon, attacker, move))
    && (!globalScene.arena.getTag(this.tagType) || tag.layers < tag.maxLayers);
  }

  override applyPostDefend(pokemon: Pokemon, _passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, _hitResult: HitResult, _args: any[]): void {
    if (!simulated) {
      globalScene.arena.addTag(this.tagType, 0, undefined, pokemon.id, pokemon.isPlayer() ? ArenaTagSide.ENEMY : ArenaTagSide.PLAYER);
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

  override canApplyPostDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, hitResult: HitResult | null, args: any[]): boolean {
    return this.condition(pokemon, attacker, move);
  }

  override applyPostDefend(pokemon: Pokemon, _passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, _hitResult: HitResult, _args: any[]): void {
    if (!pokemon.getTag(this.tagType) && !simulated) {
      pokemon.addTag(this.tagType, undefined, undefined, pokemon.id);
      globalScene.queueMessage(i18next.t("abilityTriggers:windPowerCharged", { pokemonName: getPokemonNameWithAffix(pokemon), moveName: move.name }));
    }
  }
}

export class PostDefendTypeChangeAbAttr extends PostDefendAbAttr {
  private type: PokemonType;

  override canApplyPostDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, hitResult: HitResult, args: any[]): boolean {
    this.type = attacker.getMoveType(move);
    const pokemonTypes = pokemon.getTypes(true);
    return hitResult < HitResult.NO_EFFECT && (simulated || pokemonTypes.length !== 1 || pokemonTypes[0] !== this.type);
  }

  override applyPostDefend(pokemon: Pokemon, _passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, hitResult: HitResult, _args: any[]): void {
    const type = attacker.getMoveType(move);
    pokemon.summonData.types = [ type ];
  }

  override getTriggerMessage(pokemon: Pokemon, abilityName: string, ..._args: any[]): string {
    return i18next.t("abilityTriggers:postDefendTypeChange", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      abilityName,
      typeName: i18next.t(`pokemonInfo:Type.${PokemonType[this.type]}`)
    });
  }
}

export class PostDefendTerrainChangeAbAttr extends PostDefendAbAttr {
  private terrainType: TerrainType;

  constructor(terrainType: TerrainType) {
    super();

    this.terrainType = terrainType;
  }

  override canApplyPostDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, hitResult: HitResult, args: any[]): boolean {
    return hitResult < HitResult.NO_EFFECT && globalScene.arena.canSetTerrain(this.terrainType);
  }

  override applyPostDefend(pokemon: Pokemon, _passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, hitResult: HitResult, _args: any[]): void {
    if (!simulated) {
      globalScene.arena.trySetTerrain(this.terrainType, false, pokemon);
    }
  }
}

export class PostDefendContactApplyStatusEffectAbAttr extends PostDefendAbAttr {
  public chance: number;
  private effects: StatusEffect[];

  constructor(chance: number, ...effects: StatusEffect[]) {
    super(true);

    this.chance = chance;
    this.effects = effects;
  }

  override canApplyPostDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, hitResult: HitResult | null, args: any[]): boolean {
    const effect = this.effects.length === 1 ? this.effects[0] : this.effects[pokemon.randSeedInt(this.effects.length)];
    return move.doesFlagEffectApply({flag: MoveFlags.MAKES_CONTACT, user: attacker, target: pokemon}) && !attacker.status
      && (this.chance === -1 || pokemon.randSeedInt(100) < this.chance)
      && attacker.canSetStatus(effect, true, false, pokemon);
  }

  override applyPostDefend(pokemon: Pokemon, _passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, _hitResult: HitResult, _args: any[]): void {
    const effect = this.effects.length === 1 ? this.effects[0] : this.effects[pokemon.randSeedInt(this.effects.length)];
    attacker.trySetStatus(effect, true, pokemon);
  }
}

export class EffectSporeAbAttr extends PostDefendContactApplyStatusEffectAbAttr {
  constructor() {
    super(10, StatusEffect.POISON, StatusEffect.PARALYSIS, StatusEffect.SLEEP);
  }

  override canApplyPostDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, hitResult: HitResult | null, args: any[]): boolean {
    return !(attacker.hasAbility(Abilities.OVERCOAT) || attacker.isOfType(PokemonType.GRASS))
      && super.canApplyPostDefend(pokemon, passive, simulated, attacker, move, hitResult, args);
  }

  override applyPostDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, hitResult: HitResult, args: any[]): void {
    super.applyPostDefend(pokemon, passive, simulated, attacker, move, hitResult, args);
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

  override canApplyPostDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, hitResult: HitResult | null, args: any[]): boolean {
    return move.doesFlagEffectApply({flag: MoveFlags.MAKES_CONTACT, user: attacker, target: pokemon}) && pokemon.randSeedInt(100) < this.chance
    && attacker.canAddTag(this.tagType);
  }

  override applyPostDefend(pokemon: Pokemon, _passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, _hitResult: HitResult, _args: any[]): void {
    if (!simulated) {
      attacker.addTag(this.tagType, this.turnCount, move.id, attacker.id);
    }
  }
}

export class PostDefendCritStatStageChangeAbAttr extends PostDefendAbAttr {
  private stat: BattleStat;
  private stages: number;

  constructor(stat: BattleStat, stages: number) {
    super();

    this.stat = stat;
    this.stages = stages;
  }

  override applyPostDefend(pokemon: Pokemon, _passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, _hitResult: HitResult, _args: any[]): void {
    if (!simulated) {
      globalScene.unshiftPhase(new StatStageChangePhase(pokemon.getBattlerIndex(), true, [ this.stat ], this.stages));
    }
  }

  override getCondition(): AbAttrCondition {
    return (pokemon: Pokemon) => pokemon.turnData.attacksReceived.length !== 0 && pokemon.turnData.attacksReceived[pokemon.turnData.attacksReceived.length - 1].critical;
  }
}

export class PostDefendContactDamageAbAttr extends PostDefendAbAttr {
  private damageRatio: number;

  constructor(damageRatio: number) {
    super();

    this.damageRatio = damageRatio;
  }

  override canApplyPostDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, hitResult: HitResult | null, args: any[]): boolean {
    return !simulated && move.doesFlagEffectApply({flag: MoveFlags.MAKES_CONTACT, user: attacker, target: pokemon})
      && !attacker.hasAbilityWithAttr(BlockNonDirectDamageAbAttr);
  }

  override applyPostDefend(pokemon: Pokemon, _passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, _hitResult: HitResult, _args: any[]): void {
    attacker.damageAndUpdate(toDmgValue(attacker.getMaxHp() * (1 / this.damageRatio)), { result: HitResult.INDIRECT });
    attacker.turnData.damageTaken += toDmgValue(attacker.getMaxHp() * (1 / this.damageRatio));
  }

  override getTriggerMessage(pokemon: Pokemon, abilityName: string, ..._args: any[]): string {
    return i18next.t("abilityTriggers:postDefendContactDamage", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      abilityName
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

  override canApplyPostDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, hitResult: HitResult | null, args: any[]): boolean {
    return move.doesFlagEffectApply({flag: MoveFlags.MAKES_CONTACT, user: attacker, target: pokemon}) && !attacker.getTag(BattlerTagType.PERISH_SONG);
  }

  override applyPostDefend(pokemon: Pokemon, _passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, _hitResult: HitResult, _args: any[]): void {
    if (!simulated) {
      attacker.addTag(BattlerTagType.PERISH_SONG, this.turns);
      pokemon.addTag(BattlerTagType.PERISH_SONG, this.turns);
    }
  }

  override getTriggerMessage(pokemon: Pokemon, abilityName: string, ..._args: any[]): string {
    return i18next.t("abilityTriggers:perishBody", { pokemonName: getPokemonNameWithAffix(pokemon), abilityName: abilityName });
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

  override canApplyPostDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, hitResult: HitResult | null, args: any[]): boolean {
    return (!(this.condition && !this.condition(pokemon, attacker, move))
    && !globalScene.arena.weather?.isImmutable() && globalScene.arena.canSetWeather(this.weatherType));
  }

  override applyPostDefend(pokemon: Pokemon, _passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, _hitResult: HitResult, _args: any[]): void {
    if (!simulated) {
      globalScene.arena.trySetWeather(this.weatherType, pokemon);
    }
  }
}

export class PostDefendAbilitySwapAbAttr extends PostDefendAbAttr {
  constructor() {
    super();
  }

  override canApplyPostDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, hitResult: HitResult | null, args: any[]): boolean {
    return move.doesFlagEffectApply({flag: MoveFlags.MAKES_CONTACT, user: attacker, target: pokemon})
      && attacker.getAbility().isSwappable;
  }

  override applyPostDefend(pokemon: Pokemon, _passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, _hitResult: HitResult, args: any[]): void {
    if (!simulated) {
      const tempAbility = attacker.getAbility();
      attacker.setTempAbility(pokemon.getAbility());
      pokemon.setTempAbility(tempAbility);
    }
  }

  override getTriggerMessage(pokemon: Pokemon, _abilityName: string, ..._args: any[]): string {
    return i18next.t("abilityTriggers:postDefendAbilitySwap", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) });
  }
}

export class PostDefendAbilityGiveAbAttr extends PostDefendAbAttr {
  private ability: Abilities;

  constructor(ability: Abilities) {
    super();
    this.ability = ability;
  }

  override canApplyPostDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, hitResult: HitResult | null, args: any[]): boolean {
    return move.doesFlagEffectApply({flag: MoveFlags.MAKES_CONTACT, user: attacker, target: pokemon}) && attacker.getAbility().isSuppressable
      && !attacker.getAbility().hasAttr(PostDefendAbilityGiveAbAttr);
  }

  override applyPostDefend(_pokemon: Pokemon, _passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, _hitResult: HitResult, _args: any[]): void {
    if (!simulated) {
      attacker.setTempAbility(allAbilities[this.ability]);
    }
  }

  override getTriggerMessage(pokemon: Pokemon, abilityName: string, ..._args: any[]): string {
    return i18next.t("abilityTriggers:postDefendAbilityGive", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      abilityName
    });
  }
}

export class PostDefendMoveDisableAbAttr extends PostDefendAbAttr {
  private chance: number;
  private attacker: Pokemon;
  private move: Move;

  constructor(chance: number) {
    super();

    this.chance = chance;
  }

  override canApplyPostDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, hitResult: HitResult | null, args: any[]): boolean {
    return attacker.getTag(BattlerTagType.DISABLED) === null
      && move.doesFlagEffectApply({flag: MoveFlags.MAKES_CONTACT, user: attacker, target: pokemon}) && (this.chance === -1 || pokemon.randSeedInt(100) < this.chance);
  }

  override applyPostDefend(pokemon: Pokemon, _passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, _hitResult: HitResult, _args: any[]): void {
    if (!simulated) {
      this.attacker = attacker;
      this.move = move;
      this.attacker.addTag(BattlerTagType.DISABLED, 4, 0, pokemon.id);
    }
  }
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

  override canApplyPostStatStageChange(pokemon: Pokemon, simulated: boolean, statStagesChanged: BattleStat[], stagesChanged: integer, selfTarget: boolean, args: any[]): boolean {
    return this.condition(pokemon, statStagesChanged, stagesChanged) && !selfTarget;
  }

  override applyPostStatStageChange(pokemon: Pokemon, simulated: boolean, statStagesChanged: BattleStat[], stagesChanged: number, selfTarget: boolean, args: any[]): void {
    if (!simulated) {
      globalScene.unshiftPhase(new StatStageChangePhase((pokemon).getBattlerIndex(), true, this.statsToChange, this.stages));
    }
  }
}

export class PreAttackAbAttr extends AbAttr {
  canApplyPreAttack(
    pokemon: Pokemon,
    passive: boolean,
    simulated: boolean,
    defender: Pokemon | null,
    move: Move,
    args: any[]): boolean {
    return true;
  }

  applyPreAttack(
    pokemon: Pokemon,
    passive: boolean,
    simulated: boolean,
    defender: Pokemon | null,
    move: Move,
    args: any[],
  ): void {}
}

/**
 * Modifies moves additional effects with multipliers, ie. Sheer Force, Serene Grace.
 * @extends AbAttr
 * @see {@linkcode apply}
 */
export class MoveEffectChanceMultiplierAbAttr extends AbAttr {
  private chanceMultiplier: number;

  constructor(chanceMultiplier: number) {
    super(false);
    this.chanceMultiplier = chanceMultiplier;
  }

  override canApply(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    const exceptMoves = [ Moves.ORDER_UP, Moves.ELECTRO_SHOT ];
    return !((args[0] as NumberHolder).value <= 0 || exceptMoves.includes((args[1] as Move).id));
  }

  /**
   * @param args [0]: {@linkcode NumberHolder} Move additional effect chance. Has to be higher than or equal to 0.
   *             [1]: {@linkcode Moves } Move used by the ability user.
   */
  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder, args: any[]): void {
    (args[0] as NumberHolder).value *= this.chanceMultiplier;
    (args[0] as NumberHolder).value = Math.min((args[0] as NumberHolder).value, 100);
  }
}

/**
 * Sets incoming moves additional effect chance to zero, ignoring all effects from moves. ie. Shield Dust.
 * @extends PreDefendAbAttr
 * @see {@linkcode applyPreDefend}
 */
export class IgnoreMoveEffectsAbAttr extends PreDefendAbAttr {
  constructor(showAbility: boolean = false) {
    super(showAbility);
  }

  override canApplyPreDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move | null, cancelled: BooleanHolder | null, args: any[]): boolean {
    return (args[0] as NumberHolder).value > 0;
  }

  /**
   * @param args [0]: {@linkcode NumberHolder} Move additional effect chance.
   */
  override applyPreDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, cancelled: BooleanHolder, args: any[]): void {
    (args[0] as NumberHolder).value = 0;
  }
}

export class VariableMovePowerAbAttr extends PreAttackAbAttr {
  override canApplyPreAttack(pokemon: Pokemon, passive: boolean, simulated: boolean, defender: Pokemon, move: Move, args: any[]): boolean {
    return true;
  }
}

export class FieldPreventExplosiveMovesAbAttr extends AbAttr {
  override apply(
    pokemon: Pokemon,
    passive: boolean,
    simulated: boolean,
    cancelled: BooleanHolder,
    args: any[],
  ): void {
    cancelled.value = true;
  }
}

/**
 * Multiplies a Stat if the checked Pokemon lacks this ability.
 * If this ability cannot stack, a BooleanHolder can be used to prevent this from stacking.
 * @see {@link applyFieldStatMultiplierAbAttrs}
 * @see {@link applyFieldStat}
 * @see {@link BooleanHolder}
 */
export class FieldMultiplyStatAbAttr extends AbAttr {
  private stat: Stat;
  private multiplier: number;
  private canStack: boolean;

  constructor(stat: Stat, multiplier: number, canStack = false) {
    super(false);

    this.stat = stat;
    this.multiplier = multiplier;
    this.canStack = canStack;
  }

  canApplyFieldStat(pokemon: Pokemon, passive: boolean, simulated: boolean, stat: Stat, statValue: NumberHolder, checkedPokemon: Pokemon, hasApplied: BooleanHolder, args: any[]): boolean {
    return this.canStack || !hasApplied.value
      && this.stat === stat && checkedPokemon.getAbilityAttrs(FieldMultiplyStatAbAttr).every(attr => (attr as FieldMultiplyStatAbAttr).stat !== stat);
  }

  /**
   * applyFieldStat: Tries to multiply a Pokemon's Stat
   * @param pokemon {@linkcode Pokemon} the Pokemon using this ability
   * @param passive {@linkcode boolean} unused
   * @param stat {@linkcode Stat} the type of the checked stat
   * @param statValue {@linkcode NumberHolder} the value of the checked stat
   * @param checkedPokemon {@linkcode Pokemon} the Pokemon this ability is targeting
   * @param hasApplied {@linkcode BooleanHolder} whether or not another multiplier has been applied to this stat
   * @param args {any[]} unused
   */
  applyFieldStat(pokemon: Pokemon, passive: boolean, simulated: boolean, stat: Stat, statValue: NumberHolder, checkedPokemon: Pokemon, hasApplied: BooleanHolder, args: any[]): void {
    statValue.value *= this.multiplier;
    hasApplied.value = true;
  }

}

export class MoveTypeChangeAbAttr extends PreAttackAbAttr {
  constructor(
    private newType: PokemonType,
    private powerMultiplier: number,
    private condition?: PokemonAttackCondition
  ) {
    super(false);
  }

  override canApplyPreAttack(pokemon: Pokemon, passive: boolean, simulated: boolean, defender: Pokemon | null, move: Move, args: any[]): boolean {
    return (this.condition && this.condition(pokemon, defender, move)) ?? false;
  }

  // TODO: Decouple this into two attributes (type change / power boost)
  override applyPreAttack(pokemon: Pokemon, passive: boolean, simulated: boolean, defender: Pokemon, move: Move, args: any[]): void {
    if (args[0] && args[0] instanceof NumberHolder) {
      args[0].value = this.newType;
    }
    if (args[1] && args[1] instanceof NumberHolder) {
      args[1].value *= this.powerMultiplier;
    }
  }
}

/** Ability attribute for changing a pokemon's type before using a move */
export class PokemonTypeChangeAbAttr extends PreAttackAbAttr {
  private moveType: PokemonType;

  constructor() {
    super(true);
  }

  override canApplyPreAttack(pokemon: Pokemon, passive: boolean, simulated: boolean, defender: Pokemon | null, move: Move, args: any[]): boolean {
    if (!pokemon.isTerastallized &&
    move.id !== Moves.STRUGGLE &&
    /**
     * Skip moves that call other moves because these moves generate a following move that will trigger this ability attribute
     * @see {@link https://bulbapedia.bulbagarden.net/wiki/Category:Moves_that_call_other_moves}
     */
    !move.findAttr((attr) =>
      attr instanceof RandomMovesetMoveAttr ||
      attr instanceof RandomMoveAttr ||
      attr instanceof NaturePowerAttr ||
      attr instanceof CopyMoveAttr)) {
      const moveType = pokemon.getMoveType(move);
      if (pokemon.getTypes().some((t) => t !== moveType)) {
        this.moveType = moveType;
        return true;
      }
    }
    return false;
  }

  override applyPreAttack(pokemon: Pokemon, passive: boolean, simulated: boolean, defender: Pokemon, move: Move, args: any[]): void {
    const moveType = pokemon.getMoveType(move);

    if (!simulated) {
      this.moveType = moveType;
      pokemon.summonData.types = [ moveType ];
      pokemon.updateInfo();
    }
  }

  getTriggerMessage(pokemon: Pokemon, abilityName: string, ...args: any[]): string {
    return i18next.t("abilityTriggers:pokemonTypeChange", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      moveType: i18next.t(`pokemonInfo:Type.${PokemonType[this.moveType]}`),
    });
  }
}

/**
 * Class for abilities that convert single-strike moves to two-strike moves (i.e. Parental Bond).
 * @param damageMultiplier the damage multiplier for the second strike, relative to the first.
 */
export class AddSecondStrikeAbAttr extends PreAttackAbAttr {
  private damageMultiplier: number;

  constructor(damageMultiplier: number) {
    super(false);

    this.damageMultiplier = damageMultiplier;
  }

  override canApplyPreAttack(pokemon: Pokemon, passive: boolean, simulated: boolean, defender: Pokemon | null, move: Move, args: any[]): boolean {
    return move.canBeMultiStrikeEnhanced(pokemon, true);
  }

  /**
   * If conditions are met, this doubles the move's hit count (via args[1])
   * or multiplies the damage of secondary strikes (via args[2])
   * @param pokemon the {@linkcode Pokemon} using the move
   * @param passive n/a
   * @param defender n/a
   * @param move the {@linkcode Move} used by the ability source
   * @param args Additional arguments:
   * - `[0]` the number of strikes this move currently has ({@linkcode NumberHolder})
   * - `[1]` the damage multiplier for the current strike ({@linkcode NumberHolder})
   */
  override applyPreAttack(pokemon: Pokemon, passive: boolean, simulated: boolean, defender: Pokemon, move: Move, args: any[]): void {
    const hitCount = args[0] as NumberHolder;
    const multiplier = args[1] as NumberHolder;
    if (hitCount?.value) {
      hitCount.value += 1;
    }

    if (multiplier?.value && pokemon.turnData.hitsLeft === 1) {
      multiplier.value = this.damageMultiplier;
    }
  }
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

  override canApplyPreAttack(pokemon: Pokemon, passive: boolean, simulated: boolean, defender: Pokemon | null, move: Move, args: any[]): boolean {
    return this.condition(pokemon, defender, move);
  }

  /**
   *
   * @param pokemon the attacker pokemon
   * @param passive N/A
   * @param defender the target pokemon
   * @param move the move used by the attacker pokemon
   * @param args Utils.NumberHolder as damage
   */
  override applyPreAttack(pokemon: Pokemon, passive: boolean, simulated: boolean, defender: Pokemon, move: Move, args: any[]): void {
    const power = args[0] as NumberHolder;
    power.value = toDmgValue(power.value * this.damageMultiplier);
  }
}

export class MovePowerBoostAbAttr extends VariableMovePowerAbAttr {
  private condition: PokemonAttackCondition;
  private powerMultiplier: number;

  constructor(condition: PokemonAttackCondition, powerMultiplier: number, showAbility: boolean = false) {
    super(showAbility);
    this.condition = condition;
    this.powerMultiplier = powerMultiplier;
  }

  override canApplyPreAttack(pokemon: Pokemon, passive: boolean, simulated: boolean, defender: Pokemon | null, move: Move, args: any[]): boolean {
    return this.condition(pokemon, defender, move);
  }

  override applyPreAttack(pokemon: Pokemon, passive: boolean, simulated: boolean, defender: Pokemon, move: Move, args: any[]): void {
    (args[0] as NumberHolder).value *= this.powerMultiplier;
  }
}

export class MoveTypePowerBoostAbAttr extends MovePowerBoostAbAttr {
  constructor(boostedType: PokemonType, powerMultiplier?: number) {
    super((pokemon, defender, move) => pokemon?.getMoveType(move) === boostedType, powerMultiplier || 1.5, false);
  }
}

export class LowHpMoveTypePowerBoostAbAttr extends MoveTypePowerBoostAbAttr {
  constructor(boostedType: PokemonType) {
    super(boostedType);
  }

  getCondition(): AbAttrCondition {
    return (pokemon) => pokemon.getHpRatio() <= 0.33;
  }
}

/**
 * Abilities which cause a variable amount of power increase.
 * @extends VariableMovePowerAbAttr
 * @see {@link applyPreAttack}
 */
export class VariableMovePowerBoostAbAttr extends VariableMovePowerAbAttr {
  private mult: (user: Pokemon, target: Pokemon, move: Move) => number;

  /**
   * @param mult A function which takes the user, target, and move, and returns the power multiplier. 1 means no multiplier.
   * @param {boolean} showAbility Whether to show the ability when it activates.
   */
  constructor(mult: (user: Pokemon, target: Pokemon, move: Move) => number, showAbility = true) {
    super(showAbility);
    this.mult = mult;
  }

  override canApplyPreAttack(pokemon: Pokemon, passive: boolean, simulated: boolean, defender: Pokemon, move: Move, args: any[]): boolean {
    return this.mult(pokemon, defender, move) !== 1;
  }

  override applyPreAttack(pokemon: Pokemon, passive: boolean, simulated: boolean, defender: Pokemon, move: Move, args: any[]): void {
    const multiplier = this.mult(pokemon, defender, move);
    (args[0] as NumberHolder).value *= multiplier;
  }
}

/**
 * Boosts the power of a Pokémon's move under certain conditions.
 * @extends AbAttr
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

  canApplyPreAttack(pokemon: Pokemon | null, passive: boolean | null, simulated: boolean, defender: Pokemon | null, move: Move, args: any[]): boolean {
    return true; // logic for this attr is handled in move.ts instead of normally
  }

  applyPreAttack(pokemon: Pokemon | null, passive: boolean | null, simulated: boolean, defender: Pokemon | null, move: Move, args: any[]): void {
    if (this.condition(pokemon, defender, move)) {
      (args[0] as NumberHolder).value *= this.powerMultiplier;
    }
  }
}

/**
 * Boosts the power of a specific type of move.
 * @extends FieldMovePowerBoostAbAttr
 */
export class PreAttackFieldMoveTypePowerBoostAbAttr extends FieldMovePowerBoostAbAttr {
  /**
   * @param boostedType - The type of move that will receive the power boost.
   * @param powerMultiplier - The multiplier to apply to the move's power, defaults to 1.5 if not provided.
   */
  constructor(boostedType: PokemonType, powerMultiplier?: number) {
    super((pokemon, defender, move) => pokemon?.getMoveType(move) === boostedType, powerMultiplier || 1.5);
  }
}

/**
 * Boosts the power of a specific type of move for all Pokemon in the field.
 * @extends PreAttackFieldMoveTypePowerBoostAbAttr
 */
export class FieldMoveTypePowerBoostAbAttr extends PreAttackFieldMoveTypePowerBoostAbAttr { }

/**
 * Boosts the power of a specific type of move for the user and its allies.
 * @extends PreAttackFieldMoveTypePowerBoostAbAttr
 */
export class UserFieldMoveTypePowerBoostAbAttr extends PreAttackFieldMoveTypePowerBoostAbAttr { }

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
    super((pokemon, defender, move) => boostedCategories.includes(move.category), powerMultiplier);
  }
}

export class StatMultiplierAbAttr extends AbAttr {
  private stat: BattleStat;
  private multiplier: number;
  private condition: PokemonAttackCondition | null;

  constructor(stat: BattleStat, multiplier: number, condition?: PokemonAttackCondition) {
    super(false);

    this.stat = stat;
    this.multiplier = multiplier;
    this.condition = condition ?? null;
  }

  canApplyStatStage(
    pokemon: Pokemon,
    _passive: boolean,
    simulated: boolean,
    stat: BattleStat,
    statValue: NumberHolder,
    args: any[]): boolean {
    const move = (args[0] as Move);
    return stat === this.stat && (!this.condition || this.condition(pokemon, null, move));
  }

  applyStatStage(
    pokemon: Pokemon,
    _passive: boolean,
    simulated: boolean,
    stat: BattleStat,
    statValue: NumberHolder,
    args: any[]): void {
    statValue.value *= this.multiplier;
  }
}

export class PostAttackAbAttr extends AbAttr {
  private attackCondition: PokemonAttackCondition;

  /** The default attackCondition requires that the selected move is a damaging move */
  constructor(attackCondition: PokemonAttackCondition = (user, target, move) => (move.category !== MoveCategory.STATUS), showAbility = true) {
    super(showAbility);

    this.attackCondition = attackCondition;
  }

  /**
   * By default, this method checks that the move used is a damaging attack before
   * applying the effect of any inherited class. This can be changed by providing a different {@link attackCondition} to the constructor. See {@link ConfusionOnStatusEffectAbAttr}
   * for an example of an effect that does not require a damaging move.
   */
  canApplyPostAttack(
    pokemon: Pokemon,
    passive: boolean,
    simulated: boolean,
    defender: Pokemon,
    move: Move,
    hitResult: HitResult | null,
    args: any[]): boolean {
    // When attackRequired is true, we require the move to be an attack move and to deal damage before checking secondary requirements.
    // If attackRequired is false, we always defer to the secondary requirements.
    return this.attackCondition(pokemon, defender, move);
  }

  applyPostAttack(
    pokemon: Pokemon,
    passive: boolean,
    simulated: boolean,
    defender: Pokemon,
    move: Move,
    hitResult: HitResult | null,
    args: any[]): void {}
}

/**
 * Multiplies a Stat from an ally pokemon's ability.
 * @see {@link applyAllyStatMultiplierAbAttrs}
 * @see {@link applyAllyStat}
 */
export class AllyStatMultiplierAbAttr extends AbAttr {
  private stat: BattleStat;
  private multiplier: number;
  private ignorable: boolean;

  /**
   * @param stat - The stat being modified
   * @param multipler - The multiplier to apply to the stat
   * @param ignorable - Whether the multiplier can be ignored by mold breaker-like moves and abilities
   */
  constructor(stat: BattleStat, multiplier: number, ignorable: boolean = true) {
    super(false);

    this.stat = stat;
    this.multiplier = multiplier;
    this.ignorable = ignorable;
  }

  /**
   * Multiply a Pokemon's Stat due to an Ally's ability.
   * @param _pokemon - The ally {@linkcode Pokemon} with the ability (unused)
   * @param passive - unused
   * @param _simulated - Whether the ability is being simulated (unused)
   * @param _stat - The type of the checked {@linkcode Stat} (unused)
   * @param statValue - {@linkcode NumberHolder} containing the value of the checked stat
   * @param _checkedPokemon - The {@linkcode Pokemon} this ability is targeting (unused)
   * @param _ignoreAbility - Whether the ability should be ignored if possible
   * @param _args - unused
   * @returns `true` if this changed the checked stat, `false` otherwise.
   */
  applyAllyStat(_pokemon: Pokemon, _passive: boolean, _simulated: boolean, _stat: BattleStat, statValue: NumberHolder, _checkedPokemon: Pokemon, _ignoreAbility: boolean, _args: any[]) {
    statValue.value *= this.multiplier;
  }

  /**
   * Check if this ability can apply to the checked stat.
   * @param pokemon - The ally {@linkcode Pokemon} with the ability (unused)
   * @param passive - unused
   * @param simulated - Whether the ability is being simulated (unused)
   * @param stat - The type of the checked {@linkcode Stat}
   * @param statValue - {@linkcode NumberHolder} containing the value of the checked stat
   * @param checkedPokemon - The {@linkcode Pokemon} this ability is targeting (unused)
   * @param ignoreAbility - Whether the ability should be ignored if possible
   * @param args - unused
   * @returns `true` if this can apply to the checked stat, `false` otherwise.
   */
  canApplyAllyStat(pokemon: Pokemon, _passive: boolean, simulated: boolean, stat: BattleStat, statValue: NumberHolder, checkedPokemon: Pokemon, ignoreAbility: boolean, args: any[]): boolean {
    return stat === this.stat && !(ignoreAbility && this.ignorable);
  }
}

/**
 * Ability attribute for Gorilla Tactics
 * @extends PostAttackAbAttr
 */
export class GorillaTacticsAbAttr extends PostAttackAbAttr {
  constructor() {
    super((user, target, move) => true, false);
  }

  override canApplyPostAttack(
    pokemon: Pokemon,
    passive: boolean,
    simulated: boolean,
    defender: Pokemon,
    move: Move,
    hitResult: HitResult | null,
    args: any[]): boolean {
    return super.canApplyPostAttack(pokemon, passive, simulated, defender, move, hitResult, args)
      && simulated || !pokemon.getTag(BattlerTagType.GORILLA_TACTICS);
  }

  /**
   *
   * @param {Pokemon} pokemon the {@linkcode Pokemon} with this ability
   * @param passive n/a
   * @param simulated whether the ability is being simulated
   * @param defender n/a
   * @param move n/a
   * @param hitResult n/a
   * @param args n/a
   */
  override applyPostAttack(
    pokemon: Pokemon,
    passive: boolean,
    simulated: boolean,
    defender: Pokemon,
    move: Move,
    hitResult: HitResult | null,
    args: any[]): void {
    if (!simulated) {
      pokemon.addTag(BattlerTagType.GORILLA_TACTICS);
    }
  }
}

export class PostAttackStealHeldItemAbAttr extends PostAttackAbAttr {
  private stealCondition: PokemonAttackCondition | null;
  private stolenItem?: PokemonHeldItemModifier;

  constructor(stealCondition?: PokemonAttackCondition) {
    super();

    this.stealCondition = stealCondition ?? null;
  }

  override canApplyPostAttack(
    pokemon: Pokemon,
    passive: boolean,
    simulated: boolean,
    defender: Pokemon,
    move: Move,
    hitResult: HitResult,
    args: any[]): boolean {
    if (
      super.canApplyPostAttack(pokemon, passive, simulated, defender, move, hitResult, args) &&
      !simulated &&
      hitResult < HitResult.NO_EFFECT &&
      (!this.stealCondition || this.stealCondition(pokemon, defender, move))
    ) {
      const heldItems = this.getTargetHeldItems(defender).filter((i) => i.isTransferable);
      if (heldItems.length) {
        // Ensure that the stolen item in testing is the same as when the effect is applied
        this.stolenItem = heldItems[pokemon.randSeedInt(heldItems.length)];
        if (globalScene.canTransferHeldItemModifier(this.stolenItem, pokemon)) {
          return true;
        }
      }
    }
    this.stolenItem = undefined;
    return false;
  }

  override applyPostAttack(
    pokemon: Pokemon,
    passive: boolean,
    simulated: boolean,
    defender: Pokemon,
    move: Move,
    hitResult: HitResult,
    args: any[],
  ): void {
    const heldItems = this.getTargetHeldItems(defender).filter((i) => i.isTransferable);
    if (!this.stolenItem) {
      this.stolenItem = heldItems[pokemon.randSeedInt(heldItems.length)];
    }
    if (globalScene.tryTransferHeldItemModifier(this.stolenItem, pokemon, false)) {
      globalScene.queueMessage(
        i18next.t("abilityTriggers:postAttackStealHeldItem", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          defenderName: defender.name,
          stolenItemType: this.stolenItem.type.name,
        }),
      );
    }
    this.stolenItem = undefined;
  }

  getTargetHeldItems(target: Pokemon): PokemonHeldItemModifier[] {
    return globalScene.findModifiers(m => m instanceof PokemonHeldItemModifier
      && m.pokemonId === target.id, target.isPlayer()) as PokemonHeldItemModifier[];
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

  override canApplyPostAttack(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, hitResult: HitResult | null, args: any[]): boolean {
    if (
      super.canApplyPostAttack(pokemon, passive, simulated, attacker, move, hitResult, args)
      && (simulated || !attacker.hasAbilityWithAttr(IgnoreMoveEffectsAbAttr) && pokemon !== attacker
      && (!this.contactRequired || move.doesFlagEffectApply({flag: MoveFlags.MAKES_CONTACT, user: attacker, target: pokemon})) && pokemon.randSeedInt(100) < this.chance && !pokemon.status)
    ) {
      const effect = this.effects.length === 1 ? this.effects[0] : this.effects[pokemon.randSeedInt(this.effects.length)];
      return simulated || attacker.canSetStatus(effect, true, false, pokemon);
    }

    return false;
  }

  applyPostAttack(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, hitResult: HitResult, args: any[]): void {
    const effect = this.effects.length === 1 ? this.effects[0] : this.effects[pokemon.randSeedInt(this.effects.length)];
    attacker.trySetStatus(effect, true, pokemon);
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


  constructor(contactRequired: boolean, chance: (user: Pokemon, target: Pokemon, move: Move) =>  number, ...effects: BattlerTagType[]) {
    super(undefined, false);

    this.contactRequired = contactRequired;
    this.chance = chance;
    this.effects = effects;
  }

  override canApplyPostAttack(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, hitResult: HitResult | null, args: any[]): boolean {
    /**Battler tags inflicted by abilities post attacking are also considered additional effects.*/
    return super.canApplyPostAttack(pokemon, passive, simulated, attacker, move, hitResult, args) &&
      !attacker.hasAbilityWithAttr(IgnoreMoveEffectsAbAttr) && pokemon !== attacker &&
      (!this.contactRequired || move.doesFlagEffectApply({flag: MoveFlags.MAKES_CONTACT, user: attacker, target: pokemon})) &&
      pokemon.randSeedInt(100) < this.chance(attacker, pokemon, move) && !pokemon.status;
  }

  override applyPostAttack(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, hitResult: HitResult, args: any[]): void {
    if (!simulated) {
      const effect = this.effects.length === 1 ? this.effects[0] : this.effects[pokemon.randSeedInt(this.effects.length)];
      attacker.addTag(effect);
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

  override canApplyPostDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, hitResult: HitResult, args: any[]): boolean {
    if (
      !simulated &&
      hitResult < HitResult.NO_EFFECT &&
      (!this.condition || this.condition(pokemon, attacker, move))
    ) {
      const heldItems = this.getTargetHeldItems(attacker).filter((i) => i.isTransferable);
      if (heldItems.length) {
        this.stolenItem = heldItems[pokemon.randSeedInt(heldItems.length)];
        if (globalScene.canTransferHeldItemModifier(this.stolenItem, pokemon)) {
          return true;
        }
      }
    }
    return false;
  }

  override applyPostDefend(
    pokemon: Pokemon,
    _passive: boolean,
    simulated: boolean,
    attacker: Pokemon,
    move: Move,
    hitResult: HitResult,
    _args: any[],
  ): void {

    const heldItems = this.getTargetHeldItems(attacker).filter((i) => i.isTransferable);
    if (!this.stolenItem) {
      this.stolenItem = heldItems[pokemon.randSeedInt(heldItems.length)];
    }
    if (globalScene.tryTransferHeldItemModifier(this.stolenItem, pokemon, false)) {
      globalScene.queueMessage(
        i18next.t("abilityTriggers:postDefendStealHeldItem", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          attackerName: attacker.name,
          stolenItemType: this.stolenItem.type.name,
        }),
      );
    }
    this.stolenItem = undefined;
  }

  getTargetHeldItems(target: Pokemon): PokemonHeldItemModifier[] {
    return globalScene.findModifiers(m => m instanceof PokemonHeldItemModifier
      && m.pokemonId === target.id, target.isPlayer()) as PokemonHeldItemModifier[];
  }
}

/**
 * Base class for defining all {@linkcode Ability} Attributes after a status effect has been set.
 * @see {@linkcode applyPostSetStatus()}.
 */
export class PostSetStatusAbAttr extends AbAttr {
  canApplyPostSetStatus(
    pokemon: Pokemon,
    sourcePokemon: Pokemon | null = null,
    passive: boolean,
    effect: StatusEffect,
    simulated: boolean,
    rgs: any[]): boolean {
    return true;
  }

  /**
   * Does nothing after a status condition is set.
   * @param pokemon {@linkcode Pokemon} that status condition was set on.
   * @param sourcePokemon {@linkcode Pokemon} that that set the status condition. Is `null` if status was not set by a Pokemon.
   * @param passive Whether this ability is a passive.
   * @param effect {@linkcode StatusEffect} that was set.
   * @param args Set of unique arguments needed by this attribute.
   */
  applyPostSetStatus(
    pokemon: Pokemon,
    sourcePokemon: Pokemon | null = null,
    passive: boolean,
    effect: StatusEffect,
    simulated: boolean,
    args: any[],
  ): void {}
}

/**
 * If another Pokemon burns, paralyzes, poisons, or badly poisons this Pokemon,
 * that Pokemon receives the same non-volatile status condition as part of this
 * ability attribute. For Synchronize ability.
 */
export class SynchronizeStatusAbAttr extends PostSetStatusAbAttr {
  override canApplyPostSetStatus(pokemon: Pokemon, sourcePokemon: (Pokemon | null) | undefined, passive: boolean, effect: StatusEffect, simulated: boolean, args: any[]): boolean {
    /** Synchronizable statuses */
    const syncStatuses = new Set<StatusEffect>([
      StatusEffect.BURN,
      StatusEffect.PARALYSIS,
      StatusEffect.POISON,
      StatusEffect.TOXIC
    ]);

    // synchronize does not need to check canSetStatus because the ability shows even if it fails to set the status
    return ((sourcePokemon ?? false) && syncStatuses.has(effect));
  }

  /**
   * If the `StatusEffect` that was set is Burn, Paralysis, Poison, or Toxic, and the status
   * was set by a source Pokemon, set the source Pokemon's status to the same `StatusEffect`.
   * @param pokemon {@linkcode Pokemon} that status condition was set on.
   * @param sourcePokemon {@linkcode Pokemon} that that set the status condition. Is null if status was not set by a Pokemon.
   * @param passive Whether this ability is a passive.
   * @param effect {@linkcode StatusEffect} that was set.
   * @param args Set of unique arguments needed by this attribute.
   */
  override applyPostSetStatus(pokemon: Pokemon, sourcePokemon: Pokemon | null = null, passive: boolean, effect: StatusEffect, simulated: boolean, args: any[]): void {
    if (!simulated && sourcePokemon) {
      sourcePokemon.trySetStatus(effect, true, pokemon);
    }
  }
}

export class PostVictoryAbAttr extends AbAttr {
  canApplyPostVictory(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return true;
  }

  applyPostVictory(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {}
}

class PostVictoryStatStageChangeAbAttr extends PostVictoryAbAttr {
  private stat: BattleStat | ((p: Pokemon) => BattleStat);
  private stages: number;

  constructor(stat: BattleStat | ((p: Pokemon) => BattleStat), stages: number) {
    super();

    this.stat = stat;
    this.stages = stages;
  }

  override applyPostVictory(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
    const stat = typeof this.stat === "function" ? this.stat(pokemon) : this.stat;
    if (!simulated) {
      globalScene.unshiftPhase(new StatStageChangePhase(pokemon.getBattlerIndex(), true, [ stat ], this.stages));
    }
  }
}

export class PostVictoryFormChangeAbAttr extends PostVictoryAbAttr {
  private formFunc: (p: Pokemon) => number;

  constructor(formFunc: ((p: Pokemon) => number)) {
    super(true);

    this.formFunc = formFunc;
  }

  override canApplyPostVictory(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    const formIndex = this.formFunc(pokemon);
    return formIndex !== pokemon.formIndex;
  }

  override applyPostVictory(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
    if (!simulated) {
      globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeAbilityTrigger, false);
    }
  }
}

export class PostKnockOutAbAttr extends AbAttr {
  canApplyPostKnockOut(pokemon: Pokemon, passive: boolean, simulated: boolean, knockedOut: Pokemon, args: any[]): boolean {
    return true;
  }

  applyPostKnockOut(pokemon: Pokemon, passive: boolean, simulated: boolean, knockedOut: Pokemon, args: any[]): void {}
}

export class PostKnockOutStatStageChangeAbAttr extends PostKnockOutAbAttr {
  private stat: BattleStat | ((p: Pokemon) => BattleStat);
  private stages: number;

  constructor(stat: BattleStat | ((p: Pokemon) => BattleStat), stages: number) {
    super();

    this.stat = stat;
    this.stages = stages;
  }

  override applyPostKnockOut(pokemon: Pokemon, passive: boolean, simulated: boolean, knockedOut: Pokemon, args: any[]): void {
    const stat = typeof this.stat === "function" ? this.stat(pokemon) : this.stat;
    if (!simulated) {
      globalScene.unshiftPhase(new StatStageChangePhase(pokemon.getBattlerIndex(), true, [ stat ], this.stages));
    }
  }
}

export class CopyFaintedAllyAbilityAbAttr extends PostKnockOutAbAttr {
  constructor() {
    super();
  }

  override canApplyPostKnockOut(pokemon: Pokemon, passive: boolean, simulated: boolean, knockedOut: Pokemon, args: any[]): boolean {
    return pokemon.isPlayer() === knockedOut.isPlayer() && knockedOut.getAbility().isCopiable;
  }

  override applyPostKnockOut(pokemon: Pokemon, passive: boolean, simulated: boolean, knockedOut: Pokemon, args: any[]): void {
    if (!simulated) {
      pokemon.setTempAbility(knockedOut.getAbility());
      globalScene.queueMessage(i18next.t("abilityTriggers:copyFaintedAllyAbility", { pokemonNameWithAffix: getPokemonNameWithAffix(knockedOut), abilityName: allAbilities[knockedOut.getAbility().id].name }));
    }
  }
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

  override canApply(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return this.stats.includes(args[0]);
  }

  /**
   * Modifies a BooleanHolder and returns the result to see if a stat is ignored or not
   * @param _pokemon n/a
   * @param _passive n/a
   * @param simulated n/a
   * @param _cancelled n/a
   * @param args A BooleanHolder that represents whether or not to ignore a stat's stat changes
   */
  override apply(_pokemon: Pokemon, _passive: boolean, simulated: boolean, _cancelled: BooleanHolder, args: any[]): void {
    (args[1] as BooleanHolder).value = true;
  }
}

export class IntimidateImmunityAbAttr extends AbAttr {
  constructor() {
    super(false);
  }

  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder, args: any[]): void {
    cancelled.value = true;
  }

  getTriggerMessage(pokemon: Pokemon, abilityName: string, ...args: any[]): string {
    return i18next.t("abilityTriggers:intimidateImmunity", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      abilityName
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

  override apply(pokemon: Pokemon, passive: boolean, simulated:boolean, cancelled: BooleanHolder, args: any[]): void {
    if (!simulated) {
      globalScene.pushPhase(new StatStageChangePhase(pokemon.getBattlerIndex(), false, this.stats, this.stages));
    }
    cancelled.value = this.overwrites;
  }
}

/**
 * Base class for defining all {@linkcode Ability} Attributes post summon
 * @see {@linkcode applyPostSummon()}
 */
export class PostSummonAbAttr extends AbAttr {
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

  canApplyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return true;
  }

  /**
   * Applies ability post summon (after switching in)
   * @param pokemon {@linkcode Pokemon} with this ability
   * @param passive Whether this ability is a passive
   * @param args Set of unique arguments needed by this attribute
   */
  applyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {}
}

/**
 * Base class for ability attributes which remove an effect on summon
 */
export class PostSummonRemoveEffectAbAttr extends PostSummonAbAttr {}

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

  override canApplyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return globalScene.arena.tags.some(tag => this.arenaTags.includes(tag.tagType));
  }

  override applyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
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

  public override applyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
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

  override applyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
    if (!simulated) {
      globalScene.queueMessage(this.messageFunc(pokemon));
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

  override applyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
    if (!simulated) {
      globalScene.queueMessage(this.message);
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

  override canApplyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return pokemon.canAddTag(this.tagType);
  }

  override applyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
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

  public override canApplyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return this.immuneTags.some(tagType => !!pokemon.getTag(tagType));
  }

  public override applyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
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

  override applyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
    if (simulated) {
      return;
    }

    if (this.selfTarget) {
      // we unshift the StatStageChangePhase to put it right after the showAbility and not at the end of the
      // phase list (which could be after CommandPhase for example)
      globalScene.unshiftPhase(new StatStageChangePhase(pokemon.getBattlerIndex(), true, this.stats, this.stages));
    } else {
      for (const opponent of pokemon.getOpponents()) {
        const cancelled = new BooleanHolder(false);
        if (this.intimidate) {
          applyAbAttrs(IntimidateImmunityAbAttr, opponent, cancelled, simulated);
          applyAbAttrs(PostIntimidateStatStageChangeAbAttr, opponent, cancelled, simulated);

          if (opponent.getTag(BattlerTagType.SUBSTITUTE)) {
            cancelled.value = true;
          }
        }
        if (!cancelled.value) {
          globalScene.unshiftPhase(new StatStageChangePhase(opponent.getBattlerIndex(), false, this.stats, this.stages));
        }
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

  override canApplyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return pokemon.getAlly()?.isActive(true) ?? false;
  }

  override applyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
    const target = pokemon.getAlly();
    if (!simulated && !isNullOrUndefined(target)) {
      globalScene.unshiftPhase(new PokemonHealPhase(target.getBattlerIndex(),
        toDmgValue(pokemon.getMaxHp() / this.healRatio), i18next.t("abilityTriggers:postSummonAllyHeal", { pokemonNameWithAffix: getPokemonNameWithAffix(target), pokemonName: pokemon.name }), true, !this.showAnim));
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
  constructor() {
    super();
  }

  override canApplyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return pokemon.getAlly()?.isActive(true) ?? false;
  }

  override applyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
    const target = pokemon.getAlly();
    if (!simulated && !isNullOrUndefined(target)) {
      for (const s of BATTLE_STATS) {
        target.setStatStage(s, 0);
      }

      globalScene.queueMessage(i18next.t("abilityTriggers:postSummonClearAllyStats", { pokemonNameWithAffix: getPokemonNameWithAffix(target) }));
    }
  }
}

/**
 * Download raises either the Attack stat or Special Attack stat by one stage depending on the foe's currently lowest defensive stat:
 * it will raise Attack if the foe's current Defense is lower than its current Special Defense stat;
 * otherwise, it will raise Special Attack.
 * @extends PostSummonAbAttr
 * @see {applyPostSummon}
 */
export class DownloadAbAttr extends PostSummonAbAttr {
  private enemyDef: number;
  private enemySpDef: number;
  private enemyCountTally: number;
  private stats: BattleStat[];

  override canApplyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
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
   * @param {Pokemon} pokemon Pokemon that is using the move, as well as seeing the opposing pokemon.
   * @param {boolean} passive N/A
   * @param {any[]} args N/A
   */
  override applyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
    if (this.enemyDef < this.enemySpDef) {
      this.stats = [ Stat.ATK ];
    } else {
      this.stats = [ Stat.SPATK ];
    }

    if (!simulated) {
      globalScene.unshiftPhase(new StatStageChangePhase(pokemon.getBattlerIndex(), false, this.stats, 1));
    }
  }
}

export class PostSummonWeatherChangeAbAttr extends PostSummonAbAttr {
  private weatherType: WeatherType;

  constructor(weatherType: WeatherType) {
    super();

    this.weatherType = weatherType;
  }

  override canApplyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    const weatherReplaceable = (this.weatherType === WeatherType.HEAVY_RAIN ||
      this.weatherType === WeatherType.HARSH_SUN ||
      this.weatherType === WeatherType.STRONG_WINDS) || !globalScene.arena.weather?.isImmutable();
    return weatherReplaceable && globalScene.arena.canSetWeather(this.weatherType);
  }

  override applyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
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

  override canApplyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return globalScene.arena.canSetTerrain(this.terrainType);
  }

  override applyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
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

  public override canApplyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    const status = pokemon.status?.effect;
    return !isNullOrUndefined(status) && (this.immuneEffects.length < 1 || this.immuneEffects.includes(status))
  }

  public override applyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
    const status = pokemon.status?.effect;
    if (!isNullOrUndefined(status)) {
      this.statusHealed = status;
      pokemon.resetStatus(false);
      pokemon.updateInfo();
    }
  }

  public override getTriggerMessage(_pokemon: Pokemon, _abilityName: string, ..._args: any[]): string | null {
    if (this.statusHealed) {
      return getStatusEffectHealText(this.statusHealed, getPokemonNameWithAffix(_pokemon));
    }
    return null;
  }
}

export class PostSummonFormChangeAbAttr extends PostSummonAbAttr {
  private formFunc: (p: Pokemon) => number;

  constructor(formFunc: ((p: Pokemon) => number)) {
    super(true);

    this.formFunc = formFunc;
  }

  override canApplyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return this.formFunc(pokemon) !== pokemon.formIndex;
  }

  override applyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
    if (!simulated) {
      globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeAbilityTrigger, false);
    }
  }
}

/** Attempts to copy a pokemon's ability */
export class PostSummonCopyAbilityAbAttr extends PostSummonAbAttr {
  private target: Pokemon;
  private targetAbilityName: string;

  override canApplyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    const targets = pokemon.getOpponents();
    if (!targets.length) {
      return false;
    }

    let target: Pokemon;
    if (targets.length > 1) {
      globalScene.executeWithSeedOffset(() => target = randSeedItem(targets), globalScene.currentBattle.waveIndex);
    } else {
      target = targets[0];
    }

    if (
      !target!.getAbility().isCopiable &&
      // Wonder Guard is normally uncopiable so has the attribute, but Trace specifically can copy it
      !(pokemon.hasAbility(Abilities.TRACE) && target!.getAbility().id === Abilities.WONDER_GUARD)
    ) {
      return false;
    }

    this.target = target!;
    this.targetAbilityName = allAbilities[target!.getAbility().id].name;
    return true;
  }

  override applyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
    if (!simulated) {
      pokemon.setTempAbility(this.target!.getAbility());
      setAbilityRevealed(this.target!);
      pokemon.updateInfo();
    }
  }

  getTriggerMessage(pokemon: Pokemon, abilityName: string, ...args: any[]): string {
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

  override canApplyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    const party = pokemon instanceof PlayerPokemon ? globalScene.getPlayerField() : globalScene.getEnemyField();
    return party.filter(p => p.isAllowedInBattle()).length > 0;
  }

  /**
   * Removes supplied status effect from the user's field when user of the ability is summoned.
   *
   * @param pokemon - The Pokémon that triggered the ability.
   * @param passive - n/a
   * @param args - n/a
   */
  override applyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
    const party = pokemon instanceof PlayerPokemon ? globalScene.getPlayerField() : globalScene.getEnemyField();
    const allowedParty = party.filter(p => p.isAllowedInBattle());

    if (!simulated) {
      for (const pokemon of allowedParty) {
        if (pokemon.status && this.statusEffect.includes(pokemon.status.effect)) {
          globalScene.queueMessage(getStatusEffectHealText(pokemon.status.effect, getPokemonNameWithAffix(pokemon)));
          pokemon.resetStatus(false);
          pokemon.updateInfo();
        }
      }
    }
  }
}


/** Attempt to copy the stat changes on an ally pokemon */
export class PostSummonCopyAllyStatsAbAttr extends PostSummonAbAttr {
  override canApplyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    if (!globalScene.currentBattle.double) {
      return false;
    }

    const ally = pokemon.getAlly();
    if (isNullOrUndefined(ally) || ally.getStatStages().every(s => s === 0)) {
      return false;
    }

    return true;
  }

  override applyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
    const ally = pokemon.getAlly();
    if (!simulated && !isNullOrUndefined(ally)) {
      for (const s of BATTLE_STATS) {
        pokemon.setStatStage(s, ally.getStatStage(s));
      }
      pokemon.updateInfo();
    }
  }

  getTriggerMessage(pokemon: Pokemon, abilityName: string, ...args: any[]): string {
    return i18next.t("abilityTriggers:costar", {
      pokemonName: getPokemonNameWithAffix(pokemon),
      allyName: getPokemonNameWithAffix(pokemon.getAlly()),
    });
  }
}

/**
 * Used by Imposter
 */
export class PostSummonTransformAbAttr extends PostSummonAbAttr {
  constructor() {
    super(true, false);
  }

  private getTarget(targets: Pokemon[]): Pokemon {
    let target: Pokemon = targets[0];
    if (targets.length > 1) {
      globalScene.executeWithSeedOffset(() => {
        // in a double battle, if one of the opposing pokemon is fused the other one will be chosen
        // if both are fused, then Imposter will fail below
        if (targets[0].fusionSpecies) {
          target = targets[1];
          return;
        } else if (targets[1].fusionSpecies) {
          target = targets[0];
          return;
        }
        target = randSeedItem(targets);
      }, globalScene.currentBattle.waveIndex);
    } else {
      target = targets[0];
    }

    target = target!;

    return target;
  }

  override canApplyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    const targets = pokemon.getOpponents();
    const target = this.getTarget(targets);

    if (!!target.summonData?.illusion) {
      return false;
    }

    if (simulated || !targets.length) {
      return simulated;
    }

    // transforming from or into fusion pokemon causes various problems (including crashes and save corruption)
    if (this.getTarget(targets).fusionSpecies || pokemon.fusionSpecies) {
      return false;
    }

    return true;
  }

  override applyPostSummon(pokemon: Pokemon, _passive: boolean, simulated: boolean, _args: any[]): void {
    const target = this.getTarget(pokemon.getOpponents());

    globalScene.unshiftPhase(new PokemonTransformPhase(pokemon.getBattlerIndex(), target.getBattlerIndex(), true));

  }
}

/**
 * Reverts weather-based forms to their normal forms when the user is summoned.
 * Used by Cloud Nine and Air Lock.
 * @extends PostSummonAbAttr
 */
export class PostSummonWeatherSuppressedFormChangeAbAttr extends PostSummonAbAttr {
  override canApplyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return getPokemonWithWeatherBasedForms().length > 0;
  }

  /**
   * Triggers {@linkcode Arena.triggerWeatherBasedFormChangesToNormal | triggerWeatherBasedFormChangesToNormal}
   * @param {Pokemon} pokemon the Pokemon with this ability
   * @param passive n/a
   * @param args n/a
   */
  override applyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
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
  private ability: Abilities;

  constructor(ability: Abilities) {
    super(true);

    this.ability = ability;
  }

  override canApplyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    const isCastformWithForecast = (pokemon.species.speciesId === Species.CASTFORM && this.ability === Abilities.FORECAST);
    const isCherrimWithFlowerGift = (pokemon.species.speciesId === Species.CHERRIM && this.ability === Abilities.FLOWER_GIFT);
    return isCastformWithForecast || isCherrimWithFlowerGift;
  }

  /**
   * Calls the {@linkcode BattleScene.triggerPokemonFormChange | triggerPokemonFormChange} for both
   * {@linkcode SpeciesFormChange.SpeciesFormChangeWeatherTrigger | SpeciesFormChangeWeatherTrigger} and
   * {@linkcode SpeciesFormChange.SpeciesFormChangeWeatherTrigger | SpeciesFormChangeRevertWeatherFormTrigger} if it
   * is the specific Pokemon and ability
   * @param {Pokemon} pokemon the Pokemon with this ability
   * @param passive n/a
   * @param args n/a
   */
  override applyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
    if (!simulated) {
      globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeWeatherTrigger);
      globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeRevertWeatherFormTrigger);
    }
  }
}

/**
 * Attribute implementing the effects of {@link https://bulbapedia.bulbagarden.net/wiki/Commander_(Ability) | Commander}.
 * When the source of an ability with this attribute detects a Dondozo as their active ally, the source "jumps
 * into the Dondozo's mouth," sharply boosting the Dondozo's stats, cancelling the source's moves, and
 * causing attacks that target the source to always miss.
 */
export class CommanderAbAttr extends AbAttr {
  constructor() {
    super(true);
  }

  override canApply(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    // If the ally Dondozo is fainted or was previously "commanded" by
    // another Pokemon, this effect cannot apply.

    // TODO: Should this work with X + Dondozo fusions?
    const ally = pokemon.getAlly();
    return globalScene.currentBattle?.double && !isNullOrUndefined(ally) && ally.species.speciesId === Species.DONDOZO
           && !(ally.isFainted() || ally.getTag(BattlerTagType.COMMANDED));
  }

  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: null, args: any[]): void {
    if (!simulated) {
      // Lapse the source's semi-invulnerable tags (to avoid visual inconsistencies)
      pokemon.lapseTags(BattlerTagLapseType.MOVE_EFFECT);
      // Play an animation of the source jumping into the ally Dondozo's mouth
      globalScene.triggerPokemonBattleAnim(pokemon, PokemonAnimType.COMMANDER_APPLY);
      // Apply boosts from this effect to the ally Dondozo
      pokemon.getAlly()?.addTag(BattlerTagType.COMMANDED, 0, Moves.NONE, pokemon.id);
      // Cancel the source Pokemon's next move (if a move is queued)
      globalScene.tryRemovePhase((phase) => phase instanceof MovePhase && phase.pokemon === pokemon);
    }
  }
}

export class PreSwitchOutAbAttr extends AbAttr {
  constructor(showAbility: boolean = true) {
    super(showAbility);
  }

  canApplyPreSwitchOut(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return true;
  }

  applyPreSwitchOut(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {}
}

export class PreSwitchOutResetStatusAbAttr extends PreSwitchOutAbAttr {
  constructor() {
    super(false);
  }

  override canApplyPreSwitchOut(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return !isNullOrUndefined(pokemon.status);
  }

  override applyPreSwitchOut(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
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
  /**
   * @param pokemon The {@linkcode Pokemon} with the ability
   * @param passive N/A
   * @param args N/A
   * @returns {boolean} Returns true if the weather clears, otherwise false.
   */
  override applyPreSwitchOut(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    const weatherType = globalScene.arena.weather?.weatherType;
    let turnOffWeather = false;

    // Clear weather only if user's ability matches the weather and no other pokemon has the ability.
    switch (weatherType) {
      case WeatherType.HARSH_SUN:
        if (
          pokemon.hasAbility(Abilities.DESOLATE_LAND) &&
          globalScene
            .getField(true)
            .filter((p) => p !== pokemon)
            .filter((p) => p.hasAbility(Abilities.DESOLATE_LAND)).length === 0
        ) {
          turnOffWeather = true;
        }
        break;
      case WeatherType.HEAVY_RAIN:
        if (
          pokemon.hasAbility(Abilities.PRIMORDIAL_SEA) &&
          globalScene
            .getField(true)
            .filter((p) => p !== pokemon)
            .filter((p) => p.hasAbility(Abilities.PRIMORDIAL_SEA)).length === 0
        ) {
          turnOffWeather = true;
        }
        break;
      case WeatherType.STRONG_WINDS:
        if (
          pokemon.hasAbility(Abilities.DELTA_STREAM) &&
          globalScene
            .getField(true)
            .filter((p) => p !== pokemon)
            .filter((p) => p.hasAbility(Abilities.DELTA_STREAM)).length === 0
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
  override canApplyPreSwitchOut(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return !pokemon.isFullHp();
  }

  override applyPreSwitchOut(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
    if (!simulated) {
      const healAmount = toDmgValue(pokemon.getMaxHp() * 0.33);
      pokemon.heal(healAmount);
      pokemon.updateInfo();
    }
  }
}

/**
 * Attribute for form changes that occur on switching out
 * @extends PreSwitchOutAbAttr
 * @see {@linkcode applyPreSwitchOut}
 */
export class PreSwitchOutFormChangeAbAttr extends PreSwitchOutAbAttr {
  private formFunc: (p: Pokemon) => number;

  constructor(formFunc: ((p: Pokemon) => number)) {
    super();

    this.formFunc = formFunc;
  }

  override canApplyPreSwitchOut(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return this.formFunc(pokemon) !== pokemon.formIndex;
  }

  /**
   * On switch out, trigger the form change to the one defined in the ability
   * @param pokemon The pokemon switching out and changing form {@linkcode Pokemon}
   * @param passive N/A
   * @param args N/A
   */
  override applyPreSwitchOut(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
    if (!simulated) {
      globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeAbilityTrigger, false);
    }
  }

}

export class PreLeaveFieldAbAttr extends AbAttr {
  canApplyPreLeaveField(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return true;
  }

  applyPreLeaveField(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {}
}

/**
 * Clears Desolate Land/Primordial Sea/Delta Stream upon the Pokemon switching out.
 */
export class PreLeaveFieldClearWeatherAbAttr extends PreLeaveFieldAbAttr {

  override canApplyPreLeaveField(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    const weatherType = globalScene.arena.weather?.weatherType;
    // Clear weather only if user's ability matches the weather and no other pokemon has the ability.
    switch (weatherType) {
      case (WeatherType.HARSH_SUN):
        if (pokemon.hasAbility(Abilities.DESOLATE_LAND)
          && globalScene.getField(true).filter(p => p !== pokemon).filter(p => p.hasAbility(Abilities.DESOLATE_LAND)).length === 0) {
          return true;
        }
        break;
      case (WeatherType.HEAVY_RAIN):
        if (pokemon.hasAbility(Abilities.PRIMORDIAL_SEA)
          && globalScene.getField(true).filter(p => p !== pokemon).filter(p => p.hasAbility(Abilities.PRIMORDIAL_SEA)).length === 0) {
          return true;
        }
        break;
      case (WeatherType.STRONG_WINDS):
        if (pokemon.hasAbility(Abilities.DELTA_STREAM)
          && globalScene.getField(true).filter(p => p !== pokemon).filter(p => p.hasAbility(Abilities.DELTA_STREAM)).length === 0) {
          return true;
        }
        break;
    }
    return false;
  }

  /**
   * @param pokemon The {@linkcode Pokemon} with the ability
   * @param passive N/A
   * @param args N/A
   */
  override applyPreLeaveField(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
    if (!simulated) {
      globalScene.arena.trySetWeather(WeatherType.NONE);
    }
  }
}

/**
 * Updates the active {@linkcode SuppressAbilitiesTag} when a pokemon with {@linkcode Abilities.NEUTRALIZING_GAS} leaves the field
 */
export class PreLeaveFieldRemoveSuppressAbilitiesSourceAbAttr extends PreLeaveFieldAbAttr {
  constructor() {
    super(false);
  }

  public override canApplyPreLeaveField(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return !!globalScene.arena.getTag(ArenaTagType.NEUTRALIZING_GAS);
  }

  public override applyPreLeaveField(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
    const suppressTag = globalScene.arena.getTag(ArenaTagType.NEUTRALIZING_GAS) as SuppressAbilitiesTag;
    suppressTag.onSourceLeave(globalScene.arena);
  }
}

export class PreStatStageChangeAbAttr extends AbAttr {
  canApplyPreStatStageChange(
    pokemon: Pokemon | null,
    passive: boolean,
    simulated: boolean,
    stat: BattleStat,
    cancelled: BooleanHolder,
    args: any[]): boolean {
    return true;
  }

  applyPreStatStageChange(
    pokemon: Pokemon | null,
    passive: boolean,
    simulated: boolean,
    stat: BattleStat,
    cancelled: BooleanHolder,
    args: any[],
  ): void {}
}

/**
 * Reflect all {@linkcode BattleStat} reductions caused by other Pokémon's moves and Abilities.
 * Currently only applies to Mirror Armor.
 */
export class ReflectStatStageChangeAbAttr extends PreStatStageChangeAbAttr {
  /** {@linkcode BattleStat} to reflect */
  private reflectedStat? : BattleStat;

  /**
   * Apply the {@linkcode ReflectStatStageChangeAbAttr} to an interaction
   * @param _pokemon The user pokemon
   * @param _passive N/A
   * @param simulated `true` if the ability is being simulated by the AI
   * @param stat the {@linkcode BattleStat} being affected
   * @param cancelled The {@linkcode BooleanHolder} that will be set to true due to reflection
   * @param args
   */
  override applyPreStatStageChange(_pokemon: Pokemon, _passive: boolean, simulated: boolean, stat: BattleStat, cancelled: BooleanHolder, args: any[]): void {
    const attacker: Pokemon = args[0];
    const stages = args[1];
    this.reflectedStat = stat;
    if (!simulated) {
      globalScene.unshiftPhase(new StatStageChangePhase(attacker.getBattlerIndex(), false, [ stat ], stages, true, false, true, null, true));
    }
    cancelled.value = true;
  }

  getTriggerMessage(pokemon: Pokemon, abilityName: string, ..._args: any[]): string {
    return i18next.t("abilityTriggers:protectStat", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      abilityName,
      statName: this.reflectedStat ? i18next.t(getStatKey(this.reflectedStat)) : i18next.t("battle:stats")
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

  override canApplyPreStatStageChange(pokemon: Pokemon | null, passive: boolean, simulated: boolean, stat: BattleStat, cancelled: BooleanHolder, args: any[]): boolean {
    return isNullOrUndefined(this.protectedStat) || stat === this.protectedStat;
  }

  /**
   * Apply the {@linkcode ProtectedStatAbAttr} to an interaction
   * @param _pokemon
   * @param _passive
   * @param simulated
   * @param stat the {@linkcode BattleStat} being affected
   * @param cancelled The {@linkcode BooleanHolder} that will be set to true if the stat is protected
   * @param _args
   */
  override applyPreStatStageChange(_pokemon: Pokemon, _passive: boolean, _simulated: boolean, stat: BattleStat, cancelled: BooleanHolder, _args: any[]): void {
    cancelled.value = true;
  }

  getTriggerMessage(pokemon: Pokemon, abilityName: string, ..._args: any[]): string {
    return i18next.t("abilityTriggers:protectStat", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      abilityName,
      statName: this.protectedStat ? i18next.t(getStatKey(this.protectedStat)) : i18next.t("battle:stats")
    });
  }
}

/**
 * This attribute applies confusion to the target whenever the user
 * directly poisons them with a move, e.g. Poison Puppeteer.
 * Called in {@linkcode StatusEffectAttr}.
 * @extends PostAttackAbAttr
 * @see {@linkcode applyPostAttack}
 */
export class ConfusionOnStatusEffectAbAttr extends PostAttackAbAttr {
  /** List of effects to apply confusion after */
  private effects: StatusEffect[];

  constructor(...effects: StatusEffect[]) {
    /** This effect does not require a damaging move */
    super((user, target, move) => true);
    this.effects = effects;
  }

  override canApplyPostAttack(pokemon: Pokemon, passive: boolean, simulated: boolean, defender: Pokemon, move: Move, hitResult: HitResult | null, args: any[]): boolean {
    return super.canApplyPostAttack(pokemon, passive, simulated, defender, move, hitResult, args)
        && this.effects.indexOf(args[0]) > -1 && !defender.isFainted() && defender.canAddTag(BattlerTagType.CONFUSED);
  }


  /**
   * Applies confusion to the target pokemon.
   * @param pokemon {@link Pokemon} attacking
   * @param passive N/A
   * @param defender {@link Pokemon} defending
   * @param move {@link Move} used to apply status effect and confusion
   * @param hitResult N/A
   * @param args [0] {@linkcode StatusEffect} applied by move
   */
  override applyPostAttack(pokemon: Pokemon, passive: boolean, simulated: boolean, defender: Pokemon, move: Move, hitResult: HitResult, args: any[]): void {
    if (!simulated) {
      defender.addTag(BattlerTagType.CONFUSED, pokemon.randSeedIntRange(2, 5), move.id, defender.id);
    }
  }
}

export class PreSetStatusAbAttr extends AbAttr {
  /** Return whether the ability attribute can be applied */
  canApplyPreSetStatus(
    pokemon: Pokemon,
    passive: boolean,
    simulated: boolean,
    effect: StatusEffect | undefined,
    cancelled: BooleanHolder,
    args: any[]): boolean {
    return true;
  }

  applyPreSetStatus(
    pokemon: Pokemon,
    passive: boolean,
    simulated: boolean,
    effect: StatusEffect | undefined,
    cancelled: BooleanHolder,
    args: any[],
  ): void {}
}

/**
 * Provides immunity to status effects to specified targets.
 */
export class PreSetStatusEffectImmunityAbAttr extends PreSetStatusAbAttr {
  protected immuneEffects: StatusEffect[];

  /**
   * @param immuneEffects - The status effects to which the Pokémon is immune.
   */
  constructor(...immuneEffects: StatusEffect[]) {
    super();

    this.immuneEffects = immuneEffects;
  }

  override canApplyPreSetStatus(pokemon: Pokemon, passive: boolean, simulated: boolean, effect: StatusEffect, cancelled: BooleanHolder, args: any[]): boolean {
    return effect !== StatusEffect.FAINT && this.immuneEffects.length < 1 || this.immuneEffects.includes(effect);
  }

  /**
   * Applies immunity to supplied status effects.
   *
   * @param pokemon - The Pokémon to which the status is being applied.
   * @param passive - n/a
   * @param effect - The status effect being applied.
   * @param cancelled - A holder for a boolean value indicating if the status application was cancelled.
   * @param args - n/a
   */
  override applyPreSetStatus(pokemon: Pokemon, passive: boolean, simulated: boolean, effect: StatusEffect, cancelled: BooleanHolder, args: any[]): void {
    cancelled.value = true;
  }

  getTriggerMessage(pokemon: Pokemon, abilityName: string, ...args: any[]): string {
    return this.immuneEffects.length ?
      i18next.t("abilityTriggers:statusEffectImmunityWithName", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        abilityName,
        statusEffectName: getStatusEffectDescriptor(args[0] as StatusEffect)
      }) :
      i18next.t("abilityTriggers:statusEffectImmunity", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        abilityName
      });
  }
}

/**
 * Provides immunity to status effects to the user.
 * @extends PreSetStatusEffectImmunityAbAttr
 */
export class StatusEffectImmunityAbAttr extends PreSetStatusEffectImmunityAbAttr { }

/**
 * Provides immunity to status effects to the user's field.
 * @extends PreSetStatusEffectImmunityAbAttr
 */
export class UserFieldStatusEffectImmunityAbAttr extends PreSetStatusEffectImmunityAbAttr { }

/**
 * Conditionally provides immunity to status effects to the user's field.
 *
 * Used by {@linkcode Abilities.FLOWER_VEIL | Flower Veil}.
 * @extends UserFieldStatusEffectImmunityAbAttr
 *
 */
export class ConditionalUserFieldStatusEffectImmunityAbAttr extends UserFieldStatusEffectImmunityAbAttr {
  /**
   * The condition for the field immunity to be applied.
   * @param target The target of the status effect
   * @param source The source of the status effect
   */
  protected condition: (target: Pokemon, source: Pokemon | null) => boolean;

  /**
   * Evaluate the condition to determine if the {@linkcode ConditionalUserFieldStatusEffectImmunityAbAttr} can be applied.
   * @param pokemon The pokemon with the ability
   * @param passive unused
   * @param simulated Whether the ability is being simulated
   * @param effect The status effect being applied
   * @param cancelled Holds whether the status effect was cancelled by a prior effect
   * @param args `Args[0]` is the target of the status effect, `Args[1]` is the source.
   * @returns Whether the ability can be applied to cancel the status effect.
   */
  override canApplyPreSetStatus(pokemon: Pokemon, passive: boolean, simulated: boolean, effect: StatusEffect, cancelled: BooleanHolder, args: [Pokemon, Pokemon | null, ...any]): boolean {
    return (!cancelled.value && effect !== StatusEffect.FAINT && this.immuneEffects.length < 1 || this.immuneEffects.includes(effect)) && this.condition(args[0], args[1]);
  }

  constructor(condition: (target: Pokemon, source: Pokemon | null) => boolean, ...immuneEffects: StatusEffect[]) {
    super(...immuneEffects);

    this.condition = condition;
  }
}

/**
 * Conditionally provides immunity to stat drop effects to the user's field.
 * 
 * Used by {@linkcode Abilities.FLOWER_VEIL | Flower Veil}.
 */
export class ConditionalUserFieldProtectStatAbAttr extends PreStatStageChangeAbAttr {
  /** {@linkcode BattleStat} to protect or `undefined` if **all** {@linkcode BattleStat} are protected */
  protected protectedStat?: BattleStat;
  
  /** If the method evaluates to true, the stat will be protected. */
  protected condition: (target: Pokemon) => boolean;

  constructor(condition: (target: Pokemon) => boolean, protectedStat?: BattleStat) {
    super();
    this.condition = condition;
  }

  /**
   * Determine whether the {@linkcode ConditionalUserFieldProtectStatAbAttr} can be applied.
   * @param pokemon The pokemon with the ability
   * @param passive unused
   * @param simulated Unused
   * @param stat The stat being affected
   * @param cancelled Holds whether the stat change was already prevented.
   * @param args Args[0] is the target pokemon of the stat change.
   * @returns 
   */
  override canApplyPreStatStageChange(pokemon: Pokemon, passive: boolean, simulated: boolean, stat: BattleStat, cancelled: BooleanHolder, args: [Pokemon, ...any]): boolean {
    const target = args[0];
    if (!target) {
      return false;
    }
    return !cancelled.value && (isNullOrUndefined(this.protectedStat) || stat === this.protectedStat) && this.condition(target);
  }

  /**
   * Apply the {@linkcode ConditionalUserFieldStatusEffectImmunityAbAttr} to an interaction
   * @param _pokemon The pokemon the stat change is affecting (unused)
   * @param _passive unused
   * @param _simulated unused
   * @param stat The stat being affected
   * @param cancelled Will be set to true if the stat change is prevented
   * @param _args unused
   */
  override applyPreStatStageChange(_pokemon: Pokemon, _passive: boolean, _simulated: boolean, _stat: BattleStat, cancelled: BooleanHolder, _args: any[]): void {
    cancelled.value = true;
  }
}


export class PreApplyBattlerTagAbAttr extends AbAttr {
  canApplyPreApplyBattlerTag(
    pokemon: Pokemon,
    passive: boolean,
    simulated: boolean,
    tag: BattlerTag,
    cancelled: BooleanHolder,
    args: any[],
  ): boolean {
    return true;
  }

  applyPreApplyBattlerTag(
    pokemon: Pokemon,
    passive: boolean,
    simulated: boolean,
    tag: BattlerTag,
    cancelled: BooleanHolder,
    args: any[],
  ): void {}
}

/**
 * Provides immunity to BattlerTags {@linkcode BattlerTag} to specified targets.
 */
export class PreApplyBattlerTagImmunityAbAttr extends PreApplyBattlerTagAbAttr {
  protected immuneTagTypes: BattlerTagType[];
  protected battlerTag: BattlerTag;

  constructor(immuneTagTypes: BattlerTagType | BattlerTagType[]) {
    super(true);

    this.immuneTagTypes = Array.isArray(immuneTagTypes) ? immuneTagTypes : [ immuneTagTypes ];
  }

  override canApplyPreApplyBattlerTag(pokemon: Pokemon, passive: boolean, simulated: boolean, tag: BattlerTag, cancelled: BooleanHolder, args: any[]): boolean {
    this.battlerTag = tag;

    return !cancelled.value && this.immuneTagTypes.includes(tag.tagType);
  }

  override applyPreApplyBattlerTag(pokemon: Pokemon, passive: boolean, simulated: boolean, tag: BattlerTag, cancelled: BooleanHolder, args: any[]): void {
    cancelled.value = true;
  }

  getTriggerMessage(pokemon: Pokemon, abilityName: string, ...args: any[]): string {
    return i18next.t("abilityTriggers:battlerTagImmunity", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      abilityName,
      battlerTagName: this.battlerTag.getDescriptor()
    });
  }
}

/**
 * Provides immunity to BattlerTags {@linkcode BattlerTag} to the user.
 * @extends PreApplyBattlerTagImmunityAbAttr
 */
export class BattlerTagImmunityAbAttr extends PreApplyBattlerTagImmunityAbAttr { }

/**
 * Provides immunity to BattlerTags {@linkcode BattlerTag} to the user's field.
 * @extends PreApplyBattlerTagImmunityAbAttr
 */
export class UserFieldBattlerTagImmunityAbAttr extends PreApplyBattlerTagImmunityAbAttr { }

export class ConditionalUserFieldBattlerTagImmunityAbAttr extends UserFieldBattlerTagImmunityAbAttr {
  private condition: (target: Pokemon) => boolean;

  /**
   * Determine whether the {@linkcode ConditionalUserFieldBattlerTagImmunityAbAttr} can be applied by passing the target pokemon to the condition.
   * @param pokemon The pokemon owning the ability
   * @param passive unused
   * @param simulated whether the ability is being simulated (unused)
   * @param tag The {@linkcode BattlerTag} being applied
   * @param cancelled Holds whether the tag was previously cancelled (unused)
   * @param args Args[0] is the target that the tag is attempting to be applied to
   * @returns Whether the ability can be used to cancel the battler tag
   */
  override canApplyPreApplyBattlerTag(pokemon: Pokemon, passive: boolean, simulated: boolean, tag: BattlerTag, cancelled: BooleanHolder, args: [Pokemon, ...any]): boolean {
    return super.canApplyPreApplyBattlerTag(pokemon, passive, simulated, tag, cancelled, args) && this.condition(args[0]);
  }

  constructor(condition: (target: Pokemon) => boolean, immuneTagTypes: BattlerTagType | BattlerTagType[]) {
    super(immuneTagTypes);

    this.condition = condition;
  }
}

export class BlockCritAbAttr extends AbAttr {
  constructor() {
    super(false);
  }

  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder, args: any[]): void {
    (args[0] as BooleanHolder).value = true;
  }
}

export class BonusCritAbAttr extends AbAttr {
  constructor() {
    super(false);
  }

  /**
   * Apply the bonus crit ability by increasing the value in the provided number holder by 1
   * 
   * @param pokemon The pokemon with the BonusCrit ability (unused)
   * @param passive Unused
   * @param simulated Unused
   * @param cancelled Unused
   * @param args Args[0] is a number holder containing the crit stage.
   */
  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder, args: [NumberHolder, ...any]): void {
    (args[0] as NumberHolder).value += 1;
  }
}

export class MultCritAbAttr extends AbAttr {
  public multAmount: number;

  constructor(multAmount: number) {
    super(false);

    this.multAmount = multAmount;
  }

  override canApply(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    const critMult = args[0] as NumberHolder;
    return critMult.value > 1;
  }

  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder, args: any[]): void {
    const critMult = args[0] as NumberHolder;
    critMult.value *= this.multAmount;
  }
}

/**
 * Guarantees a critical hit according to the given condition, except if target prevents critical hits. ie. Merciless
 * @extends AbAttr
 * @see {@linkcode apply}
 */
export class ConditionalCritAbAttr extends AbAttr {
  private condition: PokemonAttackCondition;

  constructor(condition: PokemonAttackCondition, checkUser?: boolean) {
    super(false);

    this.condition = condition;
  }

  override canApply(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    const target = (args[1] as Pokemon);
    const move = (args[2] as Move);
    return this.condition(pokemon, target, move);
  }

  /**
   * @param pokemon {@linkcode Pokemon} user.
   * @param args [0] {@linkcode BooleanHolder} If true critical hit is guaranteed.
   *             [1] {@linkcode Pokemon} Target.
   *             [2] {@linkcode Move} used by ability user.
   */
  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder, args: any[]): void {
    (args[0] as BooleanHolder).value = true;
  }
}

export class BlockNonDirectDamageAbAttr extends AbAttr {
  constructor() {
    super(false);
  }

  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder, args: any[]): void {
    cancelled.value = true;
  }
}

/**
 * This attribute will block any status damage that you put in the parameter.
 */
export class BlockStatusDamageAbAttr extends AbAttr {
  private effects: StatusEffect[];

  /**
   * @param {StatusEffect[]} effects The status effect(s) that will be blocked from damaging the ability pokemon
   */
  constructor(...effects: StatusEffect[]) {
    super(false);

    this.effects = effects;
  }

  override canApply(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    if (pokemon.status && this.effects.includes(pokemon.status.effect)) {
      return true;
    }
    return false;
  }

  /**
   * @param {Pokemon} pokemon The pokemon with the ability
   * @param {boolean} passive N/A
   * @param {BooleanHolder} cancelled Whether to cancel the status damage
   * @param {any[]} args N/A
   */
  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder, args: any[]): void {
    cancelled.value = true;
  }
}

export class BlockOneHitKOAbAttr extends AbAttr {
  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder, args: any[]): void {
    cancelled.value = true;
  }
}

/**
 * This governs abilities that alter the priority of moves
 * Abilities: Prankster, Gale Wings, Triage, Mycelium Might, Stall
 * Note - Quick Claw has a separate and distinct implementation outside of priority
 */
export class ChangeMovePriorityAbAttr extends AbAttr {
  private moveFunc: (pokemon: Pokemon, move: Move) => boolean;
  private changeAmount: number;

  /**
   * @param {(pokemon, move) => boolean} moveFunc applies priority-change to moves within a provided category
   * @param {number} changeAmount the amount of priority added or subtracted
   */
  constructor(moveFunc: (pokemon: Pokemon, move: Move) => boolean, changeAmount: number) {
    super(false);

    this.moveFunc = moveFunc;
    this.changeAmount = changeAmount;
  }

  override canApply(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return this.moveFunc(pokemon, args[0] as Move);
  }

  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder, args: any[]): void {
    (args[1] as NumberHolder).value += this.changeAmount;
  }
}

export class IgnoreContactAbAttr extends AbAttr { }

export class PreWeatherEffectAbAttr extends AbAttr {
  canApplyPreWeatherEffect(
    pokemon: Pokemon,
    passive: Boolean,
    simulated: boolean,
    weather: Weather | null,
    cancelled: BooleanHolder,
    args: any[]): boolean {
    return true;
  }
  
  applyPreWeatherEffect(
    pokemon: Pokemon,
    passive: boolean,
    simulated: boolean,
    weather: Weather | null,
    cancelled: BooleanHolder,
    args: any[],
  ): void {}
}

export class PreWeatherDamageAbAttr extends PreWeatherEffectAbAttr { }

export class BlockWeatherDamageAttr extends PreWeatherDamageAbAttr {
  private weatherTypes: WeatherType[];

  constructor(...weatherTypes: WeatherType[]) {
    super(false);

    this.weatherTypes = weatherTypes;
  }

  override canApplyPreWeatherEffect(pokemon: Pokemon, passive: Boolean, simulated: boolean, weather: Weather, cancelled: BooleanHolder, args: any[]): boolean {
    return !this.weatherTypes.length || this.weatherTypes.indexOf(weather?.weatherType) > -1;
  }

  override applyPreWeatherEffect(pokemon: Pokemon, passive: boolean, simulated: boolean, weather: Weather, cancelled: BooleanHolder, args: any[]): void {
    cancelled.value = true;
  }
}

export class SuppressWeatherEffectAbAttr extends PreWeatherEffectAbAttr {
  public affectsImmutable: boolean;

  constructor(affectsImmutable?: boolean) {
    super(true);

    this.affectsImmutable = !!affectsImmutable;
  }

  override canApplyPreWeatherEffect(pokemon: Pokemon, passive: Boolean, simulated: boolean, weather: Weather, cancelled: BooleanHolder, args: any[]): boolean {
    return this.affectsImmutable || weather.isImmutable();
  }

  override applyPreWeatherEffect(pokemon: Pokemon, passive: boolean, simulated: boolean, weather: Weather, cancelled: BooleanHolder, args: any[]): void {
    cancelled.value = true;
  }
}

/**
 * Condition function to applied to abilities related to Sheer Force.
 * Checks if last move used against target was affected by a Sheer Force user and:
 * Disables: Color Change, Pickpocket, Berserk, Anger Shell
 * @returns {AbAttrCondition} If false disables the ability which the condition is applied to.
 */
function getSheerForceHitDisableAbCondition(): AbAttrCondition {
  return (pokemon: Pokemon) => {
    if (!pokemon.turnData) {
      return true;
    }

    const lastReceivedAttack = pokemon.turnData.attacksReceived[0];
    if (!lastReceivedAttack) {
      return true;
    }

    const lastAttacker = pokemon.getOpponents().find(p => p.id === lastReceivedAttack.sourceId);
    if (!lastAttacker) {
      return true;
    }

    /**if the last move chance is greater than or equal to cero, and the last attacker's ability is sheer force*/
    const SheerForceAffected = allMoves[lastReceivedAttack.move].chance >= 0 && lastAttacker.hasAbility(Abilities.SHEER_FORCE);

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
        if (move.getMove() instanceof AttackMove && pokemon.getAttackTypeEffectiveness(move.getMove().type, opponent, true, undefined, move.getMove()) >= 2) {
          return true;
        }
        // move is a OHKO
        if (move.getMove().hasAttr(OneHitKOAttr)) {
          return true;
        }
        // edge case for hidden power, type is computed
        if (move.getMove().id === Moves.HIDDEN_POWER) {
          const iv_val = Math.floor(((opponent.ivs[Stat.HP] & 1)
              + (opponent.ivs[Stat.ATK] & 1) * 2
              + (opponent.ivs[Stat.DEF] & 1) * 4
              + (opponent.ivs[Stat.SPD] & 1) * 8
              + (opponent.ivs[Stat.SPATK] & 1) * 16
              + (opponent.ivs[Stat.SPDEF] & 1) * 32) * 15 / 63);

          const type = [
            PokemonType.FIGHTING, PokemonType.FLYING, PokemonType.POISON, PokemonType.GROUND,
            PokemonType.ROCK, PokemonType.BUG, PokemonType.GHOST, PokemonType.STEEL,
            PokemonType.FIRE, PokemonType.WATER, PokemonType.GRASS, PokemonType.ELECTRIC,
            PokemonType.PSYCHIC, PokemonType.ICE, PokemonType.DRAGON, PokemonType.DARK ][iv_val];

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
 * @param {Abilities} ability The ability to check if it's already been applied
 * @returns {AbAttrCondition} The condition
 */
function getOncePerBattleCondition(ability: Abilities): AbAttrCondition {
  return (pokemon: Pokemon) => {
    return !pokemon.battleData?.abilitiesApplied.includes(ability);
  };
}

export class ForewarnAbAttr extends PostSummonAbAttr {
  constructor() {
    super(true);
  }

  override applyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
    let maxPowerSeen = 0;
    let maxMove = "";
    let movePower = 0;
    for (const opponent of pokemon.getOpponents()) {
      for (const move of opponent.moveset) {
        if (move?.getMove() instanceof StatusMove) {
          movePower = 1;
        } else if (move?.getMove().hasAttr(OneHitKOAttr)) {
          movePower = 150;
        } else if (move?.getMove().id === Moves.COUNTER || move?.getMove().id === Moves.MIRROR_COAT || move?.getMove().id === Moves.METAL_BURST) {
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
    if (!simulated) {
      globalScene.queueMessage(i18next.t("abilityTriggers:forewarn", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon), moveName: maxMove }));
    }
  }
}

export class FriskAbAttr extends PostSummonAbAttr {
  constructor() {
    super(true);
  }

  override applyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
    if (!simulated) {
      for (const opponent of pokemon.getOpponents()) {
        globalScene.queueMessage(i18next.t("abilityTriggers:frisk", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon), opponentName: opponent.name, opponentAbilityName: opponent.getAbility().name }));
        setAbilityRevealed(opponent);
      }
    }
  }
}

export class PostWeatherChangeAbAttr extends AbAttr {
  canApplyPostWeatherChange(pokemon: Pokemon, passive: boolean, simulated: boolean, weather: WeatherType, args: any[]): boolean {
    return true;
  }

  applyPostWeatherChange(pokemon: Pokemon, passive: boolean, simulated: boolean, weather: WeatherType, args: any[]): void {}
}

/**
 * Triggers weather-based form change when weather changes.
 * Used by Forecast and Flower Gift.
 * @extends PostWeatherChangeAbAttr
 */
export class PostWeatherChangeFormChangeAbAttr extends PostWeatherChangeAbAttr {
  private ability: Abilities;
  private formRevertingWeathers: WeatherType[];

  constructor(ability: Abilities, formRevertingWeathers: WeatherType[]) {
    super(false);

    this.ability = ability;
    this.formRevertingWeathers = formRevertingWeathers;
  }

  override canApplyPostWeatherChange(pokemon: Pokemon, passive: boolean, simulated: boolean, weather: WeatherType, args: any[]): boolean {
    const isCastformWithForecast = (pokemon.species.speciesId === Species.CASTFORM && this.ability === Abilities.FORECAST);
    const isCherrimWithFlowerGift = (pokemon.species.speciesId === Species.CHERRIM && this.ability === Abilities.FLOWER_GIFT);

    return isCastformWithForecast || isCherrimWithFlowerGift;
  }

  /**
   * Calls {@linkcode Arena.triggerWeatherBasedFormChangesToNormal | triggerWeatherBasedFormChangesToNormal} when the
   * weather changed to form-reverting weather, otherwise calls {@linkcode Arena.triggerWeatherBasedFormChanges | triggerWeatherBasedFormChanges}
   * @param {Pokemon} pokemon the Pokemon with this ability
   * @param passive n/a
   * @param weather n/a
   * @param args n/a
   */
  override applyPostWeatherChange(pokemon: Pokemon, passive: boolean, simulated: boolean, weather: WeatherType, args: any[]): void {
    if (simulated) {
      return;
    }

    const weatherType = globalScene.arena.weather?.weatherType;

    if (weatherType && this.formRevertingWeathers.includes(weatherType)) {
      globalScene.arena.triggerWeatherBasedFormChangesToNormal();
    } else {
      globalScene.arena.triggerWeatherBasedFormChanges();
    }
  }
}

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

  override canApplyPostWeatherChange(pokemon: Pokemon, passive: boolean, simulated: boolean, weather: WeatherType, args: any[]): boolean {
    return !!this.weatherTypes.find(w => weather === w) && pokemon.canAddTag(this.tagType);
  }

  override applyPostWeatherChange(pokemon: Pokemon, passive: boolean, simulated: boolean, weather: WeatherType, args: any[]): void {
    if (!simulated) {
      pokemon.addTag(this.tagType, this.turnCount);
    }
  }
}

export class PostWeatherLapseAbAttr extends AbAttr {
  protected weatherTypes: WeatherType[];

  constructor(...weatherTypes: WeatherType[]) {
    super();

    this.weatherTypes = weatherTypes;
  }

  canApplyPostWeatherLapse(
    pokemon: Pokemon,
    passive: boolean,
    simulated: boolean,
    weather: Weather | null,
    args: any[]): boolean {
    return true;
  }

  applyPostWeatherLapse(
    pokemon: Pokemon,
    passive: boolean,
    simulated: boolean,
    weather: Weather | null,
    args: any[],
  ): void {}

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

  override canApplyPostWeatherLapse(pokemon: Pokemon, passive: boolean, simulated: boolean, weather: Weather | null, args: any[]): boolean {
    return !pokemon.isFullHp();
  }

  override applyPostWeatherLapse(pokemon: Pokemon, passive: boolean, simulated: boolean, weather: Weather, args: any[]): void {
    const abilityName = (!passive ? pokemon.getAbility() : pokemon.getPassiveAbility()).name;
    if (!simulated) {
      globalScene.unshiftPhase(new PokemonHealPhase(pokemon.getBattlerIndex(),
        toDmgValue(pokemon.getMaxHp() / (16 / this.healFactor)), i18next.t("abilityTriggers:postWeatherLapseHeal", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon), abilityName }), true));
    }
  }
}

export class PostWeatherLapseDamageAbAttr extends PostWeatherLapseAbAttr {
  private damageFactor: number;

  constructor(damageFactor: number, ...weatherTypes: WeatherType[]) {
    super(...weatherTypes);

    this.damageFactor = damageFactor;
  }

  override canApplyPostWeatherLapse(pokemon: Pokemon, passive: boolean, simulated: boolean, weather: Weather | null, args: any[]): boolean {
    return !pokemon.hasAbilityWithAttr(BlockNonDirectDamageAbAttr);
  }

  override applyPostWeatherLapse(pokemon: Pokemon, passive: boolean, simulated: boolean, weather: Weather, args: any[]): void {
    if (!simulated) {
      const abilityName = (!passive ? pokemon.getAbility() : pokemon.getPassiveAbility()).name;
      globalScene.queueMessage(i18next.t("abilityTriggers:postWeatherLapseDamage", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon), abilityName }));
      pokemon.damageAndUpdate(toDmgValue(pokemon.getMaxHp() / (16 / this.damageFactor)), { result: HitResult.INDIRECT });
    }
  }
}

export class PostTerrainChangeAbAttr extends AbAttr {
  canApplyPostTerrainChange(pokemon: Pokemon, passive: boolean, simulated: boolean, terrain: TerrainType, args: any[]): boolean {
    return true;
  }

  applyPostTerrainChange(pokemon: Pokemon, passive: boolean, simulated: boolean, terrain: TerrainType, args: any[]): void {}
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

  override canApplyPostTerrainChange(pokemon: Pokemon, passive: boolean, simulated: boolean, terrain: TerrainType, args: any[]): boolean {
    return !!this.terrainTypes.find(t => t === terrain) && pokemon.canAddTag(this.tagType);
  }

  override applyPostTerrainChange(pokemon: Pokemon, passive: boolean, simulated: boolean, terrain: TerrainType, args: any[]): void {
    if (!simulated) {
      pokemon.addTag(this.tagType, this.turnCount);
    }
  }
}

function getTerrainCondition(...terrainTypes: TerrainType[]): AbAttrCondition {
  return (pokemon: Pokemon) => {
    const terrainType = globalScene.arena.terrain?.terrainType;
    return !!terrainType && terrainTypes.indexOf(terrainType) > -1;
  };
}

export class PostTurnAbAttr extends AbAttr {
  canApplyPostTurn(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return true;
  }

  applyPostTurn(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {}
}

/**
 * This attribute will heal 1/8th HP if the ability pokemon has the correct status.
 */
export class PostTurnStatusHealAbAttr extends PostTurnAbAttr {
  private effects: StatusEffect[];

  /**
   * @param {StatusEffect[]} effects The status effect(s) that will qualify healing the ability pokemon
   */
  constructor(...effects: StatusEffect[]) {
    super(false);

    this.effects = effects;
  }

  override canApplyPostTurn(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return !isNullOrUndefined(pokemon.status) && this.effects.includes(pokemon.status.effect) && !pokemon.isFullHp();
  }

  /**
   * @param {Pokemon} pokemon The pokemon with the ability that will receive the healing
   * @param {Boolean} passive N/A
   * @param {any[]} args N/A
   */
  override applyPostTurn(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
    if (!simulated) {
      const abilityName = (!passive ? pokemon.getAbility() : pokemon.getPassiveAbility()).name;
      globalScene.unshiftPhase(new PokemonHealPhase(pokemon.getBattlerIndex(),
        toDmgValue(pokemon.getMaxHp() / 8), i18next.t("abilityTriggers:poisonHeal", { pokemonName: getPokemonNameWithAffix(pokemon), abilityName }), true));
    }
  }
}

/**
 * After the turn ends, resets the status of either the ability holder or their ally
 * @param {boolean} allyTarget Whether to target ally, defaults to false (self-target)
 */
export class PostTurnResetStatusAbAttr extends PostTurnAbAttr {
  private allyTarget: boolean;
  private target: Pokemon | undefined;

  constructor(allyTarget = false) {
    super(true);
    this.allyTarget = allyTarget;
  }

  override canApplyPostTurn(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    if (this.allyTarget) {
      this.target = pokemon.getAlly();
    } else {
      this.target = pokemon;
    }

    const effect = this.target?.status?.effect;
    return !!effect && effect !== StatusEffect.FAINT;
  }

  override applyPostTurn(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
    if (!simulated && this.target?.status) {
      globalScene.queueMessage(getStatusEffectHealText(this.target.status?.effect, getPokemonNameWithAffix(this.target)));
      this.target.resetStatus(false);
      this.target.updateInfo();
    }
  }
}

/**
 * After the turn ends, try to create an extra item
 */
export class PostTurnLootAbAttr extends PostTurnAbAttr {
  /**
   * @param itemType - The type of item to create
   * @param procChance - Chance to create an item
   * @see {@linkcode applyPostTurn()}
   */
  constructor(
    /** Extend itemType to add more options */
    private itemType: "EATEN_BERRIES" | "HELD_BERRIES",
    private procChance: (pokemon: Pokemon) => number
  ) {
    super();
  }

  override canApplyPostTurn(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    // Clamp procChance to [0, 1]. Skip if didn't proc (less than pass)
    const pass = Phaser.Math.RND.realInRange(0, 1);
    return !(Math.max(Math.min(this.procChance(pokemon), 1), 0) < pass) && this.itemType === "EATEN_BERRIES" && !!pokemon.battleData.berriesEaten;
  }

  override applyPostTurn(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
    this.createEatenBerry(pokemon, simulated);
  }

  /**
   * Create a new berry chosen randomly from the berries the pokemon ate this battle
   * @param pokemon The pokemon with this ability
   * @param simulated whether the associated ability call is simulated
   * @returns whether a new berry was created
   */
  createEatenBerry(pokemon: Pokemon, simulated: boolean): boolean {
    const berriesEaten = pokemon.battleData.berriesEaten;

    if (!berriesEaten.length) {
      return false;
    }

    if (simulated) {
      return true;
    }

    const randomIdx = randSeedInt(berriesEaten.length);
    const chosenBerryType = berriesEaten[randomIdx];
    const chosenBerry = new BerryModifierType(chosenBerryType);
    berriesEaten.splice(randomIdx); // Remove berry from memory

    const berryModifier = globalScene.findModifier(
      (m) => m instanceof BerryModifier && m.berryType === chosenBerryType,
      pokemon.isPlayer()
    ) as BerryModifier | undefined;

    if (!berryModifier) {
      const newBerry = new BerryModifier(chosenBerry, pokemon.id, chosenBerryType, 1);
      if (pokemon.isPlayer()) {
        globalScene.addModifier(newBerry);
      } else {
        globalScene.addEnemyModifier(newBerry);
      }
    } else if (berryModifier.stackCount < berryModifier.getMaxHeldItemCount(pokemon)) {
      berryModifier.stackCount++;
    }

    globalScene.queueMessage(i18next.t("abilityTriggers:postTurnLootCreateEatenBerry", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon), berryName: chosenBerry.name }));
    globalScene.updateModifiers(pokemon.isPlayer());

    return true;
  }
}

/**
 * Attribute used for {@linkcode Abilities.MOODY}
 */
export class MoodyAbAttr extends PostTurnAbAttr {
  constructor() {
    super(true);
  }
  /**
   * Randomly increases one stat stage by 2 and decreases a different stat stage by 1
   * @param {Pokemon} pokemon Pokemon that has this ability
   * @param passive N/A
   * @param simulated true if applying in a simulated call.
   * @param args N/A
   *
   * Any stat stages at +6 or -6 are excluded from being increased or decreased, respectively
   * If the pokemon already has all stat stages raised to 6, it will only decrease one stat stage by 1
   * If the pokemon already has all stat stages lowered to -6, it will only increase one stat stage by 2
   */
  override applyPostTurn(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
    const canRaise = EFFECTIVE_STATS.filter(s => pokemon.getStatStage(s) < 6);
    let canLower = EFFECTIVE_STATS.filter(s => pokemon.getStatStage(s) > -6);

    if (!simulated) {
      if (canRaise.length > 0) {
        const raisedStat = canRaise[pokemon.randSeedInt(canRaise.length)];
        canLower = canRaise.filter(s => s !== raisedStat);
        globalScene.unshiftPhase(new StatStageChangePhase(pokemon.getBattlerIndex(), true, [ raisedStat ], 2));
      }
      if (canLower.length > 0) {
        const loweredStat = canLower[pokemon.randSeedInt(canLower.length)];
        globalScene.unshiftPhase(new StatStageChangePhase(pokemon.getBattlerIndex(), true, [ loweredStat ], -1));
      }
    }
  }
}

export class SpeedBoostAbAttr extends PostTurnAbAttr {

  constructor() {
    super(true);
  }

  override canApplyPostTurn(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return simulated || (!pokemon.turnData.switchedInThisTurn && !pokemon.turnData.failedRunAway);
  }

  override applyPostTurn(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
    globalScene.unshiftPhase(new StatStageChangePhase(pokemon.getBattlerIndex(), true, [ Stat.SPD ], 1));
  }
}

export class PostTurnHealAbAttr extends PostTurnAbAttr {
  override canApplyPostTurn(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return !pokemon.isFullHp();
  }

  override applyPostTurn(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
    if (!simulated) {
      const abilityName = (!passive ? pokemon.getAbility() : pokemon.getPassiveAbility()).name;
      globalScene.unshiftPhase(new PokemonHealPhase(pokemon.getBattlerIndex(),
        toDmgValue(pokemon.getMaxHp() / 16), i18next.t("abilityTriggers:postTurnHeal", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon), abilityName }), true));
    }
  }
}

export class PostTurnFormChangeAbAttr extends PostTurnAbAttr {
  private formFunc: (p: Pokemon) => number;

  constructor(formFunc: ((p: Pokemon) => number)) {
    super(true);

    this.formFunc = formFunc;
  }

  override canApplyPostTurn(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return this.formFunc(pokemon) !== pokemon.formIndex;
  }

  override applyPostTurn(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
    if (!simulated) {
      globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeAbilityTrigger, false);
    }
  }
}


/**
 * Attribute used for abilities (Bad Dreams) that damages the opponents for being asleep
 */
export class PostTurnHurtIfSleepingAbAttr extends PostTurnAbAttr {
  override canApplyPostTurn(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return pokemon.getOpponents().some(opp => (opp.status?.effect === StatusEffect.SLEEP || opp.hasAbility(Abilities.COMATOSE)) && !opp.hasAbilityWithAttr(BlockNonDirectDamageAbAttr) && !opp.switchOutStatus);
  }
  /**
   * Deals damage to all sleeping opponents equal to 1/8 of their max hp (min 1)
   * @param pokemon Pokemon that has this ability
   * @param passive N/A
   * @param simulated `true` if applying in a simulated call.
   * @param args N/A
   */
  override applyPostTurn(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
    for (const opp of pokemon.getOpponents()) {
      if ((opp.status?.effect === StatusEffect.SLEEP || opp.hasAbility(Abilities.COMATOSE)) && !opp.hasAbilityWithAttr(BlockNonDirectDamageAbAttr) && !opp.switchOutStatus) {
        if (!simulated) {
          opp.damageAndUpdate(toDmgValue(opp.getMaxHp() / 8), { result: HitResult.INDIRECT });
          globalScene.queueMessage(i18next.t("abilityTriggers:badDreams", { pokemonName: getPokemonNameWithAffix(opp) }));
        }
      }
    }
  }
}


/**
 * Grabs the last failed Pokeball used
 * @extends PostTurnAbAttr
 * @see {@linkcode applyPostTurn} */
export class FetchBallAbAttr extends PostTurnAbAttr {
  constructor() {
    super();
  }

  override canApplyPostTurn(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return !simulated && !isNullOrUndefined(globalScene.currentBattle.lastUsedPokeball) && !!pokemon.isPlayer;
  }

  /**
   * Adds the last used Pokeball back into the player's inventory
   * @param pokemon {@linkcode Pokemon} with this ability
   * @param passive N/A
   * @param args N/A
   */
  override applyPostTurn(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
    const lastUsed = globalScene.currentBattle.lastUsedPokeball;
    globalScene.pokeballCounts[lastUsed!]++;
    globalScene.currentBattle.lastUsedPokeball = null;
    globalScene.queueMessage(i18next.t("abilityTriggers:fetchBall", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon), pokeballName: getPokeballName(lastUsed!) }));
  }
}

export class PostBiomeChangeAbAttr extends AbAttr { }

export class PostBiomeChangeWeatherChangeAbAttr extends PostBiomeChangeAbAttr {
  private weatherType: WeatherType;

  constructor(weatherType: WeatherType) {
    super();

    this.weatherType = weatherType;
  }

  override canApply(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return ((globalScene.arena.weather?.isImmutable() ?? false) && globalScene.arena.canSetWeather(this.weatherType));
  }

  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder, args: any[]): void {
    if (!simulated) {
      globalScene.arena.trySetWeather(this.weatherType, pokemon);
    }
  }
}

export class PostBiomeChangeTerrainChangeAbAttr extends PostBiomeChangeAbAttr {
  private terrainType: TerrainType;

  constructor(terrainType: TerrainType) {
    super();

    this.terrainType = terrainType;
  }

  override canApply(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return globalScene.arena.canSetTerrain(this.terrainType);
  }

  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder, args: any[]): void {
    if (!simulated) {
      globalScene.arena.trySetTerrain(this.terrainType, false, pokemon);
    }
  }
}

/**
 * Triggers just after a move is used either by the opponent or the player
 * @extends AbAttr
 */
export class PostMoveUsedAbAttr extends AbAttr {
  canApplyPostMoveUsed(
    pokemon: Pokemon,
    move: PokemonMove,
    source: Pokemon,
    targets: BattlerIndex[],
    simulated: boolean,
    args: any[]): boolean {
    return true;
  }

  applyPostMoveUsed(
    pokemon: Pokemon,
    move: PokemonMove,
    source: Pokemon,
    targets: BattlerIndex[],
    simulated: boolean,
    args: any[],
  ): void {}
}

/**
 * Triggers after a dance move is used either by the opponent or the player
 * @extends PostMoveUsedAbAttr
 */
export class PostDancingMoveAbAttr extends PostMoveUsedAbAttr {
  override canApplyPostMoveUsed(dancer: Pokemon, move: PokemonMove, source: Pokemon, targets: BattlerIndex[], simulated: boolean, args: any[]): boolean {
    // List of tags that prevent the Dancer from replicating the move
    const forbiddenTags = [ BattlerTagType.FLYING, BattlerTagType.UNDERWATER,
      BattlerTagType.UNDERGROUND, BattlerTagType.HIDDEN ];
    // The move to replicate cannot come from the Dancer
    return source.getBattlerIndex() !== dancer.getBattlerIndex()
    && !dancer.summonData.tags.some(tag => forbiddenTags.includes(tag.tagType));
  }

  /**
   * Resolves the Dancer ability by replicating the move used by the source of the dance
   * either on the source itself or on the target of the dance
   * @param dancer {@linkcode Pokemon} with Dancer ability
   * @param move {@linkcode PokemonMove} Dancing move used by the source
   * @param source {@linkcode Pokemon} that used the dancing move
   * @param targets {@linkcode BattlerIndex}Targets of the dancing move
   * @param args N/A
   */
  override applyPostMoveUsed(
    dancer: Pokemon,
    move: PokemonMove,
    source: Pokemon,
    targets: BattlerIndex[],
    simulated: boolean,
    args: any[]): void {
    if (!simulated) {
      // If the move is an AttackMove or a StatusMove the Dancer must replicate the move on the source of the Dance
      if (move.getMove() instanceof AttackMove || move.getMove() instanceof StatusMove) {
        const target = this.getTarget(dancer, source, targets);
        globalScene.unshiftPhase(new MovePhase(dancer, target, move, true, true));
      } else if (move.getMove() instanceof SelfStatusMove) {
        // If the move is a SelfStatusMove (ie. Swords Dance) the Dancer should replicate it on itself
        globalScene.unshiftPhase(new MovePhase(dancer, [ dancer.getBattlerIndex() ], move, true, true));
      }
    }
  }

  /**
   * Get the correct targets of Dancer ability
   *
   * @param dancer {@linkcode Pokemon} Pokemon with Dancer ability
   * @param source {@linkcode Pokemon} Source of the dancing move
   * @param targets {@linkcode BattlerIndex} Targets of the dancing move
   */
  getTarget(dancer: Pokemon, source: Pokemon, targets: BattlerIndex[]) : BattlerIndex[] {
    if (dancer.isPlayer()) {
      return source.isPlayer() ? targets : [ source.getBattlerIndex() ];
    }
    return source.isPlayer() ? [ source.getBattlerIndex() ] : targets;
  }
}

/**
 * Triggers after the Pokemon loses or consumes an item
 * @extends AbAttr
 */
export class PostItemLostAbAttr extends AbAttr {
  canApplyPostItemLost(pokemon: Pokemon, simulated: boolean, args: any[]): boolean {
    return true;
  }

  applyPostItemLost(pokemon: Pokemon, simulated: boolean, args: any[]): void {}
}

/**
 * Applies a Battler Tag to the Pokemon after it loses or consumes item
 * @extends PostItemLostAbAttr
 */
export class PostItemLostApplyBattlerTagAbAttr extends PostItemLostAbAttr {
  private tagType: BattlerTagType;
  constructor(tagType: BattlerTagType) {
    super(false);
    this.tagType = tagType;
  }

  override canApplyPostItemLost(pokemon: Pokemon, simulated: boolean, args: any[]): boolean {
    return !pokemon.getTag(this.tagType) && !simulated;
  }

  /**
   * Adds the last used Pokeball back into the player's inventory
   * @param pokemon {@linkcode Pokemon} with this ability
   * @param args N/A
   */
  override applyPostItemLost(pokemon: Pokemon, simulated: boolean, args: any[]): void {
    pokemon.addTag(this.tagType);
  }
}

export class StatStageChangeMultiplierAbAttr extends AbAttr {
  private multiplier: number;

  constructor(multiplier: number) {
    super(false);

    this.multiplier = multiplier;
  }

  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder, args: any[]): void {
    (args[0] as NumberHolder).value *= this.multiplier;
  }
}

export class StatStageChangeCopyAbAttr extends AbAttr {
  override apply(
    pokemon: Pokemon,
    passive: boolean,
    simulated: boolean,
    cancelled: BooleanHolder,
    args: any[],
  ): void {
    if (!simulated) {
      globalScene.unshiftPhase(new StatStageChangePhase(pokemon.getBattlerIndex(), true, (args[0] as BattleStat[]), (args[1] as number), true, false, false));
    }
  }
}

export class BypassBurnDamageReductionAbAttr extends AbAttr {
  constructor() {
    super(false);
  }

  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder, args: any[]): void {
    cancelled.value = true;
  }
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
   * @param pokemon N/A
   * @param passive N/A
   * @param cancelled N/A
   * @param args `[0]` {@linkcode NumberHolder} The damage value being modified
   */
  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder, args: any[]): void {
    (args[0] as NumberHolder).value = toDmgValue((args[0] as NumberHolder).value * this.multiplier);
  }
}

export class DoubleBerryEffectAbAttr extends AbAttr {
  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder, args: any[]): void {
    (args[0] as NumberHolder).value *= 2;
  }
}

export class PreventBerryUseAbAttr extends AbAttr {
  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder, args: any[]): void {
    cancelled.value = true;
  }
}

/**
 * A Pokemon with this ability heals by a percentage of their maximum hp after eating a berry
 * @param healPercent - Percent of Max HP to heal
 * @see {@linkcode apply()} for implementation
 */
export class HealFromBerryUseAbAttr extends AbAttr {
  /** Percent of Max HP to heal */
  private healPercent: number;

  constructor(healPercent: number) {
    super();

    // Clamp healPercent so its between [0,1].
    this.healPercent = Math.max(Math.min(healPercent, 1), 0);
  }

  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, ...args: [BooleanHolder, any[]]): void {
    const { name: abilityName } = passive ? pokemon.getPassiveAbility() : pokemon.getAbility();
    if (!simulated) {
      globalScene.unshiftPhase(
        new PokemonHealPhase(
          pokemon.getBattlerIndex(),
          toDmgValue(pokemon.getMaxHp() * this.healPercent),
          i18next.t("abilityTriggers:healFromBerryUse", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon), abilityName }),
          true
        )
      );
    }
  }
}

export class RunSuccessAbAttr extends AbAttr {
  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder, args: any[]): void {
    (args[0] as NumberHolder).value = 256;
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

  canApplyCheckTrapped(
    pokemon: Pokemon,
    passive: boolean,
    simulated: boolean,
    trapped: BooleanHolder,
    otherPokemon: Pokemon,
    args: any[]): boolean {
    return true;
  }

  applyCheckTrapped(
    pokemon: Pokemon,
    passive: boolean,
    simulated: boolean,
    trapped: BooleanHolder,
    otherPokemon: Pokemon,
    args: any[],
  ): void {}
}

/**
 * Determines whether a Pokemon is blocked from switching/running away
 * because of a trapping ability or move.
 * @extends CheckTrappedAbAttr
 * @see {@linkcode applyCheckTrapped}
 */
export class ArenaTrapAbAttr extends CheckTrappedAbAttr {
  override canApplyCheckTrapped(pokemon: Pokemon, passive: boolean, simulated: boolean, trapped: BooleanHolder, otherPokemon: Pokemon, args: any[]): boolean {
    return this.arenaTrapCondition(pokemon, otherPokemon)
    && !(otherPokemon.getTypes(true).includes(PokemonType.GHOST) || (otherPokemon.getTypes(true).includes(PokemonType.STELLAR) && otherPokemon.getTypes().includes(PokemonType.GHOST)))
    && !otherPokemon.hasAbility(Abilities.RUN_AWAY);
  }

  /**
   * Checks if enemy Pokemon is trapped by an Arena Trap-esque ability
   * If the enemy is a Ghost type, it is not trapped
   * If the enemy has the ability Run Away, it is not trapped.
   * If the user has Magnet Pull and the enemy is not a Steel type, it is not trapped.
   * If the user has Arena Trap and the enemy is not grounded, it is not trapped.
   * @param pokemon The {@link Pokemon} with this {@link AbAttr}
   * @param passive N/A
   * @param trapped {@link BooleanHolder} indicating whether the other Pokemon is trapped or not
   * @param otherPokemon The {@link Pokemon} that is affected by an Arena Trap ability
   * @param args N/A
   */
  override applyCheckTrapped(pokemon: Pokemon, passive: boolean, simulated: boolean, trapped: BooleanHolder, otherPokemon: Pokemon, args: any[]): void {
    trapped.value = true;
  }

  getTriggerMessage(pokemon: Pokemon, abilityName: string, ...args: any[]): string {
    return i18next.t("abilityTriggers:arenaTrap", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon), abilityName });
  }
}

export class MaxMultiHitAbAttr extends AbAttr {
  constructor() {
    super(false);
  }

  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder, args: any[]): void {
    (args[0] as NumberHolder).value = 0;
  }
}

export class PostBattleAbAttr extends AbAttr {
  constructor(showAbility: boolean = true) {
    super(showAbility);
  }

  canApplyPostBattle(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return true;
  }

  applyPostBattle(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {}
}

export class PostBattleLootAbAttr extends PostBattleAbAttr {
  private randItem?: PokemonHeldItemModifier;

  override canApplyPostBattle(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    const postBattleLoot = globalScene.currentBattle.postBattleLoot;
    if (!simulated && postBattleLoot.length && args[0]) {
      this.randItem = randSeedItem(postBattleLoot);
      return globalScene.canTransferHeldItemModifier(this.randItem, pokemon, 1);
    }
    return false;
  }

  /**
   * @param args - `[0]`: boolean for if the battle ended in a victory
   */
  override applyPostBattle(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
    const postBattleLoot = globalScene.currentBattle.postBattleLoot;
    if (!this.randItem) {
      this.randItem = randSeedItem(postBattleLoot);
    }

    if (globalScene.tryTransferHeldItemModifier(this.randItem, pokemon, true, 1, true, undefined, false)) {
      postBattleLoot.splice(postBattleLoot.indexOf(this.randItem), 1);
      globalScene.queueMessage(i18next.t("abilityTriggers:postBattleLoot", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon), itemName: this.randItem.type.name }));
    }
    this.randItem = undefined;
  }
}

export class PostFaintAbAttr extends AbAttr {
  canApplyPostFaint(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker?: Pokemon, move?: Move, hitResult?: HitResult, ...args: any[]): boolean {
    return true;
  }

  applyPostFaint(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker?: Pokemon, move?: Move, hitResult?: HitResult, ...args: any[]): void {}
}

/**
 * Used for weather suppressing abilities to trigger weather-based form changes upon being fainted.
 * Used by Cloud Nine and Air Lock.
 * @extends PostFaintAbAttr
 */
export class PostFaintUnsuppressedWeatherFormChangeAbAttr extends PostFaintAbAttr {
  override canApplyPostFaint(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker?: Pokemon, move?: Move, hitResult?: HitResult, ...args: any[]): boolean {
    return getPokemonWithWeatherBasedForms().length > 0;
  }

  /**
   * Triggers {@linkcode Arena.triggerWeatherBasedFormChanges | triggerWeatherBasedFormChanges}
   * when the user of the ability faints
   * @param {Pokemon} pokemon the fainted Pokemon
   * @param passive n/a
   * @param attacker n/a
   * @param move n/a
   * @param hitResult n/a
   * @param args n/a
   */
  override applyPostFaint(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, hitResult: HitResult, args: any[]): void {
    if (!simulated) {
      globalScene.arena.triggerWeatherBasedFormChanges();
    }
  }
}

export class PostFaintContactDamageAbAttr extends PostFaintAbAttr {
  private damageRatio: number;

  constructor(damageRatio: number) {
    super(true);

    this.damageRatio = damageRatio;
  }

  override canApplyPostFaint(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker?: Pokemon, move?: Move, hitResult?: HitResult, ...args: any[]): boolean {
    const diedToDirectDamage = move !== undefined && attacker !== undefined && move.doesFlagEffectApply({flag: MoveFlags.MAKES_CONTACT, user: attacker, target: pokemon});
    const cancelled = new BooleanHolder(false);
    globalScene.getField(true).map(p => applyAbAttrs(FieldPreventExplosiveMovesAbAttr, p, cancelled, simulated));
    if (!diedToDirectDamage || cancelled.value || attacker!.hasAbilityWithAttr(BlockNonDirectDamageAbAttr)) {
      return false;
    }

    return true;
  }

  override applyPostFaint(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker?: Pokemon, move?: Move, hitResult?: HitResult, ...args: any[]): void {
    if (!simulated) {
      attacker!.damageAndUpdate(toDmgValue(attacker!.getMaxHp() * (1 / this.damageRatio)), { result: HitResult.INDIRECT });
      attacker!.turnData.damageTaken += toDmgValue(attacker!.getMaxHp() * (1 / this.damageRatio));
    }
  }

  getTriggerMessage(pokemon: Pokemon, abilityName: string, ...args: any[]): string {
    return i18next.t("abilityTriggers:postFaintContactDamage", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon), abilityName });
  }
}

/**
 * Attribute used for abilities (Innards Out) that damage the opponent based on how much HP the last attack used to knock out the owner of the ability.
 */
export class PostFaintHPDamageAbAttr extends PostFaintAbAttr {
  constructor() {
    super ();
  }

  override applyPostFaint(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker?: Pokemon, move?: Move, hitResult?: HitResult, ...args: any[]): void {
    if (move !== undefined && attacker !== undefined && !simulated) { //If the mon didn't die to indirect damage
      const damage = pokemon.turnData.attacksReceived[0].damage;
      attacker.damageAndUpdate((damage), { result: HitResult.INDIRECT });
      attacker.turnData.damageTaken += damage;
    }
  }

  getTriggerMessage(pokemon: Pokemon, abilityName: string, ...args: any[]): string {
    return i18next.t("abilityTriggers:postFaintHpDamage", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon), abilityName });
  }
}

/**
 * Redirects a move to the pokemon with this ability if it meets the conditions
 */
export class RedirectMoveAbAttr extends AbAttr {
  /**
   * @param pokemon - The Pokemon with the redirection ability
   * @param args - The args passed to the `AbAttr`:
   *  - `[0]` - The id of the {@linkcode Move} used
   *  - `[1]` - The target's battler index (before redirection)
   *  - `[2]` - The Pokemon that used the move being redirected
   */

  override canApply(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    if (!this.canRedirect(args[0] as Moves, args[2] as Pokemon)) {
      return false;
    }
    const target = args[1] as NumberHolder;
    const newTarget = pokemon.getBattlerIndex();
    return target.value !== newTarget;
  }

  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder, args: any[]): void {
    const target = args[1] as NumberHolder;
    const newTarget = pokemon.getBattlerIndex();
    target.value = newTarget;
  }

  canRedirect(moveId: Moves, user: Pokemon): boolean {
    const move = allMoves[moveId];
    return !![ MoveTarget.NEAR_OTHER, MoveTarget.OTHER ].find(t => move.moveTarget === t);
  }
}

export class RedirectTypeMoveAbAttr extends RedirectMoveAbAttr {
  public type: PokemonType;

  constructor(type: PokemonType) {
    super();
    this.type = type;
  }

  canRedirect(moveId: Moves, user: Pokemon): boolean {
    return super.canRedirect(moveId, user) && user.getMoveType(allMoves[moveId]) === this.type;
  }
}

export class BlockRedirectAbAttr extends AbAttr { }

/**
 * Used by Early Bird, makes the pokemon wake up faster
 * @param statusEffect - The {@linkcode StatusEffect} to check for
 * @see {@linkcode apply}
 */
export class ReduceStatusEffectDurationAbAttr extends AbAttr {
  private statusEffect: StatusEffect;

  constructor(statusEffect: StatusEffect) {
    super(false);

    this.statusEffect = statusEffect;
  }

  override canApply(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return args[1] instanceof NumberHolder && args[0] === this.statusEffect;
  }

  /**
   * Reduces the number of sleep turns remaining by an extra 1 when applied
   * @param args - The args passed to the `AbAttr`:
   * - `[0]` - The {@linkcode StatusEffect} of the Pokemon
   * - `[1]` - The number of turns remaining until the status is healed
   */
  override apply(_pokemon: Pokemon, _passive: boolean, _simulated: boolean, _cancelled: BooleanHolder, args: any[]): void {
    args[1].value -= 1;
  }
}

export class FlinchEffectAbAttr extends AbAttr {
  constructor() {
    super(true);
  }
}

export class FlinchStatStageChangeAbAttr extends FlinchEffectAbAttr {
  private stats: BattleStat[];
  private stages: number;

  constructor(stats: BattleStat[], stages: number) {
    super();

    this.stats = Array.isArray(stats)
      ? stats
      : [ stats ];
    this.stages = stages;
  }

  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder, args: any[]): void {
    if (!simulated) {
      globalScene.unshiftPhase(new StatStageChangePhase(pokemon.getBattlerIndex(), true, this.stats, this.stages));
    }
  }
}

export class IncreasePpAbAttr extends AbAttr { }

export class ForceSwitchOutImmunityAbAttr extends AbAttr {
  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder, args: any[]): void {
    cancelled.value = true;
  }
}

export class ReduceBerryUseThresholdAbAttr extends AbAttr {
  constructor() {
    super(false);
  }

  override canApply(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    const hpRatio = pokemon.getHpRatio();
    return args[0].value < hpRatio;
  }

  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder, args: any[]): void {
    args[0].value *= 2;
  }
}

/**
 * Ability attribute used for abilites that change the ability owner's weight
 * Used for Heavy Metal (doubling weight) and Light Metal (halving weight)
 */
export class WeightMultiplierAbAttr extends AbAttr {
  private multiplier: number;

  constructor(multiplier: number) {
    super(false);

    this.multiplier = multiplier;
  }

  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder, args: any[]): void {
    (args[0] as NumberHolder).value *= this.multiplier;
  }
}

export class SyncEncounterNatureAbAttr extends AbAttr {
  constructor() {
    super(false);
  }

  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder, args: any[]): void {
    (args[0] as Pokemon).setNature(pokemon.getNature());
  }
}

export class MoveAbilityBypassAbAttr extends AbAttr {
  private moveIgnoreFunc: (pokemon: Pokemon, move: Move) => boolean;

  constructor(moveIgnoreFunc?: (pokemon: Pokemon, move: Move) => boolean) {
    super(false);

    this.moveIgnoreFunc = moveIgnoreFunc || ((pokemon, move) => true);
  }

  override canApply(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return this.moveIgnoreFunc(pokemon, (args[0] as Move));
  }

  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder, args: any[]): void {
    cancelled.value = true;
  }
}

export class AlwaysHitAbAttr extends AbAttr { }

/** Attribute for abilities that allow moves that make contact to ignore protection (i.e. Unseen Fist) */
export class IgnoreProtectOnContactAbAttr extends AbAttr { }

/**
 * Attribute implementing the effects of {@link https://bulbapedia.bulbagarden.net/wiki/Infiltrator_(Ability) | Infiltrator}.
 * Allows the source's moves to bypass the effects of opposing Light Screen, Reflect, Aurora Veil, Safeguard, Mist, and Substitute.
 */
export class InfiltratorAbAttr extends AbAttr {
  constructor() {
    super(false);
  }

  override canApply(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return args[0] instanceof BooleanHolder;
  }

  /**
   * Sets a flag to bypass screens, Substitute, Safeguard, and Mist
   * @param pokemon n/a
   * @param passive n/a
   * @param simulated n/a
   * @param cancelled n/a
   * @param args `[0]` a {@linkcode BooleanHolder | BooleanHolder} containing the flag
   */
  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: null, args: any[]): void {
    const bypassed = args[0];
    bypassed.value = true;
  }
}

/**
 * Attribute implementing the effects of {@link https://bulbapedia.bulbagarden.net/wiki/Magic_Bounce_(ability) | Magic Bounce}.
 * Allows the source to bounce back {@linkcode MoveFlags.REFLECTABLE | Reflectable}
 *  moves as if the user had used {@linkcode Moves.MAGIC_COAT | Magic Coat}.
 */
export class ReflectStatusMoveAbAttr extends AbAttr { }

export class NoTransformAbilityAbAttr extends AbAttr {
  constructor() {
    super(false);
  }
}

export class NoFusionAbilityAbAttr extends AbAttr {
  constructor() {
    super(false);
  }
}

export class IgnoreTypeImmunityAbAttr extends AbAttr {
  private defenderType: PokemonType;
  private allowedMoveTypes: PokemonType[];

  constructor(defenderType: PokemonType, allowedMoveTypes: PokemonType[]) {
    super(false);
    this.defenderType = defenderType;
    this.allowedMoveTypes = allowedMoveTypes;
  }

  override canApply(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return this.defenderType === (args[1] as PokemonType) && this.allowedMoveTypes.includes(args[0] as PokemonType);
  }

  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder, args: any[]): void {
    cancelled.value = true;
  }
}

/**
 * Ignores the type immunity to Status Effects of the defender if the defender is of a certain type
 */
export class IgnoreTypeStatusEffectImmunityAbAttr extends AbAttr {
  private statusEffect: StatusEffect[];
  private defenderType: PokemonType[];

  constructor(statusEffect: StatusEffect[], defenderType: PokemonType[]) {
    super(false);

    this.statusEffect = statusEffect;
    this.defenderType = defenderType;
  }

  override canApply(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return this.statusEffect.includes(args[0] as StatusEffect) && this.defenderType.includes(args[1] as PokemonType);
  }

  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder, args: any[]): void {
    cancelled.value = true;
  }
}

/**
 * Gives money to the user after the battle.
 *
 * @extends PostBattleAbAttr
 * @see {@linkcode applyPostBattle}
 */
export class MoneyAbAttr extends PostBattleAbAttr {
  constructor() {
    super();
  }

  override canApplyPostBattle(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return !simulated && args[0];
  }

  /**
   * @param pokemon {@linkcode Pokemon} that is the user of this ability.
   * @param passive N/A
   * @param args - `[0]`: boolean for if the battle ended in a victory
   */
  override applyPostBattle(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
    globalScene.currentBattle.moneyScattered += globalScene.getWaveMoneyAmount(0.2);
  }
}

/**
 * Applies a stat change after a Pokémon is summoned,
 * conditioned on the presence of a specific arena tag.
 *
 * @extends PostSummonStatStageChangeAbAttr
 */
export class PostSummonStatStageChangeOnArenaAbAttr extends PostSummonStatStageChangeAbAttr {
  /**
   * The type of arena tag that conditions the stat change.
   * @private
   */
  private tagType: ArenaTagType;

  /**
   * Creates an instance of PostSummonStatStageChangeOnArenaAbAttr.
   * Initializes the stat change to increase Attack by 1 stage if the specified arena tag is present.
   *
   * @param {ArenaTagType} tagType - The type of arena tag to check for.
   */
  constructor(tagType: ArenaTagType) {
    super([ Stat.ATK ], 1, true, false);
    this.tagType = tagType;
  }

  override canApplyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    const side = pokemon.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY;
    return (globalScene.arena.getTagOnSide(this.tagType, side) ?? false)
      && super.canApplyPostSummon(pokemon, passive, simulated, args);
  }

  /**
   * Applies the post-summon stat change if the specified arena tag is present on pokemon's side.
   * This is used in Wind Rider ability.
   *
   * @param {Pokemon} pokemon - The Pokémon being summoned.
   * @param {boolean} passive - Whether the effect is passive.
   * @param {any[]} args - Additional arguments.
   */
  override applyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
    super.applyPostSummon(pokemon, passive, simulated, args);
  }
}

/**
 * Takes no damage from the first hit of a damaging move.
 * This is used in the Disguise and Ice Face abilities.
 * 
 * Does not apply to a user's substitute
 * @extends ReceivedMoveDamageMultiplierAbAttr
 */
export class FormBlockDamageAbAttr extends ReceivedMoveDamageMultiplierAbAttr {
  private multiplier: number;
  private tagType: BattlerTagType;
  private recoilDamageFunc?: ((pokemon: Pokemon) => number);
  private triggerMessageFunc: (pokemon: Pokemon, abilityName: string) => string;

  constructor(condition: PokemonDefendCondition, multiplier: number, tagType: BattlerTagType, triggerMessageFunc: (pokemon: Pokemon, abilityName: string) => string, recoilDamageFunc?: (pokemon: Pokemon) => number) {
    super(condition, multiplier);

    this.multiplier = multiplier;
    this.tagType = tagType;
    this.recoilDamageFunc = recoilDamageFunc;
    this.triggerMessageFunc = triggerMessageFunc;
  }

  override canApplyPreDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, cancelled: BooleanHolder | null, args: any[]): boolean {
    return this.condition(pokemon, attacker, move) && !move.hitsSubstitute(attacker, pokemon);
  }

  /**
   * Applies the pre-defense ability to the Pokémon.
   * Removes the appropriate `BattlerTagType` when hit by an attack and is in its defense form.
   *
   * @param pokemon The Pokémon with the ability.
   * @param _passive n/a
   * @param attacker The attacking Pokémon.
   * @param move The move being used.
   * @param _cancelled n/a
   * @param args Additional arguments.
   */
  override applyPreDefend(pokemon: Pokemon, _passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, _cancelled: BooleanHolder, args: any[]): void {
    if (!simulated) {
      (args[0] as NumberHolder).value = this.multiplier;
      pokemon.removeTag(this.tagType);
      if (this.recoilDamageFunc) {
        pokemon.damageAndUpdate(this.recoilDamageFunc(pokemon), { result: HitResult.INDIRECT, ignoreSegments: true, ignoreFaintPhase: true });
      }
    }
  }

  /**
   * Gets the message triggered when the Pokémon avoids damage using the form-changing ability.
   * @param pokemon The Pokémon with the ability.
   * @param abilityName The name of the ability.
   * @param _args n/a
   * @returns The trigger message.
   */
  getTriggerMessage(pokemon: Pokemon, abilityName: string, ..._args: any[]): string {
    return this.triggerMessageFunc(pokemon, abilityName);
  }
}

/**
 * Base class for defining {@linkcode Ability} attributes before summon
 * (should use {@linkcode PostSummonAbAttr} for most ability)
 * @see {@linkcode applyPreSummon()}
 */
export class PreSummonAbAttr extends AbAttr {
  applyPreSummon(pokemon: Pokemon, passive: boolean, args: any[]): void {}

  canApplyPreSummon(pokemon: Pokemon, passive: boolean, args: any[]): boolean {
    return true;
  }
}

export class IllusionPreSummonAbAttr extends PreSummonAbAttr {
  /**
   * Apply a new illusion when summoning Zoroark if the illusion is available
   *
   * @param pokemon - The Pokémon with the Illusion ability.
   * @param passive - N/A
   * @param args - N/A
   * @returns Whether the illusion was applied.
   */
  override applyPreSummon(pokemon: Pokemon, passive: boolean, args: any[]): void {
    const party: Pokemon[] = (pokemon.isPlayer() ? globalScene.getPlayerParty() : globalScene.getEnemyParty()).filter(p => p.isAllowedInBattle());
    const lastPokemon: Pokemon = party.filter(p => p !==pokemon).at(-1) || pokemon;
    pokemon.setIllusion(lastPokemon);
  }

  override canApplyPreSummon(pokemon: Pokemon, passive: boolean, args: any[]): boolean {
    pokemon.initSummondata()
    if(pokemon.hasTrainer()){
      const party: Pokemon[] = (pokemon.isPlayer() ? globalScene.getPlayerParty() : globalScene.getEnemyParty()).filter(p => p.isAllowedInBattle());
      const lastPokemon: Pokemon = party.filter(p => p !==pokemon).at(-1) || pokemon;
      const speciesId = lastPokemon.species.speciesId;

      // If the last conscious Pokémon in the party is a Terastallized Ogerpon or Terapagos, Illusion will not activate.
      // Illusion will also not activate if the Pokémon with Illusion is Terastallized and the last Pokémon in the party is Ogerpon or Terapagos.
      if ( 
        lastPokemon === pokemon ||
        ((speciesId === Species.OGERPON || speciesId === Species.TERAPAGOS) && (lastPokemon.isTerastallized || pokemon.isTerastallized))
      ) {
        return false;
      }
    }
    return !pokemon.summonData.illusionBroken;
  }
}

export class IllusionBreakAbAttr extends AbAttr {
  override apply(pokemon: Pokemon, _passive: boolean, _simulated: boolean, _cancelled: BooleanHolder | null, _args: any[]): void {
    pokemon.breakIllusion();
    pokemon.summonData.illusionBroken = true;
  }
}

export class PostDefendIllusionBreakAbAttr extends PostDefendAbAttr {
  /**
   * Destroy the illusion upon taking damage
   *
   * @param pokemon - The Pokémon with the Illusion ability.
   * @param passive - unused
   * @param attacker - The attacking Pokémon.
   * @param move - The move being used.
   * @param hitResult - The type of hitResult the pokemon got
   * @param args - unused
   * @returns - Whether the illusion was destroyed.
   */
  override applyPostDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, hitResult: HitResult, args: any[]): void {
    pokemon.breakIllusion();
    pokemon.summonData.illusionBroken = true;
  }

  override canApplyPostDefend(pokemon: Pokemon, passive: boolean, simulated: boolean, attacker: Pokemon, move: Move, hitResult: HitResult, args: any[]): boolean {
    const breakIllusion: HitResult[] = [ HitResult.EFFECTIVE, HitResult.SUPER_EFFECTIVE, HitResult.NOT_VERY_EFFECTIVE, HitResult.ONE_HIT_KO ];
    return breakIllusion.includes(hitResult) && !!pokemon.summonData?.illusion
  }
}

export class IllusionPostBattleAbAttr extends PostBattleAbAttr {
  /**
   * Break the illusion once the battle ends
   *
   * @param pokemon - The Pokémon with the Illusion ability.
   * @param passive - Unused
   * @param args - Unused
   * @returns - Whether the illusion was applied.
   */
  override applyPostBattle(pokemon: Pokemon, passive: boolean, simulated:boolean, args: any[]): void {
   pokemon.breakIllusion()
  }
}


/**
 * If a Pokémon with this Ability selects a damaging move, it has a 30% chance of going first in its priority bracket. If the Ability activates, this is announced at the start of the turn (after move selection).
 *
 * @extends AbAttr
 */
export class BypassSpeedChanceAbAttr extends AbAttr {
  public chance: number;

  /**
   * @param {number} chance probability of ability being active.
   */
  constructor(chance: number) {
    super(true);
    this.chance = chance;
  }

  override canApply(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    const bypassSpeed = args[0] as BooleanHolder;
    const turnCommand = globalScene.currentBattle.turnCommands[pokemon.getBattlerIndex()];
    const isCommandFight = turnCommand?.command === Command.FIGHT;
    const move = turnCommand?.move?.move ? allMoves[turnCommand.move.move] : null;
    const isDamageMove = move?.category === MoveCategory.PHYSICAL || move?.category === MoveCategory.SPECIAL;
    return !simulated && !bypassSpeed.value && pokemon.randSeedInt(100) < this.chance && isCommandFight && isDamageMove;
  }

  /**
   * bypass move order in their priority bracket when pokemon choose damaging move
   * @param {Pokemon} pokemon {@linkcode Pokemon}  the Pokemon applying this ability
   * @param {boolean} passive N/A
   * @param {BooleanHolder} cancelled N/A
   * @param {any[]} args [0] {@linkcode BooleanHolder} set to true when the ability activated
   */
  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder, args: any[]): void {
    const bypassSpeed = args[0] as BooleanHolder;
    bypassSpeed.value = true;
  }

  getTriggerMessage(pokemon: Pokemon, abilityName: string, ...args: any[]): string {
    return i18next.t("abilityTriggers:quickDraw", { pokemonName: getPokemonNameWithAffix(pokemon) });
  }
}

/**
 * This attribute checks if a Pokemon's move meets a provided condition to determine if the Pokemon can use Quick Claw
 * It was created because Pokemon with the ability Mycelium Might cannot access Quick Claw's benefits when using status moves.
*/
export class PreventBypassSpeedChanceAbAttr extends AbAttr {
  private condition: ((pokemon: Pokemon, move: Move) => boolean);

  /**
   * @param {function} condition - checks if a move meets certain conditions
   */
  constructor(condition: (pokemon: Pokemon, move: Move) => boolean) {
    super(true);
    this.condition = condition;
  }

  override canApply(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    const turnCommand = globalScene.currentBattle.turnCommands[pokemon.getBattlerIndex()];
    const isCommandFight = turnCommand?.command === Command.FIGHT;
    const move = turnCommand?.move?.move ? allMoves[turnCommand.move.move] : null;
    return isCommandFight && this.condition(pokemon, move!);
  }

  /**
   * @argument {boolean} bypassSpeed - determines if a Pokemon is able to bypass speed at the moment
   * @argument {boolean} canCheckHeldItems - determines if a Pokemon has access to Quick Claw's effects or not
   */
  override apply(pokemon: Pokemon, passive: boolean, simulated: boolean, cancelled: BooleanHolder, args: any[]): void {
    const bypassSpeed = args[0] as BooleanHolder;
    const canCheckHeldItems = args[1] as BooleanHolder;
    bypassSpeed.value = false;
    canCheckHeldItems.value = false;
  }
}

/**
 * This applies a terrain-based type change to the Pokemon.
 * Used by Mimicry.
 */
export class TerrainEventTypeChangeAbAttr extends PostSummonAbAttr {
  constructor() {
    super(true);
  }

  override canApply(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return !pokemon.isTerastallized;
  }

  override apply(pokemon: Pokemon, _passive: boolean, _simulated: boolean, _cancelled: BooleanHolder, _args: any[]): void {
    const currentTerrain = globalScene.arena.getTerrainType();
    const typeChange: PokemonType[] = this.determineTypeChange(pokemon, currentTerrain);
    if (typeChange.length !== 0) {
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

  override canApplyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): boolean {
    return globalScene.arena.getTerrainType() !== TerrainType.NONE &&
      this.canApply(pokemon, passive, simulated, args);
  }

  /**
   * Checks if the Pokemon should change types if summoned into an active terrain
   */
  override applyPostSummon(pokemon: Pokemon, passive: boolean, simulated: boolean, args: any[]): void {
    this.apply(pokemon, passive, simulated, new BooleanHolder(false), []);
  }

  override getTriggerMessage(pokemon: Pokemon, abilityName: string, ...args: any[]) {
    const currentTerrain = globalScene.arena.getTerrainType();
    const pokemonNameWithAffix = getPokemonNameWithAffix(pokemon);
    if (currentTerrain === TerrainType.NONE) {
      return i18next.t("abilityTriggers:pokemonTypeChangeRevert", { pokemonNameWithAffix });
    } else {
      const moveType = i18next.t(`pokemonInfo:Type.${PokemonType[this.determineTypeChange(pokemon, currentTerrain)[0]]}`);
      return i18next.t("abilityTriggers:pokemonTypeChange", { pokemonNameWithAffix, moveType });
    }
  }
}

function applySingleAbAttrs<TAttr extends AbAttr>(
  pokemon: Pokemon,
  passive: boolean,
  attrType: Constructor<TAttr>,
  applyFunc: AbAttrApplyFunc<TAttr>,
  successFunc: AbAttrSuccessFunc<TAttr>,
  args: any[],
  gainedMidTurn: boolean = false,
  simulated: boolean = false,
  messages: string[] = []
) {
  if (!pokemon?.canApplyAbility(passive) || (passive && (pokemon.getPassiveAbility().id === pokemon.getAbility().id))) {
    return;
  }

  const ability = passive ? pokemon.getPassiveAbility() : pokemon.getAbility();
  if (gainedMidTurn && ability.getAttrs(attrType).some(attr => attr instanceof PostSummonAbAttr && !attr.shouldActivateOnGain())) {
    return;
  }

  for (const attr of ability.getAttrs(attrType)) {
    const condition = attr.getCondition();
    let abShown = false;
    if (condition && !condition(pokemon) || !successFunc(attr, passive)) {
      continue;
    }

    globalScene.setPhaseQueueSplice();

    if (attr.showAbility && !simulated) {
      globalScene.queueAbilityDisplay(pokemon, passive, true);
      abShown = true;
    }
    const message = attr.getTriggerMessage(pokemon, ability.name, args);
    if (message) {
      if (!simulated) {
        globalScene.queueMessage(message);
      }
      messages.push(message);
    }

    applyFunc(attr, passive);

    if (abShown) {
      globalScene.queueAbilityDisplay(pokemon, passive, false);
    }

    if (pokemon.summonData && !pokemon.summonData.abilitiesApplied.includes(ability.id)) {
      pokemon.summonData.abilitiesApplied.push(ability.id);
    }
    if (pokemon.battleData && !simulated && !pokemon.battleData.abilitiesApplied.includes(ability.id)) {
      pokemon.battleData.abilitiesApplied.push(ability.id);
    }

    globalScene.clearPhaseQueueSplice();
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
  public switchOutLogic(pokemon: Pokemon): boolean {
    const switchOutTarget = pokemon;
    /**
     * If the switch-out target is a player-controlled Pokémon, the function checks:
     * - Whether there are available party members to switch in.
     * - If the Pokémon is still alive (hp > 0), and if so, it leaves the field and a new SwitchPhase is initiated.
     */
    if (switchOutTarget instanceof PlayerPokemon) {
      if (globalScene.getPlayerParty().filter((p) => p.isAllowedInBattle() && !p.isOnField()).length < 1) {
        return false;
      }

      if (switchOutTarget.hp > 0) {
        switchOutTarget.leaveField(this.switchType === SwitchType.SWITCH);
        globalScene.prependToPhase(new SwitchPhase(this.switchType, switchOutTarget.getFieldIndex(), true, true), MoveEndPhase);
        return true;
      }
    /**
     * For non-wild battles, it checks if the opposing party has any available Pokémon to switch in.
     * If yes, the Pokémon leaves the field and a new SwitchSummonPhase is initiated.
     */
    } else if (globalScene.currentBattle.battleType !== BattleType.WILD) {
      if (globalScene.getEnemyParty().filter((p) => p.isAllowedInBattle() && !p.isOnField()).length < 1) {
        return false;
      }
      if (switchOutTarget.hp > 0) {
        switchOutTarget.leaveField(this.switchType === SwitchType.SWITCH);
        const summonIndex = (globalScene.currentBattle.trainer ? globalScene.currentBattle.trainer.getNextSummonIndex((switchOutTarget as EnemyPokemon).trainerSlot) : 0);
        globalScene.prependToPhase(new SwitchSummonPhase(this.switchType, switchOutTarget.getFieldIndex(), summonIndex, false, false), MoveEndPhase);
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
        globalScene.queueMessage(i18next.t("moveTriggers:fled", { pokemonName: getPokemonNameWithAffix(switchOutTarget) }), null, true, 500);
        if (globalScene.currentBattle.double && !isNullOrUndefined(allyPokemon)) {
          globalScene.redirectPokemonMoves(switchOutTarget, allyPokemon);
        }
      }

      if (!allyPokemon?.isActive(true)) {
        globalScene.clearEnemyHeldItemModifiers();

        if (switchOutTarget.hp) {
          globalScene.pushPhase(new BattleEndPhase(false));

          if (globalScene.gameMode.hasRandomBiomes || globalScene.isNewBiome()) {
            globalScene.pushPhase(new SelectBiomePhase());
          }

          globalScene.pushPhase(new NewBattlePhase());
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
    const player = switchOutTarget instanceof PlayerPokemon;

    if (player) {
      const blockedByAbility = new BooleanHolder(false);
      applyAbAttrs(ForceSwitchOutImmunityAbAttr, opponent, blockedByAbility);
      return !blockedByAbility.value;
    }

    if (!player && globalScene.currentBattle.battleType === BattleType.WILD) {
      if (!globalScene.currentBattle.waveIndex && globalScene.currentBattle.waveIndex % 10 === 0) {
        return false;
      }
    }

    if (!player && globalScene.currentBattle.isBattleMysteryEncounter() && !globalScene.currentBattle.mysteryEncounter?.fleeAllowed) {
      return false;
    }

    const party = player ? globalScene.getPlayerParty() : globalScene.getEnemyParty();
    return (!player && globalScene.currentBattle.battleType === BattleType.WILD)
      || party.filter(p => p.isAllowedInBattle() && !p.isOnField()
        && (player || (p as EnemyPokemon).trainerSlot === (switchOutTarget as EnemyPokemon).trainerSlot)).length > 0;
  }

  /**
   * Returns a message if the switch-out attempt fails due to ability effects.
   *
   * @param target The target Pokémon.
   * @returns The failure message, or `null` if no failure.
   */
  public getFailedText(target: Pokemon): string | null {
    const blockedByAbility = new BooleanHolder(false);
    applyAbAttrs(ForceSwitchOutImmunityAbAttr, target, blockedByAbility);
    return blockedByAbility.value ? i18next.t("moveTriggers:cannotBeSwitchedOut", { pokemonName: getPokemonNameWithAffix(target) }) : null;
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

/**
 * Triggers after the Pokemon takes any damage
 * @extends AbAttr
 */
export class PostDamageAbAttr extends AbAttr {
  public canApplyPostDamage(
    pokemon: Pokemon,
    damage: number,
    passive: boolean,
    simulated: boolean,
    args: any[],
    source?: Pokemon): boolean {
    return true;
  }

  public applyPostDamage(
    pokemon: Pokemon,
    damage: number,
    passive: boolean,
    simulated: boolean,
    args: any[],
    source?: Pokemon,
  ): void {}
}

/**
 * Ability attribute for forcing a Pokémon to switch out after its health drops below half.
 * This attribute checks various conditions related to the damage received, the moves used by the Pokémon
 * and its opponents, and determines whether a forced switch-out should occur.
 *
 * Used by Wimp Out and Emergency Exit
 *
 * @extends PostDamageAbAttr
 * @see {@linkcode applyPostDamage}
 */
export class PostDamageForceSwitchAbAttr extends PostDamageAbAttr {
  private helper: ForceSwitchOutHelper = new ForceSwitchOutHelper(SwitchType.SWITCH);
  private hpRatio: number;

  constructor(hpRatio = 0.5) {
    super();
    this.hpRatio = hpRatio;
  }

  public override canApplyPostDamage(
    pokemon: Pokemon,
    damage: number,
    passive: boolean,
    simulated: boolean,
    args: any[],
    source?: Pokemon): boolean {
    const moveHistory = pokemon.getMoveHistory();
    // Will not activate when the Pokémon's HP is lowered by cutting its own HP
    const fordbiddenAttackingMoves = [ Moves.BELLY_DRUM, Moves.SUBSTITUTE, Moves.CURSE, Moves.PAIN_SPLIT ];
    if (moveHistory.length > 0) {
      const lastMoveUsed = moveHistory[moveHistory.length - 1];
      if (fordbiddenAttackingMoves.includes(lastMoveUsed.move)) {
        return false;
      }
    }

    // Dragon Tail and Circle Throw switch out Pokémon before the Ability activates.
    const fordbiddenDefendingMoves = [ Moves.DRAGON_TAIL, Moves.CIRCLE_THROW ];
    if (source) {
      const enemyMoveHistory = source.getMoveHistory();
      if (enemyMoveHistory.length > 0) {
        const enemyLastMoveUsed = enemyMoveHistory[enemyMoveHistory.length - 1];
        // Will not activate if the Pokémon's HP falls below half while it is in the air during Sky Drop.
        if (fordbiddenDefendingMoves.includes(enemyLastMoveUsed.move) || enemyLastMoveUsed.move === Moves.SKY_DROP && enemyLastMoveUsed.result === MoveResult.OTHER) {
          return false;
        // Will not activate if the Pokémon's HP falls below half by a move affected by Sheer Force.
        } else if (allMoves[enemyLastMoveUsed.move].chance >= 0 && source.hasAbility(Abilities.SHEER_FORCE)) {
          return false;
        // Activate only after the last hit of multistrike moves
        } else if (source.turnData.hitsLeft > 1) {
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
   *
   * @param pokemon The Pokémon that took damage.
   * @param damage N/A
   * @param passive N/A
   * @param simulated Whether the ability is being simulated.
   * @param args N/A
   * @param source N/A
   */
  public override applyPostDamage(pokemon: Pokemon, damage: number, passive: boolean, simulated: boolean, args: any[], source?: Pokemon): void {
    this.helper.switchOutLogic(pokemon);
  }
}
function applyAbAttrsInternal<TAttr extends AbAttr>(
  attrType: Constructor<TAttr>,
  pokemon: Pokemon | null,
  applyFunc: AbAttrApplyFunc<TAttr>,
  successFunc: AbAttrSuccessFunc<TAttr>,
  args: any[],
  simulated: boolean = false,
  messages: string[] = [],
  gainedMidTurn = false
) {
  for (const passive of [ false, true ]) {
    if (pokemon) {
      applySingleAbAttrs(pokemon, passive, attrType, applyFunc, successFunc, args, gainedMidTurn, simulated, messages);
      globalScene.clearPhaseQueueSplice();
    }
  }
}

export function applyAbAttrs(
  attrType: Constructor<AbAttr>,
  pokemon: Pokemon,
  cancelled: BooleanHolder | null,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal<AbAttr>(
    attrType,
    pokemon,
    (attr, passive) => attr.apply(pokemon, passive, simulated, cancelled, args),
    (attr, passive) => attr.canApply(pokemon, passive, simulated, args),
    args,
    simulated,
  );
}

export function applyPostBattleInitAbAttrs(
  attrType: Constructor<PostBattleInitAbAttr>,
  pokemon: Pokemon,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal<PostBattleInitAbAttr>(
    attrType,
    pokemon,
    (attr, passive) => attr.applyPostBattleInit(pokemon, passive, simulated, args),
    (attr, passive) => attr.canApplyPostBattleInit(pokemon, passive, simulated, args),
    args,
    simulated,
  );
}

export function applyPreDefendAbAttrs(
  attrType: Constructor<PreDefendAbAttr>,
  pokemon: Pokemon,
  attacker: Pokemon,
  move: Move | null,
  cancelled: BooleanHolder | null,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal<PreDefendAbAttr>(
    attrType,
    pokemon,
    (attr, passive) => attr.applyPreDefend(pokemon, passive, simulated, attacker, move, cancelled, args),
    (attr, passive) => attr.canApplyPreDefend(pokemon, passive, simulated, attacker, move, cancelled, args),
    args,
    simulated,
  );
}

export function applyPostDefendAbAttrs(
  attrType: Constructor<PostDefendAbAttr>,
  pokemon: Pokemon,
  attacker: Pokemon,
  move: Move,
  hitResult: HitResult | null,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal<PostDefendAbAttr>(
    attrType,
    pokemon,
    (attr, passive) => attr.applyPostDefend(pokemon, passive, simulated, attacker, move, hitResult, args),
    (attr, passive) => attr.canApplyPostDefend(pokemon, passive, simulated, attacker, move, hitResult, args), args,
    simulated,
  );
}

export function applyPostMoveUsedAbAttrs(
  attrType: Constructor<PostMoveUsedAbAttr>,
  pokemon: Pokemon,
  move: PokemonMove,
  source: Pokemon,
  targets: BattlerIndex[],
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal<PostMoveUsedAbAttr>(
    attrType,
    pokemon,
    (attr, passive) => attr.applyPostMoveUsed(pokemon, move, source, targets, simulated, args),
    (attr, passive) => attr.canApplyPostMoveUsed(pokemon, move, source, targets, simulated, args),
    args,
    simulated,
  );
}

export function applyStatMultiplierAbAttrs(
  attrType: Constructor<StatMultiplierAbAttr>,
  pokemon: Pokemon,
  stat: BattleStat,
  statValue: NumberHolder,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal<StatMultiplierAbAttr>(
    attrType,
    pokemon,
    (attr, passive) => attr.applyStatStage(pokemon, passive, simulated, stat, statValue, args),
    (attr, passive) => attr.canApplyStatStage(pokemon, passive, simulated, stat, statValue, args),
    args,
  );
}

/**
 * Applies an ally's Stat multiplier attribute
 * @param attrType - {@linkcode AllyStatMultiplierAbAttr} should always be AllyStatMultiplierAbAttr for the time being
 * @param pokemon - The {@linkcode Pokemon} with the ability
 * @param stat - The type of the checked {@linkcode Stat}
 * @param statValue - {@linkcode NumberHolder} containing the value of the checked stat
 * @param checkedPokemon - The {@linkcode Pokemon} with the checked stat
 * @param ignoreAbility - Whether or not the ability should be ignored by the pokemon or its move.
 * @param args - unused
 */
export function applyAllyStatMultiplierAbAttrs(attrType: Constructor<AllyStatMultiplierAbAttr>,
  pokemon: Pokemon, stat: BattleStat, statValue: NumberHolder, simulated: boolean = false, checkedPokemon: Pokemon, ignoreAbility: boolean, ...args: any[]
): void {
  return applyAbAttrsInternal<AllyStatMultiplierAbAttr>(
    attrType,
    pokemon,
    (attr, passive) => attr.applyAllyStat(pokemon, passive, simulated, stat, statValue, checkedPokemon, ignoreAbility, args),
    (attr, passive) => attr.canApplyAllyStat(pokemon, passive, simulated, stat, statValue, checkedPokemon, ignoreAbility, args),
    args,
    simulated,
  );
}

export function applyPostSetStatusAbAttrs(
  attrType: Constructor<PostSetStatusAbAttr>,
  pokemon: Pokemon,
  effect: StatusEffect,
  sourcePokemon?: Pokemon | null,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal<PostSetStatusAbAttr>(
    attrType,
    pokemon,
    (attr, passive) => attr.applyPostSetStatus(pokemon, sourcePokemon, passive, effect, simulated, args),
    (attr, passive) => attr.canApplyPostSetStatus(pokemon, sourcePokemon, passive, effect, simulated, args),
    args,
    simulated,
  );
}

export function applyPostDamageAbAttrs(
  attrType: Constructor<PostDamageAbAttr>,
  pokemon: Pokemon,
  damage: number,
  passive: boolean,
  simulated = false,
  args: any[],
  source?: Pokemon,
): void {
  applyAbAttrsInternal<PostDamageAbAttr>(
    attrType,
    pokemon,
    (attr, passive) => attr.applyPostDamage(pokemon, damage, passive, simulated, args, source),
    (attr, passive) => attr.canApplyPostDamage(pokemon, damage, passive, simulated, args, source),
    args,
  );
}

/**
 * Applies a field Stat multiplier attribute
 * @param attrType {@linkcode FieldMultiplyStatAbAttr} should always be FieldMultiplyBattleStatAbAttr for the time being
 * @param pokemon {@linkcode Pokemon} the Pokemon applying this ability
 * @param stat {@linkcode Stat} the type of the checked stat
 * @param statValue {@linkcode NumberHolder} the value of the checked stat
 * @param checkedPokemon {@linkcode Pokemon} the Pokemon with the checked stat
 * @param hasApplied {@linkcode BooleanHolder} whether or not a FieldMultiplyBattleStatAbAttr has already affected this stat
 * @param args unused
 */
export function applyFieldStatMultiplierAbAttrs(
  attrType: Constructor<FieldMultiplyStatAbAttr>,
  pokemon: Pokemon,
  stat: Stat,
  statValue: NumberHolder,
  checkedPokemon: Pokemon,
  hasApplied: BooleanHolder,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal<FieldMultiplyStatAbAttr>(
    attrType,
    pokemon,
    (attr, passive) => attr.applyFieldStat(pokemon, passive, simulated, stat, statValue, checkedPokemon, hasApplied, args),
    (attr, passive) => attr.canApplyFieldStat(pokemon, passive, simulated, stat, statValue, checkedPokemon, hasApplied, args), args,
  );
}

export function applyPreAttackAbAttrs(
  attrType: Constructor<PreAttackAbAttr>,
  pokemon: Pokemon,
  defender: Pokemon | null,
  move: Move,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal<PreAttackAbAttr>(
    attrType,
    pokemon,
    (attr, passive) => attr.applyPreAttack(pokemon, passive, simulated, defender, move, args),
    (attr, passive) => attr.canApplyPreAttack(pokemon, passive, simulated, defender, move, args),
    args,
    simulated,
  );
}

export function applyPostAttackAbAttrs(
  attrType: Constructor<PostAttackAbAttr>,
  pokemon: Pokemon,
  defender: Pokemon,
  move: Move,
  hitResult: HitResult | null,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal<PostAttackAbAttr>(
    attrType,
    pokemon,
    (attr, passive) => attr.applyPostAttack(pokemon, passive, simulated, defender, move, hitResult, args),
    (attr, passive) => attr.canApplyPostAttack(pokemon, passive, simulated, defender, move, hitResult, args), args,
    simulated,
  );
}

export function applyPostKnockOutAbAttrs(
  attrType: Constructor<PostKnockOutAbAttr>,
  pokemon: Pokemon,
  knockedOut: Pokemon,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal<PostKnockOutAbAttr>(
    attrType,
    pokemon,
    (attr, passive) => attr.applyPostKnockOut(pokemon, passive, simulated, knockedOut, args),
    (attr, passive) => attr.canApplyPostKnockOut(pokemon, passive, simulated, knockedOut, args),
    args,
    simulated,
  );
}

export function applyPostVictoryAbAttrs(
  attrType: Constructor<PostVictoryAbAttr>,
  pokemon: Pokemon,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal<PostVictoryAbAttr>(
    attrType,
    pokemon,
    (attr, passive) => attr.applyPostVictory(pokemon, passive, simulated, args),
    (attr, passive) => attr.canApplyPostVictory(pokemon, passive, simulated, args),
    args,
    simulated,
  );
}

export function applyPostSummonAbAttrs(
  attrType: Constructor<PostSummonAbAttr>,
  pokemon: Pokemon,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal<PostSummonAbAttr>(
    attrType,
    pokemon,
    (attr, passive) => attr.applyPostSummon(pokemon, passive, simulated, args),
    (attr, passive) => attr.canApplyPostSummon(pokemon, passive, simulated, args),
    args,
    simulated,
  );
}

export function applyPreSummonAbAttrs(
  attrType: Constructor<PreSummonAbAttr>,
  pokemon: Pokemon,
  ...args: any[]
): void {
  applyAbAttrsInternal<PreSummonAbAttr>(
    attrType,
    pokemon,
    (attr, passive) => attr.applyPreSummon(pokemon, passive, args),
    (attr, passive) => attr.canApplyPreSummon(pokemon, passive, args),
    args
  );
}

export function applyPreSwitchOutAbAttrs(
  attrType: Constructor<PreSwitchOutAbAttr>,
  pokemon: Pokemon,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal<PreSwitchOutAbAttr>(
    attrType,
    pokemon,
    (attr, passive) => attr.applyPreSwitchOut(pokemon, passive, simulated, args),
    (attr, passive) => attr.canApplyPreSwitchOut(pokemon, passive, simulated, args),
    args,
    simulated,
  );
}

export function applyPreLeaveFieldAbAttrs(
  attrType: Constructor<PreLeaveFieldAbAttr>,
  pokemon: Pokemon,
  simulated = false,
  ...args: any[]
): void {
  return applyAbAttrsInternal<PreLeaveFieldAbAttr>(
    attrType,
    pokemon,
    (attr, passive) =>
      attr.applyPreLeaveField(pokemon, passive, simulated, args),
    (attr, passive) => attr.canApplyPreLeaveField(pokemon, passive, simulated, args),
    args,
    simulated
  );
}

export function applyPreStatStageChangeAbAttrs<T extends PreStatStageChangeAbAttr > (
  attrType: Constructor<T>,
  pokemon: Pokemon | null,
  stat: BattleStat,
  cancelled: BooleanHolder,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal<T>(
    attrType,
    pokemon,
    (attr, passive) => attr.applyPreStatStageChange(pokemon, passive, simulated, stat, cancelled, args),
    (attr, passive) => attr.canApplyPreStatStageChange(pokemon, passive, simulated, stat, cancelled, args),
    args,
    simulated,
  );
}

export function applyPostStatStageChangeAbAttrs(
  attrType: Constructor<PostStatStageChangeAbAttr>,
  pokemon: Pokemon,
  stats: BattleStat[],
  stages: integer,
  selfTarget: boolean,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal<PostStatStageChangeAbAttr>(
    attrType,
    pokemon,
    (attr, _passive) => attr.applyPostStatStageChange(pokemon, simulated, stats, stages, selfTarget, args),
    (attr, _passive) => attr.canApplyPostStatStageChange(pokemon, simulated, stats, stages, selfTarget, args), args,
    simulated,
  );
}

export function applyPreSetStatusAbAttrs(
  attrType: Constructor<PreSetStatusAbAttr>,
  pokemon: Pokemon,
  effect: StatusEffect | undefined,
  cancelled: BooleanHolder,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal<PreSetStatusAbAttr>(
    attrType,
    pokemon,
    (attr, passive) => attr.applyPreSetStatus(pokemon, passive, simulated, effect, cancelled, args),
    (attr, passive) => attr.canApplyPreSetStatus(pokemon, passive, simulated, effect, cancelled, args),
    args,
    simulated,
  );
}

export function applyPreApplyBattlerTagAbAttrs(
  attrType: Constructor<PreApplyBattlerTagAbAttr>,
  pokemon: Pokemon,
  tag: BattlerTag,
  cancelled: BooleanHolder,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal<PreApplyBattlerTagAbAttr>(
    attrType,
    pokemon,
    (attr, passive) => attr.applyPreApplyBattlerTag(pokemon, passive, simulated, tag, cancelled, args),
    (attr, passive) => attr.canApplyPreApplyBattlerTag(pokemon, passive, simulated, tag, cancelled, args),
    args,
    simulated,
  );
}

export function applyPreWeatherEffectAbAttrs(
  attrType: Constructor<PreWeatherEffectAbAttr>,
  pokemon: Pokemon,
  weather: Weather | null,
  cancelled: BooleanHolder,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal<PreWeatherDamageAbAttr>(
    attrType,
    pokemon,
    (attr, passive) => attr.applyPreWeatherEffect(pokemon, passive, simulated, weather, cancelled, args),
    (attr, passive) => attr.canApplyPreWeatherEffect(pokemon, passive, simulated, weather, cancelled, args),
    args,
    simulated,
  );
}

export function applyPostTurnAbAttrs(
  attrType: Constructor<PostTurnAbAttr>,
  pokemon: Pokemon,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal<PostTurnAbAttr>(
    attrType,
    pokemon,
    (attr, passive) => attr.applyPostTurn(pokemon, passive, simulated, args),
    (attr, passive) => attr.canApplyPostTurn(pokemon, passive, simulated, args),
    args,
    simulated,
  );
}

export function applyPostWeatherChangeAbAttrs(
  attrType: Constructor<PostWeatherChangeAbAttr>,
  pokemon: Pokemon,
  weather: WeatherType,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal<PostWeatherChangeAbAttr>(
    attrType,
    pokemon,
    (attr, passive) => attr.applyPostWeatherChange(pokemon, passive, simulated, weather, args),
    (attr, passive) => attr.canApplyPostWeatherChange(pokemon, passive, simulated, weather, args),
    args,
    simulated,
  );
}

export function applyPostWeatherLapseAbAttrs(
  attrType: Constructor<PostWeatherLapseAbAttr>,
  pokemon: Pokemon,
  weather: Weather | null,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal<PostWeatherLapseAbAttr>(
    attrType,
    pokemon,
    (attr, passive) => attr.applyPostWeatherLapse(pokemon, passive, simulated, weather, args),
    (attr, passive) => attr.canApplyPostWeatherLapse(pokemon, passive, simulated, weather, args),
    args,
    simulated,
  );
}

export function applyPostTerrainChangeAbAttrs(
  attrType: Constructor<PostTerrainChangeAbAttr>,
  pokemon: Pokemon,
  terrain: TerrainType,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal<PostTerrainChangeAbAttr>(
    attrType,
    pokemon,
    (attr, passive) => attr.applyPostTerrainChange(pokemon, passive, simulated, terrain, args),
    (attr, passive) => attr.canApplyPostTerrainChange(pokemon, passive, simulated, terrain, args),
    args,
    simulated,
  );
}

export function applyCheckTrappedAbAttrs(
  attrType: Constructor<CheckTrappedAbAttr>,
  pokemon: Pokemon,
  trapped: BooleanHolder,
  otherPokemon: Pokemon,
  messages: string[],
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal<CheckTrappedAbAttr>(
    attrType,
    pokemon,
    (attr, passive) => attr.applyCheckTrapped(pokemon, passive, simulated, trapped, otherPokemon, args),
    (attr, passive) => attr.canApplyCheckTrapped(pokemon, passive, simulated, trapped, otherPokemon, args), args,
    simulated,
    messages,
  );
}

export function applyPostBattleAbAttrs(
  attrType: Constructor<PostBattleAbAttr>,
  pokemon: Pokemon,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal<PostBattleAbAttr>(
    attrType,
    pokemon,
    (attr, passive) => attr.applyPostBattle(pokemon, passive, simulated, args),
    (attr, passive) => attr.canApplyPostBattle(pokemon, passive, simulated, args),
    args,
    simulated,
  );
}

export function applyPostFaintAbAttrs(
  attrType: Constructor<PostFaintAbAttr>,
  pokemon: Pokemon,
  attacker?: Pokemon,
  move?: Move,
  hitResult?: HitResult,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal<PostFaintAbAttr>(
    attrType,
    pokemon,
    (attr, passive) => attr.applyPostFaint(pokemon, passive, simulated, attacker, move, hitResult, args),
    (attr, passive) => attr.canApplyPostFaint(pokemon, passive, simulated, attacker, move, hitResult, args),
    args,
    simulated,
  );
}

export function applyPostItemLostAbAttrs(
  attrType: Constructor<PostItemLostAbAttr>,
  pokemon: Pokemon,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal<PostItemLostAbAttr>(
    attrType,
    pokemon,
    (attr, passive) => attr.applyPostItemLost(pokemon, simulated, args),
    (attr, passive) => attr.canApplyPostItemLost(pokemon, simulated, args),
    args,
  );
}

/**
 * Applies abilities when they become active mid-turn (ability switch)
 *
 * Ignores passives as they don't change and shouldn't be reapplied when main abilities change
 */
export function applyOnGainAbAttrs(
  pokemon: Pokemon,
  passive: boolean = false,
  simulated: boolean = false,
  ...args: any[]): void {
  applySingleAbAttrs<PostSummonAbAttr>(
    pokemon,
    passive,
    PostSummonAbAttr,
    (attr, passive) => attr.applyPostSummon(pokemon, passive, simulated, args),
    (attr, passive) => attr.canApplyPostSummon(pokemon, passive, simulated, args),
    args,
    true,
    simulated,
  );
}

/**
 * Applies ability attributes which activate when the ability is lost or suppressed (i.e. primal weather)
 */
export function applyOnLoseAbAttrs(pokemon: Pokemon, passive = false, simulated = false, ...args: any[]): void {
  applySingleAbAttrs<PreLeaveFieldAbAttr>(
    pokemon,
    passive,
    PreLeaveFieldAbAttr,
    (attr, passive) => attr.applyPreLeaveField(pokemon, passive, simulated, [ ...args, true ]),
    (attr, passive) => attr.canApplyPreLeaveField(pokemon, passive, simulated, [ ...args, true ]),
    args,
    true,
    simulated);

  applySingleAbAttrs<IllusionBreakAbAttr>(
    pokemon,
    passive,
    IllusionBreakAbAttr,
    (attr, passive) => attr.apply(pokemon, passive, simulated, null, args),
    (attr, passive) => attr.canApply(pokemon, passive, simulated, args),
    args,
    true,
    simulated
  )
}

/**
 * Sets the ability of a Pokémon as revealed.
 *
 * @param pokemon - The Pokémon whose ability is being revealed.
 */
function setAbilityRevealed(pokemon: Pokemon): void {
  if (pokemon.battleData) {
    pokemon.battleData.abilityRevealed = true;
  }
}

/**
 * Returns the Pokemon with weather-based forms
 */
function getPokemonWithWeatherBasedForms() {
  return globalScene.getField(true).filter(p =>
    (p.hasAbility(Abilities.FORECAST) && p.species.speciesId === Species.CASTFORM)
    || (p.hasAbility(Abilities.FLOWER_GIFT) && p.species.speciesId === Species.CHERRIM)
  );
}

export function initAbilities() {
  allAbilities.push(
    new Ability(Abilities.NONE, 3),
    new Ability(Abilities.STENCH, 3)
      .attr(PostAttackApplyBattlerTagAbAttr, false, (user, target, move) => !move.hasAttr(FlinchAttr) && !move.hitsSubstitute(user, target) ? 10 : 0, BattlerTagType.FLINCHED),
    new Ability(Abilities.DRIZZLE, 3)
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.RAIN)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.RAIN),
    new Ability(Abilities.SPEED_BOOST, 3)
      .attr(SpeedBoostAbAttr),
    new Ability(Abilities.BATTLE_ARMOR, 3)
      .attr(BlockCritAbAttr)
      .ignorable(),
    new Ability(Abilities.STURDY, 3)
      .attr(PreDefendFullHpEndureAbAttr)
      .attr(BlockOneHitKOAbAttr)
      .ignorable(),
    new Ability(Abilities.DAMP, 3)
      .attr(FieldPreventExplosiveMovesAbAttr)
      .ignorable(),
    new Ability(Abilities.LIMBER, 3)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.PARALYSIS)
      .attr(PostSummonHealStatusAbAttr, StatusEffect.PARALYSIS)
      .ignorable(),
    new Ability(Abilities.SAND_VEIL, 3)
      .attr(StatMultiplierAbAttr, Stat.EVA, 1.2)
      .attr(BlockWeatherDamageAttr, WeatherType.SANDSTORM)
      .condition(getWeatherCondition(WeatherType.SANDSTORM))
      .ignorable(),
    new Ability(Abilities.STATIC, 3)
      .attr(PostDefendContactApplyStatusEffectAbAttr, 30, StatusEffect.PARALYSIS)
      .bypassFaint(),
    new Ability(Abilities.VOLT_ABSORB, 3)
      .attr(TypeImmunityHealAbAttr, PokemonType.ELECTRIC)
      .ignorable(),
    new Ability(Abilities.WATER_ABSORB, 3)
      .attr(TypeImmunityHealAbAttr, PokemonType.WATER)
      .ignorable(),
    new Ability(Abilities.OBLIVIOUS, 3)
      .attr(BattlerTagImmunityAbAttr, [ BattlerTagType.INFATUATED, BattlerTagType.TAUNT ])
      .attr(PostSummonRemoveBattlerTagAbAttr, BattlerTagType.INFATUATED, BattlerTagType.TAUNT)
      .attr(IntimidateImmunityAbAttr)
      .ignorable(),
    new Ability(Abilities.CLOUD_NINE, 3)
      .attr(SuppressWeatherEffectAbAttr, true)
      .attr(PostSummonUnnamedMessageAbAttr, i18next.t("abilityTriggers:weatherEffectDisappeared"))
      .attr(PostSummonWeatherSuppressedFormChangeAbAttr)
      .attr(PostFaintUnsuppressedWeatherFormChangeAbAttr)
      .bypassFaint(),
    new Ability(Abilities.COMPOUND_EYES, 3)
      .attr(StatMultiplierAbAttr, Stat.ACC, 1.3),
    new Ability(Abilities.INSOMNIA, 3)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.SLEEP)
      .attr(PostSummonHealStatusAbAttr, StatusEffect.SLEEP)
      .attr(BattlerTagImmunityAbAttr, BattlerTagType.DROWSY)
      .ignorable(),
    new Ability(Abilities.COLOR_CHANGE, 3)
      .attr(PostDefendTypeChangeAbAttr)
      .condition(getSheerForceHitDisableAbCondition()),
    new Ability(Abilities.IMMUNITY, 3)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.POISON, StatusEffect.TOXIC)
      .attr(PostSummonHealStatusAbAttr, StatusEffect.POISON, StatusEffect.TOXIC)
      .ignorable(),
    new Ability(Abilities.FLASH_FIRE, 3)
      .attr(TypeImmunityAddBattlerTagAbAttr, PokemonType.FIRE, BattlerTagType.FIRE_BOOST, 1)
      .ignorable(),
    new Ability(Abilities.SHIELD_DUST, 3)
      .attr(IgnoreMoveEffectsAbAttr)
      .ignorable(),
    new Ability(Abilities.OWN_TEMPO, 3)
      .attr(BattlerTagImmunityAbAttr, BattlerTagType.CONFUSED)
      .attr(PostSummonRemoveBattlerTagAbAttr, BattlerTagType.CONFUSED)
      .attr(IntimidateImmunityAbAttr)
      .ignorable(),
    new Ability(Abilities.SUCTION_CUPS, 3)
      .attr(ForceSwitchOutImmunityAbAttr)
      .ignorable(),
    new Ability(Abilities.INTIMIDATE, 3)
      .attr(PostSummonStatStageChangeAbAttr, [ Stat.ATK ], -1, false, true),
    new Ability(Abilities.SHADOW_TAG, 3)
      .attr(ArenaTrapAbAttr, (user, target) => {
        if (target.hasAbility(Abilities.SHADOW_TAG)) {
          return false;
        }
        return true;
      }),
    new Ability(Abilities.ROUGH_SKIN, 3)
      .attr(PostDefendContactDamageAbAttr, 8)
      .bypassFaint(),
    new Ability(Abilities.WONDER_GUARD, 3)
      .attr(NonSuperEffectiveImmunityAbAttr)
      .uncopiable()
      .ignorable(),
    new Ability(Abilities.LEVITATE, 3)
      .attr(AttackTypeImmunityAbAttr, PokemonType.GROUND, (pokemon: Pokemon) => !pokemon.getTag(GroundedTag) && !globalScene.arena.getTag(ArenaTagType.GRAVITY))
      .ignorable(),
    new Ability(Abilities.EFFECT_SPORE, 3)
      .attr(EffectSporeAbAttr),
    new Ability(Abilities.SYNCHRONIZE, 3)
      .attr(SyncEncounterNatureAbAttr)
      .attr(SynchronizeStatusAbAttr),
    new Ability(Abilities.CLEAR_BODY, 3)
      .attr(ProtectStatAbAttr)
      .ignorable(),
    new Ability(Abilities.NATURAL_CURE, 3)
      .attr(PreSwitchOutResetStatusAbAttr),
    new Ability(Abilities.LIGHTNING_ROD, 3)
      .attr(RedirectTypeMoveAbAttr, PokemonType.ELECTRIC)
      .attr(TypeImmunityStatStageChangeAbAttr, PokemonType.ELECTRIC, Stat.SPATK, 1)
      .ignorable(),
    new Ability(Abilities.SERENE_GRACE, 3)
      .attr(MoveEffectChanceMultiplierAbAttr, 2),
    new Ability(Abilities.SWIFT_SWIM, 3)
      .attr(StatMultiplierAbAttr, Stat.SPD, 2)
      .condition(getWeatherCondition(WeatherType.RAIN, WeatherType.HEAVY_RAIN)),
    new Ability(Abilities.CHLOROPHYLL, 3)
      .attr(StatMultiplierAbAttr, Stat.SPD, 2)
      .condition(getWeatherCondition(WeatherType.SUNNY, WeatherType.HARSH_SUN)),
    new Ability(Abilities.ILLUMINATE, 3)
      .attr(ProtectStatAbAttr, Stat.ACC)
      .attr(DoubleBattleChanceAbAttr)
      .attr(IgnoreOpponentStatStagesAbAttr, [ Stat.EVA ])
      .ignorable(),
    new Ability(Abilities.TRACE, 3)
      .attr(PostSummonCopyAbilityAbAttr)
      .uncopiable(),
    new Ability(Abilities.HUGE_POWER, 3)
      .attr(StatMultiplierAbAttr, Stat.ATK, 2),
    new Ability(Abilities.POISON_POINT, 3)
      .attr(PostDefendContactApplyStatusEffectAbAttr, 30, StatusEffect.POISON)
      .bypassFaint(),
    new Ability(Abilities.INNER_FOCUS, 3)
      .attr(BattlerTagImmunityAbAttr, BattlerTagType.FLINCHED)
      .attr(IntimidateImmunityAbAttr)
      .ignorable(),
    new Ability(Abilities.MAGMA_ARMOR, 3)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.FREEZE)
      .attr(PostSummonHealStatusAbAttr, StatusEffect.FREEZE)
      .ignorable(),
    new Ability(Abilities.WATER_VEIL, 3)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.BURN)
      .attr(PostSummonHealStatusAbAttr, StatusEffect.BURN)
      .ignorable(),
    new Ability(Abilities.MAGNET_PULL, 3)
      .attr(ArenaTrapAbAttr, (user, target) => {
        if (target.getTypes(true).includes(PokemonType.STEEL) || (target.getTypes(true).includes(PokemonType.STELLAR) && target.getTypes().includes(PokemonType.STEEL))) {
          return true;
        }
        return false;
      }),
    new Ability(Abilities.SOUNDPROOF, 3)
      .attr(MoveImmunityAbAttr, (pokemon, attacker, move) => pokemon !== attacker && move.hasFlag(MoveFlags.SOUND_BASED))
      .ignorable(),
    new Ability(Abilities.RAIN_DISH, 3)
      .attr(PostWeatherLapseHealAbAttr, 1, WeatherType.RAIN, WeatherType.HEAVY_RAIN),
    new Ability(Abilities.SAND_STREAM, 3)
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.SANDSTORM)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.SANDSTORM),
    new Ability(Abilities.PRESSURE, 3)
      .attr(IncreasePpAbAttr)
      .attr(PostSummonMessageAbAttr, (pokemon: Pokemon) => i18next.t("abilityTriggers:postSummonPressure", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) })),
    new Ability(Abilities.THICK_FAT, 3)
      .attr(ReceivedTypeDamageMultiplierAbAttr, PokemonType.FIRE, 0.5)
      .attr(ReceivedTypeDamageMultiplierAbAttr, PokemonType.ICE, 0.5)
      .ignorable(),
    new Ability(Abilities.EARLY_BIRD, 3)
      .attr(ReduceStatusEffectDurationAbAttr, StatusEffect.SLEEP),
    new Ability(Abilities.FLAME_BODY, 3)
      .attr(PostDefendContactApplyStatusEffectAbAttr, 30, StatusEffect.BURN)
      .bypassFaint(),
    new Ability(Abilities.RUN_AWAY, 3)
      .attr(RunSuccessAbAttr),
    new Ability(Abilities.KEEN_EYE, 3)
      .attr(ProtectStatAbAttr, Stat.ACC)
      .ignorable(),
    new Ability(Abilities.HYPER_CUTTER, 3)
      .attr(ProtectStatAbAttr, Stat.ATK)
      .ignorable(),
    new Ability(Abilities.PICKUP, 3)
      .attr(PostBattleLootAbAttr)
      .unsuppressable(),
    new Ability(Abilities.TRUANT, 3)
      .attr(PostSummonAddBattlerTagAbAttr, BattlerTagType.TRUANT, 1, false),
    new Ability(Abilities.HUSTLE, 3)
      .attr(StatMultiplierAbAttr, Stat.ATK, 1.5)
      .attr(StatMultiplierAbAttr, Stat.ACC, 0.8, (_user, _target, move) => move.category === MoveCategory.PHYSICAL),
    new Ability(Abilities.CUTE_CHARM, 3)
      .attr(PostDefendContactApplyTagChanceAbAttr, 30, BattlerTagType.INFATUATED),
    new Ability(Abilities.PLUS, 3)
      .conditionalAttr(p => globalScene.currentBattle.double && [ Abilities.PLUS, Abilities.MINUS ].some(a => (p.getAlly()?.hasAbility(a) ?? false)), StatMultiplierAbAttr, Stat.SPATK, 1.5),
    new Ability(Abilities.MINUS, 3)
      .conditionalAttr(p => globalScene.currentBattle.double && [ Abilities.PLUS, Abilities.MINUS ].some(a => (p.getAlly()?.hasAbility(a) ?? false)), StatMultiplierAbAttr, Stat.SPATK, 1.5),
    new Ability(Abilities.FORECAST, 3)
      .uncopiable()
      .unreplaceable()
      .attr(NoFusionAbilityAbAttr)
      .attr(PostSummonFormChangeByWeatherAbAttr, Abilities.FORECAST)
      .attr(PostWeatherChangeFormChangeAbAttr, Abilities.FORECAST, [ WeatherType.NONE, WeatherType.SANDSTORM, WeatherType.STRONG_WINDS, WeatherType.FOG ]),
    new Ability(Abilities.STICKY_HOLD, 3)
      .attr(BlockItemTheftAbAttr)
      .bypassFaint()
      .ignorable(),
    new Ability(Abilities.SHED_SKIN, 3)
      .conditionalAttr(pokemon => !randSeedInt(3), PostTurnResetStatusAbAttr),
    new Ability(Abilities.GUTS, 3)
      .attr(BypassBurnDamageReductionAbAttr)
      .conditionalAttr(pokemon => !!pokemon.status || pokemon.hasAbility(Abilities.COMATOSE), StatMultiplierAbAttr, Stat.ATK, 1.5),
    new Ability(Abilities.MARVEL_SCALE, 3)
      .conditionalAttr(pokemon => !!pokemon.status || pokemon.hasAbility(Abilities.COMATOSE), StatMultiplierAbAttr, Stat.DEF, 1.5)
      .ignorable(),
    new Ability(Abilities.LIQUID_OOZE, 3)
      .attr(ReverseDrainAbAttr),
    new Ability(Abilities.OVERGROW, 3)
      .attr(LowHpMoveTypePowerBoostAbAttr, PokemonType.GRASS),
    new Ability(Abilities.BLAZE, 3)
      .attr(LowHpMoveTypePowerBoostAbAttr, PokemonType.FIRE),
    new Ability(Abilities.TORRENT, 3)
      .attr(LowHpMoveTypePowerBoostAbAttr, PokemonType.WATER),
    new Ability(Abilities.SWARM, 3)
      .attr(LowHpMoveTypePowerBoostAbAttr, PokemonType.BUG),
    new Ability(Abilities.ROCK_HEAD, 3)
      .attr(BlockRecoilDamageAttr),
    new Ability(Abilities.DROUGHT, 3)
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.SUNNY)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.SUNNY),
    new Ability(Abilities.ARENA_TRAP, 3)
      .attr(ArenaTrapAbAttr, (user, target) => {
        if (target.isGrounded()) {
          return true;
        }
        return false;
      })
      .attr(DoubleBattleChanceAbAttr),
    new Ability(Abilities.VITAL_SPIRIT, 3)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.SLEEP)
      .attr(PostSummonHealStatusAbAttr, StatusEffect.SLEEP)
      .attr(BattlerTagImmunityAbAttr, BattlerTagType.DROWSY)
      .ignorable(),
    new Ability(Abilities.WHITE_SMOKE, 3)
      .attr(ProtectStatAbAttr)
      .ignorable(),
    new Ability(Abilities.PURE_POWER, 3)
      .attr(StatMultiplierAbAttr, Stat.ATK, 2),
    new Ability(Abilities.SHELL_ARMOR, 3)
      .attr(BlockCritAbAttr)
      .ignorable(),
    new Ability(Abilities.AIR_LOCK, 3)
      .attr(SuppressWeatherEffectAbAttr, true)
      .attr(PostSummonUnnamedMessageAbAttr, i18next.t("abilityTriggers:weatherEffectDisappeared"))
      .attr(PostSummonWeatherSuppressedFormChangeAbAttr)
      .attr(PostFaintUnsuppressedWeatherFormChangeAbAttr)
      .bypassFaint(),
    new Ability(Abilities.TANGLED_FEET, 4)
      .conditionalAttr(pokemon => !!pokemon.getTag(BattlerTagType.CONFUSED), StatMultiplierAbAttr, Stat.EVA, 2)
      .ignorable(),
    new Ability(Abilities.MOTOR_DRIVE, 4)
      .attr(TypeImmunityStatStageChangeAbAttr, PokemonType.ELECTRIC, Stat.SPD, 1)
      .ignorable(),
    new Ability(Abilities.RIVALRY, 4)
      .attr(MovePowerBoostAbAttr, (user, target, move) => user?.gender !== Gender.GENDERLESS && target?.gender !== Gender.GENDERLESS && user?.gender === target?.gender, 1.25, true)
      .attr(MovePowerBoostAbAttr, (user, target, move) => user?.gender !== Gender.GENDERLESS && target?.gender !== Gender.GENDERLESS && user?.gender !== target?.gender, 0.75),
    new Ability(Abilities.STEADFAST, 4)
      .attr(FlinchStatStageChangeAbAttr, [ Stat.SPD ], 1),
    new Ability(Abilities.SNOW_CLOAK, 4)
      .attr(StatMultiplierAbAttr, Stat.EVA, 1.2)
      .attr(BlockWeatherDamageAttr, WeatherType.HAIL)
      .condition(getWeatherCondition(WeatherType.HAIL, WeatherType.SNOW))
      .ignorable(),
    new Ability(Abilities.GLUTTONY, 4)
      .attr(ReduceBerryUseThresholdAbAttr),
    new Ability(Abilities.ANGER_POINT, 4)
      .attr(PostDefendCritStatStageChangeAbAttr, Stat.ATK, 6),
    new Ability(Abilities.UNBURDEN, 4)
      .attr(PostItemLostApplyBattlerTagAbAttr, BattlerTagType.UNBURDEN)
      .bypassFaint() // Allows reviver seed to activate Unburden
      .edgeCase(), // Should not restore Unburden boost if Pokemon loses then regains Unburden ability
    new Ability(Abilities.HEATPROOF, 4)
      .attr(ReceivedTypeDamageMultiplierAbAttr, PokemonType.FIRE, 0.5)
      .attr(ReduceBurnDamageAbAttr, 0.5)
      .ignorable(),
    new Ability(Abilities.SIMPLE, 4)
      .attr(StatStageChangeMultiplierAbAttr, 2)
      .ignorable(),
    new Ability(Abilities.DRY_SKIN, 4)
      .attr(PostWeatherLapseDamageAbAttr, 2, WeatherType.SUNNY, WeatherType.HARSH_SUN)
      .attr(PostWeatherLapseHealAbAttr, 2, WeatherType.RAIN, WeatherType.HEAVY_RAIN)
      .attr(ReceivedTypeDamageMultiplierAbAttr, PokemonType.FIRE, 1.25)
      .attr(TypeImmunityHealAbAttr, PokemonType.WATER)
      .ignorable(),
    new Ability(Abilities.DOWNLOAD, 4)
      .attr(DownloadAbAttr),
    new Ability(Abilities.IRON_FIST, 4)
      .attr(MovePowerBoostAbAttr, (user, target, move) => move.hasFlag(MoveFlags.PUNCHING_MOVE), 1.2),
    new Ability(Abilities.POISON_HEAL, 4)
      .attr(PostTurnStatusHealAbAttr, StatusEffect.TOXIC, StatusEffect.POISON)
      .attr(BlockStatusDamageAbAttr, StatusEffect.TOXIC, StatusEffect.POISON),
    new Ability(Abilities.ADAPTABILITY, 4)
      .attr(StabBoostAbAttr),
    new Ability(Abilities.SKILL_LINK, 4)
      .attr(MaxMultiHitAbAttr),
    new Ability(Abilities.HYDRATION, 4)
      .attr(PostTurnResetStatusAbAttr)
      .condition(getWeatherCondition(WeatherType.RAIN, WeatherType.HEAVY_RAIN)),
    new Ability(Abilities.SOLAR_POWER, 4)
      .attr(PostWeatherLapseDamageAbAttr, 2, WeatherType.SUNNY, WeatherType.HARSH_SUN)
      .attr(StatMultiplierAbAttr, Stat.SPATK, 1.5)
      .condition(getWeatherCondition(WeatherType.SUNNY, WeatherType.HARSH_SUN)),
    new Ability(Abilities.QUICK_FEET, 4)
      .conditionalAttr(pokemon => pokemon.status ? pokemon.status.effect === StatusEffect.PARALYSIS : false, StatMultiplierAbAttr, Stat.SPD, 2)
      .conditionalAttr(pokemon => !!pokemon.status || pokemon.hasAbility(Abilities.COMATOSE), StatMultiplierAbAttr, Stat.SPD, 1.5),
    new Ability(Abilities.NORMALIZE, 4)
      .attr(MoveTypeChangeAbAttr, PokemonType.NORMAL, 1.2, (user, target, move) => {
        return ![ Moves.MULTI_ATTACK, Moves.REVELATION_DANCE, Moves.TERRAIN_PULSE, Moves.HIDDEN_POWER, Moves.WEATHER_BALL, Moves.NATURAL_GIFT, Moves.JUDGMENT, Moves.TECHNO_BLAST ].includes(move.id);
      }),
    new Ability(Abilities.SNIPER, 4)
      .attr(MultCritAbAttr, 1.5),
    new Ability(Abilities.MAGIC_GUARD, 4)
      .attr(BlockNonDirectDamageAbAttr),
    new Ability(Abilities.NO_GUARD, 4)
      .attr(AlwaysHitAbAttr)
      .attr(DoubleBattleChanceAbAttr),
    new Ability(Abilities.STALL, 4)
      .attr(ChangeMovePriorityAbAttr, (pokemon, move: Move) => true, -0.2),
    new Ability(Abilities.TECHNICIAN, 4)
      .attr(MovePowerBoostAbAttr, (user, target, move) => {
        const power = new NumberHolder(move.power);
        applyMoveAttrs(VariablePowerAttr, user, target, move, power);
        return power.value <= 60;
      }, 1.5),
    new Ability(Abilities.LEAF_GUARD, 4)
      .attr(StatusEffectImmunityAbAttr)
      .condition(getWeatherCondition(WeatherType.SUNNY, WeatherType.HARSH_SUN))
      .ignorable(),
    new Ability(Abilities.KLUTZ, 4)
      .unimplemented(),
    new Ability(Abilities.MOLD_BREAKER, 4)
      .attr(PostSummonMessageAbAttr, (pokemon: Pokemon) => i18next.t("abilityTriggers:postSummonMoldBreaker", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }))
      .attr(MoveAbilityBypassAbAttr),
    new Ability(Abilities.SUPER_LUCK, 4)
      .attr(BonusCritAbAttr),
    new Ability(Abilities.AFTERMATH, 4)
      .attr(PostFaintContactDamageAbAttr, 4)
      .bypassFaint(),
    new Ability(Abilities.ANTICIPATION, 4)
      .conditionalAttr(getAnticipationCondition(), PostSummonMessageAbAttr, (pokemon: Pokemon) => i18next.t("abilityTriggers:postSummonAnticipation", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) })),
    new Ability(Abilities.FOREWARN, 4)
      .attr(ForewarnAbAttr),
    new Ability(Abilities.UNAWARE, 4)
      .attr(IgnoreOpponentStatStagesAbAttr, [ Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.ACC, Stat.EVA ])
      .ignorable(),
    new Ability(Abilities.TINTED_LENS, 4)
      .attr(DamageBoostAbAttr, 2, (user, target, move) => (target?.getMoveEffectiveness(user!, move) ?? 1) <= 0.5),
    new Ability(Abilities.FILTER, 4)
      .attr(ReceivedMoveDamageMultiplierAbAttr, (target, user, move) => target.getMoveEffectiveness(user, move) >= 2, 0.75)
      .ignorable(),
    new Ability(Abilities.SLOW_START, 4)
      .attr(PostSummonAddBattlerTagAbAttr, BattlerTagType.SLOW_START, 5),
    new Ability(Abilities.SCRAPPY, 4)
      .attr(IgnoreTypeImmunityAbAttr, PokemonType.GHOST, [ PokemonType.NORMAL, PokemonType.FIGHTING ])
      .attr(IntimidateImmunityAbAttr),
    new Ability(Abilities.STORM_DRAIN, 4)
      .attr(RedirectTypeMoveAbAttr, PokemonType.WATER)
      .attr(TypeImmunityStatStageChangeAbAttr, PokemonType.WATER, Stat.SPATK, 1)
      .ignorable(),
    new Ability(Abilities.ICE_BODY, 4)
      .attr(BlockWeatherDamageAttr, WeatherType.HAIL)
      .attr(PostWeatherLapseHealAbAttr, 1, WeatherType.HAIL, WeatherType.SNOW),
    new Ability(Abilities.SOLID_ROCK, 4)
      .attr(ReceivedMoveDamageMultiplierAbAttr, (target, user, move) => target.getMoveEffectiveness(user, move) >= 2, 0.75)
      .ignorable(),
    new Ability(Abilities.SNOW_WARNING, 4)
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.SNOW)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.SNOW),
    new Ability(Abilities.HONEY_GATHER, 4)
      .attr(MoneyAbAttr)
      .unsuppressable(),
    new Ability(Abilities.FRISK, 4)
      .attr(FriskAbAttr),
    new Ability(Abilities.RECKLESS, 4)
      .attr(MovePowerBoostAbAttr, (user, target, move) => move.hasFlag(MoveFlags.RECKLESS_MOVE), 1.2),
    new Ability(Abilities.MULTITYPE, 4)
      .attr(NoFusionAbilityAbAttr)
      .uncopiable()
      .unsuppressable()
      .unreplaceable(),
    new Ability(Abilities.FLOWER_GIFT, 4)
      .conditionalAttr(getWeatherCondition(WeatherType.SUNNY || WeatherType.HARSH_SUN), StatMultiplierAbAttr, Stat.ATK, 1.5)
      .conditionalAttr(getWeatherCondition(WeatherType.SUNNY || WeatherType.HARSH_SUN), StatMultiplierAbAttr, Stat.SPDEF, 1.5)
      .conditionalAttr(getWeatherCondition(WeatherType.SUNNY || WeatherType.HARSH_SUN), AllyStatMultiplierAbAttr, Stat.ATK, 1.5)
      .conditionalAttr(getWeatherCondition(WeatherType.SUNNY || WeatherType.HARSH_SUN), AllyStatMultiplierAbAttr, Stat.SPDEF, 1.5)
      .attr(NoFusionAbilityAbAttr)
      .attr(PostSummonFormChangeByWeatherAbAttr, Abilities.FLOWER_GIFT)
      .attr(PostWeatherChangeFormChangeAbAttr, Abilities.FLOWER_GIFT, [ WeatherType.NONE, WeatherType.SANDSTORM, WeatherType.STRONG_WINDS, WeatherType.FOG, WeatherType.HAIL, WeatherType.HEAVY_RAIN, WeatherType.SNOW, WeatherType.RAIN ])
      .uncopiable()
      .unreplaceable()
      .ignorable(),
    new Ability(Abilities.BAD_DREAMS, 4)
      .attr(PostTurnHurtIfSleepingAbAttr),
    new Ability(Abilities.PICKPOCKET, 5)
      .attr(PostDefendStealHeldItemAbAttr, (target, user, move) => move.doesFlagEffectApply({flag: MoveFlags.MAKES_CONTACT, user, target}))
      .condition(getSheerForceHitDisableAbCondition()),
    new Ability(Abilities.SHEER_FORCE, 5)
      .attr(MovePowerBoostAbAttr, (user, target, move) => move.chance >= 1, 1.3)
      .attr(MoveEffectChanceMultiplierAbAttr, 0), // This attribute does not seem to function - Should disable life orb, eject button, red card, kee/maranga berry if they get implemented
    new Ability(Abilities.CONTRARY, 5)
      .attr(StatStageChangeMultiplierAbAttr, -1)
      .ignorable(),
    new Ability(Abilities.UNNERVE, 5)
      .attr(PreventBerryUseAbAttr),
    new Ability(Abilities.DEFIANT, 5)
      .attr(PostStatStageChangeStatStageChangeAbAttr, (target, statsChanged, stages) => stages < 0, [ Stat.ATK ], 2),
    new Ability(Abilities.DEFEATIST, 5)
      .attr(StatMultiplierAbAttr, Stat.ATK, 0.5)
      .attr(StatMultiplierAbAttr, Stat.SPATK, 0.5)
      .condition((pokemon) => pokemon.getHpRatio() <= 0.5),
    new Ability(Abilities.CURSED_BODY, 5)
      .attr(PostDefendMoveDisableAbAttr, 30)
      .bypassFaint(),
    new Ability(Abilities.HEALER, 5)
      .conditionalAttr(pokemon => !isNullOrUndefined(pokemon.getAlly()) && randSeedInt(10) < 3, PostTurnResetStatusAbAttr, true),
    new Ability(Abilities.FRIEND_GUARD, 5)
      .attr(AlliedFieldDamageReductionAbAttr, 0.75)
      .ignorable(),
    new Ability(Abilities.WEAK_ARMOR, 5)
      .attr(PostDefendStatStageChangeAbAttr, (target, user, move) => move.category === MoveCategory.PHYSICAL, Stat.DEF, -1)
      .attr(PostDefendStatStageChangeAbAttr, (target, user, move) => move.category === MoveCategory.PHYSICAL, Stat.SPD, 2),
    new Ability(Abilities.HEAVY_METAL, 5)
      .attr(WeightMultiplierAbAttr, 2)
      .ignorable(),
    new Ability(Abilities.LIGHT_METAL, 5)
      .attr(WeightMultiplierAbAttr, 0.5)
      .ignorable(),
    new Ability(Abilities.MULTISCALE, 5)
      .attr(ReceivedMoveDamageMultiplierAbAttr, (target, user, move) => target.isFullHp(), 0.5)
      .ignorable(),
    new Ability(Abilities.TOXIC_BOOST, 5)
      .attr(MovePowerBoostAbAttr, (user, target, move) => move.category === MoveCategory.PHYSICAL && (user?.status?.effect === StatusEffect.POISON || user?.status?.effect === StatusEffect.TOXIC), 1.5),
    new Ability(Abilities.FLARE_BOOST, 5)
      .attr(MovePowerBoostAbAttr, (user, target, move) => move.category === MoveCategory.SPECIAL && user?.status?.effect === StatusEffect.BURN, 1.5),
    new Ability(Abilities.HARVEST, 5)
      .attr(
        PostTurnLootAbAttr,
        "EATEN_BERRIES",
        /** Rate is doubled when under sun {@link https://dex.pokemonshowdown.com/abilities/harvest} */
        (pokemon) => 0.5 * (getWeatherCondition(WeatherType.SUNNY, WeatherType.HARSH_SUN)(pokemon) ? 2 : 1)
      )
      .edgeCase(), // Cannot recover berries used up by fling or natural gift (unimplemented)
    new Ability(Abilities.TELEPATHY, 5)
      .attr(MoveImmunityAbAttr, (pokemon, attacker, move) => pokemon.getAlly() === attacker && move instanceof AttackMove)
      .ignorable(),
    new Ability(Abilities.MOODY, 5)
      .attr(MoodyAbAttr),
    new Ability(Abilities.OVERCOAT, 5)
      .attr(BlockWeatherDamageAttr)
      .attr(MoveImmunityAbAttr, (pokemon, attacker, move) => pokemon !== attacker && move.hasFlag(MoveFlags.POWDER_MOVE))
      .ignorable(),
    new Ability(Abilities.POISON_TOUCH, 5)
      .attr(PostAttackContactApplyStatusEffectAbAttr, 30, StatusEffect.POISON),
    new Ability(Abilities.REGENERATOR, 5)
      .attr(PreSwitchOutHealAbAttr),
    new Ability(Abilities.BIG_PECKS, 5)
      .attr(ProtectStatAbAttr, Stat.DEF)
      .ignorable(),
    new Ability(Abilities.SAND_RUSH, 5)
      .attr(StatMultiplierAbAttr, Stat.SPD, 2)
      .attr(BlockWeatherDamageAttr, WeatherType.SANDSTORM)
      .condition(getWeatherCondition(WeatherType.SANDSTORM)),
    new Ability(Abilities.WONDER_SKIN, 5)
      .attr(WonderSkinAbAttr)
      .ignorable(),
    new Ability(Abilities.ANALYTIC, 5)
      .attr(MovePowerBoostAbAttr, (user, target, move) => {
        const movePhase = globalScene.findPhase((phase) => phase instanceof MovePhase && phase.pokemon.id !== user?.id);
        return isNullOrUndefined(movePhase);
      }, 1.3),
    new Ability(Abilities.ILLUSION, 5)
      // The Pokemon generate an illusion if it's available
      .attr(IllusionPreSummonAbAttr, false)
      .attr(IllusionBreakAbAttr)
      // The Pokemon loses its illusion when damaged by a move
      .attr(PostDefendIllusionBreakAbAttr, true)
      // Illusion is available again after a battle
      .conditionalAttr((pokemon) => pokemon.isAllowedInBattle(), IllusionPostBattleAbAttr, false)
      .uncopiable()
      .bypassFaint(),
    new Ability(Abilities.IMPOSTER, 5)
      .attr(PostSummonTransformAbAttr)
      .uncopiable(),
    new Ability(Abilities.INFILTRATOR, 5)
      .attr(InfiltratorAbAttr)
      .partial(), // does not bypass Mist
    new Ability(Abilities.MUMMY, 5)
      .attr(PostDefendAbilityGiveAbAttr, Abilities.MUMMY)
      .bypassFaint(),
    new Ability(Abilities.MOXIE, 5)
      .attr(PostVictoryStatStageChangeAbAttr, Stat.ATK, 1),
    new Ability(Abilities.JUSTIFIED, 5)
      .attr(PostDefendStatStageChangeAbAttr, (target, user, move) => user.getMoveType(move) === PokemonType.DARK && move.category !== MoveCategory.STATUS, Stat.ATK, 1),
    new Ability(Abilities.RATTLED, 5)
      .attr(PostDefendStatStageChangeAbAttr, (target, user, move) => {
        const moveType = user.getMoveType(move);
        return move.category !== MoveCategory.STATUS
          && (moveType === PokemonType.DARK || moveType === PokemonType.BUG || moveType === PokemonType.GHOST);
      }, Stat.SPD, 1)
      .attr(PostIntimidateStatStageChangeAbAttr, [ Stat.SPD ], 1),
    new Ability(Abilities.MAGIC_BOUNCE, 5)
      .attr(ReflectStatusMoveAbAttr)
      .ignorable()
      // Interactions with stomping tantrum, instruct, encore, and probably other moves that
      // rely on move history
      .edgeCase(),
    new Ability(Abilities.SAP_SIPPER, 5)
      .attr(TypeImmunityStatStageChangeAbAttr, PokemonType.GRASS, Stat.ATK, 1)
      .ignorable(),
    new Ability(Abilities.PRANKSTER, 5)
      .attr(ChangeMovePriorityAbAttr, (pokemon, move: Move) => move.category === MoveCategory.STATUS, 1),
    new Ability(Abilities.SAND_FORCE, 5)
      .attr(MoveTypePowerBoostAbAttr, PokemonType.ROCK, 1.3)
      .attr(MoveTypePowerBoostAbAttr, PokemonType.GROUND, 1.3)
      .attr(MoveTypePowerBoostAbAttr, PokemonType.STEEL, 1.3)
      .attr(BlockWeatherDamageAttr, WeatherType.SANDSTORM)
      .condition(getWeatherCondition(WeatherType.SANDSTORM)),
    new Ability(Abilities.IRON_BARBS, 5)
      .attr(PostDefendContactDamageAbAttr, 8)
      .bypassFaint(),
    new Ability(Abilities.ZEN_MODE, 5)
      .attr(PostBattleInitFormChangeAbAttr, () => 0)
      .attr(PostSummonFormChangeAbAttr, p => p.getHpRatio() <= 0.5 ? 1 : 0)
      .attr(PostTurnFormChangeAbAttr, p => p.getHpRatio() <= 0.5 ? 1 : 0)
      .attr(NoFusionAbilityAbAttr)
      .uncopiable()
      .unreplaceable()
      .unsuppressable()
      .bypassFaint(),
    new Ability(Abilities.VICTORY_STAR, 5)
      .attr(StatMultiplierAbAttr, Stat.ACC, 1.1)
      .attr(AllyStatMultiplierAbAttr, Stat.ACC, 1.1, false),
    new Ability(Abilities.TURBOBLAZE, 5)
      .attr(PostSummonMessageAbAttr, (pokemon: Pokemon) => i18next.t("abilityTriggers:postSummonTurboblaze", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }))
      .attr(MoveAbilityBypassAbAttr),
    new Ability(Abilities.TERAVOLT, 5)
      .attr(PostSummonMessageAbAttr, (pokemon: Pokemon) => i18next.t("abilityTriggers:postSummonTeravolt", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }))
      .attr(MoveAbilityBypassAbAttr),
    new Ability(Abilities.AROMA_VEIL, 6)
      .attr(UserFieldBattlerTagImmunityAbAttr, [ BattlerTagType.INFATUATED, BattlerTagType.TAUNT, BattlerTagType.DISABLED, BattlerTagType.TORMENT, BattlerTagType.HEAL_BLOCK ])
      .ignorable(),
    new Ability(Abilities.FLOWER_VEIL, 6)
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
    new Ability(Abilities.CHEEK_POUCH, 6)
      .attr(HealFromBerryUseAbAttr, 1 / 3),
    new Ability(Abilities.PROTEAN, 6)
      .attr(PokemonTypeChangeAbAttr),
    //.condition((p) => !p.summonData?.abilitiesApplied.includes(Abilities.PROTEAN)), //Gen 9 Implementation
    new Ability(Abilities.FUR_COAT, 6)
      .attr(ReceivedMoveDamageMultiplierAbAttr, (target, user, move) => move.category === MoveCategory.PHYSICAL, 0.5)
      .ignorable(),
    new Ability(Abilities.MAGICIAN, 6)
      .attr(PostAttackStealHeldItemAbAttr),
    new Ability(Abilities.BULLETPROOF, 6)
      .attr(MoveImmunityAbAttr, (pokemon, attacker, move) => pokemon !== attacker && move.hasFlag(MoveFlags.BALLBOMB_MOVE))
      .ignorable(),
    new Ability(Abilities.COMPETITIVE, 6)
      .attr(PostStatStageChangeStatStageChangeAbAttr, (target, statsChanged, stages) => stages < 0, [ Stat.SPATK ], 2),
    new Ability(Abilities.STRONG_JAW, 6)
      .attr(MovePowerBoostAbAttr, (user, target, move) => move.hasFlag(MoveFlags.BITING_MOVE), 1.5),
    new Ability(Abilities.REFRIGERATE, 6)
      .attr(MoveTypeChangeAbAttr, PokemonType.ICE, 1.2, (user, target, move) => move.type === PokemonType.NORMAL && !move.hasAttr(VariableMoveTypeAttr)),
    new Ability(Abilities.SWEET_VEIL, 6)
      .attr(UserFieldStatusEffectImmunityAbAttr, StatusEffect.SLEEP)
      .attr(PostSummonUserFieldRemoveStatusEffectAbAttr, StatusEffect.SLEEP)
      .attr(UserFieldBattlerTagImmunityAbAttr, BattlerTagType.DROWSY)
      .ignorable()
      .partial(), // Mold Breaker ally should not be affected by Sweet Veil
    new Ability(Abilities.STANCE_CHANGE, 6)
      .attr(NoFusionAbilityAbAttr)
      .uncopiable()
      .unreplaceable()
      .unsuppressable(),
    new Ability(Abilities.GALE_WINGS, 6)
      .attr(ChangeMovePriorityAbAttr, (pokemon, move) => pokemon.isFullHp() && pokemon.getMoveType(move) === PokemonType.FLYING, 1),
    new Ability(Abilities.MEGA_LAUNCHER, 6)
      .attr(MovePowerBoostAbAttr, (user, target, move) => move.hasFlag(MoveFlags.PULSE_MOVE), 1.5),
    new Ability(Abilities.GRASS_PELT, 6)
      .conditionalAttr(getTerrainCondition(TerrainType.GRASSY), StatMultiplierAbAttr, Stat.DEF, 1.5)
      .ignorable(),
    new Ability(Abilities.SYMBIOSIS, 6)
      .unimplemented(),
    new Ability(Abilities.TOUGH_CLAWS, 6)
      .attr(MovePowerBoostAbAttr, (user, target, move) => move.hasFlag(MoveFlags.MAKES_CONTACT), 1.3),
    new Ability(Abilities.PIXILATE, 6)
      .attr(MoveTypeChangeAbAttr, PokemonType.FAIRY, 1.2, (user, target, move) => move.type === PokemonType.NORMAL && !move.hasAttr(VariableMoveTypeAttr)),
    new Ability(Abilities.GOOEY, 6)
      .attr(PostDefendStatStageChangeAbAttr, (target, user, move) => move.hasFlag(MoveFlags.MAKES_CONTACT), Stat.SPD, -1, false),
    new Ability(Abilities.AERILATE, 6)
      .attr(MoveTypeChangeAbAttr, PokemonType.FLYING, 1.2, (user, target, move) => move.type === PokemonType.NORMAL && !move.hasAttr(VariableMoveTypeAttr)),
    new Ability(Abilities.PARENTAL_BOND, 6)
      .attr(AddSecondStrikeAbAttr, 0.25),
    new Ability(Abilities.DARK_AURA, 6)
      .attr(PostSummonMessageAbAttr, (pokemon: Pokemon) => i18next.t("abilityTriggers:postSummonDarkAura", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }))
      .attr(FieldMoveTypePowerBoostAbAttr, PokemonType.DARK, 4 / 3),
    new Ability(Abilities.FAIRY_AURA, 6)
      .attr(PostSummonMessageAbAttr, (pokemon: Pokemon) => i18next.t("abilityTriggers:postSummonFairyAura", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }))
      .attr(FieldMoveTypePowerBoostAbAttr, PokemonType.FAIRY, 4 / 3),
    new Ability(Abilities.AURA_BREAK, 6)
      .ignorable()
      .conditionalAttr(pokemon => globalScene.getField(true).some(p => p.hasAbility(Abilities.DARK_AURA)), FieldMoveTypePowerBoostAbAttr, PokemonType.DARK, 9 / 16)
      .conditionalAttr(pokemon => globalScene.getField(true).some(p => p.hasAbility(Abilities.FAIRY_AURA)), FieldMoveTypePowerBoostAbAttr, PokemonType.FAIRY, 9 / 16)
      .conditionalAttr(pokemon => globalScene.getField(true).some(p => p.hasAbility(Abilities.DARK_AURA) || p.hasAbility(Abilities.FAIRY_AURA)),
        PostSummonMessageAbAttr, (pokemon: Pokemon) => i18next.t("abilityTriggers:postSummonAuraBreak", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) })),
    new Ability(Abilities.PRIMORDIAL_SEA, 6)
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.HEAVY_RAIN)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.HEAVY_RAIN)
      .attr(PreLeaveFieldClearWeatherAbAttr)
      .bypassFaint(),
    new Ability(Abilities.DESOLATE_LAND, 6)
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.HARSH_SUN)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.HARSH_SUN)
      .attr(PreLeaveFieldClearWeatherAbAttr)
      .bypassFaint(),
    new Ability(Abilities.DELTA_STREAM, 6)
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.STRONG_WINDS)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.STRONG_WINDS)
      .attr(PreLeaveFieldClearWeatherAbAttr)
      .bypassFaint(),
    new Ability(Abilities.STAMINA, 7)
      .attr(PostDefendStatStageChangeAbAttr, (target, user, move) => move.category !== MoveCategory.STATUS, Stat.DEF, 1),
    new Ability(Abilities.WIMP_OUT, 7)
      .attr(PostDamageForceSwitchAbAttr)
      .edgeCase(), // Should not trigger when hurting itself in confusion, causes Fake Out to fail turn 1 and succeed turn 2 if pokemon is switched out before battle start via playing in Switch Mode
    new Ability(Abilities.EMERGENCY_EXIT, 7)
      .attr(PostDamageForceSwitchAbAttr)
      .edgeCase(), // Should not trigger when hurting itself in confusion, causes Fake Out to fail turn 1 and succeed turn 2 if pokemon is switched out before battle start via playing in Switch Mode
    new Ability(Abilities.WATER_COMPACTION, 7)
      .attr(PostDefendStatStageChangeAbAttr, (target, user, move) => user.getMoveType(move) === PokemonType.WATER && move.category !== MoveCategory.STATUS, Stat.DEF, 2),
    new Ability(Abilities.MERCILESS, 7)
      .attr(ConditionalCritAbAttr, (user, target, move) => target?.status?.effect === StatusEffect.TOXIC || target?.status?.effect === StatusEffect.POISON),
    new Ability(Abilities.SHIELDS_DOWN, 7)
      .attr(PostBattleInitFormChangeAbAttr, () => 0)
      .attr(PostSummonFormChangeAbAttr, p => p.formIndex % 7 + (p.getHpRatio() <= 0.5 ? 7 : 0))
      .attr(PostTurnFormChangeAbAttr, p => p.formIndex % 7 + (p.getHpRatio() <= 0.5 ? 7 : 0))
      .conditionalAttr(p => p.formIndex !== 7, StatusEffectImmunityAbAttr)
      .conditionalAttr(p => p.formIndex !== 7, BattlerTagImmunityAbAttr, BattlerTagType.DROWSY)
      .attr(NoFusionAbilityAbAttr)
      .attr(NoTransformAbilityAbAttr)
      .uncopiable()
      .unreplaceable()
      .unsuppressable()
      .bypassFaint(),
    new Ability(Abilities.STAKEOUT, 7)
      .attr(MovePowerBoostAbAttr, (user, target, move) => !!target?.turnData.switchedInThisTurn, 2),
    new Ability(Abilities.WATER_BUBBLE, 7)
      .attr(ReceivedTypeDamageMultiplierAbAttr, PokemonType.FIRE, 0.5)
      .attr(MoveTypePowerBoostAbAttr, PokemonType.WATER, 2)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.BURN)
      .attr(PostSummonHealStatusAbAttr, StatusEffect.BURN)
      .ignorable(),
    new Ability(Abilities.STEELWORKER, 7)
      .attr(MoveTypePowerBoostAbAttr, PokemonType.STEEL),
    new Ability(Abilities.BERSERK, 7)
      .attr(PostDefendHpGatedStatStageChangeAbAttr, (target, user, move) => move.category !== MoveCategory.STATUS, 0.5, [ Stat.SPATK ], 1)
      .condition(getSheerForceHitDisableAbCondition()),
    new Ability(Abilities.SLUSH_RUSH, 7)
      .attr(StatMultiplierAbAttr, Stat.SPD, 2)
      .condition(getWeatherCondition(WeatherType.HAIL, WeatherType.SNOW)),
    new Ability(Abilities.LONG_REACH, 7)
      .attr(IgnoreContactAbAttr),
    new Ability(Abilities.LIQUID_VOICE, 7)
      .attr(MoveTypeChangeAbAttr, PokemonType.WATER, 1, (user, target, move) => move.hasFlag(MoveFlags.SOUND_BASED)),
    new Ability(Abilities.TRIAGE, 7)
      .attr(ChangeMovePriorityAbAttr, (pokemon, move) => move.hasFlag(MoveFlags.TRIAGE_MOVE), 3),
    new Ability(Abilities.GALVANIZE, 7)
      .attr(MoveTypeChangeAbAttr, PokemonType.ELECTRIC, 1.2, (user, target, move) => move.type === PokemonType.NORMAL && !move.hasAttr(VariableMoveTypeAttr)),
    new Ability(Abilities.SURGE_SURFER, 7)
      .conditionalAttr(getTerrainCondition(TerrainType.ELECTRIC), StatMultiplierAbAttr, Stat.SPD, 2),
    new Ability(Abilities.SCHOOLING, 7)
      .attr(PostBattleInitFormChangeAbAttr, () => 0)
      .attr(PostSummonFormChangeAbAttr, p => p.level < 20 || p.getHpRatio() <= 0.25 ? 0 : 1)
      .attr(PostTurnFormChangeAbAttr, p => p.level < 20 || p.getHpRatio() <= 0.25 ? 0 : 1)
      .attr(NoFusionAbilityAbAttr)
      .uncopiable()
      .unreplaceable()
      .unsuppressable()
      .bypassFaint(),
    new Ability(Abilities.DISGUISE, 7)
      .attr(NoTransformAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr)
      // Add BattlerTagType.DISGUISE if the pokemon is in its disguised form
      .conditionalAttr(pokemon => pokemon.formIndex === 0, PostSummonAddBattlerTagAbAttr, BattlerTagType.DISGUISE, 0, false)
      .attr(FormBlockDamageAbAttr,
        (target, user, move) => !!target.getTag(BattlerTagType.DISGUISE) && target.getMoveEffectiveness(user, move) > 0, 0, BattlerTagType.DISGUISE,
        (pokemon, abilityName) => i18next.t("abilityTriggers:disguiseAvoidedDamage", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon), abilityName: abilityName }),
        (pokemon) => toDmgValue(pokemon.getMaxHp() / 8))
      .attr(PostBattleInitFormChangeAbAttr, () => 0)
      .uncopiable()
      .unreplaceable()
      .unsuppressable()
      .bypassFaint()
      .ignorable(),
    new Ability(Abilities.BATTLE_BOND, 7)
      .attr(PostVictoryFormChangeAbAttr, () => 2)
      .attr(PostBattleInitFormChangeAbAttr, () => 1)
      .attr(NoFusionAbilityAbAttr)
      .uncopiable()
      .unreplaceable()
      .unsuppressable()
      .bypassFaint(),
    new Ability(Abilities.POWER_CONSTRUCT, 7)
      .conditionalAttr(pokemon => pokemon.formIndex === 2 || pokemon.formIndex === 4, PostBattleInitFormChangeAbAttr, () => 2)
      .conditionalAttr(pokemon => pokemon.formIndex === 3 || pokemon.formIndex === 5, PostBattleInitFormChangeAbAttr, () => 3)
      .conditionalAttr(pokemon => pokemon.formIndex === 2 || pokemon.formIndex === 4, PostSummonFormChangeAbAttr, p => p.getHpRatio() <= 0.5 || p.getFormKey() === "complete" ? 4 : 2)
      .conditionalAttr(pokemon => pokemon.formIndex === 2 || pokemon.formIndex === 4, PostTurnFormChangeAbAttr, p => p.getHpRatio() <= 0.5 || p.getFormKey() === "complete" ? 4 : 2)
      .conditionalAttr(pokemon => pokemon.formIndex === 3 || pokemon.formIndex === 5, PostSummonFormChangeAbAttr, p => p.getHpRatio() <= 0.5 || p.getFormKey() === "10-complete" ? 5 : 3)
      .conditionalAttr(pokemon => pokemon.formIndex === 3 || pokemon.formIndex === 5, PostTurnFormChangeAbAttr, p => p.getHpRatio() <= 0.5 || p.getFormKey() === "10-complete" ? 5 : 3)
      .attr(NoFusionAbilityAbAttr)
      .uncopiable()
      .unreplaceable()
      .unsuppressable()
      .bypassFaint(),
    new Ability(Abilities.CORROSION, 7)
      .attr(IgnoreTypeStatusEffectImmunityAbAttr, [ StatusEffect.POISON, StatusEffect.TOXIC ], [ PokemonType.STEEL, PokemonType.POISON ])
      .edgeCase(), // Should poison itself with toxic orb.
    new Ability(Abilities.COMATOSE, 7)
      .attr(StatusEffectImmunityAbAttr, ...getNonVolatileStatusEffects())
      .attr(BattlerTagImmunityAbAttr, BattlerTagType.DROWSY)
      .uncopiable()
      .unreplaceable()
      .unsuppressable(),
    new Ability(Abilities.QUEENLY_MAJESTY, 7)
      .attr(FieldPriorityMoveImmunityAbAttr)
      .ignorable(),
    new Ability(Abilities.INNARDS_OUT, 7)
      .attr(PostFaintHPDamageAbAttr)
      .bypassFaint(),
    new Ability(Abilities.DANCER, 7)
      .attr(PostDancingMoveAbAttr),
    new Ability(Abilities.BATTERY, 7)
      .attr(AllyMoveCategoryPowerBoostAbAttr, [ MoveCategory.SPECIAL ], 1.3),
    new Ability(Abilities.FLUFFY, 7)
      .attr(ReceivedMoveDamageMultiplierAbAttr, (target, user, move) => move.doesFlagEffectApply({flag: MoveFlags.MAKES_CONTACT, user, target}), 0.5)
      .attr(ReceivedMoveDamageMultiplierAbAttr, (target, user, move) => user.getMoveType(move) === PokemonType.FIRE, 2)
      .ignorable(),
    new Ability(Abilities.DAZZLING, 7)
      .attr(FieldPriorityMoveImmunityAbAttr)
      .ignorable(),
    new Ability(Abilities.SOUL_HEART, 7)
      .attr(PostKnockOutStatStageChangeAbAttr, Stat.SPATK, 1),
    new Ability(Abilities.TANGLING_HAIR, 7)
      .attr(PostDefendStatStageChangeAbAttr, (target, user, move) => move.doesFlagEffectApply({flag: MoveFlags.MAKES_CONTACT, user, target}), Stat.SPD, -1, false),
    new Ability(Abilities.RECEIVER, 7)
      .attr(CopyFaintedAllyAbilityAbAttr)
      .uncopiable(),
    new Ability(Abilities.POWER_OF_ALCHEMY, 7)
      .attr(CopyFaintedAllyAbilityAbAttr)
      .uncopiable(),
    new Ability(Abilities.BEAST_BOOST, 7)
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
    new Ability(Abilities.RKS_SYSTEM, 7)
      .attr(NoFusionAbilityAbAttr)
      .uncopiable()
      .unreplaceable()
      .unsuppressable(),
    new Ability(Abilities.ELECTRIC_SURGE, 7)
      .attr(PostSummonTerrainChangeAbAttr, TerrainType.ELECTRIC)
      .attr(PostBiomeChangeTerrainChangeAbAttr, TerrainType.ELECTRIC),
    new Ability(Abilities.PSYCHIC_SURGE, 7)
      .attr(PostSummonTerrainChangeAbAttr, TerrainType.PSYCHIC)
      .attr(PostBiomeChangeTerrainChangeAbAttr, TerrainType.PSYCHIC),
    new Ability(Abilities.MISTY_SURGE, 7)
      .attr(PostSummonTerrainChangeAbAttr, TerrainType.MISTY)
      .attr(PostBiomeChangeTerrainChangeAbAttr, TerrainType.MISTY),
    new Ability(Abilities.GRASSY_SURGE, 7)
      .attr(PostSummonTerrainChangeAbAttr, TerrainType.GRASSY)
      .attr(PostBiomeChangeTerrainChangeAbAttr, TerrainType.GRASSY),
    new Ability(Abilities.FULL_METAL_BODY, 7)
      .attr(ProtectStatAbAttr),
    new Ability(Abilities.SHADOW_SHIELD, 7)
      .attr(ReceivedMoveDamageMultiplierAbAttr, (target, user, move) => target.isFullHp(), 0.5),
    new Ability(Abilities.PRISM_ARMOR, 7)
      .attr(ReceivedMoveDamageMultiplierAbAttr, (target, user, move) => target.getMoveEffectiveness(user, move) >= 2, 0.75),
    new Ability(Abilities.NEUROFORCE, 7)
      .attr(MovePowerBoostAbAttr, (user, target, move) => (target?.getMoveEffectiveness(user!, move) ?? 1) >= 2, 1.25),
    new Ability(Abilities.INTREPID_SWORD, 8)
      .attr(PostSummonStatStageChangeAbAttr, [ Stat.ATK ], 1, true),
    new Ability(Abilities.DAUNTLESS_SHIELD, 8)
      .attr(PostSummonStatStageChangeAbAttr, [ Stat.DEF ], 1, true),
    new Ability(Abilities.LIBERO, 8)
      .attr(PokemonTypeChangeAbAttr),
    //.condition((p) => !p.summonData?.abilitiesApplied.includes(Abilities.LIBERO)), //Gen 9 Implementation
    new Ability(Abilities.BALL_FETCH, 8)
      .attr(FetchBallAbAttr)
      .condition(getOncePerBattleCondition(Abilities.BALL_FETCH)),
    new Ability(Abilities.COTTON_DOWN, 8)
      .attr(PostDefendStatStageChangeAbAttr, (target, user, move) => move.category !== MoveCategory.STATUS, Stat.SPD, -1, false, true)
      .bypassFaint(),
    new Ability(Abilities.PROPELLER_TAIL, 8)
      .attr(BlockRedirectAbAttr),
    new Ability(Abilities.MIRROR_ARMOR, 8)
      .attr(ReflectStatStageChangeAbAttr)
      .ignorable(),
    /**
     * Right now, the logic is attached to Surf and Dive moves. Ideally, the post-defend/hit should be an
     * ability attribute but the current implementation of move effects for BattlerTag does not support this- in the case
     * where Cramorant is fainted.
     * @see {@linkcode GulpMissileTagAttr} and {@linkcode GulpMissileTag} for Gulp Missile implementation
     */
    new Ability(Abilities.GULP_MISSILE, 8)
      .attr(NoTransformAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr)
      .unsuppressable()
      .uncopiable()
      .unreplaceable()
      .bypassFaint(),
    new Ability(Abilities.STALWART, 8)
      .attr(BlockRedirectAbAttr),
    new Ability(Abilities.STEAM_ENGINE, 8)
      .attr(PostDefendStatStageChangeAbAttr, (target, user, move) => {
        const moveType = user.getMoveType(move);
        return move.category !== MoveCategory.STATUS
          && (moveType === PokemonType.FIRE || moveType === PokemonType.WATER);
      }, Stat.SPD, 6),
    new Ability(Abilities.PUNK_ROCK, 8)
      .attr(MovePowerBoostAbAttr, (user, target, move) => move.hasFlag(MoveFlags.SOUND_BASED), 1.3)
      .attr(ReceivedMoveDamageMultiplierAbAttr, (target, user, move) => move.hasFlag(MoveFlags.SOUND_BASED), 0.5)
      .ignorable(),
    new Ability(Abilities.SAND_SPIT, 8)
      .attr(PostDefendWeatherChangeAbAttr, WeatherType.SANDSTORM, (target, user, move) => move.category !== MoveCategory.STATUS)
      .bypassFaint(),
    new Ability(Abilities.ICE_SCALES, 8)
      .attr(ReceivedMoveDamageMultiplierAbAttr, (target, user, move) => move.category === MoveCategory.SPECIAL, 0.5)
      .ignorable(),
    new Ability(Abilities.RIPEN, 8)
      .attr(DoubleBerryEffectAbAttr),
    new Ability(Abilities.ICE_FACE, 8)
      .attr(NoTransformAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr)
      // Add BattlerTagType.ICE_FACE if the pokemon is in ice face form
      .conditionalAttr(pokemon => pokemon.formIndex === 0, PostSummonAddBattlerTagAbAttr, BattlerTagType.ICE_FACE, 0, false)
      // When summoned with active HAIL or SNOW, add BattlerTagType.ICE_FACE
      .conditionalAttr(getWeatherCondition(WeatherType.HAIL, WeatherType.SNOW), PostSummonAddBattlerTagAbAttr, BattlerTagType.ICE_FACE, 0)
      // When weather changes to HAIL or SNOW while pokemon is fielded, add BattlerTagType.ICE_FACE
      .attr(PostWeatherChangeAddBattlerTagAttr, BattlerTagType.ICE_FACE, 0, WeatherType.HAIL, WeatherType.SNOW)
      .attr(FormBlockDamageAbAttr,
        (target, user, move) => move.category === MoveCategory.PHYSICAL && !!target.getTag(BattlerTagType.ICE_FACE), 0, BattlerTagType.ICE_FACE,
        (pokemon, abilityName) => i18next.t("abilityTriggers:iceFaceAvoidedDamage", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon), abilityName: abilityName }))
      .attr(PostBattleInitFormChangeAbAttr, () => 0)
      .uncopiable()
      .unreplaceable()
      .unsuppressable()
      .bypassFaint()
      .ignorable(),
    new Ability(Abilities.POWER_SPOT, 8)
      .attr(AllyMoveCategoryPowerBoostAbAttr, [ MoveCategory.SPECIAL, MoveCategory.PHYSICAL ], 1.3),
    new Ability(Abilities.MIMICRY, 8)
      .attr(TerrainEventTypeChangeAbAttr),
    new Ability(Abilities.SCREEN_CLEANER, 8)
      .attr(PostSummonRemoveArenaTagAbAttr, [ ArenaTagType.AURORA_VEIL, ArenaTagType.LIGHT_SCREEN, ArenaTagType.REFLECT ]),
    new Ability(Abilities.STEELY_SPIRIT, 8)
      .attr(UserFieldMoveTypePowerBoostAbAttr, PokemonType.STEEL),
    new Ability(Abilities.PERISH_BODY, 8)
      .attr(PostDefendPerishSongAbAttr, 4)
      .bypassFaint(),
    new Ability(Abilities.WANDERING_SPIRIT, 8)
      .attr(PostDefendAbilitySwapAbAttr)
      .bypassFaint()
      .edgeCase(), //  interacts incorrectly with rock head. It's meant to switch abilities before recoil would apply so that a pokemon with rock head would lose rock head first and still take the recoil
    new Ability(Abilities.GORILLA_TACTICS, 8)
      .attr(GorillaTacticsAbAttr),
    new Ability(Abilities.NEUTRALIZING_GAS, 8)
      .attr(PostSummonAddArenaTagAbAttr, true, ArenaTagType.NEUTRALIZING_GAS, 0)
      .attr(PreLeaveFieldRemoveSuppressAbilitiesSourceAbAttr)
      .uncopiable()
      .attr(NoTransformAbilityAbAttr)
      .bypassFaint(),
    new Ability(Abilities.PASTEL_VEIL, 8)
      .attr(PostSummonUserFieldRemoveStatusEffectAbAttr, StatusEffect.POISON, StatusEffect.TOXIC)
      .attr(UserFieldStatusEffectImmunityAbAttr, StatusEffect.POISON, StatusEffect.TOXIC)
      .ignorable(),
    new Ability(Abilities.HUNGER_SWITCH, 8)
      .attr(PostTurnFormChangeAbAttr, p => p.getFormKey() ? 0 : 1)
      .attr(PostTurnFormChangeAbAttr, p => p.getFormKey() ? 1 : 0)
      .attr(NoTransformAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr)
      .condition((pokemon) => !pokemon.isTerastallized)
      .uncopiable()
      .unreplaceable(),
    new Ability(Abilities.QUICK_DRAW, 8)
      .attr(BypassSpeedChanceAbAttr, 30),
    new Ability(Abilities.UNSEEN_FIST, 8)
      .attr(IgnoreProtectOnContactAbAttr),
    new Ability(Abilities.CURIOUS_MEDICINE, 8)
      .attr(PostSummonClearAllyStatStagesAbAttr),
    new Ability(Abilities.TRANSISTOR, 8)
      .attr(MoveTypePowerBoostAbAttr, PokemonType.ELECTRIC, 1.3),
    new Ability(Abilities.DRAGONS_MAW, 8)
      .attr(MoveTypePowerBoostAbAttr, PokemonType.DRAGON),
    new Ability(Abilities.CHILLING_NEIGH, 8)
      .attr(PostVictoryStatStageChangeAbAttr, Stat.ATK, 1),
    new Ability(Abilities.GRIM_NEIGH, 8)
      .attr(PostVictoryStatStageChangeAbAttr, Stat.SPATK, 1),
    new Ability(Abilities.AS_ONE_GLASTRIER, 8)
      .attr(PostSummonMessageAbAttr, (pokemon: Pokemon) => i18next.t("abilityTriggers:postSummonAsOneGlastrier", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }))
      .attr(PreventBerryUseAbAttr)
      .attr(PostVictoryStatStageChangeAbAttr, Stat.ATK, 1)
      .uncopiable()
      .unreplaceable()
      .unsuppressable(),
    new Ability(Abilities.AS_ONE_SPECTRIER, 8)
      .attr(PostSummonMessageAbAttr, (pokemon: Pokemon) => i18next.t("abilityTriggers:postSummonAsOneSpectrier", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }))
      .attr(PreventBerryUseAbAttr)
      .attr(PostVictoryStatStageChangeAbAttr, Stat.SPATK, 1)
      .uncopiable()
      .unreplaceable()
      .unsuppressable(),
    new Ability(Abilities.LINGERING_AROMA, 9)
      .attr(PostDefendAbilityGiveAbAttr, Abilities.LINGERING_AROMA)
      .bypassFaint(),
    new Ability(Abilities.SEED_SOWER, 9)
      .attr(PostDefendTerrainChangeAbAttr, TerrainType.GRASSY)
      .bypassFaint(),
    new Ability(Abilities.THERMAL_EXCHANGE, 9)
      .attr(PostDefendStatStageChangeAbAttr, (target, user, move) => user.getMoveType(move) === PokemonType.FIRE && move.category !== MoveCategory.STATUS, Stat.ATK, 1)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.BURN)
      .attr(PostSummonHealStatusAbAttr, StatusEffect.BURN)
      .ignorable(),
    new Ability(Abilities.ANGER_SHELL, 9)
      .attr(PostDefendHpGatedStatStageChangeAbAttr, (target, user, move) => move.category !== MoveCategory.STATUS, 0.5, [ Stat.ATK, Stat.SPATK, Stat.SPD ], 1)
      .attr(PostDefendHpGatedStatStageChangeAbAttr, (target, user, move) => move.category !== MoveCategory.STATUS, 0.5, [ Stat.DEF, Stat.SPDEF ], -1)
      .condition(getSheerForceHitDisableAbCondition()),
    new Ability(Abilities.PURIFYING_SALT, 9)
      .attr(StatusEffectImmunityAbAttr)
      .attr(ReceivedTypeDamageMultiplierAbAttr, PokemonType.GHOST, 0.5)
      .ignorable(),
    new Ability(Abilities.WELL_BAKED_BODY, 9)
      .attr(TypeImmunityStatStageChangeAbAttr, PokemonType.FIRE, Stat.DEF, 2)
      .ignorable(),
    new Ability(Abilities.WIND_RIDER, 9)
      .attr(MoveImmunityStatStageChangeAbAttr, (pokemon, attacker, move) => pokemon !== attacker && move.hasFlag(MoveFlags.WIND_MOVE) && move.category !== MoveCategory.STATUS, Stat.ATK, 1)
      .attr(PostSummonStatStageChangeOnArenaAbAttr, ArenaTagType.TAILWIND)
      .ignorable(),
    new Ability(Abilities.GUARD_DOG, 9)
      .attr(PostIntimidateStatStageChangeAbAttr, [ Stat.ATK ], 1, true)
      .attr(ForceSwitchOutImmunityAbAttr)
      .ignorable(),
    new Ability(Abilities.ROCKY_PAYLOAD, 9)
      .attr(MoveTypePowerBoostAbAttr, PokemonType.ROCK),
    new Ability(Abilities.WIND_POWER, 9)
      .attr(PostDefendApplyBattlerTagAbAttr, (target, user, move) => move.hasFlag(MoveFlags.WIND_MOVE), BattlerTagType.CHARGED),
    new Ability(Abilities.ZERO_TO_HERO, 9)
      .uncopiable()
      .unreplaceable()
      .unsuppressable()
      .attr(NoTransformAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr)
      .attr(PostBattleInitFormChangeAbAttr, () => 0)
      .attr(PreSwitchOutFormChangeAbAttr, (pokemon) => !pokemon.isFainted() ? 1 : pokemon.formIndex)
      .bypassFaint(),
    new Ability(Abilities.COMMANDER, 9)
      .attr(CommanderAbAttr)
      .attr(DoubleBattleChanceAbAttr)
      .uncopiable()
      .unreplaceable()
      .edgeCase(), // Encore, Frenzy, and other non-`TURN_END` tags don't lapse correctly on the commanding Pokemon.
    new Ability(Abilities.ELECTROMORPHOSIS, 9)
      .attr(PostDefendApplyBattlerTagAbAttr, (target, user, move) => move.category !== MoveCategory.STATUS, BattlerTagType.CHARGED),
    new Ability(Abilities.PROTOSYNTHESIS, 9)
      .conditionalAttr(getWeatherCondition(WeatherType.SUNNY, WeatherType.HARSH_SUN), PostSummonAddBattlerTagAbAttr, BattlerTagType.PROTOSYNTHESIS, 0, true)
      .attr(PostWeatherChangeAddBattlerTagAttr, BattlerTagType.PROTOSYNTHESIS, 0, WeatherType.SUNNY, WeatherType.HARSH_SUN)
      .uncopiable()
      .attr(NoTransformAbilityAbAttr),
    new Ability(Abilities.QUARK_DRIVE, 9)
      .conditionalAttr(getTerrainCondition(TerrainType.ELECTRIC), PostSummonAddBattlerTagAbAttr, BattlerTagType.QUARK_DRIVE, 0, true)
      .attr(PostTerrainChangeAddBattlerTagAttr, BattlerTagType.QUARK_DRIVE, 0, TerrainType.ELECTRIC)
      .uncopiable()
      .attr(NoTransformAbilityAbAttr),
    new Ability(Abilities.GOOD_AS_GOLD, 9)
      .attr(MoveImmunityAbAttr, (pokemon, attacker, move) => pokemon !== attacker && move.category === MoveCategory.STATUS && ![ MoveTarget.ENEMY_SIDE, MoveTarget.BOTH_SIDES, MoveTarget.USER_SIDE ].includes(move.moveTarget))
      .ignorable(),
    new Ability(Abilities.VESSEL_OF_RUIN, 9)
      .attr(FieldMultiplyStatAbAttr, Stat.SPATK, 0.75)
      .attr(PostSummonMessageAbAttr, (user) => i18next.t("abilityTriggers:postSummonVesselOfRuin", { pokemonNameWithAffix: getPokemonNameWithAffix(user), statName: i18next.t(getStatKey(Stat.SPATK)) }))
      .ignorable(),
    new Ability(Abilities.SWORD_OF_RUIN, 9)
      .attr(FieldMultiplyStatAbAttr, Stat.DEF, 0.75)
      .attr(PostSummonMessageAbAttr, (user) => i18next.t("abilityTriggers:postSummonSwordOfRuin", { pokemonNameWithAffix: getPokemonNameWithAffix(user), statName: i18next.t(getStatKey(Stat.DEF)) })),
    new Ability(Abilities.TABLETS_OF_RUIN, 9)
      .attr(FieldMultiplyStatAbAttr, Stat.ATK, 0.75)
      .attr(PostSummonMessageAbAttr, (user) => i18next.t("abilityTriggers:postSummonTabletsOfRuin", { pokemonNameWithAffix: getPokemonNameWithAffix(user), statName: i18next.t(getStatKey(Stat.ATK)) }))
      .ignorable(),
    new Ability(Abilities.BEADS_OF_RUIN, 9)
      .attr(FieldMultiplyStatAbAttr, Stat.SPDEF, 0.75)
      .attr(PostSummonMessageAbAttr, (user) => i18next.t("abilityTriggers:postSummonBeadsOfRuin", { pokemonNameWithAffix: getPokemonNameWithAffix(user), statName: i18next.t(getStatKey(Stat.SPDEF)) })),
    new Ability(Abilities.ORICHALCUM_PULSE, 9)
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.SUNNY)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.SUNNY)
      .conditionalAttr(getWeatherCondition(WeatherType.SUNNY, WeatherType.HARSH_SUN), StatMultiplierAbAttr, Stat.ATK, 4 / 3),
    new Ability(Abilities.HADRON_ENGINE, 9)
      .attr(PostSummonTerrainChangeAbAttr, TerrainType.ELECTRIC)
      .attr(PostBiomeChangeTerrainChangeAbAttr, TerrainType.ELECTRIC)
      .conditionalAttr(getTerrainCondition(TerrainType.ELECTRIC), StatMultiplierAbAttr, Stat.SPATK, 4 / 3),
    new Ability(Abilities.OPPORTUNIST, 9)
      .attr(StatStageChangeCopyAbAttr),
    new Ability(Abilities.CUD_CHEW, 9)
      .unimplemented(),
    new Ability(Abilities.SHARPNESS, 9)
      .attr(MovePowerBoostAbAttr, (user, target, move) => move.hasFlag(MoveFlags.SLICING_MOVE), 1.5),
    new Ability(Abilities.SUPREME_OVERLORD, 9)
      .attr(VariableMovePowerBoostAbAttr, (user, target, move) => 1 + 0.1 * Math.min(user.isPlayer() ? globalScene.arena.playerFaints : globalScene.currentBattle.enemyFaints, 5))
      .partial(), // Should only boost once, on summon
    new Ability(Abilities.COSTAR, 9)
      .attr(PostSummonCopyAllyStatsAbAttr),
    new Ability(Abilities.TOXIC_DEBRIS, 9)
      .attr(PostDefendApplyArenaTrapTagAbAttr, (target, user, move) => move.category === MoveCategory.PHYSICAL, ArenaTagType.TOXIC_SPIKES)
      .bypassFaint(),
    new Ability(Abilities.ARMOR_TAIL, 9)
      .attr(FieldPriorityMoveImmunityAbAttr)
      .ignorable(),
    new Ability(Abilities.EARTH_EATER, 9)
      .attr(TypeImmunityHealAbAttr, PokemonType.GROUND)
      .ignorable(),
    new Ability(Abilities.MYCELIUM_MIGHT, 9)
      .attr(ChangeMovePriorityAbAttr, (pokemon, move) => move.category === MoveCategory.STATUS, -0.2)
      .attr(PreventBypassSpeedChanceAbAttr, (pokemon, move) => move.category === MoveCategory.STATUS)
      .attr(MoveAbilityBypassAbAttr, (pokemon, move: Move) => move.category === MoveCategory.STATUS),
    new Ability(Abilities.MINDS_EYE, 9)
      .attr(IgnoreTypeImmunityAbAttr, PokemonType.GHOST, [ PokemonType.NORMAL, PokemonType.FIGHTING ])
      .attr(ProtectStatAbAttr, Stat.ACC)
      .attr(IgnoreOpponentStatStagesAbAttr, [ Stat.EVA ])
      .ignorable(),
    new Ability(Abilities.SUPERSWEET_SYRUP, 9)
      .attr(PostSummonStatStageChangeAbAttr, [ Stat.EVA ], -1),
    new Ability(Abilities.HOSPITALITY, 9)
      .attr(PostSummonAllyHealAbAttr, 4, true),
    new Ability(Abilities.TOXIC_CHAIN, 9)
      .attr(PostAttackApplyStatusEffectAbAttr, false, 30, StatusEffect.TOXIC),
    new Ability(Abilities.EMBODY_ASPECT_TEAL, 9)
      .attr(PostTeraFormChangeStatChangeAbAttr, [ Stat.SPD ], 1)
      .uncopiable()
      .unreplaceable() // TODO is this true?
      .attr(NoTransformAbilityAbAttr),
    new Ability(Abilities.EMBODY_ASPECT_WELLSPRING, 9)
      .attr(PostTeraFormChangeStatChangeAbAttr, [ Stat.SPDEF ], 1)
      .uncopiable()
      .unreplaceable()
      .attr(NoTransformAbilityAbAttr),
    new Ability(Abilities.EMBODY_ASPECT_HEARTHFLAME, 9)
      .attr(PostTeraFormChangeStatChangeAbAttr, [ Stat.ATK ], 1)
      .uncopiable()
      .unreplaceable()
      .attr(NoTransformAbilityAbAttr),
    new Ability(Abilities.EMBODY_ASPECT_CORNERSTONE, 9)
      .attr(PostTeraFormChangeStatChangeAbAttr, [ Stat.DEF ], 1)
      .uncopiable()
      .unreplaceable()
      .attr(NoTransformAbilityAbAttr),
    new Ability(Abilities.TERA_SHIFT, 9)
      .attr(PostSummonFormChangeAbAttr, p => p.getFormKey() ? 0 : 1)
      .uncopiable()
      .unreplaceable()
      .unsuppressable()
      .attr(NoTransformAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr),
    new Ability(Abilities.TERA_SHELL, 9)
      .attr(FullHpResistTypeAbAttr)
      .uncopiable()
      .unreplaceable()
      .ignorable(),
    new Ability(Abilities.TERAFORM_ZERO, 9)
      .attr(ClearWeatherAbAttr, [ WeatherType.SUNNY, WeatherType.RAIN, WeatherType.SANDSTORM, WeatherType.HAIL, WeatherType.SNOW, WeatherType.FOG, WeatherType.HEAVY_RAIN, WeatherType.HARSH_SUN, WeatherType.STRONG_WINDS ])
      .attr(ClearTerrainAbAttr, [ TerrainType.MISTY, TerrainType.ELECTRIC, TerrainType.GRASSY, TerrainType.PSYCHIC ])
      .uncopiable()
      .unreplaceable()
      .condition(getOncePerBattleCondition(Abilities.TERAFORM_ZERO)),
    new Ability(Abilities.POISON_PUPPETEER, 9)
      .uncopiable()
      .unreplaceable() // TODO is this true?
      .attr(ConfusionOnStatusEffectAbAttr, StatusEffect.POISON, StatusEffect.TOXIC)
  );
}
