import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Ability - Unseen Fist", () => {
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
      .ability(AbilityId.UNSEEN_FIST)
      .enemySpecies(SpeciesId.BLISSEY)
      .startingLevel(100)
      .enemyLevel(100);
  });

  async function testUnseenFistHitResult(
    attackMove: MoveId,
    protectMove: MoveId,
    shouldSucceed: boolean,
  ): Promise<void> {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();

    game.move.use(attackMove);
    await game.move.forceEnemyMove(protectMove);
    await game.toEndOfTurn();

    if (shouldSucceed) {
      expect(player).toHaveUsedMove({ move: attackMove, result: MoveResult.SUCCESS });
    } else {
      expect(player).toHaveUsedMove({ move: attackMove, result: MoveResult.MISS });
    }
  }

  it("should cause contact moves to ignore Protect", async () => {
    await testUnseenFistHitResult(MoveId.QUICK_ATTACK, MoveId.PROTECT, true);
  });

  it("should not cause non-contact moves to ignore Protect", async () => {
    await testUnseenFistHitResult(MoveId.ABSORB, MoveId.PROTECT, false);
  });

  it("should not apply if the source has Long Reach", async () => {
    game.override.passiveAbility(AbilityId.LONG_REACH);
    await testUnseenFistHitResult(MoveId.QUICK_ATTACK, MoveId.PROTECT, false);
  });

  it("should cause contact moves to ignore Wide Guard", async () => {
    await testUnseenFistHitResult(MoveId.BREAKING_SWIPE, MoveId.WIDE_GUARD, true);
  });

  it("should not cause non-contact moves to ignore Wide Guard", async () => {
    await testUnseenFistHitResult(MoveId.BULLDOZE, MoveId.WIDE_GUARD, false);
  });

  it("should not ignore Substitute", async () => {
    game.override.enemyLevel(1);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();
    enemy.addTag(BattlerTagType.SUBSTITUTE, 0, MoveId.NONE, enemy.id);

    game.move.use(MoveId.TACKLE);
    await game.move.forceEnemyMove(MoveId.PROTECT);
    await game.toEndOfTurn();

    expect(player).toHaveUsedMove({ move: MoveId.TACKLE, result: MoveResult.SUCCESS });
    expect(enemy).not.toHaveBattlerTag(BattlerTagType.SUBSTITUTE);
    expect(enemy).toHaveFullHp();
  });

  it("should deal 25% damage when hitting through protection effects", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    game.move.use(MoveId.TACKLE);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toEndOfTurn();

    expect(player).toHaveUsedMove({ move: MoveId.TACKLE, result: MoveResult.SUCCESS });
    const hpLost = enemy.getInverseHp();

    enemy.hp = enemy.getMaxHp();

    // do it with unseen fist active
    // TODO: This would be far easier if actual damage multi funcs were added

    game.move.use(MoveId.TACKLE);
    await game.move.forceEnemyMove(MoveId.PROTECT);
    await game.toEndOfTurn();

    expect(player).toHaveUsedMove({ move: MoveId.TACKLE, result: MoveResult.SUCCESS });
    expect(enemy).toHaveTakenDamage(hpLost * 0.25);
  });

  // TODO: Review what the mainline behaviour here is
  it.todo("should deal normal damage for moves that normally bypass Protect");
});
