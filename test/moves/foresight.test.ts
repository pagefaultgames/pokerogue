import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { MoveEffectPhase } from "#phases/move-effect-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Foresight", () => {
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
      .enemySpecies(SpeciesId.GASTLY)
      .enemyMoveset(MoveId.SPLASH)
      .enemyLevel(5)
      .starterSpecies(SpeciesId.MAGIKARP)
      .moveset([MoveId.FORESIGHT, MoveId.QUICK_ATTACK, MoveId.MACH_PUNCH]);
  });

  it("should allow Normal and Fighting moves to hit Ghost types", async () => {
    await game.classicMode.startBattle();

    const enemy = game.field.getEnemyPokemon();

    game.move.select(MoveId.QUICK_ATTACK);
    await game.toNextTurn();
    expect(enemy.hp).toBe(enemy.getMaxHp());

    game.move.select(MoveId.FORESIGHT);
    await game.toNextTurn();
    game.move.select(MoveId.QUICK_ATTACK);
    await game.toNextTurn();

    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
    enemy.hp = enemy.getMaxHp();

    game.move.select(MoveId.MACH_PUNCH);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
  });

  it("should ignore target's evasiveness boosts", async () => {
    game.override.enemyMoveset([MoveId.MINIMIZE]);
    await game.classicMode.startBattle();

    const pokemon = game.field.getPlayerPokemon();
    vi.spyOn(pokemon, "getAccuracyMultiplier");

    game.move.select(MoveId.FORESIGHT);
    await game.toNextTurn();
    game.move.select(MoveId.QUICK_ATTACK);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(pokemon.getAccuracyMultiplier).toHaveReturnedWith(1);
  });
});
