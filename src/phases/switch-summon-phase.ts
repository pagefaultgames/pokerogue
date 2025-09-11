import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { SubstituteTag } from "#data/battler-tags";
import { allMoves } from "#data/data-lists";
import { SpeciesFormChangeActiveTrigger } from "#data/form-change-triggers";
import { getPokeballTintColor } from "#data/pokeball";
import { Command } from "#enums/command";
import { SwitchType } from "#enums/switch-type";
import { TrainerSlot } from "#enums/trainer-slot";
import type { Pokemon } from "#field/pokemon";
import { SwitchEffectTransferModifier } from "#modifiers/modifier";
import { SummonPhase } from "#phases/summon-phase";
import i18next from "i18next";

export class SwitchSummonPhase extends SummonPhase {
  public readonly phaseName: "SwitchSummonPhase" | "ReturnPhase" = "SwitchSummonPhase";
  private readonly switchType: SwitchType;
  private readonly slotIndex: number;
  private readonly doReturn: boolean;

  private lastPokemon: Pokemon;

  /**
   * Constructor for creating a new SwitchSummonPhase
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
        //@ts-expect-error
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
      !this.doReturn
      || (this.slotIndex !== -1
        && !(this.player ? globalScene.getPlayerParty() : globalScene.getEnemyParty())[this.slotIndex])
    ) {
      if (this.player) {
        this.switchAndSummon();
        return;
      }
      globalScene.time.delayedCall(750, () => this.switchAndSummon());
      return;
    }

    const pokemon = this.getPokemon();
    (this.player ? globalScene.getEnemyField() : globalScene.getPlayerField()).forEach(enemyPokemon =>
      enemyPokemon.removeTagsBySourceId(pokemon.id),
    );

    if (this.switchType === SwitchType.SWITCH || this.switchType === SwitchType.INITIAL_SWITCH) {
      const substitute = pokemon.getTag(SubstituteTag);
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
            pokemonName: getPokemonNameWithAffix(pokemon),
          })
        : i18next.t("battle:trainerComeBack", {
            trainerName: globalScene.currentBattle.trainer?.getName(
              !(this.fieldIndex % 2) ? TrainerSlot.TRAINER : TrainerSlot.TRAINER_PARTNER,
            ),
            pokemonName: pokemon.getNameToRender(),
          }),
    );
    globalScene.playSound("se/pb_rel");
    pokemon.hideInfo();
    pokemon.tint(getPokeballTintColor(pokemon.getPokeball(true)), 1, 250, "Sine.easeIn");
    globalScene.tweens.add({
      targets: pokemon,
      duration: 250,
      ease: "Sine.easeIn",
      scale: 0.5,
      onComplete: () => {
        globalScene.time.delayedCall(750, () => this.switchAndSummon());
        pokemon.leaveField(this.switchType === SwitchType.SWITCH, false);
      },
    });
  }

  switchAndSummon() {
    const party = this.player ? this.getParty() : globalScene.getEnemyParty();
    const switchedInPokemon: Pokemon | undefined = party[this.slotIndex];
    this.lastPokemon = this.getPokemon();

    // Defensive programming: Overcome the bug where the summon data has somehow not been reset
    // prior to switching in a new Pokemon.
    // Force the switch to occur and load the assets for the new pokemon, ignoring override.
    switchedInPokemon.resetSummonData();
    switchedInPokemon.loadAssets(true);

    applyAbAttrs("PreSummonAbAttr", { pokemon: switchedInPokemon });
    applyAbAttrs("PreSwitchOutAbAttr", { pokemon: this.lastPokemon });
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
            m instanceof SwitchEffectTransferModifier
            && (m as SwitchEffectTransferModifier).pokemonId === switchedInPokemon.id,
        )
      ) {
        const batonPassModifier = globalScene.findModifier(
          m =>
            m instanceof SwitchEffectTransferModifier
            && (m as SwitchEffectTransferModifier).pokemonId === this.lastPokemon.id,
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

    party[this.slotIndex] = this.lastPokemon;
    party[this.fieldIndex] = switchedInPokemon;
    const showTextAndSummon = () => {
      globalScene.ui.showText(this.getSendOutText(switchedInPokemon));
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
      } else {
        switchedInPokemon.fieldSetup(true);
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

    const moveId = globalScene.currentBattle.lastMove;
    const lastUsedMove = moveId ? allMoves[moveId] : undefined;

    const currentCommand = globalScene.currentBattle.turnCommands[this.fieldIndex]?.command;
    const lastPokemonIsForceSwitchedAndNotFainted =
      lastUsedMove?.hasAttr("ForceSwitchOutAttr") && !this.lastPokemon.isFainted();
    const lastPokemonHasForceSwitchAbAttr =
      this.lastPokemon.hasAbilityWithAttr("PostDamageForceSwitchAbAttr") && !this.lastPokemon.isFainted();

    // Compensate for turn spent summoning/forced switch if switched out pokemon is not fainted.
    // Needed as we increment turn counters in `TurnEndPhase`.
    if (
      currentCommand === Command.POKEMON
      || lastPokemonIsForceSwitchedAndNotFainted
      || lastPokemonHasForceSwitchAbAttr
    ) {
      pokemon.tempSummonData.turnCount--;
      pokemon.tempSummonData.waveTurnCount--;
    }

    if (this.switchType === SwitchType.BATON_PASS && pokemon) {
      pokemon.transferSummon(this.lastPokemon);
    } else if (this.switchType === SwitchType.SHED_TAIL && pokemon) {
      const subTag = this.lastPokemon.getTag(SubstituteTag);
      if (subTag) {
        pokemon.summonData.tags.push(subTag);
      }
    }

    // Reset turn data if not initial switch (since it gets initialized to an empty object on turn start)
    if (this.switchType !== SwitchType.INITIAL_SWITCH) {
      pokemon.resetTurnData();
      pokemon.turnData.switchedInThisTurn = true;
    }

    this.lastPokemon.resetSummonData();

    globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeActiveTrigger, true);
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
}
