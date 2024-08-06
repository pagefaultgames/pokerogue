import GameManager from "#test/utils/gameManager";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Test Battle Phase", () => {
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
    const moveToUse = Moves.SPLASH;
    game.override
      .battleType("single")
      .startingWave(3);
    game.override.starterSpecies(Species.MEWTWO);
    game.override.enemySpecies(Species.RATTATA);
    game.override.enemyAbility(Abilities.HYDRATION);
    game.override.ability(Abilities.ZEN_MODE);
    game.override.startingLevel(2000);
    game.override.moveset([moveToUse]);
    game.override.enemyMoveset([Moves.TACKLE,Moves.TACKLE,Moves.TACKLE,Moves.TACKLE]);
  });

  it.skip("to next turn", async() => {
    await game.startBattle();
    const turn = game.scene.currentBattle.turn;
    game.doAttack(0);
    await game.toNextTurn();
    expect(game.scene.currentBattle.turn).toBeGreaterThan(turn);
  }, 20000);
});

