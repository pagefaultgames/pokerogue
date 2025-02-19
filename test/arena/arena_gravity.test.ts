import { BattlerIndex } from "#app/battle";
import { allMoves } from "#app/data/move";
import { Abilities } from "#enums/abilities";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
      .moveset([ Moves.TACKLE, Moves.GRAVITY, Moves.FISSURE ])
      .ability(Abilities.UNNERVE)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemySpecies(Species.SHUCKLE)
      .enemyMoveset(Moves.SPLASH)
      .enemyLevel(5);
  });

  // Reference: https://bulbapedia.bulbagarden.net/wiki/Gravity_(move)

  it("non-OHKO move accuracy is multiplied by 1.67", async () => {
    const moveToCheck = allMoves[Moves.TACKLE];

    vi.spyOn(moveToCheck, "calculateBattleAccuracy");

    // Setup Gravity on first turn
    await game.classicMode.startBattle([ Species.PIKACHU ]);
    game.move.select(Moves.GRAVITY);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.scene.arena.getTag(ArenaTagType.GRAVITY)).toBeDefined();

    // Use non-OHKO move on second turn
    await game.toNextTurn();
    game.move.select(Moves.TACKLE);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(moveToCheck.calculateBattleAccuracy).toHaveLastReturnedWith(100 * 1.67);
  });

  it("OHKO move accuracy is not affected", async () => {
    /** See Fissure {@link https://bulbapedia.bulbagarden.net/wiki/Fissure_(move)} */
    const moveToCheck = allMoves[Moves.FISSURE];

    vi.spyOn(moveToCheck, "calculateBattleAccuracy");

    // Setup Gravity on first turn
    await game.classicMode.startBattle([ Species.PIKACHU ]);
    game.move.select(Moves.GRAVITY);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.scene.arena.getTag(ArenaTagType.GRAVITY)).toBeDefined();

    // Use OHKO move on second turn
    await game.toNextTurn();
    game.move.select(Moves.FISSURE);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(moveToCheck.calculateBattleAccuracy).toHaveLastReturnedWith(30);
  });

  describe("Against flying types", () => {
    it("can be hit by ground-type moves now", async () => {
      game.override
        .enemySpecies(Species.PIDGEOT)
        .moveset([ Moves.GRAVITY, Moves.EARTHQUAKE ]);

      await game.classicMode.startBattle([ Species.PIKACHU ]);

      const pidgeot = game.scene.getEnemyPokemon()!;
      vi.spyOn(pidgeot, "getAttackTypeEffectiveness");

      // Try earthquake on 1st turn (fails!);
      game.move.select(Moves.EARTHQUAKE);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(pidgeot.getAttackTypeEffectiveness).toHaveLastReturnedWith(0);

      // Setup Gravity on 2nd turn
      await game.toNextTurn();
      game.move.select(Moves.GRAVITY);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(game.scene.arena.getTag(ArenaTagType.GRAVITY)).toBeDefined();

      // Use ground move on 3rd turn
      await game.toNextTurn();
      game.move.select(Moves.EARTHQUAKE);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(pidgeot.getAttackTypeEffectiveness).toHaveLastReturnedWith(1);
    });

    it("keeps super-effective moves super-effective after using gravity", async () => {
      game.override
        .enemySpecies(Species.PIDGEOT)
        .moveset([ Moves.GRAVITY, Moves.THUNDERBOLT ]);

      await game.classicMode.startBattle([ Species.PIKACHU ]);

      const pidgeot = game.scene.getEnemyPokemon()!;
      vi.spyOn(pidgeot, "getAttackTypeEffectiveness");

      // Setup Gravity on 1st turn
      game.move.select(Moves.GRAVITY);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(game.scene.arena.getTag(ArenaTagType.GRAVITY)).toBeDefined();

      // Use electric move on 2nd turn
      await game.toNextTurn();
      game.move.select(Moves.THUNDERBOLT);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(pidgeot.getAttackTypeEffectiveness).toHaveLastReturnedWith(2);
    });
  });

  it("cancels Fly if its user is semi-invulnerable", async () => {
    game.override
      .enemySpecies(Species.SNORLAX)
      .enemyMoveset(Moves.FLY)
      .moveset([ Moves.GRAVITY, Moves.SPLASH ]);

    await game.classicMode.startBattle([ Species.CHARIZARD ]);

    const charizard = game.scene.getPlayerPokemon()!;
    const snorlax = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.SPLASH);

    await game.toNextTurn();
    expect(snorlax.getTag(BattlerTagType.FLYING)).toBeDefined();

    game.move.select(Moves.GRAVITY);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);

    await game.phaseInterceptor.to("MoveEffectPhase");
    expect(snorlax.getTag(BattlerTagType.INTERRUPTED)).toBeDefined();

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(charizard.hp).toBe(charizard.getMaxHp());
  });
});
