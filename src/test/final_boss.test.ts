import { Biome } from "#app/enums/biome.js";
import { Species } from "#app/enums/species.js";
import { GameModes, getGameMode } from "#app/game-mode.js";
import { EncounterPhase, SelectStarterPhase } from "#app/phases.js";
import { Mode } from "#app/ui/ui.js";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import GameManager from "./utils/gameManager";
import { generateStarter } from "./utils/gameManagerUtils";

const FINAL_WAVE = {
  CLASSIC: 200,
};

describe("Final Boss", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override.startingWave(FINAL_WAVE.CLASSIC).startingBiome(Biome.END);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it("should spawn Eternatus on wave 200 in END biome", async () => {
    await game.runToTitle();

    game.onNextPrompt("TitlePhase", Mode.TITLE, () => {
      game.scene.gameMode = getGameMode(GameModes.CLASSIC);
      const starters = generateStarter(game.scene, [Species.BIDOOF]);
      const selectStarterPhase = new SelectStarterPhase(game.scene);
      game.scene.pushPhase(new EncounterPhase(game.scene, false));
      selectStarterPhase.initBattle(starters);
    });

    game.onNextPrompt("EncounterPhase", Mode.MESSAGE, async () => {
      // This will skip all entry dialogue (I can't figure out a way to sequentially handle the 8 chained messages via 1 prompt handler)
      game.setMode(Mode.MESSAGE);
      const encounterPhase = game.scene.getCurrentPhase() as EncounterPhase;

      // No need to end phase, this will do it for you
      encounterPhase.doEncounterCommon(false);
    });

    await game.phaseInterceptor.to(EncounterPhase, true);

    const { speciesId } = game.scene.getEnemyPokemon().species;
    expect(speciesId, `Expected ${Species[Species.ETERNATUS]} but found ${Species[speciesId]}`).toBe(Species.ETERNATUS);
  });

  it("should change form on direct hit down to last boss fragment", () => {});
});
