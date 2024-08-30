import { Species } from "#app/enums/species.js";
import { GameModes, getGameMode } from "#app/game-mode.js";
import GameManager from "#test/utils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SPLASH_ONLY } from "./utils/testUtils";
import { Moves } from "#app/enums/moves.js";
import { EnemyCommandPhase } from "#app/phases/enemy-command-phase.js";
import { DamagePhase } from "#app/phases/damage-phase.js";

describe("Reload", () => {
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
  });

  it("should not have RNG inconsistencies in a Classic run", async () => {
    await game.classicMode.startBattle();

    const preReloadRngState = Phaser.Math.RND.state();

    await game.reload.reloadSession();

    const postReloadRngState = Phaser.Math.RND.state();

    expect(preReloadRngState).toBe(postReloadRngState);
  }, 20000);

  it("should not have RNG inconsistencies after a biome switch", async () => {
    game.override
      .startingWave(15)
      .battleType("single")
      .startingLevel(100)
      .enemyLevel(1000)
      .disableTrainerWaves()
      .moveset([Moves.KOWTOW_CLEAVE])
      .enemyMoveset(SPLASH_ONLY);
    await game.classicMode.startBattle();
    game.scene.gameMode = getGameMode(GameModes.ENDLESS);

    // Transition from Wave 15 to Wave 16 in order to trigger biome switch
    game.move.select(Moves.KOWTOW_CLEAVE);
    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(DamagePhase);
    await game.doKillOpponents();
    await game.toNextWave();

    const preReloadRngState = Phaser.Math.RND.state();

    await game.reload.reloadSession();

    const postReloadRngState = Phaser.Math.RND.state();

    expect(preReloadRngState).toBe(postReloadRngState);
  }, 20000);

  it("should not have RNG inconsistencies at a Daily run wild Pokemon fight", async () => {
    await game.dailyMode.startBattle();

    const preReloadRngState = Phaser.Math.RND.state();

    await game.reload.reloadSession();

    const postReloadRngState = Phaser.Math.RND.state();

    expect(preReloadRngState).toBe(postReloadRngState);
  }, 20000);

  it("should not have RNG inconsistencies at a Daily run double battle", async () => {
    game.override
      .battleType("double");
    await game.dailyMode.startBattle();

    const preReloadRngState = Phaser.Math.RND.state();

    await game.reload.reloadSession();

    const postReloadRngState = Phaser.Math.RND.state();

    expect(preReloadRngState).toBe(postReloadRngState);
  }, 20000);

  it("should not have RNG inconsistencies at a Daily run Gym Leader fight", async () => {
    game.override
      .battleType("single")
      .startingWave(40);
    await game.dailyMode.startBattle();

    const preReloadRngState = Phaser.Math.RND.state();

    await game.reload.reloadSession();

    const postReloadRngState = Phaser.Math.RND.state();

    expect(preReloadRngState).toBe(postReloadRngState);
  }, 20000);

  it("should not have RNG inconsistencies at a Daily run regular trainer fight", async () => {
    game.override
      .battleType("single")
      .startingWave(45);
    await game.dailyMode.startBattle();

    const preReloadRngState = Phaser.Math.RND.state();

    await game.reload.reloadSession();

    const postReloadRngState = Phaser.Math.RND.state();

    expect(preReloadRngState).toBe(postReloadRngState);
  }, 20000);

  it("should not have RNG inconsistencies at a Daily run wave 50 Boss fight", async () => {
    game.override
      .battleType("single")
      .startingWave(50);
    await game.runToFinalBossEncounter(game, [Species.BULBASAUR], GameModes.DAILY);

    const preReloadRngState = Phaser.Math.RND.state();

    await game.reload.reloadSession();

    const postReloadRngState = Phaser.Math.RND.state();

    expect(preReloadRngState).toBe(postReloadRngState);
  }, 20000);
});
