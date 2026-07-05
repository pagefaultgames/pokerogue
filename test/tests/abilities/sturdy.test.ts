import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Sturdy", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .battleStyle("single")
      .criticalHits(false)
      .startingLevel(100)
      .ability(AbilityId.NO_GUARD)
      .enemySpecies(SpeciesId.ARON)
      .enemyMoveset(MoveId.SPLASH)
      .enemyLevel(5)
      .enemyAbility(AbilityId.STURDY);
  });

  it("activates when user is at full HP", async () => {
    await game.classicMode.startBattle(SpeciesId.LUCARIO);

    game.move.use(MoveId.CLOSE_COMBAT);
    await game.toEndOfTurn();

    expect(game.field.getEnemyPokemon()).toHaveHp(1);
  });

  it("doesn't activate when user is not at full HP", async () => {
    await game.classicMode.startBattle(SpeciesId.LUCARIO);

    const enemyPokemon = game.field.getEnemyPokemon();
    enemyPokemon.hp = enemyPokemon.getMaxHp() - 1;

    game.move.use(MoveId.CLOSE_COMBAT);
    await game.toEndOfTurn();

    expect(enemyPokemon).toHaveFainted();
  });

  it("protects from OHKO moves", async () => {
    await game.classicMode.startBattle(SpeciesId.LUCARIO);

    game.move.use(MoveId.FISSURE);
    await game.toEndOfTurn();

    expect(game.field.getEnemyPokemon()).toHaveFullHp();
  });

  it("doesn't incorrectly activate on the second hit of a multi-hit if the damage from the first hit is reduced by boss bars", async () => {
    game.override.startingWave(10);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const enemy = game.field.getEnemyPokemon();
    // the minimum code is mocked out so all effects are properly triggered
    vi.spyOn(enemy, "getMoveEffectiveness").mockReturnValue(1);
    vi.spyOn(enemy, "getBaseDamage").mockReturnValue(enemy.getMaxHp());

    const damageSpy = vi.spyOn(enemy, "getAttackDamage");

    game.move.use(MoveId.DOUBLE_KICK);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy).not.toHaveFainted();
    expect(enemy).toHaveHp(Math.ceil(enemy.getMaxHp() / 2));
    expect(damageSpy.mock.results[0].type).toBe("return");
    expect(damageSpy.mock.results[0].value.damage).toBeGreaterThanOrEqual(enemy.getMaxHp());

    await game.toEndOfTurn();

    expect(enemy).toHaveFainted();
  });
});
