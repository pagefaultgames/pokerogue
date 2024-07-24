import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import GameManager from "#app/test/utils/gameManager";
import Phaser from "phaser";
import Overrides from "#app/overrides";
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
    const moveToUse = Moves.SPLASH;
    vi.spyOn(Overrides, "BATTLE_TYPE_OVERRIDE", "get").mockReturnValue("single");
    vi.spyOn(Overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(Species.MEWTWO);
    vi.spyOn(Overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.RATTATA);
    vi.spyOn(Overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.HYDRATION);
    vi.spyOn(Overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.ZEN_MODE);
    vi.spyOn(Overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(2000);
    vi.spyOn(Overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(3);
    vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([moveToUse]);
    vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE,Moves.TACKLE,Moves.TACKLE,Moves.TACKLE]);
  });

  it.skip("to next turn", async() => {
    await game.startBattle();
    const turn = game.scene.currentBattle.turn;
    game.doAttack(0);
    await game.toNextTurn();
    expect(game.scene.currentBattle.turn).toBeGreaterThan(turn);
  }, 20000);
});

