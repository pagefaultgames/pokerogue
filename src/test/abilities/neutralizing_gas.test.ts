import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Stat } from "#enums/stat";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Neutralizing Gas", () => {
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
      .moveset([ Moves.SPLASH ])
      .ability(Abilities.NEUTRALIZING_GAS)
      .battleType("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should prevent other abilities from activating", async () => {
    game.override.enemyAbility(Abilities.INTIMIDATE);
    await game.classicMode.startBattle([ Species.FEEBAS ]);

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    // Intimidate is suppressed, so the attack stat should not be lowered
    expect(game.scene.getPlayerPokemon()?.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should allow the user's passive to activate", async () => {
    game.override.passiveAbility(Abilities.INTREPID_SWORD);
    await game.classicMode.startBattle([ Species.FEEBAS ]);

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.scene.getPlayerPokemon()?.getStatStage(Stat.ATK)).toBe(1);
  });

  // Note - this passes right now because ability order doesn't consider speed at all
  it("should activate before other abilities", async () => {
    game.override.enemySpecies(Species.ACCELGOR)
      .enemyLevel(100)
      .enemyAbility(Abilities.INTIMIDATE);

    await game.classicMode.startBattle([ Species.FEEBAS ]);

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    // Intimidate is suppressed even when the user's speed is lower
    expect(game.scene.getPlayerPokemon()?.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should activate other abilities when removed", async () => {
    game.override.enemyAbility(Abilities.INTIMIDATE)
      .enemyMoveset(Moves.ENTRAINMENT);

    await game.classicMode.startBattle([ Species.FEEBAS ]);

    const playerPokemon = game.scene.getPlayerPokemon();
    expect(playerPokemon?.getStatStage(Stat.ATK)).toBe(0);

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");
    // Enemy removes user's ability, so intimidate is activated
    expect(playerPokemon?.getStatStage(Stat.ATK)).toBe(-1);
  });

});
