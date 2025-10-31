import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/constants";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { RewardId } from "#enums/reward-id";
import { SpeciesId } from "#enums/species-id";
import { leaveEncounterWithoutBattle, setEncounterRewards } from "#mystery-encounters/encounter-phase-utils";
import type { MysteryEncounter } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterBuilder } from "#mystery-encounters/mystery-encounter";
import type { RewardSpecs } from "#types/rewards";
import { randSeedInt } from "#utils/common";

/** i18n namespace for encounter */
const namespace = "mysteryEncounters/departmentStoreSale";

/**
 * Department Store Sale encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3797 | GitHub Issue #3797}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const DepartmentStoreSaleEncounter: MysteryEncounter = MysteryEncounterBuilder.withEncounterType(
  MysteryEncounterType.DEPARTMENT_STORE_SALE,
)
  .withEncounterTier(MysteryEncounterTier.COMMON)
  .withSceneWaveRangeRequirement(CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES[0], 100)
  .withIntroSpriteConfigs([
    {
      spriteKey: "department_store_sale_lady",
      fileRoot: "mystery-encounters",
      hasShadow: true,
      x: -20,
    },
    {
      spriteKey: "",
      fileRoot: "",
      species: SpeciesId.FURFROU,
      hasShadow: true,
      repeat: true,
      x: 30,
    },
  ])
  .withIntroDialogue([
    {
      text: `${namespace}:intro`,
    },
    {
      text: `${namespace}:introDialogue`,
      speaker: `${namespace}:speaker`,
    },
  ])
  .withAutoHideIntroVisuals(false)
  .setLocalizationKey(`${namespace}`)
  .withTitle(`${namespace}:title`)
  .withDescription(`${namespace}:description`)
  .withQuery(`${namespace}:query`)
  .withSimpleOption(
    {
      buttonLabel: `${namespace}:option.1.label`,
      buttonTooltip: `${namespace}:option.1.tooltip`,
    },
    async () => {
      // Choose TMs
      const rewards: RewardSpecs[] = [];
      let i = 0;
      while (i < 5) {
        // 2/2/1 weight on TM rarity
        const roll = randSeedInt(5);
        if (roll < 2) {
          rewards.push(RewardId.TM_COMMON);
        } else if (roll < 4) {
          rewards.push(RewardId.TM_GREAT);
        } else {
          rewards.push(RewardId.TM_ULTRA);
        }
        i++;
      }

      setEncounterRewards({
        guaranteedRewardSpecs: rewards,
        fillRemaining: false,
      });
      leaveEncounterWithoutBattle();
    },
  )
  .withSimpleOption(
    {
      buttonLabel: `${namespace}:option.2.label`,
      buttonTooltip: `${namespace}:option.2.tooltip`,
    },
    async () => {
      // Choose Vitamins
      const rewards: RewardSpecs[] = [];
      let i = 0;
      while (i < 3) {
        // 2/1 weight on base stat booster vs PP Up
        const roll = randSeedInt(3);
        if (roll === 0) {
          rewards.push(RewardId.PP_UP);
        } else {
          rewards.push(RewardId.VITAMIN);
        }
        i++;
      }

      setEncounterRewards({
        guaranteedRewardSpecs: rewards,
        fillRemaining: false,
      });
      leaveEncounterWithoutBattle();
    },
  )
  .withSimpleOption(
    {
      buttonLabel: `${namespace}:option.3.label`,
      buttonTooltip: `${namespace}:option.3.tooltip`,
    },
    async () => {
      // Choose X Items
      const rewards: RewardSpecs[] = [];
      let i = 0;
      while (i < 5) {
        // 4/1 weight on base stat booster vs Dire Hit
        const roll = randSeedInt(5);
        if (roll === 0) {
          rewards.push(RewardId.DIRE_HIT);
        } else {
          rewards.push(RewardId.TEMP_STAT_STAGE_BOOSTER);
        }
        i++;
      }

      setEncounterRewards({
        guaranteedRewardSpecs: rewards,
        fillRemaining: false,
      });
      leaveEncounterWithoutBattle();
    },
  )
  .withSimpleOption(
    {
      buttonLabel: `${namespace}:option.4.label`,
      buttonTooltip: `${namespace}:option.4.tooltip`,
    },
    async () => {
      // Choose Pokeballs
      const rewards: RewardSpecs[] = [];
      let i = 0;
      while (i < 4) {
        // 10/30/20/5 weight on pokeballs
        const roll = randSeedInt(65);
        if (roll < 10) {
          rewards.push(RewardId.POKEBALL);
        } else if (roll < 40) {
          rewards.push(RewardId.GREAT_BALL);
        } else if (roll < 60) {
          rewards.push(RewardId.ULTRA_BALL);
        } else {
          rewards.push(RewardId.ROGUE_BALL);
        }
        i++;
      }

      setEncounterRewards({
        guaranteedRewardSpecs: rewards,
        fillRemaining: false,
      });
      leaveEncounterWithoutBattle();
    },
  )
  .withOutroDialogue([
    {
      text: `${namespace}:outro`,
    },
  ])
  .build();
