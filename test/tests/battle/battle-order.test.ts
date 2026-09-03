import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import type { MovePhase } from "#phases/move-phase";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// TODO: rework tests eventually once a helper to assert move order is added
describe("Battle order", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
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
    await game.classicMode.startBattle(SpeciesId.BULBASAUR);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();
    playerPokemon.setStat(Stat.SPD, 50);
    enemyPokemon.setStat(Stat.SPD, 150);

    game.move.select(MoveId.TACKLE);
    await game.phaseInterceptor.to("MoveEndPhase", false);

    expect(playerPokemon).not.toHaveFullHp();
    expect(enemyPokemon).toHaveFullHp();
  });

  it("Player faster than opponent 150 vs 50", async () => {
    await game.classicMode.startBattle(SpeciesId.BULBASAUR);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();
    playerPokemon.setStat(Stat.SPD, 150);
    enemyPokemon.setStat(Stat.SPD, 50);

    game.move.select(MoveId.TACKLE);
    await game.phaseInterceptor.to("MoveEndPhase", false);

    expect(playerPokemon).toHaveFullHp();
    expect(enemyPokemon).not.toHaveFullHp();
  });

  it("double - both opponents faster than player 50/50 vs 150/150", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle(SpeciesId.BULBASAUR, SpeciesId.BLASTOISE);

    const [player1, player2] = game.scene.getPlayerField();
    const [enemy1, enemy2] = game.scene.getEnemyField();
    player1.setStat(Stat.SPD, 50);
    player2.setStat(Stat.SPD, 50);
    enemy1.setStat(Stat.SPD, 150);
    enemy2.setStat(Stat.SPD, 150);

    game.move.select(MoveId.TACKLE);
    game.move.select(MoveId.TACKLE, 1);
    await game.move.selectEnemyMove(MoveId.TACKLE, BattlerIndex.PLAYER);
    await game.move.selectEnemyMove(MoveId.TACKLE, BattlerIndex.PLAYER_2);

    await game.phaseInterceptor.to("MoveEndPhase", true);
    await game.phaseInterceptor.to("MoveEndPhase", false);

    expect(player1).not.toHaveFullHp();
    expect(player2).not.toHaveFullHp();
    expect(enemy1).toHaveFullHp();
    expect(enemy2).toHaveFullHp();
  });

  it("double - speed tie except 1 - 100/100 vs 100/150", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle(SpeciesId.BULBASAUR, SpeciesId.BLASTOISE);

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
    await game.classicMode.startBattle(SpeciesId.BULBASAUR, SpeciesId.BLASTOISE);

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
    expect(phase.pokemon, "one of the slower mons moved first").toBeOneOf([enemyPokemon[1], playerPokemon[1]]);
  });
});
