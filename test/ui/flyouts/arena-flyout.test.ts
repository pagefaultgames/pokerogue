import type { SerializedPositionalTag } from "#data/positional-tags/load-positional-tag";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { PositionalTagType } from "#enums/positional-tag-type";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import { mockI18next } from "#test/test-utils/test-utils";
import type { ArenaFlyout } from "#ui/arena-flyout";
import type i18next from "i18next";
import Phaser from "phaser";
import { afterAll, beforeAll, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";

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

    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    flyout = game.scene.arenaFlyout;
  });

  beforeEach(() => {
    // Reset i18n mock before each test
    tSpy = mockI18next();
  });

  afterAll(() => {
    game.phaseInterceptor.restoreOg();
  });

  describe("localizeEffectName", () => {
    it("should retrieve locales from an effect name", () => {
      const name = flyout["localizeEffectName"]("STEALTH_ROCK");
      expect(name).toBe("arenaFlyout:stealthRock");
      expect(tSpy).toHaveBeenCalledExactlyOnceWith("arenaFlyout:stealthRock");
    });
  });

  // Helper type to get around unexportedness
  type posTagInfo = (typeof flyout)["positionalTags"][number];

  describe("getPositionalTagDisplayName", () => {
    it.each([
      { tag: { tagType: PositionalTagType.WISH }, name: "arenaFlyout:wish" },
      {
        tag: { sourceMove: MoveId.FUTURE_SIGHT, tagType: PositionalTagType.DELAYED_ATTACK },
        name: "arenaFlyout:futureSight",
      },
      {
        tag: { sourceMove: MoveId.DOOM_DESIRE, tagType: PositionalTagType.DELAYED_ATTACK },
        name: "arenaFlyout:doomDesire",
      },
    ])("should get the name of a Positional Tag", ({ tag, name }) => {
      const got = flyout["getPositionalTagDisplayName"](tag as SerializedPositionalTag);
      expect(got).toBe(name);
    });
  });

  describe("getPosTagText", () => {
    it.each<{ tag: Pick<posTagInfo, "duration" | "name" | "targetIndex">; output: string; double?: boolean }>([
      { tag: { duration: 2, name: "Wish", targetIndex: BattlerIndex.PLAYER }, output: "Wish  (2)" },
      {
        tag: { duration: 1, name: "Future Sight", targetIndex: BattlerIndex.ENEMY_2 },
        double: true,
        output: "Future Sight  (arenaFlyout:right, 1)",
      },
    ])("should produce the correct text", ({ tag, output, double = false }) => {
      vi.spyOn(game.scene.currentBattle, "double", "get").mockReturnValue(double);
      const text = flyout["getPosTagText"](tag as posTagInfo);
      expect(text).toBe(output + "\n");
    });
  });
});
