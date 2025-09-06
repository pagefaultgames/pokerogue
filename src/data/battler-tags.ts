import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import Overrides from "#app/overrides";
import { CommonBattleAnim, MoveChargeAnim } from "#data/battle-anims";
import { allAbilities, allMoves } from "#data/data-lists";
import { SpeciesFormChangeAbilityTrigger } from "#data/form-change-triggers";
import { getStatusEffectHealText } from "#data/status-effect";
import { TerrainType } from "#data/terrain";
import { AbilityId } from "#enums/ability-id";
import type { BattlerIndex } from "#enums/battler-index";
import { BattlerTagLapseType } from "#enums/battler-tag-lapse-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { HitResult } from "#enums/hit-result";
import { ChargeAnim, CommonAnim } from "#enums/move-anims-common";
import { MoveCategory } from "#enums/move-category";
import { MoveFlags } from "#enums/move-flags";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { MoveUseMode } from "#enums/move-use-mode";
import { PokemonAnimType } from "#enums/pokemon-anim-type";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { type BattleStat, EFFECTIVE_STATS, type EffectiveStat, getStatKey, Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { WeatherType } from "#enums/weather-type";
import type { Pokemon } from "#field/pokemon";
import { applyMoveAttrs } from "#moves/apply-attrs";
import { invalidEncoreMoves } from "#moves/invalid-moves";
import type { Move } from "#moves/move";
import type { MoveEffectPhase } from "#phases/move-effect-phase";
import type { MovePhase } from "#phases/move-phase";
import type { StatStageChangeCallback } from "#phases/stat-stage-change-phase";
import i18next from "#plugins/i18n";
import type {
  AbilityBattlerTagType,
  BattlerTagData,
  ContactSetStatusProtectedTagType,
  ContactStatStageChangeProtectedTagType,
  CritStageBoostTagType,
  DamageProtectedTagType,
  EndureTagType,
  HighestStatBoostTagType,
  MoveRestrictionBattlerTagType,
  ProtectionBattlerTagType,
  RemovedTypeTagType,
  SemiInvulnerableTagType,
  TrappingBattlerTagType,
  TypeBoostTagType,
} from "#types/battler-tags";
import type { Mutable } from "#types/type-helpers";
import { BooleanHolder, coerceArray, getFrameMs, isNullOrUndefined, NumberHolder, toDmgValue } from "#utils/common";
import { toCamelCase } from "#utils/strings";

/**
 * @module
 * BattlerTags are used to represent semi-persistent effects that can be attached to a Pokemon.
 * Note that before serialization, a new tag object is created, and then `loadTag` is called on the
 * tag with the object that was serialized.
 *
 * This means it is straightforward to avoid serializing fields.
 * Fields that are not set in the constructor and not set in `loadTag` will thus not be serialized.
 *
 * Any battler tag that can persist across sessions must extend SerializableBattlerTag in its class definition signature.
 * Only tags that persist across waves (meaning their effect can last >1 turn) should be considered
 * serializable.
 *
 * Serializable battler tags have strict requirements for their fields.
 * Properties that are not necessary to reconstruct the tag must not be serialized. This can be avoided
 * by using a private property. If access to the property is needed outside of the class, then
 * a getter (and potentially, a setter) should be used instead.
 *
 * If a property that is intended to be private must be serialized, then it should instead
 * be declared as a public readonly propety. Then, in the `loadTag` method (or any method inside the class that needs to adjust the property)
 * use `(this as Mutable<this>).propertyName = value;`
 * These rules ensure that Typescript is aware of the shape of the serialized version of the class.
 *
 * If any new serializable fields *are* added, then the class *must* override the
 * `loadTag` method to set the new fields. Its signature *must* match the example below:
 * ```
 * class ExampleTag extends SerializableBattlerTag {
 *   // Example, if we add 2 new fields that should be serialized:
 *   public a: string;
 *   public b: number;
 *   // Then we must also define a loadTag method with one of the following signatures
 *   public override loadTag(source: BaseBattlerTag & Pick<ExampleTag, "tagType" | "a" | "b"): void;
 *   public override loadTag<const T extends this>(source: BaseBattlerTag & Pick<T, "tagType" | "a" | "b">): void;
 * }
 * ```
 * Notes
 * - If the class has any subclasses, then the second form of `loadTag` *must* be used.
 */

/** Interface containing the serializable fields of BattlerTag */
interface BaseBattlerTag {
  /** The tag's remaining duration */
  turnCount: number;
  /** The {@linkcode MoveId} that created this tag, or `undefined` if not set by a move */
  sourceMove?: MoveId;
  /** The {@linkcode Pokemon.id | PID} of the Pokemon that added this tag, or `undefined` if not set by a pokemon */
  sourceId?: number;
}

/**
 * A {@linkcode BattlerTag} represents a semi-persistent effect that can be attached to a {@linkcode Pokemon}.
 * Tags can trigger various effects throughout a turn, and are cleared on switching out
 * or through their respective {@linkcode BattlerTag.lapse | lapse} methods.
 */
export class BattlerTag implements BaseBattlerTag {
  public readonly tagType: BattlerTagType;

  public turnCount: number;
  public sourceMove?: MoveId;
  public sourceId?: number;

  //#region non-serializable fields
  // Fields that should never be serialized, as they must not change after instantiation
  #isBatonPassable = false;
  public get isBatonPassable(): boolean {
    return this.#isBatonPassable;
  }

  #lapseTypes: readonly [BattlerTagLapseType, ...BattlerTagLapseType[]];
  public get lapseTypes(): readonly BattlerTagLapseType[] {
    return this.#lapseTypes;
  }
  //#endregion non-serializable fields

  constructor(
    tagType: BattlerTagType,
    lapseType: BattlerTagLapseType | [BattlerTagLapseType, ...BattlerTagLapseType[]],
    turnCount: number,
    sourceMove?: MoveId,
    sourceId?: number,
    isBatonPassable = false,
  ) {
    this.tagType = tagType;
    this.#lapseTypes = coerceArray(lapseType);
    this.turnCount = turnCount;
    // We intentionally don't want to set source move to `MoveId.NONE` here, so a raw boolean comparison is OK.
    if (sourceMove) {
      this.sourceMove = sourceMove;
    }
    this.sourceId = sourceId;
    this.#isBatonPassable = isBatonPassable;
  }

  canAdd(_pokemon: Pokemon): boolean {
    return true;
  }

  /**
   * Apply effects that occur when the tag is added to a {@linkcode Pokemon}
   * @param _pokemon - The {@linkcode Pokemon} the tag was added to
   */
  onAdd(_pokemon: Pokemon): void {}

  onRemove(_pokemon: Pokemon): void {}

  onOverlap(_pokemon: Pokemon): void {}

  /**
   * Tick down this {@linkcode BattlerTag}'s duration.
   * @param _pokemon - The {@linkcode Pokemon} whom this tag belongs to.
   * Unused by default but can be used by subclasses.
   * @param _lapseType - The {@linkcode BattlerTagLapseType} being lapsed.
   * Unused by default but can be used by subclasses.
   * @returns `true` if the tag should be kept (`turnCount` > 0`)
   */
  lapse(_pokemon: Pokemon, _lapseType: BattlerTagLapseType): boolean {
    return --this.turnCount > 0;
  }

  getDescriptor(): string {
    return "";
  }

  isSourceLinked(): boolean {
    return false;
  }

  getMoveName(): string | null {
    return this.sourceMove ? allMoves[this.sourceMove].name : null;
  }

  /**
   * Load the data for a given {@linkcode BattlerTag} or JSON representation thereof.
   * Should be inherited from by any battler tag with custom attributes.
   * @param source - An object containing the fields needed to reconstruct this tag.
   */
  public loadTag<const T extends this>(source: BaseBattlerTag & Pick<T, "tagType">): void {
    this.turnCount = source.turnCount;
    this.sourceMove = source.sourceMove;
    this.sourceId = source.sourceId;
  }

  /**
   * Helper function that retrieves the source Pokemon object
   * @returns The source {@linkcode Pokemon}, or `null` if none is found
   */
  public getSourcePokemon(): Pokemon | null {
    return globalScene.getPokemonById(this.sourceId);
  }
}

export class SerializableBattlerTag extends BattlerTag {
  /** Nonexistent, dummy field to allow typescript to distinguish this class from `BattlerTag` */
  private declare __SerializableBattlerTag: never;
}

/**
 * Interface for a generic serializable battler tag, i.e. one that does not have a
 * dedicated subclass.
 *
 * @remarks
 * Used to ensure type safety when serializing battler tags,
 * allowing typescript to properly infer the type of the tag.
 * @see BattlerTagTypeMap
 */
interface GenericSerializableBattlerTag<T extends BattlerTagType> extends SerializableBattlerTag {
  tagType: T;
}

/**
 * Base class for tags that restrict the usage of moves. This effect is generally referred to as "disabling" a move
 * in-game (not to be confused with {@linkcode MoveId.DISABLE}).
 *
 * Descendants can override {@linkcode isMoveRestricted} to restrict moves that
 * match a condition. A restricted move gets cancelled before it is used.
 * Players and enemies should not be allowed to select restricted moves.
 * @todo Require descendant subclasses to inherit a `PRE_MOVE` lapse type
 */
export abstract class MoveRestrictionBattlerTag extends SerializableBattlerTag {
  public declare readonly tagType: MoveRestrictionBattlerTagType;
  override lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    if (lapseType !== BattlerTagLapseType.PRE_MOVE) {
      return super.lapse(pokemon, lapseType);
    }

    // Cancel the affected pokemon's selected move
    const phase = globalScene.phaseManager.getCurrentPhase() as MovePhase;
    const move = phase.move;

    if (this.isMoveRestricted(move.moveId, pokemon)) {
      if (this.interruptedText(pokemon, move.moveId)) {
        globalScene.phaseManager.queueMessage(this.interruptedText(pokemon, move.moveId));
      }
      phase.cancel();
    }

    return true;
  }

  /**
   * Determine whether a move's usage is restricted by this tag
   *
   * @param move - The {@linkcode MoveId} being checked
   * @param user - The {@linkcode Pokemon} involved
   * @returns `true` if the move is restricted by this tag, otherwise `false`.
   */
  public abstract isMoveRestricted(move: MoveId, user?: Pokemon): boolean;

  /**
   * Check if this tag is restricting a move based on a user's decisions during the target selection phase
   *
   * @param _move - {@linkcode MoveId} to check restriction for
   * @param _user - The user of the move
   * @param _target - The pokemon targeted by the move
   * @returns Whether the move is restricted by this tag
   */
  isMoveTargetRestricted(_move: MoveId, _user: Pokemon, _target: Pokemon): boolean {
    return false;
  }

  /**
   * Get the text to display when the player attempts to select a move that is restricted by this tag.
   *
   * @param pokemon - The pokemon for which the player is attempting to select the restricted move
   * @param move - The {@linkcode MoveId | ID} of the Move that is having its selection denied
   * @returns The text to display when the player attempts to select the restricted move
   */
  abstract selectionDeniedText(pokemon: Pokemon, move: MoveId): string;

  /**
   * Gets the text to display when a move's execution is prevented as a result of the restriction.
   * Because restriction effects also prevent selection of the move, this situation can only arise if a
   * pokemon first selects a move, then gets outsped by a pokemon using a move that restricts the selected move.
   *
   * @param _pokemon - The pokemon attempting to use the restricted move
   * @param _move - The {@linkcode MoveId | ID} of the move being interrupted
   * @returns The text to display when the move is interrupted
   */
  interruptedText(_pokemon: Pokemon, _move: MoveId): string {
    return "";
  }
}

/**
 * Tag representing the "Throat Chop" effect. Pokemon with this tag cannot use sound-based moves.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Throat_Chop_(move) | Throat Chop}
 * @sealed
 */
export class ThroatChoppedTag extends MoveRestrictionBattlerTag {
  public override readonly tagType = BattlerTagType.THROAT_CHOPPED;
  constructor() {
    super(
      BattlerTagType.THROAT_CHOPPED,
      [BattlerTagLapseType.TURN_END, BattlerTagLapseType.PRE_MOVE],
      2,
      MoveId.THROAT_CHOP,
    );
  }

  /**
   * Check if a move is restricted by Throat Chop.
   * @param move - The {@linkcode MoveId | ID } of the move to check for sound-based restriction
   * @returns Whether the move is sound based
   */
  override isMoveRestricted(move: MoveId): boolean {
    return allMoves[move].hasFlag(MoveFlags.SOUND_BASED);
  }

  /**
   * Shows a message when the player attempts to select a move that is restricted by Throat Chop.
   * @param _pokemon - The {@linkcode Pokemon} that is attempting to select the restricted move
   * @param move - The {@linkcode MoveId | move} that is being restricted
   * @returns The message to display when the player attempts to select the restricted move
   */
  override selectionDeniedText(_pokemon: Pokemon, move: MoveId): string {
    return i18next.t("battle:moveCannotBeSelected", {
      moveName: allMoves[move].name,
    });
  }

  /**
   * Shows a message when a move is interrupted by Throat Chop.
   * @param pokemon - The interrupted {@linkcode Pokemon}
   * @param _move - The {@linkcode MoveId | ID } of the move that was interrupted
   * @returns The message to display when the move is interrupted
   */
  override interruptedText(pokemon: Pokemon, _move: MoveId): string {
    return i18next.t("battle:throatChopInterruptedMove", {
      pokemonName: getPokemonNameWithAffix(pokemon),
    });
  }
}

/**
 * Tag representing the "disabling" effect performed by {@linkcode MoveId.DISABLE} and {@linkcode AbilityId.CURSED_BODY}.
 * When the tag is added, the last-used move of the tag holder is set as the disabled move.
 *
 * @sealed
 */
export class DisabledTag extends MoveRestrictionBattlerTag {
  public override readonly tagType = BattlerTagType.DISABLED;
  /** The move being disabled. Gets set when {@linkcode onAdd} is called for this tag. */
  public readonly moveId: MoveId = MoveId.NONE;

  constructor(sourceId: number) {
    super(
      BattlerTagType.DISABLED,
      [BattlerTagLapseType.PRE_MOVE, BattlerTagLapseType.TURN_END],
      4,
      MoveId.DISABLE,
      sourceId,
    );
  }

  override isMoveRestricted(move: MoveId): boolean {
    return move === this.moveId;
  }

  /**
   * Attempt to disable the target's last move by setting this tag's {@linkcode moveId}
   * and showing a message.
   */
  override onAdd(pokemon: Pokemon): void {
    // Disable fails against struggle or an empty move history
    // TODO: Confirm if this is redundant given Disable/Cursed Body's disable conditions
    const move = pokemon.getLastNonVirtualMove();
    if (isNullOrUndefined(move) || move.move === MoveId.STRUGGLE) {
      return;
    }

    super.onAdd(pokemon);
    (this as Mutable<this>).moveId = move.move;

    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:disabledOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        moveName: allMoves[this.moveId].name,
      }),
    );
  }

  override onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);

    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:disabledLapse", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        moveName: allMoves[this.moveId].name,
      }),
    );
  }

  override selectionDeniedText(_pokemon: Pokemon, move: MoveId): string {
    return i18next.t("battle:moveDisabled", { moveName: allMoves[move].name });
  }

  /**
   * @param pokemon - {@linkcode Pokemon} attempting to use the restricted move
   * @param move - {@linkcode MoveId | ID} of the move being interrupted
   * @returns The text to display when the move is interrupted
   */
  override interruptedText(pokemon: Pokemon, move: MoveId): string {
    return i18next.t("battle:disableInterruptedMove", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      moveName: allMoves[move].name,
    });
  }

  public override loadTag(source: BaseBattlerTag & Pick<DisabledTag, "tagType" | "moveId">): void {
    super.loadTag(source);
    (this as Mutable<this>).moveId = source.moveId;
  }
}

/**
 * Tag used by Gorilla Tactics to restrict the user to using only one move.
 *
 * @sealed
 */
export class GorillaTacticsTag extends MoveRestrictionBattlerTag {
  public override readonly tagType = BattlerTagType.GORILLA_TACTICS;
  /** ID of the move that the user is locked into using*/
  public readonly moveId: MoveId = MoveId.NONE;
  constructor() {
    super(BattlerTagType.GORILLA_TACTICS, BattlerTagLapseType.CUSTOM, 0);
  }

  override isMoveRestricted(move: MoveId): boolean {
    return move !== this.moveId;
  }

  /**
   * Ensures that move history exists on {@linkcode Pokemon} and has a valid move to lock into.
   * @param pokemon - The {@linkcode Pokemon} to add the tag to
   * @returns `true` if the tag can be added
   */
  override canAdd(pokemon: Pokemon): boolean {
    // Choice items ignore struggle, so Gorilla Tactics should too
    const lastSelectedMove = pokemon.getLastNonVirtualMove();
    return !isNullOrUndefined(lastSelectedMove) && lastSelectedMove.move !== MoveId.STRUGGLE;
  }

