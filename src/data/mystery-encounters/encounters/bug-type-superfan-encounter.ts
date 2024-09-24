import {
  EnemyPartyConfig, generateModifierType,
  generateModifierTypeOption,
  initBattleWithEnemyConfig,
  leaveEncounterWithoutBattle,
  selectOptionThenPokemon,
  selectPokemonForOption,
  setEncounterRewards,
  transitionMysteryEncounterIntroVisuals,
} from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import {
  getRandomPartyMemberFunc,
  trainerConfigs,
  TrainerPartyCompoundTemplate,
  TrainerPartyTemplate,
  TrainerSlot,
} from "#app/data/trainer-config";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { PartyMemberStrength } from "#enums/party-member-strength";
import BattleScene from "#app/battle-scene";
import { isNullOrUndefined, randSeedInt, randSeedShuffle } from "#app/utils";
import MysteryEncounter, { MysteryEncounterBuilder } from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { TrainerType } from "#enums/trainer-type";
import { Species } from "#enums/species";
import Pokemon, { PlayerPokemon, PokemonMove } from "#app/field/pokemon";
import { getEncounterText, showEncounterDialogue } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import { LearnMovePhase } from "#app/phases/learn-move-phase";
import { Moves } from "#enums/moves";
import { OptionSelectItem } from "#app/ui/abstact-option-select-ui-handler";
import { MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import {
  AttackTypeBoosterHeldItemTypeRequirement,
  CombinationPokemonRequirement,
  HeldItemRequirement,
  TypeRequirement
} from "#app/data/mystery-encounters/mystery-encounter-requirements";
import { Type } from "#app/data/type";
import { AttackTypeBoosterModifierType, ModifierTypeOption, modifierTypes } from "#app/modifier/modifier-type";
import {
  AttackTypeBoosterModifier,
  BypassSpeedChanceModifier,
  ContactHeldItemTransferChanceModifier,
  PokemonHeldItemModifier
} from "#app/modifier/modifier";
import i18next from "i18next";
import MoveInfoOverlay from "#app/ui/move-info-overlay";
import { allMoves } from "#app/data/move";
import { ModifierTier } from "#app/modifier/modifier-tier";
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/game-mode";

/** the i18n namespace for the encounter */
const namespace = "mysteryEncounter:bugTypeSuperfan";

const POOL_1_POKEMON = [
  Species.PARASECT,
  Species.VENOMOTH,
  Species.LEDIAN,
  Species.ARIADOS,
  Species.YANMA,
  Species.BEAUTIFLY,
  Species.DUSTOX,
  Species.MASQUERAIN,
  Species.NINJASK,
  Species.VOLBEAT,
  Species.ILLUMISE,
  Species.ANORITH,
  Species.KRICKETUNE,
  Species.WORMADAM,
  Species.MOTHIM,
  Species.SKORUPI,
  Species.JOLTIK,
  Species.LARVESTA,
  Species.VIVILLON,
  Species.CHARJABUG,
  Species.RIBOMBEE,
  Species.SPIDOPS,
  Species.LOKIX
];

const POOL_2_POKEMON = [
  Species.SCYTHER,
  Species.PINSIR,
  Species.HERACROSS,
  Species.FORRETRESS,
  Species.SCIZOR,
  Species.SHUCKLE,
  Species.SHEDINJA,
  Species.ARMALDO,
  Species.VESPIQUEN,
  Species.DRAPION,
  Species.YANMEGA,
  Species.LEAVANNY,
  Species.SCOLIPEDE,
  Species.CRUSTLE,
  Species.ESCAVALIER,
  Species.ACCELGOR,
  Species.GALVANTULA,
  Species.VIKAVOLT,
  Species.ARAQUANID,
  Species.ORBEETLE,
  Species.CENTISKORCH,
  Species.FROSMOTH,
  Species.KLEAVOR,
];

const POOL_3_POKEMON: { species: Species, formIndex?: number }[] = [
  {
    species: Species.PINSIR,
    formIndex: 1
  },
  {
    species: Species.SCIZOR,
    formIndex: 1
  },
  {
    species: Species.HERACROSS,
    formIndex: 1
  },
  {
    species: Species.ORBEETLE,
    formIndex: 1
  },
  {
    species: Species.CENTISKORCH,
    formIndex: 1
  },
  {
    species: Species.DURANT,
  },
  {
    species: Species.VOLCARONA,
  },
  {
    species: Species.GOLISOPOD,
  },
];

const POOL_4_POKEMON = [
  Species.GENESECT,
  Species.SLITHER_WING,
  Species.BUZZWOLE,
  Species.PHEROMOSA
];

const PHYSICAL_TUTOR_MOVES = [
  Moves.MEGAHORN,
  Moves.X_SCISSOR,
  Moves.ATTACK_ORDER,
  Moves.PIN_MISSILE,
  Moves.FIRST_IMPRESSION
];

const SPECIAL_TUTOR_MOVES = [
  Moves.SILVER_WIND,
  Moves.BUG_BUZZ,
  Moves.SIGNAL_BEAM,
  Moves.POLLEN_PUFF
];

const STATUS_TUTOR_MOVES = [
  Moves.STRING_SHOT,
  Moves.STICKY_WEB,
  Moves.SILK_TRAP,
  Moves.RAGE_POWDER,
  Moves.HEAL_ORDER
];

const MISC_TUTOR_MOVES = [
  Moves.BUG_BITE,
  Moves.LEECH_LIFE,
  Moves.DEFEND_ORDER,
  Moves.QUIVER_DANCE,
  Moves.TAIL_GLOW,
  Moves.INFESTATION,
  Moves.U_TURN
];

/**
 * Bug Type Superfan encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3810 | GitHub Issue #3810}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const BugTypeSuperfanEncounter: MysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.BUG_TYPE_SUPERFAN)
    .withEncounterTier(MysteryEncounterTier.GREAT)
    .withPrimaryPokemonRequirement(new CombinationPokemonRequirement(
      // Must have at least 1 Bug type on team, OR have a bug item somewhere on the team
      new HeldItemRequirement(["BypassSpeedChanceModifier", "ContactHeldItemTransferChanceModifier"], 1),
      new AttackTypeBoosterHeldItemTypeRequirement(Type.BUG, 1),
      new TypeRequirement(Type.BUG, false, 1)
    ))
    .withMaxAllowedEncounters(1)
    .withSceneWaveRangeRequirement(...CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES)
    .withIntroSpriteConfigs([]) // These are set in onInit()
    .withAutoHideIntroVisuals(false)
    .withIntroDialogue([
      {
        text: `${namespace}.intro`,
      },
      {
        speaker: `${namespace}.speaker`,
        text: `${namespace}.intro_dialogue`,
      },
    ])
    .withOnInit((scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter!;
      // Calculates what trainers are available for battle in the encounter

      // Bug type superfan trainer config
      const config = getTrainerConfigForWave(scene.currentBattle.waveIndex);
      const spriteKey = config.getSpriteKey();
      encounter.enemyPartyConfigs.push({
        trainerConfig: config,
        female: true,
      });

      encounter.spriteConfigs = [
        {
          spriteKey: spriteKey,
          fileRoot: "trainer",
          hasShadow: true,
        },
      ];

      const requiredItems = [
        generateModifierType(scene, modifierTypes.QUICK_CLAW),
        generateModifierType(scene, modifierTypes.GRIP_CLAW),
        generateModifierType(scene, modifierTypes.ATTACK_TYPE_BOOSTER, [Type.BUG]),
      ];

      const requiredItemString = requiredItems.map(m => m?.name ?? "unknown").join("/");
      encounter.setDialogueToken("requiredBugItems", requiredItemString);

      return true;
    })
    .withTitle(`${namespace}.title`)
    .withDescription(`${namespace}.description`)
    .withQuery(`${namespace}.query`)
    .withSimpleOption(
      {
        buttonLabel: `${namespace}.option.1.label`,
        buttonTooltip: `${namespace}.option.1.tooltip`,
        selected: [
          {
            speaker: `${namespace}.speaker`,
            text: `${namespace}.option.1.selected`,
          },
        ],
      },
      async (scene: BattleScene) => {
        // Select battle the bug trainer
        const encounter = scene.currentBattle.mysteryEncounter!;
        const config: EnemyPartyConfig = encounter.enemyPartyConfigs[0];

        // Init the moves available for tutor
        const moveTutorOptions: PokemonMove[] = [];
        moveTutorOptions.push(new PokemonMove(PHYSICAL_TUTOR_MOVES[randSeedInt(PHYSICAL_TUTOR_MOVES.length)]));
        moveTutorOptions.push(new PokemonMove(SPECIAL_TUTOR_MOVES[randSeedInt(SPECIAL_TUTOR_MOVES.length)]));
        moveTutorOptions.push(new PokemonMove(STATUS_TUTOR_MOVES[randSeedInt(STATUS_TUTOR_MOVES.length)]));
        moveTutorOptions.push(new PokemonMove(MISC_TUTOR_MOVES[randSeedInt(MISC_TUTOR_MOVES.length)]));
        encounter.misc = {
          moveTutorOptions
        };

        // Assigns callback that teaches move before continuing to rewards
        encounter.onRewards = doBugTypeMoveTutor;

        setEncounterRewards(scene, { fillRemaining: true });
        await transitionMysteryEncounterIntroVisuals(scene, true, true);
        await initBattleWithEnemyConfig(scene, config);
      }
    )
    .withOption(MysteryEncounterOptionBuilder
      .newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT)
      .withPrimaryPokemonRequirement(new TypeRequirement(Type.BUG, false, 1)) // Must have 1 Bug type on team
      .withDialogue({
        buttonLabel: `${namespace}.option.2.label`,
        buttonTooltip: `${namespace}.option.2.tooltip`,
        disabledButtonTooltip: `${namespace}.option.2.disabled_tooltip`
      })
      .withPreOptionPhase(async (scene: BattleScene) => {
        // Player shows off their bug types
        const encounter = scene.currentBattle.mysteryEncounter!;

        // Player gets different rewards depending on the number of bug types they have
        const numBugTypes = scene.getParty().filter(p => p.isOfType(Type.BUG, true)).length;
        const numBugTypesText = i18next.t(`${namespace}.numBugTypes`, { count: numBugTypes });
        encounter.setDialogueToken("numBugTypes", numBugTypesText);

        if (numBugTypes < 2) {
          setEncounterRewards(scene, { guaranteedModifierTypeFuncs: [modifierTypes.SUPER_LURE, modifierTypes.GREAT_BALL], fillRemaining: false });
          encounter.selectedOption!.dialogue!.selected = [
            {
              speaker: `${namespace}.speaker`,
              text: `${namespace}.option.2.selected_0_to_1`,
            },
          ];
        } else if (numBugTypes < 4) {
          setEncounterRewards(scene, { guaranteedModifierTypeFuncs: [modifierTypes.QUICK_CLAW, modifierTypes.MAX_LURE, modifierTypes.ULTRA_BALL], fillRemaining: false });
          encounter.selectedOption!.dialogue!.selected = [
            {
              speaker: `${namespace}.speaker`,
              text: `${namespace}.option.2.selected_2_to_3`,
            },
          ];
        } else if (numBugTypes < 6) {
          setEncounterRewards(scene, { guaranteedModifierTypeFuncs: [modifierTypes.GRIP_CLAW, modifierTypes.MAX_LURE, modifierTypes.ROGUE_BALL], fillRemaining: false });
          encounter.selectedOption!.dialogue!.selected = [
            {
              speaker: `${namespace}.speaker`,
              text: `${namespace}.option.2.selected_4_to_5`,
            },
          ];
        } else {
          // If player has any evolution/form change items that are valid for their party, will spawn one of those items in addition to a Master Ball
          const modifierOptions: ModifierTypeOption[] = [generateModifierTypeOption(scene, modifierTypes.MASTER_BALL)!, generateModifierTypeOption(scene, modifierTypes.MAX_LURE)!];
          const specialOptions: ModifierTypeOption[] = [];

          const nonRareEvolutionModifier = generateModifierTypeOption(scene, modifierTypes.EVOLUTION_ITEM);
          if (nonRareEvolutionModifier) {
            specialOptions.push(nonRareEvolutionModifier);
          }
          const rareEvolutionModifier = generateModifierTypeOption(scene, modifierTypes.RARE_EVOLUTION_ITEM);
          if (rareEvolutionModifier) {
            specialOptions.push(rareEvolutionModifier);
          }
          const formChangeModifier = generateModifierTypeOption(scene, modifierTypes.FORM_CHANGE_ITEM);
          if (formChangeModifier) {
            specialOptions.push(formChangeModifier);
          }
          if (specialOptions.length > 0) {
            modifierOptions.push(specialOptions[randSeedInt(specialOptions.length)]);
          }

          setEncounterRewards(scene, { guaranteedModifierTypeOptions: modifierOptions, fillRemaining: false });
          encounter.selectedOption!.dialogue!.selected = [
            {
              speaker: `${namespace}.speaker`,
              text: `${namespace}.option.2.selected_6`,
            },
          ];
        }
      })
      .withOptionPhase(async (scene: BattleScene) => {
        // Player shows off their bug types
        leaveEncounterWithoutBattle(scene);
      })
      .build())
    .withOption(MysteryEncounterOptionBuilder
      .newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT)
      .withPrimaryPokemonRequirement(new CombinationPokemonRequirement(
        // Meets one or both of the below reqs
        new HeldItemRequirement(["BypassSpeedChanceModifier", "ContactHeldItemTransferChanceModifier"], 1),
        new AttackTypeBoosterHeldItemTypeRequirement(Type.BUG, 1)
      ))
      .withDialogue({
        buttonLabel: `${namespace}.option.3.label`,
        buttonTooltip: `${namespace}.option.3.tooltip`,
        disabledButtonTooltip: `${namespace}.option.3.disabled_tooltip`,
        selected: [
          {
            text: `${namespace}.option.3.selected`,
          },
          {
            speaker: `${namespace}.speaker`,
            text: `${namespace}.option.3.selected_dialogue`,
          },
        ],
        secondOptionPrompt: `${namespace}.option.3.select_prompt`,
      })
      .withPreOptionPhase(async (scene: BattleScene): Promise<boolean> => {
        const encounter = scene.currentBattle.mysteryEncounter!;

        const onPokemonSelected = (pokemon: PlayerPokemon) => {
          // Get Pokemon held items and filter for valid ones
          const validItems = pokemon.getHeldItems().filter(item => {
            return (item instanceof BypassSpeedChanceModifier ||
              item instanceof ContactHeldItemTransferChanceModifier ||
              (item instanceof AttackTypeBoosterModifier && (item.type as AttackTypeBoosterModifierType).moveType === Type.BUG)) &&
              item.isTransferable;
          });

          return validItems.map((modifier: PokemonHeldItemModifier) => {
            const option: OptionSelectItem = {
              label: modifier.type.name,
              handler: () => {
                // Pokemon and item selected
                encounter.setDialogueToken("selectedItem", modifier.type.name);
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
          const hasValidItem = pokemon.getHeldItems().some(item => {
            return item instanceof BypassSpeedChanceModifier ||
              item instanceof ContactHeldItemTransferChanceModifier ||
              (item instanceof AttackTypeBoosterModifier && (item.type as AttackTypeBoosterModifierType).moveType === Type.BUG);
          });
          if (!hasValidItem) {
            return getEncounterText(scene, `${namespace}.option.3.invalid_selection`) ?? null;
          }

          return null;
        };

        return selectPokemonForOption(scene, onPokemonSelected, undefined, selectableFilter);
      })
      .withOptionPhase(async (scene: BattleScene) => {
        const encounter = scene.currentBattle.mysteryEncounter!;
        const modifier = encounter.misc.chosenModifier;

        // Remove the modifier if its stacks go to 0
        modifier.stackCount -= 1;
        if (modifier.stackCount === 0) {
          scene.removeModifier(modifier);
        }
        scene.updateModifiers(true, true);

        const bugNet = generateModifierTypeOption(scene, modifierTypes.MYSTERY_ENCOUNTER_GOLDEN_BUG_NET)!;
        bugNet.type.tier = ModifierTier.ROGUE;

        setEncounterRewards(scene, { guaranteedModifierTypeOptions: [bugNet], guaranteedModifierTypeFuncs: [modifierTypes.REVIVER_SEED], fillRemaining: false });
        leaveEncounterWithoutBattle(scene, true);
      })
      .build())
    .withOutroDialogue([
      {
        text: `${namespace}.outro`,
      },
    ])
    .build();

function getTrainerConfigForWave(waveIndex: number) {
  // Bug type superfan trainer config
  const config = trainerConfigs[TrainerType.BUG_TYPE_SUPERFAN].clone();
  config.name = i18next.t("trainerNames:bug_type_superfan");

  const pool3Copy = POOL_3_POKEMON.slice(0);
  randSeedShuffle(pool3Copy);
  const pool3Mon = pool3Copy.pop()!;

  if (waveIndex < 30) {
    // Use default template (2 AVG)
    config
      .setPartyMemberFunc(0, getRandomPartyMemberFunc([ Species.BEEDRILL ], TrainerSlot.TRAINER, true))
      .setPartyMemberFunc(1, getRandomPartyMemberFunc([ Species.BUTTERFREE ], TrainerSlot.TRAINER, true));
  } else if (waveIndex < 50) {
    config
      .setPartyTemplates(new TrainerPartyTemplate(3, PartyMemberStrength.AVERAGE))
      .setPartyMemberFunc(0, getRandomPartyMemberFunc([ Species.BEEDRILL ], TrainerSlot.TRAINER, true))
      .setPartyMemberFunc(1, getRandomPartyMemberFunc([ Species.BUTTERFREE ], TrainerSlot.TRAINER, true))
      .setPartyMemberFunc(2, getRandomPartyMemberFunc(POOL_1_POKEMON, TrainerSlot.TRAINER, true));
  } else if (waveIndex < 70) {
    config
      .setPartyTemplates(new TrainerPartyTemplate(4, PartyMemberStrength.AVERAGE))
      .setPartyMemberFunc(0, getRandomPartyMemberFunc([ Species.BEEDRILL ], TrainerSlot.TRAINER, true))
      .setPartyMemberFunc(1, getRandomPartyMemberFunc([ Species.BUTTERFREE ], TrainerSlot.TRAINER, true))
      .setPartyMemberFunc(2, getRandomPartyMemberFunc(POOL_1_POKEMON, TrainerSlot.TRAINER, true))
      .setPartyMemberFunc(3, getRandomPartyMemberFunc(POOL_2_POKEMON, TrainerSlot.TRAINER, true));
  } else if (waveIndex < 100) {
    config
      .setPartyTemplates(new TrainerPartyTemplate(5, PartyMemberStrength.AVERAGE))
      .setPartyMemberFunc(0, getRandomPartyMemberFunc([ Species.BEEDRILL ], TrainerSlot.TRAINER, true))
      .setPartyMemberFunc(1, getRandomPartyMemberFunc([ Species.BUTTERFREE ], TrainerSlot.TRAINER, true))
      .setPartyMemberFunc(2, getRandomPartyMemberFunc(POOL_1_POKEMON, TrainerSlot.TRAINER, true))
      .setPartyMemberFunc(3, getRandomPartyMemberFunc(POOL_2_POKEMON, TrainerSlot.TRAINER, true))
      .setPartyMemberFunc(4, getRandomPartyMemberFunc(POOL_2_POKEMON, TrainerSlot.TRAINER, true));
  } else if (waveIndex < 120) {
    config
      .setPartyTemplates(new TrainerPartyTemplate(5, PartyMemberStrength.AVERAGE))
      .setPartyMemberFunc(0, getRandomPartyMemberFunc([ Species.BEEDRILL ], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1;
        p.generateAndPopulateMoveset();
        p.generateName();
      }))
      .setPartyMemberFunc(1, getRandomPartyMemberFunc([ Species.BUTTERFREE ], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1;
        p.generateAndPopulateMoveset();
        p.generateName();
      }))
      .setPartyMemberFunc(2, getRandomPartyMemberFunc(POOL_2_POKEMON, TrainerSlot.TRAINER, true))
      .setPartyMemberFunc(3, getRandomPartyMemberFunc(POOL_2_POKEMON, TrainerSlot.TRAINER, true))
      .setPartyMemberFunc(4, getRandomPartyMemberFunc([pool3Mon.species], TrainerSlot.TRAINER, true, p => {
        if (!isNullOrUndefined(pool3Mon.formIndex)) {
          p.formIndex = pool3Mon.formIndex;
          p.generateAndPopulateMoveset();
          p.generateName();
        }
      }));
  } else if (waveIndex < 140) {
    randSeedShuffle(pool3Copy);
    const pool3Mon2 = pool3Copy.pop()!;
    config
      .setPartyTemplates(new TrainerPartyTemplate(5, PartyMemberStrength.AVERAGE))
      .setPartyMemberFunc(0, getRandomPartyMemberFunc([ Species.BEEDRILL ], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1;
        p.generateAndPopulateMoveset();
        p.generateName();
      }))
      .setPartyMemberFunc(1, getRandomPartyMemberFunc([ Species.BUTTERFREE ], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1;
        p.generateAndPopulateMoveset();
        p.generateName();
      }))
      .setPartyMemberFunc(2, getRandomPartyMemberFunc(POOL_2_POKEMON, TrainerSlot.TRAINER, true))
      .setPartyMemberFunc(3, getRandomPartyMemberFunc([pool3Mon.species], TrainerSlot.TRAINER, true, p => {
        if (!isNullOrUndefined(pool3Mon.formIndex)) {
          p.formIndex = pool3Mon.formIndex;
          p.generateAndPopulateMoveset();
          p.generateName();
        }
      }))
      .setPartyMemberFunc(4, getRandomPartyMemberFunc([pool3Mon2.species], TrainerSlot.TRAINER, true, p => {
        if (!isNullOrUndefined(pool3Mon2.formIndex)) {
          p.formIndex = pool3Mon2.formIndex;
          p.generateAndPopulateMoveset();
          p.generateName();
        }
      }));
  } else if (waveIndex < 160) {
    config
      .setPartyTemplates(new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(4, PartyMemberStrength.AVERAGE), new TrainerPartyTemplate(1, PartyMemberStrength.STRONG)))
      .setPartyMemberFunc(0, getRandomPartyMemberFunc([ Species.BEEDRILL ], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1;
        p.generateAndPopulateMoveset();
        p.generateName();
      }))
      .setPartyMemberFunc(1, getRandomPartyMemberFunc([ Species.BUTTERFREE ], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1;
        p.generateAndPopulateMoveset();
        p.generateName();
      }))
      .setPartyMemberFunc(2, getRandomPartyMemberFunc(POOL_2_POKEMON, TrainerSlot.TRAINER, true))
      .setPartyMemberFunc(3, getRandomPartyMemberFunc([pool3Mon.species], TrainerSlot.TRAINER, true, p => {
        if (!isNullOrUndefined(pool3Mon.formIndex)) {
          p.formIndex = pool3Mon.formIndex;
          p.generateAndPopulateMoveset();
          p.generateName();
        }
      }))
      .setPartyMemberFunc(4, getRandomPartyMemberFunc(POOL_4_POKEMON, TrainerSlot.TRAINER, true));
  } else {
    config
      .setPartyTemplates(new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(4, PartyMemberStrength.AVERAGE), new TrainerPartyTemplate(1, PartyMemberStrength.STRONG)))
      .setPartyMemberFunc(0, getRandomPartyMemberFunc([ Species.BEEDRILL ], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.formIndex = 1;
        p.generateAndPopulateMoveset();
        p.generateName();
      }))
      .setPartyMemberFunc(1, getRandomPartyMemberFunc([ Species.BUTTERFREE ], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.formIndex = 1;
        p.generateAndPopulateMoveset();
        p.generateName();
      }))
      .setPartyMemberFunc(2, getRandomPartyMemberFunc([pool3Mon.species], TrainerSlot.TRAINER, true, p => {
        if (!isNullOrUndefined(pool3Mon.formIndex)) {
          p.formIndex = pool3Mon.formIndex;
          p.generateAndPopulateMoveset();
          p.generateName();
        }
      }))
      .setPartyMemberFunc(3, getRandomPartyMemberFunc([pool3Mon.species], TrainerSlot.TRAINER, true, p => {
        if (!isNullOrUndefined(pool3Mon.formIndex)) {
          p.formIndex = pool3Mon.formIndex;
          p.generateAndPopulateMoveset();
          p.generateName();
        }
      }))
      .setPartyMemberFunc(4, getRandomPartyMemberFunc(POOL_4_POKEMON, TrainerSlot.TRAINER, true));
  }

  return config;
}

function doBugTypeMoveTutor(scene: BattleScene): Promise<void> {
  return new Promise<void>(async resolve => {
    const moveOptions = scene.currentBattle.mysteryEncounter!.misc.moveTutorOptions;
    await showEncounterDialogue(scene, `${namespace}.battle_won`, `${namespace}.speaker`);

    const overlayScale = 1;
    const moveInfoOverlay = new MoveInfoOverlay(scene, {
      delayVisibility: false,
      scale: overlayScale,
      onSide: true,
      right: true,
      x: 1,
      y: -MoveInfoOverlay.getHeight(overlayScale, true) - 1,
      width: (scene.game.canvas.width / 6) - 2,
    });
    scene.ui.add(moveInfoOverlay);

    const optionSelectItems = moveOptions.map((move: PokemonMove) => {
      const option: OptionSelectItem = {
        label: move.getName(),
        handler: () => {
          moveInfoOverlay.active = false;
          moveInfoOverlay.setVisible(false);
          return true;
        },
        onHover: () => {
          moveInfoOverlay.active = true;
          moveInfoOverlay.show(allMoves[move.moveId]);
        },
      };
      return option;
    });

    const onHoverOverCancel = () => {
      moveInfoOverlay.active = false;
      moveInfoOverlay.setVisible(false);
    };

    const result = await selectOptionThenPokemon(scene, optionSelectItems, `${namespace}.teach_move_prompt`, undefined, onHoverOverCancel);
    // let forceExit = !!result;
    if (!result) {
      moveInfoOverlay.active = false;
      moveInfoOverlay.setVisible(false);
    }

    // TODO: add menu to confirm player doesn't want to teach a move
    // while (!result && !forceExit) {
    //   // Didn't teach a move, ask the player to confirm they don't want to teach a move
    //   await showEncounterDialogue(scene, `${namespace}.confirm_no_teach`, `${namespace}.speaker`);
    //   const confirm = await new Promise<boolean>(confirmResolve => {
    //     scene.ui.setMode(Mode.CONFIRM, () => confirmResolve(true), () => confirmResolve(false));
    //   });
    //   scene.ui.clearText();
    //   await scene.ui.setMode(Mode.MESSAGE);
    //   if (confirm) {
    //     // No teach, break out of loop
    //     forceExit = true;
    //   } else {
    //     // Re-show learn menu
    //     result = await selectOptionThenPokemon(scene, optionSelectItems, `${namespace}.teach_move_prompt`, undefined, onHoverOverCancel);
    //     if (!result) {
    //       moveInfoOverlay.active = false;
    //       moveInfoOverlay.setVisible(false);
    //     }
    //   }
    // }

    // Option select complete, handle if they are learning a move
    if (result && result.selectedOptionIndex < moveOptions.length) {
      scene.unshiftPhase(new LearnMovePhase(scene, result.selectedPokemonIndex, moveOptions[result.selectedOptionIndex].moveId));
    }

    // Complete battle and go to rewards
    resolve();
  });
}
