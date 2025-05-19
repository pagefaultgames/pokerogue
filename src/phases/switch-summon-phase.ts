import { globalScene } from "#app/global-scene";
import {
  applyPreSummonAbAttrs,
  applyPreSwitchOutAbAttrs,
  PreSummonAbAttr,
  PreSwitchOutAbAttr,
} from "#app/data/abilities/ability";
import { getPokeballTintColor } from "#app/data/pokeball";
import { SpeciesFormChangeActiveTrigger } from "#app/data/pokemon-forms";
import { TrainerSlot } from "#enums/trainer-slot";
import type Pokemon from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import { SwitchEffectTransferModifier } from "#app/modifier/modifier";
import i18next from "i18next";
import { PostSummonPhase } from "./post-summon-phase";
import { SummonPhase } from "./summon-phase";
import { SubstituteTag } from "#app/data/battler-tags";
import { SwitchType } from "#enums/switch-type";

export class SwitchSummonPhase extends SummonPhase {
  private readonly switchType: SwitchType;
  private readonly doReturn: boolean;
  private slotIndex: number;

  private lastPokemon: Pokemon;

  /**
   * Constructor for creating a new {@linkcode SwitchSummonPhase}, the phase where player and enemy Pokemon are switched out
   * and replaced by another Pokemon from the same party.
   * @param switchType - The type of switch behavior
   * @param fieldIndex - The position on field of the Pokemon being switched out
   * @param slotIndex - The 0-indexed party position of the Pokemon switching in, or `-1` to use the default trainer switch logic.
   * @param doReturn - Whether to render "comeback" dialogue
   * @param player - Whether the switch came from the player or enemy; default `true`
   */
  constructor(switchType: SwitchType, fieldIndex: number, slotIndex: number, doReturn: boolean, player = true) {
    super(fieldIndex, player);

    this.switchType = switchType;
    this.slotIndex = slotIndex;
    this.doReturn = doReturn;
  }

  // TODO: This is calling `applyPreSummonAbAttrs` both far too early and on the wrong pokemon;
  // `super.start` calls applyPreSummonAbAttrs(PreSummonAbAttr, this.getPokemon()),
  // and `this.getPokemon` is the pokemon SWITCHING OUT, NOT IN
  start(): void {
    super.start();
  }

  preSummon(): void {
    const switchOutPokemon = this.getPokemon();

    // For enemy trainers, pick a pokemon to switch to and/or display the opposing pokeball tray
    if (!this.player && globalScene.currentBattle.trainer) {
      if (this.slotIndex === -1) {
        this.slotIndex = globalScene.currentBattle.trainer.getNextSummonIndex(this.getTrainerSlotFromFieldIndex());
      }
      // TODO: Remove this check since `getNextSummonIndex` _should_ always return a number between 0 and party length inclusive
      if (this.slotIndex > -1) {
        this.showEnemyTrainer(this.getTrainerSlotFromFieldIndex());
        globalScene.pbTrayEnemy.showPbTray(globalScene.getEnemyParty());
      }
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
    const switchInPokemon: Pokemon | undefined = party[this.slotIndex];
    this.lastPokemon = this.getPokemon();

    applyPreSummonAbAttrs(PreSummonAbAttr, switchInPokemon);
    applyPreSwitchOutAbAttrs(PreSwitchOutAbAttr, this.lastPokemon);
    // TODO: Why do we trigger post switch out attributes even if the switch in target doesn't exist?
    // (This should almost certainly go somewhere inside `preSummon`)
    if (!switchInPokemon) {
      this.end();
      return;
    }

    if (this.switchType === SwitchType.BATON_PASS) {
      // If switching via baton pass, update opposing tags coming from the prior pokemon
      (this.player ? globalScene.getEnemyField() : globalScene.getPlayerField()).forEach((enemyPokemon: Pokemon) =>
        enemyPokemon.transferTagsBySourceId(this.lastPokemon.id, switchInPokemon.id),
      );

      // If the recipient pokemon lacks a baton, give our baton to it during the swap
      if (
        !globalScene.findModifier(
          m =>
            m instanceof SwitchEffectTransferModifier &&
            (m as SwitchEffectTransferModifier).pokemonId === switchInPokemon.id,
        )
      ) {
        const batonPassModifier = globalScene.findModifier(
          m =>
            m instanceof SwitchEffectTransferModifier &&
            (m as SwitchEffectTransferModifier).pokemonId === this.lastPokemon.id,
        ) as SwitchEffectTransferModifier;

        if (batonPassModifier) {
          globalScene.tryTransferHeldItemModifier(
            batonPassModifier,
            switchInPokemon,
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
    party[this.fieldIndex] = switchInPokemon;
    // TODO: Make this text configurable for Dragon Tail & co.
    // TODO: Make this a method
    const showTextAndSummon = () => {
      globalScene.ui.showText(
        this.player
          ? i18next.t("battle:playerGo", {
              pokemonName: getPokemonNameWithAffix(switchInPokemon),
            })
          : i18next.t("battle:trainerGo", {
              trainerName: globalScene.currentBattle.trainer?.getName(
                !(this.fieldIndex % 2) ? TrainerSlot.TRAINER : TrainerSlot.TRAINER_PARTNER,
              ),
              pokemonName: this.getPokemon().getNameToRender(),
            }),
      );

      /**
       * If this switch is passing a Substitute, make the switched Pokemon matches the returned Pokemon's state as it left.
       * Otherwise, clear any persisting tags on the returned Pokemon.
       */
      if (this.shouldKeepEffects()) {
        const substitute = this.lastPokemon.getTag(SubstituteTag);
        if (substitute) {
          switchInPokemon.x += this.lastPokemon.getSubstituteOffset()[0];
          switchInPokemon.y += this.lastPokemon.getSubstituteOffset()[1];
          switchInPokemon.setAlpha(0.5);
        }
      } else {
        switchInPokemon.fieldSetup();
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
      // (since both get initialized to an empty object on object creation)
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
    globalScene.unshiftPhase(new PostSummonPhase(this.getPokemon().getBattlerIndex()));
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