  /**
   * Sets this tag's {@linkcode moveId} and increases the user's Attack by 50%.
   * @param pokemon - The {@linkcode Pokemon} to add the tag to
   */
  override onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    // Bang is justified as tag is not added if prior move doesn't exist
    (this as Mutable<GorillaTacticsTag>).moveId = pokemon.getLastNonVirtualMove()!.move;
    pokemon.setStat(Stat.ATK, pokemon.getStat(Stat.ATK, false) * 1.5, false);
  }

  /**
   * Loads the Gorilla Tactics Battler Tag along with its unique class variable moveId
   * @param source - Object containing the fields needed to reconstruct this tag.
   */
  public override loadTag(source: BaseBattlerTag & Pick<GorillaTacticsTag, "tagType" | "moveId">): void {
    super.loadTag(source);
    (this as Mutable<GorillaTacticsTag>).moveId = source.moveId;
  }

  /**
   * Return the text displayed when a move is restricted.
   * @param pokemon - The {@linkcode Pokemon} with this tag.
   * @returns A string containing the text to display when the move is denied
   */
  override selectionDeniedText(pokemon: Pokemon): string {
    return i18next.t("battle:canOnlyUseMove", {
      moveName: allMoves[this.moveId].name,
      pokemonName: getPokemonNameWithAffix(pokemon),
    });
  }
}

/**
 * BattlerTag that represents the "recharge" effects of moves like Hyper Beam.
 */
export class RechargingTag extends SerializableBattlerTag {
  public override readonly tagType = BattlerTagType.RECHARGING;
  constructor(sourceMove: MoveId) {
    super(BattlerTagType.RECHARGING, [BattlerTagLapseType.PRE_MOVE, BattlerTagLapseType.TURN_END], 2, sourceMove);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    // Queue a placeholder move for the Pokemon to "use" next turn.
    pokemon.pushMoveQueue({ move: MoveId.NONE, targets: [], useMode: MoveUseMode.NORMAL });
  }

  /** Cancels the source's move this turn and queues a "__ must recharge!" message */
  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    if (lapseType === BattlerTagLapseType.PRE_MOVE) {
      globalScene.phaseManager.queueMessage(
        i18next.t("battlerTags:rechargingLapse", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        }),
      );
      (globalScene.phaseManager.getCurrentPhase() as MovePhase).cancel();
      pokemon.getMoveQueue().shift();
    }
    return super.lapse(pokemon, lapseType);
  }
}

/**
 * BattlerTag representing the "charge phase" of Beak Blast.
 * Pokemon with this tag will inflict BURN status on any attacker that makes contact.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Beak_Blast_(move) | Beak Blast}
 */
export class BeakBlastChargingTag extends BattlerTag {
  public override readonly tagType = BattlerTagType.BEAK_BLAST_CHARGING;
  public declare readonly sourceMove: MoveId.BEAK_BLAST;
  constructor() {
    super(
      BattlerTagType.BEAK_BLAST_CHARGING,
      [BattlerTagLapseType.PRE_MOVE, BattlerTagLapseType.TURN_END, BattlerTagLapseType.AFTER_HIT],
      1,
      MoveId.BEAK_BLAST,
    );
  }

  onAdd(pokemon: Pokemon): void {
    // Play Beak Blast's charging animation
    new MoveChargeAnim(ChargeAnim.BEAK_BLAST_CHARGING, this.sourceMove, pokemon).play();

    // Queue Beak Blast's header message
    globalScene.phaseManager.queueMessage(
      i18next.t("moveTriggers:startedHeatingUpBeak", {
        pokemonName: getPokemonNameWithAffix(pokemon),
      }),
    );
  }

  /**
   * Inflicts `BURN` status on attackers that make contact, and causes this tag
   * to be removed after the source makes a move (or the turn ends, whichever comes first)
   * @param pokemon - The owner of this tag
   * @param lapseType - The type of functionality invoked in battle
   * @returns `true` if invoked with the `AFTER_HIT` lapse type
   */
  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    if (lapseType === BattlerTagLapseType.AFTER_HIT) {
      const phaseData = getMoveEffectPhaseData(pokemon);
      if (
        phaseData?.move.doesFlagEffectApply({
          flag: MoveFlags.MAKES_CONTACT,
          user: phaseData.attacker,
          target: pokemon,
        })
      ) {
        phaseData.attacker.trySetStatus(StatusEffect.BURN, pokemon);
      }
      return true;
    }
    return super.lapse(pokemon, lapseType);
  }
}

/**
 * BattlerTag implementing Shell Trap's pre-move behavior.
 * Pokemon with this tag will act immediately after being hit by a physical move.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Shell_Trap_(move) | Shell Trap}
 */
export class ShellTrapTag extends BattlerTag {
  public override readonly tagType = BattlerTagType.SHELL_TRAP;
  public activated = false;

  constructor() {
    super(BattlerTagType.SHELL_TRAP, [BattlerTagLapseType.TURN_END, BattlerTagLapseType.AFTER_HIT], 1);
  }

  onAdd(pokemon: Pokemon): void {
    globalScene.phaseManager.queueMessage(
      i18next.t("moveTriggers:setUpShellTrap", {
        pokemonName: getPokemonNameWithAffix(pokemon),
      }),
    );
  }

  /**
   * "Activates" the shell trap, causing the tag owner to move next.
   * @param pokemon - The owner of this tag
   * @param lapseType - The type of functionality invoked in battle
   * @returns `true` if invoked with the `AFTER_HIT` lapse type
   */
  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    if (lapseType === BattlerTagLapseType.AFTER_HIT) {
      const phaseData = getMoveEffectPhaseData(pokemon);

      // Trap should only be triggered by opponent's Physical moves
      if (phaseData?.move.category === MoveCategory.PHYSICAL && pokemon.isOpponent(phaseData.attacker)) {
        const shellTrapPhaseIndex = globalScene.phaseManager.phaseQueue.findIndex(
          phase => phase.is("MovePhase") && phase.pokemon === pokemon,
        );
        const firstMovePhaseIndex = globalScene.phaseManager.phaseQueue.findIndex(phase => phase.is("MovePhase"));

        // Only shift MovePhase timing if it's not already next up
        if (shellTrapPhaseIndex !== -1 && shellTrapPhaseIndex !== firstMovePhaseIndex) {
          const shellTrapMovePhase = globalScene.phaseManager.phaseQueue.splice(shellTrapPhaseIndex, 1)[0];
          globalScene.phaseManager.prependToPhase(shellTrapMovePhase, "MovePhase");
        }

        this.activated = true;
      }

      return true;
    }

    return super.lapse(pokemon, lapseType);
  }
}

export class TrappedTag extends SerializableBattlerTag {
  public declare readonly tagType: TrappingBattlerTagType;
  constructor(
    tagType: BattlerTagType,
    lapseType: BattlerTagLapseType,
    turnCount: number,
    sourceMove: MoveId,
    sourceId: number,
  ) {
    super(tagType, lapseType, turnCount, sourceMove, sourceId, true);
  }

  canAdd(pokemon: Pokemon): boolean {
    const source = this.getSourcePokemon();
    if (!source) {
      console.warn(`Failed to get source Pokemon for TrappedTag canAdd; id: ${this.sourceId}`);
      return false;
    }
    if (this.sourceMove && allMoves[this.sourceMove]?.hitsSubstitute(source, pokemon)) {
      return false;
    }
    const isGhost = pokemon.isOfType(PokemonType.GHOST);
    const isTrapped = pokemon.getTag(TrappedTag);

    return !isTrapped && !isGhost;
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    globalScene.phaseManager.queueMessage(this.getTrapMessage(pokemon));
  }

  onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);

    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:trappedOnRemove", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        moveName: this.getMoveName(),
      }),
    );
  }

  getDescriptor(): string {
    return i18next.t("battlerTags:trappedDesc");
  }

  isSourceLinked(): boolean {
    return true;
  }

  getTrapMessage(pokemon: Pokemon): string {
    return i18next.t("battlerTags:trappedOnAdd", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
    });
  }
}

/**
 * BattlerTag implementing No Retreat's trapping effect.
 * This is treated separately from other trapping effects to prevent
 * Ghost-type Pokemon from being able to reuse the move.
 */
class NoRetreatTag extends TrappedTag {
  public override readonly tagType = BattlerTagType.NO_RETREAT;
  constructor(sourceId: number) {
    super(BattlerTagType.NO_RETREAT, BattlerTagLapseType.CUSTOM, 0, MoveId.NO_RETREAT, sourceId);
  }

  /** overrides {@linkcode TrappedTag.apply}, removing the Ghost-type condition */
  canAdd(pokemon: Pokemon): boolean {
    return !pokemon.getTag(TrappedTag);
  }
}

/**
 * BattlerTag that represents the {@link https://bulbapedia.bulbagarden.net/wiki/Flinch Flinch} status condition
 */
export class FlinchedTag extends BattlerTag {
  public override readonly tagType = BattlerTagType.FLINCHED;
  constructor(sourceMove: MoveId) {
    super(BattlerTagType.FLINCHED, [BattlerTagLapseType.PRE_MOVE, BattlerTagLapseType.TURN_END], 1, sourceMove);
  }

  /**
   * Cancels the flinched Pokemon's currently used move this turn if called mid-execution, or removes the tag at end of turn.
   * @param pokemon - The {@linkcode Pokemon} with this tag.
   * @param lapseType - The {@linkcode BattlerTagLapseType | lapse type} used for this function call.
   * @returns Whether the tag should remain active.
   */
  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    if (lapseType === BattlerTagLapseType.PRE_MOVE) {
      (globalScene.phaseManager.getCurrentPhase() as MovePhase).cancel();
      globalScene.phaseManager.queueMessage(
        i18next.t("battlerTags:flinchedLapse", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        }),
      );
      applyAbAttrs("FlinchEffectAbAttr", { pokemon });
      return true;
    }

    return super.lapse(pokemon, lapseType);
  }

  getDescriptor(): string {
    return i18next.t("battlerTags:flinchedDesc");
  }
}

export class InterruptedTag extends BattlerTag {
  public override readonly tagType = BattlerTagType.INTERRUPTED;
  constructor(sourceMove: MoveId) {
    super(BattlerTagType.INTERRUPTED, BattlerTagLapseType.PRE_MOVE, 0, sourceMove);
  }

  canAdd(pokemon: Pokemon): boolean {
    return !!pokemon.getTag(BattlerTagType.FLYING);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    pokemon.getMoveQueue().shift();
    pokemon.pushMoveHistory({
      move: MoveId.NONE,
      result: MoveResult.OTHER,
      targets: [],
      useMode: MoveUseMode.NORMAL,
    });
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    (globalScene.phaseManager.getCurrentPhase() as MovePhase).cancel();
    return super.lapse(pokemon, lapseType);
  }
}

/**
 * BattlerTag that represents the {@link https://bulbapedia.bulbagarden.net/wiki/Confusion_(status_condition) Confusion} status condition
 */
export class ConfusedTag extends SerializableBattlerTag {
  public override readonly tagType = BattlerTagType.CONFUSED;
  constructor(turnCount: number, sourceMove: MoveId) {
    super(BattlerTagType.CONFUSED, BattlerTagLapseType.MOVE, turnCount, sourceMove, undefined, true);
  }

  canAdd(pokemon: Pokemon): boolean {
    const blockedByTerrain = pokemon.isGrounded() && globalScene.arena.terrain?.terrainType === TerrainType.MISTY;
    if (blockedByTerrain) {
      pokemon.queueStatusImmuneMessage(false, TerrainType.MISTY);
      return false;
    }
    return true;
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    globalScene.phaseManager.unshiftNew("CommonAnimPhase", pokemon.getBattlerIndex(), undefined, CommonAnim.CONFUSION);
    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:confusedOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
  }

  onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);

    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:confusedOnRemove", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
  }

  onOverlap(pokemon: Pokemon): void {
    super.onOverlap(pokemon);

    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:confusedOnOverlap", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const shouldLapse = lapseType !== BattlerTagLapseType.CUSTOM && super.lapse(pokemon, lapseType);

    if (!shouldLapse) {
      return false;
    }

    const phaseManager = globalScene.phaseManager;

    phaseManager.queueMessage(
      i18next.t("battlerTags:confusedLapse", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
    phaseManager.unshiftNew("CommonAnimPhase", pokemon.getBattlerIndex(), undefined, CommonAnim.CONFUSION);

    // 1/3 chance of hitting self with a 40 base power move
    if (pokemon.randBattleSeedInt(3) === 0 || Overrides.CONFUSION_ACTIVATION_OVERRIDE === true) {
      const atk = pokemon.getEffectiveStat(Stat.ATK);
      const def = pokemon.getEffectiveStat(Stat.DEF);
      const damage = toDmgValue(
        ((((2 * pokemon.level) / 5 + 2) * 40 * atk) / def / 50 + 2) * (pokemon.randBattleSeedIntRange(85, 100) / 100),
      );
      // Intentionally don't increment rage fist's hitCount
      phaseManager.queueMessage(i18next.t("battlerTags:confusedLapseHurtItself"));
      pokemon.damageAndUpdate(damage, { result: HitResult.CONFUSION });
      (phaseManager.getCurrentPhase() as MovePhase).cancel();
    }

    return true;
  }

  getDescriptor(): string {
    return i18next.t("battlerTags:confusedDesc");
  }
}

/**
 * Tag applied to the {@linkcode Move.DESTINY_BOND} user.
 * @see {@linkcode apply}
 */
export class DestinyBondTag extends SerializableBattlerTag {
  public readonly tagType = BattlerTagType.DESTINY_BOND;
  constructor(sourceMove: MoveId, sourceId: number) {
    super(BattlerTagType.DESTINY_BOND, BattlerTagLapseType.PRE_MOVE, 1, sourceMove, sourceId, true);
  }

  /**
   * Lapses either before the user's move and does nothing
   * or after receiving fatal damage. When the damage is fatal,
   * the attacking Pokemon is taken down as well, unless it's a boss.
   *
   * @param pokemon - The Pokemon that is attacking the Destiny Bond user.
   * @param lapseType - CUSTOM or PRE_MOVE
   * @returns `false` if the tag source fainted or one turn has passed since the application
   */
  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    if (lapseType !== BattlerTagLapseType.CUSTOM) {
      return super.lapse(pokemon, lapseType);
    }

    const source = this.getSourcePokemon();
    if (!source) {
      console.warn(`Failed to get source Pokemon for DestinyBondTag lapse; id: ${this.sourceId}`);
      return false;
    }

    // Destiny bond stays active until the user faints
    if (!source.isFainted()) {
      return true;
    }

    // Don't kill allies or opposing bosses.
    if (source.getAlly() === pokemon) {
      return false;
    }

    if (pokemon.isBossImmune()) {
      globalScene.phaseManager.queueMessage(
        i18next.t("battlerTags:destinyBondLapseIsBoss", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        }),
      );
      return false;
    }

    // Drag the foe down with the user
    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:destinyBondLapse", {
        pokemonNameWithAffix: getPokemonNameWithAffix(source),
        pokemonNameWithAffix2: getPokemonNameWithAffix(pokemon),
      }),
    );
    pokemon.damageAndUpdate(pokemon.hp, { result: HitResult.INDIRECT_KO, ignoreSegments: true });
    return false;
  }
}

// Technically serializable as in a double battle, a pokemon could be infatuated by its ally
export class InfatuatedTag extends SerializableBattlerTag {
  public override readonly tagType = BattlerTagType.INFATUATED;
  constructor(sourceMove: number, sourceId: number) {
    super(BattlerTagType.INFATUATED, BattlerTagLapseType.MOVE, 1, sourceMove, sourceId);
  }

  canAdd(pokemon: Pokemon): boolean {
    const source = this.getSourcePokemon();
    if (!source) {
      console.warn(`Failed to get source Pokemon for InfatuatedTag canAdd; id: ${this.sourceId}`);
      return false;
    }

    return pokemon.isOppositeGender(source);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:infatuatedOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        sourcePokemonName: getPokemonNameWithAffix(this.getSourcePokemon()!), // Tag not added + console warns if no source
      }),
    );
  }

  onOverlap(pokemon: Pokemon): void {
    super.onOverlap(pokemon);

    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:infatuatedOnOverlap", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);

    if (!ret) {
      return false;
    }

    const source = this.getSourcePokemon();
    if (!source) {
      console.warn(`Failed to get source Pokemon for InfatuatedTag lapse; id: ${this.sourceId}`);
      return false;
    }

    const phaseManager = globalScene.phaseManager;
    phaseManager.queueMessage(
      i18next.t("battlerTags:infatuatedLapse", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        sourcePokemonName: getPokemonNameWithAffix(globalScene.getPokemonById(this.sourceId!) ?? undefined), // TODO: is that bang correct?
      }),
    );
    phaseManager.unshiftNew("CommonAnimPhase", pokemon.getBattlerIndex(), undefined, CommonAnim.ATTRACT);

    // 50% chance to disrupt the target's action
    if (pokemon.randBattleSeedInt(2)) {
      phaseManager.queueMessage(
        i18next.t("battlerTags:infatuatedLapseImmobilize", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        }),
      );
      (phaseManager.getCurrentPhase() as MovePhase).cancel();
    }

    return true;
  }

  onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);

    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:infatuatedOnRemove", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
  }

  isSourceLinked(): boolean {
    return true;
  }

  getDescriptor(): string {
    return i18next.t("battlerTags:infatuatedDesc");
  }
}

