import { OctolockTag, TrappedTag } from "#data/battler-tags";
import { BattlerTagLapseType } from "#enums/battler-tag-lapse-type";
import { Stat } from "#enums/stat";
import type { Pokemon } from "#field/pokemon";
import { StatStageChangePhase } from "#phases/stat-stage-change-phase";
import { GameManager } from "#test/test-utils/game-manager";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

describe("BattlerTag - OctolockTag", () => {
  describe("lapse behavior", () => {
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

    it("unshifts a StatStageChangePhase with expected stat stage changes", async () => {
      const mockPokemon = {
        getBattlerIndex: () => 0,
      } as Pokemon;

      const subject = new OctolockTag(1);

      vi.spyOn(game.scene.phaseManager, "unshiftPhase").mockImplementation(phase => {
        expect(phase).toBeInstanceOf(StatStageChangePhase);
        expect((phase as StatStageChangePhase)["stages"]).toEqual(-1);
        expect((phase as StatStageChangePhase)["stats"]).toEqual([Stat.DEF, Stat.SPDEF]);
      });

      subject.lapse(mockPokemon, BattlerTagLapseType.TURN_END);

      expect(game.scene.phaseManager.unshiftPhase).toBeCalledTimes(1);
    });
  });

  it("traps its target (extends TrappedTag)", async () => {
    expect(new OctolockTag(1)).toBeInstanceOf(TrappedTag);
  });
});
