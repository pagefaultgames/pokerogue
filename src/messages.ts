import Pokemon, { EnemyPokemon } from "./pokemon";

export function getPokemonMessage(pokemon: Pokemon, content: string): string {
  return `${!pokemon.isPlayer() ? 'Wild ' : ''}${pokemon.name}${content}`;
}