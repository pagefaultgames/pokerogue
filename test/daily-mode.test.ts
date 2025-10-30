import { pokerogueApi } from "#api/pokerogue-api";
import { BiomeId } from "#enums/biome-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import { MapModifier } from "#modifiers/modifier";
import { GameManager } from "#test/test-utils/game-manager";
import { stringifyEnumArray } from "#test/test-utils/string-utils";
import { ModifierSelectUiHandler } from "#ui/modifier-select-ui-handler";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
    vi.spyOn(pokerogueApi.daily, "getSeed").mockResolvedValue("test-seed");
    await game.dailyMode.startBattle();

    const party = game.scene.getPlayerParty();
    expect(party).toHaveLength(3);
    party.forEach(pkm => {
      expect(pkm.level).toBe(20);
      expect(pkm.moveset.length).toBeGreaterThan(0);
    });
    expect(game.scene.getModifiers(MapModifier).length).toBeGreaterThan(0);
  });

  describe("Custom Seeds", () => {
    it("should support custom moves", async () => {
      vi.spyOn(pokerogueApi.daily, "getSeed").mockResolvedValue("/moves0001000200030004,03320006,01300919");
      await game.dailyMode.startBattle();

      const [moves1, moves2, moves3] = game.scene.getPlayerParty().map(p => p.moveset.map(pm => pm.moveId));
      expect(moves1, stringifyEnumArray(MoveId, moves1)).toEqual([
        MoveId.POUND,
        MoveId.KARATE_CHOP,
        MoveId.DOUBLE_SLAP,
        MoveId.COMET_PUNCH,
      ]);
      expect(moves2, stringifyEnumArray(MoveId, moves2)).toEqual([
        MoveId.AERIAL_ACE,
        MoveId.PAY_DAY,
        expect.anything(),
        expect.anything(),
      ]);
      expect(moves3, stringifyEnumArray(MoveId, moves3)).toEqual([
        MoveId.SKULL_BASH,
        MoveId.MALIGNANT_CHAIN,
        expect.anything(),
        expect.anything(),
      ]);
    });

    it("should allow omitting starters", async () => {
      vi.spyOn(pokerogueApi.daily, "getSeed").mockResolvedValue("/moves0001000200030004");
      await game.dailyMode.startBattle();

      const [moves1, moves2, moves3] = game.scene.getPlayerParty().map(p => p.moveset.map(pm => pm.moveId));
      expect(moves1, stringifyEnumArray(MoveId, moves1)).toEqual([
        MoveId.POUND,
        MoveId.KARATE_CHOP,
        MoveId.DOUBLE_SLAP,
        MoveId.COMET_PUNCH,
      ]);
      expect(moves2, "was not a random moveset").toHaveLength(4);
      expect(moves3, "was not a random moveset").toHaveLength(4);
    });

    it("should skip invalid move IDs", async () => {
      vi.spyOn(pokerogueApi.daily, "getSeed").mockResolvedValue("/moves9999,,0919");
      await game.dailyMode.startBattle();

      const moves = game.field.getPlayerPokemon().moveset.map(pm => pm.moveId);
      expect(moves, "invalid move was in moveset").not.toContain(MoveId[9999]);
    });
  });
});

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
      .startingBiome(BiomeId.ICE_CAVE)
      .battleStyle("single")
      .startingLevel(100) // Avoid levelling up
      .disableTrainerWaves()
      .moveset([MoveId.SPLASH])
      .enemyMoveset(MoveId.SPLASH);
    game.modifiers.addCheck("EVIOLITE").addCheck("MINI_BLACK_HOLE");
    vi.spyOn(pokerogueApi.daily, "getSeed").mockResolvedValue("test-seed");
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    game.modifiers.clearChecks();
  });

  it("should not have Eviolite and Mini Black Hole available in Classic if not unlocked", async () => {
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);
    game.move.select(MoveId.SPLASH);
    await game.doKillOpponents();
    await game.phaseInterceptor.to("BattleEndPhase");
    game.onNextPrompt("SelectModifierPhase", UiMode.MODIFIER_SELECT, () => {
      expect(game.scene.ui.getHandler()).toBeInstanceOf(ModifierSelectUiHandler);
      game.modifiers.testCheck("EVIOLITE", false).testCheck("MINI_BLACK_HOLE", false);
    });
  });

  it("should have Eviolite and Mini Black Hole available in Daily", async () => {
    await game.dailyMode.startBattle();
    game.move.select(MoveId.SPLASH);
    await game.doKillOpponents();
    await game.phaseInterceptor.to("BattleEndPhase");
    game.onNextPrompt("SelectModifierPhase", UiMode.MODIFIER_SELECT, () => {
      expect(game.scene.ui.getHandler()).toBeInstanceOf(ModifierSelectUiHandler);
      game.modifiers.testCheck("EVIOLITE", true).testCheck("MINI_BLACK_HOLE", true);
    });
  });
});
