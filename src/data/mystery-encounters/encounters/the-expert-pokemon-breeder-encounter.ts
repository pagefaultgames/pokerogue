import { globalScene } from "#app/global-scene";
import { speciesStarterCosts } from "#balance/starters";
import { modifierTypes } from "#data/data-lists";
import type { IEggOptions } from "#data/egg";
import { getPokeballTintColor } from "#data/pokeball";
import { BiomeId } from "#enums/biome-id";
import { Challenges } from "#enums/challenges";
import { EggSourceType } from "#enums/egg-source-types";
import { EggTier } from "#enums/egg-type";
import { MoveId } from "#enums/move-id";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { Nature } from "#enums/nature";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { TrainerType } from "#enums/trainer-type";
import type { PlayerPokemon } from "#field/pokemon";
import { getEncounterText } from "#mystery-encounters/encounter-dialogue-utils";
import type { EnemyPartyConfig } from "#mystery-encounters/encounter-phase-utils";
import {
  handleMysteryEncounterBattleFailed,
  initBattleWithEnemyConfig,
  setEncounterRewards,
} from "#mystery-encounters/encounter-phase-utils";
import type { MysteryEncounter } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterBuilder } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterOptionBuilder } from "#mystery-encounters/mystery-encounter-option";
import { trainerConfigs } from "#trainers/trainer-config";
import { randSeedShuffle } from "#utils/common";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import i18next from "i18next";

/** the i18n namespace for the encounter */
const namespace = "mysteryEncounters/theExpertPokemonBreeder";

const trainerNameKey = "trainerNames:expertPokemonBreeder";

const FIRST_STAGE_EVOLUTION_WAVE = 45;
const SECOND_STAGE_EVOLUTION_WAVE = 60;
const FINAL_STAGE_EVOLUTION_WAVE = 75;

const FRIENDSHIP_ADDED = 20;

class BreederSpeciesEvolution {
  species: SpeciesId;
  evolution: number;

  constructor(species: SpeciesId, evolution: number) {
    this.species = species;
    this.evolution = evolution;
  }
}

const POOL_1_POKEMON: (SpeciesId | BreederSpeciesEvolution)[][] = [
  [
    SpeciesId.PICHU,
    new BreederSpeciesEvolution(SpeciesId.PIKACHU, FIRST_STAGE_EVOLUTION_WAVE),
    new BreederSpeciesEvolution(SpeciesId.RAICHU, FINAL_STAGE_EVOLUTION_WAVE),
  ],
  [
    SpeciesId.PICHU,
    new BreederSpeciesEvolution(SpeciesId.PIKACHU, FIRST_STAGE_EVOLUTION_WAVE),
    new BreederSpeciesEvolution(SpeciesId.ALOLA_RAICHU, FINAL_STAGE_EVOLUTION_WAVE),
  ],
  [
    SpeciesId.IGGLYBUFF,
    new BreederSpeciesEvolution(SpeciesId.JIGGLYPUFF, FIRST_STAGE_EVOLUTION_WAVE),
    new BreederSpeciesEvolution(SpeciesId.WIGGLYTUFF, FINAL_STAGE_EVOLUTION_WAVE),
  ],
  [
    SpeciesId.TOGEPI,
    new BreederSpeciesEvolution(SpeciesId.TOGETIC, FIRST_STAGE_EVOLUTION_WAVE),
    new BreederSpeciesEvolution(SpeciesId.TOGEKISS, FINAL_STAGE_EVOLUTION_WAVE),
  ],
  [SpeciesId.TYROGUE, new BreederSpeciesEvolution(SpeciesId.HITMONLEE, SECOND_STAGE_EVOLUTION_WAVE)],
  [SpeciesId.TYROGUE, new BreederSpeciesEvolution(SpeciesId.HITMONCHAN, SECOND_STAGE_EVOLUTION_WAVE)],
  [SpeciesId.TYROGUE, new BreederSpeciesEvolution(SpeciesId.HITMONTOP, SECOND_STAGE_EVOLUTION_WAVE)],
  [SpeciesId.SMOOCHUM, new BreederSpeciesEvolution(SpeciesId.JYNX, FIRST_STAGE_EVOLUTION_WAVE)],
  [
    SpeciesId.AZURILL,
    new BreederSpeciesEvolution(SpeciesId.MARILL, FIRST_STAGE_EVOLUTION_WAVE),
    new BreederSpeciesEvolution(SpeciesId.AZUMARILL, FINAL_STAGE_EVOLUTION_WAVE),
  ],
  [
    SpeciesId.BUDEW,
    new BreederSpeciesEvolution(SpeciesId.ROSELIA, FIRST_STAGE_EVOLUTION_WAVE),
    new BreederSpeciesEvolution(SpeciesId.ROSERADE, FINAL_STAGE_EVOLUTION_WAVE),
  ],
  [SpeciesId.CHINGLING, new BreederSpeciesEvolution(SpeciesId.CHIMECHO, SECOND_STAGE_EVOLUTION_WAVE)],
  [SpeciesId.BONSLY, new BreederSpeciesEvolution(SpeciesId.SUDOWOODO, SECOND_STAGE_EVOLUTION_WAVE)],
  [SpeciesId.MIME_JR, new BreederSpeciesEvolution(SpeciesId.MR_MIME, SECOND_STAGE_EVOLUTION_WAVE)],
  [
    SpeciesId.MIME_JR,
    new BreederSpeciesEvolution(SpeciesId.GALAR_MR_MIME, SECOND_STAGE_EVOLUTION_WAVE),
    new BreederSpeciesEvolution(SpeciesId.MR_RIME, FINAL_STAGE_EVOLUTION_WAVE),
  ],
  [
    SpeciesId.HAPPINY,
    new BreederSpeciesEvolution(SpeciesId.CHANSEY, FIRST_STAGE_EVOLUTION_WAVE),
    new BreederSpeciesEvolution(SpeciesId.BLISSEY, FINAL_STAGE_EVOLUTION_WAVE),
  ],
  [SpeciesId.MANTYKE, new BreederSpeciesEvolution(SpeciesId.MANTINE, SECOND_STAGE_EVOLUTION_WAVE)],
  [SpeciesId.TOXEL, new BreederSpeciesEvolution(SpeciesId.TOXTRICITY, SECOND_STAGE_EVOLUTION_WAVE)],
];

