import { BattlerIndex } from "#app/battle";
import { Stat } from "#enums/stat";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
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
      .moveset([ Moves.TACKLE, Moves.TRAILBLAZE, Moves.TACHYON_CUTTER ])
      .ability(Abilities.BALL_FETCH)
      .startingHeldItems([{ name: "MULTI_LENS" }])
      .battleType("single")
      .disableCrits()
      .enemySpecies(Species.SNORLAX)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it.each([
    { stackCount: 1, firstHitDamage: 0.75 },
    { stackCount: 2, firstHitDamage: 0.50 }
  ])("$stackCount count: should deal {$firstHitDamage}x damage on the first hit, then hit $stackCount times for 0.25x",
    async ({ stackCount, firstHitDamage }) => {
      game.override.startingHeldItems([{ name: "MULTI_LENS", count: stackCount }]);

      await game.classicMode.startBattle([ Species.MAGIKARP ]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;
      const spy = vi.spyOn(enemyPokemon, "getAttackDamage");
      vi.spyOn(enemyPokemon, "getBaseDamage").mockReturnValue(100);

      game.move.select(Moves.TACKLE);
      await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);

      await game.phaseInterceptor.to("MoveEndPhase");
      const damageResults = spy.mock.results.map(result => result.value?.damage);

      expect(damageResults).toHaveLength(1 + stackCount);
      expect(damageResults[0]).toBe(firstHitDamage * 100);
      damageResults.slice(1).forEach(dmg => expect(dmg).toBe(25));
    });

  it("should stack additively with Parental Bond", async () => {
    game.override.ability(Abilities.PARENTAL_BOND);

    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    const playerPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.TACKLE);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(playerPokemon.turnData.hitCount).toBe(3);
  });

  it("should apply secondary effects on each hit", async () => {
    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    const playerPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.TRAILBLAZE);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(playerPokemon.getStatStage(Stat.SPD)).toBe(2);
  });

  it("should not enhance multi-hit moves", async () => {
    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    const playerPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.TACHYON_CUTTER);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(playerPokemon.turnData.hitCount).toBe(2);
  });

  it("should enhance multi-target moves", async () => {
    game.override
      .battleType("double")
      .moveset([ Moves.SWIFT, Moves.SPLASH ]);

    await game.classicMode.startBattle([ Species.MAGIKARP, Species.FEEBAS ]);

    const [ magikarp, ] = game.scene.getPlayerField();

    game.move.select(Moves.SWIFT, 0);
    game.move.select(Moves.SPLASH, 1);

    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2 ]);

    await game.phaseInterceptor.to("MoveEndPhase");

    expect(magikarp.turnData.hitCount).toBe(2);
  });
});
