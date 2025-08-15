import { pokerogueApi } from "#api/pokerogue-api";
import { BiomeId } from "#enums/biome-id";
import { Button } from "#enums/buttons";
import { GameModes } from "#enums/game-modes";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import { GameManager } from "#test/test-utils/game-manager";
import type { MockClock } from "#test/test-utils/mocks/mock-clock";
import type { OptionSelectUiHandler } from "#ui/option-select-ui-handler";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
    vi.spyOn(pokerogueApi, "getGameTitleStats").mockResolvedValue({
      battleCount: -1,
      playerCount: -1,
    });
    vi.spyOn(pokerogueApi.daily, "getSeed").mockResolvedValue("test-seed");
  });

  it("should not have RNG inconsistencies in a Classic run", async () => {
    await game.classicMode.startBattle();

    const preReloadRngState = Phaser.Math.RND.state();

    await game.reload.reloadSession();

    const postReloadRngState = Phaser.Math.RND.state();

    expect(preReloadRngState).toBe(postReloadRngState);
  });

  it("should not have RNG inconsistencies after a biome switch", async () => {
    game.override
      .startingWave(10)
      .battleStyle("single")
      .startingLevel(100) // Avoid levelling up
      .disableTrainerWaves()
      .moveset([MoveId.SPLASH])
      .enemyMoveset(MoveId.SPLASH);
    await game.dailyMode.startBattle();

    // Transition from Wave 10 to Wave 11 in order to trigger biome switch
    game.move.select(MoveId.SPLASH);
    await game.doKillOpponents();
    game.onNextPrompt("SelectBiomePhase", UiMode.OPTION_SELECT, () => {
      (game.scene.time as MockClock).overrideDelay = null;
      const optionSelectUiHandler = game.scene.ui.getHandler() as OptionSelectUiHandler;
      game.scene.time.delayedCall(1010, () => optionSelectUiHandler.processInput(Button.ACTION));
      game.endPhase();
      (game.scene.time as MockClock).overrideDelay = 1;
    });
    await game.toNextWave();
    expect(game.phaseInterceptor.log).toContain("NewBiomeEncounterPhase");

    const preReloadRngState = Phaser.Math.RND.state();

    await game.reload.reloadSession();

    const postReloadRngState = Phaser.Math.RND.state();

    expect(preReloadRngState).toBe(postReloadRngState);
  });

  it("should not have weather inconsistencies after a biome switch", async () => {
    game.override
      .startingWave(10)
      .startingBiome(BiomeId.ICE_CAVE) // Will lead to Snowy Forest with randomly generated weather
      .battleStyle("single")
      .startingLevel(100) // Avoid levelling up
      .disableTrainerWaves()
      .moveset([MoveId.SPLASH])
      .enemyMoveset(MoveId.SPLASH);
    await game.classicMode.startBattle(); // Apparently daily mode would override the biome

    // Transition from Wave 10 to Wave 11 in order to trigger biome switch
    game.move.select(MoveId.SPLASH);
    await game.doKillOpponents();
    await game.toNextWave();
    expect(game.phaseInterceptor.log).toContain("NewBiomeEncounterPhase");

    const preReloadWeather = game.scene.arena.weather;

    await game.reload.reloadSession();

    const postReloadWeather = game.scene.arena.weather;

    expect(postReloadWeather).toStrictEqual(preReloadWeather);
  });

  it("should not have RNG inconsistencies at a Daily run wild Pokemon fight", async () => {
    await game.dailyMode.startBattle();

    const preReloadRngState = Phaser.Math.RND.state();

    await game.reload.reloadSession();

    const postReloadRngState = Phaser.Math.RND.state();

    expect(preReloadRngState).toBe(postReloadRngState);
  });

  it("should not have RNG inconsistencies at a Daily run double battle", async () => {
    game.override.battleStyle("double");
    await game.dailyMode.startBattle();

    const preReloadRngState = Phaser.Math.RND.state();

    await game.reload.reloadSession();

    const postReloadRngState = Phaser.Math.RND.state();

    expect(preReloadRngState).toBe(postReloadRngState);
  });

  it("should not have RNG inconsistencies at a Daily run Gym Leader fight", async () => {
    game.override.battleStyle("single").startingWave(40);
    await game.dailyMode.startBattle();

    const preReloadRngState = Phaser.Math.RND.state();

    await game.reload.reloadSession();

    const postReloadRngState = Phaser.Math.RND.state();

    expect(preReloadRngState).toBe(postReloadRngState);
  });

  it("should not have RNG inconsistencies at a Daily run regular trainer fight", async () => {
    game.override.battleStyle("single").startingWave(45);
    await game.dailyMode.startBattle();

    const preReloadRngState = Phaser.Math.RND.state();

    await game.reload.reloadSession();

    const postReloadRngState = Phaser.Math.RND.state();

    expect(preReloadRngState).toBe(postReloadRngState);
  });

  it("should not have RNG inconsistencies at a Daily run wave 50 Boss fight", async () => {
    game.override.battleStyle("single").startingWave(50);
    await game.runToFinalBossEncounter([SpeciesId.BULBASAUR], GameModes.DAILY);

    const preReloadRngState = Phaser.Math.RND.state();

    await game.reload.reloadSession();

    const postReloadRngState = Phaser.Math.RND.state();

    expect(preReloadRngState).toBe(postReloadRngState);
  });
});
