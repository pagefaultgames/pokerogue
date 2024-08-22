import { allMoves } from "#app/data/move";
import { Abilities } from "#app/enums/abilities";
import { ArenaTagType } from "#app/enums/arena-tag-type";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ArenaTagSide } from "#app/data/arena-tag.js";
import { BattlerTagType } from "#app/enums/battler-tag-type.js";

describe("Arena - Gravity", () => {
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
      .battleType("single")
      .moveset([Moves.TACKLE, Moves.GRAVITY, Moves.FISSURE, Moves.FLY])
      .ability(Abilities.UNNERVE)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemySpecies(Species.SHUCKLE)
      .enemyMoveset(new Array(4).fill(Moves.GROWL)); // Splash is unselectable under gravity effects.
  });

  // Reference: https://bulbapedia.bulbagarden.net/wiki/Gravity_(move)

  it("non-OHKO move accuracy is multiplied by 1.67", async () => {
    const moveToCheck = allMoves[Moves.TACKLE];

    vi.spyOn(moveToCheck, "calculateBattleAccuracy");

    // Setup Gravity on first turn
    await game.startBattle([Species.PIKACHU]);
    game.move.select(Moves.GRAVITY);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.arena.getTag(ArenaTagType.GRAVITY)).toBeDefined();

    // Use non-OHKO move on second turn
    await game.toNextTurn();
    game.move.select(Moves.TACKLE);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattleAccuracy).toHaveReturnedWith(100 * 1.67);
  });

  it("OHKO move accuracy is not affected", async () => {
    game.override
      .startingLevel(5)
      .enemyLevel(5);

    /** See Fissure {@link https://bulbapedia.bulbagarden.net/wiki/Fissure_(move)} */
    const moveToCheck = allMoves[Moves.FISSURE];

    vi.spyOn(moveToCheck, "calculateBattleAccuracy");

    // Setup Gravity on first turn
    await game.startBattle([Species.PIKACHU]);
    game.move.select(Moves.GRAVITY);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.arena.getTag(ArenaTagType.GRAVITY)).toBeDefined();

    // Use OHKO move on second turn
    await game.toNextTurn();
    game.move.select(Moves.FISSURE);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattleAccuracy).toHaveReturnedWith(30);
  });

  it(
    "should last for 5 turns on both sides",
    async () => {
      await game.startBattle([Species.RATTATA]);

      game.move.select(Moves.GRAVITY);

      for (let i = 0; i < 4; i++) { // Gravity tag should be defined for 5 turns (1 turn before this loop, 4 turns from this loop)
        await game.toNextTurn();
        expect(game.scene.arena.getTagOnSide(ArenaTagType.GRAVITY, ArenaTagSide.PLAYER)).toBeDefined();
        expect(game.scene.arena.getTagOnSide(ArenaTagType.GRAVITY, ArenaTagSide.ENEMY)).toBeDefined();
        game.move.select(Moves.GROWL);
      }

      await game.toNextTurn();
      expect(game.scene.arena.getTagOnSide(ArenaTagType.GRAVITY, ArenaTagSide.PLAYER)).toBeUndefined();
      expect(game.scene.arena.getTagOnSide(ArenaTagType.GRAVITY, ArenaTagSide.ENEMY)).toBeUndefined();
    });

  it(
    "should interrupt any pokemon in the semi-invulnerable state of Fly",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.GRAVITY));
      await game.startBattle([Species.REGIELEKI]);
      const playerPokemon = game.scene.getPlayerPokemon()!;

      game.move.select(Moves.FLY);
      // Finish Fly's MoveEffectPhase and check for BattlerTagType.FLYING
      await game.phaseInterceptor.to(MoveEffectPhase, true);
      expect(playerPokemon.getTag(BattlerTagType.FLYING)).toBeTruthy();

      // Enemy Shuckle uses Gravity, removes playerPokemon from Fly
      await game.toNextTurn();
      expect(playerPokemon.getTag(BattlerTagType.FLYING)).toBeFalsy();
    });

  it(
    "should interrupt a pokemon that attempts to use a jumping/airborne move",
    async () => {
      // Enemy is fastest mon so they go first, player is slowest mon
      game.override
        .enemyMoveset(Array(4).fill(Moves.GRAVITY))
        .enemySpecies(Species.REGIELEKI)
        .moveset([Moves.HIGH_JUMP_KICK]);
      vi.spyOn(allMoves[Moves.HIGH_JUMP_KICK], "accuracy", "get").mockReturnValue(100);
      await game.startBattle([Species.SHUCKLE]);
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      // Regieleki uses Gravity, Player uses High Jump Kick. High Jump Kick fails -> enemy pokemon maintains Max HP
      game.move.select(Moves.HIGH_JUMP_KICK);
      await game.toNextTurn();
      expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    });

  it(
    "should allow Levitate pokemon to be hit by Ground type moves",
    async () => {
      game.override
        .enemyAbility(Abilities.LEVITATE)
        .moveset([Moves.GRAVITY, Moves.EARTHQUAKE]);

      // Set up Gravity first turn
      await game.startBattle([Species.RATTATA]);
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      // Attack with Earthquake against Levitate mon, doesn't affect them
      game.move.select(Moves.EARTHQUAKE);
      await game.toNextTurn();
      expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());

      game.move.select(Moves.GRAVITY);
      await game.toNextTurn();
      expect(game.scene.arena.getTag(ArenaTagType.GRAVITY)).toBeDefined();

      // Attack with Earthquake against Levitate mon, should affect them with Gravity on.
      game.move.select(Moves.EARTHQUAKE);
      await game.toNextTurn();
      expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
    });

  it(
    "should remove Magnet Rise and allow Pokemon to be hit by Ground type moves",
    async () => {
      game.override
        .enemyMoveset(Array(4).fill(Moves.EARTHQUAKE))
        .moveset([Moves.GRAVITY, Moves.MAGNET_RISE, Moves.GROWL])
        .startingLevel(100)
        .enemyLevel(50);

      await game.startBattle([Species.REGIELEKI]);
      const playerPokemon = game.scene.getPlayerPokemon()!;

      game.move.select(Moves.GROWL);
      await game.toNextTurn();
      // playerPokemon should be affected by Earthquake
      expect(playerPokemon.hp).toBeLessThan(playerPokemon.getMaxHp());
      // Reset to full health.
      playerPokemon.hp = playerPokemon.getMaxHp();

      // Set up Magnet Rise, playerPokemon should not be affected by Earthquake
      game.move.select(Moves.MAGNET_RISE);
      await game.toNextTurn();
      expect(playerPokemon.getTag(BattlerTagType.MAGNET_RISEN)).toBeTruthy();
      expect(playerPokemon.hp).toBe(playerPokemon.getMaxHp());

      game.move.select(Moves.GRAVITY);
      await game.toNextTurn();
      // Gravity should be active, Magnet Rise tag should be undefined, playerPokemon is affected by Earthquake
      expect(game.scene.arena.getTag(ArenaTagType.GRAVITY)).toBeDefined();
      expect(playerPokemon.getTag(BattlerTagType.MAGNET_RISEN)).toBeFalsy();
      expect(playerPokemon.hp).toBeLessThan(playerPokemon.getMaxHp());
    }
  );

  describe("Against flying types", () => {
    it("can be hit by ground-type moves now", async () => {
      game.override
        .startingLevel(5)
        .enemyLevel(5)
        .enemySpecies(Species.PIDGEOT)
        .moveset([Moves.GRAVITY, Moves.EARTHQUAKE]);

      await game.startBattle([Species.PIKACHU]);

      const pidgeot = game.scene.getEnemyPokemon()!;
      vi.spyOn(pidgeot, "getAttackTypeEffectiveness");

      // Try earthquake on 1st turn (fails!);
      game.move.select(Moves.EARTHQUAKE);
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(pidgeot.getAttackTypeEffectiveness).toHaveReturnedWith(0);

      // Setup Gravity on 2nd turn
      await game.toNextTurn();
      game.move.select(Moves.GRAVITY);
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(game.scene.arena.getTag(ArenaTagType.GRAVITY)).toBeDefined();

      // Use ground move on 3rd turn
      await game.toNextTurn();
      game.move.select(Moves.EARTHQUAKE);
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(pidgeot.getAttackTypeEffectiveness).toHaveReturnedWith(1);
    });

    it("keeps super-effective moves super-effective after using gravity", async () => {
      game.override
        .startingLevel(5)
        .enemyLevel(5)
        .enemySpecies(Species.PIDGEOT)
        .moveset([Moves.GRAVITY, Moves.THUNDERBOLT]);

      await game.startBattle([Species.PIKACHU]);

      const pidgeot = game.scene.getEnemyPokemon()!;
      vi.spyOn(pidgeot, "getAttackTypeEffectiveness");

      // Setup Gravity on 1st turn
      game.move.select(Moves.GRAVITY);
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(game.scene.arena.getTag(ArenaTagType.GRAVITY)).toBeDefined();

      // Use electric move on 2nd turn
      await game.toNextTurn();
      game.move.select(Moves.THUNDERBOLT);
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(pidgeot.getAttackTypeEffectiveness).toHaveReturnedWith(2);
    });
  });
});
