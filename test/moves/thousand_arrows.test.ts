import { BattlerIndex } from "#enums/battler-index";
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
      .enemySpecies(SpeciesId.EELEKTROSS)
      .startingLevel(100)
      .enemyLevel(50)
      .ability(AbilityId.COMPOUND_EYES)
      .enemyAbility(AbilityId.STURDY)
      .moveset(MoveId.THOUSAND_ARROWS)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should hit and ground Flying-type targets, dealing neutral damage", async () => {
    game.override.enemySpecies(SpeciesId.ARCHEOPS);
    await game.classicMode.startBattle([SpeciesId.ILLUMISE]);

    const archeops = game.scene.getEnemyPokemon()!;
    expect(archeops.getTag(BattlerTagType.IGNORE_FLYING)).toBeUndefined();

    game.move.select(MoveId.THOUSAND_ARROWS);
    await game.phaseInterceptor.to("MoveEffectPhase", false);
    const hitSpy = vi.spyOn(game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase, "hitCheck");
    await game.toEndOfTurn();

    expect(hitSpy).toHaveReturnedWith([expect.anything(), 1]);
    expect(archeops.getTag(BattlerTagType.IGNORE_FLYING)).toBeDefined();
    expect(archeops.isGrounded()).toBe(true);
    expect(archeops.hp).toBeLessThan(archeops.getMaxHp());
  });

  it("should hit and ground targets with Levitate without affecting effectiveness", async () => {
    game.override.enemyPassiveAbility(AbilityId.LEVITATE);
    await game.classicMode.startBattle([SpeciesId.ILLUMISE]);

    const eelektross = game.scene.getEnemyPokemon()!;
    expect(eelektross.getTag(BattlerTagType.IGNORE_FLYING)).toBeUndefined();

    game.move.select(MoveId.THOUSAND_ARROWS);
    await game.phaseInterceptor.to("MoveEffectPhase", false);
    const hitSpy = vi.spyOn(game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase, "hitCheck");
    await game.toEndOfTurn();

    expect(eelektross.getTag(BattlerTagType.IGNORE_FLYING)).toBeDefined();
    expect(eelektross.hp).toBeLessThan(eelektross.getMaxHp());
    expect(hitSpy).toHaveReturnedWith([expect.anything(), 2]);
  });

  it("should hit and ground targets under the effects of Magnet Rise", async () => {
    await game.classicMode.startBattle([SpeciesId.ILLUMISE]);

    game.move.select(MoveId.THOUSAND_ARROWS);
    await game.move.forceEnemyMove(MoveId.MAGNET_RISE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("MoveEndPhase");

    // ensure magnet rise suceeeded before getting knocked down
    const eelektross = game.field.getEnemyPokemon();
    expect(eelektross.getTag(BattlerTagType.FLOATING)).toBeDefined();
    await game.toEndOfTurn();

    expect(eelektross.getTag(BattlerTagType.FLOATING)).toBeUndefined();
    expect(eelektross.getTag(BattlerTagType.IGNORE_FLYING)).toBeDefined();
    expect(eelektross.hp).toBeLessThan(eelektross.getMaxHp());
  });

  it.each<{ name: string; move: MoveId }>([
    { name: "Fly", move: MoveId.FLY },
    { name: "Bounce", move: MoveId.BOUNCE },
  ])("should hit through and cancel the target's $name", async ({ move }) => {
    await game.classicMode.startBattle([SpeciesId.ILLUMISE]);

    game.move.select(MoveId.THOUSAND_ARROWS);
    await game.move.forceEnemyMove(move);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("MoveEndPhase");

    // Fly should've worked until hit
    const eelektross = game.field.getEnemyPokemon();
    expect(eelektross.getTag(BattlerTagType.FLYING)).toBeDefined();
    expect(eelektross.getTag(BattlerTagType.IGNORE_FLYING)).toBeUndefined();

    await game.toEndOfTurn();
    expect(eelektross.getTag(BattlerTagType.FLYING)).toBeUndefined();
    expect(eelektross.getTag(BattlerTagType.IGNORE_FLYING)).toBeDefined();
    expect(eelektross.hp).toBeLessThan(eelektross.getMaxHp());
  });

  // TODO: verify behavior
  it.todo("should not ground semi-invulnerable targets unless already ungrounded", async () => {
    await game.classicMode.startBattle([SpeciesId.ILLUMISE]);

    game.move.select(MoveId.THOUSAND_ARROWS);
    await game.move.forceEnemyMove(MoveId.DIG);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();

    const eelektross = game.field.getEnemyPokemon();
    expect(eelektross.isGrounded()).toBe(false);
    expect(eelektross.getTag(BattlerTagType.IGNORE_FLYING)).toBeUndefined();
    expect(eelektross.hp).toBeLessThan(eelektross.getMaxHp());
  });

  // TODO: Sky drop is currently unimplemented
  it.todo("should hit midair targets from Sky Drop without interrupting");
});
