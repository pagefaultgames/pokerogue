import { BattlerIndex } from "#app/battle";
import { Type } from "#app/data/type";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it, expect, vi } from "vitest";

describe("Moves - Plasma Fists", () => {
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
      .moveset([Moves.PLASMA_FISTS, Moves.TACKLE])
      .battleType("double")
      .startingLevel(100)
      .enemySpecies(Species.DUSCLOPS)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.TACKLE)
      .enemyLevel(100);
  });

  it("should convert all subsequent Normal-type attacks to Electric-type", async () => {
    await game.classicMode.startBattle([Species.DUSCLOPS, Species.BLASTOISE]);

    const field = game.scene.getField(true);
    field.forEach(p => vi.spyOn(p, "getMoveType"));

    game.move.select(Moves.PLASMA_FISTS, 0, BattlerIndex.ENEMY);
    game.move.select(Moves.TACKLE, 1, BattlerIndex.ENEMY_2);

    await game.forceEnemyMove(Moves.TACKLE, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.TACKLE, BattlerIndex.PLAYER_2);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to("BerryPhase", false);

    field.forEach(p => {
      expect(p.getMoveType).toHaveLastReturnedWith(Type.ELECTRIC);
      expect(p.hp).toBeLessThan(p.getMaxHp());
    });
  });

  it("should not affect Normal-type attacks boosted by Pixilate", async () => {
    game.override
      .battleType("single")
      .enemyAbility(Abilities.PIXILATE);

    await game.classicMode.startBattle([Species.ONIX]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;
    vi.spyOn(enemyPokemon, "getMoveType");

    game.move.select(Moves.PLASMA_FISTS);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(enemyPokemon.getMoveType).toHaveLastReturnedWith(Type.FAIRY);
    expect(playerPokemon.hp).toBeLessThan(playerPokemon.getMaxHp());
  });

  it("should affect moves that become Normal type due to Normalize", async () => {
    game.override
      .battleType("single")
      .enemyAbility(Abilities.NORMALIZE)
      .enemyMoveset(Moves.WATER_GUN);

    await game.classicMode.startBattle([Species.DUSCLOPS]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;
    vi.spyOn(enemyPokemon, "getMoveType");

    game.move.select(Moves.PLASMA_FISTS);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(enemyPokemon.getMoveType).toHaveLastReturnedWith(Type.ELECTRIC);
    expect(playerPokemon.hp).toBeLessThan(playerPokemon.getMaxHp());
  });
});
