import type { Pokemon } from "#app/field/pokemon";
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
 * Sort an array of {@linkcode Pokemon} or related objects by speed, taking Trick Room into account.
 * Consecutive actions made by the same Pokemon will remain in their original order pre-sort.
 * @param pokemonList - The list of Pokemon or objects containing Pokemon to shuffle
 * @returns The sorted array of {@linkcode Pokemon}.
 * @remarks
 * Unlike {@linkcode Array.sort}, this does _not_ mutate `pokemonList` in place.
 */
export function sortInSpeedOrder<T extends Pokemon | hasPokemon>(pokemonList: readonly T[]): T[] {
  const grouped = groupPokemon(pokemonList);
  shufflePokemonList(grouped);
  sortBySpeed(grouped);
  return grouped.flat();
}

/**
 * Helper function to randomly shuffle an array of Pokemon.
 * @param pokemonList - The array of Pokemon or objects containing Pokemon to shuffle
 */
function shufflePokemonList<T extends Pokemon | hasPokemon>(pokemonList: T[][]): void {
  // This is seeded with the current turn to prevent an inconsistency where it
  // was varying based on how long since you last reloaded
  globalScene.executeWithSeedOffset(
    () => {
      randSeedShuffle(pokemonList);
    },
    globalScene.currentBattle.turn * 1000 + pokemonList.length,
    globalScene.waveSeed,
  );
}

/** Type guard for {@linkcode sortBySpeed} to avoid importing {@linkcode Pokemon} */
function isPokemon(p: Pokemon | hasPokemon): p is Pokemon {
  return typeof (p as hasPokemon).getPokemon !== "function";
}

function getPokemon(p: Pokemon | hasPokemon): Pokemon {
  return isPokemon(p) ? p : p.getPokemon();
}

/**
 * Sort an array of {@linkcode Pokemon} (or objects containing them) in speed order, without shuffling.
 * @param groupedPokemonList - A grouped array of objects to sort; will be mutated in place
 */
function sortBySpeed<T extends Pokemon | hasPokemon>(groupedPokemonList: T[][]): void {
  const { setOrder } = globalScene.turnCommandManager;

  // If a set turn order was provided, use that in ascending order.
  if (setOrder) {
    groupedPokemonList.sort((a, b) => {
      const aIndex = getPokemon(a[0]).getBattlerIndex();
      const bIndex = getPokemon(b[0]).getBattlerIndex();
      return setOrder.indexOf(aIndex) - setOrder.indexOf(bIndex);
    });
    return;
  }

  groupedPokemonList.sort((a, b) => {
    const aSpeed = getPokemon(a[0]).getEffectiveStat(Stat.SPD);
    const bSpeed = getPokemon(b[0]).getEffectiveStat(Stat.SPD);

    return bSpeed - aSpeed;
  });

  /** 'true' if Trick Room is on the field. */
  const speedReversed = new BooleanHolder(false);
  globalScene.arena.applyTags(ArenaTagType.TRICK_ROOM, speedReversed);
  if (speedReversed.value) {
    groupedPokemonList.reverse();
  }
}

/**
 * Compact consecutive instances of Pokemon or related objects together to avoid self speed ties.
 * @param pokemonList - The initial array to group together
 * @returns A 2-dimensional array where every instance of consecutive actions from the same Pokemon
 * have been grouped together.
 */
function groupPokemon<T extends Pokemon | hasPokemon>(pokemonList: readonly T[]): T[][] {
  const runs: T[][] = [];
  for (const pkmn of pokemonList) {
    const pokemon = getPokemon(pkmn);
    const lastGroup = runs.at(-1);
    if (lastGroup != null && lastGroup.length > 0 && getPokemon(lastGroup[0]) === pokemon) {
      lastGroup.push(pkmn);
    } else {
      runs.push([pkmn]);
    }
  }

  return runs;
}
