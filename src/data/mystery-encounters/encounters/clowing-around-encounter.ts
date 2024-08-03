import {
  EnemyPartyConfig,
  initBattleWithEnemyConfig,
  setEncounterRewards,
} from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import {
  trainerConfigs,
  TrainerPartyCompoundTemplate,
  TrainerPartyTemplate,
} from "#app/data/trainer-config";
import { ModifierTier } from "#app/modifier/modifier-tier";
import { modifierTypes } from "#app/modifier/modifier-type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { PartyMemberStrength } from "#enums/party-member-strength";
import BattleScene from "#app/battle-scene";
import IMysteryEncounter, { MysteryEncounterBuilder } from "../mystery-encounter";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { Species } from "#enums/species";
import { TrainerType } from "#enums/trainer-type";
import { getPokemonSpecies } from "#app/data/pokemon-species";

/** the i18n namespace for the encounter */
const namespace = "mysteryEncounter:clowningAround";

/**
 * Clowning Around encounter.
 * @see {@link https://github.com/AsdarDevelops/PokeRogue-Events/issues/69 | GitHub Issue #69}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const ClowningAroundEncounter: IMysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.CLOWNING_AROUND)
    .withEncounterTier(MysteryEncounterTier.ULTRA)
    .withSceneWaveRangeRequirement(10, 180) // waves 10 to 180
    .withIntroSpriteConfigs([
      {
        spriteKey: Species.MR_MIME.toString(),
        fileRoot: "pokemon",
        hasShadow: true,
        repeat: true,
        x: -25,
        tint: 0.3,
        y: -3,
        yShadow: -3
      },
      {
        spriteKey: Species.BLACEPHALON.toString(),
        fileRoot: "pokemon/exp",
        hasShadow: true,
        repeat: true,
        x: 25,
        tint: 0.3,
        y: -3,
        yShadow: -3
      },
      {
        spriteKey: "harlequin",
        fileRoot: "trainer",
        hasShadow: true,
        x: 0
      },
    ])
    .withIntroDialogue([
      {
        text: `${namespace}.intro`,
      },
      {
        text: `${namespace}.intro_dialogue`,
        speaker: `${namespace}.speaker`
      },
    ])
    .withOnInit((scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter;

      // Clown trainer is pulled from pool of boss trainers (gym leaders) for the biome
      // They are given an E4 template team, so will be stronger than usual boss encounter and always have 6 mons
      const clownTrainerType = TrainerType.HARLEQUIN;
      const clownPartyTemplate = new TrainerPartyCompoundTemplate(
        new TrainerPartyTemplate(1, PartyMemberStrength.STRONG),
        new TrainerPartyTemplate(1, PartyMemberStrength.STRONGER),
        new TrainerPartyTemplate(1, PartyMemberStrength.STRONG));
      const clownConfig = trainerConfigs[clownTrainerType].copy();
      clownConfig.setPartyTemplates(clownPartyTemplate);
      clownConfig.partyTemplateFunc = null; // Overrides party template func

      encounter.enemyPartyConfigs.push({
        trainerConfig: clownConfig,
        pokemonConfigs: [ // Overrides first 2 pokemon to be Mr. Mime and Blacephalon
          {
            species: getPokemonSpecies(Species.MR_MIME),
            isBoss: false
          },
          {
            species: getPokemonSpecies(Species.BLACEPHALON),
            isBoss: true
          },
        ]
      });

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
        const encounter = scene.currentBattle.mysteryEncounter;
        // Spawn battle
        const config: EnemyPartyConfig = encounter.enemyPartyConfigs[0];

        setEncounterRewards(scene, { guaranteedModifierTypeFuncs: [modifierTypes.TM_COMMON, modifierTypes.TM_GREAT, modifierTypes.MEMORY_MUSHROOM], fillRemaining: true });
        await initBattleWithEnemyConfig(scene, config);
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
        buttonLabel: `${namespace}.option.3.label`,
        buttonTooltip: `${namespace}.option.3.tooltip`,
        selected: [
          {
            text: `${namespace}.option.selected`,
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
        text: `${namespace}.outro`,
      },
    ])
    .build();
