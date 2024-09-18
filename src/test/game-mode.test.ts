import { GameMode, GameModes, getGameMode } from "#app/game-mode";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as Utils from "../utils";
import GameManager from "./utils/gameManager";
import { getPartyLuckValue } from "#app/modifier/modifier-type";
import { Species } from "#app/enums/species";
import { getPokemonSpecies } from "#app/data/pokemon-species";

describe("game-mode", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });
  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    vi.clearAllMocks();
    vi.resetAllMocks();
  });
  beforeEach(() => {
    game = new GameManager(phaserGame);
  });
  describe("classic", () => {
    let classicGameMode: GameMode;
    beforeEach(() => {
      classicGameMode = getGameMode(GameModes.CLASSIC);
    });
    it("does NOT spawn trainers within 3 waves of fixed battle", () => {
      const { arena } = game.scene;
      /** set wave 16 to be a fixed trainer fight meaning wave 13-19 don't allow trainer spawns */
      vi.spyOn(classicGameMode, "isFixedBattle").mockImplementation(
        (n: number) => (n === 16 ? true : false)
      );
      vi.spyOn(arena, "getTrainerChance").mockReturnValue(1);
      vi.spyOn(Utils, "randSeedInt").mockReturnValue(0);
      expect(classicGameMode.isWaveTrainer(11, arena)).toBeFalsy();
      expect(classicGameMode.isWaveTrainer(12, arena)).toBeTruthy();
      expect(classicGameMode.isWaveTrainer(13, arena)).toBeFalsy();
      expect(classicGameMode.isWaveTrainer(14, arena)).toBeFalsy();
      expect(classicGameMode.isWaveTrainer(15, arena)).toBeFalsy();
      // Wave 16 is a fixed trainer battle
      expect(classicGameMode.isWaveTrainer(17, arena)).toBeFalsy();
      expect(classicGameMode.isWaveTrainer(18, arena)).toBeFalsy();
      expect(classicGameMode.isWaveTrainer(19, arena)).toBeFalsy();
    });
  });
  describe.skip("Luck Check", async () => {
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
    });

    it("applies luck in Classic", () => {
      game.override
        .shinyLevel(true, 2);
      game.classicMode.startBattle([Species.PICHU]);
      game.scene.addPlayerPokemon(getPokemonSpecies(Species.PICHU), 5, undefined, undefined, undefined, true, 2);
      const party = game.scene.getParty();
      const luck = Phaser.Math.Clamp(party.map(p => p.isAllowedInBattle() ? p.getLuck() : 0)
        .reduce((total: integer, value: integer) => total += value, 0), 0, 14);
      expect(luck).toBeGreaterThan(0);
      expect(getPartyLuckValue(party)).toBeGreaterThan(0);
    });
    it("does not apply luck in Daily Runs", () => {
      game.override
        .shinyLevel(true, 2);
      game.dailyMode.startBattle();
      game.scene.addPlayerPokemon(getPokemonSpecies(Species.PICHU), 5, undefined, undefined, undefined, true, 2);
      const party = game.scene.getParty();
      const luck = Phaser.Math.Clamp(party.map(p => p.isAllowedInBattle() ? p.getLuck() : 0)
        .reduce((total: integer, value: integer) => total += value, 0), 0, 14);
      expect(luck).toBeGreaterThan(0);
      expect(getPartyLuckValue(party)).toBe(0);
    });
  });
});
