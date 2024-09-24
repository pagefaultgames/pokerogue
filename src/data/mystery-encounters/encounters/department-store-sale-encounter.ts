import {
  leaveEncounterWithoutBattle,
  setEncounterRewards,
} from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { ModifierTypeFunc, modifierTypes } from "#app/modifier/modifier-type";
import { randSeedInt } from "#app/utils";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { Species } from "#enums/species";
import BattleScene from "#app/battle-scene";
import MysteryEncounter, {
  MysteryEncounterBuilder,
} from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/game-mode";

/** i18n namespace for encounter */
const namespace = "mysteryEncounter:departmentStoreSale";

/**
 * Department Store Sale encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3797 | GitHub Issue #3797}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const DepartmentStoreSaleEncounter: MysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.DEPARTMENT_STORE_SALE)
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
        species: Species.FURFROU,
        hasShadow: true,
        repeat: true,
        x: 30,
      },
    ])
    .withIntroDialogue([
      {
        text: `${namespace}.intro`,
      },
      {
        text: `${namespace}.intro_dialogue`,
        speaker: `${namespace}.speaker`,
      },
    ])
    .withAutoHideIntroVisuals(false)
    .withTitle(`${namespace}.title`)
    .withDescription(`${namespace}.description`)
    .withQuery(`${namespace}.query`)
    .withSimpleOption(
      {
        buttonLabel: `${namespace}.option.1.label`,
        buttonTooltip: `${namespace}.option.1.tooltip`,
      },
      async (scene: BattleScene) => {
        // Choose TMs
        const modifiers: ModifierTypeFunc[] = [];
        let i = 0;
        while (i < 6) {
          // 2/2/1 weight on TM rarity
          const roll = randSeedInt(5);
          if (roll < 2) {
            modifiers.push(modifierTypes.TM_COMMON);
          } else if (roll < 4) {
            modifiers.push(modifierTypes.TM_GREAT);
          } else {
            modifiers.push(modifierTypes.TM_ULTRA);
          }
          i++;
        }

        setEncounterRewards(scene, { guaranteedModifierTypeFuncs: modifiers, fillRemaining: false, });
        leaveEncounterWithoutBattle(scene);
      }
    )
    .withSimpleOption(
      {
        buttonLabel: `${namespace}.option.2.label`,
        buttonTooltip: `${namespace}.option.2.tooltip`,
      },
      async (scene: BattleScene) => {
        // Choose Vitamins
        const modifiers: ModifierTypeFunc[] = [];
        let i = 0;
        while (i < 3) {
          // 2/1 weight on base stat booster vs PP Up
          const roll = randSeedInt(3);
          if (roll === 0) {
            modifiers.push(modifierTypes.PP_UP);
          } else {
            modifiers.push(modifierTypes.BASE_STAT_BOOSTER);
          }
          i++;
        }

        setEncounterRewards(scene, { guaranteedModifierTypeFuncs: modifiers, fillRemaining: false, });
        leaveEncounterWithoutBattle(scene);
      }
    )
    .withSimpleOption(
      {
        buttonLabel: `${namespace}.option.3.label`,
        buttonTooltip: `${namespace}.option.3.tooltip`,
      },
      async (scene: BattleScene) => {
        // Choose X Items
        const modifiers: ModifierTypeFunc[] = [];
        let i = 0;
        while (i < 5) {
          // 4/1 weight on base stat booster vs Dire Hit
          const roll = randSeedInt(5);
          if (roll === 0) {
            modifiers.push(modifierTypes.DIRE_HIT);
          } else {
            modifiers.push(modifierTypes.TEMP_STAT_STAGE_BOOSTER);
          }
          i++;
        }

        setEncounterRewards(scene, { guaranteedModifierTypeFuncs: modifiers, fillRemaining: false, });
        leaveEncounterWithoutBattle(scene);
      }
    )
    .withSimpleOption(
      {
        buttonLabel: `${namespace}.option.4.label`,
        buttonTooltip: `${namespace}.option.4.tooltip`,
      },
      async (scene: BattleScene) => {
        // Choose Pokeballs
        const modifiers: ModifierTypeFunc[] = [];
        let i = 0;
        while (i < 4) {
          // 10/30/20/5 weight on pokeballs
          const roll = randSeedInt(65);
          if (roll < 10) {
            modifiers.push(modifierTypes.POKEBALL);
          } else if (roll < 40) {
            modifiers.push(modifierTypes.GREAT_BALL);
          } else if (roll < 60) {
            modifiers.push(modifierTypes.ULTRA_BALL);
          } else {
            modifiers.push(modifierTypes.ROGUE_BALL);
          }
          i++;
        }

        setEncounterRewards(scene, { guaranteedModifierTypeFuncs: modifiers, fillRemaining: false, });
        leaveEncounterWithoutBattle(scene);
      }
    )
    .withOutroDialogue([
      {
        text: `${namespace}.outro`,
      }
    ])
    .build();
