import { BattlerIndex } from "#app/battle";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Stat } from "#enums/stat";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Beast Boost", () => {
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
      .battleType("single")
      .enemySpecies(Species.BULBASAUR)
      .enemyAbility(Abilities.BEAST_BOOST)
      .ability(Abilities.BEAST_BOOST)
      .startingLevel(2000)
      .moveset([ Moves.FLAMETHROWER ])
      .enemyMoveset(SPLASH_ONLY);
  });

  it("should prefer highest stat to boost its corresponding stat stage by 1 when winning a battle", async() => {
    await game.classicMode.startBattle([Species.SLOWBRO]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    // Set the pokemon's highest stat to DEF, so it should be picked by Beast Boost
    vi.spyOn(playerPokemon, "stats", "get").mockReturnValue([ 10000, 100, 1000, 200, 100, 100 ]);
    console.log(playerPokemon.stats);

    expect(playerPokemon.getStatStage(Stat.DEF)).toBe(0);

    game.move.select(Moves.FLAMETHROWER);
    await game.phaseInterceptor.to("VictoryPhase");

    expect(playerPokemon.getStatStage(Stat.DEF)).toBe(1);
  }, 20000);

  it("should use in-battle overriden stats when determining the stat stage to raise by 1", async() => {
    game.override.enemyMoveset(new Array(4).fill(Moves.GUARD_SPLIT));

    await game.classicMode.startBattle([Species.SLOWBRO]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    // If the opponent uses Guard Split, the pokemon's second highest stat (SPATK) should be chosen
    vi.spyOn(playerPokemon, "stats", "get").mockReturnValue([ 10000, 100, 201, 200, 100, 100 ]);

    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(0);

    game.move.select(Moves.FLAMETHROWER);

    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.phaseInterceptor.to("VictoryPhase");

    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(1);
  }, 20000);

  it("should have order preference in case of stat ties", async() => {
    // Order preference follows the order of EFFECTIVE_STAT
    await game.classicMode.startBattle([Species.SLOWBRO]);

    const playerPokemon = game.scene.getPlayerPokemon()!;

    // Set up tie between SPATK, SPDEF, and SPD, where SPATK should win
    vi.spyOn(playerPokemon, "stats", "get").mockReturnValue([ 10000, 1, 1, 100, 100, 100 ]);

    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(0);

    game.move.select(Moves.FLAMETHROWER);

    await game.phaseInterceptor.to("VictoryPhase");

    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(1);
  }, 20000);
});
