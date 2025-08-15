import { TYPE_BOOST_ITEM_BOOST_PERCENT } from "#app/constants";
import { allAbilities, allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import { toDmgValue } from "#utils/common";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for abilities that change the type of normal moves to
 * a different type and boost their power
 *
 * Includes
 * - Aerialate
 * - Galvanize
 * - Pixilate
 * - Refrigerate
 */

describe.each([
  { ab: AbilityId.GALVANIZE, ab_name: "Galvanize", ty: PokemonType.ELECTRIC, tyName: "electric" },
  { ab: AbilityId.PIXILATE, ab_name: "Pixilate", ty: PokemonType.FAIRY, tyName: "fairy" },
  { ab: AbilityId.REFRIGERATE, ab_name: "Refrigerate", ty: PokemonType.ICE, tyName: "ice" },
  { ab: AbilityId.AERILATE, ab_name: "Aerilate", ty: PokemonType.FLYING, tyName: "flying" },
])("Abilities - $ab_name", ({ ab, ty, tyName }) => {
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
      .battleStyle("single")
      .startingLevel(100)
      .starterSpecies(SpeciesId.MAGIKARP)
      .ability(ab)
      .moveset([MoveId.TACKLE, MoveId.REVELATION_DANCE, MoveId.FURY_SWIPES, MoveId.CRUSH_GRIP])
      .enemySpecies(SpeciesId.DUSCLOPS)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .enemyLevel(100);
  });

  it(`should change Normal-type attacks to ${tyName} type and boost their power`, async () => {
    await game.classicMode.startBattle();

    const playerPokemon = game.field.getPlayerPokemon();
    const typeSpy = vi.spyOn(playerPokemon, "getMoveType");

    const enemyPokemon = game.field.getEnemyPokemon();
    const enemySpy = vi.spyOn(enemyPokemon, "getMoveEffectiveness");
    const powerSpy = vi.spyOn(allMoves[MoveId.TACKLE], "calculateBattlePower");

    game.move.select(MoveId.TACKLE);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(typeSpy).toHaveLastReturnedWith(ty);
    expect(enemySpy).toHaveReturnedWith(1);
    expect(powerSpy).toHaveReturnedWith(48);
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
  });

  // Regression test to ensure proper ordering of effects
  it("should still boost variable-power moves", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const playerPokemon = game.field.getPlayerPokemon();
    const typeSpy = vi.spyOn(playerPokemon, "getMoveType");

    const enemyPokemon = game.field.getEnemyPokemon();
    const enemySpy = vi.spyOn(enemyPokemon, "getMoveEffectiveness");
    const powerSpy = vi.spyOn(allMoves[MoveId.CRUSH_GRIP], "calculateBattlePower");

    game.move.select(MoveId.CRUSH_GRIP);

    await game.toEndOfTurn();

    expect(typeSpy).toHaveLastReturnedWith(ty);
    expect(enemySpy).toHaveReturnedWith(1);
    expect(powerSpy).toHaveReturnedWith(144); // 120 * 1.2
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
  });

  // Galvanize specifically would like to check for volt absorb's activation
  if (ab === AbilityId.GALVANIZE) {
    it("should cause Normal-type attacks to activate Volt Absorb", async () => {
      game.override.enemyAbility(AbilityId.VOLT_ABSORB);

      await game.classicMode.startBattle();

      const playerPokemon = game.field.getPlayerPokemon();
      const tySpy = vi.spyOn(playerPokemon, "getMoveType");

      const enemyPokemon = game.field.getEnemyPokemon();
      const enemyEffectivenessSpy = vi.spyOn(enemyPokemon, "getMoveEffectiveness");

      enemyPokemon.hp = Math.floor(enemyPokemon.getMaxHp() * 0.8);

      game.move.select(MoveId.TACKLE);

      await game.phaseInterceptor.to("BerryPhase", false);

      expect(tySpy).toHaveLastReturnedWith(PokemonType.ELECTRIC);
      expect(enemyEffectivenessSpy).toHaveReturnedWith(0);
      expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    });
  }

  it.each([
    { moveName: "Revelation Dance", move: MoveId.REVELATION_DANCE, expected_ty: PokemonType.WATER },
    { moveName: "Judgement", move: MoveId.JUDGMENT, expected_ty: PokemonType.NORMAL },
    { moveName: "Terrain Pulse", move: MoveId.TERRAIN_PULSE, expected_ty: PokemonType.NORMAL },
    { moveName: "Weather Ball", move: MoveId.WEATHER_BALL, expected_ty: PokemonType.NORMAL },
    { moveName: "Multi Attack", move: MoveId.MULTI_ATTACK, expected_ty: PokemonType.NORMAL },
    { moveName: "Techno Blast", move: MoveId.TECHNO_BLAST, expected_ty: PokemonType.NORMAL },
  ])("should not change the type of $moveName", async ({ move, expected_ty: expectedTy }) => {
    game.override
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .moveset([move])
      .starterSpecies(SpeciesId.MAGIKARP);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const playerPokemon = game.field.getPlayerPokemon();
    const tySpy = vi.spyOn(playerPokemon, "getMoveType");

    game.move.select(move);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(tySpy).toHaveLastReturnedWith(expectedTy);
  });

  it("should affect all hits of a Normal-type multi-hit move", async () => {
    await game.classicMode.startBattle();

    const playerPokemon = game.field.getPlayerPokemon();
    const tySpy = vi.spyOn(playerPokemon, "getMoveType");

    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.FURY_SWIPES);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceHit();

    await game.phaseInterceptor.to("MoveEffectPhase");
    expect(playerPokemon.turnData.hitCount).toBeGreaterThan(1);
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());

    while (playerPokemon.turnData.hitsLeft > 0) {
      const enemyStartingHp = enemyPokemon.hp;
      await game.phaseInterceptor.to("MoveEffectPhase");

      expect(tySpy).toHaveLastReturnedWith(ty);
      expect(enemyPokemon.hp).toBeLessThan(enemyStartingHp);
    }
  });

  it("should not be affected by silk scarf after changing the move's type", async () => {
    game.override.startingHeldItems([{ name: "ATTACK_TYPE_BOOSTER", count: 1, type: PokemonType.NORMAL }]);
    await game.classicMode.startBattle();

    const testMoveInstance = allMoves[MoveId.TACKLE];

    // get the power boost from the ability so we can compare it to the item
    // @ts-expect-error power multiplier is private
    const boost = allAbilities[ab]?.getAttrs("MoveTypeChangeAbAttr")[0]?.powerMultiplier;
    expect(boost, "power boost should be defined").toBeDefined();

    const powerSpy = vi.spyOn(testMoveInstance, "calculateBattlePower");
    const typeSpy = vi.spyOn(game.field.getPlayerPokemon(), "getMoveType");
    game.move.select(MoveId.TACKLE);
    await game.phaseInterceptor.to("BerryPhase", false);
    expect(typeSpy, "type was not changed").toHaveLastReturnedWith(ty);
    expect(powerSpy).toHaveLastReturnedWith(toDmgValue(testMoveInstance.power * boost));
  });

  it("should be affected by the type boosting item after changing the move's type", async () => {
    game.override.startingHeldItems([{ name: "ATTACK_TYPE_BOOSTER", count: 1, type: ty }]);
    await game.classicMode.startBattle();

    // get the power boost from the ability so we can compare it to the item
    // @ts-expect-error power multiplier is private
    const boost = allAbilities[ab]?.getAttrs("MoveTypeChangeAbAttr")[0]?.powerMultiplier;
    expect(boost, "power boost should be defined").toBeDefined();

    const tackle = allMoves[MoveId.TACKLE];

    const spy = vi.spyOn(tackle, "calculateBattlePower");
    game.move.select(MoveId.TACKLE);
    await game.phaseInterceptor.to("BerryPhase", false);
    expect(spy).toHaveLastReturnedWith(toDmgValue(tackle.power * boost * (1 + TYPE_BOOST_ITEM_BOOST_PERCENT / 100)));
  });
});
