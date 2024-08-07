import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#test/utils/gameManager";
import { Species } from "#app/enums/species.js";
import { SPLASH_ONLY } from "../utils/testUtils";
import { Moves } from "#app/enums/moves.js";
import { getMovePosition } from "../utils/gameManagerUtils";
import { MoveEffectPhase } from "#app/phases.js";

describe("Internals", () => {
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
      .enemySpecies(Species.GASTLY)
      .enemyMoveset(SPLASH_ONLY)
      .enemyLevel(5)
      .starterSpecies(Species.MAGIKARP)
      .moveset([Moves.FORESIGHT, Moves.QUICK_ATTACK, Moves.MACH_PUNCH]);
  });

  it("should allow Normal and Fighting moves to hit Ghost types", async () => {
    await game.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;

    game.doAttack(getMovePosition(game.scene, 0, Moves.QUICK_ATTACK));
    await game.toNextTurn();
    expect(enemy.hp).toBe(enemy.getMaxHp());

    game.doAttack(getMovePosition(game.scene, 0, Moves.FORESIGHT));
    await game.toNextTurn();
    game.doAttack(getMovePosition(game.scene, 0, Moves.QUICK_ATTACK));
    await game.toNextTurn();

    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
    enemy.hp = enemy.getMaxHp();

    game.doAttack(getMovePosition(game.scene, 0, Moves.MACH_PUNCH));
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
  });

  it("should ignore target's evasiveness boosts", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.MINIMIZE));
    await game.startBattle();

    const pokemon = game.scene.getPlayerPokemon()!;
    vi.spyOn(pokemon, "getAccuracyMultiplier");

    game.doAttack(getMovePosition(game.scene, 0, Moves.FORESIGHT));
    await game.toNextTurn();
    game.doAttack(getMovePosition(game.scene, 0, Moves.QUICK_ATTACK));
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(pokemon.getAccuracyMultiplier).toHaveReturnedWith(1);
  });
});
