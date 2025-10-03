import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Move - Belch", () => {
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
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .moveset(MoveId.BELCH)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should only be selectable if the user has previously eaten a berry", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);
    const player = game.field.getPlayerPokemon();
    expect(
      !game.field.getPlayerPokemon().isMoveSelectable(MoveId.BELCH),
      "Belch should not be selectable without a berry",
    );

    player.battleData.hasEatenBerry = true;

    expect(
      game.field.getPlayerPokemon().isMoveSelectable(MoveId.BELCH),
      "Belch should be selectable after eating a berry",
    );
  });
});
