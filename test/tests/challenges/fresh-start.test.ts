import { AbilityId } from "#enums/ability-id";
import { Challenges } from "#enums/challenges";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Challenges - Fresh Start", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);

    game.challengeMode.addChallenge(Challenges.FRESH_START, 2, 1);
    game.override
      .battleStyle("single")
      .enemySpecies(SpeciesId.VOLTORB)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .moveset(MoveId.SPLASH);
  });

  it("should allow a shiny starter to remain shiny but grant no luck", async () => {
    game.override.disableShinies = false;
    game.override.shiny(true, 1);
    await game.challengeMode.startBattle(SpeciesId.NUZLEAF);

    const player = game.field.getPlayerPokemon();
    expect(player.shiny).toBe(true);
    expect(player.variant).toBe(1);
    expect(player.luck).toBe(0);
    expect(player.getLuck()).toBe(0);
  });

  it("should leave a non-shiny starter as non-shiny with no luck", async () => {
    game.override.shiny(false);
    await game.challengeMode.startBattle(SpeciesId.NUZLEAF);

    const player = game.field.getPlayerPokemon();
    expect(player.shiny).toBe(false);
    expect(player.luck).toBe(0);
  });
});
