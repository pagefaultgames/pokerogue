import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { globalScene } from "#app/global-scene";
import type MysteryEncounter from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterBuilder } from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import {
  type EnemyPartyConfig,
  initBattleWithEnemyConfig,
  leaveEncounterWithoutBattle,
  selectOptionThenPokemon,
  setEncounterRewards,
  transitionMysteryEncounterIntroVisuals,
} from "../utils/encounter-phase-utils";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import {
  AbilityRequirement,
  AnyCombinationPokemonRequirement,
  TypeRequirement,
} from "../mystery-encounter-requirements";
import { PokemonType } from "#enums/pokemon-type";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { randSeedInt, randSeedShuffle } from "#app/utils/common";
import type { PlayerPokemon } from "#app/field/pokemon";
import { PokemonMove } from "#app/data/moves/pokemon-move";
import i18next from "i18next";
import MoveInfoOverlay from "#app/ui/move-info-overlay";
import { showEncounterDialogue } from "../utils/encounter-dialogue-utils";
import type { OptionSelectItem } from "#app/ui/abstact-option-select-ui-handler";
import { allMoves, modifierTypes } from "#app/data/data-lists";
import { LearnMovePhase } from "#app/phases/learn-move-phase";
import { TrainerPartyTemplate } from "#app/data/trainers/TrainerPartyTemplate";
import { getRandomPartyMemberFunc, type TrainerConfig, trainerConfigs } from "#app/data/trainers/trainer-config";
import { TrainerType } from "#enums/trainer-type";
import { PartyMemberStrength } from "#enums/party-member-strength";
import { TrainerSlot } from "#enums/trainer-slot";

/** The i18n namespace for the encounter */
const namespace = "mysteryEncounters/skyBattle";

const SKY_BATTLE_WAVES: [number, number] = [50, 180];

/**
 * These pokemon come from serebii's
 * {@link https://www.serebii.net/xy/skybattles.shtml | Sky Battle Page}
 * Also pokemon that are expected to fly (e.g beedril and mew)
 */
