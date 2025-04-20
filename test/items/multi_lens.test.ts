import { BattlerIndex } from "#app/battle";
import { Stat } from "#enums/stat";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
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
      .moveset([Moves.TACKLE, Moves.TRAILBLAZE, Moves.TACHYON_CUTTER, Moves.FUTURE_SIGHT])
      .ability(Abilities.BALL_FETCH)
      .startingHeldItems([{ name: "MULTI_LENS" }])
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.SNORLAX)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH)
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

      await game.classicMode.startBattle([Species.MAGIKARP]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;
      const spy = vi.spyOn(enemyPokemon, "getAttackDamage");
      vi.spyOn(enemyPokemon, "getBaseDamage").mockReturnValue(100);

      game.move.select(Moves.TACKLE);
      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

      await game.phaseInterceptor.to("MoveEndPhase");
      const damageResults = spy.mock.results.map(result => result.value?.damage);

      expect(damageResults).toHaveLength(1 + stackCount);
      expect(damageResults[0]).toBe(firstHitDamage * 100);
      damageResults.slice(1).forEach(dmg => expect(dmg).toBe(25));
    },
  );

  it("should stack additively with Parental Bond", async () => {
    game.override.ability(Abilities.PARENTAL_BOND);

    await game.classicMode.startBattle([Species.MAGIKARP]);

    const playerPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.TACKLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(playerPokemon.turnData.hitCount).toBe(3);
  });

  it("should apply secondary effects on each hit", async () => {
    await game.classicMode.startBattle([Species.MAGIKARP]);

    const playerPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.TRAILBLAZE);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(playerPokemon.getStatStage(Stat.SPD)).toBe(2);
  });

  it("should not enhance multi-hit moves", async () => {
    await game.classicMode.startBattle([Species.MAGIKARP]);

    const playerPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.TACHYON_CUTTER);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(playerPokemon.turnData.hitCount).toBe(2);
  });

  it("should enhance multi-target moves", async () => {
    game.override.battleStyle("double").moveset([Moves.SWIFT, Moves.SPLASH]);

    await game.classicMode.startBattle([Species.MAGIKARP, Species.FEEBAS]);

    const [magikarp] = game.scene.getPlayerField();

    game.move.select(Moves.SWIFT, 0);
    game.move.select(Moves.SPLASH, 1);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to("MoveEndPhase");

    expect(magikarp.turnData.hitCount).toBe(2);
  });

  it("should enhance fixed-damage moves while also applying damage reduction", async () => {
    game.override.startingHeldItems([{ name: "MULTI_LENS", count: 1 }]).moveset(Moves.SEISMIC_TOSS);

    await game.classicMode.startBattle([Species.MAGIKARP]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const spy = vi.spyOn(enemyPokemon, "getAttackDamage");

    game.move.select(Moves.SEISMIC_TOSS);
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
      .moveset(Moves.SUPER_FANG)
      .ability(Abilities.COMPOUND_EYES)
      .enemyLevel(1000)
      .enemySpecies(Species.BLISSEY); // allows for unrealistically high levels of accuracy

    await game.classicMode.startBattle([Species.MAGIKARP]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.SUPER_FANG);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEndPhase");
    expect(enemyPokemon.getHpRatio()).toBeCloseTo(0.5, 5);
  });

  it("should result in correct damage for hp% attacks with 2 lenses", async () => {
    game.override
      .startingHeldItems([{ name: "MULTI_LENS", count: 2 }])
      .moveset(Moves.SUPER_FANG)
      .ability(Abilities.COMPOUND_EYES)
      .enemyMoveset(Moves.SPLASH)
      .enemyLevel(1000)
      .enemySpecies(Species.BLISSEY); // allows for unrealistically high levels of accuracy

    await game.classicMode.startBattle([Species.MAGIKARP]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.SUPER_FANG);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEndPhase");
    expect(enemyPokemon.getHpRatio()).toBeCloseTo(0.5, 5);
  });

  it("should result in correct damage for hp% attacks with 2 lenses + Parental Bond", async () => {
    game.override
      .startingHeldItems([{ name: "MULTI_LENS", count: 2 }])
      .moveset(Moves.SUPER_FANG)
      .ability(Abilities.PARENTAL_BOND)
      .passiveAbility(Abilities.COMPOUND_EYES)
      .enemyMoveset(Moves.SPLASH)
      .enemyLevel(1000)
      .enemySpecies(Species.BLISSEY); // allows for unrealistically high levels of accuracy

    await game.classicMode.startBattle([Species.MAGIKARP]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.SUPER_FANG);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEndPhase");
    expect(enemyPokemon.getHpRatio()).toBeCloseTo(0.25, 5);
  });

  it("should not allow Future Sight to hit infinitely many times if the user switches out", async () => {
    game.override.enemyLevel(1000);
    await game.classicMode.startBattle([Species.BULBASAUR, Species.CHARMANDER, Species.SQUIRTLE]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    vi.spyOn(enemyPokemon, "damageAndUpdate");

    game.move.select(Moves.FUTURE_SIGHT);
    await game.toNextTurn();

    game.doSwitchPokemon(1);
    await game.toNextTurn();

    game.doSwitchPokemon(2);
    await game.toNextTurn();

    // TODO: Update hit count to 1 once Future Sight is fixed to not activate held items if user is off the field
    expect(enemyPokemon.damageAndUpdate).toHaveBeenCalledTimes(2);
  });

  it("should not allow Pollen Puff to heal ally more than once", async () => {
    game.override.battleStyle("double").moveset([Moves.POLLEN_PUFF, Moves.ENDURE]);
    await game.classicMode.startBattle([Species.BULBASAUR, Species.OMANYTE]);

    const [, rightPokemon] = game.scene.getPlayerField();

    rightPokemon.damageAndUpdate(rightPokemon.hp - 1);

    game.move.select(Moves.POLLEN_PUFF, 0, BattlerIndex.PLAYER_2);
    game.move.select(Moves.ENDURE, 1);

    await game.toNextTurn();

    // Pollen Puff heals with a ratio of 0.5, as long as Pollen Puff triggers only once the pokemon will always be <= (0.5 * Max HP) + 1
    expect(rightPokemon.hp).toBeLessThanOrEqual(0.5 * rightPokemon.getMaxHp() + 1);
  });
});
