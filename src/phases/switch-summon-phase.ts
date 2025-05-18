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
  private readonly slotIndex: number;
  private readonly doReturn: boolean;

  private lastPokemon: Pokemon;

  /**
   * Constructor for creating a new {@linkcode SwitchSummonPhase}, the phase where player and enemy Pokemon are switched out.
   * @param switchType - The type of switch behavior
   * @param fieldIndex - Position on the battle field
   * @param slotIndex - The index of pokemon (in party of 6) to switch into
   * @param doReturn - Whether to render "comeback" dialogue
   * @param player - Whether the switch came from the player or enemy; default `true`
   */
  constructor(switchType: SwitchType, fieldIndex: number, slotIndex: number, doReturn: boolean, player = true) {
    super(fieldIndex, player);

    this.switchType = switchType;
    this.slotIndex = slotIndex;
    this.doReturn = doReturn;
  }

  start(): void {
    super.start();
  }

  preSummon(): void {
    if (!this.player) {
      if (this.slotIndex === -1) {
        //@ts-ignore
        this.slotIndex = globalScene.currentBattle.trainer?.getNextSummonIndex(
          !this.fieldIndex ? TrainerSlot.TRAINER : TrainerSlot.TRAINER_PARTNER,
        ); // TODO: what would be the default trainer-slot fallback?
      }
      if (this.slotIndex > -1) {
        this.showEnemyTrainer(!(this.fieldIndex % 2) ? TrainerSlot.TRAINER : TrainerSlot.TRAINER_PARTNER);
        globalScene.pbTrayEnemy.showPbTray(globalScene.getEnemyParty());
      }
    }

    if (
      !this.doReturn ||
      (this.slotIndex !== -1 &&
        !(this.player ? globalScene.getPlayerParty() : globalScene.getEnemyParty())[this.slotIndex])
    ) {
      if (this.player) {
        this.switchAndSummon();
        return;
      }
      globalScene.time.delayedCall(750, () => this.switchAndSummon());
      return;
    }

    const lastPokemon = this.getPokemon();
    (this.player ? globalScene.getEnemyField() : globalScene.getPlayerField()).forEach(enemyPokemon =>
      enemyPokemon.removeTagsBySourceId(lastPokemon.id),
    );

    if (this.switchType === SwitchType.SWITCH || this.switchType === SwitchType.INITIAL_SWITCH) {
      const substitute = lastPokemon.getTag(SubstituteTag);
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
            pokemonName: getPokemonNameWithAffix(lastPokemon),
          })
        : i18next.t("battle:trainerComeBack", {
            trainerName: globalScene.currentBattle.trainer?.getName(
              !(this.fieldIndex % 2) ? TrainerSlot.TRAINER : TrainerSlot.TRAINER_PARTNER,
            ),
            pokemonName: lastPokemon.getNameToRender(),
          }),
    );
    globalScene.playSound("se/pb_rel");
    lastPokemon.hideInfo();
    lastPokemon.tint(getPokeballTintColor(lastPokemon.getPokeball(true)), 1, 250, "Sine.easeIn");
    globalScene.tweens.add({
      targets: lastPokemon,
      duration: 250,
      ease: "Sine.easeIn",
      scale: 0.5,
      onComplete: () => {
        globalScene.time.delayedCall(750, () => this.switchAndSummon());
      },
    });
  }

  switchAndSummon() {
    const party = this.player ? this.getParty() : globalScene.getEnemyParty();
    const switchedInPokemon: Pokemon | undefined = party[this.slotIndex];
    this.lastPokemon = this.getPokemon();

    applyPreSummonAbAttrs(PreSummonAbAttr, switchedInPokemon);
    applyPreSwitchOutAbAttrs(PreSwitchOutAbAttr, this.lastPokemon);
    if (!switchedInPokemon) {
      this.end();
      return;
    }

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
        ) as SwitchEffectTransferModifier;

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

    // Swap around the 2 pokemon's party positions and play an animation to send in the new pokemon.
    party[this.slotIndex] = this.lastPokemon;
    party[this.fieldIndex] = switchedInPokemon;
    const showTextAndSummon = () => {
      // TODO: Should this remove the info container?
      this.lastPokemon.leaveField(![SwitchType.BATON_PASS, SwitchType.SHED_TAIL].includes(this.switchType), false);
      globalScene.ui.showText(
        this.player
          ? i18next.t("battle:playerGo", {
              pokemonName: getPokemonNameWithAffix(switchedInPokemon),
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
      if (this.switchType === SwitchType.BATON_PASS || this.switchType === SwitchType.SHED_TAIL) {
        const substitute = this.lastPokemon.getTag(SubstituteTag);
        if (substitute) {
          switchedInPokemon.x += this.lastPokemon.getSubstituteOffset()[0];
          switchedInPokemon.y += this.lastPokemon.getSubstituteOffset()[1];
          switchedInPokemon.setAlpha(0.5);
        }
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

    const pokemon = this.getPokemon();

    // If not switching at start of battle, reset turn counts and temp data on the newly sent in Pokemon
    // Needed as we increment turn counters in `TurnEndPhase`.
    if (this.switchType !== SwitchType.INITIAL_SWITCH) {
      // No need to reset turn/summon data for initial switch
      // (since both get initialized to an empty object on object creation)
      this.lastPokemon.resetTurnData();
      this.lastPokemon.resetSummonData();
      pokemon.tempSummonData.turnCount--;
      pokemon.tempSummonData.waveTurnCount--;
      pokemon.turnData.switchedInThisTurn = true;
    }

    // Baton Pass over any eligible effects or substitutes before resetting the last pokemon's temporary data.
    if (this.switchType === SwitchType.BATON_PASS) {
      pokemon.transferSummon(this.lastPokemon);
      this.lastPokemon.resetTurnData();
      this.lastPokemon.resetSummonData();
    } else if (this.switchType === SwitchType.SHED_TAIL) {
      const subTag = this.lastPokemon.getTag(SubstituteTag);
      if (subTag) {
        pokemon.summonData.tags.push(subTag);
      }
      this.lastPokemon.resetTurnData();
      this.lastPokemon.resetSummonData();
    }

    globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeActiveTrigger, true);
    // Reverts to weather-based forms when weather suppressors (Cloud Nine/Air Lock) are switched out
    globalScene.arena.triggerWeatherBasedFormChanges();
  }

  queuePostSummon(): void {
    globalScene.unshiftPhase(new PostSummonPhase(this.getPokemon().getBattlerIndex()));
  }
}
