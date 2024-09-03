import { AttemptRunPhase } from "#app/phases/attempt-run-phase";
import { Command } from "#app/ui/command-ui-handler";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import * as Utils from "#app/utils";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CommandPhase } from "../phases/command-phase";

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
    game.override.battleType("single");
    game.override.enemySpecies(Species.BULBASAUR);
    game.override.enemyAbility(Abilities.INSOMNIA);
    game.override.ability(Abilities.INSOMNIA);
    game.override.moveset([Moves.TACKLE]);
  });

  it("single non-boss opponent", async () => {
    await game.startBattle([
      Species.BULBASAUR,
    ]);

    const playerPokemon = game.scene.getPlayerField()!;
    const enemyField = game.scene.getEnemyField()!;
    const enemySpeed = 100;
    vi.spyOn(enemyField[0], "stats", "get").mockReturnValue([20, 20, 20, 20, 20, enemySpeed]); // set enemyPokemon's speed to 100

    const commandPhase = game.scene.getCurrentPhase() as CommandPhase;
    commandPhase.handleCommand(Command.RUN, 0);

    await game.phaseInterceptor.to(AttemptRunPhase, false);
    const phase = game.scene.getCurrentPhase() as AttemptRunPhase;
    //console.log("Current phase = " + game.scene.getCurrentPhase()?.constructor.name);
    const escapePercentage = new Utils.IntegerHolder(0);

    //const expectedEscapeChance = [5, 7, 11, 16, 23, 25,];
    // this sets up an object for multiple attempts. The pokemonSpeedRatio is your speed divided by the enemy speed, and the expectedEscapeChance is the chance it should be escaping
    const escapeChances: { pokemonSpeedRatio: number, escapeAttempts: number, expectedEscapeChance: number }[] = [
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

      // retries
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

    for (let i = 0; i < escapeChances.length; i++) {
      game.scene.currentBattle.escapeAttempts = escapeChances[i].escapeAttempts; // sets the number of escape attempts to the required amount
      vi.spyOn(playerPokemon[0], "stats", "get").mockReturnValue([20, 20, 20, 20, 20, escapeChances[i].pokemonSpeedRatio * enemySpeed]); // set playerPokemon's speed to a multiple of the enemySpeed
      phase.attemptRunAway(playerPokemon, enemyField, escapePercentage);
      expect(escapePercentage.value).toBe(escapeChances[i].expectedEscapeChance);
      console.log("Escape chance is = " + escapePercentage.value + "; should be " + escapeChances[i].expectedEscapeChance);
    }
  }, 20000);

  it("double non-boss opponent", async () => {
    game.override.battleType("double");
    await game.startBattle([
      Species.BULBASAUR,
      Species.ABOMASNOW,
    ]);

    const playerPokemon = game.scene.getPlayerField()!;
    const enemyField = game.scene.getEnemyField()!;
    const enemyASpeed = 70;
    const enemyBSpeed = 30;
    const totalEnemySpeed = enemyASpeed + enemyBSpeed; // gets the sum of the speed of the two pokemon
    const playerASpeedPercentage = 0.4; // this is used to find the ratio of the player's first pokemon
    vi.spyOn(enemyField[0], "stats", "get").mockReturnValue([20, 20, 20, 20, 20, enemyASpeed]); // set enemyAPokemon's speed to 70
    vi.spyOn(enemyField[1], "stats", "get").mockReturnValue([20, 20, 20, 20, 20, enemyBSpeed]); // set enemyBPokemon's speed to 30

    const commandPhase = game.scene.getCurrentPhase() as CommandPhase;
    commandPhase.handleCommand(Command.RUN, 0);

    await game.phaseInterceptor.to(AttemptRunPhase, false);
    const phase = game.scene.getCurrentPhase() as AttemptRunPhase;
    //console.log("Current phase = " + game.scene.getCurrentPhase()?.constructor.name);
    const escapePercentage = new Utils.IntegerHolder(0);

    //const expectedEscapeChance = [5, 7, 11, 16, 23, 25,];
    // this sets up an object for multiple attempts. The pokemonSpeedRatio is your speed divided by the enemy speed, and the expectedEscapeChance is the chance it should be escaping
    const escapeChances: { pokemonSpeedRatio: number, escapeAttempts: number, expectedEscapeChance: number }[] = [
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

    for (let i = 0; i < escapeChances.length; i++) {
      game.scene.currentBattle.escapeAttempts = escapeChances[i].escapeAttempts; // sets the number of escape attempts to the required amount
      vi.spyOn(playerPokemon[0], "stats", "get").mockReturnValue([20, 20, 20, 20, 20, Math.floor(escapeChances[i].pokemonSpeedRatio * totalEnemySpeed * playerASpeedPercentage)]); // set the first playerPokemon's speed to a multiple of the enemySpeed
      vi.spyOn(playerPokemon[1], "stats", "get").mockReturnValue([20, 20, 20, 20, 20, escapeChances[i].pokemonSpeedRatio * totalEnemySpeed - playerPokemon[0].stats[5]]); // set the second playerPokemon's speed to the remaining value of speed
      console.log("Pokemon A speed = " + playerPokemon[0].stats[5] + "; Pokemon B speed = " + playerPokemon[1].stats[5] + "; Total enemy speed = " + Number(escapeChances[i].pokemonSpeedRatio * totalEnemySpeed) + "; Total player speed = " + Number(playerPokemon[0].stats[5] + playerPokemon[1].stats[5]));
      phase.attemptRunAway(playerPokemon, enemyField, escapePercentage);
      expect(escapePercentage.value).toBe(escapeChances[i].expectedEscapeChance); // checks to make sure the escape values are the same
      expect(playerPokemon[0].stats[5] + playerPokemon[1].stats[5]).toBe(escapeChances[i].pokemonSpeedRatio * totalEnemySpeed); // checks to make sure the sum of the player's speed for all pokemon is equal to the appropriate ratio of the total enemy speed
      console.log("Escape chance is = " + escapePercentage.value + "; should be " + escapeChances[i].expectedEscapeChance);
    }
  }, 20000);
});
