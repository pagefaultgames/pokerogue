import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Metal Burst", () => {
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
      .moveset([MoveId.METAL_BURST, MoveId.FISSURE, MoveId.PRECIPICE_BLADES])
      .ability(AbilityId.PURE_POWER)
      .startingLevel(10)
      .battleStyle("double")
      .criticalHits(false)
      .enemySpecies(SpeciesId.PICHU)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.TACKLE);
  });

  it("should redirect target if intended target faints", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.FEEBAS]);

    const [, enemy2] = game.scene.getEnemyField();

    game.move.select(MoveId.METAL_BURST);
    game.move.select(MoveId.FISSURE, 1, BattlerIndex.ENEMY);

    await game.move.selectEnemyMove(MoveId.TACKLE, BattlerIndex.PLAYER);
    await game.move.selectEnemyMove(MoveId.TACKLE, BattlerIndex.PLAYER_2);

    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to("MoveEndPhase");
    await game.move.forceHit();
    await game.phaseInterceptor.to("MoveEndPhase");
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(enemy2.isFullHp()).toBe(false);
  });

  it("should not crash if both opponents faint before the move is used", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.ARCEUS]);

    const [enemy1, enemy2] = game.scene.getEnemyField();

    game.move.select(MoveId.METAL_BURST);
    game.move.select(MoveId.PRECIPICE_BLADES, 1);

    await game.move.selectEnemyMove(MoveId.TACKLE, BattlerIndex.PLAYER);
    await game.move.selectEnemyMove(MoveId.TACKLE, BattlerIndex.PLAYER_2);

    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to("MoveEndPhase");
    await game.move.forceHit();
    await game.phaseInterceptor.to("MoveEndPhase");
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy1.isFainted()).toBe(true);
    expect(enemy2.isFainted()).toBe(true);
    expect(game.scene.getPlayerField()[0].getLastXMoves(1)[0].result).toBe(MoveResult.FAIL);
  });
});
