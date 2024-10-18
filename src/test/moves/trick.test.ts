import GameManager from "#app/test/utils/gameManager";
import Phaser from "phaser";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { PokemonHeldItemModifier } from "#app/modifier/modifier.js";
import { deepCopy } from "#app/utils";
import { Abilities } from "#app/enums/abilities.js";

const TIMEOUT = 20000;
const TRICK_ONLY = [Moves.TRICK, Moves.TRICK, Moves.TRICK, Moves.TRICK];
const SPLASH_ONLY = [Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH];

/**
 * Gets the PokemonHeldItemModifier for a given item ID, if the Pokemon has that item
 * @param {PokemonHeldItemModifier[]} inventory Held items of a Pokemon
 * @param {string} itemId The ID of the item to search for
 * @returns PokemonHeldItemModifier if the item is found, undefined if not
 */
function getHeldItemModifierFromId(inventory: PokemonHeldItemModifier[], itemId: string) {
  let idxOfSearchedItem = -1;
  for (let idx = 0; idx < inventory.length; idx++) {
    if (inventory[idx].type.id === itemId) {
      idxOfSearchedItem = idx;
      break;
    }
  }
  return idxOfSearchedItem !== -1 ? inventory[idxOfSearchedItem] : undefined;
}

/**
 * Prints a string to the console showing how many of an item a Pokemon currently has
 * @param {string} pokemonName The name of the checked Pokemon
 * @param {string} itemId The ID of the checked item
 * @param {number} stackCount How many of this item ID the checked Pokemon has
 */
function printStackCount(pokemonName: string, itemId: string, stackCount: number) {
  console.log(`${pokemonName} has ${stackCount} of ${itemId}`);
}

