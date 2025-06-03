import { Species } from "#enums/species";
import { Moves } from "#enums/moves";
import { Abilities } from "#app/enums/abilities";
import { BattlerIndex } from "#app/battle";
import { WeatherType } from "#enums/weather-type";
import { MoveResult } from "#app/field/pokemon";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { describe, beforeAll, afterEach, beforeEach, it, expect } from "vitest";
import { MoveUseType } from "#enums/move-use-type";

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
    await game.move.selectEnemyMove(Moves.SPLASH);
    await game.move.selectEnemyMove(Moves.RAIN_DANCE);

    await game.phaseInterceptor.to("TurnEndPhase", false);
    // will be sunny if player_2 moved last because of quash, rainy otherwise
    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SUNNY);
  });

  it("fails if the target has already moved", async () => {
    await game.classicMode.startBattle([Species.ACCELGOR, Species.RATTATA]);
    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER);
    game.move.select(Moves.QUASH, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER);

    await game.phaseInterceptor.to("MoveEndPhase");
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(game.scene.getPlayerField()[1].getLastXMoves(1)[0].result).toBe(MoveResult.FAIL);
  });

  // TODO: Enable once rampaging moves and move queue are fixed.
  // Currently does literally nothing because `MoveUseType` is overridden from move queue
  // within `MovePhase`, but should be enabled once that jank is removed
  it.todo("should maintain PP ignore status of rampaging moves", async () => {
    game.override.moveset([]);
    await game.classicMode.startBattle([Species.ACCELGOR, Species.RATTATA]);

    const [accelgor, rattata] = game.scene.getPlayerField();
    expect(accelgor).toBeDefined();
    expect(rattata).toBeDefined();

    game.move.changeMoveset(accelgor, [Moves.SPLASH, Moves.QUASH]);
    game.move.changeMoveset(rattata, Moves.OUTRAGE);

    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER);
    game.move.select(Moves.OUTRAGE, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("TurnEndPhase");

    const outrageMove = rattata.getMoveset().find(m => m.moveId === Moves.OUTRAGE);
    expect(outrageMove?.ppUsed).toBe(1);

    game.move.select(Moves.QUASH, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(accelgor.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
    expect(outrageMove?.ppUsed).toBe(1);
    expect(rattata.getLastXMoves()[0]).toMatchObject({
      move: Moves.OUTRAGE,
      result: MoveResult.SUCCESS,
      useType: MoveUseType.IGNORE_PP,
    });
  });

  it("makes multiple quashed targets move in speed order at the end of the turn", async () => {
    game.override.enemySpecies(Species.NINJASK).enemyLevel(100);

    await game.classicMode.startBattle([Species.ACCELGOR, Species.RATTATA]);

    // both users are quashed - rattata is slower so sun should be up at end of turn
    game.move.select(Moves.RAIN_DANCE, 0);
    game.move.select(Moves.SUNNY_DAY, 1);

    await game.move.selectEnemyMove(Moves.QUASH, BattlerIndex.PLAYER);
    await game.move.selectEnemyMove(Moves.QUASH, BattlerIndex.PLAYER_2);

    await game.phaseInterceptor.to("TurnEndPhase", false);
    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SUNNY);
  });

  it("respects trick room", async () => {
    game.override.enemyMoveset([Moves.RAIN_DANCE, Moves.SPLASH, Moves.TRICK_ROOM]);

    await game.classicMode.startBattle([Species.ACCELGOR, Species.RATTATA]);
    game.move.select(Moves.SPLASH, 0);
    game.move.select(Moves.SPLASH, 1);

    await game.move.selectEnemyMove(Moves.TRICK_ROOM);
    await game.move.selectEnemyMove(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnInitPhase");
    // both users are quashed - accelgor should move last w/ TR so rain should be up at end of turn
    game.move.select(Moves.RAIN_DANCE, 0);
    game.move.select(Moves.SUNNY_DAY, 1);

    await game.move.selectEnemyMove(Moves.QUASH, BattlerIndex.PLAYER);
    await game.move.selectEnemyMove(Moves.QUASH, BattlerIndex.PLAYER_2);

    await game.phaseInterceptor.to("TurnEndPhase", false);
    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.RAIN);
  });
});
