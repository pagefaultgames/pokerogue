import { TerrainType } from "#app/data/terrain";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { HitCheckResult } from "#enums/hit-check-result";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import type { MoveEffectPhase } from "#phases/move-effect-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Telekinesis", () => {
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
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyLevel(60)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should cause opposing non-OHKO moves to always hit the target", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    game.move.use(MoveId.TELEKINESIS);
    await game.toNextTurn();

    expect(enemy).toHaveBattlerTag(BattlerTagType.TELEKINESIS);
    expect(enemy).toHaveBattlerTag(BattlerTagType.FLOATING);

    game.move.use(MoveId.TACKLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceMiss();
    await game.toEndOfTurn();

    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
    expect(player.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
  });

  it("should forcibly unground the target", async () => {
    game.override.terrain(TerrainType.ELECTRIC);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const enemy = game.field.getEnemyPokemon();

    game.move.use(MoveId.TELEKINESIS);
    await game.toNextTurn();

    // Use Earthquake - should be ineffective
    game.move.use(MoveId.EARTHQUAKE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase", false);
    const hitSpy = vi.spyOn(game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase, "hitCheck");

    await game.toNextTurn();

    expect(enemy.hp).toBe(enemy.getMaxHp());
    expect(hitSpy).toHaveLastReturnedWith([HitCheckResult.NO_EFFECT, 0]);

    // Use Spore - should succeed due to being ungrounded
    game.move.use(MoveId.SPORE);
    await game.toEndOfTurn();

    expect(enemy.status?.effect).toBe(StatusEffect.SLEEP);
  });

  // TODO: Make an it.each testing the invalid species for Telekinesis
  it.todo.each([])("should fail if used on $name", () => {});

  it("should still affect enemies transformed into invalid Pokemon", async () => {
    game.override.enemyAbility(AbilityId.IMPOSTER);
    await game.classicMode.startBattle([SpeciesId.DIGLETT]);

    const enemyOpponent = game.field.getEnemyPokemon();

    game.move.use(MoveId.TELEKINESIS);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    expect(enemyOpponent).toHaveBattlerTag(BattlerTagType.TELEKINESIS);
    expect(enemyOpponent).toHaveBattlerTag(BattlerTagType.FLOATING);
    expect(enemyOpponent.summonData.speciesForm?.speciesId).toBe(SpeciesId.DIGLETT);
  });

  it("should become grounded when Ingrain is used, but not remove the guaranteed hit effect", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    game.move.use(MoveId.TELEKINESIS);
    await game.toNextTurn();

    game.move.use(MoveId.MUD_SHOT);
    await game.move.forceEnemyMove(MoveId.INGRAIN);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("MoveEndPhase");
    await game.move.forceMiss();
    await game.toEndOfTurn();

    expect(enemy).toHaveBattlerTag(BattlerTagType.TELEKINESIS);
    expect(enemy).toHaveBattlerTag(BattlerTagType.INGRAIN);
    expect(enemy).toHaveBattlerTag(BattlerTagType.IGNORE_FLYING);
    expect(enemy).not.toHaveBattlerTag(BattlerTagType.FLOATING);
    expect(enemy.isGrounded()).toBe(true);
    expect(playerPokemon).toHaveUsedMove({ move: MoveId.MUD_SHOT, result: MoveResult.SUCCESS });
  });

  it("should not be baton passable onto a mega gengar", async () => {
    game.override.starterForms({ [SpeciesId.GENGAR]: 1 });
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.GENGAR]);

    game.move.use(MoveId.BATON_PASS);
    game.doSelectPartyPokemon(1);
    await game.move.forceEnemyMove(MoveId.TELEKINESIS);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(game.field.getPlayerPokemon()).toHaveBattlerTag(BattlerTagType.TELEKINESIS);

    await game.toEndOfTurn();

    expect(game.field.getPlayerPokemon()).not.toHaveBattlerTag(BattlerTagType.TELEKINESIS);
  });
});
