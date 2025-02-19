import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Phaser from "phaser";
import GameManager from "#test/utils/gameManager";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { BerryPhase } from "#app/phases/berry-phase";
import { MoveResult, PokemonMove } from "#app/field/pokemon";
import { Type } from "#enums/type";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { StatusEffect } from "#enums/status-effect";
import { BattlerIndex } from "#app/battle";

describe("Moves - Powder", () => {
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
    game.override.battleType("single");

    game.override
      .enemySpecies(Species.SNORLAX)
      .enemyLevel(100)
      .enemyMoveset(Moves.EMBER)
      .enemyAbility(Abilities.INSOMNIA)
      .startingLevel(100)
      .moveset([ Moves.POWDER, Moves.SPLASH, Moves.FIERY_DANCE, Moves.ROAR ]);
  });

  it(
    "should cancel the target's Fire-type move, damage the target, and still consume the target's PP",
    async () => {
      // Cannot use enemy moveset override for this test, since it interferes with checking PP
      game.override.enemyMoveset([]);
      await game.classicMode.startBattle([ Species.CHARIZARD ]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;
      enemyPokemon.moveset = [ new PokemonMove(Moves.EMBER) ];

      game.move.select(Moves.POWDER);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
      expect(enemyPokemon.hp).toBe(Math.ceil(3 * enemyPokemon.getMaxHp() / 4));
      expect(enemyPokemon.moveset[0]!.ppUsed).toBe(1);

      await game.toNextTurn();

      game.move.select(Moves.SPLASH);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
      expect(enemyPokemon.hp).toBe(Math.ceil(3 * enemyPokemon.getMaxHp() / 4));
      expect(enemyPokemon.moveset[0]!.ppUsed).toBe(2);
    });

  it(
    "should have no effect against Grass-type Pokemon",
    async () => {
      game.override.enemySpecies(Species.AMOONGUSS);

      await game.classicMode.startBattle([ Species.CHARIZARD ]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.POWDER);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
      expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    });

  it(
    "should have no effect against Pokemon with Overcoat",
    async () => {
      game.override.enemyAbility(Abilities.OVERCOAT);

      await game.classicMode.startBattle([ Species.CHARIZARD ]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.POWDER);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
      expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    });

  it(
    "should not damage the target if the target has Magic Guard",
    async () => {
      game.override.enemyAbility(Abilities.MAGIC_GUARD);

      await game.classicMode.startBattle([ Species.CHARIZARD ]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.POWDER);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
      expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    });

  it(
    "should not damage the target if Primordial Sea is active",
    async () => {
      game.override.enemyAbility(Abilities.PRIMORDIAL_SEA);

      await game.classicMode.startBattle([ Species.CHARIZARD ]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.POWDER);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
      expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    });

  it(
    "should not prevent the target from thawing out with Flame Wheel",
    async () => {
      game.override
        .enemyMoveset(Array(4).fill(Moves.FLAME_WHEEL))
        .enemyStatusEffect(StatusEffect.FREEZE);

      await game.classicMode.startBattle([ Species.CHARIZARD ]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.POWDER);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.status?.effect).not.toBe(StatusEffect.FREEZE);
      expect(enemyPokemon.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
      expect(enemyPokemon.hp).toBe(Math.ceil(3 * enemyPokemon.getMaxHp() / 4));
    }
  );

  it(
    "should not allow a target with Protean to change to Fire type",
    async () => {
      game.override.enemyAbility(Abilities.PROTEAN);

      await game.classicMode.startBattle([ Species.CHARIZARD ]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.POWDER);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
      expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
      expect(enemyPokemon.summonData?.types).not.toBe(Type.FIRE);
    });

  it(
    "should cancel Fire-type moves generated by the target's Dancer ability",
    async () => {
      game.override
        .battleType("double")
        .enemySpecies(Species.BLASTOISE)
        .enemyAbility(Abilities.DANCER);

      await game.classicMode.startBattle([ Species.CHARIZARD, Species.CHARIZARD ]);

      const playerPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      // Turn 1: Roar away 1 opponent
      game.move.select(Moves.ROAR, 0, BattlerIndex.ENEMY_2);
      game.move.select(Moves.SPLASH, 1);
      await game.toNextTurn();
      await game.toNextTurn(); // Requires game.toNextTurn() twice due to double battle

      // Turn 2: Enemy should activate Powder twice: From using Ember, and from copying Fiery Dance via Dancer
      playerPokemon.hp = playerPokemon.getMaxHp();
      game.move.select(Moves.FIERY_DANCE, 0, BattlerIndex.ENEMY);
      game.move.select(Moves.POWDER, 1, BattlerIndex.ENEMY);

      await game.phaseInterceptor.to(MoveEffectPhase);
      const enemyStartingHp = enemyPokemon.hp;

      await game.phaseInterceptor.to(BerryPhase, false);


      // player should not take damage
      expect(enemyPokemon.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
      expect(playerPokemon.hp).toBe(playerPokemon.getMaxHp());
      // enemy should have taken damage from player's Fiery Dance + 2 Powder procs
      expect(enemyPokemon.hp).toBe(enemyStartingHp - playerPokemon.turnData.totalDamageDealt - 2 * Math.floor(enemyPokemon.getMaxHp() / 4));
    });

  it(
    "should cancel Fiery Dance, then prevent it from triggering Dancer",
    async () => {
      game.override.ability(Abilities.DANCER)
        .enemyMoveset(Moves.FIERY_DANCE);

      await game.classicMode.startBattle([ Species.CHARIZARD ]);

      const playerPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.POWDER);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
      expect(enemyPokemon.hp).toBe(Math.ceil(3 * enemyPokemon.getMaxHp() / 4));
      expect(playerPokemon.getLastXMoves()[0].move).toBe(Moves.POWDER);
    });

  it(
    "should cancel Revelation Dance if it becomes a Fire-type move",
    async () => {
      game.override
        .enemySpecies(Species.CHARIZARD)
        .enemyMoveset(Array(4).fill(Moves.REVELATION_DANCE));

      await game.classicMode.startBattle([ Species.CHARIZARD ]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.POWDER);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
      expect(enemyPokemon.hp).toBe(Math.ceil(3 * enemyPokemon.getMaxHp() / 4));
    });

  it(
    "should cancel Shell Trap and damage the target, even if the move would fail",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.SHELL_TRAP));

      await game.classicMode.startBattle([ Species.CHARIZARD ]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.POWDER);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
      expect(enemyPokemon.hp).toBe(Math.ceil(3 * enemyPokemon.getMaxHp() / 4));
    });

  it(
    "should cancel Grass Pledge if used after ally's Fire Pledge",
    async () => {
      game.override.enemyMoveset([ Moves.FIRE_PLEDGE, Moves.GRASS_PLEDGE ])
        .battleType("double");

      await game.classicMode.startBattle([ Species.CHARIZARD, Species.CHARIZARD ]);
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.POWDER, 0, BattlerIndex.ENEMY);
      game.move.select(Moves.SPLASH, 1);
      await game.forceEnemyMove(Moves.GRASS_PLEDGE, BattlerIndex.PLAYER);
      await game.forceEnemyMove(Moves.FIRE_PLEDGE, BattlerIndex.PLAYER);
      await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2, BattlerIndex.ENEMY ]);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
      expect(enemyPokemon.hp).toBe(Math.ceil(3 * enemyPokemon.getMaxHp() / 4));
    });

  it(
    "should cancel Fire Pledge if used before ally's Water Pledge",
    async () => {
      game.override.enemyMoveset([ Moves.FIRE_PLEDGE, Moves.WATER_PLEDGE ])
        .battleType("double");

      await game.classicMode.startBattle([ Species.CHARIZARD, Species.CHARIZARD ]);
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.POWDER, 0, BattlerIndex.ENEMY);
      game.move.select(Moves.SPLASH, 1);
      await game.forceEnemyMove(Moves.FIRE_PLEDGE, BattlerIndex.PLAYER);
      await game.forceEnemyMove(Moves.WATER_PLEDGE, BattlerIndex.PLAYER);
      await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2 ]);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
      expect(enemyPokemon.hp).toBe(Math.ceil(3 * enemyPokemon.getMaxHp() / 4));
    });

  it(
    "should NOT cancel Fire Pledge if used after ally's Water Pledge",
    async () => {
      game.override.enemyMoveset([ Moves.FIRE_PLEDGE, Moves.WATER_PLEDGE ])
        .battleType("double");

      await game.classicMode.startBattle([ Species.CHARIZARD, Species.CHARIZARD ]);
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.POWDER, 0, BattlerIndex.ENEMY);
      game.move.select(Moves.SPLASH, 1);
      await game.forceEnemyMove(Moves.FIRE_PLEDGE, BattlerIndex.PLAYER);
      await game.forceEnemyMove(Moves.WATER_PLEDGE, BattlerIndex.PLAYER);
      await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2, BattlerIndex.ENEMY ]);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
      expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    });
});
