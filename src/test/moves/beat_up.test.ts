import { Abilities } from "#app/enums/abilities";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import { StatusEffect } from "#app/enums/status-effect";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

const TIMEOUT = 20 * 1000; // 20 sec timeout

describe("Moves - Beat Up", () => {
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

    game.override.enemySpecies(Species.SNORLAX);
    game.override.enemyLevel(100);
    game.override.enemyMoveset(Array(4).fill(Moves.SPLASH));
    game.override.enemyAbility(Abilities.INSOMNIA);

    game.override.startingLevel(100);
    game.override.moveset([Moves.BEAT_UP]);
  });

  it(
    "should hit once for each healthy player Pokemon",
    async () => {
      await game.startBattle([Species.MAGIKARP, Species.BULBASAUR, Species.CHARMANDER, Species.SQUIRTLE, Species.PIKACHU, Species.EEVEE]);

      const playerPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;
      let enemyStartingHp = enemyPokemon.hp;

      game.move.select(Moves.BEAT_UP);

      await game.phaseInterceptor.to(MoveEffectPhase);

      expect(playerPokemon.turnData.hitCount).toBe(6);
      expect(enemyPokemon.hp).toBeLessThan(enemyStartingHp);

      while (playerPokemon.turnData.hitsLeft > 0) {
        enemyStartingHp = enemyPokemon.hp;
        await game.phaseInterceptor.to(MoveEffectPhase);
        expect(enemyPokemon.hp).toBeLessThan(enemyStartingHp);
      }
    }, TIMEOUT
  );

  it(
    "should not count player Pokemon with status effects towards hit count",
    async () => {
      await game.startBattle([Species.MAGIKARP, Species.BULBASAUR, Species.CHARMANDER, Species.SQUIRTLE, Species.PIKACHU, Species.EEVEE]);

      const playerPokemon = game.scene.getPlayerPokemon()!;

      game.scene.getParty()[1].trySetStatus(StatusEffect.BURN);

      game.move.select(Moves.BEAT_UP);

      await game.phaseInterceptor.to(MoveEffectPhase);

      expect(playerPokemon.turnData.hitCount).toBe(5);
    }, TIMEOUT
  );

  it(
    "should hit twice for each player Pokemon if the user has Multi-Lens",
    async () => {
      game.override.startingHeldItems([{ name: "MULTI_LENS", count: 1 }]);
      await game.startBattle([Species.MAGIKARP, Species.BULBASAUR, Species.CHARMANDER, Species.SQUIRTLE, Species.PIKACHU, Species.EEVEE]);

      const playerPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;
      let enemyStartingHp = enemyPokemon.hp;

      game.move.select(Moves.BEAT_UP);

      await game.phaseInterceptor.to(MoveEffectPhase);

      expect(playerPokemon.turnData.hitCount).toBe(12);
      expect(enemyPokemon.hp).toBeLessThan(enemyStartingHp);

      while (playerPokemon.turnData.hitsLeft > 0) {
        enemyStartingHp = enemyPokemon.hp;
        await game.phaseInterceptor.to(MoveEffectPhase);
        expect(enemyPokemon.hp).toBeLessThan(enemyStartingHp);
      }
    }, TIMEOUT
  );
});
