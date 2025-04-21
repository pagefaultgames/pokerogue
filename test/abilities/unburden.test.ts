import { BattlerIndex } from "#app/battle";
import { PostItemLostAbAttr } from "#app/data/abilities/ability";
import { allMoves, StealHeldItemChanceAttr } from "#app/data/moves/move";
import type Pokemon from "#app/field/pokemon";
import type { ContactHeldItemTransferChanceModifier } from "#app/modifier/modifier";
import { Abilities } from "#enums/abilities";
import { BattlerTagType } from "#enums/battler-tag-type";
import { BerryType } from "#enums/berry-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Stat } from "#enums/stat";
import GameManager from "#test/testUtils/gameManager";
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
    }
    return 0;
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
      .battleStyle("single")
      .startingLevel(1)
      .ability(Abilities.UNBURDEN)
      .moveset([Moves.SPLASH, Moves.KNOCK_OFF, Moves.PLUCK, Moves.FALSE_SWIPE])
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
    // For the various tests that use Thief, give it a 100% steal rate
    vi.spyOn(allMoves[Moves.THIEF], "attrs", "get").mockReturnValue([new StealHeldItemChanceAttr(1.0)]);
  });

  it("should activate when a berry is eaten", async () => {
    game.override.enemyMoveset(Moves.FALSE_SWIPE);
    await game.classicMode.startBattle([Species.TREECKO]);

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
    game.override.enemyMoveset(Moves.FALSE_SWIPE).startingModifier([{ name: "BERRY_POUCH", count: 5850 }]);
    await game.classicMode.startBattle([Species.TREECKO]);

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
    await game.classicMode.startBattle([Species.TREECKO]);

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
    await game.classicMode.startBattle([Species.TREECKO]);

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
    game.override.ability(Abilities.MAGICIAN).startingHeldItems([]); // Remove player's full stacks of held items so it can steal opponent's held items
    await game.classicMode.startBattle([Species.TREECKO]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const enemyHeldItemCt = getHeldItemCount(enemyPokemon);
    const initialEnemySpeed = enemyPokemon.getStat(Stat.SPD);

    // Player steals the opponent's item via ability Magician
    game.move.select(Moves.FALSE_SWIPE);
    await game.toNextTurn();

    expect(getHeldItemCount(enemyPokemon)).toBeLessThan(enemyHeldItemCt);
    expect(enemyPokemon.getEffectiveStat(Stat.SPD)).toBe(initialEnemySpeed * 2);
  });

  it("should activate when an item is stolen via defending ability", async () => {
    game.override.enemyAbility(Abilities.PICKPOCKET).enemyHeldItems([]); // Remove opponent's full stacks of held items so it can steal player's held items
    await game.classicMode.startBattle([Species.TREECKO]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const playerHeldItems = getHeldItemCount(playerPokemon);
    const initialPlayerSpeed = playerPokemon.getStat(Stat.SPD);

    // Player's item gets stolen via ability Pickpocket
    game.move.select(Moves.FALSE_SWIPE);
    await game.toNextTurn();

    expect(getHeldItemCount(playerPokemon)).toBeLessThan(playerHeldItems);
    expect(playerPokemon.getEffectiveStat(Stat.SPD)).toBe(initialPlayerSpeed * 2);
  });

  it("should activate when an item is stolen via move", async () => {
    game.override.moveset(Moves.THIEF).startingHeldItems([]); // Remove player's full stacks of held items so it can steal opponent's held items
    await game.classicMode.startBattle([Species.TREECKO]);

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
    game.override.startingHeldItems([{ name: "GRIP_CLAW", count: 1 }]);
    await game.classicMode.startBattle([Species.TREECKO]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const gripClaw = playerPokemon.getHeldItems()[0] as ContactHeldItemTransferChanceModifier;
    vi.spyOn(gripClaw, "chance", "get").mockReturnValue(100);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const enemyHeldItemCt = getHeldItemCount(enemyPokemon);
    const initialEnemySpeed = enemyPokemon.getStat(Stat.SPD);

    // Player steals the opponent's item using Grip Claw
    game.move.select(Moves.FALSE_SWIPE);
    await game.toNextTurn();

    expect(getHeldItemCount(enemyPokemon)).toBeLessThan(enemyHeldItemCt);
    expect(enemyPokemon.getEffectiveStat(Stat.SPD)).toBe(initialEnemySpeed * 2);
  });

  it("should not activate when a neutralizing ability is present", async () => {
    game.override.enemyAbility(Abilities.NEUTRALIZING_GAS).enemyMoveset(Moves.FALSE_SWIPE);
    await game.classicMode.startBattle([Species.TREECKO]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const playerHeldItems = getHeldItemCount(playerPokemon);
    const initialPlayerSpeed = playerPokemon.getStat(Stat.SPD);

    // Player gets hit by False Swipe and eats Sitrus Berry, which should not trigger Unburden
    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    expect(getHeldItemCount(playerPokemon)).toBeLessThan(playerHeldItems);
    expect(playerPokemon.getEffectiveStat(Stat.SPD)).toBe(initialPlayerSpeed);
    expect(playerPokemon.getTag(BattlerTagType.UNBURDEN)).toBeUndefined();
  });

  it("should activate when a move that consumes a berry is used", async () => {
    game.override.moveset(Moves.STUFF_CHEEKS);
    await game.classicMode.startBattle([Species.TREECKO]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const playerHeldItemCt = getHeldItemCount(playerPokemon);
    const initialPlayerSpeed = playerPokemon.getStat(Stat.SPD);

    // Player uses Stuff Cheeks and eats its own berry
    // Caution: Do not test this using opponent, there is a known issue where opponent can randomly generate with Salac Berry
    game.move.select(Moves.STUFF_CHEEKS);
    await game.toNextTurn();

    expect(getHeldItemCount(playerPokemon)).toBeLessThan(playerHeldItemCt);
    expect(playerPokemon.getEffectiveStat(Stat.SPD)).toBe(initialPlayerSpeed * 2);
  });

  it("should deactivate temporarily when a neutralizing gas user is on the field", async () => {
    game.override.battleStyle("double").ability(Abilities.NONE); // Disable ability override so that we can properly set abilities below
    await game.classicMode.startBattle([Species.TREECKO, Species.MEOWTH, Species.WEEZING]);

    const [treecko, _meowth, weezing] = game.scene.getPlayerParty();
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
    game.override.startingHeldItems([{ name: "BATON" }]).moveset(Moves.BATON_PASS);
    await game.classicMode.startBattle([Species.TREECKO, Species.PURRLOIN]);

    const [treecko, purrloin] = game.scene.getPlayerParty();
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
    game.override.enemyMoveset([Moves.FALSE_SWIPE, Moves.WORRY_SEED]);
    await game.classicMode.startBattle([Species.PURRLOIN]);

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
    game.override.startingHeldItems([{ name: "REVIVER_SEED" }]).enemyMoveset([Moves.WING_ATTACK]);
    await game.classicMode.startBattle([Species.TREECKO]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const playerHeldItems = getHeldItemCount(playerPokemon);
    const initialPlayerSpeed = playerPokemon.getStat(Stat.SPD);

    // Turn 1: Get hit by Wing Attack and faint, activating Reviver Seed
    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    expect(getHeldItemCount(playerPokemon)).toBeLessThan(playerHeldItems);
    expect(playerPokemon.getEffectiveStat(Stat.SPD)).toBe(initialPlayerSpeed * 2);
  });

  // test for `.bypassFaint()` - singles
  it("shouldn't persist when revived normally if activated while fainting", async () => {
    game.override.enemyMoveset([Moves.SPLASH, Moves.THIEF]);
    await game.classicMode.startBattle([Species.TREECKO, Species.FEEBAS]);

    const treecko = game.scene.getPlayerPokemon()!;
    const treeckoInitialHeldItems = getHeldItemCount(treecko);
    const initialSpeed = treecko.getStat(Stat.SPD);

    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.THIEF);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    game.doRevivePokemon(1);
    game.doSwitchPokemon(1);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();

    expect(game.scene.getPlayerPokemon()!).toBe(treecko);
    expect(getHeldItemCount(treecko)).toBeLessThan(treeckoInitialHeldItems);
    expect(treecko.getEffectiveStat(Stat.SPD)).toBe(initialSpeed);
  });

  // test for `.bypassFaint()` - doubles
  it("shouldn't persist when revived by revival blessing if activated while fainting", async () => {
    game.override
      .battleStyle("double")
      .enemyMoveset([Moves.SPLASH, Moves.THIEF])
      .moveset([Moves.SPLASH, Moves.REVIVAL_BLESSING])
      .startingHeldItems([{ name: "WIDE_LENS" }]);
    await game.classicMode.startBattle([Species.TREECKO, Species.FEEBAS, Species.MILOTIC]);

    const treecko = game.scene.getPlayerField()[0];
    const treeckoInitialHeldItems = getHeldItemCount(treecko);
    const initialSpeed = treecko.getStat(Stat.SPD);

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.REVIVAL_BLESSING, 1);
    await game.forceEnemyMove(Moves.THIEF, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2]);
    game.doSelectPartyPokemon(0, "RevivalBlessingPhase");
    await game.toNextTurn();

    expect(game.scene.getPlayerField()[0]).toBe(treecko);
    expect(getHeldItemCount(treecko)).toBeLessThan(treeckoInitialHeldItems);
    expect(treecko.getEffectiveStat(Stat.SPD)).toBe(initialSpeed);
  });
});
