import { AbilityId } from "#enums/ability-id";
import { ArenaTagType } from "#enums/arena-tag-type";
import { Challenges } from "#enums/challenges";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Lunar Dance and Healing Wish", () => {
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
    game.override.battleStyle("double").enemyAbility(AbilityId.BALL_FETCH).enemyMoveset(MoveId.SPLASH);
  });

  describe.each([
    { moveName: "Healing Wish", moveId: MoveId.HEALING_WISH },
    { moveName: "Lunar Dance", moveId: MoveId.LUNAR_DANCE },
  ])("$moveName", ({ moveId }) => {
    it("should sacrifice the user to restore the switched in Pokemon's HP", async () => {
      await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.CHARMANDER, SpeciesId.SQUIRTLE]);

      const [bulbasaur, charmander, squirtle] = game.scene.getPlayerParty();
      squirtle.hp = 1;

      game.move.use(MoveId.SPLASH, 0);
      game.move.use(moveId, 1);
      game.doSelectPartyPokemon(2);

      await game.toNextTurn();

      expect(bulbasaur.isFullHp()).toBe(true);
      expect(charmander.isFainted()).toBe(true);
      expect(squirtle.isFullHp()).toBe(true);
    });

    it("should sacrifice the user to cure the switched in Pokemon's status", async () => {
      game.override.statusEffect(StatusEffect.BURN);

      await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.CHARMANDER, SpeciesId.SQUIRTLE]);
      const [bulbasaur, charmander, squirtle] = game.scene.getPlayerParty();

      game.move.use(MoveId.SPLASH, 0);
      game.move.use(moveId, 1);
      game.doSelectPartyPokemon(2);

      await game.toNextTurn();

      expect(bulbasaur.status?.effect).toBe(StatusEffect.BURN);
      expect(charmander.isFainted()).toBe(true);
      expect(squirtle.status?.effect).toBeUndefined();
    });

    it("should fail if the user has no non-fainted allies in their party", async () => {
      game.override.battleStyle("single");

      await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.CHARMANDER]);
      const [bulbasaur, charmander] = game.scene.getPlayerParty();

      game.move.use(MoveId.MEMENTO);
      game.doSelectPartyPokemon(1);

      await game.toNextTurn();

      expect(bulbasaur.isFainted()).toBe(true);
      expect(charmander.isActive(true)).toBe(true);

      game.move.use(moveId);

      await game.toEndOfTurn();

      expect(charmander.isFullHp());
      expect(charmander.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
    });

    it("should fail if the user has no challenge-eligible allies", async () => {
      game.override.battleStyle("single");
      // Mono normal challenge
      game.challengeMode.addChallenge(Challenges.SINGLE_TYPE, PokemonType.NORMAL + 1, 0);
      await game.challengeMode.startBattle([SpeciesId.RATICATE, SpeciesId.ODDISH]);

      const raticate = game.field.getPlayerPokemon();

      game.move.use(moveId);
      await game.toNextTurn();

      expect(raticate.isFullHp()).toBe(true);
      expect(raticate.getLastXMoves()[0].result).toEqual(MoveResult.FAIL);
    });

    it("should store its effect if the switched-in Pokemon would be unaffected", async () => {
      game.override.battleStyle("single");

      await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.CHARMANDER, SpeciesId.SQUIRTLE]);

      const [bulbasaur, charmander, squirtle] = game.scene.getPlayerParty();
      squirtle.hp = 1;

      game.move.use(moveId);
      game.doSelectPartyPokemon(1);

      await game.toNextTurn();

      // Bulbasaur fainted and stored a healing effect
      expect(bulbasaur.isFainted()).toBe(true);
      expect(charmander.isFullHp()).toBe(true);
      expect(game.phaseInterceptor.log).not.toContain("PokemonHealPhase");
      expect(game.scene.arena.getTag(ArenaTagType.PENDING_HEAL)).toBeDefined();

      // Switch to damaged Squirtle. HW/LD's effect should activate
      game.doSwitchPokemon(2);

      await game.toEndOfTurn();
      expect(squirtle.isFullHp()).toBe(true);
      expect(game.scene.arena.getTag(ArenaTagType.PENDING_HEAL)).toBeUndefined();

      // Set Charmander's HP to 1, then switch back to Charmander.
      // HW/LD shouldn't activate again
      charmander.hp = 1;
      game.doSwitchPokemon(2);

      await game.toEndOfTurn();
      expect(charmander.hp).toBe(1);
    });

    it("should only store one charge of the effect at a time", async () => {
      game.override.battleStyle("single");

      await game.classicMode.startBattle([
        SpeciesId.BULBASAUR,
        SpeciesId.CHARMANDER,
        SpeciesId.SQUIRTLE,
        SpeciesId.PIKACHU,
      ]);

      const [bulbasaur, charmander, squirtle, pikachu] = game.scene.getPlayerParty();
      [squirtle, pikachu].forEach(p => (p.hp = 1));

      // Use HW/LD and send in Charmander. HW/LD's effect should be stored
      game.move.use(moveId);
      game.doSelectPartyPokemon(1);

      await game.toNextTurn();
      expect(bulbasaur.isFainted()).toBe(true);
      expect(charmander.isFullHp()).toBe(true);
      expect(charmander.isFullHp());
      expect(game.phaseInterceptor.log).not.toContain("PokemonHealPhase");
      expect(game.scene.arena.getTag(ArenaTagType.PENDING_HEAL)).toBeDefined();

      // Use HW/LD again, sending in Squirtle. HW/LD should activate and heal Squirtle
      game.move.use(moveId);
      game.doSelectPartyPokemon(2);

      await game.toNextTurn();
      expect(charmander.isFainted()).toBe(true);
      expect(squirtle.isFullHp()).toBe(true);
      expect(squirtle.isFullHp());

      // Switch again to Pikachu. HW/LD's effect shouldn't be present
      game.doSwitchPokemon(3);

      expect(pikachu.isFullHp()).toBe(false);
    });
  });

  it("Lunar Dance should sacrifice the user to restore the switched in Pokemon's PP", async () => {
    game.override.battleStyle("single");

    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.CHARMANDER]);

    const [bulbasaur, charmander] = game.scene.getPlayerParty();

    game.move.use(MoveId.SPLASH);
    await game.toNextTurn();

    game.doSwitchPokemon(1);
    await game.toNextTurn();

    game.move.use(MoveId.LUNAR_DANCE);
    game.doSelectPartyPokemon(1);

    await game.toNextTurn();
    expect(charmander.isFainted()).toBeTruthy();
    bulbasaur.getMoveset().forEach(mv => expect(mv.ppUsed).toBe(0));
  });

  it("should stack with each other", async () => {
    game.override.battleStyle("single");

    await game.classicMode.startBattle([
      SpeciesId.BULBASAUR,
      SpeciesId.CHARMANDER,
      SpeciesId.SQUIRTLE,
      SpeciesId.PIKACHU,
    ]);

    const [bulbasaur, charmander, squirtle, pikachu] = game.scene.getPlayerParty();
    [squirtle, pikachu].forEach(p => {
      p.hp = 1;
      p.getMoveset().forEach(mv => (mv.ppUsed = 1));
    });

    game.move.use(MoveId.LUNAR_DANCE);
    game.doSelectPartyPokemon(1);

    await game.toNextTurn();
    expect(bulbasaur.isFainted()).toBe(true);
    expect(charmander.isFullHp()).toBe(true);
    expect(game.phaseInterceptor.log).not.toContain("PokemonHealPhase");
    expect(game.scene.arena.getTag(ArenaTagType.PENDING_HEAL)).toBeDefined();

    game.move.use(MoveId.HEALING_WISH);
    game.doSelectPartyPokemon(2);

    // Lunar Dance should apply first since it was used first, restoring Squirtle's HP and PP
    await game.toNextTurn();
    expect(squirtle.isFullHp()).toBe(true);
    squirtle.getMoveset().forEach(mv => expect(mv.ppUsed).toBe(0));
    expect(game.scene.arena.getTag(ArenaTagType.PENDING_HEAL)).toBeDefined();

    game.doSwitchPokemon(3);

    // Healing Wish should apply on the next switch, restoring Pikachu's HP
    await game.toEndOfTurn();
    expect(pikachu.isFullHp()).toBe(true);
    pikachu.getMoveset().forEach(mv => expect(mv.ppUsed).toBe(1));
    expect(game.scene.arena.getTag(ArenaTagType.PENDING_HEAL)).toBeUndefined();
  });
});
