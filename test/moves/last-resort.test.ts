import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { MoveUseMode } from "#enums/move-use-mode";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Last Resort", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  function expectLastResortFail() {
    expect(game.field.getPlayerPokemon().getLastXMoves()[0]).toEqual(
      expect.objectContaining({
        move: MoveId.LAST_RESORT,
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
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should fail unless all other moves (excluding itself) has been used at least once", async () => {
    game.override.moveset([MoveId.LAST_RESORT, MoveId.SPLASH, MoveId.GROWL, MoveId.GROWTH]);
    await game.classicMode.startBattle([SpeciesId.BLISSEY]);

    const blissey = game.field.getPlayerPokemon();
    expect(blissey).toBeDefined();

    // Last resort by itself
    game.move.select(MoveId.LAST_RESORT);
    await game.phaseInterceptor.to("TurnEndPhase");
    expectLastResortFail();

    // Splash (1/3)
    blissey.pushMoveHistory({ move: MoveId.SPLASH, targets: [BattlerIndex.PLAYER], useMode: MoveUseMode.NORMAL });
    game.move.select(MoveId.LAST_RESORT);
    await game.phaseInterceptor.to("TurnEndPhase");
    expectLastResortFail();

    // Growl (2/3)
    blissey.pushMoveHistory({ move: MoveId.GROWL, targets: [BattlerIndex.ENEMY], useMode: MoveUseMode.NORMAL });
    game.move.select(MoveId.LAST_RESORT);
    await game.phaseInterceptor.to("TurnEndPhase");
    expectLastResortFail(); // Were last resort itself counted, it would error here

    // Growth (3/3)
    blissey.pushMoveHistory({ move: MoveId.GROWTH, targets: [BattlerIndex.PLAYER], useMode: MoveUseMode.NORMAL });
    game.move.select(MoveId.LAST_RESORT);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(game.field.getPlayerPokemon().getLastXMoves()[0]).toEqual(
      expect.objectContaining({
        move: MoveId.LAST_RESORT,
        result: MoveResult.SUCCESS,
      }),
    );
  });

  it("should disregard virtually invoked moves", async () => {
    game.override
      .moveset([MoveId.LAST_RESORT, MoveId.SWORDS_DANCE, MoveId.ABSORB, MoveId.MIRROR_MOVE])
      .enemyMoveset([MoveId.SWORDS_DANCE, MoveId.ABSORB])
      .ability(AbilityId.DANCER)
      .enemySpecies(SpeciesId.ABOMASNOW); // magikarp has 50% chance to be okho'd on absorb crit
    await game.classicMode.startBattle([SpeciesId.BLISSEY]);

    // use mirror move normally to trigger absorb virtually
    game.move.select(MoveId.MIRROR_MOVE);
    await game.move.selectEnemyMove(MoveId.ABSORB);
    await game.toNextTurn();

    game.move.select(MoveId.LAST_RESORT);
    await game.move.selectEnemyMove(MoveId.SWORDS_DANCE); // goes first to proc dancer ahead of time
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("TurnEndPhase");
    expectLastResortFail();
  });

  it("should fail if no other moves in moveset", async () => {
    game.override.moveset(MoveId.LAST_RESORT);
    await game.classicMode.startBattle([SpeciesId.BLISSEY]);

    game.move.select(MoveId.LAST_RESORT);
    await game.phaseInterceptor.to("TurnEndPhase");

    expectLastResortFail();
  });

  it("should work if invoked virtually when all other moves have been used", async () => {
    game.override.moveset([MoveId.LAST_RESORT, MoveId.SLEEP_TALK]).ability(AbilityId.COMATOSE);
    await game.classicMode.startBattle([SpeciesId.KOMALA]);

    game.move.select(MoveId.SLEEP_TALK);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.field.getPlayerPokemon().getLastXMoves(-1)).toEqual([
      expect.objectContaining({
        move: MoveId.LAST_RESORT,
        result: MoveResult.SUCCESS,
        useMode: MoveUseMode.FOLLOW_UP,
      }),
      expect.objectContaining({
        move: MoveId.SLEEP_TALK,
        result: MoveResult.SUCCESS,
        useMode: MoveUseMode.NORMAL,
      }),
    ]);
  });

  it("should preserve usability status on reload", async () => {
    game.override.moveset([MoveId.LAST_RESORT, MoveId.SPLASH]).ability(AbilityId.COMATOSE);
    await game.classicMode.startBattle([SpeciesId.BLISSEY]);

    game.move.select(MoveId.SPLASH);
    await game.doKillOpponents();
    await game.toNextWave();

    const oldMoveHistory = game.field.getPlayerPokemon().summonData.moveHistory;
    await game.reload.reloadSession();

    const newMoveHistory = game.field.getPlayerPokemon().summonData.moveHistory;
    expect(oldMoveHistory).toEqual(newMoveHistory);

    // use last resort and it should kill the karp just fine
    game.move.select(MoveId.LAST_RESORT);
    game.field.getEnemyPokemon().hp = 1;
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.isVictory()).toBe(true);
  });

  it("should fail if used while not in moveset", async () => {
    game.override.moveset(MoveId.MIRROR_MOVE).enemyMoveset([MoveId.ABSORB, MoveId.LAST_RESORT]);
    await game.classicMode.startBattle([SpeciesId.BLISSEY]);

    // ensure enemy last resort succeeds
    game.move.select(MoveId.MIRROR_MOVE);
    await game.move.selectEnemyMove(MoveId.ABSORB);
    await game.phaseInterceptor.to("TurnEndPhase");
    game.move.select(MoveId.MIRROR_MOVE);
    await game.move.selectEnemyMove(MoveId.LAST_RESORT);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("TurnEndPhase");

    expectLastResortFail();
  });
});
