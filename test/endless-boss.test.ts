import { BiomeId } from "#enums/biome-id";
import { GameModes } from "#enums/game-modes";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

const EndlessBossWave = {
  Minor: 250,
  Major: 1000,
};

describe("Endless Boss", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override.startingBiome(BiomeId.END).criticalHits(false);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it(`should spawn a minor boss every ${EndlessBossWave.Minor} waves in END biome in Endless`, async () => {
    game.override.startingWave(EndlessBossWave.Minor);
    await game.runToFinalBossEncounter([SpeciesId.BIDOOF], GameModes.ENDLESS);

    expect(game.scene.currentBattle.waveIndex).toBe(EndlessBossWave.Minor);
    expect(game.scene.arena.biomeType).toBe(BiomeId.END);
    const eternatus = game.field.getEnemyPokemon();
    expect(eternatus.species.speciesId).toBe(SpeciesId.ETERNATUS);
    expect(eternatus.hasPassive()).toBe(false);
    expect(eternatus.formIndex).toBe(0);
  });

  it(`should spawn a major boss every ${EndlessBossWave.Major} waves in END biome in Endless`, async () => {
    game.override.startingWave(EndlessBossWave.Major);
    await game.runToFinalBossEncounter([SpeciesId.BIDOOF], GameModes.ENDLESS);

    expect(game.scene.currentBattle.waveIndex).toBe(EndlessBossWave.Major);
    expect(game.scene.arena.biomeType).toBe(BiomeId.END);
    const eternatus = game.field.getEnemyPokemon();
    expect(eternatus.species.speciesId).toBe(SpeciesId.ETERNATUS);
    expect(eternatus.hasPassive()).toBe(false);
    expect(eternatus.formIndex).toBe(1);
  });

  it(`should spawn a minor boss every ${EndlessBossWave.Minor} waves in END biome in Spliced Endless`, async () => {
    game.override.startingWave(EndlessBossWave.Minor);
    await game.runToFinalBossEncounter([SpeciesId.BIDOOF], GameModes.SPLICED_ENDLESS);

    expect(game.scene.currentBattle.waveIndex).toBe(EndlessBossWave.Minor);
    expect(game.scene.arena.biomeType).toBe(BiomeId.END);
    const eternatus = game.field.getEnemyPokemon();
    expect(eternatus.species.speciesId).toBe(SpeciesId.ETERNATUS);
    expect(eternatus.hasPassive()).toBe(false);
    expect(eternatus.formIndex).toBe(0);
  });

  it(`should spawn a major boss every ${EndlessBossWave.Major} waves in END biome in Spliced Endless`, async () => {
    game.override.startingWave(EndlessBossWave.Major);
    await game.runToFinalBossEncounter([SpeciesId.BIDOOF], GameModes.SPLICED_ENDLESS);

    expect(game.scene.currentBattle.waveIndex).toBe(EndlessBossWave.Major);
    expect(game.scene.arena.biomeType).toBe(BiomeId.END);
    const eternatus = game.field.getEnemyPokemon();
    expect(eternatus.species.speciesId).toBe(SpeciesId.ETERNATUS);
    expect(eternatus.hasPassive()).toBe(false);
    expect(eternatus.formIndex).toBe(1);
  });

  it(`should NOT spawn major or minor boss outside wave ${EndlessBossWave.Minor}s in END biome`, async () => {
    game.override.startingWave(EndlessBossWave.Minor - 1);
    await game.runToFinalBossEncounter([SpeciesId.BIDOOF], GameModes.ENDLESS);

    expect(game.scene.currentBattle.waveIndex).not.toBe(EndlessBossWave.Minor);
    expect(game.field.getEnemyPokemon().species.speciesId).not.toBe(SpeciesId.ETERNATUS);
  });
});
