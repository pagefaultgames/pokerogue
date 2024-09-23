import { initSubsequentOptionSelect, leaveEncounterWithoutBattle, transitionMysteryEncounterIntroVisuals, updatePlayerMoney, } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "#app/battle-scene";
import MysteryEncounter, { MysteryEncounterBuilder } from "#app/data/mystery-encounters/mystery-encounter";
import MysteryEncounterOption, { MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import { TrainerSlot } from "#app/data/trainer-config";
import { HiddenAbilityRateBoosterModifier, IvScannerModifier } from "#app/modifier/modifier";
import { EnemyPokemon } from "#app/field/pokemon";
import { PokeballType } from "#app/data/pokeball";
import { PlayerGender } from "#enums/player-gender";
import { IntegerHolder, randSeedInt } from "#app/utils";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import { MoneyRequirement } from "#app/data/mystery-encounters/mystery-encounter-requirements";
import { doPlayerFlee, doPokemonFlee, getRandomSpeciesByStarterTier, trainerThrowPokeball } from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";
import { getEncounterText, showEncounterText } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import { getPokemonNameWithAffix } from "#app/messages";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { ScanIvsPhase } from "#app/phases/scan-ivs-phase";
import { SummonPhase } from "#app/phases/summon-phase";
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/game-mode";

/** the i18n namespace for the encounter */
const namespace = "mysteryEncounters/safariZone";

const TRAINER_THROW_ANIMATION_TIMES = [512, 184, 768];

const SAFARI_MONEY_MULTIPLIER = 2;

/**
 * Safari Zone encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3800 | GitHub Issue #3800}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const SafariZoneEncounter: MysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.SAFARI_ZONE)
    .withEncounterTier(MysteryEncounterTier.GREAT)
    .withSceneWaveRangeRequirement(...CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES)
    .withSceneRequirement(new MoneyRequirement(0, SAFARI_MONEY_MULTIPLIER)) // Cost equal to 1 Max Revive
    .withAutoHideIntroVisuals(false)
    .withIntroSpriteConfigs([
      {
        spriteKey: "safari_zone",
        fileRoot: "mystery-encounters",
        hasShadow: false,
        x: 4,
        y: 6
      },
    ])
    .withIntroDialogue([
      {
        text: `${namespace}:intro`,
      },
    ])
    .withTitle(`${namespace}:title`)
    .withDescription(`${namespace}:description`)
    .withQuery(`${namespace}:query`)
    .withOption(MysteryEncounterOptionBuilder
      .newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT)
      .withSceneRequirement(new MoneyRequirement(0, SAFARI_MONEY_MULTIPLIER)) // Cost equal to 1 Max Revive
      .withDialogue({
        buttonLabel: `${namespace}:option.1.label`,
        buttonTooltip: `${namespace}:option.1.tooltip`,
        selected: [
          {
            text: `${namespace}:option.1.selected`,
          },
        ],
      })
      .withOptionPhase(async (scene: BattleScene) => {
        // Start safari encounter
        const encounter = scene.currentBattle.mysteryEncounter!;
        encounter.continuousEncounter = true;
        encounter.misc = {
          safariPokemonRemaining: 3
        };
        updatePlayerMoney(scene, -(encounter.options[0].requirements[0] as MoneyRequirement).requiredMoney);
        // Load bait/mud assets
        scene.loadSe("PRSFX- Bug Bite", "battle_anims", "PRSFX- Bug Bite.wav");
        scene.loadSe("PRSFX- Sludge Bomb2", "battle_anims", "PRSFX- Sludge Bomb2.wav");
        scene.loadSe("PRSFX- Taunt2", "battle_anims", "PRSFX- Taunt2.wav");
        scene.loadAtlas("safari_zone_bait", "mystery-encounters");
        scene.loadAtlas("safari_zone_mud", "mystery-encounters");
        // Clear enemy party
        scene.currentBattle.enemyParty = [];
        await transitionMysteryEncounterIntroVisuals(scene);
        await summonSafariPokemon(scene);
        initSubsequentOptionSelect(scene, { overrideOptions: safariZoneGameOptions, hideDescription: true });
        return true;
      })
      .build()
    )
    .withSimpleOption(
      {
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: `${namespace}:option.2.tooltip`,
        selected: [
          {
            text: `${namespace}:option.2.selected`,
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

/**
 * SAFARI ZONE MINIGAME OPTIONS
 *
 * Catch and flee rate stages are calculated in the same way stat changes are (they range from -6/+6)
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
const safariZoneGameOptions: MysteryEncounterOption[] = [
  MysteryEncounterOptionBuilder
    .newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
    .withDialogue({
      buttonLabel: `${namespace}:safari.1.label`,
      buttonTooltip: `${namespace}:safari.1.tooltip`,
      selected: [
        {
          text: `${namespace}:safari.1.selected`,
        }
      ],
    })
    .withOptionPhase(async (scene: BattleScene) => {
      // Throw a ball option
      const encounter = scene.currentBattle.mysteryEncounter!;
      const pokemon = encounter.misc.pokemon;
      const catchResult = await throwPokeball(scene, pokemon);

      if (catchResult) {
        // You caught pokemon
        // Check how many safari pokemon left
        if (encounter.misc.safariPokemonRemaining > 0) {
          await summonSafariPokemon(scene);
          initSubsequentOptionSelect(scene, { overrideOptions: safariZoneGameOptions, startingCursorIndex: 0, hideDescription: true });
        } else {
          // End safari mode
          encounter.continuousEncounter = false;
          leaveEncounterWithoutBattle(scene, true);
        }
      } else {
        // Pokemon catch failed, end turn
        await doEndTurn(scene, 0);
      }
      return true;
    })
    .build(),
  MysteryEncounterOptionBuilder
    .newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
    .withDialogue({
      buttonLabel: `${namespace}:safari.2.label`,
      buttonTooltip: `${namespace}:safari.2.tooltip`,
      selected: [
        {
          text: `${namespace}:safari.2.selected`,
        },
      ],
    })
    .withOptionPhase(async (scene: BattleScene) => {
      // Throw bait option
      const pokemon = scene.currentBattle.mysteryEncounter!.misc.pokemon;
      await throwBait(scene, pokemon);

      // 100% chance to increase catch stage +2
      tryChangeCatchStage(scene, 2);
      // 80% chance to increase flee stage +1
      const fleeChangeResult = tryChangeFleeStage(scene, 1, 8);
      if (!fleeChangeResult) {
        await showEncounterText(scene, getEncounterText(scene, `${namespace}:safari.busy_eating`) ?? "", null, 1000, false );
      } else {
        await showEncounterText(scene, getEncounterText(scene, `${namespace}:safari.eating`) ?? "", null, 1000, false);
      }

      await doEndTurn(scene, 1);
      return true;
    })
    .build(),
  MysteryEncounterOptionBuilder
    .newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
    .withDialogue({
      buttonLabel: `${namespace}:safari.3.label`,
      buttonTooltip: `${namespace}:safari.3.tooltip`,
      selected: [
        {
          text: `${namespace}:safari.3.selected`,
        },
      ],
    })
    .withOptionPhase(async (scene: BattleScene) => {
      // Throw mud option
      const pokemon = scene.currentBattle.mysteryEncounter!.misc.pokemon;
      await throwMud(scene, pokemon);
      // 100% chance to decrease flee stage -2
      tryChangeFleeStage(scene, -2);
      // 80% chance to decrease catch stage -1
      const catchChangeResult = tryChangeCatchStage(scene, -1, 8);
      if (!catchChangeResult) {
        await showEncounterText(scene, getEncounterText(scene, `${namespace}:safari.beside_itself_angry`) ?? "", null, 1000, false );
      } else {
        await showEncounterText(scene, getEncounterText(scene, `${namespace}:safari.angry`) ?? "", null, 1000, false );
      }

      await doEndTurn(scene, 2);
      return true;
    })
    .build(),
  MysteryEncounterOptionBuilder
    .newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
    .withDialogue({
      buttonLabel: `${namespace}:safari.4.label`,
      buttonTooltip: `${namespace}:safari.4.tooltip`,
    })
    .withOptionPhase(async (scene: BattleScene) => {
      // Flee option
      const encounter = scene.currentBattle.mysteryEncounter!;
      const pokemon = encounter.misc.pokemon;
      await doPlayerFlee(scene, pokemon);
      // Check how many safari pokemon left
      if (encounter.misc.safariPokemonRemaining > 0) {
        await summonSafariPokemon(scene);
        initSubsequentOptionSelect(scene, { overrideOptions: safariZoneGameOptions, startingCursorIndex: 3, hideDescription: true });
      } else {
        // End safari mode
        encounter.continuousEncounter = false;
        leaveEncounterWithoutBattle(scene, true);
      }
      return true;
    })
    .build()
];

async function summonSafariPokemon(scene: BattleScene) {
  const encounter = scene.currentBattle.mysteryEncounter!;
  // Message pokemon remaining
  encounter.setDialogueToken("remainingCount", encounter.misc.safariPokemonRemaining);
  scene.queueMessage(getEncounterText(scene, `${namespace}:safari.remaining_count`) ?? "", null, true);

  // Generate pokemon using safariPokemonRemaining so they are always the same pokemon no matter how many turns are taken
  // Safari pokemon roll twice on shiny and HA chances, but are otherwise normal
  let enemySpecies;
  let pokemon;
  scene.executeWithSeedOffset(() => {
    enemySpecies = getPokemonSpecies(getRandomSpeciesByStarterTier([0, 5], undefined, undefined, false, false, false));
    const level = scene.currentBattle.getLevelForWave();
    enemySpecies = getPokemonSpecies(enemySpecies.getWildSpeciesForLevel(level, true, false, scene.gameMode));
    pokemon = scene.addEnemyPokemon(enemySpecies, level, TrainerSlot.NONE, false);

    // Roll shiny twice
    if (!pokemon.shiny) {
      pokemon.trySetShinySeed();
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

    scene.currentBattle.enemyParty.unshift(pokemon);
  }, scene.currentBattle.waveIndex * 1000 * encounter.misc.safariPokemonRemaining);

  scene.gameData.setPokemonSeen(pokemon, true);
  await pokemon.loadAssets();

  // Reset safari catch and flee rates
  encounter.misc.catchStage = 0;
  encounter.misc.fleeStage = 0;
  encounter.misc.pokemon = pokemon;
  encounter.misc.safariPokemonRemaining -= 1;

  scene.unshiftPhase(new SummonPhase(scene, 0, false));

  encounter.setDialogueToken("pokemonName", getPokemonNameWithAffix(pokemon));
  showEncounterText(scene, getEncounterText(scene, "battle:singleWildAppeared") ?? "", null, 1500, false)
    .then(() => {
      const ivScannerModifier = scene.findModifier(m => m instanceof IvScannerModifier);
      if (ivScannerModifier) {
        scene.pushPhase(new ScanIvsPhase(scene, pokemon.getBattlerIndex(), Math.min(ivScannerModifier.getStackCount() * 2, 6)));
      }
    });
}

function throwPokeball(scene: BattleScene, pokemon: EnemyPokemon): Promise<boolean> {
  const baseCatchRate = pokemon.species.catchRate;
  // Catch stage ranges from -6 to +6 (like stat boost stages)
  const safariCatchStage = scene.currentBattle.mysteryEncounter!.misc.catchStage;
  // Catch modifier ranges from 2/8 (-6 stage) to 8/2 (+6)
  const safariModifier = (2 + Math.min(Math.max(safariCatchStage, 0), 6)) / (2 - Math.max(Math.min(safariCatchStage, 0), -6));
  // Catch rate same as safari ball
  const pokeballMultiplier = 1.5;
  const catchRate = Math.round(baseCatchRate * pokeballMultiplier * safariModifier);
  const ballTwitchRate = Math.round(1048560 / Math.sqrt(Math.sqrt(16711680 / catchRate)));
  return trainerThrowPokeball(scene, pokemon, PokeballType.POKEBALL, ballTwitchRate);
}

async function throwBait(scene: BattleScene, pokemon: EnemyPokemon): Promise<boolean> {
  const originalY: number = pokemon.y;

  const fpOffset = pokemon.getFieldPositionOffset();
  const bait: Phaser.GameObjects.Sprite = scene.addFieldSprite(16 + 75, 80 + 25, "safari_zone_bait", "0001.png");
  bait.setOrigin(0.5, 0.625);
  scene.field.add(bait);

  return new Promise(resolve => {
    scene.trainer.setTexture(`trainer_${scene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back_pb`);
    scene.time.delayedCall(TRAINER_THROW_ANIMATION_TIMES[0], () => {
      scene.playSound("se/pb_throw");

      // Trainer throw frames
      scene.trainer.setFrame("2");
      scene.time.delayedCall(TRAINER_THROW_ANIMATION_TIMES[1], () => {
        scene.trainer.setFrame("3");
        scene.time.delayedCall(TRAINER_THROW_ANIMATION_TIMES[2], () => {
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

          let index = 1;
          scene.time.delayedCall(768, () => {
            scene.tweens.add({
              targets: pokemon,
              duration: 150,
              ease: "Cubic.easeOut",
              yoyo: true,
              y: originalY - 5,
              loop: 6,
              onStart: () => {
                scene.playSound("battle_anims/PRSFX- Bug Bite");
                bait.setFrame("0002.png");
              },
              onLoop: () => {
                if (index % 2 === 0) {
                  scene.playSound("battle_anims/PRSFX- Bug Bite");
                }
                if (index === 4) {
                  bait.setFrame("0003.png");
                }
                index++;
              },
              onComplete: () => {
                scene.time.delayedCall(256, () => {
                  bait.destroy();
                  resolve(true);
                });
              }
            });
          });
        }
      });
    });
  });
}

async function throwMud(scene: BattleScene, pokemon: EnemyPokemon): Promise<boolean> {
  const originalY: number = pokemon.y;

  const fpOffset = pokemon.getFieldPositionOffset();
  const mud: Phaser.GameObjects.Sprite = scene.addFieldSprite(16 + 75, 80 + 35, "safari_zone_mud", "0001.png");
  mud.setOrigin(0.5, 0.625);
  scene.field.add(mud);

  return new Promise(resolve => {
    scene.trainer.setTexture(`trainer_${scene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back_pb`);
    scene.time.delayedCall(TRAINER_THROW_ANIMATION_TIMES[0], () => {
      scene.playSound("se/pb_throw");

      // Trainer throw frames
      scene.trainer.setFrame("2");
      scene.time.delayedCall(TRAINER_THROW_ANIMATION_TIMES[1], () => {
        scene.trainer.setFrame("3");
        scene.time.delayedCall(TRAINER_THROW_ANIMATION_TIMES[2], () => {
          scene.trainer.setTexture(`trainer_${scene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back`);
        });
      });

      // Mud throw and splat
      scene.tweens.add({
        targets: mud,
        x: { value: 230 + fpOffset[0], ease: "Linear" },
        y: { value: 55 + fpOffset[1], ease: "Cubic.easeOut" },
        duration: 500,
        onComplete: () => {
          // Mud frame 2
          scene.playSound("battle_anims/PRSFX- Sludge Bomb2");
          mud.setFrame("0002.png");
          // Mud splat
          scene.time.delayedCall(200, () => {
            mud.setFrame("0003.png");
            scene.time.delayedCall(400, () => {
              mud.setFrame("0004.png");
            });
          });

          // Fade mud then angry animation
          scene.tweens.add({
            targets: mud,
            alpha: 0,
            ease: "Cubic.easeIn",
            duration: 1000,
            onComplete: () => {
              mud.destroy();
              scene.tweens.add({
                targets: pokemon,
                duration: 300,
                ease: "Cubic.easeOut",
                yoyo: true,
                y: originalY - 20,
                loop: 1,
                onStart: () => {
                  scene.playSound("battle_anims/PRSFX- Taunt2");
                },
                onLoop: () => {
                  scene.playSound("battle_anims/PRSFX- Taunt2");
                },
                onComplete: () => {
                  resolve(true);
                }
              });
            }
          });
        }
      });
    });
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

function tryChangeFleeStage(scene: BattleScene, change: number, chance?: number): boolean {
  if (chance && randSeedInt(10) >= chance) {
    return false;
  }
  const currentFleeStage = scene.currentBattle.mysteryEncounter!.misc.fleeStage ?? 0;
  scene.currentBattle.mysteryEncounter!.misc.fleeStage = Math.min(Math.max(currentFleeStage + change, -6), 6);
  return true;
}

function tryChangeCatchStage(scene: BattleScene, change: number, chance?: number): boolean {
  if (chance && randSeedInt(10) >= chance) {
    return false;
  }
  const currentCatchStage = scene.currentBattle.mysteryEncounter!.misc.catchStage ?? 0;
  scene.currentBattle.mysteryEncounter!.misc.catchStage = Math.min(Math.max(currentCatchStage + change, -6), 6);
  return true;
}

async function doEndTurn(scene: BattleScene, cursorIndex: number) {
  // First cleanup and destroy old Pokemon objects that were left in the enemyParty
  // They are left in enemyParty temporarily so that VictoryPhase properly handles EXP
  const party = scene.getEnemyParty();
  if (party.length > 1) {
    for (let i = 1; i < party.length; i++) {
      party[i].destroy();
    }
    scene.currentBattle.enemyParty = party.slice(0, 1);
  }

  const encounter = scene.currentBattle.mysteryEncounter!;
  const pokemon = encounter.misc.pokemon;
  const isFlee = isPokemonFlee(pokemon, encounter.misc.fleeStage);
  if (isFlee) {
    // Pokemon flees!
    await doPokemonFlee(scene, pokemon);
    // Check how many safari pokemon left
    if (encounter.misc.safariPokemonRemaining > 0) {
      await summonSafariPokemon(scene);
      initSubsequentOptionSelect(scene, { overrideOptions: safariZoneGameOptions, startingCursorIndex: cursorIndex, hideDescription: true });
    } else {
      // End safari mode
      encounter.continuousEncounter = false;
      leaveEncounterWithoutBattle(scene, true);
    }
  } else {
    scene.queueMessage(getEncounterText(scene, `${namespace}:safari.watching`) ?? "", 0, null, 1000);
    initSubsequentOptionSelect(scene, { overrideOptions: safariZoneGameOptions, startingCursorIndex: cursorIndex, hideDescription: true });
  }
}
