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

describe("Moves - Quick Guard", () => {
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

    game.override.moveset([Moves.QUICK_GUARD, Moves.SPLASH, Moves.FOLLOW_ME]);

    game.override.enemySpecies(Species.SNORLAX);
    game.override.enemyMoveset(Array(4).fill(Moves.QUICK_ATTACK));
    game.override.enemyAbility(Abilities.INSOMNIA);

    game.override.startingLevel(100);
    game.override.enemyLevel(100);
  });

  test(
    "should protect the user and allies from priority moves",
    async () => {
      await game.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerField();

      game.move.select(Moves.QUICK_GUARD);

      await game.phaseInterceptor.to(CommandPhase);

      game.move.select(Moves.SPLASH, 1);

      await game.phaseInterceptor.to(BerryPhase, false);

      leadPokemon.forEach(p => expect(p.hp).toBe(p.getMaxHp()));
    }, TIMEOUT
  );

  test(
    "should protect the user and allies from Prankster-boosted moves",
    async () => {
      game.override.enemyAbility(Abilities.PRANKSTER);
      game.override.enemyMoveset(Array(4).fill(Moves.GROWL));

      await game.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerField();

      game.move.select(Moves.QUICK_GUARD);

      await game.phaseInterceptor.to(CommandPhase);

      game.move.select(Moves.SPLASH, 1);

      await game.phaseInterceptor.to(BerryPhase, false);

      leadPokemon.forEach(p => expect(p.getStatStage(Stat.ATK)).toBe(0));
    }, TIMEOUT
  );

  test(
    "should stop subsequent hits of a multi-hit priority move",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.WATER_SHURIKEN));

      await game.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerField();
      const enemyPokemon = game.scene.getEnemyField();

      game.move.select(Moves.QUICK_GUARD);

      await game.phaseInterceptor.to(CommandPhase);

      game.move.select(Moves.FOLLOW_ME, 1);

      await game.phaseInterceptor.to(BerryPhase, false);

      leadPokemon.forEach(p => expect(p.hp).toBe(p.getMaxHp()));
      enemyPokemon.forEach(p => expect(p.turnData.hitCount).toBe(1));
    }
  );
});
