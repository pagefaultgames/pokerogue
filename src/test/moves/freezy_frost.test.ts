import { Stat } from "#enums/stat";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { allMoves } from "#app/data/move";
import { CommandPhase } from "#app/phases/command-phase.js";

describe("Moves - Freezy Frost", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({ type: Phaser.HEADLESS });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);

    game.override
      .battleType("single")
      .enemySpecies(Species.RATTATA)
      .enemyLevel(100)
      .enemyMoveset([ Moves.HOWL, Moves.HOWL, Moves.HOWL, Moves.HOWL ])
      .enemyAbility(Abilities.BALL_FETCH)
      .startingLevel(100)
      .moveset([ Moves.FREEZY_FROST, Moves.HOWL, Moves.SPLASH ])
      .ability(Abilities.BALL_FETCH);

    vi.spyOn(allMoves[ Moves.FREEZY_FROST ], "accuracy", "get").mockReturnValue(100);
  });

  it(
    "should clear stat changes of user and opponent",
    async () => {
      await game.classicMode.startBattle([ Species.SHUCKLE ]);
      const user = game.scene.getPlayerPokemon()!;
      const enemy = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.HOWL);
      await game.toNextTurn();

      expect(user.getStatStage(Stat.ATK)).toBe(1);
      expect(enemy.getStatStage(Stat.ATK)).toBe(1);

      game.move.select(Moves.FREEZY_FROST);
      await game.toNextTurn();

      expect(user.getStatStage(Stat.ATK)).toBe(0);
      expect(enemy.getStatStage(Stat.ATK)).toBe(0);
    });

  it(
    "should clear all stat changes even when enemy uses the move",
    async () => {
      game.override.enemyMoveset([ Moves.FREEZY_FROST, Moves.FREEZY_FROST, Moves.FREEZY_FROST, Moves.FREEZY_FROST ]);
      await game.classicMode.startBattle([ Species.SHUCKLE ]); // Shuckle for slower Howl on first turn so Freezy Frost doesn't affect it.
      const user = game.scene.getPlayerPokemon()!;

      game.move.select(Moves.HOWL);
      await game.toNextTurn();

      const userAtkBefore = user.getStatStage(Stat.ATK);
      expect(userAtkBefore).toBe(1);

      game.move.select(Moves.SPLASH);
      await game.toNextTurn();
      expect(user.getStatStage(Stat.ATK)).toBe(0);
    });

  it(
    "should clear all stat changes in double battle",
    async () => {
      game.override.battleType("double");
      await game.classicMode.startBattle([ Species.SHUCKLE, Species.RATTATA ]);
      const [ leftPlayer, rightPlayer ] = game.scene.getPlayerField();
      const [ leftOpp, rightOpp ] = game.scene.getEnemyField();

      game.move.select(Moves.HOWL, 0);
      await game.phaseInterceptor.to(CommandPhase);
      game.move.select(Moves.SPLASH, 1);
      await game.toNextTurn();

      expect(leftPlayer.getStatStage(Stat.ATK)).toBe(1);
      expect(rightPlayer.getStatStage(Stat.ATK)).toBe(1);
      expect(leftOpp.getStatStage(Stat.ATK)).toBe(2); // Both enemies use Howl
      expect(rightOpp.getStatStage(Stat.ATK)).toBe(2);

      game.move.select(Moves.FREEZY_FROST, 0, leftOpp.getBattlerIndex());
      await game.phaseInterceptor.to(CommandPhase);
      game.move.select(Moves.SPLASH, 1);
      await game.toNextTurn();

      expect(leftPlayer.getStatStage(Stat.ATK)).toBe(0);
      expect(rightPlayer.getStatStage(Stat.ATK)).toBe(0);
      expect(leftOpp.getStatStage(Stat.ATK)).toBe(0);
      expect(rightOpp.getStatStage(Stat.ATK)).toBe(0);
    });
});
