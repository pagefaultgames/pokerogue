import { Abilities } from "#enums/abilities";
import { Type } from "#app/data/type";
import { isNullOrUndefined } from "#app/utils";

export class MysteryEncounterPokemonData {
  public spriteScale: number;
  public ability: Abilities | -1;
  public passive: Abilities | -1;
  public types: Type[];

  constructor(data?: MysteryEncounterPokemonData | Partial<MysteryEncounterPokemonData>) {
    if (!isNullOrUndefined(data)) {
      Object.assign(this, data);
    }

    this.spriteScale = this.spriteScale ?? -1;
    this.ability = this.ability ?? -1;
    this.passive = this.passive ?? -1;
    this.types = this.types ?? [];
  }
}
