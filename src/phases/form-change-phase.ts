import { gScene } from "../battle-scene";
import * as Utils from "../utils";
import { achvs } from "../system/achv";
import { SpeciesFormChange, getSpeciesFormChangeMessage } from "../data/pokemon-forms";
import { PlayerPokemon } from "../field/pokemon";
import { Mode } from "../ui/ui";
import PartyUiHandler from "../ui/party-ui-handler";
import { getPokemonNameWithAffix } from "../messages";
import { EndEvolutionPhase } from "./end-evolution-phase";
import { EvolutionPhase } from "./evolution-phase";
import { BattlerTagType } from "#app/enums/battler-tag-type";
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
    return gScene.ui.setOverlayMode(Mode.EVOLUTION_SCENE);
  }

  doEvolution(): void {
    const preName = getPokemonNameWithAffix(this.pokemon);

    this.pokemon.getPossibleForm(this.formChange).then(transformedPokemon => {

      [ this.pokemonEvoSprite, this.pokemonEvoTintSprite ].map(sprite => {
        sprite.play(transformedPokemon.getSpriteKey(true));
        sprite.setPipelineData("ignoreTimeTint", true);
        sprite.setPipelineData("spriteKey", transformedPokemon.getSpriteKey());
        sprite.setPipelineData("shiny", transformedPokemon.shiny);
        sprite.setPipelineData("variant", transformedPokemon.variant);
        [ "spriteColors", "fusionSpriteColors" ].map(k => {
          if (transformedPokemon.summonData?.speciesForm) {
            k += "Base";
          }
          sprite.pipelineData[k] = transformedPokemon.getSprite().pipelineData[k];
        });
      });

      gScene.time.delayedCall(250, () => {
        gScene.tweens.add({
          targets: this.evolutionBgOverlay,
          alpha: 1,
          delay: 500,
          duration: 1500,
          ease: "Sine.easeOut",
          onComplete: () => {
            gScene.time.delayedCall(1000, () => {
              gScene.tweens.add({
                targets: this.evolutionBgOverlay,
                alpha: 0,
                duration: 250
              });
              this.evolutionBg.setVisible(true);
              this.evolutionBg.play();
            });
            gScene.playSound("se/charge");
            this.doSpiralUpward();
            gScene.tweens.addCounter({
              from: 0,
              to: 1,
              duration: 2000,
              onUpdate: t => {
                this.pokemonTintSprite.setAlpha(t.getValue());
              },
              onComplete: () => {
                this.pokemonSprite.setVisible(false);
                gScene.time.delayedCall(1100, () => {
                  gScene.playSound("se/beam");
                  this.doArcDownward();
                  gScene.time.delayedCall(1000, () => {
                    this.pokemonEvoTintSprite.setScale(0.25);
                    this.pokemonEvoTintSprite.setVisible(true);
                    this.doCycle(1, 1).then(_success => {
                      gScene.playSound("se/sparkle");
                      this.pokemonEvoSprite.setVisible(true);
                      this.doCircleInward();
                      gScene.time.delayedCall(900, () => {
                        this.pokemon.changeForm(this.formChange).then(() => {
                          if (!this.modal) {
                            gScene.unshiftPhase(new EndEvolutionPhase());
                          }

                          gScene.playSound("se/shine");
                          this.doSpray();
                          gScene.tweens.add({
                            targets: this.evolutionOverlay,
                            alpha: 1,
                            duration: 250,
                            easing: "Sine.easeIn",
                            onComplete: () => {
                              this.evolutionBgOverlay.setAlpha(1);
                              this.evolutionBg.setVisible(false);
                              gScene.tweens.add({
                                targets: [ this.evolutionOverlay, this.pokemonEvoTintSprite ],
                                alpha: 0,
                                duration: 2000,
                                delay: 150,
                                easing: "Sine.easeIn",
                                onComplete: () => {
                                  gScene.tweens.add({
                                    targets: this.evolutionBgOverlay,
                                    alpha: 0,
                                    duration: 250,
                                    onComplete: () => {
                                      gScene.time.delayedCall(250, () => {
                                        this.pokemon.cry();
                                        gScene.time.delayedCall(1250, () => {
                                          let playEvolutionFanfare = false;
                                          if (this.formChange.formKey.indexOf(SpeciesFormKey.MEGA) > -1) {
                                            gScene.validateAchv(achvs.MEGA_EVOLVE);
                                            playEvolutionFanfare = true;
                                          } else if (this.formChange.formKey.indexOf(SpeciesFormKey.GIGANTAMAX) > -1 || this.formChange.formKey.indexOf(SpeciesFormKey.ETERNAMAX) > -1) {
                                            gScene.validateAchv(achvs.GIGANTAMAX);
                                            playEvolutionFanfare = true;
                                          }

                                          const delay = playEvolutionFanfare ? 4000 : 1750;
                                          gScene.playSoundWithoutBgm(playEvolutionFanfare ? "evolution_fanfare" : "minor_fanfare");

                                          transformedPokemon.destroy();
                                          gScene.ui.showText(getSpeciesFormChangeMessage(this.pokemon, this.formChange, preName), null, () => this.end(), null, true, Utils.fixedInt(delay));
                                          gScene.time.delayedCall(Utils.fixedInt(delay + 250), () => gScene.playBgm());
                                        });
                                      });
                                    }
                                  });
                                }
                              });
                            }
                          });
                        });
                      });
                    });
                  });
                });
              }
            });
          }
        });
      });
    });
  }

  end(): void {
    this.pokemon.findAndRemoveTags(t => t.tagType === BattlerTagType.AUTOTOMIZED);
    if (this.modal) {
      gScene.ui.revertMode().then(() => {
        if (gScene.ui.getMode() === Mode.PARTY) {
          const partyUiHandler = gScene.ui.getHandler() as PartyUiHandler;
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
