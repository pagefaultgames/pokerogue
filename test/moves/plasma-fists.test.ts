import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
      .moveset([MoveId.PLASMA_FISTS, MoveId.TACKLE])
      .battleStyle("double")
      .startingLevel(100)
      .enemySpecies(SpeciesId.DUSCLOPS)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.TACKLE)
      .enemyLevel(100);
  });

  it("should convert all subsequent Normal-type attacks to Electric-type", async () => {
    await game.classicMode.startBattle([SpeciesId.DUSCLOPS, SpeciesId.BLASTOISE]);

    const field = game.scene.getField(true);
    field.forEach(p => vi.spyOn(p, "getMoveType"));

    game.move.select(MoveId.PLASMA_FISTS, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.TACKLE, 1, BattlerIndex.ENEMY_2);

    await game.move.selectEnemyMove(MoveId.TACKLE, BattlerIndex.PLAYER);
    await game.move.selectEnemyMove(MoveId.TACKLE, BattlerIndex.PLAYER_2);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to("BerryPhase", false);

    field.forEach(p => {
      expect(p.getMoveType).toHaveLastReturnedWith(PokemonType.ELECTRIC);
      expect(p.hp).toBeLessThan(p.getMaxHp());
    });
  });

  it("should not affect Normal-type attacks boosted by Pixilate", async () => {
    game.override.battleStyle("single").enemyAbility(AbilityId.PIXILATE);

    await game.classicMode.startBattle([SpeciesId.ONIX]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();
    vi.spyOn(enemyPokemon, "getMoveType");

    game.move.select(MoveId.PLASMA_FISTS);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(enemyPokemon.getMoveType).toHaveLastReturnedWith(PokemonType.FAIRY);
    expect(playerPokemon.hp).toBeLessThan(playerPokemon.getMaxHp());
  });

  it("should affect moves that become Normal type due to Normalize", async () => {
    game.override.battleStyle("single").enemyAbility(AbilityId.NORMALIZE).enemyMoveset(MoveId.WATER_GUN);

    await game.classicMode.startBattle([SpeciesId.DUSCLOPS]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();
    vi.spyOn(enemyPokemon, "getMoveType");

    game.move.select(MoveId.PLASMA_FISTS);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(enemyPokemon.getMoveType).toHaveLastReturnedWith(PokemonType.ELECTRIC);
    expect(playerPokemon.hp).toBeLessThan(playerPokemon.getMaxHp());
  });
});
