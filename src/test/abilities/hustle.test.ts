import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import overrides from "#app/overrides";
import { Species } from "#enums/species";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { DamagePhase, MoveEffectPhase } from "#app/phases.js";
import { Abilities } from "#app/enums/abilities.js";
import { Stat } from "#app/enums/stat.js";
import { allMoves } from "#app/data/move.js";

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
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.HUSTLE);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE, Moves.GIGA_DRAIN, Moves.FISSURE]);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(5);
    vi.spyOn(overrides, "NEVER_CRIT_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(5);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.SHUCKLE);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.BALL_FETCH);
  });

  it("increases the user's Attack stat by 50%", async () => {
    await game.startBattle([Species.PIKACHU]);
    const pikachu = game.scene.getPlayerPokemon();
    const atk = pikachu.stats[Stat.ATK];

    vi.spyOn(pikachu, "getBattleStat");

    game.doAttack(getMovePosition(game.scene, 0, Moves.TACKLE));
    await game.phaseInterceptor.to(MoveEffectPhase, false);
    vi.spyOn(game.scene.getCurrentPhase() as MoveEffectPhase, "hitCheck").mockReturnValue(true);
    await game.phaseInterceptor.to(DamagePhase);

    expect(pikachu.getBattleStat).toHaveReturnedWith(atk * 1.5);
  });

  it("lowers the accuracy of the user's physical moves by 20%", async () => {
    await game.startBattle([Species.PIKACHU]);
    const pikachu = game.scene.getPlayerPokemon();

    vi.spyOn(pikachu, "getAccuracyMultiplier");

    game.doAttack(getMovePosition(game.scene, 0, Moves.TACKLE));
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(pikachu.getAccuracyMultiplier).toHaveReturnedWith(0.8);
  });

  it("does not affect non-physical moves", async () => {
    await game.startBattle([Species.PIKACHU]);
    const pikachu = game.scene.getPlayerPokemon();
    const spatk = pikachu.stats[Stat.SPATK];

    vi.spyOn(pikachu, "getBattleStat");
    vi.spyOn(pikachu, "getAccuracyMultiplier");

    game.doAttack(getMovePosition(game.scene, 0, Moves.GIGA_DRAIN));
    await game.phaseInterceptor.to(DamagePhase);

    expect(pikachu.getBattleStat).toHaveReturnedWith(spatk);
    expect(pikachu.getAccuracyMultiplier).toHaveReturnedWith(1);
  });

  it("does not affect OHKO moves", async () => {
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(30);

    await game.startBattle([Species.PIKACHU]);
    const pikachu = game.scene.getPlayerPokemon();
    const enemyPokemon = game.scene.getEnemyPokemon();

    vi.spyOn(pikachu, "getAccuracyMultiplier");
    vi.spyOn(allMoves[Moves.FISSURE], "calculateBattleAccuracy");

    game.doAttack(getMovePosition(game.scene, 0, Moves.FISSURE));
    await game.phaseInterceptor.to(DamagePhase);

    expect(enemyPokemon.turnData.damageTaken).toBe(enemyPokemon.getMaxHp());
    expect(pikachu.getAccuracyMultiplier).toHaveReturnedWith(1);
    expect(allMoves[Moves.FISSURE].calculateBattleAccuracy).toHaveReturnedWith(100);
  });
});
