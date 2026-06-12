import { Button } from "#enums/buttons";
import { UiMode } from "#enums/ui-mode";
import { GameManager } from "#test/framework/game-manager";
import { a11yManager } from "#ui/accessibility-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Screen-reader announcement coverage for the settings screens.
 *
 * These tests drive the *real* settings handlers (not the rebinding mock helpers)
 * and assert that moving the cursor dispatches a fully-localized announcement to
 * {@linkcode a11yManager.announceMessage} — i.e. that the settings actually "read".
 * The keyboard bindings tab covers `AbstractControlSettingsUiHandler`; the
 * General / Display / Audio tabs cover `AbstractSettingsUiHandler`.
 */
describe("UI - Settings accessibility announcements", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(async () => {
    game = new GameManager(phaserGame);
    await game.runToTitle();
  });

  it("reads each row in the keyboard bindings tab (controller bindings)", async () => {
    const announce = vi.spyOn(a11yManager, "announceMessage");
    const context = vi.spyOn(a11yManager, "announceContext");

    await game.scene.ui.setOverlayMode(UiMode.SETTINGS_KEYBOARD);

    // Opening the tab reads the navigation instructions + the row under the cursor.
    expect(context).toHaveBeenCalled();
    expect(announce).toHaveBeenCalled();

    announce.mockClear();
    game.scene.ui.getHandler().processInput(Button.DOWN);
    const firstRow = String(announce.mock.calls.at(-1)?.[0] ?? "");

    announce.mockClear();
    game.scene.ui.getHandler().processInput(Button.DOWN);
    const secondRow = String(announce.mock.calls.at(-1)?.[0] ?? "");

    for (const text of [firstRow, secondRow]) {
      // A non-empty announcement was produced for the row...
      expect(text.length).toBeGreaterThan(0);
      // ...the accessibility namespace actually resolved (template wording present,
      // not a raw i18n key like "controlSettingBinding")...
      expect(text).toMatch(/bound to|unbound|: /);
      expect(text).not.toContain("controlSetting");
    }
    // ...and consecutive rows read out distinctly.
    expect(firstRow).not.toBe(secondRow);
  });

  it.each([
    { name: "General", mode: UiMode.SETTINGS },
    { name: "Display", mode: UiMode.SETTINGS_DISPLAY },
    { name: "Audio", mode: UiMode.SETTINGS_AUDIO },
  ])("reads label and value in the $name settings tab", async ({ mode }) => {
    const announce = vi.spyOn(a11yManager, "announceMessage");
    const context = vi.spyOn(a11yManager, "announceContext");

    await game.scene.ui.setOverlayMode(mode);

    // Opening the tab reads its navigation context.
    expect(context).toHaveBeenCalled();

    announce.mockClear();
    game.scene.ui.getHandler().processInput(Button.DOWN);
    const firstRow = String(announce.mock.calls.at(-1)?.[0] ?? "");

    announce.mockClear();
    game.scene.ui.getHandler().processInput(Button.DOWN);
    const secondRow = String(announce.mock.calls.at(-1)?.[0] ?? "");

    for (const text of [firstRow, secondRow]) {
      // Each row reads as "Label: Value".
      expect(text.length).toBeGreaterThan(0);
      expect(text).toContain(":");
    }
    expect(firstRow).not.toBe(secondRow);
  });
});
