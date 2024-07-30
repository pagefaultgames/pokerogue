import { Biome } from "#app/enums/biome.js";
import { Species } from "#app/enums/species.js";
import { GameModes, getGameMode } from "#app/game-mode.js";
import { EncounterPhase, SelectStarterPhase } from "#app/phases.js";
import { Mode } from "#app/ui/ui.js";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import GameManager from "./utils/gameManager";
import { generateStarter } from "./utils/gameManagerUtils";

const FinalWave = {
  Classic: 200,
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
    game.override.startingWave(FinalWave.Classic).startingBiome(Biome.END).disableCrits();
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it("should spawn Eternatus on wave 200 in END biome", async () => {
    await runToFinalBossEncounter(game, [Species.BIDOOF]);

    expect(game.scene.currentBattle.waveIndex).toBe(FinalWave.Classic);
    expect(game.scene.arena.biomeType).toBe(Biome.END);
    expect(game.scene.getEnemyPokemon().species.speciesId).toBe(Species.ETERNATUS);
  });

  it("should NOT spawn Eternatus before wave 200 in END biome", async () => {
    game.override.startingWave(FinalWave.Classic - 1);
    await runToFinalBossEncounter(game, [Species.BIDOOF]);

    expect(game.scene.currentBattle.waveIndex).not.toBe(FinalWave.Classic);
    expect(game.scene.arena.biomeType).toBe(Biome.END);
    expect(game.scene.getEnemyPokemon().species.speciesId).not.toBe(Species.ETERNATUS);
  });

  it("should NOT spawn Eternatus outside of END biome", async () => {
    game.override.startingBiome(Biome.FOREST);
    await runToFinalBossEncounter(game, [Species.BIDOOF]);

    expect(game.scene.currentBattle.waveIndex).toBe(FinalWave.Classic);
    expect(game.scene.arena.biomeType).not.toBe(Biome.END);
    expect(game.scene.getEnemyPokemon().species.speciesId).not.toBe(Species.ETERNATUS);
  });

  it.todo("should change form on direct hit down to last boss fragment", () => {});
});

/**
 * Helper function to run to the final boss encounter as it's a bit tricky due to extra dialogue
 * @param game - The game manager
 */
async function runToFinalBossEncounter(game: GameManager, species: Species[]) {
  console.log("===to final boss encounter===");
  await game.runToTitle();

  game.onNextPrompt("TitlePhase", Mode.TITLE, () => {
    game.scene.gameMode = getGameMode(GameModes.CLASSIC);
    const starters = generateStarter(game.scene, species);
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
  console.log("===finished run to final boss encounter===");
}
