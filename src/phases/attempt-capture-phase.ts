import { BattlerIndex } from "#app/battle";
import { getPokeballCatchMultiplier, getPokeballAtlasKey, getPokeballTintColor, doPokeballBounceAnim } from "#app/data/pokeball";
import { getStatusEffectCatchRateMultiplier } from "#app/data/status-effect";
import { PokeballType } from "#app/enums/pokeball";
import { StatusEffect } from "#app/enums/status-effect";
import { addPokeballOpenParticles, addPokeballCaptureStars } from "#app/field/anims";
import { EnemyPokemon } from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import { PokemonHeldItemModifier } from "#app/modifier/modifier";
import { achvs } from "#app/system/achv";
import { PartyUiMode, PartyOption } from "#app/ui/party-ui-handler";
import { SummaryUiMode } from "#app/ui/summary-ui-handler";
import { Mode } from "#app/ui/ui";
import i18next from "i18next";
import { PokemonPhase } from "./pokemon-phase";
import { VictoryPhase } from "./victory-phase";
import { SubstituteTag } from "#app/data/battler-tags";
import { globalScene } from "#app/battle-scene";

export class AttemptCapturePhase extends PokemonPhase {
  private pokeballType: PokeballType;
  private pokeball: Phaser.GameObjects.Sprite;
  private originalY: number;

  constructor(targetIndex: integer, pokeballType: PokeballType) {
    super(BattlerIndex.ENEMY + targetIndex);

    this.pokeballType = pokeballType;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon() as EnemyPokemon;

    if (!pokemon?.hp) {
      return this.end();
    }

    const substitute = pokemon.getTag(SubstituteTag);
    if (substitute) {
      substitute.sprite.setVisible(false);
    }

    globalScene.pokeballCounts[this.pokeballType]--;

    this.originalY = pokemon.y;

    const _3m = 3 * pokemon.getMaxHp();
    const _2h = 2 * pokemon.hp;
    const catchRate = pokemon.species.catchRate;
    const pokeballMultiplier = getPokeballCatchMultiplier(this.pokeballType);
    const statusMultiplier = pokemon.status ? getStatusEffectCatchRateMultiplier(pokemon.status.effect) : 1;
    const x = Math.round((((_3m - _2h) * catchRate * pokeballMultiplier) / _3m) * statusMultiplier);
    const y = Math.round(65536 / Math.sqrt(Math.sqrt(255 / x)));
    const fpOffset = pokemon.getFieldPositionOffset();

    const pokeballAtlasKey = getPokeballAtlasKey(this.pokeballType);
    this.pokeball = globalScene.addFieldSprite(16, 80, "pb", pokeballAtlasKey);
    this.pokeball.setOrigin(0.5, 0.625);
    globalScene.field.add(this.pokeball);

    globalScene.playSound("se/pb_throw");
    globalScene.time.delayedCall(300, () => {
      globalScene.field.moveBelow(this.pokeball as Phaser.GameObjects.GameObject, pokemon);
    });

    globalScene.tweens.add({
      targets: this.pokeball,
      x: { value: 236 + fpOffset[0], ease: "Linear" },
      y: { value: 16 + fpOffset[1], ease: "Cubic.easeOut" },
      duration: 500,
      onComplete: () => {
        this.pokeball.setTexture("pb", `${pokeballAtlasKey}_opening`);
        globalScene.time.delayedCall(17, () => this.pokeball.setTexture("pb", `${pokeballAtlasKey}_open`));
        globalScene.playSound("se/pb_rel");
        pokemon.tint(getPokeballTintColor(this.pokeballType));

        addPokeballOpenParticles(this.pokeball.x, this.pokeball.y, this.pokeballType);

        globalScene.tweens.add({
          targets: pokemon,
          duration: 500,
          ease: "Sine.easeIn",
          scale: 0.25,
          y: 20,
          onComplete: () => {
            this.pokeball.setTexture("pb", `${pokeballAtlasKey}_opening`);
            pokemon.setVisible(false);
            globalScene.playSound("se/pb_catch");
            globalScene.time.delayedCall(17, () => this.pokeball.setTexture("pb", `${pokeballAtlasKey}`));

            const doShake = () => {
              let shakeCount = 0;
              const pbX = this.pokeball.x;
              const shakeCounter = globalScene.tweens.addCounter({
                from: 0,
                to: 1,
                repeat: 4,
                yoyo: true,
                ease: "Cubic.easeOut",
                duration: 250,
                repeatDelay: 500,
                onUpdate: t => {
                  if (shakeCount && shakeCount < 4) {
                    const value = t.getValue();
                    const directionMultiplier = shakeCount % 2 === 1 ? 1 : -1;
                    this.pokeball.setX(pbX + value * 4 * directionMultiplier);
                    this.pokeball.setAngle(value * 27.5 * directionMultiplier);
                  }
                },
                onRepeat: () => {
                  if (!pokemon.species.isObtainable()) {
                    shakeCounter.stop();
                    this.failCatch(shakeCount);
                  } else if (shakeCount++ < 3) {
                    if (pokeballMultiplier === -1 || pokemon.randSeedInt(65536) < y) {
                      globalScene.playSound("se/pb_move");
                    } else {
                      shakeCounter.stop();
                      this.failCatch(shakeCount);
                    }
                  } else {
                    globalScene.playSound("se/pb_lock");
                    addPokeballCaptureStars(this.pokeball);

                    const pbTint = globalScene.add.sprite(this.pokeball.x, this.pokeball.y, "pb", "pb");
                    pbTint.setOrigin(this.pokeball.originX, this.pokeball.originY);
                    pbTint.setTintFill(0);
                    pbTint.setAlpha(0);
                    globalScene.field.add(pbTint);
                    globalScene.tweens.add({
                      targets: pbTint,
                      alpha: 0.375,
                      duration: 200,
                      easing: "Sine.easeOut",
                      onComplete: () => {
                        globalScene.tweens.add({
                          targets: pbTint,
                          alpha: 0,
                          duration: 200,
                          easing: "Sine.easeIn",
                          onComplete: () => pbTint.destroy()
                        });
                      }
                    });
                  }
                },
                onComplete: () => {
                  this.catch();
                }
              });
            };

            globalScene.time.delayedCall(250, () => doPokeballBounceAnim(this.pokeball, 16, 72, 350, doShake));
          }
        });
      }
    });
  }

