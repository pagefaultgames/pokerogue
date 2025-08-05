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
    await game.toEndOfTurn();

    expect(enemy).toHaveBattlerTag(BattlerTagType.IGNORE_FLYING);
    expect(enemy.isGrounded()).toBe(true);
  });

  it("should affect targets with Levitate", async () => {
    game.override.enemyPassiveAbility(AbilityId.LEVITATE);
    await game.classicMode.startBattle([SpeciesId.ILLUMISE]);

    const eelektross = game.field.getEnemyPokemon();
    expect(eelektross.isGrounded()).toBe(false);

    game.move.use(MoveId.THOUSAND_ARROWS);
    await game.toEndOfTurn();

    expect(eelektross).toHaveBattlerTag(BattlerTagType.IGNORE_FLYING);
    expect(eelektross.hp).toBeLessThan(eelektross.getMaxHp());
    expect(eelektross.isGrounded()).toBe(true);
  });

  it.each([
    { name: "TELEKINESIS", tag: BattlerTagType.TELEKINESIS },
    { name: "FLOATING", tag: BattlerTagType.FLOATING },
  ])("should cancel the effects of BattlerTagType.$name", async ({ tag }) => {
    await game.classicMode.startBattle([SpeciesId.ILLUMISE]);

    const eelektross = game.field.getEnemyPokemon();
    eelektross.addTag(tag);

    game.move.use(MoveId.SMACK_DOWN);
    await game.toEndOfTurn();

    expect(eelektross).not.toHaveBattlerTag(tag);
    expect(eelektross).toHaveBattlerTag(BattlerTagType.IGNORE_FLYING);
  });

  // NB: This test might sound useless, but semi-invulnerable pokemon are technically considered "ungrounded"
  // by most things
  it("should not ground semi-invulnerable targets hit via No Guard unless already ungrounded", async () => {
    game.override.ability(AbilityId.NO_GUARD);
    await game.classicMode.startBattle([SpeciesId.ILLUMISE]);

    game.move.use(MoveId.THOUSAND_ARROWS);
    await game.move.forceEnemyMove(MoveId.DIG);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();

    // Eelektross took damage but was not forcibly grounded
    const eelektross = game.field.getEnemyPokemon();
    expect(eelektross.isGrounded()).toBe(true);
    expect(eelektross).not.toHaveBattlerTag(BattlerTagType.IGNORE_FLYING);
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
      expect(archeops).toHaveBattlerTag(BattlerTagType.IGNORE_FLYING);
      expect(archeops.isGrounded()).toBe(true);
      expect(archeops.hp).toBeLessThan(archeops.getMaxHp());
    });
  });
});
