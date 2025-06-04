import { Stat } from "#enums/stat";
import GameManager from "#test/testUtils/gameManager";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { TurnInitPhase } from "#app/phases/turn-init-phase";

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

      game.override.battleStyle("single");

      game.override.enemySpecies(SpeciesId.RATTATA);
      game.override.enemyLevel(100);
      game.override.enemyMoveset(MoveId.SPLASH);
      game.override.enemyAbility(AbilityId.NONE);

      game.override.startingLevel(100);
      game.override.moveset([MoveId.HAZE, MoveId.SWORDS_DANCE, MoveId.CHARM, MoveId.SPLASH]);
      game.override.ability(AbilityId.NONE);
    });

    it("should reset all stat changes of all Pokemon on field", async () => {
      await game.classicMode.startBattle([SpeciesId.RATTATA]);
      const user = game.scene.getPlayerPokemon()!;
      const enemy = game.scene.getEnemyPokemon()!;

      expect(user.getStatStage(Stat.ATK)).toBe(0);
      expect(enemy.getStatStage(Stat.ATK)).toBe(0);

      game.move.select(MoveId.SWORDS_DANCE);
      await game.phaseInterceptor.to(TurnInitPhase);

      game.move.select(MoveId.CHARM);
      await game.phaseInterceptor.to(TurnInitPhase);

      expect(user.getStatStage(Stat.ATK)).toBe(2);
      expect(enemy.getStatStage(Stat.ATK)).toBe(-2);

      game.move.select(MoveId.HAZE);
      await game.phaseInterceptor.to(TurnInitPhase);

      expect(user.getStatStage(Stat.ATK)).toBe(0);
      expect(enemy.getStatStage(Stat.ATK)).toBe(0);
    });
  });
});
