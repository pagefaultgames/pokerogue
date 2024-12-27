import { Stat } from "#app/enums/stat";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it, expect, vi } from "vitest";

describe("Abilities - Illuminate", () => {
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
      .moveset(Moves.SPLASH)
      .ability(Abilities.ILLUMINATE)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SAND_ATTACK);
  });

  it("should prevent ACC stat stage from being lowered", async () => {
    game.override.battleType("single");

    await game.classicMode.startBattle();

    const player = game.scene.getPlayerPokemon()!;

    expect(player.getStatStage(Stat.ACC)).toBe(0);

    game.move.select(Moves.SPLASH);

    await game.toNextTurn();

    expect(player.getStatStage(Stat.ACC)).toBe(0);
  });

  it("should increase the chance of double battles", async () => {
    game.override
      .moveset(Moves.SPLASH)
      .ability(Abilities.ILLUMINATE)
      .enemySpecies(Species.SUNKERN)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH)
      .startingWave(9);

    vi.spyOn(game.scene, "getDoubleBattleChance");
    await game.classicMode.startBattle();

    game.move.select(Moves.SPLASH);
    await game.doKillOpponents();
    await game.toNextWave();
    expect(game.scene.getDoubleBattleChance).toHaveLastReturnedWith(8);

    game.move.select(Moves.SPLASH);
    await game.doKillOpponents();
    await game.toNextWave();
    expect(game.scene.getDoubleBattleChance).toHaveLastReturnedWith(2);
  });
});
