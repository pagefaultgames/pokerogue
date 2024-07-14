import { getRandomSpeciesByStarterTier, initFollowupOptionSelect, leaveEncounterWithoutBattle, updatePlayerMoney, } from "#app/data/mystery-encounters/mystery-encounter-utils";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "../../../battle-scene";
import IMysteryEncounter, { MysteryEncounterBuilder, MysteryEncounterTier, MysteryEncounterVariant } from "../mystery-encounter";
import MysteryEncounterOption, { EncounterOptionMode, MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import { TrainerSlot } from "#app/data/trainer-config";
import { ScanIvsPhase, SummonPhase, VictoryPhase } from "#app/phases";
import i18next from "i18next";
import { HiddenAbilityRateBoosterModifier, IvScannerModifier, PokemonHeldItemModifier } from "#app/modifier/modifier";
import { EnemyPokemon } from "#app/field/pokemon";
import { doPokeballBounceAnim, getPokeballAtlasKey, getPokeballTintColor, PokeballType } from "#app/data/pokeball";
import { StatusEffect } from "#app/data/status-effect";
import { addPokeballCaptureStars, addPokeballOpenParticles } from "#app/field/anims";
import { achvs } from "#app/system/achv";
import { Mode } from "#app/ui/ui";
import { PartyOption, PartyUiMode } from "#app/ui/party-ui-handler";
import { BattlerIndex } from "#app/battle";
import { PlayerGender } from "#enums/player-gender";
import { IntegerHolder, randSeedInt } from "#app/utils";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import { MoneyRequirement } from "#app/data/mystery-encounters/mystery-encounter-requirements";

/** the i18n namespace for the encounter */
const namespace = "mysteryEncounter:safari_zone";

/**
 * SAFARI ZONE OPTIONS
 *
 * Catch and flee rate **multipliers** are calculated in the same way stat changes are (they range from -6/+6)
 * https://bulbapedia.bulbagarden.net/wiki/Catch_rate#Great_Marsh_and_Johto_Safari_Zone
 *
 * Catch Rate calculation:
 * catchRate = speciesCatchRate [1 to 255] * catchStageMultiplier [2/8 to 8/2] * ballCatchRate [1.5]
 *
 * Flee calculation:
 * The harder a species is to catch, the higher its flee rate is
 * (Caps at 50% base chance to flee for the hardest to catch Pokemon, before factoring in flee stage)
 * fleeRate = ((255^2 - speciesCatchRate^2) / 255 / 2) [0 to 127.5] * fleeStageMultiplier [2/8 to 8/2]
 * Flee chance = fleeRate / 255
 */
const safariZoneOptions: MysteryEncounterOption[] = [
  new MysteryEncounterOptionBuilder()
    .withOptionMode(EncounterOptionMode.DEFAULT)
    .withDialogue({
      buttonLabel: `${namespace}_pokeball_option_label`,
      buttonTooltip: `${namespace}_pokeball_option_tooltip`,
      selected: [
        {
          text: `${namespace}_pokeball_option_selected`,
        },
      ],
    })
    .withOptionPhase(async (scene: BattleScene) => {
      // Throw a ball option
      const pokemon = scene.currentBattle.mysteryEncounter.misc.pokemon;
      const catchResult = await throwPokeball(scene, pokemon);

      if (catchResult) {
        // You caught pokemon
        scene.unshiftPhase(new VictoryPhase(scene, 0));
        // Check how many safari pokemon left
        if (scene.currentBattle.mysteryEncounter.misc.safariPokemonRemaining > 0) {
          await summonSafariPokemon(scene);
          initFollowupOptionSelect(scene, { overrideOptions: safariZoneOptions, startingCursorIndex: 0, hideDescription: true });
        } else {
          // End safari mode
          leaveEncounterWithoutBattle(scene, true);
        }
      } else {
        // Pokemon failed to catch, end turn
        await doEndTurn(scene, 0);
      }
      return true;
    })
    .build(),
  new MysteryEncounterOptionBuilder()
    .withOptionMode(EncounterOptionMode.DEFAULT)
    .withDialogue({
      buttonLabel: `${namespace}_bait_option_label`,
      buttonTooltip: `${namespace}_bait_option_tooltip`,
      selected: [
        {
          text: `${namespace}_bait_option_selected`,
        },
      ],
    })
    .withOptionPhase(async (scene: BattleScene) => {
      // Throw bait option
      const pokemon = scene.currentBattle.mysteryEncounter.misc.pokemon;
      await throwBait(scene, pokemon);

      // 100% chance to increase catch stage +2
      tryChangeCatchStage(scene, 2);
      // 80% chance to increase flee stage +1
      const fleeChangeResult = tryChangeFleeStage(scene, 1, 8);
      if (!fleeChangeResult) {
        scene.queueMessage(i18next.t(`${namespace}_pokemon_busy_eating`, { pokemonName: pokemon.name }), 0, null, 500);
      } else {
        scene.queueMessage(i18next.t(`${namespace}_pokemon_eating`, { pokemonName: pokemon.name }), 0, null, 500);
      }
      // TODO: throw bait with eat animation
      // TODO: play bug bite sfx, maybe spike cannon?

      await doEndTurn(scene, 1);
      return true;
    })
    .build(),
  new MysteryEncounterOptionBuilder()
    .withOptionMode(EncounterOptionMode.DEFAULT)
    .withDialogue({
      buttonLabel: `${namespace}_mud_option_label`,
      buttonTooltip: `${namespace}_mud_option_tooltip`,
      selected: [
        {
          text: `${namespace}_mud_option_selected`,
        },
      ],
    })
    .withOptionPhase(async (scene: BattleScene) => {
      // Throw mud option
      const pokemon = scene.currentBattle.mysteryEncounter.misc.pokemon;
      await throwMud(scene, pokemon);
      // 100% chance to decrease flee stage -2
      tryChangeFleeStage(scene, -2);
      // 80% chance to decrease catch stage -1
      const catchChangeResult = tryChangeCatchStage(scene, -1, 8);
      if (!catchChangeResult) {
        scene.queueMessage(i18next.t(`${namespace}_pokemon_beside_itself_angry`, { pokemonName: pokemon.name }), 0, null, 500);
      } else {
        scene.queueMessage(i18next.t(`${namespace}_pokemon_angry`, { pokemonName: pokemon.name }), 0, null, 500);
      }

      await doEndTurn(scene, 2);
      return true;
    })
    .build(),
  new MysteryEncounterOptionBuilder()
    .withOptionMode(EncounterOptionMode.DEFAULT)
    .withDialogue({
      buttonLabel: `${namespace}_flee_option_label`,
      buttonTooltip: `${namespace}_flee_option_tooltip`,
    })
    .withOptionPhase(async (scene: BattleScene) => {
      // Flee option
      const pokemon = scene.currentBattle.mysteryEncounter.misc.pokemon;
      await doPlayerFlee(scene, pokemon);
      // Check how many safari pokemon left
      if (scene.currentBattle.mysteryEncounter.misc.safariPokemonRemaining > 0) {
        await summonSafariPokemon(scene);
        initFollowupOptionSelect(scene, { overrideOptions: safariZoneOptions, startingCursorIndex: 3, hideDescription: true });
      } else {
        // End safari mode
        leaveEncounterWithoutBattle(scene, true);
      }
      return true;
    })
    .build()
];

export const SafariZoneEncounter: IMysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.SAFARI_ZONE)
    .withEncounterTier(MysteryEncounterTier.GREAT)
    .withSceneWaveRangeRequirement(10, 180) // waves 2 to 180
    .withSceneRequirement(new MoneyRequirement(0, 2.75)) // Cost equal to 1 Max Revive
    .withHideIntroVisuals(false)
    .withIntroSpriteConfigs([
      {
        spriteKey: "chest_blue",
        fileRoot: "mystery-encounters",
        hasShadow: true,
        x: 4,
        y: 10,
        yShadowOffset: 3,
        disableAnimation: true, // Re-enabled after option select
      },
    ])
    .withIntroDialogue([
      {
        text: `${namespace}_intro_message`,
      },
    ])
    .withTitle(`${namespace}_title`)
    .withDescription(`${namespace}_description`)
    .withQuery(`${namespace}_query`)
    .withOption(new MysteryEncounterOptionBuilder()
      .withOptionMode(EncounterOptionMode.DISABLED_OR_DEFAULT)
      // TODO: update
      .withSceneRequirement(new MoneyRequirement(0, 2.75)) // Cost equal to 1 Max Revive
      .withDialogue({
        buttonLabel: `${namespace}_option_1_label`,
        buttonTooltip: `${namespace}_option_1_tooltip`,
        selected: [
          {
            text: `${namespace}_option_1_selected_message`,
          },
        ],
      })
      .withOptionPhase(async (scene: BattleScene) => {
        // Start safari encounter
        const encounter = scene.currentBattle.mysteryEncounter;
        encounter.encounterVariant = MysteryEncounterVariant.SAFARI_BATTLE;
        encounter.misc = {
          safariPokemonRemaining: 3
        };
        updatePlayerMoney(scene, -(encounter.options[0].requirements[0] as MoneyRequirement).requiredMoney);
        scene.loadSe("PRSFX- Bug Bite", "battle_anims");
        scene.loadSe("PRSFX- Sludge Bomb2", "battle_anims");
        scene.loadSe("PRSFX- Taunt2", "battle_anims");
        await hideMysteryEncounterIntroVisuals(scene);
        await summonSafariPokemon(scene);
        initFollowupOptionSelect(scene, { overrideOptions: safariZoneOptions, hideDescription: true });
        return true;
      })
      .build()
    )
    .withSimpleOption(
      {
        buttonLabel: `${namespace}_option_2_label`,
        buttonTooltip: `${namespace}_option_2_tooltip`,
        selected: [
          {
            text: `${namespace}_option_2_selected_message`,
          },
        ],
      },
      async (scene: BattleScene) => {
        // Leave encounter with no rewards or exp
        leaveEncounterWithoutBattle(scene, true);
        return true;
      }
    )
    .build();

