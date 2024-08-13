import { SPLASH_ONLY } from "../utils/testUtils";
import { BerryPhase, TurnInitPhase } from "#app/phases";
import { WeatherType } from "#enums/weather-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";
import GameManager from "../utils/gameManager";
import { getMovePosition } from "../utils/gameManagerUtils";

const TIMEOUT = 20 * 1000;

describe("Moves - Chilly Reception", () => {
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
    game.override.battleType("single")
      .moveset([Moves.CHILLY_RECEPTION, Moves.SPLASH, Moves.SNOWSCAPE])
      .enemyMoveset(SPLASH_ONLY)
      .startingLevel(5)
      .enemyLevel(5);

  });

  test(
    "Chilly reception should still change the weather if user can't switch out",
    async () => {
      await game.startBattle([Species.SLOWKING]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;
      expect(enemyPokemon).toBeDefined();
      game.doAttack(getMovePosition(game.scene, 0, Moves.CHILLY_RECEPTION));

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SNOW);
    }, TIMEOUT
  );

  test(
    "Chilly reception should switch out even if it's snowing",
    async () => {
      await game.startBattle([Species.SLOWKING, Species.MEOWTH]);
      // first turn set up snow with snowscape, try chilly reception on second turn
      game.doAttack(getMovePosition(game.scene, 0, Moves.SNOWSCAPE));
      await game.phaseInterceptor.to(BerryPhase, false);
      expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SNOW);

      await game.phaseInterceptor.to(TurnInitPhase, false);
      game.doAttack(getMovePosition(game.scene, 0, Moves.CHILLY_RECEPTION));
      game.doSelectPartyPokemon(1);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SNOW);
      expect(game.scene.getPlayerField()[0].species.speciesId).toBe(Species.MEOWTH);
    }, TIMEOUT
  );
});
