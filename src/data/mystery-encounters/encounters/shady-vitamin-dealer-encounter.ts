import { generateModifierType, leaveEncounterWithoutBattle, selectPokemonForOption, setEncounterExp, updatePlayerMoney, } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import Pokemon, { PlayerPokemon } from "#app/field/pokemon";
import { modifierTypes } from "#app/modifier/modifier-type";
import { randSeedInt } from "#app/utils";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { Species } from "#enums/species";
import BattleScene from "#app/battle-scene";
import MysteryEncounter, { MysteryEncounterBuilder } from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import { MoneyRequirement } from "#app/data/mystery-encounters/mystery-encounter-requirements";
import { getEncounterText, queueEncounterMessage } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import { applyDamageToPokemon, applyModifierTypeToPlayerPokemon } from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { Nature } from "#enums/nature";
import { getNatureName } from "#app/data/nature";
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/game-mode";

/** the i18n namespace for this encounter */
const namespace = "mysteryEncounter:shadyVitaminDealer";

const VITAMIN_DEALER_CHEAP_PRICE_MULTIPLIER = 1.5;
const VITAMIN_DEALER_EXPENSIVE_PRICE_MULTIPLIER = 3.5;

/**
 * Shady Vitamin Dealer encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3798 | GitHub Issue #3798}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const ShadyVitaminDealerEncounter: MysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.SHADY_VITAMIN_DEALER)
    .withEncounterTier(MysteryEncounterTier.COMMON)
    .withSceneWaveRangeRequirement(...CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES)
    .withSceneRequirement(new MoneyRequirement(0, VITAMIN_DEALER_CHEAP_PRICE_MULTIPLIER)) // Must have the money for at least the cheap deal
    .withPrimaryPokemonHealthRatioRequirement([0.5, 1]) // At least 1 Pokemon must have above half HP
    .withIntroSpriteConfigs([
      {
        spriteKey: Species.KROOKODILE.toString(),
        fileRoot: "pokemon",
        hasShadow: true,
        repeat: true,
        x: 12,
        y: -5,
        yShadow: -5
      },
      {
        spriteKey: "shady_vitamin_dealer",
        fileRoot: "mystery-encounters",
        hasShadow: true,
        x: -12,
        y: 3,
        yShadow: 3
      },
    ])
    .withIntroDialogue([
      {
        text: `${namespace}.intro`,
      },
      {
        text: `${namespace}.intro_dialogue`,
        speaker: `${namespace}.speaker`,
      },
    ])
    .withTitle(`${namespace}.title`)
    .withDescription(`${namespace}.description`)
    .withQuery(`${namespace}.query`)
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT)
        .withSceneMoneyRequirement(0, VITAMIN_DEALER_CHEAP_PRICE_MULTIPLIER)
        .withDialogue({
          buttonLabel: `${namespace}.option.1.label`,
          buttonTooltip: `${namespace}.option.1.tooltip`,
          selected: [
            {
              text: `${namespace}.option.selected`,
            },
          ],
        })
        .withPreOptionPhase(async (scene: BattleScene): Promise<boolean> => {
          const encounter = scene.currentBattle.mysteryEncounter!;
          const onPokemonSelected = (pokemon: PlayerPokemon) => {
            // Update money
            updatePlayerMoney(scene, -(encounter.options[0].requirements[0] as MoneyRequirement).requiredMoney);
            // Calculate modifiers and dialogue tokens
            const modifiers = [
              generateModifierType(scene, modifierTypes.BASE_STAT_BOOSTER)!,
              generateModifierType(scene, modifierTypes.BASE_STAT_BOOSTER)!,
            ];
            encounter.setDialogueToken("boost1", modifiers[0].name);
            encounter.setDialogueToken("boost2", modifiers[1].name);
            encounter.misc = {
              chosenPokemon: pokemon,
              modifiers: modifiers,
            };
          };

          // Only Pokemon that can gain benefits are above half HP with no status
          const selectableFilter = (pokemon: Pokemon) => {
            // If pokemon meets primary pokemon reqs, it can be selected
            const meetsReqs = encounter.pokemonMeetsPrimaryRequirements(scene, pokemon);
            if (!meetsReqs) {
              return getEncounterText(scene, `${namespace}.invalid_selection`) ?? null;
            }

            return null;
          };

          return selectPokemonForOption(scene, onPokemonSelected, undefined, selectableFilter);
        })
        .withOptionPhase(async (scene: BattleScene) => {
          // Choose Cheap Option
          const encounter = scene.currentBattle.mysteryEncounter!;
          const chosenPokemon = encounter.misc.chosenPokemon;
          const modifiers = encounter.misc.modifiers;

          for (const modType of modifiers) {
            await applyModifierTypeToPlayerPokemon(scene, chosenPokemon, modType);
          }

          leaveEncounterWithoutBattle(scene, true);
        })
        .withPostOptionPhase(async (scene: BattleScene) => {
          // Damage and status applied after dealer leaves (to make thematic sense)
          const encounter = scene.currentBattle.mysteryEncounter!;
          const chosenPokemon = encounter.misc.chosenPokemon as PlayerPokemon;

          // Pokemon takes half max HP damage and nature is randomized (does not update dex)
          applyDamageToPokemon(scene, chosenPokemon, Math.floor(chosenPokemon.getMaxHp() / 2));

          const currentNature = chosenPokemon.nature;
          let newNature = randSeedInt(25) as Nature;
          while (newNature === currentNature) {
            newNature = randSeedInt(25) as Nature;
          }

          chosenPokemon.nature = newNature;
          encounter.setDialogueToken("newNature", getNatureName(newNature));
          queueEncounterMessage(scene, `${namespace}.cheap_side_effects`);
          setEncounterExp(scene, [chosenPokemon.id], 100);
          chosenPokemon.updateInfo();
        })
        .build()
    )
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT)
        .withSceneMoneyRequirement(0, VITAMIN_DEALER_EXPENSIVE_PRICE_MULTIPLIER)
        .withDialogue({
          buttonLabel: `${namespace}.option.2.label`,
          buttonTooltip: `${namespace}.option.2.tooltip`,
          selected: [
            {
              text: `${namespace}.option.selected`,
            },
          ],
        })
        .withPreOptionPhase(async (scene: BattleScene): Promise<boolean> => {
          const encounter = scene.currentBattle.mysteryEncounter!;
          const onPokemonSelected = (pokemon: PlayerPokemon) => {
            // Update money
            updatePlayerMoney(scene, -(encounter.options[1].requirements[0] as MoneyRequirement).requiredMoney);
            // Calculate modifiers and dialogue tokens
            const modifiers = [
              generateModifierType(scene, modifierTypes.BASE_STAT_BOOSTER)!,
              generateModifierType(scene, modifierTypes.BASE_STAT_BOOSTER)!,
            ];
            encounter.setDialogueToken("boost1", modifiers[0].name);
            encounter.setDialogueToken("boost2", modifiers[1].name);
            encounter.misc = {
              chosenPokemon: pokemon,
              modifiers: modifiers,
            };
          };

          // Only Pokemon that can gain benefits are unfainted
          const selectableFilter = (pokemon: Pokemon) => {
            // If pokemon is unfainted it can be selected
            const meetsReqs = !pokemon.isFainted(true);
            if (!meetsReqs) {
              return getEncounterText(scene, `${namespace}.invalid_selection`) ?? null;
            }

            return null;
          };

          return selectPokemonForOption(scene, onPokemonSelected, undefined, selectableFilter);
        })
        .withOptionPhase(async (scene: BattleScene) => {
          // Choose Expensive Option
          const encounter = scene.currentBattle.mysteryEncounter!;
          const chosenPokemon = encounter.misc.chosenPokemon;
          const modifiers = encounter.misc.modifiers;

          for (const modType of modifiers) {
            await applyModifierTypeToPlayerPokemon(scene, chosenPokemon, modType);
          }

          leaveEncounterWithoutBattle(scene, true);
        })
        .withPostOptionPhase(async (scene: BattleScene) => {
          // Status applied after dealer leaves (to make thematic sense)
          const encounter = scene.currentBattle.mysteryEncounter!;
          const chosenPokemon = encounter.misc.chosenPokemon;

          queueEncounterMessage(scene, `${namespace}.no_bad_effects`);
          setEncounterExp(scene, [chosenPokemon.id], 100);

          chosenPokemon.updateInfo();
        })
        .build()
    )
    .withSimpleOption(
      {
        buttonLabel: `${namespace}.option.3.label`,
        buttonTooltip: `${namespace}.option.3.tooltip`,
        selected: [
          {
            text: `${namespace}.option.3.selected`,
            speaker: `${namespace}.speaker`
          }
        ]
      },
      async (scene: BattleScene) => {
        // Leave encounter with no rewards or exp
        leaveEncounterWithoutBattle(scene, true);
        return true;
      }
    )
    .build();
