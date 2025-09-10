import { PLAYER_PARTY_MAX_SIZE } from "#app/constants";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { SubstituteTag } from "#data/battler-tags";
import { Gender } from "#data/gender";
import {
  doPokeballBounceAnim,
  getCriticalCaptureChance,
  getPokeballAtlasKey,
  getPokeballCatchMultiplier,
  getPokeballTintColor,
} from "#data/pokeball";
import { getStatusEffectCatchRateMultiplier } from "#data/status-effect";
import { BattlerIndex } from "#enums/battler-index";
import { ChallengeType } from "#enums/challenge-type";
import type { PokeballType } from "#enums/pokeball";
import { StatusEffect } from "#enums/status-effect";
import { UiMode } from "#enums/ui-mode";
import { addPokeballCaptureStars, addPokeballOpenParticles } from "#field/anims";
import type { EnemyPokemon } from "#field/pokemon";
import { PokemonHeldItemModifier } from "#modifiers/modifier";
import { PokemonPhase } from "#phases/pokemon-phase";
import { achvs } from "#system/achv";
import type { PartyOption } from "#ui/handlers/party-ui-handler";
import { PartyUiMode } from "#ui/handlers/party-ui-handler";
import { SummaryUiMode } from "#ui/handlers/summary-ui-handler";
import { applyChallenges } from "#utils/challenge-utils";
import { BooleanHolder } from "#utils/common";
import i18next from "i18next";

// TODO: Refactor and split up to allow for overriding capture chance
export class AttemptCapturePhase extends PokemonPhase {
  public readonly phaseName = "AttemptCapturePhase";
  private pokeballType: PokeballType;
  private pokeball: Phaser.GameObjects.Sprite;
  private originalY: number;

