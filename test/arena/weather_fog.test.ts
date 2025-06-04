import { allMoves } from "#app/data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { WeatherType } from "#enums/weather-type";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
    game.override.weather(WeatherType.FOG).battleStyle("single");
    game.override.moveset([MoveId.TACKLE]);
    game.override.ability(AbilityId.BALL_FETCH);
    game.override.enemyAbility(AbilityId.BALL_FETCH);
    game.override.enemySpecies(SpeciesId.MAGIKARP);
    game.override.enemyMoveset([MoveId.SPLASH]);
  });

  it("move accuracy is multiplied by 90%", async () => {
    const moveToCheck = allMoves[MoveId.TACKLE];

    vi.spyOn(moveToCheck, "calculateBattleAccuracy");

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    game.move.select(MoveId.TACKLE);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattleAccuracy).toHaveReturnedWith(100 * 0.9);
  });
});
