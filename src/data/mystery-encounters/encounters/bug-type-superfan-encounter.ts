import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/constants";
import { globalScene } from "#app/global-scene";
import { allHeldItems, allMoves } from "#data/data-lists";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { PartyMemberStrength } from "#enums/party-member-strength";
import { PokemonType } from "#enums/pokemon-type";
import { RewardId } from "#enums/reward-id";
import { RarityTier } from "#enums/reward-tier";
import { SpeciesId } from "#enums/species-id";
import { TrainerItemId } from "#enums/trainer-item-id";
import { TrainerSlot } from "#enums/trainer-slot";
import { TrainerType } from "#enums/trainer-type";
import type { PlayerPokemon, Pokemon } from "#field/pokemon";
import type { RewardOption } from "#items/reward";
import { generateRewardOptionFromId } from "#items/reward-utils";
import { PokemonMove } from "#moves/pokemon-move";
import { getEncounterText, showEncounterDialogue } from "#mystery-encounters/encounter-dialogue-utils";
import type { EnemyPartyConfig } from "#mystery-encounters/encounter-phase-utils";
import {
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
  CombinationPokemonRequirement,
  HoldingItemRequirement,
  TypeRequirement,
} from "#mystery-encounters/mystery-encounter-requirements";
import { getRandomPartyMemberFunc, trainerConfigs } from "#trainers/trainer-config";
import { TrainerPartyCompoundTemplate, TrainerPartyTemplate } from "#trainers/trainer-party-template";
import type { OptionSelectItem } from "#ui/abstract-option-select-ui-handler";
import { MoveInfoOverlay } from "#ui/move-info-overlay";
import { randSeedInt, randSeedShuffle } from "#utils/common";
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
] as const;

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
] as const;

const POOL_3_POKEMON = [
  { species: SpeciesId.PINSIR, formIndex: 1 },
  { species: SpeciesId.SCIZOR, formIndex: 1 },
  { species: SpeciesId.HERACROSS, formIndex: 1 },
  { species: SpeciesId.ORBEETLE, formIndex: 1 },
  { species: SpeciesId.CENTISKORCH, formIndex: 1 },
  { species: SpeciesId.DURANT } as { species: SpeciesId.DURANT; formIndex: undefined },
  { species: SpeciesId.VOLCARONA } as { species: SpeciesId.VOLCARONA; formIndex: undefined },
  { species: SpeciesId.GOLISOPOD } as { species: SpeciesId.GOLISOPOD; formIndex: undefined },
] as const;

const POOL_4_POKEMON = [SpeciesId.GENESECT, SpeciesId.SLITHER_WING, SpeciesId.BUZZWOLE, SpeciesId.PHEROMOSA] as const;

const REQUIRED_ITEMS = [HeldItemId.QUICK_CLAW, HeldItemId.GRIP_CLAW, HeldItemId.SILVER_POWDER];

const PHYSICAL_TUTOR_MOVES = [
  MoveId.MEGAHORN,
  MoveId.ATTACK_ORDER,
  MoveId.BUG_BITE,
  MoveId.FIRST_IMPRESSION,
  MoveId.LUNGE,
] as const;

const SPECIAL_TUTOR_MOVES = [
  MoveId.SILVER_WIND,
  MoveId.SIGNAL_BEAM,
  MoveId.BUG_BUZZ,
  MoveId.POLLEN_PUFF,
  MoveId.STRUGGLE_BUG,
] as const;

const STATUS_TUTOR_MOVES = [
  MoveId.STRING_SHOT,
  MoveId.DEFEND_ORDER,
  MoveId.RAGE_POWDER,
  MoveId.STICKY_WEB,
  MoveId.SILK_TRAP,
] as const;

const MISC_TUTOR_MOVES = [
  MoveId.LEECH_LIFE,
  MoveId.U_TURN,
  MoveId.HEAL_ORDER,
  MoveId.QUIVER_DANCE,
  MoveId.INFESTATION,
] as const;

/**
 * Wave breakpoints that determine how strong to make the Bug-Type Superfan's team
 */
