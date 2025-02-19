import { BattlerIndex } from "#app/battle";
import { MoveResult } from "#app/field/pokemon";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
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
      .moveset([ Moves.METAL_BURST, Moves.FISSURE, Moves.PRECIPICE_BLADES ])
      .ability(Abilities.PURE_POWER)
      .startingLevel(10)
      .battleType("double")
      .disableCrits()
      .enemySpecies(Species.PICHU)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.TACKLE);
  });

  it("should redirect target if intended target faints", async () => {
    await game.classicMode.startBattle([ Species.FEEBAS, Species.FEEBAS ]);

    const [ , enemy2 ] = game.scene.getEnemyField();

    game.move.select(Moves.METAL_BURST);
    game.move.select(Moves.FISSURE, 1, BattlerIndex.ENEMY);

    await game.forceEnemyMove(Moves.TACKLE, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.TACKLE, BattlerIndex.PLAYER_2);

    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2 ]);

    await game.phaseInterceptor.to("MoveEndPhase");
    await game.move.forceHit();
    await game.phaseInterceptor.to("MoveEndPhase");
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(enemy2.isFullHp()).toBe(false);
  });

  it("should not crash if both opponents faint before the move is used", async () => {
    await game.classicMode.startBattle([ Species.FEEBAS, Species.ARCEUS ]);

    const [ enemy1, enemy2 ] = game.scene.getEnemyField();

    game.move.select(Moves.METAL_BURST);
    game.move.select(Moves.PRECIPICE_BLADES, 1);

    await game.forceEnemyMove(Moves.TACKLE, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.TACKLE, BattlerIndex.PLAYER_2);

    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2 ]);

    await game.phaseInterceptor.to("MoveEndPhase");
    await game.move.forceHit();
    await game.phaseInterceptor.to("MoveEndPhase");
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy1.isFainted()).toBe(true);
    expect(enemy2.isFainted()).toBe(true);
    expect(game.scene.getPlayerField()[0].getLastXMoves(1)[0].result).toBe(MoveResult.FAIL);
  });
});
