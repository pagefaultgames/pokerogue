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
import { BattlerTagLapseType } from "#enums/battler-tag-lapse-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { HitResult } from "#enums/hit-result";
import { MoveCategory } from "#enums/MoveCategory";
import { MoveFlags } from "#enums/MoveFlags";
import { ChargeAnim, CommonAnim } from "#enums/move-anims-common";
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
import { BooleanHolder, coerceArray, getFrameMs, isNullOrUndefined, NumberHolder, toDmgValue } from "#utils/common";

/**
 * A {@linkcode BattlerTag} represents a semi-persistent effect that can be attached to a {@linkcode Pokemon}.
 * Tags can trigger various effects throughout a turn, and are cleared on switching out
 * or through their respective {@linkcode BattlerTag.lapse | lapse} methods.
 */
export class BattlerTag {
  public tagType: BattlerTagType;
  public lapseTypes: BattlerTagLapseType[];
  public turnCount: number;
  public sourceMove: MoveId;
  public sourceId?: number;
  public isBatonPassable: boolean;

  constructor(
    tagType: BattlerTagType,
    lapseType: BattlerTagLapseType | BattlerTagLapseType[],
    turnCount: number,
    sourceMove?: MoveId,
    sourceId?: number,
    isBatonPassable = false,
  ) {
    this.tagType = tagType;
    this.lapseTypes = coerceArray(lapseType);
    this.turnCount = turnCount;
    this.sourceMove = sourceMove!; // TODO: is this bang correct?
    this.sourceId = sourceId;
    this.isBatonPassable = isBatonPassable;
  }

  canAdd(_pokemon: Pokemon): boolean {
    return true;
  }

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
   * @param source The battler tag to load
   */
  loadTag(source: BattlerTag | any): void {
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

export interface WeatherBattlerTag {
  weatherTypes: WeatherType[];
}

export interface TerrainBattlerTag {
  terrainTypes: TerrainType[];
}

/**
 * Base class for tags that restrict the usage of moves. This effect is generally referred to as "disabling" a move
 * in-game (not to be confused with {@linkcode MoveId.DISABLE}).
 *
 * Descendants can override {@linkcode isMoveRestricted} to restrict moves that
 * match a condition. A restricted move gets cancelled before it is used.
 * Players and enemies should not be allowed to select restricted moves.
 */
export abstract class MoveRestrictionBattlerTag extends BattlerTag {
  /** @override */
  override lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    if (lapseType === BattlerTagLapseType.PRE_MOVE) {
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

    return super.lapse(pokemon, lapseType);
  }

  /**
   * Gets whether this tag is restricting a move.
   *
   * @param move - {@linkcode MoveId} ID to check restriction for.
   * @param user - The {@linkcode Pokemon} involved
   * @returns `true` if the move is restricted by this tag, otherwise `false`.
   */
  public abstract isMoveRestricted(move: MoveId, user?: Pokemon): boolean;

  /**
   * Checks if this tag is restricting a move based on a user's decisions during the target selection phase
   *
   * @param {MoveId} _move {@linkcode MoveId} move ID to check restriction for
   * @param {Pokemon} _user {@linkcode Pokemon} the user of the above move
   * @param {Pokemon} _target {@linkcode Pokemon} the target of the above move
   * @returns {boolean} `false` unless overridden by the child tag
   */
  isMoveTargetRestricted(_move: MoveId, _user: Pokemon, _target: Pokemon): boolean {
    return false;
  }

  /**
   * Gets the text to display when the player attempts to select a move that is restricted by this tag.
   *
   * @param {Pokemon} pokemon {@linkcode Pokemon} for which the player is attempting to select the restricted move
   * @param {MoveId} move {@linkcode MoveId} ID of the move that is having its selection denied
   * @returns {string} text to display when the player attempts to select the restricted move
   */
  abstract selectionDeniedText(pokemon: Pokemon, move: MoveId): string;

  /**
   * Gets the text to display when a move's execution is prevented as a result of the restriction.
   * Because restriction effects also prevent selection of the move, this situation can only arise if a
   * pokemon first selects a move, then gets outsped by a pokemon using a move that restricts the selected move.
   *
   * @param {Pokemon} _pokemon {@linkcode Pokemon} attempting to use the restricted move
   * @param {MoveId} _move {@linkcode MoveId} ID of the move being interrupted
   * @returns {string} text to display when the move is interrupted
   */
  interruptedText(_pokemon: Pokemon, _move: MoveId): string {
    return "";
  }
}

/**
 * Tag representing the "Throat Chop" effect. Pokemon with this tag cannot use sound-based moves.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Throat_Chop_(move) | Throat Chop}
 * @extends MoveRestrictionBattlerTag
 */
export class ThroatChoppedTag extends MoveRestrictionBattlerTag {
  constructor() {
    super(
      BattlerTagType.THROAT_CHOPPED,
      [BattlerTagLapseType.TURN_END, BattlerTagLapseType.PRE_MOVE],
      2,
      MoveId.THROAT_CHOP,
    );
  }

  /**
   * Checks if a {@linkcode MoveId | move} is restricted by Throat Chop.
   * @override
   * @param {MoveId} move the {@linkcode MoveId | move} to check for sound-based restriction
   * @returns true if the move is sound-based
   */
  override isMoveRestricted(move: MoveId): boolean {
    return allMoves[move].hasFlag(MoveFlags.SOUND_BASED);
  }

  /**
   * Shows a message when the player attempts to select a move that is restricted by Throat Chop.
   * @override
   * @param {Pokemon} _pokemon the {@linkcode Pokemon} that is attempting to select the restricted move
   * @param {MoveId} move the {@linkcode MoveId | move} that is being restricted
   * @returns the message to display when the player attempts to select the restricted move
   */
  override selectionDeniedText(_pokemon: Pokemon, move: MoveId): string {
    return i18next.t("battle:moveCannotBeSelected", {
      moveName: allMoves[move].name,
    });
  }

  /**
   * Shows a message when a move is interrupted by Throat Chop.
   * @override
   * @param {Pokemon} pokemon the interrupted {@linkcode Pokemon}
   * @param {MoveId} _move the {@linkcode MoveId | move} that was interrupted
   * @returns the message to display when the move is interrupted
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
 */
export class DisabledTag extends MoveRestrictionBattlerTag {
  /** The move being disabled. Gets set when {@linkcode onAdd} is called for this tag. */
  private moveId: MoveId = MoveId.NONE;

  constructor(sourceId: number) {
    super(
      BattlerTagType.DISABLED,
      [BattlerTagLapseType.PRE_MOVE, BattlerTagLapseType.TURN_END],
      4,
      MoveId.DISABLE,
      sourceId,
    );
  }

  /** @override */
  override isMoveRestricted(move: MoveId): boolean {
    return move === this.moveId;
  }

  /**
   * @override
   *
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
    this.moveId = move.move;

    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:disabledOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        moveName: allMoves[this.moveId].name,
      }),
    );
  }

  /** @override */
  override onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);

    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:disabledLapse", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        moveName: allMoves[this.moveId].name,
      }),
    );
  }

  /** @override */
  override selectionDeniedText(_pokemon: Pokemon, move: MoveId): string {
    return i18next.t("battle:moveDisabled", { moveName: allMoves[move].name });
  }

  /**
   * @override
   * @param {Pokemon} pokemon {@linkcode Pokemon} attempting to use the restricted move
   * @param {MoveId} move {@linkcode MoveId} ID of the move being interrupted
   * @returns {string} text to display when the move is interrupted
   */
  override interruptedText(pokemon: Pokemon, move: MoveId): string {
    return i18next.t("battle:disableInterruptedMove", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      moveName: allMoves[move].name,
    });
  }

  /** @override */
  override loadTag(source: BattlerTag | any): void {
    super.loadTag(source);
    this.moveId = source.moveId;
  }
}

