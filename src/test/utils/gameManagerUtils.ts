import BattleScene from "#app/battle-scene";
import { getDailyRunStarters } from "#app/data/daily-run";
import { Gender } from "#app/data/gender";
import { getPokemonSpecies, getPokemonSpeciesForm } from "#app/data/pokemon-species";
import { Moves } from "#app/enums/moves";
import { PlayerPokemon } from "#app/field/pokemon";
import { GameModes, getGameMode } from "#app/game-mode";
import { Starter } from "#app/ui/starter-select-ui-handler";
import { Species } from "#enums/species";

/** Function to convert Blob to string */
export function blobToString(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error("Error reading Blob as string"));
    };

    reader.readAsText(blob);
  });
}


export function holdOn(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function generateStarter(scene, species?: Species[]) {
  const seed = "test";
  const starters = getTestRunStarters(scene, seed, species);
  const startingLevel = scene.gameMode.getStartingLevel();
  for (const starter of starters) {
    const starterProps = scene.gameData.getSpeciesDexAttrProps(starter.species, starter.dexAttr);
    const starterFormIndex = Math.min(starterProps.formIndex, Math.max(starter.species.forms.length - 1, 0));
    const starterGender = starter.species.malePercent !== null
      ? !starterProps.female ? Gender.MALE : Gender.FEMALE
      : Gender.GENDERLESS;
    const starterPokemon = scene.addPlayerPokemon(starter.species, startingLevel, starter.abilityIndex, starterFormIndex, starterGender, starterProps.shiny, starterProps.variant, undefined, starter.nature);
    starter.moveset = starterPokemon.moveset;
  }
  return starters;
}

function getTestRunStarters(scene, seed, species) {
  if (!species) {
    return getDailyRunStarters(scene, seed);
  }
  const starters: Starter[] = [];
  const startingLevel = getGameMode(GameModes.CLASSIC).getStartingLevel();

  for (const specie of species) {
    const starterSpeciesForm = getPokemonSpeciesForm(specie, 0);
    const starterSpecies = getPokemonSpecies(starterSpeciesForm.speciesId);
    const pokemon = new PlayerPokemon(scene, starterSpecies, startingLevel, undefined, 0, undefined, undefined, undefined, undefined, undefined, undefined);
    const starter: Starter = {
      species: starterSpecies,
      dexAttr: pokemon.getDexAttr(),
      abilityIndex: pokemon.abilityIndex,
      passive: false,
      nature: pokemon.getNature(),
      pokerus: pokemon.pokerus
    };
    starters.push(starter);
  }
  return starters;
}

export function waitUntil(truth) {
  return new Promise(resolve => {
    const interval = setInterval(() => {
      if (truth()) {
        clearInterval(interval);
        resolve(true);
      }
    }, 1000);
  });
}

/** Get the index of `move` from the moveset of the pokemon on the player's field at location `pokemonIndex` */
export function getMovePosition(scene: BattleScene, pokemonIndex: 0 | 1, move: Moves) {
  const playerPokemon = scene.getPlayerField()[pokemonIndex];
  const moveSet = playerPokemon.getMoveset();
  const index = moveSet.findIndex((m) => m?.moveId === move);
  console.log(`Move position for ${Moves[move]} (=${move}):`, index);
  return index;
}
