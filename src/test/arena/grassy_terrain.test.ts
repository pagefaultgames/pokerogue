import { allMoves } from "#app/data/move";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Arena - Grassy Terrain", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const TIMEOUT = 20 * 1000;

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
      .battleType("single")
      .disableCrits()
      .enemyLevel(30)
      .enemySpecies(Species.SNORLAX)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH)
      .moveset([Moves.GRASSY_TERRAIN, Moves.EARTHQUAKE])
      .ability(Abilities.BALL_FETCH);
  });

  it("halves the damage of Earthquake", async () => {
    await game.classicMode.startBattle([Species.FEEBAS]);

    const eq = allMoves[Moves.EARTHQUAKE];
    vi.spyOn(eq, "calculateBattlePower");

    game.move.select(Moves.EARTHQUAKE);
    await game.toNextTurn();

    expect(eq.calculateBattlePower).toHaveReturnedWith(100);

    game.move.select(Moves.GRASSY_TERRAIN);
    await game.toNextTurn();

    game.move.select(Moves.EARTHQUAKE);
    await game.phaseInterceptor.to("BerryPhase");

    expect(eq.calculateBattlePower).toHaveReturnedWith(50);
  }, TIMEOUT);
});
