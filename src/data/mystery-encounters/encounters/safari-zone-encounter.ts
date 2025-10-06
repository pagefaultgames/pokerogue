import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/constants";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { NON_LEGEND_PARADOX_POKEMON } from "#balance/special-species-groups";
import type { PokemonSpecies } from "#data/pokemon-species";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { PlayerGender } from "#enums/player-gender";
import { PokeballType } from "#enums/pokeball";
import { TrainerSlot } from "#enums/trainer-slot";
import type { EnemyPokemon } from "#field/pokemon";
import { HiddenAbilityRateBoosterModifier, IvScannerModifier } from "#modifiers/modifier";
import { getEncounterText, showEncounterText } from "#mystery-encounters/encounter-dialogue-utils";
import {
  initSubsequentOptionSelect,
  leaveEncounterWithoutBattle,
  transitionMysteryEncounterIntroVisuals,
  updatePlayerMoney,
} from "#mystery-encounters/encounter-phase-utils";
import {
  doPlayerFlee,
  doPokemonFlee,
  getRandomSpeciesByStarterCost,
  trainerThrowPokeball,
} from "#mystery-encounters/encounter-pokemon-utils";
import type { MysteryEncounter } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterBuilder } from "#mystery-encounters/mystery-encounter";
import type { MysteryEncounterOption } from "#mystery-encounters/mystery-encounter-option";
import { MysteryEncounterOptionBuilder } from "#mystery-encounters/mystery-encounter-option";
import { MoneyRequirement } from "#mystery-encounters/mystery-encounter-requirements";
import { NumberHolder, randSeedInt } from "#utils/common";
import { getPokemonSpecies } from "#utils/pokemon-utils";

/** the i18n namespace for the encounter */
const namespace = "mysteryEncounters/safariZone";

const TRAINER_THROW_ANIMATION_TIMES = [512, 184, 768];

const SAFARI_MONEY_MULTIPLIER = 2;

const NUM_SAFARI_ENCOUNTERS = 3;

