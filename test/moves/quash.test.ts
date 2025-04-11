import { Species } from "#enums/species";
import { Moves } from "#enums/moves";
import { Abilities } from "#app/enums/abilities";
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
      .enemySpecies(Species.SLOWPOKE)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset([Moves.RAIN_DANCE, Moves.SPLASH])
      .ability(Abilities.BALL_FETCH)
      .moveset([Moves.QUASH, Moves.SUNNY_DAY, Moves.RAIN_DANCE, Moves.SPLASH]);
  });

  it("makes the target move last in a turn, ignoring priority", async () => {
    await game.classicMode.startBattle([Species.ACCELGOR, Species.RATTATA]);

    game.move.select(Moves.QUASH, 0, BattlerIndex.PLAYER_2);
    game.move.select(Moves.SUNNY_DAY, 1);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.forceEnemyMove(Moves.RAIN_DANCE);

    await game.phaseInterceptor.to("TurnEndPhase", false);
    // will be sunny if player_2 moved last because of quash, rainy otherwise
    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SUNNY);
  });

  it("fails if the target has already moved", async () => {
    await game.classicMode.startBattle([Species.ACCELGOR, Species.RATTATA]);
    game.move.select(Moves.SPLASH, 0);
    game.move.select(Moves.QUASH, 1, BattlerIndex.PLAYER);

    await game.phaseInterceptor.to("MoveEndPhase");
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(game.scene.getPlayerField()[1].getLastXMoves(1)[0].result).toBe(MoveResult.FAIL);
  });

  it("makes multiple quashed targets move in speed order at the end of the turn", async () => {
    game.override.enemySpecies(Species.NINJASK).enemyLevel(100);

    await game.classicMode.startBattle([Species.ACCELGOR, Species.RATTATA]);

    // both users are quashed - rattata is slower so sun should be up at end of turn
    game.move.select(Moves.RAIN_DANCE, 0);
    game.move.select(Moves.SUNNY_DAY, 1);

    await game.forceEnemyMove(Moves.QUASH, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.QUASH, BattlerIndex.PLAYER_2);

    await game.phaseInterceptor.to("TurnEndPhase", false);
    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SUNNY);
  });

  it("respects trick room", async () => {
    game.override.enemyMoveset([Moves.RAIN_DANCE, Moves.SPLASH, Moves.TRICK_ROOM]);

    await game.classicMode.startBattle([Species.ACCELGOR, Species.RATTATA]);
    game.move.select(Moves.SPLASH, 0);
    game.move.select(Moves.SPLASH, 1);

    await game.forceEnemyMove(Moves.TRICK_ROOM);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnInitPhase");
    // both users are quashed - accelgor should move last w/ TR so rain should be up at end of turn
    game.move.select(Moves.RAIN_DANCE, 0);
    game.move.select(Moves.SUNNY_DAY, 1);

    await game.forceEnemyMove(Moves.QUASH, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.QUASH, BattlerIndex.PLAYER_2);

    await game.phaseInterceptor.to("TurnEndPhase", false);
    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.RAIN);
  });
});
