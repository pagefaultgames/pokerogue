import { Pokemon } from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import { BooleanHolder, randSeedShuffle } from "#app/utils/common";
import { ArenaTagType } from "#enums/arena-tag-type";
import { Stat } from "#enums/stat";

/** Interface representing a generic type which has a `getPokemon` method */
interface hasPokemon {
  getPokemon(): Pokemon;
}

export function applyInSpeedOrder<T extends Pokemon>(pokemonList: T[], callback: (pokemon: Pokemon) => any): void {
  sortInSpeedOrder(pokemonList).forEach(pokemon => {
    callback(pokemon);
  });
}

/**
 * Sorts an array of {@linkcode Pokemon} by speed, including Trick Room
 * @param pokemonList - The list of Pokemon
 * @param shuffleFirst - Whether to shuffle the list before sorting (to handle speed ties). Default `true`.
 * @returns The sorted array of {@linkcode Pokemon}
 */
export function sortInSpeedOrder<T extends Pokemon | hasPokemon>(pokemonList: T[], shuffleFirst = true): T[] {
  pokemonList = shuffleFirst ? shuffle(pokemonList) : pokemonList;
  sortBySpeed(pokemonList);
  return pokemonList;
}

/**
 * @param pokemonList - The array
 * @returns The array, shuffled
 */
function shuffle<T extends Pokemon | hasPokemon>(pokemonList: T[]): T[] {
  // This is seeded with the current turn to prevent an inconsistency where it
  // was varying based on how long since you last reloaded
  globalScene.executeWithSeedOffset(
    () => {
      pokemonList = randSeedShuffle(pokemonList);
    },
    globalScene.currentBattle.turn * 1000 + pokemonList.length,
    globalScene.waveSeed,
  );
  return pokemonList;
}

/** Sorts an array of {@linkcode Pokemon} by speed (without shuffling) */
function sortBySpeed<T extends Pokemon | hasPokemon>(pokemonList: T[]): void {
  pokemonList.sort((a, b) => {
    const [aSpeed, bSpeed] = [a, b].map(pkmn =>
      pkmn instanceof Pokemon ? pkmn.getEffectiveStat(Stat.SPD) : pkmn.getPokemon().getEffectiveStat(Stat.SPD),
    );
    return bSpeed - aSpeed;
  });

  /** 'true' if Trick Room is on the field. */
  const speedReversed = new BooleanHolder(false);
  globalScene.arena.applyTags(ArenaTagType.TRICK_ROOM, false, speedReversed);

  if (speedReversed.value) {
    pokemonList.reverse();
  }
}
