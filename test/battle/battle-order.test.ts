import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import type { TurnStartPhase } from "#phases/turn-start-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Battle order", () => {
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
      .enemySpecies(SpeciesId.MEWTWO)
      .enemyAbility(AbilityId.INSOMNIA)
      .ability(AbilityId.INSOMNIA)
      .moveset([MoveId.TACKLE]);
  });

  it("opponent faster than player 50 vs 150", async () => {
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();
    vi.spyOn(playerPokemon, "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 50]); // set playerPokemon's speed to 50
    vi.spyOn(enemyPokemon, "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 150]); // set enemyPokemon's speed to 150

    game.move.select(MoveId.TACKLE);
    await game.phaseInterceptor.to("TurnStartPhase", false);

    const playerPokemonIndex = playerPokemon.getBattlerIndex();
    const enemyPokemonIndex = enemyPokemon.getBattlerIndex();
    const phase = game.scene.phaseManager.getCurrentPhase() as TurnStartPhase;
    const order = phase.getCommandOrder();
    expect(order[0]).toBe(enemyPokemonIndex);
    expect(order[1]).toBe(playerPokemonIndex);
  });

  it("Player faster than opponent 150 vs 50", async () => {
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();
    vi.spyOn(playerPokemon, "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 150]); // set playerPokemon's speed to 150
    vi.spyOn(enemyPokemon, "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 50]); // set enemyPokemon's speed to 50

    game.move.select(MoveId.TACKLE);
    await game.phaseInterceptor.to("TurnStartPhase", false);

    const playerPokemonIndex = playerPokemon.getBattlerIndex();
    const enemyPokemonIndex = enemyPokemon.getBattlerIndex();
    const phase = game.scene.phaseManager.getCurrentPhase() as TurnStartPhase;
    const order = phase.getCommandOrder();
    expect(order[0]).toBe(playerPokemonIndex);
    expect(order[1]).toBe(enemyPokemonIndex);
  });

  it("double - both opponents faster than player 50/50 vs 150/150", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.BLASTOISE]);

    const playerPokemon = game.scene.getPlayerField();
    const enemyPokemon = game.scene.getEnemyField();

    playerPokemon.forEach(p => vi.spyOn(p, "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 50])); // set both playerPokemons' speed to 50
    enemyPokemon.forEach(p => vi.spyOn(p, "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 150])); // set both enemyPokemons' speed to 150
    const playerIndices = playerPokemon.map(p => p?.getBattlerIndex());
    const enemyIndices = enemyPokemon.map(p => p?.getBattlerIndex());

    game.move.select(MoveId.TACKLE);
    game.move.select(MoveId.TACKLE, 1);
    await game.phaseInterceptor.to("TurnStartPhase", false);

    const phase = game.scene.phaseManager.getCurrentPhase() as TurnStartPhase;
    const order = phase.getCommandOrder();
    expect(order.slice(0, 2).includes(enemyIndices[0])).toBe(true);
    expect(order.slice(0, 2).includes(enemyIndices[1])).toBe(true);
    expect(order.slice(2, 4).includes(playerIndices[0])).toBe(true);
    expect(order.slice(2, 4).includes(playerIndices[1])).toBe(true);
  });

  it("double - speed tie except 1 - 100/100 vs 100/150", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.BLASTOISE]);

    const playerPokemon = game.scene.getPlayerField();
    const enemyPokemon = game.scene.getEnemyField();
    playerPokemon.forEach(p => vi.spyOn(p, "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 100])); //set both playerPokemons' speed to 100
    vi.spyOn(enemyPokemon[0], "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 100]); // set enemyPokemon's speed to 100
    vi.spyOn(enemyPokemon[1], "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 150]); // set enemyPokemon's speed to 150
    const playerIndices = playerPokemon.map(p => p?.getBattlerIndex());
    const enemyIndices = enemyPokemon.map(p => p?.getBattlerIndex());

    game.move.select(MoveId.TACKLE);
    game.move.select(MoveId.TACKLE, 1);
    await game.phaseInterceptor.to("TurnStartPhase", false);

    const phase = game.scene.phaseManager.getCurrentPhase() as TurnStartPhase;
    const order = phase.getCommandOrder();
    // enemy 2 should be first, followed by some other assortment of the other 3 pokemon
    expect(order[0]).toBe(enemyIndices[1]);
    expect(order.slice(1, 4)).toEqual(expect.arrayContaining([enemyIndices[0], ...playerIndices]));
  });

  it("double - speed tie 100/150 vs 100/150", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.BLASTOISE]);

    const playerPokemon = game.scene.getPlayerField();
    const enemyPokemon = game.scene.getEnemyField();
    vi.spyOn(playerPokemon[0], "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 100]); // set one playerPokemon's speed to 100
    vi.spyOn(playerPokemon[1], "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 150]); // set other playerPokemon's speed to 150
    vi.spyOn(enemyPokemon[0], "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 100]); // set one enemyPokemon's speed to 100
    vi.spyOn(enemyPokemon[1], "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 150]); // set other enemyPokemon's speed to 150
    const playerIndices = playerPokemon.map(p => p?.getBattlerIndex());
    const enemyIndices = enemyPokemon.map(p => p?.getBattlerIndex());

    game.move.select(MoveId.TACKLE);
    game.move.select(MoveId.TACKLE, 1);
    await game.phaseInterceptor.to("TurnStartPhase", false);

    const phase = game.scene.phaseManager.getCurrentPhase() as TurnStartPhase;
    const order = phase.getCommandOrder();
    // P2/E2 should be randomly first/second, then P1/E1 randomly 3rd/4th
    expect(order.slice(0, 2)).toStrictEqual(expect.arrayContaining([playerIndices[1], enemyIndices[1]]));
    expect(order.slice(2, 4)).toStrictEqual(expect.arrayContaining([playerIndices[0], enemyIndices[0]]));
  });
});
