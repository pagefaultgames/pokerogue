import { applyAbAttrs } from "#app/data/abilities/apply-ab-attrs";
import type { EnemyPokemon, PlayerPokemon, Pokemon } from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { BooleanHolder } from "#app/utils/common";
import { BattleType } from "#enums/battle-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import type { NormalSwitchType } from "#enums/switch-type";
import { SwitchType } from "#enums/switch-type";
import i18next from "i18next";

export interface ForceSwitchOutHelperArgs {
  /**
   * Whether to switch out the user (`true`) or target (`false`).
   * If `true`, will ignore certain effects that would otherwise block forced switches.
   * @defaultValue `false`
   */
  selfSwitch?: boolean;
  /**
   * The {@linkcode NormalSwitchType} corresponding to the type of switch logic to implement.
   * @defaultValue {@linkcode SwitchType.SWITCH}
   */
  switchType?: NormalSwitchType;
  /**
   * Whether to allow non-boss wild Pokemon to flee from this effect's activation.
   * @defaultValue `false`
   */
  allowFlee?: boolean;
}

/**
 * Helper class to handle shared logic for force switching effects.
 */
export class ForceSwitchOutHelper implements ForceSwitchOutHelperArgs {
  public readonly selfSwitch: boolean;
  public readonly switchType: NormalSwitchType;
  public readonly allowFlee: boolean;

  constructor({ selfSwitch = false, switchType = SwitchType.SWITCH, allowFlee = false }: ForceSwitchOutHelperArgs) {
    this.selfSwitch = selfSwitch;
    this.switchType = switchType;
    this.allowFlee = allowFlee;
  }

  /**
   * Determine if a Pokémon can be forcibly switched out based on its status and battle conditions.
   * @param switchOutTarget - The {@linkcode Pokemon} being switched out
   * @returns Whether {@linkcode switchOutTarget} can be switched out by the current effect.
   */
  public canSwitchOut(switchOutTarget: Pokemon): boolean {
    if (switchOutTarget.isFainted()) {
      // Fainted Pokemon cannot be switched out by any means.
      // This is already checked in `MoveEffectAttr.canApply`, but better safe than sorry
      return false;
    }

    // If we aren't switching ourself out, ensure the target in question can actually be switched out by us
    if (!this.selfSwitch && !this.performForceSwitchChecks(switchOutTarget)) {
      return false;
    }

    // Wild enemies should not be allowed to flee with ineligible fleeing moves, nor by any means on X0 waves (don't want easy boss wins)
    // TODO: Do we want to show a message for wave X0 failures?
    const isPlayer = switchOutTarget.isPlayer();
    if (!isPlayer && globalScene.currentBattle.battleType === BattleType.WILD) {
      return this.allowFlee && globalScene.currentBattle.waveIndex % 10 !== 0;
    }

    // Finally, ensure that a trainer switching out has at least 1 valid reserve member to send in.
    const reservePartyMembers = globalScene.getBackupPartyMemberIndices(switchOutTarget);
    return reservePartyMembers.length > 0;
  }

  /**
   * Perform various checks to confirm the switched out target can be forcibly removed from the field
   * by another Pokemon.
   * @param switchOutTarget - The {@linkcode Pokemon} being switched out
   * @returns Whether {@linkcode switchOutTarget} can be switched out by another Pokemon.
   */
  private performForceSwitchChecks(switchOutTarget: Pokemon): boolean {
    // Dondozo with an allied Tatsugiri in its mouth cannot be forced out by enemies
    const commandedTag = switchOutTarget.getTag(BattlerTagType.COMMANDED);
    if (commandedTag?.getSourcePokemon()?.isActive(true)) {
      return false;
    }

    // Check for opposing switch block abilities (Suction Cups and co)
    const blockedByAbility = new BooleanHolder(false);
    applyAbAttrs("ForceSwitchOutImmunityAbAttr", { pokemon: switchOutTarget, cancelled: blockedByAbility });
    if (blockedByAbility.value) {
      return false;
    }

    // Finally, wild opponents cannot be force switched during MEs with flee disabled
    return !(
      switchOutTarget.isEnemy()
      && globalScene.currentBattle.isBattleMysteryEncounter()
      && !globalScene.currentBattle.mysteryEncounter?.fleeAllowed
    );
  }

