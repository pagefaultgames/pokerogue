import { AbilityId } from "#enums/ability-id";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { MoveEffectPhase } from "#phases/move-effect-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";

describe("Moves - Smack Down and Thousand Arrows", () => {
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
    game.override.enemySpecies(SpeciesId.ROOKIDEE);
    await game.classicMode.startBattle([SpeciesId.ILLUMISE]);

    const rookidee = game.field.getEnemyPokemon();
    expect(rookidee.isGrounded()).toBe(false);

    game.move.use(move);
    await game.toEndOfTurn();

    expect(rookidee).toHaveBattlerTag(BattlerTagType.IGNORE_FLYING);
    expect(rookidee.isGrounded()).toBe(true);
  });

  it("should affect targets with Levitate", async () => {
    game.override.enemyPassiveAbility(AbilityId.LEVITATE);
    await game.classicMode.startBattle([SpeciesId.ILLUMISE]);

    const eelektross = game.field.getEnemyPokemon();
    expect(eelektross.isGrounded()).toBe(false);

    game.move.use(MoveId.THOUSAND_ARROWS);
    await game.toEndOfTurn();

    expect(eelektross).toHaveBattlerTag(BattlerTagType.IGNORE_FLYING);
    expect(eelektross).not.toHaveFullHp();
    expect(eelektross.isGrounded()).toBe(true);
  });

  it.each([
    { name: "TELEKINESIS", tag: BattlerTagType.TELEKINESIS },
    { name: "FLOATING", tag: BattlerTagType.FLOATING },
  ])("should cancel the effects of BattlerTagType.$name", async ({ tag }) => {
    await game.classicMode.startBattle([SpeciesId.ILLUMISE]);

    const eelektross = game.field.getEnemyPokemon();
    eelektross.addTag(tag);
    // Fake eelektross being ungrounded since Smack Down/etc require it to apply effects
    vi.spyOn(eelektross, "isGrounded").mockReturnValue(false);

    game.move.use(MoveId.SMACK_DOWN);
    await game.toEndOfTurn();

    expect(eelektross).not.toHaveBattlerTag(tag);
    expect(eelektross).toHaveBattlerTag(BattlerTagType.IGNORE_FLYING);
  });

  // NB: This test might sound useless, but semi-invulnerable pokemon are technically considered "ungrounded"
  // by most things
  it("should not consider semi-invulnerability as a valid source of ungroundedness", async () => {
    game.override.ability(AbilityId.NO_GUARD);
    await game.classicMode.startBattle([SpeciesId.ILLUMISE]);

    game.move.use(MoveId.THOUSAND_ARROWS);
    await game.move.forceEnemyMove(MoveId.DIG);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("MoveEndPhase");

    // Eelektross should be grounded solely due to using Dig
    const eelektross = game.field.getEnemyPokemon();
    expect(eelektross).toHaveBattlerTag(BattlerTagType.UNDERGROUND);
    expect(eelektross.isGrounded()).toBe(true);
    expect(eelektross.isGrounded(true)).toBe(false);
    await game.toEndOfTurn();

    // Eelektross took damage but was not forcibly grounded
    expect(eelektross).not.toHaveBattlerTag(BattlerTagType.IGNORE_FLYING);
    expect(eelektross).toHaveBattlerTag(BattlerTagType.UNDERGROUND);
    expect(eelektross).not.toHaveFullHp();
  });

  // TODO: Sky drop is currently partially implemented
  it.todo("should hit midair targets from Sky Drop without interrupting");

  describe("Thousand Arrows", () => {
    let hitSpy: MockInstance<MoveEffectPhase["hitCheck"]>;

    beforeEach(() => {
      game.override.enemySpecies(SpeciesId.ARCHEOPS);
      hitSpy = vi.spyOn(MoveEffectPhase.prototype, "hitCheck");
    });

    it("should have 1x type effectiveness when hitting ungrounded Flying-types", async () => {
      await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

      const archeops = game.field.getEnemyPokemon();

      // first turn: 1x
      game.move.use(MoveId.THOUSAND_ARROWS);
      await game.toEndOfTurn();

      expect(archeops).not.toHaveFullHp();
      expect(archeops.isGrounded()).toBe(true);
      expect(hitSpy).toHaveLastReturnedWith([expect.anything(), 1]);

      // 2nd turn: 2x
      game.move.use(MoveId.THOUSAND_ARROWS);
      await game.toEndOfTurn();

      expect(hitSpy).toHaveLastReturnedWith([expect.anything(), 2]);
    });

    it("should consider other sources of groundedness", async () => {
      await game.classicMode.startBattle([SpeciesId.ILLUMISE]);

      game.scene.arena.addTag(ArenaTagType.GRAVITY, 0, 0, 0);

      const archeops = game.field.getEnemyPokemon();
      expect(archeops.isGrounded()).toBe(true);

      game.move.use(MoveId.THOUSAND_ARROWS);
      await game.phaseInterceptor.to("MoveEndPhase");

      expect(hitSpy).toHaveLastReturnedWith([expect.anything(), 2]);
    });
  });
});
