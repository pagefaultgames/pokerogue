import { AbilityId } from "#enums/ability-id";
import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import { applySingleHeldItem } from "#test/utils/item-test-utils";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Items - Golden Punch", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  const DAMAGE_DEALT = 200;

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

  it.each([1, 2])("should grant money equal to %d x half the damage dealt", async stacks => {
    game.override.startingHeldItems([{ entry: HeldItemId.GOLDEN_PUNCH, count: stacks }]);
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    const moneyBefore = game.scene.money;

    applySingleHeldItem(HeldItemId.GOLDEN_PUNCH, HeldItemEffect.DAMAGE_MONEY_REWARD, {
      pokemon: player,
      damage: DAMAGE_DEALT,
    });

    expect(game.scene.money - moneyBefore).toBe(Math.floor(DAMAGE_DEALT * (0.5 * stacks)));
  });

  it("should not grant money when no damage is dealt", async () => {
    game.override.startingHeldItems([{ entry: HeldItemId.GOLDEN_PUNCH }]);
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    const moneyBefore = game.scene.money;

    applySingleHeldItem(HeldItemId.GOLDEN_PUNCH, HeldItemEffect.DAMAGE_MONEY_REWARD, {
      pokemon: player,
      damage: 0,
    });

    expect(game.scene.money).toBe(moneyBefore);
  });
});
