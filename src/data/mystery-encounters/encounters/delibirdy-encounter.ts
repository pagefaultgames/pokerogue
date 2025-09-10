import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/constants";
import { timedEventManager } from "#app/global-event-manager";
import { globalScene } from "#app/global-scene";
import { allHeldItems } from "#data/data-lists";
import { HeldItemCategoryId, HeldItemId, isItemInCategory } from "#enums/held-item-id";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { RewardId } from "#enums/reward-id";
import { SpeciesId } from "#enums/species-id";
import { TrainerItemId } from "#enums/trainer-item-id";
import type { PlayerPokemon, Pokemon } from "#field/pokemon";
import { getEncounterText, showEncounterText } from "#mystery-encounters/encounter-dialogue-utils";
import {
  leaveEncounterWithoutBattle,
  selectPokemonForOption,
  updatePlayerMoney,
} from "#mystery-encounters/encounter-phase-utils";
import type { MysteryEncounter } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterBuilder } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterOptionBuilder } from "#mystery-encounters/mystery-encounter-option";
import {
  CombinationPokemonRequirement,
  HoldingItemRequirement,
  MoneyRequirement,
} from "#mystery-encounters/mystery-encounter-requirements";
import i18next from "#plugins/i18n";
import type { OptionSelectItem } from "#ui/handlers/abstract-option-select-ui-handler";
import { randSeedItem } from "#utils/common";
import { getPokemonSpecies } from "#utils/pokemon-utils";

/** the i18n namespace for this encounter */
const namespace = "mysteryEncounters/delibirdy";

/** Berries only */
const OPTION_2_ALLOWED_HELD_ITEMS = [HeldItemCategoryId.BERRY, HeldItemId.REVIVER_SEED];

/** Disallowed items are berries, Reviver Seeds, and Vitamins */
const OPTION_3_DISALLOWED_HELD_ITEMS = [HeldItemCategoryId.BERRY, HeldItemId.REVIVER_SEED];

const DELIBIRDY_MONEY_PRICE_MULTIPLIER = 2;

async function backupOption() {
  globalScene.getPlayerPokemon()?.heldItemManager.add(HeldItemId.SHELL_BELL);
  globalScene.playSound("item_fanfare");
  await showEncounterText(
    i18next.t("battle:rewardGain", {
      modifierName: allHeldItems[HeldItemId.SHELL_BELL].name,
    }),
    null,
    undefined,
    true,
  );
  doEventReward();
}

const doEventReward = () => {
  const event_buff = timedEventManager.getDelibirdyBuff();
  if (event_buff.length > 0) {
    const candidates = event_buff.filter(c => {
      const fullStack = globalScene.trainerItems.isMaxStack(c);
      return !fullStack;
    });
    if (candidates.length > 0) {
      globalScene.phaseManager.unshiftNew("RewardPhase", randSeedItem(candidates));
    } else {
      // At max stacks, give a Voucher instead
      globalScene.phaseManager.unshiftNew("RewardPhase", RewardId.VOUCHER);
    }
  }
};

