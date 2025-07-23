import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { SubstituteTag } from "#data/battler-tags";
import { SpeciesFormChangeActiveTrigger } from "#data/form-change-triggers";
import { getPokeballTintColor } from "#data/pokeball";
import { SwitchType } from "#enums/switch-type";
import { TrainerSlot } from "#enums/trainer-slot";
import type { Pokemon } from "#field/pokemon";
import { SwitchEffectTransferModifier } from "#modifiers/modifier";
import { SummonPhase } from "#phases/summon-phase";
import i18next from "i18next";

// TODO: This and related phases desperately need to be refactored
export class SwitchSummonPhase extends SummonPhase {
  public readonly phaseName: "SwitchSummonPhase" | "ReturnPhase" = "SwitchSummonPhase";
  private readonly switchType: SwitchType;
  private readonly slotIndex: number;
  private readonly doReturn: boolean;

  private lastPokemon: Pokemon;

  /**
   * Constructor for creating a new {@linkcode SwitchSummonPhase}, the phase where player and enemy Pokemon are switched out
   * and replaced by another Pokemon from the same party.
   * @param switchType - The type of switch behavior
   * @param fieldIndex - The position on field of the Pokemon being switched **out**
   * @param slotIndex - The 0-indexed party position of the Pokemon switching **in**, or `-1` to use the default trainer switch logic.
   * @param doReturn - Whether to render "comeback" dialogue
   * @param player - Whether the switch came from the player or enemy; default `true`
   */
  constructor(switchType: SwitchType, fieldIndex: number, slotIndex: number, doReturn: boolean, player = true) {
    super(fieldIndex, player);

    this.switchType = switchType;
    // -1 = "use trainer switch logic"
    this.slotIndex =
      slotIndex > -1
        ? this.slotIndex
        : globalScene.currentBattle.trainer!.getNextSummonIndex(this.getTrainerSlotFromFieldIndex());
    this.doReturn = doReturn;
  }

  // TODO: This is calling `applyPreSummonAbAttrs` both far too early and on the wrong pokemon;
  // `super.start` calls applyPreSummonAbAttrs(PreSummonAbAttr, this.getPokemon()),
  // and `this.getPokemon` is the pokemon SWITCHING OUT, NOT IN
  start(): void {
    super.start();
  }

  override preSummon(): void {
    const switchOutPokemon = this.getPokemon();

    if (!this.player && globalScene.currentBattle.trainer) {
      this.showEnemyTrainer(this.getTrainerSlotFromFieldIndex());
      globalScene.pbTrayEnemy.showPbTray(globalScene.getEnemyParty());
    }

    if (
      !this.doReturn ||
      // TODO: this part of the check need not exist `- `switchAndSummon` returns near immediately if we have no pokemon to switch into
      (this.slotIndex !== -1 &&
        !(this.player ? globalScene.getPlayerParty() : globalScene.getEnemyParty())[this.slotIndex])
    ) {
      // If the target is still on-field, remove it and/or hide its info container.
      // Effects are kept to be transferred to the new Pokemon later on.
      if (switchOutPokemon.isOnField()) {
        switchOutPokemon.leaveField(false, switchOutPokemon.getBattleInfo()?.visible);
      }

      if (this.player) {
        this.switchAndSummon();
      } else {
        globalScene.time.delayedCall(750, () => this.switchAndSummon());
      }
      return;
    }

    (this.player ? globalScene.getEnemyField() : globalScene.getPlayerField()).forEach(enemyPokemon =>
      enemyPokemon.removeTagsBySourceId(switchOutPokemon.id),
    );

    // If not transferring a substitute, play animation to remove it from the field
    if (!this.shouldKeepEffects()) {
      const substitute = switchOutPokemon.getTag(SubstituteTag);
      if (substitute) {
        globalScene.tweens.add({
          targets: substitute.sprite,
          duration: 250,
          scale: substitute.sprite.scale * 0.5,
          ease: "Sine.easeIn",
          onComplete: () => substitute.sprite.destroy(),
        });
      }
    }

    globalScene.ui.showText(
      this.player
        ? i18next.t("battle:playerComeBack", {
            pokemonName: getPokemonNameWithAffix(switchOutPokemon),
          })
        : i18next.t("battle:trainerComeBack", {
            trainerName: globalScene.currentBattle.trainer?.getName(this.getTrainerSlotFromFieldIndex()),
            pokemonName: switchOutPokemon.getNameToRender(),
          }),
    );
    globalScene.playSound("se/pb_rel");
    switchOutPokemon.hideInfo();
    switchOutPokemon.tint(getPokeballTintColor(switchOutPokemon.getPokeball(true)), 1, 250, "Sine.easeIn");
    globalScene.tweens.add({
      targets: switchOutPokemon,
      duration: 250,
      ease: "Sine.easeIn",
      scale: 0.5,
      onComplete: () => {
        globalScene.time.delayedCall(750, () => this.switchAndSummon());
        switchOutPokemon.leaveField(this.switchType === SwitchType.SWITCH, false); // TODO: do we have to do this right here right now
      },
    });
  }

