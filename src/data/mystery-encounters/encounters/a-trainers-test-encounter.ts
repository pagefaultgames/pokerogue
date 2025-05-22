import { globalScene } from "#app/global-scene";
import type { EnemyPartyConfig } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import {
  initBattleWithEnemyConfig,
  leaveEncounterWithoutBattle,
  setEncounterRewards,
  transitionMysteryEncounterIntroVisuals,
} from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { trainerConfigs } from "#app/data/trainers/trainer-config";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import type MysteryEncounter from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterBuilder } from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { TrainerType } from "#enums/trainer-type";
import { Species } from "#enums/species";
import { getSpriteKeysFromSpecies } from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";
import { randSeedInt } from "#app/utils/common";
import i18next from "i18next";
import type { IEggOptions } from "#app/data/egg";
import { EggSourceType } from "#enums/egg-source-types";
import { EggTier } from "#enums/egg-type";
import { PartyHealPhase } from "#app/phases/party-heal-phase";
import { ModifierTier } from "#app/modifier/modifier-tier";
import { modifierTypes } from "#app/modifier/modifier-type";
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/constants";

/** the i18n namespace for the encounter */
const namespace = "mysteryEncounters/aTrainersTest";

/**
 * A Trainer's Test encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3816 | GitHub Issue #3816}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const ATrainersTestEncounter: MysteryEncounter = MysteryEncounterBuilder.withEncounterType(
  MysteryEncounterType.A_TRAINERS_TEST,
)
  .withEncounterTier(MysteryEncounterTier.ROGUE)
  .withSceneWaveRangeRequirement(100, CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES[1])
  .withIntroSpriteConfigs([]) // These are set in onInit()
  .withIntroDialogue([
    {
      text: `${namespace}:intro`,
    },
  ])
  .withAutoHideIntroVisuals(false)
  .withOnInit(() => {
    const encounter = globalScene.currentBattle.mysteryEncounter!;

    // Randomly pick from 1 of the 5 stat trainers to spawn
    let trainerType: TrainerType;
    let spriteKeys: { spriteKey: any; fileRoot: any };
    let trainerNameKey: string;
    switch (randSeedInt(5)) {
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
      default:
        trainerType = TrainerType.BUCK;
        spriteKeys = getSpriteKeysFromSpecies(Species.CLAYDOL);
        trainerNameKey = "buck";
        break;
    }

    // Dialogue and tokens for trainer
    encounter.dialogue.intro = [
      {
        speaker: `trainerNames:${trainerNameKey}`,
        text: `${namespace}:${trainerNameKey}.intro_dialogue`,
      },
    ];
    encounter.options[0].dialogue!.selected = [
      {
        speaker: `trainerNames:${trainerNameKey}`,
        text: `${namespace}:${trainerNameKey}.accept`,
      },
    ];
    encounter.options[1].dialogue!.selected = [
      {
        speaker: `trainerNames:${trainerNameKey}`,
        text: `${namespace}:${trainerNameKey}.decline`,
      },
    ];

    encounter.setDialogueToken("statTrainerName", i18next.t(`trainerNames:${trainerNameKey}`));
    const eggDescription = `${i18next.t(`${namespace}:title`)}:\n${i18next.t(`trainerNames:${trainerNameKey}`)}`;
    encounter.misc = {
      trainerType,
      trainerNameKey,
      trainerEggDescription: eggDescription,
    };

    // Trainer config
    const trainerConfig = trainerConfigs[trainerType].clone();
    const trainerSpriteKey = trainerConfig.getSpriteKey();
    encounter.enemyPartyConfigs.push({
      levelAdditiveModifier: 1,
      trainerConfig: trainerConfig,
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
        yShadow: -2,
      },
      {
        spriteKey: trainerSpriteKey,
        fileRoot: "trainer",
        hasShadow: true,
        disableAnimation: true,
        x: -24,
        y: 4,
        yShadow: 4,
      },
    ];

    return true;
  })
  .setLocalizationKey(`${namespace}`)
  .withTitle(`${namespace}:title`)
  .withDescription(`${namespace}:description`)
  .withQuery(`${namespace}:query`)
  .withIntroDialogue()
  .withSimpleOption(
    {
      buttonLabel: `${namespace}:option.1.label`,
      buttonTooltip: `${namespace}:option.1.tooltip`,
    },
    async () => {
      const encounter = globalScene.currentBattle.mysteryEncounter!;
      // Battle the stat trainer for an Egg and great rewards
      const config: EnemyPartyConfig = encounter.enemyPartyConfigs[0];

      await transitionMysteryEncounterIntroVisuals();

      const eggOptions: IEggOptions = {
        pulled: false,
        sourceType: EggSourceType.EVENT,
        eggDescriptor: encounter.misc.trainerEggDescription,
        tier: EggTier.EPIC,
      };
      encounter.setDialogueToken("eggType", i18next.t(`${namespace}:eggTypes.epic`));
      setEncounterRewards(
        {
          guaranteedModifierTypeFuncs: [modifierTypes.SACRED_ASH],
          guaranteedModifierTiers: [ModifierTier.ROGUE, ModifierTier.ULTRA],
          fillRemaining: true,
        },
        [eggOptions],
      );
      await initBattleWithEnemyConfig(config);
    },
  )
  .withSimpleOption(
    {
      buttonLabel: `${namespace}:option.2.label`,
      buttonTooltip: `${namespace}:option.2.tooltip`,
    },
    async () => {
      const encounter = globalScene.currentBattle.mysteryEncounter!;
      // Full heal party
      globalScene.unshiftPhase(new PartyHealPhase(true));

      const eggOptions: IEggOptions = {
        pulled: false,
        sourceType: EggSourceType.EVENT,
        eggDescriptor: encounter.misc.trainerEggDescription,
        tier: EggTier.RARE,
      };
      encounter.setDialogueToken("eggType", i18next.t(`${namespace}:eggTypes.rare`));
      setEncounterRewards({ fillRemaining: false, rerollMultiplier: -1 }, [eggOptions]);
      leaveEncounterWithoutBattle();
    },
  )
  .withOutroDialogue([
    {
      text: `${namespace}:outro`,
    },
  ])
  .build();
