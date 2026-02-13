import type { BattleScene } from "#app/battle-scene";
import { BASE_MYSTERY_ENCOUNTER_SPAWN_WEIGHT, WEIGHT_INCREMENT_ON_SPAWN_MISS } from "#app/constants";
import { BattleType } from "#enums/battle-type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Mystery Encounters", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let scene: BattleScene;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    scene = game.scene;
    game.override.startingWave(12).mysteryEncounterChance(100);
  });

  it("Spawns a mystery encounter", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.MYSTERIOUS_CHALLENGERS, [
      SpeciesId.CHARIZARD,
      SpeciesId.VOLCARONA,
    ]);

    await game.phaseInterceptor.to("MysteryEncounterPhase", false);
    expect(game).toBeAtPhase("MysteryEncounterPhase");
  });

  it("Encounters should not run on X1 waves", async () => {
    game.override.startingWave(11);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle.mysteryEncounter).toBeUndefined();
  });

  it("Encounters should not run below wave 10", async () => {
    game.override.startingWave(9);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle.mysteryEncounter).toBeUndefined();
  });

  it("Encounters should not run above wave 180", async () => {
    game.override.startingWave(181);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle.mysteryEncounter).toBeUndefined();
  });

  it("increases by WEIGHT_INCREMENT_ON_SPAWN_MISS for a failed encounter chance", async () => {
    game.override.mysteryEncounterChance(0).battleType(BattleType.WILD);
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    expect(scene.mysteryEncounterSaveData.encounterSpawnChance).toBe(
      BASE_MYSTERY_ENCOUNTER_SPAWN_WEIGHT + WEIGHT_INCREMENT_ON_SPAWN_MISS,
    );
  });

  it("does not increases in chance when an encounter was not possible", async () => {
    game.override.mysteryEncounterChance(0).battleType(BattleType.TRAINER);
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    expect(scene.mysteryEncounterSaveData.encounterSpawnChance).toBe(BASE_MYSTERY_ENCOUNTER_SPAWN_WEIGHT);
  });
});