function hideMysteryEncounterIntroVisuals(scene: BattleScene): Promise<boolean> {
  return new Promise(resolve => {
    const introVisuals = scene.currentBattle.mysteryEncounter.introVisuals;
    if (introVisuals) {
      // Hide
      scene.tweens.add({
        targets: introVisuals,
        x: "+=16",
        y: "-=16",
        alpha: 0,
        ease: "Sine.easeInOut",
        duration: 750,
        onComplete: () => {
          scene.field.remove(introVisuals);
          introVisuals.setVisible(false);
          introVisuals.destroy();
          scene.currentBattle.mysteryEncounter.introVisuals = null;
          resolve(true);
        }
      });
    } else {
      resolve(true);
    }
  });
}

async function summonSafariPokemon(scene: BattleScene) {
  const encounter = scene.currentBattle.mysteryEncounter;
  // Message pokemon remaining
  scene.queueMessage(i18next.t(`${namespace}_remaining_count`, { remainingCount: encounter.misc.safariPokemonRemaining}), null, true);

  // Generate pokemon using safariPokemonRemaining so they are always the same pokemon no matter how many turns are taken
  // Safari pokemon roll twice on shiny and HA chances, but are otherwise normal
  let enemySpecies;
  let pokemon;
  scene.executeWithSeedOffset(() => {
    enemySpecies = getPokemonSpecies(getRandomSpeciesByStarterTier([0, 5]));
    enemySpecies = getPokemonSpecies(enemySpecies.getWildSpeciesForLevel(scene.currentBattle.waveIndex, true, false, scene.gameMode));
    scene.currentBattle.enemyParty = [];
    pokemon = scene.addEnemyPokemon(enemySpecies, scene.currentBattle.waveIndex, TrainerSlot.NONE, false);

    // Roll shiny twice
    if (!pokemon.shiny) {
      pokemon.trySetShiny();
    }

    // Roll HA twice
    if (pokemon.species.abilityHidden) {
      const hiddenIndex = pokemon.species.ability2 ? 2 : 1;
      if (pokemon.abilityIndex < hiddenIndex) {
        const hiddenAbilityChance = new IntegerHolder(256);
        scene.applyModifiers(HiddenAbilityRateBoosterModifier, true, hiddenAbilityChance);

        const hasHiddenAbility = !randSeedInt(hiddenAbilityChance.value);

        if (hasHiddenAbility) {
          pokemon.abilityIndex = hiddenIndex;
        }
      }
    }

    pokemon.calculateStats();

    scene.currentBattle.enemyParty[0] = pokemon;
  }, scene.currentBattle.waveIndex + encounter.misc.safariPokemonRemaining);

  scene.gameData.setPokemonSeen(pokemon, true);
  await pokemon.loadAssets();

  // Reset safari catch and flee rates
  encounter.misc.catchStage = 0;
  encounter.misc.fleeStage = 0;
  encounter.misc.pokemon = pokemon;
  encounter.misc.safariPokemonRemaining -= 1;

  scene.unshiftPhase(new SummonPhase(scene, 0, false));

  scene.ui.showText(i18next.t("battle:singleWildAppeared", { pokemonName: pokemon.name }), null, () => {
    const ivScannerModifier = scene.findModifier(m => m instanceof IvScannerModifier);
    if (ivScannerModifier) {
      scene.pushPhase(new ScanIvsPhase(scene, pokemon.getBattlerIndex(), Math.min(ivScannerModifier.getStackCount() * 2, 6)));
    }
  }, 1500);
}

