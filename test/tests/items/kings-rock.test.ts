import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Items - King's Rock", () => {
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
      .startingHeldItems([{ entry: HeldItemId.KINGS_ROCK }])
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset([MoveId.SPLASH])
      .startingLevel(1);
  });

  it.each([
    { roll: 0, shouldFlinch: true },
    { roll: 99, shouldFlinch: false },
  ])("should flinch the target only when the roll succeeds ($shouldFlinch)", async ({ roll, shouldFlinch }) => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    vi.spyOn(player, "randBattleSeedInt").mockReturnValue(roll);

    game.move.use(MoveId.TACKLE);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEndPhase");

    if (shouldFlinch) {
      expect(game.field.getEnemyPokemon()).toHaveBattlerTag(BattlerTagType.FLINCHED);
    } else {
      expect(game.field.getEnemyPokemon()).not.toHaveBattlerTag(BattlerTagType.FLINCHED);
    }
  });
});
