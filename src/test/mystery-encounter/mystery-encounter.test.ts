import { afterEach, beforeAll, beforeEach, expect, describe, it } from "vitest";
import GameManager from "#app/test/utils/gameManager";
import Phaser from "phaser";
import { Species } from "#enums/species";
import { MysteryEncounterPhase } from "#app/phases/mystery-encounter-phases";
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
    game.override.startingWave(11);
    game.override.mysteryEncounterChance(100);
  });

  it("Spawns a mystery encounter", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.MYSTERIOUS_CHALLENGERS, [Species.CHARIZARD, Species.VOLCARONA]);

    await game.phaseInterceptor.to(MysteryEncounterPhase, false);
    expect(game.scene.getCurrentPhase()!.constructor.name).toBe(MysteryEncounterPhase.name);
  });

  it("", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.MYSTERIOUS_CHALLENGERS, [Species.CHARIZARD, Species.VOLCARONA]);

    await game.phaseInterceptor.to(MysteryEncounterPhase, false);
    expect(game.scene.getCurrentPhase()!.constructor.name).toBe(MysteryEncounterPhase.name);
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

