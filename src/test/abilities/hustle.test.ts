import { allMoves } from "#app/data/move";
import { Abilities } from "#app/enums/abilities";
import { Stat } from "#app/enums/stat";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Hustle", () => {
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
      .ability(Abilities.HUSTLE)
      .moveset([ Moves.TACKLE, Moves.GIGA_DRAIN, Moves.FISSURE ])
      .disableCrits()
      .battleType("single")
      .enemyMoveset(SPLASH_ONLY)
      .enemySpecies(Species.SHUCKLE)
      .enemyAbility(Abilities.BALL_FETCH);
  });

  it("increases the user's Attack stat by 50%", async () => {
    await game.classicMode.startBattle([Species.PIKACHU]);
    const pikachu = game.scene.getPlayerPokemon()!;
    const atk = pikachu.stats[Stat.ATK];

    vi.spyOn(pikachu, "getEffectiveStat");

    game.move.select(Moves.TACKLE);
    await game.move.forceHit();
    await game.phaseInterceptor.to("DamagePhase");

    expect(pikachu.getEffectiveStat).toHaveReturnedWith(Math.floor(atk * 1.5));
  });

  it("lowers the accuracy of the user's physical moves by 20%", async () => {
    await game.classicMode.startBattle([Species.PIKACHU]);
    const pikachu = game.scene.getPlayerPokemon()!;

    vi.spyOn(pikachu, "getAccuracyMultiplier");

    game.move.select(Moves.TACKLE);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(pikachu.getAccuracyMultiplier).toHaveReturnedWith(0.8);
  });

  it("does not affect non-physical moves", async () => {
    await game.classicMode.startBattle([Species.PIKACHU]);
    const pikachu = game.scene.getPlayerPokemon()!;
    const spatk = pikachu.stats[Stat.SPATK];

    vi.spyOn(pikachu, "getEffectiveStat");
    vi.spyOn(pikachu, "getAccuracyMultiplier");

    game.move.select(Moves.GIGA_DRAIN);
    await game.phaseInterceptor.to("DamagePhase");

    expect(pikachu.getEffectiveStat).toHaveReturnedWith(spatk);
    expect(pikachu.getAccuracyMultiplier).toHaveReturnedWith(1);
  });

  it("does not affect OHKO moves", async () => {
    game.override.startingLevel(100);
    game.override.enemyLevel(30);

    await game.classicMode.startBattle([Species.PIKACHU]);
    const pikachu = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    vi.spyOn(pikachu, "getAccuracyMultiplier");
    vi.spyOn(allMoves[Moves.FISSURE], "calculateBattleAccuracy");

    game.move.select(Moves.FISSURE);
    await game.phaseInterceptor.to("DamagePhase");

    expect(enemyPokemon.turnData.damageTaken).toBe(enemyPokemon.getMaxHp());
    expect(pikachu.getAccuracyMultiplier).toHaveReturnedWith(1);
    expect(allMoves[Moves.FISSURE].calculateBattleAccuracy).toHaveReturnedWith(100);
  });
});
