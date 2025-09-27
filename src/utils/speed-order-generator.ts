import { globalScene } from "#app/global-scene";
import { PokemonPriorityQueue } from "#app/queues/pokemon-priority-queue";
import { ArenaSide } from "#enums/arena-side";
import type { Pokemon } from "#field/pokemon";

/**
 * A generator function which uses a priority queue to yield each pokemon from a given side of the field in speed order.
 * @param side - The {@linkcode ArenaSide | side} of the field to use
 * @returns A {@linkcode Generator} of {@linkcode Pokemon}
 *
 * @remarks
 * This should almost always be used by iteration in a `for...of` loop
 */
export function* inSpeedOrder(side: ArenaSide = ArenaSide.BOTH): Generator<Pokemon, number> {
  let pokemonList: Pokemon[];
  switch (side) {
    case ArenaSide.PLAYER:
      pokemonList = globalScene.getPlayerField(true);
      break;
    case ArenaSide.ENEMY:
      pokemonList = globalScene.getEnemyField(true);
      break;
    default:
      pokemonList = globalScene.getField(true);
  }

  const queue = new PokemonPriorityQueue();
  let i = 0;
  pokemonList.forEach(p => {
    queue.push(p);
  });
  while (!queue.isEmpty()) {
    // If the queue is not empty, this can never be undefined
    i++;
    yield queue.pop()!;
  }

  return i;
}
