import type { Animation } from "#app/animations";
import { audioManager } from "#app/global-audio-manager";
import { EVOLVE_MOVE, FORGET_MOVE } from "#app/constants";
import { formChangeSignatureMoves } from "#app/data/form-change-signature-moves";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { getSpeciesFormChangeMessage } from "#data/form-change-triggers";
import type { SpeciesFormChange } from "#data/pokemon-forms";
import { BattlerTagType } from "#enums/battler-tag-type";
import { LearnMoveSituation } from "#enums/learn-move-situation";
import { LearnMoveType } from "#enums/learn-move-type";
import { MoveId } from "#enums/move-id";
import { SpeciesFormKey } from "#enums/species-form-key";
import { UiMode } from "#enums/ui-mode";
import type { PlayerPokemon, Pokemon } from "#field/pokemon";
import { EvolutionPhase } from "#phases/evolution-phase";
import { achvs } from "#system/achv";
import type { PartyUiHandler } from "#ui/party-ui-handler";
import { fixedInt } from "#utils/common";

export class FormChangePhase extends EvolutionPhase {
  public readonly phaseName = "FormChangePhase";
  private formChange: SpeciesFormChange;
  private modal: boolean;
  /** Move de assinatura da forma anterior (o que vai ser substituído), se existir */
  private preFormMoveIds: number[] = [];

  constructor(pokemon: PlayerPokemon, formChange: SpeciesFormChange, modal: boolean) {
    super(pokemon, null, 0);

    this.formChange = formChange;
    this.modal = modal;
  }

  validate(): boolean {
    return !!this.formChange;
  }

  setMode(): Promise<void> {
    if (!this.modal) {
      return super.setMode();
    }
    return globalScene.ui.setOverlayMode(UiMode.EVOLUTION_SCENE);
  }

  /**
   * Commence the tweens that play after the form change animation finishes
   * @param transformedPokemon - The Pokemon after the evolution
   * @param preName - The name of the Pokemon before the evolution
   */
  private postFormChangeTweens(transformedPokemon: Pokemon, preName: string): void {
    globalScene.tweens.chain({
      targets: null,
      tweens: [
        {
          targets: this.evolutionOverlay,
          alpha: 1,
          duration: 250,
          easing: "Sine.easeIn",
          onComplete: () => {
            this.evolutionBgOverlay.setAlpha(1);
            this.evolutionBg.setVisible(false);
          },
        },
        {
          targets: [this.evolutionOverlay, this.pokemonEvoTintSprite],
          alpha: 0,
          duration: 2000,
          delay: 150,
          easing: "Sine.easeIn",
        },
        {
          targets: this.evolutionBgOverlay,
          alpha: 0,
          duration: 250,
          completeDelay: 250,
          onComplete: () => this.pokemon.cry(),
        },
      ],
      // 1.25 seconds after the pokemon cry
      completeDelay: 1250,
      onComplete: () => {
        let playEvolutionFanfare = false;
        if (this.formChange.formKey.indexOf(SpeciesFormKey.MEGA) > -1) {
          globalScene.validateAchv(achvs.MEGA_EVOLVE);
          playEvolutionFanfare = true;
        } else if (
          this.formChange.formKey.indexOf(SpeciesFormKey.GIGANTAMAX) > -1
          || this.formChange.formKey.indexOf(SpeciesFormKey.ETERNAMAX) > -1
        ) {
          globalScene.validateAchv(achvs.GIGANTAMAX);
          playEvolutionFanfare = true;
        }

        const delay = playEvolutionFanfare ? 4000 : 1750;
        audioManager.replaceBgmUntilEnd(playEvolutionFanfare ? "bw/evolution_fanfare" : "bw/minor_fanfare");
        transformedPokemon.destroy();
        globalScene.ui.showText(
          getSpeciesFormChangeMessage(this.pokemon, this.formChange, preName),
          null,
          () => this.end(),
          null,
          true,
          fixedInt(delay),
        );
        globalScene.time.delayedCall(fixedInt(delay + 250), () => audioManager.playBgm());
      },
    });
  }