  switchAndSummon() {
    const party = this.player ? this.getParty() : globalScene.getEnemyParty();
    const switchedInPokemon: Pokemon | undefined = party[this.slotIndex];
    this.lastPokemon = this.getPokemon();

    // TODO: Why do we trigger these attributes even if the switch in target doesn't exist?
    // (This should almost certainly go somewhere inside `preSummon`)
    applyAbAttrs("PreSummonAbAttr", { pokemon: switchedInPokemon });
    applyAbAttrs("PreSwitchOutAbAttr", { pokemon: this.lastPokemon });
    if (!switchedInPokemon) {
      this.end();
      return;
    }

    // Defensive programming: Overcome the bug where the summon data has somehow not been reset
    // prior to switching in a new Pokemon.
    // Force the switch to occur and load the assets for the new pokemon, ignoring override.
    // TODO: Assess whether this is needed anymore and remove if needed
    switchedInPokemon.resetSummonData();
    switchedInPokemon.loadAssets(true);

    if (this.switchType === SwitchType.BATON_PASS) {
      // If switching via baton pass, update opposing tags coming from the prior pokemon
      (this.player ? globalScene.getEnemyField() : globalScene.getPlayerField()).forEach((enemyPokemon: Pokemon) =>
        enemyPokemon.transferTagsBySourceId(this.lastPokemon.id, switchedInPokemon.id),
      );

      // If the recipient pokemon lacks a baton, give our baton to it during the swap
      if (
        !globalScene.findModifier(
          m =>
            m instanceof SwitchEffectTransferModifier &&
            (m as SwitchEffectTransferModifier).pokemonId === switchedInPokemon.id,
        )
      ) {
        const batonPassModifier = globalScene.findModifier(
          m =>
            m instanceof SwitchEffectTransferModifier &&
            (m as SwitchEffectTransferModifier).pokemonId === this.lastPokemon.id,
        ) as SwitchEffectTransferModifier | undefined;

        if (batonPassModifier) {
          globalScene.tryTransferHeldItemModifier(
            batonPassModifier,
            switchedInPokemon,
            false,
            undefined,
            undefined,
            undefined,
            false,
          );
        }
      }
    }

    party[this.slotIndex] = this.lastPokemon;
    party[this.fieldIndex] = switchedInPokemon;
    // TODO: Make this a method
    const showTextAndSummon = () => {
      globalScene.ui.showText(this.getSendOutText(switchedInPokemon));
      /**
       * If this switch is passing a Substitute, make the switched Pokemon matches the returned Pokemon's state as it left.
       * Otherwise, clear any persisting tags on the returned Pokemon.
       */
      if (this.shouldKeepEffects()) {
        const substitute = this.lastPokemon.getTag(SubstituteTag);
        if (substitute) {
          switchedInPokemon.x += this.lastPokemon.getSubstituteOffset()[0];
          switchedInPokemon.y += this.lastPokemon.getSubstituteOffset()[1];
          switchedInPokemon.setAlpha(0.5);
        }
      } else {
        switchedInPokemon.fieldSetup();
      }
      this.summon();
    };

    if (this.player) {
      showTextAndSummon();
    } else {
      globalScene.time.delayedCall(1500, () => {
        this.hideEnemyTrainer();
        globalScene.pbTrayEnemy.hide();
        showTextAndSummon();
      });
    }
  }

