import type { BattleScene } from "#app/battle-scene";
import { TerrainType } from "#data/terrain";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagType } from "#enums/arena-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { WeatherType } from "#enums/weather-type";
import { TerrainChangedEvent, WeatherChangedEvent } from "#events/arena";
import { TurnEndEvent } from "#events/battle-scene";
import type { Arena } from "#field/arena";
import { GameManager } from "#test/framework/game-manager";
import { mockI18next } from "#test/utils/test-utils";
import type { ArenaFlyout } from "#ui/containers/arena-flyout";
import type i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, type MockInstance } from "vitest";

describe("UI - Arena Flyout", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let flyout: ArenaFlyout;

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

  describe("Unit Tests", () => {
    let tSpy: MockInstance<(typeof i18next)["t"]>;

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
    type InfoType = Parameters<(typeof flyout)["getTagText"]>[0];

    describe("getTagText", () => {
      it.each<{ info: Pick<InfoType, "name" | "duration" | "maxDuration">; text: string }>([
        { info: { name: "Spikes (1)", duration: 0, maxDuration: 0 }, text: "Spikes (1)\n" },
        { info: { name: "Grassy Terrain", duration: 1, maxDuration: 5 }, text: "Grassy Terrain  (1/5)\n" },
      ])("should get the name of an arena effect", ({ info, text }) => {
        const got = flyout["getTagText"](info as InfoType);
        expect(got).toBe(text);
      });
    });
  });

  describe("Integration Tests", () => {
    let arenaEventTarget: Arena["eventTarget"];
    let battleEventTarget: BattleScene["eventTarget"];

    beforeAll(() => {
      arenaEventTarget = game.scene.arena.eventTarget;
      battleEventTarget = game.scene.eventTarget;
    });

    afterEach(() => {
      flyout["weatherInfo"] = undefined;
      flyout["terrainInfo"] = undefined;
      flyout["arenaTags"] = [];
      flyout["clearText"]();
    });

    /**
     * Check that the flyout's info was updated and its name is as expected.
     */
    function expectInfoUpdate<T extends "weatherInfo" | "terrainInfo">(
      infoType: T,
      expected: Omit<
        NonNullable<T extends "weatherInfo" ? (typeof flyout)["weatherInfo"] : (typeof flyout)["terrainInfo"]>,
        "name"
      >,
    ): void {
      const info = flyout[infoType satisfies "weatherInfo" | "terrainInfo"]!;
      expect(info).toBeDefined();
      expect(info).toMatchObject(expected);
      expect(flyout["flyoutTextField"].text).toBe(flyout["getTagText"](info));
      expect(flyout["flyoutTextField"].text).toMatch(`${expected.duration}/${expected.maxDuration}`);
    }

    it("should update the weather display correctly", () => {
      arenaEventTarget.dispatchEvent(new WeatherChangedEvent(WeatherType.RAIN, 5));
      expectInfoUpdate("weatherInfo", {
        weatherType: WeatherType.RAIN,
        duration: 5,
        maxDuration: 5,
      });
      battleEventTarget.dispatchEvent(new TurnEndEvent(1));
      expectInfoUpdate("weatherInfo", {
        weatherType: WeatherType.RAIN,
        duration: 4,
        maxDuration: 5,
      });

      arenaEventTarget.dispatchEvent(new WeatherChangedEvent(WeatherType.SNOW, 5, 7));
      expectInfoUpdate("weatherInfo", {
        weatherType: WeatherType.SNOW,
        duration: 5,
        maxDuration: 7,
      });

      flyout["weatherInfo"]!.duration = 1;
      game.scene.eventTarget.dispatchEvent(new TurnEndEvent(1));
      expect(flyout["weatherInfo"]).toBeUndefined();
    });

    it("should update the terrain display correctly", () => {
      arenaEventTarget.dispatchEvent(new TerrainChangedEvent(TerrainType.MISTY, 5));
      expectInfoUpdate("terrainInfo", {
        terrainType: TerrainType.MISTY,
        duration: 5,
        maxDuration: 5,
      });
      battleEventTarget.dispatchEvent(new TurnEndEvent(1));
      expectInfoUpdate("terrainInfo", {
        terrainType: TerrainType.MISTY,
        duration: 4,
        maxDuration: 5,
      });

      arenaEventTarget.dispatchEvent(new TerrainChangedEvent(TerrainType.GRASSY, 5, 7));
      expectInfoUpdate("terrainInfo", {
        terrainType: TerrainType.GRASSY,
        duration: 5,
        maxDuration: 7,
      });

      flyout["terrainInfo"]!.duration = 1;
      game.scene.eventTarget.dispatchEvent(new TurnEndEvent(1));
      expect(flyout["terrainInfo"]).toBeUndefined();
    });
  });
});
