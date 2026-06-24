import { UiMode } from "#enums/ui-mode";
import { GameManager } from "#test/framework/game-manager";
import type { PartyUiHandler } from "#ui/handlers/party-ui-handler";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("BattleMessageUiHandler - alwaysPromptMessages setting", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.scene.alwaysPromptMessages = false;
  });

  it("should not force a prompt when the setting is disabled and none was requested", () => {
    game.scene.alwaysPromptMessages = false;
    const handler = game.scene.ui.getMessageHandler();

    handler.showText("test message", null, undefined, undefined, false);

    expect(handler.pendingPrompt).toBe(false);
  });

  it("should leave an explicitly requested prompt untouched when the setting is disabled", () => {
    game.scene.alwaysPromptMessages = false;
    const handler = game.scene.ui.getMessageHandler();

    handler.showText("test message", null, undefined, undefined, true);

    expect(handler.pendingPrompt).toBe(true);
  });

  it("should force a prompt when the setting is enabled, even if the prompt was explicitly disabled", () => {
    game.scene.alwaysPromptMessages = true;
    const handler = game.scene.ui.getMessageHandler();

    handler.showText("test message", null, undefined, undefined, false);

    expect(handler.pendingPrompt).toBe(true);
  });

  it("should force a prompt when the setting is enabled and no prompt value was provided", () => {
    game.scene.alwaysPromptMessages = true;
    const handler = game.scene.ui.getMessageHandler();

    handler.showText("test message");

    expect(handler.pendingPrompt).toBe(true);
  });

  it("should not affect menu-screen handlers (e.g. party screen), which define their own showText", () => {
    game.scene.alwaysPromptMessages = true;
    const partyHandler = game.scene.ui.handlers[UiMode.PARTY] as PartyUiHandler;

    partyHandler.showText("test message", null, undefined, undefined, false);

    expect(partyHandler.pendingPrompt).toBe(false);
  });
});
