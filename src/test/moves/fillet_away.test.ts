import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { toDmgValue } from "#app/utils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Stat } from "#enums/stat";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";

const TIMEOUT = 20 * 1000;
/** HP Cost of Move */
const RATIO = 2;
/** Amount of extra HP lost */
const PREDAMAGE = 15;

describe("Moves - FILLET AWAY", () => {
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
    game.override.starterSpecies(Species.MAGIKARP);
    game.override.enemySpecies(Species.SNORLAX);
    game.override.startingLevel(100);
    game.override.enemyLevel(100);
    game.override.moveset([Moves.FILLET_AWAY]);
    game.override.enemyMoveset(SPLASH_ONLY);
  });

  //Bulbapedia Reference: https://bulbapedia.bulbagarden.net/wiki/fillet_away_(move)

  test("raises the user's ATK, SPATK, and SPD stat stages by 2 each, at the cost of 1/2 of its maximum HP",
    async() => {
      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      const hpLost = toDmgValue(leadPokemon.getMaxHp() / RATIO);

      game.move.select(Moves.FILLET_AWAY);
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp() - hpLost);
      expect(leadPokemon.getStatStage(Stat.ATK)).toBe(2);
      expect(leadPokemon.getStatStage(Stat.SPATK)).toBe(2);
      expect(leadPokemon.getStatStage(Stat.SPD)).toBe(2);
    }, TIMEOUT
  );

  test("still takes effect if one or more of the involved stat stages are not at max",
    async() => {
      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      const hpLost = toDmgValue(leadPokemon.getMaxHp() / RATIO);

      //Here - Stat.SPD -> 0 and Stat.SPATK -> 3
      leadPokemon.setStatStage(Stat.ATK, 6);
      leadPokemon.setStatStage(Stat.SPATK, 3);

      game.move.select(Moves.FILLET_AWAY);
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp() - hpLost);
      expect(leadPokemon.getStatStage(Stat.ATK)).toBe(6);
      expect(leadPokemon.getStatStage(Stat.SPATK)).toBe(5);
      expect(leadPokemon.getStatStage(Stat.SPD)).toBe(2);
    }, TIMEOUT
  );

  test("fails if all stat stages involved are at max",
    async() => {
      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      leadPokemon.setStatStage(Stat.ATK, 6);
      leadPokemon.setStatStage(Stat.SPATK, 6);
      leadPokemon.setStatStage(Stat.SPD, 6);

      game.move.select(Moves.FILLET_AWAY);
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
      expect(leadPokemon.getStatStage(Stat.ATK)).toBe(6);
      expect(leadPokemon.getStatStage(Stat.SPATK)).toBe(6);
      expect(leadPokemon.getStatStage(Stat.SPD)).toBe(6);
    }, TIMEOUT
  );

  test("fails if the user's health is less than 1/2",
    async() => {
      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      const hpLost = toDmgValue(leadPokemon.getMaxHp() / RATIO);
      leadPokemon.hp = hpLost - PREDAMAGE;

      game.move.select(Moves.FILLET_AWAY);
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.hp).toBe(hpLost - PREDAMAGE);
      expect(leadPokemon.getStatStage(Stat.ATK)).toBe(0);
      expect(leadPokemon.getStatStage(Stat.SPATK)).toBe(0);
      expect(leadPokemon.getStatStage(Stat.SPD)).toBe(0);
    }, TIMEOUT
  );
});
