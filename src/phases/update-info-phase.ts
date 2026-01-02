import { Phase } from "#app/phase";
import type { Pokemon } from "#field/pokemon";

export class UpdateInfoPhase extends Phase {
  public override readonly phaseName = "UpdateInfoPhase";
  private readonly pokemon: Pokemon;

  constructor(pokemon: Pokemon) {
    super();
    this.pokemon = pokemon;
  }

  public override async start(): Promise<void> {
    await this.pokemon.updateInfo();
    this.end();
  }
}
