import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import { Species } from "#enums/species";
import { Moves } from "#enums/moves";
import { allMoves } from "#app/data/move";

describe("Moves - Retaliate", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  const retaliate = allMoves[Moves.RETALIATE];

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
      .battleType("single")
      .enemySpecies(Species.SNORLAX)
      .enemyMoveset([Moves.RETALIATE, Moves.RETALIATE, Moves.RETALIATE, Moves.RETALIATE])
      .enemyLevel(100)
      .moveset([Moves.RETALIATE, Moves.SPLASH])
      .startingLevel(80)
      .disableCrits();
  });

  it("increases power if ally died previous turn", async () => {
    vi.spyOn(retaliate, "calculateBattlePower");
    await game.startBattle([Species.ABRA, Species.COBALION]);
    game.move.select(Moves.RETALIATE);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(retaliate.calculateBattlePower).toHaveLastReturnedWith(70);
    game.doSelectPartyPokemon(1);

    await game.toNextTurn();
    game.move.select(Moves.RETALIATE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");
    expect(retaliate.calculateBattlePower).toHaveReturnedWith(140);
  });
});
