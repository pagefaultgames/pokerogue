import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Stat } from "#enums/stat";
import { BerryType } from "#app/enums/berry-type";
import { allMoves, StealHeldItemChanceAttr } from "#app/data/move";


describe("Abilities - Unburden", () => {
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
      .starterSpecies(Species.TREECKO)
      .startingLevel(1)
      .moveset([ Moves.POPULATION_BOMB, Moves.KNOCK_OFF, Moves.PLUCK, Moves.THIEF ])
      .startingHeldItems([
        { name: "BERRY", count: 1, type: BerryType.SITRUS },
        { name: "BERRY", count: 2, type: BerryType.APICOT },
        { name: "BERRY", count: 2, type: BerryType.LUM },
      ])
      .enemySpecies(Species.NINJASK)
      .enemyLevel(100)
      .enemyMoveset([ Moves.FALSE_SWIPE ])
      .enemyAbility(Abilities.UNBURDEN)
      .enemyPassiveAbility(Abilities.NO_GUARD)
      .enemyHeldItems([
        { name: "BERRY", type: BerryType.SITRUS, count: 1 },
        { name: "BERRY", type: BerryType.LUM, count: 1 },
      ]);
  });

  it("should activate when a berry is eaten", async () => {
    await game.classicMode.startBattle();

    const playerPokemon = game.scene.getPlayerPokemon()!;
    playerPokemon.abilityIndex = 2;
    const playerHeldItems = playerPokemon.getHeldItems().length;
    const initialPlayerSpeed = playerPokemon.getStat(Stat.SPD);

    game.move.select(Moves.FALSE_SWIPE);
    await game.toNextTurn();

    expect(playerPokemon.getHeldItems().length).toBeLessThan(playerHeldItems);
    expect(playerPokemon.getEffectiveStat(Stat.SPD)).toBeCloseTo(initialPlayerSpeed * 2);
  });

  it("should activate when a berry is stolen", async () => {
    await game.classicMode.startBattle();

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const enemyHeldItemCt = enemyPokemon.getHeldItems().length;
    const initialEnemySpeed = enemyPokemon.getStat(Stat.SPD);

    game.move.select(Moves.PLUCK);
    await game.toNextTurn();

    expect(enemyPokemon.getHeldItems().length).toBeLessThan(enemyHeldItemCt);
    expect(enemyPokemon.getEffectiveStat(Stat.SPD)).toBeCloseTo(initialEnemySpeed * 2);
  });

  it("should activate when an item is knocked off", async () => {
    await game.classicMode.startBattle();

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const enemyHeldItemCt = enemyPokemon.getHeldItems().length;
    const initialEnemySpeed = enemyPokemon.getStat(Stat.SPD);

    game.move.select(Moves.KNOCK_OFF);
    await game.toNextTurn();

    expect(enemyPokemon.getHeldItems().length).toBeLessThan(enemyHeldItemCt);
    expect(enemyPokemon.getEffectiveStat(Stat.SPD)).toBeCloseTo(initialEnemySpeed * 2);
  });

  it("should activate when an item is stolen via attacking ability", async () => {
    game.override
      .ability(Abilities.MAGICIAN)
      .startingHeldItems([
        { name: "MULTI_LENS", count: 3 },
      ]);
    await game.classicMode.startBattle();

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const enemyHeldItemCt = enemyPokemon.getHeldItems().length;
    const initialEnemySpeed = enemyPokemon.getStat(Stat.SPD);

    game.move.select(Moves.POPULATION_BOMB);
    await game.toNextTurn();

    expect(enemyPokemon.getHeldItems().length).toBeLessThan(enemyHeldItemCt);
    expect(enemyPokemon.getEffectiveStat(Stat.SPD)).toBeCloseTo(initialEnemySpeed * 2);
  });

  it("should activate when an item is stolen via defending ability", async () => {
    game.override
      .startingLevel(45)
      .enemyAbility(Abilities.PICKPOCKET)
      .startingHeldItems([
        { name: "MULTI_LENS", count: 3 },
        { name: "SOUL_DEW", count: 1 },
        { name: "LUCKY_EGG", count: 1 },
      ]);
    await game.classicMode.startBattle();

    const playerPokemon = game.scene.getPlayerPokemon()!;
    playerPokemon.abilityIndex = 2;
    const playerHeldItems = playerPokemon.getHeldItems().length;
    const initialPlayerSpeed = playerPokemon.getStat(Stat.SPD);

    game.move.select(Moves.POPULATION_BOMB);
    await game.toNextTurn();

    expect(playerPokemon.getHeldItems().length).toBeLessThan(playerHeldItems);
    expect(playerPokemon.getEffectiveStat(Stat.SPD)).toBeCloseTo(initialPlayerSpeed * 2);
  });

  it("should activate when an item is stolen via move", async () => {
    vi.spyOn(allMoves[Moves.THIEF], "attrs", "get").mockReturnValue([ new StealHeldItemChanceAttr(1.0) ]); // give Thief 100% steal rate
    game.override.startingHeldItems([
      { name: "MULTI_LENS", count: 3 },
    ]);
    await game.classicMode.startBattle();

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const enemyHeldItemCt = enemyPokemon.getHeldItems().length;
    const initialEnemySpeed = enemyPokemon.getStat(Stat.SPD);

    game.move.select(Moves.THIEF);
    await game.toNextTurn();

    expect(enemyPokemon.getHeldItems().length).toBeLessThan(enemyHeldItemCt);
    expect(enemyPokemon.getEffectiveStat(Stat.SPD)).toBeCloseTo(initialEnemySpeed * 2);
  });

  it("should activate when an item is stolen via grip claw", async () => {
    game.override
      .startingLevel(5)
      .startingHeldItems([
        { name: "GRIP_CLAW", count: 5 },
        { name: "MULTI_LENS", count: 3 },
      ])
      .enemyHeldItems([
        { name: "SOUL_DEW", count: 1 },
        { name: "LUCKY_EGG", count: 1 },
        { name: "LEFTOVERS", count: 1 },
        { name: "GRIP_CLAW", count: 1 },
        { name: "MULTI_LENS", count: 1 },
        { name: "BERRY", type: BerryType.SITRUS, count: 1 },
        { name: "BERRY", type: BerryType.LUM, count: 1 },
      ]);
    await game.classicMode.startBattle();

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const enemyHeldItemCt = enemyPokemon.getHeldItems().length;
    const initialEnemySpeed = enemyPokemon.getStat(Stat.SPD);

    while (enemyPokemon.getHeldItems().length === enemyHeldItemCt) {
      game.move.select(Moves.POPULATION_BOMB);
      await game.toNextTurn();
    }

    expect(enemyPokemon.getHeldItems().length).toBeLessThan(enemyHeldItemCt);
    expect(enemyPokemon.getEffectiveStat(Stat.SPD)).toBeCloseTo(initialEnemySpeed * 2);
  });

  it("should not activate when a neutralizing ability is present", async () => {
    game.override.enemyAbility(Abilities.NEUTRALIZING_GAS);
    await game.classicMode.startBattle();

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const playerHeldItems = playerPokemon.getHeldItems().length;
    const initialPlayerSpeed = playerPokemon.getStat(Stat.SPD);

    game.move.select(Moves.FALSE_SWIPE);
    await game.toNextTurn();

    expect(playerPokemon.getHeldItems().length).toBeLessThan(playerHeldItems);
    expect(playerPokemon.getEffectiveStat(Stat.SPD)).toBeCloseTo(initialPlayerSpeed);
  });

  it("should activate when a move that consumes a berry is used", async () => {
    game.override.enemyMoveset([ Moves.STUFF_CHEEKS ]);
    await game.classicMode.startBattle();

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const enemyHeldItemCt = enemyPokemon.getHeldItems().length;
    const initialEnemySpeed = enemyPokemon.getStat(Stat.SPD);

    game.move.select(Moves.STUFF_CHEEKS);
    await game.toNextTurn();

    expect(enemyPokemon.getHeldItems().length).toBeLessThan(enemyHeldItemCt);
    expect(enemyPokemon.getEffectiveStat(Stat.SPD)).toBeCloseTo(initialEnemySpeed * 2);
  });

  it("should deactivate when a neutralizing gas user enters the field", async () => {
    game.override
      .battleType("double")
      .moveset([ Moves.SPLASH ]);
    await game.classicMode.startBattle([ Species.TREECKO, Species.MEOWTH, Species.WEEZING ]);

    const playerPokemon = game.scene.getPlayerParty();
    const treecko = playerPokemon[0];
    const weezing = playerPokemon[2];
    treecko.abilityIndex = 2;
    weezing.abilityIndex = 1;
    const playerHeldItems = treecko.getHeldItems().length;
    const initialPlayerSpeed = treecko.getStat(Stat.SPD);

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.FALSE_SWIPE, 0);
    await game.forceEnemyMove(Moves.FALSE_SWIPE, 0);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(treecko.getHeldItems().length).toBeLessThan(playerHeldItems);
    expect(treecko.getEffectiveStat(Stat.SPD)).toBeCloseTo(initialPlayerSpeed * 2);

    await game.toNextTurn();
    game.move.select(Moves.SPLASH);
    game.doSwitchPokemon(2);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(treecko.getHeldItems().length).toBeLessThan(playerHeldItems);
    expect(treecko.getEffectiveStat(Stat.SPD)).toBeCloseTo(initialPlayerSpeed);
  });

});
