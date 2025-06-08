import { BattlerIndex } from "#app/battle";
import { AbilityId } from "#app/enums/ability-id";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import type { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Thousand Arrows", () => {
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
      .enemySpecies(SpeciesId.SHUCKLE)
      .startingLevel(100)
      .enemyLevel(100)
      .ability(AbilityId.COMPOUND_EYES)
      .enemyAbility(AbilityId.BALL_FETCH)
      .moveset(MoveId.THOUSAND_ARROWS)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should hit and ground Flying-type targets, dealing neutral damage", async () => {
    game.override.enemySpecies(SpeciesId.ARCHEOPS);
    await game.classicMode.startBattle([SpeciesId.ILLUMISE]);

    const shuckle = game.scene.getEnemyPokemon()!;
    expect(shuckle.getTag(BattlerTagType.IGNORE_FLYING)).toBeUndefined();

    game.move.select(MoveId.THOUSAND_ARROWS);
    await game.phaseInterceptor.to("MoveEffectPhase", false);
    const hitSpy = vi.spyOn(game.scene.getCurrentPhase() as MoveEffectPhase, "hitCheck");

    await game.toEndOfTurn();

    expect(hitSpy).toHaveReturnedWith([expect.anything(), 1]);
    expect(shuckle.getTag(BattlerTagType.IGNORE_FLYING)).toBeDefined();
    expect(shuckle.hp).toBeLessThan(shuckle.getMaxHp());
  });

  it("should hit and ground targets with Levitate", async () => {
    game.override.enemyAbility(AbilityId.LEVITATE);
    await game.classicMode.startBattle([SpeciesId.ILLUMISE]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    expect(enemyPokemon.getTag(BattlerTagType.IGNORE_FLYING)).toBeUndefined();

    game.move.select(MoveId.THOUSAND_ARROWS);
    await game.toEndOfTurn();

    expect(enemyPokemon.getTag(BattlerTagType.IGNORE_FLYING)).toBeDefined();
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
  });

  it("should hit and ground targets under the effects of Magnet Rise", async () => {
    await game.classicMode.startBattle([SpeciesId.ILLUMISE]);

    game.move.select(MoveId.THOUSAND_ARROWS);
    await game.move.forceEnemyMove(MoveId.MAGNET_RISE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("MoveEndPhase");

    // ensure magnet rise suceeeded before getting knocked down
    const enemyPokemon = game.field.getEnemyPokemon();
    expect(enemyPokemon.getTag(BattlerTagType.FLOATING)).toBeDefined();
    await game.toEndOfTurn();

    expect(enemyPokemon.getTag(BattlerTagType.FLOATING)).toBeUndefined();
    expect(enemyPokemon.getTag(BattlerTagType.IGNORE_FLYING)).toBeDefined();
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
  });

  it.each<{ name: string; move: MoveId }>([
    { name: "Fly", move: MoveId.FLY },
    { name: "Bounce", move: MoveId.BOUNCE },
  ])("should cancel the target's Fly", async ({ move }) => {
    await game.classicMode.startBattle([SpeciesId.ILLUMISE]);

    game.move.select(MoveId.THOUSAND_ARROWS);
    await game.move.forceEnemyMove(move);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("MoveEndPhase");

    // Fly should've worked... until we smacked them
    const shuckle = game.field.getEnemyPokemon();
    expect(shuckle.getTag(BattlerTagType.FLYING)).toBeDefined();
    expect(shuckle.getTag(BattlerTagType.IGNORE_FLYING)).toBeUndefined();

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(shuckle.getTag(BattlerTagType.FLYING)).toBeUndefined();
    expect(shuckle.getTag(BattlerTagType.IGNORE_FLYING)).toBeDefined();
    expect(shuckle.hp).toBeLessThan(shuckle.getMaxHp());
  });

  it("should NOT ground semi-invulnerable targets unless already ungrounded", async () => {
    await game.classicMode.startBattle([SpeciesId.ILLUMISE]);

    game.move.select(MoveId.THOUSAND_ARROWS);
    await game.move.forceEnemyMove(MoveId.DIG);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();

    const shuckle = game.field.getEnemyPokemon();
    expect(shuckle.isGrounded()).toBe(false);
    expect(shuckle.getTag(BattlerTagType.IGNORE_FLYING)).toBeUndefined();
    expect(shuckle.hp).toBeLessThan(shuckle.getMaxHp());
  });

  // TODO: Sky drop is currently unimplemented
  it.todo("should hit midair targets from Sky Drop without interrupting");
});
