import { AbilityId } from "#enums/ability-id";
import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/framework/game-manager";
import { applySingleHeldItem } from "#test/utils/item-test-utils";
import { ValueHolder } from "#utils/value-holder";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Items - Macho Brace", () => {
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
      .startingHeldItems([{ entry: HeldItemId.MACHO_BRACE }])
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should add +2 per stack to HP", async () => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    const statHolder = new ValueHolder(100);

    applySingleHeldItem(HeldItemId.MACHO_BRACE, HeldItemEffect.MACHO_BRACE, {
      pokemon: player,
      stat: Stat.HP,
      statHolder,
    });

    expect(statHolder.value).toBe(102);
  });

  it.each([Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD])("should add +1 per stack to $stat", async stat => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    const statHolder = new ValueHolder(100);

    applySingleHeldItem(HeldItemId.MACHO_BRACE, HeldItemEffect.MACHO_BRACE, {
      pokemon: player,
      stat,
      statHolder,
    });

    expect(statHolder.value).toBe(101);
  });

  it("should grant an additional +10% HP at max stacks (50)", async () => {
    game.override.startingHeldItems([{ entry: HeldItemId.MACHO_BRACE, count: 50 }]);
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    const statHolder = new ValueHolder(100);

    applySingleHeldItem(HeldItemId.MACHO_BRACE, HeldItemEffect.MACHO_BRACE, {
      pokemon: player,
      stat: Stat.HP,
      statHolder,
    });

    // 100 + (2 * 50) then x1.1
    expect(statHolder.value).toBe(Math.floor(200 * 1.1));
  });

  it("should grant an additional +5% to other stats at max stacks (50)", async () => {
    game.override.startingHeldItems([{ entry: HeldItemId.MACHO_BRACE, count: 50 }]);
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    const statHolder = new ValueHolder(100);

    applySingleHeldItem(HeldItemId.MACHO_BRACE, HeldItemEffect.MACHO_BRACE, {
      pokemon: player,
      stat: Stat.ATK,
      statHolder,
    });

    // 100 + (1 * 50) then x1.05
    expect(statHolder.value).toBe(Math.floor(150 * 1.05));
  });
});
