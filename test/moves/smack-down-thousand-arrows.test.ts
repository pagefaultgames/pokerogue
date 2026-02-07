import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Challenges } from "#enums/challenges";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { Pokemon } from "#field/pokemon";
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
      .enemySpecies(SpeciesId.MAGIKARP)
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
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const rookidee = game.field.getEnemyPokemon();
    expect(rookidee.isGrounded()).toBe(false);

    game.move.use(move);
    await game.toEndOfTurn();

    expect(rookidee).toHaveBattlerTag(BattlerTagType.IGNORE_FLYING);
    expect(rookidee.isGrounded()).toBe(true);
  });

  it("should affect targets with Levitate", async () => {
    game.override.enemyPassiveAbility(AbilityId.LEVITATE);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const karp = game.field.getEnemyPokemon();
    expect(karp.isGrounded()).toBe(false);

    game.move.use(MoveId.THOUSAND_ARROWS);
    await game.toEndOfTurn();

    expect(karp).toHaveBattlerTag(BattlerTagType.IGNORE_FLYING);
    expect(karp).not.toHaveFullHp();
    expect(karp.isGrounded()).toBe(true);
  });

  it.each([
    { name: "TELEKINESIS", tag: BattlerTagType.TELEKINESIS },
    { name: "FLOATING", tag: BattlerTagType.FLOATING },
  ])("should cancel the effects of BattlerTagType.$name", async ({ tag }) => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const karp = game.field.getEnemyPokemon();
    karp.addTag(tag);
    // Fake karp being ungrounded since Smack Down/etc require it to apply their effects
    vi.spyOn(karp, "isGrounded").mockReturnValue(false);

    game.move.use(MoveId.SMACK_DOWN);
    await game.toEndOfTurn();

    expect(karp).not.toHaveBattlerTag(tag);
    expect(karp).toHaveBattlerTag(BattlerTagType.IGNORE_FLYING);
  });

  it("should not affect already-grounded targets", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const karp = game.field.getEnemyPokemon();
    expect(karp.isGrounded()).toBe(true);

    game.move.use(MoveId.SMACK_DOWN);
    await game.toEndOfTurn();

    expect(karp).not.toHaveBattlerTag(BattlerTagType.IGNORE_FLYING);
    expect(karp.isGrounded()).toBe(true);
  });

  // NB: This test might sound useless, but semi-invulnerable pokemon are technically considered "ungrounded"
  // by most* things
  it("should not consider semi-invulnerability as a valid source of ungroundedness", async () => {
    game.override.ability(AbilityId.NO_GUARD);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.use(MoveId.THOUSAND_ARROWS);
    await game.move.forceEnemyMove(MoveId.DIG);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("MoveEndPhase");

    // Magikarp should be grounded solely due to using Dig
    const karp = game.field.getEnemyPokemon();
    expect(karp).toHaveBattlerTag(BattlerTagType.UNDERGROUND);
    expect(karp.isGrounded()).toBe(false);
    expect(karp.isGrounded(true)).toBe(true);
    await game.toEndOfTurn();

    // Magikarp took damage but was not forcibly grounded
    expect(karp).not.toHaveBattlerTag(BattlerTagType.IGNORE_FLYING);
    expect(karp).toHaveBattlerTag(BattlerTagType.UNDERGROUND);
    expect(karp).not.toHaveFullHp();
  });

  // TODO: Sky drop is currently partially implemented
  it.todo("should hit midair targets from Sky Drop without interrupting");

  describe("Thousand Arrows", () => {
    let hitSpy: MockInstance<Pokemon["getAttackTypeEffectiveness"]>;

    beforeEach(() => {
      game.override.enemySpecies(SpeciesId.ARCHEOPS);
      hitSpy = vi.spyOn(Pokemon.prototype, "getAttackTypeEffectiveness");
    });

    it("should have a fixed 1x type effectiveness when hitting airborne Flying-types", async () => {
      await game.classicMode.startBattle(SpeciesId.MAGIKARP);

      const archeops = game.field.getEnemyPokemon();

      // first turn: 1x
      game.move.use(MoveId.THOUSAND_ARROWS);
      await game.toNextTurn();

      expect(archeops).not.toHaveFullHp();
      expect(archeops.isGrounded()).toBe(true);
      expect(hitSpy).toHaveLastReturnedWith([1]);

      // hit while already grounded: 2x
      game.move.use(MoveId.THOUSAND_ARROWS);
      await game.toNextTurn();

      expect(hitSpy).toHaveLastReturnedWith([2]);

      // repeat turns 1/2, but with a resistance instead of a weakness
      archeops.resetSummonData();
      archeops.hp = archeops.getMaxHp();
      archeops.summonData.types = [PokemonType.GRASS, PokemonType.FLYING];

      game.move.use(MoveId.THOUSAND_ARROWS);
      await game.toNextTurn();

      expect(hitSpy).toHaveLastReturnedWith([1]);

      game.move.use(MoveId.THOUSAND_ARROWS);
      await game.toEndOfTurn();

      expect(hitSpy).toHaveLastReturnedWith([0.5]);
    });

    it("should consider other sources of groundedness", async () => {
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      game.scene.arena.addTag(ArenaTagType.GRAVITY, 0, 0, 0);

      const archeops = game.field.getEnemyPokemon();
      expect(archeops.isGrounded()).toBe(true);

      game.move.use(MoveId.THOUSAND_ARROWS);
      await game.phaseInterceptor.to("MoveEndPhase");

      expect(hitSpy).toHaveLastReturnedWith([2]);
    });

    // Source: https://replay.pokemonshowdown.com/gen9nationaldex-2533601259-bxnwtg9v01t95ujly828ud22jjxuaihpw
    it("should deal 2x damage to Flying-types in Inverse Battles, even if already grounded", async () => {
      game.challengeMode.addChallenge(Challenges.INVERSE_BATTLE, 1, 1);
      await game.challengeMode.startBattle(SpeciesId.FEEBAS);

      const feebas = game.field.getPlayerPokemon();
      const archeops = game.field.getEnemyPokemon();
      const move = allMoves[MoveId.THOUSAND_ARROWS];

      expect(archeops.getAttackTypeEffectiveness(move.type, { source: feebas, move })).toBe(2);

      archeops.addTag(BattlerTagType.IGNORE_FLYING, 0, 0);
      expect(archeops.isGrounded()).toBe(true);
      expect(archeops.getAttackTypeEffectiveness(move.type, { source: feebas, move })).toBe(2);
    });
  });
});
