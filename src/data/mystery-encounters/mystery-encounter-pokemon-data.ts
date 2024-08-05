import { Abilities } from "#enums/abilities";
import { Type } from "#app/data/type";

export class MysteryEncounterPokemonData {
  public spriteScale: number;
  public ability: Abilities;
  public passive: Abilities;
  public types: Type[] = [];

  constructor(spriteScale?: number, ability?: Abilities, passive?: Abilities, types?: Type[]) {
    this.spriteScale = spriteScale;
    this.ability = ability;
    this.passive = passive;
    this.types = types;
  }
}
