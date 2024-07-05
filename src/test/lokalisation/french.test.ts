import {afterEach, beforeAll, describe, expect, it} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import {Species} from "#enums/species";
import i18next from "i18next";
import {initI18n} from "#app/plugins/i18n";

describe("Lokalization - french", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    initI18n();
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it("test bulbasaur name english", async () => {
    game = new GameManager(phaserGame);
    await game.startBattle([
      Species.BULBASAUR,
    ]);
    expect(game.scene.getParty()[0].name).toBe("Bulbasaur");
  }, 20000);

  it("test bulbasaure name french", async () => {
    const locale = "fr";
    i18next.changeLanguage(locale);
    localStorage.setItem("prLang", locale);
    game = new GameManager(phaserGame);

    await game.startBattle([
      Species.BULBASAUR,
    ]);
    expect(game.scene.getParty()[0].name).toBe("Bulbizarre");
  }, 20000);
});
