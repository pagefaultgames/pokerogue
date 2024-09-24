import { EnemyCommandPhase } from "#app/phases/enemy-command-phase";
import { SelectTargetPhase } from "#app/phases/select-target-phase";
import { TurnStartPhase } from "#app/phases/turn-start-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
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
    game.override.battleType("single");
    game.override.enemySpecies(Species.MEWTWO);
    game.override.enemyAbility(Abilities.INSOMNIA);
    game.override.ability(Abilities.INSOMNIA);
    game.override.moveset([Moves.TACKLE]);
  });

  it("opponent faster than player 50 vs 150", async () => {
    await game.startBattle([
      Species.BULBASAUR,
    ]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;
    vi.spyOn(playerPokemon, "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 50]); // set playerPokemon's speed to 50
    vi.spyOn(enemyPokemon, "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 150]); // set enemyPokemon's speed to 150

    game.move.select(Moves.TACKLE);
    await game.phaseInterceptor.run(EnemyCommandPhase);

    const playerPokemonIndex = playerPokemon.getBattlerIndex();
    const enemyPokemonIndex = enemyPokemon.getBattlerIndex();
    const phase = game.scene.getCurrentPhase() as TurnStartPhase;
    const order = phase.getCommandOrder();
    expect(order[0]).toBe(enemyPokemonIndex);
    expect(order[1]).toBe(playerPokemonIndex);
  }, 20000);

  it("Player faster than opponent 150 vs 50", async () => {
    await game.startBattle([
      Species.BULBASAUR,
    ]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;
    vi.spyOn(playerPokemon, "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 150]); // set playerPokemon's speed to 150
    vi.spyOn(enemyPokemon, "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 50]); // set enemyPokemon's speed to 50

    game.move.select(Moves.TACKLE);
    await game.phaseInterceptor.run(EnemyCommandPhase);

    const playerPokemonIndex = playerPokemon.getBattlerIndex();
    const enemyPokemonIndex = enemyPokemon.getBattlerIndex();
    const phase = game.scene.getCurrentPhase() as TurnStartPhase;
    const order = phase.getCommandOrder();
    expect(order[0]).toBe(playerPokemonIndex);
    expect(order[1]).toBe(enemyPokemonIndex);
  }, 20000);

  it("double - both opponents faster than player 50/50 vs 150/150", async () => {
    game.override.battleType("double");
    await game.startBattle([
      Species.BULBASAUR,
      Species.BLASTOISE,
    ]);

    const playerPokemon = game.scene.getPlayerField();
    const enemyPokemon = game.scene.getEnemyField();

    playerPokemon.forEach(p => vi.spyOn(p, "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 50])); // set both playerPokemons' speed to 50
    enemyPokemon.forEach(p => vi.spyOn(p, "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 150])); // set both enemyPokemons' speed to 150
    const playerIndices = playerPokemon.map(p => p?.getBattlerIndex());
    const enemyIndices = enemyPokemon.map(p => p?.getBattlerIndex());

    game.move.select(Moves.TACKLE);
    game.move.select(Moves.TACKLE, 1);
    await game.phaseInterceptor.runFrom(SelectTargetPhase).to(TurnStartPhase, false);

    const phase = game.scene.getCurrentPhase() as TurnStartPhase;
    const order = phase.getCommandOrder();
    expect(order.slice(0, 2).includes(enemyIndices[0])).toBe(true);
    expect(order.slice(0, 2).includes(enemyIndices[1])).toBe(true);
    expect(order.slice(2, 4).includes(playerIndices[0])).toBe(true);
    expect(order.slice(2, 4).includes(playerIndices[1])).toBe(true);
  }, 20000);

  it("double - speed tie except 1 - 100/100 vs 100/150", async () => {
    game.override.battleType("double");
    await game.startBattle([
      Species.BULBASAUR,
      Species.BLASTOISE,
    ]);

    const playerPokemon = game.scene.getPlayerField();
    const enemyPokemon = game.scene.getEnemyField();
    playerPokemon.forEach(p => vi.spyOn(p, "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 100])); //set both playerPokemons' speed to 100
    vi.spyOn(enemyPokemon[0], "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 100]); // set enemyPokemon's speed to 100
    vi.spyOn(enemyPokemon[1], "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 150]); // set enemyPokemon's speed to 150
    const playerIndices = playerPokemon.map(p => p?.getBattlerIndex());
    const enemyIndices = enemyPokemon.map(p => p?.getBattlerIndex());

    game.move.select(Moves.TACKLE);
    game.move.select(Moves.TACKLE, 1);
    await game.phaseInterceptor.runFrom(SelectTargetPhase).to(TurnStartPhase, false);

    const phase = game.scene.getCurrentPhase() as TurnStartPhase;
    const order = phase.getCommandOrder();
    expect(order[0]).toBe(enemyIndices[1]);
    expect(order.slice(1, 4).includes(enemyIndices[0])).toBe(true);
    expect(order.slice(1, 4).includes(playerIndices[0])).toBe(true);
    expect(order.slice(1, 4).includes(playerIndices[1])).toBe(true);
  }, 20000);

  it("double - speed tie 100/150 vs 100/150", async () => {
    game.override.battleType("double");
    await game.startBattle([
      Species.BULBASAUR,
      Species.BLASTOISE,
    ]);

    const playerPokemon = game.scene.getPlayerField();
    const enemyPokemon = game.scene.getEnemyField();
    vi.spyOn(playerPokemon[0], "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 100]); // set one playerPokemon's speed to 100
    vi.spyOn(playerPokemon[1], "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 150]); // set other playerPokemon's speed to 150
    vi.spyOn(enemyPokemon[0], "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 100]); // set one enemyPokemon's speed to 100
    vi.spyOn(enemyPokemon[1], "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 150]); // set other enemyPokemon's speed to 150
    const playerIndices = playerPokemon.map(p => p?.getBattlerIndex());
    const enemyIndices = enemyPokemon.map(p => p?.getBattlerIndex());

    game.move.select(Moves.TACKLE);
    game.move.select(Moves.TACKLE, 1);
    await game.phaseInterceptor.runFrom(SelectTargetPhase).to(TurnStartPhase, false);

    const phase = game.scene.getCurrentPhase() as TurnStartPhase;
    const order = phase.getCommandOrder();
    expect(order.slice(0, 2).includes(playerIndices[1])).toBe(true);
    expect(order.slice(0, 2).includes(enemyIndices[1])).toBe(true);
    expect(order.slice(2, 4).includes(playerIndices[0])).toBe(true);
    expect(order.slice(2, 4).includes(enemyIndices[0])).toBe(true);
  }, 20000);
});
