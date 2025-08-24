import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import i18next from "#plugins/i18n";
import { GameManager } from "#test/test-utils/game-manager";
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
      .enemySpecies(SpeciesId.MAGIKARP)
      .ability(AbilityId.BALL_FETCH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .moveset(MoveId.SPLASH)
      .enemyMoveset(MoveId.SPLASH)
      .startingHeldItems([
        {
          name: "TOXIC_ORB",
        },
      ]);

    vi.spyOn(i18next, "t");
  });

  it("should badly poison the holder", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const player = game.field.getPlayerPokemon();
    expect(player.getHeldItems()[0].type.id).toBe("TOXIC_ORB");

    game.move.select(MoveId.SPLASH);

    await game.phaseInterceptor.to("TurnEndPhase");
    await game.phaseInterceptor.to("MessagePhase");
    expect(i18next.t).toHaveBeenCalledWith("statusEffect:toxic.obtainSource", expect.anything());

    expect(player.status?.effect).toBe(StatusEffect.TOXIC);
    expect(player.status?.toxicTurnCount).toBe(0);
  });
});
