import { StatusEffect } from "#app/data/status-effect";
import i18next from "#app/plugins/i18n";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const TIMEOUT = 20 * 1000;

describe("Items - Toxic orb", () => {
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
      .battleType("single")
      .enemySpecies(Species.RATTATA)
      .ability(Abilities.BALL_FETCH)
      .enemyAbility(Abilities.BALL_FETCH)
      .moveset([ Moves.SPLASH ])
      .enemyMoveset(Moves.SPLASH)
      .startingHeldItems([{
        name: "TOXIC_ORB",
      }]);

    vi.spyOn(i18next, "t");
  });

  it("badly poisons the holder", async () => {
    await game.classicMode.startBattle([ Species.MIGHTYENA ]);

    const player = game.scene.getPlayerField()[0];

    game.move.select(Moves.SPLASH);

    await game.phaseInterceptor.to("TurnEndPhase");
    // Toxic orb should trigger here
    await game.phaseInterceptor.run("MessagePhase");
    expect(i18next.t).toHaveBeenCalledWith("statusEffect:toxic.obtainSource", expect.anything());

    await game.toNextTurn();

    expect(player.status?.effect).toBe(StatusEffect.TOXIC);
    // Damage should not have ticked yet.
    expect(player.status?.turnCount).toBe(0);
  }, TIMEOUT);
});
