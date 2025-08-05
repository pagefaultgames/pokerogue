import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import type { MoveEffectPhase } from "#phases/move-effect-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Smack Down and Thousand Arrows", () => {
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
      .criticalHits(false)
      .ability(AbilityId.COMPOUND_EYES)
      .enemyAbility(AbilityId.STURDY)
      .enemyMoveset(MoveId.SPLASH);
  });

  it.each([
    { name: "Smack Down", move: MoveId.SMACK_DOWN },
    { name: "Thousand Arrows", move: MoveId.THOUSAND_ARROWS },
  ])("$name should hit and ground ungrounded targets", async ({ move }) => {
    game.override.enemySpecies(SpeciesId.TORNADUS);
    await game.classicMode.startBattle([SpeciesId.ILLUMISE]);

    const enemy = game.field.getEnemyPokemon();
    expect(enemy.isGrounded()).toBe(false);

    game.move.use(move);
    await game.phaseInterceptor.to("MoveEffectPhase", false);
    await game.toEndOfTurn();

    expect(enemy.getTag(BattlerTagType.IGNORE_FLYING)).toBeDefined();
    expect(enemy.isGrounded()).toBe(true);
  });

  it("should affect targets with Levitate", async () => {
    game.override.enemyPassiveAbility(AbilityId.LEVITATE);
    await game.classicMode.startBattle([SpeciesId.ILLUMISE]);

    const eelektross = game.field.getEnemyPokemon();
    expect(eelektross.isGrounded()).toBe(false);

    game.move.use(MoveId.THOUSAND_ARROWS);
    await game.phaseInterceptor.to("MoveEffectPhase", false);
    await game.toEndOfTurn();

    expect(eelektross.getTag(BattlerTagType.IGNORE_FLYING)).toBeDefined();
    expect(eelektross.hp).toBeLessThan(eelektross.getMaxHp());
    expect(eelektross.isGrounded()).toBe(true);
  });

  it.each([
    { name: "Telekinesis", move: MoveId.TELEKINESIS, tags: [BattlerTagType.TELEKINESIS, BattlerTagType.FLOATING] },
    { name: "Magnet Rise", move: MoveId.MAGNET_RISE, tags: [BattlerTagType.FLOATING] },
  ])("should cancel the ungrounding effects of $name", async ({ move, tags }) => {
    await game.classicMode.startBattle([SpeciesId.ILLUMISE]);

    game.move.use(MoveId.SMACK_DOWN);
    await game.move.forceEnemyMove(move);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("MoveEndPhase");

    // ensure move suceeeded before getting knocked down
    const eelektross = game.field.getEnemyPokemon();
    tags.forEach(t => {
      expect(eelektross.getTag(t)).toBeDefined();
    });
    expect(eelektross.isGrounded()).toBe(false);

    await game.toEndOfTurn();

    tags.forEach(t => {
      expect(eelektross.getTag(t)).toBeUndefined();
    });
    expect(eelektross.hp).toBeLessThan(eelektross.getMaxHp());
    expect(eelektross.getTag(BattlerTagType.IGNORE_FLYING)).toBeDefined();
    expect(eelektross.isGrounded()).toBe(false);
  });

  // NB: This test might sound useless, but semi-invulnerable pokemon are technically considered "ungrounded"
  // by most things
  it("should not ground semi-invulnerable targets unless already ungrounded", async () => {
    await game.classicMode.startBattle([SpeciesId.ILLUMISE]);

    game.move.use(MoveId.THOUSAND_ARROWS);
    await game.move.forceEnemyMove(MoveId.DIG);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();

    // Eelektross took damage but was not forcibly grounded
    const eelektross = game.field.getEnemyPokemon();
    expect(eelektross.isGrounded()).toBe(true);
    expect(eelektross.getTag(BattlerTagType.IGNORE_FLYING)).toBeUndefined();
    expect(eelektross.hp).toBeLessThan(eelektross.getMaxHp());
  });

  // TODO: Sky drop is currently partially implemented
  it.todo("should hit midair targets from Sky Drop without interrupting");

  describe("Thousand Arrows", () => {
    it("should deal a fixed 1x damage to ungrounded flying-types", async () => {
      game.override.enemySpecies(SpeciesId.ARCHEOPS);
      await game.classicMode.startBattle([SpeciesId.ILLUMISE]);

      const archeops = game.field.getEnemyPokemon();
      game.move.use(MoveId.THOUSAND_ARROWS);
      await game.phaseInterceptor.to("MoveEffectPhase", false);
      const hitSpy = vi.spyOn(game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase, "hitCheck");
      await game.toEndOfTurn();

      expect(hitSpy).toHaveReturnedWith([expect.anything(), 1]);
      expect(archeops.getTag(BattlerTagType.IGNORE_FLYING)).toBeDefined();
      expect(archeops.isGrounded()).toBe(true);
      expect(archeops.hp).toBeLessThan(archeops.getMaxHp());
    });
  });
});
