import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Clear Smog", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({ type: Phaser.HEADLESS });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);

    game.override
      .battleStyle("single")
      .enemySpecies(SpeciesId.RATTATA)
      .enemyLevel(100)
      .enemyMoveset(MoveId.SWORDS_DANCE)
      .enemyAbility(AbilityId.BALL_FETCH)
      .startingLevel(100)
      .ability(AbilityId.BALL_FETCH);
  });

  it("should clear stat changes of target", async () => {
    await game.classicMode.startBattle([SpeciesId.RATTATA]);
    const enemy = game.field.getEnemyPokemon();

    expect(enemy.getStatStage(Stat.ATK)).toBe(0);
    expect(enemy.getStatStage(Stat.ACC)).toBe(0);

    game.move.use(MoveId.SAND_ATTACK);
    await game.toNextTurn();

    expect(enemy).toHaveStatStage(Stat.ATK, 2);
    expect(enemy).toHaveStatStage(Stat.ACC, -1);

    game.move.select(MoveId.CLEAR_SMOG);
    game.override.enemyMoveset(MoveId.SPLASH);
    await game.toNextTurn();

    expect(enemy.getStatStage(Stat.ATK)).toBe(0);
    expect(enemy.getStatStage(Stat.ACC)).toBe(0);
  });

  it("should clear all stat changes even when enemy uses the move", async () => {
    game.override.enemyMoveset(MoveId.SAND_ATTACK);
    await game.classicMode.startBattle([SpeciesId.RATTATA]);
    const user = game.field.getPlayerPokemon();

    game.move.select(MoveId.SWORDS_DANCE);
    await game.toNextTurn();

    expect(user.getStatStage(Stat.ATK)).toBe(2);
    expect(user.getStatStage(Stat.ACC)).toBe(-1);

    game.override.enemyMoveset(MoveId.CLEAR_SMOG);
    game.move.select(MoveId.SAND_ATTACK);
    await game.toNextTurn();

    expect(user.getStatStage(Stat.ATK)).toBe(0);
    expect(user.getStatStage(Stat.ACC)).toBe(0);
  });
});
