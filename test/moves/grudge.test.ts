import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { BattlerIndex } from "#app/battle";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Grudge", () => {
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
      .moveset([Moves.EMBER, Moves.SPLASH])
      .ability(Abilities.BALL_FETCH)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.SHEDINJA)
      .enemyAbility(Abilities.WONDER_GUARD)
      .enemyMoveset([Moves.GRUDGE, Moves.SPLASH]);
  });

  it("should reduce the PP of the Pokemon's move to 0 when the user has fainted", async () => {
    await game.classicMode.startBattle([Species.FEEBAS]);

    const playerPokemon = game.scene.getPlayerPokemon();
    game.move.select(Moves.EMBER);
    await game.forceEnemyMove(Moves.GRUDGE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase");

    const playerMove = playerPokemon?.getMoveset().find(m => m.moveId === Moves.EMBER);

    expect(playerMove?.getPpRatio()).toBe(0);
  });

  it("should remain in effect until the user's next move", async () => {
    await game.classicMode.startBattle([Species.FEEBAS]);

    const playerPokemon = game.scene.getPlayerPokemon();
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.GRUDGE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    game.move.select(Moves.EMBER);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("BerryPhase");

    const playerMove = playerPokemon?.getMoveset().find(m => m.moveId === Moves.EMBER);

    expect(playerMove?.getPpRatio()).toBe(0);
  });

  it("should not reduce the opponent's PP if the user dies to weather/indirect damage", async () => {
    // Opponent will be reduced to 1 HP by False Swipe, then faint to Sandstorm
    game.override
      .moveset([Moves.FALSE_SWIPE])
      .startingLevel(100)
      .ability(Abilities.SAND_STREAM)
      .enemySpecies(Species.RATTATA);
    await game.classicMode.startBattle([Species.GEODUDE]);

    const enemyPokemon = game.scene.getEnemyPokemon();
    const playerPokemon = game.scene.getPlayerPokemon();

    game.move.select(Moves.FALSE_SWIPE);
    await game.forceEnemyMove(Moves.GRUDGE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemyPokemon?.isFainted()).toBe(true);

    const playerMove = playerPokemon?.getMoveset().find(m => m.moveId === Moves.FALSE_SWIPE);
    expect(playerMove?.getPpRatio()).toBeGreaterThan(0);
  });
});
