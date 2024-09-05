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
import { SPLASH_ONLY } from "../utils/testUtils";

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
      .moveset([Moves.TACKLE, Moves.GRAVITY, Moves.FISSURE])
      .ability(Abilities.UNNERVE)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemySpecies(Species.SHUCKLE)
      .enemyMoveset(SPLASH_ONLY);
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
    game.override.startingLevel(5);
    game.override.enemyLevel(5);

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
