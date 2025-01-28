import { Moves } from "#enums/moves";
import { BattlerIndex } from "#app/battle";
import { Species } from "#enums/species";
import { Abilities } from "#enums/abilities";
import GameManager from "#test/utils/gameManager";
import { allMoves } from "#app/data/move";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Last Respects", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  const move = allMoves[Moves.LAST_RESPECTS];
  const basePower = move.power;

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
      .disableCrits()
      .moveset([ Moves.LAST_RESPECTS, Moves.EXPLOSION ])
      .ability(Abilities.BALL_FETCH)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemySpecies(Species.MAGIKARP)
      .enemyMoveset(Moves.SPLASH)
      .startingLevel(1)
      .enemyLevel(100);
  });

  it("should have 150 power if 2 allies faint before using move", async () => {
    await game.startBattle([ Species.BULBASAUR, Species.CHARMANDER, Species.SQUIRTLE ]);

    vi.spyOn(move, "calculateBattlePower");

    /**
     * Bulbasur faints once
     */
    game.move.select(Moves.EXPLOSION);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    /**
     * Charmander faints once
     */
    game.move.select(Moves.EXPLOSION);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    game.doSelectPartyPokemon(2);
    await game.toNextTurn();

    game.move.select(Moves.LAST_RESPECTS);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(move.calculateBattlePower).toHaveReturnedWith(basePower + (2 * 50));
  });

  it("should have 200 power if an ally fainted twice and antoher one once", async () => {
    await game.startBattle([ Species.BULBASAUR, Species.CHARMANDER, Species.SQUIRTLE ]);

    vi.spyOn(move, "calculateBattlePower");

    /**
     * Bulbasur faints once
     */
    game.move.select(Moves.EXPLOSION);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    /**
     * Charmander faints once
     */
    game.doRevivePokemon(1);
    game.move.select(Moves.EXPLOSION);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    /**
     * Bulbasur faints twice
     */
    game.move.select(Moves.EXPLOSION);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    game.doSelectPartyPokemon(2);
    await game.toNextTurn();

    game.move.select(Moves.LAST_RESPECTS);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(move.calculateBattlePower).toHaveReturnedWith(basePower + (3 * 50));
  });

  /**
   * The following 3 tests do not switch out Pokemon 0 after it uses Explosion.
   * The tests get stuck after the SelectModifierPhase.
   */
  it("should maintain its power during next battle if it is within the same arena encounter", async () => {
    game.override
      .enemySpecies(Species.MAGIKARP)
      .startingWave(1)
      .enemyLevel(1)
      .startingLevel(100);

    await game.classicMode.startBattle([ Species.BULBASAUR, Species.CHARMANDER, Species.SQUIRTLE ]);

    /**
     * The first Pokemon faints and another Pokemon in the party is selected.
     * Enemy Pokemon also faints
    */
    game.move.select(Moves.EXPLOSION);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    game.move.select(Moves.LAST_RESPECTS);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(move.calculateBattlePower).toHaveLastReturnedWith(basePower + (1 * 50));
  });

  it.todo("should reset playerFaints count if we enter new trainer battle", async () => {
    game.override
      .enemySpecies(Species.MAGIKARP)
      .startingWave(4)
      .enemyLevel(1)
      .startingLevel(100);

    await game.classicMode.startBattle([ Species.BULBASAUR, Species.CHARMANDER, Species.SQUIRTLE ]);

    game.move.select(Moves.EXPLOSION);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    game.move.select(Moves.LAST_RESPECTS);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(move.calculateBattlePower).toHaveLastReturnedWith(basePower);
  });

  it.todo("should reset playerFaints count if we enter new biome", async () => {
    game.override
      .enemySpecies(Species.MAGIKARP)
      .startingWave(10)
      .enemyLevel(1)
      .startingLevel(100);

    await game.classicMode.startBattle([ Species.BULBASAUR, Species.CHARMANDER, Species.SQUIRTLE ]);

    game.move.select(Moves.EXPLOSION);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    game.move.select(Moves.LAST_RESPECTS);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(move.calculateBattlePower).toHaveLastReturnedWith(basePower);
  });
});
