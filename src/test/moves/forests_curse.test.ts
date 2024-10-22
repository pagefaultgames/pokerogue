import { BattlerIndex } from "#app/battle";
import { Type } from "#app/data/type";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";


describe("Moves - Forest's Curse", () => {
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
    game.override.enemySpecies(Species.RELICANTH);
    game.override.startingLevel(5);
    game.override.enemyLevel(100);
    game.override.enemyMoveset(Moves.FORESTS_CURSE);
    game.override.moveset([ Moves.SPLASH, Moves.BURN_UP, Moves.DOUBLE_SHOCK ]);
  });
  test(
    "a mono type afflicted with forest's curse should be its type + grass (2 types)",
    async () => {
      await game.classicMode.startBattle([ Species.RATTATA ]);
      const playerPokemon = game.scene.getPlayerPokemon()!;
      game.move.select(Moves.SPLASH);
      await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
      await game.phaseInterceptor.to(TurnEndPhase);

      // Should be normal/grass
      const playerPokemonTypes = playerPokemon.getTypes();
      expect(playerPokemonTypes.filter(type => type === Type.NORMAL)).toHaveLength(1);
      expect(playerPokemonTypes.filter(type => type === Type.GRASS)).toHaveLength(1);
      expect(playerPokemonTypes.length === 2).toBeTruthy();
    }
  );

  test(
    "a dual type afflicted with forest's curse should be its dual type + grass (3 types)",
    async () => {
      await game.classicMode.startBattle([ Species.MOLTRES ]);
      const playerPokemon = game.scene.getPlayerPokemon()!;
      game.move.select(Moves.SPLASH);
      await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
      await game.phaseInterceptor.to(TurnEndPhase);

      // Should be flying/fire/grass
      const playerPokemonTypes = playerPokemon.getTypes();
      expect(playerPokemonTypes.filter(type => type === Type.FLYING)).toHaveLength(1);
      expect(playerPokemonTypes.filter(type => type === Type.FIRE)).toHaveLength(1);
      expect(playerPokemonTypes.filter(type => type === Type.GRASS)).toHaveLength(1);
      expect(playerPokemonTypes.length === 3).toBeTruthy();

    }
  );

  test(
    "A fire/flying type that uses burn up, then has forest's curse applied should be flying/grass",
    async () => {
      await game.classicMode.startBattle([ Species.MOLTRES ]);
      const playerPokemon = game.scene.getPlayerPokemon()!;
      game.move.select(Moves.BURN_UP);
      await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
      await game.phaseInterceptor.to(TurnEndPhase);

      // Should be flying/grass
      const playerPokemonTypes = playerPokemon.getTypes();
      expect(playerPokemonTypes.filter(type => type === Type.FLYING)).toHaveLength(1);
      expect(playerPokemonTypes.filter(type => type === Type.FIRE)).toHaveLength(0);
      expect(playerPokemonTypes.filter(type => type === Type.GRASS)).toHaveLength(1);
      expect(playerPokemonTypes.length === 2).toBeTruthy();
    }
  );
});
