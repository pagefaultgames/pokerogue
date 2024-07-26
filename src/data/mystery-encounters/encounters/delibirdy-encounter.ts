import { leaveEncounterWithoutBattle, selectPokemonForOption, updatePlayerMoney, } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import Pokemon, { PlayerPokemon } from "#app/field/pokemon";
import { modifierTypes } from "#app/modifier/modifier-type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { Species } from "#enums/species";
import BattleScene from "#app/battle-scene";
import IMysteryEncounter, { MysteryEncounterBuilder } from "../mystery-encounter";
import { MysteryEncounterOptionBuilder } from "../mystery-encounter-option";
import { HeldItemRequirement, MoneyRequirement } from "../mystery-encounter-requirements";
import { getEncounterText } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { BerryModifier, PokemonBaseStatModifier, PokemonBaseStatTotalModifier, PokemonHeldItemModifier, PokemonInstantReviveModifier, TerastallizeModifier } from "#app/modifier/modifier";
import { ModifierRewardPhase } from "#app/phases";
import { OptionSelectItem } from "#app/ui/abstact-option-select-ui-handler";

/** the i18n namespace for this encounter */
const namespace = "mysteryEncounter:delibirdy";

/** Berries only */
const OPTION_2_ALLOWED_MODIFIERS = [BerryModifier.name, PokemonInstantReviveModifier.name];

/** Disallowed items are berries, Reviver Seeds, and Vitamins (form change items and fusion items are not PokemonHeldItemModifiers) */
const OPTION_3_DISALLOWED_MODIFIERS = [
  BerryModifier.name,
  PokemonInstantReviveModifier.name,
  TerastallizeModifier.name,
  PokemonBaseStatModifier.name,
  PokemonBaseStatTotalModifier.name
];