/**
 * Battler tag for the "Seeded" effect applied by {@linkcode MoveId.LEECH_SEED | Leech Seed} and
 * {@linkcode MoveId.SAPPY_SEED | Sappy Seed}
 *
 * @sealed
 */
export class SeedTag extends SerializableBattlerTag {
  public override readonly tagType = BattlerTagType.SEEDED;
  public readonly sourceIndex: BattlerIndex;

  constructor(sourceId: number) {
    super(BattlerTagType.SEEDED, BattlerTagLapseType.TURN_END, 1, MoveId.LEECH_SEED, sourceId, true);
  }

  /**
   * When given a battler tag or json representing one, load the data for it.
   * @param source - An object containing the fields needed to reconstruct this tag.
   */
  public override loadTag(source: BaseBattlerTag & Pick<SeedTag, "tagType" | "sourceIndex">): void {
    super.loadTag(source);
    (this as Mutable<this>).sourceIndex = source.sourceIndex;
  }

  canAdd(pokemon: Pokemon): boolean {
    return !pokemon.isOfType(PokemonType.GRASS);
  }

  onAdd(pokemon: Pokemon): void {
    const source = this.getSourcePokemon();
    if (!source) {
      console.warn(`Failed to get source Pokemon for SeedTag onAdd; id: ${this.sourceId}`);
      return;
    }

    super.onAdd(pokemon);

    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:seededOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
    (this as Mutable<this>).sourceIndex = source.getBattlerIndex();
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);

    if (!ret) {
      return false;
    }

    // Check which opponent to restore HP to
    const source = pokemon.getOpponents().find(o => o.getBattlerIndex() === this.sourceIndex);
    if (!source) {
      return true;
    }

    const cancelled = new BooleanHolder(false);
    applyAbAttrs("BlockNonDirectDamageAbAttr", { pokemon, cancelled });

    if (cancelled.value) {
      return true;
    }

    globalScene.phaseManager.unshiftNew(
      "CommonAnimPhase",
      source.getBattlerIndex(),
      pokemon.getBattlerIndex(),
      CommonAnim.LEECH_SEED,
    );

    // Damage the target and restore our HP (or take damage in the case of liquid ooze)
    const damage = pokemon.damageAndUpdate(toDmgValue(pokemon.getMaxHp() / 8), { result: HitResult.INDIRECT });
    const reverseDrain = pokemon.hasAbilityWithAttr("ReverseDrainAbAttr", false);
    globalScene.phaseManager.unshiftNew(
      "PokemonHealPhase",
      source.getBattlerIndex(),
      reverseDrain ? -damage : damage,
      i18next.t(reverseDrain ? "battlerTags:seededLapseShed" : "battlerTags:seededLapse", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
      false,
      true,
    );
    return true;
  }

  getDescriptor(): string {
    return i18next.t("battlerTags:seedDesc");
  }
}

/**
 * BattlerTag representing the effects of {@link https://bulbapedia.bulbagarden.net/wiki/Powder_(move) | Powder}.
 * When the afflicted Pokemon uses a Fire-type move, the move is cancelled, and the
 * Pokemon takes damage equal to 1/4 of its maximum HP (rounded down).
 */
export class PowderTag extends BattlerTag {
  public override readonly tagType = BattlerTagType.POWDER;
  constructor() {
    super(BattlerTagType.POWDER, [BattlerTagLapseType.PRE_MOVE, BattlerTagLapseType.TURN_END], 1);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    // "{Pokemon} is covered in powder!"
    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:powderOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
  }

  /**
   * Applies Powder's effects before the tag owner uses a Fire-type move, damaging and canceling its action.
   * Lasts until the end of the turn.
   * @param pokemon - The {@linkcode Pokemon} with this tag.
   * @param lapseType - The {@linkcode BattlerTagLapseType} dictating how this tag is being activated
   * @returns `true` if the tag should remain active.
   */
  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const movePhase = globalScene.phaseManager.getCurrentPhase();
    if (lapseType !== BattlerTagLapseType.PRE_MOVE || !movePhase?.is("MovePhase")) {
      return false;
    }

    const move = movePhase.move.getMove();
    const weather = globalScene.arena.weather;
    if (
      pokemon.getMoveType(move) !== PokemonType.FIRE
      || (weather?.weatherType === WeatherType.HEAVY_RAIN && !weather.isEffectSuppressed()) // Heavy rain takes priority over powder
    ) {
      return true;
    }

    // Disable the target's fire type move and damage it (subject to Magic Guard)
    movePhase.showMoveText();
    movePhase.fail();

    const idx = pokemon.getBattlerIndex();

    globalScene.phaseManager.unshiftNew("CommonAnimPhase", idx, idx, CommonAnim.POWDER);

    const cancelDamage = new BooleanHolder(false);
    applyAbAttrs("BlockNonDirectDamageAbAttr", { pokemon, cancelled: cancelDamage });
    if (!cancelDamage.value) {
      pokemon.damageAndUpdate(Math.floor(pokemon.getMaxHp() / 4), { result: HitResult.INDIRECT });
    }

    // "When the flame touched the powder\non the Pokémon, it exploded!"
    globalScene.phaseManager.queueMessage(i18next.t("battlerTags:powderLapse", { moveName: move.name }));

    return true;
  }
}

export class NightmareTag extends SerializableBattlerTag {
  public override readonly tagType = BattlerTagType.NIGHTMARE;
  constructor() {
    super(BattlerTagType.NIGHTMARE, BattlerTagLapseType.TURN_END, 1, MoveId.NIGHTMARE);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:nightmareOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
  }

  onOverlap(pokemon: Pokemon): void {
    super.onOverlap(pokemon);

    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:nightmareOnOverlap", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);

    if (ret) {
      const phaseManager = globalScene.phaseManager;
      phaseManager.queueMessage(
        i18next.t("battlerTags:nightmareLapse", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        }),
      );
      phaseManager.unshiftNew("CommonAnimPhase", pokemon.getBattlerIndex(), undefined, CommonAnim.CURSE); // TODO: Update animation type

      const cancelled = new BooleanHolder(false);
      applyAbAttrs("BlockNonDirectDamageAbAttr", { pokemon, cancelled });

      if (!cancelled.value) {
        pokemon.damageAndUpdate(toDmgValue(pokemon.getMaxHp() / 4), { result: HitResult.INDIRECT });
      }
    }

    return ret;
  }

  getDescriptor(): string {
    return i18next.t("battlerTags:nightmareDesc");
  }
}

export class FrenzyTag extends SerializableBattlerTag {
  public override readonly tagType = BattlerTagType.FRENZY;
  constructor(turnCount: number, sourceMove: MoveId, sourceId: number) {
    super(BattlerTagType.FRENZY, BattlerTagLapseType.CUSTOM, turnCount, sourceMove, sourceId);
  }

  onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);

    if (this.turnCount < 2) {
      // Only add CONFUSED tag if a disruption occurs on the final confusion-inducing turn of FRENZY
      pokemon.addTag(BattlerTagType.CONFUSED, pokemon.randBattleSeedIntRange(2, 4));
    }
  }
}

/**
 * Applies the effects of {@linkcode MoveId.ENCORE} onto the target Pokemon.
 * Encore forces the target Pokemon to use its most-recent move for 3 turns.
 * @sealed
 */
export class EncoreTag extends MoveRestrictionBattlerTag {
  public override readonly tagType = BattlerTagType.ENCORE;
  /** The ID of the move the user is locked into using */
  public moveId: MoveId;

  constructor(sourceId: number) {
    super(
      BattlerTagType.ENCORE,
      [BattlerTagLapseType.CUSTOM, BattlerTagLapseType.AFTER_MOVE],
      3,
      MoveId.ENCORE,
      sourceId,
    );
  }

  public override loadTag(source: BaseBattlerTag & Pick<EncoreTag, "tagType" | "moveId">): void {
    super.loadTag(source);
    this.moveId = source.moveId;
  }

  override canAdd(pokemon: Pokemon): boolean {
    const lastMove = pokemon.getLastNonVirtualMove();
    if (!lastMove) {
      return false;
    }

    if (invalidEncoreMoves.has(lastMove.move)) {
      return false;
    }

    this.moveId = lastMove.move;

    return true;
  }

  override onAdd(pokemon: Pokemon): void {
    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:encoreOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );

    const movePhase = globalScene.phaseManager.findPhase(m => m.is("MovePhase") && m.pokemon === pokemon);
    if (movePhase) {
      const movesetMove = pokemon.getMoveset().find(m => m.moveId === this.moveId);
      if (movesetMove) {
        const lastMove = pokemon.getLastXMoves(1)[0];
        globalScene.phaseManager.tryReplacePhase(
          m => m.is("MovePhase") && m.pokemon === pokemon,
          globalScene.phaseManager.create(
            "MovePhase",
            pokemon,
            lastMove.targets ?? [],
            movesetMove,
            MoveUseMode.NORMAL,
          ),
        );
      }
    }
  }

  /**
   * If the encored move has run out of PP, Encore ends early. Otherwise, Encore lapses based on the AFTER_MOVE battler tag lapse type.
   * @returns `true` to persist | `false` to end and be removed
   */
  override lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    if (lapseType === BattlerTagLapseType.CUSTOM) {
      const encoredMove = pokemon.getMoveset().find(m => m.moveId === this.moveId);
      return !isNullOrUndefined(encoredMove) && encoredMove.getPpRatio() > 0;
    }
    return super.lapse(pokemon, lapseType);
  }

  /**
   * Checks if the move matches the moveId stored within the tag and returns a boolean value
   * @param move - The ID of the move selected
   * @param user N/A
   * @returns `true` if the move does not match with the moveId stored and as a result, restricted
   */
  override isMoveRestricted(move: MoveId, _user?: Pokemon): boolean {
    return move !== this.moveId;
  }

  override selectionDeniedText(_pokemon: Pokemon, move: MoveId): string {
    return i18next.t("battle:moveDisabled", { moveName: allMoves[move].name });
  }

  onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);

    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:encoreOnRemove", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
  }
}

export class HelpingHandTag extends BattlerTag {
  public override readonly tagType = BattlerTagType.HELPING_HAND;
  constructor(sourceId: number) {
    super(BattlerTagType.HELPING_HAND, BattlerTagLapseType.TURN_END, 1, MoveId.HELPING_HAND, sourceId);
  }

  onAdd(pokemon: Pokemon): void {
    const source = this.getSourcePokemon();
    if (!source) {
      console.warn(`Failed to get source Pokemon for HelpingHandTag onAdd; id: ${this.sourceId}`);
      return;
    }

    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:helpingHandOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(source),
        pokemonName: getPokemonNameWithAffix(pokemon),
      }),
    );
  }
}

/**
 * Applies the Ingrain tag to a pokemon
 */
export class IngrainTag extends TrappedTag {
  public override readonly tagType = BattlerTagType.INGRAIN;
  constructor(sourceId: number) {
    super(BattlerTagType.INGRAIN, BattlerTagLapseType.TURN_END, 1, MoveId.INGRAIN, sourceId);
  }

  /**
   * Check if the Ingrain tag can be added to the pokemon
   * @param pokemon - The pokemon to check if the tag can be added to
   * @returns boolean True if the tag can be added, false otherwise
   */
  canAdd(pokemon: Pokemon): boolean {
    return !pokemon.getTag(BattlerTagType.TRAPPED);
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);

    if (ret) {
      globalScene.phaseManager.unshiftNew(
        "PokemonHealPhase",
        pokemon.getBattlerIndex(),
        toDmgValue(pokemon.getMaxHp() / 16),
        i18next.t("battlerTags:ingrainLapse", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        }),
        true,
      );
    }

    return ret;
  }

  getTrapMessage(pokemon: Pokemon): string {
    return i18next.t("battlerTags:ingrainOnTrap", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
    });
  }

  getDescriptor(): string {
    return i18next.t("battlerTags:ingrainDesc");
  }
}

/**
 * Octolock traps the target pokemon and reduces its DEF and SPDEF by one stage at the
 * end of each turn.
 */
export class OctolockTag extends TrappedTag {
  public override readonly tagType = BattlerTagType.OCTOLOCK;
  constructor(sourceId: number) {
    super(BattlerTagType.OCTOLOCK, BattlerTagLapseType.TURN_END, 1, MoveId.OCTOLOCK, sourceId);
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const shouldLapse = lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);

    if (shouldLapse) {
      globalScene.phaseManager.unshiftNew(
        "StatStageChangePhase",
        pokemon.getBattlerIndex(),
        false,
        [Stat.DEF, Stat.SPDEF],
        -1,
      );
      return true;
    }

    return false;
  }
}

export class AquaRingTag extends SerializableBattlerTag {
  public override readonly tagType = BattlerTagType.AQUA_RING;
  constructor() {
    super(BattlerTagType.AQUA_RING, BattlerTagLapseType.TURN_END, 1, MoveId.AQUA_RING, undefined, true);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:aquaRingOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);

    if (ret) {
      globalScene.phaseManager.unshiftNew(
        "PokemonHealPhase",
        pokemon.getBattlerIndex(),
        toDmgValue(pokemon.getMaxHp() / 16),
        i18next.t("battlerTags:aquaRingLapse", {
          moveName: this.getMoveName(),
          pokemonName: getPokemonNameWithAffix(pokemon),
        }),
        true,
      );
    }

    return ret;
  }
}

/** Tag used to allow moves that interact with {@link MoveId.MINIMIZE} to function */
export class MinimizeTag extends SerializableBattlerTag {
  public override readonly tagType = BattlerTagType.MINIMIZED;
  constructor() {
    super(BattlerTagType.MINIMIZED, BattlerTagLapseType.TURN_END, 1, MoveId.MINIMIZE);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    return lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);
  }

  onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);
  }
}

export class DrowsyTag extends SerializableBattlerTag {
  public override readonly tagType = BattlerTagType.DROWSY;
  constructor() {
    super(BattlerTagType.DROWSY, BattlerTagLapseType.TURN_END, 2, MoveId.YAWN);
  }

  canAdd(pokemon: Pokemon): boolean {
    return globalScene.arena.terrain?.terrainType !== TerrainType.ELECTRIC || !pokemon.isGrounded();
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:drowsyOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    if (!super.lapse(pokemon, lapseType)) {
      pokemon.trySetStatus(StatusEffect.SLEEP);
      return false;
    }

    return true;
  }

  getDescriptor(): string {
    return i18next.t("battlerTags:drowsyDesc");
  }
}

export abstract class DamagingTrapTag extends TrappedTag {
  public declare readonly tagType: TrappingBattlerTagType;
  /** The animation to play during the damage sequence */
  #commonAnim: CommonAnim;

  constructor(
    tagType: BattlerTagType,
    commonAnim: CommonAnim,
    turnCount: number,
    sourceMove: MoveId,
    sourceId: number,
  ) {
    super(tagType, BattlerTagLapseType.TURN_END, turnCount, sourceMove, sourceId);

    this.#commonAnim = commonAnim;
  }

  canAdd(pokemon: Pokemon): boolean {
    return !pokemon.getTag(TrappedTag) && !pokemon.getTag(BattlerTagType.SUBSTITUTE);
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = super.lapse(pokemon, lapseType);

    if (ret) {
      const phaseManager = globalScene.phaseManager;
      phaseManager.queueMessage(
        i18next.t("battlerTags:damagingTrapLapse", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          moveName: this.getMoveName(),
        }),
      );
      phaseManager.unshiftNew("CommonAnimPhase", pokemon.getBattlerIndex(), undefined, this.#commonAnim);

      const cancelled = new BooleanHolder(false);
      applyAbAttrs("BlockNonDirectDamageAbAttr", { pokemon, cancelled });

      if (!cancelled.value) {
        pokemon.damageAndUpdate(toDmgValue(pokemon.getMaxHp() / 8), { result: HitResult.INDIRECT });
      }
    }

    return ret;
  }
}

// TODO: Condense all these tags into 1 singular tag with a modified message func
export class BindTag extends DamagingTrapTag {
  public override readonly tagType = BattlerTagType.BIND;
  constructor(turnCount: number, sourceId: number) {
    super(BattlerTagType.BIND, CommonAnim.BIND, turnCount, MoveId.BIND, sourceId);
  }

  getTrapMessage(pokemon: Pokemon): string {
    const source = this.getSourcePokemon();
    if (!source) {
      console.warn(`Failed to get source Pokemon for BindTag getTrapMessage; id: ${this.sourceId}`);
      return "ERROR - CHECK CONSOLE AND REPORT";
    }

    return i18next.t("battlerTags:bindOnTrap", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      sourcePokemonName: getPokemonNameWithAffix(source),
      moveName: this.getMoveName(),
    });
  }
}

export class WrapTag extends DamagingTrapTag {
  public override readonly tagType = BattlerTagType.WRAP;
  constructor(turnCount: number, sourceId: number) {
    super(BattlerTagType.WRAP, CommonAnim.WRAP, turnCount, MoveId.WRAP, sourceId);
  }

