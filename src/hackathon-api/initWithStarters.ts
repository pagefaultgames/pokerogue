import { SelectStarterPhase } from "../phases";
import { Starter } from "../ui/starter-select-ui-handler";
import { Species } from "../enums/species";
import {
  getPokemonSpecies,
  getPokemonSpeciesForm,
} from "../data/pokemon-species";
import { StarterMoveset } from "../system/game-data";
import { Gender } from "#app/data/gender";
import { PlayerPokemon } from "../field/pokemon";
import BattleScene from "#app/battle-scene.js";

/**
 * Creates a Starter object from a given Pokemon species number.
 *
 * @param speciesNumber - The species number of the Pokemon to be used as a starter.
 * @param scene - The BattleScene Scene ultilised by the game.
 * @returns A Starter object initialised with the given species number.
 */
const createStarterFromSpecies = (
  speciesNumber: Species,
  scene: BattleScene
): Starter => {
  const gameMode = scene.gameMode;

  const startingLevel = gameMode.getStartingLevel();
  const starterSpeciesForm = getPokemonSpeciesForm(speciesNumber, 0);
  const pokemonSpecies = getPokemonSpecies(starterSpeciesForm.speciesId);

  const pokemon = new PlayerPokemon(
    scene,
    pokemonSpecies,
    startingLevel,
    undefined,
    0,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined
  );

  const starter: Starter = {
    species: pokemonSpecies,
    dexAttr: pokemon.getDexAttr(),
    abilityIndex: pokemon.abilityIndex,
    passive: false,
    nature: pokemon.getNature(),
    pokerus: pokemon.pokerus,
  };

  const starterProps = scene.gameData.getSpeciesDexAttrProps(
    starter.species,
    starter.dexAttr
  );
  const starterFormIndex = Math.min(
    starterProps.formIndex,
    Math.max(starter.species.forms.length - 1, 0)
  );
  const starterGender =
    starter.species.malePercent !== null
      ? !starterProps.female
        ? Gender.MALE
        : Gender.FEMALE
      : Gender.GENDERLESS;
  const starterPokemon = scene.addPlayerPokemon(
    starter.species,
    startingLevel,
    starter.abilityIndex,
    starterFormIndex,
    starterGender,
    starterProps.shiny,
    starterProps.variant,
    undefined,
    starter.nature
  );
  starter.moveset = starterPokemon.moveset as unknown as StarterMoveset;

  return starter;
};

/**
 * Initialises the game with a specified list of starter Pokemon species.
 *
 * This function checks if the provided species numbers are valid starter Pokemon
 * and ensures they are unique. If valid, it creates Starter objects and initialises
 * the SelectStarterPhase with these starters.
 *
 * @param game - The Phaser game instance.
 * @param speciesNumbers - An array of Pokemon species numbers to be used as starters.
 * @throws Will throw an error if the number of starters is not exactly 3 or if the starters are not unique or not valid starter Pokemon.
 */
export const initWithStarters = (
  game: Phaser.Game,
  speciesNumbers: Species[]
) => {
  const starterPokedexNumbers = [
    // Generation 1
    1, 4, 7,
    // Generation 2
    152, 155, 158,
    // Generation 3
    252, 255, 258,
    // Generation 4
    387, 390, 393,
    // Generation 5
    495, 498, 501,
    // Generation 6
    650, 653, 656,
    // Generation 7
    722, 725, 728,
    // Generation 8
    810, 813, 816,
    // Generation 9
    906, 909, 912,
  ];
  if (speciesNumbers.length !== 3) {
    throw new Error("The number of starters should be exactly 3.");
  }

  const uniqueSpeciesNumbers = new Set(speciesNumbers);

  const areValidStarters =
    speciesNumbers.every((num) => starterPokedexNumbers.includes(num)) &&
    uniqueSpeciesNumbers.size === speciesNumbers.length;

  if (!areValidStarters) {
    throw new Error(
      "The starters should be a combination of three unique starter Pokemon numbers."
    );
  }

  const scenes = game.scene.getScenes(true);
  for (const scene of scenes) {
    if (scene.scene.key === "battle") {
      const battleScene = scene as BattleScene;
      console.log("BattleScene found.");
      const selectStarterPhase = battleScene.getCurrentPhase();
      if (selectStarterPhase instanceof SelectStarterPhase) {
        console.log("SelectStarterPhase found.");

        const starters: Starter[] = speciesNumbers.map((species) =>
          createStarterFromSpecies(species, battleScene)
        );

        starters.forEach((v) => {
          console.log("Starters chosen:", v);
        });

        selectStarterPhase.initBattle(starters);

        return;
      }
    }
  }
  setTimeout(() => initWithStarters(game, speciesNumbers), 500);
};
