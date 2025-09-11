import { loggedInUser } from "#app/account";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe.each<{ name: string; move: MoveId; message: () => string }>([
  { name: "Splash", move: MoveId.SPLASH, message: () => i18next.t("moveTriggers:splash") },
  {
    name: "Celebrate",
    move: MoveId.CELEBRATE,
    message: () => i18next.t("moveTriggers:celebrate", { playerName: loggedInUser?.username }),
  },
])("Move - $name", ({ move, message }) => {
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
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.TACKLE)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should show a message on use", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(move);
    await game.toEndOfTurn();

    expect(game).toHaveShownMessage(message());
  });
});
