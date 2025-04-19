import { globalScene } from "#app/global-scene";
import {
  applyPreSummonAbAttrs,
  applyPreSwitchOutAbAttrs,
  PostDamageForceSwitchAbAttr,
  PreSummonAbAttr,
  PreSwitchOutAbAttr,
} from "#app/data/abilities/ability";
import { allMoves, ForceSwitchOutAttr } from "#app/data/moves/move";
import { getPokeballTintColor } from "#app/data/pokeball";
import { SpeciesFormChangeActiveTrigger } from "#app/data/pokemon-forms";
import { TrainerSlot } from "#enums/trainer-slot";
import type Pokemon from "#app/field/pokemon";
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
  private readonly slotIndex: number;
  private readonly doReturn: boolean;

  private lastPokemon: Pokemon;

  /**
   * Constructor for creating a new SwitchSummonPhase
   * @param switchType - The type of switch behavior
   * @param fieldIndex - Position on the battle field
   * @param slotIndex - The index of pokemon (in party of 6) to switch into
   * @param doReturn - Whether to render "comeback" dialogue
   * @param player - (Optional) `true` if the switch is from the player
   */
  constructor(switchType: SwitchType, fieldIndex: number, slotIndex: number, doReturn: boolean, player?: boolean) {
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
        return this.switchAndSummon();
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
    const switchedInPokemon = party[this.slotIndex];
    this.lastPokemon = this.getPokemon();
    applyPreSummonAbAttrs(PreSummonAbAttr, switchedInPokemon);
    applyPreSwitchOutAbAttrs(PreSwitchOutAbAttr, this.lastPokemon);
    if (this.switchType === SwitchType.BATON_PASS && switchedInPokemon) {
      (this.player ? globalScene.getEnemyField() : globalScene.getPlayerField()).forEach(enemyPokemon =>
        enemyPokemon.transferTagsBySourceId(this.lastPokemon.id, switchedInPokemon.id),
      );
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
        if (
          batonPassModifier &&
          !globalScene.findModifier(
            m =>
              m instanceof SwitchEffectTransferModifier &&
              (m as SwitchEffectTransferModifier).pokemonId === switchedInPokemon.id,
          )
        ) {
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
    if (switchedInPokemon) {
      party[this.slotIndex] = this.lastPokemon;
      party[this.fieldIndex] = switchedInPokemon;
      const showTextAndSummon = () => {
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
          switchedInPokemon.resetSummonData();
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
    } else {
      this.end();
    }
  }

  onEnd(): void {
    super.onEnd();

    const pokemon = this.getPokemon();

    const moveId = globalScene.currentBattle.lastMove;
    const lastUsedMove = moveId ? allMoves[moveId] : undefined;

    const currentCommand = globalScene.currentBattle.turnCommands[this.fieldIndex]?.command;
    const lastPokemonIsForceSwitchedAndNotFainted =
      lastUsedMove?.hasAttr(ForceSwitchOutAttr) && !this.lastPokemon.isFainted();
    const lastPokemonHasForceSwitchAbAttr =
      this.lastPokemon.hasAbilityWithAttr(PostDamageForceSwitchAbAttr) && !this.lastPokemon.isFainted();

    // Compensate for turn spent summoning
    // Or compensate for force switch move if switched out pokemon is not fainted
    if (
      currentCommand === Command.POKEMON ||
      lastPokemonIsForceSwitchedAndNotFainted ||
      lastPokemonHasForceSwitchAbAttr
    ) {
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

    globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeActiveTrigger, true);
    // Reverts to weather-based forms when weather suppressors (Cloud Nine/Air Lock) are switched out
    globalScene.arena.triggerWeatherBasedFormChanges();
  }

  queuePostSummon(): void {
    globalScene.unshiftPhase(new PostSummonPhase(this.getPokemon().getBattlerIndex()));
  }
}
