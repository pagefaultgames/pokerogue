import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { TerrainType } from "#app/data/terrain";
import { Type } from "#app/data/type";
import { BattlerIndex } from "#app/battle";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Camouflage", () => {
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
      .moveset([ Moves.CAMOUFLAGE ])
      .ability(Abilities.BALL_FETCH)
      .battleType("single")
      .disableCrits()
      .enemySpecies(Species.REGIELEKI)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.PSYCHIC_TERRAIN);
  });

  it("Camouflage should look at terrain first when selecting a type to change into", async () => {
    await game.classicMode.startBattle([ Species.SHUCKLE ]);

    const playerPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.CAMOUFLAGE);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.arena.getTerrainType()).toBe(TerrainType.PSYCHIC);
    const pokemonType = playerPokemon.getTypes()[0];
    expect(pokemonType).toBe(Type.PSYCHIC);
  });
});
