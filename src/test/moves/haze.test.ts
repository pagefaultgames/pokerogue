import { BattleStat } from "#app/data/battle-stat";
import { MoveEndPhase } from "#app/phases/move-end-phase";
import { TurnInitPhase } from "#app/phases/turn-init-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
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

      game.override.battleType("single");

      game.override.enemySpecies(Species.RATTATA);
      game.override.enemyLevel(100);
      game.override.enemyMoveset(SPLASH_ONLY);
      game.override.enemyAbility(Abilities.NONE);

      game.override.startingLevel(100);
      game.override.moveset([Moves.HAZE, Moves.SWORDS_DANCE, Moves.CHARM, Moves.SPLASH]);
      game.override.ability(Abilities.NONE);
    });

    it("Uses Swords Dance to raise own ATK by 2, Charm to lower enemy ATK by 2, player uses Haze to clear all stat changes", { timeout: 10000 }, async () => {
      await game.startBattle([Species.RATTATA]);
      const user = game.scene.getPlayerPokemon()!;
      const enemy = game.scene.getEnemyPokemon()!;
      expect(user.summonData.battleStats[BattleStat.ATK]).toBe(0);
      expect(enemy.summonData.battleStats[BattleStat.ATK]).toBe(0);

      game.move.select(Moves.SWORDS_DANCE);
      await game.phaseInterceptor.to(TurnInitPhase);

      game.move.select(Moves.CHARM);
      await game.phaseInterceptor.to(TurnInitPhase);
      const userAtkBefore = user.summonData.battleStats[BattleStat.ATK];
      const enemyAtkBefore = enemy.summonData.battleStats[BattleStat.ATK];
      expect(userAtkBefore).toBe(2);
      expect(enemyAtkBefore).toBe(-2);

      game.move.select(Moves.HAZE);
      await game.phaseInterceptor.to(TurnInitPhase);
      expect(user.summonData.battleStats[BattleStat.ATK]).toBe(0);
      expect(enemy.summonData.battleStats[BattleStat.ATK]).toBe(0);
    });

    it("Uses Swords Dance to raise own ATK by 2, Charm to lower enemy ATK by 2, enemy uses Haze to clear all stat changes", { timeout: 10000 }, async () => {
      game.override.enemyMoveset([Moves.HAZE, Moves.HAZE, Moves.HAZE, Moves.HAZE]);
      await game.startBattle([Species.SHUCKLE]); // Shuckle for slower Swords Dance on first turn so Haze doesn't affect it.
      const user = game.scene.getPlayerPokemon()!;
      expect(user.summonData.battleStats[BattleStat.ATK]).toBe(0);

      game.move.select(Moves.SWORDS_DANCE);
      await game.phaseInterceptor.to(TurnInitPhase);

      const userAtkBefore = user.summonData.battleStats[BattleStat.ATK];
      expect(userAtkBefore).toBe(2);

      game.move.select(Moves.SPLASH);
      await game.phaseInterceptor.to(MoveEndPhase);
      expect(user.summonData.battleStats[BattleStat.ATK]).toBe(0);
    });
  });
});