  getTrapMessage(pokemon: Pokemon): string {
    const source = this.getSourcePokemon();
    if (!source) {
      console.warn(`Failed to get source Pokemon for WrapTag getTrapMessage; id: ${this.sourceId}`);
      return "ERROR - CHECK CONSOLE AND REPORT";
    }

    return i18next.t("battlerTags:wrapOnTrap", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      sourcePokemonName: getPokemonNameWithAffix(source),
      moveName: this.getMoveName(),
    });
  }
}

export abstract class VortexTrapTag extends DamagingTrapTag {
  getTrapMessage(pokemon: Pokemon): string {
    return i18next.t("battlerTags:vortexOnTrap", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
    });
  }
}

export class FireSpinTag extends VortexTrapTag {
  public override readonly tagType = BattlerTagType.FIRE_SPIN;
  constructor(turnCount: number, sourceId: number) {
    super(BattlerTagType.FIRE_SPIN, CommonAnim.FIRE_SPIN, turnCount, MoveId.FIRE_SPIN, sourceId);
  }
}

export class WhirlpoolTag extends VortexTrapTag {
  public override readonly tagType = BattlerTagType.WHIRLPOOL;
  constructor(turnCount: number, sourceId: number) {
    super(BattlerTagType.WHIRLPOOL, CommonAnim.WHIRLPOOL, turnCount, MoveId.WHIRLPOOL, sourceId);
  }
}

export class ClampTag extends DamagingTrapTag {
  public override readonly tagType = BattlerTagType.CLAMP;
  constructor(turnCount: number, sourceId: number) {
    super(BattlerTagType.CLAMP, CommonAnim.CLAMP, turnCount, MoveId.CLAMP, sourceId);
  }

  getTrapMessage(pokemon: Pokemon): string {
    const source = this.getSourcePokemon();
    if (!source) {
      console.warn(`Failed to get source Pokemon for ClampTag getTrapMessage; id: ${this.sourceId}`);
      return "ERROR - CHECK CONSOLE AND REPORT ASAP";
    }

    return i18next.t("battlerTags:clampOnTrap", {
      sourcePokemonNameWithAffix: getPokemonNameWithAffix(source),
      pokemonName: getPokemonNameWithAffix(pokemon),
    });
  }
}

export class SandTombTag extends DamagingTrapTag {
  public override readonly tagType = BattlerTagType.SAND_TOMB;
  constructor(turnCount: number, sourceId: number) {
    super(BattlerTagType.SAND_TOMB, CommonAnim.SAND_TOMB, turnCount, MoveId.SAND_TOMB, sourceId);
  }

  getTrapMessage(pokemon: Pokemon): string {
    return i18next.t("battlerTags:sandTombOnTrap", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      moveName: this.getMoveName(),
    });
  }
}

export class MagmaStormTag extends DamagingTrapTag {
  public override readonly tagType = BattlerTagType.MAGMA_STORM;
  constructor(turnCount: number, sourceId: number) {
    super(BattlerTagType.MAGMA_STORM, CommonAnim.MAGMA_STORM, turnCount, MoveId.MAGMA_STORM, sourceId);
  }

  getTrapMessage(pokemon: Pokemon): string {
    return i18next.t("battlerTags:magmaStormOnTrap", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
    });
  }
}

export class SnapTrapTag extends DamagingTrapTag {
  public override readonly tagType = BattlerTagType.SNAP_TRAP;
  constructor(turnCount: number, sourceId: number) {
    super(BattlerTagType.SNAP_TRAP, CommonAnim.SNAP_TRAP, turnCount, MoveId.SNAP_TRAP, sourceId);
  }

  getTrapMessage(pokemon: Pokemon): string {
    return i18next.t("battlerTags:snapTrapOnTrap", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
    });
  }
}

export class ThunderCageTag extends DamagingTrapTag {
  public override readonly tagType = BattlerTagType.THUNDER_CAGE;
  constructor(turnCount: number, sourceId: number) {
    super(BattlerTagType.THUNDER_CAGE, CommonAnim.THUNDER_CAGE, turnCount, MoveId.THUNDER_CAGE, sourceId);
  }

  getTrapMessage(pokemon: Pokemon): string {
    const source = this.getSourcePokemon();
    if (!source) {
      console.warn(`Failed to get source Pokemon for ThunderCageTag getTrapMessage; id: ${this.sourceId}`);
      return "ERROR - PLEASE REPORT ASAP";
    }

    return i18next.t("battlerTags:thunderCageOnTrap", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      sourcePokemonNameWithAffix: getPokemonNameWithAffix(source),
    });
  }
}

export class InfestationTag extends DamagingTrapTag {
  public override readonly tagType = BattlerTagType.INFESTATION;
  constructor(turnCount: number, sourceId: number) {
    super(BattlerTagType.INFESTATION, CommonAnim.INFESTATION, turnCount, MoveId.INFESTATION, sourceId);
  }

  getTrapMessage(pokemon: Pokemon): string {
    const source = this.getSourcePokemon();
    if (!source) {
      console.warn(`Failed to get source Pokemon for InfestationTag getTrapMessage; id: ${this.sourceId}`);
      return "ERROR - CHECK CONSOLE AND REPORT";
    }

    return i18next.t("battlerTags:infestationOnTrap", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      sourcePokemonNameWithAffix: getPokemonNameWithAffix(source),
    });
  }
}

export class ProtectedTag extends BattlerTag {
  public declare readonly tagType: ProtectionBattlerTagType;
  constructor(sourceMove: MoveId, tagType: ProtectionBattlerTagType = BattlerTagType.PROTECTED) {
    super(tagType, BattlerTagLapseType.TURN_END, 0, sourceMove);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:protectedOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    if (lapseType === BattlerTagLapseType.CUSTOM) {
      new CommonBattleAnim(CommonAnim.PROTECT, pokemon).play();
      globalScene.phaseManager.queueMessage(
        i18next.t("battlerTags:protectedLapse", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        }),
      );

      // Stop multi-hit moves early
      const effectPhase = globalScene.phaseManager.getCurrentPhase();
      if (effectPhase?.is("MoveEffectPhase")) {
        effectPhase.stopMultiHit(pokemon);
      }
      return true;
    }

    return super.lapse(pokemon, lapseType);
  }
}

/** Class for `BattlerTag`s that apply some effect when hit by a contact move */
export abstract class ContactProtectedTag extends ProtectedTag {
  /**
   * Function to call when a contact move hits the pokemon with this tag.
   * @param _attacker - The pokemon using the contact move
   * @param _user - The pokemon that is being attacked and has the tag
   */
  abstract onContact(_attacker: Pokemon, _user: Pokemon): void;

  /**
   * Lapse the tag and apply `onContact` if the move makes contact and
   * `lapseType` is custom, respecting the move's flags and the pokemon's
   * abilities, and whether the lapseType is custom.
   *
   * @param pokemon - The pokemon with the tag
   * @param lapseType - The type of lapse to apply. If this is not {@linkcode BattlerTagLapseType.CUSTOM CUSTOM}, no effect will be applied.
   * @returns Whether the tag continues to exist after the lapse.
   */
  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = super.lapse(pokemon, lapseType);

    const moveData = getMoveEffectPhaseData(pokemon);
    if (
      lapseType === BattlerTagLapseType.CUSTOM
      && moveData
      && moveData.move.doesFlagEffectApply({ flag: MoveFlags.MAKES_CONTACT, user: moveData.attacker, target: pokemon })
    ) {
      this.onContact(moveData.attacker, pokemon);
    }

    return ret;
  }
}

/**
 * `BattlerTag` class for moves that block damaging moves damage the enemy if the enemy's move makes contact
 * Used by {@linkcode MoveId.SPIKY_SHIELD}
 *
 * @sealed
 */
export class ContactDamageProtectedTag extends ContactProtectedTag {
  public override readonly tagType = BattlerTagType.SPIKY_SHIELD;
  #damageRatio: number;

  constructor(sourceMove: MoveId, damageRatio: number) {
    super(sourceMove, BattlerTagType.SPIKY_SHIELD);
    this.#damageRatio = damageRatio;
  }

  /**
   * Damage the attacker by `this.damageRatio` of the target's max HP
   * @param attacker - The pokemon using the contact move
   * @param user - The pokemon that is being attacked and has the tag
   */
  override onContact(attacker: Pokemon, user: Pokemon): void {
    const cancelled = new BooleanHolder(false);
    applyAbAttrs("BlockNonDirectDamageAbAttr", { pokemon: user, cancelled });
    if (!cancelled.value) {
      attacker.damageAndUpdate(toDmgValue(attacker.getMaxHp() * (1 / this.#damageRatio)), {
        result: HitResult.INDIRECT,
      });
    }
  }
}

/** Base class for `BattlerTag`s that block damaging moves but not status moves */
export abstract class DamageProtectedTag extends ContactProtectedTag {
  public declare readonly tagType: DamageProtectedTagType;
}

export class ContactSetStatusProtectedTag extends DamageProtectedTag {
  public declare readonly tagType: ContactSetStatusProtectedTagType;
  /** The status effect applied to attackers */
  #statusEffect: StatusEffect;
  /**
   * @param sourceMove - The move that caused the tag to be applied
   * @param tagType - The type of the tag
   * @param statusEffect - The status effect applied to attackers
   */
  constructor(sourceMove: MoveId, tagType: ContactSetStatusProtectedTagType, statusEffect: StatusEffect) {
    super(sourceMove, tagType);
    this.#statusEffect = statusEffect;
  }

  /**
   * Set the status effect on the attacker
   * @param attacker - The pokemon using the contact move
   * @param user - The pokemon that is being attacked and has the tag
   */
  override onContact(attacker: Pokemon, user: Pokemon): void {
    attacker.trySetStatus(this.#statusEffect, user);
  }
}

/**
 * `BattlerTag` class for moves that block damaging moves and lower enemy stats if the enemy's move makes contact
 * Used by {@linkcode MoveId.KINGS_SHIELD}, {@linkcode MoveId.OBSTRUCT}, {@linkcode MoveId.SILK_TRAP}
 */
export class ContactStatStageChangeProtectedTag extends DamageProtectedTag {
  public declare readonly tagType: ContactStatStageChangeProtectedTagType;
  #stat: BattleStat;
  #levels: number;

  constructor(sourceMove: MoveId, tagType: ContactStatStageChangeProtectedTagType, stat: BattleStat, levels: number) {
    super(sourceMove, tagType);

    this.#stat = stat;
    this.#levels = levels;
  }

  /**
   * Initiate the stat stage change on the attacker
   * @param attacker - The pokemon using the contact move
   * @param user - The pokemon that is being attacked and has the tag
   */
  override onContact(attacker: Pokemon, _user: Pokemon): void {
    globalScene.phaseManager.unshiftNew(
      "StatStageChangePhase",
      attacker.getBattlerIndex(),
      false,
      [this.#stat],
      this.#levels,
    );
  }
}

/**
 * `BattlerTag` class for effects that cause the affected Pokemon to survive lethal attacks at 1 HP.
 * Used for {@link https://bulbapedia.bulbagarden.net/wiki/Endure_(move) | Endure} and endure tokens.
 */
export class EnduringTag extends BattlerTag {
  public declare readonly tagType: EndureTagType;
  constructor(tagType: EndureTagType, lapseType: BattlerTagLapseType, sourceMove: MoveId) {
    super(tagType, lapseType, 0, sourceMove);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:enduringOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    if (lapseType === BattlerTagLapseType.CUSTOM) {
      globalScene.phaseManager.queueMessage(
        i18next.t("battlerTags:enduringLapse", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        }),
      );
      return true;
    }

    return super.lapse(pokemon, lapseType);
  }
}

export class SturdyTag extends BattlerTag {
  public override readonly tagType = BattlerTagType.STURDY;
  constructor(sourceMove: MoveId) {
    super(BattlerTagType.STURDY, BattlerTagLapseType.TURN_END, 0, sourceMove);
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    if (lapseType === BattlerTagLapseType.CUSTOM) {
      globalScene.phaseManager.queueMessage(
        i18next.t("battlerTags:sturdyLapse", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        }),
      );
      return true;
    }

    return super.lapse(pokemon, lapseType);
  }
}

export class PerishSongTag extends SerializableBattlerTag {
  public override readonly tagType = BattlerTagType.PERISH_SONG;
  constructor(turnCount: number) {
    super(BattlerTagType.PERISH_SONG, BattlerTagLapseType.TURN_END, turnCount, MoveId.PERISH_SONG, undefined, true);
  }

  canAdd(pokemon: Pokemon): boolean {
    return !pokemon.isBossImmune();
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = super.lapse(pokemon, lapseType);

    if (ret) {
      globalScene.phaseManager.queueMessage(
        i18next.t("battlerTags:perishSongLapse", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          turnCount: this.turnCount,
        }),
      );
    } else {
      pokemon.damageAndUpdate(pokemon.hp, { result: HitResult.INDIRECT_KO, ignoreSegments: true });
    }

    return ret;
  }
}

/**
 * Applies the "Center of Attention" volatile status effect, the effect applied by Follow Me, Rage Powder, and Spotlight.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Center_of_attention | Center of Attention}
 */
export class CenterOfAttentionTag extends BattlerTag {
  public override readonly tagType = BattlerTagType.CENTER_OF_ATTENTION;
  public powder: boolean;

  constructor(sourceMove: MoveId) {
    super(BattlerTagType.CENTER_OF_ATTENTION, BattlerTagLapseType.TURN_END, 1, sourceMove);

    this.powder = this.sourceMove === MoveId.RAGE_POWDER;
  }

  /** "Center of Attention" can't be added if an ally is already the Center of Attention. */
  canAdd(pokemon: Pokemon): boolean {
    const activeTeam = pokemon.isPlayer() ? globalScene.getPlayerField() : globalScene.getEnemyField();

    return !activeTeam.find(p => p.getTag(BattlerTagType.CENTER_OF_ATTENTION));
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:centerOfAttentionOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
  }
}

export class AbilityBattlerTag extends SerializableBattlerTag {
  public declare readonly tagType: AbilityBattlerTagType;
  #ability: AbilityId;
  /** The ability that the tag corresponds to */
  public get ability(): AbilityId {
    return this.#ability;
  }

  constructor(tagType: AbilityBattlerTagType, ability: AbilityId, lapseType: BattlerTagLapseType, turnCount: number) {
    super(tagType, lapseType, turnCount);

    this.#ability = ability;
  }
}

/**
 * Tag used by Unburden to double speed
 */
export class UnburdenTag extends AbilityBattlerTag {
  public override readonly tagType = BattlerTagType.UNBURDEN;
  constructor() {
    super(BattlerTagType.UNBURDEN, AbilityId.UNBURDEN, BattlerTagLapseType.CUSTOM, 1);
  }
  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);
  }
  onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);
  }
}

export class TruantTag extends AbilityBattlerTag {
  public override readonly tagType = BattlerTagType.TRUANT;
  constructor() {
    super(BattlerTagType.TRUANT, AbilityId.TRUANT, BattlerTagLapseType.MOVE, 1);
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    if (!pokemon.hasAbility(AbilityId.TRUANT)) {
      // remove tag if mon lacks ability
      return super.lapse(pokemon, lapseType);
    }

    const lastMove = pokemon.getLastXMoves()[0];

    if (!lastMove || lastMove.move === MoveId.NONE) {
      // Don't interrupt move if last move was `MoveId.NONE` OR no prior move was found
      return true;
    }

    // Interrupt move usage in favor of slacking off
    const passive = pokemon.getAbility().id !== AbilityId.TRUANT;
    (globalScene.phaseManager.getCurrentPhase() as MovePhase).cancel();
    // TODO: Ability displays should be handled by the ability
    globalScene.phaseManager.queueAbilityDisplay(pokemon, passive, true);
    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:truantLapse", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
    globalScene.phaseManager.queueAbilityDisplay(pokemon, passive, false);

    return true;
  }
}

export class SlowStartTag extends AbilityBattlerTag {
  public override readonly tagType = BattlerTagType.SLOW_START;
  constructor() {
    super(BattlerTagType.SLOW_START, AbilityId.SLOW_START, BattlerTagLapseType.TURN_END, 5);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:slowStartOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    if (!pokemon.hasAbility(this.ability)) {
      this.turnCount = 1;
    }

    return super.lapse(pokemon, lapseType);
  }

  onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);

    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:slowStartOnRemove", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
      null,
      false,
      null,
    );
  }
}

export class HighestStatBoostTag extends AbilityBattlerTag {
  public declare readonly tagType: HighestStatBoostTagType;
  public stat: EffectiveStat = Stat.ATK;
  public multiplier = 1.3;

  constructor(tagType: HighestStatBoostTagType, ability: AbilityId) {
    super(tagType, ability, BattlerTagLapseType.CUSTOM, 1);
  }

