import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Move - Embargo", () => {
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
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset([MoveId.EMBARGO, MoveId.FALSE_SWIPE])
      .enemyLevel(50);
  });

  it("suppresses held items while applied", async () => {
    game.override.startingHeldItems([{ entry: HeldItemId.FLAME_ORB }, { entry: HeldItemId.SITRUS_BERRY }]);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();

    // Add magic room to the field
    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.EMBARGO);
    await game.toNextTurn();

    expect(feebas).toHaveBattlerTag({
      tagType: BattlerTagType.EMBARGO,
      turnCount: 4, // The 5 turn limit _includes_ the current turn!
    });
    expect(feebas).not.toHaveStatusEffect(StatusEffect.BURN);

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.FALSE_SWIPE);
    await game.toEndOfTurn();

    expect(feebas).toHaveHp(1);
    expect(feebas.heldItemManager.getStack(HeldItemId.SITRUS_BERRY)).toBe(1);
  });
});
