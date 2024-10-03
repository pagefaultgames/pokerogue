import { Abilities } from "#enums/abilities";
import { Type } from "#app/data/type";
import { isNullOrUndefined } from "#app/utils";
import { Nature } from "#enums/nature";

/**
 * Data that can customize a Pokemon in non-standard ways from its Species
 * Currently only used by Mystery Encounters and Mints
 */
export class CustomPokemonData {
  public spriteScale: number;
  public ability: Abilities | -1;
  public passive: Abilities | -1;
  public nature: Nature | -1;
  public types: Type[];

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
