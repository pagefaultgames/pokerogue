import { BattlerTagType } from "#enums/battler-tag-type";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { MoveResult } from "#enums/move-result";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it, expect, vi } from "vitest";
import { BattlerIndex } from "#enums/battler-index";
import type { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { HitCheckResult } from "#enums/hit-check-result";
import { StatusEffect } from "#enums/status-effect";

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

    expect(enemy.getTag(BattlerTagType.TELEKINESIS)).toBeDefined();
    expect(enemy.getTag(BattlerTagType.FLOATING)).toBeDefined();

    game.move.use(MoveId.TACKLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceMiss();
    await game.toEndOfTurn();

    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
    expect(player.getLastXMoves()[0].result).toBe(MoveResult.MISS);
  });

  it("should render the target immune to Ground-moves and terrain", async () => {
    game.override.ability(AbilityId.ELECTRIC_SURGE);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const enemy = game.field.getEnemyPokemon();

    game.move.use(MoveId.TELEKINESIS);
    await game.toNextTurn();

    game.move.use(MoveId.EARTHQUAKE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");
    const hitSpy = vi.spyOn(game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase, "hitCheck");

    await game.toNextTurn();

    expect(enemy.hp).toBe(enemy.getMaxHp());
    expect(hitSpy).toHaveLastReturnedWith([HitCheckResult.NO_EFFECT, 0]);

    game.move.use(MoveId.SPORE);
    await game.toNextTurn();

    expect(enemy.status?.effect).toBe(StatusEffect.SLEEP);
  });

  it("should still affect enemies transformed into invalid Pokemon", async () => {
    game.override.enemyAbility(AbilityId.IMPOSTER);
    await game.classicMode.startBattle([SpeciesId.DIGLETT]);

    const enemyOpponent = game.field.getEnemyPokemon();

    game.move.use(MoveId.TELEKINESIS);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    expect(enemyOpponent.getTag(BattlerTagType.TELEKINESIS)).toBeDefined();
    expect(enemyOpponent.getTag(BattlerTagType.FLOATING)).toBeDefined();
    expect(enemyOpponent.summonData.speciesForm?.speciesId).toBe(SpeciesId.DIGLETT);
  });

  it.each<{ name: string; move: MoveId }>([
    { name: "Smack Down", move: MoveId.SMACK_DOWN },
    { name: "Thousand Arrows", move: MoveId.THOUSAND_ARROWS },
  ])("should be removed when hit by $name", async ({ move }) => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const enemy = game.field.getEnemyPokemon();

    game.move.select(MoveId.TELEKINESIS);
    await game.toNextTurn();

    game.move.use(move);
    await game.toNextTurn();
    expect(enemy.getTag(BattlerTagType.TELEKINESIS)).toBeUndefined();
    expect(enemy.getTag(BattlerTagType.FLOATING)).toBeUndefined();
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
    await game.toNextTurn();

    expect(enemy.getTag(BattlerTagType.TELEKINESIS)).toBeDefined();
    expect(enemy.getTag(BattlerTagType.INGRAIN)).toBeDefined();
    expect(enemy.getTag(BattlerTagType.IGNORE_FLYING)).toBeDefined();
    expect(enemy.getTag(BattlerTagType.FLOATING)).toBeUndefined();
    expect(enemy.isGrounded()).toBe(false);
    expect(playerPokemon.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
  });

  it("should not be baton passable onto a mega gengar", async () => {
    game.override
      .moveset([MoveId.BATON_PASS])
      .enemyMoveset([MoveId.TELEKINESIS])
      .starterForms({ [SpeciesId.GENGAR]: 1 });

    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.GENGAR]);

    game.move.use(MoveId.BATON_PASS);
    game.doSelectPartyPokemon(1);

    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();

    expect(game.field.getPlayerPokemon().getTag(BattlerTagType.TELEKINESIS)).toBeUndefined();
  });
});
