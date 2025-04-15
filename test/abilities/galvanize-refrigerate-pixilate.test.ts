import { BattlerIndex } from "#app/battle";
import { allMoves } from "#app/data/moves/move";
import { PokemonType } from "#enums/pokemon-type";
import { Abilities } from "#app/enums/abilities";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import { HitResult } from "#app/field/pokemon";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for abilities that change the type of normal moves to
 * a different type and boost their power
 *
 * Includes
 * - Galvanize
 * - Pixilate
 * - Refrigerate
 */

describe.each([
  { ab: Abilities.GALVANIZE, ab_name: "Galvanize", ty: PokemonType.ELECTRIC, ty_name: "electric" },
  { ab: Abilities.PIXILATE, ab_name: "Pixilate", ty: PokemonType.FAIRY, ty_name: "fairy" },
  { ab: Abilities.REFRIGERATE, ab_name: "Refrigerate", ty: PokemonType.ICE, ty_name: "ice" },
])("Abilities - $ab_name", ({ ab, ty, ty_name }) => {
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
      .ability(ab)
      .moveset([Moves.TACKLE, Moves.REVELATION_DANCE, Moves.FURY_SWIPES])
      .enemySpecies(Species.DUSCLOPS)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH)
      .enemyLevel(100);
  });

  it(`should change Normal-type attacks to ${ty_name} type and boost their power`, async () => {
    await game.classicMode.startBattle();

    const playerPokemon = game.scene.getPlayerPokemon()!;
    vi.spyOn(playerPokemon, "getMoveType");

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    vi.spyOn(enemyPokemon, "apply");

    const move = allMoves[Moves.TACKLE];
    vi.spyOn(move, "calculateBattlePower");

    game.move.select(Moves.TACKLE);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(playerPokemon.getMoveType).toHaveLastReturnedWith(ty);
    expect(enemyPokemon.apply).toHaveReturnedWith(HitResult.EFFECTIVE);
    expect(move.calculateBattlePower).toHaveReturnedWith(48);
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
  });

  // Galvanize specifically would like to check for volt absorb's activation
  if (ab === Abilities.GALVANIZE) {
    it("should cause Normal-type attacks to activate Volt Absorb", async () => {
      game.override.enemyAbility(Abilities.VOLT_ABSORB);

      await game.classicMode.startBattle();

      const playerPokemon = game.scene.getPlayerPokemon()!;
      vi.spyOn(playerPokemon, "getMoveType");

      const enemyPokemon = game.scene.getEnemyPokemon()!;
      vi.spyOn(enemyPokemon, "apply");

      enemyPokemon.hp = Math.floor(enemyPokemon.getMaxHp() * 0.8);

      game.move.select(Moves.TACKLE);

      await game.phaseInterceptor.to("BerryPhase", false);

      expect(playerPokemon.getMoveType).toHaveLastReturnedWith(PokemonType.ELECTRIC);
      expect(enemyPokemon.apply).toHaveReturnedWith(HitResult.NO_EFFECT);
      expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    });
  }

  it.each([
    { moveName: "Revelation Dance", move: Moves.REVELATION_DANCE, expected_ty: PokemonType.WATER },
    { moveName: "Judgement", move: Moves.JUDGMENT, expected_ty: PokemonType.NORMAL },
    { moveName: "Terrain Pulse", move: Moves.TERRAIN_PULSE, expected_ty: PokemonType.NORMAL },
    { moveName: "Weather Ball", move: Moves.WEATHER_BALL, expected_ty: PokemonType.NORMAL },
    { moveName: "Multi Attack", move: Moves.MULTI_ATTACK, expected_ty: PokemonType.NORMAL },
  ])("should not change the type of $moveName", async ({ move, expected_ty }) => {
    game.override
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .moveset([move])
      .starterSpecies(Species.MAGIKARP);

    await game.classicMode.startBattle([Species.MAGIKARP]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const ty_spy = vi.spyOn(playerPokemon, "getMoveType");

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const enemy_spy = vi.spyOn(enemyPokemon, "apply");

    game.move.select(move);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(playerPokemon.getMoveType).toHaveLastReturnedWith(expected_ty);

    ty_spy.mockRestore();
    enemy_spy.mockRestore();
  });

  it("should affect all hits of a Normal-type multi-hit move", async () => {
    await game.classicMode.startBattle();

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const tySpy = vi.spyOn(playerPokemon, "getMoveType");

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const enemySpy = vi.spyOn(enemyPokemon, "apply");

    game.move.select(Moves.FURY_SWIPES);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceHit();

    await game.phaseInterceptor.to("MoveEffectPhase");
    expect(playerPokemon.turnData.hitCount).toBeGreaterThan(1);
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());

    while (playerPokemon.turnData.hitsLeft > 0) {
      const enemyStartingHp = enemyPokemon.hp;
      await game.phaseInterceptor.to("MoveEffectPhase");

      expect(playerPokemon.getMoveType).toHaveLastReturnedWith(ty);
      expect(enemyPokemon.hp).toBeLessThan(enemyStartingHp);
    }
    tySpy.mockRestore();
    enemySpy.mockRestore();
  });
});
