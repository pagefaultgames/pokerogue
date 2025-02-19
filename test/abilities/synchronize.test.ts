import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { StatusEffect } from "#enums/status-effect";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Synchronize", () => {
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
      .battleType("single")
      .startingLevel(100)
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.SYNCHRONIZE)
      .moveset([ Moves.SPLASH, Moves.THUNDER_WAVE, Moves.SPORE, Moves.PSYCHO_SHIFT ])
      .ability(Abilities.NO_GUARD);
  });

  it("does not trigger when no status is applied by opponent Pokemon", async () => {
    await game.classicMode.startBattle([ Species.FEEBAS ]);

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getPlayerPokemon()!.status).toBeUndefined();
    expect(game.phaseInterceptor.log).not.toContain("ShowAbilityPhase");
  });

  it("sets the status of the source pokemon to Paralysis when paralyzed by it", async () => {
    await game.classicMode.startBattle([ Species.FEEBAS ]);

    game.move.select(Moves.THUNDER_WAVE);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getPlayerPokemon()!.status?.effect).toBe(StatusEffect.PARALYSIS);
    expect(game.scene.getEnemyPokemon()!.status?.effect).toBe(StatusEffect.PARALYSIS);
    expect(game.phaseInterceptor.log).toContain("ShowAbilityPhase");
  });

  it("does not trigger on Sleep", async () => {
    await game.classicMode.startBattle();

    game.move.select(Moves.SPORE);

    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getPlayerPokemon()!.status?.effect).toBeUndefined();
    expect(game.scene.getEnemyPokemon()!.status?.effect).toBe(StatusEffect.SLEEP);
    expect(game.phaseInterceptor.log).not.toContain("ShowAbilityPhase");
  });

  it("does not trigger when Pokemon is statused by Toxic Spikes", async () => {
    game.override
      .ability(Abilities.SYNCHRONIZE)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Array(4).fill(Moves.TOXIC_SPIKES));

    await game.classicMode.startBattle([ Species.FEEBAS, Species.MILOTIC ]);

    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    game.doSwitchPokemon(1);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getPlayerPokemon()!.status?.effect).toBe(StatusEffect.POISON);
    expect(game.scene.getEnemyPokemon()!.status?.effect).toBeUndefined();
    expect(game.phaseInterceptor.log).not.toContain("ShowAbilityPhase");
  });

  it("shows ability even if it fails to set the status of the opponent Pokemon", async () => {
    await game.classicMode.startBattle([ Species.PIKACHU ]);

    game.move.select(Moves.THUNDER_WAVE);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getPlayerPokemon()!.status?.effect).toBeUndefined();
    expect(game.scene.getEnemyPokemon()!.status?.effect).toBe(StatusEffect.PARALYSIS);
    expect(game.phaseInterceptor.log).toContain("ShowAbilityPhase");
  });
});
