import { Button } from "#app/enums/buttons";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import { CommandPhase } from "#app/phases/command-phase";
import FightUiHandler from "#app/ui/fight-ui-handler";
import { Mode } from "#app/ui/ui";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import MockText from "../utils/mocks/mocksContainer/mockText";
import { SPLASH_ONLY } from "../utils/testUtils";

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
    game.override.battleType("single").startingLevel(100).startingWave(1).enemyMoveset(SPLASH_ONLY);
  });

  it("check immunity color", async () => {
    game.override
      .battleType("single")
      .startingLevel(100)
      .startingWave(1)
      .enemySpecies(Species.FLORGES)
      .enemyMoveset(SPLASH_ONLY)
      .moveset([Moves.DRAGON_CLAW]);
    game.settings.typeHints(true); //activate type hints

    await game.startBattle([Species.RAYQUAZA]);

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      const { ui } = game.scene;
      const handler = ui.getHandler<FightUiHandler>();
      handler.processInput(Button.ACTION); // select "Fight"
      game.phaseInterceptor.unlock();
    });

    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const { ui } = game.scene;
      const movesContainer = ui.getByName<Phaser.GameObjects.Container>(FightUiHandler.MOVES_CONTAINER_NAME);
      const dragonClawText = movesContainer
        .getAll<Phaser.GameObjects.Text>()
        .find((text) => text.text === "Dragon Claw")! as unknown as MockText;

      expect.soft(dragonClawText.color).toBe("#929292");
      ui.getHandler().processInput(Button.ACTION);
    });
    await game.phaseInterceptor.to(CommandPhase);
  });

  it("check status move color", async () => {
    game.override.enemySpecies(Species.FLORGES).moveset([Moves.GROWL]);

    await game.startBattle([Species.RAYQUAZA]);

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      const { ui } = game.scene;
      const handler = ui.getHandler<FightUiHandler>();
      handler.processInput(Button.ACTION); // select "Fight"
      game.phaseInterceptor.unlock();
    });

    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const { ui } = game.scene;
      const movesContainer = ui.getByName<Phaser.GameObjects.Container>(FightUiHandler.MOVES_CONTAINER_NAME);
      const growlText = movesContainer
        .getAll<Phaser.GameObjects.Text>()
        .find((text) => text.text === "Growl")! as unknown as MockText;

      expect.soft(growlText.color).toBe(undefined);
      ui.getHandler().processInput(Button.ACTION);
    });
    await game.phaseInterceptor.to(CommandPhase);
  });
});
