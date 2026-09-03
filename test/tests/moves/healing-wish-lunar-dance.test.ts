import { AbilityId } from "#enums/ability-id";
import { ArenaTagType } from "#enums/arena-tag-type";
import { Challenges } from "#enums/challenges";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Lunar Dance and Healing Wish", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
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
      await game.classicMode.startBattle(SpeciesId.BULBASAUR, SpeciesId.CHARMANDER, SpeciesId.SQUIRTLE);

      const [bulbasaur, charmander, squirtle] = game.scene.getPlayerParty();
      squirtle.hp = 1;

      game.move.use(MoveId.SPLASH, 0);
      game.move.use(moveId, 1);
      game.doSelectPartyPokemon(2);
      await game.toNextTurn();

      expect(bulbasaur).toHaveFullHp();
      expect(charmander).toHaveFainted();
      expect(squirtle).toHaveFullHp();
    });

    it("should sacrifice the user to cure the switched in Pokemon's status", async () => {
      game.override.statusEffect(StatusEffect.BURN);
      await game.classicMode.startBattle(SpeciesId.BULBASAUR, SpeciesId.CHARMANDER, SpeciesId.SQUIRTLE);

      const [bulbasaur, charmander, squirtle] = game.scene.getPlayerParty();

      game.move.use(MoveId.SPLASH, 0);
      game.move.use(moveId, 1);
      game.doSelectPartyPokemon(2);
      await game.toNextTurn();

      expect(bulbasaur).toHaveStatusEffect(StatusEffect.BURN);
      expect(charmander).toHaveFainted();
      expect(squirtle).toHaveStatusEffect(StatusEffect.NONE);
    });

    it("should fail if the user has no non-fainted allies in their party", async () => {
      game.override.battleStyle("single");
      await game.classicMode.startBattle(SpeciesId.BULBASAUR, SpeciesId.CHARMANDER);

      const [bulbasaur, charmander] = game.scene.getPlayerParty();

      game.move.use(MoveId.MEMENTO);
      game.doSelectPartyPokemon(1);
      await game.toNextTurn();

      expect(bulbasaur).toHaveFainted();
      expect(charmander.isActive(true)).toBe(true);

      game.move.use(moveId);
      await game.toEndOfTurn();

  expect(charmander).toHaveFullHp();
  expect(charmander).toHaveUsedMove({ move: moveId, result: MoveResult.FAIL });
    });

    it("should fail if the user has no challenge-eligible allies", async () => {
      game.override.battleStyle("single");
      // Mono normal challenge
      game.challengeMode.addChallenge(Challenges.SINGLE_TYPE, PokemonType.NORMAL + 1, 0);
      await game.challengeMode.startBattle(SpeciesId.RATICATE, SpeciesId.ODDISH);

      const raticate = game.field.getPlayerPokemon();

      game.move.use(moveId);
      await game.toNextTurn();

      expect(raticate).toHaveFullHp();
      expect(raticate).toHaveUsedMove({ move: moveId, result: MoveResult.FAIL });
    });

    it("should store its effect if the switched-in Pokemon would be unaffected", async () => {
      game.override.battleStyle("single");
      await game.classicMode.startBattle(SpeciesId.BULBASAUR, SpeciesId.CHARMANDER, SpeciesId.SQUIRTLE);

      const [bulbasaur, charmander, squirtle] = game.scene.getPlayerParty();
      squirtle.hp = 1;

      game.move.use(moveId);
      game.doSelectPartyPokemon(1);
      await game.toNextTurn();

      // Bulbasaur fainted and stored a healing effect
      expect(bulbasaur).toHaveFainted();
      expect(charmander).toHaveFullHp();
      expect(game.phaseInterceptor.log).not.toContain("PokemonHealPhase");
      expect(game).toHaveArenaTag(ArenaTagType.PENDING_HEAL);

      // Switch to damaged Squirtle. HW/LD's effect should activate
      game.doSwitchPokemon(2);
      await game.toEndOfTurn();

      expect(squirtle).toHaveFullHp();
      expect(game).not.toHaveArenaTag(ArenaTagType.PENDING_HEAL);

      // Set Charmander's HP to 1, then switch back to Charmander.
      // HW/LD shouldn't activate again
      charmander.hp = 1;
      game.doSwitchPokemon(2);
      await game.toEndOfTurn();
      expect(charmander.hp).toBe(1);
    });

    it("should only store one charge of the effect at a time", async () => {
      game.override.battleStyle("single");
      await game.classicMode.startBattle(
        SpeciesId.BULBASAUR,
        SpeciesId.CHARMANDER,
        SpeciesId.SQUIRTLE,
        SpeciesId.PIKACHU,
      );

      const [bulbasaur, charmander, squirtle, pikachu] = game.scene.getPlayerParty();
      [squirtle, pikachu].forEach(p => (p.hp = 1));

      // Use HW/LD and send in Charmander. HW/LD's effect should be stored
      game.move.use(moveId);
      game.doSelectPartyPokemon(1);
      await game.toNextTurn();
      expect(bulbasaur).toHaveFainted();
      expect(charmander).toHaveFullHp();
      expect(game.phaseInterceptor.log).not.toContain("PokemonHealPhase");
      expect(game).toHaveArenaTag(ArenaTagType.PENDING_HEAL);

      // Use HW/LD again, sending in Squirtle. HW/LD should activate and heal Squirtle
      game.move.use(moveId);
      game.doSelectPartyPokemon(2);
      await game.toNextTurn();
      expect(charmander).toHaveFainted();
      expect(squirtle).toHaveFullHp();
      expect(squirtle).toHaveFullHp();

      // Switch again to Pikachu. HW/LD's effect shouldn't be present
      game.doSwitchPokemon(3);
      await game.toEndOfTurn();

      expect(pikachu).not.toHaveFullHp();
    });
  });

  it("Lunar Dance should sacrifice the user to restore the switched in Pokemon's PP", async () => {
    game.override.battleStyle("single");
    await game.classicMode.startBattle(SpeciesId.BULBASAUR, SpeciesId.CHARMANDER);

    const [bulbasaur, charmander] = game.scene.getPlayerParty();

    game.move.use(MoveId.SPLASH);
    await game.toNextTurn();

    game.doSwitchPokemon(1);
    await game.toNextTurn();

    game.move.use(MoveId.LUNAR_DANCE);
    game.doSelectPartyPokemon(1);

    await game.toNextTurn();
    expect(charmander).toHaveFainted();
    bulbasaur.getMoveset().forEach(mv => expect(bulbasaur).toHaveUsedPP(mv.moveId, 0));
  });

  it("should stack with each other", async () => {
    game.override.battleStyle("single");
    await game.classicMode.startBattle(
      SpeciesId.BULBASAUR,
      SpeciesId.CHARMANDER,
      SpeciesId.SQUIRTLE,
      SpeciesId.PIKACHU,
    );

    const [bulbasaur, charmander, squirtle, pikachu] = game.scene.getPlayerParty();
    [squirtle, pikachu].forEach(p => {
      p.hp = 1;
      p.getMoveset().forEach(mv => (mv.ppUsed = 1));
    });

    game.move.use(MoveId.LUNAR_DANCE);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();
    expect(bulbasaur).toHaveFainted();
    expect(charmander).toHaveFullHp();
    expect(game.phaseInterceptor.log).not.toContain("PokemonHealPhase");
    expect(game).toHaveArenaTag(ArenaTagType.PENDING_HEAL);

    game.move.use(MoveId.HEALING_WISH);
    game.doSelectPartyPokemon(2);
    await game.toNextTurn();

    // Lunar Dance should apply first since it was used first, restoring Squirtle's HP and PP
    expect(squirtle).toHaveFullHp();
    squirtle.getMoveset().forEach(mv => expect(squirtle).toHaveUsedPP(mv.moveId, 0));
    expect(game).toHaveArenaTag(ArenaTagType.PENDING_HEAL);

    game.doSwitchPokemon(3);
    await game.toEndOfTurn();

    // Healing Wish should apply on the next switch, restoring Pikachu's HP
    expect(pikachu).toHaveFullHp();
    pikachu.getMoveset().forEach(mv => expect(pikachu).toHaveUsedPP(mv.moveId, 1));
    expect(game).not.toHaveArenaTag(ArenaTagType.PENDING_HEAL);
  });
});
