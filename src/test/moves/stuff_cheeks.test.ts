import { Stat } from "#enums/stat";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Abilities } from "#enums/abilities";
import Pokemon from "#app/field/pokemon";
import { allMoves, RandomMoveAttr } from "#app/data/move";
import { BerryType } from "#enums/berry-type";
import { BattlerIndex } from "#app/battle";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Stuff Cheeks", () => {
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
      .moveset(Moves.STUFF_CHEEKS)
      .ability(Abilities.BALL_FETCH)
      .enemySpecies(Species.RATTATA)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should succeed if berries are held", async () => {
    game.override
      .startingHeldItems([
        { name: "BERRY", type: BerryType.SITRUS, count: 1 },
      ]);

    await game.classicMode.startBattle([ Species.BULBASAUR ]);

    const player = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.STUFF_CHEEKS);

    await game.toNextTurn();

    expect(player.getStatStage(Stat.DEF)).toBe(2);
    expect(getHeldItemCount(player)).toBe(0);
  });

  it("should fail if no berries are held", async () => {

    await game.classicMode.startBattle([ Species.BULBASAUR ]);

    const player = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.STUFF_CHEEKS);

    await game.toNextTurn();

    expect(player.getStatStage(Stat.DEF)).toBe(0);
    expect(getHeldItemCount(player)).toBe(0);
  });

  it("should succeed when called in the presence of unnerved", async () => {
    game.override
      .startingHeldItems([
        { name: "BERRY", type: BerryType.SITRUS, count: 2 },
        { name: "BERRY", type: BerryType.LUM, count: 2 },
      ])
      .enemyAbility(Abilities.UNNERVE);

    await game.classicMode.startBattle([ Species.BULBASAUR ]);

    const player = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.STUFF_CHEEKS);

    await game.toNextTurn();

    expect(player.getStatStage(Stat.DEF)).toBe(2);
    expect(getHeldItemCount(player)).toBe(3);
  });

  it("should succeed when called in the presence of magic room", async () => {
    game.override
      .startingHeldItems([
        { name: "BERRY", type: BerryType.SITRUS, count: 2 },
        { name: "BERRY", type: BerryType.LUM, count: 2 },
      ])
      .enemyMoveset(Moves.MAGIC_ROOM);

    await game.classicMode.startBattle([ Species.BULBASAUR ]);

    const player = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.STUFF_CHEEKS);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);

    await game.toNextTurn();

    expect(player.getStatStage(Stat.DEF)).toBe(2);
    expect(getHeldItemCount(player)).toBe(3);
  });

  it("should failed when called by another move (metronome) while holding no berries", async () => {
    game.override.moveset(Moves.METRONOME);

    const randomMoveAttr = allMoves[Moves.METRONOME].findAttr(attr => attr instanceof RandomMoveAttr) as RandomMoveAttr;
    vi.spyOn(randomMoveAttr, "getMoveOverride").mockReturnValue(Moves.STUFF_CHEEKS);

    await game.classicMode.startBattle([ Species.BULBASAUR ]);

    const player = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.METRONOME);

    await game.toNextTurn();

    expect(player.getStatStage(Stat.DEF)).toBe(0);
  });

  it("should succeed when called by another move (metronome) while holding berries", async () => {
    game.override
      .moveset(Moves.METRONOME)
      .startingHeldItems([
        { name: "BERRY", type: BerryType.SITRUS, count: 2 },
        { name: "BERRY", type: BerryType.LUM, count: 2 },
      ]);

    const randomMoveAttr = allMoves[Moves.METRONOME].findAttr(attr => attr instanceof RandomMoveAttr) as RandomMoveAttr;
    vi.spyOn(randomMoveAttr, "getMoveOverride").mockReturnValue(Moves.STUFF_CHEEKS);

    await game.classicMode.startBattle([ Species.BULBASAUR ]);

    const player = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.METRONOME);

    await game.toNextTurn();

    expect(player.getStatStage(Stat.DEF)).toBe(2);
    expect(getHeldItemCount(player)).toBe(3);
  });

  // Can be enabled when Knock off correctly knocks off the held berry
  it.todo("should fail when used after berries getting knocked off", async () => {
    game.override.startingWave(5)
      .startingHeldItems([
        { name: "BERRY", type: BerryType.SITRUS, count: 1 },
      ])
      .enemyMoveset(Moves.KNOCK_OFF);

    await game.classicMode.startBattle([ Species.BULBASAUR ]);

    const player = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.STUFF_CHEEKS);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);

    await game.toNextTurn();

    expect(getHeldItemCount(player)).toBe(0);
    expect(player.getStatStage(Stat.DEF)).toBe(0);
  });
});
