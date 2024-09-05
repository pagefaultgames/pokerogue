import { setSetting, SettingKeys } from "#app/system/settings/settings.js";
import i18next from "i18next";
import { expect, describe, it, beforeAll, afterEach, vi, beforeEach } from "vitest";
import GameManager from "../utils/gameManager";
import OptionSelectUiHandler from "#app/ui/settings/option-select-ui-handler.js";
import { Mode } from "#app/ui/ui.js";
import { languages, languagesKeys, languagesLabels } from "#app/plugins/i18n.js";

class TestingOptionSelectUiHandler extends OptionSelectUiHandler {
  public get getOptions() {
    return this.config?.options;
  }
}

describe("Check Languages", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let optionSelectUiHandler: TestingOptionSelectUiHandler;

  beforeAll(async () => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
    game = new GameManager(phaserGame);
    expect(languages).not.toBe(undefined);
    await game.runToTitle();
    vi.spyOn(game.scene.ui, "hideTooltip").mockReturnValueOnce();
    game.scene.ui.handlers[Mode.OPTION_SELECT] = new TestingOptionSelectUiHandler(game.scene);
    game.scene.ui.handlers[Mode.OPTION_SELECT].setup();
  });

  beforeEach(() => {
    game.setMode(Mode.SETTINGS_DISPLAY);
    setSetting(game.scene, SettingKeys.Language, 1);
    optionSelectUiHandler = game.scene.ui.getHandler();
  });

  afterEach(async () => {
    game.phaseInterceptor.restoreOg();
  });

  it("Correct structure is expected: { label: string, handler: function }", () => {
    expect(
      optionSelectUiHandler.getOptions?.every((option) => {
        return (
          typeof option.label === "string" &&
          typeof option.handler === "function"
        );
      })
    ).toBe(true);
  });

  [...languagesLabels].map(async (lang, index, array) => {
    return it(`Check ${lang}`, async () => {
      // Active language should be the current one.
      expect(i18next.resolvedLanguage).toBe(languagesKeys[index]);

      // Active language should not be among the options.
      expect(optionSelectUiHandler.getOptions?.some(({ label }) => label === lang)).toBe(false);

      // Change to following language.
      i18next.changeLanguage(languagesKeys[(index + 1) % array.length]);
    });
  });
});
