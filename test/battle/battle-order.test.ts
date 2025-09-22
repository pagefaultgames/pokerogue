import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import type { MovePhase } from "#phases/move-phase";
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
    const playerStartHp = playerPokemon.hp;
    const enemyPokemon = game.field.getEnemyPokemon();
    const enemyStartHp = enemyPokemon.hp;

    vi.spyOn(playerPokemon, "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 50]); // set playerPokemon's speed to 50
    vi.spyOn(enemyPokemon, "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 150]); // set enemyPokemon's speed to 150
    game.move.select(MoveId.TACKLE);

    await game.phaseInterceptor.to("MoveEndPhase", false);
    expect(playerPokemon.hp).not.toEqual(playerStartHp);
    expect(enemyPokemon.hp).toEqual(enemyStartHp);
  });

  it("Player faster than opponent 150 vs 50", async () => {
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    const playerPokemon = game.field.getPlayerPokemon();
    const playerStartHp = playerPokemon.hp;
    const enemyPokemon = game.field.getEnemyPokemon();
    const enemyStartHp = enemyPokemon.hp;
    vi.spyOn(playerPokemon, "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 150]); // set playerPokemon's speed to 150
    vi.spyOn(enemyPokemon, "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 50]); // set enemyPokemon's speed to 50

    game.move.select(MoveId.TACKLE);

    await game.phaseInterceptor.to("MoveEndPhase", false);
    expect(playerPokemon.hp).toEqual(playerStartHp);
    expect(enemyPokemon.hp).not.toEqual(enemyStartHp);
  });

  it("double - both opponents faster than player 50/50 vs 150/150", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.BLASTOISE]);

    const playerPokemon = game.scene.getPlayerField();
    const playerHps = playerPokemon.map(p => p.hp);
    const enemyPokemon = game.scene.getEnemyField();
    const enemyHps = enemyPokemon.map(p => p.hp);

    playerPokemon.forEach(p => vi.spyOn(p, "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 50])); // set both playerPokemons' speed to 50
    enemyPokemon.forEach(p => vi.spyOn(p, "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 150])); // set both enemyPokemons' speed to 150

    game.move.select(MoveId.TACKLE);
    game.move.select(MoveId.TACKLE, 1);
    await game.move.selectEnemyMove(MoveId.TACKLE, BattlerIndex.PLAYER);
    await game.move.selectEnemyMove(MoveId.TACKLE, BattlerIndex.PLAYER_2);

    await game.phaseInterceptor.to("MoveEndPhase", true);
    await game.phaseInterceptor.to("MoveEndPhase", false);
    for (let i = 0; i < 2; i++) {
      expect(playerPokemon[i].hp).not.toEqual(playerHps[i]);
      expect(enemyPokemon[i].hp).toEqual(enemyHps[i]);
    }
  });

  it("double - speed tie except 1 - 100/100 vs 100/150", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.BLASTOISE]);

    const playerPokemon = game.scene.getPlayerField();
    const enemyPokemon = game.scene.getEnemyField();
    playerPokemon.forEach(p => vi.spyOn(p, "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 100])); //set both playerPokemons' speed to 100
    vi.spyOn(enemyPokemon[0], "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 100]); // set enemyPokemon's speed to 100
    vi.spyOn(enemyPokemon[1], "stats", "get").mockReturnValue([20, 20, 20, 20, 20, 150]); // set enemyPokemon's speed to 150

    game.move.select(MoveId.TACKLE);
    game.move.select(MoveId.TACKLE, 1);
    await game.phaseInterceptor.to("MovePhase", false);

    const phase = game.scene.phaseManager.getCurrentPhase() as MovePhase;
    expect(phase.pokemon).toEqual(enemyPokemon[1]);
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

    game.move.select(MoveId.TACKLE);
    game.move.select(MoveId.TACKLE, 1);

    await game.phaseInterceptor.to("MovePhase", false);

    const phase = game.scene.phaseManager.getCurrentPhase() as MovePhase;
    expect(enemyPokemon[1] === phase.pokemon || playerPokemon[1] === phase.pokemon);
  });
});
