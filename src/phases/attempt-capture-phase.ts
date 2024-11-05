import { BattlerIndex } from "#app/battle";
import BattleScene from "#app/battle-scene";
import { PLAYER_PARTY_MAX_SIZE } from "#app/constants";
import { SubstituteTag } from "#app/data/battler-tags";
import { doPokeballBounceAnim, getPokeballAtlasKey, getPokeballCatchMultiplier, getPokeballTintColor, getCriticalCaptureChance } from "#app/data/pokeball";
import { getStatusEffectCatchRateMultiplier } from "#app/data/status-effect";
import { addPokeballCaptureStars, addPokeballOpenParticles } from "#app/field/anims";
import { EnemyPokemon } from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import { PokemonHeldItemModifier } from "#app/modifier/modifier";
import { PokemonPhase } from "#app/phases/pokemon-phase";
import { VictoryPhase } from "#app/phases/victory-phase";
import { achvs } from "#app/system/achv";
import { PartyOption, PartyUiMode } from "#app/ui/party-ui-handler";
import { SummaryUiMode } from "#app/ui/summary-ui-handler";
import { Mode } from "#app/ui/ui";
import { PokeballType } from "#enums/pokeball";
import { StatusEffect } from "#enums/status-effect";
import i18next from "i18next";

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

    const substitute = pokemon.getTag(SubstituteTag);
    if (substitute) {
      substitute.sprite.setVisible(false);
    }

    this.scene.pokeballCounts[this.pokeballType]--;

    this.originalY = pokemon.y;

    const _3m = 3 * pokemon.getMaxHp();
    const _2h = 2 * pokemon.hp;
    const catchRate = pokemon.species.catchRate;
    const pokeballMultiplier = getPokeballCatchMultiplier(this.pokeballType);
    const statusMultiplier = pokemon.status ? getStatusEffectCatchRateMultiplier(pokemon.status.effect) : 1;
    const modifiedCatchRate = Math.round((((_3m - _2h) * catchRate * pokeballMultiplier) / _3m) * statusMultiplier);
    const shakeProbability = Math.round(65536 / Math.pow((255 / modifiedCatchRate), 0.1875)); // Formula taken from gen 6
    const criticalCaptureChance = getCriticalCaptureChance(this.scene, modifiedCatchRate);
    const isCritical = pokemon.randSeedInt(256) < criticalCaptureChance;
    const fpOffset = pokemon.getFieldPositionOffset();

    const pokeballAtlasKey = getPokeballAtlasKey(this.pokeballType);
    this.pokeball = this.scene.addFieldSprite(16, 80, "pb", pokeballAtlasKey);
    this.pokeball.setOrigin(0.5, 0.625);
    this.scene.field.add(this.pokeball);

    this.scene.playSound("se/pb_throw", isCritical ? { rate: 0.2 } : undefined); // Crit catch throws are higher pitched
    this.scene.time.delayedCall(300, () => {
      this.scene.field.moveBelow(this.pokeball as Phaser.GameObjects.GameObject, pokemon);
    });

    this.scene.tweens.add({
      // Throw animation
      targets: this.pokeball,
      x: { value: 236 + fpOffset[0], ease: "Linear" },
      y: { value: 16 + fpOffset[1], ease: "Cubic.easeOut" },
      duration: 500,
      onComplete: () => {
        // Ball opens
        this.pokeball.setTexture("pb", `${pokeballAtlasKey}_opening`);
        this.scene.time.delayedCall(17, () => this.pokeball.setTexture("pb", `${pokeballAtlasKey}_open`));
        this.scene.playSound("se/pb_rel");
        pokemon.tint(getPokeballTintColor(this.pokeballType));

        addPokeballOpenParticles(this.scene, this.pokeball.x, this.pokeball.y, this.pokeballType);

        this.scene.tweens.add({
          // Mon enters ball
          targets: pokemon,
          duration: 500,
          ease: "Sine.easeIn",
          scale: 0.25,
          y: 20,
          onComplete: () => {
            // Ball closes
            this.pokeball.setTexture("pb", `${pokeballAtlasKey}_opening`);
            pokemon.setVisible(false);
            this.scene.playSound("se/pb_catch");
            this.scene.time.delayedCall(17, () => this.pokeball.setTexture("pb", `${pokeballAtlasKey}`));

            const doShake = () => {
              // After the overall catch rate check, the game does 3 shake checks before confirming the catch.
              let shakeCount = 0;
              const pbX = this.pokeball.x;
              const shakeCounter = this.scene.tweens.addCounter({
                from: 0,
                to: 1,
                repeat: isCritical ? 2 : 4, // Critical captures only perform 1 shake check
                yoyo: true,
                ease: "Cubic.easeOut",
                duration: 250,
                repeatDelay: 500,
                onUpdate: t => {
                  if (shakeCount && shakeCount < (isCritical ? 2 : 4)) {
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
                  } else if (shakeCount++ < (isCritical ? 1 : 3)) {
                    // Shake check (skip check for critical or guaranteed captures, but still play the sound)
                    if (pokeballMultiplier === -1 || isCritical || modifiedCatchRate >= 255 || pokemon.randSeedInt(65536) < shakeProbability) {
                      this.scene.playSound("se/pb_move");
                    } else {
                      shakeCounter.stop();
                      this.failCatch(shakeCount);
                    }
                  } else if (isCritical && pokemon.randSeedInt(65536) >= shakeProbability) {
                    // Above, perform the one shake check for critical captures after the ball shakes once
                    shakeCounter.stop();
                    this.failCatch(shakeCount);
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

            // Ball bounces (handled in pokemon.ts)
            this.scene.time.delayedCall(250, () => doPokeballBounceAnim(this.scene, this.pokeball, 16, 72, 350, doShake, isCritical));
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

    const substitute = pokemon.getTag(SubstituteTag);
    if (substitute) {
      substitute.sprite.setVisible(true);
    }

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
      const addToParty = (slotIndex?: number) => {
        const newPokemon = pokemon.addToParty(this.pokeballType, slotIndex);
        const modifiers = this.scene.findModifiers(m => m instanceof PokemonHeldItemModifier, false);
        if (this.scene.getPlayerParty().filter(p => p.isShiny()).length === PLAYER_PARTY_MAX_SIZE) {
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
      Promise.all([ pokemon.hideInfo(), this.scene.gameData.setPokemonCaught(pokemon) ]).then(() => {
        if (this.scene.getPlayerParty().length === PLAYER_PARTY_MAX_SIZE) {
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
                      addToParty(slotIndex);
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
