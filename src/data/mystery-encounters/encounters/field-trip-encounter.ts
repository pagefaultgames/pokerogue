import { generateModifierTypeOption, leaveEncounterWithoutBattle, selectPokemonForOption, setEncounterExp, setEncounterRewards, } from "#app/data/mystery-encounters/mystery-encounter-utils";
import { modifierTypes } from "#app/modifier/modifier-type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "../../../battle-scene";
import MysteryEncounter, { MysteryEncounterBuilder, MysteryEncounterTier } from "../mystery-encounter";
import { MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import { PlayerPokemon, PokemonMove } from "#app/field/pokemon";
import { OptionSelectItem } from "#app/ui/abstact-option-select-ui-handler";
import { MoveCategory } from "#app/data/move";
import { TempBattleStat } from "#app/data/temp-battle-stat";

export const FieldTripEncounter: MysteryEncounter = MysteryEncounterBuilder
  .withEncounterType(MysteryEncounterType.FIELD_TRIP)
  .withEncounterTier(MysteryEncounterTier.COMMON)
  .withIntroSpriteConfigs([
    {
      spriteKey: "preschooler_m",
      fileRoot: "trainer",
      hasShadow: true
    },
    {
      spriteKey: "teacher",
      fileRoot: "mystery-encounters",
      hasShadow: true
    },
    {
      spriteKey: "preschooler_f",
      fileRoot: "trainer",
      hasShadow: true
    },
  ])
  .withHideIntroVisuals(false)
  .withSceneWaveRangeRequirement(10, 180)
  .withOption(new MysteryEncounterOptionBuilder()
    .withPreOptionPhase(async (scene: BattleScene): Promise<boolean> => {
      const encounter = scene.currentBattle.mysteryEncounter;
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
                encounter.dialogue.encounterOptionsDialogue.options[0].selected = [
                  {
                    text: "mysteryEncounter:field_trip_option_incorrect",
                    speaker: "mysteryEncounter:field_trip_speaker"
                  },
                  {
                    text: "mysteryEncounter:field_trip_lesson_learned",
                  }
                ];
                setEncounterExp(scene, scene.getParty().map(p => p.id), 50);
              } else {
                encounter.setDialogueToken("pokeName", pokemon.name);
                encounter.setDialogueToken("move", move.getName());
                encounter.dialogue.encounterOptionsDialogue.options[0].selected = [
                  {
                    text: "mysteryEncounter:field_trip_option_selected"
                  }
                ];
                setEncounterExp(scene, [pokemon.id], 100);
              }
              encounter.misc = {
                correctMove: correctMove
              };
              return true;
            }
          };
          return option;
        });
      };

      return selectPokemonForOption(scene, onPokemonSelected);
    })
    .withOptionPhase(async (scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter;
      if (encounter.misc.correctMove) {
        const modifiers = [
          generateModifierTypeOption(scene, modifierTypes.TEMP_STAT_BOOSTER, [TempBattleStat.ATK]),
          generateModifierTypeOption(scene, modifierTypes.TEMP_STAT_BOOSTER, [TempBattleStat.DEF]),
          generateModifierTypeOption(scene, modifierTypes.TEMP_STAT_BOOSTER, [TempBattleStat.SPD]),
          generateModifierTypeOption(scene, modifierTypes.DIRE_HIT)
        ];

        setEncounterRewards(scene, { guaranteedModifierTypeOptions: modifiers, fillRemaining: false });
      }

      leaveEncounterWithoutBattle(scene, !encounter.misc.correctMove);
    })
    .build()
  )
  .withOption(new MysteryEncounterOptionBuilder()
    .withPreOptionPhase(async (scene: BattleScene): Promise<boolean> => {
      const encounter = scene.currentBattle.mysteryEncounter;
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
                encounter.dialogue.encounterOptionsDialogue.options[1].selected = [
                  {
                    text: "mysteryEncounter:field_trip_option_incorrect",
                    speaker: "mysteryEncounter:field_trip_speaker"
                  },
                  {
                    text: "mysteryEncounter:field_trip_lesson_learned",
                  }
                ];
                setEncounterExp(scene, scene.getParty().map(p => p.id), 50);
              } else {
                encounter.setDialogueToken("pokeName", pokemon.name);
                encounter.setDialogueToken("move", move.getName());
                encounter.dialogue.encounterOptionsDialogue.options[1].selected = [
                  {
                    text: "mysteryEncounter:field_trip_option_selected"
                  }
                ];
                setEncounterExp(scene, [pokemon.id], 100);
              }
              encounter.misc = {
                correctMove: correctMove
              };
              return true;
            }
          };
          return option;
        });
      };

      return selectPokemonForOption(scene, onPokemonSelected);
    })
    .withOptionPhase(async (scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter;
      if (encounter.misc.correctMove) {
        const modifiers = [
          generateModifierTypeOption(scene, modifierTypes.TEMP_STAT_BOOSTER, [TempBattleStat.SPATK]),
          generateModifierTypeOption(scene, modifierTypes.TEMP_STAT_BOOSTER, [TempBattleStat.SPDEF]),
          generateModifierTypeOption(scene, modifierTypes.TEMP_STAT_BOOSTER, [TempBattleStat.SPD]),
          generateModifierTypeOption(scene, modifierTypes.DIRE_HIT)
        ];

        setEncounterRewards(scene, { guaranteedModifierTypeOptions: modifiers, fillRemaining: false });
      }

      leaveEncounterWithoutBattle(scene, !encounter.misc.correctMove);
    })
    .build()
  )
  .withOption(new MysteryEncounterOptionBuilder()
    .withPreOptionPhase(async (scene: BattleScene): Promise<boolean> => {
      const encounter = scene.currentBattle.mysteryEncounter;
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
                encounter.dialogue.encounterOptionsDialogue.options[2].selected = [
                  {
                    text: "mysteryEncounter:field_trip_option_incorrect",
                    speaker: "mysteryEncounter:field_trip_speaker"
                  },
                  {
                    text: "mysteryEncounter:field_trip_lesson_learned",
                  }
                ];
                setEncounterExp(scene, scene.getParty().map(p => p.id), 50);
              } else {
                encounter.setDialogueToken("pokeName", pokemon.name);
                encounter.setDialogueToken("move", move.getName());
                encounter.dialogue.encounterOptionsDialogue.options[2].selected = [
                  {
                    text: "mysteryEncounter:field_trip_option_selected"
                  }
                ];
                setEncounterExp(scene, [pokemon.id], 100);
              }
              encounter.misc = {
                correctMove: correctMove
              };
              return true;
            }
          };
          return option;
        });
      };

      return selectPokemonForOption(scene, onPokemonSelected);
    })
    .withOptionPhase(async (scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter;
      if (encounter.misc.correctMove) {
        const modifiers = [
          generateModifierTypeOption(scene, modifierTypes.TEMP_STAT_BOOSTER, [TempBattleStat.ACC]),
          generateModifierTypeOption(scene, modifierTypes.TEMP_STAT_BOOSTER, [TempBattleStat.SPD]),
          generateModifierTypeOption(scene, modifierTypes.GREAT_BALL),
          generateModifierTypeOption(scene, modifierTypes.IV_SCANNER)
        ];

        setEncounterRewards(scene, { guaranteedModifierTypeOptions: modifiers, fillRemaining: false });
      }

      leaveEncounterWithoutBattle(scene, !encounter.misc.correctMove);
    })
    .build()
  )
  .build();
