import type Pokemon from "#app/field/pokemon";
import { PlayerPokemon, EnemyPokemon } from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import { BattleEndPhase } from "#app/phases/battle-end-phase";
import { MoveEndPhase } from "#app/phases/move-end-phase";
import { NewBattlePhase } from "#app/phases/new-battle-phase";
import { SelectBiomePhase } from "#app/phases/select-biome-phase";
import { SwitchPhase } from "#app/phases/switch-phase";
import { SwitchSummonPhase } from "#app/phases/switch-summon-phase";
import { BooleanHolder } from "#app/utils/common";
import { BattleType } from "#enums/battle-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { type NormalSwitchType, SwitchType } from "#enums/switch-type";
import i18next from "i18next";
import { isNullOrUndefined } from "#app/utils/common";
import { applyAbAttrs, ForceSwitchOutImmunityAbAttr } from "../abilities/ability";
import type { MoveAttr } from "../moves/move";
import { getPokemonNameWithAffix } from "#app/messages";
import type { AbAttr } from "../abilities/ab-attrs/ab-attr";

// NB: This shouldn't be terribly hard to extend from items if switching items are added (à la Eject Button/Red Card);
type SubMoveOrAbAttr = (new (...args: any[]) => MoveAttr) | (new (...args: any[]) => AbAttr);

/** Mixin to handle shared logic for switching moves and abilities. */
export function ForceSwitch<TBase extends SubMoveOrAbAttr>(Base: TBase) {
  return class ForceSwitchClass extends Base {
    protected selfSwitch = false;
    protected switchType: NormalSwitchType = SwitchType.SWITCH;

    /**
     * Determines if a Pokémon can be forcibly switched out based on its status and battle conditions.
     * @param switchOutTarget - The {@linkcode Pokemon} being switched out.
     * @returns Whether {@linkcode switchOutTarget} can be switched out by the current Move or Ability.
     */
    protected canSwitchOut(switchOutTarget: Pokemon): boolean {
      const isPlayer = switchOutTarget instanceof PlayerPokemon;

      // If we aren't switching ourself out, ensure the target in question can actually be switched out by us
      if (!this.selfSwitch && !this.performForceSwitchChecks(switchOutTarget)) {
        return false;
      }

      // Wild enemies should not be allowed to flee with baton pass, nor by any means on X0 waves (don't want easy boss wins)
      if (!isPlayer && globalScene.currentBattle.battleType === BattleType.WILD) {
        return this.switchType !== SwitchType.BATON_PASS && globalScene.currentBattle.waveIndex % 10 !== 0;
      }

      // Finally, ensure that a trainer switching out has at least 1 valid reserve member to send in.
      const reservePartyMembers = globalScene.getBackupPartyMemberIndices(
        isPlayer,
        !isPlayer ? (switchOutTarget as EnemyPokemon).trainerSlot : undefined,
      );
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
      applyAbAttrs(ForceSwitchOutImmunityAbAttr, switchOutTarget, blockedByAbility);
      if (blockedByAbility.value) {
        return false;
      }

      if (
        !(switchOutTarget instanceof PlayerPokemon) &&
        globalScene.currentBattle.isBattleMysteryEncounter() &&
        !globalScene.currentBattle.mysteryEncounter?.fleeAllowed
      ) {
        // Wild opponents cannot be force switched during MEs with flee disabled
        return false;
      }
      return true;
    }

    /**
     * Wrapper function to handle the actual "switching out" of Pokemon.
     * @param switchOutTarget - The {@linkcode Pokemon} (player or enemy) to be switched switch out.
     */
    protected doSwitch(switchOutTarget: Pokemon): void {
      if (switchOutTarget instanceof PlayerPokemon) {
        this.trySwitchPlayerPokemon(switchOutTarget);
        return;
      }

      if (!(switchOutTarget instanceof EnemyPokemon)) {
        console.warn(
          "Switched out target (index %i) neither player nor enemy Pokemon!",
          switchOutTarget.getFieldIndex(),
        );
        return;
      }

      if (globalScene.currentBattle.battleType !== BattleType.WILD) {
        this.trySwitchTrainerPokemon(switchOutTarget);
        return;
      }

      this.tryFleeWildPokemon(switchOutTarget);
    }

    // NB: `prependToPhase` is used here to ensure that the switch happens before the move ends
    // and `arena.ignoreAbilities` is reset.
    // This ensures ability ignore effects will persist for the duration of the switch (for hazards).

    private trySwitchPlayerPokemon(switchOutTarget: PlayerPokemon): void {
      // If not forced to switch, add a SwitchPhase to allow picking the next switched in Pokemon.
      if (this.switchType !== SwitchType.FORCE_SWITCH) {
        globalScene.prependToPhase(
          new SwitchPhase(this.switchType, switchOutTarget.getFieldIndex(), true, true),
          MoveEndPhase,
        );
        return;
      }

      // Pick a random eligible player pokemon to replace the switched out one.
      const reservePartyMembers = globalScene.getBackupPartyMemberIndices(true);
      const switchInIndex = reservePartyMembers[switchOutTarget.randBattleSeedInt(reservePartyMembers.length)];

      globalScene.prependToPhase(
        new SwitchSummonPhase(this.switchType, switchOutTarget.getFieldIndex(), switchInIndex, false, true),
        MoveEndPhase,
      );
    }

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
          : (globalScene.currentBattle.trainer.getNextSummonIndex(switchOutTarget.trainerSlot) ?? 0);
      globalScene.prependToPhase(
        new SwitchSummonPhase(this.switchType, switchOutTarget.getFieldIndex(), summonIndex, false, false),
        MoveEndPhase,
      );
    }

    private tryFleeWildPokemon(switchOutTarget: EnemyPokemon): void {
      // flee wild pokemon, redirecting moves to an ally in doubles as applicable.
      switchOutTarget.leaveField(false);
      globalScene.queueMessage(
        i18next.t("moveTriggers:fled", { pokemonName: getPokemonNameWithAffix(switchOutTarget) }),
        null,
        true,
        500,
      );

      const allyPokemon = switchOutTarget.getAlly();
      if (globalScene.currentBattle.double && !isNullOrUndefined(allyPokemon)) {
        globalScene.redirectPokemonMoves(switchOutTarget, allyPokemon);
      }

      // End battle if no enemies are active and enemy wasn't already KO'd (kos do )
      if (!allyPokemon?.isActive(true) && !switchOutTarget.isFainted()) {
        globalScene.clearEnemyHeldItemModifiers();

        globalScene.pushPhase(new BattleEndPhase(false));

        if (globalScene.gameMode.hasRandomBiomes || globalScene.isNewBiome()) {
          globalScene.pushPhase(new SelectBiomePhase());
        }

        globalScene.pushPhase(new NewBattlePhase());
      }
    }

    public isBatonPass(): boolean {
      return this.switchType === SwitchType.BATON_PASS;
    }

    public isForcedSwitch(): boolean {
      return this.switchType === SwitchType.FORCE_SWITCH;
    }
  };
}
