import BattleScene from "#app/battle-scene";
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
import * as LoggerTools from "../logger";
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
  constructor(scene: BattleScene, switchType: SwitchType, fieldIndex: integer, slotIndex: integer, doReturn: boolean, player?: boolean) {
    super(scene, fieldIndex, player !== undefined ? player : true);

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
        this.slotIndex = this.scene.currentBattle.trainer?.getNextSummonIndex(!this.fieldIndex ? TrainerSlot.TRAINER : TrainerSlot.TRAINER_PARTNER); // TODO: what would be the default trainer-slot fallback?
      }
      if (this.slotIndex > -1) {
        this.showEnemyTrainer(!(this.fieldIndex % 2) ? TrainerSlot.TRAINER : TrainerSlot.TRAINER_PARTNER);
        this.scene.pbTrayEnemy.showPbTray(this.scene.getEnemyParty());
      }
    }

    if (!this.doReturn || (this.slotIndex !== -1 && !(this.player ? this.scene.getParty() : this.scene.getEnemyParty())[this.slotIndex])) {
      if (this.player) {
        return this.switchAndSummon();
      } else {
        this.scene.time.delayedCall(750, () => this.switchAndSummon());
        return;
      }
    }

    const pokemon = this.getPokemon();

    if (this.switchType === SwitchType.SWITCH || this.switchType === SwitchType.MID_TURN_SWITCH) {
      (this.player ? this.scene.getEnemyField() : this.scene.getPlayerField()).forEach(enemyPokemon => enemyPokemon.removeTagsBySourceId(pokemon.id));
      const substitute = pokemon.getTag(SubstituteTag);
      if (substitute) {
        this.scene.tweens.add({
          targets: substitute.sprite,
          duration: 250,
          scale: substitute.sprite.scale * 0.5,
          ease: "Sine.easeIn",
          onComplete: () => substitute.sprite.destroy()
        });
      }
    }

    this.scene.ui.showText(this.player ?
      i18next.t("battle:playerComeBack", { pokemonName: getPokemonNameWithAffix(pokemon) }) :
      i18next.t("battle:trainerComeBack", {
        trainerName: this.scene.currentBattle.trainer?.getName(!(this.fieldIndex % 2) ? TrainerSlot.TRAINER : TrainerSlot.TRAINER_PARTNER),
        pokemonName: pokemon.getNameToRender()
      })
    );
    this.scene.playSound("se/pb_rel");
    pokemon.hideInfo();
    pokemon.tint(getPokeballTintColor(pokemon.pokeball), 1, 250, "Sine.easeIn");
    this.scene.tweens.add({
      targets: pokemon,
      duration: 250,
      ease: "Sine.easeIn",
      scale: 0.5,
      onComplete: () => {
        pokemon.leaveField(this.switchType === SwitchType.SWITCH, false);
        this.scene.time.delayedCall(750, () => this.switchAndSummon());
      }
    });
  }

  switchAndSummon() {
    const party = this.player ? this.getParty() : this.scene.getEnemyParty();
    const switchedInPokemon = party[this.slotIndex];
    this.lastPokemon = this.getPokemon();
    applyPreSwitchOutAbAttrs(PreSwitchOutAbAttr, this.lastPokemon);
    if ((this.switchType === SwitchType.BATON_PASS || this.switchType === SwitchType.MID_TURN_BATON_PASS) && switchedInPokemon) {
      (this.player ? this.scene.getEnemyField() : this.scene.getPlayerField()).forEach(enemyPokemon => enemyPokemon.transferTagsBySourceId(this.lastPokemon.id, switchedInPokemon.id));
      if (!this.scene.findModifier(m => m instanceof SwitchEffectTransferModifier && (m as SwitchEffectTransferModifier).pokemonId === switchedInPokemon.id)) {
        const batonPassModifier = this.scene.findModifier(m => m instanceof SwitchEffectTransferModifier
          && (m as SwitchEffectTransferModifier).pokemonId === this.lastPokemon.id) as SwitchEffectTransferModifier;
        if (batonPassModifier && !this.scene.findModifier(m => m instanceof SwitchEffectTransferModifier && (m as SwitchEffectTransferModifier).pokemonId === switchedInPokemon.id)) {
          this.scene.tryTransferHeldItemModifier(batonPassModifier, switchedInPokemon, false);
        }
      }
    }
    if (switchedInPokemon) {
      party[this.slotIndex] = this.lastPokemon;
      party[this.fieldIndex] = switchedInPokemon;
      const showTextAndSummon = () => {
        this.scene.ui.showText(this.player ?
          i18next.t("battle:playerGo", { pokemonName: getPokemonNameWithAffix(switchedInPokemon) }) :
          i18next.t("battle:trainerGo", {
            trainerName: this.scene.currentBattle.trainer?.getName(!(this.fieldIndex % 2) ? TrainerSlot.TRAINER : TrainerSlot.TRAINER_PARTNER),
            pokemonName: this.getPokemon().getNameToRender()
          })
        );
        /**
         * If this switch is passing a Substitute, make the switched Pokemon match the returned Pokemon's state as it left.
         * Otherwise, clear any persisting tags on the returned Pokemon.
         */
        if (this.switchType === SwitchType.BATON_PASS || this.switchType === SwitchType.MID_TURN_BATON_PASS || this.switchType === SwitchType.SHED_TAIL) {
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
        this.scene.time.delayedCall(1500, () => {
          this.hideEnemyTrainer();
          this.scene.pbTrayEnemy.hide();
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

    const moveId = this.lastPokemon?.scene.currentBattle.lastMove;
    const lastUsedMove = moveId ? allMoves[moveId] : undefined;

    const currentCommand = pokemon.scene.currentBattle.turnCommands[this.fieldIndex]?.command;
    const lastPokemonIsForceSwitchedAndNotFainted = lastUsedMove?.hasAttr(ForceSwitchOutAttr) && !this.lastPokemon.isFainted();

    // Compensate for turn spent summoning
    // Or compensate for force switch move if switched out pokemon is not fainted
    if (currentCommand === Command.POKEMON || lastPokemonIsForceSwitchedAndNotFainted) {
      pokemon.battleSummonData.turnCount--;
    }

    if ((this.switchType === SwitchType.BATON_PASS || this.switchType === SwitchType.MID_TURN_BATON_PASS) && pokemon) {
      pokemon.transferSummon(this.lastPokemon);
    } else if (this.switchType === SwitchType.SHED_TAIL && pokemon) {
      const subTag = this.lastPokemon.getTag(SubstituteTag);
      if (subTag) {
        pokemon.summonData.tags.push(subTag);
      }
    }

    this.lastPokemon?.resetSummonData();

    this.scene.triggerPokemonFormChange(pokemon, SpeciesFormChangeActiveTrigger, true);
    // Reverts to weather-based forms when weather suppressors (Cloud Nine/Air Lock) are switched out
    this.scene.arena.triggerWeatherBasedFormChanges();
  }

  queuePostSummon(): void {
    this.scene.unshiftPhase(new PostSummonPhase(this.scene, this.getPokemon().getBattlerIndex()));
  }
}