  /**
   * When given a battler tag or json representing one, load the data for it.
   * @param source - An object containing the fields needed to reconstruct this tag.
   */
  public override loadTag<T extends this>(source: BaseBattlerTag & Pick<T, "tagType" | "stat" | "multiplier">): void {
    super.loadTag(source);
    this.stat = source.stat;
    this.multiplier = source.multiplier;
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    const highestStat = EFFECTIVE_STATS.reduce(
      (curr: [EffectiveStat, number], stat: EffectiveStat) => {
        const value = pokemon.getEffectiveStat(stat, undefined, undefined, true, true, true, false, true, true);
        if (value > curr[1]) {
          curr[0] = stat;
          curr[1] = value;
        }
        return curr;
      },
      [Stat.ATK, 0],
    )[0];

    this.stat = highestStat;

    this.multiplier = highestStat === Stat.SPD ? 1.5 : 1.3;
    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:highestStatBoostOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        statName: i18next.t(getStatKey(highestStat)),
      }),
      null,
      false,
      null,
      true,
    );
  }

  onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);

    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:highestStatBoostOnRemove", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        abilityName: allAbilities[this.ability].name,
      }),
    );
  }
}

export class WeatherHighestStatBoostTag extends HighestStatBoostTag {
  #weatherTypes: WeatherType[];
  public get weatherTypes(): WeatherType[] {
    return this.#weatherTypes;
  }

  constructor(tagType: HighestStatBoostTagType, ability: AbilityId, ...weatherTypes: WeatherType[]) {
    super(tagType, ability);
    this.#weatherTypes = weatherTypes;
  }
}

export class TerrainHighestStatBoostTag extends HighestStatBoostTag {
  #terrainTypes: TerrainType[];
  public get terrainTypes(): TerrainType[] {
    return this.#terrainTypes;
  }

  constructor(tagType: HighestStatBoostTagType, ability: AbilityId, ...terrainTypes: TerrainType[]) {
    super(tagType, ability);
    this.#terrainTypes = terrainTypes;
  }
}

export class SemiInvulnerableTag extends SerializableBattlerTag {
  public declare readonly tagType: SemiInvulnerableTagType;
  constructor(tagType: BattlerTagType, turnCount: number, sourceMove: MoveId) {
    super(tagType, BattlerTagLapseType.MOVE_EFFECT, turnCount, sourceMove);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    pokemon.setVisible(false);
  }

  onRemove(pokemon: Pokemon): void {
    // Wait 2 frames before setting visible for battle animations that don't immediately show the sprite invisible
    globalScene.tweens.addCounter({
      duration: getFrameMs(2),
      onComplete: () => pokemon.setVisible(true),
    });
  }
}

export abstract class TypeImmuneTag extends SerializableBattlerTag {
  #immuneType: PokemonType;
  public get immuneType(): PokemonType {
    return this.#immuneType;
  }

  constructor(tagType: BattlerTagType, sourceMove: MoveId, immuneType: PokemonType, length = 1) {
    super(tagType, BattlerTagLapseType.TURN_END, length, sourceMove, undefined, true);

    this.#immuneType = immuneType;
  }
}

/**
 * Battler Tag that lifts the affected Pokemon into the air and provides immunity to Ground type moves.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Magnet_Rise_(move) | MoveId.MAGNET_RISE}
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Telekinesis_(move) | MoveId.TELEKINESIS}
 */
export class FloatingTag extends TypeImmuneTag {
  public override readonly tagType = BattlerTagType.FLOATING;
  constructor(tagType: BattlerTagType, sourceMove: MoveId, turnCount: number) {
    super(tagType, sourceMove, PokemonType.GROUND, turnCount);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    if (this.sourceMove === MoveId.MAGNET_RISE) {
      globalScene.phaseManager.queueMessage(
        i18next.t("battlerTags:magnetRisenOnAdd", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        }),
      );
    }
  }

  onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);
    if (this.sourceMove === MoveId.MAGNET_RISE) {
      globalScene.phaseManager.queueMessage(
        i18next.t("battlerTags:magnetRisenOnRemove", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        }),
      );
    }
  }
}

export class TypeBoostTag extends SerializableBattlerTag {
  public declare readonly tagType: TypeBoostTagType;
  #boostedType: PokemonType;
  #boostValue: number;
  #oneUse: boolean;

  public get boostedType(): PokemonType {
    return this.#boostedType;
  }
  public get boostValue(): number {
    return this.#boostValue;
  }
  public get oneUse(): boolean {
    return this.#oneUse;
  }

  constructor(
    tagType: BattlerTagType,
    sourceMove: MoveId,
    boostedType: PokemonType,
    boostValue: number,
    oneUse: boolean,
  ) {
    super(tagType, BattlerTagLapseType.TURN_END, 1, sourceMove);

    this.#boostedType = boostedType;
    this.#boostValue = boostValue;
    this.#oneUse = oneUse;
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    return lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);
  }

  override onAdd(pokemon: Pokemon): void {
    globalScene.phaseManager.queueMessage(
      i18next.t("abilityTriggers:typeImmunityPowerBoost", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        typeName: i18next.t(`pokemonInfo:type.${toCamelCase(PokemonType[this.boostedType])}`),
      }),
    );
  }

  override onOverlap(pokemon: Pokemon): void {
    globalScene.phaseManager.queueMessage(
      i18next.t("abilityTriggers:moveImmunity", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }),
    );
  }
}

export class CritBoostTag extends SerializableBattlerTag {
  public declare readonly tagType: CritStageBoostTagType;
  /** The number of stages boosted by this tag */
  public readonly critStages: number = 1;

  constructor(tagType: CritStageBoostTagType, sourceMove: MoveId) {
    super(tagType, BattlerTagLapseType.TURN_END, 1, sourceMove, undefined, true);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    // Dragon cheer adds +2 crit stages if the pokemon is a Dragon type when the tag is added
    if (this.tagType === BattlerTagType.DRAGON_CHEER && !pokemon.getTypes(true, true).includes(PokemonType.DRAGON)) {
      (this as Mutable<this>).critStages = 1;
    } else {
      (this as Mutable<this>).critStages = 2;
    }

    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:critBoostOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    return lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);
  }

  onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);

    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:critBoostOnRemove", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
  }

  public override loadTag(source: BaseBattlerTag & Pick<CritBoostTag, "tagType" | "critStages">): void {
    super.loadTag(source);
    // TODO: Remove the nullish coalescing once Zod Schemas come in
    // For now, this is kept for backwards compatibility with older save files
    (this as Mutable<this>).critStages = source.critStages ?? 1;
  }
}

export class SaltCuredTag extends SerializableBattlerTag {
  public override readonly tagType = BattlerTagType.SALT_CURED;
  constructor(sourceId: number) {
    super(BattlerTagType.SALT_CURED, BattlerTagLapseType.TURN_END, 1, MoveId.SALT_CURE, sourceId);
  }

  onAdd(pokemon: Pokemon): void {
    const source = this.getSourcePokemon();
    if (!source) {
      console.warn(`Failed to get source Pokemon for SaltCureTag onAdd; id: ${this.sourceId}`);
      return;
    }

    super.onAdd(pokemon);
    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:saltCuredOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);

    if (ret) {
      globalScene.phaseManager.unshiftNew(
        "CommonAnimPhase",
        pokemon.getBattlerIndex(),
        pokemon.getBattlerIndex(),
        CommonAnim.SALT_CURE,
      );

      const cancelled = new BooleanHolder(false);
      applyAbAttrs("BlockNonDirectDamageAbAttr", { pokemon, cancelled });

      if (!cancelled.value) {
        const pokemonSteelOrWater = pokemon.isOfType(PokemonType.STEEL) || pokemon.isOfType(PokemonType.WATER);
        pokemon.damageAndUpdate(toDmgValue(pokemonSteelOrWater ? pokemon.getMaxHp() / 4 : pokemon.getMaxHp() / 8), {
          result: HitResult.INDIRECT,
        });

        globalScene.phaseManager.queueMessage(
          i18next.t("battlerTags:saltCuredLapse", {
            pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
            moveName: this.getMoveName(),
          }),
        );
      }
    }

    return ret;
  }
}

export class CursedTag extends SerializableBattlerTag {
  public override readonly tagType = BattlerTagType.CURSED;
  constructor(sourceId: number) {
    super(BattlerTagType.CURSED, BattlerTagLapseType.TURN_END, 1, MoveId.CURSE, sourceId, true);
  }

  onAdd(pokemon: Pokemon): void {
    const source = this.getSourcePokemon();
    if (!source) {
      console.warn(`Failed to get source Pokemon for CursedTag onAdd; id: ${this.sourceId}`);
      return;
    }

    super.onAdd(pokemon);
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);

    if (ret) {
      globalScene.phaseManager.unshiftNew(
        "CommonAnimPhase",
        pokemon.getBattlerIndex(),
        pokemon.getBattlerIndex(),
        CommonAnim.SALT_CURE,
      );

      const cancelled = new BooleanHolder(false);
      applyAbAttrs("BlockNonDirectDamageAbAttr", { pokemon, cancelled });

      if (!cancelled.value) {
        pokemon.damageAndUpdate(toDmgValue(pokemon.getMaxHp() / 4), { result: HitResult.INDIRECT });
        globalScene.phaseManager.queueMessage(
          i18next.t("battlerTags:cursedLapse", {
            pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          }),
        );
      }
    }

    return ret;
  }
}

/**
 * Battler tag for attacks that remove a type post use.
 */
export class RemovedTypeTag extends SerializableBattlerTag {
  public declare readonly tagType: RemovedTypeTagType;
  constructor(tagType: RemovedTypeTagType, lapseType: BattlerTagLapseType, sourceMove: MoveId) {
    super(tagType, lapseType, 1, sourceMove);
  }
}

/**
 * Battler tag for effects that ground the source, allowing Ground-type moves to hit them.
 * @description `IGNORE_FLYING`: Persistent grounding effects (i.e. from Smack Down and Thousand Waves)
 */
export class GroundedTag extends SerializableBattlerTag {
  public override readonly tagType = BattlerTagType.IGNORE_FLYING;
  constructor(tagType: BattlerTagType.IGNORE_FLYING, lapseType: BattlerTagLapseType, sourceMove: MoveId) {
    super(tagType, lapseType, 1, sourceMove);
  }
}

/**
 * @description `ROOSTED`: Tag for temporary grounding if only source of ungrounding is flying and pokemon uses Roost.
 * Roost removes flying type from a pokemon for a single turn.
 */

export class RoostedTag extends BattlerTag {
  private isBaseFlying: boolean;
  private isBasePureFlying: boolean;

  constructor() {
    super(BattlerTagType.ROOSTED, BattlerTagLapseType.TURN_END, 1, MoveId.ROOST);
  }

  onRemove(pokemon: Pokemon): void {
    const currentTypes = pokemon.getTypes();
    const baseTypes = pokemon.getTypes(false, false, true);

    const forestsCurseApplied: boolean =
      currentTypes.includes(PokemonType.GRASS) && !baseTypes.includes(PokemonType.GRASS);
    const trickOrTreatApplied: boolean =
      currentTypes.includes(PokemonType.GHOST) && !baseTypes.includes(PokemonType.GHOST);

    if (this.isBaseFlying) {
      let modifiedTypes: PokemonType[] = [];
      if (this.isBasePureFlying) {
        if (forestsCurseApplied || trickOrTreatApplied) {
          modifiedTypes = currentTypes.filter(type => type !== PokemonType.NORMAL);
          modifiedTypes.push(PokemonType.FLYING);
        } else {
          modifiedTypes = [PokemonType.FLYING];
        }
      } else {
        modifiedTypes = [...currentTypes];
        modifiedTypes.push(PokemonType.FLYING);
      }
      pokemon.summonData.types = modifiedTypes;
      pokemon.updateInfo();
    }
  }

  onAdd(pokemon: Pokemon): void {
    const currentTypes = pokemon.getTypes();
    const baseTypes = pokemon.getTypes(false, false, true);

    const isOriginallyDualType = baseTypes.length === 2;
    const isCurrentlyDualType = currentTypes.length === 2;
    this.isBaseFlying = baseTypes.includes(PokemonType.FLYING);
    this.isBasePureFlying = baseTypes[0] === PokemonType.FLYING && baseTypes.length === 1;

    if (this.isBaseFlying) {
      let modifiedTypes: PokemonType[];
      if (this.isBasePureFlying && !isCurrentlyDualType) {
        modifiedTypes = [PokemonType.NORMAL];
      } else if (!!pokemon.getTag(RemovedTypeTag) && isOriginallyDualType && !isCurrentlyDualType) {
        modifiedTypes = [PokemonType.UNKNOWN];
      } else {
        modifiedTypes = currentTypes.filter(type => type !== PokemonType.FLYING);
      }
      pokemon.summonData.types = modifiedTypes;
      pokemon.updateInfo();
    }
  }
}

/** Common attributes of form change abilities that block damage */
export class FormBlockDamageTag extends SerializableBattlerTag {
  public declare readonly tagType: BattlerTagType.ICE_FACE | BattlerTagType.DISGUISE;
  constructor(tagType: BattlerTagType.ICE_FACE | BattlerTagType.DISGUISE) {
    super(tagType, BattlerTagLapseType.CUSTOM, 1);
  }

  /**
   * Determines if the tag can be added to the Pokémon.
   * @param pokemon - The Pokémon to which the tag might be added.
   * @returns `true` if the tag can be added, `false` otherwise.
   */
  canAdd(pokemon: Pokemon): boolean {
    return pokemon.formIndex === 0;
  }

  /**
   * Applies the tag to the Pokémon.
   * Triggers a form change if the Pokémon is not in its defense form.
   * @param {Pokemon} pokemon The Pokémon to which the tag is added.
   */
  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    if (pokemon.formIndex !== 0) {
      globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeAbilityTrigger);
    }
  }

  /**
   * Removes the tag from the Pokémon.
   * Triggers a form change when the tag is removed.
   * @param pokemon - The Pokémon from which the tag is removed.
   */
  onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);

    globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeAbilityTrigger);
  }
}

/** Provides the additional weather-based effects of the Ice Face ability */
export class IceFaceBlockDamageTag extends FormBlockDamageTag {
  public override readonly tagType = BattlerTagType.ICE_FACE;
  /**
   * Determines if the tag can be added to the Pokémon.
   * @param pokemon - The Pokémon to which the tag might be added.
   * @returns `true` if the tag can be added, `false` otherwise.
   */
  canAdd(pokemon: Pokemon): boolean {
    const weatherType = globalScene.arena.weather?.weatherType;
    const isWeatherSnowOrHail = weatherType === WeatherType.HAIL || weatherType === WeatherType.SNOW;

    return super.canAdd(pokemon) || isWeatherSnowOrHail;
  }
}

/**
 * Battler tag indicating a Tatsugiri with {@link https://bulbapedia.bulbagarden.net/wiki/Commander_(Ability) | Commander}
 * has entered the tagged Pokemon's mouth.
 * @sealed
 */
export class CommandedTag extends SerializableBattlerTag {
  public override readonly tagType = BattlerTagType.COMMANDED;
  public readonly tatsugiriFormKey: string = "curly";

  constructor(sourceId: number) {
    super(BattlerTagType.COMMANDED, BattlerTagLapseType.CUSTOM, 0, MoveId.NONE, sourceId);
  }

  /** Caches the Tatsugiri's form key and sharply boosts the tagged Pokemon's stats */
  override onAdd(pokemon: Pokemon): void {
    (this as Mutable<this>).tatsugiriFormKey = this.getSourcePokemon()?.getFormKey() ?? "curly";
    globalScene.phaseManager.unshiftNew(
      "StatStageChangePhase",
      pokemon.getBattlerIndex(),
      true,
      [Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD],
      2,
    );
  }

  /** Triggers an {@linkcode PokemonAnimType | animation} of the tagged Pokemon "spitting out" Tatsugiri */
  override onRemove(pokemon: Pokemon): void {
    if (this.getSourcePokemon()?.isActive(true)) {
      globalScene.triggerPokemonBattleAnim(pokemon, PokemonAnimType.COMMANDER_REMOVE);
    }
  }

  override loadTag(source: BaseBattlerTag & Pick<CommandedTag, "tagType" | "tatsugiriFormKey">): void {
    super.loadTag(source);
    (this as Mutable<this>).tatsugiriFormKey = source.tatsugiriFormKey;
  }
}

/**
 * Battler tag enabling the Stockpile mechanic. This tag handles:
 * - Stack tracking, including max limit enforcement (which is replicated in Stockpile for redundancy).
 *
 * - Stat changes on adding a stack. Adding a stockpile stack attempts to raise the pokemon's DEF and SPDEF by +1.
 *
 * - Stat changes on removal of (all) stacks.
 *   - Removing stacks decreases DEF and SPDEF, independently, by one stage for each stack that successfully changed
 *     the stat when added.
 * @sealed
 */
export class StockpilingTag extends SerializableBattlerTag {
  public override readonly tagType = BattlerTagType.STOCKPILING;
  public stockpiledCount = 0;
  public statChangeCounts: { [Stat.DEF]: number; [Stat.SPDEF]: number } = {
    [Stat.DEF]: 0,
    [Stat.SPDEF]: 0,
  };

  constructor(sourceMove: MoveId = MoveId.NONE) {
    super(BattlerTagType.STOCKPILING, BattlerTagLapseType.CUSTOM, 1, sourceMove);
  }

