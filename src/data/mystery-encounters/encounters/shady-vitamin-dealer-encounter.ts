import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/constants";
import { globalScene } from "#app/global-scene";
import { modifierTypes } from "#data/data-lists";
import { getNatureName } from "#data/nature";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import type { Nature } from "#enums/nature";
import { SpeciesId } from "#enums/species-id";
import type { PlayerPokemon, Pokemon } from "#field/pokemon";
import { getEncounterText, queueEncounterMessage } from "#mystery-encounters/encounter-dialogue-utils";
import {
  generateModifierType,
  leaveEncounterWithoutBattle,
  selectPokemonForOption,
  setEncounterExp,
  updatePlayerMoney,
} from "#mystery-encounters/encounter-phase-utils";
import {
  applyDamageToPokemon,
  applyModifierTypeToPlayerPokemon,
  isPokemonValidForEncounterOptionSelection,
} from "#mystery-encounters/encounter-pokemon-utils";
import type { MysteryEncounter } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterBuilder } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterOptionBuilder } from "#mystery-encounters/mystery-encounter-option";
import { MoneyRequirement } from "#mystery-encounters/mystery-encounter-requirements";
import { randSeedInt } from "#utils/common";
import i18next from "i18next";

/** the i18n namespace for this encounter */
const namespace = "mysteryEncounters/shadyVitaminDealer";

const VITAMIN_DEALER_CHEAP_PRICE_MULTIPLIER = 1.5;
const VITAMIN_DEALER_EXPENSIVE_PRICE_MULTIPLIER = 5;

