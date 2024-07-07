import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import { Species } from "#enums/species";
import { TurnEndPhase } from "#app/phases";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import { WeatherType } from "#app/data/weather.js";
import { StatusEffect } from "#app/data/status-effect";

const TIMEOUT = 20 * 1000; // 20 sec timeout

describe("Abilities - Magic Guard", () => {
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
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);

    /** Player Pokemon overrides */
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.MAGIC_GUARD);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH]);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);

    /** Enemy Pokemon overrides */
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.SNORLAX);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.INSOMNIA);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(100);
  });

  it(
    "ability should prevent damage caused by weather",
    async () => {
      vi.spyOn(overrides, "WEATHER_OVERRIDE", "get").mockReturnValue(WeatherType.SANDSTORM);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));

      await game.phaseInterceptor.to(TurnEndPhase);

      /**
       * Expect:
       * - The player Pokemon (with Magic Guard) has not taken damage from weather
       * - The enemy Pokemon (without Magic Guard) has taken damage from weather
       */
      expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
      expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
    }, TIMEOUT
  );

  it(
    "ability should prevent damage caused by status effects",
    async () => {
      //Toxic keeps track of the turn counters -> important that Magic Guard keeps track of post-Toxic turns
      vi.spyOn(overrides, "STATUS_OVERRIDE", "get").mockReturnValue(StatusEffect.POISON);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));

      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
    }, TIMEOUT
  );

  it(
    "ability effect should not persist when the ability is replaced",
    async () => {
      vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.WORRY_SEED,Moves.WORRY_SEED,Moves.WORRY_SEED,Moves.WORRY_SEED]);
      vi.spyOn(overrides, "STATUS_OVERRIDE", "get").mockReturnValue(StatusEffect.POISON);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));

      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.hp).toBeLessThan(leadPokemon.getMaxHp());
    }
  );

/*
  it("Magic Guard prevents damage caused by burn but Pokemon still can be burned and take damage upon losing Magic Guard", async () => {
    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.CHARM));

    await game.phaseInterceptor.to(TurnEndPhase);
  });

  it("Magic Guard prevents damage caused by entry hazards", async () => {
    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.CHARM));

    await game.phaseInterceptor.to(TurnEndPhase);
  });

  it("Magic Guard does not prevent poison from Toxic Spikes", async () => {
    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.CHARM));

    await game.phaseInterceptor.to(TurnEndPhase);
  });

  it("Magic Guard prevents curse status damage", async () => {
    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.CHARM));

    await game.phaseInterceptor.to(TurnEndPhase);
  });

  it("Magic Guard prevents crash damange", async () => {
    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.CHARM));

    await game.phaseInterceptor.to(TurnEndPhase);
  });

  it("Magic Guard prevents damage from recoil", async () => {
    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.CHARM));

    await game.phaseInterceptor.to(TurnEndPhase);
  });

  it("Magic Guard does not prevent damage from Struggle's recoil", async () => {
    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.CHARM));

    await game.phaseInterceptor.to(TurnEndPhase);
  });

  it("Magic Guard prevents self-damage from attacking moves", async () => {
    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.CHARM));

    await game.phaseInterceptor.to(TurnEndPhase);
  });

  it("Magic Guard does not prevent self-damage from confusion", async () => {
    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.CHARM));

    await game.phaseInterceptor.to(TurnEndPhase);
  });

  it("Magic Guard does not prevent self-damage from non-attacking moves", async () => {
    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.CHARM));

    await game.phaseInterceptor.to(TurnEndPhase);
  });
  */
});
