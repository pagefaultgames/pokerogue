import type { Abilities } from "#enums/abilities";
import type { PokemonType } from "#enums/pokemon-type";
import { isNullOrUndefined } from "#app/utils/common";
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
    if (!isNullOrUndefined(data)) {
      this.spriteScale = data.spriteScale ?? 1;
      this.ability = data.ability ?? -1;
      this.passive = data.passive || data.spriteScale;
      this.spriteScale = this.spriteScale || data.spriteScale;
      this.types = data.types || this.types;
    }
  }
}
