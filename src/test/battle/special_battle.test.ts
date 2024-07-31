import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import {Mode} from "#app/ui/ui";
import Overrides from "#app/overrides";
import {
  CommandPhase,
} from "#app/phases";
import GameManager from "#app/test/utils/gameManager";
import Phaser from "phaser";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";

describe("Test Battle Phase", () => {
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
    vi.spyOn(Overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.RATTATA);
    vi.spyOn(Overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(2000);
    vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE]);
    vi.spyOn(Overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.HYDRATION);
    vi.spyOn(Overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.HYDRATION);
    vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);
  });

  it("startBattle 2vs1 boss", async() => {
    vi.spyOn(Overrides, "BATTLE_TYPE_OVERRIDE", "get").mockReturnValue("single");
    vi.spyOn(Overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(10);
    await game.startBattle([
      Species.BLASTOISE,
      Species.CHARIZARD,
    ]);
    expect(game.scene.ui?.getMode()).toBe(Mode.COMMAND);
    expect(game.scene.getCurrentPhase().constructor.name).toBe(CommandPhase.name);
  }, 20000);

  it("startBattle 2vs2 boss", async() => {
    vi.spyOn(Overrides, "BATTLE_TYPE_OVERRIDE", "get").mockReturnValue("double");
    vi.spyOn(Overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(10);
    await game.startBattle([
      Species.BLASTOISE,
      Species.CHARIZARD,
    ]);
    expect(game.scene.ui?.getMode()).toBe(Mode.COMMAND);
    expect(game.scene.getCurrentPhase().constructor.name).toBe(CommandPhase.name);
  }, 20000);

  it("startBattle 2vs2 trainer", async() => {
    vi.spyOn(Overrides, "BATTLE_TYPE_OVERRIDE", "get").mockReturnValue("double");
    vi.spyOn(Overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(5);
    await game.startBattle([
      Species.BLASTOISE,
      Species.CHARIZARD,
    ]);
    expect(game.scene.ui?.getMode()).toBe(Mode.COMMAND);
    expect(game.scene.getCurrentPhase().constructor.name).toBe(CommandPhase.name);
  }, 20000);

  it("startBattle 2vs1 trainer", async() => {
    vi.spyOn(Overrides, "BATTLE_TYPE_OVERRIDE", "get").mockReturnValue("single");
    vi.spyOn(Overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(5);
    await game.startBattle([
      Species.BLASTOISE,
      Species.CHARIZARD,
    ]);
    expect(game.scene.ui?.getMode()).toBe(Mode.COMMAND);
    expect(game.scene.getCurrentPhase().constructor.name).toBe(CommandPhase.name);
  }, 20000);

  it("startBattle 2vs1 rival", async() => {
    vi.spyOn(Overrides, "BATTLE_TYPE_OVERRIDE", "get").mockReturnValue("single");
    vi.spyOn(Overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(8);
    await game.startBattle([
      Species.BLASTOISE,
      Species.CHARIZARD,
    ]);
    expect(game.scene.ui?.getMode()).toBe(Mode.COMMAND);
    expect(game.scene.getCurrentPhase().constructor.name).toBe(CommandPhase.name);
  }, 20000);

  it("startBattle 2vs2 rival", async() => {
    vi.spyOn(Overrides, "BATTLE_TYPE_OVERRIDE", "get").mockReturnValue("double");
    vi.spyOn(Overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(8);
    await game.startBattle([
      Species.BLASTOISE,
      Species.CHARIZARD,
    ]);
    expect(game.scene.ui?.getMode()).toBe(Mode.COMMAND);
    expect(game.scene.getCurrentPhase().constructor.name).toBe(CommandPhase.name);
  }, 20000);

  it("startBattle 1vs1 trainer", async() => {
    vi.spyOn(Overrides, "BATTLE_TYPE_OVERRIDE", "get").mockReturnValue("single");
    vi.spyOn(Overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(5);
    await game.startBattle([
      Species.BLASTOISE,
    ]);
    expect(game.scene.ui?.getMode()).toBe(Mode.COMMAND);
    expect(game.scene.getCurrentPhase().constructor.name).toBe(CommandPhase.name);
  }, 20000);

  it("startBattle 2vs2 trainer", async() => {
    vi.spyOn(Overrides, "BATTLE_TYPE_OVERRIDE", "get").mockReturnValue("double");
    vi.spyOn(Overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(5);
    await game.startBattle([
      Species.BLASTOISE,
      Species.CHARIZARD,
    ]);
    expect(game.scene.ui?.getMode()).toBe(Mode.COMMAND);
    expect(game.scene.getCurrentPhase().constructor.name).toBe(CommandPhase.name);
  }, 20000);

  it("startBattle 4vs2 trainer", async() => {
    vi.spyOn(Overrides, "BATTLE_TYPE_OVERRIDE", "get").mockReturnValue("double");
    vi.spyOn(Overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(5);
    await game.startBattle([
      Species.BLASTOISE,
      Species.CHARIZARD,
      Species.DARKRAI,
      Species.GABITE,
    ]);
    expect(game.scene.ui?.getMode()).toBe(Mode.COMMAND);
    expect(game.scene.getCurrentPhase().constructor.name).toBe(CommandPhase.name);
  }, 20000);
});

