import { MoveCategory } from "#app/data/move";
import { MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import { generateModifierTypeOption, leaveEncounterWithoutBattle, selectPokemonForOption, setEncounterExp, setEncounterRewards } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { PlayerPokemon, PokemonMove } from "#app/field/pokemon";
import { modifierTypes } from "#app/modifier/modifier-type";
import { OptionSelectItem } from "#app/ui/abstact-option-select-ui-handler";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "#app/battle-scene";
import MysteryEncounter, { MysteryEncounterBuilder } from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { Stat } from "#enums/stat";
import i18next from "i18next";
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/game-mode";

/** i18n namespace for the encounter */
const namespace = "mysteryEncounter:fieldTrip";

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
        text: `${namespace}.intro`,
      },
      {
        text: `${namespace}.intro_dialogue`,
        speaker: `${namespace}.speaker`,
      },
    ])
    .withAutoHideIntroVisuals(false)
    .withTitle(`${namespace}.title`)
    .withDescription(`${namespace}.description`)
    .withQuery(`${namespace}.query`)
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
        .withDialogue({
          buttonLabel: `${namespace}.option.1.label`,
          buttonTooltip: `${namespace}.option.1.tooltip`,
          secondOptionPrompt: `${namespace}.second_option_prompt`,
        })
        .withPreOptionPhase(async (scene: BattleScene): Promise<boolean> => {
          const encounter = scene.currentBattle.mysteryEncounter!;
          const onPokemonSelected = (pokemon: PlayerPokemon) => {
            // Return the options for Pokemon move valid for this option
            return pokemon.moveset.map((move: PokemonMove) => {
              const option: OptionSelectItem = {
                label: move.getName(),
                handler: () => {
                  // Pokemon and move selected
                  encounter.setDialogueToken("moveCategory", i18next.t(`${namespace}.physical`));
                  pokemonAndMoveChosen(scene, pokemon, move, MoveCategory.PHYSICAL);
                  return true;
                },
              };
              return option;
            });
          };

          return selectPokemonForOption(scene, onPokemonSelected);
        })
        .withOptionPhase(async (scene: BattleScene) => {
          const encounter = scene.currentBattle.mysteryEncounter!;
          if (encounter.misc.correctMove) {
            const modifiers = [
              generateModifierTypeOption(scene, modifierTypes.TEMP_STAT_STAGE_BOOSTER, [Stat.ATK])!,
              generateModifierTypeOption(scene, modifierTypes.TEMP_STAT_STAGE_BOOSTER, [Stat.DEF])!,
              generateModifierTypeOption(scene, modifierTypes.TEMP_STAT_STAGE_BOOSTER, [Stat.SPD])!,
              generateModifierTypeOption(scene, modifierTypes.DIRE_HIT)!,
              generateModifierTypeOption(scene, modifierTypes.RARER_CANDY)!,
            ];

            setEncounterRewards(scene, { guaranteedModifierTypeOptions: modifiers, fillRemaining: false });
          }

          leaveEncounterWithoutBattle(scene, !encounter.misc.correctMove);
        })
        .build()
    )
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
        .withDialogue({
          buttonLabel: `${namespace}.option.2.label`,
          buttonTooltip: `${namespace}.option.2.tooltip`,
          secondOptionPrompt: `${namespace}.second_option_prompt`,
        })
        .withPreOptionPhase(async (scene: BattleScene): Promise<boolean> => {
          const encounter = scene.currentBattle.mysteryEncounter!;
          const onPokemonSelected = (pokemon: PlayerPokemon) => {
            // Return the options for Pokemon move valid for this option
            return pokemon.moveset.map((move: PokemonMove) => {
              const option: OptionSelectItem = {
                label: move.getName(),
                handler: () => {
                  // Pokemon and move selected
                  encounter.setDialogueToken("moveCategory", i18next.t(`${namespace}.special`));
                  pokemonAndMoveChosen(scene, pokemon, move, MoveCategory.SPECIAL);
                  return true;
                },
              };
              return option;
            });
          };

          return selectPokemonForOption(scene, onPokemonSelected);
        })
        .withOptionPhase(async (scene: BattleScene) => {
          const encounter = scene.currentBattle.mysteryEncounter!;
          if (encounter.misc.correctMove) {
            const modifiers = [
              generateModifierTypeOption(scene, modifierTypes.TEMP_STAT_STAGE_BOOSTER, [Stat.SPATK])!,
              generateModifierTypeOption(scene, modifierTypes.TEMP_STAT_STAGE_BOOSTER, [Stat.SPDEF])!,
              generateModifierTypeOption(scene, modifierTypes.TEMP_STAT_STAGE_BOOSTER, [Stat.SPD])!,
              generateModifierTypeOption(scene, modifierTypes.DIRE_HIT)!,
              generateModifierTypeOption(scene, modifierTypes.RARER_CANDY)!,
            ];

            setEncounterRewards(scene, { guaranteedModifierTypeOptions: modifiers, fillRemaining: false });
          }

          leaveEncounterWithoutBattle(scene, !encounter.misc.correctMove);
        })
        .build()
    )
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
        .withDialogue({
          buttonLabel: `${namespace}.option.3.label`,
          buttonTooltip: `${namespace}.option.3.tooltip`,
          secondOptionPrompt: `${namespace}.second_option_prompt`,
        })
        .withPreOptionPhase(async (scene: BattleScene): Promise<boolean> => {
          const encounter = scene.currentBattle.mysteryEncounter!;
          const onPokemonSelected = (pokemon: PlayerPokemon) => {
            // Return the options for Pokemon move valid for this option
            return pokemon.moveset.map((move: PokemonMove) => {
              const option: OptionSelectItem = {
                label: move.getName(),
                handler: () => {
                  // Pokemon and move selected
                  encounter.setDialogueToken("moveCategory", i18next.t(`${namespace}.status`));
                  pokemonAndMoveChosen(scene, pokemon, move, MoveCategory.STATUS);
                  return true;
                },
              };
              return option;
            });
          };

          return selectPokemonForOption(scene, onPokemonSelected);
        })
        .withOptionPhase(async (scene: BattleScene) => {
          const encounter = scene.currentBattle.mysteryEncounter!;
          if (encounter.misc.correctMove) {
            const modifiers = [
              generateModifierTypeOption(scene, modifierTypes.TEMP_STAT_STAGE_BOOSTER, [Stat.ACC])!,
              generateModifierTypeOption(scene, modifierTypes.TEMP_STAT_STAGE_BOOSTER, [Stat.SPD])!,
              generateModifierTypeOption(scene, modifierTypes.GREAT_BALL)!,
              generateModifierTypeOption(scene, modifierTypes.IV_SCANNER)!,
              generateModifierTypeOption(scene, modifierTypes.RARER_CANDY)!,
            ];

            setEncounterRewards(scene, { guaranteedModifierTypeOptions: modifiers, fillRemaining: false });
          }

          leaveEncounterWithoutBattle(scene, !encounter.misc.correctMove);
        })
        .build()
    )
    .build();

function pokemonAndMoveChosen(scene: BattleScene, pokemon: PlayerPokemon, move: PokemonMove, correctMoveCategory: MoveCategory) {
  const encounter = scene.currentBattle.mysteryEncounter!;
  const correctMove = move.getMove().category === correctMoveCategory;
  encounter.setDialogueToken("pokeName", pokemon.getNameToRender());
  encounter.setDialogueToken("move", move.getName());
  if (!correctMove) {
    encounter.selectedOption!.dialogue!.selected = [
      {
        text: `${namespace}.option.selected`,
      },
      {
        text: `${namespace}.incorrect`,
        speaker: `${namespace}.speaker`,
      },
      {
        text: `${namespace}.incorrect_exp`,
      },
    ];
    setEncounterExp(scene, scene.getParty().map((p) => p.id), 50);
  } else {
    encounter.selectedOption!.dialogue!.selected = [
      {
        text: `${namespace}.option.selected`,
      },
      {
        text: `${namespace}.correct`,
        speaker: `${namespace}.speaker`,
      },
      {
        text: `${namespace}.correct_exp`,
      },
    ];
    setEncounterExp(scene, [pokemon.id], 100);
  }
  encounter.misc = {
    correctMove: correctMove,
  };
}
