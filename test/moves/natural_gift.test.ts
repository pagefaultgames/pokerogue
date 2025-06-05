import { MoveId } from "#enums/move-id";
import { BattlerIndex } from "#app/battle";
import { SpeciesId } from "#enums/species-id";
import { AbilityId } from "#enums/ability-id";
import { MoveResult } from "#app/field/pokemon";
import type Pokemon from "#app/field/pokemon";
import { BerryType } from "#enums/berry-type";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NaturalGiftBerrySelector } from "#app/data/moves/move";

describe("MoveId - Natural Gift", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  /**
   * Count the number of held items a Pokemon has, accounting for stacks of multiple items.
   */
  function getHeldItemCount(pokemon: Pokemon): number {
    return pokemon.getHeldItems().reduce((count, item) => count + item.getStackCount(), 0);
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
      .disableCrits()
      .moveset(MoveId.NATURAL_GIFT)
      .ability(AbilityId.BALL_FETCH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.RATTATA)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(10)
      .enemyLevel(100);
  });

  /**
   * There is currently no way to test interaction with heavy rain(Weather), harsh sunlight(Weather) and Powder(Move)
   * since there are currently no berries that change the type to Fire/Water
   */
  it("should deal double damage to Fighting type if Sitrus Berry is consumed", async () => {
    game.override
      .startingHeldItems([{ name: "BERRY", type: BerryType.SITRUS, count: 3 }])
      .enemySpecies(SpeciesId.MACHAMP);

    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);
    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    const effectivenessSpy = vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.NATURAL_GIFT);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    expect(getHeldItemCount(player)).toBe(2);
    expect(effectivenessSpy).toHaveReturnedWith(2);
  });

  it("should deal half damage to Steel type if Sitrus Berry is consumed", async () => {
    game.override
      .startingHeldItems([{ name: "BERRY", type: BerryType.SITRUS, count: 3 }])
      .enemySpecies(SpeciesId.KLINK);

    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);
    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    const effectivenessSpy = vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.NATURAL_GIFT);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    expect(getHeldItemCount(player)).toBe(2);
    expect(effectivenessSpy).toHaveReturnedWith(0.5);
  });

  it("should consume still held berry on miss", async () => {
    game.override.startingHeldItems([{ name: "BERRY", type: BerryType.SITRUS, count: 3 }]);

    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    game.move.select(MoveId.NATURAL_GIFT);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceMiss();
    await game.toNextTurn();

    const player = game.field.getPlayerPokemon();
    expect(player.getLastXMoves()[0].result).toBe(MoveResult.MISS);
    expect(getHeldItemCount(player)).toBe(2);
  });

  it("should consume 1 berry after the final hit of multi-strike moves", async () => {
    game.override
      .startingHeldItems([
        { name: "BERRY", type: BerryType.SITRUS, count: 3 },
        { name: "MULTI_LENS", count: 2 },
      ])
      .ability(AbilityId.PARENTAL_BOND);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    const player = game.field.getPlayerPokemon();

    game.move.select(MoveId.NATURAL_GIFT);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    // hit 1
    await game.phaseInterceptor.to("MoveEffectPhase");
    expect(getHeldItemCount(player)).toBe(5);

    // hit 2
    await game.phaseInterceptor.to("MoveEffectPhase");
    expect(getHeldItemCount(player)).toBe(5);

    // hit 3
    await game.phaseInterceptor.to("MoveEffectPhase");
    expect(getHeldItemCount(player)).toBe(5);

    // hit 4 (last)
    await game.phaseInterceptor.to("MoveEffectPhase");
    expect(getHeldItemCount(player)).toBe(4);
  });

  /**
   * Ganlon Berry should turn Natural Gift to Ice type (1/2x dmg to Water type).
   * With Electrify Natural Gift should deal 2x dmg to Water type
   */
  it("should not override Electrify (deal double damage against Water pkm with Ganlon Berry)", async () => {
    game.override
      .startingHeldItems([{ name: "BERRY", type: BerryType.GANLON, count: 3 }])
      .enemySpecies(SpeciesId.MAGIKARP);

    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);
    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    const effectivenessSpy = vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.NATURAL_GIFT);
    await game.move.forceEnemyMove(MoveId.ELECTRIFY);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(getHeldItemCount(player)).toBe(2);
    expect(effectivenessSpy).toHaveReturnedWith(2);
  });

  it("should fail if no berries are held", async () => {
    game.override.startingHeldItems([]);

    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);
    const player = game.field.getPlayerPokemon();

    game.move.select(MoveId.NATURAL_GIFT);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    expect(player.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should not be affected by Normalize", async () => {
    game.override
      .startingHeldItems([{ name: "BERRY", type: BerryType.SITRUS, count: 3 }])
      .ability(AbilityId.NORMALIZE)
      .enemySpecies(SpeciesId.MACHAMP);

    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();
    expect(getHeldItemCount(player)).toBe(3);
    const effectivenessSpy = vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.NATURAL_GIFT);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    expect(getHeldItemCount(player)).toBe(2);
    expect(effectivenessSpy).toHaveReturnedWith(2);
  });

  it("should clear BerryType once successfully used", async () => {
    game.override
      .startingHeldItems([{ name: "BERRY", type: BerryType.SITRUS, count: 3 }])
      .enemySpecies(SpeciesId.MACHAMP);

    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);
    const player = game.field.getPlayerPokemon();
    expect(getHeldItemCount(player)).toBe(3);

    game.move.select(MoveId.NATURAL_GIFT);
    await game.toNextTurn();

    expect(NaturalGiftBerrySelector.getSelectedBerry()).toBeFalsy();
  });

  it("should not count as consuming a berry for Belch", async () => {
    game.override.startingHeldItems([{ name: "BERRY", type: BerryType.ENIGMA, count: 1 }]);
    await game.classicMode.startBattle([SpeciesId.ABOMASNOW]);

    game.move.select(MoveId.NATURAL_GIFT);
    await game.toNextTurn();

    const player = game.field.getPlayerPokemon();
    expect(getHeldItemCount(player)).toBe(0);
    expect(player.battleData.hasEatenBerry).toBe(false);

    game.move.use(MoveId.BELCH);
    await game.toNextTurn();

    expect(player.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  // TODO: Implement if/when berries for fire/water types are added
  it.todo.each<{ name: string /* berry: BerryType, */; move?: MoveId; ability?: AbilityId }>([
    { name: "Harsh Sunlight", ability: AbilityId.DESOLATE_LAND },
    { name: "Heavy Rain", ability: AbilityId.PRIMORDIAL_SEA },
    { name: "Powder", move: MoveId.POWDER },
  ])("should not consume a held berry if interrupted by $name", async () => {});
});
