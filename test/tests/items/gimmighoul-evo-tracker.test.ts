import { allHeldItems } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { TrainerItemId } from "#enums/trainer-item-id";
import type { GimmighoulEvoTrackerHeldItem } from "#items/evo-tracker";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Items - Gimmighoul Evolution Tracker", () => {
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
      .startingHeldItems([{ entry: HeldItemId.GIMMIGHOUL_EVO_TRACKER }])
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should count its own stacks towards evolution progress", async () => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    const tracker = allHeldItems[HeldItemId.GIMMIGHOUL_EVO_TRACKER] as GimmighoulEvoTrackerHeldItem;

    expect(tracker.getStackCount(player)).toBe(1);
  });

  it("should count money-related held items and trainer items towards evolution progress", async () => {
    game.override
      .startingHeldItems([{ entry: HeldItemId.GIMMIGHOUL_EVO_TRACKER }, { entry: HeldItemId.GOLDEN_PUNCH, count: 3 }])
      .startingTrainerItems([{ entry: TrainerItemId.AMULET_COIN, count: 2 }, { entry: TrainerItemId.GOLDEN_POKEBALL }]);

    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    const tracker = allHeldItems[HeldItemId.GIMMIGHOUL_EVO_TRACKER] as GimmighoulEvoTrackerHeldItem;

    // 1 tracker + 3 golden punches + 2 amulet coins + 1 golden pokeball
    expect(tracker.getStackCount(player)).toBe(7);
  });

  it("should not be transferable or stealable", async () => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const tracker = allHeldItems[HeldItemId.GIMMIGHOUL_EVO_TRACKER];
    expect(tracker.isTransferable).toBe(false);
    expect(tracker.isStealable).toBe(false);
  });
});
