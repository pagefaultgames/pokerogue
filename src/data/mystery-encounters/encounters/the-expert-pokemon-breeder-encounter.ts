import { EnemyPartyConfig, generateModifierType, handleMysteryEncounterBattleFailed, initBattleWithEnemyConfig, setEncounterRewards, } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { trainerConfigs } from "#app/data/trainer-config";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "#app/battle-scene";
import { randSeedShuffle } from "#app/utils";
import MysteryEncounter, { MysteryEncounterBuilder } from "../mystery-encounter";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/game-mode";
import { Biome } from "#enums/biome";
import { TrainerType } from "#enums/trainer-type";
import i18next from "i18next";
import { Species } from "#enums/species";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import { speciesStarterCosts } from "#app/data/balance/starters";
import { Nature } from "#enums/nature";
import { Moves } from "#enums/moves";
import { PlayerPokemon } from "#app/field/pokemon";
import { getEncounterText } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import { IEggOptions } from "#app/data/egg";
import { EggSourceType } from "#enums/egg-source-types";
import { EggTier } from "#enums/egg-type";
import { MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { achvs } from "#app/system/achv";
import { modifierTypes, PokemonHeldItemModifierType } from "#app/modifier/modifier-type";
import { Type } from "#app/data/type";
import { getPokeballTintColor } from "#app/data/pokeball";

/** the i18n namespace for the encounter */
const namespace = "mysteryEncounters/theExpertPokemonBreeder";

const trainerNameKey = "trainerNames:expert_pokemon_breeder";

const FIRST_STAGE_EVOLUTION_WAVE = 45;
const SECOND_STAGE_EVOLUTION_WAVE = 60;
const FINAL_STAGE_EVOLUTION_WAVE = 75;

const FRIENDSHIP_ADDED = 20;

class BreederSpeciesEvolution  {
  species: Species;
  evolution: number;

  constructor(species: Species, evolution: number) {
    this.species = species;
    this.evolution = evolution;
  }
}

const POOL_1_POKEMON: (Species | BreederSpeciesEvolution)[][] = [
  [Species.MUNCHLAX, new BreederSpeciesEvolution(Species.SNORLAX, SECOND_STAGE_EVOLUTION_WAVE)],
  [Species.HAPPINY, new BreederSpeciesEvolution(Species.CHANSEY, FIRST_STAGE_EVOLUTION_WAVE), new BreederSpeciesEvolution(Species.BLISSEY, FINAL_STAGE_EVOLUTION_WAVE)],
  [Species.MAGBY, new BreederSpeciesEvolution(Species.MAGMAR, FIRST_STAGE_EVOLUTION_WAVE), new BreederSpeciesEvolution(Species.MAGMORTAR, FINAL_STAGE_EVOLUTION_WAVE)],
  [Species.ELEKID, new BreederSpeciesEvolution(Species.ELECTABUZZ, FIRST_STAGE_EVOLUTION_WAVE), new BreederSpeciesEvolution(Species.ELECTIVIRE, FINAL_STAGE_EVOLUTION_WAVE)],
  [Species.RIOLU, new BreederSpeciesEvolution(Species.LUCARIO, SECOND_STAGE_EVOLUTION_WAVE)],
  [Species.BUDEW, new BreederSpeciesEvolution(Species.ROSELIA, FIRST_STAGE_EVOLUTION_WAVE), new BreederSpeciesEvolution(Species.ROSERADE, FINAL_STAGE_EVOLUTION_WAVE)],
  [Species.TOXEL, new BreederSpeciesEvolution(Species.TOXTRICITY, SECOND_STAGE_EVOLUTION_WAVE)],
  [Species.MIME_JR, new BreederSpeciesEvolution(Species.GALAR_MR_MIME, FIRST_STAGE_EVOLUTION_WAVE), new BreederSpeciesEvolution(Species.MR_RIME, FINAL_STAGE_EVOLUTION_WAVE)]
];

const POOL_2_POKEMON: (Species | BreederSpeciesEvolution)[][] = [
  [Species.PICHU, new BreederSpeciesEvolution(Species.PIKACHU, FIRST_STAGE_EVOLUTION_WAVE), new BreederSpeciesEvolution(Species.RAICHU, FINAL_STAGE_EVOLUTION_WAVE)],
  [Species.PICHU, new BreederSpeciesEvolution(Species.PIKACHU, FIRST_STAGE_EVOLUTION_WAVE), new BreederSpeciesEvolution(Species.ALOLA_RAICHU, FINAL_STAGE_EVOLUTION_WAVE)],
  [Species.JYNX],
  [Species.TYROGUE, new BreederSpeciesEvolution(Species.HITMONLEE, SECOND_STAGE_EVOLUTION_WAVE)],
  [Species.TYROGUE, new BreederSpeciesEvolution(Species.HITMONCHAN, SECOND_STAGE_EVOLUTION_WAVE)],
  [Species.TYROGUE, new BreederSpeciesEvolution(Species.HITMONTOP, SECOND_STAGE_EVOLUTION_WAVE)],
  [Species.IGGLYBUFF, new BreederSpeciesEvolution(Species.JIGGLYPUFF, FIRST_STAGE_EVOLUTION_WAVE), new BreederSpeciesEvolution(Species.WIGGLYTUFF, FINAL_STAGE_EVOLUTION_WAVE)],
  [Species.AZURILL, new BreederSpeciesEvolution(Species.MARILL, FIRST_STAGE_EVOLUTION_WAVE), new BreederSpeciesEvolution(Species.AZUMARILL, FINAL_STAGE_EVOLUTION_WAVE)],
  [Species.WYNAUT, new BreederSpeciesEvolution(Species.WOBBUFFET, SECOND_STAGE_EVOLUTION_WAVE)],
  [Species.CHINGLING, new BreederSpeciesEvolution(Species.CHIMECHO, SECOND_STAGE_EVOLUTION_WAVE)],
  [Species.BONSLY, new BreederSpeciesEvolution(Species.SUDOWOODO, SECOND_STAGE_EVOLUTION_WAVE)],
  [Species.MANTYKE, new BreederSpeciesEvolution(Species.MANTINE, SECOND_STAGE_EVOLUTION_WAVE)]
];

/**
 * The Expert Pokémon Breeder encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3818 | GitHub Issue #3818}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const TheExpertPokemonBreederEncounter: MysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.THE_EXPERT_POKEMON_BREEDER)
    .withEncounterTier(MysteryEncounterTier.ULTRA)
    .withSceneWaveRangeRequirement(...CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES)
    .withScenePartySizeRequirement(4, 6, true) // Must have at least 4 legal pokemon in party
    .withIntroSpriteConfigs([]) // These are set in onInit()
    .withIntroDialogue([
      {
        text: `${namespace}:intro`,
      },
      {
        speaker: trainerNameKey,
        text: `${namespace}:intro_dialogue`,
      },
    ])
    .withOnInit((scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter!;
      const waveIndex = scene.currentBattle.waveIndex;
      // Calculates what trainers are available for battle in the encounter

      // If player is in space biome, uses special "Space" version of the trainer
      encounter.enemyPartyConfigs = [
        getPartyConfig(scene)
      ];

      const cleffaSpecies = waveIndex < FIRST_STAGE_EVOLUTION_WAVE ? Species.CLEFFA : waveIndex < FINAL_STAGE_EVOLUTION_WAVE ? Species.CLEFAIRY : Species.CLEFABLE;
      encounter.spriteConfigs = [
        {
          spriteKey: cleffaSpecies.toString(),
          fileRoot: "pokemon",
          hasShadow: true,
          repeat: true,
          x: 14,
          y: -2,
          yShadow: -2
        },
        {
          spriteKey: "expert_pokemon_breeder",
          fileRoot: "trainer",
          hasShadow: true,
          x: -14,
          y: 4,
          yShadow: 2
        },
      ];

      // Determine the 3 pokemon the player can battle with
      let partyCopy = scene.getParty().slice(0);
      partyCopy = partyCopy
        .filter(p => p.isAllowedInBattle())
        .sort((a, b) => a.friendship - b.friendship);

      const pokemon1 = partyCopy[0];
      const pokemon2 = partyCopy[1];
      const pokemon3 = partyCopy[2];
      encounter.setDialogueToken("pokemon1Name", pokemon1.getNameToRender());
      encounter.setDialogueToken("pokemon2Name", pokemon2.getNameToRender());
      encounter.setDialogueToken("pokemon3Name", pokemon3.getNameToRender());

      // Dialogue and egg calcs for Pokemon 1
      const [pokemon1CommonEggs, pokemon1RareEggs] = calculateEggRewardsForPokemon(pokemon1);
      let pokemon1Tooltip = getEncounterText(scene, `${namespace}:option.1.tooltip_base`)!;
      if (pokemon1RareEggs > 0) {
        const eggsText = i18next.t(`${namespace}:numEggs`, { count: pokemon1RareEggs, rarity: i18next.t("egg:greatTier") });
        pokemon1Tooltip += i18next.t(`${namespace}:eggs_tooltip`, { eggs: eggsText });
        encounter.setDialogueToken("pokemon1RareEggs", eggsText);
      }
      if (pokemon1CommonEggs > 0) {
        const eggsText = i18next.t(`${namespace}:numEggs`, { count: pokemon1CommonEggs, rarity: i18next.t("egg:defaultTier") });
        pokemon1Tooltip += i18next.t(`${namespace}:eggs_tooltip`, { eggs: eggsText });
        encounter.setDialogueToken("pokemon1CommonEggs", eggsText);
      }
      encounter.options[0].dialogue!.buttonTooltip = pokemon1Tooltip;

      // Dialogue and egg calcs for Pokemon 2
      const [pokemon2CommonEggs, pokemon2RareEggs] = calculateEggRewardsForPokemon(pokemon2);
      let pokemon2Tooltip = getEncounterText(scene, `${namespace}:option.2.tooltip_base`)!;
      if (pokemon2RareEggs > 0) {
        const eggsText = i18next.t(`${namespace}:numEggs`, { count: pokemon2RareEggs, rarity: i18next.t("egg:greatTier") });
        pokemon2Tooltip += i18next.t(`${namespace}:eggs_tooltip`, { eggs: eggsText });
        encounter.setDialogueToken("pokemon2RareEggs", eggsText);
      }
      if (pokemon2CommonEggs > 0) {
        const eggsText = i18next.t(`${namespace}:numEggs`, { count: pokemon2CommonEggs, rarity: i18next.t("egg:defaultTier") });
        pokemon2Tooltip += i18next.t(`${namespace}:eggs_tooltip`, { eggs: eggsText });
        encounter.setDialogueToken("pokemon2CommonEggs", eggsText);
      }
      encounter.options[1].dialogue!.buttonTooltip = pokemon2Tooltip;

      // Dialogue and egg calcs for Pokemon 3
      const [pokemon3CommonEggs, pokemon3RareEggs] = calculateEggRewardsForPokemon(pokemon3);
      let pokemon3Tooltip = getEncounterText(scene, `${namespace}:option.3.tooltip_base`)!;
      if (pokemon3RareEggs > 0) {
        const eggsText = i18next.t(`${namespace}:numEggs`, { count: pokemon3RareEggs, rarity: i18next.t("egg:greatTier") });
        pokemon3Tooltip += i18next.t(`${namespace}:eggs_tooltip`, { eggs: eggsText });
        encounter.setDialogueToken("pokemon3RareEggs", eggsText);
      }
      if (pokemon3CommonEggs > 0) {
        const eggsText = i18next.t(`${namespace}:numEggs`, { count: pokemon3CommonEggs, rarity: i18next.t("egg:defaultTier") });
        pokemon3Tooltip += i18next.t(`${namespace}:eggs_tooltip`, { eggs: eggsText });
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
        pokemon3RareEggs
      };

      return true;
    })
    .withTitle(`${namespace}:title`)
    .withDescription(`${namespace}:description`)
    .withQuery(`${namespace}:query`)
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
        .withDialogue({
          buttonLabel: `${namespace}:option.1.label`,
          selected: [
            {
              speaker: trainerNameKey,
              text: `${namespace}:option.selected`,
            },
          ],
        })
        .withOptionPhase(async (scene: BattleScene) => {
          const encounter = scene.currentBattle.mysteryEncounter!;
          // Spawn battle with first pokemon
          const config: EnemyPartyConfig = encounter.enemyPartyConfigs[0];

          const { pokemon1, pokemon1CommonEggs, pokemon1RareEggs } = encounter.misc;
          encounter.misc.chosenPokemon = pokemon1;
          encounter.setDialogueToken("chosenPokemon", pokemon1.getNameToRender());
          const eggOptions = getEggOptions(scene, pokemon1CommonEggs, pokemon1RareEggs);
          setEncounterRewards(scene, { guaranteedModifierTypeFuncs: [modifierTypes.SOOTHE_BELL], fillRemaining: true }, eggOptions);

          // Remove all Pokemon from the party except the chosen Pokemon
          removePokemonFromPartyAndStoreHeldItems(scene, encounter, pokemon1);

          // Configure outro dialogue for egg rewards
          encounter.dialogue.outro = [
            {
              speaker: trainerNameKey,
              text: `${namespace}:outro`,
            },
          ];
          if (encounter.dialogueTokens.hasOwnProperty("pokemon1CommonEggs")) {
            encounter.dialogue.outro.push({
              text: i18next.t(`${namespace}:gained_eggs`, { numEggs: encounter.dialogueTokens["pokemon1CommonEggs"] }),
            });
          }
          if (encounter.dialogueTokens.hasOwnProperty("pokemon1RareEggs")) {
            encounter.dialogue.outro.push({
              text: i18next.t(`${namespace}:gained_eggs`, { numEggs: encounter.dialogueTokens["pokemon1RareEggs"] }),
            });
          }

          encounter.onGameOver = onGameOver;
          initBattleWithEnemyConfig(scene, config);
        })
        .withPostOptionPhase(async (scene: BattleScene) => {
          await doPostEncounterCleanup(scene);
        })
        .build()
    )
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
        .withDialogue({
          buttonLabel: `${namespace}:option.2.label`,
          selected: [
            {
              speaker: trainerNameKey,
              text: `${namespace}:option.selected`,
            },
          ],
        })
        .withOptionPhase(async (scene: BattleScene) => {
          const encounter = scene.currentBattle.mysteryEncounter!;
          // Spawn battle with second pokemon
          const config: EnemyPartyConfig = encounter.enemyPartyConfigs[0];

          const { pokemon2, pokemon2CommonEggs, pokemon2RareEggs } = encounter.misc;
          encounter.misc.chosenPokemon = pokemon2;
          encounter.setDialogueToken("chosenPokemon", pokemon2.getNameToRender());
          const eggOptions = getEggOptions(scene, pokemon2CommonEggs, pokemon2RareEggs);
          setEncounterRewards(scene, { guaranteedModifierTypeFuncs: [modifierTypes.SOOTHE_BELL], fillRemaining: true }, eggOptions);

          // Remove all Pokemon from the party except the chosen Pokemon
          removePokemonFromPartyAndStoreHeldItems(scene, encounter, pokemon2);

          // Configure outro dialogue for egg rewards
          encounter.dialogue.outro = [
            {
              speaker: trainerNameKey,
              text: `${namespace}:outro`,
            },
          ];
          if (encounter.dialogueTokens.hasOwnProperty("pokemon2CommonEggs")) {
            encounter.dialogue.outro.push({
              text: i18next.t(`${namespace}:gained_eggs`, { numEggs: encounter.dialogueTokens["pokemon2CommonEggs"] }),
            });
          }
          if (encounter.dialogueTokens.hasOwnProperty("pokemon2RareEggs")) {
            encounter.dialogue.outro.push({
              text: i18next.t(`${namespace}:gained_eggs`, { numEggs: encounter.dialogueTokens["pokemon2RareEggs"] }),
            });
          }

          encounter.onGameOver = onGameOver;
          initBattleWithEnemyConfig(scene, config);
        })
        .withPostOptionPhase(async (scene: BattleScene) => {
          await doPostEncounterCleanup(scene);
        })
        .build()
    )
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
        .withDialogue({
          buttonLabel: `${namespace}:option.3.label`,
          selected: [
            {
              speaker: trainerNameKey,
              text: `${namespace}:option.selected`,
            },
          ],
        })
        .withOptionPhase(async (scene: BattleScene) => {
          const encounter = scene.currentBattle.mysteryEncounter!;
          // Spawn battle with third pokemon
          const config: EnemyPartyConfig = encounter.enemyPartyConfigs[0];

          const { pokemon3, pokemon3CommonEggs, pokemon3RareEggs } = encounter.misc;
          encounter.misc.chosenPokemon = pokemon3;
          encounter.setDialogueToken("chosenPokemon", pokemon3.getNameToRender());
          const eggOptions = getEggOptions(scene, pokemon3CommonEggs, pokemon3RareEggs);
          setEncounterRewards(scene, { guaranteedModifierTypeFuncs: [modifierTypes.SOOTHE_BELL], fillRemaining: true }, eggOptions);

          // Remove all Pokemon from the party except the chosen Pokemon
          removePokemonFromPartyAndStoreHeldItems(scene, encounter, pokemon3);

          // Configure outro dialogue for egg rewards
          encounter.dialogue.outro = [
            {
              speaker: trainerNameKey,
              text: `${namespace}:outro`,
            },
          ];
          if (encounter.dialogueTokens.hasOwnProperty("pokemon3CommonEggs")) {
            encounter.dialogue.outro.push({
              text: i18next.t(`${namespace}:gained_eggs`, { numEggs: encounter.dialogueTokens["pokemon3CommonEggs"] }),
            });
          }
          if (encounter.dialogueTokens.hasOwnProperty("pokemon3RareEggs")) {
            encounter.dialogue.outro.push({
              text: i18next.t(`${namespace}:gained_eggs`, { numEggs: encounter.dialogueTokens["pokemon3RareEggs"] }),
            });
          }

          encounter.onGameOver = onGameOver;
          initBattleWithEnemyConfig(scene, config);
        })
        .withPostOptionPhase(async (scene: BattleScene) => {
          await doPostEncounterCleanup(scene);
        })
        .build()
    )
    .withOutroDialogue([
      {
        speaker: trainerNameKey,
        text: `${namespace}:outro`,
      },
    ])
    .build();

function getPartyConfig(scene: BattleScene): EnemyPartyConfig {
  // Bug type superfan trainer config
  const waveIndex = scene.currentBattle.waveIndex;
  const breederConfig = trainerConfigs[TrainerType.EXPERT_POKEMON_BREEDER].clone();
  breederConfig.name = i18next.t(trainerNameKey);

  // First mon is *always* this special cleffa
  const cleffaSpecies = waveIndex < FIRST_STAGE_EVOLUTION_WAVE ? Species.CLEFFA : waveIndex < FINAL_STAGE_EVOLUTION_WAVE ? Species.CLEFAIRY : Species.CLEFABLE;
  const baseConfig: EnemyPartyConfig = {
    trainerType: TrainerType.EXPERT_POKEMON_BREEDER,
    pokemonConfigs: [
      {
        nickname: i18next.t(`${namespace}:cleffa_1_nickname`, { speciesName: getPokemonSpecies(cleffaSpecies).getName() }),
        species: getPokemonSpecies(cleffaSpecies),
        isBoss: false,
        abilityIndex: 1, // Magic Guard
        shiny: false,
        nature: Nature.ADAMANT,
        moveSet: [Moves.METEOR_MASH, Moves.FIRE_PUNCH, Moves.ICE_PUNCH, Moves.THUNDER_PUNCH],
        ivs: [31, 31, 31, 31, 31, 31],
        modifierConfigs: [
          {
            modifier: generateModifierType(scene, modifierTypes.TERA_SHARD, [Type.STEEL]) as PokemonHeldItemModifierType,
          }
        ]
      }
    ]
  };

  if (scene.arena.biomeType === Biome.SPACE) {
    // All 3 members always Cleffa line, but different configs
    baseConfig.pokemonConfigs!.push({
      nickname: i18next.t(`${namespace}:cleffa_2_nickname`, { speciesName: getPokemonSpecies(cleffaSpecies).getName() }),
      species: getPokemonSpecies(cleffaSpecies),
      isBoss: false,
      abilityIndex: 1, // Magic Guard
      shiny: true,
      variant: 1,
      nature: Nature.MODEST,
      moveSet: [Moves.MOONBLAST, Moves.MYSTICAL_FIRE, Moves.ICE_BEAM, Moves.THUNDERBOLT],
      ivs: [31, 31, 31, 31, 31, 31]
    },
    {
      nickname: i18next.t(`${namespace}:cleffa_3_nickname`, { speciesName: getPokemonSpecies(cleffaSpecies).getName() }),
      species: getPokemonSpecies(cleffaSpecies),
      isBoss: false,
      abilityIndex: 2, // Friend Guard / Unaware
      shiny: true,
      variant: 2,
      nature: Nature.BOLD,
      moveSet: [Moves.TRI_ATTACK, Moves.STORED_POWER, Moves.TAKE_HEART, Moves.MOONLIGHT],
      ivs: [31, 31, 31, 31, 31, 31]
    });
  } else {
    // Second member from pool 1
    const pool1Species = getSpeciesFromPool(POOL_1_POKEMON, waveIndex);
    // Third member from pool 2
    const pool2Species = getSpeciesFromPool(POOL_2_POKEMON, waveIndex);

    baseConfig.pokemonConfigs!.push({
      species: getPokemonSpecies(pool1Species),
      isBoss: false,
      ivs: [31, 31, 31, 31, 31, 31]
    },
    {
      species: getPokemonSpecies(pool2Species),
      isBoss: false,
      ivs: [31, 31, 31, 31, 31, 31]
    });
  }

  return baseConfig;
}

function getSpeciesFromPool(speciesPool: (Species | BreederSpeciesEvolution)[][], waveIndex: number): Species {
  const poolCopy = randSeedShuffle(speciesPool.slice(0));
  const speciesEvolutions = poolCopy.pop()!.slice(0);
  let speciesObject = speciesEvolutions.pop()!;
  while (speciesObject instanceof BreederSpeciesEvolution && speciesObject.evolution > waveIndex) {
    speciesObject = speciesEvolutions.pop()!;
  }
  return speciesObject instanceof BreederSpeciesEvolution ? speciesObject.species : speciesObject;
}

function calculateEggRewardsForPokemon(pokemon: PlayerPokemon): [number, number] {
  const bst = pokemon.calculateBaseStats().reduce((a, b) => a + b, 0);
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

function getEggOptions(scene: BattleScene, commonEggs: number, rareEggs: number) {
  const eggDescription = i18next.t(`${namespace}:title`) + ":\n" + i18next.t(trainerNameKey);
  const eggOptions: IEggOptions[] = [];

  if (commonEggs > 0) {
    for (let i = 0; i < commonEggs; i++) {
      eggOptions.push({
        scene,
        pulled: false,
        sourceType: EggSourceType.EVENT,
        eggDescriptor: eggDescription,
        tier: EggTier.COMMON
      });
    }
  }
  if (rareEggs > 0) {
    for (let i = 0; i < rareEggs; i++) {
      eggOptions.push({
        scene,
        pulled: false,
        sourceType: EggSourceType.EVENT,
        eggDescriptor: eggDescription,
        tier: EggTier.GREAT
      });
    }
  }

  return eggOptions;
}

function removePokemonFromPartyAndStoreHeldItems(scene: BattleScene, encounter: MysteryEncounter, chosenPokemon: PlayerPokemon) {
  const party = scene.getParty();
  const chosenIndex = party.indexOf(chosenPokemon);
  party[chosenIndex] = party[0];
  party[0] = chosenPokemon;
  encounter.misc.originalParty = scene.getParty().slice(1);
  encounter.misc.originalPartyHeldItems = encounter.misc.originalParty
    .map(p => p.getHeldItems());
  scene["party"] = [
    chosenPokemon
  ];
}

function checkAchievement(scene: BattleScene) {
  if (scene.arena.biomeType === Biome.SPACE) {
    scene.validateAchv(achvs.BREEDERS_IN_SPACE);
  }
}

async function restorePartyAndHeldItems(scene: BattleScene) {
  const encounter = scene.currentBattle.mysteryEncounter!;
  // Restore original party
  scene.getParty().push(...encounter.misc.originalParty);

  // Restore held items
  const originalHeldItems = encounter.misc.originalPartyHeldItems;
  originalHeldItems.forEach(pokemonHeldItemsList => {
    pokemonHeldItemsList.forEach(heldItem => {
      scene.addModifier(heldItem, true, false, false, true);
    });
  });
  await scene.updateModifiers(true);
}

function onGameOver(scene: BattleScene) {
  const encounter = scene.currentBattle.mysteryEncounter!;

  encounter.dialogue.outro = [
    {
      speaker: trainerNameKey,
      text: `${namespace}:outro_failed`,
    },
  ];

  // Restore original party, player loses all friendship with chosen mon (it remains fainted)
  restorePartyAndHeldItems(scene);
  const chosenPokemon  = encounter.misc.chosenPokemon;
  chosenPokemon.friendship = 0;

  // Clear all rewards that would have been earned
  encounter.doEncounterRewards = undefined;

  // Set flag that encounter was failed
  encounter.misc.encounterFailed = true;

  // Revert BGM
  scene.playBgm(scene.arena.bgm);

  // Clear any leftover battle phases
  scene.clearPhaseQueue();
  scene.clearPhaseQueueSplice();

  // Return enemy Pokemon
  const pokemon = scene.getEnemyPokemon();
  if (pokemon) {
    scene.playSound("se/pb_rel");
    pokemon.hideInfo();
    pokemon.tint(getPokeballTintColor(pokemon.pokeball), 1, 250, "Sine.easeIn");
    scene.tweens.add({
      targets: pokemon,
      duration: 250,
      ease: "Sine.easeIn",
      scale: 0.5,
      onComplete: () => {
        scene.field.remove(pokemon, true);
      }
    });
  }

  // Show the enemy trainer
  scene.time.delayedCall(250, () => {
    const sprites = scene.currentBattle.trainer?.getSprites();
    const tintSprites = scene.currentBattle.trainer?.getTintSprites();
    if (sprites && tintSprites) {
      for (let i = 0; i < sprites.length; i++) {
        sprites[i].setVisible(true);
        tintSprites[i].setVisible(true);
        sprites[i].clearTint();
        tintSprites[i].clearTint();
      }
    }
    scene.tweens.add({
      targets: scene.currentBattle.trainer,
      x: "-=16",
      y: "+=16",
      alpha: 1,
      ease: "Sine.easeInOut",
      duration: 750
    });
  });


  handleMysteryEncounterBattleFailed(scene, true);

  return false;
}

async function doPostEncounterCleanup(scene: BattleScene) {
  const encounter = scene.currentBattle.mysteryEncounter!;
  if (!encounter.misc.encounterFailed) {
    // Give achievement if in Space biome
    checkAchievement(scene);
    // Give 20 friendship to the chosen pokemon
    encounter.misc.chosenPokemon.addFriendship(FRIENDSHIP_ADDED);
    await restorePartyAndHeldItems(scene);
  }
}
