import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/constants";
import { globalScene } from "#app/global-scene";
import { allMoves, modifierTypes } from "#data/data-lists";
import { ModifierTier } from "#enums/modifier-tier";
import { MoveId } from "#enums/move-id";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { PartyMemberStrength } from "#enums/party-member-strength";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { TrainerSlot } from "#enums/trainer-slot";
import { TrainerType } from "#enums/trainer-type";
import type { PlayerPokemon, Pokemon } from "#field/pokemon";
import type { PokemonHeldItemModifier } from "#modifiers/modifier";
import {
  AttackTypeBoosterModifier,
  BypassSpeedChanceModifier,
  ContactHeldItemTransferChanceModifier,
  GigantamaxAccessModifier,
  MegaEvolutionAccessModifier,
} from "#modifiers/modifier";
import type { AttackTypeBoosterModifierType, ModifierTypeOption } from "#modifiers/modifier-type";
import { PokemonMove } from "#moves/pokemon-move";
import { getEncounterText, showEncounterDialogue } from "#mystery-encounters/encounter-dialogue-utils";
import type { EnemyPartyConfig } from "#mystery-encounters/encounter-phase-utils";
import {
  generateModifierType,
  generateModifierTypeOption,
  initBattleWithEnemyConfig,
  leaveEncounterWithoutBattle,
  selectOptionThenPokemon,
  selectPokemonForOption,
  setEncounterRewards,
  transitionMysteryEncounterIntroVisuals,
} from "#mystery-encounters/encounter-phase-utils";
import { getSpriteKeysFromSpecies } from "#mystery-encounters/encounter-pokemon-utils";
import type { MysteryEncounter } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterBuilder } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterOptionBuilder } from "#mystery-encounters/mystery-encounter-option";
import {
  AttackTypeBoosterHeldItemTypeRequirement,
  CombinationPokemonRequirement,
  HeldItemRequirement,
  TypeRequirement,
} from "#mystery-encounters/mystery-encounter-requirements";
import { getRandomPartyMemberFunc, trainerConfigs } from "#trainers/trainer-config";
import { TrainerPartyCompoundTemplate, TrainerPartyTemplate } from "#trainers/trainer-party-template";
import { MoveInfoOverlay } from "#ui/containers/move-info-overlay";
import type { OptionSelectItem } from "#ui/handlers/abstract-option-select-ui-handler";
import { isNullOrUndefined, randSeedInt, randSeedShuffle } from "#utils/common";
import i18next from "i18next";

/** the i18n namespace for the encounter */
const namespace = "mysteryEncounters/bugTypeSuperfan";

const POOL_1_POKEMON = [
  SpeciesId.PARASECT,
  SpeciesId.VENOMOTH,
  SpeciesId.LEDIAN,
  SpeciesId.ARIADOS,
  SpeciesId.YANMA,
  SpeciesId.BEAUTIFLY,
  SpeciesId.DUSTOX,
  SpeciesId.MASQUERAIN,
  SpeciesId.NINJASK,
  SpeciesId.VOLBEAT,
  SpeciesId.ILLUMISE,
  SpeciesId.ANORITH,
  SpeciesId.KRICKETUNE,
  SpeciesId.WORMADAM,
  SpeciesId.MOTHIM,
  SpeciesId.SKORUPI,
  SpeciesId.JOLTIK,
  SpeciesId.LARVESTA,
  SpeciesId.VIVILLON,
  SpeciesId.CHARJABUG,
  SpeciesId.RIBOMBEE,
  SpeciesId.SPIDOPS,
  SpeciesId.LOKIX,
];

const POOL_2_POKEMON = [
  SpeciesId.SCYTHER,
  SpeciesId.PINSIR,
  SpeciesId.HERACROSS,
  SpeciesId.FORRETRESS,
  SpeciesId.SCIZOR,
  SpeciesId.SHUCKLE,
  SpeciesId.SHEDINJA,
  SpeciesId.ARMALDO,
  SpeciesId.VESPIQUEN,
  SpeciesId.DRAPION,
  SpeciesId.YANMEGA,
  SpeciesId.LEAVANNY,
  SpeciesId.SCOLIPEDE,
  SpeciesId.CRUSTLE,
  SpeciesId.ESCAVALIER,
  SpeciesId.ACCELGOR,
  SpeciesId.GALVANTULA,
  SpeciesId.VIKAVOLT,
  SpeciesId.ARAQUANID,
  SpeciesId.ORBEETLE,
  SpeciesId.CENTISKORCH,
  SpeciesId.FROSMOTH,
  SpeciesId.KLEAVOR,
];

