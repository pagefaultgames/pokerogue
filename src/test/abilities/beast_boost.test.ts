import { Stat } from "#enums/stat";
import GameManager from "#test/utils/gameManager";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SPLASH_ONLY } from "../utils/testUtils";
import { EnemyCommandPhase } from "#app/phases/enemy-command-phase";
import { VictoryPhase } from "#app/phases/victory-phase";
import { TurnStartPhase } from "#app/phases/turn-start-phase";
import { BattlerIndex } from "#app/battle";

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

  // Note that both MOXIE and BEAST_BOOST test for their current implementation and not their mainline behavior.
  it("should prefer highest stat to boost its corresponding stat stage by 1 when winning a battle", async() => {
    // SLOWBRO's highest stat is DEF, so it should be picked here
    await game.startBattle([
      Species.SLOWBRO
    ]);

    const playerPokemon = game.scene.getPlayerPokemon()!;

    expect(playerPokemon.getStatStage(Stat.DEF)).toBe(0);

    game.move.select(Moves.FLAMETHROWER);
    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(VictoryPhase);

    expect(playerPokemon.getStatStage(Stat.DEF)).toBe(1);
  }, 20000);

  it("should use in-battle overriden stats when determining the stat stage to raise by 1", async() => {
    // If the opponent can GUARD_SPLIT, SLOWBRO's second highest stat should be SPATK
    game.override.enemyMoveset(new Array(4).fill(Moves.GUARD_SPLIT));

    await game.startBattle([
      Species.SLOWBRO
    ]);

    const playerPokemon = game.scene.getPlayerPokemon()!;

    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(0);

    game.move.select(Moves.FLAMETHROWER);

    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);

    await game.phaseInterceptor.runFrom(TurnStartPhase).to(VictoryPhase);

    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(1);
  }, 20000);

  it("should have order preference in case of stat ties", async() => {
    // Order preference follows the order of EFFECTIVE_STAT
    await game.startBattle([
      Species.SLOWBRO
    ]);

    const playerPokemon = game.scene.getPlayerPokemon()!;

    // Set up tie between SPATK, SPDEF, and SPD, where SPATK should win
    vi.spyOn(playerPokemon, "stats", "get").mockReturnValue([ 10000, 1, 1, 100, 100, 100 ]);

    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(0);

    game.move.select(Moves.FLAMETHROWER);

    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(VictoryPhase);

    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(1);
  }, 20000);
});
