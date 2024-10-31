import { gScene } from "#app/battle-scene"; // todo?
import { applyPreSwitchOutAbAttrs, PreSwitchOutAbAttr } from "#app/data/ability";
import { allMoves, ForceSwitchOutAttr } from "#app/data/move";
import { getPokeballTintColor } from "#app/data/pokeball";
import { SpeciesFormChangeActiveTrigger } from "#app/data/pokemon-forms";
import { TrainerSlot } from "#app/data/trainer-config";
import Pokemon from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import { SwitchEffectTransferModifier } from "#app/modifier/modifier";
import { Command } from "#app/ui/command-ui-handler";
import i18next from "i18next";
import { PostSummonPhase } from "./post-summon-phase";
import { SummonPhase } from "./summon-phase";
import { SubstituteTag } from "#app/data/battler-tags";
import { SwitchType } from "#enums/switch-type";

export class SwitchSummonPhase extends SummonPhase {
  private readonly switchType: SwitchType;
  private readonly slotIndex: integer;
  private readonly doReturn: boolean;

  private lastPokemon: Pokemon;

  /**
     * Constructor for creating a new SwitchSummonPhase
     * @param scene {@linkcode BattleScene} the scene the phase is associated with
     * @param switchType the type of switch behavior
     * @param fieldIndex integer representing position on the battle field
     * @param slotIndex integer for the index of pokemon (in party of 6) to switch into
     * @param doReturn boolean whether to render "comeback" dialogue
     * @param player boolean if the switch is from the player
     */
  constructor(switchType: SwitchType, fieldIndex: integer, slotIndex: integer, doReturn: boolean, player?: boolean) {
    super(fieldIndex, player !== undefined ? player : true);

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
        this.slotIndex = gScene.currentBattle.trainer?.getNextSummonIndex(!this.fieldIndex ? TrainerSlot.TRAINER : TrainerSlot.TRAINER_PARTNER); // TODO: what would be the default trainer-slot fallback?
      }
      if (this.slotIndex > -1) {
        this.showEnemyTrainer(!(this.fieldIndex % 2) ? TrainerSlot.TRAINER : TrainerSlot.TRAINER_PARTNER);
        gScene.pbTrayEnemy.showPbTray(gScene.getEnemyParty());
      }
    }

    if (!this.doReturn || (this.slotIndex !== -1 && !(this.player ? gScene.getParty() : gScene.getEnemyParty())[this.slotIndex])) {
      if (this.player) {
        return this.switchAndSummon();
      } else {
        gScene.time.delayedCall(750, () => this.switchAndSummon());
        return;
      }
    }

    const pokemon = this.getPokemon();
    (this.player ? gScene.getEnemyField() : gScene.getPlayerField()).forEach(enemyPokemon => enemyPokemon.removeTagsBySourceId(pokemon.id));
    if (this.switchType === SwitchType.SWITCH || this.switchType === SwitchType.INITIAL_SWITCH) {
      const substitute = pokemon.getTag(SubstituteTag);
      if (substitute) {
        gScene.tweens.add({
          targets: substitute.sprite,
          duration: 250,
          scale: substitute.sprite.scale * 0.5,
          ease: "Sine.easeIn",
          onComplete: () => substitute.sprite.destroy()
        });
      }
    }

    gScene.ui.showText(this.player ?
      i18next.t("battle:playerComeBack", { pokemonName: getPokemonNameWithAffix(pokemon) }) :
      i18next.t("battle:trainerComeBack", {
        trainerName: gScene.currentBattle.trainer?.getName(!(this.fieldIndex % 2) ? TrainerSlot.TRAINER : TrainerSlot.TRAINER_PARTNER),
        pokemonName: pokemon.getNameToRender()
      })
    );
    gScene.playSound("se/pb_rel");
    pokemon.hideInfo();
    pokemon.tint(getPokeballTintColor(pokemon.pokeball), 1, 250, "Sine.easeIn");
    gScene.tweens.add({
      targets: pokemon,
      duration: 250,
      ease: "Sine.easeIn",
      scale: 0.5,
      onComplete: () => {
        pokemon.leaveField(this.switchType === SwitchType.SWITCH, false);
        gScene.time.delayedCall(750, () => this.switchAndSummon());
      }
    });
  }

  switchAndSummon() {
    const party = this.player ? this.getParty() : gScene.getEnemyParty();
    const switchedInPokemon = party[this.slotIndex];
    this.lastPokemon = this.getPokemon();
    applyPreSwitchOutAbAttrs(PreSwitchOutAbAttr, this.lastPokemon);
    if (this.switchType === SwitchType.BATON_PASS && switchedInPokemon) {
      (this.player ? gScene.getEnemyField() : gScene.getPlayerField()).forEach(enemyPokemon => enemyPokemon.transferTagsBySourceId(this.lastPokemon.id, switchedInPokemon.id));
      if (!gScene.findModifier(m => m instanceof SwitchEffectTransferModifier && (m as SwitchEffectTransferModifier).pokemonId === switchedInPokemon.id)) {
        const batonPassModifier = gScene.findModifier(m => m instanceof SwitchEffectTransferModifier
            && (m as SwitchEffectTransferModifier).pokemonId === this.lastPokemon.id) as SwitchEffectTransferModifier;
        if (batonPassModifier && !gScene.findModifier(m => m instanceof SwitchEffectTransferModifier && (m as SwitchEffectTransferModifier).pokemonId === switchedInPokemon.id)) {
          gScene.tryTransferHeldItemModifier(batonPassModifier, switchedInPokemon, false);
        }
      }
    }
    if (switchedInPokemon) {
      party[this.slotIndex] = this.lastPokemon;
      party[this.fieldIndex] = switchedInPokemon;
      const showTextAndSummon = () => {
        gScene.ui.showText(this.player ?
          i18next.t("battle:playerGo", { pokemonName: getPokemonNameWithAffix(switchedInPokemon) }) :
          i18next.t("battle:trainerGo", {
            trainerName: gScene.currentBattle.trainer?.getName(!(this.fieldIndex % 2) ? TrainerSlot.TRAINER : TrainerSlot.TRAINER_PARTNER),
            pokemonName: this.getPokemon().getNameToRender()
          })
        );
        /**
         * If this switch is passing a Substitute, make the switched Pokemon match the returned Pokemon's state as it left.
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
          switchedInPokemon.resetBattleData();
          switchedInPokemon.resetSummonData();
        }
        this.summon();
      };
      if (this.player) {
        showTextAndSummon();
      } else {
        gScene.time.delayedCall(1500, () => {
          this.hideEnemyTrainer();
          gScene.pbTrayEnemy.hide();
          showTextAndSummon();
        });
      }
    } else {
      this.end();
    }
  }

  onEnd(): void {
    super.onEnd();

    const pokemon = this.getPokemon();

    const moveId = gScene.currentBattle.lastMove;
    const lastUsedMove = moveId ? allMoves[moveId] : undefined;

    const currentCommand = gScene.currentBattle.turnCommands[this.fieldIndex]?.command;
    const lastPokemonIsForceSwitchedAndNotFainted = lastUsedMove?.hasAttr(ForceSwitchOutAttr) && !this.lastPokemon.isFainted();

    // Compensate for turn spent summoning
    // Or compensate for force switch move if switched out pokemon is not fainted
    if (currentCommand === Command.POKEMON || lastPokemonIsForceSwitchedAndNotFainted) {
      pokemon.battleSummonData.turnCount--;
      pokemon.battleSummonData.waveTurnCount--;
    }

    if (this.switchType === SwitchType.BATON_PASS && pokemon) {
      pokemon.transferSummon(this.lastPokemon);
    } else if (this.switchType === SwitchType.SHED_TAIL && pokemon) {
      const subTag = this.lastPokemon.getTag(SubstituteTag);
      if (subTag) {
        pokemon.summonData.tags.push(subTag);
      }
    }

    if (this.switchType !== SwitchType.INITIAL_SWITCH) {
      pokemon.resetTurnData();
      pokemon.turnData.switchedInThisTurn = true;
    }

    this.lastPokemon?.resetSummonData();

    gScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeActiveTrigger, true);
    // Reverts to weather-based forms when weather suppressors (Cloud Nine/Air Lock) are switched out
    gScene.arena.triggerWeatherBasedFormChanges();
  }

  queuePostSummon(): void {
    gScene.unshiftPhase(new PostSummonPhase(this.getPokemon().getBattlerIndex()));
  }
}
