import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Items - Multi Lens", () => {
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
      .moveset([MoveId.TACKLE, MoveId.TRAILBLAZE, MoveId.TACHYON_CUTTER, MoveId.FUTURE_SIGHT])
      .ability(AbilityId.BALL_FETCH)
      .startingHeldItems([{ name: "MULTI_LENS" }])
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(99) // Check for proper rounding on Seismic Toss damage reduction
      .enemyLevel(99);
  });

  it.each([
    { stackCount: 1, firstHitDamage: 0.75 },
    { stackCount: 2, firstHitDamage: 0.5 },
  ])(
    "$stackCount count: should deal {$firstHitDamage}x damage on the first hit, then hit $stackCount times for 0.25x",
    async ({ stackCount, firstHitDamage }) => {
      game.override.startingHeldItems([{ name: "MULTI_LENS", count: stackCount }]);

      await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

      const enemyPokemon = game.field.getEnemyPokemon();
      const spy = vi.spyOn(enemyPokemon, "getAttackDamage");
      vi.spyOn(enemyPokemon, "getBaseDamage").mockReturnValue(100);

      game.move.select(MoveId.TACKLE);
      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

      await game.phaseInterceptor.to("MoveEndPhase");
      const damageResults = spy.mock.results.map(result => result.value?.damage);

      expect(damageResults).toHaveLength(1 + stackCount);
      expect(damageResults[0]).toBe(firstHitDamage * 100);
      damageResults.slice(1).forEach(dmg => expect(dmg).toBe(25));
    },
  );

  it("should stack additively with Parental Bond", async () => {
    game.override.ability(AbilityId.PARENTAL_BOND);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const playerPokemon = game.field.getPlayerPokemon();

    game.move.select(MoveId.TACKLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(playerPokemon.turnData.hitCount).toBe(3);
  });

  it("should apply secondary effects on each hit", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const playerPokemon = game.field.getPlayerPokemon();

    game.move.select(MoveId.TRAILBLAZE);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(playerPokemon.getStatStage(Stat.SPD)).toBe(2);
  });

  it("should not enhance multi-hit moves", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const playerPokemon = game.field.getPlayerPokemon();

    game.move.select(MoveId.TACHYON_CUTTER);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(playerPokemon.turnData.hitCount).toBe(2);
  });

  it("should enhance multi-target moves", async () => {
    game.override.battleStyle("double").moveset([MoveId.SWIFT, MoveId.SPLASH]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);

    const [magikarp] = game.scene.getPlayerField();

    game.move.select(MoveId.SWIFT, 0);
    game.move.select(MoveId.SPLASH, 1);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to("MoveEndPhase");

    expect(magikarp.turnData.hitCount).toBe(2);
  });

  it("should enhance fixed-damage moves while also applying damage reduction", async () => {
    game.override.startingHeldItems([{ name: "MULTI_LENS", count: 1 }]).moveset(MoveId.SEISMIC_TOSS);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();
    const spy = vi.spyOn(enemyPokemon, "getAttackDamage");

    game.move.select(MoveId.SEISMIC_TOSS);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("MoveEndPhase");
    const damageResults = spy.mock.results.map(result => result.value?.damage);

    expect(damageResults).toHaveLength(2);
    expect(damageResults[0]).toBe(Math.floor(playerPokemon.level * 0.75));
    expect(damageResults[1]).toBe(Math.floor(playerPokemon.level * 0.25));
  });

  it("should result in correct damage for hp% attacks with 1 lens", async () => {
    game.override
      .startingHeldItems([{ name: "MULTI_LENS", count: 1 }])
      .moveset(MoveId.SUPER_FANG)
      .ability(AbilityId.COMPOUND_EYES)
      .enemyLevel(1000)
      .enemySpecies(SpeciesId.BLISSEY); // allows for unrealistically high levels of accuracy

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.SUPER_FANG);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEndPhase");
    expect(enemyPokemon.getHpRatio()).toBeCloseTo(0.5, 5);
  });

  it("should result in correct damage for hp% attacks with 2 lenses", async () => {
    game.override
      .startingHeldItems([{ name: "MULTI_LENS", count: 2 }])
      .moveset(MoveId.SUPER_FANG)
      .ability(AbilityId.COMPOUND_EYES)
      .enemyMoveset(MoveId.SPLASH)
      .enemyLevel(1000)
      .enemySpecies(SpeciesId.BLISSEY); // allows for unrealistically high levels of accuracy

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.SUPER_FANG);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEndPhase");
    expect(enemyPokemon.getHpRatio()).toBeCloseTo(0.5, 5);
  });

  it("should result in correct damage for hp% attacks with 2 lenses + Parental Bond", async () => {
    game.override
      .startingHeldItems([{ name: "MULTI_LENS", count: 2 }])
      .moveset(MoveId.SUPER_FANG)
      .ability(AbilityId.PARENTAL_BOND)
      .passiveAbility(AbilityId.COMPOUND_EYES)
      .enemyMoveset(MoveId.SPLASH)
      .enemyLevel(1000)
      .enemySpecies(SpeciesId.BLISSEY); // allows for unrealistically high levels of accuracy

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.SUPER_FANG);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEndPhase");
    expect(enemyPokemon.getHpRatio()).toBeCloseTo(0.25, 5);
  });

  it("should not allow Future Sight to hit infinitely many times if the user switches out", async () => {
    game.override.enemyLevel(1000);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.CHARMANDER, SpeciesId.SQUIRTLE]);

    const enemyPokemon = game.field.getEnemyPokemon();
    vi.spyOn(enemyPokemon, "damageAndUpdate");

    game.move.select(MoveId.FUTURE_SIGHT);
    await game.toNextTurn();

    game.doSwitchPokemon(1);
    await game.toNextTurn();

    game.doSwitchPokemon(2);
    await game.toNextTurn();

    // TODO: Update hit count to 1 once Future Sight is fixed to not activate held items if user is off the field
    expect(enemyPokemon.damageAndUpdate).toHaveBeenCalledTimes(2);
  });
});
