import { AbilityId } from "#enums/ability-id";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, test } from "vitest";

describe("Moves - Corrosive Gas", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);

    game.override
      .battleStyle("double")
      .moveset([MoveId.SPLASH])
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyMoveset([MoveId.SPLASH])
      .enemyAbility(AbilityId.INSOMNIA)
      .startingLevel(5)
      .enemyLevel(5);
  });

  test("Removes items from all other Pokémon on the field", async () => {
    await game.classicMode.startBattle(SpeciesId.CHARIZARD, SpeciesId.BLASTOISE);

    const leadPokemon = game.scene.getPlayerField();
    const enemyPokemon = game.scene.getEnemyField();

    leadPokemon[0].heldItemManager.add(HeldItemId.SITRUS_BERRY);
    leadPokemon[1].heldItemManager.add(HeldItemId.SITRUS_BERRY, 2);
    enemyPokemon[0].heldItemManager.add(HeldItemId.SITRUS_BERRY);
    enemyPokemon[1].heldItemManager.add(HeldItemId.SITRUS_BERRY);

    game.move.use(MoveId.CORROSIVE_GAS);
    game.move.use(MoveId.SPLASH, 1);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    expect(leadPokemon[0].heldItemManager.getStack(HeldItemId.SITRUS_BERRY)).toBe(1);
    expect(leadPokemon[1].heldItemManager.getStack(HeldItemId.SITRUS_BERRY)).toBe(1);
    expect(enemyPokemon[0].heldItemManager.getStack(HeldItemId.SITRUS_BERRY)).toBe(0);
    expect(enemyPokemon[1].heldItemManager.getStack(HeldItemId.SITRUS_BERRY)).toBe(0);
    // Check temp stats as well
    expect(leadPokemon[1].heldItemManager.getStack(HeldItemId.SITRUS_BERRY, true)).toBe(2);
    expect(enemyPokemon[0].heldItemManager.getStack(HeldItemId.SITRUS_BERRY, true)).toBe(1);
    expect(enemyPokemon[1].heldItemManager.getStack(HeldItemId.SITRUS_BERRY, true)).toBe(1);
  });

  test("Does not remove items that cannot be transfered", async () => {
    await game.classicMode.startBattle(SpeciesId.CHARIZARD, SpeciesId.BLASTOISE);

    const leadPokemon = game.scene.getPlayerField();
    const enemyPokemon = game.scene.getEnemyField();

    leadPokemon[0].heldItemManager.add(HeldItemId.IRON);
    leadPokemon[1].heldItemManager.add(HeldItemId.IRON, 2);
    enemyPokemon[0].heldItemManager.add(HeldItemId.IRON);
    enemyPokemon[1].heldItemManager.add(HeldItemId.IRON);

    game.move.use(MoveId.CORROSIVE_GAS);
    game.move.use(MoveId.SPLASH, 1);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    expect(leadPokemon[0].heldItemManager.getStack(HeldItemId.IRON)).toBe(1);
    expect(leadPokemon[1].heldItemManager.getStack(HeldItemId.IRON)).toBe(2);
    expect(enemyPokemon[0].heldItemManager.getStack(HeldItemId.IRON)).toBe(1);
    expect(enemyPokemon[1].heldItemManager.getStack(HeldItemId.IRON)).toBe(1);
  });
});
