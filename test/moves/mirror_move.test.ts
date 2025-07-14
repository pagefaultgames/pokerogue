import { BattlerIndex } from "#enums/battler-index";
import { Stat } from "#app/enums/stat";
import { MoveResult } from "#enums/move-result";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Mirror Move", () => {
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
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should use the last move that the target used against any pokemon", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MAGIKARP]);

    game.move.use(MoveId.MIRROR_MOVE, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.use(MoveId.SWORDS_DANCE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2);
    await game.move.forceEnemyMove(MoveId.TACKLE, BattlerIndex.PLAYER_2);
    await game.move.forceEnemyMove(MoveId.SWORDS_DANCE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    const [feebas, magikarp] = game.scene.getPlayerField();
    expect(feebas.getLastXMoves()[0].move).toBe(MoveId.TACKLE);
    expect(magikarp.getLastXMoves()[0].move).toBe(MoveId.SWORDS_DANCE);
  });

  it("should apply secondary effects of the called move", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.MIRROR_MOVE);
    await game.move.forceEnemyMove(MoveId.ACID_SPRAY);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(game.field.getEnemyPokemon().getStatStage(Stat.SPDEF)).toBe(-2);
  });

  it("should fail if the target has not used any moves", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.MIRROR_MOVE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    expect(game.field.getPlayerPokemon().getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });
});
