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
import type { TrainerSlot } from "#enums/trainer-slot";

// NB: This shouldn't be terribly hard to extend from if switching items are added (à la Eject Button)
type SubMoveOrAbAttr = (new (...args: any[]) => MoveAttr) | (new (...args: any[]) => AbAttr);

/** Mixin to handle shared logic for switch-in moves and abilities. */
export function ForceSwitch<TBase extends SubMoveOrAbAttr>(Base: TBase) {
  return class ForceSwitchClass extends Base {
    protected selfSwitch = false;
    protected switchType: NormalSwitchType = SwitchType.SWITCH;

    /**
     * Determines if a Pokémon can be forcibly switched out based on its status, the opponent's status and battle conditions.
     * @see {@linkcode performOpponentChecks} for opponent-related check code.

     * @param switchOutTarget - The {@linkcode Pokemon} attempting to switch out.
     * @param opponent - The {@linkcode Pokemon} opposing the currently switched out Pokemon.
     * Unused if {@linkcode selfSwitch} is `true`, as it is only used to check Suction Cups.
     * @returns Whether {@linkcode switchOutTarget} can be switched out by the current Move or Ability.
     */
    protected canSwitchOut(switchOutTarget: Pokemon, opponent: Pokemon | undefined): boolean {
      const isPlayer = switchOutTarget instanceof PlayerPokemon;

      if (!this.selfSwitch && opponent && !this.performOpponentChecks(switchOutTarget, opponent)) {
        return false;
      }

      if (!isPlayer && globalScene.currentBattle.battleType === BattleType.WILD) {
        // enemies should not be allowed to flee with baton pass, nor by any means on X0 waves (don't want easy boss wins)
        return this.switchType !== SwitchType.BATON_PASS && globalScene.currentBattle.waveIndex % 10 !== 0;
      }

      // Finally, ensure that we have valid switch out targets.
      const reservePartyMembers = globalScene.getBackupPartyMembers(
        isPlayer,
        (switchOutTarget as EnemyPokemon).trainerSlot as TrainerSlot | undefined,
      ); // evaluates to `undefined` if not present
      if (reservePartyMembers.length === 0) {
        return false;
      }

      return true;
    }

    protected performOpponentChecks(switchOutTarget: Pokemon, opponent: Pokemon): boolean {
      // Dondozo with an allied Tatsugiri in its mouth cannot be forced out by enemies
      const commandedTag = switchOutTarget.getTag(BattlerTagType.COMMANDED);
      if (commandedTag?.getSourcePokemon()?.isActive(true)) {
        return false;
      }

      // Check for opposing switch block abilities (Suction Cups and co)
      const blockedByAbility = new BooleanHolder(false);
      applyAbAttrs(ForceSwitchOutImmunityAbAttr, opponent, blockedByAbility);
      if (!blockedByAbility.value) {
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
     * @param switchOutTarget - The {@linkcode Pokemon} (player or enemy) attempting to switch out.
     */
    protected doSwitch(switchOutTarget: Pokemon): void {
      if (switchOutTarget instanceof PlayerPokemon) {
        this.trySwitchPlayerPokemon(switchOutTarget);
        return;
      }

      if (!(switchOutTarget instanceof EnemyPokemon)) {
        console.warn("Switched out target not instance of Player or enemy Pokemon!");
        return;
      }

      if (globalScene.currentBattle.battleType !== BattleType.WILD) {
        this.trySwitchTrainerPokemon(switchOutTarget);
        return;
      }

      this.tryFleeWildPokemon(switchOutTarget);
    }

    private trySwitchPlayerPokemon(switchOutTarget: PlayerPokemon): void {
      // If not forced to switch, add a SwitchPhase to allow picking the next switched in Pokemon.
      if (this.switchType !== SwitchType.FORCE_SWITCH) {
        globalScene.appendToPhase(
          new SwitchPhase(this.switchType, switchOutTarget.getFieldIndex(), true, true),
          MoveEndPhase,
        );
        return;
      }

      // Pick a random player pokemon to switch out.
      const reservePartyMembers = globalScene.getBackupPartyMembers(true);
      const switchOutIndex = switchOutTarget.randSeedInt(reservePartyMembers.length);

      globalScene.appendToPhase(
        new SwitchSummonPhase(this.switchType, switchOutTarget.getFieldIndex(), switchOutIndex, false, true),
        MoveEndPhase,
      );
    }

    private trySwitchTrainerPokemon(switchOutTarget: EnemyPokemon): void {
      // fallback for no trainer
      if (!globalScene.currentBattle.trainer) {
        console.warn("Enemy trainer switch logic approached without a trainer!");
        return;
      }
      // Forced switches will to pick a random eligible pokemon, while
      // choice-based switching uses the trainer's default switch behavior
      const reservePartyMembers = globalScene.getBackupPartyMembers(false, switchOutTarget.trainerSlot);
      const summonIndex =
        this.switchType === SwitchType.FORCE_SWITCH
          ? switchOutTarget.randSeedInt(reservePartyMembers.length)
          : (globalScene.currentBattle.trainer.getNextSummonIndex(switchOutTarget.trainerSlot) ?? 0);
      globalScene.appendToPhase(
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
  };
}
