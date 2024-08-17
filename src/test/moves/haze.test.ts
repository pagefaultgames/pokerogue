import { Stat } from "#enums/stat";
import { TurnInitPhase } from "#app/phases";
import GameManager from "#test/utils/gameManager";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SPLASH_ONLY } from "#test/utils/testUtils";

describe("Moves - Haze", () => {
  describe("integration tests", () => {
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

      game.override.battleType("single");

      game.override.enemySpecies(Species.RATTATA);
      game.override.enemyLevel(100);
      game.override.enemyMoveset(SPLASH_ONLY);
      game.override.enemyAbility(Abilities.NONE);

      game.override.startingLevel(100);
      game.override.moveset([Moves.HAZE, Moves.SWORDS_DANCE, Moves.CHARM, Moves.SPLASH]);
      game.override.ability(Abilities.NONE);
    });

    it("should reset all stat changes of all Pokemon on field", { timeout: 10000 }, async () => {
      await game.startBattle([Species.RATTATA]);
      const user = game.scene.getPlayerPokemon()!;
      const enemy = game.scene.getEnemyPokemon()!;

      expect(user.getStatStage(Stat.ATK)).toBe(0);
      expect(enemy.getStatStage(Stat.ATK)).toBe(0);

      game.doAttack(getMovePosition(game.scene, 0, Moves.SWORDS_DANCE));
      await game.phaseInterceptor.to(TurnInitPhase);

      game.doAttack(getMovePosition(game.scene, 0, Moves.CHARM));
      await game.phaseInterceptor.to(TurnInitPhase);

      expect(user.getStatStage(Stat.ATK)).toBe(2);
      expect(enemy.getStatStage(Stat.ATK)).toBe(-2);

      game.doAttack(getMovePosition(game.scene, 0, Moves.HAZE));
      await game.phaseInterceptor.to(TurnInitPhase);

      expect(user.getStatStage(Stat.ATK)).toBe(0);
      expect(enemy.getStatStage(Stat.ATK)).toBe(0);
    });
  });
});
