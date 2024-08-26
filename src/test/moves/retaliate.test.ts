import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import { Species } from "#enums/species";
import { Moves } from "#enums/moves";
import { allMoves } from "#app/data/move.js";
import { MoveEffectPhase } from "#app/phases/move-effect-phase.js";
import { TurnEndPhase } from "#app/phases/turn-end-phase.js";

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
    game.override.battleType("single");
    game.override.enemySpecies(Species.SNORLAX);
    game.override.enemyMoveset([Moves.GIGA_IMPACT, Moves.GIGA_IMPACT, Moves.GIGA_IMPACT, Moves.GIGA_IMPACT]);
    game.override.enemyHeldItems([{name: "WIDE_LENS", count: 3}]);
    game.override.enemyLevel(100);

    game.override.moveset([Moves.RETALIATE, Moves.SPLASH]);
    game.override.startingHeldItems([{name: "WIDE_LENS", count: 3}]);
    game.override.startingLevel(80);
    game.override.disableCrits();
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
