import { BattlerIndex } from "#app/battle";
import { allMoves } from "#app/data/moves/move";
import { PokemonType } from "#enums/pokemon-type";
import { Abilities } from "#app/enums/abilities";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { TYPE_BOOST_ITEM_BOOST_PERCENT } from "#app/constants";
import { allAbilities } from "#app/data/data-lists";
import { MoveTypeChangeAbAttr } from "#app/data/abilities/ability";
import { toDmgValue } from "#app/utils/common";

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
  { ab: Abilities.GALVANIZE, ab_name: "Galvanize", ty: PokemonType.ELECTRIC, tyName: "electric" },
  { ab: Abilities.PIXILATE, ab_name: "Pixilate", ty: PokemonType.FAIRY, tyName: "fairy" },
  { ab: Abilities.REFRIGERATE, ab_name: "Refrigerate", ty: PokemonType.ICE, tyName: "ice" },
  { ab: Abilities.AERILATE, ab_name: "Aerilate", ty: PokemonType.FLYING, tyName: "flying" },
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
      .starterSpecies(Species.MAGIKARP)
      .ability(ab)
      .moveset([Moves.TACKLE, Moves.REVELATION_DANCE, Moves.FURY_SWIPES])
      .enemySpecies(Species.DUSCLOPS)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH)
      .enemyLevel(100);
  });

  it(`should change Normal-type attacks to ${tyName} type and boost their power`, async () => {
    await game.classicMode.startBattle();

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const typeSpy = vi.spyOn(playerPokemon, "getMoveType");

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const enemySpy = vi.spyOn(enemyPokemon, "getMoveEffectiveness");
    const powerSpy = vi.spyOn(allMoves[Moves.TACKLE], "calculateBattlePower");

    game.move.select(Moves.TACKLE);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(typeSpy).toHaveLastReturnedWith(ty);
    expect(enemySpy).toHaveReturnedWith(1);
    expect(powerSpy).toHaveReturnedWith(48);
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
  });

  // Galvanize specifically would like to check for volt absorb's activation
  if (ab === Abilities.GALVANIZE) {
    it("should cause Normal-type attacks to activate Volt Absorb", async () => {
      game.override.enemyAbility(Abilities.VOLT_ABSORB);

      await game.classicMode.startBattle();

      const playerPokemon = game.scene.getPlayerPokemon()!;
      const tySpy = vi.spyOn(playerPokemon, "getMoveType");

      const enemyPokemon = game.scene.getEnemyPokemon()!;
      const enemyEffectivenessSpy = vi.spyOn(enemyPokemon, "getMoveEffectiveness");

      enemyPokemon.hp = Math.floor(enemyPokemon.getMaxHp() * 0.8);

      game.move.select(Moves.TACKLE);

      await game.phaseInterceptor.to("BerryPhase", false);

      expect(tySpy).toHaveLastReturnedWith(PokemonType.ELECTRIC);
      expect(enemyEffectivenessSpy).toHaveReturnedWith(0);
      expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    });
  }

  it.each([
    { moveName: "Revelation Dance", move: Moves.REVELATION_DANCE, expected_ty: PokemonType.WATER },
    { moveName: "Judgement", move: Moves.JUDGMENT, expected_ty: PokemonType.NORMAL },
    { moveName: "Terrain Pulse", move: Moves.TERRAIN_PULSE, expected_ty: PokemonType.NORMAL },
    { moveName: "Weather Ball", move: Moves.WEATHER_BALL, expected_ty: PokemonType.NORMAL },
    { moveName: "Multi Attack", move: Moves.MULTI_ATTACK, expected_ty: PokemonType.NORMAL },
    { moveName: "Techno Blast", move: Moves.TECHNO_BLAST, expected_ty: PokemonType.NORMAL },
  ])("should not change the type of $moveName", async ({ move, expected_ty: expectedTy }) => {
    game.override
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .moveset([move])
      .starterSpecies(Species.MAGIKARP);

    await game.classicMode.startBattle([Species.MAGIKARP]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const tySpy = vi.spyOn(playerPokemon, "getMoveType");

    game.move.select(move);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(tySpy).toHaveLastReturnedWith(expectedTy);
  });

  it("should affect all hits of a Normal-type multi-hit move", async () => {
    await game.classicMode.startBattle();

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const tySpy = vi.spyOn(playerPokemon, "getMoveType");

    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.FURY_SWIPES);
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

    const testMoveInstance = allMoves[Moves.TACKLE];

    // get the power boost from the ability so we can compare it to the item
    // @ts-expect-error power multiplier is private
    const boost = allAbilities[ab]?.getAttrs(MoveTypeChangeAbAttr)[0]?.powerMultiplier;
    expect(boost, "power boost should be defined").toBeDefined();

    const powerSpy = vi.spyOn(testMoveInstance, "calculateBattlePower");
    const typeSpy = vi.spyOn(game.scene.getPlayerPokemon()!, "getMoveType");
    game.move.select(Moves.TACKLE);
    await game.phaseInterceptor.to("BerryPhase", false);
    expect(typeSpy, "type was not changed").toHaveLastReturnedWith(ty);
    expect(powerSpy).toHaveLastReturnedWith(toDmgValue(testMoveInstance.power * boost));
  });

  it("should be affected by the type boosting item after changing the move's type", async () => {
    game.override.startingHeldItems([{ name: "ATTACK_TYPE_BOOSTER", count: 1, type: ty }]);
    await game.classicMode.startBattle();

    // get the power boost from the ability so we can compare it to the item
    // @ts-expect-error power multiplier is private
    const boost = allAbilities[ab]?.getAttrs(MoveTypeChangeAbAttr)[0]?.powerMultiplier;
    expect(boost, "power boost should be defined").toBeDefined();

    const tackle = allMoves[Moves.TACKLE];

    const spy = vi.spyOn(tackle, "calculateBattlePower");
    game.move.select(Moves.TACKLE);
    await game.phaseInterceptor.to("BerryPhase", false);
    expect(spy).toHaveLastReturnedWith(toDmgValue(tackle.power * boost * (1 + TYPE_BOOST_ITEM_BOOST_PERCENT / 100)));
  });
});