const POOL_2_POKEMON: (SpeciesId | BreederSpeciesEvolution)[][] = [
  [SpeciesId.DITTO],
  [
    SpeciesId.ELEKID,
    new BreederSpeciesEvolution(SpeciesId.ELECTABUZZ, FIRST_STAGE_EVOLUTION_WAVE),
    new BreederSpeciesEvolution(SpeciesId.ELECTIVIRE, FINAL_STAGE_EVOLUTION_WAVE),
  ],
  [
    SpeciesId.MAGBY,
    new BreederSpeciesEvolution(SpeciesId.MAGMAR, FIRST_STAGE_EVOLUTION_WAVE),
    new BreederSpeciesEvolution(SpeciesId.MAGMORTAR, FINAL_STAGE_EVOLUTION_WAVE),
  ],
  [SpeciesId.WYNAUT, new BreederSpeciesEvolution(SpeciesId.WOBBUFFET, SECOND_STAGE_EVOLUTION_WAVE)],
  [SpeciesId.MUNCHLAX, new BreederSpeciesEvolution(SpeciesId.SNORLAX, SECOND_STAGE_EVOLUTION_WAVE)],
  [SpeciesId.RIOLU, new BreederSpeciesEvolution(SpeciesId.LUCARIO, SECOND_STAGE_EVOLUTION_WAVE)],
  [SpeciesId.AUDINO],
];

