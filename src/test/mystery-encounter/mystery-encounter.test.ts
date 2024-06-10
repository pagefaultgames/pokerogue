import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import {Species} from "#app/data/enums/species";
import * as overrides from "../../overrides";
import {
  EncounterPhase,
} from "#app/phases";
import GameManager from "#app/test/utils/gameManager";
import Phaser from "phaser";

describe("Mystery Encounter", () => {
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
    vi.spyOn(overrides, "MYSTERY_ENCOUNTER_RATE_OVERRIDE", "get").mockReturnValue(64);
    vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(3);
  });

  it("spawns a mystery encounter", async() => {
    await game.runToSummon([
      Species.CHARIZARD,
      Species.VOLCARONA
    ]);
    expect(game.scene.getCurrentPhase().constructor.name).toBe(EncounterPhase.name);
  }, 100000);

  it("spawns mysterious challengers encounter", async() => {
  });

  it("spawns mysterious chest encounter", async() => {
  });

  it("spawns dark deal encounter", async() => {
  });

  it("spawns fight or flight encounter", async() => {
  });
});