const POOL_0_POKEMON = [
  SpeciesId.CHARIZARD,
  SpeciesId.BUTTERFREE,
  SpeciesId.BEEDRILL,
  SpeciesId.PIDGEOTTO,
  SpeciesId.PIDGEOT,
  SpeciesId.FEAROW,
  SpeciesId.ZUBAT,
  SpeciesId.GOLBAT,
  SpeciesId.VENOMOTH,
  SpeciesId.HAUNTER,
  SpeciesId.KOFFING,
  SpeciesId.WEEZING,
  SpeciesId.SCYTHER,
  SpeciesId.GYARADOS,
  SpeciesId.AERODACTYL,
  SpeciesId.ARTICUNO,
  SpeciesId.ZAPDOS,
  SpeciesId.MOLTRES,
  SpeciesId.DRAGONITE,
  SpeciesId.MEWTWO, // ?
  SpeciesId.MEW,
  SpeciesId.NOCTOWL,
  SpeciesId.LEDYBA,
  SpeciesId.LEDIAN,
  SpeciesId.CROBAT,
  SpeciesId.TOGETIC,
  SpeciesId.XATU,
  SpeciesId.HOPPIP,
  SpeciesId.SKIPLOOM,
  SpeciesId.JUMPLUFF,
  SpeciesId.YANMA,
  SpeciesId.MISDREAVUS,
  SpeciesId.UNOWN,
  SpeciesId.FORRETRESS, // ?
  SpeciesId.GLIGAR,
  SpeciesId.MANTINE,
  SpeciesId.SKARMORY,
  SpeciesId.LUGIA,
  SpeciesId.HO_OH,
  SpeciesId.CELEBI,
  SpeciesId.BEAUTIFLY,
  SpeciesId.DUSTOX,
  SpeciesId.SWELLOW,
  SpeciesId.WINGULL,
  SpeciesId.PELIPPER,
  SpeciesId.MASQUERAIN,
  SpeciesId.NINJASK,
  SpeciesId.SHEDINJA, // ?
  SpeciesId.VIBRAVA,
  SpeciesId.FLYGON,
  SpeciesId.SWABLU,
  SpeciesId.ALTARIA,
  SpeciesId.LUNATONE,
  SpeciesId.SOLROCK,
  SpeciesId.BALTOY,
  SpeciesId.CLAYDOL,
  SpeciesId.DUSKULL,
  SpeciesId.TROPIUS,
  SpeciesId.CHIMECHO,
  SpeciesId.GLALIE, // ?
  SpeciesId.SALAMENCE,
  SpeciesId.METANG,
  SpeciesId.METAGROSS, // ?
  SpeciesId.LATIAS,
  SpeciesId.LATIOS,
  SpeciesId.RAYQUAZA,
  SpeciesId.JIRACHI,
  SpeciesId.STARAVIA,
  SpeciesId.STARAPTOR,
  SpeciesId.MOTHIM,
  SpeciesId.COMBEE,
  SpeciesId.VESPIQUEN,
  SpeciesId.DRIFLOON,
  SpeciesId.DRIFBLIM,
  SpeciesId.MISMAGIUS,
  SpeciesId.HONCHKROW,
  SpeciesId.CHINGLING,
  SpeciesId.BRONZOR,
  SpeciesId.BRONZONG,
  SpeciesId.CARNIVINE,
  SpeciesId.MANTYKE,
  SpeciesId.MAGNEZONE, // ?
  SpeciesId.TOGEKISS,
  SpeciesId.YANMEGA,
  SpeciesId.GLISCOR,
  SpeciesId.DUSKNOIR, // ?
  SpeciesId.ROTOM,
  SpeciesId.UXIE,
  SpeciesId.MESPRIT,
  SpeciesId.AZELF,
  SpeciesId.GIRATINA,
  SpeciesId.CRESSELIA,
  SpeciesId.ARCEUS,
  SpeciesId.TRANQUILL,
  SpeciesId.UNFEZANT,
  SpeciesId.WOOBAT,
  SpeciesId.SWOOBAT,
  SpeciesId.SIGILYPH,
  SpeciesId.ARCHEOPS,
  SpeciesId.SOLOSIS,
  SpeciesId.DUOSION,
  SpeciesId.REUNICLUS,
  SpeciesId.SWANNA,
  SpeciesId.VANILLISH,
  SpeciesId.VANILLUXE,
  SpeciesId.EMOLGA,
  SpeciesId.TYNAMO,
  SpeciesId.EELEKTRIK,
  SpeciesId.EELEKTROSS,
  SpeciesId.LAMPENT,
  SpeciesId.CHANDELURE,
  SpeciesId.CRYOGONAL,
  SpeciesId.BRAVIARY,
  SpeciesId.MANDIBUZZ,
  SpeciesId.HYDREIGON,
  SpeciesId.VOLCARONA,
  SpeciesId.TORNADUS,
  SpeciesId.THUNDURUS,
  SpeciesId.RESHIRAM,
  SpeciesId.ZEKROM,
  SpeciesId.LANDORUS,
  SpeciesId.FLETCHINDER,
  SpeciesId.TALONFLAME,
  SpeciesId.VIVILLON,
  SpeciesId.FLOETTE,
  SpeciesId.FLORGES,
  SpeciesId.HAWLUCHA, // ?
  SpeciesId.NOIBAT,
  SpeciesId.NOIVERN,
  SpeciesId.YVELTAL,
  SpeciesId.DARTRIX,
  SpeciesId.DECIDUEYE, //?
  SpeciesId.TRUMBEAK,
  SpeciesId.TOUCANNON,
  SpeciesId.VIKAVOLT,
  SpeciesId.ORICORIO,
  SpeciesId.RIBOMBEE,
  SpeciesId.COMFEY, //?
  SpeciesId.MINIOR,
  SpeciesId.TAPU_KOKO,
  SpeciesId.TAPU_LELE,
  SpeciesId.TAPU_BULU,
  SpeciesId.TAPU_FINI,
  SpeciesId.LUNALA,
  SpeciesId.NIHILEGO,
  SpeciesId.BUZZWOLE,
  SpeciesId.CELESTEELA,
  SpeciesId.NECROZMA,
  SpeciesId.POIPOLE,
  SpeciesId.NAGANADEL,
  SpeciesId.CORVISQUIRE,
  SpeciesId.CORVIKNIGHT,
  SpeciesId.ORBEETLE,
  SpeciesId.FLAPPLE,
  SpeciesId.CRAMORANT,
  SpeciesId.FROSMOTH,
  SpeciesId.DRAKLOAK,
  SpeciesId.DRAGAPULT,
  SpeciesId.ETERNATUS,
  SpeciesId.ENAMORUS,
  SpeciesId.SQUAWKABILLY,
  SpeciesId.WATTREL,
  SpeciesId.KILOWATTREL,
  SpeciesId.BOMBIRDIER,
  SpeciesId.FLAMIGO,
  SpeciesId.FLUTTER_MANE,
  SpeciesId.IRON_JUGULIS,
  SpeciesId.ROARING_MOON,
  SpeciesId.MIRAIDON,
  SpeciesId.KORAIDON,
];