  /**
   * Wrapper function to handle the actual "switching out" of Pokemon.
   * @param switchOutTarget - The {@linkcode Pokemon} (player or enemy) to be switched out
   * @remarks
   * This does not perform any checks to ensure that `switchOutTarget` is able to be switched out.
   */
  public doSwitch(switchOutTarget: Pokemon): void {
    if (switchOutTarget.isPlayer()) {
      this.trySwitchPlayerPokemon(switchOutTarget);
      return;
    }

    if (globalScene.currentBattle.battleType === BattleType.TRAINER) {
      this.trySwitchTrainerPokemon(switchOutTarget as unknown as EnemyPokemon);
    } else {
      this.tryFleeWildPokemon(switchOutTarget as unknown as EnemyPokemon);
    }
  }

  /**
   * Method to handle switching out a player Pokemon.
   * @param switchOutTarget - The {@linkcode PlayerPokemon} to be switched out
   */
  private trySwitchPlayerPokemon(switchOutTarget: PlayerPokemon): void {
    // If not forced to switch, add a SwitchPhase to allow picking the next switched in Pokemon.
    if (this.switchType !== SwitchType.FORCE_SWITCH) {
      globalScene.phaseManager.prependNewToPhase(
        "MoveEndPhase",
        "SwitchPhase",
        this.switchType,
        switchOutTarget.getFieldIndex(),
        true,
        true,
      );
      return;
    }

    // Pick a random eligible player pokemon to replace the switched out one.
    const reservePartyMembers = globalScene.getBackupPartyMemberIndices(true);
    // TODO: Change to use rand seed item
    const switchInIndex = reservePartyMembers[switchOutTarget.randBattleSeedInt(reservePartyMembers.length)];

    globalScene.phaseManager.prependNewToPhase(
      "MoveEndPhase",
      "SwitchSummonPhase",
      this.switchType,
      switchOutTarget.getFieldIndex(),
      switchInIndex,
      false,
      true,
    );
  }

  /**
   * Method to handle switching out an opposing trainer's Pokemon.
   * @param switchOutTarget - The {@linkcode EnemyPokemon} to be switched out
   */
  private trySwitchTrainerPokemon(switchOutTarget: EnemyPokemon): void {
    // fallback for no trainer
    if (!globalScene.currentBattle.trainer) {
      console.warn("Enemy trainer switch logic triggered without a trainer!");
      return;
    }

    // Forced switches will pick a random eligible pokemon from this trainer's side, while
    // choice-based switching uses the trainer's default switch behavior.
    const reservePartyIndices = globalScene.getBackupPartyMemberIndices(false, switchOutTarget.trainerSlot);
    const summonIndex =
      this.switchType === SwitchType.FORCE_SWITCH
        ? reservePartyIndices[switchOutTarget.randBattleSeedInt(reservePartyIndices.length)]
        : globalScene.currentBattle.trainer.getNextSummonIndex(switchOutTarget.trainerSlot);
    globalScene.phaseManager.prependNewToPhase(
      "MoveEndPhase",
      "SwitchSummonPhase",
      this.switchType,
      switchOutTarget.getFieldIndex(),
      summonIndex,
      false,
      false,
    );
  }

  /**
   * Method to handle fleeing a wild enemy Pokemon, redirecting incoming moves to its ally as applicable.
   * @param switchOutTarget - The {@linkcode EnemyPokemon} fleeing the battle
   */
  private tryFleeWildPokemon(switchOutTarget: EnemyPokemon): void {
    switchOutTarget.leaveField(true);
    globalScene.phaseManager.queueMessage(
      i18next.t("moveTriggers:fled", { pokemonName: getPokemonNameWithAffix(switchOutTarget) }),
      null,
      true,
      500,
    );

    const allyPokemon = switchOutTarget.getAlly();
    if (globalScene.currentBattle.double && allyPokemon != null) {
      globalScene.redirectPokemonMoves(switchOutTarget, allyPokemon);
    }

    // End battle if no enemies are active and enemy wasn't already KO'd
    if (!allyPokemon?.isActive(true) && !switchOutTarget.isFainted()) {
      globalScene.clearEnemyHeldItemModifiers();

      globalScene.phaseManager.pushNew("BattleEndPhase", false);

      if (globalScene.gameMode.hasRandomBiomes || globalScene.isNewBiome()) {
        globalScene.phaseManager.pushNew("SelectBiomePhase");
      }

      globalScene.phaseManager.pushNew("NewBattlePhase");
    }
  }
}
