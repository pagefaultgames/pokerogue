import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";
import GameManager from "../utils/gameManager";
import { Species } from "#enums/species";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { BattlerIndex } from "#app/battle";
import { StatusEffect } from "#app/enums/status-effect";

const TIMEOUT = 20 * 1000;

describe("Moves - Baneful Bunker", () => {
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

    game.override.moveset(Moves.SLASH);

    game.override.enemySpecies(Species.SNORLAX);
    game.override.enemyAbility(Abilities.INSOMNIA);
    game.override.enemyMoveset(Moves.BANEFUL_BUNKER);

    game.override.startingLevel(100);
    game.override.enemyLevel(100);
  });
  test(
    "Baneful Bunker test",
    async () => {
      await game.classicMode.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.SLASH);
      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
      await game.phaseInterceptor.to("MoveEffectPhase");
      await game.phaseInterceptor.to("TurnEndPhase");
      expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
      expect(leadPokemon.status?.effect  === StatusEffect.POISON).toBeTruthy();
    }, TIMEOUT
  );
  test(
    "Baneful Bunker miss test",
    async () => {
      await game.classicMode.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.SLASH);
      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
      await game.phaseInterceptor.to("MoveEffectPhase");

      await game.move.forceMiss();
      await game.phaseInterceptor.to("TurnEndPhase");
      expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
      expect(leadPokemon.status?.effect  === StatusEffect.POISON).toBeTruthy();
    }, TIMEOUT
  );
});