const PHYSICAL_TUTOR_MOVES = [
  MoveId.FLY,
  MoveId.BRAVE_BIRD,
  MoveId.ACROBATICS,
  MoveId.DRAGON_ASCENT,
  MoveId.BEAK_BLAST,
  MoveId.FLOATY_FALL,
  MoveId.DUAL_WINGBEAT,
];

const SPECIAL_TUTOR_MOVES = [MoveId.AEROBLAST, MoveId.AIR_SLASH, MoveId.HURRICANE, MoveId.BLEAKWIND_STORM];

const SUPPORT_TUTOR_MOVES = [MoveId.FEATHER_DANCE, MoveId.ROOST, MoveId.PLUCK, MoveId.TAILWIND];

// Not sure the best way to do this
const INELIGIBLE_MOVES: MoveId[] = [
  MoveId.BODY_SLAM,
  MoveId.BULLDOZE,
  MoveId.DIG,
  MoveId.DIVE,
  MoveId.EARTH_POWER,
  MoveId.EARTHQUAKE,
  MoveId.ELECTRIC_TERRAIN,
  MoveId.FIRE_PLEDGE,
  MoveId.FISSURE,
  MoveId.FLYING_PRESS,
  MoveId.FRENZY_PLANT,
  MoveId.GEOMANCY,
  MoveId.GRASS_KNOT,
  MoveId.GRASS_PLEDGE,
  MoveId.GRASSY_TERRAIN,
  MoveId.GRAVITY,
  MoveId.HEAVY_SLAM,
  MoveId.INGRAIN,
  MoveId.LANDS_WRATH,
  MoveId.MAGNITUDE,
  MoveId.MAT_BLOCK,
  MoveId.MISTY_TERRAIN,
  MoveId.MUD_SPORT,
  MoveId.MUDDY_WATER,
  MoveId.ROTOTILLER,
  MoveId.SEISMIC_TOSS,
  MoveId.SLAM,
  MoveId.SMACK_DOWN,
  MoveId.SPIKES,
  MoveId.STOMP,
  MoveId.SUBSTITUTE,
  MoveId.SURF,
  MoveId.TOXIC_SPIKES,
  MoveId.WATER_PLEDGE,
  MoveId.WATER_SPORT,
];

const sky_battle_requirements = new AnyCombinationPokemonRequirement(
  3,
  new TypeRequirement(PokemonType.FLYING, false, 1),
  new AbilityRequirement(AbilityId.LEVITATE, false, 1),
);

// Helpful variables
let originalUsedPP: number[] = [];
const disallowedPokemon: Map<number, PlayerPokemon> = new Map<number, PlayerPokemon>();

