import { queueEncounterMessage, showEncounterText } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import { leaveEncounterWithoutBattle, setEncounterRewards } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { getHighestLevelPlayerPokemon, koPlayerPokemon } from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";
import { ModifierTier } from "#app/modifier/modifier-tier";
import { randSeedInt } from "#app/utils.js";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "#app/battle-scene";
import MysteryEncounter, { MysteryEncounterBuilder } from "../mystery-encounter";
import { MysteryEncounterOptionBuilder } from "../mystery-encounter-option";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";

/** i18n namespace for encounter */
const namespace = "mysteryEncounter:mysteriousChest";

/**
 * Mysterious Chest encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3796 | GitHub Issue #3796}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const MysteriousChestEncounter: MysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.MYSTERIOUS_CHEST)
    .withEncounterTier(MysteryEncounterTier.COMMON)
    .withSceneWaveRangeRequirement(10, 180) // waves 10 to 180
    .withAutoHideIntroVisuals(false)
    .withIntroSpriteConfigs([
      {
        spriteKey: "chest_blue",
        fileRoot: "mystery-encounters",
        hasShadow: true,
        y: 8,
        yShadow: 6,
        alpha: 1,
        disableAnimation: true, // Re-enabled after option select
      },
      {
        spriteKey: "chest_red",
        fileRoot: "mystery-encounters",
        hasShadow: false,
        y: 8,
        yShadow: 6,
        alpha: 0,
        disableAnimation: true, // Re-enabled after option select
      }
    ])
    .withIntroDialogue([
      {
        text: `${namespace}.intro`,
      }
    ])
    .withTitle(`${namespace}.title`)
    .withDescription(`${namespace}.description`)
    .withQuery(`${namespace}.query`)
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
        .withDialogue({
          buttonLabel: `${namespace}.option.1.label`,
          buttonTooltip: `${namespace}.option.1.tooltip`,
          selected: [
            {
              text: `${namespace}.option.1.selected`,
            },
          ],
        })
        .withPreOptionPhase(async (scene: BattleScene) => {
          // Play animation
          const encounter = scene.currentBattle.mysteryEncounter!;
          const introVisuals = encounter.introVisuals!;

          // Determine roll first
          const roll = randSeedInt(100);
          encounter.misc = {
            roll
          };

          if (roll <= 35) {
            // Chest is springing trap, change to red chest sprite
            const blueChestSprites = introVisuals.getSpriteAtIndex(0);
            const redChestSprites = introVisuals.getSpriteAtIndex(1);
            redChestSprites[0].setAlpha(1);
            blueChestSprites[0].setAlpha(0.001);
          }
          introVisuals.spriteConfigs[0].disableAnimation = false;
          introVisuals.spriteConfigs[1].disableAnimation = false;
          introVisuals.playAnim();
        })
        .withOptionPhase(async (scene: BattleScene) => {
          // Open the chest
          const encounter = scene.currentBattle.mysteryEncounter!;
          const roll = encounter.misc.roll;
          if (roll > 60) {
            // Choose between 2 COMMON / 2 GREAT tier items (30%)
            setEncounterRewards(scene, {
              guaranteedModifierTiers: [
                ModifierTier.COMMON,
                ModifierTier.COMMON,
                ModifierTier.GREAT,
                ModifierTier.GREAT,
              ],
            });
            // Display result message then proceed to rewards
            queueEncounterMessage(scene, `${namespace}.option.1.normal`);
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
            queueEncounterMessage(scene, `${namespace}.option.1.good`);
            leaveEncounterWithoutBattle(scene);
          } else if (roll > 36) {
            // Choose between 2 ROGUE tier items (10%)
            setEncounterRewards(scene, {
              guaranteedModifierTiers: [ModifierTier.ROGUE, ModifierTier.ROGUE],
            });
            // Display result message then proceed to rewards
            queueEncounterMessage(scene, `${namespace}.option.1.great`);
            leaveEncounterWithoutBattle(scene);
          } else if (roll > 35) {
            // Choose 1 MASTER tier item (5%)
            setEncounterRewards(scene, {
              guaranteedModifierTiers: [ModifierTier.MASTER],
            });
            // Display result message then proceed to rewards
            queueEncounterMessage(scene, `${namespace}.option.1.amazing`);
            leaveEncounterWithoutBattle(scene);
          } else {
            // Your highest level unfainted Pokemon gets OHKO. Progress with no rewards (35%)
            const highestLevelPokemon = getHighestLevelPlayerPokemon(
              scene,
              true
            );
            koPlayerPokemon(scene, highestLevelPokemon);

            encounter.setDialogueToken("pokeName", highestLevelPokemon.getNameToRender());
            // Show which Pokemon was KOed, then leave encounter with no rewards
            // Does this synchronously so that game over doesn't happen over result message
            await showEncounterText(scene, `${namespace}.option.1.bad`);
            leaveEncounterWithoutBattle(scene);
          }
        })
        .build()
    )
    .withSimpleOption(
      {
        buttonLabel: `${namespace}.option.2.label`,
        buttonTooltip: `${namespace}.option.2.tooltip`,
        selected: [
          {
            text: `${namespace}.option.2.selected`,
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
