import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { MoveEffectPhase } from "#phases/move-effect-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

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
      .criticalHits(false)
      .enemySpecies(SpeciesId.UMBREON)
      .enemyMoveset(MoveId.SPLASH)
      .enemyLevel(5)
      .starterSpecies(SpeciesId.MAGIKARP)
      .moveset([MoveId.MIRACLE_EYE, MoveId.CONFUSION]);
  });

  it("should allow Psychic moves to hit Dark types", async () => {
    await game.classicMode.startBattle();

    const enemy = game.field.getEnemyPokemon();

    game.move.select(MoveId.CONFUSION);
    await game.toNextTurn();
    expect(enemy.hp).toBe(enemy.getMaxHp());

    game.move.select(MoveId.MIRACLE_EYE);
    await game.toNextTurn();
    game.move.select(MoveId.CONFUSION);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
  });
});
