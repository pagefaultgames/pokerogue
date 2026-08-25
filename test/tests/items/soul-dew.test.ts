import { AbilityId } from "#enums/ability-id";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { Nature } from "#enums/nature";
import { SpeciesId } from "#enums/species-id";
import { type PermanentStat, Stat } from "#enums/stat";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Items - Soul Dew", () => {
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
      .nature(Nature.ADAMANT) // +atk, -spatk
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  /**
   * Asserts the held Soul Dew amplifies the nature's deviation from neutral by 0.1 per stack.
   */
  function expectNatureBoost(stat: PermanentStat, baseMultiplier: number, stacks = 1): void {
    const player = game.field.getPlayerPokemon();
    const baseStat = player.getSpeciesForm(true).baseStats[stat];
    const preNatureValue = Math.floor((2 * baseStat + player.ivs[stat]) * player.level * 0.01) + 5;
    const multiplier = baseMultiplier + (baseMultiplier > 1 ? 1 : -1) * 0.1 * stacks;
    // calculateStats rounds up when the nature multiplier is beneficial, down otherwise
    const expected = Math[baseMultiplier > 1 ? "ceil" : "floor"](preNatureValue * multiplier);

    expect(player.getStat(stat, false)).toBe(expected);
  }

  it.each([
    1, 2, 3,
  ])("should amplify the holder's beneficial nature by an additional 0.1 per stack (%d stack(s))", async stacks => {
    game.override
      .startingHeldItems([{ entry: HeldItemId.SOUL_DEW, count: stacks }])
      .playerIVs(31)
      .startingLevel(50);

    await game.classicMode.startBattle(SpeciesId.MAGIKARP);
    expectNatureBoost(Stat.ATK, 1.1, stacks);
  });

  it.each([
    1, 2, 3,
  ])("should amplify the holder's hindering nature by an additional -0.1 per stack (%d stack(s))", async stacks => {
    game.override
      .startingHeldItems([{ entry: HeldItemId.SOUL_DEW, count: stacks }])
      .playerIVs(31)
      .startingLevel(50);

    await game.classicMode.startBattle(SpeciesId.MAGIKARP);
    expectNatureBoost(Stat.SPATK, 0.9, stacks);
  });

  it("should not reduce a stat below the floor of 1", async () => {
    game.override.startingHeldItems([{ entry: HeldItemId.SOUL_DEW, count: 10 }]).startingLevel(20);

    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    expect(player.getStat(Stat.SPATK, false)).toBe(1);
  });

  it("should not affect stats unaffected by nature", async () => {
    game.override.startingHeldItems([{ entry: HeldItemId.SOUL_DEW }]);
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    const baselineDef = player.getEffectiveStat(Stat.DEF);
    player.heldItemManager.remove(HeldItemId.SOUL_DEW);
    player.calculateStats();

    expect(player.getEffectiveStat(Stat.DEF)).toBe(baselineDef);
  });
});
