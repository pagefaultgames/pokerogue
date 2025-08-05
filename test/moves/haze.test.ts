import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { TurnInitPhase } from "#phases/turn-init-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

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

      game.override
        .battleStyle("single")
        .enemySpecies(SpeciesId.RATTATA)
        .enemyLevel(100)
        .enemyMoveset(MoveId.SPLASH)
        .enemyAbility(AbilityId.BALL_FETCH)
        .startingLevel(100)
        .moveset([MoveId.HAZE, MoveId.SWORDS_DANCE, MoveId.CHARM, MoveId.SPLASH])
        .ability(AbilityId.BALL_FETCH);
    });

    it("should reset all stat changes of all Pokemon on field", async () => {
      await game.classicMode.startBattle([SpeciesId.RATTATA]);
      const user = game.field.getPlayerPokemon();
      const enemy = game.field.getEnemyPokemon();

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