  private onStatStagesChanged(_: Pokemon | null, statsChanged: BattleStat[], statChanges: number[]) {
    const defChange = statChanges[statsChanged.indexOf(Stat.DEF)] ?? 0;
    const spDefChange = statChanges[statsChanged.indexOf(Stat.SPDEF)] ?? 0;

    if (defChange) {
      this.statChangeCounts[Stat.DEF]++;
    }
    if (spDefChange) {
      this.statChangeCounts[Stat.SPDEF]++;
    }

    // Removed during bundling; used to ensure this method's signature retains parity
    // with the `StatStageChangeCallback` type.
    this.onStatStagesChanged satisfies StatStageChangeCallback;
  }

  public override loadTag(
    source: BaseBattlerTag & Pick<StockpilingTag, "tagType" | "stockpiledCount" | "statChangeCounts">,
  ): void {
    super.loadTag(source);
    this.stockpiledCount = source.stockpiledCount || 0;
    this.statChangeCounts = {
      [Stat.DEF]: source.statChangeCounts?.[Stat.DEF] ?? 0,
      [Stat.SPDEF]: source.statChangeCounts?.[Stat.SPDEF] ?? 0,
    };
  }

  /**
   * Adds a stockpile stack to a pokemon, up to a maximum of 3 stacks. Note that onOverlap defers to this method.
   *
   * If a stack is added, a message is displayed and the pokemon's DEF and SPDEF are increased by 1.
   * For each stat, an internal counter is incremented (by 1) if the stat was successfully changed.
   */
  onAdd(pokemon: Pokemon): void {
    if (this.stockpiledCount < 3) {
      this.stockpiledCount++;

      globalScene.phaseManager.queueMessage(
        i18next.t("battlerTags:stockpilingOnAdd", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          stockpiledCount: this.stockpiledCount,
        }),
      );

      // Attempt to increase DEF and SPDEF by one stage, keeping track of successful changes.
      globalScene.phaseManager.unshiftNew(
        "StatStageChangePhase",
        pokemon.getBattlerIndex(),
        true,
        [Stat.SPDEF, Stat.DEF],
        1,
        true,
        false,
        true,
        this.onStatStagesChanged.bind(this),
      );
    }
  }

  onOverlap(pokemon: Pokemon): void {
    this.onAdd(pokemon);
  }

  /**
   * Removing the tag removes all stacks, and the pokemon's DEF and SPDEF are decreased by
   * one stage for each stack which had successfully changed that particular stat during onAdd.
   */
  onRemove(pokemon: Pokemon): void {
    const defChange = this.statChangeCounts[Stat.DEF];
    const spDefChange = this.statChangeCounts[Stat.SPDEF];

    if (defChange) {
      globalScene.phaseManager.unshiftNew(
        "StatStageChangePhase",
        pokemon.getBattlerIndex(),
        true,
        [Stat.DEF],
        -defChange,
        true,
        false,
        true,
      );
    }

    if (spDefChange) {
      globalScene.phaseManager.unshiftNew(
        "StatStageChangePhase",
        pokemon.getBattlerIndex(),
        true,
        [Stat.SPDEF],
        -spDefChange,
        true,
        false,
        true,
      );
    }
  }
}

/**
 * Battler tag for Gulp Missile used by Cramorant.
 */
export class GulpMissileTag extends SerializableBattlerTag {
  public declare readonly tagType: BattlerTagType.GULP_MISSILE_ARROKUDA | BattlerTagType.GULP_MISSILE_PIKACHU;
  constructor(tagType: BattlerTagType.GULP_MISSILE_ARROKUDA | BattlerTagType.GULP_MISSILE_PIKACHU, sourceMove: MoveId) {
    super(tagType, BattlerTagLapseType.HIT, 0, sourceMove);
  }

  override lapse(pokemon: Pokemon, _lapseType: BattlerTagLapseType): boolean {
    if (pokemon.getTag(BattlerTagType.UNDERWATER)) {
      return true;
    }

    const moveEffectPhase = globalScene.phaseManager.getCurrentPhase();
    if (moveEffectPhase?.is("MoveEffectPhase")) {
      const attacker = moveEffectPhase.getUserPokemon();

      if (!attacker) {
        return false;
      }

      if (moveEffectPhase.move.hitsSubstitute(attacker, pokemon)) {
        return true;
      }

      const cancelled = new BooleanHolder(false);
      applyAbAttrs("BlockNonDirectDamageAbAttr", { pokemon: attacker, cancelled });

      if (!cancelled.value) {
        attacker.damageAndUpdate(Math.max(1, Math.floor(attacker.getMaxHp() / 4)), { result: HitResult.INDIRECT });
      }

      if (this.tagType === BattlerTagType.GULP_MISSILE_ARROKUDA) {
        globalScene.phaseManager.unshiftNew("StatStageChangePhase", attacker.getBattlerIndex(), false, [Stat.DEF], -1);
      } else {
        attacker.trySetStatus(StatusEffect.PARALYSIS, pokemon);
      }
    }
    return false;
  }

  /**
   * Gulp Missile's initial form changes are triggered by using Surf and Dive.
   * @param pokemon - The Pokemon with Gulp Missile ability.
   * @returns Whether the BattlerTag can be added.
   */
  canAdd(pokemon: Pokemon): boolean {
    // Bang here is OK as if sourceMove was undefined, this would just evaluate to false
    const isSurfOrDive = [MoveId.SURF, MoveId.DIVE].includes(this.sourceMove!);
    const isNormalForm =
      pokemon.formIndex === 0
      && !pokemon.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)
      && !pokemon.getTag(BattlerTagType.GULP_MISSILE_PIKACHU);
    const isCramorant = pokemon.species.speciesId === SpeciesId.CRAMORANT;

    return isSurfOrDive && isNormalForm && isCramorant;
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);
    globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeAbilityTrigger);
  }

  onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);
    globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeAbilityTrigger);
  }
}

/**
 * Tag that makes the target drop the immunities granted by a particular type
 * and all accuracy checks ignore its evasiveness stat.
 *
 * Applied by moves: {@linkcode MoveId.ODOR_SLEUTH | Odor Sleuth},
 * {@linkcode MoveId.MIRACLE_EYE | Miracle Eye} and {@linkcode MoveId.FORESIGHT | Foresight}.
 *
 * @see {@linkcode ignoreImmunity}
 */
export class ExposedTag extends SerializableBattlerTag {
  public declare readonly tagType: BattlerTagType.IGNORE_DARK | BattlerTagType.IGNORE_GHOST;
  #defenderType: PokemonType;
  #allowedTypes: readonly PokemonType[];

  constructor(
    tagType: BattlerTagType.IGNORE_DARK | BattlerTagType.IGNORE_GHOST,
    sourceMove: MoveId,
    defenderType: PokemonType,
    allowedTypes: PokemonType[],
  ) {
    super(tagType, BattlerTagLapseType.CUSTOM, 1, sourceMove);
    this.#defenderType = defenderType;
    this.#allowedTypes = allowedTypes;
  }

  /**
   * @param type - The defending type to check against
   * @param moveType - The pokemon type of the move being used
   * @returns `true` if the move should be allowed to target the defender.
   */
  ignoreImmunity(type: PokemonType, moveType: PokemonType): boolean {
    return type === this.#defenderType && this.#allowedTypes.includes(moveType);
  }
}

/**
 * Tag that prevents HP recovery from held items and move effects. It also blocks the usage of recovery moves.
 * Applied by moves:  {@linkcode MoveId.HEAL_BLOCK | Heal Block (5 turns)}, {@linkcode MoveId.PSYCHIC_NOISE | Psychic Noise (2 turns)}
 */
export class HealBlockTag extends MoveRestrictionBattlerTag {
  public override readonly tagType = BattlerTagType.HEAL_BLOCK;
  constructor(turnCount: number, sourceMove: MoveId) {
    super(
      BattlerTagType.HEAL_BLOCK,
      [BattlerTagLapseType.PRE_MOVE, BattlerTagLapseType.TURN_END],
      turnCount,
      sourceMove,
    );
  }

  onActivation(pokemon: Pokemon): string {
    return i18next.t("battle:battlerTagsHealBlock", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
    });
  }

  /**
   * Checks if a move is disabled under Heal Block
   * @param move - {@linkcode MoveId | ID} of the move being used
   * @returns `true` if the move has a TRIAGE_MOVE flag and is a status move
   */
  override isMoveRestricted(move: MoveId): boolean {
    return allMoves[move].hasFlag(MoveFlags.TRIAGE_MOVE) && allMoves[move].category === MoveCategory.STATUS;
  }

  /**
   * Checks if a move is disabled under Heal Block because of its choice of target
   * Implemented b/c of Pollen Puff
   * @param move - {@linkcode MoveId | ID} of the move being used
   * @param user - The pokemon using the move
   * @param target - The target of the move
   * @returns `true` if the move cannot be used because the target is an ally
   */
  override isMoveTargetRestricted(move: MoveId, user: Pokemon, target: Pokemon) {
    const moveCategory = new NumberHolder(allMoves[move].category);
    applyMoveAttrs("StatusCategoryOnAllyAttr", user, target, allMoves[move], moveCategory);
    return allMoves[move].hasAttr("HealOnAllyAttr") && moveCategory.value === MoveCategory.STATUS;
  }

  /**
   * Uses its own unique selectionDeniedText() message
   */
  override selectionDeniedText(pokemon: Pokemon, move: MoveId): string {
    return i18next.t("battle:moveDisabledHealBlock", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      moveName: allMoves[move].name,
      healBlockName: allMoves[MoveId.HEAL_BLOCK].name,
    });
  }

  /**
   * @param pokemon - {@linkcode Pokemon} attempting to use the restricted move
   * @param move - {@linkcode MoveId | ID} of the move being interrupted
   * @returns Text to display when the move is interrupted
   */
  override interruptedText(pokemon: Pokemon, move: MoveId): string {
    return i18next.t("battle:moveDisabledHealBlock", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      moveName: allMoves[move].name,
      healBlockName: allMoves[MoveId.HEAL_BLOCK].name,
    });
  }

  override onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);

    globalScene.phaseManager.queueMessage(
      i18next.t("battle:battlerTagsHealBlockOnRemove", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
      null,
      false,
      null,
    );
  }
}

/**
 * Tag that doubles the type effectiveness of Fire-type moves.
 */
export class TarShotTag extends SerializableBattlerTag {
  public override readonly tagType = BattlerTagType.TAR_SHOT;
  constructor() {
    super(BattlerTagType.TAR_SHOT, BattlerTagLapseType.CUSTOM, 0);
  }

  /**
   * If the Pokemon is terastallized, the tag cannot be added.
   * @param pokemon - The pokemon to check
   * @returns Whether the tag can be added
   */
  override canAdd(pokemon: Pokemon): boolean {
    return !pokemon.isTerastallized;
  }

  override onAdd(pokemon: Pokemon): void {
    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:tarShotOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
  }
}

/**
 * Battler Tag implementing the type-changing effect of {@link https://bulbapedia.bulbagarden.net/wiki/Electrify_(move) | Electrify}.
 * While this tag is in effect, the afflicted Pokemon's moves are changed to Electric type.
 */
export class ElectrifiedTag extends BattlerTag {
  public override readonly tagType = BattlerTagType.ELECTRIFIED;
  constructor() {
    super(BattlerTagType.ELECTRIFIED, BattlerTagLapseType.TURN_END, 1, MoveId.ELECTRIFY);
  }

  override onAdd(pokemon: Pokemon): void {
    // "{pokemonNameWithAffix}'s moves have been electrified!"
    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:electrifiedOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
  }
}

/**
 * Battler Tag that keeps track of how many times the user has Autotomized
 * Each count of Autotomization reduces the weight by 100kg
 */
export class AutotomizedTag extends SerializableBattlerTag {
  public override readonly tagType = BattlerTagType.AUTOTOMIZED;
  public autotomizeCount = 0;
  constructor(sourceMove: MoveId = MoveId.AUTOTOMIZE) {
    super(BattlerTagType.AUTOTOMIZED, BattlerTagLapseType.CUSTOM, 1, sourceMove);
  }

  /**
   * Adds an autotomize count to the Pokemon. Each stack reduces weight by 100kg
   * If the Pokemon is over 0.1kg it also displays a message.
   * @param pokemon The Pokemon that is being autotomized
   */
  onAdd(pokemon: Pokemon): void {
    const minWeight = 0.1;
    if (pokemon.getWeight() > minWeight) {
      globalScene.phaseManager.queueMessage(
        i18next.t("battlerTags:autotomizeOnAdd", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        }),
      );
    }
    this.autotomizeCount += 1;
  }

  onOverlap(pokemon: Pokemon): void {
    this.onAdd(pokemon);
  }

  public override loadTag(source: BaseBattlerTag & Pick<AutotomizedTag, "tagType" | "autotomizeCount">): void {
    super.loadTag(source);
    this.autotomizeCount = source.autotomizeCount;
  }
}

/**
 * Tag implementing the {@link https://bulbapedia.bulbagarden.net/wiki/Substitute_(doll)#Effect | Substitute Doll} effect,
 * for use with the moves Substitute and Shed Tail. Pokemon with this tag deflect most forms of received attack damage
 * onto the tag. This tag also grants immunity to most Status moves and several move effects.
 *
 * @sealed
 */
export class SubstituteTag extends SerializableBattlerTag {
  public override readonly tagType = BattlerTagType.SUBSTITUTE;
  /** The substitute's remaining HP. If HP is depleted, the Substitute fades. */
  public hp: number;

  //#region non-serializable properties
  /** A reference to the sprite representing the Substitute doll */
  #sprite: Phaser.GameObjects.Sprite;
  /** A reference to the sprite representing the Substitute doll */
  public get sprite(): Phaser.GameObjects.Sprite {
    return this.#sprite;
  }
  public set sprite(value: Phaser.GameObjects.Sprite) {
    this.#sprite = value;
  }
  /** Is the source Pokemon "in focus," i.e. is it fully visible on the field? */
  #sourceInFocus: boolean;
  /** Is the source Pokemon "in focus," i.e. is it fully visible on the field? */
  public get sourceInFocus(): boolean {
    return this.#sourceInFocus;
  }
  public set sourceInFocus(value: boolean) {
    this.#sourceInFocus = value;
  }
  //#endregion non-serializable properties

  constructor(sourceMove: MoveId, sourceId: number) {
    super(
      BattlerTagType.SUBSTITUTE,
      [BattlerTagLapseType.PRE_MOVE, BattlerTagLapseType.AFTER_MOVE, BattlerTagLapseType.HIT],
      0,
      sourceMove,
      sourceId,
      true,
    );
  }

  /** Sets the Substitute's HP and queues an on-add battle animation that initializes the Substitute's sprite. */
  onAdd(pokemon: Pokemon): void {
    const source = this.getSourcePokemon();
    if (!source) {
      console.warn(`Failed to get source Pokemon for SubstituteTag onAdd; id: ${this.sourceId}`);
      return;
    }

    this.hp = Math.floor(source.getMaxHp() / 4);
    this.sourceInFocus = false;

    // Queue battle animation and message
    globalScene.triggerPokemonBattleAnim(pokemon, PokemonAnimType.SUBSTITUTE_ADD);
    if (this.sourceMove === MoveId.SHED_TAIL) {
      globalScene.phaseManager.queueMessage(
        i18next.t("battlerTags:shedTailOnAdd", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        }),
        1500,
      );
    } else {
      globalScene.phaseManager.queueMessage(
        i18next.t("battlerTags:substituteOnAdd", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        }),
        1500,
      );
    }

    // Remove any binding effects from the user
    pokemon.findAndRemoveTags(tag => tag instanceof DamagingTrapTag);
  }

  /** Queues an on-remove battle animation that removes the Substitute's sprite. */
  onRemove(pokemon: Pokemon): void {
    // Only play the animation if the cause of removal isn't from the source's own move
    if (!this.sourceInFocus) {
      globalScene.triggerPokemonBattleAnim(pokemon, PokemonAnimType.SUBSTITUTE_REMOVE, [this.sprite]);
    } else {
      this.sprite.destroy();
    }
    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:substituteOnRemove", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    switch (lapseType) {
      case BattlerTagLapseType.PRE_MOVE:
        this.onPreMove(pokemon);
        break;
      case BattlerTagLapseType.AFTER_MOVE:
        this.onAfterMove(pokemon);
        break;
      case BattlerTagLapseType.HIT:
        this.onHit(pokemon);
        break;
    }
    return lapseType !== BattlerTagLapseType.CUSTOM; // only remove this tag on custom lapse
  }

  /** Triggers an animation that brings the Pokemon into focus before it uses a move */
  onPreMove(pokemon: Pokemon): void {
    globalScene.triggerPokemonBattleAnim(pokemon, PokemonAnimType.SUBSTITUTE_PRE_MOVE, [this.sprite]);
    this.sourceInFocus = true;
  }

  /** Triggers an animation that brings the Pokemon out of focus after it uses a move */
  onAfterMove(pokemon: Pokemon): void {
    globalScene.triggerPokemonBattleAnim(pokemon, PokemonAnimType.SUBSTITUTE_POST_MOVE, [this.sprite]);
    this.sourceInFocus = false;
  }

  /** If the Substitute redirects damage, queue a message to indicate it. */
  onHit(pokemon: Pokemon): void {
    const moveEffectPhase = globalScene.phaseManager.getCurrentPhase();
    if (moveEffectPhase?.is("MoveEffectPhase")) {
      const attacker = moveEffectPhase.getUserPokemon();
      if (!attacker) {
        return;
      }
      const move = moveEffectPhase.move;
      const firstHit = attacker.turnData.hitCount === attacker.turnData.hitsLeft;

      if (firstHit && move.hitsSubstitute(attacker, pokemon)) {
        globalScene.phaseManager.queueMessage(
          i18next.t("battlerTags:substituteOnHit", {
            pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          }),
        );
      }
    }
  }

  /**
   * When given a battler tag or json representing one, load the data for it.
   * @param source - An object containing the necessary properties to load the tag
   */
  public override loadTag(source: BaseBattlerTag & Pick<SubstituteTag, "tagType" | "hp">): void {
    super.loadTag(source);
    this.hp = source.hp;
  }
}

