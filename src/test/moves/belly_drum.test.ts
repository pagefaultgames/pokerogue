import {afterEach, beforeAll, beforeEach, describe, expect, test, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import overrides from "#app/overrides";
import {
  TurnEndPhase,
} from "#app/phases";
import {getMovePosition} from "#app/test/utils/gameManagerUtils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { BattleStat } from "#app/data/battle-stat";

const TIMEOUT = 20 * 1000;
const RATIO = 2;
const PREDAMAGE = 15;

describe("Moves - BELLY DRUM", () => {
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
    vi.spyOn(overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(Species.MAGIKARP);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.SNORLAX);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.BELLY_DRUM, Moves.BELLY_DRUM, Moves.BELLY_DRUM, Moves.BELLY_DRUM ]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH ]);
  });

  //Bulbapedia Reference: https://bulbapedia.bulbagarden.net/wiki/Belly_Drum_(move)

  test("Belly Drum raises the user's Attack to its max, at the cost of 1/2 of its maximum HP",
    async() => {
      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();
      const HpLost = Math.floor(leadPokemon.getMaxHp() / RATIO);

      game.doAttack(getMovePosition(game.scene, 0, Moves.BELLY_DRUM));
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp()-HpLost);
      expect(leadPokemon.summonData.battleStats[BattleStat.ATK]).toBe(6);
    }, TIMEOUT
  );

  test("Belly Drum will still take effect if an uninvolved stat is at max",
    async() => {
      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();
      const HpLost = Math.floor(leadPokemon.getMaxHp() / RATIO);

      //Here - BattleStat.SPD -> 0 and BattleStat.SPATK -> 3
      leadPokemon.summonData.battleStats[BattleStat.ATK] = -3;
      leadPokemon.summonData.battleStats[BattleStat.SPATK] = 6;

      game.doAttack(getMovePosition(game.scene, 0, Moves.BELLY_DRUM));
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp()-HpLost);
      expect(leadPokemon.summonData.battleStats[BattleStat.ATK]).toBe(6);
      expect(leadPokemon.summonData.battleStats[BattleStat.SPATK]).toBe(6);
    }, TIMEOUT
  );

  test("Belly Drum fails if all stats involved are at max",
    async() => {
      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      leadPokemon.summonData.battleStats[BattleStat.ATK] = 6;

      game.doAttack(getMovePosition(game.scene, 0, Moves.BELLY_DRUM));
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
      expect(leadPokemon.summonData.battleStats[BattleStat.ATK]).toBe(6);
    }, TIMEOUT
  );

  test("Belly Drum fails if the user's health is less than 1/2",
    async() => {
      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();
      const HpLost = Math.floor(leadPokemon.getMaxHp() / RATIO);
      leadPokemon.hp = HpLost-PREDAMAGE;

      game.doAttack(getMovePosition(game.scene, 0, Moves.BELLY_DRUM));
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.hp).toBe(HpLost-PREDAMAGE);
      expect(leadPokemon.summonData.battleStats[BattleStat.ATK]).toBe(0);
    }, TIMEOUT
  );
});