const POOL_3_POKEMON: { species: SpeciesId; formIndex?: number }[] = [
  {
    species: SpeciesId.PINSIR,
    formIndex: 1,
  },
  {
    species: SpeciesId.SCIZOR,
    formIndex: 1,
  },
  {
    species: SpeciesId.HERACROSS,
    formIndex: 1,
  },
  {
    species: SpeciesId.ORBEETLE,
    formIndex: 1,
  },
  {
    species: SpeciesId.CENTISKORCH,
    formIndex: 1,
  },
  {
    species: SpeciesId.DURANT,
  },
  {
    species: SpeciesId.VOLCARONA,
  },
  {
    species: SpeciesId.GOLISOPOD,
  },
];

const POOL_4_POKEMON = [SpeciesId.GENESECT, SpeciesId.SLITHER_WING, SpeciesId.BUZZWOLE, SpeciesId.PHEROMOSA];

const PHYSICAL_TUTOR_MOVES = [
  MoveId.MEGAHORN,
  MoveId.ATTACK_ORDER,
  MoveId.BUG_BITE,
  MoveId.FIRST_IMPRESSION,
  MoveId.LUNGE,
];

const SPECIAL_TUTOR_MOVES = [
  MoveId.SILVER_WIND,
  MoveId.SIGNAL_BEAM,
  MoveId.BUG_BUZZ,
  MoveId.POLLEN_PUFF,
  MoveId.STRUGGLE_BUG,
];

const STATUS_TUTOR_MOVES = [
  MoveId.STRING_SHOT,
  MoveId.DEFEND_ORDER,
  MoveId.RAGE_POWDER,
  MoveId.STICKY_WEB,
  MoveId.SILK_TRAP,
];

const MISC_TUTOR_MOVES = [MoveId.LEECH_LIFE, MoveId.U_TURN, MoveId.HEAL_ORDER, MoveId.QUIVER_DANCE, MoveId.INFESTATION];

/**
 * Wave breakpoints that determine how strong to make the Bug-Type Superfan's team
 */
const WAVE_LEVEL_BREAKPOINTS = [30, 50, 70, 100, 120, 140, 160];

