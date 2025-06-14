import { getPokemonNameWithAffix } from "#app/messages";
import { getEnumValues, toReadableString } from "#app/utils/common";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { WeatherType } from "#enums/weather-type";
import GameManager from "#test/testUtils/gameManager";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Recovery Moves", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  describe.each<{ name: string; move: MoveId }>([
    { name: "Recover", move: MoveId.RECOVER },
    { name: "Soft-Boiled", move: MoveId.SOFT_BOILED },
    { name: "Milk Drink", move: MoveId.MILK_DRINK },
    { name: "Slack Off", move: MoveId.SLACK_OFF },
    { name: "Roost", move: MoveId.ROOST },
  ])("Normal Recovery Moves - $name", ({ move }) => {
    afterEach(() => {
      game.phaseInterceptor.restoreOg();
    });

    beforeEach(() => {
      game = new GameManager(phaserGame);
      game.override
        .ability(AbilityId.BALL_FETCH)
        .battleStyle("single")
        .disableCrits()
        .enemySpecies(SpeciesId.MAGIKARP)
        .enemyAbility(AbilityId.BALL_FETCH)
        .enemyMoveset(MoveId.SPLASH)
        .startingLevel(100)
        .enemyLevel(100);
    });

    it("should heal 50% of the user's maximum HP", async () => {
      await game.classicMode.startBattle([SpeciesId.BLISSEY]);

      const blissey = game.field.getPlayerPokemon();
      blissey.hp = 1;

      game.move.use(move);
      await game.toEndOfTurn();

      expect(blissey.getHpRatio()).toBeCloseTo(0.5, 1);
      expect(game.phaseInterceptor.log).toContain("PokemonHealPhase");
    });

    it("should display message and fail if used at full HP", async () => {
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
    });
  });

  describe("Weather-based Healing moves", () => {
    afterEach(() => {
      game.phaseInterceptor.restoreOg();
    });

    beforeEach(() => {
      game = new GameManager(phaserGame);
      game.override
        .ability(AbilityId.BALL_FETCH)
        .battleStyle("single")
        .disableCrits()
        .enemySpecies(SpeciesId.MAGIKARP)
        .enemyAbility(AbilityId.BALL_FETCH)
        .enemyMoveset(MoveId.SPLASH)
        .startingLevel(100)
        .enemyLevel(100);
    });

    it.each([
      { name: "Harsh Sunlight", ability: AbilityId.DROUGHT },
      { name: "Extremely Harsh Sunlight", ability: AbilityId.DESOLATE_LAND },
    ])("should heal 66% of the user's maximum HP under $name", async ({ ability }) => {
      game.override.passiveAbility(ability);
      await game.classicMode.startBattle([SpeciesId.BLISSEY]);

      const blissey = game.field.getPlayerPokemon();
      blissey.hp = 1;

      game.move.use(MoveId.MOONLIGHT);
      await game.toEndOfTurn();

      expect(blissey.getHpRatio()).toBeCloseTo(0.67, 1);
    });

    const nonSunWTs = getEnumValues(WeatherType)
      .filter(wt => ![WeatherType.NONE, WeatherType.STRONG_WINDS].includes(wt))
      .map(wt => ({
        name: toReadableString(WeatherType[wt]),
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
    afterEach(() => {
      game.phaseInterceptor.restoreOg();
    });

    beforeEach(() => {
      game = new GameManager(phaserGame);
      game.override
        .ability(AbilityId.BALL_FETCH)
        .battleStyle("single")
        .disableCrits()
        .enemySpecies(SpeciesId.MAGIKARP)
        .enemyAbility(AbilityId.BALL_FETCH)
        .enemyMoveset(MoveId.SPLASH)
        .startingLevel(100)
        .enemyLevel(100);
    });

    it("should heal 66% of the user's maximum HP under sandstorm", async () => {
      game.override.ability(AbilityId.SAND_STREAM);
      await game.classicMode.startBattle([SpeciesId.BLISSEY]);

      const blissey = game.field.getPlayerPokemon();
      blissey.hp = 1;

      game.move.use(MoveId.SHORE_UP);
      await game.toEndOfTurn();

      expect(blissey.getHpRatio()).toBeCloseTo(0.66, 1);
    });
  });
});
