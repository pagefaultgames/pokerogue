import { allMoves } from "#app/data/move";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Abilities } from "#enums/abilities";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Stat } from "#enums/stat";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { BattlerIndex } from "#app/battle";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - SYRUP BOMB", () => {
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
      .starterSpecies(Species.MAGIKARP)
      .enemySpecies(Species.SNORLAX)
      .startingLevel(30)
      .enemyLevel(100)
      .moveset([ Moves.SYRUP_BOMB, Moves.SPLASH ])
      .enemyMoveset(Moves.SPLASH);
    vi.spyOn(allMoves[Moves.SYRUP_BOMB], "accuracy", "get").mockReturnValue(100);
  });

  //Bulbapedia Reference: https://bulbapedia.bulbagarden.net/wiki/syrup_bomb_(move)

  it("decreases the target Pokemon's speed stat once per turn for 3 turns",
    async () => {
      await game.startBattle([ Species.MAGIKARP ]);

      const targetPokemon = game.scene.getEnemyPokemon()!;
      expect(targetPokemon.getStatStage(Stat.SPD)).toBe(0);

      game.move.select(Moves.SYRUP_BOMB);
      await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
      await game.move.forceHit();
      await game.toNextTurn();
      expect(targetPokemon.getTag(BattlerTagType.SYRUP_BOMB)).toBeDefined();
      expect(targetPokemon.getStatStage(Stat.SPD)).toBe(-1);

      game.move.select(Moves.SPLASH);
      await game.toNextTurn();
      expect(targetPokemon.getTag(BattlerTagType.SYRUP_BOMB)).toBeDefined();
      expect(targetPokemon.getStatStage(Stat.SPD)).toBe(-2);

      game.move.select(Moves.SPLASH);
      await game.toNextTurn();
      expect(targetPokemon.getTag(BattlerTagType.SYRUP_BOMB)).toBeUndefined();
      expect(targetPokemon.getStatStage(Stat.SPD)).toBe(-3);
    }
  );

  it("does not affect Pokemon with the ability Bulletproof",
    async () => {
      game.override.enemyAbility(Abilities.BULLETPROOF);
      await game.startBattle([ Species.MAGIKARP ]);

      const targetPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.SYRUP_BOMB);
      await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
      await game.move.forceHit();
      await game.toNextTurn();
      expect(targetPokemon.isFullHp()).toBe(true);
      expect(targetPokemon.getTag(BattlerTagType.SYRUP_BOMB)).toBeUndefined();
      expect(targetPokemon.getStatStage(Stat.SPD)).toBe(0);
    }
  );
});
