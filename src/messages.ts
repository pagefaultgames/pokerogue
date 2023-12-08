import Pokemon from "./pokemon";

export function getPokemonMessage(pokemon: Pokemon, content: string): string {
  return `${!pokemon.isPlayer() ? pokemon.hasTrainer() ? 'Foe ' : 'Wild ' : ''}${pokemon.name}${content}`;
}