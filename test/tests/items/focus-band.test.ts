import { AbilityId } from "#enums/ability-id";
import { HeldItemId } from "#enums/held-item-id";
import { HitResult } from "#enums/hit-result";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Items - Focus Band", () => {
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
      .startingHeldItems([{ entry: HeldItemId.FOCUS_BAND }])
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH);
  });

  it.each([
    { roll: 0, survives: true },
    { roll: 9, survives: false },
  ])("should let the holder survive otherwise-fatal damage only when the roll succeeds ($survives)", async ({
    roll,
    survives,
  }) => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    vi.spyOn(player, "randBattleSeedInt").mockReturnValue(roll);

    player.damageAndUpdate(player.getMaxHp() * 5, { result: HitResult.EFFECTIVE });

    if (survives) {
      expect(player).not.toHaveFainted();
      expect(player.hp).toBe(1);
      expect(player).toHaveHeldItem(HeldItemId.FOCUS_BAND);
    } else {
      expect(player).toHaveFainted();
    }
  });

  it("should not trigger when the damage is not fatal", async () => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    vi.spyOn(player, "randBattleSeedInt").mockReturnValue(0);

    const hpBefore = player.hp;
    player.damageAndUpdate(Math.ceil(player.getMaxHp() / 2), { result: HitResult.EFFECTIVE });

    expect(player.hp).toBe(hpBefore - Math.ceil(player.getMaxHp() / 2));
  });
});
