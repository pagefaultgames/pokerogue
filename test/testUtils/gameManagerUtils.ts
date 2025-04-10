import Battle from "#app/battle";
import { BattleType } from "#enums/battle-type";
import type BattleScene from "#app/battle-scene";
import { getDailyRunStarters } from "#app/data/daily-run";
import { Gender } from "#app/data/gender";
import { getPokemonSpecies, getPokemonSpeciesForm } from "#app/data/pokemon-species";
import { PlayerPokemon } from "#app/field/pokemon";
import { GameModes, getGameMode } from "#app/game-mode";
import type { StarterMoveset } from "#app/system/game-data";
import type { Starter } from "#app/ui/starter-select-ui-handler";
import { Moves } from "#enums/moves";
import type { Species } from "#enums/species";

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

export function generateStarter(scene: BattleScene, species?: Species[]): Starter[] {
  const seed = "test";
  const starters = getTestRunStarters(seed, species);
  const startingLevel = scene.gameMode.getStartingLevel();
  for (const starter of starters) {
    const starterProps = scene.gameData.getSpeciesDexAttrProps(starter.species, starter.dexAttr);
    const starterFormIndex = Math.min(starterProps.formIndex, Math.max(starter.species.forms.length - 1, 0));
    const starterGender =
      starter.species.malePercent !== null ? (!starterProps.female ? Gender.MALE : Gender.FEMALE) : Gender.GENDERLESS;
    const starterPokemon = scene.addPlayerPokemon(
      starter.species,
      startingLevel,
      starter.abilityIndex,
      starterFormIndex,
      starterGender,
      starterProps.shiny,
      starterProps.variant,
      undefined,
      starter.nature,
    );
    const moveset: Moves[] = [];
    starterPokemon.moveset.forEach(move => {
      moveset.push(move!.getMove().id);
    });
    starter.moveset = moveset as StarterMoveset;
  }
  return starters;
}

function getTestRunStarters(seed: string, species?: Species[]): Starter[] {
  if (!species) {
    return getDailyRunStarters(seed);
  }
  const starters: Starter[] = [];
  const startingLevel = getGameMode(GameModes.CLASSIC).getStartingLevel();

  for (const specie of species) {
    const starterSpeciesForm = getPokemonSpeciesForm(specie, 0);
    const starterSpecies = getPokemonSpecies(starterSpeciesForm.speciesId);
    const pokemon = new PlayerPokemon(starterSpecies, startingLevel, undefined, 0);
    const starter: Starter = {
      species: starterSpecies,
      dexAttr: pokemon.getDexAttr(),
      abilityIndex: pokemon.abilityIndex,
      passive: false,
      nature: pokemon.getNature(),
      pokerus: pokemon.pokerus,
    };
    starters.push(starter);
  }
  return starters;
}

export function waitUntil(truth): Promise<unknown> {
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
export function getMovePosition(scene: BattleScene, pokemonIndex: 0 | 1, move: Moves): number {
  const playerPokemon = scene.getPlayerField()[pokemonIndex];
  const moveSet = playerPokemon.getMoveset();
  const index = moveSet.findIndex(m => m.moveId === move && m.ppUsed < m.getMovePp());
  console.log(`Move position for ${Moves[move]} (=${move}):`, index);
  return index;
}

/**
 * Useful for populating party, wave index, etc. without having to spin up and run through an entire EncounterPhase
 */
export function initSceneWithoutEncounterPhase(scene: BattleScene, species?: Species[]): void {
  const starters = generateStarter(scene, species);
  starters.forEach(starter => {
    const starterProps = scene.gameData.getSpeciesDexAttrProps(starter.species, starter.dexAttr);
    const starterFormIndex = Math.min(starterProps.formIndex, Math.max(starter.species.forms.length - 1, 0));
    const starterGender = Gender.MALE;
    const starterIvs = scene.gameData.dexData[starter.species.speciesId].ivs.slice(0);
    const starterPokemon = scene.addPlayerPokemon(
      starter.species,
      scene.gameMode.getStartingLevel(),
      starter.abilityIndex,
      starterFormIndex,
      starterGender,
      starterProps.shiny,
      starterProps.variant,
      starterIvs,
      starter.nature,
    );
    starter.moveset && starterPokemon.tryPopulateMoveset(starter.moveset);
    scene.getPlayerParty().push(starterPokemon);
  });

  scene.currentBattle = new Battle(getGameMode(GameModes.CLASSIC), 5, BattleType.WILD, undefined, false);
}
