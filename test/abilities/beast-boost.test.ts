import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
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
      .battleStyle("single")
      .enemySpecies(SpeciesId.BULBASAUR)
      .enemyAbility(AbilityId.BEAST_BOOST)
      .ability(AbilityId.BEAST_BOOST)
      .startingLevel(2000)
      .moveset([MoveId.FLAMETHROWER])
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should prefer highest stat to boost its corresponding stat stage by 1 when winning a battle", async () => {
    await game.classicMode.startBattle([SpeciesId.SLOWBRO]);

    const playerPokemon = game.field.getPlayerPokemon();
    // Set the pokemon's highest stat to DEF, so it should be picked by Beast Boost
    vi.spyOn(playerPokemon, "stats", "get").mockReturnValue([10000, 100, 1000, 200, 100, 100]);
    console.log(playerPokemon.stats);

    expect(playerPokemon.getStatStage(Stat.DEF)).toBe(0);

    game.move.select(MoveId.FLAMETHROWER);
    await game.phaseInterceptor.to("VictoryPhase");

    expect(playerPokemon.getStatStage(Stat.DEF)).toBe(1);
  });

  it("should use in-battle overriden stats when determining the stat stage to raise by 1", async () => {
    game.override.enemyMoveset([MoveId.GUARD_SPLIT]);

    await game.classicMode.startBattle([SpeciesId.SLOWBRO]);

    const playerPokemon = game.field.getPlayerPokemon();
    // If the opponent uses Guard Split, the pokemon's second highest stat (SPATK) should be chosen
    vi.spyOn(playerPokemon, "stats", "get").mockReturnValue([10000, 100, 201, 200, 100, 100]);

    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(0);

    game.move.select(MoveId.FLAMETHROWER);

    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("VictoryPhase");

    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(1);
  });

  it("should have order preference in case of stat ties", async () => {
    // Order preference follows the order of EFFECTIVE_STAT
    await game.classicMode.startBattle([SpeciesId.SLOWBRO]);

    const playerPokemon = game.field.getPlayerPokemon();

    // Set up tie between SPATK, SPDEF, and SPD, where SPATK should win
    vi.spyOn(playerPokemon, "stats", "get").mockReturnValue([10000, 1, 1, 100, 100, 100]);

    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(0);

    game.move.select(MoveId.FLAMETHROWER);

    await game.phaseInterceptor.to("VictoryPhase");

    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(1);
  });
});
