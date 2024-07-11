import {
  getHighestLevelPlayerPokemon,
  koPlayerPokemon,
  leaveEncounterWithoutBattle,
  queueEncounterMessage,
  setEncounterRewards,
  showEncounterText,
} from "#app/data/mystery-encounters/mystery-encounter-utils";
import { ModifierTier } from "#app/modifier/modifier-tier";
import { GameOverPhase } from "#app/phases";
import { randSeedInt } from "#app/utils";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "../../../battle-scene";
import MysteryEncounter, {
  MysteryEncounterBuilder,
  MysteryEncounterTier,
} from "../mystery-encounter";
import { MysteryEncounterOptionBuilder } from "../mystery-encounter-option";

export const MysteriousChestEncounter: MysteryEncounter =
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
        y: 8,
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
            queueEncounterMessage(
              scene,
              "mysteryEncounter:mysterious_chest_option_1_normal_result"
            );
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
            queueEncounterMessage(
              scene,
              "mysteryEncounter:mysterious_chest_option_1_good_result"
            );
            leaveEncounterWithoutBattle(scene);
          } else if (roll > 36) {
            // Choose between 2 ROGUE tier items (4%)
            setEncounterRewards(scene, {
              guaranteedModifierTiers: [ModifierTier.ROGUE, ModifierTier.ROGUE],
            });
            // Display result message then proceed to rewards
            queueEncounterMessage(
              scene,
              "mysteryEncounter:mysterious_chest_option_1_great_result"
            );
            leaveEncounterWithoutBattle(scene);
          } else if (roll > 35) {
            // Choose 1 MASTER tier item (1%)
            setEncounterRewards(scene, {
              guaranteedModifierTiers: [ModifierTier.MASTER],
            });
            // Display result message then proceed to rewards
            queueEncounterMessage(
              scene,
              "mysteryEncounter:mysterious_chest_option_1_amazing_result"
            );
            leaveEncounterWithoutBattle(scene);
          } else {
            // Your highest level unfainted Pok�mon gets OHKO. Progress with no rewards (35%)
            const highestLevelPokemon = getHighestLevelPlayerPokemon(
              scene,
              true
            );
            koPlayerPokemon(highestLevelPokemon);

            scene.currentBattle.mysteryEncounter.setDialogueToken(
              "pokeName",
              highestLevelPokemon.name
            );
            // Show which Pokemon was KOed, then leave encounter with no rewards
            // Does this synchronously so that game over doesn't happen over result message
            await showEncounterText(
              scene,
              "mysteryEncounter:mysterious_chest_option_1_bad_result"
            ).then(() => {
              if (
                scene.getParty().filter((p) => p.isAllowedInBattle()).length ===
                0
              ) {
                // All pokemon fainted, game over
                scene.clearPhaseQueue();
                scene.unshiftPhase(new GameOverPhase(scene));
              } else {
                leaveEncounterWithoutBattle(scene);
              }
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
