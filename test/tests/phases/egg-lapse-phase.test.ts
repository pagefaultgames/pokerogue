import { settings } from "#app/global-settings-manager";
import { Egg } from "#data/egg";
import { AbilityId } from "#enums/ability-id";
import { Button } from "#enums/buttons";
import { EggSkipPreference } from "#enums/egg-skip-preference";
import { EggSourceType } from "#enums/egg-source-types";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import { GameManager } from "#test/framework/game-manager";
import type { EggSummaryUiHandler } from "#ui/egg-summary-ui-handler";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("EggLapsePhase", () => {
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
      .moveset([MoveId.FISSURE, MoveId.SPLASH])
      .ability(AbilityId.NO_GUARD)
      .startingLevel(200)
      .enemySpecies(SpeciesId.MAGIKARP)
      .battleStyle("single");
  });

  /**
   * Replace the player's eggs with new ones that will hatch after the given number of waves.
   * @param hatchWaves - The number of waves until each egg hatches, in order
   * @returns The created eggs
   */
  function setEggs(...hatchWaves: number[]): Egg[] {
    const eggs = hatchWaves.map(
      (waves, i) =>
        new Egg({ id: i + 1, species: SpeciesId.BULBASAUR, hatchWaves: waves, sourceType: EggSourceType.GACHA_MOVE }),
    );
    game.scene.gameData.eggs = [...eggs];
    return eggs;
  }

  /** Run until the post-battle reward shop opens. */
  async function toShop(): Promise<void> {
    await game.phaseInterceptor.to("SelectRewardPhase");
    // Leaving the egg hatch UI fades out before the shop is shown
    await vi.waitUntil(() => game.scene.ui.mode === UiMode.REWARD_SELECT);
  }

  function countPhase(phaseName: "EggHatchPhase" | "EggSummaryPhase"): number {
    return game.phaseInterceptor.phaseLog.filter(p => p === phaseName).length;
  }

  it("should hatch eggs one by one and reach the shop when 2+ eggs hatch with egg skip set to 'Never'", async () => {
    settings.update("general", "eggSkipPreference", EggSkipPreference.NEVER);
    await game.classicMode.startBattle(SpeciesId.ABRA);
    setEggs(1, 1);

    game.move.select(MoveId.FISSURE);
    await toShop();

    expect(game.scene.gameData.eggs).toHaveLength(0);
    expect(countPhase("EggHatchPhase")).toBe(2);
    expect(countPhase("EggSummaryPhase")).toBe(0);
    expect(game).toBeAtPhase("SelectRewardPhase");
  });

  it("should hatch a single egg normally with egg skip set to 'Never'", async () => {
    settings.update("general", "eggSkipPreference", EggSkipPreference.NEVER);
    await game.classicMode.startBattle(SpeciesId.ABRA);
    setEggs(1);

    game.move.select(MoveId.FISSURE);
    await toShop();

    expect(game.scene.gameData.eggs).toHaveLength(0);
    expect(countPhase("EggHatchPhase")).toBe(1);
    expect(countPhase("EggSummaryPhase")).toBe(0);
    expect(game).toBeAtPhase("SelectRewardPhase");
  });

  it("should skip hatch animations and show the summary when 2+ eggs hatch with egg skip set to 'Always'", async () => {
    settings.update("general", "eggSkipPreference", EggSkipPreference.ALWAYS);
    await game.classicMode.startBattle(SpeciesId.ABRA);
    setEggs(1, 1);

    game.move.select(MoveId.FISSURE);
    game.onNextPrompt("EggSummaryPhase", UiMode.EGG_HATCH_SUMMARY, async () => {
      // The summary briefly blocks exiting after opening
      const handler = game.scene.ui.getHandler() as EggSummaryUiHandler;
      await vi.waitUntil(() => !handler["blockExit"]);
      game.scene.ui.processInput(Button.CANCEL);
    });
    await toShop();

    expect(game.scene.gameData.eggs).toHaveLength(0);
    expect(countPhase("EggHatchPhase")).toBe(0);
    expect(countPhase("EggSummaryPhase")).toBe(1);
    expect(game).toBeAtPhase("SelectRewardPhase");
  });

  it("should only count down eggs that are not ready to hatch", async () => {
    await game.classicMode.startBattle(SpeciesId.ABRA);
    const [egg] = setEggs(5);

    game.move.select(MoveId.FISSURE);
    await toShop();

    expect(game.scene.gameData.eggs).toEqual([egg]);
    expect(egg.hatchWaves).toBe(4);
    expect(game.phaseInterceptor.phaseLog).toContain("EggLapsePhase");
    expect(countPhase("EggHatchPhase")).toBe(0);
    expect(countPhase("EggSummaryPhase")).toBe(0);
    expect(game).toBeAtPhase("SelectRewardPhase");
  });
});