describe("Moves - Trick", () => {
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
    game.override.battleType("single");
  });

  it(
    "both pokemon have two items, they will always swap Leftovers and Golden Punch, due to the priority system",
    async () => {
      game.override.startingHeldItems([{name: "MULTI_LENS"}, {name: "GOLDEN_PUNCH"}]);
      game.override.enemyHeldItems([{name: "LEFTOVERS"}, {name: "GOLDEN_PUNCH"}]);
      game.override.moveset(TRICK_ONLY);
      game.override.enemySpecies(Species.MAGIKARP);
      game.override.enemyMoveset(SPLASH_ONLY);
      await game.startBattle([Species.MIME_JR]);

      const playerPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      const playerLostItem = playerPokemon.getHeldItems()[1];
      const enemyLostItem = enemyPokemon.getHeldItems()[0];
      const prevPlayerLostItemStack = playerLostItem.stackCount;
      const prevEnemyLostItemStack = enemyLostItem.stackCount;
      const prevPlayerGainedItemModifier = getHeldItemModifierFromId(playerPokemon.getHeldItems(), enemyLostItem.type.id);
      const prevEnemyGainedItemModifier = getHeldItemModifierFromId(enemyPokemon.getHeldItems(), playerLostItem.type.id);

      let prevPlayerGainedItemStackCount = 0;
      let prevEnemyGainedItemStackCount = 0;

      if (prevPlayerGainedItemModifier !== undefined) {
        prevPlayerGainedItemStackCount = prevPlayerGainedItemModifier.stackCount;
      }

      if (prevEnemyGainedItemModifier !== undefined) {
        prevEnemyGainedItemStackCount = prevEnemyGainedItemModifier.stackCount;
      }

      printStackCount(playerPokemon.name, playerLostItem.type.id, prevPlayerLostItemStack);
      printStackCount(playerPokemon.name, enemyLostItem.type.id, prevPlayerGainedItemStackCount);
      printStackCount(enemyPokemon.name, enemyLostItem.type.id, prevEnemyLostItemStack);
      printStackCount(enemyPokemon.name, playerLostItem.type.id, prevEnemyGainedItemStackCount);

      game.move.select(Moves.TRICK);
      await game.phaseInterceptor.to(TurnEndPhase);

      const currPlayerLostItemStack = playerLostItem.stackCount;
      const currEnemyLostItemStack = enemyLostItem.stackCount;
      const currPlayerGainedItemModifier = getHeldItemModifierFromId(playerPokemon.getHeldItems(), enemyLostItem.type.id);
      const currEnemyGainedItemModifier = getHeldItemModifierFromId(enemyPokemon.getHeldItems(), playerLostItem.type.id);

      expect(currPlayerGainedItemModifier).toBeDefined();
      expect(currEnemyGainedItemModifier).toBeDefined();

      if (currPlayerGainedItemModifier && currEnemyGainedItemModifier) {

        const currPlayerGainedItemStackCount = currPlayerGainedItemModifier.stackCount;
        const currEnemyGainedItemStackCount = currEnemyGainedItemModifier.stackCount;

        printStackCount(playerPokemon.name, playerLostItem.type.id, currPlayerLostItemStack);
        printStackCount(playerPokemon.name, enemyLostItem.type.id, currPlayerGainedItemStackCount);
        printStackCount(enemyPokemon.name, enemyLostItem.type.id, currEnemyLostItemStack);
        printStackCount(enemyPokemon.name, playerLostItem.type.id, currEnemyGainedItemStackCount);

        const didPlayerTransferItems = prevPlayerLostItemStack > currPlayerLostItemStack && prevPlayerGainedItemStackCount < currPlayerGainedItemStackCount;
        const didEnemyTransferItems = prevEnemyLostItemStack > currEnemyLostItemStack && prevEnemyGainedItemStackCount < currEnemyGainedItemStackCount;
        const playerReceivedLeftovers = currPlayerGainedItemModifier.type.id === "LEFTOVERS";
        const enemyReceivedGoldenPunch = currEnemyGainedItemModifier.type.id === "GOLDEN_PUNCH";

        expect(didPlayerTransferItems && didEnemyTransferItems && playerReceivedLeftovers && enemyReceivedGoldenPunch).toBeTruthy();
      }
    }, TIMEOUT
  );

  it(
    "the user will always give Toxic Orb, as it has special priority to be given",
    async () => {
      game.override.startingHeldItems([{name: "GOLDEN_PUNCH"}, {name: "TOXIC_ORB"}]);
      game.override.enemyHeldItems([{name: "LEFTOVERS"}, {name: "GOLDEN_PUNCH"}]);
      game.override.moveset(TRICK_ONLY);
      game.override.enemySpecies(Species.MAGIKARP);
      game.override.enemyMoveset(SPLASH_ONLY);
      await game.startBattle([Species.MIME_JR]);

      game.move.select(Moves.TRICK);
      await game.phaseInterceptor.to(TurnEndPhase);

      const playerPokemon = game.scene.getPlayerPokemon()!;
      expect(playerPokemon.getHeldItems()[1].type.id === "TOXIC_ORB").toBeFalsy();
    }
  );

  it(
    "the user will never take Flame Orb, as it has special priority to not be taken",
    async () => {
      game.override.enemyHeldItems([{name: "FLAME_ORB"}, {name: "GOLDEN_PUNCH"}]);
      game.override.moveset(TRICK_ONLY);
      game.override.enemySpecies(Species.MAGIKARP);
      game.override.enemyMoveset(SPLASH_ONLY);
      await game.startBattle([Species.MIME_JR]);

      game.move.select(Moves.TRICK);
      await game.phaseInterceptor.to(TurnEndPhase);

      const enemyPokemon = game.scene.getEnemyPokemon()!;
      expect(enemyPokemon.getHeldItems()[0].type.id === "FLAME_ORB").toBeTruthy();
    }
  );

  it(
    "the move fails and no transfer occurs when a wild pokemon is the user",
    async () => {
      game.override.startingHeldItems([{name: "GOLDEN_PUNCH"}]);
      game.override.enemyHeldItems([{name: "LEFTOVERS"}]);
      game.override.moveset(SPLASH_ONLY);
      game.override.enemySpecies(Species.MIME_JR);
      game.override.enemyMoveset(TRICK_ONLY);
      await game.startBattle([Species.MAGIKARP]);

      const playerPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;
      const playerPokemonFirstHeldItem = deepCopy(playerPokemon.getHeldItems()[0]) as PokemonHeldItemModifier;
      const enemyPokemonFirstHeldItem = deepCopy(enemyPokemon.getHeldItems()[0]) as PokemonHeldItemModifier;

      printStackCount(playerPokemon.name, playerPokemonFirstHeldItem.type.id, playerPokemonFirstHeldItem.stackCount);
      printStackCount(enemyPokemon.name, enemyPokemonFirstHeldItem.type.id, enemyPokemonFirstHeldItem.stackCount);

      game.move.select(Moves.TRICK);
      await game.phaseInterceptor.to(TurnEndPhase);

      const playerPokemonCurrentHeldItem = playerPokemon.getHeldItems()[0];
      const enemyPokemonCurrentHeldItem = enemyPokemon.getHeldItems()[0];

      printStackCount(playerPokemon.name, playerPokemonFirstHeldItem.type.id, playerPokemonFirstHeldItem.stackCount);
      printStackCount(enemyPokemon.name, enemyPokemonFirstHeldItem.type.id, enemyPokemonFirstHeldItem.stackCount);

      const playerDidNotLoseItem = playerPokemonFirstHeldItem.type.id === playerPokemonCurrentHeldItem.type.id && playerPokemonFirstHeldItem.stackCount === playerPokemonCurrentHeldItem.stackCount;
      const enemyDidNotLoseItem = enemyPokemonFirstHeldItem.type.id === enemyPokemonCurrentHeldItem.type.id && enemyPokemonFirstHeldItem.stackCount === enemyPokemonCurrentHeldItem.stackCount;

      expect(playerDidNotLoseItem && enemyDidNotLoseItem).toBeTruthy();
    }, TIMEOUT
  );

  it(
    "the move fails and no transfer occurs when the target pokemon has sticky hold",
    async () => {
      game.override.startingHeldItems([{name: "GOLDEN_PUNCH"}]);
      game.override.enemyHeldItems([{name: "LEFTOVERS"}]);
      game.override.moveset(TRICK_ONLY);
      game.override.enemySpecies(Species.MAGIKARP);
      game.override.enemyMoveset(SPLASH_ONLY);
      game.override.enemyAbility(Abilities.STICKY_HOLD);
      await game.startBattle([Species.MIME_JR]);

      const playerPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;
      const playerPokemonFirstHeldItem = deepCopy(playerPokemon.getHeldItems()[0]) as PokemonHeldItemModifier;
      const enemyPokemonFirstHeldItem = deepCopy(enemyPokemon.getHeldItems()[0]) as PokemonHeldItemModifier;

      printStackCount(playerPokemon.name, playerPokemonFirstHeldItem.type.id, playerPokemonFirstHeldItem.stackCount);
      printStackCount(enemyPokemon.name, enemyPokemonFirstHeldItem.type.id, enemyPokemonFirstHeldItem.stackCount);

      game.move.select(Moves.TRICK);
      await game.phaseInterceptor.to(TurnEndPhase);

      const playerPokemonCurrentHeldItem = playerPokemon.getHeldItems()[0];
      const enemyPokemonCurrentHeldItem = enemyPokemon.getHeldItems()[0];

      printStackCount(playerPokemon.name, playerPokemonFirstHeldItem.type.id, playerPokemonFirstHeldItem.stackCount);
      printStackCount(enemyPokemon.name, enemyPokemonFirstHeldItem.type.id, enemyPokemonFirstHeldItem.stackCount);

      const playerDidNotLoseItem = playerPokemonFirstHeldItem.type.id === playerPokemonCurrentHeldItem.type.id && playerPokemonFirstHeldItem.stackCount === playerPokemonCurrentHeldItem.stackCount;
      const enemyDidNotLoseItem = enemyPokemonFirstHeldItem.type.id === enemyPokemonCurrentHeldItem.type.id && enemyPokemonFirstHeldItem.stackCount === enemyPokemonCurrentHeldItem.stackCount;

      expect(playerDidNotLoseItem && enemyDidNotLoseItem).toBeTruthy();
    }, TIMEOUT
  );

  it(
    "the move fails and no transfer occurs when neither pokemon have any items",
    async() => {
      game.override.moveset(TRICK_ONLY);
      game.override.enemySpecies(Species.MAGIKARP);
      game.override.enemyMoveset(SPLASH_ONLY);
      await game.startBattle([Species.MIME_JR]);

      const playerPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      expect(playerPokemon.getHeldItems().length === 0);
      expect(enemyPokemon.getHeldItems().length === 0);

      game.move.select(Moves.TRICK);
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(playerPokemon.getHeldItems().length === 0);
      expect(enemyPokemon.getHeldItems().length === 0);

    }, TIMEOUT
  );
});
