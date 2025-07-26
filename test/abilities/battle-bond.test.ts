import { allMoves } from "#data/data-lists";
import { Status } from "#data/status-effect";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { MultiHitType } from "#enums/multi-hit-type";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - BATTLE BOND", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  const baseForm = 1;
  const ashForm = 2;

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
      .battleStyle("single")
      .startingWave(4) // Leads to arena reset on Wave 5 trainer battle
      .ability(AbilityId.BATTLE_BOND)
      .starterForms({ [SpeciesId.GRENINJA]: ashForm })
      .moveset([MoveId.SPLASH, MoveId.WATER_SHURIKEN])
      .enemySpecies(SpeciesId.BULBASAUR)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100) // Avoid levelling up
      .enemyLevel(1000); // Avoid opponent dying before `doKillOpponents()`
  });

  it("check if fainted pokemon switches to base form on arena reset", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.GRENINJA]);

    const greninja = game.scene.getPlayerParty()[1];
    expect(greninja.formIndex).toBe(ashForm);

    greninja.hp = 0;
    greninja.status = new Status(StatusEffect.FAINT);
    expect(greninja.isFainted()).toBe(true);

    game.move.select(MoveId.SPLASH);
    await game.doKillOpponents();
    await game.phaseInterceptor.to("TurnEndPhase");
    game.doSelectModifier();
    await game.phaseInterceptor.to("QuietFormChangePhase");

    expect(greninja.formIndex).toBe(baseForm);
  });

  it("should not keep buffing Water Shuriken after Greninja switches to base form", async () => {
    await game.classicMode.startBattle([SpeciesId.GRENINJA]);

    const waterShuriken = allMoves[MoveId.WATER_SHURIKEN];
    vi.spyOn(waterShuriken, "calculateBattlePower");

    let actualMultiHitType: MultiHitType | null = null;
    const multiHitAttr = waterShuriken.getAttrs("MultiHitAttr")[0];
    vi.spyOn(multiHitAttr, "getHitCount").mockImplementation(() => {
      actualMultiHitType = multiHitAttr.getMultiHitType();
      return 3;
    });

    // Wave 4: Use Water Shuriken in Ash form
    let expectedBattlePower = 20;
    let expectedMultiHitType = MultiHitType._3;

    game.move.select(MoveId.WATER_SHURIKEN);
    await game.phaseInterceptor.to("BerryPhase", false);
    expect(waterShuriken.calculateBattlePower).toHaveLastReturnedWith(expectedBattlePower);
    expect(actualMultiHitType).toBe(expectedMultiHitType);

    await game.doKillOpponents();
    await game.toNextWave();

    // Wave 5: Use Water Shuriken in base form
    expectedBattlePower = 15;
    expectedMultiHitType = MultiHitType._2_TO_5;

    game.move.select(MoveId.WATER_SHURIKEN);
    await game.phaseInterceptor.to("BerryPhase", false);
    expect(waterShuriken.calculateBattlePower).toHaveLastReturnedWith(expectedBattlePower);
    expect(actualMultiHitType).toBe(expectedMultiHitType);
  });
});
