import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Taunt", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .battleStyle("single")
      .ability(AbilityId.BALL_FETCH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.SHUCKLE);
  });

  it("should prevent the target from selecting status moves for 4 turns", async () => {
    await game.classicMode.startBattle(SpeciesId.REGIELEKI);

    const player = game.field.getPlayerPokemon();

    game.move.use(MoveId.GROWL);
    await game.move.forceEnemyMove(MoveId.TAUNT);
    await game.toNextTurn();

    expect(player).toHaveBattlerTag({ tagType: BattlerTagType.TAUNT, turnCount: 4 });

    expect(player.isMoveSelectable(MoveId.GROWL)[0]).toBe(false);
    // TODO: Does Taunt actually make the moves unusable?

    // since growl is the only thing in our moveset, we should be forced to use struggle
    game.move.use(MoveId.GROWL);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toEndOfTurn();

    expect(player).toHaveBattlerTag({ tagType: BattlerTagType.TAUNT, turnCount: 3 });
    expect(player).toHaveUsedMove(MoveId.STRUGGLE);
  });

  it("should only tick down once on the turn it cancels the target's move", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);
    const player = game.field.getPlayerPokemon();

    game.move.use(MoveId.GROWL);
    await game.move.selectEnemyMove(MoveId.TAUNT);
    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(player).toHaveUsedMove({ move: MoveId.NONE, result: MoveResult.FAIL });
    expect(player).toHaveBattlerTag({ tagType: BattlerTagType.TAUNT, turnCount: 3 });

    // Subsequent turns tick down once each, as they always did
    game.move.use(MoveId.GROWL);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toEndOfTurn();

    expect(player).toHaveBattlerTag({ tagType: BattlerTagType.TAUNT, turnCount: 2 });
  });

  // TODO: Clarify behavior with Instruct
});
