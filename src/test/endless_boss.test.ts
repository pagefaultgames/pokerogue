import { Biome } from "#app/enums/biome";
import { Species } from "#app/enums/species";
import { GameModes, getGameMode } from "#app/game-mode";
import { EncounterPhase, SelectStarterPhase } from "#app/phases.js";
import { Mode } from "#app/ui/ui";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import GameManager from "./utils/gameManager";
import { generateStarter } from "./utils/gameManagerUtils";

const EndlessBossWave = {
  Minor: 250,
  Major: 1000
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
    game.override
      .startingBiome(Biome.END)
      .disableCrits();
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it("should spawn a minor boss every 250 waves in END biome in Endless", async () => {
    game.override.startingWave(EndlessBossWave.Minor);
    await runToEndlessBossEncounter(game, [Species.BIDOOF], GameModes.ENDLESS);

    expect(game.scene.currentBattle.waveIndex).toBe(EndlessBossWave.Minor);
    expect(game.scene.arena.biomeType).toBe(Biome.END);
    const eternatus = game.scene.getEnemyPokemon();
    expect(eternatus?.species.speciesId).toBe(Species.ETERNATUS);
    expect(eternatus?.hasPassive()).toBe(false);
    expect(eternatus?.formIndex).toBe(0);
  });

  it("should spawn a major boss every 1000 waves in END biome in Endless", async () => {
    game.override.startingWave(EndlessBossWave.Major);
    await runToEndlessBossEncounter(game, [Species.BIDOOF], GameModes.ENDLESS);

    expect(game.scene.currentBattle.waveIndex).toBe(EndlessBossWave.Major);
    expect(game.scene.arena.biomeType).toBe(Biome.END);
    const eternatus = game.scene.getEnemyPokemon();
    expect(eternatus?.species.speciesId).toBe(Species.ETERNATUS);
    expect(eternatus?.hasPassive()).toBe(false);
    expect(eternatus?.formIndex).toBe(1);
  });

  it("should spawn a minor boss every 250 waves in END biome in Spliced Endless", async () => {
    game.override.startingWave(EndlessBossWave.Minor);
    await runToEndlessBossEncounter(game, [Species.BIDOOF], GameModes.SPLICED_ENDLESS);

    expect(game.scene.currentBattle.waveIndex).toBe(EndlessBossWave.Minor);
    expect(game.scene.arena.biomeType).toBe(Biome.END);
    const eternatus = game.scene.getEnemyPokemon();
    expect(eternatus?.species.speciesId).toBe(Species.ETERNATUS);
    expect(eternatus?.hasPassive()).toBe(false);
    expect(eternatus?.formIndex).toBe(0);
  });

  it("should spawn a major boss every 1000 waves in END biome in Spliced Endless", async () => {
    game.override.startingWave(EndlessBossWave.Major);
    await runToEndlessBossEncounter(game, [Species.BIDOOF], GameModes.SPLICED_ENDLESS);

    expect(game.scene.currentBattle.waveIndex).toBe(EndlessBossWave.Major);
    expect(game.scene.arena.biomeType).toBe(Biome.END);
    const eternatus = game.scene.getEnemyPokemon();
    expect(eternatus?.species.speciesId).toBe(Species.ETERNATUS);
    expect(eternatus?.hasPassive()).toBe(false);
    expect(eternatus?.formIndex).toBe(1);
  });

  it("should NOT spawn major or minor boss outside wave 250s in END biome", async () => {
    game.override.startingWave(EndlessBossWave.Minor - 1);
    await runToEndlessBossEncounter(game, [Species.BIDOOF], GameModes.ENDLESS);

    expect(game.scene.currentBattle.waveIndex).not.toBe(EndlessBossWave.Minor);
    expect(game.scene.getEnemyPokemon()!.species.speciesId).not.toBe(Species.ETERNATUS);
  });
});

/**
 * Helper function to run to the final boss encounter as it's a bit tricky due to extra dialogue
 * @param game - The game manager
 * @param species
 * @param mode
 */
async function runToEndlessBossEncounter(game: GameManager, species: Species[], mode: GameModes) {
  console.log("===to final boss encounter===");
  await game.runToTitle();

  game.onNextPrompt("TitlePhase", Mode.TITLE, () => {
    game.scene.gameMode = getGameMode(mode);
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
