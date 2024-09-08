import { Abilities } from "#app/enums/abilities";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import { HitResult } from "#app/field/pokemon.js";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const TIMEOUT = 10 * 1000; // 10 second timeout

describe("Abilities - Tera Shell", () => {
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
      .ability(Abilities.TERA_SHELL)
      .moveset([Moves.SPLASH])
      .enemySpecies(Species.SNORLAX)
      .enemyAbility(Abilities.INSOMNIA)
      .enemyMoveset(Array(4).fill(Moves.MACH_PUNCH))
      .startingLevel(100)
      .enemyLevel(100);
  });

  it(
    "should change the effectiveness of non-resisted attacks when the source is at full HP",
    async () => {
      await game.classicMode.startBattle([Species.SNORLAX]);

      const playerPokemon = game.scene.getPlayerPokemon()!;
      vi.spyOn(playerPokemon, "getMoveEffectiveness");

      game.move.select(Moves.SPLASH);

      await game.phaseInterceptor.to("MoveEndPhase");
      expect(playerPokemon.getMoveEffectiveness).toHaveLastReturnedWith(0.5);

      await game.toNextTurn();

      game.move.select(Moves.SPLASH);

      await game.phaseInterceptor.to("MoveEndPhase");
      expect(playerPokemon.getMoveEffectiveness).toHaveLastReturnedWith(2);
    }, TIMEOUT
  );

  it(
    "should not override type immunities",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.SHADOW_SNEAK));

      await game.classicMode.startBattle([Species.SNORLAX]);

      const playerPokemon = game.scene.getPlayerPokemon()!;
      vi.spyOn(playerPokemon, "getMoveEffectiveness");

      game.move.select(Moves.SPLASH);

      await game.phaseInterceptor.to("MoveEndPhase");
      expect(playerPokemon.getMoveEffectiveness).toHaveLastReturnedWith(0);
    }, TIMEOUT
  );

  it(
    "should not override type multipliers less than 0.5x",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.QUICK_ATTACK));

      await game.classicMode.startBattle([Species.AGGRON]);

      const playerPokemon = game.scene.getPlayerPokemon()!;
      vi.spyOn(playerPokemon, "getMoveEffectiveness");

      game.move.select(Moves.SPLASH);

      await game.phaseInterceptor.to("MoveEndPhase");
      expect(playerPokemon.getMoveEffectiveness).toHaveLastReturnedWith(0.25);
    }, TIMEOUT
  );

  it(
    "should not affect the effectiveness of fixed-damage moves",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.DRAGON_RAGE));

      await game.classicMode.startBattle([Species.CHARIZARD]);

      const playerPokemon = game.scene.getPlayerPokemon()!;
      vi.spyOn(playerPokemon, "apply");

      game.move.select(Moves.SPLASH);

      await game.phaseInterceptor.to("BerryPhase", false);
      expect(playerPokemon.apply).toHaveLastReturnedWith(HitResult.EFFECTIVE);
      expect(playerPokemon.hp).toBe(playerPokemon.getMaxHp() - 40);
    }, TIMEOUT
  );
});
