import { PostItemLostAbAttr } from "#app/data/ability";
import { allMoves, StealHeldItemChanceAttr } from "#app/data/move";
import Pokemon from "#app/field/pokemon";
import type { ContactHeldItemTransferChanceModifier } from "#app/modifier/modifier";
import { Abilities } from "#enums/abilities";
import { BattlerTagType } from "#enums/battler-tag-type";
import { BerryType } from "#enums/berry-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Stat } from "#enums/stat";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";


describe("Abilities - Unburden", () => {
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
    // Caution: Do not override player's ability here. It would mess up the Neutralizing Gas test.
    game.override
      .battleType("single")
      .startingLevel(1)
      .moveset([ Moves.POPULATION_BOMB, Moves.KNOCK_OFF, Moves.PLUCK, Moves.THIEF ])
      .startingHeldItems([
        { name: "BERRY", count: 1, type: BerryType.SITRUS },
        { name: "BERRY", count: 2, type: BerryType.APICOT },
        { name: "BERRY", count: 2, type: BerryType.LUM },
      ])
      .enemySpecies(Species.NINJASK)
      .enemyLevel(100)
      .enemyMoveset(Moves.SPLASH)
      .enemyAbility(Abilities.UNBURDEN)
      .enemyPassiveAbility(Abilities.NO_GUARD)
      .enemyHeldItems([
        { name: "BERRY", type: BerryType.SITRUS, count: 1 },
        { name: "BERRY", type: BerryType.LUM, count: 1 },
      ]);
  });

  it("should activate when a berry is eaten", async () => {
    game.override.enemyMoveset(Moves.FALSE_SWIPE)
      .ability(Abilities.UNBURDEN);
    await game.classicMode.startBattle([ Species.TREECKO ]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const playerHeldItems = getHeldItemCount(playerPokemon);
    const initialPlayerSpeed = playerPokemon.getStat(Stat.SPD);

    // Player gets hit by False Swipe and eats its own Sitrus Berry
    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    expect(getHeldItemCount(playerPokemon)).toBeLessThan(playerHeldItems);
    expect(playerPokemon.getEffectiveStat(Stat.SPD)).toBe(initialPlayerSpeed * 2);
  });

  it("should activate when a berry is eaten, even if Berry Pouch preserves the berry", async () => {
    game.override.enemyMoveset(Moves.FALSE_SWIPE)
      .ability(Abilities.UNBURDEN)
      .startingModifier([{ name: "BERRY_POUCH", count: 5850 }]);
    await game.classicMode.startBattle([ Species.TREECKO ]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const playerHeldItems = getHeldItemCount(playerPokemon);
    const initialPlayerSpeed = playerPokemon.getStat(Stat.SPD);

    // Player gets hit by False Swipe and eats its own Sitrus Berry
    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    expect(getHeldItemCount(playerPokemon)).toBe(playerHeldItems);
    expect(playerPokemon.getEffectiveStat(Stat.SPD)).toBe(initialPlayerSpeed * 2);
  });

  it("should activate for the target, and not the stealer, when a berry is stolen", async () => {
    game.override.ability(Abilities.UNBURDEN);
    await game.classicMode.startBattle([ Species.TREECKO ]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const initialPlayerSpeed = playerPokemon.getStat(Stat.SPD);
    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const enemyHeldItemCt = getHeldItemCount(enemyPokemon);
    const initialEnemySpeed = enemyPokemon.getStat(Stat.SPD);

    // Player uses Pluck and eats the opponent's berry
    game.move.select(Moves.PLUCK);
    await game.toNextTurn();

    expect(getHeldItemCount(enemyPokemon)).toBeLessThan(enemyHeldItemCt);
    expect(enemyPokemon.getEffectiveStat(Stat.SPD)).toBe(initialEnemySpeed * 2);
    expect(playerPokemon.getEffectiveStat(Stat.SPD)).toBe(initialPlayerSpeed);
  });

  it("should activate when an item is knocked off", async () => {
    await game.classicMode.startBattle([ Species.TREECKO ]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const enemyHeldItemCt = getHeldItemCount(enemyPokemon);
    const initialEnemySpeed = enemyPokemon.getStat(Stat.SPD);

    // Player uses Knock Off and removes the opponent's item
    game.move.select(Moves.KNOCK_OFF);
    await game.toNextTurn();

    expect(getHeldItemCount(enemyPokemon)).toBeLessThan(enemyHeldItemCt);
    expect(enemyPokemon.getEffectiveStat(Stat.SPD)).toBe(initialEnemySpeed * 2);
  });

  it("should activate when an item is stolen via attacking ability", async () => {
    game.override
      .ability(Abilities.MAGICIAN)
      .startingHeldItems([]);
    await game.classicMode.startBattle([ Species.TREECKO ]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const enemyHeldItemCt = getHeldItemCount(enemyPokemon);
    const initialEnemySpeed = enemyPokemon.getStat(Stat.SPD);

    // Player steals the opponent's item via ability Magician
    game.move.select(Moves.POPULATION_BOMB);
    await game.toNextTurn();

    expect(getHeldItemCount(enemyPokemon)).toBeLessThan(enemyHeldItemCt);
    expect(enemyPokemon.getEffectiveStat(Stat.SPD)).toBe(initialEnemySpeed * 2);
  });

  it("should activate when an item is stolen via defending ability", async () => {
    game.override
      .startingLevel(45)
      .ability(Abilities.UNBURDEN)
      .enemyAbility(Abilities.PICKPOCKET);
    await game.classicMode.startBattle([ Species.TREECKO ]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const playerHeldItems = getHeldItemCount(playerPokemon);
    const initialPlayerSpeed = playerPokemon.getStat(Stat.SPD);

    // Player's item gets stolen via ability Pickpocket
    game.move.select(Moves.POPULATION_BOMB);
    await game.toNextTurn();

    expect(getHeldItemCount(playerPokemon)).toBeLessThan(playerHeldItems);
    expect(playerPokemon.getEffectiveStat(Stat.SPD)).toBe(initialPlayerSpeed * 2);
  });

  it("should activate when an item is stolen via move", async () => {
    vi.spyOn(allMoves[Moves.THIEF], "attrs", "get").mockReturnValue([ new StealHeldItemChanceAttr(1.0) ]); // give Thief 100% steal rate
    game.override.startingHeldItems([
      { name: "MULTI_LENS", count: 3 },
    ]);
    await game.classicMode.startBattle([ Species.TREECKO ]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const enemyHeldItemCt = getHeldItemCount(enemyPokemon);
    const initialEnemySpeed = enemyPokemon.getStat(Stat.SPD);

    // Player uses Thief and steals the opponent's item
    game.move.select(Moves.THIEF);
    await game.toNextTurn();

    expect(getHeldItemCount(enemyPokemon)).toBeLessThan(enemyHeldItemCt);
    expect(enemyPokemon.getEffectiveStat(Stat.SPD)).toBe(initialEnemySpeed * 2);
  });

  it("should activate when an item is stolen via grip claw", async () => {
    game.override
      .startingLevel(5)
      .startingHeldItems([
        { name: "GRIP_CLAW", count: 1 },
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
    await game.classicMode.startBattle([ Species.TREECKO ]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const gripClaw = playerPokemon.getHeldItems()[0] as ContactHeldItemTransferChanceModifier;
    vi.spyOn(gripClaw, "chance", "get").mockReturnValue(100);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const enemyHeldItemCt = getHeldItemCount(enemyPokemon);
    const initialEnemySpeed = enemyPokemon.getStat(Stat.SPD);

    // Player steals the opponent's item using Grip Claw
    game.move.select(Moves.POPULATION_BOMB);
    await game.toNextTurn();

    expect(getHeldItemCount(enemyPokemon)).toBeLessThan(enemyHeldItemCt);
    expect(enemyPokemon.getEffectiveStat(Stat.SPD)).toBe(initialEnemySpeed * 2);
  });

  it("should not activate when a neutralizing ability is present", async () => {
    game.override.enemyAbility(Abilities.NEUTRALIZING_GAS)
      .ability(Abilities.UNBURDEN)
      .enemyMoveset(Moves.FALSE_SWIPE);
    await game.classicMode.startBattle([ Species.TREECKO ]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const playerHeldItems = getHeldItemCount(playerPokemon);
    const initialPlayerSpeed = playerPokemon.getStat(Stat.SPD);

    // Player gets hit by False Swipe and eats Sitrus Berry, which should not trigger Unburden
    game.move.select(Moves.FALSE_SWIPE);
    await game.toNextTurn();

    expect(getHeldItemCount(playerPokemon)).toBeLessThan(playerHeldItems);
    expect(playerPokemon.getEffectiveStat(Stat.SPD)).toBe(initialPlayerSpeed);
    expect(playerPokemon.getTag(BattlerTagType.UNBURDEN)).toBeUndefined();
  });

  it("should activate when a move that consumes a berry is used", async () => {
    game.override.moveset(Moves.STUFF_CHEEKS)
      .ability(Abilities.UNBURDEN);
    await game.classicMode.startBattle([ Species.TREECKO ]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const playerHeldItemCt = getHeldItemCount(playerPokemon);
    const initialPlayerSpeed = playerPokemon.getStat(Stat.SPD);

    // Player uses Stuff Cheeks and eats its own berry
    // Caution: There is a known issue where opponent can randomly generate with Salac Berry
    game.move.select(Moves.STUFF_CHEEKS);
    await game.toNextTurn();

    expect(getHeldItemCount(playerPokemon)).toBeLessThan(playerHeldItemCt);
    expect(playerPokemon.getEffectiveStat(Stat.SPD)).toBe(initialPlayerSpeed * 2);
  });

  it("should deactivate temporarily when a neutralizing gas user is on the field", async () => {
    game.override
      .battleType("double")
      .moveset([ Moves.SPLASH ]);
    await game.classicMode.startBattle([ Species.TREECKO, Species.MEOWTH, Species.WEEZING ]);

    const playerPokemon = game.scene.getPlayerParty();
    const treecko = playerPokemon[0];
    const weezing = playerPokemon[2];
    treecko.abilityIndex = 2; // Treecko has Unburden
    weezing.abilityIndex = 1; // Weezing has Neutralizing Gas
    const playerHeldItems = getHeldItemCount(treecko);
    const initialPlayerSpeed = treecko.getStat(Stat.SPD);

    // Turn 1: Treecko gets hit by False Swipe and eats Sitrus Berry, activating Unburden
    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.FALSE_SWIPE, 0);
    await game.forceEnemyMove(Moves.FALSE_SWIPE, 0);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(getHeldItemCount(treecko)).toBeLessThan(playerHeldItems);
    expect(treecko.getEffectiveStat(Stat.SPD)).toBe(initialPlayerSpeed * 2);

    // Turn 2: Switch Meowth to Weezing, activating Neutralizing Gas
    await game.toNextTurn();
    game.move.select(Moves.SPLASH);
    game.doSwitchPokemon(2);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(getHeldItemCount(treecko)).toBeLessThan(playerHeldItems);
    expect(treecko.getEffectiveStat(Stat.SPD)).toBe(initialPlayerSpeed);

    // Turn 3: Switch Weezing to Meowth, deactivating Neutralizing Gas
    await game.toNextTurn();
    game.move.select(Moves.SPLASH);
    game.doSwitchPokemon(2);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(getHeldItemCount(treecko)).toBeLessThan(playerHeldItems);
    expect(treecko.getEffectiveStat(Stat.SPD)).toBe(initialPlayerSpeed * 2);
  });

  it("should not activate when passing a baton to a teammate switching in", async () => {
    game.override.startingHeldItems([{ name: "BATON" }])
      .ability(Abilities.UNBURDEN)
      .moveset(Moves.BATON_PASS);
    await game.classicMode.startBattle([ Species.TREECKO, Species.PURRLOIN ]);

    const [ treecko, purrloin ] = game.scene.getPlayerParty();
    const initialTreeckoSpeed = treecko.getStat(Stat.SPD);
    const initialPurrloinSpeed = purrloin.getStat(Stat.SPD);
    const unburdenAttr = treecko.getAbilityAttrs(PostItemLostAbAttr)[0];
    vi.spyOn(unburdenAttr, "applyPostItemLost");

    // Player uses Baton Pass, which also passes the Baton item
    game.move.select(Moves.BATON_PASS);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    expect(getHeldItemCount(treecko)).toBe(0);
    expect(getHeldItemCount(purrloin)).toBe(1);
    expect(treecko.getEffectiveStat(Stat.SPD)).toBe(initialTreeckoSpeed);
    expect(purrloin.getEffectiveStat(Stat.SPD)).toBe(initialPurrloinSpeed);
    expect(unburdenAttr.applyPostItemLost).not.toHaveBeenCalled();
  });

  it("should not speed up a Pokemon after it loses the ability Unburden", async () => {
    game.override.ability(Abilities.UNBURDEN)
      .enemyMoveset([ Moves.FALSE_SWIPE, Moves.WORRY_SEED ]);
    await game.classicMode.startBattle([ Species.PURRLOIN ]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const playerHeldItems = getHeldItemCount(playerPokemon);
    const initialPlayerSpeed = playerPokemon.getStat(Stat.SPD);

    // Turn 1: Get hit by False Swipe and eat Sitrus Berry, activating Unburden
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.FALSE_SWIPE);
    await game.toNextTurn();

    expect(getHeldItemCount(playerPokemon)).toBeLessThan(playerHeldItems);
    expect(playerPokemon.getEffectiveStat(Stat.SPD)).toBe(initialPlayerSpeed * 2);

    // Turn 2: Get hit by Worry Seed, deactivating Unburden
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.WORRY_SEED);
    await game.toNextTurn();

    expect(getHeldItemCount(playerPokemon)).toBeLessThan(playerHeldItems);
    expect(playerPokemon.getEffectiveStat(Stat.SPD)).toBe(initialPlayerSpeed);
  });

  it("should activate when a reviver seed is used", async () => {
    game.override.ability(Abilities.UNBURDEN)
      .startingHeldItems([{ name: "REVIVER_SEED" }])
      .enemyMoveset([ Moves.WING_ATTACK ]);
    await game.classicMode.startBattle([ Species.TREECKO ]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const playerHeldItems = getHeldItemCount(playerPokemon);
    const initialPlayerSpeed = playerPokemon.getStat(Stat.SPD);

    // Turn 1: Get hit by Wing Attack and faint, activating Reviver Seed
    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    expect(getHeldItemCount(playerPokemon)).toBeLessThan(playerHeldItems);
    expect(playerPokemon.getEffectiveStat(Stat.SPD)).toBe(initialPlayerSpeed * 2);
  });
});
