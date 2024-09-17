import { Species } from "#app/enums/species";
import { GameModes } from "#app/game-mode";
import GameManager from "#test/utils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Moves } from "#app/enums/moves";
import { Biome } from "#app/enums/biome";

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
      .startingWave(10)
      .battleType("single")
      .startingLevel(100) // Avoid levelling up
      .enemyLevel(1000) // Avoid opponent dying before game.doKillOpponents()
      .disableTrainerWaves()
      .moveset([Moves.KOWTOW_CLEAVE])
      .enemyMoveset(Moves.SPLASH);
    await game.dailyMode.startBattle();

    // Transition from Wave 10 to Wave 11 in order to trigger biome switch
    game.move.select(Moves.KOWTOW_CLEAVE);
    await game.phaseInterceptor.to("DamagePhase");
    await game.doKillOpponents();
    await game.toNextWave();
    expect(game.phaseInterceptor.log).toContain("NewBiomeEncounterPhase");

    const preReloadRngState = Phaser.Math.RND.state();

    await game.reload.reloadSession();

    const postReloadRngState = Phaser.Math.RND.state();

    expect(preReloadRngState).toBe(postReloadRngState);
  }, 20000);

  it("should not have weather inconsistencies after a biome switch", async () => {
    game.override
      .startingWave(10)
      .startingBiome(Biome.ICE_CAVE) // Will lead to Snowy Forest with randomly generated weather
      .battleType("single")
      .startingLevel(100) // Avoid levelling up
      .enemyLevel(1000) // Avoid opponent dying before game.doKillOpponents()
      .disableTrainerWaves()
      .moveset([Moves.KOWTOW_CLEAVE])
      .enemyMoveset(Moves.SPLASH);
    await game.classicMode.startBattle(); // Apparently daily mode would override the biome

    // Transition from Wave 10 to Wave 11 in order to trigger biome switch
    game.move.select(Moves.KOWTOW_CLEAVE);
    await game.phaseInterceptor.to("DamagePhase");
    await game.doKillOpponents();
    await game.toNextWave();
    expect(game.phaseInterceptor.log).toContain("NewBiomeEncounterPhase");

    const preReloadWeather = game.scene.arena.weather;

    await game.reload.reloadSession();

    const postReloadWeather = game.scene.arena.weather;

    expect(postReloadWeather).toStrictEqual(preReloadWeather);
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
    await game.runToFinalBossEncounter([Species.BULBASAUR], GameModes.DAILY);

    const preReloadRngState = Phaser.Math.RND.state();

    await game.reload.reloadSession();

    const postReloadRngState = Phaser.Math.RND.state();

    expect(preReloadRngState).toBe(postReloadRngState);
  }, 20000);
});
