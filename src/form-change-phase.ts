import BattleScene from "./battle-scene";
import * as Utils from "./utils";
import { SpeciesFormKey } from "./data/pokemon-species";
import { achvs } from "./system/achv";
import { SpeciesFormChange, getSpeciesFormChangeMessage } from "./data/pokemon-forms";
import { EndEvolutionPhase, EvolutionPhase } from "./evolution-phase";
import Pokemon, { EnemyPokemon, PlayerPokemon } from "./pokemon";
import { Mode } from "./ui/ui";
import PartyUiHandler from "./ui/party-ui-handler";
import { BattlePhase } from "./battle-phase";
import { BattleSpec } from "./enums/battle-spec";
import { MovePhase, PokemonHealPhase } from "./battle-phases";

export class FormChangePhase extends EvolutionPhase {
  private formChange: SpeciesFormChange;
  private modal: boolean;

  constructor(scene: BattleScene, pokemon: PlayerPokemon, formChange: SpeciesFormChange, modal: boolean) {
    super(scene, pokemon, null, 0);

    this.formChange = formChange;
    this.modal = modal;
  }

  validate(): boolean {
    return !!this.formChange;
  }

  setMode(): Promise<void> {
    if (!this.modal)
      return super.setMode();
    return this.scene.ui.setOverlayMode(Mode.EVOLUTION_SCENE);
  }

  doEvolution(): void {
    const preName = this.pokemon.name;
    
    this.pokemon.getPossibleForm(this.formChange).then(transformedPokemon => {

      [ this.pokemonEvoSprite, this.pokemonEvoTintSprite ].map(sprite => {
        sprite.play(transformedPokemon.getSpriteKey(true));
        sprite.pipelineData['ignoreTimeTint'] = true;
        [ 'spriteColors', 'fusionSpriteColors' ].map(k => {
          if (transformedPokemon.summonData?.speciesForm)
            k += 'Base';
          sprite.pipelineData[k] = transformedPokemon.getSprite().pipelineData[k];
        });
      });

      this.scene.time.delayedCall(250, () => {
        this.scene.tweens.add({
          targets: this.evolutionBgOverlay,
          alpha: 1,
          delay: 500,
          duration: 1500,
          ease: 'Sine.easeOut',
          onComplete: () => {
            this.scene.time.delayedCall(1000, () => {
              this.scene.tweens.add({
                targets: this.evolutionBgOverlay,
                alpha: 0,
                duration: 250
              });
              this.evolutionBg.setVisible(true);
              this.evolutionBg.play();
            });
            this.scene.playSound('charge');
            this.doSpiralUpward();
            this.scene.tweens.addCounter({
              from: 0,
              to: 1,
              duration: 2000,
              onUpdate: t => {
                this.pokemonTintSprite.setAlpha(t.getValue());
              },
              onComplete: () => {
                this.pokemonSprite.setVisible(false);
                this.scene.time.delayedCall(1100, () => {
                  this.scene.playSound('beam');
                  this.doArcDownward();
                  this.scene.time.delayedCall(1000, () => {
                    this.pokemonEvoTintSprite.setScale(0.25);
                    this.pokemonEvoTintSprite.setVisible(true);
                    this.doCycle(1, 1).then(_success => {
                      this.scene.playSound('sparkle');
                      this.pokemonEvoSprite.setVisible(true);
                      this.doCircleInward();
                      this.scene.time.delayedCall(900, () => {
                        this.pokemon.changeForm(this.formChange).then(() => {
                          if (!this.modal)
                            this.scene.unshiftPhase(new EndEvolutionPhase(this.scene));

                          this.scene.playSound('shine');
                          this.doSpray();
                          this.scene.tweens.add({
                            targets: this.evolutionOverlay,
                            alpha: 1,
                            duration: 250,
                            easing: 'Sine.easeIn',
                            onComplete: () => {
                              this.evolutionBgOverlay.setAlpha(1);
                              this.evolutionBg.setVisible(false);
                              this.scene.tweens.add({
                                targets: [ this.evolutionOverlay, this.pokemonEvoTintSprite ],
                                alpha: 0,
                                duration: 2000,
                                delay: 150,
                                easing: 'Sine.easeIn',
                                onComplete: () => {
                                  this.scene.tweens.add({
                                    targets: this.evolutionBgOverlay,
                                    alpha: 0,
                                    duration: 250,
                                    onComplete: () => {
                                      this.scene.time.delayedCall(250, () => {
                                        this.pokemon.cry();
                                        this.scene.time.delayedCall(1250, () => {
                                          const isMega = this.formChange.formKey.indexOf(SpeciesFormKey.MEGA) > -1;
                                          let playEvolutionFanfare = false;
                                          if (isMega) {
                                            this.scene.validateAchv(achvs.MEGA_EVOLVE);
                                            playEvolutionFanfare = true;
                                          }

                                          const delay = playEvolutionFanfare ? 4000 : 1750;
                                          this.scene.playSoundWithoutBgm(playEvolutionFanfare ? 'evolution_fanfare' : 'minor_fanfare');
                                          
                                          transformedPokemon.destroy();
                                          this.scene.ui.showText(getSpeciesFormChangeMessage(this.pokemon, this.formChange, preName), null, () => this.end(), null, true, Utils.fixedInt(delay));
                                          this.scene.time.delayedCall(Utils.fixedInt(delay + 250), () => this.scene.playBgm());
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
            })
          }
        });
      });
    });
  }

  end(): void {
    if (this.modal) {
      this.scene.ui.revertMode().then(() => {
        if (this.scene.ui.getMode() === Mode.PARTY) {
          const partyUiHandler = this.scene.ui.getHandler() as PartyUiHandler;
          partyUiHandler.clearPartySlots();
          partyUiHandler.populatePartySlots();
        }

        super.end();
      });
    } else
      super.end();
  }
}

export class QuietFormChangePhase extends BattlePhase {
  protected pokemon: Pokemon;
  protected formChange: SpeciesFormChange;

  constructor(scene: BattleScene, pokemon: Pokemon, formChange: SpeciesFormChange) {
    super(scene);
    this.pokemon = pokemon;
    this.formChange = formChange;
  }

  start(): void {
    super.start();

    if (this.pokemon.formIndex === this.pokemon.species.forms.findIndex(f => f.formKey === this.formChange.formKey))
      return this.end();

    const preName = this.pokemon.name;
    this.pokemon.changeForm(this.formChange).then(() => {
      this.scene.ui.showText(getSpeciesFormChangeMessage(this.pokemon, this.formChange, preName), null, () => this.end(), Utils.fixedInt(1500));
    });
  }

  end(): void {
    if (this.pokemon.scene.currentBattle.battleSpec === BattleSpec.FINAL_BOSS && this.pokemon instanceof EnemyPokemon) {
      this.scene.playBgm();
      this.scene.unshiftPhase(new PokemonHealPhase(this.scene, this.pokemon.getBattlerIndex(), this.pokemon.getMaxHp(), null, false));
      this.pokemon.bossSegments = 5;
      this.pokemon.bossSegmentIndex = 4;
      this.pokemon.initBattleInfo();
      this.pokemon.cry();
      
      const movePhase = this.scene.findPhase(p => p instanceof MovePhase && p.pokemon === this.pokemon) as MovePhase;
      if (movePhase)
        movePhase.cancel();
    }

    super.end();
  }
}