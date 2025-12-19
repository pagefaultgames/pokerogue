import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Move - Magnet Rise", () => {
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
    game.override
      .battleStyle("single")
      .ability(AbilityId.STURDY)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.RATTATA)
      .criticalHits(false);
  });

  it("should make the user ungrounded when used", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGNEZONE]);

    game.move.use(MoveId.MAGNET_RISE);
    await game.move.forceEnemyMove(MoveId.EARTHQUAKE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toEndOfTurn();

    // magnezone levitated and was not hit by earthquake
    const magnezone = game.field.getPlayerPokemon();
    expect(magnezone).toHaveBattlerTag(BattlerTagType.FLOATING);
    expect(magnezone.isGrounded()).toBe(false);
    expect(magnezone).toHaveFullHp();
  });
});
