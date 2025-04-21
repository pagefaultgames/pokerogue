import { Button } from "#app/enums/buttons";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import { CommandPhase } from "#app/phases/command-phase";
import FightUiHandler from "#app/ui/fight-ui-handler";
import { UiMode } from "#enums/ui-mode";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type MockText from "#test/testUtils/mocks/mocksContainer/mockText";
import i18next from "i18next";

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
    game.override.battleStyle("single").startingLevel(100).startingWave(1).enemyMoveset(Moves.SPLASH);
  });

  it("check immunity color", async () => {
    game.override
      .battleStyle("single")
      .startingLevel(100)
      .startingWave(1)
      .enemySpecies(Species.FLORGES)
      .enemyMoveset(Moves.SPLASH)
      .moveset([Moves.DRAGON_CLAW]);
    game.settings.typeHints(true); //activate type hints

    await game.classicMode.startBattle([Species.RAYQUAZA]);

    game.onNextPrompt("CommandPhase", UiMode.COMMAND, () => {
      const { ui } = game.scene;
      const handler = ui.getHandler<FightUiHandler>();
      handler.processInput(Button.ACTION); // select "Fight"
      game.phaseInterceptor.unlock();
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
    await game.phaseInterceptor.to(CommandPhase);
  });

  it("check status move color", async () => {
    game.override.enemySpecies(Species.FLORGES).moveset([Moves.GROWL]);

    await game.classicMode.startBattle([Species.RAYQUAZA]);

    game.onNextPrompt("CommandPhase", UiMode.COMMAND, () => {
      const { ui } = game.scene;
      const handler = ui.getHandler<FightUiHandler>();
      handler.processInput(Button.ACTION); // select "Fight"
      game.phaseInterceptor.unlock();
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
    await game.phaseInterceptor.to(CommandPhase);
  });

  it("should show the proper hint for a move in doubles after one of the enemy pokemon flees", async () => {
    game.override
      .enemySpecies(Species.ABRA)
      .moveset([Moves.SPLASH, Moves.SHADOW_BALL, Moves.SOAK])
      .enemyMoveset([Moves.SPLASH, Moves.TELEPORT])
      .battleStyle("double");

    await game.classicMode.startBattle([Species.MAGIKARP, Species.MAGIKARP]);
    game.move.select(Moves.SPLASH);
    // Use soak to change type of remaining abra to water
    game.move.select(Moves.SOAK, 1);

    await game.forceEnemyMove(Moves.SPLASH);
    await game.forceEnemyMove(Moves.TELEPORT);
    await game.toNextTurn();

    game.onNextPrompt("CommandPhase", UiMode.COMMAND, () => {
      const { ui } = game.scene;
      const handler = ui.getHandler<FightUiHandler>();
      handler.processInput(Button.ACTION); // select "Fight"
      game.phaseInterceptor.unlock();
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
    await game.phaseInterceptor.to(CommandPhase);
  });
});
