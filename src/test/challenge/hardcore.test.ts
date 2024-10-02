import { Abilities } from "#enums/abilities";
import { Challenges } from "#enums/challenges";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Challenge - Hardcore", () => {
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

    game.challengeMode.addChallenge(Challenges.HARDCORE);

    game.override
      .battleType("single")
      .starterSpecies(Species.FEEBAS)
      .ability(Abilities.BALL_FETCH)
      .moveset(Moves.THUNDERBOLT)
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  // TODO: Find a way to make this test
  it.todo("prevents revival items from showing up in the shop", async () => {
    game.override
      .startingWave(191)
      .startingLevel(1000);
    await game.challengeMode.startBattle();

    game.move.select(Moves.THUNDERBOLT);
    await game.phaseInterceptor.to("SelectModifierPhase");

    expect(1);
  });
});