  failCatch(shakeCount: integer) {
    const pokemon = this.getPokemon();

    globalScene.playSound("se/pb_rel");
    pokemon.setY(this.originalY);
    if (pokemon.status?.effect !== StatusEffect.SLEEP) {
      pokemon.cry(pokemon.getHpRatio() > 0.25 ? undefined : { rate: 0.85 });
    }
    pokemon.tint(getPokeballTintColor(this.pokeballType));
    pokemon.setVisible(true);
    pokemon.untint(250, "Sine.easeOut");

    const substitute = pokemon.getTag(SubstituteTag);
    if (substitute) {
      substitute.sprite.setVisible(true);
    }

    const pokeballAtlasKey = getPokeballAtlasKey(this.pokeballType);
    this.pokeball.setTexture("pb", `${pokeballAtlasKey}_opening`);
    globalScene.time.delayedCall(17, () => this.pokeball.setTexture("pb", `${pokeballAtlasKey}_open`));

    globalScene.tweens.add({
      targets: pokemon,
      duration: 250,
      ease: "Sine.easeOut",
      scale: 1
    });

    globalScene.currentBattle.lastUsedPokeball = this.pokeballType;
    this.removePb();
    this.end();
  }

  catch() {
    const pokemon = this.getPokemon() as EnemyPokemon;

    const speciesForm = !pokemon.fusionSpecies ? pokemon.getSpeciesForm() : pokemon.getFusionSpeciesForm();

    if (speciesForm.abilityHidden && (pokemon.fusionSpecies ? pokemon.fusionAbilityIndex : pokemon.abilityIndex) === speciesForm.getAbilityCount() - 1) {
      globalScene.validateAchv(achvs.HIDDEN_ABILITY);
    }

    if (pokemon.species.subLegendary) {
      globalScene.validateAchv(achvs.CATCH_SUB_LEGENDARY);
    }

    if (pokemon.species.legendary) {
      globalScene.validateAchv(achvs.CATCH_LEGENDARY);
    }

    if (pokemon.species.mythical) {
      globalScene.validateAchv(achvs.CATCH_MYTHICAL);
    }

    globalScene.pokemonInfoContainer.show(pokemon, true);

    globalScene.gameData.updateSpeciesDexIvs(pokemon.species.getRootSpeciesId(true), pokemon.ivs);

    globalScene.ui.showText(i18next.t("battle:pokemonCaught", { pokemonName: getPokemonNameWithAffix(pokemon) }), null, () => {
      const end = () => {
        globalScene.unshiftPhase(new VictoryPhase(this.battlerIndex));
        globalScene.pokemonInfoContainer.hide();
        this.removePb();
        this.end();
      };
      const removePokemon = () => {
        globalScene.addFaintedEnemyScore(pokemon);
        globalScene.getPlayerField().filter(p => p.isActive(true)).forEach(playerPokemon => playerPokemon.removeTagsBySourceId(pokemon.id));
        pokemon.hp = 0;
        pokemon.trySetStatus(StatusEffect.FAINT);
        globalScene.clearEnemyHeldItemModifiers();
        globalScene.field.remove(pokemon, true);
      };
      const addToParty = (slotIndex?: number) => {
        const newPokemon = pokemon.addToParty(this.pokeballType, slotIndex);
        const modifiers = globalScene.findModifiers(m => m instanceof PokemonHeldItemModifier, false);
        if (globalScene.getParty().filter(p => p.isShiny()).length === 6) {
          globalScene.validateAchv(achvs.SHINY_PARTY);
        }
        Promise.all(modifiers.map(m => globalScene.addModifier(m, true))).then(() => {
          globalScene.updateModifiers(true);
          removePokemon();
          if (newPokemon) {
            newPokemon.loadAssets().then(end);
          } else {
            end();
          }
        });
      };
      Promise.all([ pokemon.hideInfo(), globalScene.gameData.setPokemonCaught(pokemon) ]).then(() => {
        if (globalScene.getParty().length === 6) {
          const promptRelease = () => {
            globalScene.ui.showText(i18next.t("battle:partyFull", { pokemonName: pokemon.getNameToRender() }), null, () => {
              globalScene.pokemonInfoContainer.makeRoomForConfirmUi(1, true);
              globalScene.ui.setMode(Mode.CONFIRM, () => {
                const newPokemon = globalScene.addPlayerPokemon(pokemon.species, pokemon.level, pokemon.abilityIndex, pokemon.formIndex, pokemon.gender, pokemon.shiny, pokemon.variant, pokemon.ivs, pokemon.nature, pokemon);
                globalScene.ui.setMode(Mode.SUMMARY, newPokemon, 0, SummaryUiMode.DEFAULT, () => {
                  globalScene.ui.setMode(Mode.MESSAGE).then(() => {
                    promptRelease();
                  });
                }, false);
              }, () => {
                globalScene.ui.setMode(Mode.PARTY, PartyUiMode.RELEASE, this.fieldIndex, (slotIndex: integer, _option: PartyOption) => {
                  globalScene.ui.setMode(Mode.MESSAGE).then(() => {
                    if (slotIndex < 6) {
                      addToParty(slotIndex);
                    } else {
                      promptRelease();
                    }
                  });
                });
              }, () => {
                globalScene.ui.setMode(Mode.MESSAGE).then(() => {
                  removePokemon();
                  end();
                });
              }, "fullParty");
            });
          };
          promptRelease();
        } else {
          addToParty();
        }
      });
    }, 0, true);
  }

  removePb() {
    globalScene.tweens.add({
      targets: this.pokeball,
      duration: 250,
      delay: 250,
      ease: "Sine.easeIn",
      alpha: 0,
      onComplete: () => this.pokeball.destroy()
    });
  }
}
