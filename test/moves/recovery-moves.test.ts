import { getPokemonNameWithAffix } from "#app/messages";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { WeatherType } from "#enums/weather-type";
import { GameManager } from "#test/test-utils/game-manager";
import { getEnumValues } from "#utils/enums";
import { toTitleCase } from "#utils/strings";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Recovery Moves - ", () => {
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

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .ability(AbilityId.MAGIC_GUARD) // prevents passive weather damage
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  describe.each<{ name: string; move: MoveId }>([
    { name: "Recover", move: MoveId.RECOVER },
    { name: "Soft-Boiled", move: MoveId.SOFT_BOILED },
    { name: "Milk Drink", move: MoveId.MILK_DRINK },
    { name: "Slack Off", move: MoveId.SLACK_OFF },
    { name: "Roost", move: MoveId.ROOST },
    { name: "Weather-based Healing Moves", move: MoveId.SYNTHESIS },
    { name: "Shore Up", move: MoveId.SHORE_UP },
  ])("$name", ({ move }) => {
    it("should heal 50% of the user's maximum HP", async () => {
      await game.classicMode.startBattle([SpeciesId.BLISSEY]);

      const blissey = game.field.getPlayerPokemon();
      blissey.hp = 1;

      game.move.use(move);
      await game.toEndOfTurn();

      expect(blissey.getHpRatio()).toBeCloseTo(0.5, 1);
      expect(game.phaseInterceptor.log).toContain("PokemonHealPhase");
    });

    it("should fail if used at full HP", async () => {
      await game.classicMode.startBattle([SpeciesId.BLISSEY]);

      game.move.use(move);
      await game.toEndOfTurn();

      const blissey = game.field.getPlayerPokemon();
      expect(blissey.hp).toBe(blissey.getMaxHp());
      expect(game.textInterceptor.logs).toContain(
        i18next.t("battle:hpIsFull", {
          pokemonName: getPokemonNameWithAffix(blissey),
        }),
      );
      expect(game.phaseInterceptor.log).not.toContain("PokemonHealPhase");
      expect(blissey.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
    });
  });

  describe("Weather-based Healing Moves", () => {
    it.each([
      { name: "Harsh Sunlight", weather: WeatherType.SUNNY },
      { name: "Extremely Harsh Sunlight", weather: WeatherType.HARSH_SUN },
    ])("should heal 66% of the user's maximum HP under $name", async ({ weather }) => {
      game.override.weather(weather);
      await game.classicMode.startBattle([SpeciesId.BLISSEY]);

      const blissey = game.field.getPlayerPokemon();
      blissey.hp = 1;

      game.move.use(MoveId.MOONLIGHT);
      await game.toEndOfTurn();

      expect(blissey.getHpRatio()).toBeCloseTo(0.66, 1);
    });

    const nonSunWTs = getEnumValues(WeatherType)
      .filter(
        wt => ![WeatherType.SUNNY, WeatherType.HARSH_SUN, WeatherType.NONE, WeatherType.STRONG_WINDS].includes(wt),
      )
      .map(wt => ({
        name: toTitleCase(WeatherType[wt]),
        weather: wt,
      }));

    it.each(nonSunWTs)("should heal 25% of the user's maximum HP under $name", async ({ weather }) => {
      game.override.weather(weather);
      await game.classicMode.startBattle([SpeciesId.BLISSEY]);

      const blissey = game.field.getPlayerPokemon();
      blissey.hp = 1;

      game.move.use(MoveId.MOONLIGHT);
      await game.toEndOfTurn();

      expect(blissey.getHpRatio()).toBeCloseTo(0.25, 1);
    });

    it("should heal 50% of the user's maximum HP under strong winds", async () => {
      game.override.ability(AbilityId.DELTA_STREAM);
      await game.classicMode.startBattle([SpeciesId.BLISSEY]);

      const blissey = game.field.getPlayerPokemon();
      blissey.hp = 1;

      game.move.use(MoveId.MOONLIGHT);
      await game.toEndOfTurn();

      expect(blissey.getHpRatio()).toBeCloseTo(0.5, 1);
    });
  });

  describe("Shore Up", () => {
    it("should heal 66% of the user's maximum HP in a sandstorm", async () => {
      game.override.weather(WeatherType.SANDSTORM);
      await game.classicMode.startBattle([SpeciesId.BLISSEY]);

      const blissey = game.field.getPlayerPokemon();
      blissey.hp = 1;

      game.move.use(MoveId.SHORE_UP);
      await game.toEndOfTurn();

      expect(blissey.getHpRatio()).toBeCloseTo(0.66, 1);
    });
  });
});
