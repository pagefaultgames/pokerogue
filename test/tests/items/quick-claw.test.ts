import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Items - Quick Claw", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .battleStyle("single")
      .criticalHits(false)
      .ability(AbilityId.BALL_FETCH)
      .startingHeldItems([{ entry: HeldItemId.QUICK_CLAW }])
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset([MoveId.SPLASH]);
  });

  it.each([
    { roll: 0, shouldProc: true },
    { roll: 9, shouldProc: false },
  ])("should add the bypass speed tag only when the roll succeeds ($shouldProc)", async ({ roll, shouldProc }) => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    vi.spyOn(player, "randBattleSeedInt").mockReturnValue(roll);

    game.move.use(MoveId.SPLASH);
    await game.phaseInterceptor.to("MovePhase", false);

    const tag = player.getTag(BattlerTagType.BYPASS_SPEED);
    if (shouldProc) {
      expect(tag).toBeDefined();
    } else {
      expect(tag).toBeUndefined();
    }
  });
});