/**
 * Bug Type Superfan encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3820 | GitHub Issue #3820}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const BugTypeSuperfanEncounter: MysteryEncounter = MysteryEncounterBuilder.withEncounterType(
  MysteryEncounterType.BUG_TYPE_SUPERFAN,
)
  .withEncounterTier(MysteryEncounterTier.GREAT)
  .withPrimaryPokemonRequirement(
    CombinationPokemonRequirement.Some(
      // Must have at least 1 Bug type on team, OR have a bug item somewhere on the team
      new HeldItemRequirement(["BypassSpeedChanceModifier", "ContactHeldItemTransferChanceModifier"], 1),
      new AttackTypeBoosterHeldItemTypeRequirement(PokemonType.BUG, 1),
      new TypeRequirement(PokemonType.BUG, false, 1),
    ),
  )
  .withMaxAllowedEncounters(1)
  .withSceneWaveRangeRequirement(...CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES)
  .withIntroSpriteConfigs([]) // These are set in onInit()
  .withAutoHideIntroVisuals(false)
  .withIntroDialogue([
    {
      text: `${namespace}:intro`,
    },
    {
      speaker: `${namespace}:speaker`,
      text: `${namespace}:introDialogue`,
    },
  ])
  .withOnInit(() => {
    const encounter = globalScene.currentBattle.mysteryEncounter!;
    // Calculates what trainers are available for battle in the encounter

    // Bug type superfan trainer config
    const config = getTrainerConfigForWave(globalScene.currentBattle.waveIndex);
    const spriteKey = config.getSpriteKey();
    encounter.enemyPartyConfigs.push({
      trainerConfig: config,
      female: true,
    });

    let beedrillKeys: { spriteKey: string; fileRoot: string };
    let butterfreeKeys: { spriteKey: string; fileRoot: string };
    if (globalScene.currentBattle.waveIndex < WAVE_LEVEL_BREAKPOINTS[3]) {
      beedrillKeys = getSpriteKeysFromSpecies(SpeciesId.BEEDRILL, false);
      butterfreeKeys = getSpriteKeysFromSpecies(SpeciesId.BUTTERFREE, false);
    } else {
      // Mega Beedrill/Gmax Butterfree
      beedrillKeys = getSpriteKeysFromSpecies(SpeciesId.BEEDRILL, false, 1);
      butterfreeKeys = getSpriteKeysFromSpecies(SpeciesId.BUTTERFREE, false, 1);
    }

    encounter.spriteConfigs = [
      {
        spriteKey: beedrillKeys.spriteKey,
        fileRoot: beedrillKeys.fileRoot,
        hasShadow: true,
        repeat: true,
        isPokemon: true,
        x: -30,
        tint: 0.15,
        y: -4,
        yShadow: -4,
      },
      {
        spriteKey: butterfreeKeys.spriteKey,
        fileRoot: butterfreeKeys.fileRoot,
        hasShadow: true,
        repeat: true,
        isPokemon: true,
        x: 30,
        tint: 0.15,
        y: -4,
        yShadow: -4,
      },
      {
        spriteKey,
        fileRoot: "trainer",
        hasShadow: true,
        x: 4,
        y: 7,
        yShadow: 7,
      },
    ];

    const requiredItems = [
      generateModifierType(modifierTypes.QUICK_CLAW),
      generateModifierType(modifierTypes.GRIP_CLAW),
      generateModifierType(modifierTypes.ATTACK_TYPE_BOOSTER, [PokemonType.BUG]),
    ];

    const requiredItemString = requiredItems.map(m => m?.name ?? "unknown").join("/");
    encounter.setDialogueToken("requiredBugItems", requiredItemString);

    return true;
  })
  .setLocalizationKey(`${namespace}`)
  .withTitle(`${namespace}:title`)
  .withDescription(`${namespace}:description`)
  .withQuery(`${namespace}:query`)
  .withSimpleOption(
    {
      buttonLabel: `${namespace}:option.1.label`,
      buttonTooltip: `${namespace}:option.1.tooltip`,
      selected: [
        {
          speaker: `${namespace}:speaker`,
          text: `${namespace}:option.1.selected`,
        },
      ],
    },
    async () => {
      // Select battle the bug trainer
      const encounter = globalScene.currentBattle.mysteryEncounter!;
      const config: EnemyPartyConfig = encounter.enemyPartyConfigs[0];

      // Init the moves available for tutor
      const moveTutorOptions: PokemonMove[] = [];
      // TODO: should this use `randSeedItem`?
      moveTutorOptions.push(new PokemonMove(PHYSICAL_TUTOR_MOVES[randSeedInt(PHYSICAL_TUTOR_MOVES.length)]));
      moveTutorOptions.push(new PokemonMove(SPECIAL_TUTOR_MOVES[randSeedInt(SPECIAL_TUTOR_MOVES.length)]));
      moveTutorOptions.push(new PokemonMove(STATUS_TUTOR_MOVES[randSeedInt(STATUS_TUTOR_MOVES.length)]));
      moveTutorOptions.push(new PokemonMove(MISC_TUTOR_MOVES[randSeedInt(MISC_TUTOR_MOVES.length)]));
      encounter.misc = {
        moveTutorOptions,
      };

      // Assigns callback that teaches move before continuing to rewards
      encounter.onRewards = doBugTypeMoveTutor;

      setEncounterRewards({ fillRemaining: true });
      await transitionMysteryEncounterIntroVisuals(true, true);
      await initBattleWithEnemyConfig(config);
    },
  )
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT)
      .withPrimaryPokemonRequirement(new TypeRequirement(PokemonType.BUG, false, 1)) // Must have 1 Bug type on team
      .withDialogue({
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: `${namespace}:option.2.tooltip`,
        disabledButtonTooltip: `${namespace}:option.2.disabledTooltip`,
      })
      .withPreOptionPhase(async () => {
        // Player shows off their bug types
        const encounter = globalScene.currentBattle.mysteryEncounter!;

        // Player gets different rewards depending on the number of bug types they have
        const numBugTypes = globalScene.getPlayerParty().filter(p => p.isOfType(PokemonType.BUG, true)).length;
        const numBugTypesText = i18next.t(`${namespace}:numBugTypes`, {
          count: numBugTypes,
        });
        encounter.setDialogueToken("numBugTypes", numBugTypesText);

        if (numBugTypes < 2) {
          setEncounterRewards({
            guaranteedModifierTypeFuncs: [modifierTypes.SUPER_LURE, modifierTypes.GREAT_BALL],
            fillRemaining: false,
          });
          encounter.selectedOption!.dialogue!.selected = [
            {
              speaker: `${namespace}:speaker`,
              text: `${namespace}:option.2.selected0To1`,
            },
          ];
        } else if (numBugTypes < 4) {
          setEncounterRewards({
            guaranteedModifierTypeFuncs: [modifierTypes.QUICK_CLAW, modifierTypes.MAX_LURE, modifierTypes.ULTRA_BALL],
            fillRemaining: false,
          });
          encounter.selectedOption!.dialogue!.selected = [
            {
              speaker: `${namespace}:speaker`,
              text: `${namespace}:option.2.selected2To3`,
            },
          ];
        } else if (numBugTypes < 6) {
          setEncounterRewards({
            guaranteedModifierTypeFuncs: [modifierTypes.GRIP_CLAW, modifierTypes.MAX_LURE, modifierTypes.ROGUE_BALL],
            fillRemaining: false,
          });
          encounter.selectedOption!.dialogue!.selected = [
            {
              speaker: `${namespace}:speaker`,
              text: `${namespace}:option.2.selected4To5`,
            },
          ];
        } else {
          // If the player has any evolution/form change items that are valid for their party,
          // spawn one of those items in addition to Dynamax Band, Mega Band, and Master Ball
          const modifierOptions: ModifierTypeOption[] = [generateModifierTypeOption(modifierTypes.MASTER_BALL)!];
          const specialOptions: ModifierTypeOption[] = [];

          if (!globalScene.findModifier(m => m instanceof MegaEvolutionAccessModifier)) {
            modifierOptions.push(generateModifierTypeOption(modifierTypes.MEGA_BRACELET)!);
          }
          if (!globalScene.findModifier(m => m instanceof GigantamaxAccessModifier)) {
            modifierOptions.push(generateModifierTypeOption(modifierTypes.DYNAMAX_BAND)!);
          }
          const nonRareEvolutionModifier = generateModifierTypeOption(modifierTypes.EVOLUTION_ITEM);
          if (nonRareEvolutionModifier) {
            specialOptions.push(nonRareEvolutionModifier);
          }
          const rareEvolutionModifier = generateModifierTypeOption(modifierTypes.RARE_EVOLUTION_ITEM);
          if (rareEvolutionModifier) {
            specialOptions.push(rareEvolutionModifier);
          }
          const formChangeModifier = generateModifierTypeOption(modifierTypes.FORM_CHANGE_ITEM);
          if (formChangeModifier) {
            specialOptions.push(formChangeModifier);
          }
          const rareFormChangeModifier = generateModifierTypeOption(modifierTypes.RARE_FORM_CHANGE_ITEM);
          if (rareFormChangeModifier) {
            specialOptions.push(rareFormChangeModifier);
          }
          if (specialOptions.length > 0) {
            // TODO: should this use `randSeedItem`?
            modifierOptions.push(specialOptions[randSeedInt(specialOptions.length)]);
          }

          setEncounterRewards({
            guaranteedModifierTypeOptions: modifierOptions,
            fillRemaining: false,
          });
          encounter.selectedOption!.dialogue!.selected = [
            {
              speaker: `${namespace}:speaker`,
              text: `${namespace}:option.2.selected6`,
            },
          ];
        }
      })
      .withOptionPhase(async () => {
        // Player shows off their bug types
        leaveEncounterWithoutBattle();
      })
      .build(),
  )
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT)
      .withPrimaryPokemonRequirement(
        CombinationPokemonRequirement.Some(
          // Meets one or both of the below reqs
          new HeldItemRequirement(["BypassSpeedChanceModifier", "ContactHeldItemTransferChanceModifier"], 1),
          new AttackTypeBoosterHeldItemTypeRequirement(PokemonType.BUG, 1),
        ),
      )
      .withDialogue({
        buttonLabel: `${namespace}:option.3.label`,
        buttonTooltip: `${namespace}:option.3.tooltip`,
        disabledButtonTooltip: `${namespace}:option.3.disabledTooltip`,
        selected: [
          {
            text: `${namespace}:option.3.selected`,
          },
          {
            speaker: `${namespace}:speaker`,
            text: `${namespace}:option.3.selectedDialogue`,
          },
        ],
        secondOptionPrompt: `${namespace}:option.3.selectPrompt`,
      })
      .withPreOptionPhase(async (): Promise<boolean> => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;

        const onPokemonSelected = (pokemon: PlayerPokemon) => {
          // Get Pokemon held items and filter for valid ones
          const validItems = pokemon.getHeldItems().filter(item => {
            return (
              (item instanceof BypassSpeedChanceModifier
                || item instanceof ContactHeldItemTransferChanceModifier
                || (item instanceof AttackTypeBoosterModifier
                  && (item.type as AttackTypeBoosterModifierType).moveType === PokemonType.BUG))
              && item.isTransferable
            );
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
            return (
              item instanceof BypassSpeedChanceModifier
              || item instanceof ContactHeldItemTransferChanceModifier
              || (item instanceof AttackTypeBoosterModifier
                && (item.type as AttackTypeBoosterModifierType).moveType === PokemonType.BUG)
            );
          });
          if (!hasValidItem) {
            return getEncounterText(`${namespace}:option.3.invalidSelection`) ?? null;
          }

          return null;
        };

        return selectPokemonForOption(onPokemonSelected, undefined, selectableFilter);
      })
      .withOptionPhase(async () => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const modifier = encounter.misc.chosenModifier;
        const chosenPokemon: PlayerPokemon = encounter.misc.chosenPokemon;

        chosenPokemon.loseHeldItem(modifier, false);
        globalScene.updateModifiers(true, true);

        const bugNet = generateModifierTypeOption(modifierTypes.MYSTERY_ENCOUNTER_GOLDEN_BUG_NET)!;
        bugNet.type.tier = ModifierTier.ROGUE;

        setEncounterRewards({
          guaranteedModifierTypeOptions: [bugNet],
          guaranteedModifierTypeFuncs: [modifierTypes.REVIVER_SEED],
          fillRemaining: false,
        });
        leaveEncounterWithoutBattle(true);
      })
      .build(),
  )
  .withOutroDialogue([
    {
      text: `${namespace}:outro`,
    },
  ])
  .build();

function getTrainerConfigForWave(waveIndex: number) {
  // Bug type superfan trainer config
  const config = trainerConfigs[TrainerType.BUG_TYPE_SUPERFAN].clone();
  config.name = i18next.t("trainerNames:bugTypeSuperfan");

  let pool3Copy = POOL_3_POKEMON.slice(0);
  pool3Copy = randSeedShuffle(pool3Copy);
  const pool3Mon = pool3Copy.pop()!;

  if (waveIndex < WAVE_LEVEL_BREAKPOINTS[0]) {
    // Use default template (2 AVG)
    config
      .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.BEEDRILL], TrainerSlot.TRAINER, true))
      .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.BUTTERFREE], TrainerSlot.TRAINER, true));
  } else if (waveIndex < WAVE_LEVEL_BREAKPOINTS[1]) {
    config
      .setPartyTemplates(new TrainerPartyTemplate(3, PartyMemberStrength.AVERAGE))
      .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.BEEDRILL], TrainerSlot.TRAINER, true))
      .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.BUTTERFREE], TrainerSlot.TRAINER, true))
      .setPartyMemberFunc(2, getRandomPartyMemberFunc(POOL_1_POKEMON, TrainerSlot.TRAINER, true));
  } else if (waveIndex < WAVE_LEVEL_BREAKPOINTS[2]) {
    config
      .setPartyTemplates(new TrainerPartyTemplate(4, PartyMemberStrength.AVERAGE))
      .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.BEEDRILL], TrainerSlot.TRAINER, true))
      .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.BUTTERFREE], TrainerSlot.TRAINER, true))
      .setPartyMemberFunc(2, getRandomPartyMemberFunc(POOL_1_POKEMON, TrainerSlot.TRAINER, true))
      .setPartyMemberFunc(3, getRandomPartyMemberFunc(POOL_2_POKEMON, TrainerSlot.TRAINER, true));
  } else if (waveIndex < WAVE_LEVEL_BREAKPOINTS[3]) {
    config
      .setPartyTemplates(new TrainerPartyTemplate(5, PartyMemberStrength.AVERAGE))
      .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.BEEDRILL], TrainerSlot.TRAINER, true))
      .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.BUTTERFREE], TrainerSlot.TRAINER, true))
      .setPartyMemberFunc(2, getRandomPartyMemberFunc(POOL_1_POKEMON, TrainerSlot.TRAINER, true))
      .setPartyMemberFunc(3, getRandomPartyMemberFunc(POOL_2_POKEMON, TrainerSlot.TRAINER, true))
      .setPartyMemberFunc(4, getRandomPartyMemberFunc(POOL_2_POKEMON, TrainerSlot.TRAINER, true));
  } else if (waveIndex < WAVE_LEVEL_BREAKPOINTS[4]) {
    config
      .setPartyTemplates(new TrainerPartyTemplate(5, PartyMemberStrength.AVERAGE))
      .setPartyMemberFunc(
        0,
        getRandomPartyMemberFunc([SpeciesId.BEEDRILL], TrainerSlot.TRAINER, true, p => {
          p.formIndex = 1;
          p.generateAndPopulateMoveset();
          p.generateName();
        }),
      )
      .setPartyMemberFunc(
        1,
        getRandomPartyMemberFunc([SpeciesId.BUTTERFREE], TrainerSlot.TRAINER, true, p => {
          p.formIndex = 1;
          p.generateAndPopulateMoveset();
          p.generateName();
        }),
      )
      .setPartyMemberFunc(2, getRandomPartyMemberFunc(POOL_2_POKEMON, TrainerSlot.TRAINER, true))
      .setPartyMemberFunc(3, getRandomPartyMemberFunc(POOL_2_POKEMON, TrainerSlot.TRAINER, true))
      .setPartyMemberFunc(
        4,
        getRandomPartyMemberFunc([pool3Mon.species], TrainerSlot.TRAINER, true, p => {
          if (!isNullOrUndefined(pool3Mon.formIndex)) {
            p.formIndex = pool3Mon.formIndex;
            p.generateAndPopulateMoveset();
            p.generateName();
          }
        }),
      );
  } else if (waveIndex < WAVE_LEVEL_BREAKPOINTS[5]) {
    pool3Copy = randSeedShuffle(pool3Copy);
    const pool3Mon2 = pool3Copy.pop()!;
    config
      .setPartyTemplates(new TrainerPartyTemplate(5, PartyMemberStrength.AVERAGE))
      .setPartyMemberFunc(
        0,
        getRandomPartyMemberFunc([SpeciesId.BEEDRILL], TrainerSlot.TRAINER, true, p => {
          p.formIndex = 1;
          p.generateAndPopulateMoveset();
          p.generateName();
        }),
      )
      .setPartyMemberFunc(
        1,
        getRandomPartyMemberFunc([SpeciesId.BUTTERFREE], TrainerSlot.TRAINER, true, p => {
          p.formIndex = 1;
          p.generateAndPopulateMoveset();
          p.generateName();
        }),
      )
      .setPartyMemberFunc(2, getRandomPartyMemberFunc(POOL_2_POKEMON, TrainerSlot.TRAINER, true))
      .setPartyMemberFunc(
        3,
        getRandomPartyMemberFunc([pool3Mon.species], TrainerSlot.TRAINER, true, p => {
          if (!isNullOrUndefined(pool3Mon.formIndex)) {
            p.formIndex = pool3Mon.formIndex;
            p.generateAndPopulateMoveset();
            p.generateName();
          }
        }),
      )
      .setPartyMemberFunc(
        4,
        getRandomPartyMemberFunc([pool3Mon2.species], TrainerSlot.TRAINER, true, p => {
          if (!isNullOrUndefined(pool3Mon2.formIndex)) {
            p.formIndex = pool3Mon2.formIndex;
            p.generateAndPopulateMoveset();
            p.generateName();
          }
        }),
      );
  } else if (waveIndex < WAVE_LEVEL_BREAKPOINTS[6]) {
    config
      .setPartyTemplates(
        new TrainerPartyCompoundTemplate(
          new TrainerPartyTemplate(4, PartyMemberStrength.AVERAGE),
          new TrainerPartyTemplate(1, PartyMemberStrength.STRONG),
        ),
      )
      .setPartyMemberFunc(
        0,
        getRandomPartyMemberFunc([SpeciesId.BEEDRILL], TrainerSlot.TRAINER, true, p => {
          p.formIndex = 1;
          p.generateAndPopulateMoveset();
          p.generateName();
        }),
      )
      .setPartyMemberFunc(
        1,
        getRandomPartyMemberFunc([SpeciesId.BUTTERFREE], TrainerSlot.TRAINER, true, p => {
          p.formIndex = 1;
          p.generateAndPopulateMoveset();
          p.generateName();
        }),
      )
      .setPartyMemberFunc(2, getRandomPartyMemberFunc(POOL_2_POKEMON, TrainerSlot.TRAINER, true))
      .setPartyMemberFunc(
        3,
        getRandomPartyMemberFunc([pool3Mon.species], TrainerSlot.TRAINER, true, p => {
          if (!isNullOrUndefined(pool3Mon.formIndex)) {
            p.formIndex = pool3Mon.formIndex;
            p.generateAndPopulateMoveset();
            p.generateName();
          }
        }),
      )
      .setPartyMemberFunc(4, getRandomPartyMemberFunc(POOL_4_POKEMON, TrainerSlot.TRAINER, true));
  } else {
    pool3Copy = randSeedShuffle(pool3Copy);
    const pool3Mon2 = pool3Copy.pop()!;
    config
      .setPartyTemplates(
        new TrainerPartyCompoundTemplate(
          new TrainerPartyTemplate(4, PartyMemberStrength.AVERAGE),
          new TrainerPartyTemplate(1, PartyMemberStrength.STRONG),
        ),
      )
      .setPartyMemberFunc(
        0,
        getRandomPartyMemberFunc([SpeciesId.BEEDRILL], TrainerSlot.TRAINER, true, p => {
          p.setBoss(true, 2);
          p.formIndex = 1;
          p.generateAndPopulateMoveset();
          p.generateName();
        }),
      )
      .setPartyMemberFunc(
        1,
        getRandomPartyMemberFunc([SpeciesId.BUTTERFREE], TrainerSlot.TRAINER, true, p => {
          p.setBoss(true, 2);
          p.formIndex = 1;
          p.generateAndPopulateMoveset();
          p.generateName();
        }),
      )
      .setPartyMemberFunc(
        2,
        getRandomPartyMemberFunc([pool3Mon.species], TrainerSlot.TRAINER, true, p => {
          if (!isNullOrUndefined(pool3Mon.formIndex)) {
            p.formIndex = pool3Mon.formIndex;
            p.generateAndPopulateMoveset();
            p.generateName();
          }
        }),
      )
      .setPartyMemberFunc(
        3,
        getRandomPartyMemberFunc([pool3Mon2.species], TrainerSlot.TRAINER, true, p => {
          if (!isNullOrUndefined(pool3Mon2.formIndex)) {
            p.formIndex = pool3Mon2.formIndex;
            p.generateAndPopulateMoveset();
            p.generateName();
          }
        }),
      )
      .setPartyMemberFunc(4, getRandomPartyMemberFunc(POOL_4_POKEMON, TrainerSlot.TRAINER, true));
  }

  return config;
}

function doBugTypeMoveTutor(): Promise<void> {
  // biome-ignore lint/suspicious/noAsyncPromiseExecutor: TODO explain
  return new Promise<void>(async resolve => {
    const moveOptions = globalScene.currentBattle.mysteryEncounter!.misc.moveTutorOptions;
    await showEncounterDialogue(`${namespace}:battleWon`, `${namespace}:speaker`);

    const moveInfoOverlay = new MoveInfoOverlay({
      delayVisibility: false,
      onSide: true,
      right: true,
      x: 1,
      y: -MoveInfoOverlay.getHeight(true) - 1,
      width: globalScene.scaledCanvas.width - 2,
    });
    globalScene.ui.add(moveInfoOverlay);

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

    const result = await selectOptionThenPokemon(
      optionSelectItems,
      `${namespace}:teachMovePrompt`,
      undefined,
      onHoverOverCancel,
    );
    // let forceExit = !!result;
    if (!result) {
      moveInfoOverlay.active = false;
      moveInfoOverlay.setVisible(false);
    }

    // TODO: add menu to confirm player doesn't want to teach a move?

    // Option select complete, handle if they are learning a move
    if (result && result.selectedOptionIndex < moveOptions.length) {
      globalScene.phaseManager.unshiftNew(
        "LearnMovePhase",
        result.selectedPokemonIndex,
        moveOptions[result.selectedOptionIndex].moveId,
      );
    }

    // Complete battle and go to rewards
    resolve();
  });
}
