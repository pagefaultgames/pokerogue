import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#test/utils/gameManager";
import { Species } from "#enums/species";
import * as Utils from "#app/utils";

describe("Evolution tests", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
  });

  it("tandemaus evolution form test", async () => {
    /* this test checks to make sure that tandemaus will
     * evolve into a 3 family maushold 25% of the time
     * and a 4 family maushold the other 75% of the time
     * This is done by using the getEvolution method in pokemon.ts
     * getEvolution will give back the form that the pokemon can evolve into
     * It does this by checking the pokemon conditions in pokemon-forms.ts
     * For tandemaus, the conditions are random due to a randSeedInt(4)
     * If the value is 0, it's a 3 family maushold, whereas if the value is
     * 1, 2 or 3, it's a 4 family maushold
     */
    await game.startBattle([Species.TANDEMAUS]); // starts us off with a tandemaus
    const playerPokemon = game.scene.getPlayerPokemon();
    playerPokemon.level = 25; // tandemaus evolves at level 25
    vi.spyOn(Utils, "randSeedInt").mockReturnValue(0); // setting the random generator to be 0 to force a three family maushold
    const threeForm = playerPokemon.getEvolution();
    expect(threeForm.evoFormKey).toBe("three"); // as per pokemon-forms, the evoFormKey for 3 family mausholds is "three"
    for (let f = 1; f < 4; f++) {
      vi.spyOn(Utils, "randSeedInt").mockReturnValue(f); // setting the random generator to 1, 2 and 3 to force 4 family mausholds
      const fourForm = playerPokemon.getEvolution();
      expect(fourForm.evoFormKey).toBe(null); // meanwhile, according to the pokemon-forms, the evoFormKey for a 4 family maushold is null
    }
  }, 5000);
});