  /**
   * Commence the animations that occur once the form change evolution cycle is complete
   *
   * @privateRemarks
   * This would prefer {@linkcode Animation.doCycle | doCycle} to be refactored and de-promisified so this can be moved into {@linkcode beginTweens}
   * @param preName - The name of the Pokemon before the evolution
   * @param transformedPokemon - The Pokemon being transformed into
   */
  private afterCycle(preName: string, transformedPokemon: Pokemon): void {
    audioManager.playSound("se/sparkle");
    this.pokemonEvoSprite.setVisible(true);
    globalScene.animations.doCircleInward(this.evolutionBaseBg, this.evolutionContainer);
    globalScene.time.delayedCall(900, () => {
      // Guarda o EVOLVE_MOVE da forma actual antes de mudar (será o move a substituir)
      this.preFormMoveIds = this.pokemon.moveset.map(m => m?.moveId ?? -1);

      this.pokemon.changeForm(this.formChange).then(() => {
        if (!this.modal) {
          globalScene.phaseManager.unshiftNew("EndEvolutionPhase");
        }
        audioManager.playSound("se/shine");
        globalScene.animations.doSpray(this.evolutionBaseBg, this.evolutionContainer);
        this.postFormChangeTweens(transformedPokemon, preName);
      });
    });
  }

  /**
   * Commence the sequence of tweens and events that occur during the evolution animation
   * @param preName The name of the Pokemon before the evolution
   * @param transformedPokemon The Pokemon after the evolution
   */
  private beginTweens(preName: string, transformedPokemon: Pokemon): void {
    globalScene.tweens.chain({
      // Starts 250ms after sprites have been configured
      targets: null,
      tweens: [
        // Step 1: Fade in the background overlay
        {
          delay: 250,
          targets: this.evolutionBgOverlay,
          alpha: 1,
          duration: 1500,
          ease: "Sine.easeOut",
          // We want the backkground overlay to fade out after it fades in
          onComplete: () => {
            globalScene.tweens.add({
              targets: this.evolutionBgOverlay,
              alpha: 0,
              duration: 250,
              delay: 1000,
            });
            this.evolutionBg.setVisible(true).play();
          },
        },
        // Step 2: Play the sounds and fade in the tint sprite
        {
          targets: this.pokemonTintSprite,
          alpha: { from: 0, to: 1 },
          duration: 2000,
          onStart: () => {
            audioManager.playSound("se/charge");
            globalScene.animations.doSpiralUpward(this.evolutionBaseBg, this.evolutionContainer);
          },
          onComplete: () => {
            this.pokemonSprite.setVisible(false);
          },
        },
      ],

      // Step 3: Commence the form change animation via doCycle then continue the animation chain with afterCycle
      completeDelay: 1100,
      onComplete: () => {
        audioManager.playSound("se/beam");
        globalScene.animations.doArcDownward(this.evolutionBaseBg, this.evolutionContainer);
        globalScene.time.delayedCall(1000, () => {
          this.pokemonEvoTintSprite.setScale(0.25).setVisible(true);
          globalScene.animations
            .doCycle(1, 1, this.pokemonTintSprite, this.pokemonEvoSprite)
            .then(() => this.afterCycle(preName, transformedPokemon));
        });
      },
    });
  }

  doEvolution(): void {
    const preName = getPokemonNameWithAffix(this.pokemon, false);

    this.pokemon.getPossibleForm(this.formChange).then(transformedPokemon => {
      this.configureSprite(transformedPokemon, this.pokemonEvoSprite, false);
      this.configureSprite(transformedPokemon, this.pokemonEvoTintSprite, false);
      this.beginTweens(preName, transformedPokemon);
    });
  }

