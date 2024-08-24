import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Phaser from "phaser";
import GameManager from "#test/utils/gameManager";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Stat } from "#enums/stat";
import { SPLASH_ONLY } from "#test/utils/testUtils";

const TIMEOUT = 20 * 1000;
/** HP Cost of Move */
const RATIO = 3;
/** Amount of extra HP lost */
const PREDAMAGE = 15;

describe("Moves - Clangorous Soul", () => {
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
    game.override.moveset([Moves.CLANGOROUS_SOUL]);
    game.override.enemyMoveset(SPLASH_ONLY);
  });

  //Bulbapedia Reference: https://bulbapedia.bulbagarden.net/wiki/Clangorous_Soul_(move)

  it("raises the user's ATK, DEF, SPATK, SPDEF, and SPD stat stages by 1 each at the cost of 1/3 of its maximum HP",
  	async() => {
      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      const hpLost = Math.floor(leadPokemon.getMaxHp() / RATIO);

      game.move.select(Moves.CLANGOROUS_SOUL);
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp() - hpLost);
      expect(leadPokemon.getStatStage(Stat.ATK)).toBe(1);
      expect(leadPokemon.getStatStage(Stat.DEF)).toBe(1);
      expect(leadPokemon.getStatStage(Stat.SPATK)).toBe(1);
      expect(leadPokemon.getStatStage(Stat.SPDEF)).toBe(1);
      expect(leadPokemon.getStatStage(Stat.SPD)).toBe(1);
    }, TIMEOUT
  );

  it("will still take effect if one or more of the involved stat stages are not at max",
    async() => {
      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      const hpLost = Math.floor(leadPokemon.getMaxHp() / RATIO);

      //Here - Stat.SPD -> 0 and Stat.SPDEF -> 4
      leadPokemon.setStatStage(Stat.ATK, 6);
      leadPokemon.setStatStage(Stat.DEF, 6);
      leadPokemon.setStatStage(Stat.SPATK, 6);
      leadPokemon.setStatStage(Stat.SPDEF, 4);

      game.move.select(Moves.CLANGOROUS_SOUL);
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp() - hpLost);
      expect(leadPokemon.getStatStage(Stat.ATK)).toBe(6);
      expect(leadPokemon.getStatStage(Stat.DEF)).toBe(6);
      expect(leadPokemon.getStatStage(Stat.SPATK)).toBe(6);
      expect(leadPokemon.getStatStage(Stat.SPDEF)).toBe(5);
      expect(leadPokemon.getStatStage(Stat.SPD)).toBe(1);
    }, TIMEOUT
  );

  it("fails if all stat stages involved are at max",
    async() => {
      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      leadPokemon.setStatStage(Stat.ATK, 6);
      leadPokemon.setStatStage(Stat.DEF, 6);
      leadPokemon.setStatStage(Stat.SPATK, 6);
      leadPokemon.setStatStage(Stat.SPDEF, 6);
      leadPokemon.setStatStage(Stat.SPD, 6);

      game.move.select(Moves.CLANGOROUS_SOUL);
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
      expect(leadPokemon.getStatStage(Stat.ATK)).toBe(6);
      expect(leadPokemon.getStatStage(Stat.DEF)).toBe(6);
      expect(leadPokemon.getStatStage(Stat.SPATK)).toBe(6);
      expect(leadPokemon.getStatStage(Stat.SPDEF)).toBe(6);
      expect(leadPokemon.getStatStage(Stat.SPD)).toBe(6);
    }, TIMEOUT
  );

  it("fails if the user's health is less than 1/3",
    async() => {
      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      const hpLost = Math.floor(leadPokemon.getMaxHp() / RATIO);
      leadPokemon.hp = hpLost - PREDAMAGE;

      game.move.select(Moves.CLANGOROUS_SOUL);
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.hp).toBe(hpLost - PREDAMAGE);
      expect(leadPokemon.getStatStage(Stat.ATK)).toBe(0);
      expect(leadPokemon.getStatStage(Stat.DEF)).toBe(0);
      expect(leadPokemon.getStatStage(Stat.SPATK)).toBe(0);
      expect(leadPokemon.getStatStage(Stat.SPDEF)).toBe(0);
      expect(leadPokemon.getStatStage(Stat.SPD)).toBe(0);
    }, TIMEOUT
  );
});
