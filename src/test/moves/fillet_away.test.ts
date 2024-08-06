import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";
import Phaser from "phaser";
import GameManager from "#test/utils/gameManager";
import { TurnEndPhase } from "#app/phases";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { BattleStat } from "#app/data/battle-stat";
import { SPLASH_ONLY } from "#test/utils/testUtils";

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

  test("Fillet Away raises the user's Attack, Special Attack, and Speed by two stages each, at the cost of 1/2 of its maximum HP",
    async() => {
      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      const hpLost = Math.floor(leadPokemon.getMaxHp() / RATIO);

      game.doAttack(getMovePosition(game.scene, 0, Moves.FILLET_AWAY));
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp() - hpLost);
      expect(leadPokemon.summonData.battleStats[BattleStat.ATK]).toBe(2);
      expect(leadPokemon.summonData.battleStats[BattleStat.SPATK]).toBe(2);
      expect(leadPokemon.summonData.battleStats[BattleStat.SPD]).toBe(2);
    }, TIMEOUT
  );

  test("Fillet Away will still take effect if one or more of the involved stats are not at max",
    async() => {
      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      const hpLost = Math.floor(leadPokemon.getMaxHp() / RATIO);

      //Here - BattleStat.SPD -> 0 and BattleStat.SPATK -> 3
      leadPokemon.summonData.battleStats[BattleStat.ATK] = 6;
      leadPokemon.summonData.battleStats[BattleStat.SPATK] = 3;

      game.doAttack(getMovePosition(game.scene, 0, Moves.FILLET_AWAY));
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp() - hpLost);
      expect(leadPokemon.summonData.battleStats[BattleStat.ATK]).toBe(6);
      expect(leadPokemon.summonData.battleStats[BattleStat.SPATK]).toBe(5);
      expect(leadPokemon.summonData.battleStats[BattleStat.SPD]).toBe(2);
    }, TIMEOUT
  );

  test("Fillet Away fails if all stats involved are at max",
    async() => {
      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();

      leadPokemon.summonData.battleStats[BattleStat.ATK] = 6;
      leadPokemon.summonData.battleStats[BattleStat.SPATK] = 6;
      leadPokemon.summonData.battleStats[BattleStat.SPD] = 6;

      game.doAttack(getMovePosition(game.scene, 0, Moves.FILLET_AWAY));
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
      expect(leadPokemon.summonData.battleStats[BattleStat.ATK]).toBe(6);
      expect(leadPokemon.summonData.battleStats[BattleStat.SPATK]).toBe(6);
      expect(leadPokemon.summonData.battleStats[BattleStat.SPD]).toBe(6);
    }, TIMEOUT
  );

  test("Fillet Away fails if the user's health is less than 1/2",
    async() => {
      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      const hpLost = Math.floor(leadPokemon.getMaxHp() / RATIO);
      leadPokemon.hp = hpLost - PREDAMAGE;

      game.doAttack(getMovePosition(game.scene, 0, Moves.FILLET_AWAY));
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.hp).toBe(hpLost - PREDAMAGE);
      expect(leadPokemon.summonData.battleStats[BattleStat.ATK]).toBe(0);
      expect(leadPokemon.summonData.battleStats[BattleStat.SPATK]).toBe(0);
      expect(leadPokemon.summonData.battleStats[BattleStat.SPD]).toBe(0);
    }, TIMEOUT
  );
});
