import { CommandPhase } from "#app/phases/command-phase";
import { Command } from "#app/ui/command-ui-handler";
import { Challenges } from "#enums/challenges";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Challenge - Limited Catch", () => {
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

    game.challengeMode.addChallenge(Challenges.LIMITED_CATCH);

    game.override.battleType("single");
  });

  it("prevents catching pokemon outside of the first wave of the biome", async () => {
    game.override
      .startingWave(3)
      .pokeballs([ 0, 0, 0, 0, 100 ]);
    await game.challengeMode.startBattle([ Species.FEEBAS ]);

    const phase = game.scene.getCurrentPhase() as CommandPhase;
    phase.handleCommand(Command.BALL, 4);
    await game.phaseInterceptor.to("BattleEndPhase");

    expect(game.scene.getParty().length).toBe(1);
  });
});
