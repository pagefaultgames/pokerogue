import { globalScene } from "#app/global-scene";
import { fixedInt } from "#app/utils/common";
import { achvs } from "../system/achv";
import type { SpeciesFormChange } from "../data/pokemon-forms";
import { getSpeciesFormChangeMessage } from "../data/pokemon-forms";
import type { PlayerPokemon } from "../field/pokemon";
import { UiMode } from "#enums/ui-mode";
import type PartyUiHandler from "../ui/party-ui-handler";
import { getPokemonNameWithAffix } from "../messages";
import { EndEvolutionPhase } from "./end-evolution-phase";
import { EvolutionPhase } from "./evolution-phase";
import { BattlerTagType } from "#enums/battler-tag-type";
import { SpeciesFormKey } from "#enums/species-form-key";

export class FormChangePhase extends EvolutionPhase {
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

  doEvolution(): void {
    const preName = getPokemonNameWithAffix(this.pokemon);

    this.pokemon.getPossibleForm(this.formChange).then(transformedPokemon => {
      [this.pokemonEvoSprite, this.pokemonEvoTintSprite].map(sprite => {
        const spriteKey = transformedPokemon.getSpriteKey(true);
        try {
          sprite.play(spriteKey);
        } catch (err: unknown) {
          console.error(`Failed to play animation for ${spriteKey}`, err);
        }

        sprite.setPipelineData("ignoreTimeTint", true);
        sprite.setPipelineData("spriteKey", transformedPokemon.getSpriteKey());
        sprite.setPipelineData("shiny", transformedPokemon.shiny);
        sprite.setPipelineData("variant", transformedPokemon.variant);
        ["spriteColors", "fusionSpriteColors"].map(k => {
          if (transformedPokemon.summonData?.speciesForm) {
            k += "Base";
          }
          sprite.pipelineData[k] = transformedPokemon.getSprite().pipelineData[k];
        });
      });

      globalScene.time.delayedCall(250, () => {
        globalScene.tweens.add({
          targets: this.evolutionBgOverlay,
          alpha: 1,
          delay: 500,
          duration: 1500,
          ease: "Sine.easeOut",
          onComplete: () => {
            globalScene.time.delayedCall(1000, () => {
              globalScene.tweens.add({
                targets: this.evolutionBgOverlay,
                alpha: 0,
                duration: 250,
              });
              this.evolutionBg.setVisible(true);
              this.evolutionBg.play();
            });
            globalScene.playSound("se/charge");
            this.doSpiralUpward();
            globalScene.tweens.addCounter({
              from: 0,
              to: 1,
              duration: 2000,
              onUpdate: t => {
                this.pokemonTintSprite.setAlpha(t.getValue());
              },
              onComplete: () => {
                this.pokemonSprite.setVisible(false);
                globalScene.time.delayedCall(1100, () => {
                  globalScene.playSound("se/beam");
                  this.doArcDownward();
                  globalScene.time.delayedCall(1000, () => {
                    this.pokemonEvoTintSprite.setScale(0.25);
                    this.pokemonEvoTintSprite.setVisible(true);
                    this.doCycle(1, 1).then(_success => {
                      globalScene.playSound("se/sparkle");
                      this.pokemonEvoSprite.setVisible(true);
                      this.doCircleInward();
                      globalScene.time.delayedCall(900, () => {
                        this.pokemon.changeForm(this.formChange).then(() => {
                          if (!this.modal) {
                            globalScene.unshiftPhase(new EndEvolutionPhase());
                          }

                          globalScene.playSound("se/shine");
                          this.doSpray();
                          globalScene.tweens.add({
                            targets: this.evolutionOverlay,
                            alpha: 1,
                            duration: 250,
                            easing: "Sine.easeIn",
                            onComplete: () => {
                              this.evolutionBgOverlay.setAlpha(1);
                              this.evolutionBg.setVisible(false);
                              globalScene.tweens.add({
                                targets: [this.evolutionOverlay, this.pokemonEvoTintSprite],
                                alpha: 0,
                                duration: 2000,
                                delay: 150,
                                easing: "Sine.easeIn",
                                onComplete: () => {
                                  globalScene.tweens.add({
                                    targets: this.evolutionBgOverlay,
                                    alpha: 0,
                                    duration: 250,
                                    onComplete: () => {
                                      globalScene.time.delayedCall(250, () => {
                                        this.pokemon.cry();
                                        globalScene.time.delayedCall(1250, () => {
                                          let playEvolutionFanfare = false;
                                          if (this.formChange.formKey.indexOf(SpeciesFormKey.MEGA) > -1) {
                                            globalScene.validateAchv(achvs.MEGA_EVOLVE);
                                            playEvolutionFanfare = true;
                                          } else if (
                                            this.formChange.formKey.indexOf(SpeciesFormKey.GIGANTAMAX) > -1 ||
                                            this.formChange.formKey.indexOf(SpeciesFormKey.ETERNAMAX) > -1
                                          ) {
                                            globalScene.validateAchv(achvs.GIGANTAMAX);
                                            playEvolutionFanfare = true;
                                          }

                                          const delay = playEvolutionFanfare ? 4000 : 1750;
                                          globalScene.playSoundWithoutBgm(
                                            playEvolutionFanfare ? "evolution_fanfare" : "minor_fanfare",
                                          );

                                          transformedPokemon.destroy();
                                          globalScene.ui.showText(
                                            getSpeciesFormChangeMessage(this.pokemon, this.formChange, preName),
                                            null,
                                            () => this.end(),
                                            null,
                                            true,
                                            fixedInt(delay),
                                          );
                                          globalScene.time.delayedCall(fixedInt(delay + 250), () =>
                                            globalScene.playBgm(),
                                          );
                                        });
                                      });
                                    },
                                  });
                                },
                              });
                            },
                          });
                        });
                      });
                    });
                  });
                });
              },
            });
          },
        });
      });
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
