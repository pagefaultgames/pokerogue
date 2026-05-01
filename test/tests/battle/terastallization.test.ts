import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import type { Pokemon } from "#field/pokemon";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Terastallization", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  let player: Pokemon;
  let enemy: Pokemon;

  beforeAll(async () => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
    game = new GameManager(phaserGame);
    game.override
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .enemyLevel(100);

    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    player = game.field.getPlayerPokemon();
    enemy = game.field.getEnemyPokemon();
  });

  it("should boost the STAB multiplier to 2x if the Tera type matches one of the Pokemon's base types", () => {
    game.field.forceTera(player, PokemonType.WATER);

    expect(enemy.calculateStabMultiplier(player, allMoves[MoveId.WATER_GUN], true, true)).toBe(2);
  });

  it("should boost the STAB multiplier to 1.5x if the Tera type does not match one of the Pokemon's base types", () => {
    game.field.forceTera(player, PokemonType.FIRE);

    expect(enemy.calculateStabMultiplier(player, allMoves[MoveId.EMBER], true, true)).toBe(1.5);
  });

  describe("Stellar", () => {
    beforeEach(() => {
      game.field.forceTera(player, PokemonType.STELLAR);
    });

    it("should boost the STAB multiplier to 2x for moves matching the base types of the Pokemon", () => {
      expect(enemy.calculateStabMultiplier(player, allMoves[MoveId.WATER_GUN], true, true)).toBe(2);
    });

    it("should boost the STAB multiplier to 1.2x for moves not matching the base types of the Pokemon", () => {
      expect(enemy.calculateStabMultiplier(player, allMoves[MoveId.EMBER], true, true)).toBe(1.2);
    });

    it("should only boost the first used move of each type", () => {
      vi.spyOn(player, "stellarTypesBoosted", "get").mockReturnValue([PokemonType.FIRE, PokemonType.WATER]);

      expect(enemy.calculateStabMultiplier(player, allMoves[MoveId.EMBER], true, true)).toBe(1);
      expect(enemy.calculateStabMultiplier(player, allMoves[MoveId.WATER_GUN], true, true)).toBe(1.5);
    });
  });
});