/**
 * The Expert Pokémon Breeder encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3818 | GitHub Issue #3818}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const TheExpertPokemonBreederEncounter: MysteryEncounter = MysteryEncounterBuilder.withEncounterType(
  MysteryEncounterType.THE_EXPERT_POKEMON_BREEDER,
)
  .withEncounterTier(MysteryEncounterTier.ULTRA)
  .withDisallowedChallenges(Challenges.HARDCORE)
  .withSceneWaveRangeRequirement(25, 180)
  .withScenePartySizeRequirement(4, 6, true) // Must have at least 4 legal pokemon in party
  .withIntroSpriteConfigs([]) // These are set in onInit()
  .withIntroDialogue([
    {
      text: `${namespace}:intro`,
    },
    {
      speaker: trainerNameKey,
      text: `${namespace}:introDialogue`,
    },
  ])
  .withOnInit(() => {
    const encounter = globalScene.currentBattle.mysteryEncounter!;
    const waveIndex = globalScene.currentBattle.waveIndex;
    // Calculates what trainers are available for battle in the encounter

    // If player is in space biome, uses special "Space" version of the trainer
    encounter.enemyPartyConfigs = [getPartyConfig()];

    const cleffaSpecies =
      waveIndex < FIRST_STAGE_EVOLUTION_WAVE
        ? SpeciesId.CLEFFA
        : waveIndex < FINAL_STAGE_EVOLUTION_WAVE
          ? SpeciesId.CLEFAIRY
          : SpeciesId.CLEFABLE;
    encounter.spriteConfigs = [
      {
        spriteKey: cleffaSpecies.toString(),
        fileRoot: "pokemon",
        hasShadow: true,
        repeat: true,
        x: 14,
        y: -2,
        yShadow: -2,
      },
      {
        spriteKey: "expert_pokemon_breeder",
        fileRoot: "trainer",
        hasShadow: true,
        x: -14,
        y: 4,
        yShadow: 2,
      },
    ];

    // Determine the 3 pokemon the player can battle with
    let partyCopy = globalScene.getPlayerParty().slice(0);
    partyCopy = partyCopy.filter(p => p.isAllowedInBattle()).sort((a, b) => a.friendship - b.friendship);

    const pokemon1 = partyCopy[0];
    const pokemon2 = partyCopy[1];
    const pokemon3 = partyCopy[2];
    encounter.setDialogueToken("pokemon1Name", pokemon1.getNameToRender());
    encounter.setDialogueToken("pokemon2Name", pokemon2.getNameToRender());
    encounter.setDialogueToken("pokemon3Name", pokemon3.getNameToRender());

    // Dialogue and egg calcs for Pokemon 1
    const [pokemon1CommonEggs, pokemon1RareEggs] = calculateEggRewardsForPokemon(pokemon1);
    let pokemon1Tooltip = getEncounterText(`${namespace}:option.1.tooltipBase`)!;
    if (pokemon1RareEggs > 0) {
      const eggsText = i18next.t(`${namespace}:numEggs`, {
        count: pokemon1RareEggs,
        rarity: i18next.t("egg:greatTier"),
      });
      pokemon1Tooltip += i18next.t(`${namespace}:eggsTooltip`, {
        eggs: eggsText,
      });
      encounter.setDialogueToken("pokemon1RareEggs", eggsText);
    }
    if (pokemon1CommonEggs > 0) {
      const eggsText = i18next.t(`${namespace}:numEggs`, {
        count: pokemon1CommonEggs,
        rarity: i18next.t("egg:defaultTier"),
      });
      pokemon1Tooltip += i18next.t(`${namespace}:eggsTooltip`, {
        eggs: eggsText,
      });
      encounter.setDialogueToken("pokemon1CommonEggs", eggsText);
    }
    encounter.options[0].dialogue!.buttonTooltip = pokemon1Tooltip;

    // Dialogue and egg calcs for Pokemon 2
    const [pokemon2CommonEggs, pokemon2RareEggs] = calculateEggRewardsForPokemon(pokemon2);
    let pokemon2Tooltip = getEncounterText(`${namespace}:option.2.tooltipBase`)!;
    if (pokemon2RareEggs > 0) {
      const eggsText = i18next.t(`${namespace}:numEggs`, {
        count: pokemon2RareEggs,
        rarity: i18next.t("egg:greatTier"),
      });
      pokemon2Tooltip += i18next.t(`${namespace}:eggsTooltip`, {
        eggs: eggsText,
      });
      encounter.setDialogueToken("pokemon2RareEggs", eggsText);
    }
    if (pokemon2CommonEggs > 0) {
      const eggsText = i18next.t(`${namespace}:numEggs`, {
        count: pokemon2CommonEggs,
        rarity: i18next.t("egg:defaultTier"),
      });
      pokemon2Tooltip += i18next.t(`${namespace}:eggsTooltip`, {
        eggs: eggsText,
      });
      encounter.setDialogueToken("pokemon2CommonEggs", eggsText);
    }
    encounter.options[1].dialogue!.buttonTooltip = pokemon2Tooltip;

    // Dialogue and egg calcs for Pokemon 3
    const [pokemon3CommonEggs, pokemon3RareEggs] = calculateEggRewardsForPokemon(pokemon3);
    let pokemon3Tooltip = getEncounterText(`${namespace}:option.3.tooltipBase`)!;
    if (pokemon3RareEggs > 0) {
      const eggsText = i18next.t(`${namespace}:numEggs`, {
        count: pokemon3RareEggs,
        rarity: i18next.t("egg:greatTier"),
      });
      pokemon3Tooltip += i18next.t(`${namespace}:eggsTooltip`, {
        eggs: eggsText,
      });
      encounter.setDialogueToken("pokemon3RareEggs", eggsText);
    }
    if (pokemon3CommonEggs > 0) {
      const eggsText = i18next.t(`${namespace}:numEggs`, {
        count: pokemon3CommonEggs,
        rarity: i18next.t("egg:defaultTier"),
      });
      pokemon3Tooltip += i18next.t(`${namespace}:eggsTooltip`, {
        eggs: eggsText,
      });
      encounter.setDialogueToken("pokemon3CommonEggs", eggsText);
    }
    encounter.options[2].dialogue!.buttonTooltip = pokemon3Tooltip;

    encounter.misc = {
      pokemon1,
      pokemon1CommonEggs,
      pokemon1RareEggs,
      pokemon2,
      pokemon2CommonEggs,
      pokemon2RareEggs,
      pokemon3,
      pokemon3CommonEggs,
      pokemon3RareEggs,
    };

    return true;
  })
  .setLocalizationKey(`${namespace}`)
  .withTitle(`${namespace}:title`)
  .withDescription(`${namespace}:description`)
  .withQuery(`${namespace}:query`)
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
      .withDialogue({
        buttonLabel: `${namespace}:option.1.label`,
        selected: [
          {
            speaker: trainerNameKey,
            text: `${namespace}:option.selected`,
          },
        ],
      })
      .withOptionPhase(async () => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        // Spawn battle with first pokemon
        const config: EnemyPartyConfig = encounter.enemyPartyConfigs[0];

        const { pokemon1, pokemon1CommonEggs, pokemon1RareEggs } = encounter.misc;
        encounter.misc.chosenPokemon = pokemon1;
        encounter.setDialogueToken("chosenPokemon", pokemon1.getNameToRender());
        const eggOptions = getEggOptions(pokemon1CommonEggs, pokemon1RareEggs);
        setEncounterRewards(
          {
            guaranteedModifierTypeFuncs: [modifierTypes.SOOTHE_BELL],
            fillRemaining: true,
          },
          eggOptions,
          () => doPostEncounterCleanup(),
        );

        // Remove all Pokemon from the party except the chosen Pokemon
        removePokemonFromPartyAndStoreHeldItems(encounter, pokemon1);

        // Configure outro dialogue for egg rewards
        encounter.dialogue.outro = [
          {
            speaker: trainerNameKey,
            text: `${namespace}:outro`,
          },
        ];
        if (encounter.dialogueTokens.hasOwnProperty("pokemon1CommonEggs")) {
          encounter.dialogue.outro.push({
            text: i18next.t(`${namespace}:gainedEggs`, {
              numEggs: encounter.dialogueTokens["pokemon1CommonEggs"],
            }),
          });
        }
        if (encounter.dialogueTokens.hasOwnProperty("pokemon1RareEggs")) {
          encounter.dialogue.outro.push({
            text: i18next.t(`${namespace}:gainedEggs`, {
              numEggs: encounter.dialogueTokens["pokemon1RareEggs"],
            }),
          });
        }

        encounter.onGameOver = onGameOver;
        await initBattleWithEnemyConfig(config);
      })
      .build(),
  )
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
      .withDialogue({
        buttonLabel: `${namespace}:option.2.label`,
        selected: [
          {
            speaker: trainerNameKey,
            text: `${namespace}:option.selected`,
          },
        ],
      })
      .withOptionPhase(async () => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        // Spawn battle with second pokemon
        const config: EnemyPartyConfig = encounter.enemyPartyConfigs[0];

        const { pokemon2, pokemon2CommonEggs, pokemon2RareEggs } = encounter.misc;
        encounter.misc.chosenPokemon = pokemon2;
        encounter.setDialogueToken("chosenPokemon", pokemon2.getNameToRender());
        const eggOptions = getEggOptions(pokemon2CommonEggs, pokemon2RareEggs);
        setEncounterRewards(
          {
            guaranteedModifierTypeFuncs: [modifierTypes.SOOTHE_BELL],
            fillRemaining: true,
          },
          eggOptions,
          () => doPostEncounterCleanup(),
        );

        // Remove all Pokemon from the party except the chosen Pokemon
        removePokemonFromPartyAndStoreHeldItems(encounter, pokemon2);

        // Configure outro dialogue for egg rewards
        encounter.dialogue.outro = [
          {
            speaker: trainerNameKey,
            text: `${namespace}:outro`,
          },
        ];
        if (encounter.dialogueTokens.hasOwnProperty("pokemon2CommonEggs")) {
          encounter.dialogue.outro.push({
            text: i18next.t(`${namespace}:gainedEggs`, {
              numEggs: encounter.dialogueTokens["pokemon2CommonEggs"],
            }),
          });
        }
        if (encounter.dialogueTokens.hasOwnProperty("pokemon2RareEggs")) {
          encounter.dialogue.outro.push({
            text: i18next.t(`${namespace}:gainedEggs`, {
              numEggs: encounter.dialogueTokens["pokemon2RareEggs"],
            }),
          });
        }

        encounter.onGameOver = onGameOver;
        await initBattleWithEnemyConfig(config);
      })
      .build(),
  )
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
      .withDialogue({
        buttonLabel: `${namespace}:option.3.label`,
        selected: [
          {
            speaker: trainerNameKey,
            text: `${namespace}:option.selected`,
          },
        ],
      })
      .withOptionPhase(async () => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        // Spawn battle with third pokemon
        const config: EnemyPartyConfig = encounter.enemyPartyConfigs[0];

        const { pokemon3, pokemon3CommonEggs, pokemon3RareEggs } = encounter.misc;
        encounter.misc.chosenPokemon = pokemon3;
        encounter.setDialogueToken("chosenPokemon", pokemon3.getNameToRender());
        const eggOptions = getEggOptions(pokemon3CommonEggs, pokemon3RareEggs);
        setEncounterRewards(
          {
            guaranteedModifierTypeFuncs: [modifierTypes.SOOTHE_BELL],
            fillRemaining: true,
          },
          eggOptions,
          () => doPostEncounterCleanup(),
        );

        // Remove all Pokemon from the party except the chosen Pokemon
        removePokemonFromPartyAndStoreHeldItems(encounter, pokemon3);

        // Configure outro dialogue for egg rewards
        encounter.dialogue.outro = [
          {
            speaker: trainerNameKey,
            text: `${namespace}:outro`,
          },
        ];
        if (encounter.dialogueTokens.hasOwnProperty("pokemon3CommonEggs")) {
          encounter.dialogue.outro.push({
            text: i18next.t(`${namespace}:gainedEggs`, {
              numEggs: encounter.dialogueTokens["pokemon3CommonEggs"],
            }),
          });
        }
        if (encounter.dialogueTokens.hasOwnProperty("pokemon3RareEggs")) {
          encounter.dialogue.outro.push({
            text: i18next.t(`${namespace}:gainedEggs`, {
              numEggs: encounter.dialogueTokens["pokemon3RareEggs"],
            }),
          });
        }

        encounter.onGameOver = onGameOver;
        await initBattleWithEnemyConfig(config);
      })
      .build(),
  )
  .withOutroDialogue([
    {
      speaker: trainerNameKey,
      text: `${namespace}:outro`,
    },
  ])
  .build();

function getPartyConfig(): EnemyPartyConfig {
  // Bug type superfan trainer config
  const waveIndex = globalScene.currentBattle.waveIndex;
  const breederConfig = trainerConfigs[TrainerType.EXPERT_POKEMON_BREEDER].clone();
  breederConfig.name = i18next.t(trainerNameKey);

  // First mon is *always* this special cleffa
  const cleffaSpecies =
    waveIndex < FIRST_STAGE_EVOLUTION_WAVE
      ? SpeciesId.CLEFFA
      : waveIndex < FINAL_STAGE_EVOLUTION_WAVE
        ? SpeciesId.CLEFAIRY
        : SpeciesId.CLEFABLE;
  const baseConfig: EnemyPartyConfig = {
    trainerType: TrainerType.EXPERT_POKEMON_BREEDER,
    pokemonConfigs: [
      {
        nickname: i18next.t(`${namespace}:cleffa1Nickname`, {
          speciesName: getPokemonSpecies(cleffaSpecies).getName(),
        }),
        species: getPokemonSpecies(cleffaSpecies),
        isBoss: false,
        abilityIndex: 1, // Magic Guard
        shiny: false,
        nature: Nature.ADAMANT,
        moveSet: [MoveId.FIRE_PUNCH, MoveId.ICE_PUNCH, MoveId.THUNDER_PUNCH, MoveId.METEOR_MASH],
        ivs: [31, 31, 31, 31, 31, 31],
        tera: PokemonType.FAIRY,
      },
    ],
  };

  if (globalScene.arena.biomeType === BiomeId.SPACE) {
    // All 3 members always Cleffa line, but different configs
    baseConfig.pokemonConfigs!.push(
      {
        nickname: i18next.t(`${namespace}:cleffa2Nickname`, {
          speciesName: getPokemonSpecies(cleffaSpecies).getName(),
        }),
        species: getPokemonSpecies(cleffaSpecies),
        isBoss: false,
        abilityIndex: 1, // Magic Guard
        shiny: true,
        variant: 1,
        nature: Nature.MODEST,
        moveSet: [MoveId.DAZZLING_GLEAM, MoveId.MYSTICAL_FIRE, MoveId.ICE_BEAM, MoveId.THUNDERBOLT], // Make this one have an item gimmick when we have more items/finish implementations
        ivs: [31, 31, 31, 31, 31, 31],
      },
      {
        nickname: i18next.t(`${namespace}:cleffa3Nickname`, {
          speciesName: getPokemonSpecies(cleffaSpecies).getName(),
        }),
        species: getPokemonSpecies(cleffaSpecies),
        isBoss: false,
        abilityIndex: 2, // Friend Guard / Unaware
        shiny: true,
        variant: 2,
        nature: Nature.BOLD,
        moveSet: [MoveId.TRI_ATTACK, MoveId.STORED_POWER, MoveId.CALM_MIND, MoveId.MOONLIGHT],
        ivs: [31, 31, 31, 31, 31, 31],
      },
    );
  } else {
    // Second member from pool 1
    const pool1Species = getSpeciesFromPool(POOL_1_POKEMON, waveIndex);
    // Third member from pool 2
    const pool2Species = getSpeciesFromPool(POOL_2_POKEMON, waveIndex);

    baseConfig.pokemonConfigs!.push(
      {
        species: getPokemonSpecies(pool1Species),
        isBoss: false,
        ivs: [31, 31, 31, 31, 31, 31],
      },
      {
        species: getPokemonSpecies(pool2Species),
        isBoss: false,
        ivs: [31, 31, 31, 31, 31, 31],
      },
    );
  }

  return baseConfig;
}

function getSpeciesFromPool(speciesPool: (SpeciesId | BreederSpeciesEvolution)[][], waveIndex: number): SpeciesId {
  const poolCopy = randSeedShuffle(speciesPool.slice(0));
  const speciesEvolutions = poolCopy.pop()!.slice(0);
  let speciesObject = speciesEvolutions.pop()!;
  while (speciesObject instanceof BreederSpeciesEvolution && speciesObject.evolution > waveIndex) {
    speciesObject = speciesEvolutions.pop()!;
  }
  return speciesObject instanceof BreederSpeciesEvolution ? speciesObject.species : speciesObject;
}

function calculateEggRewardsForPokemon(pokemon: PlayerPokemon): [number, number] {
  const bst = pokemon.getSpeciesForm().getBaseStatTotal();
  // 1 point for every 20 points below 680 BST the pokemon is, (max 18, min 1)
  const pointsFromBst = Math.min(Math.max(Math.floor((680 - bst) / 20), 1), 18);

  const rootSpecies = pokemon.species.getRootSpeciesId();
  let pointsFromStarterTier = 0;
  // 2 points for every 1 below 7 that the pokemon's starter tier is (max 12, min 0)
  if (speciesStarterCosts.hasOwnProperty(rootSpecies)) {
    const starterTier = speciesStarterCosts[rootSpecies];
    pointsFromStarterTier = Math.min(Math.max(Math.floor(7 - starterTier) * 2, 0), 12);
  }

  // Maximum of 30 points
  let totalPoints = Math.min(pointsFromStarterTier + pointsFromBst, 30);

  // First 5 points go to Common eggs
  let numCommons = Math.min(totalPoints, 5);
  totalPoints -= numCommons;

  // Then, 1 Rare egg for every 4 points
  const numRares = Math.floor(totalPoints / 4);
  // 1 Common egg for every point leftover
  numCommons += totalPoints % 4;

  return [numCommons, numRares];
}

function getEggOptions(commonEggs: number, rareEggs: number) {
  const eggDescription = i18next.t(`${namespace}:title`);
  const eggOptions: IEggOptions[] = [];

  if (commonEggs > 0) {
    for (let i = 0; i < commonEggs; i++) {
      eggOptions.push({
        pulled: false,
        sourceType: EggSourceType.EVENT,
        eggDescriptor: eggDescription,
        tier: EggTier.COMMON,
      });
    }
  }
  if (rareEggs > 0) {
    for (let i = 0; i < rareEggs; i++) {
      eggOptions.push({
        pulled: false,
        sourceType: EggSourceType.EVENT,
        eggDescriptor: eggDescription,
        tier: EggTier.RARE,
      });
    }
  }

  return eggOptions;
}

function removePokemonFromPartyAndStoreHeldItems(encounter: MysteryEncounter, chosenPokemon: PlayerPokemon) {
  const party = globalScene.getPlayerParty();
  const chosenIndex = party.indexOf(chosenPokemon);
  party[chosenIndex] = party[0];
  party[0] = chosenPokemon;
  encounter.misc.originalParty = globalScene.getPlayerParty().slice(1);
  encounter.misc.originalPartyHeldItems = encounter.misc.originalParty.map(p => p.getHeldItems());
  globalScene["party"] = [chosenPokemon];
}

function restorePartyAndHeldItems() {
  const encounter = globalScene.currentBattle.mysteryEncounter!;
  // Restore original party
  globalScene.getPlayerParty().push(...encounter.misc.originalParty);

  // Restore held items
  const originalHeldItems = encounter.misc.originalPartyHeldItems;
  for (const pokemonHeldItemsList of originalHeldItems) {
    for (const heldItem of pokemonHeldItemsList) {
      globalScene.addModifier(heldItem, true, false, false, true);
    }
  }
  globalScene.updateModifiers(true);
}

function onGameOver() {
  const encounter = globalScene.currentBattle.mysteryEncounter!;

  encounter.dialogue.outro = [
    {
      speaker: trainerNameKey,
      text: `${namespace}:outroFailed`,
    },
  ];

  // Restore original party, player loses all friendship with chosen mon (it remains fainted)
  restorePartyAndHeldItems();
  const chosenPokemon = encounter.misc.chosenPokemon;
  chosenPokemon.friendship = 0;

  // Clear all rewards that would have been earned
  encounter.doEncounterRewards = undefined;

  // Set flag that encounter was failed
  encounter.misc.encounterFailed = true;

  // Revert BGM
  globalScene.playBgm(globalScene.arena.bgm);

  // Clear any leftover battle phases
  globalScene.phaseManager.clearPhaseQueue();
  globalScene.phaseManager.clearPhaseQueueSplice();

  // Return enemy Pokemon
  const pokemon = globalScene.getEnemyPokemon();
  if (pokemon) {
    globalScene.playSound("se/pb_rel");
    pokemon.hideInfo();
    pokemon.tint(getPokeballTintColor(pokemon.pokeball), 1, 250, "Sine.easeIn");
    globalScene.tweens.add({
      targets: pokemon,
      duration: 250,
      ease: "Sine.easeIn",
      scale: 0.5,
      onComplete: () => {
        pokemon.leaveField(true, true, true);
      },
    });
  }

  // Show the enemy trainer
  globalScene.time.delayedCall(250, () => {
    const sprites = globalScene.currentBattle.trainer?.getSprites();
    const tintSprites = globalScene.currentBattle.trainer?.getTintSprites();
    if (sprites && tintSprites) {
      for (let i = 0; i < sprites.length; i++) {
        sprites[i].setVisible(true);
        tintSprites[i].setVisible(true);
        sprites[i].clearTint();
        tintSprites[i].clearTint();
      }
    }
    globalScene.tweens.add({
      targets: globalScene.currentBattle.trainer,
      x: "-=16",
      y: "+=16",
      alpha: 1,
      ease: "Sine.easeInOut",
      duration: 750,
    });
  });

  handleMysteryEncounterBattleFailed(true);

  return false;
}

function doPostEncounterCleanup() {
  const encounter = globalScene.currentBattle.mysteryEncounter!;
  if (!encounter.misc.encounterFailed) {
    // Give 20 friendship to the chosen pokemon
    encounter.misc.chosenPokemon.addFriendship(FRIENDSHIP_ADDED);
    restorePartyAndHeldItems();
  }
}
