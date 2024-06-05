import BattleScene from "../../battle-scene";
import { ModifierTier } from "../../modifier/modifier-tier";
import { modifierTypes } from "../../modifier/modifier-type";
import { EnemyPartyConfig, generateEnemyPartyForBattle, initBattleFromEncounter, leaveEncounterWithoutBattle, setEncounterRewards, showTrainerDialogue } from "../../utils/mystery-encounter-utils";
import { MysteryEncounterType } from "../enums/mystery-encounter-type";
import { TrainerType } from "../enums/trainer-type";
import MysteryEncounter, { MysteryEncounterFactory, OptionSelectMysteryEncounter } from "../mystery-encounter";
import { MysteryEncounterRequirements } from "../mystery-encounter-requirements";

export class MysteriousChallengersEncounter implements MysteryEncounterFactory {
  getEncounter(): MysteryEncounter<OptionSelectMysteryEncounter> {
    return new OptionSelectMysteryEncounter(MysteryEncounterType.MYSTERIOUS_CHALLENGERS)
      .introVisualsConfig([
        {
          spriteKey: "school_kid_f",
          fileRoot: "trainer",
          hasShadow: true
        },
        {
          spriteKey: "scientist_f",
          fileRoot: "trainer",
          hasShadow: true
        },
        {
          spriteKey: "ace_trainer_f",
          fileRoot: "trainer",
          hasShadow: true
        }
      ])
      .requirements(new MysteryEncounterRequirements(50, 180)) // waves 50 to 180
      .option(async (scene: BattleScene) => {
        // Spawn easy fight (75% standard strength) with memory mushroom reward
        const config: EnemyPartyConfig = {
          levelMultiplier: 0.75,
          trainerType: TrainerType.SCHOOL_KID
        };
        generateEnemyPartyForBattle(scene, config);
        return showTrainerDialogue(scene).then(() => {
          initBattleFromEncounter(scene);
          setEncounterRewards(scene, false, null, false, [modifierTypes.MEMORY_MUSHROOM]);
        });
      })
      .option(async (scene: BattleScene) => {
        // Spawn medium fight (standard strength) with an ULTRA reward (can improve with luck)
        const config: EnemyPartyConfig = {
          levelMultiplier: 1,
          trainerType: TrainerType.SCIENTIST
        };
        generateEnemyPartyForBattle(scene, config);
        return showTrainerDialogue(scene).then(() => {
          initBattleFromEncounter(scene);
          setEncounterRewards(scene, true, [ModifierTier.ULTRA], true);
        });
      })
      .option(async (scene: BattleScene) => {
        // Spawn hard fight (150% standard strength) with a ROGUE reward (can improve with luck)
        const config: EnemyPartyConfig = {
          levelMultiplier: 1.5,
          trainerType: TrainerType.ACE_TRAINER
        };
        generateEnemyPartyForBattle(scene, config);
        return showTrainerDialogue(scene).then(() => {
          initBattleFromEncounter(scene);
          setEncounterRewards(scene, true, [ModifierTier.ROGUE], true);
        });
      })
      .option(async (scene: BattleScene) => {
        // Leave encounter with no rewards or exp
        leaveEncounterWithoutBattle(scene);
        return true;
      });
  }
}
