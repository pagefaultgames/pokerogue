import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import type { PlayerPokemon } from "#field/pokemon";
import type { DexEntry } from "#types/dex-data";
import type { StarterDataEntry } from "#types/save-data";

export class FusionUnlockSplashPhase extends Phase {
  public readonly phaseName = "FusionUnlockSplashPhase";
  private pokemon: PlayerPokemon;
  private text: string;
  private dexEntry: DexEntry;
  private starterEntry: StarterDataEntry;

  constructor(pokemon: PlayerPokemon, text: string, dexEntry: DexEntry, starterEntry: StarterDataEntry) {
    super();
    this.pokemon = pokemon;
    this.text = text;
    this.dexEntry = dexEntry;
    this.starterEntry = starterEntry;
  }

  start(): void {
    super.start();
    globalScene.pokemonInfoContainer.show(this.pokemon, true, 1, this.dexEntry, this.starterEntry);
    globalScene.playSound("se/level_up_fanfare");
    globalScene.ui.showText(
      this.text,
      null,
      () => {
        void globalScene.pokemonInfoContainer.hide();
        this.end();
      },
      null,
      true,
    );
  }
}
