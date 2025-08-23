import { AbilityId } from "#enums/ability-id";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Imprison", () => {
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
      .battleStyle("single")
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset([MoveId.IMPRISON, MoveId.SPLASH, MoveId.GROWL])
      .enemySpecies(SpeciesId.SHUCKLE)
      .moveset([MoveId.TRANSFORM, MoveId.SPLASH]);
  });

  it("Pokemon under Imprison cannot use shared moves", async () => {
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);

    const playerPokemon = game.field.getPlayerPokemon();

    game.move.select(MoveId.TRANSFORM);
    await game.move.selectEnemyMove(MoveId.IMPRISON);
    await game.toNextTurn();
    const playerMoveset = playerPokemon.getMoveset().map(x => x?.moveId);
    const enemyMoveset = game.scene
      .getEnemyPokemon()!
      .getMoveset()
      .map(x => x?.moveId);
    expect(enemyMoveset.includes(playerMoveset[0])).toBeTruthy();
    const imprisonArenaTag = game.scene.arena.getTag(ArenaTagType.IMPRISON);
    const imprisonBattlerTag = playerPokemon.getTag(BattlerTagType.IMPRISON);
    expect(imprisonArenaTag).toBeDefined();
    expect(imprisonBattlerTag).toBeDefined();

    // Second turn, Imprison forces Struggle to occur
    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();
    const move1 = playerPokemon.getLastXMoves(1)[0]!;
    expect(move1.move).toBe(MoveId.STRUGGLE);
  });

  it("Imprison applies to Pokemon switched into Battle", async () => {
    await game.classicMode.startBattle([SpeciesId.REGIELEKI, SpeciesId.BULBASAUR]);

    const playerPokemon1 = game.field.getPlayerPokemon();

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.IMPRISON);
    await game.toNextTurn();
    const imprisonArenaTag = game.scene.arena.getTag(ArenaTagType.IMPRISON);
    const imprisonBattlerTag1 = playerPokemon1.getTag(BattlerTagType.IMPRISON);
    expect(imprisonArenaTag).toBeDefined();
    expect(imprisonBattlerTag1).toBeDefined();

    // Second turn, Imprison forces Struggle to occur
    game.doSwitchPokemon(1);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();
    const playerPokemon2 = game.field.getPlayerPokemon();
    const imprisonBattlerTag2 = playerPokemon2.getTag(BattlerTagType.IMPRISON);
    expect(playerPokemon1).not.toEqual(playerPokemon2);
    expect(imprisonBattlerTag2).toBeDefined();
  });

  it("The effects of Imprison only end when the source is no longer active", async () => {
    game.override.moveset([MoveId.SPLASH, MoveId.IMPRISON]);
    await game.classicMode.startBattle([SpeciesId.REGIELEKI, SpeciesId.BULBASAUR]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();
    game.move.select(MoveId.IMPRISON);
    await game.move.selectEnemyMove(MoveId.GROWL);
    await game.toNextTurn();
    expect(game.scene.arena.getTag(ArenaTagType.IMPRISON)).toBeDefined();
    expect(enemyPokemon.getTag(BattlerTagType.IMPRISON)).toBeDefined();
    game.doSwitchPokemon(1);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();
    expect(playerPokemon.isActive(true)).toBeFalsy();
    expect(game.scene.arena.getTag(ArenaTagType.IMPRISON)).toBeUndefined();
    expect(enemyPokemon.getTag(BattlerTagType.IMPRISON)).toBeUndefined();
  });
});
