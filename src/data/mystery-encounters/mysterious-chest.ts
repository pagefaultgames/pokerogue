import BattleScene from "../../battle-scene";
import { ModifierTier } from "#app/modifier/modifier-tier";
import {
  getHighestLevelPlayerPokemon,
  koPlayerPokemon,
  leaveEncounterWithoutBattle,
  queueEncounterMessage,
  setCustomEncounterRewards,
  showEncounterText
} from "#app/data/mystery-encounters/mystery-encounter-utils";
import MysteryEncounter, {MysteryEncounterBuilder, MysteryEncounterTier} from "../mystery-encounter";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import {WaveCountRequirement} from "../mystery-encounter-requirements";
import { MysteryEncounterOptionBuilder } from "../mystery-encounter-option";
import {GameOverPhase} from "#app/phases";
import {randSeedInt} from "#app/utils";

export const MysteriousChestEncounter: MysteryEncounter = new MysteryEncounterBuilder()
  .withEncounterType(MysteryEncounterType.MYSTERIOUS_CHEST)
  .withEncounterTier(MysteryEncounterTier.COMMON)
  .withIntroSpriteConfigs([
    {
      spriteKey: "chest_blue",
      fileRoot: "mystery-encounters",
      hasShadow: true,
      x: 4,
      y: 8,
      disableAnimation: true // Re-enabled after option select
    }
  ])
  .withHideIntroVisuals(false)
  .withSceneRequirement(new WaveCountRequirement([10, 180])) // waves 2 to 180
  .withOption(new MysteryEncounterOptionBuilder()
    .withPreOptionPhase(async (scene: BattleScene) => {
      // Play animation
      const introVisuals = scene.currentBattle.mysteryEncounter.introVisuals;
      introVisuals.spriteConfigs[0].disableAnimation = false;
      introVisuals.playAnim();
    })
    .withOptionPhase(async (scene: BattleScene) => {
      // Open the chest
      const roll = randSeedInt(100);
      if (roll > 60) {
        // Choose between 2 COMMON / 2 GREAT tier items (40%)
        setCustomEncounterRewards(scene, { guaranteedModifierTiers: [ModifierTier.COMMON, ModifierTier.COMMON, ModifierTier.GREAT, ModifierTier.GREAT]});
        // Display result message then proceed to rewards
        queueEncounterMessage(scene, "mysteryEncounter:mysterious_chest_option_1_normal_result");
        leaveEncounterWithoutBattle(scene);
      } else if (roll > 40) {
        // Choose between 3 ULTRA tier items (20%)
        setCustomEncounterRewards(scene, { guaranteedModifierTiers: [ModifierTier.ULTRA, ModifierTier.ULTRA, ModifierTier.ULTRA]});
        // Display result message then proceed to rewards
        queueEncounterMessage(scene, "mysteryEncounter:mysterious_chest_option_1_good_result");
        leaveEncounterWithoutBattle(scene);
      } else if (roll > 36) {
        // Choose between 2 ROGUE tier items (4%)
        setCustomEncounterRewards(scene, { guaranteedModifierTiers: [ModifierTier.ROGUE, ModifierTier.ROGUE]});
        // Display result message then proceed to rewards
        queueEncounterMessage(scene, "mysteryEncounter:mysterious_chest_option_1_great_result");
        leaveEncounterWithoutBattle(scene);
      } else if (roll > 35) {
        // Choose 1 MASTER tier item (1%)
        setCustomEncounterRewards(scene, { guaranteedModifierTiers: [ModifierTier.MASTER]});
        // Display result message then proceed to rewards
        queueEncounterMessage(scene, "mysteryEncounter:mysterious_chest_option_1_amazing_result");
        leaveEncounterWithoutBattle(scene);
      } else {
        // Your highest level unfainted Pok�mon gets OHKO. Progress with no rewards (35%)
        const highestLevelPokemon = getHighestLevelPlayerPokemon(scene, true);
        koPlayerPokemon(highestLevelPokemon);

        scene.currentBattle.mysteryEncounter.setDialogueToken("pokeName", highestLevelPokemon.name);
        // Show which Pokemon was KOed, then leave encounter with no rewards
        // Does this synchronously so that game over doesn't happen over result message
        await showEncounterText(scene, "mysteryEncounter:mysterious_chest_option_1_bad_result")
          .then(() => {
            if (scene.getParty().filter(p => p.isAllowedInBattle()).length === 0) {
              // All pokemon fainted, game over
              scene.clearPhaseQueue();
              scene.unshiftPhase(new GameOverPhase(scene));
            } else {
              leaveEncounterWithoutBattle(scene);
            }
          });
      }
    })
    .build())
  .withOption(new MysteryEncounterOptionBuilder()
    .withOptionPhase(async (scene: BattleScene) => {
      // Leave encounter with no rewards or exp
      leaveEncounterWithoutBattle(scene, true);
      return true;
    })
    .build())
  .build();
