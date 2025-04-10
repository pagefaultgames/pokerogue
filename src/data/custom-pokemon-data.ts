import type { Abilities } from "#enums/abilities";
import type { PokemonType } from "#enums/pokemon-type";
import { isNullOrUndefined } from "#app/utils";
import type { Nature } from "#enums/nature";

/**
 * Data that can customize a Pokemon in non-standard ways from its Species
 * Used by Mystery Encounters and Mints
 * Also used as a counter how often a Pokemon got hit until new arena encounter
 */
export class CustomPokemonData {
  public spriteScale: number;
  public ability: Abilities | -1;
  public passive: Abilities | -1;
  public nature: Nature | -1;
  public types: PokemonType[];

  constructor(data?: CustomPokemonData | Partial<CustomPokemonData>) {
    if (!isNullOrUndefined(data)) {
      Object.assign(this, data);
    }

    this.spriteScale = this.spriteScale ?? -1;
    this.ability = this.ability ?? -1;
    this.passive = this.passive ?? -1;
    this.nature = this.nature ?? -1;
    this.types = this.types ?? [];
  }
}
