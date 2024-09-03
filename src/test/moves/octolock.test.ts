import { BattleStat } from "#app/data/battle-stat";
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

    it("Reduces DEf and SPDEF by 1 each turn", { timeout: 10000 }, async () => {
      await game.startBattle([Species.GRAPPLOCT]);

      const enemyPokemon = game.scene.getEnemyField();

      // use Octolock and advance to init phase of next turn to check for stat changes
      game.move.select(Moves.OCTOLOCK);
      await game.phaseInterceptor.to(TurnInitPhase);

      expect(enemyPokemon[0].summonData.battleStats[BattleStat.DEF]).toBe(-1);
      expect(enemyPokemon[0].summonData.battleStats[BattleStat.SPDEF]).toBe(-1);

      // take a second turn to make sure stat changes occur again
      await game.phaseInterceptor.to(CommandPhase);
      game.move.select(Moves.SPLASH);

      await game.phaseInterceptor.to(TurnInitPhase);
      expect(enemyPokemon[0].summonData.battleStats[BattleStat.DEF]).toBe(-2);
      expect(enemyPokemon[0].summonData.battleStats[BattleStat.SPDEF]).toBe(-2);
    });

    it("If target pokemon has Big Pecks, Octolock should only reduce spdef by 1", { timeout: 10000 }, async () => {
      game.override.enemyAbility(Abilities.BIG_PECKS);
      await game.startBattle([Species.GRAPPLOCT]);

      const enemyPokemon = game.scene.getEnemyField();

      // use Octolock and advance to init phase of next turn to check for stat changes
      game.move.select(Moves.OCTOLOCK);
      await game.phaseInterceptor.to(TurnInitPhase);

      expect(enemyPokemon[0].summonData.battleStats[BattleStat.DEF]).toBe(0);
      expect(enemyPokemon[0].summonData.battleStats[BattleStat.SPDEF]).toBe(-1);
    });

    it("If target pokemon has White Smoke, Octolock should not reduce any stats", { timeout: 10000 }, async () => {
      game.override.enemyAbility(Abilities.WHITE_SMOKE);
      await game.startBattle([Species.GRAPPLOCT]);

      const enemyPokemon = game.scene.getEnemyField();

      // use Octolock and advance to init phase of next turn to check for stat changes
      game.move.select(Moves.OCTOLOCK);
      await game.phaseInterceptor.to(TurnInitPhase);

      expect(enemyPokemon[0].summonData.battleStats[BattleStat.DEF]).toBe(0);
      expect(enemyPokemon[0].summonData.battleStats[BattleStat.SPDEF]).toBe(0);
    });

    it("If target pokemon has Clear Body, Octolock should not reduce any stats", { timeout: 10000 }, async () => {
      game.override.enemyAbility(Abilities.CLEAR_BODY);
      await game.startBattle([Species.GRAPPLOCT]);

      const enemyPokemon = game.scene.getEnemyField();

      // use Octolock and advance to init phase of next turn to check for stat changes
      game.move.select(Moves.OCTOLOCK);
      await game.phaseInterceptor.to(TurnInitPhase);

      expect(enemyPokemon[0].summonData.battleStats[BattleStat.DEF]).toBe(0);
      expect(enemyPokemon[0].summonData.battleStats[BattleStat.SPDEF]).toBe(0);
    });

    it("Traps the target pokemon", { timeout: 10000 }, async () => {
      await game.startBattle([Species.GRAPPLOCT]);

      const enemyPokemon = game.scene.getEnemyField();

      // before Octolock - enemy should not be trapped
      expect(enemyPokemon[0].findTag(t => t instanceof TrappedTag)).toBeUndefined();

      game.move.select(Moves.OCTOLOCK);

      // after Octolock - enemy should be trapped
      await game.phaseInterceptor.to(MoveEndPhase);
      expect(enemyPokemon[0].findTag(t => t instanceof TrappedTag)).toBeDefined();
    });
  });
});