/**
 * Shady Vitamin Dealer encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3798 | GitHub Issue #3798}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const ShadyVitaminDealerEncounter: MysteryEncounter = MysteryEncounterBuilder.withEncounterType(
  MysteryEncounterType.SHADY_VITAMIN_DEALER,
)
  .withEncounterTier(MysteryEncounterTier.COMMON)
  .withSceneWaveRangeRequirement(...CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES)
  .withSceneRequirement(new MoneyRequirement(0, VITAMIN_DEALER_CHEAP_PRICE_MULTIPLIER)) // Must have the money for at least the cheap deal
  .withPrimaryPokemonHealthRatioRequirement([0.51, 1]) // At least 1 Pokemon must have above half HP
  .withIntroSpriteConfigs([
    {
      spriteKey: SpeciesId.KROOKODILE.toString(),
      fileRoot: "pokemon",
      hasShadow: true,
      repeat: true,
      x: 12,
      y: -5,
      yShadow: -5,
    },
    {
      spriteKey: "shady_vitamin_dealer",
      fileRoot: "mystery-encounters",
      hasShadow: true,
      x: -12,
      y: 3,
      yShadow: 3,
    },
  ])
  .withIntroDialogue([
    {
      text: `${namespace}:intro`,
    },
    {
      text: `${namespace}:introDialogue`,
      speaker: `${namespace}:speaker`,
    },
  ])
  .setLocalizationKey(`${namespace}`)
  .withTitle(`${namespace}:title`)
  .withDescription(`${namespace}:description`)
  .withQuery(`${namespace}:query`)
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT)
      .withSceneMoneyRequirement(0, VITAMIN_DEALER_CHEAP_PRICE_MULTIPLIER)
      .withDialogue({
        buttonLabel: `${namespace}:option.1.label`,
        buttonTooltip: `${namespace}:option.1.tooltip`,
        selected: [
          {
            text: `${namespace}:option.selected`,
          },
        ],
      })
      .withPreOptionPhase(async (): Promise<boolean> => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const onPokemonSelected = (pokemon: PlayerPokemon) => {
          // Update money
          updatePlayerMoney(-(encounter.options[0].requirements[0] as MoneyRequirement).requiredMoney);
          // Calculate modifiers and dialogue tokens
          const modifiers = [
            generateModifierType(modifierTypes.BASE_STAT_BOOSTER)!,
            generateModifierType(modifierTypes.BASE_STAT_BOOSTER)!,
          ];
          encounter.setDialogueToken("boost1", modifiers[0].name);
          encounter.setDialogueToken("boost2", modifiers[1].name);
          encounter.misc = {
            chosenPokemon: pokemon,
            modifiers,
          };
        };

        // Only Pokemon that can gain benefits are above half HP with no status
        const selectableFilter = (pokemon: Pokemon) => {
          // If pokemon meets primary pokemon reqs, it can be selected
          if (!pokemon.isAllowedInChallenge()) {
            return (
              i18next.t("partyUiHandler:cantBeUsed", {
                pokemonName: pokemon.getNameToRender(),
              }) ?? null
            );
          }
          if (!encounter.pokemonMeetsPrimaryRequirements(pokemon)) {
            return getEncounterText(`${namespace}:invalidSelection`) ?? null;
          }

          return null;
        };

        return selectPokemonForOption(onPokemonSelected, undefined, selectableFilter);
      })
      .withOptionPhase(async () => {
        // Choose Cheap Option
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const chosenPokemon = encounter.misc.chosenPokemon;
        const modifiers = encounter.misc.modifiers;

        for (const modType of modifiers) {
          await applyModifierTypeToPlayerPokemon(chosenPokemon, modType);
        }

        leaveEncounterWithoutBattle(true);
      })
      .withPostOptionPhase(async () => {
        // Damage and status applied after dealer leaves (to make thematic sense)
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const chosenPokemon = encounter.misc.chosenPokemon as PlayerPokemon;

        // Pokemon takes half max HP damage and nature is randomized (does not update dex)
        applyDamageToPokemon(chosenPokemon, Math.floor(chosenPokemon.getMaxHp() / 2));

        const currentNature = chosenPokemon.nature;
        let newNature = randSeedInt(25) as Nature;
        while (newNature === currentNature) {
          newNature = randSeedInt(25) as Nature;
        }

        chosenPokemon.setCustomNature(newNature);
        encounter.setDialogueToken("newNature", getNatureName(newNature));
        queueEncounterMessage(`${namespace}:cheapSideEffects`);
        setEncounterExp([chosenPokemon.id], 100);
        await chosenPokemon.updateInfo();
      })
      .build(),
  )
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT)
      .withSceneMoneyRequirement(0, VITAMIN_DEALER_EXPENSIVE_PRICE_MULTIPLIER)
      .withDialogue({
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: `${namespace}:option.2.tooltip`,
        selected: [
          {
            text: `${namespace}:option.selected`,
          },
        ],
      })
      .withPreOptionPhase(async (): Promise<boolean> => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const onPokemonSelected = (pokemon: PlayerPokemon) => {
          // Update money
          updatePlayerMoney(-(encounter.options[1].requirements[0] as MoneyRequirement).requiredMoney);
          // Calculate modifiers and dialogue tokens
          const modifiers = [
            generateModifierType(modifierTypes.BASE_STAT_BOOSTER)!,
            generateModifierType(modifierTypes.BASE_STAT_BOOSTER)!,
          ];
          encounter.setDialogueToken("boost1", modifiers[0].name);
          encounter.setDialogueToken("boost2", modifiers[1].name);
          encounter.misc = {
            chosenPokemon: pokemon,
            modifiers,
          };
        };

        // Only Pokemon that can gain benefits are unfainted
        const selectableFilter = (pokemon: Pokemon) => {
          return isPokemonValidForEncounterOptionSelection(pokemon, `${namespace}:invalidSelection`);
        };

        return selectPokemonForOption(onPokemonSelected, undefined, selectableFilter);
      })
      .withOptionPhase(async () => {
        // Choose Expensive Option
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const chosenPokemon = encounter.misc.chosenPokemon;
        const modifiers = encounter.misc.modifiers;

        for (const modType of modifiers) {
          await applyModifierTypeToPlayerPokemon(chosenPokemon, modType);
        }

        leaveEncounterWithoutBattle(true);
      })
      .withPostOptionPhase(async () => {
        // Status applied after dealer leaves (to make thematic sense)
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const chosenPokemon = encounter.misc.chosenPokemon;

        queueEncounterMessage(`${namespace}:noBadEffects`);
        setEncounterExp([chosenPokemon.id], 100);

        await chosenPokemon.updateInfo();
      })
      .build(),
  )
  .withSimpleOption(
    {
      buttonLabel: `${namespace}:option.3.label`,
      buttonTooltip: `${namespace}:option.3.tooltip`,
      selected: [
        {
          text: `${namespace}:option.3.selected`,
          speaker: `${namespace}:speaker`,
        },
      ],
    },
    async () => {
      // Leave encounter with no rewards or exp
      leaveEncounterWithoutBattle(true);
      return true;
    },
  )
  .build();
