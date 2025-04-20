import { Moves } from "#enums/moves";
import { BattlerIndex } from "#app/battle";
import { Species } from "#enums/species";
import { Abilities } from "#enums/abilities";
import GameManager from "#test/testUtils/gameManager";
import { allMoves } from "#app/data/moves/move";
import type Move from "#app/data/moves/move";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Last Respects", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  let move: Move;
  let basePower: number;

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
    move = allMoves[Moves.LAST_RESPECTS];
    basePower = move.power;
    game.override
      .battleStyle("single")
      .disableCrits()
      .moveset([Moves.LAST_RESPECTS, Moves.EXPLOSION, Moves.LUNAR_DANCE])
      .ability(Abilities.BALL_FETCH)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemySpecies(Species.MAGIKARP)
      .enemyMoveset(Moves.SPLASH)
      .startingLevel(1)
      .enemyLevel(100);

    vi.spyOn(move, "calculateBattlePower");
  });

  it("should have 150 power if 2 allies faint before using move", async () => {
    await game.classicMode.startBattle([Species.BULBASAUR, Species.CHARMANDER, Species.SQUIRTLE]);

    /**
     * Bulbasur faints once
     */
    game.move.select(Moves.EXPLOSION);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    /**
     * Charmander faints once
     */
    game.move.select(Moves.EXPLOSION);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    game.doSelectPartyPokemon(2);
    await game.toNextTurn();

    game.move.select(Moves.LAST_RESPECTS);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(move.calculateBattlePower).toHaveReturnedWith(basePower + 2 * 50);
  });

  it("should have 200 power if an ally fainted twice and another one once", async () => {
    await game.classicMode.startBattle([Species.BULBASAUR, Species.CHARMANDER, Species.SQUIRTLE]);

    /**
     * Bulbasur faints once
     */
    game.move.select(Moves.EXPLOSION);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    /**
     * Charmander faints once
     */
    game.doRevivePokemon(1);
    game.move.select(Moves.EXPLOSION);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    /**
     * Bulbasur faints twice
     */
    game.move.select(Moves.EXPLOSION);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    game.doSelectPartyPokemon(2);
    await game.toNextTurn();

    game.move.select(Moves.LAST_RESPECTS);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(move.calculateBattlePower).toHaveReturnedWith(basePower + 3 * 50);
  });

  it("should maintain its power for the player during the next battle if it is within the same arena encounter", async () => {
    game.override
      .enemySpecies(Species.MAGIKARP)
      .startingWave(1)
      .enemyLevel(1)
      .startingLevel(100)
      .enemyMoveset(Moves.SPLASH);

    await game.classicMode.startBattle([Species.BULBASAUR, Species.CHARMANDER, Species.SQUIRTLE]);

    /**
     * The first Pokemon faints and another Pokemon in the party is selected.
     */
    game.move.select(Moves.LUNAR_DANCE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    /**
     * Enemy Pokemon faints and new wave is entered.
     */
    game.move.select(Moves.LAST_RESPECTS);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextWave();
    expect(game.scene.arena.playerFaints).toBe(1);

    game.move.select(Moves.LAST_RESPECTS);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEndPhase");
    expect(move.calculateBattlePower).toHaveLastReturnedWith(basePower + 1 * 50);
  });

  it("should reset enemyFaints count on progressing to the next wave.", async () => {
    game.override
      .enemySpecies(Species.MAGIKARP)
      .startingWave(1)
      .enemyLevel(1)
      .startingLevel(100)
      .enemyMoveset(Moves.LAST_RESPECTS)
      .moveset([Moves.LUNAR_DANCE, Moves.LAST_RESPECTS, Moves.SPLASH]);

    await game.classicMode.startBattle([Species.BULBASAUR, Species.CHARMANDER, Species.SQUIRTLE]);

    /**
     * The first Pokemon faints and another Pokemon in the party is selected.
     */
    game.move.select(Moves.LUNAR_DANCE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    /**
     * Enemy Pokemon faints and new wave is entered.
     */
    game.move.select(Moves.LAST_RESPECTS);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextWave();
    expect(game.scene.currentBattle.enemyFaints).toBe(0);

    game.move.select(Moves.LAST_RESPECTS);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("MoveEndPhase");
    expect(move.calculateBattlePower).toHaveLastReturnedWith(basePower);
  });

  it("should reset playerFaints count if we enter new trainer battle", async () => {
    game.override.enemySpecies(Species.MAGIKARP).startingWave(4).enemyLevel(1).startingLevel(100);

    await game.classicMode.startBattle([Species.BULBASAUR, Species.CHARMANDER, Species.SQUIRTLE]);

    game.move.select(Moves.LUNAR_DANCE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    game.move.select(Moves.LAST_RESPECTS);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextWave();

    game.move.select(Moves.LAST_RESPECTS);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(move.calculateBattlePower).toHaveLastReturnedWith(basePower);
  });

  it("should reset playerFaints count if we enter new biome", async () => {
    game.override.enemySpecies(Species.MAGIKARP).startingWave(10).enemyLevel(1).startingLevel(100);

    await game.classicMode.startBattle([Species.BULBASAUR, Species.CHARMANDER, Species.SQUIRTLE]);

    game.move.select(Moves.LUNAR_DANCE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    game.move.select(Moves.LAST_RESPECTS);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextWave();

    game.move.select(Moves.LAST_RESPECTS);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(move.calculateBattlePower).toHaveLastReturnedWith(basePower);
  });
});
