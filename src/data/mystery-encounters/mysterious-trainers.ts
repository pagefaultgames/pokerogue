import BattleScene from "../../battle-scene";
import { ModifierTier } from "../../modifier/modifier-tier";
import { modifierTypes } from "../../modifier/modifier-type";
import { generateNewEnemyParty, initBattleFromEncounter, leaveEncounter, setEncounterRewards, showTrainerDialogue } from "../../utils/mystery-encounter-utils";
import { TrainerType } from "../enums/trainer-type";
import MysteryEncounter, { EncounterRequirements, MysteryEncounterType, MysteryEncounterWrapper, OptionSelectMysteryEncounter } from "../mystery-encounter";

export class MysteriousTrainersEncounter implements MysteryEncounterWrapper {
  get(): MysteryEncounter {
    return new OptionSelectMysteryEncounter(MysteryEncounterType.MYSTERY_CHALLENGER)
      .requirements(new EncounterRequirements(50, 180)) // waves 50 to 180
      .option(async (scene: BattleScene) => {
        // Spawn easy fight (75% standard strength) with memory mushroom reward
        generateNewEnemyParty(scene, false, 0.75, TrainerType.SCHOOL_KID);
        return showTrainerDialogue(scene).then(() => {
          initBattleFromEncounter(scene);
          setEncounterRewards(scene, false, null, false, [modifierTypes.MEMORY_MUSHROOM]);
        });
      })
      .option(async (scene: BattleScene) => {
        // Spawn medium fight (standard strength) with an ULTRA reward (can improve with luck)
        generateNewEnemyParty(scene, false, 1, TrainerType.SCIENTIST);
        return showTrainerDialogue(scene).then(() => {
          initBattleFromEncounter(scene);
          setEncounterRewards(scene, true, [ModifierTier.ULTRA], true);
        });
      })
      .option(async (scene: BattleScene) => {
        // Spawn hard fight (150% standard strength) with a ROGUE reward (can improve with luck)
        generateNewEnemyParty(scene, false, 1.5, TrainerType.ACE_TRAINER);
        return showTrainerDialogue(scene).then(() => {
          initBattleFromEncounter(scene);
          setEncounterRewards(scene, true, [ModifierTier.ROGUE], true);
        });
      })
      .option(async (scene: BattleScene) => {
        // Leave encounter with no rewards or exp
        leaveEncounter(scene);
        return true;
      });
  }
}
