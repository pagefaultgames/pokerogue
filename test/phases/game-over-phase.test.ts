import { AbilityId } from "#enums/ability-id";
import { BiomeId } from "#enums/biome-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Unlockables } from "#enums/unlockables";
import { achvs } from "#system/achv";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Game Over Phase", () => {
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
    game.override
      .moveset([MoveId.MEMENTO, MoveId.ICE_BEAM, MoveId.SPLASH])
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingWave(200)
      .startingBiome(BiomeId.END)
      .startingLevel(10000);
  });

  it("winning a run should give rewards", async () => {
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);
    vi.spyOn(game.scene, "validateAchv");

    // Note: `game.doKillOpponents()` does not properly handle final boss
    // Final boss phase 1
    game.move.select(MoveId.ICE_BEAM);
    await game.toNextTurn();

    // Final boss phase 2
    game.move.select(MoveId.ICE_BEAM);
    await game.phaseInterceptor.to("PostGameOverPhase", false);

    // The game refused to actually give the vouchers during tests,
    // so the best we can do is to check that their reward phases occurred.
    expect(game.phaseInterceptor.log.includes("GameOverPhase")).toBe(true);
    expect(game.phaseInterceptor.log.includes("UnlockPhase")).toBe(true);
    expect(game.phaseInterceptor.log.includes("RibbonModifierRewardPhase")).toBe(true);
    expect(game.scene.gameData.unlocks[Unlockables.ENDLESS_MODE]).toBe(true);
    expect(game.scene.validateAchv).toHaveBeenCalledWith(achvs.CLASSIC_VICTORY);
    expect(game.scene.gameData.achvUnlocks[achvs.CLASSIC_VICTORY.id]).toBeTruthy();
  });

  it("losing a run should not give rewards", async () => {
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);
    vi.spyOn(game.scene, "validateAchv");

    game.move.select(MoveId.MEMENTO);
    await game.phaseInterceptor.to("PostGameOverPhase", false);

    expect(game.phaseInterceptor.log.includes("GameOverPhase")).toBe(true);
    expect(game.phaseInterceptor.log.includes("UnlockPhase")).toBe(false);
    expect(game.phaseInterceptor.log.includes("RibbonModifierRewardPhase")).toBe(false);
    expect(game.phaseInterceptor.log.includes("GameOverModifierRewardPhase")).toBe(false);
    expect(game.scene.gameData.unlocks[Unlockables.ENDLESS_MODE]).toBe(false);
    expect(game.scene.validateAchv).not.toHaveBeenCalledWith(achvs.CLASSIC_VICTORY);
    expect(game.scene.gameData.achvUnlocks[achvs.CLASSIC_VICTORY.id]).toBeFalsy();
  });
});
