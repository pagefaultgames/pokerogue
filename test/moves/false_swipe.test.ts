import { MoveResult } from "#app/field/pokemon";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - False Swipe", () => {
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
      .moveset([Moves.FALSE_SWIPE])
      .ability(Abilities.BALL_FETCH)
      .startingLevel(1000)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should reduce the target to 1 HP", async () => {
    await game.classicMode.startBattle([Species.MILOTIC]);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.FALSE_SWIPE);
    await game.toNextTurn();
    game.move.select(Moves.FALSE_SWIPE);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy.hp).toBe(1);
    const falseSwipeHistory = player
      .getMoveHistory()
      .every(turnMove => turnMove.move === Moves.FALSE_SWIPE && turnMove.result === MoveResult.SUCCESS);
    expect(falseSwipeHistory).toBe(true);
  });
});
