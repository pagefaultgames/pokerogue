import {
  EnemyPartyConfig,
  initBattleWithEnemyConfig,
  setEncounterRewards,
} from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import {
  trainerConfigs,
  TrainerPartyCompoundTemplate,
  TrainerPartyTemplate,
  trainerPartyTemplates,
} from "#app/data/trainer-config";
import { ModifierTier } from "#app/modifier/modifier-tier";
import { modifierTypes } from "#app/modifier/modifier-type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { PartyMemberStrength } from "#enums/party-member-strength";
import BattleScene from "#app/battle-scene";
import * as Utils from "#app/utils";
import MysteryEncounter, { MysteryEncounterBuilder } from "../mystery-encounter";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/game-mode";

/** the i18n namespace for the encounter */
const namespace = "mysteryEncounter:mysteriousChallengers";

/**
 * Mysterious Challengers encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3801 | GitHub Issue #3801}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const MysteriousChallengersEncounter: MysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.MYSTERIOUS_CHALLENGERS)
    .withEncounterTier(MysteryEncounterTier.GREAT)
    .withSceneWaveRangeRequirement(...CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES)
    .withIntroSpriteConfigs([]) // These are set in onInit()
    .withIntroDialogue([
      {
        text: `${namespace}.intro`,
      },
    ])
    .withOnInit((scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter!;
      // Calculates what trainers are available for battle in the encounter

      // Normal difficulty trainer is randomly pulled from biome
      const normalTrainerType = scene.arena.randomTrainerType(scene.currentBattle.waveIndex);
      const normalConfig = trainerConfigs[normalTrainerType].clone();
      let female = false;
      if (normalConfig.hasGenders) {
        female = !!Utils.randSeedInt(2);
      }
      const normalSpriteKey = normalConfig.getSpriteKey(female, normalConfig.doubleOnly);
      encounter.enemyPartyConfigs.push({
        trainerConfig: normalConfig,
        female: female,
      });

      // Hard difficulty trainer is another random trainer, but with AVERAGE_BALANCED config
      // Number of mons is based off wave: 1-20 is 2, 20-40 is 3, etc. capping at 6 after wave 100
      const hardTrainerType = scene.arena.randomTrainerType(scene.currentBattle.waveIndex);
      const hardTemplate = new TrainerPartyCompoundTemplate(
        new TrainerPartyTemplate(1, PartyMemberStrength.STRONGER, false, true),
        new TrainerPartyTemplate(
          Math.min(Math.ceil(scene.currentBattle.waveIndex / 20), 5),
          PartyMemberStrength.AVERAGE,
          false,
          true
        )
      );
      const hardConfig = trainerConfigs[hardTrainerType].clone();
      hardConfig.setPartyTemplates(hardTemplate);
      female = false;
      if (hardConfig.hasGenders) {
        female = !!Utils.randSeedInt(2);
      }
      const hardSpriteKey = hardConfig.getSpriteKey(female, hardConfig.doubleOnly);
      encounter.enemyPartyConfigs.push({
        trainerConfig: hardConfig,
        levelAdditiveMultiplier: 1,
        female: female,
      });

      // Brutal trainer is pulled from pool of boss trainers (gym leaders) for the biome
      // They are given an E4 template team, so will be stronger than usual boss encounter and always have 6 mons
      const brutalTrainerType = scene.arena.randomTrainerType(
        scene.currentBattle.waveIndex,
        true
      );
      const e4Template = trainerPartyTemplates.ELITE_FOUR;
      const brutalConfig = trainerConfigs[brutalTrainerType].clone();
      brutalConfig.title = trainerConfigs[brutalTrainerType].title;
      brutalConfig.setPartyTemplates(e4Template);
      // @ts-ignore
      brutalConfig.partyTemplateFunc = null; // Overrides gym leader party template func
      female = false;
      if (brutalConfig.hasGenders) {
        female = !!Utils.randSeedInt(2);
      }
      const brutalSpriteKey = brutalConfig.getSpriteKey(female, brutalConfig.doubleOnly);
      encounter.enemyPartyConfigs.push({
        trainerConfig: brutalConfig,
        levelAdditiveMultiplier: 1.5,
        female: female,
      });

      encounter.spriteConfigs = [
        {
          spriteKey: normalSpriteKey,
          fileRoot: "trainer",
          hasShadow: true,
          tint: 1,
        },
        {
          spriteKey: hardSpriteKey,
          fileRoot: "trainer",
          hasShadow: true,
          tint: 1,
        },
        {
          spriteKey: brutalSpriteKey,
          fileRoot: "trainer",
          hasShadow: true,
          tint: 1,
        },
      ];

      return true;
    })
    .withTitle(`${namespace}.title`)
    .withDescription(`${namespace}.description`)
    .withQuery(`${namespace}.query`)
    .withSimpleOption(
      {
        buttonLabel: `${namespace}.option.1.label`,
        buttonTooltip: `${namespace}.option.1.tooltip`,
        selected: [
          {
            text: `${namespace}.option.selected`,
          },
        ],
      },
      async (scene: BattleScene) => {
        const encounter = scene.currentBattle.mysteryEncounter!;
        // Spawn standard trainer battle with memory mushroom reward
        const config: EnemyPartyConfig = encounter.enemyPartyConfigs[0];

        setEncounterRewards(scene, { guaranteedModifierTypeFuncs: [modifierTypes.TM_COMMON, modifierTypes.TM_GREAT, modifierTypes.MEMORY_MUSHROOM], fillRemaining: true });

        // Seed offsets to remove possibility of different trainers having exact same teams
        let ret;
        scene.executeWithSeedOffset(() => {
          ret = initBattleWithEnemyConfig(scene, config);
        }, scene.currentBattle.waveIndex * 10);
        return ret;
      }
    )
    .withSimpleOption(
      {
        buttonLabel: `${namespace}.option.2.label`,
        buttonTooltip: `${namespace}.option.2.tooltip`,
        selected: [
          {
            text: `${namespace}.option.selected`,
          },
        ],
      },
      async (scene: BattleScene) => {
        const encounter = scene.currentBattle.mysteryEncounter!;
        // Spawn hard fight
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
        buttonLabel: `${namespace}.option.3.label`,
        buttonTooltip: `${namespace}.option.3.tooltip`,
        selected: [
          {
            text: `${namespace}.option.selected`,
          },
        ],
      },
      async (scene: BattleScene) => {
        const encounter = scene.currentBattle.mysteryEncounter!;
        // Spawn brutal fight
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
        text: `${namespace}.outro`,
      },
    ])
    .build();
