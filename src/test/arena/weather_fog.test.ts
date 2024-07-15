import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import overrides from "#app/overrides";
import { Species } from "#enums/species";
import {
  MoveEndPhase,
} from "#app/phases";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { allMoves } from "#app/data/move.js";
import { WeatherType } from "#app/data/weather.js";

describe("Weather - Fog", () => {
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
    vi.spyOn(overrides, "WEATHER_OVERRIDE", "get").mockReturnValue(WeatherType.FOG);
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.MAGIKARP);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue(new Array(4).fill(Moves.SPLASH));
  });

  it("move accuracy is multiplied by 90%", async () => {
    const moveToCheck = allMoves[Moves.TACKLE];
    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.TACKLE));
    const moveAccuracy = moveToCheck.calculateBattleAccuracy(game.scene.getPlayerPokemon(), game.scene.getEnemyPokemon());

    await game.phaseInterceptor.to(MoveEndPhase);

    expect(moveAccuracy).not.toBe(moveToCheck.accuracy);
    expect(moveAccuracy).toBe(moveToCheck.accuracy * 0.9);
  });
});