  constructor(targetIndex: number, pokeballType: PokeballType) {
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
    const modifiedCatchRate = Math.round((((_3m - _2h) * catchRate * pokeballMultiplier) / _3m) * statusMultiplier);
    const shakeProbability = Math.round(65536 / Math.pow(255 / modifiedCatchRate, 0.1875)); // Formula taken from gen 6
    const criticalCaptureChance = getCriticalCaptureChance(modifiedCatchRate);
    const isCritical = pokemon.randBattleSeedInt(256) < criticalCaptureChance;
    const fpOffset = pokemon.getFieldPositionOffset();

    const pokeballAtlasKey = getPokeballAtlasKey(this.pokeballType);
    this.pokeball = globalScene.addFieldSprite(16, 80, "pb", pokeballAtlasKey);
    this.pokeball.setOrigin(0.5, 0.625);
    globalScene.field.add(this.pokeball);

    globalScene.playSound(isCritical ? "se/crit_throw" : "se/pb_throw");
    globalScene.time.delayedCall(300, () => {
      globalScene.field.moveBelow(this.pokeball as Phaser.GameObjects.GameObject, pokemon);
    });

    globalScene.tweens.add({
      // Throw animation
      targets: this.pokeball,
      x: { value: 236 + fpOffset[0], ease: "Linear" },
      y: { value: 16 + fpOffset[1], ease: "Cubic.easeOut" },
      duration: 500,
      onComplete: () => {
        // Ball opens
        this.pokeball.setTexture("pb", `${pokeballAtlasKey}_opening`);
        globalScene.time.delayedCall(17, () => this.pokeball.setTexture("pb", `${pokeballAtlasKey}_open`));
        globalScene.playSound("se/pb_rel");
        pokemon.tint(getPokeballTintColor(this.pokeballType));

        addPokeballOpenParticles(this.pokeball.x, this.pokeball.y, this.pokeballType);

        globalScene.tweens.add({
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
            globalScene.playSound("se/pb_catch");
            globalScene.time.delayedCall(17, () => this.pokeball.setTexture("pb", `${pokeballAtlasKey}`));

            const doShake = () => {
              // After the overall catch rate check, the game does 3 shake checks before confirming the catch.
              let shakeCount = 0;
              const pbX = this.pokeball.x;
              const shakeCounter = globalScene.tweens.addCounter({
                from: 0,
                to: 1,
                repeat: isCritical ? 2 : 4, // Critical captures only perform 1 shake check
                yoyo: true,
                ease: "Cubic.easeOut",
                duration: 250,
                repeatDelay: 500,
                onUpdate: t => {
                  if (shakeCount && shakeCount < (isCritical ? 2 : 4)) {
                    const value = t.getValue() ?? 0;
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
                    if (
                      pokeballMultiplier === -1
                      || isCritical
                      || modifiedCatchRate >= 255
                      || pokemon.randBattleSeedInt(65536) < shakeProbability
                    ) {
                      globalScene.playSound("se/pb_move");
                    } else {
                      shakeCounter.stop();
                      this.failCatch(shakeCount);
                    }
                  } else if (isCritical && pokemon.randBattleSeedInt(65536) >= shakeProbability) {
                    // Above, perform the one shake check for critical captures after the ball shakes once
                    shakeCounter.stop();
                    this.failCatch(shakeCount);
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
                          onComplete: () => pbTint.destroy(),
                        });
                      },
                    });
                  }
                },
                onComplete: () => {
                  this.catch();
                },
              });
            };

            // Ball bounces (handled in pokemon.ts)
            globalScene.time.delayedCall(250, () =>
              doPokeballBounceAnim(this.pokeball, 16, 72, 350, doShake, isCritical),
            );
          },
        });
      },
    });
  }

  failCatch(_shakeCount: number) {
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
      scale: 1,
    });

    globalScene.currentBattle.lastUsedPokeball = this.pokeballType;
    this.removePb();
    this.end();
  }

  catch() {
    const pokemon = this.getPokemon() as EnemyPokemon;

    const speciesForm = !pokemon.fusionSpecies ? pokemon.getSpeciesForm() : pokemon.getFusionSpeciesForm();

    if (
      speciesForm.abilityHidden
      && (pokemon.fusionSpecies ? pokemon.fusionAbilityIndex : pokemon.abilityIndex)
        === speciesForm.getAbilityCount() - 1
    ) {
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

    const addStatus = new BooleanHolder(true);
    applyChallenges(ChallengeType.POKEMON_ADD_TO_PARTY, pokemon, addStatus);

    globalScene.ui.showText(
      i18next.t(addStatus.value ? "battle:pokemonCaught" : "battle:pokemonCaughtButChallenge", {
        pokemonName: getPokemonNameWithAffix(pokemon),
      }),
      null,
      () => {
        const end = () => {
          globalScene.phaseManager.unshiftNew("VictoryPhase", this.battlerIndex);
          globalScene.pokemonInfoContainer.hide();
          this.removePb();
          this.end();
        };
        const removePokemon = () => {
          globalScene.addFaintedEnemyScore(pokemon);
          pokemon.hp = 0;
          pokemon.doSetStatus(StatusEffect.FAINT);
          globalScene.clearEnemyHeldItemModifiers();
          pokemon.leaveField(true, true, true);
        };
        const addToParty = (slotIndex?: number) => {
          const newPokemon = pokemon.addToParty(this.pokeballType, slotIndex);
          const modifiers = globalScene.findModifiers(m => m instanceof PokemonHeldItemModifier, false);
          if (globalScene.getPlayerParty().filter(p => p.isShiny()).length === PLAYER_PARTY_MAX_SIZE) {
            globalScene.validateAchv(achvs.SHINY_PARTY);
          }
          Promise.all(modifiers.map(m => globalScene.addModifier(m, true))).then(() => {
            globalScene.updateModifiers(true);
            removePokemon();
            if (newPokemon) {
              newPokemon.leaveField(true, true, false);
              newPokemon.loadAssets().then(end);
            } else {
              end();
            }
          });
        };
        Promise.all([pokemon.hideInfo(), globalScene.gameData.setPokemonCaught(pokemon)]).then(() => {
          if (!addStatus.value) {
            removePokemon();
            end();
            return;
          }
          if (globalScene.getPlayerParty().length === PLAYER_PARTY_MAX_SIZE) {
            const promptRelease = () => {
              globalScene.ui.showText(
                i18next.t("battle:partyFull", {
                  pokemonName: pokemon.getNameToRender(),
                }),
                null,
                () => {
                  globalScene.pokemonInfoContainer.makeRoomForConfirmUi(1, true);
                  globalScene.ui.setMode(
                    UiMode.CONFIRM,
                    () => {
                      const newPokemon = globalScene.addPlayerPokemon(
                        pokemon.species,
                        pokemon.level,
                        pokemon.abilityIndex,
                        pokemon.formIndex,
                        pokemon.gender,
                        pokemon.shiny,
                        pokemon.variant,
                        pokemon.ivs,
                        pokemon.nature,
                        pokemon,
                      );
                      globalScene.ui.setMode(
                        UiMode.SUMMARY,
                        newPokemon,
                        0,
                        SummaryUiMode.DEFAULT,
                        () => {
                          globalScene.ui.setMode(UiMode.MESSAGE).then(() => {
                            promptRelease();
                          });
                        },
                        false,
                      );
                    },
                    () => {
                      const attributes = {
                        shiny: pokemon.shiny,
                        variant: pokemon.variant,
                        form: pokemon.formIndex,
                        female: pokemon.gender === Gender.FEMALE,
                      };
                      globalScene.ui.setOverlayMode(
                        UiMode.POKEDEX_PAGE,
                        pokemon.species,
                        attributes,
                        null,
                        null,
                        () => {
                          globalScene.ui.setMode(UiMode.MESSAGE).then(() => {
                            promptRelease();
                          });
                        },
                      );
                    },
                    () => {
                      globalScene.ui.setMode(
                        UiMode.PARTY,
                        PartyUiMode.RELEASE,
                        this.fieldIndex,
                        (slotIndex: number, _option: PartyOption) => {
                          globalScene.ui.setMode(UiMode.MESSAGE).then(() => {
                            if (slotIndex < 6) {
                              addToParty(slotIndex);
                            } else {
                              promptRelease();
                            }
                          });
                        },
                      );
                    },
                    () => {
                      globalScene.ui.setMode(UiMode.MESSAGE).then(() => {
                        removePokemon();
                        end();
                      });
                    },
                    "fullParty",
                  );
                },
              );
            };
            promptRelease();
          } else {
            addToParty();
          }
        });
      },
      0,
      true,
    );
  }

  removePb() {
    globalScene.tweens.add({
      targets: this.pokeball,
      duration: 250,
      delay: 250,
      ease: "Sine.easeIn",
      alpha: 0,
      onComplete: () => this.pokeball.destroy(),
    });
  }
}
