import { describe, expect, it, vi } from "vitest";
import Pokemon from "#app/field/pokemon.js";
import BattleScene from "#app/battle-scene.js";
import { BattlerTag, BattlerTagLapseType, OctolockTag, TrappedTag } from "#app/data/battler-tags.js";
import { StatChangePhase } from "#app/phases.js";
import { BattlerTagType } from "#app/enums/battler-tag-type.js";
import { Stat } from "#enums/stat";

vi.mock("#app/battle-scene.js");

describe("BattlerTag - OctolockTag", () => {
  describe("lapse behavior", () => {
    it("unshifts a StatChangePhase with expected stat stage changes", { timeout: 10000 }, async () => {
      const mockPokemon = {
        scene: new BattleScene(),
        getBattlerIndex: () => 0,
      } as Pokemon;

      const subject = new OctolockTag(1);

      vi.spyOn(mockPokemon.scene, "unshiftPhase").mockImplementation(phase => {
        expect(phase).toBeInstanceOf(StatChangePhase);
        expect((phase as StatChangePhase)["stages"]).toEqual(-1);
        expect((phase as StatChangePhase)["stats"]).toEqual([ Stat.DEF, Stat.SPDEF ]);
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
