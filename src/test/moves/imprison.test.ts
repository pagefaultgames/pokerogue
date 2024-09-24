import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import { Abilities } from "#enums/abilities";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { ArenaTagType } from "#app/enums/arena-tag-type";

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
      .battleType("single")
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset([Moves.IMPRISON, Moves.SPLASH, Moves.GROWL])
      .enemySpecies(Species.SHUCKLE)
      .moveset([Moves.TRANSFORM, Moves.SPLASH]);
  });

  it("Pokemon under Imprison cannot use shared moves", async () => {
    await game.classicMode.startBattle([Species.REGIELEKI]);

    const playerPokemon = game.scene.getPlayerPokemon();

    game.move.select(Moves.TRANSFORM);
    await game.forceEnemyMove(Moves.IMPRISON);
    await game.toNextTurn();
    const playerMoveset = playerPokemon!.getMoveset().map(x => x?.moveId);
    const enemyMoveset = game.scene.getEnemyPokemon()!.getMoveset().map(x => x?.moveId);
    expect(enemyMoveset.includes(playerMoveset[0])).toBeTruthy();
    const imprisonArenaTag = game.scene.arena.getTag(ArenaTagType.IMPRISON);
    const imprisonBattlerTag = playerPokemon!.getTag(BattlerTagType.IMPRISON);
    expect(imprisonArenaTag).toBeDefined();
    expect(imprisonBattlerTag).toBeDefined();

    // Second turn, Imprison forces Struggle to occur
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();
    const move1 = playerPokemon?.getLastXMoves(1)[0]!;
    expect(move1.move).toBe(Moves.STRUGGLE);
  });

  it("Imprison applies to Pokemon switched into Battle", async () => {
    game.override.battleType("single");
    await game.classicMode.startBattle([Species.REGIELEKI, Species.BULBASAUR]);

    const playerPokemon1 = game.scene.getPlayerPokemon();

    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.IMPRISON);
    await game.toNextTurn();
    const imprisonArenaTag = game.scene.arena.getTag(ArenaTagType.IMPRISON);
    const imprisonBattlerTag1 = playerPokemon1!.getTag(BattlerTagType.IMPRISON);
    expect(imprisonArenaTag).toBeDefined();
    expect(imprisonBattlerTag1).toBeDefined();

    // Second turn, Imprison forces Struggle to occur
    game.doSwitchPokemon(1);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();
    const playerPokemon2 = game.scene.getPlayerPokemon();
    const imprisonBattlerTag2 = playerPokemon2!.getTag(BattlerTagType.IMPRISON);
    expect(playerPokemon1).not.toEqual(playerPokemon2);
    expect(imprisonBattlerTag2).toBeDefined();
  });

  it("The effects of Imprison only end when the source is no longer active", async () => {
    game.override.battleType("single");
    game.override.moveset([Moves.SPLASH, Moves.IMPRISON]);
    await game.classicMode.startBattle([Species.REGIELEKI, Species.BULBASAUR]);

    const playerPokemon = game.scene.getPlayerPokemon();
    const enemyPokemon = game.scene.getEnemyPokemon();
    game.move.select(Moves.IMPRISON);
    await game.forceEnemyMove(Moves.IMPRISON);
    await game.toNextTurn();
    expect(game.scene.arena.getTag(ArenaTagType.IMPRISON)).toBeDefined();
    expect(enemyPokemon!.getTag(BattlerTagType.IMPRISON)).toBeDefined();
    game.doSwitchPokemon(1);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();
    expect(playerPokemon?.isActive(true)).toBeFalsy();
    expect(enemyPokemon!.getTag(BattlerTagType.IMPRISON)).toBeUndefined();
  });
});
