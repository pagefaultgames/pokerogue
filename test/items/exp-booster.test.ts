import { AbilityId } from "#enums/ability-id";
import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemId } from "#enums/held-item-id";
import { GameManager } from "#test/test-utils/game-manager";
import { NumberHolder } from "#utils/common";
import { applyHeldItems } from "#utils/items";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("EXP Modifier Items", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);

    game.override.enemyAbility(AbilityId.BALL_FETCH).ability(AbilityId.BALL_FETCH).battleStyle("single");
  });

  it("EXP booster items stack multiplicatively", async () => {
    game.override.startingHeldItems([{ entry: HeldItemId.LUCKY_EGG, count: 3 }, { entry: HeldItemId.GOLDEN_EGG }]);
    await game.classicMode.startBattle();

    const partyMember = game.field.getPlayerPokemon();
    partyMember.exp = 100;
    const expHolder = new NumberHolder(partyMember.exp);
    applyHeldItems(HeldItemEffect.EXP_BOOSTER, { pokemon: partyMember, expAmount: expHolder });
    expect(expHolder.value).toBe(440);
  });
});
