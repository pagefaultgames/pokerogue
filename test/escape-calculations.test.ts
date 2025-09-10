import { AbilityId } from "#enums/ability-id";
import { Command } from "#enums/command";
import { SpeciesId } from "#enums/species-id";
import { AttemptRunPhase } from "#phases/attempt-run-phase";
import type { CommandPhase } from "#phases/command-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Escape chance calculations", () => {
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
    game.override
      .battleStyle("single")
      .enemySpecies(SpeciesId.BULBASAUR)
      .enemyAbility(AbilityId.INSOMNIA)
      .ability(AbilityId.INSOMNIA);
  });

  it("single non-boss opponent", async () => {
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    const playerPokemon = game.scene.getPlayerField();
    const enemyField = game.scene.getEnemyField();
    const enemySpeed = 100;
    // set enemyPokemon's speed to 100
    vi.spyOn(enemyField[0], "stats", "get").mockReturnValue([20, 20, 20, 20, 20, enemySpeed]);

    const commandPhase = game.scene.phaseManager.getCurrentPhase() as CommandPhase;
    commandPhase.handleCommand(Command.RUN, 0);

    await game.phaseInterceptor.to(AttemptRunPhase, false);
    const phase = game.scene.phaseManager.getCurrentPhase() as AttemptRunPhase;
    // this sets up an object for multiple attempts. The pokemonSpeedRatio is your speed divided by the enemy speed, the escapeAttempts are the number of escape attempts and the expectedEscapeChance is the chance it should be escaping
    const escapeChances: {
      pokemonSpeedRatio: number;
      escapeAttempts: number;
      expectedEscapeChance: number;
    }[] = [
      { pokemonSpeedRatio: 0.01, escapeAttempts: 0, expectedEscapeChance: 5 },
      { pokemonSpeedRatio: 0.1, escapeAttempts: 0, expectedEscapeChance: 7 },
      { pokemonSpeedRatio: 0.25, escapeAttempts: 0, expectedEscapeChance: 11 },
      { pokemonSpeedRatio: 0.5, escapeAttempts: 0, expectedEscapeChance: 16 },
      { pokemonSpeedRatio: 0.8, escapeAttempts: 0, expectedEscapeChance: 23 },
      { pokemonSpeedRatio: 1, escapeAttempts: 0, expectedEscapeChance: 28 },
      { pokemonSpeedRatio: 1.2, escapeAttempts: 0, expectedEscapeChance: 32 },
      { pokemonSpeedRatio: 1.5, escapeAttempts: 0, expectedEscapeChance: 39 },
      { pokemonSpeedRatio: 3, escapeAttempts: 0, expectedEscapeChance: 73 },
      { pokemonSpeedRatio: 3.8, escapeAttempts: 0, expectedEscapeChance: 91 },
      { pokemonSpeedRatio: 4, escapeAttempts: 0, expectedEscapeChance: 95 },
      { pokemonSpeedRatio: 4.2, escapeAttempts: 0, expectedEscapeChance: 95 },
      { pokemonSpeedRatio: 10, escapeAttempts: 0, expectedEscapeChance: 95 },

      // retries section
      { pokemonSpeedRatio: 0.4, escapeAttempts: 1, expectedEscapeChance: 24 },
      { pokemonSpeedRatio: 1.6, escapeAttempts: 2, expectedEscapeChance: 61 },
      { pokemonSpeedRatio: 3.7, escapeAttempts: 5, expectedEscapeChance: 95 },
      { pokemonSpeedRatio: 0.2, escapeAttempts: 2, expectedEscapeChance: 30 },
      { pokemonSpeedRatio: 1, escapeAttempts: 3, expectedEscapeChance: 58 },
      { pokemonSpeedRatio: 2.9, escapeAttempts: 0, expectedEscapeChance: 70 },
      { pokemonSpeedRatio: 0.01, escapeAttempts: 7, expectedEscapeChance: 75 },
      { pokemonSpeedRatio: 16.2, escapeAttempts: 4, expectedEscapeChance: 95 },
      { pokemonSpeedRatio: 2, escapeAttempts: 3, expectedEscapeChance: 80 },
    ];

    for (const check of escapeChances) {
      // set the number of escape attempts to the required amount
      game.scene.currentBattle.escapeAttempts = check.escapeAttempts;
      // set playerPokemon's speed to a multiple of the enemySpeed
      vi.spyOn(playerPokemon[0], "stats", "get").mockReturnValue([
        20,
        20,
        20,
        20,
        20,
        check.pokemonSpeedRatio * enemySpeed,
      ]);
      const chance = phase.calculateEscapeChance(game.scene.currentBattle.escapeAttempts);
      expect(chance).toBe(check.expectedEscapeChance);
    }
  });

  it("double non-boss opponent", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.ABOMASNOW]);

    const playerPokemon = game.scene.getPlayerField();
    const enemyField = game.scene.getEnemyField();
    const enemyASpeed = 70;
    const enemyBSpeed = 30;
    // gets the sum of the speed of the two pokemon
    const totalEnemySpeed = enemyASpeed + enemyBSpeed;
    // this is used to find the ratio of the player's first pokemon
    const playerASpeedPercentage = 0.4;
    // set enemyAPokemon's speed to 70
    vi.spyOn(enemyField[0], "stats", "get").mockReturnValue([20, 20, 20, 20, 20, enemyASpeed]);
    // set enemyBPokemon's speed to 30
    vi.spyOn(enemyField[1], "stats", "get").mockReturnValue([20, 20, 20, 20, 20, enemyBSpeed]);

    const commandPhase = game.scene.phaseManager.getCurrentPhase() as CommandPhase;
    commandPhase.handleCommand(Command.RUN, 0);

    await game.phaseInterceptor.to(AttemptRunPhase, false);
    const phase = game.scene.phaseManager.getCurrentPhase() as AttemptRunPhase;
    // this sets up an object for multiple attempts. The pokemonSpeedRatio is your speed divided by the enemy speed, the escapeAttempts are the number of escape attempts and the expectedEscapeChance is the chance it should be escaping
    const escapeChances: {
      pokemonSpeedRatio: number;
      escapeAttempts: number;
      expectedEscapeChance: number;
    }[] = [
      { pokemonSpeedRatio: 0.3, escapeAttempts: 0, expectedEscapeChance: 12 },
      { pokemonSpeedRatio: 0.7, escapeAttempts: 0, expectedEscapeChance: 21 },
      { pokemonSpeedRatio: 1.5, escapeAttempts: 0, expectedEscapeChance: 39 },
      { pokemonSpeedRatio: 3, escapeAttempts: 0, expectedEscapeChance: 73 },
      { pokemonSpeedRatio: 9, escapeAttempts: 0, expectedEscapeChance: 95 },
      { pokemonSpeedRatio: 0.01, escapeAttempts: 0, expectedEscapeChance: 5 },
      { pokemonSpeedRatio: 1, escapeAttempts: 0, expectedEscapeChance: 28 },
      { pokemonSpeedRatio: 4.3, escapeAttempts: 0, expectedEscapeChance: 95 },
      { pokemonSpeedRatio: 2.7, escapeAttempts: 0, expectedEscapeChance: 66 },
      { pokemonSpeedRatio: 2.1, escapeAttempts: 0, expectedEscapeChance: 52 },
      { pokemonSpeedRatio: 1.8, escapeAttempts: 0, expectedEscapeChance: 46 },
      { pokemonSpeedRatio: 6, escapeAttempts: 0, expectedEscapeChance: 95 },

      // retries section
      { pokemonSpeedRatio: 0.9, escapeAttempts: 1, expectedEscapeChance: 35 },
      { pokemonSpeedRatio: 3.6, escapeAttempts: 2, expectedEscapeChance: 95 },
      { pokemonSpeedRatio: 0.03, escapeAttempts: 7, expectedEscapeChance: 76 },
      { pokemonSpeedRatio: 0.02, escapeAttempts: 7, expectedEscapeChance: 75 },
      { pokemonSpeedRatio: 1, escapeAttempts: 5, expectedEscapeChance: 78 },
      { pokemonSpeedRatio: 0.7, escapeAttempts: 3, expectedEscapeChance: 51 },
      { pokemonSpeedRatio: 2.4, escapeAttempts: 9, expectedEscapeChance: 95 },
      { pokemonSpeedRatio: 1.8, escapeAttempts: 7, expectedEscapeChance: 95 },
      { pokemonSpeedRatio: 2, escapeAttempts: 10, expectedEscapeChance: 95 },
    ];

    for (const check of escapeChances) {
      // sets the number of escape attempts to the required amount
      game.scene.currentBattle.escapeAttempts = check.escapeAttempts;
      // set the first playerPokemon's speed to a multiple of the enemySpeed
      vi.spyOn(playerPokemon[0], "stats", "get").mockReturnValue([
        20,
        20,
        20,
        20,
        20,
        Math.floor(check.pokemonSpeedRatio * totalEnemySpeed * playerASpeedPercentage),
      ]);
      // set the second playerPokemon's speed to the remaining value of speed
      vi.spyOn(playerPokemon[1], "stats", "get").mockReturnValue([
        20,
        20,
        20,
        20,
        20,
        check.pokemonSpeedRatio * totalEnemySpeed - playerPokemon[0].stats[5],
      ]);
      const chance = phase.calculateEscapeChance(game.scene.currentBattle.escapeAttempts);
      // checks to make sure the escape values are the same
      expect(chance).toBe(check.expectedEscapeChance);
      // checks to make sure the sum of the player's speed for all pokemon is equal to the appropriate ratio of the total enemy speed
      expect(playerPokemon[0].stats[5] + playerPokemon[1].stats[5]).toBe(check.pokemonSpeedRatio * totalEnemySpeed);
    }
  });

  it("single boss opponent", async () => {
    game.override.startingWave(10);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    const playerPokemon = game.scene.getPlayerField()!;
    const enemyField = game.scene.getEnemyField()!;
    const enemySpeed = 100;
    // set enemyPokemon's speed to 100
    vi.spyOn(enemyField[0], "stats", "get").mockReturnValue([20, 20, 20, 20, 20, enemySpeed]);

    const commandPhase = game.scene.phaseManager.getCurrentPhase() as CommandPhase;
    commandPhase.handleCommand(Command.RUN, 0);

    await game.phaseInterceptor.to(AttemptRunPhase, false);
    const phase = game.scene.phaseManager.getCurrentPhase() as AttemptRunPhase;

    // this sets up an object for multiple attempts. The pokemonSpeedRatio is your speed divided by the enemy speed, the escapeAttempts are the number of escape attempts and the expectedEscapeChance is the chance it should be escaping
    const escapeChances: {
      pokemonSpeedRatio: number;
      escapeAttempts: number;
      expectedEscapeChance: number;
    }[] = [
      { pokemonSpeedRatio: 0.01, escapeAttempts: 0, expectedEscapeChance: 5 },
      { pokemonSpeedRatio: 0.1, escapeAttempts: 0, expectedEscapeChance: 5 },
      { pokemonSpeedRatio: 0.25, escapeAttempts: 0, expectedEscapeChance: 6 },
      { pokemonSpeedRatio: 0.5, escapeAttempts: 0, expectedEscapeChance: 7 },
      { pokemonSpeedRatio: 0.8, escapeAttempts: 0, expectedEscapeChance: 8 },
      { pokemonSpeedRatio: 1, escapeAttempts: 0, expectedEscapeChance: 8 },
      { pokemonSpeedRatio: 1.2, escapeAttempts: 0, expectedEscapeChance: 9 },
      { pokemonSpeedRatio: 1.5, escapeAttempts: 0, expectedEscapeChance: 10 },
      { pokemonSpeedRatio: 3, escapeAttempts: 0, expectedEscapeChance: 15 },
      { pokemonSpeedRatio: 3.8, escapeAttempts: 0, expectedEscapeChance: 18 },
      { pokemonSpeedRatio: 4, escapeAttempts: 0, expectedEscapeChance: 18 },
      { pokemonSpeedRatio: 4.2, escapeAttempts: 0, expectedEscapeChance: 19 },
      { pokemonSpeedRatio: 4.7, escapeAttempts: 0, expectedEscapeChance: 21 },
      { pokemonSpeedRatio: 5, escapeAttempts: 0, expectedEscapeChance: 22 },
      { pokemonSpeedRatio: 5.9, escapeAttempts: 0, expectedEscapeChance: 25 },
      { pokemonSpeedRatio: 6, escapeAttempts: 0, expectedEscapeChance: 25 },
      { pokemonSpeedRatio: 6.7, escapeAttempts: 0, expectedEscapeChance: 25 },
      { pokemonSpeedRatio: 10, escapeAttempts: 0, expectedEscapeChance: 25 },

      // retries section
      { pokemonSpeedRatio: 0.4, escapeAttempts: 1, expectedEscapeChance: 8 },
      { pokemonSpeedRatio: 1.6, escapeAttempts: 2, expectedEscapeChance: 14 },
      { pokemonSpeedRatio: 3.7, escapeAttempts: 5, expectedEscapeChance: 25 },
      { pokemonSpeedRatio: 0.2, escapeAttempts: 2, expectedEscapeChance: 10 },
      { pokemonSpeedRatio: 1, escapeAttempts: 3, expectedEscapeChance: 14 },
      { pokemonSpeedRatio: 2.9, escapeAttempts: 0, expectedEscapeChance: 15 },
      { pokemonSpeedRatio: 0.01, escapeAttempts: 7, expectedEscapeChance: 19 },
      { pokemonSpeedRatio: 16.2, escapeAttempts: 4, expectedEscapeChance: 25 },
      { pokemonSpeedRatio: 2, escapeAttempts: 3, expectedEscapeChance: 18 },
      { pokemonSpeedRatio: 4.5, escapeAttempts: 1, expectedEscapeChance: 22 },
      { pokemonSpeedRatio: 6.8, escapeAttempts: 6, expectedEscapeChance: 25 },
      { pokemonSpeedRatio: 5.2, escapeAttempts: 8, expectedEscapeChance: 25 },
      { pokemonSpeedRatio: 4.7, escapeAttempts: 10, expectedEscapeChance: 25 },
      { pokemonSpeedRatio: 5.1, escapeAttempts: 1, expectedEscapeChance: 24 },
      { pokemonSpeedRatio: 6, escapeAttempts: 0, expectedEscapeChance: 25 },
      { pokemonSpeedRatio: 5.9, escapeAttempts: 2, expectedEscapeChance: 25 },
      { pokemonSpeedRatio: 6.1, escapeAttempts: 3, expectedEscapeChance: 25 },
    ];

    for (const check of escapeChances) {
      // sets the number of escape attempts to the required amount
      game.scene.currentBattle.escapeAttempts = check.escapeAttempts;
      // set playerPokemon's speed to a multiple of the enemySpeed
      vi.spyOn(playerPokemon[0], "stats", "get").mockReturnValue([
        20,
        20,
        20,
        20,
        20,
        check.pokemonSpeedRatio * enemySpeed,
      ]);
      const chance = phase.calculateEscapeChance(game.scene.currentBattle.escapeAttempts);
      expect(chance).toBe(check.expectedEscapeChance);
    }
  });

  it("double boss opponent", async () => {
    game.override.battleStyle("double").startingWave(10);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.ABOMASNOW]);

    const playerPokemon = game.scene.getPlayerField();
    const enemyField = game.scene.getEnemyField();
    const enemyASpeed = 70;
    const enemyBSpeed = 30;
    // gets the sum of the speed of the two pokemon
    const totalEnemySpeed = enemyASpeed + enemyBSpeed;
    // this is used to find the ratio of the player's first pokemon
    const playerASpeedPercentage = 0.8;
    // set enemyAPokemon's speed to 70
    vi.spyOn(enemyField[0], "stats", "get").mockReturnValue([20, 20, 20, 20, 20, enemyASpeed]);
    // set enemyBPokemon's speed to 30
    vi.spyOn(enemyField[1], "stats", "get").mockReturnValue([20, 20, 20, 20, 20, enemyBSpeed]);

    const commandPhase = game.scene.phaseManager.getCurrentPhase() as CommandPhase;
    commandPhase.handleCommand(Command.RUN, 0);

    await game.phaseInterceptor.to(AttemptRunPhase, false);
    const phase = game.scene.phaseManager.getCurrentPhase() as AttemptRunPhase;

    // this sets up an object for multiple attempts. The pokemonSpeedRatio is your speed divided by the enemy speed, the escapeAttempts are the number of escape attempts and the expectedEscapeChance is the chance it should be escaping
    const escapeChances: {
      pokemonSpeedRatio: number;
      escapeAttempts: number;
      expectedEscapeChance: number;
    }[] = [
      { pokemonSpeedRatio: 0.3, escapeAttempts: 0, expectedEscapeChance: 6 },
      { pokemonSpeedRatio: 0.7, escapeAttempts: 0, expectedEscapeChance: 7 },
      { pokemonSpeedRatio: 1.5, escapeAttempts: 0, expectedEscapeChance: 10 },
      { pokemonSpeedRatio: 3, escapeAttempts: 0, expectedEscapeChance: 15 },
      { pokemonSpeedRatio: 9, escapeAttempts: 0, expectedEscapeChance: 25 },
      { pokemonSpeedRatio: 0.01, escapeAttempts: 0, expectedEscapeChance: 5 },
      { pokemonSpeedRatio: 1, escapeAttempts: 0, expectedEscapeChance: 8 },
      { pokemonSpeedRatio: 4.3, escapeAttempts: 0, expectedEscapeChance: 19 },
      { pokemonSpeedRatio: 2.7, escapeAttempts: 0, expectedEscapeChance: 14 },
      { pokemonSpeedRatio: 2.1, escapeAttempts: 0, expectedEscapeChance: 12 },
      { pokemonSpeedRatio: 1.8, escapeAttempts: 0, expectedEscapeChance: 11 },
      { pokemonSpeedRatio: 6, escapeAttempts: 0, expectedEscapeChance: 25 },
      { pokemonSpeedRatio: 4, escapeAttempts: 0, expectedEscapeChance: 18 },
      { pokemonSpeedRatio: 5.7, escapeAttempts: 0, expectedEscapeChance: 24 },
      { pokemonSpeedRatio: 5, escapeAttempts: 0, expectedEscapeChance: 22 },
      { pokemonSpeedRatio: 6.1, escapeAttempts: 0, expectedEscapeChance: 25 },
      { pokemonSpeedRatio: 6.8, escapeAttempts: 0, expectedEscapeChance: 25 },
      { pokemonSpeedRatio: 10, escapeAttempts: 0, expectedEscapeChance: 25 },

      // retries section
      { pokemonSpeedRatio: 0.9, escapeAttempts: 1, expectedEscapeChance: 10 },
      { pokemonSpeedRatio: 3.6, escapeAttempts: 2, expectedEscapeChance: 21 },
      { pokemonSpeedRatio: 0.03, escapeAttempts: 7, expectedEscapeChance: 19 },
      { pokemonSpeedRatio: 0.02, escapeAttempts: 7, expectedEscapeChance: 19 },
      { pokemonSpeedRatio: 1, escapeAttempts: 5, expectedEscapeChance: 18 },
      { pokemonSpeedRatio: 0.7, escapeAttempts: 3, expectedEscapeChance: 13 },
      { pokemonSpeedRatio: 2.4, escapeAttempts: 9, expectedEscapeChance: 25 },
      { pokemonSpeedRatio: 1.8, escapeAttempts: 7, expectedEscapeChance: 25 },
      { pokemonSpeedRatio: 2, escapeAttempts: 10, expectedEscapeChance: 25 },
      { pokemonSpeedRatio: 3, escapeAttempts: 1, expectedEscapeChance: 17 },
      { pokemonSpeedRatio: 4.5, escapeAttempts: 3, expectedEscapeChance: 25 },
      { pokemonSpeedRatio: 3.7, escapeAttempts: 1, expectedEscapeChance: 19 },
      { pokemonSpeedRatio: 6.5, escapeAttempts: 1, expectedEscapeChance: 25 },
      { pokemonSpeedRatio: 12, escapeAttempts: 4, expectedEscapeChance: 25 },
      { pokemonSpeedRatio: 5.2, escapeAttempts: 2, expectedEscapeChance: 25 },
    ];

    for (const check of escapeChances) {
      // sets the number of escape attempts to the required amount
      game.scene.currentBattle.escapeAttempts = check.escapeAttempts;
      // set the first playerPokemon's speed to a multiple of the enemySpeed
      vi.spyOn(playerPokemon[0], "stats", "get").mockReturnValue([
        20,
        20,
        20,
        20,
        20,
        Math.floor(check.pokemonSpeedRatio * totalEnemySpeed * playerASpeedPercentage),
      ]);
      // set the second playerPokemon's speed to the remaining value of speed
      vi.spyOn(playerPokemon[1], "stats", "get").mockReturnValue([
        20,
        20,
        20,
        20,
        20,
        check.pokemonSpeedRatio * totalEnemySpeed - playerPokemon[0].stats[5],
      ]);
      const chance = phase.calculateEscapeChance(game.scene.currentBattle.escapeAttempts);
      // checks to make sure the escape values are the same
      expect(chance).toBe(check.expectedEscapeChance);
      // checks to make sure the sum of the player's speed for all pokemon is equal to the appropriate ratio of the total enemy speed
      expect(playerPokemon[0].stats[5] + playerPokemon[1].stats[5]).toBe(check.pokemonSpeedRatio * totalEnemySpeed);
    }
  });
});
