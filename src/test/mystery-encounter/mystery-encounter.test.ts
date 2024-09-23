import { afterEach, beforeAll, beforeEach, expect, describe, it } from "vitest";
import GameManager from "#app/test/utils/gameManager";
import Phaser from "phaser";
import { Species } from "#enums/species";
import { MysteryEncounterPhase } from "#app/phases/mystery-encounter-phases";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "#app/battle-scene";

describe("Mystery Encounters", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let scene: BattleScene;

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
    scene = game.scene;
    game.override.startingWave(11);
    game.override.mysteryEncounterChance(100);
  });

  it("Spawns a mystery encounter", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.MYSTERIOUS_CHALLENGERS, [Species.CHARIZARD, Species.VOLCARONA]);

    await game.phaseInterceptor.to(MysteryEncounterPhase, false);
    expect(game.scene.getCurrentPhase()!.constructor.name).toBe(MysteryEncounterPhase.name);
  });

  it("Encounters should not run below wave 10", async () => {
    game.override.startingWave(9);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.MYSTERIOUS_CHALLENGERS);
  });

  it("Encounters should not run above wave 180", async () => {
    game.override.startingWave(181);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle.mysteryEncounter).toBeUndefined();
  });
});

