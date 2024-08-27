import BattleScene from "#app/battle-scene.js";
import { BattlerIndex } from "#app/battle.js";
import { getPokeballCatchMultiplier, getPokeballAtlasKey, getPokeballTintColor, doPokeballBounceAnim } from "#app/data/pokeball.js";
import { getStatusEffectCatchRateMultiplier } from "#app/data/status-effect.js";
import { PokeballType } from "#app/enums/pokeball.js";
import { StatusEffect } from "#app/enums/status-effect.js";
import { addPokeballOpenParticles, addPokeballCaptureStars } from "#app/field/anims.js";
import { EnemyPokemon } from "#app/field/pokemon.js";
import { getPokemonNameWithAffix } from "#app/messages.js";
import { PokemonHeldItemModifier } from "#app/modifier/modifier.js";
import { achvs } from "#app/system/achv.js";
import { PartyUiMode, PartyOption } from "#app/ui/party-ui-handler.js";
import { SummaryUiMode } from "#app/ui/summary-ui-handler.js";
import { Mode } from "#app/ui/ui.js";
import i18next from "i18next";
import { PokemonPhase } from "./pokemon-phase";
import { VictoryPhase } from "./victory-phase";

export class AttemptCapturePhase extends PokemonPhase {
  private pokeballType: PokeballType;
  private pokeball: Phaser.GameObjects.Sprite;
  private originalY: number;

