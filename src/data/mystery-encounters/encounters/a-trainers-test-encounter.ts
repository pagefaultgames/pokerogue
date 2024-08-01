import { EnemyPartyConfig, initBattleWithEnemyConfig, leaveEncounterWithoutBattle, setEncounterRewards, transitionMysteryEncounterIntroVisuals, } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { trainerConfigs, } from "#app/data/trainer-config";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "#app/battle-scene";
import IMysteryEncounter, { MysteryEncounterBuilder } from "../mystery-encounter";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { TrainerType } from "#enums/trainer-type";
import { Species } from "#enums/species";
import { getSpriteKeysFromSpecies } from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";
import { randSeedInt } from "#app/utils";
import i18next from "i18next";
import { PartyHealPhase } from "#app/phases";
import { IEggOptions } from "#app/data/egg";
import { EggSourceType } from "#enums/egg-source-types";
import { EggTier } from "#enums/egg-type";

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
        text: `${namespace}.intro`,
      },
    ])
    .withAutoHideIntroVisuals(false)
    .withOnInit((scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter;

      // Randomly pick from 1 of the 5 stat trainers to spawn
      let trainerType: TrainerType;
      let spriteKeys;
      let trainerNameKey: string;
      switch (randSeedInt(5)) {
      default:
      case 0:
        trainerType = TrainerType.BUCK;
        spriteKeys = getSpriteKeysFromSpecies(Species.CLAYDOL);
        trainerNameKey = "buck";
        break;
      case 1:
        trainerType = TrainerType.CHERYL;
        spriteKeys = getSpriteKeysFromSpecies(Species.BLISSEY);
        trainerNameKey = "cheryl";
        break;
      case 2:
        trainerType = TrainerType.MARLEY;
        spriteKeys = getSpriteKeysFromSpecies(Species.ARCANINE);
        trainerNameKey = "marley";
        break;
      case 3:
        trainerType = TrainerType.MIRA;
        spriteKeys = getSpriteKeysFromSpecies(Species.ALAKAZAM, false, 1);
        trainerNameKey = "mira";
        break;
      case 4:
        trainerType = TrainerType.RILEY;
        spriteKeys = getSpriteKeysFromSpecies(Species.LUCARIO, false, 1);
        trainerNameKey = "riley";
        break;
      }

      // Dialogue and tokens for trainer
      encounter.dialogue.intro = [
        {
          speaker: `trainerNames:${trainerNameKey}`,
          text: `${namespace}.${trainerNameKey}.intro_dialogue`
        }
      ];
      encounter.options[0].dialogue.selected = [
        {
          speaker: `trainerNames:${trainerNameKey}`,
          text: `${namespace}.${trainerNameKey}.accept`
        }
      ];
      encounter.options[1].dialogue.selected = [
        {
          speaker: `trainerNames:${trainerNameKey}`,
          text: `${namespace}.${trainerNameKey}.decline`
        }
      ];

      encounter.setDialogueToken("statTrainerName", i18next.t(`trainerNames:${trainerNameKey}`));
      const eggDescription = i18next.t(`${namespace}.title`) + ":\n" + i18next.t(`trainerNames:${trainerNameKey}`);
      encounter.misc = { trainerType, trainerNameKey, trainerEggDescription: eggDescription };

      // Trainer config
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
          isPokemon: true,
          x: 22,
          y: -2,
          yShadow: -2
        },
        {
          spriteKey: trainerSpriteKey,
          fileRoot: "trainer",
          hasShadow: true,
          disableAnimation: true,
          x: -24,
          y: 4,
          yShadow: 4
        }
      ];

      return true;
    })
    .withTitle(`${namespace}.title`)
    .withDescription(`${namespace}.description`)
    .withQuery(`${namespace}.query`)
    .withIntroDialogue()
    .withSimpleOption(
      {
        buttonLabel: `${namespace}.option.1.label`,
        buttonTooltip: `${namespace}.option.1.tooltip`
      },
      async (scene: BattleScene) => {
        const encounter = scene.currentBattle.mysteryEncounter;
        // Spawn standard trainer battle with memory mushroom reward
        const config: EnemyPartyConfig = encounter.enemyPartyConfigs[0];

        let eggTier;
        if (randSeedInt(64) >= 54) {
          eggTier = EggTier.MASTER;
        } else {
          eggTier = EggTier.ULTRA;
        }

        await transitionMysteryEncounterIntroVisuals(scene);

        const eggOptions: IEggOptions = {
          scene,
          pulled: false,
          sourceType: EggSourceType.EVENT,
          eventEggTypeDescriptor: encounter.misc.trainerEggDescription,
          tier: eggTier
        };
        encounter.setDialogueToken("eggType", i18next.t(`${namespace}.eggTypes.${eggTier === EggTier.ULTRA ? "epic" : "legendary"}`));
        setEncounterRewards(scene, { fillRemaining: true }, [eggOptions]);

        return initBattleWithEnemyConfig(scene, config);
      }
    )
    .withSimpleOption(
      {
        buttonLabel: `${namespace}.option.2.label`,
        buttonTooltip: `${namespace}.option.2.tooltip`
      },
      async (scene: BattleScene) => {
        const encounter = scene.currentBattle.mysteryEncounter;
        // Full heal party
        scene.unshiftPhase(new PartyHealPhase(scene, true));

        const eggOptions: IEggOptions = {
          scene,
          pulled: false,
          sourceType: EggSourceType.EVENT,
          eventEggTypeDescriptor: encounter.misc.trainerEggDescription,
          tier: EggTier.GREAT
        };
        encounter.setDialogueToken("eggType", i18next.t(`${namespace}.eggTypes.rare`));
        setEncounterRewards(scene, { fillRemaining: false, rerollMultiplier: 0 }, [eggOptions]);
        leaveEncounterWithoutBattle(scene);
      }
    )
    .withOutroDialogue([
      {
        text: `${namespace}:outro`,
      },
    ])
    .build();
