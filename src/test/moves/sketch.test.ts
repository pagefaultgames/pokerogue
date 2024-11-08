import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { MoveResult, PokemonMove } from "#app/field/pokemon";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { StatusEffect } from "#app/enums/status-effect";
import { BattlerIndex } from "#app/battle";
import { allMoves, RandomMoveAttr } from "#app/data/move";

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
      .ability(Abilities.BALL_FETCH)
      .battleType("single")
      .disableCrits()
      .enemySpecies(Species.SHUCKLE)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("Sketch should not fail even if a previous Sketch failed to retrieve a valid move and ran out of PP", async () => {
    await game.classicMode.startBattle([ Species.REGIELEKI ]);
    const playerPokemon = game.scene.getPlayerPokemon()!;
    // can't use normal moveset override because we need to check moveset changes
    playerPokemon.moveset = [ new PokemonMove(Moves.SKETCH), new PokemonMove(Moves.SKETCH) ];

    game.move.select(Moves.SKETCH);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
    const moveSlot0 = playerPokemon.getMoveset()[0]!;
    expect(moveSlot0.moveId).toBe(Moves.SKETCH);
    expect(moveSlot0.getPpRatio()).toBe(0);

    await game.toNextTurn();
    game.move.select(Moves.SKETCH);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
    expect(playerPokemon.moveset[0]?.moveId).toBe(Moves.SPLASH);
    expect(playerPokemon.moveset[1]?.moveId).toBe(Moves.SKETCH);
  });

  it("Sketch should retrieve the most recent valid move from its target history", async () => {
    game.override.enemyStatusEffect(StatusEffect.PARALYSIS);
    await game.classicMode.startBattle([ Species.REGIELEKI ]);
    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;
    playerPokemon.moveset = [ new PokemonMove(Moves.SKETCH), new PokemonMove(Moves.GROWL) ];

    game.move.select(Moves.GROWL);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.move.forceStatusActivation(false);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemyPokemon.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);

    await game.toNextTurn();
    game.move.select(Moves.SKETCH);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.move.forceStatusActivation(true);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
    expect(playerPokemon.moveset[0]?.moveId).toBe(Moves.SPLASH);
    expect(playerPokemon.moveset[1]?.moveId).toBe(Moves.GROWL);
  });

  it("should sketch moves that call other moves", async () => {
    const randomMoveAttr = allMoves[Moves.METRONOME].findAttr(attr => attr instanceof RandomMoveAttr) as RandomMoveAttr;
    vi.spyOn(randomMoveAttr, "getMoveOverride").mockReturnValue(Moves.FALSE_SWIPE);

    game.override.enemyMoveset([ Moves.METRONOME ]);
    await game.classicMode.startBattle([ Species.REGIELEKI ]);
    const playerPokemon = game.scene.getPlayerPokemon()!;
    playerPokemon.moveset = [ new PokemonMove(Moves.SKETCH) ];

    // Opponent uses Metronome -> False Swipe, then player uses Sketch, which should sketch Metronome
    game.move.select(Moves.SKETCH);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
    expect(playerPokemon.moveset[0]?.moveId).toBe(Moves.METRONOME);
    expect(playerPokemon.hp).toBeLessThan(playerPokemon.getMaxHp()); // Make sure opponent actually used False Swipe
  });
});
