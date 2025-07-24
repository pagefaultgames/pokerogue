import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import type { Move } from "#moves/move";
import { MoveEffectPhase } from "#phases/move-effect-phase";
import { GameManager } from "#test/test-utils/game-manager";
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
    move = allMoves[MoveId.LAST_RESPECTS];
    basePower = move.power;
    game.override
      .battleStyle("single")
      .criticalHits(false)
      .moveset([MoveId.LAST_RESPECTS, MoveId.EXPLOSION, MoveId.LUNAR_DANCE])
      .ability(AbilityId.BALL_FETCH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(1)
      .enemyLevel(100);

    vi.spyOn(move, "calculateBattlePower");
  });

  it("should have 150 power if 2 allies faint before using move", async () => {
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.CHARMANDER, SpeciesId.SQUIRTLE]);

    /**
     * Bulbasur faints once
     */
    game.move.select(MoveId.EXPLOSION);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    /**
     * Charmander faints once
     */
    game.move.select(MoveId.EXPLOSION);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    game.doSelectPartyPokemon(2);
    await game.toNextTurn();

    game.move.select(MoveId.LAST_RESPECTS);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(move.calculateBattlePower).toHaveReturnedWith(basePower + 2 * 50);
  });

  it("should have 200 power if an ally fainted twice and another one once", async () => {
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.CHARMANDER, SpeciesId.SQUIRTLE]);

    /**
     * Bulbasur faints once
     */
    game.move.select(MoveId.EXPLOSION);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    /**
     * Charmander faints once
     */
    game.doRevivePokemon(1);
    game.move.select(MoveId.EXPLOSION);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    /**
     * Bulbasur faints twice
     */
    game.move.select(MoveId.EXPLOSION);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    game.doSelectPartyPokemon(2);
    await game.toNextTurn();

    game.move.select(MoveId.LAST_RESPECTS);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(move.calculateBattlePower).toHaveReturnedWith(basePower + 3 * 50);
  });

  it("should maintain its power for the player during the next battle if it is within the same arena encounter", async () => {
    game.override
      .enemySpecies(SpeciesId.MAGIKARP)
      .startingWave(1)
      .enemyLevel(1)
      .startingLevel(100)
      .enemyMoveset(MoveId.SPLASH);

    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.CHARMANDER, SpeciesId.SQUIRTLE]);

    /**
     * The first Pokemon faints and another Pokemon in the party is selected.
     */
    game.move.select(MoveId.LUNAR_DANCE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    /**
     * Enemy Pokemon faints and new wave is entered.
     */
    game.move.select(MoveId.LAST_RESPECTS);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextWave();
    expect(game.scene.arena.playerFaints).toBe(1);

    game.move.select(MoveId.LAST_RESPECTS);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEndPhase");
    expect(move.calculateBattlePower).toHaveLastReturnedWith(basePower + 1 * 50);
  });

  it("should reset enemyFaints count on progressing to the next wave.", async () => {
    game.override
      .enemySpecies(SpeciesId.MAGIKARP)
      .startingWave(1)
      .enemyLevel(1)
      .startingLevel(100)
      .enemyMoveset(MoveId.LAST_RESPECTS)
      .moveset([MoveId.LUNAR_DANCE, MoveId.LAST_RESPECTS, MoveId.SPLASH]);

    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.CHARMANDER, SpeciesId.SQUIRTLE]);

    /**
     * The first Pokemon faints and another Pokemon in the party is selected.
     */
    game.move.select(MoveId.LUNAR_DANCE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    /**
     * Enemy Pokemon faints and new wave is entered.
     */
    game.move.select(MoveId.LAST_RESPECTS);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextWave();
    expect(game.scene.currentBattle.enemyFaints).toBe(0);

    game.removeEnemyHeldItems();

    game.move.select(MoveId.LAST_RESPECTS);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(move.calculateBattlePower).toHaveLastReturnedWith(50);
  });

  it("should reset playerFaints count if we enter new trainer battle", async () => {
    game.override.enemySpecies(SpeciesId.MAGIKARP).startingWave(4).enemyLevel(1).startingLevel(100);

    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.CHARMANDER, SpeciesId.SQUIRTLE]);

    game.move.select(MoveId.LUNAR_DANCE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    game.move.select(MoveId.LAST_RESPECTS);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextWave();

    game.move.select(MoveId.LAST_RESPECTS);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(move.calculateBattlePower).toHaveLastReturnedWith(basePower);
  });

  it("should reset playerFaints count if we enter new biome", async () => {
    game.override.enemySpecies(SpeciesId.MAGIKARP).startingWave(10).enemyLevel(1).startingLevel(100);

    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.CHARMANDER, SpeciesId.SQUIRTLE]);

    game.move.select(MoveId.LUNAR_DANCE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    game.move.select(MoveId.LAST_RESPECTS);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextWave();

    game.move.select(MoveId.LAST_RESPECTS);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(move.calculateBattlePower).toHaveLastReturnedWith(basePower);
  });
});
