import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Sweet Veil", () => {
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
      .battleStyle("double")
      .ability(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  function expectNoStatus() {
    game.scene.getPlayerField().forEach(p => {
      expect.soft(p).toHaveStatusEffect(StatusEffect.NONE);
    });
  }

  it("should prevent the user and its allies from falling asleep", async () => {
    await game.classicMode.startBattle([SpeciesId.SWIRLIX, SpeciesId.MAGIKARP]);

    game.field.mockAbility(game.field.getPlayerPokemon(), AbilityId.SWEET_VEIL);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.move.forceEnemyMove(MoveId.SPORE, BattlerIndex.PLAYER);
    await game.move.forceEnemyMove(MoveId.SPORE, BattlerIndex.PLAYER_2);
    await game.toEndOfTurn();

    expectNoStatus();
  });

  it("should cause Rest to fail when used by the user or its allies", async () => {
    await game.classicMode.startBattle([SpeciesId.SWIRLIX, SpeciesId.MAGIKARP]);

    const [swirlix, magikarp] = game.scene.getPlayerField();
    game.field.mockAbility(swirlix, AbilityId.SWEET_VEIL);
    swirlix.hp = 1;
    magikarp.hp = 1;

    game.move.use(MoveId.REST, BattlerIndex.PLAYER);
    game.move.use(MoveId.REST, BattlerIndex.PLAYER_2);
    await game.toEndOfTurn();

    expectNoStatus();
    expect(swirlix).toHaveUsedMove({ move: MoveId.REST, result: MoveResult.FAIL });
    expect(magikarp).toHaveUsedMove({ move: MoveId.REST, result: MoveResult.FAIL });
  });

  it("should cause Yawn to fail if used on the user or its allies", async () => {
    await game.classicMode.startBattle([SpeciesId.SWIRLIX, SpeciesId.MAGIKARP]);

    const [shuckle, swirlix] = game.scene.getPlayerField();
    game.field.mockAbility(swirlix, AbilityId.SWEET_VEIL);

    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.move.forceEnemyMove(MoveId.YAWN, BattlerIndex.PLAYER);
    await game.move.forceEnemyMove(MoveId.YAWN, BattlerIndex.PLAYER_2);
    await game.toEndOfTurn();

    expect(shuckle).not.toHaveBattlerTag(BattlerTagType.DROWSY);
    expect(swirlix).not.toHaveBattlerTag(BattlerTagType.DROWSY);
    // TODO: This dooesn't work ATM
    /*
    const [karp1, karp2] = game.scene.getEnemyField();
    expect(karp1).toHaveUsedMove({move: MoveId.YAWN, result: MoveResult.FAIL});
    expect(karp2).toHaveUsedMove({move: MoveId.YAWN, result: MoveResult.FAIL});
     */
  });

  it("should NOT cure allies' sleep status if user is sent out into battle", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS, SpeciesId.SWIRLIX]);

    const [magikarp, , swirlix] = game.scene.getPlayerParty();
    game.field.mockAbility(swirlix, AbilityId.PASTEL_VEIL);

    game.move.use(MoveId.SPLASH);
    game.move.use(MoveId.SPORE, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER);
    await game.toNextTurn();

    expect(magikarp).toHaveStatusEffect(StatusEffect.SLEEP);

    game.move.use(MoveId.SPLASH);
    game.doSwitchPokemon(2);
    await game.toEndOfTurn();

    expect(magikarp).toHaveStatusEffect(StatusEffect.SLEEP);
  });

  it("should prevent an already-drowsy user or ally from falling asleep", async () => {
    await game.classicMode.startBattle([SpeciesId.SHUCKLE, SpeciesId.SWIRLIX]);

    // Add yawn before granting ability
    const [shuckle, swirlix] = game.scene.getPlayerField();
    shuckle.addTag(BattlerTagType.DROWSY, 1);
    swirlix.addTag(BattlerTagType.DROWSY, 1);

    game.field.mockAbility(shuckle, AbilityId.SWEET_VEIL);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.toNextTurn();

    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.toNextTurn();

    expect(shuckle).not.toHaveBattlerTag(BattlerTagType.DROWSY);
    expect(swirlix).not.toHaveBattlerTag(BattlerTagType.DROWSY);
    expectNoStatus();
  });
});
