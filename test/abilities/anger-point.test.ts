import { PostReceiveCritStatStageChangeAbAttr } from "#abilities/ability";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Ability - Anger Point", () => {
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
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .enemyLevel(100);
  });

  it("should set the user's attack stage to +6 when hit by a critical hit", async () => {
    game.override.enemyAbility(AbilityId.ANGER_POINT).moveset(MoveId.FALSE_SWIPE);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    const enemy = game.field.getEnemyPokemon();

    // minimize the enemy's attack stage to ensure it is always set to +6
    enemy.setStatStage(Stat.ATK, -6);
    vi.spyOn(enemy, "getCriticalHitResult").mockReturnValueOnce(true);
    game.move.select(MoveId.FALSE_SWIPE);
    await game.phaseInterceptor.to("BerryPhase");
    expect(enemy.getStatStage(Stat.ATK)).toBe(6);
  });

  it("should only proc once when a multi-hit move crits on the first hit", async () => {
    game.override
      .moveset(MoveId.BULLET_SEED)
      .enemyLevel(50)
      .enemyAbility(AbilityId.ANGER_POINT)
      .ability(AbilityId.SKILL_LINK);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);
    const enemy = game.field.getEnemyPokemon();
    vi.spyOn(enemy, "getCriticalHitResult").mockReturnValueOnce(true);
    const angerPointSpy = vi.spyOn(PostReceiveCritStatStageChangeAbAttr.prototype, "apply");
    game.move.select(MoveId.BULLET_SEED);
    await game.phaseInterceptor.to("BerryPhase");
    expect(angerPointSpy).toHaveBeenCalledTimes(1);
  });

  it("should set a contrary user's attack stage to -6 when hit by a critical hit", async () => {
    game.override
      .enemyAbility(AbilityId.ANGER_POINT)
      .enemyPassiveAbility(AbilityId.CONTRARY)
      .enemyHasPassiveAbility(true)
      .moveset(MoveId.FALSE_SWIPE);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    const enemy = game.field.getEnemyPokemon();
    vi.spyOn(enemy, "getCriticalHitResult").mockReturnValueOnce(true);
    enemy.setStatStage(Stat.ATK, 6);
    game.move.select(MoveId.FALSE_SWIPE);
    await game.phaseInterceptor.to("BerryPhase");
    expect(enemy.getStatStage(Stat.ATK)).toBe(-6);
  });
});
