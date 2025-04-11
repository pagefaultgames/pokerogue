import { BattlerIndex } from "#app/battle";
import { globalScene } from "#app/global-scene";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Mold Breaker", () => {
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
      .moveset([Moves.SPLASH])
      .ability(Abilities.MOLD_BREAKER)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should turn off the ignore abilities arena variable after the user's move", async () => {
    game.override
      .enemyMoveset(Moves.SPLASH)
      .ability(Abilities.MOLD_BREAKER)
      .moveset([Moves.ERUPTION])
      .startingLevel(100)
      .enemyLevel(2);
    await game.classicMode.startBattle([Species.MAGIKARP]);
    const enemy = game.scene.getEnemyPokemon()!;

    expect(enemy.isFainted()).toBe(false);
    game.move.select(Moves.SPLASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEndPhase", true);
    expect(globalScene.arena.ignoreAbilities).toBe(false);
  });
});
