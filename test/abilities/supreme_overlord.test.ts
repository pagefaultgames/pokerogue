import { Moves } from "#app/enums/moves";
import type Move from "#app/data/moves/move";
import { Abilities } from "#enums/abilities";
import { Species } from "#enums/species";
import { BattlerIndex } from "#app/battle";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { allMoves } from "#app/data/moves/move";

describe("Abilities - Supreme Overlord", () => {
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
    move = allMoves[Moves.TACKLE];
    basePower = move.power;
    game = new GameManager(phaserGame);
    game.override
      .battleStyle("single")
      .enemySpecies(Species.MAGIKARP)
      .enemyLevel(100)
      .startingLevel(1)
      .enemyAbility(Abilities.BALL_FETCH)
      .ability(Abilities.SUPREME_OVERLORD)
      .enemyMoveset([Moves.SPLASH])
      .moveset([Moves.TACKLE, Moves.EXPLOSION, Moves.LUNAR_DANCE]);

    vi.spyOn(move, "calculateBattlePower");
  });

  it("should increase Power by 20% if 2 Pokemon are fainted in the party", async () => {
    await game.startBattle([Species.BULBASAUR, Species.CHARMANDER, Species.SQUIRTLE]);

    game.move.select(Moves.EXPLOSION);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    game.move.select(Moves.EXPLOSION);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    game.doSelectPartyPokemon(2);
    await game.toNextTurn();

    game.move.select(Moves.TACKLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(move.calculateBattlePower).toHaveReturnedWith(basePower * 1.2);
  });

  it("should increase Power by 30% if an ally fainted twice and another one once", async () => {
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

    game.move.select(Moves.TACKLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(move.calculateBattlePower).toHaveReturnedWith(basePower * 1.3);
  });

  it("should maintain its power during next battle if it is within the same arena encounter", async () => {
    game.override.enemySpecies(Species.MAGIKARP).startingWave(1).enemyLevel(1).startingLevel(100);

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
    game.move.select(Moves.TACKLE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextWave();

    game.move.select(Moves.TACKLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(move.calculateBattlePower).toHaveLastReturnedWith(basePower * 1.1);
  });

  it("should reset playerFaints count if we enter new trainer battle", async () => {
    game.override.enemySpecies(Species.MAGIKARP).startingWave(4).enemyLevel(1).startingLevel(100);

    await game.classicMode.startBattle([Species.BULBASAUR, Species.CHARMANDER, Species.SQUIRTLE]);

    game.move.select(Moves.LUNAR_DANCE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    game.move.select(Moves.TACKLE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextWave();

    game.move.select(Moves.TACKLE);
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

    game.move.select(Moves.TACKLE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextWave();

    game.move.select(Moves.TACKLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(move.calculateBattlePower).toHaveLastReturnedWith(basePower);
  });
});
