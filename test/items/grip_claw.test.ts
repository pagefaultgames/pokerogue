import { BattlerIndex } from "#app/battle";
import type Pokemon from "#app/field/pokemon";
import type { ContactHeldItemTransferChanceModifier } from "#app/modifier/modifier";
import { Abilities } from "#enums/abilities";
import { BerryType } from "#enums/berry-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phase from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Items - Grip Claw", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phase.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);

    game.override
      .battleType("double")
      .moveset([Moves.TACKLE, Moves.SPLASH, Moves.ATTRACT])
      .startingHeldItems([{ name: "GRIP_CLAW", count: 1 }])
      .enemySpecies(Species.SNORLAX)
      .enemyAbility(Abilities.UNNERVE)
      .ability(Abilities.UNNERVE)
      .enemyMoveset(Moves.SPLASH)
      .enemyHeldItems([
        { name: "BERRY", type: BerryType.SITRUS, count: 2 },
        { name: "BERRY", type: BerryType.LUM, count: 2 },
      ])
      .enemyLevel(100);
  });

  it("should steal items on contact and only from the attack target", async () => {
    await game.classicMode.startBattle([Species.FEEBAS, Species.MILOTIC]);

    const [playerPokemon] = game.scene.getPlayerField();

    const gripClaw = playerPokemon.getHeldItems()[0] as ContactHeldItemTransferChanceModifier;
    vi.spyOn(gripClaw, "chance", "get").mockReturnValue(100);

    const enemyPokemon = game.scene.getEnemyField();

    const playerHeldItemCount = getHeldItemCount(playerPokemon);
    const enemy1HeldItemCount = getHeldItemCount(enemyPokemon[0]);
    const enemy2HeldItemCount = getHeldItemCount(enemyPokemon[1]);
    expect(enemy2HeldItemCount).toBeGreaterThan(0);

    game.move.select(Moves.TACKLE, 0, BattlerIndex.ENEMY_2);
    game.move.select(Moves.SPLASH, 1);

    await game.phaseInterceptor.to("BerryPhase", false);

    const playerHeldItemCountAfter = getHeldItemCount(playerPokemon);
    const enemy1HeldItemCountsAfter = getHeldItemCount(enemyPokemon[0]);
    const enemy2HeldItemCountsAfter = getHeldItemCount(enemyPokemon[1]);

    expect(playerHeldItemCountAfter).toBe(playerHeldItemCount + 1);
    expect(enemy1HeldItemCountsAfter).toBe(enemy1HeldItemCount);
    expect(enemy2HeldItemCountsAfter).toBe(enemy2HeldItemCount - 1);
  });

  it("should not steal items when using a targetted, non attack move", async () => {
    await game.classicMode.startBattle([Species.FEEBAS, Species.MILOTIC]);

    const [playerPokemon] = game.scene.getPlayerField();

    const gripClaw = playerPokemon.getHeldItems()[0] as ContactHeldItemTransferChanceModifier;
    vi.spyOn(gripClaw, "chance", "get").mockReturnValue(100);

    const enemyPokemon = game.scene.getEnemyField();

    const playerHeldItemCount = getHeldItemCount(playerPokemon);
    const enemy1HeldItemCount = getHeldItemCount(enemyPokemon[0]);
    const enemy2HeldItemCount = getHeldItemCount(enemyPokemon[1]);
    expect(enemy2HeldItemCount).toBeGreaterThan(0);

    game.move.select(Moves.ATTRACT, 0, BattlerIndex.ENEMY_2);
    game.move.select(Moves.SPLASH, 1);

    await game.phaseInterceptor.to("BerryPhase", false);

    const playerHeldItemCountAfter = getHeldItemCount(playerPokemon);
    const enemy1HeldItemCountsAfter = getHeldItemCount(enemyPokemon[0]);
    const enemy2HeldItemCountsAfter = getHeldItemCount(enemyPokemon[1]);

    expect(playerHeldItemCountAfter).toBe(playerHeldItemCount);
    expect(enemy1HeldItemCountsAfter).toBe(enemy1HeldItemCount);
    expect(enemy2HeldItemCountsAfter).toBe(enemy2HeldItemCount);
  });
});

/*
 * Gets the total number of items a Pokemon holds
 */
function getHeldItemCount(pokemon: Pokemon) {
  return pokemon.getHeldItems().reduce((currentTotal, item) => currentTotal + item.getStackCount(), 0);
}