  constructor(scene: BattleScene, targetIndex: integer, pokeballType: PokeballType) {
    super(scene, BattlerIndex.ENEMY + targetIndex);

    this.pokeballType = pokeballType;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon() as EnemyPokemon;

    if (!pokemon?.hp) {
      return this.end();
    }

    this.scene.pokeballCounts[this.pokeballType]--;

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
    this.pokeball = this.scene.addFieldSprite(16, 80, "pb", pokeballAtlasKey);
    this.pokeball.setOrigin(0.5, 0.625);
    this.scene.field.add(this.pokeball);

    this.scene.playSound("se/pb_throw");
    this.scene.time.delayedCall(300, () => {
      this.scene.field.moveBelow(this.pokeball as Phaser.GameObjects.GameObject, pokemon);
    });

    this.scene.tweens.add({
      targets: this.pokeball,
      x: { value: 236 + fpOffset[0], ease: "Linear" },
      y: { value: 16 + fpOffset[1], ease: "Cubic.easeOut" },
      duration: 500,
      onComplete: () => {
        this.pokeball.setTexture("pb", `${pokeballAtlasKey}_opening`);
        this.scene.time.delayedCall(17, () => this.pokeball.setTexture("pb", `${pokeballAtlasKey}_open`));
        this.scene.playSound("se/pb_rel");
        pokemon.tint(getPokeballTintColor(this.pokeballType));

        addPokeballOpenParticles(this.scene, this.pokeball.x, this.pokeball.y, this.pokeballType);

        this.scene.tweens.add({
          targets: pokemon,
          duration: 500,
          ease: "Sine.easeIn",
          scale: 0.25,
          y: 20,
          onComplete: () => {
            this.pokeball.setTexture("pb", `${pokeballAtlasKey}_opening`);
            pokemon.setVisible(false);
            this.scene.playSound("se/pb_catch");
            this.scene.time.delayedCall(17, () => this.pokeball.setTexture("pb", `${pokeballAtlasKey}`));

            const doShake = () => {
              let shakeCount = 0;
              const pbX = this.pokeball.x;
              const shakeCounter = this.scene.tweens.addCounter({
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
                      this.scene.playSound("se/pb_move");
                    } else {
                      shakeCounter.stop();
                      this.failCatch(shakeCount);
                    }
                  } else {
                    this.scene.playSound("se/pb_lock");
                    addPokeballCaptureStars(this.scene, this.pokeball);

                    const pbTint = this.scene.add.sprite(this.pokeball.x, this.pokeball.y, "pb", "pb");
                    pbTint.setOrigin(this.pokeball.originX, this.pokeball.originY);
                    pbTint.setTintFill(0);
                    pbTint.setAlpha(0);
                    this.scene.field.add(pbTint);
                    this.scene.tweens.add({
                      targets: pbTint,
                      alpha: 0.375,
                      duration: 200,
                      easing: "Sine.easeOut",
                      onComplete: () => {
                        this.scene.tweens.add({
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

            this.scene.time.delayedCall(250, () => doPokeballBounceAnim(this.scene, this.pokeball, 16, 72, 350, doShake));
          }
        });
      }
    });
  }

  failCatch(shakeCount: integer) {
    const pokemon = this.getPokemon();

    this.scene.playSound("se/pb_rel");
    pokemon.setY(this.originalY);
    if (pokemon.status?.effect !== StatusEffect.SLEEP) {
      pokemon.cry(pokemon.getHpRatio() > 0.25 ? undefined : { rate: 0.85 });
    }
    pokemon.tint(getPokeballTintColor(this.pokeballType));
    pokemon.setVisible(true);
    pokemon.untint(250, "Sine.easeOut");

    const pokeballAtlasKey = getPokeballAtlasKey(this.pokeballType);
    this.pokeball.setTexture("pb", `${pokeballAtlasKey}_opening`);
    this.scene.time.delayedCall(17, () => this.pokeball.setTexture("pb", `${pokeballAtlasKey}_open`));

    this.scene.tweens.add({
      targets: pokemon,
      duration: 250,
      ease: "Sine.easeOut",
      scale: 1
    });

    this.scene.currentBattle.lastUsedPokeball = this.pokeballType;
    this.removePb();
    this.end();
  }

  catch() {
    const pokemon = this.getPokemon() as EnemyPokemon;

    const speciesForm = !pokemon.fusionSpecies ? pokemon.getSpeciesForm() : pokemon.getFusionSpeciesForm();

    if (speciesForm.abilityHidden && (pokemon.fusionSpecies ? pokemon.fusionAbilityIndex : pokemon.abilityIndex) === speciesForm.getAbilityCount() - 1) {
      this.scene.validateAchv(achvs.HIDDEN_ABILITY);
    }

    if (pokemon.species.subLegendary) {
      this.scene.validateAchv(achvs.CATCH_SUB_LEGENDARY);
    }

    if (pokemon.species.legendary) {
      this.scene.validateAchv(achvs.CATCH_LEGENDARY);
    }

    if (pokemon.species.mythical) {
      this.scene.validateAchv(achvs.CATCH_MYTHICAL);
    }

    this.scene.pokemonInfoContainer.show(pokemon, true);

    this.scene.gameData.updateSpeciesDexIvs(pokemon.species.getRootSpeciesId(true), pokemon.ivs);

    this.scene.ui.showText(i18next.t("battle:pokemonCaught", { pokemonName: getPokemonNameWithAffix(pokemon) }), null, () => {
      const end = () => {
        this.scene.unshiftPhase(new VictoryPhase(this.scene, this.battlerIndex));
        this.scene.pokemonInfoContainer.hide();
        this.removePb();
        this.end();
      };
      const removePokemon = () => {
        this.scene.addFaintedEnemyScore(pokemon);
        this.scene.getPlayerField().filter(p => p.isActive(true)).forEach(playerPokemon => playerPokemon.removeTagsBySourceId(pokemon.id));
        pokemon.hp = 0;
        pokemon.trySetStatus(StatusEffect.FAINT);
        this.scene.clearEnemyHeldItemModifiers();
        this.scene.field.remove(pokemon, true);
      };
      const addToParty = () => {
        const newPokemon = pokemon.addToParty(this.pokeballType);
        const modifiers = this.scene.findModifiers(m => m instanceof PokemonHeldItemModifier, false);
        if (this.scene.getParty().filter(p => p.isShiny()).length === 6) {
          this.scene.validateAchv(achvs.SHINY_PARTY);
        }
        Promise.all(modifiers.map(m => this.scene.addModifier(m, true))).then(() => {
          this.scene.updateModifiers(true);
          removePokemon();
          if (newPokemon) {
            newPokemon.loadAssets().then(end);
          } else {
            end();
          }
        });
      };
      Promise.all([pokemon.hideInfo(), this.scene.gameData.setPokemonCaught(pokemon)]).then(() => {
        if (this.scene.getParty().length === 6) {
          const promptRelease = () => {
            this.scene.ui.showText(i18next.t("battle:partyFull", { pokemonName: pokemon.getNameToRender() }), null, () => {
              this.scene.pokemonInfoContainer.makeRoomForConfirmUi(1, true);
              this.scene.ui.setMode(Mode.CONFIRM, () => {
                const newPokemon = this.scene.addPlayerPokemon(pokemon.species, pokemon.level, pokemon.abilityIndex, pokemon.formIndex, pokemon.gender, pokemon.shiny, pokemon.variant, pokemon.ivs, pokemon.nature, pokemon);
                this.scene.ui.setMode(Mode.SUMMARY, newPokemon, 0, SummaryUiMode.DEFAULT, () => {
                  this.scene.ui.setMode(Mode.MESSAGE).then(() => {
                    promptRelease();
                  });
                }, false);
              }, () => {
                this.scene.ui.setMode(Mode.PARTY, PartyUiMode.RELEASE, this.fieldIndex, (slotIndex: integer, _option: PartyOption) => {
                  this.scene.ui.setMode(Mode.MESSAGE).then(() => {
                    if (slotIndex < 6) {
                      addToParty();
                    } else {
                      promptRelease();
                    }
                  });
                });
              }, () => {
                this.scene.ui.setMode(Mode.MESSAGE).then(() => {
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
    this.scene.tweens.add({
      targets: this.pokeball,
      duration: 250,
      delay: 250,
      ease: "Sine.easeIn",
      alpha: 0,
      onComplete: () => this.pokeball.destroy()
    });
  }
}
