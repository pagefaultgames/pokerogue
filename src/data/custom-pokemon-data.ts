import type { Abilities } from "#enums/abilities";
import type { PokemonType } from "#enums/pokemon-type";
import type { Nature } from "#enums/nature";

/**
 * Data that can customize a Pokemon in non-standard ways from its Species.
 * Includes abilities, nature, changed types, etc.
 */
export class CustomPokemonData {
  public spriteScale: number;
  public ability: Abilities | -1;
  public passive: Abilities | -1;
  public nature: Nature | -1;
  public types: PokemonType[];

  constructor(data?: CustomPokemonData | Partial<CustomPokemonData>) {
    this.spriteScale = data?.spriteScale ?? 1;
    this.ability = data?.ability ?? -1;
    this.passive = data?.passive ?? -1;
    this.nature = data?.nature ?? -1;
    this.types = data?.types ?? [];
  }
}
