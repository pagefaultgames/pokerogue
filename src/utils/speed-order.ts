import Pokemon from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import { PokemonPriorityQueue } from "#app/queues/pokemon-priority-queue";
import { BooleanHolder, randSeedShuffle } from "#app/utils/common";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { Stat } from "#enums/stat";

export interface hasPokemon {
  getPokemon(): Pokemon;
}

const sideToField = new Map<ArenaTagSide, (active: boolean) => Pokemon[]>([
  [ArenaTagSide.BOTH, globalScene.getField],
  [ArenaTagSide.PLAYER, globalScene.getPlayerField],
  [ArenaTagSide.ENEMY, globalScene.getEnemyField],
]);

export function applyInSpeedOrder<T extends Pokemon>(pokemonList: T[], callback: (pokemon: Pokemon) => any): void {
  sortInSpeedOrder(pokemonList).forEach(pokemon => {
    callback(pokemon);
  });
}

export function* inSpeedOrder(side: ArenaTagSide = ArenaTagSide.BOTH): Generator<Pokemon> {
  const queue = new PokemonPriorityQueue();
  sideToField.get(side)!(true).forEach(p => {
    queue.push(p);
  });
  while (!queue.isEmpty()) {
    // If the queue is not empty, this can never be undefined
    yield queue.pop()!;
  }
}

export function sortInSpeedOrder<T extends Pokemon | hasPokemon>(pokemonList: T[], shuffleFirst = true): T[] {
  pokemonList = shuffleFirst ? shuffle(pokemonList) : pokemonList;
  sortBySpeed(pokemonList);
  return pokemonList;
}

/** Randomly shuffles the queue. */
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
