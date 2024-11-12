import { Biome } from "#enums/biome";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { achvs } from "#app/system/achv";
import { Unlockables } from "#app/system/unlockables";

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
      .moveset([ Moves.MEMENTO, Moves.ICE_BEAM, Moves.SPLASH ])
      .ability(Abilities.BALL_FETCH)
      .battleType("single")
      .disableCrits()
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH)
      .startingWave(200)
      .startingBiome(Biome.END)
      .startingLevel(10000);
  });

  it("winning a run should give rewards", async () => {
    await game.classicMode.startBattle([ Species.BULBASAUR ]);
    vi.spyOn(game.scene, "validateAchv");

    // Note: `game.doKillOpponents()` does not properly handle final boss
    // Final boss phase 1
    game.move.select(Moves.ICE_BEAM);
    await game.toNextTurn();

    // Final boss phase 2
    game.move.select(Moves.ICE_BEAM);
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
    await game.classicMode.startBattle([ Species.BULBASAUR ]);
    vi.spyOn(game.scene, "validateAchv");

    game.move.select(Moves.MEMENTO);
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
