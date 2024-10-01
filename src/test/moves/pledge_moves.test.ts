import { BattlerIndex } from "#app/battle";
import { ArenaTagSide } from "#app/data/arena-tag";
import { allMoves, FlinchAttr } from "#app/data/move";
import { Type } from "#app/data/type";
import { ArenaTagType } from "#enums/arena-tag-type";
import { Stat } from "#enums/stat";
import { toDmgValue } from "#app/utils";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it, expect, vi } from "vitest";

describe("Moves - Pledge Moves", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .battleType("double")
      .startingLevel(100)
      .moveset([Moves.FIRE_PLEDGE, Moves.GRASS_PLEDGE, Moves.WATER_PLEDGE, Moves.SPLASH])
      .enemySpecies(Species.SNORLAX)
      .enemyLevel(100)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it(
    "Fire Pledge - should be an 80-power Fire-type attack outside of combination",
    async () => {
      await game.classicMode.startBattle([Species.BLASTOISE, Species.CHARIZARD]);

      const firePledge = allMoves[Moves.FIRE_PLEDGE];
      vi.spyOn(firePledge, "calculateBattlePower");

      const playerPokemon = game.scene.getPlayerField();
      vi.spyOn(playerPokemon[0], "getMoveType");

      game.move.select(Moves.FIRE_PLEDGE, 0, BattlerIndex.ENEMY);
      game.move.select(Moves.SPLASH, 1);

      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
      await game.phaseInterceptor.to("MoveEndPhase", false);

      expect(firePledge.calculateBattlePower).toHaveLastReturnedWith(80);
      expect(playerPokemon[0].getMoveType).toHaveLastReturnedWith(Type.FIRE);
    }
  );

  it(
    "Fire Pledge - should not combine with an ally using Fire Pledge",
    async () => {
      await game.classicMode.startBattle([Species.BLASTOISE, Species.CHARIZARD]);

      const firePledge = allMoves[Moves.FIRE_PLEDGE];
      vi.spyOn(firePledge, "calculateBattlePower");

      const playerPokemon = game.scene.getPlayerField();
      playerPokemon.forEach(p => vi.spyOn(p, "getMoveType"));

      const enemyPokemon = game.scene.getEnemyField();

      game.move.select(Moves.FIRE_PLEDGE, 0, BattlerIndex.ENEMY);
      game.move.select(Moves.FIRE_PLEDGE, 0, BattlerIndex.ENEMY_2);

      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

      await game.phaseInterceptor.to("MoveEndPhase");
      expect(firePledge.calculateBattlePower).toHaveLastReturnedWith(80);
      expect(playerPokemon[0].getMoveType).toHaveLastReturnedWith(Type.FIRE);

      await game.phaseInterceptor.to("BerryPhase", false);
      expect(firePledge.calculateBattlePower).toHaveLastReturnedWith(80);
      expect(playerPokemon[1].getMoveType).toHaveLastReturnedWith(Type.FIRE);

      enemyPokemon.forEach(p => expect(p.hp).toBeLessThan(p.getMaxHp()));
    }
  );

  it(
    "Fire Pledge - should not combine with an enemy's Pledge move",
    async () => {
      game.override
        .battleType("single")
        .enemyMoveset(Moves.GRASS_PLEDGE);

      await game.classicMode.startBattle([Species.CHARIZARD]);

      const playerPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.FIRE_PLEDGE);

      await game.toNextTurn();

      // Neither Pokemon should defer their move's effects as they would
      // if they combined moves, so both should be damaged.
      expect(playerPokemon.hp).toBeLessThan(playerPokemon.getMaxHp());
      expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
      expect(game.scene.arena.getTag(ArenaTagType.FIRE_GRASS_PLEDGE)).toBeUndefined();
    }
  );

  it(
    "Grass Pledge - should combine with Fire Pledge to form a 150-power Fire-type attack that creates a 'sea of fire'",
    async () => {
      await game.classicMode.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

      const grassPledge = allMoves[Moves.GRASS_PLEDGE];
      vi.spyOn(grassPledge, "calculateBattlePower");

      const playerPokemon = game.scene.getPlayerField();
      const enemyPokemon = game.scene.getEnemyField();

      vi.spyOn(playerPokemon[1], "getMoveType");
      const baseDmgMock = vi.spyOn(enemyPokemon[0], "getBaseDamage");

      game.move.select(Moves.FIRE_PLEDGE, 0, BattlerIndex.ENEMY_2);
      game.move.select(Moves.GRASS_PLEDGE, 1, BattlerIndex.ENEMY);

      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
      // advance to the end of PLAYER_2's move this turn
      for (let i = 0; i < 2; i++) {
        await game.phaseInterceptor.to("MoveEndPhase");
      }
      expect(playerPokemon[1].getMoveType).toHaveLastReturnedWith(Type.FIRE);
      expect(grassPledge.calculateBattlePower).toHaveLastReturnedWith(150);

      const baseDmg = baseDmgMock.mock.results[baseDmgMock.mock.results.length - 1].value;
      expect(enemyPokemon[0].getMaxHp() - enemyPokemon[0].hp).toBe(toDmgValue(baseDmg * 1.5));
      expect(enemyPokemon[1].hp).toBe(enemyPokemon[1].getMaxHp()); // PLAYER should not have attacked
      expect(game.scene.arena.getTagOnSide(ArenaTagType.FIRE_GRASS_PLEDGE, ArenaTagSide.ENEMY)).toBeDefined();

      const enemyStartingHp = enemyPokemon.map(p => p.hp);
      await game.toNextTurn();
      enemyPokemon.forEach((p, i) => expect(enemyStartingHp[i] - p.hp).toBe(toDmgValue(p.getMaxHp() / 8)));
    }
  );

  it(
    "Fire Pledge - should combine with Water Pledge to form a 150-power Water-type attack that creates a 'rainbow'",
    async () => {
      game.override.moveset([Moves.FIRE_PLEDGE, Moves.WATER_PLEDGE, Moves.FIERY_DANCE, Moves.SPLASH]);

      await game.classicMode.startBattle([Species.BLASTOISE, Species.VENUSAUR]);

      const firePledge = allMoves[Moves.FIRE_PLEDGE];
      vi.spyOn(firePledge, "calculateBattlePower");

      const playerPokemon = game.scene.getPlayerField();
      const enemyPokemon = game.scene.getEnemyField();

      vi.spyOn(playerPokemon[1], "getMoveType");

      game.move.select(Moves.WATER_PLEDGE, 0, BattlerIndex.ENEMY_2);
      game.move.select(Moves.FIRE_PLEDGE, 1, BattlerIndex.ENEMY);

      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
      // advance to the end of PLAYER_2's move this turn
      for (let i = 0; i < 2; i++) {
        await game.phaseInterceptor.to("MoveEndPhase");
      }
      expect(playerPokemon[1].getMoveType).toHaveLastReturnedWith(Type.WATER);
      expect(firePledge.calculateBattlePower).toHaveLastReturnedWith(150);
      expect(enemyPokemon[1].hp).toBe(enemyPokemon[1].getMaxHp()); // PLAYER should not have attacked
      expect(game.scene.arena.getTagOnSide(ArenaTagType.WATER_FIRE_PLEDGE, ArenaTagSide.PLAYER)).toBeDefined();

      await game.toNextTurn();

      game.move.select(Moves.FIERY_DANCE, 0, BattlerIndex.ENEMY_2);
      game.move.select(Moves.SPLASH, 1);
      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
      await game.phaseInterceptor.to("MoveEndPhase");

      // Rainbow effect should increase Fiery Dance's chance of raising Sp. Atk to 100%
      expect(playerPokemon[0].getStatStage(Stat.SPATK)).toBe(1);
    }
  );

  it(
    "Water Pledge - should combine with Grass Pledge to form a 150-power Grass-type attack that creates a 'swamp'",
    async () => {
      await game.classicMode.startBattle([Species.BLASTOISE, Species.CHARIZARD]);

      const waterPledge = allMoves[Moves.WATER_PLEDGE];
      vi.spyOn(waterPledge, "calculateBattlePower");

      const playerPokemon = game.scene.getPlayerField();
      const enemyPokemon = game.scene.getEnemyField();
      const enemyStartingSpd = enemyPokemon.map(p => p.getEffectiveStat(Stat.SPD));

      vi.spyOn(playerPokemon[1], "getMoveType");

      game.move.select(Moves.GRASS_PLEDGE, 0, BattlerIndex.ENEMY_2);
      game.move.select(Moves.WATER_PLEDGE, 1, BattlerIndex.ENEMY);

      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
      // advance to the end of PLAYER_2's move this turn
      for (let i = 0; i < 2; i++) {
        await game.phaseInterceptor.to("MoveEndPhase");
      }

      expect(playerPokemon[1].getMoveType).toHaveLastReturnedWith(Type.GRASS);
      expect(waterPledge.calculateBattlePower).toHaveLastReturnedWith(150);
      expect(enemyPokemon[1].hp).toBe(enemyPokemon[1].getMaxHp());

      expect(game.scene.arena.getTagOnSide(ArenaTagType.GRASS_WATER_PLEDGE, ArenaTagSide.ENEMY)).toBeDefined();
      enemyPokemon.forEach((p, i) => expect(p.getEffectiveStat(Stat.SPD)).toBe(Math.floor(enemyStartingSpd[i] / 4)));
    }
  );

  it(
    "Pledge Moves - should alter turn order when used in combination",
    async () => {
      await game.classicMode.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

      const enemyPokemon = game.scene.getEnemyField();

      game.move.select(Moves.WATER_PLEDGE, 0, BattlerIndex.ENEMY);
      game.move.select(Moves.FIRE_PLEDGE, 1, BattlerIndex.ENEMY_2);

      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2]);
      // PLAYER_2 should act with a combined move immediately after PLAYER as the second move in the turn
      for (let i = 0; i < 2; i++) {
        await game.phaseInterceptor.to("MoveEndPhase");
      }
      expect(enemyPokemon[0].hp).toBe(enemyPokemon[0].getMaxHp());
      expect(enemyPokemon[1].hp).toBeLessThan(enemyPokemon[1].getMaxHp());
    }
  );

  it(
    "Pledge Moves - 'rainbow' effect should not stack with Serene Grace when applied to flinching moves",
    async () => {
      game.override
        .ability(Abilities.SERENE_GRACE)
        .moveset([Moves.FIRE_PLEDGE, Moves.WATER_PLEDGE, Moves.IRON_HEAD, Moves.SPLASH]);

      await game.classicMode.startBattle([Species.BLASTOISE, Species.CHARIZARD]);

      const ironHeadFlinchAttr = allMoves[Moves.IRON_HEAD].getAttrs(FlinchAttr)[0];
      vi.spyOn(ironHeadFlinchAttr, "getMoveChance");

      game.move.select(Moves.WATER_PLEDGE, 0, BattlerIndex.ENEMY);
      game.move.select(Moves.FIRE_PLEDGE, 1, BattlerIndex.ENEMY_2);

      await game.phaseInterceptor.to("TurnEndPhase");

      expect(game.scene.arena.getTagOnSide(ArenaTagType.WATER_FIRE_PLEDGE, ArenaTagSide.PLAYER)).toBeDefined();

      game.move.select(Moves.IRON_HEAD, 0, BattlerIndex.ENEMY);
      game.move.select(Moves.SPLASH, 1);

      await game.phaseInterceptor.to("BerryPhase", false);

      expect(ironHeadFlinchAttr.getMoveChance).toHaveLastReturnedWith(60);
    }
  );
});
