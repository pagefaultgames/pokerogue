import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

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
      .startingHeldItems([{ entry: HeldItemId.GRIP_CLAW }])
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyAbility(AbilityId.UNNERVE)
      .ability(AbilityId.UNNERVE)
      .enemyMoveset(MoveId.SPLASH)
      .enemyHeldItems([
        { entry: HeldItemId.SITRUS_BERRY, count: 2 },
        { entry: HeldItemId.LUM_BERRY, count: 2 },
      ])
      .enemyLevel(100);
  });

  it("should steal items on contact and only from the attack target", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.scene.getEnemyField();
    playerPokemon.heldItemManager.setStack(HeldItemId.GRIP_CLAW, 10);

    const playerHeldItemCount = playerPokemon.heldItemManager.getHeldItemCount();
    const enemy1HeldItemCount = enemyPokemon[0].heldItemManager.getHeldItemCount();
    const enemy2HeldItemCount = enemyPokemon[1].heldItemManager.getHeldItemCount();
    expect(enemy2HeldItemCount).toBeGreaterThan(0);

    game.move.select(MoveId.TACKLE, 0, BattlerIndex.ENEMY_2);
    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to("BerryPhase", false);

    const playerHeldItemCountAfter = playerPokemon.heldItemManager.getHeldItemCount();
    const enemy1HeldItemCountsAfter = enemyPokemon[0].heldItemManager.getHeldItemCount();
    const enemy2HeldItemCountsAfter = enemyPokemon[1].heldItemManager.getHeldItemCount();

    expect(playerHeldItemCountAfter).toBe(playerHeldItemCount + 1);
    expect(enemy1HeldItemCountsAfter).toBe(enemy1HeldItemCount);
    expect(enemy2HeldItemCountsAfter).toBe(enemy2HeldItemCount - 1);
  });

  it("should not steal items when using a targetted, non attack move", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.scene.getEnemyField();

    const playerHeldItemCount = playerPokemon.heldItemManager.getHeldItemCount();
    const enemy1HeldItemCount = enemyPokemon[0].heldItemManager.getHeldItemCount();
    const enemy2HeldItemCount = enemyPokemon[1].heldItemManager.getHeldItemCount();
    expect(enemy2HeldItemCount).toBeGreaterThan(0);

    game.move.select(MoveId.ATTRACT, 0, BattlerIndex.ENEMY_2);
    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to("BerryPhase", false);

    const playerHeldItemCountAfter = playerPokemon.heldItemManager.getHeldItemCount();
    const enemy1HeldItemCountsAfter = enemyPokemon[0].heldItemManager.getHeldItemCount();
    const enemy2HeldItemCountsAfter = enemyPokemon[1].heldItemManager.getHeldItemCount();

    expect(playerHeldItemCountAfter).toBe(playerHeldItemCount);
    expect(enemy1HeldItemCountsAfter).toBe(enemy1HeldItemCount);
    expect(enemy2HeldItemCountsAfter).toBe(enemy2HeldItemCount);
  });

  it("should not allow Pollen Puff to steal items when healing ally", async () => {
    game.override
      .battleStyle("double")
      .moveset([MoveId.POLLEN_PUFF, MoveId.ENDURE])
      .startingHeldItems([{ entry: HeldItemId.GRIP_CLAW }, { entry: HeldItemId.LUM_BERRY }]);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.OMANYTE]);

    const [leftPokemon, rightPokemon] = game.scene.getPlayerField();
    leftPokemon.heldItemManager.setStack(HeldItemId.GRIP_CLAW, 10);

    const heldItemCountBefore = rightPokemon.heldItemManager.getHeldItemCount();

    game.move.select(MoveId.POLLEN_PUFF, 0, BattlerIndex.PLAYER_2);
    game.move.select(MoveId.ENDURE, 1);

    await game.toNextTurn();

    expect(rightPokemon.heldItemManager.getHeldItemCount()).toBe(heldItemCountBefore);
  });
});
