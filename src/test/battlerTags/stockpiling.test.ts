import BattleScene from "#app/battle-scene";
import { BattleStat } from "#app/data/battle-stat";
import { StockpilingTag } from "#app/data/battler-tags";
import Pokemon, { PokemonSummonData } from "#app/field/pokemon";
import * as messages from "#app/messages";
import { StatChangePhase } from "#app/phases/stat-change-phase";
import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.spyOn(messages, "getPokemonNameWithAffix").mockImplementation(() => "");
});

describe("BattlerTag - StockpilingTag", () => {
  describe("onAdd", () => {
    it("unshifts a StatChangePhase with expected stat changes on add", { timeout: 10000 }, async () => {
      const mockPokemon = {
        scene: vi.mocked(new BattleScene()) as BattleScene,
        getBattlerIndex: () => 0,
      } as Pokemon;

      vi.spyOn(mockPokemon.scene, "queueMessage").mockImplementation(() => {});

      const subject = new StockpilingTag(1);

      vi.spyOn(mockPokemon.scene, "unshiftPhase").mockImplementation(phase => {
        expect(phase).toBeInstanceOf(StatChangePhase);
        expect((phase as StatChangePhase)["levels"]).toEqual(1);
        expect((phase as StatChangePhase)["stats"]).toEqual(expect.arrayContaining([BattleStat.DEF, BattleStat.SPDEF]));

        (phase as StatChangePhase)["onChange"]!(mockPokemon, [BattleStat.DEF, BattleStat.SPDEF], [1, 1]);
      });

      subject.onAdd(mockPokemon);

      expect(mockPokemon.scene.unshiftPhase).toBeCalledTimes(1);
    });

    it("unshifts a StatChangePhase with expected stat changes on add (one stat maxed)", { timeout: 10000 }, async () => {
      const mockPokemon = {
        scene: new BattleScene(),
        summonData: new PokemonSummonData(),
        getBattlerIndex: () => 0,
      } as Pokemon;

      vi.spyOn(mockPokemon.scene, "queueMessage").mockImplementation(() => {});

      mockPokemon.summonData.battleStats[BattleStat.DEF] = 6;
      mockPokemon.summonData.battleStats[BattleStat.SPDEF] = 5;

      const subject = new StockpilingTag(1);

      vi.spyOn(mockPokemon.scene, "unshiftPhase").mockImplementation(phase => {
        expect(phase).toBeInstanceOf(StatChangePhase);
        expect((phase as StatChangePhase)["levels"]).toEqual(1);
        expect((phase as StatChangePhase)["stats"]).toEqual(expect.arrayContaining([BattleStat.DEF, BattleStat.SPDEF]));

        (phase as StatChangePhase)["onChange"]!(mockPokemon, [BattleStat.DEF, BattleStat.SPDEF], [1, 1]);
      });

      subject.onAdd(mockPokemon);

      expect(mockPokemon.scene.unshiftPhase).toBeCalledTimes(1);
    });
  });

  describe("onOverlap", () => {
    it("unshifts a StatChangePhase with expected stat changes on overlap", { timeout: 10000 }, async () => {
      const mockPokemon = {
        scene: new BattleScene(),
        getBattlerIndex: () => 0,
      } as Pokemon;

      vi.spyOn(mockPokemon.scene, "queueMessage").mockImplementation(() => {});

      const subject = new StockpilingTag(1);

      vi.spyOn(mockPokemon.scene, "unshiftPhase").mockImplementation(phase => {
        expect(phase).toBeInstanceOf(StatChangePhase);
        expect((phase as StatChangePhase)["levels"]).toEqual(1);
        expect((phase as StatChangePhase)["stats"]).toEqual(expect.arrayContaining([BattleStat.DEF, BattleStat.SPDEF]));

        (phase as StatChangePhase)["onChange"]!(mockPokemon, [BattleStat.DEF, BattleStat.SPDEF], [1, 1]);
      });

      subject.onOverlap(mockPokemon);

      expect(mockPokemon.scene.unshiftPhase).toBeCalledTimes(1);
    });
  });

  describe("stack limit, stat tracking, and removal", () => {
    it("can be added up to three times, even when one stat does not change", { timeout: 10000 }, async () => {
      const mockPokemon = {
        scene: new BattleScene(),
        summonData: new PokemonSummonData(),
        getBattlerIndex: () => 0,
      } as Pokemon;

      vi.spyOn(mockPokemon.scene, "queueMessage").mockImplementation(() => {});

      mockPokemon.summonData.battleStats[BattleStat.DEF] = 5;
      mockPokemon.summonData.battleStats[BattleStat.SPDEF] = 4;

      const subject = new StockpilingTag(1);

      vi.spyOn(mockPokemon.scene, "unshiftPhase").mockImplementationOnce(phase => {
        expect(phase).toBeInstanceOf(StatChangePhase);
        expect((phase as StatChangePhase)["levels"]).toEqual(1);
        expect((phase as StatChangePhase)["stats"]).toEqual(expect.arrayContaining([BattleStat.DEF, BattleStat.SPDEF]));

        // def doesn't change
        (phase as StatChangePhase)["onChange"]!(mockPokemon, [BattleStat.SPDEF], [1]);
      });

      subject.onAdd(mockPokemon);
      expect(subject.stockpiledCount).toBe(1);

      vi.spyOn(mockPokemon.scene, "unshiftPhase").mockImplementationOnce(phase => {
        expect(phase).toBeInstanceOf(StatChangePhase);
        expect((phase as StatChangePhase)["levels"]).toEqual(1);
        expect((phase as StatChangePhase)["stats"]).toEqual(expect.arrayContaining([BattleStat.DEF, BattleStat.SPDEF]));

        // def doesn't change
        (phase as StatChangePhase)["onChange"]!(mockPokemon, [BattleStat.SPDEF], [1]);
      });

      subject.onOverlap(mockPokemon);
      expect(subject.stockpiledCount).toBe(2);

      vi.spyOn(mockPokemon.scene, "unshiftPhase").mockImplementationOnce(phase => {
        expect(phase).toBeInstanceOf(StatChangePhase);
        expect((phase as StatChangePhase)["levels"]).toEqual(1);
        expect((phase as StatChangePhase)["stats"]).toEqual(expect.arrayContaining([BattleStat.DEF, BattleStat.SPDEF]));

        // neither stat changes, stack count should still increase
      });

      subject.onOverlap(mockPokemon);
      expect(subject.stockpiledCount).toBe(3);

      vi.spyOn(mockPokemon.scene, "unshiftPhase").mockImplementationOnce(phase => {
        throw new Error("Should not be called a fourth time");
      });

      // fourth stack should not be applied
      subject.onOverlap(mockPokemon);
      expect(subject.stockpiledCount).toBe(3);
      expect(subject.statChangeCounts).toMatchObject({ [BattleStat.DEF]: 0, [BattleStat.SPDEF]: 2 });

      // removing tag should reverse stat changes
      vi.spyOn(mockPokemon.scene, "unshiftPhase").mockImplementationOnce(phase => {
        expect(phase).toBeInstanceOf(StatChangePhase);
        expect((phase as StatChangePhase)["levels"]).toEqual(-2);
        expect((phase as StatChangePhase)["stats"]).toEqual(expect.arrayContaining([BattleStat.SPDEF]));
      });

      subject.onRemove(mockPokemon);
      expect(mockPokemon.scene.unshiftPhase).toHaveBeenCalledOnce(); // note that re-spying each add/overlap has been refreshing call count
    });
  });
});
