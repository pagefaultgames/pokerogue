import { Moves } from "#enums/moves";
import { BattlerIndex } from "#app/battle";
import { Species } from "#enums/species";
import { Abilities } from "#enums/abilities";
import { MoveResult } from "#app/field/pokemon";
import type Pokemon from "#app/field/pokemon";
import { BerryType } from "#enums/berry-type";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Natural Gift", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  /**
   * Count the number of held items a Pokemon has, accounting for stacks of multiple items.
   */
  function getHeldItemCount(pokemon: Pokemon): number {
    const stackCounts = pokemon.getHeldItems().map(m => m.getStackCount());
    if (stackCounts.length) {
      return stackCounts.reduce((a, b) => a + b);
    } else {
      return 0;
    }
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
      .battleType("single")
      .disableCrits()
      .moveset(Moves.NATURAL_GIFT)
      .ability(Abilities.BALL_FETCH)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemySpecies(Species.RATTATA)
      .enemyMoveset(Moves.SPLASH)
      .startingLevel(10)
      .enemyLevel(100);
  });

  /**
   * There is currently no way to test interaction with heavy rain(Weather), harsh sunlight(Weather) and Powder(Move)
   * since there are currently no berries that change the type to Fire/Water
   */
  it("should deal double damage to Fighting type if Sitrus Berry is consumed", async () => {
    game.override
      .startingHeldItems([
        { name: "BERRY", type: BerryType.SITRUS, count: 3 },
      ])
      .enemySpecies(Species.MACHAMP);

    await game.classicMode.startBattle([ Species.BULBASAUR ]);
    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(Moves.NATURAL_GIFT);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.toNextTurn();

    expect(getHeldItemCount(player)).toBe(2);
    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(2);
  });

  it("should deal half damage to Steel type if Sitrus Berry is consumed", async () => {
    game.override
      .startingHeldItems([
        { name: "BERRY", type: BerryType.SITRUS, count: 3 },
      ])
      .enemySpecies(Species.KLINK);

    await game.classicMode.startBattle([ Species.BULBASAUR ]);
    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(Moves.NATURAL_GIFT);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.toNextTurn();

    expect(getHeldItemCount(player)).toBe(2);
    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(0.5);
  });

  /**
   * Ganlon Berry should turn Natural Gift to Ice type (1/2x dmg to Water type).
   * With Electrify Natural Gift should deal 2x dmg to Water type
   */
  it("should not override Electrify (deal double damage against Water pkm with Ganlon Berry)", async () => {
    game.override
      .startingHeldItems([
        { name: "BERRY", type: BerryType.GANLON, count: 3 },
      ])
      .enemyMoveset(Moves.ELECTRIFY)
      .enemySpecies(Species.MAGIKARP);

    await game.classicMode.startBattle([ Species.BULBASAUR ]);
    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(Moves.NATURAL_GIFT);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.toNextTurn();

    expect(getHeldItemCount(player)).toBe(2);
    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(2);
  });

  it("should fail if no berries are held", async () => {
    game.override
      .startingHeldItems([]);

    await game.classicMode.startBattle([ Species.BULBASAUR ]);
    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(Moves.NATURAL_GIFT);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.toNextTurn();

    expect(player.getLastXMoves(1)[0].result).toBe(MoveResult.FAIL);
  });

  it("should not be affected by Normalize", async () => {
    game.override
      .startingHeldItems([
        { name: "BERRY", type: BerryType.SITRUS, count: 3 },
      ])
      .ability(Abilities.NORMALIZE)
      .enemySpecies(Species.MACHAMP);

    await game.classicMode.startBattle([ Species.BULBASAUR ]);
    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(Moves.NATURAL_GIFT);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.toNextTurn();

    expect(getHeldItemCount(player)).toBe(2);
    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(2);
  });
});
