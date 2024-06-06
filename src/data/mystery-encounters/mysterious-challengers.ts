import BattleScene from "../../battle-scene";
import { ModifierTier } from "../../modifier/modifier-tier";
import { modifierTypes } from "../../modifier/modifier-type";
import { EnemyPartyConfig, generateEnemyPartyForBattle, initBattleFromEncounter, leaveEncounterWithoutBattle, setEncounterRewards, showTrainerDialogue } from "../../utils/mystery-encounter-utils";
import { MysteryEncounterType } from "../enums/mystery-encounter-type";
import { TrainerType } from "../enums/trainer-type";
import MysteryEncounter, { MysteryEncounterBuilder } from "../mystery-encounter";
import { MysteryEncounterOptionBuilder } from "../mystery-encounter-option";
import { MysteryEncounterRequirements } from "../mystery-encounter-requirements";

export const MysteriousChallengersEncounter: MysteryEncounter = new MysteryEncounterBuilder()
  .withEncounterType(MysteryEncounterType.MYSTERIOUS_CHALLENGERS)
  .withIntroSpriteConfigs([
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
  .withRequirements(new MysteryEncounterRequirements(50, 180)) // waves 50 to 180
  .withOption(new MysteryEncounterOptionBuilder()
    .withOptionPhase(async (scene: BattleScene) => {
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
    .build())
  .withOption(new MysteryEncounterOptionBuilder()
    .withOptionPhase(async (scene: BattleScene) => {
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
    .build())
  .withOption(new MysteryEncounterOptionBuilder()
    .withOptionPhase(async (scene: BattleScene) => {
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
    .build())
  .withOption(new MysteryEncounterOptionBuilder()
    .withOptionPhase(async (scene: BattleScene) => {
      // Leave encounter with no rewards or exp
      leaveEncounterWithoutBattle(scene);
      return true;
    })
    .build())
  .build();
