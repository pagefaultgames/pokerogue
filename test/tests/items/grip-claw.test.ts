import { AbilityId } from "#enums/ability-id";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Items - Grip Claw", () => {
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
      .startingHeldItems([{ entry: HeldItemId.GRIP_CLAW }])
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .enemyHeldItems([{ entry: HeldItemId.LEFTOVERS }])
      .startingLevel(1)
      .enemyLevel(100);
  });

  it.each([
    { roll: 0, steals: true },
    { roll: 99, steals: false },
  ])("should steal the target's held item on contact only when the roll succeeds ($steals)", async ({
    roll,
    steals,
  }) => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    vi.spyOn(player, "randBattleSeedInt").mockReturnValue(roll);

    game.move.use(MoveId.TACKLE);
    await game.toEndOfTurn();

    if (steals) {
      expect(player).toHaveHeldItem(HeldItemId.LEFTOVERS);
      expect(game.field.getEnemyPokemon()).not.toHaveHeldItem(HeldItemId.LEFTOVERS);
    } else {
      expect(game.field.getEnemyPokemon()).toHaveHeldItem(HeldItemId.LEFTOVERS);
    }
  });
});
