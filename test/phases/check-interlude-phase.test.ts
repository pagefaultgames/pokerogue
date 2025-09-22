import { AbilityId } from "#enums/ability-id";
import { BerryType } from "#enums/berry-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { WeatherType } from "#enums/weather-type";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Check Biome End Phase", () => {
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
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .ability(AbilityId.BALL_FETCH)
      .startingLevel(100)
      .battleStyle("single");
  });

  it("should not trigger end of turn effects when defeating the final pokemon of a biome in classic", async () => {
    game.override
      .startingWave(10)
      .weather(WeatherType.SANDSTORM)
      .startingHeldItems([{ name: "BERRY", type: BerryType.SITRUS }]);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const player = game.field.getPlayerPokemon();

    player.hp = 1;

    game.move.use(MoveId.EXTREME_SPEED);
    await game.toEndOfTurn();

    expect(player.hp).toBe(1);
  });

  it("should not prevent end of turn effects when transitioning waves within a biome", async () => {
    game.override.weather(WeatherType.SANDSTORM);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const player = game.field.getPlayerPokemon();

    game.move.use(MoveId.EXTREME_SPEED);
    await game.toEndOfTurn();

    expect(player.hp).toBeLessThan(player.getMaxHp());
  });
});
