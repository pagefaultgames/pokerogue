import { AbilityId } from "#enums/ability-id";
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
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset([MoveId.TAUNT, MoveId.SPLASH])
      .enemySpecies(SpeciesId.SHUCKLE)
      .moveset([MoveId.GROWL]);
  });

  it("Pokemon should not be able to use Status Moves", async () => {
    await game.classicMode.startBattle(SpeciesId.REGIELEKI);

    const playerPokemon = game.field.getPlayerPokemon();

    // First turn, Player Pokemon succeeds using Growl without Taunt
    game.move.select(MoveId.GROWL);
    await game.move.selectEnemyMove(MoveId.TAUNT);
    await game.toNextTurn();
    const move1 = playerPokemon.getLastXMoves(1)[0]!;
    expect(move1.move).toBe(MoveId.GROWL);
    expect(move1.result).toBe(MoveResult.SUCCESS);
    expect(playerPokemon.getTag(BattlerTagType.TAUNT)).toBeDefined();

    // Second turn, Taunt forces Struggle to occur
    game.move.select(MoveId.GROWL);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();
    const move2 = playerPokemon.getLastXMoves(1)[0]!;
    expect(move2.move).toBe(MoveId.STRUGGLE);
  });

  it("should only lapse once on the turn it cancels its bearer's move", async () => {
    // The enemy outspeeds here, so Taunt lands before the player's already-queued
    // Growl, which then fails via checkTagCancel(TAUNT) on that same turn.
    game.override.enemySpecies(SpeciesId.REGIELEKI);
    await game.classicMode.startBattle(SpeciesId.SHUCKLE);

    const playerPokemon = game.field.getPlayerPokemon();

    game.move.select(MoveId.GROWL);
    await game.move.selectEnemyMove(MoveId.TAUNT);
    await game.toNextTurn();
    expect(playerPokemon.getLastXMoves(1)[0]!.result).toBe(MoveResult.FAIL);
    expect(playerPokemon.getTag(BattlerTagType.TAUNT)?.turnCount).toBe(3);

    // Subsequent turns tick down once each, as they always did
    game.move.select(MoveId.GROWL);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();
    expect(playerPokemon.getTag(BattlerTagType.TAUNT)?.turnCount).toBe(2);
  });
});
