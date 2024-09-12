import BattleScene from "#app/battle-scene";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Pokemon, { PokemonSummonData } from "#app/field/pokemon";
import { StockpilingTag } from "#app/data/battler-tags";
import { Stat } from "#enums/stat";
import * as messages from "#app/messages";
import { StatStageChangePhase } from "#app/phases/stat-stage-change-phase";

beforeEach(() => {
  vi.spyOn(messages, "getPokemonNameWithAffix").mockImplementation(() => "");
});

describe("BattlerTag - StockpilingTag", () => {
  describe("onAdd", () => {
    it("unshifts a StatStageChangePhase with expected stat stage changes on add", { timeout: 10000 }, async () => {
      const mockPokemon = {
        scene: vi.mocked(new BattleScene()) as BattleScene,
        getBattlerIndex: () => 0,
      } as Pokemon;

      vi.spyOn(mockPokemon.scene, "queueMessage").mockImplementation(() => {});

      const subject = new StockpilingTag(1);

      vi.spyOn(mockPokemon.scene, "unshiftPhase").mockImplementation(phase => {
        expect(phase).toBeInstanceOf(StatStageChangePhase);
        expect((phase as StatStageChangePhase)["stages"]).toEqual(1);
        expect((phase as StatStageChangePhase)["stats"]).toEqual(expect.arrayContaining([ Stat.DEF, Stat.SPDEF ]));

        (phase as StatStageChangePhase)["onChange"]!(mockPokemon, [Stat.DEF, Stat.SPDEF], [1, 1]);
      });

      subject.onAdd(mockPokemon);

      expect(mockPokemon.scene.unshiftPhase).toBeCalledTimes(1);
    });

    it("unshifts a StatStageChangePhase with expected stat changes on add (one stat maxed)", { timeout: 10000 }, async () => {
      const mockPokemon = {
        scene: new BattleScene(),
        summonData: new PokemonSummonData(),
        getBattlerIndex: () => 0,
      } as Pokemon;

      vi.spyOn(mockPokemon.scene, "queueMessage").mockImplementation(() => {});

      mockPokemon.summonData.statStages[Stat.DEF - 1] = 6;
      mockPokemon.summonData.statStages[Stat.SPD - 1] = 5;

      const subject = new StockpilingTag(1);

      vi.spyOn(mockPokemon.scene, "unshiftPhase").mockImplementation(phase => {
        expect(phase).toBeInstanceOf(StatStageChangePhase);
        expect((phase as StatStageChangePhase)["stages"]).toEqual(1);
        expect((phase as StatStageChangePhase)["stats"]).toEqual(expect.arrayContaining([Stat.DEF, Stat.SPDEF]));

        (phase as StatStageChangePhase)["onChange"]!(mockPokemon, [ Stat.DEF, Stat.SPDEF ], [1, 1]);
      });

      subject.onAdd(mockPokemon);

      expect(mockPokemon.scene.unshiftPhase).toBeCalledTimes(1);
    });
  });

  describe("onOverlap", () => {
    it("unshifts a StatStageChangePhase with expected stat changes on overlap", { timeout: 10000 }, async () => {
      const mockPokemon = {
        scene: new BattleScene(),
        getBattlerIndex: () => 0,
      } as Pokemon;

      vi.spyOn(mockPokemon.scene, "queueMessage").mockImplementation(() => {});

      const subject = new StockpilingTag(1);

      vi.spyOn(mockPokemon.scene, "unshiftPhase").mockImplementation(phase => {
        expect(phase).toBeInstanceOf(StatStageChangePhase);
        expect((phase as StatStageChangePhase)["stages"]).toEqual(1);
        expect((phase as StatStageChangePhase)["stats"]).toEqual(expect.arrayContaining([ Stat.DEF, Stat.SPDEF ]));

        (phase as StatStageChangePhase)["onChange"]!(mockPokemon, [ Stat.DEF, Stat.SPDEF ], [1, 1]);
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

      mockPokemon.summonData.statStages[Stat.DEF - 1] = 5;
      mockPokemon.summonData.statStages[Stat.SPD - 1] = 4;

      const subject = new StockpilingTag(1);

      vi.spyOn(mockPokemon.scene, "unshiftPhase").mockImplementationOnce(phase => {
        expect(phase).toBeInstanceOf(StatStageChangePhase);
        expect((phase as StatStageChangePhase)["stages"]).toEqual(1);
        expect((phase as StatStageChangePhase)["stats"]).toEqual(expect.arrayContaining([ Stat.DEF, Stat.SPDEF ]));

        // def doesn't change
        (phase as StatStageChangePhase)["onChange"]!(mockPokemon, [ Stat.SPDEF ], [1]);
      });

      subject.onAdd(mockPokemon);
      expect(subject.stockpiledCount).toBe(1);

      vi.spyOn(mockPokemon.scene, "unshiftPhase").mockImplementationOnce(phase => {
        expect(phase).toBeInstanceOf(StatStageChangePhase);
        expect((phase as StatStageChangePhase)["stages"]).toEqual(1);
        expect((phase as StatStageChangePhase)["stats"]).toEqual(expect.arrayContaining([ Stat.DEF, Stat.SPDEF ]));

        // def doesn't change
        (phase as StatStageChangePhase)["onChange"]!(mockPokemon, [ Stat.SPDEF ], [1]);
      });

      subject.onOverlap(mockPokemon);
      expect(subject.stockpiledCount).toBe(2);

      vi.spyOn(mockPokemon.scene, "unshiftPhase").mockImplementationOnce(phase => {
        expect(phase).toBeInstanceOf(StatStageChangePhase);
        expect((phase as StatStageChangePhase)["stages"]).toEqual(1);
        expect((phase as StatStageChangePhase)["stats"]).toEqual(expect.arrayContaining([ Stat.DEF, Stat.SPDEF ]));

        // neither stat changes, stack count should still increase
      });

      subject.onOverlap(mockPokemon);
      expect(subject.stockpiledCount).toBe(3);

      vi.spyOn(mockPokemon.scene, "unshiftPhase").mockImplementationOnce(_phase => {
        throw new Error("Should not be called a fourth time");
      });

      // fourth stack should not be applied
      subject.onOverlap(mockPokemon);
      expect(subject.stockpiledCount).toBe(3);
      expect(subject.statChangeCounts).toMatchObject({ [ Stat.DEF ]: 0, [Stat.SPDEF]: 2 });

      // removing tag should reverse stat changes
      vi.spyOn(mockPokemon.scene, "unshiftPhase").mockImplementationOnce(phase => {
        expect(phase).toBeInstanceOf(StatStageChangePhase);
        expect((phase as StatStageChangePhase)["stages"]).toEqual(-2);
        expect((phase as StatStageChangePhase)["stats"]).toEqual(expect.arrayContaining([Stat.SPDEF]));
      });

      subject.onRemove(mockPokemon);
      expect(mockPokemon.scene.unshiftPhase).toHaveBeenCalledOnce(); // note that re-spying each add/overlap has been refreshing call count
    });
  });
});
