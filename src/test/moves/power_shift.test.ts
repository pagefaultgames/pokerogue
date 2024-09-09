import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import { Stat } from "#app/enums/stat";
import { Abilities } from "#enums/abilities";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Power Shift", () => {
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
      .moveset([Moves.POWER_SHIFT, Moves.BULK_UP])
      .battleType("single")
      .ability(Abilities.BALL_FETCH)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("switches the user's raw Attack stat with its raw Defense stat", async () => {
    await game.classicMode.startBattle([Species.MAGIKARP]);

    const playerPokemon = game.scene.getPlayerPokemon()!;

    playerPokemon.setStat(Stat.ATK, 10, false);
    playerPokemon.setStat(Stat.DEF, 20, false);

    game.move.select(Moves.BULK_UP);

    await game.phaseInterceptor.to("TurnEndPhase");

    // Stat stages are increased by 1
    expect(playerPokemon.getStatStageMultiplier(Stat.ATK)).toBe(1.5);
    expect(playerPokemon.getStatStageMultiplier(Stat.DEF)).toBe(1.5);

    await game.toNextTurn();

    game.move.select(Moves.POWER_SHIFT);

    await game.phaseInterceptor.to("TurnEndPhase");

    // Effective stats are calculated correctly
    expect(playerPokemon.getEffectiveStat(Stat.ATK)).toBe(30);
    expect(playerPokemon.getEffectiveStat(Stat.DEF)).toBe(15);
    // Raw stats are swapped
    expect(playerPokemon.getStat(Stat.ATK, false)).toBe(20);
    expect(playerPokemon.getStat(Stat.DEF, false)).toBe(10);
  }, TIMEOUT);
});
