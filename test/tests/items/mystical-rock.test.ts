import { AbilityId } from "#enums/ability-id";
import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import { applySingleHeldItem } from "#test/utils/item-test-utils";
import { ValueHolder } from "#utils/value-holder";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Items - Mystical Rock", () => {
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
      .enemyMoveset(MoveId.SPLASH)
      .startingHeldItems([{ entry: HeldItemId.MYSTICAL_ROCK }]);
  });

  it("should extend the holder's weather duration by 2 turns per stack (manual)", async () => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    const fieldDuration = new ValueHolder(0);

    applySingleHeldItem(HeldItemId.MYSTICAL_ROCK, HeldItemEffect.FIELD_EFFECT, { pokemon: player, fieldDuration });

    expect(fieldDuration.value).toBe(2);
  });

  it("should extend weather set by the holder to 7 turns (in battle)", async () => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    game.move.use(MoveId.SUNNY_DAY);
    await game.toEndOfTurn();

    expect(game.scene.arena.weather?.turnsLeft).toBe(6);
  });

  it("should not extend weather not set by the holder", async () => {
    game.override.enemyMoveset([MoveId.SUNNY_DAY]).startingHeldItems([{ entry: HeldItemId.LEFTOVERS }]);
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    game.move.use(MoveId.SPLASH);
    await game.toEndOfTurn();

    expect(game.scene.arena.weather?.turnsLeft).toBe(4);
  });
});
