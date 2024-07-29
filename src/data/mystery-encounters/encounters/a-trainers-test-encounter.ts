import { EnemyPartyConfig, initBattleWithEnemyConfig, setEncounterRewards, } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { trainerConfigs, } from "#app/data/trainer-config";
import { ModifierTier } from "#app/modifier/modifier-tier";
import { modifierTypes } from "#app/modifier/modifier-type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "#app/battle-scene";
import IMysteryEncounter, { MysteryEncounterBuilder } from "../mystery-encounter";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { TrainerType } from "#enums/trainer-type";
import { Species } from "#enums/species";
import { getSpriteKeysFromSpecies } from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";
import { randSeedInt } from "#app/utils";

/** the i18n namespace for the encounter */
const namespace = "mysteryEncounter:aTrainersTest";

/**
 * A Trainer's Test encounter.
 * @see {@link https://github.com/AsdarDevelops/PokeRogue-Events/issues/115 | GitHub Issue #115}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const ATrainersTestEncounter: IMysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.A_TRAINERS_TEST)
    .withEncounterTier(MysteryEncounterTier.ROGUE)
    .withSceneWaveRangeRequirement(10, 180) // waves 10 to 180
    .withIntroSpriteConfigs([]) // These are set in onInit()
    .withIntroDialogue([
      {
        text: `${namespace}:intro`,
      },
    ])
    .withOnInit((scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter;

      // Randomly pick from 1 of the 5 stat trainers to spawn
      let trainerType: TrainerType;
      let spriteKeys;
      switch (randSeedInt(5)) {
      default:
      case 0:
        trainerType = TrainerType.BUCK;
        spriteKeys = getSpriteKeysFromSpecies(Species.CLAYDOL);
        break;
      case 1:
        trainerType = TrainerType.CHERYL;
        spriteKeys = getSpriteKeysFromSpecies(Species.BLISSEY);
        break;
      case 2:
        trainerType = TrainerType.MARLEY;
        spriteKeys = getSpriteKeysFromSpecies(Species.ARCANINE);
        break;
      case 3:
        trainerType = TrainerType.MIRA;
        spriteKeys = getSpriteKeysFromSpecies(Species.ALAKAZAM, false, 1);
        break;
      case 4:
        trainerType = TrainerType.RILEY;
        spriteKeys = getSpriteKeysFromSpecies(Species.LUCARIO, false, 1);
        break;
      }

      encounter.misc = { trainerType };
      const trainerConfig = trainerConfigs[trainerType].copy();
      const trainerSpriteKey = trainerConfig.getSpriteKey();
      encounter.enemyPartyConfigs.push({
        levelAdditiveMultiplier: 1,
        trainerConfig: trainerConfig
      });

      encounter.spriteConfigs = [
        {
          spriteKey: spriteKeys.spriteKey,
          fileRoot: spriteKeys.fileRoot,
          hasShadow: true,
          repeat: true,
          isPokemon: true
        },
        {
          spriteKey: trainerSpriteKey,
          fileRoot: "trainer",
          hasShadow: true,
          disableAnimation: true
        }
      ];

      return true;
    })
    .withTitle(`${namespace}:title`)
    .withDescription(`${namespace}:description`)
    .withQuery(`${namespace}:query`)
    .withSimpleOption(
      {
        buttonLabel: `${namespace}:option:1:label`,
        buttonTooltip: `${namespace}:option:1:tooltip`,
        selected: [
          {
            text: `${namespace}:option:selected`,
          },
        ],
      },
      async (scene: BattleScene) => {
        const encounter = scene.currentBattle.mysteryEncounter;
        // Spawn standard trainer battle with memory mushroom reward
        const config: EnemyPartyConfig = encounter.enemyPartyConfigs[0];

        setEncounterRewards(scene, { guaranteedModifierTypeFuncs: [modifierTypes.TM_COMMON, modifierTypes.TM_GREAT, modifierTypes.MEMORY_MUSHROOM], fillRemaining: true });
        return initBattleWithEnemyConfig(scene, config);
      }
    )
    .withSimpleOption(
      {
        buttonLabel: `${namespace}:option:2:label`,
        buttonTooltip: `${namespace}:option:2:tooltip`,
        selected: [
          {
            text: `${namespace}:option:selected`,
          },
        ],
      },
      async (scene: BattleScene) => {
        const encounter = scene.currentBattle.mysteryEncounter;
        // Spawn hard fight with ULTRA/GREAT reward (can improve with luck)
        const config: EnemyPartyConfig = encounter.enemyPartyConfigs[1];

        setEncounterRewards(scene, { guaranteedModifierTiers: [ModifierTier.ULTRA, ModifierTier.ULTRA, ModifierTier.GREAT, ModifierTier.GREAT], fillRemaining: true });

        // Seed offsets to remove possibility of different trainers having exact same teams
        let ret;
        scene.executeWithSeedOffset(() => {
          ret = initBattleWithEnemyConfig(scene, config);
        }, scene.currentBattle.waveIndex * 100);
        return ret;
      }
    )
    .withSimpleOption(
      {
        buttonLabel: `${namespace}:option:3:label`,
        buttonTooltip: `${namespace}:option:3:tooltip`,
        selected: [
          {
            text: `${namespace}:option:selected`,
          },
        ],
      },
      async (scene: BattleScene) => {
        const encounter = scene.currentBattle.mysteryEncounter;
        // Spawn brutal fight with ROGUE/ULTRA/GREAT reward (can improve with luck)
        const config: EnemyPartyConfig = encounter.enemyPartyConfigs[2];

        // To avoid player level snowballing from picking this option
        encounter.expMultiplier = 0.9;

        setEncounterRewards(scene, { guaranteedModifierTiers: [ModifierTier.ROGUE, ModifierTier.ROGUE, ModifierTier.ULTRA, ModifierTier.GREAT], fillRemaining: true });

        // Seed offsets to remove possibility of different trainers having exact same teams
        let ret;
        scene.executeWithSeedOffset(() => {
          ret = initBattleWithEnemyConfig(scene, config);
        }, scene.currentBattle.waveIndex * 1000);
        return ret;
      }
    )
    .withOutroDialogue([
      {
        text: `${namespace}:outro`,
      },
    ])
    .build();
