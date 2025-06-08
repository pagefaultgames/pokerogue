import { SpeciesId } from "#enums/species-id";
import { MoveId } from "#enums/move-id";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#app/battle";
import { WeatherType } from "#enums/weather-type";
import { MoveResult } from "#app/field/pokemon";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { describe, beforeAll, afterEach, beforeEach, it, expect } from "vitest";

describe("Moves - Quash", () => {
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
      .battleStyle("double")
      .enemyLevel(1)
      .enemySpecies(SpeciesId.SLOWPOKE)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset([MoveId.RAIN_DANCE, MoveId.SPLASH])
      .ability(AbilityId.BALL_FETCH)
      .moveset([MoveId.QUASH, MoveId.SUNNY_DAY, MoveId.RAIN_DANCE, MoveId.SPLASH]);
  });

  it("makes the target move last in a turn, ignoring priority", async () => {
    await game.classicMode.startBattle([SpeciesId.ACCELGOR, SpeciesId.RATTATA]);

    game.move.select(MoveId.QUASH, 0, BattlerIndex.PLAYER_2);
    game.move.select(MoveId.SUNNY_DAY, 1);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.RAIN_DANCE);

    await game.phaseInterceptor.to("TurnEndPhase", false);
    // will be sunny if player_2 moved last because of quash, rainy otherwise
    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SUNNY);
  });

  it("fails if the target has already moved", async () => {
    await game.classicMode.startBattle([SpeciesId.ACCELGOR, SpeciesId.RATTATA]);
    game.move.select(MoveId.SPLASH, 0);
    game.move.select(MoveId.QUASH, 1, BattlerIndex.PLAYER);

    await game.phaseInterceptor.to("MoveEndPhase");
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(game.scene.getPlayerField()[1].getLastXMoves(1)[0].result).toBe(MoveResult.FAIL);
  });

  it("makes multiple quashed targets move in speed order at the end of the turn", async () => {
    game.override.enemySpecies(SpeciesId.NINJASK).enemyLevel(100);

    await game.classicMode.startBattle([SpeciesId.ACCELGOR, SpeciesId.RATTATA]);

    // both users are quashed - rattata is slower so sun should be up at end of turn
    game.move.select(MoveId.RAIN_DANCE, 0);
    game.move.select(MoveId.SUNNY_DAY, 1);

    await game.move.selectEnemyMove(MoveId.QUASH, BattlerIndex.PLAYER);
    await game.move.selectEnemyMove(MoveId.QUASH, BattlerIndex.PLAYER_2);

    await game.phaseInterceptor.to("TurnEndPhase", false);
    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SUNNY);
  });

  it("respects trick room", async () => {
    game.override.enemyMoveset([MoveId.RAIN_DANCE, MoveId.SPLASH, MoveId.TRICK_ROOM]);

    await game.classicMode.startBattle([SpeciesId.ACCELGOR, SpeciesId.RATTATA]);
    game.move.select(MoveId.SPLASH, 0);
    game.move.select(MoveId.SPLASH, 1);

    await game.move.selectEnemyMove(MoveId.TRICK_ROOM);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.phaseInterceptor.to("TurnInitPhase");
    // both users are quashed - accelgor should move last w/ TR so rain should be up at end of turn
    game.move.select(MoveId.RAIN_DANCE, 0);
    game.move.select(MoveId.SUNNY_DAY, 1);

    await game.move.selectEnemyMove(MoveId.QUASH, BattlerIndex.PLAYER);
    await game.move.selectEnemyMove(MoveId.QUASH, BattlerIndex.PLAYER_2);

    await game.phaseInterceptor.to("TurnEndPhase", false);
    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.RAIN);
  });
});