/**
 * Tag that adds extra post-summon effects to a battle for a specific Pokemon.
 * These post-summon effects are performed through {@linkcode Pokemon.mysteryEncounterBattleEffects},
 * and can be used to unshift special phases, etc.
 * Currently used only in MysteryEncounters to provide start of fight stat buffs.
 */
export class MysteryEncounterPostSummonTag extends BattlerTag {
  public override readonly tagType = BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON;
  constructor() {
    super(BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON, BattlerTagLapseType.CUSTOM, 1);
  }

  /** Event when tag is added */
  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);
  }

  /** Performs post-summon effects through {@linkcode Pokemon.mysteryEncounterBattleEffects} */
  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = super.lapse(pokemon, lapseType);

    if (lapseType === BattlerTagLapseType.CUSTOM) {
      pokemon.mysteryEncounterBattleEffects?.(pokemon);
    }

    return ret;
  }

  /** Event when tag is removed */
  onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);
  }
}

/**
 * Battle Tag that applies the move Torment to the target Pokemon
 * Torment restricts the use of moves twice in a row.
 * The tag is only removed if the target leaves the battle.
 * Torment does not interrupt the move if the move is performed consecutively in the same turn and right after Torment is applied
 */
export class TormentTag extends MoveRestrictionBattlerTag {
  public override readonly tagType = BattlerTagType.TORMENT;
  constructor(sourceId: number) {
    super(BattlerTagType.TORMENT, BattlerTagLapseType.AFTER_MOVE, 1, MoveId.TORMENT, sourceId);
  }

  override onAdd(pokemon: Pokemon) {
    super.onAdd(pokemon);
    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:tormentOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
      1500,
    );
  }

  /**
   * Torment only ends when the affected Pokemon leaves the battle field
   * @param pokemon - The Pokemon under the effects of Torment
   * @param _tagType
   * @returns `true` if still present | `false` if not
   */
  override lapse(pokemon: Pokemon, _tagType: BattlerTagLapseType): boolean {
    return pokemon.isActive(true);
  }

  /**
   * Check if the current move used is identical to the last used move with a {@linkcode MoveResult} of `SUCCESS`/`MISS`
   * @param move - The move under investigation
   * @returns `true` if there is valid consecutive usage | `false` if the moves are different from each other
   */
  public override isMoveRestricted(move: MoveId, user: Pokemon): boolean {
    if (!user) {
      return false;
    }
    const lastMove = user.getLastXMoves(1)[0];
    if (!lastMove) {
      return false;
    }
    // This checks for locking / momentum moves like Rollout and Hydro Cannon + if the user is under the influence of BattlerTagType.FRENZY
    // Because Uproar's unique behavior is not implemented, it does not check for Uproar. Torment has been marked as partial in moves.ts
    const moveObj = allMoves[lastMove.move];
    const isUnaffected = moveObj.hasAttr("ConsecutiveUseDoublePowerAttr") || user.getTag(BattlerTagType.FRENZY);
    const validLastMoveResult = lastMove.result === MoveResult.SUCCESS || lastMove.result === MoveResult.MISS;
    return lastMove.move === move && validLastMoveResult && lastMove.move !== MoveId.STRUGGLE && !isUnaffected;
  }

  override selectionDeniedText(pokemon: Pokemon, _move: MoveId): string {
    return i18next.t("battle:moveDisabledTorment", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
    });
  }
}

/**
 * BattlerTag that applies the effects of Taunt to the target Pokemon
 * Taunt restricts the use of status moves.
 * The tag is removed after 4 turns.
 */
export class TauntTag extends MoveRestrictionBattlerTag {
  public override readonly tagType = BattlerTagType.TAUNT;
  constructor() {
    super(BattlerTagType.TAUNT, [BattlerTagLapseType.PRE_MOVE, BattlerTagLapseType.AFTER_MOVE], 4, MoveId.TAUNT);
  }

  override onAdd(pokemon: Pokemon) {
    super.onAdd(pokemon);
    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:tauntOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
      1500,
    );
  }

  public override onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);

    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:tauntOnRemove", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
  }

  /**
   * Check if a move is a status move and determines its restriction status on that basis
   * @param move - The move under investigation
   * @returns `true` if the move is a status move
   */
  override isMoveRestricted(move: MoveId): boolean {
    return allMoves[move].category === MoveCategory.STATUS;
  }

  override selectionDeniedText(pokemon: Pokemon, move: MoveId): string {
    return i18next.t("battle:moveDisabledTaunt", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      moveName: allMoves[move].name,
    });
  }

  override interruptedText(pokemon: Pokemon, move: MoveId): string {
    return i18next.t("battle:moveDisabledTaunt", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      moveName: allMoves[move].name,
    });
  }
}

/**
 * BattlerTag that applies the effects of Imprison to the target Pokemon
 * Imprison restricts the opposing side's usage of moves shared by the source-user of Imprison.
 * The tag is only removed when the source-user is removed from the field.
 */
export class ImprisonTag extends MoveRestrictionBattlerTag {
  public override readonly tagType = BattlerTagType.IMPRISON;
  constructor(sourceId: number) {
    super(
      BattlerTagType.IMPRISON,
      [BattlerTagLapseType.PRE_MOVE, BattlerTagLapseType.AFTER_MOVE],
      1,
      MoveId.IMPRISON,
      sourceId,
    );
  }

  /**
   * Checks if the source of Imprison is still active
   * @param pokemon - The pokemon this tag is attached to
   * @returns `true` if the source is still active
   */
  public override lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const source = this.getSourcePokemon();
    if (!source) {
      console.warn(`Failed to get source Pokemon for ImprisonTag lapse; id: ${this.sourceId}`);
      return false;
    }
    if (lapseType === BattlerTagLapseType.PRE_MOVE) {
      return super.lapse(pokemon, lapseType) && source.isActive(true);
    }
    return source.isActive(true);
  }

  /**
   * Checks if the source of the tag has the parameter move in its moveset and that the source is still active
   * @param move - The move under investigation
   * @returns `false` if either condition is not met
   */
  public override isMoveRestricted(move: MoveId, _user: Pokemon): boolean {
    const source = this.getSourcePokemon();
    if (source) {
      const sourceMoveset = source.getMoveset().map(m => m.moveId);
      return sourceMoveset?.includes(move) && source.isActive(true);
    }
    return false;
  }

  override selectionDeniedText(pokemon: Pokemon, move: MoveId): string {
    return i18next.t("battle:moveDisabledImprison", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      moveName: allMoves[move].name,
    });
  }

  override interruptedText(pokemon: Pokemon, move: MoveId): string {
    return i18next.t("battle:moveDisabledImprison", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      moveName: allMoves[move].name,
    });
  }
}

/**
 * Battler Tag that applies the effects of Syrup Bomb to the target Pokemon.
 * For three turns, starting from the turn of hit, at the end of each turn, the target Pokemon's speed will decrease by 1.
 * The tag can also expire by taking the target Pokemon off the field, or the Pokemon that originally used the move.
 */
export class SyrupBombTag extends SerializableBattlerTag {
  public override readonly tagType = BattlerTagType.SYRUP_BOMB;
  constructor(sourceId: number) {
    super(BattlerTagType.SYRUP_BOMB, BattlerTagLapseType.TURN_END, 3, MoveId.SYRUP_BOMB, sourceId);
  }

  /**
   * Adds the Syrup Bomb battler tag to the target Pokemon.
   * @param pokemon - The target {@linkcode Pokemon}
   */
  override onAdd(pokemon: Pokemon) {
    super.onAdd(pokemon);
    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:syrupBombOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
  }

  /**
   * Applies the single-stage speed down to the target Pokemon and decrements the tag's turn count
   * @param pokemon - The target {@linkcode Pokemon}
   * @param _lapseType - N/A
   * @returns Whether the tag should persist (`turnsRemaining > 0` and source still on field)
   */
  override lapse(pokemon: Pokemon, _lapseType: BattlerTagLapseType): boolean {
    const source = this.getSourcePokemon();
    if (!source) {
      console.warn(`Failed to get source Pokemon for SyrupBombTag lapse; id: ${this.sourceId}`);
      return false;
    }

    // Syrup bomb clears immediately if source leaves field/faints
    if (!source.isActive(true)) {
      return false;
    }

    // Custom message in lieu of an animation in mainline
    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:syrupBombLapse", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
    globalScene.phaseManager.unshiftNew(
      "StatStageChangePhase",
      pokemon.getBattlerIndex(),
      true,
      [Stat.SPD],
      -1,
      true,
      false,
      true,
    );
    return super.lapse(pokemon, _lapseType);
  }
}

/**
 * Telekinesis raises the target into the air for three turns and causes all moves used against the target (aside from OHKO moves) to hit the target unless the target is in a semi-invulnerable state from Fly/Dig.
 * The first effect is provided by {@linkcode FloatingTag}, the accuracy-bypass effect is provided by TelekinesisTag
 * The effects of Telekinesis can be baton passed to a teammate.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Telekinesis_(move) | MoveId.TELEKINESIS}
 */
export class TelekinesisTag extends SerializableBattlerTag {
  public override readonly tagType = BattlerTagType.TELEKINESIS;
  constructor(sourceMove: MoveId) {
    super(
      BattlerTagType.TELEKINESIS,
      [BattlerTagLapseType.PRE_MOVE, BattlerTagLapseType.AFTER_MOVE],
      3,
      sourceMove,
      undefined,
      true,
    );
  }

  override onAdd(pokemon: Pokemon) {
    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:telekinesisOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
  }
}

/**
 * Tag that swaps the user's base ATK stat with its base DEF stat.
 */
export class PowerTrickTag extends SerializableBattlerTag {
  public override readonly tagType = BattlerTagType.POWER_TRICK;
  constructor(sourceMove: MoveId, sourceId: number) {
    super(BattlerTagType.POWER_TRICK, BattlerTagLapseType.CUSTOM, 0, sourceMove, sourceId, true);
  }

  onAdd(pokemon: Pokemon): void {
    this.swapStat(pokemon);
    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:powerTrickActive", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
  }

  onRemove(pokemon: Pokemon): void {
    this.swapStat(pokemon);
    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:powerTrickActive", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
  }

  /**
   * Removes the Power Trick tag and reverts any stat changes if the tag is already applied.
   * @param pokemon - The {@linkcode Pokemon} that already has the Power Trick tag.
   */
  onOverlap(pokemon: Pokemon): void {
    pokemon.removeTag(this.tagType);
  }

  /**
   * Swaps the user's base ATK stat with its base DEF stat.
   * @param pokemon - The {@linkcode Pokemon} whose stats will be swapped.
   */
  swapStat(pokemon: Pokemon): void {
    const temp = pokemon.getStat(Stat.ATK, false);
    pokemon.setStat(Stat.ATK, pokemon.getStat(Stat.DEF, false), false);
    pokemon.setStat(Stat.DEF, temp, false);
  }
}

/**
 * Tag associated with the move Grudge.
 * If this tag is active when the bearer faints from an opponent's move, the tag reduces that move's PP to 0.
 * Otherwise, it lapses when the bearer makes another move.
 */
export class GrudgeTag extends SerializableBattlerTag {
  public override readonly tagType = BattlerTagType.GRUDGE;
  constructor() {
    super(BattlerTagType.GRUDGE, [BattlerTagLapseType.CUSTOM, BattlerTagLapseType.PRE_MOVE], 1, MoveId.GRUDGE);
  }

  onAdd(pokemon: Pokemon) {
    super.onAdd(pokemon);
    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:grudgeOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
  }

  /**
   * Activates Grudge's special effect on the attacking Pokemon and lapses the tag.
   * @param pokemon
   * @param lapseType
   * @param sourcePokemon - The source of the move that fainted the tag's bearer
   * @returns `false` if Grudge activates its effect or lapses
   */
  // TODO: Confirm whether this should interact with copying moves
  override lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType, sourcePokemon?: Pokemon): boolean {
    if (lapseType === BattlerTagLapseType.CUSTOM && sourcePokemon) {
      if (sourcePokemon.isActive() && pokemon.isOpponent(sourcePokemon)) {
        const lastMove = pokemon.turnData.attacksReceived[0];
        const lastMoveData = sourcePokemon.getMoveset().find(m => m.moveId === lastMove.move);
        if (lastMoveData && lastMove.move !== MoveId.STRUGGLE) {
          lastMoveData.ppUsed = lastMoveData.getMovePp();
          globalScene.phaseManager.queueMessage(
            i18next.t("battlerTags:grudgeLapse", {
              pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
              moveName: lastMoveData.getName(),
            }),
          );
        }
      }
      return false;
    }
    return super.lapse(pokemon, lapseType);
  }
}

/**
 * Tag used to heal the user of Psycho Shift of its status effect if Psycho Shift succeeds in transferring its status effect to the target Pokemon
 */
export class PsychoShiftTag extends BattlerTag {
  public override readonly tagType = BattlerTagType.PSYCHO_SHIFT;
  constructor() {
    super(BattlerTagType.PSYCHO_SHIFT, BattlerTagLapseType.AFTER_MOVE, 1, MoveId.PSYCHO_SHIFT);
  }

  /**
   * Heals Psycho Shift's user of its status effect after it uses a move
   * @returns `false` to expire the tag immediately
   */
  override lapse(pokemon: Pokemon, _lapseType: BattlerTagLapseType): boolean {
    if (pokemon.status && pokemon.isActive(true)) {
      globalScene.phaseManager.queueMessage(
        getStatusEffectHealText(pokemon.status.effect, getPokemonNameWithAffix(pokemon)),
      );
      pokemon.resetStatus();
      pokemon.updateInfo();
    }
    return false;
  }
}

/**
 * Tag associated with the move Magic Coat.
 */
export class MagicCoatTag extends BattlerTag {
  public override readonly tagType = BattlerTagType.MAGIC_COAT;
  constructor() {
    super(BattlerTagType.MAGIC_COAT, BattlerTagLapseType.TURN_END, 1, MoveId.MAGIC_COAT);
  }

  /**
   * Queues the "[PokemonName] shrouded itself with Magic Coat" message when the tag is added.
   * @param pokemon - The target {@linkcode Pokemon}
   */
  override onAdd(pokemon: Pokemon) {
    // "{pokemonNameWithAffix} shrouded itself with Magic Coat!"
    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:magicCoatOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
  }
}

/**
 * Retrieves a {@linkcode BattlerTag} based on the provided tag type, turn count, source move, and source ID.
 * @param sourceId - The ID of the pokemon adding the tag
 * @returns The corresponding {@linkcode BattlerTag} object.
 */
