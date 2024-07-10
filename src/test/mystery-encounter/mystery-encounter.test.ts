import { afterEach, beforeAll, beforeEach, expect, describe, it, vi } from "vitest";
import * as overrides from "../../overrides";
import GameManager from "#app/test/utils/gameManager";
import Phaser from "phaser";
import { Species } from "#enums/species";
import { MysteryEncounterPhase } from "#app/phases/mystery-encounter-phase";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";

describe("Mystery Encounters", () => {
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
    vi.spyOn(overrides, "MYSTERY_ENCOUNTER_RATE_OVERRIDE", "get").mockReturnValue(256);
    vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(11);
    vi.spyOn(overrides, "MYSTERY_ENCOUNTER_OVERRIDE", "get").mockReturnValue(MysteryEncounterType.MYSTERIOUS_CHALLENGERS);

    // Seed guarantees wild encounter to be replaced by ME
    vi.spyOn(game.scene, "resetSeed").mockImplementation(() => {
      game.scene.waveSeed = "test";
      Phaser.Math.RND.sow([ game.scene.waveSeed ]);
      game.scene.rngCounter = 0;
    });
  });

  it("Spawns a mystery encounter", async () => {
    await game.runToMysteryEncounter([
      Species.CHARIZARD,
      Species.VOLCARONA
    ]);

    await game.phaseInterceptor.to(MysteryEncounterPhase, false);
    expect(game.scene.getCurrentPhase().constructor.name).toBe(MysteryEncounterPhase.name);
  });

  it("", async () => {
    await game.runToMysteryEncounter([
      Species.CHARIZARD,
      Species.VOLCARONA
    ]);

    await game.phaseInterceptor.to(MysteryEncounterPhase, false);
    expect(game.scene.getCurrentPhase().constructor.name).toBe(MysteryEncounterPhase.name);
  });

  it("spawns mysterious challengers encounter", async () => {
  });

  it("spawns mysterious chest encounter", async () => {
  });

  it("spawns dark deal encounter", async () => {
  });

  it("spawns fight or flight encounter", async () => {
  });
});

