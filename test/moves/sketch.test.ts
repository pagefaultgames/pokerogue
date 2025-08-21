import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { RandomMoveAttr } from "#moves/move";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Sketch", () => {
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
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("Sketch should not fail even if a previous Sketch failed to retrieve a valid move and ran out of PP", async () => {
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);
    const playerPokemon = game.field.getPlayerPokemon();
    // can't use normal moveset override because we need to check moveset changes
    game.move.changeMoveset(playerPokemon, [MoveId.SKETCH, MoveId.SKETCH]);

    game.move.select(MoveId.SKETCH);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
    const moveSlot0 = playerPokemon.getMoveset()[0]!;
    expect(moveSlot0.moveId).toBe(MoveId.SKETCH);
    expect(moveSlot0.getPpRatio()).toBe(0);

    await game.toNextTurn();
    game.move.select(MoveId.SKETCH);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
    expect(playerPokemon.moveset[0]?.moveId).toBe(MoveId.SPLASH);
    expect(playerPokemon.moveset[1]?.moveId).toBe(MoveId.SKETCH);
  });

  it("Sketch should retrieve the most recent valid move from its target history", async () => {
    game.override.enemyStatusEffect(StatusEffect.PARALYSIS);
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);
    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();
    game.move.changeMoveset(playerPokemon, [MoveId.SKETCH, MoveId.GROWL]);

    game.move.select(MoveId.GROWL);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.move.forceStatusActivation(false);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemyPokemon.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);

    await game.toNextTurn();
    game.move.select(MoveId.SKETCH);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.move.forceStatusActivation(true);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
    expect(playerPokemon.moveset[0]?.moveId).toBe(MoveId.SPLASH);
    expect(playerPokemon.moveset[1]?.moveId).toBe(MoveId.GROWL);
  });

  it("should sketch moves that call other moves", async () => {
    const randomMoveAttr = allMoves[MoveId.METRONOME].findAttr(
      attr => attr instanceof RandomMoveAttr,
    ) as RandomMoveAttr;
    vi.spyOn(randomMoveAttr, "getMoveOverride").mockReturnValue(MoveId.FALSE_SWIPE);

    game.override.enemyMoveset([MoveId.METRONOME]);
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);

    const playerPokemon = game.field.getPlayerPokemon();
    game.move.changeMoveset(playerPokemon, MoveId.SKETCH);

    // Opponent uses Metronome -> False Swipe, then player uses Sketch, which should sketch Metronome
    game.move.select(MoveId.SKETCH);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
    expect(playerPokemon.moveset[0]?.moveId).toBe(MoveId.METRONOME);
    expect(playerPokemon.hp).toBeLessThan(playerPokemon.getMaxHp()); // Make sure opponent actually used False Swipe
  });
});
