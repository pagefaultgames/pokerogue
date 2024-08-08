import { allMoves } from "#app/data/move.js";
import { Abilities } from "#app/enums/abilities.js";
import { Stat } from "#app/enums/stat.js";
import { DamagePhase, MoveEffectPhase } from "#app/phases.js";
import GameManager from "#test/utils/gameManager";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { mockHitCheck, SPLASH_ONLY } from "#test/utils/testUtils";

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
    game.override.ability(Abilities.HUSTLE);
    game.override.moveset([Moves.TACKLE, Moves.GIGA_DRAIN, Moves.FISSURE]);
    game.override.startingLevel(5);
    game.override.disableCrits();
    game.override.enemyLevel(5);
    game.override.enemyMoveset(SPLASH_ONLY);
    game.override.enemySpecies(Species.SHUCKLE);
    game.override.enemyAbility(Abilities.BALL_FETCH);
  });

  it("increases the user's Attack stat by 50%", async () => {
    await game.startBattle([Species.PIKACHU]);
    const pikachu = game.scene.getPlayerPokemon()!;
    const atk = pikachu.stats[Stat.ATK];

    vi.spyOn(pikachu, "getBattleStat");

    game.doAttack(getMovePosition(game.scene, 0, Moves.TACKLE));
    await mockHitCheck(game, true);
    await game.phaseInterceptor.to(DamagePhase);

    expect(pikachu.getBattleStat).toHaveReturnedWith(atk * 1.5);
  });

  it("lowers the accuracy of the user's physical moves by 20%", async () => {
    await game.startBattle([Species.PIKACHU]);
    const pikachu = game.scene.getPlayerPokemon()!;

    vi.spyOn(pikachu, "getAccuracyMultiplier");

    game.doAttack(getMovePosition(game.scene, 0, Moves.TACKLE));
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(pikachu.getAccuracyMultiplier).toHaveReturnedWith(0.8);
  });

  it("does not affect non-physical moves", async () => {
    await game.startBattle([Species.PIKACHU]);
    const pikachu = game.scene.getPlayerPokemon()!;
    const spatk = pikachu.stats[Stat.SPATK];

    vi.spyOn(pikachu, "getBattleStat");
    vi.spyOn(pikachu, "getAccuracyMultiplier");

    game.doAttack(getMovePosition(game.scene, 0, Moves.GIGA_DRAIN));
    await game.phaseInterceptor.to(DamagePhase);

    expect(pikachu.getBattleStat).toHaveReturnedWith(spatk);
    expect(pikachu.getAccuracyMultiplier).toHaveReturnedWith(1);
  });

  it("does not affect OHKO moves", async () => {
    game.override.startingLevel(100);
    game.override.enemyLevel(30);

    await game.startBattle([Species.PIKACHU]);
    const pikachu = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    vi.spyOn(pikachu, "getAccuracyMultiplier");
    vi.spyOn(allMoves[Moves.FISSURE], "calculateBattleAccuracy");

    game.doAttack(getMovePosition(game.scene, 0, Moves.FISSURE));
    await game.phaseInterceptor.to(DamagePhase);

    expect(enemyPokemon.turnData.damageTaken).toBe(enemyPokemon.getMaxHp());
    expect(pikachu.getAccuracyMultiplier).toHaveReturnedWith(1);
    expect(allMoves[Moves.FISSURE].calculateBattleAccuracy).toHaveReturnedWith(100);
  });
});
