import { queueEncounterMessage, showEncounterText } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import {
  leaveEncounterWithoutBattle,
  setEncounterRewards
} from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { getHighestLevelPlayerPokemon, koPlayerPokemon } from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";
import { ModifierTier } from "#app/modifier/modifier-tier";
import { randSeedInt } from "#app/utils.js";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "../../../battle-scene";
import IMysteryEncounter, {
  MysteryEncounterBuilder,
  MysteryEncounterTier,
} from "../mystery-encounter";
import { EncounterOptionMode, MysteryEncounterOptionBuilder } from "../mystery-encounter-option";

export const MysteriousChestEncounter: IMysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(
    MysteryEncounterType.MYSTERIOUS_CHEST
  )
    .withEncounterTier(MysteryEncounterTier.COMMON)
    .withSceneWaveRangeRequirement(10, 180) // waves 2 to 180
    .withHideIntroVisuals(false)
    .withIntroSpriteConfigs([
      {
        spriteKey: "chest_blue",
        fileRoot: "mystery-encounters",
        hasShadow: true,
        x: 4,
        y: 10,
        yShadowOffset: 3,
        disableAnimation: true, // Re-enabled after option select
      },
    ])
    .withIntroDialogue([
      {
        text: "mysteryEncounter:mysterious_chest_intro_message",
      },
    ])
    .withTitle("mysteryEncounter:mysterious_chest_title")
    .withDescription("mysteryEncounter:mysterious_chest_description")
    .withQuery("mysteryEncounter:mysterious_chest_query")
    .withOption(
      new MysteryEncounterOptionBuilder()
        .withOptionMode(EncounterOptionMode.DEFAULT)
        .withDialogue({
          buttonLabel: "mysteryEncounter:mysterious_chest_option_1_label",
          buttonTooltip: "mysteryEncounter:mysterious_chest_option_1_tooltip",
          selected: [
            {
              text: "mysteryEncounter:mysterious_chest_option_1_selected_message",
            },
          ],
        })
        .withPreOptionPhase(async (scene: BattleScene) => {
          // Play animation
          const introVisuals =
            scene.currentBattle.mysteryEncounter.introVisuals;
          introVisuals.spriteConfigs[0].disableAnimation = false;
          introVisuals.playAnim();
        })
        .withOptionPhase(async (scene: BattleScene) => {
          // Open the chest
          const roll = randSeedInt(100);
          if (roll > 60) {
            // Choose between 2 COMMON / 2 GREAT tier items (40%)
            setEncounterRewards(scene, {
              guaranteedModifierTiers: [
                ModifierTier.COMMON,
                ModifierTier.COMMON,
                ModifierTier.GREAT,
                ModifierTier.GREAT,
              ],
            });
            // Display result message then proceed to rewards
            queueEncounterMessage(scene, "mysteryEncounter:mysterious_chest_option_1_normal_result");
            leaveEncounterWithoutBattle(scene);
          } else if (roll > 40) {
            // Choose between 3 ULTRA tier items (20%)
            setEncounterRewards(scene, {
              guaranteedModifierTiers: [
                ModifierTier.ULTRA,
                ModifierTier.ULTRA,
                ModifierTier.ULTRA,
              ],
            });
            // Display result message then proceed to rewards
            queueEncounterMessage(scene, "mysteryEncounter:mysterious_chest_option_1_good_result");
            leaveEncounterWithoutBattle(scene);
          } else if (roll > 36) {
            // Choose between 2 ROGUE tier items (4%)
            setEncounterRewards(scene, {
              guaranteedModifierTiers: [ModifierTier.ROGUE, ModifierTier.ROGUE],
            });
            // Display result message then proceed to rewards
            queueEncounterMessage(scene, "mysteryEncounter:mysterious_chest_option_1_great_result");
            leaveEncounterWithoutBattle(scene);
          } else if (roll > 35) {
            // Choose 1 MASTER tier item (1%)
            setEncounterRewards(scene, {
              guaranteedModifierTiers: [ModifierTier.MASTER],
            });
            // Display result message then proceed to rewards
            queueEncounterMessage(scene, "mysteryEncounter:mysterious_chest_option_1_amazing_result");
            leaveEncounterWithoutBattle(scene);
          } else {
            // Your highest level unfainted Pok�mon gets OHKO. Progress with no rewards (35%)
            const highestLevelPokemon = getHighestLevelPlayerPokemon(
              scene,
              true
            );
            koPlayerPokemon(highestLevelPokemon);

            scene.currentBattle.mysteryEncounter.setDialogueToken("pokeName", highestLevelPokemon.name);
            // Show which Pokemon was KOed, then leave encounter with no rewards
            // Does this synchronously so that game over doesn't happen over result message
            await showEncounterText(scene, "mysteryEncounter:mysterious_chest_option_1_bad_result").then(() => {
              leaveEncounterWithoutBattle(scene);
            });
          }
        })
        .build()
    )
    .withSimpleOption(
      {
        buttonLabel: "mysteryEncounter:mysterious_chest_option_2_label",
        buttonTooltip: "mysteryEncounter:mysterious_chest_option_2_tooltip",
        selected: [
          {
            text: "mysteryEncounter:mysterious_chest_option_2_selected_message",
          },
        ],
      },
      async (scene: BattleScene) => {
        // Leave encounter with no rewards or exp
        leaveEncounterWithoutBattle(scene, true);
        return true;
      }
    )
    .build();
