import { BattlerIndex } from "#app/battle";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#app/enums/stat";
import { AbilityId } from "#enums/ability-id";
import GameManager from "#test/testUtils/gameManager";
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
      .moveset(MoveId.GROWL)
      .battleStyle("single")
      .ability(AbilityId.BALL_FETCH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.THROAT_CHOP)
      .enemySpecies(SpeciesId.MAGIKARP);
  });

  it("prevents the target from using sound-based moves for two turns", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const enemy = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.GROWL);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);

    // First turn, move is interrupted
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemy.getStatStage(Stat.ATK)).toBe(0);

    // Second turn, struggle if no valid moves
    await game.toNextTurn();

    game.move.select(MoveId.GROWL);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(enemy.isFullHp()).toBe(false);
  });
});
