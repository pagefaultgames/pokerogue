import { Abilities } from "#enums/abilities";
import { Type } from "#app/data/type";

export class MysteryEncounterPokemonData {
  public spriteScale: number;
  public ability: Abilities | -1;
  public passive: Abilities | -1;
  public types: Type[];

  constructor(spriteScale?: number, ability?: Abilities, passive?: Abilities, types?: Type[]) {
    this.spriteScale = spriteScale ?? -1;
    this.ability = ability ?? -1;
    this.passive = passive ?? -1;
    this.types = types ?? [];
  }
}
