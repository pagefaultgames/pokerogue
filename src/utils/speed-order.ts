import type { Pokemon } from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import { BooleanHolder, randSeedShuffle } from "#app/utils/common";
import { ArenaTagType } from "#enums/arena-tag-type";
import { Stat } from "#enums/stat";

/** Interface representing an object associated with a specific Pokemon */
interface hasPokemon {
  getPokemon(): Pokemon;
}

/**
 * Sorts an array of {@linkcode Pokemon} by speed, taking Trick Room into account.
 * @param pokemonList - The list of Pokemon or objects containing Pokemon
 * @param shuffleFirst - Whether to shuffle the list before sorting (to handle speed ties). Default `true`.
 * @returns The sorted array of {@linkcode Pokemon}
 */
export function sortInSpeedOrder<T extends Pokemon | hasPokemon>(pokemonList: T[], shuffleFirst = true): T[] {
  if (shuffleFirst) {
    shufflePokemonList(pokemonList);
  }
  sortBySpeed(pokemonList);
  return pokemonList;
}

/**
 * Shuffle the list of pokemon *in place*
 * @param pokemonList - The array of Pokemon or objects containing Pokemon
 * @returns The same array instance that was passed in, shuffled.
 */
function shufflePokemonList<T extends Pokemon | hasPokemon>(pokemonList: T[]): T[] {
  // This is seeded with the current turn to prevent an inconsistency where it
  // was varying based on how long since you last reloaded
  globalScene.executeWithSeedOffset(
    () => randSeedShuffle(pokemonList),
    globalScene.currentBattle.turn * 1000 + pokemonList.length,
    globalScene.waveSeed,
  );
  return pokemonList;
}

/** Type guard for {@linkcode sortBySpeed} to avoid importing {@linkcode Pokemon} */
function isPokemon(p: Pokemon | hasPokemon): p is Pokemon {
  return typeof (p as hasPokemon).getPokemon !== "function";
}

/** Sorts an array of {@linkcode Pokemon} by speed (without shuffling) */
function sortBySpeed<T extends Pokemon | hasPokemon>(pokemonList: T[]): void {
  pokemonList.sort((a, b) => {
    const aSpeed = (isPokemon(a) ? a : a.getPokemon()).getEffectiveStat(Stat.SPD);
    const bSpeed = (isPokemon(b) ? b : b.getPokemon()).getEffectiveStat(Stat.SPD);

    return bSpeed - aSpeed;
  });

  /** 'true' if Trick Room is on the field. */
  const speedReversed = new BooleanHolder(false);
  globalScene.arena.applyTags(ArenaTagType.TRICK_ROOM, speedReversed);
  if (speedReversed.value) {
    pokemonList.reverse();
  }
}
