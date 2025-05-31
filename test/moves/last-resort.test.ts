import { BattlerIndex } from "#app/battle";
import { MoveResult } from "#app/field/pokemon";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Last Resort", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  function expectLastResortFail() {
    expect(game.scene.getPlayerPokemon()?.getLastXMoves()[0]).toEqual(
      expect.objectContaining({
        move: Moves.LAST_RESORT,
        result: MoveResult.FAIL,
      }),
    );
  }
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
      .ability(Abilities.BALL_FETCH)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should fail unless all other moves (excluding itself) has been used at least once", async () => {
    game.override.moveset([Moves.LAST_RESORT, Moves.SPLASH, Moves.GROWL, Moves.GROWTH]);
    await game.classicMode.startBattle([Species.BLISSEY]);

    const blissey = game.scene.getPlayerPokemon()!;
    expect(blissey).toBeDefined();

    // Last resort by itself
    game.move.select(Moves.LAST_RESORT);
    await game.phaseInterceptor.to("TurnEndPhase");
    expectLastResortFail();

    // Splash (1/3)
    blissey.pushMoveHistory({ move: Moves.SPLASH, targets: [BattlerIndex.PLAYER] });
    game.move.select(Moves.LAST_RESORT);
    await game.phaseInterceptor.to("TurnEndPhase");
    expectLastResortFail();

    // Growl (2/3)
    blissey.pushMoveHistory({ move: Moves.GROWL, targets: [BattlerIndex.ENEMY] });
    game.move.select(Moves.LAST_RESORT);
    await game.phaseInterceptor.to("TurnEndPhase");
    expectLastResortFail(); // Were last resort itself counted, it would error here

    // Growth (3/3)
    blissey.pushMoveHistory({ move: Moves.GROWTH, targets: [BattlerIndex.PLAYER] });
    game.move.select(Moves.LAST_RESORT);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(game.scene.getPlayerPokemon()?.getLastXMoves()[0]).toEqual(
      expect.objectContaining({
        move: Moves.LAST_RESORT,
        result: MoveResult.SUCCESS,
      }),
    );
  });

  it("should disregard virtually invoked moves", async () => {
    game.override
      .moveset([Moves.LAST_RESORT, Moves.SWORDS_DANCE, Moves.ABSORB, Moves.MIRROR_MOVE])
      .enemyMoveset([Moves.SWORDS_DANCE, Moves.ABSORB])
      .ability(Abilities.DANCER)
      .enemySpecies(Species.ABOMASNOW); // magikarp has 50% chance to be okho'd on absorb crit
    await game.classicMode.startBattle([Species.BLISSEY]);

    // use mirror move normally to trigger absorb virtually
    game.move.select(Moves.MIRROR_MOVE);
    await game.move.selectEnemyMove(Moves.ABSORB);
    await game.toNextTurn();

    game.move.select(Moves.LAST_RESORT);
    await game.move.selectEnemyMove(Moves.SWORDS_DANCE); // goes first to proc dancer ahead of time
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("TurnEndPhase");
    expectLastResortFail();
  });

  it("should fail if no other moves in moveset", async () => {
    game.override.moveset(Moves.LAST_RESORT);
    await game.classicMode.startBattle([Species.BLISSEY]);

    game.move.select(Moves.LAST_RESORT);
    await game.phaseInterceptor.to("TurnEndPhase");

    expectLastResortFail();
  });

  it("should work if invoked virtually when all other moves have been used", async () => {
    game.override.moveset([Moves.LAST_RESORT, Moves.SLEEP_TALK]).ability(Abilities.COMATOSE);
    await game.classicMode.startBattle([Species.KOMALA]);

    game.move.select(Moves.SLEEP_TALK);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.scene.getPlayerPokemon()?.getLastXMoves(-1)).toEqual([
      expect.objectContaining({
        move: Moves.LAST_RESORT,
        result: MoveResult.SUCCESS,
        virtual: true,
      }),
      expect.objectContaining({
        move: Moves.SLEEP_TALK,
        result: MoveResult.SUCCESS,
      }),
    ]);
  });

  it("should preserve usability status on reload", async () => {
    game.override.moveset([Moves.LAST_RESORT, Moves.SPLASH]).ability(Abilities.COMATOSE);
    await game.classicMode.startBattle([Species.BLISSEY]);

    game.move.select(Moves.SPLASH);
    await game.doKillOpponents();
    await game.toNextWave();

    const oldMoveHistory = game.scene.getPlayerPokemon()?.summonData.moveHistory;
    await game.reload.reloadSession();

    const newMoveHistory = game.scene.getPlayerPokemon()?.summonData.moveHistory;
    expect(oldMoveHistory).toEqual(newMoveHistory);

    // use last resort and it should kill the karp just fine
    game.move.select(Moves.LAST_RESORT);
    game.scene.getEnemyPokemon()!.hp = 1;
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.isVictory()).toBe(true);
  });

  it("should fail if used while not in moveset", async () => {
    game.override.moveset(Moves.MIRROR_MOVE).enemyMoveset([Moves.ABSORB, Moves.LAST_RESORT]);
    await game.classicMode.startBattle([Species.BLISSEY]);

    // ensure enemy last resort succeeds
    game.move.select(Moves.MIRROR_MOVE);
    await game.move.selectEnemyMove(Moves.ABSORB);
    await game.phaseInterceptor.to("TurnEndPhase");
    game.move.select(Moves.MIRROR_MOVE);
    await game.move.selectEnemyMove(Moves.LAST_RESORT);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("TurnEndPhase");

    expectLastResortFail();
  });
});