  onEnd(): void {
    super.onEnd();

    const activePokemon = this.getPokemon();

    // If not switching at start of battle, reset turn counts and temp data on the newly sent in Pokemon
    // Needed as we increment turn counters in `TurnEndPhase`.
    if (this.switchType !== SwitchType.INITIAL_SWITCH) {
      // No need to reset turn/summon data for initial switch
      // (since both get initialized to defaults on object creation)
      activePokemon.resetTurnData();
      activePokemon.resetSummonData();
      activePokemon.tempSummonData.turnCount--;
      activePokemon.tempSummonData.waveTurnCount--;
      activePokemon.turnData.switchedInThisTurn = true;
    }

    // Baton Pass over any eligible effects or substitutes before resetting the last pokemon's temporary data.
    if (this.switchType === SwitchType.BATON_PASS) {
      activePokemon.transferSummon(this.lastPokemon);
      this.lastPokemon.resetTurnData();
      this.lastPokemon.resetSummonData();
    } else if (this.switchType === SwitchType.SHED_TAIL) {
      const subTag = this.lastPokemon.getTag(SubstituteTag);
      if (subTag) {
        activePokemon.summonData.tags.push(subTag);
      }
      this.lastPokemon.resetTurnData();
      this.lastPokemon.resetSummonData();
    }

    globalScene.triggerPokemonFormChange(activePokemon, SpeciesFormChangeActiveTrigger, true);
    // Reverts to weather-based forms when weather suppressors (Cloud Nine/Air Lock) are switched out
    globalScene.arena.triggerWeatherBasedFormChanges();
  }

  queuePostSummon(): void {
    globalScene.phaseManager.startNewDynamicPhase("PostSummonPhase", this.getPokemon().getBattlerIndex());
  }

  /**
   * Get the text to be displayed when a pokemon is forced to switch and leave the field.
   * @param switchedInPokemon - The Pokemon having newly been sent in.
   * @returns The text to display.
   */
  private getSendOutText(switchedInPokemon: Pokemon): string {
    if (this.switchType === SwitchType.FORCE_SWITCH) {
      // "XYZ was dragged out!"
      return i18next.t("battle:pokemonDraggedOut", {
        pokemonName: getPokemonNameWithAffix(switchedInPokemon),
      });
    }
    if (this.player) {
      // "Go! XYZ!"
      return i18next.t("battle:playerGo", {
        pokemonName: getPokemonNameWithAffix(switchedInPokemon),
      });
    }

    // "Trainer sent out XYZ!"
    return i18next.t("battle:trainerGo", {
      trainerName: globalScene.currentBattle.trainer?.getName(
        !(this.fieldIndex % 2) ? TrainerSlot.TRAINER : TrainerSlot.TRAINER_PARTNER,
      ),
      pokemonName: this.getPokemon().getNameToRender(),
    });
  }

  private shouldKeepEffects(): boolean {
    return [SwitchType.BATON_PASS, SwitchType.SHED_TAIL].includes(this.switchType);
  }

  private getTrainerSlotFromFieldIndex(): TrainerSlot {
    return this.player || !globalScene.currentBattle.trainer
      ? TrainerSlot.NONE
      : this.fieldIndex % 2 === 0
        ? TrainerSlot.TRAINER
        : TrainerSlot.TRAINER_PARTNER;
  }
}
