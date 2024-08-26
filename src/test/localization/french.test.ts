import { initI18n } from "#app/plugins/i18n";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

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
