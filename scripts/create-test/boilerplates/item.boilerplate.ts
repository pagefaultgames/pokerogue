import { AbilityId } from "#enums/ability-id";
import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import type { AccuracyBoosterHeldItem } from "#items/accuracy-booster";
import { allHeldItems } from "#items/all-held-items";
import { GameManager } from "#test/test-utils/game-manager";
import { applySingleHeldItem } from "#test/test-utils/utils/item-test-utils";
import { NumberHolder } from "#utils/common";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("{{description}}", () => {
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
    game.override
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);

    vi.spyOn(allHeldItems[HeldItemId.WIDE_LENS] as AccuracyBoosterHeldItem, "shouldApply");
  });

  it("should do XYZ when applied", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();
    feebas.heldItemManager.add(HeldItemId.WIDE_LENS);

    // Replace with actual logic for item in question
    const accMult = new NumberHolder(1);
    applySingleHeldItem(
      allHeldItems[HeldItemId.WIDE_LENS] as AccuracyBoosterHeldItem,
      HeldItemEffect.ACCURACY_BOOSTER,
      {
        pokemon: feebas,
        moveAccuracy: accMult,
      },
    );

    expect(accMult.value).toBe(1.05);
  });

  it("should be applied when XYZ occurs", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();

    feebas.heldItemManager.add(HeldItemId.WIDE_LENS);

    game.move.use(MoveId.TACKLE);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(feebas).toHaveAppliedItem(HeldItemId.WIDE_LENS, HeldItemEffect.ACCURACY_BOOSTER);
  });
});
