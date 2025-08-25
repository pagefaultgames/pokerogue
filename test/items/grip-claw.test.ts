import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BerryType } from "#enums/berry-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import type { Pokemon } from "#field/pokemon";
import type { ContactHeldItemTransferChanceModifier } from "#modifiers/modifier";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Items - Grip Claw", () => {
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
      .battleStyle("double")
      .moveset([MoveId.TACKLE, MoveId.SPLASH, MoveId.ATTRACT])
      .startingHeldItems([{ name: "GRIP_CLAW", count: 1 }])
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyAbility(AbilityId.UNNERVE)
      .ability(AbilityId.UNNERVE)
      .enemyMoveset(MoveId.SPLASH)
      .enemyHeldItems([
        { name: "BERRY", type: BerryType.SITRUS, count: 2 },
        { name: "BERRY", type: BerryType.LUM, count: 2 },
      ])
      .enemyLevel(100);
  });

  it("should steal items on contact and only from the attack target", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

    const [playerPokemon] = game.scene.getPlayerField();

    const gripClaw = playerPokemon.getHeldItems()[0] as ContactHeldItemTransferChanceModifier;
    vi.spyOn(gripClaw, "chance", "get").mockReturnValue(100);

    const enemyPokemon = game.scene.getEnemyField();

    const playerHeldItemCount = getHeldItemCount(playerPokemon);
    const enemy1HeldItemCount = getHeldItemCount(enemyPokemon[0]);
    const enemy2HeldItemCount = getHeldItemCount(enemyPokemon[1]);
    expect(enemy2HeldItemCount).toBeGreaterThan(0);

    game.move.select(MoveId.TACKLE, 0, BattlerIndex.ENEMY_2);
    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to("BerryPhase", false);

    const playerHeldItemCountAfter = getHeldItemCount(playerPokemon);
    const enemy1HeldItemCountsAfter = getHeldItemCount(enemyPokemon[0]);
    const enemy2HeldItemCountsAfter = getHeldItemCount(enemyPokemon[1]);

    expect(playerHeldItemCountAfter).toBe(playerHeldItemCount + 1);
    expect(enemy1HeldItemCountsAfter).toBe(enemy1HeldItemCount);
    expect(enemy2HeldItemCountsAfter).toBe(enemy2HeldItemCount - 1);
  });

  it("should not steal items when using a targetted, non attack move", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

    const [playerPokemon] = game.scene.getPlayerField();

    const gripClaw = playerPokemon.getHeldItems()[0] as ContactHeldItemTransferChanceModifier;
    vi.spyOn(gripClaw, "chance", "get").mockReturnValue(100);

    const enemyPokemon = game.scene.getEnemyField();

    const playerHeldItemCount = getHeldItemCount(playerPokemon);
    const enemy1HeldItemCount = getHeldItemCount(enemyPokemon[0]);
    const enemy2HeldItemCount = getHeldItemCount(enemyPokemon[1]);
    expect(enemy2HeldItemCount).toBeGreaterThan(0);

    game.move.select(MoveId.ATTRACT, 0, BattlerIndex.ENEMY_2);
    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to("BerryPhase", false);

    const playerHeldItemCountAfter = getHeldItemCount(playerPokemon);
    const enemy1HeldItemCountsAfter = getHeldItemCount(enemyPokemon[0]);
    const enemy2HeldItemCountsAfter = getHeldItemCount(enemyPokemon[1]);

    expect(playerHeldItemCountAfter).toBe(playerHeldItemCount);
    expect(enemy1HeldItemCountsAfter).toBe(enemy1HeldItemCount);
    expect(enemy2HeldItemCountsAfter).toBe(enemy2HeldItemCount);
  });

  it("should not allow Pollen Puff to steal items when healing ally", async () => {
    game.override
      .battleStyle("double")
      .moveset([MoveId.POLLEN_PUFF, MoveId.ENDURE])
      .startingHeldItems([
        { name: "GRIP_CLAW", count: 1 },
        { name: "BERRY", type: BerryType.LUM, count: 1 },
      ]);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.OMANYTE]);

    const [leftPokemon, rightPokemon] = game.scene.getPlayerField();

    const gripClaw = leftPokemon.getHeldItems()[0] as ContactHeldItemTransferChanceModifier;
    vi.spyOn(gripClaw, "chance", "get").mockReturnValue(100);

    const heldItemCountBefore = getHeldItemCount(rightPokemon);

    game.move.select(MoveId.POLLEN_PUFF, 0, BattlerIndex.PLAYER_2);
    game.move.select(MoveId.ENDURE, 1);

    await game.toNextTurn();

    expect(getHeldItemCount(rightPokemon)).toBe(heldItemCountBefore);
  });
});

/*
 * Gets the total number of items a Pokemon holds
 */
function getHeldItemCount(pokemon: Pokemon) {
  return pokemon.getHeldItems().reduce((currentTotal, item) => currentTotal + item.getStackCount(), 0);
}
