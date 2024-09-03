import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";
import GameManager from "../utils/gameManager";
import { Species } from "#enums/species";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Stat } from "#enums/stat";
import { BerryPhase } from "#app/phases/berry-phase";
import { CommandPhase } from "#app/phases/command-phase";

const TIMEOUT = 20 * 1000;

describe("Moves - Wide Guard", () => {
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

    game.override.battleType("double");

    game.override.moveset([Moves.WIDE_GUARD, Moves.SPLASH, Moves.SURF]);

    game.override.enemySpecies(Species.SNORLAX);
    game.override.enemyMoveset(Array(4).fill(Moves.SWIFT));
    game.override.enemyAbility(Abilities.INSOMNIA);

    game.override.startingLevel(100);
    game.override.enemyLevel(100);
  });

  test(
    "should protect the user and allies from multi-target attack moves",
    async () => {
      await game.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerField();

      game.move.select(Moves.WIDE_GUARD);

      await game.phaseInterceptor.to(CommandPhase);

      game.move.select(Moves.SPLASH, 1);

      await game.phaseInterceptor.to(BerryPhase, false);

      leadPokemon.forEach(p => expect(p.hp).toBe(p.getMaxHp()));
    }, TIMEOUT
  );

  test(
    "should protect the user and allies from multi-target status moves",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.GROWL));

      await game.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerField();

      game.move.select(Moves.WIDE_GUARD);

      await game.phaseInterceptor.to(CommandPhase);

      game.move.select(Moves.SPLASH, 1);

      await game.phaseInterceptor.to(BerryPhase, false);

      leadPokemon.forEach(p => expect(p.getStatStage(Stat.ATK)).toBe(0));
    }, TIMEOUT
  );

  test(
    "should not protect the user and allies from single-target moves",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.TACKLE));

      await game.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerField();

      game.move.select(Moves.WIDE_GUARD);

      await game.phaseInterceptor.to(CommandPhase);

      game.move.select(Moves.SPLASH, 1);

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.some(p => p.hp < p.getMaxHp())).toBeTruthy();
    }, TIMEOUT
  );

  test(
    "should protect the user from its ally's multi-target move",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.SPLASH));

      await game.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerField();
      const enemyPokemon = game.scene.getEnemyField();

      game.move.select(Moves.WIDE_GUARD);

      await game.phaseInterceptor.to(CommandPhase);

      game.move.select(Moves.SURF, 1);

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon[0].hp).toBe(leadPokemon[0].getMaxHp());
      enemyPokemon.forEach(p => expect(p.hp).toBeLessThan(p.getMaxHp()));
    }, TIMEOUT
  );
});
