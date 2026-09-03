import { AbilityId } from "#enums/ability-id";
import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { PERMANENT_STATS, type Stat } from "#enums/stat";
import { permanentStatToHeldItem } from "#items/base-stat-multiply";
import { GameManager } from "#test/framework/game-manager";
import { applySingleHeldItem } from "#test/utils/item-test-utils";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

const vitaminCases = Object.entries(permanentStatToHeldItem).map(([statKey, itemId]) => ({
  itemName: HeldItemId[itemId],
  item: itemId,
  stat: Number(statKey) as Stat,
}));

describe("Items - Vitamins", () => {
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

  it.each(vitaminCases)("$itemName should boost $stat by 10% per stack", async ({ item, stat }) => {
    game.override.startingHeldItems([{ entry: item }]);
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    const baseStats = player.getSpeciesForm(true).baseStats.slice();
    baseStats[stat] = 100;

    applySingleHeldItem(item, HeldItemEffect.BASE_STAT_MULTIPLY, { pokemon: player, baseStats });

    expect(baseStats[stat]).toBe(110);
  });

  it.each(vitaminCases)("$itemName should not boost other stats", async ({ item, stat }) => {
    game.override.startingHeldItems([{ entry: item }]);
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    const baseStats = player.getSpeciesForm(true).baseStats.slice();
    const originalStats = [...baseStats];

    applySingleHeldItem(item, HeldItemEffect.BASE_STAT_MULTIPLY, { pokemon: player, baseStats });

    for (const s of PERMANENT_STATS.filter(v => v !== stat)) {
      expect(baseStats[s]).toBe(originalStats[s]);
    }
  });
});
