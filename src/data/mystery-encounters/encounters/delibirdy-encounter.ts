import { generateModifierType, leaveEncounterWithoutBattle, selectPokemonForOption, updatePlayerMoney, } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import Pokemon, { PlayerPokemon } from "#app/field/pokemon";
import { modifierTypes, PokemonHeldItemModifierType } from "#app/modifier/modifier-type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { Species } from "#enums/species";
import BattleScene from "#app/battle-scene";
import MysteryEncounter, { MysteryEncounterBuilder } from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import { CombinationPokemonRequirement, HeldItemRequirement, MoneyRequirement } from "#app/data/mystery-encounters/mystery-encounter-requirements";
import { getEncounterText, showEncounterText } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { BerryModifier, HealingBoosterModifier, LevelIncrementBoosterModifier, MoneyMultiplierModifier, PokemonHeldItemModifier, PreserveBerryModifier } from "#app/modifier/modifier";
import { OptionSelectItem } from "#app/ui/abstact-option-select-ui-handler";
import { applyModifierTypeToPlayerPokemon } from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";
import i18next from "#app/plugins/i18n";
import { ModifierRewardPhase } from "#app/phases/modifier-reward-phase";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/game-mode";

/** the i18n namespace for this encounter */
const namespace = "mysteryEncounters/delibirdy";

/** Berries only */
const OPTION_2_ALLOWED_MODIFIERS = [ "BerryModifier", "PokemonInstantReviveModifier" ];

/** Disallowed items are berries, Reviver Seeds, and Vitamins (form change items and fusion items are not PokemonHeldItemModifiers) */
const OPTION_3_DISALLOWED_MODIFIERS = [
  "BerryModifier",
  "PokemonInstantReviveModifier",
  "TerastallizeModifier",
  "PokemonBaseStatModifier",
  "PokemonBaseStatTotalModifier"
];

const DELIBIRDY_MONEY_PRICE_MULTIPLIER = 2;

