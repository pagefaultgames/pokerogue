import i18next from "#app/plugins/i18n";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { StatusEffect } from "#enums/status-effect";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
      .battleStyle("single")
      .enemySpecies(Species.MAGIKARP)
      .ability(Abilities.BALL_FETCH)
      .enemyAbility(Abilities.BALL_FETCH)
      .moveset(Moves.SPLASH)
      .enemyMoveset(Moves.SPLASH)
      .startingHeldItems([
        {
          name: "TOXIC_ORB",
        },
      ]);

    vi.spyOn(i18next, "t");
  });

  it("should badly poison the holder", async () => {
    await game.classicMode.startBattle([Species.FEEBAS]);

    const player = game.scene.getPlayerPokemon()!;
    expect(player.getHeldItems()[0].type.id).toBe("TOXIC_ORB");

    game.move.select(Moves.SPLASH);

    await game.phaseInterceptor.to("TurnEndPhase");
    await game.phaseInterceptor.to("MessagePhase");
    expect(i18next.t).toHaveBeenCalledWith("statusEffect:toxic.obtainSource", expect.anything());

    expect(player.status?.effect).toBe(StatusEffect.TOXIC);
    expect(player.status?.toxicTurnCount).toBe(0);
  });
});
