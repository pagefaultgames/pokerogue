import { MoveCategory } from "#app/data/move";
import { MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import { generateModifierTypeOption, leaveEncounterWithoutBattle, selectPokemonForOption, setEncounterExp, setEncounterRewards } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import type { PlayerPokemon, PokemonMove } from "#app/field/pokemon";
import { modifierTypes } from "#app/modifier/modifier-type";
import type { OptionSelectItem } from "#app/ui/abstact-option-select-ui-handler";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { globalScene } from "#app/global-scene";
import type MysteryEncounter from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterBuilder } from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { Stat } from "#enums/stat";
import i18next from "i18next";
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/game-mode";

/** i18n namespace for the encounter */
const namespace = "mysteryEncounters/fieldTrip";

/**
 * Field Trip encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3794 | GitHub Issue #3794}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const FieldTripEncounter: MysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.FIELD_TRIP)
    .withEncounterTier(MysteryEncounterTier.COMMON)
    .withSceneWaveRangeRequirement(CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES[0], 100)
    .withIntroSpriteConfigs([
      {
        spriteKey: "preschooler_m",
        fileRoot: "trainer",
        hasShadow: true,
      },
      {
        spriteKey: "field_trip_teacher",
        fileRoot: "mystery-encounters",
        hasShadow: true,
      },
      {
        spriteKey: "preschooler_f",
        fileRoot: "trainer",
        hasShadow: true,
      },
    ])
    .withIntroDialogue([
      {
        text: `${namespace}:intro`,
      },
      {
        text: `${namespace}:intro_dialogue`,
        speaker: `${namespace}:speaker`,
      },
    ])
    .withAutoHideIntroVisuals(false)
    .setLocalizationKey(`${namespace}`)
    .withTitle(`${namespace}:title`)
    .withDescription(`${namespace}:description`)
    .withQuery(`${namespace}:query`)
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
        .withDialogue({
          buttonLabel: `${namespace}:option.1.label`,
          buttonTooltip: `${namespace}:option.1.tooltip`,
          secondOptionPrompt: `${namespace}:second_option_prompt`,
        })
        .withPreOptionPhase(async (): Promise<boolean> => {
          const encounter = globalScene.currentBattle.mysteryEncounter!;
          const onPokemonSelected = (pokemon: PlayerPokemon) => {
            // Return the options for Pokemon move valid for this option
            return pokemon.moveset.map((move: PokemonMove) => {
              const option: OptionSelectItem = {
                label: move.getName(),
                handler: () => {
                  // Pokemon and move selected
                  encounter.setDialogueToken("moveCategory", i18next.t(`${namespace}:physical`));
                  pokemonAndMoveChosen(pokemon, move, MoveCategory.PHYSICAL);
                  return true;
                },
              };
              return option;
            });
          };

          return selectPokemonForOption(onPokemonSelected);
        })
        .withOptionPhase(async () => {
          const encounter = globalScene.currentBattle.mysteryEncounter!;
          if (encounter.misc.correctMove) {
            const modifiers = [
              generateModifierTypeOption(modifierTypes.TEMP_STAT_STAGE_BOOSTER, [ Stat.ATK ])!,
              generateModifierTypeOption(modifierTypes.TEMP_STAT_STAGE_BOOSTER, [ Stat.DEF ])!,
              generateModifierTypeOption(modifierTypes.TEMP_STAT_STAGE_BOOSTER, [ Stat.SPD ])!,
              generateModifierTypeOption(modifierTypes.DIRE_HIT)!,
              generateModifierTypeOption(modifierTypes.RARER_CANDY)!,
            ];

            setEncounterRewards({ guaranteedModifierTypeOptions: modifiers, fillRemaining: false });
          }

          leaveEncounterWithoutBattle(!encounter.misc.correctMove);
        })
        .build()
    )
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
        .withDialogue({
          buttonLabel: `${namespace}:option.2.label`,
          buttonTooltip: `${namespace}:option.2.tooltip`,
          secondOptionPrompt: `${namespace}:second_option_prompt`,
        })
        .withPreOptionPhase(async (): Promise<boolean> => {
          const encounter = globalScene.currentBattle.mysteryEncounter!;
          const onPokemonSelected = (pokemon: PlayerPokemon) => {
            // Return the options for Pokemon move valid for this option
            return pokemon.moveset.map((move: PokemonMove) => {
              const option: OptionSelectItem = {
                label: move.getName(),
                handler: () => {
                  // Pokemon and move selected
                  encounter.setDialogueToken("moveCategory", i18next.t(`${namespace}:special`));
                  pokemonAndMoveChosen(pokemon, move, MoveCategory.SPECIAL);
                  return true;
                },
              };
              return option;
            });
          };

          return selectPokemonForOption(onPokemonSelected);
        })
        .withOptionPhase(async () => {
          const encounter = globalScene.currentBattle.mysteryEncounter!;
          if (encounter.misc.correctMove) {
            const modifiers = [
              generateModifierTypeOption(modifierTypes.TEMP_STAT_STAGE_BOOSTER, [ Stat.SPATK ])!,
              generateModifierTypeOption(modifierTypes.TEMP_STAT_STAGE_BOOSTER, [ Stat.SPDEF ])!,
              generateModifierTypeOption(modifierTypes.TEMP_STAT_STAGE_BOOSTER, [ Stat.SPD ])!,
              generateModifierTypeOption(modifierTypes.DIRE_HIT)!,
              generateModifierTypeOption(modifierTypes.RARER_CANDY)!,
            ];

            setEncounterRewards({ guaranteedModifierTypeOptions: modifiers, fillRemaining: false });
          }

          leaveEncounterWithoutBattle(!encounter.misc.correctMove);
        })
        .build()
    )
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
        .withDialogue({
          buttonLabel: `${namespace}:option.3.label`,
          buttonTooltip: `${namespace}:option.3.tooltip`,
          secondOptionPrompt: `${namespace}:second_option_prompt`,
        })
        .withPreOptionPhase(async (): Promise<boolean> => {
          const encounter = globalScene.currentBattle.mysteryEncounter!;
          const onPokemonSelected = (pokemon: PlayerPokemon) => {
            // Return the options for Pokemon move valid for this option
            return pokemon.moveset.map((move: PokemonMove) => {
              const option: OptionSelectItem = {
                label: move.getName(),
                handler: () => {
                  // Pokemon and move selected
                  encounter.setDialogueToken("moveCategory", i18next.t(`${namespace}:status`));
                  pokemonAndMoveChosen(pokemon, move, MoveCategory.STATUS);
                  return true;
                },
              };
              return option;
            });
          };

          return selectPokemonForOption(onPokemonSelected);
        })
        .withOptionPhase(async () => {
          const encounter = globalScene.currentBattle.mysteryEncounter!;
          if (encounter.misc.correctMove) {
            const modifiers = [
              generateModifierTypeOption(modifierTypes.TEMP_STAT_STAGE_BOOSTER, [ Stat.ACC ])!,
              generateModifierTypeOption(modifierTypes.TEMP_STAT_STAGE_BOOSTER, [ Stat.SPD ])!,
              generateModifierTypeOption(modifierTypes.GREAT_BALL)!,
              generateModifierTypeOption(modifierTypes.IV_SCANNER)!,
              generateModifierTypeOption(modifierTypes.RARER_CANDY)!,
            ];

            setEncounterRewards({ guaranteedModifierTypeOptions: modifiers, fillRemaining: false });
          }

          leaveEncounterWithoutBattle(!encounter.misc.correctMove);
        })
        .build()
    )
    .build();

function pokemonAndMoveChosen(pokemon: PlayerPokemon, move: PokemonMove, correctMoveCategory: MoveCategory) {
  const encounter = globalScene.currentBattle.mysteryEncounter!;
  const correctMove = move.getMove().category === correctMoveCategory;
  encounter.setDialogueToken("pokeName", pokemon.getNameToRender());
  encounter.setDialogueToken("move", move.getName());
  if (!correctMove) {
    encounter.selectedOption!.dialogue!.selected = [
      {
        text: `${namespace}:option.selected`,
      },
      {
        text: `${namespace}:incorrect`,
        speaker: `${namespace}:speaker`,
      },
      {
        text: `${namespace}:incorrect_exp`,
      },
    ];
    setEncounterExp(globalScene.getPlayerParty().map((p) => p.id), 50);
  } else {
    encounter.selectedOption!.dialogue!.selected = [
      {
        text: `${namespace}:option.selected`,
      },
      {
        text: `${namespace}:correct`,
        speaker: `${namespace}:speaker`,
      },
      {
        text: `${namespace}:correct_exp`,
      },
    ];
    setEncounterExp([ pokemon.id ], 100);
  }
  encounter.misc = {
    correctMove: correctMove,
  };
}
