import type { Abilities } from "#enums/abilities";
import type { PokemonType } from "#enums/pokemon-type";
import type { Nature } from "#enums/nature";

/**
 * Data that can customize a Pokemon in non-standard ways from its Species.
 * Includes abilities, nature, changed types, etc.
 */
export class CustomPokemonData {
  // TODO: Change the default value for all these from -1 to something a bit more sensible
  /**
   * The scale at which to render this Pokemon's sprite.
   */
  public spriteScale = -1;
  public ability: Abilities | -1;
  public passive: Abilities | -1;
  public nature: Nature | -1;
  public types: PokemonType[];
  /** Deprecated but needed for session save migration */
  // TODO: Remove this once pre-session migration is implemented
  public hitsRecCount: number | null = null;

  constructor(data?: CustomPokemonData | Partial<CustomPokemonData>) {
    this.spriteScale = data?.spriteScale ?? -1;
    this.ability = data?.ability ?? -1;
    this.passive = data?.passive ?? -1;
    this.nature = data?.nature ?? -1;
    this.types = data?.types ?? [];
    this.hitsRecCount = data?.hitsRecCount ?? null;
  }
}