  end(): void {
    this.pokemon.findAndRemoveTags(t => t.tagType === BattlerTagType.AUTOTOMIZED);

    console.log("FormChangePhase.end() - formKey:", this.pokemon.getFormKey());
  const allLevelMoves = this.pokemon.getLevelMoves(1, true, false, false, LearnMoveSituation.EVOLUTION);
  console.log("All level moves with EVOLVE/FORGET:", allLevelMoves.filter(lm => lm[0] <= 0));

    const forgetMoves = this.pokemon
      .getLevelMoves(1, true, false, false, LearnMoveSituation.EVOLUTION)
      .filter(lm => lm[0] === FORGET_MOVE);

    for (const fm of forgetMoves) {
      const moveId = fm[1];
      const moveIndex = this.pokemon.moveset.findIndex(m => m?.moveId === moveId);
      if (moveIndex !== -1) {
        this.pokemon.moveset.splice(moveIndex, 1);
      }
    }

    // For cases where the Pokemon has no moves left after forgetting
    if (forgetMoves.length > 0 && this.pokemon.moveset.length === 0) {
      globalScene.phaseManager.unshiftNew(
        "LearnMovePhase",
        globalScene.getPlayerParty().indexOf(this.pokemon),
        MoveId.CONFUSION,
        LearnMoveType.FORM_CHANGE,
      );
    }

    // After form change, checks if there are any signature moves to be learned
    const levelMoves = this.pokemon
      .getLevelMoves(1, true, false, false, LearnMoveSituation.EVOLUTION)
      .filter(lm => lm[0] === EVOLVE_MOVE);

    const formRules = formChangeSignatureMoves[this.pokemon.species.speciesId]?.[this.pokemon.getFormKey()] ?? [];

    for (const lm of levelMoves) {
      const moveId = lm[1];
      const alreadyKnows = this.pokemon.moveset.some(m => m?.moveId === moveId);
      if (!alreadyKnows) {
        // Procura no learnset da forma nova outros moves que o Pokémon tinha antes
        // O move a substituir é o que existia no moveset anterior e ainda existe
        // no learnset da forma nova a nível > 0 (i.e. não é um EVOLVE_MOVE)
        /*const newFormAllMoves = this.pokemon
          .getLevelMoves(
            1, 
            true, 
            false, 
            false, 
            LearnMoveSituation.EVOLUTION)
          .map(lm2 => lm2[1]);*/
        /*const replaceMoveId =
          this.preFormMoveIds.find(
            id => id !== -1 && !newFormAllMoves.includes(id) && id !== moveId && !evolveMoveIds.includes(id)
          ) ?? null;*/

        /*const explicitReplaceId = lm[2];
        const replaceMoveId = explicitReplaceId !== undefined && this.preFormMoveIds.includes(explicitReplaceId)
              ? explicitReplaceId
              : null;

        if (explicitReplaceId !== undefined && replaceMoveId === null) {
          continue;
        }*/
        const rules = formRules.filter(r => r.learn === moveId);

        const replaceMoveId =
          rules.map(r => r.replace).find(move => move !== undefined && this.preFormMoveIds.includes(move)) ?? null;

        const hasExplicitReplace = rules.some(r => r.replace !== undefined);

        if (hasExplicitReplace && replaceMoveId === null) {
          continue;
        }

        globalScene.phaseManager.unshiftNew(
          "LearnMovePhase",
          globalScene.getPlayerParty().indexOf(this.pokemon),
          moveId,
          LearnMoveType.FORM_CHANGE,
          -1,
          replaceMoveId,
        );
      }
    }

    if (this.modal) {
      globalScene.ui.revertMode().then(() => {
        if (globalScene.ui.getMode() === UiMode.PARTY) {
          const partyUiHandler = globalScene.ui.getHandler() as PartyUiHandler;
          partyUiHandler.clearPartySlots();
          partyUiHandler.populatePartySlots();
        }
        super.end();
      });
    } else {
      super.end();
    }
  }
}
