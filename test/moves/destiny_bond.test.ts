import type { ArenaTrapTag } from "#app/data/arena-tag";
import { ArenaTagSide } from "#app/data/arena-tag";
import { allMoves } from "#app/data/moves/move";
import { Abilities } from "#enums/abilities";
import { ArenaTagType } from "#enums/arena-tag-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { BattlerIndex } from "#app/battle";
import { StatusEffect } from "#enums/status-effect";
import { PokemonInstantReviveModifier } from "#app/modifier/modifier";

describe("Moves - Destiny Bond", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  const defaultParty = [Species.BULBASAUR, Species.SQUIRTLE];
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
      .ability(Abilities.UNNERVE) // Pre-emptively prevent flakiness from opponent berries
      .enemySpecies(Species.RATTATA)
      .enemyAbility(Abilities.RUN_AWAY)
      .startingLevel(100) // Make sure tested moves KO
      .enemyLevel(5)
      .enemyMoveset(Moves.DESTINY_BOND);
  });

  it("should KO the opponent on the same turn", async () => {
    const moveToUse = Moves.TACKLE;

    game.override.moveset(moveToUse);
    await game.classicMode.startBattle(defaultParty);

    const enemyPokemon = game.scene.getEnemyPokemon();
    const playerPokemon = game.scene.getPlayerPokemon();

    game.move.select(moveToUse);
    await game.setTurnOrder(enemyFirst);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemyPokemon?.isFainted()).toBe(true);
    expect(playerPokemon?.isFainted()).toBe(true);
  });

  it("should KO the opponent on the next turn", async () => {
    const moveToUse = Moves.TACKLE;

    game.override.moveset([Moves.SPLASH, moveToUse]);
    await game.classicMode.startBattle(defaultParty);

    const enemyPokemon = game.scene.getEnemyPokemon();
    const playerPokemon = game.scene.getPlayerPokemon();

    // Turn 1: Enemy uses Destiny Bond and doesn't faint
    game.move.select(Moves.SPLASH);
    await game.setTurnOrder(playerFirst);
    await game.toNextTurn();

    expect(enemyPokemon?.isFainted()).toBe(false);
    expect(playerPokemon?.isFainted()).toBe(false);

    // Turn 2: Player KO's the enemy before the enemy's turn
    game.move.select(moveToUse);
    await game.setTurnOrder(playerFirst);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemyPokemon?.isFainted()).toBe(true);
    expect(playerPokemon?.isFainted()).toBe(true);
  });

  it("should fail if used twice in a row", async () => {
    const moveToUse = Moves.TACKLE;

    game.override.moveset([Moves.SPLASH, moveToUse]);
    await game.classicMode.startBattle(defaultParty);

    const enemyPokemon = game.scene.getEnemyPokemon();
    const playerPokemon = game.scene.getPlayerPokemon();

    // Turn 1: Enemy uses Destiny Bond and doesn't faint
    game.move.select(Moves.SPLASH);
    await game.setTurnOrder(enemyFirst);
    await game.toNextTurn();

    expect(enemyPokemon?.isFainted()).toBe(false);
    expect(playerPokemon?.isFainted()).toBe(false);

    // Turn 2: Enemy should fail Destiny Bond then get KO'd
    game.move.select(moveToUse);
    await game.setTurnOrder(enemyFirst);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemyPokemon?.isFainted()).toBe(true);
    expect(playerPokemon?.isFainted()).toBe(false);
  });

  it("should not KO the opponent if the user dies to weather", async () => {
    // Opponent will be reduced to 1 HP by False Swipe, then faint to Sandstorm
    const moveToUse = Moves.FALSE_SWIPE;

    game.override.moveset(moveToUse).ability(Abilities.SAND_STREAM);
    await game.classicMode.startBattle(defaultParty);

    const enemyPokemon = game.scene.getEnemyPokemon();
    const playerPokemon = game.scene.getPlayerPokemon();

    game.move.select(moveToUse);
    await game.setTurnOrder(enemyFirst);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemyPokemon?.isFainted()).toBe(true);
    expect(playerPokemon?.isFainted()).toBe(false);
  });

  it("should not KO the opponent if the user had another turn", async () => {
    const moveToUse = Moves.TACKLE;

    game.override.moveset([Moves.SPORE, moveToUse]);
    await game.classicMode.startBattle(defaultParty);

    const enemyPokemon = game.scene.getEnemyPokemon();
    const playerPokemon = game.scene.getPlayerPokemon();

    // Turn 1: Enemy uses Destiny Bond and doesn't faint
    game.move.select(Moves.SPORE);
    await game.setTurnOrder(enemyFirst);
    await game.toNextTurn();

    expect(enemyPokemon?.isFainted()).toBe(false);
    expect(playerPokemon?.isFainted()).toBe(false);
    expect(enemyPokemon?.status?.effect).toBe(StatusEffect.SLEEP);

    // Turn 2: Enemy should skip a turn due to sleep, then get KO'd
    game.move.select(moveToUse);
    await game.setTurnOrder(enemyFirst);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemyPokemon?.isFainted()).toBe(true);
    expect(playerPokemon?.isFainted()).toBe(false);
  });

  it("should not KO an ally", async () => {
    game.override.moveset([Moves.DESTINY_BOND, Moves.CRUNCH]).battleStyle("double");
    await game.classicMode.startBattle([Species.SHEDINJA, Species.BULBASAUR, Species.SQUIRTLE]);

    const enemyPokemon0 = game.scene.getEnemyField()[0];
    const enemyPokemon1 = game.scene.getEnemyField()[1];
    const playerPokemon0 = game.scene.getPlayerField()[0];
    const playerPokemon1 = game.scene.getPlayerField()[1];

    // Shedinja uses Destiny Bond, then ally Bulbasaur KO's Shedinja with Crunch
    game.move.select(Moves.DESTINY_BOND, 0);
    game.move.select(Moves.CRUNCH, 1, BattlerIndex.PLAYER);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemyPokemon0?.isFainted()).toBe(false);
    expect(enemyPokemon1?.isFainted()).toBe(false);
    expect(playerPokemon0?.isFainted()).toBe(true);
    expect(playerPokemon1?.isFainted()).toBe(false);
  });

  it("should not cause a crash if the user is KO'd by Ceaseless Edge", async () => {
    const moveToUse = Moves.CEASELESS_EDGE;
    vi.spyOn(allMoves[moveToUse], "accuracy", "get").mockReturnValue(100);

    game.override.moveset(moveToUse);
    await game.classicMode.startBattle(defaultParty);

    const enemyPokemon = game.scene.getEnemyPokemon();
    const playerPokemon = game.scene.getPlayerPokemon();

    game.move.select(moveToUse);
    await game.setTurnOrder(enemyFirst);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemyPokemon?.isFainted()).toBe(true);
    expect(playerPokemon?.isFainted()).toBe(true);

    // Ceaseless Edge spikes effect should still activate
    const tagAfter = game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.ENEMY) as ArenaTrapTag;
    expect(tagAfter.tagType).toBe(ArenaTagType.SPIKES);
    expect(tagAfter.layers).toBe(1);
  });

  it("should not cause a crash if the user is KO'd by Pledge moves", async () => {
    game.override.moveset([Moves.GRASS_PLEDGE, Moves.WATER_PLEDGE]).battleStyle("double");
    await game.classicMode.startBattle(defaultParty);

    const enemyPokemon0 = game.scene.getEnemyField()[0];
    const enemyPokemon1 = game.scene.getEnemyField()[1];
    const playerPokemon0 = game.scene.getPlayerField()[0];
    const playerPokemon1 = game.scene.getPlayerField()[1];

    game.move.select(Moves.GRASS_PLEDGE, 0, BattlerIndex.ENEMY);
    game.move.select(Moves.WATER_PLEDGE, 1, BattlerIndex.ENEMY);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemyPokemon0?.isFainted()).toBe(true);
    expect(enemyPokemon1?.isFainted()).toBe(false);
    expect(playerPokemon0?.isFainted()).toBe(false);
    expect(playerPokemon1?.isFainted()).toBe(true);

    // Pledge secondary effect should still activate
    const tagAfter = game.scene.arena.getTagOnSide(ArenaTagType.GRASS_WATER_PLEDGE, ArenaTagSide.ENEMY) as ArenaTrapTag;
    expect(tagAfter.tagType).toBe(ArenaTagType.GRASS_WATER_PLEDGE);
  });

  /**
   * In particular, this should prevent something like
   * {@link https://github.com/pagefaultgames/pokerogue/issues/4219}
   * from occurring with fainting by KO'ing a Destiny Bond user with U-Turn.
   */
  it("should not allow the opponent to revive via Reviver Seed", async () => {
    const moveToUse = Moves.TACKLE;

    game.override.moveset(moveToUse).startingHeldItems([{ name: "REVIVER_SEED" }]);
    await game.classicMode.startBattle(defaultParty);

    const enemyPokemon = game.scene.getEnemyPokemon();
    const playerPokemon = game.scene.getPlayerPokemon();

    game.move.select(moveToUse);
    await game.setTurnOrder(enemyFirst);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemyPokemon?.isFainted()).toBe(true);
    expect(playerPokemon?.isFainted()).toBe(true);

    // Check that the Tackle user's Reviver Seed did not activate
    const revSeeds = game.scene
      .getModifiers(PokemonInstantReviveModifier)
      .filter(m => m.pokemonId === playerPokemon?.id);
    expect(revSeeds.length).toBe(1);
  });
});
