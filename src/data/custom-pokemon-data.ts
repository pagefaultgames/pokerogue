import type { Abilities } from "#enums/abilities";
import type { PokemonType } from "#enums/pokemon-type";
import { isNullOrUndefined } from "#app/utils/common";
import type { Nature } from "#enums/nature";

/**
 * Data that can customize a Pokemon in non-standard ways from its Species.
 * Includes abilities, nature, changed types, etc.
 */
export class CustomPokemonData {
  public spriteScale = -1;
  public ability: Abilities | -1 = -1;
  public passive: Abilities | -1 = -1;
  public nature: Nature | -1 = -1;
  public types: PokemonType[] = [];

  constructor(data?: CustomPokemonData | Partial<CustomPokemonData>) {
    if (!isNullOrUndefined(data)) {
      Object.assign(this, data);
    }
  }
}
