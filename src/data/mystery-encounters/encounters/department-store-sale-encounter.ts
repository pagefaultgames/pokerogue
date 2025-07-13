import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/constants";
import { rewards } from "#data/data-lists";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { SpeciesId } from "#enums/species-id";
import { leaveEncounterWithoutBattle, setEncounterRewards } from "#mystery-encounters/encounter-phase-utils";
import type { MysteryEncounter } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterBuilder } from "#mystery-encounters/mystery-encounter";
import type { RewardFunc } from "#types/rewards";
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
      text: `${namespace}:intro_dialogue`,
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
      const modifiers: RewardFunc[] = [];
      let i = 0;
      while (i < 5) {
        // 2/2/1 weight on TM rarity
        const roll = randSeedInt(5);
        if (roll < 2) {
          modifiers.push(rewards.TM_COMMON);
        } else if (roll < 4) {
          modifiers.push(rewards.TM_GREAT);
        } else {
          modifiers.push(rewards.TM_ULTRA);
        }
        i++;
      }

      setEncounterRewards({
        guaranteedRewardFuncs: modifiers,
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
      const modifiers: RewardFunc[] = [];
      let i = 0;
      while (i < 3) {
        // 2/1 weight on base stat booster vs PP Up
        const roll = randSeedInt(3);
        if (roll === 0) {
          modifiers.push(rewards.PP_UP);
        } else {
          modifiers.push(rewards.BASE_STAT_BOOSTER);
        }
        i++;
      }

      setEncounterRewards({
        guaranteedRewardFuncs: modifiers,
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
      const modifiers: RewardFunc[] = [];
      let i = 0;
      while (i < 5) {
        // 4/1 weight on base stat booster vs Dire Hit
        const roll = randSeedInt(5);
        if (roll === 0) {
          modifiers.push(rewards.DIRE_HIT);
        } else {
          modifiers.push(rewards.TEMP_STAT_STAGE_BOOSTER);
        }
        i++;
      }

      setEncounterRewards({
        guaranteedRewardFuncs: modifiers,
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
      const modifiers: RewardFunc[] = [];
      let i = 0;
      while (i < 4) {
        // 10/30/20/5 weight on pokeballs
        const roll = randSeedInt(65);
        if (roll < 10) {
          modifiers.push(rewards.POKEBALL);
        } else if (roll < 40) {
          modifiers.push(rewards.GREAT_BALL);
        } else if (roll < 60) {
          modifiers.push(rewards.ULTRA_BALL);
        } else {
          modifiers.push(rewards.ROGUE_BALL);
        }
        i++;
      }

      setEncounterRewards({
        guaranteedRewardFuncs: modifiers,
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
