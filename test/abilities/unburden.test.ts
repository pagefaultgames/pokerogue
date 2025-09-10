import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { BerryType } from "#enums/berry-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import type { Pokemon } from "#field/pokemon";
import type { ContactHeldItemTransferChanceModifier } from "#modifiers/modifier";
import { StealHeldItemChanceAttr } from "#moves/move";
import { GameManager } from "#test/test-utils/game-manager";
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
    return stackCounts.reduce((a, b) => a + b, 0);
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
      .ability(AbilityId.UNBURDEN)
      .moveset([MoveId.SPLASH, MoveId.KNOCK_OFF, MoveId.PLUCK, MoveId.FALSE_SWIPE])
      .startingHeldItems([
        { name: "BERRY", count: 1, type: BerryType.SITRUS },
        { name: "BERRY", count: 2, type: BerryType.APICOT },
        { name: "BERRY", count: 2, type: BerryType.LUM },
      ])
      .enemySpecies(SpeciesId.NINJASK)
      .enemyLevel(100)
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.UNBURDEN)
      .enemyPassiveAbility(AbilityId.NO_GUARD)
      .enemyHeldItems([
        { name: "BERRY", type: BerryType.SITRUS, count: 1 },
        { name: "BERRY", type: BerryType.LUM, count: 1 },
      ]);
    // For the various tests that use Thief, give it a 100% steal rate
    vi.spyOn(allMoves[MoveId.THIEF], "attrs", "get").mockReturnValue([new StealHeldItemChanceAttr(1.0)]);
  });

  it("should activate when a berry is eaten", async () => {
    game.override.enemyMoveset(MoveId.FALSE_SWIPE);
    await game.classicMode.startBattle([SpeciesId.TREECKO]);

    const playerPokemon = game.field.getPlayerPokemon();
    const playerHeldItems = getHeldItemCount(playerPokemon);
    const initialPlayerSpeed = playerPokemon.getStat(Stat.SPD);

    // Player gets hit by False Swipe and eats its own Sitrus Berry
    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    expect(getHeldItemCount(playerPokemon)).toBeLessThan(playerHeldItems);
    expect(playerPokemon.getEffectiveStat(Stat.SPD)).toBe(initialPlayerSpeed * 2);
  });

  it("should activate when a berry is eaten, even if Berry Pouch preserves the berry", async () => {
    game.override.enemyMoveset(MoveId.FALSE_SWIPE).startingModifier([{ name: "BERRY_POUCH", count: 5850 }]);
    await game.classicMode.startBattle([SpeciesId.TREECKO]);

    const playerPokemon = game.field.getPlayerPokemon();
    const playerHeldItems = getHeldItemCount(playerPokemon);
    const initialPlayerSpeed = playerPokemon.getStat(Stat.SPD);

    // Player gets hit by False Swipe and eats its own Sitrus Berry
    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    expect(getHeldItemCount(playerPokemon)).toBe(playerHeldItems);
    expect(playerPokemon.getEffectiveStat(Stat.SPD)).toBe(initialPlayerSpeed * 2);
  });

  it("should activate for the target, and not the stealer, when a berry is stolen", async () => {
    await game.classicMode.startBattle([SpeciesId.TREECKO]);

    const playerPokemon = game.field.getPlayerPokemon();
    const initialPlayerSpeed = playerPokemon.getStat(Stat.SPD);
    const enemyPokemon = game.field.getEnemyPokemon();
    const enemyHeldItemCt = getHeldItemCount(enemyPokemon);
    const initialEnemySpeed = enemyPokemon.getStat(Stat.SPD);

    // Player uses Pluck and eats the opponent's berry
    game.move.select(MoveId.PLUCK);
    await game.toNextTurn();

    expect(getHeldItemCount(enemyPokemon)).toBeLessThan(enemyHeldItemCt);
    expect(enemyPokemon.getEffectiveStat(Stat.SPD)).toBe(initialEnemySpeed * 2);
    expect(playerPokemon.getEffectiveStat(Stat.SPD)).toBe(initialPlayerSpeed);
  });

  it("should activate when an item is knocked off", async () => {
    await game.classicMode.startBattle([SpeciesId.TREECKO]);

    const enemyPokemon = game.field.getEnemyPokemon();
    const enemyHeldItemCt = getHeldItemCount(enemyPokemon);
    const initialEnemySpeed = enemyPokemon.getStat(Stat.SPD);

    // Player uses Knock Off and removes the opponent's item
    game.move.select(MoveId.KNOCK_OFF);
    await game.toNextTurn();

    expect(getHeldItemCount(enemyPokemon)).toBeLessThan(enemyHeldItemCt);
    expect(enemyPokemon.getEffectiveStat(Stat.SPD)).toBe(initialEnemySpeed * 2);
  });

  it("should activate when an item is stolen via attacking ability", async () => {
    game.override.ability(AbilityId.MAGICIAN).startingHeldItems([]); // Remove player's full stacks of held items so it can steal opponent's held items
    await game.classicMode.startBattle([SpeciesId.TREECKO]);

    const enemyPokemon = game.field.getEnemyPokemon();
    const enemyHeldItemCt = getHeldItemCount(enemyPokemon);
    const initialEnemySpeed = enemyPokemon.getStat(Stat.SPD);

    // Player steals the opponent's item via ability Magician
    game.move.select(MoveId.FALSE_SWIPE);
    await game.toNextTurn();

    expect(getHeldItemCount(enemyPokemon)).toBeLessThan(enemyHeldItemCt);
    expect(enemyPokemon.getEffectiveStat(Stat.SPD)).toBe(initialEnemySpeed * 2);
  });

  it("should activate when an item is stolen via defending ability", async () => {
    game.override.enemyAbility(AbilityId.PICKPOCKET).enemyHeldItems([]); // Remove opponent's full stacks of held items so it can steal player's held items
    await game.classicMode.startBattle([SpeciesId.TREECKO]);

    const playerPokemon = game.field.getPlayerPokemon();
    const playerHeldItems = getHeldItemCount(playerPokemon);
    const initialPlayerSpeed = playerPokemon.getStat(Stat.SPD);

    // Player's item gets stolen via ability Pickpocket
    game.move.select(MoveId.FALSE_SWIPE);
    await game.toNextTurn();

    expect(getHeldItemCount(playerPokemon)).toBeLessThan(playerHeldItems);
    expect(playerPokemon.getEffectiveStat(Stat.SPD)).toBe(initialPlayerSpeed * 2);
  });

  it("should activate when an item is stolen via move", async () => {
    game.override.moveset(MoveId.THIEF).startingHeldItems([]); // Remove player's full stacks of held items so it can steal opponent's held items
    await game.classicMode.startBattle([SpeciesId.TREECKO]);

    const enemyPokemon = game.field.getEnemyPokemon();
    const enemyHeldItemCt = getHeldItemCount(enemyPokemon);
    const initialEnemySpeed = enemyPokemon.getStat(Stat.SPD);

    // Player uses Thief and steals the opponent's item
    game.move.select(MoveId.THIEF);
    await game.toNextTurn();

    expect(getHeldItemCount(enemyPokemon)).toBeLessThan(enemyHeldItemCt);
    expect(enemyPokemon.getEffectiveStat(Stat.SPD)).toBe(initialEnemySpeed * 2);
  });

  it("should activate when an item is stolen via grip claw", async () => {
    game.override.startingHeldItems([{ name: "GRIP_CLAW", count: 1 }]);
    await game.classicMode.startBattle([SpeciesId.TREECKO]);

    const playerPokemon = game.field.getPlayerPokemon();
    const gripClaw = playerPokemon.getHeldItems()[0] as ContactHeldItemTransferChanceModifier;
    vi.spyOn(gripClaw, "chance", "get").mockReturnValue(100);

    const enemyPokemon = game.field.getEnemyPokemon();
    const enemyHeldItemCt = getHeldItemCount(enemyPokemon);
    const initialEnemySpeed = enemyPokemon.getStat(Stat.SPD);

    // Player steals the opponent's item using Grip Claw
    game.move.select(MoveId.FALSE_SWIPE);
    await game.toNextTurn();

    expect(getHeldItemCount(enemyPokemon)).toBeLessThan(enemyHeldItemCt);
    expect(enemyPokemon.getEffectiveStat(Stat.SPD)).toBe(initialEnemySpeed * 2);
  });

  it("should not activate when a neutralizing ability is present", async () => {
    game.override.enemyAbility(AbilityId.NEUTRALIZING_GAS).enemyMoveset(MoveId.FALSE_SWIPE);
    await game.classicMode.startBattle([SpeciesId.TREECKO]);

    const playerPokemon = game.field.getPlayerPokemon();
    const playerHeldItems = getHeldItemCount(playerPokemon);
    const initialPlayerSpeed = playerPokemon.getStat(Stat.SPD);

    // Player gets hit by False Swipe and eats Sitrus Berry, which should not trigger Unburden
    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    expect(getHeldItemCount(playerPokemon)).toBeLessThan(playerHeldItems);
    expect(playerPokemon.getEffectiveStat(Stat.SPD)).toBe(initialPlayerSpeed);
    expect(playerPokemon.getTag(BattlerTagType.UNBURDEN)).toBeUndefined();
  });

  it("should activate when a move that consumes a berry is used", async () => {
    game.override.moveset(MoveId.STUFF_CHEEKS);
    await game.classicMode.startBattle([SpeciesId.TREECKO]);

    const playerPokemon = game.field.getPlayerPokemon();
    const playerHeldItemCt = getHeldItemCount(playerPokemon);
    const initialPlayerSpeed = playerPokemon.getStat(Stat.SPD);

    // Player uses Stuff Cheeks and eats its own berry
    // Caution: Do not test this using opponent, there is a known issue where opponent can randomly generate with Salac Berry
    game.move.select(MoveId.STUFF_CHEEKS);
    await game.toNextTurn();

    expect(getHeldItemCount(playerPokemon)).toBeLessThan(playerHeldItemCt);
    expect(playerPokemon.getEffectiveStat(Stat.SPD)).toBe(initialPlayerSpeed * 2);
  });

  it("should deactivate temporarily when a neutralizing gas user is on the field", async () => {
    game.override.battleStyle("double").ability(AbilityId.NONE); // Disable ability override so that we can properly set abilities below
    await game.classicMode.startBattle([SpeciesId.TREECKO, SpeciesId.MEOWTH, SpeciesId.WEEZING]);

    const [treecko, _meowth, weezing] = game.scene.getPlayerParty();
    treecko.abilityIndex = 2; // Treecko has Unburden
    weezing.abilityIndex = 1; // Weezing has Neutralizing Gas
    const playerHeldItems = getHeldItemCount(treecko);
    const initialPlayerSpeed = treecko.getStat(Stat.SPD);

    // Turn 1: Treecko gets hit by False Swipe and eats Sitrus Berry, activating Unburden
    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.SPLASH, 1);
    await game.move.selectEnemyMove(MoveId.FALSE_SWIPE, 0);
    await game.move.selectEnemyMove(MoveId.FALSE_SWIPE, 0);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(getHeldItemCount(treecko)).toBeLessThan(playerHeldItems);
    expect(treecko.getEffectiveStat(Stat.SPD)).toBe(initialPlayerSpeed * 2);

    // Turn 2: Switch Meowth to Weezing, activating Neutralizing Gas
    await game.toNextTurn();
    game.move.select(MoveId.SPLASH);
    game.doSwitchPokemon(2);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(getHeldItemCount(treecko)).toBeLessThan(playerHeldItems);
    expect(treecko.getEffectiveStat(Stat.SPD)).toBe(initialPlayerSpeed);

    // Turn 3: Switch Weezing to Meowth, deactivating Neutralizing Gas
    await game.toNextTurn();
    game.move.select(MoveId.SPLASH);
    game.doSwitchPokemon(2);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(getHeldItemCount(treecko)).toBeLessThan(playerHeldItems);
    expect(treecko.getEffectiveStat(Stat.SPD)).toBe(initialPlayerSpeed * 2);
  });

  it("should not activate when passing a baton to a teammate switching in", async () => {
    game.override.startingHeldItems([{ name: "BATON" }]).moveset(MoveId.BATON_PASS);
    await game.classicMode.startBattle([SpeciesId.TREECKO, SpeciesId.PURRLOIN]);

    const [treecko, purrloin] = game.scene.getPlayerParty();
    const initialTreeckoSpeed = treecko.getStat(Stat.SPD);
    const initialPurrloinSpeed = purrloin.getStat(Stat.SPD);
    const unburdenAttr = treecko.getAbilityAttrs("PostItemLostAbAttr")[0];
    vi.spyOn(unburdenAttr, "apply");

    // Player uses Baton Pass, which also passes the Baton item
    game.move.select(MoveId.BATON_PASS);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    expect(getHeldItemCount(treecko)).toBe(0);
    expect(getHeldItemCount(purrloin)).toBe(1);
    expect(treecko.getEffectiveStat(Stat.SPD)).toBe(initialTreeckoSpeed);
    expect(purrloin.getEffectiveStat(Stat.SPD)).toBe(initialPurrloinSpeed);
    expect(unburdenAttr.apply).not.toHaveBeenCalled();
  });

  it("should not speed up a Pokemon after it loses the ability Unburden", async () => {
    game.override.enemyMoveset([MoveId.FALSE_SWIPE, MoveId.WORRY_SEED]);
    await game.classicMode.startBattle([SpeciesId.PURRLOIN]);

    const playerPokemon = game.field.getPlayerPokemon();
    const playerHeldItems = getHeldItemCount(playerPokemon);
    const initialPlayerSpeed = playerPokemon.getStat(Stat.SPD);

    // Turn 1: Get hit by False Swipe and eat Sitrus Berry, activating Unburden
    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.FALSE_SWIPE);
    await game.toNextTurn();

    expect(getHeldItemCount(playerPokemon)).toBeLessThan(playerHeldItems);
    expect(playerPokemon.getEffectiveStat(Stat.SPD)).toBe(initialPlayerSpeed * 2);

    // Turn 2: Get hit by Worry Seed, deactivating Unburden
    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.WORRY_SEED);
    await game.toNextTurn();

    expect(getHeldItemCount(playerPokemon)).toBeLessThan(playerHeldItems);
    expect(playerPokemon.getEffectiveStat(Stat.SPD)).toBe(initialPlayerSpeed);
  });

  it("should activate when a reviver seed is used", async () => {
    game.override.startingHeldItems([{ name: "REVIVER_SEED" }]).enemyMoveset([MoveId.WING_ATTACK]);
    await game.classicMode.startBattle([SpeciesId.TREECKO]);

    const playerPokemon = game.field.getPlayerPokemon();
    const playerHeldItems = getHeldItemCount(playerPokemon);
    const initialPlayerSpeed = playerPokemon.getStat(Stat.SPD);

    // Turn 1: Get hit by Wing Attack and faint, activating Reviver Seed
    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    expect(getHeldItemCount(playerPokemon)).toBeLessThan(playerHeldItems);
    expect(playerPokemon.getEffectiveStat(Stat.SPD)).toBe(initialPlayerSpeed * 2);
  });

  // test for `.bypassFaint()` - singles
  it("shouldn't persist when revived normally if activated while fainting", async () => {
    game.override.enemyMoveset([MoveId.SPLASH, MoveId.THIEF]);
    await game.classicMode.startBattle([SpeciesId.TREECKO, SpeciesId.FEEBAS]);

    const treecko = game.field.getPlayerPokemon();
    const treeckoInitialHeldItems = getHeldItemCount(treecko);
    const initialSpeed = treecko.getStat(Stat.SPD);

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.THIEF);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    game.doRevivePokemon(1);
    game.doSwitchPokemon(1);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    expect(game.field.getPlayerPokemon()).toBe(treecko);
    expect(getHeldItemCount(treecko)).toBeLessThan(treeckoInitialHeldItems);
    expect(treecko.getEffectiveStat(Stat.SPD)).toBe(initialSpeed);
  });

  // test for `.bypassFaint()` - doubles
  it("shouldn't persist when revived by revival blessing if activated while fainting", async () => {
    game.override
      .battleStyle("double")
      .enemyMoveset([MoveId.SPLASH, MoveId.THIEF])
      .moveset([MoveId.SPLASH, MoveId.REVIVAL_BLESSING])
      .startingHeldItems([{ name: "WIDE_LENS" }]);
    await game.classicMode.startBattle([SpeciesId.TREECKO, SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

    const treecko = game.scene.getPlayerField()[0];
    const treeckoInitialHeldItems = getHeldItemCount(treecko);
    const initialSpeed = treecko.getStat(Stat.SPD);

    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.REVIVAL_BLESSING, 1);
    await game.move.selectEnemyMove(MoveId.THIEF, BattlerIndex.PLAYER);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2]);
    game.doSelectPartyPokemon(0, "RevivalBlessingPhase");
    await game.toNextTurn();

    expect(game.scene.getPlayerField()[0]).toBe(treecko);
    expect(getHeldItemCount(treecko)).toBeLessThan(treeckoInitialHeldItems);
    expect(treecko.getEffectiveStat(Stat.SPD)).toBe(initialSpeed);
  });
});
