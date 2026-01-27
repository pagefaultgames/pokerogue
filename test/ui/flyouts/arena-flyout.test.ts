import { AbilityId } from "#enums/ability-id";
import { ArenaTagType } from "#enums/arena-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import { mockI18next } from "#test/test-utils/test-utils";
import type { ArenaFlyout } from "#ui/containers/arena-flyout";
import type i18next from "i18next";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, type MockInstance } from "vitest";

describe("UI - Arena Flyout", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let flyout: ArenaFlyout;
  let tSpy: MockInstance<(typeof i18next)["t"]>;

  beforeAll(async () => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });

    game = new GameManager(phaserGame);
    game.override
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("double")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);

    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    flyout = game.scene.arenaFlyout;
  });

  beforeEach(() => {
    tSpy = mockI18next();
  });

  describe("localizeEffectName", () => {
    it("should retrieve locales from an effect name", () => {
      const name = flyout["localizeEffectName"](ArenaTagType[ArenaTagType.STEALTH_ROCK]);
      expect(name).toBe("arenaFlyout:stealthRock");
      expect(tSpy).toHaveBeenCalledExactlyOnceWith("arenaFlyout:stealthRock");
    });
  });

  // Helper type to get around unexportedness
  type infoType = Parameters<(typeof flyout)["getTagText"]>[0];

  describe("getTagText", () => {
    it.each<{ info: Pick<infoType, "name" | "duration" | "maxDuration">; text: string }>([
      { info: { name: "Spikes (1)", duration: 0, maxDuration: 0 }, text: "Spikes (1)\n" },
      { info: { name: "Grassy Terrain", duration: 1, maxDuration: 5 }, text: "Grassy Terrain  (1/5)\n" },
    ])("should get the name of an arena effect", ({ info, text }) => {
      const got = flyout["getTagText"](info as infoType);
      expect(got).toBe(text);
    });
  });
});
