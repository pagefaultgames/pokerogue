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

    expect(enemy).toHaveStatStage(Stat.ATK, 0);
    expect(enemy).toHaveStatStage(Stat.ACC, 0);

    game.move.use(MoveId.SAND_ATTACK);
    await game.toNextTurn();

    expect(enemy).toHaveStatStage(Stat.ATK, 2);
    expect(enemy).toHaveStatStage(Stat.ACC, -1);

    game.move.use(MoveId.CLEAR_SMOG);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    expect(enemy).toHaveStatStage(Stat.ATK, 0);
    expect(enemy).toHaveStatStage(Stat.ACC, 0);
  });
});
