import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";
import GameManager from "../utils/gameManager";
import { Species } from "#enums/species";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Stat } from "#enums/stat";
import { BerryPhase } from "#app/phases/berry-phase";
import { CommandPhase } from "#app/phases/command-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";

const TIMEOUT = 20 * 1000;

describe("Moves - Mat Block", () => {
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

    game.override.moveset([Moves.MAT_BLOCK, Moves.SPLASH]);

    game.override.enemySpecies(Species.SNORLAX);
    game.override.enemyMoveset(Array(4).fill(Moves.TACKLE));
    game.override.enemyAbility(Abilities.INSOMNIA);

    game.override.startingLevel(100);
    game.override.enemyLevel(100);
  });

  test(
    "should protect the user and allies from attack moves",
    async () => {
      await game.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerField();

      game.move.select(Moves.MAT_BLOCK);

      await game.phaseInterceptor.to(CommandPhase);

      game.move.select(Moves.SPLASH, 1);

      await game.phaseInterceptor.to(BerryPhase, false);

      leadPokemon.forEach(p => expect(p.hp).toBe(p.getMaxHp()));
    }, TIMEOUT
  );

  test(
    "should not protect the user and allies from status moves",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.GROWL));

      await game.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerField();

      game.move.select(Moves.MAT_BLOCK);

      await game.phaseInterceptor.to(CommandPhase);

      game.move.select(Moves.SPLASH, 1);

      await game.phaseInterceptor.to(BerryPhase, false);

      leadPokemon.forEach(p => expect(p.getStatStage(Stat.ATK)).toBe(-2));
    }, TIMEOUT
  );

  test(
    "should fail when used after the first turn",
    async () => {
      await game.startBattle([Species.BLASTOISE, Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerField();

      game.move.select(Moves.SPLASH);
      await game.phaseInterceptor.to(CommandPhase);
      game.move.select(Moves.SPLASH, 1);

      await game.phaseInterceptor.to(TurnEndPhase);

      const leadStartingHp = leadPokemon.map(p => p.hp);

      await game.phaseInterceptor.to(CommandPhase, false);
      game.move.select(Moves.MAT_BLOCK);
      await game.phaseInterceptor.to(CommandPhase);
      game.move.select(Moves.MAT_BLOCK, 1);

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.some((p, i) => p.hp < leadStartingHp[i])).toBeTruthy();
    }, TIMEOUT
  );
});
