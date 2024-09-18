import { MapModifier } from "#app/modifier/modifier";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import GameManager from "./utils/gameManager";
import { Moves } from "#app/enums/moves";
import { getPartyLuckValue, itemPoolChecks } from "#app/modifier/modifier-type";
import { Biome } from "#app/enums/biome";
import { BattleEndPhase } from "#app/phases/battle-end-phase";
import { Mode } from "#app/ui/ui";
import ModifierSelectUiHandler from "#app/ui/modifier-select-ui-handler";
import Overrides from "#app/overrides";

//const TIMEOUT = 20 * 1000;

describe("Daily Mode", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it("should initialize properly", async () => {
    await game.dailyMode.runToSummon();

    const party = game.scene.getParty();
    expect(party).toHaveLength(3);
    party.forEach(pkm => {
      expect(pkm.level).toBe(20);
      expect(pkm.moveset.length).toBeGreaterThan(0);
    });
    expect(game.scene.getModifiers(MapModifier).length).toBeGreaterThan(0);
  });
});

//*
// Need to figure out how to properly start a battle
// Need to fix eviolite - test keeps insisting it is not in loot table, even though Mini Black Hole (which is using the exact same condition) is
describe("Shop modifications", async () => {
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
      .startingWave(9)
      .startingBiome(Biome.ICE_CAVE) // Will lead to Snowy Forest with randomly generated weather
      .battleType("single")
      .shinyLevel(true)
      .startingLevel(100) // Avoid levelling up
      .enemyLevel(1000) // Avoid opponent dying before game.doKillOpponents()
      .disableTrainerWaves()
      .moveset([Moves.KOWTOW_CLEAVE])
      .enemyMoveset(Moves.SPLASH);
    itemPoolChecks.set("EVIOLITE", false);
    itemPoolChecks.set("MINI_BLACK_HOLE", false);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    itemPoolChecks.clear();
  });

  it("should not have Eviolite and Mini Black Hole available in Classic if not unlocked", async () => {
    await game.classicMode.runToSummon();
    expect(itemPoolChecks.get("EVIOLITE")).toBeDefined();
    expect(itemPoolChecks.get("EVIOLITE")).toBeFalsy();
    expect(itemPoolChecks.get("MINI_BLACK_HOLE")).toBeDefined();
    expect(itemPoolChecks.get("MINI_BLACK_HOLE")).toBeFalsy();
    game.move.select(Moves.KOWTOW_CLEAVE);
    await game.phaseInterceptor.to("DamagePhase");
    await game.doKillOpponents();
    await game.phaseInterceptor.to(BattleEndPhase);
    game.onNextPrompt("SelectModifierPhase", Mode.MODIFIER_SELECT, () => {
      expect(game.scene.ui.getHandler()).toBeInstanceOf(ModifierSelectUiHandler);
      expect(itemPoolChecks.get("EVIOLITE")).toBeDefined();
      expect(itemPoolChecks.get("EVIOLITE")).toBeFalsy();
      expect(itemPoolChecks.get("MINI_BLACK_HOLE")).toBeDefined();
      expect(itemPoolChecks.get("MINI_BLACK_HOLE")).toBeFalsy();
    });
  });

  it("should have Eviolite and Mini Black Hole available in Daily", async () => {
    await game.dailyMode.runToSummon();
    expect(itemPoolChecks.get("EVIOLITE")).toBeDefined();
    expect(itemPoolChecks.get("EVIOLITE")).toBeFalsy();
    expect(itemPoolChecks.get("MINI_BLACK_HOLE")).toBeDefined();
    expect(itemPoolChecks.get("MINI_BLACK_HOLE")).toBeFalsy();
    game.move.select(Moves.KOWTOW_CLEAVE);
    await game.phaseInterceptor.to("DamagePhase");
    await game.doKillOpponents();
    await game.phaseInterceptor.to(BattleEndPhase);
    game.onNextPrompt("SelectModifierPhase", Mode.MODIFIER_SELECT, () => {
      expect(game.scene.ui.getHandler()).toBeInstanceOf(ModifierSelectUiHandler);
      expect(itemPoolChecks.get("EVIOLITE")).toBeDefined();
      expect(itemPoolChecks.get("EVIOLITE")).toBeTruthy();
      expect(itemPoolChecks.get("MINI_BLACK_HOLE")).toBeDefined();
      expect(itemPoolChecks.get("MINI_BLACK_HOLE")).toBeTruthy();
    });
  });

  it("should apply luck in Classic Mode", async () => {
    await game.classicMode.runToSummon();
    const party = game.scene.getParty();
    expect(Overrides.SHINY_OVERRIDE).toBeTruthy();
    expect(party[0]).toBeDefined();
    expect(party[0].getLuck()).toBeGreaterThan(0);
    expect(getPartyLuckValue(party)).toBeGreaterThan(0);
  });

  it("should not apply luck in Daily Run", async () => {
    await game.dailyMode.runToSummon();
    const party = game.scene.getParty();
    expect(party[0]).toBeDefined();
    expect(party[0].getLuck()).toBeGreaterThan(0);
    expect(getPartyLuckValue(party)).toBe(0);
  });
});
//*/
