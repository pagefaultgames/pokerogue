import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
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
      .ability(AbilityId.HUSTLE)
      .moveset([MoveId.TACKLE, MoveId.GIGA_DRAIN, MoveId.FISSURE])
      .criticalHits(false)
      .battleStyle("single")
      .enemyMoveset(MoveId.SPLASH)
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyAbility(AbilityId.BALL_FETCH);
  });

  it("increases the user's Attack stat by 50%", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);
    const pikachu = game.field.getPlayerPokemon();
    const atk = pikachu.stats[Stat.ATK];

    vi.spyOn(pikachu, "getEffectiveStat");

    game.move.select(MoveId.TACKLE);
    await game.move.forceHit();
    await game.phaseInterceptor.to("DamageAnimPhase");

    expect(pikachu.getEffectiveStat).toHaveReturnedWith(Math.floor(atk * 1.5));
  });

  it("lowers the accuracy of the user's physical moves by 20%", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);
    const pikachu = game.field.getPlayerPokemon();

    vi.spyOn(pikachu, "getAccuracyMultiplier");

    game.move.select(MoveId.TACKLE);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(pikachu.getAccuracyMultiplier).toHaveReturnedWith(0.8);
  });

  it("does not affect non-physical moves", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);
    const pikachu = game.field.getPlayerPokemon();
    const spatk = pikachu.stats[Stat.SPATK];

    vi.spyOn(pikachu, "getEffectiveStat");
    vi.spyOn(pikachu, "getAccuracyMultiplier");

    game.move.select(MoveId.GIGA_DRAIN);
    await game.phaseInterceptor.to("DamageAnimPhase");

    expect(pikachu.getEffectiveStat).toHaveReturnedWith(spatk);
    expect(pikachu.getAccuracyMultiplier).toHaveReturnedWith(1);
  });

  it("does not affect OHKO moves", async () => {
    game.override.startingLevel(100).enemyLevel(30);

    await game.classicMode.startBattle([SpeciesId.PIKACHU]);
    const pikachu = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    vi.spyOn(pikachu, "getAccuracyMultiplier");
    vi.spyOn(allMoves[MoveId.FISSURE], "calculateBattleAccuracy");

    game.move.select(MoveId.FISSURE);
    await game.phaseInterceptor.to("DamageAnimPhase");

    expect(enemyPokemon.turnData.damageTaken).toBe(enemyPokemon.getMaxHp());
    expect(pikachu.getAccuracyMultiplier).toHaveReturnedWith(1);
    expect(allMoves[MoveId.FISSURE].calculateBattleAccuracy).toHaveReturnedWith(100);
  });
});
