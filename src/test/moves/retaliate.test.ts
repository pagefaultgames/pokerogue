import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import { Species } from "#enums/species";
import { Moves } from "#enums/moves";
import { allMoves } from "#app/data/move";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";

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
      .enemyHeldItems([{name: "WIDE_LENS", count: 3}])
      .enemyLevel(100)
      .moveset([Moves.RETALIATE, Moves.SPLASH])
      .startingHeldItems([{name: "WIDE_LENS", count: 3}])
      .startingLevel(80)
      .disableCrits();
  });

  it("increases power if ally died previous turn", async () => {
    vi.spyOn(retaliate, "calculateBattlePower");
    await game.startBattle([Species.ABRA, Species.COBALION]);
    game.move.select(Moves.RETALIATE);
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(retaliate.calculateBattlePower).toHaveLastReturnedWith(70);
    game.doSelectPartyPokemon(1);

    await game.toNextTurn();
    game.move.select(Moves.RETALIATE);
    await game.phaseInterceptor.to(MoveEffectPhase);
    const cobalion = game.scene.getPlayerPokemon()!;
    expect(cobalion.name).equals("Cobalion");
    expect(retaliate.calculateBattlePower).toHaveReturnedWith(140);
  });
});
