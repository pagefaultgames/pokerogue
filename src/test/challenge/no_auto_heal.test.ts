import { Abilities } from "#enums/abilities";
import { Challenges } from "#enums/challenges";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Challenge - No Auto Heal", () => {
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

    game.challengeMode.addChallenge(Challenges.NO_AUTO_HEAL);

    game.override
      .battleType("single")
      .starterSpecies(Species.FEEBAS)
      .ability(Abilities.BALL_FETCH)
      .moveset(Moves.THUNDERBOLT)
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("prevents PartyHealPhase from healing the player's pokemon", async () => {
    game.override
      .startingWave(10)
      .startingLevel(100);
    await game.challengeMode.startBattle();

    const player = game.scene.getPlayerField()[0];
    player.damageAndUpdate(1);

    game.move.select(Moves.THUNDERBOLT);
    await game.phaseInterceptor.to("SelectModifierPhase", false);
    game.doSelectModifier();
    await game.toNextTurn();

    expect(player.hp).toBe(player.getMaxHp() - 1);
    expect(player.moveset[0]?.ppUsed).toBe(1);
  });
});
