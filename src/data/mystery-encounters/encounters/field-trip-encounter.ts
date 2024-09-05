import { MoveCategory } from "#app/data/move";
import { MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import { generateModifierTypeOption, leaveEncounterWithoutBattle, selectPokemonForOption, setEncounterExp, setEncounterRewards } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { PlayerPokemon, PokemonMove } from "#app/field/pokemon";
import { modifierTypes } from "#app/modifier/modifier-type";
import { OptionSelectItem } from "#app/ui/abstact-option-select-ui-handler";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "#app/battle-scene";
import MysteryEncounter, { MysteryEncounterBuilder } from "../mystery-encounter";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { Stat } from "#enums/stat";

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
    .withSceneWaveRangeRequirement(10, 180)
    .withIntroSpriteConfigs([
      {
        spriteKey: "preschooler_m",
        fileRoot: "trainer",
        hasShadow: true,
      },
      {
        spriteKey: "teacher",
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
          selected: [
            {
              text: `${namespace}.option.selected`,
            },
          ],
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
                  const correctMove = move.getMove().category === MoveCategory.PHYSICAL;
                  encounter.setDialogueToken("moveCategory", "Physical");
                  if (!correctMove) {
                    encounter.options[0].dialogue!.selected = [
                      {
                        text: `${namespace}.option.incorrect`,
                        speaker: `${namespace}.speaker`,
                      },
                      {
                        text: `${namespace}.option.lesson_learned`,
                      },
                    ];
                    encounter.dialogue.outro = [
                      {
                        text: `${namespace}.outro_bad`,
                        speaker: `${namespace}.speaker`,
                      },
                    ];
                    setEncounterExp(scene, scene.getParty().map((p) => p.id), 50);
                  } else {
                    encounter.setDialogueToken("pokeName", pokemon.getNameToRender());
                    encounter.setDialogueToken("move", move.getName());
                    encounter.options[0].dialogue!.selected = [
                      {
                        text: `${namespace}.option.selected`,
                      },
                    ];
                    encounter.dialogue.outro = [
                      {
                        text: `${namespace}.outro_good`,
                        speaker: `${namespace}.speaker`,
                      },
                    ];
                    setEncounterExp(scene, [pokemon.id], 100);
                  }
                  encounter.misc = {
                    correctMove: correctMove,
                  };
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
          selected: [
            {
              text: `${namespace}.option.selected`,
            },
          ],
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
                  const correctMove = move.getMove().category === MoveCategory.SPECIAL;
                  encounter.setDialogueToken("moveCategory", "Special");
                  if (!correctMove) {
                    encounter.options[1].dialogue!.selected = [
                      {
                        text: `${namespace}.option.incorrect`,
                        speaker: `${namespace}.speaker`,
                      },
                      {
                        text: `${namespace}.option.lesson_learned`,
                      },
                    ];
                    encounter.dialogue.outro = [
                      {
                        text: `${namespace}.outro_bad`,
                        speaker: `${namespace}.speaker`,
                      },
                    ];
                    encounter.dialogue.outro = [
                      {
                        text: `${namespace}.outro_bad`,
                        speaker: `${namespace}.speaker`,
                      },
                    ];
                    setEncounterExp(scene, scene.getParty().map((p) => p.id), 50);
                  } else {
                    encounter.setDialogueToken("pokeName", pokemon.getNameToRender());
                    encounter.setDialogueToken("move", move.getName());
                    encounter.options[1].dialogue!.selected = [
                      {
                        text: `${namespace}.option.selected`,
                      },
                    ];
                    encounter.dialogue.outro = [
                      {
                        text: `${namespace}.outro_good`,
                        speaker: `${namespace}.speaker`,
                      },
                    ];
                    setEncounterExp(scene, [pokemon.id], 100);
                  }
                  encounter.misc = {
                    correctMove: correctMove,
                  };
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
          selected: [
            {
              text: `${namespace}.option.selected`,
            },
          ],
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
                  const correctMove = move.getMove().category === MoveCategory.STATUS;
                  encounter.setDialogueToken("moveCategory", "Status");
                  if (!correctMove) {
                    encounter.options[2].dialogue!.selected = [
                      {
                        text: `${namespace}.option.incorrect`,
                        speaker: `${namespace}.speaker`,
                      },
                      {
                        text: `${namespace}.option.lesson_learned`,
                      },
                    ];
                    encounter.dialogue.outro = [
                      {
                        text: `${namespace}.outro_bad`,
                        speaker: `${namespace}.speaker`,
                      },
                    ];
                    setEncounterExp(scene, scene.getParty().map((p) => p.id), 50);
                  } else {
                    encounter.setDialogueToken("pokeName", pokemon.getNameToRender());
                    encounter.setDialogueToken("move", move.getName());
                    encounter.options[2].dialogue!.selected = [
                      {
                        text: `${namespace}.option.selected`,
                      },
                    ];
                    encounter.dialogue.outro = [
                      {
                        text: `${namespace}.outro_good`,
                        speaker: `${namespace}.speaker`,
                      },
                    ];
                    setEncounterExp(scene, [pokemon.id], 100);
                  }
                  encounter.misc = {
                    correctMove: correctMove,
                  };
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
            ];

            setEncounterRewards(scene, { guaranteedModifierTypeOptions: modifiers, fillRemaining: false });
          }

          leaveEncounterWithoutBattle(scene, !encounter.misc.correctMove);
        })
        .build()
    )
    .build();
