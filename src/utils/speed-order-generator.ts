import { globalScene } from "#app/global-scene";
import { PokemonPriorityQueue } from "#app/queues/pokemon-priority-queue";
import { ArenaTagSide } from "#enums/arena-tag-side";
import type { Pokemon } from "#field/pokemon";

export function* inSpeedOrder(side: ArenaTagSide = ArenaTagSide.BOTH): Generator<Pokemon> {
  let pokemonList: Pokemon[];
  switch (side) {
    case ArenaTagSide.PLAYER:
      pokemonList = globalScene.getPlayerField(true);
      break;
    case ArenaTagSide.ENEMY:
      pokemonList = globalScene.getEnemyField(true);
      break;
    default:
      pokemonList = globalScene.getField(true);
  }

  const queue = new PokemonPriorityQueue();
  pokemonList.forEach(p => {
    queue.push(p);
  });
  while (!queue.isEmpty()) {
    // If the queue is not empty, this can never be undefined
    yield queue.pop()!;
  }
}
