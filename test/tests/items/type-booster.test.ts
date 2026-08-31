import { AbilityId } from "#enums/ability-id";
import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { attackTypeToHeldItem } from "#items/attack-type-booster";
import { GameManager } from "#test/framework/game-manager";
import { applySingleHeldItem } from "#test/utils/item-test-utils";
import { ValueHolder } from "#utils/value-holder";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

const typeBoosterCases = Object.entries(attackTypeToHeldItem).map(([typeKey, itemId]) => ({
  itemName: HeldItemId[itemId],
  item: itemId,
  moveType: Number(typeKey) as PokemonType,
}));

describe("Items - Type Boosters", () => {
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
      .battleStyle("single")
      .criticalHits(false)
      .ability(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it.each(typeBoosterCases)("$itemName should boost the power of matching-type moves by 20%", async ({
    item,
    moveType,
  }) => {
    game.override.startingHeldItems([{ entry: item }]);
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    const movePower = new ValueHolder(100);

    applySingleHeldItem(item, HeldItemEffect.ATTACK_TYPE_BOOST, { pokemon: player, moveType, movePower });

    expect(movePower.value).toBe(120);
  });

  it.each([
    { scenario: "moves of a different type", moveType: PokemonType.WATER, movePower: 100 },
    { scenario: "status moves", moveType: PokemonType.FIRE, movePower: 0 },
  ])("should not boost $scenario", async ({ moveType, movePower: power }) => {
    game.override.startingHeldItems([{ entry: HeldItemId.CHARCOAL }]);
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    const movePower = new ValueHolder(power);

    applySingleHeldItem(HeldItemId.CHARCOAL, HeldItemEffect.ATTACK_TYPE_BOOST, {
      pokemon: player,
      moveType,
      movePower,
    });

    expect(movePower.value).toBe(power);
  });

  it.each([2, 3])("should stack additively: %d stacks grant +40%/+60%", async stacks => {
    game.override.startingHeldItems([{ entry: HeldItemId.CHARCOAL, count: stacks }]);
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    const movePower = new ValueHolder(100);

    applySingleHeldItem(HeldItemId.CHARCOAL, HeldItemEffect.ATTACK_TYPE_BOOST, {
      pokemon: player,
      moveType: PokemonType.FIRE,
      movePower,
    });

    expect(movePower.value).toBe(Math.floor(100 * (1 + 0.2 * stacks)));
  });
});
