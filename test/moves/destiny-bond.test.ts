import type { EntryHazardTag } from "#data/arena-tag";
import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { PokemonInstantReviveModifier } from "#modifiers/modifier";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Destiny Bond", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  const defaultParty = [SpeciesId.BULBASAUR, SpeciesId.SQUIRTLE];
  const enemyFirst = [BattlerIndex.ENEMY, BattlerIndex.PLAYER];
  const playerFirst = [BattlerIndex.PLAYER, BattlerIndex.ENEMY];

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
      .ability(AbilityId.UNNERVE) // Pre-emptively prevent flakiness from opponent berries
      .enemySpecies(SpeciesId.RATTATA)
      .enemyAbility(AbilityId.RUN_AWAY)
      .startingLevel(100) // Make sure tested moves KO
      .enemyLevel(5)
      .enemyMoveset(MoveId.DESTINY_BOND);
  });

  it("should KO the opponent on the same turn", async () => {
    const moveToUse = MoveId.TACKLE;

    game.override.moveset(moveToUse);
    await game.classicMode.startBattle(defaultParty);

    const enemyPokemon = game.field.getEnemyPokemon();
    const playerPokemon = game.field.getPlayerPokemon();

    game.move.select(moveToUse);
    await game.setTurnOrder(enemyFirst);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemyPokemon.isFainted()).toBe(true);
    expect(playerPokemon.isFainted()).toBe(true);
  });

  it("should KO the opponent on the next turn", async () => {
    const moveToUse = MoveId.TACKLE;

    game.override.moveset([MoveId.SPLASH, moveToUse]);
    await game.classicMode.startBattle(defaultParty);

    const enemyPokemon = game.field.getEnemyPokemon();
    const playerPokemon = game.field.getPlayerPokemon();

    // Turn 1: Enemy uses Destiny Bond and doesn't faint
    game.move.select(MoveId.SPLASH);
    await game.setTurnOrder(playerFirst);
    await game.toNextTurn();

    expect(enemyPokemon.isFainted()).toBe(false);
    expect(enemyPokemon.isFainted()).toBe(false);

    // Turn 2: Player KO's the enemy before the enemy's turn
    game.move.select(moveToUse);
    await game.setTurnOrder(playerFirst);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemyPokemon.isFainted()).toBe(true);
    expect(playerPokemon.isFainted()).toBe(true);
  });

  it("should fail if used twice in a row", async () => {
    const moveToUse = MoveId.TACKLE;

    game.override.moveset([MoveId.SPLASH, moveToUse]);
    await game.classicMode.startBattle(defaultParty);

    const enemyPokemon = game.field.getEnemyPokemon();
    const playerPokemon = game.field.getPlayerPokemon();

    // Turn 1: Enemy uses Destiny Bond and doesn't faint
    game.move.select(MoveId.SPLASH);
    await game.setTurnOrder(enemyFirst);
    await game.toNextTurn();

    expect(enemyPokemon.isFainted()).toBe(false);
    expect(enemyPokemon.isFainted()).toBe(false);

    // Turn 2: Enemy should fail Destiny Bond then get KO'd
    game.move.select(moveToUse);
    await game.setTurnOrder(enemyFirst);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemyPokemon.isFainted()).toBe(true);
    expect(playerPokemon.isFainted()).toBe(false);
  });

  it("should not KO the opponent if the user dies to weather", async () => {
    // Opponent will be reduced to 1 HP by False Swipe, then faint to Sandstorm
    const moveToUse = MoveId.FALSE_SWIPE;

    game.override.moveset(moveToUse).ability(AbilityId.SAND_STREAM);
    await game.classicMode.startBattle(defaultParty);

    const enemyPokemon = game.field.getEnemyPokemon();
    const playerPokemon = game.field.getPlayerPokemon();

    game.move.select(moveToUse);
    await game.setTurnOrder(enemyFirst);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemyPokemon.isFainted()).toBe(true);
    expect(playerPokemon.isFainted()).toBe(false);
  });

  it("should not KO the opponent if the user had another turn", async () => {
    const moveToUse = MoveId.TACKLE;

    game.override.moveset([MoveId.SPORE, moveToUse]);
    await game.classicMode.startBattle(defaultParty);

    const enemyPokemon = game.field.getEnemyPokemon();
    const playerPokemon = game.field.getPlayerPokemon();

    // Turn 1: Enemy uses Destiny Bond and doesn't faint
    game.move.select(MoveId.SPORE);
    await game.setTurnOrder(enemyFirst);
    await game.toNextTurn();

    expect(enemyPokemon.isFainted()).toBe(false);
    expect(playerPokemon.isFainted()).toBe(false);
    expect(enemyPokemon.status?.effect).toBe(StatusEffect.SLEEP);

    // Turn 2: Enemy should skip a turn due to sleep, then get KO'd
    game.move.select(moveToUse);
    await game.setTurnOrder(enemyFirst);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemyPokemon.isFainted()).toBe(true);
    expect(playerPokemon.isFainted()).toBe(false);
  });

  it("should not KO an ally", async () => {
    game.override.moveset([MoveId.DESTINY_BOND, MoveId.CRUNCH]).battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.SHEDINJA, SpeciesId.BULBASAUR, SpeciesId.SQUIRTLE]);

    const enemyPokemon0 = game.scene.getEnemyField()[0];
    const enemyPokemon1 = game.scene.getEnemyField()[1];
    const playerPokemon0 = game.scene.getPlayerField()[0];
    const playerPokemon1 = game.scene.getPlayerField()[1];

    // Shedinja uses Destiny Bond, then ally Bulbasaur KO's Shedinja with Crunch
    game.move.select(MoveId.DESTINY_BOND, 0);
    game.move.select(MoveId.CRUNCH, 1, BattlerIndex.PLAYER);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemyPokemon0.isFainted()).toBe(false);
    expect(enemyPokemon1.isFainted()).toBe(false);
    expect(playerPokemon0.isFainted()).toBe(true);
    expect(playerPokemon1.isFainted()).toBe(false);
  });

  it("should not cause a crash if the user is KO'd by Ceaseless Edge", async () => {
    const moveToUse = MoveId.CEASELESS_EDGE;
    vi.spyOn(allMoves[moveToUse], "accuracy", "get").mockReturnValue(100);

    game.override.moveset(moveToUse);
    await game.classicMode.startBattle(defaultParty);

    const enemyPokemon = game.field.getEnemyPokemon();
    const playerPokemon = game.field.getPlayerPokemon();

    game.move.select(moveToUse);
    await game.setTurnOrder(enemyFirst);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemyPokemon.isFainted()).toBe(true);
    expect(playerPokemon.isFainted()).toBe(true);

    // Ceaseless Edge spikes effect should still activate
    const tagAfter = game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.ENEMY) as EntryHazardTag;
    expect(tagAfter.tagType).toBe(ArenaTagType.SPIKES);
    expect(tagAfter.layers).toBe(1);
  });

  it("should not cause a crash if the user is KO'd by Pledge moves", async () => {
    game.override.moveset([MoveId.GRASS_PLEDGE, MoveId.WATER_PLEDGE]).battleStyle("double");
    await game.classicMode.startBattle(defaultParty);

    const enemyPokemon0 = game.scene.getEnemyField()[0];
    const enemyPokemon1 = game.scene.getEnemyField()[1];
    const playerPokemon0 = game.scene.getPlayerField()[0];
    const playerPokemon1 = game.scene.getPlayerField()[1];

    game.move.select(MoveId.GRASS_PLEDGE, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.WATER_PLEDGE, 1, BattlerIndex.ENEMY);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemyPokemon0?.isFainted()).toBe(true);
    expect(enemyPokemon1?.isFainted()).toBe(false);
    expect(playerPokemon0?.isFainted()).toBe(false);
    expect(playerPokemon1?.isFainted()).toBe(true);

    // Pledge secondary effect should still activate
    const tagAfter = game.scene.arena.getTagOnSide(
      ArenaTagType.GRASS_WATER_PLEDGE,
      ArenaTagSide.ENEMY,
    ) as EntryHazardTag;
    expect(tagAfter.tagType).toBe(ArenaTagType.GRASS_WATER_PLEDGE);
  });

  /**
   * In particular, this should prevent something like
   * {@link https://github.com/pagefaultgames/pokerogue/issues/4219}
   * from occurring with fainting by KO'ing a Destiny Bond user with U-Turn.
   */
  it("should not allow the opponent to revive via Reviver Seed", async () => {
    const moveToUse = MoveId.TACKLE;

    game.override.moveset(moveToUse).startingHeldItems([{ name: "REVIVER_SEED" }]);
    await game.classicMode.startBattle(defaultParty);

    const enemyPokemon = game.field.getEnemyPokemon();
    const playerPokemon = game.field.getPlayerPokemon();

    game.move.select(moveToUse);
    await game.setTurnOrder(enemyFirst);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemyPokemon.isFainted()).toBe(true);
    expect(playerPokemon.isFainted()).toBe(true);

    // Check that the Tackle user's Reviver Seed did not activate
    const revSeeds = game.scene
      .getModifiers(PokemonInstantReviveModifier)
      .filter(m => m.pokemonId === playerPokemon.id);
    expect(revSeeds.length).toBe(1);
  });
});
