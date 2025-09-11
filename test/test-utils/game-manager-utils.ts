import { Battle } from "#app/battle";
import type { BattleScene } from "#app/battle-scene";
import { getGameMode } from "#app/game-mode";
import { getDailyRunStarters } from "#data/daily-run";
import { Gender } from "#data/gender";
import { BattleType } from "#enums/battle-type";
import { GameModes } from "#enums/game-modes";
import type { MoveId } from "#enums/move-id";
import type { SpeciesId } from "#enums/species-id";
import { PlayerPokemon } from "#field/pokemon";
import type { Starter, StarterMoveset } from "#types/save-data";
import { getPokemonSpecies, getPokemonSpeciesForm } from "#utils/pokemon-utils";

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

export function generateStarters(scene: BattleScene, speciesIds?: SpeciesId[]): Starter[] {
  const seed = "test";
  const starters = getTestRunStarters(seed, speciesIds);
  const startingLevel = scene.gameMode.getStartingLevel();
  for (const starter of starters) {
    const species = getPokemonSpecies(starter.speciesId);
    const starterFormIndex = starter.formIndex;
    const starterGender =
      species.malePercent !== null ? (starter.female ? Gender.FEMALE : Gender.MALE) : Gender.GENDERLESS;
    const starterPokemon = scene.addPlayerPokemon(
      species,
      startingLevel,
      starter.abilityIndex,
      starterFormIndex,
      starterGender,
      starter.shiny,
      starter.variant,
      starter.ivs,
      starter.nature,
    );
    const moveset: MoveId[] = [];
    starterPokemon.moveset.forEach(move => {
      moveset.push(move!.getMove().id);
    });
    starter.moveset = moveset as StarterMoveset;
  }
  return starters;
}

function getTestRunStarters(seed: string, speciesIds?: SpeciesId[]): Starter[] {
  if (!speciesIds || speciesIds.length === 0) {
    return getDailyRunStarters(seed);
  }
  const starters: Starter[] = [];
  const startingLevel = getGameMode(GameModes.CLASSIC).getStartingLevel();

  for (const speciesId of speciesIds) {
    const starterSpeciesForm = getPokemonSpeciesForm(speciesId, 0);
    const starterSpecies = getPokemonSpecies(starterSpeciesForm.speciesId);
    const pokemon = new PlayerPokemon(starterSpecies, startingLevel, undefined, 0);
    const starter: Starter = {
      speciesId,
      shiny: pokemon.shiny,
      variant: pokemon.variant,
      formIndex: pokemon.formIndex,
      ivs: pokemon.ivs,
      abilityIndex: pokemon.abilityIndex,
      passive: false,
      nature: pokemon.getNature(),
      pokerus: pokemon.pokerus,
    };
    starters.push(starter);
  }
  return starters;
}

/**
 * Useful for populating party, wave index, etc. without having to spin up and run through an entire EncounterPhase
 */
export function initSceneWithoutEncounterPhase(scene: BattleScene, speciesIds?: SpeciesId[]): void {
  const starters = generateStarters(scene, speciesIds);
  starters.forEach(starter => {
    const starterFormIndex = starter.formIndex;
    const starterGender = Gender.MALE;
    const starterPokemon = scene.addPlayerPokemon(
      getPokemonSpecies(starter.speciesId),
      scene.gameMode.getStartingLevel(),
      starter.abilityIndex,
      starterFormIndex,
      starterGender,
      starter.shiny,
      starter.variant,
      starter.ivs,
      starter.nature,
    );
    starter.moveset && starterPokemon.tryPopulateMoveset(starter.moveset);
    scene.getPlayerParty().push(starterPokemon);
  });

  scene.currentBattle = new Battle(getGameMode(GameModes.CLASSIC), 5, BattleType.WILD, undefined, false);
}
