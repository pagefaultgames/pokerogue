import { setSetting, SettingKeys } from "#app/system/settings/settings.js";
import i18next from "i18next";
import { expect, describe, it, beforeAll, afterEach, vi } from "vitest";
import GameManager from "../utils/gameManager";
import OptionSelectUiHandler from "#app/ui/settings/option-select-ui-handler.js";
import { Mode } from "#app/ui/ui.js";
import { languages } from "#app/plugins/i18n.js";

class TestingOptionSelectUiHandler extends OptionSelectUiHandler {
  public get getOptions() {
    return this.config?.options;
  }
}

describe("Check Languages", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(async () => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
    game = new GameManager(phaserGame);
    expect(languages).not.toBe(undefined);
    await game.runToTitle();
  });

  afterEach(async () => {
    game.phaseInterceptor.restoreOg();
  });

  it("correct structure: { label: string, handler: function}", () => {
    vi.spyOn(game.scene.ui, "hideTooltip").mockReturnValueOnce();
    game.scene.ui.handlers[Mode.OPTION_SELECT] = new TestingOptionSelectUiHandler(game.scene);
    game.scene.ui.handlers[Mode.OPTION_SELECT].setup();
    game.setMode(Mode.SETTINGS_DISPLAY);

    setSetting(game.scene, SettingKeys.Language, 1);
    const optionSelectUiHandler = game.scene.ui.getHandler() as TestingOptionSelectUiHandler;

    expect(
      optionSelectUiHandler.getOptions?.every((option) => {
        return (
          typeof option.label === "string" &&
          typeof option.handler === "function"
        );
      })
    ).toBe(true);
  });

  [...Object.values(languages)].map(async (lang, index, array) => {
    return it(`Check ${lang}`, async () => {
      expect(i18next.resolvedLanguage).toBe(Object.keys(languages)[index]);
      i18next.changeLanguage(
        Object.keys(languages)[(index + 1) % array.length]
      );
    });
  });
});
