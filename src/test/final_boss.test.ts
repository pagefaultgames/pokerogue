import { Biome } from "#app/enums/biome";
import { Species } from "#app/enums/species";
import { GameModes } from "#app/game-mode";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import GameManager from "./utils/gameManager";

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
    await game.runToFinalBossEncounter(game, [Species.BIDOOF], GameModes.CLASSIC);

    expect(game.scene.currentBattle.waveIndex).toBe(FinalWave.Classic);
    expect(game.scene.arena.biomeType).toBe(Biome.END);
    expect(game.scene.getEnemyPokemon()!.species.speciesId).toBe(Species.ETERNATUS);
  });

  it("should NOT spawn Eternatus before wave 200 in END biome", async () => {
    game.override.startingWave(FinalWave.Classic - 1);
    await game.runToFinalBossEncounter(game, [Species.BIDOOF], GameModes.CLASSIC);

    expect(game.scene.currentBattle.waveIndex).not.toBe(FinalWave.Classic);
    expect(game.scene.arena.biomeType).toBe(Biome.END);
    expect(game.scene.getEnemyPokemon()!.species.speciesId).not.toBe(Species.ETERNATUS);
  });

  it("should NOT spawn Eternatus outside of END biome", async () => {
    game.override.startingBiome(Biome.FOREST);
    await game.runToFinalBossEncounter(game, [Species.BIDOOF], GameModes.CLASSIC);

    expect(game.scene.currentBattle.waveIndex).toBe(FinalWave.Classic);
    expect(game.scene.arena.biomeType).not.toBe(Biome.END);
    expect(game.scene.getEnemyPokemon()!.species.speciesId).not.toBe(Species.ETERNATUS);
  });

  it("should not have passive enabled on Eternatus", async () => {
    await game.runToFinalBossEncounter(game, [Species.BIDOOF], GameModes.CLASSIC);

    const eternatus = game.scene.getEnemyPokemon();
    expect(eternatus?.species.speciesId).toBe(Species.ETERNATUS);
    expect(eternatus?.hasPassive()).toBe(false);
  });

  it.todo("should change form on direct hit down to last boss fragment", () => {});
});
