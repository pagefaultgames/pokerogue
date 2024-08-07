import { BattleStat } from "#app/data/battle-stat";
import { TrappedTag } from "#app/data/battler-tags.js";
import { CommandPhase, MoveEndPhase, TurnInitPhase } from "#app/phases";
import GameManager from "#test/utils/gameManager";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SPLASH_ONLY } from "#test/utils/testUtils";

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
      game.doAttack(getMovePosition(game.scene, 0, Moves.OCTOLOCK));
      await game.phaseInterceptor.to(TurnInitPhase);

      expect(enemyPokemon[0].summonData.battleStats[BattleStat.DEF]).toBe(-1);
      expect(enemyPokemon[0].summonData.battleStats[BattleStat.SPDEF]).toBe(-1);

      // take a second turn to make sure stat changes occur again
      await game.phaseInterceptor.to(CommandPhase);
      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));

      await game.phaseInterceptor.to(TurnInitPhase);
      expect(enemyPokemon[0].summonData.battleStats[BattleStat.DEF]).toBe(-2);
      expect(enemyPokemon[0].summonData.battleStats[BattleStat.SPDEF]).toBe(-2);
    });

    it("Traps the target pokemon", { timeout: 10000 }, async () => {
      await game.startBattle([Species.GRAPPLOCT]);

      const enemyPokemon = game.scene.getEnemyField();

      // before Octolock - enemy should not be trapped
      expect(enemyPokemon[0].findTag(t => t instanceof TrappedTag)).toBeUndefined();

      game.doAttack(getMovePosition(game.scene, 0, Moves.OCTOLOCK));

      // after Octolock - enemy should be trapped
      await game.phaseInterceptor.to(MoveEndPhase);
      expect(enemyPokemon[0].findTag(t => t instanceof TrappedTag)).toBeDefined();
    });
  });
});
