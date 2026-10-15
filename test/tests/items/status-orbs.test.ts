import { AbilityId } from "#enums/ability-id";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe.each([
  { itemName: "Flame Orb", item: HeldItemId.FLAME_ORB, status: StatusEffect.BURN },
  { itemName: "Toxic Orb", item: HeldItemId.TOXIC_ORB, status: StatusEffect.TOXIC },
])("Items - Status Orbs ($itemName)", ({ item, status }) => {
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
      .startingHeldItems([{ entry: item }])
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should inflict its status effect on the holder at the end of the turn", async () => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    expect(player.status).toBeUndefined();

    game.move.use(MoveId.SPLASH);
    await game.toNextTurn();

    expect(player).toHaveStatusEffect(status);
    expect(player).toHaveHeldItem(item);
  });
});