/**
 * Delibird-y encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3804 | GitHub Issue #3804}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const DelibirdyEncounter: MysteryEncounter = MysteryEncounterBuilder.withEncounterType(
  MysteryEncounterType.DELIBIRDY,
)
  .withEncounterTier(MysteryEncounterTier.GREAT)
  .withSceneWaveRangeRequirement(...CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES)
  .withSceneRequirement(new MoneyRequirement(0, DELIBIRDY_MONEY_PRICE_MULTIPLIER)) // Must have enough money for it to spawn at the very least
  .withPrimaryPokemonRequirement(
    CombinationPokemonRequirement.Some(
      // Must also have either option 2 or 3 available to spawn
      new HoldingItemRequirement(OPTION_2_ALLOWED_HELD_ITEMS),
      new HoldingItemRequirement(OPTION_3_DISALLOWED_HELD_ITEMS, 1, true),
    ),
  )
  .withIntroSpriteConfigs([
    {
      spriteKey: "",
      fileRoot: "",
      species: SpeciesId.DELIBIRD,
      hasShadow: true,
      repeat: true,
      startFrame: 38,
      scale: 0.94,
    },
    {
      spriteKey: "",
      fileRoot: "",
      species: SpeciesId.DELIBIRD,
      hasShadow: true,
      repeat: true,
      scale: 1.06,
    },
    {
      spriteKey: "",
      fileRoot: "",
      species: SpeciesId.DELIBIRD,
      hasShadow: true,
      repeat: true,
      startFrame: 65,
      x: 1,
      y: 5,
      yShadow: 5,
    },
  ])
  .withIntroDialogue([
    {
      text: `${namespace}:intro`,
    },
  ])
  .setLocalizationKey(`${namespace}`)
  .withTitle(`${namespace}:title`)
  .withDescription(`${namespace}:description`)
  .withQuery(`${namespace}:query`)
  .withOutroDialogue([
    {
      text: `${namespace}:outro`,
    },
  ])
  .withOnInit(() => {
    const encounter = globalScene.currentBattle.mysteryEncounter!;
    encounter.setDialogueToken("delibirdName", getPokemonSpecies(SpeciesId.DELIBIRD).getName());

    globalScene.loadBgm("mystery_encounter_delibirdy", "mystery_encounter_delibirdy.mp3");
    return true;
  })
  .withOnVisualsStart(() => {
    globalScene.fadeAndSwitchBgm("mystery_encounter_delibirdy");
    return true;
  })
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT)
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
      .withPreOptionPhase(async (): Promise<boolean> => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        updatePlayerMoney(-(encounter.options[0].requirements[0] as MoneyRequirement).requiredMoney, true, false);
        return true;
      })
      .withOptionPhase(async () => {
        // Give the player an Amulet Coin
        // Check if the player has max stacks of that item already
        const fullStack = globalScene.trainerItems.isMaxStack(TrainerItemId.AMULET_COIN);

        if (fullStack) {
          // At max stacks, give the first party pokemon a Shell Bell instead
          backupOption();
        } else {
          globalScene.phaseManager.unshiftNew("RewardPhase", TrainerItemId.AMULET_COIN);
          doEventReward();
        }

        leaveEncounterWithoutBattle(true);
      })
      .build(),
  )
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT)
      .withPrimaryPokemonRequirement(new HoldingItemRequirement(OPTION_2_ALLOWED_HELD_ITEMS))
      .withDialogue({
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: `${namespace}:option.2.tooltip`,
        secondOptionPrompt: `${namespace}:option.2.selectPrompt`,
        selected: [
          {
            text: `${namespace}:option.2.selected`,
          },
        ],
      })
      .withPreOptionPhase(async (): Promise<boolean> => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const onPokemonSelected = (pokemon: PlayerPokemon) => {
          // Get Pokemon held items and filter for valid ones
          const validItems = pokemon.heldItemManager.filterRequestedItems(OPTION_2_ALLOWED_HELD_ITEMS, true);

          return validItems.map((item: HeldItemId) => {
            const option: OptionSelectItem = {
              label: allHeldItems[item].name,
              handler: () => {
                // Pokemon and item selected
                encounter.setDialogueToken("chosenItem", allHeldItems[item].name);
                encounter.misc = {
                  chosenPokemon: pokemon,
                  chosenItem: item,
                };
                return true;
              },
            };
            return option;
          });
        };

        const selectableFilter = (pokemon: Pokemon) => {
          // If pokemon has valid item, it can be selected
          const meetsReqs = encounter.options[1].pokemonMeetsPrimaryRequirements(pokemon);
          if (!meetsReqs) {
            return getEncounterText(`${namespace}:invalidSelection`) ?? null;
          }

          return null;
        };

        return selectPokemonForOption(onPokemonSelected, undefined, selectableFilter);
      })
      .withOptionPhase(async () => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const chosenItem: HeldItemId = encounter.misc.chosenItem;
        const chosenPokemon: PlayerPokemon = encounter.misc.chosenPokemon;

        // Give the player a Candy Jar if they gave a Berry, and a Berry Pouch for Reviver Seed
        if (isItemInCategory(chosenItem, HeldItemCategoryId.BERRY)) {
          // Check if the player has max stacks of that Candy Jar already
          const fullStack = globalScene.trainerItems.isMaxStack(TrainerItemId.CANDY_JAR);

          if (fullStack) {
            // At max stacks, give the first party pokemon a Shell Bell instead
            backupOption();
          } else {
            globalScene.phaseManager.unshiftNew("RewardPhase", TrainerItemId.CANDY_JAR);
            doEventReward();
          }
        } else {
          // Check if the player has max stacks of that Berry Pouch already
          const fullStack = globalScene.trainerItems.isMaxStack(TrainerItemId.BERRY_POUCH);

          if (fullStack) {
            // At max stacks, give the first party pokemon a Shell Bell instead
            backupOption();
          } else {
            globalScene.phaseManager.unshiftNew("RewardPhase", TrainerItemId.BERRY_POUCH);
            doEventReward();
          }
        }

        chosenPokemon.loseHeldItem(chosenItem, false);

        leaveEncounterWithoutBattle(true);
      })
      .build(),
  )
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT)
      .withPrimaryPokemonRequirement(new HoldingItemRequirement(OPTION_3_DISALLOWED_HELD_ITEMS, 1, true))
      .withDialogue({
        buttonLabel: `${namespace}:option.3.label`,
        buttonTooltip: `${namespace}:option.3.tooltip`,
        secondOptionPrompt: `${namespace}:option.3.selectPrompt`,
        selected: [
          {
            text: `${namespace}:option.3.selected`,
          },
        ],
      })
      .withPreOptionPhase(async (): Promise<boolean> => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const onPokemonSelected = (pokemon: PlayerPokemon) => {
          // Get Pokemon held items and filter for valid ones
          const validItems = pokemon.heldItemManager.filterRequestedItems(OPTION_3_DISALLOWED_HELD_ITEMS, true, true);

          return validItems.map((item: HeldItemId) => {
            const option: OptionSelectItem = {
              label: allHeldItems[item].name,
              handler: () => {
                // Pokemon and item selected
                encounter.setDialogueToken("chosenItem", allHeldItems[item].name);
                encounter.misc = {
                  chosenPokemon: pokemon,
                  chosenItem: item,
                };
                return true;
              },
            };
            return option;
          });
        };

        const selectableFilter = (pokemon: Pokemon) => {
          // If pokemon has valid item, it can be selected
          const meetsReqs = encounter.options[2].pokemonMeetsPrimaryRequirements(pokemon);
          if (!meetsReqs) {
            return getEncounterText(`${namespace}:invalidSelection`) ?? null;
          }

          return null;
        };

        return selectPokemonForOption(onPokemonSelected, undefined, selectableFilter);
      })
      .withOptionPhase(async () => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const chosenItem = encounter.misc.chosenItem;
        const chosenPokemon: PlayerPokemon = encounter.misc.chosenPokemon;

        // Check if the player has max stacks of Healing Charm already

        const fullStack = globalScene.trainerItems.isMaxStack(TrainerItemId.HEALING_CHARM);

        if (fullStack) {
          // At max stacks, give the first party pokemon a Shell Bell instead
          backupOption();
        } else {
          globalScene.phaseManager.unshiftNew("RewardPhase", TrainerItemId.HEALING_CHARM);
          doEventReward();
        }

        chosenPokemon.loseHeldItem(chosenItem, false);

        leaveEncounterWithoutBattle(true);
      })
      .build(),
  )
  .build();
