import { allMoves } from "#app/data/data-lists";
import { TerrainType } from "#app/data/terrain";
import { getPokemonNameWithAffix } from "#app/messages";
import { getEnumValues, toReadableString } from "#app/utils/common";
import { AbilityId } from "#enums/ability-id";
import { BiomeId } from "#enums/biome-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Move - Nature Power", () => {
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
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.NO_GUARD)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  const getNaturePowerType = allMoves[MoveId.NATURE_POWER].getAttrs("NaturePowerAttr")[0]["getMoveIdForTerrain"];

  it.each(
    getEnumValues(BiomeId).map(biome => ({
      move: getNaturePowerType(TerrainType.NONE, biome),
      moveName: toReadableString(MoveId[getNaturePowerType(TerrainType.NONE, biome)]),
      biome,
      biomeName: BiomeId[biome],
    })),
  )("should select $moveName if the current biome is $biomeName", async ({ move, biome }) => {
    game.override.startingBiome(biome);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.NATURE_POWER);
    await game.toEndOfTurn();

    const player = game.field.getPlayerPokemon();
    expect(player.getLastXMoves(-1).map(m => m.move)).toEqual([move, MoveId.NATURE_POWER]);
    expect(game.textInterceptor.logs).toContain(
      i18next.t("moveTriggers:naturePowerUse", {
        pokemonName: getPokemonNameWithAffix(player),
        moveName: allMoves[move].name,
      }),
    );
  });

  // TODO: Add after terrain override is added
  it.todo.each(
    getEnumValues(TerrainType).map(terrain => ({
      move: getNaturePowerType(terrain, BiomeId.TOWN),
      moveName: toReadableString(MoveId[getNaturePowerType(terrain, BiomeId.TOWN)]),
      terrain: terrain,
      terrainName: TerrainType[terrain],
    })),
  )("should select $moveName if the current terrain is $terrainName", async ({ move /* terrain */ }) => {
    //  game.override.terrain(terrainType);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.NATURE_POWER);
    await game.toEndOfTurn();

    const player = game.field.getPlayerPokemon();
    expect(player.getLastXMoves(-1).map(m => m.move)).toEqual([move, MoveId.NATURE_POWER]);
  });
});