/**
 * Safari Zone encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3800 | GitHub Issue #3800}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const SafariZoneEncounter: MysteryEncounter = MysteryEncounterBuilder.withEncounterType(
  MysteryEncounterType.SAFARI_ZONE,
)
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
      y: 6,
    },
  ])
  .withIntroDialogue([
    {
      text: `${namespace}:intro`,
    },
  ])
  .setLocalizationKey(`${namespace}`)
  .withTitle(`${namespace}:title`)
  .withDescription(`${namespace}:description`)
  .withQuery(`${namespace}:query`)
  .withOnInit(() => {
    globalScene.currentBattle.mysteryEncounter?.setDialogueToken("numEncounters", NUM_SAFARI_ENCOUNTERS.toString());
    return true;
  })
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT)
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
      .withOptionPhase(async () => {
        // Start safari encounter
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        encounter.continuousEncounter = true;
        encounter.misc = {
          safariPokemonRemaining: NUM_SAFARI_ENCOUNTERS,
        };
        updatePlayerMoney(-(encounter.options[0].requirements[0] as MoneyRequirement).requiredMoney);
        // Load bait/mud assets
        globalScene.loadSe("PRSFX- Bug Bite", "battle_anims", "PRSFX- Bug Bite.wav");
        globalScene.loadSe("PRSFX- Sludge Bomb2", "battle_anims", "PRSFX- Sludge Bomb2.wav");
        globalScene.loadSe("PRSFX- Taunt2", "battle_anims", "PRSFX- Taunt2.wav");
        globalScene.loadAtlas("safari_zone_bait", "mystery-encounters");
        globalScene.loadAtlas("safari_zone_mud", "mystery-encounters");
        // Clear enemy party
        globalScene.currentBattle.enemyParty = [];
        await transitionMysteryEncounterIntroVisuals();
        await summonSafariPokemon();
        initSubsequentOptionSelect({
          overrideOptions: safariZoneGameOptions,
          hideDescription: true,
        });
        return true;
      })
      .build(),
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
    async () => {
      // Leave encounter with no rewards or exp
      leaveEncounterWithoutBattle(true);
      return true;
    },
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
  MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
    .withDialogue({
      buttonLabel: `${namespace}:safari.1.label`,
      buttonTooltip: `${namespace}:safari.1.tooltip`,
      selected: [
        {
          text: `${namespace}:safari.1.selected`,
        },
      ],
    })
    .withOptionPhase(async () => {
      // Throw a ball option
      const encounter = globalScene.currentBattle.mysteryEncounter!;
      const pokemon = encounter.misc.pokemon;
      const catchResult = await throwPokeball(pokemon);

      if (catchResult) {
        // You caught pokemon
        // Check how many safari pokemon left
        if (encounter.misc.safariPokemonRemaining > 0) {
          await summonSafariPokemon();
          initSubsequentOptionSelect({
            overrideOptions: safariZoneGameOptions,
            startingCursorIndex: 0,
            hideDescription: true,
          });
        } else {
          // End safari mode
          encounter.continuousEncounter = false;
          leaveEncounterWithoutBattle(true);
        }
      } else {
        // Pokemon catch failed, end turn
        await doEndTurn(0);
      }
      return true;
    })
    .build(),
  MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
    .withDialogue({
      buttonLabel: `${namespace}:safari.2.label`,
      buttonTooltip: `${namespace}:safari.2.tooltip`,
      selected: [
        {
          text: `${namespace}:safari.2.selected`,
        },
      ],
    })
    .withOptionPhase(async () => {
      // Throw bait option
      const pokemon = globalScene.currentBattle.mysteryEncounter!.misc.pokemon;
      await throwBait(pokemon);

      // 100% chance to increase catch stage +2
      tryChangeCatchStage(2);
      // 80% chance to increase flee stage +1
      const fleeChangeResult = tryChangeFleeStage(1, 8);
      if (!fleeChangeResult) {
        await showEncounterText(getEncounterText(`${namespace}:safari.busyEating`) ?? "", null, 1000, false);
      } else {
        await showEncounterText(getEncounterText(`${namespace}:safari.eating`) ?? "", null, 1000, false);
      }

      await doEndTurn(1);
      return true;
    })
    .build(),
  MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
    .withDialogue({
      buttonLabel: `${namespace}:safari.3.label`,
      buttonTooltip: `${namespace}:safari.3.tooltip`,
      selected: [
        {
          text: `${namespace}:safari.3.selected`,
        },
      ],
    })
    .withOptionPhase(async () => {
      // Throw mud option
      const pokemon = globalScene.currentBattle.mysteryEncounter!.misc.pokemon;
      await throwMud(pokemon);
      // 100% chance to decrease flee stage -2
      tryChangeFleeStage(-2);
      // 80% chance to decrease catch stage -1
      const catchChangeResult = tryChangeCatchStage(-1, 8);
      if (!catchChangeResult) {
        await showEncounterText(getEncounterText(`${namespace}:safari.besideItselfAngry`) ?? "", null, 1000, false);
      } else {
        await showEncounterText(getEncounterText(`${namespace}:safari.angry`) ?? "", null, 1000, false);
      }

      await doEndTurn(2);
      return true;
    })
    .build(),
  MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
    .withDialogue({
      buttonLabel: `${namespace}:safari.4.label`,
      buttonTooltip: `${namespace}:safari.4.tooltip`,
    })
    .withOptionPhase(async () => {
      // Flee option
      const encounter = globalScene.currentBattle.mysteryEncounter!;
      const pokemon = encounter.misc.pokemon;
      await doPlayerFlee(pokemon);
      // Check how many safari pokemon left
      if (encounter.misc.safariPokemonRemaining > 0) {
        await summonSafariPokemon();
        initSubsequentOptionSelect({
          overrideOptions: safariZoneGameOptions,
          startingCursorIndex: 3,
          hideDescription: true,
        });
      } else {
        // End safari mode
        encounter.continuousEncounter = false;
        leaveEncounterWithoutBattle(true);
      }
      return true;
    })
    .build(),
];

async function summonSafariPokemon() {
  const encounter = globalScene.currentBattle.mysteryEncounter!;
  // Message pokemon remaining
  encounter.setDialogueToken("remainingCount", encounter.misc.safariPokemonRemaining);
  globalScene.phaseManager.queueMessage(getEncounterText(`${namespace}:safari.remainingCount`) ?? "", null, true);

  // Generate pokemon using safariPokemonRemaining so they are always the same pokemon no matter how many turns are taken
  // Safari pokemon roll twice on shiny and HA chances, but are otherwise normal
  let enemySpecies: PokemonSpecies;
  let pokemon: any;
  globalScene.executeWithSeedOffset(
    () => {
      enemySpecies = getSafariSpeciesSpawn();
      const level = globalScene.currentBattle.getLevelForWave();
      enemySpecies = getPokemonSpecies(enemySpecies.getWildSpeciesForLevel(level, true, false, globalScene.gameMode));
      pokemon = globalScene.addEnemyPokemon(enemySpecies, level, TrainerSlot.NONE, false);

      // Roll shiny twice
      if (!pokemon.shiny) {
        pokemon.trySetShinySeed();
      }

      // Roll HA twice
      if (pokemon.species.abilityHidden) {
        const hiddenIndex = pokemon.species.ability2 ? 2 : 1;
        if (pokemon.abilityIndex < hiddenIndex) {
          const hiddenAbilityChance = new NumberHolder(256);
          globalScene.applyModifiers(HiddenAbilityRateBoosterModifier, true, hiddenAbilityChance);

          const hasHiddenAbility = !randSeedInt(hiddenAbilityChance.value);

          if (hasHiddenAbility) {
            pokemon.abilityIndex = hiddenIndex;
          }
        }
      }

      pokemon.calculateStats();

      globalScene.currentBattle.enemyParty.unshift(pokemon);
    },
    globalScene.currentBattle.waveIndex * 1000 * encounter.misc.safariPokemonRemaining,
  );

  globalScene.gameData.setPokemonSeen(pokemon, true);
  await pokemon.loadAssets();

  // Reset safari catch and flee rates
  encounter.misc.catchStage = 0;
  encounter.misc.fleeStage = 0;
  encounter.misc.pokemon = pokemon;
  encounter.misc.safariPokemonRemaining -= 1;

  globalScene.phaseManager.unshiftNew("SummonPhase", 0, false);

  encounter.setDialogueToken("pokemonName", getPokemonNameWithAffix(pokemon));

  // TODO: If we await showEncounterText here, then the text will display without
  // the wild Pokemon on screen, but if we don't await it, then the text never
  // shows up and the IV scanner breaks. For now, we place the IV scanner code
  // separately so that at least the IV scanner works.

  const ivScannerModifier = globalScene.findModifier(m => m instanceof IvScannerModifier);
  if (ivScannerModifier) {
    globalScene.phaseManager.pushNew("ScanIvsPhase", pokemon.getBattlerIndex());
  }
}

function throwPokeball(pokemon: EnemyPokemon): Promise<boolean> {
  const baseCatchRate = pokemon.species.catchRate;
  // Catch stage ranges from -6 to +6 (like stat boost stages)
  const safariCatchStage = globalScene.currentBattle.mysteryEncounter!.misc.catchStage;
  // Catch modifier ranges from 2/8 (-6 stage) to 8/2 (+6)
  const safariModifier =
    (2 + Math.min(Math.max(safariCatchStage, 0), 6)) / (2 - Math.max(Math.min(safariCatchStage, 0), -6));
  // Catch rate same as safari ball
  const pokeballMultiplier = 1.5;
  const catchRate = Math.round(baseCatchRate * pokeballMultiplier * safariModifier);
  const ballTwitchRate = Math.round(1048560 / Math.sqrt(Math.sqrt(16711680 / catchRate)));
  return trainerThrowPokeball(pokemon, PokeballType.POKEBALL, ballTwitchRate);
}

async function throwBait(pokemon: EnemyPokemon): Promise<boolean> {
  const originalY: number = pokemon.y;

  const fpOffset = pokemon.getFieldPositionOffset();
  const bait: Phaser.GameObjects.Sprite = globalScene.addFieldSprite(16 + 75, 80 + 25, "safari_zone_bait", "0001.png");
  bait.setOrigin(0.5, 0.625);
  globalScene.field.add(bait);

  return new Promise(resolve => {
    globalScene.trainer.setTexture(
      `trainer_${globalScene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back_pb`,
    );
    globalScene.time.delayedCall(TRAINER_THROW_ANIMATION_TIMES[0], () => {
      globalScene.playSound("se/pb_throw");

      // Trainer throw frames
      globalScene.trainer.setFrame("2");
      globalScene.time.delayedCall(TRAINER_THROW_ANIMATION_TIMES[1], () => {
        globalScene.trainer.setFrame("3");
        globalScene.time.delayedCall(TRAINER_THROW_ANIMATION_TIMES[2], () => {
          globalScene.trainer.setTexture(
            `trainer_${globalScene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back`,
          );
        });
      });

      // Pokeball move and catch logic
      globalScene.tweens.add({
        targets: bait,
        x: { value: 210 + fpOffset[0], ease: "Linear" },
        y: { value: 55 + fpOffset[1], ease: "Cubic.easeOut" },
        duration: 500,
        onComplete: () => {
          let index = 1;
          globalScene.time.delayedCall(768, () => {
            globalScene.tweens.add({
              targets: pokemon,
              duration: 150,
              ease: "Cubic.easeOut",
              yoyo: true,
              y: originalY - 5,
              loop: 6,
              onStart: () => {
                globalScene.playSound("battle_anims/PRSFX- Bug Bite");
                bait.setFrame("0002.png");
              },
              onLoop: () => {
                if (index % 2 === 0) {
                  globalScene.playSound("battle_anims/PRSFX- Bug Bite");
                }
                if (index === 4) {
                  bait.setFrame("0003.png");
                }
                index++;
              },
              onComplete: () => {
                globalScene.time.delayedCall(256, () => {
                  bait.destroy();
                  resolve(true);
                });
              },
            });
          });
        },
      });
    });
  });
}

async function throwMud(pokemon: EnemyPokemon): Promise<boolean> {
  const originalY: number = pokemon.y;

  const fpOffset = pokemon.getFieldPositionOffset();
  const mud: Phaser.GameObjects.Sprite = globalScene.addFieldSprite(16 + 75, 80 + 35, "safari_zone_mud", "0001.png");
  mud.setOrigin(0.5, 0.625);
  globalScene.field.add(mud);

  return new Promise(resolve => {
    globalScene.trainer.setTexture(
      `trainer_${globalScene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back_pb`,
    );
    globalScene.time.delayedCall(TRAINER_THROW_ANIMATION_TIMES[0], () => {
      globalScene.playSound("se/pb_throw");

      // Trainer throw frames
      globalScene.trainer.setFrame("2");
      globalScene.time.delayedCall(TRAINER_THROW_ANIMATION_TIMES[1], () => {
        globalScene.trainer.setFrame("3");
        globalScene.time.delayedCall(TRAINER_THROW_ANIMATION_TIMES[2], () => {
          globalScene.trainer.setTexture(
            `trainer_${globalScene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back`,
          );
        });
      });

      // Mud throw and splat
      globalScene.tweens.add({
        targets: mud,
        x: { value: 230 + fpOffset[0], ease: "Linear" },
        y: { value: 55 + fpOffset[1], ease: "Cubic.easeOut" },
        duration: 500,
        onComplete: () => {
          // Mud frame 2
          globalScene.playSound("battle_anims/PRSFX- Sludge Bomb2");
          mud.setFrame("0002.png");
          // Mud splat
          globalScene.time.delayedCall(200, () => {
            mud.setFrame("0003.png");
            globalScene.time.delayedCall(400, () => {
              mud.setFrame("0004.png");
            });
          });

          // Fade mud then angry animation
          globalScene.tweens.add({
            targets: mud,
            alpha: 0,
            ease: "Cubic.easeIn",
            duration: 1000,
            onComplete: () => {
              mud.destroy();
              globalScene.tweens.add({
                targets: pokemon,
                duration: 300,
                ease: "Cubic.easeOut",
                yoyo: true,
                y: originalY - 20,
                loop: 1,
                onStart: () => {
                  globalScene.playSound("battle_anims/PRSFX- Taunt2");
                },
                onLoop: () => {
                  globalScene.playSound("battle_anims/PRSFX- Taunt2");
                },
                onComplete: () => {
                  resolve(true);
                },
              });
            },
          });
        },
      });
    });
  });
}

function isPokemonFlee(pokemon: EnemyPokemon, fleeStage: number): boolean {
  const speciesCatchRate = pokemon.species.catchRate;
  const fleeModifier = (2 + Math.min(Math.max(fleeStage, 0), 6)) / (2 - Math.max(Math.min(fleeStage, 0), -6));
  const fleeRate = ((255 * 255 - speciesCatchRate * speciesCatchRate) / 255 / 2) * fleeModifier;
  console.log("Flee rate: " + fleeRate);
  const roll = randSeedInt(256);
  console.log("Roll: " + roll);
  return roll < fleeRate;
}

function tryChangeFleeStage(change: number, chance?: number): boolean {
  if (chance && randSeedInt(10) >= chance) {
    return false;
  }
  const currentFleeStage = globalScene.currentBattle.mysteryEncounter!.misc.fleeStage ?? 0;
  globalScene.currentBattle.mysteryEncounter!.misc.fleeStage = Math.min(Math.max(currentFleeStage + change, -6), 6);
  return true;
}

function tryChangeCatchStage(change: number, chance?: number): boolean {
  if (chance && randSeedInt(10) >= chance) {
    return false;
  }
  const currentCatchStage = globalScene.currentBattle.mysteryEncounter!.misc.catchStage ?? 0;
  globalScene.currentBattle.mysteryEncounter!.misc.catchStage = Math.min(Math.max(currentCatchStage + change, -6), 6);
  return true;
}

async function doEndTurn(cursorIndex: number) {
  // First cleanup and destroy old Pokemon objects that were left in the enemyParty
  // They are left in enemyParty temporarily so that VictoryPhase properly handles EXP
  const party = globalScene.getEnemyParty();
  if (party.length > 1) {
    for (let i = 1; i < party.length; i++) {
      party[i].destroy();
    }
    globalScene.currentBattle.enemyParty = party.slice(0, 1);
  }

  const encounter = globalScene.currentBattle.mysteryEncounter!;
  const pokemon = encounter.misc.pokemon;
  const isFlee = isPokemonFlee(pokemon, encounter.misc.fleeStage);
  if (isFlee) {
    // Pokemon flees!
    await doPokemonFlee(pokemon);
    // Check how many safari pokemon left
    if (encounter.misc.safariPokemonRemaining > 0) {
      await summonSafariPokemon();
      initSubsequentOptionSelect({
        overrideOptions: safariZoneGameOptions,
        startingCursorIndex: cursorIndex,
        hideDescription: true,
      });
    } else {
      // End safari mode
      encounter.continuousEncounter = false;
      leaveEncounterWithoutBattle(true);
    }
  } else {
    globalScene.phaseManager.queueMessage(getEncounterText(`${namespace}:safari.watching`) ?? "", 0, null, 1000);
    initSubsequentOptionSelect({
      overrideOptions: safariZoneGameOptions,
      startingCursorIndex: cursorIndex,
      hideDescription: true,
    });
  }
}

/**
 * @returns A random species that has at most 5 starter cost and is not Mythical, Paradox, etc.
 */
export function getSafariSpeciesSpawn(): PokemonSpecies {
  return getPokemonSpecies(
    getRandomSpeciesByStarterCost([0, 5], NON_LEGEND_PARADOX_POKEMON, undefined, false, false, false),
  );
}