export function getBattlerTag(
  tagType: BattlerTagType,
  turnCount: number,
  sourceMove: MoveId,
  sourceId: number,
): BattlerTag {
  switch (tagType) {
    case BattlerTagType.RECHARGING:
      return new RechargingTag(sourceMove);
    case BattlerTagType.BEAK_BLAST_CHARGING:
      return new BeakBlastChargingTag();
    case BattlerTagType.SHELL_TRAP:
      return new ShellTrapTag();
    case BattlerTagType.FLINCHED:
      return new FlinchedTag(sourceMove);
    case BattlerTagType.INTERRUPTED:
      return new InterruptedTag(sourceMove);
    case BattlerTagType.CONFUSED:
      return new ConfusedTag(turnCount, sourceMove);
    case BattlerTagType.INFATUATED:
      return new InfatuatedTag(sourceMove, sourceId);
    case BattlerTagType.SEEDED:
      return new SeedTag(sourceId);
    case BattlerTagType.POWDER:
      return new PowderTag();
    case BattlerTagType.NIGHTMARE:
      return new NightmareTag();
    case BattlerTagType.FRENZY:
      return new FrenzyTag(turnCount, sourceMove, sourceId);
    case BattlerTagType.CHARGING:
      return new SerializableBattlerTag(tagType, BattlerTagLapseType.CUSTOM, 1, sourceMove, sourceId);
    case BattlerTagType.ENCORE:
      return new EncoreTag(sourceId);
    case BattlerTagType.HELPING_HAND:
      return new HelpingHandTag(sourceId);
    case BattlerTagType.INGRAIN:
      return new IngrainTag(sourceId);
    case BattlerTagType.AQUA_RING:
      return new AquaRingTag();
    case BattlerTagType.DROWSY:
      return new DrowsyTag();
    case BattlerTagType.TRAPPED:
      return new TrappedTag(tagType, BattlerTagLapseType.CUSTOM, turnCount, sourceMove, sourceId);
    case BattlerTagType.NO_RETREAT:
      return new NoRetreatTag(sourceId);
    case BattlerTagType.BIND:
      return new BindTag(turnCount, sourceId);
    case BattlerTagType.WRAP:
      return new WrapTag(turnCount, sourceId);
    case BattlerTagType.FIRE_SPIN:
      return new FireSpinTag(turnCount, sourceId);
    case BattlerTagType.WHIRLPOOL:
      return new WhirlpoolTag(turnCount, sourceId);
    case BattlerTagType.CLAMP:
      return new ClampTag(turnCount, sourceId);
    case BattlerTagType.SAND_TOMB:
      return new SandTombTag(turnCount, sourceId);
    case BattlerTagType.MAGMA_STORM:
      return new MagmaStormTag(turnCount, sourceId);
    case BattlerTagType.SNAP_TRAP:
      return new SnapTrapTag(turnCount, sourceId);
    case BattlerTagType.THUNDER_CAGE:
      return new ThunderCageTag(turnCount, sourceId);
    case BattlerTagType.INFESTATION:
      return new InfestationTag(turnCount, sourceId);
    case BattlerTagType.PROTECTED:
      return new ProtectedTag(sourceMove);
    case BattlerTagType.SPIKY_SHIELD:
      return new ContactDamageProtectedTag(sourceMove, 8);
    case BattlerTagType.KINGS_SHIELD:
      return new ContactStatStageChangeProtectedTag(sourceMove, tagType, Stat.ATK, -1);
    case BattlerTagType.OBSTRUCT:
      return new ContactStatStageChangeProtectedTag(sourceMove, tagType, Stat.DEF, -2);
    case BattlerTagType.SILK_TRAP:
      return new ContactStatStageChangeProtectedTag(sourceMove, tagType, Stat.SPD, -1);
    case BattlerTagType.BANEFUL_BUNKER:
      return new ContactSetStatusProtectedTag(sourceMove, tagType, StatusEffect.POISON);
    case BattlerTagType.BURNING_BULWARK:
      return new ContactSetStatusProtectedTag(sourceMove, tagType, StatusEffect.BURN);
    case BattlerTagType.ENDURING:
      return new EnduringTag(tagType, BattlerTagLapseType.TURN_END, sourceMove);
    case BattlerTagType.ENDURE_TOKEN:
      return new EnduringTag(tagType, BattlerTagLapseType.AFTER_HIT, sourceMove);
    case BattlerTagType.STURDY:
      return new SturdyTag(sourceMove);
    case BattlerTagType.PERISH_SONG:
      return new PerishSongTag(turnCount);
    case BattlerTagType.CENTER_OF_ATTENTION:
      return new CenterOfAttentionTag(sourceMove);
    case BattlerTagType.TRUANT:
      return new TruantTag();
    case BattlerTagType.SLOW_START:
      return new SlowStartTag();
    case BattlerTagType.PROTOSYNTHESIS:
      return new WeatherHighestStatBoostTag(
        tagType,
        AbilityId.PROTOSYNTHESIS,
        WeatherType.SUNNY,
        WeatherType.HARSH_SUN,
      );
    case BattlerTagType.QUARK_DRIVE:
      return new TerrainHighestStatBoostTag(tagType, AbilityId.QUARK_DRIVE, TerrainType.ELECTRIC);
    case BattlerTagType.FLYING:
    case BattlerTagType.UNDERGROUND:
    case BattlerTagType.UNDERWATER:
    case BattlerTagType.HIDDEN:
      return new SemiInvulnerableTag(tagType, turnCount, sourceMove);
    case BattlerTagType.FIRE_BOOST:
      return new TypeBoostTag(tagType, sourceMove, PokemonType.FIRE, 1.5, false);
    case BattlerTagType.CRIT_BOOST:
    case BattlerTagType.DRAGON_CHEER:
      return new CritBoostTag(tagType, sourceMove);
    case BattlerTagType.ALWAYS_CRIT:
    case BattlerTagType.IGNORE_ACCURACY:
      return new SerializableBattlerTag(tagType, BattlerTagLapseType.TURN_END, 2, sourceMove);
    case BattlerTagType.ALWAYS_GET_HIT:
    case BattlerTagType.RECEIVE_DOUBLE_DAMAGE:
      return new SerializableBattlerTag(tagType, BattlerTagLapseType.PRE_MOVE, 1, sourceMove);
    case BattlerTagType.BYPASS_SLEEP:
      return new BattlerTag(tagType, BattlerTagLapseType.TURN_END, turnCount, sourceMove);
    case BattlerTagType.IGNORE_FLYING:
      return new GroundedTag(tagType, BattlerTagLapseType.CUSTOM, sourceMove);
    case BattlerTagType.ROOSTED:
      return new RoostedTag();
    case BattlerTagType.BURNED_UP:
      return new RemovedTypeTag(tagType, BattlerTagLapseType.CUSTOM, sourceMove);
    case BattlerTagType.DOUBLE_SHOCKED:
      return new RemovedTypeTag(tagType, BattlerTagLapseType.CUSTOM, sourceMove);
    case BattlerTagType.SALT_CURED:
      return new SaltCuredTag(sourceId);
    case BattlerTagType.CURSED:
      return new CursedTag(sourceId);
    case BattlerTagType.CHARGED:
      return new TypeBoostTag(tagType, sourceMove, PokemonType.ELECTRIC, 2, true);
    case BattlerTagType.FLOATING:
      return new FloatingTag(tagType, sourceMove, turnCount);
    case BattlerTagType.MINIMIZED:
      return new MinimizeTag();
    case BattlerTagType.DESTINY_BOND:
      return new DestinyBondTag(sourceMove, sourceId);
    case BattlerTagType.ICE_FACE:
      return new IceFaceBlockDamageTag(tagType);
    case BattlerTagType.DISGUISE:
      return new FormBlockDamageTag(tagType);
    case BattlerTagType.COMMANDED:
      return new CommandedTag(sourceId);
    case BattlerTagType.STOCKPILING:
      return new StockpilingTag(sourceMove);
    case BattlerTagType.OCTOLOCK:
      return new OctolockTag(sourceId);
    case BattlerTagType.DISABLED:
      return new DisabledTag(sourceId);
    case BattlerTagType.IGNORE_GHOST:
      return new ExposedTag(tagType, sourceMove, PokemonType.GHOST, [PokemonType.NORMAL, PokemonType.FIGHTING]);
    case BattlerTagType.IGNORE_DARK:
      return new ExposedTag(tagType, sourceMove, PokemonType.DARK, [PokemonType.PSYCHIC]);
    case BattlerTagType.GULP_MISSILE_ARROKUDA:
    case BattlerTagType.GULP_MISSILE_PIKACHU:
      return new GulpMissileTag(tagType, sourceMove);
    case BattlerTagType.TAR_SHOT:
      return new TarShotTag();
    case BattlerTagType.ELECTRIFIED:
      return new ElectrifiedTag();
    case BattlerTagType.THROAT_CHOPPED:
      return new ThroatChoppedTag();
    case BattlerTagType.GORILLA_TACTICS:
      return new GorillaTacticsTag();
    case BattlerTagType.UNBURDEN:
      return new UnburdenTag();
    case BattlerTagType.SUBSTITUTE:
      return new SubstituteTag(sourceMove, sourceId);
    case BattlerTagType.AUTOTOMIZED:
      return new AutotomizedTag();
    case BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON:
      return new MysteryEncounterPostSummonTag();
    case BattlerTagType.HEAL_BLOCK:
      return new HealBlockTag(turnCount, sourceMove);
    case BattlerTagType.TORMENT:
      return new TormentTag(sourceId);
    case BattlerTagType.TAUNT:
      return new TauntTag();
    case BattlerTagType.IMPRISON:
      return new ImprisonTag(sourceId);
    case BattlerTagType.SYRUP_BOMB:
      return new SyrupBombTag(sourceId);
    case BattlerTagType.TELEKINESIS:
      return new TelekinesisTag(sourceMove);
    case BattlerTagType.POWER_TRICK:
      return new PowerTrickTag(sourceMove, sourceId);
    case BattlerTagType.GRUDGE:
      return new GrudgeTag();
    case BattlerTagType.PSYCHO_SHIFT:
      return new PsychoShiftTag();
    case BattlerTagType.MAGIC_COAT:
      return new MagicCoatTag();
  }
}

/**
 * When given a battler tag or json representing one, creates an actual BattlerTag object with the same data.
 * @param source - An object containing the data necessary to reconstruct the BattlerTag.
 * @returns The valid battler tag
 */
export function loadBattlerTag(source: BattlerTag | BattlerTagData): BattlerTag {
  // TODO: Remove this bang by fixing the signature of `getBattlerTag`
  // to allow undefined sourceIds and sourceMoves (with appropriate fallback for tags that require it)
  const tag = getBattlerTag(source.tagType, source.turnCount, source.sourceMove!, source.sourceId!);
  tag.loadTag(source);
  return tag;
}

/**
 * Helper function to verify that the current phase is a MoveEffectPhase and provide quick access to commonly used fields
 *
 * @param _pokemon - The Pokémon used to access the current phase (unused)
 * @returns `null` if current phase is not MoveEffectPhase, otherwise Object containing the {@linkcode MoveEffectPhase}, and its
 * corresponding {@linkcode Move} and user {@linkcode Pokemon}
 */
function getMoveEffectPhaseData(_pokemon: Pokemon): { phase: MoveEffectPhase; attacker: Pokemon; move: Move } | null {
  const phase = globalScene.phaseManager.getCurrentPhase();
  if (phase?.is("MoveEffectPhase")) {
    return {
      phase,
      attacker: phase.getPokemon(),
      move: phase.move,
    };
  }
  return null;
}

/**
 * Map from {@linkcode BattlerTagType} to the corresponding {@linkcode BattlerTag} class.
 */
export type BattlerTagTypeMap = {
  [BattlerTagType.RECHARGING]: RechargingTag;
  [BattlerTagType.SHELL_TRAP]: ShellTrapTag;
  [BattlerTagType.FLINCHED]: FlinchedTag;
  [BattlerTagType.INTERRUPTED]: InterruptedTag;
  [BattlerTagType.CONFUSED]: ConfusedTag;
  [BattlerTagType.INFATUATED]: InfatuatedTag;
  [BattlerTagType.SEEDED]: SeedTag;
  [BattlerTagType.POWDER]: PowderTag;
  [BattlerTagType.NIGHTMARE]: NightmareTag;
  [BattlerTagType.FRENZY]: FrenzyTag;
  [BattlerTagType.CHARGING]: GenericSerializableBattlerTag<BattlerTagType.CHARGING>;
  [BattlerTagType.ENCORE]: EncoreTag;
  [BattlerTagType.HELPING_HAND]: HelpingHandTag;
  [BattlerTagType.INGRAIN]: IngrainTag;
  [BattlerTagType.AQUA_RING]: AquaRingTag;
  [BattlerTagType.DROWSY]: DrowsyTag;
  [BattlerTagType.TRAPPED]: TrappedTag;
  [BattlerTagType.NO_RETREAT]: NoRetreatTag;
  [BattlerTagType.BIND]: BindTag;
  [BattlerTagType.WRAP]: WrapTag;
  [BattlerTagType.FIRE_SPIN]: FireSpinTag;
  [BattlerTagType.WHIRLPOOL]: WhirlpoolTag;
  [BattlerTagType.CLAMP]: ClampTag;
  [BattlerTagType.SAND_TOMB]: SandTombTag;
  [BattlerTagType.MAGMA_STORM]: MagmaStormTag;
  [BattlerTagType.SNAP_TRAP]: SnapTrapTag;
  [BattlerTagType.THUNDER_CAGE]: ThunderCageTag;
  [BattlerTagType.INFESTATION]: InfestationTag;
  [BattlerTagType.PROTECTED]: ProtectedTag;
  [BattlerTagType.SPIKY_SHIELD]: ContactDamageProtectedTag;
  [BattlerTagType.KINGS_SHIELD]: ContactStatStageChangeProtectedTag;
  [BattlerTagType.OBSTRUCT]: ContactStatStageChangeProtectedTag;
  [BattlerTagType.SILK_TRAP]: ContactStatStageChangeProtectedTag;
  [BattlerTagType.BANEFUL_BUNKER]: ContactSetStatusProtectedTag;
  [BattlerTagType.BURNING_BULWARK]: ContactSetStatusProtectedTag;
  [BattlerTagType.ENDURING]: EnduringTag;
  [BattlerTagType.ENDURE_TOKEN]: EnduringTag;
  [BattlerTagType.STURDY]: SturdyTag;
  [BattlerTagType.PERISH_SONG]: PerishSongTag;
  [BattlerTagType.CENTER_OF_ATTENTION]: CenterOfAttentionTag;
  [BattlerTagType.TRUANT]: TruantTag;
  [BattlerTagType.SLOW_START]: SlowStartTag;
  [BattlerTagType.PROTOSYNTHESIS]: WeatherHighestStatBoostTag;
  [BattlerTagType.QUARK_DRIVE]: TerrainHighestStatBoostTag;
  [BattlerTagType.FLYING]: SemiInvulnerableTag;
  [BattlerTagType.UNDERGROUND]: SemiInvulnerableTag;
  [BattlerTagType.UNDERWATER]: SemiInvulnerableTag;
  [BattlerTagType.HIDDEN]: SemiInvulnerableTag;
  [BattlerTagType.FIRE_BOOST]: TypeBoostTag;
  [BattlerTagType.CRIT_BOOST]: CritBoostTag;
  [BattlerTagType.DRAGON_CHEER]: CritBoostTag;
  [BattlerTagType.ALWAYS_CRIT]: GenericSerializableBattlerTag<BattlerTagType.ALWAYS_CRIT>;
  [BattlerTagType.IGNORE_ACCURACY]: GenericSerializableBattlerTag<BattlerTagType.IGNORE_ACCURACY>;
  [BattlerTagType.ALWAYS_GET_HIT]: GenericSerializableBattlerTag<BattlerTagType.ALWAYS_GET_HIT>;
  [BattlerTagType.RECEIVE_DOUBLE_DAMAGE]: GenericSerializableBattlerTag<BattlerTagType.RECEIVE_DOUBLE_DAMAGE>;
  [BattlerTagType.BYPASS_SLEEP]: BattlerTag;
  [BattlerTagType.IGNORE_FLYING]: GroundedTag;
  [BattlerTagType.ROOSTED]: RoostedTag;
  [BattlerTagType.BURNED_UP]: RemovedTypeTag;
  [BattlerTagType.DOUBLE_SHOCKED]: RemovedTypeTag;
  [BattlerTagType.SALT_CURED]: SaltCuredTag;
  [BattlerTagType.CURSED]: CursedTag;
  [BattlerTagType.CHARGED]: TypeBoostTag;
  [BattlerTagType.FLOATING]: FloatingTag;
  [BattlerTagType.MINIMIZED]: MinimizeTag;
  [BattlerTagType.DESTINY_BOND]: DestinyBondTag;
  [BattlerTagType.ICE_FACE]: IceFaceBlockDamageTag;
  [BattlerTagType.DISGUISE]: FormBlockDamageTag;
  [BattlerTagType.COMMANDED]: CommandedTag;
  [BattlerTagType.STOCKPILING]: StockpilingTag;
  [BattlerTagType.OCTOLOCK]: OctolockTag;
  [BattlerTagType.DISABLED]: DisabledTag;
  [BattlerTagType.IGNORE_GHOST]: ExposedTag;
  [BattlerTagType.IGNORE_DARK]: ExposedTag;
  [BattlerTagType.GULP_MISSILE_ARROKUDA]: GulpMissileTag;
  [BattlerTagType.GULP_MISSILE_PIKACHU]: GulpMissileTag;
  [BattlerTagType.BEAK_BLAST_CHARGING]: BeakBlastChargingTag;
  [BattlerTagType.TAR_SHOT]: TarShotTag;
  [BattlerTagType.ELECTRIFIED]: ElectrifiedTag;
  [BattlerTagType.THROAT_CHOPPED]: ThroatChoppedTag;
  [BattlerTagType.GORILLA_TACTICS]: GorillaTacticsTag;
  [BattlerTagType.UNBURDEN]: UnburdenTag;
  [BattlerTagType.SUBSTITUTE]: SubstituteTag;
  [BattlerTagType.AUTOTOMIZED]: AutotomizedTag;
  [BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON]: MysteryEncounterPostSummonTag;
  [BattlerTagType.HEAL_BLOCK]: HealBlockTag;
  [BattlerTagType.TORMENT]: TormentTag;
  [BattlerTagType.TAUNT]: TauntTag;
  [BattlerTagType.IMPRISON]: ImprisonTag;
  [BattlerTagType.SYRUP_BOMB]: SyrupBombTag;
  [BattlerTagType.TELEKINESIS]: TelekinesisTag;
  [BattlerTagType.POWER_TRICK]: PowerTrickTag;
  [BattlerTagType.GRUDGE]: GrudgeTag;
  [BattlerTagType.PSYCHO_SHIFT]: PsychoShiftTag;
  [BattlerTagType.MAGIC_COAT]: MagicCoatTag;
};
