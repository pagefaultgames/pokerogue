import { Pokemon } from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import { BooleanHolder, randSeedShuffle } from "#app/utils/common";
import { ArenaTagType } from "#enums/arena-tag-type";
import { Stat } from "#enums/stat";

// TODO: Add tests for these
/** Interface representing an object associated with a specific Pokemon */
interface hasPokemon {
  getPokemon(): Pokemon;
}

/**
 * Sort an array of {@linkcode Pokemon} in speed order, taking Trick Room into account.
 * @param pokemonList - An array of `Pokemon` or objects containing `Pokemon` to sort;
 * will be mutated and sorted in place
 * @param shuffleFirst - Whether to shuffle the list before sorting (to handle speed ties); default `true`.
 * If `false`, speed ties will remain in the order they were in the original array
 */
export function sortInSpeedOrder<T extends Pokemon | hasPokemon>(pokemonList: T[], shuffleFirst = true): void {
  if (shuffleFirst) {
    shufflePokemonList(pokemonList);
  }
  sortBySpeed(pokemonList);
}

/**
 * Helper function to randomly shuffle an array of Pokemon.
 * @param pokemonList - The array of Pokemon or objects containing Pokemon to shuffle
 * @returns A reference to the same array, now shuffled in place
 */
function shufflePokemonList<T extends Pokemon | hasPokemon>(pokemonList: T[]): T[] {
  // This is seeded with the current turn to prevent an inconsistency where it
  // was varying based on how long since you last reloaded
  globalScene.executeWithSeedOffset(
    () => {
      randSeedShuffle(pokemonList);
    },
    globalScene.currentBattle.turn * 1000 + pokemonList.length,
    globalScene.waveSeed,
  );
  return pokemonList;
}

/** Sort an array containing Pokémon (or objects containing one) in speed order, without shuffling */
function sortBySpeed<T extends Pokemon | hasPokemon>(pokemonList: T[]): void {
  const { setOrder } = globalScene.turnCommandManager;
  // If a set turn order was provided, use that.
  if (setOrder) {
    pokemonList.sort((a, b) => {
      const aIndex = (a instanceof Pokemon ? a : a.getPokemon()).getBattlerIndex();
      const bIndex = (b instanceof Pokemon ? b : b.getPokemon()).getBattlerIndex();
      return setOrder.indexOf(aIndex) - setOrder.indexOf(bIndex);
    });
    return;
  }
  pokemonList.sort((a, b) => {
    const aSpeed = (a instanceof Pokemon ? a : a.getPokemon()).getEffectiveStat(Stat.SPD);
    const bSpeed = (b instanceof Pokemon ? b : b.getPokemon()).getEffectiveStat(Stat.SPD);

    return bSpeed - aSpeed;
  });

  /** 'true' if Trick Room is on the field. */
  const speedReversed = new BooleanHolder(false);
  globalScene.arena.applyTags(ArenaTagType.TRICK_ROOM, speedReversed);
  if (speedReversed.value) {
    pokemonList.reverse();
  }
}
