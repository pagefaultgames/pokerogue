import {
  leaveEncounterWithoutBattle, setEncounterExp,
  setEncounterRewards,
} from "#app/data/mystery-encounters/mystery-encounter-utils";
import { modifierTypes } from "#app/modifier/modifier-type";
import { randSeedInt } from "#app/utils";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { Species } from "#enums/species";
import BattleScene from "../../../battle-scene";
import MysteryEncounter, { MysteryEncounterBuilder, MysteryEncounterTier } from "../mystery-encounter";

export const DepartmentStoreSaleEncounter: MysteryEncounter = MysteryEncounterBuilder
  .withEncounterType(MysteryEncounterType.DEPARTMENT_STORE_SALE)
  .withEncounterTier(MysteryEncounterTier.COMMON)
  .withIntroSpriteConfigs([
    {
      spriteKey: "b2w2_lady",
      fileRoot: "mystery-encounters",
      hasShadow: true,
      x: -20
    },
    {
      spriteKey: Species.FURFROU.toString(),
      fileRoot: "pokemon",
      hasShadow: true,
      repeat: true,
      x: 30
    }
  ])
  // .withHideIntroVisuals(false)
  .withSceneWaveRangeRequirement(10, 100)
  .withOptionPhase(async (scene: BattleScene) => {
    // Choose TMs
    const modifiers = [];
    let i = 0;
    while (i < 4) {
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

    setEncounterExp(scene, scene.getParty().map(p => p.id), 300);
    setEncounterRewards(scene, { guaranteedModifierTypeFuncs: modifiers, fillRemaining: false });
    leaveEncounterWithoutBattle(scene);
  })
  .withOptionPhase(async (scene: BattleScene) => {
    // Choose Vitamins
    const modifiers = [];
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

    setEncounterRewards(scene, { guaranteedModifierTypeFuncs: modifiers, fillRemaining: false });
    leaveEncounterWithoutBattle(scene);
  })
  .withOptionPhase(async (scene: BattleScene) => {
    // Choose X Items
    const modifiers = [];
    let i = 0;
    while (i < 5) {
      // 4/1 weight on base stat booster vs Dire Hit
      const roll = randSeedInt(5);
      if (roll === 0) {
        modifiers.push(modifierTypes.DIRE_HIT);
      } else {
        modifiers.push(modifierTypes.TEMP_STAT_BOOSTER);
      }
      i++;
    }

    setEncounterRewards(scene, { guaranteedModifierTypeFuncs: modifiers, fillRemaining: false });
    leaveEncounterWithoutBattle(scene);
  })
  .withOptionPhase(async (scene: BattleScene) => {
    // Choose Pokeballs
    const modifiers = [];
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

    setEncounterRewards(scene, { guaranteedModifierTypeFuncs: modifiers, fillRemaining: false });
    leaveEncounterWithoutBattle(scene);
  })
  .build();
