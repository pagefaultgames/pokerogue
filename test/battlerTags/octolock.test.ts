import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type Pokemon from "#app/field/pokemon";
import { BattlerTagLapseType, OctolockTag, TrappedTag } from "#app/data/battler-tags";
import { StatStageChangePhase } from "#app/phases/stat-stage-change-phase";
import { Stat } from "#enums/stat";
import GameManager from "#test/testUtils/gameManager";

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

      vi.spyOn(game.scene, "unshiftPhase").mockImplementation(phase => {
        expect(phase).toBeInstanceOf(StatStageChangePhase);
        expect((phase as StatStageChangePhase)["stages"]).toEqual(-1);
        expect((phase as StatStageChangePhase)["stats"]).toEqual([Stat.DEF, Stat.SPDEF]);
      });

      subject.lapse(mockPokemon, BattlerTagLapseType.TURN_END);

      expect(game.scene.unshiftPhase).toBeCalledTimes(1);
    });
  });

  it("traps its target (extends TrappedTag)", async () => {
    expect(new OctolockTag(1)).toBeInstanceOf(TrappedTag);
  });
});