/**
 * Tag used by Gorilla Tactics to restrict the user to using only one move.
 */
export class GorillaTacticsTag extends MoveRestrictionBattlerTag {
  private moveId = MoveId.NONE;

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
    this.moveId = pokemon.getLastNonVirtualMove()!.move;
    pokemon.setStat(Stat.ATK, pokemon.getStat(Stat.ATK, false) * 1.5, false);
  }

  /**
   * Loads the Gorilla Tactics Battler Tag along with its unique class variable moveId
   * @override
   * @param source Gorilla Tactics' {@linkcode BattlerTag} information
   */
  public override loadTag(source: BattlerTag | any): void {
    super.loadTag(source);
    this.moveId = source.moveId;
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
export class RechargingTag extends BattlerTag {
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
   * @param pokemon {@linkcode Pokemon} the owner of this tag
   * @param lapseType {@linkcode BattlerTagLapseType} the type of functionality invoked in battle
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
        phaseData.attacker.trySetStatus(StatusEffect.BURN, true, pokemon);
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
   * @param pokemon {@linkcode Pokemon} the owner of this tag
   * @param lapseType {@linkcode BattlerTagLapseType} the type of functionality invoked in battle
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

export class TrappedTag extends BattlerTag {
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

    const move = allMoves[this.sourceMove];
    const isGhost = pokemon.isOfType(PokemonType.GHOST);
    const isTrapped = pokemon.getTag(TrappedTag);
    const hasSubstitute = move.hitsSubstitute(source, pokemon);

    return !isTrapped && !isGhost && !hasSubstitute;
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
 * @extends TrappedTag
 */
class NoRetreatTag extends TrappedTag {
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
export class ConfusedTag extends BattlerTag {
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
 * @extends BattlerTag
 * @see {@linkcode apply}
 */
export class DestinyBondTag extends BattlerTag {
  constructor(sourceMove: MoveId, sourceId: number) {
    super(BattlerTagType.DESTINY_BOND, BattlerTagLapseType.PRE_MOVE, 1, sourceMove, sourceId, true);
  }

  /**
   * Lapses either before the user's move and does nothing
   * or after receiving fatal damage. When the damage is fatal,
   * the attacking Pokemon is taken down as well, unless it's a boss.
   *
   * @param {Pokemon} pokemon Pokemon that is attacking the Destiny Bond user.
   * @param {BattlerTagLapseType} lapseType CUSTOM or PRE_MOVE
   * @returns false if the tag source fainted or one turn has passed since the application
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

export class InfatuatedTag extends BattlerTag {
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

export class SeedTag extends BattlerTag {
  private sourceIndex: number;

  constructor(sourceId: number) {
    super(BattlerTagType.SEEDED, BattlerTagLapseType.TURN_END, 1, MoveId.LEECH_SEED, sourceId, true);
  }

  /**
   * When given a battler tag or json representing one, load the data for it.
   * @param {BattlerTag | any} source A battler tag
   */
  loadTag(source: BattlerTag | any): void {
    super.loadTag(source);
    this.sourceIndex = source.sourceIndex;
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
    this.sourceIndex = source.getBattlerIndex();
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);

    if (!ret) {
      return false;
    }

    // Check which opponent to restore HP to
    const source = pokemon.getOpponents().find(o => o.getBattlerIndex() === this.sourceIndex);
    if (!source) {
      console.warn(`Failed to get source Pokemon for SeedTag lapse; id: ${this.sourceId}`);
      return false;
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
 * Pokemon takes damage equal to 1/4 of it's maximum HP (rounded down).
 */
export class PowderTag extends BattlerTag {
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
      pokemon.getMoveType(move) !== PokemonType.FIRE ||
      (weather?.weatherType === WeatherType.HEAVY_RAIN && !weather.isEffectSuppressed()) // Heavy rain takes priority over powder
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

export class NightmareTag extends BattlerTag {
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

export class FrenzyTag extends BattlerTag {
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
 */
export class EncoreTag extends MoveRestrictionBattlerTag {
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

  loadTag(source: BattlerTag | any): void {
    super.loadTag(source);
    this.moveId = source.moveId as MoveId;
  }

  canAdd(pokemon: Pokemon): boolean {
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

  onAdd(pokemon: Pokemon): void {
    // TODO: shouldn't this be `onAdd`?
    super.onRemove(pokemon);

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
   * @param move {@linkcode MoveId} the move selected
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
 * @extends TrappedTag
 */
export class IngrainTag extends TrappedTag {
  constructor(sourceId: number) {
    super(BattlerTagType.INGRAIN, BattlerTagLapseType.TURN_END, 1, MoveId.INGRAIN, sourceId);
  }

  /**
   * Check if the Ingrain tag can be added to the pokemon
   * @param pokemon {@linkcode Pokemon} The pokemon to check if the tag can be added to
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

export class AquaRingTag extends BattlerTag {
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
export class MinimizeTag extends BattlerTag {
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

export class DrowsyTag extends BattlerTag {
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
      pokemon.trySetStatus(StatusEffect.SLEEP, true);
      return false;
    }

    return true;
  }

  getDescriptor(): string {
    return i18next.t("battlerTags:drowsyDesc");
  }
}

export abstract class DamagingTrapTag extends TrappedTag {
  private commonAnim: CommonAnim;

  constructor(
    tagType: BattlerTagType,
    commonAnim: CommonAnim,
    turnCount: number,
    sourceMove: MoveId,
    sourceId: number,
  ) {
    super(tagType, BattlerTagLapseType.TURN_END, turnCount, sourceMove, sourceId);

    this.commonAnim = commonAnim;
  }

  /**
   * When given a battler tag or json representing one, load the data for it.
   * @param {BattlerTag | any} source A battler tag
   */
  loadTag(source: BattlerTag | any): void {
    super.loadTag(source);
    this.commonAnim = source.commonAnim as CommonAnim;
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
      phaseManager.unshiftNew("CommonAnimPhase", pokemon.getBattlerIndex(), undefined, this.commonAnim);

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
  constructor(turnCount: number, sourceId: number) {
    super(BattlerTagType.FIRE_SPIN, CommonAnim.FIRE_SPIN, turnCount, MoveId.FIRE_SPIN, sourceId);
  }
}

export class WhirlpoolTag extends VortexTrapTag {
  constructor(turnCount: number, sourceId: number) {
    super(BattlerTagType.WHIRLPOOL, CommonAnim.WHIRLPOOL, turnCount, MoveId.WHIRLPOOL, sourceId);
  }
}

export class ClampTag extends DamagingTrapTag {
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
  constructor(sourceMove: MoveId, tagType: BattlerTagType = BattlerTagType.PROTECTED) {
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
export class ContactProtectedTag extends ProtectedTag {
  /**
   * Function to call when a contact move hits the pokemon with this tag.
   * @param _attacker - The pokemon using the contact move
   * @param _user - The pokemon that is being attacked and has the tag
   * @param _move - The move used by the attacker
   */
  onContact(_attacker: Pokemon, _user: Pokemon) {}

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
      lapseType === BattlerTagLapseType.CUSTOM &&
      moveData &&
      moveData.move.doesFlagEffectApply({ flag: MoveFlags.MAKES_CONTACT, user: moveData.attacker, target: pokemon })
    ) {
      this.onContact(moveData.attacker, pokemon);
    }

    return ret;
  }
}

/**
 * `BattlerTag` class for moves that block damaging moves damage the enemy if the enemy's move makes contact
 * Used by {@linkcode MoveId.SPIKY_SHIELD}
 */
export class ContactDamageProtectedTag extends ContactProtectedTag {
  private damageRatio: number;

  constructor(sourceMove: MoveId, damageRatio: number) {
    super(sourceMove, BattlerTagType.SPIKY_SHIELD);
    this.damageRatio = damageRatio;
  }

  /**
   * When given a battler tag or json representing one, load the data for it.
   * @param {BattlerTag | any} source A battler tag
   */
  loadTag(source: BattlerTag | any): void {
    super.loadTag(source);
    this.damageRatio = source.damageRatio;
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
      attacker.damageAndUpdate(toDmgValue(attacker.getMaxHp() * (1 / this.damageRatio)), {
        result: HitResult.INDIRECT,
      });
    }
  }
}

/** Base class for `BattlerTag`s that block damaging moves but not status moves */
export class DamageProtectedTag extends ContactProtectedTag {}

export class ContactSetStatusProtectedTag extends DamageProtectedTag {
  /**
   * @param sourceMove The move that caused the tag to be applied
   * @param tagType The type of the tag
   * @param statusEffect The status effect to apply to the attacker
   */
  constructor(
    sourceMove: MoveId,
    tagType: BattlerTagType,
    private statusEffect: StatusEffect,
  ) {
    super(sourceMove, tagType);
  }

  /**
   * Set the status effect on the attacker
   * @param attacker - The pokemon using the contact move
   * @param user - The pokemon that is being attacked and has the tag
   */
  override onContact(attacker: Pokemon, user: Pokemon): void {
    attacker.trySetStatus(this.statusEffect, true, user);
  }
}

/**
 * `BattlerTag` class for moves that block damaging moves and lower enemy stats if the enemy's move makes contact
 * Used by {@linkcode MoveId.KINGS_SHIELD}, {@linkcode MoveId.OBSTRUCT}, {@linkcode MoveId.SILK_TRAP}
 */
export class ContactStatStageChangeProtectedTag extends DamageProtectedTag {
  private stat: BattleStat;
  private levels: number;

  constructor(sourceMove: MoveId, tagType: BattlerTagType, stat: BattleStat, levels: number) {
    super(sourceMove, tagType);

    this.stat = stat;
    this.levels = levels;
  }

  /**
   * When given a battler tag or json representing one, load the data for it.
   * @param {BattlerTag | any} source A battler tag
   */
  override loadTag(source: BattlerTag | any): void {
    super.loadTag(source);
    this.stat = source.stat;
    this.levels = source.levels;
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
      [this.stat],
      this.levels,
    );
  }
}

/**
 * `BattlerTag` class for effects that cause the affected Pokemon to survive lethal attacks at 1 HP.
 * Used for {@link https://bulbapedia.bulbagarden.net/wiki/Endure_(move) | Endure} and
 * Endure Tokens.
 */
export class EnduringTag extends BattlerTag {
  constructor(tagType: BattlerTagType, lapseType: BattlerTagLapseType, sourceMove: MoveId) {
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

export class PerishSongTag extends BattlerTag {
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

export class AbilityBattlerTag extends BattlerTag {
  public ability: AbilityId;

  constructor(tagType: BattlerTagType, ability: AbilityId, lapseType: BattlerTagLapseType, turnCount: number) {
    super(tagType, lapseType, turnCount);

    this.ability = ability;
  }

  /**
   * When given a battler tag or json representing one, load the data for it.
   * @param {BattlerTag | any} source A battler tag
   */
  loadTag(source: BattlerTag | any): void {
    super.loadTag(source);
    this.ability = source.ability as AbilityId;
  }
}

/**
 * Tag used by Unburden to double speed
 * @extends AbilityBattlerTag
 */
export class UnburdenTag extends AbilityBattlerTag {
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
  constructor() {
    super(BattlerTagType.TRUANT, AbilityId.TRUANT, BattlerTagLapseType.MOVE, 1);
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    if (!pokemon.hasAbility(AbilityId.TRUANT)) {
      // remove tag if mon lacks ability
      return super.lapse(pokemon, lapseType);
    }

    const lastMove = pokemon.getLastXMoves()[0];

    if (!lastMove) {
      // Don't interrupt move if last move was `Moves.NONE` OR no prior move was found
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
  public stat: Stat;
  public multiplier: number;

  constructor(tagType: BattlerTagType, ability: AbilityId) {
    super(tagType, ability, BattlerTagLapseType.CUSTOM, 1);
  }

  /**
   * When given a battler tag or json representing one, load the data for it.
   * @param {BattlerTag | any} source A battler tag
   */
  loadTag(source: BattlerTag | any): void {
    super.loadTag(source);
    this.stat = source.stat as Stat;
    this.multiplier = source.multiplier;
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    let highestStat: EffectiveStat;
    EFFECTIVE_STATS.map(s =>
      pokemon.getEffectiveStat(s, undefined, undefined, undefined, undefined, undefined, undefined, undefined, true),
    ).reduce((highestValue: number, value: number, i: number) => {
      if (value > highestValue) {
        highestStat = EFFECTIVE_STATS[i];
        return value;
      }
      return highestValue;
    }, 0);

    highestStat = highestStat!; // tell TS compiler it's defined!
    this.stat = highestStat;

    this.multiplier = this.stat === Stat.SPD ? 1.5 : 1.3;
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

export class WeatherHighestStatBoostTag extends HighestStatBoostTag implements WeatherBattlerTag {
  public weatherTypes: WeatherType[];

  constructor(tagType: BattlerTagType, ability: AbilityId, ...weatherTypes: WeatherType[]) {
    super(tagType, ability);
    this.weatherTypes = weatherTypes;
  }

  /**
   * When given a battler tag or json representing one, load the data for it.
   * @param {BattlerTag | any} source A battler tag
   */
  loadTag(source: BattlerTag | any): void {
    super.loadTag(source);
    this.weatherTypes = source.weatherTypes.map(w => w as WeatherType);
  }
}

export class TerrainHighestStatBoostTag extends HighestStatBoostTag implements TerrainBattlerTag {
  public terrainTypes: TerrainType[];

  constructor(tagType: BattlerTagType, ability: AbilityId, ...terrainTypes: TerrainType[]) {
    super(tagType, ability);
    this.terrainTypes = terrainTypes;
  }

  /**
   * When given a battler tag or json representing one, load the data for it.
   * @param {BattlerTag | any} source A battler tag
   */
  loadTag(source: BattlerTag | any): void {
    super.loadTag(source);
    this.terrainTypes = source.terrainTypes.map(w => w as TerrainType);
  }
}

export class SemiInvulnerableTag extends BattlerTag {
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

export class TypeImmuneTag extends BattlerTag {
  public immuneType: PokemonType;

  constructor(tagType: BattlerTagType, sourceMove: MoveId, immuneType: PokemonType, length = 1) {
    super(tagType, BattlerTagLapseType.TURN_END, length, sourceMove, undefined, true);

    this.immuneType = immuneType;
  }

  /**
   * When given a battler tag or json representing one, load the data for it.
   * @param {BattlerTag | any} source A battler tag
   */
  loadTag(source: BattlerTag | any): void {
    super.loadTag(source);
    this.immuneType = source.immuneType as PokemonType;
  }
}

/**
 * Battler Tag that lifts the affected Pokemon into the air and provides immunity to Ground type moves.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Magnet_Rise_(move) | MoveId.MAGNET_RISE}
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Telekinesis_(move) | MoveId.TELEKINESIS}
 */
export class FloatingTag extends TypeImmuneTag {
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

export class TypeBoostTag extends BattlerTag {
  public boostedType: PokemonType;
  public boostValue: number;
  public oneUse: boolean;

  constructor(
    tagType: BattlerTagType,
    sourceMove: MoveId,
    boostedType: PokemonType,
    boostValue: number,
    oneUse: boolean,
  ) {
    super(tagType, BattlerTagLapseType.TURN_END, 1, sourceMove);

    this.boostedType = boostedType;
    this.boostValue = boostValue;
    this.oneUse = oneUse;
  }

  /**
   * When given a battler tag or json representing one, load the data for it.
   * @param {BattlerTag | any} source A battler tag
   */
  loadTag(source: BattlerTag | any): void {
    super.loadTag(source);
    this.boostedType = source.boostedType as PokemonType;
    this.boostValue = source.boostValue;
    this.oneUse = source.oneUse;
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    return lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);
  }

  override onAdd(pokemon: Pokemon): void {
    globalScene.phaseManager.queueMessage(
      i18next.t("abilityTriggers:typeImmunityPowerBoost", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        typeName: i18next.t(`pokemonInfo:Type.${PokemonType[this.boostedType]}`),
      }),
    );
  }

  override onOverlap(pokemon: Pokemon): void {
    globalScene.phaseManager.queueMessage(
      i18next.t("abilityTriggers:moveImmunity", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }),
    );
  }
}

export class CritBoostTag extends BattlerTag {
  constructor(tagType: BattlerTagType, sourceMove: MoveId) {
    super(tagType, BattlerTagLapseType.TURN_END, 1, sourceMove, undefined, true);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

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
}

/**
 * Tag for the effects of Dragon Cheer, which boosts the critical hit ratio of the user's allies.
 * @extends {CritBoostTag}
 */
export class DragonCheerTag extends CritBoostTag {
  /** The types of the user's ally when the tag is added */
  public typesOnAdd: PokemonType[];

  constructor() {
    super(BattlerTagType.CRIT_BOOST, MoveId.DRAGON_CHEER);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    this.typesOnAdd = pokemon.getTypes(true);
  }
}

export class SaltCuredTag extends BattlerTag {
  private sourceIndex: number;

  constructor(sourceId: number) {
    super(BattlerTagType.SALT_CURED, BattlerTagLapseType.TURN_END, 1, MoveId.SALT_CURE, sourceId);
  }

  /**
   * When given a battler tag or json representing one, load the data for it.
   * @param {BattlerTag | any} source A battler tag
   */
  loadTag(source: BattlerTag | any): void {
    super.loadTag(source);
    this.sourceIndex = source.sourceIndex;
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
    this.sourceIndex = source.getBattlerIndex();
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

export class CursedTag extends BattlerTag {
  private sourceIndex: number;

  constructor(sourceId: number) {
    super(BattlerTagType.CURSED, BattlerTagLapseType.TURN_END, 1, MoveId.CURSE, sourceId, true);
  }

  /**
   * When given a battler tag or json representing one, load the data for it.
   * @param {BattlerTag | any} source A battler tag
   */
  loadTag(source: BattlerTag | any): void {
    super.loadTag(source);
    this.sourceIndex = source.sourceIndex;
  }

  onAdd(pokemon: Pokemon): void {
    const source = this.getSourcePokemon();
    if (!source) {
      console.warn(`Failed to get source Pokemon for CursedTag onAdd; id: ${this.sourceId}`);
      return;
    }

    super.onAdd(pokemon);
    this.sourceIndex = source.getBattlerIndex();
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
export class RemovedTypeTag extends BattlerTag {
  constructor(tagType: BattlerTagType, lapseType: BattlerTagLapseType, sourceMove: MoveId) {
    super(tagType, lapseType, 1, sourceMove);
  }
}

/**
 * Battler tag for effects that ground the source, allowing Ground-type moves to hit them.
 * @description `IGNORE_FLYING`: Persistent grounding effects (i.e. from Smack Down and Thousand Waves)
 */
export class GroundedTag extends BattlerTag {
  constructor(tagType: BattlerTagType, lapseType: BattlerTagLapseType, sourceMove: MoveId) {
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
      } else {
        if (!!pokemon.getTag(RemovedTypeTag) && isOriginallyDualType && !isCurrentlyDualType) {
          modifiedTypes = [PokemonType.UNKNOWN];
        } else {
          modifiedTypes = currentTypes.filter(type => type !== PokemonType.FLYING);
        }
      }
      pokemon.summonData.types = modifiedTypes;
      pokemon.updateInfo();
    }
  }
}

/** Common attributes of form change abilities that block damage */
export class FormBlockDamageTag extends BattlerTag {
  constructor(tagType: BattlerTagType) {
    super(tagType, BattlerTagLapseType.CUSTOM, 1);
  }

  /**
   * Determines if the tag can be added to the Pokémon.
   * @param {Pokemon} pokemon The Pokémon to which the tag might be added.
   * @returns {boolean} True if the tag can be added, false otherwise.
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
   * @param {Pokemon} pokemon The Pokémon from which the tag is removed.
   */
  onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);

    globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeAbilityTrigger);
  }
}
/** Provides the additional weather-based effects of the Ice Face ability */
export class IceFaceBlockDamageTag extends FormBlockDamageTag {
  /**
   * Determines if the tag can be added to the Pokémon.
   * @param {Pokemon} pokemon The Pokémon to which the tag might be added.
   * @returns {boolean} True if the tag can be added, false otherwise.
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
 */
export class CommandedTag extends BattlerTag {
  private _tatsugiriFormKey: string;

  constructor(sourceId: number) {
    super(BattlerTagType.COMMANDED, BattlerTagLapseType.CUSTOM, 0, MoveId.NONE, sourceId);
  }

  public get tatsugiriFormKey(): string {
    return this._tatsugiriFormKey;
  }

  /** Caches the Tatsugiri's form key and sharply boosts the tagged Pokemon's stats */
  override onAdd(pokemon: Pokemon): void {
    this._tatsugiriFormKey = this.getSourcePokemon()?.getFormKey() ?? "curly";
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

  override loadTag(source: BattlerTag | any): void {
    super.loadTag(source);
    this._tatsugiriFormKey = source._tatsugiriFormKey;
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
 */
export class StockpilingTag extends BattlerTag {
  public stockpiledCount = 0;
  public statChangeCounts: { [Stat.DEF]: number; [Stat.SPDEF]: number } = {
    [Stat.DEF]: 0,
    [Stat.SPDEF]: 0,
  };

  constructor(sourceMove: MoveId = MoveId.NONE) {
    super(BattlerTagType.STOCKPILING, BattlerTagLapseType.CUSTOM, 1, sourceMove);
  }

  private onStatStagesChanged: StatStageChangeCallback = (_, statsChanged, statChanges) => {
    const defChange = statChanges[statsChanged.indexOf(Stat.DEF)] ?? 0;
    const spDefChange = statChanges[statsChanged.indexOf(Stat.SPDEF)] ?? 0;

    if (defChange) {
      this.statChangeCounts[Stat.DEF]++;
    }
    if (spDefChange) {
      this.statChangeCounts[Stat.SPDEF]++;
    }
  };

  loadTag(source: BattlerTag | any): void {
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
        this.onStatStagesChanged,
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
 * @extends BattlerTag
 */
export class GulpMissileTag extends BattlerTag {
  constructor(tagType: BattlerTagType, sourceMove: MoveId) {
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
        attacker.trySetStatus(StatusEffect.PARALYSIS, true, pokemon);
      }
    }
    return false;
  }

  /**
   * Gulp Missile's initial form changes are triggered by using Surf and Dive.
   * @param {Pokemon} pokemon The Pokemon with Gulp Missile ability.
   * @returns Whether the BattlerTag can be added.
   */
  canAdd(pokemon: Pokemon): boolean {
    const isSurfOrDive = [MoveId.SURF, MoveId.DIVE].includes(this.sourceMove);
    const isNormalForm =
      pokemon.formIndex === 0 &&
      !pokemon.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA) &&
      !pokemon.getTag(BattlerTagType.GULP_MISSILE_PIKACHU);
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
 * Tag that makes the target drop all of it type immunities
 * and all accuracy checks ignore its evasiveness stat.
 *
 * Applied by moves: {@linkcode MoveId.ODOR_SLEUTH | Odor Sleuth},
 * {@linkcode MoveId.MIRACLE_EYE | Miracle Eye} and {@linkcode MoveId.FORESIGHT | Foresight}.
 *
 * @extends BattlerTag
 * @see {@linkcode ignoreImmunity}
 */
export class ExposedTag extends BattlerTag {
  private defenderType: PokemonType;
  private allowedTypes: PokemonType[];

  constructor(tagType: BattlerTagType, sourceMove: MoveId, defenderType: PokemonType, allowedTypes: PokemonType[]) {
    super(tagType, BattlerTagLapseType.CUSTOM, 1, sourceMove);
    this.defenderType = defenderType;
    this.allowedTypes = allowedTypes;
  }

  /**
   * When given a battler tag or json representing one, load the data for it.
   * @param {BattlerTag | any} source A battler tag
   */
  loadTag(source: BattlerTag | any): void {
    super.loadTag(source);
    this.defenderType = source.defenderType as PokemonType;
    this.allowedTypes = source.allowedTypes as PokemonType[];
  }

  /**
   * @param types {@linkcode PokemonType} of the defending Pokemon
   * @param moveType {@linkcode PokemonType} of the move targetting it
   * @returns `true` if the move should be allowed to target the defender.
   */
  ignoreImmunity(type: PokemonType, moveType: PokemonType): boolean {
    return type === this.defenderType && this.allowedTypes.includes(moveType);
  }
}

/**
 * Tag that prevents HP recovery from held items and move effects. It also blocks the usage of recovery moves.
 * Applied by moves:  {@linkcode MoveId.HEAL_BLOCK | Heal Block (5 turns)}, {@linkcode MoveId.PSYCHIC_NOISE | Psychic Noise (2 turns)}
 *
 * @extends MoveRestrictionBattlerTag
 */
export class HealBlockTag extends MoveRestrictionBattlerTag {
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
   * @param {MoveId} move {@linkcode MoveId} the move ID
   * @returns `true` if the move has a TRIAGE_MOVE flag and is a status move
   */
  override isMoveRestricted(move: MoveId): boolean {
    return allMoves[move].hasFlag(MoveFlags.TRIAGE_MOVE) && allMoves[move].category === MoveCategory.STATUS;
  }

  /**
   * Checks if a move is disabled under Heal Block because of its choice of target
   * Implemented b/c of Pollen Puff
   * @param {MoveId} move {@linkcode MoveId} the move ID
   * @param {Pokemon} user {@linkcode Pokemon} the move user
   * @param {Pokemon} target {@linkcode Pokemon} the target of the move
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
   * @override
   * @param {Pokemon} pokemon {@linkcode Pokemon} attempting to use the restricted move
   * @param {MoveId} move {@linkcode MoveId} ID of the move being interrupted
   * @returns {string} text to display when the move is interrupted
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
 * @extends BattlerTag
 */
export class TarShotTag extends BattlerTag {
  constructor() {
    super(BattlerTagType.TAR_SHOT, BattlerTagLapseType.CUSTOM, 0);
  }

  /**
   * If the Pokemon is terastallized, the tag cannot be added.
   * @param {Pokemon} pokemon the {@linkcode Pokemon} to which the tag is added
   * @returns whether the tag is applied
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
export class AutotomizedTag extends BattlerTag {
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
}

/**
 * Tag implementing the {@link https://bulbapedia.bulbagarden.net/wiki/Substitute_(doll)#Effect | Substitute Doll} effect,
 * for use with the moves Substitute and Shed Tail. Pokemon with this tag deflect most forms of received attack damage
 * onto the tag. This tag also grants immunity to most Status moves and several move effects.
 */
export class SubstituteTag extends BattlerTag {
  /** The substitute's remaining HP. If HP is depleted, the Substitute fades. */
  public hp: number;
  /** A reference to the sprite representing the Substitute doll */
  public sprite: Phaser.GameObjects.Sprite;
  /** Is the source Pokemon "in focus," i.e. is it fully visible on the field? */
  public sourceInFocus: boolean;

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
   * @param {BattlerTag | any} source A battler tag
   */
  loadTag(source: BattlerTag | any): void {
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
  constructor(sourceId: number) {
    super(BattlerTagType.TORMENT, BattlerTagLapseType.AFTER_MOVE, 1, MoveId.TORMENT, sourceId);
  }

  /**
   * Adds the battler tag to the target Pokemon and defines the private class variable 'target'
   * 'Target' is used to track the Pokemon's current status
   * @param {Pokemon} pokemon the Pokemon tormented
   */
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
   * @param {Pokemon} pokemon the Pokemon under the effects of Torment
   * @param _tagType
   * @returns `true` if still present | `false` if not
   */
  override lapse(pokemon: Pokemon, _tagType: BattlerTagLapseType): boolean {
    return pokemon.isActive(true);
  }

  /**
   * This checks if the current move used is identical to the last used move with a {@linkcode MoveResult} of `SUCCESS`/`MISS`
   * @param {MoveId} move the move under investigation
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
   * Checks if a move is a status move and determines its restriction status on that basis
   * @param {MoveId} move the move under investigation
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
   * @override
   * @param pokemon The pokemon this tag is attached to
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
   * @override
   * @param {MoveId} move the move under investigation
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
export class SyrupBombTag extends BattlerTag {
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
export class TelekinesisTag extends BattlerTag {
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
 * @extends BattlerTag
 */
export class PowerTrickTag extends BattlerTag {
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
   * @param {Pokemon} pokemon The {@linkcode Pokemon} that already has the Power Trick tag.
   */
  onOverlap(pokemon: Pokemon): void {
    pokemon.removeTag(this.tagType);
  }

  /**
   * Swaps the user's base ATK stat with its base DEF stat.
   * @param {Pokemon} pokemon The {@linkcode Pokemon} whose stats will be swapped.
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
export class GrudgeTag extends BattlerTag {
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
   * @param sourcePokemon {@linkcode Pokemon} the source of the move that fainted the tag's bearer
   * @returns `false` if Grudge activates its effect or lapses
   */
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
      return new BattlerTag(tagType, BattlerTagLapseType.CUSTOM, 1, sourceMove, sourceId);
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
      return new CritBoostTag(tagType, sourceMove);
    case BattlerTagType.DRAGON_CHEER:
      return new DragonCheerTag();
    case BattlerTagType.ALWAYS_CRIT:
    case BattlerTagType.IGNORE_ACCURACY:
      return new BattlerTag(tagType, BattlerTagLapseType.TURN_END, 2, sourceMove);
    case BattlerTagType.ALWAYS_GET_HIT:
    case BattlerTagType.RECEIVE_DOUBLE_DAMAGE:
      return new BattlerTag(tagType, BattlerTagLapseType.PRE_MOVE, 1, sourceMove);
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
    case BattlerTagType.NONE:
    default:
      return new BattlerTag(tagType, BattlerTagLapseType.CUSTOM, turnCount, sourceMove, sourceId);
  }
}

/**
 * When given a battler tag or json representing one, creates an actual BattlerTag object with the same data.
 * @param {BattlerTag | any} source A battler tag
 * @return {BattlerTag} The valid battler tag
 */
export function loadBattlerTag(source: BattlerTag | any): BattlerTag {
  const tag = getBattlerTag(source.tagType, source.turnCount, source.sourceMove, source.sourceId);
  tag.loadTag(source);
  return tag;
}

/**
 * Helper function to verify that the current phase is a MoveEffectPhase and provide quick access to commonly used fields
 *
 * @param _pokemon {@linkcode Pokemon} The Pokémon used to access the current phase
 * @returns null if current phase is not MoveEffectPhase, otherwise Object containing the {@linkcode MoveEffectPhase}, and its
 * corresponding {@linkcode Move} and user {@linkcode Pokemon}
 */
function getMoveEffectPhaseData(_pokemon: Pokemon): { phase: MoveEffectPhase; attacker: Pokemon; move: Move } | null {
  const phase = globalScene.phaseManager.getCurrentPhase();
  if (phase?.is("MoveEffectPhase")) {
    return {
      phase: phase,
      attacker: phase.getPokemon(),
      move: phase.move,
    };
  }
  return null;
}