/**
 * Delibird-y encounter.
 * @see {@link https://github.com/AsdarDevelops/PokeRogue-Events/issues/57 | GitHub Issue #57}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const DelibirdyEncounter: IMysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.DELIBIRDY)
    .withEncounterTier(MysteryEncounterTier.GREAT)
    .withSceneWaveRangeRequirement(10, 180)
    .withSceneRequirement(new MoneyRequirement(0, 2.75)) // Must have enough money for it to spawn at the very least
    .withIntroSpriteConfigs([
      {
        spriteKey: Species.DELIBIRD.toString(),
        fileRoot: "pokemon",
        hasShadow: true,
        repeat: true,
        startFrame: 38,
        scale: 0.94
      },
      {
        spriteKey: Species.DELIBIRD.toString(),
        fileRoot: "pokemon",
        hasShadow: true,
        repeat: true,
        scale: 1.06
      },
      {
        spriteKey: Species.DELIBIRD.toString(),
        fileRoot: "pokemon",
        hasShadow: true,
        repeat: true,
        startFrame: 65,
        x: 1,
        y: 5,
        yShadow: 5
      },
    ])
    .withIntroDialogue([
      {
        text: `${namespace}:intro`,
      }
    ])
    .withTitle(`${namespace}:title`)
    .withDescription(`${namespace}:description`)
    .withQuery(`${namespace}:query`)
    .withOutroDialogue([
      {
        text: `${namespace}:outro`,
      }
    ])
    .withOption(
      new MysteryEncounterOptionBuilder()
        .withOptionMode(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT)
        .withSceneMoneyRequirement(0, 2.75)
        .withDialogue({
          buttonLabel: `${namespace}:option:1:label`,
          buttonTooltip: `${namespace}:option:1:tooltip`,
          selected: [
            {
              text: `${namespace}:option:1:selected`,
            },
          ],
        })
        .withPreOptionPhase(async (scene: BattleScene): Promise<boolean> => {
          const encounter = scene.currentBattle.mysteryEncounter;
          updatePlayerMoney(scene, -(encounter.options[0].requirements[0] as MoneyRequirement).requiredMoney, true, false);
          return true;
        })
        .withOptionPhase(async (scene: BattleScene) => {
          // Give the player an Ability Charm
          scene.unshiftPhase(new ModifierRewardPhase(scene, modifierTypes.ABILITY_CHARM));
          leaveEncounterWithoutBattle(scene, true);
        })
        .build()
    )
    .withOption(
      new MysteryEncounterOptionBuilder()
        .withOptionMode(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT)
        .withPrimaryPokemonRequirement(new HeldItemRequirement(OPTION_2_ALLOWED_MODIFIERS))
        .withDialogue({
          buttonLabel: `${namespace}:option:2:label`,
          buttonTooltip: `${namespace}:option:2:tooltip`,
          secondOptionPrompt: `${namespace}:option:2:select_prompt`,
          selected: [
            {
              text: `${namespace}:option:2:selected`,
            },
          ],
        })
        .withPreOptionPhase(async (scene: BattleScene): Promise<boolean> => {
          const encounter = scene.currentBattle.mysteryEncounter;
          const onPokemonSelected = (pokemon: PlayerPokemon) => {
            // Get Pokemon held items and filter for valid ones
            const validItems = pokemon.getHeldItems().filter((it) => {
              return OPTION_2_ALLOWED_MODIFIERS.some(heldItem => it.constructor.name === heldItem);
            });

            return validItems.map((modifier: PokemonHeldItemModifier) => {
              const option: OptionSelectItem = {
                label: modifier.type.name,
                handler: () => {
                  // Pokemon and item selected
                  encounter.setDialogueToken("chosenItem", modifier.type.name);
                  encounter.misc = {
                    chosenPokemon: pokemon,
                    chosenModifier: modifier,
                  };
                  return true;
                },
              };
              return option;
            });
          };

          // Only Pokemon that can gain benefits are above 1/3rd HP with no status
          const selectableFilter = (pokemon: Pokemon) => {
            // If pokemon meets primary pokemon reqs, it can be selected
            const meetsReqs = encounter.options[1].pokemonMeetsPrimaryRequirements(scene, pokemon);
            if (!meetsReqs) {
              return getEncounterText(scene, `${namespace}:invalid_selection`);
            }

            return null;
          };

          return selectPokemonForOption(scene, onPokemonSelected, null, selectableFilter);
        })
        .withOptionPhase(async (scene: BattleScene) => {
          const encounter = scene.currentBattle.mysteryEncounter;
          const modifier = encounter.misc.chosenModifier;
          // Give the player a Candy Jar if they gave a Berry, and a Healing Charm for Reviver Seed
          if (modifier.type.name.includes("Berry")) {
            scene.unshiftPhase(new ModifierRewardPhase(scene, modifierTypes.CANDY_JAR));
          } else {
            scene.unshiftPhase(new ModifierRewardPhase(scene, modifierTypes.HEALING_CHARM));
          }

          // Remove the modifier if its stacks go to 0
          modifier.stackCount -= 1;
          if (modifier.stackCount === 0) {
            scene.removeModifier(modifier);
          }

          leaveEncounterWithoutBattle(scene, true);
        })
        .build()
    )
    .withOption(
      new MysteryEncounterOptionBuilder()
        .withOptionMode(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT)
        .withPrimaryPokemonRequirement(new HeldItemRequirement(OPTION_3_DISALLOWED_MODIFIERS, 1, true))
        .withDialogue({
          buttonLabel: `${namespace}:option:3:label`,
          buttonTooltip: `${namespace}:option:3:tooltip`,
          secondOptionPrompt: `${namespace}:option:3:select_prompt`,
          selected: [
            {
              text: `${namespace}:option:3:selected`,
            },
          ],
        })
        .withPreOptionPhase(async (scene: BattleScene): Promise<boolean> => {
          const encounter = scene.currentBattle.mysteryEncounter;
          const onPokemonSelected = (pokemon: PlayerPokemon) => {
            // Get Pokemon held items and filter for valid ones
            const validItems = pokemon.getHeldItems().filter((it) => {
              return !OPTION_3_DISALLOWED_MODIFIERS.some(heldItem => it.constructor.name === heldItem);
            });

            return validItems.map((modifier: PokemonHeldItemModifier) => {
              const option: OptionSelectItem = {
                label: modifier.type.name,
                handler: () => {
                  // Pokemon and item selected
                  encounter.setDialogueToken("chosenItem", modifier.type.name);
                  encounter.misc = {
                    chosenPokemon: pokemon,
                    chosenModifier: modifier,
                  };
                  return true;
                },
              };
              return option;
            });
          };

          // Only Pokemon that can gain benefits are above 1/3rd HP with no status
          const selectableFilter = (pokemon: Pokemon) => {
            // If pokemon meets primary pokemon reqs, it can be selected
            const meetsReqs = encounter.options[2].pokemonMeetsPrimaryRequirements(scene, pokemon);
            if (!meetsReqs) {
              return getEncounterText(scene, `${namespace}:invalid_selection`);
            }

            return null;
          };

          return selectPokemonForOption(scene, onPokemonSelected, null, selectableFilter);
        })
        .withOptionPhase(async (scene: BattleScene) => {
          const encounter = scene.currentBattle.mysteryEncounter;
          const modifier = encounter.misc.chosenModifier;
          // Give the player a Berry Pouch
          scene.unshiftPhase(new ModifierRewardPhase(scene, modifierTypes.BERRY_POUCH));

          // Remove the modifier if its stacks go to 0
          modifier.stackCount -= 1;
          if (modifier.stackCount === 0) {
            scene.removeModifier(modifier);
          }

          leaveEncounterWithoutBattle(scene, true);
        })
        .build()
    )
    .build();
