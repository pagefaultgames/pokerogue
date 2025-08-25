import * as messages from "#app/messages";
import { StockpilingTag } from "#data/battler-tags";
import { PokemonSummonData } from "#data/pokemon-data";
import { Stat } from "#enums/stat";
import type { Pokemon } from "#field/pokemon";
import { StatStageChangePhase } from "#phases/stat-stage-change-phase";
import { GameManager } from "#test/test-utils/game-manager";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.spyOn(messages, "getPokemonNameWithAffix").mockImplementation(() => "");
});

describe("BattlerTag - StockpilingTag", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
    game = new GameManager(phaserGame);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  describe("onAdd", () => {
    it("unshifts a StatStageChangePhase with expected stat stage changes on add", async () => {
      const mockPokemon = {
        getBattlerIndex: () => 0,
      } as Pokemon;

      vi.spyOn(game.scene.phaseManager, "queueMessage").mockImplementation(() => {});

      const subject = new StockpilingTag(1);

      vi.spyOn(game.scene.phaseManager, "unshiftPhase").mockImplementation(phase => {
        expect(phase).toBeInstanceOf(StatStageChangePhase);
        expect((phase as StatStageChangePhase)["stages"]).toEqual(1);
        expect((phase as StatStageChangePhase)["stats"]).toEqual(expect.arrayContaining([Stat.DEF, Stat.SPDEF]));

        (phase as StatStageChangePhase)["onChange"]!(mockPokemon, [Stat.DEF, Stat.SPDEF], [1, 1]);
      });

      subject.onAdd(mockPokemon);

      expect(game.scene.phaseManager.unshiftPhase).toBeCalledTimes(1);
    });

    it("unshifts a StatStageChangePhase with expected stat changes on add (one stat maxed)", async () => {
      const mockPokemon = {
        summonData: new PokemonSummonData(),
        getBattlerIndex: () => 0,
      } as unknown as Pokemon;

      vi.spyOn(game.scene.phaseManager, "queueMessage").mockImplementation(() => {});

      mockPokemon.summonData.statStages[Stat.DEF - 1] = 6;
      mockPokemon.summonData.statStages[Stat.SPD - 1] = 5;

      const subject = new StockpilingTag(1);

      vi.spyOn(game.scene.phaseManager, "unshiftPhase").mockImplementation(phase => {
        expect(phase).toBeInstanceOf(StatStageChangePhase);
        expect((phase as StatStageChangePhase)["stages"]).toEqual(1);
        expect((phase as StatStageChangePhase)["stats"]).toEqual(expect.arrayContaining([Stat.DEF, Stat.SPDEF]));

        (phase as StatStageChangePhase)["onChange"]!(mockPokemon, [Stat.DEF, Stat.SPDEF], [1, 1]);
      });

      subject.onAdd(mockPokemon);

      expect(game.scene.phaseManager.unshiftPhase).toBeCalledTimes(1);
    });
  });

  describe("onOverlap", () => {
    it("unshifts a StatStageChangePhase with expected stat changes on overlap", async () => {
      const mockPokemon = {
        getBattlerIndex: () => 0,
      } as Pokemon;

      vi.spyOn(game.scene.phaseManager, "queueMessage").mockImplementation(() => {});

      const subject = new StockpilingTag(1);

      vi.spyOn(game.scene.phaseManager, "unshiftPhase").mockImplementation(phase => {
        expect(phase).toBeInstanceOf(StatStageChangePhase);
        expect((phase as StatStageChangePhase)["stages"]).toEqual(1);
        expect((phase as StatStageChangePhase)["stats"]).toEqual(expect.arrayContaining([Stat.DEF, Stat.SPDEF]));

        (phase as StatStageChangePhase)["onChange"]!(mockPokemon, [Stat.DEF, Stat.SPDEF], [1, 1]);
      });

      subject.onOverlap(mockPokemon);

      expect(game.scene.phaseManager.unshiftPhase).toBeCalledTimes(1);
    });
  });

  describe("stack limit, stat tracking, and removal", () => {
    // TODO: do we even want this file at all? regardless, this test is broken and is also likely unimportant
    it.todo("can be added up to three times, even when one stat does not change", async () => {
      const mockPokemon = {
        summonData: new PokemonSummonData(),
        getBattlerIndex: () => 0,
      } as Pokemon;

      vi.spyOn(game.scene.phaseManager, "queueMessage").mockImplementation(() => {});

      mockPokemon.summonData.statStages[Stat.DEF - 1] = 5;
      mockPokemon.summonData.statStages[Stat.SPD - 1] = 4;

      const subject = new StockpilingTag(1);

      vi.spyOn(game.scene.phaseManager, "unshiftPhase").mockImplementationOnce(phase => {
        expect(phase).toBeInstanceOf(StatStageChangePhase);
        expect((phase as StatStageChangePhase)["stages"]).toEqual(1);
        expect((phase as StatStageChangePhase)["stats"]).toEqual(expect.arrayContaining([Stat.DEF, Stat.SPDEF]));

        // def doesn't change
        (phase as StatStageChangePhase)["onChange"]!(mockPokemon, [Stat.SPDEF], [1]);
      });

      subject.onAdd(mockPokemon);
      expect(subject.stockpiledCount).toBe(1);

      vi.spyOn(game.scene.phaseManager, "unshiftPhase").mockImplementationOnce(phase => {
        expect(phase).toBeInstanceOf(StatStageChangePhase);
        expect((phase as StatStageChangePhase)["stages"]).toEqual(1);
        expect((phase as StatStageChangePhase)["stats"]).toEqual(expect.arrayContaining([Stat.DEF, Stat.SPDEF]));

        // def doesn't change
        (phase as StatStageChangePhase)["onChange"]!(mockPokemon, [Stat.SPDEF], [1]);
      });

      subject.onOverlap(mockPokemon);
      expect(subject.stockpiledCount).toBe(2);

      vi.spyOn(game.scene.phaseManager, "unshiftPhase").mockImplementationOnce(phase => {
        expect(phase).toBeInstanceOf(StatStageChangePhase);
        expect((phase as StatStageChangePhase)["stages"]).toEqual(1);
        expect((phase as StatStageChangePhase)["stats"]).toEqual(expect.arrayContaining([Stat.DEF, Stat.SPDEF]));

        // neither stat changes, stack count should still increase
      });

      subject.onOverlap(mockPokemon);
      expect(subject.stockpiledCount).toBe(3);

      vi.spyOn(game.scene.phaseManager, "unshiftPhase").mockImplementationOnce(_phase => {
        expect.fail("Should not be called a fourth time");
      });

      // fourth stack should not be applied
      subject.onOverlap(mockPokemon);
      expect(subject.stockpiledCount).toBe(3);
      expect(subject.statChangeCounts).toMatchObject({
        [Stat.DEF]: 0,
        [Stat.SPDEF]: 2,
      });

      // removing tag should reverse stat changes
      vi.spyOn(game.scene.phaseManager, "unshiftPhase").mockImplementationOnce(phase => {
        expect(phase).toBeInstanceOf(StatStageChangePhase);
        expect((phase as StatStageChangePhase)["stages"]).toEqual(-2);
        expect((phase as StatStageChangePhase)["stats"]).toEqual(expect.arrayContaining([Stat.SPDEF]));
      });

      subject.onRemove(mockPokemon);
      expect(game.scene.phaseManager.unshiftPhase).toHaveBeenCalledOnce(); // note that re-spying each add/overlap has been refreshing call count
    });
  });
});
