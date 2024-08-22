import { Stat } from "#enums/stat";
import { TrappedTag } from "#app/data/battler-tags";
import { CommandPhase } from "#app/phases/command-phase";
import { MoveEndPhase } from "#app/phases/move-end-phase";
import { TurnInitPhase } from "#app/phases/turn-init-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Octolock", () => {
  describe("integration tests", () => {
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

      game.override.enemySpecies(Species.RATTATA);
      game.override.enemyMoveset(SPLASH_ONLY);
      game.override.enemyAbility(Abilities.BALL_FETCH);

      game.override.startingLevel(2000);
      game.override.moveset([Moves.OCTOLOCK, Moves.SPLASH]);
      game.override.ability(Abilities.BALL_FETCH);
    });

    it("lowers DEF and SPDEF stat stages of the target Pokemon by 1 each turn", { timeout: 10000 }, async () => {
      await game.startBattle([Species.GRAPPLOCT]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;

      // use Octolock and advance to init phase of next turn to check for stat changes
      game.move.select(Moves.OCTOLOCK);
      await game.phaseInterceptor.to(TurnInitPhase);

      expect(enemyPokemon.getStatStage(Stat.DEF)).toBe(-1);
      expect(enemyPokemon.getStatStage(Stat.SPDEF)).toBe(-1);

      // take a second turn to make sure stat changes occur again
      await game.phaseInterceptor.to(CommandPhase);
      game.move.select(Moves.SPLASH);

      await game.phaseInterceptor.to(TurnInitPhase);
      expect(enemyPokemon.getStatStage(Stat.DEF)).toBe(-2);
      expect(enemyPokemon.getStatStage(Stat.SPDEF)).toBe(-2);
    });

    it("traps the target Pokemon", { timeout: 10000 }, async () => {
      await game.startBattle([Species.GRAPPLOCT]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;

      // before Octolock - enemy should not be trapped
      expect(enemyPokemon.findTag(t => t instanceof TrappedTag)).toBeUndefined();

      game.move.select(Moves.OCTOLOCK);

      // after Octolock - enemy should be trapped
      await game.phaseInterceptor.to(MoveEndPhase);
      expect(enemyPokemon.findTag(t => t instanceof TrappedTag)).toBeDefined();
    });
  });
});
