import { MoveResult } from "#app/field/pokemon";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
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
      .moveset([MoveId.FALSE_SWIPE])
      .ability(AbilityId.BALL_FETCH)
      .startingLevel(1000)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should reduce the target to 1 HP", async () => {
    await game.classicMode.startBattle([SpeciesId.MILOTIC]);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.FALSE_SWIPE);
    await game.toNextTurn();
    game.move.select(MoveId.FALSE_SWIPE);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy.hp).toBe(1);
    const falseSwipeHistory = player
      .getMoveHistory()
      .every(turnMove => turnMove.move === MoveId.FALSE_SWIPE && turnMove.result === MoveResult.SUCCESS);
    expect(falseSwipeHistory).toBe(true);
  });
});
