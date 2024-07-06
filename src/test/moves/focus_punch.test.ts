import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import GameManager from "../utils/gameManager";
import * as Overrides from "#app/overrides";
import { Species } from "#enums/species";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { getMovePosition } from "../utils/gameManagerUtils";
import { BerryPhase, MessagePhase } from "#app/phases.js";
import { StatusEffect } from "#app/data/status-effect.js";

const TIMEOUT = 20 * 1000;

describe("Moves - Focus Punch", () => {
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
    vi.spyOn(Overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(Overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.UNNERVE);
    vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.FOCUS_PUNCH]);
    vi.spyOn(Overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.GROUDON);
    vi.spyOn(Overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.INSOMNIA);
    vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
    vi.spyOn(Overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(Overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(100);
  });

  test(
    "move should deal damage at the end of turn if uninterrupted",
    async () => {
      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).not.toBe(undefined);

      const enemyStartingHp = enemyPokemon.hp;

      game.doAttack(getMovePosition(game.scene, 0, Moves.FOCUS_PUNCH));

      await game.phaseInterceptor.to(MessagePhase);

      expect(enemyPokemon.hp).toBe(enemyStartingHp);
      expect(leadPokemon.getMoveHistory().length).toBe(0);

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(enemyPokemon.hp).toBeLessThan(enemyStartingHp);
      expect(leadPokemon.getMoveHistory().length).toBe(1);
      expect(leadPokemon.turnData.damageDealt).toBe(enemyStartingHp - enemyPokemon.hp);
    }, TIMEOUT
  );

  test(
    "move should fail if the user is hit",
    async () => {
      vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);

      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).not.toBe(undefined);

      const enemyStartingHp = enemyPokemon.hp;

      game.doAttack(getMovePosition(game.scene, 0, Moves.FOCUS_PUNCH));

      await game.phaseInterceptor.to(MessagePhase);

      expect(enemyPokemon.hp).toBe(enemyStartingHp);
      expect(leadPokemon.getMoveHistory().length).toBe(0);

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(enemyPokemon.hp).toBe(enemyStartingHp);
      expect(leadPokemon.getMoveHistory().length).toBe(1);
      expect(leadPokemon.turnData.damageDealt).toBe(0);
    }, TIMEOUT
  );

  test(
    "move should be cancelled if the user is asleep",
    async () => {
      vi.spyOn(Overrides, "STATUS_OVERRIDE", "get").mockReturnValue(StatusEffect.SLEEP);

      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).not.toBe(undefined);

      game.doAttack(getMovePosition(game.scene, 0, Moves.FOCUS_PUNCH));

      await game.phaseInterceptor.to(MessagePhase);

      expect(leadPokemon.getMoveHistory().length).toBe(1);

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.getMoveHistory().length).toBe(1);
      expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    }, TIMEOUT
  );

  test(
    "move should be cancelled if the user falls asleep mid-turn",
    async () => {
      vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPORE, Moves.SPORE, Moves.SPORE, Moves.SPORE]);

      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      game.doAttack(getMovePosition(game.scene, 0, Moves.FOCUS_PUNCH));

      await game.phaseInterceptor.to(MessagePhase); // Header message

      expect(leadPokemon.getMoveHistory().length).toBe(0);

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.getMoveHistory().length).toBe(1);
      expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    }, TIMEOUT
  );
});
