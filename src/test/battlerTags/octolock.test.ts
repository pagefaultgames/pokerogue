import BattleScene from "#app/battle-scene";
import { BattleStat } from "#app/data/battle-stat";
import { BattlerTag, BattlerTagLapseType, OctolockTag, TrappedTag } from "#app/data/battler-tags";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import Pokemon from "#app/field/pokemon";
import { StatChangePhase } from "#app/phases/stat-change-phase";
import { describe, expect, it, vi } from "vitest";

vi.mock("#app/battle-scene.js");

describe("BattlerTag - OctolockTag", () => {
  describe("lapse behavior", () => {
    it("unshifts a StatChangePhase with expected stat changes", { timeout: 10000 }, async () => {
      const mockPokemon = {
        scene: new BattleScene(),
        getBattlerIndex: () => 0,
      } as Pokemon;

      const subject = new OctolockTag(1);

      vi.spyOn(mockPokemon.scene, "unshiftPhase").mockImplementation(phase => {
        expect(phase).toBeInstanceOf(StatChangePhase);
        expect((phase as StatChangePhase)["levels"]).toEqual(-1);
        expect((phase as StatChangePhase)["stats"]).toEqual([BattleStat.DEF, BattleStat.SPDEF]);
      });

      subject.lapse(mockPokemon, BattlerTagLapseType.TURN_END);

      expect(mockPokemon.scene.unshiftPhase).toBeCalledTimes(1);
    });
  });

  it ("traps its target (extends TrappedTag)", { timeout: 2000 }, async () => {
    expect(new OctolockTag(1)).toBeInstanceOf(TrappedTag);
  });

  it("can be added to pokemon who are not octolocked", { timeout: 2000 }, async => {
    const mockPokemon = {
      getTag: vi.fn().mockReturnValue(undefined) as Pokemon["getTag"],
    } as Pokemon;

    const subject = new OctolockTag(1);

    expect(subject.canAdd(mockPokemon)).toBeTruthy();

    expect(mockPokemon.getTag).toHaveBeenCalledTimes(1);
    expect(mockPokemon.getTag).toHaveBeenCalledWith(BattlerTagType.OCTOLOCK);
  });

  it("cannot be added to pokemon who are octolocked", { timeout: 2000 }, async => {
    const mockPokemon = {
      getTag: vi.fn().mockReturnValue(new BattlerTag(null!, null!, null!, null!)) as Pokemon["getTag"],
    } as Pokemon;

    const subject = new OctolockTag(1);

    expect(subject.canAdd(mockPokemon)).toBeFalsy();

    expect(mockPokemon.getTag).toHaveBeenCalledTimes(1);
    expect(mockPokemon.getTag).toHaveBeenCalledWith(BattlerTagType.OCTOLOCK);
  });
});