const WAVE_LEVEL_BREAKPOINTS = [30, 50, 70, 100, 120, 140, 160] as const;

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
      new HoldingItemRequirement(REQUIRED_ITEMS, 1),
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

    const requiredItemString = REQUIRED_ITEMS.map(m => allHeldItems[m].name ?? "unknown").join("/");
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

      // Assigns callback that teaches move before continuing to RewardId
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

        // Player gets different RewardId depending on the number of bug types they have
        const numBugTypes = globalScene.getPlayerParty().filter(p => p.isOfType(PokemonType.BUG, true)).length;
        const numBugTypesText = i18next.t(`${namespace}:numBugTypes`, {
          count: numBugTypes,
        });
        encounter.setDialogueToken("numBugTypes", numBugTypesText);

        if (numBugTypes < 2) {
          setEncounterRewards({
            guaranteedRewardSpecs: [RewardId.SUPER_LURE, RewardId.GREAT_BALL],
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
            guaranteedRewardSpecs: [HeldItemId.QUICK_CLAW, RewardId.MAX_LURE, RewardId.ULTRA_BALL],
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
            guaranteedRewardSpecs: [HeldItemId.GRIP_CLAW, RewardId.MAX_LURE, RewardId.ROGUE_BALL],
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
          const rewardOptions: RewardOption[] = [generateRewardOptionFromId(RewardId.MASTER_BALL)!];
          const specialOptions: RewardOption[] = [];

          if (!globalScene.trainerItems.hasItem(TrainerItemId.MEGA_BRACELET)) {
            rewardOptions.push(generateRewardOptionFromId(TrainerItemId.MEGA_BRACELET)!);
          }
          if (!globalScene.trainerItems.hasItem(TrainerItemId.DYNAMAX_BAND)) {
            rewardOptions.push(generateRewardOptionFromId(TrainerItemId.DYNAMAX_BAND)!);
          }
          const nonRareEvolutionReward = generateRewardOptionFromId(RewardId.EVOLUTION_ITEM);
          if (nonRareEvolutionReward) {
            specialOptions.push(nonRareEvolutionReward);
          }
          const rareEvolutionReward = generateRewardOptionFromId(RewardId.RARE_EVOLUTION_ITEM);
          if (rareEvolutionReward) {
            specialOptions.push(rareEvolutionReward);
          }
          const formChangeReward = generateRewardOptionFromId(RewardId.FORM_CHANGE_ITEM);
          if (formChangeReward) {
            specialOptions.push(formChangeReward);
          }
          const rareFormChangeReward = generateRewardOptionFromId(RewardId.RARE_FORM_CHANGE_ITEM);
          if (rareFormChangeReward) {
            specialOptions.push(rareFormChangeReward);
          }
          if (specialOptions.length > 0) {
            // TODO: should this use `randSeedItem`?
            rewardOptions.push(specialOptions[randSeedInt(specialOptions.length)]);
          }

          setEncounterRewards({
            guaranteedRewardOptions: rewardOptions,
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
          new HoldingItemRequirement(REQUIRED_ITEMS, 1),
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
          const validItems = pokemon.heldItemManager
            .getTransferableHeldItems()
            .filter(item => REQUIRED_ITEMS.some(i => i === item));

          return validItems.map((item: HeldItemId) => {
            const option: OptionSelectItem = {
              label: allHeldItems[item].name,
              handler: () => {
                // Pokemon and item selected
                encounter.setDialogueToken("selectedItem", allHeldItems[item].name);
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
          const hasValidItem = pokemon.getHeldItems().some(item => REQUIRED_ITEMS.some(i => i === item));
          if (!hasValidItem) {
            return getEncounterText(`${namespace}:option.3.invalidSelection`) ?? null;
          }

          return null;
        };

        return selectPokemonForOption(onPokemonSelected, undefined, selectableFilter);
      })
      .withOptionPhase(async () => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const lostItem = encounter.misc.chosenItem;
        const chosenPokemon: PlayerPokemon = encounter.misc.chosenPokemon;

        chosenPokemon.loseHeldItem(lostItem, false);
        globalScene.updateItems(true);

        const bugNet = generateRewardOptionFromId(TrainerItemId.GOLDEN_BUG_NET)!;
        bugNet.type.tier = RarityTier.ROGUE;

        setEncounterRewards({
          guaranteedRewardOptions: [bugNet],
          guaranteedRewardSpecs: [HeldItemId.REVIVER_SEED],
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

  const pool3Copy = randSeedShuffle(POOL_3_POKEMON.slice());
  // Bang is fine here, as we know pool3Copy has at least 1 entry
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
          if (pool3Mon.formIndex != null) {
            p.formIndex = pool3Mon.formIndex;
            p.generateAndPopulateMoveset();
            p.generateName();
          }
        }),
      );
  } else if (waveIndex < WAVE_LEVEL_BREAKPOINTS[5]) {
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
          if (pool3Mon.formIndex != null) {
            p.formIndex = pool3Mon.formIndex;
            p.generateAndPopulateMoveset();
            p.generateName();
          }
        }),
      )
      .setPartyMemberFunc(
        4,
        getRandomPartyMemberFunc([pool3Mon2.species], TrainerSlot.TRAINER, true, p => {
          if (pool3Mon2.formIndex != null) {
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
          if (pool3Mon.formIndex != null) {
            p.formIndex = pool3Mon.formIndex;
            p.generateAndPopulateMoveset();
            p.generateName();
          }
        }),
      )
      .setPartyMemberFunc(4, getRandomPartyMemberFunc(POOL_4_POKEMON, TrainerSlot.TRAINER, true));
  } else {
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
          if (pool3Mon.formIndex != null) {
            p.formIndex = pool3Mon.formIndex;
            p.generateAndPopulateMoveset();
            p.generateName();
          }
        }),
      )
      .setPartyMemberFunc(
        3,
        getRandomPartyMemberFunc([pool3Mon2.species], TrainerSlot.TRAINER, true, p => {
          if (pool3Mon2.formIndex != null) {
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

    // Complete battle and go to RewardId
    resolve();
  });
}
