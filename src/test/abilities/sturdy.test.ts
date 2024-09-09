import { EnemyPokemon } from "#app/field/pokemon";
import { DamagePhase } from "#app/phases/damage-phase";
import { MoveEndPhase } from "#app/phases/move-end-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";

const TIMEOUT = 20 * 1000;

describe("Abilities - Sturdy", () => {
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

    game.override.starterSpecies(Species.LUCARIO);
    game.override.startingLevel(100);
    game.override.moveset([Moves.CLOSE_COMBAT, Moves.FISSURE]);

    game.override.enemySpecies(Species.ARON);
    game.override.enemyLevel(5);
    game.override.enemyAbility(Abilities.STURDY);
  });

  test(
    "Sturdy activates when user is at full HP",
    async () => {
      await game.startBattle();
      game.move.select(Moves.CLOSE_COMBAT);
      await game.phaseInterceptor.to(MoveEndPhase);
      expect(game.scene.getEnemyParty()[0].hp).toBe(1);
    },
    TIMEOUT
  );

  test(
    "Sturdy doesn't activate when user is not at full HP",
    async () => {
      await game.startBattle();

      const enemyPokemon: EnemyPokemon = game.scene.getEnemyParty()[0];
      enemyPokemon.hp = enemyPokemon.getMaxHp() - 1;

      game.move.select(Moves.CLOSE_COMBAT);
      await game.phaseInterceptor.to(DamagePhase);

      expect(enemyPokemon.hp).toBe(0);
      expect(enemyPokemon.isFainted()).toBe(true);
    },
    TIMEOUT
  );

  test(
    "Sturdy pokemon should be immune to OHKO moves",
    async () => {
      await game.startBattle();
      game.move.select(Moves.FISSURE);
      await game.phaseInterceptor.to(MoveEndPhase);

      const enemyPokemon: EnemyPokemon = game.scene.getEnemyParty()[0];
      expect(enemyPokemon.isFullHp()).toBe(true);
    },
    TIMEOUT
  );

  test(
    "Sturdy is ignored by pokemon with `Abilities.MOLD_BREAKER`",
    async () => {
      game.override.ability(Abilities.MOLD_BREAKER);

      await game.startBattle();
      game.move.select(Moves.CLOSE_COMBAT);
      await game.phaseInterceptor.to(DamagePhase);

      const enemyPokemon: EnemyPokemon = game.scene.getEnemyParty()[0];
      expect(enemyPokemon.hp).toBe(0);
      expect(enemyPokemon.isFainted()).toBe(true);
    },
    TIMEOUT
  );

});
