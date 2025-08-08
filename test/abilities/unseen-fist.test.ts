import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { BerryPhase } from "#phases/berry-phase";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Unseen Fist", () => {
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
      .starterSpecies(SpeciesId.URSHIFU)
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyMoveset(MoveId.PROTECT)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should cause a contact move to ignore Protect", async () =>
    await testUnseenFistHitResult(game, MoveId.QUICK_ATTACK, MoveId.PROTECT, true));

  it("should not cause a non-contact move to ignore Protect", async () =>
    await testUnseenFistHitResult(game, MoveId.ABSORB, MoveId.PROTECT, false));

  it("should not apply if the source has Long Reach", async () => {
    game.override.passiveAbility(AbilityId.LONG_REACH);
    await testUnseenFistHitResult(game, MoveId.QUICK_ATTACK, MoveId.PROTECT, false);
  });

  it("should cause a contact move to ignore Wide Guard", async () =>
    await testUnseenFistHitResult(game, MoveId.BREAKING_SWIPE, MoveId.WIDE_GUARD, true));

  it("should not cause a non-contact move to ignore Wide Guard", async () =>
    await testUnseenFistHitResult(game, MoveId.BULLDOZE, MoveId.WIDE_GUARD, false));

  it("should cause a contact move to ignore Protect, but not Substitute", async () => {
    game.override.enemyLevel(1).moveset([MoveId.TACKLE]);

    await game.classicMode.startBattle();

    const enemyPokemon = game.field.getEnemyPokemon();
    enemyPokemon.addTag(BattlerTagType.SUBSTITUTE, 0, MoveId.NONE, enemyPokemon.id);

    game.move.select(MoveId.TACKLE);

    await game.phaseInterceptor.to(BerryPhase, false);

    expect(enemyPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeUndefined();
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
  });
});

async function testUnseenFistHitResult(
  game: GameManager,
  attackMove: MoveId,
  protectMove: MoveId,
  shouldSucceed = true,
): Promise<void> {
  game.override.moveset([attackMove]).enemyMoveset(protectMove);

  await game.classicMode.startBattle();

  const leadPokemon = game.field.getPlayerPokemon();
  expect(leadPokemon).not.toBe(undefined);

  const enemyPokemon = game.field.getEnemyPokemon();
  expect(enemyPokemon).not.toBe(undefined);

  const enemyStartingHp = enemyPokemon.hp;

  game.move.select(attackMove);
  await game.phaseInterceptor.to(TurnEndPhase, false);

  if (shouldSucceed) {
    expect(enemyPokemon.hp).toBeLessThan(enemyStartingHp);
  } else {
    expect(enemyPokemon.hp).toBe(enemyStartingHp);
  }
}
