import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { getSpeciesFormChangeMessage } from "#data/form-change-triggers";
import type { SpeciesFormChange } from "#data/pokemon-forms";
import { BattlerTagType } from "#enums/battler-tag-type";
import { SpeciesFormKey } from "#enums/species-form-key";
import { UiMode } from "#enums/ui-mode";
import type { PlayerPokemon, Pokemon } from "#field/pokemon";
import { EvolutionPhase } from "#phases/evolution-phase";
import { achvs } from "#system/achv";
import type { PartyUiHandler } from "#ui/handlers/party-ui-handler";
import { fixedInt } from "#utils/common";

export class FormChangePhase extends EvolutionPhase {
  public readonly phaseName = "FormChangePhase";
  private formChange: SpeciesFormChange;
  private modal: boolean;

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
        globalScene.playSoundWithoutBgm(playEvolutionFanfare ? "evolution_fanfare" : "minor_fanfare");
        transformedPokemon.destroy();
        globalScene.ui.showText(
          getSpeciesFormChangeMessage(this.pokemon, this.formChange, preName),
          null,
          () => this.end(),
          null,
          true,
          fixedInt(delay),
        );
        globalScene.time.delayedCall(fixedInt(delay + 250), () => globalScene.playBgm());
      },
    });
  }

  /**
   * Commence the animations that occur once the form change evolution cycle ({@linkcode doCycle}) is complete
   *
   * @privateRemarks
   * This would prefer {@linkcode doCycle} to be refactored and de-promisified so this can be moved into {@linkcode beginTweens}
   * @param preName - The name of the Pokemon before the evolution
   * @param transformedPokemon - The Pokemon being transformed into
   */
  private afterCycle(preName: string, transformedPokemon: Pokemon): void {
    globalScene.playSound("se/sparkle");
    this.pokemonEvoSprite.setVisible(true);
    this.doCircleInward();
    globalScene.time.delayedCall(900, () => {
      this.pokemon.changeForm(this.formChange).then(() => {
        if (!this.modal) {
          globalScene.phaseManager.unshiftNew("EndEvolutionPhase");
        }
        globalScene.playSound("se/shine");
        this.doSpray();
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
            globalScene.playSound("se/charge");
            this.doSpiralUpward();
          },
          onComplete: () => {
            this.pokemonSprite.setVisible(false);
          },
        },
      ],

      // Step 3: Commence the form change animation via doCycle then continue the animation chain with afterCycle
      completeDelay: 1100,
      onComplete: () => {
        globalScene.playSound("se/beam");
        this.doArcDownward();
        globalScene.time.delayedCall(1000, () => {
          this.pokemonEvoTintSprite.setScale(0.25).setVisible(true);
          this.doCycle(1, 1, () => this.afterCycle(preName, transformedPokemon));
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
