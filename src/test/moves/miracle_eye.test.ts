import { BattlerIndex } from "#app/battle";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SPLASH_ONLY } from "../utils/testUtils";

describe("Moves - Miracle Eye", () => {
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
      .disableCrits()
      .enemySpecies(Species.UMBREON)
      .enemyMoveset(SPLASH_ONLY)
      .enemyLevel(5)
      .starterSpecies(Species.MAGIKARP)
      .moveset([Moves.MIRACLE_EYE, Moves.CONFUSION]);
  });

  it("should allow Psychic moves to hit Dark types", async () => {
    await game.classicMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.CONFUSION);
    await game.toNextTurn();
    expect(enemy.hp).toBe(enemy.getMaxHp());

    game.move.select(Moves.MIRACLE_EYE);
    await game.toNextTurn();
    game.move.select(Moves.CONFUSION);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
  });
});
