import { BattlerIndex } from "#app/battle";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import { Stat } from "#app/enums/stat";
import { Abilities } from "#enums/abilities";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it, expect } from "vitest";

describe("Moves - Throat Chop", () => {
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
      .moveset(Array(4).fill(Moves.GROWL))
      .battleType("single")
      .ability(Abilities.BALL_FETCH)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Array(4).fill(Moves.THROAT_CHOP))
      .enemySpecies(Species.MAGIKARP);
  });

  it("prevents the target from using sound-based moves for two turns", async () => {
    await game.classicMode.startBattle([Species.MAGIKARP]);

    const enemy = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.GROWL);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);

    // First turn, move is interrupted
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemy.getStatStage(Stat.ATK)).toBe(0);

    // Second turn, struggle if no valid moves
    await game.toNextTurn();

    game.move.select(Moves.GROWL);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(enemy.isFullHp()).toBe(false);
  });
});