async function throwPokeball(scene: BattleScene, pokemon: EnemyPokemon): Promise<boolean> {
  const pokeballType: PokeballType = PokeballType.POKEBALL;
  const originalY: number = pokemon.y;

  const baseCatchRate = pokemon.species.catchRate;
  // Catch stage ranges from -6 to +6 (like stat boost stages)
  const safariCatchStage = scene.currentBattle.mysteryEncounter.misc.catchStage;
  // Catch modifier ranges from 2/8 (-6 stage) to 8/2 (+6)
  const safariModifier = (2 + Math.min(Math.max(safariCatchStage, 0), 6)) / (2 - Math.max(Math.min(safariCatchStage, 0), -6));
  // Catch rate same as safari ball
  const pokeballMultiplier = 1.5;
  const catchRate = Math.round(baseCatchRate * pokeballMultiplier * safariModifier);
  const ballTwitchRate = Math.round(1048560 / Math.sqrt(Math.sqrt(16711680 / catchRate)));
  const fpOffset = pokemon.getFieldPositionOffset();
  const catchSuccess = (ballTwitchRate / 65536) * (ballTwitchRate / 65536) * (ballTwitchRate / 65536);
  console.log("Catch success rate: " + catchSuccess);

  const pokeballAtlasKey = getPokeballAtlasKey(pokeballType);
  const pokeball: Phaser.GameObjects.Sprite = scene.addFieldSprite(16 + 75, 80 + 25, "pb", pokeballAtlasKey);
  pokeball.setOrigin(0.5, 0.625);
  scene.field.add(pokeball);

  scene.playSound("pb_throw");
  scene.time.delayedCall(300, () => {
    scene.field.moveBelow(pokeball as Phaser.GameObjects.GameObject, pokemon);
  });

  return new Promise(resolve => {
    scene.trainer.setTexture(`trainer_${scene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back_pb`);
    scene.time.delayedCall(512, () => {
      // Trainer throw frames
      scene.trainer.setFrame("2");
      scene.time.delayedCall(256, () => {
        scene.trainer.setFrame("3");
        scene.time.delayedCall(768, () => {
          scene.trainer.setTexture(`trainer_${scene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back`);
        });
      });

      // Pokeball move and catch logic
      scene.tweens.add({
        targets: pokeball,
        x: { value: 236 + fpOffset[0], ease: "Linear" },
        y: { value: 16 + fpOffset[1], ease: "Cubic.easeOut" },
        duration: 500,
        onComplete: () => {
          pokeball.setTexture("pb", `${pokeballAtlasKey}_opening`);
          scene.time.delayedCall(17, () => pokeball.setTexture("pb", `${pokeballAtlasKey}_open`));
          scene.playSound("pb_rel");
          pokemon.tint(getPokeballTintColor(pokeballType));

          addPokeballOpenParticles(scene, pokeball.x, pokeball.y, pokeballType);

          scene.tweens.add({
            targets: pokemon,
            duration: 500,
            ease: "Sine.easeIn",
            scale: 0.25,
            y: 20,
            onComplete: () => {
              pokeball.setTexture("pb", `${pokeballAtlasKey}_opening`);
              pokemon.setVisible(false);
              scene.playSound("pb_catch");
              scene.time.delayedCall(17, () => pokeball.setTexture("pb", `${pokeballAtlasKey}`));

              const doShake = () => {
                let shakeCount = 0;
                const pbX = pokeball.x;
                const shakeCounter = scene.tweens.addCounter({
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
                      pokeball.setX(pbX + value * 4 * directionMultiplier);
                      pokeball.setAngle(value * 27.5 * directionMultiplier);
                    }
                  },
                  onRepeat: () => {
                    if (!pokemon.species.isObtainable()) {
                      shakeCounter.stop();
                      failCatch(scene, pokemon, originalY, pokeball, pokeballType).then(() => resolve(false));
                    } else if (shakeCount++ < 3) {
                      if (randSeedInt(65536) < ballTwitchRate) {
                        scene.playSound("pb_move");
                      } else {
                        shakeCounter.stop();
                        failCatch(scene, pokemon, originalY, pokeball, pokeballType).then(() => resolve(false));
                      }
                    } else {
                      scene.playSound("pb_lock");
                      addPokeballCaptureStars(scene, pokeball);

                      const pbTint = scene.add.sprite(pokeball.x, pokeball.y, "pb", "pb");
                      pbTint.setOrigin(pokeball.originX, pokeball.originY);
                      pbTint.setTintFill(0);
                      pbTint.setAlpha(0);
                      scene.field.add(pbTint);
                      scene.tweens.add({
                        targets: pbTint,
                        alpha: 0.375,
                        duration: 200,
                        easing: "Sine.easeOut",
                        onComplete: () => {
                          scene.tweens.add({
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
                    catchPokemon(scene, pokemon, pokeball, pokeballType).then(() => resolve(true));
                  }
                });
              };

              scene.time.delayedCall(250, () => doPokeballBounceAnim(scene, pokeball, 16, 72, 350, doShake));
            }
          });
        }
      });
    });
  });
}

async function throwBait(scene: BattleScene, pokemon: EnemyPokemon): Promise<boolean> {
  // TODO: replace with bait
  const pokeballType: PokeballType = PokeballType.POKEBALL;
  const originalY: number = pokemon.y;

  const fpOffset = pokemon.getFieldPositionOffset();
  const pokeballAtlasKey = getPokeballAtlasKey(pokeballType);
  const bait: Phaser.GameObjects.Sprite = scene.addFieldSprite(16 + 75, 80 + 25, "pb", pokeballAtlasKey);
  bait.setOrigin(0.5, 0.625);
  scene.field.add(bait);

  scene.playSound("pb_throw");
  // scene.time.delayedCall(300, () => {
  //   scene.field.moveBelow(pokemon, pokeball as Phaser.GameObjects.GameObject);
  // });

  return new Promise(resolve => {
    scene.trainer.setTexture(`trainer_${scene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back_pb`);
    scene.time.delayedCall(512, () => {
      // Trainer throw frames
      scene.trainer.setFrame("2");
      scene.time.delayedCall(256, () => {
        scene.trainer.setFrame("3");
        scene.time.delayedCall(768, () => {
          scene.trainer.setTexture(`trainer_${scene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back`);
        });
      });

      // Pokeball move and catch logic
      scene.tweens.add({
        targets: bait,
        x: { value: 210 + fpOffset[0], ease: "Linear" },
        y: { value: 55 + fpOffset[1], ease: "Cubic.easeOut" },
        duration: 500,
        onComplete: () => {
          // Bait frame 2
          bait.setTexture("pb", `${pokeballAtlasKey}_opening`);
          // Bait frame 3
          scene.time.delayedCall(17, () => bait.setTexture("pb", `${pokeballAtlasKey}_open`));
          // scene.playSound("pb_rel");
          // pokemon.tint(getPokeballTintColor(pokeballType));

          // addPokeballOpenParticles(scene, pokeball.x, pokeball.y, pokeballType);
          scene.time.delayedCall(512, () => {
            scene.tweens.add({
              targets: pokemon,
              duration: 200,
              ease: "Cubic.easeOut",
              yoyo: true,
              y: originalY - 30,
              loop: 2,
              onStart: () => {
                scene.playSound("PRSFX- Bug Bite");
              },
              onLoop: () => {
                scene.playSound("PRSFX- Bug Bite");
              },
              onComplete: () => {
                resolve(true);
                bait.destroy();
              }
            });
          });
        }
      });
    });
  });
}

async function throwMud(scene: BattleScene, pokemon: EnemyPokemon): Promise<boolean> {
  // TODO: replace with mud
  const pokeballType: PokeballType = PokeballType.POKEBALL;
  const originalY: number = pokemon.y;

  const fpOffset = pokemon.getFieldPositionOffset();
  const pokeballAtlasKey = getPokeballAtlasKey(pokeballType);
  const mud: Phaser.GameObjects.Sprite = scene.addFieldSprite(16 + 75, 80 + 25, "pb", pokeballAtlasKey);
  mud.setOrigin(0.5, 0.625);
  scene.field.add(mud);

  scene.playSound("pb_throw");

  return new Promise(resolve => {
    scene.trainer.setTexture(`trainer_${scene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back_pb`);
    scene.time.delayedCall(512, () => {
      // Trainer throw frames
      scene.trainer.setFrame("2");
      scene.time.delayedCall(256, () => {
        scene.trainer.setFrame("3");
        scene.time.delayedCall(768, () => {
          scene.trainer.setTexture(`trainer_${scene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back`);
        });
      });

      // Pokeball move and catch logic
      scene.tweens.add({
        targets: mud,
        x: { value: 230 + fpOffset[0], ease: "Linear" },
        y: { value: 55 + fpOffset[1], ease: "Cubic.easeOut" },
        duration: 500,
        onComplete: () => {
          // Bait frame 2
          mud.setTexture("pb", `${pokeballAtlasKey}_opening`);
          // Bait frame 3
          scene.time.delayedCall(17, () => mud.setTexture("pb", `${pokeballAtlasKey}_open`));
          scene.playSound("PRSFX- Sludge Bomb2");
          // pokemon.tint(getPokeballTintColor(pokeballType));

          // addPokeballOpenParticles(scene, pokeball.x, pokeball.y, pokeballType);
          scene.time.delayedCall(1536, () => {
            mud.destroy();
            scene.tweens.add({
              targets: pokemon,
              duration: 300,
              ease: "Cubic.easeOut",
              yoyo: true,
              y: originalY - 20,
              loop: 1,
              onStart: () => {
                scene.playSound("PRSFX- Taunt2");
              },
              onLoop: () => {
                scene.playSound("PRSFX- Taunt2");
              },
              onComplete: () => {
                resolve(true);
              }
            });
          });
        }
      });
    });
  });
}

async function failCatch(scene: BattleScene, pokemon: EnemyPokemon, originalY: number, pokeball: Phaser.GameObjects.Sprite, pokeballType: PokeballType) {
  return new Promise<void>(resolve => {
    scene.playSound("pb_rel");
    pokemon.setY(originalY);
    if (pokemon.status?.effect !== StatusEffect.SLEEP) {
      pokemon.cry(pokemon.getHpRatio() > 0.25 ? undefined : { rate: 0.85 });
    }
    pokemon.tint(getPokeballTintColor(pokeballType));
    pokemon.setVisible(true);
    pokemon.untint(250, "Sine.easeOut");

    const pokeballAtlasKey = getPokeballAtlasKey(pokeballType);
    pokeball.setTexture("pb", `${pokeballAtlasKey}_opening`);
    scene.time.delayedCall(17, () => pokeball.setTexture("pb", `${pokeballAtlasKey}_open`));

    scene.tweens.add({
      targets: pokemon,
      duration: 250,
      ease: "Sine.easeOut",
      scale: 1
    });

    scene.currentBattle.lastUsedPokeball = pokeballType;
    removePb(scene, pokeball);

    scene.ui.showText(i18next.t("battle:pokemonBrokeFree", { pokemonName: pokemon.name }), null, () => resolve(), null, true);
  });
}

async function catchPokemon(scene: BattleScene, pokemon: EnemyPokemon, pokeball: Phaser.GameObjects.Sprite, pokeballType: PokeballType): Promise<void> {
  scene.unshiftPhase(new VictoryPhase(scene, BattlerIndex.ENEMY));

  const speciesForm = !pokemon.fusionSpecies ? pokemon.getSpeciesForm() : pokemon.getFusionSpeciesForm();

  if (speciesForm.abilityHidden && (pokemon.fusionSpecies ? pokemon.fusionAbilityIndex : pokemon.abilityIndex) === speciesForm.getAbilityCount() - 1) {
    scene.validateAchv(achvs.HIDDEN_ABILITY);
  }

  if (pokemon.species.subLegendary) {
    scene.validateAchv(achvs.CATCH_SUB_LEGENDARY);
  }

  if (pokemon.species.legendary) {
    scene.validateAchv(achvs.CATCH_LEGENDARY);
  }

  if (pokemon.species.mythical) {
    scene.validateAchv(achvs.CATCH_MYTHICAL);
  }

  scene.pokemonInfoContainer.show(pokemon, true);

  scene.gameData.updateSpeciesDexIvs(pokemon.species.getRootSpeciesId(true), pokemon.ivs);

  return new Promise(resolve => {
    scene.ui.showText(i18next.t("battle:pokemonCaught", { pokemonName: pokemon.name }), null, () => {
      const end = () => {
        scene.pokemonInfoContainer.hide();
        removePb(scene, pokeball);
        resolve();
      };
      const removePokemon = () => {
        scene.field.remove(pokemon, true);
      };
      const addToParty = () => {
        const newPokemon = pokemon.addToParty(pokeballType);
        const modifiers = scene.findModifiers(m => m instanceof PokemonHeldItemModifier, false);
        if (scene.getParty().filter(p => p.isShiny()).length === 6) {
          scene.validateAchv(achvs.SHINY_PARTY);
        }
        Promise.all(modifiers.map(m => scene.addModifier(m, true))).then(() => {
          scene.updateModifiers(true);
          removePokemon();
          if (newPokemon) {
            newPokemon.loadAssets().then(end);
          } else {
            end();
          }
        });
      };
      Promise.all([pokemon.hideInfo(), scene.gameData.setPokemonCaught(pokemon)]).then(() => {
        if (scene.getParty().length === 6) {
          const promptRelease = () => {
            scene.ui.showText(i18next.t("battle:partyFull", { pokemonName: pokemon.name }), null, () => {
              scene.pokemonInfoContainer.makeRoomForConfirmUi();
              scene.ui.setMode(Mode.CONFIRM, () => {
                scene.ui.setMode(Mode.PARTY, PartyUiMode.RELEASE, 0, (slotIndex: integer, _option: PartyOption) => {
                  scene.ui.setMode(Mode.MESSAGE).then(() => {
                    if (slotIndex < 6) {
                      addToParty();
                    } else {
                      promptRelease();
                    }
                  });
                });
              }, () => {
                scene.ui.setMode(Mode.MESSAGE).then(() => {
                  removePokemon();
                  end();
                });
              });
            });
          };
          promptRelease();
        } else {
          addToParty();
        }
      });
    }, 0, true);
  });
}

function removePb(scene: BattleScene, pokeball: Phaser.GameObjects.Sprite) {
  scene.tweens.add({
    targets: pokeball,
    duration: 250,
    delay: 250,
    ease: "Sine.easeIn",
    alpha: 0,
    onComplete: () => pokeball.destroy()
  });
}

function isPokemonFlee(pokemon: EnemyPokemon, fleeStage: number): boolean {
  const speciesCatchRate = pokemon.species.catchRate;
  const fleeModifier = (2 + Math.min(Math.max(fleeStage, 0), 6)) / (2 - Math.max(Math.min(fleeStage, 0), -6));
  const fleeRate = (255 * 255 - speciesCatchRate * speciesCatchRate) / 255 / 2 * fleeModifier;
  console.log("Flee rate: " + fleeRate);
  const roll = randSeedInt(256);
  console.log("Roll: " + roll);
  return roll < fleeRate;
}

async function doPokemonFlee(scene: BattleScene, pokemon: EnemyPokemon): Promise<void> {
  const fleeAnimation = new Promise<void>(resolve => {
    // Ease pokemon out
    scene.tweens.add({
      targets: pokemon,
      x: "+=16",
      y: "-=16",
      alpha: 0,
      duration: 1000,
      ease: "Sine.easeIn",
      scale: pokemon.getSpriteScale(),
      onComplete: () => {
        pokemon.setVisible(false);
        scene.field.remove(pokemon, true);
        resolve();
      }
    });
  });

  const prompt = new Promise<void>(resolve => {
    scene.ui.showText(i18next.t("battle:pokemonFled", { pokemonName: pokemon.name }), 0, () => resolve(), 500);
  });

  await Promise.all([fleeAnimation, prompt]);
}

async function doPlayerFlee(scene: BattleScene, pokemon: EnemyPokemon): Promise<void> {
  const fleeAnimation = new Promise<void>(resolve => {
    // Ease pokemon out
    scene.tweens.add({
      targets: pokemon,
      x: "+=16",
      y: "-=16",
      alpha: 0,
      duration: 1000,
      ease: "Sine.easeIn",
      scale: pokemon.getSpriteScale(),
      onComplete: () => {
        pokemon.setVisible(false);
        scene.field.remove(pokemon, true);
        resolve();
      }
    });
  });

  const prompt = new Promise<void>(resolve => {
    scene.ui.showText(i18next.t("battle:playerFled", { pokemonName: pokemon.name }), 0, () => resolve(), 500);
  });

  await Promise.all([fleeAnimation, prompt]);
}

function tryChangeFleeStage(scene: BattleScene, change: number, chance?: number): boolean {
  if (chance && randSeedInt(10) >= chance) {
    console.log("Failed to change flee stage");
    return false;
  }
  const currentFleeStage = scene.currentBattle.mysteryEncounter.misc.fleeStage ?? 0;
  // console.log("currentFleeStage: " + currentFleeStage);
  scene.currentBattle.mysteryEncounter.misc.fleeStage = Math.min(Math.max(currentFleeStage + change, -6), 6);
  return true;
}

function tryChangeCatchStage(scene: BattleScene, change: number, chance?: number): boolean {
  if (chance && randSeedInt(10) >= chance) {
    console.log("Failed to change catch stage");
    return false;
  }
  const currentCatchStage = scene.currentBattle.mysteryEncounter.misc.catchStage ?? 0;
  // console.log("currentCatchStage: " + currentCatchStage);
  scene.currentBattle.mysteryEncounter.misc.catchStage = Math.min(Math.max(currentCatchStage + change, -6), 6);
  return true;
}

async function doEndTurn(scene: BattleScene, cursorIndex: number, message?: string) {
  const pokemon = scene.currentBattle.mysteryEncounter.misc.pokemon;
  console.log("fleeStage: " + scene.currentBattle.mysteryEncounter.misc.fleeStage);
  console.log("catchStage: " + scene.currentBattle.mysteryEncounter.misc.catchStage);
  const isFlee = isPokemonFlee(pokemon, scene.currentBattle.mysteryEncounter.misc.fleeStage);
  if (isFlee) {
    // Pokemon flees!
    await doPokemonFlee(scene, pokemon);
    // Check how many safari pokemon left
    if (scene.currentBattle.mysteryEncounter.misc.safariPokemonRemaining > 0) {
      await summonSafariPokemon(scene);
      initFollowupOptionSelect(scene, { overrideOptions: safariZoneOptions, startingCursorIndex: cursorIndex, hideDescription: true });
    } else {
      // End safari mode
      leaveEncounterWithoutBattle(scene, true);
    }
  } else {
    scene.queueMessage(i18next.t(`${namespace}_pokemon_watching`, { pokemonName: pokemon.name }), 0, null, 500);
    initFollowupOptionSelect(scene, { overrideOptions: safariZoneOptions, startingCursorIndex: cursorIndex, hideDescription: true });
  }
}
