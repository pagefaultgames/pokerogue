import { Button } from "#enums/buttons";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import { GameManager } from "#test/test-utils/game-manager";
import type { MockText } from "#test/test-utils/mocks/mocks-container/mock-text";
import { FightUiHandler } from "#ui/handlers/fight-ui-handler";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("UI - Type Hints", () => {
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

  beforeEach(async () => {
    game = new GameManager(phaserGame);
    game.settings.typeHints(true); //activate type hints
    game.override.battleStyle("single").startingLevel(100).startingWave(1).enemyMoveset(MoveId.SPLASH);
  });

  it("check immunity color", async () => {
    game.override
      .battleStyle("single")
      .startingLevel(100)
      .startingWave(1)
      .enemySpecies(SpeciesId.FLORGES)
      .enemyMoveset(MoveId.SPLASH)
      .moveset([MoveId.DRAGON_CLAW]);
    game.settings.typeHints(true); //activate type hints

    await game.classicMode.startBattle([SpeciesId.RAYQUAZA]);

    game.onNextPrompt("CommandPhase", UiMode.COMMAND, () => {
      const { ui } = game.scene;
      const handler = ui.getHandler<FightUiHandler>();
      handler.processInput(Button.ACTION); // select "Fight"
    });

    game.onNextPrompt("CommandPhase", UiMode.FIGHT, () => {
      const { ui } = game.scene;
      const movesContainer = ui.getByName<Phaser.GameObjects.Container>(FightUiHandler.MOVES_CONTAINER_NAME);
      const dragonClawText = movesContainer
        .getAll<Phaser.GameObjects.Text>()
        .find(text => text.text === i18next.t("move:dragonClaw.name"))! as unknown as MockText;

      expect.soft(dragonClawText.color).toBe("#929292");
      ui.getHandler().processInput(Button.ACTION);
    });
    await game.phaseInterceptor.to("CommandPhase");
  });

  it("check status move color", async () => {
    game.override.enemySpecies(SpeciesId.FLORGES).moveset([MoveId.GROWL]);

    await game.classicMode.startBattle([SpeciesId.RAYQUAZA]);

    game.onNextPrompt("CommandPhase", UiMode.COMMAND, () => {
      const { ui } = game.scene;
      const handler = ui.getHandler<FightUiHandler>();
      handler.processInput(Button.ACTION); // select "Fight"
    });

    game.onNextPrompt("CommandPhase", UiMode.FIGHT, () => {
      const { ui } = game.scene;
      const movesContainer = ui.getByName<Phaser.GameObjects.Container>(FightUiHandler.MOVES_CONTAINER_NAME);
      const growlText = movesContainer
        .getAll<Phaser.GameObjects.Text>()
        .find(text => text.text === i18next.t("move:growl.name"))! as unknown as MockText;

      expect.soft(growlText.color).toBe(undefined);
      ui.getHandler().processInput(Button.ACTION);
    });
    await game.phaseInterceptor.to("CommandPhase");
  });

  it("should show the proper hint for a move in doubles after one of the enemy pokemon flees", async () => {
    game.override
      .enemySpecies(SpeciesId.ABRA)
      .moveset([MoveId.SPLASH, MoveId.SHADOW_BALL, MoveId.SOAK])
      .enemyMoveset([MoveId.SPLASH, MoveId.TELEPORT])
      .battleStyle("double");

    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.MAGIKARP]);
    game.move.select(MoveId.SPLASH);
    // Use soak to change type of remaining abra to water
    game.move.select(MoveId.SOAK, 1);

    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.TELEPORT);
    await game.toNextTurn();

    game.onNextPrompt("CommandPhase", UiMode.COMMAND, () => {
      const { ui } = game.scene;
      const handler = ui.getHandler<FightUiHandler>();
      handler.processInput(Button.ACTION); // select "Fight"
    });

    game.onNextPrompt("CommandPhase", UiMode.FIGHT, () => {
      const { ui } = game.scene;
      const movesContainer = ui.getByName<Phaser.GameObjects.Container>(FightUiHandler.MOVES_CONTAINER_NAME);
      const shadowBallText = movesContainer
        .getAll<Phaser.GameObjects.Text>()
        .find(text => text.text === i18next.t("move:shadowBall.name"))! as unknown as MockText;
      expect.soft(shadowBallText).toBeDefined();

      expect.soft(shadowBallText.color).toBe(undefined);
      ui.getHandler().processInput(Button.ACTION);
    });
    await game.phaseInterceptor.to("CommandPhase");
  });
});
