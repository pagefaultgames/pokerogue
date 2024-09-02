import { allMoves } from "#app/data/move";
import { WeatherType } from "#app/data/weather";
import { Abilities } from "#app/enums/abilities";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
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
    game.override
      .weather(WeatherType.FOG)
      .battleType("single");
    game.override.moveset([Moves.TACKLE]);
    game.override.ability(Abilities.BALL_FETCH);
    game.override.enemyAbility(Abilities.BALL_FETCH);
    game.override.enemySpecies(Species.MAGIKARP);
    game.override.enemyMoveset(new Array(4).fill(Moves.SPLASH));
  });

  it("move accuracy is multiplied by 90%", async () => {
    const moveToCheck = allMoves[Moves.TACKLE];

    vi.spyOn(moveToCheck, "calculateBattleAccuracy");

    await game.startBattle([Species.MAGIKARP]);
    game.move.select(Moves.TACKLE);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattleAccuracy).toHaveReturnedWith(100 * 0.9);
  });
});
