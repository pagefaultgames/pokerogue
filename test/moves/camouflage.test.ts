import { TerrainType } from "#data/terrain";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
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
      .moveset([MoveId.CAMOUFLAGE])
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.REGIELEKI)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.PSYCHIC_TERRAIN);
  });

  it("Camouflage should look at terrain first when selecting a type to change into", async () => {
    await game.classicMode.startBattle([SpeciesId.SHUCKLE]);

    const playerPokemon = game.field.getPlayerPokemon();

    game.move.select(MoveId.CAMOUFLAGE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.arena.getTerrainType()).toBe(TerrainType.PSYCHIC);
    const pokemonType = playerPokemon.getTypes()[0];
    expect(pokemonType).toBe(PokemonType.PSYCHIC);
  });
});
