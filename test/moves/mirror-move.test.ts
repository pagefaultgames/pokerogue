import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { MoveUseMode } from "#enums/move-use-mode";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
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
  });

  it("should use the last move that the target used against it", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

    game.move.use(MoveId.MIRROR_MOVE, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.use(MoveId.MIRROR_MOVE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2);
    await game.move.forceEnemyMove(MoveId.TACKLE, BattlerIndex.PLAYER_2);
    await game.move.forceEnemyMove(MoveId.SWORDS_DANCE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();

    // Feebas copied enemy tackle against it;
    // milotic copied enemy swords dance and used it on itself
    const [feebas, milotic] = game.scene.getPlayerField();
    expect(feebas).toHaveUsedMove({
      move: MoveId.TACKLE,
      targets: [BattlerIndex.ENEMY],
      useMode: MoveUseMode.FOLLOW_UP,
    });
    expect(game.field.getEnemyPokemon()).not.toHaveFullHp();
    expect(milotic).toHaveUsedMove({
      move: MoveId.SWORDS_DANCE,
      targets: [BattlerIndex.PLAYER_2],
      useMode: MoveUseMode.FOLLOW_UP,
    });
    expect(milotic).toHaveStatStage(Stat.ATK, 2);
  });

  it("should apply secondary effects of the called move", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.MIRROR_MOVE);
    await game.move.forceEnemyMove(MoveId.ACID_SPRAY);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();

    expect(game.field.getEnemyPokemon()).toHaveStatStage(Stat.SPDEF, -2);
  });

  it("should fail if the target has not used any moves", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.MIRROR_MOVE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toEndOfTurn();

    expect(game.field.getPlayerPokemon()).toHaveUsedMove({move: MoveId.MIRROR_MOVE, result: MoveResult.FAIL});
  });
});