/**
 * Sky Battle encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/5487 | GitHub Issue #5487}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const SkyBattleEncounter: MysteryEncounter = MysteryEncounterBuilder.withEncounterType(
  MysteryEncounterType.SKY_BATTLE,
)
  .withPrimaryPokemonRequirement(sky_battle_requirements)
  .withMaxAllowedEncounters(1)
  .withEncounterTier(MysteryEncounterTier.ULTRA)
  .withSceneWaveRangeRequirement(...SKY_BATTLE_WAVES)
  .withIntroSpriteConfigs([]) // Sprite is set in onInit()
  .withIntroDialogue([
    {
      text: `${namespace}:intro`,
    },
    {
      speaker: `${namespace}:speaker`,
      text: `${namespace}:intro_dialogue`,
    },
  ])
  .withOnInit(() => {
    const encounter = globalScene.currentBattle.mysteryEncounter!;
    const partySize: number = sky_battle_requirements.queryParty(globalScene.getPlayerParty()).length;

    // randomize trainer gender
    const female = !!randSeedInt(2);
    const config = getTrainerConfig(partySize, female);
    const spriteKey = config.getSpriteKey(female);
    encounter.enemyPartyConfigs.push({
      trainerConfig: config,
      female: female,
    });

    // loads trainer sprite at start of encounter
    encounter.spriteConfigs = [
      {
        spriteKey: spriteKey,
        fileRoot: "trainer",
        hasShadow: true,
        x: 4,
        y: 7,
        yShadow: 7,
      },
    ];

    const intro = [
      {
        text: `${namespace}:intro` + female ? "_f" : "",
      },
      {
        speaker: `${namespace}:speaker`,
        text: `${namespace}:intro_dialogue` + female ? "_f" : "",
      },
    ];
    const title = `${namespace}:title` + female ? "_f" : "";
    const description = `${namespace}:description` + female ? "_f" : "";
    const outro = [
      {
        text: `${namespace}:outro` + female ? "_f" : "",
      },
    ];

    encounter.dialogue = { ...encounter.dialogue, intro: intro };
    let encounterOptionsDialogue = encounter.dialogue.encounterOptionsDialogue ?? {};
    encounter.dialogue = {
      ...encounter.dialogue,
      encounterOptionsDialogue: {
        ...encounterOptionsDialogue,
        title,
      },
    };
    encounterOptionsDialogue = encounter.dialogue.encounterOptionsDialogue ?? {};
    encounter.dialogue = {
      ...encounter.dialogue,
      encounterOptionsDialogue: {
        ...encounterOptionsDialogue,
        description,
      },
    };
    encounter.dialogue = { ...encounter.dialogue, outro: outro };

    return true;
  })
  .setLocalizationKey(`${namespace}`)
  .withTitle(`${namespace}:title`)
  .withDescription(`${namespace}:description`)
  .withQuery(`${namespace}:query`)
  .withSimpleOption(
    //Option 1: Battle
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
      // Select sky battle
      const encounter = globalScene.currentBattle.mysteryEncounter!;
      const config: EnemyPartyConfig = encounter.enemyPartyConfigs[0];

      // Init the moves available for tutor
      const moveTutorOptions: PokemonMove[] = [];
      moveTutorOptions.push(new PokemonMove(PHYSICAL_TUTOR_MOVES[randSeedInt(PHYSICAL_TUTOR_MOVES.length)]));
      moveTutorOptions.push(new PokemonMove(SPECIAL_TUTOR_MOVES[randSeedInt(SPECIAL_TUTOR_MOVES.length)]));
      moveTutorOptions.push(new PokemonMove(SUPPORT_TUTOR_MOVES[randSeedInt(SUPPORT_TUTOR_MOVES.length)]));
      encounter.misc = {
        moveTutorOptions,
      };

      //Remove disallowed pokemon
      const allowedPokemon = sky_battle_requirements.queryParty(globalScene.getPlayerParty());
      globalScene.getPlayerParty().filter(pokemon => !allowedPokemon.includes(pokemon));
      globalScene.getPlayerParty().map((pokemon, index) => {
        if (!allowedPokemon.includes(pokemon)) {
          disallowedPokemon.set(index, pokemon);
        }
      });

      disallowedPokemon.forEach(pokemon => globalScene.removePokemonFromPlayerParty(pokemon, false));

      //Set illegal pokemon moves pp to 0
      originalUsedPP = [];
      globalScene.getPlayerParty().forEach(pokemon =>
        pokemon.moveset
          .filter(move => INELIGIBLE_MOVES.includes(move.getMove().id))
          .forEach(move => {
            originalUsedPP.push(move.ppUsed);
            move.ppUsed = move.getMovePp();
          }),
      );

      // Assigns callback that teaches move before continuing to rewards
      encounter.onRewards = doFlyingTypeTutor;

      setEncounterRewards({ fillRemaining: true });
      await transitionMysteryEncounterIntroVisuals(true, true);
      await initBattleWithEnemyConfig(config);

      //Set illegal enemy pokemon moves pp to 0
      globalScene.getEnemyParty().forEach(pokemon =>
        pokemon.moveset
          .filter(move => INELIGIBLE_MOVES.includes(move.getMove().id))
          .forEach(move => {
            move.ppUsed = move.getMovePp();
          }),
      );
    },
  )
  .withOption(
    //Option 2: Flaunt flying pokemon
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT)
      .withPrimaryPokemonRequirement(sky_battle_requirements) // Must pass the same requirements to trigger this encounter
      .withDialogue({
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: `${namespace}:option.2.tooltip`,
        disabledButtonTooltip: `${namespace}:option.2.disabled_tooltip`,
      })
      .withPreOptionPhase(async () => {
        // Player shows off their Flying pokemon
        const encounter = globalScene.currentBattle.mysteryEncounter!;

        setEncounterRewards({
          guaranteedModifierTypeFuncs: [modifierTypes.QUICK_CLAW, modifierTypes.MAX_LURE, modifierTypes.ULTRA_BALL],
          fillRemaining: false,
        });
        encounter.selectedOption!.dialogue!.selected = [
          {
            speaker: `${namespace}:speaker`,
            text: `${namespace}:option.2.selected`,
          },
        ];
      })
      .withOptionPhase(async () => {
        // Player shows off their Flying pokémon
        leaveEncounterWithoutBattle();
      })
      .build(),
  )
  .withSimpleOption(
    //Option 3: Reject battle and leave with no rewards
    {
      buttonLabel: `${namespace}:option.3.label`,
      buttonTooltip: `${namespace}:option.3.tooltip`,
      selected: [
        {
          text: `${namespace}:option.3.selected`,
        },
      ],
    },
    async () => {
      leaveEncounterWithoutBattle();
      return true;
    },
  )
  .withOutroDialogue([
    {
      text: `${namespace}:outro`,
    },
  ])
  .build();

function getTrainerConfig(party_size: number, female: boolean): TrainerConfig {
  // Sky trainer config
  const config = trainerConfigs[TrainerType.SKY_TRAINER].clone();
  const name = female ? "sky_trainer_f" : "sky_trainer_m";
  config.name = i18next.t("trainerNames:" + name);

  let pool0Copy = POOL_0_POKEMON.slice(0);
  pool0Copy = randSeedShuffle(pool0Copy);
  let pool0Mon = pool0Copy.pop()!;

  config.setPartyTemplates(new TrainerPartyTemplate(party_size, PartyMemberStrength.STRONG));

  // adds a non-repeating random pokemon
  for (let index = 0; index < party_size; index++) {
    config.setPartyMemberFunc(index, getRandomPartyMemberFunc([pool0Mon], TrainerSlot.TRAINER, true));
    pool0Mon = pool0Copy.pop()!;
  }

  return config;
}

function doFlyingTypeTutor(): Promise<void> {
  // biome-ignore lint/suspicious/noAsyncPromiseExecutor: TODO explain
  return new Promise<void>(async resolve => {
    const moveOptions = globalScene.currentBattle.mysteryEncounter!.misc.moveTutorOptions;
    const female = globalScene.currentBattle.mysteryEncounter!.enemyPartyConfigs[0].female; //TODO: Is this [0] correct enought?
    await showEncounterDialogue(`${namespace}:battle_won` + female ? "_f" : "", `${namespace}:speaker`);

    const overlayScale = 1;
    const moveInfoOverlay = new MoveInfoOverlay({
      delayVisibility: false,
      scale: overlayScale,
      onSide: true,
      right: true,
      x: 1,
      y: -MoveInfoOverlay.getHeight(overlayScale, true) - 1,
      width: globalScene.game.canvas.width / 6 - 2,
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
      `${namespace}:teach_move_prompt`,
      undefined, // No filter
      onHoverOverCancel,
    );
    if (!result) {
      moveInfoOverlay.active = false;
      moveInfoOverlay.setVisible(false);
    }
    // Option select complete, handle if they are learning a move
    if (result && result.selectedOptionIndex < moveOptions.length) {
      globalScene.phaseManager.unshiftPhase(
        new LearnMovePhase(result.selectedPokemonIndex, moveOptions[result.selectedOptionIndex].moveId),
      );
    }

    // Reset ineligible moves' pp
    let idx = 0;
    globalScene.getPlayerParty().forEach(pokemon =>
      pokemon.moveset
        .filter(move => INELIGIBLE_MOVES.includes(move.getMove().id))
        .forEach(move => {
          move.ppUsed = originalUsedPP[idx++];
        }),
    );

    //Return disallowed pokemons
    disallowedPokemon.forEach((pokemon, index) => {
      globalScene.getPlayerParty().splice(index, 0, pokemon);
    });

    // Complete battle and go to rewards
    resolve();
  });
}
