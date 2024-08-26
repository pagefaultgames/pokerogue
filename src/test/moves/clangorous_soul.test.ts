import { BattleStat } from "#app/data/battle-stat";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { toDmgValue } from "#app/utils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";

const TIMEOUT = 20 * 1000;
/** HP Cost of Move */
const RATIO = 3;
/** Amount of extra HP lost */
const PREDAMAGE = 15;

describe("Moves - CLANGOROUS_SOUL", () => {
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

  test("Clangorous Soul raises the user's Attack, Defense, Special Attack, Special Defense and Speed by one stage each, at the cost of 1/3 of its maximum HP",
    async () => {
      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      const hpLost = toDmgValue(leadPokemon.getMaxHp() / RATIO);

      game.move.select(Moves.CLANGOROUS_SOUL);
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp() - hpLost);
      expect(leadPokemon.summonData.battleStats[BattleStat.ATK]).toBe(1);
      expect(leadPokemon.summonData.battleStats[BattleStat.DEF]).toBe(1);
      expect(leadPokemon.summonData.battleStats[BattleStat.SPATK]).toBe(1);
      expect(leadPokemon.summonData.battleStats[BattleStat.SPDEF]).toBe(1);
      expect(leadPokemon.summonData.battleStats[BattleStat.SPD]).toBe(1);
    }, TIMEOUT
  );

  test("Clangorous Soul will still take effect if one or more of the involved stats are not at max",
    async () => {
      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      const hpLost = toDmgValue(leadPokemon.getMaxHp() / RATIO);

      //Here - BattleStat.SPD -> 0 and BattleStat.SPDEF -> 4
      leadPokemon.summonData.battleStats[BattleStat.ATK] = 6;
      leadPokemon.summonData.battleStats[BattleStat.DEF] = 6;
      leadPokemon.summonData.battleStats[BattleStat.SPATK] = 6;
      leadPokemon.summonData.battleStats[BattleStat.SPDEF] = 4;

      game.move.select(Moves.CLANGOROUS_SOUL);
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp() - hpLost);
      expect(leadPokemon.summonData.battleStats[BattleStat.ATK]).toBe(6);
      expect(leadPokemon.summonData.battleStats[BattleStat.DEF]).toBe(6);
      expect(leadPokemon.summonData.battleStats[BattleStat.SPATK]).toBe(6);
      expect(leadPokemon.summonData.battleStats[BattleStat.SPDEF]).toBe(5);
      expect(leadPokemon.summonData.battleStats[BattleStat.SPD]).toBe(1);
    }, TIMEOUT
  );

  test("Clangorous Soul fails if all stats involved are at max",
    async () => {
      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      leadPokemon.summonData.battleStats[BattleStat.ATK] = 6;
      leadPokemon.summonData.battleStats[BattleStat.DEF] = 6;
      leadPokemon.summonData.battleStats[BattleStat.SPATK] = 6;
      leadPokemon.summonData.battleStats[BattleStat.SPDEF] = 6;
      leadPokemon.summonData.battleStats[BattleStat.SPD] = 6;

      game.move.select(Moves.CLANGOROUS_SOUL);
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
      expect(leadPokemon.summonData.battleStats[BattleStat.ATK]).toBe(6);
      expect(leadPokemon.summonData.battleStats[BattleStat.DEF]).toBe(6);
      expect(leadPokemon.summonData.battleStats[BattleStat.SPATK]).toBe(6);
      expect(leadPokemon.summonData.battleStats[BattleStat.SPDEF]).toBe(6);
      expect(leadPokemon.summonData.battleStats[BattleStat.SPD]).toBe(6);
    }, TIMEOUT
  );

  test("Clangorous Soul fails if the user's health is less than 1/3",
    async () => {
      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      const hpLost = toDmgValue(leadPokemon.getMaxHp() / RATIO);
      leadPokemon.hp = hpLost - PREDAMAGE;

      game.move.select(Moves.CLANGOROUS_SOUL);
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.hp).toBe(hpLost - PREDAMAGE);
      expect(leadPokemon.summonData.battleStats[BattleStat.ATK]).toBe(0);
      expect(leadPokemon.summonData.battleStats[BattleStat.DEF]).toBe(0);
      expect(leadPokemon.summonData.battleStats[BattleStat.SPATK]).toBe(0);
      expect(leadPokemon.summonData.battleStats[BattleStat.SPDEF]).toBe(0);
      expect(leadPokemon.summonData.battleStats[BattleStat.SPD]).toBe(0);
    }, TIMEOUT
  );
});