/**
 * Delibird-y encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3804 | GitHub Issue #3804}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const DelibirdyEncounter: MysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.DELIBIRDY)
    .withEncounterTier(MysteryEncounterTier.GREAT)
    .withSceneWaveRangeRequirement(...CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES)
    .withSceneRequirement(new MoneyRequirement(0, DELIBIRDY_MONEY_PRICE_MULTIPLIER)) // Must have enough money for it to spawn at the very least
    .withPrimaryPokemonRequirement(new CombinationPokemonRequirement( // Must also have either option 2 or 3 available to spawn
      new HeldItemRequirement(OPTION_2_ALLOWED_MODIFIERS),
      new HeldItemRequirement(OPTION_3_DISALLOWED_MODIFIERS, 1, true)
    ))
    .withIntroSpriteConfigs([
      {
        spriteKey: "",
        fileRoot: "",
        species: Species.DELIBIRD,
        hasShadow: true,
        repeat: true,
        startFrame: 38,
        scale: 0.94
      },
      {
        spriteKey: "",
        fileRoot: "",
        species: Species.DELIBIRD,
        hasShadow: true,
        repeat: true,
        scale: 1.06
      },
      {
        spriteKey: "",
        fileRoot: "",
        species: Species.DELIBIRD,
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
    .withOnInit((scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter!;
      encounter.setDialogueToken("delibirdName", getPokemonSpecies(Species.DELIBIRD).getName());

      scene.loadBgm("mystery_encounter_delibirdy", "mystery_encounter_delibirdy.mp3");
      return true;
    })
    .withOnVisualsStart((scene: BattleScene) => {
      scene.fadeAndSwitchBgm("mystery_encounter_delibirdy");
      return true;
    })
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT)
        .withSceneMoneyRequirement(0, DELIBIRDY_MONEY_PRICE_MULTIPLIER) // Must have money to spawn
        .withDialogue({
          buttonLabel: `${namespace}:option.1.label`,
          buttonTooltip: `${namespace}:option.1.tooltip`,
          selected: [
            {
              text: `${namespace}:option.1.selected`,
            },
          ],
        })
        .withPreOptionPhase(async (scene: BattleScene): Promise<boolean> => {
          const encounter = scene.currentBattle.mysteryEncounter!;
          updatePlayerMoney(scene, -(encounter.options[0].requirements[0] as MoneyRequirement).requiredMoney, true, false);
          return true;
        })
        .withOptionPhase(async (scene: BattleScene) => {
          // Give the player an Amulet Coin
          // Check if the player has max stacks of that item already
          const existing = scene.findModifier(m => m instanceof MoneyMultiplierModifier) as MoneyMultiplierModifier;

          if (existing && existing.getStackCount() >= existing.getMaxStackCount(scene)) {
            // At max stacks, give the first party pokemon a Shell Bell instead
            const shellBell = generateModifierType(scene, modifierTypes.SHELL_BELL) as PokemonHeldItemModifierType;
            await applyModifierTypeToPlayerPokemon(scene, scene.getParty()[0], shellBell);
            scene.playSound("item_fanfare");
            await showEncounterText(scene, i18next.t("battle:rewardGain", { modifierName: shellBell.name }), null, undefined, true);
          } else {
            scene.unshiftPhase(new ModifierRewardPhase(scene, modifierTypes.AMULET_COIN));
          }

          leaveEncounterWithoutBattle(scene, true);
        })
        .build()
    )
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT)
        .withPrimaryPokemonRequirement(new HeldItemRequirement(OPTION_2_ALLOWED_MODIFIERS))
        .withDialogue({
          buttonLabel: `${namespace}:option.2.label`,
          buttonTooltip: `${namespace}:option.2.tooltip`,
          secondOptionPrompt: `${namespace}:option.2.select_prompt`,
          selected: [
            {
              text: `${namespace}:option.2.selected`,
            },
          ],
        })
        .withPreOptionPhase(async (scene: BattleScene): Promise<boolean> => {
          const encounter = scene.currentBattle.mysteryEncounter!;
          const onPokemonSelected = (pokemon: PlayerPokemon) => {
            // Get Pokemon held items and filter for valid ones
            const validItems = pokemon.getHeldItems().filter((it) => {
              return OPTION_2_ALLOWED_MODIFIERS.some(heldItem => it.constructor.name === heldItem) && it.isTransferable;
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

          const selectableFilter = (pokemon: Pokemon) => {
            // If pokemon has valid item, it can be selected
            const meetsReqs = encounter.options[1].pokemonMeetsPrimaryRequirements(scene, pokemon);
            if (!meetsReqs) {
              return getEncounterText(scene, `${namespace}:invalid_selection`) ?? null;
            }

            return null;
          };

          return selectPokemonForOption(scene, onPokemonSelected, undefined, selectableFilter);
        })
        .withOptionPhase(async (scene: BattleScene) => {
          const encounter = scene.currentBattle.mysteryEncounter!;
          const modifier: BerryModifier | HealingBoosterModifier = encounter.misc.chosenModifier;

          // Give the player a Candy Jar if they gave a Berry, and a Healing Charm for Reviver Seed
          if (modifier instanceof BerryModifier) {
            // Check if the player has max stacks of that Candy Jar already
            const existing = scene.findModifier(m => m instanceof LevelIncrementBoosterModifier) as LevelIncrementBoosterModifier;

            if (existing && existing.getStackCount() >= existing.getMaxStackCount(scene)) {
              // At max stacks, give the first party pokemon a Shell Bell instead
              const shellBell = generateModifierType(scene, modifierTypes.SHELL_BELL) as PokemonHeldItemModifierType;
              await applyModifierTypeToPlayerPokemon(scene, scene.getParty()[0], shellBell);
              scene.playSound("item_fanfare");
              await showEncounterText(scene, i18next.t("battle:rewardGain", { modifierName: shellBell.name }), null, undefined, true);
            } else {
              scene.unshiftPhase(new ModifierRewardPhase(scene, modifierTypes.CANDY_JAR));
            }
          } else {
            // Check if the player has max stacks of that Healing Charm already
            const existing = scene.findModifier(m => m instanceof HealingBoosterModifier) as HealingBoosterModifier;

            if (existing && existing.getStackCount() >= existing.getMaxStackCount(scene)) {
              // At max stacks, give the first party pokemon a Shell Bell instead
              const shellBell = generateModifierType(scene, modifierTypes.SHELL_BELL) as PokemonHeldItemModifierType;
              await applyModifierTypeToPlayerPokemon(scene, scene.getParty()[0], shellBell);
              scene.playSound("item_fanfare");
              await showEncounterText(scene, i18next.t("battle:rewardGain", { modifierName: shellBell.name }), null, undefined, true);
            } else {
              scene.unshiftPhase(new ModifierRewardPhase(scene, modifierTypes.HEALING_CHARM));
            }
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
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT)
        .withPrimaryPokemonRequirement(new HeldItemRequirement(OPTION_3_DISALLOWED_MODIFIERS, 1, true))
        .withDialogue({
          buttonLabel: `${namespace}:option.3.label`,
          buttonTooltip: `${namespace}:option.3.tooltip`,
          secondOptionPrompt: `${namespace}:option.3.select_prompt`,
          selected: [
            {
              text: `${namespace}:option.3.selected`,
            },
          ],
        })
        .withPreOptionPhase(async (scene: BattleScene): Promise<boolean> => {
          const encounter = scene.currentBattle.mysteryEncounter!;
          const onPokemonSelected = (pokemon: PlayerPokemon) => {
            // Get Pokemon held items and filter for valid ones
            const validItems = pokemon.getHeldItems().filter((it) => {
              return !OPTION_3_DISALLOWED_MODIFIERS.some(heldItem => it.constructor.name === heldItem) && it.isTransferable;
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

          const selectableFilter = (pokemon: Pokemon) => {
            // If pokemon has valid item, it can be selected
            const meetsReqs = encounter.options[2].pokemonMeetsPrimaryRequirements(scene, pokemon);
            if (!meetsReqs) {
              return getEncounterText(scene, `${namespace}:invalid_selection`) ?? null;
            }

            return null;
          };

          return selectPokemonForOption(scene, onPokemonSelected, undefined, selectableFilter);
        })
        .withOptionPhase(async (scene: BattleScene) => {
          const encounter = scene.currentBattle.mysteryEncounter!;
          const modifier = encounter.misc.chosenModifier;

          // Check if the player has max stacks of Berry Pouch already
          const existing = scene.findModifier(m => m instanceof PreserveBerryModifier) as PreserveBerryModifier;

          if (existing && existing.getStackCount() >= existing.getMaxStackCount(scene)) {
            // At max stacks, give the first party pokemon a Shell Bell instead
            const shellBell = generateModifierType(scene, modifierTypes.SHELL_BELL) as PokemonHeldItemModifierType;
            await applyModifierTypeToPlayerPokemon(scene, scene.getParty()[0], shellBell);
            scene.playSound("item_fanfare");
            await showEncounterText(scene, i18next.t("battle:rewardGain", { modifierName: shellBell.name }), null, undefined, true);
          } else {
            scene.unshiftPhase(new ModifierRewardPhase(scene, modifierTypes.BERRY_POUCH));
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
    .build();
