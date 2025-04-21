import { Biome } from "#app/enums/biome";
import { Moves } from "#app/enums/moves";
import { MapModifier } from "#app/modifier/modifier";
import { pokerogueApi } from "#app/plugins/api/pokerogue-api";
import ModifierSelectUiHandler from "#app/ui/modifier-select-ui-handler";
import { Species } from "#enums/species";
import { UiMode } from "#enums/ui-mode";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import GameManager from "#test/testUtils/gameManager";

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
    vi.spyOn(pokerogueApi.daily, "getSeed").mockResolvedValue("test-seed");
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it("should initialize properly", async () => {
    await game.dailyMode.runToSummon();

    const party = game.scene.getPlayerParty();
    expect(party).toHaveLength(3);
    party.forEach(pkm => {
      expect(pkm.level).toBe(20);
      expect(pkm.moveset.length).toBeGreaterThan(0);
    });
    expect(game.scene.getModifiers(MapModifier).length).toBeGreaterThan(0);
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
      .startingBiome(Biome.ICE_CAVE)
      .battleStyle("single")
      .startingLevel(100) // Avoid levelling up
      .disableTrainerWaves()
      .moveset([Moves.SPLASH])
      .enemyMoveset(Moves.SPLASH);
    game.modifiers.addCheck("EVIOLITE").addCheck("MINI_BLACK_HOLE");
    vi.spyOn(pokerogueApi.daily, "getSeed").mockResolvedValue("test-seed");
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    game.modifiers.clearChecks();
  });

  it("should not have Eviolite and Mini Black Hole available in Classic if not unlocked", async () => {
    await game.classicMode.startBattle([Species.BULBASAUR]);
    game.move.select(Moves.SPLASH);
    await game.doKillOpponents();
    await game.phaseInterceptor.to("BattleEndPhase");
    game.onNextPrompt("SelectModifierPhase", UiMode.MODIFIER_SELECT, () => {
      expect(game.scene.ui.getHandler()).toBeInstanceOf(ModifierSelectUiHandler);
      game.modifiers.testCheck("EVIOLITE", false).testCheck("MINI_BLACK_HOLE", false);
    });
  });

  it("should have Eviolite and Mini Black Hole available in Daily", async () => {
    await game.dailyMode.startBattle();
    game.move.select(Moves.SPLASH);
    await game.doKillOpponents();
    await game.phaseInterceptor.to("BattleEndPhase");
    game.onNextPrompt("SelectModifierPhase", UiMode.MODIFIER_SELECT, () => {
      expect(game.scene.ui.getHandler()).toBeInstanceOf(ModifierSelectUiHandler);
      game.modifiers.testCheck("EVIOLITE", true).testCheck("MINI_BLACK_HOLE", true);
    });
  });
});
