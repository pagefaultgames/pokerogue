import { PokemonMove } from "#app/field/pokemon.js";
import GameManager from "#app/test/utils/gameManager";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as overrides from "../../overrides";

describe("Test Pokemon methods", () => {
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
  });

  describe("getAttackMoveEffectiveness", () => {
    it("checks for abilities like Pixilate that change type effectiveness of attacking mon", async() => {
      vi.spyOn(overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(Species.DUSKULL);
      vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.PIXILATE);
      vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.SABLEYE);
      vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(5);
      vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(3);
      vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([
        Moves.TACKLE,
        Moves.GROWL,
        Moves.SCRATCH,
        Moves.ASTONISH,
      ]
      );
      vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
      await game.startBattle();
      const playerPokemon = game.gameWrapper.scene.getPlayerPokemon();
      const tackle = new PokemonMove(Moves.TACKLE);
      const enemyPokemon = game.gameWrapper.scene.getEnemyPokemon();
      console.log(playerPokemon.getAbility());
      const typeEffectiveness = enemyPokemon.getAttackMoveEffectiveness(playerPokemon, tackle, false);
      expect(typeEffectiveness.valueOf()).toEqual(2);
    }, 20000);
  });
});

